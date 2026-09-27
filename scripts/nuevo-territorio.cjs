// Crea un territorio nuevo copiando data/territorios/penco.
// Uso: node scripts/nuevo-territorio.cjs <id> "<Nombre>"
// Ej:  node scripts/nuevo-territorio.cjs maule "Maule"
const fs = require('fs');
const path = require('path');
const id = String(process.argv[2] || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
const nombre = process.argv[3] || id;
if (!id || id.startsWith('_')) {
  console.error('Uso: node scripts/nuevo-territorio.cjs <id> "<Nombre>"');
  process.exit(1);
}
const root = __dirname + '/..';
const src = path.join(root, 'data/territorios/penco');
const dst = path.join(root, 'data/territorios', id);
if (fs.existsSync(dst)) { console.error('Ya existe: ' + dst); process.exit(1); }
fs.cpSync(src, dst, { recursive: true });
const tj = path.join(dst, 'territorio.json');
const t = JSON.parse(fs.readFileSync(tj, 'utf8'));
t.id = id;
t.nombre = nombre;
fs.writeFileSync(tj, JSON.stringify(t, null, 2), 'utf8');
const ix = path.join(root, 'data/territorios/index.json');
const idx = JSON.parse(fs.readFileSync(ix, 'utf8'));
if (!idx.disponibles.includes(id)) idx.disponibles.push(id);
fs.writeFileSync(ix, JSON.stringify(idx, null, 2), 'utf8');
console.log('Territorio creado: ' + dst);
console.log('Siguiente: edita ' + id + '/territorio.json y sus especies/historia. Abrir con ?territorio=' + id);
