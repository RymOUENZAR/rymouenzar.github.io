/* ══════════════════════════════════════════════════════════════════
   js/utils.js — Utilitaires purs
   Chargé sur toutes les pages.
   Aucun effet de bord : pas d'accès au DOM, pas de listeners.
   ══════════════════════════════════════════════════════════════════ */


/**
 * escapeHtml(str)
 * Échappe les caractères HTML spéciaux pour sécuriser
 * l'injection de texte dynamique dans le DOM.
 *
 * @param {string} s  Texte brut à sécuriser
 * @returns {string}  Texte avec entités HTML
 */
function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}


/**
 * sanitizeHTML(dirtyHtml)
 * Parse un HTML non fiable et reconstruit un DOM propre via une
 * whitelist de balises et d'attributs.
 * Utilisé pour injecter le champ "short" des projets (HTML léger
 * autorisé : <b>, <strong>, <a>, <i>, <em>, etc.).
 *
 * @param {string} dirtyHtml  HTML non fiable en entrée
 * @returns {string}          HTML assaini, sûr à injecter dans innerHTML
 */
function sanitizeHTML(dirtyHtml) {
  if (!dirtyHtml) return '';

  const ALLOWED_TAGS  = new Set([
    'b', 'strong', 'i', 'em', 'u', 'br', 'p',
    'ul', 'ol', 'li', 'a', 'span', 'code', 'pre',
  ]);
  const ALLOWED_ATTRS = {
    a:   new Set(['href', 'target', 'rel', 'title']),
    img: new Set(['src', 'alt', 'title']),
  };

  const doc       = new DOMParser().parseFromString(`<div>${dirtyHtml}</div>`, 'text/html');
  const container = doc.body.firstChild;

  function cleanNode(node) {
    /* Nœud texte → conserver tel quel */
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent);
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();

      /* Balise non autorisée → garder le contenu, pas la balise */
      if (!ALLOWED_TAGS.has(tag)) {
        const frag = document.createDocumentFragment();
        node.childNodes.forEach(child => {
          const c = cleanNode(child);
          if (c) frag.appendChild(c);
        });
        return frag;
      }

      /* Balise autorisée → reconstruire avec attributs filtrés */
      const el           = document.createElement(tag);
      const allowedAttrs = ALLOWED_ATTRS[tag] || new Set();

      for (const attr of node.attributes) {
        const name  = attr.name.toLowerCase();
        const value = attr.value;
        if (!allowedAttrs.has(name)) continue;

        if (name === 'href') {
          const lower = value.trim().toLowerCase();
          /* Bloquer javascript: et data: (vecteurs XSS) */
          if (lower.startsWith('javascript:') || lower.startsWith('data:')) continue;
          el.setAttribute('href', value.trim());
          if (!el.hasAttribute('target')) el.setAttribute('target', '_blank');
          if (!el.hasAttribute('rel'))    el.setAttribute('rel', 'noopener noreferrer');
        } else {
          el.setAttribute(name, value);
        }
      }

      node.childNodes.forEach(child => {
        const c = cleanNode(child);
        if (c) el.appendChild(c);
      });
      return el;
    }

    return null;
  }

  const wrapper = document.createElement('div');
  const frag    = document.createDocumentFragment();
  container.childNodes.forEach(child => {
    const c = cleanNode(child);
    if (c) frag.appendChild(c);
  });
  wrapper.appendChild(frag);
  return wrapper.innerHTML;
}


/**
 * isProbablyEmoji(str)
 * Détecte si la chaîne est un emoji plutôt qu'un chemin de fichier.
 *
 * ATTENTION : en Unicode, les chiffres 0-9 ont la propriété \p{Emoji}.
 * Un chemin comme "result2.png" déclencherait donc un faux positif.
 * On exclut donc en priorité tout ce qui contient '/', '.' ou '\'.
 *
 * @param {string} str  Valeur du champ "icon" d'un projet
 * @returns {boolean}   true si c'est un emoji
 */
function isProbablyEmoji(str) {
  if (!str) return false;
  const s = String(str).trim();
  if (!s) return false;

  /* Les chemins de fichier contiennent toujours '/', '.' ou '\' */
  if (s.includes('/') || s.includes('.') || s.includes('\\')) return false;

  /* Longueur maximale raisonnable pour un emoji */
  if (s.length > 10) return false;

  try {
    return /\p{Emoji}/u.test(s);
  } catch {
    /* Fallback si \p{Emoji} non supporté */
    return s.length <= 4 && /[^\x00-\x7F]/.test(s);
  }
}


/**
 * debounce(fn, wait)
 * Retarde l'exécution de fn jusqu'à wait ms après le dernier appel.
 * Utilisé pour éviter des appels redondants en cascade (ex: resize,
 * scroll, re-render des cartes).
 *
 * @param {Function} fn    Fonction à débouncer
 * @param {number}   wait  Délai en millisecondes (défaut : 120)
 * @returns {Function}     Version débounced de fn
 */
function debounce(fn, wait = 120) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
