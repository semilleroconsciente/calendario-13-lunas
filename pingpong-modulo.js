/* ============================================================
   PING PONG (TENIS DE MESA) — Calendario 13 Lunas (Penco·Bío-Bío)
   Cuarta sección de Deportes dentro de Cuerpo & Salud:
   - Reutiliza la sub-sección "Deportes" (data-sub="deportes")
     creada por futbol-modulo.js, en el grupo cuerpo.
   - Botón btnPingPong (🏓 Ping Pong) con diálogo
     pingpongDialog de 6 pestañas:
     1) 🌱 Aprende desde cero (8 pasos progresivos)
     2) 🏓 Fundamentos (agarre, drive, push, topspin, servicio, pies)
     3) 📋 Reglas (ITTF, sets, saques, dobles, mesa y paleta)
     4) 🏋️ Planes (por nivel + series tipo + ritmo lunar)
     5) 🛟 Seguridad (muñeca, codo, postura, mesa, sede Penco)
     6) 📓 Mi bitácora (partidos y entrenos, privada por usuario)
   - Todo local y privado por usuario: userData().pingpong
     { logs:[] }
   - 100% offline. Enfoque: reflejos, juego limpio y comunidad.
     No reemplaza a un profe ni a Primeros Auxilios.
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
  return String(s == null ? '' : s).slice(0, n || 200);
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
    if (!u) return { logs: [] };
    if (!u.pingpong) u.pingpong = { logs: [] };
    var m = u.pingpong;
    if (!Array.isArray(m.logs)) m.logs = [];
    return m;
  } catch (e2) { return { logs: [] }; }
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

/* ---------------- DATOS ---------------- */
var PASOS = [
  { n: 'Paso 1 · Mesa, paleta y primer toque (1–2 semanas)', ico: '🏓', para: 'Quien parte de cero o vuelve tras años sin jugar.', mat: 'Paleta prestada + 3 pelotas + mesa de sede o multicancha techada.', como: 'Sostén shakehand (como dar la mano) 5 min, bota la pelota en la paleta 20 veces sin que caiga, luego pásala a la mesa y que pique 1 vez por lado. Juego: 10 toques seguidos con un amigo = punto.', nota: 'La primera quincena manda el toque suave, no el remate. Si rompes pelotas a cada rato, vas muy fuerte.', cuidado: 'Mesa con bordes rotos o patas cojas = no se juega (cortes y volcamientos). Revisa antes.' },
  { n: 'Paso 2 · Drive de derecha (el pan con mantequilla)', ico: '➡️', para: 'Pasar 10 seguidas sin errar.', mat: 'Compañero que bloquee suave al otro lado.', como: 'Pies en 45°, paleta cerrada a 45°, golpe de hombro-codo (no solo muñeca) de atrás-adelante. 3 series de 20 drives lentos al centro. Luego al revés: tú bloqueas y el otro ataca.', nota: 'Mira la pelota hasta que toca tu goma: el 80% de los errores es mirar al rival antes.', cuidado: 'Hombro frío + 50 drives fuertes = dolor. Calienta con círculos y parte al 50%.' },
  { n: 'Paso 3 · Revés y empuje (push)', ico: '↔️', para: 'No regalar el lado débil.', mat: 'Canasto de 10 pelotas si hay, si no de a 1.', como: 'Revés plano 3×15 al centro + push (corte suave por debajo) 3×10 cuando viene baja con efecto. Juego: derecha-revés alternados 5 min sin que caiga.', nota: 'Error típico: solo jugar de derecha y quedar cruzado. El revés te ahorra correr 2 metros.', cuidado: 'Codo extendido tieso al empujar = codo de tenista. Flecta y usa el cuerpo.' },
  { n: 'Paso 4 · Servicio legal (bote + 16 cm)', ico: '🎯', para: 'Sacar sin faltas y molestando un poco.', mat: 'Pelota naranja o blanca 40+.', como: 'Pelota en palma abierta, lanza 16 cm mínimo, golpea bajando tras el bote y que pique tu lado y el otro. Practica 10 saques planos + 10 con cortado suave. Regla de oro: saque siempre visible, sin esconder con el cuerpo.', nota: 'Saque bueno al inicio = al revés del rival, bajo y corto. No necesita ser rápido.', cuidado: 'Espalda: lanza con piernas, no encorvando la lumbar 100 veces.' },
  { n: 'Paso 5 · Pies (el secreto que nadie ve)', ico: '🦶', para: 'Llegar cómodo a cada pelota.', mat: 'Zapatilla plana que no resbale + 2 m libres por lado.', como: 'Pasitos laterales (shuffle, sin cruzar pies) + entrada-salida para pelotas cortas. DRILL: compañero reparte 1 al centro, 1 a tu derecha, 1 corta: vuelve al centro siempre. 5 vueltas.', nota: 'Si llegas tarde y estiras el brazo, el punto ya se perdió. Mueve los pies primero.', cuidado: 'Piso mojado o con tierra = resbalón seguro: barre y seca antes.' },
  { n: 'Paso 6 · Efectos base (cortado y topspin suave)', ico: '🌀', para: 'Que la pelota haga algo distinto.', mat: 'Paleta con goma viva (no madera pelada).', como: 'Cortado: paleta abierta, rozar por debajo (la pelota flota). Topspin: paleta cerrada, rozar de abajo-arriba (la pelota pica y salta). 10 y 10 lentos. Juego: 1 cortada + 1 subida, por turnos.', nota: 'Efecto sin control = punto regalado. Primero que pase 8/10, después que moleste.', cuidado: 'Muñeca que chasquea con dolor = para efectos 1 semana, solo juego plano.' },
  { n: 'Paso 7 · Tu primer set a 11 (con conteo real)', ico: '🔢', para: 'Jugar con reglas de verdad sin enredarse.', mat: 'Un set a 11, 2 saques por turno, gana por 2.', como: 'Juega 3 sets a 11 con un amigo, anotando en papel. Practica: cantar el marcador antes de sacar, cambiar de saque cada 2 y pedir “net” si toca la red y pasa. Si van 10-10, saques alternos hasta ganar por 2.', nota: 'En tu primer torneo barrial lo que más vale es saber contar y sacar legal.', cuidado: 'Pique feo = punto perdido con dignidad. Sin raquetazos a la mesa: la paga el barrio.' },
  { n: 'Paso 8 · Autonomía (listo para el torneo del barrio)', ico: '🏓', para: 'Meta mínima antes de jugar campeonato o liga escolar.', mat: 'Test en una semana normal.', como: 'Prueba: 50 drives sin errar en peloteo + 8/10 saques legales + jugar 3 sets completos sin fundirte ni enojarte + arbitrar 1 partido de otros. Si lo logras 2 semanas seguidas, inscríbete al torneo.', nota: 'Autonomía también es arbitrar bien: cantar claro, reconocer el borde y felicitar al rival.', cuidado: 'Primeros torneos con gente conocida y mesa en buen estado.' }
];

