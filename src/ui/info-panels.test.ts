// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Advice } from '../domain/advice';
import { createUnderstandPanel, createWelcomeDialog } from './info-panels';

afterEach(() => {
  document.body.innerHTML = '';
});

const advice: Advice[] = [
  {
    id: 'a',
    situation: 'En approchant',
    message: 'Annoncez-vous.',
    detail: 'Détail.',
    source: { label: 'Pasto Kézako', url: 'https://www.pasto-kezako.fr/' },
    appliesTo: { statuses: ['flock'] },
  },
];

describe('createWelcomeDialog', () => {
  it('explains the app, keeps the track private and warns that nothing is guaranteed', () => {
    const dialog = createWelcomeDialog({ onClose: vi.fn() });
    const text = dialog.textContent ?? '';

    expect(dialog.querySelector('h2')?.textContent).toBe('Bienvenue sur Sonnaille');
    expect(text).toContain("L'application ne garantit pas l'absence de troupeau ou de chien.");
    expect(text).toContain('Vos tracés GPX restent sur votre appareil');
  });

  it('closes when the user has read it', () => {
    const onClose = vi.fn();
    const dialog = createWelcomeDialog({ onClose });
    document.body.append(dialog);

    dialog.querySelector('button')?.click();

    expect(dialog.querySelector('button')?.textContent).toBe("J'ai compris");
    expect(onClose).toHaveBeenCalled();
    expect(dialog.isConnected).toBe(false);
  });
});

describe('createUnderstandPanel', () => {
  it('is hidden until opened', () => {
    expect(createUnderstandPanel({ advice }).element.hidden).toBe(true);
  });

  it('explains guard dogs and lists every advice', () => {
    const panel = createUnderstandPanel({ advice });
    document.body.append(panel.element);

    panel.open();

    expect(panel.element.hidden).toBe(false);
    expect(panel.element.querySelector('h2')?.textContent).toBe('Comprendre');
    expect(panel.element.textContent).toContain('Le chien de protection');
    expect(panel.element.querySelector('.advice strong')?.textContent).toBe('Annoncez-vous.');
  });

  it('credits every data source', () => {
    const text = createUnderstandPanel({ advice }).element.textContent ?? '';

    for (const source of ['Map Patou', 'Réseau Pastoral', 'IGN', 'OpenStreetMap', 'Pasto Kézako']) {
      expect(text).toContain(source);
    }
  });

  it('closes', () => {
    const panel = createUnderstandPanel({ advice });
    panel.open();

    panel.element.querySelector<HTMLButtonElement>('.zone-sheet-close')?.click();

    expect(panel.element.hidden).toBe(true);
  });
});
