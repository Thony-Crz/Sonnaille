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

/** Provisional advice, general caution to be reviewed by professionals (pastoralism, beekeeping). */
const NEST_TIPS: Record<NestKind, string> = {
  beehives: 'Passez sans vous arrêter, à distance, jamais devant l’entrée des ruches.',
  'wasp-nest': 'Contournez le nid à distance, sans gestes brusques et sans le toucher.',
  'bee-nest': 'Contournez calmement l’essaim ou le nid, sans le déranger.',
  'hornet-nest': 'Éloignez-vous sans bruit ni gestes brusques ; ne vous arrêtez pas près du nid.',
};

export const STING_WARNING = 'Allergique aux piqûres ? Gardez votre traitement sur vous.';

/** The right move near what was reported. */
export function sightingTip(observation: Observation): string {
  if (!isFlock(observation)) return NEST_TIPS[observation.kind];
  return observation.guardDogs
    ? 'Arrêtez-vous, laissez les chiens vous identifier, puis contournez calmement.'
    : 'Contournez largement le troupeau, au pas, chien tenu en laisse.';
}