var FUNDAMENTOS = [
  { n: 'Agarre · shakehand y penhold', ico: '🤝', para: 'La base: si agarras mal, todo cuesta el doble.', mat: 'Paleta con grip seco.', como: 'Shakehand (el más usado en Chile): como dar la mano, índice en el revés y pulgar en la derecha, suelto. Penhold (asiático): como lápiz, gran revés de una cara pero exige más pies. Elige uno y no cambies por 3 lunas. DRILL: 2 min rebotes con cada cara sin mirar la paleta.', nota: 'Agarre apretado = antebrazo duro en 10 min. Suelta 2 dedos de fuerza.', cuidado: 'Ampollas semana 1: normal. Cinta o grip nuevo; herida abierta = pausa.' },
  { n: 'Drive y bloqueo (ataque + muro)', ico: '💥', para: 'Atacar y devolver ataques.', mat: 'Compañero o pared con línea a 15 cm de la mesa.', como: 'Drive: giro de cintura + paleta de atrás-adelante, termina a la frente. Bloqueo: paleta quieta, usa la velocidad que viene (no pegues de más). DRILL: uno ataca 5 y el otro bloquea 5, 6 vueltas.', nota: 'El bloqueo gana partidos barriales: deja que el apurado se equivoque.', cuidado: 'Hombro que pincha arriba = baja el remate y fortalece manguito rotador.' },
  { n: 'Push y chop (juego corto y defensa)', ico: '🔪', para: 'No regalar pelotas bajas.', mat: 'Pelotas que vienen con cortado.', como: 'Push: entra con pies, paleta abierta, empuja corto y bajo (2 botes en el otro lado si puedes). Chop defensivo: 2 m atrás, corta largo con piernas. DRILL: 10 pushes cortos + 10 largos alternados.', nota: 'Pelota corta se juega corta. Querer atacar todo lo corto = red o fuera.', cuidado: 'Rodillas: entra flectando, no doblando la espalda como bisagra.' },
  { n: 'Topspin y remate (subir el nivel)', ico: '🚀', para: 'Pasar de pasar a mandar.', mat: 'Pelota alta o larga para practicar.', como: 'Topspin: roza de abajo-arriba con piernas, la pelota curva y pica rápido. Remate: solo a pelota alta y cómoda, 80% fuerza al cuerpo del rival. DRILL: 10 topspins lentos al centro + 5 remates al 70%.', nota: 'Topspin fallado 5 veces seguidas = vuelve a drive plano 10 min y reintenta.', cuidado: 'Espalda y codo: el topspin nace de piernas, no de latigazo lumbar.' },
  { n: 'Servicio y resto (los 2 golpes que más puntos dan)', ico: '🎯', para: 'Ganar sin peloteo largo.', mat: 'Variedad: corto, largo, con y sin efecto.', como: 'Saque: mismo gesto, distinto efecto (el rival adivina mal). Corto al revés + largo rápido al cuerpo es la combinación barrial ganadora. Resto: corto-push, largo-drive. DRILL: 20 saques variados + 10 restos colocados.', nota: 'Anota qué saque te devuelve mal cada rival: repítelo hasta que lo aprenda.', cuidado: 'No escondas el saque (falta) ni discutas cada punto: pide “repite” y sigue.' },
  { n: 'Dobles y juego en equipo', ico: '👥', para: 'El formato más social de sedes y colegios.', mat: 'Pareja fija + señales simples.', como: 'Orden alterno: tú-derecha, compañero-revés, etc. Saque cruzado (de tu derecha a su derecha) obligatorio en dobles. Señal antes de sacar: “yo corta, tú atacas”. DRILL: 2 sets en dobles rotando parejas.', nota: 'En dobles se habla: “mía”, “tuya”, “corta”, “larga”. El silencio pierde puntos.', cuidado: 'Choques de paletas: avisa quién va. Paleta rota por choque = pausa y risas, no pelea.' }
];

