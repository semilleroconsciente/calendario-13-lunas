const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
};

function isSafe(p) {
  const resolved = path.resolve(root, '.' + p);
  return resolved === root || resolved.startsWith(root + path.sep);
}

http.createServer((req, res) => {
  // headers de seguridad
  // CSP fase 1: index.html ya no tiene <script> ni <style> inline
  // (splash.css, boot-modulos.js, sw-registro.js son archivos externos),
  // asi que script-src es 'self' estricto. style-src conserva
  // 'unsafe-inline' por los ~1500 style="..." del HTML (fase 2).
  // connect-src limita la red a open-meteo + respaldo TTS online (translate.google.com). Ver _headers (mismo valor).
  const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob: https://translate.google.com; font-src 'self'; connect-src 'self' https://api.open-meteo.com https://air-quality-api.open-meteo.com https://translate.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests";
  const sec = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': CSP,
    // microfono/camara en (self): los usan Voz de los Abuelos (audio) y QR-sync (video).
    'Permissions-Policy': 'geolocation=(), microphone=(self), camera=(self)',
    // Aislamiento: la app no necesita popups cross-origin ni recursos externos.
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Permitted-Cross-Domain-Policies': 'none'
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, sec); return res.end('Method Not Allowed');
  }
  let raw = (req.url || '/').split('?')[0];
  let p;
  try { p = decodeURIComponent(raw); }
  catch { res.writeHead(400, sec); return res.end('Bad Request'); }
  if (p === '/') p = '/index.html';
  // bloquear traversal y query raro
  if (!isSafe(p) || p.includes('\0')) { res.writeHead(403, sec); return res.end('Forbidden'); }
  const file = path.resolve(root, '.' + p);
  const ext = path.extname(file).toLowerCase();
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404, sec); return res.end('No encontrado'); }
    // caché: html no caché, assets 1 día
    const isHtml = ext === '.html' || p === '/index.html';
    const headers = {
      ...sec,
      'Content-Type': mime[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': isHtml ? 'no-cache, no-store, must-revalidate' : 'public, max-age=86400',
      'ETag': `"${stat.size}-${stat.mtimeMs.toString(36)}"`,
      'Last-Modified': stat.mtime.toUTCString()
    };
    if (req.headers['if-none-match'] === headers['ETag']) { res.writeHead(304, headers); return res.end(); }
    if (req.method === 'HEAD') { res.writeHead(200, headers); return res.end(); }
    const acceptEnc = req.headers['accept-encoding'] || '';
    const compressible = ['.html','.css','.js','.json','.svg'].includes(ext);
    // P2-C: prefiere brotli (más denso que gzip) si el cliente lo acepta.
    if (compressible && acceptEnc.includes('br')) {
      headers['Content-Encoding'] = 'br';
      delete headers['Content-Length'];
      res.writeHead(200, headers);
      fs.createReadStream(file).pipe(zlib.createBrotliCompress()).pipe(res);
    } else if (compressible && acceptEnc.includes('gzip')) {
      headers['Content-Encoding'] = 'gzip';
      delete headers['Content-Length'];
      res.writeHead(200, headers);
      fs.createReadStream(file).pipe(zlib.createGzip()).pipe(res);
    } else {
      res.writeHead(200, headers);
      fs.createReadStream(file).pipe(res);
    }
  });
}).listen(8137, '127.0.0.1', () => console.log('Calendario web: http://localhost:8137  (solo local, brotli+gzip, anti-traversal)'));
