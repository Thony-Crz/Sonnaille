/** GeoJSON-like MultiPolygon coordinates: [polygon][ring][point][longitude, latitude]. */
export type MultiPolygon = number[][][][];

export type Species = 'sheep' | 'cattle' | 'goats' | 'horses' | 'mixed';

/** A planned flock presence. Dates are ISO days (YYYY-MM-DD); weekdays are 1 (Monday) to 7 (Sunday). */
export interface Presence {
  start: string;
  end: string;
  species: Species[];
  guardDogs: boolean;
  weekdays: number[];
}

/** A pastoral quarter: an area where flocks graze, with its planned presence if any. */
export interface PastoralZone {
  id: string;
  name: string;
  quarter: string;
  geometry: MultiPolygon;
  presence: Presence | null;
}

/** A set of zones as published, with who produced it and when. */
export interface PastoralZoneDataset {
  zones: PastoralZone[];
  source: string;
  requestedDate: string;
  fetchedAt: string;
}

export const SPECIES: Species[] = ['sheep', 'cattle', 'goats', 'horses', 'mixed'];

/** ISO weekday of a YYYY-MM-DD date: 1 (Monday) to 7 (Sunday). */
function weekdayOf(date: string): number {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Whether a flock is planned in the zone on that day (YYYY-MM-DD). */
export function isPresentOn({ presence }: PastoralZone, date: string): boolean {
  if (!presence) return false;
  return presence.start <= date && date <= presence.end && presence.weekdays.includes(weekdayOf(date));
}
