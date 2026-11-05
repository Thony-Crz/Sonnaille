import { describe, expect, it } from 'vitest';
import { violationsDeDependance } from './regles-dependance';

const fichier = (chemin: string, contenu: string) => ({ chemin, contenu });

describe('violationsDeDependance', () => {
  it("n'en trouve aucune quand le domaine n'importe que le domaine", () => {
    const violations = violationsDeDependance([
      fichier('src/domain/zone.ts', "import { Periode } from './periode';"),
    ]);

    expect(violations).toEqual([]);
  });

  it("signale le domaine qui importe l'infrastructure", () => {
    const violations = violationsDeDependance([
      fichier('src/domain/zone.ts', "import { MapPatou } from '../infrastructure/map-patou';"),
    ]);

    expect(violations).toEqual([
      { chemin: 'src/domain/zone.ts', importe: '../infrastructure/map-patou', regle: 'domain ne dépend pas de infrastructure' },
    ]);
  });

  it('signale le domaine qui importe une bibliothèque externe', () => {
    const violations = violationsDeDependance([
      fichier('src/domain/trace.ts', "import * as turf from '@turf/turf';"),
    ]);

    expect(violations).toEqual([
      { chemin: 'src/domain/trace.ts', importe: '@turf/turf', regle: 'domain ne dépend d’aucune bibliothèque externe' },
    ]);
  });

  it("signale l'application qui importe l'interface", () => {
    const violations = violationsDeDependance([
      fichier('src/application/preparer-sortie.ts', "import { Carte } from '../ui/carte';"),
    ]);

    expect(violations).toEqual([
      { chemin: 'src/application/preparer-sortie.ts', importe: '../ui/carte', regle: 'application ne dépend pas de ui' },
    ]);
  });

  it("autorise l'infrastructure à dépendre du domaine, de l'application et des bibliothèques", () => {
    const violations = violationsDeDependance([
      fichier(
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

  it("signale l'interface qui importe l'infrastructure", () => {
    const violations = violationsDeDependance([
      fichier('src/ui/carte.ts', "import { MapPatou } from '../infrastructure/map-patou';"),
    ]);

    expect(violations).toEqual([
      { chemin: 'src/ui/carte.ts', importe: '../infrastructure/map-patou', regle: 'ui ne dépend pas de infrastructure' },
    ]);
  });

  it('laisse le point de composition (src/main.ts) tout importer', () => {
    const violations = violationsDeDependance([
      fichier('src/main.ts', "import { MapPatou } from './infrastructure/map-patou';\nimport { Carte } from './ui/carte';"),
    ]);

    expect(violations).toEqual([]);
  });

  it('reconnaît aussi les imports dynamiques et les réexports', () => {
    const violations = violationsDeDependance([
      fichier(
        'src/domain/index.ts',
        "export { x } from '../ui/x';\nconst m = await import('../infrastructure/y');",
      ),
    ]);

    expect(violations.map((v) => v.importe)).toEqual(['../ui/x', '../infrastructure/y']);
  });
});
