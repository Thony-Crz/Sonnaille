import { computed, inject, Injectable, signal } from '@angular/core';
import { chooseBaseMap, initialBaseMap } from '../application/base-map-choice';
import { importTrack } from '../application/import-track';
import { createObservationAt, deleteMySighting, mySightings, saveMySighting, type SightingWhat } from '../application/my-sightings';
import { createObservation, showObservations } from '../application/observations';
import type { ObservationOnMap, ZoneOnMap } from '../application/ports';
import { prepareOuting, type OutingReport } from '../application/prepare-outing';
import { publishMySightings } from '../application/publish-sightings';
import { showPastoralZones, showZonesOn, toggleZoneLayer, type ShowZonesResult } from '../application/show-pastoral-zones';
import { showTerritory } from '../application/show-territory';
import { markWelcomeSeen, shouldShowWelcome } from '../application/welcome';
import { buildZoneSheet, initialActivity, type ZoneSheet } from '../application/zone-sheet';
import type { Activity, Advice } from '../domain/advice';
import { availableBaseMaps, type BaseMapId } from '../domain/base-map';
import type { Position } from '../domain/bounds';
import type { Headcount, Observation } from '../domain/observation';
import type { Species } from '../domain/pastoral-zone';
import { trackHasTimes, type Track } from '../domain/track';
import { dayOf, type ZoneStatus } from '../domain/zone-status';
import { frenchNumber } from './french';
import type { MapSurface } from './map-surface';
import { DEMO_DAY } from './settings';
import {
  ACTIVITY_PREFERENCES,
  ADVICE_REPOSITORY,
  APP_SETTINGS,
  BASE_MAP_PREFERENCES,
  DEMO_RESET,
  MY_SIGHTINGS,
  OBSERVATION_REPOSITORY,
  OBSERVATION_SETTINGS,
  SIGHTING_PUBLISHER,
  SIGHTINGS_FORMAT,
  TRACK_READER,
  WELCOME_PREFERENCES,
  ZONE_REPOSITORY,
} from './tokens';

/** One sheet at a time over the map. */
export type Sheet =
  | { kind: 'zone'; sheet: ZoneSheet }
  | { kind: 'report'; report: OutingReport }
  | { kind: 'sighting'; item: ObservationOnMap }
  | { kind: 'understand' }
  | null;

export interface SightingAnswers {
  position: Position;
  date: string;
  time: string;
  what: SightingWhat;
}

/** A flock seen at a km of the imported track (T24). */
export interface KmAnswers {
  km: number;
  species: Species;
  headcount: Headcount;
  guardDogs: boolean;
  time?: string;
}

const plural = (count: number, one: string, several: string) => (count > 1 ? several : one);

/**
 * The state of the front and what the user can do, with signals.
 * It only talks to the application layer and to the ports given by app.config.ts.
 */
@Injectable({ providedIn: 'root' })
export class SonnailleStore {
  readonly settings = inject(APP_SETTINGS);
  private readonly zoneRepository = inject(ZONE_REPOSITORY);
  private readonly adviceRepository = inject(ADVICE_REPOSITORY);
  private readonly observationRepository = inject(OBSERVATION_REPOSITORY);
  private readonly observationSettings = inject(OBSERVATION_SETTINGS);
  private readonly sightingStore = inject(MY_SIGHTINGS);
  private readonly publisher = inject(SIGHTING_PUBLISHER);
  private readonly baseMapPreferences = inject(BASE_MAP_PREFERENCES);
  private readonly activityPreferences = inject(ACTIVITY_PREFERENCES);
  private readonly welcomePreferences = inject(WELCOME_PREFERENCES);
  private readonly trackReader = inject(TRACK_READER);
  private readonly format = inject(SIGHTINGS_FORMAT);
  private readonly demoReset = inject(DEMO_RESET);

  /** Browser actions of the V0 publication; replaced in tests. */
  publicationActions = {
    copy: (text: string) => navigator.clipboard?.writeText(text) ?? Promise.resolve(),
    open: (url: string) => void window.open(url, '_blank', 'noopener'),
  };

  private map: MapSurface | null = null;
  private selectedZone: ZoneOnMap | null = null;

  readonly baseMaps = availableBaseMaps({ scan25: this.settings.scan25Key !== undefined });
  readonly baseMap = initialBaseMap(this.baseMapPreferences, this.baseMaps);
  readonly day = signal(this.settings.date ?? (this.settings.demo ? DEMO_DAY : dayOf(new Date())));
  readonly activity = signal<Activity>(initialActivity(this.activityPreferences));
  readonly zones = signal<ShowZonesResult>({ available: false });
  readonly advice = signal<Advice[]>([]);
  readonly track = signal<Track | null>(null);
  readonly trackStatus = signal('');
  readonly sheet = signal<Sheet>(null);
  readonly sightings = signal<ObservationOnMap[]>([]);
  readonly recentSightings = signal(0);
  readonly mySightings = signal<Observation[]>([]);
  readonly sightingsNote = signal('');
  readonly picking = signal(false);
  readonly sightingFormAt = signal<{ position: Position; date: string; time: string } | null>(null);
  readonly kmResult = signal<{ json: string; timeFromTrack: boolean } | null>(null);
  readonly welcome = signal(shouldShowWelcome(this.welcomePreferences));
  /** While true, the map leaves room for the outing sheet when framing. */
  framingForSheet = false;

