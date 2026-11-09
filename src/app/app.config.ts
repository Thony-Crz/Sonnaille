import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { setWorkerUrl } from 'maplibre-gl';
import { HttpAdviceRepository } from '../infrastructure/advice-content';
import { DemoSightingsServer } from '../infrastructure/demo-sightings-server';
import { readGpx } from '../infrastructure/gpx-reader';
import { HttpPastoralZoneRepository } from '../infrastructure/http-pastoral-zone-repository';
import { LocalStorageActivityPreferences } from '../infrastructure/local-storage-activity-preferences';
import { LocalStorageBaseMapPreferences } from '../infrastructure/local-storage-base-map-preferences';
import { LocalStorageSightings, publicationText } from '../infrastructure/local-storage-sightings';
import { LocalStorageValue } from '../infrastructure/local-storage-value';
import { HttpObservationRepository, HttpObservationSettings, observationFeature } from '../infrastructure/observations-content';
import { HttpSightingPublisher, MergedObservationRepository } from '../infrastructure/sightings-api';
import { createBaseMapStyles } from '../ui/base-map-styles';
import { MapLibreMapView } from '../ui/maplibre-map-view';
import { BUILD_VALUES } from './build-values';
import { readSettings } from './settings';
import {
  ACTIVITY_PREFERENCES,
  ADVICE_REPOSITORY,
  APP_SETTINGS,
  BASE_MAP_PREFERENCES,
  DEMO_RESET,
  MAP_FACTORY,
  MY_SIGHTINGS,
  OBSERVATION_REPOSITORY,
  OBSERVATION_SETTINGS,
  SIGHTING_PUBLISHER,
  SIGHTINGS_FORMAT,
  TRACK_READER,
  WELCOME_PREFERENCES,
  ZONE_REPOSITORY,
  type MapFactory,
} from './tokens';

/*
 * Composition root of the Angular front: the adapters (src/infrastructure) behind each port.
 * The only file of src/app allowed to import the infrastructure (tests/architecture).
 */
const settings = readSettings(window.location.search, new URL(document.baseURI).pathname, BUILD_VALUES);
const { base, demo, sightingsApiUrl } = settings;
const storage = () => window.localStorage;
const get = (url: string) => fetch(url);
// Demo mode: a sightings "server" living in the browser (docs/demo/README.md).
const demoServer = demo ? new DemoSightingsServer(storage) : null;
const published = new HttpObservationRepository(`${base}${demo ? 'demo' : 'content'}/observations.geojson`, get);
const apiUrl = sightingsApiUrl?.replace(/\/+$/, '');
// The MapLibre worker is copied next to the app (angular.json, assets).
setWorkerUrl(`${base}maplibre/maplibre-gl-worker.mjs`);
const mapStyles = createBaseMapStyles({ scan25Key: settings.scan25Key });

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: APP_SETTINGS, useValue: settings },
    { provide: ZONE_REPOSITORY, useValue: new HttpPastoralZoneRepository(`${base}${demo ? 'demo' : 'data'}/pastoral-zones.geojson`, get) },
    { provide: ADVICE_REPOSITORY, useValue: new HttpAdviceRepository(`${base}content/advice.json`, get) },
    {
      provide: OBSERVATION_REPOSITORY,
      useValue: demoServer
        ? new MergedObservationRepository([published, demoServer])
        : apiUrl
          ? new MergedObservationRepository([published, new HttpObservationRepository(`${apiUrl}/api/sightings`, get)])
          : published,
    },
    { provide: OBSERVATION_SETTINGS, useValue: new HttpObservationSettings(`${base}content/observation-settings.json`, get) },
    // In demo mode, the user's sightings are kept apart from their real ones.
    { provide: MY_SIGHTINGS, useValue: new LocalStorageSightings(storage, demo ? 'sonnaille.demo.mySightings' : undefined) },
    {
      provide: SIGHTING_PUBLISHER,
      useValue: demoServer ?? (apiUrl ? new HttpSightingPublisher(apiUrl, (url, init) => fetch(url, init)) : null),
    },
    { provide: BASE_MAP_PREFERENCES, useValue: new LocalStorageBaseMapPreferences(storage) },
    { provide: ACTIVITY_PREFERENCES, useValue: new LocalStorageActivityPreferences(storage) },
    { provide: WELCOME_PREFERENCES, useValue: new LocalStorageValue<'seen'>('sonnaille.welcome', storage) },
    { provide: TRACK_READER, useValue: { read: readGpx } },
    {
      provide: SIGHTINGS_FORMAT,
      useValue: {
        publicationText,
        feature: (observation: Parameters<typeof observationFeature>[0]) => JSON.stringify(observationFeature(observation), null, 2),
        // V0 publication: only the repository owner can commit this file.
        editUrl: 'https://github.com/Thony-Crz/Sonnaille/edit/main/public/content/observations.geojson',
      },
    },
    {
      provide: MAP_FACTORY,
      useValue: ((host, { baseMap, framePadding }) =>
        new MapLibreMapView(host, baseMap, { framePadding, styles: mapStyles })) satisfies MapFactory,
    },
    { provide: DEMO_RESET, useValue: demoServer ? () => demoServer.reset() : null },
  ],
};