var REGLAS = [
  { n: 'Mesa, paleta y pelota (medidas oficiales)', ico: '📏', txt: 'Mesa: 2,74 m × 1,525 m, alto 76 cm, red de 15,25 cm. Pelota: 40+ mm, blanca o naranja mate. Paleta: madera + 2 gomas (una roja y una negra obligatorias en torneo). En sede barrial basta mesa nivelada, red tensa y pelotas redondas (rueda la pelota en la mesa: si cojea, descártala).' },
  { n: 'Sets a 11 y partidos (lo que todos enredan)', ico: '🔢', txt: 'Set a 11 puntos, gana por 2 (si van 10-10 siguen hasta diferencia de 2). Partido: al mejor de 5 o 7 sets (3 o 4 ganados). Saques: 2 por jugador, alternados; en 10-10, 1 y 1. Canta el marcador antes de cada saque. Cambio de lado cada set y en el decisivo al llegar a 5.' },
  { n: 'Saque legal (4 requisitos)', ico: '✅', txt: '1) Pelota en palma abierta y quieta tras la línea. 2) Lanzar vertical 16 cm mínimo (sin girarla con dedos). 3) Golpear en bajada tras el bote. 4) Visible todo el rato (sin esconder con cuerpo o ropa). Debe picar en tu lado y luego en el otro (en dobles, cruzado). Si toca red y pasa (“net”), se repite sin contar.' },
  { n: 'Puntos: cuándo se gana y se pierde', ico: '⚖️', txt: 'Ganas si el rival no devuelve, tira fuera, a la red, toca la mesa con la mano libre, mueve la mesa o golpea 2 veces seguidas (doble). Volea (pegar sin bote en mesa) = punto perdido. Borde (edge): si pica en el canto, vale; si pega en el costado, no. Mano de la paleta vale como paleta; mano libre que toca la mesa = punto perdido.' },
  { n: 'Dobles: orden y saque cruzado', ico: '👥', txt: 'Saque siempre cruzado (de tu cuadro derecho al cuadro derecho rival). Golpeo alterno obligatorio: tú, rival 1, tu compañero, rival 2. Si te equivocas de orden, el punto se pierde. En el set decisivo cambian el orden de recepción al llegar a 5. Ideal para sedes: todos juegan y nadie espera 30 min.' },
  { n: 'Paleta, fair play y cuidado barrial', ico: '✨', txt: 'Gomas: límpialas con agua (no solventes), guárdalas con funda. Fair play: reconoce el borde (“fue filo”), ofrece repetir el punto dudoso, no cantes fuerte para desconcentrar ni pelotees mientras otro saca al lado. En Penco: respeta turnos pegados en la pared, trae tus pelotas, no te sientes en la mesa y deja la sede barriendo: la mesa dura años si se cuida.' }
];

