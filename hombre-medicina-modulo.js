/* ============================================================
   HOMBRE MEDICINA — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente:
   - Botón btnHombreMedicina (grupo Linaje > practicas, tras btnTolteca)
   - Diálogo hombreMedicinaDialog con 5 pestañas:
     1) Guía (qué es y qué no es, linajes que lo nombran,
        tonal/nagual y punto de encaje en simple, 4 enemigos,
        camino del guerrero, impecabilidad, ética y cuidados)
     2) Caminos (4 rumbos de la rueda + 7 fuegos/virtudes:
        buscador, detalle, favorita, "caminar hoy")
     3) Prácticas (12 prácticas del hombre medicina +
        vigilia de silencio 3 min + registro del día)
     4) Test (20 afirmaciones: presencia, propósito,
        regulación y servicio + nivel de ruido interno)
     5) Mi camino (mi senda, diario, días, historial,
        racha, compartir, llevar a nota, borrar)
   - Todo local y privado por usuario: userData().hombreMedicina
     { tests:[], miSenda:'', practs:[], diario:{}, favs:[] }
   - Puentes: Toltecas (🦅), Recapitulación (🔁), Cuarto Camino,
     Camino Lakota (🙏), Energía y descanso (⚡), Respiración (🌬️),
     Métodos (ficha hombre medicina).
   - Educativo y respetuoso: no promete curaciones ni poderes,
     no reemplaza terapia ni medicina, no usa plantas de poder
     ni ceremonias cerradas. Inspira pero no apropia: invita a
     aprender con gente del territorio. 100% offline.
   ============================================================ */
(function () {
'use strict';

var $ = function (id) { return document.getElementById(id); };
function esc(s) {
  if (typeof escapeHtml === 'function') return escapeHtml(s);
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function clean(s, n) {
  if (typeof sanitizeText === 'function') return sanitizeText(s, n);
  return String(s == null ? '' : s).slice(0, n || 300);
}
function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayKey() {
  try { if (typeof cal !== 'undefined' && cal.fmtKey) return cal.fmtKey.format(new Date()); } catch (e) {}
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function lunaTxt(key) {
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' · día ' + r.diaN; }
  } catch (e) {}
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return 'Luna ' + m.luna + ' · día ' + m.dia; }
  } catch (e) {}
  return '';
}
function blank() { return { tests: [], miSenda: '', practs: [], diario: {}, favs: [] }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.hombreMedicina) u.hombreMedicina = blank();
    var e = u.hombreMedicina;
    if (!Array.isArray(e.tests)) e.tests = [];
    if (!Array.isArray(e.practs)) e.practs = [];
    if (!e.diario) e.diario = {};
    if (!Array.isArray(e.favs)) e.favs = [];
    if (typeof e.miSenda !== 'string') e.miSenda = '';
    return e;
  } catch (e2) { return blank(); }
}
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {} }
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text, null);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}
function addKw(id, extra) {
  try { var b = $(id); if (b && b.dataset && b.dataset.keywords && b.dataset.keywords.indexOf(extra.split(' ')[0]) < 0) b.dataset.keywords += ' ' + extra; } catch (e) {}
}
function makeDialog(id, title, sub, bodyHTML) {
  var old = $(id);
  if (old) old.remove();
  var d = document.createElement('dialog');
  d.id = id;
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">' + title + '</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    (sub ? '<p class="muted su-77e2fe">' + sub + '</p>' : '') +
    bodyHTML +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }
