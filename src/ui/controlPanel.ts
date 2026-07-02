// Panel de control: dimensión, modo de entrada (biblioteca / cartesiana / paramétrica),
// OCR, y capas (tangente, Frenet, campos). Solo presentación: delega en `handlers`.
import type { AppState, Dim, InputMode, ParamExpr, VectorExpr } from '../core/types';
import { LIBRARY } from '../core/library';

export interface ControlHandlers {
  onDim(dim: Dim): void;
  onMode(mode: InputMode): void;
  onLibrary(id: string): void;
  onCartesianSubmit(input: string): void;
  onParametricSubmit(expr: ParamExpr, tMin: number, tMax: number): void;
  onToggle(key: keyof AppState['show'], value: boolean): void;
  onScalarSubmit(expr: string): void;
  onVectorSubmit(expr: VectorExpr): void;
  onOcrFile(file: File): void;
}

export class ControlPanel {
  private readonly $: <T extends HTMLElement>(sel: string) => T;

  constructor(private readonly el: HTMLElement, private readonly h: ControlHandlers) {
    this.el.classList.add('panel');
    this.el.innerHTML = TEMPLATE(LIBRARY.map((c) => `<option value="${c.id}">${c.name}</option>`).join(''));
    this.$ = <T extends HTMLElement>(sel: string) => this.el.querySelector(sel) as T;
    this.wire();
  }

  private wire(): void {
    // Dimensión
    this.el.querySelectorAll<HTMLButtonElement>('[data-dim]').forEach((btn) =>
      btn.addEventListener('click', () => this.h.onDim(btn.dataset.dim as Dim)),
    );

    // Tabs de modo
    this.el.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((btn) =>
      btn.addEventListener('click', () => this.h.onMode(btn.dataset.mode as InputMode)),
    );

    // Biblioteca
    this.$<HTMLSelectElement>('#lib-select').addEventListener('change', (e) =>
      this.h.onLibrary((e.target as HTMLSelectElement).value),
    );

    // Cartesiana
    this.$('#cart-go').addEventListener('click', () =>
      this.h.onCartesianSubmit(this.$<HTMLInputElement>('#cart-input').value),
    );
    this.$<HTMLInputElement>('#cart-input').addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') this.h.onCartesianSubmit(this.$<HTMLInputElement>('#cart-input').value);
    });

    // OCR
    const file = this.$<HTMLInputElement>('#ocr-file');
    file.addEventListener('change', () => {
      if (file.files && file.files[0]) this.h.onOcrFile(file.files[0]);
    });
    const drop = this.$('#ocr-drop');
    drop.addEventListener('dragover', (e) => {
      e.preventDefault();
      drop.classList.add('drag');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('drag');
      const f = (e as DragEvent).dataTransfer?.files?.[0];
      if (f) this.h.onOcrFile(f);
    });

    // Paramétrica
    this.$('#param-go').addEventListener('click', () => this.submitParam());
    ['#px', '#py', '#pz', '#tmin', '#tmax'].forEach((id) =>
      this.$<HTMLInputElement>(id).addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') this.submitParam();
      }),
    );

    // Capas
    this.$<HTMLInputElement>('#tg-tangent').addEventListener('change', (e) =>
      this.h.onToggle('tangent', (e.target as HTMLInputElement).checked),
    );
    this.$<HTMLInputElement>('#tg-frenet').addEventListener('change', (e) =>
      this.h.onToggle('frenet', (e.target as HTMLInputElement).checked),
    );
    this.$<HTMLInputElement>('#tg-scalar').addEventListener('change', (e) =>
      this.h.onToggle('scalar', (e.target as HTMLInputElement).checked),
    );
    this.$<HTMLInputElement>('#tg-vector').addEventListener('change', (e) =>
      this.h.onToggle('vector', (e.target as HTMLInputElement).checked),
    );
    this.$('#scalar-go').addEventListener('click', () =>
      this.h.onScalarSubmit(this.$<HTMLInputElement>('#scalar-expr').value),
    );
    this.$('#vector-go').addEventListener('click', () =>
      this.h.onVectorSubmit({
        x: this.$<HTMLInputElement>('#fx').value,
        y: this.$<HTMLInputElement>('#fy').value,
        z: this.$<HTMLInputElement>('#fz').value,
      }),
    );
  }

  private submitParam(): void {
    const tMinVal = this.$<HTMLInputElement>('#tmin').value.trim();
    const tMaxVal = this.$<HTMLInputElement>('#tmax').value.trim();
    const tMin = tMinVal === '' ? NaN : Number(tMinVal);
    const tMax = tMaxVal === '' ? NaN : Number(tMaxVal);

    this.h.onParametricSubmit(
      {
        x: this.$<HTMLInputElement>('#px').value,
        y: this.$<HTMLInputElement>('#py').value,
        z: this.$<HTMLInputElement>('#pz').value,
      },
      tMin,
      tMax,
    );
  }

  /** Refleja el estado actual en los controles. */
  sync(state: AppState): void {
    this.el.querySelectorAll<HTMLButtonElement>('[data-dim]').forEach((b) =>
      b.classList.toggle('active', b.dataset.dim === state.dim),
    );
    this.el.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) =>
      b.classList.toggle('active', b.dataset.mode === state.mode),
    );
    (['library', 'cartesian', 'parametric'] as InputMode[]).forEach((m) => {
      this.$<HTMLElement>(`#pane-${m}`).style.display = state.mode === m ? '' : 'none';
    });

    this.$<HTMLSelectElement>('#lib-select').value = state.libraryId;
    this.$<HTMLInputElement>('#cart-input').value = state.cartesianInput;
    this.$<HTMLInputElement>('#px').value = state.expr.x;
    this.$<HTMLInputElement>('#py').value = state.expr.y;
    this.$<HTMLInputElement>('#pz').value = state.expr.z;
    this.$<HTMLInputElement>('#tmin').value = trim(state.tMin);
    this.$<HTMLInputElement>('#tmax').value = trim(state.tMax);

    this.$<HTMLInputElement>('#tg-tangent').checked = state.show.tangent;
    this.$<HTMLInputElement>('#tg-frenet').checked = state.show.frenet;
    this.$<HTMLInputElement>('#tg-scalar').checked = state.show.scalar;
    this.$<HTMLInputElement>('#tg-vector').checked = state.show.vector;
    this.$<HTMLInputElement>('#scalar-expr').value = state.scalar;
    this.$<HTMLInputElement>('#fx').value = state.vector.x;
    this.$<HTMLInputElement>('#fy').value = state.vector.y;
    this.$<HTMLInputElement>('#fz').value = state.vector.z;
  }

  setCartesianMessage(msg: string, kind: 'ok' | 'error' | 'none'): void {
    const el = this.$('#cart-msg');
    el.textContent = msg;
    el.className = `msg ${kind}`;
  }

  setParametricError(msg: string | null): void {
    const el = this.$('#param-msg');
    el.textContent = msg ?? '';
    el.className = `msg ${msg ? 'error' : 'none'}`;
  }

  setScalarError(msg: string | null): void {
    const el = this.$('#scalar-msg');
    el.textContent = msg ?? '';
    el.className = `msg ${msg ? 'error' : 'none'}`;
  }

  setVectorError(msg: string | null): void {
    const el = this.$('#vector-msg');
    el.textContent = msg ?? '';
    el.className = `msg ${msg ? 'error' : 'none'}`;
  }

  hasError(): boolean {
    return !!this.el.querySelector('.msg.error');
  }

  setOcrStatus(msg: string): void {
    this.$('#ocr-status').textContent = msg;
  }
}

