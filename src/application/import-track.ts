import { trackBounds, trackLengthMeters, type Track } from '../domain/track';
import type { MapView, TrackReader } from './ports';

export type ImportResult = { ok: true; track: Track; lengthKm: number } | { ok: false; error: string };

/** Reads an imported file on the device, shows the track and frames the map on it. */
export function importTrack(text: string, fileName: string, reader: TrackReader, map: MapView): ImportResult {
  let track: Track;
  try {
    track = reader.read(text, fileName);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }

  map.showTrack(track);
  const bounds = trackBounds(track);
  if (bounds) map.fitTo(bounds);
  return { ok: true, track, lengthKm: Math.round(trackLengthMeters(track) / 100) / 10 };
}
