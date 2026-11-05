export type BaseMapId = 'ign-plan' | 'ign-aerial' | 'osm';

export interface BaseMap {
  id: BaseMapId;
  /** Shown to users, hence in French. */
  label: string;
}

export const BASE_MAPS: BaseMap[] = [
  { id: 'ign-plan', label: 'Plan IGN' },
  { id: 'ign-aerial', label: 'Photos aériennes IGN' },
  { id: 'osm', label: 'OpenStreetMap' },
];

export const DEFAULT_BASE_MAP: BaseMapId = 'ign-plan';

/** Turns a possibly missing or stale saved value into a valid base map. */
export function resolveBaseMap(saved: string | null): BaseMapId {
  return BASE_MAPS.find((b) => b.id === saved)?.id ?? DEFAULT_BASE_MAP;
}
