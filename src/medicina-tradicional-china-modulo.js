/* ============================================================
   MEDICINA TRADICIONAL CHINA — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa dentro de Cuerpo & Salud > Cuidado:
   - Botón btnMTC (grupo cuerpo, sub cuidado, tras btnAyurveda)
   - Diálogo mtcDialog con 6 pestañas:
     1) Guía (qué es 中医, historia: Huangdi Neijing, Shennong,
        Zhang Zhongjing, Sun Simiao, Li Shizhen; Yin-Yang,
        Qi-Xue-Jinye-Jing-Shen, 5 fases Wu Xing con ciclos
        Sheng/Ke, Zang-Fu, causas de enfermar, 4 exámenes,
        MTC x Penco y 13 lunas, cuidados)
     2) Elemento (test 20 afirmaciones Madera/Fuego/Tierra/
        Metal/Agua + mi fase + cómo equilibrar cada una)
     3) Reloj (reloj de órganos 12 ramas x 2 h: qué órgano
        manda, qué hacer y evitar, hora actual destacada)
     4) Prácticas (Baduanjin 8 piezas + acupresión 8 puntos
        con localización y precauciones + 5 recetas de
        congee/tes/sopas + temporizador qigong 5 min)
     5) Diario (bitácora diaria: fase del día, energía,
        digestión, descanso, emoción + nota; log de
        prácticas y puntos; llevar a nota del día)
     6) Mi avance (racha, días por fase, promedios,
        por luna, ritmo sugerido)
   - Todo local y privado por usuario:
     userData().mtc = { tests:[], miElemento:'',
       diario:{}, practs:[], favsPuntos:[], logPuntos:[] }
   - Puentes: Ayurveda, Tao, Mantak Chia, Nutrición, Energía
     y descanso, Respiración, Rituales, Chino Mandarín,
     Feng Shui. Educativo y preventivo: no diagnostica,
     no receta hierbas ni reemplaza atención médica.
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
function blank() { return { tests: [], miElemento: '', diario: {}, practs: [], favsPuntos: [], logPuntos: [] }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.mtc) u.mtc = blank();
    var e = u.mtc;
    if (!Array.isArray(e.tests)) e.tests = [];
    if (typeof e.miElemento !== 'string') e.miElemento = '';
    if (!e.diario || typeof e.diario !== 'object') e.diario = {};
    if (!Array.isArray(e.practs)) e.practs = [];
    if (!Array.isArray(e.favsPuntos)) e.favsPuntos = [];
    if (!Array.isArray(e.logPuntos)) e.logPuntos = [];
    return e;
  } catch (e2) { return blank(); }
}
function persist() {
  try { var u = (typeof userData === 'function') ? userData() : null; if (u) u.mtc = store(); } catch (e) {}
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
var TABS = ['Guia', 'Elem', 'Reloj', 'Pract', 'Diario', 'Ava'];
function switchTab(name) {
  TABS.forEach(function (t) {
    var p = $('mtc' + t), b = $('tabMtc' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ============================================================
   DATOS — 5 fases (Wu Xing 五行)
   ============================================================ */
var MTC_ELEMS = {
  MA: { n: 'Madera · 木 Mù', ico: '🌳', col: '#6fbf73',
    org: 'Hígado (Gan 肝) + Vesícula biliar (Dan 胆)',
    emo: 'Ira / frustración (Nu 怒) — su virtud es la benevolencia (Ren 仁)',
    sabor: 'Ácido (suan 酸) en medida; el exceso ácido daña Hígado',
    clima: 'Viento (Feng 风)', est: 'Primavera (Pewu) — brotar, planificar',
    es: 'Crecer y decidir: visión, planificación, flexibilidad como el bambú. Cuerpo: tendones, uñas, ojos. Se nota en la mirada y en el tono de voz (grito).',
    sube: 'Rabia contenida, trasnoche (el Hígado se repara 1-3 am), alcohol y frituras en exceso, viento frío en cuello, planes rígidos que no se doblan.',
    calma: 'Acostarse antes de las 23 h, mirar verde y horizonte, caminar sin competir, comidas tibias con un toque ácido (limón, vinagre de manzana), estirar tendones, expresar a tiempo en vez de acumular.',
    penco: 'Viento sur de Rimu + trasnoche = cuello tieso y genio corto. Gorro/bufanda al viento, cena liviana y cama antes de las 23 h.' },
  FU: { n: 'Fuego · 火 Huǒ', ico: '🔥', col: '#e76e8a',
    org: 'Corazón (Xin 心) + Intestino delgado · Pericardio + Triple Recalentador',
    emo: 'Alegría (Xi 喜) — en exceso euforia/manía; su virtud es el ritual y el respeto (Li 礼)',
    sabor: 'Amargo (ku 苦) en medida; el exceso amargo dispersa',
    clima: 'Calor (Shu 暑)', est: 'Verano (Walung) — florecer, conectar',
    es: 'Encender y conectar: ánimo, palabra clara, risa, sueño reparador. Cuerpo: sangre y vasos, lengua, sudor. Se escucha en la risa y se ve en el brillo de los ojos.',
    sube: 'Exigencia + calor + café de más, pantallas hasta tarde, discusiones al mediodía, duelo no llorado (el Fuego necesita calma para abrazar).',
    calma: 'Pausas sin pantalla, sol de mañana (no de las 13 h), comidas frescas-tibias (nunca heladas), amargo suave (lechuga, té liviano), dormir antes de medianoche, reír y conversar sin pelear.',
    penco: 'En Walung el calor sube el Fuego: almuerzo liviano, sombra del mediodía, mar sin quemarse y siesta corta (máx 20 min).' },
  TI: { n: 'Tierra · 土 Tǔ', ico: '🌾', col: '#d9a441',
    org: 'Bazo (Pi 脾) + Estómago (Wei 胃)',
    emo: 'Preocupación/pensar en círculos (Si 思) — su virtud es la confianza (Xin 信)',
    sabor: 'Dulce (gan 甘) natural en medida; el exceso de azúcar daña Bazo',
    clima: 'Humedad (Shi 湿)', est: 'Canícula / entre-estaciones — cosechar, digerir',
    es: 'Digerir y sostener: transforma comida y pensamientos en energía (Gu Qi). Cuerpo: músculos, labios, saliva. Se nota en el apetito del mediodía y en la voz cantada.',
    sube: 'Azúcar y harinas en exceso, comer apurada/o o estudiando, humedad de Penco (ropa húmeda, casa sin ventilar), rumiar sin decidir.',
    calma: 'Comer tibio y a horario (almuerzo lo más completo al mediodía), masticar, sopas y congee, jengibre suave, ventilar 10 min al día, escribir la preocupación y elegir 1 paso.',
    penco: 'Humedad de Pukem pesa la Tierra: sopa clara con jengibre, casa ventilada, caminar aunque llovizne, cena antes de las 20 h.' },
  ME: { n: 'Metal · 金 Jīn', ico: '⚙️', col: '#9aa7b8',
    org: 'Pulmón (Fei 肺) + Intestino grueso (Da Chang 大肠)',
    emo: 'Tristeza/duelo (Bei 悲) — su virtud es la rectitud y el soltar (Yi 义)',
    sabor: 'Picante (xin 辛) suave en medida; el exceso picante dispersa el Qi',
    clima: 'Sequedad (Zao 燥)', est: 'Otoño (Rimu) — soltar, ordenar',
    es: 'Respirar y soltar: toma lo puro (aire) y suelta lo turbio (tristeza, heces, piel que se renueva). Cuerpo: piel, vello, nariz, mocos. Se escucha en el llanto y el suspiro.',
    sube: 'Duelo guardado, encierro sin aire, otoño ventoso sin abrigo, picante y alcohol de más, estreñimiento o diarrea por nervios.',
    calma: 'Respirar largo (exhala más que inhalas), caminar al aire libre, pera cocida y miel suave, ordenar 1 cajón (soltar afuera ordena adentro), llorar cuando toca, abrigar cuello y pecho.',
    penco: 'Rimu ventoso seca el Metal: bufanda, infusión tibia, caminata costera suave y soltar 1 cosa por luna (ropa, papel, rencor).' },
  AG: { n: 'Agua · 水 Shuǐ', ico: '💧', col: '#5aa9e6',
    org: 'Riñón (Shen 肾) + Vejiga (Pang Guang 膀胱)',
    emo: 'Miedo (Kong 恐) — su virtud es la sabiduría y la voluntad (Zhi 志)',
    sabor: 'Salado (xian 咸) en medida; el exceso salado daña Riñón',
    clima: 'Frío (Han 寒)', est: 'Invierno (Pukem) — guardar, descansar',
    es: 'Guardar la esencia (Jing 精): huesos, médula, oídos, pelo, fertilidad y voluntad. Es tu batería profunda: se carga durmiendo y se gasta con exceso (trabajo sin pausa, sustos, frío).',
    sube: 'Trasnoche crónico, frío en cintura y pies, exceso de sal o de estimulantes, miedo que paraliza, sobrefuerzo sin descanso.',
    calma: 'Dormir temprano y abrigar cintura-pies-riñones, caldos y legumbres tibias, sal moderada, negro y azul en el plato (porotos negros, cochayuyo), silencio y descanso real en Pukem.',
    penco: 'Frío húmedo de Pukem entra por pies y cintura: calcetines de lana, guatero en lumbares, caldo nocturno y cama antes de las 22:30.' }
};
var MTC_CICLOS = [
  { n: 'Generar (Sheng 生) — la madre nutre al hijo', d: 'Madera → Fuego → Tierra → Metal → Agua → Madera. Ej: buen descanso (Agua) nutre la decisión (Madera); comer a horario (Tierra) sostiene la respiración (Metal).' },
  { n: 'Controlar (Ke 克) — el abuelo frena al nieto', d: 'Madera frena Tierra · Tierra frena Agua · Agua frena Fuego · Fuego frena Metal · Metal frena Madera. Ej: el enojo (Madera desatada) revuelve la digestión (Tierra); el miedo (Agua) apaga la alegría (Fuego).' }
];
var MTC_TEST = [
  { c: 'MA', txt: 'Tengo visión y planes, pero me frustro cuando las cosas no avanzan a mi ritmo.' },
  { c: 'MA', txt: 'Siento tensión en cuello, hombros o sien; a veces rechinan mis dientes o me duele la cabeza lateral.' },
  { c: 'MA', txt: 'Me cuesta dormirme entre las 1 y 3 am, o despierto con rabia/preocupación a esa hora.' },
  { c: 'MA', txt: 'Mis ojos se cansan o se secan fácil (pantalla, viento); mis uñas se quiebran.' },
  { c: 'FU', txt: 'Soy entusiasta y conversadora/or, pero me acelero y me cuesta parar.' },
  { c: 'FU', txt: 'Mi sueño es liviano: me despierto, sueño mucho o sudo de noche.' },
  { c: 'FU', txt: 'Noto palpitaciones, cara roja o aftas en la lengua cuando estoy exigida/o.' },
  { c: 'FU', txt: 'Paso de la risa al llanto o al enojo rápido cuando hay calor o estrés.' },
  { c: 'TI', txt: 'Pienso en círculos lo mismo (rumio), sobre todo de noche.' },
  { c: 'TI', txt: 'Mi digestión es pesada: hinchazón, gases o sueño tras comer; amo lo dulce.' },
  { c: 'TI', txt: 'Me siento pesada/o y con niebla cuando hay humedad (lluvia, casa encerrada).' },
  { c: 'TI', txt: 'Como apurada/o, a deshoras o frente a pantalla.' },
  { c: 'ME', txt: 'Me resfrío fácil con cambios de clima; sufro de nariz tapada, alergia o piel seca.' },
  { c: 'ME', txt: 'Guardo penas sin llorar; me cuesta soltar (cosas, personas, rencores).' },
  { c: 'ME', txt: 'Mi intestino es irregular: estreñimiento o soltura con nervios.' },
  { c: 'ME', txt: 'Suspiro mucho o siento el pecho apretado.' },
  { c: 'AG', txt: 'Siento miedo o inseguridad que me frena (aunque nadie lo note).' },
  { c: 'AG', txt: 'Me canso de fondo: dolor lumbar, rodillas débiles, oídos con pito o caída de pelo.' },
  { c: 'AG', txt: 'Paso frío en pies y cintura; orino mucho de noche.' },
  { c: 'AG', txt: 'Trasnocho seguido y al día siguiente funciono con café.' }
];
var MTC_LIKERT = [{ v: 0, t: 'Nunca' }, { v: 1, t: 'A veces' }, { v: 2, t: 'A menudo' }, { v: 3, t: 'Muy cierto' }];

