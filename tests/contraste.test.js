// tests/contraste.test.js — auditoría WCAG AA (4.5:1) para texto secundario.
// Regla: --muted efectivo (body[data-theme], mayor especificidad) sobre --bg
// de cada tema + colores fijos del tema claro sobre tarjeta blanca.
// Medido v1.7: claro #7a6e5a/#f4f1e8 daba 4.42:1 → se llevó a #6e6450 (5.16:1).
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function lum(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a, b) {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe('contraste WCAG AA', () => {
  it('--muted sobre --bg ≥ 4.5:1 en todos los temas', () => {
    const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
    // Especificidad real: body[data-theme] (0,1,1) gana a [data-theme] (0,1,0)
    // sin importar el orden. Se respeta: body[] pisa, plano solo si no hay body[].
    const vars = {};
    const re = /(body)?\[data-theme="([a-z]+)"\]\s*\{([^}]*)\}/g;
    let m;
    while ((m = re.exec(css))) {
      const esBody = !!m[1], t = m[2], cuerpo = m[3];
      vars[t] = vars[t] || {};
      for (const v of ['bg', 'muted']) {
        const mm = cuerpo.match(new RegExp('--' + v + '\\s*:\\s*(#[0-9a-fA-F]{6})'));
        if (!mm) continue;
        if (esBody || vars[t][v + '!'] !== 'body') {
          vars[t][v] = mm[1];
          if (esBody) vars[t][v + '!'] = 'body';
        }
      }
    }
    assert.ok(Object.keys(vars).length >= 6, 'temas no encontrados en styles.css');
    for (const [t, v] of Object.entries(vars)) {
      assert.ok(v.muted && v.bg, `tema ${t} sin --muted/--bg`);
      const r = ratio(v.muted, v.bg);
      console.log(`  i ${t}: ${v.muted}/${v.bg} = ${r.toFixed(2)}:1`);
      assert.ok(r >= 4.5, `${t}: ${v.muted} sobre ${v.bg} = ${r.toFixed(2)}:1 (< 4.5)`);
    }
  });

  it('colores fijos del tema claro sobre blanco ≥ 4.5:1', () => {
    const fijos = ['#6b5312', '#8a5a00', '#5b4a9e', '#0f6a9e', '#4a5a8a', '#1e7a34', '#a83232', '#4a4132'];
    for (const c of fijos) {
      const r = ratio(c, '#ffffff');
      assert.ok(r >= 4.5, `${c} sobre #ffffff = ${r.toFixed(2)}:1 (< 4.5)`);
    }
  });
});
