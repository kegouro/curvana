// Cuadratura numérica (regla compuesta de Simpson). Núcleo puro.

/**
 * Integra g sobre [a, b] con la regla compuesta de Simpson.
 * Los valores no finitos se tratan como 0 para robustez ante singularidades.
 */
export function integrate(g: (t: number) => number, a: number, b: number, n = 400): number {
  if (b === a) return 0;
  if (n % 2 === 1) n += 1;
  const h = (b - a) / n;
  const safe = (t: number): number => {
    const v = g(t);
    return Number.isFinite(v) ? v : 0;
  };

  let sum = safe(a) + safe(b);
  for (let i = 1; i < n; i++) {
    sum += (i % 2 === 0 ? 2 : 4) * safe(a + i * h);
  }
  return (h / 3) * sum;
}
