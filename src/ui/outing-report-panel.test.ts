// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { OutingReport } from '../application/prepare-outing';
import type { PastoralZone } from '../domain/pastoral-zone';
import { createOutingReportPanel } from './outing-report-panel';

const zone = (id: string, name: string, guardDogs: boolean): PastoralZone => ({
  id,
  name,
  quarter: '',
  geometry: [],
  presence: { start: '2026-06-15', end: '2026-09-30', species: ['sheep'], guardDogs, weekdays: [1, 2, 3, 4, 5, 6, 7] },
});

const report: OutingReport = {
  name: 'Tour des Hauts-Plateaux',
  date: '2026-07-15',
  activity: 'hiking',
  lengthKm: 15.5,
  crossings: [
    { zone: zone('A', 'Alpage A', false), status: 'flock', entry: { longitude: 5.7, latitude: 45 }, entryKm: 2.3, insideKm: 1.2 },
    { zone: zone('B', 'Alpage B', true), status: 'flock-with-dogs', entry: { longitude: 5.7, latitude: 45 }, entryKm: 7.8, insideKm: 3.4 },
  ],
  mostCautious: 'flock-with-dogs',
  advice: [
    {
      id: 'dog',
      situation: "Un chien de protection s'approche",
      message: 'Arrêtez-vous.',
      detail: 'Détail.',
      source: { label: 'Pasto Kézako', url: 'https://www.pasto-kezako.fr/' },
      appliesTo: { statuses: ['flock-with-dogs'] },
    },
  ],
};

const setup = () => {
  const handlers = { onDateChange: vi.fn(), onActivityChange: vi.fn(), onClose: vi.fn() };
  const panel = createOutingReportPanel(handlers);
  document.body.append(panel.element);
  return { panel, ...handlers, text: () => panel.element.textContent ?? '' };
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createOutingReportPanel', () => {
  it('is hidden until a track is analysed', () => {
    expect(setup().panel.element.hidden).toBe(true);
  });

  it('presents the outing', () => {
    const { panel, text } = setup();

    panel.show(report);

    expect(panel.element.querySelector('h2')?.textContent).toBe('Votre sortie');
    expect(text()).toContain('Tour des Hauts-Plateaux — 15,5 km');
  });

  it('lets the user change the outing date', () => {
    const { panel, onDateChange } = setup();
    panel.show(report);
    const date = panel.element.querySelector<HTMLInputElement>('input[type="date"]')!;

    expect(date.value).toBe('2026-07-15');
    date.value = '2026-08-01';
    date.dispatchEvent(new Event('change'));

    expect(onDateChange).toHaveBeenCalledWith('2026-08-01');
  });

  it('ignores an empty date', () => {
    const { panel, onDateChange } = setup();
    panel.show(report);
    const date = panel.element.querySelector<HTMLInputElement>('input[type="date"]')!;

    date.value = '';
    date.dispatchEvent(new Event('change'));

    expect(onDateChange).not.toHaveBeenCalled();
  });

  it('lets the user change the activity', () => {
    const { panel, onActivityChange } = setup();
    panel.show(report);

    panel.element.querySelector<HTMLInputElement>('input[name="outing-activity"][value="trail"]')?.click();

    expect(onActivityChange).toHaveBeenCalledWith('trail');
  });

  it('sums up the zones crossed', () => {
    const { panel, text } = setup();

    panel.show(report);

    expect(text()).toContain('Votre tracé traverse 2 zones pastorales, dont 1 avec chiens de protection.');
  });

  it('lists each zone crossed, in order, with where and how long', () => {
    const { panel } = setup();

    panel.show(report);

    const items = [...panel.element.querySelectorAll('.crossing')].map((li) => li.textContent);
    expect(items).toHaveLength(2);
    expect(items[0]).toContain('Alpage A');
    expect(items[0]).toContain('Troupeau prévu');
    expect(items[0]).toContain('Au km 2,3, sur 1,2 km');
    expect(items[1]).toContain('Troupeau avec chiens de protection');
    expect(items[1]).toContain('du 15/06/2026 au 30/09/2026');
  });

  it('says when no pastoral zone is on the track', () => {
    const { panel, text } = setup();

    panel.show({ ...report, crossings: [], mostCautious: null, advice: [] });

    expect(text()).toContain('Aucune zone pastorale connue sur votre tracé.');
    expect(panel.element.querySelector('.crossing')).toBeNull();
  });

  it('gives the advice for the outing', () => {
    const { panel } = setup();

    panel.show(report);

    expect(panel.element.querySelector('.advice strong')?.textContent).toBe('Arrêtez-vous.');
  });

  it('reminds that the track stays on the device and that nothing is guaranteed', () => {
    const { panel, text } = setup();

    panel.show(report);

    expect(text()).toContain("Analyse faite sur votre appareil : votre tracé n'est envoyé nulle part.");
    expect(text()).toContain("L'application ne garantit pas l'absence de troupeau ou de chien.");
  });

  it('closes', () => {
    const { panel, onClose } = setup();
    panel.show(report);

    panel.element.querySelector<HTMLButtonElement>('.zone-sheet-close')?.click();

    expect(panel.element.hidden).toBe(true);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('createOutingReportPanel extra section', () => {
  it('keeps the same extra section (e.g. the observation form) across refreshes', () => {
    const extra = document.createElement('section');
    const panel = createOutingReportPanel({ onDateChange: vi.fn(), onActivityChange: vi.fn(), onClose: vi.fn(), extra });

    panel.show(report);
    panel.show({ ...report, date: '2026-08-01' });

    expect(panel.element.contains(extra)).toBe(true);
    expect(panel.element.querySelectorAll('section')).toHaveLength(1);
  });
});
