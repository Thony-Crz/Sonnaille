// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createOfflineNotice } from './offline-notice';

describe('createOfflineNotice', () => {
  const fakeWindow = (online: boolean) => {
    const target = new EventTarget() as EventTarget & { navigator: { onLine: boolean } };
    target.navigator = { onLine: online };
    return target;
  };

  it('stays hidden while online', () => {
    expect(createOfflineNotice(fakeWindow(true)).hidden).toBe(true);
  });

  it('tells what still works when offline', () => {
    const notice = createOfflineNotice(fakeWindow(false));

    expect(notice.hidden).toBe(false);
    expect(notice.textContent).toBe('Hors ligne : les fonds et les zones déjà consultés restent disponibles.');
  });

  it('follows the connection', () => {
    const win = fakeWindow(true);
    const notice = createOfflineNotice(win);

    win.navigator.onLine = false;
    win.dispatchEvent(new Event('offline'));
    expect(notice.hidden).toBe(false);

    win.navigator.onLine = true;
    win.dispatchEvent(new Event('online'));
    expect(notice.hidden).toBe(true);
  });
});
