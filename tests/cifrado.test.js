'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { leerFuente } = require('./helpers.cjs');

function cargarCifrado() {
  const sb = { window: {}, globalThis: {}, TextEncoder, TextDecoder, crypto: require('node:crypto').webcrypto, atob: undefined, btoa: undefined, Buffer };
  sb.globalThis = sb;
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(leerFuente('core-cifrado.js'), sb, { filename: 'core-cifrado.js' });
  return sb.cal13cifrado || sb.window.cal13cifrado;
}

describe('cifrado opcional AES-GCM', () => {
  it('roundtrip: cifra y descifra', async () => {
    const c = cargarCifrado();
    const blob = await c.cifrarTexto('clave-test-123', '{"usuarios":[{"id":"u1"}]}');
    assert.ok(c.esCifrado(blob), 'debe llevar prefijo CAL13ENC1.');
    const pt = await c.descifrarTexto('clave-test-123', blob);
    assert.equal(pt, '{"usuarios":[{"id":"u1"}]}');
  });
  it('clave incorrecta se rechaza', async () => {
    const c = cargarCifrado();
    const blob = await c.cifrarTexto('correcta', '{}');
    await assert.rejects(() => c.descifrarTexto('otra', blob), /clave-incorrecta/);
  });
  it('no cifra dos veces (idempotencia por prefijo)', async () => {
    const c = cargarCifrado();
    const blob = await c.cifrarTexto('pw', '{}');
    assert.ok(c.esCifrado(blob));
    assert.ok(!c.esCifrado('{}'));
  });
});
