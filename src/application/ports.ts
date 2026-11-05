import type { Activity, Advice } from '../domain/advice';
import type { BaseMapId } from '../domain/base-map';
import type { Bounds } from '../domain/bounds';
import type { PastoralZone, PastoralZoneDataset } from '../domain/pastoral-zone';
import type { Track } from '../domain/track';
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
  showTrack(track: Track): void;
}

/** Reads an imported file into a track, on the device. Implemented in `infrastructure`. */
export interface TrackReader {
  read(text: string, fileName: string): Track;
}

/** Where the user's base map choice is remembered, on their device. Implemented in `infrastructure`. */
export interface BaseMapPreferences {
  /** The saved value as stored, possibly stale or invalid; null if none. */
  load(): string | null;
  save(id: BaseMapId): void;
}

/** Where the user's activity (hiking, trail, mountain bike) is remembered, on their device. */
export interface ActivityPreferences {
  load(): string | null;
  save(activity: Activity): void;
}

/** Whether the welcome message has been seen on this device. */
export interface WelcomePreferences {
  load(): string | null;
  save(value: 'seen'): void;
}

/** Where the advice texts come from (published content, editable without a release). */
export interface AdviceRepository {
  load(): Promise<Advice[]>;
}

/** Where the published pastoral zones come from. Implemented in `infrastructure`. */
export interface PastoralZoneRepository {
  load(): Promise<PastoralZoneDataset>;
}
