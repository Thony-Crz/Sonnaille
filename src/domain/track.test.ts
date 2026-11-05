import { describe, expect, it } from 'vitest';
import { distanceMeters, trackBounds, trackLengthMeters, type Track } from './track';

describe('distanceMeters', () => {
  it('is 0 between a point and itself', () => {
    expect(distanceMeters({ longitude: 5.7, latitude: 45.2 }, { longitude: 5.7, latitude: 45.2 })).toBe(0);
  });

  it('measures about 111 km for one degree of latitude', () => {
    expect(distanceMeters({ longitude: 5.7, latitude: 45 }, { longitude: 5.7, latitude: 46 })).toBeCloseTo(111_195, -2);
  });

  it('measures a degree of longitude shorter at 45°N (about 78.6 km)', () => {
    expect(distanceMeters({ longitude: 5, latitude: 45 }, { longitude: 6, latitude: 45 })).toBeCloseTo(78_626, -2);
  });
});

const track: Track = {
  name: 'Test',
  segments: [
    [
      { longitude: 5.7, latitude: 45.2 },
      { longitude: 5.7, latitude: 45.21 },
    ],
    [
      { longitude: 5.8, latitude: 45.3 },
      { longitude: 5.8, latitude: 45.31 },
    ],
  ],
};

describe('trackLengthMeters', () => {
  it('adds the segments without joining them', () => {
    expect(trackLengthMeters(track)).toBeCloseTo(2 * 1_112, -1);
  });
});

describe('trackBounds', () => {
  it('encloses every point', () => {
    expect(trackBounds(track)).toEqual({ west: 5.7, south: 45.2, east: 5.8, north: 45.31 });
  });
});
