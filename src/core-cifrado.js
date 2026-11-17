// core-cifrado.js — cifrado opcional AES-GCM con contraseña (WebCrypto).
// Formato at-rest: "CAL13ENC1." + base64url(JSON {alg,salt,iv,data}).
// La clave solo vive en memoria (window.cal13cifradoClave). Sin clave no se
// puede leer ni sobrescribir un blob cifrado (bloqueo de guardado).
(function () {
  'use strict';
  var PREFIJO = 'CAL13ENC1.';
  var _clave = null; // CryptoKey en memoria

  function b64e(buf) {
    var b = new Uint8Array(buf);
    var s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    try {
      if (typeof btoa !== 'undefined') return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {}
    try { if (typeof Buffer !== 'undefined') return Buffer.from(b).toString('base64url'); } catch (e2) {}
    return '';
  }
  function b64d(s) {
    s = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    try {
      if (typeof atob !== 'undefined') {
        var bin = atob(s);
        var u = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        return u;
      }
    } catch (e) {}
    try { if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(s, 'base64')); } catch (e2) {}
    throw new Error('b64');
  }
  function cryptoSubtle() {
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) return crypto.subtle;
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) return window.crypto.subtle;
    } catch (e) {}
    try {
      // Node 19+: webcrypto global.
      var nc = null;
      try { nc = require('node:crypto'); } catch (e2) {}
      if (nc && nc.webcrypto && nc.webcrypto.subtle) return nc.webcrypto.subtle;
    } catch (e3) {}
    return null;
  }
  async function derivar(password, salt) {
    var sub = cryptoSubtle();
    if (!sub) throw new Error('sin-webcrypto');
    var enc = new TextEncoder().encode(String(password || ''));
    var base = await sub.importKey('raw', enc, 'PBKDF2', false, ['deriveKey']);
    return sub.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  function esCifrado(s) { return typeof s === 'string' && s.indexOf(PREFIJO) === 0; }
  async function cifrarTexto(password, texto) {
    var sub = cryptoSubtle();
    if (!sub) throw new Error('sin-webcrypto');
    var salt = new Uint8Array(16);
    var iv = new Uint8Array(12);
    try {
      var rnd = (typeof crypto !== 'undefined' && crypto.getRandomValues) ? crypto : null;
      if (rnd) { rnd.getRandomValues(salt); rnd.getRandomValues(iv); }
      else throw 0;
    } catch (e) {
      try {
        var nc2 = require('node:crypto');
        var rs = nc2.randomBytes(28);
        salt.set(rs.subarray(0, 16)); iv.set(rs.subarray(16, 28));
      } catch (e2) { throw new Error('sin-azar'); }
    }
    var key = await derivar(password, salt);
    var ct = await sub.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(String(texto || '')));
    var sobre = { alg: 'AES-GCM-256-PBKDF2-100k', salt: b64e(salt), iv: b64e(iv), data: b64e(ct) };
    var json = JSON.stringify(sobre);
    var b64 = '';
    try { b64 = b64e(new TextEncoder().encode(json)); } catch (e3) { b64 = ''; }
    if (!b64) throw new Error('cifrado');
    return PREFIJO + b64;
  }
  async function descifrarTexto(password, blob) {
    if (!esCifrado(blob)) throw new Error('no-cifrado');
    var sub = cryptoSubtle();
    if (!sub) throw new Error('sin-webcrypto');
    var json = '';
    try { json = new TextDecoder().decode(b64d(String(blob).slice(PREFIJO.length))); } catch (e) { throw new Error('cifrado-corrupto'); }
    var sobre;
    try { sobre = JSON.parse(json); } catch (e2) { throw new Error('cifrado-corrupto'); }
    if (!sobre || !sobre.salt || !sobre.iv || !sobre.data) throw new Error('cifrado-corrupto');
    var key = await derivar(password, b64d(sobre.salt));
    try {
      var pt = await sub.decrypt({ name: 'AES-GCM', iv: b64d(sobre.iv) }, key, b64d(sobre.data));
      return new TextDecoder().decode(pt);
    } catch (e3) { throw new Error('clave-incorrecta'); }
  }
  var api = {
    PREFIJO: PREFIJO,
    esCifrado: esCifrado,
    cifrarTexto: cifrarTexto,
    descifrarTexto: descifrarTexto,
    hayClave: function () { return _clave !== null; },
    fijarClave: function (pw) { _clave = String(pw || ''); },
    limpiarClave: function () { _clave = null; },
    clave: function () { return _clave; }
  };
  try {
    if (typeof window !== 'undefined') window.cal13cifrado = api;
    if (typeof globalThis !== 'undefined' && !globalThis.cal13cifrado) globalThis.cal13cifrado = api;
  } catch (e) {}
})();
