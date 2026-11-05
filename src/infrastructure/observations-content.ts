import type { ObservationRepository, ObservationSettingsSource } from '../application/ports';
import { HEADCOUNTS, NEST_KINDS, isFlock, type Headcount, type NestKind, type Observation, type ObservationSettings } from '../domain/observation';
import { SPECIES, type Species } from '../domain/pastoral-zone';

/*
 * public/content/observations.geojson: a FeatureCollection of points, one per sighting.
 * Only structured fields are allowed (no free text about dogs, no identity).
 * public/content/observation-settings.json: validity in days and halo radius per species.
 */

const FLOCK_PROPERTIES = ['observedAt', 'kind', 'species', 'headcount', 'guardDogs'];
const NEST_PROPERTIES = ['observedAt', 'kind'];

/** Used when the published settings do not give them (provisional values). */
const DEFAULT_NESTS: ObservationSettings['nests'] = {
  beehives: { validityDays: 90, haloMeters: 50 },
  'wasp-nest': { validityDays: 30, haloMeters: 30 },
  'bee-nest': { validityDays: 30, haloMeters: 30 },
  'hornet-nest': { validityDays: 30, haloMeters: 50 },
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Flocks are written without a kind, as before nests existed; nests carry their kind only. */
export function observationFeature(observation: Observation) {
  const { id, observedAt, position } = observation;
  const properties: Record<string, unknown> = isFlock(observation)
    ? { observedAt, species: observation.species, headcount: observation.headcount, guardDogs: observation.guardDogs }
    : { observedAt, kind: observation.kind };
  return {
    type: 'Feature' as const,
    id,
    geometry: { type: 'Point' as const, coordinates: [position.longitude, position.latitude] },
    properties,
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
    const flock = p.kind === undefined || p.kind === 'flock';
    if (!flock && !NEST_KINDS.includes(p.kind as NestKind)) {
      errors.push(`${at}.properties.kind: unknown`);
      return;
    }
    if (flock) {
      if (!SPECIES.includes(p.species as Species)) errors.push(`${at}.properties.species: unknown`);
      if (!HEADCOUNTS.includes(p.headcount as Headcount)) errors.push(`${at}.properties.headcount: unknown`);
      if (typeof p.guardDogs !== 'boolean') errors.push(`${at}.properties.guardDogs: not a boolean`);
    }
    const allowed = flock ? FLOCK_PROPERTIES : NEST_PROPERTIES;
    for (const key of Object.keys(p)) {
      if (!allowed.includes(key)) errors.push(`${at}.properties: unexpected ${key}`);
    }
  });
  return errors;
}

export function parseObservations(data: unknown): Observation[] {
  const errors = observationsErrors(data);
  if (errors.length > 0) throw new Error(`Invalid observations: ${errors.join('; ')}`);

  type Stored = { id: string; geometry: { coordinates: number[] }; properties: Record<string, unknown> };
  return (data as { features: Stored[] }).features.map(({ id, geometry, properties: p }): Observation => {
    const base = {
      id,
      observedAt: p.observedAt as string,
      position: { longitude: geometry.coordinates[0]!, latitude: geometry.coordinates[1]! },
    };
    if (p.kind !== undefined && p.kind !== 'flock') return { ...base, kind: p.kind as NestKind };
    return { ...base, species: p.species as Species, headcount: p.headcount as Headcount, guardDogs: p.guardDogs as boolean };
  });
}

export function parseObservationSettings(data: unknown): ObservationSettings {
  const valid =
    isObject(data) &&
    typeof data.validityDays === 'number' &&
    data.validityDays > 0 &&
    isObject(data.haloMeters) &&
    SPECIES.every((s) => typeof (data.haloMeters as Record<string, unknown>)[s] === 'number' && ((data.haloMeters as Record<string, number>)[s] ?? 0) > 0);
  if (!valid) throw new Error('Invalid observation settings: needs validityDays > 0 and a positive halo for every species');

  const nests = { ...DEFAULT_NESTS };
  if (isObject(data.nests)) {
    for (const kind of NEST_KINDS) {
      const rule = (data.nests as Record<string, unknown>)[kind];
      if (isObject(rule) && typeof rule.validityDays === 'number' && rule.validityDays > 0 && typeof rule.haloMeters === 'number' && rule.haloMeters > 0) {
        nests[kind] = { validityDays: rule.validityDays, haloMeters: rule.haloMeters };
      }
    }
  }
  return { validityDays: data.validityDays as number, haloMeters: data.haloMeters as Record<Species, number>, nests };
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
