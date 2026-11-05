import { describe, expect, it } from 'vitest';
import type { PastoralZone } from '../domain/pastoral-zone';
import { fromGeoJson, toGeoJson, validatePastoralZonesGeoJson, type ZonesMetadata } from './pastoral-zones-geojson';

const zones: PastoralZone[] = [
  {
    id: 'UP-A_Q01',
    name: 'Alpage A',
    quarter: 'Quartier A',
    geometry: [[[[5.7, 45.3], [5.8, 45.3], [5.8, 45.4], [5.7, 45.3]]]],
    presence: { start: '2026-06-15', end: '2026-09-30', species: ['sheep'], guardDogs: true, weekdays: [1, 2, 3, 4, 5, 6, 7] },
  },
  {
    id: 'UP-B_Q01',
    name: 'Alpage B',
    quarter: 'Quartier B',
    geometry: [[[[5.5, 45.0], [5.6, 45.0], [5.6, 45.1], [5.5, 45.0]]]],
    presence: null,
  },
];

const metadata: ZonesMetadata = {
  source: 'Map Patou — Réseau Pastoral AuRA',
  requestedDate: '2026-07-15',
  fetchedAt: '2026-07-15T05:00:00.000Z',
};

const valid = () => JSON.parse(JSON.stringify(toGeoJson(zones, metadata))) as Record<string, any>;

describe('pastoral zones GeoJSON', () => {
  it('is a FeatureCollection of MultiPolygons carrying the zone properties', () => {
    const geojson = toGeoJson(zones, metadata);

    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features[0]).toEqual({
      type: 'Feature',
      id: 'UP-A_Q01',
      geometry: { type: 'MultiPolygon', coordinates: zones[0]!.geometry },
      properties: { name: 'Alpage A', quarter: 'Quartier A', presence: zones[0]!.presence },
    });
  });

  it('carries where and when the data comes from', () => {
    expect(toGeoJson(zones, metadata).metadata).toEqual(metadata);
  });

  it('reads back exactly what was written', () => {
    expect(fromGeoJson(valid())).toEqual({ zones, metadata });
  });

  it('accepts a valid file', () => {
    expect(validatePastoralZonesGeoJson(valid())).toEqual([]);
  });

  it.each([
    ['not an object', () => 'hello', 'not a FeatureCollection'],
    ['missing metadata', (d: any) => (delete d.metadata, d), 'metadata: missing'],
    ['bad requested date', (d: any) => ((d.metadata.requestedDate = '15/07/2026'), d), 'metadata.requestedDate: not a YYYY-MM-DD date'],
    ['missing id', (d: any) => (delete d.features[0].id, d), 'features[0].id: missing'],
    ['duplicated id', (d: any) => ((d.features[1].id = 'UP-A_Q01'), d), 'features[1].id: duplicated'],
    ['wrong geometry type', (d: any) => ((d.features[0].geometry.type = 'Point'), d), 'features[0].geometry: not a MultiPolygon'],
    ['coordinates out of range', (d: any) => ((d.features[0].geometry.coordinates[0][0][0] = [200, 45]), d), 'features[0].geometry: invalid coordinates'],
    ['missing name', (d: any) => (delete d.features[0].properties.name, d), 'features[0].properties.name: missing'],
    ['bad presence date', (d: any) => ((d.features[0].properties.presence.start = '2026-6-15'), d), 'features[0].properties.presence.start: not a YYYY-MM-DD date'],
    ['presence ending before it starts', (d: any) => ((d.features[0].properties.presence.end = '2026-06-01'), d), 'features[0].properties.presence: ends before it starts'],
    ['unknown species', (d: any) => ((d.features[0].properties.presence.species = ['llama']), d), 'features[0].properties.presence.species: unknown species llama'],
    ['guard dogs not a boolean', (d: any) => ((d.features[0].properties.presence.guardDogs = 'yes'), d), 'features[0].properties.presence.guardDogs: not a boolean'],
    ['bad weekday', (d: any) => ((d.features[0].properties.presence.weekdays = [0]), d), 'features[0].properties.presence.weekdays: not weekdays 1 to 7'],
  ])('rejects %s', (_case, corrupt, error) => {
    expect(validatePastoralZonesGeoJson(corrupt(valid()))).toContain(error);
  });

  it('refuses to read an invalid file, listing the errors', () => {
    const data = valid();
    delete data.features[0].id;

    expect(() => fromGeoJson(data)).toThrow('Invalid pastoral zones GeoJSON: features[0].id: missing');
  });
});
