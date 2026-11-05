import { describe, expect, it } from 'vitest';
import type { Emprise } from '../domain/emprise';
import { TERRITOIRE_V0 } from '../domain/territoire';
import { afficherTerritoire } from './afficher-territoire';
import type { Carte } from './ports';

class FausseCarte implements Carte {
  cadrages: Emprise[] = [];
  cadrerSur(emprise: Emprise): void {
    this.cadrages.push(emprise);
  }
}

describe('afficherTerritoire', () => {
  it('cadre la carte sur le territoire de la V0 par défaut', () => {
    const carte = new FausseCarte();

    afficherTerritoire(carte);

    expect(carte.cadrages).toEqual([TERRITOIRE_V0]);
  });

  it('cadre la carte sur le territoire demandé', () => {
    const carte = new FausseCarte();
    const autre: Emprise = { ouest: 6, sud: 45, est: 7, nord: 46 };

    afficherTerritoire(carte, autre);

    expect(carte.cadrages).toEqual([autre]);
  });
});
