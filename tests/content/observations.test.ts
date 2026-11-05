import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { observationsErrors, parseObservationSettings } from '../../src/infrastructure/observations-content';

const content = (file: string) => JSON.parse(readFileSync(join(import.meta.dirname, '..', '..', 'public', 'content', file), 'utf8'));

describe('published observations (public/content)', () => {
  it('observations.geojson is valid', () => {
    expect(observationsErrors(content('observations.geojson'))).toEqual([]);
  });

  it('observation-settings.json is valid, with sightings sharp for 3 days', () => {
    expect(parseObservationSettings(content('observation-settings.json')).validityDays).toBe(3);
  });
});
