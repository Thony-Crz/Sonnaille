import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..', '..');
const PUBLIC = join(ROOT, 'public');
const manifestPath = join(PUBLIC, 'manifest.webmanifest');

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

const readManifest = () => JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown> & { icons: ManifestIcon[] };
const indexHtml = () => readFileSync(join(ROOT, 'index.html'), 'utf8');
const pngSize = (path: string) => {
  const png = readFileSync(path);
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
};

describe('web app manifest', () => {
  it('exists in public/', () => {
    expect(existsSync(manifestPath)).toBe(true);
  });

  it('names the app and describes it in French', () => {
    expect(readManifest()).toMatchObject({ name: 'Sonnaille', short_name: 'Sonnaille', lang: 'fr' });
    expect(readManifest().description).toEqual(expect.any(String));
  });

  it('opens full screen, within the GitHub Pages sub-path', () => {
    // Relative to the manifest URL, so it works under /Sonnaille/ as well as locally.
    expect(readManifest()).toMatchObject({ display: 'standalone', start_url: './', scope: './' });
  });

  it('declares theme and background colors', () => {
    expect(readManifest()).toMatchObject({
      theme_color: expect.stringMatching(/^#[0-9a-f]{6}$/i),
      background_color: expect.stringMatching(/^#[0-9a-f]{6}$/i),
    });
  });

  it.each([
    ['192x192', 'any'],
    ['512x512', 'any'],
    ['512x512', 'maskable'],
  ])('has a %s PNG icon for purpose "%s", with the right pixel size', (sizes, purpose) => {
    const icon = readManifest().icons.find((i) => i.sizes === sizes && (i.purpose ?? 'any') === purpose);

    expect(icon).toMatchObject({ type: 'image/png' });
    const file = join(PUBLIC, icon!.src);
    expect(existsSync(file)).toBe(true);
    const [width, height] = sizes.split('x').map(Number);
    expect(pngSize(file)).toEqual({ width, height });
  });
});

describe('index.html', () => {
  it('links the manifest', () => {
    expect(indexHtml()).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
  });

  it('sets the browser theme color to the manifest one', () => {
    expect(indexHtml()).toContain(`<meta name="theme-color" content="${readManifest().theme_color}" />`);
  });

  it('gives iPhones a 180×180 home screen icon', () => {
    expect(indexHtml()).toContain('<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />');
    expect(pngSize(join(PUBLIC, 'icons', 'apple-touch-icon.png'))).toEqual({ width: 180, height: 180 });
  });

  it('names the app on iPhone home screens', () => {
    expect(indexHtml()).toContain('<meta name="apple-mobile-web-app-title" content="Sonnaille" />');
  });

  it('has a favicon', () => {
    expect(indexHtml()).toContain('<link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />');
    expect(existsSync(join(PUBLIC, 'icons', 'icon.svg'))).toBe(true);
  });
});
