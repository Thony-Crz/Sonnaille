import type { Position } from '../domain/bounds';
import type { Headcount, NestKind, Observation } from '../domain/observation';
import type { Species } from '../domain/pastoral-zone';
import type { MySightingsStore } from './ports';

// Five decimals: about one metre, more than enough for a flock.
const round = (degrees: number) => Math.round(degrees * 1e5) / 1e5;

export type SightingWhat =
  | { kind: 'flock'; species: Species; headcount: Headcount; guardDogs: boolean }
  | { kind: NestKind };

/** A sighting at a point tapped on the map, on a local day (YYYY-MM-DD) and time (HH:MM). */
export function createObservationAt({
  position,
  date,
  time,
  what,
}: {
  position: Position;
  date: string;
  time: string;
  what: SightingWhat;
}): Observation {
  const observedAt = new Date(`${date}T${time}:00`).toISOString();
  const at = { longitude: round(position.longitude), latitude: round(position.latitude) };
  const base = { id: `obs-${observedAt}-${at.latitude.toFixed(4)}-${at.longitude.toFixed(4)}`, observedAt, position: at };
  if (what.kind === 'flock') {
    // Flocks are stored without a kind, as before nests existed.
    const { species, headcount, guardDogs } = what;
    return { ...base, species, headcount, guardDogs };
  }
  return { ...base, kind: what.kind };
}

/** The sightings kept on this device, the most recent first. */
export function mySightings(store: MySightingsStore): Observation[] {
  return [...store.load()].sort((a, b) => b.observedAt.localeCompare(a.observedAt));
}

/** Keeps a sighting on this device (replacing one with the same id). */
export function saveMySighting(store: MySightingsStore, observation: Observation): void {
  store.save([...store.load().filter((o) => o.id !== observation.id), observation]);
}

export function deleteMySighting(store: MySightingsStore, id: string): void {
  store.save(store.load().filter((o) => o.id !== id));
}
