/* ============================================================
   BASQUETBOL — Calendario 13 Lunas (Penco · Bío-Bío)
   Segunda sección de Deportes dentro de Cuerpo & Salud:
   - Reutiliza la sub-sección "Deportes" (data-sub="deportes")
     creada por futbol-modulo.js, en el grupo cuerpo.
   - Botón btnBasquetbol (🏀 Básquetbol) con diálogo
     basquetDialog de 6 pestañas:
     1) 🌱 Aprende desde cero (8 pasos progresivos)
     2) 🏀 Fundamentos (bote, pase, tiro, bandeja, defensa, rebote)
     3) 📋 Reglas y posiciones (5v5, 3x3, faltas, tiempos, roles)
     4) 🏋️ Planes (por nivel + series tipo + ritmo lunar)
     5) 🛟 Seguridad (tobillos, dedos, niños, fair play, canchas Penco)
     6) 📓 Mi bitácora (partidos y entrenos, privada por usuario)
   - Todo local y privado por usuario: userData().basquetbol
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
    if (!u.basquetbol) u.basquetbol = { logs: [] };
    var m = u.basquetbol;
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
  { n: 'Paso 1 · Amistarse con la pelota (1–2 semanas)', ico: '🏀', para: 'Quien parte de cero o vuelve tras años sin jugar.', mat: 'Pelota N°6 (mujer/juvenil) o N°7 (varón 13+), aro a altura normal o más bajo si hay.', como: 'Camina botando suave 5 min con cada mano, lanza al tablero desde 1 m y atrapa, juega a encestar desde abajo del aro. Sin exigencia: el objetivo es terminar con ganas de volver.', nota: 'El primer mes manda la constancia (2 veces por semana), no la intensidad.', cuidado: 'Zapatillas con caña o buen agarre y uñas cortas. Cemento mojado o con arena = se cambia de lado.' },
  { n: 'Paso 2 · Bote bajo y controlado', ico: '🤏', para: 'Que la pelota no se te escape al avanzar.', mat: 'Espacio de 10 m, sin rivales.', como: 'Bote a la altura de la rodilla, con yemas (no palma), cabeza levantada. 3 series de 20 botes por mano + slalom suave entre 4 botellas. Termina botando en 8 (alrededor de las piernas) 5 veces por lado.', nota: 'Si miras solo la pelota, te la quitan. Practica levantar la vista cada 3 botes.', cuidado: 'Muñeca recta al botar fuerte: la palma plana entera tuerce dedos al recibir un mal pique.' },
  { n: 'Paso 3 · Pase de pecho y picado', ico: '🎯', para: 'La base del juego en equipo.', mat: 'Pareja o pared a 3–5 m.', como: 'Pies en posición de tiro, pulgares hacia abajo al soltar, pase firme al pecho del compañero. 3×20 de pecho + 3×10 picados (que pique a 2/3 del camino). Juego: 10 pases seguidos sin que se caiga = punto.', nota: 'Error típico: pase globo alto y lento. Pase bueno = rápido y al pecho.', cuidado: 'Recibe con manos blandas (amortigua hacia el pecho): recibir rígido rompe dedos.' },
  { n: 'Paso 4 · Tiro libre y mecánico base', ico: '🎯', para: 'Meter de cerca antes de tirar de lejos.', mat: 'Aro + tiza o cinta para marcar 5 puntos a 2–3 m.', como: 'Codo bajo el balón, mano de tiro detrás, la otra solo apoya al lado. Flexiona rodillas y suelta arriba. 10 tiros por punto (50 total) a media fuerza. Vale doble la serie con 7+ aciertos.', nota: 'De cerca y con arco alto primero; el triple llega solo después.', cuidado: 'Nunca practiques solo triples al inicio: fatigas el hombro y aprendes mal la mecánica.' },
  { n: 'Paso 5 · Bandeja por ambos lados (doble paso)', ico: '🏃', para: 'El tiro más usado en pichanga.', mat: 'Aro libre 15 min.', como: 'Derecha: paso izquierdo → paso derecho → subo rodilla izquierda y dejo con tablero. Izquierda al revés. 10 por lado caminando, luego 10 trotando. Regla: siempre usar el tablero cuando vienes de lado.', nota: 'Cuenta “1-2-arriba” en voz alta hasta que salga automático.', cuidado: 'No saltes hacia adelante contra el poste: cae vertical y protege tobillos.' },
  { n: 'Paso 6 · Parada en dos tiempos y pivote', ico: '🛑', para: 'Frenar sin caminar (sin pasos).', mat: 'Mitad de cancha.', como: 'Recibe corriendo → cae en 1-2 (un pie y luego el otro) → pivotea con el pie de apoyo sin levantarlo. Practica recibir-pivotar-pasar 20 veces. Juego: el que levanta el pivote pierde la pelota.', nota: 'El pivote es tu “ancla”: si lo dominas, desaparecen la mitad de los pasos.', cuidado: 'Zapatilla que afirme el talón; frenadas en cemento gastado = tobillos en riesgo.' },
  { n: 'Paso 7 · Jugar 3 contra 3 (tu primer partido)', ico: '🤝', para: 'Entender el juego real en espacio chico.', mat: 'Medio campo o multicancha por mitad, 20 min.', como: 'Todos tocan antes de tirar, defensa individual simple (cada uno al suyo). Cambios cada 5 min. Regla de oro: si la pierdes, eres el primero en volver a defender.', nota: 'En 3v3 tocas 10 veces más que en 5v5: ideal para aprender.', cuidado: 'Sin empujones por la espalda ni brazos al cuello: se cobra y se explica, no se pelea.' },
  { n: 'Paso 8 · Autonomía (listo para la pichanga)', ico: '🏀', para: 'Meta mínima antes de jugar 40–60 min.', mat: 'Test en una semana normal.', como: 'Prueba final: trotar 10 min sin parar + 20 pases buenos seguidos + 10 libres con 5+ aciertos + jugar 15 min 3v3 sin fundirte ni enojarte. Si lo logras 2 semanas seguidas, estás listo para el 5v5 del barrio.', nota: 'Autonomía también es saber parar: mareo, dolor o calambre = salgo y aviso.', cuidado: 'Primeros partidos con gente conocida y marcador claro (a 21 o 2×10 min).' }
];

var FUNDAMENTOS = [
  { n: 'Bote · tu avance seguro', ico: '🤏', para: 'Subir la pelota sin perderla bajo presión.', mat: 'Bote de protección (cuerpo entre rival y balón).', como: 'Bote bajo con yemas, cambia de mano con cruce bajo y rápido (no alto ni lento). Revés y por la espalda solo cuando el cruce simple ya sale. Tras botar, levanta la vista y decide: tiro, pase o sigue.', nota: 'DRILL: 4 esquinas 8×8 m botando, cambio de mano en cada cono, 5 min.', cuidado: 'Cruce alto parado = robo seguro. Cruza bajo y saliendo, no quieto.' },
  { n: 'Pase · moverla más rápido que corriendo', ico: '🎯', para: 'Encontrar al libre y no forzar.', mat: 'Pecho, picado, sobre cabeza y béisbol (largo).', como: 'Pecho (0–8 m, rápido), picado (con defensa entre medio), sobre cabeza (para salir del rebote), béisbol (contragolpe largo). Finta un pase y da otro: el buen pasador mira para un lado y pasa al otro.', nota: 'DRILL: parejas 3 m, 2 toques: recibe-pasa sin botar, 3 min seguidos.', cuidado: 'Pase con una mano floja cruzando la cancha = intercepción y contragolpe rival.' },
  { n: 'Tiro · mecánica que se repite', ico: '🏹', para: 'Meter con regularidad, no de suerte.', mat: 'Misma rutina siempre: pies, rodillas, codo, suelta.', como: 'Pies al aro, rodillas flectadas, codo a 90°, suelta arriba con muñeca (dedos al aro). Tiro en suspensión: subo recto y caigo donde salté. Practica 5 puntos × 10 tiros y anota tu % en la bitácora.', nota: 'Rango: primero 3 m, luego 4–5 m, el triple al final. Sin rango no hay triple.', cuidado: 'Tirar siempre desde lejos con mala mecánica carga hombro y espalda baja.' },
  { n: 'Bandeja y tiro corto con tablero', ico: '🏃', para: 'Definir cerca con contacto.', mat: 'Usa el cuadradito del tablero como mira.', como: 'Derecha entra por derecha y deja con derecha usando tablero; izquierda al revés. Con defensa: protege con el cuerpo y define con la mano lejana. Finta de tiro + paso adentro (up-and-under) cuando ya dominas lo básico.', nota: 'DRILL: 10 bandejas por lado + 10 tiros con tablero a 45°. Anota cuántas entran.', cuidado: 'No saltes de lado contra el poste o un rival plantado: falta ofensiva y golpe feo.' },
  { n: 'Defensa · postura y pies', ico: '🛡️', para: 'Molestar sin faltas tontas.', mat: 'Postura baja, manos activas, pies cortos y rápidos.', como: 'Lateraliza (no cruces los pies), lleva al rival a su mano débil, manos a la línea de pase. Bloqueo (box-out): al tiro rival, choca cadera, abre brazos y asegura el rebote. Habla todo el partido: “mía”, “cambio”, “ayuda”.', nota: 'El buen defensa se mide por tiros incómodos provocados, no por robos.', cuidado: 'Manos a la cara o empujón por la espalda = falta rápida. Defiende con pies, no con brazos.' },
  { n: 'Rebote · quererlo más', ico: '📦', para: 'Las segundas opciones ganan pichangas.', mat: 'Posición antes que salto.', como: 'Al tiro: busca a tu par, choca (box-out) y recién salta. Rebote ofensivo: sigue tu propio tiro por el lado contrario. Asegura con dos manos y abre codos sin pegar. Salida: pivotea y pase largo al base, no bote entre 3 rivales.', nota: 'DRILL: 3×10 tiros fallados a propósito + box-out + salida con pase.', cuidado: 'Colgarse del aro o empujar en el aire = falta y riesgo de caída grave.' }
];

var REGLAS = [
  { n: 'Formatos: 5v5, 3v3 y 3x3', ico: '📏', txt: '5v5 (cancha entera, 4×10 min FIBA o 2×20 en barrio, 5 en cancha + cambios ilimitados): el clásico. 3v3 (media cancha, a 21 o 15 min): ideal para aprender y pichangas rápidas. 3x3 oficial (1 aro, 10 min o 21 puntos, posesión de 12 seg): muy físico y veloz. En Penco la mayoría de pichangas son 3v3 o 5v5 en multicancha: pelota N°5 (hasta 12) o N°6/N°7 (13+).' },
  { n: 'Pasos, dobles y tiempo con la pelota', ico: '🚶', txt: 'Pasos (caminar): levantar el pie de pivote antes de soltar el bote o dar 3+ pasos sin botar = pierde la pelota. Dobles: botar, tomar con dos manos y volver a botar = violación. 8 seg para cruzar mitad (5v5), 24 seg de posesión FIBA (12 en 3x3). En pichanga sin árbitro: se cobra hablando (“pasos”, “doble”) y saca el otro equipo desde el lado.' },
  { n: 'Faltas personales y tiros libres', ico: '🟨', txt: 'Falta personal: contacto ilegal (empujón, agarrón, golpe en el brazo al tirar). 5 faltas = fuera (FIBA). Por equipo: a la 5ª falta del cuarto hay 2 libres. Falta al tirar: 2 libres (3 si era triple) o vale + 1 libre si entró. Antideportiva (sin intención de jugar la pelota) y descalificante (agresión): se sancionan duro. En barrio: el que comete la falta la reconoce y se tira los libres acordados (1 o 2).' },
  { n: 'Posiciones y roles (base, escolta, alero, ala-pívot, pívot)', ico: '🧩', txt: 'Base (1): sube la pelota, ordena y asiste. Escolta (2): tira de media/larga y defiende al mejor tirador. Alero (3): corre la cancha, bandeja y rebote largo. Ala-pívot (4): lucha rebotes, tiro corto y cortinas. Pívot (5): juega de espaldas, bloquea y protege el aro. Elige por lo que disfrutas: ¿pensar (base), tirar (escolta), correr (alero) o chocar (4/5)?' },
  { n: 'Laterales, fondo y saltos', ico: '↩️', txt: 'Lateral/fondo: se saca con los pies fuera, 5 seg para pasar (FIBA). El defensor no puede cruzar la línea. Salto inicial (5v5): dos saltan al centro, el resto fuera del círculo. Flecha de alternancia en algunas ligas: tras el salto inicial se alterna la posesión. En multicancha penqueña: el que saca avisa “¿listos?” y el rival da 1 m.' },
  { n: '3x3: reglas que cambian', ico: '🏟️', txt: 'Sin salto inicial (moneda o sorteo), tiro libre 1 punto, tiro de campo 1 punto y triple 2 puntos. Tras canasta rival saca desde atrás del arco (no necesita “sacarla” salvo falta defensiva). Cambios volantes tras canasta o balón muerto. Partido a 21 o 10 min: si empatan, alargue a 2. En Penco: respeta los turnos del barrio, lleva tu pelota inflada y cuida los tableros (no colgarse del aro).' }
];

var PLANES = [
  { n: 'Nivel 0 · Familia y niños (6–12)', ico: '🌱', para: 'Meta: jugar 30 min riendo y sin lesionarse.', mat: '2 veces/semana, 40 min, aro bajo si hay + pelota N°5.', como: 'Calienta jugando (pillar botando 5 min) → 10 min pase-recepción con papá/mamá → 10 min tiros cerca del aro → 10 min 3v3 sin marcador duro. Sin tabla de posiciones: se celebra el pase bueno y el fair play.', nota: '60 min de juego activo al día (OMS): la pichanga cuenta. Agua, bloqueador y sombra entre partidos.', cuidado: 'Aro a altura oficial + pelota pesada en niños = mala mecánica y dedos adoloridos. Adapta.' },
  { n: 'Nivel 1 · Base barrial (13+ o retorno)', ico: '🐣', para: 'Meta: aguantar 30 min y meter 5+ libres de 10.', mat: '2 sesiones/sem + 1 pichanga suave.', como: 'A: 10 min trote + bote + 15 min pase-recepción en parejas + 15 min 3v3. B: 10 min mecánica de tiro cerca + 10 min bandejas por ambos lados + 20 min 3v3. Suma 10 min por semana, no más.', nota: 'Si un día andas fundido, cambia a técnica suave (tiro cerca, sin piques).', cuidado: 'Dolor de rodilla 2 sesiones seguidas = 1 semana sin partidos, solo bici suave + consulta.' },
  { n: 'Nivel 2 · Intermedio (juegas liga o campeonato)', ico: '🐬', para: 'Meta: 40 min a buen ritmo + puesto definido.', mat: '3 sesiones: 2 cancha + 1 fuerza en casa.', como: 'Cancha 1: 3v3 + tiro por puntos (50 tiros, anota %). Cancha 2: 6×largo contragolpe con pausa + 20 bandejas con contacto suave. Casa: sentadillas, planchas, gemelos y dedos/muñeca (2×/semana, 25 min).', nota: 'Mide simple: % libres, % campo, rebotes y asistencias en tu bitácora.', cuidado: 'Tobillo torcido = RICE (hielo, compresión, elevación) y no “aguantar” el partido: un esguince mal curado se repite.' },
  { n: 'Nivel 3 · Avanzado (5v5, 40 min)', ico: '🔥', para: 'Meta: rendir todo el partido + pretemporada de 4–6 lunas.', mat: '3–4 sesiones + partido fin de semana.', como: 'Semana: 1 fuerza (sentadilla, peso muerto liviano, core) + 1 intervalos (8×largo fuerte/vuelta suave) + 1 táctica con tu equipo + partido. Pretemporada: base aeróbica 3 semanas, luego fuerza y velocidad.', nota: 'Duerme 8 h y come 2–3 h antes: fideos/arroz + pollo/huevo + fruta. 500 ml agua por hora de juego.', cuidado: 'Dedo “en martillo” o tobillo que se dobla seguido = kine. Volver antes = 1 mes fuera.' },
  { n: 'Series tipo (copia y pega)', ico: '📋', txt: 'CALENTAR (siempre 10 min): trote + movilidad tobillos/cadera/muñecas + 20 pases progresivos + 10 tiros cerca. TIRO: 5 puntos × 10 (50 tiros, anota %). BANDEJAS: 10 por lado. CONTRA: 6×largo al 80%, pausa 40 seg. VUELTA A LA CALMA: 5 min bote suave + elongar gemelos, cuádriceps y hombros. Regla: lo fuerte nunca supera el 20% de la semana.' },
  { n: 'Ritmo lunar penqueño (entrena con la luna)', ico: '🌗', txt: 'Menguante: técnica suave (bote, pase, tiro cerca). Creciente: suma físico y minutos. Llena: partido o prueba (¿cuánto metes bajo presión?). Nueva: descanso, movilidad y ver tu puesto (videos, reglas). Invierno (Pukem): multicancha techada o gimnasio, cemento mojado = tobillos en riesgo: juega simple. Verano (Walüng): mañanas o tardes, bloqueador, gorra fuera de cancha y 1 L de agua.' }
];

var SEGURIDAD = [
  { n: 'Calentar siempre (10 min que evitan 1 mes fuera)', ico: '🔥', txt: 'Trote 4 min + movilidad (tobillos, cadera, muñecas, hombros) + 20 pases de menos a más + 10 tiros cerca + 3 largos al 60%. En frío (Penco, tardes de sur): agrega 3 min más y parte con buzo. Elongar fuerte ANTES de jugar rinde menos: mejor movilidad dinámica y elongar DESPUÉS.' },
  { n: 'Tobillo y rodilla (las N°1 del básquet)', ico: '🦵', txt: 'Tobillo: zapatilla alta o que afirme, vendaje si ya te lo doblaste, propiocepción (pararse en 1 pie 30 seg con ojos cerrados). Rodilla: evita caer con piernas rectas (cae flexionando), fortalece cuádriceps y glúteos 2×/semana. Chasquido + hinchazón inmediata = salir y consultar (CESFAM/kine), no seguir “a lo macho”.' },
  { n: 'Dedos y manos (el clásico del básquet)', ico: '🤌', txt: 'Uñas cortas siempre, recibe amortiguando hacia el pecho (no rígido), no manotees pases fuertes con una mano. Dedo hinchado y morado tras un pelotazo: hielo 10 min, inmoviliza y evalúa; si se deforma o no flecta → urgencia. Fortalece: apretar pelota de goma 3×15 por mano.' },
  { n: 'Conmoción y golpes en la cabeza', ico: '🪖', txt: 'Choque cabeza-cabeza, codazo o caída con golpe + mareo, confusión, visión borrosa o dolor de cabeza = SALIR y no volver ese día. Lo evalúa otra persona (no el mismo jugador). Reposo 24–48 h sin pantallas ni deporte; si vomita, se desmaya o empeora → urgencia. En niños: ante cualquier duda, se sale.' },
  { n: 'Niños y fair play penqueño', ico: '🧒', txt: 'Niños: equipos mezclados por nivel (no solo por edad ni tamaño), todos juegan parecido tiempo, aros bajos cuando se pueda, sin gritos desde fuera, aplaude el esfuerzo. Fair play: saluda al rival, reconoce la falta, no celebres burlándote, cuida al que queda en el suelo. El que se enoja feo sale 5 min a respirar: el equipo lo apoya, no lo funa.' },
  { n: 'Canchas de Penco: dónde jugar bien', ico: '🗺️', txt: 'Multicanchas barriales (Cerro Verde, Lirquén, centro): respeta turnos, lleva tu pelota inflada, recoge tu basura y cuida tableros y aros (no colgarse). Gimnasio/techada en invierno: zapatilla indoor que no marque. Playa/borde: básquet 3x3 en cemento costero solo con zapatilla firme y 20–30 min (gemelos sufren). Si la cancha está anegada o con hoyos, se cambia el plan: técnica en casa o tiro suave.' }
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
    var p = $('bsk' + t), b = $('tabBsk' + t);
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
    '<button type="button" id="tabBskAprende" class="btn btn-accent su-30e741">🌱 Aprende</button>' +
    '<button type="button" id="tabBskFundamentos" class="btn su-30e741">🏀 Fundamentos</button>' +
    '<button type="button" id="tabBskReglas" class="btn su-30e741">📋 Reglas</button>' +
    '<button type="button" id="tabBskPlanes" class="btn su-30e741">🏋️ Planes</button>' +
    '<button type="button" id="tabBskSeguridad" class="btn su-30e741">🛟 Seguridad</button>' +
    '<button type="button" id="tabBskBitacora" class="btn su-30e741">📓 Mi bitácora</button></div>' +
    '<div id="bskAprende">' + aprendeHTML +
    '<div class="menstrual-card su-51d56a"><h4>🏀 Regla de oro</h4><p class="muted su-6cb285">Primero el bote y el pase, después el partido largo. El que juega simple, defiende y habla en cancha rinde en cualquier equipo penqueño.</p></div></div>' +
    '<div id="bskFundamentos" class="hidden"><div class="conv-row"><label class="su-97445a">🔍 Filtrar <input type="text" id="bskFundQ" placeholder="bote, pase, tiro, defensa, rebote..."></label></div><div id="bskFundList" class="su-bf3828">' + fundHTML + '</div></div>' +
    '<div id="bskReglas" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>📋 Antes del partido</h4><p class="muted su-6cb285">Acuerden formato (5v5 / 3v3 / 3x3), duración o puntaje, cambios y quién media. En pichanga sin árbitro, la palabra vale: se cobra hablando y se sigue jugando.</p></div>' +
    '<div class="su-a22da5">' + reglasHTML + '</div></div>' +
    '<div id="bskPlanes" class="hidden"><div class="conv-row"><label class="su-97445a">🔍 Filtrar <input type="text" id="bskPlanesQ" placeholder="nivel, niños, series, luna..."></label></div><div id="bskPlanesList" class="su-bf3828">' + planesHTML + '</div></div>' +
    '<div id="bskSeguridad" class="hidden"><div class="su-be2653">' + segHTML + '</div>' +
    '<div class="menstrual-card su-51d56a"><h4>🚨 Emergencias</h4><p class="muted su-6cb285">SAMU 131 · Bomberos 132 · CESFAM Penco. Desmayo, golpe en la cabeza con vómitos o tobillo/rodilla que no afirma = se para y se pide ayuda. Detalle en 🩹 Primeros Auxilios de la app.</p></div></div>' +
    '<div id="bskBitacora" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>➕ Anotar partido o entreno</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="bskFecha"></label><label>Tipo <select id="bskTipo"><option>Entreno</option><option>Pichanga 3v3</option><option>Partido 5v5</option><option>3x3</option><option>Técnica en casa</option></select></label></div>' +
    '<div class="conv-row"><label>Lugar <select id="bskLugar"><option>Multicancha barrio</option><option>Gimnasio / techada</option><option>Cancha Lirquén</option><option>Cancha Cerro Verde</option><option>Casa (técnica)</option><option>Otra cancha</option></select></label><label>Posición <select id="bskPos"><option>Base</option><option>Escolta</option><option>Alero</option><option>Ala-pívot</option><option>Pívot</option><option>Todas</option></select></label></div>' +
    '<div class="conv-row"><label>Minutos <input type="number" id="bskMin" min="0" step="5" placeholder="ej: 40"></label><label>Puntos <input type="number" id="bskPts" min="0" step="1" placeholder="0"></label><label>Rebotes <input type="number" id="bskReb" min="0" step="1" placeholder="0"></label><label>Asistencias <input type="number" id="bskAsis" min="0" step="1" placeholder="0"></label></div>' +
    '<div class="conv-row"><label>Esfuerzo <select id="bskEsfuerzo"><option>Suave</option><option>Medio</option><option>Fuerte</option></select></label></div>' +
    '<label>Notas <input type="text" id="bskDetalle" placeholder="cómo jugué, % de tiro, resultado..." maxlength="120"></label>' +
    '<div class="dlg-actions su-8f9e27"><button type="button" id="bskAdd" class="btn btn-accent su-30e741">+ Guardar</button></div></div>' +
    '<div class="conv-row su-8a77e5"><label class="su-4b3de7">🔍 Buscar <input type="text" id="bskLogQ" placeholder="liga, base, lirquén..."></label><label>Filtrar <select id="bskLogF"><option value="">Todo</option><option>Entreno</option><option>Pichanga 3v3</option><option>Partido 5v5</option><option>3x3</option><option>Técnica en casa</option></select></label></div>' +
    '<div id="bskResumen" class="menstrual-card su-8a77e5"></div>' +
    '<div id="bskLog" class="habits-list su-9daa59"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="bskStats" class="muted su-11a508"></span><span class="su-3de8f9"><button type="button" id="bskShare" class="btn su-30e741">📤 Compartir</button><button type="button" id="bskClear" class="btn su-214f75">🗑 Borrar</button></span></div></div>';

  makeDialog('basquetDialog', '🏀 Básquetbol — Aprende · Reglas · Planes · Penco',
    'La segunda sección de <b>⚽ Deportes</b> en <b>💚 Cuerpo & Salud</b>: de cero a tu primera pichanga 3v3 y tu primer 5v5 barrial, con seguridad y fair play. Todo <b>privado y local</b>, 100% offline.',
    body);
}

/* ---------------- BITÁCORA ---------------- */
function renderLog() {
  var box = $('bskLog'); if (!box) return;
  var m = store();
  var data = m.logs || [];
  var q = (($('bskLogQ') && $('bskLogQ').value) || '').toLowerCase();
  var f = (($('bskLogF') && $('bskLogF').value) || '');
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
  var res = $('bskResumen'), st = $('bskStats');
  var totMin = data.reduce(function (a, r) { return a + (+r.min || 0); }, 0);
  var totP = data.reduce(function (a, r) { return a + (+r.pts || 0); }, 0);
  var totR = data.reduce(function (a, r) { return a + (+r.reb || 0); }, 0);
  var totA = data.reduce(function (a, r) { return a + (+r.asis || 0); }, 0);
  var partidos = data.filter(function (r) { return r.tipo !== 'Entreno' && r.tipo !== 'Técnica en casa'; }).length;
  if (res) {
    res.innerHTML = '<h4>📊 Resumen</h4><p class="muted su-6cb285">' + data.length + ' registro(s) · 🏀 ' + partidos + ' partidos · ⏱ ' + totMin + ' min · 🎯 ' + totP + ' pts · 📦 ' + totR + ' reb · 🅰️ ' + totA + ' asis' +
      (data.length ? '<br>Último: ' + esc(data.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); })[0].fecha || '') : '') + '</p>';
  }
  if (!list.length) {
    box.innerHTML = '<p class="muted su-e201a8">Sin registros' + (data.length ? ' para este filtro.' : '. Anota tu primer entreno o pichanga arriba: hasta “50 tiros cerca del aro” cuenta.') + '</p>';
    if (st) st.textContent = data.length ? data.length + ' en total' : '';
    return;
  }
  box.innerHTML = list.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 80).map(function (r) {
    var ico = (r.tipo === 'Entreno' || r.tipo === 'Técnica en casa') ? '🏋️' : '🏀';
    return '<div class="hora-item"><span class="su-6cb285">' + ico + ' <b>' + esc(r.tipo || 'Básquetbol') + '</b> · ' + esc(r.lugar || '') +
      '<br><span class="muted su-0d5be0">' + esc(r.fecha || '') + (r.pos ? ' · ' + esc(r.pos) : '') + (r.min ? ' · ' + esc(String(r.min)) + ' min' : '') + ((+r.pts || +r.reb || +r.asis) ? ' · 🎯' + (+r.pts || 0) + ' / 📦' + (+r.reb || 0) + ' / 🅰️' + (+r.asis || 0) : '') + (r.esfuerzo ? ' · ' + esc(r.esfuerzo) : '') + (r.detalle ? ' · ' + esc(r.detalle) : '') + '</span></span>' +
      '<button type="button" class="btn btn-icon bsk-del" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.bsk-del').forEach(function (x) {
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
  /* 1) botón btnBasquetbol en Cuerpo & Salud > Deportes, junto a Fútbol */
  try {
    var g = document.querySelector('.action-group[data-group="cuerpo"] .group-btns');
    if (g) {
      ensureDeportesSub(g);
      var existing = $('btnBasquetbol');
      if (existing) {
        try { existing.setAttribute('data-sub', 'deportes'); } catch (eS) {}
      } else {
        var btn = document.createElement('button');
        btn.id = 'btnBasquetbol'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🏀 Básquetbol';
        try { btn.setAttribute('data-sub', 'deportes'); } catch (eS2) {}
        btn.setAttribute('data-keywords', 'basquetbol basquet basket baloncesto aro tablero bandeja tiro libre bote pase rebote pichanga 3v3 5v5 multicancha deporte entrenar equipo fair play');
        var ref = $('btnFutbol');
        if (ref && ref.parentNode === g) {
          if (ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
          else g.appendChild(btn);
        } else {
          var lab = g.querySelector('.sub-label[data-sub="deportes"]');
          if (lab) {
            var next = lab.nextElementSibling;
            while (next && next.classList && next.classList.contains('btn') && next.id !== 'btnBasquetbol') next = next.nextElementSibling;
            if (next) g.insertBefore(btn, next);
            else g.appendChild(btn);
          } else g.appendChild(btn);
        }
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnBasquetbol') < 0) ALL_BTNS.push('btnBasquetbol');
  } catch (e2) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnBasquetbol = ['cuerpo', 'deportes'];
  } catch (e3) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      if (!BTN_ORDER['cuerpo|deportes']) BTN_ORDER['cuerpo|deportes'] = ['btnFutbol', 'btnBasquetbol'];
      else if (BTN_ORDER['cuerpo|deportes'].indexOf('btnBasquetbol') < 0) BTN_ORDER['cuerpo|deportes'].push('btnBasquetbol');
    }
  } catch (e4) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p]) {
          if (p === 'deportista' || p === 'salud' || p === 'adolescente' || p === 'estudiante' || p === 'completo' || p === 'todo' || p === 'adulto') PRESETS[p].btnBasquetbol = true;
        }
      });
    }
  } catch (e5) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e6) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e7) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e8) {}
  /* 3) checkbox en configDialog (grupo Cuerpo & Salud) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnBasquetbol"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Cuerpo') >= 0) {
          var lab2 = document.createElement('label');
          lab2.className = 'check-row';
          lab2.innerHTML = '<input type="checkbox" data-btn="btnBasquetbol"> 🏀 Básquetbol';
          gr.appendChild(lab2);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab2.querySelector('input').checked = !vis || vis.btnBasquetbol !== false;
            lab2.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnBasquetbol = lab2.querySelector('input').checked;
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

  var b = $('btnBasquetbol');
  if (b) b.onclick = function () {
    if ($('bskFecha') && !$('bskFecha').value) $('bskFecha').value = todayKey();
    renderLog();
    openDlg('basquetDialog');
  };

  ['Aprende', 'Fundamentos', 'Reglas', 'Planes', 'Seguridad', 'Bitacora'].forEach(function (t) {
    var tb = $('tabBsk' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  bindFilter('bskFundQ', 'bskFundList');
  bindFilter('bskPlanesQ', 'bskPlanesList');
  var lq = $('bskLogQ'); if (lq) lq.oninput = renderLog;
  var lf = $('bskLogF'); if (lf) lf.onchange = renderLog;

  var ad = $('bskAdd');
  if (ad) ad.onclick = function () {
    var m = store();
    m.logs.push({
      id: uid('bsk'),
      fecha: ($('bskFecha') || {}).value || todayKey(),
      tipo: ($('bskTipo') || {}).value || 'Pichanga 3v3',
      lugar: ($('bskLugar') || {}).value || 'Multicancha barrio',
      pos: ($('bskPos') || {}).value || 'Todas',
      min: parseFloat(($('bskMin') || {}).value) || 0,
      pts: parseFloat(($('bskPts') || {}).value) || 0,
      reb: parseFloat(($('bskReb') || {}).value) || 0,
      asis: parseFloat(($('bskAsis') || {}).value) || 0,
      esfuerzo: ($('bskEsfuerzo') || {}).value || 'Medio',
      detalle: clean((($('bskDetalle') || {}).value || '').trim(), 120)
    });
    save('Básquetbol guardado 🏀');
    if ($('bskMin')) $('bskMin').value = '';
    if ($('bskPts')) $('bskPts').value = '';
    if ($('bskReb')) $('bskReb').value = '';
    if ($('bskAsis')) $('bskAsis').value = '';
    if ($('bskDetalle')) $('bskDetalle').value = '';
    renderLog();
  };

  var sh = $('bskShare');
  if (sh) sh.onclick = async function () {
    var d = store().logs || [];
    if (!d.length) return alert('Sin registros aún');
    var t = '🏀 Mi básquetbol\n' + d.slice().sort(function (a, b) { return (a.fecha || '').localeCompare(b.fecha || ''); }).map(function (r) {
      return '• ' + r.fecha + ' · ' + r.tipo + ' en ' + r.lugar + (r.pos ? ' · ' + r.pos : '') + (r.min ? ' · ' + r.min + ' min' : '') + ((+r.pts || +r.reb || +r.asis) ? ' · 🎯' + (+r.pts || 0) + '/📦' + (+r.reb || 0) + '/🅰️' + (+r.asis || 0) : '') + (r.esfuerzo ? ' · ' + r.esfuerzo : '') + (r.detalle ? ' — ' + r.detalle : '');
    }).join('\n');
    await share('Básquetbol', t);
  };
  var cl = $('bskClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu bitácora de básquetbol?')) return;
    try { var u = userData(); if (u && u.basquetbol) u.basquetbol.logs = []; } catch (e12) {}
    save(); renderLog();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
