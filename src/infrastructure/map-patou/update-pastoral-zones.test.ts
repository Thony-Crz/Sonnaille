import { describe, expect, it, vi } from 'vitest';
import { V0_TERRITORY } from '../../domain/territory';
import { validatePastoralZonesGeoJson } from '../pastoral-zones-geojson';
import { MAP_PATOU_API, fetchMapPatou, parisDay, updatePastoralZones } from './update-pastoral-zones';

const apiResponse = {
  success: true,
  message: 'success',
  data: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'MultiPolygon', coordinates: [[[[5.7, 45.3], [5.75, 45.3], [5.75, 45.35], [5.7, 45.3]]]] },
        properties: { id: 'A', nom: 'Alpage A', surface: 'Quartier A', type_animal: 'ovins', chiens: true, debut: '2026-06-15', fin: '2026-09-30' },
      },
    ],
  },
};

const okFetch = () => vi.fn(async () => new Response(JSON.stringify(apiResponse), { status: 200 }));

describe('fetchMapPatou', () => {
  it('asks the API for the presences of a given day', async () => {
    const fetchFn = okFetch();

    await fetchMapPatou('2026-07-15', fetchFn);

    expect(fetchFn).toHaveBeenCalledWith(MAP_PATOU_API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ date: '2026-07-15T10:00:00.000Z' }),
    });
    expect(MAP_PATOU_API).toBe('https://mappatous-api.lessem.inrae.fr/api/v1/map/geojson');
  });

  it('fails when the API does not answer properly', async () => {
    const fetchFn = vi.fn(async () => new Response('busy', { status: 503 }));

    await expect(fetchMapPatou('2026-07-15', fetchFn)).rejects.toThrow('Map Patou API answered 503');
  });
});

describe('parisDay', () => {
  it('gives the day in Paris, not in UTC', () => {
    expect(parisDay(new Date('2026-07-14T22:30:00Z'))).toBe('2026-07-15');
  });
});

describe('updatePastoralZones', () => {
  const now = new Date('2026-07-15T05:00:00Z');

  it('fetches the day, keeps the territory and returns a valid file', async () => {
    const result = await updatePastoralZones({ now, existing: null, fetchFn: okFetch(), territory: V0_TERRITORY });

    expect(result.fetched).toBe(true);
    expect(validatePastoralZonesGeoJson(result.geojson)).toEqual([]);
    expect(result.geojson.metadata).toEqual({
      source: 'Map Patou — Réseau Pastoral AuRA',
      requestedDate: '2026-07-15',
      fetchedAt: '2026-07-15T05:00:00.000Z',
    });
    expect(result.geojson.features.map((f) => f.id)).toEqual(['A']);
  });

  it('does not call the API again on the same day', async () => {
    const first = await updatePastoralZones({ now, existing: null, fetchFn: okFetch(), territory: V0_TERRITORY });
    const fetchFn = okFetch();

    const second = await updatePastoralZones({ now, existing: first.geojson, fetchFn, territory: V0_TERRITORY });

    expect(fetchFn).not.toHaveBeenCalled();
    expect(second).toEqual({ fetched: false, geojson: first.geojson });
  });

  it('calls the API again the next day', async () => {
    const first = await updatePastoralZones({ now, existing: null, fetchFn: okFetch(), territory: V0_TERRITORY });
    const fetchFn = okFetch();

    await updatePastoralZones({ now: new Date('2026-07-16T05:00:00Z'), existing: first.geojson, fetchFn, territory: V0_TERRITORY });

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('can be asked for another day', async () => {
    const result = await updatePastoralZones({ now, date: '2026-08-01', existing: null, fetchFn: okFetch(), territory: V0_TERRITORY });

    expect(result.geojson.metadata.requestedDate).toBe('2026-08-01');
  });
});
