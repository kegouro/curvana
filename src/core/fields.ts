// Campos escalares y vectoriales, e integrales de línea sobre una curva.
// Núcleo puro.
import type { Vec3 } from './vector';
import * as V from './vector';
import type { VectorExpr } from './types';
import type { Curve } from './curve';
import { compileExpr } from './parser';
import { integrate } from './integrate';

export interface ScalarField {
  eval(p: Vec3): number;
  source: string;
}

export interface VectorField {
  eval(p: Vec3): Vec3;
  source: VectorExpr;
}

export function scalarFieldFromExpr(source: string): ScalarField {
  const c = compileExpr(source, ['x', 'y', 'z']);
  return {
    source,
    eval: (p) => c.evaluate({ x: p[0], y: p[1], z: p[2] }),
  };
}

export function vectorFieldFromExpr(source: VectorExpr): VectorField {
  const cx = compileExpr(source.x, ['x', 'y', 'z']);
  const cy = compileExpr(source.y, ['x', 'y', 'z']);
  const cz = compileExpr(source.z, ['x', 'y', 'z']);
  return {
    source,
    eval: (p): Vec3 => [
      cx.evaluate({ x: p[0], y: p[1], z: p[2] }),
      cy.evaluate({ x: p[0], y: p[1], z: p[2] }),
      cz.evaluate({ x: p[0], y: p[1], z: p[2] }),
    ],
  };
}

/** Integral de línea de un campo escalar: ∫_from^t f(r(τ)) |r'(τ)| dτ. */
export function lineIntegralScalar(
  curve: Curve,
  f: ScalarField,
  t: number,
  from: number = curve.tMin,
): number {
  return integrate((tau) => f.eval(curve.eval(tau)) * V.norm(curve.velocity(tau)), from, t);
}

/** Integral de línea (trabajo) de un campo vectorial: ∫_from^t F(r(τ)) · r'(τ) dτ. */
export function lineIntegralVector(
  curve: Curve,
  field: VectorField,
  t: number,
  from: number = curve.tMin,
): number {
  return integrate((tau) => V.dot(field.eval(curve.eval(tau)), curve.velocity(tau)), from, t);
}
