import { describe, expect, it } from 'vitest';
import type { Observation } from '../domain/observation';
import type { MySightingsStore, SightingPublisher } from './ports';
import { publishMySightings } from './publish-sightings';

class InMemoryStore implements MySightingsStore {
  constructor(public saved: Observation[]) {}
  load(): Observation[] {
    return this.saved;
  }
  save(observations: Observation[]): void {
    this.saved = observations;
  }
}

const here = { longitude: 5.65, latitude: 45.11 };
const flock: Observation = { id: 'a', observedAt: '2026-07-15T07:30:00.000Z', position: here, species: 'sheep', headcount: 'dozens', guardDogs: true };
const nest: Observation = { id: 'b', observedAt: '2026-07-15T08:00:00.000Z', position: here, kind: 'hornet-nest' };

/** Accepts every sighting except the ids it is told to refuse. */
const publisher = (refusing: string[] = []): SightingPublisher & { sent: string[] } => {
  const sent: string[] = [];
  return {
    sent,
    publish: async (observation) => {
      sent.push(observation.id);
      return !refusing.includes(observation.id);
    },
  };
};

describe('publishMySightings', () => {
  it('sends every sighting kept on the device, then forgets the ones received', async () => {
    const store = new InMemoryStore([flock, nest]);
    const server = publisher();

    const result = await publishMySightings(store, server);

    expect(server.sent.sort()).toEqual(['a', 'b']);
    expect(result).toEqual({ sent: 2, kept: 0 });
    expect(store.saved).toEqual([]);
  });

  it('keeps on the device what was not received, to try again later', async () => {
    const store = new InMemoryStore([flock, nest]);

    const result = await publishMySightings(store, publisher(['b']));

    expect(result).toEqual({ sent: 1, kept: 1 });
    expect(store.saved).toEqual([nest]);
  });

  it('keeps everything when the server cannot be reached', async () => {
    const store = new InMemoryStore([flock]);
    const offline: SightingPublisher = { publish: () => Promise.reject(new Error('offline')) };

    expect(await publishMySightings(store, offline)).toEqual({ sent: 0, kept: 1 });
    expect(store.saved).toEqual([flock]);
  });
});
