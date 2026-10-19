/* ============================================================
   MUJER MEDICINA — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente:
   - Botón btnMujerMedicina (grupo Linaje > practicas, tras btnHombreMedicina)
   - Diálogo mujerMedicinaDialog con 5 pestañas:
     1) Guía (qué es y qué no es, linajes que la nombran:
        Mujer Búfalo Blanco, machi y lawentuchefe, curandera,
        partera y hierbatera, ciclicidad luna-cuerpo, 4 edades,
        ética y cuidados)
     2) Medicinas (4 lunas/edades + 7 medicinas: buscador,
        detalle, favorita, "florecer hoy")
     3) Prácticas (12 prácticas de la mujer medicina +
        reposo de luna 3 min + registro del día)
     4) Test (20 afirmaciones: ciclicidad, autocuidado,
        vínculos y don + nivel de ruido interno)
     5) Mi camino (mi medicina, diario, días, historial,
        racha, compartir, llevar a nota, borrar)
   - Todo local y privado por usuario: userData().mujerMedicina
     { tests:[], miMedicina:'', practs:[], diario:{}, favs:[] }
   - Puentes: Ciclo menstrual (🌸), Fertilidad (🌱), Climaterio (🔥),
     Hombre Medicina (🦅), Camino Lakota (🙏), Energía (⚡),
     Respiración (🌬️), Lawen Herbario (🌿), Métodos.
   - Educativo y respetuoso: no promete curaciones, no indica
     dosis ni tratamientos, no reemplaza matrona, CESFAM ni
     terapia. Deriva a control ginecológico y redes (*4141,
     149, 1455). Honra sin apropiar: invita a aprender con
     mujeres del territorio. 100% offline.
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
function blank() { return { tests: [], miMedicina: '', practs: [], diario: {}, favs: [] }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.mujerMedicina) u.mujerMedicina = blank();
    var e = u.mujerMedicina;
    if (!Array.isArray(e.tests)) e.tests = [];
    if (!Array.isArray(e.practs)) e.practs = [];
    if (!e.diario) e.diario = {};
    if (!Array.isArray(e.favs)) e.favs = [];
    if (typeof e.miMedicina !== 'string') e.miMedicina = '';
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
  ['Guia', 'Medici', 'Pract', 'Test', 'Camino'].forEach(function (t) {
    var p = $('mm' + t), b = $('tabMm' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ============================================================
   DATOS — 4 lunas/edades + 7 medicinas
   ============================================================ */
var MM_LUNAS_EDAD = [
  { id: 'doncella', n: '🌑 Luna Negra · La Doncella (Este)', ico: '🌱', color: '#ffd166',
    idea: 'La niña que descubre: curiosidad, juego y aprendizaje. Su medicina es preguntar y probar. Aquí se siembra autoestima: tu cuerpo es tuyo, tu no es completo, tu voz vale.',
    sirve: 'Niñas y jóvenes que necesitan límites claros, información honesta y adultas que escuchen sin juzgar.',
    practica: 'Si acompañas a una niña: 1 caminata + 1 pregunta abierta por semana ("¿qué te gustó hoy?"). Si eres joven: escribe 3 cosas que te hacen única.',
    trampa: 'Apurarla a "ser señorita". Cada una a su ritmo; informar no es incitar.',
    pregunta: '¿Qué necesita mi niña interior que aún no se atrevió a pedir?' },
  { id: 'madre', n: '🌓 Luna Creciente · La Madre (Sur)', ico: '🌸', color: '#ef476f',
    idea: 'La mujer que crea y sostiene: hijas/os, proyectos, casas, huertas, barrios. Su medicina es nutrir sin anularse. Madre no es solo parir: es gestar vida en todas sus formas.',
    sirve: 'Sobrecarga de cuidados, culpa por descansar, postergación eterna de la propia salud.',
    practica: 'Agenda 1 hora semanal intocable para ti (baño largo, caminata, tejido). Pedir ayuda también es cuidar.',
    trampa: 'El sacrificio como identidad ("buena madre = agotada"). Cansada crías cansancio.',
    pregunta: '¿Qué necesito yo para seguir dando sin romperme?' },
  { id: 'tejedora', n: '🌕 Luna Llena · La Tejedora (Oeste)', ico: '🧶', color: '#118ab2',
    idea: 'La mujer madura que une: teje familia, memoria y comunidad. Su medicina es la palabra que cose y el perdón que libera. Revisa su historia y devuelve en consejo lo aprendido.',
    sirve: 'Nido que se vacía, pareja que cambia, duelos no llorados, rabia guardada.',
    practica: 'Teje 1 hebra literal o simbólica: escribe 1 carta de gratitud y 1 de perdón esta luna (enviarlas es opcional).',
    trampa: 'Controlarlo todo para no sentir el cambio. Tejer es unir, no amarrar.',
    pregunta: '¿Qué historia mía, contada con amor, puede abrigar a otra?' },
  { id: 'sabia', n: '🌗 Luna Menguante · La Sabia (Norte)', ico: '🦉', color: '#8fd694',
    idea: 'La mayor que ve y nombra: su medicina es el consejo justo y el silencio que ordena. Honrarla es escucharla; serla es servir sin manejar la vida ajena.',
    sirve: 'Climaterio, invisibilidad de la mujer mayor, legado sin transmitir.',
    practica: 'Visita a 1 sabia esta luna. Pregunta 1 receta, 1 remedio casero suave o 1 historia y anótala en 🗣️ Voces de los Abuelos.',
    trampa: 'Amargura disfrazada de sabiduría. La sabia ilumina, no sentencia.',
    pregunta: '¿Qué semilla dejo para las que vienen?' }
];

