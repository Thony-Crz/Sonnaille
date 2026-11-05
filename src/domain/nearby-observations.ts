import type { Observation } from './observation';
import { distanceMeters, sampleTrack, type Track } from './track';

export interface NearbyObservation {
  observation: Observation;
  /** Km along the track where it is closest to the sighting. */
  km: number;
  distanceMeters: number;
}

/** Sightings whose halo the track goes through, in the order of the track. */
export function nearbyObservations(
  track: Track,
  items: Array<{ observation: Observation; haloMeters: number }>,
  stepMeters = 10,
): NearbyObservation[] {
  const samples = sampleTrack(track, stepMeters);

  return items
    .flatMap(({ observation, haloMeters }) => {
      let closest = { distance: Infinity, along: 0 };
      for (const sample of samples) {
        const distance = distanceMeters(sample.position, observation.position);
        if (distance < closest.distance) closest = { distance, along: sample.distance };
      }
      return closest.distance <= haloMeters
        ? [{ observation, km: Math.round(closest.along / 100) / 10, distanceMeters: Math.round(closest.distance) }]
        : [];
    })
    .sort((a, b) => a.km - b.km);
}
