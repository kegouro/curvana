// Modelo de curva paramétrica r(t) = (x(t), y(t), z(t)).
// Calcula derivadas numéricas (diferencias centradas). Núcleo puro.
import type { Vec3 } from './vector';
import type { ParamExpr } from './types';
import { compileExpr } from './parser';

// Pasos de diferenciación: óptimos aprox. para minimizar truncamiento + redondeo.
const H1 = 1e-6; // primera derivada
const H2 = 1e-4; // segunda derivada

export interface Curve {
  eval(t: number): Vec3;
  velocity(t: number): Vec3; // r'(t)
  acceleration(t: number): Vec3; // r''(t)
  tMin: number;
  tMax: number;
  expr?: ParamExpr;
}

export function curveFromFn(
  fn: (t: number) => Vec3,
  tMin: number,
  tMax: number,
  expr?: ParamExpr,
): Curve {
  const velocity = (t: number): Vec3 => {
    const a = fn(t + H1);
    const b = fn(t - H1);
    return [(a[0] - b[0]) / (2 * H1), (a[1] - b[1]) / (2 * H1), (a[2] - b[2]) / (2 * H1)];
  };

  const acceleration = (t: number): Vec3 => {
    const a = fn(t + H2);
    const c = fn(t);
    const b = fn(t - H2);
    return [
      (a[0] - 2 * c[0] + b[0]) / (H2 * H2),
      (a[1] - 2 * c[1] + b[1]) / (H2 * H2),
      (a[2] - 2 * c[2] + b[2]) / (H2 * H2),
    ];
  };

  return { eval: fn, velocity, acceleration, tMin, tMax, expr };
}

/**
 * Construye una curva a partir de tres expresiones en `t`.
 * Lanza ParseError (de parser.ts) si alguna expresión es inválida.
 */
export function curveFromExpr(expr: ParamExpr, tMin: number, tMax: number): Curve {
  const cx = compileExpr(expr.x, ['t']);
  const cy = compileExpr(expr.y, ['t']);
  const cz = compileExpr(expr.z, ['t']);
  const fn = (t: number): Vec3 => [cx.evaluate({ t }), cy.evaluate({ t }), cz.evaluate({ t })];
  return curveFromFn(fn, tMin, tMax, expr);
}

/** Muestrea la curva en `samples+1` puntos uniformes de [tMin, tMax]. */
export function sampleCurve(curve: Curve, samples = 400): Vec3[] {
  const pts: Vec3[] = [];
  const { tMin, tMax } = curve;
  for (let i = 0; i <= samples; i++) {
    const t = tMin + ((tMax - tMin) * i) / samples;
    pts.push(curve.eval(t));
  }
  return pts;
}
