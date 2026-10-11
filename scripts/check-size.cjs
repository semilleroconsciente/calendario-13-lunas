// check-size.cjs — guardián contra el monolito (mejoras #1, #2, #20).
// Falla si renderer.js / nuevos-modulos.js / index.html superan el techo:
// el remedio es partir el archivo, no subir el techo.
// Uso: node scripts/check-size.cjs  (incluido en npm test vía check:syntax? no: corre solo)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const LIMITS = {
  'renderer.js': 1150 * 1024,
  'nuevos-modulos.js': 450 * 1024,
  'index.html': 450 * 1024,
  'styles.css': 150 * 1024,
};
let fail = 0;
for (const [f, max] of Object.entries(LIMITS)) {
  try {
    const kb = fs.statSync(path.join(ROOT, f)).size;
    const ok = kb <= max;
    if (!ok) fail = 1;
    console.log(`  ${ok ? '=' : 'x'} ${f}: ${Math.round(kb / 1024)} KB (techo ${Math.round(max / 1024)} KB)`);
  } catch (e) { console.log(`  ~ ${f}: no encontrado`); }
}
if (fail) {
  console.log('Techo superado: partir el archivo en módulos (ver docs/arquitectura.md), no subir el techo.');
  process.exit(1);
}
console.log('OK: tamaños bajo techo.');
