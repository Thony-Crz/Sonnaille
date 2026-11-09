import { copyFileSync, existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkZonesFile } from '../../scripts/check-zones-file';

const DEMO_ZONES = join(import.meta.dirname, '..', '..', 'public', 'demo', 'pastoral-zones.geojson');
const tempFile = () => join(mkdtempSync(join(tmpdir(), 'sonnaille-zones-')), 'pastoral-zones.geojson');

describe('checkZonesFile: the zones are checked before being published or deployed', () => {
  it('accepts valid zones and keeps the file', () => {
    const file = tempFile();
    copyFileSync(DEMO_ZONES, file);

    expect(checkZonesFile(file)).toEqual({ status: 'valid', zones: 4 });
    expect(existsSync(file)).toBe(true);
  });

  it('removes invalid zones, so the site says they are unavailable rather than showing wrong ones', () => {
    const file = tempFile();
    writeFileSync(file, JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature' }] }));

    const result = checkZonesFile(file);

    expect(result.status).toBe('invalid');
    expect(existsSync(file)).toBe(false);
  });

  it('removes a file that is not even JSON', () => {
    const file = tempFile();
    writeFileSync(file, '<html>Erreur</html>');

    expect(checkZonesFile(file).status).toBe('invalid');
    expect(existsSync(file)).toBe(false);
  });

  it('says when there is no file', () => {
    expect(checkZonesFile(join(tmpdir(), 'nothing-here.geojson'))).toEqual({ status: 'missing' });
  });

  it('never repeats the data in its messages, only where the problem is', () => {
    const file = tempFile();
    writeFileSync(file, JSON.stringify({ type: 'FeatureCollection', metadata: {}, features: [{ type: 'Feature', id: 'secret-alpage', geometry: null, properties: { name: 'Alpage secret' } }] }));

    const result = checkZonesFile(file);

    expect(JSON.stringify(result)).not.toContain('Alpage secret');
  });
});
