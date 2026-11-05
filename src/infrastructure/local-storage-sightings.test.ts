import { describe, expect, it } from 'vitest';
import type { Observation } from '../domain/observation';
import { LocalStorageSightings, MY_SIGHTINGS_KEY, publicationText } from './local-storage-sightings';

const sighting: Observation = {
  id: 'obs-1',
  observedAt: '2026-07-15T07:30:00.000Z',
  position: { longitude: 5.65, latitude: 45.11 },
  species: 'donkeys',
  headcount: 'few',
  guardDogs: false,
};

const memory = () => {
  const items = new Map<string, string>();
  return {
    items,
    storage: () => ({ getItem: (k: string) => items.get(k) ?? null, setItem: (k: string, v: string) => void items.set(k, v) }),
  };
};

describe('LocalStorageSightings', () => {
  it('keeps the sightings on the device, in the published GeoJSON format', () => {
    const { items, storage } = memory();
    const store = new LocalStorageSightings(storage);

    store.save([sighting]);

    expect(MY_SIGHTINGS_KEY).toBe('sonnaille.mySightings');
    expect(JSON.parse(items.get(MY_SIGHTINGS_KEY)!)).toMatchObject({ type: 'FeatureCollection', features: [{ id: 'obs-1' }] });
    expect(store.load()).toEqual([sighting]);
  });

  it('starts empty', () => {
    expect(new LocalStorageSightings(memory().storage).load()).toEqual([]);
  });

  it('ignores damaged saved data instead of failing', () => {
    const { items, storage } = memory();
    items.set(MY_SIGHTINGS_KEY, '{not json');

    expect(new LocalStorageSightings(storage).load()).toEqual([]);
  });

  it('works without storage (private browsing)', () => {
    const store = new LocalStorageSightings(() => {
      throw new Error('SecurityError');
    });

    expect(store.load()).toEqual([]);
    expect(() => store.save([sighting])).not.toThrow();
  });
});

describe('publicationText', () => {
  it('gives the GeoJSON features to paste into the observations file, separated by commas', () => {
    const text = publicationText([sighting, { ...sighting, id: 'obs-2' }]);

    expect(JSON.parse(`[${text}]`).map((f: { id: string }) => f.id)).toEqual(['obs-1', 'obs-2']);
  });
});
