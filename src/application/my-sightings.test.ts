import { describe, expect, it } from 'vitest';
import type { FlockObservation, Observation } from '../domain/observation';
import { createObservationAt, deleteMySighting, mySightings, saveMySighting } from './my-sightings';
import type { MySightingsStore } from './ports';

class InMemoryStore implements MySightingsStore {
  saved: Observation[] = [];
  load(): Observation[] {
    return this.saved;
  }
  save(observations: Observation[]): void {
    this.saved = observations;
  }
}

const answers = { species: 'donkeys' as const, headcount: 'few' as const, guardDogs: false };

describe('createObservationAt', () => {
  it('records the sighting at the tapped point, on the given local day and time', () => {
    const observation = createObservationAt({
      position: { longitude: 5.6512345, latitude: 45.1123456 },
      date: '2026-07-15',
      time: '09:30',
      what: { kind: 'flock', ...answers },
    });

    const observedAt = new Date(observation.observedAt);
    expect([observedAt.getDate(), observedAt.getHours(), observedAt.getMinutes()]).toEqual([15, 9, 30]);
    expect(observation.position).toEqual({ longitude: 5.65123, latitude: 45.11235 });
    expect(observation).toMatchObject(answers);
    expect(observation.id).toMatch(/^obs-/);
  });
});

describe('my sightings', () => {
  const sighting = (id: string, observedAt: string): FlockObservation => ({
    id,
    observedAt,
    position: { longitude: 5.65, latitude: 45.11 },
    ...answers,
  });

  it('keeps each saved sighting on the device, the most recent first', () => {
    const store = new InMemoryStore();

    saveMySighting(store, sighting('a', '2026-07-14T08:00:00Z'));
    saveMySighting(store, sighting('b', '2026-07-15T08:00:00Z'));

    expect(mySightings(store).map((o) => o.id)).toEqual(['b', 'a']);
  });

  it('replaces a sighting saved twice', () => {
    const store = new InMemoryStore();

    saveMySighting(store, sighting('a', '2026-07-14T08:00:00Z'));
    saveMySighting(store, { ...sighting('a', '2026-07-14T08:00:00Z'), guardDogs: true });

    expect(mySightings(store)).toHaveLength(1);
    expect((mySightings(store)[0] as FlockObservation | undefined)?.guardDogs).toBe(true);
  });

  it('deletes a sighting', () => {
    const store = new InMemoryStore();
    saveMySighting(store, sighting('a', '2026-07-14T08:00:00Z'));

    deleteMySighting(store, 'a');

    expect(mySightings(store)).toEqual([]);
  });
});

describe('createObservationAt for nests and beehives', () => {
  it('records only the kind, with no animal fields', () => {
    const observation = createObservationAt({ position: { longitude: 5.65, latitude: 45.11 }, date: '2026-07-15', time: '09:30', what: { kind: 'wasp-nest' } });

    expect(observation).toMatchObject({ kind: 'wasp-nest' });
    expect(observation).not.toHaveProperty('species');
  });
});
