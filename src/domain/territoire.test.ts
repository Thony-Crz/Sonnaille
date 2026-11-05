import { describe, expect, it } from 'vitest';
import { contient } from './emprise';
import { MASSIFS_V0, TERRITOIRE_V0 } from './territoire';

describe('territoire de la V0', () => {
  it('se compose de la Chartreuse et du Vercors', () => {
    expect(MASSIFS_V0.map((m) => m.nom)).toEqual(['Chartreuse', 'Vercors']);
  });

  it.each([
    ['Chamechaude (Chartreuse)', 5.788, 45.287],
    ['Dent de Crolles (Chartreuse)', 5.856, 45.31],
    ['Grand Veymont (Vercors)', 5.524, 44.868],
    ['Moucherotte (Vercors)', 5.643, 45.155],
  ])('contient %s', (_nom, longitude, latitude) => {
    expect(contient(TERRITOIRE_V0, { longitude, latitude })).toBe(true);
  });

  it("ne contient pas le Mont Blanc", () => {
    expect(contient(TERRITOIRE_V0, { longitude: 6.865, latitude: 45.833 })).toBe(false);
  });
});
