export type BaseMapId = 'ign-plan' | 'ign-scan25' | 'topo' | 'ign-aerial' | 'osm';

export interface BaseMap {
  id: BaseMapId;
  /** Shown to users, hence in French. */
  label: string;
}

export const BASE_MAPS: BaseMap[] = [
  { id: 'ign-plan', label: 'Plan IGN' },
  { id: 'ign-scan25', label: 'Carte IGN 1:25 000' },
  { id: 'topo', label: 'Topographique (OpenTopoMap)' },
  { id: 'ign-aerial', label: 'Photos aériennes IGN' },
  { id: 'osm', label: 'OpenStreetMap' },
];

export const DEFAULT_BASE_MAP: BaseMapId = 'ign-plan';

/** The IGN 1:25,000 map (SCAN 25) needs a personal IGN key: without one it is not offered. */
export function availableBaseMaps({ scan25 }: { scan25: boolean }): BaseMap[] {
  return BASE_MAPS.filter((b) => b.id !== 'ign-scan25' || scan25);
}

/** Turns a possibly missing, stale or unavailable saved value into a base map that can be shown. */
export function resolveBaseMap(saved: string | null, available: BaseMap[] = BASE_MAPS): BaseMapId {
  return available.find((b) => b.id === saved)?.id ?? DEFAULT_BASE_MAP;
}
