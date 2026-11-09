import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { NearbyObservation } from '../../domain/nearby-observations';
import type { OutingReport } from '../../application/prepare-outing';
import type { Activity } from '../../domain/advice';
import { isFlock } from '../../domain/observation';
import { parseDay } from '../../domain/zone-status';
import { iconDataUrl, sightingIcon } from '../../ui/sighting-icons';
import { STING_WARNING, describeSighting, sightingTip } from '../../ui/sighting-labels';
import { ZONE_STYLES } from '../../ui/zone-styles';
import { frenchDay, frenchNumber } from '../french';
import type { KmAnswers } from '../sonnaille.store';
import { ActivityChoiceComponent, AdviceListComponent, DISCLAIMER } from './advice.components';
import { KmObservationComponent } from './km-observation.component';

const plural = (count: number, one: string, several: string) => `${count} ${count === 1 ? one : several}`;

/** "Votre tracé traverse 3 zones pastorales, dont 1 avec chiens de protection." */
function summary({ crossings }: OutingReport): string {
  if (crossings.length === 0) return 'Aucune zone pastorale connue sur votre tracé.';
  const zones = plural(crossings.length, 'zone pastorale', 'zones pastorales');
  const withDogs = crossings.filter((c) => c.status === 'flock-with-dogs').length;
  const withFlock = crossings.filter((c) => c.status === 'flock').length;
  const detail =
    withDogs > 0
      ? `, dont ${withDogs} avec chiens de protection`
      : withFlock > 0
        ? `, dont ${withFlock} avec troupeau prévu`
        : ', sans troupeau prévu ce jour-là';
  return `Votre tracé traverse ${zones}${detail}.`;
}

/**
 * "Votre sortie" sheet, shown after a GPX import: outing date and activity, zones crossed in order,
 * what was reported near the track, advice, and the form to report a flock at a km.
 */
@Component({
  selector: 'son-outing-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ActivityChoiceComponent, AdviceListComponent, KmObservationComponent],
  template: `
    @let r = report();
    <aside class="zone-sheet outing-report" role="dialog" aria-label="Votre sortie">
      <button type="button" class="zone-sheet-close" aria-label="Fermer" (click)="closed.emit()">×</button>
      <h2>Votre sortie</h2>
      <p class="zone-sheet-quarter">{{ r.name }} — {{ number(r.lengthKm) }} km</p>
      <label class="outing-date"><span>Date de la sortie</span><input #date type="date" [value]="r.date" (change)="changeDate(date.value)" /></label>
      <son-activity-choice name="outing-activity" [current]="r.activity" (changed)="activityChange.emit($event)" />
      <p class="outing-summary">{{ summary() }}</p>
      @if (r.crossings.length > 0) {
        <ol class="crossings">
          @for (crossing of r.crossings; track crossing.zone.id) {
            <li class="crossing">
              <p class="zone-sheet-status">
                <span class="zone-legend-swatch" [style.background-color]="styles[crossing.status].color"></span><span>{{ crossing.zone.name }}</span>
              </p>
              <p>{{ styles[crossing.status].label }}</p>
              <p>Au km {{ number(crossing.entryKm) }}, sur {{ number(max(crossing.insideKm, 0.1)) }} km</p>
              @if (crossing.zone.presence; as presence) {
                <p class="crossing-period">Troupeau prévu du {{ day(presence.start) }} au {{ day(presence.end) }}</p>
              }
            </li>
          }
        </ol>
      }
      @if (r.sightings.length > 0) {
        <section class="sightings">
          <h3>Signalé près du tracé</h3>
          <ul class="crossings">
            @for (nearby of r.sightings; track nearby.observation.id) {
              <li class="crossing">
                <p class="zone-sheet-status">
                  <img class="sighting-picture" [src]="picture(nearby)" [alt]="describe(nearby)" width="28" height="28" />
                  <span>{{ describe(nearby) }}</span>
                </p>
                <p>Vu le {{ seen(nearby) }}, au km {{ number(nearby.km) }}, à {{ nearby.distanceMeters }} m du tracé</p>
                <p class="sighting-tip">{{ tip(nearby) }}</p>
              </li>
            }
            @if (stings()) {
              <li class="sighting-hint">{{ stingWarning }}</li>
            }
          </ul>
        </section>
      }
      @if (r.advice.length > 0) {
        <h3>Les bons réflexes</h3>
        <son-advice-list [advice]="r.advice" />
      }
      <son-km-observation [lengthKm]="lengthKm()" [hasTimes]="hasTimes()" [result]="kmResult()" (report)="reportAtKm.emit($event)" />
      <footer>
        <p>Analyse faite sur votre appareil : votre tracé n'est envoyé nulle part.</p>
        <p>{{ disclaimer }}</p>
      </footer>
    </aside>
  `,
})
export class OutingReportComponent {
  readonly report = input.required<OutingReport>();
  readonly lengthKm = input(0);
  readonly hasTimes = input(true);
  readonly kmResult = input<{ json: string; timeFromTrack: boolean } | null>(null);
  readonly dateChange = output<string>();
  readonly activityChange = output<Activity>();
  readonly reportAtKm = output<KmAnswers>();
  readonly closed = output<void>();

  protected readonly styles = ZONE_STYLES;
  protected readonly disclaimer = DISCLAIMER;
  protected readonly stingWarning = STING_WARNING;
  protected readonly number = frenchNumber;
  protected readonly day = frenchDay;
  protected readonly max = Math.max;
  protected readonly summary = computed(() => summary(this.report()));
  protected readonly stings = computed(() => this.report().sightings.some(({ observation }) => !isFlock(observation)));

  protected picture = ({ observation }: NearbyObservation) => iconDataUrl(sightingIcon(observation));
  protected describe = ({ observation }: NearbyObservation) => describeSighting(observation);
  protected tip = ({ observation }: NearbyObservation) => sightingTip(observation);
  protected seen = ({ observation }: NearbyObservation) => new Date(observation.observedAt).toLocaleDateString('fr-FR');

  protected changeDate(value: string): void {
    const day = parseDay(value);
    if (day) this.dateChange.emit(day);
  }
}
