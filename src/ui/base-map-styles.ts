import type { StyleSpecification } from 'maplibre-gl';
import type { BaseMapId } from '../domain/base-map';

/** IGN Plan vector style served by the Géoplateforme, no key required. */
export const IGN_PLAN_STYLE_URL = 'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json';

const IGN_AERIAL_TILES =
  'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
  '&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg' +
  '&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';

const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function rasterStyle(tiles: string, maxzoom: number): StyleSpecification {
  return {
    version: 8,
    sources: { base: { type: 'raster', tiles: [tiles], tileSize: 256, maxzoom } },
    layers: [{ id: 'base', type: 'raster', source: 'base' }],
  };
}

/** How each base map is drawn, and who must be credited (shown to users, hence in French). */
export const BASE_MAP_STYLES: Record<BaseMapId, { style: string | StyleSpecification; attribution: string }> = {
  'ign-plan': {
    style: IGN_PLAN_STYLE_URL,
    attribution: '© IGN — Plan IGN',
  },
  'ign-aerial': {
    style: rasterStyle(IGN_AERIAL_TILES, 19),
    attribution: '© IGN — Photographies aériennes',
  },
  osm: {
    style: rasterStyle(OSM_TILES, 19),
    attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© contributeurs OpenStreetMap</a>',
  },
};

/** Returns a copy of the style where every source without an attribution gets this one. */
export function withAttribution(style: StyleSpecification, attribution: string): StyleSpecification {
  const sources = Object.fromEntries(
    Object.entries(style.sources).map(([id, source]) => [
      id,
      'attribution' in source && source.attribution ? source : { ...source, attribution },
    ]),
  ) as StyleSpecification['sources'];

  return { ...style, sources };
}
