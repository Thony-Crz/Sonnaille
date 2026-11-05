import { selectAdvice, type Activity, type Advice } from '../domain/advice';
import type { Position } from '../domain/bounds';
import { detectCrossings } from '../domain/crossing';
import type { PastoralZone } from '../domain/pastoral-zone';
import { trackLengthMeters, type Track } from '../domain/track';
import { ZONE_STATUSES, zoneStatus, type ZoneStatus } from '../domain/zone-status';

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
  /** The most cautious status met along the track, or null if no zone is crossed. */
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
  marginMeters = DEFAULT_MARGIN_METERS,
}: {
  track: Track;
  zones: PastoralZone[];
  date: string;
  activity: Activity;
  advice: Advice[];
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

  const mostCautious = ZONE_STATUSES.find((status) => crossings.some((c) => c.status === status)) ?? null;
  return {
    name: track.name,
    date,
    activity,
    lengthKm: kilometers(trackLengthMeters(track)),
    crossings,
    mostCautious,
    advice: mostCautious ? selectAdvice(advice, { status: mostCautious, activity }) : [],
  };
}
