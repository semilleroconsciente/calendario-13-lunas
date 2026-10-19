/* ============================================================
   AYURVEDA — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa dentro de Cuerpo & Salud > Cuidado:
   - Botón btnAyurveda (grupo cuerpo, sub cuidado, tras btnNutri)
   - Diálogo ayurvedaDialog con 6 pestañas:
     1) Guía (qué es, historia Charaka/Sushruta, 5 elementos,
        3 doshas, agni y ama, ritucharya en Penco,
        dinacharya resumida, cuidados)
     2) Dosha (test 18 afirmaciones vata/pitta/kapha +
        mi dosha + cómo equilibrar cada uno)
     3) Rutina (dinacharya: 9 hábitos diarios con checklist
        por fecha + temporizador de automasaje + registro)
     4) Recetas (10 recetas tridosha y por dosha: kitchari,
        chai, leche dorada, ghee, CCF, dhal, etc. con
        buscador, filtro, favoritas y bitácora)
     5) Diario (bitácora diaria: dosha del día, agni,
        energía, descanso + nota; llevar a nota del día)
     6) Mi avance (racha, días por dosha, agni promedio,
        por luna, ritmo sugerido)
   - Todo local y privado por usuario:
     userData().ayurveda = { tests:[], miDosha:'',
       diario:{}, practs:[], favs:[], log:[] }
   - Puentes: Medicina, Nutrición, Energía y descanso,
     Respiración, Métodos. Educativo y preventivo:
     no diagnostica ni reemplaza atención médica.
     100% offline, sin dependencias.
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
  try { if (typeof cal !== 'undefined' && cal.fmtKey) return cal.fmtKey.format(new Date()); } catch (e) {}
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function lunaTxt(key) {
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' · día ' + r.diaN; }
  } catch (e) {}
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return 'Luna ' + m.luna + ' · día ' + m.dia; }
  } catch (e) {}
  return '';
}
function blank() { return { tests: [], miDosha: '', diario: {}, practs: [], favs: [], log: [] }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.ayurveda) u.ayurveda = blank();
    var e = u.ayurveda;
    if (!Array.isArray(e.tests)) e.tests = [];
    if (typeof e.miDosha !== 'string') e.miDosha = '';
    if (!e.diario || typeof e.diario !== 'object') e.diario = {};
    if (!Array.isArray(e.practs)) e.practs = [];
    if (!Array.isArray(e.favs)) e.favs = [];
    if (!Array.isArray(e.log)) e.log = [];
    return e;
  } catch (e2) { return blank(); }
}
function persist() {
  try { var u = (typeof userData === 'function') ? userData() : null; if (u) u.ayurveda = store(); } catch (e) {}
}
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {} }
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
var TABS = ['Guia', 'Dosha', 'Rutina', 'Recetas', 'Diario', 'Ava'];
function switchTab(name) {
  TABS.forEach(function (t) {
    var p = $('ay' + t), b = $('tabAy' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ============================================================
   DATOS
   ============================================================ */
