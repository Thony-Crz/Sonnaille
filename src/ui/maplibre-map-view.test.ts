import type { IControl, StyleSpecification } from 'maplibre-gl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const maplibre = vi.hoisted(() => {
  // A fake map keeping just enough style state: sources, layers, layout properties.
  class Map {
    fitBounds = vi.fn();
    addControl = vi.fn();
    setStyle = vi.fn((_style: unknown, _options?: { transformStyle?: unknown }) => {
      this.sources.clear();
      this.layers.length = 0;
    });
    styleLoaded = true;
    handlers: Record<string, Array<() => void>> = {};
    sources = new globalThis.Map<string, { data: unknown; setData: ReturnType<typeof vi.fn> }>();
    layers: Array<{ id: string; type: string; filter?: unknown; paint?: Record<string, unknown>; layout?: Record<string, unknown> }> = [];
    layout: Record<string, Record<string, unknown>> = {};
    constructor(public options: Record<string, unknown>) {
      maps.push(this);
    }
    layerHandlers: Record<string, { layers: string[]; handler: (e: unknown) => void }> = {};
    on(event: string, layersOrHandler: string[] | (() => void), handler?: (e: unknown) => void) {
      if (typeof layersOrHandler === 'function') (this.handlers[event] ??= []).push(layersOrHandler);
      else this.layerHandlers[event] = { layers: layersOrHandler, handler: handler! };
    }
    emitOnLayers(event: string, payload: unknown) {
      this.layerHandlers[event]?.handler(payload);
    }
    getCanvas() {
      return { style: {} as Record<string, string> };
    }
    emit(event: string) {
      this.handlers[event]?.forEach((h) => h());
    }
    isStyleLoaded() {
      return this.styleLoaded;
    }
    addSource(id: string, source: { data: unknown }) {
      this.sources.set(id, { data: source.data, setData: vi.fn() });
    }
    getSource(id: string) {
      return this.sources.get(id);
    }
    addLayer(layer: (typeof this.layers)[number]) {
      this.layers.push(layer);
    }
    removeLayer(id: string) {
      this.layers = this.layers.filter((l) => l.id !== id);
    }
    moveLayer(id: string) {
      const layer = this.getLayer(id);
      if (layer) this.layers = [...this.layers.filter((l) => l.id !== id), layer];
    }
    getLayer(id: string) {
      return this.layers.find((l) => l.id === id);
    }
    setLayoutProperty(id: string, property: string, value: unknown) {
      (this.layout[id] ??= {})[property] = value;
    }
  }
  const maps: Map[] = [];
  class NavigationControl {
    constructor(public options: Record<string, unknown>) {}
  }
  class GeolocateControl {
    constructor(public options: Record<string, unknown>) {}
  }
  return { maps, Map, NavigationControl, GeolocateControl };
});

vi.mock('maplibre-gl', () => ({ Map: maplibre.Map, NavigationControl: maplibre.NavigationControl, GeolocateControl: maplibre.GeolocateControl }));

import type { ZoneOnMap } from '../application/ports';
import type { PastoralZone } from '../domain/pastoral-zone';
import type { Track } from '../domain/track';
import { BASE_MAP_STYLES } from './base-map-styles';
import { ZONE_STYLES } from './zone-styles';
import { MapLibreMapView } from './maplibre-map-view';

const container = {} as HTMLElement;
const lastMap = () => maplibre.maps.at(-1)!;

type TransformStyle = (previous: StyleSpecification | undefined, next: StyleSpecification) => StyleSpecification;

