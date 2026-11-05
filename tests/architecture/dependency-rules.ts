import { posix } from 'node:path';

export interface SourceFile {
  /** Path from the repository root, with "/" separators (e.g. `src/domain/bounds.ts`). */
  path: string;
  content: string;
}

export interface Violation {
  path: string;
  imports: string;
  rule: string;
}

type Layer = 'domain' | 'application' | 'infrastructure' | 'ui';

/**
 * Clean architecture dependency rule: each layer only depends on more inner layers.
 * `src/main.ts` is the composition root and may import anything.
 */
const RULES: Record<Layer, { layers: Layer[]; libraries: boolean }> = {
  domain: { layers: ['domain'], libraries: false },
  application: { layers: ['domain', 'application'], libraries: false },
  infrastructure: { layers: ['domain', 'application', 'infrastructure'], libraries: true },
  ui: { layers: ['domain', 'application', 'ui'], libraries: true },
};

const LAYERS = Object.keys(RULES) as Layer[];

// `from '…'`, `import '…'` and `import('…')`
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g;

function layerOf(path: string): Layer | undefined {
  const [root, layer] = path.split('/');
  return root === 'src' && LAYERS.includes(layer as Layer) ? (layer as Layer) : undefined;
}

function isTestFile(path: string): boolean {
  return path.endsWith('.test.ts');
}

export function findDependencyViolations(files: SourceFile[]): Violation[] {
  const violations: Violation[] = [];

  for (const { path, content } of files) {
    const layer = layerOf(path);
    if (!layer) continue;
    const rule = RULES[layer];

    for (const [, imported] of content.matchAll(IMPORT)) {
      if (!imported) continue;

      if (!imported.startsWith('.')) {
        const allowed = rule.libraries || (isTestFile(path) && imported === 'vitest');
        if (!allowed) {
          violations.push({ path, imports: imported, rule: `${layer} must not depend on any external library` });
        }
        continue;
      }

      const target = layerOf(posix.join(posix.dirname(path), imported));
      if (target && !rule.layers.includes(target)) {
        violations.push({ path, imports: imported, rule: `${layer} must not depend on ${target}` });
      }
    }
  }

  return violations;
}
