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

/** Whether two bounds overlap or touch. */
export function intersects(a: Bounds, b: Bounds): boolean {
  return a.west <= b.east && b.west <= a.east && a.south <= b.north && b.south <= a.north;
}

/** Smallest bounds containing these [longitude, latitude] positions; undefined if there are none. */
export function boundsOf(positions: number[][]): Bounds | undefined {
  if (positions.length === 0) return undefined;
  const longitudes = positions.map((p) => p[0]!);
  const latitudes = positions.map((p) => p[1]!);
  return {
    west: Math.min(...longitudes),
    south: Math.min(...latitudes),
    east: Math.max(...longitudes),
    north: Math.max(...latitudes),
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
