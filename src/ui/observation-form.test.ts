// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createObservationForm } from './observation-form';

afterEach(() => {
  document.body.innerHTML = '';
});

const setup = () => {
  const onSubmit = vi.fn();
  const form = createObservationForm({ onSubmit });
  document.body.append(form.element);
  form.setTrackLength(15.5);
  const $ = <T extends Element>(selector: string) => form.element.querySelector<T>(selector)!;
  return { form, onSubmit, $ };
};

describe('createObservationForm', () => {
  it('is a collapsible "Signaler un troupeau ou des animaux vus" section', () => {
    const { form } = setup();

    expect(form.element.tagName).toBe('DETAILS');
    expect(form.element.querySelector('summary')?.textContent).toBe('Signaler un troupeau ou des animaux vus');
  });

  it('asks only structured questions: no free text at all', () => {
    const { form } = setup();

    expect(form.element.querySelector('textarea')).toBeNull();
    expect(form.element.querySelector('input[type="text"], input:not([type])')).toBeNull();
  });

  it('offers the km along the track, the species, a rough headcount and guard dogs seen', () => {
    const { $, form } = setup();

    expect($<HTMLInputElement>('input[name="km"]').max).toBe('15.5');
    expect([...form.element.querySelectorAll<HTMLOptionElement>('select[name="species"] option')].map((o) => o.textContent)).toEqual([
      'Moutons (ovins)',
      'Vaches (bovins)',
      'Chèvres (caprins)',
      'Chevaux',
      'Ânes',
      'Troupeau mixte',
    ]);
    expect([...form.element.querySelectorAll<HTMLInputElement>('input[name="headcount"]')].map((r) => r.closest('label')?.textContent)).toEqual([
      'Quelques bêtes',
      'Quelques dizaines',
      'Des centaines',
    ]);
    expect($<HTMLInputElement>('input[name="guardDogs"]').type).toBe('checkbox');
  });

  it('sends the answers', () => {
    const { $, onSubmit } = setup();
    $<HTMLInputElement>('input[name="km"]').value = '4.2';
    $<HTMLSelectElement>('select[name="species"]').value = 'cattle';
    $<HTMLInputElement>('input[name="headcount"][value="hundreds"]').checked = true;
    $<HTMLInputElement>('input[name="guardDogs"]').checked = true;

    $<HTMLButtonElement>('button[type="submit"]').click();

    expect(onSubmit).toHaveBeenCalledWith({ km: 4.2, species: 'cattle', headcount: 'hundreds', guardDogs: true });
  });

  it('refuses a km outside the track', () => {
    const { $, onSubmit, form } = setup();
    $<HTMLInputElement>('input[name="km"]').value = '20';

    $<HTMLButtonElement>('button[type="submit"]').click();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(form.element.querySelector('.observation-error')?.textContent).toBe('Choisissez un kilomètre entre 0 et 15,5.');
  });

  it('shows the entry to add to the observations file, ready to copy', async () => {
    const { form } = setup();
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    form.showResult('{"type":"Feature"}', true);
    form.element.querySelector<HTMLButtonElement>('.observation-copy')?.click();
    await Promise.resolve();

    expect(form.element.querySelector('pre')?.textContent).toBe('{"type":"Feature"}');
    expect(form.element.textContent).toContain('content/observations.geojson');
    expect(writeText).toHaveBeenCalledWith('{"type":"Feature"}');
  });

  it('warns when the time could not be read from the GPX', () => {
    const { form } = setup();

    form.showResult('{}', false);

    expect(form.element.textContent).toContain("Votre GPX n'a pas d'heure : l'observation est datée de midi le jour de la sortie.");
  });
});
