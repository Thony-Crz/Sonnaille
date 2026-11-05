import { describe, expect, it } from 'vitest';
import { pwaOptions } from '../../pwa.config';

const rules = pwaOptions.workbox?.runtimeCaching ?? [];
const ruleFor = (url: string) =>
  rules.find((r) => (r.urlPattern instanceof RegExp ? r.urlPattern.test(url) : false));

describe('offline mode (V1)', () => {
  it('keeps our own web app manifest', () => {
    expect(pwaOptions.manifest).toBe(false);
  });

  it('updates the app by itself when a new version is deployed', () => {
    expect(pwaOptions.registerType).toBe('autoUpdate');
  });

  it('caches the app itself, its icons and its published content', () => {
    expect(pwaOptions.workbox?.globPatterns).toEqual(['**/*.{js,css,html,svg,png,webmanifest,json}']);
  });

  it('takes the pastoral zones and the observations from the network when possible, else from the cache', () => {
    for (const url of [
      'https://thony-crz.github.io/Sonnaille/data/pastoral-zones.geojson',
      'https://thony-crz.github.io/Sonnaille/content/observations.geojson',
    ]) {
      expect(ruleFor(url)?.handler).toBe('NetworkFirst');
    }
  });

  it.each([
    'https://data.geopf.fr/tms/1.0.0/PLAN.IGN/12/2112/1450.pbf',
    'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&LAYER=ORTHOIMAGERY.ORTHOPHOTOS',
    'https://a.tile.opentopomap.org/14/8505/5830.png',
    'https://tile.openstreetmap.org/14/8505/5830.png',
    'https://tile.waymarkedtrails.org/hiking/14/8505/5830.png',
  ])('keeps the map tiles already seen, for 30 days at most: %s', (url) => {
    const rule = ruleFor(url);

    expect(rule?.handler).toBe('CacheFirst');
    expect(rule?.options?.expiration?.maxAgeSeconds).toBe(30 * 24 * 3600);
    expect(rule?.options?.expiration?.maxEntries).toBeGreaterThan(0);
  });
});
