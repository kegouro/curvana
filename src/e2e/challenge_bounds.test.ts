import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountApp, typeInto, click } from './helpers';

describe('Empirical Challenge: Bounds and Animation Loop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 1. Forward Loop Verification
  it('should loop from tMax back to tMin correctly in forward animation', () => {
    const { container, app, cleanup } = mountApp();

    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, '0');
    typeInto(container.querySelector('#tmax')!, '10');
    click(container.querySelector('#param-go')!);

    // Start playback
    click(container.querySelector('.play')!);

    // Force time to near tMax (e.g., 9.99)
    (app as any).state.t = 9.99;

    // Advance time. At speed = 1, span = 10, SWEEP_MS = 8000.
    // increment per ms = (1 * 10 * dt) / 8000
    // To advance by 0.1 (from 9.99 to 10.09), we need:
    // dt = 0.1 * 8000 / 10 = 80ms
    vi.advanceTimersByTime(100);

    // It should have exceeded tMax (10) and looped back to tMin (0) plus any remainder.
    expect((app as any).state.t).toBeLessThan(10);
    expect((app as any).state.t).toBeGreaterThanOrEqual(0);

    cleanup();
  });

  // 2. Backward Animation (Negative Speed)
  it('should fail to wrap/loop correctly when speed is negative (backward animation)', () => {
    const { container, app, cleanup } = mountApp();

    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, '0');
    typeInto(container.querySelector('#tmax')!, '10');
    click(container.querySelector('#param-go')!);

    // Manually set speed to negative
    (app as any).state.speed = -10;

    // Start playback
    click(container.querySelector('.play')!);

    // Set t to near tMin (e.g., 0.05)
    (app as any).state.t = 0.05;

    // Advance time. Since speed is -10, t should decrease rapidly.
    vi.advanceTimersByTime(10000);

    // If there is no backwards loop handling, t will go below 0 (negative) and keep decreasing.
    // Let's assert this behavior to confirm the bug/vulnerability.
    expect((app as any).state.t).toBeLessThan(0);

    cleanup();
  });

  // 3. Very Small Difference Between Bounds
  it('should handle very small bounds differences', () => {
    const { container, app, cleanup } = mountApp();

    click(container.querySelector('[data-mode="parametric"]')!);
    // Difference is 1e-15
    typeInto(container.querySelector('#tmin')!, '1');
    typeInto(container.querySelector('#tmax')!, '1.000000000000001');
    click(container.querySelector('#param-go')!);

    const msg = container.querySelector('#param-msg')!;
    // Should accept the bounds (no error)
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.tMin).toBe(1);
    expect((app as any).state.tMax).toBe(1.000000000000001);

    cleanup();
  });

  // 4. Negative Range Bounds
  it('should handle negative ranges correctly', () => {
    const { container, app, cleanup } = mountApp();

    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, '-10');
    typeInto(container.querySelector('#tmax')!, '-5');
    click(container.querySelector('#param-go')!);

    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(false);
    expect((app as any).state.tMin).toBe(-10);
    expect((app as any).state.tMax).toBe(-5);

    cleanup();
  });

  // 5. Non-numeric Bounds
  it('should reject non-numeric bounds', () => {
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

  // 6. Empty Bounds
  it('should reject empty bounds', () => {
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

  // 7. Subnormal Bounds (causing division by zero in interpolator)
  it('should handle subnormal bounds and division-by-zero safely or reject them', () => {
    const { container, app, cleanup } = mountApp();

    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, '0');
    typeInto(container.querySelector('#tmax')!, '5e-322'); // about 100 * Number.MIN_VALUE
    click(container.querySelector('#param-go')!);

    // Manually set t to a value strictly between 0 and 5e-322
    (app as any).state.t = 2.5e-322;
    (app as any).updateForT();

    // Check if the readouts contain NaN
    const readouts = container.querySelector('.readouts')!;
    // It should handle division-by-zero safely (evaluate to finite value, not NaN)
    expect(readouts.textContent).not.toContain('NaN');

    cleanup();
  });

  // 8. Large value precision loss in derivative calculation
  it('should experience precision loss in velocity/acceleration at tMin = 1e15', () => {
    const { container, app, cleanup } = mountApp();

    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, 't');
    typeInto(container.querySelector('#py')!, 't');
    typeInto(container.querySelector('#pz')!, 't');
    typeInto(container.querySelector('#tmin')!, '1000000000000000'); // 1e15
    typeInto(container.querySelector('#tmax')!, '1000000000000010'); // 1e15 + 10
    click(container.querySelector('#param-go')!);

    const msg = container.querySelector('#param-msg')!;
    expect(msg.classList.contains('error')).toBe(false);

    // Get the curve
    const curve = (app as any).curve;
    expect(curve).toBeDefined();

    // The actual velocity of r(t) = (t, t, t) should be (1, 1, 1).
    // But due to precision loss at t = 1e15 (where H1 = 1e-6 vanishes relative to 1e15),
    // it computes velocity as (0, 0, 0).
    const v = curve.velocity(1000000000000000);
    expect(v[0]).toBe(0);
    expect(v[1]).toBe(0);
    expect(v[2]).toBe(0);

    cleanup();
  });

  // 9. Overflow bounds subtraction (tMax - tMin yields Infinity)
  it('should handle bounds whose difference overflows to Infinity', () => {
    const { container, app, cleanup } = mountApp();

    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, 't');
    typeInto(container.querySelector('#py')!, 't');
    typeInto(container.querySelector('#pz')!, 't');
    typeInto(container.querySelector('#tmin')!, '-1e308');
    typeInto(container.querySelector('#tmax')!, '1e308');
    click(container.querySelector('#param-go')!);

    // Since both are finite, they are accepted by the UI if there is no check for (tMax - tMin) overflow.
    const pts = (app as any).curve ? (app as any).curve.eval(0) : null;
    expect(pts).toBeDefined();

    cleanup();
  });
});
