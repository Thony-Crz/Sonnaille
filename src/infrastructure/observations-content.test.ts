import { describe, expect, it, vi } from 'vitest';
import type { Observation } from '../domain/observation';
import {
  HttpObservationRepository,
  HttpObservationSettings,
  observationFeature,
  observationsErrors,
  parseObservations,
  parseObservationSettings,
} from './observations-content';

const observation: Observation = {
  id: 'obs-2026-07-15T06:20:00.000Z-45.0090-5.7000',
  observedAt: '2026-07-15T06:20:00.000Z',
  position: { longitude: 5.7, latitude: 45.009 },
  species: 'sheep',
  headcount: 'hundreds',
  guardDogs: true,
};

const collection = () => ({ type: 'FeatureCollection', features: [observationFeature(observation)] });

describe('observations file', () => {
  it('writes an observation as a GeoJSON point', () => {
    expect(observationFeature(observation)).toEqual({
      type: 'Feature',
      id: observation.id,
      geometry: { type: 'Point', coordinates: [5.7, 45.009] },
      properties: { observedAt: '2026-07-15T06:20:00.000Z', species: 'sheep', headcount: 'hundreds', guardDogs: true },
    });
  });

  it('reads back what was written', () => {
    expect(parseObservations(collection())).toEqual([observation]);
  });

  it('accepts an empty file', () => {
    expect(parseObservations({ type: 'FeatureCollection', features: [] })).toEqual([]);
  });

  it.each([
    ['not a collection', () => ({}), 'not a FeatureCollection'],
    ['missing id', (d: any) => (delete d.features[0].id, d), 'features[0].id: missing'],
    ['not a point', (d: any) => ((d.features[0].geometry.type = 'LineString'), d), 'features[0].geometry: not a Point'],
    ['bad time', (d: any) => ((d.features[0].properties.observedAt = 'hier'), d), 'features[0].properties.observedAt: not a date and time'],
    ['unknown species', (d: any) => ((d.features[0].properties.species = 'yaks'), d), 'features[0].properties.species: unknown'],
    ['unknown headcount', (d: any) => ((d.features[0].properties.headcount = 12), d), 'features[0].properties.headcount: unknown'],
    ['free text', (d: any) => ((d.features[0].properties.comment = 'chien agressif'), d), 'features[0].properties: unexpected comment'],
  ])('rejects %s', (_case, corrupt, error) => {
    expect(observationsErrors(corrupt(collection()))).toContain(error);
  });
});

describe('observation settings', () => {
  const settings = { validityDays: 3, haloMeters: { sheep: 400, cattle: 500, goats: 300, horses: 500, mixed: 400 } };

  it('reads the validity and the halo of each species', () => {
    expect(parseObservationSettings(settings)).toEqual(settings);
  });

  it('rejects a missing species halo', () => {
    expect(() => parseObservationSettings({ ...settings, haloMeters: { sheep: 400 } })).toThrow('Invalid observation settings');
  });

  it('rejects a non-positive validity', () => {
    expect(() => parseObservationSettings({ ...settings, validityDays: 0 })).toThrow('Invalid observation settings');
  });
});

describe('HTTP repositories', () => {
  it('load the published observations and settings', async () => {
    const fetchFn = vi.fn(async (url: string) =>
      new Response(JSON.stringify(url.endsWith('settings.json') ? { validityDays: 3, haloMeters: { sheep: 1, cattle: 1, goats: 1, horses: 1, mixed: 1 } } : collection())),
    );

    expect(await new HttpObservationRepository('/o.geojson', fetchFn).load()).toEqual([observation]);
    expect((await new HttpObservationSettings('/observation-settings.json', fetchFn).load()).validityDays).toBe(3);
  });

  it('fail when a file is missing', async () => {
    const missing = vi.fn(async () => new Response('', { status: 404 }));

    await expect(new HttpObservationRepository('/o.geojson', missing).load()).rejects.toThrow('Observations not available (404)');
  });
});
