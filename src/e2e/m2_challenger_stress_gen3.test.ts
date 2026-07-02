import { describe, it, expect } from 'vitest';
import { mountApp, typeInto, click } from './helpers';
import { cleanOcrText } from '../services/ocr/OcrProvider';
import { compileExpr, ParseError } from '../core/parser';
import { recognizeCartesian } from '../core/cartesian';

describe('Challenger M2-2 Stress and Robustness Tests', () => {

  describe('1. OCR Cleaning - Edge Cases and Load', () => {
    it('should clean large multi-line comments without performance lag or crash', () => {
      // Create a large text with 5000 lines of comments, empty lines, and some math
      const commentLines = Array.from({ length: 5000 }, (_, i) => 
        i % 2 === 0 ? `# Comment number ${i}` : `// Comment number ${i} with random text`
      );
      const text = [
        ...commentLines.slice(0, 2500),
        '  x^2 + y^2 = 4  ',
        '',
        '  ',
        ...commentLines.slice(2500),
        'z = 2'
      ].join('\n');

      const start = performance.now();
      const cleaned = cleanOcrText(text);
      const end = performance.now();

      expect(cleaned).toBe('x^2 + y^2 = 4, z = 2');
      expect(end - start).toBeLessThan(100); // Should run in less than 100ms
    });

    it('should clean multiple delimiters, empty or spaces-only lines, and weird separators', () => {
      const input = '\n\n   \n   x^2 + y^2 = 4   \n\n\n   z = 2  \n\n';
      const cleaned = cleanOcrText(input);
      expect(cleaned).toBe('x^2 + y^2 = 4, z = 2');
    });

    it('should handle invalid carets and spacing around them safely', () => {
      // Spacing normalization around caret should make it clean but parse error will be caught later
      const input = 'x   ^   ^   2 = 4\n  z   ^   ';
      const cleaned = cleanOcrText(input);
      // REGEX_POW_SPACES replaces \s*\^\s* with ^
      // So 'x   ^   ^   2' becomes 'x^^2'
      expect(cleaned).toBe('x^^2 = 4, z^');
    });

    it('should handle empty or whitespace-only inputs returning empty string', () => {
      expect(cleanOcrText('')).toBe('');
      expect(cleanOcrText('   ')).toBe('');
      expect(cleanOcrText('\n\n\n')).toBe('');
      expect(cleanOcrText(' \n \n ')).toBe('');
    });
  });

  describe('2. Control Panel - Math Expression Stress and Safety', () => {
    it('should reject mismatched parentheses safely without crashing', () => {
      const mismatchedInputs = [
        '(((x + y)',
        'x + y)',
        'sin(x + cos(y',
        ')x + y(',
        '(()()()'
      ];

      for (const input of mismatchedInputs) {
        // Direct compilation should throw ParseError
        expect(() => compileExpr(input, ['x', 'y', 'z'])).toThrow(ParseError);
        
        // Cartesian recognition should fail gracefully
        const res = recognizeCartesian(input);
        expect(res.ok).toBe(false);
      }
    });

    it('should reject unknown functions', () => {
      expect(() => compileExpr('unknown_fn(x)', ['x', 'y', 'z'])).toThrow(ParseError);
    });

    it('should handle property access and prototype methods correctly', () => {
      // Let's see what happens with each of these
      const checkThrows = (input: string) => {
        try {
          compileExpr(input, ['x', 'y', 'z']);
          return false;
        } catch (e) {
          return true;
        }
      };

      expect(checkThrows('eval("x + y")')).toBe(true);
      expect(checkThrows('__proto__(x)')).toBe(true);
      
      // Let's log or assert other properties
      // Note: math.js might allow some prototype properties if they resolve to functions/values
      // We check their safety and how they are parsed.
      console.log('toString() throws:', checkThrows('toString()'));
      console.log('constructor(x) throws:', checkThrows('constructor(x)'));
      console.log('valueOf() throws:', checkThrows('valueOf()'));
      console.log('y.toString() throws:', checkThrows('y.toString()'));
    });

    it('should reject variable names that contain function names as invalid symbols', () => {
      const inputs = [
        'x_sin',
        'cos_y',
        'xtan',
        'zpi'
      ];

      for (const input of inputs) {
        expect(() => compileExpr(input, ['x', 'y', 'z'])).toThrow(ParseError);
      }
    });

    it('should reject consecutive operators in parser', () => {
      const consecutiveOps = [
        'x + * y',
        'x - / y',
        'x * * 2',
        'x / / 2',
        'x ++ y',
        'x -- y',
        'x ^ ^ 2'
      ];

      for (const input of consecutiveOps) {
        expect(() => compileExpr(input, ['x', 'y', 'z'])).toThrow(ParseError);
      }
    });

    it('should evaluate division by zero and propagate NaN / Infinity gracefully', () => {
      const exprDivZero = compileExpr('x / 0', ['x', 'y', 'z']);
      expect(exprDivZero.evaluate({ x: 5, y: 0, z: 0 })).toBe(Infinity);

      const exprDivDiff = compileExpr('1 / (y - y)', ['x', 'y', 'z']);
      expect(exprDivDiff.evaluate({ x: 0, y: 2, z: 0 })).toBe(Infinity);

      const exprSqrtNeg = compileExpr('sqrt(x)', ['x', 'y', 'z']);
      expect(exprSqrtNeg.evaluate({ x: -4, y: 0, z: 0 })).toBeNaN();
    });

    it('should handle deeply nested math calls safely', () => {
      // 100 nested sin calls: sin(sin(sin(...sin(x)...)))
      const nestedExpr = 'sin('.repeat(100) + 'x' + ')'.repeat(100);
      const compiled = compileExpr(nestedExpr, ['x', 'y', 'z']);
      expect(compiled).toBeDefined();
      const val = compiled.evaluate({ x: 1, y: 0, z: 0 });
      expect(typeof val).toBe('number');
      expect(Number.isNaN(val)).toBe(false);
    });

    it('should show error banner in UI control panel and not crash on invalid scalar/vector inputs', () => {
      const { container, app, cleanup } = mountApp();

      // Enable scalar layer check
      const tgScalar = container.querySelector('#tg-scalar') as HTMLInputElement;
      tgScalar.checked = true;
      tgScalar.dispatchEvent(new Event('change', { bubbles: true }));

      const scalarInput = container.querySelector('#scalar-expr') as HTMLInputElement;
      const scalarBtn = container.querySelector('#scalar-go') as HTMLButtonElement;
      const scalarMsg = container.querySelector('#scalar-msg')!;

      // 1. Mismatched parentheses
      typeInto(scalarInput, 'x + (y');
      click(scalarBtn);
      expect((app as any).scalarField).toBeNull();
      expect(scalarMsg.classList.contains('error')).toBe(true);
      expect(scalarMsg.textContent).toContain('Revisa la sintaxis');

      // 2. Unknown function
      typeInto(scalarInput, 'notafunction(x)');
      click(scalarBtn);
      expect((app as any).scalarField).toBeNull();
      expect(scalarMsg.classList.contains('error')).toBe(true);
      expect(scalarMsg.textContent).toContain('Función desconocida');

      // 3. Unknown variable
      typeInto(scalarInput, 'x + y + w');
      click(scalarBtn);
      expect((app as any).scalarField).toBeNull();
      expect(scalarMsg.classList.contains('error')).toBe(true);
      expect(scalarMsg.textContent).toContain('Variable desconocida "w"');

      // 4. Consecutive operators
      typeInto(scalarInput, 'x * * y');
      click(scalarBtn);
      expect((app as any).scalarField).toBeNull();
      expect(scalarMsg.classList.contains('error')).toBe(true);
      expect(scalarMsg.textContent).toContain('operadores consecutivos');

      // 5. Correct input clears error
      typeInto(scalarInput, 'x + y + z');
      click(scalarBtn);
      expect((app as any).scalarField).not.toBeNull();
      expect(scalarMsg.classList.contains('error')).toBe(false);

      cleanup();
    });
  });
});