  readonly trackLengthKm = signal(0);
  readonly trackHasTimes = computed(() => {
    const track = this.track();
    return track ? trackHasTimes(track) : true;
  });

  readonly legendNote = computed(() => {
    const zones = this.zones();
    if (!zones.available) return 'Zones pastorales indisponibles pour le moment.';
    const shownDay = new Date(`${this.day()}T12:00:00`).toLocaleDateString('fr-FR');
    const fetched = new Date(zones.fetchedAt).toLocaleDateString('fr-FR');
    const recent = this.recentSightings();
    const sightings =
      recent > 0
        ? ` ${recent} ${plural(recent, 'observation', 'observations')} de terrain ${plural(recent, 'récente', 'récentes')}, touchez un pictogramme pour sa fiche.`
        : '';
    return `Troupeaux prévus le ${shownDay}. Source : ${zones.source}, données du ${fetched}.${sightings} Touchez une zone pour sa fiche.`;
  });

  /** "Voir la démo" under the legend when the real zones are unavailable. */
  readonly demoLink = computed(() =>
    !this.zones().available && !this.settings.demo ? { href: `${this.settings.base}?demo`, label: 'Voir la démo' } : null,
  );

  /** Called once the map exists: shows the territory, the sightings, then the zones of the day. */
  async attach(map: MapSurface): Promise<void> {
    this.map = map;
    showTerritory(map);
    map.onSightingSelected((item) => {
      if (this.picking()) return;
      this.sheet.set({ kind: 'sighting', item });
    });
    map.onZoneSelected((zone) => {
      const zones = this.zones();
      if (!zones.available || this.picking()) return;
      this.selectedZone = zone;
      this.sheet.set({ kind: 'zone', sheet: this.zoneSheet(zone) });
    });
    const sightingsShown = this.refreshSightings();
    const [zones, advice] = await Promise.all([
      showPastoralZones(this.zoneRepository, map, this.day()),
      this.adviceRepository.load().catch(() => []),
    ]);
    this.zones.set(zones);
    this.advice.set(advice);
    await sightingsShown;
    if (this.track()) this.showOutingReport();
  }

  /** The current time; in demo mode, the same time on the demo day, so the fictional sightings stay recent. */
  clock(): Date {
    const now = new Date();
    if (!this.settings.demo) return now;
    const [year, month, date] = DEMO_DAY.split('-').map(Number) as [number, number, number];
    return new Date(year, month - 1, date, now.getHours(), now.getMinutes());
  }

  // --- Base map, zones, activity and day --------------------------------------------

  chooseBaseMap(id: BaseMapId): void {
    if (this.map) chooseBaseMap(this.map, this.baseMapPreferences, id);
  }

  showMarkedTrails(visible: boolean): void {
    this.map?.showMarkedTrails(visible);
  }

  toggleZoneStatus(status: ZoneStatus, visible: boolean): void {
    if (this.map) toggleZoneLayer(this.map, status, visible);
  }

  changeActivity(activity: Activity): void {
    this.activity.set(activity);
    this.activityPreferences.save(activity);
    this.refresh();
  }

  changeDay(day: string): void {
    this.day.set(day);
    this.refresh();
  }

  closeSheet(): void {
    const sheet = this.sheet();
    if (sheet?.kind === 'report') this.map?.highlightZones([]);
    if (sheet?.kind === 'zone') this.selectedZone = null;
    this.sheet.set(null);
  }

  openUnderstand(): void {
    this.sheet.set({ kind: 'understand' });
  }

  closeWelcome(): void {
    markWelcomeSeen(this.welcomePreferences);
    this.welcome.set(false);
  }

  // --- Track and outing report -----------------------------------------------------

  async importFile(file: File): Promise<void> {
    if (!this.map) return;
    this.framingForSheet = this.zones().available;
    const result = importTrack(await file.text(), file.name, this.trackReader, this.map);
    this.framingForSheet = false;
    if (!result.ok) {
      this.trackStatus.set(result.error);
      return;
    }
    this.track.set(result.track);
    this.trackLengthKm.set(result.lengthKm);
    this.kmResult.set(null);
    if (this.zones().available) {
      this.trackStatus.set(`${result.track.name} — ${frenchNumber(result.lengthKm)} km`);
      this.showOutingReport();
    } else {
      this.trackStatus.set(`${result.track.name} — zones pastorales indisponibles, analyse impossible pour le moment.`);
    }
  }

