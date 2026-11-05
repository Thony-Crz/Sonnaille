import { describe, expect, it } from 'vitest';
import { HEADCOUNTS, NEST_KINDS, isFlock, isRecent, pointAtKm, type Observation } from './observation';
import type { Track } from './track';

const observation = (observedAt: string): Observation => ({
  id: 'obs-1',
  observedAt,
  position: { longitude: 5.7, latitude: 45.2 },
  species: 'sheep',
  headcount: 'hundreds',
  guardDogs: true,
});

describe('headcounts', () => {
  it('are rough orders of magnitude', () => {
    expect(HEADCOUNTS).toEqual(['few', 'dozens', 'hundreds']);
  });
});

describe('isRecent', () => {
  const now = new Date('2026-07-15T12:00:00Z');

  it('is true within the validity period', () => {
    expect(isRecent(observation('2026-07-13T08:00:00Z'), now, 3)).toBe(true);
  });

  it('is true exactly at the end of the validity period', () => {
    expect(isRecent(observation('2026-07-12T12:00:00Z'), now, 3)).toBe(true);
  });

  it('is false after the validity period', () => {
    expect(isRecent(observation('2026-07-12T11:59:00Z'), now, 3)).toBe(false);
  });

  it('is false for an observation in the future (a wrong clock)', () => {
    expect(isRecent(observation('2026-07-16T12:00:00Z'), now, 3)).toBe(false);
  });
});

// 2 km due north, then 1 km due north in a second segment; times only on the first segment.
const track: Track = {
  name: 'Sortie',
  segments: [
    [
      { longitude: 5.7, latitude: 45.0, time: '2026-07-15T06:00:00Z' },
      { longitude: 5.7, latitude: 45.017986, time: '2026-07-15T06:40:00Z' },
    ],
    [
      { longitude: 5.8, latitude: 45.1 },
      { longitude: 5.8, latitude: 45.108993 },
    ],
  ],
};

describe('pointAtKm', () => {
  it('finds the position at a distance along the track', () => {
    const point = pointAtKm(track, 1);

    expect(point.position.longitude).toBeCloseTo(5.7, 6);
    expect(point.position.latitude).toBeCloseTo(45.008993, 4);
  });

  it('deduces the time from the GPX timestamps', () => {
    expect(pointAtKm(track, 1).time).toBe('2026-07-15T06:20:00.000Z');
  });

  it('has no time where the GPX has none', () => {
    expect(pointAtKm(track, 2.5).time).toBeUndefined();
  });

  it('continues into the next segment', () => {
    expect(pointAtKm(track, 2.5).position.longitude).toBeCloseTo(5.8, 6);
  });

  it('stays on the track for distances beyond its ends', () => {
    expect(pointAtKm(track, -1).position).toEqual({ longitude: 5.7, latitude: 45.0 });
    expect(pointAtKm(track, 99).position).toEqual({ longitude: 5.8, latitude: 45.108993 });
  });
});

describe('kinds of sightings', () => {
  it('covers flocks, beehives and wasp, bee or hornet nests', () => {
    expect(NEST_KINDS).toEqual(['beehives', 'wasp-nest', 'bee-nest', 'hornet-nest']);
  });

  it('treats a sighting without kind as a flock (files written before nests existed)', () => {
    expect(isFlock(observation('2026-07-15T08:00:00Z'))).toBe(true);
    expect(isFlock({ id: 'n', observedAt: '2026-07-15T08:00:00Z', position: { longitude: 5.7, latitude: 45 }, kind: 'hornet-nest' })).toBe(false);
  });
});
