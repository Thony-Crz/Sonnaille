// Composition root: the only file that wires adapters together with
// the use cases (application) and the interface (ui).
import './ui/style.css';
import { chooseBaseMap, initialBaseMap } from './application/base-map-choice';
import { importTrack } from './application/import-track';
import { createObservationAt, deleteMySighting, mySightings, saveMySighting } from './application/my-sightings';
import { createObservation, showObservations } from './application/observations';
import type { ObservationOnMap, ZoneOnMap } from './application/ports';
import { prepareOuting } from './application/prepare-outing';
import { showPastoralZones, showZonesOn, toggleZoneLayer, type ShowZonesResult } from './application/show-pastoral-zones';
import { showTerritory } from './application/show-territory';
import { markWelcomeSeen, shouldShowWelcome } from './application/welcome';
import { buildZoneSheet, initialActivity } from './application/zone-sheet';
import type { Activity, Advice } from './domain/advice';
import { availableBaseMaps } from './domain/base-map';
import { trackHasTimes, type Track } from './domain/track';
import { dayOf, parseDay } from './domain/zone-status';
import { HttpAdviceRepository } from './infrastructure/advice-content';
import { readGpx } from './infrastructure/gpx-reader';
import { LocalStorageSightings, publicationText } from './infrastructure/local-storage-sightings';
import { HttpObservationRepository, HttpObservationSettings, observationFeature } from './infrastructure/observations-content';
import { HttpPastoralZoneRepository } from './infrastructure/http-pastoral-zone-repository';
import { LocalStorageActivityPreferences } from './infrastructure/local-storage-activity-preferences';
import { LocalStorageBaseMapPreferences } from './infrastructure/local-storage-base-map-preferences';
import { LocalStorageValue } from './infrastructure/local-storage-value';
import { createBaseMapStyles } from './ui/base-map-styles';
import { createBaseMapSwitcher } from './ui/base-map-switcher';
import { configureMapLibre } from './ui/configure-maplibre';
import { element, frenchNumber } from './ui/dom';
import { createUnderstandPanel, createWelcomeDialog } from './ui/info-panels';
import { MapLibreMapView } from './ui/maplibre-map-view';
import { createOfflineNotice } from './ui/offline-notice';
import { createObservationForm } from './ui/observation-form';
import { createOutingReportPanel } from './ui/outing-report-panel';
import { createMySightings, createSightingForm } from './ui/sightings';
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
const sightingStore = new LocalStorageSightings(storage);
// V0 publication: the sightings are pasted into this file on GitHub (only the repository owner can commit).
const OBSERVATIONS_EDIT_URL = 'https://github.com/Thony-Crz/Sonnaille/edit/main/public/content/observations.geojson';

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
let sightings: ObservationOnMap[] = [];

// --- Map and panels --------------------------------------------------------
// The IGN 1:25,000 map needs a personal IGN key, given at build time (docs/fonds-de-carte.md).
const scan25Key: string | undefined = import.meta.env.VITE_IGN_SCAN25_KEY || undefined;
const baseMaps = availableBaseMaps({ scan25: scan25Key !== undefined });
const baseMap = initialBaseMap(baseMapPreferences, baseMaps);
// Framing leaves room for the panels: on phones the outing sheet covers the bottom half,
// on larger screens it sits on the right and the controls on the left.
let framingForSheet = false;
const framePadding = () => {
  const phone = !window.matchMedia('(min-width: 768px)').matches;
  if (phone) return framingForSheet ? { top: 210, bottom: Math.round(window.innerHeight * 0.5) + 16, left: 16, right: 56 } : 24;
  return framingForSheet ? { top: 24, bottom: 24, left: 190, right: 430 } : { top: 24, bottom: 24, left: 190, right: 24 };
};
const view = new MapLibreMapView(container, baseMap, { framePadding, styles: createBaseMapStyles({ scan25Key }) });
view.addPanel(
  createBaseMapSwitcher({ baseMaps, selected: baseMap, onTrailsChange: (visible) => view.showMarkedTrails(visible), onChange: (id) => chooseBaseMap(view, baseMapPreferences, id) }),
);
showTerritory(view);

