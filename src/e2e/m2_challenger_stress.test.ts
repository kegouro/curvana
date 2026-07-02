import { describe, it, expect } from 'vitest';
import { mountApp, typeInto, click } from './helpers';
import { cleanOcrText } from '../services/ocr/OcrProvider';

describe('Milestone M2 Challenger Stress Tests', () => {
  describe('1. OCR Text Cleaner Stress Tests', () => {
    it('should join lines with commas, ignore comments and empty lines', () => {
      const input = `
        # This is a leading comment
        x^2 + y^2 = 4
        
        // This is a middle comment
        z = 2
        
        # Another comment
      `;
      const cleaned = cleanOcrText(input);
      expect(cleaned).toBe('x^2 + y^2 = 4, z = 2');
    });

    it('should clean weird unicode spaces and normalize spacing around operator/powers', () => {
      // Input with various unicode spaces:
      // \u2000 (en quad), \u2003 (em space), \u2009 (thin space), \u3000 (ideographic space), \u00a0 (no-break space)
      const input = `x\u2000^\u20032\u00a0+\u3000y\u2009^\u20002\u2003=\u30004\nz\u2009=\u20092`;
      const cleaned = cleanOcrText(input);
      expect(cleaned).toBe('x^2 + y^2 = 4, z = 2');
    });

    it('should resolve math symbols (multiplication, division, minus, quotes, powers, sqrt, pi) correctly', () => {
      const input = `x × y ÷ z = 1\na − b = 2\n“c” = d\ny² + z³ = 9\n√x = π`;
      const cleaned = cleanOcrText(input);
      expect(cleaned).toBe('x * y / z = 1, a - b = 2, c = d, y^2 + z^3 = 9, sqrtx = pi');
    });

    it('should not crash on empty, null, undefined or whitespace-only text', () => {
      expect(cleanOcrText('')).toBe('');
      expect(cleanOcrText('   ')).toBe('');
      expect(cleanOcrText('\n\n\n')).toBe('');
      expect(cleanOcrText('# comment only\n// comment only')).toBe('');
    });
  });

  describe('2. Scalar and Vector Field UI Input Stress Tests', () => {
    it('should report compiler errors in the UI for invalid scalar syntax (mismatched parens, invalid operator sequence)', () => {
      const { container, app, cleanup } = mountApp();

      // Enable scalar layer check so it gets applied
      const tgScalar = container.querySelector('#tg-scalar') as HTMLInputElement;
      tgScalar.checked = true;
      tgScalar.dispatchEvent(new Event('change', { bubbles: true }));

      const input = container.querySelector('#scalar-expr') as HTMLInputElement;
      const applyBtn = container.querySelector('#scalar-go') as HTMLButtonElement;

      // 1. Mismatched parentheses
      typeInto(input, '(x + y');
      click(applyBtn);

      expect((app as any).scalarField).toBeNull();
      const msgEl = container.querySelector('#scalar-msg')!;
      expect(msgEl.classList.contains('error')).toBe(true);
      expect(msgEl.textContent).toContain('Revisa la sintaxis');

      // 2. Invalid operator sequence
      typeInto(input, 'x + * y');
      click(applyBtn);

      expect((app as any).scalarField).toBeNull();
      expect(msgEl.classList.contains('error')).toBe(true);
      expect(msgEl.textContent).toContain('operadores consecutivos');

      // 3. Empty expression
      typeInto(input, '   ');
      click(applyBtn);

      expect((app as any).scalarField).toBeNull();
      expect(msgEl.classList.contains('error')).toBe(true);
      expect(msgEl.textContent).toContain('vacía');

      cleanup();
    });

    it('should report compiler errors in the UI for unknown variables in scalar field (e.g. t, w)', () => {
      const { container, app, cleanup } = mountApp();

      const input = container.querySelector('#scalar-expr') as HTMLInputElement;
      const applyBtn = container.querySelector('#scalar-go') as HTMLButtonElement;
      const msgEl = container.querySelector('#scalar-msg')!;

      // Variable 't' is not allowed in fields (only x, y, z)
      typeInto(input, 'x + y + t');
      click(applyBtn);

      expect((app as any).scalarField).toBeNull();
      expect(msgEl.classList.contains('error')).toBe(true);
      expect(msgEl.textContent).toContain('Variable desconocida "t"');

      // Variable 'w' is not allowed
      typeInto(input, 'x + y + w');
      click(applyBtn);

      expect((app as any).scalarField).toBeNull();
      expect(msgEl.classList.contains('error')).toBe(true);
      expect(msgEl.textContent).toContain('Variable desconocida "w"');

      cleanup();
    });

    it('should report compiler errors in the UI for invalid vector field syntax and unknown variables', () => {
      const { container, app, cleanup } = mountApp();

      // Enable vector layer check
      const tgVector = container.querySelector('#tg-vector') as HTMLInputElement;
      tgVector.checked = true;
      tgVector.dispatchEvent(new Event('change', { bubbles: true }));

      const fx = container.querySelector('#fx') as HTMLInputElement;
      const fy = container.querySelector('#fy') as HTMLInputElement;
      const fz = container.querySelector('#fz') as HTMLInputElement;
      const applyBtn = container.querySelector('#vector-go') as HTMLButtonElement;
      const msgEl = container.querySelector('#vector-msg')!;

      // 1. Mismatched parentheses in component
      typeInto(fx, 'sin(x');
      typeInto(fy, 'y');
      typeInto(fz, 'z');
      click(applyBtn);

      expect((app as any).vectorField).toBeNull();
      expect(msgEl.classList.contains('error')).toBe(true);
      expect(msgEl.textContent).toContain('Revisa la sintaxis');

      // 2. Unknown variable in component
      typeInto(fx, 'x');
      typeInto(fy, 'y + t'); // 't' is invalid
      typeInto(fz, 'z');
      click(applyBtn);

      expect((app as any).vectorField).toBeNull();
      expect(msgEl.classList.contains('error')).toBe(true);
      expect(msgEl.textContent).toContain('Variable desconocida "t"');

      // 3. Consecutive operators
      typeInto(fx, 'x');
      typeInto(fy, 'y');
      typeInto(fz, 'z + - - 1'); // syntax error
      click(applyBtn);

      expect((app as any).vectorField).toBeNull();
      expect(msgEl.classList.contains('error')).toBe(true);
      expect(msgEl.textContent).toContain('operadores consecutivos');

      cleanup();
    });

    it('should compile divide by zero field expressions successfully and evaluate to Infinity/NaN without crashing the UI or rendering', () => {
      const { container, app, cleanup } = mountApp();

      // Enable layers
      const tgScalar = container.querySelector('#tg-scalar') as HTMLInputElement;
      tgScalar.checked = true;
      tgScalar.dispatchEvent(new Event('change', { bubbles: true }));

      const tgVector = container.querySelector('#tg-vector') as HTMLInputElement;
      tgVector.checked = true;
      tgVector.dispatchEvent(new Event('change', { bubbles: true }));

      const scalarInput = container.querySelector('#scalar-expr') as HTMLInputElement;
      const scalarBtn = container.querySelector('#scalar-go') as HTMLButtonElement;
      const fx = container.querySelector('#fx') as HTMLInputElement;
      const fy = container.querySelector('#fy') as HTMLInputElement;
      const fz = container.querySelector('#fz') as HTMLInputElement;
      const vectorBtn = container.querySelector('#vector-go') as HTMLButtonElement;

      // 1. Divide by zero in scalar field (x / 0)
      typeInto(scalarInput, 'x / 0');
      click(scalarBtn);

      expect((app as any).scalarField).not.toBeNull();
      const scalarMsg = container.querySelector('#scalar-msg')!;
      expect(scalarMsg.classList.contains('error')).toBe(false);
      expect((app as any).scalarField.eval([1, 2, 3])).toBe(Infinity);

      // 2. Division by zero variable difference (1 / (y - y))
      typeInto(scalarInput, '1 / (y - y)');
      click(scalarBtn);

      expect((app as any).scalarField).not.toBeNull();
      expect(scalarMsg.classList.contains('error')).toBe(false);
      expect((app as any).scalarField.eval([1, 2, 3])).toBe(Infinity); // 1 / 0 is Infinity

      // 3. Divide by zero in vector field components
      typeInto(fx, 'x / 0');
      typeInto(fy, 'y / (z - z)');
      typeInto(fz, 'z');
      click(vectorBtn);

      expect((app as any).vectorField).not.toBeNull();
      const vectorMsg = container.querySelector('#vector-msg')!;
      expect(vectorMsg.classList.contains('error')).toBe(false);
      const evalVec = (app as any).vectorField.eval([1, 2, 3]);
      expect(evalVec[0]).toBe(Infinity);
      expect(evalVec[1]).toBe(Infinity);
      expect(evalVec[2]).toBe(3);

      cleanup();
    });
  });
});
