/* ============================================================
   RED COMUNITARIA — Calendario 13 Lunas (Penco · Bío-Bío)
   Integrada en la sección existente Comunidad (sin sección nueva),
   todo junto en UN apartado 📡 Red Comunitaria:
     btnRedGuia, btnRedMeshtastic, btnRedDiagnostico,
     btnRedRadio, btnRedNodos (comunidad|red-comunitaria)
   - Diálogo redComunitariaDialog con 5 pestañas:
       1) Guía (qué es, por qué en Penco, pasos, roles, reglas)
       2) Meshtastic (equipos, frecuencia Chile, configuración, instalación)
       3) Diagnóstico (chequeo nodo, SNR/RSSI, test alcance + registro)
       4) Radioaficionado (licencias SUBTEL, temario, plan 4 semanas, práctica)
       5) Mis Nodos (bitácora de nodos + pruebas, local y privado)
   - Todo local y privado por usuario: userData().redcomunitaria
     { nodos:[], diags:[], hechos:{} }
   - 100% offline. Sin dependencias externas.
   - Educativo: verifica norma vigente en subtel.cl / meshtastic.org
     porque frecuencias y trámites pueden cambiar.
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
    if (!u) return { nodos: [], diags: [], hechos: {} };
    if (!u.redcomunitaria) u.redcomunitaria = { nodos: [], diags: [], hechos: {} };
    var r = u.redcomunitaria;
    if (!Array.isArray(r.nodos)) r.nodos = [];
    if (!Array.isArray(r.diags)) r.diags = [];
    if (!r.hechos || Array.isArray(r.hechos)) r.hechos = {};
    return r;
  } catch (e) { return { nodos: [], diags: [], hechos: {} }; }
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
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }
function lunaDeHoy() {
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(todayKey()); if (r && r.luna !== 'dft') return { luna: r.luna, dia: r.diaN }; }
  } catch (e) {}
  return null;
}

/* ---------------- DATOS ---------------- */
var GUIA_CARDS = [
  { n: '¿Qué es una Red Comunitaria?', ico: '📡', txt: 'Una red de comunicación propia del territorio: vecinas y vecinos con equipos de radio de bajo costo (Meshtastic/LoRa + radioafición) que se hablan <b>sin internet ni celular</b>. Cada equipo es un <b>nodo</b> que repite los mensajes: si tu mensaje no llega directo, salta por los nodos de tus vecinos hasta llegar. En Penco sirve para sismo, tsunami, corte de luz, coordinación de minga, pesca y bosque.' },
  { n: '¿Por qué en Penco?', ico: '🌊', txt: 'Penco está entre mar y cerro, con tsunami, viento sur fuerte y cortes de fibra. En el 27F y temporales grandes el celular colapsó. Una malla de 5–10 nodos bien puestos (Cerro Verde, Cosmito, Lirquén, Primer Agua, centro) mantiene al pueblo hablándose aunque caiga todo lo demás. Empieza con 2 nodos (tú + 1 vecino a 500 m–2 km con vista) y crece por minga.' },
  { n: 'Principios (acuerdo base)', ico: '🤝', txt: '1) <b>La red es de todas</b>: nadie la vende ni la apaga. 2) <b>Mensajes cortos y útiles</b>: ubicación + estado + necesidad. 3) <b>Canal 0 = emergencia</b>, canal 1 = conversa diaria, canal 2 = pesca/huerta/minga. 4) <b>Sin datos sensibles</b> al aire (todo LoRa sin cifrado de punta a punta se puede escuchar). 5) <b>Energía compartida</b>: cada nodo con respaldo (USB + panel chico). 6) <b>Mantención por minga</b>: 1 revisión por luna.' },
  { n: 'Cómo levantarla en 7 pasos', ico: '🪜', txt: '<b>1)</b> Junta 2–3 personas (puerta a puerta, grupo curso). <b>2)</b> Compren 2 equipos iguales (ideal Heltec V3 o T-Beam, ~$25.000–45.000 c/u). <b>3)</b> Configuren juntos el canal LongFast + nombre corto (ej: PENCO-01). <b>4)</b> Prueba en tu cuadra (test alcance, pestaña Diagnóstico). <b>5)</b> Sube 1 nodo alto (techo, 3–6 m, caja estanca). <b>6)</b> Suma 1 nodo por sector con panel solar. <b>7)</b> Haz 1 simulacro mensual: todos mandan "PRUEBA + sector + batería" el mismo día.' },
  { n: 'Roles mínimos', ico: '🧭', txt: '<b>Nodo semilla</b> (alto y siempre prendido: cerro o techo alto). <b>Nodo hogar</b> (cada casa, se apaga de noche si quieres). <b>Nodo móvil</b> (pesca, cerro, bote: con batería). <b>Cuidadora/or del canal</b> (ordena, recuerda reglas, guarda bitácora). <b>Tallerista</b> (enseña a configurar y soldar antena). Con 1 de cada uno por sector la red aguanta.' },
  { n: 'Reglas del aire (pégala en el refri)', ico: '📜', txt: '• Máx 2 líneas por mensaje. • Empieza con SECTOR + MOTIVO: <i>"LIRQUEN PRUEBA bat 78%"</i>. • Emergencia real: repite 3 veces con hora: <i>"EMERGENCIA COSMITO familia bien, necesitamos agua 14:20"</i>. • No chistes en canal 0. • De noche, baja a 1 mensaje/hora (batería). • Si escuchas emergencia, confirma recepción: <i>"RECIBIDO PENCO-CENTRO 14:22"</i>.' },
  { n: 'Seguridad y límites honestos', ico: '⚠️', txt: 'Meshtastic <b>no es cifrado total</b>: usa canal con clave pero cualquiera con el mismo canal escucha. Nunca mandes RUT, claves, ubicación exacta de niños ni plata. En tormenta eléctrica desconecta la antena exterior. Antena en techo: bien anclada contra viento sur, lejos 10 m de tendido de alta tensión. Y lo legal: LoRa 915–928 MHz es banda libre de baja potencia en Chile; radioafición con más potencia y repetidoras exige <b>licencia SUBTEL</b> (ver pestaña Radio).' },
  { n: 'Costos reales Penco (2026)', ico: '💰', txt: 'Nodo hogar: placa Heltec V3 (~$25.000–35.000) + antena 915 MHz (~$6.000) + caja estanca (~$5.000) + cable USB. Nodo cerro: lo mismo + panel 5W ($12.000) + batería 18650 o powerbank. Total red de 4 nodos: ~$150.000–200.000 entre 4 familias ($40.000–50.000 c/u). Mucho menos que 1 celular nuevo, y dura años. Compra en conjunto y pide 2 repuestos.' }
];

