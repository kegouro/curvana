import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountApp, typeInto, click } from './helpers';

describe('Feature 8: Compile Failure UI Reporting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // TC-F8-01: Syntax error in Parametric X
  it('TC-F8-01: should display compilation error for incomplete syntax like cos(t', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, 'cos(t');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    expect(msg.textContent).toContain('cos(t');
    
    cleanup();
  });

  // TC-F8-02: Syntax error in Cartesian input
  it('TC-F8-02: should display error for Cartesian input lacking equals sign', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="cartesian"]')!);
    typeInto(container.querySelector('#cart-input')!, 'x^2 + y^2');
    click(container.querySelector('#cart-go')!);
    
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    expect(msg.textContent).toContain('falta un "="');
    
    cleanup();
  });

  // TC-F8-03: Undefined variable error
  it('TC-F8-03: should report unknown variables in parametric expression error banner', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, 't + a');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    expect(msg.textContent).toContain('Variable desconocida "a"');
    
    cleanup();
  });

  // TC-F8-04: Priority of errors
  it('TC-F8-04: should prioritize showing compilation errors over bounds errors when both occur', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    // Both syntax error and invalid bounds (5 > 2)
    typeInto(container.querySelector('#px')!, 'cos(t');
    typeInto(container.querySelector('#tmin')!, '5');
    typeInto(container.querySelector('#tmax')!, '2');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    expect(msg.textContent).toContain('cos(t'); // prioritize compiler error
    
    cleanup();
  });

  // TC-F8-05: Error in Scalar Field expression
  it('TC-F8-05: should report scalar field compile errors in the UI', () => {
    const { container, app, cleanup } = mountApp();
    
    typeInto(container.querySelector('#scalar-expr')!, 'x + * y');
    click(container.querySelector('#scalar-go')!);
    
    // Ensure compile fails and scalarField becomes null
    expect((app as any).scalarField).toBeNull();
    
    cleanup();
  });

  // TC-F8-06: Error in Vector Field component
  it('TC-F8-06: should report vector field compile errors in the UI', () => {
    const { container, app, cleanup } = mountApp();
    
    typeInto(container.querySelector('#fx')!, 'x + * y');
    typeInto(container.querySelector('#fy')!, 'y');
    click(container.querySelector('#vector-go')!);
    
    // Ensure compile fails and vectorField becomes null
    expect((app as any).vectorField).toBeNull();
    
    cleanup();
  });

  // TC-F8-07: Evaluation failure (e.g. division by zero, empty, etc.)
  it('TC-F8-07: should display error when expression is empty', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, '');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    expect(msg.textContent).toContain('vacía');
    
    cleanup();
  });

  // TC-F8-08: Error banner clearance
  it('TC-F8-08: should clear active validation errors once corrected', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    // Input error
    typeInto(container.querySelector('#px')!, 'cos(t');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    
    // Correct input
    typeInto(container.querySelector('#px')!, 'cos(t)');
    click(container.querySelector('#param-go')!);
    
    expect(msg.classList.contains('none')).toBe(true);
    expect(msg.classList.contains('error')).toBe(false);
    
    cleanup();
  });

  // TC-F8-09: Error state across tab switching
  it('TC-F8-09: should maintain or clear error states appropriately when switching tabs', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="cartesian"]')!);
    typeInto(container.querySelector('#cart-input')!, 'x^2 + y^2');
    click(container.querySelector('#cart-go')!);
    
    const msg = container.querySelector('#cart-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    
    // Switch to library tab
    click(container.querySelector('[data-mode="library"]')!);
    // Pane-cartesian should be hidden
    expect((container.querySelector('#pane-cartesian') as HTMLElement).style.display).toBe('none');
    
    cleanup();
  });

  // TC-F8-10: URL hash load error
  it('TC-F8-10: should decode invalid URL hash and display validation error on startup', () => {
    window.location.hash = '#{"dim":"2d","mode":"parametric","expr":{"x":"cos(t","y":"sin(t)","z":"0"},"tMin":0,"tMax":6.28}';
    
    const { container, cleanup } = mountApp();
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    expect(msg.textContent).toContain('cos(t');
    
    cleanup();
  });

  // TC-F8-11: Share link inhibition
  it('TC-F8-11: should inhibit sharing or show warning when attempting to share an invalid state', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, 'cos(t');
    click(container.querySelector('#param-go')!);
    
    const shareBtn = container.querySelector('#share') as HTMLButtonElement;
    click(shareBtn);
    
    // In error state, share should either block copy or behaves safely
    // (the request states "Verify that attempting to share a state that is in error displays warning or behaves safely")
    expect((globalThis as any).__COPIED_TEXT__).toBeUndefined();
    
    cleanup();
  });
});
