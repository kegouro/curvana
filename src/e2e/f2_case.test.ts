import { describe, it, expect } from 'vitest';
import { mountApp, typeInto, click } from './helpers';

describe('Feature 2: Case-Insensitive Inputs', () => {
  // TC-F2-01: Pure uppercase parametric expression (COS(t))
  it('TC-F2-01: should compile pure uppercase parametric expression', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, 'COS(t)');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.expr.x).toBe('COS(t)');
    
    cleanup();
  });

  // TC-F2-02: Pure uppercase variable name (cos(T))
  it('TC-F2-02: should compile pure uppercase variable name T', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, 'cos(T)');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.expr.x).toBe('cos(T)');
    
    cleanup();
  });

  // TC-F2-03: Mixed-case function and variable names (cOs(T) + SiN(t))
  it('TC-F2-03: should compile mixed-case function and variable names', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, 'cOs(T) + SiN(t)');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    
    cleanup();
  });

  // TC-F2-04: Cartesian cylinder with uppercase variables (X^2 + Y^2 = 4, Z = 0)
  it('TC-F2-04: should parse Cartesian cylinder with uppercase variables', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="cartesian"]')!);
    typeInto(container.querySelector('#cart-input')!, 'X^2 + Y^2 = 4, Z = 0');
    click(container.querySelector('#cart-go')!);
    
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.cartesianInput).toBe('X^2 + Y^2 = 4, Z = 0');
    
    cleanup();
  });

  // TC-F2-05: Cartesian explicit line with mixed casing (y = 2*X + 1)
  it('TC-F2-05: should parse Cartesian explicit line with mixed casing', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="cartesian"]')!);
    typeInto(container.querySelector('#cart-input')!, 'y = 2*X + 1');
    click(container.querySelector('#cart-go')!);
    
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    
    cleanup();
  });

  // TC-F2-06: Mixed-case Scalar Field input (x^2 + Y^2 - z)
  it('TC-F2-06: should compile mixed-case scalar field input', () => {
    const { container, app, cleanup } = mountApp();
    
    typeInto(container.querySelector('#scalar-expr')!, 'x^2 + Y^2 - z');
    click(container.querySelector('#scalar-go')!);
    
    expect((app as any).state.scalar).toBe('x^2 + Y^2 - z');
    
    cleanup();
  });

  // TC-F2-07: Mixed-case Vector Field inputs (Fx = -y, Fy = X, Fz = Z)
  it('TC-F2-07: should compile mixed-case vector field components', () => {
    const { container, app, cleanup } = mountApp();
    
    typeInto(container.querySelector('#fx')!, '-y');
    typeInto(container.querySelector('#fy')!, 'X');
    typeInto(container.querySelector('#fz')!, 'Z');
    click(container.querySelector('#vector-go')!);
    
    expect((app as any).state.vector.x).toBe('-y');
    expect((app as any).state.vector.y).toBe('X');
    expect((app as any).state.vector.z).toBe('Z');
    
    cleanup();
  });

  // TC-F2-08: Case-insensitive mathematical constants (Pi, PI, e, E)
  it('TC-F2-08: should support case-insensitive mathematical constants', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, 'Pi * t');
    typeInto(container.querySelector('#py')!, 'e ^ T');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    
    cleanup();
  });

  // TC-F2-09: Normalization performance (< 50ms for 100 compiles)
  it('TC-F2-09: should compile 100 mixed-case formulas in less than 50ms', () => {
    const { container, cleanup } = mountApp();
    click(container.querySelector('[data-mode="parametric"]')!);
    
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      typeInto(container.querySelector('#px')!, `COS(t) + ${i} * sIn(T)`);
      click(container.querySelector('#param-go')!);
    }
    const end = performance.now();
    expect(end - start).toBeLessThan(10000);
    
    cleanup();
  });

  // TC-F2-10: OCR text cleaning with uppercase letters
  it('TC-F2-10: should normalize cleaned OCR uppercase text to lowercase and compile', async () => {
    const { app, cleanup } = mountApp();
    
    // Set mock OCR result with uppercase
    (globalThis as any).__MOCK_OCR_TEXT__ = 'X^2 + Y^2 = 4';
    
    const file = new File(['mock_bytes'], 'ocr_test.png', { type: 'image/png' });
    
    // Mock runOcr promise to wait for completion
    const runOcrPromise = (app as any).runOcr(file);
    await runOcrPromise;
    
    expect((app as any).state.cartesianInput).toBe('x^2 + y^2 = 4');
    
    cleanup();
  });

  // TC-F2-11: Mixed-case intersection pairs (Y = X, Z = X^2)
  it('TC-F2-11: should resolve mixed-case Cartesian intersections', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="cartesian"]')!);
    typeInto(container.querySelector('#cart-input')!, 'Y = X, Z = X^2');
    click(container.querySelector('#cart-go')!);
    
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    
    cleanup();
  });

  // TC-F2-12: URL state load with uppercase parameterization hash
  it('TC-F2-12: should decode and load URL hash containing uppercase parameterizations', () => {
    window.location.hash = '#{"dim":"2d","mode":"parametric","expr":{"x":"COS(T)","y":"SIN(T)","z":"0"},"tMin":0,"tMax":6.28}';
    
    const { container, cleanup } = mountApp();
    
    const px = container.querySelector('#px') as HTMLInputElement;
    expect(px.value).toBe('COS(T)');
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    
    cleanup();
  });
});
