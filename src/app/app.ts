import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MapComponent } from './map/map.component';

@Component({
  selector: 'son-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MapComponent],
  template: `<son-map />`,
})
export class App {}