var MM_MEDICINAS = [
  { id: 'tierra', n: 'Medicina de la Tierra', ico: '🌿', tag: 'tierra huerta lawen plantas pies descalza',
    idea: 'Pies en la tierra, manos en la huerta. La tierra regula: caminar descalza, sembrar y oler el lawen calma el sistema nervioso mejor que mil pantallas.',
    sirve: 'Ansiedad, insomnio, cabeza que no para.',
    practica: 'Hoy: 10 min descalza en patio/playa + riega u huele 1 planta nombrándola.',
    trampa: 'Coleccionar plantas sin cuidarlas. Una bien cuidada vale más que diez secas.',
    pregunta: '¿Cuándo toqué tierra por última vez?' },
  { id: 'agua', n: 'Medicina del Agua', ico: '💧', tag: 'agua mar rio ducha luna baño hierbas',
    idea: 'El agua lava por fuera y por dentro: ducha consciente, orilla del mar, lluvia en la cara. En Penco el mar está a pasos: úsalo con respeto y abrigo.',
    sirve: 'Pena estancada, enojo caliente, cuerpo contracturado.',
    practica: 'Ducha de luna: agua tibia + 3 respiraciones + intención ("suelto…"). Sin apuro.',
    trampa: 'Baños calientes eternos que resecan y marean. Ritual breve y presente.',
    pregunta: '¿Qué suelto hoy al agua?' },
  { id: 'fuego', n: 'Medicina del Fuego', ico: '🔥', tag: 'fuego vela cocina calor ciclo energia',
    idea: 'El fuego transforma: cocinar lento para la familia, vela de intención, calor en vientre en días de luna (guatero). Cocinar es la alquimia diaria de la mujer medicina.',
    sirve: 'Frialdad, desgano, casa sin calor de hogar.',
    practica: 'Cocina 1 comida lenta esta semana sin apuro ni celu. Prende 1 vela con intención.',
    trampa: 'Quemarte por atenderlo todo. El fuego se cuida con límites.',
    pregunta: '¿Qué quiero transformar con mi calor?' },
  { id: 'aire', n: 'Medicina del Aire', ico: '🌬️', tag: 'aire respiracion canto palabra silencio voz',
    idea: 'Respirar y cantar ordenan: la voz es medicina. Cantar en la cocina, rezar, contar historias —todo ventila el pecho.',
    sirve: 'Nudo en garganta, cosas no dichas, angustia.',
    practica: '4-6 × 4 + canta 1 canción completa hoy (aunque "cantes mal"). Puente: 🌬️ Respiración.',
    trampa: 'Tragarse todo "para no pelear". El silencio sana; el tragar enferma.',
    pregunta: '¿Qué necesita salir por mi voz?' },
  { id: 'manos', n: 'Medicina de las Manos', ico: '🤲', tag: 'manos masaje tejido cocinar sanar tacto',
    idea: 'Manos que tejen, amasan, sostienen cabezas con fiebre. El tacto amoroso —propio y a otros con consentimiento— es la primera farmacia.',
    sirve: 'Manos vacías, auto-toque olvidado, familia sin contacto.',
    practica: 'Automásate 5 min (pies o vientre con aceite tibio) + 1 abrazo largo de 20 segundos.',
    trampa: 'Tocar solo para servir y nunca para recibir. Recibir también es medicina.',
    pregunta: '¿Qué sanan mis manos hoy?' },
  { id: 'canto', n: 'Medicina del Canto y la Palabra', ico: '🎶', tag: 'canto palabra arrullo historia gratitud rezo',
    idea: 'Arrullos, cantos de trabajo, historias de abuela: la palabra cantada cose generaciones. Tu diario y tu voz son archivo vivo.',
    sirve: 'Memoria que se pierde, niñas sin referentes, pena sin nombre.',
    practica: 'Graba o escribe 1 historia de tu madre/abuela en 🗣️ Voces de los Abuelos.',
    trampa: 'Hablar de todas menos de ti. Tu historia también cuenta.',
    pregunta: '¿Qué canto heredo y cuál invento?' },
  { id: 'circulo', n: 'Medicina del Círculo', ico: '⭕', tag: 'circulo amigas red apoyo comunidad sororidad',
    idea: 'Ninguna se sana sola: el círculo de mujeres (mate, tejido, caminata, luna) sostiene lo que la casa no alcanza. Pedir ayuda es medicina mayor.',
    sirve: 'Soledad, sobrecarga, violencia silenciada.',
    practica: 'Junta 1 círculo este mes (2+ mujeres, 1 hora, sin pantallas). Regla: se escucha, no se juzga.',
    trampa: 'Círculo que se vuelve chisme. Acuerdo inicial: confidencialidad y respeto.',
    pregunta: '¿A quién llamo cuando me desbordo?' }
];

var MM_PRACTICAS = [
  { n: 'Altar de luna', ico: '🌙', min: 5, txt: 'En tu velador: vela, piedra de playa, foto o planta. Cada noche míralo 1 min, agradece 1 cosa y pide guía para 1 tema. Simple y constante.' },
  { n: 'Baño de hierbas suave', ico: '🛁', min: 15, txt: 'Man Zanilla, matico suave o solo agua tibia + respiración. No es tratamiento médico: es descanso. Embarazo, alergias o irritación: consulta matrona antes de usar hierbas.' },
  { n: 'Caminata de orilla', ico: '🌊', min: 20, txt: '20 min por borde costero o humedal sin audífonos. Recoge 1 basura. Pregunta: "¿qué necesita mi cuerpo esta luna?".' },
  { n: 'Tejido o manos lentas', ico: '🧶', min: 20, txt: 'Tejer, bordar, amasar o dibujar 20 min. Las manos lentas ordenan la cabeza. Sin tutorial: solo hacer.' },
  { n: 'Canto de cocina', ico: '🎶', min: 5, txt: 'Canta 1 canción mientras cocinas o ordenas. Si hay niñas cerca, invítalas: el canto se hereda cantando.' },
  { n: 'Reposo de luna (3 min)', ico: '🕯️', min: 3, txt: 'Acuéstate, manos en vientre, respira 4-6. Nada que lograr: solo estar. Usa el temporizador de abajo.' },
  { n: 'Carta a mi linaje', ico: '✉️', min: 15, txt: 'Escribe a tu madre/abuela/hija (viva o partida): 1 gratitud + 1 perdón + 1 promesa. Enviar es opcional; escribir ya libera.' },
  { n: 'Círculo de mate', ico: '🧉', min: 30, txt: 'Invita a 1–2 mujeres a un mate sin pantallas. 1 ronda cada una: "¿cómo estoy de verdad?". Escuchar sin arreglar.' },
  { n: 'Huerta de 1 maceta', ico: '🪴', min: 10, txt: 'Siembra o cuida 1 planta comestible o medicinal común (menta, orégano, manzanilla). Regar a diario es tu meditación verde.' },
  { n: 'Ayuno de exigencia', ico: '🤍', min: 0, txt: '24 h sin criticarte al espejo. Cada crítica: cámbiala por 1 dato neutro ("tengo ojeras" → "dormí poco, me acuesto temprano").' },
  { n: 'Mesa sin pantallas', ico: '🍲', min: 30, txt: '1 comida al día sin pantallas con tu gente. Pregunta cómo están y escucha 5 min sin aconsejar.' },
  { n: 'Voto de luna', ico: '🌕', min: 10, txt: 'Cada luna nueva elige 1 voto amable (ej: "camino 3×/semana"). Revísalo en llena y menguante, sin látigo.' }
];

