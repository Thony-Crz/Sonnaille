import type { BaseMap } from '../../domain/base-map';
import { BaseMapSwitcherComponent } from './base-map-switcher.component';
import { DemoBannerComponent } from './demo-banner.component';
import { TrackImportComponent } from './track-import.component';
import { ZoneLegendComponent } from './zone-legend.component';
import { render } from '../testing/render';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('DemoBannerComponent', () => {
  const setup = () => render(DemoBannerComponent, { gpxUrl: '/Sonnaille/demo/trace.gpx', exitUrl: '/Sonnaille/' });

  it('says that everything is fictional and nothing is sent', () => {
    const { $ } = setup();

    expect($('.demo-banner').getAttribute('role')).toBe('status');
    expect($('.demo-banner').textContent).toContain('Mode démo : zones, tracé et signalements fictifs. Rien n’est envoyé.');
  });

  it('offers the demo track to download, a way to start again and a way out', () => {
    const { $, instance } = setup();
    const reset = vi.fn();
    instance.reset.subscribe(reset);

    $<HTMLButtonElement>('button.demo-reset').click();

    expect($<HTMLAnchorElement>('a.demo-gpx').getAttribute('href')).toBe('/Sonnaille/demo/trace.gpx');
    expect($('a.demo-gpx').hasAttribute('download')).toBe(true);
    expect($('a.demo-exit').textContent).toBe('Quitter la démo');
    expect(reset).toHaveBeenCalled();
  });
});

describe('BaseMapSwitcherComponent', () => {
  const baseMaps = [
    { id: 'ign-plan', label: 'Plan IGN' },
    { id: 'topo', label: 'Topographique' },
  ] as BaseMap[];
  const setup = () => render(BaseMapSwitcherComponent, { baseMaps, selected: 'topo' });

  it('is a collapsible panel titled "Fond de carte", one labelled option per base map, the selected one checked', () => {
    const { host } = setup();

    expect(host.querySelector('details > summary')?.textContent).toBe('Fond de carte');
    const radios = [...host.querySelectorAll<HTMLInputElement>('input[name="base-map"]')];
    expect(radios.map((r) => r.closest('label')?.textContent?.trim())).toEqual(['Plan IGN', 'Topographique']);
    expect(radios.find((r) => r.checked)?.value).toBe('topo');
  });

  it('reports the base map the user picks, and the marked trails', () => {
    const { $, instance } = setup();
    const changed = vi.fn();
    const trails = vi.fn();
    instance.changed.subscribe(changed);
    instance.trailsChange.subscribe(trails);

    $<HTMLInputElement>('input[value="ign-plan"]').click();
    $<HTMLInputElement>('input[name="marked-trails"]').click();

    expect(changed).toHaveBeenCalledWith('ign-plan');
    expect(trails).toHaveBeenCalledWith(true);
  });
});

describe('TrackImportComponent', () => {
  it('offers a button opening a GPX file picker, and says the file stays on the device', () => {
    const { $ } = render(TrackImportComponent);
    const picker = $<HTMLInputElement>('input[type="file"]');
    const opened = vi.spyOn(picker, 'click');

    $<HTMLButtonElement>('button').click();

    expect($('button').textContent).toBe('Importer un GPX');
    expect(picker.accept).toBe('.gpx,application/gpx+xml');
    expect(opened).toHaveBeenCalled();
    expect($('.track-import-privacy').textContent).toBe('Le fichier reste sur votre appareil.');
  });

  it('hands over the chosen file and shows the status', () => {
    const { $, instance, fixture } = render(TrackImportComponent);
    const file = vi.fn();
    instance.file.subscribe(file);
    const picker = $<HTMLInputElement>('input[type="file"]');
    const gpx = new File(['<gpx/>'], 'sortie.gpx');
    Object.defineProperty(picker, 'files', { value: [gpx] });

    picker.dispatchEvent(new Event('change'));
    fixture.componentRef.setInput('status', 'Sortie — 12,4 km');
    fixture.detectChanges();

    expect(file).toHaveBeenCalledWith(gpx);
    expect($('.track-import-status').textContent).toBe('Sortie — 12,4 km');
  });
});

describe('ZoneLegendComponent', () => {
  it('is a panel titled "Légende", open unless asked, listing the statuses from the most cautious', () => {
    const { host, fixture } = render(ZoneLegendComponent);

    expect(host.querySelector('details.zone-legend > summary')?.textContent).toBe('Légende');
    expect(host.querySelector<HTMLDetailsElement>('details.zone-legend')?.open).toBe(true);
    const labels = [...host.querySelectorAll('fieldset label')].map((l) => l.textContent?.trim());
    expect(labels).toEqual(['Troupeau avec chiens de protection', 'Troupeau prévu', 'Zone pastorale, pas de troupeau prévu']);

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    expect(host.querySelector<HTMLDetailsElement>('details.zone-legend')?.open).toBe(false);
  });

  it('reports a status the user hides', () => {
    const { $, instance } = render(ZoneLegendComponent);
    const toggle = vi.fn();
    instance.toggle.subscribe(toggle);

    $<HTMLInputElement>('input[value="no-flock"]').click();

    expect(toggle).toHaveBeenCalledWith({ status: 'no-flock', visible: false });
  });

  it('shows a note, with a link when given', () => {
    const { $ } = render(ZoneLegendComponent, {
      note: 'Zones pastorales indisponibles pour le moment.',
      link: { href: '?demo', label: 'Voir la démo' },
    });

    expect($('.zone-legend-note').textContent?.replace(/\s+/g, ' ').trim()).toBe('Zones pastorales indisponibles pour le moment. Voir la démo');
    expect($('.zone-legend-note a').getAttribute('href')).toBe('?demo');
  });

  it('puts the guard dog next to the "with guard dogs" zones, and explains every sighting picture', () => {
    const { host, $ } = render(ZoneLegendComponent);

    expect($('input[value="flock-with-dogs"]').closest('label')?.querySelector('img')?.alt).toBe('Chiens de protection');
    expect($('details.legend-pictures > summary').textContent).toBe('Signalements');
    expect([...host.querySelectorAll<HTMLImageElement>('.legend-pictures img')].map((i) => i.alt)).toEqual([
      'Moutons (ovins)',
      'Vaches (bovins)',
      'Chèvres (caprins)',
      'Chevaux',
      'Ânes',
      'Troupeau mixte',
      'Ruches',
      'Nid de guêpes',
      'Nid ou essaim d’abeilles',
      'Nid de frelons',
      'Chiens de protection vus',
    ]);
  });
});

