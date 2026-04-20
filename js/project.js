/* ══════════════════════════════════════════════════════════════════
   js/project.js — Logique des pages de projet
   Chargé uniquement sur les pages /projects/*.html.

   Responsabilités :
   – Détection du slug depuis l'URL ou data-slug
   – Injection du titre, sous-titre, résumé et tags depuis le JSON
   – Image de couverture dans l'entête (--page-cover)
   – Réécriture des chemins d'images et de vidéos relatifs
   – Carrousel d'images
   ══════════════════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────
   DÉTECTION DU SLUG
───────────────────────────────────────────── */

/**
 * getSlugFromLocation()
 * Déduit le slug du projet depuis :
 * 1. data-slug sur #project-root (prioritaire, explicite)
 * 2. Le nom du fichier HTML dans l'URL (sans extension)
 *
 * @returns {string|null}  Slug du projet ou null si non détecté
 */
function getSlugFromLocation() {
  /* Priorité : attribut explicite sur un élément sentinelle */
  try {
    const root = document.getElementById('project-root');
    if (root?.dataset?.slug) return String(root.dataset.slug).trim() || null;
  } catch { /* ignore */ }

  /* Déduction depuis l'URL */
  try {
    const parts = location.pathname.split('/').filter(Boolean);
    let last    = parts[parts.length - 1] || '';
    if (!last && parts.length >= 2) last = parts[parts.length - 2];
    last = decodeURIComponent(last || '');

    /* Page index d'un dossier : utiliser le nom du dossier parent */
    if (last.toLowerCase() === 'index.html' || last.toLowerCase() === 'index') {
      return parts.length >= 2 ? decodeURIComponent(parts[parts.length - 2]) : null;
    }

    /* Retirer l'extension */
    const dot = last.lastIndexOf('.');
    return (dot > 0 ? last.substring(0, dot) : last) || null;
  } catch {
    return null;
  }
}


/* ─────────────────────────────────────────────
   INITIALISATION DE LA PAGE DE PROJET
───────────────────────────────────────────── */

/**
 * initProjectPage()
 * Injecte titre, sous-titre, résumé et tags dans la page depuis
 * ALL_PROJECTS (chargé au préalable par loadProjectsJson()).
 *
 * Cibles HTML attendues :
 *   #project-title    → textContent
 *   #project-subtitle → textContent
 *   #project-short    → innerHTML (sanitisé)
 *   #project-tags     → innerHTML (badges liens vers l'index)
 */
async function initProjectPage() {
  const slug = getSlugFromLocation();
  if (!slug) return;

  if (!ALL_PROJECTS.length) await loadProjectsJson();

  const project = ALL_PROJECTS.find(
    p => String(p.slug || '').toLowerCase() === slug.toLowerCase(),
  );

  if (!project) {
    const container = document.getElementById('project-content');
    if (container) {
      container.innerHTML = `<div class="about-card"><p class="muted">Projet introuvable.</p></div>`;
    }
    console.warn('initProjectPage : projet non trouvé pour slug :', slug);
    return;
  }

  /* ── Injection des métadonnées ── */
  const get = id => document.getElementById(id);

  if (get('project-title'))    get('project-title').textContent    = project.title    || '';
  if (get('project-subtitle')) get('project-subtitle').textContent = project.subtitle || '';
  if (get('project-short'))    get('project-short').innerHTML      = sanitizeHTML(project.short || '');

  /* ── Tags : liens de retour vers l'index avec filtre ── */
  const tagsEl = get('project-tags');
  if (tagsEl) {
    tagsEl.innerHTML = (project.tags || []).map(t => {
      const href = `../index.html#tag=${encodeURIComponent(t)}`;
      return `<a href="${href}" class="badge tag-link" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</a>`;
    }).join(' ');
  }

  /* ── Réécriture des ressources relatives ── */
  rewriteImageSrcs(slug);
  rewriteVideoSrcs(slug);

  /* ── Image de couverture dans l'entête ── */
  await initPageCover(project, slug);

  /* ── Mise à jour du titre de l'onglet ── */
  if (project.title) document.title = `${project.title} — Rym OUENZAR`;
}


/* ─────────────────────────────────────────────
   COUVERTURE DE L'ENTÊTE
───────────────────────────────────────────── */