/* Reloj de órganos (Zi Wu Liu Zhu simplificado educativo) */
var MTC_RELOJ = [
  { h: '23–01', org: 'Vesícula biliar · Dan 胆', el: 'Madera', hacer: 'Dormir profundo: se decide y se repara la vesícula. Cena liviana 3 h antes.', evitar: 'Trasnochar, discutir o comer frituras de noche.', senal: 'Amargor matinal, insomnio 23-1 h, indecisión crónica.' },
  { h: '01–03', org: 'Hígado · Gan 肝', el: 'Madera', hacer: 'Sueño profundo: el Hígado guarda la sangre y ordena tendones y ojos.', evitar: 'Alcohol de noche, pantallas en cama, rabia antes de dormir.', senal: 'Despertar 1-3 am, ojos secos, uñas quebradizas, genio corto.' },
  { h: '03–05', org: 'Pulmón · Fei 肺', el: 'Metal', hacer: 'Sueño suave o despertar tranquilo; ventilar la pieza; toser/drenar con calma si hay moco.', evitar: 'Fumar, aire helado directo, hablar gritando al despertar.', senal: 'Tos de madrugada, nariz tapada, tristeza matinal, piel seca.' },
  { h: '05–07', org: 'Intestino grueso · Da Chang 大肠', el: 'Metal', hacer: 'Despertar, vaso de agua tibia, ir al baño sin apuro: soltar lo de ayer.', evitar: 'Aguantar las ganas, partir corriendo sin evacuar.', senal: 'Estreñimiento, piel con granitos, dificultad para soltar.' },
  { h: '07–09', org: 'Estómago · Wei 胃', el: 'Tierra', hacer: 'Desayuno tibio y sentado (avena, compota, sopa): el Estómago recibe.', evitar: 'Ayuno con frío + café solo, fruta helada, salir sin comer.', senal: 'Sin hambre matinal, acidez, boca amarga, pesadez.' },
  { h: '09–11', org: 'Bazo · Pi 脾', el: 'Tierra', hacer: 'Trabajo mental fuerte: el Bazo transforma comida en ideas. Colación simple si hay hambre.', evitar: 'Dulces y bebidas de golpe, rumiar sin pausa.', senal: 'Sueño post-desayuno, hinchazón, pensar en círculos.' },
  { h: '11–13', org: 'Corazón · Xin 心', el: 'Fuego', hacer: 'Almuerzo como comida principal, conversado y sin pelea. Pausa de 5 respiraciones después.', evitar: 'Discutir al almuerzo, exigirse al máximo justo después.', senal: 'Palpitaciones, cara roja, lengua con aftas, dispersión.' },
  { h: '13–15', org: 'Intestino delgado · Xiao Chang 小肠', el: 'Fuego', hacer: 'Separar lo puro de lo turbio: caminar 5-10 min, agua tibia, ordenar ideas.', evitar: 'Siesta larga, fritura de sobremesa, decisiones grandes con sueño.', senal: 'Hinchazón de tarde, orina escasa, mente nublada.' },
  { h: '15–17', org: 'Vejiga · Pang Guang 膀胱', el: 'Agua', hacer: 'Mover el cuerpo: caminar, estirar espalda; tomar agua a sorbos.', evitar: 'Aguantar orina, estar 4 h sentada/o sin parar.', senal: 'Cansancio de tarde, espalda tensa, dolor de cabeza posterior.' },
  { h: '17–19', org: 'Riñón · Shen 肾', el: 'Agua', hacer: 'Cena liviana y temprana, abrigo en cintura, guardar energía: menos pantalla.', evitar: 'Cena pesada y salada, frío en pies, trasnoche.', senal: 'Lumbago, oídos tapados/pito, miedo nocturno, orina nocturna.' },
  { h: '19–21', org: 'Pericardio · Xin Bao 心包', el: 'Fuego', hacer: 'Calma y cariño: té suave, conversar, leer, masaje de manos; proteger el Corazón.', evitar: 'Noticias que encienden, discusiones, trabajo hasta tarde.', senal: 'Opresión pecho, manos frías/calientes, ansiedad de tarde-noche.' },
  { h: '21–23', org: 'Triple Recalentador · San Jiao 三焦', el: 'Fuego', hacer: 'Apagar la casa: luz baja, pies tibios, preparar mañana. Dormir antes de las 23 h.', evitar: 'Ejercicio fuerte, ducha helada, celu en cama.', senal: 'Insomnio de las 23 h, cansancio que no se repara, hinchazón errante.' }
];
function relojAhora() {
  var h = new Date().getHours();
  var idx = Math.floor(((h + 1) % 24) / 2);
  return { idx: idx, item: MTC_RELOJ[idx] };
}

