/* ============================================================
   ORACULO — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa e independiente:
   - Boton btnOraculo (grupo Linaje > Interior, junto a Tarot)
   - Dialogo oraculoDialog con 4 pestanas:
     1) Guia (que es un oraculo, diferencia con tarot, como usar)
     2) Mazo (36 cartas propias del territorio: luna, mar,
        bosque, animales, hogar y espiritu + buscador + detalle)
     3) Tiradas (mensaje del dia, cuerpo-mente-espiritu,
        cruz lunar de 4, respuesta si/no/espera)
     4) Mi diario (historial, notas, compartir, llevar al dia)
   - Todo local y privado por usuario: userData().oraculo
     { lecturas:[], diario:{}, favs:[] }
   - Sin dependencias externas. 100% offline.
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
  try { return cal.fmtKey.format(new Date()); } catch (e) {
    var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { lecturas: [], diario: {}, favs: [] };
    if (!u.oraculo) u.oraculo = { lecturas: [], diario: {}, favs: [] };
    var o = u.oraculo;
    if (!Array.isArray(o.lecturas)) o.lecturas = [];
    if (!o.diario) o.diario = {};
    if (!Array.isArray(o.favs)) o.favs = [];
    return o;
  } catch (e2) { return { lecturas: [], diario: {}, favs: [] }; }
}
function save(msg) {
  try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {}
}
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
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">' + title + '</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    (sub ? '<p class="muted" style="line-height:1.5">' + sub + '</p>' : '') +
    bodyHTML +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }
function switchTab(name) {
  ['Guia', 'Mazo', 'Tiradas', 'Diario'].forEach(function (t) {
    var p = $('ora' + t), b = $('tabOra' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}
function hashStr(s) { var h = 0; for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; } return Math.abs(h); }
function shuffled(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* ============================================================
   MAZO PROPIO — 36 cartas del territorio y la luna
   Inspiracion respetuosa en el mar, el bosque y las lunas de
   Penco. No pretende reemplazar saberes mapuche: es un espejo
   poetico para mirarse, con rituales simples de buen vivir.
   ============================================================ */
