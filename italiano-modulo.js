/* ============================================================
   ITALIANO · ITALIANO A1 → C1 + CULTURA — Calendario 13 Lunas
   Sección completa dentro de Aprender > Idiomas y cultura:
   - Botón btnItaliano (grupo aprender, sub idiomas, junto a
     Kimün Mapuzugun, Inglés, Portugués, Chino y Hindi)
   - Diálogo italianoDialog con 6 pestañas:
     1) ☀️ Parola del giorno (palabra/frase rotativa + TTS it-IT)
     2) 🌱 A1 Sopravvivenza (20 tarjetas + essere/avere + mini-diálogo)
     3) 🌿 A2 Vita quotidiana (14 tarjetas + passato + direzioni)
     4) 💬 B1 Viaggiare, lavorare e opinare (10 + futuro/congiuntivo)
     5) 📜 B2–C1 + Cultura (espressioni, falsi amici, doppie,
        pronuncia, gesti, musica, cibo, arte)
     6) 🧩 Quiz por niveles + racha local
   - Todo local y privado por usuario:
     userData().italiano = { ok, total, streak, lastDay }
   - 100% offline. TTS usa la voz del dispositivo (speechSynthesis
     con lang it-IT), igual que Inglés, Portugués, Chino e Hindi.
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
function openDlg(id) {
  var d = $(id);
  if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } }
}

/* ---------------- CONTENIDO ---------------- */
/* it: italiano · es: español · ex: ejemplo (italiano — español) */
var IT_A1 = [
  { it: 'ciao', es: 'hola / chao', ex: 'Ciao, come stai? — Hola, ¿cómo estás?' },
  { it: 'grazie', es: 'gracias', ex: 'Grazie mille. — Muchas gracias.' },
  { it: 'per favore', es: 'por favor', ex: 'Un caffè, per favore. — Un café, por favor.' },
  { it: 'buongiorno', es: 'buenos días', ex: 'Buongiorno, ragazzi. — Buenos días, clase.' },
  { it: 'buonasera / buonanotte', es: 'buenas tardes / buenas noches', ex: 'Buonanotte, a domani. — Buenas noches, hasta mañana.' },
  { it: 'mi chiamo…', es: 'me llamo…', ex: 'Mi chiamo Ana. — Me llamo Ana.' },
  { it: 'sono del Cile / sono cilena', es: 'soy de Chile / soy chilena', ex: 'Sono di Penco, Cile. — Soy de Penco, Chile.' },
  { it: 'parli spagnolo?', es: '¿hablas español?', ex: 'Parli spagnolo? Parlo un po’. — ¿Hablas español? Hablo un poco.' },
  { it: 'acqua', es: 'agua', ex: 'Un bicchiere d’acqua, per favore. — Un vaso de agua, por favor.' },
  { it: 'cibo / pane', es: 'comida / pan', ex: 'Pane e pesce, per favore. — Pan y pescado, por favor.' },
  { it: 'casa', es: 'casa / hogar', ex: 'La mia casa è vicino al mare. — Mi casa queda cerca del mar.' },
  { it: 'giorno / oggi', es: 'día / hoy', ex: 'Oggi è una bella giornata. — Hoy es un lindo día.' },
  { it: 'essere: io sono / tu sei', es: 'ser-estar: yo soy-estoy / tú eres-estás', ex: 'Io sono stanca. Tu sei gentile. — Estoy cansada. Eres amable.' },
  { it: 'avere: io ho', es: 'tener-haber: yo tengo-he', ex: 'Ho due sorelle. — Tengo dos hermanas.' },
  { it: 'numeri 1–20', es: 'números 1–20', ex: 'Uno, due, tre… venti. — Uno, dos, tres… veinte.' },
  { it: 'colori: rosso, blu, verde', es: 'colores: rojo, azul, verde', ex: 'Il mare è blu. — El mar es azul.' },
  { it: 'famiglia: mamma, papà', es: 'familia: mamá, papá', ex: 'La mia mamma cucina bene. — Mi mamá cocina bien.' },
  { it: 'mi piace…', es: 'me gusta…', ex: 'Mi piace il mare. — Me gusta el mar.' },
  { it: 'ho bisogno di…', es: 'necesito…', ex: 'Ho bisogno di aiuto, per favore. — Necesito ayuda, por favor.' },
  { it: 'a domani', es: 'nos vemos mañana', ex: 'Ciao! A domani. — ¡Chao! Nos vemos mañana.' }
];
var IT_A2 = [
  { it: 'Cosa hai fatto ieri?', es: '¿Qué hiciste ayer?', ex: 'Ho lavorato nell’orto. — Trabajé en la huerta.' },
  { it: 'vado a… / sto per…', es: 'voy a… / estoy por…', ex: 'Vado a cucinare. — Voy a cocinar.' },
  { it: 'più grande di / il più grande', es: 'más grande que / el más grande', ex: 'Il mare è più grande del fiume. — El mar es más grande que el río.' },
  { it: 'quanto costa? / quanti?', es: '¿cuánto cuesta? / ¿cuántos?', ex: 'Quanto costa? — ¿Cuánto cuesta?' },
  { it: 'devo lavorare', es: 'tengo que trabajar', ex: 'Devo andare adesso. — Me tengo que ir ahora.' },
  { it: 'puoi aiutarmi?', es: '¿puedes ayudarme?', ex: 'Puoi parlare piano? — ¿Puedes hablar despacio?' },
  { it: 'c’è / ci sono', es: 'hay (singular / plural)', ex: 'C’è un mercato. — Hay un mercado.' },
  { it: 'tempo: c’è il sole / piove', es: 'clima: hay sol / llueve', ex: 'Oggi piove a Penco. — Hoy llueve en Penco.' },
  { it: 'passato: sono andato/a, ho mangiato, ho visto', es: 'pasado: fui, comí, vi', ex: 'Siamo andati in spiaggia. — Fuimos a la playa.' },
  { it: 'fare la spesa: quanto fa?', es: 'compras: ¿cuánto es?', ex: 'Sono cinquemila pesos. — Son cinco mil pesos.' },
  { it: 'direzioni: giri a sinistra / a destra', es: 'direcciones: gira a la izquierda / derecha', ex: 'Giri a sinistra in piazza. — Gira a la izquierda en la plaza.' },
  { it: 'sentimenti: felice, stanco/a, malato/a', es: 'sentimientos: feliz, cansado/a, enfermo/a', ex: 'Oggi sono molto stanca. — Hoy estoy muy cansada.' },
  { it: 'cucinare / pulire / lavare', es: 'cocinar / limpiar / lavar', ex: 'Cucino ogni giorno. — Cocino todos los días.' },
  { it: 'appuntamento: alle tre del pomeriggio', es: 'cita: a las tres de la tarde', ex: 'Ci vediamo alle cinque. — Nos vemos a las cinco.' }
];
var IT_B1 = [
  { it: 'vivo qui da 5 anni', es: 'vivo aquí desde hace 5 años', ex: 'Non ho mai visto la neve. — Nunca he visto nieve.' },
  { it: 'se pioverà, restiamo a casa', es: 'si llueve, nos quedamos (se + futuro)', ex: 'Se studierai, imparerai. — Si estudias, aprenderás.' },
  { it: 'cercare / prendersi cura / non arrenderti', es: 'buscar / cuidar / rendirse', ex: 'Non arrenderti! — ¡No te rindas!' },
  { it: 'viaggio: vorrei un biglietto', es: 'viajes: quisiera un pasaje', ex: 'Un biglietto per Concepción, per favore. — Un pasaje a Concepción, por favor.' },
  { it: 'lavoro: sono responsabile di…', es: 'trabajo: soy responsable de…', ex: 'Sono responsabile dell’orto. — Estoy a cargo de la huerta.' },
  { it: 'opinione: penso che / secondo me', es: 'opinión: creo que / en mi opinión', ex: 'Penso che sia una buona idea. — Creo que es buena idea.' },
  { it: 'facevo + infinito (imperfetto)', es: 'solía + verbo (imperfecto)', ex: 'Da piccola suonavo la chitarra. — De niña tocaba guitarra.' },
  { it: 'quindi / perché / anche se', es: 'así que / porque / aunque', ex: 'Faceva freddo, quindi siamo restati a casa. — Hacía frío, así que nos quedamos.' },
  { it: 'salute: mi fa male la testa', es: 'salud: me duele la cabeza', ex: 'Ho bisogno di una visita. — Necesito una hora médica.' },
  { it: 'e-mail: cordiali saluti / un abbraccio', es: 'correo: atentamente / un abrazo', ex: 'Cordiali saluti, Ana. — Atentamente, Ana.' }
];
var IT_B2C1 = [
  { it: 'rompere il ghiaccio', es: 'romper el hielo', ex: 'Una barzelletta rompe il ghiaccio. — Un chiste rompe el hielo.' },
  { it: 'prendere due piccioni con una fava', es: 'matar dos pájaros de un tiro', ex: 'Con una visita vedo nonna e zia: due piccioni! — Visito a nonna y tía de una vez.' },
  { it: 'avere le mani in pasta', es: 'estar metido en todo (lit. manos en la masa)', ex: 'Lui ha le mani in pasta ovunque. — Él está metido en todo.' },
  { it: 'piovere sul bagnato', es: 'llover sobre mojado', ex: 'Prima il lavoro, poi la febbre: piove sul bagnato. — Desgracia tras desgracia.' },
  { it: 'ero già partito/a quando sei arrivata', es: 'ya me había ido cuando llegaste (trapassato prossimo)', ex: 'Para contar historias en pasado: ero + participio.' },
  { it: 'se avessi studiato, avrei passato', es: 'si hubiera estudiado, habría aprobado (condizionale passato)', ex: 'Arrepentimientos y lecciones: se avessi + avrei.' },
  { it: 'la spiaggia è stata pulita dai volontari', es: 'la playa fue limpiada (voz pasiva: essere + participio)', ex: 'Passiva: essere + participio + da.' },
  { it: 'ha detto che era stanca', es: 'dijo que estaba cansada (discurso indiretto)', ex: 'Directo → indiretto: sono → era.' },
  { it: 'colloquio: il mio punto di forza è…', es: 'entrevista: mi fortaleza es…', ex: 'Il mio punto di forza è il lavoro di squadra. — Mi fortaleza es el trabajo en equipo.' },
  { it: 'tuttavia / inoltre', es: 'sin embargo / además (ensayo)', ex: 'Tuttavia, il mare è vita. — Sin embargo, el mar es vida.' }
];
var IT_FALSI = [
  ['🇪🇸 burro (asno) → 🇮🇹 burro = mantequilla', '“Pane e burro” = pan con mantequilla. Asno se dice asino. Pide burro en el desayuno sin miedo.'],
  ['🇪🇸 embarazada → 🇮🇹 incinta (no imbarazzata)', 'Imbarazzata = avergonzada. “Sono imbarazzata” NO es embarazo: es “estoy avergonzada”.'],
  ['🇪🇸 largo → 🇮🇹 largo = ancho', 'Largo (extenso) se dice lungo. “Un lungo viaggio” = un viaje largo. Largo describe una calle ancha.'],
  ['🇪🇸 oficina → 🇮🇹 officina = taller mecánico', '“Portare la macchina in officina” = llevar el auto al taller. Oficina de trabajo se dice ufficio.'],
  ['🇪🇸 cena (escena) → 🇮🇹 scena = escena… ¡y cena = cena de noche!', '“Andiamo a cena?” = ¿vamos a cenar? Scena (con s) es la del teatro: contexto manda.'],
  ['🇪🇸 caldo (sopa) → 🇮🇹 caldo = caliente', '“Ho caldo” = tengo calor. Sopa caliente se dice zuppa calda o brodo. “Fa caldo oggi” = hoy hace calor.'],
  ['🇪🇸 salir → 🇮🇹 salire = subir', '“Salire le scale” = subir la escalera. Salir (irse) se dice uscire: “Esco stasera” = salgo esta noche.'],
  ['🇪🇸 pulpo → 🇮🇹 polpo = pulpo (polvere = polvo)', '“Polpo alla griglia” = pulpo a la parrilla. Polvo en el aire es polvere: “c’è polvere” = hay polvo.']
];
var IT_NORDSUD = [
  ['👋 ciao (informale) / salve (neutro) / buongiorno (formale)', 'Con desconocidos y mayores usa buongiorno/buonasera. Salve sirve en todo el centro-sur con cualquiera. Ciao solo con amigos y jóvenes.'],
  ['🫵 tu (cercano) / Lei (respeto con mayúscula)', 'Italia usa Lei + verbo de 3ª persona (Lei parla). Con Lei nunca fallas: empieza SIEMPRE en Lei con mayores, clientes y profes.'],
  ['🔊 sto parlando (norte y estándar) / sto a parlare (sur, coloquial)', 'Entiende ambos, usa el estándar “stare + gerundio”. En el sur oirás “sto a fa’”: es dialecto, no error.'],
  ['🍝 ragù (norte) / sugo (centro-sur) · anguria (norte) / cocomero (Roma-sur)', 'La misma salsa y la misma sandía cambian de nombre. Pregunta “come lo chiamate qui?”: abre conversación en cualquier mercato.'],
  ['🤌 i gesti contano più delle parole', 'Mano en piña hacia arriba = “¿qué quieres?”. Pulgar-índice en círculo = “perfecto/buonissimo”. Mirar sin gestos es perderse media frase.']
];