  /** A flock seen at a km of the track, kept on the device and shown at once (T24). */
  reportAtKm(answers: KmAnswers): void {
    const track = this.track();
    if (!track) return;
    const { observation, timeFromTrack } = createObservation({ ...answers, track, outingDate: this.day() });
    this.kmResult.set({ json: this.format.feature(observation), timeFromTrack });
    saveMySighting(this.sightingStore, observation);
    void this.refreshSightings();
  }

  // --- Sightings: tap the map, keep on the device, publish ---------------------------

  async reportSighting(): Promise<void> {
    if (!this.map) return;
    if (this.picking()) {
      this.map.cancelPick();
      return;
    }
    this.picking.set(true);
    this.sheet.set(null);
    const position = await this.map.pickLocation();
    this.picking.set(false);
    if (!position) return;
    const now = this.clock();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.sightingFormAt.set({ position, date: dayOf(now), time });
  }

  cancelSightingForm(): void {
    this.sightingFormAt.set(null);
  }

  saveSighting(answers: SightingAnswers): void {
    saveMySighting(this.sightingStore, createObservationAt(answers));
    this.sightingFormAt.set(null);
    this.sightingsNote.set('Enregistré dans « Mes signalements ».');
    void this.refreshSightings();
  }

  deleteSighting(id: string): void {
    deleteMySighting(this.sightingStore, id);
    void this.refreshSightings();
  }

  async publish(): Promise<void> {
    if (this.publisher) {
      this.sightingsNote.set('Envoi…');
      const { sent, kept } = await publishMySightings(this.sightingStore, this.publisher);
      await this.refreshSightings();
      const visible = this.settings.demo
        ? 'Démo : validation immédiate, voyez la carte.'
        : `${sent > 1 ? 'Ils seront visibles' : 'Il sera visible'} après vérification par un modérateur.`;
      this.sightingsNote.set(
        kept === 0
          ? `${sent} ${plural(sent, 'signalement envoyé', 'signalements envoyés')}. ${visible}`
          : `${sent} ${plural(sent, 'envoyé', 'envoyés')}, ${kept} ${plural(kept, 'non envoyé', 'non envoyés')} : ${plural(kept, 'gardé', 'gardés')} sur cet appareil, réessayez plus tard.`,
      );
      return;
    }
    // V0: the sightings are pasted into content/observations.geojson on GitHub.
    await this.publicationActions.copy(this.format.publicationText(mySightings(this.sightingStore)));
    this.publicationActions.open(this.format.editUrl);
    this.sightingsNote.set(
      'Copié. Dans l’éditeur GitHub qui s’ouvre, collez dans la liste « features » (après la dernière entrée, avec une virgule), puis validez avec « Commit changes ».',
    );
  }

  /** Demo mode: forgets the demo sightings and starts again. */
  resetDemo(): void {
    this.demoReset?.();
    this.sightingStore.save([]);
    window.location.reload();
  }

  // --- Internals ---------------------------------------------------------------------

  private zoneSheet(zone: ZoneOnMap): ZoneSheet {
    const zones = this.zones();
    const { source, fetchedAt } = zones.available ? zones : { source: '', fetchedAt: '' };
    return buildZoneSheet(zone, { activity: this.activity(), advice: this.advice(), source, fetchedAt });
  }

  private showOutingReport(): void {
    const track = this.track();
    const zones = this.zones();
    if (!track || !zones.available || !this.map) return;
    const report = prepareOuting({
      track,
      zones: zones.zones,
      date: this.day(),
      activity: this.activity(),
      advice: this.advice(),
      sightings: this.sightings(),
    });
    this.map.highlightZones(report.crossings.map((c) => c.zone.id));
    this.sheet.set({ kind: 'report', report });
  }

  /** Redraws everything that depends on the day or the activity. */
  private refresh(): void {
    const zones = this.zones();
    if (zones.available && this.map) showZonesOn(this.map, zones.zones, this.day());
    const sheet = this.sheet();
    if (sheet?.kind === 'report') this.showOutingReport();
    if (sheet?.kind === 'zone' && this.selectedZone && zones.available) {
      this.sheet.set({ kind: 'zone', sheet: this.zoneSheet(this.selectedZone) });
    }
  }

  /** Shows published sightings plus the ones kept on this device. */
  private async refreshSightings(): Promise<void> {
    const mine = mySightings(this.sightingStore);
    this.mySightings.set(mine);
    if (!this.map) return;
    const withMine = {
      load: async () => {
        const published = await this.observationRepository.load().catch(() => []);
        return [...published.filter((o) => !mine.some((m) => m.id === o.id)), ...mine];
      },
    };
    const result = await showObservations(withMine, this.observationSettings, this.map, this.clock());
    if (result.available) {
      this.recentSightings.set(result.recent);
      this.sightings.set(result.items);
    }
    if (this.sheet()?.kind === 'report') this.showOutingReport();
  }
}