/**
 * initPageCover(project, slug)
 * Applique l'image du projet comme couverture de l'entête via la
 * variable CSS --page-cover (définie dans project.css).
 *
 * Ordre de priorité : cover → image → bg
 * Si aucun champ n'est défini, l'entête reste sans image.
 *
 * @param {Object} project  Objet projet depuis ALL_PROJECTS
 * @param {string} slug     Slug du projet (pour résoudre le chemin)
 */
async function initPageCover(project, slug) {
  const header = document.querySelector('.page > header');
  if (!header) return;

  const candidate = project.cover || project.image || project.bg || '';
  if (!candidate) return;

  const url = resolveImageUrl(candidate, slug);
  if (!url) return;

  try {
    /* Précharger avant d'appliquer pour éviter le flash */
    await new Promise((resolve, reject) => {
      const img  = new Image();
      img.onload  = resolve;
      img.onerror = reject;
      img.src     = url;
    });
    header.style.setProperty('--page-cover', `url("${url}")`);
  } catch {
    /* Image introuvable → entête sans couverture, sans erreur visible */
  }
}


/* ─────────────────────────────────────────────
   RÉÉCRITURE DES CHEMINS DE RESSOURCES
───────────────────────────────────────────── */

/**
 * rewriteImageSrcs(slug)
 * Réécrit les src relatifs des <img> dans #project-content pour
 * pointer vers assets/<slug>/. Ignore les URLs absolues et les
 * chemins déjà préfixés assets/.
 */
function rewriteImageSrcs(slug) {
  if (!slug) return;

  const inProjects = location.pathname.split('/').filter(Boolean).includes('projects');
  const base       = `${inProjects ? '../' : ''}assets/${encodeURIComponent(slug)}/`;
  const scope      = document.getElementById('project-content') || document.body;

  scope.querySelectorAll('img').forEach(img => {
    const src   = (img.getAttribute('src') || '').trim();
    const lower = src.toLowerCase();
    if (!src) return;
    if (lower.startsWith('http') || lower.startsWith('/') || lower.startsWith('data:')) return;
    if (src.startsWith('assets/') || src.startsWith('../assets/') || src.startsWith('./assets/')) return;

    const filename = src.split('/').filter(Boolean).pop();
    if (filename) img.setAttribute('src', base + filename);
  });
}

/**
 * rewriteVideoSrcs(slug)
 * Même logique que rewriteImageSrcs, pour <video src> et <source>.
 */
function rewriteVideoSrcs(slug) {
  if (!slug) return;

  const inProjects = location.pathname.split('/').filter(Boolean).includes('projects');
  const base       = `${inProjects ? '../' : ''}assets/${encodeURIComponent(slug)}/`;
  const scope      = document.getElementById('project-content') || document.body;

  function shouldRewrite(src) {
    if (!src) return false;
    const s = src.trim().toLowerCase();
    return s
      && !s.startsWith('http')
      && !s.startsWith('/')
      && !s.startsWith('data:')
      && !s.startsWith('assets/')
      && !s.startsWith('../assets/')
      && !s.startsWith('./assets/');
  }

  function newSrc(src) {
    return base + src.replace(/^(\.\/)+/, '').replace(/^\/+/, '');
  }

  const toReload = new Set();

  scope.querySelectorAll('video[src]').forEach(v => {
    const src = v.getAttribute('src') || '';
    if (shouldRewrite(src)) { v.setAttribute('src', newSrc(src)); toReload.add(v); }
  });

  scope.querySelectorAll('video source, source').forEach(s => {
    const src = s.getAttribute('src') || '';
    if (shouldRewrite(src)) {
      s.setAttribute('src', newSrc(src));
      const parent = s.closest('video');
      if (parent) toReload.add(parent);
    }
  });

  toReload.forEach(v => { try { v.load(); } catch { /* ignore */ } });
}


/* ─────────────────────────────────────────────
   CARROUSEL D'IMAGES
───────────────────────────────────────────── */

let slideIndex = 1;

/**
 * plusDivs(n)
 * Avance ou recule le carrousel de n slides.
 * Appelé via onclick="plusDivs(-1)" dans le HTML.
 */
function plusDivs(n) { showDivs(slideIndex += n); }

/**
 * showDivs(n)
 * Affiche le slide d'index n (avec boucle cyclique).
 */
function showDivs(n) {
  const slides = document.getElementsByClassName('carrousel-slide');
  if (!slides.length) return;
  if (n > slides.length) slideIndex = 1;
  if (n < 1)             slideIndex = slides.length;
  Array.from(slides).forEach((s, i) => {
    s.style.display = i === slideIndex - 1 ? 'block' : 'none';
  });
}
