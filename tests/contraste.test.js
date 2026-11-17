'use strict';
// ============================================================================
// tests/contraste.test.js — auditoría WCAG AA (4.5:1) del texto secundario.
//
// Regla: el --muted efectivo (body[data-theme], mayor especificidad) sobre
// el --bg de cada tema, más los colores fijos del tema claro sobre tarjeta
// blanca.
// Medido v1.7: claro #7a6e5a/#f4f1e8 daba 4.42:1 → se llevó a #6e6450 (5.16:1).
// Uso: node --test tests/  (o npm test)
// ============================================================================
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { leerFuente, info } = require('./helpers.cjs');

const UMBRAL_AA = 4.5;

// --- Colorimetría ------------------------------------------------------------
function luminancia(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const canales = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2];
}

function contraste(a, b) {
  const x = luminancia(a);
  const y = luminancia(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// Extrae --bg/--muted efectivos por tema. Especificidad real: body[data-theme]
// (0,1,1) gana a [data-theme] (0,1,0) sin importar el orden; el plano solo
// cuenta si no hay body[].
function variablesPorTema(css) {
  const vars = {};
  const re = /(body)?\[data-theme="([a-z]+)"\]\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const esBody = Boolean(m[1]);
    const tema = m[2];
    const cuerpo = m[3];
    vars[tema] = vars[tema] || {};
    for (const v of ['bg', 'muted']) {
      const mm = cuerpo.match(new RegExp('--' + v + '\\s*:\\s*(#[0-9a-fA-F]{6})'));
      if (!mm) continue;
      if (esBody || vars[tema][v + '!'] !== 'body') {
        vars[tema][v] = mm[1];
        if (esBody) vars[tema][v + '!'] = 'body';
      }
    }
  }
  return vars;
}

// --- Suite -------------------------------------------------------------------
describe('Contraste WCAG AA (texto secundario)', () => {
  it('--muted sobre --bg alcanza 4.5:1 en todos los temas', () => {
    const css = leerFuente('styles.css');
    const vars = variablesPorTema(css);
    assert.ok(Object.keys(vars).length >= 6, 'temas no encontrados en styles.css');
    for (const [tema, v] of Object.entries(vars)) {
      assert.ok(v.muted && v.bg, `tema ${tema} sin --muted/--bg`);
      const r = contraste(v.muted, v.bg);
      info(`${tema}: ${v.muted}/${v.bg} = ${r.toFixed(2)}:1`);
      assert.ok(r >= UMBRAL_AA, `${tema}: ${v.muted} sobre ${v.bg} = ${r.toFixed(2)}:1 (< 4.5)`);
    }
  });

  it('los colores fijos del tema claro llegan a 4.5:1 sobre blanco', () => {
    const fijos = ['#6b5312', '#8a5a00', '#5b4a9e', '#0f6a9e', '#4a5a8a', '#1e7a34', '#a83232', '#4a4132'];
    for (const c of fijos) {
      const r = contraste(c, '#ffffff');
      assert.ok(r >= UMBRAL_AA, `${c} sobre #ffffff = ${r.toFixed(2)}:1 (< 4.5)`);
    }
  });
});
