import { describe, expect, it } from 'vitest';
import { boundsOf, contains, enclosingBounds, intersects, type Bounds } from './bounds';

const a: Bounds = { west: 5, south: 45, east: 6, north: 46 };
const b: Bounds = { west: 5.5, south: 44, east: 7, north: 45.5 };

describe('enclosingBounds', () => {
  it('returns the bounds themselves when there is only one', () => {
    expect(enclosingBounds([a])).toEqual(a);
  });

  it('returns the smallest bounds containing all the others', () => {
    expect(enclosingBounds([a, b])).toEqual({ west: 5, south: 44, east: 7, north: 46 });
  });

  it('rejects an empty list', () => {
    expect(() => enclosingBounds([])).toThrow('No bounds to enclose');
  });
});

describe('intersects', () => {
  it('is true for overlapping bounds', () => {
    expect(intersects(a, b)).toBe(true);
  });

  it('is true for bounds touching on an edge', () => {
    expect(intersects(a, { west: 6, south: 45, east: 7, north: 46 })).toBe(true);
  });

  it('is false for separate bounds', () => {
    expect(intersects(a, { west: 6.5, south: 45, east: 7, north: 46 })).toBe(false);
  });
});

describe('boundsOf', () => {
  it('returns the bounds of a set of positions', () => {
    expect(boundsOf([[5.7, 45.3], [5.9, 45.1], [5.8, 45.4]])).toEqual({ west: 5.7, south: 45.1, east: 5.9, north: 45.4 });
  });

  it('returns undefined without positions', () => {
    expect(boundsOf([])).toBeUndefined();
  });
});

describe('contains', () => {
  it('is true for a point inside', () => {
    expect(contains(a, { longitude: 5.5, latitude: 45.5 })).toBe(true);
  });

  it('is true for a point on the edge', () => {
    expect(contains(a, { longitude: 5, latitude: 46 })).toBe(true);
  });

  it('is false for a point outside', () => {
    expect(contains(a, { longitude: 6.1, latitude: 45.5 })).toBe(false);
  });
});
