import { zoneStatus, type ZoneStatus } from '../domain/zone-status';
import type { MapView, PastoralZoneRepository } from './ports';

export type ShowZonesResult = { available: false } | { available: true; source: string; fetchedAt: string; count: number };

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

  map.showPastoralZones(dataset.zones.map((zone) => ({ zone, status: zoneStatus(zone, today) })));
  return { available: true, source: dataset.source, fetchedAt: dataset.fetchedAt, count: dataset.zones.length };
}

/** Shows or hides the zones of one status. */
export function toggleZoneLayer(map: MapView, status: ZoneStatus, visible: boolean): void {
  map.setZoneLayerVisible(status, visible);
}
