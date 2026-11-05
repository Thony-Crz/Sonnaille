import type { Position } from '../domain/bounds';
import { HEADCOUNTS, type Headcount, type Observation } from '../domain/observation';
import { SPECIES, type Species } from '../domain/pastoral-zone';
import { parseDay } from '../domain/zone-status';
import { speciesText } from './advice-list';
import { element } from './dom';
import { HEADCOUNT_LABELS, SPECIES_LABELS } from './observation-form';

export interface SightingAnswers {
  position: Position;
  date: string;
  time: string;
  species: Species;
  headcount: Headcount;
  guardDogs: boolean;
}

/**
 * Sheet opened after tapping the map: when, which animals, how many, guard dogs seen.
 * Structured answers only, no free text (nobody can be targeted).
 */
export function createSightingForm({ onSave, onCancel }: { onSave: (answers: SightingAnswers) => void; onCancel: () => void }) {
  let position: Position | null = null;

  const date = element('input', { type: 'date', name: 'sighting-date' });
  const time = element('input', { type: 'time', name: 'sighting-time' });
  const species = element('select', { name: 'species' });
  for (const s of SPECIES) species.append(element('option', { value: s, textContent: SPECIES_LABELS[s] }));
  const headcount = element('fieldset', { className: 'observation-headcount' }, element('legend', { textContent: 'Combien de bêtes ?' }));
  for (const h of HEADCOUNTS) {
    headcount.append(
      element(
        'label',
        {},
        element('input', { type: 'radio', name: 'sighting-headcount', value: h, checked: h === 'dozens' }),
        element('span', { textContent: HEADCOUNT_LABELS[h] }),
      ),
    );
  }
  const dogs = element('input', { type: 'checkbox', name: 'sighting-dogs' });
  const error = element('p', { className: 'observation-error' });
  error.setAttribute('role', 'alert');

  const cancel = element('button', { type: 'button', className: 'sighting-cancel', textContent: 'Annuler' });
  const form = element(
    'form',
    { className: 'observation-form', noValidate: true },
    element('label', {}, element('span', { textContent: 'Le' }), date),
    element('label', {}, element('span', { textContent: 'Vers' }), time),
    element('label', {}, element('span', { textContent: 'Quels animaux ?' }), species),
    headcount,
    element('label', { className: 'observation-dogs' }, dogs, element('span', { textContent: 'Chiens de protection vus' })),
    error,
    element('div', { className: 'sighting-actions' }, cancel, element('button', { type: 'submit', textContent: 'Enregistrer' })),
  );

  const panel = element(
    'aside',
    { className: 'zone-sheet sighting-panel', hidden: true },
    element('h2', { textContent: 'Signaler des animaux vus' }),
    element('p', { className: 'zone-sheet-quarter', textContent: 'Au point touché sur la carte.' }),
    form,
  );
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Signaler des animaux vus');

  const close = () => {
    panel.hidden = true;
    position = null;
  };
  cancel.addEventListener('click', () => {
    close();
    onCancel();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!position) return;
    if (!parseDay(date.value) || !/^\d{2}:\d{2}$/.test(time.value)) {
      error.textContent = 'Indiquez le jour et l’heure.';
      return;
    }
    error.textContent = '';
    const chosen = form.querySelector<HTMLInputElement>('input[name="sighting-headcount"]:checked');
    const answers = {
      position,
      date: date.value,
      time: time.value,
      species: species.value as Species,
      headcount: (chosen?.value ?? 'dozens') as Headcount,
      guardDogs: dogs.checked,
    };
    close();
    onSave(answers);
  });

  return {
    element: panel,
    open: (at: Position, defaults: { date: string; time: string }) => {
      position = at;
      date.value = defaults.date;
      time.value = defaults.time;
      error.textContent = '';
      panel.hidden = false;
    },
    close,
  };
}

const HEADCOUNT_TEXT: Record<Headcount, string> = { few: 'quelques bêtes', dozens: 'quelques dizaines', hundreds: 'des centaines' };

/** Map panel: the "Signaler des animaux vus" button, and the sightings kept on this device. */
export function createMySightings({
  onReport,
  onDelete,
  onPublish,
}: {
  onReport: () => void;
  onDelete: (id: string) => void;
  onPublish: () => void;
}) {
  const report = element('button', { type: 'button', className: 'sighting-report', textContent: 'Signaler des animaux vus' });
  report.addEventListener('click', onReport);
  const hint = element('p', { className: 'sighting-hint' });
  const summary = element('summary');
  const list = element('div', { className: 'my-sightings-list' });
  const note = element('p', { className: 'sighting-note' });
  const details = element('details', { className: 'my-sightings' }, summary, list, note);
  const panel = element('div', { className: 'map-panel sightings-entry' }, report, hint, details);

  const setList = (observations: Observation[]) => {
    summary.textContent = `Mes signalements (${observations.length})`;
    if (observations.length === 0) {
      list.replaceChildren(element('p', { className: 'sighting-hint', textContent: 'Aucun signalement pour l’instant.' }));
      return;
    }
    const items = observations.map((o) => {
      const remove = element('button', { type: 'button', textContent: 'Supprimer' });
      remove.addEventListener('click', () => onDelete(o.id));
      const when = new Date(o.observedAt);
      return element(
        'div',
        { className: 'my-sighting' },
        element('p', {
          textContent: `${speciesText([o.species])}, ${HEADCOUNT_TEXT[o.headcount]}${o.guardDogs ? ', chiens de protection vus' : ''}`,
        }),
        element('p', {
          className: 'sighting-hint',
          textContent: `${when.toLocaleDateString('fr-FR')} vers ${when.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        }),
        remove,
      );
    });
    const publish = element('button', { type: 'button', className: 'sighting-publish', textContent: 'Publier' });
    publish.addEventListener('click', onPublish);
    list.replaceChildren(
      ...items,
      element('p', { className: 'sighting-hint', textContent: 'Gardés sur cet appareil jusqu’à leur publication.' }),
      publish,
    );
  };
  setList([]);

  return {
    element: panel,
    setList,
    setPicking: (picking: boolean) => {
      report.textContent = picking ? 'Annuler' : 'Signaler des animaux vus';
      hint.textContent = picking ? 'Touchez la carte là où vous avez vu les animaux.' : '';
    },
    setNote: (text: string) => {
      note.textContent = text;
    },
  };
}
