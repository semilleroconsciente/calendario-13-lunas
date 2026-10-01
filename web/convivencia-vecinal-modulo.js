/* ============================================================
   CONVIVENCIA VECINAL — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección: Comunidad, Emergencia y Sistema > 🏘️ Convivencia Vecinal
   Botones (sub "convivencia-vecinal"):
     btnConvivGuia, btnConvivFichas, btnConvivHablar,
     btnConvivBitacora, btnConvivLuna, btnConvivRecursos
   - Diálogo convivenciaDialog con 6 pestañas:
       1) 📖 Guía: método de escalera (hablar → carta → mediación → institucional)
       2) 🗂️ Fichas: ruidos, mascotas, linderos/árboles, basura,
          estacionamiento, agua/filtraciones
       3) 🗣️ Conversar: CNV, silla de la escucha, generador de acta
       4) 📓 Bitácora: incidentes, conversaciones y acuerdos (privada/local)
       5) 🌙 Ritual lunar para conversaciones difíciles
       6) 📞 Recursos: DIDECO, JJ.VV. Ley 19.418, mediación,
          condominios Ley 19.537 / 21.442
   - Todo local y privado por usuario: userData().convivencia
     { incidentes:[], acuerdos:[], hechos:{}, intencion:'' }
   - 100% offline. Orientación general, no asesoría legal:
     verifica norma vigente en DIDECO, JJVV y municipio.
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
    if (!u) return { incidentes: [], acuerdos: [], hechos: {}, intencion: '' };
    if (!u.convivencia) u.convivencia = { incidentes: [], acuerdos: [], hechos: {} };
    var r = u.convivencia;
    if (!Array.isArray(r.incidentes)) r.incidentes = [];
    if (!Array.isArray(r.acuerdos)) r.acuerdos = [];
    if (!r.hechos || Array.isArray(r.hechos)) r.hechos = {};
    if (typeof r.intencion !== 'string') r.intencion = '';
    return r;
  } catch (e) { return { incidentes: [], acuerdos: [], hechos: {}, intencion: '' }; }
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
var ESCALERA = [
  { n: '1 · Hablar en persona', ico: '🗣️', txt: '<b>Puerta a puerta, de día y en calma.</b> Preséntate, describe 1 hecho concreto (fecha/hora), di cómo te afecta y pide 1 cambio chico y verificable. Escucha sin interrumpir y cierra con fecha de revisión (ej: “¿lo revisamos en 7 días?”). Anota en Bitácora. <b>El 80% se resuelve aquí</b> si se llega temprano y sin acumular.', frase: 'Hola, soy [nombre] de [casa]. Ayer [hecho concreto, ej: música fuerte hasta las 2 am]. Me cuesta dormir y trabajo temprano. ¿Podríamos acordar bajar el volumen después de las 23:00? Lo revisamos en una semana. ¿Te parece?' },
  { n: '2 · Carta breve y amable', ico: '✉️', txt: '<b>Si hablar no bastó o no te abrieron la puerta.</b> 1 hoja: fecha, hecho, efecto, pedido concreto, plazo y tu contacto. Tono firme y cordial, sin amenazas ni insultos. Deja copia y foto. Guarda la carta en Bitácora: es tu prueba de buena fe.', frase: 'Penco, [fecha]. Vecina/o [casa]: le escribo por [hecho + fechas]. Esto me afecta en [efecto]. Le pido [pedido concreto, ej: encerrar al perro de 22 a 8 hrs]. Quedo atenta/o a conversar esta semana: [nombre + contacto]. Gracias.' },
  { n: '3 · Mediación comunitaria', ico: '🤝', txt: '<b>Con tercera persona neutral.</b> Pide mediación en DIDECO, tu JJ.VV. o mediación vecinal municipal: citan a ambas partes, levantan acta de acuerdo firmada y hacen seguimiento. No es juicio: nadie “gana”, se acuerda. Lleva tu bitácora (fechas, fotos, cartas).', frase: 'Vengo a pedir mediación por [tema] con [casa]. Ya hablé el [fecha] y envié carta el [fecha]. Quiero acordar [pedido] con acta y seguimiento. Traigo mis registros.' },
  { n: '4 · Vía institucional', ico: '🏛️', txt: '<b>Solo si hay daño, riesgo o se rompe lo acordado.</b> Según el caso: Juzgado de Policía Local (ruidos, basura, daños), Carabineros/plan cuadrante (flagrancia, amenazas), DOM/SECPLAN (linderos, construcción), administradora + comité (condominios), tribunales (daños mayores). Denuncia con RUT, fechas, fotos y acta de mediación. Pide folio siempre.', frase: 'Denuncio [hecho + fechas + lugar]. Adjunto fotos, carta del [fecha] y acta de mediación del [fecha]. Solicito fiscalización y folio de seguimiento.' }
];

var PRINCIPIOS = [
  { n: 'Hecho, no juicio', ico: '👁️', txt: '“Música hasta las 2 am” abre diálogo. “Eres un irresponsable” lo cierra. Describe lo observable: qué, cuándo, cuánto.' },
  { n: '1 tema por vez', ico: '🎯', txt: 'No cobres 6 meses en 1 conversa. Elige el tema más urgente, acuerda eso, y agenda el resto.' },
  { n: 'Pide en positivo', ico: '✅', txt: '“Bajar volumen desde las 23:00” se puede cumplir. “No seas ruidoso” no. Pide conducta, hora y plazo.' },
  { n: 'Todo anotado', ico: '📓', txt: 'Fecha + hecho + acuerdo + revisión. Sin bitácora no hay mediación ni denuncia que aguante.' },
  { n: 'Nunca escales de noche', ico: '🌙', txt: 'De noche no toques puertas con rabia ni llames a gritos. Anota, respira, duerme. Habla de día y con testigo si hay tensión.' },
  { n: 'Niños, mayores y animales primero', ico: '💛', txt: 'Si el conflicto afecta sueño infantil, salud de mayores o bienestar animal, dilo primero: mueve voluntades y prioriza mediación.' }
];

var FICHAS = [
  { id: 'ruidos', ico: '🔊', nombre: 'Ruidos',
    norma: 'Ordenanza municipal de ruidos + Juzgado de Policía Local. Horario sensible: 21:00–07:00. Decibeles y multas los fija cada ordenanza: pide el texto en OIRS/DIDECO.',
    pasos: ['Anota 7 días: fecha, hora inicio-término, tipo de ruido, cómo te afecta.', 'Habla de día: pide 1 cambio (ej: volumen bajo desde las 23:00, sin parlante al patio).', 'Si sigue: carta breve con tus 7 registros + plazo de 7 días.', 'Pide mediación (DIDECO/JJVV) con bitácora en mano.', 'Si hay daño a salud/descanso: denuncia al Juzgado de Policía Local con registros + testigos. En flagrancia nocturna grave: Carabineros/plan cuadrante.'],
    decir: 'Anoche la música estuvo fuerte de 23:30 a 2:00 y no pude dormir. ¿Pueden bajar el bajo después de las 23:00 entre semana? Lo revisamos el lunes.',
    nohacer: 'No cortes cables, no aporrees de madrugada, no grabes dentro de su casa. No amenaces por WhatsApp: todo escrito con rabia se vuelve en contra.',
    donde: 'JJ.VV. → DIDECO (O’Higgins 500) → Juzgado de Policía Local. Mide con app de sonómetro solo como referencia, no como prueba legal.' },
  { id: 'mascotas', ico: '🐕', nombre: 'Mascotas',
    norma: 'Ley 21.020 Tenencia Responsable: dueño responde por daños, ladridos persistentes, fecas y mordeduras. Ordenanza municipal + Veterinario Municipal. Maltrato: denuncia.',
    pasos: ['Registra: fechas, horas de ladrido/escape, fotos de fecas/daños, n° de chip si lo sabes.', 'Habla con empatía: casi siempre es manejo (encierro, paseo, esterilización), no maldad.', 'Ofrece dato útil: operativo esterilización, Veterinario Municipal (+56 9 4401 1613), canil/cierre.', 'Carta + mediación si persiste o hay daño (mordedura: constancia en CESFAM + denuncia).', 'Perro vagando con dueño conocido: Juzgado Policía Local. Perro abandonado: Veterinario Municipal/JJVV.'],
    decir: 'Tu perrito llora harto cuando quedan fuera, sobre todo de noche. ¿Podríamos ver cómo encerrarlo de 22 a 8 o turnar paseos? Te paso el dato del operativo.',
    nohacer: 'No envenenes, no golpees ni retengas al animal. No lo sueltes lejos “para que se pierda”. El responsable es el dueño, no el perro.',
    donde: 'Veterinario Municipal · DIDECO · JJ.VV. · Juzgado Policía Local (daños). Urgencia mordedura: CESFAM + Carabineros.' },
  { id: 'linderos', ico: '🌳', nombre: 'Linderos y árboles',
    norma: 'Código Civil (medianería, ramas/raíces, aguas) + DOM municipal (construcciones, cierres) + CONAF (tala nativo). No te tomes la justicia: podar/cortar sin acuerdo trae denuncia.',
    pasos: ['Aclara el hecho: ¿rama que cruza, raíz que levanta, cerco corrido, agua que cae a tu patio?', 'Busca escritura/plano y fotos con huincha y fecha. Mide: ¿cuánto cruza, desde cuándo?', 'Habla y propone poda compartida con fecha y costo 50/50 por escrito.', 'Si hay construcción en el límite: consulta DOM (41-2261xxx / OIRS) antes de pelear: quizá es irregular.', 'Mediación con fotos y plano. Daño o tala nativa: denuncia (JPL / CONAF según caso).'],
    decir: 'La rama del [árbol] cruza como 2 metros a mi patio desde el verano y tapa la canal. ¿La podamos juntos este mes a medias? Lo dejamos por escrito.',
    nohacer: 'No cortes el árbol ajeno por tu cuenta, no muevas el cerco de noche, no tapes la pasada de agua. Todo cambio de lindero sin DOM puede salir caro.',
    donde: 'DOM / SECPLAN (construcción y cierres) · DIDECO mediación · JPL (daños) · CONAF (nativo). Lleva plano + fotos fechadas.' },
  { id: 'basura', ico: '🗑️', nombre: 'Basura y aseo',
    norma: 'Ordenanza de aseo municipal: horarios de tolva/recolección, prohibición de microbasurales y quema. Multa el JPL. Denuncia con foto + patente si botan escombros.',
    pasos: ['Averigua el horario real de tu calle (tolva/recolección) en municipio/JJVV y compártelo.', 'Habla: muchas veces es arriendo rotativo que no sabe el horario. Pega el calendario en el poste.', 'Carta al dueño (no solo al arrendatario) si se repite: el dueño responde.', 'Pide mediación + oficio a Aseo/Ornato para limpieza y señalética.', 'Microbasural o quema: denuncia a Seguridad Penco (*4157) y JPL con fotos fechadas.'],
    decir: 'La tolva pasa [días/hora] y la basura queda desde el día antes y la rompen los perros. ¿La sacamos solo ese día en bolsa cerrada? Pego el horario para todos.',
    nohacer: 'No quemes basura, no devuelvas la bolsa a su puerta, no фотографиes a niños para funar. Quema = multa + riesgo de incendio.',
    donde: 'Aseo municipal / OIRS · JJ.VV. · Seguridad Penco *4157 · JPL. Foto con fecha + dirección exacta.' },
  { id: 'estacionamiento', ico: '🚗', nombre: 'Estacionamiento',
    norma: 'Ley de Tránsito + ordenanza: no bloquear accesos, veredas ni grifos. En condominios manda el reglamento interno (Ley 19.537 / 21.442). Vía pública no tiene dueño.',
    pasos: ['Verifica: ¿bloquea tu salida, vereda, grifo o es solo “mi lugar” en calle pública?', 'Habla una vez con dato: “me bloqueaste la salida el [fecha] a las [hora]”. Pide n° para avisos.', 'En edificio/condominio: reclama por libro/administración con foto + hora, no con rayados.', 'Mediación o Tránsito municipal para señalización (disco, línea amarilla).', 'Bloqueo o abandono: Carabineros/seguridad + JPL. Nunca pinches, rayes ni remolques por tu cuenta.'],
    decir: 'Ayer no pude salir a las 8 porque el auto tapaba mi portón. ¿Me dejas tu número para avisarte y acordamos no usar ese tramo?',
    nohacer: 'No rayes, pinches ni empujes autos. No pongas conos/cadenas en vía pública. No pelees con el parquímetro humano: anota patente y hora.',
    donde: 'Dirección de Tránsito · Administración del condominio · Carabineros (bloqueo) · JPL. En condominio: reglamento interno primero.' },
  { id: 'agua', ico: '💧', nombre: 'Agua y filtraciones',
    norma: 'Código Civil (servidumbres, daños por aguas) + DOM/Sanitario (uniones, fosas, aguas servidas) + empresa sanitaria (matriz). Filtración entre deptos: reglamento de copropiedad.',
    pasos: ['Corta el daño: cierra llave, foto/video con fecha, protege lo eléctrico.', 'Avisa de inmediato al vecino de arriba/al lado por escrito (WhatsApp vale como aviso).', 'Si es matriz o alcantarillado: llama a la sanitaria + Seguridad Penco; pide n° de reclamo.', 'Casa pareada/depto: pide visita DOM/administración para informe técnico.', 'Mediación con informe + presupuestos. Daño no reparado: JPL/tribunales con informe y boletas.'],
    decir: 'Desde el [fecha] filtra agua del baño hacia mi cocina (video [fecha]). ¿Lo vemos mañana con un gasfíter y compartimos el informe? Cerré mi llave por precaución.',
    nohacer: 'No rompas el muro ajeno, no cortes su agua, no dejes correr la filtración “para que aprenda”. La humedad se come la casa de ambos.',
    donde: 'Empresa sanitaria (matriz) · DOM · Administración condominio · DIDECO mediación · JPL. Guarda boletas: son tu indemnización.' }
];

var CNV_PASOS = [
  { n: '1 · Observo (cámara)', ico: '📷', txt: 'Hecho sin adjetivo: “música con bajo de 23:30 a 2:00” en vez de “siempre metes bulla”. Si no hay fecha y hora, es juicio.' },
  { n: '2 · Siento (cuerpo)', ico: '💛', txt: '“Me siento cansada / preocupada / con rabia” en vez de “me tienes chata”. Habla de ti: nadie puede discutir tu cansancio.' },
  { n: '3 · Necesito (valor)', ico: '🌱', txt: '“Necesito dormir porque trabajo a las 7” / “necesito salir a las 8”. La necesidad es legítima y compartible.' },
  { n: '4 · Pido (concreto)', ico: '🤲', txt: '“¿Pueden bajar el bajo después de las 23:00 entre semana y lo revisamos el lunes?”. 1 pedido, medible, con fecha.' }
];

var CNV_ERRORES = '❌ “Siempre / nunca” → ✅ “ayer / esta semana”. ❌ “Tienes que…” → ✅ “¿Podrías…?”. ❌ 5 temas juntos → ✅ 1 tema. ❌ gritar de noche → ✅ hablar de día. ❌ funar antes de hablar → ✅ bitácora privada primero.';

var SILLA = [
  'Pon 2 sillas frente a frente. Quien habla se sienta en la “silla caliente”; la otra solo escucha (sin interrumpir, sin cara). Temporizador 3 min por turno.',
  'Turno A: cuenta hecho + sentir + necesitar + pedir. Turno B repite con sus palabras: “lo que escuché es…”. A confirma o corrige.',
  'Cambio de silla. Ahora B habla y A repite. No se debate: primero entender, después resolver.',
  'Recién al final: ¿qué sí podemos acordar esta semana? 1–2 acuerdos chicos por escrito + fecha de revisión. Cierra con apretón/mate: el vínculo sigue.'
];

var RITUAL_FASES = [
  { n: '🌑 Luna nueva · Preparar', txt: 'No hables todavía. Escribe: hecho, sentir, necesitar, pedir + lo que NO dirás. Respira 4-4-6 ×4. Quema o guarda el papel de la rabia; lleva solo la hoja del pedido.' },
  { n: '🌒 Creciente · Hablar', txt: 'Mejor ventana para iniciar: energía de apertura. Habla de día, 15–20 min máx, con 1 testigo tranquilo si hay historia. Lleva tu frase CNV escrita.' },
  { n: '🌕 Llena · Escuchar y sellar', txt: 'Si ya hablaron: úsala para escuchar de verdad y firmar el acta. A la luz piena nada se esconde: lean el acuerdo en voz alta y brinden.' },
  { n: '🌘 Menguante · Soltar y cerrar', txt: 'Revisa a los 7 días: ¿se cumplió? Si sí, agradece y cierra (mensaje corto). Si no, sube 1 peldaño de la escalera sin rencor. Suelta el resto: no rumies.' }
];

var RECURSOS = [
  { n: 'DIDECO Penco — Área Social y mediación', ico: '🏛️', dato: 'O’Higgins 500 · 41-2261432', nota: 'Puerta de entrada: FIBE, ayudas, derivación a mediación vecinal y convivencia. Pide hora con tu bitácora en mano.' },
  { n: 'JJ.VV. — Junta de Vecinos (Ley 19.418)', ico: '🤝', dato: 'Tu sede + directiva vigente', nota: 'Pueden mediar, certificar domicilio y oficiar al municipio (aseo, tránsito, seguridad). Participa: el acuerdo con firma JJVV pesa. Ley 19.418 regula su constitución y funcionamiento.' },
  { n: 'Mediación comunitaria municipal', ico: '🕊️', dato: 'DIDECO / OIRS oirs@penco.cl · 41-2261430', nota: 'Sesión con neutral + acta firmada + seguimiento. Gratis. Lleva: fechas, fotos, carta enviada y 1 pedido concreto. Si se rompe el acta, es prueba en JPL.' },
  { n: 'Condominios — Ley 19.537 (hoy Ley 21.442)', ico: '🏢', dato: 'Administración + Comité', nota: 'Ruidos, filtraciones y estacionamientos se rigen primero por el reglamento interno. Reclama por escrito a administración; el comité puede multar según reglamento. La Ley 21.442 (2022) actualizó la copropiedad: verifica el texto vigente.' },
  { n: 'Juzgado de Policía Local', ico: '⚖️', dato: 'Municipalidad de Penco', nota: 'Ruidos, basura, daños, tránsito vecinal. Denuncia con cédula + pruebas (bitácora, fotos, acta). Pide folio y guarda todo.' },
  { n: 'Carabineros / Seguridad Penco', ico: '🚓', dato: '*4157 · 133 emergencias · 149 familia', nota: 'Flagrancia, amenazas, bloqueo, violencia. No expongas tu cuerpo: llama. 149 orienta en violencia intrafamiliar; 1455 violencia contra la mujer.' },
  { n: 'Salud: CESFAM + Salud Responde', ico: '🏥', dato: 'Penco 41-2723960 · Lirquén 41-2688321 · 600 360 7777', nota: 'Si el conflicto te quita el sueño o te angustia, pide hora. Dormir mal 2 semanas seguidas es motivo de consulta, no de aguante.' }
];

/* ---------------- DIÁLOGO ---------------- */
var TAB_IDS = ['Guia', 'Fichas', 'Hablar', 'Bitacora', 'Luna', 'Recursos'];
var fichaSel = 'ruidos';

