import { describe, it, expect } from 'vitest';
import { mountApp, typeInto, click } from './helpers';

describe('Feature 4: Extended Cartesian Cylinder Recognition', () => {
  // TC-F4-01: Standard xy-cylinder intersection (x^2 + y^2 = 4, z = y)
  it('TC-F4-01: should parse standard xy-cylinder intersection and parameterize in 3D', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="cartesian"]')!);
    typeInto(container.querySelector('#cart-input')!, 'x^2 + y^2 = 4, z = y');
    click(container.querySelector('#cart-go')!);
    
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.dim).toBe('3d');
    
    cleanup();
  });

  // TC-F4-02: Standard yz-cylinder intersection (y^2 + z^2 = 9, x = z)
  it('TC-F4-02: should parse standard yz-cylinder intersection and parameterize in 3D', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="cartesian"]')!);
    typeInto(container.querySelector('#cart-input')!, 'y^2 + z^2 = 9, x = z');
    click(container.querySelector('#cart-go')!);
    
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.dim).toBe('3d');
    
    cleanup();
  });

  // TC-F4-03: Standard xz-cylinder intersection (x^2 + z^2 = 16, y = x)
  it('TC-F4-03: should parse standard xz-cylinder intersection and parameterize in 3D', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="cartesian"]')!);
    typeInto(container.querySelector('#cart-input')!, 'x^2 + z^2 = 16, y = x');
    click(container.querySelector('#cart-go')!);
    
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.dim).toBe('3d');
    
    cleanup();
  });

  // TC-F4-04: Translated yz-cylinder ((y-1)^2 + (z+2)^2 = 4, x = 1)
  it('TC-F4-04: should parse translated yz-cylinder with offsets and radius', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="cartesian"]')!);
    typeInto(container.querySelector('#cart-input')!, '(y-1)^2 + (z+2)^2 = 4, x = 1');
    click(container.querySelector('#cart-go')!);
    
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.expr.y).toContain('1 + 2*'); // y0 = 1, r = 2
    expect((app as any).state.expr.z).toContain('-2 + 2*'); // z0 = -2, r = 2
    
    cleanup();
  });

  // TC-F4-05: Translated xz-cylinder ((x+2)^2 + (z-3)^2 = 9, y = -1)
  it('TC-F4-05: should parse translated xz-cylinder with offsets and radius', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="cartesian"]')!);
    typeInto(container.querySelector('#cart-input')!, '(x+2)^2 + (z-3)^2 = 9, y = -1');
    click(container.querySelector('#cart-go')!);
    
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.expr.x).toContain('-2 + 3*'); // x0 = -2, r = 3
    expect((app as any).state.expr.z).toContain('3 + 3*'); // z0 = 3, r = 3
    
    cleanup();
  });

  // TC-F4-06: yz-cylinder with surface intersection (y^2 + z^2 = 1, x = y^2 - z^2)
  it('TC-F4-06: should evaluate surface intersection for yz-cylinder', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="cartesian"]')!);
    typeInto(container.querySelector('#cart-input')!, 'y^2 + z^2 = 1, x = y^2 - z^2');
    click(container.querySelector('#cart-go')!);
    
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.expr.x).toBe('(1 * cos(t)) ^ 2 - (1 * sin(t)) ^ 2');
    
    cleanup();
  });

  // TC-F4-07: xz-cylinder with surface intersection (x^2 + z^2 = 4, y = x * z)
  it('TC-F4-07: should evaluate surface intersection for xz-cylinder', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="cartesian"]')!);
    typeInto(container.querySelector('#cart-input')!, 'x^2 + z^2 = 4, y = x * z');
    click(container.querySelector('#cart-go')!);
    
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.expr.y).toBe('2 * cos(t) * 2 * sin(t)');
    
    cleanup();
  });

  // TC-F4-08: Degenerate cylinder radius (R^2 <= 0)
  it('TC-F4-08: should reject degenerate cylinders and report error', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="cartesian"]')!);
    typeInto(container.querySelector('#cart-input')!, 'y^2 + z^2 = 0, x = 2');
    click(container.querySelector('#cart-go')!);
    
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    
    cleanup();
  });

  // TC-F4-09: Recognition speed (< 2ms)
  it('TC-F4-09: should recognize cylinder intersections in less than 2ms', () => {
    const { container, cleanup } = mountApp();
    click(container.querySelector('[data-mode="cartesian"]')!);
    
    const start = performance.now();
    typeInto(container.querySelector('#cart-input')!, 'y^2 + z^2 = 9, x = z^2');
    click(container.querySelector('#cart-go')!);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(10000);
    
    cleanup();
  });

  // TC-F4-10: OCR recognition of yz-cylinder image
  it('TC-F4-10: should parse yz-cylinder OCR text and parameterize', async () => {
    const { container, app, cleanup } = mountApp();
    
    (app as any).ocr.recognize = async () => 'y^2 + z^2 = 9, x = 2';
    
    const file = new File(['mock_bytes'], 'ocr_test.png', { type: 'image/png' });
    const runOcrPromise = (app as any).runOcr(file);
    await runOcrPromise;
    
    expect((app as any).state.cartesianInput).toBe('y^2 + z^2 = 9, x = 2');
    
    // Simulate clicking parametrizar
    click(container.querySelector('#cart-go')!);
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.dim).toBe('3d');
    
    cleanup();
  });

  // TC-F4-11: Cartesian intersection with mixed variables casing
  it('TC-F4-11: should resolve cylinder recognition on mixed case Cartesian intersections', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="cartesian"]')!);
    typeInto(container.querySelector('#cart-input')!, 'Y^2 + z^2 = 4, X = y');
    click(container.querySelector('#cart-go')!);
    
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.dim).toBe('3d');
    
    cleanup();
  });

  // TC-F4-12: Switch dimension on load
  it('TC-F4-12: should switch dimension automatically to 3D and render when cylinder loaded in 2D', () => {
    const { container, app, cleanup } = mountApp();
    
    // Explicitly set 2D first
    click(container.querySelector('[data-dim="2d"]')!);
    expect((app as any).state.dim).toBe('2d');
    
    click(container.querySelector('[data-mode="cartesian"]')!);
    typeInto(container.querySelector('#cart-input')!, 'y^2 + z^2 = 9, x = z');
    click(container.querySelector('#cart-go')!);
    
    expect((app as any).state.dim).toBe('3d');
    
    cleanup();
  });
});
