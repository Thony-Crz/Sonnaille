// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectCrossings } from '../../src/domain/crossing';
import { isFlock } from '../../src/domain/observation';
import { zoneStatus } from '../../src/domain/zone-status';
import { readGpx } from '../../src/infrastructure/gpx-reader';
import { observationsErrors, parseObservations } from '../../src/infrastructure/observations-content';
import { fromGeoJson, validatePastoralZonesGeoJson } from '../../src/infrastructure/pastoral-zones-geojson';

const demoFile = (file: string) => readFileSync(join(import.meta.dirname, '..', '..', 'public', 'demo', file), 'utf8');
const DEMO_DAY = '2026-07-15';

describe('demo mode content (public/demo), all fictional', () => {
  const zones = JSON.parse(demoFile('pastoral-zones.geojson'));

  it('has valid zones, said to be fictional', () => {
    expect(validatePastoralZonesGeoJson(zones)).toEqual([]);
    expect(zones.metadata.source).toMatch(/fictives/i);
  });

  it('lets the demo track cross zones of every status on the demo day', () => {
    const track = readGpx(demoFile('hauts-plateaux-fictif.gpx'), 'hauts-plateaux-fictif.gpx');
    const withStatus = fromGeoJson(zones).zones.map((zone) => ({ zone, status: zoneStatus(zone, DEMO_DAY) }));

    const crossed = detectCrossings(track, withStatus, { marginMeters: 50 });

    expect(new Set(crossed.map((c) => c.status))).toEqual(new Set(['flock-with-dogs', 'flock', 'no-flock']));
  });

  it('has valid sightings near the track: animals and a nest', () => {
    const data = JSON.parse(demoFile('observations.geojson'));

    expect(observationsErrors(data)).toEqual([]);
    const sightings = parseObservations(data);
    expect(sightings.some(isFlock)).toBe(true);
    expect(sightings.some((s) => !isFlock(s))).toBe(true);
  });
});
