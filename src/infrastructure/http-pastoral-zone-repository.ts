import type { PastoralZoneRepository } from '../application/ports';
import type { PastoralZoneDataset } from '../domain/pastoral-zone';
import { fromGeoJson } from './pastoral-zones-geojson';

/** Reads the pastoral zones file published with the site (docs/format-zones.md). */
export class HttpPastoralZoneRepository implements PastoralZoneRepository {
  constructor(
    private readonly url: string,
    private readonly fetchFn: (url: string) => Promise<Response>,
  ) {}

  async load(): Promise<PastoralZoneDataset> {
    const response = await this.fetchFn(this.url);
    if (!response.ok) throw new Error(`Pastoral zones not available (${response.status})`);

    const { zones, metadata } = fromGeoJson(await response.json());
    return { zones, ...metadata };
  }
}
