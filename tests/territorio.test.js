'use strict';
// ============================================================================
// tests/territorio.test.js — cobertura de datos territoriales (mejora #6).
//
// Cada JSON de data/territorios debe parsear y traer contenido; data.js debe
// incluir el fallback embebido de las 13 lunas.
// Uso: node --test tests/  (o npm test)
// ============================================================================
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, leerFuente } = require('./helpers.cjs');

const TER = path.join(ROOT, 'data/territorios');
const MIN_JSON_ESPERADOS = 10;

function listarJson(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...listarJson(path.join(dir, e.name)));
    else if (e.name.endsWith('.json')) out.push(path.join(dir, e.name));
  }
  return out;
}

// --- Suite -------------------------------------------------------------------
describe('Datos territoriales', () => {
  it('todos los JSON parsean y no están vacíos', () => {
    const files = listarJson(TER);
    assert.ok(files.length >= MIN_JSON_ESPERADOS, 'muy pocos JSON: ' + files.length);
    for (const f of files) {
      let o;
      try {
        o = JSON.parse(fs.readFileSync(f, 'utf8'));
      } catch (e) {
        assert.fail(`${path.basename(f)} inválido: ${e.message}`);
      }
      const tamano = Array.isArray(o) ? o.length : Object.keys(o).length;
      assert.ok(o && tamano, `${path.basename(f)} vacío`);
    }
  });

  it('data.js trae el fallback embebido de las 13 lunas', () => {
    const data = leerFuente('data.js');
    assert.ok(data.includes('We Tripantü'), 'data.js sin luna 1 (fallback roto)');
  });
});
