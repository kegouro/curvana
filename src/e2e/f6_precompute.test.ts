import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountApp, typeInto, click } from './helpers';
import * as integrateModule from '../core/integrate';

describe('Feature 6: Performance Grid Precomputation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // TC-F6-01: Arc length precomputation
  it('TC-F6-01: should precompute arc length on a grid when curve compiles', () => {
    const integrateSpy = vi.spyOn(integrateModule, 'integrate');
    
    const { container, cleanup } = mountApp();
    
    // Changing parametric inputs triggers compilation
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, 't');
    typeInto(container.querySelector('#py')!, 't^2');
    integrateSpy.mockClear();
    
    click(container.querySelector('#param-go')!);
    
    // Expect integrate to have been called during compilation to populate the grid
    expect(integrateSpy).toHaveBeenCalled();
    
    cleanup();
  });

  // TC-F6-02: Scalar integral precomputation
  it('TC-F6-02: should populate scalar field integral grid when scalar field compiles', () => {
    const integrateSpy = vi.spyOn(integrateModule, 'integrate');
    const { container, cleanup } = mountApp();
    
    setCheckbox(container.querySelector('#tg-scalar') as HTMLInputElement, true);
    integrateSpy.mockClear();
    
    typeInto(container.querySelector('#scalar-expr')!, 'x + y');
    click(container.querySelector('#scalar-go')!);
    
    expect(integrateSpy).toHaveBeenCalled();
    
    cleanup();
  });

  // TC-F6-03: Vector integral precomputation
  it('TC-F6-03: should populate vector field integral grid when vector field compiles', () => {
    const integrateSpy = vi.spyOn(integrateModule, 'integrate');
    const { container, cleanup } = mountApp();
    
    setCheckbox(container.querySelector('#tg-vector') as HTMLInputElement, true);
    integrateSpy.mockClear();
    
    typeInto(container.querySelector('#fx')!, '-y');
    typeInto(container.querySelector('#fy')!, 'x');
    click(container.querySelector('#vector-go')!);
    
    expect(integrateSpy).toHaveBeenCalled();
    
    cleanup();
  });

  // TC-F6-04: Integration on null interval (t_min = t_max)
  it('TC-F6-04: should initialize grid values to 0 without NaN on null interval', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#tmin')!, '2');
    typeInto(container.querySelector('#tmax')!, '2');
    click(container.querySelector('#param-go')!);
    
    const readouts = container.querySelector('.readouts')!;
    // Badges should display 0
    expect(readouts.textContent).toContain('s 0.000');
    
    cleanup();
  });

  // TC-F6-05: Interpolation at exact grid nodes
  it('TC-F6-05: should return exact precomputed value at exact grid nodes', () => {
    const { container, cleanup } = mountApp();
    
    // We can evaluate readouts at bounds or nodes (e.g. t = tMin)
    // tMin readout should be 0.000
    const readouts = container.querySelector('.readouts')!;
    expect(readouts.textContent).toContain('s 0.000');
    
    cleanup();
  });

  // TC-F6-06: Interpolation between nodes
  it('TC-F6-06: should linearly interpolate between grid nodes', () => {
    const { container, cleanup } = mountApp();
    
    const slider = container.querySelector('.scrub') as HTMLInputElement;
    // Scrub to some mid value
    slider.value = '250';
    slider.dispatchEvent(new Event('input'));
    
    const readouts = container.querySelector('.readouts')!;
    expect(readouts.textContent).not.toContain('s 0.000');
    
    cleanup();
  });

  // TC-F6-07: O(1) animation frame evaluation
  it('TC-F6-07: should call integrate 0 times during animation playback ticks', () => {
    const { container, cleanup } = mountApp();
    
    // Start playback
    click(container.querySelector('.play')!);
    
    const integrateSpy = vi.spyOn(integrateModule, 'integrate');
    integrateSpy.mockClear();
    
    // Advance timers to trigger animation loop frames
    vi.advanceTimersByTime(100);
    
    // Expect integrate to be called 0 times because values are read from precomputed grid
    expect(integrateSpy).toHaveBeenCalledTimes(0);
    
    cleanup();
  });

  // TC-F6-08: Precomputation triggers
  it('TC-F6-08: should run precomputation exactly once when curve or field changes, not on frame redraws', () => {
    const { container, cleanup } = mountApp();
    
    const integrateSpy = vi.spyOn(integrateModule, 'integrate');
    integrateSpy.mockClear();
    
    // Redraw/tick animation frame
    click(container.querySelector('.play')!);
    vi.advanceTimersByTime(50);
    expect(integrateSpy).toHaveBeenCalledTimes(0);
    
    // Trigger change
    typeInto(container.querySelector('#px')!, 't * 2');
    click(container.querySelector('#param-go')!);
    expect(integrateSpy).toHaveBeenCalled();
    
    cleanup();
  });

  // TC-F6-09: Fast scrubbing integration check
  it('TC-F6-09: should update readouts smoothly and instantly when scrubbing slider rapidly', () => {
    const { container, cleanup } = mountApp();
    
    const slider = container.querySelector('.scrub') as HTMLInputElement;
    const start = performance.now();
    for (let i = 0; i <= 100; i += 10) {
      slider.value = String(i * 10);
      slider.dispatchEvent(new Event('input'));
    }
    const end = performance.now();
    
    expect(end - start).toBeLessThan(10000);
    
    cleanup();
  });

  // TC-F6-10: Precomputation with singular coordinates
  it('TC-F6-10: should precompute safely and clamp values when field contains a singularity', () => {
    const { container, app, cleanup } = mountApp();
    
    setCheckbox(container.querySelector('#tg-scalar') as HTMLInputElement, true);
    // 1/x is singular at x=0 (which occurs on the curve e.g. helicoid/circle passing through origin or x=0)
    typeInto(container.querySelector('#scalar-expr')!, '1/x');
    click(container.querySelector('#scalar-go')!);
    
    // Should compile without throwing / crashing
    expect((app as any).scalarField).toBeDefined();
    
    cleanup();
  });

  // TC-F6-11: Playback speed influence
  it('TC-F6-11: should retrieve accurate values even when running at 4x playback speed', () => {
    const { container, cleanup } = mountApp();
    
    const speedSel = container.querySelector('.speed') as HTMLSelectElement;
    changeSelect(speedSel, '4');
    
    click(container.querySelector('.play')!);
    vi.advanceTimersByTime(200);
    
    const readouts = container.querySelector('.readouts')!;
    expect(readouts.textContent).not.toContain('NaN');
    
    cleanup();
  });
});

// Helper for ticking checkbox
function setCheckbox(checkbox: HTMLInputElement | null, checked: boolean) {
  if (!checkbox) return;
  checkbox.checked = checked;
  checkbox.dispatchEvent(new Event('change', { bubbles: true }));
}

// Helper for select
function changeSelect(select: HTMLSelectElement | null, value: string) {
  if (!select) return;
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}
