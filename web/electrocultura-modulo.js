/* ============================================================
   ELECTROCULTURA — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente:
   - Botón btnElectrocultura (grupo Herramientas, inyectado)
   - Diálogo electroDialog con 5 pestañas:
     1) Guía (qué es, historia, cómo funciona, qué dice la ciencia)
     2) Antenas (8 fichas: Christofleau, espiral, Lakhovsky, basalto...)
     3) Proyectos (4 paso a paso con materiales de ferretería Penco)
     4) Luna & Medir (momento lunar + cómo medir sin instrumentos caros)
     5) Mi experimento (bitácora comparativa tratado vs control)
   - Todo local y privado por usuario: userData().electrocultura
     { logs:[], hechos:{} }
   - Educativo: NO usa red 220V, NO reemplaza riego/abono/luz.
     Enfoque en seguridad (rayos, cobre, viento sur).
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
    if (!u) return { logs: [], hechos: {} };
    if (!u.electrocultura) u.electrocultura = { logs: [], hechos: [] };
    var e = u.electrocultura;
    if (!Array.isArray(e.logs)) e.logs = [];
    if (!e.hechos || Array.isArray(e.hechos)) e.hechos = {};
    return e;
  } catch (e2) { return { logs: [], hechos: {} }; }
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
function lunaDeHoy() {
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(todayKey()); if (r && r.luna !== 'dft') return { luna: r.luna, dia: r.diaN }; }
  } catch (e) {}
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(todayKey()); if (m) return { luna: m.luna, dia: m.dia }; }
  } catch (e) {}
  return null;
}

/* ---------------- DATOS ---------------- */
var GUIA = [
  { n: '¿Qué es?', ico: '⚡', txt: 'Técnicas que usan cobre, formas espirales, basalto paramagnético y orientación norte-sur para captar la electricidad natural del aire y la tierra (la que hay entre nubes y suelo, mucho antes de los enchufes). La idea: darle a la planta un "pararrayos al revés" que baja esa energía suave al suelo y estimula raíz, microbios y savia. No es magia: es antena + suelo vivo + sol + agua.' },
  { n: 'Historia en 1 minuto', ico: '📜', txt: 'Siglo XVIII: el abate Bertholon electrifica plantas. 1910–1940: Justin Christofleau (Francia) populariza la antena atmosférica de cobre + zinc y cosecha papas gigantes; Georges Lakhovsky propone anillos oscilantes para la vida. 1970–hoy: Philip Callahan estudia paramagnetismo (rocas como basalto que "respiran" magnetismo) y antenas en huertas. En Chile se redescubre en huertas urbanas y viñas del sur: poco costo, mucho observar.' },
  { n: '¿Cómo funcionaría?', ico: '🧲', txt: '1) El aire siempre tiene carga (más antes de lluvia). El cobre alto la capta. 2) La espiral o el cono la "ordena" bajando por el tutor a la raíz. 3) El basalto molido (paramagnético) haría el suelo más receptivo al magnetismo terrestre, como antena de tierra. 4) Resultado esperado: germinación más rápida, tallos más firmes, menos estrés con viento sur y helada. Efecto suave: 10–30%, nunca 300%.' },
  { n: '¿Qué dice la ciencia?', ico: '🔬', txt: 'Honesto: hay ensayos que muestran +10–25% en germinación y vigor (sobre todo con antenas altas en suelos pobres), y otros sin diferencia. No hay consenso. Lo serio es tratarla como EXPERIMENTO: una cama con antena y una cama control iguales, medir y decidir tú. Lo que sí está probado: cobre entutorado ordena mejor que fierro oxidado, y el basalto aporta minerales reales (silicio, magnesio, hierro). Eso ya paga el esfuerzo.' },
  { n: 'Lo que NO es', ico: '🚫', txt: 'No es conectar nada a 220V (peligro mortal y mata el suelo). No reemplaza compost, riego, sol ni semilla buena. No atrae "rayos buenos": una antena mal alta en temporal sí atrae rayos malos. No cura plagas sola: acompaña, no sustituye manejo.' },
  { n: 'Seguridad Penco (lee esto)', ico: '⛈️', txt: '1) Nada a la red eléctrica, nada a postes. Solo cobre + madera + piedra. 2) Altura máx 2,5 m en huerta casera; en tormenta con rayos, no toques la antena. 3) Entierra bien el palo (40 cm + piedra) contra el viento sur. 4) Cobre con puntas redondeadas o dobladas (no lanzas filosas donde juegan niños). 5) Basalto en polvo con mascarilla al aplicar (polvo irrita). 6) Si vives junto a tendido de alta tensión, no pongas antenas altas: distancia mínima 10 m.' }
];

