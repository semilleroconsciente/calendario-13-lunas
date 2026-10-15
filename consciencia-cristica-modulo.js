/* ============================================================
   CONSCIENCIA CRISTICA — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa e independiente:
   - Boton btnCristica (grupo Linaje > practicas, tras btnReiki)
   - Dialogo cristicaDialog con 6 pestanas:
     1) Guia (que es y que no es, Jesus historico, el Cristo
        como estado de amor-unidad, caminos que la nombran,
        senales de avance, 13 lunas, cuidados ecumenicos)
     2) Pilares (7 pilares: amor, perdon, humildad, verdad,
        servicio, unidad, gratitud: significado, vivirlo hoy,
        favorito, registro del dia)
     3) Palabras (12 ensenanzas: bienaventuranzas + parabolas
        en lenguaje simple: que dicen, para que sirven,
        practicar, escuchar)
     4) Practica (oracion-contemplacion guiada: secuencias
        manana/noche/perdon/servicio + paso a paso con
        temporizador + examen de amor + guardar sesion)
     5) Diario (intenciones y actos de amor: inventario,
        historial de practicas, compartir, llevar a nota)
     6) Mi avance (racha, totales, ciclo de 40 dias, por
        secuencia, ritmo sugerido, cierre de luna)
   - Todo local y privado por usuario:
     userData().cristica = { focos:[], ses:[], totalMin:0,
       favPilar:'', pilares:{} }
   - Puentes: Espiritu, Espirituales, Iglesias Penco, Duelo,
     Gratitud, Respiracion, Arbol (honrar), Metodos.
   - Ecumenico y respetuoso: no impone credo ni reemplaza
     iglesia, guia espiritual ni terapia. Sirve a catolico/a,
     evangelico/a, mapuche, buscador/a o laico/a: el amor
     como medida comun. 100% offline.
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
function blank() { return { focos: [], ses: [], totalMin: 0, favPilar: 'amor', pilares: {} }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.cristica) u.cristica = blank();
    var e = u.cristica;
    if (!Array.isArray(e.focos)) e.focos = [];
    if (!Array.isArray(e.ses)) e.ses = [];
    if (typeof e.totalMin !== 'number') e.totalMin = 0;
    if (typeof e.favPilar !== 'string') e.favPilar = 'amor';
    if (!e.pilares) e.pilares = {};
    return e;
  } catch (e2) { return blank(); }
}
function persistStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (u) u.cristica = store();
  } catch (e) {}
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
  ['Guia', 'Pilar', 'Pal', 'Pract', 'Diar', 'Ava'].forEach(function (t) {
    var p = $('cx' + t), b = $('tabCx' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}
function speak(text) {
  try {
    if (!('speechSynthesis' in window)) return alert('Audio no disponible en este dispositivo');
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-CL'; u.rate = 0.9;
    speechSynthesis.speak(u);
  } catch (e) { try { alert('Audio no disponible'); } catch (e2) {} }
}

/* ============================================================
   DATOS
   ============================================================ */
