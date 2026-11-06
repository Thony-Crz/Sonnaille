import { element } from './dom';

/**
 * Demo mode banner: everything shown is fictional, nothing leaves the device.
 * Offers the demo track, a way to start again, and a way out.
 */
export function createDemoBanner({ gpxUrl, exitUrl, onReset }: { gpxUrl: string; exitUrl: string; onReset: () => void }): HTMLElement {
  const gpx = element('a', { className: 'demo-gpx', href: gpxUrl, textContent: 'Tracé de démo (GPX)' });
  gpx.setAttribute('download', '');
  const reset = element('button', { type: 'button', className: 'demo-reset', textContent: 'Recommencer' });
  reset.addEventListener('click', onReset);
  const exit = element('a', { className: 'demo-exit', href: exitUrl, textContent: 'Quitter la démo' });

  const banner = element(
    'div',
    { className: 'map-panel demo-banner' },
    element('span', { textContent: 'Mode démo : zones, tracé et signalements fictifs. Rien n’est envoyé.' }),
    gpx,
    reset,
    exit,
  );
  banner.setAttribute('role', 'status');
  return banner;
}