var MESH_EQUIPOS = [
  { n: 'Heltec V3 (LoRa V3)', ico: '🟢', tag: 'recomendado para empezar', para: 'Hogar y móvil. Barato, pantalla OLED, USB-C, GPS opcional por Bluetooth del celu.', mat: 'Placa + antena 915 MHz + caja IP65 + USB.', nota: 'Flashea con web flasher (meshtastic.org) en modo LongFast · región US/ANZ 915 MHz. Nombre corto: PENCO-XX. Potencia Chile: deja la que trae por defecto (20–22 dBm), no la subas sin licencia.' },
  { n: 'Lilygo T-Beam', ico: '🔋', tag: 'nodo cerro / móvil con GPS', para: 'El que queda en el cerro o sale a pescar. Trae GPS y conector para batería 18650.', mat: 'T-Beam + batería 18650 + panel 5V + caja.', nota: 'Activa GPS con intervalo largo (300 s) para no comerse la batería. Es el mejor "repetidor" barato en altura.' },
  { n: 'RAK WisBlock / Heltec T114', ico: '☀️', tag: 'bajo consumo solar', para: 'Nodo solar que queda meses solo. Consume poquísimo.', mat: 'Placa + base solar + panel 5W.', nota: 'Ideal para Quebrada Honda o techo sin enchufe. Configura "Router" solo si sabes: si todos son router, la malla se atora. 1–2 routers por sector basta.' },
  { n: 'Antena: la mitad del equipo', ico: '📶', tag: 'no uses la chica adentro de la caja metálica', para: 'Toda la red. Una buena antena vale más que subir potencia.', mat: 'Antena 915 MHz 3–5 dBi + cable corto + adaptador.', nota: 'Afuera y alta: 3–6 m sobre el techo, vertical, lejos de latas y fierros. La antenita negra que trae sirve para probar en la pieza, no para el cerro. Nunca prendas el equipo sin antena puesta (se puede quemar).' }
];

var MESH_PASOS = [
  '<b>1) Flashea:</b> en el PC abre el flasher de meshtastic.org, conecta la placa por USB-C de datos, elige tu placa + versión estable + <b>LongFast</b>.',
  '<b>2) Región:</b> elige la que cubra <b>915–928 MHz (Chile / US)</b>. Si no aparece Chile, usa US/ANZ 915 MHz: es la misma banda libre chilena. No transmitas en 433 ni 868.',
  '<b>3) Nombres:</b> Long name: <i>Penco Lirquen 01</i> · Short: <i>PL01</i> (4 letras, se ve en la malla). Bluetooth PIN simple para la familia.',
  '<b>4) Canales:</b> Primario <b>LONGFAST con clave PSK</b> acordada en persona (no por WhatsApp público). Secundarios: conversa y minga. MQTT apagado al inicio (después, solo 1 gateway con internet).',
  '<b>5) Prueba de cuadra:</b> con la app (Android/iPhone) manda 3 mensajes de 2 líneas a 200 m, 500 m y 1 km. Anota SNR/RSSI (ver Diagnóstico). Si a 500 m no llega, sube 2 m la antena antes de culpar al equipo.',
  '<b>6) Instalación final:</b> caja estanca con 2 hoyitos abajo (respira y no entra agua), sílica gel adentro, cable USB con gotero (loop hacia abajo), palo bien anclado contra el sur. Panel mirando al norte, inclinado ~30°.',
  '<b>7) Minga de encendido:</b> prendan todos el mismo día a la misma hora y mándense lista: cada uno confirma a quién escucha directo. Guarda esa foto de la malla: es tu línea base.'
];

var DIAG_CHECKS = [
  { id: 'ant', n: 'Antena puesta y afuera', d: 'Equipo apagado → enrosca antena 915 MHz → recién ahí prende. Antena vertical, fuera de caja metálica, sobre 3 m.' },
  { id: 'ali', n: 'Alimentación y batería', d: 'Cable USB de datos bueno (los de carga baratos fallan). Batería >50% o panel al norte. Si se reinicia solo: cambia cable y fuente (2A).' },
  { id: 'cfg', n: 'Misma config que la red', d: 'Mismo preset LongFast, misma región 915 MHz, mismo canal primario + clave. Un número distinto = no se escuchan.' },
  { id: 'alt', n: 'Altura y despeje', d: 'Sube 2–3 m y repite el test antes de comprar nada. Entre casas, la altura manda más que la potencia. Vista al cerro = oro.' },
  { id: 'snr', n: 'SNR / RSSI sanos', d: 'En la app toca el mensaje: SNR > −7 bueno, −7 a −12 justo, < −12 cambia de lugar. RSSI −60 a −100 ok, bajo −115 casi nada. Guarda 3 lecturas (ver registro abajo).' },
  { id: 'rol', n: 'Rol correcto', d: 'Casi todos en CLIENT. Solo 1–2 ROUTER por sector alto. Todos en ROUTER = tormenta de rebotes y batería muerta.' },
  { id: 'int', n: 'Interferencia y clima', d: 'Viento sur + lluvia = −3 a −6 dB. Microondas, WiFi y motores meten ruido. Prueba de mañana temprano (menos ruido) vs tarde.' },
  { id: 'msg', n: 'Mensajes cortos', d: '2 líneas máx. Los largos se cortan y gastan 3× batería. Emergencia: corto + hora + repite 3 veces cada 5 min, no 30 veces seguidas.' }
];

