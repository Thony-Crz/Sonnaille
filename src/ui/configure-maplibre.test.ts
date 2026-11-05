import { describe, expect, it, vi } from 'vitest';

const maplibre = vi.hoisted(() => ({ setWorkerUrl: vi.fn() }));

vi.mock('maplibre-gl', () => ({ setWorkerUrl: maplibre.setWorkerUrl }));
vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url', () => ({ default: '/assets/bundled-worker.js' }));

import { configureMapLibre } from './configure-maplibre';

describe('configureMapLibre', () => {
  it('gives MapLibre the URL of the worker bundled by Vite', () => {
    configureMapLibre();

    expect(maplibre.setWorkerUrl).toHaveBeenCalledWith('/assets/bundled-worker.js');
  });
});
