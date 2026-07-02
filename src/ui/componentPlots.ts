// Mini-gráficas de las componentes x(t), y(t), z(t) — lo más didáctico:
// muestra cómo cada coordenada construye la curva al avanzar t.
import type { Curve } from '../core/curve';
import type { Dim } from '../core/types';

interface Plot {
  label: string;
  canvas: HTMLCanvasElement;
  values: number[];
  w: number;
  h: number;
}

const COLORS = ['#f87171', '#a3e635', '#38bdf8']; // x, y, z

export class ComponentPlots {
  private readonly plots: Plot[];
  private tMin = 0;
  private tMax = 1;
  private current = 0;

  constructor(private readonly el: HTMLElement) {
    this.el.classList.add('components');
    this.plots = ['x(t)', 'y(t)', 'z(t)'].map((label, i) => {
      const cell = document.createElement('div');
      cell.className = 'comp-cell';
      const title = document.createElement('span');
      title.className = 'comp-label';
      title.textContent = label;
      title.style.color = COLORS[i];
      const canvas = document.createElement('canvas');
      cell.append(title, canvas);
      this.el.appendChild(cell);
      return { label, canvas, values: [], w: 0, h: 0 };
    });
    
    const ro = new ResizeObserver(() => {
      this.updateSizes();
      this.redraw();
    });
    ro.observe(this.el);
    setTimeout(() => this.updateSizes(), 0);
  }

  setCurve(curve: Curve, dim: Dim): void {
    this.tMin = curve.tMin;
    this.tMax = curve.tMax;
    const n = 240;
    for (const p of this.plots) p.values = [];
    for (let i = 0; i <= n; i++) {
      const t = this.tMin + ((this.tMax - this.tMin) * i) / n;
      const p = curve.eval(t);
      this.plots[0].values.push(p[0]);
      this.plots[1].values.push(p[1]);
      this.plots[2].values.push(p[2]);
    }
    this.plots[2].canvas.parentElement!.style.display = dim === '2d' ? 'none' : '';
    this.redraw();
  }

  setT(t: number): void {
    this.current = t;
    this.redraw();
  }

  private redraw(): void {
    for (let i = 0; i < this.plots.length; i++) this.draw(this.plots[i], COLORS[i]);
  }

  private updateSizes(): void {
    for (const p of this.plots) {
      const rect = p.canvas.getBoundingClientRect();
      p.w = Math.max(80, Math.floor(rect.width)) * devicePixelRatio;
      p.h = Math.max(50, Math.floor(rect.height)) * devicePixelRatio;
      p.canvas.width = p.w;
      p.canvas.height = p.h;
    }
  }

  private draw(plot: Plot, color: string): void {
    const { canvas, values, w, h } = plot;
    const ctx = canvas.getContext('2d');
    if (!ctx || values.length === 0 || w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);
    const finite = values.filter(Number.isFinite);
    let lo = Math.min(...finite);
    let hi = Math.max(...finite);
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo === hi) {
      lo -= 1;
      hi += 1;
    }
    const pad = 6 * devicePixelRatio;
    const xOf = (i: number) => pad + (i / (values.length - 1)) * (w - 2 * pad);
    const yOf = (v: number) => h - pad - ((v - lo) / (hi - lo)) * (h - 2 * pad);

    // eje y=0
    if (lo < 0 && hi > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, yOf(0));
      ctx.lineTo(w - pad, yOf(0));
      ctx.stroke();
    }

    // curva del componente
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6 * devicePixelRatio;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < values.length; i++) {
      if (!Number.isFinite(values[i])) {
        started = false;
        continue;
      }
      const X = xOf(i);
      const Y = yOf(values[i]);
      if (!started) {
        ctx.moveTo(X, Y);
        started = true;
      } else ctx.lineTo(X, Y);
    }
    ctx.stroke();

    // marcador del t actual
    const frac = this.tMax === this.tMin ? 0 : (this.current - this.tMin) / (this.tMax - this.tMin);
    const idx = Math.max(0, Math.min(values.length - 1, Math.round(frac * (values.length - 1))));
    const mx = xOf(idx);
    ctx.strokeStyle = 'rgba(251,191,36,0.6)';
    ctx.beginPath();
    ctx.moveTo(mx, pad);
    ctx.lineTo(mx, h - pad);
    ctx.stroke();
    if (Number.isFinite(values[idx])) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(mx, yOf(values[idx]), 3 * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
