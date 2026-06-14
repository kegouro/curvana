import { describe, it, expect } from 'vitest';
import { integrate } from '../integrate';

describe('integración numérica (Simpson)', () => {
  it('∫₀¹ x² dx = 1/3', () => {
    expect(integrate((t) => t * t, 0, 1)).toBeCloseTo(1 / 3, 8);
  });

  it('∫₀^π sin x dx = 2', () => {
    expect(integrate(Math.sin, 0, Math.PI)).toBeCloseTo(2, 6);
  });

  it('intervalo nulo da 0', () => {
    expect(integrate((t) => t, 3, 3)).toBe(0);
  });

  it('ignora valores no finitos puntuales', () => {
    const g = (t: number) => (t === 0 ? Infinity : 1);
    expect(integrate(g, 0, 1)).toBeCloseTo(1, 2);
  });
});
