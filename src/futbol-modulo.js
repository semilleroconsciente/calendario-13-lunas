/* ============================================================
   FUTBOL — Calendario 13 Lunas (Penco · Bío-Bío)
   Primera sección de Deportes dentro de Cuerpo & Salud:
   - Nueva sub-sección "Deportes" (data-sub="deportes") en el
     grupo cuerpo, tras "Cuidado y movimiento".
   - Botón btnFutbol (⚽ Fútbol) con diálogo futbolDialog de
     6 pestañas:
     1) 🌱 Aprende desde cero (8 pasos progresivos)
     2) ⚽ Fundamentos (pase, control, tiro, defensa, arquero)
     3) 📋 Reglas y posiciones (baby, 7 y 11, roles)
     4) 🏋️ Planes (por nivel + series tipo)
     5) 🛟 Seguridad (lesiones, niños, fair play, canchas Penco)
     6) 📓 Mi bitácora (partidos y entrenos, privada por usuario)
   - Todo local y privado por usuario: userData().futbol
     { logs:[] }
   - 100% offline. Enfoque: jugar seguro, progresivo y en
     comunidad. No reemplaza a un profe ni a Primeros Auxilios.
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
    if (!u.futbol) u.futbol = { logs: [] };
    var m = u.futbol;
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
  { n: 'Paso 1 · Moverse y jugar (1–2 semanas)', ico: '🏃', para: 'Quien parte de cero o vuelve tras años sin jugar.', mat: 'Pelota N°4 o 5 desinflada un poco + espacio abierto.', como: 'Camina y trota 10 min, juega a pillar la pelota con las manos, patea suave contra una pared y atrápala. Sin exigencia: el objetivo es reírte y terminar con ganas de volver.', nota: 'El primer mes manda la constancia (2 veces por semana), no la intensidad.', cuidado: 'Zapatillas con agarre y botella de agua. Cancha mojada o con vidrios = se cambia de lado.' },
  { n: 'Paso 2 · Primer toque (control orientado)', ico: '🦶', para: 'Que la pelota no se te escape al recibir.', mat: 'Pared o compañero a 5 m.', como: 'Pase suave → recibe con interior del pie y deja la pelota a 1 paso (no pegada ni a 3 m). 3 series de 10 por pie. Luego recibe de muslo y baja con el pie.', nota: 'Mira antes de recibir (escanea): el control ya decide a dónde vas a jugar.', cuidado: 'Tobillo firme al recibir; si duele al apoyar, para y aplica hielo 10 min.' },
  { n: 'Paso 3 · Pase corto (interior seguro)', ico: '🎯', para: 'La base del juego en equipo.', mat: 'Conos o botellas cada 8–10 m.', como: 'Pie de apoyo al lado de la pelota, interior empuja (no patea con punta). Apunta al pie hábil del compañero. Juego: 10 pases seguidos sin que se escape = punto.', nota: 'Error típico: pegarle fuerte y al bulto. Pase bueno = suave y al pie.', cuidado: 'Uñas cortas y canilleras desde el primer partido, aunque sea amistoso.' },
  { n: 'Paso 4 · Conducción (llevarla pegada)', ico: '🌀', para: 'Avanzar sin perderla.', mat: '6 conos en zigzag.', como: 'Toca cada 2–3 pasos con interior y exterior, cabeza levantada entre toques. 6 vueltas lentas + 6 un poco más rápido sin chocar conos. Termina con tiro suave al arco imaginario.', nota: 'Si miras solo la pelota, te la quitan. Practica levantar la vista cada 3 toques.', cuidado: 'No hagas cambios bruscos en bajada o cemento mojado: tobillo y rodilla sufren.' },
  { n: 'Paso 5 · Tiro (colocado, no fuerte)', ico: '🥅', para: 'Convertir sin lesionarte el empeine.', mat: 'Arco, muro o 2 mochilas como arco.', como: 'Carrera corta (3–4 pasos), pie de apoyo al lado, empeine interior al rincón. 10 tiros por lado a media fuerza. El gol vale doble si va rasante y colocado.', nota: 'Fuerza sin dirección = pelota a la calle. Colocación primero, potencia después.', cuidado: 'Nunca tiro con la punta del pie descalzo ni con pelota mojada pesada en niños.' },
  { n: 'Paso 6 · Cabeceo seguro (solo 12+ con técnica)', ico: '🪖', para: 'Despejar sin daño.', mat: 'Pelota liviana (N°4 o de espuma al inicio).', como: 'Frente amplia, ojos abiertos, cuello firme, golpea con la frente (no la coronilla). Practica 5 cabezazos suaves lanzados desde 2 m. En niños: se enseña el gesto SIN pelotazos repetidos.', nota: 'Dolor de cabeza o mareo tras cabecear = se para de inmediato y se avisa.', cuidado: 'Cabecear centros fuertes repetidos sin técnica es riesgo de conmoción: menos es más.' },
  { n: 'Paso 7 · Jugar 3 contra 3 (tu primer partido)', ico: '🤝', para: 'Entender el juego real en espacio chico.', mat: 'Cancha chica (baby o multicancha por mitad), 20 min.', como: 'Sin arquero fijo, todos tocan antes de tirar. Regla de oro: si la pierdes, eres el primero en recuperarla (5 seg de presión). Cambios cada 5 min para que nadie se funda.', nota: 'En 3v3 tocas 10 veces más que en 11v11: ideal para aprender.', cuidado: 'Sin entradas por detrás ni empujones con el codo: se cobra y se explica, no se pelea.' },
  { n: 'Paso 8 · Autonomía (listo para la pichanga)', ico: '⚽', para: 'Meta mínima antes de jugar 60–90 min.', mat: 'Test en una semana normal.', como: 'Prueba final: trotar 15 min sin parar + 20 pases buenos seguidos + jugar 20 min 5v5 sin fundirte ni enojarte. Si lo logras 2 semanas seguidas, estás listo para la liga del barrio.', nota: 'Autonomía también es saber parar: calambre, mareo o dolor = salgo y aviso.', cuidado: 'Primeros partidos con gente conocida y árbitro o mediador claro.' }
];

var FUNDAMENTOS = [
  { n: 'Pase · el idioma del equipo', ico: '🎯', para: 'Mover la pelota más rápido que corriendo.', mat: 'Canilleras siempre en partido.', como: 'Interior para precisión (5–20 m), empeine para distancia (20–40 m), borde externo para descargar de primera. Pide la pelota hablando (“voy”, “sola”) y ofrece opción tras pasar (no te quedes mirando).', nota: 'DRILL: 4 esquinas 8×8 m, 2 toques máximo, 5 min. Cuenta pases buenos seguidos.', cuidado: 'Pase con la punta (“puntete”) solo en emergencia: sale sin dirección y tuerce dedos.' },
  { n: 'Control · dejarla servida', ico: '🧲', para: 'Recibir y quedar perfilado para jugar.', mat: 'Pecho, muslo e interior según altura.', como: 'Amortigua (retrocede el pie al contacto), orienta con el primer toque hacia donde vas a salir. Pelota alta: pecho y baja al pie, nunca de espaldas al rival sin apoyo.', nota: 'DRILL: compañero lanza 10 pelotas variadas, control + pase en 2 toques.', cuidado: 'No amortigües con el pie levantado y la plancha expuesta: es falta y riesgo.' },
  { n: 'Conducción y gambeta simple', ico: '🌀', para: 'Superar sin hacerte nudo.', mat: 'Espacio por delante, no entre 3 rivales.', como: 'Engancha con interior/exterior (finta de cuerpo + salida al espacio), bicicleta solo si ya dominas el enganche. Regla: 1 gambeta y pase; si no sale, protege y descarga.', nota: 'La gambeta útil es corta y con cambio de ritmo, no 5 adornos parados.', cuidado: 'No gambetees en tu área chica: despeja o juega seguro al lado.' },
  { n: 'Tiro · colocación + repertorio', ico: '🥅', para: 'Finalizar con calma.', mat: 'Define tu perfil (diestro/zurdo) y practica ambos.', como: 'Rasante al palo lejano (interior), potencia al primer palo (empeine), vaselina si el arquero sale. Mira al arquero 1 seg antes de pegarle: te dice dónde tirar.', nota: 'DRILL: 10 balones al borde del área: 5 colocados + 5 de primera. Anota cuántos van al arco.', cuidado: 'Tobillo flojo al pegarle = esguince o “dedo gordo” morado. Aprieta el cordón.' },
  { n: 'Defensa · perfilar y temporizar', ico: '🛡️', para: 'Quitar sin falta ni lesión.', mat: 'Cuerpo entre rival y arco, de lado (no de frente plano).', como: 'Perfílate, lleva al rival a la banda, entra cuando toca mal (no cuando la protege bien). Barrida solo como último recurso y de lado, nunca con plancha.', nota: 'El buen defensa habla todo el partido: “mía”, “cambio”, “espalda”.', cuidado: 'Entrada por detrás o con tacos arriba = roja y posible lesión grave: prohibidas.' },
  { n: 'Arquero/a · el puesto aparte', ico: '🧤', para: 'Atajar y ordenar la defensa.', mat: 'Guantes a tu talla + rodilleras si la cancha es dura.', como: 'Posición base (pies activos, manos arriba), agarre en W para pelotas altas, achique en 1v1 (grande, sin tirarse antes). Saque con la mano al compañero libre, no pelotazo al bulto.', nota: 'DRILL: 3×8 atajadas laterales suaves + 10 saques con la mano a 15 m.', cuidado: 'Salidas con la rodilla arriba o puños a la cara del rival = falta y peligro: cuerpo protegido, codos abajo.' }
];

var REGLAS = [
  { n: 'Formatos: baby (5v5), 7 y 11', ico: '📏', txt: 'Baby/futsal 5v5 (multicancha, 2×20 min, cambios ilimitados): ideal para aprender y jugar entre amigos. Fútbol 7 (cancha chica, 2×25 min): transición con fuera de juego simplificado. Fútbol 11 (cancha grande, 2×45 min): arquero fijo, laterales y extremos con recorrido largo. En Penco la mayoría de pichangas son baby o 7 en multicancha: lleva pelota N°4 (niños/hasta 12) o N°5 (13+).' },
  { n: 'Faltas que todos deben saber', ico: '🟨', txt: 'Falta directa (mano intencional, empujón, patada, zancadilla): tiro libre o penal si es en el área. Falta indirecta (juego peligroso sin contacto, arquero retiene +6 seg): el balón debe tocar a otro antes del gol. Amarilla: protesta, patada táctica, mano que corta avance. Roja: plancha, agresión, insulto grave, última jugada cortada con falta. En pichanga sin árbitro: se cobra hablando y el que comete la falta la reconoce.' },
  { n: 'Fuera de juego explicado simple', ico: '🚩', txt: 'Hay offside si al momento del PASE estás más cerca del arco rival que el penúltimo defensor (casi siempre el último defensa + arquero), en campo rival y participas. NO hay offside en saque de banda, córner ni si estás en tu campo. Truco para no caer: mira la línea del último defensa antes de picar, y pica JUSTO cuando tu compañero va a pasar, no antes.' },
  { n: 'Posiciones y roles (4-4-2 y 4-3-3)', ico: '🧩', txt: 'Arquero: ataja y ordena. Centrales: despejan y marcan al 9. Laterales: suben y bajan por la banda (los que más corren). Volantes de corte: recuperan y juegan simple. Volantes mixtos/interiores: llegan al área y rematan. Extremos: desbordan y centran. Delantero centro (9): aguanta, pivotea y define. Elige por lo que disfrutas: ¿correr (lateral/extremo), pensar (volante), chocar (central/9) o volar (arquero)?' },
  { n: 'Córner, lateral y penal (lo justo)', ico: '↩️', txt: 'Lateral: con los 2 pies en el suelo, balón tras la nuca, suelta por sobre la cabeza (mal sacado = pierde la pelota). Córner: al primer palo (peina) o segundo palo (cabezazo entrando). Penal: carrera corta, mira al arquero, colocado rasante. Barrera en tiro libre: 2–5 según distancia, uno se acuesta solo si está entrenado; el resto salta compacto.' },
  { n: 'Futsal/baby: reglas que cambian', ico: '🏟️', txt: 'Sin offside, lateral con el pie (4 seg para jugar), arquero juega con los pies pero no puede retener eternamente, faltas acumuladas: a la 5ª/6ª hay tiro de 10 m. Cambios volantes sin pedir permiso (por zona). En multicancha penqueña: respeta los turnos del barrio, lleva tu basura y cuida los arcos (no colgarse del travesaño).' }
];

var PLANES = [
  { n: 'Nivel 0 · Familia y niños (6–12)', ico: '🌱', para: 'Meta: jugar 30 min riendo y sin lesionarse.', mat: '2 veces/semana, 40 min, pelota N°4.', como: 'Calienta jugando (pillar 5 min) → 10 min control+pase con papá/mamá → 15 min 3v3 sin arquero fijo → 5 min elongar riendo. Sin tabla de posiciones: se celebra el pase bueno y el fair play.', nota: '60 min de juego activo al día (OMS): la pichanga cuenta. Agua, bloqueador y sombra entre partidos.', cuidado: 'Sin cabeceos repetidos ni pelotazos al cuerpo en niños. Canilleras siempre.' },
  { n: 'Nivel 1 · Base barrial (13+ o retorno)', ico: '🐣', para: 'Meta: aguantar 40 min y tocar 20 pases buenos.', mat: '2 sesiones/sem + 1 pichanga suave.', como: 'A: 10 min trote + 15 min pase-control en parejas + 15 min 4v4. B: 10 min conducción en zigzag + 10 min tiros colocados + 20 min 5v5. Suma 10 min por semana, no más.', nota: 'Si un día andas fundido, cambia a técnica suave (pase corto, sin piques).', cuidado: 'Dolor de rodilla 2 sesiones seguidas = 1 semana sin partidos, solo bici/elíptica suave + consulta.' },
  { n: 'Nivel 2 · Intermedio (juegas liga o campeonato)', ico: '🐬', para: 'Meta: 70 min a buen ritmo + puesto definido.', mat: '3 sesiones: 2 cancha + 1 fuerza en casa.', como: 'Cancha 1: rondos 4v2 + partido 7v7 (60 min). Cancha 2: 6×30 m piques con pausa + 20 centros y remates. Casa: sentadillas, planchas, gemelos y tobillo (2×/semana, 25 min).', nota: 'Mide simple: pases buenos, recuperaciones y goles/asistencias en tu bitácora.', cuidado: 'Tobillo torcido = RICE (hielo, compresión, elevación) y no “aguantar” el partido: un esguince mal curado se repite.' },
  { n: 'Nivel 3 · Avanzado (11v11, 90 min)', ico: '🔥', para: 'Meta: rendir los 90 + pretemporada de 4–6 lunas.', mat: '3–4 sesiones + partido fin de semana.', como: 'Semana: 1 fuerza (sentadilla, peso muerto liviano, core) + 1 intervalos (8×2 min fuerte/1 suave) + 1 táctica con tu equipo + partido. Pretemporada: base aeróbica 3 semanas, luego fuerza y velocidad.', nota: 'Duerme 8 h y come 2–3 h antes: fideos/arroz + pollo/huevo + fruta. 500 ml agua por hora de juego.', cuidado: 'Desgarro (pinchazo isquio/gemelo) = salir altiro, hielo y kine. Volver antes = 1 mes fuera.' },
  { n: 'Series tipo (copia y pega)', ico: '📋', txt: 'CALENTAR (siempre 10 min): trote + movilidad cadera/tobillo + 20 pases progresivos. RONDO 4v2: 5 min × 3, 2 toques. DEFINICIÓN: 10 tiros borde del área (5 colocados + 5 de primera). PIQUES: 6×30 m al 80%, pausa 40 seg. VUELTA A LA CALMA: 5 min trote suave + elongar gemelos, cuádriceps e isquios. Regla: lo fuerte nunca supera el 20% de la semana.' },
  { n: 'Ritmo lunar penqueño (entrena con la luna)', ico: '🌗', txt: 'Menguante: técnica suave (pase, control, rondo corto). Creciente: suma físico y minutos. Llena: partido o prueba (¿cuánto aguantas a buen nivel?). Nueva: descanso, movilidad y ver tu puesto (videos, reglas). Invierno (Pukem): multicancha techada o futsal, barro = tobillos en riesgo: juega simple. Verano (Walüng): mañanas o tardes, bloqueador, gorra fuera de cancha y 1 L de agua.' }
];

var SEGURIDAD = [
  { n: 'Calentar siempre (10 min que evitan 1 mes fuera)', ico: '🔥', txt: 'Trote 4 min + movilidad (cadera, tobillo, rodilla) + 20 pases de menos a más + 3 piques al 60%. En frío (Penco, tardes de sur): agrega 3 min más y parte con buzo. Elongar fuerte ANTES de jugar rinde menos: mejor movilidad dinámica y elongar DESPUÉS.' },
  { n: 'Rodilla y tobillo (las N°1 del fútbol)', ico: '🦵', txt: 'Rodilla: evita giros con el pie clavado (pivotea levantando el talón), cae flexionando, fortalece cuádriceps y glúteos 2×/semana. Tobillo: zapatilla que afirme, vendaje si ya te lo doblaste, propiocepción (pararse en 1 pie 30 seg con ojos cerrados). Chasquido + hinchazón inmediata = salir y consultar (CESFAM/kine), no seguir “a lo macho”.' },
  { n: 'Conmoción y golpes en la cabeza', ico: '🪖', txt: 'Choque cabeza-cabeza, codazo o pelotazo fuerte + mareo, confusión, visión borrosa o dolor de cabeza = SALIR y no volver ese día. Lo evalúa otra persona (no el mismo jugador). Reposo 24–48 h sin pantallas ni deporte; si vomita, se desmaya o empeora → urgencia. En niños: ante cualquier duda, se sale.' },
  { n: 'Calor, frío y cancha dura', ico: '🌡️', txt: 'Calor: agua antes/durante/después, pausas de sombra cada 20 min, gorra fuera de cancha. Frío/lluvia Penco: primera capa, guantes el arquero, pelota seca (la mojada patea como piedra). Cancha dura o de cemento: zapatilla futsal (no toperoles), barridas prohibidas, caídas con brazos plegados.' },
  { n: 'Niños y fair play penqueño', ico: '🧒', txt: 'Niños: equipos mezclados por nivel (no solo por edad), todos juegan parecido tiempo, sin gritos desde fuera, aplaude el esfuerzo. Fair play: saluda al rival, reconoce la falta, no celebres burlándote, cuida al que queda en el suelo. El que se enoja feo sale 5 min a respirar: el equipo lo apoya, no lo funa.' },
  { n: 'Canchas de Penco: dónde jugar bien', ico: '🗺️', txt: 'Multicanchas barriales (Cerro Verde, Lirquén, centro): respeta turnos, lleva tu pelota inflada y recoge tu basura. Estadio/cancha grande: solo con reserva y toperoles adecuados; no entrar con vidrio ni mascotas sueltas. Playa/borde: fútbol-playa descalzo solo en arena limpia y 20–30 min (gemelos sufren). Si la cancha está anegada o con hoyos, se cambia el plan: técnica en casa o rondo corto.' }
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
    var p = $('fut' + t), b = $('tabFut' + t);
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
    '<button type="button" id="tabFutAprende" class="btn btn-accent su-30e741">🌱 Aprende</button>' +
    '<button type="button" id="tabFutFundamentos" class="btn su-30e741">⚽ Fundamentos</button>' +
    '<button type="button" id="tabFutReglas" class="btn su-30e741">📋 Reglas</button>' +
    '<button type="button" id="tabFutPlanes" class="btn su-30e741">🏋️ Planes</button>' +
    '<button type="button" id="tabFutSeguridad" class="btn su-30e741">🛟 Seguridad</button>' +
    '<button type="button" id="tabFutBitacora" class="btn su-30e741">📓 Mi bitácora</button></div>' +
    '<div id="futAprende">' + aprendeHTML +
    '<div class="menstrual-card su-51d56a"><h4>⚽ Regla de oro</h4><p class="muted su-6cb285">Primero el pase y el control, después el partido largo. El que juega simple y habla en cancha rinde en cualquier equipo penqueño.</p></div></div>' +
    '<div id="futFundamentos" class="hidden"><div class="conv-row"><label class="su-97445a">🔍 Filtrar <input type="text" id="futFundQ" placeholder="pase, tiro, arquero, defensa..."></label></div><div id="futFundList" class="su-bf3828">' + fundHTML + '</div></div>' +
    '<div id="futReglas" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>📋 Antes del partido</h4><p class="muted su-6cb285">Acuerden formato (baby/7/11), duración, cambios y quién media. En pichanga sin árbitro, la palabra vale: se cobra hablando y se sigue jugando.</p></div>' +
    '<div class="su-a22da5">' + reglasHTML + '</div></div>' +
    '<div id="futPlanes" class="hidden"><div class="conv-row"><label class="su-97445a">🔍 Filtrar <input type="text" id="futPlanesQ" placeholder="nivel, niños, series, luna..."></label></div><div id="futPlanesList" class="su-bf3828">' + planesHTML + '</div></div>' +
    '<div id="futSeguridad" class="hidden"><div class="su-be2653">' + segHTML + '</div>' +
    '<div class="menstrual-card su-51d56a"><h4>🚨 Emergencias</h4><p class="muted su-6cb285">SAMU 131 · Bomberos 132 · CESFAM Penco. Desmayo, golpe en la cabeza con vómitos o rodilla que no afirma = se para y se pide ayuda. Detalle en 🩹 Primeros Auxilios de la app.</p></div></div>' +
    '<div id="futBitacora" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>➕ Anotar partido o entreno</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="futFecha"></label><label>Tipo <select id="futTipo"><option>Entreno</option><option>Pichanga</option><option>Partido liga</option><option>Futsal/baby</option><option>Técnica en casa</option></select></label></div>' +
    '<div class="conv-row"><label>Lugar <select id="futLugar"><option>Multicancha barrio</option><option>Estadio / cancha grande</option><option>Cancha Lirquén</option><option>Playa / arena</option><option>Casa (técnica)</option><option>Otra cancha</option></select></label><label>Posición <select id="futPos"><option>Arquero/a</option><option>Defensa</option><option>Lateral</option><option>Volante</option><option>Extremo</option><option>Delantero/a</option><option>Todas</option></select></label></div>' +
    '<div class="conv-row"><label>Minutos <input type="number" id="futMin" min="0" step="5" placeholder="ej: 60"></label><label>Goles <input type="number" id="futGoles" min="0" step="1" placeholder="0"></label><label>Asistencias <input type="number" id="futAsis" min="0" step="1" placeholder="0"></label></div>' +
    '<div class="conv-row"><label>Esfuerzo <select id="futEsfuerzo"><option>Suave</option><option>Medio</option><option>Fuerte</option></select></label></div>' +
    '<label>Notas <input type="text" id="futDetalle" placeholder="cómo jugué, qué practiqué, resultado..." maxlength="120"></label>' +
    '<div class="dlg-actions su-8f9e27"><button type="button" id="futAdd" class="btn btn-accent su-30e741">+ Guardar</button></div></div>' +
    '<div class="conv-row su-8a77e5"><label class="su-4b3de7">🔍 Buscar <input type="text" id="futLogQ" placeholder="liga, arquero, lirquén..."></label><label>Filtrar <select id="futLogF"><option value="">Todo</option><option>Entreno</option><option>Pichanga</option><option>Partido liga</option><option>Futsal/baby</option><option>Técnica en casa</option></select></label></div>' +
    '<div id="futResumen" class="menstrual-card su-8a77e5"></div>' +
    '<div id="futLog" class="habits-list su-9daa59"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="futStats" class="muted su-11a508"></span><span class="su-3de8f9"><button type="button" id="futShare" class="btn su-30e741">📤 Compartir</button><button type="button" id="futClear" class="btn su-214f75">🗑 Borrar</button></span></div></div>';

  makeDialog('futbolDialog', '⚽ Fútbol — Aprende · Reglas · Planes · Penco',
    'El primer módulo de <b>⚽ Deportes</b> en <b>💚 Cuerpo & Salud</b>: de cero a tu primer campeonato barrial, con seguridad y fair play. Todo <b>privado y local</b>, 100% offline.',
    body);
}

/* ---------------- BITÁCORA ---------------- */
function renderLog() {
  var box = $('futLog'); if (!box) return;
  var m = store();
  var data = m.logs || [];
  var q = (($('futLogQ') && $('futLogQ').value) || '').toLowerCase();
  var f = (($('futLogF') && $('futLogF').value) || '');
  var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
  var list = data.filter(function (r) {
    if (f && r.tipo !== f) return false;
    if (q) {
      var t = ((r.tipo || '') + ' ' + (r.lugar || '') + ' ' + (r.pos || '') + ' ' + (r.detalle || '')).toLowerCase();
      var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
      if (tn.indexOf(qn) < 0) return false;
    }
    return true;
  });
  var res = $('futResumen'), st = $('futStats');
  var totMin = data.reduce(function (a, r) { return a + (+r.min || 0); }, 0);
  var totG = data.reduce(function (a, r) { return a + (+r.goles || 0); }, 0);
  var totA = data.reduce(function (a, r) { return a + (+r.asis || 0); }, 0);
  var partidos = data.filter(function (r) { return r.tipo !== 'Entreno' && r.tipo !== 'Técnica en casa'; }).length;
  if (res) {
    res.innerHTML = '<h4>📊 Resumen</h4><p class="muted su-6cb285">' + data.length + ' registro(s) · ⚽ ' + partidos + ' partidos · ⏱ ' + totMin + ' min · 🥅 ' + totG + ' goles · 🎯 ' + totA + ' asistencias' +
      (data.length ? '<br>Último: ' + esc(data.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); })[0].fecha || '') : '') + '</p>';
  }
  if (!list.length) {
    box.innerHTML = '<p class="muted su-e201a8">Sin registros' + (data.length ? ' para este filtro.' : '. Anota tu primer entreno o pichanga arriba: hasta “20 pases buenos” cuenta.') + '</p>';
    if (st) st.textContent = data.length ? data.length + ' en total' : '';
    return;
  }
  box.innerHTML = list.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 80).map(function (r) {
    var ico = (r.tipo === 'Entreno' || r.tipo === 'Técnica en casa') ? '🏋️' : '⚽';
    return '<div class="hora-item"><span class="su-6cb285">' + ico + ' <b>' + esc(r.tipo || 'Fútbol') + '</b> · ' + esc(r.lugar || '') +
      '<br><span class="muted su-0d5be0">' + esc(r.fecha || '') + (r.pos ? ' · ' + esc(r.pos) : '') + (r.min ? ' · ' + esc(String(r.min)) + ' min' : '') + ((+r.goles || +r.asis) ? ' · ⚽' + (+r.goles || 0) + ' / 🎯' + (+r.asis || 0) : '') + (r.esfuerzo ? ' · ' + esc(r.esfuerzo) : '') + (r.detalle ? ' · ' + esc(r.detalle) : '') + '</span></span>' +
      '<button type="button" class="btn btn-icon fut-del" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.fut-del').forEach(function (x) {
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
  /* 1) crear sub-sección Deportes + botón btnFutbol en Cuerpo & Salud */
  try {
    var g = document.querySelector('.action-group[data-group="cuerpo"] .group-btns');
    if (g) {
      ensureDeportesSub(g);
      var existing = $('btnFutbol');
      if (existing) {
        try { existing.setAttribute('data-sub', 'deportes'); } catch (eS) {}
      } else {
        var btn = document.createElement('button');
        btn.id = 'btnFutbol'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '⚽ Fútbol';
        try { btn.setAttribute('data-sub', 'deportes'); } catch (eS2) {}
        btn.setAttribute('data-keywords', 'futbol fútbol soccer baby futsal pichanga partido liga arco gol arquero defensa pase tiro gambeta multicancha deporte entrenar equipo fair play');
        var lab = g.querySelector('.sub-label[data-sub="deportes"]');
        if (lab) {
          var next = lab.nextElementSibling;
          while (next && next.classList && next.classList.contains('btn') && next.id !== 'btnFutbol') next = next.nextElementSibling;
          if (next) g.insertBefore(btn, next);
          else g.appendChild(btn);
        } else g.appendChild(btn);
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnFutbol') < 0) ALL_BTNS.push('btnFutbol');
  } catch (e2) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnFutbol = ['cuerpo', 'deportes'];
  } catch (e3) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      if (!BTN_ORDER['cuerpo|deportes']) BTN_ORDER['cuerpo|deportes'] = ['btnFutbol'];
      else if (BTN_ORDER['cuerpo|deportes'].indexOf('btnFutbol') < 0) BTN_ORDER['cuerpo|deportes'].push('btnFutbol');
    }
  } catch (e4) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p]) {
          if (p === 'deportista' || p === 'salud' || p === 'adolescente' || p === 'estudiante' || p === 'completo' || p === 'todo' || p === 'adulto') PRESETS[p].btnFutbol = true;
        }
      });
    }
  } catch (e5) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e6) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e7) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e8) {}
  /* 3) checkbox en configDialog (grupo Cuerpo & Salud) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnFutbol"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Cuerpo') >= 0) {
          var lab2 = document.createElement('label');
          lab2.className = 'check-row';
          lab2.innerHTML = '<input type="checkbox" data-btn="btnFutbol"> ⚽ Fútbol';
          gr.appendChild(lab2);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab2.querySelector('input').checked = !vis || vis.btnFutbol !== false;
            lab2.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnFutbol = lab2.querySelector('input').checked;
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

  var b = $('btnFutbol');
  if (b) b.onclick = function () {
    if ($('futFecha') && !$('futFecha').value) $('futFecha').value = todayKey();
    renderLog();
    openDlg('futbolDialog');
  };

  ['Aprende', 'Fundamentos', 'Reglas', 'Planes', 'Seguridad', 'Bitacora'].forEach(function (t) {
    var tb = $('tabFut' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  bindFilter('futFundQ', 'futFundList');
  bindFilter('futPlanesQ', 'futPlanesList');
  var lq = $('futLogQ'); if (lq) lq.oninput = renderLog;
  var lf = $('futLogF'); if (lf) lf.onchange = renderLog;

  var ad = $('futAdd');
  if (ad) ad.onclick = function () {
    var m = store();
    m.logs.push({
      id: uid('fut'),
      fecha: ($('futFecha') || {}).value || todayKey(),
      tipo: ($('futTipo') || {}).value || 'Pichanga',
      lugar: ($('futLugar') || {}).value || 'Multicancha barrio',
      pos: ($('futPos') || {}).value || 'Todas',
      min: parseFloat(($('futMin') || {}).value) || 0,
      goles: parseFloat(($('futGoles') || {}).value) || 0,
      asis: parseFloat(($('futAsis') || {}).value) || 0,
      esfuerzo: ($('futEsfuerzo') || {}).value || 'Medio',
      detalle: clean((($('futDetalle') || {}).value || '').trim(), 120)
    });
    save('Fútbol guardado ⚽');
    if ($('futMin')) $('futMin').value = '';
    if ($('futGoles')) $('futGoles').value = '';
    if ($('futAsis')) $('futAsis').value = '';
    if ($('futDetalle')) $('futDetalle').value = '';
    renderLog();
  };

  var sh = $('futShare');
  if (sh) sh.onclick = async function () {
    var d = store().logs || [];
    if (!d.length) return alert('Sin registros aún');
    var t = '⚽ Mi fútbol\n' + d.slice().sort(function (a, b) { return (a.fecha || '').localeCompare(b.fecha || ''); }).map(function (r) {
      return '• ' + r.fecha + ' · ' + r.tipo + ' en ' + r.lugar + (r.pos ? ' · ' + r.pos : '') + (r.min ? ' · ' + r.min + ' min' : '') + ((+r.goles || +r.asis) ? ' · ⚽' + (+r.goles || 0) + '/🎯' + (+r.asis || 0) : '') + (r.esfuerzo ? ' · ' + r.esfuerzo : '') + (r.detalle ? ' — ' + r.detalle : '');
    }).join('\n');
    await share('Fútbol', t);
  };
  var cl = $('futClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu bitácora de fútbol?')) return;
    try { var u = userData(); if (u && u.futbol) u.futbol.logs = []; } catch (e12) {}
    save(); renderLog();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
