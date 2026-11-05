import { describe, expect, it, vi } from 'vitest';
import type { PastoralZone } from '../domain/pastoral-zone';
import { HttpPastoralZoneRepository } from './http-pastoral-zone-repository';
import { toGeoJson } from './pastoral-zones-geojson';

const zone: PastoralZone = {
  id: 'A',
  name: 'Alpage A',
  quarter: 'Quartier A',
  geometry: [[[[5.7, 45.3], [5.8, 45.3], [5.8, 45.4], [5.7, 45.3]]]],
  presence: null,
};

const metadata = { source: 'Map Patou — Réseau Pastoral AuRA', requestedDate: '2026-07-15', fetchedAt: '2026-07-15T05:00:00.000Z' };

const respond = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe('HttpPastoralZoneRepository', () => {
  it('reads the published file at the given URL', async () => {
    const fetchFn = respond(toGeoJson([zone], metadata));

    const dataset = await new HttpPastoralZoneRepository('/Sonnaille/data/pastoral-zones.geojson', fetchFn).load();

    expect(fetchFn).toHaveBeenCalledWith('/Sonnaille/data/pastoral-zones.geojson');
    expect(dataset).toEqual({ zones: [zone], ...metadata });
  });

  it('fails when the file is missing', async () => {
    const repository = new HttpPastoralZoneRepository('/data/pastoral-zones.geojson', respond('Not found', 404));

    await expect(repository.load()).rejects.toThrow('Pastoral zones not available (404)');
  });

  it('fails when the file is invalid', async () => {
    const repository = new HttpPastoralZoneRepository('/data/pastoral-zones.geojson', respond({ type: 'nope' }));

    await expect(repository.load()).rejects.toThrow('Invalid pastoral zones GeoJSON');
  });
});
