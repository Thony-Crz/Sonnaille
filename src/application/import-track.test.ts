import { describe, expect, it } from 'vitest';
import type { Bounds } from '../domain/bounds';
import type { Track } from '../domain/track';
import { importTrack } from './import-track';
import type { MapView, TrackReader } from './ports';

class FakeMapView implements MapView {
  tracks: Track[] = [];
  fits: Bounds[] = [];
  fitTo(bounds: Bounds): void {
    this.fits.push(bounds);
  }
  showBaseMap(): void {}
  showPastoralZones(): void {}
  setZoneLayerVisible(): void {}
  showTrack(track: Track): void {
    this.tracks.push(track);
  }
}

const track: Track = {
  name: 'Sortie',
  segments: [
    [
      { longitude: 5.7, latitude: 45.2 },
      { longitude: 5.7, latitude: 45.21 },
    ],
  ],
};

const reader = (result: Track | Error): TrackReader => ({
  read: () => {
    if (result instanceof Error) throw result;
    return result;
  },
});

describe('importTrack', () => {
  it('shows the track and frames the map on it', () => {
    const map = new FakeMapView();

    const result = importTrack('<gpx/>', 'sortie.gpx', reader(track), map);

    expect(map.tracks).toEqual([track]);
    expect(map.fits).toEqual([{ west: 5.7, south: 45.2, east: 5.7, north: 45.21 }]);
    expect(result).toEqual({ ok: true, track, lengthKm: 1.1 });
  });

  it('reports why a file cannot be read, without touching the map', () => {
    const map = new FakeMapView();

    const result = importTrack('<html/>', 'page.gpx', reader(new Error("Ce fichier n'est pas un GPX.")), map);

    expect(result).toEqual({ ok: false, error: "Ce fichier n'est pas un GPX." });
    expect(map.tracks).toEqual([]);
  });
});
