// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Observation } from '../domain/observation';
import { createMySightings, createSightingForm } from './sightings';

afterEach(() => {
  document.body.innerHTML = '';
});

const here = { longitude: 5.65, latitude: 45.11 };

describe('createSightingForm', () => {
  const setup = () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const form = createSightingForm({ onSave, onCancel });
    document.body.append(form.element);
    const $ = <T extends Element>(s: string) => form.element.querySelector<T>(s)!;
    return { form, onSave, onCancel, $ };
  };

  it('is hidden until a point is chosen', () => {
    expect(setup().form.element.hidden).toBe(true);
  });

  it('asks when, which animals, how many and whether guard dogs were seen; never free text', () => {
    const { form, $ } = setup();

    form.open(here, { date: '2026-07-15', time: '09:30' });

    expect(form.element.hidden).toBe(false);
    expect(form.element.querySelector('h2')?.textContent).toBe('Signaler des animaux vus');
    expect($<HTMLInputElement>('input[type="date"]').value).toBe('2026-07-15');
    expect($<HTMLInputElement>('input[type="time"]').value).toBe('09:30');
    expect(form.element.querySelectorAll('select[name="species"] option')).toHaveLength(6);
    expect(form.element.querySelectorAll('input[name="sighting-headcount"]')).toHaveLength(3);
    expect($<HTMLInputElement>('input[name="sighting-dogs"]').type).toBe('checkbox');
    expect(form.element.querySelector('textarea, input[type="text"]')).toBeNull();
  });

  it('saves the sighting at the chosen point', () => {
    const { form, $, onSave } = setup();
    form.open(here, { date: '2026-07-15', time: '09:30' });
    $<HTMLSelectElement>('select[name="species"]').value = 'donkeys';
    $<HTMLInputElement>('input[name="sighting-headcount"][value="few"]').checked = true;

    $<HTMLButtonElement>('button[type="submit"]').click();

    expect(onSave).toHaveBeenCalledWith({
      position: here,
      date: '2026-07-15',
      time: '09:30',
      species: 'donkeys',
      headcount: 'few',
      guardDogs: false,
    });
    expect(form.element.hidden).toBe(true);
  });

  it('refuses a missing date or time', () => {
    const { form, $, onSave } = setup();
    form.open(here, { date: '2026-07-15', time: '09:30' });
    $<HTMLInputElement>('input[type="time"]').value = '';

    $<HTMLButtonElement>('button[type="submit"]').click();

    expect(onSave).not.toHaveBeenCalled();
    expect(form.element.querySelector('.observation-error')?.textContent).toBe('Indiquez le jour et l’heure.');
  });

  it('can be cancelled', () => {
    const { form, onCancel } = setup();
    form.open(here, { date: '2026-07-15', time: '09:30' });

    form.element.querySelector<HTMLButtonElement>('button.sighting-cancel')?.click();

    expect(onCancel).toHaveBeenCalled();
    expect(form.element.hidden).toBe(true);
  });
});

describe('createMySightings', () => {
  const sighting = (id: string): Observation => ({
    id,
    observedAt: '2026-07-15T07:30:00.000Z',
    position: here,
    species: 'donkeys',
    headcount: 'few',
    guardDogs: true,
  });
  const setup = () => {
    const handlers = { onReport: vi.fn(), onDelete: vi.fn(), onPublish: vi.fn() };
    const panel = createMySightings(handlers);
    document.body.append(panel.element);
    return { panel, ...handlers };
  };

  it('offers a visible "Signaler des animaux vus" button', () => {
    const { panel, onReport } = setup();

    const button = panel.element.querySelector<HTMLButtonElement>('button.sighting-report')!;
    button.click();

    expect(button.textContent).toBe('Signaler des animaux vus');
    expect(onReport).toHaveBeenCalled();
  });

  it('tells the user to tap the map while picking, and lets them cancel', () => {
    const { panel, onReport } = setup();

    panel.setPicking(true);
    const button = panel.element.querySelector<HTMLButtonElement>('button.sighting-report')!;

    expect(panel.element.textContent).toContain('Touchez la carte là où vous avez vu les animaux.');
    expect(button.textContent).toBe('Annuler');
    button.click();
    expect(onReport).toHaveBeenCalledTimes(1);
  });

  it('lists the sightings kept on the device, and deletes one', () => {
    const { panel, onDelete } = setup();

    panel.setList([sighting('a')]);

    const item = panel.element.querySelector('.my-sighting')!;
    expect(panel.element.querySelector('summary')?.textContent).toBe('Mes signalements (1)');
    expect(item.textContent).toContain('Ânes, quelques bêtes, chiens de protection vus');
    item.querySelector<HTMLButtonElement>('button')?.click();
    expect(onDelete).toHaveBeenCalledWith('a');
  });

  it('publishes all the sightings', () => {
    const { panel, onPublish } = setup();
    panel.setList([sighting('a')]);

    panel.element.querySelector<HTMLButtonElement>('button.sighting-publish')?.click();

    expect(onPublish).toHaveBeenCalled();
  });

  it('says when there is nothing yet', () => {
    const { panel } = setup();

    panel.setList([]);

    expect(panel.element.textContent).toContain('Aucun signalement pour l’instant.');
    expect(panel.element.querySelector('button.sighting-publish')).toBeNull();
  });
});
