import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { violationsDeDependance, type FichierSource } from './regles-dependance';

const RACINE = join(import.meta.dirname, '..', '..');
const SRC = join(RACINE, 'src');

function fichiersTs(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiersTs(chemin);
    return /\.tsx?$/.test(nom) ? [chemin] : [];
  });
}

describe('architecture de src/', () => {
  it.each(['domain', 'application', 'infrastructure', 'ui'])('contient la couche %s', (couche) => {
    expect(existsSync(join(SRC, couche))).toBe(true);
  });

  it('respecte la règle de dépendance entre couches', () => {
    const fichiers: FichierSource[] = fichiersTs(SRC).map((chemin) => ({
      chemin: relative(RACINE, chemin).split(sep).join('/'),
      contenu: readFileSync(chemin, 'utf8'),
    }));

    expect(violationsDeDependance(fichiers)).toEqual([]);
  });
});
