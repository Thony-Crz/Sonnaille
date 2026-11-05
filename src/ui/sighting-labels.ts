import { isFlock, type Headcount, type NestKind, type Observation } from '../domain/observation';
import { speciesText } from './advice-list';

// Texts shown to users, hence in French.
export const NEST_LABELS: Record<NestKind, string> = {
  beehives: 'Ruches',
  'wasp-nest': 'Nid de guêpes',
  'bee-nest': 'Nid ou essaim d’abeilles',
  'hornet-nest': 'Nid de frelons',
};

/** Answers to "Qu'avez-vous vu ?". */
export const WHAT_CHOICES: Array<{ value: 'flock' | NestKind; label: string }> = [
  { value: 'flock', label: 'Un troupeau ou des animaux' },
  { value: 'beehives', label: 'Des ruches' },
  { value: 'wasp-nest', label: 'Un nid de guêpes' },
  { value: 'bee-nest', label: 'Un nid ou un essaim d’abeilles' },
  { value: 'hornet-nest', label: 'Un nid de frelons' },
];

const HEADCOUNT_TEXT: Record<Headcount, string> = { few: 'quelques bêtes', dozens: 'quelques dizaines', hundreds: 'des centaines' };

/** "Vaches, des centaines, chiens de protection vus" or "Nid de frelons". */
export function describeSighting(observation: Observation): string {
  if (!isFlock(observation)) return NEST_LABELS[observation.kind];
  const dogs = observation.guardDogs ? ', chiens de protection vus' : '';
  return `${speciesText([observation.species])}, ${HEADCOUNT_TEXT[observation.headcount]}${dogs}`;
}
