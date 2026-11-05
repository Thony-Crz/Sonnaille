import type { MySightingsStore, SightingPublisher } from './ports';

export interface PublishResult {
  sent: number;
  kept: number;
}

/**
 * Sends the sightings kept on this device to the server, where a moderator checks them.
 * What the server received is forgotten here; the rest stays, to try again later.
 */
export async function publishMySightings(store: MySightingsStore, publisher: SightingPublisher): Promise<PublishResult> {
  const sightings = store.load();
  const received = await Promise.all(sightings.map((s) => publisher.publish(s).catch(() => false)));
  const kept = sightings.filter((_, i) => !received[i]);
  store.save(kept);
  return { sent: sightings.length - kept.length, kept: kept.length };
}
