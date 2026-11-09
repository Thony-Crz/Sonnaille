import { existsSync, readFileSync, rmSync } from 'node:fs';
import { validatePastoralZonesGeoJson } from '../src/infrastructure/pastoral-zones-geojson';

export type ZonesCheck = { status: 'valid'; zones: number } | { status: 'invalid'; errors: string[] } | { status: 'missing' };

/**
 * Checks the zones file before it is published (PC) or deployed (CI). Invalid zones are removed:
 * the site then says the zones are unavailable rather than showing wrong ones.
 * Messages only say where the problem is, never the data (docs/decisions.md, D1).
 */
export function checkZonesFile(path: string): ZonesCheck {
  if (!existsSync(path)) return { status: 'missing' };
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    rmSync(path);
    return { status: 'invalid', errors: ['not JSON'] };
  }
  const errors = validatePastoralZonesGeoJson(data);
  if (errors.length > 0) {
    rmSync(path);
    return { status: 'invalid', errors };
  }
  return { status: 'valid', zones: (data as { features: unknown[] }).features.length };
}
