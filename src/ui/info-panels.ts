import type { Advice } from '../domain/advice';
import { DISCLAIMER, renderAdviceList } from './advice-list';
import { element } from './dom';

// Texts shown to users, hence in French. Statements about guard dogs come from
// the sources cited in the "Comprendre" panel.
const GUARANTEE = "L'application ne garantit pas l'absence de troupeau ou de chien.";

const link = (href: string, text: string) => element('a', { href, target: '_blank', rel: 'noopener', textContent: text });

/** Shown once, on the first visit: what Sonnaille does, privacy, and what it does not guarantee. */
export function createWelcomeDialog({ onClose }: { onClose: () => void }): HTMLElement {
  const close = element('button', { type: 'button', className: 'welcome-ok', textContent: "J'ai compris" });
  const dialog = element(
    'div',
    { className: 'welcome' },
    element(
      'div',
      { className: 'welcome-box' },
      element('h2', { textContent: 'Bienvenue sur Sonnaille' }),
      element('p', {
        textContent:
          'Préparez votre sortie en territoire pastoral : la carte montre les zones où des troupeaux sont prévus, ' +
          'importez votre tracé GPX pour savoir lesquelles vous traversez et comment vous comporter.',
      }),
      element('p', { textContent: "Vos tracés GPX restent sur votre appareil : ils ne sont envoyés nulle part." }),
      element('p', { className: 'welcome-warning', textContent: `${GUARANTEE} Les calendriers de présence sont prévisionnels.` }),
      close,
    ),
  );
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'Bienvenue sur Sonnaille');
  close.addEventListener('click', () => {
    dialog.remove();
    onClose();
  });
  return dialog;
}

/** "Comprendre" panel, available at any time: guard dogs, every advice, sources and credits. */
export function createUnderstandPanel({ advice }: { advice: Advice[] }): { element: HTMLElement; open(): void } {
  const panel = element('aside', { className: 'zone-sheet understand', hidden: true });
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Comprendre');

  const close = element('button', { type: 'button', className: 'zone-sheet-close', textContent: '×' });
  close.setAttribute('aria-label', 'Fermer');
  close.addEventListener('click', () => {
    panel.hidden = true;
  });

  panel.append(
    close,
    element('h2', { textContent: 'Comprendre' }),
    element('h3', { textContent: 'Le chien de protection' }),
    element('p', {
      textContent:
        'Le chien de protection, souvent appelé patou, vit avec le troupeau et le protège des prédateurs : loups, lynx, chiens errants. ' +
        "Quand il vient vers vous, il cherche à vous identifier, souvent à l'odeur. Il réagit à ce qu'il perçoit comme une menace, " +
        'notamment la vitesse.',
    }),
    element('h3', { textContent: 'Les bons réflexes' }),
    renderAdviceList(advice),
    element('h3', { textContent: 'Sources et crédits' }),
    element(
      'ul',
      { className: 'credits' },
      element('li', {}, 'Zones et calendriers : ', link('https://www.pasto-kezako.fr/', 'Map Patou'), ', Réseau Pastoral Auvergne-Rhône-Alpes (INRAE).'),
      element('li', {}, 'Conseils : ', link('https://www.pasto-kezako.fr/rencontre-chiens-de-protection/', 'Pasto Kézako'), '.'),
      element('li', {}, 'Fonds de carte : © IGN (Plan IGN, photographies aériennes), © contributeurs ', link('https://www.openstreetmap.org/copyright', 'OpenStreetMap'), '.'),
    ),
    element('footer', {}, element('p', { textContent: DISCLAIMER })),
  );

  return {
    element: panel,
    open: () => {
      panel.hidden = false;
    },
  };
}
