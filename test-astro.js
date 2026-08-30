global.window = {};
require('./astro.js');
require('./data.js');
Object.assign(global, global.window.pencoData);
require('./cal.js');
const astro = global.window.astro;
const cal = global.window.cal;

const fmtKey = cal.fmtKey, fmtT = cal.fmtTime;

console.log('--- Sol en Penco: dia solicitado vs calculado ---');
for (const d of ['2026-06-21', '2026-08-15', '2026-09-05', '2026-09-06', '2026-12-21', '2027-04-03', '2027-06-21']) {
  const [y, m, dd] = d.split('-').map(Number);
  const noon = Date.UTC(y, m - 1, dd, 12);
  const st = cal.sunForDay(noon);
  const riseDay = st.rise ? fmtKey.format(new Date(st.rise)) : 'null';
  const setDay = st.set ? fmtKey.format(new Date(st.set)) : 'null';
  const okRise = riseDay === `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  const okSet = setDay === `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  console.log(
    `${d}: ${riseDay} ${st.rise ? fmtT.format(new Date(st.rise)) : '--'} – ${setDay} ${st.set ? fmtT.format(new Date(st.set)) : '--'}`,
    okRise && okSet ? 'OK' : '** FECHA MAL **'
  );
}

console.log('--- Fases: ciclo completo 2026-27 (52 esperadas ~) ---');
const evs = astro.moonPhaseEvents(cal.weTripantuUTC(2026), cal.weTripantuUTC(2027));
console.log('total:', evs.length);
const doc = {
  '2026-06-21': ['cuarto-creciente', '~17:55'], '2026-06-29': ['llena', '~19:56'],
  '2026-07-07': ['cuarto-menguante', '~15:28'], '2026-07-14': ['nueva', '~05:43'],
  '2026-11-09': ['nueva', '~04:02'], '2026-12-23': ['llena', '~22:28'],
  '2027-03-08': ['nueva', '~06:29'], '2027-06-18': ['llena', '~20:44']
};
for (const [day, [tipo, hora]] of Object.entries(doc)) {
  const hit = evs.find(e => fmtKey.format(new Date(e.utcMs)) === day && e.tipo === tipo);
  console.log(day, tipo, hit ? `${fmtT.format(new Date(hit.utcMs))} (doc ${hora})` : '** NO ENCONTRADA **');
}
