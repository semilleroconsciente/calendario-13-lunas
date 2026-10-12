// csp-fase2.cjs — estilos inline `style="..."` → clases utilitarias.
//
// Fase 2 de CSP: ~9.900 style="..." estáticos pasan a styles-csp.css como
// `.su-<hash6>` con !important en cada declaración (el !important preserva
// la precedencia exacta que tenía el inline sobre el resto de reglas).
// Los ~180 sitios DINÁMICOS (valor con código: `+`, `${`, backtick) no se
// tocan: requieren el.style en cada call-site (con QA visual). Por eso
// style-src conserva 'unsafe-inline'; este script deja el ratchet:
//   --check falla si hay 1 solo estático o si los dinámicos crecen.
//
//   node scripts/csp-fase2.cjs --fix    -> convierte estáticos
//   node scripts/csp-fase2.cjs --check  -> ratchet (CI)
//   npm run csp:fase2 / check:csp2
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const CSS_OUT = path.join(ROOT, 'styles-csp.css');
const MODE = process.argv.includes('--check') ? 'check' : 'fix';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist-empaquetado', 'android', '.vscode', 'min', 'web']);
const SKIP_FILES = new Set(['templates-bundled.js', 'sw.js']); // generado / worker
const BASELINE_DINAMICOS = 210; // techo: no se agregan estilos dinámicos nuevos (v1.8.0: +6 por Energía/Descanso, core-calendario y cableado renderer; resto intacto)

function esDinamico(v) { return /[+`${]/.test(v); }
function hash(v) { return crypto.createHash('sha1').update(v).digest('hex').slice(0, 6); }

function fuentes() {
  const out = [];
  (function walk(d, rel) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (SKIP_DIRS.has(e.name)) continue;
      if (e.isDirectory()) { walk(path.join(d, e.name), rel + e.name + '/'); continue; }
      if (!/\.(js|html)$/.test(e.name) || SKIP_FILES.has(e.name)) continue;
      if (rel.startsWith('docs/') || rel.startsWith('scripts/') || rel.startsWith('tests/')) continue;
      out.push(rel + e.name);
    }
  })(ROOT, '');
  return out.sort();
}

function declaraciones(v) {
  return v.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
    if (/!important\s*$/.test(d)) return d + ';';
    return d + ' !important;';
  });
}

const files = fuentes();
const valores = new Map(); // valor -> {n, archivos:Set}
let dinamicos = 0;
const dinPorArchivo = new Map();
for (const f of files) {
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const re = / style="([^"]*)"/g;
  let m;
  while ((m = re.exec(s))) {
    if (esDinamico(m[1])) {
      dinamicos++;
      dinPorArchivo.set(f, (dinPorArchivo.get(f) || 0) + 1);
      continue;
    }
    if (!valores.has(m[1])) valores.set(m[1], { n: 0, archivos: new Set() });
    const e = valores.get(m[1]);
    e.n++;
    e.archivos.add(f);
  }
}

if (MODE === 'check') {
  let estaticos = 0;
  for (const e of valores.values()) estaticos += e.n;
  console.log(`csp-fase2: estáticos=${estaticos} dinámicos=${dinamicos} (techo ${BASELINE_DINAMICOS})`);
  let fail = 0;
  if (estaticos > 0) { console.log(`  x quedan ${estaticos} style= estáticos (npm run csp:fase2)`); fail = 1; }
  if (dinamicos > BASELINE_DINAMICOS) {
    console.log(`  x dinámicos crecieron (${dinamicos} > ${BASELINE_DINAMICOS}); conviértelos a el.style`);
    for (const [f, n] of [...dinPorArchivo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`    ~ ${f}: ${n}`);
    fail = 1;
  }
  if (!fail) console.log('OK: 0 estáticos y dinámicos bajo techo.');
  process.exit(fail ? 1 : 0);
}

// --fix: genera styles-csp.css y reescribe.
const claseDe = new Map();
for (const v of valores.keys()) claseDe.set(v, 'su-' + hash(v));
let css = '/* styles-csp.css — AUTO-GENERADO por scripts/csp-fase2.cjs. No editar a mano.\n'
  + `   Utilidades de la migración CSP fase 2 (${valores.size} valores, !important\n`
  + '   para preservar la precedencia del inline). Fuente: atributos style="..." */\n';
for (const [v, cls] of [...claseDe.entries()].sort((a, b) => a[1].localeCompare(b[1]))) {
  css += `.${cls}{${declaraciones(v).join('')}}\n`;
}
fs.writeFileSync(CSS_OUT, css, 'utf8');

// Reemplazo por archivo con fusión de class existente.
const TAG = /<([A-Za-z][A-Za-z0-9-]*)((?:"[^"]*"|[^>"'])*?) style="([^"]*)"/g;
let tocados = 0, reemplazos = 0;
for (const f of files) {
  const p = path.join(ROOT, f);
  const antes = fs.readFileSync(p, 'utf8');
  const despues = antes.replace(TAG, (todo, tag, attrs, val) => {
    if (esDinamico(val)) return todo;
    const cls = claseDe.get(val);
    if (!cls) return todo;
    const mc = attrs.match(/\bclass="([^"]*)"/);
    let nuevos;
    if (mc) nuevos = attrs.replace(/\bclass="([^"]*)"/, `class="$1 ${cls}"`);
    else nuevos = attrs + ` class="${cls}"`;
    reemplazos++;
    return `<${tag}${nuevos}`;
  });
  if (despues !== antes) { fs.writeFileSync(p, despues, 'utf8'); tocados++; }
}
console.log(`csp-fase2: ${valores.size} clases en styles-csp.css, ${reemplazos} reemplazos en ${tocados} archivos, ${dinamicos} dinámicos intactos.`);
