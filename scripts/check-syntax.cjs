// check-syntax.cjs — node --check a todo JS/CJS del producto.
// Complementa check:manifest (que valida referencias) con validez sintactica.
// Uso: node scripts/check-syntax.cjs
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const files = [];
// Paso 2 del reorden src/: barrido dual raíz+src/ (hoy src/ no existe →
// idéntico a antes; tras la mudanza también cubre las fuentes movidas).
for (const dir of [ROOT, path.join(ROOT, 'src')]) {
  let list = [];
  try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
  const pref = dir === ROOT ? '' : 'src/';
  for (const e of list) {
    if (e.isFile() && (e.name.endsWith('.js') || e.name.endsWith('.cjs'))) files.push(pref + e.name);
  }
}
for (const e of fs.readdirSync(path.join(ROOT, 'scripts'))) {
  if (e.endsWith('.cjs')) files.push('scripts/' + e);
}
// Salida de build:min (si existe): el bundle minificado también debe parsear.
try {
  for (const e of fs.readdirSync(path.join(ROOT, 'min'))) {
    if (e.endsWith('.min.js')) files.push('min/' + e);
  }
} catch {}

let bad = 0;
for (const f of files.sort()) {
  try {
    execFileSync(process.execPath, ['--check', path.join(ROOT, f)], { stdio: 'pipe' });
  } catch (e) {
    bad++;
    const msg = (e.stderr || e.stdout || Buffer.from('')).toString().split('\n').slice(0, 4).join('\n');
    console.log(`  x ${f}\n${msg}`);
  }
}
if (bad) {
  console.log(`\n${bad} archivo(s) con sintaxis invalida.`);
  process.exit(1);
}
console.log(`OK: sintaxis valida en ${files.length} archivos.`);
