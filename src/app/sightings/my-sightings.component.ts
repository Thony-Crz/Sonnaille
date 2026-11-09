import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Observation } from '../../domain/observation';
import { describeSighting } from '../../ui/sighting-labels';

/** Map panel: the "Signaler animaux, ruches ou nids" button, and the sightings kept on this device. */
@Component({
  selector: 'son-my-sightings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="map-panel sightings-entry">
      <button type="button" class="sighting-report" (click)="report.emit()">
        {{ picking() ? 'Annuler' : 'Signaler animaux, ruches ou nids' }}
      </button>
      <p class="sighting-hint">{{ picking() ? 'Touchez la carte là où vous avez vu les animaux, les ruches ou le nid.' : '' }}</p>
      <details class="my-sightings">
        <summary>Mes signalements ({{ sightings().length }})</summary>
        <div class="my-sightings-list">
          @for (sighting of sightings(); track sighting.id) {
            <div class="my-sighting">
              <p>{{ describe(sighting) }}</p>
              <p class="sighting-hint">{{ when(sighting) }}</p>
              <button type="button" (click)="remove.emit(sighting.id)">Supprimer</button>
            </div>
          } @empty {
            <p class="sighting-hint">Aucun signalement pour l’instant.</p>
          }
          @if (sightings().length > 0) {
            <p class="sighting-hint">Gardés sur cet appareil jusqu’à leur publication.</p>
            <button type="button" class="sighting-publish" (click)="publish.emit()">Publier</button>
          }
        </div>
        <p class="sighting-note">{{ note() }}</p>
      </details>
    </div>
  `,
})
export class MySightingsComponent {
  readonly sightings = input<Observation[]>([]);
  readonly picking = input(false);
  readonly note = input('');
  readonly report = output<void>();
  readonly remove = output<string>();
  readonly publish = output<void>();

  protected readonly describe = describeSighting;

  protected when(sighting: Observation): string {
    const at = new Date(sighting.observedAt);
    return `${at.toLocaleDateString('fr-FR')} vers ${at.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }
}
