/* ============================================================
   QR-CODEC — Calendario 13 Lunas (traspaso PC <-> celular)
   Codec PURO (sin DOM): JSON -> gzip -> base64 -> trozos QR,
   y el camino inverso. Expone Cal13QRcodec en window (browser)
   y en globalThis (Node, para tests). Todo local, sin red.
   Formato de trozo:  MAGIC.SID.I.N.PAYLOAD
     MAGIC  = C13QG1 (gzip) | C13QR1 (crudo, fallback)
     SID    = id de sesion aleatorio (4 base36) para no mezclar envios
     I/N    = indice 1-based y total (enteros)
     PAYLOAD= base64 (sin puntos, por eso el separador es '.')
   ============================================================ */
(function (g) {
'use strict';

var MAGIC_GZ = 'C13QG1';
var MAGIC_RAW = 'C13QR1';
var CHUNK_PAYLOAD = 900; // caracteres base64 por QR (EC M, legible en pantalla)

function utf8ToBytes(s) { return new TextEncoder().encode(s); }
function bytesToUtf8(b) { return new TextDecoder('utf-8').decode(b); }

function bytesToB64(bytes) {
  var bin = '';
  var CH = 0x8000;
  for (var i = 0; i < bytes.length; i += CH) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CH, bytes.length)));
  }
  return btoa(bin);
}
function b64ToBytes(b64) {
  var bin = atob(b64);
  var out = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function hasGzip() {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined' &&
    typeof Blob !== 'undefined' && typeof Response !== 'undefined';
}
async function gzipBytes(bytes) {
  var stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function gunzipBytes(bytes) {
  var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function makeSession() {
  var s = '';
  for (var i = 0; i < 4; i++) s += Math.floor(Math.random() * 36).toString(36);
  return s;
}

/* JSON string -> { sid, magic, total, chunks[], rawBytes } */
async function encodeBackup(jsonStr, chunkPayloadSize) {
  var size = chunkPayloadSize || CHUNK_PAYLOAD;
  var raw = utf8ToBytes(String(jsonStr));
  var magic, payload;
  if (hasGzip()) {
    try { payload = bytesToB64(await gzipBytes(raw)); magic = MAGIC_GZ; }
    catch (e) { payload = bytesToB64(raw); magic = MAGIC_RAW; }
  } else {
    payload = bytesToB64(raw); magic = MAGIC_RAW;
  }
  var sid = makeSession();
  var n = Math.max(1, Math.ceil(payload.length / size));
  var chunks = [];
  for (var i = 0; i < n; i++) {
    chunks.push(magic + '.' + sid + '.' + (i + 1) + '.' + n + '.' + payload.slice(i * size, (i + 1) * size));
  }
  return { sid: sid, magic: magic, total: n, chunks: chunks, rawBytes: raw.length };
}

/* string -> { magic, sid, i, n, payload } | null */
function parseChunk(str) {
  if (typeof str !== 'string') return null;
  var parts = str.split('.');
  if (parts.length !== 5) return null;
  var magic = parts[0], sid = parts[1], i = parseInt(parts[2], 10), n = parseInt(parts[3], 10), payload = parts[4];
  if (magic !== MAGIC_GZ && magic !== MAGIC_RAW) return null;
  if (!/^[a-z0-9]{4}$/.test(sid)) return null;
  if (!isFinite(i) || !isFinite(n) || i < 1 || n < 1 || i > n || n > 999) return null;
  if (!payload || !/^[A-Za-z0-9+/=]+$/.test(payload)) return null;
  return { magic: magic, sid: sid, i: i, n: n, payload: payload };
}

/* (string[] | Map index->payload + meta) -> Promise<jsonStr>
   Acepta trozos en cualquier orden; exige misma sesion/magic y todos los indices. */
async function decodeChunks(chunkStrings) {
  var list = (chunkStrings || []).map(parseChunk).filter(Boolean);
  if (!list.length) throw new Error('sin-trozos');
  var sid = list[0].sid, magic = list[0].magic, n = list[0].n;
  for (var k = 0; k < list.length; k++) {
    if (list[k].sid !== sid) throw new Error('sesion-mixta');
    if (list[k].n !== n) throw new Error('total-mixto');
  }
  var byIdx = {};
  for (var j = 0; j < list.length; j++) byIdx[list[j].i] = list[j].payload;
  var payload = '';
  for (var i = 1; i <= n; i++) {
    if (!byIdx[i]) throw new Error('falta-' + i);
    payload += byIdx[i];
  }
  var bytes;
  try { bytes = b64ToBytes(payload); } catch (e) { throw new Error('base64'); }
  if (magic === MAGIC_GZ) {
    try { bytes = await gunzipBytes(bytes); } catch (e2) { throw new Error('gzip'); }
  }
  return bytesToUtf8(bytes);
}

var api = {
  MAGIC_GZ: MAGIC_GZ,
  MAGIC_RAW: MAGIC_RAW,
  CHUNK_PAYLOAD: CHUNK_PAYLOAD,
  encodeBackup: encodeBackup,
  parseChunk: parseChunk,
  decodeChunks: decodeChunks,
  hasGzip: hasGzip
};
if (typeof window !== 'undefined') window.Cal13QRcodec = api;
g.Cal13QRcodec = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