var ANTENAS = [
  { n: 'Tutor espiral de cobre', ico: '🌀', tag: 'la primera · 15 min', para: 'Macetas, tomates, porotos, arvejas. La más probada en casa.', mat: 'Vara de coligüe o bambú 1,2–1,8 m + alambre de cobre desnudo 1–1,5 mm (2–3 m) + alicate.', como: 'Enrolla el cobre en espiral hacia ARRIBA (como resorte) alrededor de la vara, 7–12 vueltas separadas 3–5 cm. Deja 15–20 cm de cobre recto al cielo y 15 cm enterrado al pie. Entierra la vara a 20 cm junto a la planta, lado norte de la planta.', nota: 'Orientación: espiral en sentido horario visto desde arriba (hemisferio sur). Si se pone verde (pátina), no lo lijes: funciona igual.', cuidado: 'No aprietes el tallo: deja 5 cm de aire.' },
  { n: 'Antena atmosférica tipo Christofleau', ico: '📡', tag: 'huerta completa · 1 tarde', para: 'Bancal de 3×1 m o invernadero chico. Cosechas más parejas.', mat: 'Palo impregnado o eucalipto 2,2–2,5 m + tubo o espiral de cobre en la punta (30–50 cm) + alambre galvanizado fino bajando al suelo + cable enterrado en cruz bajo el bancal.', como: 'Clava el palo al norte del bancal (40 cm enterrado + piedras). Corona de cobre arriba. Baja un alambre hasta 10 cm del suelo y desde ahí entierra un cable en cruz (+) bajo el bancal a 15–20 cm de profundidad. Conecta bancal a antena solo con ese cable.', nota: 'Una antena cubre ~4–6 m a la redonda. Más alto no es mejor: más rayo y más sombra.', cuidado: 'En temporal con rayos no trabajes al lado. Desconecta el cable aéreo si pronostican tormenta eléctrica fuerte.' },
  { n: 'Anillo Lakhovsky para maceta', ico: '⭕', tag: 'maceta · 10 min', para: 'Almácigos, hierbas, lawen en maceta. Germinación más rápida.', mat: 'Alambre de cobre 1 mm, 35–40 cm + palo corto 30 cm.', como: 'Forma un círculo de ~10–12 cm dejando 1–2 cm ABIERTO (las puntas no se tocan). Clávalo vertical al borde de la maceta con el corte mirando al norte. Uno por maceta basta.', nota: 'Tradición dice: el corte orientado al norte "oscila" mejor. Si no ves diferencia en 2 lunas, reciclalo a otro proyecto.', cuidado: 'No lo pongas como collar al tallo: va al borde.' },
  { n: 'Pirámide / cono de cobre', ico: '🔺', tag: 'semillero', para: 'Bandejas de almácigos, guardar semillas 1 luna antes de sembrar.', mat: '3–4 varillas de cobre o alambre grueso 2 mm formando pirámide de 20–30 cm de base.', como: 'Arma la pirámide y ponla SOBRE la bandeja (no enterrada), una cara mirando al norte. Semillas dentro 7–14 días antes de siembra, a la sombra fresca.', nota: 'Efecto más reportado: germinación 1–3 días antes. Mide con tu bitácora, no de memoria.', cuidado: 'No es horno: a pleno sol de Walüng recalienta; usa malla raschel encima.' },
  { n: 'Basalto paramagnético (cama viva)', ico: '🌋', tag: 'suelo · otoño', para: 'Suelos arenosos de Penco–Lirquén, bancales cansados.', mat: 'Harina de roca basáltica o andesita (sacos en semillerías/ferretería; a veces "polvo de cantera") + compost.', como: 'Mezcla 200–400 g/m² de polvo de basalto con compost maduro en los 10 cm de arriba, en menguante de otoño (Rimü). Repite 1 vez al año. Riega después.', nota: 'Aporte real: silicio + magnesio + hierro. Lo "magnético" es extra; lo mineral es seguro.', cuidado: 'Mascarilla al espolvorear. No uses polvo de demolición ni escorias desconocidas (metales pesados).' },
  { n: 'Cable norte-sur bajo el bancal', ico: '🧭', tag: 'bancal nuevo', para: 'Bancales nuevos o trasplantados. Barato y discreto.', mat: 'Alambre galvanizado o cobre 4–8 m.', como: 'Antes de rellenar, entierra en cruz un cable a 15 cm: un tramo largo norte→sur (el importante) y uno corto este→oeste. Saca una punta 10 cm al norte para conectar futura antena.', nota: 'Siembra después las hileras norte-sur: tradición + mejor sol de mañana en Penco.', cuidado: 'No hagas espirales cerradas bajo tierra (encharcan raíces). Simple y recto.' },
  { n: 'Agua dinamizada / "magnetizada" casera', ico: '💧', tag: 'riego', para: 'Riego de almácigos con agua reposada.', mat: 'Balde + palo para revolver. Opcional: 2 imanes de ferrita en el tubo de riego (polos opuestos).', como: 'Revuelve el agua 1 min formando remolino (vórtice) antes de regar al atardecer. Si usas imanes: fíjalos fuera del tubo/goteo, no dentro del agua.', nota: 'Lo probado: el remolino oxigena y el agua reposada pierde cloro. Eso ya ayuda. Lo magnético, a experimento.', cuidado: 'Imanes lejos de marcapasos, tarjetas y celular.' },
  { n: 'Cobre sí, fierro no (regla de metales)', ico: '🔩', tag: 'regla de oro', para: 'Toda la huerta: tutores, mallas, amarras.', mat: 'Cobre, madera, bramante. Evita fierro oxidado tocando tallos.', como: 'Tutores de madera + amarra de algodón/yute. Si usas malla metálica, que sea galvanizada y no en contacto directo con el tallo. El cobre enterrado dura años; el fierro se oxida y mancha.', nota: 'El cobre en exceso es fungicida: no entierres kilos, solo alambres finos. Menos es más.', cuidado: 'Caldo bordelés + antena de cobre no se suman el mismo mes: exceso de cobre frena lombrices.' }
];

