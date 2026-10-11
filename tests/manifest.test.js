// tests/manifest.test.js — mejoras #3, #7, #9, #15, #18.
// Fija: manifest UTF-8 sin mojibake, CSP en index/_headers/server,
// nuevos módulos cableados (index + package + sw) y claves donate.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

describe('manifest + cableado', () => {
  it('manifest.json: UTF-8 válido, sin mojibake', () => {
    const raw = read('manifest.json');
    assert.ok(!raw.includes('�'), 'manifest con caracteres de reemplazo (encoding roto)');
    const m = JSON.parse(raw);
    assert.match(m.description, /Mari Küla Küyen/);
    assert.match(m.description, /Bío-Bío/);
    assert.equal(m.shortcuts.length, 4);
    for (const ic of m.icons) {
      assert.ok(fs.existsSync(path.join(ROOT, ic.src)), 'icono ausente: ' + ic.src);
    }
  });

  it('index.html: CSP meta + storage-idb + 3 módulos nuevos en MODS', () => {
    const html = read('index.html');
    assert.ok(html.includes('Content-Security-Policy'), 'falta CSP meta');
    assert.ok(html.includes('storage-idb.js?v=1'), 'falta storage-idb diferido');
    for (const mod of ['accesibilidad-modulo.js?v=1', 'onboarding-modulo.js?v=1', 'auto-backup-modulo.js?v=1']) {
      assert.ok(html.includes(`'${mod}'`), 'MODS sin ' + mod);
    }
  });

  it('package.json: nuevos archivos en build.files + scripts', () => {
    const pkg = JSON.parse(read('package.json'));
    for (const f of ['storage-idb.js', 'accesibilidad-modulo.js', 'onboarding-modulo.js', 'auto-backup-modulo.js', '_headers']) {
      assert.ok((pkg.build.files || []).includes(f), 'build.files sin ' + f);
    }
    for (const s of ['build:sw', 'check:sw', 'check:donate', 'movil:build', 'check:size']) {
      assert.ok(pkg.scripts[s], 'script ausente: ' + s);
    }
  });

  it('sw.js y web/sw.js: CORE podado (bare+vigente) con nuevos módulos', () => {
    for (const f of ['sw.js', 'web/sw.js']) {
      const sw = read(f);
      assert.ok(sw.includes("'./storage-idb.js?v=1'"), f + ' sin storage-idb versionado');
      assert.ok(sw.includes("'./onboarding-modulo.js?v=1'"), f + ' sin onboarding');
      // Poda: no debe quedar historial viejo del núcleo
      assert.ok(!sw.includes('renderer.js?v=8'), f + ' aún arrastra historial ?v= viejo');
    }
  });

  it('_headers raíz y web: CSP + permisos (mic/cámara en self)', () => {
    for (const f of ['_headers', 'web/_headers']) {
      const h = read(f);
      assert.ok(h.includes('Content-Security-Policy'), f + ' sin CSP');
      assert.ok(h.includes('microphone=(self)'), f + ' sin micrófono en self (Voz Abuelos)');
      assert.ok(h.includes('camera=(self)'), f + ' sin cámara en self (QR-sync)');
    }
  });

  it('donate: example con las 4 claves del renderer', () => {
    const ex = JSON.parse(read('donate.example.json'));
    for (const k of ['mercadopago', 'paypal', 'flow', 'kofi']) {
      assert.ok(k in ex, 'donate.example.json sin clave ' + k);
    }
  });
});
