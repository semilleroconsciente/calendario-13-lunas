// Verificacion: JSON dinamico == datos embebidos (data.js)
const fs = require('fs');
global.window = {};
let src = fs.readFileSync('data.js', 'utf8');
src = src.replace(/window\.pencoData\s*=.*/s, 'global.__pd = { PENCO, ESTACIONES, MOONS, DFT, INTRO, MOODS, EFEMERIDES, SIEMBRA, SIEMBRA_LUNAS, DONATE, AVES_PENCO, EVENTOS_ASTRONOMICOS, EVENTOS_COMUNA_PENCO, ASOCIACIONES_CULTIVOS, PREPARADOS_ORGANICOS, INTERMAREAL_PENCO, BOSQUE_NATIVO_PENCO, CONSEJOS_INTERMAREAL, CONSEJOS_BOSQUE };');
eval(src);
const pd = global.__pd;
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const B = 'data/territorios/penco';
let fallos = 0;
function eq(nombre, a, b) {
  const x = JSON.stringify(a), y = JSON.stringify(b);
  if (x === y) { console.log('IGUAL ' + nombre); }
  else { fallos++; console.log('DIFIERE ' + nombre + ' (json=' + x.length + ' embebido=' + y.length + ')'); }
}
const lunas = J(B + '/lunas.json');
eq('MOONS', lunas.lunas, pd.MOONS);
eq('ESTACIONES', lunas.estaciones, pd.ESTACIONES);
eq('DFT', lunas.dft, pd.DFT);
eq('SIEMBRA', lunas.siembraFases, pd.SIEMBRA);
eq('SIEMBRA_LUNAS', lunas.siembraLunas, pd.SIEMBRA_LUNAS);
eq('AVES_PENCO', J(B + '/especies/aves.json'), pd.AVES_PENCO);
eq('BOSQUE', J(B + '/especies/bosque.json'), pd.BOSQUE_NATIVO_PENCO);
const inter = J(B + '/especies/intermareal.json');
eq('INTERMAREAL', inter.especies, pd.INTERMAREAL_PENCO);
eq('CONS_INTER', inter.consejos, pd.CONSEJOS_INTERMAREAL);
eq('CONS_BOSQUE', J(B + '/consejos-bosque.json'), pd.CONSEJOS_BOSQUE);
const ev = J(B + '/eventos.json');
eq('EVENTOS_COMUNA', ev.comuna, pd.EVENTOS_COMUNA_PENCO);
eq('EVENTOS_ASTRO', ev.astronomicos, pd.EVENTOS_ASTRONOMICOS);
eq('ASOC', J(B + '/cultivos/asociaciones.json'), pd.ASOCIACIONES_CULTIVOS);
eq('PREP', J(B + '/cultivos/preparados.json'), pd.PREPARADOS_ORGANICOS);
const tj = J(B + '/territorio.json');
eq('PENCO-coords', tj.coordenadas, pd.PENCO);
eq('INTRO', tj.intro, pd.INTRO);
console.log(fallos ? ('FALLOS: ' + fallos) : 'TODO IGUAL — el loader servira los mismos datos que antes');
process.exit(fallos ? 1 : 0);
