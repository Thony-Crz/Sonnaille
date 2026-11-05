import type { ObservationRepository, SightingPublisher } from '../application/ports';
import type { Observation } from '../domain/observation';
import { observationFeature } from './observations-content';

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

/** Posts a sighting to the V1 API (docs/api.md), in the same GeoJSON as content/observations.geojson. */
export class HttpSightingPublisher implements SightingPublisher {
  constructor(
    private readonly apiUrl: string,
    private readonly fetchFn: FetchFn,
  ) {}

  async publish(observation: Observation): Promise<boolean> {
    // The server gives its own id.
    const { id: _ignored, ...feature } = observationFeature(observation);
    const response = await this.fetchFn(`${this.apiUrl.replace(/\/+$/, '')}/api/sightings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feature),
    });
    return response.status === 201;
  }
}

/** Sightings from several places (the published file and the API): one that fails does not hide the others. */
export class MergedObservationRepository implements ObservationRepository {
  constructor(private readonly sources: ObservationRepository[]) {}

  async load(): Promise<Observation[]> {
    const results = await Promise.allSettled(this.sources.map((s) => s.load()));
    const loaded = results.filter((r): r is PromiseFulfilledResult<Observation[]> => r.status === 'fulfilled');
    if (loaded.length === 0 && results[0]?.status === 'rejected') throw results[0].reason;
    return loaded.flatMap((r) => r.value);
  }
}
