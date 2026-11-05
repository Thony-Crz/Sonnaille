import { describe, expect, it } from 'vitest';
import type { Advice } from '../domain/advice';
import type { PastoralZone } from '../domain/pastoral-zone';
import { buildZoneSheet, initialActivity } from './zone-sheet';

const advice = (id: string, appliesTo: Advice['appliesTo']): Advice => ({
  id,
  situation: id,
  message: id,
  detail: id,
  source: { label: 'Pasto Kézako', url: 'https://www.pasto-kezako.fr/' },
  appliesTo,
});

const allAdvice = [
  advice('flock', { statuses: ['flock', 'flock-with-dogs'] }),
  advice('dogs', { statuses: ['flock-with-dogs'] }),
  advice('mtb', { statuses: ['flock', 'flock-with-dogs'], activities: ['mtb'] }),
  advice('none', { statuses: ['no-flock'] }),
];

const zone: PastoralZone = {
  id: 'A',
  name: 'Alpage A',
  quarter: 'Quartier A',
  geometry: [[[[5.7, 45.3], [5.8, 45.3], [5.8, 45.4], [5.7, 45.3]]]],
  presence: { start: '2026-06-15', end: '2026-09-30', species: ['sheep'], guardDogs: true, weekdays: [1, 2, 3, 4, 5, 6, 7] },
};

const context = { advice: allAdvice, source: 'Map Patou — Réseau Pastoral AuRA', fetchedAt: '2026-07-15T05:00:00.000Z' };

describe('buildZoneSheet', () => {
  it('describes the zone, its planned flock and the data source', () => {
    const sheet = buildZoneSheet({ zone, status: 'flock-with-dogs' }, { ...context, activity: 'hiking' });

    expect(sheet).toMatchObject({
      name: 'Alpage A',
      quarter: 'Quartier A',
      status: 'flock-with-dogs',
      presence: { start: '2026-06-15', end: '2026-09-30', species: ['sheep'], guardDogs: true },
      activity: 'hiking',
      source: 'Map Patou — Réseau Pastoral AuRA',
      fetchedAt: '2026-07-15T05:00:00.000Z',
    });
  });

  it('gives the advice for the zone status and the activity', () => {
    expect(buildZoneSheet({ zone, status: 'flock-with-dogs' }, { ...context, activity: 'hiking' }).advice.map((a) => a.id)).toEqual([
      'flock',
      'dogs',
    ]);
    expect(buildZoneSheet({ zone, status: 'flock' }, { ...context, activity: 'mtb' }).advice.map((a) => a.id)).toEqual(['flock', 'mtb']);
  });

  it('has no presence and the zone advice when no flock is planned', () => {
    const sheet = buildZoneSheet({ zone: { ...zone, presence: null }, status: 'no-flock' }, { ...context, activity: 'trail' });

    expect(sheet.presence).toBeNull();
    expect(sheet.advice.map((a) => a.id)).toEqual(['none']);
  });
});

describe('initialActivity', () => {
  it('uses the saved activity', () => {
    expect(initialActivity({ load: () => 'trail', save: () => {} })).toBe('trail');
  });

  it('defaults to hiking', () => {
    expect(initialActivity({ load: () => null, save: () => {} })).toBe('hiking');
    expect(initialActivity({ load: () => 'paragliding', save: () => {} })).toBe('hiking');
  });
});
