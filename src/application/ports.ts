import type { BaseMapId } from '../domain/base-map';
import type { Bounds } from '../domain/bounds';
import type { PastoralZone, PastoralZoneDataset } from '../domain/pastoral-zone';
import type { ZoneStatus } from '../domain/zone-status';

export interface ZoneOnMap {
  zone: PastoralZone;
  status: ZoneStatus;
}

/** What the use cases expect from the displayed map. Implemented in `ui`. */
export interface MapView {
  fitTo(bounds: Bounds): void;
  showBaseMap(id: BaseMapId): void;
  showPastoralZones(zones: ZoneOnMap[]): void;
  setZoneLayerVisible(status: ZoneStatus, visible: boolean): void;
}

/** Where the user's base map choice is remembered, on their device. Implemented in `infrastructure`. */
export interface BaseMapPreferences {
  /** The saved value as stored, possibly stale or invalid; null if none. */
  load(): string | null;
  save(id: BaseMapId): void;
}

/** Where the published pastoral zones come from. Implemented in `infrastructure`. */
export interface PastoralZoneRepository {
  load(): Promise<PastoralZoneDataset>;
}
