import { ZONE_STATUSES, type ZoneStatus } from '../domain/zone-status';
import { ZONE_STYLES } from './zone-styles';

export interface ZoneLegend {
  element: HTMLElement;
  /** A line under the legend: the data source and its date, or why zones are missing. */
  setNote(text: string): void;
}

/** "Légende" panel: one checkbox per zone status, with its color, to show or hide it. */
export function createZoneLegend({
  onToggle,
  open = true,
}: {
  onToggle: (status: ZoneStatus, visible: boolean) => void;
  /** Collapsed on small screens, where the map needs the room. */
  open?: boolean;
}): ZoneLegend {
  const panel = document.createElement('details');
  panel.className = 'map-panel zone-legend';
  panel.open = open;

  const summary = document.createElement('summary');
  summary.textContent = 'Légende';
  panel.append(summary);

  const fieldset = document.createElement('fieldset');
  for (const status of ZONE_STATUSES) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = status;
    input.checked = true;
    input.addEventListener('change', () => onToggle(status, input.checked));

    const swatch = document.createElement('span');
    swatch.className = 'zone-legend-swatch';
    swatch.style.backgroundColor = ZONE_STYLES[status].color;
    swatch.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.textContent = ZONE_STYLES[status].label;

    const label = document.createElement('label');
    label.append(input, swatch, text);
    fieldset.append(label);
  }
  panel.append(fieldset);

  const note = document.createElement('p');
  note.className = 'zone-legend-note';
  panel.append(note);

  return {
    element: panel,
    setNote: (text) => {
      note.textContent = text;
    },
  };
}
