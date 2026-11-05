import type { RasterSourceSpecification, StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { BASE_MAP_STYLES, IGN_PLAN_STYLE_URL, withAttribution } from './base-map-styles';

describe('BASE_MAP_STYLES', () => {
  it('uses the Géoplateforme IGN Plan vector style', () => {
    expect(IGN_PLAN_STYLE_URL).toBe('https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json');
    expect(BASE_MAP_STYLES['ign-plan'].style).toBe(IGN_PLAN_STYLE_URL);
  });

  it('uses the IGN orthophotos WMTS layer for aerial photos', () => {
    const style = BASE_MAP_STYLES['ign-aerial'].style as StyleSpecification;
    const source = Object.values(style.sources)[0] as RasterSourceSpecification;

    expect(source.type).toBe('raster');
    expect(source.tiles?.[0]).toContain('https://data.geopf.fr/wmts?');
    expect(source.tiles?.[0]).toContain('LAYER=ORTHOIMAGERY.ORTHOPHOTOS');
    expect(source.tiles?.[0]).toContain('TILEMATRIX={z}&TILEROW={y}&TILECOL={x}');
  });

  it('uses the OpenStreetMap standard tiles', () => {
    const style = BASE_MAP_STYLES.osm.style as StyleSpecification;
    const source = Object.values(style.sources)[0] as RasterSourceSpecification;

    expect(source.tiles).toEqual(['https://tile.openstreetmap.org/{z}/{x}/{y}.png']);
  });

  it.each([
    ['ign-plan', 'IGN'],
    ['ign-aerial', 'IGN'],
    ['osm', 'OpenStreetMap'],
  ] as const)('credits the producer of %s', (id, producer) => {
    expect(BASE_MAP_STYLES[id].attribution).toContain(producer);
  });
});

describe('withAttribution', () => {
  const style: StyleSpecification = {
    version: 8,
    sources: {
      a: { type: 'vector', url: 'https://example.org/a.json' },
      b: { type: 'raster', tiles: ['https://example.org/{z}/{x}/{y}.png'], attribution: 'Existing' },
    },
    layers: [],
  };

  it('adds the attribution to sources that have none', () => {
    expect(withAttribution(style, '© IGN').sources.a).toMatchObject({ attribution: '© IGN' });
  });

  it('keeps an attribution already declared by a source', () => {
    expect(withAttribution(style, '© IGN').sources.b).toMatchObject({ attribution: 'Existing' });
  });

  it('does not modify the original style', () => {
    withAttribution(style, '© IGN');

    expect(style.sources.a).not.toHaveProperty('attribution');
  });
});
