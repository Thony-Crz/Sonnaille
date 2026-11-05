// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ZoneSheet } from '../application/zone-sheet';
import { createZoneSheetPanel } from './zone-sheet-panel';

const sheet: ZoneSheet = {
  name: 'Alpage A',
  quarter: 'Quartier A',
  status: 'flock-with-dogs',
  presence: { start: '2026-06-15', end: '2026-09-30', species: ['sheep', 'goats'], guardDogs: true },
  activity: 'trail',
  advice: [
    {
      id: 'dog-comes',
      situation: "Un chien de protection s'approche",
      message: 'Arrêtez-vous, ne courez pas.',
      detail: 'Il vient vous identifier.',
      source: { label: 'Pasto Kézako', url: 'https://www.pasto-kezako.fr/rencontre-chiens-de-protection/' },
      appliesTo: { statuses: ['flock-with-dogs'] },
    },
  ],
  source: 'Map Patou — Réseau Pastoral AuRA',
  fetchedAt: '2026-07-15T05:00:00.000Z',
};

const setup = () => {
  const onActivityChange = vi.fn();
  const onClose = vi.fn();
  const panel = createZoneSheetPanel({ onActivityChange, onClose });
  document.body.append(panel.element);
  return { panel, onActivityChange, onClose, text: () => panel.element.textContent ?? '' };
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createZoneSheetPanel', () => {
  it('is hidden until a zone is selected', () => {
    const { panel } = setup();

    expect(panel.element.hidden).toBe(true);
  });

  it('shows the zone, its status and its planned flock', () => {
    const { panel, text } = setup();

    panel.show(sheet);

    expect(panel.element.hidden).toBe(false);
    expect(panel.element.querySelector('h2')?.textContent).toBe('Alpage A');
    expect(text()).toContain('Quartier A');
    expect(text()).toContain('Troupeau avec chiens de protection');
    expect(text()).toContain('Troupeau prévu du 15/06/2026 au 30/09/2026');
    expect(text()).toContain('Ovins, caprins');
    expect(text()).toContain('Chiens de protection : oui');
  });

  it('says when no flock is planned', () => {
    const { panel, text } = setup();

    panel.show({ ...sheet, status: 'no-flock', presence: null, advice: [] });

    expect(text()).toContain('Pas de troupeau prévu ce jour-là dans le calendrier.');
  });

  it('lets the user say how they move, and reports a change', () => {
    const { panel, onActivityChange } = setup();
    panel.show(sheet);

    const radios = [...panel.element.querySelectorAll<HTMLInputElement>('input[name="activity"]')];
    expect(radios.map((r) => [r.value, r.closest('label')?.textContent, r.checked])).toEqual([
      ['hiking', 'À pied', false],
      ['trail', 'En trail', true],
      ['mtb', 'À VTT', false],
    ]);

    radios[2]?.click();
    expect(onActivityChange).toHaveBeenCalledWith('mtb');
  });

  it('shows each advice: short message, detail on demand, cited source', () => {
    const { panel } = setup();

    panel.show(sheet);

    const item = panel.element.querySelector('.advice');
    expect(item?.querySelector('strong')?.textContent).toBe('Arrêtez-vous, ne courez pas.');
    expect(item?.querySelector('details summary')?.textContent).toBe('En savoir plus');
    expect(item?.querySelector('details')?.textContent).toContain('Il vient vous identifier.');
    const link = item?.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://www.pasto-kezako.fr/rencontre-chiens-de-protection/');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.textContent).toBe('Pasto Kézako');
  });

  it('warns that nothing is guaranteed and that advice is not yet reviewed', () => {
    const { panel, text } = setup();

    panel.show(sheet);

    expect(text()).toContain("L'application ne garantit pas l'absence de troupeau ou de chien.");
    expect(text()).toContain('pas encore été relus par un professionnel du pastoralisme');
  });

  it('credits the zone data and its date', () => {
    const { panel, text } = setup();

    panel.show(sheet);

    expect(text()).toContain('Zones : Map Patou — Réseau Pastoral AuRA, données du 15/07/2026');
  });

  it('closes', () => {
    const { panel, onClose } = setup();
    panel.show(sheet);

    panel.element.querySelector<HTMLButtonElement>('button.zone-sheet-close')?.click();

    expect(onClose).toHaveBeenCalled();
    expect(panel.element.hidden).toBe(true);
  });
});