describe('MapLibreMapView', () => {
  beforeEach(() => {
    maplibre.maps.length = 0;
  });

  it('creates a MapLibre map in the container', () => {
    new MapLibreMapView(container, 'ign-plan');

    expect(maplibre.maps).toHaveLength(1);
    expect(lastMap().options).toMatchObject({ container });
  });

  it('keeps the credits compact, so they do not cover the legend on phones', () => {
    new MapLibreMapView(container, 'ign-plan');

    expect(lastMap().options).toMatchObject({ attributionControl: { compact: true } });
  });

  it('opens with the requested base map', () => {
    new MapLibreMapView(container, 'osm');

    expect(lastMap().setStyle).toHaveBeenCalledTimes(1);
    expect(lastMap().setStyle.mock.calls[0]?.[0]).toBe(BASE_MAP_STYLES.osm.style);
  });

  it('switches base map by replacing the style', () => {
    const view = new MapLibreMapView(container, 'ign-plan');

    view.showBaseMap('ign-aerial');

    expect(lastMap().setStyle.mock.calls.at(-1)?.[0]).toBe(BASE_MAP_STYLES['ign-aerial'].style);
  });

  it('credits the producer of the base map being shown', () => {
    new MapLibreMapView(container, 'ign-plan');
    const transformStyle = lastMap().setStyle.mock.calls[0]?.[1]?.transformStyle as TransformStyle;

    const style = transformStyle(undefined, {
      version: 8,
      sources: { plan_ign: { type: 'vector', url: 'https://example.org/plan.json' } },
      layers: [],
    });

    expect(style.sources.plan_ign).toMatchObject({ attribution: BASE_MAP_STYLES['ign-plan'].attribution });
  });

  it('adds the zoom buttons', () => {
    new MapLibreMapView(container, 'ign-plan');

    expect(lastMap().addControl).toHaveBeenCalledWith(expect.any(maplibre.NavigationControl), 'top-right');
  });

  it('adds a panel in the top-left corner', () => {
    const view = new MapLibreMapView(container, 'ign-plan');
    const panel = { remove: vi.fn() } as unknown as HTMLElement;

    view.addPanel(panel);

    const [control, position] = lastMap().addControl.mock.calls.at(-1) as [IControl, string];
    expect(position).toBe('top-left');
    expect(control.onAdd(lastMap() as never)).toBe(panel);
  });

  it('offers to show where you are, once, without tracking you (T26)', () => {
    new MapLibreMapView(container, 'ign-plan');

    const [control, position] = lastMap().addControl.mock.calls.find(([c]) => c instanceof maplibre.GeolocateControl) as [
      { options: Record<string, unknown> },
      string,
    ];
    expect(position).toBe('top-right');
    expect(control.options).toMatchObject({ trackUserLocation: false, showUserLocation: true });
  });

  it('can add a panel in another corner', () => {
    const view = new MapLibreMapView(container, 'ign-plan');

    view.addPanel({ remove: vi.fn() } as unknown as HTMLElement, 'bottom-left');

    expect(lastMap().addControl.mock.calls.at(-1)?.[1]).toBe('bottom-left');
  });

  it('leaves room for the panels when framing, as the layout asks', () => {
    const padding = { top: 200, bottom: 420, left: 16, right: 56 };
    const view = new MapLibreMapView(container, 'ign-plan', { framePadding: () => padding });

    view.fitTo({ west: 5.25, south: 44.68, east: 6.02, north: 45.58 });

    expect(lastMap().fitBounds.mock.calls.at(-1)?.[1]).toEqual({ padding, animate: false });
  });

  it('fits the map to the requested bounds, with padding and no animation', () => {
    const view = new MapLibreMapView(container, 'ign-plan');

    view.fitTo({ west: 5.25, south: 44.68, east: 6.02, north: 45.58 });

    expect(lastMap().fitBounds).toHaveBeenCalledWith(
      [
        [5.25, 44.68],
        [6.02, 45.58],
      ],
      { padding: 24, animate: false },
    );
  });
});

const zoneA: PastoralZone = {
  id: 'A',
  name: 'Alpage A',
  quarter: 'Quartier A',
  geometry: [[[[5.7, 45.3], [5.8, 45.3], [5.8, 45.4], [5.7, 45.3]]]],
  presence: null,
};
const zones: ZoneOnMap[] = [{ zone: zoneA, status: 'no-flock' }];

