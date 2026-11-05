import { describe, expect, it } from 'vitest';
import type { PastoralZone } from './pastoral-zone';
import { ZONE_STATUSES, dayOf, parseDay, zoneStatus } from './zone-status';

const zone = (presence: PastoralZone['presence']): PastoralZone => ({
  id: 'Z',
  name: 'Alpage',
  quarter: 'Quartier',
  geometry: [[[[5.7, 45.3], [5.8, 45.3], [5.8, 45.4], [5.7, 45.3]]]],
  presence,
});

const presence = { start: '2026-06-15', end: '2026-09-30', species: ['sheep' as const], weekdays: [1, 2, 3, 4, 5, 6, 7] };

describe('zoneStatus', () => {
  it('lists the statuses from the most to the least cautious', () => {
    expect(ZONE_STATUSES).toEqual(['flock-with-dogs', 'flock', 'no-flock']);
  });

  it('is "no-flock" when nothing is planned', () => {
    expect(zoneStatus(zone(null), '2026-07-15')).toBe('no-flock');
  });

  it('is "no-flock" outside the presence period', () => {
    expect(zoneStatus(zone({ ...presence, guardDogs: true }), '2026-11-05')).toBe('no-flock');
  });

  it('is "flock" when a flock without guard dogs is planned', () => {
    expect(zoneStatus(zone({ ...presence, guardDogs: false }), '2026-07-15')).toBe('flock');
  });

  it('is "flock-with-dogs" when a flock with guard dogs is planned', () => {
    expect(zoneStatus(zone({ ...presence, guardDogs: true }), '2026-07-15')).toBe('flock-with-dogs');
  });
});

describe('parseDay', () => {
  it('accepts a real YYYY-MM-DD day', () => {
    expect(parseDay('2026-07-15')).toBe('2026-07-15');
  });

  it.each([null, '', '15/07/2026', '2026-7-15', '2026-02-30', 'tomorrow'])('rejects %j', (text) => {
    expect(parseDay(text)).toBeNull();
  });
});

describe('dayOf', () => {
  it('gives the local calendar day as YYYY-MM-DD', () => {
    expect(dayOf(new Date(2026, 6, 5, 23, 30))).toBe('2026-07-05');
  });
});
