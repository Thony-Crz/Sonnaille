// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDemoBanner } from './demo-banner';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createDemoBanner', () => {
  const setup = () => {
    const onReset = vi.fn();
    const banner = createDemoBanner({ gpxUrl: '/Sonnaille/demo/trace.gpx', exitUrl: '/Sonnaille/', onReset });
    document.body.append(banner);
    return { banner, onReset };
  };

  it('says that everything is fictional and nothing is sent', () => {
    const { banner } = setup();

    expect(banner.getAttribute('role')).toBe('status');
    expect(banner.textContent).toContain('Mode démo : zones, tracé et signalements fictifs. Rien n’est envoyé.');
  });

  it('offers the demo track to download', () => {
    const link = setup().banner.querySelector<HTMLAnchorElement>('a.demo-gpx')!;

    expect(link.textContent).toBe('Tracé de démo (GPX)');
    expect(link.getAttribute('href')).toBe('/Sonnaille/demo/trace.gpx');
    expect(link.hasAttribute('download')).toBe(true);
  });

  it('can start again and be left', () => {
    const { banner, onReset } = setup();

    banner.querySelector<HTMLButtonElement>('button.demo-reset')!.click();

    expect(onReset).toHaveBeenCalled();
    const exit = banner.querySelector<HTMLAnchorElement>('a.demo-exit')!;
    expect(exit.textContent).toBe('Quitter la démo');
    expect(exit.getAttribute('href')).toBe('/Sonnaille/');
  });
});