var RADIO_CLASES = [
  { n: 'Aspirante (CE)', ico: '🌱', txt: 'Entrada. Examen básico (reglamento + técnica elemental). Potencias bajas, bandas limitadas, ideal para partir con un handy 2m. Vigencia 5 años renovable. Requisito: cédula + aprobar examen SUBTEL. Perfecta si vienes de Meshtastic y quieres legalizar tu handy.' },
  { n: 'Novicio / General (CB-CA)', ico: '🌿', txt: 'Operación amplia en VHF/UHF y parte de HF con límites de potencia. Puedes usar repetidoras (ej: red del Bío-Bío), participar en emergencias ONEMI/SENAPRED y salidas a terreno. Examen más técnico (propagación, antenas, seguridad eléctrica).' },
  { n: 'Superior', ico: '🌳', txt: 'Todas las bandas y máxima potencia autorizada, concursos, DX, satélites, EME. Examen completo + antigüedad como General. Si te enamoras del fierro, este es el camino. Mantiene vigencia con actividad y renovación.' }
];

var RADIO_TEMARIO = [
  { n: 'Reglamento y ética', ico: '📜', txt: 'Ley de telecomunicaciones, SUBTEL, distintivos de llamada (CA/CE), bandas y modos permitidos por clase, prioridad de emergencias, libro de guardia. Código Q esencial (QTH, QRM, QRP, QSL), alfabeto fonético OTAN (Alfa, Bravo, Charlie…), señales de socorro. Todo examen lo pregunta: memo + practica en voz alta.' },
  { n: 'Técnica: electricidad y radio', ico: '⚡', txt: 'Ley de Ohm (V=R·I), potencia (P=V·I), serie/paralelo, batería y panel. Frecuencia/longitud de onda (λ=300/f[MHz]), SWR/ROE, antenas (dipolo, ground-plane, yagi), coaxial y conectores, puesta a tierra. Ejercicio típico: dipolo para 146 MHz → cada rama ≈ 300/(146·4) ≈ 0,51 m.' },
  { n: 'Operación y emergencia', ico: '🚨', txt: 'Plan de bandas 2m (144–148 MHz) y 70cm (430–440 MHz), repetidoras (desplazamiento ±600 kHz / ±5 MHz, subtono CTCSS), simplex vs repetidora, reporte RST, fonía clara y breve. Protocolo Penco: escucha 5 min antes de llamar, llama 3× ("CQ CQ de CE…"), confirma, anota hora + QTH + estado en bitácora.' }
];

var RADIO_PLAN = [
  { s: 'Semana 1 · Reglamento', t: 'Lee el reglamento resumido SUBTEL + alfabeto fonético + código Q (20 tarjetas). Escucha 30 min/día una repetidora o kiwiSDR. Meta: recitar fonético sin trabarte y explicar qué es un distintivo.' },
  { s: 'Semana 2 · Técnica base', t: 'Ohm + potencia + λ con 10 ejercicios. Arma un dipolo de cable para 2m y mídelo (aunque sea con huincha). Meta: calcular rama de dipolo y explicar SWR con tus palabras.' },
  { s: 'Semana 3 · Operación', t: 'Practica con handy en simplex con tu dupla (con o sin licencia según potencia legal, o en simulacro sin transmitir). Lleva libro de guardia real 7 días. Meta: hacer un llamado completo + reporte RST.' },
  { s: 'Semana 4 · Ensayo', t: '2 ensayos de 40 preguntas cronometrados (meta 70%+). Repasa solo lo fallado. Inscribe el examen en SUBTEL/ChileAtiende con cédula. Meta: aprobar 2 ensayos seguidos y llegar tranquila/o.' }
];

