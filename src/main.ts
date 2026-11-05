// Composition root: the only file that wires adapters together with
// the use cases (application) and the interface (ui).
import './ui/style.css';
import { chooseBaseMap, initialBaseMap } from './application/base-map-choice';
import { importTrack } from './application/import-track';
import { showPastoralZones, toggleZoneLayer } from './application/show-pastoral-zones';
import type { ZoneOnMap } from './application/ports';
import { showTerritory } from './application/show-territory';
import { buildZoneSheet, initialActivity } from './application/zone-sheet';
import { BASE_MAPS } from './domain/base-map';
import { dayOf, parseDay } from './domain/zone-status';
import { HttpAdviceRepository } from './infrastructure/advice-content';
import { readGpx } from './infrastructure/gpx-reader';
import { HttpPastoralZoneRepository } from './infrastructure/http-pastoral-zone-repository';
import { LocalStorageActivityPreferences } from './infrastructure/local-storage-activity-preferences';
import { LocalStorageBaseMapPreferences } from './infrastructure/local-storage-base-map-preferences';
import { createBaseMapSwitcher } from './ui/base-map-switcher';
import { configureMapLibre } from './ui/configure-maplibre';
import { MapLibreMapView } from './ui/maplibre-map-view';
import { createTrackImport, enableFileDrop } from './ui/track-import';
import { createZoneLegend } from './ui/zone-legend';
import { createZoneSheetPanel } from './ui/zone-sheet-panel';

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

// GPX import (T15): read on the device, never sent anywhere.
const trackImport = createTrackImport({ onFile: (file) => void importFile(file) });
view.addPanel(trackImport.element);
enableFileDrop(container, (file) => void importFile(file));

async function importFile(file: File): Promise<void> {
  const result = importTrack(await file.text(), file.name, { read: readGpx }, view);
  trackImport.setStatus(
    result.ok ? `${result.track.name} — ${result.lengthKm.toLocaleString('fr-FR')} km` : result.error,
  );
}

// Day shown on the map: today, or ?date=YYYY-MM-DD (e.g. a summer day for a demo).
const day = parseDay(new URLSearchParams(window.location.search).get('date')) ?? dayOf(new Date());

const legend = createZoneLegend({ onToggle: (status, visible) => toggleZoneLayer(view, status, visible) });
view.addPanel(legend.element, 'bottom-left');

const base = import.meta.env.BASE_URL;
const zones = new HttpPastoralZoneRepository(`${base}data/pastoral-zones.geojson`, (url) => fetch(url));
const adviceRepository = new HttpAdviceRepository(`${base}content/advice.json`, (url) => fetch(url));
const activityPreferences = new LocalStorageActivityPreferences(() => window.localStorage);

void Promise.all([showPastoralZones(zones, view, day), adviceRepository.load().catch(() => [])]).then(([result, advice]) => {
  const shownDay = new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR');
  if (!result.available) {
    legend.setNote('Zones pastorales indisponibles pour le moment.');
    return;
  }
  legend.setNote(
    `Troupeaux prévus le ${shownDay}. Source : ${result.source}, données du ${new Date(result.fetchedAt).toLocaleDateString('fr-FR')}. Touchez une zone pour sa fiche.`,
  );

  // Zone sheet (T14): opens when a zone is tapped, follows the chosen activity.
  let activity = initialActivity(activityPreferences);
  let selected: ZoneOnMap | null = null;
  const render = () => {
    if (selected) sheet.show(buildZoneSheet(selected, { activity, advice, source: result.source, fetchedAt: result.fetchedAt }));
  };
  const sheet = createZoneSheetPanel({
    onActivityChange: (chosen) => {
      activity = chosen;
      activityPreferences.save(chosen);
      render();
    },
    onClose: () => {
      selected = null;
    },
  });
  document.body.append(sheet.element);
  view.onZoneSelected((zone) => {
    selected = zone;
    render();
  });
});
