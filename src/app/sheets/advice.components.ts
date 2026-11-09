import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ACTIVITIES, type Activity, type Advice } from '../../domain/advice';
import { ACTIVITY_LABELS } from '../../ui/advice-list';

export { DISCLAIMER, speciesText } from '../../ui/advice-list';

/** "Je me déplace" radio buttons; `name` keeps groups of different sheets apart. */
@Component({
  selector: 'son-activity-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="zone-sheet-activity">
      <legend>Je me déplace</legend>
      @for (activity of activities; track activity) {
        <label>
          <input type="radio" [name]="name()" [value]="activity" [checked]="activity === current()" (change)="changed.emit(activity)" />
          <span>{{ labels[activity] }}</span>
        </label>
      }
    </fieldset>
  `,
})
export class ActivityChoiceComponent {
  readonly current = input.required<Activity>();
  readonly name = input.required<string>();
  readonly changed = output<Activity>();
  protected readonly activities = ACTIVITIES;
  protected readonly labels = ACTIVITY_LABELS;
}

/** Each advice: situation, short message, detail on demand, cited source. */
@Component({
  selector: 'son-advice-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="zone-sheet-advice">
      @for (item of advice(); track item.id) {
        <li class="advice">
          <p class="advice-situation">{{ item.situation }}</p>
          <strong>{{ item.message }}</strong>
          <details>
            <summary>En savoir plus</summary>
            <p>{{ item.detail }}</p>
            <p class="advice-source">Source : <a [href]="item.source.url" target="_blank" rel="noopener">{{ item.source.label }}</a></p>
          </details>
        </li>
      }
    </ul>
  `,
})
export class AdviceListComponent {
  readonly advice = input.required<Advice[]>();
}
