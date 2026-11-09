import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  it('shows the map region', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const region = (fixture.nativeElement as HTMLElement).querySelector('[role="region"]');
    expect(region?.getAttribute('aria-label')).toBe('Carte du territoire pastoral');
  });
});
