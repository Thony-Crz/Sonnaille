import type { IControl, StyleSpecification } from 'maplibre-gl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const maplibre = vi.hoisted(() => {
  const maps: Array<{
    options: Record<string, unknown>;
    fitBounds: ReturnType<typeof vi.fn>;
    addControl: ReturnType<typeof vi.fn>;
    setStyle: ReturnType<typeof vi.fn>;
  }> = [];
  class Map {
    fitBounds = vi.fn();
    addControl = vi.fn();
    setStyle = vi.fn();
    constructor(public options: Record<string, unknown>) {
      maps.push(this);
    }
  }
  class NavigationControl {
    constructor(public options: Record<string, unknown>) {}
  }
  return { maps, Map, NavigationControl };
});

vi.mock('maplibre-gl', () => ({ Map: maplibre.Map, NavigationControl: maplibre.NavigationControl }));

import { BASE_MAP_STYLES } from './base-map-styles';
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
