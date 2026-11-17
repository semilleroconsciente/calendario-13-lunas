'use strict';
// ============================================================================
// tests/sanitize.test.js — core-sanitize.js como allowlist real (no no-op).
//
// Garantiza: scripts/iframes/handlers/javascript: se eliminan, el formato
// básico sobrevive y las URLs seguras pasan.
// Uso: node --test tests/  (o npm test)
// ============================================================================
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { leerFuente } = require('./helpers.cjs');

function cargarSanitize() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(leerFuente('core-sanitize.js'), sandbox, { filename: 'core-sanitize.js' });
  return sandbox.window.sanitizeHTML;
}

const sanitizeHTML = cargarSanitize();

// --- Suite -------------------------------------------------------------------
describe('sanitizeHTML (core-sanitize.js)', () => {
  it('elimina <script> y su contenido, conserva el texto', () => {
    const out = sanitizeHTML('<p>Hola</p><script>alert(1)</script>');
    assert.ok(!/script/i.test(out), 'quedó rastro de script');
    assert.ok(/Hola/.test(out), 'se perdió el texto sano');
  });

  it('elimina iframe/object/embed', () => {
    const out = sanitizeHTML('a<iframe src="https://evil.test"></iframe>b');
    assert.ok(!/iframe/i.test(out), 'quedó rastro de iframe');
  });

  it('quita los handlers on* (onclick, onerror)', () => {
    const out = sanitizeHTML('<b onclick="alert(1)">x</b><img onerror="alert(2)">');
    assert.ok(!/onclick/i.test(out), 'quedó onclick');
    assert.ok(!/onerror/i.test(out), 'quedó onerror');
  });

  it('neutraliza javascript: en los href', () => {
    const out = sanitizeHTML('<a href="javascript:alert(1)">click</a>');
    assert.ok(!/javascript:/i.test(out), 'quedó javascript:');
  });

  it('conserva el formato básico y los links seguros', () => {
    const out = sanitizeHTML('<b>negrita</b> <a href="https://example.com">ok</a>');
    assert.ok(/negrita/.test(out), 'se perdió el formato');
    assert.ok(/https:\/\/example\.com/.test(out), 'se perdió el link seguro');
  });

  it('no es no-op: el HTML peligroso siempre cambia', () => {
    const evil = '<svg onload=alert(1)><script>alert(2)</script>';
    assert.notEqual(sanitizeHTML(evil), evil, 'el sanitizador devolvió el input intacto');
  });
});