var AY_DOSHAS = {
  V: { n: 'Vata · aire + éter', ico: '🌬️', col: '#7ab8ff',
    es: 'Movimiento, creatividad, liviandad. Cuerpo delgado, piel seca y fría, mente rápida que salta de idea en idea. Habla y camina rápido.',
    sube: 'Trasnoche, viajes, pantallas, café en exceso, comidas frías/secas e irregulares, otoño ventoso (Rimu) y estrés.',
    calma: 'Rutina fija, calor y abrigo, comidas tibias y untuosas (sopas, guisos, ghee), aceite tibio en cuerpo, dormir antes de las 22:30, menos pantallas.',
    sabores: 'Dulce, ácido y salado calman vata. Evita amargo, picante y astringente en exceso.',
    penco: 'En Penco el viento sur y el frío húmedo suben vata: gorro, sopa caliente y pies abrigados.' },
  P: { n: 'Pitta · fuego + agua', ico: '🔥', col: '#e76e8a',
    es: 'Transformación, foco, liderazgo. Contextura media, piel tibia que se enrojece, hambre fuerte, mente aguda y directa.',
    sube: 'Calor, sol fuerte, frituras, ají y alcohol en exceso, discusiones, exigencia, verano (Walung).',
    calma: 'Frescura sin enfriar de golpe: ensaladas tibias, coco, pepino, menta; pausas al aire libre, nadar suave, sol de mañana (no de las 13 h), hablar más lento.',
    sabores: 'Dulce, amargo y astringente calman pitta. Poco picante, ácido y salado.',
    penco: 'En Walung (verano) pitta sube: almuerzo liviano, agua fresca, sombra del mediodía y mar sin quemarse.' },
  K: { n: 'Kapha · tierra + agua', ico: '🌳', col: '#8fd694',
    es: 'Estabilidad, cariño, resistencia. Cuerpo sólido, piel suave y fresca, sueño profundo, mente calma y memoria larga. Cuesta arrancar, pero no para.',
    sube: 'Exceso de dulce, lácteos y frituras, siestas largas, sedentarismo, humedad e invierno (Pukem).',
    calma: 'Movimiento diario que haga sudar un poco, comidas livianas y picantes suaves (jengibre, pimienta), madrugar, ordenar y ventilar la casa, novedad cada luna.',
    sabores: 'Picante, amargo y astringente calman kapha. Poco dulce, ácido y salado.',
    penco: 'En Pukem (invierno) kapha pesa: caminar aunque llovizne, sopas claras con jengibre, casa ventilada 10 min al día.' }
};
var AY_TEST = [
  { c: 'V', txt: 'Soy de contextura delgada y me cuesta subir de peso.' },
  { c: 'V', txt: 'Mi piel y labios tienden a secarse; manos y pies fríos.' },
  { c: 'V', txt: 'Mi mente salta rápido de una idea a otra; me cuesta terminar.' },
  { c: 'V', txt: 'Duermo liviano y me despierto con ruidos o preocupaciones.' },
  { c: 'V', txt: 'Prefiero el calor; el viento y el frío me desordenan.' },
  { c: 'V', txt: 'Como a horas distintas y a veces se me olvida comer.' },
  { c: 'P', txt: 'Tengo hambre fuerte y me enojo si se atrasa la comida.' },
  { c: 'P', txt: 'Mi piel se enrojece o me salen granitos con calor o frituras.' },
  { c: 'P', txt: 'Soy directa/o, competitiva/o y me gusta liderar.' },
  { c: 'P', txt: 'El calor me irrita; prefiero ambientes frescos.' },
  { c: 'P', txt: 'Digiero rápido, pero me da acidez o sed intensa.' },
  { c: 'P', txt: 'Me exijo mucho y me cuesta soltar un error.' },
  { c: 'K', txt: 'Mi cuerpo es sólido y subo de peso con facilidad.' },
  { c: 'K', txt: 'Mi sueño es profundo y me cuesta levantarme temprano.' },
  { c: 'K', txt: 'Soy tranquila/o, cariñosa/o y de amistades largas.' },
  { c: 'K', txt: 'Mi digestión es lenta y quedo pesada/o tras comer mucho.' },
  { c: 'K', txt: 'Me cuesta partir (ejercicio, orden), pero una vez que parto sigo.' },
  { c: 'K', txt: 'En invierno me pongo más lenta/o, con mocos o pesadez.' }
];
var AY_LIKERT = [{ v: 0, t: 'Nunca' }, { v: 1, t: 'A veces' }, { v: 2, t: 'A menudo' }, { v: 3, t: 'Muy cierto' }];
var AY_RUTINA = [
  { id: 'despertar', n: '🌅 Despertar antes de las 6:30', d: 'Vata se calma con horario fijo; kapha despierta sin pesadez. Sin celu los primeros 15 min.' },
  { id: 'lengua', n: '👅 Limpiar lengua + dientes', d: 'Raspa suave 3-5 veces (cuchara o raspador), enjuaga. La capa blanca = ama (toxina) de anoche.' },
  { id: 'agua', n: '🍵 Agua tibia en ayunas', d: '1 taza tibia a sorbos. Despierta agni (fuego digestivo). Jengibre solo si eres kapha o día frío.' },
  { id: 'mover', n: '🚶 Mover el cuerpo 15-30 min', d: 'Caminata, yoga suave o tu entrenamiento. Kapha: que sude. Pitta: sin competir. Vata: sin agotarse.' },
  { id: 'aceite', n: '🫧 Automasaje con aceite tibio', d: 'Abhyanga 5-10 min antes de la ducha (sésamo en invierno, coco en verano). Calma vata y nutre piel.' },
  { id: 'almuerzo', n: '🍲 Almuerzo como comida principal', d: 'Al mediodía el agni está alto: come lo más completo aquí. Cena liviana y antes de las 20 h.' },
  { id: 'pausa', n: '🌬️ Pausa digestiva 5 min', d: 'Tras almorzar: 5 respiraciones lentas, caminata de 5 min. Nada de siesta larga (solo kapha 10-15 min máx).' },
  { id: 'cena', n: '🥣 Cena liviana y temprana', d: 'Sopa, verduras cocidas o kitchari suave. Evita frituras, queso pesado y helado de noche.' },
  { id: 'dormir', n: '🌙 Dormir antes de las 22:30', d: 'Infusión tibia, luz baja, pies tibios. Vata y pitta se reparan durmiendo temprano.' }
];
var AY_RECETAS = [
  { id: 'kitchari', nombre: 'Kitchari tridosha (arroz + lenteja)', icon: '🍲', dosha: 'Tridosha',
    tiempo: '40 min', rinde: '4 platos', dif: 'Fácil',
    desc: 'El plato madre del Ayurveda: arroz basmati + poroto mung o lenteja roja, suave para el agni y bueno para las 3 doshas. Ideal en menguante o tras excesos.',
    ing: [{ c: '1 taza', i: 'arroz basmati (lavado 3 veces)' }, { c: '1/2 taza', i: 'lentejas rojas o poroto mung pelado' }, { c: '1 cdta', i: 'ghee o aceite de oliva' }, { c: '1/2 cdta', i: 'cúrcuma' }, { c: '1/2 cdta', i: 'comino molido' }, { c: '1/2 cdta', i: 'coriandro molido' }, { c: '1 pizca', i: 'jengibre fresco rallado' }, { c: '5 tazas', i: 'agua caliente' }, { c: 'a gusto', i: 'sal de mar + verduras de estación (zapallo, zanahoria, acelga)' }],
    pasos: ['Dora especias 30 seg en el ghee (olor rico, sin quemar).', 'Agrega arroz + lentejas, revuelve 1 min.', 'Suma agua caliente + verduras + sal. Hierve suave 30 min hasta cremoso.', 'Reposa 5 min. Sirve tibio con limón y cilantro.'],
    uso: 'Almuerzo o cena liviana. Vata: más ghee y caldoso. Pitta: más coriandro y coco. Kapha: más jengibre y menos agua.',
    conserva: 'Olla tapada 1 día; mejor fresco. No recalentar más de 1 vez.', aviso: 'Si hay diabetes o dieta especial, ajusta la porción de arroz con tu CESFAM/nutricionista.',
    luna: '🌗 Menguante: día de kitchari simple para aligerar.' },
  { id: 'chai', nombre: 'Chai digestivo suave', icon: '🍵', dosha: 'Vata · Kapha',
    tiempo: '15 min', rinde: '2 tazas', dif: 'Muy fácil',
    desc: 'Té con especias que despierta sin acelerar: perfecto para mañanas frías de Penco. Versión sin teína para la noche.',
    ing: [{ c: '2 tazas', i: 'agua' }, { c: '1/2 taza', i: 'leche o bebida vegetal' }, { c: '3 rodajas', i: 'jengibre fresco' }, { c: '3 un', i: 'cardamomo quebrado' }, { c: '1 rama', i: 'canela pequeña' }, { c: '3 un', i: 'clavos de olor' }, { c: '1 cdta', i: 'té negro (opcional, solo mañana)' }, { c: '1 cdta', i: 'miel (al servir, nunca hervida)' }],
    pasos: ['Hierve agua con jengibre, cardamomo, canela y clavos 8 min.', 'Agrega té 2 min (si usas) + leche, hierve 2 min más.', 'Cuela, entibia y endulza con miel al servir.'],
    uso: 'Mañana o media tarde. Pitta: mitad de jengibre y sin té negro; más cardamomo.',
    conserva: 'Fresco del día. La miel nunca se hierve (el Ayurveda la considera ama si se calienta mucho).', aviso: 'Embarazo: jengibre suave y poco clavo. Hipertensión: poco regaliz si lo agregas.',
    luna: '🌒 Creciente de invierno: chai de mañana para arrancar.' },
  { id: 'dorada', nombre: 'Leche dorada (cúrcuma)', icon: '🥛', dosha: 'Vata · Kapha',
    tiempo: '10 min', rinde: '1 taza', dif: 'Muy fácil',
    desc: 'Leche tibia con cúrcuma y pimienta: abrazo nocturno para vata, articulaciones y sueño. Versión con bebida vegetal.',
    ing: [{ c: '1 taza', i: 'leche o bebida de avena/almendra' }, { c: '1/2 cdta', i: 'cúrcuma' }, { c: '1 pizca', i: 'pimienta negra (activa la cúrcuma)' }, { c: '1/4 cdta', i: 'canela' }, { c: '1 cdta', i: 'ghee o aceite de coco' }, { c: '1 cdta', i: 'miel (al servir tibia)' }],
    pasos: ['Calienta la leche sin hervir con cúrcuma, pimienta y canela 5 min.', 'Agrega el ghee, revuelve.', 'Sirve tibia (que no queme) y endulza con miel.'],
    uso: '1 h antes de dormir, 3-4 noches por semana. Pitta: media cúrcuma y más cardamomo.',
    conserva: 'Del momento. Manchas amarillas: lava altiro.', aviso: 'Cálculos biliares o anticoagulantes: pregunta a tu médico por la cúrcuma diaria.',
    luna: '🌑 Luna nueva: ritual de leche dorada + dormir temprano.' },
  { id: 'ghee', nombre: 'Ghee casero (mantequilla clarificada)', icon: '🫙', dosha: 'Tridosha',
    tiempo: '30 min', rinde: '1 frasco 250 ml', dif: 'Media',
    desc: 'El oro líquido ayurvédico: nutre, calma vata y lleva las especias a los tejidos. Dura meses sin refrigerar.',
    ing: [{ c: '500 g', i: 'mantequilla sin sal (ideal de campo)' }],
    pasos: ['Derrite a fuego bajo en olla gruesa. Hierve suave sin revolver.', 'Saca la espuma blanca con cuchara (3-4 veces).', 'Cuando esté dorado transparente y huela a nuez (20-25 min), apaga.', 'Cuela con paño limpio a frasco de vidrio. No tapes hasta que enfríe.'],
    uso: '1 cdta al día en arroz, sopas o tostada. Vata: 1-2 cdta. Kapha: 1/2 cdta.',
    conserva: 'Vidrio tapado, lugar fresco y oscuro: 3 meses. Sin agua ni cuchara mojada dentro.', aviso: 'Colesterol alto: usa poco y conversa con tu médico; no es aceite libre.',
    luna: 'Cualquier luna tranquila de mañana: el ghee pide paciencia.' },
  { id: 'ccf', nombre: 'Agua CCF (comino + cilantro + hinojo)', icon: '💧', dosha: 'Pitta · Kapha',
    tiempo: '10 min', rinde: '1 litro', dif: 'Muy fácil',
    desc: 'La infusión digestiva clásica: apaga acidez (pitta), aligera (kapha) y ordena el agni sin cafeína.',
    ing: [{ c: '1/2 cdta', i: 'semillas de comino' }, { c: '1/2 cdta', i: 'semillas de cilantro (coriandro)' }, { c: '1/2 cdta', i: 'semillas de hinojo' }, { c: '1 litro', i: 'agua' }],
    pasos: ['Hierve el agua, agrega las 3 semillas.', 'Fuego bajo 5 min, apaga y tapa 5 min.', 'Cuela a termo y toma tibio durante el día.'],
    uso: '1 taza tras almuerzo y 1 tras cena. Vata: agrega 2 rodajas de jengibre.',
    conserva: 'Termo del día. No de un día para otro.', aviso: 'Si tomas diuréticos o estás embarazada, usa mitad de dosis y consulta.',
    luna: '🌕 Llena: día de comidas grandes → CCF en el termo.' },
  { id: 'dhal', nombre: 'Dhal rojo con zapallo', icon: '🥘', dosha: 'Tridosha',
    tiempo: '35 min', rinde: '4 platos', dif: 'Fácil',
    desc: 'Guiso cremoso de lenteja roja y zapallo camote: dulce natural que calma vata y pitta, liviano para kapha si va picantito.',
    ing: [{ c: '1 taza', i: 'lentejas rojas' }, { c: '2 tazas', i: 'zapallo camote en cubos' }, { c: '1 un', i: 'zanahoria en rodajas' }, { c: '1 cdta', i: 'cúrcuma' }, { c: '1/2 cdta', i: 'comino' }, { c: '1 cdta', i: 'jengibre rallado' }, { c: '1 cda', i: 'ghee o aceite' }, { c: 'a gusto', i: 'sal, limón y cilantro' }],
    pasos: ['Cuece lentejas + zapallo + zanahoria en 5 tazas de agua 25 min.', 'Aparte dora comino + jengibre + cúrcuma en ghee 30 seg.', 'Une, sala y muele grueso. Sirve con limón y cilantro.'],
    uso: 'Almuerzo con arroz o solo en la cena. Kapha: más jengibre y pimienta; menos ghee.',
    conserva: 'Refrigerado 2 días. Agrega agua al recalentar.', aviso: 'Gases: remoja 1 h y bota el agua; come despacio y tibio.',
    luna: 'Lunas 4-6 (Pewu · primavera): dhal claro para brotar liviano.' },
  { id: 'compota', nombre: 'Compota de manzana con clavo', icon: '🍎', dosha: 'Vata · Pitta',
    tiempo: '20 min', rinde: '2 porciones', dif: 'Muy fácil',
    desc: 'Desayuno ideal vata: fruta cocida, tibia y especiada. Nada de fruta cruda helada en la mañana fría.',
    ing: [{ c: '2 un', i: 'manzanas (o peras) en cubos' }, { c: '1/2 taza', i: 'agua' }, { c: '2 un', i: 'clavos de olor' }, { c: '1/4 cdta', i: 'canela' }, { c: '1 cdta', i: 'ghee (opcional)' }, { c: '4 un', i: 'almendras remojadas y peladas (opcional)' }],
    pasos: ['Cuece manzana + agua + clavos 12 min hasta blanda.', 'Saca los clavos, agrega canela + ghee.', 'Sirve tibia con almendras encima.'],
    uso: 'Desayuno o postre de cena. Kapha: sin ghee y con más canela + jengibre.',
    conserva: 'Refrigerada 2 días; entibia antes de servir.', aviso: 'Diabetes: sin endulzar; la manzana cocida ya es dulce.',
    luna: 'Pukem (invierno): desayuno tibio todos los días.' },
  { id: 'inf-vata', nombre: 'Infusión calma-vata (manzanilla + canela)', icon: '🌙', dosha: 'Vata',
    tiempo: '8 min', rinde: '1 taza', dif: 'Muy fácil',
    desc: 'Para tardes aceleradas y noches livianas: calor dulce que baja el viento interno.',
    ing: [{ c: '1 cdta', i: 'manzanilla seca' }, { c: '1/2 rama', i: 'canela' }, { c: '2 rodajas', i: 'jengibre (opcional)' }, { c: '1 taza', i: 'agua recién hervida' }],
    pasos: ['Vierte el agua sobre todo en tazón tapado.', 'Reposa 6 min, cuela y toma tibio a sorbos.'],
    uso: 'Media tarde o 1 h antes de dormir.', conserva: 'Del momento.', aviso: 'Alergia a compuestas (manzanilla): usa solo canela + hinojo.',
    luna: 'Rimu (otoño ventoso): infusión de las 18 h.' },
  { id: 'inf-pitta', nombre: 'Infusión fresca-pitta (menta + coriandro)', icon: '🌿', dosha: 'Pitta',
    tiempo: '8 min', rinde: '1 taza', dif: 'Muy fácil',
    desc: 'Frescura sin hielo: para acidez, piel caliente y cabezas exigentes en verano.',
    ing: [{ c: '1 cdta', i: 'menta seca o 5 hojas frescas' }, { c: '1/2 cdta', i: 'semillas de coriandro' }, { c: '1 cdta', i: 'coco rallado (opcional)' }, { c: '1 taza', i: 'agua caliente (no hirviendo)' }],
    pasos: ['Infusiona tapado 6 min.', 'Cuela y toma tibio o a temperatura ambiente (nunca helado).'],
    uso: 'Tras almuerzo en días de calor.', conserva: 'Del momento.', aviso: 'Reflujo fuerte o úlcera: evita menta y consulta.',
    luna: 'Walung (verano): termo fresco-pitta para la playa.' },
  { id: 'inf-kapha', nombre: 'Infusión activa-kapha (jengibre + pimienta)', icon: '☀️', dosha: 'Kapha',
    tiempo: '10 min', rinde: '1 taza', dif: 'Muy fácil',
    desc: 'Chispa mañanera para días pesados y húmedos: despierta agni y seca la pesadez.',
    ing: [{ c: '3 rodajas', i: 'jengibre fresco' }, { c: '1 pizca', i: 'pimienta negra' }, { c: '1/2 cdta', i: 'miel (al servir tibia)' }, { c: '1 taza', i: 'agua' }],
    pasos: ['Hierve jengibre + pimienta 6 min.', 'Entibia, cuela y endulza con miel al servir.'],
    uso: 'Mañana en ayunas o media mañana. Vata/pitta: mitad de jengibre.',
    conserva: 'Del momento.', aviso: 'Gastritis, hemorroides sangrantes o embarazo: jengibre mínimo y consulta.',
    luna: 'Pukem lluvioso: arranca con esta infusión + caminata.' }
];
var AY_SABORES = [
  { n: 'Dulce', e: 'Tierra + agua', h: 'Calma V y P, sube K · arroz, leche, zapallo, dátiles' },
  { n: 'Ácido', e: 'Tierra + fuego', h: 'Calma V, sube P y K · limón, yogur, tamarindo' },
  { n: 'Salado', e: 'Agua + fuego', h: 'Calma V, sube P y K · sal de mar, algas, apio' },
  { n: 'Picante', e: 'Fuego + aire', h: 'Calma K, sube V y P · jengibre, pimienta, mostaza' },
  { n: 'Amargo', e: 'Aire + éter', h: 'Calma P y K, sube V · cúrcuma, hojas verdes, matico' },
  { n: 'Astringente', e: 'Tierra + aire', h: 'Calma P y K, sube V · lentejas, manzana, té verde' }
];
var AY_LUNAS = [
  '🌑 Nueva: intention + kitchari simple + dormir temprano. Pregunta: ¿qué hábito ordena mi agni este ciclo?',
  '🌓 Creciente: suma 1 hábito de la rutina (agua tibia, despertar fijo). Cocina 1 receta nueva.',
  '🌕 Llena: lo que comes de más se nota: CCF en el termo, cena liviana, compota en vez de postre pesado.',
  '🌗 Menguante: aligera (dhal claro, infusión kapha), ordena despensa y bota lo vencido.'
];

