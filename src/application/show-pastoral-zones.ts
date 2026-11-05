import type { PastoralZone } from '../domain/pastoral-zone';
import { zoneStatus, type ZoneStatus } from '../domain/zone-status';
import type { MapView, PastoralZoneRepository } from './ports';

export type ShowZonesResult =
  | { available: false }
  | { available: true; source: string; fetchedAt: string; zones: PastoralZone[] };

/** Shows the zones with what to expect on that day. */
export function showZonesOn(map: MapView, zones: PastoralZone[], day: string): void {
  map.showPastoralZones(zones.map((zone) => ({ zone, status: zoneStatus(zone, day) })));
}

/** Loads the published zones and shows each one with what to expect on that day. */
export async function showPastoralZones(
  repository: PastoralZoneRepository,
  map: MapView,
  today: string,
): Promise<ShowZonesResult> {
  let dataset;
  try {
    dataset = await repository.load();
  } catch {
    return { available: false };
  }

  showZonesOn(map, dataset.zones, today);
  return { available: true, source: dataset.source, fetchedAt: dataset.fetchedAt, zones: dataset.zones };
}

/** Shows or hides the zones of one status. */
export function toggleZoneLayer(map: MapView, status: ZoneStatus, visible: boolean): void {
  map.setZoneLayerVisible(status, visible);
}
