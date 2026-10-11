// sync-web.cjs — mantiene web/ (copia desplegable) en sincronia con la raiz.
//
// Compara cada archivo presente en AMBOS arboles (raiz <-> web/) y reporta
// diferencias. Con --fix copia raiz -> web. Direccion unica: la raiz manda.
//
// - No borra archivos solo-web (server.js, LEEME.txt, _headers, ...).
// - No copia archivos solo-raiz (main.js, preload.js, electron, ...).
// - Nunca toca donate.json (puede contener links reales; esta en .gitignore).
//
// Uso:
//   node scripts/sync-web.cjs         -> solo verifica (exit 1 si hay deriva)
//   node scripts/sync-web.cjs --fix   -> copia los archivos divergentes
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WEB = path.join(ROOT, 'web');
const FIX = process.argv.includes('--fix');

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist-empaquetado', 'android', '.vscode']);
const SKIP_FILES = new Set(['donate.json']);

function walk(dir, base) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      out.push(...walk(path.join(dir, e.name), base + e.name + '/'));
    } else if (e.isFile()) {
      if (SKIP_FILES.has(e.name)) continue;
      out.push(base + e.name);
    }
  }
  return out;
}

const rootFiles = new Set(walk(ROOT, ''));
const webFiles = new Set(walk(WEB, ''));
const shared = [...rootFiles].filter((f) => webFiles.has(f) && !f.startsWith('web/'));
const rootOnly = [...rootFiles].filter((f) => !webFiles.has(f) && !f.startsWith('web/'));
const webOnly = [...webFiles].filter((f) => !rootFiles.has(f));

const drift = [];
for (const f of shared.sort()) {
  const a = fs.readFileSync(path.join(ROOT, f));
  const b = fs.readFileSync(path.join(WEB, f));
  if (!a.equals(b)) drift.push(f);
}

console.log(`Archivos compartidos: ${shared.length} | solo-raiz: ${rootOnly.length} | solo-web: ${webOnly.length}`);
if (webOnly.length) console.log('  solo-web (se respetan): ' + webOnly.slice(0, 12).join(', ') + (webOnly.length > 12 ? ` ...(+${webOnly.length - 12})` : ''));

// Archivos nuevos solo-raiz que la web necesita: cada .js/.css de la raíz
// (referenciado por index.html o precacheado en sw.js) debe existir en web/.
// Se excluyen los solo-Electron (main.js, preload.js) y config nativa.
const ELECTRON_ONLY = new Set(['main.js', 'preload.js', 'capacitor.config.js']);
const WEB_EXT = ['.js', '.css'];
const needInWeb = rootOnly.filter((f) => {
  if (ELECTRON_ONLY.has(f) || f.startsWith('docs/') || f.startsWith('scripts/')) return false;
  if (f === '_headers' || f === 'manifest.json') return true;
  // min/ (salida de build:min) sí se despliega en web/ para PWA y Android.
  if (f.startsWith('min/')) return WEB_EXT.includes(path.extname(f)) || f.endsWith('.hashes.json');
  // templates/*.html: fuentes de diálogos; el bundle las embebe, pero el
  // fetch de respaldo de cal13tpl.asegurar() las necesita en web/.
  if (f.startsWith('templates/') && f.endsWith('.html')) return true;
  // screenshots/*.png del manifest (capturas reales, ver captura-screenshots).
  if (f.startsWith('screenshots/') && f.endsWith('.png')) return true;
  if (f.includes('/')) return false;
  return WEB_EXT.includes(path.extname(f));
});

if (!drift.length && !needInWeb.length) {
  console.log('OK: web/ esta en sincronia con la raiz.');
  process.exit(0);
}

console.log('Deriva (difieren entre raiz y web/):');
for (const f of drift) console.log('  x ' + f);
for (const f of needInWeb) console.log('  + nuevo para web/: ' + f);

if (!FIX) {
  console.log('\nEjecuta con --fix para copiar raiz -> web/.');
  process.exit(1);
}
for (const f of drift) {
  fs.mkdirSync(path.dirname(path.join(WEB, f)), { recursive: true });
  fs.copyFileSync(path.join(ROOT, f), path.join(WEB, f));
}
console.log(`  + ${drift.length} archivos copiados raiz -> web/.`);
if (needInWeb.length) {
  for (const f of needInWeb) {
    fs.mkdirSync(path.dirname(path.join(WEB, f)), { recursive: true });
    fs.copyFileSync(path.join(ROOT, f), path.join(WEB, f));
  }
  console.log(`  + ${needInWeb.length} archivos nuevos propagados a web/: ${needInWeb.join(', ')}`);
}
