/* ══════════════════════════════════════════════════════════════════
   js/config.js — Configuration centralisée du site
   Chargé sur toutes les pages.

   MODIFIER ICI pour mettre à jour footer, nom et rôle partout.
   ══════════════════════════════════════════════════════════════════ */

const SITE_CONFIG = {
  /** Nom affiché dans la nav et le footer. */
  name: 'Rym OUENZAR',

  /** Rôle / tagline affiché dans le footer. */
  role: 'Lead Dev · Gestion de Projet · Coordination Technique',

  /**
   * Année de mise en ligne.
   * new Date().getFullYear() s'auto-incrémente chaque année.
   * Remplacer par un nombre fixe pour figer l'année.
   */
  year: new Date().getFullYear(),

  /**
   * Contenu HTML du <footer>.
   * Modifier uniquement ici : change sur toutes les pages.
   * Les <span> héritent du style doré de global.css.
   */
  get footer() {
    return `${this.name} · <span>${this.role}</span> · Portfolio · <span>${this.year}</span>`;
  },
};


/**
 * renderFooter()
 * Injecte SITE_CONFIG.footer dans chaque <footer> de la page.
 * Appelé au DOMContentLoaded via main.js.
 *
 * Exception : ajouter data-static pour préserver un footer custom :
 *   <footer data-static>Contenu non écrasé</footer>
 */
function renderFooter() {
  document.querySelectorAll('footer:not([data-static])').forEach(el => {
    el.innerHTML = SITE_CONFIG.footer;
  });
}
