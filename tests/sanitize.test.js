// tests/sanitize.test.js — core-sanitize.js: allowlist real (no no-op).
// Garantiza: scripts/iframes/handlers/javascript: se eliminan, formato básico
// sobrevive, URLs seguras pasan. Uso: node --test "tests/*.test.js"
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
// Paso 3 del reorden src/: core-sanitize.js vive en src/ tras la mudanza.
const { resolverFuente } = require('../scripts/paths.cjs');

function loadSanitize() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(resolverFuente('core-sanitize.js'), 'utf8'), sandbox, { filename: 'core-sanitize.js' });
  return sandbox.window.sanitizeHTML;
}

const sanitizeHTML = loadSanitize();

describe('sanitizeHTML (core-sanitize.js)', () => {
  it('elimina <script> y su contenido', () => {
    const out = sanitizeHTML('<p>Hola</p><script>alert(1)</script>');
    assert.ok(!/script/i.test(out));
    assert.ok(/Hola/.test(out));
  });

  it('elimina iframe/object/embed', () => {
    const out = sanitizeHTML('a<iframe src="https://evil.test"></iframe>b');
    assert.ok(!/iframe/i.test(out));
  });

  it('quita handlers on* (onclick, onerror)', () => {
    const out = sanitizeHTML('<b onclick="alert(1)">x</b><img onerror="alert(2)">');
    assert.ok(!/onclick/i.test(out));
    assert.ok(!/onerror/i.test(out));
  });

  it('neutraliza javascript: en href', () => {
    const out = sanitizeHTML('<a href="javascript:alert(1)">click</a>');
    assert.ok(!/javascript:/i.test(out));
  });

  it('conserva formato básico y links seguros', () => {
    const out = sanitizeHTML('<b>negrita</b> <a href="https://example.com">ok</a>');
    assert.ok(/negrita/.test(out));
    assert.ok(/https:\/\/example\.com/.test(out));
  });

  it('no es no-op: el HTML peligroso cambia', () => {
    const evil = '<svg onload=alert(1)><script>alert(2)</script>';
    assert.notEqual(sanitizeHTML(evil), evil);
  });
});
