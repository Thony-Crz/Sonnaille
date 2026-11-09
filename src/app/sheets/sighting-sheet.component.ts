import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ObservationOnMap } from '../../application/ports';
import { isFlock } from '../../domain/observation';
import { DOG_ICON, iconDataUrl, sightingIcon } from '../../ui/sighting-icons';
import { STING_WARNING, describeSighting, sightingTip } from '../../ui/sighting-labels';

/** The sheet of a tapped sighting: what it is, when, the distance to keep, the right move. */
@Component({
  selector: 'son-sighting-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="zone-sheet sighting-sheet" role="dialog" aria-label="Fiche du signalement">
      <button type="button" class="zone-sheet-close" aria-label="Fermer" (click)="closed.emit()">×</button>
      <div class="sighting-pictures">
        <img class="sighting-picture" [src]="picture()" [alt]="what()" width="56" height="56" />
        @if (dogs()) {
          <img class="sighting-dog-badge" [src]="dog" alt="Chiens de protection" width="28" height="28" />
        }
      </div>
      <h2>{{ what() }}</h2>
      <p>Signalé le {{ when().day }} vers {{ when().time }}.</p>
      @if (!item().recent) {
        <p class="sighting-old">{{ flock() ? 'Signalement ancien : les bêtes ont pu partir.' : 'Signalement ancien : à vérifier sur place.' }}</p>
      }
      <p>Zone de prudence : {{ item().haloMeters }} m autour du point.</p>
      <p class="sighting-tip"><strong>Le bon réflexe : </strong>{{ tip() }}</p>
      @if (!flock()) {
        <p>{{ stingWarning }}</p>
      }
      <p class="zone-sheet-disclaimer">Signalement d’un utilisateur, non vérifié sur place.</p>
    </aside>
  `,
})
export class SightingSheetComponent {
  readonly item = input.required<ObservationOnMap>();
  readonly closed = output<void>();

  protected readonly dog = iconDataUrl(DOG_ICON);
  protected readonly stingWarning = STING_WARNING;
  private readonly observation = computed(() => this.item().observation);
  protected readonly flock = computed(() => isFlock(this.observation()));
  protected readonly dogs = computed(() => {
    const o = this.observation();
    return isFlock(o) && o.guardDogs;
  });
  protected readonly what = computed(() => describeSighting(this.observation()));
  protected readonly tip = computed(() => sightingTip(this.observation()));
  protected readonly picture = computed(() => iconDataUrl(sightingIcon(this.observation())));
  protected readonly when = computed(() => {
    const at = new Date(this.observation().observedAt);
    return { day: at.toLocaleDateString('fr-FR'), time: at.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) };
  });
}