var PLANES = [
  { n: 'Nivel 0 · Familia y niños (6–12)', ico: '🌱', para: 'Meta: pelotear 20 toques y sacar legal 5/10.', mat: '2 veces/semana, 40 min, paleta liviana.', como: 'Calienta con rebotes (2 min) → 10 min drives al centro con papá/mamá → 10 min saques jugando a embocar un vaso → 15 min “rondín” (todos contra todos a 3 puntos) → contar juntos. Sin ranking: se celebra el peloteo largo y arbitrar bien.', nota: '60 min de juego activo al día (OMS): el ping pong cuenta. Agua y luz pareja (sin sol de frente).', cuidado: 'Mesa a la altura: niños chicos con taco o mesa baja. Pelotas lejos de la boca en menores.' },
  { n: 'Nivel 1 · Base barrial (13+ o retorno)', ico: '🐣', para: 'Meta: 100 drives en peloteo + 1 set completo arbitrado.', mat: '2 sesiones/sem + 1 tarde de juegos.', como: 'A: 10 min pies + 15 min drive/revés + 15 min saques. B: 10 min push + 10 min topspin suave + 20 min sets a 11. Suma 10 min por semana, no más.', nota: 'Si andas fundido, cambia a juego corto y saques (técnica suave).', cuidado: 'Dolor de codo 2 sesiones seguidas = 1 semana sin efectos, solo juego plano + consulta.' },
  { n: 'Nivel 2 · Intermedio (juegas torneo sede/colegio)', ico: '🐬', para: 'Meta: rematar + defender + plan de partido.', mat: '3 sesiones: 2 mesa + 1 físico en casa.', como: 'Mesa 1: servicios variados + 3 sets con plan (ej: “todo a su revés”). Mesa 2: 10× (3 drives + 1 topspin) + dobles 30 min. Casa: piernas, core y muñeca (2×/semana, 25 min). Anota en bitácora: saques que funcionaron y errores no forzados.', nota: 'Mide simple: % saques buenos, peloteos +5 y puntos con tu jugada preparada.', cuidado: 'Hombro que pincha = hielo y sin remates 1 semana. Paño frío y kine si repite.' },
  { n: 'Nivel 3 · Avanzado (liga, 5–7 sets)', ico: '🔥', para: 'Meta: aguantar torneo de 3 h + tercer balón armado.', mat: '3–4 sesiones + torneo por luna.', como: 'Semana: 1 multiball (canasto 100 pelotas) + 1 sets con presión (10-10 simulado) + 1 video-análisis de tu juego + torneo. Tercer balón: saque pensado + ataque definido. Come 2 h antes, 500 ml agua por hora.', nota: 'Duerme 8 h: los reflejos caen 30% con mala noche. Cinta, 2 pelotas y toalla en el bolso.', cuidado: 'Lumbago (dolor que baja a la pierna) = parar y consultar. Volver antes = 1 mes fuera.' },
  { n: 'Series tipo (copia y pega)', ico: '📋', txt: 'CALENTAR (siempre 8 min): pies + círculos muñeca/hombro + 50 drives progresivos. PELOTEO: 5 min drive + 5 min revés + 5 min push. SAQUES: 20 variados (10 cortos + 10 largos). JUEGO: 3 sets a 11 con marcador real. VUELTA A LA CALMA: 3 min peloteo suave + elongar antebrazo, hombro y piernas. Regla: efectos duros nunca más del 20% de la semana.' },
  { n: 'Ritmo lunar penqueño (entrena con la luna)', ico: '🌗', txt: 'Menguante: técnica suave (toque, push, saques cortos). Creciente: suma físico y sets. Llena: torneo o prueba (¿cuántos peloteos de 20 seguidos?). Nueva: descanso, limpiar gomas y ver tu estilo (videos). Invierno (Pukem): sede techada, mesa lejos de la humedad (el tablero se hincha). Verano (Walüng): evita sol de frente y viento en exterior: la 40+ se vuela.' }
];

