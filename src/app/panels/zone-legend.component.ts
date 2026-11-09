import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NEST_KINDS } from '../../domain/observation';
import { SPECIES } from '../../domain/pastoral-zone';
import { ZONE_STATUSES, type ZoneStatus } from '../../domain/zone-status';
import { SPECIES_LABELS } from '../../ui/observation-form';
import { DOG_ICON, iconDataUrl } from '../../ui/sighting-icons';
import { NEST_LABELS } from '../../ui/sighting-labels';
import { ZONE_STYLES } from '../../ui/zone-styles';

/** "Légende" panel: one checkbox per zone status, the sighting pictures, and a note (data source…). */
@Component({
  selector: 'son-zone-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="map-panel zone-legend" [open]="open()">
      <summary>Légende</summary>
      <fieldset>
        @for (status of statuses; track status) {
          <label>
            <input #box type="checkbox" [value]="status" checked (change)="toggle.emit({ status, visible: box.checked })" />
            <span class="zone-legend-swatch" aria-hidden="true" [style.background-color]="styles[status].color"></span>
            <span>{{ styles[status].label }}</span>
            @if (status === 'flock-with-dogs') {
              <img class="legend-picture" [src]="dog" alt="Chiens de protection" width="20" height="20" />
            }
          </label>
        }
      </fieldset>
      <details class="legend-pictures">
        <summary>Signalements</summary>
        <ul>
          @for (entry of pictures; track entry.id) {
            <li>
              <img class="legend-picture" [src]="entry.src" [alt]="entry.label" [width]="entry.size" [height]="entry.size" />
              <span aria-hidden="true">{{ entry.label }}</span>
            </li>
          }
        </ul>
      </details>
      <p class="zone-legend-note">
        {{ note() }}
        @if (link(); as link) {
          <a [href]="link.href">{{ link.label }}</a>
        }
      </p>
    </details>
  `,
})
export class ZoneLegendComponent {
  /** Collapsed on small screens, where the map needs the room. */
  readonly open = input(true);
  readonly note = input('');
  readonly link = input<{ href: string; label: string } | null>(null);
  readonly toggle = output<{ status: ZoneStatus; visible: boolean }>();

  protected readonly statuses = ZONE_STATUSES;
  protected readonly styles = ZONE_STYLES;
  protected readonly dog = iconDataUrl(DOG_ICON);
  protected readonly pictures = [
    ...SPECIES.map((s) => ({ id: `sighting-${s}`, label: SPECIES_LABELS[s], size: 24 })),
    ...NEST_KINDS.map((k) => ({ id: `sighting-${k}`, label: NEST_LABELS[k], size: 24 })),
    { id: DOG_ICON, label: 'Chiens de protection vus', size: 16 },
  ].map((entry) => ({ ...entry, src: iconDataUrl(entry.id) }));
}
