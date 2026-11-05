import { describe, expect, it } from 'vitest';
import { nearbyObservations } from './nearby-observations';
import type { Observation } from './observation';
import type { Track } from './track';

// Due north from 45.0 to about 45.018 (2 km).
const track: Track = {
  name: 'Sortie',
  segments: [
    [
      { longitude: 5.7, latitude: 45.0 },
      { longitude: 5.7, latitude: 45.017986 },
    ],
  ],
};

const seen = (id: string, longitude: number, latitude: number): Observation => ({
  id,
  observedAt: '2026-07-14T08:00:00Z',
  position: { longitude, latitude },
  species: 'sheep',
  headcount: 'dozens',
  guardDogs: true,
});

describe('nearbyObservations', () => {
  it('finds a sighting whose halo the track goes through, with the km where it is closest', () => {
    // About 236 m east of the km 1 point, halo of 400 m.
    const [near] = nearbyObservations(track, [{ observation: seen('o', 5.703, 45.008993), haloMeters: 400 }]);

    expect(near?.observation.id).toBe('o');
    expect(near?.km).toBeCloseTo(1, 1);
    expect(near?.distanceMeters).toBeCloseTo(236, -1);
  });

  it('ignores a sighting whose halo the track does not reach', () => {
    expect(nearbyObservations(track, [{ observation: seen('far', 5.72, 45.009), haloMeters: 400 }])).toEqual([]);
  });

  it('lists the sightings in the order of the track', () => {
    const found = nearbyObservations(track, [
      { observation: seen('late', 5.7, 45.016), haloMeters: 300 },
      { observation: seen('early', 5.7, 45.002), haloMeters: 300 },
    ]);

    expect(found.map((n) => n.observation.id)).toEqual(['early', 'late']);
  });
});