var PROYECTOS = [
  { n: 'Proyecto 1 · Tutor espiral (15 min, ~$3.000)', ico: '🌀', nivel: 'Principiante · 1 planta',
    mats: ['Vara coligüe/bambú 1,5 m', '3 m alambre cobre 1,2 mm desnudo', 'Alicate, martillo', 'Piedra para calzar'],
    pasos: ['Corta 3 m de cobre. Dobla 15 cm de punta (entierro).', 'Enrolla subiendo en espiral horaria, 10 vueltas separadas 4 cm. Aprieta suave contra la vara.', 'Deja 20 cm rectos al cielo; redondea la punta con el alicate (gota).', 'Clava la vara 20 cm al norte de la planta (tomate/poroto).', 'Entierra la colita de cobre al pie. Riega. Anota fecha + fase lunar en Mi experimento.'],
    mide: 'Mide altura cada 7 días + foto misma hora. Compara con planta control sin espiral.' },
  { n: 'Proyecto 2 · Antena de bancal (1 tarde, ~$12.000)', ico: '📡', nivel: 'Intermedio · bancal 3×1 m',
    mats: ['Palo 2,4 m', 'Espiral/cono de cobre 40 cm', '10 m alambre galvanizado fino', 'Pala, piedras, nivel'],
    pasos: ['Elige esquina norte del bancal, fuera del paso.', 'Entierra el palo 40 cm + piedras bien pisadas (viento sur).', 'Fija la corona de cobre arriba, punta redondeada.', 'Baja el alambre hasta el suelo y entiérralo en cruz bajo el bancal a 15 cm.', 'Prueba: tira el palo (no debe moverse). Anota instalación en bitácora.'],
    mide: 'Pesa cosecha por corte (bancal con antena vs bancal control). Anota kilos + fecha.' },
  { n: 'Proyecto 3 · Cama con basalto (1 mañana, ~$8.000)', ico: '🌋', nivel: 'Principiante · suelo',
    mats: ['2 kg harina de basalto/andesita', '2 sacos compost maduro', 'Mascarilla, rastrillo, regadera'],
    pasos: ['Desmaleza sin voltear profundo (10 cm).', 'Espolvorea 300 g/m² con mascarilla, día sin viento.', 'Cubre con 2 cm de compost + rastrilla suave.', 'Riega en forma de lluvia. Siembra 7 días después (menguante ideal).', 'Repite 1 vez al año, siempre con compost (nunca polvo solo).'],
    mide: 'Observa a 28 y 56 días: color, firmeza del tallo, lombrices por palada vs control.' },
  { n: 'Proyecto 4 · Anillos para almácigos (30 min, ~$2.000)', ico: '⭕', nivel: 'Principiante · semillero',
    mats: ['1 m alambre cobre 1 mm', '6 palitos 30 cm', 'Bandeja + sustrato + semillas (ej: lechuga)'],
    pasos: ['Corta 6 trozos de 35 cm. Forma 6 anillos de 11 cm dejando 1,5 cm abiertos.', 'Clava 1 anillo por celda/fila, corte al norte.', 'Siembra mitad de bandeja con anillo y mitad sin (marca con palito de color).', 'Mismo riego y luz para ambas mitades.', 'Anota días a germinación de cada mitad.'],
    mide: 'Días a germinar + % germinadas por mitad. Foto día 7, 14 y 21.' }
];

