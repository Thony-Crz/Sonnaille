import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MapComponent } from './map/map.component';
import { BaseMapSwitcherComponent } from './panels/base-map-switcher.component';
import { DemoBannerComponent } from './panels/demo-banner.component';
import { TrackImportComponent } from './panels/track-import.component';
import { ZoneLegendComponent } from './panels/zone-legend.component';
import { OfflineNoticeComponent, UnderstandComponent, WelcomeComponent } from './sheets/info.components';
import { OutingReportComponent } from './sheets/outing-report.component';
import { SightingSheetComponent } from './sheets/sighting-sheet.component';
import { ZoneSheetComponent } from './sheets/zone-sheet.component';
import { MySightingsComponent } from './sightings/my-sightings.component';
import { SightingFormComponent } from './sightings/sighting-form.component';
import { SonnailleStore } from './sonnaille.store';

/** The map, the panels over it, one sheet at a time, and the dialogs. */
@Component({
  selector: 'son-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MapComponent,
    DemoBannerComponent,
    BaseMapSwitcherComponent,
    TrackImportComponent,
    MySightingsComponent,
    ZoneLegendComponent,
    ZoneSheetComponent,
    OutingReportComponent,
    SightingSheetComponent,
    UnderstandComponent,
    SightingFormComponent,
    OfflineNoticeComponent,
    WelcomeComponent,
  ],
  template: `
    <son-map />

    <div class="map-panels map-panels-top-left">
      @if (store.settings.demo) {
        <son-demo-banner [gpxUrl]="base + 'demo/hauts-plateaux-fictif.gpx'" [exitUrl]="base" (reset)="store.resetDemo()" />
      }
      <son-base-map-switcher
        [baseMaps]="store.baseMaps"
        [selected]="store.baseMap"
        (changed)="store.chooseBaseMap($event)"
        (trailsChange)="store.showMarkedTrails($event)"
      />
      <son-track-import [status]="store.trackStatus()" (file)="store.importFile($event)" />
      <son-my-sightings
        [sightings]="store.mySightings()"
        [picking]="store.picking()"
        [note]="store.sightingsNote()"
        (report)="store.reportSighting()"
        (remove)="store.deleteSighting($event)"
        (publish)="store.publish()"
      />
      <div class="map-panel understand-entry">
        <button type="button" class="understand-button" (click)="store.openUnderstand()">Comprendre</button>
      </div>
    </div>

    <div class="map-panels map-panels-bottom-left">
      <son-zone-legend
        [open]="wide"
        [note]="store.legendNote()"
        [link]="store.demoLink()"
        (toggle)="store.toggleZoneStatus($event.status, $event.visible)"
      />
    </div>

    @let sheet = store.sheet();
    @if (sheet?.kind === 'zone') {
      <son-zone-sheet [sheet]="sheet.sheet" (activityChange)="store.changeActivity($event)" (closed)="store.closeSheet()" />
    } @else if (sheet?.kind === 'report') {
      <son-outing-report
        [report]="sheet.report"
        [lengthKm]="store.trackLengthKm()"
        [hasTimes]="store.trackHasTimes()"
        [kmResult]="store.kmResult()"
        (dateChange)="store.changeDay($event)"
        (activityChange)="store.changeActivity($event)"
        (reportAtKm)="store.reportAtKm($event)"
        (closed)="store.closeSheet()"
      />
    } @else if (sheet?.kind === 'sighting') {
      <son-sighting-sheet [item]="sheet.item" (closed)="store.closeSheet()" />
    } @else if (sheet?.kind === 'understand') {
      <son-understand [advice]="store.advice()" (closed)="store.closeSheet()" />
    }

    <son-sighting-form [at]="store.sightingFormAt()" (save)="store.saveSighting($event)" (cancel)="store.cancelSightingForm()" />
    <son-offline-notice />
    @if (store.welcome()) {
      <son-welcome (closed)="store.closeWelcome()" />
    }
  `,
})
export class App {
  protected readonly store = inject(SonnailleStore);
  protected readonly base = this.store.settings.base;
  /** The legend starts collapsed on small screens, where the map needs the room. */
  protected readonly wide = window.matchMedia?.('(min-width: 768px)').matches ?? true;
}
