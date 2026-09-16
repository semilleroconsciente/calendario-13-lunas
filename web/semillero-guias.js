/* ============================================================
   SEMILLERO DE HUERTA — Calendario 13 Lunas (Penco)
   Pestana "Semillero" de Siembra lunar, enfocada en especies
   COMESTIBLES de huerta (las de SIEMBRA/SIEMBRA_LUNAS:
   tomate, poroto, haba, lechuga, etc.). Se organiza en:
     🏺 Banco de semillas (inventario + trafkintu, ya existentes)
     🌱 Técnicas de multiplicación (huerta)
     ❄️ Estratificación (huerta)
     📚 Guías relacionadas
   El bosque nativo tiene su propio Semillero en Bosque Nativo
   (bosque-semillero.js); ambas versiones se enlazan entre si.
   No reescribe el inventario: envuelve renderSiembraSemillas
   (despues del wrapper de trafkintu) y mueve su contenido al
   panel del banco. Todo local, sin red. Se edita aqui mismo.
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

/* ---------- Contenido estatico ---------- */
var MULTIPLICACION = [
  { t: '🌱 Siembra directa', luna: 'Creciente', epoca: 'Según guía de la luna (ver pestaña Siembra)',
    pasos: '1) Suelta y nivela el suelo. 2) Profundidad = 2× el tamaño de la semilla. 3) Riega suave sin encharcar. 4) Ralea dejando la planta más fuerte.',
    sirve: 'Poroto, haba, arveja, maíz, zapallo, zanahoria, rabanito, betarraga, espinaca, cilantro.',
    error: 'Sembrar muy hondo o muy junto: nace débil y se ahoga.' },
  { t: '🧺 Almácigo + trasplante', luna: 'Creciente (trasplanta en menguante si es raíz)',
    epoca: 'Fines de invierno–primavera bajo techo en Penco',
    pasos: '1) Mezcla: 2 partes compost + 1 tierra + 1 arena. 2) Siembra rala, cubre liviano. 3) Trasplanta con 3–4 hojas verdaderas, atardecer nublado. 4) Riega al hoyo, no a la hoja.',
    sirve: 'Tomate, pimiento, ají, lechuga, brócoli, repollo, cebolla, albahaca.',
    error: 'Trasplantar a pleno sol del mediodía: se marchita sin remedio.' },
  { t: '✂️ Esqueje semileñoso', luna: 'Creciente de primavera',
    epoca: 'Pewü (primavera)',
    pasos: '1) Corta 10–15 cm bajo un nudo, en la mañana. 2) Saca hojas bajas, deja 2–3 arriba. 3) Entierra 1/3 en mezcla húmeda a la sombra. 4) Tapa con botella cortada como mini-invernadero.',
    sirve: 'Romero, lavanda, menta, orégano, salvia, chupón de tomate.',
    error: 'Esqueje muy tierno o a pleno sol: se pudre o se seca.' },
  { t: '➗ División de mata', luna: 'Menguante de otoño',
    epoca: 'Rimü–Pukem (otoño–invierno)',
    pasos: '1) Desentierra la mata madre con pan de tierra. 2) Separa con pala o manos en trozos con raíz. 3) Replanta de inmediato a la misma profundidad. 4) Riega y sombrea 3 días.',
    sirve: 'Cebollín, ciboulette, frutilla, ruibarbo, menta, hierba luisa.',
    error: 'Dejar raíces al aire mucho rato: se deshidratan.' },
  { t: '🍓 Estolón', luna: 'Menguante',
    epoca: 'Verano–otoño',
    pasos: '1) Elige el hijo con raicillas del estolón. 2) Apóyalo en maceta con tierra sin cortarlo de la madre. 3) Cuando afirme (2–3 semanas), corta el cordón. 4) Trasplanta al lugar final.',
    sirve: 'Frutilla, menta.',
    error: 'Cortar el estolón antes de que enraíce: se pierde el hijo.' },
  { t: '〰️ Acodo simple', luna: 'Creciente de primavera',
    epoca: 'Pewü (primavera)',
    pasos: '1) Dobla una rama baja hasta el suelo sin quebrarla. 2) Haz un pequeño corte en la zona enterrada. 3) Tapa con tierra y fija con piedra. 4) Separa cuando tenga raíz propia.',
    sirve: 'Romero, parra, grosella, jazmín.',
    error: 'Rama muy vieja y rígida: se quiebra al doblarla.' },
  { t: '🥔 Tubérculo y bulbo', luna: 'Menguante',
    epoca: 'Fines de invierno (papa, ajo) · otoño (cebolla)',
    pasos: '1) Papa: trozos con 2 ojos, oreados 2 días. 2) Ajo: diente con punta arriba a 5 cm. 3) Aporca tierra a medida que crece. 4) Cosecha cuando el follaje se seca.',
    sirve: 'Papa, ajo chilote, cebolla, chalota.',
    error: 'Regar en exceso cerca de la cosecha: se pudre el bulbo.' }
];

