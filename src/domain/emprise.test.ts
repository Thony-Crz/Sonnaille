import { describe, expect, it } from 'vitest';
import { contient, empriseEnglobante, type Emprise } from './emprise';

const a: Emprise = { ouest: 5, sud: 45, est: 6, nord: 46 };
const b: Emprise = { ouest: 5.5, sud: 44, est: 7, nord: 45.5 };

describe('empriseEnglobante', () => {
  it("renvoie l'emprise elle-même quand il n'y en a qu'une", () => {
    expect(empriseEnglobante([a])).toEqual(a);
  });

  it('renvoie la plus petite emprise qui contient toutes les autres', () => {
    expect(empriseEnglobante([a, b])).toEqual({ ouest: 5, sud: 44, est: 7, nord: 46 });
  });

  it('refuse une liste vide', () => {
    expect(() => empriseEnglobante([])).toThrow('Aucune emprise à englober');
  });
});

describe('contient', () => {
  it('vrai pour un point à l’intérieur', () => {
    expect(contient(a, { longitude: 5.5, latitude: 45.5 })).toBe(true);
  });

  it('vrai pour un point sur le bord', () => {
    expect(contient(a, { longitude: 5, latitude: 46 })).toBe(true);
  });

  it('faux pour un point à l’extérieur', () => {
    expect(contient(a, { longitude: 6.1, latitude: 45.5 })).toBe(false);
  });
});
