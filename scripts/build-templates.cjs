// build-templates.cjs — diálogos index.html → templates/*.html + bundle.
//
// Fuente de verdad: templates/<dialogId>.html (un archivo por diálogo).
// Genera templates-bundled.js (commiteado, minificado por build:min):
//   window.cal13tpl = { ids, inyectar(id), inyectarTodos(), asegurar(id) }
// index.html ya NO trae <dialog> inline (ahorra ~380 KB, techo check-size).
//
// Runtime: inyección EAGER al cargar (misma semántica que antes: los
// diálogos existen antes de que renderer.js y los módulos los busquen,
// incluso con caches a top-level). `asegurar(id)` permite migración a
// lazy por diálogo: si el bundle no lo trae, hace fetch templates/<id>.html
// (solo web http(s); en file:// el bundle siempre responde).
//
//   node scripts/build-templates.cjs --fix    -> extrae (1ª vez) + regenera bundle
//   node scripts/build-templates.cjs --check  -> falla si bundle desactualizado
//   npm run build:tpl / check:tpl
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TPLDIR = path.join(ROOT, 'templates');
const BUNDLE = path.join(ROOT, 'templates-bundled.js');
const MODE = process.argv.includes('--check') ? 'check' : 'fix';

function leerTemplates() {
  const map = new Map();
  if (!fs.existsSync(TPLDIR)) return map;
  for (const f of fs.readdirSync(TPLDIR).sort()) {
    if (!f.endsWith('.html')) continue;
    const id = f.replace(/\.html$/, '');
    map.set(id, fs.readFileSync(path.join(TPLDIR, f), 'utf8'));
  }
  return map;
}

// 1ª vez / rescate: extrae los <dialog id> que aún queden en index.html.
function extraerDeIndex() {
  const p = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(p, 'utf8');
  const re = /<dialog\b[^>]*\bid="([^"]+)"[^>]*>[\s\S]*?<\/dialog>/g;
  let m, n = 0;
  const ids = [];
  while ((m = re.exec(html))) {
    const id = m[1];
    if (!/^[A-Za-z0-9_-]+$/.test(id)) { console.log(`  x id inválido para archivo: ${id} (se deja inline)`); continue; }
    ids.push({ id, block: m[0] });
  }
  if (!ids.length) return 0;
  if (MODE === 'check') {
    console.log(`templates/: ${ids.length} diálogo(s) aún inline en index.html (falta extraer):\n  x ` + ids.map((x) => '#' + x.id).join('\n  x '));
    process.exit(1);
  }
  fs.mkdirSync(TPLDIR, { recursive: true });
  for (const { id, block } of ids) {
    const dest = path.join(TPLDIR, id + '.html');
    if (!fs.existsSync(dest)) { fs.writeFileSync(dest, block + '\n', 'utf8'); n++; }
  }
  // Quita los bloques extraídos de index.html (solo los que se guardaron).
  html = html.replace(re, (bloque, id) => {
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return bloque;
    const dest = path.join(TPLDIR, id + '.html');
    return fs.existsSync(dest) ? '' : bloque;
  });
  html = html.replace(/\n{3,}/g, '\n\n');
  // Marca el punto de inyección para quien lea el HTML.
  if (!html.includes('id="dlgHost"')) {
    html = html.replace('</body>', '  <!-- Diálogos: inyectados por templates-bundled.js (templates/*.html). Ver scripts/build-templates.cjs -->\n  <div id="dlgHost" aria-hidden="false"></div>\n</body>');
  }
  fs.writeFileSync(p, html, 'utf8');
  return n;
}

function jsString(s) {
  // U+2028/2029 son validos en JSON pero no en literales JS pre-ES2019.
  return JSON.stringify(s)
    .split(String.fromCharCode(8232)).join("\\u2028")
    .split(String.fromCharCode(8233)).join("\\u2029");
}

function generarBundle(map) {
  const entradas = [...map.entries()].map(([id, block]) => {
    if (block.includes('</script')) throw new Error(`templates/${id}.html contiene </script> (rompería el bundle)`);
    return `    ${JSON.stringify(id)}: ${jsString(block)}`;
  });
  return `// templates-bundled.js — AUTO-GENERADO por scripts/build-templates.cjs. No editar a mano.
// Fuente: templates/*.html (${map.size} diálogos). Inyección eager al cargar
// (misma semántica que el index.html monolítico) + asegurar(id) lazy con
// fetch de respaldo (solo web http(s)).
(function () {
  'use strict';
  var HTML = {
${entradas.join(',\n')}
  };
  var inyectados = {};
  function host() {
    var h = document.getElementById('dlgHost');
    if (!h) {
      h = document.createElement('div');
      h.id = 'dlgHost';
      try { document.body.appendChild(h); } catch (e) {}
    }
    return h;
  }
  function inyectar(id) {
    try {
      if (inyectados[id]) return document.getElementById(id);
      var html = HTML[id];
      if (html == null) return null;
      var t = document.createElement('template');
      t.innerHTML = html;
      var dlg = t.content.firstElementChild;
      if (!dlg) return null;
      host().appendChild(dlg);
      inyectados[id] = true;
      return dlg;
    } catch (e) { return null; }
  }
  function inyectarTodos() {
    for (const id of Object.keys(HTML)) inyectar(id);
  }
  function asegurar(id) {
    // Lazy: si ya está (bundle o inyectado), resuelve directo; si no,
    // intenta fetch del template suelto (solo http(s), no file://).
    try {
      var d = document.getElementById(id);
      if (d) return Promise.resolve(d);
      d = inyectar(id);
      if (d) return Promise.resolve(d);
      if (/^https?:$/.test(location.protocol)) {
        return fetch('templates/' + encodeURIComponent(id) + '.html', { cache: 'force-cache' })
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
          .then(function (html) {
            var t = document.createElement('template');
            t.innerHTML = html;
            var dlg = t.content.firstElementChild;
            if (dlg) { host().appendChild(dlg); inyectados[id] = true; }
            return dlg;
          })
          .catch(function () { return null; });
      }
    } catch (e) {}
    return Promise.resolve(null);
  }
  function arrancar() { try { inyectarTodos(); } catch (e) {} }
  try {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
    else arrancar();
  } catch (e) {}
  window.cal13tpl = { ids: Object.keys(HTML), inyectar: inyectar, inyectarTodos: inyectarTodos, asegurar: asegurar };
})();
`;
}

const extraidos = extraerDeIndex();
const map = leerTemplates();
if (!map.size) { console.log('templates/: vacío y nada que extraer.'); process.exit(0); }
let bundle;
try {
  bundle = generarBundle(map);
} catch (e) {
  console.log('  x ' + e.message);
  process.exit(1);
}

if (MODE === 'check') {
  const actual = fs.existsSync(BUNDLE) ? fs.readFileSync(BUNDLE, 'utf8') : null;
  if (actual !== bundle) {
    console.log('templates-bundled.js desactualizado respecto a templates/*.html. Ejecuta npm run build:tpl.');
    process.exit(1);
  }
  console.log(`OK: templates-bundled.js al día (${map.size} diálogos).`);
  process.exit(0);
}

fs.writeFileSync(BUNDLE, bundle, 'utf8');
console.log(`templates: ${extraidos} extraídos de index.html + bundle con ${map.size} diálogos.`);
