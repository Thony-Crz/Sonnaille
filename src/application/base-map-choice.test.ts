import { describe, expect, it } from 'vitest';
import type { BaseMapId } from '../domain/base-map';
import type { Bounds } from '../domain/bounds';
import { chooseBaseMap, initialBaseMap } from './base-map-choice';
import type { BaseMapPreferences, MapView } from './ports';

class FakeMapView implements MapView {
  shown: BaseMapId[] = [];
  fitTo(_bounds: Bounds): void {}
  showPastoralZones(): void {}
  setZoneLayerVisible(): void {}
  showObservations(): void {}
  showTrack(): void {}
  showBaseMap(id: BaseMapId): void {
    this.shown.push(id);
  }
}

class InMemoryPreferences implements BaseMapPreferences {
  constructor(public saved: string | null = null) {}
  load(): string | null {
    return this.saved;
  }
  save(id: BaseMapId): void {
    this.saved = id;
  }
}

describe('initialBaseMap', () => {
  it('uses the saved base map', () => {
    expect(initialBaseMap(new InMemoryPreferences('ign-aerial'))).toBe('ign-aerial');
  });

  it('uses IGN Plan on a first visit', () => {
    expect(initialBaseMap(new InMemoryPreferences(null))).toBe('ign-plan');
  });

  it('uses IGN Plan when the saved value is no longer valid', () => {
    expect(initialBaseMap(new InMemoryPreferences('old-value'))).toBe('ign-plan');
  });
});

describe('chooseBaseMap', () => {
  it('shows the chosen base map and remembers it', () => {
    const map = new FakeMapView();
    const preferences = new InMemoryPreferences();

    chooseBaseMap(map, preferences, 'osm');

    expect(map.shown).toEqual(['osm']);
    expect(preferences.saved).toBe('osm');
  });
});
