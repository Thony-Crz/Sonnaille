import type { FilterSpecification } from '@maplibre/maplibre-gl-style-spec';
import type { FeatureCollection } from 'geojson';
import { Map, NavigationControl, type ControlPosition, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapView, ZoneOnMap } from '../application/ports';
import type { BaseMapId } from '../domain/base-map';
import type { Bounds } from '../domain/bounds';
import { ZONE_STATUSES, type ZoneStatus } from '../domain/zone-status';
import { BASE_MAP_STYLES, withAttribution } from './base-map-styles';
import { ZONE_STYLES } from './zone-styles';

const EMPTY_STYLE = { version: 8 as const, sources: {}, layers: [] };
const ZONES_SOURCE = 'pastoral-zones';

const fillLayerId = (status: ZoneStatus) => `zones-${status}-fill`;
const lineLayerId = (status: ZoneStatus) => `zones-${status}-line`;

export class MapLibreMapView implements MapView {
  private readonly map: Map;
  private zones: FeatureCollection | null = null;
  private readonly visible: Record<ZoneStatus, boolean> = { 'flock-with-dogs': true, flock: true, 'no-flock': true };

  constructor(container: HTMLElement, baseMap: BaseMapId) {
    this.map = new Map({ container, style: EMPTY_STYLE });
    this.map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    // A new base map replaces the whole style: overlays are added again each time.
    this.map.on('style.load', () => this.addZoneLayers());
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

  showBaseMap(id: BaseMapId): void {
    const { style, attribution } = BASE_MAP_STYLES[id];
    this.map.setStyle(style, {
      diff: false,
      transformStyle: (_previous, next) => withAttribution(next, attribution),
    });
  }

  showPastoralZones(zones: ZoneOnMap[]): void {
    this.zones = {
      type: 'FeatureCollection',
      features: zones.map(({ zone, status }) => ({
        type: 'Feature',
        geometry: { type: 'MultiPolygon', coordinates: zone.geometry },
        properties: { id: zone.id, status },
      })),
    };

    const source = this.map.getSource(ZONES_SOURCE) as GeoJSONSource | undefined;
    if (source) source.setData(this.zones);
    else if (this.map.isStyleLoaded()) this.addZoneLayers();
  }

  setZoneLayerVisible(status: ZoneStatus, visible: boolean): void {
    this.visible[status] = visible;
    for (const id of [fillLayerId(status), lineLayerId(status)]) {
      if (this.map.getLayer(id)) this.map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
    }
  }

  /** Shows a panel (base map switcher, legend…) in a corner of the map. */
  addPanel(panel: HTMLElement, position: ControlPosition = 'top-left'): void {
    this.map.addControl(
      {
        onAdd: () => panel,
        onRemove: () => panel.remove(),
      },
      position,
    );
  }

  private addZoneLayers(): void {
    if (!this.zones || this.map.getSource(ZONES_SOURCE)) return;

    this.map.addSource(ZONES_SOURCE, { type: 'geojson', data: this.zones });
    // Least cautious first, so that zones with guard dogs are drawn on top.
    for (const status of [...ZONE_STATUSES].reverse()) {
      const { color, fillOpacity } = ZONE_STYLES[status];
      const filter: FilterSpecification = ['==', ['get', 'status'], status];
      const layout = { visibility: this.visible[status] ? ('visible' as const) : ('none' as const) };
      this.map.addLayer({
        id: fillLayerId(status),
        type: 'fill',
        source: ZONES_SOURCE,
        filter,
        layout,
        paint: { 'fill-color': color, 'fill-opacity': fillOpacity },
      });
      this.map.addLayer({
        id: lineLayerId(status),
        type: 'line',
        source: ZONES_SOURCE,
        filter,
        layout,
        paint: { 'line-color': color, 'line-width': status === 'no-flock' ? 1 : 1.6 },
      });
    }
  }
}