var CC_PILARES = [
  { id: 'amor', n: 'Amor que abraza', ico: '💗', color: '#e76e8a',
    que: 'El centro de todo: tratar al otro como me gustaría ser tratado/a, incluso al difícil. Sin amor, lo demás es ruido.',
    como: 'Hoy: 1 gesto concreto de cariño (palabra suave, visita, perdón pequeño). Pregunta: ¿qué haría el amor aquí?' },
  { id: 'perdon', n: 'Perdón que libera', ico: '🕊️', color: '#7ab8ff',
    que: 'Soltar la deuda: no justifico el daño ni me quedo expuesta/o, pero dejo de cargarlo. Perdonar 70 veces 7 = siempre.',
    como: 'Nombra a 1 persona y di: «te perdono, me perdono, suelto». Si hay daño grave, perdona dentro y pon límites fuera.' },
  { id: 'humildad', n: 'Humildad mansa', ico: '🌾', color: '#e8c56a',
    que: 'Ni más ni menos que nadie: sé pedir ayuda, reconocer errores y aprender del pequeño. Mansedumbre = fuerza serena.',
    como: 'Hoy: reconoce 1 error sin excusas y pide disculpas, o pide ayuda en algo que siempre haces sola/o.' },
  { id: 'verdad', n: 'Verdad sin miedo', ico: '🕯️', color: '#c9a9c9',
    que: 'Vivir en luz: decir lo verdadero con respeto, sin mentira ni máscara. La verdad dicha con amor sana.',
    como: 'Hoy: 1 conversación honesta pendiente (corta, clara, amable). Sin chisme: habla de frente o calla con paz.' },
  { id: 'servicio', n: 'Servicio alegre', ico: '🤲', color: '#8fd694',
    que: 'El más grande es el que sirve: lavar los pies = hacer lo humilde con alegría. Servir sin esperar aplauso.',
    como: 'Hoy: 1 servicio oculto (nadie lo sabrá): ordenar algo ajeno, cocinar, acompañar, dar lo que te cuesta.' },
  { id: 'unidad', n: 'Unidad sin muros', ico: '🤝', color: '#9d8df1',
    que: 'Un solo cuerpo: no hay judío ni griego, mapuche ni wingka ante el amor. Derribar el muro que separa.',
    como: 'Hoy: saluda e incluye a 1 persona distinta a ti (edad, credo, pueblo). Escucha su historia 5 minutos.' },
  { id: 'gratitud', n: 'Gratitud orante', ico: '🙏', color: '#ef9044',
    que: 'Orar sin cesar = vivir agradeciendo: el pan, el agua, la vida. Quien agradece, confía; quien confía, descansa.',
    como: 'Mano al corazón: nombra 3 dones de hoy y di «gracias, Señor / gracias, vida». Cierra el día agradeciendo.' }
];
var CC_PALABRAS = [
  { id: 'bienavent', n: 'Bienaventuranzas', cita: 'Mateo 5', ico: '⛰️', color: '#e8c56a',
    dice: 'Felices los pobres de espíritu, los que lloran, los mansos, los que tienen hambre de justicia, los misericordiosos, los limpios de corazón, los que trabajan por la paz.',
    sirve: 'El mapa del corazón crístico: la felicidad no está en tener, sino en ser manso, limpio y pacificador.',
    practica: 'Lee una cada mañana y pregúntate: ¿cuál me toca hoy? Vive solo esa durante el día.' },
  { id: 'sambuen', n: 'Buen samaritano', cita: 'Lucas 10', ico: '🫏', color: '#8fd694',
    dice: 'Un extranjero se detiene, cura y paga por un herido que los religiosos ignoraron. “¿Quién fue prójimo? El que tuvo misericordia”.',
    sirve: 'Prójimo no es el cercano: es cualquiera que sufre y me necesita. La fe sin obras de amor está muerta.',
    practica: 'Hoy detente ante 1 “herido del camino” (pena, soledad, necesidad) y haz algo concreto, aunque te desvíe.' },
  { id: 'hijo', n: 'Hijo pródigo', cita: 'Lucas 15', ico: '🏠', color: '#7ab8ff',
    dice: 'Un hijo malgasta todo y vuelve roto; el padre corre a abrazarlo antes de que hable. Fiesta por el que vuelve.',
    sirve: 'Dios/la Vida como abrazo que espera: siempre se puede volver. Y me invita a recibir así a quien vuelve.',
    practica: '¿A quién espero con brazos cruzados? Da hoy el primer paso: mensaje, visita o perdón silencioso.' },
  { id: 'sembrador', n: 'El sembrador', cita: 'Marcos 4', ico: '🌱', color: '#9d8df1',
    dice: 'La semilla cae en camino, piedras, espinos y tierra buena. Solo la tierra trabajada da fruto al 100.',
    sirve: 'Mi corazón es el terreno: ¿piedra (dureza), espinos (preocupaciones) o tierra buena (disponible)?',
    practica: 'Saca 1 “piedra” hoy (rencor) y 1 “espino” (preocupación escrita y entregada). Riega con 5 min de silencio.' },
  { id: 'talentos', n: 'Los talentos', cita: 'Mateo 25', ico: '💰', color: '#ef9044',
    dice: 'A cada uno se le confían dones; el que los esconde por miedo los pierde, el que los arriesga los multiplica.',
    sirve: 'Tus dones (cocinar, cantar, escuchar, sembrar) son encargo: úsalos para otros y crecen.',
    practica: 'Nombra tus 3 talentos y ofrece 1 esta semana a tu familia o comunidad (minga, taller, visita).' },
  { id: 'lavatorio', n: 'Lavar los pies', cita: 'Juan 13', ico: '🦶', color: '#c9a9c9',
    dice: 'Jesús lava los pies de sus amigos: “les di ejemplo para que hagan lo mismo”. El maestro se hace servidor.',
    sirve: 'La grandeza crística se mide hacia abajo: en lo humilde hecho con amor.',
    practica: 'Haz hoy 1 tarea “de pies”: limpiar, ordenar, cocinar para otro sin que te lo pidan ni te vean.' },
  { id: 'padrenuestro', n: 'Padre Nuestro', cita: 'Mateo 6', ico: '🙏', color: '#e76e8a',
    dice: 'Padre de todos, venga tu reino, danos el pan de hoy, perdona como perdonamos, líbranos del mal.',
    sirve: 'Toda la consciencia crística en 7 peticiones: filiación, pan compartido, perdón mutuo y confianza.',
    practica: 'Rézalo lento esta noche, deteniéndote 1 minuto en cada frase. Termina perdonando a 1 persona.' },
  { id: 'mandamiento', n: 'El mandamiento nuevo', cita: 'Juan 13:34', ico: '💗', color: '#e05555',
    dice: '“Ámense unos a otros como yo los he amado”. No como te aman: como Él ama (hasta el extremo, primero).',
    sirve: 'La medida ya no es el gusto propio sino el amor entregado. Ahí se reconoce al discípulo.',
    practica: 'Ama hoy “a lo Cristo”: a 1 difícil, sin esperar cambio ni gracias. Solo sirve y suelta.' },
  { id: 'mostaza', n: 'Grano de mostaza', cita: 'Mateo 17:20', ico: '🌿', color: '#8fd694',
    dice: 'Fe como un granito basta para mover montes. Lo pequeño con amor se vuelve árbol que cobija aves.',
    sirve: 'No esperes sentir mucho: empieza pequeño y constante (5 min de oración valen más que 0 de fervor).',
    practica: 'Siembra 1 mostaza hoy: 5 min de silencio + 1 acto pequeño de amor. Repite 40 días y mira el árbol.' },
  { id: 'oveja', n: 'La oveja perdida', cita: 'Lucas 15', ico: '🐑', color: '#7ab8ff',
    dice: 'El pastor deja las 99 y busca a la perdida hasta hallarla; hay fiesta en el cielo por 1 que vuelve.',
    sirve: 'Nadie es descartable: ni el hijo, ni el vecino, ni yo misma/o. Ir a buscar es misión crística.',
    practica: 'Busca hoy a 1 “perdida/o”: quien se alejó, enfermó o calló. Llama, visita, escucha sin sermón.' },
  { id: 'panes', n: 'Multiplicación de los panes', cita: 'Juan 6', ico: '🍞', color: '#e8c56a',
    dice: 'Con 5 panes y 2 peces dados por un niño, comen miles y sobra. Lo poco compartido se multiplica.',
    sirve: 'La escasez se vence compartiendo, no acumulando: trueque, olla común, minga, pan partido.',
    practica: 'Comparte hoy algo “poco”: comida, tiempo, semilla, saber. Anota qué se multiplicó.' },
  { id: 'cruz', n: 'La cruz y el perdón', cita: 'Lucas 23:34', ico: '✝️', color: '#9d8df1',
    dice: '“Padre, perdónalos, no saben lo que hacen”. En lo peor, amor y perdón en vez de maldición.',
    sirve: 'El corazón crístico ama incluso doliendo: transforma el sufrimiento en ofrenda, no en venganza.',
    practica: 'Ante tu herida mayor: escribe “te perdono” y entrégala (quémala/suéltela al mar con respeto). Pide apoyo si desborda.' }
];
var CC_SECUENCIAS = [
  { id: 'amanecer', n: 'Amanecer · 10 min', desc: 'Gratitud + Palabra del día + 1 propósito de amor. Para empezar en luz.' },
  { id: 'examen', n: 'Examen de amor · 10 min', desc: 'Repaso de la noche: ¿dónde amé? ¿dónde fallé? Perdón y propósito. Clásico ignaciano simple.' },
  { id: 'perdon', n: 'Perdón profundo · 15 min', desc: 'Nombra, siente, entrega y bendice a 1 persona. Para rencores y duelos (acompañado si es trauma).' },
  { id: 'servicio', n: 'Servicio y envío · 7 min', desc: 'Ofrecer el día/semana: ¿a quién sirvo? Termina con Padre Nuestro lento.' }
];
var CC_ESTADOS = ['activo', 'en pausa', 'cerrado'];
var CC_GUIA = [
  { id: 'que', ico: '✝️', n: '¿Qué es la Consciencia Crística?',
    txt: 'No es una religión nueva: es el <b>estado interior de Jesús</b> que todas las iglesias anuncian y que místicos de ayer y hoy describen igual: <b>sentirse hija/o amada/o y tratar a cada ser como hermano</b>. “Cristo” significa <i>ungido</i>: la persona ungida por el amor. Despertar la consciencia crística = pensar, sentir y actuar desde el amor en lo cotidiano (casa, trabajo, territorio).' },
  { id: 'jesus', ico: '📜', n: 'Jesús en 1 minuto',
    txt: '<b>Jesús de Nazaret</b> (siglo I, Galilea): predicó el Reino como mesa compartida —pan, perdón y dignidad para pobres, enfermos y excluidos— y selló su mensaje con la cruz y la resurrección. Sus palabras viven en los <b>4 evangelios</b> (Mateo, Marcos, Lucas, Juan). Las iglesias (católica, evangélica, ortodoxa) lo confiesan como Hijo de Dios; otras miradas lo honran como <b>maestro del amor universal</b>. Aquí caben ambas: nadie debe renunciar a su fe para practicar el amor.' },
  { id: 'nombres', ico: '🌍', n: 'Otros nombres del mismo amor',
    txt: 'Cada pueblo nombra esta cima a su modo: <b>kimün mapuche</b> (saber vivir en equilibrio y respeto), <b>buen vivir</b> andino, <b>compasión</b> budista, <b>ubuntu</b> africano (“soy porque somos”). La consciencia crística dialoga con todas: no compite, suma. En Penco conviven capillas, templos y rogativas: el amor es lengua común.' },
  { id: 'senales', ico: '🌱', n: 'Señales de que despierta',
    txt: 'Menos juicio y más misericordia · pides perdón primero · sirves sin publicar · incluyes al distinto · agradeces lo simple · pones límites sin odio · lloras con el que llora y ríes con el que ríe. No es perfección: es <b>dirección</b>. Si un día fallas, el examen de la noche te vuelve al camino sin culpa.' },
  { id: 'lunas', ico: '🌙', n: 'Cristo y tus 13 lunas',
    txt: '<b>Nueva:</b> propósito de servicio del ciclo. <b>Creciente:</b> fidelidad diaria (amanecer). <b>Llena:</b> verdad y perdón: lo oculto sale a la luz para sanar. <b>Menguante:</b> examen profundo y suelta. Cada práctica queda marcada con su luna en 📓 Diario. El ciclo de <b>40 días</b> (desierto/cuaresma) es tu meta dulce.' },
  { id: 'comunion', ico: '⛪', n: 'En comunión, no en soledad',
    txt: 'Esta sección acompaña, no reemplaza: tu <b>parroquia, templo o comunidad</b> (ver ⛪ Iglesias en Penco), tu director/a espiritual o tu longko/papay. Si tu iglesia te pide algo distinto a tu consciencia, dialoga con tu pastor/cura: la fe madura pregunta con respeto. Ante duelo, violencia o ideas de daño: práctica breve + red (*4141 Chile 24h, CESFAM, tu comunidad).' }
];
function guiaById(id) {
  for (var gi = 0; gi < CC_GUIA.length; gi++) if (CC_GUIA[gi].id === id) return CC_GUIA[gi];
  return null;
}

