import { Map, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapView } from '../application/ports';
import type { Bounds } from '../domain/bounds';

/** IGN Plan vector style served by the Géoplateforme, no key required. */
export const IGN_PLAN_STYLE_URL = 'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json';

export class MapLibreMapView implements MapView {
  private readonly map: Map;

  constructor(container: HTMLElement) {
    this.map = new Map({
      container,
      style: IGN_PLAN_STYLE_URL,
      attributionControl: { customAttribution: '© IGN — Plan IGN' },
    });
    this.map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
  }

  fitTo({ west, south, east, north }: Bounds): void {
    this.map.fitBounds(
      [
        [west, south],
        [east, north],
      ],
      { padding: 24, animate: false },
    );
  }
}
