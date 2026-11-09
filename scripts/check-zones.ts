// `npx tsx scripts/check-zones.ts [file]`: checks the pastoral zones before publishing or deploying them.
// Exit code 1 when the zones are invalid (they are then removed) or missing.
import { join } from 'node:path';
import { checkZonesFile } from './check-zones-file';

const file = process.argv[2] ?? join(import.meta.dirname, '..', 'public', 'data', 'pastoral-zones.geojson');
const result = checkZonesFile(file);

if (result.status === 'valid') {
  console.log(`Zones valides : ${result.zones} zones.`);
} else if (result.status === 'missing') {
  console.error('Pas de fichier de zones : le site indiquera qu’elles sont indisponibles.');
  process.exitCode = 1;
} else {
  console.error(`Zones invalides, retirées (${result.errors.length} erreurs) : ${result.errors.slice(0, 5).join(' ; ')}`);
  process.exitCode = 1;
}