function pilarById(id) {
  for (var i = 0; i < CC_PILARES.length; i++) if (CC_PILARES[i].id === id) return CC_PILARES[i];
  return CC_PILARES[0];
}
function pasosDeSecuencia(secId) {
  if (secId === 'examen') return [
    { n: 'Gratitud: 3 dones del día', desc: 'Nombra en voz baja 3 cosas buenas de hoy. Respira cada una. Di gracias.' },
    { n: 'Luz: ¿dónde estuvo el amor?', desc: 'Recorre tu día como película. Detente en 1 momento de amor (dado o recibido). Saboréalo 1 min.' },
    { n: 'Sombra: ¿dónde fallé al amor?', desc: 'Sin látigo: nombra 1 momento frío o injusto. ¿Qué necesitaba yo? ¿Qué necesitaba el otro?' },
    { n: 'Perdón y propósito', desc: 'Di: «perdóname, perdono, ayúdame mañana». Elige 1 propósito pequeño y concreto para mañana.' }
  ];
  if (secId === 'perdon') return [
    { n: 'Aquietar: respiración 4-6', desc: 'Manos al pecho, 6 respiraciones lentas. Invoca: «Ven, amor, acompáñame».' },
    { n: 'Nombrar la herida', desc: '¿Quién? ¿Qué pasó? ¿Qué me dolió? Escríbelo en 2 líneas, sin insultos. Lo nombrado se puede entregar.' },
    { n: 'Entregar y bendecir', desc: 'Visualiza a la persona como niña/o herida/o. Di: «te perdono, te bendigo, te suelto». Repite 7 veces suave.' },
    { n: 'Sellar con gratitud', desc: '¿Qué me enseñó este dolor? Agradece 1 aprendizaje. Toma agua. Si sube a 9-10, cierra y pide apoyo.' }
  ];
  if (secId === 'servicio') return [
    { n: 'Ofrecimiento', desc: 'Di: «te ofrezco este día/semana: mis manos, mi tiempo, mi casa». Nombra a tu familia y tu territorio (Penco).' },
    { n: '¿A quién sirvo hoy?', desc: 'Elige 1 servicio concreto y oculto si puedes. Escríbelo: cuándo y cómo.' },
    { n: 'Padre Nuestro lento', desc: 'Rézalo frase por frase, 10 segundos cada una. Detente en «perdona como perdonamos».' }
  ];
  return [
    { n: 'Gratitud del amanecer', desc: 'Antes del celu: 3 respiraciones + 3 gracias (vida, techo, pan). Mira la luz por la ventana.' },
    { n: 'Palabra del día', desc: 'Lee 1 enseñanza de la pestaña Palabras (o tu evangelio). Subraya 1 frase y repítela 3 veces.' },
    { n: 'Propósito de amor', desc: 'Elige 1 pilar para hoy (ej: servicio) y 1 acto concreto antes de las 20:00. Escríbelo.' }
  ];
}

/* ---------- racha + ciclo 40 ---------- */
function rachaDias() {
  var set = {};
  store().ses.forEach(function (r) { set[r.fecha] = true; });
  var s = 0, cur = new Date(todayKey() + 'T12:00:00');
  if (!set[todayKey()]) cur = new Date(cur.getTime() - 86400000);
  for (var i = 0; i < 365; i++) {
    var k = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
    if (set[k]) s++; else break;
    cur = new Date(cur.getTime() - 86400000);
  }
  return s;
}
function ciclo40() {
  var set = {};
  store().ses.forEach(function (r) { set[r.fecha] = true; });
  var s = 0, cur = new Date(todayKey() + 'T12:00:00');
  if (!set[todayKey()]) cur = new Date(cur.getTime() - 86400000);
  for (var i = 0; i < 40; i++) {
    var k = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
    if (set[k]) s++; else break;
    cur = new Date(cur.getTime() - 86400000);
  }
  return s;
}

