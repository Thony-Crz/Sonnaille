import { describe, expect, it, vi } from 'vitest';

const maplibre = vi.hoisted(() => ({ setWorkerUrl: vi.fn() }));

vi.mock('maplibre-gl', () => ({ setWorkerUrl: maplibre.setWorkerUrl }));
vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url', () => ({ default: '/assets/worker-empaquete.js' }));

import { configurerMapLibre } from './configurer-maplibre';

describe('configurerMapLibre', () => {
  it('donne à MapLibre l’adresse du worker empaqueté par Vite', () => {
    configurerMapLibre();

    expect(maplibre.setWorkerUrl).toHaveBeenCalledWith('/assets/worker-empaquete.js');
  });
});
