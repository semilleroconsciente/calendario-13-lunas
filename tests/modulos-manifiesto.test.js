'use strict';
// tests/modulos-manifiesto.test.js — MODULE-01.
// Manifiesto verificable: toda fuente src/*.js cableada (index.html núcleo o
// boot-modulos.js MODS) y todo MODS con fuente existente. Evita módulos
// huérfanos y listas duplicadas sin fuente única.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('./helpers.cjs');

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

describe('manifiesto de módulos (MODULE-01)', () => {
  it('toda fuente src/*.js está cableada y todo MODS tiene fuente', () => {
    const html = read('index.html');
    const boot = read('boot-modulos.js');
    const NIVEL_NUCLEO = new Set(['web-api', 'storage-idb', 'astro', 'data', 'data-schema', 'territorio', 'frases', 'cal', 'templates-bundled', 'core-bootstrap', 'core-sanitize', 'core-cifrado', 'core-audio', 'core-themes', 'core-storage', 'core-calendario', 'core-dialogo-dia', 'core-clima', 'renderer', 'renderer-territorio-vivo', 'dialogo-tamano', 'zoom-calendario', 'nuevos-modulos', 'bienvenida-modulo', 'pwa-install']);
    const mods = new Set();
    for (const m of boot.matchAll(/'(min\/([^']+?)(?:\.min\.js))(?:\?v=\d+)?'/g)) mods.add(m[2].replace(/\.min$/, ''));
    for (const m of html.matchAll(/src="min\/([^"]+?)\.min\.js(?:\?v=\d+)?"/g)) mods.add(m[1]);
    // boot-modulos también puede referenciar min/x sin prefijo min/ capturado arriba
    for (const m of boot.matchAll(/'(min\/[^']+?)(?:\?v=\d+)?'/g)) {
      const base = m[1].replace(/^min\//, '').replace(/\.min\.js$/, '');
      mods.add(base);
    }
    const srcFiles = fs.readdirSync(path.join(ROOT, 'src')).filter((f) => f.endsWith('.js')).map((f) => f.replace(/\.js$/, ''));
    // Excepciones documentadas: vendored/lazy sin cableado directo.
    // anime-v4 va LAZY (bienvenida-modulo lo usa vía window.anime) + precache SW.
    const EXCEPTUADOS = new Set(['anime-v4', 'jsqr-lib', 'qrcode-lib']);
    const NO_CABLEADOS = new Set(['qr-codec', 'web-api', 'templates-bundled']);
    const sinCablear = srcFiles.filter((s) => !mods.has(s) && !EXCEPTUADOS.has(s) && !NO_CABLEADOS.has(s));
    // qr-codec es lib usada vía import dinámico en qr-sync; se verifica aparte.
    const reales = sinCablear.filter((s) => {
      try {
        const c = read('src/' + s + '.js');
        if (/qr-codec|QRCode|jsQR/.test(c.slice(0, 2000)) && s.includes('qr')) return false;
        return true;
      } catch { return true; }
    });
    assert.deepEqual([...reales].sort(), [], 'fuentes sin cablear: ' + [...reales].sort().join(', '));
    // Inversa: todo MODS tiene fuente (salvo pwa-install que vive en src/ raíz ya contemplado).
    const sinFuente = [...mods].filter((m) => {
      if (m === 'pwa-install' || NIVEL_NUCLEO.has(m)) return false;
      return !fs.existsSync(path.join(ROOT, 'src', m + '.js')) && !fs.existsSync(path.join(ROOT, m + '.js'));
    });
    assert.deepEqual(sinFuente.sort(), [], 'MODS sin fuente: ' + sinFuente.sort().join(', '));
  });
});
