// Valida que cada territorio tenga JSON parseable y conteos minimos.
// Uso: node scripts/validar-territorios.cjs
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'data', 'territorios');
const idx = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'));
const ids = idx.disponibles.filter((x) => !String(x).startsWith('_'));
const obligatorios = [
  'territorio.json', 'lunas.json', 'eventos.json', 'talleres.json',
  'consejos-bosque.json',
  'especies/aves.json', 'especies/bosque.json',
  'especies/intermareal.json', 'especies/flora.json',
  'historia/historia.json', 'historia/sectores.json', 'historia/guia.json',
  'historia/historia-bosque.json', 'historia/companeros-bosque.json',
  'historia/aves-bosque.json', 'historia/historia-aves.json',
  'historia/historia-pesca.json',
  'cultivos/asociaciones.json', 'cultivos/preparados.json'
];
let fallos = 0;
for (const id of ids) {
  console.log('== ' + id + ' ==');
  for (const rel of obligatorios) {
    const p = path.join(root, id, rel);
    try {
      const o = JSON.parse(fs.readFileSync(p, 'utf8'));
      const n = Array.isArray(o) ? o.length : Object.keys(o).length;
      console.log('  OK  ' + rel + ' (' + n + ')');
    } catch (e) {
      fallos++;
      console.log('  FALTA/ERROR ' + rel + ' :: ' + e.message.slice(0, 120));
    }
  }
  // chequeos de contenido minimo
  try {
    const lunas = JSON.parse(fs.readFileSync(path.join(root, id, 'lunas.json'), 'utf8'));
    if (!Array.isArray(lunas.lunas) || lunas.lunas.length !== 13) { fallos++; console.log('  AVISO lunas.lunas debe tener 13'); }
    const tj = JSON.parse(fs.readFileSync(path.join(root, id, 'territorio.json'), 'utf8'));
    if (tj.id !== id) { fallos++; console.log('  AVISO territorio.id (' + tj.id + ') != carpeta (' + id + ')'); }
  } catch (e) {}
}
console.log(fallos ? ('FALLOS: ' + fallos) : 'TODO OK');
process.exit(fallos ? 1 : 0);
