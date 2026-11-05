import { ACTIVITIES, type Activity, type Advice } from '../domain/advice';
import type { Species } from '../domain/pastoral-zone';
import { element } from './dom';

// Texts shown to users, hence in French.
export const ACTIVITY_LABELS: Record<Activity, string> = { hiking: 'À pied', trail: 'En trail', mtb: 'À VTT' };

const SPECIES_LABELS: Record<Species, string> = {
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

/** "Ovins, caprins". */
export function speciesText(species: Species[]): string {
  const text = species.map((s) => SPECIES_LABELS[s]).join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Je me déplace" radio buttons; `name` keeps groups of different panels apart. */
export function renderActivityChoice(current: Activity, name: string, onChange: (activity: Activity) => void): HTMLFieldSetElement {
  const fieldset = element('fieldset', { className: 'zone-sheet-activity' }, element('legend', { textContent: 'Je me déplace' }));
  for (const activity of ACTIVITIES) {
    const input = element('input', { type: 'radio', name, value: activity, checked: activity === current });
    input.addEventListener('change', () => {
      if (input.checked) onChange(activity);
    });
    fieldset.append(element('label', {}, input, element('span', { textContent: ACTIVITY_LABELS[activity] })));
  }
  return fieldset;
}

/** Each advice: situation, short message, detail on demand, cited source. */
export function renderAdviceList(advice: Advice[]): HTMLUListElement {
  const list = element('ul', { className: 'zone-sheet-advice' });
  for (const item of advice) {
    const source = element('a', { href: item.source.url, target: '_blank', rel: 'noopener', textContent: item.source.label });
    list.append(
      element(
        'li',
        { className: 'advice' },
        element('p', { className: 'advice-situation', textContent: item.situation }),
        element('strong', { textContent: item.message }),
        element(
          'details',
          {},
          element('summary', { textContent: 'En savoir plus' }),
          element('p', { textContent: item.detail }),
          element('p', { className: 'advice-source' }, 'Source : ', source),
        ),
      ),
    );
  }
  return list;
}
