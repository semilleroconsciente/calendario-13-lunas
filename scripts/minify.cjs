// minify.cjs — minificación con esbuild (mejora: peso y arranque).
//
// Estrategia "sidecar": cada JS/CSS shipped genera min/<base>.min.js(css)
// e index.html + boot-modulos.js apuntan a los .min (mismo ?v=). Sin bundle:
// los 90 IIFE se siguen cargando en el mismo orden, solo que minificados.
// Semántica preservada (esbuild minify, sin tree-shaking entre archivos).
//
//   node scripts/minify.cjs --fix    -> reescribe refs y (re)construye min/
//   node scripts/minify.cjs --check  -> falla si falta algo o hay fuente
//                                       más nueva que su .min (CI)
//   node scripts/minify.cjs --revert -> devuelve refs a los .js originales
//
// Frescura: min/.hashes.json {fuente: sha1}. Excluidos con scope propio:
// main.js, preload.js (Node), capacitor.config.js, sw.js (scope /sw.js),
// boot-modulos.js y sw-registro.js (cargadores diminutos: minificarlos no
// ahorra nada y su .min quedaría sin referenciar).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const MINDIR = path.join(ROOT, 'min');
const HASHES = path.join(MINDIR, '.hashes.json');
const MODE = process.argv.includes('--check') ? 'check'
  : process.argv.includes('--revert') ? 'revert' : 'fix';

const EXCLUIR = new Set(['main.js', 'preload.js', 'capacitor.config.js', 'sw.js',
  'boot-modulos.js', 'sw-registro.js']);

function sha1(s) { return crypto.createHash('sha1').update(s).digest('hex'); }

function fuentes() {
  const out = [];
  for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!e.isFile()) continue;
    if (EXCLUIR.has(e.name)) continue;
    if (e.name.endsWith('.min.js') || e.name.endsWith('.min.css')) continue;
    if (e.name.endsWith('.js')) out.push({ src: e.name, out: 'min/' + e.name.replace(/\.js$/, '.min.js'), loader: 'js' });
    else if (e.name === 'styles.css' || e.name === 'splash.css') out.push({ src: e.name, out: 'min/' + e.name.replace(/\.css$/, '.min.css'), loader: 'css' });
  }
  return out.sort((a, b) => a.src.localeCompare(b.src));
}

function loadHashes() {
  try { return JSON.parse(fs.readFileSync(HASHES, 'utf8')); }
  catch { return {}; }
}

function minificar(entry) {
  const esbuild = require('esbuild');
  const codigo = fs.readFileSync(path.join(ROOT, entry.src), 'utf8');
  const r = esbuild.transformSync(codigo, { loader: entry.loader, minify: true });
  return { codigo, min: r.code };
}

if (MODE === 'revert') {
  for (const f of ['index.html', 'boot-modulos.js']) {
    const p = path.join(ROOT, f);
    let s = fs.readFileSync(p, 'utf8');
    const antes = s;
    s = s.replace(/min\/([A-Za-z0-9_.\-]+)\.min\.(js|css)(\?v=\d+)/g, '$1.$2$3');
    if (s !== antes) { fs.writeFileSync(p, s, 'utf8'); console.log('  ~ ' + f + ': refs revertidas a originales'); }
    else console.log('  = ' + f + ': sin refs min/');
  }
  process.exit(0);
}

const entries = fuentes();
const noms = new Set(entries.map((e) => e.src));

// Reescritura de refs index.html + boot-modulos.js hacia min/ (idempotente).
function aMin(s) {
  // Excluidos con scope propio nunca van a min/: si una tanda anterior los
  // mapeó, se devuelven a su nombre original.
  for (const name of EXCLUIR) {
    const m = name.match(/^(.+)\.(js|css)$/);
    if (m) s = s.split(`min/${m[1]}.min.${m[2]}`).join(name);
  }
  s = s.replace(/(src|href)="([A-Za-z0-9_.\-]+\.(?:js|css))(\?v=\d+)"/g, (m, attr, name, v) => {
    if (!noms.has(name)) return m;
    const e = entries.find((x) => x.src === name);
    return `${attr}="${e.out}${v}"`;
  });
  // Bloque MODS: 'X.js?v=N' (boot-modulos.js)
  s = s.replace(/'([A-Za-z0-9_.\-]+\.js)(\?v=\d+)'/g, (m, name, v) => {
    const e = entries.find((x) => x.src === name);
    return e ? `'${e.out}${v}'` : m;
  });
  return s;
}

