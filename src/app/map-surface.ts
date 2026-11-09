import type { MapView, ObservationOnMap, ZoneOnMap } from '../application/ports';
import type { Position } from '../domain/bounds';

/** What the front needs from the map, beyond the application's MapView port. */
export interface MapSurface extends MapView {
  highlightZones(ids: string[]): void;
  showMarkedTrails(visible: boolean): void;
  onZoneSelected(handler: (zone: ZoneOnMap) => void): void;
  onSightingSelected(handler: (item: ObservationOnMap) => void): void;
  pickLocation(): Promise<Position | null>;
  cancelPick(): void;
}
