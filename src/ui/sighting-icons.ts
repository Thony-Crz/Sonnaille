import { isFlock, type NestKind, type Observation } from '../domain/observation';
import type { Species } from '../domain/pastoral-zone';

/*
 * Pictures shown on the map and in the legend: one per species and per kind of nest
 * or beehives, in a round badge (violet ring for animals, amber for insects), plus a
 * small guard dog badge. Hand-drawn SVG, 64 × 64 (dog: 32 × 32), rendered at 2× on the map.
 */

const FLOCK_RING = '#6a3d9a';
const INSECT_RING = '#d49a00';
const INK = '#2b2b2b';

const badge = (ring: string, picture: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">` +
  `<circle cx="32" cy="32" r="29" fill="#ffffff" stroke="${ring}" stroke-width="4"/>${picture}</svg>`;

// --- Animals (side view, head on the left) -------------------------------------

const SHEEP = [
  // Legs, then a woolly body: dark circles under white ones leave only the outer outline.
  `<g fill="${INK}"><rect x="23" y="40" width="3.5" height="11" rx="1.5"/><rect x="29" y="41" width="3.5" height="10" rx="1.5"/>`,
  `<rect x="37" y="41" width="3.5" height="10" rx="1.5"/><rect x="43" y="40" width="3.5" height="11" rx="1.5"/></g>`,
  `<g fill="#555">`,
  ...[[26, 29], [34, 26], [42, 29], [24, 37], [33, 38], [43, 37]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8.6"/>`),
  `</g><g fill="#ffffff">`,
  ...[[26, 29], [34, 26], [42, 29], [24, 37], [33, 38], [43, 37]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.2"/>`),
  `</g>`,
  `<ellipse cx="15.5" cy="31" rx="5.5" ry="7" fill="${INK}"/>`,
  `<ellipse cx="19" cy="25.5" rx="4" ry="2" fill="${INK}" transform="rotate(25 19 25.5)"/>`,
  `<circle cx="14" cy="29" r="1.2" fill="#ffffff"/>`,
].join('');

const COW = [
  `<path d="M47 27 Q55 32 52 42" fill="none" stroke="${INK}" stroke-width="2"/>`,
  `<g fill="${INK}"><rect x="21" y="40" width="4.5" height="12" rx="1.5"/><rect x="27" y="40" width="4.5" height="12" rx="1.5"/>`,
  `<rect x="38" y="40" width="4.5" height="12" rx="1.5"/><rect x="43" y="40" width="4.5" height="12" rx="1.5"/></g>`,
  `<rect x="18" y="23" width="31" height="19" rx="7" fill="#ffffff" stroke="${INK}" stroke-width="2"/>`,
  `<ellipse cx="27" cy="29" rx="5" ry="4" fill="${INK}"/><ellipse cx="41" cy="35" rx="4.5" ry="3.8" fill="${INK}"/>`,
  `<path d="M9 21 L6 15 M18 21 L21 15" stroke="#b89a5e" stroke-width="2.6" stroke-linecap="round"/>`,
  `<rect x="7" y="19" width="13" height="15" rx="5.5" fill="#ffffff" stroke="${INK}" stroke-width="2"/>`,
  `<ellipse cx="13.5" cy="32" rx="5.5" ry="3.8" fill="#f2b8b0" stroke="${INK}" stroke-width="1.6"/>`,
  `<circle cx="11" cy="25" r="1.3" fill="${INK}"/><circle cx="16" cy="25" r="1.3" fill="${INK}"/>`,
].join('');

const GOAT_COLOR = '#b07b4a';
const GOAT = [
  `<g fill="#5a3a1e"><rect x="24" y="37" width="3" height="14" rx="1.2"/><rect x="29" y="38" width="3" height="13" rx="1.2"/>`,
  `<rect x="40" y="38" width="3" height="13" rx="1.2"/><rect x="45" y="37" width="3" height="14" rx="1.2"/></g>`,
  `<path d="M48 27 L53 21" stroke="#5a3a1e" stroke-width="2.6" stroke-linecap="round"/>`,
  `<ellipse cx="36" cy="32" rx="14" ry="8.5" fill="${GOAT_COLOR}" stroke="#5a3a1e" stroke-width="2"/>`,
  `<path d="M24 30 L19 22 L25 20 L29 28 Z" fill="${GOAT_COLOR}" stroke="#5a3a1e" stroke-width="1.6" stroke-linejoin="round"/>`,
  `<path d="M19 18 Q21 8 29 12" fill="none" stroke="#6b5a45" stroke-width="3" stroke-linecap="round"/>`,
  `<ellipse cx="16" cy="23" rx="7" ry="5" fill="${GOAT_COLOR}" stroke="#5a3a1e" stroke-width="1.6" transform="rotate(35 16 23)"/>`,
  `<path d="M11 27 L16 28 L12.5 36 Z" fill="#efe6d6" stroke="#5a3a1e" stroke-width="1.2" stroke-linejoin="round"/>`,
  `<ellipse cx="22" cy="19.5" rx="4" ry="1.8" fill="${GOAT_COLOR}" stroke="#5a3a1e" stroke-width="1.2"/>`,
  `<circle cx="16.5" cy="21" r="1.2" fill="${INK}"/>`,
].join('');

/** Horse and donkey share a shape: the donkey is grey, with long ears and shorter legs. */
const equine = ({ coat, dark, muzzle, ears, legs }: { coat: string; dark: string; muzzle: string; ears: string; legs: number }) =>
  [
    `<path d="M48 27 Q57 35 52 47" fill="none" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>`,
    `<g fill="${dark}">`,
    `<rect x="24" y="36" width="3.6" height="${legs}" rx="1.4"/><rect x="29" y="37" width="3.6" height="${legs - 1}" rx="1.4"/>`,
    `<rect x="40" y="37" width="3.6" height="${legs - 1}" rx="1.4"/><rect x="45" y="36" width="3.6" height="${legs}" rx="1.4"/></g>`,
    `<ellipse cx="37" cy="31" rx="13.5" ry="8" fill="${coat}" stroke="${dark}" stroke-width="1.8"/>`,
    `<path d="M26 31 L19 17 L25 14 L32 27 Z" fill="${coat}" stroke="${dark}" stroke-width="1.6" stroke-linejoin="round"/>`,
    `<path d="M20 16 Q25 13 30 24" fill="none" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>`,
    ears,
    `<ellipse cx="15" cy="20" rx="8" ry="4.6" fill="${coat}" stroke="${dark}" stroke-width="1.6" transform="rotate(32 15 20)"/>`,
    `<ellipse cx="10.5" cy="24" rx="3.4" ry="2.6" fill="${muzzle}"/>`,
    `<circle cx="16.5" cy="17.5" r="1.2" fill="${INK}"/>`,
  ].join('');

const HORSE = equine({
  coat: '#8b5a2b',
  dark: '#3b2414',
  muzzle: '#6e4520',
  ears: `<path d="M18.5 14 L19.5 8 L22.5 13 Z" fill="#8b5a2b" stroke="#3b2414" stroke-width="1.2" stroke-linejoin="round"/>`,
  legs: 15,
});

const DONKEY = equine({
  coat: '#9a9a9a',
  dark: '#4a4a4a',
  muzzle: '#e6e6e6',
  ears:
    `<ellipse cx="18" cy="9" rx="2.2" ry="7" fill="#9a9a9a" stroke="#4a4a4a" stroke-width="1.2" transform="rotate(-12 18 9)"/>` +
    `<ellipse cx="22.5" cy="10" rx="2.2" ry="7" fill="#9a9a9a" stroke="#4a4a4a" stroke-width="1.2" transform="rotate(12 22.5 10)"/>`,
  legs: 12,
});

/** Several species: a sheep in front of a cow. */
const MIXED = `<g transform="translate(19 2) scale(0.62)">${COW}</g><g transform="translate(4 22) scale(0.62)">${SHEEP}</g>`;

// --- Insects and beehives (head on the left) -------------------------------------

const wings = (fill: string, stroke: string) =>
  `<ellipse cx="27" cy="21" rx="6.5" ry="10" fill="${fill}" stroke="${stroke}" stroke-width="1.2" transform="rotate(-25 27 21)"/>` +
  `<ellipse cx="37" cy="21" rx="6.5" ry="10" fill="${fill}" stroke="${stroke}" stroke-width="1.2" transform="rotate(25 37 21)"/>`;

/** A round, hairy bee. */
const BEE = [
  `<defs><clipPath id="bee-body"><ellipse cx="34" cy="37" rx="12.5" ry="10"/></clipPath></defs>`,
  wings('#d8ecff', '#6b8fb3'),
  `<path d="M16 32 L11 24 M19 31 L17 23" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,
  `<ellipse cx="34" cy="37" rx="12.5" ry="10" fill="#f6c700"/>`,
  `<g clip-path="url(#bee-body)" fill="${INK}"><rect x="29" y="26" width="4" height="22"/><rect x="37" y="26" width="4" height="22"/></g>`,
  `<ellipse cx="34" cy="37" rx="12.5" ry="10" fill="none" stroke="${INK}" stroke-width="2"/>`,
  `<path d="M46.5 37 L52 37" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`,
  `<circle cx="19" cy="37" r="6.5" fill="${INK}"/>`,
].join('');

/** A slender wasp, with a thin waist and a pointed, striped abdomen. */
const WASP = [
  `<defs><clipPath id="wasp-body"><path d="M30 35 Q38 27 46 32 Q52 35 54 36 Q50 39 45 41 Q37 44 30 37 Z"/></clipPath></defs>`,
  `<g stroke="${INK}" stroke-width="1.4" stroke-linecap="round"><path d="M21 38 L18 47"/><path d="M24 38 L24 48"/><path d="M27 38 L30 47"/></g>`,
  `<ellipse cx="29" cy="25" rx="11" ry="4" fill="#e9eef3" fill-opacity="0.9" stroke="#7d8a96" stroke-width="1.2" transform="rotate(-18 29 25)"/>`,
  `<path d="M12 29 L8 22 M14 28 L13 21" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
  `<path d="M30 35 Q38 27 46 32 Q52 35 54 36 Q50 39 45 41 Q37 44 30 37 Z" fill="#ffd400"/>`,
  `<g clip-path="url(#wasp-body)" fill="${INK}"><rect x="35" y="25" width="3" height="22"/><rect x="41" y="25" width="3" height="22"/><rect x="47" y="25" width="2.4" height="22"/></g>`,
  `<path d="M30 35 Q38 27 46 32 Q52 35 54 36 Q50 39 45 41 Q37 44 30 37 Z" fill="none" stroke="${INK}" stroke-width="1.6"/>`,
  `<ellipse cx="24" cy="34" rx="5.5" ry="4.5" fill="${INK}"/>`,
  `<circle cx="15" cy="33" r="4.6" fill="#ffd400" stroke="${INK}" stroke-width="1.6"/>`,
  `<circle cx="14" cy="32" r="1.6" fill="${INK}"/>`,
].join('');

/** A big, dark hornet with an orange head and one orange band. */
const HORNET = [
  `<defs><clipPath id="hornet-body"><ellipse cx="40" cy="36" rx="13" ry="8"/></clipPath></defs>`,
  `<g stroke="#e3a21a" stroke-width="2" stroke-linecap="round"><path d="M22 40 L18 50"/><path d="M26 41 L26 51"/><path d="M30 40 L33 50"/></g>`,
  `<ellipse cx="30" cy="22" rx="13" ry="5" fill="#d9cbb8" fill-opacity="0.9" stroke="#8a7a66" stroke-width="1.2" transform="rotate(-18 30 22)"/>`,
  `<path d="M11 29 L6 21 M14 28 L12 20" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,
  `<ellipse cx="40" cy="36" rx="13" ry="8" fill="#2a1a10"/>`,
  `<g clip-path="url(#hornet-body)"><rect x="43" y="26" width="5" height="20" fill="#f08c00"/><rect x="36" y="26" width="1.6" height="20" fill="#e3a21a"/></g>`,
  `<ellipse cx="40" cy="36" rx="13" ry="8" fill="none" stroke="#1a0f08" stroke-width="1.6"/>`,
  `<ellipse cx="25" cy="34.5" rx="6.5" ry="6" fill="#4a2e1a" stroke="#1a0f08" stroke-width="1.4"/>`,
  `<circle cx="14.5" cy="33" r="6" fill="#f08c00" stroke="#1a0f08" stroke-width="1.6"/>`,
  `<circle cx="13" cy="31.5" r="1.8" fill="#1a0f08"/>`,
].join('');

/** A straw beehive (skep) on its board. */
const BEEHIVES = [
  `<path d="M14 47 Q13 15 32 13 Q51 15 50 47 Z" fill="#e2a73b" stroke="#7a5414" stroke-width="2" stroke-linejoin="round"/>`,
  `<g fill="none" stroke="#9a6a1c" stroke-width="1.8">`,
  `<path d="M22 20 Q32 17 42 20"/><path d="M17 27 Q32 23 47 27"/><path d="M15 34 Q32 30 49 34"/><path d="M14 41 Q32 37 50 41"/></g>`,
  `<path d="M27 47 Q32 38 37 47 Z" fill="#4a2c08"/>`,
  `<rect x="9" y="47" width="46" height="5" rx="1.5" fill="#8a5a1c"/>`,
  `<circle cx="45" cy="16" r="2.4" fill="#f6c700" stroke="${INK}" stroke-width="1"/>`,
].join('');

// --- Guard dog badge -----------------------------------------------------------------

/** A guard dog's face (white, floppy ears) on the rust of the "flock with dogs" zones. */
const DOG = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">`,
  `<circle cx="16" cy="16" r="14.5" fill="#a23b2a" stroke="#ffffff" stroke-width="2"/>`,
  `<ellipse cx="8.8" cy="16" rx="3.2" ry="6.2" fill="#e8d9c0" transform="rotate(18 8.8 16)"/>`,
  `<ellipse cx="23.2" cy="16" rx="3.2" ry="6.2" fill="#e8d9c0" transform="rotate(-18 23.2 16)"/>`,
  `<ellipse cx="16" cy="15.5" rx="6.6" ry="7.2" fill="#ffffff"/>`,
  `<ellipse cx="16" cy="19.5" rx="3.8" ry="2.9" fill="#f1e9dc"/>`,
  `<circle cx="13.4" cy="14" r="1.15" fill="#3b2a20"/><circle cx="18.6" cy="14" r="1.15" fill="#3b2a20"/>`,
  `<ellipse cx="16" cy="18.2" rx="1.7" ry="1.2" fill="#3b2a20"/>`,
  `</svg>`,
].join('');

export const DOG_ICON = 'sighting-dog';

const SPECIES_PICTURES: Record<Species, string> = {
  sheep: SHEEP,
  cattle: COW,
  goats: GOAT,
  horses: HORSE,
  donkeys: DONKEY,
  mixed: MIXED,
};

const NEST_PICTURES: Record<NestKind, string> = {
  beehives: BEEHIVES,
  'wasp-nest': WASP,
  'bee-nest': BEE,
  'hornet-nest': HORNET,
};

/** Every picture the map needs, by image id. */
export const MAP_ICONS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(SPECIES_PICTURES).map(([s, p]) => [`sighting-${s}`, badge(FLOCK_RING, p)])),
  ...Object.fromEntries(Object.entries(NEST_PICTURES).map(([k, p]) => [`sighting-${k}`, badge(INSECT_RING, p)])),
  [DOG_ICON]: DOG,
};

/** The picture of a sighting: its species, or its kind of nest or beehives. */
export function sightingIcon(observation: Observation): string {
  return isFlock(observation) ? `sighting-${observation.species}` : `sighting-${observation.kind}`;
}

export function iconDataUrl(id: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(MAP_ICONS[id] ?? '')}`;
}
