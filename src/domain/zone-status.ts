import { isPresentOn, type PastoralZone } from './pastoral-zone';

/** What a hiker should expect in a zone on a given day. */
export type ZoneStatus = 'flock-with-dogs' | 'flock' | 'no-flock';

/** From the most to the least cautious. */
export const ZONE_STATUSES: ZoneStatus[] = ['flock-with-dogs', 'flock', 'no-flock'];

export function zoneStatus(zone: PastoralZone, date: string): ZoneStatus {
  if (!isPresentOn(zone, date)) return 'no-flock';
  return zone.presence?.guardDogs ? 'flock-with-dogs' : 'flock';
}

/** A YYYY-MM-DD day that exists in the calendar, or null. */
export function parseDay(text: string | null): string | null {
  if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(text) ? text : null;
}

/** The local calendar day of a date, as YYYY-MM-DD. */
export function dayOf(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
