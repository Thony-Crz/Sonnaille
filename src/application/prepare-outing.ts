import { selectAdvice, type Activity, type Advice } from '../domain/advice';
import type { Position } from '../domain/bounds';
import { detectCrossings } from '../domain/crossing';
import { nearbyObservations, type NearbyObservation } from '../domain/nearby-observations';
import type { PastoralZone } from '../domain/pastoral-zone';
import { trackLengthMeters, type Track } from '../domain/track';
import { ZONE_STATUSES, zoneStatus, type ZoneStatus } from '../domain/zone-status';
import type { ObservationOnMap } from './ports';

/** How close to a zone counts as crossing it. To be refined with shepherds and users. */
export const DEFAULT_MARGIN_METERS = 50;

export interface CrossingReport {
  zone: PastoralZone;
  status: ZoneStatus;
  entry: Position;
  entryKm: number;
  insideKm: number;
}

/** What the "Votre sortie" panel shows after a GPX import. */
export interface OutingReport {
  name: string;
  date: string;
  activity: Activity;
  lengthKm: number;
  crossings: CrossingReport[];
  /** Flocks seen recently near the track, in the order of the track. */
  sightings: NearbyObservation[];
  /** The most cautious status met along the track (zones and sightings), or null if none. */
  mostCautious: ZoneStatus | null;
  advice: Advice[];
}

const kilometers = (meters: number) => Math.round(meters / 100) / 10;

/** Checks the track against the pastoral zones on the outing day and picks the advice. */
export function prepareOuting({
  track,
  zones,
  date,
  activity,
  advice,
  sightings = [],
  marginMeters = DEFAULT_MARGIN_METERS,
}: {
  track: Track;
  zones: PastoralZone[];
  date: string;
  activity: Activity;
  advice: Advice[];
  /** Published sightings; only the recent ones count. */
  sightings?: ObservationOnMap[];
  marginMeters?: number;
}): OutingReport {
  const crossings = detectCrossings(
    track,
    zones.map((zone) => ({ zone, status: zoneStatus(zone, date) })),
    { marginMeters },
  ).map(({ zone, status, entry, entryDistanceMeters, insideMeters }) => ({
    zone,
    status,
    entry,
    entryKm: kilometers(entryDistanceMeters),
    insideKm: kilometers(insideMeters),
  }));

  const nearby = nearbyObservations(track, sightings.filter((s) => s.recent));
  // A recent sighting is as telling as a planned flock: with dogs, the strongest caution.
  const statuses = [
    ...crossings.map((c) => c.status),
    ...nearby.map((n): ZoneStatus => (n.observation.guardDogs ? 'flock-with-dogs' : 'flock')),
  ];
  const mostCautious = ZONE_STATUSES.find((status) => statuses.includes(status)) ?? null;
  return {
    name: track.name,
    date,
    activity,
    lengthKm: kilometers(trackLengthMeters(track)),
    crossings,
    sightings: nearby,
    mostCautious,
    advice: mostCautious ? selectAdvice(advice, { status: mostCautious, activity }) : [],
  };
}
