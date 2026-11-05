// Generates the PNG app icons from the "A — Sonnaille" logo.
// Run after changing the logo: `npm run icons`. The PNGs are committed.
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const ICONS = join(import.meta.dirname, '..', 'public', 'icons');

const GREEN = '#2f5d3a';
const MILK = '#f4f1ea';
const BRASS = '#e0a43a';

// The bell, drawn on a 512×512 canvas, centered on (256, 266).
const bell = `
  <path d="M206 154a50 50 0 0 1 100 0" fill="none" stroke="${MILK}" stroke-width="24" stroke-linecap="round"/>
  <path d="M196 162H316L352 360Q356 382 334 382H178Q156 382 160 360Z" fill="${MILK}"/>
  <circle cx="256" cy="404" r="24" fill="${BRASS}"/>`;

/** Rounded tile with transparent corners: browsers, desktop, Android "any". */
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${GREEN}"/>${bell}</svg>`;

/**
 * Full-bleed square, bell scaled into the central safe zone:
 * Android "maskable" icons and iPhone home screen icons, which apply their own mask.
 */
const fullBleed = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${GREEN}"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -266)">${bell}</g></svg>`;

const outputs = [
  { file: 'icon-192.png', svg: rounded, size: 192 },
  { file: 'icon-512.png', svg: rounded, size: 512 },
  { file: 'icon-maskable-512.png', svg: fullBleed(0.72), size: 512 },
  { file: 'apple-touch-icon.png', svg: fullBleed(0.85), size: 180 },
];

for (const { file, svg, size } of outputs) {
  const png = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  await writeFile(join(ICONS, file), png);
  console.log(`${file} (${size}×${size})`);
}
