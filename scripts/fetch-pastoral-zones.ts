// Builds public/data/pastoral-zones.geojson from Map Patou (`npm run data`).
// The file is never committed (docs/decisions.md, D1). The API is called at most
// once per requested day: an existing file for that day is reused.
// MAP_PATOU_DATE=YYYY-MM-DD requests another day (e.g. a summer day while developing).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { V0_TERRITORY } from '../src/domain/territory';
import { updatePastoralZones } from '../src/infrastructure/map-patou/update-pastoral-zones';
import {
  validatePastoralZonesGeoJson,
  type PastoralZonesFeatureCollection,
} from '../src/infrastructure/pastoral-zones-geojson';

const OUTPUT = join(import.meta.dirname, '..', 'public', 'data', 'pastoral-zones.geojson');

async function readExisting(): Promise<PastoralZonesFeatureCollection | null> {
  try {
    const data: unknown = JSON.parse(await readFile(OUTPUT, 'utf8'));
    return validatePastoralZonesGeoJson(data).length === 0 ? (data as PastoralZonesFeatureCollection) : null;
  } catch {
    return null;
  }
}

/** Error message and its network cause (ECONNRESET, timeout…), never the data. */
function describe(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause as { code?: string; message?: string } | undefined;
  return cause ? `${error.message} (${cause.code ?? cause.message})` : error.message;
}

let result: Awaited<ReturnType<typeof updatePastoralZones>>;
try {
  result = await updatePastoralZones({
    now: new Date(),
    date: process.env.MAP_PATOU_DATE || undefined,
    existing: await readExisting(),
    fetchFn: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(30_000) }),
    territory: V0_TERRITORY,
  });
} catch (error) {
  // "::error::" makes GitHub Actions show the message as an annotation.
  console.error(`::error::Could not update pastoral zones: ${describe(error)}`);
  process.exit(1);
}
const { fetched, geojson } = result;

const errors = validatePastoralZonesGeoJson(geojson);
if (errors.length > 0) {
  console.error(`Invalid pastoral zones file (${errors.length} errors), first: ${errors[0]}`);
  process.exit(1);
}

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, JSON.stringify(geojson));

// Counts only: the data itself never goes to the (public) CI logs.
const inUse = geojson.features.filter((f) => f.properties.presence).length;
const withDogs = geojson.features.filter((f) => f.properties.presence?.guardDogs).length;
console.log(
  `${fetched ? 'Fetched' : 'Reused'} ${geojson.features.length} zones for ${geojson.metadata.requestedDate}` +
    ` (${inUse} in use, ${withDogs} with guard dogs)`,
);
