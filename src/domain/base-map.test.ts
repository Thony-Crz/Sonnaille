import { describe, expect, it } from 'vitest';
import { BASE_MAPS, DEFAULT_BASE_MAP, availableBaseMaps, resolveBaseMap } from './base-map';

describe('base maps', () => {
  it('offers IGN Plan, the IGN 1:25,000 map, a topographic map, IGN aerial photos and OpenStreetMap', () => {
    expect(BASE_MAPS.map((b) => b.id)).toEqual(['ign-plan', 'ign-scan25', 'topo', 'ign-aerial', 'osm']);
  });

  it('has a French label for each base map', () => {
    expect(BASE_MAPS.map((b) => b.label)).toEqual([
      'Plan IGN',
      'Carte IGN 1:25 000',
      'Topographique (OpenTopoMap)',
      'Photos aériennes IGN',
      'OpenStreetMap',
    ]);
  });

  it('defaults to IGN Plan', () => {
    expect(DEFAULT_BASE_MAP).toBe('ign-plan');
  });
});

describe('availableBaseMaps', () => {
  it('leaves out the IGN 1:25,000 map without an IGN key', () => {
    expect(availableBaseMaps({ scan25: false }).map((b) => b.id)).toEqual(['ign-plan', 'topo', 'ign-aerial', 'osm']);
  });

  it('includes it with an IGN key', () => {
    expect(availableBaseMaps({ scan25: true }).map((b) => b.id)).toContain('ign-scan25');
  });
});

describe('resolveBaseMap', () => {
  it('keeps a known saved base map', () => {
    expect(resolveBaseMap('osm')).toBe('osm');
  });

  it('falls back to the default when nothing is saved', () => {
    expect(resolveBaseMap(null)).toBe('ign-plan');
  });

  it('falls back to the default for an unknown value', () => {
    expect(resolveBaseMap('google-satellite')).toBe('ign-plan');
  });

  it('falls back to the default for a base map no longer available', () => {
    expect(resolveBaseMap('ign-scan25', availableBaseMaps({ scan25: false }))).toBe('ign-plan');
  });
});
