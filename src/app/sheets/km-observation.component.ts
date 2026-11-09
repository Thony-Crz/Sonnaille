import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { HEADCOUNTS, type Headcount } from '../../domain/observation';
import { SPECIES, type Species } from '../../domain/pastoral-zone';
import { HEADCOUNT_LABELS, SPECIES_LABELS } from '../../ui/observation-form';
import { frenchNumber } from '../french';
import type { KmAnswers } from '../sonnaille.store';

/**
 * "Signaler un troupeau ou des animaux vus" (T24): where on the track, which animals, roughly how many,
 * guard dogs seen or not. Structured answers only: no free text, so nobody can be targeted.
 */
@Component({
  selector: 'son-km-observation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="observation-section">
      <summary>Signaler un troupeau ou des animaux vus</summary>
      <form class="observation-form" novalidate (submit)="submit($event, km.value, time.value, species.value, dogs.checked)">
        <label><span>Au kilomètre</span><input #km type="number" name="km" min="0" step="0.1" value="0" required [max]="lengthKm()" /></label>
        <label [hidden]="hasTimes()"><span>Heure de l'observation</span><input #time type="time" name="time" value="12:00" /></label>
        <label>
          <span>Quels animaux ?</span>
          <select #species name="species">
            @for (s of speciesList; track s) {
              <option [value]="s">{{ speciesLabels[s] }}</option>
            }
          </select>
        </label>
        <fieldset class="observation-headcount">
          <legend>Combien de bêtes ?</legend>
          @for (h of headcounts; track h) {
            <label>
              <input type="radio" name="headcount" [value]="h" [checked]="h === headcount()" (change)="headcount.set(h)" />
              <span>{{ headcountLabels[h] }}</span>
            </label>
          }
        </fieldset>
        <label class="observation-dogs"><input #dogs type="checkbox" name="guardDogs" /><span>Chiens de protection vus</span></label>
        <p class="observation-error" role="alert">{{ error() }}</p>
        <button type="submit">Préparer le signalement</button>
        <div class="observation-result">
          @if (result(); as result) {
            <p class="observation-time-source">
              {{ result.timeFromTrack ? 'Heure tirée de votre GPX.' : "Heure saisie à la main : votre GPX n'a pas d'heure." }}
            </p>
            <p>
              Ajoutez cette entrée au tableau « features » du fichier content/observations.geojson du dépôt : elle sera visible après le
              prochain déploiement.
            </p>
            <pre>{{ result.json }}</pre>
            <button type="button" class="observation-copy" (click)="copy(result.json)">{{ copied() ? 'Copié' : 'Copier' }}</button>
          }
        </div>
      </form>
    </details>
  `,
})
export class KmObservationComponent {
  readonly lengthKm = input(0);
  /** When the GPX has no time, the time of the sighting is asked. */
  readonly hasTimes = input(true);
  readonly result = input<{ json: string; timeFromTrack: boolean } | null>(null);
  readonly report = output<KmAnswers>();

  protected readonly headcount = signal<Headcount>('dozens');
  protected readonly error = signal('');
  protected readonly copied = signal(false);
  protected readonly speciesList = SPECIES;
  protected readonly speciesLabels = SPECIES_LABELS;
  protected readonly headcounts = HEADCOUNTS;
  protected readonly headcountLabels = HEADCOUNT_LABELS;

  protected submit(event: Event, km: string, time: string, species: string, guardDogs: boolean): void {
    event.preventDefault();
    const value = Number.parseFloat(km);
    if (!Number.isFinite(value) || value < 0 || value > this.lengthKm()) {
      this.error.set(`Choisissez un kilomètre entre 0 et ${frenchNumber(this.lengthKm())}.`);
      return;
    }
    const askedTime = !this.hasTimes();
    if (askedTime && !/^\d{2}:\d{2}$/.test(time)) {
      this.error.set("Indiquez l'heure à laquelle vous avez vu les animaux.");
      return;
    }
    this.error.set('');
    this.copied.set(false);
    this.report.emit({
      km: value,
      species: species as Species,
      headcount: this.headcount(),
      guardDogs,
      ...(askedTime ? { time } : {}),
    });
  }

  protected copy(json: string): void {
    void navigator.clipboard?.writeText(json).then(() => this.copied.set(true));
  }
}
