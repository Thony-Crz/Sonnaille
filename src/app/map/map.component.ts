import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, PendingTasks, viewChild } from '@angular/core';
import { SonnailleStore } from '../sonnaille.store';
import { MAP_FACTORY } from '../tokens';

const isGpx = (file: File) => /\.gpx$/i.test(file.name);

/** The map, full screen. A GPX file dropped on it is imported. */
@Component({
  selector: 'son-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #map
      class="app-map"
      role="region"
      aria-label="Carte du territoire pastoral"
      [class.drop-active]="dropActive"
      (dragover)="onDragOver($event)"
      (dragleave)="dropActive = false"
      (drop)="onDrop($event)"
    ></div>
  `,
})
export class MapComponent {
  private readonly store = inject(SonnailleStore);
  private readonly factory = inject(MAP_FACTORY);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly element = viewChild.required<ElementRef<HTMLElement>>('map');
  protected dropActive = false;

  constructor() {
    afterNextRender(() => {
      const map = this.factory(this.element().nativeElement, { baseMap: this.store.baseMap, framePadding: () => this.framePadding() });
      // Loading the zones and sightings counts as pending work (the app is stable once they are shown).
      const done = this.pendingTasks.add();
      void this.store.attach(map).finally(done);
    });
  }

  /**
   * Framing leaves room for the panels: on phones the outing sheet covers the bottom half,
   * on larger screens it sits on the right and the controls on the left.
   */
  private framePadding() {
    const sheet = this.store.framingForSheet;
    const phone = !window.matchMedia?.('(min-width: 768px)').matches;
    if (phone) return sheet ? { top: 210, bottom: Math.round(window.innerHeight * 0.5) + 16, left: 16, right: 56 } : 24;
    return sheet ? { top: 24, bottom: 24, left: 190, right: 430 } : { top: 24, bottom: 24, left: 190, right: 24 };
  }

  protected onDragOver(event: Event): void {
    event.preventDefault();
    this.dropActive = true;
  }

  protected onDrop(event: Event): void {
    event.preventDefault();
    this.dropActive = false;
    const files = (event as DragEvent).dataTransfer?.files;
    const file = [...(files ?? [])].find(isGpx);
    if (file) void this.store.importFile(file);
  }
}
