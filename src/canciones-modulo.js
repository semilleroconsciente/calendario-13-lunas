/* ============================================================
   CANCIONES + MÚSICA COMO MEDICINA — Calendario 13 Lunas (Penco)
   Sección completa e independiente:
     🎶 Canciones ................ btnCanciones / cancionesDialog
        pestañas: Cancionero · Tocar canciones · Música medicina · Mi repertorio
     💊 Música medicina (atajo). btnMusicaMedicina / abre el mismo
        diálogo directo en la pestaña Medicina.
   Incluye subsección COMPLETA de música como medicina:
     qué es · cómo usarla (protocolo seguro) · por tipos ·
     por necesidad (recetas) · frecuencias (432/440, solfeggio,
     binaurales — explicación honesta) · generador offline de
     tonos de referencia · plan 28 días · bitácora emocional.
   Datos local y privado por usuario: userData().canciones
     { repertorio[], sesiones[], medicina[] }. 100% offline.
   AVISO: la música acompaña, no reemplaza tratamiento médico,
   psicológico ni urgencias (*4141 SENDA · 600 360 7777 Salud Responde).
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
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {} }
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}
function makeDialog(id, title, sub, bodyHTML) {
  var old = $(id); if (old) old.remove();
  var d = document.createElement('dialog');
  d.id = id;
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions"><h3>' + title + '</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar" aria-label="Cerrar">✕</button></div>' +
    (sub ? '<p class="muted">' + sub + '</p>' : '') + bodyHTML +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }

/* ---------------- datos ---------------- */
function store() {
  var u = null; try { u = (typeof userData === 'function') ? userData() : null; } catch (e) {}
  if (!u) return { repertorio: [], sesiones: [], medicina: [] };
  if (!u.canciones || typeof u.canciones !== 'object') u.canciones = { repertorio: [], sesiones: [], medicina: [] };
  var c = u.canciones;
  if (!Array.isArray(c.repertorio)) c.repertorio = [];
  if (!Array.isArray(c.sesiones)) c.sesiones = [];
  if (!Array.isArray(c.medicina)) c.medicina = [];
  return c;
}

/* Cancionero base: progresiones y coplas libres (sin letras con copyright).
   Tradicionales de dominio público se citan breves; el resto es guía para
   tararear/cantar encima con tus instrumentos (guitarra, uke, teclado, cajón, voz). */
var CANCIONERO = [
  { t: 'Cueca simple en LA (fondas y peñas)', cat: 'Cueca · celebrar', nivel: '🌱 Base', ac: 'A · E7 · D · A', ritmo: '6/8 · acentos 1 y 4 · cajón grave-agudo-agudo', capo: '0 (voz cómoda: prueba 1-2)', para: 'Bailar, celebrar, luna llena', copla: 'Copla libre: "Luna llena en Penco / brilla en la bahía / cantamos la cueca / con alegría". Repite y cambia la última palabra.' },
  { t: 'Cueca simple en SOL', cat: 'Cueca · celebrar', nivel: '🌱 Base', ac: 'G · D7 · C · G', ritmo: '6/8 · bajo-ras-ras si es vals lento', capo: '0', para: 'Voces más graves o ukelele', copla: 'Misma copla en Sol: sirve para turnar cantores sin cambiar la letra.' },
  { t: 'Vals criollo en MI menor', cat: 'Vals · familia', nivel: '🌱 Base', ac: 'Em · Am · B7 · Em (estribillo: G · D · Em)', ritmo: '3/4 · bajo-ras-ras contando 1-2-3', capo: '0', para: 'Atardecer, cantar en familia', copla: 'Tararea primero la melodía y luego ponle tus palabras: 8 sílabas por verso.' },
  { t: 'Trova base C-G-Am-F (4 acordes de oro)', cat: 'Trova · fogata', nivel: '🌱 Base', ac: 'C · G · Am · F (repite)', ritmo: '4/4 · D-DU-UDU · cajón grave-grave-agudo', capo: '2 si cantas agudo', para: 'Fogatas, peñas, luna creciente', copla: 'Con estos 4 acordes acompañas cientos de canciones: elige 1 coro y repítelo.' },
  { t: 'Balada Am-F-C-G (para cantar suave)', cat: 'Balada · calma', nivel: '🌱 Base', ac: 'Am · F · C · G', ritmo: '4/4 lento 60-70 bpm · arpegio p-i-m-a', capo: '0', para: 'Duelo suave, arrullo, gratitud', copla: 'Canta bajito 1 verso + 1 coro. Menos volumen = más emoción.' },
  { t: 'Himno a la Alegría (Beethoven · dominio público)', cat: 'Clásica · todas', nivel: '🌱 Base', ac: 'Melodía: E-E-F-G-G-F-E-D-C-C-D-E-E-D-D (flauta/teclado/violín)', ritmo: '4/4 · 80 bpm con metrónomo', capo: '—', para: 'Primera melodía, acto escolar, ritual de luna', copla: 'Flauta dulce: B-A-G · Quena: desde la grave · Teclado: mano derecha sola primero.' },
  { t: 'Estrellita (Twinkle · dominio público)', cat: 'Infantil · todas', nivel: '🌱 Base', ac: 'C · G · F · C (guitarra/uke) · Do-Do-Sol-Sol-La-La-Sol (melodía)', ritmo: '4/4 · 70 bpm', capo: '0', para: 'Niños, arrullo, primera canción', copla: 'Ideal para practicar cambios C-G sin parar. Cántala y tócala a la vez.' },
  { t: 'Cumpleaños feliz (tradicional)', cat: 'Celebración', nivel: '🌱 Base', ac: 'G · D · C · G (en Sol) o C · G · F · C (en Do)', ritmo: '3/4 · empieza en el "fe-" (anacrusa)', capo: '0', para: 'Cumpleaños (ver 🎂 Cumpleaños para la fecha)', copla: 'Practícala 1 semana antes del cumple: 5 min/día bastan.' },
  { t: 'Los pollitos dicen (tradicional infantil)', cat: 'Infantil', nivel: '🌱 Base', ac: 'C · G7 · C', ritmo: '2/4 marchita · palmas', capo: '0', para: 'Crianza, sala cuna, epew cantado', copla: 'Con cajón suave o palmas: los niños marcan el pulso.' },
  { t: 'Arrorró mapuche libre (arrullo)', cat: 'Arrullo · noche', nivel: '🌱 Base', ac: 'Em · Am (vaivén) o voz sola sin acordes', ritmo: 'Libre · respira 4-6 mientras cantas', capo: '—', para: 'Dormir guaguas y calmar la casa', copla: 'Repite 2 versos 5 min bajando el volumen: el cuerpo entiende que es hora de dormir.' },
  { t: 'El cóndor pasa (tema andino · simplificado)', cat: 'Andina · quena', nivel: '🌿 Media', ac: 'Melodía en La menor (quena/flauta/violín) + base Am · G · F · E7', ritmo: '4/4 andino · cajón suave', capo: '0', para: 'Ritual, territorio, luna llena', copla: 'Tócala lenta primero (60 bpm). Marca dónde respiras antes de empezar.' },
  { t: 'Cueca con cejilla (F-Bb-C) para sonar fonda', cat: 'Cueca · celebrar', nivel: '🌿 Media', ac: 'F · Bb · C7 · F (con cejilla o Fmaj7 simplificado)', ritmo: '6/8 viva 120-140 bpm por pareja de compases', capo: '0 (si cuesta: capo 1 con E-A-B7)', para: 'Fonda, 18 de septiembre', copla: 'Si la cejilla zumba: dedo 1 de costado, cerca del traste, pulgar bajo el mástil.' },
  { t: 'Trova con séptimas (G-D-Em-Bm-C-G-Am-D)', cat: 'Trova · fogata', nivel: '🌿 Media', ac: 'G · D · Em · Bm · C · G · Am · D7', ritmo: '4/4 · D-D-U-U-D-U', capo: '2', para: 'Peña, luna creciente', copla: 'Aprende el coro primero (se repite más) y luego el verso.' },
  { t: 'Canto a lo poeta (décima · base)', cat: 'Décima · memoria', nivel: '🌿 Media', ac: 'G · C · D7 · G (rueda de 4)', ritmo: 'Libre versado · 10 versos de 8 sílabas', capo: '0', para: 'Veladas, memoria territorial', copla: 'Estructura: 4 + 4 + 2 versos. Parte con 1 cuarteta tuya sobre Penco.' },
  { t: 'Música andina en menor (Am-G-F-E7)', cat: 'Andina', nivel: '🌿 Media', ac: 'Am · G · F · E7 (rueda andina)', ritmo: '6/8 o 4/4 · quena + cajón', capo: '0', para: 'Caminatas, rituales, atardecer', copla: 'Canta la melodía con "la-la" antes de ponerle letra: el fraseo manda.' },
  { t: 'Bossa suave (Dm7-G7-Cmaj7)', cat: 'Bossa · calma', nivel: '🌳 Avanzada', ac: 'Dm7 · G7 · Cmaj7 · Am7', ritmo: '4/4 sincopado suave · dedos', capo: '0', para: 'Tardes de lluvia, cocina', copla: 'Toca pianito: menos fuerza, más swing. Cuenta "1-y-2-y" bajito.' },
  { t: 'Fingerstyle: melodía + bajo (tu arreglo)', cat: 'Arreglo · crear', nivel: '🌳 Avanzada', ac: 'Elige 1 canción del cancionero y sepárala: pulgar=bajo, dedos=melodía', ritmo: 'Lento 60 bpm · 2 compases por día', capo: 'según tu voz', para: 'Regalar una canción, ritual importante', copla: 'Grábate 30 s por semana: el avance se oye en la grabación.' },
  { t: 'Copla de la luna nueva (original Semillero · libre)', cat: 'Ritual lunar', nivel: '🌱 Base', ac: 'Am · Em · Am · G', ritmo: 'Respirado · 1 acorde por respiración 4-6', capo: '0', para: 'Luna nueva: intencionar el mes', copla: '"Luna nueva, semilla / lo que canto, lo cuido / pasito a pasito / florece el sentido". Cántala 3 veces.' },
  { t: 'Copla de la luna llena (original Semillero · libre)', cat: 'Ritual lunar', nivel: '🌱 Base', ac: 'C · Am · F · G', ritmo: 'Alegre 4/4 · palmas o cajón', capo: '0', para: 'Luna llena: celebrar y agradecer', copla: '"Luna llena, gracias / por lo cosechado / canto y comparto / lo regalado".' },
  { t: 'Copla de la menguante (original Semillero · libre)', cat: 'Ritual lunar', nivel: '🌱 Base', ac: 'Em · C · G · D', ritmo: 'Lento · baja 5 bpm cada repetición', capo: '0', para: 'Menguante: soltar y ordenar', copla: '"Lo que pesa, lo suelto / lo que sirve, lo guardo / canto bajito / y me ordeno".' }
];