/* ---------------- DIÁLOGO ---------------- */
function buildDialog() {
  var old = $('redComunitariaDialog');
  if (old) old.remove();
  var d = document.createElement('dialog');
  d.id = 'redComunitariaDialog';
  var guiaHTML = GUIA_CARDS.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + c.txt + '</p></div>';
  }).join('');
  var meshEq = MESH_EQUIPOS.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p><span class="chip" style="font-size:10px">' + esc(c.tag) + '</span></p><p><b>Para:</b> ' + esc(c.para) + '</p><p><b>Lleva:</b> ' + esc(c.mat) + '</p><p class="muted">' + esc(c.nota) + '</p></div>';
  }).join('');
  var meshPasos = MESH_PASOS.map(function (p, i) { return '<div class="si-card"><h4>Paso ' + (i + 1) + '</h4><p>' + p + '</p></div>'; }).join('');
  var diagHTML = DIAG_CHECKS.map(function (c) {
    return '<label class="check-row" style="align-items:flex-start"><input type="checkbox" data-diag="' + c.id + '"> <span><b>' + esc(c.n) + '</b><br><span class="muted" style="font-size:11px">' + esc(c.d) + '</span></span></label>';
  }).join('');
  var radioCl = RADIO_CLASES.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + esc(c.txt) + '</p></div>';
  }).join('');
  var radioTe = RADIO_TEMARIO.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + esc(c.txt) + '</p></div>';
  }).join('');
  var radioPl = RADIO_PLAN.map(function (p) {
    return '<div class="si-card"><h4>' + esc(p.s) + '</h4><p>' + esc(p.t) + '</p></div>';
  }).join('');

  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
      '<h3 style="margin:0;color:var(--accent)">📡 Red Comunitaria — Penco</h3>' +
      '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Internet se cae, la malla queda. Guía + Meshtastic + diagnóstico + radioafición con licencia, todo para el territorio. Funciona <b>offline</b>; tu bitácora queda <b>privada y local</b>.</p>' +
    '<div id="redHoyBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div class="timer-tabs" style="margin:10px 0;flex-wrap:wrap">' +
      '<button type="button" id="tabRedGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
      '<button type="button" id="tabRedMesh" class="btn" style="width:auto">📡 Meshtastic</button>' +
      '<button type="button" id="tabRedDiag" class="btn" style="width:auto">🩺 Diagnóstico</button>' +
      '<button type="button" id="tabRedRadio" class="btn" style="width:auto">🎙️ Curso / Licencia</button>' +
      '<button type="button" id="tabRedNodos" class="btn" style="width:auto">📓 Mis Nodos</button>' +
    '</div>' +

    '<div id="redPanelGuia">' +
      '<div class="discipline-grid">' + guiaHTML + '</div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>✅ Mi compromiso con la red</h4>' +
        '<p class="muted" style="font-size:11px">Marca lo que ya hiciste. Se guarda por usuario.</p>' +
        '<div id="redGuiaChecks">' +
          '<label class="check-row"><input type="checkbox" data-guia="hable"> Hablé con 1 vecino/a de la red</label>' +
          '<label class="check-row"><input type="checkbox" data-guia="canal"> Acordamos canal + clave en persona</label>' +
          '<label class="check-row"><input type="checkbox" data-guia="prueba"> Hicimos 1 prueba de cuadra</label>' +
          '<label class="check-row"><input type="checkbox" data-guia="altura"> Subimos 1 antena sobre 3 m</label>' +
          '<label class="check-row"><input type="checkbox" data-guia="simulacro"> Hicimos 1 simulacro mensual</label>' +
        '</div>' +
        '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><span id="redGuiaStats" class="muted" style="font-size:11px"></span></div>' +
      '</div>' +
    '</div>' +

    '<div id="redPanelMesh" class="hidden">' +
      '<div class="menstrual-card"><h4>📡 Meshtastic en 1 minuto</h4><p class="muted" style="font-size:12px;line-height:1.55">Radios LoRa de bolsillo que forman una <b>malla</b>: cada equipo repite el mensaje. Sin chip, sin cuenta, sin internet. Alcance real en Penco: 500 m–3 km entre casas, 5–15 km con altura y vista (cerro–costa). Batería: 1–3 días; con panel chico: semanas. App gratis + mapa de nodos escuchados.</p>' +
      '<p class="muted" style="font-size:11px">🇨🇱 Chile: banda libre <b>915–928 MHz</b> (elige preset LongFast + región 915 MHz). Clave del canal se acuerda <b>en persona</b>. Verifica siempre la norma vigente en subtel.cl y meshtastic.org.</p></div>' +
      '<h4 style="margin:10px 0 6px;color:var(--gold)">🧰 Equipos (compra en dupla)</h4>' +
      '<div class="discipline-grid">' + meshEq + '</div>' +
      '<h4 style="margin:10px 0 6px;color:var(--gold)">🔧 Configuración paso a paso</h4>' +
      '<div class="discipline-grid">' + meshPasos + '</div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>📻 Canales sugeridos Penco</h4><p style="font-size:12px;line-height:1.6"><b>Canal 0 · LONGFAST (clave):</b> solo emergencia + pruebas. Silencio el resto del día.<br><b>Canal 1 · CONVERSA:</b> coordina minga, pesca, avisos.<br><b>Canal 2 · HUERTA/BOSQUE:</b> trueque, semillas, riego.<br>MQTT: apagado. Solo 1 nodo con internet lo prende si la red lo acuerda.</p></div>' +
    '</div>' +

    '<div id="redPanelDiag" class="hidden">' +
      '<div class="menstrual-card"><h4>🩺 Chequeo rápido del nodo (5 min)</h4><div id="redDiagChecks" style="display:flex;flex-direction:column;gap:8px;margin-top:8px">' + diagHTML + '</div>' +
      '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><span id="redDiagStats" class="muted" style="font-size:11px"></span></div></div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>📏 Test de alcance (10 min, en dupla)</h4><p class="muted" style="font-size:11px;line-height:1.5">1) Uno se queda en el nodo alto. 2) El otro camina a 200 / 500 / 1000 m y manda <i>"PRUEBA + lugar + hora"</i>. 3) Anotan si llegó + SNR/RSSI que muestra la app. 4) Repiten subiendo 2 m la antena. Lo que más mejora: altura, no potencia.</p>' +
      '<div class="conv-row"><label>SNR <input type="text" id="redDiagSnr" placeholder="ej: -4.5" maxlength="10"></label><label>RSSI <input type="text" id="redDiagRssi" placeholder="ej: -87" maxlength="10"></label><label>Distancia <input type="text" id="redDiagDist" placeholder="ej: 800 m" maxlength="15"></label></div>' +
      '<div class="conv-row"><label>Lugar <input type="text" id="redDiagLugar" placeholder="ej: Cerro Verde → Lirquén" maxlength="40"></label><label>Resultado <select id="redDiagRes"><option value="llego">✅ Llegó claro</option><option value="cortado">🟡 Llegó cortado</option><option value="nada">🔴 No llegó</option></select></label></div>' +
      '<label>Notas <input type="text" id="redDiagNota" placeholder="ej: con lluvia, antena a 4 m" maxlength="80"></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="redDiagAdd" class="btn btn-accent" style="width:auto">+ Guardar medición</button></div>' +
      '<div id="redDiagLog" class="habits-list" style="margin-top:10px;max-height:220px"></div>' +
      '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="redDiagCount" class="muted" style="font-size:11px"></span><span style="display:flex;gap:8px"><button type="button" id="redDiagShare" class="btn" style="width:auto">📤 Compartir</button><button type="button" id="redDiagClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +
    '</div>' +

    '<div id="redPanelRadio" class="hidden">' +
      '<div class="menstrual-card"><h4>🎙️ Ser radioaficionada/o en Chile (SUBTEL)</h4><p class="muted" style="font-size:12px;line-height:1.55">Meshtastic es libre y de baja potencia. Si quieres handy VHF/UHF con más potencia, repetidoras y HF, necesitas <b>licencia SUBTEL</b>: das un examen (40 preguntas, ~70% para aprobar), recibes tu <b>distintivo (CA/CE…)</b> y quedas habilitada/o por 5 años. Trámite con cédula en SUBTEL / ChileAtiende. <b>Verifica la norma vigente en subtel.cl</b>: categorías y temarios se actualizan.</p></div>' +
      '<h4 style="margin:10px 0 6px;color:var(--gold)">🪜 Clases de licencia</h4>' +
      '<div class="discipline-grid">' + radioCl + '</div>' +
      '<h4 style="margin:10px 0 6px;color:var(--gold)">📚 Lo que entra en el examen</h4>' +
      '<div class="discipline-grid">' + radioTe + '</div>' +
      '<h4 style="margin:10px 0 6px;color:var(--gold)">🗓️ Plan de estudio 4 semanas (30 min/día)</h4>' +
      '<div class="discipline-grid">' + radioPl + '</div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>📡 Tu primer handy (2m/70cm)</h4><p class="muted" style="font-size:11px;line-height:1.55">• Handy doble banda VHF/UHF + antena mejorada (la de fábrica es corta). • Aprende repetidoras del Bío-Bío con tu radioclub (ej: Radio Club Concepción / Talcahuano: ellos toman exámenes y enseñan). • Libro de guardia desde el día 1: fecha, hora, con quién, frecuencia, reporte. • En emergencia real: escucha, sé breve, prioriza vida. Únete a un radioclub: el examen y la práctica se hacen en comunidad, no solo.</p>' +
      '<div id="redRadioChecks" style="display:flex;flex-direction:column;gap:6px;margin-top:8px">' +
        '<label class="check-row"><input type="checkbox" data-radio="fonetico"> Domino el alfabeto fonético</label>' +
        '<label class="check-row"><input type="checkbox" data-radio="q"> Uso código Q básico (QTH, QRM, QSL)</label>' +
        '<label class="check-row"><input type="checkbox" data-radio="dipolo"> Calculé y armé un dipolo 2m</label>' +
        '<label class="check-row"><input type="checkbox" data-radio="guardia"> Llevo libro de guardia 7 días</label>' +
        '<label class="check-row"><input type="checkbox" data-radio="ensayo"> Aprobé 2 ensayos 70%+</label>' +
        '<label class="check-row"><input type="checkbox" data-radio="inscrito"> Me inscribí al examen SUBTEL</label>' +
      '</div>' +
      '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><span id="redRadioStats" class="muted" style="font-size:11px"></span></div></div>' +
    '</div>' +

    '<div id="redPanelNodos" class="hidden">' +
      '<div class="menstrual-card"><h4>📓 Mis nodos — bitácora privada</h4><p class="muted" style="font-size:11px">Tus equipos + los de tu sector. Queda solo en este dispositivo.</p>' +
      '<div class="conv-row"><label>Nombre <input type="text" id="redNodoNombre" placeholder="ej: PENCO-01 cerro" maxlength="30"></label><label>ID corto <input type="text" id="redNodoId" placeholder="ej: !a1b2c3d4 / PL01" maxlength="15"></label></div>' +
      '<div class="conv-row"><label>Lugar <input type="text" id="redNodoLugar" placeholder="ej: Cerro Verde, techo" maxlength="40"></label><label>Rol <select id="redNodoRol"><option value="hogar">🏠 Hogar</option><option value="semilla">🌱 Semilla (alto)</option><option value="movil">🎒 Móvil</option><option value="solar">☀️ Solar / cerro</option></select></label></div>' +
      '<div class="conv-row"><label>Equipo <input type="text" id="redNodoEquipo" placeholder="ej: Heltec V3 + 5 dBi" maxlength="40"></label><label>Estado <select id="redNodoEstado"><option value="ok">✅ Activo</option><option value="prueba">🟡 En prueba</option><option value="caido">🔴 Caído / sin batería</option></select></label></div>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="redNodoAdd" class="btn btn-accent" style="width:auto">+ Guardar nodo</button><button type="button" id="redNodoCancel" class="btn hidden" style="width:auto">Cancelar</button></div>' +
      '<div id="redNodoLog" class="habits-list" style="margin-top:10px;max-height:240px"></div>' +
      '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="redNodoStats" class="muted" style="font-size:11px"></span><span style="display:flex;gap:8px"><button type="button" id="redNodoShare" class="btn" style="width:auto">📤 Compartir</button><button type="button" id="redNodoClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>🚨 Protocolo sin internet (1 tarjeta por casa)</h4><p style="font-size:12px;line-height:1.6">1) <b>Escucha</b> canal 0 por 5 min. 2) <b>Reporta:</b> SECTOR + ESTADO + NECESIDAD + HORA (<i>"COSMITO bien, 2 familias, falta agua 14:20"</i>). 3) <b>Repite</b> 3× cada 5 min, no en loop. 4) <b>Confirma</b> lo que escuches (<i>"RECIBIDO CENTRO 14:22"</i>). 5) Punto de encuentro acordado de antemano (no lo mandes al aire la primera vez).</p></div>' +
    '</div>' +

    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}

