// check-size.cjs — guardián contra el monolito (mejoras #1, #2, #20).
// Falla si renderer.js / nuevos-modulos.js / index.html superan el techo:
// el remedio es partir el archivo, no subir el techo.
// Uso: node scripts/check-size.cjs  (incluido en npm test vía check:syntax? no: corre solo)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const LIMITS = {
  'renderer.js': 1150 * 1024,
  'renderer-territorio-vivo.js': 150 * 1024,
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
// Reporte min/: peso del bundle que realmente viaja (build:min + esbuild).
try {
  const minDir = path.join(ROOT, 'min');
  let raw = 0, n = 0;
  for (const e of fs.readdirSync(minDir)) {
    if (e.endsWith('.min.js') || e.endsWith('.min.css')) {
      raw += fs.statSync(path.join(minDir, e)).size;
      n++;
    }
  }
  console.log(`  i min/: ${n} archivos, ${Math.round(raw / 1024)} KB minificados (fuente: npm run build:min).`);
} catch { console.log('  ~ min/: sin construir (npm run build:min).'); }
