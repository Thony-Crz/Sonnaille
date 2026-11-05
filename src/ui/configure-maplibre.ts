import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

/**
 * MapLibre computes its worker URL at runtime, which Vite cannot follow.
 * So Vite bundles the worker and we hand its URL to MapLibre.
 * Call once, before creating any map.
 */
export function configureMapLibre(): void {
  setWorkerUrl(workerUrl);
}
