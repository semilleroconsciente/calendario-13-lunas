/* ============================================================
   NATACION — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección dentro de Cuerpo & Salud > Cuidado:
   - Botón btnNatacion (inyectado en grupo cuerpo, sub cuidado,
     junto a 💪 Entrenamientos)
   - Diálogo natacionDialog con 6 pestañas:
     1) 🏊 Aprende desde cero (8 pasos progresivos)
     2) 🏊‍♀️ Estilos (crol, espalda, pecho, mariposa)
     3) 🌊 Mar Penco (playas, corrientes, mareas, luna, frío)
     4) 🏋️ Planes (por nivel: 0 a 1000 m + series)
     5) 🛟 Seguridad (reglas de oro, niños, rescate, hipotermia)
     6) 📓 Mi bitácora (registro privado de sesiones)
   - Todo local y privado por usuario: userData().natacion
     { logs:[] }
   - 100% offline. Enfoque: aprender seguro, progresivo y con
     respeto al mar de Penco. No reemplaza clases con profesor
     ni a los Primeros Auxilios de la app.
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
    if (!u.natacion) u.natacion = { logs: [] };
    var m = u.natacion;
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

/* ---------------- DATOS ---------------- */
var PASOS = [
  { n: 'Paso 1 · Amistarse con el agua (1–2 sesiones)', ico: '💧', para: 'Quien tiene miedo o cero experiencia. Piscina baja o orilla calma.', mat: 'Piscina donde hagas pie o playa sin olas, con compañía.', como: 'Entra hasta la cintura. Moja cara, sopla burbujas por boca y nariz (5 veces). Camina, salta suave, abre los ojos bajo el agua. Sal cuando quieras: el objetivo es salir sonriendo, no “aguantar”.', nota: 'El miedo se quita con repetición tranquila, no con sustos. Nunca te empujen al agua.', cuidado: 'Solo con otra persona atenta fuera o dentro del agua. Nada de inflables como seguridad.' },
  { n: 'Paso 2 · Respirar (la base de todo)', ico: '🌬️', para: 'Antes de flotar: si controlas el aire, controlas el cuerpo.', mat: 'Borde de piscina.', como: 'Toma aire por la BOCA (grande), mete la cara y bota por NARIZ y boca haciendo burbujas (largo). Repite 10 veces. Luego: bota todo el aire → el cuerpo se hunde un poco → toma aire → subes. Ese es el flotar.', nota: 'Error típico: aguantar el aire con el pecho lleno y la cabeza arriba. En el agua se respira rítmico: inhala boca / exhala nariz.', cuidado: 'Nada de competencias de aguantar la respiración bajo el agua: riesgo de desmayo (blackout).' },
  { n: 'Paso 3 · Flotar de espalda (tu chaleco natural)', ico: '⭐', para: 'La habilidad que salva vidas: descansar flotando.', mat: 'Piscina donde hagas pie.', como: 'Apoya la nuca, abre brazos en cruz, saca la guata y deja que el agua te sostenga. Mira al cielo, respira lento. Practica: flota 10 seg → 20 → 60. Después prueba flotar boca abajo (estrella) y voltearte a espalda.', nota: 'Con pulmones llenos flotas; vacíos te hundes. Por eso el paso 2 va primero.', cuidado: 'Si te entra agua a la nariz, sopla suave por ella al salir. No te sientes de golpe: gira a posición vertical.' },
  { n: 'Paso 4 · Patada (motor parejo)', ico: '🦵', para: 'Avanzar sin cansarte.', mat: 'Tabla o borde.', como: 'Agárrate del borde, cuerpo estirado, patada corta y rápida desde la cadera (no solo rodillas), pies sueltos como aletas. Espuma blanca pequeña, no chapoteo gigante. 4×25 m con tabla descansando.', nota: 'Patada de crol sirve para crol y espalda. Rodilla doblada como bicicleta = frena.', cuidado: 'Calambre: estira el pie hacia ti y flota de espalda. Avísale a tu compañero.' },
  { n: 'Paso 5 · Deslizamiento + respiración lateral', ico: '🚀', para: 'Unir flotación + patada + aire.', mat: 'Piscina.', como: 'Impúlsate de la pared (flecha: brazos estirados, manos juntas), patalea 5 m sin respirar. Luego agrega: cada 3 patadas gira la cabeza al lado (no la levantes) a tomar aire. Practica 6×25 m suaves.', nota: 'Levantar la cabeza hunde las piernas. El giro es como mirar tu hombro.', cuidado: 'Si te agitas, vuelve al paso 3: flota de espalda y recupera.' },
  { n: 'Paso 6 · Brazada de crol (lenta y larga)', ico: '🏊', para: 'Tu primer estilo completo.', mat: 'Piscina 25 m.', como: 'Brazada alternada: entra la mano suave, tira el agua hacia atrás hasta el muslo, saca el codo alto. Respira cada 2–3 brazadas. Nada 25 m lento → descansa 30 seg → repite 6–8 veces. Menos brazadas por largo = mejor técnica.', nota: 'Cuenta tus brazadas por 25 m (meta inicial: menos de 25). Si suben, estás apurado: baja el ritmo.', cuidado: 'Hombro con dolor agudo = para hoy. Calienta hombros 3 min antes (círculos, cruces).' },
  { n: 'Paso 7 · Coordinación y fondo (100–200 m)', ico: '🔗', para: 'Nadar de corrido, sin parar al borde.', mat: 'Piscina.', como: 'Semana tipo: 4×50 m crol suave + 4×25 m solo patada + 4×25 m espalda. Descansa lo que necesites. Cuando nades 200 m seguidos respirando tranquilo, estás listo para el mar con guía.', nota: 'Ritmo que permite hablar = ritmo aeróbico. Si no puedes decir una frase, vas muy rápido.', cuidado: 'Nada siempre con guardavidas o compañía. Avisa tu plan (cuánto, dónde).' },
  { n: 'Paso 8 · Autonomía (salir solo de un apuro)', ico: '🛟', para: 'Meta mínima de seguridad antes del mar.', mat: 'Piscina honda con supervisión.', como: 'Prueba final: tírate donde NO haces pie → flota 1 min → nada 25 m → flota 1 min → sal por la escalera sin ayuda. Si lo logras 2 veces seguidas, tienes autonomía básica.', nota: 'En el mar todo cuesta el doble (olas, frío, corriente). Autonomía en piscina = permiso para empezar en mar calmo.', cuidado: 'Esta prueba se hace con alguien mirando. Nunca solo.' }
];

