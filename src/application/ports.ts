import type { BaseMapId } from '../domain/base-map';
import type { Bounds } from '../domain/bounds';

/** What the use cases expect from the displayed map. Implemented in `ui`. */
export interface MapView {
  fitTo(bounds: Bounds): void;
  showBaseMap(id: BaseMapId): void;
}

/** Where the user's base map choice is remembered, on their device. Implemented in `infrastructure`. */
export interface BaseMapPreferences {
  /** The saved value as stored, possibly stale or invalid; null if none. */
  load(): string | null;
  save(id: BaseMapId): void;
}
