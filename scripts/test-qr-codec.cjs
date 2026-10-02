// Test round-trip de qr-codec.js: JSON -> chunks QR -> JSON
// Uso: node scripts/test-qr-codec.cjs
const path = require('path');
const ROOT = path.join(__dirname, '..');

(async () => {
  require(path.join(ROOT, 'qr-codec.js'));
  const C = globalThis.Cal13QRcodec;
  if (!C) { console.log('FALLO: Cal13QRcodec no expuesto'); process.exit(1); }

  // 1) DATA realista de ~50 KB (multi-usuario con ciclos, notas, habitos)
  const big = { usuarios: [], notas: {}, actual: 'u1', config: { visible: {}, recordar: true } };
  for (let u = 0; u < 3; u++) {
    const uid = 'u' + (u + 1);
    big.usuarios.push({ id: uid, nombre: 'Usuario ' + (u + 1) + ' áéíóú ñ' });
    const cycles = {};
    for (let y = 2024; y <= 2025; y++) {
      const moons = {};
      for (let m = 1; m <= 13; m++) {
        const days = {};
        for (let d = 1; d <= 28; d++) {
          days[d] = {
            nota: 'Nota del día ' + d + ' luna ' + m + ' — siembra, marea, gratitud y sueños. Küla küyen 🌕'.repeat(2),
            animo: (d % 5), agenda: [{ time: '08:30', text: 'Huerta y compost', notify: true }]
          };
        }
        moons[m] = { monthNote: 'Resumen luna ' + m, days };
      }
      cycles[y] = { moons, dft: { nota: 'Día fuera del tiempo ' + y } };
    }
    big.notas[uid] = { cycles };
  }
  const json = JSON.stringify(big);
  console.log('JSON de prueba:', json.length, 'caracteres');

  // 2) encode
  const enc = await C.encodeBackup(json);
  console.log('magic:', enc.magic, '| total trozos:', enc.total, '| rawBytes:', enc.rawBytes);
  if (enc.total < 2) { console.log('AVISO: solo 1 trozo, prueba de reensamblado debil'); }
  enc.chunks.forEach((c, k) => {
    const p = C.parseChunk(c);
    if (!p || p.i !== k + 1 || p.n !== enc.total || p.sid !== enc.sid) {
      console.log('FALLO parseChunk en trozo', k + 1); process.exit(1);
    }
    if (c.length > 1100) { console.log('FALLO: trozo muy grande para QR:', c.length); process.exit(1); }
  });
  console.log('parseChunk OK en', enc.total, 'trozos (max', Math.max(...enc.chunks.map(c => c.length)), 'chars)');

  // 3) decode en orden mezclado
  const shuffled = enc.chunks.slice().reverse();
  const back = await C.decodeChunks(shuffled);
  if (back !== json) { console.log('FALLO: JSON reensamblado difiere'); process.exit(1); }
  console.log('Round-trip OK (orden mezclado) —', back.length, 'caracteres identicos');

  // 4) falta un trozo -> debe fallar con 'falta-N'
  try {
    await C.decodeChunks(enc.chunks.slice(1));
    console.log('FALLO: no detecto trozo faltante'); process.exit(1);
  } catch (e) {
    if (!String(e.message).startsWith('falta-')) { console.log('FALLO: error inesperado:', e.message); process.exit(1); }
    console.log('Deteccion de trozo faltante OK (' + e.message + ')');
  }

  // 5) trozo corrupto -> parseChunk null / decode error
  const corrupt = enc.chunks[0].slice(0, -3) + '##';
  if (C.parseChunk(corrupt) !== null) { console.log('FALLO: acepto trozo corrupto'); process.exit(1); }
  console.log('Rechazo de trozo corrupto OK');

  // 6) JSON pequeno (1 solo QR)
  const small = await C.encodeBackup(JSON.stringify({ usuarios: [{ id: 'a', nombre: 'A' }], notas: { a: { cycles: {} } }, actual: 'a' }));
  if (small.total !== 1) { console.log('FALLO: JSON pequeno deberia ser 1 trozo, es', small.total); process.exit(1); }
  const smallBack = await C.decodeChunks(small.chunks);
  if (JSON.parse(smallBack).actual !== 'a') { console.log('FALLO round-trip pequeno'); process.exit(1); }
  console.log('Round-trip de 1 solo QR OK');

  console.log('\nTODO OK — gzip:', C.hasGzip() ? 'disponible' : 'NO (fallback crudo)');
})().catch(e => { console.log('FALLO inesperado:', e); process.exit(1); });
