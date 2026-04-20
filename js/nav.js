/* ══════════════════════════════════════════════════════════════════
   js/nav.js — Navigation sticky + animations au scroll
   Chargé sur toutes les pages.
   ══════════════════════════════════════════════════════════════════ */


/**
 * initStickyNav()
 * Ajoute / retire .visible sur #site-nav selon la position de scroll.
 * Seuil : 80 px. La transition CSS gère le glissement (transform).
 * Appelé au DOMContentLoaded via main.js.
 */
function initStickyNav() {
  const nav = document.getElementById('site-nav');
  if (!nav) return;

  const toggle = () => nav.classList.toggle('visible', window.scrollY > 80);

  window.addEventListener('scroll', toggle, { passive: true });

  /* Vérification de l'état initial (page rechargée au milieu) */
  toggle();
}


/**
 * initScrollReveal()
 * Observe les éléments .reveal via IntersectionObserver.
 * Quand un élément entre dans le viewport, .in-view est ajoutée
 * → la transition CSS le rend visible (défini dans global.css).
 * Chaque élément n'est animé qu'une seule fois.
 *
 * Fallback : si IntersectionObserver n'est pas disponible,
 * tous les éléments sont rendus visibles immédiatement.
 */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  els.forEach(el => observer.observe(el));
}
