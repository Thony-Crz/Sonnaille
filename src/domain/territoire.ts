import { empriseEnglobante, type Emprise } from './emprise';

export interface Massif {
  nom: string;
  emprise: Emprise;
}

// Emprises approximatives, suffisantes pour cadrer la carte.
// Les contours précis viendront des zones pastorales (T11).
export const MASSIFS_V0: Massif[] = [
  { nom: 'Chartreuse', emprise: { ouest: 5.62, sud: 45.22, est: 6.02, nord: 45.58 } },
  { nom: 'Vercors', emprise: { ouest: 5.25, sud: 44.68, est: 5.72, nord: 45.25 } },
];

export const TERRITOIRE_V0: Emprise = empriseEnglobante(MASSIFS_V0.map((m) => m.emprise));
