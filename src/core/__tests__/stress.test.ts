import { describe, it, expect } from 'vitest';
import { compileExpr, ParseError } from '../parser';
import { recognizeCartesian, type RecognizeOk } from '../cartesian';

describe('Parser AST Domain Validation Stress Tests', () => {
  it('should compile nested functions and evaluate them correctly', () => {
    const expr = compileExpr('sin(cos(tan(t)))', ['t']);
    expect(expr).toBeDefined();
    expect(expr.evaluate({ t: 0 })).toBeCloseTo(Math.sin(Math.cos(Math.tan(0))));
  });

  it('should handle division by zero or variables yielding infinity gracefully', () => {
    const expr = compileExpr('1 / (t - 2)', ['t']);
    expect(expr).toBeDefined();
    // At t=2, it should yield Infinity (or -Infinity/NaN depending on mathjs, let's verify)
    const val = expr.evaluate({ t: 2 });
    expect(val).toBe(Infinity);
  });

  it('should return NaN for out-of-domain mathematical calls (e.g. sqrt(-1))', () => {
    const expr = compileExpr('sqrt(t)', ['t']);
    // math.js returns complex number by default for negative values, which gets caught and returns NaN
    expect(expr.evaluate({ t: -4 })).toBeNaN();
  });

  it('should reject out-of-domain variables', () => {
    expect(() => compileExpr('t + u', ['t'])).toThrow(ParseError);
    expect(() => compileExpr('x + y', ['t'])).toThrow(ParseError);
  });

  it('should reject variable names that contain function names/constants as substrings if they are invalid symbols', () => {
    expect(() => compileExpr('t_val', ['t'])).toThrow(ParseError);
    expect(() => compileExpr('sin_t', ['t'])).toThrow(ParseError);
  });

  it('should reject disallowed AST nodes', () => {
    // ArrayNode
    expect(() => compileExpr('[1, 2, 3]', ['t'])).toThrow(ParseError);
    // ObjectNode
    expect(() => compileExpr('{a: t}', ['t'])).toThrow(ParseError);
    // AssignmentNode
    expect(() => compileExpr('t = 2', ['t'])).toThrow(ParseError);
    // AccessorNode
    expect(() => compileExpr('t.x', ['t'])).toThrow(ParseError);
  });
});

describe('Extended Intersection Support Stress Tests', () => {
  it('should support xy-cylinder intersected with plane', () => {
    const res = recognizeCartesian('x^2 + y^2 = 4, z = 5');
    expect(res.ok).toBe(true);
    const okRes = res as RecognizeOk;
    expect(okRes.expr.z).toBe('5');
    expect(okRes.expr.x).toContain('2*cos(t)');
    expect(okRes.expr.y).toContain('2*sin(t)');
  });

  it('should support yz-cylinder intersected with plane', () => {
    const res = recognizeCartesian('y^2 + z^2 = 9, x = -2');
    expect(res.ok).toBe(true);
    const okRes = res as RecognizeOk;
    expect(okRes.expr.x).toBe('-2');
    expect(okRes.expr.y).toContain('3*cos(t)');
    expect(okRes.expr.z).toContain('3*sin(t)');
  });

  it('should support xz-cylinder intersected with plane', () => {
    const res = recognizeCartesian('x^2 + z^2 = 16, y = 3');
    expect(res.ok).toBe(true);
    const okRes = res as RecognizeOk;
    expect(okRes.expr.y).toBe('3');
    expect(okRes.expr.x).toContain('4*cos(t)');
    expect(okRes.expr.z).toContain('4*sin(t)');
  });

  it('should support sphere/horizontal plane intersections', () => {
    const res = recognizeCartesian('x^2 + y^2 + z^2 = 9, z = 2');
    expect(res.ok).toBe(true);
    const okRes = res as RecognizeOk;
    // R^2 = 9 - 2^2 = 5 => R = sqrt(5) ≈ 2.236067977
    expect(okRes.expr.z).toBe('2');
    expect(okRes.expr.x).toContain('cos(t)');
    expect(okRes.expr.y).toContain('sin(t)');
  });

  it('should support sphere/vertical plane intersections (x plane)', () => {
    const res = recognizeCartesian('x^2 + y^2 + z^2 = 25, x = 3');
    expect(res.ok).toBe(true);
    const okRes = res as RecognizeOk;
    // R^2 = 25 - 3^2 = 16 => R = 4
    expect(okRes.expr.x).toBe('3');
    expect(okRes.expr.y).toContain('4*cos(t)');
    expect(okRes.expr.z).toContain('4*sin(t)');
  });

  it('should reject non-intersecting sphere/plane intersections gracefully', () => {
    const res = recognizeCartesian('x^2 + y^2 + z^2 = 4, z = 3');
    expect(res.ok).toBe(false);
  });

  it('should reject degenerate sphere/plane intersections gracefully', () => {
    const res = recognizeCartesian('x^2 + y^2 + z^2 = 4, z = 2');
    expect(res.ok).toBe(false);
  });
});

describe('Case-Insensitivity Inputs Stress Tests', () => {
  it('should normalize and compile mixed case functions and variables', () => {
    const expr = compileExpr('SiN(cOs(T)) + pI * t', ['t']);
    expect(expr).toBeDefined();
    expect(expr.source).toBe('sin(cos(t)) + pi * t');
  });

  it('should evaluate mixed case scope variables correctly', () => {
    const expr = compileExpr('T^2', ['t']);
    expect(expr.evaluate({ T: 3 })).toBe(9);
    expect(expr.evaluate({ t: 3 })).toBe(9);
  });

  it('should recognize mixed case cartesian equations', () => {
    const res = recognizeCartesian('X^2 + Y^2 = 4, z = y');
    expect(res.ok).toBe(true);
    const okRes = res as RecognizeOk;
    expect(okRes.expr.x).toContain('2*cos(t)');
    expect(okRes.expr.y).toContain('2*sin(t)');
  });
});
