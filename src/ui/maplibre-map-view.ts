import type { FilterSpecification } from '@maplibre/maplibre-gl-style-spec';
import type { FeatureCollection } from 'geojson';
import { GeolocateControl, Map, NavigationControl, type ControlPosition, type GeoJSONSource, type PaddingOptions } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapView, ObservationOnMap, ZoneOnMap } from '../application/ports';
import type { BaseMapId } from '../domain/base-map';
import { isFlock } from '../domain/observation';
import type { Bounds, Position } from '../domain/bounds';
import type { Track } from '../domain/track';
import { ZONE_STATUSES, type ZoneStatus } from '../domain/zone-status';
import { BASE_MAP_STYLES, withAttribution, type BaseMapStyles } from './base-map-styles';
import { circleRing } from './geo-circle';
import { DOG_ICON, MAP_ICONS, sightingIcon } from './sighting-icons';
import { ZONE_STYLES } from './zone-styles';

const EMPTY_STYLE = { version: 8 as const, sources: {}, layers: [] };
const ZONES_SOURCE = 'pastoral-zones';
const TRACK_SOURCE = 'track';
const TRACK_LAYERS = ['track-casing', 'track-line'];
const TRACK_COLOR = '#23395b';
const HIGHLIGHT_LAYER = 'zones-highlight';
const OBSERVATIONS_SOURCE = 'observations';
const TRAILS = 'marked-trails';
const TRAILS_TILES = 'https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png';
const TRAILS_ATTRIBUTION =
  'Sentiers balisés : © <a href="https://hiking.waymarkedtrails.org" target="_blank" rel="noopener">Waymarked Trails</a> (CC-BY-SA), données © contributeurs OpenStreetMap';
const OBSERVATION_COLOR = '#6a3d9a';
const NEST_COLOR = '#d49a00';
const sightingColor = ['case', ['==', ['get', 'what'], 'flock'], OBSERVATION_COLOR, NEST_COLOR] as unknown as string;

const ZONE_DOGS_LAYER = 'zones-dogs';

type MapImage = HTMLImageElement | ImageBitmap;

/** Browser loader of the SVG pictures; replaced in tests. */
async function loadSvgImage(svg: string): Promise<MapImage> {
  const image = new Image(64, 64);
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  return image;
}

const fillLayerId = (status: ZoneStatus) => `zones-${status}-fill`;
const lineLayerId = (status: ZoneStatus) => `zones-${status}-line`;

export class MapLibreMapView implements MapView {
  private readonly map: Map;
  private zones: FeatureCollection | null = null;
  private shownZones: Record<string, ZoneOnMap> = {};
  private track: FeatureCollection | null = null;
  private highlighted: string[] = [];
  private observations: FeatureCollection | null = null;
  /**
   * Set on 'style.load'. MapLibre's isStyleLoaded() stays false while raster tiles load,
   * which would leave overlays out when they arrive after the style.
   */
  private styleReady = false;
  private markedTrails = false;
  /** While the user picks a point, taps do not open zone sheets. */
  private picking: { resolve: (position: Position | null) => void; handler: (e: { lngLat: { lng: number; lat: number } }) => void } | null = null;
  private justPicked = false;
  private readonly visible: Record<ZoneStatus, boolean> = { 'flock-with-dogs': true, flock: true, 'no-flock': true };
  private shownObservations: Record<string, ObservationOnMap> = {};
  /** Pictures already decoded, added again to each new style. */
  private readonly images = new globalThis.Map<string, MapImage>();

