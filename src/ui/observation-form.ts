import { HEADCOUNTS, type Headcount } from '../domain/observation';
import { SPECIES, type Species } from '../domain/pastoral-zone';
import { element, frenchNumber } from './dom';

export interface ObservationAnswers {
  km: number;
  species: Species;
  headcount: Headcount;
  guardDogs: boolean;
  /** HH:MM, asked only when the GPX has no time. */
  time?: string;
}

export interface ObservationForm {
  element: HTMLElement;
  setTrackLength(km: number): void;
  /** Asks for the time of the sighting when the GPX does not have it. */
  setTrackHasTimes(hasTimes: boolean): void;
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
  const time = element('input', { type: 'time', name: 'time', value: '12:00' });
  const timeLabel = element('label', { hidden: true }, element('span', { textContent: "Heure de l'observation" }), time);
  const error = element('p', { className: 'observation-error' });
  error.setAttribute('role', 'alert');
  const result = element('div', { className: 'observation-result' });

  const form = element(
    'form',
    { className: 'observation-form', noValidate: true },
    element('label', {}, element('span', { textContent: 'Au kilomètre' }), km),
    timeLabel,
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
    const askedTime = !timeLabel.hidden;
    if (askedTime && !/^\d{2}:\d{2}$/.test(time.value)) {
      error.textContent = "Indiquez l'heure à laquelle vous avez vu les animaux.";
      return;
    }
    error.textContent = '';
    const chosen = form.querySelector<HTMLInputElement>('input[name="headcount"]:checked');
    onSubmit({
      km: value,
      species: species.value as Species,
      headcount: (chosen?.value ?? 'dozens') as Headcount,
      guardDogs: guardDogs.checked,
      ...(askedTime ? { time: time.value } : {}),
    });
  });

  const panel = element('details', { className: 'observation-section' }, element('summary', { textContent: 'Signaler un troupeau ou des animaux vus' }), form);

  return {
    element: panel,
    setTrackLength: (value) => {
      length = value;
      km.max = String(value);
    },
    setTrackHasTimes: (hasTimes) => {
      timeLabel.hidden = hasTimes;
    },
    showResult: (json, timeFromTrack) => {
      const copy = element('button', { type: 'button', className: 'observation-copy', textContent: 'Copier' });
      copy.addEventListener('click', () => {
        void navigator.clipboard?.writeText(json).then(() => {
          copy.textContent = 'Copié';
        });
      });
      result.replaceChildren(
        element('p', {
          className: 'observation-time-source',
          textContent: timeFromTrack ? 'Heure tirée de votre GPX.' : "Heure saisie à la main : votre GPX n'a pas d'heure.",
        }),
        element('p', {
          textContent: 'Ajoutez cette entrée au tableau « features » du fichier content/observations.geojson du dépôt : elle sera visible après le prochain déploiement.',
        }),
        element('pre', { textContent: json }),
        copy,
      );
    },
  };
}
