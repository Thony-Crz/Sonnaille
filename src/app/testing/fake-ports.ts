import type { Provider } from '@angular/core';
import type { SightingPublisher } from '../../application/ports';
import type { Observation } from '../../domain/observation';
import type { PastoralZone } from '../../domain/pastoral-zone';
import type { Track } from '../../domain/track';
import type { AppSettings } from '../settings';
import {
  ACTIVITY_PREFERENCES,
  ADVICE_REPOSITORY,
  APP_SETTINGS,
  BASE_MAP_PREFERENCES,
  DEMO_RESET,
  MY_SIGHTINGS,
  OBSERVATION_REPOSITORY,
  OBSERVATION_SETTINGS,
  SIGHTING_PUBLISHER,
  SIGHTINGS_FORMAT,
  TRACK_READER,
  WELCOME_PREFERENCES,
  ZONE_REPOSITORY,
} from '../tokens';

export const fakeZone: PastoralZone = {
  id: 'Z1',
  name: 'Alpage du Serre',
  quarter: 'Quartier haut',
  geometry: [[[[5.47, 44.96], [5.49, 44.96], [5.49, 44.98], [5.47, 44.98], [5.47, 44.96]]]],
  presence: { start: '2026-06-15', end: '2026-09-30', species: ['sheep'], guardDogs: true, weekdays: [1, 2, 3, 4, 5, 6, 7] },
};

export const fakeTrack: Track = {
  name: 'Traversée',
  segments: [[{ longitude: 5.48, latitude: 44.95 }, { longitude: 5.48, latitude: 44.99 }]],
};

const memoryValue = <T>(initial: T | null = null) => {
  let value = initial;
  return { load: () => value, save: (v: T) => void (value = v) };
};

/** Every port with an in-memory fake: one zone, no advice, the sightings kept in `mine()`. */
export function fakePorts({
  settings = {},
  publisher = null,
  welcomeSeen = true,
}: { settings?: Partial<AppSettings>; publisher?: SightingPublisher | null; welcomeSeen?: boolean } = {}) {
  let mine: Observation[] = [];
  const providers: Provider[] = [
    { provide: APP_SETTINGS, useValue: { base: '/Sonnaille/', demo: false, date: '2026-07-15', ...settings } },
    {
      provide: ZONE_REPOSITORY,
      useValue: { load: async () => ({ zones: [fakeZone], source: 'Map Patou', requestedDate: '2026-07-15', fetchedAt: '2026-07-15T05:00:00Z' }) },
    },
    { provide: ADVICE_REPOSITORY, useValue: { load: async () => [] } },
    { provide: OBSERVATION_REPOSITORY, useValue: { load: async () => [] } },
    {
      provide: OBSERVATION_SETTINGS,
      useValue: {
        load: async () => ({
          validityDays: 3,
          haloMeters: { sheep: 300, cattle: 300, goats: 300, horses: 300, donkeys: 300, mixed: 300 },
          nests: {
            beehives: { validityDays: 90, haloMeters: 50 },
            'wasp-nest': { validityDays: 30, haloMeters: 30 },
            'bee-nest': { validityDays: 30, haloMeters: 30 },
            'hornet-nest': { validityDays: 30, haloMeters: 50 },
          },
        }),
      },
    },
    { provide: MY_SIGHTINGS, useValue: { load: () => mine, save: (o: Observation[]) => void (mine = o) } },
    { provide: SIGHTING_PUBLISHER, useValue: publisher },
    { provide: BASE_MAP_PREFERENCES, useValue: memoryValue() },
    { provide: ACTIVITY_PREFERENCES, useValue: memoryValue() },
    { provide: WELCOME_PREFERENCES, useValue: memoryValue(welcomeSeen ? 'seen' : null) },
    { provide: TRACK_READER, useValue: { read: () => fakeTrack } },
    {
      provide: SIGHTINGS_FORMAT,
      useValue: { publicationText: (o: Observation[]) => `${o.length} features`, feature: () => '{}', editUrl: 'https://github.com/edit' },
    },
    { provide: DEMO_RESET, useValue: null },
  ];
  return { providers, mine: () => mine };
}