  constructor(
    container: HTMLElement,
    baseMap: BaseMapId,
    /** Room to leave around framed areas, given by the layout (panels over the map). */
    private readonly options: {
      framePadding?: () => number | PaddingOptions;
      styles?: BaseMapStyles;
      loadIcon?: (svg: string) => Promise<MapImage>;
    } = {},
  ) {
    this.map = new Map({ container, style: EMPTY_STYLE, attributionControl: { compact: true } });
    this.map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    // Where am I (T26): the position stays in the browser, shown once on request, never tracked.
    this.map.addControl(
      new GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false, showUserLocation: true }),
      'top-right',
    );
    // A new base map replaces the whole style: overlays are added again each time.
    this.map.on('style.load', () => {
      this.styleReady = true;
      void this.addIcons();
      this.addMarkedTrails();
      this.addZoneLayers();
      this.addObservationLayers();
      this.addTrackLayers();
    });
    this.showBaseMap(baseMap);
  }

  fitTo({ west, south, east, north }: Bounds): void {
    this.map.fitBounds(
      [
        [west, south],
        [east, north],
      ],
      { padding: this.options.framePadding?.() ?? 24, animate: false },
    );
  }

  showBaseMap(id: BaseMapId): void {
    const styles = this.options.styles ?? BASE_MAP_STYLES;
    const { style, attribution } = styles[id] ?? styles['ign-plan'];
    this.styleReady = false;
    this.map.setStyle(style, {
      diff: false,
      transformStyle: (_previous, next) => withAttribution(next, attribution),
    });
  }

  showPastoralZones(zones: ZoneOnMap[]): void {
    this.shownZones = Object.fromEntries(zones.map((z) => [z.zone.id, z]));
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
    else if (this.isReady()) this.addZoneLayers();
  }

  /**
   * Calls the handler with the zone the user taps. Where zones overlap,
   * the most cautious one wins (guard dogs first).
   */
  onZoneSelected(handler: (zone: ZoneOnMap) => void): void {
    const layers = ZONE_STATUSES.map(fillLayerId);
    this.map.on('click', layers, (event: { features?: Array<{ properties?: { id?: unknown } }>; point?: { x: number; y: number } }) => {
      if (this.picking || this.justPicked || this.sightingTapped(event)) return;
      const tapped = (event.features ?? [])
        .map((f) => this.shownZones[String(f.properties?.id)])
        .filter((z): z is ZoneOnMap => z !== undefined)
        .sort((a, b) => ZONE_STATUSES.indexOf(a.status) - ZONE_STATUSES.indexOf(b.status));
      if (tapped[0]) handler(tapped[0]);
    });
    this.map.on('mouseenter', layers, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', layers, () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  /** Outlines the zones crossed by the track (by zone id), between the zones and the track. */
  highlightZones(ids: string[]): void {
    this.highlighted = ids;
    if (this.map.getLayer(HIGHLIGHT_LAYER)) this.map.removeLayer(HIGHLIGHT_LAYER);
    if (this.map.getSource(ZONES_SOURCE)) {
      this.addHighlightLayer();
      this.raiseTrack();
    }
  }

  /** Waits for the user to tap a point on the map (e.g. where animals were seen). */
  pickLocation(): Promise<Position | null> {
    this.cancelPick();
    return new Promise((resolve) => {
      const handler = (event: { lngLat: { lng: number; lat: number } }) => {
        this.endPick();
        // The same tap must not also open a zone sheet.
        this.justPicked = true;
        setTimeout(() => (this.justPicked = false), 0);
        resolve({ longitude: event.lngLat.lng, latitude: event.lngLat.lat });
      };
      this.picking = { resolve, handler };
      this.map.getCanvas().style.cursor = 'crosshair';
      this.map.once('click', handler);
    });
  }

  cancelPick(): void {
    const picking = this.picking;
    if (!picking) return;
    this.map.off('click', picking.handler);
    this.endPick();
    picking.resolve(null);
  }

  private endPick(): void {
    this.picking = null;
    this.map.getCanvas().style.cursor = '';
  }

  /** Marked hiking trails (GR, PR…) over any base map, under the zones. */
  showMarkedTrails(visible: boolean): void {
    this.markedTrails = visible;
    if (!visible) {
      if (this.map.getLayer(TRAILS)) this.map.removeLayer(TRAILS);
      if (this.map.getSource(TRAILS)) this.map.removeSource(TRAILS);
    } else if (this.isReady()) {
      this.addMarkedTrails();
    }
  }

  /** Field sightings: a point and a halo per species, sharp while recent, faded afterwards. */
  showObservations(items: ObservationOnMap[]): void {
    this.shownObservations = Object.fromEntries(items.map((item) => [item.observation.id, item]));
    this.observations = {
      type: 'FeatureCollection',
      features: items.flatMap(({ observation, recent, haloMeters }) => [
        {
          type: 'Feature' as const,
          properties: { kind: 'halo', recent, id: observation.id, what: observation.kind ?? 'flock' },
          geometry: { type: 'Polygon' as const, coordinates: [circleRing(observation.position, haloMeters)] },
        },
        {
          type: 'Feature' as const,
          properties: {
            kind: 'point',
            recent,
            id: observation.id,
            what: observation.kind ?? 'flock',
            icon: sightingIcon(observation),
            dogs: isFlock(observation) && observation.guardDogs,
          },
          geometry: { type: 'Point' as const, coordinates: [observation.position.longitude, observation.position.latitude] },
        },
      ]),
    };

    const source = this.map.getSource(OBSERVATIONS_SOURCE) as GeoJSONSource | undefined;
    if (source) source.setData(this.observations);
    else if (this.isReady()) {
      this.addObservationLayers();
      this.raiseTrack();
    }
  }

  /** Draws the imported track, one line per segment, above the zones. */
  showTrack(track: Track): void {
    this.track = {
      type: 'FeatureCollection',
      features: track.segments.map((segment) => ({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: segment.map((p) => [p.longitude, p.latitude]) },
      })),
    };

    const source = this.map.getSource(TRACK_SOURCE) as GeoJSONSource | undefined;
    if (source) source.setData(this.track);
    else if (this.isReady()) this.addTrackLayers();
  }

  setZoneLayerVisible(status: ZoneStatus, visible: boolean): void {
    this.visible[status] = visible;
    const ids = [fillLayerId(status), lineLayerId(status), ...(status === 'flock-with-dogs' ? [ZONE_DOGS_LAYER] : [])];
    for (const id of ids) {
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

  private addMarkedTrails(): void {
    if (!this.markedTrails || this.map.getSource(TRAILS)) return;
    this.map.addSource(TRAILS, { type: 'raster', tiles: [TRAILS_TILES], tileSize: 256, maxzoom: 18, attribution: TRAILS_ATTRIBUTION });
    const firstOverlay = [fillLayerId('no-flock'), 'observations-halo', 'track-casing'].find((id) => this.map.getLayer(id));
    this.map.addLayer({ id: TRAILS, type: 'raster', source: TRAILS, paint: { 'raster-opacity': 0.9 } }, firstOverlay);
  }

  private isReady(): boolean {
    return this.styleReady || this.map.isStyleLoaded() === true;
  }

  private addTrackLayers(): void {
    if (!this.track || this.map.getSource(TRACK_SOURCE)) return;

    this.map.addSource(TRACK_SOURCE, { type: 'geojson', data: this.track });
    const layout = { 'line-cap': 'round' as const, 'line-join': 'round' as const };
    this.map.addLayer({ id: 'track-casing', type: 'line', source: TRACK_SOURCE, layout, paint: { 'line-color': '#ffffff', 'line-width': 7 } });
    this.map.addLayer({ id: 'track-line', type: 'line', source: TRACK_SOURCE, layout, paint: { 'line-color': TRACK_COLOR, 'line-width': 4 } });
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
    // A guard dog on each zone where a flock with guard dogs is planned.
    this.map.addLayer({
      id: ZONE_DOGS_LAYER,
      type: 'symbol',
      source: ZONES_SOURCE,
      filter: ['==', ['get', 'status'], 'flock-with-dogs'],
      layout: {
        'icon-image': DOG_ICON,
        'icon-size': 1.4,
        visibility: this.visible['flock-with-dogs'] ? 'visible' : 'none',
      },
    });
    this.addHighlightLayer();
    this.raiseTrack();
  }

  private addObservationLayers(): void {
    if (!this.observations || this.map.getSource(OBSERVATIONS_SOURCE)) return;

    this.map.addSource(OBSERVATIONS_SOURCE, { type: 'geojson', data: this.observations });
    const recent = (sharp: number, faded: number) => ['case', ['get', 'recent'], sharp, faded] as unknown as number;
    this.map.addLayer({
      id: 'observations-halo',
      type: 'fill',
      source: OBSERVATIONS_SOURCE,
      filter: ['==', ['get', 'kind'], 'halo'],
      paint: { 'fill-color': sightingColor, 'fill-opacity': recent(0.22, 0.06) },
    });
    this.map.addLayer({
      id: 'observations-halo-line',
      type: 'line',
      source: OBSERVATIONS_SOURCE,
      filter: ['==', ['get', 'kind'], 'halo'],
      paint: { 'line-color': sightingColor, 'line-width': 1.2, 'line-opacity': recent(0.8, 0.3), 'line-dasharray': [2, 2] },
    });
    this.map.addLayer({
      id: 'observations-point',
      type: 'symbol',
      source: OBSERVATIONS_SOURCE,
      filter: ['==', ['get', 'kind'], 'point'],
      layout: { 'icon-image': ['get', 'icon'], 'icon-allow-overlap': true, 'icon-ignore-placement': true },
      paint: { 'icon-opacity': recent(1, 0.45) },
    });
    // A small dog on the sightings where guard dogs were seen.
    this.map.addLayer({
      id: 'observations-dogs',
      type: 'symbol',
      source: OBSERVATIONS_SOURCE,
      filter: ['all', ['==', ['get', 'kind'], 'point'], ['==', ['get', 'dogs'], true]],
      layout: { 'icon-image': DOG_ICON, 'icon-offset': [12, -12], 'icon-allow-overlap': true, 'icon-ignore-placement': true },
      paint: { 'icon-opacity': recent(1, 0.45) },
    });
  }

  /** Calls the handler with the sighting the user taps (its picture). */
  onSightingSelected(handler: (item: ObservationOnMap) => void): void {
    this.map.on('click', 'observations-point', (event: { features?: Array<{ properties?: { id?: unknown } }> }) => {
      if (this.picking || this.justPicked) return;
      const item = this.shownObservations[String(event.features?.[0]?.properties?.id)];
      if (item) handler(item);
    });
    this.map.on('mouseenter', 'observations-point', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'observations-point', () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  /** A tap on a sighting's picture opens the sighting, not the zone under it. */
  private sightingTapped(event: { point?: { x: number; y: number } }): boolean {
    if (!event.point || !this.map.getLayer('observations-point')) return false;
    return this.map.queryRenderedFeatures([event.point.x, event.point.y], { layers: ['observations-point'] }).length > 0;
  }

  /** Decodes the pictures once, then adds them to the current style (a new style starts without them). */
  private async addIcons(): Promise<void> {
    const load = this.options.loadIcon ?? loadSvgImage;
    await Promise.all(
      Object.entries(MAP_ICONS).map(async ([id, svg]) => {
        try {
          if (!this.images.has(id)) this.images.set(id, await load(svg));
          if (!this.map.hasImage(id)) this.map.addImage(id, this.images.get(id)!, { pixelRatio: 2 });
        } catch {
          // A picture that cannot be drawn: the map stays usable without it.
        }
      }),
    );
  }

  private addHighlightLayer(): void {
    if (this.highlighted.length === 0) return;
    this.map.addLayer({
      id: HIGHLIGHT_LAYER,
      type: 'line',
      source: ZONES_SOURCE,
      filter: ['in', ['get', 'id'], ['literal', this.highlighted]],
      paint: { 'line-color': '#1f1f1f', 'line-width': 3, 'line-opacity': 0.8 },
    });
  }

  private raiseTrack(): void {
    for (const id of TRACK_LAYERS) if (this.map.getLayer(id)) this.map.moveLayer(id);
  }
}
