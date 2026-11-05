import { Map, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Carte } from '../application/ports';
import type { Emprise } from '../domain/emprise';

/** Style vectoriel Plan IGN servi par la Géoplateforme, sans clé. */
export const STYLE_PLAN_IGN = 'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json';

export class CarteMapLibre implements Carte {
  private readonly carte: Map;

  constructor(conteneur: HTMLElement) {
    this.carte = new Map({
      container: conteneur,
      style: STYLE_PLAN_IGN,
      attributionControl: { customAttribution: '© IGN — Plan IGN' },
    });
    this.carte.addControl(new NavigationControl({ showCompass: false }), 'top-right');
  }

  cadrerSur({ ouest, sud, est, nord }: Emprise): void {
    this.carte.fitBounds(
      [
        [ouest, sud],
        [est, nord],
      ],
      { padding: 24, animate: false },
    );
  }
}
