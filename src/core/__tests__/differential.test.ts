import { describe, it, expect } from 'vitest';
import { curveFromExpr } from '../curve';
import { curvature, arcLength, frenetFrame } from '../differential';
import * as V from '../vector';

describe('curvatura', () => {
  it('círculo de radio 2 tiene curvatura 1/2', () => {
    const c = curveFromExpr({ x: '2*cos(t)', y: '2*sin(t)', z: '0' }, 0, 2 * Math.PI);
    expect(curvature(c, 1.0)).toBeCloseTo(0.5, 4);
  });

  it('hélice tiene curvatura a/(a²+b²)', () => {
    // a=1, b=0.3 -> 1/(1+0.09)
    const c = curveFromExpr({ x: 'cos(t)', y: 'sin(t)', z: '0.3*t' }, 0, 10);
    expect(curvature(c, 2.0)).toBeCloseTo(1 / 1.09, 4);
  });
});

describe('longitud de arco', () => {
  it('círculo de radio 2: perímetro = 4π', () => {
    const c = curveFromExpr({ x: '2*cos(t)', y: '2*sin(t)', z: '0' }, 0, 2 * Math.PI);
    expect(arcLength(c, 2 * Math.PI)).toBeCloseTo(4 * Math.PI, 4);
  });

  it('recta: longitud = |dirección| · Δt', () => {
    const c = curveFromExpr({ x: 't', y: '2*t', z: '2*t' }, 0, 1); // |(1,2,2)| = 3
    expect(arcLength(c, 1)).toBeCloseTo(3, 6);
  });
});

describe('triedro de Frenet', () => {
  it('T, N, B son ortonormales y T×N = B', () => {
    const c = curveFromExpr({ x: 'cos(t)', y: 'sin(t)', z: '0.3*t' }, 0, 10);
    const { T, N, B } = frenetFrame(c, 1.3);
    expect(V.norm(T)).toBeCloseTo(1, 4);
    expect(V.norm(N)).toBeCloseTo(1, 4);
    expect(V.norm(B)).toBeCloseTo(1, 4);
    expect(V.dot(T, N)).toBeCloseTo(0, 4);
    expect(V.dot(T, B)).toBeCloseTo(0, 4);
    expect(V.dot(N, B)).toBeCloseTo(0, 4);
    const cross = V.cross(T, N);
    expect(cross[0]).toBeCloseTo(B[0], 4);
    expect(cross[1]).toBeCloseTo(B[1], 4);
    expect(cross[2]).toBeCloseTo(B[2], 4);
  });
});