describe('MapLibreMapView pastoral zones', () => {
  beforeEach(() => {
    maplibre.maps.length = 0;
  });

  it('adds the zones as a GeoJSON source, each with its id and status', () => {
    const view = new MapLibreMapView(container, 'ign-plan');

    view.showPastoralZones(zones);

    expect(lastMap().getSource('pastoral-zones')?.data).toEqual({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'MultiPolygon', coordinates: zoneA.geometry }, properties: { id: 'A', status: 'no-flock' } },
      ],
    });
  });

  it('draws a fill and an outline layer per status, the most cautious on top', () => {
    const view = new MapLibreMapView(container, 'ign-plan');

    view.showPastoralZones(zones);

    expect(lastMap().layers.map((l) => l.id)).toEqual([
      'zones-no-flock-fill',
      'zones-no-flock-line',
      'zones-flock-fill',
      'zones-flock-line',
      'zones-flock-with-dogs-fill',
      'zones-flock-with-dogs-line',
    ]);
    expect(lastMap().getLayer('zones-flock-fill')).toMatchObject({
      type: 'fill',
      source: 'pastoral-zones',
      filter: ['==', ['get', 'status'], 'flock'],
      paint: { 'fill-color': ZONE_STYLES.flock.color, 'fill-opacity': ZONE_STYLES.flock.fillOpacity },
    });
  });

  it('waits for the style to load before adding the zones', () => {
    const view = new MapLibreMapView(container, 'ign-plan');
    lastMap().styleLoaded = false;

    view.showPastoralZones(zones);
    expect(lastMap().layers).toEqual([]);

    lastMap().styleLoaded = true;
    lastMap().emit('style.load');
    expect(lastMap().layers).toHaveLength(6);
  });

  it('adds the zones once the style has loaded, even while raster tiles are still loading', () => {
    const view = new MapLibreMapView(container, 'topo');
    lastMap().styleLoaded = false; // MapLibre says "not loaded" while tiles load...
    lastMap().emit('style.load'); // ...although the style itself is ready.

    view.showPastoralZones(zones);

    expect(lastMap().layers).toHaveLength(6);
  });

  it('keeps the zones when the base map changes', () => {
    const view = new MapLibreMapView(container, 'ign-plan');
    view.showPastoralZones(zones);

    view.showBaseMap('osm');
    lastMap().emit('style.load');

    expect(lastMap().getSource('pastoral-zones')).toBeDefined();
    expect(lastMap().layers).toHaveLength(6);
  });

  it('updates the source when the zones change', () => {
    const view = new MapLibreMapView(container, 'ign-plan');
    view.showPastoralZones(zones);

    view.showPastoralZones([{ zone: zoneA, status: 'flock' }]);

    expect(lastMap().getSource('pastoral-zones')?.setData).toHaveBeenCalledTimes(1);
    expect(lastMap().layers).toHaveLength(6);
  });

  it('hides and shows the layers of a status', () => {
    const view = new MapLibreMapView(container, 'ign-plan');
    view.showPastoralZones(zones);

    view.setZoneLayerVisible('no-flock', false);

    expect(lastMap().layout['zones-no-flock-fill']).toEqual({ visibility: 'none' });
    expect(lastMap().layout['zones-no-flock-line']).toEqual({ visibility: 'none' });
  });

  it('keeps a hidden status hidden after a base map change', () => {
    const view = new MapLibreMapView(container, 'ign-plan');
    view.showPastoralZones(zones);
    view.setZoneLayerVisible('flock', false);

    view.showBaseMap('osm');
    lastMap().emit('style.load');

    expect(lastMap().getLayer('zones-flock-fill')?.layout).toEqual({ visibility: 'none' });
  });
});

describe('MapLibreMapView zone selection', () => {
  beforeEach(() => {
    maplibre.maps.length = 0;
  });

  it('reports the zone the user taps, with its status', () => {
    const view = new MapLibreMapView(container, 'ign-plan');
    view.showPastoralZones(zones);
    const onSelected = vi.fn();

    view.onZoneSelected(onSelected);
    lastMap().emitOnLayers('click', { features: [{ properties: { id: 'A' } }] });

    expect(onSelected).toHaveBeenCalledWith({ zone: zoneA, status: 'no-flock' });
  });

  it('listens to taps on every zone fill layer', () => {
    const view = new MapLibreMapView(container, 'ign-plan');

    view.onZoneSelected(vi.fn());

    expect(lastMap().layerHandlers.click?.layers).toEqual([
      'zones-flock-with-dogs-fill',
      'zones-flock-fill',
      'zones-no-flock-fill',
    ]);
  });

  it('picks the most cautious zone when several overlap', () => {
    const view = new MapLibreMapView(container, 'ign-plan');
    const zoneB = { ...zoneA, id: 'B' };
    view.showPastoralZones([
      { zone: zoneA, status: 'no-flock' },
      { zone: zoneB, status: 'flock-with-dogs' },
    ]);
    const onSelected = vi.fn();
    view.onZoneSelected(onSelected);

    lastMap().emitOnLayers('click', { features: [{ properties: { id: 'A' } }, { properties: { id: 'B' } }] });

    expect(onSelected).toHaveBeenCalledWith({ zone: zoneB, status: 'flock-with-dogs' });
  });
});

const track: Track = {
  name: 'Sortie',
  segments: [
    [
      { longitude: 5.7, latitude: 45.2 },
      { longitude: 5.71, latitude: 45.21 },
    ],
    [
      { longitude: 5.72, latitude: 45.22 },
      { longitude: 5.73, latitude: 45.23 },
    ],
  ],
};

