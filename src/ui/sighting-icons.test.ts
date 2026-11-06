// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { NEST_KINDS, type Observation } from '../domain/observation';
import { SPECIES } from '../domain/pastoral-zone';
import { DOG_ICON, MAP_ICONS, iconDataUrl, sightingIcon } from './sighting-icons';

const here = { longitude: 5.65, latitude: 45.11 };
const flock = (species: (typeof SPECIES)[number], guardDogs = false): Observation => ({
  id: 'f',
  observedAt: '2026-07-15T07:30:00.000Z',
  position: here,
  species,
  headcount: 'few',
  guardDogs,
});

describe('sighting icons: a clear picture for each kind of sighting', () => {
  it('has one icon per species and per kind of nest or beehives', () => {
    expect(SPECIES.map((s) => sightingIcon(flock(s)))).toEqual(SPECIES.map((s) => `sighting-${s}`));
    for (const kind of NEST_KINDS) {
      expect(sightingIcon({ id: 'n', observedAt: '2026-07-15T07:30:00.000Z', position: here, kind })).toBe(`sighting-${kind}`);
    }
  });

  it('draws every icon as an SVG image, plus the guard dog badge', () => {
    const ids = [...SPECIES.map((s) => `sighting-${s}`), ...NEST_KINDS.map((k) => `sighting-${k}`), DOG_ICON];

    for (const id of ids) {
      const svg = MAP_ICONS[id];
      expect(svg, id).toBeDefined();
      const root = new DOMParser().parseFromString(svg!, 'image/svg+xml').documentElement;
      expect(root.nodeName, id).toBe('svg');
      expect(root.getAttribute('viewBox'), id).toMatch(/^0 0 \d+ \d+$/);
    }
  });

  it('gives each icon as a data URL, for the map and the legend', () => {
    expect(iconDataUrl(DOG_ICON)).toMatch(/^data:image\/svg\+xml;charset=utf-8,%3Csvg/);
  });
});
