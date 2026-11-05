// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { readGpx } from './gpx-reader';

// Synthetic files shaped like common exports (no real activity data).
const stravaLike = `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="StravaGPX" version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
 <metadata><time>2026-07-14T06:00:00Z</time></metadata>
 <trk>
  <name>Sortie trail du matin</name>
  <type>trail_running</type>
  <trkseg>
   <trkpt lat="45.2000" lon="5.7000"><ele>1200.4</ele><time>2026-07-14T06:00:00Z</time></trkpt>
   <trkpt lat="45.2010" lon="5.7010"><ele>1210.0</ele><time>2026-07-14T06:01:00Z</time></trkpt>
  </trkseg>
 </trk>
</gpx>`;

const komootLike = `<?xml version='1.0' encoding='UTF-8'?>
<gpx version="1.1" creator="https://www.komoot.de" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>Tour au Moucherotte</name></metadata>
  <trk>
    <name>Tour au Moucherotte</name>
    <trkseg>
      <trkpt lat="45.150000" lon="5.640000"><ele>1500.0</ele></trkpt>
      <trkpt lat="45.155000" lon="5.643000"><ele>1900.0</ele></trkpt>
    </trkseg>
    <trkseg>
      <trkpt lat="45.156000" lon="5.644000"></trkpt>
    </trkseg>
  </trk>
</gpx>`;

const routeOnly = `<?xml version="1.0"?>
<gpx version="1.1" creator="Garmin Connect" xmlns="http://www.topografix.com/GPX/1/1">
  <rte>
    <name>Parcours VTT</name>
    <rtept lat="45.3" lon="5.8"></rtept>
    <rtept lat="45.31" lon="5.81"></rtept>
  </rte>
</gpx>`;

describe('readGpx', () => {
  it('reads a Strava-like track with elevations and times', () => {
    expect(readGpx(stravaLike, 'fallback.gpx')).toEqual({
      name: 'Sortie trail du matin',
      segments: [
        [
          { latitude: 45.2, longitude: 5.7, elevation: 1200.4, time: '2026-07-14T06:00:00Z' },
          { latitude: 45.201, longitude: 5.701, elevation: 1210, time: '2026-07-14T06:01:00Z' },
        ],
      ],
    });
  });

  it('keeps each track segment apart', () => {
    const track = readGpx(komootLike, 'fallback.gpx');

    expect(track.name).toBe('Tour au Moucherotte');
    expect(track.segments.map((s) => s.length)).toEqual([2, 1]);
    expect(track.segments[1]?.[0]).toEqual({ latitude: 45.156, longitude: 5.644 });
  });

  it('reads routes as well as tracks', () => {
    const track = readGpx(routeOnly, 'fallback.gpx');

    expect(track.name).toBe('Parcours VTT');
    expect(track.segments).toEqual([
      [
        { latitude: 45.3, longitude: 5.8 },
        { latitude: 45.31, longitude: 5.81 },
      ],
    ]);
  });

  it('names the track after the file when the GPX has no name', () => {
    const unnamed = routeOnly.replace('<name>Parcours VTT</name>', '');

    expect(readGpx(unnamed, 'ma-sortie.gpx').name).toBe('ma-sortie');
  });

  it('skips points with invalid coordinates', () => {
    const broken = stravaLike.replace('lat="45.2010"', 'lat="north"');

    expect(readGpx(broken, 'f.gpx').segments[0]).toHaveLength(1);
  });

  it('rejects a file that is not GPX', () => {
    expect(() => readGpx('<html><body>Hello</body></html>', 'page.gpx')).toThrow("Ce fichier n'est pas un GPX.");
    expect(() => readGpx('not xml at all <', 'x.gpx')).toThrow("Ce fichier n'est pas un GPX.");
  });

  it('rejects a GPX without any track or route', () => {
    const empty = '<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"><wpt lat="45" lon="5"/></gpx>';

    expect(() => readGpx(empty, 'points.gpx')).toThrow('Ce GPX ne contient ni trace ni itinéraire.');
  });
});
