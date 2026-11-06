import { NEST_KINDS } from '../domain/observation';
import { SPECIES } from '../domain/pastoral-zone';
import { ZONE_STATUSES, type ZoneStatus } from '../domain/zone-status';
import { SPECIES_LABELS } from './observation-form';
import { DOG_ICON, iconDataUrl } from './sighting-icons';
import { NEST_LABELS } from './sighting-labels';
import { ZONE_STYLES } from './zone-styles';

export interface ZoneLegend {
  element: HTMLElement;
  /** A line under the legend: the data source and its date, or why zones are missing. */
  setNote(text: string, link?: { href: string; label: string }): void;
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
    if (status === 'flock-with-dogs') label.append(picture(DOG_ICON, 'Chiens de protection', 20));
    fieldset.append(label);
  }
  panel.append(fieldset);

  // What each sighting picture means.
  const pictures = document.createElement('details');
  pictures.className = 'legend-pictures';
  const pictureSummary = document.createElement('summary');
  pictureSummary.textContent = 'Signalements';
  const entries: Array<[string, string]> = [
    ...SPECIES.map((s): [string, string] => [`sighting-${s}`, SPECIES_LABELS[s]]),
    ...NEST_KINDS.map((k): [string, string] => [`sighting-${k}`, NEST_LABELS[k]]),
    [DOG_ICON, 'Chiens de protection vus'],
  ];
  const list = document.createElement('ul');
  for (const [id, label] of entries) {
    const item = document.createElement('li');
    const text = document.createElement('span');
    text.textContent = label;
    text.setAttribute('aria-hidden', 'true');
    item.append(picture(id, label, id === DOG_ICON ? 16 : 24), text);
    list.append(item);
  }
  pictures.append(pictureSummary, list);
  panel.append(pictures);

  const note = document.createElement('p');
  note.className = 'zone-legend-note';
  panel.append(note);

  return {
    element: panel,
    setNote: (text, link) => {
      note.textContent = text;
      if (!link) return;
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.label;
      note.append(' ', a);
    },
  };
}

function picture(id: string, alt: string, size: number): HTMLImageElement {
  const image = document.createElement('img');
  image.src = iconDataUrl(id);
  image.alt = alt;
  image.width = size;
  image.height = size;
  image.className = 'legend-picture';
  return image;
}
