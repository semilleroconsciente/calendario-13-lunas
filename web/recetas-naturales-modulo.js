/* ============================================================
   RECETAS NATURALES — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección dentro de Cuerpo & Salud > Cuidado:
   - Botón btnRecetas (🧴 Recetas Naturales)
   - Diálogo recetasDialog con 4 pestañas:
     1) 🏡 Resumen (totales, favoritas, preparaciones del mes,
        próximas a vencer, consejo lunar)
     2) 📖 Recetas (14 recetas: pasta dental, desodorante,
        cremas, jabón, champú, bálsamo, exfoliante,
        repelente + multiuso; con buscador, filtro por
        categoría, multiplicador de porciones, favoritos
        y checklist de ingredientes)
     3) 🫙 Mis Preparaciones (bitácora: qué hice, cuándo,
        cuánto rindió, nota y puntaje; con alerta de
        vencimiento según duración de cada receta)
     4) ⚠️ Seguridad (test de parche, conservación e higiene,
        aceites esenciales, bicarbonato, flúor, niños y
        embarazo, cuándo consultar profesional)
   - Todo local y privado por usuario:
     userData().recetasNat = { favs:[], log:[], checks:{} }
   - 100% offline, sin dependencias.
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
function addDaysKey(key, days) {
  try {
    var d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + days);
    return cal.fmtKey.format(d);
  } catch (e) {
    var d2 = new Date(key + 'T12:00:00'); d2.setDate(d2.getDate() + days);
    return d2.getFullYear() + '-' + String(d2.getMonth() + 1).padStart(2, '0') + '-' + String(d2.getDate()).padStart(2, '0');
  }
}
function diffDays(aKey, bKey) {
  try {
    var a = new Date(aKey + 'T12:00:00').getTime(), b = new Date(bKey + 'T12:00:00').getTime();
    return Math.round((b - a) / 86400000);
  } catch (e) { return 0; }
}
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { favs: [], log: [], checks: {}, mine: [] };
    if (!u.recetasNat) u.recetasNat = { favs: [], log: [], checks: {}, mine: [] };
    var r = u.recetasNat;
    if (!Array.isArray(r.favs)) r.favs = [];
    if (!Array.isArray(r.log)) r.log = [];
    if (!r.checks || typeof r.checks !== 'object') r.checks = {};
    if (!Array.isArray(r.mine)) r.mine = [];
    return r;
  } catch (e) { return { favs: [], log: [], checks: {}, mine: [] }; }
}
function save(msg) {
  try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado ✓'); } catch (e) {}
}
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text, null);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles ✓');
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

/* ---------------- CATEGORÍAS ---------------- */
var CATS = ['🦷 Bucal', '💧 Desodorante', '🧴 Cremas & Ungüentos', '🧼 Jabón', '💆 Cabello', '👄 Labios & Piel', '🏠 Hogar'];

