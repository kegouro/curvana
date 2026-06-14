// Catálogo de curvas estándar para enseñar parametrizaciones.
import type { Dim, ParamExpr } from './types';

export interface LibraryCurve {
  id: string;
  name: string;
  dim: Dim;
  expr: ParamExpr;
  tMin: number;
  tMax: number;
  /** Forma cartesiana en LaTeX. */
  cartesian: string;
  /** Parametrización en LaTeX. */
  param: string;
  description: string;
}

const TAU = 2 * Math.PI;

export const LIBRARY: LibraryCurve[] = [
  {
    id: 'recta',
    name: 'Recta',
    dim: '3d',
    expr: { x: '1 + 2*t', y: '-1 + t', z: '3*t' },
    tMin: 0,
    tMax: 1,
    cartesian: '\\vec{r} = (1,-1,0) + t\\,(2,1,3)',
    param: 'x=1+2t,\\quad y=-1+t,\\quad z=3t',
    description: 'Recta por un punto con un vector director.',
  },
  {
    id: 'circulo',
    name: 'Círculo',
    dim: '2d',
    expr: { x: '2*cos(t)', y: '2*sin(t)', z: '0' },
    tMin: 0,
    tMax: TAU,
    cartesian: 'x^2 + y^2 = 4',
    param: 'x=2\\cos t,\\quad y=2\\sin t',
    description: 'Círculo de radio 2 centrado en el origen.',
  },
  {
    id: 'elipse',
    name: 'Elipse',
    dim: '2d',
    expr: { x: '3*cos(t)', y: '2*sin(t)', z: '0' },
    tMin: 0,
    tMax: TAU,
    cartesian: '\\dfrac{x^2}{9} + \\dfrac{y^2}{4} = 1',
    param: 'x=3\\cos t,\\quad y=2\\sin t',
    description: 'Elipse con semiejes a=3, b=2.',
  },
  {
    id: 'parabola',
    name: 'Parábola',
    dim: '2d',
    expr: { x: 't', y: 't^2', z: '0' },
    tMin: -3,
    tMax: 3,
    cartesian: 'y = x^2',
    param: 'x=t,\\quad y=t^2',
    description: 'Gráfica de y = x² parametrizada con x = t.',
  },
  {
    id: 'helice',
    name: 'Hélice',
    dim: '3d',
    expr: { x: 'cos(t)', y: 'sin(t)', z: '0.3*t' },
    tMin: 0,
    tMax: 4 * Math.PI,
    cartesian: 'x^2+y^2=1,\\ \\ z=0.3\\,\\theta',
    param: 'x=\\cos t,\\quad y=\\sin t,\\quad z=0.3\\,t',
    description: 'Hélice circular: círculo en xy que sube en z.',
  },
  {
    id: 'espiral',
    name: 'Espiral de Arquímedes',
    dim: '2d',
    expr: { x: '0.3*t*cos(t)', y: '0.3*t*sin(t)', z: '0' },
    tMin: 0,
    tMax: 6 * Math.PI,
    cartesian: 'r = 0.3\\,\\theta\\ \\ (\\text{polares})',
    param: 'x=0.3\\,t\\cos t,\\quad y=0.3\\,t\\sin t',
    description: 'Espiral cuyo radio crece con el ángulo.',
  },
  {
    id: 'lissajous',
    name: 'Lissajous',
    dim: '2d',
    expr: { x: '2*sin(3*t)', y: '2*sin(4*t)', z: '0' },
    tMin: 0,
    tMax: TAU,
    cartesian: '\\text{(sin forma cartesiana simple)}',
    param: 'x=2\\sin(3t),\\quad y=2\\sin(4t)',
    description: 'Figura de Lissajous con frecuencias 3:4.',
  },
  {
    id: 'conica',
    name: 'Espiral cónica',
    dim: '3d',
    expr: { x: '0.15*t*cos(t)', y: '0.15*t*sin(t)', z: '0.25*t' },
    tMin: 0,
    tMax: 6 * Math.PI,
    cartesian: 'x^2+y^2=(0.6 z)^2',
    param: 'x=0.15\\,t\\cos t,\\ y=0.15\\,t\\sin t,\\ z=0.25\\,t',
    description: 'Espiral que se abre mientras sube: vive sobre un cono.',
  },
  {
    id: 'viviani',
    name: 'Curva de Viviani',
    dim: '3d',
    expr: { x: '1 + cos(t)', y: 'sin(t)', z: '2*sin(t/2)' },
    tMin: 0,
    tMax: 4 * Math.PI,
    cartesian: 'x^2+y^2+z^2=4,\\ \\ (x-1)^2+y^2=1',
    param: 'x=1+\\cos t,\\ y=\\sin t,\\ z=2\\sin(t/2)',
    description: 'Intersección de una esfera y un cilindro.',
  },
];

export function getLibraryCurve(id: string): LibraryCurve | undefined {
  return LIBRARY.find((c) => c.id === id);
}
