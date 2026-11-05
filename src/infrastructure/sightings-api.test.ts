import { describe, expect, it, vi } from 'vitest';
import type { Observation } from '../domain/observation';
import { HttpSightingPublisher, MergedObservationRepository } from './sightings-api';

const here = { longitude: 5.65, latitude: 45.11 };
const nest: Observation = { id: 'b', observedAt: '2026-07-15T08:00:00.000Z', position: here, kind: 'hornet-nest' };

describe('HttpSightingPublisher', () => {
  it('posts the sighting as a GeoJSON Feature to the API', async () => {
    const fetchFn = vi.fn(async () => new Response('{"id":"x","status":"pending"}', { status: 201 }));

    const received = await new HttpSightingPublisher('https://api.example.org/', fetchFn).publish(nest);

    expect(received).toBe(true);
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.example.org/api/sightings');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body as string)).toEqual({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [5.65, 45.11] },
      properties: { observedAt: '2026-07-15T08:00:00.000Z', kind: 'hornet-nest' },
    });
  });

  it('says when the API refuses it', async () => {
    const fetchFn = vi.fn(async () => new Response('{"errors":[]}', { status: 400 }));

    expect(await new HttpSightingPublisher('https://api.example.org', fetchFn).publish(nest)).toBe(false);
  });
});

describe('MergedObservationRepository', () => {
  it('gathers the sightings of every source, ignoring one that fails', async () => {
    const other: Observation = { ...nest, id: 'c' };
    const repository = new MergedObservationRepository([
      { load: async () => [nest] },
      { load: () => Promise.reject(new Error('API down')) },
      { load: async () => [other] },
    ]);

    expect((await repository.load()).map((o) => o.id)).toEqual(['b', 'c']);
  });

  it('fails only when every source fails', async () => {
    const repository = new MergedObservationRepository([{ load: () => Promise.reject(new Error('down')) }]);

    await expect(repository.load()).rejects.toThrow('down');
  });
});