var MM_TEST = [
  'Escucho a mi cuerpo y descanso cuando lo pide (sin culpa eterna).',
  'Conozco mi ciclo (o mi ritmo si ya no menstrúo) y lo registro.',
  'Pido ayuda antes de reventar.',
  'Digo no sin dar mil explicaciones.',
  'Tengo 1 espacio/hora semanal solo para mí.',
  'Como y duermo lo suficiente la mayoría de los días.',
  'Me hablo con respeto frente al espejo.',
  'Expreso lo que siento sin gritar ni tragarme todo.',
  'Pongo límites con amor (hijos, pareja, pega, familia).',
  'Tengo al menos 1 mujer de confianza para hablar de verdad.',
  'Perdono y suelto en vez de guardar años.',
  'Honro a mis mayores: las llamo, visito o recuerdo.',
  'Cuido mi territorio: planto, limpio o no ensucio.',
  'Canto, bailo o creo algo por puro gusto.',
  'Agradezco en voz alta cada día.',
  'Ordeno mi plata: sé cuánto entra y sale.',
  'Voy a mis controles (matrona, PAP, mamografía según edad).',
  'Siento que mi vida tiene sentido más allá de servir.',
  'Reparo rápido cuando hiero (menos de 48 h).',
  'Dejo un legado: enseño algo a una niña o joven.'
];

var MM_DONES = {
  tierra: { nombre: '🌿 La de la Tierra', txt: 'Tu don es sostener: huerta, casa y cuerpo. Sanas con lo concreto —comida, abrigo, tierra—. Cuida no agotarte sosteniendo a todos.' },
  agua: { nombre: '💧 La del Agua', txt: 'Tu don es sentir y lavar: lloras, nombras y liberas. Sanas con ternura y escucha. Cuida no ahogarte en penas ajenas.' },
  fuego: { nombre: '🔥 La del Fuego', txt: 'Tu don es transformar: cocinas, impulsas, enciendes. Sanas con calor y coraje. Cuida no quemarte por darlo todo.' },
  aire: { nombre: '🌬️ La del Aire', txt: 'Tu don es la palabra: cantas, cuentas, aclaras. Sanas nombrando lo invisible. Cuida tu silencio también.' },
  circulo: { nombre: '⭕ La del Círculo', txt: 'Tu don es unir: juntas, tejes redes, cuidas comunidad. Sanas acompañando. Cuida tener tu propio círculo que te sostenga.' }
};

var MM_LUNAS_GUIA = [
  '🌙 Luna 1 · Registra tu ritmo: anota energía, ánimo y ciclo (o sueño y ánimo si estás en climaterio) cada noche.',
  '🌙 Luna 2 · Elige 1 medicina foco (tierra, agua, manos...) y 1 práctica diaria mínima.',
  '🌙 Luna 3 · Abre tu círculo: invita a 1 mujer a caminar o matear. Lo que se comparte, se multiplica.'
];

/* ============================================================
   RENDER
   ============================================================ */
