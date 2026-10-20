// paths.cjs — fuente única de verdad para las rutas del repo.
//
// Fase 1 del reorden src/ (sin mover nada todavía):
//  - Hoy todo el código fuente vive en la RAÍZ (144 .js + CSS).
//  - El destino es src/ para las fuentes, con min/ como salida GENERADA.
//  - Hasta que se ejecute la mudanza (Paso 3), src/ no existe y todos los
//    helpers hacen fallback a la raíz: comportamiento 100% idéntico.
//
// Archivos con scope propio que SIEMPRE quedan en la raíz (no van a src/
// ni a min/): main.js, preload.js (Node/Electron), capacitor.config.js,
// sw.js (scope /sw.js), boot-modulos.js y sw-registro.js (cargadores).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const MINDIR = path.join(ROOT, 'min');

const RAIZ_FIJA = new Set([
  'main.js',
  'preload.js',
  'capacitor.config.js',
  'sw.js',
  'boot-modulos.js',
  'sw-registro.js',
]);

function existeSrc() {
  try { return fs.statSync(SRC).isDirectory(); } catch { return false; }
}

// Resuelve dónde vive una fuente: src/<name> si existe, si no <root>/<name>.
// Devuelve ruta absoluta o null si no existe en ningún lado.
function resolverFuente(name) {
  const enSrc = path.join(SRC, name);
  if (existeSrc() && fs.existsSync(enSrc)) return enSrc;
  const enRaiz = path.join(ROOT, name);
  if (fs.existsSync(enRaiz)) return enRaiz;
  return null;
}

function leerFuente(name) {
  const p = resolverFuente(name);
  if (!p) throw new Error('Fuente no encontrada (src/ ni raíz): ' + name);
  return fs.readFileSync(p, 'utf8');
}

// Lista {src, out, loader} igual que minify.cjs, pero dual raíz+src/.
// src = ruta relativa a ROOT ('x.js' hoy, 'src/x.js' tras la mudanza).
// out = salida en min/ (SIN cambios: el runtime y el SW no se tocan).
function listarFuentes() {
  const seen = new Map(); // base -> entry (src/ gana a raíz si ambos existen)
  const dirs = existeSrc() ? [ROOT, SRC] : [ROOT];
  for (const dir of dirs) {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (!e.isFile()) continue;
      if (RAIZ_FIJA.has(e.name)) continue;
      if (e.name.endsWith('.min.js') || e.name.endsWith('.min.css')) continue;
      const rel = dir === SRC ? 'src/' + e.name : e.name;
      if (e.name.endsWith('.js')) seen.set(e.name, { src: rel, out: 'min/' + e.name.replace(/\.js$/, '.min.js'), loader: 'js' });
      else if (e.name.endsWith('.css')) seen.set(e.name, { src: rel, out: 'min/' + e.name.replace(/\.css$/, '.min.css'), loader: 'css' });
    }
  }
  return [...seen.values()].sort((a, b) => a.src.localeCompare(b.src));
}

module.exports = { ROOT, SRC, MINDIR, RAIZ_FIJA, existeSrc, resolverFuente, leerFuente, listarFuentes };
