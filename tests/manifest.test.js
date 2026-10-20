// tests/manifest.test.js — mejoras #3, #7, #9, #15, #18.
// Fija: manifest UTF-8 sin mojibake, CSP en index/_headers/server,
// nuevos módulos cableados (index + package + sw) y claves donate.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
// Paso 3 del reorden src/: templates-bundled.js vive en src/ tras la mudanza.
const { resolverFuente } = require('../scripts/paths.cjs');
const readSrc = (f) => fs.readFileSync(resolverFuente(f), 'utf8');

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

  it('index.html: CSP meta dura + storage-idb + 3 módulos nuevos en MODS', () => {
    const html = read('index.html');
    assert.ok(html.includes('Content-Security-Policy'), 'falta CSP meta');
    // CSP fase 1: script-src 'self' SIN 'unsafe-inline' (inline extraido a archivos).
    assert.ok(!html.includes("script-src 'self' 'unsafe-inline'"), 'CSP aun permite unsafe-inline en scripts');
    // build:min: el núcleo diferido carga minificado desde min/.
    assert.ok(html.includes('min/storage-idb.min.js?v=1'), 'falta storage-idb minificado');
    assert.ok(html.includes('boot-modulos.js?v=1'), 'falta boot-modulos diferido (CSP fase 1)');
    assert.ok(html.includes('sw-registro.js?v=1'), 'falta sw-registro diferido (CSP fase 1)');
    assert.ok(!/<script(?![^>]*src)(?![^>]*type="application\/ld\+json")/.test(html), 'queda <script> inline en index.html');
    // MODS vive en boot-modulos.js desde la CSP fase 1 (no en index.html).
    const boot = read('boot-modulos.js');
    for (const mod of ['min/accesibilidad-modulo.min.js?v=1', 'min/onboarding-modulo.min.js?v=1', 'min/auto-backup-modulo.min.js?v=1']) {
      assert.ok(boot.includes(`'${mod}'`), 'MODS sin ' + mod);
    }
  });

  it('diálogos: fuera de index.html, en templates/ + bundle', () => {
    const html = read('index.html');
    assert.ok(!/<dialog[\s>]/.test(html), 'index.html aún trae <dialog> inline');
    assert.ok(html.includes('min/templates-bundled.min.js?v=1'), 'falta templates-bundled minificado');
    assert.ok(html.includes('id="dlgHost"'), 'falta #dlgHost para inyección');
    const dir = fs.readdirSync(path.join(ROOT, 'templates')).filter((f) => f.endsWith('.html'));
    assert.ok(dir.length >= 50, 'se esperaban 50+ templates, hay ' + dir.length);
    const bundle = readSrc('templates-bundled.js');
    assert.ok(bundle.includes('window.cal13tpl'), 'bundle sin window.cal13tpl');
    for (const f of dir) {
      const id = f.replace(/\.html$/, '');
      assert.ok(bundle.includes(JSON.stringify(id) + ':'), 'bundle sin diálogo ' + id);
    }
  });

  it('package.json: nuevos archivos en build.files + scripts (slim)', () => {
    const pkg = JSON.parse(read('package.json'));
    // Deploy slim: las fuentes .js/.css viajan como min/* (no van en files).
    for (const f of ['main.js', 'preload.js', 'index.html', 'boot-modulos.js', 'sw-registro.js', 'sw.js', 'manifest.json', '_headers', 'templates/*.html', 'screenshots/*.png', 'min/**/*', 'assets/**/*', 'data/territorios/**/*']) {
      assert.ok((pkg.build.files || []).includes(f), 'build.files sin ' + f);
    }
    for (const f of ['storage-idb.js', 'renderer.js', 'nuevos-modulos.js', 'styles.css']) {
      assert.ok(!(pkg.build.files || []).includes(f), 'build.files aún lleva fuente slimmeada: ' + f);
    }
    for (const s of ['build:sw', 'check:sw', 'check:donate', 'movil:build', 'check:size', 'build:min', 'check:min', 'build:tpl', 'check:tpl', 'check:perf', 'csp:fase2', 'check:csp2', 'lighthouse']) {
      assert.ok(pkg.scripts[s], 'script ausente: ' + s);
    }
    assert.ok((pkg.devDependencies || {}).esbuild, 'falta devDep esbuild (minificación)');
  });

  it('sw.js y web/sw.js: CORE podado (bare+vigente) con nuevos módulos', () => {
    for (const f of ['sw.js', 'web/sw.js']) {
      const sw = read(f);
      assert.ok(sw.includes("'./min/storage-idb.min.js?v=1'"), f + ' sin storage-idb minificado');
      assert.ok(sw.includes("'./min/onboarding-modulo.min.js?v=1'"), f + ' sin onboarding minificado');
      assert.ok(sw.includes("'./min/templates-bundled.min.js?v=1'"), f + ' sin bundle de diálogos minificado');
      assert.ok(sw.includes("'./templates/configDialog.html'"), f + ' sin templates sueltos (respaldo fetch)');
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

  it('manifest.json: screenshots reales (no iconos)', () => {
    const m = JSON.parse(read('manifest.json'));
    assert.ok(Array.isArray(m.screenshots) && m.screenshots.length >= 2, 'se esperaban 2+ screenshots');
    const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    let wide = 0;
    for (const s of m.screenshots) {
      assert.ok(!/icon-512/.test(s.src), 'screenshot sigue siendo icon-512: ' + s.src);
      const p = path.join(ROOT, s.src);
      assert.ok(fs.existsSync(p), 'screenshot ausente: ' + s.src);
      const b = fs.readFileSync(p);
      assert.ok(b.subarray(0, 4).equals(pngMagic), s.src + ' no es PNG');
      const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
      assert.equal(`${w}x${h}`, s.sizes, `${s.src}: PNG real ${w}x${h} ≠ manifest ${s.sizes}`);
      if (s.form_factor === 'wide') wide++;
    }
    assert.ok(wide >= 1, 'falta screenshot wide (desktop)');
  });

  it('deploy slim: todo .js/.css cableado viaja como min/ (salvo loaders)', () => {
    const PERMITIDOS = new Set(['boot-modulos.js', 'sw-registro.js']);
    const html = read('index.html');
    const boot = read('boot-modulos.js');
    const refs = new Set();
    for (const m of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))(?:\?v=\d+)?"/g)) refs.add(m[1]);
    for (const m of boot.matchAll(/'([^']+\.js)(?:\?v=\d+)?'/g)) refs.add(m[1].split('?')[0]);
    const directos = [...refs].filter((r) => !r.startsWith('min/') && !PERMITIDOS.has(r));
    assert.deepEqual(directos, [], 'refs sin minificar (deploy no-slim): ' + directos.join(', '));
  });

  it('pwa-install: botón + módulo cableado', () => {
    const html = read('index.html');
    assert.ok(html.includes('id="btnInstall"'), 'falta #btnInstall en sidebar');
    assert.ok(html.includes('pwa-install'), 'pwa-install no cableado en index.html');
    const mod = read(fs.existsSync(path.join(ROOT, 'min/pwa-install.min.js')) ? 'min/pwa-install.min.js' : 'pwa-install.js');
    assert.ok(mod.includes('beforeinstallprompt'), 'pwa-install sin beforeinstallprompt');
    assert.ok(mod.includes('cal13pwa'), 'pwa-install sin window.cal13pwa');
  });

  it('donate: example con las 4 claves del renderer', () => {
    const ex = JSON.parse(read('donate.example.json'));
    for (const k of ['mercadopago', 'paypal', 'flow', 'kofi']) {
      assert.ok(k in ex, 'donate.example.json sin clave ' + k);
    }
  });
});
