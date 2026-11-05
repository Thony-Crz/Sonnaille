import { describe, expect, it } from 'vitest';
import type { Advice } from '../domain/advice';
import type { MultiPolygon, PastoralZone, Presence } from '../domain/pastoral-zone';
import type { Track } from '../domain/track';
import { DEFAULT_MARGIN_METERS, prepareOuting } from './prepare-outing';

const square = (west: number, south: number): MultiPolygon => [
  [
    [
      [west, south],
      [west + 0.01, south],
      [west + 0.01, south + 0.01],
      [west, south + 0.01],
      [west, south],
    ],
  ],
];

const summer = (guardDogs: boolean): Presence => ({
  start: '2026-06-15',
  end: '2026-09-30',
  species: ['sheep'],
  guardDogs,
  weekdays: [1, 2, 3, 4, 5, 6, 7],
});

const zones: PastoralZone[] = [
  { id: 'A', name: 'Alpage A', quarter: 'Quartier A', geometry: square(5.7, 45.0), presence: summer(false) },
  { id: 'B', name: 'Alpage B', quarter: '', geometry: square(5.73, 45.0), presence: summer(true) },
  { id: 'C', name: 'Loin', quarter: '', geometry: square(6.5, 45.5), presence: summer(true) },
];

// West to east through A then B, about 4.7 km.
const track: Track = {
  name: 'Traversée',
  segments: [
    [
      { longitude: 5.69, latitude: 45.005 },
      { longitude: 5.75, latitude: 45.005 },
    ],
  ],
};

const advice = (id: string, appliesTo: Advice['appliesTo']): Advice => ({
  id,
  situation: id,
  message: id,
  detail: id,
  source: { label: 'Pasto Kézako', url: 'https://www.pasto-kezako.fr/' },
  appliesTo,
});
const allAdvice = [
  advice('flock', { statuses: ['flock', 'flock-with-dogs'] }),
  advice('dogs', { statuses: ['flock-with-dogs'] }),
  advice('mtb', { statuses: ['flock', 'flock-with-dogs'], activities: ['mtb'] }),
  advice('zone', { statuses: ['no-flock'] }),
];

describe('prepareOuting', () => {
  it('uses a 50 m margin by default', () => {
    expect(DEFAULT_MARGIN_METERS).toBe(50);
  });

  it('lists the zones crossed, in order, with their status on the outing day', () => {
    const report = prepareOuting({ track, zones, date: '2026-07-15', activity: 'hiking', advice: allAdvice });

    expect(report.crossings.map((c) => [c.zone.id, c.status])).toEqual([
      ['A', 'flock'],
      ['B', 'flock-with-dogs'],
    ]);
    expect(report.crossings[0]?.entryKm).toBeCloseTo(0.7, 1);
    expect(report.crossings[0]?.insideKm).toBeCloseTo(0.9, 1);
  });

  it('describes the outing', () => {
    const report = prepareOuting({ track, zones, date: '2026-07-15', activity: 'trail', advice: allAdvice });

    expect(report).toMatchObject({ name: 'Traversée', date: '2026-07-15', activity: 'trail', lengthKm: 4.7 });
  });

  it('sums up with the most cautious status met', () => {
    expect(prepareOuting({ track, zones, date: '2026-07-15', activity: 'hiking', advice: allAdvice }).mostCautious).toBe('flock-with-dogs');
  });

  it('gives the advice for the most cautious status and the activity', () => {
    const report = prepareOuting({ track, zones, date: '2026-07-15', activity: 'mtb', advice: allAdvice });

    expect(report.advice.map((a) => a.id)).toEqual(['flock', 'dogs', 'mtb']);
  });

  it('finds the same zones out of season, without flocks', () => {
    const report = prepareOuting({ track, zones, date: '2026-11-05', activity: 'hiking', advice: allAdvice });

    expect(report.crossings.map((c) => c.status)).toEqual(['no-flock', 'no-flock']);
    expect(report.mostCautious).toBe('no-flock');
    expect(report.advice.map((a) => a.id)).toEqual(['zone']);
  });

  it('has nothing to report for a track outside pastoral zones', () => {
    const away: Track = { name: 'Ailleurs', segments: [[{ longitude: 5.0, latitude: 44.0 }, { longitude: 5.01, latitude: 44.0 }]] };

    const report = prepareOuting({ track: away, zones, date: '2026-07-15', activity: 'hiking', advice: allAdvice });

    expect(report.crossings).toEqual([]);
    expect(report.mostCautious).toBeNull();
    expect(report.advice).toEqual([]);
  });
});

describe('prepareOuting with field sightings', () => {
  const sighting = (guardDogs: boolean, recent = true) => ({
    observation: {
      id: 'o',
      observedAt: '2026-07-14T08:00:00Z',
      position: { longitude: 5.745, latitude: 45.006 },
      species: 'cattle' as const,
      headcount: 'hundreds' as const,
      guardDogs,
    },
    recent,
    haloMeters: 500,
  });

  it('lists the recent sightings near the track', () => {
    const report = prepareOuting({ track, zones, date: '2026-07-15', activity: 'hiking', advice: allAdvice, sightings: [sighting(false)] });

    expect(report.sightings.map((s) => [s.observation.id, s.km])).toEqual([['o', 4.3]]);
  });

  it('ignores sightings that are no longer recent', () => {
    const report = prepareOuting({ track, zones, date: '2026-07-15', activity: 'hiking', advice: allAdvice, sightings: [sighting(true, false)] });

    expect(report.sightings).toEqual([]);
  });

  it('becomes as cautious as a recent sighting with guard dogs', () => {
    const report = prepareOuting({
      track,
      zones: [],
      date: '2026-11-05',
      activity: 'hiking',
      advice: allAdvice,
      sightings: [sighting(true)],
    });

    expect(report.mostCautious).toBe('flock-with-dogs');
    expect(report.advice.map((a) => a.id)).toEqual(['flock', 'dogs']);
  });
});

describe('prepareOuting with nests near the track', () => {
  it('lists them without changing the flock caution', () => {
    const nest = {
      observation: { id: 'n', observedAt: '2026-07-14T08:00:00Z', position: { longitude: 5.745, latitude: 45.006 }, kind: 'hornet-nest' as const },
      recent: true,
      haloMeters: 200,
    };

    const report = prepareOuting({ track, zones: [], date: '2026-11-05', activity: 'hiking', advice: allAdvice, sightings: [nest] });

    expect(report.sightings.map((s) => s.observation.id)).toEqual(['n']);
    expect(report.mostCautious).toBeNull();
  });
});
