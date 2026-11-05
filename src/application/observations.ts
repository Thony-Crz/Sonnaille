import { isRecent, pointAtKm, type Headcount, type Observation } from '../domain/observation';
import type { Species } from '../domain/pastoral-zone';
import type { Track } from '../domain/track';
import type { MapView, ObservationRepository, ObservationSettingsSource } from './ports';

/**
 * A sighting reported after an outing, at a km of the GPX track. Its time comes from
 * the GPX timestamps, or is noon on the outing day when the GPX has none.
 */
export function createObservation({
  track,
  km,
  species,
  headcount,
  guardDogs,
  outingDate,
}: {
  track: Track;
  km: number;
  species: Species;
  headcount: Headcount;
  guardDogs: boolean;
  outingDate: string;
}): { observation: Observation; timeFromTrack: boolean } {
  const point = pointAtKm(track, km);
  const time = point.time;
  // Five decimals: about one metre, more than enough for a flock.
  const round = (degrees: number) => Math.round(degrees * 1e5) / 1e5;
  const position = { longitude: round(point.position.longitude), latitude: round(point.position.latitude) };
  const observedAt = time ?? new Date(`${outingDate}T12:00:00`).toISOString();
  const id = `obs-${observedAt}-${position.latitude.toFixed(4)}-${position.longitude.toFixed(4)}`;
  return { observation: { id, observedAt, position, species, headcount, guardDogs }, timeFromTrack: time !== undefined };
}

/** Shows the published sightings: sharp while recent, faded afterwards, each with its species halo. */
export async function showObservations(
  repository: ObservationRepository,
  settingsSource: ObservationSettingsSource,
  map: MapView,
  now: Date,
): Promise<{ available: false } | { available: true; recent: number; total: number }> {
  let observations;
  let settings;
  try {
    [observations, settings] = await Promise.all([repository.load(), settingsSource.load()]);
  } catch {
    return { available: false };
  }

  const items = observations.map((observation) => ({
    observation,
    recent: isRecent(observation, now, settings.validityDays),
    haloMeters: settings.haloMeters[observation.species],
  }));
  map.showObservations(items);
  return { available: true, recent: items.filter((i) => i.recent).length, total: items.length };
}
