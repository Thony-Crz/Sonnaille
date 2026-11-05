// @vitest-environment happy-dom
// End-to-end check of the outing analysis: reference GPX files → GPX reader →
// published zones format → prepareOuting. All data here is fictitious.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { prepareOuting } from '../../src/application/prepare-outing';
import type { Advice } from '../../src/domain/advice';
import type { PastoralZone } from '../../src/domain/pastoral-zone';
import { readGpx } from '../../src/infrastructure/gpx-reader';
import { fromGeoJson, toGeoJson } from '../../src/infrastructure/pastoral-zones-geojson';

const square = (west: number, south: number): number[][][][] => [
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

// Two fictitious zones, published and read back as the app does.
const published = toGeoJson(
  [
    {
      id: 'DOGS',
      name: 'Alpage fictif avec chiens',
      quarter: '',
      geometry: square(5.7, 45.2),
      presence: { start: '2026-06-15', end: '2026-09-30', species: ['sheep'], guardDogs: true, weekdays: [1, 2, 3, 4, 5, 6, 7] },
    },
    {
      id: 'FAR',
      name: 'Alpage fictif lointain',
      quarter: '',
      geometry: square(6.5, 45.5),
      presence: null,
    },
  ] satisfies PastoralZone[],
  { source: 'Données fictives', requestedDate: '2026-07-15', fetchedAt: '2026-07-15T05:00:00.000Z' },
);
const { zones } = fromGeoJson(JSON.parse(JSON.stringify(published)));

const advice: Advice[] = JSON.parse(readFileSync(join(import.meta.dirname, '..', '..', 'public', 'content', 'advice.json'), 'utf8')).advice;

const analyse = (file: string, date: string, marginMeters?: number) => {
  const text = readFileSync(join(import.meta.dirname, '..', 'fixtures', 'gpx', file), 'utf8');
  return prepareOuting({ track: readGpx(text, file), zones, date, activity: 'hiking', advice, marginMeters });
};

describe('outing analysis from reference GPX files', () => {
  it('crossing: finds the zone with guard dogs, where and for how long', () => {
    const report = analyse('crossing.gpx', '2026-07-15');

    expect(report.name).toBe('Traversée');
    expect(report.crossings.map((c) => [c.zone.id, c.status])).toEqual([['DOGS', 'flock-with-dogs']]);
    expect(report.crossings[0]?.entryKm).toBeCloseTo(0.7, 1);
    expect(report.crossings[0]?.insideKm).toBeCloseTo(0.9, 1);
    expect(report.advice.map((a) => a.id)).toContain('dog-comes');
  });

  it('grazing: a track 30 m away counts within the default margin, not without margin', () => {
    expect(analyse('grazing.gpx', '2026-07-15').crossings.map((c) => c.zone.id)).toEqual(['DOGS']);
    expect(analyse('grazing.gpx', '2026-07-15', 0).crossings).toEqual([]);
  });

  it('away: a route far from the zones crosses nothing', () => {
    const report = analyse('away.gpx', '2026-07-15');

    expect(report.name).toBe('Loin des alpages');
    expect(report.crossings).toEqual([]);
    expect(report.advice).toEqual([]);
  });

  it('out of season: the same crossing, without flock on that day', () => {
    const report = analyse('crossing.gpx', '2026-11-05');

    expect(report.crossings.map((c) => c.status)).toEqual(['no-flock']);
    expect(report.advice.map((a) => a.id)).toEqual(['pastoral-zone']);
  });
});
