import { beforeEach, describe, expect, it, vi } from 'vitest';

const maplibre = vi.hoisted(() => {
  const cartes: Array<{ options: Record<string, unknown>; fitBounds: ReturnType<typeof vi.fn>; addControl: ReturnType<typeof vi.fn> }> = [];
  class Map {
    fitBounds = vi.fn();
    addControl = vi.fn();
    constructor(public options: Record<string, unknown>) {
      cartes.push(this);
    }
  }
  class NavigationControl {
    constructor(public options: Record<string, unknown>) {}
  }
  return { cartes, Map, NavigationControl };
});

vi.mock('maplibre-gl', () => ({ Map: maplibre.Map, NavigationControl: maplibre.NavigationControl }));

import { CarteMapLibre, STYLE_PLAN_IGN } from './carte-maplibre';

const conteneur = {} as HTMLElement;

describe('CarteMapLibre', () => {
  beforeEach(() => {
    maplibre.cartes.length = 0;
  });

  it('crée une carte MapLibre dans le conteneur, avec le style Plan IGN', () => {
    new CarteMapLibre(conteneur);

    expect(maplibre.cartes).toHaveLength(1);
    expect(maplibre.cartes[0]?.options).toMatchObject({ container: conteneur, style: STYLE_PLAN_IGN });
  });

  it('utilise le style vectoriel Plan IGN de la Géoplateforme', () => {
    expect(STYLE_PLAN_IGN).toBe('https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json');
  });

  it("affiche l'attribution de l'IGN", () => {
    new CarteMapLibre(conteneur);

    expect(maplibre.cartes[0]?.options).toMatchObject({
      attributionControl: { customAttribution: expect.stringContaining('IGN') },
    });
  });

  it('ajoute les boutons de zoom', () => {
    new CarteMapLibre(conteneur);

    expect(maplibre.cartes[0]?.addControl).toHaveBeenCalledWith(expect.any(maplibre.NavigationControl), 'top-right');
  });

  it("cadre la carte sur l'emprise demandée, avec une marge et sans animation", () => {
    const carte = new CarteMapLibre(conteneur);

    carte.cadrerSur({ ouest: 5.25, sud: 44.68, est: 6.02, nord: 45.58 });

    expect(maplibre.cartes[0]?.fitBounds).toHaveBeenCalledWith(
      [
        [5.25, 44.68],
        [6.02, 45.58],
      ],
      { padding: 24, animate: false },
    );
  });
});
