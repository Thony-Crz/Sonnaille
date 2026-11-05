import type { Bounds } from '../domain/bounds';
import { V0_TERRITORY } from '../domain/territory';
import type { MapView } from './ports';

/** Frames the map on the covered territory (Chartreuse and Vercors in V0). */
export function showTerritory(map: MapView, territory: Bounds = V0_TERRITORY): void {
  map.fitTo(territory);
}