/* ---------------- PESTAÑAS ---------------- */
var TABS = ['Guia', 'Mesh', 'Diag', 'Radio', 'Nodos'];
function switchTab(t) {
  TABS.forEach(function (k) {
    var p = $('redPanel' + k), b = $('tabRed' + k);
    if (p) p.classList.toggle('hidden', k !== t);
    if (b) { b.classList.toggle('btn-accent', k === t); }
  });
}
function openTab(t) { buildDialogIfNeeded(); paintHoy(); renderAll(); switchTab(t); openDlg('redComunitariaDialog'); }
function buildDialogIfNeeded() { if (!$('redComunitariaDialog')) { buildDialog(); wireDialog(); } }

function paintHoy() {
  var b = $('redHoyBox'); if (!b) return;
  var l = lunaDeHoy();
  var txt = l ? ('Hoy · Luna ' + l.luna + ' · día ' + l.dia) : ('Hoy · ' + todayKey());
  var rec = !l ? 'Mide y anota parejo: la red se cuida por luna.'
    : l.luna <= 3 ? 'Pukem (invierno): revisa cajas, humedad y baterías. Mantención de cerro con día bueno.'
    : l.luna <= 6 ? 'Pewü (primavera): instala nodos nuevos y haz la minga de encendido.'
    : l.luna <= 9 ? 'Walüng (verano): test de alcance con calor y turismo (más ruido). Paneles al norte.'
    : 'Rimü (otoño): simulacro mensual antes del viento sur fuerte. Aprieta antenas.';
  b.innerHTML = '<h4>🌙 ' + esc(txt) + '</h4><p class="muted" style="font-size:12px">' + esc(rec) + '</p>';
}

