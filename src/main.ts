// Composition root: the only file that wires adapters together with
// the use cases (application) and the interface (ui).
import './ui/style.css';
import { chooseBaseMap, initialBaseMap } from './application/base-map-choice';
import { showPastoralZones, toggleZoneLayer } from './application/show-pastoral-zones';
import { showTerritory } from './application/show-territory';
import { BASE_MAPS } from './domain/base-map';
import { dayOf, parseDay } from './domain/zone-status';
import { HttpPastoralZoneRepository } from './infrastructure/http-pastoral-zone-repository';
import { LocalStorageBaseMapPreferences } from './infrastructure/local-storage-base-map-preferences';
import { createBaseMapSwitcher } from './ui/base-map-switcher';
import { configureMapLibre } from './ui/configure-maplibre';
import { MapLibreMapView } from './ui/maplibre-map-view';
import { createZoneLegend } from './ui/zone-legend';

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

// Day shown on the map: today, or ?date=YYYY-MM-DD (e.g. a summer day for a demo).
const day = parseDay(new URLSearchParams(window.location.search).get('date')) ?? dayOf(new Date());

const legend = createZoneLegend({ onToggle: (status, visible) => toggleZoneLayer(view, status, visible) });
view.addPanel(legend.element, 'bottom-left');

const zones = new HttpPastoralZoneRepository(`${import.meta.env.BASE_URL}data/pastoral-zones.geojson`, (url) => fetch(url));
void showPastoralZones(zones, view, day).then((result) => {
  const shownDay = new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR');
  legend.setNote(
    result.available
      ? `Troupeaux prévus le ${shownDay}. Source : ${result.source}, données du ${new Date(result.fetchedAt).toLocaleDateString('fr-FR')}.`
      : 'Zones pastorales indisponibles pour le moment.',
  );
});
