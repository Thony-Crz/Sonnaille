import type { ObservationOnMap } from '../application/ports';
import { isFlock } from '../domain/observation';
import { element } from './dom';
import { DOG_ICON, iconDataUrl, sightingIcon } from './sighting-icons';
import { STING_WARNING, describeSighting, sightingTip } from './sighting-labels';

/** The sheet of a tapped sighting: what it is, when, the distance to keep, the right move. */
export function createSightingSheet({ onClose }: { onClose: () => void }) {
  const panel = element('aside', { className: 'zone-sheet sighting-sheet', hidden: true });
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Fiche du signalement');

  const hide = () => {
    panel.hidden = true;
  };

  const show = ({ observation, recent, haloMeters }: ObservationOnMap) => {
    const close = element('button', { type: 'button', className: 'zone-sheet-close', textContent: '×' });
    close.setAttribute('aria-label', 'Fermer');
    close.addEventListener('click', () => {
      hide();
      onClose();
    });

    const what = describeSighting(observation);
    const pictures = element('div', { className: 'sighting-pictures' });
    pictures.append(element('img', { className: 'sighting-picture', src: iconDataUrl(sightingIcon(observation)), alt: what, width: 56, height: 56 }));
    if (isFlock(observation) && observation.guardDogs) {
      pictures.append(element('img', { className: 'sighting-dog-badge', src: iconDataUrl(DOG_ICON), alt: 'Chiens de protection', width: 28, height: 28 }));
    }

    const when = new Date(observation.observedAt);
    const time = when.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const age = recent ? [] : [element('p', { className: 'sighting-old', textContent: isFlock(observation) ? 'Signalement ancien : les bêtes ont pu partir.' : 'Signalement ancien : à vérifier sur place.' })];

    panel.replaceChildren(
      close,
      pictures,
      element('h2', { textContent: what }),
      element('p', { textContent: `Signalé le ${when.toLocaleDateString('fr-FR')} vers ${time}.` }),
      ...age,
      element('p', { textContent: `Zone de prudence : ${haloMeters} m autour du point.` }),
      element('p', { className: 'sighting-tip' }, element('strong', { textContent: 'Le bon réflexe : ' }), sightingTip(observation)),
      ...(isFlock(observation) ? [] : [element('p', { textContent: STING_WARNING })]),
      element('p', { className: 'zone-sheet-disclaimer', textContent: 'Signalement d’un utilisateur, non vérifié sur place.' }),
    );
    panel.hidden = false;
  };

  return { element: panel, show, hide };
}
