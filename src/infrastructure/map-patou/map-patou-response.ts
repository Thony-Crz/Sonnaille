import { boundsOf, intersects, type Bounds } from '../../domain/bounds';
import type { MultiPolygon, PastoralZone, Presence, Species } from '../../domain/pastoral-zone';

// Map Patou API response, as observed in docs/map-patou.md.
interface MapPatouProperties {
  id: string;
  nom: string;
  surface: string | null;
  type_animal: string | null;
  chiens: boolean | null;
  debut: string | null;
  fin: string | null;
  lundi?: boolean | null;
  mardi?: boolean | null;
  mercredi?: boolean | null;
  jeudi?: boolean | null;
  vendredi?: boolean | null;
  samedi?: boolean | null;
  dimanche?: boolean | null;
}

interface MapPatouFeature {
  geometry: { type: string; coordinates: MultiPolygon };
  properties: MapPatouProperties;
}

const WEEKDAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] as const;

const SPECIES_WORDS: Record<string, Species> = {
  ovins: 'sheep',
  bovins: 'cattle',
  caprins: 'goats',
  equins: 'horses',
  asins: 'donkeys',
  anes: 'donkeys',
  'ânes': 'donkeys',
  mixte: 'mixed',
};

/** Map Patou's free-text "type_animal" ("Ovins Caprins", "bovins"…) as species. */
export function parseSpecies(raw: string | null): Species[] {
  if (!raw) return [];
  const species = raw
    .toLowerCase()
    .split(/\s+/)
    .map((word) => SPECIES_WORDS[word])
    .filter((s): s is Species => s !== undefined);
  return [...new Set(species)];
}

function parsePresence(properties: MapPatouProperties): Presence | null {
  if (!properties.debut || !properties.fin) return null;
  const weekdays = WEEKDAYS.flatMap((day, index) => (properties[day] ? [index + 1] : []));
  return {
    start: properties.debut,
    end: properties.fin,
    species: parseSpecies(properties.type_animal),
    guardDogs: properties.chiens === true,
    weekdays: weekdays.length > 0 ? weekdays : [1, 2, 3, 4, 5, 6, 7],
  };
}

function isMapPatouResponse(response: unknown): response is { data: { features: MapPatouFeature[] } } {
  const r = response as { success?: unknown; data?: { features?: unknown } } | null;
  return r?.success === true && Array.isArray(r.data?.features);
}

/** Turns a Map Patou API response into the pastoral zones overlapping the territory. */
export function parseMapPatouResponse(response: unknown, territory: Bounds): PastoralZone[] {
  if (!isMapPatouResponse(response)) throw new Error('Unexpected Map Patou response');

  return response.data.features.flatMap(({ geometry, properties }) => {
    const bounds = boundsOf(geometry.coordinates.flat(2));
    if (!bounds || !intersects(bounds, territory)) return [];
    return [
      {
        id: properties.id,
        name: properties.nom,
        quarter: properties.surface ?? '',
        geometry: geometry.coordinates,
        presence: parsePresence(properties),
      },
    ];
  });
}
