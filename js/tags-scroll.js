/* ══════════════════════════════════════════════════════════════════
   js/tags-scroll.js — Scroll horizontal des tags
   Chargé uniquement sur index.html.

   Fonctionnalités :
   – Boutons ‹ / › injectés autour de chaque .project-card-tags
   – Drag souris (clic + glisser)
   – Molette verticale convertie en scroll horizontal
   – Boutons masqués automatiquement quand rien à scroller
   – Indicateurs visuels (box-shadow inset) aux bords
   ══════════════════════════════════════════════════════════════════ */


/**
 * initTagsScroll()
 * Initialise le scroll horizontal sur tous les .project-card-tags
 * présents dans le DOM au moment de l'appel.
 *
 * Protégé contre la double initialisation via data-scroll-ready.
 * Appelé depuis renderProjects() après chaque re-rendu des cartes.
 */
function initTagsScroll() {

  /* ── Injecter les styles une seule fois ── */
  if (!document.getElementById('tags-scroll-style')) {
    const s = document.createElement('style');
    s.id = 'tags-scroll-style';
    s.textContent = `
      /* Wrapper flex autour du conteneur + boutons */
      .tags-outer {
        position: relative;
        display: flex;
        align-items: center;
      }

      /* ── Boutons fléchés ‹ / › ── */
      .tag-btn {
        width: 15px;
        height: 22px;
        position: relative;
        bottom: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(184, 134, 11, 0.08);
        border: 1px solid rgba(184, 134, 11, 0.2);
        border-radius: 6px;
        color: rgba(184, 134, 11, 0.7);
        font-size: 14px;
        cursor: pointer;
        line-height: 1;
        user-select: none;
        transition:
          background .15s,
          border-color .15s,
          color .15s,
          opacity .2s ease,
          transform .2s ease;
      }

      .tag-btn:hover {
        background: rgba(184, 134, 11, 0.16);
        border-color: rgba(184, 134, 11, 0.4);
        color: #d4a843;
      }

      .tag-btn:active { transform: scale(.92); }

      /* Masqué quand rien à scroller de ce côté */
      .tag-btn.hidden {
        opacity: 0;
        pointer-events: none;
      }

      .tag-btn-left  { margin-right: 6px; }
      .tag-btn-right { margin-left: 6px; }

      /* ── Conteneur scrollable ── */
      .project-card-tags {
        display: flex;
        gap: 6px;
        flex: 1;
        overflow: hidden;
        flex-wrap: nowrap !important;
        /* Espace vertical pour que translateY(-1px) du hover ne soit pas coupé */
        padding-top: 3px;
        margin-top: -3px;
        cursor: grab;
        flex-shrink: 0;
        scrollbar-width: none;
        scrollbar-color: rgba(184, 134, 11, 0.4) transparent;
        scroll-behavior: smooth;
        transition: box-shadow .25s ease;
      }

      .project-card-tags:hover { scrollbar-width: thin; }

      .project-card-tags:hover::-webkit-scrollbar-thumb {
        background: rgba(184, 134, 11, 0.45);
      }

      .project-card-tags.is-dragging { cursor: grabbing; }

      /* Indicateurs de débordement (box-shadow inset : non coupé par overflow) */
      .project-card-tags.can-scroll-right {
        box-shadow: inset -10px 0 10px -10px rgba(184, 134, 11, 0.1);
      }
      .project-card-tags.can-scroll-left {
        box-shadow: inset  10px 0 10px -10px rgba(184, 134, 11, 0.1);
      }
      .project-card-tags.can-scroll-right.can-scroll-left {
        box-shadow:
          inset -10px 0 10px -10px rgba(184, 134, 11, 0.18),
          inset  10px 0 10px -10px rgba(184, 134, 11, 0.1);
      }
    `;
    document.head.appendChild(s);
  }

  /* ── Initialiser chaque conteneur de tags ── */
  document.querySelectorAll('.project-card-tags').forEach(el => {
    /* Protection contre la double initialisation */
    if (el.dataset.scrollReady) return;
    el.dataset.scrollReady = '1';

    /* ── Créer le wrapper et les boutons ── */
    const outer    = document.createElement('div');
    const btnLeft  = document.createElement('button');
    const btnRight = document.createElement('button');

    outer.className    = 'tags-outer';
    btnLeft.className  = 'tag-btn tag-btn-left hidden';
    btnRight.className = 'tag-btn tag-btn-right hidden';
    btnLeft.textContent  = '‹';
    btnRight.textContent = '›';
    btnLeft.setAttribute('aria-label',  'Tags précédents');
    btnRight.setAttribute('aria-label', 'Tags suivants');
    btnLeft.setAttribute('type', 'button');
    btnRight.setAttribute('type', 'button');

    /* Insérer le wrapper autour du conteneur existant */
    el.parentNode.insertBefore(outer, el);
    outer.appendChild(btnLeft);
    outer.appendChild(el);
    outer.appendChild(btnRight);

    const STEP = 120; /* px scrollés par clic */

    /* ── Mise à jour des boutons et indicateurs ── */
    function updateState() {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const hasOverflow = scrollWidth > clientWidth + 2;
      const atStart     = scrollLeft <= 2;
      const atEnd       = scrollLeft >= scrollWidth - clientWidth - 2;

      btnLeft.classList.toggle('hidden',           !hasOverflow || atStart);
      btnRight.classList.toggle('hidden',          !hasOverflow || atEnd);
      el.classList.toggle('can-scroll-right',      hasOverflow && !atEnd);
      el.classList.toggle('can-scroll-left',       hasOverflow && !atStart);
    }

    requestAnimationFrame(updateState);
    el.addEventListener('scroll', updateState, { passive: true });
    window.addEventListener('resize', updateState, { passive: true });

    /* ── Clics boutons ── */
    btnLeft.addEventListener('click',  () => { el.scrollLeft -= STEP; });
    btnRight.addEventListener('click', () => { el.scrollLeft += STEP; });

    /* ── Drag souris ── */
    let dragging     = false;
    let startX       = 0;
    let scrollOrigin = 0;

    el.addEventListener('mousedown', e => {
      dragging     = true;
      startX       = e.clientX;
      scrollOrigin = el.scrollLeft;
      el.classList.add('is-dragging');
      e.preventDefault();
    });

    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      el.scrollLeft = scrollOrigin - (e.clientX - startX);
      updateState();
    });

    window.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('is-dragging');
    });

    /* ── Molette → scroll horizontal ── */
    el.addEventListener('wheel', e => {
      /* Trackpad horizontal déjà géré nativement */
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      /* Tout rentre → pas besoin de scroller */
      if (el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
      updateState();
    }, { passive: false });
  });
}
