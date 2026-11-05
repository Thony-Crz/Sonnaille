import { describe, expect, it } from 'vitest';
import { SPECIES, isPresentOn, type PastoralZone } from './pastoral-zone';

const square = [[[[5.7, 45.3], [5.8, 45.3], [5.8, 45.4], [5.7, 45.4], [5.7, 45.3]]]];

const zone = (presence: PastoralZone['presence']): PastoralZone => ({
  id: 'UP-TEST_Q01',
  name: 'Alpage test',
  quarter: 'Quartier test',
  geometry: square,
  presence,
});

const summer = { start: '2026-06-15', end: '2026-09-30', species: ['sheep' as const], guardDogs: true, weekdays: [1, 2, 3, 4, 5, 6, 7] };

describe('species', () => {
  it('covers the animals met on pastures, donkeys included', () => {
    expect(SPECIES).toEqual(['sheep', 'cattle', 'goats', 'horses', 'donkeys', 'mixed']);
  });
});

describe('isPresentOn', () => {
  it('is false when no flock is planned', () => {
    expect(isPresentOn(zone(null), '2026-07-14')).toBe(false);
  });

  it('is true inside the presence period', () => {
    expect(isPresentOn(zone(summer), '2026-07-14')).toBe(true);
  });

  it('includes the first and last days', () => {
    expect(isPresentOn(zone(summer), '2026-06-15')).toBe(true);
    expect(isPresentOn(zone(summer), '2026-09-30')).toBe(true);
  });

  it('is false outside the presence period', () => {
    expect(isPresentOn(zone(summer), '2026-06-14')).toBe(false);
    expect(isPresentOn(zone(summer), '2026-10-01')).toBe(false);
  });

  it('is false on a weekday without presence', () => {
    const weekdaysOnly = { ...summer, weekdays: [1, 2, 3, 4, 5] };

    expect(isPresentOn(zone(weekdaysOnly), '2026-07-18')).toBe(false); // a Saturday
    expect(isPresentOn(zone(weekdaysOnly), '2026-07-17')).toBe(true); // a Friday
  });
});
