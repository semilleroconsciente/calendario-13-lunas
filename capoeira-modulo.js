/* ============================================================
   CAPOEIRA — Calendario 13 Lunas (Penco · Bío-Bío)
   Tercera sección de Deportes dentro de Cuerpo & Salud:
   - Reutiliza la sub-sección "Deportes" (data-sub="deportes")
     creada por futbol-modulo.js, en el grupo cuerpo.
   - Botón btnCapoeira (🪘 Capoeira) con diálogo
     capoeiraDialog de 6 pestañas:
     1) 🌱 Aprende desde cero (8 pasos progresivos)
     2) 🪘 Fundamentos (ginga, esquivas, golpes, florestas, música)
     3) 📋 Cultura y reglas (historia, estilos, roda, batería, cantos)
     4) 🏋️ Planes (por nivel + series tipo + ritmo lunar)
     5) 🛟 Seguridad (muñecas, rodillas, invertidas, niños, roda segura)
     6) 📓 Mi bitácora (entrenos y rodas, privada por usuario)
   - Todo local y privado por usuario: userData().capoeira
     { logs:[] }
   - 100% offline. Enfoque: arte-lucha afrobrasileña, respeto,
     juego bonito y comunidad. No reemplaza a un mestre ni a
     Primeros Auxilios.
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
    if (!u.capoeira) u.capoeira = { logs: [] };
    var m = u.capoeira;
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
  { n: 'Paso 1 · Ginga y respeto (1–2 semanas)', ico: '🌱', para: 'Quien parte de cero: soltar el cuerpo y entender la roda.', mat: 'Ropa cómoda + piso liso o pasto parejo. Sin zapatillas duras al inicio.', como: 'Ginga lenta 5 min (paso atrás, brazos que protegen la cara), balanceo y palmas al ritmo. Aprende a entrar a la roda: pie al pie del berimbau, saludo y “vai”. Juego: 2 min de ginga sin parar, sonriendo.', nota: 'La capoeira se juega, no se pelea: el primer mes manda el ritmo, no la fuerza.', cuidado: 'Piso mojado o con piedras = no se entrena suelo. Rodilla siempre semiflectada, nunca bloqueada.' },
  { n: 'Paso 2 · Esquivas base (cocorinha + esquiva lateral)', ico: '🛡️', para: 'Que nada te llegue a la cara: salir del eje.', mat: 'Espejo o compañero a 2 m.', como: 'Cocorinha (baja con un brazo a la cara y otro al suelo) 3×10. Esquiva lateral (paso al lado + tronco fuera) 3×8 por lado. Juego: compañero amaga lento, tú esquivas sin manos.', nota: 'Error típico: cerrar los ojos. Mira siempre al otro, incluso agachado.', cuidado: 'Espalda recta al bajar; si duele la lumbar, baja menos y fortalece piernas.' },
  { n: 'Paso 3 · Patadas rectas (banda, martelo, queixada)', ico: '🦵', para: 'Patear con control y volver a la ginga.', mat: 'Espacio de 3×3 m.', como: 'Banda de frente (empuja con la planta) 3×8 por pierna. Martelo (rodilla arriba, cae el empeine) suave 3×6. Queixada con giro corto, sin saltar. Todo al aire, a media fuerza.', nota: 'Patada buena = vuelve a ginga sola. Si quedas cruzado, fue muy fuerte.', cuidado: 'Calienta cadera y tobillos 5 min antes. Dolor inguinal = para y elonga suave.' },
  { n: 'Paso 4 · Aú (la estrella lateral)', ico: '🤸', para: 'La “rueda” que te salva de caídas y abre el juego.', mat: 'Pasto o colchoneta al inicio.', como: 'Aú lento pegado al suelo: manos firmes, mira al frente entre los brazos, cae en ginga. 6 aús lentos + 6 con ritmo. Después prueba aú de frente y aú con una mano solo si el lento sale 10/10.', nota: 'El aú no es adorno: es esquiva + desplazamiento + salida.', cuidado: 'Muñecas: calienta con círculos y planchas cortas. Dolor de muñeca = vendas y sin invertidas 1 semana.' },
  { n: 'Paso 5 · Rolê y negativa (suelo vivo)', ico: '🌀', para: 'Entrar y salir del suelo sin regalar la espalda.', mat: 'Piso limpio.', como: 'Rolê (giro bajo mirando al otro) 5 por lado + negativa (sentadilla lateral baja, un brazo arriba) 30 seg por lado. Secuencia: ginga → rolê → negativa → vuelve a ginga.', nota: 'En capoeira el suelo también mira: nunca des la espalda sin ver.', cuidado: 'Rodillas: si crujen con dolor, acorta el rango y fortalece cuádriceps.' },
  { n: 'Paso 6 · Música base (palmas, coro y pandeiro)', ico: '🪘', para: 'Entrar a la batería: sin música no hay roda.', mat: 'Pandeiro o palmas + un canto corto.', como: 'Aprende el coro “Paranauê” y 2 toques de pandeiro. Practica cantar + llevar el pulso con palmas 5 min. En roda: canta fuerte aunque seas nuevo, el coro sostiene.', nota: 'Quien canta, juega mejor: la música manda la velocidad del juego.', cuidado: 'Cuida la voz: agua y no gritar sobre el atabaque. Oídos: no pegarse al tambor.' },
  { n: 'Paso 7 · Tu primer juego (2 min suave)', ico: '🤝', para: 'Jugar completo sin miedo ni exceso.', mat: 'Roda de amigos o entreno, 2 min por juego.', como: 'Entra, saluda, ginga 30 seg, 2 esquivas + 2 patadas suaves + 1 aú, sale por el mismo lado. Regla de oro: manos que protegen, juego por abajo, sin tocar fuerte.', nota: 'En tu primer juego el objetivo es salir riendo y sin marcas.', cuidado: 'Sin zancadillas fuertes ni cabezazos en juegos iniciales. Se avisa si algo duele.' },
  { n: 'Paso 8 · Autonomía (listo para la roda abierta)', ico: '🪘', para: 'Meta mínima antes de jugar en evento o batizado.', mat: 'Test en una semana normal.', como: 'Prueba: 5 min de ginga sin parar + 10 cocorinhas + 6 aús seguidos + cantar un coro entero + jugar 3 min suave sin fundirte ni enojarte. Si lo logras 2 semanas seguidas, pide tu primera roda abierta.', nota: 'Autonomía también es saber salir: cansancio, mareo o molestia = salgo y aplaudo desde fuera.', cuidado: 'Primeras rodas con gente conocida y mestre o graduado que cuide el juego.' }
];

var FUNDAMENTOS = [
  { n: 'Ginga · el corazón', ico: '💛', para: 'Base de todo: moverte sin regalarte.', mat: 'Pies activos, manos vivas.', como: 'Triángulo: paso atrás + balanceo, una mano protege cara y otra baja. Cadera suelta, rodillas blandas, mirada al otro. Varía: ginga alta (rápida), ginga baja (angola), ginga con quiebre de cintura. DRILL: 3 min ginga + compañero que aplaude y cambias de lado.', nota: 'Ginga tiesa = juego tieso. Suelta hombros y respira con el berimbau.', cuidado: 'No rebotes con talones duros en cemento: tobillos sufren. Usa zapatilla plana o descalzo en piso apto.' },
  { n: 'Esquivas · salir del golpe', ico: '🛡️', para: 'Defender sin bloquear duro.', mat: 'Cocorinha, esquiva lateral, esquiva baja, pendulo.', como: 'Cocorinha para patadas altas, lateral para martelos, pendulo (balanceo de tronco) para juegos rápidos. Siempre una mano a la cara. DRILL: en parejas, uno ataca al 30% y el otro solo esquiva 2 min, luego cambian.', nota: 'La mejor defensa es salir 20 cm del eje, no 1 metro corriendo.', cuidado: 'No agaches la cabeza mirando al suelo: la patada llega igual y no la ves.' },
  { n: 'Patadas · repertorio esencial', ico: '🦵', para: 'Atacar con juego, no con rabia.', mat: 'Banda, martelo, queixada, armada, meia-lua de frente, bênção.', como: 'Banda empuja, martelo cae, queixada cruza con giro, armada gira completa, meia-lua dibuja la luna con el pie, bênção empuja de frente para frenar. Todo vuelve a ginga. DRILL: secuencia 4 patadas al aire × 5 vueltas, cada vez más fluido.', nota: 'Patada capoeira se muestra: avisa el camino para que el otro juegue. Eso es belleza, no descuido.', cuidado: 'Cadera fría + patada alta = tirón. Sube la altura por semanas, no por orgullo.' },
  { n: 'Suelo · rolê, negativa, rolê de cabeza', ico: '🌀', para: 'El juego bajo de Angola: peligroso para el apurado.', mat: 'Piso limpio, pantalón que resbale (abada).', como: 'Rolê bajo mirando, negativa para descansar y armar, passagem de frente para cruzar. Une: patada → rolê → negativa → aú. DRILL: 3 min de “río”: cruza la sala solo con rolê + negativa sin pararte.', nota: 'Quien domina el suelo domina el tiempo: hace esperar al ansioso.', cuidado: 'Cabeza al suelo solo con profe y colchoneta. Cuello y cervicales no se improvisan.' },
  { n: 'Florestas · acrobacias con sentido', ico: '🤸', para: 'Adornar sin perder el juego.', mat: 'Aú, aú sin manos (cuando toque), macaco, mortal solo avanzado.', como: 'Aú lateral, aú de frente, aú con parada, macaco lateral (salto de lado con una mano). Regla: 1 floresta por juego al inicio; si no sale, sigue en ginga. DRILL: línea de 5 aús + 3 macacos suaves + vuelta a ginga.', nota: 'Floresta sin música es gimnasia. Con música y compañero, es capoeira.', cuidado: 'Mortal y saltos mortales solo con mestre, colchoneta y progresión. Caída de cuello = urgencia.' },
  { n: 'Música · berimbau, cantos y batería', ico: '🎶', para: 'Mandar y obedecer el juego con sonido.', mat: 'Berimbau, atabaque, pandeiro, agogô, reco-reco.', como: 'Berimbau manda: Angola lento (juego bajo), São Bento Grande (rápido), Cavalaria (aviso). Atabaque marca el corazón, pandeiro adorna. Cantos: ladainha (reza solo, todos escuchan), chula y corrido (pregunta y coro). DRILL: 10 min semanales solo de ritmo + 1 canto nuevo por luna.', nota: 'Aprende portugués cantando: cada canto es historia de resistencia y libertad.', cuidado: 'Berimbau (verga + alambre): ojos lejos al tensar. Niños solo con instrumento adaptado y supervisión.' }
];

var REGLAS = [
  { n: 'Historia breve: resistencia que se volvió arte', ico: '📜', txt: 'Nació en Brasil con africanos esclavizados que camuflaron lucha en juego, música y fiesta. Criminalizada por años, la salvaron mestres como Vicente Pastinha (Angola) y Manoel dos Reis Machado, Mestre Bimba (Regional, 1930s). Hoy es patrimonio inmaterial de Brasil y de la humanidad (UNESCO 2014). Jugarla en Penco exige respeto: no es “baile exótico”, es memoria de libertad.' },
  { n: 'Estilos: Angola, Regional y Contemporánea', ico: '🎭', txt: 'Angola (Pastinha): juego bajo, lento, malicioso, mucha cintura y ritual. Regional (Bimba): secuencias, cintura alta, blanca de uniforme, juego rápido y objetivo. Contemporánea: mezcla ambas, la más común en Chile. Pregunta en tu grupo qué línea sigue: cambia la música, la ropa y las reglas del juego.' },
  { n: 'La roda: cómo entrar, jugar y salir', ico: '⭕', txt: 'Círculo de gente que canta y aplaude + batería + 2 que juegan al pie del berimbau. Se entra por la izquierda del berimbau (o según tu grupo), con saludo al piso y al otro. Juego de 2–5 min: por abajo, con control, sin cerrar la salida al otro. Se sale cuando el mestre corta o pides “compra” (otro entra entre medio). Quien está fuera sostiene con coro y palmas: sin coro no hay energía.' },
  { n: 'Batería y cantos (lo justo para partir)', ico: '🪘', txt: 'Orden típico: 3 berimbaus (gunga manda, medio y viola adornan) + atabaque + pandeiros. Ladainha abre (solo el más graduado), luego corridos que todos responden. Aprende 3 corridos de memoria: “Paranauê”, “Zum zum zum” y “Ê, capoeira”. Canta aunque afines poco: el coro es participación, no concierto.' },
  { n: 'Cordas y batizado (graduación)', ico: '🎗️', txt: 'La corda (cuerda de color en la cintura) marca camino, no rango de pelea. Cada escuela tiene su tabla (verde-amarilla en Angola, variadas en Regional/Contemporánea). El batizado es la fiesta donde recibes tu primera corda jugando con mestres invitados. No se compra ni se exige: se gana con constancia, respeto y juego limpio. Niños: cordas infantiles por asistencia y conducta, no por “ganar”.' },
  { n: 'Axé y conducta en Penco', ico: '✨', txt: 'Axé = buena energía que se cuida: saluda al llegar, ayuda a armar la batería, no pases por en medio de la roda con zapatillas sucias, no grabes caras de niños sin permiso, lleva tu basura de la multicancha o sede. En playa o plaza: pide permiso, cuida el volumen y deja el lugar mejor que como llegó. Eso también es capoeira.' }
];

var PLANES = [
  { n: 'Nivel 0 · Familia y niños (6–12)', ico: '🌱', para: 'Meta: jugar 15 min riendo, cantar 1 coro y hacer aú seguro.', mat: '2 veces/semana, 40 min, piso blando.', como: 'Calienta jugando (pillar con ginga 5 min) → 10 min esquivas como juego → 10 min aú y rolê en colchoneta → 10 min roda de niños (juegos de 1 min) → coro final. Sin tabla de posiciones: se celebra la esquiva bonita y el canto fuerte.', nota: '60 min de juego activo al día (OMS): la roda cuenta. Agua, bloqueador y sombra entre juegos.', cuidado: 'Sin patadas a la cara ni cargadas en niños. Cabeza al suelo solo como juego guiado, nunca como prueba.' },
  { n: 'Nivel 1 · Base (13+ o retorno)', ico: '🐣', para: 'Meta: 30 min de entreno + 2 juegos de 2 min.', mat: '2 sesiones/sem + 1 roda suave.', como: 'A: 10 min ginga + esquivas + 15 min patadas al aire + 15 min música. B: 10 min suelo (rolê/negativa) + 10 min aú + 20 min juegos suaves. Suma 10 min por semana, no más.', nota: 'Si andas fundido, cambia a música y ginga suave (no a patadas altas).', cuidado: 'Dolor de muñeca 2 sesiones seguidas = 1 semana sin aú ni planchas, solo ginga y música + consulta.' },
  { n: 'Nivel 2 · Intermedio (juegas roda abierta)', ico: '🐬', para: 'Meta: 60 min + repertorio de 6 patadas + 1 canto solo.', mat: '3 sesiones: 2 entreno + 1 roda.', como: 'Entreno 1: secuencias Bimba o Angola + juegos de 3 min. Entreno 2: 6×1 min ginga intensa/pausa + florestas básicas + batería 15 min. Roda: mínimo 3 juegos por semana, uno por abajo (angola). Lleva bitácora de qué te funcionó.', nota: 'Mide simple: juegos jugados, cantos aprendidos, caídas evitadas.', cuidado: 'Rodilla hinchada = hielo, compresión, elevación y sin juegos 1 semana. Esguince mal curado se repite.' },
  { n: 'Nivel 3 · Avanzado (batizado, eventos, ayudar a enseñar)', ico: '🔥', para: 'Meta: sostener roda de 2 h + ayudar a nuevos.', mat: '3–4 sesiones + evento por luna.', como: 'Semana: 1 fuerza (sentadilla, plancha, dominadas adaptadas) + 1 juego largo (5×3 min) + 1 música (berimbau 30 min) + roda. Prepara 1 secuencia para enseñar a Nivel 0. Pretemporada de batizado: 4–6 lunas de base.', nota: 'Avanzado también es cuidar: llegas antes, armas batería, traduces cantos a los nuevos.', cuidado: 'Desgarro (pinchazo isquio/gemelo) = salir altiro, hielo y kine. Volver antes = 1 mes fuera.' },
  { n: 'Series tipo (copia y pega)', ico: '📋', txt: 'CALENTAR (siempre 10 min): ginga progresiva + movilidad cadera/muñeca/tobillo + 20 cocorinhas. SECUENCIA: ginga 1 min + 4 patadas × 4 vueltas + 4 aús + rolê/negativa 2 min. MÚSICA: 5 min palmas + 1 corrido cantado 3 veces. JUEGO: 3×2 min suave con pausa cantada. VUELTA A LA CALMA: 5 min ginga lenta + elongar isquios, cadera y hombros.' },
  { n: 'Ritmo lunar penqueño (entrena con la luna)', ico: '🌗', txt: 'Menguante: técnica suave (ginga baja, esquivas, música). Creciente: suma físico y juegos. Llena: roda o muestra (¿cómo juegas con gente mirando?). Nueva: descanso, traducir 1 canto y ver videos de tu estilo. Invierno (Pukem): sede o gimnasio techado, suelo frío = muñecas y rodillas con calor extra. Verano (Walüng): mañanas o tardes, bloqueador y 1 L de agua; berimbau a la sombra (el calor lo desafina).' }
];

var SEGURIDAD = [
  { n: 'Calentar siempre (10 min que evitan 1 mes fuera)', ico: '🔥', txt: 'Ginga de menos a más 4 min + círculos de muñeca, cadera y tobillo + 20 cocorinhas progresivas + 3 aús lentos. En frío (Penco, tardes de sur): agrega 3 min con buzo y parte por suelo antes que por patadas altas. Elongar fuerte ANTES rinde menos: mejor movilidad dinámica y elongar DESPUÉS.' },
  { n: 'Muñecas y hombros (las N°1 de capoeira)', ico: '🤲', txt: 'Muñeca: calienta, parte con aú pegado al suelo, usa vendas si ya dolieron, fortalece con planchas cortas (3×20 seg). Hombro: no caigas con el brazo estirado tieso; flecta al apoyar. Chasquido + dolor que no pasa en 48 h = consulta (CESFAM/kine), no seguir “a lo macho”.' },
  { n: 'Rodillas, tobillos y cabeza', ico: '🦵', txt: 'Rodilla: baja con rodilla alineada al pie (no hacia adentro), evita giros con el pie clavado. Tobillo: piso parejo, zapatilla plana o descalzo solo en piso apto. Cabeza: golpes con mareo, confusión o dolor = SALIR ese día; lo evalúa otra persona. Si vomita, se desmaya o empeora → urgencia (SAMU 131). En niños: ante cualquier duda, se sale.' },
  { n: 'Roda segura (acuerdos antes de jugar)', ico: '⭕', txt: 'Acuerden velocidad (lento/rápido), contacto (marcado o nada) y quién cuida (mestre/graduado corta el juego). Prohibido en juego formativo: zancadillas por detrás, empujones con codo, cabezazos y patadas a fondo perdido. El que se enoja sale 1 juego a respirar: el grupo lo apoya, no lo funa.' },
  { n: 'Niños y fair play (axé)', ico: '🧒', txt: 'Juegos cortos (1–2 min), parejas por tamaño (no solo por edad), todos cantan y tocan. Nada de burlas por errar un aú: se aplaude el intento. Sin gritos desde fuera. Aplaude el juego bonito del otro grupo también: la capoeira penqueña crece en comunidad.' },
  { n: 'Lugares de Penco: dónde entrenar bien', ico: '🗺️', txt: 'Sede vecinal o gimnasio: ideal (piso parejo, techo en invierno). Multicancha: revisa vidrios y hoyos, lleva equipo de música moderado y respeta turnos. Playa/borde costero: solo suelo sin conchillas y 20–30 min de impacto (gemelos sufren); berimbau y atabaque lejos de la humedad. Si llueve fuerte o hay viento sur, se cambia el plan: música y fundamentos en casa.' }
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
    var p = $('cap' + t), b = $('tabCap' + t);
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
    '<button type="button" id="tabCapAprende" class="btn btn-accent su-30e741">🌱 Aprende</button>' +
    '<button type="button" id="tabCapFundamentos" class="btn su-30e741">🪘 Fundamentos</button>' +
    '<button type="button" id="tabCapReglas" class="btn su-30e741">📋 Cultura</button>' +
    '<button type="button" id="tabCapPlanes" class="btn su-30e741">🏋️ Planes</button>' +
    '<button type="button" id="tabCapSeguridad" class="btn su-30e741">🛟 Seguridad</button>' +
    '<button type="button" id="tabCapBitacora" class="btn su-30e741">📓 Mi bitácora</button></div>' +
    '<div id="capAprende">' + aprendeHTML +
    '<div class="menstrual-card su-51d56a"><h4>🪘 Regla de oro</h4><p class="muted su-6cb285">Primero la ginga, la esquiva y el coro; después la roda larga. Quien escucha el berimbau y cuida al otro juega en cualquier roda penqueña.</p></div></div>' +
    '<div id="capFundamentos" class="hidden"><div class="conv-row"><label class="su-97445a">🔍 Filtrar <input type="text" id="capFundQ" placeholder="ginga, aú, patada, berimbau..."></label></div><div id="capFundList" class="su-bf3828">' + fundHTML + '</div></div>' +
    '<div id="capReglas" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>📋 Antes de tu primera roda</h4><p class="muted su-6cb285">Pregunta qué estilo sigue tu grupo, qué velocidad se juega y quién cuida. Llega antes, saluda, ayuda con la batería y aprende el coro: así entras jugando, no interrumpiendo.</p></div>' +
    '<div class="su-a22da5">' + reglasHTML + '</div></div>' +
    '<div id="capPlanes" class="hidden"><div class="conv-row"><label class="su-97445a">🔍 Filtrar <input type="text" id="capPlanesQ" placeholder="nivel, niños, series, luna..."></label></div><div id="capPlanesList" class="su-bf3828">' + planesHTML + '</div></div>' +
    '<div id="capSeguridad" class="hidden"><div class="su-be2653">' + segHTML + '</div>' +
    '<div class="menstrual-card su-51d56a"><h4>🚨 Emergencias</h4><p class="muted su-6cb285">SAMU 131 · Bomberos 132 · CESFAM Penco. Caída de cuello, golpe en la cabeza con vómitos o muñeca deformada = se para y se pide ayuda. Detalle en 🩹 Primeros Auxilios de la app.</p></div></div>' +
    '<div id="capBitacora" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>➕ Anotar entreno o roda</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="capFecha"></label><label>Tipo <select id="capTipo"><option>Entreno</option><option>Roda</option><option>Roda abierta / evento</option><option>Batizado</option><option>Música / batería</option><option>Técnica en casa</option></select></label></div>' +
    '<div class="conv-row"><label>Lugar <select id="capLugar"><option>Sede / gimnasio</option><option>Multicancha barrio</option><option>Playa / plaza</option><option>Casa (técnica)</option><option>Otra ciudad / evento</option></select></label><label>Juegos <input type="number" id="capJuegos" min="0" step="1" placeholder="ej: 3"></label></div>' +
    '<div class="conv-row"><label>Minutos <input type="number" id="capMin" min="0" step="5" placeholder="ej: 60"></label><label>Cantos <input type="number" id="capCantos" min="0" step="1" placeholder="0"></label></div>' +
    '<div class="conv-row"><label>Esfuerzo <select id="capEsfuerzo"><option>Suave</option><option>Medio</option><option>Fuerte</option></select></label></div>' +
    '<label>Notas <input type="text" id="capDetalle" placeholder="qué jugué, qué canto aprendí, cómo me sentí..." maxlength="120"></label>' +
    '<div class="dlg-actions su-8f9e27"><button type="button" id="capAdd" class="btn btn-accent su-30e741">+ Guardar</button></div></div>' +
    '<div class="conv-row su-8a77e5"><label class="su-4b3de7">🔍 Buscar <input type="text" id="capLogQ" placeholder="roda, batizado, berimbau..."></label><label>Filtrar <select id="capLogF"><option value="">Todo</option><option>Entreno</option><option>Roda</option><option>Roda abierta / evento</option><option>Batizado</option><option>Música / batería</option><option>Técnica en casa</option></select></label></div>' +
    '<div id="capResumen" class="menstrual-card su-8a77e5"></div>' +
    '<div id="capLog" class="habits-list su-9daa59"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="capStats" class="muted su-11a508"></span><span class="su-3de8f9"><button type="button" id="capShare" class="btn su-30e741">📤 Compartir</button><button type="button" id="capClear" class="btn su-214f75">🗑 Borrar</button></span></div></div>';

  makeDialog('capoeiraDialog', '🪘 Capoeira — Aprende · Juego · Música · Penco',
    'Arte-lucha afrobrasileña en <b>⚽ Deportes</b> de <b>💚 Cuerpo & Salud</b>: ginga, esquivas, patadas, suelo y batería, con respeto y axé. Todo <b>privado y local</b>, 100% offline.',
    body);
}

/* ---------------- BITÁCORA ---------------- */
function renderLog() {
  var box = $('capLog'); if (!box) return;
  var m = store();
  var data = m.logs || [];
  var q = (($('capLogQ') && $('capLogQ').value) || '').toLowerCase();
  var f = (($('capLogF') && $('capLogF').value) || '');
  var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
  var list = data.filter(function (r) {
    if (f && r.tipo !== f) return false;
    if (q) {
      var t = ((r.tipo || '') + ' ' + (r.lugar || '') + ' ' + (r.detalle || '')).toLowerCase();
      var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
      if (tn.indexOf(qn) < 0) return false;
    }
    return true;
  });
  var res = $('capResumen'), st = $('capStats');
  var totMin = data.reduce(function (a, r) { return a + (+r.min || 0); }, 0);
  var totJ = data.reduce(function (a, r) { return a + (+r.juegos || 0); }, 0);
  var totC = data.reduce(function (a, r) { return a + (+r.cantos || 0); }, 0);
  var rodas = data.filter(function (r) { return (r.tipo || '').indexOf('Roda') >= 0 || r.tipo === 'Batizado'; }).length;
  if (res) {
    res.innerHTML = '<h4>📊 Resumen</h4><p class="muted su-6cb285">' + data.length + ' registro(s) · ⭕ ' + rodas + ' rodas · 🤸 ' + totJ + ' juegos · ⏱ ' + totMin + ' min · 🎶 ' + totC + ' cantos' +
      (data.length ? '<br>Último: ' + esc(data.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); })[0].fecha || '') : '') + '</p>';
  }
  if (!list.length) {
    box.innerHTML = '<p class="muted su-e201a8">Sin registros' + (data.length ? ' para este filtro.' : '. Anota tu primer entreno o roda arriba: hasta “1 coro aprendido” cuenta.') + '</p>';
    if (st) st.textContent = data.length ? data.length + ' en total' : '';
    return;
  }
  box.innerHTML = list.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 80).map(function (r) {
    var ico = ((r.tipo || '').indexOf('Roda') >= 0 || r.tipo === 'Batizado') ? '⭕' : '🪘';
    return '<div class="hora-item"><span class="su-6cb285">' + ico + ' <b>' + esc(r.tipo || 'Capoeira') + '</b> · ' + esc(r.lugar || '') +
      '<br><span class="muted su-0d5be0">' + esc(r.fecha || '') + (r.juegos ? ' · ' + esc(String(r.juegos)) + ' juegos' : '') + (r.min ? ' · ' + esc(String(r.min)) + ' min' : '') + (r.cantos ? ' · 🎶' + (+r.cantos || 0) : '') + (r.esfuerzo ? ' · ' + esc(r.esfuerzo) : '') + (r.detalle ? ' · ' + esc(r.detalle) : '') + '</span></span>' +
      '<button type="button" class="btn btn-icon cap-del" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.cap-del').forEach(function (x) {
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
  /* 1) botón btnCapoeira en Cuerpo & Salud > Deportes, junto a Fútbol/Básquet */
  try {
    var g = document.querySelector('.action-group[data-group="cuerpo"] .group-btns');
    if (g) {
      ensureDeportesSub(g);
      var existing = $('btnCapoeira');
      if (existing) {
        try { existing.setAttribute('data-sub', 'deportes'); } catch (eS) {}
      } else {
        var btn = document.createElement('button');
        btn.id = 'btnCapoeira'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🪘 Capoeira';
        try { btn.setAttribute('data-sub', 'deportes'); } catch (eS2) {}
        btn.setAttribute('data-keywords', 'capoeira roda ginga berimbau atabaque pandeiro angola regional bimba pastinha au esquiva martelo queixada banzo axe axe batizado corda mestre jogo bonito afro brasil deporte entrenar');
        var ref = $('btnBasquetbol') || $('btnFutbol');
        if (ref && ref.parentNode === g) {
          if (ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
          else g.appendChild(btn);
        } else {
          var lab = g.querySelector('.sub-label[data-sub="deportes"]');
          if (lab) {
            var next = lab.nextElementSibling;
            while (next && next.classList && next.classList.contains('btn') && next.id !== 'btnCapoeira') next = next.nextElementSibling;
            if (next) g.insertBefore(btn, next);
            else g.appendChild(btn);
          } else g.appendChild(btn);
        }
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnCapoeira') < 0) ALL_BTNS.push('btnCapoeira');
  } catch (e2) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnCapoeira = ['cuerpo', 'deportes'];
  } catch (e3) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      if (!BTN_ORDER['cuerpo|deportes']) BTN_ORDER['cuerpo|deportes'] = ['btnFutbol', 'btnCapoeira'];
      else if (BTN_ORDER['cuerpo|deportes'].indexOf('btnCapoeira') < 0) BTN_ORDER['cuerpo|deportes'].push('btnCapoeira');
    }
  } catch (e4) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p]) {
          if (p === 'deportista' || p === 'salud' || p === 'adolescente' || p === 'estudiante' || p === 'completo' || p === 'todo' || p === 'adulto') PRESETS[p].btnCapoeira = true;
        }
      });
    }
  } catch (e5) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e6) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e7) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e8) {}
  /* 3) checkbox en configDialog (grupo Cuerpo & Salud) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnCapoeira"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Cuerpo') >= 0) {
          var lab2 = document.createElement('label');
          lab2.className = 'check-row';
          lab2.innerHTML = '<input type="checkbox" data-btn="btnCapoeira"> 🪘 Capoeira';
          gr.appendChild(lab2);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab2.querySelector('input').checked = !vis || vis.btnCapoeira !== false;
            lab2.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnCapoeira = lab2.querySelector('input').checked;
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

  var b = $('btnCapoeira');
  if (b) b.onclick = function () {
    if ($('capFecha') && !$('capFecha').value) $('capFecha').value = todayKey();
    renderLog();
    openDlg('capoeiraDialog');
  };

  ['Aprende', 'Fundamentos', 'Reglas', 'Planes', 'Seguridad', 'Bitacora'].forEach(function (t) {
    var tb = $('tabCap' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  bindFilter('capFundQ', 'capFundList');
  bindFilter('capPlanesQ', 'capPlanesList');
  var lq = $('capLogQ'); if (lq) lq.oninput = renderLog;
  var lf = $('capLogF'); if (lf) lf.onchange = renderLog;

  var ad = $('capAdd');
  if (ad) ad.onclick = function () {
    var m = store();
    m.logs.push({
      id: uid('cap'),
      fecha: ($('capFecha') || {}).value || todayKey(),
      tipo: ($('capTipo') || {}).value || 'Entreno',
      lugar: ($('capLugar') || {}).value || 'Sede / gimnasio',
      juegos: parseFloat(($('capJuegos') || {}).value) || 0,
      min: parseFloat(($('capMin') || {}).value) || 0,
      cantos: parseFloat(($('capCantos') || {}).value) || 0,
      esfuerzo: ($('capEsfuerzo') || {}).value || 'Medio',
      detalle: clean((($('capDetalle') || {}).value || '').trim(), 120)
    });
    save('Capoeira guardada 🪘');
    if ($('capJuegos')) $('capJuegos').value = '';
    if ($('capMin')) $('capMin').value = '';
    if ($('capCantos')) $('capCantos').value = '';
    if ($('capDetalle')) $('capDetalle').value = '';
    renderLog();
  };

  var sh = $('capShare');
  if (sh) sh.onclick = async function () {
    var d = store().logs || [];
    if (!d.length) return alert('Sin registros aún');
    var t = '🪘 Mi capoeira\n' + d.slice().sort(function (a, b) { return (a.fecha || '').localeCompare(b.fecha || ''); }).map(function (r) {
      return '• ' + r.fecha + ' · ' + r.tipo + ' en ' + r.lugar + (r.juegos ? ' · ' + r.juegos + ' juegos' : '') + (r.min ? ' · ' + r.min + ' min' : '') + (r.cantos ? ' · 🎶' + r.cantos : '') + (r.esfuerzo ? ' · ' + r.esfuerzo : '') + (r.detalle ? ' — ' + r.detalle : '');
    }).join('\n');
    await share('Capoeira', t);
  };
  var cl = $('capClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu bitácora de capoeira?')) return;
    try { var u = userData(); if (u && u.capoeira) u.capoeira.logs = []; } catch (e12) {}
    save(); renderLog();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