function switchTab(name) {
  ['Guia', 'Caminos', 'Pract', 'Test', 'Camino'].forEach(function (t) {
    var p = $('hm' + t), b = $('tabHm' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ============================================================
   DATOS — 4 rumbos + 7 fuegos
   ============================================================ */
var HM_RUMBOS = [
  { id: 'este', n: 'Este · El Visionario', ico: '🌅', color: '#ffd166',
    idea: 'El Este es el amanecer: ver claro antes de actuar. El hombre medicina primero aprende a mirar —su propia vida, su familia, su territorio— sin autoengaño. Visión sin tierra es fantasía; visión con pies es camino.',
    sirve: 'Cuando vives apagando incendios, sin rumbo, o persiguiendo metas ajenas.',
    practica: 'Escribe tu visión en 1 frase ("cuido a mi familia trabajando honrado y sano"). Léela cada amanecer por 1 luna.',
    trampa: 'Quedarse en el sueño bonito sin dar el paso de hoy.',
    pregunta: '¿Qué vida estoy construyendo con lo que hago hoy?' },
  { id: 'sur', n: 'Sur · El Guerrero', ico: '🔥', color: '#ef476f',
    idea: 'El Sur es el mediodía: acción impecable, coraje y disciplina. El guerrero no pelea con todos: pelea con su flojera, su queja y su miedo. Hace su máximo, ni más (se quema) ni menos (se culpa).',
    sirve: 'Procrastinación, vicios que te manejan, promesas rotas, cuerpo abandonado.',
    practica: 'Elige 1 batalla noble (madrugar, entrenar, dejar el copete de lunes a viernes) y cúmplela 7 días seguidos.',
    trampa: 'Confundir dureza con violencia. El guerrero protege, no humilla.',
    pregunta: '¿Esto que voy a hacer me acerca o me aleja de mi palabra?' },
  { id: 'oeste', n: 'Oeste · El Sanador', ico: '🌊', color: '#118ab2',
    idea: 'El Oeste es el atardecer: mirar adentro, recapitular el día, pedir perdón y soltar. El sanador no "arregla" a otros: primero ordena su propia mochila (culpas, duelos, rencores). Lo que no se mira, se repite.',
    sirve: 'Rencores viejos, duelos no llorados, peleas que se repiten en pareja o pega.',
    practica: 'Cada noche: 3 líneas — ¿qué hice bien? ¿a quién herí? ¿qué suelto? Si debes una disculpa, dala en 48 h.',
    trampa: 'Revolver el pasado para culparte. Recapitular es para liberar, no para flagelarte.',
    pregunta: '¿Qué cargo que no es mío —o qué mío que no suelto—?' },
  { id: 'norte', n: 'Norte · El Sabio', ico: '🏔️', color: '#8fd694',
    idea: 'El Norte es la noche estrellada y el invierno: silencio, consejo y servicio. El sabio escucha más de lo que habla, honra a sus mayores y devuelve al territorio lo recibido. Ser hombre medicina es, al final, servir.',
    sirve: 'Hablar de más, creerse superior por lo aprendido, olvidar a los viejos y al barrio.',
    practica: '1 servicio semanal sin vitrina: ayuda a un mayor, limpia una playa, enseña tu oficio 1 hora.',
    trampa: 'El ego espiritual ("yo ya desperté"). El sombrero más grande es el servicio más silencioso.',
    pregunta: '¿A quién sirvo con lo que sé?' }
];

var HM_FUEGOS = [
  { id: 'palabra', n: 'Palabra impecable', ico: '🗣️', tag: 'palabra verdad chisme promesa',
    idea: 'Tu palabra es tu medicina o tu veneno. Hablar con verdad y respeto —incluido cómo te hablas por dentro— ordena tu mundo.',
    sirve: 'Chisme, autocrítica feroz, promesas al aire.',
    practica: 'Hoy: 0 chisme + 1 verdad amable dicha a tiempo.',
    trampa: 'Usar la "sinceridad" para herir.',
    pregunta: '¿Esto construye o envenena?' },
  { id: 'cuerpo', n: 'Cuerpo como templo', ico: '💪', tag: 'cuerpo ejercicio descanso alimento',
    idea: 'Sin cuerpo no hay camino. Dormir, moverte, comer real y chequearte es la primera ceremonia. El descuido no es humildad: es deuda que pagan los que te quieren.',
    sirve: 'Trasnoche crónico, sedentarismo, alcohol que se arranca.',
    practica: 'Esta luna: dormir 7–8 h + moverte 150 min/semana. Registra en ⚡ Energía y descanso.',
    trampa: 'Culto al músculo vacío. Fuerza para servir, no para dominar.',
    pregunta: '¿Mi cuerpo aguanta la vida que sueño?' },
  { id: 'familia', n: 'Familia y linaje', ico: '🌳', tag: 'familia hijos padre linaje ancestros',
    idea: 'Honrar padre y madre no es obedecer todo: es tomar lo bueno, reparar lo herido y no traspasar lo malo. Ser el eslabón que sana la cadena.',
    sirve: 'Peleas heredadas, paternidad ausente o autoritaria, culpas con los viejos.',
    practica: 'Llama o visita a 1 mayor esta semana. Pregunta 1 historia y anótala en 🌳 Árbol Genealógico.',
    trampa: 'Repetir "así me criaron" como excusa.',
    pregunta: '¿Qué cadena sano yo en mi generación?' },
  { id: 'trabajo', n: 'Trabajo honrado', ico: '🛠️', tag: 'trabajo oficio plata honradez proveer',
    idea: 'Proveer con manos limpias es medicina. El cómo ganas tu plata enseña más a tus hijos que cien consejos.',
    sirve: 'Pitutos truchos, deudas por aparentar, pega que enferma el alma.',
    practica: 'Ordena 1 frente: presupuesto, deuda o CV. Usa 💰 Finanzas del calendario.',
    trampa: 'Sacrificar salud y familia "por darles todo".',
    pregunta: '¿Mi trabajo me enorgullece frente a mis hijos?' },
  { id: 'emocion', n: 'Fuego emocional', ico: '❤️‍🔥', tag: 'emociones rabia miedo tristeza regulacion',
    idea: 'Sentir no es ser débil: débil es explotar o guardarlo todo. Respirar, nombrar y responder —no reaccionar— es maestría del guerrero.',
    sirve: 'Explosiones de rabia, pena tapada con alcohol, frialdad en casa.',
    practica: 'Ante el gatillo: 4-6 (inhala 4, exhala 6) × 4 + "estoy con rabia porque necesito…".',
    trampa: '"Los hombres no lloran". Llorar a tiempo evita romper después.',
    pregunta: '¿Qué necesita mi emoción en vez de a quién culpo?' },
  { id: 'naturaleza', n: 'Alianza con la tierra', ico: '🌿', tag: 'naturaleza territorio bosque mar lawen',
    idea: 'El hombre medicina conoce su territorio: sus árboles, mareas y lunas. Cuidar el borde costero, el humedal y el bosque es cuidarse.',
    sirve: 'Desconexión, consumo sin medida, patio y playa como basural.',
    practica: '1 salida mensual al territorio (sendero, playa, humedal Rocuant-Andalién) + 1 limpieza.',
    trampa: 'Amar la "naturaleza" en fotos y ensuciar la real.',
    pregunta: '¿Qué le devuelvo a la tierra que me alimenta?' },
  { id: 'espiritu', n: 'Vínculo con lo sagrado', ico: '🙏', tag: 'espiritu fe rezo silencio gratitud proposito',
    idea: 'Rezar, agradecer y pedir guía —a tu manera, sin imponerla— sostiene en la tormenta. La fe sin actos es adorno; los actos sin sentido queman.',
    sirve: 'Vacío aunque "todo esté bien", decisiones grandes, miedo a la muerte.',
    practica: 'Rito diario de 3 min: 1 gratitud + 1 intención + 1 silencio.',
    trampa: 'Fanatismo o mercantilismo espiritual.',
    pregunta: '¿Qué me sostiene cuando todo tiembla?' }
];

var HM_PRACTICAS = [
  { n: 'Amanecer en silencio', ico: '🌅', min: 5, txt: 'Levántate 10 min antes. Sin celu: mira el amanecer, 6 respiraciones 4-6, declara tu intención del día en voz alta.' },
  { n: 'Fuego de la palabra', ico: '🗣️', min: 3, txt: 'Revisa tus promesas: ¿qué prometí y no cumplí? Manda 1 mensaje hoy cumpliendo o renegociando 1 promesa.' },
  { n: 'Cuerpo del guerrero', ico: '💪', min: 20, txt: '20 min: caminata rápida, sentadillas, plancha y elongación. Sin excusas de clima: Penco siempre da un claro.' },
  { n: 'Ducha fría del sur', ico: '🚿', min: 3, txt: 'Termina tu ducha con 30–60 s de agua fría respirando lento. Entrena temple y voluntad. Evita si tienes problema cardíaco sin control médico.' },
  { n: 'Recapitulación del oeste', ico: '🔁', min: 10, txt: 'Noche: repasa el día como película. Respira y suelta 1 escena pesada. Si heriste, anota la reparación. Puente: 🔁 Recapitulación.' },
  { n: 'Servicio silencioso', ico: '🤲', min: 15, txt: 'Haz 1 bien sin contarle a nadie: ayuda, repara, limpia o enseña. Anótalo solo en tu diario.' },
  { n: 'Caminata de visión', ico: '🚶', min: 30, txt: 'Camina 30 min sin audífonos por borde costero, cerro o humedal. Pregunta 1 sola: "¿qué debo ver?". Anota lo primero honesto.' },
  { n: 'Ayuno de queja', ico: '🤐', min: 0, txt: '24 h sin quejarte en voz alta. Cada queja que atrape: conviértela en 1 pedido claro o 1 acción.' },
  { n: 'Mesa y fuego familiar', ico: '🍲', min: 30, txt: 'Come 1 vez sin pantallas con tu gente. Pregunta cómo están de verdad y escucha sin aconsejar 5 minutos.' },
  { n: 'Vigilia de las 3 min', ico: '🕯️', min: 3, txt: 'Siéntate 3 min en silencio con vela o amanecer (temporizador abajo). Solo respira. Si te pierdes, vuelve sin pelearte.' },
  { n: 'Carta al padre / al hijo', ico: '✉️', min: 15, txt: 'Escribe lo no dicho (gratitud, perdón o lo que faltó). Puedes enviarla, leerla ante su foto o guardarla. Libera la cadena.' },
  { n: 'Voto de luna', ico: '🌙', min: 10, txt: 'Cada luna nueva elige 1 voto (ej: "entreno 3×/semana"). Revísalo en llena y menguante. Racha visible en Mi camino.' }
];

var HM_TEST = [
  'Mantengo mi palabra aunque cueste.',
  'Cuido mi cuerpo (sueño, movimiento, comida) la mayoría de los días.',
  'Respiro antes de reaccionar cuando me provocan.',
  'Pido perdón cuando me equivoco, sin justificarme eterno.',
  'Cumplo lo que prometo a mis hijos / pareja / madre.',
  'Tengo un trabajo u oficio que me enorgullece.',
  'Ordeno mi plata: sé cuánto entra y cuánto sale.',
  'Honro a mis mayores: los llamo o visito.',
  'Devuelvo al territorio: limpio, planto o cuido.',
  'Sé estar en silencio sin arrancar al celu.',
  'Acepto críticas sin explotar ni cerrarme días.',
  'Pongo límites sin violencia (digo no cuando toca).',
  'Agradezco en voz alta cada día.',
  'Ayudo sin publicar ni cobrarlo después.',
  'Suelto rencores en vez de guardarlos años.',
  'Tengo una visión escrita de la vida que quiero.',
  'Cuido mi consumo (alcohol, pantallas, gastos) con reglas claras.',
  'Escucho de verdad 5 minutos sin interrumpir.',
  'Reparo rápido cuando hiero (menos de 48 h).',
  'Siento que mi vida sirve a algo mayor que yo.'
];

var HM_SENDAS = {
  visionario: { nombre: '🌅 El Visionario', txt: 'Ves lejos y ordenas el rumbo. Tu medicina es la claridad: pones palabras al sueño familiar y lo sostienes con pasos diarios.' },
  guerrero: { nombre: '🔥 El Guerrero', txt: 'Tu medicina es la acción impecable: disciplina, coraje y palabra. Proteges sin humillar y cumples aunque llueva.' },
  sanador: { nombre: '🌊 El Sanador', txt: 'Miras adentro y reparas vínculos. Tu medicina es el perdón, la escucha y la recapitulación que libera.' },
  sabio: { nombre: '🏔️ El Sabio', txt: 'Escuchas más de lo que hablas y sirves en silencio. Tu medicina es el consejo justo y el ejemplo que arrastra.' },
  guardian: { nombre: '🛡️ El Guardián', txt: 'Sostienes casa y territorio: provees honrado, cuidas el borde costero y dejas el lugar mejor. Tu medicina es la constancia.' }
};

var HM_LUNAS = [
  '🌙 Luna 1 · Siembra tu voto: elige tu senda y 1 práctica diaria.',
  '🌙 Luna 2 · Sostén: mide tu racha, ajusta sin culparte.',
  '🌙 Luna 3 · Sirve: suma 1 servicio semanal fijo en tu barrio.'
];

/* ============================================================
   RENDER
   ============================================================ */
function rumbosHTML() {
  return HM_RUMBOS.map(function (r) {
    var fav = store().favs.indexOf('r:' + r.id) >= 0 ? '⭐' : '☆';
    return '<div class="habit-item" data-rumbo="' + r.id + '">' +
      '<div class="su-6bf84b"><span><span class="su-b9199e">' + r.ico + '</span> <b>' + esc(r.n) + '</b></span>' +
      '<button class="btn btn-icon su-337714" data-fav="r:' + r.id + '" title="Marcar favorita">' + fav + '</button></div>' +
      '<div class="rumbo-det hidden su-cdff1d">' +
      '<p>💡 ' + esc(r.idea) + '</p>' +
      '<p>🧭 <b>Te sirve si:</b> ' + esc(r.sirve) + '</p>' +
      '<p>🛠️ <b>Hoy:</b> ' + esc(r.practica) + '</p>' +
      '<p>⚠️ <b>Trampa:</b> ' + esc(r.trampa) + '</p>' +
      '<p>❓ <b>Pregúntate:</b> <i>' + esc(r.pregunta) + '</i></p>' +
      '<div class="su-faf7a9"><button class="btn su-337714" data-walk="r">🚶 Caminar hoy</button></div></div></div>';
  }).join('');
}
function fuegosHTML() {
  return HM_FUEGOS.map(function (r) {
    var fav = store().favs.indexOf('f:' + r.id) >= 0 ? '⭐' : '☆';
    return '<div class="habit-item" data-fuego="' + r.id + '">' +
      '<div class="su-6bf84b"><span><span class="su-b9199e">' + r.ico + '</span> <b>' + esc(r.n) + '</b></span>' +
      '<button class="btn btn-icon su-337714" data-fav="f:' + r.id + '" title="Marcar favorita">' + fav + '</button></div>' +
      '<div class="fuego-det hidden su-cdff1d">' +
      '<p>💡 ' + esc(r.idea) + '</p>' +
      '<p>🧭 <b>Te sirve si:</b> ' + esc(r.sirve) + '</p>' +
      '<p>🛠️ <b>Hoy:</b> ' + esc(r.practica) + '</p>' +
      '<p>⚠️ <b>Trampa:</b> ' + esc(r.trampa) + '</p>' +
      '<p>❓ <b>Pregúntate:</b> <i>' + esc(r.pregunta) + '</i></p>' +
      '<div class="su-faf7a9"><button class="btn su-337714" data-walk="f">🚶 Caminar hoy</button></div></div></div>';
  }).join('');
}
function practicasHTML() {
  return HM_PRACTICAS.map(function (p, i) {
    return '<div class="habit-item"><div class="su-6bf84b"><span><span class="su-4ff818">' + p.ico + '</span> <b>' + esc(p.n) + '</b> <span class="chip su-0d5be0">' + p.min + ' min</span></span></div>' +
      '<div class="muted su-cdff1d">' + esc(p.txt) + '</div>' +
      '<div class="su-faf7a9"><button class="btn su-337714 hm-pract-add" data-p="' + esc(p.n) + '">✓ La practiqué hoy</button></div></div>';
  }).join('');
}
function testHTML() {
  return HM_TEST.map(function (t, i) {
    return '<div class="habit-item"><div><b>' + (i + 1) + '.</b> ' + esc(t) + '</div>' +
      '<div class="su-faf7a9" role="radiogroup" aria-label="Pregunta ' + (i + 1) + '">' +
      [0, 1, 2, 3].map(function (v) {
        var lab = ['Nunca', 'A veces', 'Seguido', 'Siempre'][v];
        return '<label class="su-337714"><input type="radio" name="hmQ' + i + '" value="' + v + '"> ' + lab + '</label>';
      }).join(' ') + '</div></div>';
  }).join('');
}
function calcTest() {
  var sc = 0, contestadas = 0;
  for (var i = 0; i < HM_TEST.length; i++) {
    var sel = null;
    try { sel = document.querySelector('input[name="hmQ' + i + '"]:checked'); } catch (e) {}
    if (sel) { sc += +sel.value; contestadas++; }
  }
  return { sc: sc, contestadas: contestadas };
}
function nivelTest(sc) {
  var pct = Math.round(sc / (HM_TEST.length * 3) * 100);
  if (pct < 35) return { t: '🌱 Semilla del Este', d: 'Estás despertando la visión. Elige 1 rumbo (Este o Sur) y 1 práctica mínima por 1 luna. No te exijas todo: constancia mata exigencia.' };
  if (pct < 60) return { t: '🔥 Fuego del Sur', d: 'Ya caminas, con altibajos. Sostén 2 prácticas (1 cuerpo + 1 recapitulación) y 1 servicio semanal. La racha te ordena.' };
  if (pct < 82) return { t: '🌊 Corazón del Oeste', d: 'Vas sanando y cumpliendo. Profundiza: carta al padre/hijo + voto de luna + círculo de hombres o mentor.' };
  return { t: '🏔️ Presencia del Norte', d: 'Sostienes palabra, cuerpo y servicio. Tu paso ahora es transmitir: enseña tu oficio 1 hora/mes y acompaña a 1 joven.' };
}
function rachaPracts() {
  try {
    var s = new Set(store().practs.map(function (r) { return r.fecha; }));
    var c = 0, k = todayKey();
    while (s.has(k)) { c++; k = addDaysKeyLocal(k, -1); }
    return c;
  } catch (e) { return 0; }
}
function addDaysKeyLocal(key, days) {
  try { if (typeof addDaysKey === 'function') return addDaysKey(key, days); } catch (e) {}
  var d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + days);
  try { return cal.fmtKey.format(d); } catch (e2) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function renderStats() {
  var box = $('hmStats'); if (!box) return;
  var e = store();
  var nd = Object.keys(e.diario || {}).length;
  var senda = e.miSenda && HM_SENDAS[e.miSenda] ? HM_SENDAS[e.miSenda].nombre : 'senda por elegir';
  box.innerHTML = '🦅 <b>' + esc(senda) + '</b> · 🔥 racha ' + rachaPracts() + ' días · 📓 ' + nd + ' días de diario · 🧪 ' + e.tests.length + ' test(s) · ⭐ ' + e.favs.length + ' favoritas';
}
function renderDiario() {
  var box = $('hmDiario'); if (!box) return;
  var e = store();
  var ks = Object.keys(e.diario || {}).sort().reverse().slice(0, 30);
  if (!ks.length) { box.innerHTML = '<p class="muted">Aún sin registros. Anota 1 línea por noche: el guerrero se revisa.</p>'; return; }
  box.innerHTML = ks.map(function (k) {
    return '<div class="habit-item"><div class="su-6bf84b"><span><b>' + esc(k) + '</b> <span class="muted">' + esc(lunaTxt(k)) + '</span></span>' +
      '<button class="btn su-9b8fb7" data-del="' + k + '">✕</button></div>' +
      '<div class="su-cdff1d">' + esc(e.diario[k]) + '</div></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) {
    b.onclick = function () { if (!confirm('¿Borrar registro del ' + b.getAttribute('data-del') + '?')) return; delete store().diario[b.getAttribute('data-del')]; save(); renderDiario(); renderStats(); };
  });
}
function renderHist() {
  var box = $('hmHist'); if (!box) return;
  var e = store();
  var arr = (e.practs || []).slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 30);
  if (!arr.length) { box.innerHTML = '<p class="muted">Sin días registrados. Guarda tu primer día abajo.</p>'; return; }
  box.innerHTML = arr.map(function (r) {
    return '<div class="habit-item"><div><b>' + esc(r.fecha || '') + '</b> <span class="muted">' + esc(lunaTxt(r.fecha || '')) + '</span></div>' +
      '<div class="su-cdff1d">🐾 ' + esc(r.acecho || '—') + '<br>🌙 ' + esc(r.ensueno || '—') + '<br>🌀 ' + esc(r.nohacer || '—') + '</div>' +
      '<div class="su-faf7a9"><button class="btn su-9b8fb7" data-hdel="' + r.id + '">✕</button></div></div>';
  }).join('');
  box.querySelectorAll('[data-hdel]').forEach(function (b) {
    b.onclick = function () { var d = store(); d.practs = d.practs.filter(function (x) { return x.id !== b.getAttribute('data-hdel'); }); save(); renderHist(); renderStats(); };
  });
}
function renderSendaBox() {
  var box = $('hmSendaBox'); if (!box) return;
  var e = store();
  if (!e.miSenda || !HM_SENDAS[e.miSenda]) { box.innerHTML = '<p class="muted">Elige tu senda abajo: la que te nazca hoy puede cambiar en 3 lunas. Lo importante es caminarla.</p>'; return; }
  var s = HM_SENDAS[e.miSenda];
  box.innerHTML = '<div class="si-card su-7266f7"><h4>' + esc(s.nombre) + ' — tu senda actual</h4><p class="su-6cb285">' + esc(s.txt) + '</p></div>';
}
function syncSenda() {
  var sel = $('hmMiSenda'); if (!sel) return;
  var e = store();
  if ([...sel.options].some(function (o) { return o.value === e.miSenda; })) sel.value = e.miSenda;
}
function showResultado(sc) {
  var box = $('hmResultado'); if (!box) return;
  var nv = nivelTest(sc);
  var pct = Math.round(sc / (HM_TEST.length * 3) * 100);
  box.classList.remove('hidden');
  box.innerHTML = '<div class="si-card su-7266f7"><h4>' + esc(nv.t) + ' · ' + pct + '%</h4><p class="su-6cb285">' + esc(nv.d) + '</p>' +
    '<div class="su-faf7a9"><button class="btn su-337714" id="hmSaveTest">💾 Guardar este test</button></div></div>';
  var sv = $('hmSaveTest');
  if (sv) sv.onclick = function () {
    var e = store();
    e.tests.push({ id: uid('t'), fecha: todayKey(), puntaje: sc, nivel: nv.t });
    save('Test guardado ✓'); renderStats();
    try { box.querySelector('#hmSaveTest').textContent = '✓ Guardado'; } catch (e2) {}
  };
}
function updateProgreso() {
  var r = calcTest(), bar = $('hmTestBar'), lab = $('hmTestLab');
  if (bar) bar.style.width = Math.round(r.contestadas / HM_TEST.length * 100) + '%';
  if (lab) lab.textContent = r.contestadas + '/' + HM_TEST.length + ' respondidas';
}
function filterCaminos() {
  var q = (($('hmQ') || {}).value || '').toLowerCase();
  document.querySelectorAll('#hmCamGrid .habit-item').forEach(function (card) {
    var t = (card.textContent || '').toLowerCase();
    card.style.display = (!q || t.indexOf(q) >= 0) ? '' : 'none';
  });
}
function runSilencio() {
  var total = 180, left = total;
  var lab = $('hmSilencioLab'), bar = $('hmSilencioBar');
  var btn = $('hmSilencioBtn');
  if (btn) btn.disabled = true;
  var iv = setInterval(function () {
    left -= 1;
    var m = Math.floor(left / 60), s = left % 60;
    if (lab) lab.textContent = '🔥 ' + m + ':' + String(s).padStart(2, '0') + ' — respira 4-6, vuelve al fuego';
    if (bar) bar.style.width = Math.round((total - left) / total * 100) + '%';
    if (left <= 0) {
      clearInterval(iv);
      if (lab) lab.textContent = '✓ Vigilia completa. Anota 1 línea en tu diario.';
      if (btn) btn.disabled = false;
      try { if (typeof scheduleSave === 'function') scheduleSave(); } catch (e) {}
    }
  }, 1000);
}

/* ============================================================
   DIALOG
   ============================================================ */
function buildDialog() {
  var sendaOpts = Object.keys(HM_SENDAS).map(function (k) {
    return '<option value="' + k + '">' + esc(HM_SENDAS[k].nombre) + '</option>';
  }).join('');
  var body =
    '<div class="su-faf7a9">' +
    '<button type="button" class="btn btn-accent" id="tabHmGuia">🧭 Guía</button>' +
    '<button type="button" class="btn" id="tabHmCaminos">🛤️ Caminos (11)</button>' +
    '<button type="button" class="btn" id="tabHmPract">🛠️ Prácticas</button>' +
    '<button type="button" class="btn" id="tabHmTest">🧪 Test</button>' +
    '<button type="button" class="btn" id="tabHmCamino">📓 Mi camino</button></div>' +
    /* GUIA */
    '<div id="hmGuia">' +
    '<div class="si-card su-7266f7"><h4>🦅 ¿Qué es el Hombre Medicina?</h4>' +
    '<p class="su-6cb285">En muchas tradiciones de Abya Yala —del <b>wicasa wakan</b> lakota al <b>guerrero tolteca</b>, del <b>lonko y machi</b> mapuche al curandero andino— hay un oficio parecido: <b>el hombre que sana porque primero se sanó</b>. No es un título que se compra ni un disfraz: es una forma de pararse en la vida —palabra clara, cuerpo cuidado, familia sostenida y servicio al territorio—. Esta sección traduce ese camino a tu vida en Penco: pega, casa, hijos, barrio y borde costero.</p></div>' +
    '<div class="si-card su-7266f7"><h4>🚫 Lo que NO es (para caminar sin apropiar ni dañar)</h4>' +
    '<p class="su-6cb285">• No es machismo con plumas: el guerrero protege, no domina.<br>' +
    '• No es un curso de fin de semana que te vuelve "chamán": el oficio real toma años junto a gente mayor.<br>' +
    '• No usa plantas de poder ni ceremonias cerradas: aquí no se enseñan ni se citan (respeto + ley + salud).<br>' +
    '• No promete curar enfermedades ni "limpiar" a otros cobrando: eso es delicado y a veces delito.<br>' +
    '• No reemplaza médico, CESFAM, psicólogo ni redes de apoyo (*4141, 149, 1455).<br>' +
    '• No se apropia: nos inspiramos con respeto y nombramos la fuente; si quieres profundizar, busca a personas del territorio y aprende en persona.</p></div>' +
    '<div class="si-card su-7266f7"><h4>🧭 Los 4 rumbos en 1 minuto</h4>' +
    '<p class="su-6cb285">🌅 <b>Este:</b> visión — ¿qué vida construyo?<br>🔥 <b>Sur:</b> acción — ¿cumplo mi palabra hoy?<br>🌊 <b>Oeste:</b> sanación — ¿qué suelto y reparo?<br>🏔️ <b>Norte:</b> servicio — ¿a quién sirvo con lo que sé?<br>Gira por los 4 cada día: mira, actúa, revisa, sirve. Eso es todo el "secreto".</p></div>' +
    '<div class="si-card su-7266f7"><h4>⚔️ Los 4 enemigos del guerrero (Castaneda, en simple)</h4>' +
    '<p class="su-6cb285">1) <b>Miedo:</b> se cruza respirando y dando el paso igual.<br>2) <b>Claridad:</b> cuando "ya entendiste todo", cuidado: la certeza ciega.<br>3) <b>Poder:</b> cuando te resulta, no te creas dueño de nadie.<br>4) <b>Vejez/cansancio:</b> el último: seguir sirviendo aun cansado, a tu medida.<br>Vencerlos no es eliminarlos: es no dejar que manejen tu vida.</p></div>' +
    '<div class="si-card su-7266f7"><h4>🛤️ Cómo caminar sin grupo (Penco real)</h4>' +
    '<p class="su-6cb285">1) Elige tu <b>senda</b> en Mi camino.<br>2) Marca <b>1 rumbo + 1 fuego</b> como foco de la luna.<br>3) Practica <b>1 cosa diaria</b> (5–20 min) y anótala.<br>4) Haz el <b>test</b> hoy y en 1 luna: compara.<br>5) Suma <b>1 servicio semanal</b> en tu cuadra.<br>Si puedes, camina con 1 amigo, tu hijo o un mayor: el camino rinde más de a dos.</p></div>' +
    '<div class="su-faf7a9"><button type="button" class="btn su-337714" id="hmGoLakota">🙏 Ver Camino Lakota</button> ' +
    '<button type="button" class="btn su-337714" id="hmGoTolteca">🦅 Ver Prácticas Toltecas</button> ' +
    '<button type="button" class="btn su-337714" id="hmGoMujer">🌕 Ver Mujer Medicina</button></div>' +
    '<div class="muted su-116966">🌙 ' + esc(HM_LUNAS[0]) + '<br>🌙 ' + esc(HM_LUNAS[1]) + '<br>🌙 ' + esc(HM_LUNAS[2]) + '</div>' +
    '</div>' +
    /* CAMINOS */
    '<div id="hmCaminos" class="hidden">' +
    '<div class="su-faf7a9"><input type="search" id="hmQ" placeholder="🔍 Buscar (ej: palabra, cuerpo, perdón, servicio...)" autocomplete="off" aria-label="Buscar caminos"></div>' +
    '<h4 class="su-ee0cfe">🛤️ Los 4 rumbos</h4><div id="hmRumGrid">' + rumbosHTML() + '</div>' +
    '<h4 class="su-ee0cfe">🔥 Los 7 fuegos (virtudes diarias)</h4><div id="hmCamGrid">' + fuegosHTML() + '</div>' +
    '<div id="hmCamDet" class="su-cdff1d"></div></div>' +
    /* PRACT */
    '<div id="hmPract" class="hidden">' +
    '<div class="si-card su-7266f7"><h4>🕯️ Vigilia de 3 minutos</h4>' +
    '<p class="su-6cb285">Siéntate derecho, suelta hombros. Inhala 4, exhala 6. Si te vas a la pega o la deuda, vuelve al aire. Es tu temazcal portátil.</p>' +
    '<div class="su-faf7a9"><button type="button" class="btn btn-accent" id="hmSilencioBtn">▶ Iniciar 3 min</button> <span id="hmSilencioLab" class="muted">Listo cuando tú lo estés.</span></div>' +
    '<div class="su-fdefb3"><div id="hmSilencioBar" class="su-e8a1bc"></div></div></div>' +
    '<div id="hmPractGrid">' + practicasHTML() + '</div>' +
    '<div class="si-card su-7266f7"><h4>📓 Registro del día del guerrero</h4>' +
    '<div class="su-faf7a9"><input id="hmAcechoHoy" placeholder="🐾 Acecho de hoy (¿qué patrón cacé? ej: la queja)" aria-label="Acecho de hoy">' +
    '<input id="hmEnsuenoHoy" placeholder="🌙 Visión (¿qué soñé / qué quiero?)" aria-label="Visión de hoy">' +
    '<input id="hmNoHacerHoy" placeholder="🌀 No-hacer (¿qué vicio pausé hoy?)" aria-label="No hacer de hoy">' +
    '<button type="button" class="btn btn-accent" id="hmPractSave">💾 Guardar día</button></div></div>' +
    '<div class="su-faf7a9"><button type="button" class="btn su-337714" id="hmGoRecap">🔁 Abrir Recapitulación</button> ' +
    '<button type="button" class="btn su-337714" id="hmGoResp">🌬️ Abrir Respiración</button></div></div>' +
    /* TEST */
    '<div id="hmTest" class="hidden">' +
    '<p class="muted">20 afirmaciones · Nunca (0) a Siempre (3). Contesta honesto: es espejo, no examen. <span id="hmTestLab">0/20 respondidas</span></p>' +
    '<div class="su-fdefb3"><div id="hmTestBar" class="su-23d652"></div></div>' +
    '<div id="hmTestBox">' + testHTML() + '</div>' +
    '<div class="su-faf7a9"><button type="button" class="btn btn-accent" id="hmTestCalc">Ver mi espejo 🦅</button> ' +
    '<button type="button" class="btn su-337714" id="hmTestReset">Limpiar</button></div>' +
    '<div id="hmResultado" class="hidden"></div></div>' +
    /* CAMINO */
    '<div id="hmCamino" class="hidden">' +
    '<div id="hmStats" class="muted su-116966"></div>' +
    '<div id="hmSendaBox"></div>' +
    '<div class="si-card su-7266f7"><h4>🛤️ Elige tu senda</h4>' +
    '<div class="su-faf7a9"><select id="hmMiSenda" aria-label="Mi senda">' +
    '<option value="">— Elige tu senda —</option>' + sendaOpts + '</select></div>' +
    '<p class="muted su-77e2fe">No es para siempre: es tu foco de esta luna.</p></div>' +
    '<div class="si-card su-7266f7"><h4>📓 Diario del camino (privado)</h4>' +
    '<div class="su-faf7a9"><input type="date" id="hmDiaFecha" aria-label="Fecha"> ' +
    '<input id="hmDiaTxt" placeholder="1 línea honesta de hoy..." aria-label="Línea del diario"> ' +
    '<button type="button" class="btn btn-accent" id="hmDiaAdd">＋ Anotar</button></div>' +
    '<div id="hmDiario"></div></div>' +
    '<div class="si-card su-7266f7"><h4>🔥 Días guerreros</h4><div id="hmHist"></div></div>' +
    '<div class="su-faf7a9"><button type="button" class="btn su-337714" id="hmShare">📤 Compartir mi avance</button> ' +
    '<button type="button" class="btn su-337714" id="hmToNote">📝 Llevar a nota de hoy</button> ' +
    '<button type="button" class="btn su-9b8fb7" id="hmClear">🗑 Borrar todo</button></div>' +
    '<div class="su-faf7a9"><button type="button" class="btn su-337714" id="hmGoMujer2">🌕 Ver Mujer Medicina (camino complementario)</button></div>' +
    '</div>';
  return makeDialog('hombreMedicinaDialog', '🦅 Hombre Medicina', 'Palabra, cuerpo, familia y servicio: el camino del guerrero que sana. Local, privado y offline.', body);
}

function renderDetalle(kind, id) {
  var box = $('hmCamDet'); if (!box) return;
  var list = kind === 'r' ? HM_RUMBOS : HM_FUEGOS;
  var r = null;
  for (var i = 0; i < list.length; i++) if (list[i].id === id) r = list[i];
  if (!r) return;
  box.innerHTML = '<div class="si-card su-7266f7"><h4>' + r.ico + ' ' + esc(r.n) + '</h4>' +
    '<p class="su-6cb285">💡 ' + esc(r.idea) + '<br>🧭 <b>Te sirve si:</b> ' + esc(r.sirve) + '<br>🛠️ <b>Hoy:</b> ' + esc(r.practica) + '<br>⚠️ <b>Trampa:</b> ' + esc(r.trampa) + '<br>❓ <b>Pregúntate:</b> <i>' + esc(r.pregunta) + '</i></p></div>';
  try { box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
}

function openHombre() {
  try {
    if ($('hmDiaFecha') && !$('hmDiaFecha').value) $('hmDiaFecha').value = todayKey();
    syncSenda(); renderSendaBox(); renderDiario(); renderHist(); renderStats(); updateProgreso();
  } catch (e) {}
  openDlg('hombreMedicinaDialog');
}
try { window.openHombreMedicina = openHombre; } catch (e) {}

function puenteMetodos() {
  try {
    var iv = setInterval(function () {
      var dlg = $('metodosDialog'); if (!dlg || !dlg.open) return;
      var btns = dlg.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i], t = (b.textContent || '').toLowerCase();
        if (t.indexOf('hombre medicina') >= 0 || t.indexOf('hombre-medicina') >= 0) {
          var open = document.createElement('button');
          open.type = 'button'; open.className = 'btn btn-accent'; open.style.width = 'auto'; open.style.marginLeft = '8px';
          open.textContent = '🦅 Abrir mi Hombre Medicina';
          open.onclick = function (ev) { try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {} openHombre(); };
          try { b.parentNode.insertBefore(open, b.nextSibling); } catch (e) { dlg.appendChild(open); }
          clearInterval(iv); return;
        }
      }
    }, 500);
  } catch (e) {}
}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar botón en Linaje > practicas (tras Tolteca si existe) */
  try {
    if (!$('btnHombreMedicina')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnHombreMedicina'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🦅 Hombre Medicina';
        try { btn.setAttribute('data-sub', 'practicas'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'hombre medicina guerrero wicasa visionario sanador sabio guardian rueda medicinal camino rojo tolteca castaneda cuatro rumbos recapitular servicio familia palabra cuerpo vision');
        var ref = g.querySelector('#btnTolteca') || g.querySelector('#btnRecap');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnHombreMedicina') < 0) ALL_BTNS.push('btnHombreMedicina');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnHombreMedicina = ['linaje', 'practicas'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|practicas'] && BTN_ORDER['linaje|practicas'].indexOf('btnHombreMedicina') < 0) {
      var oi = BTN_ORDER['linaje|practicas'].indexOf('btnTolteca');
      if (oi >= 0) BTN_ORDER['linaje|practicas'].splice(oi + 1, 0, 'btnHombreMedicina');
      else BTN_ORDER['linaje|practicas'].push('btnHombreMedicina');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnHombreMedicina = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnHombreMedicina"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnHombreMedicina"> 🦅 Hombre Medicina';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnHombreMedicina !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnHombreMedicina = lab.querySelector('input').checked;
                  if (typeof scheduleSave === 'function') scheduleSave();
                  if (typeof applyVisibility === 'function') applyVisibility();
                }
              } catch (e2) {}
            };
          } catch (e2) {}
        }
      });
    }
  } catch (e) {}
  try { addKw('btnMetodos', 'hombre medicina guerrero visionario rueda medicinal'); } catch (e2) {}
  try { addKw('btnTolteca', 'hombre medicina guerrero'); } catch (e3) {}
  try { addKw('btnLakota', 'hombre medicina wicasa guerrero'); } catch (e4) {}

  /* 4) diálogo */
  buildDialog();
  renderSendaBox();
  syncSenda();
  renderDiario();
  renderHist();
  renderStats();

  var b = $('btnHombreMedicina');
  if (b) b.onclick = function () { openHombre(); };

  ['Guia', 'Caminos', 'Pract', 'Test', 'Camino'].forEach(function (t) {
    var tb = $('tabHm' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var q = $('hmQ'); if (q) q.oninput = filterCaminos;
  document.querySelectorAll('#hmRumGrid .habit-item, #hmCamGrid .habit-item').forEach(function (card) {
    card.onclick = function (ev) {
      if (ev.target && (ev.target.tagName === 'BUTTON' || ev.target.closest('button'))) return;
      var id = card.getAttribute('data-rumbo') || card.getAttribute('data-fuego');
      var kind = card.getAttribute('data-rumbo') ? 'r' : 'f';
      renderDetalle(kind, id);
    };
  });
  document.querySelectorAll('[data-fav]').forEach(function (bf) {
    bf.onclick = function (ev) {
      try { ev.stopPropagation(); } catch (e) {}
      var key = bf.getAttribute('data-fav');
      var d = store();
      var i = d.favs.indexOf(key);
      if (i >= 0) d.favs.splice(i, 1); else d.favs.push(key);
      save(i >= 0 ? 'Quitada de favoritas' : 'Guardada en favoritas ⭐');
      bf.textContent = i >= 0 ? '☆' : '⭐';
      renderStats();
    };
  });
  document.querySelectorAll('[data-walk]').forEach(function (bw) {
    bw.onclick = function (ev) {
      try { ev.stopPropagation(); } catch (e) {}
      var card = bw.closest('.habit-item');
      var name = '';
      try { name = (card.querySelector('b') || {}).textContent || 'camino'; } catch (e2) {}
      var k = todayKey();
      var d = store();
      d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🚶 Caminé: ' + name;
      save('Caminar anotado en tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
    };
  });
  document.querySelectorAll('.hm-pract-add').forEach(function (bp) {
    bp.onclick = function () {
      var k = todayKey();
      var d = store();
      d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🛠️ Practiqué: ' + bp.dataset.p;
      save('Práctica anotada en tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
    };
  });

  var sb = $('hmSilencioBtn'); if (sb) sb.onclick = runSilencio;
  var ps = $('hmPractSave');
  if (ps) ps.onclick = function () {
    var az = clean((($('hmAcechoHoy') || {}).value || ''), 140);
    var en = clean((($('hmEnsuenoHoy') || {}).value || ''), 140);
    var nh = clean((($('hmNoHacerHoy') || {}).value || ''), 100);
    if (!az && !en && !nh) { alert('Escribe al menos tu acecho, tu visión o tu no-hacer de hoy 🦅'); return; }
    var e = store();
    e.practs = e.practs.filter(function (r) { return r.fecha !== todayKey(); });
    e.practs.push({ id: uid('p'), fecha: todayKey(), acecho: az, ensueno: en, nohacer: nh });
    var txt = '🦅 Día guerrero';
    if (az) txt += ' · 🐾 ' + az;
    if (en) txt += ' · 🌙 ' + en;
    if (nh) txt += ' · 🌀 ' + nh;
    e.diario[todayKey()] = (e.diario[todayKey()] ? e.diario[todayKey()] + ' | ' : '') + txt;
    save('Día guerrero guardado ✓');
    if ($('hmAcechoHoy')) $('hmAcechoHoy').value = '';
    if ($('hmEnsuenoHoy')) $('hmEnsuenoHoy').value = '';
    if ($('hmNoHacerHoy')) $('hmNoHacerHoy').value = '';
    renderHist(); renderDiario(); renderStats();
  };
  var gr = $('hmGoRecap');
  if (gr) gr.onclick = function () { try { var r = $('btnRecap'); if (r) r.click(); else alert('Abre 🔁 Recapitulación desde Prácticas'); } catch (e) {} };
  var gs = $('hmGoResp');
  if (gs) gs.onclick = function () { try { var r2 = $('btnBreath'); if (r2) r2.click(); else alert('Abre 🌬️ Respiración desde Mi Día'); } catch (e) {} };
  var gl = $('hmGoLakota');
  if (gl) gl.onclick = function () { try { var r3 = $('btnLakota'); if (r3) r3.click(); else alert('Abre 🙏 Camino Lakota desde Cuerpo > Etapas'); } catch (e) {} };
  var gt = $('hmGoTolteca');
  if (gt) gt.onclick = function () { try { var r4 = $('btnTolteca'); if (r4) r4.click(); else if (window.openTolteca) window.openTolteca(); } catch (e) {} };
  var gm = $('hmGoMujer');
  if (gm) gm.onclick = function () { try { if (window.openMujerMedicina) window.openMujerMedicina(); else { var r5 = $('btnMujerMedicina'); if (r5) r5.click(); } } catch (e) {} };
  var gm2 = $('hmGoMujer2');
  if (gm2) gm2.onclick = function () { try { if (window.openMujerMedicina) window.openMujerMedicina(); else { var r6 = $('btnMujerMedicina'); if (r6) r6.click(); } } catch (e) {} };

  var tc = $('hmTestCalc');
  if (tc) tc.onclick = function () {
    var r = calcTest();
    if (r.contestadas < HM_TEST.length) { alert('Te faltan ' + (HM_TEST.length - r.contestadas) + ' por responder para un espejo fiel 🦅'); }
    showResultado(r.sc);
  };
  var tr = $('hmTestReset');
  if (tr) tr.onclick = function () {
    for (var i = 0; i < HM_TEST.length; i++) {
      document.querySelectorAll('input[name="hmQ' + i + '"]').forEach(function (x) { x.checked = false; });
    }
    var rb = $('hmResultado'); if (rb) rb.classList.add('hidden');
    updateProgreso();
  };
  document.querySelectorAll('#hmTestBox input[type="radio"]').forEach(function (x) {
    x.onchange = updateProgreso;
  });

  var ma = $('hmMiSenda');
  if (ma) ma.onchange = function () { var e = store(); e.miSenda = ma.value || ''; save('Tu senda guardada ✓'); renderSendaBox(); renderStats(); };
  var da = $('hmDiaAdd');
  if (da) da.onclick = function () {
    var f = ($('hmDiaFecha') || {}).value || todayKey();
    var t = clean((($('hmDiaTxt') || {}).value || ''), 300);
    if (!t) { alert('Escribe 1 línea de tu camino de hoy 🦅'); return; }
    var e = store();
    e.diario[f] = (e.diario[f] ? e.diario[f] + ' | ' : '') + t;
    save('Diario guardado ✓');
    if ($('hmDiaTxt')) $('hmDiaTxt').value = '';
    renderDiario(); renderStats();
  };
  var sh = $('hmShare');
  if (sh) sh.onclick = function () {
    var e = store();
    var nd = Object.keys(e.diario || {}).length;
    var c = e.miSenda && HM_SENDAS[e.miSenda] ? HM_SENDAS[e.miSenda].nombre : 'senda por definir';
    share('🦅 Mi Hombre Medicina', 'Camino del guerrero que sana · ' + c + '\n🔥 Racha: ' + rachaPracts() + ' días · ' + e.practs.length + ' días guerreros · ' + nd + ' días de diario · ' + e.tests.length + ' test(s).\n' + HM_LUNAS[0]);
  };
  var tn = $('hmToNote');
  if (tn) tn.onclick = function () {
    try {
      var e = store();
      var c2 = e.miSenda && HM_SENDAS[e.miSenda] ? HM_SENDAS[e.miSenda].nombre : 'camino del guerrero';
      var txt2 = '🦅 Hombre Medicina (' + c2 + ') · racha ' + rachaPracts() + 'd · ' + (e.diario[todayKey()] || 'hoy practico 1 rumbo + 1 no-hacer');
      if (typeof appendToTodayNote === 'function') { appendToTodayNote(txt2); save('Llevado a tu nota de hoy ✓'); }
      else if (typeof userData === 'function') {
        var u = userData();
        u.notas = u.notas || {}; var k = todayKey();
        u.notas[k] = u.notas[k] || {}; u.notas[k].nota = ((u.notas[k].nota || '') + '\n' + txt2).trim();
        save('Llevado a tu nota de hoy ✓');
      }
    } catch (e) {}
  };
  var cl = $('hmClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar todo tu camino del hombre medicina (tests, diario, días, favoritas)?')) return;
    try {
      var u = (typeof userData === 'function') ? userData() : null;
      if (u) u.hombreMedicina = blank();
    } catch (e) {}
    syncSenda(); renderSendaBox(); renderDiario(); renderHist(); renderStats();
    save('Camino del hombre medicina borrado');
  };

  puenteMetodos();
  updateProgreso();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
else setup();

})();
