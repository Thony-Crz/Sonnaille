import { describe, expect, it } from 'vitest';
import { contains } from './bounds';
import { V0_MASSIFS, V0_TERRITORY } from './territory';

describe('V0 territory', () => {
  it('is made of the Chartreuse and the Vercors', () => {
    expect(V0_MASSIFS.map((m) => m.name)).toEqual(['Chartreuse', 'Vercors']);
  });

  it.each([
    ['Chamechaude (Chartreuse)', 5.788, 45.287],
    ['Dent de Crolles (Chartreuse)', 5.856, 45.31],
    ['Grand Veymont (Vercors)', 5.524, 44.868],
    ['Moucherotte (Vercors)', 5.643, 45.155],
  ])('contains %s', (_name, longitude, latitude) => {
    expect(contains(V0_TERRITORY, { longitude, latitude })).toBe(true);
  });

  it('does not contain the Mont Blanc', () => {
    expect(contains(V0_TERRITORY, { longitude: 6.865, latitude: 45.833 })).toBe(false);
  });
});
