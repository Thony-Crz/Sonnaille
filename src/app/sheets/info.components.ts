import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import type { Advice } from '../../domain/advice';
import { AdviceListComponent, DISCLAIMER } from './advice.components';

// Texts shown to users, hence in French. Statements about guard dogs come from
// the sources cited in the "Comprendre" panel.
const GUARANTEE = "L'application ne garantit pas l'absence de troupeau ou de chien.";

/** Shown once, on the first visit: what Sonnaille does, privacy, and what it does not guarantee. */
@Component({
  selector: 'son-welcome',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="welcome" role="dialog" aria-modal="true" aria-label="Bienvenue sur Sonnaille">
      <div class="welcome-box">
        <h2>Bienvenue sur Sonnaille</h2>
        <p>
          Préparez votre sortie en territoire pastoral : la carte montre les zones où des troupeaux sont prévus, importez votre tracé
          GPX pour savoir lesquelles vous traversez et comment vous comporter.
        </p>
        <p>Vos tracés GPX restent sur votre appareil : ils ne sont envoyés nulle part.</p>
        <p class="welcome-warning">{{ guarantee }} Les calendriers de présence sont prévisionnels.</p>
        <button type="button" class="welcome-ok" (click)="closed.emit()">J'ai compris</button>
      </div>
    </div>
  `,
})
export class WelcomeComponent {
  readonly closed = output<void>();
  protected readonly guarantee = GUARANTEE;
}

/** "Comprendre" sheet, available at any time: guard dogs, every advice, sources and credits. */
@Component({
  selector: 'son-understand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdviceListComponent],
  template: `
    <aside class="zone-sheet understand" role="dialog" aria-label="Comprendre">
      <button type="button" class="zone-sheet-close" aria-label="Fermer" (click)="closed.emit()">×</button>
      <h2>Comprendre</h2>
      <h3>Le chien de protection</h3>
      <p>
        Le chien de protection, souvent appelé patou, vit avec le troupeau et le protège des prédateurs : loups, lynx, chiens errants.
        Quand il vient vers vous, il cherche à vous identifier, souvent à l'odeur. Il réagit à ce qu'il perçoit comme une menace,
        notamment la vitesse.
      </p>
      <h3>Les bons réflexes</h3>
      <son-advice-list [advice]="advice()" />
      <h3>Sources et crédits</h3>
      <ul class="credits">
        <li>Zones et calendriers : <a href="https://www.pasto-kezako.fr/" target="_blank" rel="noopener">Map Patou</a>, Réseau Pastoral Auvergne-Rhône-Alpes (INRAE).</li>
        <li>Conseils : <a href="https://www.pasto-kezako.fr/rencontre-chiens-de-protection/" target="_blank" rel="noopener">Pasto Kézako</a>.</li>
        <li>
          Fonds de carte : © IGN (Plan IGN, photographies aériennes), © contributeurs
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>.
        </li>
      </ul>
      <footer><p>{{ disclaimer }}</p></footer>
    </aside>
  `,
})
export class UnderstandComponent {
  readonly advice = input<Advice[]>([]);
  readonly closed = output<void>();
  protected readonly disclaimer = DISCLAIMER;
}

/** Banner shown while offline (V1): what still works without network. */
@Component({
  selector: 'son-offline-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="offline-notice" role="status" [hidden]="online()">Hors ligne : les fonds et les zones déjà consultés restent disponibles.</div>`,
})
export class OfflineNoticeComponent {
  protected readonly online = signal(navigator.onLine);

  constructor() {
    const update = () => this.online.set(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    });
  }
}
