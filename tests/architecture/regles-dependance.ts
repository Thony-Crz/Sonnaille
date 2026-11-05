import { posix } from 'node:path';

export interface FichierSource {
  /** Chemin depuis la racine du dépôt, avec des « / » (ex. `src/domain/zone.ts`). */
  chemin: string;
  contenu: string;
}

export interface Violation {
  chemin: string;
  importe: string;
  regle: string;
}

type Couche = 'domain' | 'application' | 'infrastructure' | 'ui';

/**
 * Règle de dépendance de la clean architecture : chaque couche ne dépend que des couches
 * plus internes. `src/main.ts` est le point de composition et peut tout importer.
 */
const REGLES: Record<Couche, { couches: Couche[]; bibliotheques: boolean }> = {
  domain: { couches: ['domain'], bibliotheques: false },
  application: { couches: ['domain', 'application'], bibliotheques: false },
  infrastructure: { couches: ['domain', 'application', 'infrastructure'], bibliotheques: true },
  ui: { couches: ['domain', 'application', 'ui'], bibliotheques: true },
};

const COUCHES = Object.keys(REGLES) as Couche[];

// `from '…'`, `import '…'` et `import('…')`
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g;

function coucheDe(chemin: string): Couche | undefined {
  const [racine, couche] = chemin.split('/');
  return racine === 'src' && COUCHES.includes(couche as Couche) ? (couche as Couche) : undefined;
}

function estTest(chemin: string): boolean {
  return chemin.endsWith('.test.ts');
}

export function violationsDeDependance(fichiers: FichierSource[]): Violation[] {
  const violations: Violation[] = [];

  for (const { chemin, contenu } of fichiers) {
    const couche = coucheDe(chemin);
    if (!couche) continue;
    const regle = REGLES[couche];

    for (const [, importe] of contenu.matchAll(IMPORT)) {
      if (!importe) continue;

      if (!importe.startsWith('.')) {
        const autorise = regle.bibliotheques || (estTest(chemin) && importe === 'vitest');
        if (!autorise) {
          violations.push({ chemin, importe, regle: `${couche} ne dépend d’aucune bibliothèque externe` });
        }
        continue;
      }

      const cible = coucheDe(posix.join(posix.dirname(chemin), importe));
      if (cible && !regle.couches.includes(cible)) {
        violations.push({ chemin, importe, regle: `${couche} ne dépend pas de ${cible}` });
      }
    }
  }

  return violations;
}
