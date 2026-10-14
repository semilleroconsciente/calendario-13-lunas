// core-sanitize.js — sanitización centralizada (CSP + XSS).
// Provee setSafeHTML / sanitizeHTML / escapeHtml como único punto para innerHTML.
// Sin dependencia externa (CSP script-src 'self': sin CDN). Si DOMPurify está
// disponible (npm local), lo usa con allowlist estricta; si no, sanitizador
// propio con allowlist (sin eval, sin innerHTML sin filtrar).
//
// Uso: setSafeHTML(el, '<b>'+escapeHtml(userText)+'</b>')  o  el.innerHTML = sanitizeHTML(html)
// Regla: dato de usuario SIEMPRE via escapeHtml(); sanitizeHTML solo para HTML
// interno de la app (plantillas) que pueda contener interpolaciones.
function escapeHtmlCore(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
var ALLOWED_TAGS = { B: 1, I: 1, EM: 1, STRONG: 1, U: 1, S: 1, BR: 1, P: 1, UL: 1, OL: 1, LI: 1, H4: 1, H5: 1, SPAN: 1, DIV: 1, SMALL: 1, LABEL: 1, BUTTON: 1, INPUT: 1, SELECT: 1, OPTION: 1, TEXTAREA: 1, A: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TD: 1, TH: 1 };
function isSafeUrl(u) {
  var v = String(u || '').trim();
  if (!v) return false;
  if (v[0] === '#' || v[0] === '/' || v[0] === '.') return true;
  try {
    var p = (/^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(v) || [])[1];
    if (!p) return true; // relativa
    p = p.toLowerCase();
    return p === 'http' || p === 'https' || p === 'mailto' || p === 'tel';
  } catch (e) { return false; }
}
function cleanNode(root) {
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
  var toRemove = [];
  while (walker.nextNode()) {
    var n = walker.currentNode;
    if (n.nodeType === 8) { toRemove.push(n); continue; }
    var tag = (n.tagName || '').toUpperCase();
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT' || tag === 'EMBED' || tag === 'LINK' || tag === 'META' || tag === 'BASE' || tag === 'FORM') {
      toRemove.push(n); continue;
    }
    if (!ALLOWED_TAGS[tag]) {
      // Desenvuelve: conserva hijos de texto pero no el tag desconocido (evita <svg onload>, <math>, etc.)
      var parent = n.parentNode;
      if (parent) { while (n.firstChild) parent.insertBefore(n.firstChild, n); toRemove.push(n); }
      continue;
    }
    // Atributos: allowlist + strip on* / style / formaction / xlink.
    var attrs = n.attributes ? Array.prototype.slice.call(n.attributes) : [];
    for (var i = 0; i < attrs.length; i++) {
      var an = (attrs[i].name || '').toLowerCase();
      var av = attrs[i].value;
      if (an.slice(0, 2) === 'on' || an === 'style' || an === 'formaction' || an === 'xlink:href' || an.indexOf('data:text/html') === 0) { try { n.removeAttribute(attrs[i].name); } catch (e) {} continue; }
      if (an === 'href' || an === 'src' || an === 'action' || an === 'cite' || an === 'data') {
        if (!isSafeUrl(av)) { try { n.removeAttribute(attrs[i].name); } catch (e) {} }
        continue;
      }
      if (an !== 'class' && an !== 'title' && an !== 'alt' && an !== 'type' && an !== 'value' && an !== 'placeholder' && an !== 'href' && an !== 'for' && an !== 'id' && an !== 'checked' && an !== 'selected' && an !== 'disabled' && an !== 'maxlength' && an !== 'rows' && an !== 'role' && an !== 'aria-label' && an !== 'tabindex') {
        try { n.removeAttribute(attrs[i].name); } catch (e) {}
      }
    }
  }
  for (var k = 0; k < toRemove.length; k++) { try { toRemove[k].parentNode.removeChild(toRemove[k]); } catch (e) {} }
}
function sanitizeHTML(html) {
  try {
    if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
      return DOMPurify.sanitize(String(html), { ALLOWED_TAGS: Object.keys(ALLOWED_TAGS).map(function (t) { return t.toLowerCase(); }), ALLOWED_ATTR: ['class', 'title', 'alt', 'href', 'type', 'value', 'placeholder', 'for', 'id', 'checked', 'selected', 'disabled', 'maxlength', 'rows', 'role', 'aria-label', 'tabindex'], ALLOW_DATA_ATTR: false });
    }
  } catch (e) {}
  var src = String(html == null ? '' : html);
  try {
    if (typeof document !== 'undefined' && document.createElement && typeof NodeFilter !== 'undefined') {
      var tpl = document.createElement('template');
      tpl.innerHTML = src;
      cleanNode(tpl.content);
      return tpl.innerHTML;
    }
  } catch (e) {}
  // Sin DOM (Node/tests): strip conservador por regex (scripts + handlers + js:).
  // OJO: primero pares <x>...</x> completos, luego aperturas sueltas; un solo
  // regex perezoso con alternativa `>` deja el `</iframe>` huérfano.
  return src.replace(/<script[\s\S]*?<\/script\s*>/gi, '').replace(/<style[\s\S]*?<\/style\s*>/gi, '').replace(/<(iframe|object|embed|link|meta|base|form)[\s\S]*?<\/\1\s*>/gi, '').replace(/<(iframe|object|embed|link|meta|base|form)(\s[^>]*)?\/?>/gi, '').replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/(href|src|action)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1=$2#$2');
}
function setSafeHTML(el, html) {
  if (!el) return;
  try {
    el.innerHTML = sanitizeHTML(html);
  } catch (e) { el.textContent = String(html == null ? '' : html); }
}
// escapeHtml y sanitizeText ya existen en renderer.js; se exponen aquí para uso temprano si se carga antes.
if (typeof window !== 'undefined') {
  window.sanitizeHTML = sanitizeHTML;
  window.setSafeHTML = setSafeHTML;
  if (typeof window.escapeHtml !== 'function') window.escapeHtml = escapeHtmlCore;
}
if (typeof globalThis !== 'undefined') {
  try { if (typeof globalThis.sanitizeHTML === 'undefined') globalThis.sanitizeHTML = sanitizeHTML; } catch (e) {}
}
