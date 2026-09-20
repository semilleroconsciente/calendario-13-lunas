/* ============================================================
   HIDROPONÍA — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente:
   - Botón btnHidroponia (Territorio > Tierra y Monte)
   - Diálogo hidroDialog con 6 pestañas:
     1) Guía (qué es, por qué en Penco, base mínima, seguridad,
        errores comunes)
     2) Sistemas (6 fichas: Kratky, balsa, mecha, NFT PVC,
        goteo en sustrato, torre vertical)
     3) Cultivos (14 fichas con pH, EC, días y luna)
     4) Solución (tabla nutrientes, calculadora, diagnóstico)
     5) Luna & Clima (momento lunar + Penco por estación)
     6) Mi cultivo (bitácora pH/EC/temp + recambio de agua)
   - Todo local y privado por usuario: userData().hidroponia
     { logs:[], hechos:{} }
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
    if (!u.hidroponia) u.hidroponia = { logs: [], hechos: {} };
    var h = u.hidroponia;
    if (!Array.isArray(h.logs)) h.logs = [];
    if (!h.hechos || Array.isArray(h.hechos)) h.hechos = {};
    return h;
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
function diasEntre(aKey, bKey) {
  try {
    var a = new Date(aKey + 'T12:00:00').getTime(), b = new Date(bKey + 'T12:00:00').getTime();
    return Math.round((b - a) / 86400000);
  } catch (e) { return 0; }
}

/* ---------------- DATOS ---------------- */
var GUIA = [
  { n: '¿Qué es la hidroponía?', ico: '💧', txt: 'Cultivar sin tierra: la raíz vive en agua con nutrientes disueltos (o en sustrato inerte como perlita, fibra de coco o arlita). La planta no necesita tierra, necesita agua + aire + luz + 13 minerales. Tú se los das medidos: pH 5.5–6.5 y EC según cultivo. En 1 m² de balcón en Penco puedes sacar lechugas todo el año sin carpir.' },
  { n: '¿Por qué sirve en Penco?', ico: '🏠', txt: 'Suelos arenosos de Lirquén–Playa Negra, viento sur que seca, inviernos con barro y veranos con corte de agua: la hidroponía gasta 80–90% menos agua (recircula), no depende del suelo del patio, y cabe en balcón, cocina luminosa o invernadero chico. Ideal para hojas (lechuga, cilantro, ciboulette) que en tierra se llenan de babosas en Pukem.' },
  { n: 'Base mínima (sin frustrarse)', ico: '🧰', txt: '1) Contenedor oscuro (la luz crea algas). 2) Canastillas + sustrato (esponja fenólica, perlita o coco). 3) Nutrientes hidropónicos (2 frascos A+B de semillería; no sirve solo "nitrato casero"). 4) Medidor: tiras de pH ($3.000) o medidor digital pH/EC ($15–25 mil, dura años). 5) Aire: en Kratky no necesitas bomba; en NFT/balsa sí (bomba de acuario 5W). 6) Luz: 4–6 h de sol directo o malla + ventana luminosa.' },
  { n: 'Seguridad agua + electricidad', ico: '⚠️', txt: '1) Bomba y enchufes SIEMPRE fuera del agua y en alto, con alargador con tapa. 2) Si cae agua al enchufe, corta el automático antes de tocar. 3) No tomes la solución ni la des a mascotas. 4) Etiqueta los frascos A/B lejos de niños (son sales concentradas). 5) Cambia guantes si tienes heridas: el agua estancada tibia cría hongos. 6) Temporal con corte de luz: el NFT sin bomba muere en horas — ten Kratky de respaldo.' },
  { n: 'Errores que matan todo (evítalos)', ico: '🚫', txt: '1) Contenedor transparente → algas verdes que roban oxígeno. Píntalo negro o fórralo. 2) No medir pH → pH 7.5+ bloquea hierro y la planta se pone amarilla aunque tenga comida. 3) Exceso de nutriente ("más es mejor") → puntas quemadas: mide EC. 4) Agua a 28°+ sin aire → raíz café y podrida: sombrea el estanque en Walüng. 5) Cambiar todo cada 3 días → estrés: recambia cada 14–21 días, rellena entremedio.' },
  { n: 'Regla de oro en 1 frase', ico: '🌱', txt: 'Raíz blanca + agua fresca + pH 6.0 = hidroponía sana. Si la raíz está café y huele mal, no agregues más nutriente: cambia el agua, baja la temperatura y da aire.' }
];

