// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { BASE_MAPS } from '../domain/base-map';
import { createBaseMapSwitcher } from './base-map-switcher';

const radios = (element: HTMLElement) => [...element.querySelectorAll<HTMLInputElement>('input[type="radio"]')];

describe('createBaseMapSwitcher', () => {
  it('is a collapsible panel titled "Fond de carte"', () => {
    const element = createBaseMapSwitcher({ baseMaps: BASE_MAPS, selected: 'ign-plan', onChange: vi.fn() });

    expect(element.tagName).toBe('DETAILS');
    expect(element.querySelector('summary')?.textContent).toBe('Fond de carte');
  });

  it('offers one labelled option per base map, in the same group', () => {
    const element = createBaseMapSwitcher({ baseMaps: BASE_MAPS, selected: 'ign-plan', onChange: vi.fn() });

    expect(radios(element).map((r) => r.value)).toEqual(BASE_MAPS.map((b) => b.id));
    expect(radios(element).map((r) => r.labels?.[0]?.textContent)).toEqual(BASE_MAPS.map((b) => b.label));
    expect(new Set(radios(element).map((r) => r.name)).size).toBe(1);
  });

  it('checks the selected base map', () => {
    const element = createBaseMapSwitcher({ baseMaps: BASE_MAPS, selected: 'osm', onChange: vi.fn() });

    expect(radios(element).filter((r) => r.checked).map((r) => r.value)).toEqual(['osm']);
  });

  it('reports the base map the user picks', () => {
    const onChange = vi.fn();
    const element = createBaseMapSwitcher({ baseMaps: BASE_MAPS, selected: 'ign-plan', onChange });
    document.body.append(element); // as in the app: change events only fire on rendered inputs

    const aerial = radios(element).find((r) => r.value === 'ign-aerial');
    aerial?.click();

    expect(onChange).toHaveBeenCalledWith('ign-aerial');
    element.remove();
  });
});

describe('createBaseMapSwitcher marked trails', () => {
  it('offers to show the marked trails over any base map', () => {
    const onTrailsChange = vi.fn();
    const element = createBaseMapSwitcher({ baseMaps: BASE_MAPS, selected: 'ign-plan', onChange: vi.fn(), onTrailsChange });
    document.body.append(element);
    const trails = element.querySelector<HTMLInputElement>('input[name="marked-trails"]')!;

    trails.click();

    expect(trails.closest('label')?.textContent).toBe('Sentiers balisés');
    expect(onTrailsChange).toHaveBeenCalledWith(true);
    element.remove();
  });
});
