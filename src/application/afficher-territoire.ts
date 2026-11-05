import type { Emprise } from '../domain/emprise';
import { TERRITOIRE_V0 } from '../domain/territoire';
import type { Carte } from './ports';

/** Cadre la carte sur le territoire couvert (Chartreuse et Vercors en V0). */
export function afficherTerritoire(carte: Carte, territoire: Emprise = TERRITOIRE_V0): void {
  carte.cadrerSur(territoire);
}
