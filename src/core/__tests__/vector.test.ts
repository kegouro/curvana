import { describe, it, expect } from 'vitest';
import * as V from '../vector';

describe('vector', () => {
  it('producto punto y cruz', () => {
    expect(V.dot([1, 2, 3], [4, 5, 6])).toBe(32);
    expect(V.cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
  });

  it('norma y normalización', () => {
    expect(V.norm([3, 4, 0])).toBe(5);
    const u = V.normalize([0, 3, 4]);
    expect(V.norm(u)).toBeCloseTo(1, 12);
  });

  it('normalizar vector nulo no explota', () => {
    expect(V.normalize([0, 0, 0])).toEqual([0, 0, 0]);
  });
});
