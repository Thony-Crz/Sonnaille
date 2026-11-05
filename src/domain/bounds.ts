/** Geographic rectangle in WGS84 degrees. */
export interface Bounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface Position {
  longitude: number;
  latitude: number;
}

export function enclosingBounds(bounds: Bounds[]): Bounds {
  if (bounds.length === 0) throw new Error('No bounds to enclose');

  return {
    west: Math.min(...bounds.map((b) => b.west)),
    south: Math.min(...bounds.map((b) => b.south)),
    east: Math.max(...bounds.map((b) => b.east)),
    north: Math.max(...bounds.map((b) => b.north)),
  };
}

export function contains(bounds: Bounds, { longitude, latitude }: Position): boolean {
  return (
    longitude >= bounds.west &&
    longitude <= bounds.east &&
    latitude >= bounds.south &&
    latitude <= bounds.north
  );
}
