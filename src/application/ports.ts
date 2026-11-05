import type { Emprise } from '../domain/emprise';

/** Ce que les cas d'usage attendent de la carte affichée. Implémenté dans `ui`. */
export interface Carte {
  cadrerSur(emprise: Emprise): void;
}
