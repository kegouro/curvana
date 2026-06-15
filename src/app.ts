// Orquestador de Curvana: conecta la UI y el render con el núcleo matemático.
// No contiene matemática propia; pide todo al core.
import type { AppState, Dim, InputMode, ParamExpr, Readout, VectorExpr } from './core/types';
import { defaultState, decodeState, encodeState } from './core/state';
import { curveFromExpr, type Curve } from './core/curve';
import { arcLength, curvature, frenetFrame } from './core/differential';
import {
  scalarFieldFromExpr,
  vectorFieldFromExpr,
  lineIntegralScalar,
  lineIntegralVector,
  type ScalarField,
  type VectorField,
} from './core/fields';
import { recognizeCartesian } from './core/cartesian';
import { getLibraryCurve } from './core/library';
import { ParseError, mathjs } from './core/parser';
import { Viewport } from './render/scene';
import { CurveView } from './render/curveMesh';
import { FrenetView } from './render/frame';
import { FieldView } from './render/fieldViz';
import { ControlPanel } from './ui/controlPanel';
import { ComponentPlots } from './ui/componentPlots';
import { TransportBar } from './ui/transportBar';
import { EquationView } from './ui/equationView';
import { TesseractProvider } from './services/ocr/TesseractProvider';

const SWEEP_MS = 8000; // tiempo para recorrer todo el rango a velocidad 1×

export class App {
  private state: AppState;
  private readonly viewport: Viewport;
  private readonly curveView = new CurveView();
  private readonly frenetView = new FrenetView();
  private readonly fieldView = new FieldView();
  private readonly control: ControlPanel;
  private readonly components: ComponentPlots;
  private readonly transport: TransportBar;
  private readonly equations: EquationView;
  private readonly ocr = new TesseractProvider();

  private curve!: Curve;
  private scalarField: ScalarField | null = null;
  private vectorField: VectorField | null = null;
  private playing = false;
  private lastTs = 0;

  constructor(root: HTMLElement) {
    root.innerHTML = SKELETON;
    this.state = decodeState(window.location.hash) ?? defaultState();

    this.viewport = new Viewport(root.querySelector('#viewport')!);
    this.viewport.scene.add(this.curveView.group, this.frenetView.group, this.fieldView.group);

    this.control = new ControlPanel(root.querySelector('#control')!, {
      onDim: (d) => this.setDim(d),
      onMode: (m) => this.setMode(m),
      onLibrary: (id) => this.loadLibrary(id),
      onCartesianSubmit: (input) => this.applyCartesian(input),
      onParametricSubmit: (e, a, b) => this.applyParametric(e, a, b),
      onToggle: (k, v) => this.setToggle(k, v),
      onScalarSubmit: (e) => this.applyScalar(e),
      onVectorSubmit: (v) => this.applyVector(v),
      onOcrFile: (f) => this.runOcr(f),
    });
    this.components = new ComponentPlots(root.querySelector('#components')!);
    this.transport = new TransportBar(root.querySelector('#transport')!, {
      onScrub: (t) => this.scrub(t),
      onPlayToggle: (p) => this.togglePlay(p),
      onSpeed: (s) => (this.state.speed = s),
    });
    this.equations = new EquationView(root.querySelector('#equations')!);

    root.querySelector('#share')!.addEventListener('click', () => this.share());
    root.querySelector('#png')!.addEventListener('click', () => this.savePng());

    this.rebuildFields();
    this.viewport.setDim(this.state.dim);
    this.rebuildCurve(true);
    this.refreshEquations();
    this.control.sync(this.state);
    requestAnimationFrame((ts) => this.loop(ts));
  }

  // ---- Cambios de entrada ----

  private setDim(dim: Dim): void {
    this.state.dim = dim;
    this.viewport.setDim(dim);
    this.components.setCurve(this.curve, dim);
    this.frameCamera();
    this.control.sync(this.state);
  }

  private setMode(mode: InputMode): void {
    this.state.mode = mode;
    this.control.sync(this.state);
  }

