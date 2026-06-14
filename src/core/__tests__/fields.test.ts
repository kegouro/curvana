import { describe, it, expect } from 'vitest';
import { curveFromExpr } from '../curve';
import {
  scalarFieldFromExpr,
  vectorFieldFromExpr,
  lineIntegralScalar,
  lineIntegralVector,
} from '../fields';

describe('integral de línea escalar', () => {
  it('con f = 1 reproduce la longitud de arco (círculo radio 2 → 4π)', () => {
    const c = curveFromExpr({ x: '2*cos(t)', y: '2*sin(t)', z: '0' }, 0, 2 * Math.PI);
    const f = scalarFieldFromExpr('1');
    expect(lineIntegralScalar(c, f, 2 * Math.PI)).toBeCloseTo(4 * Math.PI, 4);
  });
});

describe('integral de línea vectorial', () => {
  it('campo conservativo F = ∇(x²+y²) = (2x, 2y): ∫F·dr = Δφ', () => {
    // recta de (0,0,0) a (1,2,0): φ(1,2) - φ(0,0) = 5
    const c = curveFromExpr({ x: 't', y: '2*t', z: '0' }, 0, 1);
    const F = vectorFieldFromExpr({ x: '2*x', y: '2*y', z: '0' });
    expect(lineIntegralVector(c, F, 1)).toBeCloseTo(5, 6);
  });

  it('F = (-y, x, 0) sobre círculo radio 2: ∮F·dr = 2·área = 8π', () => {
    const c = curveFromExpr({ x: '2*cos(t)', y: '2*sin(t)', z: '0' }, 0, 2 * Math.PI);
    const F = vectorFieldFromExpr({ x: '-y', y: 'x', z: '0' });
    expect(lineIntegralVector(c, F, 2 * Math.PI)).toBeCloseTo(8 * Math.PI, 4);
  });
});
