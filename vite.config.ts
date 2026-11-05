/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaOptions } from './pwa.config';

// Served by GitHub Pages under https://<account>.github.io/Sonnaille/
export default defineConfig({
  base: '/Sonnaille/',
  // Offline mode (V1): service worker, see pwa.config.ts.
  plugins: [VitePWA(pwaOptions)],
  // Keep the MapLibre worker an ES module once bundled (see src/ui/configure-maplibre.ts).
  worker: { format: 'es' },
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