var ESTILOS = [
  { n: 'Crol (libre) · tu caballito de batalla', ico: '🏊', para: 'Velocidad y fondo. El que más usarás en Penco.', mat: 'Gorra + antiparras ajustadas.', como: 'Cuerpo horizontal, cabeza quieta mirando al fondo. Brazada: entrada–agarre–tirón–recobro con codo alto. Patada continua corta. Respira cada 3 brazadas (bilateral) para ir derecho. Ritmo largo, no apurado.', nota: 'DRILL: punto muerto (un brazo adelante mientras el otro tira) 6×25 m. Corrige cruzar la mano al centro.', cuidado: 'Codo caído en el recobro = hombro sufre. Si duele, revisa técnica antes de sumar metros.' },
  { n: 'Espalda · respira siempre', ico: '🔄', para: 'Descansar nadando, orientarse, flotar en movimiento.', mat: 'Antiparras bien ajustadas.', como: 'Espalda plana, cadera alta, mirada al cielo (no a los pies). Brazada alternada entrando con meñique. Patada constante. En mar: sirve para descansar mirando la costa y volver con calma.', nota: 'DRILL: 6×25 m un brazo + otro pegado al cuerpo, alternando cada largo.', cuidado: 'En piscina cuenta las banderines (5 m) para no golpearte. En mar revisa que no te aleje la corriente.' },
  { n: 'Pecho (ranita) · el de la orilla', ico: '🐸', para: 'Mirar al frente, conversar, nadar con ropa o en agua fría con la cabeza fuera.', mat: 'Ninguno especial.', como: 'Brazada corta en corazón + patada de rana simultánea + respiración frontal cada ciclo. Desliza 2 seg entre ciclos: el desliz es lo que avanza. Ideal para reconocer una playa nueva.', nota: 'DRILL: patada con tabla 4×25 m (rodillas no más anchas que caderas) + brazada con pull-buoy.', cuidado: 'Rodilla con dolor interno = patada muy abierta o brusca. Acorta y suaviza.' },
  { n: 'Mariposa · solo cuando dominas los otros', ico: '🦋', para: 'Potencia y coordinación. Último en aprender.', mat: 'Base de 400 m crol cómodo.', como: 'Ondulación desde el pecho + doble brazada simultánea + patada delfín (2 por ciclo). Respira al frente cada 2 ciclos. Empieza con 4×15 m delfín con aletas, luego 4×25 m técnica.', nota: 'Si no sale, vuelve a delfín + crol. Mariposa apurada es la N°1 en lesiones de hombro/lumbar.', cuidado: 'Lumbar con dolor = ondulas solo con la espalda. Para y pide revisión técnica.' }
];

