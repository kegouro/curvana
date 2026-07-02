// Análisis diferencial de curvas: triedro de Frenet, curvatura y longitud de arco.
// Núcleo puro.
import type { Vec3 } from './vector';
import * as V from './vector';
import type { Curve } from './curve';
import { integrate } from './integrate';

export interface Frame {
  T: Vec3; // tangente unitaria
  N: Vec3; // normal principal
  B: Vec3; // binormal
}

/** Tangente unitaria T(t) = r'(t) / |r'(t)|. */
export function unitTangent(curve: Curve, t: number): Vec3 {
  return V.normalize(curve.velocity(t));
}

/**
 * Triedro de Frenet en t. N se obtiene como la componente de la aceleración
 * perpendicular a T (más estable que derivar T numéricamente).
 */
export function frenetFrame(curve: Curve, t: number): Frame {
  const v = curve.velocity(t);
  const a = curve.acceleration(t);
  const T = V.normalize(v);
  const aPerp = V.sub(a, V.scale(T, V.dot(a, T)));
  const N = V.normalize(aPerp);
  const B = V.cross(T, N);
  const safe = (vec: Vec3): Vec3 => (Number.isFinite(vec[0]) && Number.isFinite(vec[1]) && Number.isFinite(vec[2]) ? vec : [0, 0, 0]);
  return { T: safe(T), N: safe(N), B: safe(B) };
}

/** Curvatura κ(t) = |r'(t) × r''(t)| / |r'(t)|³. */
export function curvature(curve: Curve, t: number): number {
  const v = curve.velocity(t);
  const a = curve.acceleration(t);
  const speed = V.norm(v);
  if (speed === 0 || !Number.isFinite(speed)) return 0;
  const k = V.norm(V.cross(v, a)) / speed ** 3;
  return Number.isFinite(k) ? k : 0;
}

/** Longitud de arco acumulada s(t) = ∫_from^t |r'(τ)| dτ. */
export function arcLength(curve: Curve, t: number, from: number = curve.tMin): number {
  return integrate((tau) => V.norm(curve.velocity(tau)), from, t);
}

import { IntegralInterpolator } from './interpolator';
export function createArcLengthInterpolator(curve: Curve): IntegralInterpolator {
  return new IntegralInterpolator(curve.tMin, curve.tMax, (tau) => V.norm(curve.velocity(tau)));
}