var SEGURIDAD = [
  { n: 'Calentar siempre (8 min que evitan el codo de tenista)', ico: '🔥', txt: 'Pies 3 min + círculos de muñeca, codo y hombro + 30 drives de menos a más + 10 saques suaves. En frío (Penco, tardes de sur): agrega 3 min con polerón y parte con juego corto antes que remates. Elongar fuerte ANTES rinde menos: mejor movilidad dinámica y elongar DESPUÉS.' },
  { n: 'Muñeca y codo (las N°1 del ping pong)', ico: '💪', txt: 'Muñeca: agarre suelto, efectos con antebrazo (no solo latigazo), fortalece con botella de agua 3×15. Codo: paleta no tan pesada, flecta al empujar, evita 100 topspins el primer día. Dolor que dura +48 h o baja fuerza = consulta (CESFAM/kine), no seguir “a lo macho”.' },
  { n: 'Hombro, espalda y caídas', ico: '🧍', txt: 'Hombro: remata al 80%, termina el gesto (no frenes en seco). Espalda: entra con piernas a pelotas cortas, no como bisagra. Caídas: mesa con patas trabadas, sillas y bolsos fuera del área (2 m libres). Tropezón con paleta en mano = suelta la paleta, protege la cabeza.' },
  { n: 'Mesa y entorno (accidentes tontos que duelen)', ico: '⚠️', txt: 'Mesa: patas con seguro, red apretada, sin bordes astillados (lija o avisa). Entorno: luz pareja (no ampolleta justo encima que encandila), piso seco y barrido, pelotas sueltas se recogen altiro (tobillo). Niños chicos fuera del área mientras se juega fuerte.' },
  { n: 'Niños y fair play penqueño', ico: '🧒', txt: 'Partidos cortos (a 7 o 1 set), parejas mezcladas por nivel, todos arbitran alguna vez. Sin burlas por errar saques: se aplaude el peloteo largo. Sin gritos en el saque ajeno. El que se enoja feo sale 1 set a respirar: el grupo lo apoya, no lo funa.' },
  { n: 'Sedes de Penco: dónde jugar bien', ico: '🗺️', txt: 'Sede vecinal / colegio / gimnasio: ideal (techo, luz, mesa fija). Multicancha techada: cuida el viento (la pelota se vuela) y el sol lateral (cambia de lado cada set). Playa/aire libre: solo pichanga (viento + arena matan el juego y las gomas). Lleva tus pelotas y paño: la sede te lo agradece y la mesa dura años.' }
];