var LUNA = [
  { f: '🌑 Luna nueva', q: 'Instalar y enterrar: antenas, cables, basalto + compost. Suelo receptivo, poca savia arriba.', no: 'No esperes milagros visibles esta semana: la energía va a la raíz.' },
  { f: '🌒 Creciente', q: 'Sembrar y trasplantar junto a antenas. Germinación y estirón más rápidos.', no: 'Riega parejo: el estirón pide agua constante.' },
  { f: '🌕 Luna llena', q: 'Observar y medir: altura, color, plagas. Máxima savia = se nota todo.', no: 'No podes fuerte ni muevas antenas: deja el sistema quieto.' },
  { f: '🌖 Menguante', q: 'Abonar con basalto+compost, podar suave, cosechar para guardar. Repara antenas tumbadas por el sur.', no: 'No instales cables nuevos: cierra el ciclo, no lo abras.' }
];

/* ---------------- DIALOGO ---------------- */
function switchTab(name) {
  ['Guia', 'Antenas', 'Proyectos', 'Luna', 'Experimento'].forEach(function (t) {
    var p = $('elec' + t), b = $('tabElec' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

function buildDialog() {
  var guiaHTML = GUIA.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + esc(c.txt) + '</p></div>';
  }).join('');

  var antHTML = ANTENAS.map(function (a, i) {
    return '<div class="si-card"><h4>' + a.ico + ' ' + esc(a.n) + '</h4>' +
      '<p><span class="chip" style="font-size:10px">' + esc(a.tag) + '</span></p>' +
      '<p><b>Para:</b> ' + esc(a.para) + '<br><b>Materiales:</b> ' + esc(a.mat) + '</p>' +
      '<p><b>Cómo:</b> ' + esc(a.como) + '</p>' +
      '<p class="muted">' + esc(a.nota) + '</p>' +
      '<p style="font-size:11px;color:#e8c56a">⚠️ ' + esc(a.cuidado) + '</p>' +
      '<div style="display:flex;gap:6px;margin-top:6px"><button type="button" class="btn elec-use" data-n="' + esc(a.n) + '" style="width:auto;font-size:11px">➕ Probar esta en mi experimento</button></div></div>';
  }).join('');

  var proyHTML = PROYECTOS.map(function (p) {
    var mats = p.mats.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('');
    var pasos = p.pasos.map(function (s, i) { return '<li><b>' + (i + 1) + '.</b> ' + esc(s) + '</li>'; }).join('');
    return '<div class="si-card" style="border-color:var(--gold)"><h4>' + p.ico + ' ' + esc(p.n) + '</h4>' +
      '<p><span class="chip" style="font-size:10px">' + esc(p.nivel) + '</span></p>' +
      '<p><b>Materiales</b></p><ol style="font-size:12px;margin:4px 0 4px 18px">' + mats + '</ol>' +
      '<p><b>Paso a paso</b></p><ol style="font-size:12px;margin:4px 0 4px 18px;line-height:1.6">' + pasos + '</ol>' +
      '<p class="muted" style="font-size:11px">📏 ' + esc(p.mide) + '</p>' +
      '<div style="display:flex;gap:6px;margin-top:6px"><button type="button" class="btn elec-use" data-n="' + esc(p.n) + '" style="width:auto;font-size:11px">➕ Registrar este proyecto</button></div></div>';
  }).join('');

  var lunaHTML = LUNA.map(function (l) {
    return '<div class="si-card"><h4>' + esc(l.f) + '</h4><p>' + esc(l.q) + '</p><p class="muted">' + esc(l.no) + '</p></div>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabElecGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabElecAntenas" class="btn" style="width:auto">📡 Antenas</button>' +
    '<button type="button" id="tabElecProyectos" class="btn" style="width:auto">🔧 Proyectos</button>' +
    '<button type="button" id="tabElecLuna" class="btn" style="width:auto">🌙 Luna & Medir</button>' +
    '<button type="button" id="tabElecExperimento" class="btn" style="width:auto">🧪 Mi experimento</button></div>' +
    '<div id="elecGuia">' + guiaHTML +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>⚡ Regla de oro en 1 frase</h4><p class="muted" style="font-size:12px">Una antena no salva una huerta seca y sin compost. Primero suelo + agua + sol; la electrocultura es el aliño, no el plato.</p></div></div>' +
    '<div id="elecAntenas" class="hidden"><div class="conv-row"><label style="flex:1">🔍 Filtrar <input type="text" id="elecFilter" placeholder="cobre, basalto, maceta, bancal..."></label></div><div id="elecAntList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + antHTML + '</div></div>' +
    '<div id="elecProyectos" class="hidden">' + proyHTML + '</div>' +
    '<div id="elecLuna" class="hidden"><div id="elecHoyBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + lunaHTML + '</div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>📏 Cómo medir sin gastar (método serio)</h4><p class="muted" style="font-size:11px;line-height:1.6">1) Siempre 2 grupos iguales: <b>tratado (con antena) vs control (sin nada)</b>, misma semilla, misma tierra, mismo riego.<br>2) Mide 3 cosas: <b>altura (cm) cada 7 días</b>, <b>días a germinar</b>, <b>peso cosechado (g/kg)</b>.<br>3) Foto mismo lugar y hora.<br>4) Mínimo 1 luna completa (28 días) antes de opinar.<br>5) Anota el clima: lluvia y viento sur cambian todo en Penco.</p></div></div>' +
    '<div id="elecExperimento" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Nuevo registro</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="elecFecha"></label><label>Cultivo <input type="text" id="elecCultivo" placeholder="ej: Tomate, Lechuga" maxlength="30"></label></div>' +
    '<div class="conv-row"><label>Técnica <select id="elecTecnica"><option>Tutor espiral de cobre</option><option>Antena atmosférica (Christofleau)</option><option>Anillo Lakhovsky</option><option>Pirámide / cono</option><option>Basalto + compost</option><option>Cable norte-sur</option><option>Agua dinamizada</option><option>Otra</option></select></label><label>Luna <select id="elecFase"><option value="auto">Auto (hoy)</option><option>Nueva</option><option>Creciente</option><option>Llena</option><option>Menguante</option></select></label></div>' +
    '<div class="conv-row"><label>Altura tratado (cm) <input type="number" id="elecAltT" min="0" step="0.5" placeholder="ej: 24"></label><label>Altura control (cm) <input type="number" id="elecAltC" min="0" step="0.5" placeholder="ej: 20"></label></div>' +
    '<label>Notas / clima <input type="text" id="elecNota" placeholder="ej: viento sur 3 días, riego parejo" maxlength="100"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="elecAdd" class="btn btn-accent" style="width:auto">+ Guardar medición</button></div></div>' +
    '<div id="elecResumen" class="menstrual-card" style="margin-top:10px"></div>' +
    '<div id="elecLog" class="habits-list" style="margin-top:10px;max-height:260px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="elecStats" class="muted" style="font-size:11px"></span><span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="elecShare" class="btn" style="width:auto">📤 Compartir</button><button type="button" id="elecExport" class="btn" style="width:auto">📥 Exportar</button><button type="button" id="elecClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>';

  makeDialog('electroDialog', '⚡ Electrocultura — energía del cielo a la huerta',
    'Antenas de cobre, espirales y basalto para tu huerta en Penco. Barato, seguro y medible: <b>una cama con antena + una cama control</b>. Todo queda <b>privado y local</b>. Nada va a 220V.',
    body);
}