/* ---------- Música como medicina ---------- */
var MED_TIPOS = [
  { h: '🎤 Tu voz (la más medicinal)', p: 'Cantar, tararear o susurrar regula la respiración y el ánimo sin ningún aparato. 5 min de tarareo con exhalación larga calman más que 1 hora de playlist.', m: 'Prueba: tararea 3 min con la boca cerrada, exhala por la nariz. Registra tu ánimo antes/después.' },
  { h: '📿 Canto repetitivo (mantra, rezo, ícaro)', p: 'Frases cortas repetidas (ej: "gracias", "mari mari", un verso) con ritmo de respiración 4-6. Sostienen la atención y aquietan la rumiación.', m: '10 min, voz baja, mismo verso. Si te distraes, vuelve al verso sin pelear.' },
  { h: '🎻 Clásica suave / adagios', p: 'Tempo 60-80 bpm, sin letra, volumen bajo. Acompaña estudio suave, tejido, cocina, atardecer. Evita piezas muy intensas si buscas calma.', m: '15-20 min de fondo, no con audífonos a todo volumen.' },
  { h: '🎧 Lo-fi / acústica mínima', p: 'Base pareja sin sorpresas: buena para concentrarse y bajar revoluciones después del trabajo o la micro.', m: 'Úsala como "puente": 10 min al llegar a casa antes de pantallas.' },
  { h: '🥁 Tambor / cajón / palmas', p: 'Pulso marcado 60-90 bpm descarga tensión del cuerpo y ordena la energía. Ideal para enojo, inquietud y mañanas pesadas.', m: '5 min de grave constante + respiración por la nariz. Para si hay dolor en manos.' },
  { h: '🪈 Quena / flauta / vientos', p: 'Exhalación larga obligada: el propio instrumento es un ejercicio de respiración. 1 nota larga = 1 exhalación completa.', m: 'Notas largas 4 min + melodía fácil 4 min. Limpia y seca tras usar.' },
  { h: '💃 Cueca alegre / baile cantado', p: 'Música para mover el cuerpo: sube energía, junta a la familia y corta la tristeza estancada. Bailar 1 pie de cueca cambia el día.', m: 'Luz prendida, volumen moderado, 2-3 piezas y agua.' },
  { h: '🌊 Naturaleza + música tenue', p: 'Lluvia, mar, bosque de fondo + 1 instrumento suave. Para dormir y para pausas digitales. Mejor sin letra.', m: 'Temporizador 15-20 min para no quedar con sonido toda la noche.' },
  { h: '🤫 Silencio musical (pausas)', p: 'La medicina también es quitar música: 5 min de silencio tras 10 min de canto fijan el efecto. El ruido constante cansa aunque sea "lindo".', m: 'Regla: por cada 20 min de música, 3 min de silencio.' }
];
var MED_RECETAS = [
  { n: '😴 Para dormir', q: 'Voz baja o instrumental sin letra · 60 bpm o menos · volumen apenas audible', como: '1) Luz baja 30 min antes · 2) 10-15 min de arrullo/tarareo o instrumental · 3) Temporizador para que pare solo · 4) 3 min de silencio. Evita audífonos intrauriculares toda la noche.', t: '12 min', ev: 'Pantallas a todo brillo y música con letra pegajosa.' },
  { n: '😮‍💨 Para calmar ansiedad', q: 'Tarareo con exhalación larga, mantra corto o adagio · sin letra o 1 verso', como: '1) Siéntate, pies en el suelo · 2) Inhala 4 - exhala 6 cantando 1 nota 5 min · 3) Repite 1 verso 5 min · 4) Anota ánimo 1-5 antes/después. Si la angustia no baja o hay crisis, pide ayuda (Salud Responde 600 360 7777).', t: '10 min', ev: 'Música muy rápida o noticias de fondo.' },
  { n: '🎯 Para foco / estudio', q: 'Instrumental pareja, sin letra · 60-90 bpm · volumen bajo', como: 'Pomodoro cantado: 25 min de fondo + 5 min de silencio caminando. Sin audífonos al máximo. 1 tanda = 1 bloque.', t: '25 min', ev: 'Canciones con letra que te sabes (te pones a cantar).' },
  { n: '🌅 Para despertar energía', q: 'Cueca, percusión o canto alegre · muévete', como: '1) Abre cortinas · 2) 1-2 piezas movidas cantando/batiendo palmas · 3) Termina con 1 min de respiración normal. Mejor de día y con luz.', t: '6 min', ev: 'Bajos con audífonos a todo volumen en la micro.' },
  { n: '💧 Para tristeza / duelo suave', q: 'Balada lenta cantada por ti, 1 verso repetido', como: 'Canta 1 verso 5 min, llora si sale, 3 min de silencio, abrígate y toma algo tibio. Si el duelo no te deja funcionar, busca acompañamiento (ver 🕊️ Duelo). La música acompaña, no reemplaza.', t: '10 min', ev: 'Encerrarte horas con música triste a alto volumen.' },
  { n: '🔥 Para enojo / irritabilidad', q: 'Tambor/cajón/palmas 70-90 bpm + exhalación por la nariz', como: '5 min de pulso grave constante (sin romper nada), luego baja a 60 bpm 3 min. Camina 5 min después. No toques con dolor en manos.', t: '8 min', ev: 'Música agresiva a todo volumen mucho rato.' },
  { n: '🧘 Para meditar / respirar', q: '1 tono largo o 1 verso + silencio', como: '4 min de tono/verso + 4 min de silencio sentado + 2 min de gratitud cantada bajito. Usa el generador de tonos de abajo si quieres referencia.', t: '10 min', ev: 'Saltar de estímulo en estímulo.' },
  { n: '🧶 Para crear / trabajo manual', q: 'Vals, trova suave o andina de fondo', como: 'Tejer, cocinar, ordenar o huerta con 20 min de fondo a volumen conversación. Canta encima si quieres: la mano y la voz se acompañan.', t: '20 min', ev: 'Podcasts densos si buscas calma manual.' },
  { n: '🌙 Ritual de luna nueva', q: 'Copla luna nueva (Am-Em-Am-G) · 3 repeticiones', como: 'Escribe 1 intención, cántala 3 veces respirado, anota 1 paso pequeño en el calendario. 8 min total.', t: '8 min', ev: 'Exigirte "sanar todo" en una noche.' },
  { n: '🌕 Ritual de luna llena', q: 'Copla luna llena (C-Am-F-G) + palmas', como: 'Canta y baila 2 vueltas, agradece 3 cosas en voz alta, comparte 1 canción con alguien. 10 min.', t: '10 min', ev: 'Quedarte solo con pantallas en la luna más linda.' },
  { n: '🌗 Ritual de menguante', q: 'Copla menguante (Em-C-G-D) bajando el tempo', como: 'Canta cada vez más lento y bajo, suelta 1 cosa por verso, termina en silencio 3 min. Ordena 1 cajón después.', t: '9 min', ev: 'Empezar proyectos grandes en menguante.' },
  { n: '👶 Con bebés / niños', q: 'Arrullo, Los pollitos, Estrellita · voz de la cuidadora', como: 'Misma canción 5 min, cada vez más bajo, luz baja, meciendo. La voz conocida calma más que cualquier parlante.', t: '5-10 min', ev: 'Parlante fuerte cerca de oídos pequeños.' }
];
/* Frecuencias: tabla honesta. La evidencia científica de "curar con Hz"
   es débil; lo que sí está respaldado: respiración lenta, música que te
   gusta a volumen moderado, cantar y ritualizar. Úsalas como referencia
   para respirar/cantar, no como tratamiento. */
