// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { ZONE_STYLES } from './zone-styles';
import { createZoneLegend } from './zone-legend';

const checkboxes = (element: HTMLElement) => [...element.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];

describe('ZONE_STYLES', () => {
  it('labels each status in French', () => {
    expect(ZONE_STYLES['flock-with-dogs'].label).toBe('Troupeau avec chiens de protection');
    expect(ZONE_STYLES.flock.label).toBe('Troupeau prévu');
    expect(ZONE_STYLES['no-flock'].label).toBe('Zone pastorale, pas de troupeau prévu');
  });

  it('gives each status its own color', () => {
    const colors = Object.values(ZONE_STYLES).map((s) => s.color);

    expect(new Set(colors).size).toBe(3);
    colors.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/i));
  });
});

describe('createZoneLegend', () => {
  it('is an open panel titled "Légende"', () => {
    const { element } = createZoneLegend({ onToggle: vi.fn() });

    expect(element.tagName).toBe('DETAILS');
    expect((element as HTMLDetailsElement).open).toBe(true);
    expect(element.querySelector('summary')?.textContent).toBe('Légende');
  });

  it('can start collapsed, for small screens', () => {
    const { element } = createZoneLegend({ onToggle: vi.fn(), open: false });

    expect((element as HTMLDetailsElement).open).toBe(false);
  });

  it('lists the statuses from the most cautious, all shown', () => {
    const { element } = createZoneLegend({ onToggle: vi.fn() });

    expect(checkboxes(element).map((c) => c.value)).toEqual(['flock-with-dogs', 'flock', 'no-flock']);
    expect(checkboxes(element).every((c) => c.checked)).toBe(true);
    expect(checkboxes(element).map((c) => c.closest('label')?.textContent)).toEqual([
      'Troupeau avec chiens de protection',
      'Troupeau prévu',
      'Zone pastorale, pas de troupeau prévu',
    ]);
  });

  it('shows the color of each status', () => {
    const { element } = createZoneLegend({ onToggle: vi.fn() });

    const swatch = element.querySelector<HTMLElement>('label .zone-legend-swatch');
    expect(swatch?.style.backgroundColor).toBeTruthy();
  });

  it('reports a status the user hides', () => {
    const onToggle = vi.fn();
    const { element } = createZoneLegend({ onToggle });
    document.body.append(element);

    checkboxes(element)[2]?.click();

    expect(onToggle).toHaveBeenCalledWith('no-flock', false);
    element.remove();
  });

  it('shows a note under the legend, such as the data source', () => {
    const legend = createZoneLegend({ onToggle: vi.fn() });

    legend.setNote('Source : Map Patou');

    expect(legend.element.querySelector('.zone-legend-note')?.textContent).toBe('Source : Map Patou');
  });
});

describe('createZoneLegend note', () => {
  it('can end with a link, e.g. to the demo when zones are unavailable', () => {
    const legend = createZoneLegend({ onToggle: vi.fn() });

    legend.setNote('Zones pastorales indisponibles pour le moment.', { href: '?demo', label: 'Voir la démo' });

    const note = legend.element.querySelector('.zone-legend-note')!;
    expect(note.textContent).toBe('Zones pastorales indisponibles pour le moment. Voir la démo');
    expect(note.querySelector('a')?.getAttribute('href')).toBe('?demo');
  });

  it('drops the link when the note changes', () => {
    const legend = createZoneLegend({ onToggle: vi.fn() });
    legend.setNote('A', { href: '?demo', label: 'Voir la démo' });

    legend.setNote('B');

    expect(legend.element.querySelector('.zone-legend-note a')).toBeNull();
  });
});

describe('createZoneLegend pictures', () => {
  it('puts the guard dog next to the "with guard dogs" zones', () => {
    const legend = createZoneLegend({ onToggle: vi.fn() });

    const row = legend.element.querySelector('input[value="flock-with-dogs"]')!.closest('label')!;

    expect(row.querySelector('img')?.alt).toBe('Chiens de protection');
  });

  it('explains every sighting picture: animals, beehives, nests, guard dogs', () => {
    const legend = createZoneLegend({ onToggle: vi.fn() });

    const pictures = legend.element.querySelector('details.legend-pictures')!;
    expect(pictures.querySelector('summary')?.textContent).toBe('Signalements');
    expect([...pictures.querySelectorAll('img')].map((i) => i.alt)).toEqual([
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
