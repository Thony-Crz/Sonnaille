import { boundsOf, type Bounds, type Position } from './bounds';
import type { MultiPolygon, PastoralZone } from './pastoral-zone';
import { sampleTrack, type Track } from './track';
import type { ZoneStatus } from './zone-status';

/** A zone the track goes through (or passes within the margin of). */
export interface Crossing {
  zone: PastoralZone;
  status: ZoneStatus;
  /** First point of the track in the zone. */
  entry: Position;
  /** Distance along the track from the start to the entry. */
  entryDistanceMeters: number;
  /** Total length of the track inside the zone (all passages added up). */
  insideMeters: number;
}

const METERS_PER_DEGREE = 111_195;

function inRing(point: Position, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    const crosses = yi! > point.latitude !== yj! > point.latitude;
    if (crosses && point.longitude < ((xj! - xi!) * (point.latitude - yi!)) / (yj! - yi!) + xi!) inside = !inside;
  }
  return inside;
}

/** Whether the point is in the zone: inside an outer ring and outside its holes. */
export function isInside(point: Position, geometry: MultiPolygon): boolean {
  return geometry.some(([outer, ...holes]) => outer !== undefined && inRing(point, outer) && !holes.some((h) => inRing(point, h)));
}

/** Distance from the point to the zone, in meters (0 inside). Local flat projection: fine at hiking scale. */
export function distanceToZoneMeters(point: Position, geometry: MultiPolygon): number {
  if (isInside(point, geometry)) return 0;

  const xScale = METERS_PER_DEGREE * Math.cos((point.latitude * Math.PI) / 180);
  const toXY = ([longitude, latitude]: number[]) => [
    (longitude! - point.longitude) * xScale,
    (latitude! - point.latitude) * METERS_PER_DEGREE,
  ];

  let nearest = Infinity;
  for (const ring of geometry.flat()) {
    for (let i = 1; i < ring.length; i++) {
      const [ax, ay] = toXY(ring[i - 1]!);
      const [bx, by] = toXY(ring[i]!);
      const dx = bx! - ax!;
      const dy = by! - ay!;
      const lengthSquared = dx * dx + dy * dy;
      const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, -(ax! * dx + ay! * dy) / lengthSquared));
      nearest = Math.min(nearest, Math.hypot(ax! + t * dx, ay! + t * dy));
    }
  }
  return nearest;
}

function grow(bounds: Bounds, meters: number): Bounds {
  const latitude = meters / METERS_PER_DEGREE;
  const longitude = meters / (METERS_PER_DEGREE * Math.cos((((bounds.south + bounds.north) / 2) * Math.PI) / 180));
  return { west: bounds.west - longitude, south: bounds.south - latitude, east: bounds.east + longitude, north: bounds.north + latitude };
}

const contains = (b: Bounds, p: Position) => p.longitude >= b.west && p.longitude <= b.east && p.latitude >= b.south && p.latitude <= b.north;

/**
 * The zones the track goes through or passes within `marginMeters` of, in the order
 * the track reaches them. The track is sampled every `stepMeters` (10 m by default).
 */
export function detectCrossings(
  track: Track,
  zones: Array<{ zone: PastoralZone; status: ZoneStatus }>,
  { marginMeters, stepMeters = 10 }: { marginMeters: number; stepMeters?: number },
): Crossing[] {
  const candidates = zones.flatMap((z) => {
    const bounds = boundsOf(z.zone.geometry.flat(2));
    return bounds ? [{ ...z, area: grow(bounds, marginMeters) }] : [];
  });

  const crossings = new Map<string, Crossing>();
  let previousIn = new Set<string>();
  let previousDistance = 0;
  for (const sample of sampleTrack(track, stepMeters)) {
    const nowIn = new Set<string>();
    for (const { zone, status, area } of candidates) {
      if (!contains(area, sample.position)) continue;
      const near =
        marginMeters > 0
          ? distanceToZoneMeters(sample.position, zone.geometry) <= marginMeters
          : isInside(sample.position, zone.geometry);
      if (!near) continue;

      nowIn.add(zone.id);
      const crossing = crossings.get(zone.id);
      if (!crossing) {
        crossings.set(zone.id, { zone, status, entry: sample.position, entryDistanceMeters: sample.distance, insideMeters: 0 });
      } else if (sample.continues && previousIn.has(zone.id)) {
        // Only the stretch between two consecutive samples in the zone counts as inside.
        crossing.insideMeters += sample.distance - previousDistance;
      }
    }
    previousIn = nowIn;
    previousDistance = sample.distance;
  }

  return [...crossings.values()].sort((a, b) => a.entryDistanceMeters - b.entryDistanceMeters);
}