var MED_FRECS = [
  { f: 174, n: 'Base / calma corporal', uso: 'Respirar 4-6 con 1 tono grave de fondo 5-10 min. Para soltar hombros.' },
  { f: 285, n: 'Reparo suave', uso: 'Tarareo bajo + estiramiento 8 min. Rutina de noche.' },
  { f: 396, n: 'Soltar tensión (solfeggio)', uso: 'Canta 1 verso que te libere, 5 min, bajando el volumen.' },
  { f: 417, n: 'Cambio / ordenar', uso: 'Ordena 1 cajón con este tono de fondo 10 min (temporizador).' },
  { f: 432, n: 'A432 · referencia grave', uso: 'Afinación alternativa (un poco más grave que 440). Si te gusta, afina y canta encima 10 min. Es preferencia, no magia.' },
  { f: 440, n: 'A440 · estándar', uso: 'Referencia para afinar y cantar con otros. Recomendada para tocar en grupo.' },
  { f: 528, n: 'La famosa "528"', uso: 'La más pedida: úsala 5-10 min para respirar/cantar si TE gusta. Sin promesas de sanación; el efecto es calma + ritual.' },
  { f: 639, n: 'Vínculo / cantar con otros', uso: 'Dúo o familia: 1 canción a 2 voces 8 min.' },
  { f: 741, n: 'Expresión / voz', uso: 'Vocaliza mi-me-ma-mo-mu sobre este tono 5 min.' },
  { f: 852, n: 'Silencio / interior', uso: 'Escucha 3 min + 3 min de silencio sentado.' }
];
var MED_PLAN = [
  { h: 'Semana 1 — Calma base', p: 'Días 1-3: tarareo 5 min noche + ánimo antes/después. Días 4-7: suma 1 receta (dormir o ansiedad). Meta: notar 1 punto de diferencia en tu bitácora.' },
  { h: 'Semana 2 — Energía y foco', p: 'Mañana: 1 pieza movida 5 min. Estudio/trabajo: 1 bloque 25 min instrumental + 5 min silencio. Registra qué te sirvió.' },
  { h: 'Semana 3 — Voz y vínculo', p: 'Canta 1 canción del cancionero completa (aunque sea lenta). Enséñasela a alguien o cántala en la luna. 10 min/día.' },
  { h: 'Semana 4 — Ritual lunar', p: 'Nueva: intención + copla ×3. Llena: celebrar + gratitud. Menguante: soltar + ordenar. Elige 1 frecuencia del generador solo si te acomoda.' }
];
var TOCAR_PASOS = [
  { h: '1) Elige 1 canción (no 5)', p: 'Del cancionero: 1 que te emocione y esté en tu nivel. Escríbela arriba en tu repertorio con su acorde base.', m: '1 canción por luna: terminarla es el objetivo.' },
  { h: '2) Simplifícala a 3 acordes', p: 'Toca solo el coro con 3 acordes lentos (60 bpm). Ej: C-G-Am o A-D-E. Lo demás es adorno por ahora.', m: 'Si te trabas: capo +2 o baja a 50 bpm.' },
  { h: '3) Ritmo primero, adorno después', p: '5 min de rasgueo/palmas con cuerdas muteadas + metrónomo. Recién después agrega cambios.', m: 'Cuenta en voz alta: 1-2-3-4 (o 1-2-3-4-5-6 en cueca).' },
  { h: '4) Canta encima aunque sea feo', p: 'Tararea la melodía, luego ponle 1 verso. Lo que la voz no afina, los dedos tampoco.', m: 'Grábate 20 s y corrige solo 1 nota.' },
  { h: '5) Súbela a tempo y muéstrala', p: 'Sube +5 bpm cuando salga limpia 3 veces. Tócala para alguien en la luna llena. Anota la sesión abajo.', m: 'Compartirla la fija en la memoria.' }
];

