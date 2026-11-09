import type { Activity } from '../domain/advice';
import type { Headcount } from '../domain/observation';
import type { Species } from '../domain/pastoral-zone';

// Texts shown to users, hence in French.

export const ACTIVITY_LABELS: Record<Activity, string> = { hiking: 'À pied', trail: 'En trail', mtb: 'À VTT' };

/** Names in a choice list or a legend. */
export const SPECIES_LABELS: Record<Species, string> = {
  sheep: 'Moutons (ovins)',
  cattle: 'Vaches (bovins)',
  goats: 'Chèvres (caprins)',
  horses: 'Chevaux',
  donkeys: 'Ânes',
  mixed: 'Troupeau mixte',
};

export const HEADCOUNT_LABELS: Record<Headcount, string> = {
  few: 'Quelques bêtes',
  dozens: 'Quelques dizaines',
  hundreds: 'Des centaines',
};

/** Names inside a sentence. */
const SPECIES_IN_TEXT: Record<Species, string> = {
  sheep: 'moutons',
  cattle: 'vaches',
  goats: 'chèvres',
  horses: 'chevaux',
  donkeys: 'ânes',
  mixed: 'troupeau mixte',
};

export const DISCLAIMER =
  "L'application ne garantit pas l'absence de troupeau ou de chien. " +
  "Ces conseils, tirés de sources publiques, n'ont pas encore été relus par un professionnel du pastoralisme.";

/** "Moutons, chèvres". */
export function speciesText(species: Species[]): string {
  const text = species.map((s) => SPECIES_IN_TEXT[s]).join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
