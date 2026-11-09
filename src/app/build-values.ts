/*
 * Values given at build time: `ng build --define SONNAILLE_SCAN25_KEY="'…'"` (see the CI workflow).
 * Absent when not defined, hence the typeof guards.
 */
declare const SONNAILLE_SCAN25_KEY: string | undefined;
declare const SONNAILLE_SIGHTINGS_API_URL: string | undefined;

export const BUILD_VALUES = {
  scan25Key: typeof SONNAILLE_SCAN25_KEY === 'string' ? SONNAILLE_SCAN25_KEY : '',
  sightingsApiUrl: typeof SONNAILLE_SIGHTINGS_API_URL === 'string' ? SONNAILLE_SIGHTINGS_API_URL : '',
};