let tocados = [];
if (MODE === 'fix') {
  // Las refs se reescriben ANTES de minificar: el hash de cada fuente debe
  // calcularse ya con el contenido final (boot-modulos.js es fuente y a la
  // vez referenciador del bloque MODS).
  for (const f of ['index.html', 'boot-modulos.js']) {
    const p = path.join(ROOT, f);
    const antes = fs.readFileSync(p, 'utf8');
    const despues = aMin(antes);
    if (despues !== antes) { fs.writeFileSync(p, despues, 'utf8'); tocados.push(f); }
  }
}

const hashes = loadHashes();
let staled = [];
let hechos = 0, s0 = 0, s1 = 0, g0 = 0, g1 = 0, omitidos = [];

for (const e of entries) {
  const codigo = fs.readFileSync(path.join(ROOT, e.src), 'utf8');
  const h = sha1(codigo);
  const outPath = path.join(ROOT, e.out);
  const fresco = hashes[e.src] === h && fs.existsSync(outPath);
  s0 += codigo.length;
  if (MODE === 'check') {
    if (!fresco) staled.push(e.src);
    else { s1 += fs.readFileSync(outPath, 'utf8').length; }
    continue;
  }
  if (fresco) {
    const m = fs.readFileSync(outPath, 'utf8');
    s1 += m.length; g0 += zlib.gzipSync(codigo).length; g1 += zlib.gzipSync(m).length;
    continue;
  }
  let min;
  try {
    min = minificar(e).min;
  } catch (err) {
    omitidos.push(`${e.src}: ${String((err && err.message) || err).split('\n')[0]}`);
    s1 += codigo.length;
    continue;
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, min, 'utf8');
  try {
    execFileSync(process.execPath, ['--check', outPath], { stdio: 'pipe' });
  } catch {
    if (e.loader === 'js') { omitidos.push(e.src + ': salida no parsea, se omite'); fs.rmSync(outPath); s1 += codigo.length; continue; }
  }
  hashes[e.src] = h;
  hechos++;
  s1 += min.length; g0 += zlib.gzipSync(codigo).length; g1 += zlib.gzipSync(min).length;
}

if (MODE === 'check') {
  if (staled.length) {
    console.log(`min/: ${staled.length} fuente(s) sin .min fresco:\n  x ` + staled.join('\n  x '));
    console.log('\nEjecuta npm run build:min para regenerar.');
    process.exit(1);
  }
  console.log(`OK: min/ fresco (${entries.length} archivos).`);
  process.exit(0);
}

for (const k of Object.keys(hashes)) {
  if (!noms.has(k)) {
    delete hashes[k];
    for (const d of [ROOT, path.join(ROOT, 'web')]) {
      for (const ext of ['.min.js', '.min.css']) {
        const base = k.replace(/\.(js|css)$/, ext);
        const p = path.join(d, 'min', base);
        if (fs.existsSync(p)) { fs.rmSync(p); console.log('  - excluido, eliminado: ' + path.relative(ROOT, p)); }
      }
    }
  }
}
fs.writeFileSync(HASHES, JSON.stringify(hashes, null, 1) + '\n', 'utf8');

const pct = Math.round(100 * s1 / Math.max(1, s0));
console.log(`minify: ${entries.length} fuentes, ${hechos} reconstruidos${tocados.length ? ', refs actualizadas en ' + tocados.join(', ') : ''}`);
console.log(`  raw: ${Math.round(s0 / 1024)} KB -> ${Math.round(s1 / 1024)} KB (${pct}%) | gzip: ${Math.round(g0 / 1024)} KB -> ${Math.round(g1 / 1024)} KB`);
if (omitidos.length) console.log('  ~ omitidos:\n    ' + omitidos.join('\n    '));
if (hechos || tocados.length) console.log('  -> ejecuta npm run build:sw --fix y sync:web --fix si cambiaron refs.');
