import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findDependencyViolations, type SourceFile } from './dependency-rules';

const ROOT = join(import.meta.dirname, '..', '..');
const SRC = join(ROOT, 'src');

function listTsFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return listTsFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe('src/ architecture', () => {
  it.each(['domain', 'application', 'infrastructure', 'ui'])('has the %s layer', (layer) => {
    expect(existsSync(join(SRC, layer))).toBe(true);
  });

  it('respects the dependency rule between layers', () => {
    const files: SourceFile[] = listTsFiles(SRC).map((path) => ({
      path: relative(ROOT, path).split(sep).join('/'),
      content: readFileSync(path, 'utf8'),
    }));

    expect(findDependencyViolations(files)).toEqual([]);
  });
});
