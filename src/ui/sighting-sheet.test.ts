// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ObservationOnMap } from '../application/ports';
import { createSightingSheet } from './sighting-sheet';

afterEach(() => {
  document.body.innerHTML = '';
});

const here = { longitude: 5.65, latitude: 45.11 };
const hornets: ObservationOnMap = {
  observation: { id: 'n', observedAt: '2026-07-12T10:00:00.000Z', position: here, kind: 'hornet-nest' },
  recent: true,
  haloMeters: 50,
};
const sheep: ObservationOnMap = {
  observation: { id: 'f', observedAt: '2026-07-14T07:30:00.000Z', position: here, species: 'sheep', headcount: 'hundreds', guardDogs: true },
  recent: false,
  haloMeters: 300,
};

const setup = () => {
  const onClose = vi.fn();
  const sheet = createSightingSheet({ onClose });
  document.body.append(sheet.element);
  return { sheet, onClose };
};

describe('createSightingSheet: what a tapped sighting is, and what to do', () => {
  it('shows the picture, the kind, the distance to keep and the right move for a hornet nest', () => {
    const { sheet } = setup();

    sheet.show(hornets);

    const text = sheet.element.textContent!;
    expect(sheet.element.hidden).toBe(false);
    expect(sheet.element.querySelector('h2')?.textContent).toBe('Nid de frelons');
    expect(sheet.element.querySelector<HTMLImageElement>('img.sighting-picture')?.alt).toBe('Nid de frelons');
    expect(text).toContain('Signalé le 12/07/2026');
    expect(text).toContain('Zone de prudence : 50 m autour du point.');
    expect(text).toContain('Éloignez-vous sans bruit ni gestes brusques ; ne vous arrêtez pas près du nid.');
    expect(text).toContain('Allergique aux piqûres ? Gardez votre traitement sur vous.');
    expect(text).toContain('Signalement d’un utilisateur, non vérifié sur place.');
  });

  it('for a flock with guard dogs: the dog badge, the dogs advice, and says when it is old', () => {
    const { sheet } = setup();

    sheet.show(sheep);

    const text = sheet.element.textContent!;
    expect(sheet.element.querySelector('h2')?.textContent).toBe('Moutons, des centaines, chiens de protection vus');
    expect(sheet.element.querySelector('img.sighting-dog-badge')).not.toBeNull();
    expect(text).toContain('Arrêtez-vous, laissez les chiens vous identifier, puis contournez calmement.');
    expect(text).toContain('Signalement ancien : les bêtes ont pu partir.');
    expect(text).not.toContain('piqûres');
  });

  it('closes', () => {
    const { sheet, onClose } = setup();
    sheet.show(hornets);

    sheet.element.querySelector<HTMLButtonElement>('button.zone-sheet-close')!.click();

    expect(sheet.element.hidden).toBe(true);
    expect(onClose).toHaveBeenCalled();
  });
});
