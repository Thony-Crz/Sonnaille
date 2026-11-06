import { describe, expect, it } from 'vitest';
import type { Observation } from '../domain/observation';
import { DemoSightingsServer } from './demo-sightings-server';
import type { KeyValueStorage } from './local-storage-value';

const memoryStorage = (): KeyValueStorage => {
  const values = new Map<string, string>();
  return { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => void values.set(k, v) };
};

const here = { longitude: 5.65, latitude: 45.11 };
const nest: Observation = { id: 'mine-1', observedAt: '2026-07-15T08:00:00.000Z', position: here, kind: 'hornet-nest' };

describe('DemoSightingsServer (demo mode: a server that lives in the browser)', () => {
  it('receives a sighting and shows it at once, as if a moderator had approved it', async () => {
    const server = new DemoSightingsServer(() => memoryStorage());
    const storage = memoryStorage();
    const demo = new DemoSightingsServer(() => storage);

    expect(await demo.publish(nest)).toBe(true);

    const published = await demo.load();
    expect(published).toHaveLength(1);
    expect(published[0]).toMatchObject({ kind: 'hornet-nest', observedAt: nest.observedAt, position: here });
    expect(published[0]!.id).not.toBe(nest.id);
    expect(await server.load()).toEqual([]);
  });

  it('keeps what it received after a reload of the page', async () => {
    const storage = memoryStorage();
    await new DemoSightingsServer(() => storage).publish(nest);

    expect(await new DemoSightingsServer(() => storage).load()).toHaveLength(1);
  });

  it('can be emptied, to replay the demo', async () => {
    const storage = memoryStorage();
    const demo = new DemoSightingsServer(() => storage);
    await demo.publish(nest);

    demo.reset();

    expect(await demo.load()).toEqual([]);
  });
});
