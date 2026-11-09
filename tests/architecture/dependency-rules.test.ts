import { describe, expect, it } from 'vitest';
import { findDependencyViolations } from './dependency-rules';

const file = (path: string, content: string) => ({ path, content });

describe('findDependencyViolations', () => {
  it('finds none when the domain only imports the domain', () => {
    const violations = findDependencyViolations([
      file('src/domain/zone.ts', "import { Period } from './period';"),
    ]);

    expect(violations).toEqual([]);
  });

  it('reports the domain importing infrastructure', () => {
    const violations = findDependencyViolations([
      file('src/domain/zone.ts', "import { MapPatou } from '../infrastructure/map-patou';"),
    ]);

    expect(violations).toEqual([
      { path: 'src/domain/zone.ts', imports: '../infrastructure/map-patou', rule: 'domain must not depend on infrastructure' },
    ]);
  });

  it('reports the domain importing an external library', () => {
    const violations = findDependencyViolations([
      file('src/domain/track.ts', "import * as turf from '@turf/turf';"),
    ]);

    expect(violations).toEqual([
      { path: 'src/domain/track.ts', imports: '@turf/turf', rule: 'domain must not depend on any external library' },
    ]);
  });

  it('reports the application importing the ui', () => {
    const violations = findDependencyViolations([
      file('src/application/prepare-outing.ts', "import { MapView } from '../ui/map-view';"),
    ]);

    expect(violations).toEqual([
      { path: 'src/application/prepare-outing.ts', imports: '../ui/map-view', rule: 'application must not depend on ui' },
    ]);
  });

  it('allows infrastructure to depend on the domain, the application and libraries', () => {
    const violations = findDependencyViolations([
      file(
        'src/infrastructure/map-patou.ts',
        [
          "import type { Zone } from '../domain/zone';",
          "import type { ZoneRepository } from '../application/ports';",
          "import { parse } from 'some-lib';",
        ].join('\n'),
      ),
    ]);

    expect(violations).toEqual([]);
  });

  it('reports the ui importing infrastructure', () => {
    const violations = findDependencyViolations([
      file('src/ui/map-view.ts', "import { MapPatou } from '../infrastructure/map-patou';"),
    ]);

    expect(violations).toEqual([
      { path: 'src/ui/map-view.ts', imports: '../infrastructure/map-patou', rule: 'ui must not depend on infrastructure' },
    ]);
  });

  it('lets the composition root (src/main.ts) import anything', () => {
    const violations = findDependencyViolations([
      file('src/main.ts', "import { MapPatou } from './infrastructure/map-patou';\nimport { MapView } from './ui/map-view';"),
    ]);

    expect(violations).toEqual([]);
  });

  it('also detects dynamic imports and re-exports', () => {
    const violations = findDependencyViolations([
      file('src/domain/index.ts', "export { x } from '../ui/x';\nconst m = await import('../infrastructure/y');"),
    ]);

    expect(violations.map((v) => v.imports)).toEqual(['../ui/x', '../infrastructure/y']);
  });

  it('lets the Angular front (src/app) use the domain, the application and its own code', () => {
    const violations = findDependencyViolations([
      file(
        'src/app/zone-sheet.ts',
        ["import { zoneStatus } from '../domain/zone-status';", "import { Store } from './store';", "import { Component } from '@angular/core';"].join('\n'),
      ),
    ]);

    expect(violations).toEqual([]);
  });

  it('reports the Angular front importing infrastructure outside its composition root', () => {
    const violations = findDependencyViolations([
      file('src/app/zone-sheet.ts', "import { readGpx } from '../infrastructure/gpx-reader';"),
      file('src/app/app.config.ts', "import { readGpx } from '../infrastructure/gpx-reader';"),
    ]);

    expect(violations).toEqual([
      { path: 'src/app/zone-sheet.ts', imports: '../infrastructure/gpx-reader', rule: 'app must not depend on infrastructure' },
    ]);
  });
});