function buildDialog() {
  var old = $('convivenciaDialog');
  if (old) old.remove();
  var d = document.createElement('dialog');
  d.id = 'convivenciaDialog';

  var escHTML = ESCALERA.map(function (c, i) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + c.txt + '</p>' +
      '<div class="dlg-actions" style="justify-content:flex-start;margin-top:6px"><button type="button" class="btn" data-esc-copy="' + i + '" style="width:auto;font-size:11px">📋 Copiar frase</button></div></div>';
  }).join('');
  var prinHTML = PRINCIPIOS.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + esc(c.txt) + '</p></div>';
  }).join('');
  var cnvHTML = CNV_PASOS.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + esc(c.txt) + '</p></div>';
  }).join('');
  var sillaHTML = SILLA.map(function (t, i) {
    return '<div class="si-card"><h4>Paso ' + (i + 1) + '</h4><p>' + esc(t) + '</p></div>';
  }).join('');
  var ritualHTML = RITUAL_FASES.map(function (c) {
    return '<div class="si-card"><h4>' + esc(c.n) + '</h4><p>' + esc(c.txt) + '</p></div>';
  }).join('');
  var recHTML = RECURSOS.map(function (c) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span><b style="font-size:12px">' + c.ico + ' ' + esc(c.n) + '</b><br><span style="font-size:11px"><b>' + esc(c.dato) + '</b></span><br><span class="muted" style="font-size:11px">' + esc(c.nota) + '</span></span>' +
      '<button type="button" class="btn" data-rec-copy="' + esc(c.n + ' · ' + c.dato) + '" style="width:auto" title="Copiar">📋</button></div>';
  }).join('');
  var fichaBtns = FICHAS.map(function (f) {
    return '<button type="button" class="btn" data-ficha="' + f.id + '" style="width:auto"> ' + f.ico + ' ' + esc(f.nombre) + '</button>';
  }).join('');

  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
      '<h3 style="margin:0;color:var(--accent)">🏘️ Convivencia Vecinal — Penco</h3>' +
      '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Vivir pegados sin pelearse es un oficio. Escalera, fichas por tema, palabras para hablar difícil y bitácora privada. Todo <b>offline</b> y <b>local</b>. Orientación general, no asesoría legal.</p>' +
    '<div id="convivHoyBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div class="timer-tabs" style="margin:10px 0;flex-wrap:wrap">' +
      '<button type="button" id="tabConvivGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
      '<button type="button" id="tabConvivFichas" class="btn" style="width:auto">🗂️ Fichas</button>' +
      '<button type="button" id="tabConvivHablar" class="btn" style="width:auto">🗣️ Conversar</button>' +
      '<button type="button" id="tabConvivBitacora" class="btn" style="width:auto">📓 Bitácora</button>' +
      '<button type="button" id="tabConvivLuna" class="btn" style="width:auto">🌙 Ritual</button>' +
      '<button type="button" id="tabConvivRecursos" class="btn" style="width:auto">📞 Recursos</button>' +
    '</div>' +

    '<div id="convivPanelGuia">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🪜 La escalera: nunca partas por el peldaño 4</h4><p class="muted" style="font-size:11px">Hablar → carta → mediación → institucional. Cada peldaño deja registro para el siguiente. Saltarse pasos quiebra el barrio y debilita tu caso.</p></div>' +
      '<div class="discipline-grid" style="margin-top:8px">' + escHTML + '</div>' +
      '<h4 style="margin:10px 0 6px;color:var(--gold)">💛 Principios que evitan el 90% de los juicios</h4>' +
      '<div class="discipline-grid">' + prinHTML + '</div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>✅ Mi compromiso vecinal</h4>' +
        '<p class="muted" style="font-size:11px">Se guarda por usuario en este dispositivo.</p>' +
        '<div id="convivGuiaChecks">' +
          '<label class="check-row"><input type="checkbox" data-guia="diario"> Llevo bitácora 7 días antes de reclamar</label>' +
          '<label class="check-row"><input type="checkbox" data-guia="dia"> Hablo de día y en calma (no de noche ni con rabia)</label>' +
          '<label class="check-row"><input type="checkbox" data-guia="uno"> 1 tema por vez + 1 pedido concreto</label>' +
          '<label class="check-row"><input type="checkbox" data-guia="carta"> Si no resulta, envío carta breve y guardo copia</label>' +
          '<label class="check-row"><input type="checkbox" data-guia="mediacion"> Pido mediación antes de denunciar</label>' +
        '</div><div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><span id="convivGuiaStats" class="muted" style="font-size:11px"></span></div></div>' +
    '</div>' +

    '<div id="convivPanelFichas" class="hidden">' +
      '<div class="menstrual-card"><h4>🗂️ Elige tu tema</h4><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' + fichaBtns + '</div></div>' +
      '<div id="convivFichaBox" style="margin-top:10px"></div>' +
    '</div>' +

    '<div id="convivPanelHablar" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🗣️ CNV en 4 frases (observo · siento · necesito · pido)</h4><p class="muted" style="font-size:11px">Comunicación No Violenta adaptada a pasillo y patio. Sin jerga: hechos, cuerpo, necesidad y pedido chico.</p></div>' +
      '<div class="discipline-grid" style="margin-top:8px">' + cnvHTML + '</div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>✍️ Arma tu frase (y cópiala)</h4>' +
        '<div class="conv-row"><label>Vi / escuché <input type="text" id="cnvHecho" placeholder="ej: música con bajo ayer de 23:30 a 2:00" maxlength="90"></label></div>' +
        '<div class="conv-row"><label>Me siento <input type="text" id="cnvSiento" placeholder="ej: agotada, me cuesta dormir" maxlength="60"></label>' +
        '<label>Necesito <input type="text" id="cnvNecesito" placeholder="ej: dormir porque entro a las 7" maxlength="60"></label></div>' +
        '<div class="conv-row"><label>¿Podrías? <input type="text" id="cnvPide" placeholder="ej: bajar el bajo desde las 23:00 y lo revisamos el lunes" maxlength="90"></label></div>' +
        '<div id="cnvPreview" class="chip" style="display:block;white-space:normal;line-height:1.5;margin-top:6px">Escribe arriba y ve tu frase aquí…</div>' +
        '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="cnvCopy" class="btn" style="width:auto">📋 Copiar frase</button><button type="button" id="cnvToBitacora" class="btn" style="width:auto">📓 Llevar a bitácora</button></div>' +
        '<p class="muted" style="font-size:11px;margin-top:6px">' + esc(CNV_ERRORES) + '</p></div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>🪑 La silla de la escucha (12 min, sin pelear)</h4><div class="discipline-grid" style="margin-top:6px">' + sillaHTML + '</div></div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>📝 Generador de acta de acuerdo</h4><p class="muted" style="font-size:11px">Acta simple entre vecinos (no es escritura pública, pero ordena y sirve en mediación). Completa, previsualiza, guarda en bitácora y comparte.</p>' +
        '<div class="conv-row"><label>Lugar <input type="text" id="actaLugar" placeholder="ej: Penco, Cerro Verde" maxlength="40"></label><label>Fecha <input type="date" id="actaFecha"></label></div>' +
        '<div class="conv-row"><label>Parte A <input type="text" id="actaA" placeholder="ej: Ana — casa 12" maxlength="40"></label><label>Parte B <input type="text" id="actaB" placeholder="ej: Pedro — casa 14" maxlength="40"></label></div>' +
        '<div class="conv-row"><label>Tema <input type="text" id="actaTema" placeholder="ej: ruidos nocturnos" maxlength="60"></label><label>Revisión <input type="date" id="actaRev"></label></div>' +
        '<label>Acuerdos (1 por línea) <input type="text" id="actaLista" placeholder="ej: bajar volumen desde 23:00 entre semana | avisar por WhatsApp si hay fiesta" maxlength="200"></label>' +
        '<div id="actaPreview" class="chip" style="display:block;white-space:normal;line-height:1.55;margin-top:6px;font-size:11px">El acta aparecerá aquí…</div>' +
        '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="actaSave" class="btn btn-accent" style="width:auto">💾 Guardar acuerdo</button><button type="button" id="actaShare" class="btn" style="width:auto">📤 Compartir</button></div></div>' +
    '</div>' +

    '<div id="convivPanelBitacora" class="hidden">' +
      '<div class="menstrual-card"><h4>📓 Bitácora privada — incidentes, conversas y acuerdos</h4><p class="muted" style="font-size:11px">Solo en este dispositivo. Sin bitácora no hay mediación que funcione: fecha + hecho + foto + acuerdo.</p>' +
        '<div class="conv-row"><label>Fecha <input type="date" id="convFecha"></label><label>Tema <select id="convTipo"><option value="ruidos">🔊 Ruidos</option><option value="mascotas">🐕 Mascotas</option><option value="linderos">🌳 Linderos/árboles</option><option value="basura">🗑️ Basura</option><option value="estacionamiento">🚗 Estacionamiento</option><option value="agua">💧 Agua/filtración</option><option value="otro">📌 Otro</option></select></label></div>' +
        '<div class="conv-row"><label>¿Con quién? <input type="text" id="convQuien" placeholder="ej: casa 14, depto 302" maxlength="40"></label><label>Peldaño <select id="convEscalon"><option value="hablar">🗣️ Hablé</option><option value="carta">✉️ Carta</option><option value="mediacion">🤝 Mediación</option><option value="institucional">🏛️ Institucional</option></select></label></div>' +
        '<div class="conv-row"><label>Estado <select id="convEstado"><option value="abierto">🔴 Abierto</option><option value="hablado">🟡 Hablado</option><option value="acuerdo">🟢 Acuerdo</option><option value="cerrado">✅ Cerrado</option></select></label></div>' +
        '<label>¿Qué pasó? (hecho + hora + efecto) <input type="text" id="convRelato" placeholder="ej: 12/9 música 23:30–2:00, no dormí, entro a las 7" maxlength="160"></label>' +
        '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="convAdd" class="btn btn-accent" style="width:auto">+ Guardar en bitácora</button><button type="button" id="convCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>🧾 Incidentes <span id="convIncCount" class="muted" style="font-size:11px"></span></h4><div id="convIncLog" class="habits-list" style="max-height:240px"></div></div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>🤝 Acuerdos <span id="convAcuCount" class="muted" style="font-size:11px"></span></h4><div id="convAcuLog" class="habits-list" style="max-height:240px"></div>' +
        '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span style="display:flex;gap:8px"><button type="button" id="convShare" class="btn" style="width:auto">📤 Compartir bitácora</button><button type="button" id="convClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +
    '</div>' +

    '<div id="convivPanelLuna" class="hidden">' +
      '<div id="convivLunaBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
      '<div class="discipline-grid" style="margin-top:8px">' + ritualHTML + '</div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>🌙 Mi ritual de 10 min antes de hablar</h4>' +
        '<p class="muted" style="font-size:11px;line-height:1.6">1) Apaga el celu 10 min. 2) Respira 4-4-6 ×4. 3) Lee tu frase CNV en voz alta. 4) Pregúntate: “¿qué sí puedo ceder?”. 5) Define tu mínimo (ej: volumen bajo entre semana) y tu máximo (ej: cortarlo todo). 6) Anda de día, con testigo si hay tensión.</p>' +
        '<label>Mi intención para esta conversa <input type="text" id="convIntencion" placeholder="ej: dormir tranquila sin pelear con mi vecino" maxlength="120"></label>' +
        '<div id="convivRitualChecks" style="display:flex;flex-direction:column;gap:6px;margin-top:8px">' +
          '<label class="check-row"><input type="checkbox" data-ritual="respire"> Respiré 4-4-6 antes de hablar</label>' +
          '<label class="check-row"><input type="checkbox" data-ritual="frase"> Llevé mi frase escrita (no improvisé con rabia)</label>' +
          '<label class="check-row"><input type="checkbox" data-ritual="dia"> Hablé de día y con calma</label>' +
          '<label class="check-row"><input type="checkbox" data-ritual="acta"> Dejé acuerdo escrito + fecha de revisión</label>' +
        '</div><div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><span id="convivRitualStats" class="muted" style="font-size:11px"></span></div></div>' +
    '</div>' +

    '<div id="convivPanelRecursos" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📞 A dónde ir en Penco (en orden)</h4><p class="muted" style="font-size:11px">1) Habla → 2) JJ.VV./DIDECO mediación → 3) institucional. Lleva siempre: cédula, bitácora con fechas, fotos y carta/acta. Pide folio de todo.</p></div>' +
      '<div class="menstrual-card" style="margin-top:10px">' + recHTML + '</div>' +
      '<div class="menstrual-card" style="margin-top:10px"><p class="muted" style="font-size:11px">📚 Leyes para leer el encabezado: <b>Ley 19.418</b> (juntas de vecinos y organizaciones comunitarias) y <b>Ley 19.537 de Copropiedad</b> actualizada por la <b>Ley 21.442</b> (condominios). Pide el texto vigente en DIDECO/OIRS o chileatiende.cl. Esta app orienta, no reemplaza asesoría legal.</p></div>' +
    '</div>' +

    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}

