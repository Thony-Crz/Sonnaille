import { describe, expect, it } from 'vitest';
import type { BaseMapId } from '../domain/base-map';
import type { Bounds } from '../domain/bounds';
import type { PastoralZone, PastoralZoneDataset } from '../domain/pastoral-zone';
import type { ZoneStatus } from '../domain/zone-status';
import type { MapView, PastoralZoneRepository, ZoneOnMap } from './ports';
import { showPastoralZones, showZonesOn, toggleZoneLayer } from './show-pastoral-zones';

class FakeMapView implements MapView {
  zones: ZoneOnMap[][] = [];
  visibility: Array<[ZoneStatus, boolean]> = [];
  fitTo(_bounds: Bounds): void {}
  showBaseMap(_id: BaseMapId): void {}
  showPastoralZones(zones: ZoneOnMap[]): void {
    this.zones.push(zones);
  }
  showTrack(): void {}
  setZoneLayerVisible(status: ZoneStatus, visible: boolean): void {
    this.visibility.push([status, visible]);
  }
}

const zone = (id: string, guardDogs: boolean | null): PastoralZone => ({
  id,
  name: `Alpage ${id}`,
  quarter: '',
  geometry: [[[[5.7, 45.3], [5.8, 45.3], [5.8, 45.4], [5.7, 45.3]]]],
  presence:
    guardDogs === null
      ? null
      : { start: '2026-06-15', end: '2026-09-30', species: ['sheep'], guardDogs, weekdays: [1, 2, 3, 4, 5, 6, 7] },
});

const dataset: PastoralZoneDataset = {
  zones: [zone('A', true), zone('B', false), zone('C', null)],
  source: 'Map Patou — Réseau Pastoral AuRA',
  requestedDate: '2026-07-15',
  fetchedAt: '2026-07-15T05:00:00.000Z',
};

const repository = (result: PastoralZoneDataset | Error): PastoralZoneRepository => ({
  load: async () => {
    if (result instanceof Error) throw result;
    return result;
  },
});

describe('showPastoralZones', () => {
  it('shows every zone with its status on the given day', async () => {
    const map = new FakeMapView();

    await showPastoralZones(repository(dataset), map, '2026-07-15');

    expect(map.zones).toEqual([
      [
        { zone: dataset.zones[0], status: 'flock-with-dogs' },
        { zone: dataset.zones[1], status: 'flock' },
        { zone: dataset.zones[2], status: 'no-flock' },
      ],
    ]);
  });

  it('returns where the data comes from, to credit it', async () => {
    const result = await showPastoralZones(repository(dataset), new FakeMapView(), '2026-07-15');

    expect(result).toEqual({ available: true, source: dataset.source, fetchedAt: dataset.fetchedAt, zones: dataset.zones });
  });

  it('reports the zones as unavailable when they cannot be loaded', async () => {
    const map = new FakeMapView();

    const result = await showPastoralZones(repository(new Error('offline')), map, '2026-07-15');

    expect(result).toEqual({ available: false });
    expect(map.zones).toEqual([]);
  });
});

describe('toggleZoneLayer', () => {
  it('shows or hides the zones of one status', () => {
    const map = new FakeMapView();

    toggleZoneLayer(map, 'no-flock', false);

    expect(map.visibility).toEqual([['no-flock', false]]);
  });
});

describe('showZonesOn', () => {
  it('shows the zones again with their status on another day', () => {
    const map = new FakeMapView();

    showZonesOn(map, dataset.zones, '2026-11-05');

    expect(map.zones).toEqual([dataset.zones.map((zone) => ({ zone, status: 'no-flock' }))]);
  });
});
