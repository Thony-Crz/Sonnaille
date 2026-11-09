import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ZoneSheet } from '../../application/zone-sheet';
import type { Activity } from '../../domain/advice';
import { ZONE_STYLES } from '../../ui/zone-styles';
import { frenchDay } from '../french';
import { ActivityChoiceComponent, AdviceListComponent, DISCLAIMER, speciesText } from './advice.components';

/**
 * The sheet of a selected zone: bottom sheet on phones, side panel on larger screens (CSS).
 * Zone names come from external data: Angular inserts them as text, never as HTML.
 */
@Component({
  selector: 'son-zone-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ActivityChoiceComponent, AdviceListComponent],
  template: `
    @let s = sheet();
    <aside class="zone-sheet" role="dialog" aria-label="Fiche de la zone">
      <button type="button" class="zone-sheet-close" aria-label="Fermer" (click)="closed.emit()">×</button>
      <h2>{{ s.name }}</h2>
      @if (s.quarter && s.quarter !== s.name) {
        <p class="zone-sheet-quarter">{{ s.quarter }}</p>
      }
      <p class="zone-sheet-status">
        <span class="zone-legend-swatch" [style.background-color]="style().color"></span><span>{{ style().label }}</span>
      </p>
      @if (s.presence; as presence) {
        <p>{{ period() }}</p>
        @if (presence.species.length > 0) {
          <p>{{ species() }}</p>
        }
        <p>Chiens de protection : {{ presence.guardDogs ? 'oui' : 'non' }}</p>
      } @else {
        <p>Pas de troupeau prévu ce jour-là dans le calendrier.</p>
      }
      <son-activity-choice name="activity" [current]="s.activity" (changed)="activityChange.emit($event)" />
      @if (s.advice.length > 0) {
        <h3>Les bons réflexes</h3>
        <son-advice-list [advice]="s.advice" />
      }
      <footer>
        <p>Zones : {{ s.source }}, données du {{ fetched() }}.</p>
        <p>{{ disclaimer }}</p>
      </footer>
    </aside>
  `,
})
export class ZoneSheetComponent {
  readonly sheet = input.required<ZoneSheet>();
  readonly activityChange = output<Activity>();
  readonly closed = output<void>();

  protected readonly disclaimer = DISCLAIMER;
  protected readonly style = computed(() => ZONE_STYLES[this.sheet().status]);
  protected readonly fetched = computed(() => new Date(this.sheet().fetchedAt).toLocaleDateString('fr-FR'));
  protected readonly species = computed(() => speciesText(this.sheet().presence?.species ?? []));
  protected readonly period = computed(() => {
    const { presence, status } = this.sheet();
    if (!presence) return '';
    const period = `Troupeau prévu du ${frenchDay(presence.start)} au ${frenchDay(presence.end)}`;
    return status === 'no-flock' ? `${period}, pas ce jour-là.` : `${period}.`;
  });
}
