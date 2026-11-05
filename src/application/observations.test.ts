import { describe, expect, it } from 'vitest';
import type { Observation, ObservationSettings } from '../domain/observation';
import type { Track } from '../domain/track';
import { createObservation, showObservations } from './observations';
import type { MapView, ObservationOnMap } from './ports';

class FakeMapView implements MapView {
  observations: ObservationOnMap[][] = [];
  fitTo(): void {}
  showBaseMap(): void {}
  showPastoralZones(): void {}
  setZoneLayerVisible(): void {}
  showTrack(): void {}
  showObservations(items: ObservationOnMap[]): void {
    this.observations.push(items);
  }
}

const timed: Track = {
  name: 'Sortie',
  segments: [
    [
      { longitude: 5.7, latitude: 45.0, time: '2026-07-15T06:00:00Z' },
      { longitude: 5.7, latitude: 45.017986, time: '2026-07-15T06:40:00Z' },
    ],
  ],
};
const untimed: Track = { ...timed, segments: [timed.segments[0]!.map(({ longitude, latitude }) => ({ longitude, latitude }))] };

describe('createObservation', () => {
  it('places the sighting at the chosen km, at the time of the GPX', () => {
    const result = createObservation({ track: timed, km: 1, species: 'sheep', headcount: 'hundreds', guardDogs: true, outingDate: '2026-07-15' });

    expect(result.timeFromTrack).toBe(true);
    expect(result.observation).toMatchObject({
      observedAt: '2026-07-15T06:20:00.000Z',
      species: 'sheep',
      headcount: 'hundreds',
      guardDogs: true,
    });
    expect(result.observation.position.latitude).toBeCloseTo(45.009, 3);
    expect(result.observation.id).toBe('obs-2026-07-15T06:20:00.000Z-45.0090-5.7000');
  });

  it('rounds the position to about one metre', () => {
    const { observation } = createObservation({ track: timed, km: 0.3333, species: 'sheep', headcount: 'few', guardDogs: false, outingDate: '2026-07-15' });

    expect(String(observation.position.latitude).split('.')[1]?.length).toBeLessThanOrEqual(5);
    expect(observation.position.longitude).toBe(5.7);
  });

  it('uses noon on the outing day when the GPX has no time', () => {
    const result = createObservation({ track: untimed, km: 1, species: 'cattle', headcount: 'dozens', guardDogs: false, outingDate: '2026-07-15' });

    expect(result.timeFromTrack).toBe(false);
    expect(new Date(result.observation.observedAt).getHours()).toBe(12);
  });
});

const settings: ObservationSettings = { validityDays: 3, haloMeters: { sheep: 400, cattle: 500, goats: 300, horses: 500, donkeys: 300, mixed: 400 } };
const seen = (id: string, observedAt: string, species: Observation['species'] = 'sheep'): Observation => ({
  id,
  observedAt,
  position: { longitude: 5.7, latitude: 45 },
  species,
  headcount: 'dozens',
  guardDogs: false,
});

describe('showObservations', () => {
  it('shows each sighting with its halo, sharp while recent', async () => {
    const map = new FakeMapView();
    const observations = [seen('new', '2026-07-14T08:00:00Z', 'cattle'), seen('old', '2026-07-01T08:00:00Z')];

    const result = await showObservations(
      { load: async () => observations },
      { load: async () => settings },
      map,
      new Date('2026-07-15T12:00:00Z'),
    );

    expect(map.observations).toEqual([
      [
        { observation: observations[0], recent: true, haloMeters: 500 },
        { observation: observations[1], recent: false, haloMeters: 400 },
      ],
    ]);
    expect(result).toEqual({ available: true, recent: 1, total: 2, items: map.observations[0] });
  });

  it('reports observations as unavailable when they cannot be loaded', async () => {
    const map = new FakeMapView();

    const result = await showObservations(
      { load: async () => Promise.reject(new Error('offline')) },
      { load: async () => settings },
      map,
      new Date(),
    );

    expect(result).toEqual({ available: false });
    expect(map.observations).toEqual([]);
  });
});