/* ---------------- PESTAÑAS ---------------- */
function switchTab(t) {
  TAB_IDS.forEach(function (k) {
    var p = $('convivPanel' + k), b = $('tabConviv' + k);
    if (p) p.classList.toggle('hidden', k !== t);
    if (b) b.classList.toggle('btn-accent', k === t);
  });
}
function buildIfNeeded() { if (!$('convivenciaDialog')) { buildDialog(); wireDialog(); } }
function openTab(t) { buildIfNeeded(); paintHoy(); renderFicha(); renderAll(); switchTab(t); openDlg('convivenciaDialog'); }

function paintHoy() {
  var b = $('convivHoyBox'); if (!b) return;
  var l = lunaDeHoy();
  var txt = l ? ('Hoy · Luna ' + l.luna + ' · día ' + l.dia) : ('Hoy · ' + todayKey());
  var rec = !l ? 'Anota parejo: la convivencia se cuida por luna.'
    : l.luna <= 3 ? 'Pukem: habla bajo techo, con mate. Revisa filtraciones y humedad antes de reclamar.'
    : l.luna <= 6 ? 'Pewü: mejor luna para podas acordadas y limpieza compartida. Propón minga.'
    : l.luna <= 9 ? 'Walüng: fiestas y ruidos suben. Acuerda horarios de verano antes de diciembre.'
    : 'Rimü: cierra acuerdos antes del viento sur. Agradece lo cumplido y suelta el resto.';
  b.innerHTML = '<h4>🌙 ' + esc(txt) + '</h4><p class="muted" style="font-size:12px">' + esc(rec) + '</p>';
  var lb = $('convivLunaBox');
  if (lb) {
    var fase = !l ? 'Sin luna ubicada: prepara tu frase igual (hecho + sentir + necesitar + pedir).'
      : l.dia <= 7 ? '🌑→🌒 Luna nueva/creciente: prepara y habla esta semana. Ideal para iniciar.'
      : l.dia <= 14 ? '🌒→🌕 Creciente a llena: habla ahora si lo venías pateando. Lleva testigo si hay tensión.'
      : l.dia <= 21 ? '🌕 Llena: escucha y sella. Lee el acta en voz alta y firma.'
      : '🌘 Menguante: revisa y cierra. ¿Se cumplió? Agradece o sube 1 peldaño sin rencor.';
    lb.innerHTML = '<h4>🌙 Ritual según tu luna de hoy</h4><p style="font-size:12px">' + esc(fase) + '</p><p class="muted" style="font-size:11px">Regla de oro: de noche no toques puertas con rabia. Anota, respira, duerme. Habla de día.</p>';
  }
}

