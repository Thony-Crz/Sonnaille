import { ACTIVITIES, selectAdvice, type Activity, type Advice } from '../domain/advice';
import type { Presence } from '../domain/pastoral-zone';
import type { ZoneStatus } from '../domain/zone-status';
import type { ActivityPreferences, ZoneOnMap } from './ports';

/** Everything the zone sheet shows when a zone is selected on the map. */
export interface ZoneSheet {
  name: string;
  quarter: string;
  status: ZoneStatus;
  presence: Omit<Presence, 'weekdays'> | null;
  activity: Activity;
  advice: Advice[];
  source: string;
  fetchedAt: string;
}

export function buildZoneSheet(
  { zone, status }: ZoneOnMap,
  { activity, advice, source, fetchedAt }: { activity: Activity; advice: Advice[]; source: string; fetchedAt: string },
): ZoneSheet {
  const presence = zone.presence
    ? { start: zone.presence.start, end: zone.presence.end, species: zone.presence.species, guardDogs: zone.presence.guardDogs }
    : null;
  return {
    name: zone.name,
    quarter: zone.quarter,
    status,
    presence,
    activity,
    advice: selectAdvice(advice, { status, activity }),
    source,
    fetchedAt,
  };
}

/** The activity remembered on this device, hiking by default. */
export function initialActivity(preferences: ActivityPreferences): Activity {
  const saved = preferences.load();
  return ACTIVITIES.find((a) => a === saved) ?? 'hiking';
}
