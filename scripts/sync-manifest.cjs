// sync-manifest.cjs — evita la deriva entre index.html, sw.js, web/sw.js y package.json.
//
// Fuente de verdad: index.html (scripts defer + bloque MODS de carga diferida).
// Verifica que:
//   1. Cada "archivo.js?v=N" y "estilos.css?v=N" referenciado tenga entrada
//      bare + versionada en el CORE de sw.js y de web/sw.js.
//   2. Cada .js/.css referenciado exista en disco y este en build.files de
//      package.json (para que el portable de Electron lo incluya).
//   3. El bloque MODS de web/index.html no diverja del de index.html.
//
// Uso:
//   node scripts/sync-manifest.cjs          -> solo verifica (exit 1 si hay deriva)
//   node scripts/sync-manifest.cjs --fix    -> agrega lo faltante y sube la
//                                             version de CACHE en ambos SW.
//
// Pensado para correrse en CI: npm run check:manifest
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const FIX = process.argv.includes('--fix');

function versionedRefs(html) {
  // Captura nombre + version de src="x.js?v=N" y de 'x.js?v=N' (bloque MODS).
  const out = new Map(); // nombre -> Set(versiones)
  const re = /([A-Za-z0-9_.\-]+\.(?:js|css))\?v=(\d+)/g;
  let m;
  while ((m = re.exec(html))) {
    if (!out.has(m[1])) out.set(m[1], new Set());
    out.get(m[1]).add(m[2]);
  }
  return out;
}

function coreEntries(swText) {
  const block = swText.match(/const CORE = \[([\s\S]*?)\n\];/);
  if (!block) throw new Error('No se encontro el bloque const CORE = [...] en sw.js');
  const set = new Set();
  const re = /'\.\/([^']+)'/g;
  let m;
  while ((m = re.exec(block[1]))) set.add(m[1]);
  return { set, block: block[0], inner: block[1] };
}

function modsBlock(html) {
  const m = html.match(/var MODS = \[[\s\S]*?\];/);
  return m ? m[0] : null;
}

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

let indexHtml, webIndex, swRoot, swWeb, pkg;
try { indexHtml = read('index.html'); } catch { fail('No se pudo leer index.html'); process.exit(2); }
try { webIndex = read('web/index.html'); } catch { warn('No se pudo leer web/index.html (se omite comparacion)'); }
try { swRoot = read('sw.js'); } catch { fail('No se pudo leer sw.js'); process.exit(2); }
try { swWeb = read('web/sw.js'); } catch { warn('No se pudo leer web/sw.js (se omite comparacion)'); }
try { pkg = JSON.parse(read('package.json')); } catch { fail('package.json invalido'); process.exit(2); }

// 1. Cobertura del CORE en ambos SW.
const refs = versionedRefs(indexHtml);
const required = new Map(); // entrada CORE -> archivo base (para mensaje)
for (const [name, vers] of refs) {
  required.set(name, name); // bare
  for (const v of vers) required.set(`${name}?v=${v}`, name);
}
const swFiles = [['sw.js', swRoot]];
if (swWeb) swFiles.push(['web/sw.js', swWeb]);
const missingByFile = {};
for (const [label] of swFiles) {
  const { set } = coreEntries(label === 'sw.js' ? swRoot : swWeb);
  missingByFile[label] = [...required.keys()].filter((e) => !set.has(e));
  for (const e of missingByFile[label]) fail(`${label}: falta en CORE './${e}' (usado en index.html)`);
}

// 2. Archivos en disco + package.json build.files.
const pkgFiles = new Set((pkg.build && pkg.build.files) || []);
const CORE_PAGE_FILES = new Set(['main.js', 'preload.js', 'sw.js']); // van en files pero no en index.html
for (const [name] of refs) {
  if (!name.endsWith('.js') && !name.endsWith('.css')) continue;
  if (!fs.existsSync(path.join(ROOT, name))) fail(`index.html referencia ${name} pero no existe en disco`);
  else if (!pkgFiles.has(name)) fail(`${name} usado en index.html pero ausente en build.files de package.json (el portable no lo incluira)`);
}
for (const f of pkgFiles) {
  if (f.endsWith('.js') && !refs.has(f) && !CORE_PAGE_FILES.has(f)) {
    warn(`package.json incluye ${f} pero index.html no lo carga (posible huerfano)`);
  }
}

// 3. Divergencia web/index.html.
if (webIndex) {
  const a = modsBlock(indexHtml);
  const b = modsBlock(webIndex);
  if (a && b && a !== b) fail('El bloque MODS de web/index.html diverge del de index.html (sincronizar)');
  else if (!a || !b) warn('No se pudo comparar el bloque MODS (patron no encontrado)');
}

if (warnings.length) {
  console.log('Avisos:');
  for (const w of warnings) console.log('  ~ ' + w);
}

if (!errors.length) {
  console.log('OK: index.html, sw.js, web/sw.js y package.json estan en sincronia.');
  process.exit(0);
}

console.log('Deriva detectada:');
for (const e of errors) console.log('  x ' + e);

if (!FIX) {
  console.log('\nEjecuta con --fix para agregar las entradas faltantes y subir la version de CACHE.');
  process.exit(1);
}

// --- Modo --fix: agrega faltantes al final del CORE y sube CACHE en ambos SW.
function bumpCache(text) {
  return text.replace(/const CACHE = 'cal13-v(\d+)-offline'/, (_, n) => `const CACHE = 'cal13-v${Number(n) + 1}-offline'`);
}
function bumpHeader(text) {
  return text.replace(/^\/\/ v(\d+)$/m, (_, n) => `// v${Number(n) + 1}`);
}
for (const label of Object.keys(missingByFile)) {
  const missing = missingByFile[label];
  if (!missing.length) continue;
  const p = path.join(ROOT, label);
  let text = fs.readFileSync(p, 'utf8');
  const { inner } = coreEntries(text);
  // inner termina en "...'," (sin salto final: ese pertenece al "\n];" del match).
  const addition = missing.map((e) => `  './${e}',`).join('\n');
  text = text.replace(inner, inner + '\n' + addition);
  const before = text;
  text = bumpCache(text);
  if (text === before) warn(`${label}: se agregaron entradas pero no se pudo subir la version de CACHE (revisar manual)`);
  if (label === 'sw.js') text = bumpHeader(text);
  fs.writeFileSync(p, text, 'utf8');
  console.log(`  + ${label}: ${missing.length} entradas agregadas y CACHE actualizado.`);
}
console.log('Re-ejecuta sin --fix para confirmar.');