/* Acupresión educativa (sin agujas) */
var MTC_PUNTOS = [
  { id: 'hegu', cod: 'IG4 Hegu 合谷', ico: '🤲', fase: 'Metal',
    donde: 'Dorso de la mano: junta pulgar e índice, presiona el montículo que se forma.',
    como: 'Presión firme del pulgar contrario 1-2 min por mano, respirando lento.',
    uso: 'Tradición: cabeza tensa, nariz tapada, dolor de muela, estreñimiento por tensión. Punto de “soltar”.',
    aviso: 'Embarazo: NO presionar fuerte (tradición lo evita). No reemplaza dentista ni médico.' },
  { id: 'zusanli', cod: 'E36 Zusanli 足三里', ico: '🦵', fase: 'Tierra',
    donde: 'Bajo la rodilla: 4 dedos bajo la rótula, 1 dedo al lado externo de la tibia.',
    como: 'Presión circular 2 min por pierna, tibio (ideal tras caminar).',
    uso: 'Tradición: digestión pesada, cansancio, defensas bajas. El punto “para caminar 3 leguas más”.',
    aviso: 'Con várices o dolor fuerte en la zona, solo tacto suave y consulta kine/médico.' },
  { id: 'taichong', cod: 'H3 Taichong 太冲', ico: '🦶', fase: 'Madera',
    donde: 'Empeine: entre 1.º y 2.º dedo, 2 dedos hacia el tobillo desde la “V”.',
    como: 'Presión media 1 min por pie + 5 respiraciones 4-6.',
    uso: 'Tradición: frustración, cabeza tensa lateral, ojos cansados, calambres por tensión.',
    aviso: 'Si hay diabetes con pie insensible: tacto muy suave, sin frotar fuerte.' },
  { id: 'neiguan', cod: 'PC6 Neiguan 内关', ico: '🤍', fase: 'Fuego',
    donde: 'Antebrazo interno: 3 dedos desde la muñeca, entre los dos tendones centrales.',
    como: 'Presión media 1-2 min por brazo.',
    uso: 'Tradición: náuseas/mareo (viaje, embarazo leve), opresión pecho, ansiedad con palpitaciones.',
    aviso: 'Si hay dolor pecho fuerte, desmayo o presión alta descompensada: urgencia, no punto.' },
  { id: 'shenmen', cod: 'C7 Shenmen 神门', ico: '🌙', fase: 'Fuego',
    donde: 'Muñeca interna lado meñique: huequito junto al huesito redondo.',
    como: 'Tacto suave circular 1 min por muñeca antes de dormir.',
    uso: 'Tradición: mente inquieta, insomnio por pensar, susto. “Puerta del espíritu”.',
    aviso: 'Insomnio de semanas o angustia fuerte: pide apoyo (CESFAM, *4141 Chile 24 h).' },
  { id: 'yongquan', cod: 'R1 Yongquan 涌泉', ico: '🦶', fase: 'Agua',
    donde: 'Planta del pie: hueco que se forma al doblar los dedos, tercio delantero.',
    como: 'Frota con nudillos o pelota 1-2 min por pie (pies tibios, ideal de noche).',
    uso: 'Tradición: “bajar el fuego”: cabeza caliente + pies fríos, susto, cansancio de fondo.',
    aviso: 'Pies con heridas u hongos activos: no frotar; solo calor seco (calcetín, guatero tibio).' },
  { id: 'zhongwan', cod: 'RM12 Zhongwan 中脘', ico: '🍲', fase: 'Tierra',
    donde: 'Abdomen: mitad entre ombligo y punta del esternón.',
    como: 'Círculos suaves con palma tibia 1-2 min, tras comer (nunca con dolor agudo).',
    uso: 'Tradición: hinchazón, pesadez, acidez leve por comer apurado.',
    aviso: 'Dolor abdominal agudo, vómitos con sangre o fiebre: urgencia, no masaje.' },
  { id: 'baihui', cod: 'DM20 Baihui 百会', ico: '👑', fase: 'Agua/Fuego',
    donde: 'Coronilla: línea entre puntas de orejas, punto medio superior.',
    como: 'Golpeteo suave con yemas 30 seg + 3 respiraciones profundas.',
    uso: 'Tradición: despejar la mente, ánimo bajo, pesadez de cabeza por cansancio.',
    aviso: 'Mareo con caída o presión descompensada: sentarse, agua, ayuda; no automasaje.' }
];
function puntoById(id) { for (var i = 0; i < MTC_PUNTOS.length; i++) if (MTC_PUNTOS[i].id === id) return MTC_PUNTOS[i]; return null; }

/* Baduanjin simplificado educativo */
var MTC_BADUANJIN = [
  { n: '1 · Elevar el cielo (Shuang Shou Tuo Tian)', d: 'De pie, pies paralelos. Inhala subiendo manos entrelazadas sobre la cabeza (palmas al cielo), estira suave 3 seg; exhala bajando por los lados. 6-8 veces. Ordena Triple Recalentador y abre el pecho.' },
  { n: '2 · Tensar el arco (Kai Gong She Diao)', d: 'Paso lateral, brazos como arco y flecha: mira al puño. Alterna 4 por lado. Abre Hígado y pecho; suelta rabia contenida.' },
  { n: '3 · Elevar un brazo (Diao Li Pi Wei)', d: 'Una palma al cielo y otra a la tierra, alternando con respiración lenta. 4 por lado. Regula Bazo-Estómago (digestión).' },
  { n: '4 · Mirar atrás (Wu Lao Qi Shang)', d: 'Gira cabeza y tronco mirando el talón contrario, exhalando. 4 por lado. Libera cuello y “las 5 fatigas”.' },
  { n: '5 · Mover la cabeza y la cola (Yao Tou Bai Wei)', d: 'Inclínate al frente con manos en rodillas, ondula tronco de lado a lado 4 veces. Calma el Fuego del Corazón.' },
  { n: '6 · Tocar los pies (Liang Shou Pan Zu)', d: 'Baja suave con manos por piernas hacia pies (dobla rodillas si tiran), sube redondeando. 6 veces. Estira Riñón-Vejiga (lumbar y piernas).' },
  { n: '7 · Puños con ojos de tigre (Cuan Quan Nu Mu)', d: 'Puños a la cintura, golpea al frente alternando con mirada firme y exhalación. 4 por lado. Despierta la Madera (decisión y coraje).' },
  { n: '8 · Elevar talones (Ti Hou Dian)', d: 'Sube talones inhalando (brazos sueltos), deja caer suave exhalando. 8 veces. Sacude lo turbio y asienta el Qi. Termina con manos en vientre bajo 1 min.' }
];

/* Cocina simple de apoyo (alimentos, no fármacos) */
var MTC_RECETAS = [
  { id: 'congee', nombre: 'Congee de arroz (Zhou 粥) — base Tierra', icon: '🍚',
    fase: 'Tierra · todas', tiempo: '50 min', rinde: '4 tazones', dif: 'Muy fácil',
    desc: 'Sopa espesa de arroz bien cocido: lo más suave para Bazo-Estómago. Desayuno ideal en Pukem o tras excesos.',
    ing: [{ c: '1 taza', i: 'arroz (ideal integral o mitad y mitad)' }, { c: '7 tazas', i: 'agua' }, { c: '1 pizca', i: 'sal de mar' }, { c: 'opcional', i: 'zapallo en cubos, zanahoria o pollo desmenuzado' }, { c: 'al servir', i: 'jengibre rallado + gotas de limón + cilantro' }],
    pasos: ['Lava el arroz, hierve con el agua y baja a fuego mínimo.', 'Cocina 45 min revolviendo a ratos hasta cremoso (agrega agua si espesa mucho).', 'Suma sal y verduras/polllo los últimos 15 min.', 'Sirve tibio con jengibre y limón.'],
    uso: 'Desayuno o cena liviana. Madera: más verde encima. Metal: con pera cocida. Agua: con poroto negro (remojado 8 h).',
    conserva: 'Refrigerado 2 días; agrega agua al recalentar.', aviso: 'Diabetes: porción moderada (es arroz) y conversa tu porción con tu nutricionista.',
    luna: '🌗 Menguante: semana de congee simple para aligerar.' },
  { id: 'te-jengibre', nombre: 'Té jengibre + azufaifo (dátiles rojos)', icon: '🍵',
    fase: 'Tierra · Agua', tiempo: '15 min', rinde: '2 tazas', dif: 'Muy fácil',
    desc: 'Calor dulce que abriga el centro y calma el frío de Penco. Versión casera con pasas si no hay dátiles.',
    ing: [{ c: '4 rodajas', i: 'jengibre fresco' }, { c: '4 un', i: 'dátiles rojos (o 1 cda de pasas rubias)' }, { c: '2 tazas', i: 'agua' }, { c: '1 cdta', i: 'miel (al servir tibia)' }],
    pasos: ['Hierve jengibre + dátiles 10 min a fuego bajo.', 'Apaga, tapa 3 min, cuela.', 'Endulza con miel al servir tibio (nunca hervida).'],
    uso: 'Mañanas frías o tras mojarse. Fuego alto (acidez, cara roja): mitad de jengibre.',
    conserva: 'Termo del día.', aviso: 'Embarazo, gastritis o anticoagulantes: jengibre suave y consulta a tu profesional.',
    luna: 'Pukem lluvioso: termo de mañana + pies abrigados.' },
  { id: 'sopa-5', nombre: 'Sopa 5 colores (5 fases en la olla)', icon: '🥘',
    fase: 'Las 5 fases', tiempo: '35 min', rinde: '4 platos', dif: 'Fácil',
    desc: 'Un color por fase: verde (Madera) + rojo (Fuego) + amarillo (Tierra) + blanco (Metal) + negro (Agua). Equilibrio comestible.',
    ing: [{ c: '1 taza', i: 'acelga o espinaca picada (verde · Madera)' }, { c: '1 un', i: 'tomate o pimentón rojo (rojo · Fuego)' }, { c: '2 tazas', i: 'zapallo camote en cubos (amarillo · Tierra)' }, { c: '1 taza', i: 'coliflor o nabo (blanco · Metal)' }, { c: '1/2 taza', i: 'porotos negros cocidos o cochayuyo (negro · Agua)' }, { c: 'a gusto', i: 'sal, jengibre, ajo, aceite de oliva' }],
    pasos: ['Sofríe ajo + jengibre 1 min.', 'Agrega zapallo + agua (5 tazas), hierve 15 min.', 'Suma el resto 10 min. Sala al final.', 'Sirve con arroz o sola de noche.'],
    uso: 'Almuerzo completo o cena liviana (sin poroto de noche si te hincha).',
    conserva: 'Refrigerada 2 días.', aviso: 'Si un ingrediente te cae mal, cámbialo por otro del mismo color.',
    luna: '🌕 Llena: olla grande para compartir (la Tierra se nutre en comunidad).' },
  { id: 'pera', nombre: 'Pera cocida con miel (humedece Metal)', icon: '🍐',
    fase: 'Metal', tiempo: '20 min', rinde: '2 porciones', dif: 'Muy fácil',
    desc: 'Postre tibio de otoño: calma garganta seca y tos leve por sequedad. Nada de helado con tos.',
    ing: [{ c: '2 un', i: 'peras en mitades (sin centro)' }, { c: '1 taza', i: 'agua' }, { c: '1 cdta', i: 'miel' }, { c: 'opcional', i: 'canela o 2 azufaifos' }],
    pasos: ['Cuece peras 12 min en el agua con canela.', 'Sirve tibias con 1 cdta de miel encima.'],
    uso: 'Postre o colación de Rimu. Tierra débil: con un poco de arroz cocido.',
    conserva: 'Refrigerada 1 día; entibia antes.', aviso: 'Tos con fiebre, silbido o sangre: consulta, no es solo sequedad.' },
  { id: 'caldo-negro', nombre: 'Caldo oscuro de invierno (guarda Agua)', icon: '🍲',
    fase: 'Agua · Tierra', tiempo: '60 min', rinde: '6 tazas', dif: 'Fácil',
    desc: 'Caldo de huesos o de poroto negro + cochayuyo: “guardar” en Pukem, abrigar Riñón y huesos.',
    ing: [{ c: '1 taza', i: 'porotos negros remojados 8 h (o huesos de pollo)' }, { c: '1 tira', i: 'cochayuyo remojado' }, { c: '1 un', i: 'cebolla + 2 dientes ajo' }, { c: '3 rodajas', i: 'jengibre' }, { c: 'a gusto', i: 'sal de mar, laurel' }],
    pasos: ['Bota el agua del remojo. Hierve todo en 8 tazas 50 min.', 'Saca laurel, sala al final.', 'Toma 1 tazón tibio de noche.'],
    uso: '3 noches por semana en Pukem. Fuego alto: porción chica y más verdura.',
    conserva: 'Refrigerado 3 días (hierve al recalentar).', aviso: 'Gota, riñón delicado o dieta baja en potasio: pregunta a tu médico por poroto y cochayuyo.' }
];
function recetaById(id) { for (var i = 0; i < MTC_RECETAS.length; i++) if (MTC_RECETAS[i].id === id) return MTC_RECETAS[i]; return null; }

