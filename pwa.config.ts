import type { VitePWAOptions } from 'vite-plugin-pwa';

const THIRTY_DAYS = 30 * 24 * 3600;

/** Map tiles already seen stay available offline: browse your area before leaving. */
const tiles = (cacheName: string, urlPattern: RegExp, maxEntries: number) => ({
  urlPattern,
  handler: 'CacheFirst' as const,
  options: {
    cacheName,
    expiration: { maxEntries, maxAgeSeconds: THIRTY_DAYS },
    cacheableResponse: { statuses: [0, 200] },
  },
});

/**
 * Offline mode (V1, F9): the app shell is precached; zones and published content come
 * from the network when possible, else from the cache; map tiles already seen are kept.
 */
export const pwaOptions: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',
  // public/manifest.webmanifest is ours (T09).
  manifest: false,
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,json}'],
    // MapLibre is large: allow it in the precache.
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    runtimeCaching: [
      {
        urlPattern: /\/(data|content)\/[^/]+\.(geojson|json)$/,
        handler: 'NetworkFirst',
        options: { cacheName: 'sonnaille-data', networkTimeoutSeconds: 5, expiration: { maxEntries: 20, maxAgeSeconds: THIRTY_DAYS } },
      },
      tiles('tiles-ign', /^https:\/\/data\.geopf\.fr\//, 4000),
      tiles('tiles-opentopomap', /^https:\/\/[abc]\.tile\.opentopomap\.org\//, 2000),
      tiles('tiles-osm', /^https:\/\/tile\.openstreetmap\.org\//, 2000),
      tiles('tiles-trails', /^https:\/\/tile\.waymarkedtrails\.org\//, 2000),
    ],
  },
};
