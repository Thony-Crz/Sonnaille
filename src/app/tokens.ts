import { InjectionToken } from '@angular/core';
import type {
  ActivityPreferences,
  AdviceRepository,
  BaseMapPreferences,
  MySightingsStore,
  ObservationRepository,
  ObservationSettingsSource,
  PastoralZoneRepository,
  SightingPublisher,
  TrackReader,
  WelcomePreferences,
} from '../application/ports';
import type { BaseMapId } from '../domain/base-map';
import type { Observation } from '../domain/observation';
import type { MapSurface } from './map-surface';
import type { AppSettings } from './settings';

// One token per port: app.config.ts (the composition root) gives the adapters.
export const APP_SETTINGS = new InjectionToken<AppSettings>('AppSettings');
export const ZONE_REPOSITORY = new InjectionToken<PastoralZoneRepository>('PastoralZoneRepository');
export const ADVICE_REPOSITORY = new InjectionToken<AdviceRepository>('AdviceRepository');
export const OBSERVATION_REPOSITORY = new InjectionToken<ObservationRepository>('ObservationRepository');
export const OBSERVATION_SETTINGS = new InjectionToken<ObservationSettingsSource>('ObservationSettingsSource');
export const MY_SIGHTINGS = new InjectionToken<MySightingsStore>('MySightingsStore');
/** The V1 API, the demo server, or null (V0: publication by hand on GitHub). */
export const SIGHTING_PUBLISHER = new InjectionToken<SightingPublisher | null>('SightingPublisher');
export const BASE_MAP_PREFERENCES = new InjectionToken<BaseMapPreferences>('BaseMapPreferences');
export const ACTIVITY_PREFERENCES = new InjectionToken<ActivityPreferences>('ActivityPreferences');
export const WELCOME_PREFERENCES = new InjectionToken<WelcomePreferences>('WelcomePreferences');
export const TRACK_READER = new InjectionToken<TrackReader>('TrackReader');

/** V0 publication: the text to paste into content/observations.geojson on GitHub, and a sighting as GeoJSON. */
export interface SightingsFormat {
  publicationText(observations: Observation[]): string;
  feature(observation: Observation): string;
  editUrl: string;
}
export const SIGHTINGS_FORMAT = new InjectionToken<SightingsFormat>('SightingsFormat');

/** Demo mode only: forgets what the demo server received. */
export const DEMO_RESET = new InjectionToken<(() => void) | null>('DemoReset');

/** Creates the map in its element (MapLibre in the app, a fake in tests). */
export type MapFactory = (
  host: HTMLElement,
  options: { baseMap: BaseMapId; framePadding: () => number | { top: number; bottom: number; left: number; right: number } },
) => MapSurface;
export const MAP_FACTORY = new InjectionToken<MapFactory>('MapFactory');