var MTC_SABORES = [
  { n: 'Ácido 酸', e: 'Madera', h: 'Astringe y guarda · limón, vinagre, ciruela. Exceso daña Hígado/tendones.' },
  { n: 'Amargo 苦', e: 'Fuego', h: 'Seca y baja · lechuga, té, matico. Exceso dispersa el Qi.' },
  { n: 'Dulce 甘', e: 'Tierra', h: 'Tonifica y armoniza · arroz, zapallo, dátiles. Exceso (azúcar) daña Bazo.' },
  { n: 'Picante 辛', e: 'Metal', h: 'Dispersa y mueve · jengibre, ajo, pimienta. Exceso seca y daña Pulmón.' },
  { n: 'Salado 咸', e: 'Agua', h: 'Ablanda y baja · sal de mar, algas, cochayuyo. Exceso daña Riñón.' }
];
var MTC_LUNAS = [
  '🌑 Nueva: guardar (Agua). Dormir antes de las 23 h + caldo tibio + pregunta: ¿qué batería cargo este ciclo?',
  '🌓 Creciente: brotar (Madera). Suma 1 decisión chica + estiramiento + desayuno tibio a horario.',
  '🌕 Llena: conectar (Fuego) sin quemarse. Cena liviana, conversar sin pelear, pera cocida de postre.',
  '🌗 Menguante: soltar (Metal) y digerir (Tierra). Congee simple, ordenar 1 cajón, ventilar y botar lo vencido.'
];

/* ---------- helpers dominio ---------- */
function elemById(id) { return MTC_ELEMS[id] || MTC_ELEMS.TI; }
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
   RENDER — Test elemento
   ============================================================ */
function calcTest() {
  var sc = { MA: 0, FU: 0, TI: 0, ME: 0, AG: 0 }, n = 0;
  for (var i = 0; i < MTC_TEST.length; i++) {
    var sel = document.querySelector('input[name="mtcQ' + i + '"]:checked');
    if (sel) { n++; sc[MTC_TEST[i].c] += (+sel.value); }
  }
  return { sc: sc, n: n };
}
function updateProgreso() {
  var r = calcTest(), box = $('mtcProgreso');
  if (box) box.textContent = r.n + ' / ' + MTC_TEST.length + ' respondidas' + (r.n < MTC_TEST.length ? ' — responde todas para un espejo fiel' : ' ✓ lista/o para calcular');
}
var ICO_EL = { MA: '🌳', FU: '🔥', TI: '🌾', ME: '⚙️', AG: '💧' };
function showResultado(sc) {
  var box = $('mtcResultado'); if (!box) return;
  var arr = [{ k: 'MA', p: sc.MA }, { k: 'FU', p: sc.FU }, { k: 'TI', p: sc.TI }, { k: 'ME', p: sc.ME }, { k: 'AG', p: sc.AG }];
  arr.sort(function (a, b) { return b.p - a.p; });
  var dom = arr[0].k, max = Math.max(arr[0].p, 1);
  box.classList.remove('hidden');
  box.innerHTML = '<h4>📊 Tu espejo (sin guardar)</h4>' +
    '<p class="muted su-11a508">Máximo por fase: 12 (4 preguntas × 3). Lo alto muestra <b>qué fase pide cuidado hoy</b>, no tu destino: las fases se mueven con estación, luna y vida. <b>No diagnostica</b>.</p>' +
    arr.map(function (a) {
      var c = MTC_ELEMS[a.k], pct = Math.round(a.p / max * 100);
      return '<p class="su-6cb285"><b>' + c.ico + ' ' + esc(c.n) + '</b> · <b>' + a.p + '</b></p>' +
        '<div class="su-ab9537"><div style="width:' + pct + '%;height:100%;background:' + c.col + '"></div></div>';
    }).join('') +
    '<div class="si-card"><h4>' + MTC_ELEMS[dom].ico + ' Tu fase a cuidar: ' + esc(MTC_ELEMS[dom].n) + '</h4>' +
    '<p>' + esc(MTC_ELEMS[dom].es) + '</p><p><b>Para equilibrar:</b> ' + esc(MTC_ELEMS[dom].calma) + '</p>' +
    '<p class="muted">Órganos: ' + esc(MTC_ELEMS[dom].org) + '</p></div>' +
    '<div class="su-ac5453"><button type="button" class="btn btn-accent su-30e741" id="mtcSaveTest">💾 Guardar este test</button>' +
    '<button type="button" class="btn su-30e741" id="mtcSetElem">✓ Mi fase: ' + esc(MTC_ELEMS[dom].n) + '</button></div>';
  var sv = $('mtcSaveTest');
  if (sv) sv.onclick = function () {
    store().tests.push({ id: uid('mtc'), fecha: todayKey(), MA: sc.MA, FU: sc.FU, TI: sc.TI, ME: sc.ME, AG: sc.AG, dom: dom });
    persist(); save('Test guardado ✓'); renderHist(); renderAva();
  };
  var st = $('mtcSetElem');
  if (st) st.onclick = function () {
    store().miElemento = dom; persist(); save('Tu fase guardada ✓');
    syncMiElem(); renderMiElemBox(); renderAva(); switchTab('Reloj'); renderReloj();
  };
  try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}
function syncMiElem() { var s = $('mtcMiElem'); if (s) s.value = store().miElemento || ''; }
function renderMiElemBox() {
  var box = $('mtcMiElemBox'); if (!box) return;
  var k = store().miElemento;
  if (!k || !MTC_ELEMS[k]) { box.innerHTML = '<p class="muted su-6cb285">Aún sin definir. Haz el test 📝 o elígela arriba: es tu punto de partida, no tu jaula.</p>'; return; }
  var c = MTC_ELEMS[k];
  box.innerHTML = '<div class="menstrual-card" style="border-color:' + c.col + '55"><h4 style="color:' + c.col + '">' + c.ico + ' ' + esc(c.n) + '</h4>' +
    '<p class="su-afb724">' + esc(c.es) + '</p>' +
    '<p class="su-afb724"><b>Se altera con:</b> ' + esc(c.sube) + '</p>' +
    '<p class="su-afb724"><b>Se equilibra con:</b> ' + esc(c.calma) + '</p>' +
    '<p class="muted">📍 En Penco: ' + esc(c.penco) + '</p></div>';
}

/* ============================================================
   RENDER — Reloj / Recetas / Diario / Avance
   ============================================================ */
