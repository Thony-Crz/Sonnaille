import { parseDay } from '../domain/zone-status';

/** The demo opens on a summer day, when the fictional flocks are there. */
export const DEMO_DAY = '2026-07-15';

export interface AppSettings {
  /** Where the site is served, e.g. "/Sonnaille/". */
  base: string;
  /** ?demo: fictional zones, track and sightings, a sightings "server" in the browser (docs/demo/README.md). */
  demo: boolean;
  /** ?date=YYYY-MM-DD, the day shown at start. */
  date: string | null;
  /**
   * The Sonnaille API (docs/api.md), given at build time, without a trailing slash: pastoral zones
   * from its database (D6) and sightings. Without it, local files and the V0 publication.
   */
  apiUrl?: string;
  /** Personal IGN key for the 1:25,000 map (docs/fonds-de-carte.md), given at build time. */
  scan25Key?: string;
}

/** Settings from the page address and the values given at build time. */
export function readSettings(search: string, base: string, build: { apiUrl?: string; scan25Key?: string }): AppSettings {
  const query = new URLSearchParams(search);
  return {
    base,
    demo: query.has('demo'),
    date: parseDay(query.get('date')),
    apiUrl: build.apiUrl?.replace(/\/+$/, '') || undefined,
    scan25Key: build.scan25Key || undefined,
  };
}

/** Where the pastoral zones come from: the fictional ones in demo mode, the API, or the file of `npm run data`. */
export function zonesUrl({ base, demo, apiUrl }: AppSettings): string {
  if (demo) return `${base}demo/pastoral-zones.geojson`;
  return apiUrl ? `${apiUrl}/api/zones` : `${base}data/pastoral-zones.geojson`;
}
