// check-donate.cjs — valida donate.json contra donate.example.json.
// Las 4 claves que lee el renderer: mercadopago, paypal, flow, kofi.
// Uso: node scripts/check-donate.cjs  (exit 1 si falta clave o JSON inválido)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const KEYS = ['mercadopago', 'paypal', 'flow', 'kofi'];

function load(f) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')); }
  catch (e) { console.log(`  x ${f}: ${e.message}`); process.exit(1); }
}
const ex = load('donate.example.json');
let fail = 0;
for (const k of KEYS) {
  if (!(k in ex)) { console.log(`  x donate.example.json: falta clave "${k}"`); fail = 1; }
}
let real = null;
try { real = JSON.parse(fs.readFileSync(path.join(ROOT, 'donate.json'), 'utf8')); }
catch { console.log('  ~ donate.json ausente o gitignorado (ok en desarrollo, se usa {} offline)'); }
if (real) {
  for (const k of KEYS) {
    if (!(k in real)) { console.log(`  x donate.json: falta clave "${k}"`); fail = 1; }
  }
  for (const k of Object.keys(real)) {
    if (!KEYS.includes(k)) console.log(`  ~ donate.json: clave extra "${k}" (se ignora)`);
  }
}
if (fail) process.exit(1);
console.log('OK: donate (claves mercadopago, paypal, flow, kofi).');
