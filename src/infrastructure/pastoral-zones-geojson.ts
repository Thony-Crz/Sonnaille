import { SPECIES, type PastoralZone, type Presence, type Species } from '../domain/pastoral-zone';

/**
 * The file Sonnaille publishes with the site (`data/pastoral-zones.geojson`):
 * a GeoJSON FeatureCollection of MultiPolygons, plus a `metadata` member
 * telling where the data comes from and for which day it was requested.
 */
export interface ZonesMetadata {
  source: string;
  requestedDate: string;
  fetchedAt: string;
}

export interface ZoneFeature {
  type: 'Feature';
  id: string;
  geometry: { type: 'MultiPolygon'; coordinates: PastoralZone['geometry'] };
  properties: { name: string; quarter: string; presence: Presence | null };
}

export interface PastoralZonesFeatureCollection {
  type: 'FeatureCollection';
  metadata: ZonesMetadata;
  features: ZoneFeature[];
}

export function toGeoJson(zones: PastoralZone[], metadata: ZonesMetadata): PastoralZonesFeatureCollection {
  return {
    type: 'FeatureCollection',
    metadata,
    features: zones.map(({ id, name, quarter, geometry, presence }) => ({
      type: 'Feature',
      id,
      geometry: { type: 'MultiPolygon', coordinates: geometry },
      properties: { name, quarter, presence },
    })),
  };
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isText = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

function isPosition(value: unknown): boolean {
  if (!Array.isArray(value) || value.length < 2) return false;
  const [longitude, latitude] = value;
  return (
    typeof longitude === 'number' && typeof latitude === 'number' &&
    longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90
  );
}

function isMultiPolygon(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (polygon) =>
        Array.isArray(polygon) &&
        polygon.every((ring) => Array.isArray(ring) && ring.length >= 4 && ring.every(isPosition)),
    )
  );
}

function presenceErrors(presence: unknown, at: string): string[] {
  if (presence === null) return [];
  if (!isObject(presence)) return [`${at}: not an object or null`];

  const errors: string[] = [];
  for (const key of ['start', 'end'] as const) {
    if (typeof presence[key] !== 'string' || !DAY.test(presence[key])) errors.push(`${at}.${key}: not a YYYY-MM-DD date`);
  }
  if (errors.length === 0 && (presence.end as string) < (presence.start as string)) errors.push(`${at}: ends before it starts`);

  if (!Array.isArray(presence.species)) errors.push(`${at}.species: not a list`);
  else {
    for (const species of presence.species) {
      if (!SPECIES.includes(species as Species)) errors.push(`${at}.species: unknown species ${String(species)}`);
    }
  }

  if (typeof presence.guardDogs !== 'boolean') errors.push(`${at}.guardDogs: not a boolean`);

  const weekdays = presence.weekdays;
  if (!Array.isArray(weekdays) || !weekdays.every((d) => Number.isInteger(d) && d >= 1 && d <= 7)) {
    errors.push(`${at}.weekdays: not weekdays 1 to 7`);
  }
  return errors;
}

/** Lists everything wrong with the file; an empty list means it is valid. */
export function validatePastoralZonesGeoJson(data: unknown): string[] {
  if (!isObject(data) || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    return ['not a FeatureCollection'];
  }

  const errors: string[] = [];
  const { metadata } = data;
  if (!isObject(metadata)) errors.push('metadata: missing');
  else {
    if (!isText(metadata.source)) errors.push('metadata.source: missing');
    if (typeof metadata.requestedDate !== 'string' || !DAY.test(metadata.requestedDate)) {
      errors.push('metadata.requestedDate: not a YYYY-MM-DD date');
    }
    if (!isText(metadata.fetchedAt) || Number.isNaN(Date.parse(metadata.fetchedAt))) {
      errors.push('metadata.fetchedAt: not a date and time');
    }
  }

  const ids = new Set<string>();
  data.features.forEach((feature, index) => {
    const at = `features[${index}]`;
    if (!isObject(feature) || feature.type !== 'Feature') {
      errors.push(`${at}: not a Feature`);
      return;
    }

    if (!isText(feature.id)) errors.push(`${at}.id: missing`);
    else if (ids.has(feature.id)) errors.push(`${at}.id: duplicated`);
    else ids.add(feature.id);

    const { geometry } = feature;
    if (!isObject(geometry) || geometry.type !== 'MultiPolygon') errors.push(`${at}.geometry: not a MultiPolygon`);
    else if (!isMultiPolygon(geometry.coordinates)) errors.push(`${at}.geometry: invalid coordinates`);

    const { properties } = feature;
    if (!isObject(properties)) {
      errors.push(`${at}.properties: missing`);
      return;
    }
    if (!isText(properties.name)) errors.push(`${at}.properties.name: missing`);
    if (typeof properties.quarter !== 'string') errors.push(`${at}.properties.quarter: missing`);
    errors.push(...presenceErrors(properties.presence, `${at}.properties.presence`));
  });

  return errors;
}

/** Reads a published file, refusing anything that does not follow the format. */
export function fromGeoJson(data: unknown): { zones: PastoralZone[]; metadata: ZonesMetadata } {
  const errors = validatePastoralZonesGeoJson(data);
  if (errors.length > 0) throw new Error(`Invalid pastoral zones GeoJSON: ${errors.join('; ')}`);

  const collection = data as PastoralZonesFeatureCollection;
  return {
    metadata: collection.metadata,
    zones: collection.features.map(({ id, geometry, properties }) => ({
      id,
      name: properties.name,
      quarter: properties.quarter,
      geometry: geometry.coordinates,
      presence: properties.presence,
    })),
  };
}