var ESTRATIFICACION = {
  intro: 'La semilla de huerta también pide su truco: <b>remojo, fermentación o frío</b> según la especie. Si siembras perejil o espinaca y no pasa nada, casi siempre es esto. ¿Buscas peumo, maqui o canelo? Están en 🌳 Bosque Nativo → Semillero nativo.',
  metodos: [
    { t: '💧 Remojo 12–48 h', pasos: 'Deja en agua a temperatura ambiente una noche (cámbiala si se enturbia). Siembra al día siguiente. Acelera haba, arveja, maíz, poroto, espinaca y perejil (24 h).' },
    { t: '🍅 Fermentación del tomate', pasos: 'Exprime la pulpa con semilla a un frasco con un poco de agua, 2 días a temperatura ambiente hasta que forme espuma. Lava bien, seca a la sombra 7 días y guarda. Vale para tomate, pimiento y pepino.' },
    { t: '❄️ Frío húmedo', pasos: 'Semilla en arena apenas húmeda en el refrigerador (2–8 °C): 30 días para frutilla, 60–90 para frutales (manzano, cerezo). Revisa cada 2 semanas contra el moho.' },
    { t: '🪨 Escarificación suave', pasos: 'Solo para cubiertas duras de huerta (ej. espinaca de Nueva Zelanda): lija suave un punto o pasa por agua caliente (no hirviendo) y deja enfriar 12 h. No la uses en semillas blandas.' }
  ],
  tabla: [
    { sp: 'Tomate / Pimiento', que: 'Fermenta pulpa 2 días, lava y seca. Almácigo primaveral bajo techo', tipo: 'Fermentar' },
    { sp: 'Zapallo / Pepino', que: 'Fruto bien maduro, lava y seca. Siembra directa; remojo 12 h opcional', tipo: 'Directa' },
    { sp: 'Poroto / Maíz', que: 'Grano seco de la mata. Remojo 8–12 h antes de la siembra directa', tipo: 'Remojo' },
    { sp: 'Haba / Arveja', que: 'Remojo 8–12 h antes de la siembra directa de otoño-invierno', tipo: 'Remojo' },
    { sp: 'Perejil / Espinaca', que: 'Remojo 24 h; germinan lento (14–21 días), paciencia', tipo: 'Remojo 24 h' },
    { sp: 'Lechuga / Acelga', que: 'Necesitan luz: cubre apenas. Siembra rala todo el año', tipo: 'Superficial' },
    { sp: 'Zanahoria / Betarraga', que: 'Siembra superficial, suelo siempre húmedo hasta emerger', tipo: 'Humedad' },
    { sp: 'Albahaca', que: 'Calor 20 °C+: almácigo protegido a fines de invierno', tipo: 'Calor' },
    { sp: 'Frutilla', que: 'Estolón en verano-otoño; por semilla: frío húmedo 30 días', tipo: 'Estolón / frío' },
    { sp: 'Ajo / Cebolla / Papa', que: 'No son semilla: diente, bulbo y tubérculo con ojos (ver Multiplicación)', tipo: 'Bulbo' },
    { sp: 'Frutales (manzano, cerezo)', que: 'Frío húmedo 60–90 días; más fácil: planta a raíz desnuda en Pukem', tipo: 'Frío 60–90 días' }
  ],
  test: '<b>🧪 Test de germinación:</b> pon 10 semillas en toalla de papel húmeda dentro de una bolsa, a 20 °C. Cuenta cuántas brotan en 7–14 días: 8/10 = 80 % de poder germinativo. Si es bajo, siembra más denso o renueva el lote.'
};