/* ---------- helpers dominio ---------- */
function doshaById(id) { return AY_DOSHAS[id] || AY_DOSHAS.V; }
function recetaById(id) {
  for (var i = 0; i < AY_RECETAS.length; i++) if (AY_RECETAS[i].id === id) return AY_RECETAS[i];
  return null;
}
function rachaDias() {
  var set = {};
  var e = store();
  Object.keys(e.diario || {}).forEach(function (k) { set[k] = true; });
  (e.practs || []).forEach(function (r) { set[r.fecha] = true; });
  var s = 0, cur = new Date(todayKey() + 'T12:00:00');
  if (!set[todayKey()]) cur = new Date(cur.getTime() - 86400000);
  for (var i = 0; i < 365; i++) {
    var k = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
    if (set[k]) s++; else break;
    cur = new Date(cur.getTime() - 86400000);
  }
  return s;
}

/* ============================================================
   RENDER — Dosha test
   ============================================================ */
function calcTest() {
  var sc = { V: 0, P: 0, K: 0 }, n = 0;
  for (var i = 0; i < AY_TEST.length; i++) {
    var sel = document.querySelector('input[name="ayQ' + i + '"]:checked');
    if (sel) { n++; sc[AY_TEST[i].c] += (+sel.value); }
  }
  return { sc: sc, n: n };
}
function updateProgreso() {
  var r = calcTest(), box = $('ayProgreso');
  if (box) box.textContent = r.n + ' / ' + AY_TEST.length + ' respondidas' + (r.n < AY_TEST.length ? ' — responde todas para un espejo fiel' : ' ✓ lista/o para calcular');
}
function showResultado(sc) {
  var box = $('ayResultado'); if (!box) return;
  var arr = [{ k: 'V', p: sc.V }, { k: 'P', p: sc.P }, { k: 'K', p: sc.K }];
  arr.sort(function (a, b) { return b.p - a.p; });
  var dom = arr[0].k, max = Math.max(arr[0].p, 1);
  box.classList.remove('hidden');
  box.innerHTML = '<h4>📊 Tu espejo (sin guardar)</h4>' +
    '<p class="muted su-11a508">Máximo por dosha: 18 (6 preguntas × 3). Esto orienta, <b>no diagnostica</b>: tu prakriti real la ve un profesional con pulso e historia.</p>' +
    arr.map(function (a) {
      var c = AY_DOSHAS[a.k], pct = Math.round(a.p / max * 100);
      return '<p class="su-6cb285"><b>' + c.ico + ' ' + esc(c.n) + '</b> · <b>' + a.p + '</b></p>' +
        '<div class="su-ab9537"><div style="width:' + pct + '%;height:100%;background:' + c.col + '"></div></div>';
    }).join('') +
    '<div class="si-card"><h4>' + AY_DOSHAS[dom].ico + ' Tu tendencia fuerte: ' + esc(AY_DOSHAS[dom].n) + '</h4>' +
    '<p>' + esc(AY_DOSHAS[dom].es) + '</p><p><b>Para equilibrar:</b> ' + esc(AY_DOSHAS[dom].calma) + '</p>' +
    '<p class="muted">🍽️ Sabores: ' + esc(AY_DOSHAS[dom].sabores) + '</p></div>' +
    '<div class="su-ac5453"><button type="button" class="btn btn-accent su-30e741" id="aySaveTest">💾 Guardar este test</button>' +
    '<button type="button" class="btn su-30e741" id="aySetDosha">✓ Mi dosha: ' + esc(AY_DOSHAS[dom].n) + '</button></div>';
  var sv = $('aySaveTest');
  if (sv) sv.onclick = function () {
    store().tests.push({ id: uid('ay'), fecha: todayKey(), V: sc.V, P: sc.P, K: sc.K, dom: dom });
    persist(); save('Test guardado ✓'); renderHist(); renderAva();
  };
  var st = $('aySetDosha');
  if (st) st.onclick = function () {
    store().miDosha = dom; persist(); save('Tu dosha guardado ✓');
    syncMiDosha(); renderMiDoshaBox(); renderAva(); switchTab('Rutina'); renderRutina();
  };
  try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}