function edadesHTML() {
  return MM_LUNAS_EDAD.map(function (r) {
    var fav = store().favs.indexOf('e:' + r.id) >= 0 ? '⭐' : '☆';
    return '<div class="habit-item" data-edad="' + r.id + '">' +
      '<div class="su-6bf84b"><span><span class="su-b9199e">' + r.ico + '</span> <b>' + esc(r.n) + '</b></span>' +
      '<button class="btn btn-icon su-337714" data-fav="e:' + r.id + '" title="Marcar favorita">' + fav + '</button></div>' +
      '<div class="edad-det hidden su-cdff1d">' +
      '<p>💡 ' + esc(r.idea) + '</p>' +
      '<p>🧭 <b>Te sirve si:</b> ' + esc(r.sirve) + '</p>' +
      '<p>🛠️ <b>Hoy:</b> ' + esc(r.practica) + '</p>' +
      '<p>⚠️ <b>Trampa:</b> ' + esc(r.trampa) + '</p>' +
      '<p>❓ <b>Pregúntate:</b> <i>' + esc(r.pregunta) + '</i></p>' +
      '<div class="su-faf7a9"><button class="btn su-337714" data-bloom="e">🌸 Florecer hoy</button></div></div></div>';
  }).join('');
}
function medicinasHTML() {
  return MM_MEDICINAS.map(function (r) {
    var fav = store().favs.indexOf('m:' + r.id) >= 0 ? '⭐' : '☆';
    return '<div class="habit-item" data-med="' + r.id + '">' +
      '<div class="su-6bf84b"><span><span class="su-b9199e">' + r.ico + '</span> <b>' + esc(r.n) + '</b></span>' +
      '<button class="btn btn-icon su-337714" data-fav="m:' + r.id + '" title="Marcar favorita">' + fav + '</button></div>' +
      '<div class="med-det hidden su-cdff1d">' +
      '<p>💡 ' + esc(r.idea) + '</p>' +
      '<p>🧭 <b>Te sirve si:</b> ' + esc(r.sirve) + '</p>' +
      '<p>🛠️ <b>Hoy:</b> ' + esc(r.practica) + '</p>' +
      '<p>⚠️ <b>Trampa:</b> ' + esc(r.trampa) + '</p>' +
      '<p>❓ <b>Pregúntate:</b> <i>' + esc(r.pregunta) + '</i></p>' +
      '<div class="su-faf7a9"><button class="btn su-337714" data-bloom="m">🌸 Florecer hoy</button></div></div></div>';
  }).join('');
}
function practicasHTML() {
  return MM_PRACTICAS.map(function (p) {
    return '<div class="habit-item"><div class="su-6bf84b"><span><span class="su-4ff818">' + p.ico + '</span> <b>' + esc(p.n) + '</b> <span class="chip su-0d5be0">' + p.min + ' min</span></span></div>' +
      '<div class="muted su-cdff1d">' + esc(p.txt) + '</div>' +
      '<div class="su-faf7a9"><button class="btn su-337714 mm-pract-add" data-p="' + esc(p.n) + '">✓ La practiqué hoy</button></div></div>';
  }).join('');
}
function testHTML() {
  return MM_TEST.map(function (t, i) {
    return '<div class="habit-item"><div><b>' + (i + 1) + '.</b> ' + esc(t) + '</div>' +
      '<div class="su-faf7a9" role="radiogroup" aria-label="Pregunta ' + (i + 1) + '">' +
      [0, 1, 2, 3].map(function (v) {
        var lab = ['Nunca', 'A veces', 'Seguido', 'Siempre'][v];
        return '<label class="su-337714"><input type="radio" name="mmQ' + i + '" value="' + v + '"> ' + lab + '</label>';
      }).join(' ') + '</div></div>';
  }).join('');
}
function calcTest() {
  var sc = 0, contestadas = 0;
  for (var i = 0; i < MM_TEST.length; i++) {
    var sel = null;
    try { sel = document.querySelector('input[name="mmQ' + i + '"]:checked'); } catch (e) {}
    if (sel) { sc += +sel.value; contestadas++; }
  }
  return { sc: sc, contestadas: contestadas };
}
function nivelTest(sc) {
  var pct = Math.round(sc / (MM_TEST.length * 3) * 100);
  if (pct < 35) return { t: '🌱 Semilla', d: 'Estás empezando a volverte hacia ti. Elige 1 medicina (agua o tierra) y 1 hora semanal intocable. Pedir ayuda es tu primera medicina.' };
  if (pct < 60) return { t: '🌸 En flor', d: 'Ya te cuidas a ratos. Sostén 2 prácticas (1 cuerpo + 1 círculo) y registra tu ritmo 1 luna completa.' };
  if (pct < 82) return { t: '🌕 Luna llena', d: 'Sostienes y nutres. Profundiza: carta a tu linaje + voto de luna + abrir círculo mensual.' };
  return { t: '🦉 Sabia que teje', d: 'Cuidas y transmites. Tu paso es legar: enseña 1 saber a 1 niña o joven y escribe tu historia en Voces de los Abuelos.' };
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
  var box = $('mmStats'); if (!box) return;
  var e = store();
  var nd = Object.keys(e.diario || {}).length;
  var don = e.miMedicina && MM_DONES[e.miMedicina] ? MM_DONES[e.miMedicina].nombre : 'medicina por descubrir';
  box.innerHTML = '🌕 <b>' + esc(don) + '</b> · 🔥 racha ' + rachaPracts() + ' días · 📓 ' + nd + ' días de diario · 🧪 ' + e.tests.length + ' test(s) · ⭐ ' + e.favs.length + ' favoritas';
}
function renderDiario() {
  var box = $('mmDiario'); if (!box) return;
  var e = store();
  var ks = Object.keys(e.diario || {}).sort().reverse().slice(0, 30);
  if (!ks.length) { box.innerHTML = '<p class="muted">Aún sin registros. Anota 1 línea por noche: lo que se nombra, se ordena.</p>'; return; }
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
  var box = $('mmHist'); if (!box) return;
  var e = store();
  var arr = (e.practs || []).slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 30);
  if (!arr.length) { box.innerHTML = '<p class="muted">Sin días registrados. Guarda tu primer día abajo.</p>'; return; }
  box.innerHTML = arr.map(function (r) {
    return '<div class="habit-item"><div><b>' + esc(r.fecha || '') + '</b> <span class="muted">' + esc(lunaTxt(r.fecha || '')) + '</span></div>' +
      '<div class="su-cdff1d">🌊 ' + esc(r.siento || '—') + '<br>🌸 ' + esc(r.necesito || '—') + '<br>🤍 ' + esc(r.suelto || '—') + '</div>' +
      '<div class="su-faf7a9"><button class="btn su-9b8fb7" data-hdel="' + r.id + '">✕</button></div></div>';
  }).join('');
  box.querySelectorAll('[data-hdel]').forEach(function (b) {
    b.onclick = function () { var d = store(); d.practs = d.practs.filter(function (x) { return x.id !== b.getAttribute('data-hdel'); }); save(); renderHist(); renderStats(); };
  });
}
function renderDonBox() {
  var box = $('mmDonBox'); if (!box) return;
  var e = store();
  if (!e.miMedicina || !MM_DONES[e.miMedicina]) { box.innerHTML = '<p class="muted">Elige tu medicina abajo: la que te nazca hoy puede cambiar en 3 lunas. Lo importante es florecerla.</p>'; return; }
  var s = MM_DONES[e.miMedicina];
  box.innerHTML = '<div class="si-card su-7266f7"><h4>' + esc(s.nombre) + ' — tu medicina actual</h4><p class="su-6cb285">' + esc(s.txt) + '</p></div>';
}
function syncDon() {
  var sel = $('mmMiMedicina'); if (!sel) return;
  var e = store();
  if ([...sel.options].some(function (o) { return o.value === e.miMedicina; })) sel.value = e.miMedicina;
}
function showResultado(sc) {
  var box = $('mmResultado'); if (!box) return;
  var nv = nivelTest(sc);
  var pct = Math.round(sc / (MM_TEST.length * 3) * 100);
  box.classList.remove('hidden');
  box.innerHTML = '<div class="si-card su-7266f7"><h4>' + esc(nv.t) + ' · ' + pct + '%</h4><p class="su-6cb285">' + esc(nv.d) + '</p>' +
    '<div class="su-faf7a9"><button class="btn su-337714" id="mmSaveTest">💾 Guardar este test</button></div></div>';
  var sv = $('mmSaveTest');
  if (sv) sv.onclick = function () {
    var e = store();
    e.tests.push({ id: uid('t'), fecha: todayKey(), puntaje: sc, nivel: nv.t });
    save('Test guardado ✓'); renderStats();
    try { box.querySelector('#mmSaveTest').textContent = '✓ Guardado'; } catch (e2) {}
  };
}
function updateProgreso() {
  var r = calcTest(), bar = $('mmTestBar'), lab = $('mmTestLab');
  if (bar) bar.style.width = Math.round(r.contestadas / MM_TEST.length * 100) + '%';
  if (lab) lab.textContent = r.contestadas + '/' + MM_TEST.length + ' respondidas';
}
function filterMed() {
  var q = (($('mmQ') || {}).value || '').toLowerCase();
  document.querySelectorAll('#mmEdadGrid .habit-item, #mmMedGrid .habit-item').forEach(function (card) {
    var t = (card.textContent || '').toLowerCase();
    card.style.display = (!q || t.indexOf(q) >= 0) ? '' : 'none';
  });
}
function runReposo() {
  var total = 180, left = total;
  var lab = $('mmReposoLab'), bar = $('mmReposoBar'), btn = $('mmReposoBtn');
  if (btn) btn.disabled = true;
  var iv = setInterval(function () {
    left -= 1;
    var m = Math.floor(left / 60), s = left % 60;
    if (lab) lab.textContent = '🌕 ' + m + ':' + String(s).padStart(2, '0') + ' — manos en vientre, respira 4-6';
    if (bar) bar.style.width = Math.round((total - left) / total * 100) + '%';
    if (left <= 0) {
      clearInterval(iv);
      if (lab) lab.textContent = '✓ Reposo completo. Anota 1 línea en tu diario.';
      if (btn) btn.disabled = false;
    }
  }, 1000);
}

