// Barra de transporte: slider del parámetro, play/pausa, velocidad y lecturas
// (t, longitud de arco, integrales de línea y curvatura).
import type { Readout } from '../core/types';

export interface TransportHandlers {
  onScrub(t: number): void;
  onPlayToggle(playing: boolean): void;
  onSpeed(speed: number): void;
}

const STEPS = 1000;

export class TransportBar {
  private readonly slider: HTMLInputElement;
  private readonly playBtn: HTMLButtonElement;
  private readonly speedSel: HTMLSelectElement;
  private readonly readEl: HTMLElement;
  private tMin = 0;
  private tMax = 1;
  private playing = false;

  constructor(private readonly el: HTMLElement, private readonly handlers: TransportHandlers) {
    this.el.classList.add('transport');
    this.el.innerHTML = `
      <button class="play" title="Reproducir / pausar">▶</button>
      <input class="scrub" type="range" min="0" max="${STEPS}" value="${STEPS}" step="1" />
      <select class="speed" title="Velocidad">
        <option value="0.5">0.5×</option>
        <option value="1" selected>1×</option>
        <option value="2">2×</option>
        <option value="4">4×</option>
      </select>
      <div class="readouts"></div>
    `;
    this.playBtn = this.el.querySelector('.play')!;
    this.slider = this.el.querySelector('.scrub')!;
    this.speedSel = this.el.querySelector('.speed')!;
    this.readEl = this.el.querySelector('.readouts')!;

    this.slider.addEventListener('input', () => {
      const frac = Number(this.slider.value) / STEPS;
      this.handlers.onScrub(this.tMin + frac * (this.tMax - this.tMin));
    });
    this.playBtn.addEventListener('click', () => this.setPlaying(!this.playing));
    this.speedSel.addEventListener('change', () => this.handlers.onSpeed(Number(this.speedSel.value)));
  }

  setRange(tMin: number, tMax: number): void {
    this.tMin = tMin;
    this.tMax = tMax;
  }

  setPlaying(playing: boolean): void {
    this.playing = playing;
    this.playBtn.textContent = playing ? '❚❚' : '▶';
    this.playBtn.classList.toggle('on', playing);
    this.handlers.onPlayToggle(playing);
  }

  /** Sincroniza la posición del slider con el t actual (sin re-emitir el evento). */
  setT(t: number): void {
    const frac = this.tMax === this.tMin ? 0 : (t - this.tMin) / (this.tMax - this.tMin);
    this.slider.value = String(Math.round(frac * STEPS));
  }

  setReadout(r: Readout, showScalar: boolean, showVector: boolean): void {
    const fmt = (v: number) => (Number.isFinite(v) ? v.toFixed(3) : '—');
    const chips: string[] = [
      `<span class="chip"><b>t</b> ${fmt(r.t)}</span>`,
      `<span class="chip"><b>s</b> ${fmt(r.arcLength)}</span>`,
      `<span class="chip"><b>κ</b> ${fmt(r.curvature)}</span>`,
    ];
    if (showScalar && r.scalarIntegral !== null) {
      chips.push(`<span class="chip"><b>∫f ds</b> ${fmt(r.scalarIntegral)}</span>`);
    }
    if (showVector && r.vectorIntegral !== null) {
      chips.push(`<span class="chip"><b>∫F·dr</b> ${fmt(r.vectorIntegral)}</span>`);
    }
    this.readEl.innerHTML = chips.join('');
  }
}
