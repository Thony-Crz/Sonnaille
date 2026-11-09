import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { BaseMap, BaseMapId } from '../../domain/base-map';

/**
 * A collapsible "Fond de carte" panel with one radio button per base map, and the marked trails.
 * Native <details> and radios: keyboard and screen reader support for free.
 */
@Component({
  selector: 'son-base-map-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="base-map-switcher">
      <summary>Fond de carte</summary>
      <fieldset>
        @for (baseMap of baseMaps(); track baseMap.id) {
          <!-- The input sits inside its label: the whole line is clickable, which helps on phones. -->
          <label>
            <input type="radio" name="base-map" [value]="baseMap.id" [checked]="baseMap.id === selected()" (change)="changed.emit(baseMap.id)" />
            <span>{{ baseMap.label }}</span>
          </label>
        }
      </fieldset>
      <label class="base-map-trails">
        <input #trails type="checkbox" name="marked-trails" (change)="trailsChange.emit(trails.checked)" />
        <span>Sentiers balisés</span>
      </label>
    </details>
  `,
})
export class BaseMapSwitcherComponent {
  readonly baseMaps = input.required<BaseMap[]>();
  readonly selected = input.required<BaseMapId>();
  readonly changed = output<BaseMapId>();
  readonly trailsChange = output<boolean>();
}
