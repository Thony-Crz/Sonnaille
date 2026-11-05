/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// Served by GitHub Pages under https://<account>.github.io/Sonnaille/
export default defineConfig({
  base: '/Sonnaille/',
  // Keep the MapLibre worker an ES module once bundled (see src/ui/configure-maplibre.ts).
  worker: { format: 'es' },
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
