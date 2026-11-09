import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Demo mode banner: everything shown is fictional, nothing leaves the device. */
@Component({
  selector: 'son-demo-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="map-panel demo-banner" role="status">
      <span>Mode démo : zones, tracé et signalements fictifs. Rien n’est envoyé.</span>
      <a class="demo-gpx" [href]="gpxUrl()" download>Tracé de démo (GPX)</a>
      <button type="button" class="demo-reset" (click)="reset.emit()">Recommencer</button>
      <a class="demo-exit" [href]="exitUrl()">Quitter la démo</a>
    </div>
  `,
})
export class DemoBannerComponent {
  readonly gpxUrl = input.required<string>();
  readonly exitUrl = input.required<string>();
  readonly reset = output<void>();
}
