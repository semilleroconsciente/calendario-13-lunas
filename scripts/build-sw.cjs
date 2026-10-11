// build-sw.cjs — genera el CORE de sw.js desde index.html (fin del versionado manual).
//
// Fuente de verdad: index.html (scripts defer + <link rel=stylesheet>)
// + boot-modulos.js (bloque MODS, CSP fase 1).
// Genera CORE con solo 2 entradas por asset: bare + version vigente (?v=N).
// Poda el historial (?v=8...?v=16) que inflaba la caché y causaba derivas.
//
// Uso:
//   node scripts/build-sw.cjs          -> muestra diff sin escribir
//   node scripts/build-sw.cjs --fix    -> reescribe sw.js y web/sw.js + bump CACHE
//   npm run build:sw                   -> atajo con --fix
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FIX = process.argv.includes('--fix');

function parseAssets(html) {
  // 1) <script defer src="x.js?v=N"> y <link rel=stylesheet href="x.css?v=N">
  const out = new Map(); // nombre -> version vigente (string|null)
  const reScript = /<(?:script|link)[^>]+(?:src|href)="([^"]+\.(?:js|css))(?:\?v=(\d+))?"/g;
  let m;
  while ((m = reScript.exec(html))) {
    const name = m[1];
    if (name.startsWith('http')) continue;
    const v = m[2] || null;
    if (!out.has(name) || (v && (!out.get(name) || Number(v) > Number(out.get(name))))) {
      out.set(name, v);
    }
  }
  // 2) Bloque MODS: vive en index.html (legacy) o en boot-modulos.js
  //    (CSP fase 1: el inline se extrajo a archivo). Se parsean ambos.
  const modsSrc = [];
  const modsHtml = html.match(/var MODS = \[([\s\S]*?)\];/);
  if (modsHtml) modsSrc.push(modsHtml[1]);
  try {
    const boot = fs.readFileSync(path.join(ROOT, 'boot-modulos.js'), 'utf8');
    const modsBoot = boot.match(/var MODS = \[([\s\S]*?)\];/);
    if (modsBoot) modsSrc.push(modsBoot[1]);
  } catch {}
  {
    const re = /'([^']+\.(?:js|css))(?:\?v=(\d+))?'/g;
    for (const src of modsSrc) {
      let m;
      while ((m = re.exec(src))) {
        const name = m[1];
        const v = m[2] || null;
        if (!out.has(name) || (v && (!out.get(name) || Number(v) > Number(out.get(name))))) {
          out.set(name, v);
        }
      }
      re.lastIndex = 0;
    }
  }
  return out;
}

function staticEntries() {
  // Datos + estáticos que no salen en <script> pero el SW debe precachear.
  const files = [
    './', './index.html', './manifest.json', './donate.json',
    './icon-192.png', './icon-512.png', './icon-512-maskable.png',
    './assets/notify.mp3',
    './data/territorios/index.json',
  ];
  try {
    const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/territorios/index.json'), 'utf8'));
    const list = Array.isArray(idx) ? idx : (idx.territorios || idx.files || []);
    for (const t of list) if (typeof t === 'string') files.push('./data/territorios/' + t);
  } catch {}
  // Expande data/territorios/penco/** reales en disco (más fiable que el índice).
  try {
    const walk = (d, base) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.isDirectory()) walk(path.join(d, e.name), base + e.name + '/');
        else if (e.name.endsWith('.json')) files.push('./data/territorios/' + base + e.name);
      }
    };
    walk(path.join(ROOT, 'data/territorios'), '');
  } catch {}
  // Diálogos sueltos: respaldo fetch de cal13tpl.asegurar() (el bundle
  // embebido es lo primario; estos solo se tocan si un id falta en él).
  try {
    for (const e of fs.readdirSync(path.join(ROOT, 'templates'))) {
      if (e.endsWith('.html')) files.push('./templates/' + e);
    }
  } catch {}
  return [...new Set(files)];
}

function buildCore(html) {
  const assets = parseAssets(html);
  const core = [...staticEntries()];
  const sorted = [...assets.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [name, v] of sorted) {
    const bare = './' + name;
    if (!core.includes(bare)) core.push(bare);
    if (v && !core.includes(`${bare}?v=${v}`)) core.push(`${bare}?v=${v}`);
  }
  return core;
}

function renderCore(core) {
  return 'const CORE = [\n' + core.map((e) => `  '${e}',`).join('\n') + '\n];';
}

function updateSw(swPath, core) {
  let text = fs.readFileSync(swPath, 'utf8');
  const next = renderCore(core);
  if (!/const CORE = \[([\s\S]*?)\n\];/.test(text)) throw new Error('Sin bloque CORE en ' + swPath);
  text = text.replace(/const CORE = \[([\s\S]*?)\n\];/, next);
  return text;
}

function bumpCache(text) {
  return text.replace(/const CACHE = 'cal13-v(\d+)-offline'/, (_, n) => `const CACHE = 'cal13-v${Number(n) + 1}-offline'`);
}

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const core = buildCore(html);
console.log(`Assets en index.html: ${core.length} entradas CORE (bare + vigente, sin historial).`);

for (const f of ['sw.js', 'web/sw.js']) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) { console.log('  ~ ' + f + ' no existe, se omite'); continue; }
  const old = fs.readFileSync(p, 'utf8');
  const oldCount = (old.match(/'\.\//g) || []).length;
  let next = updateSw(p, core);
  const changed = next !== old;
  console.log(`  ${changed ? 'x' : '='} ${f}: ${oldCount} -> ${core.length} entradas${changed ? '' : ' (sin cambios)'}`);
  if (changed && FIX) {
    next = bumpCache(next);
    fs.writeFileSync(p, next, 'utf8');
    console.log(`  + ${f} reescrito + CACHE bump.`);
  }
}
if (!FIX) console.log('\nEjecuta con --fix (npm run build:sw) para escribir los cambios.');
