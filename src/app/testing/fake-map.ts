import type { ObservationOnMap, ZoneOnMap } from '../../application/ports';
import type { Position } from '../../domain/bounds';
import type { MapSurface } from '../map-surface';

/** A map that records what it is asked, and lets the test tap zones, sightings and points. */
export class FakeMap implements MapSurface {
  calls: string[] = [];
  zones: ZoneOnMap[] = [];
  observations: ObservationOnMap[] = [];
  highlighted: string[] = [];
  tapZone: (zone: ZoneOnMap) => void = () => undefined;
  tapSighting: (item: ObservationOnMap) => void = () => undefined;
  private picked: ((position: Position | null) => void) | null = null;
  fitTo() {
    this.calls.push('fitTo');
  }
  showBaseMap(id: string) {
    this.calls.push(`base:${id}`);
  }
  showPastoralZones(zones: ZoneOnMap[]) {
    this.zones = zones;
  }
  setZoneLayerVisible(status: string, visible: boolean) {
    this.calls.push(`layer:${status}:${visible}`);
  }
  showTrack() {
    this.calls.push('track');
  }
  showObservations(items: ObservationOnMap[]) {
    this.observations = items;
  }
  highlightZones(ids: string[]) {
    this.highlighted = ids;
  }
  showMarkedTrails(visible: boolean) {
    this.calls.push(`trails:${visible}`);
  }
  onZoneSelected(handler: (zone: ZoneOnMap) => void) {
    this.tapZone = handler;
  }
  onSightingSelected(handler: (item: ObservationOnMap) => void) {
    this.tapSighting = handler;
  }
  pickLocation() {
    return new Promise<Position | null>((resolve) => (this.picked = resolve));
  }
  cancelPick() {
    this.picked?.(null);
  }
  pick(position: Position) {
    this.picked?.(position);
  }
}
