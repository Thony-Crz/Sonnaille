import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** "Importer un GPX" panel: a button opening a file picker, and the import status. */
@Component({
  selector: 'son-track-import',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="map-panel track-import">
      <button type="button" (click)="picker.click()">Importer un GPX</button>
      <input #picker type="file" accept=".gpx,application/gpx+xml" hidden (change)="pick(picker)" />
      <p class="track-import-privacy">Le fichier reste sur votre appareil.</p>
      <p class="track-import-status" aria-live="polite">{{ status() }}</p>
    </div>
  `,
})
export class TrackImportComponent {
  readonly status = input('');
  readonly file = output<File>();

  protected pick(picker: HTMLInputElement): void {
    const file = picker.files?.[0];
    if (file) this.file.emit(file);
    picker.value = '';
  }
}