/* ---------------- ESTADO ---------------- */
var itaTab = 'parola';
var itaQuizQ = null;
var itaQuizLevel = 'todo';

function getItaData() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { ok: 0, total: 0, streak: 0, lastDay: '' };
    if (!u.italiano) u.italiano = { ok: 0, total: 0, streak: 0, lastDay: '' };
    return u.italiano;
  } catch (e) { return { ok: 0, total: 0, streak: 0, lastDay: '' }; }
}
function itaDayIndex(n) {
  try {
    var d = new Date();
    var s = d.getFullYear() * 1000 + Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
    return s % n;
  } catch (e) { return 0; }
}
function itaVozLimpia(t) {
  // "ciao / arrivederci" -> "ciao, arrivederci": evita que el locutor diga "barra".
  t = String(t == null ? '' : t);
  t = t.replace(/\s*\/\s*/g, ', ');
  t = t.replace(/(\d)\s*[-‐‑‒–—―－]\s*(\d)/g, '$1 al $2');
  t = t.replace(/[—–―─－]+/g, ', ');
  t = t.replace(/\s*[:;：；]\s*/g, ', ');
  t = t.replace(/[()（）\[\]{}<>«»]+/g, ', ');
  t = t.replace(/["“”‘’'´`·•●◦▪|\\_#*+=~^°]+/g, ' ');
  t = t.replace(/[〜~]+/g, ' ');
  t = t.replace(/[…]+/g, ' ');
  t = t.replace(/\.{2,}/g, '.');
  t = t.replace(/\s*,\s*,\s*/g, ', ');
  t = t.replace(/[ \t\u00a0]{2,}/g, ' ');
  t = t.replace(/\s*,\s*/g, ', ').replace(/,{2,}/g, ',');
  t = t.replace(/^[,\s]+|[,\s]+$/g, '').trim();
  t = t.replace(/^,|,$/g, '').trim();
  return t;
}
function itaSpeak(txt) {
  try {
    if (!('speechSynthesis' in window)) { alert('Este dispositivo no tiene voz disponible'); return; }
    var limpio = itaVozLimpia(txt);
    if (!limpio) limpio = String(txt || '');
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(limpio);
    u.lang = 'it-IT'; u.rate = 0.9; u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}
function itaQuizPool() {
  if (itaQuizLevel === 'a1') return IT_A1;
  if (itaQuizLevel === 'a2') return IT_A2;
  if (itaQuizLevel === 'b1') return IT_B1;
  if (itaQuizLevel === 'avanzado') return IT_B2C1;
  return IT_A1.concat(IT_A2, IT_B1, IT_B2C1);
}
function itaAll() { return IT_A1.concat(IT_A2, IT_B1, IT_B2C1); }

function renderItaStreak() {
  var b = $('itaStreakBox'); if (!b) return;
  var d = getItaData();
  var pct = d.total ? Math.round(d.ok / d.total * 100) : 0;
  b.innerHTML = '<b>🍝 Il tuo italiano:</b> ' + d.ok + '/' + d.total + ' giuste (' + pct + '%) · sequenza ' + d.streak + ' 🔥 ' +
    '<span class="muted su-11a508">— 1 parola al giorno · A1→C1 + cultura · tutto salvato in locale e privato.</span>';
}
function itaCard(item, lv) {
  return '<button type="button" class="btn eng-word su-6cd6a1" data-w="' + esc(item.it) + '"><b>🔊 ' + esc(item.it) + '</b> ' +
    '<span class="chip su-0d5be0">' + esc(lv) + '</span><br><span class="su-2f290d">' + esc(item.es) + '</span><br>' +
    '<span class="muted su-11a508">“' + esc(item.ex) + '”</span></button>';
}

function renderItaPanel(tab) {
  itaTab = tab || itaTab;
  var ids = { parola: 'tabIT1', a1: 'tabIT2', a2: 'tabIT3', b1: 'tabIT4', cultura: 'tabIT5', quiz: 'tabIT6' };
  Object.keys(ids).forEach(function (k) { var el = $(ids[k]); if (el) el.classList.toggle('btn-accent', k === itaTab); });
  renderItaStreak();
  var box = $('itaPanel'); if (!box) return;
  var html = '';
  if (itaTab === 'parola') {
    var all = itaAll();
    var w = all[itaDayIndex(all.length)];
    var rel = [all[(itaDayIndex(all.length) + 7) % all.length], all[(itaDayIndex(all.length) + 13) % all.length]];
    var f = new Date();
    var fecha = '';
    try { fecha = cal.fmtDate.format(f); } catch (e) { fecha = f.toLocaleDateString(); }
    html += '<div class="menstrual-card su-3fa1a8">' +
      '<p class="muted su-11a508">☀️ PAROLA DEL GIORNO · ' + esc(fecha) + ' · ' + all.length + ' parole e frasi</p>' +
      '<div class="su-6adb68">' + esc(w.it) + '</div>' +
      '<div class="su-cd8bd8"><b>' + esc(w.es) + '</b></div>' +
      '<p class="muted su-2b0979">“' + esc(w.ex) + '”</p>' +
      '<div class="su-9bc2df"><button type="button" id="itaSpeakBtn" class="btn btn-accent su-30e741">🔊 Ascolta</button> ' +
      '<button type="button" id="itaNextBtn" class="btn su-30e741">🎲 Un’altra parola</button></div></div>' +
      '<div class="help-grid su-d2c171">' +
      rel.map(function (r) { return '<div class="help-card"><h4>' + esc(r.it) + '</h4><p class="su-11a508">' + esc(r.es) + '<br><span class="muted">“' + esc(r.ex) + '”</span></p></div>'; }).join('') + '</div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>🗣️ Come praticare?</h4><p class="su-b439ab">1) <b>Ascolta</b> con 🔊 e ripeti 3 volte a voce alta.<br>2) <b>Scrivi</b> 1 frase con la parola nelle Note del giorno.<br>3) <b>Usala oggi</b>: 1 parola/giorno → ~365/anno.<br>Passa ad A2 quando ne sai 20 senza guardare.</p></div>' +
      '<div class="help-card"><h4>📚 Livelli (CEFR)</h4><p class="su-b439ab">🌱 <b>A1:</b> sopravvivere (ciao, cibo, casa).<br>🌿 <b>A2:</b> vita quotidiana (passato, futuro, spesa).<br>💬 <b>B1:</b> viaggio + lavoro + opinione.<br>📜 <b>B2–C1:</b> espressioni, passivo, colloquio + cultura.</p></div></div>';
  } else if (itaTab === 'a1') {
    html += '<div class="menstrual-card su-5a6934"><h4 class="su-752b1a">🌱 A1 Sopravvivenza — sopravvivi in italiano</h4>' +
      '<p class="muted su-a6c665">Meta: presentarti, chiedere cibo, contare 1–20. Grammatica: <b>essere (io sono / tu sei), avere (io ho), un/una/il/la, mi piace / ho bisogno di, plurale -i/-e</b>. Tocca 🔊 in ogni scheda per ascoltare (it-IT).</p>' +
      '<div class="su-5e3875">' + IT_A1.map(function (x) { return itaCard(x, 'A1'); }).join('') + '</div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>⚙️ Essere + avere (il 50% della giornata)</h4><p class="su-583677"><b>Io sono</b> stanca · <b>Tu sei</b> gentile<br><b>Lui/lei è</b> di qui · <b>Noi siamo</b> amici<br><b>Io ho</b> due figli · <b>Tu hai</b> tempo?<br><span class="muted">Negazione: io <b>non</b> sono… Domanda: <b>sei…?</b> alzando la voce.</span></p></div>' +
      '<div class="help-card"><h4>🎭 Mini-dialogo: al mercato</h4><p class="su-583677">— <b>Ciao! Quanto costa?</b><br>— <b>Cinquemila pesos.</b><br>— <b>Grazie. A domani!</b><br><span class="muted">Allena: una persona per riga. Cambia “pesos” con “euro” in Italia.</span></p></div></div>';
  } else if (itaTab === 'a2') {
    html += '<div class="menstrual-card su-018729"><h4 class="su-721a46">🌿 A2 Vita quotidiana — il giorno per giorno</h4>' +
      '<p class="muted su-a6c665">Meta: raccontare cosa hai fatto, piani, spesa e direzioni. Grammatica: <b>passato prossimo (sono andato / ho mangiato), stare per + infinito, comparativi, dovere, potere</b>.</p>' +
      '<div class="su-5e3875">' + IT_A2.map(function (x) { return itaCard(x, 'A2'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>🎭 Mini-dialogo: chiedere una direzione a Penco</h4><p class="su-583677">— <b>Scusi, dov’è la spiaggia?</b><br>— <b>Vada dritto, poi giri a sinistra in piazza.</b><br>— <b>Grazie mille!</b> — <b>Prego!</b><br><span class="muted">Chiave: dritto = derecho, girare = girar, vicino = cerca.</span></p></div>';
  } else if (itaTab === 'b1') {
    html += '<div class="menstrual-card su-d4d722"><h4 class="su-7c91e2">💬 B1 Intermedio — viaggiare, lavorare e opinare</h4>' +
      '<p class="muted su-a6c665">Meta: viaggiare, lavorare e opinare. Grammatica stella: <b>se + futuro (se pioverà, restiamo)</b> + <b>vivo qui da</b> (vivo qui da 5 anni) + imperfetto (facevo).</p>' +
      '<div class="su-5e3875">' + IT_B1.map(function (x) { return itaCard(x, 'B1'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>🎭 Mini-dialogo: viaggio a Concepción</h4><p class="su-583677">— <b>Vorrei un biglietto per Concepción.</b><br>— <b>Sola andata o andata e ritorno?</b> — <b>Andata e ritorno, per favore.</b><br>— <b>Vive qui da molto?</b> — <b>Vivo qui da cinque anni.</b><br><span class="muted">Allena con orari, prezzi e “da + tempo”.</span></p></div>';
  } else if (itaTab === 'cultura') {
    html += '<div class="menstrual-card su-5b7cd0"><h4 class="su-399074">📜 B2–C1 Avanzato + Cultura viva</h4>' +
      '<p class="muted su-a6c665">Meta: colloqui, espressioni e non fare brutte figure con i falsi amici. Grammatica: <b>trapassato prossimo (ero partito), condizionale passato (avrei fatto), voce passiva, discorso indiretto, connettori (tuttavia, inoltre)</b>.</p>' +
      '<div class="su-5e3875">' + IT_B2C1.map(function (x) { return itaCard(x, 'B2–C1'); }).join('') + '</div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>⚠️ 8 falsi amici che salvano la vita</h4><p class="su-583677">' + IT_FALSI.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div>' +
      '<div class="help-card"><h4>🇮🇹 Nord ↔ Sud + tu/Lei</h4><p class="su-583677">' + IT_NORDSUD.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>🗣️ Pronuncia in 1 minuto</h4><p class="su-b439ab"><b>gn</b> ≈ ñ: lasagna (lasania) · <b>gli</b> ≈ lli: figlio (fillio)<br><b>ch</b> = k dura: perché (perké) · <b>gh</b> = g dura: spaghetti<br><b>sc+e/i</b> = sh: scena (shena) · <b>sc+a/o/u</b> = sk: scala<br><b>z</b> = ts/dz: pizza (pit-tsa), zero (dzero)<br><b>doppie</b> allungano: pala/palla · caro/carro · ano/anno ⚠️<br><span class="muted">Parla piano e raddoppia: meglio lenta che piatta.</span></p></div>' +
      '<div class="help-card"><h4>🎶 Cultura da ascoltare e assaggiare</h4><p class="su-b439ab"><b>Ascoltare:</b> Volare (Modugno), Con te partirò (Bocelli), Bella Ciao. 1 canzone × 7 giorni.<br><b>Assaggiare:</b> pasta al ragù, pizza margherita, gelato artigianale — cerca la ricetta e leggila in italiano.<br><b>Vedere:</b> Carnevale di Venezia (maschere + gondole): “carnevale” non è festa qualsiasi, è teatro di strada.<br><span class="muted">Dante (Divina Commedia), Leonardo, l’opera: il calendario è anche arte.</span></p></div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>💼 Kit colloquio di lavoro</h4><p class="su-583677">— <b>Mi parli un po’ di Lei.</b><br>— <b>Sono responsabile e lavoro bene in squadra.</b><br>— <b>Il mio punto di forza è… Il mio obiettivo è…</b><br><span class="muted">Chiudi: “Grazie per il Suo tempo.”</span></p></div>';
  } else if (itaTab === 'quiz') {
    var d = getItaData();
    if (!itaQuizQ) {
      var pool = itaQuizPool();
      var wq = pool[Math.floor(Math.random() * pool.length)];
      var opts = {};
      opts[wq.es] = 1;
      var guard = 0;
      while (Object.keys(opts).length < 4 && guard < 60) { guard++; opts[pool[Math.floor(Math.random() * pool.length)].es] = 1; }
      var arr = Object.keys(opts).sort(function () { return Math.random() - 0.5; });
      itaQuizQ = { w: wq, opts: arr };
    }
    var q = itaQuizQ;
    var lvBtn = function (v, l) { return '<button type="button" class="btn ita-lv' + (itaQuizLevel === v ? ' btn-accent' : '') + ' su-337714" data-lv="' + v + '">' + l + '</button>'; };
    html += '<div class="menstrual-card su-1f2df9"><h4 class="su-399074">🧩 Quiz per livelli</h4>' +
      '<div class="su-a8712a">' + lvBtn('todo', '🌎 Tutto') + lvBtn('a1', '🌱 A1') + lvBtn('a2', '🌿 A2') + lvBtn('b1', '💬 B1') + lvBtn('avanzado', '📜 B2–C1') + '</div>' +
      '<div class="su-73ce29">“' + esc(q.w.it) + '”</div>' +
      '<button type="button" id="itaQuizSpeak" class="btn su-337714">🔊 Ascolta</button>' +
      '<div class="su-ae0e71">' + q.opts.map(function (o) { return '<button type="button" class="btn ita-opt su-046678" data-o="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div>' +
      '<div id="itaQuizFb" class="su-ac1122"></div>' +
      '<p class="muted su-e13d76">Giuste ' + d.ok + '/' + d.total + ' · sequenza ' + d.streak + ' · livello: <b>' + esc(itaQuizLevel) + '</b> · banca: ' + itaQuizPool().length + ' parole/frasi</p></div>';
  }
  box.innerHTML = html + '<p class="muted su-a953a7">🔊 Tocca qualsiasi scheda per ascoltare in italiano (it-IT, voce del dispositivo). Il quiz somma alla tua sequenza locale e privata.</p>';
  var sp = $('itaSpeakBtn');
  if (sp) sp.onclick = function (e) { try { e.preventDefault(); } catch (x) {} var a = itaAll(); itaSpeak(a[itaDayIndex(a.length)].it); };
  var nx = $('itaNextBtn');
  if (nx) nx.onclick = function () { renderItaPanel('parola'); };
  var qs = $('itaQuizSpeak');
  if (qs) qs.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (itaQuizQ) itaSpeak(itaQuizQ.w.it); };
  box.querySelectorAll('.eng-word').forEach(function (b) {
    b.onclick = function (e) { try { e.preventDefault(); } catch (x) {} itaSpeak(b.getAttribute('data-w')); };
  });
  box.querySelectorAll('.ita-lv').forEach(function (b) {
    b.onclick = function () { itaQuizLevel = b.getAttribute('data-lv'); itaQuizQ = null; renderItaPanel('quiz'); };
  });
  box.querySelectorAll('.ita-opt').forEach(function (b) {
    b.onclick = function () {
      var d2 = getItaData();
      var ok = b.getAttribute('data-o') === itaQuizQ.w.es;
      d2.total = (d2.total || 0) + 1;
      if (ok) { d2.ok = (d2.ok || 0) + 1; d2.streak = (d2.streak || 0) + 1; }
      else { d2.streak = 0; }
      try { if (typeof scheduleSave === 'function') scheduleSave('Guardado ✓'); } catch (e) {}
      var fb = $('itaQuizFb');
      if (fb) fb.innerHTML = ok ? '✅ Molto bene! <b>' + esc(itaQuizQ.w.ex) + '</b>' : '❌ Era <b>' + esc(itaQuizQ.w.es) + '</b> — “' + esc(itaQuizQ.w.ex) + '”';
      box.querySelectorAll('.ita-opt').forEach(function (x) {
        x.disabled = true;
        if (x.getAttribute('data-o') === itaQuizQ.w.es) x.classList.add('btn-accent');
      });
      renderItaStreak();
      setTimeout(function () { itaQuizQ = null; if (itaTab === 'quiz') renderItaPanel('quiz'); }, ok ? 1400 : 2200);
    };
  });
}

/* ---------------- DIÁLOGO ---------------- */
function buildDialog() {
  if ($('italianoDialog')) return;
  var d = document.createElement('dialog');
  d.id = 'italianoDialog';
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053"><h3 class="su-ee0cfe">🇮🇹 Italiano — A1 → C1 + cultura</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Aprende <b>italiano por niveles CEFR + cultura viva</b>, como el Kimün, el Inglés, el Portugués, el Chino y el Hindi: 1 parola al día + grammatica + quiz. Toca 🔊 para oír (voz del dispositivo, it-IT). Todo queda <b>local y privado</b> por usuario.</p>' +
    '<div id="itaStreakBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="timer-tabs su-f7ad78">' +
    '<button type="button" id="tabIT1" class="btn btn-accent su-30e741">☀️ Parola del giorno</button>' +
    '<button type="button" id="tabIT2" class="btn su-30e741">🌱 A1</button>' +
    '<button type="button" id="tabIT3" class="btn su-30e741">🌿 A2</button>' +
    '<button type="button" id="tabIT4" class="btn su-30e741">💬 B1</button>' +
    '<button type="button" id="tabIT5" class="btn su-30e741">📜 B2–C1 + Cultura</button>' +
    '<button type="button" id="tabIT6" class="btn su-30e741">🧩 Quiz</button></div>' +
    '<div id="itaPanel"></div>' +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
}

function bindTabs() {
  var map = { tabIT1: 'parola', tabIT2: 'a1', tabIT3: 'a2', tabIT4: 'b1', tabIT5: 'cultura', tabIT6: 'quiz' };
  Object.keys(map).forEach(function (id) {
    var el = $(id);
    if (el) el.onclick = function () { if (map[id] !== 'quiz') itaQuizQ = null; renderItaPanel(map[id]); };
  });
}

/* ---------------- SETUP ---------------- */
function ensureButton() {
  try {
    var existing = $('btnItaliano');
    if (existing) { try { existing.setAttribute('data-sub', 'idiomas'); } catch (e) {} return existing; }
    var g = document.querySelector('.action-group[data-group="aprender"] .group-btns');
    if (!g) return null;
    var btn = document.createElement('button');
    btn.id = 'btnItaliano'; btn.className = 'btn'; btn.type = 'button';
    btn.textContent = '🇮🇹 Italiano';
    try { btn.setAttribute('data-sub', 'idiomas'); } catch (e2) {}
    btn.setAttribute('data-keywords', 'italiano italia italiano italy it idioma livelli a1 a2 b1 b2 c1 basico intermedio avanzato quiz vocabolario grammatica frasi opera pasta pizza gelato falsi amici doppie pronuncia');
    var ref = g.querySelector('#btnHindi') || g.querySelector('#btnChino') || g.querySelector('#btnPortugues');
    if (ref && ref.parentNode === g) g.insertBefore(btn, ref.nextSibling);
    else {
      var refEn = g.querySelector('#btnEnglish');
      if (refEn && refEn.parentNode === g) g.insertBefore(btn, refEn.nextSibling);
      else g.appendChild(btn);
    }
    return btn;
  } catch (e) { return null; }
}

function registerGlobals() {
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnItaliano') < 0) {
      var i = -1;
      try { i = ALL_BTNS.indexOf('btnHindi'); } catch (e) {}
      if (i < 0) { try { i = ALL_BTNS.indexOf('btnChino'); } catch (e2) {} }
      if (i < 0) { try { i = ALL_BTNS.indexOf('btnPortugues'); } catch (e3) {} }
      if (i >= 0) ALL_BTNS.splice(i + 1, 0, 'btnItaliano');
      else ALL_BTNS.push('btnItaliano');
    }
  } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnItaliano = ['aprender', 'idiomas']; } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['aprender|idiomas'] && BTN_ORDER['aprender|idiomas'].indexOf('btnItaliano') < 0) {
      BTN_ORDER['aprender|idiomas'].push('btnItaliano');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p] && (p === 'todo' || p === 'adulto' || p === 'estudiante' || p === 'docente' || p === 'adolescente')) PRESETS[p].btnItaliano = true;
      });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnItaliano"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Aprender') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnItaliano"> 🇮🇹 Italiano';
          var ref2 = gr.querySelector('input[data-btn="btnHindi"]') || gr.querySelector('input[data-btn="btnChino"]') || gr.querySelector('input[data-btn="btnPortugues"]');
          if (ref2 && ref2.closest && ref2.closest('label') && ref2.closest('label').parentNode) {
            ref2.closest('label').parentNode.insertBefore(lab, ref2.closest('label').nextSibling);
          } else { gr.appendChild(lab); }
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnItaliano !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnItaliano = lab.querySelector('input').checked;
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
}

function setup() {
  ensureButton();
  registerGlobals();
  buildDialog();
  bindTabs();
  renderItaPanel('parola');
  var b = $('btnItaliano');
  if (!b) { if ((setup._r = (setup._r || 0) + 1) < 60) setTimeout(setup, 500); return; }
  if (!b.dataset.ita) {
    b.dataset.ita = '1';
    b.addEventListener('click', function () {
      itaQuizQ = null;
      renderItaPanel('parola');
      openDlg('italianoDialog');
    });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 500); });
else setTimeout(setup, 500);

})();