var SISTEMAS = [
  { n: 'Kratky (sin bomba, el primero)', ico: '🪣', tag: 'principiante · $8–12 mil', para: 'Lechuga, rúcula, albahaca, cilantro. 2–6 plantas en balcón. Cero electricidad.', mats: 'Bidón o caja plástica oscura 10–20 L con tapa + 4–6 canastillas 5 cm + sustrato (esponja/perlita) + nutrientes A+B + tiras pH.', como: 'Llena al 80% con agua reposada 24 h. Disuelve A+B según etiqueta (ej: 2 ml/L de cada uno). pH a 5.8–6.2. Pon plantines con raíz tocando justo el agua. Tapa para que no entre luz. No rellenes hasta que baje 1/3: deja "raíz aérea" arriba.', mant: 'Rellena con mitad de dosis cuando baje. Recambio total cada 21–28 días. Cosecha hoja externa desde día 30.', cuidado: 'Si el agua pasa 26°, mueve a sombra de tarde. Algas = forra mejor el contenedor.' },
  { n: 'Balsa flotante (raíz en agua)', ico: '🏄', tag: 'principiante · $12–20 mil', para: 'Lechugas y hierbas en cantidad. Ideal invernadero chico o patio techado.', mats: 'Caja 40–60 L + plancha de plumavit perforada + bomba aireadora de acuario 5W + piedra difusora + canastillas.', como: 'Perfora la plumavit (un hoyo por planta, 8–10 cm entre sí). Llena, nutre y oxigena 24/7 con la bomba. Las raíces cuelgan directo al agua. La plancha flota y sube/baja con el nivel.', mant: 'Bomba siempre encendida. Limpia la piedra 1 vez por luna (vinagre). Recambio cada 14–21 días.', cuidado: 'Corte de luz >6 h en verano: abre la tapa y bate el agua a mano 3 veces al día.' },
  { n: 'Mecha (maceta que se riega sola)', ico: '🪢', tag: 'principiante · $5–8 mil', para: 'Menta, toronjil, ciboulette, albahaca en cocina. 1–2 plantas, vacaciones sin riego.', mats: 'Maceta + depósito abajo (botella/balde) + mecha de algodón/fieltro o cordón de mop + perlita + fibra de coco.', como: 'Pasa 2 mechas del depósito al sustrato por los hoyos de la maceta. Depósito con solución a mitad de dosis. La mecha sube el agua por capilaridad. Rellena el depósito cuando se vacíe.', mant: 'Lava mechas 1 vez por luna (se tapan con sales). No sirve para tomate o plantas grandes (piden más agua de la que sube).', cuidado: 'Si el sustrato está siempre empapado, saca una mecha: raíz ahogada se pudre.' },
  { n: 'NFT en tubo PVC (canal continuo)', ico: '🔧', tag: 'intermedio · $35–60 mil', para: 'Lechugas en fila, 8–20 plantas en 2 m. El más productivo por metro.', mats: 'Tubo PVC 110 mm × 2–3 m + tapas + bomba de agua 800–1200 L/h + estanque 40 L + timer + canastillas 5 cm + sierra copa 55 mm.', como: 'Perfora el tubo cada 20–25 cm arriba. Inclina 1–2% hacia el estanque (2 cm por metro). La bomba sube el agua y baja como película de 2–3 mm por el tubo, 15 min ON / 15 min OFF de día (de noche cada 1 h). Raíz siempre húmeda, nunca inundada.', mant: 'Limpia filtro de bomba cada semana (raíces sueltas lo tapan). Recambio cada 14 días. En corte de luz, riega a mano cada 2 h de día.', cuidado: 'Tubo al sol de Walüng = agua a 30°: píntalo blanco por fuera y sombrea el estanque.' },
  { n: 'Goteo en sustrato (para frutos)', ico: '🍅', tag: 'intermedio · $25–45 mil', para: 'Tomate cherry, ají, pimentón, frutilla. Plantas grandes que Kratky no aguanta.', mats: 'Macetas 7–11 L + fibra de coco + perlita (50/50) + goteros o riego manual + estanque con bomba o regadera + tutores.', como: 'Llena macetas con coco+perlita (no tierra). Riega 2–4 veces al día con solución (que drene 10–20% por abajo). El drenaje se bota o se recircula filtrado. Entutora desde el trasplante: el fruto pesa.', mant: 'Mide EC del drenaje: si sube >0.5 sobre la entrada, lava con agua sola 1 riego. Recambio de estanque cada 14 días.', cuidado: 'Coco nuevo se lava antes (trae sales). Frutilla pide EC baja: mejor aparte del tomate.' },
  { n: 'Torre vertical (balcón chico)', ico: '🗼', tag: 'intermedio · $20–35 mil', para: 'Balcones de depto en Penco centro: 12–20 lechugas/hierbas en 0.25 m².', mats: 'Tubo PVC 160 mm × 1.2 m o 3–4 macetas apiladas + bomba chica + estanque 20 L abajo + canastillas laterales.', como: 'Perfora bolsillos en espiral cada 15 cm. La bomba sube la solución arriba y cae por gravedad bañando raíces. 15 min cada hora de día. Gira la torre 1/4 de vuelta cada 3 días para sol parejo.', mant: 'Revisa que ningún bolsillo se seque (el de arriba se tapa primero). Limpieza total entre ciclos.', cuidado: 'Viento sur tumba torres: amárrala al muro con abrazadera.' }
];

