import type { Track, TrackPoint } from '../domain/track';

// Messages shown to users, hence in French.
const NOT_GPX = "Ce fichier n'est pas un GPX.";
const NO_TRACK = 'Ce GPX ne contient ni trace ni itinéraire.';

const childText = (parent: Element, tag: string): string | undefined =>
  [...parent.children].find((c) => c.localName === tag)?.textContent?.trim() || undefined;

function readPoint(element: Element): TrackPoint | null {
  const latitude = Number.parseFloat(element.getAttribute('lat') ?? '');
  const longitude = Number.parseFloat(element.getAttribute('lon') ?? '');
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }

  const point: TrackPoint = { latitude, longitude };
  const elevation = Number.parseFloat(childText(element, 'ele') ?? '');
  if (Number.isFinite(elevation)) point.elevation = elevation;
  const time = childText(element, 'time');
  if (time) point.time = time;
  return point;
}

const readPoints = (elements: Iterable<Element>) =>
  [...elements].map(readPoint).filter((p): p is TrackPoint => p !== null);

/**
 * Reads a GPX file in the browser (tracks and routes, as exported by Strava, Komoot,
 * Garmin, Visorando…). The file never leaves the device.
 */
export function readGpx(text: string, fileName: string): Track {
  // The text is already decoded: the XML declaration (sometimes single-quoted, as in
  // Komoot exports, which some parsers reject) and a byte order mark add nothing.
  const xml = text.replace(/^﻿?\s*<\?xml[^?]*\?>/, '');
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const root = document.documentElement;
  if (!root || root.localName !== 'gpx' || document.getElementsByTagName('parsererror').length > 0) {
    throw new Error(NOT_GPX);
  }

  const tracks = [...root.getElementsByTagName('trk')];
  const routes = [...root.getElementsByTagName('rte')];
  const segments = [
    ...tracks.flatMap((trk) => [...trk.getElementsByTagName('trkseg')].map((seg) => readPoints(seg.getElementsByTagName('trkpt')))),
    ...routes.map((rte) => readPoints(rte.getElementsByTagName('rtept'))),
  ].filter((segment) => segment.length > 0);
  if (segments.length === 0) throw new Error(NO_TRACK);

  const metadata = [...root.children].find((c) => c.localName === 'metadata');
  const name =
    [...tracks, ...routes].map((e) => childText(e, 'name')).find(Boolean) ??
    (metadata && childText(metadata, 'name')) ??
    fileName.replace(/\.gpx$/i, '');

  return { name, segments };
}
