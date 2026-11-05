import { resolveBaseMap, type BaseMap, type BaseMapId } from '../domain/base-map';
import type { BaseMapPreferences, MapView } from './ports';

/** The base map to open with: the one remembered on this device, or the default. */
export function initialBaseMap(preferences: BaseMapPreferences, available?: BaseMap[]): BaseMapId {
  return resolveBaseMap(preferences.load(), available);
}

/** Shows the chosen base map and remembers it for the next visit. */
export function chooseBaseMap(map: MapView, preferences: BaseMapPreferences, id: BaseMapId): void {
  map.showBaseMap(id);
  preferences.save(id);
}
