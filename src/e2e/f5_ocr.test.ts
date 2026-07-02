import { describe, it, expect } from 'vitest';
import { mountApp, typeInto, click } from './helpers';
import { cleanOcrText } from '../services/ocr/OcrProvider';

describe('Feature 5: Multi-line OCR Equations', () => {
  // TC-F5-01: Single-line OCR text cleaning (x^2 + y^2 = 4)
  it('TC-F5-01: should clean single-line OCR text and return same', () => {
    const cleaned = cleanOcrText('x^2 + y^2 = 4');
    expect(cleaned).toBe('x^2 + y^2 = 4');
  });

  // TC-F5-02: Two-line OCR text cleaning (x^2 + y^2 = 4\nz = 2)
  it('TC-F5-02: should clean and join two-line OCR text with a comma', () => {
    const cleaned = cleanOcrText('x^2 + y^2 = 4\nz = 2');
    expect(cleaned).toBe('x^2 + y^2 = 4, z = 2');
  });

  // TC-F5-03: Three-line OCR text (y^2 + z^2 = 9\nx = y\nz = x)
  it('TC-F5-03: should clean and join three-line OCR text with commas', () => {
    const cleaned = cleanOcrText('y^2 + z^2 = 9\nx = y\nz = x');
    expect(cleaned).toBe('y^2 + z^2 = 9, x = y, z = x');
  });

  // TC-F5-04: Noisy OCR text containing Math symbols
  it('TC-F5-04: should clean math symbols like ×, ÷, − to standard operators', () => {
    const cleaned = cleanOcrText('x × y = z\nx ÷ y = 2\na − b = 1');
    expect(cleaned).toContain('*');
    expect(cleaned).toContain('/');
    expect(cleaned).toContain('-');
  });

  // TC-F5-05: OCR text containing power characters and square root
  it('TC-F5-05: should replace power symbols ² and ³ and square root √', () => {
    const cleaned = cleanOcrText('y² + z³ = 1\nx = √y');
    expect(cleaned).toContain('y^2');
    expect(cleaned).toContain('z^3');
    expect(cleaned).toContain('sqrty');
  });

  // TC-F5-06: Empty or whitespace-only OCR text
  it('TC-F5-06: should set status message to error for empty OCR text', async () => {
    const { container, app, cleanup } = mountApp();
    
    (globalThis as any).__MOCK_OCR_TEXT__ = '   \n  ';
    
    const file = new File(['mock_bytes'], 'ocr_test.png', { type: 'image/png' });
    const runOcrPromise = (app as any).runOcr(file);
    await runOcrPromise;
    
    const status = container.querySelector('#ocr-status')!;
    expect(status.textContent).toContain('No pude leer la imagen');
    
    cleanup();
  });

  // TC-F5-07: Multi-line OCR with empty lines or comments
  it('TC-F5-07: should ignore empty lines and comments in multiline OCR text', () => {
    const cleaned = cleanOcrText('\n  x^2 + y^2 = 4  \n\n  z = 2  \n');
    expect(cleaned).toBe('x^2 + y^2 = 4, z = 2');
  });

  // TC-F5-08: OCR spacing issues (e.g. x  ^  2 + y  ^  2 = 4)
  it('TC-F5-08: should normalize spacing around operators and powers', () => {
    const cleaned = cleanOcrText('x  ^  2 + y  ^  2 = 4');
    expect(cleaned).toBe('x^2 + y^2 = 4');
  });

  // TC-F5-09: Cleaning execution time (< 100ms)
  it('TC-F5-09: should execute cleanup of large multiline noisy OCR text in less than 100ms', () => {
    const text = 'y² + z³ = 1\n'.repeat(50);
    const start = performance.now();
    cleanOcrText(text);
    const end = performance.now();
    expect(end - start).toBeLessThan(100);
  });

  // TC-F5-10: OCR upload yielding 3D intersection
  it('TC-F5-10: should parameterize 3D intersection from drag & drop OCR text file', async () => {
    const { container, app, cleanup } = mountApp();
    
    (globalThis as any).__MOCK_OCR_TEXT__ = 'x^2+y^2=9\nz=3';
    
    const file = new File(['mock_bytes'], 'ocr_test.png', { type: 'image/png' });
    const runOcrPromise = (app as any).runOcr(file);
    await runOcrPromise;
    
    expect((app as any).state.cartesianInput).toBe('x^2+y^2=9, z=3');
    
    click(container.querySelector('#cart-go')!);
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.dim).toBe('3d');
    
    cleanup();
  });

  // TC-F5-11: No equals sign in multiline OCR text
  it('TC-F5-11: should raise validation error if equation lacks equals sign', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="cartesian"]')!);
    typeInto(container.querySelector('#cart-input')!, 'x^2 + y^2, z + 2');
    click(container.querySelector('#cart-go')!);
    
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    expect(msg.textContent).toContain('no parece una ecuación (falta un "=")');
    
    cleanup();
  });

  // TC-F5-12: State sync
  it('TC-F5-12: should synchronize UI panels and URL hash with cleaned OCR text output', async () => {
    const { container, app, cleanup } = mountApp();
    
    (globalThis as any).__MOCK_OCR_TEXT__ = 'x^2+y^2=9\nz=3';
    
    const file = new File(['mock_bytes'], 'ocr_test.png', { type: 'image/png' });
    const runOcrPromise = (app as any).runOcr(file);
    await runOcrPromise;
    
    const cartInput = container.querySelector('#cart-input') as HTMLInputElement;
    expect(cartInput.value).toBe('x^2+y^2=9, z=3');
    
    // Simular el clic en el botón de compartir para actualizar el hash URL
    click(container.querySelector('#share')!);
    
    expect(window.location.hash).toContain(encodeURIComponent('x^2+y^2=9, z=3'));
    
    cleanup();
  });
});
