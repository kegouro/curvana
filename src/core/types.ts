// Tipos compartidos del núcleo. Solo datos serializables y firmas.
import type { Vec3 } from './vector';

export type Dim = '2d' | '3d';

export type InputMode = 'library' | 'cartesian' | 'parametric';

/** Parametrización: cada componente es una expresión en función de `t`. */
export interface ParamExpr {
  x: string;
  y: string;
  z: string;
}

export interface VectorExpr {
  x: string;
  y: string;
  z: string;
}

/** Estado completo de la aplicación. 100% serializable (para compartir por URL). */
export interface AppState {
  dim: Dim;
  mode: InputMode;
  expr: ParamExpr;
  tMin: number;
  tMax: number;
  t: number;
  speed: number;
  show: {
    tangent: boolean;
    frenet: boolean;
    scalar: boolean;
    vector: boolean;
  };
  scalar: string;
  vector: VectorExpr;
  cartesianInput: string;
  libraryId: string;
}

/** Lecturas calculadas por el núcleo para el `t` actual. */
export interface Readout {
  point: Vec3;
  t: number;
  arcLength: number;
  curvature: number;
  scalarIntegral: number | null;
  vectorIntegral: number | null;
}
