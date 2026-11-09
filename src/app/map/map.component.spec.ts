import { TestBed } from '@angular/core/testing';
import { SonnailleStore } from '../sonnaille.store';
import { MAP_FACTORY } from '../tokens';
import { MapComponent } from './map.component';

describe('MapComponent', () => {
  const setup = () => {
    const map = { fake: true };
    const factory = vi.fn((_host: HTMLElement, _options: { baseMap: string; framePadding: () => unknown }) => map);
    const store = { baseMap: 'ign-plan', framingForSheet: false, sheet: () => null, attach: vi.fn(async () => undefined), importFile: vi.fn(async () => undefined) };
    TestBed.configureTestingModule({
      providers: [
        { provide: MAP_FACTORY, useValue: factory },
        { provide: SonnailleStore, useValue: store },
      ],
    });
    const fixture = TestBed.createComponent(MapComponent);
    fixture.detectChanges();
    return { fixture, factory, store, map, host: fixture.nativeElement as HTMLElement };
  };

  it('creates the map in its element, on the remembered base map, and hands it to the store', async () => {
    const { fixture, factory, store, map, host } = setup();
    await fixture.whenStable();

    expect(factory).toHaveBeenCalledWith(host.querySelector('.app-map'), expect.objectContaining({ baseMap: 'ign-plan' }));
    expect(store.attach).toHaveBeenCalledWith(map);
    expect(host.querySelector('.app-map')?.getAttribute('aria-label')).toBe('Carte du territoire pastoral');
  });

  it('imports a GPX file dropped on the map', async () => {
    const { fixture, store, host } = setup();
    await fixture.whenStable();
    const file = new File(['<gpx/>'], 'sortie.gpx');
    const drop = new Event('drop', { cancelable: true }) as Event & { dataTransfer: { files: File[] } };
    drop.dataTransfer = { files: [new File(['x'], 'photo.jpg'), file] };

    host.querySelector('.app-map')!.dispatchEvent(drop);

    expect(store.importFile).toHaveBeenCalledWith(file);
  });

  it('leaves room for the panels when framing', async () => {
    const { fixture, factory } = setup();
    await fixture.whenStable();

    const { framePadding } = factory.mock.calls[0]![1];

    expect(framePadding()).toBeDefined();
  });
});
