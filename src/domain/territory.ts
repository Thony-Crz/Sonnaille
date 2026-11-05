import { enclosingBounds, type Bounds } from './bounds';

export interface Massif {
  name: string;
  bounds: Bounds;
}

// Approximate bounds, good enough to frame the map.
// Precise outlines will come from the pastoral zones (T11).
export const V0_MASSIFS: Massif[] = [
  { name: 'Chartreuse', bounds: { west: 5.62, south: 45.22, east: 6.02, north: 45.58 } },
  { name: 'Vercors', bounds: { west: 5.25, south: 44.68, east: 5.72, north: 45.25 } },
];

export const V0_TERRITORY: Bounds = enclosingBounds(V0_MASSIFS.map((m) => m.bounds));