function renderReloj() {
  var box = $('mtcRelojList'); if (!box) return;
  var ahora = relojAhora();
  box.innerHTML = '<div class="menstrual-card su-68a1a9"><h4>⏰ Ahora (' + esc(new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })) + '): ' +
    esc(ahora.item.org) + ' · ' + esc(ahora.item.h) + ' h</h4>' +
    '<p class="muted su-6cb285"><b>Haz:</b> ' + esc(ahora.item.hacer) + '<br><b>Evita:</b> ' + esc(ahora.item.evitar) + '</p></div>' +
    MTC_RELOJ.map(function (r, i) {
      var cur = (i === ahora.idx) ? ' · ⬅️ AHORA' : '';
      return '<div class="menstrual-card' + (i === ahora.idx ? '" style="border-color:var(--gold)' : '') + '"><h4>🕰️ ' + esc(r.h) + ' · ' + esc(r.org) + cur + '</h4>' +
        '<p class="muted su-11a508">Fase: <b>' + esc(r.el) + '</b></p>' +
        '<p class="su-6cb285">✅ ' + esc(r.hacer) + '</p>' +
        '<p class="su-6cb285">🚫 ' + esc(r.evitar) + '</p>' +
        '<p class="muted">Señal de cuidado: ' + esc(r.senal) + '</p></div>';
    }).join('');
}
var mtcFQ = '', mtcFEl = 'todas', mtcOpenRec = null, mtcFavOnly = false;
function renderPuntos() {
  var box = $('mtcPuntoList'); if (!box) return;
  var favs = store().favsPuntos;
  var list = MTC_PUNTOS.filter(function (p) {
    if (mtcFavOnly && favs.indexOf(p.id) < 0) return false;
    if (!mtcFQ) return true;
    var q = mtcFQ.toLowerCase();
    return (p.cod + ' ' + p.uso + ' ' + p.donde).toLowerCase().indexOf(q) >= 0;
  });
  if (!list.length) { box.innerHTML = '<p class="muted">Sin resultados. Prueba "sueño", "digestión" o "mareo".</p>'; return; }
  box.innerHTML = list.map(function (p) {
    var fav = favs.indexOf(p.id) >= 0 ? '⭐' : '☆';
    return '<div class="si-card"><h4>' + esc(p.ico + ' ' + p.cod) + '</h4>' +
      '<p class="muted su-11a508">📍 ' + esc(p.donde) + '</p>' +
      '<p class="su-6cb285">👉 ' + esc(p.como) + '</p>' +
      '<p class="muted su-11a508">📖 ' + esc(p.uso) + '</p>' +
      '<div class="lawen-warn">⚠️ ' + esc(p.aviso) + '</div>' +
      '<div class="su-c158a9"><button type="button" class="btn su-337714" data-fav="' + p.id + '">' + fav + ' Fav</button>' +
      '<button type="button" class="btn su-337714" data-make="' + p.id + '">👉 Lo practiqué</button></div></div>';
  }).join('');
  box.querySelectorAll('[data-fav]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-fav'); var f = store().favsPuntos; var i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.push(id); persist(); save(); renderPuntos(); renderAva(); }; });
  box.querySelectorAll('[data-make]').forEach(function (b) { b.onclick = function () {
    var p = puntoById(b.getAttribute('data-make')); if (!p) return;
    store().logPuntos.push({ id: uid('mtcl'), puntoId: p.id, nombre: p.ico + ' ' + p.cod, fecha: todayKey() });
    persist(); save('Punto practicado 👉'); renderAva();
  }; });
}
function renderRecetas() {
  var box = $('mtcRecList'); if (!box) return;
  var q = (mtcFQ || '').toLowerCase();
  var list = MTC_RECETAS.filter(function (r) {
    if (mtcFEl !== 'todas' && r.fase.indexOf(mtcFEl) < 0 && r.fase !== 'Las 5 fases') return false;
    if (!q) return true;
    var t = (r.nombre + ' ' + r.desc + ' ' + r.ing.map(function (x) { return x.i; }).join(' ')).toLowerCase();
    return t.indexOf(q) >= 0;
  });
  if (!list.length) { box.innerHTML = '<p class="muted">Sin resultados. Prueba "congee", "jengibre" o "pera".</p>'; return; }
  box.innerHTML = list.map(function (r) {
    return '<div class="si-card"><h4>' + esc(r.icon + ' ' + r.nombre) + '</h4>' +
      '<p><span class="chip su-0d5be0">' + esc(r.fase) + '</span> <span class="chip su-0d5be0">⏱ ' + esc(r.tiempo) + '</span> <span class="chip su-0d5be0">🫙 ' + esc(r.rinde) + '</span></p>' +
      '<p class="muted su-11a508">' + esc(r.desc) + '</p>' +
      '<div class="su-c158a9"><button type="button" class="btn su-337714" data-open="' + r.id + '">📖 Ver</button>' +
      '<button type="button" class="btn su-337714" data-cook="' + r.id + '">🫙 La preparé</button></div></div>';
  }).join('') + (mtcOpenRec ? mtcDetalleHTML(recetaById(mtcOpenRec)) : '');
  box.querySelectorAll('[data-open]').forEach(function (b) { b.onclick = function () { mtcOpenRec = (mtcOpenRec === b.getAttribute('data-open')) ? null : b.getAttribute('data-open'); renderRecetas(); var d = $('mtcDet'); if (d) try { d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {} }; });
  box.querySelectorAll('[data-cook]').forEach(function (b) { b.onclick = function () {
    var r = recetaById(b.getAttribute('data-cook')); if (!r) return;
    store().logPuntos.push({ id: uid('mtcl'), puntoId: 'rec:' + r.id, nombre: r.icon + ' ' + r.nombre, fecha: todayKey() });
    persist(); save('Preparación guardada 🫙'); renderAva(); switchTab('Diario');
  }; });
  var sh = box.querySelectorAll('[data-mtcshare]');
  sh.forEach(function (b) { b.onclick = function () { var r = recetaById(b.getAttribute('data-mtcshare')); if (r) share(r.nombre, r.icon + ' ' + r.nombre + ' — MTC Penco\n' + r.fase + ' · ' + r.tiempo + ' · ' + r.rinde + '\n\nINGREDIENTES:\n' + r.ing.map(function (x) { return '• ' + x.c + ' ' + x.i; }).join('\n') + '\n\nPREPARACIÓN:\n' + r.pasos.map(function (p, i) { return (i + 1) + '. ' + p; }).join('\n') + '\n\nUSO: ' + r.uso + '\n' + r.luna); }; });
}
function mtcDetalleHTML(r) {
  if (!r) return '';
  return '<div class="menstrual-card su-ee187f" id="mtcDet"><h4>' + esc(r.icon + ' ' + r.nombre) + '</h4>' +
    '<p class="muted su-11a508">' + esc(r.fase) + ' · ⏱ ' + esc(r.tiempo) + ' · 🫙 ' + esc(r.rinde) + ' · ' + esc(r.dif) + '</p>' +
    '<h4>🧾 Ingredientes</h4>' + r.ing.map(function (x) { return '<p class="su-6cb285">• <b>' + esc(x.c) + '</b> ' + esc(x.i) + '</p>'; }).join('') +
    '<h4>👩‍🍳 Preparación</h4>' + r.pasos.map(function (p, i) { return '<p class="su-6cb285"><b>' + (i + 1) + '.</b> ' + esc(p) + '</p>'; }).join('') +
    '<div class="si-card"><p>💡 ' + esc(r.uso) + '</p><p class="muted">🫙 ' + esc(r.conserva) + '</p></div>' +
    '<div class="lawen-warn">⚠️ ' + esc(r.aviso) + '</div>' +
    '<p class="muted">' + esc(r.luna) + '</p>' +
    '<button type="button" class="btn su-30e741" data-mtcshare="' + esc(r.id) + '">📤 Compartir receta</button></div>';
}
function renderDiario() {
  var box = $('mtcDiarioList'); if (!box) return;
  var e = store(), keys = Object.keys(e.diario || {}).sort().reverse().slice(0, 30);
  if (!keys.length) { box.innerHTML = '<p class="muted">Sin registros. 1 minuto al día: fase + energía + nota.</p>'; return; }
  box.innerHTML = keys.map(function (k) {
    var r = e.diario[k];
    return '<div class="hora-item"><span class="su-6cb285"><b>' + esc(k) + '</b> ' + (ICO_EL[r.fase] || '☯️') + ' ' + esc(r.fase || '—') +
      ' · ⚡ ' + esc(String(r.energia)) + '/5 · 🍲 ' + esc(String(r.digestion)) + '/5 · 😴 ' + esc(String(r.sueno)) + '/5 · 💛 ' + esc(r.emocion || '—') +
      '<br><span class="muted">' + esc(lunaTxt(k)) + (r.nota ? ' · «' + esc(r.nota) + '»' : '') + '</span></span>' +
      '<button type="button" class="btn btn-icon" data-del="' + esc(k) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { delete store().diario[b.getAttribute('data-del')]; persist(); save(); renderDiario(); renderAva(); }; });
}
function renderPracts() {
  var box = $('mtcPractBox'); if (!box) return;
  var d = (store().practs || []).slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 10);
  var lg = (store().logPuntos || []).slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 10);
  var h = '';
  h += '<p class="muted su-11a508">🧘 ' + (store().practs || []).length + ' días Baduanjin · 👉 ' + (store().logPuntos || []).length + ' prácticas/puntos y recetas</p>';
  h += d.length ? d.map(function (r) {
    return '<div class="hora-item"><span class="su-11a508"><b>' + esc(r.fecha) + '</b> 🧘 Baduanjin ' + esc(String(r.piezas)) + '/8' + (r.nota ? ' · «' + esc(r.nota) + '»' : '') + '</span>' +
      '<button type="button" class="btn btn-icon" data-pdel="' + r.id + '">✕</button></div>';
  }).join('') : '<p class="muted">Sin días Baduanjin. Marca tus piezas abajo ☯️.</p>';
  h += lg.length ? lg.map(function (l) {
    return '<div class="hora-item"><span class="su-6cb285">👉 <b>' + esc(l.nombre || '') + '</b> · ' + esc(l.fecha || '') + '</span>' +
      '<button type="button" class="btn btn-icon" data-ldel="' + l.id + '">✕</button></div>';
  }).join('') : '<p class="muted">Sin puntos ni recetas. Desde Prácticas pulsa “👉 Lo practiqué” o “🫙 La preparé”.</p>';
  box.innerHTML = h;
  box.querySelectorAll('[data-pdel]').forEach(function (b) { b.onclick = function () { var s = store(); s.practs = s.practs.filter(function (x) { return x.id !== b.getAttribute('data-pdel'); }); persist(); save(); renderPracts(); renderAva(); }; });
  box.querySelectorAll('[data-ldel]').forEach(function (b) { b.onclick = function () { var s = store(); s.logPuntos = s.logPuntos.filter(function (x) { return x.id !== b.getAttribute('data-ldel'); }); persist(); save(); renderPracts(); renderAva(); }; });
}
function renderHist() {
  var box = $('mtcHistBox'); if (!box) return;
  var t = (store().tests || []).slice().reverse().slice(0, 10);
  if (!t.length) { box.innerHTML = '<p class="muted su-11a508">Sin tests guardados.</p>'; return; }
  box.innerHTML = t.map(function (r) {
    return '<div class="hora-item"><span class="su-11a508"><b>' + esc(r.fecha) + '</b> · 🌳' + r.MA + ' 🔥' + r.FU + ' 🌾' + r.TI + ' ⚙️' + r.ME + ' 💧' + r.AG + ' · a cuidar <b>' + esc(r.dom || '') + '</b></span>' +
      '<button type="button" class="btn btn-icon" data-del="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var s = store(); s.tests = s.tests.filter(function (r) { return r.id !== b.getAttribute('data-del'); }); persist(); save(); renderHist(); renderAva(); }; });
}
function renderAva() {
  var box = $('mtcAvaBox'); if (!box) return;
  var e = store();
  var keys = Object.keys(e.diario || {});
  var porF = { MA: 0, FU: 0, TI: 0, ME: 0, AG: 0 };
  var en = 0, nEn = 0;
  keys.forEach(function (k) { var r = e.diario[k]; if (porF[r.fase] !== undefined) porF[r.fase]++; if (+r.energia > 0) { en += (+r.energia); nEn++; } });
  box.innerHTML = '<p class="muted su-11a508">☯️ Racha: <b>' + rachaDias() + ' días</b> · 📓 ' + keys.length + ' días de diario · 🧘 ' + (e.practs || []).length + ' días Baduanjin · 👉 ' + (e.logPuntos || []).length + ' prácticas</p>' +
    '<p class="muted su-e13d76">🌳 Madera ' + porF.MA + ' · 🔥 Fuego ' + porF.FU + ' · 🌾 Tierra ' + porF.TI + ' · ⚙️ Metal ' + porF.ME + ' · 💧 Agua ' + porF.AG + (nEn ? ' · ⚡ energía prom ' + (en / nEn).toFixed(1) + '/5' : '') + '</p>' +
    '<p class="muted su-11a508">Ritmo sugerido: 1 pieza nueva de Baduanjin por luna + diario de 1 minuto + congee en menguante. Dormir antes de las 23 h ordena las 5 fases a la vez.</p>';
}
function renderAll() { try { syncMiElem(); renderMiElemBox(); } catch (e) {} try { renderReloj(); } catch (e) {} try { renderPuntos(); } catch (e) {} try { renderRecetas(); } catch (e) {} try { renderDiario(); } catch (e) {} try { renderPracts(); } catch (e) {} try { renderHist(); } catch (e) {} try { renderAva(); } catch (e) {} try { updateProgreso(); } catch (e) {} }

/* ============================================================
   DIALOGO
   ============================================================ */
function buildDialog() {
  var testHTML = MTC_TEST.map(function (q, i) {
    var opts = MTC_LIKERT.map(function (o) {
      return '<label class="check-row su-a16b97"><input type="radio" name="mtcQ' + i + '" value="' + o.v + '"> ' + o.t + '</label>';
    }).join('');
    return '<div class="menstrual-card su-fdf33f"><b class="su-6cb285">' + (i + 1) + '. ' + esc(q.txt) + '</b><div class="su-8fd176">' + opts + '</div></div>';
  }).join('');
  var saboresHTML = MTC_SABORES.map(function (s) {
    return '<div class="habit-item"><b>' + esc(s.n) + '</b> <span class="chip su-0d5be0">' + esc(s.e) + '</span><br><span class="muted su-11a508">' + esc(s.h) + '</span></div>';
  }).join('');
  var baduHTML = MTC_BADUANJIN.map(function (p, i) {
    return '<div class="menstrual-card"><h4>🧘 ' + esc(p.n) + '</h4><p class="su-6cb285">' + esc(p.d) + '</p>' +
      '<button type="button" class="btn mtc-bad-add su-30e741" data-b="' + i + '">+ Anotar pieza de hoy</button></div>';
  }).join('');
  var body =
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabMtcGuia" class="btn btn-accent su-30e741">📖 Guía</button>' +
    '<button type="button" id="tabMtcElem" class="btn su-30e741">🌳 Mi fase</button>' +
    '<button type="button" id="tabMtcReloj" class="btn su-30e741">⏰ Reloj</button>' +
    '<button type="button" id="tabMtcPract" class="btn su-30e741">🧘 Prácticas</button>' +
    '<button type="button" id="tabMtcDiario" class="btn su-30e741">📓 Diario</button>' +
    '<button type="button" id="tabMtcAva" class="btn su-30e741">📊 Mi avance</button></div>' +

    '<div id="mtcGuia">' +
    '<div class="menstrual-card su-68a1a9"><h4>☯️ ¿Qué es la Medicina Tradicional China? (中医 Zhōngyī)</h4>' +
    '<p class="muted su-616df7"><b>Zhong</b> (centro) + <b>yi</b> (medicina): la medicina del equilibrio, con 2.000+ años de historia escrita. No persigue solo el síntoma: lee <b>cómo circula tu energía (Qi 气), tu sangre (Xue 血) y tus emociones</b> según el clima, la hora, la comida y tu vida. Idea de una línea: <b>vive con la estación y la hora, come tibio y a horario, duerme antes de las 23 h</b>.</p></div>' +
    '<div class="fishing-grid su-d2c171">' +
    '<div class="menstrual-card"><h4>📜 Raíz en 1 minuto</h4><p class="muted su-6cb285"><b>Huangdi Neijing</b> (Clásico del Emperador Amarillo, ~s. II a.C.): Yin-Yang, 5 fases, órganos y reloj. <b>Shennong Bencao</b>: primer herbario. <b>Zhang Zhongjing</b> (Shanghan Lun): fórmulas para daño por frío. <b>Sun Simiao</b>: ética del sanador (“el gran médico”). <b>Li Shizhen</b> (Bencao Gangmu, 1578): 1.892 remedios ordenados. Viaja con el taoísmo, el tai chi y el qigong: el mismo mapa. Puerta de entrada: reloj de órganos + congee + Baduanjin.</p></div>' +
    '<div class="menstrual-card"><h4>☯️ Yin-Yang + Qi, Xue, Jing, Shen</h4><p class="muted su-6cb285"><b>Yin-Yang 阴阳:</b> todo viene en pares (noche-día, frío-calor, guardar-gastar); salud = alternarlos. <b>Qi 气:</b> energía que mueve (respirar, digerir). <b>Xue 血:</b> sangre que nutre. <b>Jinye 津液:</b> fluidos (saliva, moco, sudor). <b>Jing 精:</b> esencia profunda (Riñón). <b>Shen 神:</b> espíritu que brilla en los ojos. Cansancio = Qi bajo; palidez = Xue bajo; miedo de fondo = Jing gastado; mente nublada = Shen inquieto.</p></div></div>' +
    '<div class="menstrual-card"><h4>🖐️ Las 5 fases (Wu Xing 五行): generar y controlar</h4>' +
    MTC_CICLOS.map(function (c) { return '<p class="muted su-6cb285">• <b>' + esc(c.n) + ':</b> ' + esc(c.d) + '</p>'; }).join('') +
    '<p class="muted su-e13d76">Madera 🌳 nutre Fuego 🔥 nutre Tierra 🌾 nutre Metal ⚙️ nutre Agua 💧 nutre Madera. Si una fase se desboca, su “abuelo” la frena. Por eso la rabia (Madera) revuelve la guata (Tierra) y el susto (Agua) apaga la alegría (Fuego).</p></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🍽️ Los 5 sabores (cada uno nutre una fase)</h4><div class="habits-list">' + saboresHTML + '</div>' +
    '<p class="muted su-11a508">Regla de oro: cada almuerzo trae varios sabores y colores. El almuerzo (11-13 h, hora del Corazón) es la comida principal; la cena, liviana y temprana.</p></div>' +
    '<div class="menstrual-card"><h4>🏛️ Zang-Fu en 30 segundos</h4><p class="muted su-6cb285"><b>5 Zang (tesoros Yin, guardan):</b> Hígado (plan), Corazón (ánimo), Bazo (digestión), Pulmón (aire y duelo), Riñón (batería). <b>6 Fu (Yang, transforman):</b> Vesícula, Intestino delgado, Estómago, Intestino grueso, Vejiga, Triple Recalentador (las 3 cocinas: arriba-pecho, medio-guata, abajo-vientre). Detalle por hora en ⏰ Reloj.</p></div>' +
    '<div class="menstrual-card"><h4>🌧️ Por qué enfermamos (3 raíces)</h4><p class="muted su-6cb285"><b>1) 6 excesos del clima (Liu Yin):</b> viento, frío, calor, humedad, sequedad y calor de verano que entran sin abrigo. <b>2) 7 emociones (Qi Qing):</b> ira, alegría en exceso, preocupación, tristeza, miedo, susto y melancolía que se estancan. <b>3) Vida:</b> comer frío/desordenado, trasnoche, sobrefuerzo sin descanso, trauma. El diagnóstico mira las 3, no solo el dolor.</p></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🌙 MTC × Penco y 13 lunas</h4>' +
    MTC_LUNAS.map(function (t) { return '<p class="muted su-6cb285">• ' + esc(t) + '</p>'; }).join('') +
    '<p class="muted su-e13d76">Pukem (invierno) = frío-humedad que pide guardar (Agua) · Rimu (otoño ventoso) = viento-sequedad que pide soltar (Metal) · Walung (verano) = calor que pide frescura tibia (Fuego) · Pewu (primavera) = viento que pide brotar sin forzarse (Madera). Nota hemisferio sur: las estaciones son las de Penco, no las de Beijing. Puentes: 🪷 <b>Ayurveda</b> · ☯️ <b>Tao</b> · 🐉 <b>Mantak Chia</b> · 🥗 <b>Nutrición</b> · ⚡ <b>Energía y descanso</b> · 🐉 <b>Chino Mandarín</b> (pinyin y hanzi de cada punto).</p></div>' +
    '<details class="menstrual-details"><summary>⚠️ Cuidados (léeme)</summary><p class="muted su-6cb285">✅ Esto es <b>sabiduría educativa y preventiva</b>, no diagnóstico ni receta. ✅ No suspendas remedios ni reemplaces controles (CESFAM, médico, nutricionista, matrona). ✅ Hierbas chinas, acupuntura, ventosas y moxa solo con profesional formado: aquí solo van <b>comida, rutina, respiración y acupresión suave</b>. ✅ Embarazo, lactancia, hipertensión, diabetes, úlcera, anticoagulantes, marcapasos o cirugías: versiones suaves y pregunta a tu profesional. ✅ Punto IG4 fuerte se evita en embarazo. Ante dolor pecho fuerte, fiebre alta, sangrado, ideas de daño o crisis: red de apoyo y *4141 (Chile, 24 h).</p></details>' +
    '</div>' +

    '<div id="mtcElem" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>🌳 Test: ¿qué fase pide cuidado? (20 afirmaciones)</h4>' +
    '<p class="muted su-6cb285">Responde según <b>cómo estás estas últimas lunas</b> (tu estado, no tu destino). Nunca (0) · A veces (1) · A menudo (2) · Muy cierto (3). ~5 min. <b>No es diagnóstico</b>: es un espejo de la fase a nutrir.</p>' +
    '<div class="su-3de8f9"><button type="button" id="mtcTestReset" class="btn su-30e741">↺ Limpiar</button> ' +
    '<button type="button" id="mtcTestCalc" class="btn btn-accent su-30e741">📊 Ver mi resultado</button></div>' +
    '<div id="mtcProgreso" class="muted su-e13d76"></div></div>' +
    '<div id="mtcTestBox" class="su-d2c171">' + testHTML + '</div>' +
    '<div id="mtcResultado" class="menstrual-card hidden su-51d56a"></div>' +
    '<div class="menstrual-grid"><div class="menstrual-card su-68a1a9"><h4>🌱 Mi fase a cuidar</h4>' +
    '<div class="conv-row"><label>Mi fase <select id="mtcMiElem"><option value="">— sin definir —</option><option value="MA">🌳 Madera · 木</option><option value="FU">🔥 Fuego · 火</option><option value="TI">🌾 Tierra · 土</option><option value="ME">⚙️ Metal · 金</option><option value="AG">💧 Agua · 水</option></select></label></div>' +
    '<div id="mtcMiElemBox" class="su-fe7b49"></div></div>' +
    '<div class="menstrual-card"><h4>🕘 Historial de tests</h4><div id="mtcHistBox"></div></div></div></div>' +

    '<div id="mtcReloj" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>⏰ Reloj de órganos (Zi Wu Liu Zhu 子午流注)</h4>' +
    '<p class="muted su-6cb285">Cada 2 horas manda un órgano. Come, trabaja y duerme con el reloj: digestiones fuertes de día (Tierra/Fuego), guardar de noche (Madera/Agua). Tu hora actual sale marcada ⬅️.</p></div>' +
    '<div id="mtcRelojList"></div></div>' +

    '<div id="mtcPract" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>🧘 Baduanjin (八段锦 · 8 piezas del brocado)</h4>' +
    '<p class="muted su-6cb285">Qigong de 800 años: 8 movimientos + respiración lenta. De pie, ropa cómoda, 10-15 min. Si hay mareo, hipertensión no controlada o embarazo: solo piezas suaves (1, 3, 8) y sin forzar.</p>' +
    '<div class="dlg-actions su-41efc8"><button type="button" id="mtcQiBtn" class="btn su-30e741">🧘 Qigong 5 min</button> ' +
    '<label class="su-6cb285">Piezas hoy <input type="number" id="mtcPiezas" min="1" max="8" value="8" class="su-41470a"></label> ' +
    '<button type="button" id="mtcPractSave" class="btn btn-accent su-30e741">💾 Guardar día</button></div>' +
    '<span id="mtcQiMsg" class="muted su-6cb285"></span>' +
    '<div class="conv-row"><label>Nota <input type="text" id="mtcPractNota" placeholder="ej: 8 piezas suaves, hombros sueltos" maxlength="140"></label></div></div>' +
    '<div id="mtcBaduBox" class="su-d2c171">' + baduHTML + '</div>' +
    '<div class="menstrual-card su-68a1a9"><h4>👉 Acupresión (sin agujas)</h4>' +
    '<p class="muted su-6cb285">Presión de dedos sobre puntos clásicos. Nunca sobre heridas, quemaduras ni zonas inflamadas. Si duele fuerte, suelta.</p>' +
    '<div class="conv-row"><label class="su-4b3de7">🔍 Buscar <input type="text" id="mtcQ" placeholder="sueño, digestión, mareo..." maxlength="40"></label>' +
    '<label class="check-row su-988f60"><input type="checkbox" id="mtcFavOnly"> ⭐ solo favs</label></div>' +
    '<div id="mtcPuntoList" class="su-be747f"></div></div>' +
    '<div class="menstrual-card su-68a1a9"><h4>🍲 Cocina de las 5 fases</h4>' +
    '<div class="conv-row"><label>Fase <select id="mtcFEl"><option value="todas">Todas</option><option value="Madera">Madera</option><option value="Fuego">Fuego</option><option value="Tierra">Tierra</option><option value="Metal">Metal</option><option value="Agua">Agua</option><option value="5 fases">Las 5 fases</option></select></label></div>' +
    '<div id="mtcRecList" class="su-be747f"></div></div></div>' +

    '<div id="mtcDiario" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>📓 Registro de hoy (1 minuto)</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="mtcDiaFecha"></label>' +
    '<label>Fase del día <select id="mtcDiaFase"><option value="">—</option><option value="MA">🌳 Madera</option><option value="FU">🔥 Fuego</option><option value="TI">🌾 Tierra</option><option value="ME">⚙️ Metal</option><option value="AG">💧 Agua</option></select></label></div>' +
    '<div class="conv-row su-8a77e5"><label>⚡ Energía 1–5 <input type="number" id="mtcDiaEnergia" min="1" max="5" value="3"></label>' +
    '<label>🍲 Digestión 1–5 <input type="number" id="mtcDiaDig" min="1" max="5" value="3"></label>' +
    '<label>😴 Descanso 1–5 <input type="number" id="mtcDiaSueno" min="1" max="5" value="3"></label></div>' +
    '<div class="conv-row"><label>Emoción que mandó <select id="mtcDiaEmo"><option value="">—</option><option value="ira">😤 Ira / frustración</option><option value="alegria">😄 Alegría</option><option value="preocupacion">🤔 Preocupación</option><option value="tristeza">😢 Tristeza</option><option value="miedo">😨 Miedo</option><option value="calma">😌 Calma</option></select></label></div>' +
    '<label>Nota <input type="text" id="mtcDiaNota" placeholder="ej: dormí 23 h, guata liviana, ánimo estable" maxlength="140"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="mtcDiaAdd" class="btn btn-accent su-30e741">+ Guardar hoy</button></div></div>' +
    '<div id="mtcDiarioList" class="habits-list su-ebf445"></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🧘 Mis prácticas y puntos</h4><div id="mtcPractBox" class="habits-list"></div>' +
    '<div class="dlg-actions su-efea1d"><span id="mtcLogStats" class="muted su-11a508"></span>' +
    '<span class="su-3de8f9"><button type="button" id="mtcToNote" class="btn su-30e741">📝 Llevar a nota de hoy</button>' +
    '<button type="button" id="mtcShare" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="mtcClear" class="btn su-214f75">🗑 Borrar diario</button></span></div></div></div>' +

    '<div id="mtcAva" class="hidden"><div id="mtcAvaBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="si-card"><h4>🌙 Cierre de luna (3 líneas)</h4><p>En tu cuaderno o nota del día:<br><b>1)</b> ¿Cómo durmió mi Agua (23-7 h)?<br><b>2)</b> ¿Qué fase se movió más (rabia, risa, rumia, pena, susto)?<br><b>3)</b> ¿Qué hábito sostengo la próxima luna (cena temprana, Baduanjin, congee)?<br>Lengua rosada + hambre al mediodía + sueño seguido = Qi en camino.</p></div></div>';
  makeDialog('mtcDialog', '☯️ Medicina Tradicional China · 中医',
    'Yin-Yang, 5 fases, reloj de órganos, Baduanjin, acupresión y cocina tibia para Penco. Test, reloj vivo, 8 puntos y 5 recetas por lunas. Todo <b>privado y local</b>.',
    body);
}

/* ---------- temporizador qigong ---------- */
var mtcQiTimer = null;
function runQigong() {
  var msg = $('mtcQiMsg'), btn = $('mtcQiBtn');
  if (!msg) return;
  if (mtcQiTimer) { clearInterval(mtcQiTimer); mtcQiTimer = null; if (btn) btn.textContent = '🧘 Qigong 5 min'; msg.textContent = ''; return; }
  var seg = 300;
  if (btn) btn.textContent = '⏹ Detener';
  msg.textContent = 'Pie de pie, hombros bajos… 5:00 (inhala por nariz, exhala largo)';
  mtcQiTimer = setInterval(function () {
    seg--;
    if (seg <= 0) {
      clearInterval(mtcQiTimer); mtcQiTimer = null;
      if (btn) btn.textContent = '🧘 Qigong 5 min';
      msg.textContent = '✓ Listo. Manos en vientre bajo 1 min. Anota tus piezas abajo.';
      try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
      return;
    }
    var m = Math.floor(seg / 60), s = seg % 60;
    if (seg === 150) msg.textContent = 'Mitad: suelta mandíbula y hombros… 2:30';
    else if (seg === 60) msg.textContent = 'Último minuto: solo respirar y estar… 1:00';
    else msg.textContent = 'Suave y continuo… ' + m + ':' + String(s).padStart(2, '0');
  }, 1000);
}

function openMtc() {
  try {
    if ($('mtcDiaFecha') && !$('mtcDiaFecha').value) $('mtcDiaFecha').value = todayKey();
    renderAll();
  } catch (e) {}
  openDlg('mtcDialog');
}
try { window.openMTC = openMtc; window.openMtcDialog = openMtc; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar botón en Cuerpo > cuidado (tras Ayurveda) */
  try {
    if (!$('btnMTC')) {
      var g = document.querySelector('.action-group[data-group="cuerpo"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnMTC'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '☯️ Medicina China';
        try { btn.setAttribute('data-sub', 'cuidado'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'medicina china mtc zhongyi yin yang qi chi wuxing cinco elementos madera fuego tierra metal agua zang fu reloj organos baduanjin qigong chikung acupresion hegu zusanli taichong neiguan congee jengibre huangdi neijing tao pinyin hanzi');
        var ref = g.querySelector('#btnAyurveda') || g.querySelector('#btnNutri');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnMTC');
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
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnMTC') < 0) ALL_BTNS.push('btnMTC');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnMTC = ['cuerpo', 'cuidado'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['cuerpo|cuidado'] && BTN_ORDER['cuerpo|cuidado'].indexOf('btnMTC') < 0) {
      var oi = BTN_ORDER['cuerpo|cuidado'].indexOf('btnAyurveda');
      if (oi >= 0) BTN_ORDER['cuerpo|cuidado'].splice(oi + 1, 0, 'btnMTC');
      else BTN_ORDER['cuerpo|cuidado'].push('btnMTC');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnMTC = true; });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Cuerpo) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnMTC"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Cuerpo') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnMTC"> ☯️ Medicina China';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnMTC !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnMTC = lab.querySelector('input').checked;
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
  try { addKw('btnMedic', 'china zhongyi hierbas qi congee'); } catch (e2) {}
  try { addKw('btnNutri', 'china congee sopa cinco fases comer tibio'); } catch (e3) {}
  try { addKw('btnEnergia', 'china dormir reloj organos descanso qi'); } catch (e4) {}
  try { addKw('btnBreath', 'china qigong respiracion baduanjin'); } catch (e5) {}
  try { addKw('btnMetodos', 'china tao qi qigong yin yang'); } catch (e6) {}
  try { addKw('btnChino', 'medicina china zhongyi hanzi pinyin organo punto'); } catch (e7) {}

  /* 4) diálogo + eventos */
  buildDialog();
  renderAll();

  var b = $('btnMTC');
  if (b) b.onclick = function () { openMtc(); };

  TABS.forEach(function (t) {
    var tb = $('tabMtc' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  document.querySelectorAll('input[name^="mtcQ"]').forEach(function (r) { r.onchange = updateProgreso; });
  var tc = $('mtcTestCalc'); if (tc) tc.onclick = function () { var r = calcTest(); if (r.n < MTC_TEST.length) { alert('Responde las ' + MTC_TEST.length + ' afirmaciones para un espejo fiel (' + r.n + '/' + MTC_TEST.length + ')'); return; } showResultado(r.sc); };
  var tr = $('mtcTestReset'); if (tr) tr.onclick = function () { document.querySelectorAll('input[name^="mtcQ"]').forEach(function (x) { x.checked = false; }); var bx = $('mtcResultado'); if (bx) bx.classList.add('hidden'); updateProgreso(); };
  var md = $('mtcMiElem'); if (md) md.onchange = function () { store().miElemento = md.value || ''; persist(); save('Tu fase guardada ✓'); renderMiElemBox(); renderAva(); };

  var qb = $('mtcQiBtn'); if (qb) qb.onclick = runQigong;
  var ps = $('mtcPractSave');
  if (ps) ps.onclick = function () {
    var pz = Math.min(8, Math.max(1, +(($('mtcPiezas') || {}).value || 8)));
    var nota = clean((($('mtcPractNota') || {}).value || '').trim(), 140);
    var st = store(), found = null;
    for (var i = 0; i < st.practs.length; i++) if (st.practs[i].fecha === todayKey()) found = st.practs[i];
    if (found) { found.piezas = pz; found.nota = nota; }
    else st.practs.push({ id: uid('mtcp'), fecha: todayKey(), piezas: pz, nota: nota });
    persist(); save('Día Baduanjin guardado 🧘');
    if ($('mtcPractNota')) $('mtcPractNota').value = '';
    renderPracts(); renderAva();
  };
  document.querySelectorAll('.mtc-bad-add').forEach(function (bp) {
    bp.onclick = function () {
      var idx = +(bp.getAttribute('data-b') || 0);
      var p = MTC_BADUANJIN[idx];
      var txt = '🧘 Baduanjin: ' + (p ? p.n : 'pieza') + ' — ' + todayKey();
      store().logPuntos.push({ id: uid('mtcl'), puntoId: 'bad:' + idx, nombre: txt, fecha: todayKey() });
      persist(); save('Pieza anotada ✓'); renderPracts(); renderAva();
    };
  });

  var qq = $('mtcQ'); if (qq) qq.oninput = function () { mtcFQ = qq.value; renderPuntos(); renderRecetas(); };
  var fo = $('mtcFavOnly'); if (fo) fo.onchange = function () { mtcFavOnly = fo.checked; renderPuntos(); };
  var fe = $('mtcFEl'); if (fe) fe.onchange = function () { mtcFEl = fe.value; renderRecetas(); };

  var da = $('mtcDiaAdd');
  if (da) da.onclick = function () {
    var f = ($('mtcDiaFecha') || {}).value || todayKey();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return alert('Fecha inválida');
    var st = store();
    st.diario[f] = {
      fase: ($('mtcDiaFase') || {}).value || '',
      energia: Math.min(5, Math.max(1, +((($('mtcDiaEnergia') || {}).value) || 3))),
      digestion: Math.min(5, Math.max(1, +((($('mtcDiaDig') || {}).value) || 3))),
      sueno: Math.min(5, Math.max(1, +((($('mtcDiaSueno') || {}).value) || 3))),
      emocion: ($('mtcDiaEmo') || {}).value || '',
      nota: clean((($('mtcDiaNota') || {}).value || '').trim(), 140)
    };
    persist(); save('Día guardado 📓');
    if ($('mtcDiaNota')) $('mtcDiaNota').value = '';
    renderDiario(); renderAva();
  };
  var tn = $('mtcToNote');
  if (tn) tn.onclick = function () {
    var keys = Object.keys(store().diario || {}).sort().reverse();
    if (!keys.length) return alert('Sin registros aún');
    var k = keys[0], r = store().diario[k];
    var txt = ('☯️ MTC ' + k + ': ' + (r.fase ? MTC_ELEMS[r.fase].n : 'sin fase') + ' · energía ' + r.energia + '/5 · digestión ' + r.digestion + '/5 · ' + (r.emocion || 'sin emoción') + (r.nota ? ' — ' + r.nota : '')).slice(0, 280);
    try {
      var info = (typeof todayInfo === 'function') ? todayInfo() : null;
      if (!info) return alert('No se pudo ubicar hoy');
      if (info.luna === 'dft') { var cy = cyc(currentCycleYear()); cy.dft.nota = (cy.dft.nota ? cy.dft.nota + '\n' : '') + txt; }
      else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + txt; }
      save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
      alert('Llevado a la nota de hoy ✓');
    } catch (e2) { alert('No se pudo llevar a la nota'); }
  };
  var sh = $('mtcShare');
  if (sh) sh.onclick = function () {
    var keys = Object.keys(store().diario || {}).sort().reverse().slice(0, 7);
    var t = keys.length ? '☯️ Mi Medicina China (últimos)\n' + keys.map(function (k) { var r = store().diario[k]; return '• ' + k + ' · ' + (r.fase || '—') + ' · en ' + r.energia + ' · dig ' + r.digestion + (r.nota ? ' — ' + r.nota : ''); }).join('\n') : '☯️ Sin registros aún';
    share('Mi Medicina China', t);
  };
  var cl = $('mtcClear');
  if (cl) cl.onclick = function () { if (!confirm('¿Borrar tu diario MTC? (tests y puntos se mantienen)')) return; store().diario = {}; store().practs = []; persist(); save(); renderDiario(); renderPracts(); renderAva(); };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

try { window.cal13mtc = { store: store }; } catch (e) {}

})();