var CULTIVOS = [
  { n: 'Lechuga', ico: '🥬', ph: '5.8–6.2', ec: '0.8–1.2', dias: '30–40', sis: 'Kratky · Balsa · NFT', luna: 'Creciente', nota: 'La reina hidropónica. En Penco todo el año con malla en verano. Cosecha hoja externa y dura 2 lunas.' },
  { n: 'Rúcula', ico: '🌿', ph: '6.0–6.5', ec: '0.8–1.2', dias: '25–35', sis: 'Kratky · NFT', luna: 'Creciente', nota: 'Rápida y picante. Con calor se sube a flor: sombrea en Walüng y cosecha joven.' },
  { n: 'Cilantro', ico: '🌱', ph: '5.8–6.2', ec: '0.8–1.4', dias: '35–45', sis: 'Kratky · Balsa', luna: 'Creciente–Llena', nota: 'Odia el trasplante: siembra directo en canastilla (5–6 semillas). Tolera el frío de Pukem.' },
  { n: 'Perejil', ico: '🌿', ph: '5.8–6.5', ec: '0.8–1.4', dias: '50–70', sis: 'Kratky · Mecha', luna: 'Creciente', nota: 'Lento para germinar (hasta 21 días): paciencia. Después produce 3+ lunas seguidas.' },
  { n: 'Albahaca', ico: '🪴', ph: '5.5–6.0', ec: '1.0–1.6', dias: '40–55', sis: 'Kratky · Balsa', luna: 'Creciente', nota: 'Pide calor: en invierno solo en interior luminoso. Pellizca la punta para que se abra en mata.' },
  { n: 'Ciboulette', ico: '🧅', ph: '6.0–6.5', ec: '0.8–1.4', dias: '50–60 y rebrota', sis: 'Mecha · Kratky', luna: 'Menguante (rebrote)', nota: 'Corta a 3 cm y rebrota solo. Aguanta el sur y la helada suave pencona.' },
  { n: 'Espinaca', ico: '🥗', ph: '6.0–6.5', ec: '1.0–1.6', dias: '35–50', sis: 'Balsa · NFT', luna: 'Creciente', nota: 'Le gusta el frío: mejor de Pewü a Rimü. En verano se espiga: evita Walüng pleno.' },
  { n: 'Acelga', ico: '🥬', ph: '6.0–6.5', ec: '1.2–1.8', dias: '45–60', sis: 'Balsa · Goteo', luna: 'Creciente', nota: 'Hojas grandes = maceta/canastilla grande y EC un poco mayor. Cosecha externa.' },
  { n: 'Kale', ico: '🥦', ph: '5.8–6.2', ec: '1.2–1.8', dias: '50–65', sis: 'Balsa · Goteo', luna: 'Creciente', nota: 'Firme contra el viento sur. Más dulce después de noches frías de Pukem.' },
  { n: 'Tomate cherry', ico: '🍅', ph: '5.8–6.2', ec: '1.8–2.4', dias: '70–90', sis: 'Goteo (solo frutos)', luna: 'Creciente', nota: 'Solo en goteo con tutor. Afuera de Oct a Mar (Pewü–Walüng). Poda chupones 1 vez por semana.' },
  { n: 'Ají / Pimentón', ico: '🌶️', ph: '5.8–6.2', ec: '1.8–2.4', dias: '80–100', sis: 'Goteo', luna: 'Creciente', nota: 'Piden calor y calma de viento: invernadero o muro norte. Menos agua que el tomate.' },
  { n: 'Frutilla', ico: '🍓', ph: '5.5–6.0', ec: '1.0–1.4', dias: '60–80 y sigue', luna: 'Creciente', sis: 'Goteo · Torre', nota: 'EC baja y corona fuera del agua (se pudre). Saca estolones para multiplicar gratis.' },
  { n: 'Menta / Toronjil', ico: '🍃', ph: '5.8–6.5', ec: '0.8–1.2', dias: '40–50 y perenne', sis: 'Mecha · Kratky', luna: 'Creciente', nota: 'Invasiva: siempre sola en su balde. Con mecha vive años en la cocina.' },
  { n: 'Orégano / Tomillo', ico: '🌿', ph: '6.0–6.8', ec: '0.8–1.2', dias: '60+ perenne', sis: 'Mecha · Goteo suave', luna: 'Menguante', nota: 'Piden menos agua: deja secar entre riegos. Podalas para que no se pongan leñosas.' }
];

var NUTRIENTES = [
  { n: 'Solución hoja (lechuga, hierbas)', ico: '🥬', dosis: 'A 2 ml/L + B 2 ml/L', ec: 'EC 0.8–1.4 · pH 5.8–6.2', txt: 'Base para empezar. Si las hojas están verde claro y crecen lento, sube a 2.5 ml/L. Si las puntas se queman, baja a 1.5 ml/L.' },
  { n: 'Solución fruto (tomate, ají, frutilla)', ico: '🍅', dosis: 'A 3 ml/L + B 3 ml/L (+ calcio extra en flor)', ec: 'EC 1.6–2.4 · pH 5.8–6.2', txt: 'Cuando aparece la primera flor, sube la dosis. Frutilla siempre al rango bajo (1.0–1.4): es sensible a sales.' },
  { n: 'Agua base Penco', ico: '🚰', txt: 'Agua de llave reposada 24 h (pierde cloro). EC base ~0.2–0.4: réstala del objetivo. Si usas agua de lluvia (Pukem), EC ~0.0: parte con dosis completa. Nunca uses agua de mar ni de estero sin analizar.' },
  { n: 'Ajuste de pH casero y seguro', ico: '⚗️', txt: 'pH alto (>6.8): baja con 2–3 gotas de ácido cítrico (repostería) por 10 L, espera 30 min y mide. pH bajo (<5.2): sube con pizca de bicarbonato. Ajusta de a poco: 0.5 por vez. Anota cuánto usaste para repetir.' }
];

