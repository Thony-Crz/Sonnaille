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
  /** V1 sightings API (docs/api.md), given at build time. Without it, the V0 publication. */
  sightingsApiUrl?: string;
  /** Personal IGN key for the 1:25,000 map (docs/fonds-de-carte.md), given at build time. */
  scan25Key?: string;
}

/** Settings from the page address and the values given at build time. */
export function readSettings(
  search: string,
  base: string,
  build: { sightingsApiUrl?: string; scan25Key?: string },
): AppSettings {
  const query = new URLSearchParams(search);
  return {
    base,
    demo: query.has('demo'),
    date: parseDay(query.get('date')),
    sightingsApiUrl: build.sightingsApiUrl || undefined,
    scan25Key: build.scan25Key || undefined,
  };
}
