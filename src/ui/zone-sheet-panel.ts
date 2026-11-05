import type { ZoneSheet } from '../application/zone-sheet';
import type { Activity } from '../domain/advice';
import { DISCLAIMER, renderActivityChoice, renderAdviceList, speciesText } from './advice-list';
import { element, frenchDay } from './dom';
import { ZONE_STYLES } from './zone-styles';

export interface ZoneSheetPanel {
  element: HTMLElement;
  show(sheet: ZoneSheet): void;
  hide(): void;
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

    const fetched = new Date(sheet.fetchedAt).toLocaleDateString('fr-FR');
    panel.replaceChildren(
      close,
      element('h2', { textContent: sheet.name }),
      ...(sheet.quarter && sheet.quarter !== sheet.name ? [element('p', { className: 'zone-sheet-quarter', textContent: sheet.quarter })] : []),
      element('p', { className: 'zone-sheet-status' }, swatch, element('span', { textContent: ZONE_STYLES[sheet.status].label })),
      ...facts,
      renderActivityChoice(sheet.activity, 'activity', onActivityChange),
      ...(sheet.advice.length > 0 ? [element('h3', { textContent: 'Les bons réflexes' }), renderAdviceList(sheet.advice)] : []),
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
