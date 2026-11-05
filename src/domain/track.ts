import { boundsOf, type Bounds, type Position } from './bounds';

export interface TrackPoint extends Position {
  elevation?: number;
  /** ISO date and time, when the GPX has it. */
  time?: string;
}

/** A GPX track or route: one or more segments of points. Never leaves the device. */
export interface Track {
  name: string;
  segments: TrackPoint[][];
}

const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance between two positions (haversine formula). */
export function distanceMeters(a: Position, b: Position): number {
  const dLatitude = toRadians(b.latitude - a.latitude);
  const dLongitude = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLongitude / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Length of the track, segment by segment (gaps between segments are not counted). */
export function trackLengthMeters(track: Track): number {
  return track.segments.reduce(
    (total, segment) => total + segment.slice(1).reduce((sum, point, i) => sum + distanceMeters(segment[i]!, point), 0),
    0,
  );
}

export function trackBounds(track: Track): Bounds | undefined {
  return boundsOf(track.segments.flat().map((p) => [p.longitude, p.latitude]));
}

export interface TrackSample {
  position: Position;
  distance: number;
  /** Whether the previous sample belongs to the same segment (no gap in between). */
  continues: boolean;
}

/** Points along the track at most `step` meters apart, with the distance from the start. */
export function sampleTrack(track: Track, step: number): TrackSample[] {
  const samples: TrackSample[] = [];
  let distance = 0;
  for (const segment of track.segments) {
    segment.forEach((point, index) => {
      if (index === 0) {
        samples.push({ position: point, distance, continues: false });
        return;
      }
      const previous = segment[index - 1]!;
      const length = distanceMeters(previous, point);
      const parts = Math.max(1, Math.ceil(length / step));
      for (let k = 1; k <= parts; k++) {
        const t = k / parts;
        samples.push({
          position: {
            longitude: previous.longitude + t * (point.longitude - previous.longitude),
            latitude: previous.latitude + t * (point.latitude - previous.latitude),
          },
          distance: distance + t * length,
          continues: true,
        });
      }
      distance += length;
    });
  }
  return samples;
}
