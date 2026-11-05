import { describe, expect, it } from 'vitest';
import type { Bounds } from '../domain/bounds';
import { V0_TERRITORY } from '../domain/territory';
import type { MapView } from './ports';
import { showTerritory } from './show-territory';

class FakeMapView implements MapView {
  fits: Bounds[] = [];
  fitTo(bounds: Bounds): void {
    this.fits.push(bounds);
  }
  showPastoralZones(): void {}
  setZoneLayerVisible(): void {}
  showTrack(): void {}
  showBaseMap(): void {}
}

describe('showTerritory', () => {
  it('frames the map on the V0 territory by default', () => {
    const map = new FakeMapView();

    showTerritory(map);

    expect(map.fits).toEqual([V0_TERRITORY]);
  });

  it('frames the map on the requested territory', () => {
    const map = new FakeMapView();
    const other: Bounds = { west: 6, south: 45, east: 7, north: 46 };

    showTerritory(map, other);

    expect(map.fits).toEqual([other]);
  });
});
