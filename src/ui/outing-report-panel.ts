import type { OutingReport } from '../application/prepare-outing';
import type { Activity } from '../domain/advice';
import { parseDay } from '../domain/zone-status';
import { DISCLAIMER, renderActivityChoice, renderAdviceList, speciesText } from './advice-list';
import { element, frenchDay, frenchNumber } from './dom';
import { ZONE_STYLES } from './zone-styles';

export interface OutingReportPanel {
  element: HTMLElement;
  show(report: OutingReport): void;
  hide(): void;
}

const plural = (count: number, singular: string, several: string) => `${count} ${count === 1 ? singular : several}`;

const HEADCOUNT_TEXT = { few: 'quelques bêtes', dozens: 'quelques dizaines', hundreds: 'des centaines' } as const;

/** "Troupeaux vus récemment près du tracé": one line per sighting, structured facts only. */
function renderSightings(report: OutingReport): HTMLElement[] {
  if (report.sightings.length === 0) return [];
  const list = element('ul', { className: 'crossings' });
  for (const { observation, km, distanceMeters } of report.sightings) {
    const day = new Date(observation.observedAt).toLocaleDateString('fr-FR');
    const what = `${speciesText([observation.species])}, ${HEADCOUNT_TEXT[observation.headcount]}${observation.guardDogs ? ', chiens de protection vus' : ''}`;
    list.append(
      element(
        'li',
        { className: 'crossing' },
        element('p', { className: 'zone-sheet-status', textContent: what }),
        element('p', { textContent: `Vu le ${day}, au km ${frenchNumber(km)}, à ${distanceMeters} m du tracé` }),
      ),
    );
  }
  return [element('section', { className: 'sightings' }, element('h3', { textContent: 'Troupeaux vus récemment près du tracé' }), list)];
}

/** "Votre tracé traverse 3 zones pastorales, dont 1 avec chiens de protection." */
function summary({ crossings }: OutingReport): string {
  if (crossings.length === 0) return 'Aucune zone pastorale connue sur votre tracé.';

  const zones = plural(crossings.length, 'zone pastorale', 'zones pastorales');
  const withDogs = crossings.filter((c) => c.status === 'flock-with-dogs').length;
  const withFlock = crossings.filter((c) => c.status === 'flock').length;
  const detail =
    withDogs > 0
      ? `, dont ${withDogs} avec chiens de protection`
      : withFlock > 0
        ? `, dont ${withFlock} avec troupeau prévu`
        : ', sans troupeau prévu ce jour-là';
  return `Votre tracé traverse ${zones}${detail}.`;
}

/**
 * "Votre sortie" panel, shown after a GPX import: outing date and activity,
 * zones crossed in order, advice. Zone names are inserted as text, never as HTML.
 */
export function createOutingReportPanel({
  onDateChange,
  onActivityChange,
  onClose,
  extra,
}: {
  onDateChange: (date: string) => void;
  onActivityChange: (activity: Activity) => void;
  onClose: () => void;
  /** A section kept as is across refreshes (e.g. the observation form, with what the user typed). */
  extra?: HTMLElement;
}): OutingReportPanel {
  const panel = element('aside', { className: 'zone-sheet outing-report', hidden: true });
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Votre sortie');

  const hide = () => {
    panel.hidden = true;
  };

  const show = (report: OutingReport) => {
    const close = element('button', { type: 'button', className: 'zone-sheet-close', textContent: '×' });
    close.setAttribute('aria-label', 'Fermer');
    close.addEventListener('click', () => {
      hide();
      onClose();
    });

    const date = element('input', { type: 'date', value: report.date });
    date.addEventListener('change', () => {
      const day = parseDay(date.value);
      if (day) onDateChange(day);
    });

    const crossings = element('ol', { className: 'crossings' });
    for (const crossing of report.crossings) {
      const swatch = element('span', { className: 'zone-legend-swatch' });
      swatch.style.backgroundColor = ZONE_STYLES[crossing.status].color;
      const presence = crossing.zone.presence;
      crossings.append(
        element(
          'li',
          { className: 'crossing' },
          element('p', { className: 'zone-sheet-status' }, swatch, element('span', { textContent: crossing.zone.name })),
          element('p', { textContent: ZONE_STYLES[crossing.status].label }),
          element('p', {
            textContent: `Au km ${frenchNumber(crossing.entryKm)}, sur ${frenchNumber(Math.max(crossing.insideKm, 0.1))} km`,
          }),
          ...(presence
            ? [element('p', { className: 'crossing-period', textContent: `Troupeau prévu du ${frenchDay(presence.start)} au ${frenchDay(presence.end)}` })]
            : []),
        ),
      );
    }

    panel.replaceChildren(
      close,
      element('h2', { textContent: 'Votre sortie' }),
      element('p', { className: 'zone-sheet-quarter', textContent: `${report.name} — ${frenchNumber(report.lengthKm)} km` }),
      element('label', { className: 'outing-date' }, element('span', { textContent: 'Date de la sortie' }), date),
      renderActivityChoice(report.activity, 'outing-activity', onActivityChange),
      element('p', { className: 'outing-summary', textContent: summary(report) }),
      ...(report.crossings.length > 0 ? [crossings] : []),
      ...renderSightings(report),
      ...(report.advice.length > 0 ? [element('h3', { textContent: 'Les bons réflexes' }), renderAdviceList(report.advice)] : []),
      ...(extra ? [extra] : []),
      element(
        'footer',
        {},
        element('p', { textContent: "Analyse faite sur votre appareil : votre tracé n'est envoyé nulle part." }),
        element('p', { textContent: DISCLAIMER }),
      ),
    );
    panel.hidden = false;
  };

  return { element: panel, show, hide };
}