  private loadLibrary(id: string): void {
    const entry = getLibraryCurve(id);
    if (!entry) return;
    this.state.libraryId = id;
    this.state.expr = { ...entry.expr };
    this.state.tMin = entry.tMin;
    this.state.tMax = entry.tMax;
    this.state.dim = entry.dim;
    this.viewport.setDim(entry.dim);
    this.rebuildCurve(true);
    this.equations.render(entry.cartesian, entry.param);
    this.control.sync(this.state);
  }

  private applyCartesian(input: string): void {
    this.state.cartesianInput = input;
    const r = recognizeCartesian(input);
    if (!r.ok) {
      this.control.setCartesianMessage(r.reason, 'error');
      return;
    }
    this.state.expr = r.expr;
    this.state.tMin = r.tMin;
    this.state.tMax = r.tMax;
    this.state.dim = r.dim;
    this.viewport.setDim(r.dim);
    this.rebuildCurve(true);
    this.equations.render(r.cartesian, r.param);
    this.control.setCartesianMessage(r.note ?? '¡Listo! Parametrización generada.', 'ok');
    this.control.sync(this.state);
  }

  private applyParametric(expr: ParamExpr, tMin: number, tMax: number): void {
    try {
      const curve = curveFromExpr(expr, tMin, tMax);
      this.state.expr = expr;
      this.state.tMin = tMin;
      this.state.tMax = tMax;
      this.curve = curve;
      this.rebuildCurve(true);
      this.equations.render(null, paramTex(expr, this.state.dim));
      this.control.setParametricError(null);
    } catch (e) {
      this.control.setParametricError(e instanceof ParseError ? e.message : 'Expresión inválida.');
    }
  }

  private setToggle(key: keyof AppState['show'], value: boolean): void {
    this.state.show[key] = value;
    if (key === 'scalar') {
      this.curveView.setCurve(this.curve, value ? this.scalarField : null);
    }
    if (key === 'vector') {
      this.refreshFieldView();
    }
    this.updateForT();
  }

  private applyScalar(expr: string): void {
    this.state.scalar = expr;
    this.rebuildFields();
    if (this.state.show.scalar) this.curveView.setCurve(this.curve, this.scalarField);
    this.updateForT();
  }

  private applyVector(v: VectorExpr): void {
    this.state.vector = v;
    this.rebuildFields();
    this.refreshFieldView();
    this.updateForT();
  }

  private async runOcr(file: File): Promise<void> {
    this.control.setOcrStatus('Reconociendo imagen… (puede tardar unos segundos)');
    try {
      const text = await this.ocr.recognize(file, (pct) =>
        this.control.setOcrStatus(`Reconociendo… ${pct}%`),
      );
      this.state.mode = 'cartesian';
      this.state.cartesianInput = text;
      this.control.sync(this.state);
      this.control.setOcrStatus(`Detecté: "${text}". Revísalo y pulsa Parametrizar.`);
    } catch {
      this.control.setOcrStatus('No pude leer la imagen. Prueba con una más nítida.');
    }
  }

  // ---- Transporte ----

  private scrub(t: number): void {
    this.state.t = t;
    this.updateForT();
  }

  private togglePlay(playing: boolean): void {
    this.playing = playing;
    if (playing && this.state.t >= this.state.tMax - 1e-9) this.state.t = this.state.tMin;
  }

  // ---- Reconstrucción ----

  private rebuildFields(): void {
    try {
      this.scalarField = scalarFieldFromExpr(this.state.scalar);
    } catch {
      this.scalarField = null;
    }
    try {
      this.vectorField = vectorFieldFromExpr(this.state.vector);
    } catch {
      this.vectorField = null;
    }
  }

  private rebuildCurve(resetCamera: boolean): void {
    this.curve = curveFromExpr(this.state.expr, this.state.tMin, this.state.tMax);
    this.state.t = Math.min(Math.max(this.state.t, this.state.tMin), this.state.tMax);
    this.curveView.setCurve(this.curve, this.state.show.scalar ? this.scalarField : null);
    this.components.setCurve(this.curve, this.state.dim);
    this.transport.setRange(this.state.tMin, this.state.tMax);
    this.refreshFieldView();
    if (resetCamera) this.frameCamera();
    this.updateForT();
  }

  private refreshFieldView(): void {
    const { center, radius } = this.curveView.bounds();
    this.fieldView.setField(
      this.state.show.vector ? this.vectorField : null,
      center,
      radius,
      this.state.dim,
    );
  }