/* ============================================================
   DIALOG
   ============================================================ */
function buildDialog() {
  var donOpts = Object.keys(MM_DONES).map(function (k) {
    return '<option value="' + k + '">' + esc(MM_DONES[k].nombre) + '</option>';
  }).join('');
  var body =
    '<div class="su-faf7a9">' +
    '<button type="button" class="btn btn-accent" id="tabMmGuia">🧭 Guía</button>' +
    '<button type="button" class="btn" id="tabMmMedici">🌸 Medicinas (11)</button>' +
    '<button type="button" class="btn" id="tabMmPract">🛠️ Prácticas</button>' +
    '<button type="button" class="btn" id="tabMmTest">🧪 Test</button>' +
    '<button type="button" class="btn" id="tabMmCamino">📓 Mi camino</button></div>' +
    /* GUIA */
    '<div id="mmGuia">' +
    '<div class="si-card su-7266f7"><h4>🌕 ¿Qué es la Mujer Medicina?</h4>' +
    '<p class="su-6cb285">En muchos pueblos de Abya Yala hay un oficio parecido con distintos nombres: la <b>Mujer Búfalo Blanco</b> lakota que trae el equilibrio, la <b>machi y lawentuchefe</b> mapuche que conoce el lawen, la <b>curandera, partera y hierbatera</b> de cada barrio. En común: <b>la mujer que sana porque primero se escucha</b> —su cuerpo, su ciclo, su intuición— y pone ese saber al servicio de su familia y territorio. Esta sección traduce ese camino a tu vida en Penco: casa, trabajo, crianza, barrio y borde costero.</p></div>' +
    '<div class="si-card su-7266f7"><h4>🚫 Lo que NO es (para florecer sin dañar)</h4>' +
    '<p class="su-6cb285">• No es mandato de ser madre, ni de ser "femenina" de una sola forma: cada mujer define su camino.<br>' +
    '• No es un título que se compra en un fin de semana: el saber real se aprende años junto a mujeres mayores.<br>' +
    '• No indica dosis, tratamientos ni "limpiezas": aquí no se recetan hierbas por dentro (respeto + ley + salud).<br>' +
    '• No promete curar enfermedades ni endulzar parejas: eso es delicado y a veces riesgoso.<br>' +
    '• No reemplaza matrona, PAP, mamografía, CESFAM ni terapia. Sangrados muy abundantes, dolor que frena tu vida, pérdidas de embarazo o violencia: derivación directa (CESFAM · 149 · 1455).<br>' +
    '• No se apropia: nos inspiramos con respeto y nombramos la fuente; si quieres profundizar, aprende con mujeres del territorio, en persona.</p></div>' +
    '<div class="si-card su-7266f7"><h4>🌙 Tu ciclicidad es brújula (con o sin menstruación)</h4>' +
    '<p class="su-6cb285">Si menstrúas, tu energía cambia con el ciclo —no es falla, es ritmo—. Si estás en climaterio, embarazada, lactando o no menstrúas, tu ritmo vive igual en el <b>sueño, el ánimo y la luna</b>. Este calendario de 13 lunas es perfecto para registrarlo: anota cada noche 1 línea y en 3 lunas verás tu dibujo.<br>Puentes: 🌸 <b>Ciclo</b>, 🌱 <b>Fertilidad Natural</b> y 🔥 <b>Climaterio</b> profundizan cada etapa con controles y señales de alarma.</p></div>' +
    '<div class="si-card su-7266f7"><h4>🛤️ Cómo florecer sin grupo (Penco real)</h4>' +
    '<p class="su-6cb285">1) Elige tu <b>medicina</b> en Mi camino.<br>2) Marca <b>1 edad + 1 medicina</b> como foco de la luna.<br>3) Practica <b>1 cosa diaria</b> (5–20 min) y anótala.<br>4) Haz el <b>test</b> hoy y en 1 luna: compara.<br>5) Abre <b>1 círculo</b> al mes (aunque sean 2 con mate).<br>Si puedes, camina con tu hija, tu madre, una amiga o una mayor: la medicina rinde más en círculo.</p></div>' +
    '<div class="su-faf7a9"><button type="button" class="btn su-337714" id="mmGoCiclo">🌸 Ver mi Ciclo</button> ' +
    '<button type="button" class="btn su-337714" id="mmGoLawen">🌿 Ver Lawen Herbario</button> ' +
    '<button type="button" class="btn su-337714" id="mmGoHombre">🦅 Ver Hombre Medicina</button></div>' +
    '<div class="muted su-116966">🌙 ' + esc(MM_LUNAS_GUIA[0]) + '<br>🌙 ' + esc(MM_LUNAS_GUIA[1]) + '<br>🌙 ' + esc(MM_LUNAS_GUIA[2]) + '</div>' +
    '</div>' +
    /* MEDICINAS */
    '<div id="mmMedici" class="hidden">' +
    '<div class="su-faf7a9"><input type="search" id="mmQ" placeholder="🔍 Buscar (ej: tierra, agua, círculo, perdón...)" autocomplete="off" aria-label="Buscar medicinas"></div>' +
    '<h4 class="su-ee0cfe">🌙 Las 4 lunas / edades</h4><div id="mmEdadGrid">' + edadesHTML() + '</div>' +
    '<h4 class="su-ee0cfe">🌸 Las 7 medicinas</h4><div id="mmMedGrid">' + medicinasHTML() + '</div>' +
    '<div id="mmMedDet" class="su-cdff1d"></div></div>' +
    /* PRACT */
    '<div id="mmPract" class="hidden">' +
    '<div class="si-card su-7266f7"><h4>🕯️ Reposo de luna · 3 minutos</h4>' +
    '<p class="su-6cb285">Acuéstate o siéntate cómoda, manos en el vientre. Inhala 4, exhala 6. Si la cabeza corre a la lista de pendientes, vuelve al calor de tus manos.</p>' +
    '<div class="su-faf7a9"><button type="button" class="btn btn-accent" id="mmReposoBtn">▶ Iniciar 3 min</button> <span id="mmReposoLab" class="muted">Lista cuando tú lo estés.</span></div>' +
    '<div class="su-fdefb3"><div id="mmReposoBar" class="su-4e745d"></div></div></div>' +
    '<div id="mmPractGrid">' + practicasHTML() + '</div>' +
    '<div class="si-card su-7266f7"><h4>📓 Registro del día de luna</h4>' +
    '<div class="su-faf7a9"><input id="mmSientoHoy" placeholder="🌊 Hoy siento... (ej: cansada pero tranquila)" aria-label="Hoy siento">' +
    '<input id="mmNecesitoHoy" placeholder="🌸 Hoy necesito... (ej: 1 hora sin interrupciones)" aria-label="Hoy necesito">' +
    '<input id="mmSueltoHoy" placeholder="🤍 Hoy suelto... (ej: la culpa por descansar)" aria-label="Hoy suelto">' +
    '<button type="button" class="btn btn-accent" id="mmPractSave">💾 Guardar día</button></div></div>' +
    '<div class="su-faf7a9"><button type="button" class="btn su-337714" id="mmGoCiclo2">🌸 Abrir mi Ciclo</button> ' +
    '<button type="button" class="btn su-337714" id="mmGoResp">🌬️ Abrir Respiración</button></div></div>' +
    /* TEST */
    '<div id="mmTest" class="hidden">' +
    '<p class="muted">20 afirmaciones · Nunca (0) a Siempre (3). Contesta honesta: es espejo, no examen. <span id="mmTestLab">0/20 respondidas</span></p>' +
    '<div class="su-fdefb3"><div id="mmTestBar" class="su-23d652"></div></div>' +
    '<div id="mmTestBox">' + testHTML() + '</div>' +
    '<div class="su-faf7a9"><button type="button" class="btn btn-accent" id="mmTestCalc">Ver mi espejo 🌕</button> ' +
    '<button type="button" class="btn su-337714" id="mmTestReset">Limpiar</button></div>' +
    '<div id="mmResultado" class="hidden"></div></div>' +
    /* CAMINO */
    '<div id="mmCamino" class="hidden">' +
    '<div id="mmStats" class="muted su-116966"></div>' +
    '<div id="mmDonBox"></div>' +
    '<div class="si-card su-7266f7"><h4>🌸 Elige tu medicina</h4>' +
    '<div class="su-faf7a9"><select id="mmMiMedicina" aria-label="Mi medicina">' +
    '<option value="">— Elige tu medicina —</option>' + donOpts + '</select></div>' +
    '<p class="muted su-77e2fe">No es para siempre: es tu foco de esta luna.</p></div>' +
    '<div class="si-card su-7266f7"><h4>📓 Diario del camino (privado)</h4>' +
    '<div class="su-faf7a9"><input type="date" id="mmDiaFecha" aria-label="Fecha"> ' +
    '<input id="mmDiaTxt" placeholder="1 línea honesta de hoy..." aria-label="Línea del diario"> ' +
    '<button type="button" class="btn btn-accent" id="mmDiaAdd">＋ Anotar</button></div>' +
    '<div id="mmDiario"></div></div>' +
    '<div class="si-card su-7266f7"><h4>🌙 Días de luna</h4><div id="mmHist"></div></div>' +
    '<div class="su-faf7a9"><button type="button" class="btn su-337714" id="mmShare">📤 Compartir mi avance</button> ' +
    '<button type="button" class="btn su-337714" id="mmToNote">📝 Llevar a nota de hoy</button> ' +
    '<button type="button" class="btn su-9b8fb7" id="mmClear">🗑 Borrar todo</button></div>' +
    '<div class="su-faf7a9"><button type="button" class="btn su-337714" id="mmGoHombre2">🦅 Ver Hombre Medicina (camino complementario)</button></div>' +
    '</div>';
  return makeDialog('mujerMedicinaDialog', '🌕 Mujer Medicina', 'Cuerpo, ciclo, manos y círculo: el camino de la que sana escuchándose. Local, privado y offline.', body);
}