var GUIAS = [
  { t: '🍅 Cosecha tu semilla por familia', d: 'Tomate/pimiento: fruto bien maduro, fermenta la pulpa 2 días, lava y seca. Poroto/haba/arveja: deja vainas secar en la mata. Lechuga/acelga: deja florecer una planta y recoge cuando el vilano se abre. Zapallo/pepino: fruto maduro, lava y seca. Zanahoria/perejil: segundo año, umbela seca.',
    go: null },
  { t: '🏺 Guardado del banco', d: 'Seca 7–14 días a la sombra ventilada, guarda en sobre de papel (no plástico), frasco hermético fresco-oscuro (<20 °C), etiqueta variedad + fecha + origen. Revisa cada luna.',
    go: 'banco' },
  { t: '🧺 Almácigos que resultan', d: 'Mezcla 2 compost + 1 tierra + 1 arena, profundidad 2× la semilla, riego fino, luz apenas germina. Repica con 3–4 hojas. Ver técnicas de multiplicación.',
    go: 'multi' },
  { t: '🌙 Luna y siembra', d: 'Creciente: lo que da fruto/arriba (tomate, maíz, poroto). Menguante: raíces y bulbos (zanahoria, papa, ajo, cebolla). Llena: cosecha y guarda semilla. Nueva: prepara suelo y trasplanta sombra.',
    go: 'siembra' },
  { t: '🤝 Trafkintu: intercambia', d: 'El intercambio mapuche de semillas y saberes vive en el banco: registra con quién intercambiaste cada variedad y devuelve a la red lo que te resultó.',
    go: 'banco' },
  { t: '🌳 Semillas nativas: otro Semillero', d: 'Peumo, avellana, maqui, quillay y canelo tienen su propia casa: Bosque Nativo → Semillero nativo, con banco, multiplicación, estratificación y guías del bosque.',
    go: 'bosquesem' }
];

/* ---------- Sub-pestañas ---------- */
var semilleroSub = 'banco';
function switchSemilleroSub(t) {
  semilleroSub = t;
  ['banco', 'multi', 'estrat', 'guias'].forEach(function (k) {
    var b = $('semSub-' + k), p = $('semillero-' + k);
    if (b) b.classList.toggle('btn-accent', k === t);
    if (p) p.classList.toggle('hidden', k !== t);
  });
}

function multiHtml() {
  return '<p class="muted" style="font-size:11px;line-height:1.55">No todo se multiplica por semilla. Elige la técnica según la planta y la luna: toca <b>Siembra</b> para el calendario de esta luna.</p>' +
    MULTIPLICACION.map(function (m) {
      return '<div class="menstrual-card" style="margin-top:10px"><h4>' + esc(m.t) +
        ' <span class="chip" style="font-size:9px">🌙 ' + esc(m.luna) + '</span></h4>' +
        '<p class="muted" style="font-size:10px">📅 ' + esc(m.epoca) + '</p>' +
        '<p style="font-size:11px">' + esc(m.pasos) + '</p>' +
        '<p style="font-size:11px"><b>Sirve para:</b> ' + esc(m.sirve) + '</p>' +
        '<p class="muted" style="font-size:11px">⚠️ ' + esc(m.error) + '</p></div>';
    }).join('');
}

function estratHtml() {
  var g = ESTRATIFICACION;
  return '<p class="muted" style="font-size:11px;line-height:1.55">' + g.intro + '</p>' +
    g.metodos.map(function (m) {
      return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">' + esc(m.t) + '</h4>' +
        '<p style="font-size:11px">' + esc(m.pasos) + '</p></div>';
    }).join('') +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌰 Quién pide qué</h4>' +
    g.tabla.map(function (r) {
      return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">🌰 ' + esc(r.sp) +
        ' <span class="chip" style="font-size:9px">' + esc(r.tipo) + '</span></h4>' +
        '<p style="font-size:11px">' + esc(r.que) + '</p></div>';
    }).join('') + '</div>' +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><p style="font-size:12px">' + g.test + '</p></div>';
}

function guiasHtml() {
  return '<p class="muted" style="font-size:11px;line-height:1.55">Guías cortas conectadas con el resto de la app. Toca el botón para ir a la sección.</p>' +
    GUIAS.map(function (x, i) {
      var btn = '';
      if (x.go === 'banco') btn = '<button type="button" class="btn" style="width:auto;font-size:11px" data-semgo="banco">🏺 Ir al banco</button>';
      else if (x.go === 'multi') btn = '<button type="button" class="btn" style="width:auto;font-size:11px" data-semgo="multi">🌱 Ver técnicas</button>';
      else if (x.go === 'siembra') btn = '<button type="button" class="btn" style="width:auto;font-size:11px" data-semgoto="tabSiembra">🌱 Ir a Siembra</button>';
      else if (x.go === 'bosque') btn = '<button type="button" class="btn" style="width:auto;font-size:11px" data-semgobosque="1">🌳 Ir a Bosque Nativo</button>';
      else if (x.go === 'bosquesem') btn = '<button type="button" class="btn" style="width:auto;font-size:11px" data-sembosquesem="1">🌰 Ir al Semillero nativo</button>';
      return '<div class="menstrual-card" style="margin-top:10px"><h4>' + esc(x.t) + '</h4>' +
        '<p style="font-size:11px">' + esc(x.d) + '</p>' +
        (btn ? '<div class="dlg-actions" style="justify-content:flex-start">' + btn + '</div>' : '') + '</div>';
    }).join('');
}