function trim(v: number): string {
  if (Number.isNaN(v)) return '';
  return Number.isInteger(v) ? String(v) : v.toFixed(4);
}

const TEMPLATE = (libOptions: string): string => `
  <div class="brand-row">
    <div class="logo">
      <img src="/logo.svg" alt="Curvana Logo" style="width: 28px; height: 28px;" />
    </div>
    <div>
      <div class="brand">Curvana</div>
      <div class="brand-sub">Simulador de parametrizaciones</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dimensión</div>
    <div class="seg">
      <button data-dim="2d">2D</button>
      <button data-dim="3d">3D</button>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Entrada</div>
    <div class="tabs">
      <button data-mode="library">Biblioteca</button>
      <button data-mode="cartesian">Cartesiana</button>
      <button data-mode="parametric">Paramétrica</button>
    </div>

    <div id="pane-library" class="pane">
      <select id="lib-select">${libOptions}</select>
    </div>

    <div id="pane-cartesian" class="pane">
      <input id="cart-input" type="text" placeholder="ej: x^2 + y^2 = 4" />
      <button id="cart-go" class="primary">Parametrizar</button>
      <div id="cart-msg" class="msg none"></div>
      <div class="ocr">
        <div id="ocr-drop" class="ocr-drop">
          📷 Arrastra una imagen o captura de la ecuación, o
          <label class="link">elige un archivo<input id="ocr-file" type="file" accept="image/*" hidden /></label>
        </div>
        <div id="ocr-status" class="ocr-status"></div>
      </div>
    </div>

    <div id="pane-parametric" class="pane">
      <label class="field"><span>x(t)</span><input id="px" type="text" /></label>
      <label class="field"><span>y(t)</span><input id="py" type="text" /></label>
      <label class="field"><span>z(t)</span><input id="pz" type="text" /></label>
      <div class="range-row">
        <label class="field small"><span>t mín</span><input id="tmin" type="number" step="any" /></label>
        <label class="field small"><span>t máx</span><input id="tmax" type="number" step="any" /></label>
      </div>
      <button id="param-go" class="primary">Graficar</button>
      <div id="param-msg" class="msg none"></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Capas</div>
    <label class="check"><input id="tg-tangent" type="checkbox" /> Vector tangente</label>
    <label class="check"><input id="tg-frenet" type="checkbox" /> Triedro de Frenet (T, N, B)</label>

    <label class="check"><input id="tg-scalar" type="checkbox" /> Campo escalar f(x,y,z)</label>
    <div class="subfield">
      <input id="scalar-expr" type="text" placeholder="ej: x^2 + y^2" />
      <button id="scalar-go">Aplicar</button>
    </div>
    <div id="scalar-msg" class="msg none"></div>

    <label class="check"><input id="tg-vector" type="checkbox" /> Campo vectorial F(x,y,z)</label>
    <div class="subfield vec">
      <input id="fx" type="text" placeholder="Fx" />
      <input id="fy" type="text" placeholder="Fy" />
      <input id="fz" type="text" placeholder="Fz" />
      <button id="vector-go">Aplicar</button>
    </div>
    <div id="vector-msg" class="msg none"></div>
  </div>

  <div class="signature">Hecho por <b>José Labarca</b> · para Mate 023</div>
`;
