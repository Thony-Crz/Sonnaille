import type { Bounds } from '../../domain/bounds';
import { toGeoJson, type PastoralZonesFeatureCollection } from '../pastoral-zones-geojson';
import { parseMapPatouResponse } from './map-patou-response';

export const MAP_PATOU_API = 'https://mappatous-api.lessem.inrae.fr/api/v1/map/geojson';
const SOURCE = 'Map Patou — Réseau Pastoral AuRA';

export type FetchFn = (url: string, init: RequestInit) => Promise<Response>;

/** One request to the Map Patou API for the planned presences of a day (YYYY-MM-DD). */
export async function fetchMapPatou(date: string, fetchFn: FetchFn): Promise<unknown> {
  const response = await fetchFn(MAP_PATOU_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ date: `${date}T10:00:00.000Z` }),
  });
  if (!response.ok) throw new Error(`Map Patou API answered ${response.status}`);
  return response.json();
}

/** The current day in Paris, as YYYY-MM-DD. */
export function parisDay(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(now);
}

export interface UpdateOptions {
  now: Date;
  /** Day to request; today in Paris by default. */
  date?: string;
  /** The file already published or cached, if any. */
  existing: PastoralZonesFeatureCollection | null;
  fetchFn: FetchFn;
  territory: Bounds;
}

/**
 * Produces the pastoral zones file for a day. The Map Patou API is called at most
 * once per requested day: an existing file for that day is reused (docs/decisions.md, D1).
 */
export async function updatePastoralZones({ now, date, existing, fetchFn, territory }: UpdateOptions) {
  const requestedDate = date ?? parisDay(now);
  if (existing?.metadata.requestedDate === requestedDate) return { fetched: false, geojson: existing };

  const zones = parseMapPatouResponse(await fetchMapPatou(requestedDate, fetchFn), territory);
  const geojson = toGeoJson(zones, { source: SOURCE, requestedDate, fetchedAt: now.toISOString() });
  return { fetched: true, geojson };
}