/* ---------------- piezas UI ---------------- */
function cardsHTML(list) {
  return '<div class="discipline-grid">' + list.map(function (c) {
    return '<div class="discipline-card"><h4>' + c.h + '</h4><p>' + c.p + '</p>' +
      (c.m ? '<p class="muted">' + c.m + '</p>' : '') + '</div>';
  }).join('') + '</div>';
}
function routineHTML(title, text) {
  return '<div class="menstrual-card"><h4>' + title + '</h4><p>' + text + '</p></div>';
}

/* ---------------- audio: generador de tonos (offline) ---------------- */
var AC = null, genNodes = null, genTimer = null;
function acGet() {
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    return AC;
  } catch (e) { alert('Audio no disponible en este dispositivo'); return null; }
}
function genStop(silent) {
  try {
    if (genNodes) { try { genNodes.o.stop(); } catch (e) {} try { genNodes.g.disconnect(); } catch (e) {} genNodes = null; }
    clearTimeout(genTimer);
  } catch (e) {}
  var b = $('medGenStop');
  if (b && !silent) { /* noop */ }
  var st = $('medGenStatus');
  if (st && !silent) st.textContent = 'Elige una frecuencia y presiona ▶ Sonar. Volumen bajo, 5-15 min.';
}
function genPlay(freq, mins) {
  var ac = acGet(); if (!ac) return;
  genStop(true);
  try {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    var volEl = $('medGenVol');
    var v = volEl ? (parseInt(volEl.value, 10) || 25) / 100 : 0.25;
    v = Math.max(0.02, Math.min(0.5, v));
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, v * 0.35), ac.currentTime + 2.5);
    o.connect(g); g.connect(ac.destination); o.start();
    genNodes = { o: o, g: g };
    var st = $('medGenStatus');
    if (st) st.textContent = '🔊 Sonando ' + freq + ' Hz (senoidal suave, volumen bajo). Respira 4-6 con el tono…';
    clearTimeout(genTimer);
    genTimer = setTimeout(function () {
      genStop();
      if (st) st.textContent = '⏱️ Bloque completo (' + mins + ' min). 3 min de silencio ahora 🤫.';
      try { alert('⏱️ Bloque de ' + mins + ' min completo. Quédate 3 min en silencio y anota tu ánimo abajo.'); } catch (e) {}
    }, mins * 60 * 1000);
  } catch (e) { alert('No se pudo generar el tono'); }
}

/* ---------------- tabs ---------------- */
function selectCanTab(id) {
  var d = $('cancionesDialog'); if (!d) return;
  ['cancionero', 'tocar', 'medicina', 'repertorio'].forEach(function (t) {
    var p = $('cancionesDialog_panel_' + t); if (p) p.hidden = (t !== id);
  });
  d.querySelectorAll('[data-ctab]').forEach(function (b) {
    b.classList.toggle('btn-accent', b.getAttribute('data-ctab') === id);
  });
  try { var sc = d.querySelector('form'); if (sc) sc.scrollTop = 0; } catch (e) {}
}
function selectMedTab(id) {
  ['usar', 'tipos', 'recetas', 'frecs', 'plan'].forEach(function (t) {
    var p = $('medSub_' + t); if (p) p.hidden = (t !== id);
  });
  try {
    document.querySelectorAll('[data-mtab]').forEach(function (b) {
      b.classList.toggle('btn-accent', b.getAttribute('data-mtab') === id);
    });
  } catch (e) {}
}

/* ---------------- renders ---------------- */
function renderCancionero(filtro) {
  var box = $('canList'); if (!box) return;
  var q = (filtro || '').toLowerCase();
  var list = CANCIONERO.filter(function (c) {
    if (!q) return true;
    return (c.t + ' ' + c.cat + ' ' + c.ac + ' ' + c.copla).toLowerCase().indexOf(q) >= 0;
  });
  var st = $('canCount'); if (st) st.textContent = '🎶 ' + CANCIONERO.length + ' guías · mostrando ' + list.length;
  if (!list.length) { box.innerHTML = '<p class="muted">Sin resultados. Prueba con "cueca", "arrullo" o "luna".</p>'; return; }
  box.innerHTML = list.map(function (c, i) {
    return '<div class="si-card"><div class="lawen-head"><span class="lawen-ico">🎶</span>' +
      '<span class="lawen-name">' + esc(c.t) + '</span>' +
      '<span class="chip">' + esc(c.nivel) + '</span></div>' +
      '<p class="muted">' + esc(c.cat) + ' · ideal: ' + esc(c.para) + '</p>' +
      '<p><b>🎼 ' + esc(c.ac) + '</b> · capo: ' + esc(c.capo) + '</p>' +
      '<p><b>🥁</b> ' + esc(c.ritmo) + '</p>' +
      '<p>' + esc(c.copla) + '</p>' +
      '<div class="conv-row"><button type="button" class="btn" data-llevar="' + i + '">＋ Llevar a mi repertorio</button></div></div>';
  }).join('');
  box.querySelectorAll('[data-llevar]').forEach(function (b) {
    b.onclick = function () {
      var c = CANCIONERO[+b.getAttribute('data-llevar')];
      if (!c) return;
      var s = store();
      s.repertorio.push({ id: uid('r'), titulo: c.t, acordes: c.ac, ritmo: c.ritmo, estado: 'empezada', fecha: todayKey(), nota: c.cat });
      save('Canción agregada a tu repertorio');
      renderRepertorio();
      selectCanTab('repertorio');
    };
  });
}
function renderRepertorio() {
  var box = $('canRep'); if (!box) return;
  var s = store();
  var st = $('canRepStats');
  if (!s.repertorio.length) {
    box.innerHTML = '<p class="muted">Aún vacío. Lleva 1 del cancionero 👆 o agrégala a mano abajo.</p>';
    if (st) st.textContent = '0 en repertorio';
    return;
  }
  var orden = s.repertorio.slice().sort(function (a, b) { return String(b.fecha || '').localeCompare(String(a.fecha || '')); });
  box.innerHTML = orden.slice(0, 80).map(function (r) {
    return '<div class="habit-row"><span>🎶 <b>' + esc(r.titulo || '') + '</b><br><span class="muted">' +
      esc(r.acordes || '') + ' · ' + esc(r.estado || '') + ' · ' + esc(r.fecha || '') +
      (r.nota ? ' · ' + esc(r.nota) : '') + '</span></span>' +
      '<span><button type="button" class="btn btn-icon" data-rep-pract="' + esc(r.id) + '" title="Registrar práctica">▶</button>' +
      '<button type="button" class="btn btn-icon" data-rep-del="' + esc(r.id) + '" title="Quitar">✕</button></span></div>';
  }).join('');
  if (st) st.textContent = s.repertorio.length + ' en repertorio';
  box.querySelectorAll('[data-rep-del]').forEach(function (b) {
    b.onclick = function () {
      var st2 = store();
      st2.repertorio = st2.repertorio.filter(function (x) { return String(x.id) !== String(b.getAttribute('data-rep-del')); });
      save(); renderRepertorio();
    };
  });
  box.querySelectorAll('[data-rep-pract]').forEach(function (b) {
    b.onclick = function () {
      var st3 = store();
      var r = st3.repertorio.filter(function (x) { return String(x.id) === String(b.getAttribute('data-rep-pract')); })[0];
      if (!r) return;
      st3.sesiones.push({ id: uid('s'), fecha: todayKey(), titulo: r.titulo, min: 15, detalle: 'Práctica de repertorio' });
      r.estado = 'practicando';
      save('Sesión registrada (+15 min)');
      renderSesiones(); renderRepertorio();
    };
  });
}
function renderSesiones() {
  var box = $('canSes'); if (!box) return;
  var s = store();
  var list = s.sesiones.slice().sort(function (a, b) { return String(b.fecha || '').localeCompare(String(a.fecha || '')); });
  var st = $('canSesStats');
  var tot = list.reduce(function (a, b) { return a + (+b.min || 0); }, 0);
  if (!list.length) { box.innerHTML = '<p class="muted">Sin sesiones. Toca 15 min y anótalos abajo 👇</p>'; if (st) st.textContent = '0 sesiones'; return; }
  box.innerHTML = list.slice(0, 60).map(function (x) {
    return '<div class="habit-row"><span>📅 <b>' + esc(x.fecha || '') + '</b> · <b>' + esc(String(x.min || 0)) + ' min</b> · ' + esc(x.titulo || '') +
      '<br><span class="muted">' + esc(x.detalle || '') + '</span></span>' +
      '<span><button type="button" class="btn btn-icon" data-ses-del="' + esc(x.id) + '" title="Borrar">✕</button></span></div>';
  }).join('');
  if (st) st.textContent = list.length + ' sesiones · ' + tot + ' min';
  box.querySelectorAll('[data-ses-del]').forEach(function (b) {
    b.onclick = function () {
      var st2 = store();
      st2.sesiones = st2.sesiones.filter(function (x) { return String(x.id) !== String(b.getAttribute('data-ses-del')); });
      save(); renderSesiones();
    };
  });
}
function renderMedicina() {
  var box = $('medLog'); if (!box) return;
  var s = store();
  var list = s.medicina.slice().sort(function (a, b) { return String((b.fecha || '') + (b.hora || '')).localeCompare(String((a.fecha || '') + (a.hora || ''))); });
  var st = $('medStats');
  if (!list.length) { box.innerHTML = '<p class="muted">Sin registros. Prueba 1 receta de arriba y anota cómo te sentiste 👇</p>'; if (st) st.textContent = '0 registros'; return; }
  box.innerHTML = list.slice(0, 60).map(function (x) {
    var d = (+x.despues || 0) - (+x.antes || 0);
    var flecha = d > 0 ? '↗ +' + d : d < 0 ? '↘ ' + d : '→ 0';
    return '<div class="habit-row"><span>📅 <b>' + esc(x.fecha || '') + '</b> · ' + esc(x.receta || '') + ' · ' + esc(String(x.min || 0)) + ' min' +
      '<br><span class="muted">ánimo ' + esc(String(x.antes || '?')) + ' → ' + esc(String(x.despues || '?')) + ' (' + flecha + ') · ' + esc(x.nota || '') + '</span></span>' +
      '<span><button type="button" class="btn btn-icon" data-med-del="' + esc(x.id) + '" title="Borrar">✕</button></span></div>';
  }).join('');
  if (st) {
    var conMejora = list.filter(function (x) { return (+x.despues || 0) > (+x.antes || 0); }).length;
    st.textContent = list.length + ' sesiones medicina · ' + conMejora + ' con mejor ánimo ↗';
  }
  box.querySelectorAll('[data-med-del]').forEach(function (b) {
    b.onclick = function () {
      var st2 = store();
      st2.medicina = st2.medicina.filter(function (x) { return String(x.id) !== String(b.getAttribute('data-med-del')); });
      save(); renderMedicina();
    };
  });
}