/* ---------------- FICHAS ---------------- */
function fichaById(id) {
  for (var i = 0; i < FICHAS.length; i++) if (FICHAS[i].id === id) return FICHAS[i];
  return FICHAS[0];
}
function renderFicha() {
  var box = $('convivFichaBox'); if (!box) return;
  var f = fichaById(fichaSel);
  document.querySelectorAll('[data-ficha]').forEach(function (b) {
    b.classList.toggle('btn-accent', b.getAttribute('data-ficha') === fichaSel);
  });
  box.innerHTML =
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>' + f.ico + ' ' + esc(f.nombre) + '</h4>' +
    '<p class="muted" style="font-size:11px"><b>Norma (orientación):</b> ' + esc(f.norma) + '</p></div>' +
    '<div class="si-card" style="margin-top:8px"><h4>🪜 Qué hacer, en orden</h4><ol style="font-size:12px;line-height:1.6;margin:4px 0 0 18px">' +
    f.pasos.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol></div>' +
    '<div class="si-card"><h4>💬 Qué decir (cópiala y adaptala)</h4><p style="font-size:12px">“' + esc(f.decir) + '”</p>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="fichaCopyFrase" class="btn" style="width:auto;font-size:11px">📋 Copiar frase</button><button type="button" id="fichaToBitacora" class="btn" style="width:auto;font-size:11px">📓 Anotar este tema</button></div></div>' +
    '<div class="si-card"><h4>🚫 Lo que NO hay que hacer</h4><p class="muted" style="font-size:12px">' + esc(f.nohacer) + '</p>' +
    '<p class="muted" style="font-size:11px">📍 <b>Dónde ir:</b> ' + esc(f.donde) + '</p></div>';
  var c1 = $('fichaCopyFrase');
  if (c1) c1.onclick = async function () { await share(f.ico + ' Frase ' + f.nombre, f.decir); };
  var c2 = $('fichaToBitacora');
  if (c2) c2.onclick = function () {
    try { $('convTipo').value = f.id; } catch (e) {}
    try { $('convRelato').value = ''; $('convRelato').focus(); } catch (e2) {}
    switchTab('Bitacora');
  };
}

