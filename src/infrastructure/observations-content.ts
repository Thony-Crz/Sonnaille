import type { ObservationRepository, ObservationSettingsSource } from '../application/ports';
import { HEADCOUNTS, type Headcount, type Observation, type ObservationSettings } from '../domain/observation';
import { SPECIES, type Species } from '../domain/pastoral-zone';

/*
 * public/content/observations.geojson: a FeatureCollection of points, one per sighting.
 * Only structured fields are allowed (no free text about dogs, no identity).
 * public/content/observation-settings.json: validity in days and halo radius per species.
 */

const PROPERTIES = ['observedAt', 'species', 'headcount', 'guardDogs'];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function observationFeature({ id, observedAt, position, species, headcount, guardDogs }: Observation) {
  return {
    type: 'Feature' as const,
    id,
    geometry: { type: 'Point' as const, coordinates: [position.longitude, position.latitude] },
    properties: { observedAt, species, headcount, guardDogs },
  };
}

export function observationsErrors(data: unknown): string[] {
  if (!isObject(data) || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) return ['not a FeatureCollection'];

  const errors: string[] = [];
  data.features.forEach((feature, index) => {
    const at = `features[${index}]`;
    if (!isObject(feature)) {
      errors.push(`${at}: not a Feature`);
      return;
    }
    if (typeof feature.id !== 'string' || feature.id === '') errors.push(`${at}.id: missing`);

    const geometry = feature.geometry;
    const coordinates = isObject(geometry) ? geometry.coordinates : undefined;
    if (!isObject(geometry) || geometry.type !== 'Point') errors.push(`${at}.geometry: not a Point`);
    else if (
      !Array.isArray(coordinates) ||
      typeof coordinates[0] !== 'number' ||
      typeof coordinates[1] !== 'number' ||
      Math.abs(coordinates[0]) > 180 ||
      Math.abs(coordinates[1]) > 90
    ) {
      errors.push(`${at}.geometry: invalid coordinates`);
    }

    const p = feature.properties;
    if (!isObject(p)) {
      errors.push(`${at}.properties: missing`);
      return;
    }
    if (typeof p.observedAt !== 'string' || Number.isNaN(Date.parse(p.observedAt))) {
      errors.push(`${at}.properties.observedAt: not a date and time`);
    }
    if (!SPECIES.includes(p.species as Species)) errors.push(`${at}.properties.species: unknown`);
    if (!HEADCOUNTS.includes(p.headcount as Headcount)) errors.push(`${at}.properties.headcount: unknown`);
    if (typeof p.guardDogs !== 'boolean') errors.push(`${at}.properties.guardDogs: not a boolean`);
    for (const key of Object.keys(p)) {
      if (!PROPERTIES.includes(key)) errors.push(`${at}.properties: unexpected ${key}`);
    }
  });
  return errors;
}

export function parseObservations(data: unknown): Observation[] {
  const errors = observationsErrors(data);
  if (errors.length > 0) throw new Error(`Invalid observations: ${errors.join('; ')}`);

  return (data as { features: Array<ReturnType<typeof observationFeature>> }).features.map(({ id, geometry, properties }) => ({
    id,
    observedAt: properties.observedAt,
    position: { longitude: geometry.coordinates[0]!, latitude: geometry.coordinates[1]! },
    species: properties.species,
    headcount: properties.headcount,
    guardDogs: properties.guardDogs,
  }));
}

export function parseObservationSettings(data: unknown): ObservationSettings {
  const valid =
    isObject(data) &&
    typeof data.validityDays === 'number' &&
    data.validityDays > 0 &&
    isObject(data.haloMeters) &&
    SPECIES.every((s) => typeof (data.haloMeters as Record<string, unknown>)[s] === 'number' && ((data.haloMeters as Record<string, number>)[s] ?? 0) > 0);
  if (!valid) throw new Error('Invalid observation settings: needs validityDays > 0 and a positive halo for every species');
  return { validityDays: data.validityDays as number, haloMeters: data.haloMeters as Record<Species, number> };
}

async function fetchJson(url: string, fetchFn: (url: string) => Promise<Response>, what: string): Promise<unknown> {
  const response = await fetchFn(url);
  if (!response.ok) throw new Error(`${what} not available (${response.status})`);
  return response.json();
}

export class HttpObservationRepository implements ObservationRepository {
  constructor(
    private readonly url: string,
    private readonly fetchFn: (url: string) => Promise<Response>,
  ) {}

  async load(): Promise<Observation[]> {
    return parseObservations(await fetchJson(this.url, this.fetchFn, 'Observations'));
  }
}

export class HttpObservationSettings implements ObservationSettingsSource {
  constructor(
    private readonly url: string,
    private readonly fetchFn: (url: string) => Promise<Response>,
  ) {}

  async load(): Promise<ObservationSettings> {
    return parseObservationSettings(await fetchJson(this.url, this.fetchFn, 'Observation settings'));
  }
}
