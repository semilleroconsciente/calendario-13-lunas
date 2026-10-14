// tests/e2e-smoke.test.js — smoke E2E sin dependencias (P2-Cierre 2026-10-13).
//
// Levanta web/server.js real (puerto 8137, igual que perf-budget) y verifica
// de punta a punta lo que los checks estáticos no cubren: headers de
// seguridad servidos, negociación brotli/gzip, cableado P0+P1+P2
// (core-sanitize, renderer-territorio-vivo, preload, SEO) y defensas
// (traversal 403, 404, 405, HEAD). Corre en CI vía `node --test tests/*.test.js`.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const net = require('net');
const zlib = require('zlib');
const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 8137;
const BASE = `http://localhost:${PORT}`;
let srv = null;

function fetch(p, opts = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      BASE + p,
      { method: opts.method || 'GET', headers: opts.headers || {} },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(new Error('timeout ' + p)); });
    req.end();
  });
}

before(async () => {
  srv = spawn(process.execPath, [path.join(ROOT, 'web', 'server.js')], { stdio: 'pipe' });
  let listo = false;
  srv.stdout.on('data', (d) => { if (String(d).includes('Calendario web')) listo = true; });
  for (let i = 0; i < 100 && !listo; i++) await new Promise((r) => setTimeout(r, 100));
  assert.ok(listo, 'web/server.js no arrancó en 10s');
});

after(() => { try { srv && srv.kill(); } catch {} });

describe('e2e smoke (server real)', () => {
  it('GET / → 200 con cableado P0+P1+P2 + CSP estricta', async () => {
    const r = await fetch('/');
    assert.equal(r.status, 200);
    const html = r.body.toString('utf8');
    // P2-B: partición territorio-vivo cableada
    assert.ok(html.includes('min/renderer-territorio-vivo.min.js?v=1'), 'falta renderer-territorio-vivo');
    // P1: sanitize + SEO + preload
    assert.ok(html.includes('min/core-sanitize.min.js?v=1'), 'falta core-sanitize');
    assert.ok(html.includes('rel="preload"'), 'falta preload crítico');
    assert.ok(html.includes('og:title'), 'falta SEO og:*');
    assert.ok(html.includes('application/ld+json'), 'falta json-ld');
    // CSP servida: scripts sin unsafe-inline
    const csp = r.headers['content-security-policy'] || '';
    assert.ok(csp.includes("script-src 'self'"), 'CSP sin script-src self');
    assert.ok(!csp.includes("script-src 'self' 'unsafe-inline'"), 'CSP permite unsafe-inline en scripts');
  });

  it('headers de seguridad: SAMEORIGIN + nosniff + mic/cámara self', async () => {
    const r = await fetch('/index.html');
    assert.equal(r.status, 200);
    assert.equal(r.headers['x-frame-options'], 'SAMEORIGIN');
    assert.equal(r.headers['x-content-type-options'], 'nosniff');
    assert.ok((r.headers['permissions-policy'] || '').includes('microphone=(self)'), 'sin micrófono self');
    assert.ok((r.headers['permissions-policy'] || '').includes('camera=(self)'), 'sin cámara self');
  });

  it('brotli preferido + gzip como fallback (P2-C)', async () => {
    const br = await fetch('/min/cal.min.js', { headers: { 'accept-encoding': 'br' } });
    assert.equal(br.status, 200);
    assert.equal(br.headers['content-encoding'], 'br');
    const plain = zlib.brotliDecompressSync(br.body).toString('utf8');
    assert.ok(plain.length > 1000, 'brotli vacío');
    const gz = await fetch('/min/cal.min.js', { headers: { 'accept-encoding': 'gzip' } });
    assert.equal(gz.status, 200);
    assert.equal(gz.headers['content-encoding'], 'gzip');
  });

  it('sw.js + manifest + módulo nuevo descargables', async () => {
    const sw = await fetch('/sw.js');
    assert.equal(sw.status, 200);
    const swTxt = sw.body.toString('utf8');
    assert.ok(swTxt.includes('renderer-territorio-vivo.min.js?v=1'), 'SW sin módulo nuevo');
    assert.ok(/const CACHE = 'cal13-v\d+-offline'/.test(swTxt), 'SW sin CACHE versionado');
    const man = await fetch('/manifest.json');
    assert.equal(man.status, 200);
    assert.match(JSON.parse(man.body.toString('utf8')).name, /13 Lunas/);
    const mod = await fetch('/min/renderer-territorio-vivo.min.js?v=1');
    assert.equal(mod.status, 200);
    assert.ok(mod.body.toString('utf8').includes('setupBosqueDialog'), 'módulo nuevo incompleto');
  });

  it('defensas: traversal 403, ausente 404, POST 405, HEAD 200', async () => {
    // Socket crudo: el cliente http normaliza /../ y %2e%2e (spec WHATWG),
    // así que el traversal se prueba sin pasar por el parser de URL.
    const rawStatus = await new Promise((resolve, reject) => {
      const s = net.connect(PORT, 'localhost', () => s.write('GET /../package.json HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n'));
      let buf = '';
      s.on('data', (c) => { buf += c.toString('utf8'); });
      s.on('close', () => resolve(parseInt((buf.split(' ')[1] || '0'), 10)));
      s.on('error', reject);
      setTimeout(() => reject(new Error('timeout raw')), 10000);
    });
    assert.equal(rawStatus, 403);
    assert.equal((await fetch('/no-existe-xyz.html')).status, 404);
    assert.equal((await fetch('/', { method: 'POST' })).status, 405);
    const head = await fetch('/index.html', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.body.length, 0);
  });
});