var DIAG = [
  { s: 'Hojas amarillas parejas (abajo primero)', c: 'Falta nitrógeno o pH >6.8 bloqueando hierro.', a: 'Mide pH primero. Si está alto, corrige a 6.0. Si está bien, sube EC +0.2.' },
  { s: 'Puntas marrones / quemadas', c: 'Exceso de sales (EC muy alta) o calor + poca agua.', a: 'Baja EC: cambia mitad del agua por agua sola. Sombrea en Walüng.' },
  { s: 'Raíz café, blanda, mal olor', c: 'Pudrición: agua caliente (>26°) sin oxígeno.', a: 'Cambia el agua completa, corta lo podrido, sombrea el estanque y agrega aire. No agregues más nutriente.' },
  { s: 'Agua verde / algas', c: 'Luz entrando al estanque o nutrientes con luz.', a: 'Forra el contenedor de negro, tapa todo hoyo libre. Limpia con agua + gotas de agua oxigenada, enjuaga y renueva.' },
  { s: 'Tallo largo y flaco (ahilado)', c: 'Falta luz.', a: 'Mueve a 4–6 h de sol o acerca a ventana norte. Gira el sistema cada 3 días.' },
  { s: 'Mosquitos / larvas en el agua', c: 'Agua quieta destapada.', a: 'Tapa con malla mosquitera, agrega aireación. Cambia el agua si hay muchas larvas.' }
];

var LUNA = [
  { f: '🌑 Luna nueva', q: 'Arma, limpia y parte: lava estanques, siembra almácigos en esponja, prepara solución nueva. La planta está lenta y tolera trasplantes.', no: 'No esperes estirón visible esta semana: la energía va a la raíz.' },
  { f: '🌒 Luna creciente', q: 'Siembra hoja y trasplanta a sistema definitivo. Germinación y estirón más rápidos: sube EC con cuidado y revisa pH 2 veces por semana.', no: 'Riega/oxigena parejo: el estirón toma más agua y baja el nivel rápido.' },
  { f: '🌕 Luna llena', q: 'Observa y mide: color, raíz blanca, EC y pH. Máxima savia = se nota todo (también plagas). Cosecha hoja para consumo fresco.', no: 'No hagas cambios grandes (podas fuertes, trasplantes, recambio total): deja el sistema quieto.' },
  { f: '🌖 Luna menguante', q: 'Mantención: recambio de agua cada 14–21 días, poda suave, cosecha para guardar/secar, lava filtros y piedras difusoras.', no: 'No partas frutos nuevos: cierra el ciclo, ordena y planifica la próxima tanda.' }
];

var CLIMA = [
  { e: 'Pukem (invierno) · Lunas 1–3', t: 'Frío y lluvia: protege bombas del agua, baja EC un poco (la planta come lento), prioriza lechuga, espinaca, ciboulette. Interior luminoso para albahaca.' },
  { e: 'Pewü (primavera) · Lunas 4–6', t: 'Siembra grande: todo lo de hoja + almácigos de tomate/ají adentro. Sube EC progresivo. Ojo con pulgones de primavera: malla y revisión bajo la hoja.' },
  { e: 'Walüng (verano) · Lunas 7–9', t: 'Calor + sur: sombrea estanques (agua <26°), malla raschel 35%, revisa nivel a diario. Tomate y ají afuera. Frutilla con EC baja.' },
  { e: 'Rimü (otoño) · Lunas 10–13', t: 'Últimos tomates, siembra otoñal de hoja. Limpieza grande anual: desarma, lava con vinagre, guarda lo delicado antes de las heladas.' }
];