/* ---------------- construcción ---------------- */
function build() {
  var medTipos = cardsHTML(MED_TIPOS);
  var recetas = MED_RECETAS.map(function (r) {
    return '<div class="si-card"><h4>' + esc(r.n) + '</h4>' +
      '<p><b>🎧 Qué:</b> ' + esc(r.q) + '</p><p><b>📝 Cómo:</b> ' + esc(r.como) + '</p>' +
      '<p class="muted">⏱️ ' + esc(r.t) + ' · ⚠️ Evita: ' + esc(r.ev) + '</p>' +
      '<div class="conv-row"><button type="button" class="btn" data-receta="' + esc(r.n) + '">＋ Anotar esta receta</button></div></div>';
  }).join('');
  var frecs = MED_FRECS.map(function (o) {
    return '<div class="habit-row"><span><b>' + o.f + ' Hz</b> · ' + esc(o.n) + '<br><span class="muted">' + esc(o.uso) + '</span></span>' +
      '<span><button type="button" class="btn" data-frec="' + o.f + '">▶</button></span></div>';
  }).join('');

  var body =
    '<div class="menstrual-card"><h4>🌙 Tu cancionero vivo de Penco</h4>' +
    '<p class="muted">Guías con acordes y coplas libres (sin letras con copyright), método para tocarlas y una subsección completa de música como medicina. Elige pestaña 👇</p>' +
    '<div class="conv-row"><button type="button" class="btn" data-goto-med>💊 Ir a Música medicina</button>' +
    '<button type="button" class="btn" data-goto-rep>📓 Mi repertorio</button></div></div>' +
    '<div class="timer-tabs">' +
      '<button type="button" class="btn btn-accent" data-ctab="cancionero">🎶 Cancionero</button>' +
      '<button type="button" class="btn" data-ctab="tocar">🎸 Tocar canciones</button>' +
      '<button type="button" class="btn" data-ctab="medicina">💊 Música medicina</button>' +
      '<button type="button" class="btn" data-ctab="repertorio">📓 Mi repertorio</button></div>' +

    /* CANCIONERO */
    '<div id="cancionesDialog_panel_cancionero">' +
      '<p class="muted">🎶 ' + CANCIONERO.length + ' guías: cuecas, trova, vals, arrullos, andinas y coplas lunares. Todas con acordes base, ritmo y copla libre para cantar.</p>' +
      '<div class="conv-row"><label>🔍 Buscar <input type="search" id="canQ" placeholder="cueca, arrullo, luna, trova…" autocomplete="off"></label></div>' +
      '<p class="muted" id="canCount"></p><div id="canList"></div>' +
      routineHTML('⏱️ Rutina 15 min por canción', '1) Afina 2 min · 2) Coro en bucle 5 min a 60 bpm con metrónomo (🎧 Herramientas) · 3) Ritmo + canto 5 min · 4) Tócala entera 3 min aunque sea lenta. Anótala en 📓 Mi repertorio.') +
    '</div>' +

    /* TOCAR */
    '<div id="cancionesDialog_panel_tocar" hidden>' +
      '<p class="muted">🎸 Método en 5 pasos para pasar de "mirar acordes" a "tocar 1 canción entera".</p>' +
      cardsHTML(TOCAR_PASOS) +
      routineHTML('🧭 Atajos por instrumento', 'Guitarra/uke: usa los acordes de arriba + capo 0-2 según tu voz. Teclado: mano derecha melodía + izquierda 1 bajo por acorde. Flauta/quena/violín: toca la melodía (Himno, Estrellita, Cóndor) con metrónomo. Cajón: grave-grave-agudo en 4/4 o acentos 1-y-4 en 6/8. Canto: transpone (capo) hasta cantar cómodo sin gritar.') +
      '<div class="menstrual-card"><h4>🔗 Sigue con tus instrumentos</h4><p class="muted">Cada instrumento tiene su sección completa con guía por niveles y bitácora.</p>' +
      '<div class="conv-row"><button type="button" class="btn" data-open-mus="btnGuitar">🎸 Guitarra</button>' +
      '<button type="button" class="btn" data-open-mus="btnUkelele">🪕 Ukelele</button>' +
      '<button type="button" class="btn" data-open-mus="btnCanto">🎤 Canto</button>' +
      '<button type="button" class="btn" data-open-mus="btnMusicaPractica">🎧 Herramientas</button></div></div>' +
    '</div>' +

    /* MEDICINA */
    '<div id="cancionesDialog_panel_medicina" hidden>' +
      '<div class="menstrual-card" style="border-color:#c9a227"><h4>⚠️ Aviso responsable</h4>' +
      '<p class="muted">La música <b>acompaña</b>: calma, ordena y vincula. <b>No reemplaza</b> tratamiento médico, psicológico ni urgencias. Si hay crisis, ideación suicida, violencia o adicción: <b>*4141 SENDA · 600 360 7777 Salud Responde · 132 Bomberos · 133 Carabineros</b>. Volumen moderado (≤60%), pausas, y nunca con audífonos a todo volumen ni conduciendo con binaurales.</p></div>' +
      '<p class="muted">💊 Subsecciones de medicina musical 👇</p>' +
      '<div class="timer-tabs">' +
        '<button type="button" class="btn btn-accent" data-mtab="usar">📋 Cómo usarla</button>' +
        '<button type="button" class="btn" data-mtab="tipos">🎼 Por tipos</button>' +
        '<button type="button" class="btn" data-mtab="recetas">💊 Por necesidad</button>' +
        '<button type="button" class="btn" data-mtab="frecs">🔔 Frecuencias</button>' +
        '<button type="button" class="btn" data-mtab="plan">📆 Plan 28 días</button></div>' +

      '<div id="medSub_usar">' +
        '<div class="menstrual-card"><h4>🌿 Qué es (sin humo)</h4><p>Lo que sí hace la música: <b>1)</b> ordena la respiración (cantar = exhalar largo), <b>2)</b> da un pulso predecible al cuerpo, <b>3)</b> evoca emoción y memoria, <b>4)</b> junta a las personas. Eso baja tensión, ayuda a dormir, a concentrarse y a sostener rituales. No "cura" por sí sola: <b>el ritual + tu voz + constancia</b> es la medicina.</p></div>' +
        '<div class="menstrual-card"><h4>📋 Protocolo seguro en 5 pasos</h4><p><b>1) Intención (30 s):</b> "quiero calmarme / dormir / activarme". Anota ánimo 1-5.<br><b>2) Entorno:</b> luz acorde (baja para dormir, alta para activar), 1 sola fuente de sonido, temporizador 5-20 min.<br><b>3) Volumen ≤60%:</b> debes poder oír tu propia voz hablada encima. Con audífonos: 60 min máx y descanso.<br><b>4) Hazlo (no solo escucha):</b> tararea, canta, palmea o respira con el pulso. Hacer > escuchar.<br><b>5) Cierra:</b> 3 min de silencio + anota ánimo 1-5 y qué hiciste abajo. Compara en 7 días.</p></div>' +
        cardsHTML([
          { h: '✅ Cuándo sí', p: 'Dormir, calmarte, estudiar, ordenar la casa, rituales lunares, cantar con niños, duelo suave acompañado, caminar.', m: '10-20 min + silencio posterior + bitácora.' },
          { h: '⛔ Cuándo no / precauciones', p: 'No sustituye urgencias. Binaurales solo quieta/o y sin conducir. Epilepsia fotosensible: evita luces estroboscópicas con música. Oídos: nada intrauricular toda la noche ni a todo volumen. Si una frecuencia te incomoda (mareo, ansiedad), apágala.', m: 'Molestia = parar. La medicina no duele.' }
        ]) +
      '</div>' +

      '<div id="medSub_tipos" hidden><p class="muted">🎼 9 tipos: elige 1 por semana y prueba 7 días seguidos.</p>' + medTipos + '</div>' +

      '<div id="medSub_recetas" hidden><p class="muted">💊 12 recetas por necesidad: qué poner, cómo y cuánto. Toca "Anotar" para llevarla a tu bitácora.</p>' + recetas + '</div>' +

      '<div id="medSub_frecs" hidden>' +
        '<div class="menstrual-card"><h4>🔔 Frecuencias: guía honesta</h4>' +
        '<p><b>A440</b> es el estándar para afinar y tocar con otros (recomendado). <b>A432</b> suena un poco más grave; si TE gusta, úsalo: es preferencia, no tratamiento.</p>' +
        '<p>Las "solfeggio" (396-417-528-639-741-852) son una tradición moderna sin respaldo clínico sólido: funcionan como <b>foco para respirar y ritualizar</b>, igual que un mantra. Úsalas así: 5-15 min, volumen bajo, respirando 4-6, y anota si te sirvió.</p>' +
        '<p class="muted"><b>Binaurales:</b> dos tonos casi iguales (ej: 200 Hz + 210 Hz = percibes 10 Hz "alfa"). Requieren <b>audífonos estéreo</b>, volumen bajo, quietud (nunca conduciendo). La evidencia es mixta: pruébalos como relajación, no como terapia.</p></div>' +
        '<div class="menstrual-card"><h4>🎛️ Generador offline (tonos de referencia)</h4>' +
        '<p class="muted">Sonido senoidal suave generado en tu equipo, sin internet. Volumen bajo. No es tratamiento: es referencia para respirar/cantar.</p>' +
        '<div class="conv-row"><label>🔔 Frecuencia <select id="medGenFreq">' +
          MED_FRECS.map(function (o) { return '<option value="' + o.f + '"' + (o.f === 528 ? ' selected' : '') + '>' + o.f + ' Hz · ' + esc(o.n) + '</option>'; }).join('') +
        '</select></label>' +
        '<label>⏱️ <select id="medGenMin"><option value="5">5 min</option><option value="10" selected>10 min</option><option value="15">15 min</option></select></label></div>' +
        '<div class="conv-row"><label>🔉 Volumen <input type="range" id="medGenVol" min="5" max="60" value="25"></label></div>' +
        '<div class="conv-row"><button type="button" class="btn btn-accent" id="medGenPlay">▶ Sonar</button>' +
        '<button type="button" class="btn" id="medGenStop">⏹ Parar</button></div>' +
        '<p class="muted" id="medGenStatus">Elige una frecuencia y presiona ▶ Sonar. Volumen bajo, 5-15 min.</p></div>' +
        '<div id="medFrecList">' + frecs + '</div>' +
        '<div class="menstrual-card"><h4>🎧 Binaurales (con audífonos)</h4><p class="muted">Base 200 Hz + diferencia: delta ~2 (dormir), theta ~6 (meditar), alfa ~10 (calma atenta), beta ~18 (foco corto). 10 min máx, sin conducir.</p>' +
        '<div class="conv-row"><label>Onda <select id="medBinSel"><option value="2">delta ~2 · dormir</option><option value="6">theta ~6 · meditar</option><option value="10" selected>alfa ~10 · calma</option><option value="18">beta ~18 · foco</option></select></label>' +
        '<button type="button" class="btn" id="medBinPlay">▶ Binaural 10 min</button>' +
        '<button type="button" class="btn" id="medBinStop">⏹ Parar</button></div>' +
        '<p class="muted" id="medBinStatus">Requiere audífonos estéreo. Si incomoda, apaga.</p></div>' +
      '</div>' +

      '<div id="medSub_plan" hidden><p class="muted">📆 Plan repetible de 28 días (1 vuelta lunar).</p>' + cardsHTML(MED_PLAN) +
        routineHTML('⏱️ Rutina medicina 10 min', '1) Ánimo 1-5 (30 s) · 2) Receta elegida 6 min (tarareo/tono/pulso) · 3) Silencio 2 min · 4) Ánimo 1-5 + 1 línea en la bitácora. Misma hora, 7 días seguidos por receta.') + '</div>' +

      /* bitácora emocional */
      '<div class="menstrual-card"><h4>📓 Mi bitácora de música medicina</h4>' +
      '<p class="muted">Anota ánimo antes/después (1-5). Ver tu ↗ en 7 días es la mejor "evidencia".</p>' +
      '<div class="conv-row"><label>📅 Fecha <input type="date" id="medFecha"></label>' +
      '<label>💊 Receta <select id="medReceta">' +
        MED_RECETAS.map(function (r) { return '<option>' + esc(r.n) + '</option>'; }).join('') +
        '<option>Canto libre</option><option>Tono del generador</option><option>Canción del cancionero</option></select></label></div>' +
      '<div class="conv-row"><label>⏱️ Min <input type="number" id="medMin" min="1" max="180" value="10"></label>' +
      '<label>😐 Antes (1-5) <select id="medAntes"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5</option></select></label>' +
      '<label>🙂 Después (1-5) <select id="medDespues"><option>1</option><option>2</option><option>3</option><option selected>4</option><option>5</option></select></label></div>' +
      '<label>✏️ ¿Qué hiciste? <input type="text" id="medNota" maxlength="140" placeholder="ej: tarareo 4-6 + tono 528, 10 min"></label>' +
      '<div class="dlg-actions"><button type="button" class="btn btn-accent" id="medAdd">+ Guardar sesión</button></div>' +
      '<div class="habits-list" id="medLog"></div>' +
      '<div class="dlg-actions"><span class="muted" id="medStats">0 registros</span>' +
      '<button type="button" class="btn" id="medShare">📤 Compartir</button>' +
      '<button type="button" class="btn" id="medClear">🗑 Borrar</button></div></div>' +
    '</div>' +

    /* REPERTORIO */
    '<div id="cancionesDialog_panel_repertorio" hidden>' +
      '<div class="menstrual-card"><h4>📓 Mi repertorio (mis canciones)</h4>' +
      '<p class="muted">Tus canciones en curso: agrégalas a mano o desde el cancionero. Toca ▶ para registrar 15 min de práctica.</p>' +
      '<div class="conv-row"><label>🎶 Título <input type="text" id="canTitulo" maxlength="80" placeholder="ej: Cueca en LA para la fonda"></label>' +
      '<label>🎼 Acordes <input type="text" id="canAcordes" maxlength="80" placeholder="A · E7 · D · A"></label></div>' +
      '<div class="conv-row"><label>📝 Nota <input type="text" id="canNota" maxlength="80" placeholder="luna llena · con familia"></label>' +
      '<label>📶 Estado <select id="canEstado"><option>empezada</option><option>practicando</option><option>lista</option><option>para mostrar</option></select></label></div>' +
      '<div class="dlg-actions"><button type="button" class="btn btn-accent" id="canRepAdd">+ Agregar</button></div>' +
      '<div class="habits-list" id="canRep"></div>' +
      '<div class="dlg-actions"><span class="muted" id="canRepStats">0 en repertorio</span>' +
      '<button type="button" class="btn" id="canRepShare">📤 Compartir</button></div></div>' +
      '<div class="menstrual-card"><h4>⏱️ Mis sesiones de práctica</h4>' +
      '<p class="muted">Registra cada tocada: fecha, minutos y qué canción.</p>' +
      '<div class="conv-row"><label>📅 Fecha <input type="date" id="canSesFecha"></label>' +
      '<label>🎶 Canción <input type="text" id="canSesTitulo" maxlength="80" placeholder="título"></label>' +
      '<label>⏱️ Min <input type="number" id="canSesMin" min="1" max="480" value="15"></label></div>' +
      '<label>✏️ Detalle <input type="text" id="canSesDet" maxlength="120" placeholder="ej: coro en bucle a 70 bpm"></label>' +
      '<div class="dlg-actions"><button type="button" class="btn btn-accent" id="canSesAdd">+ Guardar sesión</button></div>' +
      '<div class="habits-list" id="canSes"></div>' +
      '<div class="dlg-actions"><span class="muted" id="canSesStats">0 sesiones</span>' +
      '<button type="button" class="btn" id="canSesShare">📤 Compartir</button>' +
      '<button type="button" class="btn" id="canSesClear">🗑 Borrar sesiones</button></div></div>' +
    '</div>';

  makeDialog('cancionesDialog', '🎶 Canciones', 'Cancionero cantable + método para tocar + 💊 música como medicina (tipos, recetas, frecuencias y generador offline) + tu repertorio. Todo local y privado.', body);
}

