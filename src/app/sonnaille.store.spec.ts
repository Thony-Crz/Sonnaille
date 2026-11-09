import { TestBed } from '@angular/core/testing';
import type { ObservationOnMap, ZoneOnMap } from '../application/ports';
import type { Position } from '../domain/bounds';
import type { Observation } from '../domain/observation';
import type { PastoralZone } from '../domain/pastoral-zone';
import type { Track } from '../domain/track';
import type { MapSurface } from './map-surface';
import { DEMO_DAY, type AppSettings } from './settings';
import { SonnailleStore } from './sonnaille.store';
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

/** A map that records what it is asked, and lets the test tap zones, sightings and points. */
class FakeMap implements MapSurface {
  calls: string[] = [];
  zones: ZoneOnMap[] = [];
  observations: ObservationOnMap[] = [];
  highlighted: string[] = [];
  tapZone: (zone: ZoneOnMap) => void = () => undefined;
  tapSighting: (item: ObservationOnMap) => void = () => undefined;
  private picked: ((position: Position | null) => void) | null = null;
  fitTo() {
    this.calls.push('fitTo');
  }
  showBaseMap(id: string) {
    this.calls.push(`base:${id}`);
  }
  showPastoralZones(zones: ZoneOnMap[]) {
    this.zones = zones;
  }
  setZoneLayerVisible(status: string, visible: boolean) {
    this.calls.push(`layer:${status}:${visible}`);
  }
  showTrack() {
    this.calls.push('track');
  }
  showObservations(items: ObservationOnMap[]) {
    this.observations = items;
  }
  highlightZones(ids: string[]) {
    this.highlighted = ids;
  }
  showMarkedTrails(visible: boolean) {
    this.calls.push(`trails:${visible}`);
  }
  onZoneSelected(handler: (zone: ZoneOnMap) => void) {
    this.tapZone = handler;
  }
  onSightingSelected(handler: (item: ObservationOnMap) => void) {
    this.tapSighting = handler;
  }
  pickLocation() {
    return new Promise<Position | null>((resolve) => (this.picked = resolve));
  }
  cancelPick() {
    this.picked?.(null);
  }
  pick(position: Position) {
    this.picked?.(position);
  }
}

const zone: PastoralZone = {
  id: 'Z1',
  name: 'Alpage du Serre',
  quarter: 'Quartier haut',
  geometry: [[[[5.47, 44.96], [5.49, 44.96], [5.49, 44.98], [5.47, 44.98], [5.47, 44.96]]]],
  presence: { start: '2026-06-15', end: '2026-09-30', species: ['sheep'], guardDogs: true, weekdays: [1, 2, 3, 4, 5, 6, 7] },
};
const track: Track = {
  name: 'Traversée',
  segments: [[{ longitude: 5.48, latitude: 44.95 }, { longitude: 5.48, latitude: 44.99 }]],
};
const here = { longitude: 5.65, latitude: 45.11 };

const memoryValue = <T>(initial: T | null = null) => {
  let value = initial;
  return { load: () => value, save: (v: T) => void (value = v) };
};

