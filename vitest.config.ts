import { defineConfig } from 'vitest/config';

// Tests of the domain, the application, the infrastructure, the map adapter (src/ui) and the content.
// The Angular components are tested by `ng test` (src/app/**/*.spec.ts).
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
