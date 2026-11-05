import type { BaseMap, BaseMapId } from '../domain/base-map';

export interface BaseMapSwitcherOptions {
  baseMaps: BaseMap[];
  selected: BaseMapId;
  onChange: (id: BaseMapId) => void;
  /** When given, offers the marked trails overlay. */
  onTrailsChange?: (visible: boolean) => void;
}

/**
 * A collapsible "Fond de carte" panel with one radio button per base map.
 * Native <details> and radios: keyboard and screen reader support for free.
 */
export function createBaseMapSwitcher({ baseMaps, selected, onChange, onTrailsChange }: BaseMapSwitcherOptions): HTMLElement {
  const panel = document.createElement('details');
  panel.className = 'base-map-switcher';

  const summary = document.createElement('summary');
  summary.textContent = 'Fond de carte';
  panel.append(summary);

  const fieldset = document.createElement('fieldset');
  for (const baseMap of baseMaps) {
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'base-map';
    input.value = baseMap.id;
    input.checked = baseMap.id === selected;
    input.addEventListener('change', () => {
      if (input.checked) onChange(baseMap.id);
    });

    // The input sits inside its label: the whole line is clickable, which helps on phones.
    const text = document.createElement('span');
    text.textContent = baseMap.label;
    const label = document.createElement('label');
    label.append(input, text);
    fieldset.append(label);
  }
  panel.append(fieldset);

  if (onTrailsChange) {
    const trails = document.createElement('input');
    trails.type = 'checkbox';
    trails.name = 'marked-trails';
    trails.addEventListener('change', () => onTrailsChange(trails.checked));
    const text = document.createElement('span');
    text.textContent = 'Sentiers balisés';
    const label = document.createElement('label');
    label.className = 'base-map-trails';
    label.append(trails, text);
    panel.append(label);
  }

  return panel;
}
