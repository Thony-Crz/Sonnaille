import { beforeEach, describe, expect, it, vi } from 'vitest';

const maplibre = vi.hoisted(() => {
  const maps: Array<{ options: Record<string, unknown>; fitBounds: ReturnType<typeof vi.fn>; addControl: ReturnType<typeof vi.fn> }> = [];
  class Map {
    fitBounds = vi.fn();
    addControl = vi.fn();
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

import { IGN_PLAN_STYLE_URL, MapLibreMapView } from './maplibre-map-view';

const container = {} as HTMLElement;

describe('MapLibreMapView', () => {
  beforeEach(() => {
    maplibre.maps.length = 0;
  });

  it('creates a MapLibre map in the container, with the IGN Plan style', () => {
    new MapLibreMapView(container);

    expect(maplibre.maps).toHaveLength(1);
    expect(maplibre.maps[0]?.options).toMatchObject({ container, style: IGN_PLAN_STYLE_URL });
  });

  it('uses the Géoplateforme IGN Plan vector style', () => {
    expect(IGN_PLAN_STYLE_URL).toBe('https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json');
  });

  it('shows the IGN attribution', () => {
    new MapLibreMapView(container);

    expect(maplibre.maps[0]?.options).toMatchObject({
      attributionControl: { customAttribution: expect.stringContaining('IGN') },
    });
  });

  it('adds the zoom buttons', () => {
    new MapLibreMapView(container);

    expect(maplibre.maps[0]?.addControl).toHaveBeenCalledWith(expect.any(maplibre.NavigationControl), 'top-right');
  });

  it('fits the map to the requested bounds, with padding and no animation', () => {
    const view = new MapLibreMapView(container);

    view.fitTo({ west: 5.25, south: 44.68, east: 6.02, north: 45.58 });

    expect(maplibre.maps[0]?.fitBounds).toHaveBeenCalledWith(
      [
        [5.25, 44.68],
        [6.02, 45.58],
      ],
      { padding: 24, animate: false },
    );
  });
});
