import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import type { Position } from '../../domain/bounds';
import { HEADCOUNTS, type Headcount, type NestKind } from '../../domain/observation';
import { SPECIES, type Species } from '../../domain/pastoral-zone';
import { parseDay } from '../../domain/zone-status';
import { HEADCOUNT_LABELS, SPECIES_LABELS } from '../../ui/observation-form';
import { WHAT_CHOICES } from '../../ui/sighting-labels';
import type { SightingAnswers } from '../sonnaille.store';

/**
 * Sheet opened after tapping the map: when, what (a flock, beehives, a nest), which animals, how many,
 * guard dogs seen. Structured answers only, no free text (nobody can be targeted).
 */
@Component({
  selector: 'son-sighting-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (at(); as at) {
      <aside class="zone-sheet sighting-panel" role="dialog" aria-label="Signaler des animaux vus">
        <h2>Signaler ce que vous avez vu</h2>
        <p class="zone-sheet-quarter">Au point touché sur la carte.</p>
        <form class="observation-form" novalidate (submit)="submit($event, date.value, time.value, species.value, dogs.checked)">
          <label><span>Le</span><input #date type="date" name="sighting-date" [value]="at.date" /></label>
          <label><span>Vers</span><input #time type="time" name="sighting-time" [value]="at.time" /></label>
          <fieldset class="observation-headcount sighting-what">
            <legend>Qu’avez-vous vu ?</legend>
            @for (choice of choices; track choice.value) {
              <label>
                <input type="radio" name="sighting-what" [value]="choice.value" [checked]="choice.value === what()" (change)="what.set(choice.value)" />
                <span>{{ choice.label }}</span>
              </label>
            }
          </fieldset>
          <div class="sighting-animals" [hidden]="what() !== 'flock'">
            <label>
              <span>Quels animaux ?</span>
              <select #species name="species">
                @for (s of species_; track s) {
                  <option [value]="s">{{ speciesLabels[s] }}</option>
                }
              </select>
            </label>
            <fieldset class="observation-headcount">
              <legend>Combien de bêtes ?</legend>
              @for (h of headcounts; track h) {
                <label>
                  <input type="radio" name="sighting-headcount" [value]="h" [checked]="h === headcount()" (change)="headcount.set(h)" />
                  <span>{{ headcountLabels[h] }}</span>
                </label>
              }
            </fieldset>
            <label class="observation-dogs"><input #dogs type="checkbox" name="sighting-dogs" /><span>Chiens de protection vus</span></label>
          </div>
          <p class="observation-error" role="alert">{{ error() }}</p>
          <div class="sighting-actions">
            <button type="button" class="sighting-cancel" (click)="cancel.emit()">Annuler</button>
            <button type="submit">Enregistrer</button>
          </div>
        </form>
      </aside>
    }
  `,
})
export class SightingFormComponent {
  /** Where and when, given when the user taps the map; null keeps the sheet closed. */
  readonly at = input<{ position: Position; date: string; time: string } | null>(null);
  readonly save = output<SightingAnswers>();
  readonly cancel = output<void>();

  protected readonly what = signal<'flock' | NestKind>('flock');
  protected readonly headcount = signal<Headcount>('dozens');
  protected readonly error = signal('');
  protected readonly choices = WHAT_CHOICES;
  protected readonly species_ = SPECIES;
  protected readonly speciesLabels = SPECIES_LABELS;
  protected readonly headcounts = HEADCOUNTS;
  protected readonly headcountLabels = HEADCOUNT_LABELS;

  constructor() {
    // Each new point starts from "a flock".
    effect(() => {
      this.at();
      this.what.set('flock');
      this.headcount.set('dozens');
      this.error.set('');
    });
  }

  protected submit(event: Event, date: string, time: string, species: string, guardDogs: boolean): void {
    event.preventDefault();
    const at = this.at();
    if (!at) return;
    if (!parseDay(date) || !/^\d{2}:\d{2}$/.test(time)) {
      this.error.set('Indiquez le jour et l’heure.');
      return;
    }
    const kind = this.what();
    this.save.emit({
      position: at.position,
      date,
      time,
      what: kind === 'flock' ? { kind, species: species as Species, headcount: this.headcount(), guardDogs } : { kind },
    });
  }
}
