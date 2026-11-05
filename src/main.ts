// Composition root: the only file that wires adapters together with
// the use cases (application) and the interface (ui).
import './ui/style.css';
import { chooseBaseMap, initialBaseMap } from './application/base-map-choice';
import { importTrack } from './application/import-track';
import { createObservation, showObservations } from './application/observations';
import type { ZoneOnMap } from './application/ports';
import { prepareOuting } from './application/prepare-outing';
import { showPastoralZones, showZonesOn, toggleZoneLayer, type ShowZonesResult } from './application/show-pastoral-zones';
import { showTerritory } from './application/show-territory';
import { markWelcomeSeen, shouldShowWelcome } from './application/welcome';
import { buildZoneSheet, initialActivity } from './application/zone-sheet';
import type { Activity, Advice } from './domain/advice';
import { BASE_MAPS } from './domain/base-map';
import type { Track } from './domain/track';
import { dayOf, parseDay } from './domain/zone-status';
import { HttpAdviceRepository } from './infrastructure/advice-content';
import { readGpx } from './infrastructure/gpx-reader';
import { HttpObservationRepository, HttpObservationSettings, observationFeature } from './infrastructure/observations-content';
import { HttpPastoralZoneRepository } from './infrastructure/http-pastoral-zone-repository';
import { LocalStorageActivityPreferences } from './infrastructure/local-storage-activity-preferences';
import { LocalStorageBaseMapPreferences } from './infrastructure/local-storage-base-map-preferences';
import { LocalStorageValue } from './infrastructure/local-storage-value';
import { createBaseMapSwitcher } from './ui/base-map-switcher';
import { configureMapLibre } from './ui/configure-maplibre';
import { element, frenchNumber } from './ui/dom';
import { createUnderstandPanel, createWelcomeDialog } from './ui/info-panels';
import { MapLibreMapView } from './ui/maplibre-map-view';
import { createObservationForm } from './ui/observation-form';
import { createOutingReportPanel } from './ui/outing-report-panel';
import { createTrackImport, enableFileDrop } from './ui/track-import';
import { createZoneLegend } from './ui/zone-legend';
import { createZoneSheetPanel } from './ui/zone-sheet-panel';

configureMapLibre();

const container = document.querySelector<HTMLElement>('#map');
if (!container) throw new Error('#map element not found');

const base = import.meta.env.BASE_URL;
const storage = () => window.localStorage;
const baseMapPreferences = new LocalStorageBaseMapPreferences(storage);
const activityPreferences = new LocalStorageActivityPreferences(storage);
const welcomePreferences = new LocalStorageValue<'seen'>('sonnaille.welcome', storage);
const zoneRepository = new HttpPastoralZoneRepository(`${base}data/pastoral-zones.geojson`, (url) => fetch(url));
const adviceRepository = new HttpAdviceRepository(`${base}content/advice.json`, (url) => fetch(url));
const observationRepository = new HttpObservationRepository(`${base}content/observations.geojson`, (url) => fetch(url));
const observationSettings = new HttpObservationSettings(`${base}content/observation-settings.json`, (url) => fetch(url));

// --- State -----------------------------------------------------------------
// Day shown on the map: today, or ?date=YYYY-MM-DD (e.g. a summer day for a demo),
// then the outing date once a GPX is imported.
let day = parseDay(new URLSearchParams(window.location.search).get('date')) ?? dayOf(new Date());
let activity: Activity = initialActivity(activityPreferences);
let zones: ShowZonesResult = { available: false };
let advice: Advice[] = [];
let track: Track | null = null;
let selectedZone: ZoneOnMap | null = null;
let recentObservations = 0;

// --- Map and panels --------------------------------------------------------
const baseMap = initialBaseMap(baseMapPreferences);
const view = new MapLibreMapView(container, baseMap);
view.addPanel(
  createBaseMapSwitcher({ baseMaps: BASE_MAPS, selected: baseMap, onChange: (id) => chooseBaseMap(view, baseMapPreferences, id) }),
);
showTerritory(view);

const trackImport = createTrackImport({ onFile: (file) => void importFile(file) });
view.addPanel(trackImport.element);
enableFileDrop(container, (file) => void importFile(file));

const legend = createZoneLegend({ onToggle: (status, visible) => toggleZoneLayer(view, status, visible) });
view.addPanel(legend.element, 'bottom-left');

