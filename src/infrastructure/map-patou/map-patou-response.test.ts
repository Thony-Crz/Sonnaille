import { describe, expect, it } from 'vitest';
import type { Bounds } from '../../domain/bounds';
import { parseMapPatouResponse, parseSpecies } from './map-patou-response';

// Fictitious response: the shape of the Map Patou API, none of its data (docs/decisions.md, D1).
const ring = (west: number, south: number) => [
  [west, south],
  [west + 0.05, south],
  [west + 0.05, south + 0.05],
  [west, south],
];

const quarter = (id: string, west: number, south: number, properties: Record<string, unknown> = {}) => ({
  type: 'Feature',
  geometry: { type: 'MultiPolygon', coordinates: [[ring(west, south)]] },
  properties: {
    id,
    nom: `Alpage ${id}`,
    surface: `Quartier ${id}`,
    type_animal: null,
    chiens: false,
    debut: null,
    fin: null,
    lundi: null,
    mardi: null,
    mercredi: null,
    jeudi: null,
    vendredi: null,
    samedi: null,
    dimanche: null,
    ...properties,
  },
});

const allWeek = { lundi: true, mardi: true, mercredi: true, jeudi: true, vendredi: true, samedi: true, dimanche: true };

const response = (features: unknown[]) => ({
  success: true,
  message: 'success',
  data: { type: 'FeatureCollection', features },
});

const territory: Bounds = { west: 5.25, south: 44.68, east: 6.02, north: 45.58 };

describe('parseMapPatouResponse', () => {
  it('turns quarters into pastoral zones', () => {
    const zones = parseMapPatouResponse(response([quarter('A', 5.7, 45.3)]), territory);

    expect(zones).toEqual([
      {
        id: 'A',
        name: 'Alpage A',
        quarter: 'Quartier A',
        geometry: [[ring(5.7, 45.3)]],
        presence: null,
      },
    ]);
  });

  it('keeps the planned presence of quarters in use', () => {
    const [zone] = parseMapPatouResponse(
      response([quarter('A', 5.7, 45.3, { type_animal: 'Ovins', chiens: true, debut: '2026-06-15', fin: '2026-09-30', ...allWeek })]),
      territory,
    );

    expect(zone?.presence).toEqual({
      start: '2026-06-15',
      end: '2026-09-30',
      species: ['sheep'],
      guardDogs: true,
      weekdays: [1, 2, 3, 4, 5, 6, 7],
    });
  });

  it('keeps only the days of the week with a presence', () => {
    const [zone] = parseMapPatouResponse(
      response([quarter('A', 5.7, 45.3, { debut: '2026-06-15', fin: '2026-09-30', samedi: true, dimanche: true })]),
      territory,
    );

    expect(zone?.presence?.weekdays).toEqual([6, 7]);
  });

  it('assumes every day when dates are given without days', () => {
    const [zone] = parseMapPatouResponse(response([quarter('A', 5.7, 45.3, { debut: '2026-06-15', fin: '2026-09-30' })]), territory);

    expect(zone?.presence?.weekdays).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('keeps only quarters overlapping the territory', () => {
    const zones = parseMapPatouResponse(
      response([quarter('inside', 5.7, 45.3), quarter('mont-blanc', 6.85, 45.8), quarter('edge', 6.0, 45.55)]),
      territory,
    );

    expect(zones.map((z) => z.id)).toEqual(['inside', 'edge']);
  });

  it('skips quarters without geometry', () => {
    const empty = { ...quarter('empty', 5.7, 45.3), geometry: { type: 'MultiPolygon', coordinates: [] } };

    expect(parseMapPatouResponse(response([empty]), territory)).toEqual([]);
  });

  it('rejects an unexpected response', () => {
    expect(() => parseMapPatouResponse({ success: false, message: 'error' }, territory)).toThrow('Unexpected Map Patou response');
  });
});

describe('parseSpecies', () => {
  it.each([
    [null, []],
    ['ovins', ['sheep']],
    ['Bovins', ['cattle']],
    ['caprins', ['goats']],
    ['Equins', ['horses']],
    ['mixte', ['mixed']],
    ['asins', ['donkeys']],
    ['Equins Asins', ['horses', 'donkeys']],
    ['Ovins Caprins', ['sheep', 'goats']],
    ['Equins Bovins', ['horses', 'cattle']],
    ['ovins ovins', ['sheep']],
    ['lamas', []],
  ])('reads %s as %j', (raw, species) => {
    expect(parseSpecies(raw)).toEqual(species);
  });
});