var MAR = [
  { n: 'Playas de Penco: dónde partir', ico: '🗺️', txt: 'Penco centro y Lirquén tienen orilla de pendiente suave, buena para aprender en días calmos y con compañía. Playa Negra y La Cata son más expuestas (rocas, oleaje cruzado): solo para nadadores con autonomía y de día, nunca solo. Cosmito es interior (ríos/esteros): evita pozones desconocidos tras lluvias. Regla: primera vez en una playa = entrar hasta la cintura, mirar 10 min (olas, corrientes, viento) y preguntar a pescadores/surfistas locales.' },
  { n: 'Corrientes de retorno (la trampa N°1)', ico: '🌀', txt: 'Se ven como un “río” que sale hacia afuera, agua más oscura y sin espuma entre dos zonas de olas. Si te toma: NO nades contra ella (pierdes). Nada en DIAGONAL/paralelo a la orilla hasta salir, o flota de espalda y pide ayuda (brazo arriba). Practica esto en tu cabeza antes de entrar: el pánico ahoga más que la corriente.' },
  { n: 'Mareas, luna y viento sur', ico: '🌙', para: 'Ver 🌊 Mareas de la app antes de salir.', mat: '', como: 'Luna nueva/llena → mareas vivas: más corriente y bajamares muy bajas (rocas al descubierto). Cuartos → mar más predecible, mejor para aprender. Viento sur fuerte (típico de tarde en el Golfo de Arauco) = oleaje picado y frío: entra en la mañana. 2 h antes/después de pleamar suele ser la ventana más calma.', nota: 'Si la app de Mareas marca altura subiendo rápido + viento sur: hoy se mira, no se nada.', cuidado: 'Noche, neblina o lluvia fuerte = no entrar. El mar no perdona la visibilidad cero.' },
  { n: 'Frío del Pacífico (hipotermia)', ico: '🥶', txt: 'En Penco el agua está entre 11–17 °C casi todo el año: sin traje, 15–30 min bastan para temblar y perder fuerza. Entra de a poco, usa traje corto (shorty) si puedes, gorra de silicona y tapones si te entra agua al oído. Sal cuando tirites, tengas labios morados o dedos torpes —no cuando “ya termines la serie”. Abrígate de inmediato: toalla, ropa seca, algo tibio. Alcohol para “calentarse” = mito peligroso.' },
  { n: 'Equipo mínimo penqueño', ico: '🎒', txt: 'Traje baño cómodo + gorra + antiparras con buen sellado + toalla grande + botella de agua + chalas con agarre (rocas y erizos) + boya de natación (tubo/boya naranja $15–25 mil: te hace visible y sirve de flotador) + silbato. En mar: nunca con audífonos, siempre con boya y compañero. Celular queda en bolsa seca en la orilla, no contigo.' },
  { n: 'Luna y ritmo de entrenamiento', ico: '🌗', txt: 'Menguante: técnica suave y base (drills, 400–800 m tranquilos). Creciente: suma metros y series. Llena: prueba (¿cuánto nado seguido?). Nueva: descanso, movilidad y respiración en casa. Invierno (Pukem): piscina y técnica; el mar solo con traje completo y en grupo. Verano (Walüng): ventana de mar calmo en mañanas, siempre con bandera verde y guardavidas.' }
];