/* ---------------- RECETAS BASE (14) ---------------- */
var RECETAS = [
  {
    id: 'pasta-arcilla', nombre: 'Pasta dental de arcilla y coco', icon: '🦷', cat: '🦷 Bucal',
    tiempo: '10 min', rinde: '1 frasco 60 ml (~1 mes)', dura: 60, dif: 'Fácil', costo: '$',
    desc: 'La favorita de la casa: limpia suave, deja aliento fresco y no hace espuma. La arcilla blanca (caolín) pule sin rallar; el coco y la menta refrescan.',
    ing: [
      { c: '2 cda', i: 'arcilla blanca / caolín (grado cosmético)' },
      { c: '1 cda', i: 'aceite de coco virgen (derretido tibio)' },
      { c: '1 cdta', i: 'bicarbonato de sodio (opcional, uso suave)' },
      { c: '5–8 gotas', i: 'aceite esencial de menta (solo apto uso bucal)' },
      { c: '2–3 cda', i: 'agua hervida fría o infusión de matico fría (para textura)' },
      { c: '1 pizca', i: 'sal de mar fina (opcional, mineraliza)' }
    ],
    pasos: ['En frasco de vidrio limpio mezcla arcilla + bicarbonato + sal en seco.', 'Agrega el coco derretido tibio (no caliente) y revuelve con cuchara de madera o silicona (no metal).', 'Suma el agua de a poco hasta lograr textura de pasta suave.', 'Añade la menta gota a gota, prueba y ajusta.', 'Etiqueta con fecha. Guarda tapado, sin agua dentro del frasco (usa espátula limpia).'],
    uso: 'Cepilla 2 min, 2–3 veces al día, como pasta común. Enjuaga bien.',
    conserva: 'Frasco vidrio, lugar fresco y seco. Dura ~2 lunas (60 días). Si cambia olor/sabor, descartar.',
    aviso: 'No tragar intencionalmente. Si hay caries, sangrado o sensibilidad, ir al dentista: esto limpia, no cura.',
    luna: '🌑 Luna nueva: prepara el frasco del mes con calma e higiene.',
    kids: 'Solo +6 años y sin tragar; para niños usar solo coco + pizca de arcilla, sin menta fuerte.'
  },
  {
    id: 'pasta-simple', nombre: 'Pasta dental simple (2 ingredientes)', icon: '🌿', cat: '🦷 Bucal',
    tiempo: '3 min', rinde: '1 porción (uso inmediato)', dura: 0, dif: 'Muy fácil', costo: '$',
    desc: 'Para salir del paso o viajar: se prepara en el momento, sin guardar. Limpieza suave ocasional.',
    ing: [
      { c: '1 cdta', i: 'aceite de coco' },
      { c: '1 pizca', i: 'bicarbonato de sodio' },
      { c: '1 gota', i: 'aceite esencial de menta o clavo (opcional)' }
    ],
    pasos: ['Mezcla todo en una cucharita o pocillo.', 'Cepilla 2 min y enjuaga.', 'No guardes restos: se hace nueva cada vez.'],
    uso: 'Uso ocasional (2–3 veces por semana) alternando con tu pasta habitual.',
    conserva: 'No se conserva: preparar y usar al momento.',
    aviso: 'El bicarbonato diario desgasta esmalte: esta versión es ocasional, no diaria.',
    luna: 'Cualquier día; ideal para mochila y viajes.',
    kids: 'No recomendada en niños pequeños (riesgo de tragar bicarbonato).'
  },
  {
    id: 'enjuague-matico', nombre: 'Enjuague bucal de menta y matico', icon: '🌿', cat: '🦷 Bucal',
    tiempo: '15 min + reposo', rinde: '250 ml (~2 semanas)', dura: 14, dif: 'Fácil', costo: '$',
    desc: 'Frescura sin alcohol fuerte: el matico acompaña encías y la menta refresca. No arde como el comercial.',
    ing: [
      { c: '250 ml', i: 'agua hervida' },
      { c: '1 cda', i: 'hojas secas de matico (o 1 cdta de menta seca)' },
      { c: '1 cdta', i: 'sal de mar' },
      { c: '3 gotas', i: 'aceite esencial de menta (opcional)' },
      { c: '1 cdta', i: 'xilitol (opcional, endulza y cuida)' }
    ],
    pasos: ['Hierve el agua, apaga y agrega matico + menta. Tapa 10 min.', 'Cuela muy bien (doble colador o paño limpio).', 'Con la infusión tibia disuelve sal + xilitol.', 'Fría, agrega la menta esencial y envasa en botella limpia.', 'Etiqueta con fecha. Agita antes de usar.'],
    uso: 'Enjuaga 30 seg después del cepillado, 1–2 veces al día. No tragar.',
    conserva: 'Refrigerado 14 días. Si se enturbia o huele raro, descartar.',
    aviso: 'No reemplaza hilo dental ni dentista. Suspende si arde o irrita.',
    luna: '🌕 Luna llena: prepara infusiones (máxima savia).',
    kids: 'Apto +6 años con supervisión (escupir, no tragar).'
  },
  {
    id: 'deso-crema', nombre: 'Desodorante en crema (karité + bicarbonato)', icon: '💧', cat: '💧 Desodorante',
    tiempo: '15 min', rinde: '50 ml (~1–2 meses)', dura: 90, dif: 'Fácil', costo: '$$',
    desc: 'El que realmente funciona: neutraliza olor todo el día, cunde mucho (una lenteja por axila). Cremoso y efectivo.',
    ing: [
      { c: '3 cda', i: 'aceite de coco' },
      { c: '2 cda', i: 'manteca de karité' },
      { c: '2 cda', i: 'bicarbonato de sodio (fino, sin grumos)' },
      { c: '2 cda', i: 'maicena o arrurruz (suaviza y absorbe)' },
      { c: '10 gotas', i: 'aceite esencial: lavanda + árbol de té (5+5)' }
    ],
    pasos: ['Derrite coco + karité a baño maría suave (no hervir).', 'Apaga, agrega bicarbonato + maicena tamizados. Revuelve sin grumos.', 'Tibio (no caliente) agrega los esenciales.', 'Envasa en frasco 50 ml limpio y seco. Deja solidificar a temperatura ambiente.', 'Etiqueta con fecha.'],
    uso: 'Con yema limpia toma una lenteja y masajea en axila seca. En verano se ablanda: es normal, guarda fresco.',
    conserva: 'Fresco y seco, ~3 lunas (90 días). Si enrancia (olor a fritura), descartar.',
    aviso: 'Haz test de parche 48 h (ver Seguridad). Si irrita, cambia a la receta spray sin bicarbonato. No aplicar sobre piel herida o recién depilada.',
    luna: '🌗 Menguante: día de preparados y orden del tocador.',
    kids: 'Adolescentes sí; niños no (no lo necesitan). Embarazo: solo con lavanda suave o sin esenciales.'
  },
  {
    id: 'deso-spray', nombre: 'Desodorante spray piel sensible (sin bicarbonato)', icon: '🌸', cat: '💧 Desodorante',
    tiempo: '5 min', rinde: '100 ml (~1 mes)', dura: 30, dif: 'Muy fácil', costo: '$',
    desc: 'Para axilas que no toleran bicarbonato: magnesio + hamamelis refrescan sin picar. Ideal post-depilación (al día siguiente).',
    ing: [
      { c: '60 ml', i: 'agua de hamamelis o agua hervida fría' },
      { c: '30 ml', i: 'agua destilada o hervida fría extra' },
      { c: '2 cdta', i: 'leche/cloruro de magnesio (o 1 cdta de sal de magnesio disuelta)' },
      { c: '1 cdta', i: 'glicerina vegetal (fija y suaviza)' },
      { c: '8 gotas', i: 'aceite esencial lavanda o palmarrosa' }
    ],
    pasos: ['Disuelve el magnesio en el agua tibia (no caliente). Deja enfriar.', 'Agrega hamamelis + glicerina + esenciales. Agita.', 'Envasa en spray 100 ml limpio. Etiqueta.', 'Agita siempre antes de usar.'],
    uso: '2–3 pulverizaciones por axila seca. Deja secar 1 min antes de vestir.',
    conserva: 'Fresco y oscuro, 30 días. Agitar antes de usar.',
    aviso: 'Pica leve al inicio es normal con magnesio; si arde fuerte, diluye a la mitad. No usar sobre heridas abiertas.',
    luna: 'Creciente: recarga tu spray del mes.',
    kids: 'Adolescentes sí. Sin esenciales para menores de 12.'
  },
  {
    id: 'crema-karite', nombre: 'Crema corporal de karité y avena', icon: '🧴', cat: '🧴 Cremas & Ungüentos',
    tiempo: '20 min', rinde: '100 ml (~1 mes)', dura: 60, dif: 'Media', costo: '$$',
    desc: 'Nutrición profunda para piernas, manos y codos agrietados del invierno pencón. Se absorbe tibio y deja piel suave horas.',
    ing: [
      { c: '3 cda', i: 'manteca de karité' },
      { c: '2 cda', i: 'aceite de coco o almendras' },
      { c: '1 cda', i: 'aceite de avena o jojoba (calma)' },
      { c: '1 cdta', i: 'cera de abeja rallada (da cuerpo)' },
      { c: '8 gotas', i: 'aceite esencial lavanda o calendula (opcional)' },
      { c: '1 cáps', i: 'vitamina E (conservante natural, opcional)' }
    ],
    pasos: ['Baño maría: derrite karité + cera + coco revolviendo.', 'Apaga, agrega avena/jojoba + vitamina E.', 'Tibio agrega esenciales. Bate 2 min con tenedor.', 'Envasa en frasco ámbar limpio. Reposa 2 h antes de tapar del todo.', 'Etiqueta con fecha.'],
    uso: 'Noche o post-ducha, poca cantidad con masaje. Talones y codos: capa generosa + calcetín.',
    conserva: 'Fresco y seco 60 días. En calor se ablanda: refrigerar 10 min y vuelve.',
    aviso: 'Test de parche. No usar en rostro graso (es corporal). Manchas en ropa si te vistes de inmediato: espera 5 min.',
    luna: '🌑 Luna nueva: día de autocuidado y preparar tu crema.',
    kids: 'Versión niños: sin esenciales, solo karité + coco + avena.'
  },
  {
    id: 'unguento-calendula', nombre: 'Ungüento de caléndula y matico (manos y grietas)', icon: '🌼', cat: '🧴 Cremas & Ungüentos',
    tiempo: '40 min (oleato) + 10 min', rinde: '50 ml', dura: 90, dif: 'Media', costo: '$$',
    desc: 'Botiquín natural: para manos partidas, labios partidos, rozaduras y picaduras leves. Con lawen del huerto.',
    ing: [
      { c: '1 taza', i: 'flores secas de caléndula (o ½ caléndula + ½ matico seco)' },
      { c: '1 taza', i: 'aceite de oliva suave o almendras (para oleato)' },
      { c: '1 cda', i: 'cera de abeja rallada por cada 100 ml de oleato' },
      { c: '5 gotas', i: 'aceite esencial árbol de té (opcional, antiséptico)' }
    ],
    pasos: ['Oleato: flores + aceite en frasco, 2 semanas al sol suave agitando diario (o baño maría 2 h a fuego mínimo). Cuela.', 'Derrite la cera en 100 ml de oleato a baño maría.', 'Tibio, agrega árbol de té. Envasa en lata/frasco 50 ml.', 'Etiqueta: nombre + fecha.'],
    uso: 'Capa fina en zona seca o irritada, 2–3 veces al día. Labios partidos también sirve.',
    conserva: 'Fresco y oscuro 90 días. Huele a hierbas: si huele rancio, descartar.',
    aviso: 'Solo uso externo. No en heridas abiertas profundas ni quemaduras graves (eso es urgencia). Alergia a compuestas: test previo.',
    luna: '🌕 Llena de verano: cosecha caléndula a la mañana para el oleato.',
    kids: 'Apto niños sin árbol de té (solo oleato + cera).'
  },
  {
    id: 'jabon-glicerina', nombre: 'Jabón de glicerina, avena y miel', icon: '🧼', cat: '🧼 Jabón',
    tiempo: '30 min + 4 h secado', rinde: '4 barras (~2 meses)', dura: 180, dif: 'Fácil', costo: '$$',
    desc: 'Sin soda cáustica y sin riesgo: se derrite base de glicerina comprada y se personaliza. Perfecto primer jabón en familia.',
    ing: [
      { c: '500 g', i: 'base de glicerina blanca o transparente (melt & pour)' },
      { c: '2 cda', i: 'avena molida fina (exfolia suave)' },
      { c: '1 cda', i: 'miel' },
      { c: '15 gotas', i: 'aceite esencial: naranja + lavanda (10+5)' },
      { c: '1 cdta', i: 'aceite de almendras (extra suavidad)' }
    ],
    pasos: ['Corta la base en cubos. Derrite a baño maría o microondas en tandas de 20 seg (no hervir).', 'Agrega miel + almendras, revuelve.', 'Tibio (no caliente) suma avena + esenciales.', 'Vierte en moldes (vasos de silicona sirven). Golpea suave para sacar burbujas.', 'Reposa 4 h, desmolda y deja curar 48 h en rejilla. Envuelve en papel.'],
    uso: 'Manos, cuerpo y rostro normal. Espuma cremosa; deja la piel sin tirantez.',
    conserva: 'Seco y ventilado 6 lunas. Entre usos, jabonera que drene (no encharcado).',
    aviso: 'Usa base certificada melt & pour (no hagas jabón con soda sin formación: quema). Test si tienes piel atópica.',
    luna: 'Menguante: tarde de jabones en familia.',
    kids: 'Ideal con niños (ellos agregan avena y eligen molde). Esenciales cítricos suaves o sin esencia para <6.'
  },
  {
    id: 'jabon-castilla', nombre: 'Jabón líquido tipo Castilla (rallado)', icon: '🫧', cat: '🧼 Jabón',
    tiempo: '20 min + reposo noche', rinde: '500 ml', dura: 30, dif: 'Fácil', costo: '$',
    desc: 'Recicla restos de jabón en barra y conviértelos en jabón líquido para manos. Cero desperdicio.',
    ing: [
      { c: '100 g', i: 'jabón en barra rallado (neutro o de glicerina)' },
      { c: '500 ml', i: 'agua hervida' },
      { c: '1 cda', i: 'glicerina vegetal' },
      { c: '10 gotas', i: 'aceite esencial a gusto (opcional)' }
    ],
    pasos: ['Hierve el agua, apaga y disuelve el jabón rallado revolviendo.', 'Agrega glicerina. Reposa toda la noche tapado.', 'Si espesa mucho, bate y agrega 50 ml de agua tibia. Si queda líquido, 1 cdta más de ralladura disuelta.', 'Envasa en dispensador. Etiqueta.'],
    uso: 'Manos y cuerpo. Agita si se separa (es normal, no lleva emulsionantes).',
    conserva: '30 días a temperatura ambiente. Si huele raro, descartar y hacer nuevo.',
    aviso: 'No para ojos ni íntimo. Si te queda pegajoso, usaste mucho jabón: diluye.',
    luna: 'Cualquier menguante: transforma restos en nuevo.',
    kids: 'Apto toda la familia.'
  },
  {
    id: 'champu-aloe', nombre: 'Champú de aloe + enjuague de vinagre', icon: '💆', cat: '💆 Cabello',
    tiempo: '15 min', rinde: '200 ml (~3 semanas)', dura: 21, dif: 'Media', costo: '$',
    desc: 'Limpieza suave sin sulfatos fuertes: el aloe calma el cuero cabelludo y el vinagre da brillo. Transición de 2–3 semanas.',
    ing: [
      { c: '120 ml', i: 'gel de aloe vera natural (o puro comprado sin alcohol)' },
      { c: '60 ml', i: 'jabón neutro líquido suave (tipo bebé) o base neutra' },
      { c: '2 cda', i: 'agua de romero (infusión fuerte fría)' },
      { c: '1 cdta', i: 'glicerina vegetal' },
      { c: '—', i: 'ENJUAGUE: 1 cda vinagre de manzana en 500 ml agua fría' }
    ],
    pasos: ['Mezcla aloe + jabón neutro + romero + glicerina sin batir fuerte (evita espuma).', 'Envasa en botella 200 ml con dosificador. Etiqueta + fecha.', 'Enjuague aparte: vinagre + agua en botella 500 ml.', 'Lava masajeando cuero cabelludo 2 min, enjuaga, aplica el enjuague de medios a puntas, enjuaga frío.'],
    uso: '2–3 veces por semana. Agita antes de usar. El pelo necesita 2–3 semanas para acostumbrarse (menos espuma = normal).',
    conserva: 'Refrigerado 21 días (lleva aloe fresco). Haz poco y seguido.',
    aviso: 'No apto si tienes alergia al aloe (test en antebrazo). Evita ojos. Si hay caspa severa o heridas, consulta.',
    luna: 'Creciente: lava y corta puntas (creencia de crecimiento).',
    kids: 'Apto +3 con versión sin esenciales y enjuague muy diluido.'
  },
  {
    id: 'balsamo-labial', nombre: 'Bálsamo labial de cacao y miel', icon: '👄', cat: '👄 Labios & Piel',
    tiempo: '10 min', rinde: '3 potecitos (~3 meses)', dura: 90, dif: 'Muy fácil', costo: '$',
    desc: 'Adiós labios partidos del viento sur: cremoso, rico y dura meses en la mochila.',
    ing: [
      { c: '1 cda', i: 'cera de abeja rallada' },
      { c: '1 cda', i: 'manteca de cacao o karité' },
      { c: '1 cda', i: 'aceite de coco o almendras' },
      { c: '½ cdta', i: 'miel' },
      { c: '3 gotas', i: 'aceite esencial naranja dulce o menta (opcional)' }
    ],
    pasos: ['Derrite cera + manteca + aceite a baño maría.', 'Apaga, agrega miel y revuelve enérgico.', 'Tibio agrega esencia. Vierte en 3 potecitos.', 'Deja solidificar 1 h. Tapa y etiqueta.'],
    uso: 'Aplica con dedo limpio cuando sientas sequedad. También sirve para cutículas y aletas de nariz.',
    conserva: 'Bolsillo/mochila 90 días. En calor extremo se derrite: guarda a la sombra.',
    aviso: 'Si eres alérgico a propóleos/miel, omítela. No compartir si hay herpes activo.',
    luna: 'Pequeño regalo de luna llena para amigas.',
    kids: 'Apto niños (versión sin menta).'
  },
  {
    id: 'exfoliante-cafe', nombre: 'Exfoliante de café y azúcar', icon: '✨', cat: '👄 Labios & Piel',
    tiempo: '5 min', rinde: '100 ml (4–6 usos)', dura: 30, dif: 'Muy fácil', costo: '$',
    desc: 'Piel suave en 5 minutos con lo de la cocina: activa circulación y deja olor rico. Ritual de domingo.',
    ing: [
      { c: '3 cda', i: 'café molido usado y seco (o nuevo)' },
      { c: '2 cda', i: 'azúcar rubia' },
      { c: '3 cda', i: 'aceite de coco u oliva' },
      { c: '5 gotas', i: 'aceite esencial naranja o vainilla (opcional)' }
    ],
    pasos: ['Mezcla todo en frasco limpio.', 'En la ducha, con piel húmeda masajea circular suave 2 min (evita rostro).', 'Enjuaga y seca a toques. Hidrata después.'],
    uso: '1 vez por semana, cuerpo (no rostro ni zonas irritadas).',
    conserva: 'Sin agua dentro: usa cuchara seca. 30 días fresco y seco.',
    aviso: 'No usar sobre quemaduras, heridas, acné activo ni post-depilación inmediata. Cuidado: la tina resbala, enjuaga bien.',
    luna: 'Menguante: exfoliar es soltar lo viejo.',
    kids: 'Adolescentes sí (cuerpo). Niños no lo necesitan.'
  },
  {
    id: 'repelente-eucalipto', nombre: 'Repelente eucalipto-limón', icon: '🦟', cat: '🏠 Hogar',
    tiempo: '5 min', rinde: '100 ml', dura: 30, dif: 'Muy fácil', costo: '$',
    desc: 'Para tardes en el humedal Rocuant y el patio: aleja zancudos sin químicos fuertes. Reaplicar seguido.',
    ing: [
      { c: '50 ml', i: 'agua de hamamelis' },
      { c: '40 ml', i: 'agua hervida fría' },
      { c: '1 cdta', i: 'glicerina o alcohol 70° (fijador)' },
      { c: '20 gotas', i: 'aceite esencial eucalipto limón (citriodora)' },
      { c: '10 gotas', i: 'aceite esencial lavanda' }
    ],
    pasos: ['Mezcla todo en spray 100 ml. Agita fuerte.', 'Etiqueta "REPELENTE — agitar — no ojos".', 'Reaplica cada 2 h y tras sudar/mojarte.'],
    uso: 'Ropa y piel expuesta (no rostro, no manos de niños que se chupan).',
    conserva: 'Oscuro y fresco 30 días.',
    aviso: 'No en <3 años ni embarazo sin guía profesional (usa mosquitero). No reemplaza repelente en zona de dengue/zika en viaje: allá usa DEET indicado.',
    luna: 'Verano (Walung): tenlo en la mochila del Humedal.',
    kids: 'Solo +3 años y diluido a la mitad; nunca en manos ni cara.'
  },
  {
    id: 'multiuso-citricos', nombre: 'Limpiador multiuso de vinagre y cítricos', icon: '🍋', cat: '🏠 Hogar',
    tiempo: '5 min + 2 semanas macerado', rinde: '500 ml', dura: 90, dif: 'Muy fácil', costo: '$',
    desc: 'Bonus hogar: aprovecha cáscaras de limón/naranja, limpia cocina y baño, y deja de comprar 3 botellas plásticas.',
    ing: [
      { c: 'cáscaras', i: 'de 4–5 limones o naranjas (solo cáscara)' },
      { c: '500 ml', i: 'vinagre blanco' },
      { c: '250 ml', i: 'agua (para diluir al envasar)' }
    ],
    pasos: ['Llena un frasco con cáscaras y cubre con vinagre. Macera 2 semanas en oscuro.', 'Cuela y diluye 1:1 con agua en spray.', 'Usa en mesones, lavaplatos, vidrios y baño. No usar en mármol ni granito (el ácido mancha).'],
    uso: 'Spray + paño. Para grasa deja actuar 5 min.',
    conserva: '90 días a temperatura ambiente.',
    aviso: 'Nunca mezclar vinagre con cloro (gases tóxicos). Etiqueta claro y fuera del alcance de niños.',
    luna: 'Menguante: limpieza profunda de la casa.',
    kids: 'Lo preparan los adultos; niños solo ayudan a juntar cáscaras.'
  }
];