describe('MapLibreMapView track', () => {
  beforeEach(() => {
    maplibre.maps.length = 0;
  });

  it('draws the track, one line per segment, above the zones', () => {
    const view = new MapLibreMapView(container, 'ign-plan');
    view.showPastoralZones(zones);

    view.showTrack(track);

    expect(lastMap().getSource('track')?.data).toEqual({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[5.7, 45.2], [5.71, 45.21]] } },
        { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[5.72, 45.22], [5.73, 45.23]] } },
      ],
    });
    expect(lastMap().layers.slice(-2).map((l) => l.id)).toEqual(['track-casing', 'track-line']);
  });

  it('keeps the track above the zones when they arrive later', () => {
    const view = new MapLibreMapView(container, 'ign-plan');
    view.showTrack(track);

    view.showPastoralZones(zones);

    expect(lastMap().layers.at(-1)?.id).toBe('track-line');
  });

  it('keeps the track when the base map changes', () => {
    const view = new MapLibreMapView(container, 'ign-plan');
    view.showTrack(track);

    view.showBaseMap('osm');
    lastMap().emit('style.load');

    expect(lastMap().getLayer('track-line')).toBeDefined();
  });

  it('replaces the track when another one is imported', () => {
    const view = new MapLibreMapView(container, 'ign-plan');
    view.showTrack(track);

    view.showTrack({ ...track, segments: [track.segments[0]!] });

    expect(lastMap().getSource('track')?.setData).toHaveBeenCalledTimes(1);
  });
});

describe('MapLibreMapView highlighted zones', () => {
  beforeEach(() => {
    maplibre.maps.length = 0;
  });

  it('outlines the zones crossed by the track, between the zones and the track', () => {
    const view = new MapLibreMapView(container, 'ign-plan');
    view.showPastoralZones(zones);
    view.showTrack(track);

    view.highlightZones(['A']);

    expect(lastMap().getLayer('zones-highlight')).toMatchObject({
      type: 'line',
      source: 'pastoral-zones',
      filter: ['in', ['get', 'id'], ['literal', ['A']]],
    });
    expect(lastMap().layers.slice(-3).map((l) => l.id)).toEqual(['zones-highlight', 'track-casing', 'track-line']);
  });

  it('keeps the highlight after a base map change', () => {
    const view = new MapLibreMapView(container, 'ign-plan');
    view.showPastoralZones(zones);
    view.highlightZones(['A']);

    view.showBaseMap('osm');
    lastMap().emit('style.load');

    expect(lastMap().getLayer('zones-highlight')?.filter).toEqual(['in', ['get', 'id'], ['literal', ['A']]]);
  });
});

const sighting = (id: string, recent: boolean) => ({
  observation: {
    id,
    observedAt: '2026-07-14T08:00:00.000Z',
    position: { longitude: 5.7, latitude: 45.2 },
    species: 'sheep' as const,
    headcount: 'dozens' as const,
    guardDogs: true,
  },
  recent,
  haloMeters: 400,
});

describe('MapLibreMapView observations', () => {
  beforeEach(() => {
    maplibre.maps.length = 0;
  });

  it('draws each sighting as a point with a halo, flagged recent or not', () => {
    const view = new MapLibreMapView(container, 'ign-plan');

    view.showObservations([sighting('o1', true)]);

    const data = lastMap().getSource('observations')?.data as { features: Array<{ geometry: { type: string }; properties: Record<string, unknown> }> };
    expect(data.features.map((f) => [f.geometry.type, f.properties.kind, f.properties.recent])).toEqual([
      ['Polygon', 'halo', true],
      ['Point', 'point', true],
    ]);
    expect(lastMap().layers.map((l) => l.id)).toEqual(['observations-halo', 'observations-halo-line', 'observations-point']);
  });

  it('keeps the track above the sightings', () => {
    const view = new MapLibreMapView(container, 'ign-plan');
    view.showTrack(track);

    view.showObservations([sighting('o1', false)]);

    expect(lastMap().layers.slice(-2).map((l) => l.id)).toEqual(['track-casing', 'track-line']);
  });

  it('keeps the sightings when the base map changes', () => {
    const view = new MapLibreMapView(container, 'ign-plan');
    view.showObservations([sighting('o1', true)]);

    view.showBaseMap('osm');
    lastMap().emit('style.load');

    expect(lastMap().getLayer('observations-point')).toBeDefined();
  });
});