const zoneSheet = createZoneSheetPanel({
  onActivityChange: changeActivity,
  onClose: () => {
    selectedZone = null;
  },
});
// Field sighting after the outing (T24): a GeoJSON entry to add to content/observations.geojson,
// previewed on the map right away.
const observationForm = createObservationForm({
  onSubmit: (answers) => {
    if (!track) return;
    const { observation, timeFromTrack } = createObservation({ ...answers, track, outingDate: day });
    observationForm.showResult(JSON.stringify(observationFeature(observation), null, 2), timeFromTrack);
    const withPreview = { load: async () => [...(await observationRepository.load().catch(() => [])), observation] };
    void showObservations(withPreview, observationSettings, view, new Date());
  },
});

const outingReport = createOutingReportPanel({
  extra: observationForm.element,
  onDateChange: (date) => {
    day = date;
    refresh();
  },
  onActivityChange: changeActivity,
  onClose: () => view.highlightZones([]),
});
document.body.append(zoneSheet.element, outingReport.element);

// --- Behaviour ---------------------------------------------------------------
function changeActivity(chosen: Activity): void {
  activity = chosen;
  activityPreferences.save(chosen);
  refresh();
}

function updateLegendNote(): void {
  if (!zones.available) {
    legend.setNote('Zones pastorales indisponibles pour le moment.');
    return;
  }
  const shownDay = new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR');
  const fetched = new Date(zones.fetchedAt).toLocaleDateString('fr-FR');
  const sightings =
    recentObservations > 0
      ? ` ${recentObservations} observation${recentObservations > 1 ? 's' : ''} de terrain récente${recentObservations > 1 ? 's' : ''} (en violet).`
      : '';
  legend.setNote(
    `Troupeaux prévus le ${shownDay}. Source : ${zones.source}, données du ${fetched}.${sightings} Touchez une zone pour sa fiche.`,
  );
}

/** Shows the outing report (T16-T18) for the imported track, on the current day and activity. */
function showOutingReport(): void {
  if (!track || !zones.available) return;
  const report = prepareOuting({ track, zones: zones.zones, date: day, activity, advice });
  view.highlightZones(report.crossings.map((c) => c.zone.id));
  zoneSheet.hide();
  outingReport.show(report);
}

/** Redraws everything that depends on the day or the activity. */
function refresh(): void {
  if (zones.available) showZonesOn(view, zones.zones, day);
  updateLegendNote();
  if (track && !outingReport.element.hidden) showOutingReport();
  if (selectedZone && !zoneSheet.element.hidden && zones.available) {
    zoneSheet.show(buildZoneSheet(selectedZone, { activity, advice, source: zones.source, fetchedAt: zones.fetchedAt }));
  }
}

async function importFile(file: File): Promise<void> {
  const result = importTrack(await file.text(), file.name, { read: readGpx }, view);
  if (!result.ok) {
    trackImport.setStatus(result.error);
    return;
  }
  track = result.track;
  observationForm.setTrackLength(result.lengthKm);
  trackImport.setStatus(`${result.track.name} — ${frenchNumber(result.lengthKm)} km`);
  if (zones.available) showOutingReport();
  else trackImport.setStatus(`${result.track.name} — zones pastorales indisponibles, analyse impossible pour le moment.`);
}

// --- Welcome (T23) and "Comprendre" (T22) ------------------------------------
if (shouldShowWelcome(welcomePreferences)) {
  document.body.append(createWelcomeDialog({ onClose: () => markWelcomeSeen(welcomePreferences) }));
}

const understandButton = element('button', { type: 'button', className: 'understand-button', textContent: 'Comprendre' });
view.addPanel(element('div', { className: 'map-panel understand-entry' }, understandButton));
let understand: ReturnType<typeof createUnderstandPanel> | null = null;
understandButton.addEventListener('click', () => {
  if (!understand) {
    understand = createUnderstandPanel({ advice });
    document.body.append(understand.element);
  }
  zoneSheet.hide();
  outingReport.hide();
  understand.open();
});

// --- Start -----------------------------------------------------------------
void showObservations(observationRepository, observationSettings, view, new Date()).then((result) => {
  if (result.available) recentObservations = result.recent;
  updateLegendNote();
});

void Promise.all([showPastoralZones(zoneRepository, view, day), adviceRepository.load().catch(() => [])]).then(
  ([result, loadedAdvice]) => {
    zones = result;
    advice = loadedAdvice;
    updateLegendNote();
    if (!zones.available) return;

    view.onZoneSelected((zone) => {
      if (!zones.available) return;
      selectedZone = zone;
      outingReport.hide();
      zoneSheet.show(buildZoneSheet(zone, { activity, advice, source: zones.source, fetchedAt: zones.fetchedAt }));
    });
    if (track) showOutingReport();
  },
);