function recetaById(id) {
  for (var i = 0; i < RECETAS.length; i++) if (RECETAS[i].id === id) return RECETAS[i];
  var m = store().mine || [];
  for (var j = 0; j < m.length; j++) if (m[j].id === id) return m[j];
  return null;
}
function todasRecetas() {
  var m = store().mine || [];
  return RECETAS.concat(m);
}
function esFav(id) { return store().favs.indexOf(id) >= 0; }
function toggleFav(id) {
  var s = store(), i = s.favs.indexOf(id);
  if (i >= 0) s.favs.splice(i, 1); else s.favs.push(id);
  save(i >= 0 ? 'Quitada de favoritas' : 'Guardada en favoritas ⭐');
  renderAll();
}
function vencimientoDe(logItem) {
  var r = recetaById(logItem.recetaId);
  if (!r || !r.dura) return null;
  return addDaysKey(logItem.fecha, r.dura);
}
function estadoVence(logItem) {
  var v = vencimientoDe(logItem);
  if (!v) return { k: 'na', txt: 'uso inmediato', v: null };
  var d = diffDays(todayKey(), v);
  if (d < 0) return { k: 'venc', txt: 'vencido hace ' + Math.abs(d) + ' d', v: v };
  if (d === 0) return { k: 'hoy', txt: 'vence hoy', v: v };
  if (d <= 7) return { k: 'prox', txt: 'vence en ' + d + ' d', v: v };
  return { k: 'ok', txt: 'vence ' + v, v: v };
}

