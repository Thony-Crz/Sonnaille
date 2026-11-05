/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// Le site est servi par GitHub Pages sous https://<compte>.github.io/Sonnaille/
export default defineConfig({
  base: '/Sonnaille/',
  // Le worker MapLibre reste un module ES une fois empaqueté (voir src/ui/configurer-maplibre.ts).
  worker: { format: 'es' },
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
