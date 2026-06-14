// Reconocedor de ecuaciones cartesianas comunes → parametrización.
// Cubre las familias útiles en Cálculo 3 (Mate 023). Núcleo puro.
import type { Dim, ParamExpr } from './types';
import { mathjs as math } from './parser';

export interface RecognizeOk {
  ok: true;
  expr: ParamExpr;
  tMin: number;
  tMax: number;
  dim: Dim;
  cartesian: string; // LaTeX
  param: string; // LaTeX
  note?: string;
}

export interface RecognizeFail {
  ok: false;
  reason: string;
}

export type RecognizeResult = RecognizeOk | RecognizeFail;

const TAU = 2 * Math.PI;
const EPS = 1e-9;

const num = (v: number): string => {
  const r = Math.round(v);
  return Math.abs(v - r) < 1e-12 ? String(r) : String(v);
};

function normalize(input: string): string {
  return input
    .replace(/−/g, '-')
    .replace(/·/g, '*')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/√/g, 'sqrt')
    .replace(/π/g, 'pi')
    .toLowerCase()
    .trim();
}

function splitEquations(input: string): string[] {
  return input
    .split(/[,;\n]|∩/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

interface Eq {
  lhs: string;
  rhs: string;
}

function parseEquation(eq: string): Eq | null {
  const parts = eq.split('=');
  if (parts.length !== 2) return null;
  const lhs = parts[0].trim();
  const rhs = parts[1].trim();
  if (!lhs || !rhs) return null;
  return { lhs, rhs };
}

/** Variables (de {x,y,z}) que aparecen en una expresión. */
function varsIn(expr: string): Set<string> {
  const found = new Set<string>();
  try {
    math.parse(expr).traverse((node: any) => {
      if (node.isSymbolNode && ['x', 'y', 'z'].includes(node.name)) found.add(node.name);
    });
  } catch {
    /* ignora */
  }
  return found;
}

/** Sustituye textualmente la variable `from` por la expresión `toExpr`. */
function subst(expr: string, from: string, toExpr: string): string {
  const toNode = math.parse(toExpr);
  const out = math.parse(expr).transform((n: any) =>
    n.isSymbolNode && n.name === from ? toNode.cloneDeep() : n,
  );
  return out.toString();
}

function tex(expr: string): string {
  try {
    return math.parse(expr).toTex();
  } catch {
    return expr;
  }
}

/** Si `eq` es de la forma <var> = f(otras vars), devuelve {variable, fExpr}. */
function asExplicit(eq: Eq): { variable: 'x' | 'y' | 'z'; f: string } | null {
  const v = eq.lhs;
  if (v === 'x' || v === 'y' || v === 'z') {
    const rhsVars = varsIn(eq.rhs);
    if (!rhsVars.has(v)) return { variable: v, f: eq.rhs };
  }
  return null;
}

interface QuadCoeffs {
  c20: number;
  c02: number;
  c11: number;
  c10: number;
  c01: number;
  c00: number;
  isQuadratic: boolean;
}

/** Extrae coeficientes de F(x,y)=0 y verifica que sea realmente un polinomio de grado ≤ 2. */
function quadCoeffsXY(F: string): QuadCoeffs | null {
  try {
    const at = (node: any, x: number, y: number) => node.evaluate({ x, y });
    const Fn = math.parse(F);
    const fx = math.derivative(Fn, 'x');
    const fy = math.derivative(Fn, 'y');
    const fxx = math.derivative(fx, 'x');
    const fyy = math.derivative(fy, 'y');
    const fxy = math.derivative(fx, 'y');

    const c20 = at(fxx, 0, 0) / 2;
    const c02 = at(fyy, 0, 0) / 2;
    const c11 = at(fxy, 0, 0);
    const c10 = at(fx, 0, 0);
    const c01 = at(fy, 0, 0);
    const c00 = at(Fn, 0, 0);

    // Verificación: el modelo cuadrático debe coincidir con F en varios puntos.
    const model = (x: number, y: number) =>
      c20 * x * x + c02 * y * y + c11 * x * y + c10 * x + c01 * y + c00;
    const samples: [number, number][] = [
      [1.3, -0.7],
      [-2.1, 1.9],
      [0.5, 2.4],
      [-1.7, -1.1],
    ];
    let isQuadratic = true;
    for (const [x, y] of samples) {
      const actual = at(Fn, x, y);
      if (!Number.isFinite(actual) || Math.abs(actual - model(x, y)) > 1e-6 * (1 + Math.abs(actual))) {
        isQuadratic = false;
        break;
      }
    }
    return { c20, c02, c11, c10, c01, c00, isQuadratic };
  } catch {
    return null;
  }
}

/** Parametriza una cónica/recta dada por F(x,y)=0 a partir de sus coeficientes. */
function parametrizeConic(
  q: QuadCoeffs,
  cartesianTex: string,
): RecognizeResult {
  let { c20, c02, c11, c10, c01, c00 } = q;

  if (Math.abs(c11) > 1e-7) {
    return { ok: false, reason: 'Cónica rotada (término xy): aún no soportada. Usa el modo paramétrico.' };
  }

  // Caso recta: sin términos cuadráticos.
  if (Math.abs(c20) < EPS && Math.abs(c02) < EPS) {
    if (Math.abs(c10) < EPS && Math.abs(c01) < EPS) {
      return { ok: false, reason: 'La ecuación no describe una curva.' };
    }
    let expr: ParamExpr;
    if (Math.abs(c01) > EPS) {
      // y = -(c10 x + c00)/c01, con x = t
      const yExpr = `(-(${num(c10)}*t + ${num(c00)}))/(${num(c01)})`;
      expr = { x: 't', y: math.parse(yExpr).toString(), z: '0' };
    } else {
      // x = -c00/c10 constante, y = t
      expr = { x: num(-c00 / c10), y: 't', z: '0' };
    }
    return {
      ok: true,
      expr,
      tMin: -5,
      tMax: 5,
      dim: '2d',
      cartesian: cartesianTex,
      param: paramTex(expr),
      note: 'Recta en el plano.',
    };
  }

  // Normaliza signo para trabajar con coeficientes positivos cuando es elipse.
  if (c20 < 0 && c02 <= 0) {
    c20 = -c20;
    c02 = -c02;
    c10 = -c10;
    c01 = -c01;
    c00 = -c00;
  }

  // Parábola: un término cuadrático nulo y término lineal en la otra variable.
  if (Math.abs(c02) < EPS && Math.abs(c20) > EPS && Math.abs(c01) > EPS) {
    // y = -(c20 x² + c10 x + c00)/c01, con x = t
    const yExpr = `(-(${num(c20)}*t^2 + ${num(c10)}*t + ${num(c00)}))/(${num(c01)})`;
    const expr: ParamExpr = { x: 't', y: math.parse(yExpr).toString(), z: '0' };
    return { ok: true, expr, tMin: -4, tMax: 4, dim: '2d', cartesian: cartesianTex, param: paramTex(expr), note: 'Parábola.' };
  }
  if (Math.abs(c20) < EPS && Math.abs(c02) > EPS && Math.abs(c10) > EPS) {
    const xExpr = `(-(${num(c02)}*t^2 + ${num(c01)}*t + ${num(c00)}))/(${num(c10)})`;
    const expr: ParamExpr = { x: math.parse(xExpr).toString(), y: 't', z: '0' };
    return { ok: true, expr, tMin: -4, tMax: 4, dim: '2d', cartesian: cartesianTex, param: paramTex(expr), note: 'Parábola.' };
  }

  // Elipse o círculo: ambos términos cuadráticos con el mismo signo.
  if (c20 > EPS && c02 > EPS) {
    const x0 = -c10 / (2 * c20);
    const y0 = -c01 / (2 * c02);
    const K = c20 * x0 * x0 + c02 * y0 * y0 - c00;
    if (K <= EPS) {
      return { ok: false, reason: 'La ecuación no tiene solución real (no hay curva).' };
    }
    const a = Math.sqrt(K / c20);
    const b = Math.sqrt(K / c02);
    const xExpr = x0 === 0 ? `${num(a)}*cos(t)` : `${num(x0)} + ${num(a)}*cos(t)`;
    const yExpr = y0 === 0 ? `${num(b)}*sin(t)` : `${num(y0)} + ${num(b)}*sin(t)`;
    const expr: ParamExpr = { x: xExpr, y: yExpr, z: '0' };
    const isCircle = Math.abs(a - b) < 1e-6;
    return {
      ok: true,
      expr,
      tMin: 0,
      tMax: TAU,
      dim: '2d',
      cartesian: cartesianTex,
      param: paramTex(expr),
      note: isCircle ? `Círculo de radio ${num(a)}.` : `Elipse de semiejes ${num(a)} y ${num(b)}.`,
    };
  }

  // Signos opuestos → hipérbola (no es una curva cerrada simple).
  return { ok: false, reason: 'Parece una hipérbola: usa el modo paramétrico para graficar sus ramas.' };
}

function paramTex(expr: ParamExpr): string {
  const parts = [`x=${tex(expr.x)}`, `y=${tex(expr.y)}`];
  if (expr.z !== '0') parts.push(`z=${tex(expr.z)}`);
  return parts.join(',\\quad ');
}

function explicitToParam(variable: 'x' | 'y' | 'z', f: string): RecognizeResult {
  let expr: ParamExpr;
  let dim: Dim = '2d';
  if (variable === 'y') {
    expr = { x: 't', y: subst(f, 'x', 't'), z: '0' };
  } else if (variable === 'x') {
    expr = { x: subst(f, 'y', 't'), y: 't', z: '0' };
  } else {
    // z = f(x): curva en el plano xz
    expr = { x: 't', y: '0', z: subst(f, 'x', 't') };
    dim = '3d';
  }
  return {
    ok: true,
    expr,
    tMin: -5,
    tMax: 5,
    dim,
    cartesian: `${variable} = ${tex(f)}`,
    param: paramTex(expr),
  };
}

/** Reconoce intersecciones 3D de dos ecuaciones. */
function recognizePair(eqs: Eq[]): RecognizeResult {
  const explicits = eqs.map(asExplicit);

  // Patrón: ambas explícitas → x = t (p.ej. y = f(x), z = g(x)).
  if (explicits[0] && explicits[1]) {
    const expr: ParamExpr = { x: 't', y: '0', z: '0' };
    let okPattern = true;
    const cartParts: string[] = [];
    for (const e of explicits) {
      if (!e) { okPattern = false; break; }
      cartParts.push(`${e.variable} = ${tex(e.f)}`);
      if (e.variable === 'y') expr.y = subst(e.f, 'x', 't');
      else if (e.variable === 'z') expr.z = subst(e.f, 'x', 't');
      else { okPattern = false; }
    }
    if (okPattern) {
      return { ok: true, expr, tMin: -5, tMax: 5, dim: '3d', cartesian: cartParts.join(',\\ '), param: paramTex(expr) };
    }
  }

  // Patrón: un cilindro/círculo x²+y²=R y la otra ecuación da z = g(x,y) (o z = cte).
  let circleEq: Eq | null = null;
  let zEq: { variable: 'z'; f: string } | null = null;
  for (let i = 0; i < eqs.length; i++) {
    const ex = explicits[i];
    if (ex && ex.variable === 'z') {
      zEq = { variable: 'z', f: ex.f };
    } else {
      circleEq = eqs[i];
    }
  }
  if (circleEq && zEq) {
    const F = `(${circleEq.lhs}) - (${circleEq.rhs})`;
    const q = quadCoeffsXY(F);
    if (q && q.isQuadratic && Math.abs(q.c20 - q.c02) < 1e-9 && q.c20 > EPS && Math.abs(q.c11) < 1e-9) {
      const x0 = -q.c10 / (2 * q.c20);
      const y0 = -q.c01 / (2 * q.c02);
      const K = q.c20 * x0 * x0 + q.c02 * y0 * y0 - q.c00;
      if (K > EPS) {
        const r = Math.sqrt(K / q.c20);
        const xExpr = x0 === 0 ? `${num(r)}*cos(t)` : `${num(x0)} + ${num(r)}*cos(t)`;
        const yExpr = y0 === 0 ? `${num(r)}*sin(t)` : `${num(y0)} + ${num(r)}*sin(t)`;
        let zExpr = subst(zEq.f, 'x', xExpr);
        zExpr = subst(zExpr, 'y', yExpr);
        const expr: ParamExpr = {
          x: xExpr,
          y: yExpr,
          z: math.parse(zExpr).toString(),
        };
        return {
          ok: true,
          expr,
          tMin: 0,
          tMax: TAU,
          dim: '3d',
          cartesian: `${tex(circleEq.lhs)}=${tex(circleEq.rhs)},\\ z=${tex(zEq.f)}`,
          param: paramTex(expr),
          note: 'Intersección de un cilindro (o círculo) con una superficie z = g(x,y).',
        };
      }
    }
  }

  return {
    ok: false,
    reason: 'No reconocí esta intersección. Soporto cilindro∩(z=g) y pares explícitos (y=f(x), z=g(x)). Usa el modo paramétrico para casos más generales.',
  };
}

export function recognizeCartesian(input: string): RecognizeResult {
  const norm = normalize(input);
  if (!norm) return { ok: false, reason: 'Escribe una ecuación cartesiana.' };

  const eqStrings = splitEquations(norm);
  const eqs: Eq[] = [];
  for (const s of eqStrings) {
    const e = parseEquation(s);
    if (!e) return { ok: false, reason: `"${s}" no parece una ecuación (falta un "=").` };
    eqs.push(e);
  }

  if (eqs.length === 1) {
    const eq = eqs[0];
    const explicit = asExplicit(eq);
    if (explicit) return explicitToParam(explicit.variable, explicit.f);

    // Implícita en x, y → cónica o recta.
    const F = `(${eq.lhs}) - (${eq.rhs})`;
    const q = quadCoeffsXY(F);
    if (!q) return { ok: false, reason: 'No pude analizar la ecuación.' };
    if (!q.isQuadratic) {
      return { ok: false, reason: 'No reconozco esta forma implícita. Usa el modo paramétrico o escríbela como y = f(x).' };
    }
    return parametrizeConic(q, `${tex(eq.lhs)} = ${tex(eq.rhs)}`);
  }

  if (eqs.length === 2) {
    return recognizePair(eqs);
  }

  return { ok: false, reason: 'Soporto una ecuación (2D) o dos (intersección 3D).' };
}