var MAZO = [
  { n: 1, nombre: 'Luna Nueva', icon: '🌑', el: 'Luna', clave: 'Siembra la intención', mensaje: 'Todo parte en oscuro: una intención pequeña, escrita y regada a diario, vale más que un gran plan. Esta carta anuncia comienzo fértil.', ritual: 'Escribe 1 intención para esta luna en tu nota del día. Léela cada noche 7 días.', pregunta: '¿Qué quiero sembrar aunque aún no se vea?', sino: 'Espera: siembra primero, decide después.' },
  { n: 2, nombre: 'Luna Creciente', icon: '🌒', el: 'Luna', clave: 'Avanza con constancia', mensaje: 'La luz crece de a poco: sigue regando aunque el avance sea invisible. El esfuerzo sostenido ya está funcionando.', ritual: 'Da hoy un paso concreto (15 min) hacia tu intención. Anótalo.', pregunta: '¿Cuál es mi próximo paso pequeño?', sino: 'Sí, si actúas con constancia.' },
  { n: 3, nombre: 'Luna Llena', icon: '🌕', el: 'Luna', clave: 'Cosecha y celebra', mensaje: 'Lo sembrado se ve: agradece, muestra tu fruto y celebra con tu gente. También ilumina lo que hay que soltar.', ritual: 'Nombra 3 logros de esta luna en voz alta. Comparte uno.', pregunta: '¿Qué fruto puedo celebrar y qué sombra soltar?', sino: 'Sí: es tiempo de mostrar y cosechar.' },
  { n: 4, nombre: 'Luna Menguante', icon: '🌘', el: 'Luna', clave: 'Suelta y limpia', mensaje: 'Menguar no es perder: es podar para florecer. Limpia cajones, deudas chicas, rencores. Deja espacio.', ritual: 'Bota o regala 3 cosas hoy. Escribe lo que sueltas y quémalo o entiérralo.', pregunta: '¿Qué peso ya cumplió y puedo soltar?', sino: 'No por ahora: limpia antes de decidir.' },
  { n: 5, nombre: 'Mar en Calma', icon: '🌊', el: 'Mar', clave: 'Paz que ordena', mensaje: 'Como la bahía en la mañana: la calma te deja ver el fondo. No necesitas moverte hoy, necesitas mirar.', ritual: '5 respiraciones mirando (o imaginando) el mar. Pregunta y escucha.', pregunta: '¿Qué veo con claridad si me aquieto?', sino: 'Espera serena: la respuesta llega sola.' },
  { n: 6, nombre: 'Ola', icon: '🌪️', el: 'Mar', clave: 'El cambio viene igual', mensaje: 'La ola no se discute: se surfea o se espera. Algo se mueve en tu vida; flota, no pelees. Elige tu tabla (apoyo, plan, pausa).', ritual: 'Nombra tu ola y tu tabla: "mi ola es ___, mi tabla es ___".', pregunta: '¿Resisto la ola o la surfeo?', sino: 'Sí, pero adaptándote al movimiento.' },
  { n: 7, nombre: 'Cochayuyo', icon: '🌿', el: 'Mar', clave: 'Flexible y firme', mensaje: 'El cochayuyo se dobla con la corriente y no se rompe: sé firme en tu raíz y flexible en la forma. Corta la fronda, deja la raíz.', ritual: 'En un conflicto, cede en la forma y sostén el fondo. Anota la diferencia.', pregunta: '¿Dónde doblarme sin quebrarme?', sino: 'Sí, con flexibilidad.' },
  { n: 8, nombre: 'Piedra de Playa Negra', icon: '🪨', el: 'Mar', clave: 'Memoria que sostiene', mensaje: 'Las piedras negras guardan el calor del sol y la historia del golfo: tienes memoria y aguante. Písalas firme: tu pasado te sostiene, no te hunde.', ritual: 'Recoge (en mente) una piedra: escribe qué aprendizaje pasado te sostiene hoy.', pregunta: '¿Qué fortaleza antigua olvidé que tengo?', sino: 'Sí: apóyate en lo ya vivido.' },
  { n: 9, nombre: 'Gaviota', icon: '🕊️', el: 'Aire', clave: 'Mira desde arriba', mensaje: 'La gaviota ve la bahía entera: sube tu mirada. El problema que te ahoga es pequeño desde el cerro. Toma distancia antes de decidir.', ritual: 'Sube (real o imaginada) a un mirador y mira tu tema desde lejos 5 min.', pregunta: '¿Cómo se ve esto desde más arriba?', sino: 'Espera: mira el panorama completo.' },
  { n: 10, nombre: 'Chucao', icon: '🐦', el: 'Bosque', clave: 'Tu voz interior', mensaje: 'El chucao canta donde hay bosque sano: tu voz interior canta cuando cuidas tu nido. Escucha ese canto bajito que insiste.', ritual: 'Camina 10 min en silencio (plaza, cerro, patio) y anota lo primero que cante dentro.', pregunta: '¿Qué me dice mi canto bajito?', sino: 'La respuesta ya la sabes: escúchate.' },
  { n: 11, nombre: 'Loica', icon: '🐤', el: 'Bosque', clave: 'Alegría que avisa', mensaje: 'La loica de pecho rojo anuncia con canto: hay alegría disponible hoy, pequeña y cierta. Búscala y multiplícala.', ritual: 'Haz una cosa que te dé alegría simple (mate, canto, paseo) y compártela.', pregunta: '¿Dónde está mi alegría de hoy?', sino: 'Sí: elige la alegría.' },
  { n: 12, nombre: 'Picaflor', icon: '🐝', el: 'Bosque', clave: 'Dulzura que poliniza', mensaje: 'El picaflor vive de flor en flor y las fecunda: tu dulzura también deja fruto. Visita, agradece, endulza un vínculo.', ritual: 'Endulza a alguien hoy: mensaje, visita o ayuda pequeña.', pregunta: '¿A quién puedo polinizar con dulzura?', sino: 'Sí: lo dulce abre la puerta.' },
  { n: 13, nombre: 'Zorro', icon: '🦊', el: 'Tierra', clave: 'Astucia con respeto', mensaje: 'El zorro cruza de noche sin que lo vean: sé astuto/a, mueve tus piezas en silencio. Pero sin dañar gallineros ajenos: viveza con ética.', ritual: 'Planea tu próximo movimiento en papel, en privado. Un paso discreto hoy.', pregunta: '¿Qué movimiento inteligente y limpio me conviene?', sino: 'Sí, pero en silencio y con ética.' },
  { n: 14, nombre: 'Canelo', icon: '🌳', el: 'Bosque', clave: 'Protección sagrada', mensaje: 'El canelo protege y limpia: pide amparo a tus mayores, a tu casa, a tu rezo. Estás cuidado/a si honras lo que te cuida.', ritual: 'Limpia tu puerta o tu pieza con intención protectora. Agradece a quien te cuida.', pregunta: '¿Qué necesito proteger y cómo?', sino: 'Sí: estás protegida/o si honras el cuidado.' },
  { n: 15, nombre: 'Boldo', icon: '🍃', el: 'Bosque', clave: 'Limpia por dentro', mensaje: 'El boldo limpia el hígado y las penas viejas: depura cuerpo y rencor. Agua, hierba, perdón pequeño.', ritual: 'Toma agüita de boldo o manzanilla y escribe un perdón pendiente (aunque sea chico).', pregunta: '¿Qué necesito depurar de mi cuerpo o mi historia?', sino: 'Espera: límpiate primero.' },
  { n: 16, nombre: 'Peumo', icon: '🍒', el: 'Bosque', clave: 'Da tu fruto', mensaje: 'El peumo da fruto rojo en otoño sin pedir permiso: tu don ya está maduro. Ofrécelo: enseña, cocina, canta, ayuda.', ritual: 'Ofrece tu fruto hoy: comparte algo que sabes hacer bien.', pregunta: '¿Qué fruto mío está listo para dar?', sino: 'Sí: es tiempo de dar.' },
  { n: 17, nombre: 'Semilla', icon: '🌰', el: 'Tierra', clave: 'Todo cabe en pequeño', mensaje: 'La semilla guarda el bosque entero: tu proyecto cabe en un gesto mínimo de hoy. No desprecies lo chico.', ritual: 'Haz la versión mínima de tu proyecto (1 llamado, 1 fila, 1 página).', pregunta: '¿Cuál es mi gesto-semilla de hoy?', sino: 'Sí, empezando en pequeño.' },
  { n: 18, nombre: 'Lluvia', icon: '🌧️', el: 'Cielo', clave: 'Bendición que moja', mensaje: 'La lluvia del Pukem lava y fecunda: deja que te moje la pena y la riegue. Llorar también es regar.', ritual: 'Sal a mojarte las manos o riega tus plantas con intención. Suelta una lágrima si viene.', pregunta: '¿Qué necesita ser regado con lágrimas o lluvia?', sino: 'Sí: deja que la emoción riegue.' },
  { n: 19, nombre: 'Viento Sur', icon: '💨', el: 'Cielo', clave: 'Despeja y ordena', mensaje: 'El sur despeja el cielo penqueño: ventila tu casa y tu mente. Ordena, bota, deja entrar luz.', ritual: 'Ventila y ordena un rincón 15 min. El aire nuevo trae ideas nuevas.', pregunta: '¿Qué ventana necesito abrir?', sino: 'Sí: despeja y verás claro.' },
  { n: 20, nombre: 'Fuego del Hogar', icon: '🔥', el: 'Hogar', clave: 'Calor que reúne', mensaje: 'La estufa o el fogón juntan a la familia: vuelve al calor simple (comida, mate, conversa). El hogar sostiene cuando afuera arde.', ritual: 'Comparte algo caliente con alguien hoy (mate, sopa, palabra tibia).', pregunta: '¿Quién necesita mi calor y quién me da el suyo?', sino: 'Sí: vuelve al calor de los tuyos.' },
  { n: 21, nombre: 'Abuela', icon: '👵', el: 'Linaje', clave: 'Sabiduría que abriga', mensaje: 'La abuela sabe sin libros: cocina, reza, espera. Pregunta a tus mayores (vivos o en memoria): su consejo ya lo conoces.', ritual: 'Cocina una receta de tu familia o escribe un consejo de tu abuela y aplícalo.', pregunta: '¿Qué me diría mi abuela sobre esto?', sino: 'Escucha a tus mayores antes de decidir.' },
  { n: 22, nombre: 'Abuelo', icon: '👴', el: 'Linaje', clave: 'Raíz y oficio', mensaje: 'El abuelo enseña oficio y aguante: trabaja bien, cumple tu palabra, arregla en vez de botar. La raíz sostiene el temporal.', ritual: 'Arregla algo hoy (objeto, palabra, promesa). Honra tu raíz con un acto.', pregunta: '¿Qué haría bien hecho, a la antigua?', sino: 'Sí, con trabajo honesto y palabra cumplida.' },
  { n: 23, nombre: 'Camino', icon: '🛤️', el: 'Tierra', clave: 'Paso a paso', mensaje: 'El camino se hace andando: no mires la cumbre, mira el próximo paso. Lento también llega.', ritual: 'Camina 15 min pensando solo en el próximo paso de tu tema.', pregunta: '¿Cuál es mi próximo paso, solo ese?', sino: 'Sí, caminando sin correr.' },
  { n: 24, nombre: 'Puente', icon: '🌉', el: 'Tierra', clave: 'Une las orillas', mensaje: 'Hay dos orillas distanciadas (personas, ideas, partes tuyas): tiende un puente. Un llamado, una visita, un perdón.', ritual: 'Tiende un puente hoy: escribe o llama a esa persona/orilla.', pregunta: '¿Qué puente necesita mi vida?', sino: 'Sí, uniendo en vez de dividir.' },
  { n: 25, nombre: 'Noche', icon: '🌌', el: 'Luna', clave: 'Descansa, no decidas', mensaje: 'De noche todo se ve distinto: no decidas cansada/o. Duerme, sueña, deja que la almohada responda.', ritual: 'Acuéstate 30 min antes. Pide respuesta al sueño y anótala al despertar.', pregunta: '¿Qué me diría el descanso?', sino: 'Espera: duerme antes de decidir.' },
  { n: 26, nombre: 'Amanecer', icon: '🌅', el: 'Cielo', clave: 'Siempre vuelve la luz', mensaje: 'El sol sale igual después de la peor noche: tu amanecer viene. Mantén el fuego piloto encendido.', ritual: 'Mira el amanecer (o imagínalo) y nombra 1 cosa que empieza hoy.', pregunta: '¿Qué amanece en mí?', sino: 'Sí: la luz ya viene.' },
  { n: 27, nombre: 'Minga', icon: '🤝', el: 'Comunidad', clave: 'Juntas es más liviano', mensaje: 'La minga mueve casas entre muchos: no cargues sola/o. Pide ayuda y ofrece la tuya. Lo pesado se reparte.', ritual: 'Pide 1 ayuda concreta hoy y ofrece otra. Anota a tu red.', pregunta: '¿A quién puedo pedir ayuda y a quién ayudar?', sino: 'Sí, con ayuda de tu gente.' },
  { n: 28, nombre: 'Manos', icon: '🙌', el: 'Hogar', clave: 'Tu oficio te salva', mensaje: 'Tus manos saben: cocinar, arreglar, sembrar, abrazar. Vuelve al oficio cuando la mente se enreda.', ritual: 'Haz algo con las manos 20 min (cocina, tierra, arreglo) sin pantalla.', pregunta: '¿Qué saben hacer mis manos por mí hoy?', sino: 'Sí: hazlo con tus manos.' },
  { n: 29, nombre: 'Vertiente', icon: '💧', el: 'Agua', clave: 'Deja fluir el sentir', mensaje: 'La vertiente no se tapa: deja correr la emoción (habla, escribe, llora, canta). Lo estancado enferma, lo que fluye limpia.', ritual: 'Escribe 10 líneas sin parar sobre lo que sientes. Rompe o guarda el papel.', pregunta: '¿Qué emoción necesita correr?', sino: 'Siente primero, decide después.' },
  { n: 30, nombre: 'Cerro', icon: '⛰️', el: 'Tierra', clave: 'Sube con esfuerzo', mensaje: 'El cerro se sube con piernas y paciencia: tu meta pide esfuerzo sostenido, no atajo. La vista de arriba paga.', ritual: 'Sube un cerro, escala o escalera con tu tema en mente. Anota la vista.', pregunta: '¿Qué esfuerzo sostenido me pide la cumbre?', sino: 'Sí, con esfuerzo y paciencia.' },
  { n: 31, nombre: 'Niebla', icon: '🌫️', el: 'Cielo', clave: 'Espera que aclare', mensaje: 'Con niebla no se navega: espera, quédate quieta/o, cuida el fuego. Aclarará sin que lo fuerces.', ritual: 'Posterga la decisión 3 días. Ocúpate solo de lo urgente y doméstico.', pregunta: '¿Puedo esperar a que aclare?', sino: 'Espera: aún hay niebla.' },
  { n: 32, nombre: 'Brasa', icon: '🪵', el: 'Hogar', clave: 'Mantén vivo lo esencial', mensaje: 'La brasa se cuida tapándola justo: protege lo esencial (salud, vínculo, proyecto) con poco pero diario. No dejes que se apague.', ritual: 'Haz hoy el gesto mínimo que mantiene viva tu brasa (llamado, riego, página).', pregunta: '¿Cuál es mi brasa que no debe apagarse?', sino: 'Sí, cuidando la brasa.' },
  { n: 33, nombre: 'Espiral / Caracol', icon: '🐚', el: 'Luna', clave: 'Vuelves distinto/a', mensaje: 'El caracol vuelve al mismo punto pero más grande: ese "otra vez lo mismo" es en realidad un nivel nuevo. Mira cuánto creciste.', ritual: 'Compara tu tema con hace una luna: escribe 3 diferencias (creciste).', pregunta: '¿Qué aprendí desde la última vuelta?', sino: 'Cicla una vez más con conciencia.' },
  { n: 34, nombre: 'Telar', icon: '🧶', el: 'Hogar', clave: 'Teje tu trama', mensaje: 'El telar une hilos sueltos en abrigo: teje tu día con hebras simples (rutina, rezo, trabajo, cariño). La trama sostiene.', ritual: 'Teje tu mañana en 4 hebras con hora: cuerpo, trabajo, vínculo, descanso.', pregunta: '¿Qué hebra falta en mi tejido?', sino: 'Sí, tejiendo de a poco.' },
  { n: 35, nombre: 'Estrella Guía', icon: '⭐', el: 'Cielo', clave: 'Sigue tu norte', mensaje: 'Los navegantes se guían por una estrella: la tuya es tu propósito. Cuando todo confunde, mira tu norte y corrige 1 grado.', ritual: 'Escribe tu norte en una frase y pégala donde la veas. Corrige 1 grado hoy.', pregunta: '¿Cuál es mi estrella ahora?', sino: 'Sí, si apunta a tu norte.' },
  { n: 36, nombre: 'Cosecha', icon: '🌾', el: 'Tierra', clave: 'Recoge y reparte', mensaje: 'La cosecha se recoge y se reparte: guarda semilla, comparte fruto, agradece a la tierra y a las manos. Cierra el ciclo en belleza.', ritual: 'Reparte algo hoy (comida, semilla, saber) y agradece en voz alta.', pregunta: '¿Qué cosecho y con quién lo comparto?', sino: 'Sí: recoge y reparte.' }
];

