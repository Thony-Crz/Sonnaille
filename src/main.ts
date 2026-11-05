// Composition root: the only file that wires adapters together with
// the use cases (application) and the interface (ui).
import './ui/style.css';
import { showTerritory } from './application/show-territory';
import { configureMapLibre } from './ui/configure-maplibre';
import { MapLibreMapView } from './ui/maplibre-map-view';

configureMapLibre();

const container = document.querySelector<HTMLElement>('#map');
if (!container) throw new Error('#map element not found');

showTerritory(new MapLibreMapView(container));
