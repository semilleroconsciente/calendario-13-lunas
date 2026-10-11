// perf-budget.cjs — presupuesto de performance en CI (mejora: <3s en 4G).
//
// Arranca web/server.js, descarga index.html + todo el JS/CSS que carga el
// navegador (defer + MODS de boot-modulos.js) y falla si se supera el
// presupuesto. Sin dependencias: es el gate de CI (npm run check:perf).
//
// Lighthouse (manual, no CI): con el server arriba,
//   npx -y lighthouse http://localhost:8137/ --only-categories=performance \
//     --throttling-method=simulate --form-factor=mobile \
//     --throttling.cpuSlowdownMultiplier=4 --output=json
// Meta: performance ≥ 80 en móvil simulado, LCP < 3s en 4G.
// El presupuesto de abajo es el correlato estático de esa meta.
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 8137;
const BASE = `http://localhost:${PORT}`;

// Presupuesto: holgura ~15% sobre lo medido hoy (index 29K, JS ~4825K raw,
// CSS ~95K, gzip total ~1530K, TTFB local ~5ms). Si un cambio lo supera, la
// respuesta es partir/diferir (ver docs/arquitectura.md), no subir el techo.
const BUDGET = {
  'index.html KB': 60,
  'JS total raw KB': 5200,
  'CSS total raw KB': 120,
  'gzip total KB': 1700,
  'TTFB index ms': 500,
  'entradas SW CORE': 300,
};

function get(p, gzip) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const req = http.get(BASE + p, gzip ? { headers: { 'accept-encoding': 'gzip' } } : {}, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, bytes: Buffer.concat(chunks).length, ms: Date.now() - t0 }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(new Error('timeout ' + p)); });
  });
}

async function main() {
  const srv = spawn(process.execPath, [path.join(ROOT, 'web', 'server.js')], { stdio: 'pipe' });
  let listo = false;
  srv.stdout.on('data', (d) => { if (String(d).includes('Calendario web')) listo = true; });
  for (let i = 0; i < 100 && !listo; i++) await new Promise((r) => setTimeout(r, 100));
  if (!listo) { srv.kill(); console.log('  x server.js no arrancó'); process.exit(1); }
  const fail = [];
  const check = (nombre, valor, max) => {
    const ok = valor <= max;
    if (!ok) fail.push(`${nombre}: ${valor} > presupuesto ${max}`);
    console.log(`  ${ok ? '=' : 'x'} ${nombre}: ${valor} (techo ${max})`);
  };
  try {
    const idx = await get('/index.html', false);
    if (idx.status !== 200) throw new Error('index.html HTTP ' + idx.status);
    check('TTFB index ms', idx.ms, BUDGET['TTFB index ms']);
    check('index.html KB', Math.round(idx.bytes / 1024), BUDGET['index.html KB']);

    // Re-descarga el HTML como texto para extraer assets (fetch crudo).
    const html = await new Promise((resolve, reject) => {
      http.get(BASE + '/index.html', (res) => {
        const c = [];
        res.on('data', (x) => c.push(x));
        res.on('end', () => resolve(Buffer.concat(c).toString('utf8')));
        res.on('error', reject);
      }).on('error', reject);
    });
    const assets = new Set();
    for (const m of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))(?:\?v=\d+)?"/g)) assets.add('/' + m[1]);
    try {
      const boot = await new Promise((resolve, reject) => {
        http.get(BASE + '/boot-modulos.js', (res) => {
          const c = [];
          res.on('data', (x) => c.push(x));
          res.on('end', () => resolve(Buffer.concat(c).toString('utf8')));
          res.on('error', reject);
        }).on('error', reject);
      });
      const mods = boot.match(/var MODS = \[([\s\S]*?)\];/);
      if (mods) for (const m of mods[1].matchAll(/'([^']+\.(?:js|css))(?:\?v=\d+)?'/g)) assets.add('/' + m[1]);
    } catch {}
    let jsRaw = 0, cssRaw = 0, gzipTotal = 0, mal = 0;
    for (const a of assets) {
      try {
        const r = await get(a.split('?')[0], false);
        if (r.status !== 200) { mal++; console.log(`  x HTTP ${r.status}: ${a}`); continue; }
        if (a.endsWith('.js')) jsRaw += r.bytes; else cssRaw += r.bytes;
        const g = await get(a.split('?')[0], true);
        gzipTotal += g.bytes;
      } catch (e) { mal++; console.log(`  x fetch ${a}: ${e.message}`); }
    }
    if (mal) fail.push(`${mal} asset(s) no descargables desde server.js`);
    console.log(`  i assets: ${assets.size} (${[...assets].filter((a) => a.includes('/min/')).length} minificados)`);
    check('JS total raw KB', Math.round(jsRaw / 1024), BUDGET['JS total raw KB']);
    check('CSS total raw KB', Math.round(cssRaw / 1024), BUDGET['CSS total raw KB']);
    check('gzip total KB', Math.round(gzipTotal / 1024), BUDGET['gzip total KB']);

    const sw = await new Promise((resolve, reject) => {
      http.get(BASE + '/sw.js', (res) => {
        const c = [];
        res.on('data', (x) => c.push(x));
        res.on('end', () => resolve(Buffer.concat(c).toString('utf8')));
        res.on('error', reject);
      }).on('error', reject);
    });
    check('entradas SW CORE', (sw.match(/'\.\//g) || []).length, BUDGET['entradas SW CORE']);
  } finally {
    srv.kill();
  }
  if (fail.length) {
    console.log('\nPresupuesto superado:\n  x ' + fail.join('\n  x '));
    process.exit(1);
  }
  console.log('OK: presupuesto de performance bajo techo.');
}

main().catch((e) => { console.log('  x perf-budget: ' + e.message); process.exit(1); });