var PLANES = [
  { n: 'Nivel 0 · No sé nadar (lunas 1–2)', ico: '🌱', para: 'Meta: flotar 1 min + 25 m con ayuda.', mat: 'Piscina baja, 2–3 veces por semana, 30 min.', como: 'Sesión: 5 min burbujas + 5 min flotación espalda con ayuda → 10 min patada con tabla → 5 min desliz flecha → 5 min juego libre. No pases de nivel hasta flotar 30 seg solo. Si puedes, 4–6 clases con profesor aceleran el triple.', nota: 'Todo logro se anota en 📓 Mi bitácora: “floté 20 seg” vale oro.', cuidado: 'Prohibido “aprender” en el mar. Piscina primero, siempre.' },
  { n: 'Nivel 1 · 25–100 m (lunas 2–4)', ico: '🐣', para: 'Meta: 100 m crol con descansos cortos.', mat: '2–3 sesiones de 30–40 min.', como: 'A: 4×25 crol + 30 seg pausa + 4×25 patada. B: 2×50 suave + 4×25 espalda + 100 patada. Suma 50–100 m por semana, no más. Termina siempre con 50 m espalda muy suave.', nota: 'Si un día sale mal, cambia a solo técnica (punto muerto, flecha). Constancia > heroicidad.', cuidado: 'Dolor de hombro 2 sesiones seguidas = 1 semana solo patada + movilidad.' },
  { n: 'Nivel 2 · 200–500 m (lunas 4–8)', ico: '🐬', para: 'Meta: 400 m seguidos + primera salida al mar calmo.', mat: '3 sesiones: 2 piscina + 1 técnica/mar.', como: 'Piscina: 200 suave + 8×50 (ritmo medio, pausa 20 seg) + 200 espalda/patada. Mar (con guía y boya): 10 min orilla + 5×2 min nado / 1 min flota. Total mar inicial: 20 min máximo.', nota: 'Cuenta brazadas cada 50 m: si se disparan al final, partiste muy rápido.', cuidado: 'Mar solo en bandera verde, de día, con compañero y aviso en orilla (hora de salida).' },
  { n: 'Nivel 3 · 1000 m y travesía corta', ico: '🌊', para: 'Meta: 1000 m en piscina + 500 m en mar calmo.', mat: '3–4 sesiones + fuerza en casa.', como: 'Piscina: 300 suave + 10×100 (pausa 15–20 seg) + 200 afloje. Mar: 500 m paralelo a la orilla (nunca hacia adentro) con boya y kayak/SUP de apoyo si es posible. En casa: 2×/semana planchas + sentadillas + bandas para hombro.', nota: 'Hidrátate aunque estés en el agua: 500 ml por hora. Come liviano 1–2 h antes.', cuidado: 'Oído con dolor tras nadar + fiebre = posible otitis: médico, no gotas caseras.' },
  { n: 'Series tipo (copia y pega)', ico: '📋', txt: 'SUAVE (recuperar): 8×50 muy cómodos, pausa 15 seg. MEDIO (base): 6×100 ritmo que permite hablar, pausa 20 seg. FUERTE (1 vez/semana, nivel 2+): 10×50 rápido pero controlado, pausa 30 seg. TÉCNICA: 4×(25 punto muerto + 25 nado normal). AFLOJE: siempre 100–200 m espalda/patada al final. Regla: lo fuerte nunca supera el 20% del total semanal.' },
  { n: 'Respiración y movilidad en casa (sin agua)', ico: '🏠', txt: '5 min diarios: 10 respiraciones boca-nariz rítmicas + 20 círculos de hombro + 10 ángeles de pared + 1 min plancha + 10 sentadillas. En luna nueva o días de lluvia, esto mantiene el avance sin piscina. Combina con 🌬️ Respiración y 💪 Entrenamientos de la app.' }
];

