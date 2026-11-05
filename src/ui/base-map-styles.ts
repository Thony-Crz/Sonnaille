import type { StyleSpecification } from 'maplibre-gl';
import type { BaseMapId } from '../domain/base-map';

/** IGN Plan vector style served by the Géoplateforme, no key required. */
export const IGN_PLAN_STYLE_URL = 'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json';

const IGN_AERIAL_TILES =
  'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
  '&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg' +
  '&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';

const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TOPO_TILES = ['a', 'b', 'c'].map((s) => `https://${s}.tile.opentopomap.org/{z}/{x}/{y}.png`);

/** IGN SCAN 25 (the 1:25,000 hiking map): private Géoplateforme service, personal key required. */
const scan25Tiles = (key: string) =>
  `https://data.geopf.fr/private/wmts?apikey=${encodeURIComponent(key)}&SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0` +
  '&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg' +
  '&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';

function rasterStyle(tiles: string | string[], maxzoom: number): StyleSpecification {
  return {
    version: 8,
    sources: { base: { type: 'raster', tiles: Array.isArray(tiles) ? tiles : [tiles], tileSize: 256, maxzoom } },
    layers: [{ id: 'base', type: 'raster', source: 'base' }],
  };
}

export interface BaseMapStyle {
  style: string | StyleSpecification;
  attribution: string;
}

export type BaseMapStyles = Record<Exclude<BaseMapId, 'ign-scan25'>, BaseMapStyle> & { 'ign-scan25'?: BaseMapStyle };

/** How each base map is drawn, and who must be credited (shown to users, hence in French). */
export function createBaseMapStyles({ scan25Key }: { scan25Key?: string }): BaseMapStyles {
  return {
    ...BASE_STYLES,
    ...(scan25Key
      ? { 'ign-scan25': { style: rasterStyle(scan25Tiles(scan25Key), 18), attribution: '© IGN — SCAN 25' } }
      : {}),
  };
}

const BASE_STYLES: Record<Exclude<BaseMapId, 'ign-scan25'>, BaseMapStyle> = {
  'ign-plan': {
    style: IGN_PLAN_STYLE_URL,
    attribution: '© IGN — Plan IGN',
  },
  'ign-aerial': {
    style: rasterStyle(IGN_AERIAL_TILES, 19),
    attribution: '© IGN — Photographies aériennes',
  },
  topo: {
    style: rasterStyle(TOPO_TILES, 17),
    attribution:
      '© contributeurs <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>, SRTM — rendu © <a href="https://opentopomap.org" target="_blank" rel="noopener">OpenTopoMap</a> (CC-BY-SA)',
  },
  osm: {
    style: rasterStyle(OSM_TILES, 19),
    attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© contributeurs OpenStreetMap</a>',
  },
};

/** Base maps without the IGN key (the 1:25,000 map is then not offered). */
export const BASE_MAP_STYLES: BaseMapStyles = createBaseMapStyles({});

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