/* ---------------- DIALOGO ---------------- */
var TABS = ['Guia', 'Sistemas', 'Cultivos', 'Solucion', 'Luna', 'Cultivo'];
function switchTab(name) {
  TABS.forEach(function (t) {
    var p = $('hidro' + t), b = $('tabHidro' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

function buildDialog() {
  var guiaHTML = GUIA.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + esc(c.txt) + '</p></div>';
  }).join('');

  var sisHTML = SISTEMAS.map(function (s) {
    var matsArr = Array.isArray(s.mats) ? s.mats : String(s.mats || '').split(' + ');
    var mats = matsArr.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('');
    var pasos = s.como.split('. ').map(function (p, i) { return p ? '<li>' + esc(p.trim()) + '</li>' : ''; }).join('');
    return '<div class="si-card"><h4>' + s.ico + ' ' + esc(s.n) + '</h4>' +
      '<p><span class="chip" style="font-size:10px">' + esc(s.tag) + '</span></p>' +
      '<p><b>Para:</b> ' + esc(s.para) + '</p>' +
      '<p><b>Materiales (ferretería/semillería Penco):</b></p><ol style="font-size:12px;margin:4px 0 4px 18px">' + mats + '</ol>' +
      '<p><b>Paso a paso:</b></p><ol style="font-size:12px;margin:4px 0 4px 18px;line-height:1.6">' + pasos + '</ol>' +
      '<p class="muted" style="font-size:11px">🔄 <b>Mantención:</b> ' + esc(s.mant) + '</p>' +
      '<p style="font-size:11px;color:#e8c56a">⚠️ ' + esc(s.cuidado) + '</p>' +
      '<div style="display:flex;gap:6px;margin-top:6px"><button type="button" class="btn hidro-use" data-n="' + esc(s.n) + '" style="width:auto;font-size:11px">➕ Usar este sistema en Mi cultivo</button></div></div>';
  }).join('');

  var culHTML = CULTIVOS.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4>' +
      '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">pH ' + esc(c.ph) + '</span>' +
      '<span class="chip" style="font-size:10px">EC ' + esc(c.ec) + '</span>' +
      '<span class="chip" style="font-size:10px">⏱ ' + esc(c.dias) + ' días</span>' +
      '<span class="chip" style="font-size:10px">🌙 ' + esc(c.luna) + '</span></p>' +
      '<p><b>Sistema:</b> ' + esc(c.sis) + '</p>' +
      '<p class="muted">' + esc(c.nota) + '</p>' +
      '<div style="display:flex;gap:6px;margin-top:6px"><button type="button" class="btn hidro-crop" data-n="' + esc(c.n) + '" style="width:auto;font-size:11px">➕ Cultivar este en Mi cultivo</button></div></div>';
  }).join('');

  var nutHTML = NUTRIENTES.map(function (n) {
    return '<div class="si-card"><h4>' + (n.ico ? n.ico + ' ' : '') + esc(n.n) + '</h4>' +
      (n.dosis ? '<p><b>Dosis:</b> ' + esc(n.dosis) + '<br><b>Objetivo:</b> ' + esc(n.ec) + '</p>' : '') +
      '<p>' + esc(n.txt) + '</p></div>';
  }).join('');

  var diagHTML = DIAG.map(function (d) {
    return '<div class="si-card"><h4>🔍 ' + esc(d.s) + '</h4><p><b>Causa probable:</b> ' + esc(d.c) + '</p><p class="muted"><b>Qué hacer:</b> ' + esc(d.a) + '</p></div>';
  }).join('');

  var lunaHTML = LUNA.map(function (l) {
    return '<div class="si-card"><h4>' + esc(l.f) + '</h4><p>' + esc(l.q) + '</p><p class="muted">' + esc(l.no) + '</p></div>';
  }).join('');

  var climaHTML = CLIMA.map(function (c) {
    return '<div class="si-card"><h4>' + esc(c.e) + '</h4><p>' + esc(c.t) + '</p></div>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabHidroGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabHidroSistemas" class="btn" style="width:auto">🔧 Sistemas</button>' +
    '<button type="button" id="tabHidroCultivos" class="btn" style="width:auto">🌱 Cultivos</button>' +
    '<button type="button" id="tabHidroSolucion" class="btn" style="width:auto">⚗️ Solución</button>' +
    '<button type="button" id="tabHidroLuna" class="btn" style="width:auto">🌙 Luna & Clima</button>' +
    '<button type="button" id="tabHidroCultivo" class="btn" style="width:auto">📓 Mi cultivo</button></div>' +
    '<div id="hidroGuia">' + guiaHTML + '</div>' +
    '<div id="hidroSistemas" class="hidden"><div class="conv-row"><label style="flex:1">🔍 Filtrar <input type="text" id="hidroFilterSis" placeholder="kratky, bomba, balcón, tomate..."></label></div><div id="hidroSisList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + sisHTML + '</div></div>' +
    '<div id="hidroCultivos" class="hidden"><div class="conv-row"><label style="flex:1">🔍 Filtrar <input type="text" id="hidroFilterCul" placeholder="lechuga, ají, frutilla..."></label></div><div id="hidroCulList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + culHTML + '</div></div>' +
    '<div id="hidroSolucion" class="hidden">' + nutHTML +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🧮 Calculadora de dosis</h4>' +
    '<div class="conv-row"><label>Litros del estanque <input type="number" id="hidroLitros" min="1" max="500" value="10" step="1"></label>' +
    '<label>Dosis (ml/L de A y de B) <input type="number" id="hidroDosis" min="0.5" max="5" value="2" step="0.5"></label></div>' +
    '<div id="hidroCalcOut" class="conv-result" style="margin-top:8px">—</div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">Disuelve primero A en un balde con agua, revuelve, luego B en otro balde. Nunca mezcles A+B concentrados directo: se cortan.</p></div>' +
    '<div style="margin-top:10px"><h4 style="color:var(--gold);font-size:13px;margin-bottom:6px">🩺 Diagnóstico rápido</h4>' + diagHTML + '</div></div>' +
    '<div id="hidroLuna" class="hidden"><div id="hidroHoyBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + lunaHTML + '</div>' +
    '<div style="margin-top:10px"><h4 style="color:var(--gold);font-size:13px;margin-bottom:6px">🌦️ Penco por estación</h4>' + climaHTML + '</div></div>' +
    '<div id="hidroCultivo" class="hidden">' +
    '<div id="hidroAlerta" class="menstrual-card hidden" style="border-color:#e76e8a"></div>' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Nuevo control</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="hidroFecha"></label><label>Sistema <select id="hidroSistema"><option>Kratky (sin bomba)</option><option>Balsa flotante</option><option>Mecha</option><option>NFT en PVC</option><option>Goteo en sustrato</option><option>Torre vertical</option></select></label></div>' +
    '<div class="conv-row"><label>Cultivo <input type="text" id="hidroCult" placeholder="ej: Lechuga" maxlength="30"></label><label>Etapa <select id="hidroEtapa"><option>Almácigo</option><option>Trasplante</option><option>Crecimiento</option><option>Flor / Fruto</option><option>Cosecha</option></select></label></div>' +
    '<div class="conv-row"><label>pH <input type="number" id="hidroPH" min="3" max="9" step="0.1" placeholder="ej: 6.0"></label><label>EC (mS/cm) <input type="number" id="hidroEC" min="0" max="5" step="0.1" placeholder="ej: 1.2"></label><label>T° agua <input type="number" id="hidroTemp" min="0" max="40" step="0.5" placeholder="ej: 20"></label></div>' +
    '<div class="conv-row"><label style="flex:1">Cambio de agua <select id="hidroCambio"><option value="no">No (relleno / control)</option><option value="relleno">Rellené nivel</option><option value="total">Recambio total</option></select></label></div>' +
    '<label>Notas <input type="text" id="hidroNota" placeholder="ej: raíz blanca, bajó 2 L, día de sur" maxlength="100"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="hidroAdd" class="btn btn-accent" style="width:auto">+ Guardar control</button></div></div>' +
    '<div id="hidroResumen" class="menstrual-card" style="margin-top:10px"></div>' +
    '<div id="hidroLog" class="habits-list" style="margin-top:10px;max-height:260px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="hidroStats" class="muted" style="font-size:11px"></span><span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="hidroShare" class="btn" style="width:auto">📤 Compartir</button><button type="button" id="hidroExport" class="btn" style="width:auto">📥 Exportar</button><button type="button" id="hidroClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>';

  makeDialog('hidroDialog', '💧 Hidroponía — cultiva sin tierra en Penco',
    'Del balde Kratky al tubo NFT: hojas todo el año con 90% menos agua. <b>Raíz blanca + pH 6.0 = todo bien.</b> Todo queda <b>privado y local</b>.',
    body);
}

/* ---------------- BITÁCORA ---------------- */
function chipPH(ph) {
  if (ph == null || isNaN(ph)) return '';
  if (ph >= 5.5 && ph <= 6.5) return ' <span class="chip" style="font-size:10px;color:#8fd694;border-color:#8fd69455">pH ' + ph + ' ✓</span>';
  return ' <span class="chip" style="font-size:10px;color:#e76e8a;border-color:#e76e8a55">pH ' + ph + ' ⚠</span>';
}
function chipEC(ec) {
  if (ec == null || isNaN(ec)) return '';
  if (ec >= 0.8 && ec <= 2.4) return ' <span class="chip" style="font-size:10px;color:#8fc7e8;border-color:#8fc7e855">EC ' + ec + '</span>';
  return ' <span class="chip" style="font-size:10px;color:#e8c56a;border-color:#e8c56a55">EC ' + ec + ' ⚠</span>';
}
function renderLog() {
  var box = $('hidroLog'); if (!box) return;
  var h = store();
  var data = h.logs || [];
  var res = $('hidroResumen'), st = $('hidroStats'), al = $('hidroAlerta');
  if (!data.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin controles. Guarda el primero arriba: fecha + pH + EC.</p>';
    if (res) res.innerHTML = '<h4>📊 Tu cultivo</h4><p class="muted" style="font-size:11px">Con 2+ controles verás promedios de pH/EC y días desde el último recambio.</p>';
    if (st) st.textContent = '';
    if (al) al.classList.add('hidden');
    return;
  }
  var s = data.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  box.innerHTML = s.map(function (r) {
    return '<div class="hora-item"><span style="font-size:12px"><b>' + esc(r.cultivo || 'Cultivo') + '</b> · ' + esc(r.sistema || '') +
      chipPH(r.ph) + chipEC(r.ec) +
      '<br><span class="muted" style="font-size:10px">' + esc(r.fecha || '') + ' · ' + esc(r.etapa || '') +
      (r.temp != null ? ' · ' + r.temp + '°C' : '') +
      (r.cambio === 'total' ? ' · 🔄 recambio' : r.cambio === 'relleno' ? ' · 💧 relleno' : '') +
      (r.nota ? ' · ' + esc(r.nota) : '') + '</span></span>' +
      '<button type="button" class="btn btn-icon hidro-del" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.hidro-del').forEach(function (x) {
    x.onclick = function () {
      var st2 = store();
      st2.logs = (st2.logs || []).filter(function (r) { return r.id !== x.dataset.k; });
      save(); renderLog();
    };
  });
  var conPH = data.filter(function (r) { return r.ph != null && !isNaN(r.ph); });
  var conEC = data.filter(function (r) { return r.ec != null && !isNaN(r.ec); });
  var avg = function (arr, k) { if (!arr.length) return null; var t = 0; arr.forEach(function (r) { t += (+r[k] || 0); }); return Math.round((t / arr.length) * 10) / 10; };
  var aPH = avg(conPH, 'ph'), aEC = avg(conEC, 'ec');
  var ultimoTotal = null;
  s.forEach(function (r) { if (ultimoTotal == null && r.cambio === 'total') ultimoTotal = r.fecha; });
  var diasRecambio = ultimoTotal ? diasEntre(ultimoTotal, todayKey()) : null;
  var consejo = '';
  if (aPH != null && (aPH < 5.5 || aPH > 6.5)) consejo += '⚠️ pH promedio ' + aPH + ' fuera de 5.5–6.5: corrige de a poco (0.5 por vez). ';
  if (diasRecambio != null && diasRecambio > 21) consejo += '🔄 Llevas ' + diasRecambio + ' días sin recambio total: programa uno en menguante. ';
  else if (diasRecambio != null) consejo += '💧 Último recambio hace ' + diasRecambio + ' días. Ideal cada 14–21. ';
  else consejo += '💧 Aún no registras recambio total: anota el próximo como "Recambio total". ';
  if (!consejo) consejo = 'Todo en rango. Sigue midiendo 2 veces por semana.';
  if (res) res.innerHTML = '<h4>📊 Tu cultivo (' + data.length + ' controles)</h4><p style="font-size:12px">pH prom: <b>' + (aPH != null ? aPH : '–') + '</b> (ideal 5.5–6.5) · EC prom: <b>' + (aEC != null ? aEC : '–') + '</b></p><p class="muted" style="font-size:11px">' + esc(consejo) + '</p>';
  if (st) st.textContent = data.length + ' control(es)';
  if (al) {
    var malo = conPH.length && (aPH < 5.2 || aPH > 6.8);
    if (malo) { al.classList.remove('hidden'); al.innerHTML = '<h4>⚠️ Revisa tu pH</h4><p class="muted" style="font-size:11px">Promedio ' + aPH + ' bloquea nutrientes aunque tengas comida. Corrige hoy a 6.0 (ver pestaña ⚗️ Solución).</p>'; }
    else al.classList.add('hidden');
  }
}

function paintHoy() {
  var b = $('hidroHoyBox'); if (!b) return;
  var l = lunaDeHoy();
  var txt = l ? ('Hoy · Luna ' + l.luna + ' · día ' + l.dia) : ('Hoy · ' + todayKey());
  var rec = !l ? 'Mide pH y EC 2 veces por semana.' : l.luna <= 3 ? 'Pukem: protege del frío, baja EC un poco, prioriza hoja. Lava y parte sistemas nuevos.' : l.luna <= 6 ? 'Pewü: siembra grande de hoja + almácigos de tomate. Sube EC progresivo.' : l.luna <= 9 ? 'Walüng: sombrea estanques (agua bajo 26°), revisa nivel a diario. Cosecha hoja externa.' : 'Rimü: últimos frutos, siembra otoñal, limpieza anual con vinagre.';
  b.innerHTML = '<h4>🌙 ' + esc(txt) + '</h4><p class="muted" style="font-size:12px">' + esc(rec) + '</p>';
  if ($('hidroFecha') && !$('hidroFecha').value) $('hidroFecha').value = todayKey();
}

function paintCalc() {
  var out = $('hidroCalcOut'); if (!out) return;
  var L = parseFloat(($('hidroLitros') || {}).value), D = parseFloat(($('hidroDosis') || {}).value);
  if (isNaN(L) || isNaN(D) || L <= 0 || D <= 0) { out.textContent = '—'; return; }
  var ml = Math.round(L * D * 10) / 10;
  out.innerHTML = 'Agrega <b>' + ml + ' ml de A</b> + <b>' + ml + ' ml de B</b> en ' + L + ' L <span class="muted" style="font-size:11px">(disueltos por separado)</span>';
}

function filtrar(inputId, listId) {
  var f = $(inputId), list = $(listId);
  if (!f || !list) return;
  f.oninput = function () {
    var q = (f.value || '').toLowerCase();
    var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
    list.querySelectorAll('.si-card').forEach(function (c) {
      var t = (c.textContent || '').toLowerCase();
      var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
      c.style.display = (!q || tn.indexOf(qn) >= 0) ? '' : 'none';
    });
  };
}

/* ---------------- SETUP ---------------- */
function setup() {
  /* 1) inyectar botón en Territorio > Tierra */
  try {
    var existing = $('btnHidroponia');
    if (!existing) {
      var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnHidroponia'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '💧 Hidroponía';
        try { btn.setAttribute('data-sub', 'tierra'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'hidroponia hidroponico hidroponicos kratky nft balsa flotante mecha goteo torre vertical ph ec nutrientes solucion lechuga tomate sustrato perlita coco estanque bomba agua sin tierra balcon');
        var ref = g.querySelector('#btnCompost');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else if (ref) g.appendChild(btn);
        else {
          var ref2 = g.querySelector('#btnSiembra');
          if (ref2 && ref2.nextSibling) g.insertBefore(btn, ref2.nextSibling);
          else g.appendChild(btn);
        }
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnHidroponia') < 0) ALL_BTNS.push('btnHidroponia');
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnHidroponia = true; });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  /* 3) checkbox en configDialog */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnHidroponia"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Territorio') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnHidroponia"> 💧 Hidroponía';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnHidroponia !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnHidroponia = lab.querySelector('input').checked;
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
  paintHoy(); renderLog(); paintCalc();

  var b = $('btnHidroponia');
  if (b) b.onclick = function () {
    paintHoy(); renderLog(); paintCalc();
    openDlg('hidroDialog');
  };

  TABS.forEach(function (t) {
    var tb = $('tabHidro' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  filtrar('hidroFilterSis', 'hidroSisList');
  filtrar('hidroFilterCul', 'hidroCulList');

  var li = $('hidroLitros'), ds = $('hidroDosis');
  if (li) li.oninput = paintCalc;
  if (ds) ds.oninput = paintCalc;

  document.querySelectorAll('.hidro-use').forEach(function (x) {
    x.onclick = function () {
      switchTab('Cultivo');
      var sel = $('hidroSistema');
      if (sel) {
        var n = x.getAttribute('data-n') || '';
        for (var i = 0; i < sel.options.length; i++) {
          if (n.indexOf(sel.options[i].text.split(' ')[0]) >= 0) { sel.selectedIndex = i; break; }
        }
        if (n.indexOf('Kratky') >= 0) sel.selectedIndex = 0;
        else if (n.indexOf('Balsa') >= 0) sel.selectedIndex = 1;
        else if (n.indexOf('Mecha') >= 0) sel.selectedIndex = 2;
        else if (n.indexOf('NFT') >= 0) sel.selectedIndex = 3;
        else if (n.indexOf('Goteo') >= 0) sel.selectedIndex = 4;
        else if (n.indexOf('Torre') >= 0) sel.selectedIndex = 5;
      }
      try { $('hidroCult').focus(); } catch (e) {}
    };
  });
  document.querySelectorAll('.hidro-crop').forEach(function (x) {
    x.onclick = function () {
      switchTab('Cultivo');
      var c = $('hidroCult');
      if (c) c.value = x.getAttribute('data-n') || '';
      try { $('hidroPH').focus(); } catch (e) {}
    };
  });

  var ad = $('hidroAdd');
  if (ad) ad.onclick = function () {
    var fecha = ($('hidroFecha') || {}).value || todayKey();
    var cult = clean((($('hidroCult') || {}).value || '').trim(), 30);
    if (!cult) return alert('Escribe el cultivo (ej: Lechuga)');
    var ph = parseFloat(($('hidroPH') || {}).value), ec = parseFloat(($('hidroEC') || {}).value), tp = parseFloat(($('hidroTemp') || {}).value);
    var h = store();
    h.logs.push({
      id: uid('hi'), fecha: fecha, cultivo: cult,
      sistema: ($('hidroSistema') || {}).value || 'Kratky (sin bomba)',
      etapa: ($('hidroEtapa') || {}).value || 'Crecimiento',
      ph: isNaN(ph) ? null : Math.round(ph * 10) / 10,
      ec: isNaN(ec) ? null : Math.round(ec * 10) / 10,
      temp: isNaN(tp) ? null : tp,
      cambio: ($('hidroCambio') || {}).value || 'no',
      nota: clean((($('hidroNota') || {}).value || '').trim(), 100)
    });
    save('Control guardado 💧');
    if ($('hidroNota')) $('hidroNota').value = '';
    renderLog();
  };

  var sh = $('hidroShare');
  if (sh) sh.onclick = async function () {
    var d = store().logs || [];
    if (!d.length) return alert('Sin controles aún');
    var t = '💧 Mi hidroponía en Penco\n' + d.slice().sort(function (a, b) { return (a.fecha || '').localeCompare(b.fecha || ''); }).map(function (r) {
      return '• ' + r.fecha + ' · ' + r.cultivo + ' · ' + r.sistema + ' · ' + r.etapa + ' · pH ' + (r.ph != null ? r.ph : '–') + ' · EC ' + (r.ec != null ? r.ec : '–') + (r.temp != null ? ' · ' + r.temp + '°C' : '') + (r.nota ? ' — ' + r.nota : '');
    }).join('\n');
    await share('Hidroponía', t);
  };
  var ex = $('hidroExport');
  if (ex) ex.onclick = async function () {
    var h = store();
    var t = '💧 HIDROPONÍA — exportación ' + todayKey() + '\n\n' +
      (h.logs || []).map(function (r) { return [r.fecha, r.cultivo, r.sistema, r.etapa, r.ph, r.ec, r.temp, r.cambio, r.nota].join(' | '); }).join('\n');
    await share('Exportar hidroponía', t || 'Sin datos');
  };
  var cl = $('hidroClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu bitácora de hidroponía?')) return;
    try { var u = userData(); if (u && u.hidroponia) u.hidroponia.logs = []; } catch (e) {}
    save(); renderLog();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
