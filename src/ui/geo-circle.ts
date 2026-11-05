import type { Position } from '../domain/bounds';

const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

/** A closed ring of points at `radiusMeters` around the center (to draw a halo on the map). */
export function circleRing(center: Position, radiusMeters: number, steps = 48): number[][] {
  const angularDistance = radiusMeters / EARTH_RADIUS_METERS;
  const latitude = toRadians(center.latitude);
  const longitude = toRadians(center.longitude);

  const ring = Array.from({ length: steps }, (_, i) => {
    const bearing = (2 * Math.PI * i) / steps;
    const pointLatitude = Math.asin(
      Math.sin(latitude) * Math.cos(angularDistance) + Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const pointLongitude =
      longitude +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
        Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(pointLatitude),
      );
    return [toDegrees(pointLongitude), toDegrees(pointLatitude)];
  });
  return [...ring, ring[0]!];
}
