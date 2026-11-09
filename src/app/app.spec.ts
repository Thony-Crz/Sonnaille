import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { SonnailleStore } from './sonnaille.store';
import { MAP_FACTORY } from './tokens';

describe('App', () => {
  it('shows the map region', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MAP_FACTORY, useValue: () => ({}) },
        { provide: SonnailleStore, useValue: { baseMap: 'ign-plan', attach: async () => undefined } },
      ],
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const region = (fixture.nativeElement as HTMLElement).querySelector('[role="region"]');
    expect(region?.getAttribute('aria-label')).toBe('Carte du territoire pastoral');
  });
});
