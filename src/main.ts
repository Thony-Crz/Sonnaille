// Composition root: the only file that wires adapters together with
// the use cases (application) and the interface (ui).
import './ui/style.css';
import { chooseBaseMap, initialBaseMap } from './application/base-map-choice';
import { showTerritory } from './application/show-territory';
import { BASE_MAPS } from './domain/base-map';
import { LocalStorageBaseMapPreferences } from './infrastructure/local-storage-base-map-preferences';
import { createBaseMapSwitcher } from './ui/base-map-switcher';
import { configureMapLibre } from './ui/configure-maplibre';
import { MapLibreMapView } from './ui/maplibre-map-view';

configureMapLibre();

const container = document.querySelector<HTMLElement>('#map');
if (!container) throw new Error('#map element not found');

const preferences = new LocalStorageBaseMapPreferences(() => window.localStorage);
const baseMap = initialBaseMap(preferences);
const view = new MapLibreMapView(container, baseMap);

view.addPanel(
  createBaseMapSwitcher({
    baseMaps: BASE_MAPS,
    selected: baseMap,
    onChange: (id) => chooseBaseMap(view, preferences, id),
  }),
);
showTerritory(view);