function wireDialog() {
  var d = $('cancionesDialog'); if (!d) return;
  d.querySelectorAll('[data-ctab]').forEach(function (b) {
    b.onclick = function () { selectCanTab(b.getAttribute('data-ctab')); };
  });
  d.querySelectorAll('[data-mtab]').forEach(function (b) {
    b.onclick = function () { selectMedTab(b.getAttribute('data-mtab')); };
  });
  var g1 = d.querySelector('[data-goto-med]');
  if (g1) g1.onclick = function () { selectCanTab('medicina'); };
  var g2 = d.querySelector('[data-goto-rep]');
  if (g2) g2.onclick = function () { selectCanTab('repertorio'); };
  var q = $('canQ'); if (q) q.oninput = function () { renderCancionero(q.value); };
  d.querySelectorAll('[data-receta]').forEach(function (b) {
    b.onclick = function () {
      var sel = $('medReceta');
      if (sel) sel.value = b.getAttribute('data-receta');
      var mf = $('medFecha'); if (mf && !mf.value) mf.value = todayKey();
      try { var mn = $('medNota'); if (mn) mn.focus(); } catch (e) {}
      renderMedicina();
    };
  });
  /* frecuencias: lista + generador */
  d.querySelectorAll('[data-frec]').forEach(function (b) {
    b.onclick = function () {
      var sel = $('medGenFreq'); if (sel) sel.value = b.getAttribute('data-frec');
      var mm = $('medGenMin'); genPlay(parseFloat(b.getAttribute('data-frec')) || 528, mm ? (parseInt(mm.value, 10) || 10) : 10);
    };
  });
  var gp = $('medGenPlay');
  if (gp) gp.onclick = function () {
    var sel = $('medGenFreq'), mm = $('medGenMin');
    genPlay(sel ? (parseFloat(sel.value) || 528) : 528, mm ? (parseInt(mm.value, 10) || 10) : 10);
  };
  var gs = $('medGenStop'); if (gs) gs.onclick = function () { genStop(); };
  var d2 = d.querySelector('#medGenVol');
  if (d2) d2.oninput = function () { /* se aplica al próximo tono */ };
  var bp = $('medBinPlay');
  if (bp) bp.onclick = function () {
    var ac = acGet(); if (!ac) return;
    genStop(true);
    try {
      var diff = parseFloat(($('medBinSel') || {}).value) || 10;
      var o1 = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain();
      var mL = ac.createStereoPanner ? ac.createStereoPanner() : null;
      var mR = ac.createStereoPanner ? ac.createStereoPanner() : null;
      o1.type = 'sine'; o2.type = 'sine';
      o1.frequency.value = 200; o2.frequency.value = 200 + diff;
      var volEl = $('medGenVol');
      var v = volEl ? (parseInt(volEl.value, 10) || 25) / 100 : 0.25;
      v = Math.max(0.02, Math.min(0.4, v));
      g.gain.setValueAtTime(0.0001, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(Math.max(0.001, v * 0.3), ac.currentTime + 2.5);
      if (mL && mR) {
        mL.pan.value = -1; mR.pan.value = 1;
        o1.connect(mL); mL.connect(g); o2.connect(mR); mR.connect(g);
      } else { o1.connect(g); o2.connect(g); }
      g.connect(ac.destination); o1.start(); o2.start();
      genNodes = { o: { stop: function () { try { o1.stop(); } catch (e) {} try { o2.stop(); } catch (e2) {} } }, g: g };
      var st = $('medBinStatus');
      if (st) st.textContent = '🔊 Binaural 200 + ' + diff + ' Hz por 10 min (audífonos, volumen bajo, sin conducir)…';
      clearTimeout(genTimer);
      genTimer = setTimeout(function () {
        genStop(true);
        if (st) st.textContent = '⏱️ Binaural completo. 3 min de silencio ahora 🤫.';
        try { alert('⏱️ Binaural completo. Silencio 3 min y anota tu ánimo abajo.'); } catch (e) {}
      }, 10 * 60 * 1000);
    } catch (e) { alert('No se pudo generar el binaural'); }
  };
  var bs = $('medBinStop'); if (bs) bs.onclick = function () { try { genStop(true); } catch (e) {} var st = $('medBinStatus'); if (st) st.textContent = 'Requiere audífonos estéreo. Si incomoda, apaga.'; };
  d.addEventListener('close', function () { genStop(true); });
  /* puentes a instrumentos */
  d.querySelectorAll('[data-open-mus]').forEach(function (x) {
    x.onclick = function () {
      var id = x.getAttribute('data-open-mus');
      try { var d0 = $('cancionesDialog'); if (d0 && d0.open) d0.close(); } catch (e) {}
      setTimeout(function () { try { var t = $(id); if (t) t.click(); } catch (e2) {} }, 120);
    };
  });
  /* repertorio add */
  var ra = $('canRepAdd');
  if (ra) ra.onclick = function () {
    var t = clean(($('canTitulo') || {}).value || '', 80);
    if (!t) return alert('Ponle título a tu canción (ej: Cueca en LA)');
    var s = store();
    s.repertorio.push({ id: uid('r'), titulo: t, acordes: clean(($('canAcordes') || {}).value || '', 80), ritmo: '', estado: (($('canEstado') || {}).value || 'empezada'), fecha: todayKey(), nota: clean(($('canNota') || {}).value || '', 80) });
    save(); $('canTitulo').value = ''; $('canAcordes').value = ''; $('canNota').value = '';
    renderRepertorio();
  };
  var rs = $('canRepShare');
  if (rs) rs.onclick = async function () {
    var s = store();
    if (!s.repertorio.length) return alert('Tu repertorio está vacío');
    var lines = s.repertorio.slice(0, 20).map(function (r) { return '· ' + r.titulo + ' — ' + (r.acordes || '') + ' [' + (r.estado || '') + ']'; });
    await share('🎶 Mi repertorio', '🎶 Mi repertorio (' + s.repertorio.length + '):\n' + lines.join('\n'));
  };
  /* sesiones add */
  var sa = $('canSesAdd');
  if (sa) sa.onclick = function () {
    var det = clean(($('canSesDet') || {}).value || '', 120);
    var tit = clean(($('canSesTitulo') || {}).value || '', 80) || 'Práctica libre';
    if (!det && !tit) return alert('Cuenta qué practicaste');
    var s = store();
    s.sesiones.push({ id: uid('s'), fecha: (($('canSesFecha') || {}).value || todayKey()), titulo: tit, min: Math.max(1, Math.min(480, parseInt(($('canSesMin') || {}).value, 10) || 15)), detalle: det });
    save(); $('canSesDet').value = '';
    renderSesiones();
  };
  var sh = $('canSesShare');
  if (sh) sh.onclick = async function () {
    var s = store();
    if (!s.sesiones.length) return alert('Sin sesiones');
    var tot = s.sesiones.reduce(function (a, b) { return a + (+b.min || 0); }, 0);
    var lines = s.sesiones.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); }).slice(0, 20).map(function (x) { return '· ' + x.fecha + ' — ' + x.titulo + ' ' + x.min + 'min'; });
    await share('🎶 Mis sesiones', '🎶 ' + s.sesiones.length + ' sesiones · ' + tot + ' min\n' + lines.join('\n'));
  };
  var sc = $('canSesClear');
  if (sc) sc.onclick = function () {
    if (!confirm('¿Borrar tus sesiones de práctica?')) return;
    store().sesiones = []; save(); renderSesiones();
  };
  /* medicina add */
  var ma = $('medAdd');
  if (ma) ma.onclick = function () {
    var s = store();
    s.medicina.push({
      id: uid('m'), fecha: (($('medFecha') || {}).value || todayKey()),
      receta: (($('medReceta') || {}).value || 'Canto libre'),
      min: Math.max(1, Math.min(180, parseInt(($('medMin') || {}).value, 10) || 10)),
      antes: parseInt(($('medAntes') || {}).value, 10) || 3,
      despues: parseInt(($('medDespues') || {}).value, 10) || 4,
      nota: clean(($('medNota') || {}).value || '', 140)
    });
    save('Sesión medicina guardada'); $('medNota').value = '';
    renderMedicina();
  };
  var msh = $('medShare');
  if (msh) msh.onclick = async function () {
    var s = store();
    if (!s.medicina.length) return alert('Sin registros medicina');
    var lines = s.medicina.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); }).slice(0, 20).map(function (x) { return '· ' + x.fecha + ' — ' + x.receta + ' ' + x.min + 'min ánimo ' + x.antes + '→' + x.despues; });
    await share('💊 Mi música medicina', '💊 ' + s.medicina.length + ' sesiones:\n' + lines.join('\n'));
  };
  var mc = $('medClear');
  if (mc) mc.onclick = function () {
    if (!confirm('¿Borrar tu bitácora de música medicina?')) return;
    store().medicina = []; save(); renderMedicina();
  };
}

function refreshAll() {
  var mf = $('medFecha'); if (mf && !mf.value) mf.value = todayKey();
  var sf = $('canSesFecha'); if (sf && !sf.value) sf.value = todayKey();
  renderCancionero(($('canQ') || {}).value || '');
  renderRepertorio(); renderSesiones(); renderMedicina();
}
function openTab(tab, medSub) {
  refreshAll();
  selectCanTab(tab || 'cancionero');
  if (tab === 'medicina' && medSub) selectMedTab(medSub);
  else if (tab === 'medicina') selectMedTab('usar');
  openDlg('cancionesDialog');
}

function wire() {
  build();
  wireDialog();
  var b1 = $('btnCanciones'); if (b1) b1.onclick = function () { openTab('cancionero'); };
  var b2 = $('btnMusicaMedicina'); if (b2) b2.onclick = function () { openTab('medicina'); };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
