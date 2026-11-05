import type { ZoneSheet } from '../application/zone-sheet';
import { ACTIVITIES, type Activity } from '../domain/advice';
import type { Species } from '../domain/pastoral-zone';
import { ZONE_STYLES } from './zone-styles';

export interface ZoneSheetPanel {
  element: HTMLElement;
  show(sheet: ZoneSheet): void;
  hide(): void;
}

// Texts shown to users, hence in French.
const ACTIVITY_LABELS: Record<Activity, string> = { hiking: 'À pied', trail: 'En trail', mtb: 'À VTT' };
const SPECIES_LABELS: Record<Species, string> = {
  sheep: 'ovins',
  cattle: 'bovins',
  goats: 'caprins',
  horses: 'équins',
  mixed: 'troupeau mixte',
};
const DISCLAIMER =
  "L'application ne garantit pas l'absence de troupeau ou de chien. " +
  "Ces conseils, tirés de sources publiques, n'ont pas encore été relus par un professionnel du pastoralisme.";

/** YYYY-MM-DD → DD/MM/YYYY. */
const frenchDay = (day: string) => day.split('-').reverse().join('/');

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  properties: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: Array<Node | string>
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), properties);
  node.append(...children);
  return node;
}

function speciesText(species: Species[]): string {
  const text = species.map((s) => SPECIES_LABELS[s]).join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The sheet of a selected zone: bottom sheet on phones, side panel on larger screens (CSS).
 * Zone names come from external data: they are always inserted as text, never as HTML.
 */
export function createZoneSheetPanel({
  onActivityChange,
  onClose,
}: {
  onActivityChange: (activity: Activity) => void;
  onClose: () => void;
}): ZoneSheetPanel {
  const panel = element('aside', { className: 'zone-sheet', hidden: true });
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Fiche de la zone');

  const hide = () => {
    panel.hidden = true;
  };

  const show = (sheet: ZoneSheet) => {
    const close = element('button', { type: 'button', className: 'zone-sheet-close', textContent: '×' });
    close.setAttribute('aria-label', 'Fermer');
    close.addEventListener('click', () => {
      hide();
      onClose();
    });

    const swatch = element('span', { className: 'zone-legend-swatch' });
    swatch.style.backgroundColor = ZONE_STYLES[sheet.status].color;

    const facts: HTMLElement[] = [];
    if (sheet.presence) {
      const period = `Troupeau prévu du ${frenchDay(sheet.presence.start)} au ${frenchDay(sheet.presence.end)}`;
      facts.push(element('p', { textContent: sheet.status === 'no-flock' ? `${period}, pas ce jour-là.` : `${period}.` }));
      if (sheet.presence.species.length > 0) facts.push(element('p', { textContent: speciesText(sheet.presence.species) }));
      facts.push(element('p', { textContent: `Chiens de protection : ${sheet.presence.guardDogs ? 'oui' : 'non'}` }));
    } else {
      facts.push(element('p', { textContent: 'Pas de troupeau prévu ce jour-là dans le calendrier.' }));
    }

    const activity = element('fieldset', { className: 'zone-sheet-activity' }, element('legend', { textContent: 'Je me déplace' }));
    for (const a of ACTIVITIES) {
      const input = element('input', { type: 'radio', name: 'activity', value: a, checked: a === sheet.activity });
      input.addEventListener('change', () => {
        if (input.checked) onActivityChange(a);
      });
      activity.append(element('label', {}, input, element('span', { textContent: ACTIVITY_LABELS[a] })));
    }

    const advice = element('ul', { className: 'zone-sheet-advice' });
    for (const item of sheet.advice) {
      const source = element('a', { href: item.source.url, target: '_blank', rel: 'noopener', textContent: item.source.label });
      advice.append(
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

    const fetched = new Date(sheet.fetchedAt).toLocaleDateString('fr-FR');
    panel.replaceChildren(
      close,
      element('h2', { textContent: sheet.name }),
      ...(sheet.quarter && sheet.quarter !== sheet.name ? [element('p', { className: 'zone-sheet-quarter', textContent: sheet.quarter })] : []),
      element('p', { className: 'zone-sheet-status' }, swatch, element('span', { textContent: ZONE_STYLES[sheet.status].label })),
      ...facts,
      activity,
      ...(sheet.advice.length > 0 ? [element('h3', { textContent: 'Les bons réflexes' }), advice] : []),
      element(
        'footer',
        {},
        element('p', { textContent: `Zones : ${sheet.source}, données du ${fetched}.` }),
        element('p', { textContent: DISCLAIMER }),
      ),
    );
    panel.hidden = false;
  };

  return { element: panel, show, hide };
}
