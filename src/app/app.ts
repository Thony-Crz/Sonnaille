import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'son-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="app-map" role="region" aria-label="Carte du territoire pastoral"></div>`,
})
export class App {}