/* ---------- estado ---------- */
var TIRADA = { tipo: 'mensaje', pregunta: '', cartas: [] };
var POS3 = ['Cuerpo · qué sostener', 'Mente · qué aclarar', 'Espíritu · qué honrar'];
var POS4 = ['🌱 Semilla · qué sembrar', '🌊 Marea · qué fluir', '🌳 Bosque · qué cuidar', '⭐ Estrella · qué seguir'];

/* ---------- dialogo ---------- */
function cartaHTML(c, pos) {
  var fav = store().favs.indexOf('O' + c.n) >= 0;
  return '<div class="menstrual-card" style="border-color:var(--gold)">' +
    (pos ? '<p class="muted" style="font-size:11px;margin:0 0 4px">📍 ' + esc(pos) + '</p>' : '') +
    '<h4>' + esc(c.icon + ' ' + c.n + ' · ' + c.nombre) + ' <span class="chip" style="font-size:10px">' + esc(c.el) + '</span></h4>' +
    '<p style="font-size:12px"><b>Clave:</b> ' + esc(c.clave) + '</p>' +
    '<p style="font-size:12px">💬 ' + esc(c.mensaje) + '</p>' +
    '<p class="muted" style="font-size:11px">🌱 <b>Ritual:</b> ' + esc(c.ritual) + '<br>❓ <i>' + esc(c.pregunta) + '</i><br>⚖️ Respuesta: <b>' + esc(c.sino) + '</b></p>' +
    '</div>';
}

