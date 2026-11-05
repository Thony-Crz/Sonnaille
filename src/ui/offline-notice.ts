/** Banner shown while offline (V1): what still works without network. */
export function createOfflineNotice(win: EventTarget & { navigator: { onLine: boolean } }): HTMLElement {
  const notice = document.createElement('div');
  notice.className = 'offline-notice';
  notice.setAttribute('role', 'status');
  notice.textContent = 'Hors ligne : les fonds et les zones déjà consultés restent disponibles.';

  const update = () => {
    notice.hidden = win.navigator.onLine;
  };
  win.addEventListener('online', update);
  win.addEventListener('offline', update);
  update();
  return notice;
}
