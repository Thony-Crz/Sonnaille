import { describe, expect, it } from 'vitest';
import { BASE_MAPS, DEFAULT_BASE_MAP, resolveBaseMap } from './base-map';

describe('base maps', () => {
  it('offers IGN Plan, IGN aerial photos and OpenStreetMap, in that order', () => {
    expect(BASE_MAPS.map((b) => b.id)).toEqual(['ign-plan', 'ign-aerial', 'osm']);
  });

  it('has a French label for each base map', () => {
    expect(BASE_MAPS.map((b) => b.label)).toEqual(['Plan IGN', 'Photos aériennes IGN', 'OpenStreetMap']);
  });

  it('defaults to IGN Plan', () => {
    expect(DEFAULT_BASE_MAP).toBe('ign-plan');
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
});
