// Point de composition : c'est le seul fichier qui assemble les adaptateurs
// avec les cas d'usage (application) et l'interface (ui).
import './ui/style.css';
import { afficherTerritoire } from './application/afficher-territoire';
import { CarteMapLibre } from './ui/carte-maplibre';
import { configurerMapLibre } from './ui/configurer-maplibre';

configurerMapLibre();

const conteneur = document.querySelector<HTMLElement>('#carte');
if (!conteneur) throw new Error('Élément #carte introuvable');

afficherTerritoire(new CarteMapLibre(conteneur));