/* ---------------- CHECKS (guía / diag / radio) ---------------- */
function wireChecks(sel, attr, statId, labels) {
  var box = $(sel); if (!box) return;
  var st = store();
  box.querySelectorAll('input[' + attr + ']').forEach(function (inp) {
    var k = inp.getAttribute(attr);
    inp.checked = !!(st.hechos && st.hechos[sel + ':' + k]);
    inp.onchange = function () {
      var s = store();
      s.hechos[sel + ':' + k] = inp.checked;
      save(); paintStats();
    };
  });
}
function paintStats() {
  try {
    var s = store();
    var g = ['hable', 'canal', 'prueba', 'altura', 'simulacro'].filter(function (k) { return s.hechos['redGuiaChecks:' + k]; }).length;
    var gs = $('redGuiaStats'); if (gs) gs.textContent = g + ' / 5 pasos · ' + (g === 5 ? '🌱 Red andando' : g >= 3 ? '🌿 Ya hay malla' : '🌱 Empieza con 1 vecino');
    var dg = DIAG_CHECKS.filter(function (c) { return s.hechos['redDiagChecks:' + c.id]; }).length;
    var ds = $('redDiagStats'); if (ds) ds.textContent = dg + ' / ' + DIAG_CHECKS.length + ' chequeos · ' + (dg === DIAG_CHECKS.length ? '✅ Nodo sano' : 'revisa lo sin marcar');
    var rk = ['fonetico', 'q', 'dipolo', 'guardia', 'ensayo', 'inscrito'].filter(function (k) { return s.hechos['redRadioChecks:' + k]; }).length;
    var rs = $('redRadioStats'); if (rs) rs.textContent = rk + ' / 6 hitos · ' + (rk >= 5 ? '🎙️ Lista/o para el examen' : rk >= 3 ? '📻 Vas bien' : '🌱 Parte por fonético + Q');
  } catch (e) {}
}

