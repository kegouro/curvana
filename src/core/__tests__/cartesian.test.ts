import { describe, it, expect } from 'vitest';
import { recognizeCartesian, type RecognizeOk } from '../cartesian';
import { curveFromExpr } from '../curve';
import type { Vec3 } from '../vector';

function ok(input: string): RecognizeOk {
  const r = recognizeCartesian(input);
  expect(r.ok, `esperaba reconocer "${input}" pero falló: ${r.ok ? '' : r.reason}`).toBe(true);
  return r as RecognizeOk;
}

function evalAt(r: RecognizeOk, t: number): Vec3 {
  return curveFromExpr(r.expr, r.tMin, r.tMax).eval(t);
}

describe('reconocedor de cartesianas', () => {
  it('círculo x²+y²=9 → radio 3', () => {
    const r = ok('x^2 + y^2 = 9');
    const p = evalAt(r, 0);
    expect(p[0]).toBeCloseTo(3, 6);
    expect(p[1]).toBeCloseTo(0, 6);
    expect(r.tMax).toBeCloseTo(2 * Math.PI, 6);
  });

  it('elipse x²/4 + y²/9 = 1 → semiejes 2 y 3', () => {
    const r = ok('x^2/4 + y^2/9 = 1');
    expect(evalAt(r, 0)[0]).toBeCloseTo(2, 5);
    expect(evalAt(r, Math.PI / 2)[1]).toBeCloseTo(3, 5);
  });

  it('círculo desplazado (x-1)²+(y+2)²=4 → centro (1,-2)', () => {
    const r = ok('(x-1)^2 + (y+2)^2 = 4');
    const p = evalAt(r, 0);
    expect(p[0]).toBeCloseTo(3, 5); // 1 + 2
    expect(p[1]).toBeCloseTo(-2, 5);
  });

  it('y = x^2 → parábola con x = t', () => {
    const r = ok('y = x^2');
    expect(evalAt(r, 2)[1]).toBeCloseTo(4, 6);
  });

  it('recta y = 2x + 1', () => {
    const r = ok('y = 2*x + 1');
    expect(evalAt(r, 1)[1]).toBeCloseTo(3, 6);
  });

  it('recta implícita 2x + 3y = 6', () => {
    const r = ok('2*x + 3*y = 6');
    // en x = 0 → y = 2
    const c = curveFromExpr(r.expr, r.tMin, r.tMax);
    expect(c.eval(0)[1]).toBeCloseTo(2, 6);
  });

  it('intersección cilindro∩plano x²+y²=1, z=2 → círculo a altura 2', () => {
    const r = ok('x^2 + y^2 = 1, z = 2');
    const p = evalAt(r, 0);
    expect(p[0]).toBeCloseTo(1, 5);
    expect(p[2]).toBeCloseTo(2, 6);
    expect(r.dim).toBe('3d');
  });

  it('par explícito y = x, z = x^2 → x = t', () => {
    const r = ok('y = x, z = x^2');
    const p = evalAt(r, 3);
    expect(p[0]).toBeCloseTo(3, 6);
    expect(p[1]).toBeCloseTo(3, 6);
    expect(p[2]).toBeCloseTo(9, 6);
  });

  it('hipérbola x²-y²=1 no se reconoce (se informa)', () => {
    const r = recognizeCartesian('x^2 - y^2 = 1');
    expect(r.ok).toBe(false);
  });

  it('entrada sin "=" se rechaza con mensaje', () => {
    const r = recognizeCartesian('x^2 + y^2');
    expect(r.ok).toBe(false);
  });

  it('intersección de cilindro yz con plano x: y²+z²=4, x=3', () => {
    const r = ok('y^2 + z^2 = 4, x = 3');
    const p = evalAt(r, 0);
    expect(p[0]).toBeCloseTo(3, 6);
    expect(p[1]).toBeCloseTo(2, 6);
    expect(p[2]).toBeCloseTo(0, 6);
    expect(r.dim).toBe('3d');
  });

  it('intersección de cilindro xz con plano y: x²+z²=9, y=1', () => {
    const r = ok('x^2 + z^2 = 9, y = 1');
    const p = evalAt(r, 0);
    expect(p[0]).toBeCloseTo(3, 6);
    expect(p[1]).toBeCloseTo(1, 6);
    expect(p[2]).toBeCloseTo(0, 6);
    expect(r.dim).toBe('3d');
  });

  it('intersección de esfera con plano z=2: x²+y²+z²=9, z=2', () => {
    const r = ok('x^2 + y^2 + z^2 = 9, z = 2');
    const p = evalAt(r, 0);
    const expectedRadius = Math.sqrt(5);
    expect(p[0]).toBeCloseTo(expectedRadius, 6);
    expect(p[1]).toBeCloseTo(0, 6);
    expect(p[2]).toBeCloseTo(2, 6);
    expect(r.dim).toBe('3d');
  });

  it('insensibilidad a mayúsculas/minúsculas en reconocedor', () => {
    const r = ok('X^2 + Y^2 = 9');
    const p = evalAt(r, 0);
    expect(p[0]).toBeCloseTo(3, 6);
    expect(p[1]).toBeCloseTo(0, 6);
  });

  it('separa ecuaciones por espacios x^2+y^2=9 z=3', () => {
    const r = ok('x^2+y^2=9 z=3');
    const p = evalAt(r, 0);
    expect(p[0]).toBeCloseTo(3, 6);
    expect(p[1]).toBeCloseTo(0, 6);
    expect(p[2]).toBeCloseTo(3, 6);
    expect(r.dim).toBe('3d');
  });

  it('separa ecuaciones por múltiples espacios con otros delimitadores y = x^2 z = 4', () => {
    const r = ok('y = x^2 z = 4');
    const p = evalAt(r, 2);
    expect(p[0]).toBeCloseTo(2, 6);
    expect(p[1]).toBeCloseTo(4, 6);
    expect(p[2]).toBeCloseTo(4, 6);
    expect(r.dim).toBe('3d');
  });
});
