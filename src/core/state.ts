// Estado por defecto y serialización ↔ URL (hash). Núcleo puro.
import type { AppState } from './types';

export function defaultState(): AppState {
  return {
    dim: '3d',
    mode: 'library',
    expr: { x: 'cos(t)', y: 'sin(t)', z: '0.3*t' },
    tMin: 0,
    tMax: 4 * Math.PI,
    t: 4 * Math.PI,
    speed: 1,
    show: { tangent: true, frenet: false, scalar: false, vector: false },
    scalar: 'x^2 + y^2',
    vector: { x: '-y', y: 'x', z: '0' },
    cartesianInput: 'x^2 + y^2 = 4',
    libraryId: 'helice',
  };
}

/** Serializa el estado a una cadena para el hash de la URL. */
export function encodeState(state: AppState): string {
  return encodeURIComponent(JSON.stringify(state));
}

/** Intenta reconstruir un estado desde el hash. Devuelve null si no es válido. */
export function decodeState(raw: string): AppState | null {
  const trimmed = raw.startsWith('#') ? raw.slice(1) : raw;
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(trimmed));
    return mergeWithDefault(parsed);
  } catch {
    return null;
  }
}

/** Combina un objeto parcial con los valores por defecto (tolerante a versiones viejas). */
function mergeWithDefault(parsed: unknown): AppState {
  const d = defaultState();
  if (typeof parsed !== 'object' || parsed === null) return d;
  const p = parsed as Partial<AppState>;
  return {
    dim: p.dim ?? d.dim,
    mode: p.mode ?? d.mode,
    expr: { ...d.expr, ...(p.expr ?? {}) },
    tMin: typeof p.tMin === 'number' ? p.tMin : d.tMin,
    tMax: typeof p.tMax === 'number' ? p.tMax : d.tMax,
    t: typeof p.t === 'number' ? p.t : d.t,
    speed: typeof p.speed === 'number' ? p.speed : d.speed,
    show: { ...d.show, ...(p.show ?? {}) },
    scalar: p.scalar ?? d.scalar,
    vector: { ...d.vector, ...(p.vector ?? {}) },
    cartesianInput: p.cartesianInput ?? d.cartesianInput,
    libraryId: p.libraryId ?? d.libraryId,
  };
}
