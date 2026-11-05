import { describe, expect, it } from 'vitest';
import { detectCrossings, distanceToZoneMeters, isInside } from './crossing';
import type { MultiPolygon, PastoralZone } from './pastoral-zone';
import type { Track } from './track';
import type { ZoneStatus } from './zone-status';

// A square of 0.01° (about 786 m east-west, 1112 m north-south at 45°N), with an optional hole.
const square = (west: number, south: number, size = 0.01): number[][] => [
  [west, south],
  [west + size, south],
  [west + size, south + size],
  [west, south + size],
  [west, south],
];

const zone = (id: string, geometry: MultiPolygon): PastoralZone => ({ id, name: id, quarter: '', geometry, presence: null });
const on = (z: PastoralZone, status: ZoneStatus = 'flock') => ({ zone: z, status });

const line = (...points: Array<[number, number]>): Track => ({
  name: 'Test',
  segments: [points.map(([longitude, latitude]) => ({ longitude, latitude }))],
});

const A = zone('A', [[square(5.7, 45.0)]]);
const B = zone('B', [[square(5.73, 45.0)]]);
const WITH_HOLE = zone('H', [[square(5.7, 45.0, 0.03), square(5.71, 45.0, 0.01).map(([x, y]) => [x!, y! + 0.01])]]);

describe('isInside', () => {
  it('is true inside the outer ring', () => {
    expect(isInside({ longitude: 5.705, latitude: 45.005 }, A.geometry)).toBe(true);
  });

  it('is false outside', () => {
    expect(isInside({ longitude: 5.72, latitude: 45.005 }, A.geometry)).toBe(false);
  });

  it('is false inside a hole', () => {
    expect(isInside({ longitude: 5.715, latitude: 45.015 }, WITH_HOLE.geometry)).toBe(false);
    expect(isInside({ longitude: 5.705, latitude: 45.015 }, WITH_HOLE.geometry)).toBe(true);
  });
});

describe('distanceToZoneMeters', () => {
  it('is 0 inside', () => {
    expect(distanceToZoneMeters({ longitude: 5.705, latitude: 45.005 }, A.geometry)).toBe(0);
  });

  it('measures the distance to the nearest edge', () => {
    // 0.001° of latitude north of the zone: about 111 m.
    expect(distanceToZoneMeters({ longitude: 5.705, latitude: 45.011 }, A.geometry)).toBeCloseTo(111, -1);
  });
});

describe('detectCrossings', () => {
  it('finds nothing for a track away from the zones', () => {
    expect(detectCrossings(line([5.6, 45.1], [5.61, 45.1]), [on(A)], { marginMeters: 0 })).toEqual([]);
  });

  it('finds a zone crossed, where the track enters it and how long it stays inside', () => {
    const [crossing] = detectCrossings(line([5.69, 45.005], [5.72, 45.005]), [on(A, 'flock-with-dogs')], { marginMeters: 0 });

    expect(crossing?.zone).toBe(A);
    expect(crossing?.status).toBe('flock-with-dogs');
    expect(crossing?.entry.longitude).toBeCloseTo(5.7, 3);
    expect(crossing?.entryDistanceMeters).toBeCloseTo(786, -2);
    expect(crossing?.insideMeters).toBeCloseTo(786, -2);
  });

  it('counts a zone the track only passes near, within the margin', () => {
    // About 111 m north of zone A.
    const track = line([5.69, 45.011], [5.72, 45.011]);

    expect(detectCrossings(track, [on(A)], { marginMeters: 0 })).toEqual([]);
    expect(detectCrossings(track, [on(A)], { marginMeters: 150 })).toHaveLength(1);
  });

  it('does not count the time spent in a hole of the zone', () => {
    // Crosses the 0.03° square through its 0.01° hole: inside for about 2/3 of 2358 m.
    const [crossing] = detectCrossings(line([5.69, 45.015], [5.74, 45.015]), [on(WITH_HOLE)], { marginMeters: 0 });

    expect(crossing?.insideMeters).toBeCloseTo(1572, -2);
  });

  it('lists the zones in the order the track reaches them', () => {
    const crossings = detectCrossings(line([5.75, 45.005], [5.69, 45.005]), [on(A), on(B)], { marginMeters: 0 });

    expect(crossings.map((c) => c.zone.id)).toEqual(['B', 'A']);
  });

  it('adds up several passages through the same zone, keeping the first entry', () => {
    const crossings = detectCrossings(
      line([5.69, 45.005], [5.705, 45.005], [5.705, 45.02], [5.703, 45.02], [5.703, 45.005], [5.72, 45.005]),
      [on(A)],
      { marginMeters: 0 },
    );

    expect(crossings).toHaveLength(1);
    expect(crossings[0]?.entry.longitude).toBeCloseTo(5.7, 3);
  });
});