/* ---------------- DIAGNÓSTICO LOG ---------------- */
function renderDiag() {
  var box = $('redDiagLog'); if (!box) return;
  var s = store();
  var data = s.diags || [];
  var ct = $('redDiagCount');
  if (!data.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin mediciones. Guarda la primera arriba después de tu test de alcance.</p>';
    if (ct) ct.textContent = '';
    return;
  }
  var arr = data.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  box.innerHTML = arr.map(function (r) {
    var chip = r.res === 'llego' ? '<span class="chip" style="font-size:10px;color:#8fd694;border-color:#8fd69455">✅ llegó</span>'
      : r.res === 'cortado' ? '<span class="chip" style="font-size:10px;color:#e8c56a;border-color:#e8c56a55">🟡 cortado</span>'
      : '<span class="chip" style="font-size:10px;color:#e76e8a;border-color:#e76e8a55">🔴 nada</span>';
    return '<div class="hora-item"><span style="font-size:12px"><b>' + esc(r.lugar || 'Test') + '</b> ' + chip +
      '<br><span class="muted" style="font-size:10px">' + esc(r.fecha || '') + ' · SNR ' + esc(r.snr || '–') + ' · RSSI ' + esc(r.rssi || '–') + ' · ' + esc(r.dist || '–') + (r.nota ? ' · ' + esc(r.nota) : '') + '</span></span>' +
      '<button type="button" class="btn btn-icon red-diag-del" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.red-diag-del').forEach(function (x) {
    x.onclick = function () {
      var st = store();
      st.diags = (st.diags || []).filter(function (r) { return r.id !== x.dataset.k; });
      save(); renderDiag();
    };
  });
  if (ct) ct.textContent = data.length + ' medición(es)';
}

/* ---------------- NODOS LOG ---------------- */
var editingNodo = null;
function renderNodos() {
  var box = $('redNodoLog'); if (!box) return;
  var s = store();
  var data = s.nodos || [];
  var st = $('redNodoStats');
  if (!data.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin nodos aún. Guarda el primero: tu equipo + 1 vecino.</p>';
    if (st) st.textContent = '';
    return;
  }
  var rolName = { hogar: '🏠 Hogar', semilla: '🌱 Semilla', movil: '🎒 Móvil', solar: '☀️ Solar' };
  var estChip = { ok: '✅', prueba: '🟡', caido: '🔴' };
  box.innerHTML = data.map(function (r) {
    return '<div class="hora-item"><span style="font-size:12px"><b>' + esc(r.nombre || 'Nodo') + '</b> <span class="muted">' + esc(r.nid || '') + '</span> ' + (estChip[r.estado] || '') +
      '<br><span class="muted" style="font-size:10px">' + esc(rolName[r.rol] || r.rol || '') + ' · ' + esc(r.lugar || '') + ' · ' + esc(r.equipo || '') + '</span></span>' +
      '<span style="display:flex;gap:4px"><button type="button" class="btn btn-icon red-nodo-edit" data-k="' + esc(r.id) + '" title="Editar">✎</button>' +
      '<button type="button" class="btn btn-icon red-nodo-del" data-k="' + esc(r.id) + '" title="Borrar">✕</button></span></div>';
  }).join('');
  box.querySelectorAll('.red-nodo-del').forEach(function (x) {
    x.onclick = function () {
      if (!confirm('¿Borrar este nodo?')) return;
      var st2 = store();
      st2.nodos = (st2.nodos || []).filter(function (r) { return r.id !== x.dataset.k; });
      save(); renderNodos();
    };
  });
  box.querySelectorAll('.red-nodo-edit').forEach(function (x) {
    x.onclick = function () {
      var st2 = store();
      var r = (st2.nodos || []).find(function (n) { return n.id === x.dataset.k; });
      if (!r) return;
      editingNodo = r.id;
      $('redNodoNombre').value = r.nombre || ''; $('redNodoId').value = r.nid || '';
      $('redNodoLugar').value = r.lugar || ''; $('redNodoRol').value = r.rol || 'hogar';
      $('redNodoEquipo').value = r.equipo || ''; $('redNodoEstado').value = r.estado || 'ok';
      $('redNodoCancel').classList.remove('hidden');
      try { $('redNodoNombre').focus(); } catch (e) {}
    };
  });
  if (st) {
    var ok = data.filter(function (r) { return r.estado === 'ok'; }).length;
    st.textContent = data.length + ' nodo(s) · ' + ok + ' activo(s)';
  }
}

function renderAll() { paintHoy(); paintStats(); renderDiag(); renderNodos(); }

/* ---------------- WIRE ---------------- */
function wireDialog() {
  TABS.forEach(function (t) {
    var b = $('tabRed' + t);
    if (b) b.onclick = function () { switchTab(t); };
  });
  wireChecks('redGuiaChecks', 'data-guia');
  wireChecks('redDiagChecks', 'data-diag');
  wireChecks('redRadioChecks', 'data-radio');
  paintStats();

  var da = $('redDiagAdd');
  if (da) da.onclick = function () {
    var s = store();
    s.diags.push({
      id: uid('rd'), fecha: todayKey(),
      snr: clean(($('redDiagSnr') || {}).value || '', 10),
      rssi: clean(($('redDiagRssi') || {}).value || '', 10),
      dist: clean(($('redDiagDist') || {}).value || '', 15),
      lugar: clean(($('redDiagLugar') || {}).value || '', 40),
      res: ($('redDiagRes') || {}).value || 'llego',
      nota: clean(($('redDiagNota') || {}).value || '', 80)
    });
    save('Medición guardada 🩺');
    ['redDiagSnr', 'redDiagRssi', 'redDiagDist', 'redDiagLugar', 'redDiagNota'].forEach(function (id) { var x = $(id); if (x) x.value = ''; });
    renderDiag();
  };
  var ds = $('redDiagShare');
  if (ds) ds.onclick = async function () {
    var d = store().diags || [];
    if (!d.length) return alert('Sin mediciones aún');
    var t = '🩺 Diagnóstico Red Penco\n' + d.slice().sort(function (a, b) { return (a.fecha || '').localeCompare(b.fecha || ''); }).map(function (r) {
      return '• ' + r.fecha + ' · ' + (r.lugar || 'test') + ' · ' + (r.dist || '–') + ' · SNR ' + (r.snr || '–') + ' RSSI ' + (r.rssi || '–') + ' · ' + r.res + (r.nota ? ' — ' + r.nota : '');
    }).join('\n');
    await share('Diagnóstico red', t);
  };
  var dc = $('redDiagClear');
  if (dc) dc.onclick = function () {
    if (!confirm('¿Borrar tus mediciones de diagnóstico?')) return;
    try { store().diags = []; } catch (e) {}
    save(); renderDiag();
  };

  var na = $('redNodoAdd');
  if (na) na.onclick = function () {
    var nom = clean((($('redNodoNombre') || {}).value || '').trim(), 30);
    if (!nom) return alert('Escribe el nombre del nodo (ej: PENCO-01 cerro)');
    var s = store();
    var obj = {
      id: editingNodo || uid('rn'), nombre: nom,
      nid: clean((($('redNodoId') || {}).value || '').trim(), 15),
      lugar: clean((($('redNodoLugar') || {}).value || '').trim(), 40),
      rol: ($('redNodoRol') || {}).value || 'hogar',
      equipo: clean((($('redNodoEquipo') || {}).value || '').trim(), 40),
      estado: ($('redNodoEstado') || {}).value || 'ok'
    };
    if (editingNodo) {
      s.nodos = (s.nodos || []).map(function (n) { return n.id === editingNodo ? obj : n; });
      editingNodo = null; $('redNodoCancel').classList.add('hidden');
    } else s.nodos.push(obj);
    save('Nodo guardado 📓');
    ['redNodoNombre', 'redNodoId', 'redNodoLugar', 'redNodoEquipo'].forEach(function (id) { var x = $(id); if (x) x.value = ''; });
    renderNodos();
  };
  var nc = $('redNodoCancel');
  if (nc) nc.onclick = function () {
    editingNodo = null; nc.classList.add('hidden');
    ['redNodoNombre', 'redNodoId', 'redNodoLugar', 'redNodoEquipo'].forEach(function (id) { var x = $(id); if (x) x.value = ''; });
  };
  var ns = $('redNodoShare');
  if (ns) ns.onclick = async function () {
    var d = store().nodos || [];
    if (!d.length) return alert('Sin nodos aún');
    var t = '📓 Mis nodos — Red Penco\n' + d.map(function (r) {
      return '• ' + r.nombre + ' (' + (r.nid || 's/id') + ') · ' + (r.lugar || '') + ' · ' + (r.rol || '') + ' · ' + (r.equipo || '') + ' · ' + (r.estado || '');
    }).join('\n');
    await share('Mis nodos', t);
  };
  var nx = $('redNodoClear');
  if (nx) nx.onclick = function () {
    if (!confirm('¿Borrar todos tus nodos?')) return;
    try { store().nodos = []; } catch (e) {}
    save(); renderNodos();
  };
}

/* ---------------- SETUP: integra en secciones existentes ----------------
   Sin sección nueva: todo vive en Comunidad (grupo existente),
   junto en UN solo apartado (sub-label):
       📡 Red Comunitaria (sub "red-comunitaria"):
         btnRedGuia, btnRedMeshtastic, btnRedDiagnostico,
         btnRedRadio, btnRedNodos
   Migra y limpia las versiones anteriores (sección propia o los
   4 sub-labels separados red-guia/red-mesh/red-diag/red-radio). */
var BTNS = [
  { id: 'btnRedGuia', label: '📖 Guía Red', tab: 'Guia', sub: 'red-comunitaria', kw: 'red comunitaria guia que es malla penco emergencia tsunami sismo organizacion roles reglas minga' },
  { id: 'btnRedMeshtastic', label: '📡 Meshtastic', tab: 'Mesh', sub: 'red-comunitaria', kw: 'meshtastic lora mesh malla radio nodo tbeam heltec rak antena 915 canal longfast configuracion firmware panel solar' },
  { id: 'btnRedDiagnostico', label: '🩺 Diagnóstico', tab: 'Diag', sub: 'red-comunitaria', kw: 'diagnostico test alcance snr rssi señal cobertura bateria antena chequeo falla no llega prueba' },
  { id: 'btnRedRadio', label: '🎙️ Curso / Licencia', tab: 'Radio', sub: 'red-comunitaria', kw: 'radioaficionado radioaficionada curso licencia subtel examen aspirante novicio general superior handy vhf uhf repetidora codigo q fonetico distintivo' },
  { id: 'btnRedNodos', label: '📓 Mis Nodos', tab: 'Nodos', sub: 'red-comunitaria', kw: 'nodos bitacora registro equipos sector mapa red protocolo emergencia contacto' }
];
var SUB_LABEL = { id: 'red-comunitaria', label: '📡 Red Comunitaria' };
var OLD_SUBS = ['red-guia', 'red-mesh', 'red-diag', 'red-radio', 'guia', 'meshtastic', 'radio'];

function ensureSection() {
  // 1) Migrar/limpiar: eliminar la sección separada de la versión anterior si existe
  try {
    var oldGroup = document.querySelector('.action-group[data-group="redcomunitaria"]');
    if (oldGroup) {
      try { oldGroup.remove(); } catch (e0) { try { oldGroup.parentNode.removeChild(oldGroup); } catch (e1) {} } }
  } catch (e) {}
  // 2) Integrar en Comunidad (grupo existente), todo junto en un apartado
  var box = document.querySelector('.action-group[data-group="comunidad"] .group-btns');
  if (!box) return;
  // 2a) Eliminar sub-labels viejos separados (si quedaron de versiones anteriores)
  try {
    OLD_SUBS.forEach(function (sid) {
      var old = box.querySelector('.sub-label[data-sub="' + sid + '"]');
      if (old) { try { old.remove(); } catch (eR) { try { old.parentNode.removeChild(old); } catch (eR2) {} } }
    });
  } catch (e) {}
  // 2b) Crear (o reutilizar) el apartado único, justo antes de App para no tapar Respaldo
  var lab = box.querySelector('.sub-label[data-sub="' + SUB_LABEL.id + '"]');
  if (!lab) {
    lab = document.createElement('span');
    lab.className = 'sub-label'; lab.setAttribute('data-sub', SUB_LABEL.id); lab.textContent = SUB_LABEL.label;
    var appLab = box.querySelector('.sub-label[data-sub="app"]');
    if (appLab && appLab.parentNode === box) box.insertBefore(lab, appLab);
    else box.appendChild(lab);
  } else if (!lab.textContent || lab.textContent.indexOf('Red Comunitaria') < 0) {
    lab.textContent = SUB_LABEL.label;
  }
  // 2c) Crear/migrar los 5 botones juntos, en orden, justo después del label
  BTNS.forEach(function (b) {
    var el = document.getElementById(b.id);
    if (!el) {
      el = document.createElement('button');
      el.id = b.id; el.className = 'btn'; el.type = 'button';
      box.appendChild(el);
    }
    el.textContent = b.label;
    el.setAttribute('data-keywords', b.kw);
    try { el.setAttribute('data-sub', b.sub); el.dataset.sub = b.sub; } catch (eS) {}
  });
  // Reordena: label + sus 5 botones en el orden de BTNS, antes del siguiente sub-label
  try {
    var anchor = lab.nextSibling;
    BTNS.forEach(function (b) {
      var el = document.getElementById(b.id);
      if (el) box.insertBefore(el, anchor);
    });
    box.insertBefore(lab, document.getElementById(BTNS[0].id));
  } catch (eO) {}
  BTNS.forEach(function (b) {
    var el2 = document.getElementById(b.id);
    if (el2) el2.onclick = function () { openTab(b.tab); };
  });
}

function registerVisibility() {
  try {
    if (typeof ALL_BTNS !== 'undefined') {
      BTNS.forEach(function (b) { if (ALL_BTNS.indexOf(b.id) < 0) ALL_BTNS.push(b.id); });
    }
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') {
      BTNS.forEach(function (b) { BTN_HOME[b.id] = ['comunidad', 'red-comunitaria']; });
    }
  } catch (e) {}
  // Limpia restos de versiones anteriores (sección propia o sub-labels separados)
  try {
    if (typeof BTN_HOME !== 'undefined') {
      Object.keys(BTN_HOME).forEach(function (k) {
        if (BTN_HOME[k] && BTN_HOME[k][0] === 'redcomunitaria') delete BTN_HOME[k];
      });
      BTNS.forEach(function (b) { BTN_HOME[b.id] = ['comunidad', 'red-comunitaria']; });
    }
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      ['redcomunitaria|guia', 'redcomunitaria|meshtastic', 'redcomunitaria|radio', 'redcomunitaria|red',
       'comunidad|red-guia', 'comunidad|red-mesh', 'comunidad|red-diag', 'comunidad|red-radio'].forEach(function (k) {
        try { delete BTN_ORDER[k]; } catch (eD) {}
      });
      BTN_ORDER['comunidad|red-comunitaria'] = ['btnRedGuia', 'btnRedMeshtastic', 'btnRedDiagnostico', 'btnRedRadio', 'btnRedNodos'];
      // btnRedNodos ya no va en 🤝 Red Penco: quitarlo si quedó de la versión anterior
      try {
        var cr = BTN_ORDER['comunidad|red'];
        if (cr && cr.indexOf('btnRedNodos') >= 0) BTN_ORDER['comunidad|red'] = cr.filter(function (x) { return x !== 'btnRedNodos'; });
      } catch (eC) {}
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p] && p !== 'esencial' && p !== 'infantil') {
          BTNS.forEach(function (b) { PRESETS[p][b.id] = true; });
        }
      });
      if (PRESETS.esencial) BTNS.forEach(function (b) { PRESETS.esencial[b.id] = true; });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
}

function setup() {
  ensureSection();
  registerVisibility();
  buildDialogIfNeeded();
  renderAll();
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