function buildDialog() {
  var mazoHTML = MAZO.map(function (c) {
    return '<div class="si-card ora-carta" data-q="' + esc((c.n + ' ' + c.nombre + ' ' + c.el + ' ' + c.clave + ' ' + c.mensaje).toLowerCase()) + '" data-n="' + c.n + '" style="cursor:pointer">' +
      '<h4>' + c.icon + ' ' + c.n + ' · ' + esc(c.nombre) + '</h4><p class="muted" style="font-size:11px">' + esc(c.el) + ' · ' + esc(c.clave) + '</p></div>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin:12px 0 10px;flex-wrap:wrap">' +
    '<button type="button" id="tabOraGuia" class="btn btn-accent" style="width:auto">🧭 Guía</button>' +
    '<button type="button" id="tabOraMazo" class="btn" style="width:auto">🌬️ Mazo (36)</button>' +
    '<button type="button" id="tabOraTiradas" class="btn" style="width:auto">✨ Tiradas</button>' +
    '<button type="button" id="tabOraDiario" class="btn" style="width:auto">📓 Diario</button></div>' +

    '<div id="oraHoyBox" class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px"></div>' +

    /* GUIA */
    '<div id="oraGuia">' +
    '<div class="si-card"><h4>🌬️ ¿Qué es un oráculo?</h4><p>Un mazo de mensajes para <b>escucharte por dentro</b>: cada carta es una imagen del territorio (luna, mar, bosque, hogar) que te devuelve una pregunta, un ritual y una respuesta. A diferencia del <b>🔮 Tarot</b> —78 cartas con estructura fija de siglos—, el oráculo es <b>libre y directo</b>: una carta, un mensaje, un gesto para hoy. Úsalos juntos: el tarot para mirar hondo, el oráculo para el consejo diario.</p></div>' +
    '<div class="discipline-grid">' +
    '<div class="discipline-card"><h4>🔮 Tarot vs 🌬️ Oráculo</h4><p>• <b>Tarot:</b> 78 cartas, sistema riguroso, ideal para procesos y decisiones grandes.<br>• <b>Oráculo:</b> 36 cartas del territorio, lenguaje simple, ideal para el mensaje de cada día.<br>• Ambos son <b>espejos</b>, no sentencias: la decisión siempre es tuya.</p></div>' +
    '<div class="discipline-card"><h4>❓ Cómo consultar</h4><p>1) Aquieta el cuerpo (3 respiraciones). 2) Formula tu tema en una frase ("esta semana con mi hija..."). 3) Saca tu carta. 4) Lee mensaje + ritual + pregunta. 5) Haz el ritual hoy, aunque sea en versión mínima.</p></div>' +
    '</div>' +
    '<div class="discipline-grid">' +
    '<div class="discipline-card"><h4>🌙 Ritual mínimo (1 min)</h4><p>Mano al pecho, nombra tu tema, saca la carta y lee su pregunta en voz alta. Responde por escrito 2 líneas. Eso basta para que el oráculo trabaje.</p></div>' +
    '<div class="discipline-card"><h4>⚠️ Buen uso</h4><p>Orientación amorosa, <b>no orden</b>. Si el tema es salud, dinero serio o violencia, suma ayuda humana: CESFAM, *4141, 1455/149. El oráculo acompaña, no reemplaza.</p></div>' +
    '</div></div>' +

    /* MAZO */
    '<div id="oraMazo" class="hidden">' +
    '<input type="search" id="oraQ" placeholder="🔍 Buscar carta... ej: luna, mar, calma, abuela" style="display:block;width:100%;margin:0 0 10px;background:var(--card);border:1px solid var(--line);color:var(--text);border-radius:8px;padding:8px">' +
    '<p class="muted" style="font-size:11px">Mazo propio de 36 cartas: 🌑 Luna (1–4, 25–26, 33, 35) · 🌊 Mar y agua (5–8, 29) · 🌳 Bosque y tierra (10–17, 23–24, 30, 36) · 🏡 Hogar y linaje (20–22, 28, 32, 34) · 🤝 Comunidad y cielo (9, 18–19, 27, 31). Toca una para ver su mensaje completo.</p>' +
    '<div class="discipline-grid" id="oraMazoGrid">' + mazoHTML + '</div>' +
    '<div id="oraDetalle" style="margin-top:10px"></div></div>' +

    /* TIRADAS */
    '<div id="oraTiradas" class="hidden">' +
    '<div class="menstrual-card" style="margin-bottom:10px"><h4>✨ Nueva consulta</h4>' +
    '<label>Tu tema o pregunta <input type="text" id="oraPregunta" placeholder="ej: esta semana con mi trabajo en la feria" maxlength="140"></label>' +
    '<div class="conv-row" style="margin-top:8px"><label>Tipo de consulta <select id="oraTipo"><option value="mensaje">🌅 Mensaje del día (1)</option><option value="cme">🧘 Cuerpo · Mente · Espíritu (3)</option><option value="lunar">🌙 Cruz lunar (4)</option><option value="respuesta">⚖️ Respuesta (1 + sí/no/espera)</option></select></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="oraTirar" class="btn btn-accent" style="width:auto">✨ Sacar carta(s)</button></div></div>' +
    '<div id="oraTiradaBox"></div>' +
    '<div class="menstrual-card hidden" id="oraGuardarBox" style="margin-top:10px"><h4>💾 Guardar esta consulta</h4>' +
    '<label>Mi frase clave / nota <input type="text" id="oraNota" placeholder="ej: mi brasa es el taller; la riego 20 min hoy" maxlength="160"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="oraGuardar" class="btn btn-accent" style="width:auto">💾 Guardar en diario</button></div></div>' +
    '</div>' +

    /* DIARIO */
    '<div id="oraDiario" class="hidden">' +
    '<div class="menstrual-card" style="margin-bottom:10px"><h4>📓 Diario del oráculo</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="oraDiaFecha"></label></div>' +
    '<label>Reflexión del día <input type="text" id="oraDiaTxt" placeholder="ej: La Vertiente me pidió llorar; lo hice y dormí mejor" maxlength="200"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="oraDiaAdd" class="btn btn-accent" style="width:auto">+ Guardar reflexión</button></div></div>' +
    '<div id="oraHistBox"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap">' +
    '<span id="oraStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="oraShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="oraClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar todo</button></span></div>' +
    '</div>';

  makeDialog('oraculoDialog', '🌬️ Oráculo — mensajes del territorio',
    'Mazo propio de 36 cartas (luna, mar, bosque, hogar), tiradas y diario. Todo queda <b>privado y local</b> en este dispositivo.',
    body);
}

/* ---------- renders ---------- */
function cartaPorN(n) { for (var i = 0; i < MAZO.length; i++) if (MAZO[i].n === n) return MAZO[i]; return MAZO[0]; }
function renderHoy() {
  var box = $('oraHoyBox'); if (!box) return;
  var k = todayKey();
  var c = MAZO[hashStr('oraculo-' + k) % MAZO.length];
  box.innerHTML = '<h4>🌅 Mensaje de hoy · ' + esc(k) + '</h4>' +
    '<p style="font-size:13px"><b>' + esc(c.icon + ' ' + c.nombre) + '</b> — ' + esc(c.clave) + '</p>' +
    '<p class="muted" style="font-size:11px">💬 ' + esc(c.mensaje) + '</p>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="oraHoyVer" class="btn" style="width:auto">Ver mensaje completo</button></div>';
  var v = $('oraHoyVer');
  if (v) v.onclick = function () { switchTab('Mazo'); renderDetalle(c.n); };
}
function renderDetalle(n) {
  var box = $('oraDetalle'); if (!box) return;
  var c = cartaPorN(n);
  var e = store();
  var fav = e.favs.indexOf('O' + n) >= 0;
  box.innerHTML = cartaHTML(c, null) +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="oraFav" class="btn" style="width:auto">' + (fav ? '⭐ En favoritos ✓' : '☆ Marcar favorita') + '</button>' +
    '<button type="button" id="oraLlevar" class="btn" style="width:auto">📝 Llevar a nota de hoy</button></div>';
  $('oraFav').onclick = function () {
    var s = store(); var k = 'O' + n; var i = s.favs.indexOf(k);
    if (i >= 0) s.favs.splice(i, 1); else s.favs.push(k);
    save(); renderDetalle(n); renderStats();
  };
  $('oraLlevar').onclick = function () { llevarANota('🌬️ ' + c.nombre + ': ' + c.ritual); };
  try { box.scrollIntoView({ block: 'nearest' }); } catch (e) {}
}
function filterMazo() {
  var q = (($('oraQ') || {}).value || '').toLowerCase();
  document.querySelectorAll('#oraMazoGrid .ora-carta').forEach(function (el) {
    el.style.display = (!q || (el.dataset.q || '').indexOf(q) >= 0) ? '' : 'none';
  });
}
function tirar() {
  var tipo = ($('oraTipo') || {}).value || 'mensaje';
  var pregunta = clean((($('oraPregunta') || {}).value || '').trim(), 140);
  var m = shuffled(MAZO);
  var n = tipo === 'mensaje' ? 1 : tipo === 'cme' ? 3 : tipo === 'lunar' ? 4 : 1;
  var pos = tipo === 'cme' ? POS3 : tipo === 'lunar' ? POS4 : tipo === 'respuesta' ? ['Respuesta'] : ['Mensaje'];
  TIRADA = { tipo: tipo, pregunta: pregunta, cartas: m.slice(0, n) };
  renderTirada(pos);
}
function renderTirada(pos) {
  var box = $('oraTiradaBox'); if (!box) return;
  var gb = $('oraGuardarBox');
  if (!TIRADA.cartas.length) { box.innerHTML = '<p class="muted">Aún sin consulta: escribe tu tema y pulsa <b>Sacar carta(s)</b>.</p>'; if (gb) gb.classList.add('hidden'); return; }
  var html = (TIRADA.pregunta ? '<div class="si-card"><h4>❓ Tu tema</h4><p>' + esc(TIRADA.pregunta) + '</p></div>' : '');
  TIRADA.cartas.forEach(function (c, i) { html += cartaHTML(c, (pos && pos[i]) || ('Carta ' + (i + 1))); });
  if (TIRADA.tipo === 'respuesta') {
    var c0 = TIRADA.cartas[0];
    html += '<div class="menstrual-card" style="border-color:var(--gold)"><h4>⚖️ Respuesta del oráculo</h4><p style="font-size:13px"><b>' + esc(c0.icon + ' ' + c0.nombre + ':</b> ' + c0.sino) + '</p></div>';
  }
  if (TIRADA.cartas.length > 1) {
    var hilo = TIRADA.cartas.map(function (c) { return c.nombre; }).join(' → ');
    html += '<div class="si-card"><h4>🧵 Hilo de la consulta</h4><p class="muted" style="font-size:11px">' + esc(hilo) + '. Léelas como una frase corrida: ¿qué historia te cuentan juntas?</p></div>';
  }
  box.innerHTML = html;
  if (gb) gb.classList.remove('hidden');
  try { box.scrollIntoView({ block: 'nearest' }); } catch (e) {}
}
function guardarLectura() {
  var nota = clean((($('oraNota') || {}).value || '').trim(), 160);
  if (!TIRADA.cartas.length) return alert('Primero saca tu carta');
  var s = store();
  s.lecturas.push({
    id: uid('ora'), fecha: todayKey(), tipo: TIRADA.tipo,
    pregunta: TIRADA.pregunta || '(sin tema escrito)',
    cartas: TIRADA.cartas.map(function (c) { return { n: c.n, nombre: c.icon + ' ' + c.nombre }; }),
    nota: nota
  });
  if (s.lecturas.length > 200) s.lecturas = s.lecturas.slice(-200);
  save('Consulta guardada ✓'); $('oraNota').value = '';
  renderHist(); renderStats();
  alert('Consulta guardada en tu diario ✓');
}
function nombreTirada(t) { return t === 'mensaje' ? 'Mensaje del día' : t === 'cme' ? 'Cuerpo · Mente · Espíritu' : t === 'lunar' ? 'Cruz lunar' : 'Respuesta'; }
function renderHist() {
  var box = $('oraHistBox'); if (!box) return;
  var s = store();
  var fecha = ($('oraDiaFecha') || {}).value || '';
  var lista = s.lecturas.slice().reverse();
  var html = '';
  var notas = Object.keys(s.diario || {}).sort().reverse();
  if (fecha && s.diario[fecha]) html += '<div class="si-card"><h4>📅 ' + esc(fecha) + '</h4><p>' + esc(s.diario[fecha]) + '</p></div>';
  else if (!lista.length && !notas.length) html += '<p class="muted">Sin registros aún. Tus consultas guardadas y reflexiones aparecerán aquí, privadas en este dispositivo.</p>';
  lista.slice(0, 30).forEach(function (l) {
    var cartas = l.cartas.map(function (c) { return esc(c.nombre); }).join(' · ');
    html += '<div class="si-card"><h4>🌬️ ' + esc(l.fecha) + ' · ' + esc(nombreTirada(l.tipo)) + '</h4>' +
      '<p class="muted" style="font-size:11px">❓ ' + esc(l.pregunta) + '</p>' +
      '<p style="font-size:12px"><b>' + cartas + '</b></p>' +
      (l.nota ? '<p style="font-size:12px">📝 ' + esc(l.nota) + '</p>' : '') +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" class="btn ora-del" data-id="' + l.id + '" style="width:auto;font-size:11px">🗑 Borrar</button></div></div>';
  });
  if (notas.length) {
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>💭 Reflexiones (' + notas.length + ')</h4>' +
      notas.slice(0, 20).map(function (k) { return '<p style="font-size:12px"><b>' + esc(k) + ':</b> ' + esc(s.diario[k]) + '</p>'; }).join('') + '</div>';
  }
  var favs = (s.favs || []).map(function (k) { var c = cartaPorN(+String(k).slice(1)); return c ? ('<span class="chip" style="margin:2px">⭐ ' + esc(c.nombre) + '</span>') : ''; }).join('');
  if (favs) html += '<div class="menstrual-card" style="margin-top:10px"><h4>⭐ Favoritas</h4><div>' + favs + '</div></div>';
  box.innerHTML = html;
  box.querySelectorAll('.ora-del').forEach(function (b) {
    b.onclick = function () {
      var st = store();
      st.lecturas = st.lecturas.filter(function (l) { return l.id !== b.dataset.id; });
      save(); renderHist(); renderStats();
    };
  });
}
function renderStats() {
  var st = $('oraStats'); if (!st) return;
  var s = store();
  st.textContent = s.lecturas.length + ' consulta(s) · ' + Object.keys(s.diario || {}).length + ' reflexión(es)' + (s.favs.length ? ' · ' + s.favs.length + ' favorita(s)' : '');
}
function llevarANota(txt) {
  if (!txt) return alert('Nada que llevar');
  try {
    var info = (typeof todayInfo === 'function') ? todayInfo() : null;
    if (!info) return alert('No se pudo ubicar hoy');
    var note = String(txt).slice(0, 280);
    if (info.luna === 'dft') { var c = cyc(currentCycleYear()); c.dft.nota = (c.dft.nota ? c.dft.nota + '\n' : '') + note; }
    else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + note; }
    save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
    alert('Llevado a la nota de hoy ✓');
  } catch (e2) { alert('No se pudo llevar a la nota'); }
}

/* ---------- setup ---------- */
function setup() {
  try {
    if (!$('btnOraculo')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnOraculo'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🌬️ Oráculo';
        try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'oraculo cartas mensaje territorio luna mar bosque consejo ritual respuesta sino cuerpo mente espiritu');
        var ref = $('btnTarot') || $('btnKinMaya') || $('btnEneagrama');
        if (ref && ref.parentNode === g) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnOraculo');
        var curG = cur.closest ? cur.closest('.action-group') : null;
        var curN = curG && curG.getAttribute ? curG.getAttribute('data-group') : null;
        if (curN && curN !== 'linaje') {
          var gd = document.querySelector('.action-group[data-group="linaje"] .group-btns');
          if (gd) { gd.appendChild(cur); try { cur.setAttribute('data-sub', 'interior'); } catch (eS2) {} }
        }
      } catch (eM) {}
    }
  } catch (e) {}
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnOraculo') < 0) ALL_BTNS.push('btnOraculo');
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnOraculo = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnOraculo"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnOraculo"> 🌬️ Oráculo';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnOraculo !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnOraculo = lab.querySelector('input').checked;
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
  try { addKw('btnPsico', 'oraculo mensaje ritual territorio'); } catch (e2) {}
  try { addKw('btnTarot', 'oraculo mensaje ritual'); } catch (e3) {}

  buildDialog();
  renderHoy();
  renderHist();
  renderStats();

  var b = $('btnOraculo');
  if (b) b.onclick = function () { renderHoy(); renderHist(); renderStats(); openDlg('oraculoDialog'); };

  ['Guia', 'Mazo', 'Tiradas', 'Diario'].forEach(function (t) {
    var tb = $('tabOra' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });
  var q = $('oraQ'); if (q) q.oninput = filterMazo;
  document.querySelectorAll('#oraMazoGrid .ora-carta').forEach(function (card) {
    card.onclick = function () { renderDetalle(+card.dataset.n); };
  });
  var tr = $('oraTirar'); if (tr) tr.onclick = tirar;
  var gd2 = $('oraGuardar'); if (gd2) gd2.onclick = guardarLectura;
  var da = $('oraDiaAdd');
  if (da) da.onclick = function () {
    var k = ($('oraDiaFecha') && $('oraDiaFecha').value) || todayKey();
    var txt = clean((($('oraDiaTxt') || {}).value || '').trim(), 200);
    if (!txt) return alert('Escribe tu reflexión primero (2 líneas bastan)');
    var s = store();
    s.diario[k] = txt;
    save('Guardado ✓'); $('oraDiaTxt').value = '';
    renderHist(); renderStats();
  };
  var df = $('oraDiaFecha');
  if (df) df.onchange = renderHist;
  var sh = $('oraShare');
  if (sh) sh.onclick = async function () {
    var s = store();
    var last = (s.lecturas || []).slice(-1)[0];
    var txt = last
      ? ('🌬️ Mi oráculo (' + last.fecha + ' · ' + nombreTirada(last.tipo) + ')\n❓ ' + last.pregunta + '\n✨ ' + last.cartas.map(function (c) { return c.nombre; }).join(' · ') + (last.nota ? '\n📝 ' + last.nota : ''))
      : '🌬️ Oráculo: aún sin consultas guardadas';
    await share('Mi Oráculo', txt);
  };
  var cl = $('oraClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar todo tu registro del Oráculo (consultas, diario, favoritas)?')) return;
    try { var u = userData(); u.oraculo = { lecturas: [], diario: {}, favs: [] }; } catch (e) {}
    save(); renderHist(); renderStats();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 400); });
else setTimeout(setup, 400);

})();