const trackImport = createTrackImport({ onFile: (file) => void importFile(file) });
view.addPanel(trackImport.element);
enableFileDrop(container, (file) => void importFile(file));

const legend = createZoneLegend({
  onToggle: (status, visible) => toggleZoneLayer(view, status, visible),
  open: window.matchMedia('(min-width: 768px)').matches,
});
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
    saveMySighting(sightingStore, observation);
    refreshSightings();
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
document.body.append(zoneSheet.element, outingReport.element, createOfflineNotice(window));

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
  const report = prepareOuting({ track, zones: zones.zones, date: day, activity, advice, sightings });
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
  framingForSheet = zones.available;
  const result = importTrack(await file.text(), file.name, { read: readGpx }, view);
  framingForSheet = false;
  if (!result.ok) {
    trackImport.setStatus(result.error);
    return;
  }
  track = result.track;
  observationForm.setTrackLength(result.lengthKm);
  observationForm.setTrackHasTimes(trackHasTimes(result.track));
  trackImport.setStatus(`${result.track.name} — ${frenchNumber(result.lengthKm)} km`);
  if (zones.available) showOutingReport();
  else trackImport.setStatus(`${result.track.name} — zones pastorales indisponibles, analyse impossible pour le moment.`);
}

// --- Sightings: tap the map, keep on the device, publish ----------------------
const sightingForm = createSightingForm({
  onSave: (answers) => {
    saveMySighting(sightingStore, createObservationAt(answers));
    refreshSightings();
    mySightingsPanel.setNote('Enregistré dans « Mes signalements ».');
  },
  onCancel: () => {},
});
document.body.append(sightingForm.element);

let picking = false;
const mySightingsPanel = createMySightings({
  onReport: () => void reportSighting(),
  onDelete: (id) => {
    deleteMySighting(sightingStore, id);
    refreshSightings();
  },
  onPublish: () => {
    const text = publicationText(mySightings(sightingStore));
    void navigator.clipboard?.writeText(text);
    window.open(OBSERVATIONS_EDIT_URL, '_blank', 'noopener');
    mySightingsPanel.setNote(
      'Copié. Dans l’éditeur GitHub qui s’ouvre, collez dans la liste « features » (après la dernière entrée, avec une virgule), puis validez avec « Commit changes ».',
    );
  },
});
view.addPanel(mySightingsPanel.element);

async function reportSighting(): Promise<void> {
  if (picking) {
    view.cancelPick();
    return;
  }
  picking = true;
  mySightingsPanel.setPicking(true);
  zoneSheet.hide();
  outingReport.hide();
  const position = await view.pickLocation();
  picking = false;
  mySightingsPanel.setPicking(false);
  if (!position) return;
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  sightingForm.open(position, { date: dayOf(now), time });
}

/** Shows published sightings plus the ones kept on this device, and refreshes what depends on them. */
function refreshSightings(): void {
  const mine = mySightings(sightingStore);
  mySightingsPanel.setList(mine);
  const withMine = {
    load: async () => {
      const published = await observationRepository.load().catch(() => []);
      return [...published.filter((o) => !mine.some((m) => m.id === o.id)), ...mine];
    },
  };
  void showObservations(withMine, observationSettings, view, new Date()).then((result) => {
    if (result.available) {
      recentObservations = result.recent;
      sightings = result.items;
    }
    updateLegendNote();
    if (track && !outingReport.element.hidden) showOutingReport();
  });
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
refreshSightings();

void Promise.all([showPastoralZones(zoneRepository, view, day), adviceRepository.load().catch(() => [])]).then(
  ([result, loadedAdvice]) => {
    zones = result;
    advice = loadedAdvice;
    updateLegendNote();
    if (!zones.available) return;

    view.onZoneSelected((zone) => {
      if (!zones.available || picking) return;
      selectedZone = zone;
      outingReport.hide();
      zoneSheet.show(buildZoneSheet(zone, { activity, advice, source: zones.source, fetchedAt: zones.fetchedAt }));
    });
    if (track) showOutingReport();
  },
);
