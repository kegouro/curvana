// Envoltura de math.js: compila expresiones matemáticas con validación
// y mensajes de error amigables. Núcleo puro, sin DOM.
import { create, all } from 'mathjs';

const math = create(all, {});

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export interface CompiledExpr {
  source: string;
  /** Evalúa la expresión; devuelve NaN si algo falla en tiempo de ejecución. */
  evaluate(scope: Record<string, number>): number;
}

/**
 * Compila `source` permitiendo solo las variables de `allowedVars`
 * (además de constantes y funciones de math.js: pi, e, sin, cos, ...).
 * Lanza ParseError con un mensaje claro si la expresión es inválida.
 */
export function compileExpr(source: string, allowedVars: string[]): CompiledExpr {
  const trimmed = source.trim();
  if (trimmed === '') {
    throw new ParseError('La expresión está vacía.');
  }

  let code: ReturnType<typeof math.compile>;
  try {
    code = math.compile(trimmed);
  } catch {
    throw new ParseError(`No pude leer "${source}". Revisa la sintaxis (por ejemplo usa sin(t), no sin t).`);
  }

  // Evaluación de prueba para detectar variables desconocidas y resultados no numéricos.
  const testScope: Record<string, number> = {};
  for (const v of allowedVars) testScope[v] = 0.41;

  try {
    const value = code.evaluate(testScope);
    if (typeof value !== 'number') {
      throw new ParseError(`"${source}" no devuelve un número.`);
    }
  } catch (e) {
    if (e instanceof ParseError) throw e;
    const msg = (e as Error).message ?? '';
    const m = msg.match(/Undefined symbol (\w+)/);
    if (m) {
      const vars = allowedVars.map((v) => `"${v}"`).join(', ');
      throw new ParseError(`Variable desconocida "${m[1]}". En este campo solo puedes usar ${vars}.`);
    }
    throw new ParseError(`No pude evaluar "${source}".`);
  }

  return {
    source: trimmed,
    evaluate(scope: Record<string, number>): number {
      try {
        const v = code.evaluate(scope);
        return typeof v === 'number' ? v : NaN;
      } catch {
        return NaN;
      }
    },
  };
}

/** Acceso al math.js configurado (para el reconocedor de cartesianas). */
export const mathjs = math;
