/* ══════════════════════════════════════════════════════════════════
   js/data.js — Données globales et chargement du JSON
   Chargé sur toutes les pages.
   Fournit : DATA_URL, ALL_PROJECTS, activeTag, loadProjectsJson,
             resolveImageUrl.
   ══════════════════════════════════════════════════════════════════ */


/**
 * URL du JSON selon la position de la page dans l'arborescence.
 * Les pages de projet sont dans /projects/, donc le JSON est à ../data/.
 */
const DATA_URL = (() => {
  const path = location.pathname.split('/').filter(Boolean);
  return path.includes('projects') ? '../data/projects.json' : 'data/projects.json';
})();

/** Cache de tous les projets après chargement initial. */
let ALL_PROJECTS = [];

/** Tag de filtre actif sur l'index (null = aucun filtre). */
let activeTag = null;


/**
 * loadProjectsJson()
 * Récupère data/projects.json, remplit ALL_PROJECTS et retourne
 * le tableau. En cas d'erreur réseau, affiche un message dans
 * #projects si l'élément existe.
 *
 * @returns {Promise<Array>}  Tableau des projets (vide si erreur)
 */
async function loadProjectsJson() {
  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    ALL_PROJECTS = Array.isArray(json) ? json : [];
    return ALL_PROJECTS;
  } catch (err) {
    console.error('Erreur fetch projects.json :', DATA_URL, err);
    const el = document.getElementById('projects');
    if (el) {
      el.innerHTML = `
        <div class="project-card">
          <p class="project-desc muted">
            Impossible de charger <strong>data/projects.json</strong>.
            Si tu travailles en local, lance un serveur
            (ex : <code>python -m http.server</code>).
          </p>
        </div>`;
    }
    return [];
  }
}


/**
 * resolveImageUrl(candidate, slug)
 * Construit l'URL finale d'une image à partir d'un nom de fichier
 * et du slug du projet.
 *
 * Gestion des cas :
 * – URL absolue (http/https/data) → retournée telle quelle
 * – Chemin déjà préfixé assets/ → retourné tel quel
 * – Nom de fichier simple → préfixé avec assets/<slug>/
 *
 * @param {string} candidate  Nom de fichier ou chemin relatif
 * @param {string} slug       Slug du projet (ex : "dnd-companion")
 * @returns {string|null}     URL résolue ou null si candidate vide
 */
function resolveImageUrl(candidate, slug) {
  if (!candidate) return null;
  const s     = String(candidate).trim();
  const lower = s.toLowerCase();
  if (!s) return null;

  /* URLs absolues et data URIs → passer directement */
  if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('data:')) {
    return s;
  }

  /* Chemin déjà résolu → passer directement */
  if (lower.startsWith('assets/') || lower.startsWith('../assets/') || lower.startsWith('./assets/')) {
    return s;
  }

  /* Chemin relatif → construire depuis assets/ */
  const inProjects = location.pathname.split('/').filter(Boolean).includes('projects');
  const prefix     = inProjects ? '../' : '';
  const cleaned    = s.replace(/^(\.\/|\/)+/, '');
  const parts      = cleaned.split('/').filter(Boolean).map(p => encodeURIComponent(p));

  return `${prefix}assets/${encodeURIComponent(slug)}/${parts.join('/')}`;
}