function syncMiDosha() { var s = $('ayMiDosha'); if (s) s.value = store().miDosha || ''; }
function renderMiDoshaBox() {
  var box = $('ayMiDoshaBox'); if (!box) return;
  var k = store().miDosha;
  if (!k || !AY_DOSHAS[k]) { box.innerHTML = '<p class="muted su-6cb285">Aún sin definir. Haz el test 📝 o elígela arriba: es tu punto de partida, no tu jaula.</p>'; return; }
  var c = AY_DOSHAS[k];
  box.innerHTML = '<div class="menstrual-card" style="border-color:' + c.col + '55"><h4 style="color:' + c.col + '">' + c.ico + ' ' + esc(c.n) + '</h4>' +
    '<p class="su-afb724">' + esc(c.es) + '</p>' +
    '<p class="su-afb724"><b>Se sube con:</b> ' + esc(c.sube) + '</p>' +
    '<p class="su-afb724"><b>Se calma con:</b> ' + esc(c.calma) + '</p>' +
    '<p class="muted">📍 En Penco: ' + esc(c.penco) + '</p></div>';
}

/* ============================================================
   RENDER — Rutina (checklist por fecha)
   ============================================================ */
var ayRutinaChecks = {};
function practHoy() {
  var e = store(), h = todayKey();
  for (var i = 0; i < e.practs.length; i++) if (e.practs[i].fecha === h) return e.practs[i];
  return null;
}
function renderRutina() {
  var box = $('ayRutinaList'); if (!box) return;
  var f = ($('ayRutinaFecha') || {}).value || todayKey();
  if ($('ayRutinaFecha') && !$('ayRutinaFecha').value) $('ayRutinaFecha').value = f;
  var e = store(), rec = null;
  for (var i = 0; i < e.practs.length; i++) if (e.practs[i].fecha === f) rec = e.practs[i];
  var marcados = {};
  if (rec && rec.hechos) rec.hechos.forEach(function (id) { marcados[id] = true; });
  else if (f === todayKey()) marcados = ayRutinaChecks;
  var hechos = Object.keys(marcados).filter(function (k) { return marcados[k]; }).length;
  box.innerHTML = '<p class="muted su-11a508">☀️ Dinacharya (rutina diaria): <b>' + hechos + '/' + AY_RUTINA.length + '</b> hoy. Marca lo hecho y guarda el día.</p>' +
    AY_RUTINA.map(function (h) {
      var v = !!marcados[h.id];
      return '<label class="habit-today-item su-75816c' + (v ? ' done' : '') + '"><input type="checkbox" data-ay="' + h.id + '"' + (v ? ' checked' : '') + '>' +
        '<span><b>' + esc(h.n) + '</b><br><span class="muted">' + esc(h.d) + '</span></span></label>';
    }).join('');
  box.querySelectorAll('[data-ay]').forEach(function (cb) {
    cb.onchange = function () {
      var id = cb.getAttribute('data-ay');
      if (f === todayKey()) ayRutinaChecks[id] = cb.checked;
      else {
        var st = store(), r2 = null;
        for (var j = 0; j < st.practs.length; j++) if (st.practs[j].fecha === f) r2 = st.practs[j];
        if (!r2) { r2 = { id: uid('ayp'), fecha: f, hechos: [], nota: '' }; st.practs.push(r2); }
        r2.hechos = r2.hechos || [];
        var ix = r2.hechos.indexOf(id);
        if (cb.checked && ix < 0) r2.hechos.push(id);
        if (!cb.checked && ix >= 0) r2.hechos.splice(ix, 1);
        persist(); save();
      }
      var lab = cb.closest('label'); if (lab) lab.classList.toggle('done', cb.checked);
    };
  });
}