/* ---------------- CHECKS ---------------- */
function paintStats() {
  try {
    var s = store();
    var g = ['diario', 'dia', 'uno', 'carta', 'mediacion'].filter(function (k) { return s.hechos['convivGuiaChecks:' + k]; }).length;
    var gs = $('convivGuiaStats'); if (gs) gs.textContent = g + ' / 5 · ' + (g === 5 ? '🏘️ Vecina/o ejemplar' : g >= 3 ? '🌿 Buen camino' : '🌱 Parte por bitácora + hablar de día');
    var rk = ['respire', 'frase', 'dia', 'acta'].filter(function (k) { return s.hechos['convivRitualChecks:' + k]; }).length;
    var rs = $('convivRitualStats'); if (rs) rs.textContent = rk + ' / 4 · ' + (rk === 4 ? '🌙 Conversa lista' : 'prepara tu frase antes de tocar la puerta');
  } catch (e) {}
}

/* ---------------- BITÁCORA ---------------- */
var editingConv = null;
var TIPO_N = { ruidos: '🔊 Ruidos', mascotas: '🐕 Mascotas', linderos: '🌳 Linderos', basura: '🗑️ Basura', estacionamiento: '🚗 Estacionamiento', agua: '💧 Agua', otro: '📌 Otro' };
var ESC_N = { hablar: '🗣️ Hablé', carta: '✉️ Carta', mediacion: '🤝 Mediación', institucional: '🏛️ Institucional' };
var EST_N = { abierto: '🔴 Abierto', hablado: '🟡 Hablado', acuerdo: '🟢 Acuerdo', cerrado: '✅ Cerrado' };

