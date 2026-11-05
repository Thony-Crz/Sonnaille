import type { Bounds } from '../domain/bounds';

/** What the use cases expect from the displayed map. Implemented in `ui`. */
export interface MapView {
  fitTo(bounds: Bounds): void;
}
