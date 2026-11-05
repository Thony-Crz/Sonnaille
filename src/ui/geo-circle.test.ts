import { describe, expect, it } from 'vitest';
import { distanceMeters } from '../domain/track';
import { circleRing } from './geo-circle';

describe('circleRing', () => {
  const center = { longitude: 5.7, latitude: 45.2 };

  it('is a closed ring of the requested number of points', () => {
    const ring = circleRing(center, 500, 32);

    expect(ring).toHaveLength(33);
    expect(ring[0]).toEqual(ring[32]);
  });

  it('keeps every point at the radius from the center', () => {
    for (const [longitude, latitude] of circleRing(center, 500, 32)) {
      expect(distanceMeters(center, { longitude: longitude!, latitude: latitude! })).toBeCloseTo(500, -1);
    }
  });
});
