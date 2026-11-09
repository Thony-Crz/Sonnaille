import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/* Offline mode (V1, F9) with the Angular service worker: ngsw-config.json. */

interface CacheConfig {
  strategy: 'freshness' | 'performance';
  maxSize: number;
  maxAge: string;
  timeout?: string;
}
interface NgswConfig {
  index: string;
  assetGroups: Array<{ name: string; installMode: string; resources: { files?: string[] } }>;
  dataGroups: Array<{ name: string; urls: string[]; cacheConfig: CacheConfig }>;
}

const ROOT = join(import.meta.dirname, '..', '..');
const config = JSON.parse(readFileSync(join(ROOT, 'ngsw-config.json'), 'utf8')) as NgswConfig;
const angular = JSON.parse(readFileSync(join(ROOT, 'angular.json'), 'utf8'));

/** The same glob rules as the Angular service worker: ** any path, * one segment. */
const matches = (pattern: string, url: string) => {
  const regex = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '.*');
  return new RegExp(`^${regex}$`).test(url);
};
const groupFor = (url: string) => config.dataGroups.find((g) => g.urls.some((p) => matches(p, url)));

describe('offline mode (V1)', () => {
  it('is built into the production app', () => {
    expect(angular.projects.sonnaille.architect.build.options.serviceWorker).toBe('ngsw-config.json');
  });

  it('caches the app itself, its manifest and the MapLibre worker at install', () => {
    const app = config.assetGroups.find((g) => g.installMode === 'prefetch');

    expect(app?.resources.files).toEqual(
      expect.arrayContaining(['/index.html', '/manifest.webmanifest', '/*.css', '/*.js', '/maplibre/*.mjs']),
    );
  });

  it('keeps the icons and the demo track once seen', () => {
    const lazy = config.assetGroups.find((g) => g.installMode === 'lazy');

    expect(lazy?.resources.files).toEqual(expect.arrayContaining(['/icons/**', '/demo/*.gpx']));
  });

  it.each(['data/pastoral-zones.geojson', 'content/observations.geojson', 'content/advice.json', 'demo/pastoral-zones.geojson'])(
    'takes %s from the network when possible, else from the cache',
    (url) => {
      const group = groupFor(url);

      expect(group?.cacheConfig.strategy).toBe('freshness');
      expect(group?.cacheConfig.timeout).toBe('5s');
    },
  );

  it.each([
    'https://data.geopf.fr/tms/1.0.0/PLAN.IGN/12/2112/1450.pbf',
    'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&LAYER=ORTHOIMAGERY.ORTHOPHOTOS',
    'https://a.tile.opentopomap.org/14/8505/5830.png',
    'https://tile.openstreetmap.org/14/8505/5830.png',
    'https://tile.waymarkedtrails.org/hiking/14/8505/5830.png',
  ])('keeps the map tiles already seen, for 30 days at most: %s', (url) => {
    const group = groupFor(url);

    expect(group?.cacheConfig).toMatchObject({ strategy: 'performance', maxAge: '30d' });
    expect(group?.cacheConfig.maxSize).toBeGreaterThan(0);
  });
});