/* ============================================================
   RENDER — Pilares
   ============================================================ */
function renderPilares() {
  var box = $('cxPilarGrid'); if (!box) return;
  var e = store();
  var hoy = e.pilares[todayKey()] || {};
  box.innerHTML = CC_PILARES.map(function (g) {
    var isFav = e.favPilar === g.id;
    var hecho = !!hoy[g.id];
    return '<div class="menstrual-card" style="border-color:' + g.color + '66">' +
      '<h4 style="color:' + g.color + '">' + g.ico + ' ' + esc(g.n) + (isFav ? ' ⭐' : '') + (hecho ? ' · ✅ hoy' : '') + '</h4>' +
      '<p class="su-afb724"><b>Qué significa:</b> ' + esc(g.que) + '<br><b>Hoy:</b> ' + esc(g.como) + '</p>' +
      '<div class="su-c158a9">' +
      '<button type="button" class="btn ' + (hecho ? 'su-30e741' : 'btn-accent su-e2cc6b') + '" data-pilar="' + esc(g.id) + '">' + (hecho ? '✅ Vivido hoy' : '💗 Vivir hoy') + '</button>' +
      '<button type="button" class="btn su-337714" data-pvoz="' + esc(g.id) + '">🔊 Escuchar</button>' +
      '<button type="button" class="btn su-337714" data-pfav="' + esc(g.id) + '">' + (isFav ? '⭐ Favorito' : '☆ Favorito') + '</button>' +
      '</div></div>';
  }).join('');
  box.querySelectorAll('[data-pilar]').forEach(function (b) { b.onclick = function () {
    var id = b.getAttribute('data-pilar');
    var st = store(); var h = st.pilares[todayKey()] || (st.pilares[todayKey()] = {});
    h[id] = !h[id]; persistStore(); save(h[id] ? 'Pilar vivido 💗' : 'Guardado'); renderPilares(); renderAva();
  }; });
  box.querySelectorAll('[data-pvoz]').forEach(function (b) { b.onclick = function () { var g = pilarById(b.getAttribute('data-pvoz')); speak(g.n + '. ' + g.que + ' ' + g.como); }; });
  box.querySelectorAll('[data-pfav]').forEach(function (b) { b.onclick = function () { store().favPilar = b.getAttribute('data-pfav'); persistStore(); save('Pilar favorito guardado ⭐'); renderPilares(); }; });
}

/* ============================================================
   RENDER — Palabras
   ============================================================ */
