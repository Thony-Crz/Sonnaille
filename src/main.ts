// Point de composition : c'est le seul fichier qui assemble les adaptateurs
// (infrastructure) avec les cas d'usage (application) et l'interface (ui).
// Pour l'instant, la V0 affiche seulement une page vide (T06).

const app = document.querySelector<HTMLElement>('#app');
if (app) {
  app.textContent = 'Sonnaille — bientôt une carte.';
}