/* ---------------- BITÁCORA ---------------- */
function renderLog() {
  var box = $('elecLog'); if (!box) return;
  var e = store();
  var data = e.logs || [];
  var res = $('elecResumen'), st = $('elecStats');
  if (!data.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin mediciones. Guarda la primera arriba: tratado vs control el mismo día.</p>';
    if (res) res.innerHTML = '<h4>📊 Tu comparativa</h4><p class="muted" style="font-size:11px">Cuando tengas 2+ mediciones verás aquí el promedio tratado vs control.</p>';
    if (st) st.textContent = '';
    return;
  }
  var s = data.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  box.innerHTML = s.map(function (r) {
    var dif = (r.altT != null && r.altC != null) ? (Math.round((r.altT - r.altC) * 10) / 10) : null;
    var chip = dif == null ? '' : dif > 0 ? ' <span class="chip" style="font-size:10px;color:#8fd694;border-color:#8fd69455">+' + dif + ' cm 🌱</span>' : dif < 0 ? ' <span class="chip" style="font-size:10px;color:#e8c56a;border-color:#e8c56a55">' + dif + ' cm</span>' : ' <span class="chip" style="font-size:10px">igual</span>';
    return '<div class="hora-item"><span style="font-size:12px"><b>' + esc(r.cultivo || 'Cultivo') + '</b> · ' + esc(r.tecnica || '') + chip +
      '<br><span class="muted" style="font-size:10px">' + esc(r.fecha || '') + ' · ' + esc(r.fase || '') + ' · T ' + (r.altT != null ? r.altT : '–') + ' cm vs C ' + (r.altC != null ? r.altC : '–') + ' cm' + (r.nota ? ' · ' + esc(r.nota) : '') + '</span></span>' +
      '<button type="button" class="btn btn-icon elec-del" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.elec-del').forEach(function (x) {
    x.onclick = function () {
      var st2 = store();
      st2.logs = (st2.logs || []).filter(function (r) { return r.id !== x.dataset.k; });
      save(); renderLog();
    };
  });
  var conT = data.filter(function (r) { return r.altT != null; }), conC = data.filter(function (r) { return r.altC != null; });
  var avg = function (arr, k) { if (!arr.length) return null; var s2 = 0; arr.forEach(function (r) { s2 += (+r[k] || 0); }); return Math.round((s2 / arr.length) * 10) / 10; };
  var aT = avg(conT, 'altT'), aC = avg(conC, 'altC');
  if (res) {
    var veredicto = (aT != null && aC != null) ? (aT > aC ? '🌱 Tratado va <b>+' + Math.round((aT - aC) * 10) / 10 + ' cm</b> sobre control. Sigue 1 luna más antes de celebrar.' : aT < aC ? '🟡 Control va arriba. Revisa riego/luz pareja y repite: el experimento también enseña.' : '➖ Empate. Prueba mover la antena o cambiar de cultivo.') : 'Suma alturas para ver el promedio.';
    res.innerHTML = '<h4>📊 Tu comparativa (' + data.length + ' mediciones)</h4><p style="font-size:12px">Tratado: <b>' + (aT != null ? aT + ' cm' : '–') + '</b> · Control: <b>' + (aC != null ? aC + ' cm' : '–') + '</b></p><p class="muted" style="font-size:11px">' + veredicto + '</p>';
  }
  if (st) st.textContent = data.length + ' medición(es)';
}

function paintHoy() {
  var b = $('elecHoyBox'); if (!b) return;
  var l = lunaDeHoy();
  var txt = l ? ('Hoy · Luna ' + l.luna + ' · día ' + l.dia) : ('Hoy · ' + todayKey());
  var rec = !l ? 'Mide y anota parejo.' : l.luna <= 3 ? 'Pukem: instala, entierra cables y aplica basalto+compost.' : l.luna <= 6 ? 'Pewü: siembra y trasplanta junto a antenas.' : l.luna <= 9 ? 'Walüng: observa en llena, mide altura y pesa.' : 'Rimü: cosecha, repara antenas del viento sur, abona.';
  b.innerHTML = '<h4>🌙 ' + esc(txt) + '</h4><p class="muted" style="font-size:12px">' + esc(rec) + '</p>';
  if ($('elecFecha') && !$('elecFecha').value) $('elecFecha').value = todayKey();
}

/* ---------------- SETUP ---------------- */
function gotoBtn(id) { try { var x = $(id); if (x) x.click(); } catch (e) {} }

function setup() {
  /* 1) inyectar botón en Territorio > Tierra (migra desde Herramientas si existía) */
  try {
    var existing = $('btnElectrocultura');
    if (existing) {
      var oldG = existing.closest ? existing.closest('.action-group') : null;
      var inTerr = oldG && oldG.getAttribute && oldG.getAttribute('data-group') === 'territorio';
      if (!inTerr) { try { existing.remove(); } catch (e0) { try { existing.parentNode.removeChild(existing); } catch (e1) {} } existing = null; }
    }
    if (!existing) {
      var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnElectrocultura'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '⚡ Electrocultura';
        try { btn.setAttribute('data-sub', 'tierra'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'electrocultura electrocultura antena cobre espiral lakhovsky christofleau basalto paramagnetismo energia atmosfera magnetismo cosecha huerta tutor piramide anillo agua dinamizada galvanizado norte sur');
        var ref = g.querySelector('#btnLawen');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnElectrocultura') < 0) ALL_BTNS.push('btnElectrocultura');
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnElectrocultura = true; });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Territorio; limpia resto de Herramientas) */
  try {
    try {
      document.querySelectorAll('#configDialog .config-group').forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Hogar') >= 0) {
          var old = gr.querySelector('input[data-btn="btnElectrocultura"]');
          if (old && old.closest && old.closest('label')) { try { old.closest('label').remove(); } catch (e0) {} }
        }
      });
    } catch (e0) {}
    if (!document.querySelector('#configDialog input[data-btn="btnElectrocultura"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Territorio') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnElectrocultura"> ⚡ Electrocultura';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnElectrocultura !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnElectrocultura = lab.querySelector('input').checked;
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

  /* 4) diálogo */
  buildDialog();
  paintHoy(); renderLog();

  var b = $('btnElectrocultura');
  if (b) b.onclick = function () {
    paintHoy(); renderLog();
    openDlg('electroDialog');
  };

  ['Guia', 'Antenas', 'Proyectos', 'Luna', 'Experimento'].forEach(function (t) {
    var tb = $('tabElec' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var f = $('elecFilter');
  if (f) f.oninput = function () {
    var q = (f.value || '').toLowerCase();
    var list = $('elecAntList'); if (!list) return;
    var cards = list.querySelectorAll('.si-card');
    var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
    cards.forEach(function (c) {
      var t = (c.textContent || '').toLowerCase();
      var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
      c.style.display = (!q || tn.indexOf(qn) >= 0) ? '' : 'none';
    });
  };

  document.querySelectorAll('.elec-use').forEach(function (x) {
    x.onclick = function () {
      switchTab('Experimento');
      var tec = $('elecTecnica');
      if (tec) {
        var n = x.getAttribute('data-n') || '';
        for (var i = 0; i < tec.options.length; i++) {
          if (n.indexOf(tec.options[i].text.split(' ')[0]) >= 0 || tec.options[i].text.indexOf(n.split(' ')[1] || 'zzz') >= 0) { tec.selectedIndex = i; break; }
        }
        if (n.indexOf('espiral') >= 0) tec.selectedIndex = 0;
        else if (n.indexOf('Christofleau') >= 0 || n.indexOf('bancal') >= 0) tec.selectedIndex = 1;
        else if (n.indexOf('Lakhovsky') >= 0 || n.indexOf('almácigo') >= 0 || n.indexOf('Anillos') >= 0) tec.selectedIndex = 2;
        else if (n.indexOf('irámide') >= 0) tec.selectedIndex = 3;
        else if (n.indexOf('asalto') >= 0) tec.selectedIndex = 4;
      }
      try { $('elecCultivo').focus(); } catch (e) {}
    };
  });

  var ad = $('elecAdd');
  if (ad) ad.onclick = function () {
    var fecha = ($('elecFecha') || {}).value || todayKey();
    var cult = clean((($('elecCultivo') || {}).value || '').trim(), 30);
    if (!cult) return alert('Escribe el cultivo (ej: Tomate)');
    var faseSel = ($('elecFase') || {}).value || 'auto';
    var fase = faseSel === 'auto' ? (function () { var l = lunaDeHoy(); return l ? ('Luna ' + l.luna) : todayKey(); })() : faseSel;
    var aT = parseFloat(($('elecAltT') || {}).value), aC = parseFloat(($('elecAltC') || {}).value);
    var e = store();
    e.logs.push({ id: uid('el'), fecha: fecha, cultivo: cult, tecnica: ($('elecTecnica') || {}).value || 'Otra', fase: fase, altT: isNaN(aT) ? null : aT, altC: isNaN(aC) ? null : aC, nota: clean((($('elecNota') || {}).value || '').trim(), 100) });
    save('Medición guardada ⚡');
    if ($('elecAltT')) $('elecAltT').value = ''; if ($('elecAltC')) $('elecAltC').value = ''; if ($('elecNota')) $('elecNota').value = '';
    renderLog();
  };

  var sh = $('elecShare');
  if (sh) sh.onclick = async function () {
    var d = store().logs || [];
    if (!d.length) return alert('Sin mediciones aún');
    var t = '⚡ Mi experimento de electrocultura\n' + d.slice().sort(function (a, b) { return (a.fecha || '').localeCompare(b.fecha || ''); }).map(function (r) {
      return '• ' + r.fecha + ' · ' + r.cultivo + ' · ' + r.tecnica + ' · T ' + (r.altT != null ? r.altT + 'cm' : '–') + ' vs C ' + (r.altC != null ? r.altC + 'cm' : '–') + (r.nota ? ' — ' + r.nota : '');
    }).join('\n');
    await share('Electrocultura', t);
  };
  var ex = $('elecExport');
  if (ex) ex.onclick = async function () {
    var e = store();
    var t = '⚡ ELECTROCULTURA — exportación ' + todayKey() + '\n\n' +
      (e.logs || []).map(function (r) { return [r.fecha, r.cultivo, r.tecnica, r.fase, r.altT, r.altC, r.nota].join(' | '); }).join('\n');
    await share('Exportar electrocultura', t || 'Sin datos');
  };
  var cl = $('elecClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu bitácora de electrocultura?')) return;
    try { var u = userData(); if (u && u.electrocultura) u.electrocultura.logs = []; } catch (e) {}
    save(); renderLog();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