/* ---------------- DIÁLOGO ---------------- */
var TABS = ['Resumen', 'Recetas', 'Preps', 'Seg'];
var fCat = 'todas', fQ = '', openReceta = null, multiplo = 1;

function switchTab(name) {
  TABS.forEach(function (t) {
    var p = $('rec' + t), b = $('tabRec' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

function escalaCant(c, mult) {
  if (!c || mult === 1) return c;
  var m = c.match(/^([\d.,\/½¼¾]+)\s*(.*)$/);
  if (!m) return c;
  var numTxt = m[1].trim(), resto = m[2] || '';
  var val = null;
  if (numTxt.indexOf('/') >= 0) {
    var p = numTxt.split('/');
    val = parseFloat(p[0]) / parseFloat(p[1]);
  } else if (/½/.test(numTxt)) val = 0.5;
  else val = parseFloat(String(numTxt).replace(',', '.'));
  if (isNaN(val)) return c;
  var out = val * mult;
  var outTxt = (Math.round(out * 10) / 10).toString().replace('.', ',');
  return outTxt + (resto ? ' ' + resto : '');
}

function buildDialog() {
  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabRecResumen" class="btn btn-accent" style="width:auto">🏡 Resumen</button>' +
    '<button type="button" id="tabRecRecetas" class="btn" style="width:auto">📖 Recetas</button>' +
    '<button type="button" id="tabRecPreps" class="btn" style="width:auto">🫙 Mis Preparaciones</button>' +
    '<button type="button" id="tabRecSeg" class="btn" style="width:auto">⚠️ Seguridad</button></div>' +

    '<div id="recResumen"></div>' +

    '<div id="recRecetas" class="hidden">' +
    '<div class="conv-row"><label style="flex:2">🔍 Buscar <input type="text" id="recQ" placeholder="pasta, coco, karité, jabón..."></label>' +
    '<label>Categoría <select id="recFC"><option value="todas">Todas</option>' + CATS.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></label>' +
    '<label class="check-row" style="margin:0;white-space:nowrap"><input type="checkbox" id="recFavOnly"> ⭐ solo favs</label></div>' +
    '<div id="recList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px;max-height:380px;overflow-y:auto"></div></div>' +

    '<div id="recPreps" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Registrar preparación</h4>' +
    '<div class="conv-row"><label style="flex:2">Receta <select id="rpReceta"></select></label>' +
    '<label>Fecha <input type="date" id="rpFecha"></label></div>' +
    '<div class="conv-row"><label>Cantidad hecha <input type="text" id="rpCant" placeholder="ej: 1 frasco 60 ml" maxlength="40"></label>' +
    '<label>¿Te gustó? <select id="rpRate"><option value="5">⭐⭐⭐⭐⭐ me encantó</option><option value="4">⭐⭐⭐⭐ bien</option><option value="3">⭐⭐⭐ regular</option><option value="2">⭐⭐ flojo</option><option value="1">⭐ no repetir</option></select></label></div>' +
    '<label>Notas <input type="text" id="rpNota" placeholder="ej: quedó espesa, próxima vez menos arcilla" maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="rpAdd" class="btn btn-accent" style="width:auto">+ Guardar</button>' +
    '<button type="button" id="rpCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
    '<div id="recLogList" class="habits-list" style="margin-top:8px;max-height:260px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="recLogStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:6px"><button type="button" id="recLogShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="recLogClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +

    '<div id="recSeg" class="hidden">' +
    '<div class="si-card"><h4>🧪 Test de parche (siempre, con todo)</h4><p>Aplica una lenteja en el antebrazo interno, tapa con parche y espera <b>48 h</b>. Si pica, arde, enrojece o salen granitos: esa receta no es para tu piel. Prueba la versión sensible (spray sin bicarbonato, crema sin esenciales).</p></div>' +
    '<div class="si-card"><h4>🧼 Higiene = conservación</h4><p>Manos lavadas, frascos hervidos 5 min o con alcohol y secos. <b>Nunca metas dedos mojados</b>: usa espátula o cucharita limpia. El agua es lo que echa a perder todo: si entra agua al frasco, dura la mitad. Etiqueta siempre <b>nombre + fecha</b>.</p></div>' +
    '<div class="si-card"><h4>🌿 Aceites esenciales: poco y bien</h4><p>Son potentes: <b>máx 1% en cuerpo</b> (~6 gotas por 30 ml) y <b>0,5% en rostro/bucal</b>. Nunca puros en piel. No ingerir salvo indicación bucal de la receta. Embarazo, lactancia, epilepsia y niños: la mayoría se evita — usa versiones sin esenciales. Cítricos (naranja, limón) dan fotosensibilidad: no salir al sol tras aplicar.</p></div>' +
    '<div class="si-card"><h4>⚪ Bicarbonato con medida</h4><p>Excelente desodorante y limpiador, pero en axilas sensibles o uso diario puede irritar. Regla: si pica más de 3 días seguidos, cambia al spray de magnesio. En dientes: solo ocasional, nunca diario abrasivo.</p></div>' +
    '<div class="si-card"><h4>🦷 Pastas naturales y flúor: lo honesto</h4><p>Estas pastas <b>limpian y refrescan</b>, pero la evidencia fuerte anticaries es del flúor. Si tienes caries activas, embarazo, niños con dientes nuevos o alto riesgo: conversa con tu dentista y considera alternar (natural de día + con flúor de noche, por ejemplo). Sangrado, dolor o sensibilidad = dentista, no más receta.</p></div>' +
    '<div class="si-card"><h4>👶 Niños y embarazo</h4><p>Niños: sin esenciales hasta los 6 (salvo lavanda suave con guía), nada que se trague con bicarbonato, repelente solo +3 años. Embarazo/lactancia: evita árbol de té, romero, menta fuerte, eucalipto y clavo; prefiere versiones base (karité + coco + avena). Ante duda, pregunta en tu CESFAM.</p></div>' +
    '<div class="si-card"><h4>🚫 Nunca jabón con soda casero sin formación</h4><p>La soda cáustica quema piel y ojos. Este módulo usa solo base melt &amp; pour y rallado: si quieres saponificar desde cero, haz un taller presencial con implementos de seguridad. Guarda todo rotulado y fuera del alcance de niños y mascotas.</p></div>' +
    '<div class="si-card"><h4>🩺 Cuándo ir al profesional</h4><p>Dentista: dolor, caries visible, sangrado >1 semana, sensibilidad al frío/calor. Médico/farmacia: sarpullido que no cede en 48 h, herida infectada (pus, calor, fiebre), quemadura grande, picadura con reacción fuerte. Estas recetas son <b>cosmética e higiene complementaria</b>, no tratamiento médico.</p></div>' +
    '</div>';

  makeDialog('recetasDialog', '🧴 Recetas Naturales — tu tocador sin tóxicos',
    'Pasta dental, desodorante, cremas, jabón, champú y más con ingredientes simples. <b>Privado y local</b> por usuario, 100% offline.',
    body);
}

/* ---------------- RENDER ---------------- */
function lunaConsejo() {
  try {
    var k = todayKey(), illum = null;
    if (window.astro && window.astro.moonInfo) {
      var mi = window.astro.moonInfo(Date.now());
      illum = Math.round((mi.fraction || 0) * 100);
    }
    if (illum === null) return '🌙 Prepara un frasco a la vez, etiqueta con fecha y disfruta lo hecho a mano.';
    if (illum < 15) return '🌑 Luna nueva: prepara la pasta y el desodorante del mes con calma.';
    if (illum < 50) return '🌒 Creciente: buena semana para oleatos y macerados (caléndula, cítricos).';
    if (illum < 85) return '🌔 Gibosa: revisa vencimientos y repone lo que se acaba.';
    return '🌕 Luna llena: cosecha lawen de mañana y haz tu crema o ungüento.';
  } catch (e) { return '🌙 Hecho a mano, con medida y cariño.'; }
}

function renderResumen() {
  var box = $('recResumen'); if (!box) return;
  var s = store(), hoy = todayKey(), ym = hoy.slice(0, 7);
  var total = todasRecetas().length;
  var mes = s.log.filter(function (l) { return (l.fecha || '').slice(0, 7) === ym; });
  var venc = [], prox = [];
  s.log.forEach(function (l) {
    var e = estadoVence(l);
    if (e.k === 'venc') venc.push({ l: l, e: e });
    else if (e.k === 'hoy' || e.k === 'prox') prox.push({ l: l, e: e });
  });
  venc.sort(function (a, b) { return (a.e.v || '').localeCompare(b.e.v || ''); });
  box.innerHTML =
    '<div class="fishing-grid">' +
    '<div class="menstrual-card"><h4>📖 Recetario</h4><p style="font-size:22px;color:var(--gold)"><b>' + total + '</b> <span style="font-size:12px">recetas</span></p>' +
    '<p class="muted" style="font-size:11px">' + CATS.map(function (c) { return esc(c); }).join(' · ') + '</p></div>' +
    '<div class="menstrual-card"><h4>🫙 Este mes</h4><p style="font-size:22px;color:var(--gold)"><b>' + mes.length + '</b> <span style="font-size:12px">preparaciones</span></p>' +
    '<p class="muted" style="font-size:11px">⭐ ' + s.favs.length + ' favoritas · 🫙 ' + s.log.length + ' totales' + (venc.length ? ' · <b style="color:#e76e8a">' + venc.length + ' vencidas</b>' : '') + '</p></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🌙 Consejo lunar</h4><p style="font-size:12px">' + esc(lunaConsejo()) + '</p></div>' +
    ((venc.length || prox.length) ?
      '<div class="menstrual-card" style="margin-top:10px"><h4>⏳ Vencimientos de tus frascos</h4>' +
      (venc.slice(0, 4).map(function (x) { return '<div class="hora-item"><span style="font-size:12px">🔴 <b>' + esc(x.l.nombre || 'Preparación') + '</b> <span class="muted">· hecha ' + esc(x.l.fecha) + ' · ' + esc(x.e.txt) + '</span></span></div>'; }).join('') +
      prox.slice(0, 4).map(function (x) { return '<div class="hora-item"><span style="font-size:12px">🟡 <b>' + esc(x.l.nombre || 'Preparación') + '</b> <span class="muted">· ' + esc(x.e.txt) + ' (' + esc(x.e.v || '') + ')</span></span></div>'; }).join('') || '<p class="muted">Todo al día ✓</p>') + '</div>' : '') +
    '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button type="button" id="recGoList" class="btn btn-accent" style="flex:1;width:auto">📖 Ver recetas</button>' +
    '<button type="button" id="recGoPrep" class="btn" style="flex:1;width:auto">🫙 Registrar preparación</button></div>';
  var g1 = $('recGoList'); if (g1) g1.onclick = function () { switchTab('Recetas'); };
  var g2 = $('recGoPrep'); if (g2) g2.onclick = function () { switchTab('Preps'); };
}

function recetaCard(r) {
  var fav = esFav(r.id) ? '⭐' : '☆';
  var chk = store().checks[r.id] || [];
  var hechas = chk.filter(Boolean).length;
  return '<div class="si-card"><h4>' + esc(r.icon + ' ' + r.nombre) + '</h4>' +
    '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">' + esc(r.cat) + '</span>' +
    '<span class="chip" style="font-size:10px">⏱ ' + esc(r.tiempo) + '</span>' +
    '<span class="chip" style="font-size:10px">🫙 ' + esc(r.rinde) + '</span>' +
    '<span class="chip" style="font-size:10px">' + esc(r.dif) + ' · ' + esc(r.costo) + '</span>' +
    (r.dura ? '<span class="chip" style="font-size:10px">⏳ dura ' + r.dura + ' d</span>' : '<span class="chip" style="font-size:10px">⚡ uso inmediato</span>') + '</p>' +
    '<p style="font-size:12px">' + esc(r.desc) + '</p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
    '<button type="button" class="btn rec-open" data-k="' + esc(r.id) + '" style="width:auto;font-size:11px">📖 Ver receta</button>' +
    '<button type="button" class="btn rec-fav" data-k="' + esc(r.id) + '" style="width:auto;font-size:11px">' + fav + ' Fav' + (hechas ? ' · ✓' + hechas + '/' + r.ing.length : '') + '</button>' +
    '<button type="button" class="btn rec-make" data-k="' + esc(r.id) + '" style="width:auto;font-size:11px">🫙 La preparé</button></div></div>';
}

function renderRecetas() {
  var box = $('recList'); if (!box) return;
  var favOnly = ($('recFavOnly') || {}).checked;
  var q = (fQ || '').toLowerCase();
  var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
  var list = todasRecetas().filter(function (r) {
    if (fCat !== 'todas' && r.cat !== fCat) return false;
    if (favOnly && !esFav(r.id)) return false;
    if (!q) return true;
    var t = ((r.nombre || '') + ' ' + (r.desc || '') + ' ' + r.ing.map(function (x) { return x.i; }).join(' ')).toLowerCase();
    var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
    return tn.indexOf(qn) >= 0;
  });
  if (!list.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin resultados. Prueba "coco", "karité" o "jabón".</p>';
    bindRecetaBtns(box);
    return;
  }
  var html = list.map(recetaCard).join('');
  if (openReceta) {
    var r = recetaById(openReceta);
    if (r && list.indexOf(r) >= 0) html += recetaDetalle(r);
    else if (r) html += recetaDetalle(r);
  }
  box.innerHTML = html;
  bindRecetaBtns(box);
}

function recetaDetalle(r) {
  var s = store();
  var chk = s.checks[r.id] || [];
  var ingHTML = r.ing.map(function (x, i) {
    var done = !!chk[i];
    return '<label class="habit-today-item ' + (done ? 'done' : '') + '" style="display:flex"><input type="checkbox" data-chk="' + i + '" ' + (done ? 'checked' : '') + '><span style="font-size:12px"><b>' + esc(escalaCant(x.c, multiplo)) + '</b> ' + esc(x.i) + '</span></label>';
  }).join('');
  var pasosHTML = r.pasos.map(function (p, i) { return '<p style="font-size:12px"><b>' + (i + 1) + '.</b> ' + esc(p) + '</p>'; }).join('');
  return '<div class="menstrual-card" id="recDet" style="border-color:var(--gold);margin-top:4px">' +
    '<h4>' + esc(r.icon + ' ' + r.nombre) + '</h4>' +
    '<p class="muted" style="font-size:11px">' + esc(r.cat) + ' · ⏱ ' + esc(r.tiempo) + ' · 🫙 ' + esc(r.rinde) + ' · ' + esc(r.dif) + '</p>' +
    '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:6px 0"><span class="muted" style="font-size:11px">Porciones:</span>' +
    [0.5, 1, 2, 3].map(function (m) { return '<button type="button" class="btn rec-mult' + (multiplo === m ? ' btn-accent' : '') + '" data-m="' + m + '" style="width:auto;font-size:11px">×' + m + '</button>'; }).join('') + '</div>' +
    '<h4 style="font-size:12px">🧾 Ingredientes (toca para tachar)</h4><div class="habits-today-grid">' + ingHTML + '</div>' +
    '<h4 style="font-size:12px;margin-top:8px">👩‍🍳 Preparación</h4>' + pasosHTML +
    '<div class="si-card" style="margin-top:8px"><h4>💡 Uso</h4><p>' + esc(r.uso) + '</p><h4>🫙 Conservación</h4><p>' + esc(r.conserva) + '</p></div>' +
    '<div class="lawen-warn">⚠️ ' + esc(r.aviso) + '</div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">' + esc(r.luna) + '<br>👶 ' + esc(r.kids) + '</p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' +
    '<button type="button" class="btn btn-accent rec-make" data-k="' + esc(r.id) + '" style="width:auto">🫙 La preparé → registrar</button>' +
    '<button type="button" class="btn rec-share" data-k="' + esc(r.id) + '" style="width:auto">📤 Compartir</button>' +
    '<button type="button" class="btn rec-close" style="width:auto">↑ Cerrar detalle</button></div></div>';
}

function recetaTexto(r) {
  return r.icon + ' ' + r.nombre + ' — Recetas Naturales Penco\n' +
    r.cat + ' · ' + r.tiempo + ' · rinde ' + r.rinde + ' · dura ' + (r.dura ? r.dura + ' días' : 'uso inmediato') + '\n\n' +
    'INGREDIENTES:\n' + r.ing.map(function (x) { return '• ' + x.c + ' ' + x.i; }).join('\n') + '\n\n' +
    'PREPARACIÓN:\n' + r.pasos.map(function (p, i) { return (i + 1) + '. ' + p; }).join('\n') + '\n\n' +
    'USO: ' + r.uso + '\nCONSERVA: ' + r.conserva + '\n⚠️ ' + r.aviso + '\n' + r.luna;
}

function bindRecetaBtns(scope) {
  scope.querySelectorAll('.rec-open').forEach(function (b) {
    b.onclick = function () {
      openReceta = (openReceta === b.dataset.k) ? null : b.dataset.k;
      multiplo = 1;
      renderRecetas();
      if (openReceta) {
        var d = $('recDet');
        if (d) d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };
  });
  scope.querySelectorAll('.rec-fav').forEach(function (b) {
    b.onclick = function () { toggleFav(b.dataset.k); };
  });
  scope.querySelectorAll('.rec-make').forEach(function (b) {
    b.onclick = function () {
      var r = recetaById(b.dataset.k);
      switchTab('Preps');
      refreshPrepSelect();
      var sel = $('rpReceta');
      if (sel && r) sel.value = r.id;
      if ($('rpFecha') && !$('rpFecha').value) $('rpFecha').value = todayKey();
      if ($('rpCant') && r) $('rpCant').value = r.rinde;
      var nt = $('rpNota');
      if (nt) nt.focus();
    };
  });
  scope.querySelectorAll('.rec-share').forEach(function (b) {
    b.onclick = function () {
      var r = recetaById(b.dataset.k);
      if (r) share(r.nombre, recetaTexto(r));
    };
  });
  scope.querySelectorAll('.rec-mult').forEach(function (b) {
    b.onclick = function () { multiplo = parseFloat(b.dataset.m) || 1; renderRecetas(); };
  });
  scope.querySelectorAll('.rec-close').forEach(function (b) {
    b.onclick = function () { openReceta = null; renderRecetas(); };
  });
  scope.querySelectorAll('[data-chk]').forEach(function (cb) {
    cb.onchange = function () {
      var s = store();
      if (!s.checks[openReceta]) s.checks[openReceta] = [];
      s.checks[openReceta][+cb.dataset.chk] = cb.checked;
      save();
      var lab = cb.closest('label');
      if (lab) lab.classList.toggle('done', cb.checked);
      renderResumen();
    };
  });
}

/* ---------------- BITÁCORA ---------------- */
var editLogId = null;
function refreshPrepSelect() {
  var s = $('rpReceta'); if (!s) return;
  var list = todasRecetas();
  s.innerHTML = list.map(function (r) {
    return '<option value="' + esc(r.id) + '">' + esc(r.icon + ' ' + r.nombre) + '</option>';
  }).join('');
  if ($('rpFecha') && !$('rpFecha').value) $('rpFecha').value = todayKey();
}
function stars(n) {
  n = +n || 0;
  var out = '';
  for (var i = 1; i <= 5; i++) out += i <= n ? '⭐' : '☆';
  return out;
}
function renderLog() {
  var box = $('recLogList'); if (!box) return;
  var s = store();
  var st = $('recLogStats');
  if (!s.log.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin preparaciones aún. Registra tu primera pasta o desodorante arriba 🫙</p>';
    if (st) st.textContent = '0 preparaciones';
    return;
  }
  var list = s.log.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  box.innerHTML = list.map(function (l) {
    var e = estadoVence(l);
    var dot = e.k === 'venc' ? '🔴' : e.k === 'hoy' ? '🔴' : e.k === 'prox' ? '🟡' : e.k === 'na' ? '⚡' : '🟢';
    return '<div class="hora-item"><span style="font-size:12px">' + dot + ' <b>' + esc(l.nombre || 'Preparación') + '</b> · ' + esc(l.fecha || '') +
      '<br><span class="muted" style="font-size:10px">' + esc(l.cantidad || '') + ' · ' + stars(l.rate) + ' · ' + esc(e.txt) + (e.v ? ' (' + esc(e.v) + ')' : '') + (l.nota ? '<br>📝 ' + esc(l.nota) : '') + '</span></span>' +
      '<span class="hora-actions"><button type="button" class="btn btn-icon rec-le" data-k="' + esc(l.id) + '" title="Editar">✏️</button>' +
      '<button type="button" class="btn btn-icon rec-lx" data-k="' + esc(l.id) + '" title="Borrar">✕</button></span></div>';
  }).join('');
  if (st) {
    var mes = s.log.filter(function (l) { return (l.fecha || '').slice(0, 7) === todayKey().slice(0, 7); }).length;
    st.textContent = s.log.length + ' preparaciones · ' + mes + ' este mes';
  }
  box.querySelectorAll('.rec-lx').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este registro?')) return;
      var s2 = store();
      s2.log = s2.log.filter(function (x) { return x.id !== b.dataset.k; });
      save(); renderAll();
    };
  });
  box.querySelectorAll('.rec-le').forEach(function (b) {
    b.onclick = function () {
      var s2 = store(), r = null;
      s2.log.forEach(function (x) { if (x.id === b.dataset.k) r = x; });
      if (!r) return;
      editLogId = r.id;
      refreshPrepSelect();
      $('rpReceta').value = r.recetaId;
      $('rpFecha').value = r.fecha;
      $('rpCant').value = r.cantidad || '';
      $('rpRate').value = String(r.rate || 5);
      $('rpNota').value = r.nota || '';
      $('rpAdd').textContent = '↻ Actualizar';
      $('rpCancel').classList.remove('hidden');
    };
  });
}

function renderAll() {
  refreshPrepSelect();
  renderResumen();
  renderRecetas();
  renderLog();
}

/* ---------------- SETUP ---------------- */
function setup() {
  /* 1) botón en Cuerpo & Salud > Cuidado */
  try {
    var g = document.querySelector('.action-group[data-group="cuerpo"] .group-btns');
    if (g && !$('btnRecetas')) {
      var btn = document.createElement('button');
      btn.id = 'btnRecetas'; btn.className = 'btn'; btn.type = 'button';
      btn.textContent = '🧴 Recetas Naturales';
      try { btn.setAttribute('data-sub', 'cuidado'); } catch (eS) {}
      btn.setAttribute('data-keywords', 'recetas naturales pasta dientes dental desodorante crema cremas jabon jabones shampoo champu balsamo labial exfoliante repelente multiuso cosmetica natural casera zero waste tocador higiene karite coco arcilla bicarbonato glicerina avena miel caléndula matico');
      var ref = g.querySelector('#btnNatacion');
      if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
      else g.appendChild(btn);
    }
  } catch (e) {}
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnRecetas') < 0) ALL_BTNS.push('btnRecetas');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnRecetas = ['cuerpo', 'cuidado'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['cuerpo|cuidado'] && BTN_ORDER['cuerpo|cuidado'].indexOf('btnRecetas') < 0) BTN_ORDER['cuerpo|cuidado'].push('btnRecetas');
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnRecetas = true; });
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}

  /* 2) diálogo */
  buildDialog();
  renderAll();

  var b = $('btnRecetas');
  if (b) b.onclick = function () {
    renderAll();
    switchTab('Resumen');
    openDlg('recetasDialog');
  };

  TABS.forEach(function (t) {
    var tb = $('tabRec' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var qq = $('recQ'); if (qq) qq.oninput = function () { fQ = qq.value; renderRecetas(); };
  var fc = $('recFC'); if (fc) fc.onchange = function () { fCat = fc.value; renderRecetas(); };
  var fo = $('recFavOnly'); if (fo) fo.onchange = function () { renderRecetas(); };

  var ad = $('rpAdd');
  if (ad) ad.onclick = function () {
    var rid = ($('rpReceta') || {}).value || '';
    var r = recetaById(rid);
    if (!r) return alert('Elige una receta');
    var fecha = ($('rpFecha') || {}).value || todayKey();
    var cant = clean((($('rpCant') || {}).value || '').trim(), 40) || r.rinde;
    var rate = parseInt(($('rpRate') || {}).value) || 5;
    var nota = clean((($('rpNota') || {}).value || '').trim(), 120);
    var s = store();
    if (editLogId) {
      s.log.forEach(function (x) {
        if (x.id === editLogId) { x.recetaId = r.id; x.nombre = r.icon + ' ' + r.nombre; x.fecha = fecha; x.cantidad = cant; x.rate = rate; x.nota = nota; }
      });
      editLogId = null;
      $('rpAdd').textContent = '+ Guardar';
      $('rpCancel').classList.add('hidden');
    } else {
      s.log.push({ id: uid('rl'), recetaId: r.id, nombre: r.icon + ' ' + r.nombre, fecha: fecha, cantidad: cant, rate: rate, nota: nota });
    }
    save('Preparación guardada 🫙');
    $('rpCant').value = ''; $('rpNota').value = '';
    renderAll();
  };
  var cc = $('rpCancel');
  if (cc) cc.onclick = function () {
    editLogId = null;
    $('rpAdd').textContent = '+ Guardar';
    cc.classList.add('hidden');
    $('rpCant').value = ''; $('rpNota').value = '';
  };
  var sh = $('recLogShare');
  if (sh) sh.onclick = function () {
    var s = store();
    if (!s.log.length) return alert('Aún no hay preparaciones');
    var t = '🧴 Mis preparaciones naturales — ' + todayKey() + '\n' +
      s.log.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 15).map(function (l) {
        return '• ' + l.fecha + ' · ' + l.nombre + ' · ' + (l.cantidad || '') + ' ' + stars(l.rate) + (l.nota ? ' — ' + l.nota : '');
      }).join('\n');
    share('Mis preparaciones', t);
  };
  var cl = $('recLogClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar toda la bitácora de preparaciones?')) return;
    store().log = [];
    save(); renderAll();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
