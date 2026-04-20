/* ══════════════════════════════════════════════════════════════════
   js/main.js — Orchestrateur d'initialisation
   Chargé sur toutes les pages, en dernier.

   Rôle : appeler les fonctions des autres modules dans le bon ordre
   au DOMContentLoaded. Utilise des guards typeof pour ne déclencher
   que les fonctions disponibles sur la page courante.
   ══════════════════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────
   HASHCHANGE — mise à jour du filtre (index)
   Écouté globalement ; ignoré sur les pages
   de projet car renderProjects n'y est pas défini.
───────────────────────────────────────────── */
window.addEventListener('hashchange', () => {
  if (typeof renderProjects !== 'function') return;

  const tag = readTagFromHash();
  if (tag !== activeTag) {
    activeTag = tag;
    renderProjects(ALL_PROJECTS, activeTag);
    updateFilterBar();
    refreshCardsDebounced(ALL_PROJECTS);
  }
});


/* ─────────────────────────────────────────────
   INITIALISATION AU CHARGEMENT
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {

  /* ── Commun à toutes les pages ── */
  renderFooter();
  initStickyNav();
  initScrollReveal();


  /* ── Page d'accueil (index.html) ── */
  if (typeof renderProjects === 'function' && document.getElementById('projects')) {
    const projects    = await loadProjectsJson();
    const tagFromHash = readTagFromHash();
    if (tagFromHash) activeTag = tagFromHash;

    renderProjects(projects, activeTag);
    renderTechList(projects);
    updateFilterBar();

    /* Backgrounds et icônes après le rendu initial */
    refreshCards(projects).catch(e => console.error('refreshCards :', e));
  }


  /* ── Pages de projet (/projects/*.html) ── */
  if (
    typeof initProjectPage === 'function' &&
    (document.getElementById('project-root') || location.pathname.includes('/projects/'))
  ) {
    await loadProjectsJson();
    await initProjectPage();
  }


  /* ── Carrousel (si présent sur la page) ── */
  if (typeof showDivs === 'function' && document.getElementById('carrousel')) {
    showDivs(slideIndex);
  }


  /* ── Rafraîchissement final de sécurité ── */
  if (typeof refreshCardsDebounced === 'function') {
    refreshCardsDebounced(ALL_PROJECTS);
  }
});
