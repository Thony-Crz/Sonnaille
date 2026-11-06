import type { ObservationRepository, SightingPublisher } from '../application/ports';
import type { Observation } from '../domain/observation';
import type { KeyValueStorage } from './local-storage-value';
import { observationFeature, parseObservations } from './observations-content';

export const DEMO_SIGHTINGS_KEY = 'sonnaille.demo.published';

/**
 * Demo mode: stands in for the V1 sightings API (docs/api.md) without any server.
 * What is "published" stays in this browser and is shown at once, as if a moderator
 * had approved it. Nothing leaves the device.
 */
export class DemoSightingsServer implements SightingPublisher, ObservationRepository {
  constructor(private readonly storage: () => KeyValueStorage) {}

  async publish(observation: Observation): Promise<boolean> {
    // The server gives its own id, like the real API.
    const received = { ...observation, id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    this.write([...this.read(), received]);
    return true;
  }

  async load(): Promise<Observation[]> {
    return this.read();
  }

  reset(): void {
    this.write([]);
  }

  private read(): Observation[] {
    try {
      const saved = this.storage().getItem(DEMO_SIGHTINGS_KEY);
      return saved ? parseObservations(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  }

  private write(observations: Observation[]): void {
    try {
      this.storage().setItem(DEMO_SIGHTINGS_KEY, JSON.stringify({ type: 'FeatureCollection', features: observations.map(observationFeature) }));
    } catch {
      // Private browsing or full storage: the demo goes on without memory.
    }
  }
}
