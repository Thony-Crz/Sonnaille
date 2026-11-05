import { Map, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapView } from '../application/ports';
import type { BaseMapId } from '../domain/base-map';
import type { Bounds } from '../domain/bounds';
import { BASE_MAP_STYLES, withAttribution } from './base-map-styles';

const EMPTY_STYLE = { version: 8 as const, sources: {}, layers: [] };

export class MapLibreMapView implements MapView {
  private readonly map: Map;

  constructor(container: HTMLElement, baseMap: BaseMapId) {
    this.map = new Map({ container, style: EMPTY_STYLE });
    this.map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    this.showBaseMap(baseMap);
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

  /**
   * Replaces the whole style. Overlay layers added later (pastoral zones, T13)
   * will have to be carried over in `transformStyle`.
   */
  showBaseMap(id: BaseMapId): void {
    const { style, attribution } = BASE_MAP_STYLES[id];
    this.map.setStyle(style, {
      diff: false,
      transformStyle: (_previous, next) => withAttribution(next, attribution),
    });
  }

  /** Shows a panel (e.g. the base map switcher) in the top-left corner of the map. */
  addPanel(panel: HTMLElement): void {
    this.map.addControl(
      {
        onAdd: () => panel,
        onRemove: () => panel.remove(),
      },
      'top-left',
    );
  }
}