async function setup({ settings = {}, publisher = null }: { settings?: Partial<AppSettings>; publisher?: { publish: (o: Observation) => Promise<boolean> } | null } = {}) {
  let mine: Observation[] = [];
  const copied: string[] = [];
  TestBed.configureTestingModule({
    providers: [
      { provide: APP_SETTINGS, useValue: { base: '/Sonnaille/', demo: false, date: '2026-07-15', ...settings } },
      { provide: ZONE_REPOSITORY, useValue: { load: async () => ({ zones: [zone], source: 'Map Patou', requestedDate: '2026-07-15', fetchedAt: '2026-07-15T05:00:00Z' }) } },
      { provide: ADVICE_REPOSITORY, useValue: { load: async () => [] } },
      { provide: OBSERVATION_REPOSITORY, useValue: { load: async () => [] } },
      {
        provide: OBSERVATION_SETTINGS,
        useValue: {
          load: async () => ({
            validityDays: 3,
            haloMeters: { sheep: 300, cattle: 300, goats: 300, horses: 300, donkeys: 300, mixed: 300 },
            nests: {
              beehives: { validityDays: 90, haloMeters: 50 },
              'wasp-nest': { validityDays: 30, haloMeters: 30 },
              'bee-nest': { validityDays: 30, haloMeters: 30 },
              'hornet-nest': { validityDays: 30, haloMeters: 50 },
            },
          }),
        },
      },
      { provide: MY_SIGHTINGS, useValue: { load: () => mine, save: (o: Observation[]) => void (mine = o) } },
      { provide: SIGHTING_PUBLISHER, useValue: publisher },
      { provide: BASE_MAP_PREFERENCES, useValue: memoryValue() },
      { provide: ACTIVITY_PREFERENCES, useValue: memoryValue() },
      { provide: WELCOME_PREFERENCES, useValue: memoryValue('seen') },
      { provide: TRACK_READER, useValue: { read: () => track } },
      { provide: SIGHTINGS_FORMAT, useValue: { publicationText: (o: Observation[]) => `${o.length} features`, feature: () => '{}', editUrl: 'https://github.com/edit' } },
      { provide: DEMO_RESET, useValue: null },
    ],
  });
  const store = TestBed.inject(SonnailleStore);
  const map = new FakeMap();
  store.publicationActions = { copy: async (text) => void copied.push(text), open: () => undefined };
  await store.attach(map);
  return { store, map, copied, mine: () => mine };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('SonnailleStore', () => {
  it('shows the territory and the zones of the day, with their source in the legend', async () => {
    const { store, map } = await setup();

    expect(map.calls).toContain('fitTo');
    expect(map.zones.map((z) => [z.zone.id, z.status])).toEqual([['Z1', 'flock-with-dogs']]);
    expect(store.legendNote()).toContain('Troupeaux prévus le 15/07/2026. Source : Map Patou');
  });

  it('opens the sheet of a tapped zone, then rebuilds it when the activity changes', async () => {
    const { store, map } = await setup();

    map.tapZone(map.zones[0]!);
    expect(store.sheet()).toMatchObject({ kind: 'zone', sheet: { name: 'Alpage du Serre', activity: 'hiking' } });

    store.changeActivity('mtb');
    expect(store.sheet()).toMatchObject({ kind: 'zone', sheet: { activity: 'mtb' } });
  });

  it('imports a track and reports the zones it crosses', async () => {
    const { store, map } = await setup();

    await store.importFile(new File(['<gpx/>'], 'traversee.gpx'));

    expect(store.trackStatus()).toBe('Traversée — 4,4 km');
    expect(store.sheet()).toMatchObject({ kind: 'report' });
    expect(map.highlighted).toEqual(['Z1']);
  });

  it('opens the demo on the demo day when no date is given', async () => {
    const { store } = await setup({ settings: { demo: true, date: null } });

    expect(store.day()).toBe(DEMO_DAY);
  });

  it('reports a sighting: tap the map, answer, keep it on the device', async () => {
    const { store, map, mine } = await setup();

    const reporting = store.reportSighting();
    expect(store.picking()).toBe(true);
    map.pick(here);
    await reporting;
    expect(store.sightingFormAt()?.position).toEqual(here);

    store.saveSighting({ position: here, date: '2026-07-15', time: '09:30', what: { kind: 'hornet-nest' } });

    expect(mine()).toHaveLength(1);
    expect(store.mySightings()).toHaveLength(1);
    expect(store.sightingsNote()).toBe('Enregistré dans « Mes signalements ».');
    expect(store.sightingFormAt()).toBeNull();
  });

  it('publishes to the server when there is one', async () => {
    const publisher = { publish: vi.fn(async () => true) };
    const { store, mine } = await setup({ publisher });
    store.saveSighting({ position: here, date: '2026-07-15', time: '09:30', what: { kind: 'beehives' } });

    await store.publish();

    expect(publisher.publish).toHaveBeenCalledTimes(1);
    expect(mine()).toEqual([]);
    expect(store.sightingsNote()).toBe('1 signalement envoyé. Il sera visible après vérification par un modérateur.');
  });

  it('without a server, copies the sightings for GitHub (V0)', async () => {
    const { store, copied } = await setup();
    store.saveSighting({ position: here, date: '2026-07-15', time: '09:30', what: { kind: 'beehives' } });

    await store.publish();

    expect(copied).toEqual(['1 features']);
    expect(store.sightingsNote()).toContain('Copié.');
  });

  it('opens the sheet of a tapped sighting, closing the others', async () => {
    const { store, map } = await setup();
    store.saveSighting({ position: here, date: '2026-07-15', time: '09:30', what: { kind: 'hornet-nest' } });
    await flush();
    map.tapZone(map.zones[0]!);

    map.tapSighting(map.observations[0]!);

    expect(store.sheet()).toMatchObject({ kind: 'sighting', item: { observation: { kind: 'hornet-nest' } } });
  });

  it('toggles a zone status on the map', async () => {
    const { store, map } = await setup();

    store.toggleZoneStatus('no-flock', false);

    expect(map.calls).toContain('layer:no-flock:false');
  });
});
