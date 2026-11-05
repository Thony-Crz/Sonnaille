/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// Le site est servi par GitHub Pages sous https://<compte>.github.io/Sonnaille/
export default defineConfig({
  base: '/Sonnaille/',
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