/* ============================================================
   RENDER — Recetas
   ============================================================ */
var ayFQ = '', ayFDosha = 'todas', ayOpenRec = null, ayFavOnly = false;
function renderRecetas() {
  var box = $('ayRecList'); if (!box) return;
  var q = (ayFQ || '').toLowerCase();
  var list = AY_RECETAS.filter(function (r) {
    if (ayFDosha !== 'todas' && r.dosha !== ayFDosha && r.dosha !== 'Tridosha') return false;
    if (ayFavOnly && store().favs.indexOf(r.id) < 0) return false;
    if (!q) return true;
    var t = (r.nombre + ' ' + r.desc + ' ' + r.ing.map(function (x) { return x.i; }).join(' ')).toLowerCase();
    return t.indexOf(q) >= 0;
  });
  if (!list.length) { box.innerHTML = '<p class="muted">Sin resultados. Prueba "kitchari", "jengibre" o "leche".</p>'; return; }
  box.innerHTML = list.map(function (r) {
    var fav = store().favs.indexOf(r.id) >= 0 ? '⭐' : '☆';
    return '<div class="si-card"><h4>' + esc(r.icon + ' ' + r.nombre) + '</h4>' +
      '<p><span class="chip su-0d5be0">' + esc(r.dosha) + '</span> <span class="chip su-0d5be0">⏱ ' + esc(r.tiempo) + '</span> <span class="chip su-0d5be0">🫙 ' + esc(r.rinde) + '</span></p>' +
      '<p class="muted su-11a508">' + esc(r.desc) + '</p>' +
      '<div class="su-c158a9"><button type="button" class="btn su-337714" data-open="' + r.id + '">📖 Ver</button>' +
      '<button type="button" class="btn su-337714" data-fav="' + r.id + '">' + fav + ' Fav</button>' +
      '<button type="button" class="btn su-337714" data-make="' + r.id + '">🫙 La preparé</button></div></div>';
  }).join('') + (ayOpenRec ? ayDetalleHTML(recetaById(ayOpenRec)) : '');
  box.querySelectorAll('[data-open]').forEach(function (b) { b.onclick = function () { ayOpenRec = (ayOpenRec === b.getAttribute('data-open')) ? null : b.getAttribute('data-open'); renderRecetas(); var d = $('ayDet'); if (d) try { d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {} }; });
  box.querySelectorAll('[data-fav]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-fav'); var f = store().favs; var i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.push(id); persist(); save(); renderRecetas(); renderAva(); }; });
  box.querySelectorAll('[data-make]').forEach(function (b) { b.onclick = function () {
    var r = recetaById(b.getAttribute('data-make')); if (!r) return;
    store().log.push({ id: uid('ayl'), recetaId: r.id, nombre: r.icon + ' ' + r.nombre, fecha: todayKey(), nota: '' });
    persist(); save('Preparación guardada 🫙'); renderLog(); renderAva(); switchTab('Diario');
  }; });
  var sh = box.querySelectorAll('[data-ayshare]');
  sh.forEach(function (b) { b.onclick = function () { var r = recetaById(b.getAttribute('data-ayshare')); if (r) share(r.nombre, r.icon + ' ' + r.nombre + ' — Ayurveda Penco\n' + r.dosha + ' · ' + r.tiempo + ' · ' + r.rinde + '\n\nINGREDIENTES:\n' + r.ing.map(function (x) { return '• ' + x.c + ' ' + x.i; }).join('\n') + '\n\nPREPARACIÓN:\n' + r.pasos.map(function (p, i) { return (i + 1) + '. ' + p; }).join('\n') + '\n\nUSO: ' + r.uso + '\n' + r.luna); }; });
}
function ayDetalleHTML(r) {
  if (!r) return '';
  return '<div class="menstrual-card su-ee187f" id="ayDet"><h4>' + esc(r.icon + ' ' + r.nombre) + '</h4>' +
    '<p class="muted su-11a508">' + esc(r.dosha) + ' · ⏱ ' + esc(r.tiempo) + ' · 🫙 ' + esc(r.rinde) + ' · ' + esc(r.dif) + '</p>' +
    '<h4>🧾 Ingredientes</h4>' + r.ing.map(function (x) { return '<p class="su-6cb285">• <b>' + esc(x.c) + '</b> ' + esc(x.i) + '</p>'; }).join('') +
    '<h4>👩‍🍳 Preparación</h4>' + r.pasos.map(function (p, i) { return '<p class="su-6cb285"><b>' + (i + 1) + '.</b> ' + esc(p) + '</p>'; }).join('') +
    '<div class="si-card"><p>💡 ' + esc(r.uso) + '</p><p class="muted">🫙 ' + esc(r.conserva) + '</p></div>' +
    '<div class="lawen-warn">⚠️ ' + esc(r.aviso) + '</div>' +
    '<p class="muted">' + esc(r.luna) + '</p>' +
    '<button type="button" class="btn su-30e741" data-ayshare="' + esc(r.id) + '">📤 Compartir receta</button></div>';
}

/* ============================================================
   RENDER — Diario + log + avance
   ============================================================ */
