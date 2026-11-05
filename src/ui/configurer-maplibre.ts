import { setWorkerUrl } from 'maplibre-gl';
import urlWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

/**
 * MapLibre calcule l'adresse de son worker à l'exécution, ce que Vite ne peut pas suivre.
 * On fait donc empaqueter le worker par Vite et on donne son adresse à MapLibre.
 * À appeler une fois, avant de créer une carte.
 */
export function configurerMapLibre(): void {
  setWorkerUrl(urlWorker);
}