var SEGURIDAD = [
  { n: 'Las 5 reglas de oro', ico: '⭐', txt: '1) Nunca solo: ni piscina ni mar. 2) Si no haces pie y no flotas 1 min, no entras donde no haces pie. 3) Inflables, colchonetas y flotadores de brazo NO son seguridad (se dan vuelta y se pinchan). 4) Niños siempre al alcance de la mano, aunque “sepan nadar”. 5) Si dudas, no entres: el mar estará mañana.' },
  { n: 'Niños en Penco (0–12)', ico: '🧒', txt: 'Bebés: solo juegos de adaptación en brazos, agua tibia, 10–15 min. 3–6 años: clases con profesor + flotación asistida; en casa tapa baldes y piscinas armables (5 cm bastan para un accidente). 6–12: meta autonomía (paso 8) antes de playa honda. En la playa: pulsera con teléfono, punto de encuentro visible, y un adulto que MIRA (sin celular) por turnos.' },
  { n: 'Si ves a alguien en apuro (rescate seguro)', ico: '🛟', txt: '1) Grita y pide ayuda (Armada 137, Bomberos 132, SAMU 131). 2) Lanza algo que flote (boya, cooler, cuerda) antes de entrar tú. 3) Entra solo si nadas bien Y hay quien te cuide desde orilla. 4) Acércalo por detrás con algo entre medio, no te abraces (te hunde). 5) En orilla: ¿respira? → abriga y vigila. ¿No respira? → RCP + 131 de inmediato. Detalle de RCP en 🩹 Primeros Auxilios de la app.' },
  { n: 'Cuándo NO entrar (lista roja)', ico: '🚫', txt: 'Bandera roja · de noche o con neblina · tras comer en exceso o con alcohol · con tormenta eléctrica cerca · solo · con herida abierta en mar con marea roja · si el guardavidas dice que no · si ves corriente de retorno fuerte y no tienes nivel 2+ · si tiritas antes de entrar (ya estás frío).' },
  { n: 'Calambres, otitis y ojos rojos', ico: '🩹', txt: 'Calambre en gemelo: estira el pie hacia la espinilla, flota de espalda, masajea. Pantorrilla acalambrada = te faltó agua y calentamiento. Oídos: inclina la cabeza y salta suave; no uses cotonitos a fondo. Ojos rojos tras piscina: enjuaga con agua limpia; si arde + visión borrosa más de 2 h, consulta. Piel con picazón tras mar: ducha apenas salgas.' },
  { n: 'Después de un susto en el agua', ico: '💚', txt: 'Es normal temblar, llorar o no querer volver. Abrígate, cuenta lo que pasó, anótalo en la bitácora y vuelve al paso que dominas (flotar, orilla) en la próxima sesión, no al lugar del susto. Si hubo inmersión con tos persistente, vómitos o somnolencia, anda al CESFAM/Hospital aunque “ya respire bien” (edema tardío). Pedir ayuda es de valientes: habla con tu red (🤝 Comunidad en la app).' }
];

