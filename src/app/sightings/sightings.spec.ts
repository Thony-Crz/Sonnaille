import type { Observation } from '../../domain/observation';
import { render } from '../testing/render';
import { MySightingsComponent } from './my-sightings.component';
import { SightingFormComponent } from './sighting-form.component';

afterEach(() => {
  document.body.innerHTML = '';
});

const here = { longitude: 5.65, latitude: 45.11 };
const at = { position: here, date: '2026-07-15', time: '09:30' };

describe('SightingFormComponent', () => {
  const setup = () => {
    const view = render(SightingFormComponent, { at });
    const save = vi.fn();
    const cancel = vi.fn();
    view.instance.save.subscribe(save);
    view.instance.cancel.subscribe(cancel);
    return { ...view, save, cancel };
  };

  it('is closed until a point is chosen', () => {
    const { host } = render(SightingFormComponent);

    expect(host.querySelector('aside')).toBeNull();
  });

  it('asks when, what, which animals, how many and whether guard dogs were seen; never free text', () => {
    const { host, $ } = setup();

    expect($('h2').textContent).toBe('Signaler ce que vous avez vu');
    expect($<HTMLInputElement>('input[type="date"]').value).toBe('2026-07-15');
    expect($<HTMLInputElement>('input[type="time"]').value).toBe('09:30');
    expect(host.querySelectorAll('select[name="species"] option')).toHaveLength(6);
    expect(host.querySelectorAll('input[name="sighting-headcount"]')).toHaveLength(3);
    expect([...host.querySelectorAll('input[name="sighting-what"]')].map((c) => c.closest('label')?.textContent?.trim())).toEqual([
      'Un troupeau ou des animaux',
      'Des ruches',
      'Un nid de guêpes',
      'Un nid ou un essaim d’abeilles',
      'Un nid de frelons',
    ]);
    expect(host.querySelector('textarea, input[type="text"]')).toBeNull();
  });

  it('saves a flock at the chosen point', () => {
    const { $, save, fixture } = setup();
    $<HTMLSelectElement>('select[name="species"]').value = 'donkeys';
    $<HTMLInputElement>('input[name="sighting-headcount"][value="few"]').click();
    fixture.detectChanges();

    $<HTMLButtonElement>('button[type="submit"]').click();

    expect(save).toHaveBeenCalledWith({ ...at, what: { kind: 'flock', species: 'donkeys', headcount: 'few', guardDogs: false } });
  });

  it('hides the questions about animals for a nest, and saves only its kind', () => {
    const { $, save, fixture } = setup();

    $<HTMLInputElement>('input[name="sighting-what"][value="hornet-nest"]').click();
    fixture.detectChanges();
    expect($<HTMLElement>('.sighting-animals').hidden).toBe(true);
    $<HTMLButtonElement>('button[type="submit"]').click();

    expect(save).toHaveBeenCalledWith({ ...at, what: { kind: 'hornet-nest' } });
  });

  it('refuses a missing time, and can be cancelled', () => {
    const { $, save, cancel, fixture } = setup();
    $<HTMLInputElement>('input[type="time"]').value = '';

    $<HTMLButtonElement>('button[type="submit"]').click();
    fixture.detectChanges();
    $<HTMLButtonElement>('button.sighting-cancel').click();

    expect(save).not.toHaveBeenCalled();
    expect($('.observation-error').textContent).toBe('Indiquez le jour et l’heure.');
    expect(cancel).toHaveBeenCalled();
  });
});

describe('MySightingsComponent', () => {
  const donkeys: Observation = { id: 'a', observedAt: '2026-07-15T07:30:00.000Z', position: here, species: 'donkeys', headcount: 'few', guardDogs: true };
  const nest: Observation = { id: 'n', observedAt: '2026-07-15T07:30:00.000Z', position: here, kind: 'bee-nest' };

  it('offers a visible "Signaler animaux, ruches ou nids" button, which becomes "Annuler" while picking', () => {
    const { $, instance, update } = render(MySightingsComponent);
    const report = vi.fn();
    instance.report.subscribe(report);

    $<HTMLButtonElement>('button.sighting-report').click();
    expect($('button.sighting-report').textContent?.trim()).toBe('Signaler animaux, ruches ou nids');
    update({ picking: true });

    expect($('button.sighting-report').textContent?.trim()).toBe('Annuler');
    expect($('.sightings-entry').textContent).toContain('Touchez la carte là où vous avez vu les animaux, les ruches ou le nid.');
    expect(report).toHaveBeenCalledTimes(1);
  });

  it('lists the sightings kept on the device, deletes one, publishes them all', () => {
    const { $, host, instance } = render(MySightingsComponent, { sightings: [donkeys, nest] });
    const remove = vi.fn();
    const publish = vi.fn();
    instance.remove.subscribe(remove);
    instance.publish.subscribe(publish);

    const items = host.querySelectorAll('.my-sighting');
    items[0]!.querySelector<HTMLButtonElement>('button')!.click();
    $<HTMLButtonElement>('button.sighting-publish').click();

    expect($('summary').textContent).toBe('Mes signalements (2)');
    expect(items[0]!.textContent).toContain('Ânes, quelques bêtes, chiens de protection vus');
    expect(items[1]!.textContent).toContain('Nid ou essaim d’abeilles');
    expect(remove).toHaveBeenCalledWith('a');
    expect(publish).toHaveBeenCalled();
  });

  it('says when there is nothing yet, and shows the note', () => {
    const { $, host } = render(MySightingsComponent, { note: 'Enregistré dans « Mes signalements ».' });

    expect(host.textContent).toContain('Aucun signalement pour l’instant.');
    expect(host.querySelector('button.sighting-publish')).toBeNull();
    expect($('.sighting-note').textContent).toBe('Enregistré dans « Mes signalements ».');
  });
});
