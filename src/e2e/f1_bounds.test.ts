import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountApp, typeInto, click } from './helpers';

describe('Feature 1: Parametric Bounds Validation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // TC-F1-01: Valid bounds input (t_min = 0, t_max = 10)
  it('TC-F1-01: should generate curve and play forward for valid bounds [0, 10]', () => {
    const { container, app, cleanup } = mountApp();
    
    // Switch to parametric mode
    click(container.querySelector('[data-mode="parametric"]')!);
    
    // Fill bounds
    typeInto(container.querySelector('#tmin')!, '0');
    typeInto(container.querySelector('#tmax')!, '10');
    
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    
    // Play animation
    click(container.querySelector('.play')!);
    vi.advanceTimersByTime(1000); // Wait 1s
    
    // Expect state.t to have increased from 0
    expect((app as any).state.t).toBeGreaterThan(0);
    expect((app as any).state.t).toBeLessThanOrEqual(10);
    
    cleanup();
  });

  // TC-F1-02: Floating-point valid bounds (t_min = -1.57, t_max = 1.57)
  it('TC-F1-02: should support floating-point bounds', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, '-1.57');
    typeInto(container.querySelector('#tmax')!, '1.57');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.tMin).toBe(-1.57);
    expect((app as any).state.tMax).toBe(1.57);
    
    cleanup();
  });

  // TC-F1-03: Equal bounds (t_min = t_max = 2)
  it('TC-F1-03: should reject equal bounds and display error', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, '2');
    typeInto(container.querySelector('#tmax')!, '2');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.textContent).toContain('t mín debe ser menor que t máx');
    expect(msg.classList.contains('error')).toBe(true);
    
    cleanup();
  });

  // TC-F1-04: Inverted bounds (t_min = 5, t_max = 0)
  it('TC-F1-04: should reject inverted bounds and block animation execution', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, '5');
    typeInto(container.querySelector('#tmax')!, '0');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    expect(msg.textContent).toContain('t mín debe ser menor que t máx');
    
    cleanup();
  });

  // TC-F1-05: Extremely narrow valid interval (t_min = 0, t_max = 10^-6)
  it('TC-F1-05: should compile narrow intervals without division-by-zero errors', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, '0');
    typeInto(container.querySelector('#tmax')!, '0.000001');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.tMax).toBe(0.000001);
    
    cleanup();
  });

  // TC-F1-06: Negative bound range (t_min = -10, t_max = -2)
  it('TC-F1-06: should support negative bounds and forward playback', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, '-10');
    typeInto(container.querySelector('#tmax')!, '-2');
    click(container.querySelector('#param-go')!);
    
    expect((app as any).state.tMin).toBe(-10);
    expect((app as any).state.tMax).toBe(-2);
    
    // Play
    click(container.querySelector('.play')!);
    vi.advanceTimersByTime(1000);
    expect((app as any).state.t).toBeGreaterThan(-10);
    expect((app as any).state.t).toBeLessThanOrEqual(-2);
    
    cleanup();
  });

  // TC-F1-07: Empty bounds inputs
  it('TC-F1-07: should reject empty bounds inputs', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, '');
    typeInto(container.querySelector('#tmax')!, '10');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    expect(msg.textContent).toContain('Límites de t inválidos');
    
    cleanup();
  });

  // TC-F1-08: Non-numeric bounds string
  it('TC-F1-08: should reject non-numeric bounds string', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, 'abc');
    typeInto(container.querySelector('#tmax')!, '10');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    expect(msg.textContent).toContain('Límites de t inválidos');
    
    cleanup();
  });

  // TC-F1-09: Transport slider synchronization
  it('TC-F1-09: should synchronize transport slider ranges and values when bounds change', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, '0');
    typeInto(container.querySelector('#tmax')!, '50');
    click(container.querySelector('#param-go')!);
    
    const slider = container.querySelector('.scrub') as HTMLInputElement;
    // Scrub to mid point (50% of range, value 500 out of 1000 steps)
    slider.value = '500';
    slider.dispatchEvent(new Event('input'));
    
    expect((app as any).state.t).toBeCloseTo(25);
    
    cleanup();
  });

  // TC-F1-10: Bounds edit during animation play
  it('TC-F1-10: should pause animation and show error if bounds are edited to invalid values during play', () => {
    const { container, app, cleanup } = mountApp();
    
    // Play helicoid
    click(container.querySelector('.play')!);
    expect((app as any).playing).toBe(true);
    
    // Edit bounds to equal in UI
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, '5');
    typeInto(container.querySelector('#tmax')!, '5');
    click(container.querySelector('#param-go')!);
    
    // Verify it paused and errors out
    expect((app as any).playing).toBe(false);
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    
    cleanup();
  });

  // TC-F1-11: URL hash state restore with invalid bounds (t_min > t_max)
  it('TC-F1-11: should trigger error and fallback to default bounds on loading invalid bounds hash', () => {
    // Generate a hash representing an invalid state
    // Let's mock window.location.hash
    window.location.hash = '#{"tMin":10,"tMax":0,"expr":{"x":"cos(t)","y":"sin(t)","z":"t"}}';
    
    const { container, app, cleanup } = mountApp();
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    // Should fallback bounds
    expect((app as any).state.tMin).toBeLessThan((app as any).state.tMax);
    
    cleanup();
  });

  // TC-F1-12: Extreme bounds difference (t_max - t_min = 10^6)
  it('TC-F1-12: should compile and handle large bounds differences safely', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, '0');
    typeInto(container.querySelector('#tmax')!, '1000000');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    
    cleanup();
  });

  // TC-F1-13: Infinity as t_max
  it('TC-F1-13: should reject Infinity as bounds input', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, '0');
    typeInto(container.querySelector('#tmax')!, 'Infinity');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    expect(msg.textContent).toContain('Límites de t inválidos');
    
    cleanup();
  });

  // TC-F1-14: -Infinity as t_min
  it('TC-F1-14: should reject -Infinity as bounds input', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, '-Infinity');
    typeInto(container.querySelector('#tmax')!, '10');
    click(container.querySelector('#param-go')!);
    
    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(true);
    expect(msg.textContent).toContain('Límites de t inválidos');
    
    cleanup();
  });
});