function wireSemilleroBtns(scope) {
  if (!scope || !scope.querySelectorAll) return;
  scope.querySelectorAll('[data-semgo]').forEach(function (b) {
    b.onclick = function () { switchSemilleroSub(b.getAttribute('data-semgo')); };
  });
  scope.querySelectorAll('[data-semgoto]').forEach(function (b) {
    b.onclick = function () {
      var t = $(b.getAttribute('data-semgoto'));
      if (t) { try { t.click(); } catch (e) {} }
    };
  });
  scope.querySelectorAll('[data-sembosquesem]').forEach(function (b) {
    b.onclick = function () {
      try { var d = $('siembraDialog'); if (d) d.close(); } catch (e) {}
      setTimeout(function () {
        try { $('btnBosque').click(); } catch (e2) {}
        setTimeout(function () { try { window.BosqueSemillero.go(); } catch (e3) {} }, 350);
      }, 150);
    };
  });
}

/* ---------- Envoltorio del render ---------- */
function buildSemilleroShell() {
  var box = $('siembraSemillasBox');
  if (!box) return;
  /* renombre defensivo del tab */
  try {
    var tab = $('tabSemillas');
    if (tab && tab.textContent.indexOf('Semillero') < 0) tab.textContent = '🌱 Semillero';
  } catch (e) {}
  /* mueve el contenido existente (inventario + trafkintu) al banco */
  var banco = document.createElement('div');
  banco.id = 'semillero-banco';
  while (box.firstChild) banco.appendChild(box.firstChild);
  var shell = document.createElement('div');
  shell.innerHTML =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="semSub-banco" class="btn btn-accent" style="width:auto">🏺 Banco de semillas</button>' +
    '<button type="button" id="semSub-multi" class="btn" style="width:auto">🌱 Multiplicación</button>' +
    '<button type="button" id="semSub-estrat" class="btn" style="width:auto">❄️ Estratificación</button>' +
    '<button type="button" id="semSub-guias" class="btn" style="width:auto">📚 Guías</button></div>' +
    '<div id="semillero-multi" class="hidden">' + multiHtml() + '</div>' +
    '<div id="semillero-estrat" class="hidden">' + estratHtml() + '</div>' +
    '<div id="semillero-guias" class="hidden">' + guiasHtml() + '</div>';
  box.appendChild(shell);
  /* orden dentro del shell: tabs, banco, multi, estrat, guias */
  shell.insertBefore(banco, shell.querySelector('#semillero-multi'));
  ['banco', 'multi', 'estrat', 'guias'].forEach(function (k) {
    var b = $('semSub-' + k);
    if (b && !b.dataset.w) { b.dataset.w = '1'; b.onclick = function () { switchSemilleroSub(k); }; }
  });
  wireSemilleroBtns(box);
  switchSemilleroSub(semilleroSub);
}

function setupSemillero() {
  if (typeof renderSiembraSemillas !== 'function' || !$('siembraSemillasBox') || !$('tabSemillas')) {
    window._semilleroRetry = (window._semilleroRetry || 0) + 1;
    if (window._semilleroRetry < 60) setTimeout(setupSemillero, 500);
    return;
  }
  try {
    var tab = $('tabSemillas');
    if (tab) tab.textContent = '🌱 Semillero';
  } catch (e) {}
  try {
    var btn = $('btnSiembra');
    if (btn && btn.dataset && btn.dataset.keywords && btn.dataset.keywords.indexOf('semillero') < 0)
      btn.dataset.keywords += ' semillero banco estratificacion multiplicacion esqueje acodo division estolon tuberculo almácigo germinacion guia';
  } catch (e) {}
  if (!window._semilleroWrapped) {
    window._semilleroWrapped = true;
    var orig = renderSiembraSemillas;
    renderSiembraSemillas = function () {
      var r = orig.apply(this, arguments);
      try { buildSemilleroShell(); } catch (e) {}
      return r;
    };
  }
}

window.Semillero = { tab: switchSemilleroSub, multi: MULTIPLICACION, estrat: ESTRATIFICACION, guias: GUIAS };
setTimeout(setupSemillero, 1200);

})();