/* ---------------- DIALOGO ---------------- */
function rowCard(c) {
  if (c.txt) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4>' +
      '<p style="line-height:1.5">' + esc(c.txt) + '</p></div>';
  }
  return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4>' +
    (c.para ? '<p><b>Para:</b> ' + esc(c.para) + '</p>' : '') +
    (c.mat ? '<p><b>Necesitas:</b> ' + esc(c.mat) + '</p>' : '') +
    '<p><b>Cómo:</b> ' + esc(c.como) + '</p>' +
    (c.nota ? '<p class="muted">' + esc(c.nota) + '</p>' : '') +
    (c.cuidado ? '<p style="font-size:11px;color:#e8c56a">⚠️ ' + esc(c.cuidado) + '</p>' : '') + '</div>';
}
function switchTab(name) {
  ['Aprende', 'Estilos', 'Mar', 'Planes', 'Seguridad', 'Bitacora'].forEach(function (t) {
    var p = $('nat' + t), b = $('tabNat' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

function buildDialog() {
  var aprendeHTML = PASOS.map(rowCard).join('');
  var estilosHTML = ESTILOS.map(rowCard).join('');
  var marHTML = MAR.map(rowCard).join('');
  var planesHTML = PLANES.map(rowCard).join('');
  var segHTML = SEGURIDAD.map(rowCard).join('');

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabNatAprende" class="btn btn-accent" style="width:auto">🏊 Aprende</button>' +
    '<button type="button" id="tabNatEstilos" class="btn" style="width:auto">🏊‍♀️ Estilos</button>' +
    '<button type="button" id="tabNatMar" class="btn" style="width:auto">🌊 Mar Penco</button>' +
    '<button type="button" id="tabNatPlanes" class="btn" style="width:auto">🏋️ Planes</button>' +
    '<button type="button" id="tabNatSeguridad" class="btn" style="width:auto">🛟 Seguridad</button>' +
    '<button type="button" id="tabNatBitacora" class="btn" style="width:auto">📓 Mi bitácora</button></div>' +
    '<div id="natAprende">' + aprendeHTML +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🏊 Regla de oro</h4><p class="muted" style="font-size:12px">Piscina primero, mar después. Flotar 1 min + 25 m sin ayuda = tu licencia para empezar en mar calmo, con boya y compañía. Lo apurado se ahoga; lo progresivo nada años.</p></div></div>' +
    '<div id="natEstilos" class="hidden"><div class="conv-row"><label style="flex:1">🔍 Filtrar <input type="text" id="natEstilosQ" placeholder="crol, espalda, pecho, mariposa..."></label></div><div id="natEstilosList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + estilosHTML + '</div></div>' +
    '<div id="natMar" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌊 Hoy en Penco</h4><p class="muted" style="font-size:12px">Antes de salir revisa <b>🌊 Mareas</b> y <b>🌤️ Clima</b> en la app: pleamar ±2 h + mañana sin sur fuerte = ventana ideal. Luna nueva/llena = más corriente: mejor mirar que nadar si eres nivel 0–1.</p></div>' +
    '<div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">' + marHTML + '</div></div>' +
    '<div id="natPlanes" class="hidden"><div class="conv-row"><label style="flex:1">🔍 Filtrar <input type="text" id="natPlanesQ" placeholder="nivel, series, respiración..."></label></div><div id="natPlanesList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + planesHTML + '</div></div>' +
    '<div id="natSeguridad" class="hidden"><div style="display:flex;flex-direction:column;gap:8px">' + segHTML + '</div>' +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🚨 Emergencias</h4><p class="muted" style="font-size:12px">Armada 137 · Bomberos 132 · SAMU 131 · Portería CESFAM Penco. RCP paso a paso en 🩹 Primeros Auxilios de la app. Ante la duda, llama: prefieren un aviso de más que un rescate tarde.</p></div></div>' +
    '<div id="natBitacora" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Anotar sesión</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="natFecha"></label><label>Lugar <select id="natLugar"><option>Piscina</option><option>Playa Penco centro</option><option>Lirquén</option><option>Playa Negra</option><option>La Cata</option><option>Otro mar/río</option><option>Casa (movilidad/respiración)</option></select></label></div>' +
    '<div class="conv-row"><label>Estilo <select id="natEstilo"><option>Aprendiendo (flotar/patada)</option><option>Crol</option><option>Espalda</option><option>Pecho</option><option>Mariposa</option><option>Combinado</option></select></label><label>Nivel esfuerzo <select id="natEsfuerzo"><option>Suave</option><option>Medio</option><option>Fuerte</option></select></label></div>' +
    '<div class="conv-row"><label>Distancia (m) <input type="number" id="natDist" min="0" step="25" placeholder="ej: 400"></label><label>Tiempo (min) <input type="number" id="natTiempo" min="0" step="5" placeholder="ej: 30"></label></div>' +
    '<label>Notas <input type="text" id="natDetalle" placeholder="cómo me sentí, qué practiqué, mar calmo/picado..." maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="natAdd" class="btn btn-accent" style="width:auto">+ Guardar sesión</button></div></div>' +
    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">🔍 Buscar <input type="text" id="natLogQ" placeholder="crol, lirquén, mar..."></label><label>Filtrar <select id="natLogF"><option value="">Todo</option><option>Piscina</option><option>Playa Penco centro</option><option>Lirquén</option><option>Playa Negra</option><option>La Cata</option><option>Otro mar/río</option><option>Casa (movilidad/respiración)</option></select></label></div>' +
    '<div id="natResumen" class="menstrual-card" style="margin-top:8px"></div>' +
    '<div id="natLog" class="habits-list" style="margin-top:8px;max-height:280px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="natStats" class="muted" style="font-size:11px"></span><span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="natShare" class="btn" style="width:auto">📤 Compartir</button><button type="button" id="natClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>';

  makeDialog('natacionDialog', '🏊 Natación — Aprende · Estilos · Mar Penco · Planes',
    'De cero a 1000 m, con seguridad penqueña: flotar, respirar, 4 estilos, corrientes, frío y tu bitácora. Vive en <b>💚 Cuerpo & Salud > 🛟 Cuidado</b>, junto a 💪 Entrenamientos. Todo <b>privado y local</b>, 100% offline.',
    body);
}

/* ---------------- BITÁCORA ---------------- */
function fmtRitmo(dist, tiempo) {
  dist = +dist || 0; tiempo = +tiempo || 0;
  if (!dist || !tiempo) return '';
  var r = (tiempo * 100 / dist);
  var m = Math.floor(r), s = Math.round((r - m) * 60);
  return m + ':' + String(s).padStart(2, '0') + ' /100m';
}
function renderLog() {
  var box = $('natLog'); if (!box) return;
  var m = store();
  var data = m.logs || [];
  var q = (($('natLogQ') && $('natLogQ').value) || '').toLowerCase();
  var f = (($('natLogF') && $('natLogF').value) || '');
  var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
  var list = data.filter(function (r) {
    if (f && r.lugar !== f) return false;
    if (q) {
      var t = ((r.estilo || '') + ' ' + (r.lugar || '') + ' ' + (r.detalle || '')).toLowerCase();
      var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
      if (tn.indexOf(qn) < 0) return false;
    }
    return true;
  });
  var res = $('natResumen'), st = $('natStats');
  var totM = data.reduce(function (a, r) { return a + (+r.dist || 0); }, 0);
  var totMin = data.reduce(function (a, r) { return a + (+r.tiempo || 0); }, 0);
  if (res) {
    res.innerHTML = '<h4>📊 Resumen</h4><p class="muted" style="font-size:12px">' + data.length + ' sesión(es) · 🏊 ' + totM.toLocaleString('es-CL') + ' m · ⏱ ' + totMin + ' min' +
      (totM && totMin ? ' · ritmo medio ' + esc(fmtRitmo(totM, totMin)) : '') +
      (data.length ? '<br>Última: ' + esc(data.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); })[0].fecha || '') : '') + '</p>';
  }
  if (!list.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin registros' + (data.length ? ' para este filtro.' : '. Anota tu primera sesión arriba: hasta “floté 20 seg” cuenta.') + '</p>';
    if (st) st.textContent = data.length ? data.length + ' en total' : '';
    return;
  }
  box.innerHTML = list.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 80).map(function (r) {
    var ico = (r.lugar || '').indexOf('Casa') === 0 ? '🏠' : (r.lugar === 'Piscina' ? '🏊' : '🌊');
    var rit = fmtRitmo(r.dist, r.tiempo);
    return '<div class="hora-item"><span style="font-size:12px">' + ico + ' <b>' + esc(r.estilo || 'Sesión') + '</b> · ' + esc(r.lugar || '') +
      '<br><span class="muted" style="font-size:10px">' + esc(r.fecha || '') + (r.dist ? ' · ' + (+r.dist).toLocaleString('es-CL') + ' m' : '') + (r.tiempo ? ' · ' + esc(String(r.tiempo)) + ' min' : '') + (rit ? ' · ' + esc(rit) : '') + (r.esfuerzo ? ' · ' + esc(r.esfuerzo) : '') + (r.detalle ? ' · ' + esc(r.detalle) : '') + '</span></span>' +
      '<button type="button" class="btn btn-icon nat-del" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.nat-del').forEach(function (x) {
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

/* ---------------- SETUP ---------------- */
function setup() {
  /* 1) inyectar botón en Cuerpo & Salud > Cuidado (junto a Entrenamientos) */
  try {
    var existing = $('btnNatacion');
    if (existing) {
      var oldG = existing.closest ? existing.closest('.action-group') : null;
      var inCuerpo = oldG && oldG.getAttribute && oldG.getAttribute('data-group') === 'cuerpo';
      if (!inCuerpo) { try { existing.remove(); } catch (e0) { try { existing.parentNode.removeChild(existing); } catch (e1) {} } existing = null; }
      else { try { existing.setAttribute('data-sub', 'cuidado'); } catch (eS) {} }
    }
    if (!existing) {
      var g = document.querySelector('.action-group[data-group="cuerpo"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnNatacion'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🏊 Natación';
        try { btn.setAttribute('data-sub', 'cuidado'); } catch (eS2) {}
        btn.setAttribute('data-keywords', 'natacion nadar nado piscina pileta pileta mar playa flotar flotacion respiracion crol espalda pecho mariposa corriente retorno ahogamiento seguridad agua traje boya aprender clases calambre hipotermia');
        var refN = g.querySelector('#btnNutri') || g.querySelector('#btnGym');
        if (refN && refN.nextSibling) g.insertBefore(btn, refN.nextSibling);
        else g.appendChild(btn);
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + orden cuerpo|cuidado + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnNatacion') < 0) ALL_BTNS.push('btnNatacion');
  } catch (e2) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnNatacion = ['cuerpo', 'cuidado'];
  } catch (e3) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['cuerpo|cuidado'] && BTN_ORDER['cuerpo|cuidado'].indexOf('btnNatacion') < 0) {
      var _o = BTN_ORDER['cuerpo|cuidado'], _ni = _o.indexOf('btnGym');
      if (_ni < 0) _o.push('btnNatacion'); else _o.splice(_ni + 1, 0, 'btnNatacion');
    }
  } catch (e4) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p]) {
          if (p === 'deportista' || p === 'salud' || p === 'completo') PRESETS[p].btnNatacion = true;
        }
      });
    }
  } catch (e5) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e6) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e7) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e8) {}
  /* 3) checkbox en configDialog (grupo Cuerpo & Salud) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnNatacion"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Cuerpo') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnNatacion"> 🏊 Natación';
          var refC = null;
          gr.querySelectorAll('label').forEach(function (l) {
            var i = l.querySelector('input');
            if (i && i.getAttribute && i.getAttribute('data-btn') === 'btnNutri') refC = l;
          });
          if (refC && refC.nextSibling) gr.insertBefore(lab, refC.nextSibling);
          else gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnNatacion !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnNatacion = lab.querySelector('input').checked;
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

  var b = $('btnNatacion');
  if (b) b.onclick = function () {
    if ($('natFecha') && !$('natFecha').value) $('natFecha').value = todayKey();
    renderLog();
    openDlg('natacionDialog');
  };

  ['Aprende', 'Estilos', 'Mar', 'Planes', 'Seguridad', 'Bitacora'].forEach(function (t) {
    var tb = $('tabNat' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  bindFilter('natEstilosQ', 'natEstilosList');
  bindFilter('natPlanesQ', 'natPlanesList');
  var lq = $('natLogQ'); if (lq) lq.oninput = renderLog;
  var lf = $('natLogF'); if (lf) lf.onchange = renderLog;

  var ad = $('natAdd');
  if (ad) ad.onclick = function () {
    var m = store();
    m.logs.push({
      id: uid('nat'),
      fecha: ($('natFecha') || {}).value || todayKey(),
      lugar: ($('natLugar') || {}).value || 'Piscina',
      estilo: ($('natEstilo') || {}).value || 'Combinado',
      esfuerzo: ($('natEsfuerzo') || {}).value || 'Suave',
      dist: parseFloat(($('natDist') || {}).value) || 0,
      tiempo: parseFloat(($('natTiempo') || {}).value) || 0,
      detalle: clean((($('natDetalle') || {}).value || '').trim(), 120)
    });
    save('Sesión de natación guardada 🏊');
    if ($('natDist')) $('natDist').value = '';
    if ($('natTiempo')) $('natTiempo').value = '';
    if ($('natDetalle')) $('natDetalle').value = '';
    renderLog();
  };

  var sh = $('natShare');
  if (sh) sh.onclick = async function () {
    var d = store().logs || [];
    if (!d.length) return alert('Sin registros aún');
    var t = '🏊 Mis sesiones de natación\n' + d.slice().sort(function (a, b) { return (a.fecha || '').localeCompare(b.fecha || ''); }).map(function (r) {
      return '• ' + r.fecha + ' · ' + r.estilo + ' en ' + r.lugar + (r.dist ? ' · ' + r.dist + ' m' : '') + (r.tiempo ? ' · ' + r.tiempo + ' min' : '') + (r.esfuerzo ? ' · ' + r.esfuerzo : '') + (r.detalle ? ' — ' + r.detalle : '');
    }).join('\n');
    await share('Natación', t);
  };
  var cl = $('natClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu bitácora de natación?')) return;
    try { var u = userData(); if (u && u.natacion) u.natacion.logs = []; } catch (e12) {}
    save(); renderLog();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
