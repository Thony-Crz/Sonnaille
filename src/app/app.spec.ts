import { TestBed } from '@angular/core/testing';
import { App } from './app';
import type { AppSettings } from './settings';
import { FakeMap } from './testing/fake-map';
import { fakePorts } from './testing/fake-ports';
import { MAP_FACTORY } from './tokens';

/** The whole front over fake ports and a fake map. */
async function setup(options: { settings?: Partial<AppSettings>; welcomeSeen?: boolean } = {}) {
  const map = new FakeMap();
  const { providers } = fakePorts(options);
  TestBed.configureTestingModule({ providers: [...providers, { provide: MAP_FACTORY, useValue: () => map }] });
  const fixture = TestBed.createComponent(App);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  return { fixture, map, host, text: () => host.textContent ?? '' };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('App', () => {
  it('shows the map and, over it, the panels from the top left', async () => {
    const { host } = await setup();

    expect(host.querySelector('[role="region"]')?.getAttribute('aria-label')).toBe('Carte du territoire pastoral');
    const panels = [...host.querySelectorAll('.map-panels-top-left > *')].map((p) => p.tagName.toLowerCase());
    expect(panels).toEqual(['son-base-map-switcher', 'son-track-import', 'son-my-sightings', 'div']);
    expect(host.querySelector('.map-panels-bottom-left .zone-legend')).not.toBeNull();
  });

  it('shows the source of the zones under the legend', async () => {
    const { host } = await setup();

    expect(host.querySelector('.zone-legend-note')?.textContent).toContain('Source : Map Patou');
  });

  it('opens the sheet of a tapped zone, and closes it', async () => {
    const { map, host, fixture } = await setup();

    map.tapZone(map.zones[0]!);
    fixture.detectChanges();
    expect(host.querySelector('son-zone-sheet h2')?.textContent).toBe('Alpage du Serre');

    host.querySelector<HTMLButtonElement>('son-zone-sheet .zone-sheet-close')!.click();
    fixture.detectChanges();
    expect(host.querySelector('son-zone-sheet')).toBeNull();
  });

  it('opens "Comprendre"', async () => {
    const { host, fixture } = await setup();

    host.querySelector<HTMLButtonElement>('button.understand-button')!.click();
    fixture.detectChanges();

    expect(host.querySelector('son-understand h2')?.textContent).toBe('Comprendre');
  });

  it('welcomes on the first visit only', async () => {
    const { host, fixture } = await setup({ welcomeSeen: false });

    host.querySelector<HTMLButtonElement>('button.welcome-ok')!.click();
    fixture.detectChanges();

    expect(host.querySelector('son-welcome')).toBeNull();
  });

  it('heads the panels with the demo banner in demo mode', async () => {
    const { host } = await setup({ settings: { demo: true } });

    expect(host.querySelector('.map-panels-top-left > :first-child')?.tagName.toLowerCase()).toBe('son-demo-banner');
  });
});
