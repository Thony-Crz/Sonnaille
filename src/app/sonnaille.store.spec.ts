import { TestBed } from '@angular/core/testing';
import type { Observation } from '../domain/observation';
import { FakeMap } from './testing/fake-map';
import { DEMO_DAY, type AppSettings } from './settings';
import { SonnailleStore } from './sonnaille.store';
import { fakePorts } from './testing/fake-ports';

const here = { longitude: 5.65, latitude: 45.11 };

async function setup({ settings = {}, publisher = null }: { settings?: Partial<AppSettings>; publisher?: { publish: (o: Observation) => Promise<boolean> } | null } = {}) {
  const copied: string[] = [];
  const { providers, mine } = fakePorts({ settings, publisher });
  TestBed.configureTestingModule({ providers });
  const store = TestBed.inject(SonnailleStore);
  const map = new FakeMap();
  store.publicationActions = { copy: async (text) => void copied.push(text), open: () => undefined };
  await store.attach(map);
  return { store, map, copied, mine };
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
