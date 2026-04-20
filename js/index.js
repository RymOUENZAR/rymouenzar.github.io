/* ══════════════════════════════════════════════════════════════════
   js/index.js — Logique de la page d'accueil
   Chargé uniquement sur index.html.

   Responsabilités :
   – Génération et rendu des cartes de projet (#projects)
   – Rendu de la liste des technologies (#tech-list)
   – Filtrage par tag (hash URL)
   – Application des images de fond aux cartes (--project-bg)
   – Application des icônes logo aux cartes
   ══════════════════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────
   GÉNÉRATION DES CARTES
───────────────────────────────────────────── */

/**
 * projectCardHtml(p)
 * Génère le HTML d'une carte projet depuis un objet du JSON.
 * – Les tags deviennent des liens filtrants (#tag=…).
 * – Le champ "short" passe par sanitizeHTML (HTML léger autorisé).
 * – L'icône emoji est affichée directement ; les chemins image
 *   sont traités après rendu par applyIconsToCards().
 *
 * @param {Object} p  Objet projet depuis projects.json
 * @returns {string}  HTML de l'article
 */
function projectCardHtml(p) {
  const tags = (p.tags || []).map(t =>
    `<a href="#tag=${encodeURIComponent(t)}"
        class="tag tag-link"
        data-tag="${escapeHtml(t)}">${escapeHtml(t)}</a>`
  ).join('');

  const href        = p.slug ? `projects/${p.slug}.html` : (p.url || '#');
  const iconContent = (p.icon && isProbablyEmoji(p.icon)) ? escapeHtml(p.icon) : '';

  return `
    <article class="project-card" data-slug="${escapeHtml(p.slug || '')}">
      <div class="project-card-top">
      <div class="project-card-bg"></div>
        <div class="project-header">
          <div class="project-icon" data-icon="${escapeHtml(p.icon || '')}">
            ${iconContent}
          </div>
          <div>
            <div class="project-title">
              <a href="${href}" class="contact-link">${escapeHtml(p.title)}</a>
            </div>
            <div class="small">${escapeHtml(p.subtitle || '')}</div>
          </div>
        </div>
      </div>
      <div class="project-card-bottom">
        <p class="project-desc">${sanitizeHTML(p.short || '')}</p>
        <div class="project-card-tags">${tags}</div>
        <div class="project-card-separator">
          <div class="project-card-badge">${escapeHtml(p.year || '')}</div>
          <a href="${href}" class="project-card-link">voir →</a>
        </div>
      </div>
    </article>`;
}


/**
 * renderProjects(projects, filterTag)
 * Injecte les cartes dans #projects (filtrées si filterTag fourni).
 * Attache les listeners de filtre puis initialise le scroll des tags.
 */
function renderProjects(projects, filterTag = null) {
  const container = document.getElementById('projects');
  if (!container) return;

  const list = filterTag
    ? projects.filter(p =>
        (p.tags || []).map(t => t.toLowerCase()).includes(filterTag.toLowerCase())
      )
    : projects;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="project-card">
        <p class="project-desc muted">
          Aucun projet pour le filtre <strong>${escapeHtml(filterTag)}</strong>.
        </p>
      </div>`;
    updateFilterCount(0);
    return;
  }

  container.innerHTML = list.map(projectCardHtml).join('');

  /* Attacher les listeners de clic sur les tags */
  container.querySelectorAll('.tag-link').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      applyFilter(el.dataset.tag);
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* Initialiser le scroll horizontal des tags après le re-rendu */
  requestAnimationFrame(initTagsScroll);

  updateFilterCount(list.length);
}


/**
 * renderTechList(projects)
 * Extrait tous les tags uniques de tous les projets, les trie et
 * les affiche dans #tech-list sous forme de pills filtrants.
 */
function renderTechList(projects) {
  const container = document.getElementById('tech-list');
  if (!container) return;

  const tags = Array.from(new Set(projects.flatMap(p => p.tags || [])))
    .sort((a, b) => a.localeCompare(b));

  container.innerHTML = tags.map(t =>
    `<a href="#tag=${encodeURIComponent(t)}"
        class="tech-pill tag-link"
        data-tag="${escapeHtml(t)}">${escapeHtml(t)}</a>`
  ).join('');

  container.querySelectorAll('.tag-link').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      applyFilter(el.dataset.tag);
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}


/* ─────────────────────────────────────────────
   FILTRAGE PAR TAG (hash URL)
───────────────────────────────────────────── */

/**
 * readTagFromHash()
 * Lit le tag actif depuis le fragment d'URL (#tag=…).
 * @returns {string|null}
 */
function readTagFromHash() {
  try {
    const h = decodeURIComponent(location.hash || '');
    const m = h.match(/tag=([^&]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/**
 * writeTagToHash(tag)
 * Écrit ou efface le tag dans l'URL sans recharger la page.
 */
function writeTagToHash(tag) {
  const base = location.pathname + location.search;
  history.replaceState(
    null, '',
    tag ? `${base}#tag=${encodeURIComponent(tag)}` : base,
  );
}