function renderIncidentes() {
  var box = $('convIncLog'); if (!box) return;
  var s = store();
  var data = (s.incidentes || []).slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  var ct = $('convIncCount');
  if (ct) ct.textContent = '· ' + data.length;
  if (!data.length) { box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin registros. Guarda el primero arriba: fecha + hecho + peldaño.</p>'; return; }
  box.innerHTML = data.map(function (r) {
    return '<div class="hora-item"><span style="font-size:12px"><b>' + esc(TIPO_N[r.tipo] || r.tipo || '') + '</b> · ' + esc(r.fecha || '') + ' ' + esc(EST_N[r.estado] || '') +
      '<br><span class="muted" style="font-size:10px">' + esc(ESC_N[r.escalon] || '') + (r.quien ? ' · ' + esc(r.quien) : '') + (r.relato ? ' · ' + esc(r.relato) : '') + '</span></span>' +
      '<span style="display:flex;gap:4px"><button type="button" class="btn btn-icon conv-edit" data-k="' + esc(r.id) + '" title="Editar">✎</button>' +
      '<button type="button" class="btn btn-icon conv-del" data-k="' + esc(r.id) + '" title="Borrar">✕</button></span></div>';
  }).join('');
  box.querySelectorAll('.conv-del').forEach(function (x) {
    x.onclick = function () {
      if (!confirm('¿Borrar este registro?')) return;
      var st = store();
      st.incidentes = (st.incidentes || []).filter(function (r) { return r.id !== x.dataset.k; });
      save(); renderIncidentes();
    };
  });
  box.querySelectorAll('.conv-edit').forEach(function (x) {
    x.onclick = function () {
      var st = store();
      var r = (st.incidentes || []).find(function (n) { return n.id === x.dataset.k; });
      if (!r) return;
      editingConv = r.id;
      try {
        $('convFecha').value = r.fecha || todayKey();
        $('convTipo').value = r.tipo || 'ruidos';
        $('convQuien').value = r.quien || '';
        $('convEscalon').value = r.escalon || 'hablar';
        $('convEstado').value = r.estado || 'abierto';
        $('convRelato').value = r.relato || '';
        $('convCancel').classList.remove('hidden');
        $('convRelato').focus();
      } catch (e) {}
    };
  });
}

function renderAcuerdos() {
  var box = $('convAcuLog'); if (!box) return;
  var s = store();
  var data = (s.acuerdos || []).slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  var ct = $('convAcuCount');
  if (ct) ct.textContent = '· ' + data.length;
  if (!data.length) { box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin acuerdos. Créalo en 🗣️ Conversar → acta, o se guardan aquí.</p>'; return; }
  box.innerHTML = data.map(function (r) {
    return '<div class="hora-item"><span style="font-size:12px"><b>📝 ' + esc(r.tema || 'Acuerdo') + '</b> · ' + esc(r.fecha || '') + (r.cumplido ? ' ✅' : '') +
      '<br><span class="muted" style="font-size:10px">' + esc(r.partes || '') + (r.revision ? ' · rev: ' + esc(r.revision) : '') + (r.texto ? '<br>' + esc(String(r.texto).slice(0, 140)) : '') + '</span></span>' +
      '<span style="display:flex;gap:4px"><button type="button" class="btn btn-icon acu-ok" data-k="' + esc(r.id) + '" title="Marcar cumplido">✓</button>' +
      '<button type="button" class="btn btn-icon acu-del" data-k="' + esc(r.id) + '" title="Borrar">✕</button></span></div>';
  }).join('');
  box.querySelectorAll('.acu-del').forEach(function (x) {
    x.onclick = function () {
      if (!confirm('¿Borrar este acuerdo?')) return;
      var st = store();
      st.acuerdos = (st.acuerdos || []).filter(function (r) { return r.id !== x.dataset.k; });
      save(); renderAcuerdos();
    };
  });
  box.querySelectorAll('.acu-ok').forEach(function (x) {
    x.onclick = function () {
      var st = store();
      var r = (st.acuerdos || []).find(function (n) { return n.id === x.dataset.k; });
      if (r) r.cumplido = !r.cumplido;
      save(r && r.cumplido ? 'Acuerdo cumplido ✅' : 'Reabierto');
      renderAcuerdos();
    };
  });
}

function renderAll() { paintHoy(); paintStats(); renderIncidentes(); renderAcuerdos(); paintCNV(); paintActa(); }

/* ---------------- CNV + ACTA ---------------- */
function cnvTexto() {
  var h = clean((($('cnvHecho') || {}).value || '').trim(), 90);
  var s = clean((($('cnvSiento') || {}).value || '').trim(), 60);
  var n = clean((($('cnvNecesito') || {}).value || '').trim(), 60);
  var p = clean((($('cnvPide') || {}).value || '').trim(), 90);
  if (!h && !s && !n && !p) return '';
  return 'Hola, soy [tu nombre] de [tu casa]. ' +
    (h ? 'Vi/escuché que ' + h + '. ' : '') +
    (s ? 'Me siento ' + s + '. ' : '') +
    (n ? 'Necesito ' + n + '. ' : '') +
    (p ? '¿Podrías ' + p + '?' : '');
}
function paintCNV() {
  var pv = $('cnvPreview'); if (!pv) return;
  var t = cnvTexto();
  pv.textContent = t || 'Escribe arriba y ve tu frase aquí…';
}
function actaTexto() {
  var lug = clean((($('actaLugar') || {}).value || '').trim(), 40) || 'Penco';
  var fec = (($('actaFecha') || {}).value || todayKey());
  var a = clean((($('actaA') || {}).value || '').trim(), 40) || 'Parte A';
  var b = clean((($('actaB') || {}).value || '').trim(), 40) || 'Parte B';
  var tema = clean((($('actaTema') || {}).value || '').trim(), 60) || 'convivencia vecinal';
  var rev = (($('actaRev') || {}).value || '');
  var lista = clean((($('actaLista') || {}).value || '').trim(), 200);
  var items = lista ? lista.split(/[|\n;]+/).map(function (x) { return x.trim(); }).filter(Boolean) : [];
  var t = 'ACTA DE ACUERDO VECINAL\n' + lug + ' · ' + fec + '\nEntre ' + a + ' y ' + b + '\nTema: ' + tema + '\n\nAcordamos:\n' +
    (items.length ? items.map(function (x, i) { return (i + 1) + ') ' + x; }).join('\n') : '1) (escribe 1-2 acuerdos chicos y medibles)') +
    (rev ? '\n\nRevisamos el: ' + rev : '\n\nRevisamos en 7 días') +
    '\n\nFirma A: __________   Firma B: __________\n(Acta simple entre vecinos. Si se rompe, llevar a mediación DIDECO/JJVV.)';
  return { texto: t, tema: tema, partes: a + ' + ' + b, rev: rev, fec: fec };
}
function paintActa() {
  var pv = $('actaPreview'); if (!pv) return;
  try { pv.textContent = actaTexto().texto; } catch (e) {}
}

/* ---------------- WIRE ---------------- */
function wireChecks(sel, attr) {
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

function wireDialog() {
  TAB_IDS.forEach(function (t) {
    var b = $('tabConviv' + t);
    if (b) b.onclick = function () { switchTab(t); };
  });
  document.querySelectorAll('[data-ficha]').forEach(function (b) {
    b.onclick = function () { fichaSel = b.getAttribute('data-ficha'); renderFicha(); };
  });
  document.querySelectorAll('[data-esc-copy]').forEach(function (b) {
    b.onclick = async function () {
      var c = ESCALERA[parseInt(b.getAttribute('data-esc-copy'), 10)];
      if (c) await share('Peldaño: ' + c.n, c.frase);
    };
  });
  document.querySelectorAll('[data-rec-copy]').forEach(function (b) {
    b.onclick = async function () {
      var t = b.getAttribute('data-rec-copy') || '';
      try {
        if (navigator.clipboard) { await navigator.clipboard.writeText(t); save('Copiado ✓'); }
        else await share('Recurso', t);
      } catch (e) {}
    };
  });
  wireChecks('convivGuiaChecks', 'data-guia');
  wireChecks('convivRitualChecks', 'data-ritual');
  paintStats();

  ['cnvHecho', 'cnvSiento', 'cnvNecesito', 'cnvPide'].forEach(function (id) {
    var x = $(id);
    if (x) x.addEventListener('input', paintCNV);
  });
  var cc = $('cnvCopy');
  if (cc) cc.onclick = async function () {
    var t = cnvTexto();
    if (!t) return alert('Escribe tu hecho primero');
    await share('Mi frase para conversar', t);
  };
  var cb = $('cnvToBitacora');
  if (cb) cb.onclick = function () {
    var t = cnvTexto();
    if (!t) return alert('Escribe tu hecho primero');
    var s = store();
    s.incidentes.push({ id: uid('cv'), fecha: todayKey(), tipo: fichaSel || 'otro', quien: '', escalon: 'hablar', estado: 'hablado', relato: t.slice(0, 160) });
    save('Llevado a bitácora 📓');
    renderIncidentes(); switchTab('Bitacora');
  };

  ['actaLugar', 'actaFecha', 'actaA', 'actaB', 'actaTema', 'actaRev', 'actaLista'].forEach(function (id) {
    var x = $(id);
    if (x) x.addEventListener('input', paintActa);
  });
  try { var af = $('actaFecha'); if (af && !af.value) af.value = todayKey(); } catch (e) {}
  var asv = $('actaSave');
  if (asv) asv.onclick = function () {
    var a = actaTexto();
    if (!($('actaA') || {}).value || !($('actaB') || {}).value) { if (!confirm('Guarda igual sin nombres completos?')) return; }
    var s = store();
    s.acuerdos.push({ id: uid('ac'), fecha: a.fec, tema: a.tema, partes: a.partes, revision: a.rev, texto: a.texto, cumplido: false });
    save('Acuerdo guardado 🤝');
    renderAcuerdos(); switchTab('Bitacora');
  };
  var ash = $('actaShare');
  if (ash) ash.onclick = async function () { var a = actaTexto(); await share('Acta de acuerdo vecinal', a.texto); };

  var inten = $('convIntencion');
  if (inten) {
    try { inten.value = store().intencion || ''; } catch (e) {}
    inten.addEventListener('change', function () {
      try { store().intencion = clean(inten.value, 120); save('Intención guardada 🌙'); } catch (e) {}
    });
  }

  var add = $('convAdd');
  if (add) add.onclick = function () {
    var relato = clean((($('convRelato') || {}).value || '').trim(), 160);
    if (!relato) return alert('Escribe qué pasó (hecho + hora)');
    var s = store();
    var obj = {
      id: editingConv || uid('cv'),
      fecha: (($('convFecha') || {}).value || todayKey()).slice(0, 10),
      tipo: ($('convTipo') || {}).value || 'otro',
      quien: clean((($('convQuien') || {}).value || '').trim(), 40),
      escalon: ($('convEscalon') || {}).value || 'hablar',
      estado: ($('convEstado') || {}).value || 'abierto',
      relato: relato
    };
    if (editingConv) {
      s.incidentes = (s.incidentes || []).map(function (n) { return n.id === editingConv ? obj : n; });
      editingConv = null;
      try { $('convCancel').classList.add('hidden'); } catch (e) {}
    } else s.incidentes.push(obj);
    save('Guardado en bitácora 📓');
    try { $('convRelato').value = ''; $('convQuien').value = ''; } catch (e) {}
    renderIncidentes();
  };
  var ccl = $('convCancel');
  if (ccl) ccl.onclick = function () {
    editingConv = null; ccl.classList.add('hidden');
    try { $('convRelato').value = ''; $('convQuien').value = ''; } catch (e) {}
  };
  try { var cf = $('convFecha'); if (cf && !cf.value) cf.value = todayKey(); } catch (e) {}

  var sh = $('convShare');
  if (sh) sh.onclick = async function () {
    var s = store();
    if (!s.incidentes.length && !s.acuerdos.length) return alert('Bitácora vacía');
    var t = '🏘️ Bitácora de convivencia (privada)\n\nIncidentes:\n' + s.incidentes.map(function (r) {
      return '• ' + r.fecha + ' · ' + (TIPO_N[r.tipo] || r.tipo) + ' · ' + (r.quien || '') + ' · ' + (ESC_N[r.escalon] || '') + ' · ' + (EST_N[r.estado] || '') + '\n  ' + (r.relato || '');
    }).join('\n') + '\n\nAcuerdos:\n' + s.acuerdos.map(function (r) {
      return '• ' + r.fecha + ' · ' + r.tema + ' · ' + r.partes + (r.cumplido ? ' ✅' : '') + '\n  ' + String(r.texto || '').slice(0, 200);
    }).join('\n');
    await share('Bitácora convivencia', t);
  };
  var cl = $('convClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar incidentes y acuerdos? (No se puede deshacer)')) return;
    try { var s = store(); s.incidentes = []; s.acuerdos = []; } catch (e) {}
    save(); renderIncidentes(); renderAcuerdos();
  };
}

/* ---------------- SETUP: integra en Comunidad ---------------- */
var BTNS = [
  { id: 'btnConvivGuia', label: '📖 Guía base', tab: 'Guia', sub: 'convivencia-vecinal', kw: 'convivencia vecinal guia escalera hablar carta mediacion denuncia vecino conflicto barrio buena convivencia' },
  { id: 'btnConvivFichas', label: '🗂️ Fichas conflicto', tab: 'Fichas', sub: 'convivencia-vecinal', kw: 'fichas conflicto ruidos mascotas perros ladridos linderos arboles medianero basura estacionamiento auto agua filtracion humedad' },
  { id: 'btnConvivHablar', label: '🗣️ Conversar + acta', tab: 'Hablar', sub: 'convivencia-vecinal', kw: 'conversar cnv comunicacion no violenta silla escucha acta acuerdo frase que decir dialogo' },
  { id: 'btnConvivBitacora', label: '📓 Bitácora', tab: 'Bitacora', sub: 'convivencia-vecinal', kw: 'bitacora incidentes registro acuerdos conversaciones seguimiento privado local' },
  { id: 'btnConvivLuna', label: '🌙 Ritual lunar', tab: 'Luna', sub: 'convivencia-vecinal', kw: 'ritual lunar conversacion dificil luna nueva llena menguante intencion calma respiracion' },
  { id: 'btnConvivRecursos', label: '📞 Recursos', tab: 'Recursos', sub: 'convivencia-vecinal', kw: 'recursos dideco jjvv junta vecinos ley 19418 mediacion comunitaria condominio ley 19537 21442 juzgado policia local carabineros' }
];
var SUB_LABEL = { id: 'convivencia-vecinal', label: '🏘️ Convivencia Vecinal' };

function ensureSection() {
  var box = document.querySelector('.action-group[data-group="comunidad"] .group-btns');
  if (!box) return;
  var lab = box.querySelector('.sub-label[data-sub="' + SUB_LABEL.id + '"]');
  if (!lab) {
    lab = document.createElement('span');
    lab.className = 'sub-label'; lab.setAttribute('data-sub', SUB_LABEL.id); lab.textContent = SUB_LABEL.label;
    var appLab = box.querySelector('.sub-label[data-sub="app"]');
    if (appLab && appLab.parentNode === box) box.insertBefore(lab, appLab);
    else box.appendChild(lab);
  } else if (!lab.textContent || lab.textContent.indexOf('Convivencia') < 0) {
    lab.textContent = SUB_LABEL.label;
  }
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
  try {
    var anchor = lab.nextSibling;
    var appLab2 = box.querySelector('.sub-label[data-sub="app"]');
    BTNS.forEach(function (b) {
      var el = document.getElementById(b.id);
      if (!el) return;
      if (appLab2) box.insertBefore(el, appLab2);
      else box.insertBefore(el, anchor);
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
      BTNS.forEach(function (b) { BTN_HOME[b.id] = ['comunidad', 'convivencia-vecinal']; });
    }
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      BTN_ORDER['comunidad|convivencia-vecinal'] = BTNS.map(function (b) { return b.id; });
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
  buildIfNeeded();
  renderAll();
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);
setTimeout(function () { try { ensureSection(); registerVisibility(); } catch (e) {} }, 2000);

})();
