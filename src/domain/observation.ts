import type { Position } from './bounds';
import type { Species } from './pastoral-zone';
import { distanceMeters, type Track } from './track';

export type Headcount = 'few' | 'dozens' | 'hundreds';

export const HEADCOUNTS: Headcount[] = ['few', 'dozens', 'hundreds'];

/** A flock seen in the field, reported after an outing. No text about dog behaviour, no identity. */
export interface Observation {
  id: string;
  /** ISO date and time of the sighting. */
  observedAt: string;
  position: Position;
  species: Species;
  headcount: Headcount;
  guardDogs: boolean;
}

/** Published settings: how long a sighting stays sharp, and the halo drawn around it per species. */
export interface ObservationSettings {
  validityDays: number;
  haloMeters: Record<Species, number>;
}

const DAY_MS = 86_400_000;

/** Whether the sighting is recent enough to show sharply (3 days by default, see settings). */
export function isRecent(observation: Observation, now: Date, validityDays: number): boolean {
  const age = now.getTime() - Date.parse(observation.observedAt);
  return age >= 0 && age <= validityDays * DAY_MS;
}

/**
 * The point at a distance along the track, and its time when the GPX has timestamps
 * on both sides. Distances beyond the ends stay on the track.
 */
export function pointAtKm(track: Track, km: number): { position: Position; time?: string } {
  const points = track.segments.flat();
  const first = points[0];
  if (!first) throw new Error('Empty track');

  let remaining = Math.max(0, km * 1000);
  for (const segment of track.segments) {
    for (let i = 1; i < segment.length; i++) {
      const a = segment[i - 1]!;
      const b = segment[i]!;
      const length = distanceMeters(a, b);
      if (remaining <= length) {
        const t = length === 0 ? 0 : remaining / length;
        const position = {
          longitude: a.longitude + t * (b.longitude - a.longitude),
          latitude: a.latitude + t * (b.latitude - a.latitude),
        };
        // GPX times are to the second: so is the deduced time.
        const time =
          a.time && b.time
            ? new Date(Math.round((Date.parse(a.time) + t * (Date.parse(b.time) - Date.parse(a.time))) / 1000) * 1000).toISOString()
            : undefined;
        return time ? { position, time } : { position };
      }
      remaining -= length;
    }
  }

  const last = points[points.length - 1]!;
  return { position: { longitude: last.longitude, latitude: last.latitude } };
}
