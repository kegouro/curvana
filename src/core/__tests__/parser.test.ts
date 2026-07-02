import { describe, it, expect } from 'vitest';
import { compileExpr, ParseError } from '../parser';

describe('compilador de expresiones (compileExpr)', () => {
  it('permite expresiones válidas con las variables permitidas', () => {
    const expr = compileExpr('t^2 + sin(t)', ['t']);
    expect(expr.evaluate({ t: 2 })).toBeCloseTo(4 + Math.sin(2));
  });

  it('no da error de dominio en compilación para log(t-1) o 1/(t-0.41)', () => {
    // Estas expresiones fallarían con la evaluación de prueba t=0.41,
    // pero con validación estática del AST deben compilar correctamente.
    const expr1 = compileExpr('log(t - 1)', ['t']);
    expect(expr1).toBeDefined();
    // En ejecución a un valor fuera de dominio debe dar NaN
    expect(expr1.evaluate({ t: 0.41 })).toBeNaN();
    // Dentro de dominio debe funcionar
    expect(expr1.evaluate({ t: 2 })).toBeCloseTo(Math.log(1));

    const expr2 = compileExpr('1 / (t - 0.41)', ['t']);
    expect(expr2).toBeDefined();
    expect(expr2.evaluate({ t: 0.41 })).toBe(Infinity);
    expect(expr2.evaluate({ t: 1 })).toBeCloseTo(1 / 0.59);
  });

  it('rechaza nombres de función usados como variables independientes', () => {
    expect(() => {
      compileExpr('t + sin', ['t']);
    }).toThrowError(ParseError);

    try {
      compileExpr('t + sin', ['t']);
    } catch (e: any) {
      expect(e.message).toContain('La función "sin" debe llamarse con argumentos');
    }
  });

  it('rechaza variables desconocidas con mensaje amigable', () => {
    expect(() => {
      compileExpr('t + x', ['t']);
    }).toThrowError(ParseError);

    try {
      compileExpr('t + x', ['t']);
    } catch (e: any) {
      expect(e.message).toContain('Variable desconocida "x"');
      expect(e.message).toContain('puedes usar "t"');
    }
  });

  it('rechaza funciones desconocidas', () => {
    expect(() => {
      compileExpr('unknown_func(t)', ['t']);
    }).toThrowError(ParseError);

    try {
      compileExpr('unknown_func(t)', ['t']);
    } catch (e: any) {
      expect(e.message).toContain('Función desconocida "unknown_func"');
    }
  });

  it('normaliza las expresiones y variables de forma insensible a mayúsculas', () => {
    // Expresión con mayúsculas y variable en minúscula
    const expr = compileExpr('T + SIN(T)', ['t']);
    expect(expr.source).toBe('t + sin(t)');
    
    // Evaluar con scope en minúsculas
    expect(expr.evaluate({ t: 0.5 })).toBeCloseTo(0.5 + Math.sin(0.5));
    
    // Evaluar con scope en mayúsculas
    expect(expr.evaluate({ T: 0.5 })).toBeCloseTo(0.5 + Math.sin(0.5));
  });

  it('rechaza tipos de nodos no permitidos como asignaciones', () => {
    expect(() => {
      compileExpr('t = 5', ['t']);
    }).toThrowError(ParseError);
  });

  it('rechaza constantes no numéricas ni booleanas', () => {
    expect(() => {
      compileExpr('"hola"', ['t']);
    }).toThrowError(ParseError);
  });
});