  private frameCamera(): void {
    const { center, radius } = this.curveView.bounds();
    this.viewport.frame(center, radius, this.state.dim);
  }

  /** Renderiza las ecuaciones acordes al modo actual (usado al cargar). */
  private refreshEquations(): void {
    if (this.state.mode === 'library') {
      const entry = getLibraryCurve(this.state.libraryId);
      if (entry) this.equations.render(entry.cartesian, entry.param);
      return;
    }
    if (this.state.mode === 'cartesian') {
      const r = recognizeCartesian(this.state.cartesianInput);
      if (r.ok) this.equations.render(r.cartesian, r.param);
      else this.equations.render(null, paramTex(this.state.expr, this.state.dim));
      return;
    }
    this.equations.render(null, paramTex(this.state.expr, this.state.dim));
  }

  private updateForT(): void {
    const t = this.state.t;
    this.curveView.setT(this.curve, t);
    const point = this.curve.eval(t);
    this.frenetView.update(point, frenetFrame(this.curve, t), this.state.show);
    this.components.setT(t);
    this.transport.setT(t);
    this.transport.setReadout(this.computeReadout(point), this.state.show.scalar, this.state.show.vector);
  }

  private computeReadout(point: Readout['point']): Readout {
    const t = this.state.t;
    return {
      point,
      t,
      arcLength: arcLength(this.curve, t),
      curvature: curvature(this.curve, t),
      scalarIntegral:
        this.state.show.scalar && this.scalarField
          ? lineIntegralScalar(this.curve, this.scalarField, t)
          : null,
      vectorIntegral:
        this.state.show.vector && this.vectorField
          ? lineIntegralVector(this.curve, this.vectorField, t)
          : null,
    };
  }

  // ---- Acciones globales ----

  private share(): void {
    const url = `${location.origin}${location.pathname}#${encodeState(this.state)}`;
    history.replaceState(null, '', url);
    navigator.clipboard?.writeText(url).then(
      () => this.flash('#share', '¡Enlace copiado!'),
      () => this.flash('#share', 'Enlace en la barra'),
    );
  }

  private savePng(): void {
    this.viewport.render();
    const link = document.createElement('a');
    link.download = 'curvana.png';
    link.href = this.viewport.renderer.domElement.toDataURL('image/png');
    link.click();
  }

  private flash(sel: string, text: string): void {
    const btn = document.querySelector(sel) as HTMLButtonElement | null;
    if (!btn) return;
    const prev = btn.textContent;
    btn.textContent = text;
    setTimeout(() => (btn.textContent = prev), 1600);
  }

  // ---- Loop de animación ----

  private loop(ts: number): void {
    const dt = this.lastTs ? ts - this.lastTs : 0;
    this.lastTs = ts;

    if (this.playing) {
      const span = this.state.tMax - this.state.tMin;
      this.state.t += (this.state.speed * span * dt) / SWEEP_MS;
      if (this.state.t >= this.state.tMax) {
        this.state.t = this.state.tMin; // recorrido en bucle
      }
      this.updateForT();
    }

    this.viewport.render();
    requestAnimationFrame((next) => this.loop(next));
  }
}

function texOf(expr: string): string {
  try {
    return mathjs.parse(expr).toTex();
  } catch {
    return expr;
  }
}

function paramTex(expr: ParamExpr, dim: Dim): string {
  const parts = [`x=${texOf(expr.x)}`, `y=${texOf(expr.y)}`];
  if (dim === '3d' || expr.z !== '0') parts.push(`z=${texOf(expr.z)}`);
  return parts.join(',\\quad ');
}

const SKELETON = `
  <div class="app">
    <div class="workspace">
      <aside id="control"></aside>
      <section class="viewer">
        <div class="viewer-top">
          <div id="equations" class="equations"></div>
          <div class="viewer-actions">
            <button id="share" class="ghost">Compartir</button>
            <button id="png" class="ghost">PNG</button>
          </div>
        </div>
        <div id="viewport" class="viewport"></div>
        <div id="components"></div>
        <div id="transport"></div>
      </section>
    </div>
  </div>
`;
