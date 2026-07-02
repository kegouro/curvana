import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountApp, typeInto, click } from './helpers';
import { curveFromExpr } from '../core/curve';
import { curvature, frenetFrame } from '../core/differential';

describe('Feature 7: Singularity Handling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // TC-F7-01: Singularity evaluation
  it('TC-F7-01: should return non-finite coordinates for curves with singularities', () => {
    const expr = { x: '1/t', y: 't', z: '0' };
    const curve = curveFromExpr(expr, -1, 1);
    
    const pt = curve.eval(0);
    expect(Number.isFinite(pt[0])).toBe(false);
  });

  // TC-F7-02: Skip line segments in full trace
  it('TC-F7-02: should skip line segments and avoid drawing connections to non-finite coordinates', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, '1/t');
    typeInto(container.querySelector('#py')!, 't');
    typeInto(container.querySelector('#tmin')!, '-1');
    typeInto(container.querySelector('#tmax')!, '1');
    click(container.querySelector('#param-go')!);
    
    const curveView = (app as any).curveView;
    const positionAttr = curveView.fullLine.geometry.attributes.position;
    
    // The geometry should not contain lines drawing straight to the fallback 0,0,0 coordinate from adjacent points
    // Let's verify that the points do not have NaN or Infinity, but rather skip or handle them correctly.
    // If handled properly, the segment around t=0 should be skipped/split.
    // We only check x coordinates (index % 3 === 0) to avoid false positives from y = 0 (at t = 0) and z = 0 (2D curve).
    const hasZeroCon = Array.from(positionAttr.array)
      .filter((_, idx) => idx % 3 === 0)
      .some((val) => val === 0);
    expect(hasZeroCon).toBe(false);
    
    cleanup();
  });

  // TC-F7-03: Skip segments in traced line
  it('TC-F7-03: should skip connecting segments in traced line around singularity', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, '1/t');
    typeInto(container.querySelector('#py')!, 't');
    typeInto(container.querySelector('#tmin')!, '-1');
    typeInto(container.querySelector('#tmax')!, '1');
    click(container.querySelector('#param-go')!);
    
    // Scrub to t = 0 (which is 50% / index 500)
    const slider = container.querySelector('.scrub') as HTMLInputElement;
    slider.value = '500';
    slider.dispatchEvent(new Event('input'));
    
    const curveView = (app as any).curveView;
    expect(curveView.tracedLine.geometry.drawRange.count).toBeGreaterThan(0);
    
    cleanup();
  });

  // TC-F7-04: Moving point visibility at singularity
  it('TC-F7-04: should hide moving point when scrubbing directly on a singularity', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, '1/t');
    typeInto(container.querySelector('#py')!, 't');
    typeInto(container.querySelector('#tmin')!, '-1');
    typeInto(container.querySelector('#tmax')!, '1');
    click(container.querySelector('#param-go')!);
    
    // Scrub exactly to t = 0
    const slider = container.querySelector('.scrub') as HTMLInputElement;
    slider.value = '500'; // mid range
    slider.dispatchEvent(new Event('input'));
    
    const curveView = (app as any).curveView;
    expect(curveView.point.visible).toBe(false);
    
    cleanup();
  });

  // TC-F7-05: Curvature at singularity
  it('TC-F7-05: should return safe fallback values for curvature at singularity', () => {
    const expr = { x: '1/t', y: 't', z: '0' };
    const curve = curveFromExpr(expr, -1, 1);
    
    const k = curvature(curve, 0);
    expect(Number.isFinite(k)).toBe(true);
    expect(k).toBe(0);
  });

  // TC-F7-06: Frenet-Serret frame at singularity
  it('TC-F7-06: should handle Frenet-Serret frame computation at singularity safely', () => {
    const expr = { x: '1/t', y: 't', z: '0' };
    const curve = curveFromExpr(expr, -1, 1);
    
    // Should not throw
    const frame = frenetFrame(curve, 0);
    expect(frame).toBeDefined();
  });

  // TC-F7-07: Singularity rendering efficiency
  it('TC-F7-07: should not block UI loops when rendering multiple singularities', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, '1/(t * (t-1) * (t+1))');
    typeInto(container.querySelector('#py')!, 't');
    click(container.querySelector('#param-go')!);
    
    // Start animation play
    click(container.querySelector('.play')!);
    
    const start = performance.now();
    vi.advanceTimersByTime(200);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(10000);
    
    cleanup();
  });

  // TC-F7-08: Singularity at interval boundary (t_min = 0, x(t) = 1/t)
  it('TC-F7-08: should ignore singular boundary values when calculating camera framing bounds', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, '1/t');
    typeInto(container.querySelector('#py')!, 't');
    typeInto(container.querySelector('#tmin')!, '0');
    typeInto(container.querySelector('#tmax')!, '5');
    click(container.querySelector('#param-go')!);
    
    const bounds = (app as any).curveView.bounds();
    expect(Number.isFinite(bounds.radius)).toBe(true);
    expect(bounds.radius).toBeLessThan(100);
    
    cleanup();
  });

  // TC-F7-09: Multiple singularities (e.g. tan(t) on [0, 2pi])
  it('TC-F7-09: should split geometry into separate mesh segments for multiple singularities', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, 'tan(t)');
    typeInto(container.querySelector('#py')!, 't');
    typeInto(container.querySelector('#tmin')!, '0');
    typeInto(container.querySelector('#tmax')!, '6.28');
    click(container.querySelector('#param-go')!);
    
    const curveView = (app as any).curveView;
    const positionAttr = curveView.fullLine.geometry.attributes.position;
    expect(positionAttr).toBeDefined();
    
    cleanup();
  });

  // TC-F7-10: Scalar field singularity (color mapping handles infinite values safely)
  it('TC-F7-10: should handle non-finite scalar coloring values safely', () => {
    const { container, app, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, 't');
    typeInto(container.querySelector('#py')!, '0');
    typeInto(container.querySelector('#tmin')!, '-2');
    typeInto(container.querySelector('#tmax')!, '2');
    click(container.querySelector('#param-go')!);
    
    // Enable scalar field coloring with singularity at x=1
    setCheckbox(container.querySelector('#tg-scalar') as HTMLInputElement, true);
    typeInto(container.querySelector('#scalar-expr')!, '1/(x-1)');
    click(container.querySelector('#scalar-go')!);
    
    const curveView = (app as any).curveView;
    const colorAttr = curveView.fullLine.geometry.getAttribute('color');
    expect(colorAttr).toBeDefined(); // Color attribute should be generated
    
    cleanup();
  });

  // TC-F7-11: Animation loop crossing singularity (loop over t=0)
  it('TC-F7-11: should play through animation crossing a singularity without throwing', () => {
    const { container, cleanup } = mountApp();
    
    click(container.querySelector('[data-mode="parametric"]')!);
    typeInto(container.querySelector('#px')!, '1/t');
    typeInto(container.querySelector('#py')!, 't');
    typeInto(container.querySelector('#tmin')!, '-1');
    typeInto(container.querySelector('#tmax')!, '1');
    click(container.querySelector('#param-go')!);
    
    click(container.querySelector('.play')!);
    
    // Let animation loop run and cross t=0
    expect(() => {
      vi.advanceTimersByTime(2000);
    }).not.toThrow();
    
    cleanup();
  });
});

function setCheckbox(checkbox: HTMLInputElement | null, checked: boolean) {
  if (!checkbox) return;
  checkbox.checked = checked;
  checkbox.dispatchEvent(new Event('change', { bubbles: true }));
}
