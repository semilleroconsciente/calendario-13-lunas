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
  const sec = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, sec); return res.end('Method Not Allowed');
  }
  let p = decodeURIComponent(req.url.split('?')[0]);
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
    if (compressible && acceptEnc.includes('gzip')) {
      headers['Content-Encoding'] = 'gzip';
      delete headers['Content-Length'];
      res.writeHead(200, headers);
      fs.createReadStream(file).pipe(zlib.createGzip()).pipe(res);
    } else {
      res.writeHead(200, headers);
      fs.createReadStream(file).pipe(res);
    }
  });
}).listen(8137, '0.0.0.0', () => console.log('Calendario web: http://localhost:8137  (seguro, gzip, anti-traversal)'));
