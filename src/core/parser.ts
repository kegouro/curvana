// Envoltura de math.js: compila expresiones matemáticas con validación
// y mensajes de error amigables. Núcleo puro, sin DOM.
import { create, all, type EvalFunction } from 'mathjs';

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
  const trimmed = source.trim().toLowerCase();
  if (trimmed === '') {
    throw new ParseError('La expresión está vacía.');
  }

  if (/([\+\-\*\/^]\s*[\*\/^])|(\+\s*\+)|(\-\s*\-)/.test(trimmed)) {
    throw new ParseError('Error de sintaxis: operadores consecutivos detectados.');
  }

  const lowerAllowed = allowedVars.map((v) => v.toLowerCase());

  let parsed: any;
  try {
    parsed = math.parse(trimmed);
  } catch {
    throw new ParseError(`No pude leer "${source}". Revisa la sintaxis (por ejemplo usa sin(t), no sin t).`);
  }

  const ALLOWED_NODE_TYPES = new Set([
    'SymbolNode',
    'ConstantNode',
    'OperatorNode',
    'FunctionNode',
    'ParenthesisNode',
    'ConditionalNode',
  ]);

  // Validar AST estáticamente
  parsed.traverse((node: any, path: string, parent: any) => {
    if (!ALLOWED_NODE_TYPES.has(node.type)) {
      throw new ParseError(`Operación o sintaxis no permitida: "${node.type}".`);
    }

    if (node.type === 'ConstantNode') {
      if (typeof node.value !== 'number' && typeof node.value !== 'boolean') {
        throw new ParseError(`Constante no permitida: "${node.value}".`);
      }
    }

    if (node.type === 'SymbolNode') {
      const name = node.name;
      if (parent && parent.type === 'FunctionNode' && path === 'fn') {
        if (typeof (math as any)[name] !== 'function') {
          throw new ParseError(`Función desconocida "${name}".`);
        }
      } else {
        if (lowerAllowed.includes(name)) {
          // Valid variable
        } else if (typeof (math as any)[name] === 'function') {
          throw new ParseError(`La función "${name}" debe llamarse con argumentos, por ejemplo: "${name}(t)".`);
        } else if (name in math) {
          // Valid constant/value in mathjs
        } else {
          const vars = allowedVars.map((v) => `"${v}"`).join(', ');
          throw new ParseError(`Variable desconocida "${name}". En este campo solo puedes usar ${vars}.`);
        }
      }
    }
  });

  let code: EvalFunction;
  try {
    code = parsed.compile();
  } catch {
    throw new ParseError(`No pude compilar "${source}".`);
  }

  return {
    source: trimmed,
    evaluate(scope: Record<string, number>): number {
      try {
        const lowerScope: Record<string, number> = {};
        for (const key of Object.keys(scope)) {
          lowerScope[key.toLowerCase()] = scope[key];
        }
        const v = code.evaluate(lowerScope);
        return typeof v === 'number' ? v : NaN;
      } catch {
        return NaN;
      }
    },
  };
}

/** Acceso al math.js configurado (para el reconocedor de cartesianas). */
export const mathjs = math;
