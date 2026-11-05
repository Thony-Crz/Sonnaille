import { HEADCOUNTS, type Headcount } from '../domain/observation';
import { SPECIES, type Species } from '../domain/pastoral-zone';
import { element, frenchNumber } from './dom';

export interface ObservationAnswers {
  km: number;
  species: Species;
  headcount: Headcount;
  guardDogs: boolean;
}

export interface ObservationForm {
  element: HTMLElement;
  setTrackLength(km: number): void;
  showResult(json: string, timeFromTrack: boolean): void;
}

// Texts shown to users, hence in French.
const SPECIES_LABELS: Record<Species, string> = {
  sheep: 'Moutons (ovins)',
  cattle: 'Vaches (bovins)',
  goats: 'Chèvres (caprins)',
  horses: 'Chevaux',
  donkeys: 'Ânes',
  mixed: 'Troupeau mixte',
};
const HEADCOUNT_LABELS: Record<Headcount, string> = {
  few: 'Quelques bêtes',
  dozens: 'Quelques dizaines',
  hundreds: 'Des centaines',
};

/**
 * "Signaler un troupeau ou des animaux vus" (T24): where on the track, which animals, roughly how many,
 * guard dogs seen or not. Structured answers only: no free text, so nobody can be targeted.
 */
export function createObservationForm({ onSubmit }: { onSubmit: (answers: ObservationAnswers) => void }): ObservationForm {
  let length = 0;

  const km = element('input', { type: 'number', name: 'km', min: '0', step: '0.1', value: '0', required: true });
  const species = element('select', { name: 'species' });
  for (const s of SPECIES) species.append(element('option', { value: s, textContent: SPECIES_LABELS[s] }));

  const headcount = element('fieldset', { className: 'observation-headcount' }, element('legend', { textContent: 'Combien de bêtes ?' }));
  for (const h of HEADCOUNTS) {
    headcount.append(
      element('label', {}, element('input', { type: 'radio', name: 'headcount', value: h, checked: h === 'dozens' }), element('span', { textContent: HEADCOUNT_LABELS[h] })),
    );
  }

  const guardDogs = element('input', { type: 'checkbox', name: 'guardDogs' });
  const error = element('p', { className: 'observation-error' });
  error.setAttribute('role', 'alert');
  const result = element('div', { className: 'observation-result' });

  const form = element(
    'form',
    { className: 'observation-form', noValidate: true },
    element('label', {}, element('span', { textContent: 'Au kilomètre' }), km),
    element('label', {}, element('span', { textContent: 'Quels animaux ?' }), species),
    headcount,
    element('label', { className: 'observation-dogs' }, guardDogs, element('span', { textContent: 'Chiens de protection vus' })),
    error,
    element('button', { type: 'submit', textContent: 'Préparer le signalement' }),
    result,
  );
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = Number.parseFloat(km.value);
    if (!Number.isFinite(value) || value < 0 || value > length) {
      error.textContent = `Choisissez un kilomètre entre 0 et ${frenchNumber(length)}.`;
      return;
    }
    error.textContent = '';
    const chosen = form.querySelector<HTMLInputElement>('input[name="headcount"]:checked');
    onSubmit({
      km: value,
      species: species.value as Species,
      headcount: (chosen?.value ?? 'dozens') as Headcount,
      guardDogs: guardDogs.checked,
    });
  });

  const panel = element('details', { className: 'observation-section' }, element('summary', { textContent: 'Signaler un troupeau ou des animaux vus' }), form);

  return {
    element: panel,
    setTrackLength: (value) => {
      length = value;
      km.max = String(value);
    },
    showResult: (json, timeFromTrack) => {
      const copy = element('button', { type: 'button', className: 'observation-copy', textContent: 'Copier' });
      copy.addEventListener('click', () => {
        void navigator.clipboard?.writeText(json).then(() => {
          copy.textContent = 'Copié';
        });
      });
      result.replaceChildren(
        ...(timeFromTrack
          ? []
          : [element('p', { className: 'observation-warning', textContent: "Votre GPX n'a pas d'heure : l'observation est datée de midi le jour de la sortie." })]),
        element('p', {
          textContent: 'Ajoutez cette entrée au tableau « features » du fichier content/observations.geojson du dépôt : elle sera visible après le prochain déploiement.',
        }),
        element('pre', { textContent: json }),
        copy,
      );
    },
  };
}
