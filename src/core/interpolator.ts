import { integrate } from './integrate';

export class IntegralInterpolator {
  private readonly values: Float64Array;
  private readonly dt: number;

  constructor(
    public readonly tMin: number,
    public readonly tMax: number,
    integrand: (t: number) => number,
    samples = 400
  ) {
    this.values = new Float64Array(samples + 1);
    if (tMax === tMin) {
      this.dt = 1;
      this.values[0] = 0;
      return;
    }
    const h = (tMax - tMin) / samples;
    this.dt = h;
    let sum = 0;
    
    this.values[0] = 0;
    for (let i = 1; i <= samples; i++) {
      const a = tMin + (i - 1) * h;
      const b = tMin + i * h;
      sum += integrate(integrand, a, b, 2);
      this.values[i] = sum;
    }
  }

  eval(t: number): number {
    if (this.tMin === this.tMax) return 0;
    if (t <= this.tMin) return 0;
    if (t >= this.tMax) return this.values[this.values.length - 1];
    
    const frac = (t - this.tMin) / this.dt;
    const i = Math.floor(frac);
    const rem = frac - i;
    
    if (i >= this.values.length - 1) return this.values[this.values.length - 1];
    return this.values[i] + rem * (this.values[i + 1] - this.values[i]);
  }
}
