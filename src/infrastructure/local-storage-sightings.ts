import type { MySightingsStore } from '../application/ports';
import type { Observation } from '../domain/observation';
import type { KeyValueStorage } from './local-storage-value';
import { observationFeature, parseObservations } from './observations-content';

export const MY_SIGHTINGS_KEY = 'sonnaille.mySightings';

/**
 * The user's sightings, kept in the browser until published, in the same GeoJSON
 * format as content/observations.geojson. Damaged data or missing storage: empty list.
 */
export class LocalStorageSightings implements MySightingsStore {
  constructor(private readonly storage: () => KeyValueStorage) {}

  load(): Observation[] {
    try {
      const saved = this.storage().getItem(MY_SIGHTINGS_KEY);
      return saved ? parseObservations(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  }

  save(observations: Observation[]): void {
    try {
      this.storage().setItem(
        MY_SIGHTINGS_KEY,
        JSON.stringify({ type: 'FeatureCollection', features: observations.map(observationFeature) }),
      );
    } catch {
      // Not kept this time; nothing else to do.
    }
  }
}

/** The features to paste into the "features" list of content/observations.geojson. */
export function publicationText(observations: Observation[]): string {
  return observations.map((o) => JSON.stringify(observationFeature(o), null, 2)).join(',\n');
}
