// tests/territorio.test.js — mejora #6 (cobertura de datos).
// Cada JSON de data/territorios/penco debe parsear y traer contenido;
// data.js debe incluir el fallback de las 13 lunas.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TER = path.join(ROOT, 'data/territorios');

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name)));
    else if (e.name.endsWith('.json')) out.push(path.join(dir, e.name));
  }
  return out;
}

describe('datos territoriales', () => {
  it('todos los JSON parsean y no están vacíos', () => {
    const files = walk(TER);
    assert.ok(files.length >= 10, 'muy pocos JSON: ' + files.length);
    for (const f of files) {
      let o;
      try { o = JSON.parse(fs.readFileSync(f, 'utf8')); }
      catch (e) { assert.fail(path.basename(f) + ' inválido: ' + e.message); }
      assert.ok(o && (Array.isArray(o) ? o.length : Object.keys(o).length), path.basename(f) + ' vacío');
    }
  });

  it('data.js trae fallback de las 13 lunas', () => {
    const data = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
    assert.ok(data.includes('We Tripantü'), 'data.js sin luna 1 (fallback roto)');
  });
});