function renderDetalle(kind, id) {
  var box = $('mmMedDet'); if (!box) return;
  var list = kind === 'e' ? MM_LUNAS_EDAD : MM_MEDICINAS;
  var r = null;
  for (var i = 0; i < list.length; i++) if (list[i].id === id) r = list[i];
  if (!r) return;
  box.innerHTML = '<div class="si-card su-7266f7"><h4>' + r.ico + ' ' + esc(r.n) + '</h4>' +
    '<p class="su-6cb285">💡 ' + esc(r.idea) + '<br>🧭 <b>Te sirve si:</b> ' + esc(r.sirve) + '<br>🛠️ <b>Hoy:</b> ' + esc(r.practica) + '<br>⚠️ <b>Trampa:</b> ' + esc(r.trampa) + '<br>❓ <b>Pregúntate:</b> <i>' + esc(r.pregunta) + '</i></p></div>';
  try { box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
}

function openMujer() {
  try {
    if ($('mmDiaFecha') && !$('mmDiaFecha').value) $('mmDiaFecha').value = todayKey();
    syncDon(); renderDonBox(); renderDiario(); renderHist(); renderStats(); updateProgreso();
  } catch (e) {}
  openDlg('mujerMedicinaDialog');
}
try { window.openMujerMedicina = openMujer; } catch (e) {}

function puenteMetodos() {
  try {
    var iv = setInterval(function () {
      var dlg = $('metodosDialog'); if (!dlg || !dlg.open) return;
      var btns = dlg.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i], t = (b.textContent || '').toLowerCase();
        if (t.indexOf('mujer medicina') >= 0 || t.indexOf('mujer-medicina') >= 0) {
          var open = document.createElement('button');
          open.type = 'button'; open.className = 'btn btn-accent'; open.style.width = 'auto'; open.style.marginLeft = '8px';
          open.textContent = '🌕 Abrir mi Mujer Medicina';
          open.onclick = function (ev) { try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {} openMujer(); };
          try { b.parentNode.insertBefore(open, b.nextSibling); } catch (e) { dlg.appendChild(open); }
          clearInterval(iv); return;
        }
      }
    }, 500);
  } catch (e) {}
}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar botón en Linaje > practicas (tras Hombre Medicina si existe, si no tras Tolteca) */
  try {
    if (!$('btnMujerMedicina')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnMujerMedicina'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🌕 Mujer Medicina';
        try { btn.setAttribute('data-sub', 'practicas'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'mujer medicina luna ciclo femenino curandera partera hierbatera machi lawentuchefe mujer bufalo blanco tejedora sabia doncella madre matrona climaterio fertilidad lawen circulo');
        var ref = g.querySelector('#btnHombreMedicina') || g.querySelector('#btnTolteca') || g.querySelector('#btnRecap');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnMujerMedicina') < 0) ALL_BTNS.push('btnMujerMedicina');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnMujerMedicina = ['linaje', 'practicas'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|practicas'] && BTN_ORDER['linaje|practicas'].indexOf('btnMujerMedicina') < 0) {
      var oi = BTN_ORDER['linaje|practicas'].indexOf('btnHombreMedicina');
      if (oi < 0) oi = BTN_ORDER['linaje|practicas'].indexOf('btnTolteca');
      if (oi >= 0) BTN_ORDER['linaje|practicas'].splice(oi + 1, 0, 'btnMujerMedicina');
      else BTN_ORDER['linaje|practicas'].push('btnMujerMedicina');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnMujerMedicina = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnMujerMedicina"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnMujerMedicina"> 🌕 Mujer Medicina';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnMujerMedicina !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnMujerMedicina = lab.querySelector('input').checked;
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
  try { addKw('btnMetodos', 'mujer medicina luna ciclo curandera'); } catch (e2) {}
  try { addKw('btnMenstrual', 'mujer medicina luna ciclo'); } catch (e3) {}
  try { addKw('btnLakota', 'mujer medicina bufalo blanco'); } catch (e4) {}

  /* 4) diálogo */
  buildDialog();
  renderDonBox();
  syncDon();
  renderDiario();
  renderHist();
  renderStats();

  var b = $('btnMujerMedicina');
  if (b) b.onclick = function () { openMujer(); };

  ['Guia', 'Medici', 'Pract', 'Test', 'Camino'].forEach(function (t) {
    var tb = $('tabMm' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var q = $('mmQ'); if (q) q.oninput = filterMed;
  document.querySelectorAll('#mmEdadGrid .habit-item, #mmMedGrid .habit-item').forEach(function (card) {
    card.onclick = function (ev) {
      if (ev.target && (ev.target.tagName === 'BUTTON' || ev.target.closest('button'))) return;
      var id = card.getAttribute('data-edad') || card.getAttribute('data-med');
      var kind = card.getAttribute('data-edad') ? 'e' : 'm';
      renderDetalle(kind, id);
    };
  });
  document.querySelectorAll('[data-fav]').forEach(function (bf) {
    if (!bf.closest('#mujerMedicinaDialog')) return;
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
  document.querySelectorAll('[data-bloom]').forEach(function (bw) {
    bw.onclick = function (ev) {
      try { ev.stopPropagation(); } catch (e) {}
      var card = bw.closest('.habit-item');
      var name = '';
      try { name = (card.querySelector('b') || {}).textContent || 'medicina'; } catch (e2) {}
      var k = todayKey();
      var d = store();
      d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🌸 Florecí: ' + name;
      save('Florecer anotado en tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
    };
  });
  document.querySelectorAll('.mm-pract-add').forEach(function (bp) {
    bp.onclick = function () {
      var k = todayKey();
      var d = store();
      d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🛠️ Practiqué: ' + bp.dataset.p;
      save('Práctica anotada en tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
    };
  });

  var sb = $('mmReposoBtn'); if (sb) sb.onclick = runReposo;
  var ps = $('mmPractSave');
  if (ps) ps.onclick = function () {
    var si = clean((($('mmSientoHoy') || {}).value || ''), 140);
    var ne = clean((($('mmNecesitoHoy') || {}).value || ''), 140);
    var su = clean((($('mmSueltoHoy') || {}).value || ''), 100);
    if (!si && !ne && !su) { alert('Escribe al menos qué sientes, necesitas o sueltas hoy 🌕'); return; }
    var e = store();
    e.practs = e.practs.filter(function (r) { return r.fecha !== todayKey(); });
    e.practs.push({ id: uid('p'), fecha: todayKey(), siento: si, necesito: ne, suelto: su });
    var txt = '🌕 Día de luna';
    if (si) txt += ' · 🌊 ' + si;
    if (ne) txt += ' · 🌸 ' + ne;
    if (su) txt += ' · 🤍 ' + su;
    e.diario[todayKey()] = (e.diario[todayKey()] ? e.diario[todayKey()] + ' | ' : '') + txt;
    save('Día de luna guardado ✓');
    if ($('mmSientoHoy')) $('mmSientoHoy').value = '';
    if ($('mmNecesitoHoy')) $('mmNecesitoHoy').value = '';
    if ($('mmSueltoHoy')) $('mmSueltoHoy').value = '';
    renderHist(); renderDiario(); renderStats();
  };
  var gc = $('mmGoCiclo');
  if (gc) gc.onclick = function () { try { var r = $('btnMenstrual'); if (r) r.click(); else alert('Abre 🌸 Ciclo desde Cuerpo > Ciclos'); } catch (e) {} };
  var gc2 = $('mmGoCiclo2');
  if (gc2) gc2.onclick = function () { try { var r2 = $('btnMenstrual'); if (r2) r2.click(); else alert('Abre 🌸 Ciclo desde Cuerpo > Ciclos'); } catch (e) {} };
  var gl = $('mmGoLawen');
  if (gl) gl.onclick = function () { try { var r3 = $('btnLawen'); if (r3) r3.click(); else alert('Abre 🌿 Lawen Herbario desde Territorio > Tierra'); } catch (e) {} };
  var gs = $('mmGoResp');
  if (gs) gs.onclick = function () { try { var r4 = $('btnBreath'); if (r4) r4.click(); else alert('Abre 🌬️ Respiración desde Mi Día'); } catch (e) {} };
  var gh = $('mmGoHombre');
  if (gh) gh.onclick = function () { try { if (window.openHombreMedicina) window.openHombreMedicina(); else { var r5 = $('btnHombreMedicina'); if (r5) r5.click(); } } catch (e) {} };
  var gh2 = $('mmGoHombre2');
  if (gh2) gh2.onclick = function () { try { if (window.openHombreMedicina) window.openHombreMedicina(); else { var r6 = $('btnHombreMedicina'); if (r6) r6.click(); } } catch (e) {} };

  var tc = $('mmTestCalc');
  if (tc) tc.onclick = function () {
    var r = calcTest();
    if (r.contestadas < MM_TEST.length) { alert('Te faltan ' + (MM_TEST.length - r.contestadas) + ' por responder para un espejo fiel 🌕'); }
    showResultado(r.sc);
  };
  var tr = $('mmTestReset');
  if (tr) tr.onclick = function () {
    for (var i = 0; i < MM_TEST.length; i++) {
      document.querySelectorAll('input[name="mmQ' + i + '"]').forEach(function (x) { x.checked = false; });
    }
    var rb = $('mmResultado'); if (rb) rb.classList.add('hidden');
    updateProgreso();
  };
  document.querySelectorAll('#mmTestBox input[type="radio"]').forEach(function (x) {
    x.onchange = updateProgreso;
  });

  var ma = $('mmMiMedicina');
  if (ma) ma.onchange = function () { var e = store(); e.miMedicina = ma.value || ''; save('Tu medicina guardada ✓'); renderDonBox(); renderStats(); };
  var da = $('mmDiaAdd');
  if (da) da.onclick = function () {
    var f = ($('mmDiaFecha') || {}).value || todayKey();
    var t = clean((($('mmDiaTxt') || {}).value || ''), 300);
    if (!t) { alert('Escribe 1 línea de tu camino de hoy 🌕'); return; }
    var e = store();
    e.diario[f] = (e.diario[f] ? e.diario[f] + ' | ' : '') + t;
    save('Diario guardado ✓');
    if ($('mmDiaTxt')) $('mmDiaTxt').value = '';
    renderDiario(); renderStats();
  };
  var sh = $('mmShare');
  if (sh) sh.onclick = function () {
    var e = store();
    var nd = Object.keys(e.diario || {}).length;
    var c = e.miMedicina && MM_DONES[e.miMedicina] ? MM_DONES[e.miMedicina].nombre : 'medicina por descubrir';
    share('🌕 Mi Mujer Medicina', 'Camino de la que sana escuchándose · ' + c + '\n🔥 Racha: ' + rachaPracts() + ' días · ' + e.practs.length + ' días de luna · ' + nd + ' días de diario · ' + e.tests.length + ' test(s).\n' + MM_LUNAS_GUIA[0]);
  };
  var tn = $('mmToNote');
  if (tn) tn.onclick = function () {
    try {
      var e = store();
      var c2 = e.miMedicina && MM_DONES[e.miMedicina] ? MM_DONES[e.miMedicina].nombre : 'camino de luna';
      var txt2 = '🌕 Mujer Medicina (' + c2 + ') · racha ' + rachaPracts() + 'd · ' + (e.diario[todayKey()] || 'hoy practico 1 medicina + 1 círculo');
      if (typeof appendToTodayNote === 'function') { appendToTodayNote(txt2); save('Llevado a tu nota de hoy ✓'); }
      else if (typeof userData === 'function') {
        var u = userData();
        u.notas = u.notas || {}; var k = todayKey();
        u.notas[k] = u.notas[k] || {}; u.notas[k].nota = ((u.notas[k].nota || '') + '\n' + txt2).trim();
        save('Llevado a tu nota de hoy ✓');
      }
    } catch (e) {}
  };
  var cl = $('mmClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar todo tu camino de la mujer medicina (tests, diario, días, favoritas)?')) return;
    try {
      var u = (typeof userData === 'function') ? userData() : null;
      if (u) u.mujerMedicina = blank();
    } catch (e) {}
    syncDon(); renderDonBox(); renderDiario(); renderHist(); renderStats();
    save('Camino de la mujer medicina borrado');
  };

  puenteMetodos();
  updateProgreso();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
else setup();

})();