/* ---------------- DIALOGO ---------------- */
function rowCard(c) {
  if (c.txt) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4>' +
      '<p class="su-77e2fe">' + esc(c.txt) + '</p></div>';
  }
  return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4>' +
    (c.para ? '<p><b>Para:</b> ' + esc(c.para) + '</p>' : '') +
    (c.mat ? '<p><b>Necesitas:</b> ' + esc(c.mat) + '</p>' : '') +
    '<p><b>Cómo:</b> ' + esc(c.como) + '</p>' +
    (c.nota ? '<p class="muted">' + esc(c.nota) + '</p>' : '') +
    (c.cuidado ? '<p class="su-d33357">⚠️ ' + esc(c.cuidado) + '</p>' : '') + '</div>';
}
function switchTab(name) {
  ['Aprende', 'Fundamentos', 'Reglas', 'Planes', 'Seguridad', 'Bitacora'].forEach(function (t) {
    var p = $('pp' + t), b = $('tabPp' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

function buildDialog() {
  var aprendeHTML = PASOS.map(rowCard).join('');
  var fundHTML = FUNDAMENTOS.map(rowCard).join('');
  var reglasHTML = REGLAS.map(rowCard).join('');
  var planesHTML = PLANES.map(rowCard).join('');
  var segHTML = SEGURIDAD.map(rowCard).join('');

  var body =
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabPpAprende" class="btn btn-accent su-30e741">🌱 Aprende</button>' +
    '<button type="button" id="tabPpFundamentos" class="btn su-30e741">🏓 Fundamentos</button>' +
    '<button type="button" id="tabPpReglas" class="btn su-30e741">📋 Reglas</button>' +
    '<button type="button" id="tabPpPlanes" class="btn su-30e741">🏋️ Planes</button>' +
    '<button type="button" id="tabPpSeguridad" class="btn su-30e741">🛟 Seguridad</button>' +
    '<button type="button" id="tabPpBitacora" class="btn su-30e741">📓 Mi bitácora</button></div>' +
    '<div id="ppAprende">' + aprendeHTML +
    '<div class="menstrual-card su-51d56a"><h4>🏓 Regla de oro</h4><p class="muted su-6cb285">Primero el toque y los pies, después el remate. Quien saca legal, cuenta bien y devuelve 10 seguidas gana en cualquier sede penqueña.</p></div></div>' +
    '<div id="ppFundamentos" class="hidden"><div class="conv-row"><label class="su-97445a">🔍 Filtrar <input type="text" id="ppFundQ" placeholder="drive, saque, topspin, dobles..."></label></div><div id="ppFundList" class="su-bf3828">' + fundHTML + '</div></div>' +
    '<div id="ppReglas" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>📋 Antes del partido</h4><p class="muted su-6cb285">Acuerden sets (3 o 5), saque legal y quién anota. Pelota dudosa de borde = se repite si no hay acuerdo. En sede sin árbitro, la palabra vale.</p></div>' +
    '<div class="su-a22da5">' + reglasHTML + '</div></div>' +
    '<div id="ppPlanes" class="hidden"><div class="conv-row"><label class="su-97445a">🔍 Filtrar <input type="text" id="ppPlanesQ" placeholder="nivel, niños, series, luna..."></label></div><div id="ppPlanesList" class="su-bf3828">' + planesHTML + '</div></div>' +
    '<div id="ppSeguridad" class="hidden"><div class="su-be2653">' + segHTML + '</div>' +
    '<div class="menstrual-card su-51d56a"><h4>🚨 Emergencias</h4><p class="muted su-6cb285">SAMU 131 · Bomberos 132 · CESFAM Penco. Corte con borde roto, esguince por pelota suelta o golpe en el ojo = se para y se pide ayuda. Detalle en 🩹 Primeros Auxilios de la app.</p></div></div>' +
    '<div id="ppBitacora" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>➕ Anotar partido o entreno</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="ppFecha"></label><label>Tipo <select id="ppTipo"><option>Entreno</option><option>Partido amistoso</option><option>Torneo sede/colegio</option><option>Dobles</option><option>Entreno multiball</option><option>Juego libre</option></select></label></div>' +
    '<div class="conv-row"><label>Lugar <select id="ppLugar"><option>Sede vecinal</option><option>Colegio / liceo</option><option>Gimnasio</option><option>Multicancha techada</option><option>Casa</option><option>Otro</option></select></label><label>Resultado <select id="ppRes"><option>Gané</option><option>Perdí</option><option>Empate / sin contar</option><option>Solo entrené</option></select></label></div>' +
    '<div class="conv-row"><label>Sets a favor <input type="number" id="ppSF" min="0" step="1" placeholder="ej: 3"></label><label>Sets en contra <input type="number" id="ppSC" min="0" step="1" placeholder="ej: 1"></label><label>Minutos <input type="number" id="ppMin" min="0" step="5" placeholder="ej: 60"></label></div>' +
    '<div class="conv-row"><label>Esfuerzo <select id="ppEsfuerzo"><option>Suave</option><option>Medio</option><option>Fuerte</option></select></label></div>' +
    '<label>Notas <input type="text" id="ppDetalle" placeholder="qué funcionó, qué saque rindió, rival..." maxlength="120"></label>' +
    '<div class="dlg-actions su-8f9e27"><button type="button" id="ppAdd" class="btn btn-accent su-30e741">+ Guardar</button></div></div>' +
    '<div class="conv-row su-8a77e5"><label class="su-4b3de7">🔍 Buscar <input type="text" id="ppLogQ" placeholder="torneo, dobles, sede..."></label><label>Filtrar <select id="ppLogF"><option value="">Todo</option><option>Entreno</option><option>Partido amistoso</option><option>Torneo sede/colegio</option><option>Dobles</option><option>Entreno multiball</option><option>Juego libre</option></select></label></div>' +
    '<div id="ppResumen" class="menstrual-card su-8a77e5"></div>' +
    '<div id="ppLog" class="habits-list su-9daa59"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="ppStats" class="muted su-11a508"></span><span class="su-3de8f9"><button type="button" id="ppShare" class="btn su-30e741">📤 Compartir</button><button type="button" id="ppClear" class="btn su-214f75">🗑 Borrar</button></span></div></div>';

  makeDialog('pingpongDialog', '🏓 Ping Pong — Aprende · Reglas · Planes · Penco',
    'Tenis de mesa en <b>⚽ Deportes</b> de <b>💚 Cuerpo & Salud</b>: de cero a tu primer torneo de sede, con técnica, reglas ITTF simples y fair play. Todo <b>privado y local</b>, 100% offline.',
    body);
}

/* ---------------- BITÁCORA ---------------- */
function renderLog() {
  var box = $('ppLog'); if (!box) return;
  var m = store();
  var data = m.logs || [];
  var q = (($('ppLogQ') && $('ppLogQ').value) || '').toLowerCase();
  var f = (($('ppLogF') && $('ppLogF').value) || '');
  var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
  var list = data.filter(function (r) {
    if (f && r.tipo !== f) return false;
    if (q) {
      var t = ((r.tipo || '') + ' ' + (r.lugar || '') + ' ' + (r.res || '') + ' ' + (r.detalle || '')).toLowerCase();
      var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
      if (tn.indexOf(qn) < 0) return false;
    }
    return true;
  });
  var res = $('ppResumen'), st = $('ppStats');
  var totMin = data.reduce(function (a, r) { return a + (+r.min || 0); }, 0);
  var gan = data.filter(function (r) { return r.res === 'Gané'; }).length;
  var per = data.filter(function (r) { return r.res === 'Perdí'; }).length;
  var sf = data.reduce(function (a, r) { return a + (+r.sf || 0); }, 0);
  var sc = data.reduce(function (a, r) { return a + (+r.sc || 0); }, 0);
  if (res) {
    res.innerHTML = '<h4>📊 Resumen</h4><p class="muted su-6cb285">' + data.length + ' registro(s) · 🏆 ' + gan + ' ganados · 😅 ' + per + ' perdidos · 🧮 sets ' + sf + '-' + sc + ' · ⏱ ' + totMin + ' min' +
      (data.length ? '<br>Último: ' + esc(data.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); })[0].fecha || '') : '') + '</p>';
  }
  if (!list.length) {
    box.innerHTML = '<p class="muted su-e201a8">Sin registros' + (data.length ? ' para este filtro.' : '. Anota tu primer entreno o partido arriba: hasta “20 drives seguidos” cuenta.') + '</p>';
    if (st) st.textContent = data.length ? data.length + ' en total' : '';
    return;
  }
  box.innerHTML = list.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 80).map(function (r) {
    var ico = (r.tipo === 'Entreno' || r.tipo === 'Entreno multiball') ? '🏋️' : '🏓';
    return '<div class="hora-item"><span class="su-6cb285">' + ico + ' <b>' + esc(r.tipo || 'Ping Pong') + '</b> · ' + esc(r.lugar || '') +
      '<br><span class="muted su-0d5be0">' + esc(r.fecha || '') + (r.res ? ' · ' + esc(r.res) : '') + ((+r.sf || +r.sc) ? ' · ' + (+r.sf || 0) + '-' + (+r.sc || 0) : '') + (r.min ? ' · ' + esc(String(r.min)) + ' min' : '') + (r.esfuerzo ? ' · ' + esc(r.esfuerzo) : '') + (r.detalle ? ' · ' + esc(r.detalle) : '') + '</span></span>' +
      '<button type="button" class="btn btn-icon pp-del" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.pp-del').forEach(function (x) {
    x.onclick = function () {
      var s2 = store();
      s2.logs = (s2.logs || []).filter(function (r) { return r.id !== x.dataset.k; });
      save(); renderLog();
    };
  });
  if (st) st.textContent = list.length + ' mostrada(s) · ' + data.length + ' total';
}

function bindFilter(qId, listId) {
  var q = $(qId);
  if (q) q.oninput = function () {
    var v = (q.value || '').toLowerCase();
    var vn = v.normalize ? v.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : v;
    var list = $(listId); if (!list) return;
    list.querySelectorAll('.si-card').forEach(function (c) {
      var t = (c.textContent || '').toLowerCase();
      var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
      c.style.display = (!v || tn.indexOf(vn) >= 0) ? '' : 'none';
    });
  };
}

function ensureDeportesSub(g) {
  try {
    var lab = g.querySelector('.sub-label[data-sub="deportes"]');
    if (!lab) {
      lab = document.createElement('span');
      lab.className = 'sub-label';
      lab.setAttribute('data-sub', 'deportes');
      lab.textContent = '⚽ Deportes';
      g.appendChild(lab);
    }
    return lab;
  } catch (e) { return null; }
}

/* ---------------- SETUP ---------------- */
function setup() {
  /* 1) botón btnPingPong en Cuerpo & Salud > Deportes */
  try {
    var g = document.querySelector('.action-group[data-group="cuerpo"] .group-btns');
    if (g) {
      ensureDeportesSub(g);
      var existing = $('btnPingPong');
      if (existing) {
        try { existing.setAttribute('data-sub', 'deportes'); } catch (eS) {}
      } else {
        var btn = document.createElement('button');
        btn.id = 'btnPingPong'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🏓 Ping Pong';
        try { btn.setAttribute('data-sub', 'deportes'); } catch (eS2) {}
        btn.setAttribute('data-keywords', 'ping pong tenis mesa table tennis paleta goma drive reves topspin saque servicio dobles set 11 puntos sede torneo deporte entrenar reflejos fair play');
        var ref = $('btnCapoeira') || $('btnBasquetbol') || $('btnFutbol');
        if (ref && ref.parentNode === g) {
          if (ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
          else g.appendChild(btn);
        } else {
          var lab = g.querySelector('.sub-label[data-sub="deportes"]');
          if (lab) {
            var next = lab.nextElementSibling;
            while (next && next.classList && next.classList.contains('btn') && next.id !== 'btnPingPong') next = next.nextElementSibling;
            if (next) g.insertBefore(btn, next);
            else g.appendChild(btn);
          } else g.appendChild(btn);
        }
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnPingPong') < 0) ALL_BTNS.push('btnPingPong');
  } catch (e2) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnPingPong = ['cuerpo', 'deportes'];
  } catch (e3) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      if (!BTN_ORDER['cuerpo|deportes']) BTN_ORDER['cuerpo|deportes'] = ['btnFutbol', 'btnPingPong'];
      else if (BTN_ORDER['cuerpo|deportes'].indexOf('btnPingPong') < 0) BTN_ORDER['cuerpo|deportes'].push('btnPingPong');
    }
  } catch (e4) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p]) {
          if (p === 'deportista' || p === 'salud' || p === 'adolescente' || p === 'estudiante' || p === 'completo' || p === 'todo' || p === 'adulto') PRESETS[p].btnPingPong = true;
        }
      });
    }
  } catch (e5) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e6) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e7) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e8) {}
  /* 3) checkbox en configDialog (grupo Cuerpo & Salud) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnPingPong"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Cuerpo') >= 0) {
          var lab2 = document.createElement('label');
          lab2.className = 'check-row';
          lab2.innerHTML = '<input type="checkbox" data-btn="btnPingPong"> 🏓 Ping Pong';
          gr.appendChild(lab2);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab2.querySelector('input').checked = !vis || vis.btnPingPong !== false;
            lab2.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnPingPong = lab2.querySelector('input').checked;
                  if (typeof scheduleSave === 'function') scheduleSave();
                  if (typeof applyVisibility === 'function') applyVisibility();
                }
              } catch (e9) {}
            };
          } catch (e10) {}
        }
      });
    }
  } catch (e11) {}

  /* 4) diálogo */
  buildDialog();
  renderLog();

  var b = $('btnPingPong');
  if (b) b.onclick = function () {
    if ($('ppFecha') && !$('ppFecha').value) $('ppFecha').value = todayKey();
    renderLog();
    openDlg('pingpongDialog');
  };

  ['Aprende', 'Fundamentos', 'Reglas', 'Planes', 'Seguridad', 'Bitacora'].forEach(function (t) {
    var tb = $('tabPp' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  bindFilter('ppFundQ', 'ppFundList');
  bindFilter('ppPlanesQ', 'ppPlanesList');
  var lq = $('ppLogQ'); if (lq) lq.oninput = renderLog;
  var lf = $('ppLogF'); if (lf) lf.onchange = renderLog;

  var ad = $('ppAdd');
  if (ad) ad.onclick = function () {
    var m = store();
    m.logs.push({
      id: uid('pp'),
      fecha: ($('ppFecha') || {}).value || todayKey(),
      tipo: ($('ppTipo') || {}).value || 'Partido amistoso',
      lugar: ($('ppLugar') || {}).value || 'Sede vecinal',
      res: ($('ppRes') || {}).value || 'Solo entrené',
      sf: parseFloat(($('ppSF') || {}).value) || 0,
      sc: parseFloat(($('ppSC') || {}).value) || 0,
      min: parseFloat(($('ppMin') || {}).value) || 0,
      esfuerzo: ($('ppEsfuerzo') || {}).value || 'Medio',
      detalle: clean((($('ppDetalle') || {}).value || '').trim(), 120)
    });
    save('Ping Pong guardado 🏓');
    if ($('ppSF')) $('ppSF').value = '';
    if ($('ppSC')) $('ppSC').value = '';
    if ($('ppMin')) $('ppMin').value = '';
    if ($('ppDetalle')) $('ppDetalle').value = '';
    renderLog();
  };

  var sh = $('ppShare');
  if (sh) sh.onclick = async function () {
    var d = store().logs || [];
    if (!d.length) return alert('Sin registros aún');
    var t = '🏓 Mi ping pong\n' + d.slice().sort(function (a, b) { return (a.fecha || '').localeCompare(b.fecha || ''); }).map(function (r) {
      return '• ' + r.fecha + ' · ' + r.tipo + ' en ' + r.lugar + (r.res ? ' · ' + r.res : '') + ((+r.sf || +r.sc) ? ' · ' + (+r.sf || 0) + '-' + (+r.sc || 0) : '') + (r.min ? ' · ' + r.min + ' min' : '') + (r.esfuerzo ? ' · ' + r.esfuerzo : '') + (r.detalle ? ' — ' + r.detalle : '');
    }).join('\n');
    await share('Ping Pong', t);
  };
  var cl = $('ppClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu bitácora de ping pong?')) return;
    try { var u = userData(); if (u && u.pingpong) u.pingpong.logs = []; } catch (e12) {}
    save(); renderLog();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