function renderPalabras() {
  var box = $('cxPalGrid'); if (!box) return;
  box.innerHTML = CC_PALABRAS.map(function (p) {
    return '<div class="menstrual-card" style="border-color:' + p.color + '55">' +
      '<h4 style="color:' + p.color + '">' + p.ico + ' ' + esc(p.n) + ' <span class="muted su-11a508">· ' + esc(p.cita) + '</span></h4>' +
      '<p class="su-afb724"><b>Dice:</b> ' + esc(p.dice) + '<br><b>Para qué:</b> ' + esc(p.sirve) + '<br><b>Práctica:</b> ' + esc(p.practica) + '</p>' +
      '<div class="su-c158a9">' +
      '<button type="button" class="btn su-337714" data-pal="' + esc(p.n) + '">🧘 Orar</button>' +
      '<button type="button" class="btn su-337714" data-palvoz="' + esc(p.id) + '">🔊 Escuchar</button>' +
      '</div></div>';
  }).join('');
  box.querySelectorAll('[data-pal]').forEach(function (b) { b.onclick = function () {
    switchTab('Pract');
    var lbl = $('cxFocoLibre');
    if (lbl) lbl.textContent = 'Palabra de hoy: ' + b.getAttribute('data-pal') + ' — llévala a tu práctica.';
    try { $('cxPractSec').scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
  }; });
  box.querySelectorAll('[data-palvoz]').forEach(function (b) { b.onclick = function () {
    var p = null;
    for (var i = 0; i < CC_PALABRAS.length; i++) if (CC_PALABRAS[i].id === b.getAttribute('data-palvoz')) p = CC_PALABRAS[i];
    if (p) speak(p.n + '. ' + p.dice + ' ' + p.practica);
  }; });
}

/* ============================================================
   RENDER — Práctica guiada
   ============================================================ */
var cxTimerIv = null, cxTimerLeft = 0, cxPasoIdx = 0, cxPasos = [];
function cxTimerStop(silent) {
  if (cxTimerIv) { clearInterval(cxTimerIv); cxTimerIv = null; }
  if (!silent) { var l = $('cxTimerLabel'); if (l) l.textContent = '⏱ Elige una secuencia y pulsa “Comenzar”. Cada paso suena al terminar.'; }
}
function cxPintarPaso() {
  var box = $('cxPasoBox'); if (!box) return;
  if (!cxPasos.length) { box.innerHTML = '<p class="muted">Sin secuencia. Elige arriba: amanecer, examen, perdón o servicio.</p>'; return; }
  var p = cxPasos[cxPasoIdx];
  var total = cxPasos.length;
  box.innerHTML = '<div class="menstrual-card su-7c1198"><div class="muted">PASO ' + (cxPasoIdx + 1) + ' / ' + total + '</div>' +
    '<h4>🕯️ ' + esc(p.n) + '</h4>' +
    '<p class="su-afb724">' + esc(p.desc || '') + '</p>' +
    '<div class="su-e376dd"><button type="button" id="cxPrev" class="btn su-30e741">◀ Anterior</button>' +
    '<button type="button" id="cxNext" class="btn btn-accent su-e2cc6b">Siguiente ▶</button></div></div>';
  var pv = $('cxPrev'); if (pv) pv.onclick = function () { if (cxPasoIdx > 0) { cxPasoIdx--; cxIniciarPaso(); } };
  var nx = $('cxNext'); if (nx) nx.onclick = function () {
    if (cxPasoIdx < cxPasos.length - 1) { cxPasoIdx++; cxIniciarPaso(); }
    else { cxTimerStop(true); var l = $('cxTimerLabel'); if (l) l.innerHTML = '🌟 <b>Práctica completa.</b> Persígnate o junta tus manos, agradece y guarda tu práctica abajo.'; try { speak('Práctica completa. Gracias. Amén.'); } catch (e) {} }
  };
}
function cxIniciarPaso() {
  cxTimerStop(true);
  cxPintarPaso();
  var p = cxPasos[cxPasoIdx]; if (!p) return;
  var mins = Math.max(1, Math.min(10, +((($('cxMinPorPaso') || {}).value) || 3)));
  cxTimerLeft = mins * 60;
  var l = $('cxTimerLabel');
  function paint() {
    if (!l) return;
    var m = Math.floor(cxTimerLeft / 60), s = cxTimerLeft % 60;
    l.innerHTML = '🕯️ <b>' + esc(p.n) + '</b> · <b>' + m + ':' + String(s).padStart(2, '0') + '</b> · respira lento, corazón abierto. Paso ' + (cxPasoIdx + 1) + '/' + cxPasos.length + '.';
  }
  paint();
  cxTimerIv = setInterval(function () {
    cxTimerLeft--;
    if (cxTimerLeft <= 0) {
      cxTimerStop(true);
      try { if (typeof playNotifySound === 'function') playNotifySound(); } catch (e) {}
      if (l) l.innerHTML = '🔔 <b>' + esc(p.n) + '</b> completo. Pulsa “Siguiente ▶” para continuar.';
      return;
    }
    paint();
  }, 1000);
}
function cxSecElegida() {
  var s = $('cxPractSec');
  return (s && s.value) || 'amanecer';
}
function renderPract() {
  var sel = $('cxPractSec'); if (!sel) return;
  var keep = sel.value || 'amanecer';
  sel.innerHTML = CC_SECUENCIAS.map(function (s) {
    return '<option value="' + s.id + '"' + (s.id === keep ? ' selected' : '') + '>' + esc(s.n) + '</option>';
  }).join('');
  var d = $('cxSecDesc');
  if (d) { var f = CC_SECUENCIAS.filter(function (s) { return s.id === keep; })[0]; if (f) d.textContent = f.desc; }
  var fs = $('cxFocoSel');
  if (fs) {
    var cur = fs.value || '';
    var acts = store().focos.filter(function (r) { return r.estado === 'activo'; });
    fs.innerHTML = '<option value="">Práctica personal</option>' + acts.map(function (r) {
      return '<option value="' + r.id + '"' + (r.id === cur ? ' selected' : '') + '>' + esc((r.titulo || 'Sin título').slice(0, 40)) + '</option>';
    }).join('');
  }
}
function guardarSesion() {
  var sec = cxSecElegida();
  var focoId = ($('cxFocoSel') || {}).value || '';
  var antes = +(($('cxAntes') || {}).value || 5);
  var desp = +(($('cxDespues') || {}).value || 5);
  var nota = clean((($('cxNota') || {}).value || '').trim(), 300);
  var mins = Math.max(1, +((($('cxMinTotal') || {}).value) || (cxPasos.length * 3) || 10));
  var titulo = 'Práctica ' + sec;
  if (focoId) {
    var dd = store().focos, r = null;
    for (var i = 0; i < dd.length; i++) if (dd[i].id === focoId) r = dd[i];
    if (r) titulo = r.titulo;
  }
  if (!nota && !confirm('¿Guardar la práctica sin nota? (igual suma a tu racha y ciclo de 40 días)')) return;
  store().ses.push({ id: uid('cc'), fecha: (($('cxFecha') || {}).value) || todayKey(), sec: sec, titulo: titulo, focoId: focoId, minutos: mins, antes: antes, despues: desp, nota: nota });
  store().totalMin += mins;
  persistStore();
  save('Práctica guardada 🕯️');
  try { $('cxNota').value = ''; } catch (e) {}
  cxTimerStop(false);
  renderSes(); renderFocos(); renderAva(); renderPract();
  switchTab('Diar');
}

/* ============================================================
   RENDER — Diario + Avance
   ============================================================ */
function renderFocos() {
  var box = $('cxFocosList'); if (!box) return;
  var q = (($('cxFocosQ') || {}).value || '').toLowerCase();
  var f = ($('cxFocosF') || {}).value || 'todos';
  var d = store().focos.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  var fil = d.filter(function (r) {
    if (f !== 'todos' && r.estado !== f) return false;
    if (q && ((r.titulo || '') + ' ' + (r.nota || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  box.innerHTML = fil.length ? fil.map(function (r) {
    var col = r.estado === 'cerrado' ? '#8fd694' : (r.estado === 'en pausa' ? '#e8c56a' : '#e76e8a');
    return '<div class="habit-item"><div class="su-34136d"><span><b>' + esc(r.titulo) + '</b></span>' +
      '<span class="chip" style="font-size:10px;border-color:' + col + '55;color:' + col + '">' + esc(r.estado || 'activo') + '</span></div>' +
      '<div class="muted su-cdff1d">' + esc(lunaTxt(r.fecha) || '') + (r.nota ? '<br>📝 ' + esc(r.nota) : '') + '</div>' +
      '<div class="su-faf7a9">' +
      '<button class="btn su-337714" data-ses="' + r.id + '">🕯️ Orar</button>' +
      '<button class="btn su-337714" data-next="' + r.id + '">⏭ ' + (r.estado === 'activo' ? 'en pausa' : r.estado === 'en pausa' ? 'cerrado' : 'reactivar') + '</button>' +
      '<button class="btn su-9b8fb7" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Sin intenciones. Anota 1: ¿por quién oras? ¿qué acto de amor harás? Empieza por tu casa.</p>';
  var st = $('cxFocosStats');
  if (st) st.textContent = d.length + ' intenciones · ' + d.filter(function (r) { return r.estado === 'activo'; }).length + ' activas';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar esta intención?')) return; var dd = store().focos; var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); persistStore(); save(); renderFocos(); renderAva(); renderPract(); }; });
  box.querySelectorAll('[data-next]').forEach(function (b) { b.onclick = function () { var dd = store().focos; var r = dd.find(function (x) { return x.id === b.getAttribute('data-next'); }); if (!r) return; r.estado = r.estado === 'activo' ? 'en pausa' : (r.estado === 'en pausa' ? 'cerrado' : 'activo'); persistStore(); save('Guardado 🕯️'); renderFocos(); renderAva(); renderPract(); }; });
  box.querySelectorAll('[data-ses]').forEach(function (b) { b.onclick = function () { switchTab('Pract'); renderPract(); var s = $('cxFocoSel'); if (s) s.value = b.getAttribute('data-ses'); }; });
}
function renderSes() {
  var box = $('cxSesList'); if (!box) return;
  var d = store().ses.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  box.innerHTML = d.length ? d.slice(0, 40).map(function (r) {
    return '<div class="habit-item"><b>🕯️ ' + esc(r.fecha) + '</b> · ' + esc(r.sec || '') + ' · ' + (+r.minutos || 0) + ' min' +
      '<br><span class="muted su-11a508">📌 ' + esc(r.titulo || 'práctica') + ' · ' + r.antes + '→' + r.despues + '/10 · ' + esc(lunaTxt(r.fecha)) + '</span>' +
      (r.nota ? '<p class="su-6cb285">💡 ' + esc(r.nota) + '</p>' : '') +
      '<div class="su-90237f"><button class="btn su-337714" data-share="' + r.id + '">📤</button><button class="btn su-9b8fb7" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Sin prácticas aún. Ve a 🕯️ Práctica y regálate 7 minutos hoy (servicio y envío).</p>';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar práctica?')) return; var dd = store().ses; var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) { store().totalMin = Math.max(0, store().totalMin - (+dd[i].minutos || 0)); dd.splice(i, 1); } persistStore(); save(); renderSes(); renderAva(); }; });
  box.querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var dd = store().ses; var r = dd.find(function (x) { return x.id === b.getAttribute('data-share'); }); if (r) share('🕯️ Mi camino crístico ' + r.fecha, '📌 ' + (r.titulo || '') + '\n' + r.sec + ' · ' + r.minutos + ' min (' + r.antes + '→' + r.despues + '/10)' + (r.nota ? '\n💡 ' + r.nota : '')); }; });
  var st = $('cxSesStats');
  if (st) { var mins = d.reduce(function (a, r) { return a + (+r.minutos || 0); }, 0); st.textContent = d.length + ' prácticas · ' + mins + ' min · racha ' + rachaDias() + ' días'; }
}
function renderAva() {
  var box = $('cxAvaBox'); if (!box) return;
  var e = store();
  var ses = e.ses;
  var c40 = ciclo40();
  var pct = Math.round(c40 / 40 * 100);
  var porSec = {};
  ses.forEach(function (r) { porSec[r.sec] = (porSec[r.sec] || 0) + 1; });
  var topSec = Object.keys(porSec).sort(function (a, b) { return porSec[b] - porSec[a]; })[0] || '—';
  var pilHoy = Object.keys((e.pilares || {})[todayKey()] || {}).filter(function (k) { return e.pilares[todayKey()][k]; }).length;
  box.innerHTML = '<p class="muted su-11a508">✝️ Camino de 40 días (cuaresma/desierto): <b>' + c40 + '/40</b> (' + pct + '%)</p>' +
    '<div class="su-ab9537"><div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#e8c56a,#e76e8a,#9d8df1,#7ab8ff)"></div></div>' +
    '<p class="muted su-e13d76">🕯️ ' + ses.length + ' prácticas · ⏱ ' + (e.totalMin || 0) + ' min de vida · 🔥 racha ' + rachaDias() + ' días · secuencia favorita: <b>' + esc(topSec) + '</b></p>' +
    '<p class="muted su-11a508">💗 Pilares vividos hoy: <b>' + pilHoy + '/7</b> · Ritmo sugerido: amanecer breve + examen de noche. Menguante → perdón; nueva → propósito de servicio.</p>';
}
function renderAll() { try { renderPilares(); } catch (e) {} try { renderPalabras(); } catch (e) {} try { renderPract(); cxPintarPaso(); } catch (e) {} try { renderFocos(); } catch (e) {} try { renderSes(); } catch (e) {} try { renderAva(); } catch (e) {} }

/* ============================================================
   DIALOGO
   ============================================================ */
function buildDialog() {
  makeDialog('cristicaDialog', '✝️ Consciencia Crística — vivir como amor',
    'El <b>Cristo como estado de consciencia</b>: amar como Él amó — perdonar, servir, unir. Para creyentes y buscadores: 7 pilares + Palabra + práctica diaria. Todo queda <b>privado y local</b>.',
    '<div class="timer-tabs su-dd1da5">' +
    '<button type="button" id="tabCxGuia" class="btn btn-accent su-30e741">📖 Guía</button>' +
    '<button type="button" id="tabCxPilar" class="btn su-30e741">💗 Pilares</button>' +
    '<button type="button" id="tabCxPal" class="btn su-30e741">📜 Palabras</button>' +
    '<button type="button" id="tabCxPract" class="btn su-30e741">🕯️ Práctica</button>' +
    '<button type="button" id="tabCxDiar" class="btn su-30e741">📓 Diario</button>' +
    '<button type="button" id="tabCxAva" class="btn su-30e741">📊 Mi avance</button></div>' +

    '<div id="cxGuia">' +
      '<div class="si-card"><h4>✝️ ¿Qué es la Consciencia Crística?</h4><p>No es una religión nueva: es el <b>estado interior de Jesús</b> que todas las iglesias anuncian y que místicos de ayer y hoy describen igual: <b>sentirse hija/o amada/o y tratar a cada ser como hermano</b>. “Cristo” significa <i>ungido</i>: la persona ungida por el amor. Despertar la consciencia crística = pensar, sentir y actuar desde el amor en lo cotidiano (casa, trabajo, territorio).</p></div>' +
      '<div class="si-card"><h4>📜 Jesús en 1 minuto</h4><p><b>Jesús de Nazaret</b> (siglo I, Galilea): predicó el Reino como mesa compartida —pan, perdón y dignidad para pobres, enfermos y excluidos— y selló su mensaje con la cruz y la resurrección. Sus palabras viven en los <b>4 evangelios</b> (Mateo, Marcos, Lucas, Juan). Las iglesias (católica, evangélica, ortodoxa) lo confiesan como Hijo de Dios; otras miradas lo honran como <b>maestro del amor universal</b>. Aquí caben ambas: nadie debe renunciar a su fe para practicar el amor.</p></div>' +
      '<div class="si-card"><h4>🌍 Otros nombres del mismo amor</h4><p>Cada pueblo nombra esta cima a su modo: <b>kimün mapuche</b> (saber vivir en equilibrio y respeto), <b>buen vivir</b> andino, <b>compasión</b> budista, <b>ubuntu</b> africano (“soy porque somos”). La consciencia crística dialoga con todas: no compite, suma. En Penco conviven capillas, templos y rogativas: el amor es lengua común.</p></div>' +
      '<div class="si-card"><h4>🌱 Señales de que despierta</h4><p>Menos juicio y más misericordia · pides perdón primero · sirves sin publicar · incluyes al distinto · agradeces lo simple · pones límites sin odio · lloras con el que llora y ríes con el que ríe. No es perfección: es <b>dirección</b>. Si un día fallas, el examen de la noche te vuelve al camino sin culpa.</p></div>' +
      '<div class="si-card"><h4>🌙 Cristo y tus 13 lunas</h4><p><b>Nueva:</b> propósito de servicio del ciclo. <b>Creciente:</b> fidelidad diaria (amanecer). <b>Llena:</b> verdad y perdón: lo oculto sale a la luz para sanar. <b>Menguante:</b> examen profundo y suelta. Cada práctica queda marcada con su luna en 📓 Diario. El ciclo de <b>40 días</b> (desierto/cuaresma) es tu meta dulce.</p></div>' +
      '<div class="si-card"><h4>⛪ En comunión, no en soledad</h4><p>Esta sección acompaña, no reemplaza: tu <b>parroquia, templo o comunidad</b> (ver ⛪ Iglesias en Penco), tu director/a espiritual o tu longko/papay. Si tu iglesia te pide algo distinto a tu consciencia, dialoga con tu pastor/cura: la fe madura pregunta con respeto. Ante duelo, violencia o ideas de daño: práctica breve + red (*4141 Chile 24h, CESFAM, tu comunidad).</p></div>' +
      '<div class="dlg-actions su-59a5a8"><button type="button" id="cxGoPilar" class="btn btn-accent su-30e741">💗 Conocer los 7 pilares →</button> <button type="button" id="cxGoPract" class="btn su-30e741">🕯️ Orar 7 minutos ahora →</button></div>' +
    '</div>' +

    '<div id="cxPilar" class="hidden"><p class="muted su-11a508">Los <b>7 pilares</b> que Jesús vivió. Toca “Vivir hoy” cuando lo practiques: suma a tu avance.</p><div id="cxPilarGrid"></div></div>' +

    '<div id="cxPal" class="hidden"><p class="muted su-11a508"><b>12 palabras vivas</b> en lenguaje simple: qué dicen, para qué sirven y cómo practicarlas hoy.</p><div id="cxPalGrid"></div></div>' +

    '<div id="cxPract" class="hidden">' +
      '<div class="menstrual-card su-68a1a9"><h4>🕯️ Oración-contemplación guiada</h4>' +
      '<p class="muted su-11a508">Ritual mínimo: <b>señal o manos juntas</b> → 3 respiraciones → pasos → Padre Nuestro o gratitud → 1 propósito.</p>' +
      '<div class="conv-row"><label class="su-4b3de7">🌿 Secuencia <select id="cxPractSec"></select></label><label>⏱ Min por paso <input type="number" id="cxMinPorPaso" min="1" max="10" value="3"></label></div>' +
      '<p id="cxSecDesc" class="muted su-11a508"></p>' +
      '<div class="conv-row"><label class="su-4b3de7">📌 Intención <select id="cxFocoSel"></select></label><label>📅 Fecha <input type="date" id="cxFecha"></label></div>' +
      '<div id="cxFocoLibre" class="muted su-11a508"></div>' +
      '<div class="dlg-actions su-59a5a8"><button type="button" id="cxComenzar" class="btn btn-accent su-30e741">▶ Comenzar</button><button type="button" id="cxVozGuia" class="btn su-30e741">🔊 Guía por voz</button><button type="button" id="cxDetener" class="btn su-30e741">⏹ Detener</button></div>' +
      '<div id="cxPasoBox" class="su-c1fafc"></div>' +
      '<div id="cxTimerLabel" class="muted su-e13d76">⏱ Elige una secuencia y pulsa “Comenzar”. Cada paso suena al terminar.</div>' +
      '<div class="conv-row su-8a77e5"><label>Paz antes (0–10) <input type="number" id="cxAntes" min="0" max="10" value="6" class="su-8573ba"></label>' +
      '<label>Paz después (0–10) <input type="number" id="cxDespues" min="0" max="10" value="4" class="su-8573ba"></label>' +
      '<label class="su-97445a">Minutos totales <input type="number" id="cxMinTotal" min="1" value="10" class="su-581be4"></label></div>' +
      '<label>💡 Fruto de la oración <input type="text" id="cxNota" placeholder="ej: perdoné a mi hermano; serviré visitando a mi vecina" maxlength="300"></label>' +
      '<div class="dlg-actions su-59a5a8"><button type="button" id="cxGuardarSes" class="btn btn-accent su-30e741">🕯️ Guardar práctica</button></div></div>' +
    '</div>' +

    '<div id="cxDiar" class="hidden">' +
      '<div class="menstrual-card su-68a1a9"><h4>➕ Intención / acto de amor</h4>' +
      '<div class="conv-row"><label class="su-4b3de7">Intención * <input type="text" id="cxFocoTitulo" placeholder="ej: orar por mi mamá, visitar al vecino enfermo" maxlength="60"></label><label>Estado <select id="cxFocoEstado"><option value="activo">activo</option><option value="en pausa">en pausa</option><option value="cerrado">cerrado</option></select></label></div>' +
      '<label>Nota <input type="text" id="cxFocoNota" placeholder="ej: llamarla hoy, llevarle pan el domingo" maxlength="120"></label>' +
      '<div class="dlg-actions su-59a5a8"><button type="button" id="cxFocoAdd" class="btn btn-accent su-30e741">+ Agregar intención</button></div></div>' +
      '<div class="conv-row su-d2c171"><label class="su-4b3de7">🔍 Buscar <input type="text" id="cxFocosQ" placeholder="persona, palabra..." autocomplete="off"></label>' +
      '<label>Estado <select id="cxFocosF"><option value="todos">Todos</option><option value="activo">Activos</option><option value="en pausa">En pausa</option><option value="cerrado">Cerrados</option></select></label></div>' +
      '<div id="cxFocosList" class="habits-list su-8c96f6"></div>' +
      '<div class="dlg-actions su-efea1d"><span id="cxFocosStats" class="muted su-11a508"></span></div>' +
      '<div class="menstrual-card su-68a1a9"><h4>📓 Mis prácticas</h4>' +
      '<div id="cxSesList" class="habits-list su-0aced6"></div>' +
      '<div class="dlg-actions su-efea1d"><span id="cxSesStats" class="muted su-11a508"></span>' +
      '<span class="su-3de8f9"><button type="button" id="cxSesToNote" class="btn su-30e741">📝 Llevar a nota de hoy</button>' +
      '<button type="button" id="cxSesShareAll" class="btn su-30e741">📤 Compartir</button>' +
      '<button type="button" id="cxSesClear" class="btn su-214f75">🗑 Borrar</button></span></div></div>' +
    '</div>' +

    '<div id="cxAva" class="hidden"><div id="cxAvaBox" class="menstrual-card su-68a1a9"></div>' +
      '<div class="si-card"><h4>🌙 Cierre de luna (examen de 3 líneas)</h4><p>Responde en tu cuaderno o en 📝 nota del día:<br><b>1)</b> ¿A quién amé esta luna?<br><b>2)</b> ¿A quién debo perdón o perdonar?<br><b>3)</b> ¿Qué servicio ofrezco la próxima luna?<br>Termina con el Padre Nuestro lento.</p></div></div>');
}

function openCc() {
  try {
    var lf = $('cxFecha'); if (lf && !lf.value) lf.value = todayKey();
    renderAll();
  } catch (e) {}
  openDlg('cristicaDialog');
}
try { window.openCristica = openCc; window.openCristicaDialog = openCc; window.openConscienciaCristica = openCc; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar boton en Linaje > practicas (tras Reiki si existe) */
  try {
    if (!$('btnCristica')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnCristica'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '✝️ Consciencia Crística';
        try { btn.setAttribute('data-sub', 'practicas'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'consciencia cristica cristo jesus evangelio amor perdon servicio oracion padre nuestro bienaventuranzas parabola fe iglesia gratitud unidad examen cuaresma');
        var ref = g.querySelector('#btnReiki') || g.querySelector('#btnHooponopono') || g.querySelector('#btnCuartoCamino');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnCristica');
        var curG = cur.closest ? cur.closest('.action-group') : null;
        var curN = curG && curG.getAttribute ? curG.getAttribute('data-group') : null;
        if (curN && curN !== 'linaje') {
          var gd = document.querySelector('.action-group[data-group="linaje"] .group-btns');
          if (gd) { gd.appendChild(cur); try { cur.setAttribute('data-sub', 'practicas'); } catch (eS) {} }
        }
      } catch (eM) {}
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnCristica') < 0) ALL_BTNS.push('btnCristica');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnCristica = ['linaje', 'practicas'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|practicas'] && BTN_ORDER['linaje|practicas'].indexOf('btnCristica') < 0) {
      var oi = BTN_ORDER['linaje|practicas'].indexOf('btnReiki');
      if (oi >= 0) BTN_ORDER['linaje|practicas'].splice(oi + 1, 0, 'btnCristica');
      else BTN_ORDER['linaje|practicas'].push('btnCristica');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnCristica = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnCristica"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnCristica"> ✝️ Consciencia Crística';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnCristica !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnCristica = lab.querySelector('input').checked;
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
  /* keywords cruzadas */
  try { addKw('btnMetodos', 'cristica cristo jesus amor perdon'); } catch (e2) {}
  try { addKw('btnEspiritual', 'cristica cristo oracion amor'); } catch (e3) {}
  try { addKw('btnEspiritu', 'cristica cristo amor perdon servicio'); } catch (e4) {}
  try { addKw('btnGratitud', 'cristica gratitud oracion gracias'); } catch (e5) {}
  try { addKw('btnBreath', 'cristica oracion contemplacion calma'); } catch (e6) {}
  try { addKw('btnDueloFull', 'cristica consuelo resurreccion esperanza'); } catch (e7) {}
  try { addKw('btnIglesias', 'cristica cristo evangelio misa culto'); } catch (e8) {}

  /* 4) dialogo + eventos */
  buildDialog();
  cxPasos = pasosDeSecuencia('amanecer');
  cxPasoIdx = 0;
  renderAll();

  var b = $('btnCristica');
  if (b) b.onclick = function () { openCc(); };

  ['Guia', 'Pilar', 'Pal', 'Pract', 'Diar', 'Ava'].forEach(function (t) {
    var tb = $('tabCx' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });
  var gg = $('cxGoPilar'); if (gg) gg.onclick = function () { switchTab('Pilar'); renderPilares(); };
  var ga = $('cxGoPract'); if (ga) ga.onclick = function () { switchTab('Pract'); cxPasos = pasosDeSecuencia('servicio'); cxPasoIdx = 0; renderPract(); cxPintarPaso(); };

  var sec = $('cxPractSec');
  if (sec) sec.onchange = function () { cxPasos = pasosDeSecuencia(cxSecElegida()); cxPasoIdx = 0; renderPract(); cxPintarPaso(); cxTimerStop(false); };
  var com = $('cxComenzar'); if (com) com.onclick = function () { cxPasos = pasosDeSecuencia(cxSecElegida()); cxPasoIdx = 0; cxIniciarPaso(); };
  var det = $('cxDetener'); if (det) det.onclick = function () { cxTimerStop(false); };
  var vg = $('cxVozGuia'); if (vg) vg.onclick = function () {
    var p = cxPasos[cxPasoIdx];
    speak('Cierra los ojos. Junta tus manos. Respira. ' + (p ? (p.n + '. ' + (p.desc || '')) : '') + ' Quédate en silencio. Amén.');
  };
  var gs = $('cxGuardarSes'); if (gs) gs.onclick = function () { guardarSesion(); };

  var fa = $('cxFocoAdd');
  if (fa) fa.onclick = function () {
    var t = clean(($('cxFocoTitulo').value || '').trim(), 60); if (!t) return alert('Escribe la intención');
    var rec = { id: uid('ccf'), titulo: t, estado: ($('cxFocoEstado') || {}).value || 'activo', nota: clean($('cxFocoNota').value, 120), fecha: todayKey() };
    store().focos.push(rec);
    persistStore(); save('Intención guardada 🕯️');
    $('cxFocoTitulo').value = ''; $('cxFocoNota').value = '';
    renderFocos(); renderAva(); renderPract();
  };
  var fq = $('cxFocosQ'); if (fq) fq.oninput = function () { renderFocos(); };
  var ff = $('cxFocosF'); if (ff) ff.onchange = function () { renderFocos(); };

  var stn = $('cxSesToNote');
  if (stn) stn.onclick = function () {
    var last = store().ses.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); })[0];
    if (!last) return alert('Sin prácticas aún');
    var txt = ('✝️ Consciencia Crística: ' + last.sec + ' · ' + last.minutos + ' min · ' + (last.titulo || '') + ' (' + last.antes + '→' + last.despues + '/10)').slice(0, 280);
    try {
      var info = (typeof todayInfo === 'function') ? todayInfo() : null;
      if (!info) return alert('No se pudo ubicar hoy');
      if (info.luna === 'dft') { var cy = cyc(currentCycleYear()); cy.dft.nota = (cy.dft.nota ? cy.dft.nota + '\n' : '') + txt; }
      else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + txt; }
      save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
      alert('Llevado a la nota de hoy ✓');
    } catch (e2) { alert('No se pudo llevar a la nota'); }
  };
  var ssa = $('cxSesShareAll');
  if (ssa) ssa.onclick = function () {
    var d = store().ses.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 7);
    var t = d.length ? '✝️ Mi camino crístico (últimas)\n' + d.map(function (r) { return '• ' + r.fecha + ' · ' + r.sec + ' · ' + r.minutos + ' min · ' + (r.titulo || '') + ' (' + r.antes + '→' + r.despues + ')'; }).join('\n') : '✝️ Sin prácticas aún';
    share('Mi camino crístico', t);
  };
  var scl2 = $('cxSesClear');
  if (scl2) scl2.onclick = function () { if (!confirm('¿Borrar todo tu historial de prácticas? (las intenciones se mantienen)')) return; store().ses = []; store().totalMin = 0; persistStore(); save(); renderSes(); renderAva(); };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 400); });
else setTimeout(setup, 400);

})();