function renderDiario() {
  var box = $('ayDiarioList'); if (!box) return;
  var e = store(), keys = Object.keys(e.diario || {}).sort().reverse().slice(0, 30);
  if (!keys.length) { box.innerHTML = '<p class="muted">Sin registros. 1 minuto al día: dosha + agni + nota.</p>'; return; }
  var ico = { V: '🌬️', P: '🔥', K: '🌳', '': '🪷' };
  box.innerHTML = keys.map(function (k) {
    var r = e.diario[k];
    return '<div class="hora-item"><span class="su-6cb285"><b>' + esc(k) + '</b> ' + (ico[r.dosha] || '🪷') + ' ' + esc(r.dosha || '—') +
      ' · 🔥 agni ' + esc(String(r.agni)) + '/5 · ⚡ ' + esc(String(r.energia)) + '/5 · 😴 ' + esc(String(r.sueno)) + '/5' +
      '<br><span class="muted">' + esc(lunaTxt(k)) + (r.nota ? ' · «' + esc(r.nota) + '»' : '') + '</span></span>' +
      '<button type="button" class="btn btn-icon" data-del="' + esc(k) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { delete store().diario[b.getAttribute('data-del')]; persist(); save(); renderDiario(); renderAva(); }; });
}
function renderLog() {
  var box = $('ayLogList'); if (!box) return;
  var d = store().log.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 20);
  var st = $('ayLogStats');
  if (st) st.textContent = store().log.length + ' preparaciones · ' + store().favs.length + ' favoritas';
  if (!d.length) { box.innerHTML = '<p class="muted">Sin preparaciones. Desde 📖 Recetas pulsa “🫙 La preparé”.</p>'; return; }
  box.innerHTML = d.map(function (l) {
    return '<div class="hora-item"><span class="su-6cb285">🫙 <b>' + esc(l.nombre || '') + '</b> · ' + esc(l.fecha || '') + '</span>' +
      '<button type="button" class="btn btn-icon" data-del="' + l.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var s = store(); s.log = s.log.filter(function (x) { return x.id !== b.getAttribute('data-del'); }); persist(); save(); renderLog(); renderAva(); }; });
}
function renderHist() {
  var box = $('ayHistBox'); if (!box) return;
  var t = (store().tests || []).slice().reverse().slice(0, 10);
  if (!t.length) { box.innerHTML = '<p class="muted su-11a508">Sin tests guardados.</p>'; return; }
  box.innerHTML = t.map(function (r) {
    return '<div class="hora-item"><span class="su-11a508"><b>' + esc(r.fecha) + '</b> · 🌬️' + r.V + ' 🔥' + r.P + ' 🌳' + r.K + ' · fuerte <b>' + esc(r.dom || '') + '</b></span>' +
      '<button type="button" class="btn btn-icon" data-del="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var s = store(); s.tests = s.tests.filter(function (r) { return r.id !== b.getAttribute('data-del'); }); persist(); save(); renderHist(); renderAva(); }; });
}
function renderAva() {
  var box = $('ayAvaBox'); if (!box) return;
  var e = store();
  var keys = Object.keys(e.diario || {});
  var porD = { V: 0, P: 0, K: 0 };
  var agni = 0, nAgni = 0;
  keys.forEach(function (k) { var r = e.diario[k]; if (porD[r.dosha] !== undefined) porD[r.dosha]++; if (+r.agni > 0) { agni += (+r.agni); nAgni++; } });
  var practs = (e.practs || []).length;
  box.innerHTML = '<p class="muted su-11a508">🔥 Racha: <b>' + rachaDias() + ' días</b> · 📓 ' + keys.length + ' días de diario · ☀️ ' + practs + ' días de rutina · 🫙 ' + (e.log || []).length + ' preparaciones</p>' +
    '<p class="muted su-e13d76">🌬️ Vata ' + porD.V + ' · 🔥 Pitta ' + porD.P + ' · 🌳 Kapha ' + porD.K + (nAgni ? ' · 🔥 agni prom ' + (agni / nAgni).toFixed(1) + '/5' : '') + '</p>' +
    '<p class="muted su-11a508">Ritmo sugerido: 1 hábito nuevo por luna + diario de 1 minuto + kitchari en menguante. Lo que se repite 21 días se vuelve tu naturaleza.</p>';
}
function renderAll() { try { syncMiDosha(); renderMiDoshaBox(); } catch (e) {} try { renderRutina(); } catch (e) {} try { renderRecetas(); } catch (e) {} try { renderDiario(); } catch (e) {} try { renderLog(); } catch (e) {} try { renderHist(); } catch (e) {} try { renderAva(); } catch (e) {} try { updateProgreso(); } catch (e) {} }

/* ============================================================
   DIALOGO
   ============================================================ */
function buildDialog() {
  var testHTML = AY_TEST.map(function (q, i) {
    var opts = AY_LIKERT.map(function (o) {
      return '<label class="check-row su-a16b97"><input type="radio" name="ayQ' + i + '" value="' + o.v + '"> ' + o.t + '</label>';
    }).join('');
    return '<div class="menstrual-card su-fdf33f"><b class="su-6cb285">' + (i + 1) + '. ' + esc(q.txt) + '</b><div class="su-8fd176">' + opts + '</div></div>';
  }).join('');
  var saboresHTML = AY_SABORES.map(function (s) {
    return '<div class="habit-item"><b>' + esc(s.n) + '</b> <span class="chip su-0d5be0">' + esc(s.e) + '</span><br><span class="muted su-11a508">' + esc(s.h) + '</span></div>';
  }).join('');
  var body =
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabAyGuia" class="btn btn-accent su-30e741">📖 Guía</button>' +
    '<button type="button" id="tabAyDosha" class="btn su-30e741">🌬️ Mi dosha</button>' +
    '<button type="button" id="tabAyRutina" class="btn su-30e741">☀️ Rutina</button>' +
    '<button type="button" id="tabAyRecetas" class="btn su-30e741">📖 Recetas</button>' +
    '<button type="button" id="tabAyDiario" class="btn su-30e741">📓 Diario</button>' +
    '<button type="button" id="tabAyAva" class="btn su-30e741">📊 Mi avance</button></div>' +

    '<div id="ayGuia">' +
    '<div class="menstrual-card su-68a1a9"><h4>🪷 ¿Qué es Ayurveda?</h4>' +
    '<p class="muted su-616df7"><b>Ayur</b> (vida) + <b>veda</b> (ciencia): la “ciencia de la vida”, medicina tradicional de India con 3.000+ años. No trata solo el síntoma: ordena <b>rutina, comida, descanso y mente</b> según tu constitución. Idea de una línea: <b>come, duerme y vive según tu naturaleza y la estación</b>.</p></div>' +
    '<div class="fishing-grid su-d2c171">' +
    '<div class="menstrual-card"><h4>📜 Raíz en 1 minuto</h4><p class="muted su-6cb285"><b>Charaka Samhita</b> (medicina interna: digestión, rutinas, ética del sanador) y <b>Sushruta Samhita</b> (cirugía y anatomía) + <b>Ashtanga Hridaya</b> (resumen práctico diario). Viaja con el yoga y la meditación: mismo mapa (5 elementos, doshas, respiración). Puerta de entrada: kitchari + agua tibia + dormir temprano.</p></div>' +
    '<div class="menstrual-card"><h4>🌍 Los 5 elementos → 3 doshas</h4><p class="muted su-6cb285"><b>Éter + aire = Vata</b> (movimiento) · <b>fuego + agua = Pitta</b> (transformación) · <b>tierra + agua = Kapha</b> (estructura). Todas/os tenemos los 3; uno manda. Salud = doshas en su lugar; enfermedad = dosha fuera de lugar + <b>agni</b> (fuego digestivo) débil + <b>ama</b> (toxina) acumulada.</p></div></div>' +
    '<div class="menstrual-card"><h4>🔥 Agni y ama (las 2 palabras clave)</h4><p class="muted su-6cb285"><b>Agni</b> = tu capacidad de digerir comida, emociones e información. Señal de buen agni: hambre clara al mediodía, lengua rosada, energía estable. <b>Ama</b> = lo no digerido (lengua blanca, pesadez, gases, mente nublada). Todo lo de esta sección cuida el agni y limpia el ama: tibio, simple, a horario.</p></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🍽️ Los 6 sabores (rasa)</h4><div class="habits-list">' + saboresHTML + '</div>' +
    '<p class="muted su-11a508">Regla de oro: cada almuerzo trae los 6 en algo (aunque sea una pizca). El almuerzo es la comida principal; la cena, liviana.</p></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🌙 Ayurveda × Penco y 13 lunas</h4>' +
    AY_LUNAS.map(function (t) { return '<p class="muted su-6cb285">• ' + esc(t) + '</p>'; }).join('') +
    '<p class="muted su-e13d76">Pukem (invierno) sube kapha · Rimu (otoño ventoso) sube vata · Walung (verano) sube pitta · Pewu (primavera) invita a aligerar. Puentes: 🌿 <b>Medicina</b> · 🥗 <b>Nutrición</b> · ⚡ <b>Energía y descanso</b> · 🌬️ <b>Respiración</b>.</p></div>' +
    '<details class="menstrual-details"><summary>⚠️ Cuidados (léeme)</summary><p class="muted su-6cb285">✅ Esto es <b>sabiduría educativa y preventiva</b>, no diagnóstico ni receta médica. ✅ No suspendas remedios ni reemplaces controles (CESFAM, médico, nutricionista). ✅ Embarazo, lactancia, diabetes, hipertensión, cálculos, úlcera o anticoagulantes: usa versiones suaves y pregunta a tu profesional. ✅ Ghee, cúrcuma y jengibre son alimentos, no fármacos: van en medida. Ante dolor fuerte, fiebre alta o ideas de daño: red de apoyo y *4141 (Chile, 24 h).</p></details>' +
    '</div>' +

    '<div id="ayDosha" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>🌬️ Test: ¿qué dosha manda en mí? (18 afirmaciones)</h4>' +
    '<p class="muted su-6cb285">Responde según <b>cómo eres casi siempre</b> (tu base, no solo hoy). Nunca (0) · A veces (1) · A menudo (2) · Muy cierto (3). ~5 min. <b>No es diagnóstico</b>: es un espejo.</p>' +
    '<div class="su-3de8f9"><button type="button" id="ayTestReset" class="btn su-30e741">↺ Limpiar</button> ' +
    '<button type="button" id="ayTestCalc" class="btn btn-accent su-30e741">📊 Ver mi resultado</button></div>' +
    '<div id="ayProgreso" class="muted su-e13d76"></div></div>' +
    '<div id="ayTestBox" class="su-d2c171">' + testHTML + '</div>' +
    '<div id="ayResultado" class="menstrual-card hidden su-51d56a"></div>' +
    '<div class="menstrual-grid"><div class="menstrual-card su-68a1a9"><h4>🌱 Mi dosha base</h4>' +
    '<div class="conv-row"><label>Mi tendencia <select id="ayMiDosha"><option value="">— sin definir —</option><option value="V">🌬️ Vata · aire + éter</option><option value="P">🔥 Pitta · fuego + agua</option><option value="K">🌳 Kapha · tierra + agua</option></select></label></div>' +
    '<div id="ayMiDoshaBox" class="su-fe7b49"></div></div>' +
    '<div class="menstrual-card"><h4>🕘 Historial de tests</h4><div id="ayHistBox"></div></div></div></div>' +

    '<div id="ayRutina" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>☀️ Dinacharya — rutina del día</h4>' +
    '<p class="muted su-6cb285">Marca lo hecho y pulsa “💾 Guardar día”. 1 hábito nuevo por luna vale más que 9 un día.</p>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="ayRutinaFecha"></label></div>' +
    '<div id="ayRutinaList"></div>' +
    '<label>Nota del día <input type="text" id="ayRutinaNota" placeholder="ej: dormí 23 h, amanecí liviana" maxlength="140"></label>' +
    '<div class="dlg-actions su-41efc8"><button type="button" id="ayRutinaSave" class="btn btn-accent su-30e741">💾 Guardar día</button>' +
    '<button type="button" id="ayAbhyangaBtn" class="btn su-30e741">🫧 Automasaje 5 min</button></div>' +
    '<span id="ayAbhyangaMsg" class="muted su-6cb285"></span></div></div>' +

    '<div id="ayRecetas" class="hidden">' +
    '<div class="conv-row"><label class="su-4b3de7">🔍 Buscar <input type="text" id="ayQ" placeholder="kitchari, jengibre, leche..." maxlength="40"></label>' +
    '<label>Dosha <select id="ayFDosha"><option value="todas">Todas</option><option value="Tridosha">Tridosha</option><option value="Vata · Kapha">Vata · Kapha</option><option value="Vata · Pitta">Vata · Pitta</option><option value="Vata">Vata</option><option value="Pitta · Kapha">Pitta · Kapha</option><option value="Pitta">Pitta</option><option value="Kapha">Kapha</option></select></label>' +
    '<label class="check-row su-988f60"><input type="checkbox" id="ayFavOnly"> ⭐ solo favs</label></div>' +
    '<div id="ayRecList" class="su-be747f"></div></div>' +

    '<div id="ayDiario" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>📓 Registro de hoy (1 minuto)</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="ayDiaFecha"></label>' +
    '<label>Dosha del día <select id="ayDiaDosha"><option value="">—</option><option value="V">🌬️ Vata</option><option value="P">🔥 Pitta</option><option value="K">🌳 Kapha</option></select></label></div>' +
    '<div class="conv-row su-8a77e5"><label>🔥 Agni 1–5 <input type="number" id="ayDiaAgni" min="1" max="5" value="3"></label>' +
    '<label>⚡ Energía 1–5 <input type="number" id="ayDiaEnergia" min="1" max="5" value="3"></label>' +
    '<label>😴 Descanso 1–5 <input type="number" id="ayDiaSueno" min="1" max="5" value="3"></label></div>' +
    '<label>Nota <input type="text" id="ayDiaNota" placeholder="ej: almuerzo a horario, lengua rosada, ánimo estable" maxlength="140"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="ayDiaAdd" class="btn btn-accent su-30e741">+ Guardar hoy</button></div></div>' +
    '<div id="ayDiarioList" class="habits-list su-ebf445"></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🫙 Mis preparaciones</h4><div id="ayLogList" class="habits-list"></div>' +
    '<div class="dlg-actions su-efea1d"><span id="ayLogStats" class="muted su-11a508"></span>' +
    '<span class="su-3de8f9"><button type="button" id="ayToNote" class="btn su-30e741">📝 Llevar a nota de hoy</button>' +
    '<button type="button" id="ayShare" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="ayClear" class="btn su-214f75">🗑 Borrar diario</button></span></div></div></div>' +

    '<div id="ayAva" class="hidden"><div id="ayAvaBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="si-card"><h4>🌙 Cierre de luna (3 líneas)</h4><p>En tu cuaderno o nota del día:<br><b>1)</b> ¿Cómo estuvo mi agni esta luna?<br><b>2)</b> ¿Qué dosha se movió más?<br><b>3)</b> ¿Qué hábito sostengo la próxima luna?<br>Lengua rosada + hambre al mediodía + sueño seguido = vas bien.</p></div></div>';
  makeDialog('ayurvedaDialog', '🪷 Ayurveda — ciencia de la vida',
    'Rutina, comida y descanso según tu dosha y la estación pencona. Test, dinacharya, 10 recetas y diario por lunas. Todo <b>privado y local</b>.',
    body);
}

/* ---------- temporizador abhyanga ---------- */
var ayAbhTimer = null;
function runAbhyanga() {
  var msg = $('ayAbhyangaMsg'), btn = $('ayAbhyangaBtn');
  if (!msg) return;
  if (ayAbhTimer) { clearInterval(ayAbhTimer); ayAbhTimer = null; if (btn) btn.textContent = '🫧 Automasaje 5 min'; msg.textContent = ''; return; }
  var seg = 300;
  if (btn) btn.textContent = '⏹ Detener';
  msg.textContent = 'Aceite tibio en coronilla, orejas, manos y pies… 5:00';
  ayAbhTimer = setInterval(function () {
    seg--;
    if (seg <= 0) {
      clearInterval(ayAbhTimer); ayAbhTimer = null;
      if (btn) btn.textContent = '🫧 Automasaje 5 min';
      msg.textContent = '✓ Listo. Ducha tibia, sin jabón fuerte. Anota cómo quedó tu piel.';
      try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
      return;
    }
    var m = Math.floor(seg / 60), s = seg % 60;
    if (seg === 150) msg.textContent = 'Mitad: cambia de lado, respira lento… 2:30';
    else if (seg === 60) msg.textContent = 'Último minuto: pies y manos… 1:00';
    else msg.textContent = 'Masaje circular, sin apuro… ' + m + ':' + String(s).padStart(2, '0');
  }, 1000);
}

function openAy() {
  try {
    if ($('ayRutinaFecha') && !$('ayRutinaFecha').value) $('ayRutinaFecha').value = todayKey();
    if ($('ayDiaFecha') && !$('ayDiaFecha').value) $('ayDiaFecha').value = todayKey();
    renderAll();
  } catch (e) {}
  openDlg('ayurvedaDialog');
}
try { window.openAyurveda = openAy; window.openAyurvedaDialog = openAy; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar botón en Cuerpo > cuidado (tras Nutrición) */
  try {
    if (!$('btnAyurveda')) {
      var g = document.querySelector('.action-group[data-group="cuerpo"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnAyurveda'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🪷 Ayurveda';
        try { btn.setAttribute('data-sub', 'cuidado'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'ayurveda dosha vata pitta kapha agni ama dinacharya kitchari ghee chai leche dorada abhyanga rutina desayuno digestion india charaka masaje aceite');
        var ref = g.querySelector('#btnNutri') || g.querySelector('#btnMedic');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnAyurveda');
        var curG = cur.closest ? cur.closest('.action-group') : null;
        var curN = curG && curG.getAttribute ? curG.getAttribute('data-group') : null;
        if (curN && curN !== 'cuerpo') {
          var gd = document.querySelector('.action-group[data-group="cuerpo"] .group-btns');
          if (gd) { gd.appendChild(cur); try { cur.setAttribute('data-sub', 'cuidado'); } catch (eS2) {} }
        }
      } catch (eM) {}
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnAyurveda') < 0) ALL_BTNS.push('btnAyurveda');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnAyurveda = ['cuerpo', 'cuidado'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['cuerpo|cuidado'] && BTN_ORDER['cuerpo|cuidado'].indexOf('btnAyurveda') < 0) {
      var oi = BTN_ORDER['cuerpo|cuidado'].indexOf('btnNutri');
      if (oi >= 0) BTN_ORDER['cuerpo|cuidado'].splice(oi + 1, 0, 'btnAyurveda');
      else BTN_ORDER['cuerpo|cuidado'].push('btnAyurveda');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnAyurveda = true; });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Cuerpo) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnAyurveda"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Cuerpo') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnAyurveda"> 🪷 Ayurveda';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnAyurveda !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnAyurveda = lab.querySelector('input').checked;
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
  /* keywords cruzadas */
  try { addKw('btnMedic', 'ayurveda dosha agni hierbas'); } catch (e2) {}
  try { addKw('btnNutri', 'ayurveda kitchari ghee dosha comida'); } catch (e3) {}
  try { addKw('btnEnergia', 'ayurveda dormir rutina descanso agni'); } catch (e4) {}
  try { addKw('btnBreath', 'ayurveda pranayama respiracion calma'); } catch (e5) {}
  try { addKw('btnMetodos', 'ayurveda india dosha'); } catch (e6) {}

  /* 4) diálogo + eventos */
  buildDialog();
  renderAll();

  var b = $('btnAyurveda');
  if (b) b.onclick = function () { openAy(); };

  TABS.forEach(function (t) {
    var tb = $('tabAy' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  document.querySelectorAll('input[name^="ayQ"]').forEach(function (r) { r.onchange = updateProgreso; });
  var tc = $('ayTestCalc'); if (tc) tc.onclick = function () { var r = calcTest(); if (r.n < AY_TEST.length) { alert('Responde las ' + AY_TEST.length + ' afirmaciones para un espejo fiel (' + r.n + '/' + AY_TEST.length + ')'); return; } showResultado(r.sc); };
  var tr = $('ayTestReset'); if (tr) tr.onclick = function () { document.querySelectorAll('input[name^="ayQ"]').forEach(function (x) { x.checked = false; }); var bx = $('ayResultado'); if (bx) bx.classList.add('hidden'); updateProgreso(); };
  var md = $('ayMiDosha'); if (md) md.onchange = function () { store().miDosha = md.value || ''; persist(); save('Tu dosha guardado ✓'); renderMiDoshaBox(); renderAva(); };

  var rf = $('ayRutinaFecha'); if (rf) rf.onchange = function () { ayRutinaChecks = {}; renderRutina(); };
  var ab = $('ayAbhyangaBtn'); if (ab) ab.onclick = runAbhyanga;
  var rs = $('ayRutinaSave');
  if (rs) rs.onclick = function () {
    var f = ($('ayRutinaFecha') || {}).value || todayKey();
    var hechos = [];
    document.querySelectorAll('#ayRutinaList [data-ay]').forEach(function (cb) { if (cb.checked) hechos.push(cb.getAttribute('data-ay')); });
    if (!hechos.length) { alert('Marca al menos 1 hábito de la rutina ☀️'); return; }
    var nota = clean((($('ayRutinaNota') || {}).value || '').trim(), 140);
    var st = store(), found = null;
    for (var i = 0; i < st.practs.length; i++) if (st.practs[i].fecha === f) found = st.practs[i];
    if (found) { found.hechos = hechos; found.nota = nota; }
    else st.practs.push({ id: uid('ayp'), fecha: f, hechos: hechos, nota: nota });
    if (f === todayKey()) ayRutinaChecks = {};
    persist(); save('Día de rutina guardado ☀️');
    if ($('ayRutinaNota')) $('ayRutinaNota').value = '';
    renderRutina(); renderAva();
  };

  var qq = $('ayQ'); if (qq) qq.oninput = function () { ayFQ = qq.value; renderRecetas(); };
  var fd = $('ayFDosha'); if (fd) fd.onchange = function () { ayFDosha = fd.value; renderRecetas(); };
  var fo = $('ayFavOnly'); if (fo) fo.onchange = function () { ayFavOnly = fo.checked; renderRecetas(); };

  var da = $('ayDiaAdd');
  if (da) da.onclick = function () {
    var f = ($('ayDiaFecha') || {}).value || todayKey();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return alert('Fecha inválida');
    var st = store();
    st.diario[f] = {
      dosha: ($('ayDiaDosha') || {}).value || '',
      agni: Math.min(5, Math.max(1, +((($('ayDiaAgni') || {}).value) || 3))),
      energia: Math.min(5, Math.max(1, +((($('ayDiaEnergia') || {}).value) || 3))),
      sueno: Math.min(5, Math.max(1, +((($('ayDiaSueno') || {}).value) || 3))),
      nota: clean((($('ayDiaNota') || {}).value || '').trim(), 140)
    };
    persist(); save('Día guardado 📓');
    if ($('ayDiaNota')) $('ayDiaNota').value = '';
    renderDiario(); renderAva();
  };
  var tn = $('ayToNote');
  if (tn) tn.onclick = function () {
    var keys = Object.keys(store().diario || {}).sort().reverse();
    if (!keys.length) return alert('Sin registros aún');
    var k = keys[0], r = store().diario[k];
    var txt = ('🪷 Ayurveda ' + k + ': ' + (r.dosha ? AY_DOSHAS[r.dosha].n : 'sin dosha') + ' · agni ' + r.agni + '/5 · energía ' + r.energia + '/5' + (r.nota ? ' — ' + r.nota : '')).slice(0, 280);
    try {
      var info = (typeof todayInfo === 'function') ? todayInfo() : null;
      if (!info) return alert('No se pudo ubicar hoy');
      if (info.luna === 'dft') { var cy = cyc(currentCycleYear()); cy.dft.nota = (cy.dft.nota ? cy.dft.nota + '\n' : '') + txt; }
      else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + txt; }
      save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
      alert('Llevado a la nota de hoy ✓');
    } catch (e2) { alert('No se pudo llevar a la nota'); }
  };
  var sh = $('ayShare');
  if (sh) sh.onclick = function () {
    var keys = Object.keys(store().diario || {}).sort().reverse().slice(0, 7);
    var t = keys.length ? '🪷 Mi Ayurveda (últimos)\n' + keys.map(function (k) { var r = store().diario[k]; return '• ' + k + ' · ' + (r.dosha || '—') + ' · agni ' + r.agni + ' · en ' + r.energia + (r.nota ? ' — ' + r.nota : ''); }).join('\n') : '🪷 Sin registros aún';
    share('Mi Ayurveda', t);
  };
  var cl = $('ayClear');
  if (cl) cl.onclick = function () { if (!confirm('¿Borrar todo tu diario ayurvédico? (tests y recetas se mantienen)')) return; store().diario = {}; store().practs = []; ayRutinaChecks = {}; persist(); save(); renderDiario(); renderRutina(); renderAva(); };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

try { window.cal13ayurveda = { store: store }; } catch (e) {}

})();