/** Active un filtre et re-rend la grille. */
function applyFilter(tag) {
  if (!tag) return clearFilter();
  activeTag = tag;
  writeTagToHash(tag);
  renderProjects(ALL_PROJECTS, activeTag);
  updateFilterBar();
  refreshCardsDebounced(ALL_PROJECTS);
}

/** Efface le filtre actif. */
function clearFilter() {
  activeTag = null;
  writeTagToHash(null);
  renderProjects(ALL_PROJECTS, null);
  updateFilterBar();
  refreshCardsDebounced(ALL_PROJECTS);
}

/** Affiche ou masque la barre de filtre selon activeTag. */
function updateFilterBar() {
  const bar      = document.getElementById('filter-bar');
  const activeEl = document.getElementById('active-tag');
  const clearBtn = document.getElementById('clear-filter');
  if (!bar || !activeEl || !clearBtn) return;

  if (activeTag) {
    bar.removeAttribute('hidden');
    activeEl.textContent = activeTag;
  } else {
    bar.setAttribute('hidden', '');
    activeEl.textContent = '';
  }

  clearBtn.onclick = e => { e.preventDefault(); clearFilter(); };
  refreshCardsDebounced(ALL_PROJECTS);
}

function updateFilterCount(n) {
  const el = document.getElementById('filter-count');
  if (el) el.textContent = ` (${n})`;
  refreshCardsDebounced(ALL_PROJECTS);
}


/* ─────────────────────────────────────────────
   IMAGES DE FOND DES CARTES
───────────────────────────────────────────── */

/**
 * applyBackgroundsToCards(allProjects)
 * Parcourt les .project-card et applique --project-bg depuis le
 * champ "cover", "image" ou "bg" du JSON.
 * Précharge l'image avant d'appliquer pour éviter le flash.
 */
function applyBackgroundsToCards(allProjects = []) {
  const cards = Array.from(document.querySelectorAll('.project-card'));
  if (!cards.length) return;

  const map = new Map(allProjects.map(p => [String(p.slug || '').toLowerCase(), p]));

  cards.forEach(card => {
    const slug = (card.dataset.slug || '').toLowerCase();
    if (!slug || !map.has(slug)) return;

    const proj      = map.get(slug);
    const candidate = proj.cover || proj.image || proj.bg || '';
    if (!candidate) return;

    const url = resolveImageUrl(candidate, slug);
    if (!url) return;

    const opacity = proj.bgOpacity ?? proj.bg_opacity ?? 0.08;
    const bgEl    = card.querySelector('.project-card-bg');
    if (!bgEl) return;

    /* Appliquer directement sur l'élément — pas de CSS variable, pas de problème de résolution URL */
    bgEl.style.backgroundImage = `url("${url}")`;
    bgEl.style.opacity         = String(opacity);
  });
}


/* ─────────────────────────────────────────────
   ICÔNES DES CARTES
───────────────────────────────────────────── */

/**
 * applyIconsToCards(allProjects)
 * Pour chaque .project-icon :
 * – Emoji → déjà affiché en texte, rien à faire.
 * – Chemin → résoudre, précharger, insérer <img>.
 *
 * Le slug est lu depuis data-slug sur la carte parente (fiable),
 * évitant ainsi le bug qui retournait le premier slug du JSON.
 */
async function applyIconsToCards(allProjects = []) {
  const icons = Array.from(document.querySelectorAll('.project-icon'));
  if (!icons.length) return;

  await Promise.all(icons.map(async iconEl => {
    const candidate = (iconEl.dataset.icon || '').trim();
    if (!candidate) return;

    if (isProbablyEmoji(candidate)) {
      if (!iconEl.textContent.trim()) iconEl.textContent = candidate;
      return;
    }

    const card = iconEl.closest('.project-card');
    const slug = (card?.dataset.slug || '').toLowerCase();
    const url  = resolveImageUrl(candidate, slug);
    if (!url) return;

    try {
      await new Promise((resolve, reject) => {
        const img  = new Image();
        img.onload  = resolve;
        img.onerror = reject;
        img.src     = url;
      });

      const imgEl     = document.createElement('img');
      imgEl.className = 'project-logo nohover';
      imgEl.alt       = card?.querySelector('.project-title')?.textContent.trim()
                        ? `${card.querySelector('.project-title').textContent.trim()} logo`
                        : 'Logo du projet';
      imgEl.src       = url;
      imgEl.onerror   = () => imgEl.remove();

      iconEl.textContent = '';
      iconEl.appendChild(imgEl);
    } catch {
      /* Icône introuvable → emoji ou vide en fallback */
    }
  }));
}


/* ─────────────────────────────────────────────
   RAFRAÎCHISSEMENT GROUPÉ
───────────────────────────────────────────── */

/**
 * refreshCards(allProjects)
 * Appelle applyBackgroundsToCards puis applyIconsToCards.
 * À utiliser après tout re-rendu des cartes.
 */
async function refreshCards(allProjects) {
  try { await applyBackgroundsToCards(allProjects || []); } catch { /* ignore */ }
  try { await applyIconsToCards(allProjects || []); }       catch { /* ignore */ }
}

/** Version débounced : évite les appels en cascade. */
const refreshCardsDebounced = debounce(refreshCards, 120);
