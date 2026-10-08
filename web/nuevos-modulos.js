/* ============================================================
   NUEVOS MODULOS — Calendario 13 Lunas (Penco · Bio-Bio)
   14 secciones integradas dentro de los grupos existentes:
   - Territorio: Agua (+ Recoleccion fusionada en Lawen Herbario, Trafkintu
     fusionado en Mis Semillas de Siembra Lunar, Cielo Mapuche en Astro)
   - Vida diaria: La Bodega (conservas y fermentos)
   - Herramientas/Oficios: Nudos y Redes, Bitacora Taller, Gestion Invernal
   - Emergencias & Comunidad: Trueque y Feria, Minga
   - Mente & Estudio: Epew (+ Territorial dentro de Mapuzugun)
   - Cuerpo & Salud: Fertilidad Sintotermica (Ritmo Circadiano vive fusionado en Circadiano)
   Todo queda local y privado por usuario (DATA + scheduleSave).
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
  var d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + days);
  try { return cal.fmtKey.format(d); } catch (e) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function fmtLong(key) {
  try { return cal.fmtDate.format(new Date(key + 'T12:00:00')); } catch (e) { return key; }
}
function store(key, def) {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return def;
    if (u[key] === undefined) u[key] = def;
    return u[key];
  } catch (e) { return def; }
}
function save(msg) {
  try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {}
}
function lunaDeFecha(key) {
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return { y: r.y, luna: r.luna, dia: r.diaN }; }
  } catch (e) {}
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return { y: null, luna: m.luna, dia: m.dia }; }
  } catch (e) {}
  return null;
}
function lunaTxt(key) {
  var l = lunaDeFecha(key);
  return l ? ('Luna ' + l.luna + ' · dia ' + l.dia) : '';
}
function lunasEntre(fechaPasadaKey) {
  var a = new Date(fechaPasadaKey + 'T12:00:00').getTime(), b = Date.now();
  var d = Math.floor((b - a) / 86400000);
  if (d < 0) return { dias: d, lunas: 0, txt: 'fecha futura' };
  return { dias: d, lunas: Math.floor(d / 28), txt: d + ' dias (~' + (d / 28).toFixed(1) + ' lunas)' };
}
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}
function speak(text) {
  try {
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-CL'; u.rate = 0.92;
    speechSynthesis.speak(u);
  } catch (e) { alert('Audio no disponible en este dispositivo'); }
}

/* ---------- datos base ---------- */
var RECOLECCION = [
  { n: 'Cochayuyo', c: 'Durvillaea antarctica', t: 'Alga parda', icon: '🌿', lunas: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], hab: 'Roquerio expuesto, Lirquen / Playa Negra', id: 'Fronda gruesa color pardo-verdoso, tallo (ulte) grueso, disco basal pegado a la roca. Olor a mar fresco.', tox: 'Sin toxicidad propia. PELIGRO: marea roja (no cosechar ni consumir si hay alerta Sernapesca) y contaminacion cerca de emisarios.', prep: 'Enjuague en agua de mar, secado al sol 2-3 dias colgado. Ulte: pelar, picar, ensalada o escabeche. Charquican de cochayuyo.', opt: 'Bajamares vivas (<0,6 m) de luna nueva/llena.' },
  { n: 'Luche', c: 'Pyropia spp.', t: 'Alga roja', icon: '🍃', lunas: [1, 2, 3, 11, 12, 13], hab: 'Rocas altas del intermareal', id: 'Lamina fina, casi transparente, verde-rojiza, pegada a la roca alta. Se recoge en invierno.', tox: 'Sin toxicidad. Evitar rocas con manchas de petroleo o espuma industrial.', prep: 'Enjuagar, secar a la sombra, tostar leve. Pan de luche, tortillas, sopas.', opt: 'Lunas 1-3 y 11-13 (Pukem), bajamar diurna.' },
  { n: 'Huiro negro', c: 'Lessonia nigrescens', t: 'Alga parda', icon: '🌊', lunas: [4, 5, 6, 7, 8, 9, 10], hab: 'Roquerio bajo y pozas', id: 'Matass oscuras ramificadas formando mini-bosques. No arrancar planta completa.', tox: 'Solo observacion y corte menor. Indicador de agua limpia.', prep: 'Corte de puntas tiernas, secado. Caldos minerales.', opt: 'Pewu-Walung, marea baja.' },
  { n: 'Changle', c: 'Ramaria flava', t: 'Hongo', icon: '🍄', lunas: [10, 11, 12], hab: 'Suelo de bosque nativo / pino, Rimu (otono)', id: 'Ramitas amarillas como coral, base blanca. Olor suave a tierra. CONFUSION: Ramaria toxica (amarga, tonos anaranjados).', tox: 'TOXICO si es amargo o anaranjado. Regla: si no estas 100% seguro, NO comer. Probar solo un bocado cocido la primera vez.', prep: 'Solo ejemplar seguro: salteado, empanadas. Nunca crudo.', opt: 'Lunas 10-12, despues de lluvias.' },
  { n: 'Loyo', c: 'Boletus loyo', t: 'Hongo', icon: '🍄', lunas: [10, 11, 12], hab: 'Bajo robles / bosque, otono', id: 'Sombrero cafe-rojizo, poros amarillos esponjosos (no laminas), pie grueso. No tiñe azul al corte.', tox: 'CONFUSION con boletos amargos (sabor picante) o que azulean: descartar.', prep: 'Secar en rebanadas (deshidratado), risottos, caldos.', opt: 'Lunas 10-12.' },
  { n: 'Digueñe', c: 'Cyttaria spp.', t: 'Hongo', icon: '⚪', lunas: [9, 10, 11], hab: 'Ramas de roble/hualle en primavera-otonio', id: 'Pelotitas blancas gomosas sobre ramas de hualle. Firme al tacto.', tox: 'Sin toxicidad conocida. Comer fresco, no guardar mas de 2 dias.', prep: 'Ensalada con cilantro y limon, salteado corto.', opt: 'Lunas 9-11.' },
  { n: 'Maqui', c: 'Aristotelia chilensis', t: 'Fruto nativo', icon: '🫐', lunas: [7, 8], hab: 'Borde de bosque y quebradas', id: 'Baya negra pequena en racimo, mancha morada. Cosecha con tijera.', tox: 'Sin toxicidad. Dejar 30% para aves.', prep: 'Jugo, deshidratado, mermelada. Secar a la sombra.', opt: 'Lunas 7-8 (Walung).' },
  { n: 'Avellana chilena', c: 'Gevuina avellana', t: 'Fruto nativo', icon: '🌰', lunas: [10, 11], hab: 'Bosque templado, vegas', id: 'Nuez redonda caida bajo el arbol (mar-may). No varear ramas.', tox: 'Sin toxicidad. Tostar solo las de consumo; las de semilla no se tuestan.', prep: 'Tostada, harina, conserva en miel.', opt: 'Lunas 10-11.' },
  { n: 'Pinon (ngulliw)', c: 'Araucaria araucana', t: 'Fruto nativo', icon: '🌲', lunas: [10, 11, 12], hab: 'Precordillera (recoleccion con respeto)', id: 'Pinon maduro caido, cascara dura. Recoger del suelo, no trepar a cortar conos verdes.', tox: 'Sin toxicidad. Cocer bien (90 min).', prep: 'Cocido, harina tostada, mote de pinon.', opt: 'Lunas 10-12.' },
  { n: 'Rosa mosqueta', c: 'Rosa rubiginosa', t: 'Fruto', icon: '🔴', lunas: [10, 11, 12], hab: 'Cercos y bordes de camino', id: 'Fruto rojo-ovalado con pelillos internos (ur ticantes). Guantes para cosechar.', tox: 'Pelillos irritan: colar bien pulpa y te. Semilla no se mastica en exceso.', prep: 'Mermelada colada, te de cascara seca, aceite.', opt: 'Lunas 10-12, despues de primera helada (mas dulce).' },
  { n: 'Nalca / Pangue', c: 'Gunnera tinctoria', t: 'Planta', icon: '🌱', lunas: [4, 5, 6], hab: 'Vegas y esteros humedos', id: 'Hoja gigante como paraguas, peciolo grueso comestible (nalca). Raiz no se come.', tox: 'Peciolo seguro; hoja y raiz solo uso externo tradicional.', prep: 'Peciolo pelado, crudo con sal o ensalada.', opt: 'Lunas 4-6 (Pewu).' },
  { n: 'Boldo', c: 'Peumus boldus', t: 'Lawen (hoja)', icon: '🍃', lunas: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], hab: 'Ladera, bosque esclerofilo', id: 'Hoja dura, aromatica, verde brillante. Recolectar 3-4 hojas por rama, nunca defoliar.', tox: 'Infusion suave ocasional. Evitar en embarazo y en exceso (aceite boldina). Max 1 taza/dia por 7 dias.', prep: 'Infusion digestiva: 1 hoja por taza, 5 min.', opt: 'Luna llena (maxima savia), manana.' },
  { n: 'Matico', c: 'Buddleja globosa', t: 'Lawen (hoja)', icon: '🌿', lunas: [4, 5, 6, 7, 8], hab: 'Quebradas y cercos humedos', id: 'Hoja alargada rugosa, enves blanquecino, flor naranja en pompón.', tox: 'Uso externo seguro; interno suave y corto. Evitar embarazo.', prep: 'Lavados de heridas (infusion tibia), infusion leve.', opt: 'Luna llena, manana.' },
  { n: 'Bailahuen', c: 'Haplopappus spp.', t: 'Lawen', icon: '🌼', lunas: [5, 6, 7, 8], hab: 'Cerros asoleados', id: 'Arbusto resinoso, flor amarilla tipo margarita. Olor fuerte.', tox: 'Amargo potente: dosis baja. Evitar embarazo y uso prolongado.', prep: 'Infusion hepatica suave: pizca por taza.', opt: 'Luna llena.' },
  { n: 'Mora / Murra', c: 'Rubus spp.', t: 'Fruto', icon: '🫐', lunas: [7, 8, 9], hab: 'Cercos y quebradas', id: 'Mora negra brillante madura; roja = inmadura (acida).', tox: 'Sin toxicidad. Lavar por polvo de camino.', prep: 'Mermelada, jugo, deshidratada, chicha.', opt: 'Lunas 7-9.' },
  { n: 'Hierbas de huerta asilvestrada', c: 'Menta / Melisa / Ortiga', t: 'Lawen', icon: '🌱', lunas: [4, 5, 6, 7, 8, 9], hab: 'Bordes de acequia y huerta', id: 'Menta: olor fresco, tallo cuadrado. Ortiga: pelos urticantes (guantes).', tox: 'Ortiga: no cruda (cocida pierde urticancia). Menta: evitar en reflujo severo.', prep: 'Infusiones, purin de ortiga para huerta, tortilla de ortiga cocida.', opt: 'Creciente-llena, manana.' }
];
var FENOLOGIA = {
  1: 'Pleno Pukem: luche en roca alta, cochayuyo con cuidado (marejadas), boldo para infusiones de invierno.',
  2: 'Salida de invierno: ultimos luches, brotes de nalca temprana, boldo y eucalipto para vapores.',
  3: 'Fin de invierno: nalca joven, hierbas perennes, cochayuyo en bajamares tranquilas.',
  4: 'Pewu: floracion; matico y bailahuen en punto, nalca plena, maqui en flor (no cosechar).',
  5: 'Primavera plena: lawen en maxima fuerza (cosecha en luna llena), nalca, hierbas para secar.',
  6: 'Antesala verano: ultima nalca tierna, hierbas para guardar, inicio de murra temprana.',
  7: 'Walung: maqui, murra, hierbas en semilla (guardar semilla), cochayuyo de verano.',
  8: 'Pleno verano: maqui tardio, murra plena, avellana temprana, secado al sol.',
  9: 'Cierre verano: digueñes, murra tardia, rosa mosqueta verde (esperar helada).',
  10: 'Rimu: pinones, avellanas, changles, loyos, rosa mosqueta, hongos tras lluvia.',
  11: 'Otono medio: pinones, changle, loyo, rosa mosqueta dulce tras helada, boldo.',
  12: 'Otono tardio: ultimos pinones y hongos, rosa mosqueta, luche temprano.',
  13: 'Descanso: luche de invierno, cochayuyo observado (no cosecha grande), boldo, memoria y secado.'
};
var BODEGA_TIPOS = {
  'Mermelada': { mad: 1, cad: 12, nota: 'Punto hilo flojo; frasco esteril, tapa nueva. Guardar oscuro y fresco.' },
  'Tomate al jugo': { mad: 1, cad: 12, nota: 'Acidificar (1 cdta limon/L), bano maria 40 min. Si tapa se hincha: descartar.' },
  'Chucrut': { mad: 1, cad: 6, nota: '2% sal. Listo cuando burbujea suave y sabe acido (1 luna). Refrigerar tras abrir.' },
  'Kombucha': { mad: 0, cad: 3, nota: 'Fermenta 7-14 dias segun calor. Segunda fermentacion 2-3 dias. Hongo madre sano.' },
  'Deshidratado': { mad: 0, cad: 9, nota: 'Secar hasta quebrar (no doblar). Frasco hermetico + lugar oscuro.' },
  'Encurtido / Escabeche': { mad: 1, cad: 8, nota: 'Vinagre 1:1. Listo en 1 luna. Refrigerar abierto.' },
  'Salsa / conservas acidas': { mad: 1, cad: 10, nota: 'pH acido + bano maria. Etiquetar todo.' },
  'Hierba seca / Lawen': { mad: 0, cad: 12, nota: 'Secar a la sombra ventilada. Frasco opaco; aroma = potencia.' }
};
var NUDOS = [
  { n: 'As de guia', cat: 'Presilla', uso: 'Kayak, amarre seguro que no se aprieta. Presilla que salva vidas: remolque, rescate, amarra al bote.', pasos: ['Haz un seno (lazo) con el chicote encima.', 'Pasa el chicote por el seno desde abajo (la "serpiente sale del lago").', 'Rodea el firme por detras (rodea el arbol).', 'Vuelve a entrar al seno por donde salio.', 'Ajusta: tira firme y seno a la vez. Deja 10 cm de cola.'], tip: 'Verificacion: cuenta 3 partes paralelas. Para kayak: une cabo de remolque. NUNCA para escalar sin respaldo.' },
  { n: 'Ballestrinque', cat: 'Amarre', uso: 'Entutorado de huerta, amarrar a poste o vara. Rapido y ajustable.', pasos: ['Da una vuelta completa al poste.', 'Cruza el chicote sobre el firme formando una X.', 'Da segunda vuelta al poste.', 'Pasa el chicote bajo la X.', 'Tensa ambos lados.'], tip: 'Con carga constante aguanta; si vibra o es para vidas, remata con medio cote.' },
  { n: 'Nudo de pescador (doble)', cat: 'Union', uso: 'Unir dos lineas de pesca o nylon del mismo grosor. Empalmar roturas de red.', pasos: ['Superpon 10 cm de ambas lineas en sentidos opuestos.', 'Con una, haz 3 vueltas sobre la otra y pasa por el centro.', 'Repite con la otra linea (nudo doble = 2 nudos enfrentados).', 'Humedece y tira de los 4 cabos a la vez.', 'Corta sobrantes a 3 mm.'], tip: 'Humedece siempre antes de apretar nylon o se quema y pierde 50% fuerza.' },
  { n: 'Ocho (simple + doble)', cat: 'Tope', uso: 'Tope y presilla de seguridad. Base de kayak, vela y rescate. No se deshace solo.', pasos: ['Haz un seno y cruza formando un 8.', 'Pasa el chicote por el primer ojo del 8.', 'Para presilla (doble): sigue el dibujo del 8 con el chicote duplicado.', 'Peina el nudo (acomoda cada vuelta, sin cruces).', 'Tensa. Deja 10 cm de cola.'], tip: 'El nudo rey: no se deshace solo y se desata facil tras carga. Ideal como tope al final de todo cabo.' },
  { n: 'Rizo (llano)', cat: 'Union', uso: 'Atar fardos, cerrar sacos, unir cuerdas IGUALES sin carga critica.', pasos: ['Derecha sobre izquierda y pasa.', 'Izquierda sobre derecha y pasa.', 'Tensa parejo.', 'Verifica: dos senos simetricos.', 'NUNCA para vidas, cargas distintas o cuerdas mojadas.'], tip: 'Si las cuerdas son distintas o resbalan: usa vuelta de escota. Error mortal: usarlo como presilla.' },
  { n: 'Vuelta de escota (simple + doble)', cat: 'Union', uso: 'Unir cuerda gruesa con delgada (red + cabo, carpa + viento). La reina de redes.', pasos: ['Haz un seno con la gruesa (relinga).', 'Pasa la delgada (malla) por dentro del seno.', 'Rodea el seno completo por detras.', 'Pasa bajo su propio firme.', 'Tensa. Doble vuelta (2 rodeos) si resbala o es nylon.'], tip: 'Clave para reparar redes: malla (delgada) a relinga (gruesa). Doble si hay tirones de mar.' },
  { n: 'Medio cote + Cote doble', cat: 'Remate', uso: 'Rematar TODO: el seguro universal. Cerrar amarres, fijar carga, terminar ballestrinque.', pasos: ['Pasa el chicote alrededor del firme formando un seno.', 'Cruza el chicote por dentro del seno y tira (1 medio cote).', 'Repite pegado al anterior (cote doble = 2 medios cotes).', 'Ajusta cada cote por separado.', 'Deja cola + tope de ocho si es critico.'], tip: 'Regla de oro: todo amarre a poste se remata con 2 medios cotes. Barato y salva faenas.' },
  { n: 'Palomar', cat: 'Pesca', uso: 'Atar anzuelo, emerillon o señuelo. El mas fuerte y facil con nylon/monofilamento.', pasos: ['Dobla 15 cm de linea y pasa el doblez por el ojo del anzuelo.', 'Haz un nudo simple flojo con el doblez (no apretar).', 'Pasa el anzuelo completo por el lazo del doblez.', 'Humedece bien.', 'Tira del firme y del chicote a la vez. Corta sobrante a 3 mm.'], tip: 'Conserva ~95% de resistencia (el mejor). No sirve para trenzado grueso sin humedecer doble.' },
  { n: 'Clinch mejorado', cat: 'Pesca', uso: 'El clasico de anzuelos: rapido en el bote con dedos frios.', pasos: ['Pasa 10 cm por el ojo del anzuelo.', 'Da 5-7 vueltas sobre el firme (5 para grueso, 7 para fino).', 'Pasa el chicote por el primer ojito junto al ojo.', 'Devuelve el chicote por el lazo grande que se formo (paso "mejorado").', 'Humedece y tira del firme. Corta a 3 mm.'], tip: 'Menos de 5 vueltas se suelta; mas de 7 se enreda. Practica 10 veces en casa antes del bote.' },
  { n: 'Vuelta de ancla (rezon)', cat: 'Amarre', uso: 'Amarrar bote/kayak al ancla, argolla o poste con tirones. No se atasca.', pasos: ['Da 2 vueltas completas al ancla/argolla (reparte la carga).', 'Pasa el chicote por el firme formando ballestrinque.', 'Remata con 2 medios cotes sobre el firme.', 'Tensa probando con el peso del cuerpo.', 'Revisa tras cada varada.'], tip: 'Las 2 vueltas iniciales absorben el tiron de la ola. Para fondeo nocturno agrega boya y cabo extra.' },
  { n: 'Tensor de carpa (taut-line)', cat: 'Ajustable', uso: 'Vientos de carpa, toldo y lona. Se ajusta sin desatar, aguanta viento sur.', pasos: ['Rodea la estaca y sube el chicote al viento.', 'Da 2 vueltas ajustadas sobre el firme (hacia la carpa).', 'Da 1 vuelta por fuera (hacia la estaca).', 'Prueba: el nudo corre si lo empujas, pero fija con carga.', 'Desliza para tensar. Remata con medio cote si queda fijo dias.'], tip: 'El nudo del campamento: con lluvia todo se afloja, se re-tensa en 5 segundos sin linterna.' },
  { n: 'Amarra cuadrada', cat: 'Construccion', uso: 'Unir 2 varas en cruz (entutorado alto, cabana, tendedero, jaula).', pasos: ['Parte con ballestrinque en la vara vertical.', 'Da 3-4 vueltas abrazando AMBAS varas (cuadro).', 'Da 2-3 vueltas de apriete (frapping) entre las varas.', 'Remata con 2 medios cotes.', 'Verifica: no debe girar. Moja el sisal: aprieta al secar.'], tip: 'Para varas en diagonal usa amarra diagonal (mismas vueltas en X). Ideal con vara de eucalipto + sisal.' },
  { n: 'Margarita (acortador)', cat: 'Ajustable', uso: 'Acortar cuerda sin cortarla o aislar un tramo danado. Tender lienza.', pasos: ['Haz 3 senos seguidos como una "M" con la cuerda.', 'Enrosca el seno central 2-3 veces sobre si mismo.', 'Pasa los senos laterales por dentro del central.', 'Tensa de ambos firmes parejo.', 'NUNCA para vidas: solo carga liviana y tensa.'], tip: 'Perfecta para que el tendedero o la lienza no arrastre: acorta 1 m en 10 segundos.' },
  { n: 'Presilla corrediza + Horca simple', cat: 'Presilla', uso: 'Lazo que aprieta: cerrar sacos, atar fardos de lena, lazo de huerta (uso suave).', pasos: ['Haz un seno y un ocho simple flojo en el firme.', 'Pasa el chicote por el ocho formando la presilla.', 'Ajusta el tamano del lazo.', 'Remata la cola con tope de ocho.', 'OJO: aprieta con carga: nunca al cuello, mano o pata de animal.'], tip: 'Para animales usa presilla fija (as de guia), nunca corrediza. Revisa que corra libre antes de cargar.' },
  { n: 'Nudo de red (hoja de red / mesh)', cat: 'Redes', uso: 'Tejer malla rombo por rombo con aguja y tablilla. El nudo del paño.', pasos: ['Carga la aguja y fija el hilo al rombo superior con vuelta de escota.', 'Calza la tablilla (ancho de malla) bajo el hilo.', 'Laza por detras del rombo vecino y vuelve por el centro.', 'Tira hasta copiar el tamano de la tablilla.', 'Aprieta con nudo simple de pescador. Repite rombo a rombo.'], tip: 'Practica primero con red de huerta (entutorado de arvejas): mismo gesto, sin presion de pesca.' }
];
var NUDOS_USO_RAPIDO = [
  { s: 'Amarrar el bote / kayak al poste', n: 'Vuelta de ancla + 2 medios cotes (o As de guia si es presilla fija)' },
  { s: 'Atar el anzuelo', n: 'Palomar (fuerza maxima) o Clinch mejorado (rapido en el bote)' },
  { s: 'Unir nylon cortado', n: 'Pescador doble (mismo grosor) / Vuelta de escota doble (distinto grosor)' },
  { s: 'Entutorar tomates / arvejas', n: 'Ballestrinque + remate; estructura con Amarra cuadrada' },
  { s: 'Carpa o lona con viento sur', n: 'Tensor ajustable (taut-line) + Ocho de tope al final' },
  { s: 'Cerrar saco / fardo / leña', n: 'Rizo (solo iguales y sin carga) o Presilla corrediza + remate' },
  { s: 'Acortar cuerda sin cortar', n: 'Margarita' },
  { s: 'Seguro universal de todo amarre', n: '2 medios cotes + tope de ocho en la cola' }
];
var CABOS_GUIA = [
  'Nylon / poliester (pesca y mar): no se pudre, aguanta sol y agua. El de pesca SIEMPRE humedecido antes de apretar.',
  'Sisal / yute (huerta): barato y compostable, ideal entutorado. Se pudre en 1 temporada: cambialo cada siembra.',
  'Polipropileno flotante (kayak/bote): flota, bueno para remolque y boya. Se quema con el sol: guarda a la sombra.',
  'Grosor guia: linea pesca 0,30-0,50 mm · red huerta 1-2 mm · vientos carpa 4-6 mm · amarra bote 8-12 mm.',
  'Cuidado: lava sal con agua dulce, seca a la SOMBRA (nunca sol directo), guarda en aduja (rollo suelto) sin nudos.',
  'Revision por luna: 1 vez por luna palpa todo el cabo buscando pelusas, zonas duras o decoloradas. Si ves alma (hilos internos), jubila ese tramo a la huerta.'
];
var NUDOS_ERRORES = [
  'Rizo para vidas o cargas distintas: se vuelca y se suelta. Usa as de guia u ocho.',
  'Nylon apretado en seco: se quema y pierde la mitad de la fuerza. Siempre humedece (saliva o agua).',
  'Cola corta (<5 cm): con tirones se deshace. Deja 10 cm + tope de ocho en lo critico.',
  'Prender equipo/ancla sin remate: todo ballestrinque con vibracion (motor, viento) lleva 2 medios cotes.',
  'Cuerda quemada por sol o roce en roca: si esta peluda, rigida o blanca, no la uses para vidas ni bote.',
  'Red fantasma: red rota abandonada sigue pescando y matando. Repara, reutiliza en huerta o entrega a punto limpio. Nunca al mar ni al humedal.'
];
var REDES_GUIA = [
  'Diagnostico: extiende el paño a contraluz y marca cada roto con lana de color. Decide: parchar (rectangulo limpio) o retejer.',
  'Corta el paño dañado en rectangulo limpio (no dejes picos que siguen rasgando).',
  'Iguala materiales: aguja de red + hilo del MISMO grosor y material (nylon pesca / sisal huerta). Distinto grosor = se corta al lado.',
  'Tensa el paño entre dos puntos (poste + peso o 2 sillas). Paño flojo = rombos disparejos.',
  'Copia la medida: usa tablilla (paleta del ancho exacto de la malla). Cada rombo nuevo debe calzar con ella.',
  'Teje rombo por rombo con nudo de hoja de red (vuelta de escota simple) o pescador simple en cada cruce.',
  'Remata bordes a la relinga (cabo grueso superior/inferior) con vuelta de escota doble.',
  'Relinga completa: arriba flotadores parejos, abajo plomos parejos. Si flota chueco, revisa reparto antes de culpar la malla.',
  'Revisa al sol: ningun rombo mayor ni menor. Pasa la mano: no debe enganchar.',
  'Prueba en agua calma antes de faena: 10 min colgada con peso. Ajusta tensores.',
  'Lavado y guardado: agua dulce, sombra total, seca 100% antes de doblar. Nunca sol directo ni bolsa plastica humeda.',
  'Red de huerta (entutorado): mismo gesto con sisal barato. Practica aqui primero: si te queda chueco, igual sirve para arvejas.'
];
var REDES_TIPOS = [
  { n: 'Paño de enmalle (pesca orilla)', d: 'Malla segun especie y norma: respeta vedas y tamanos minimos (ver Mareas y Pesca). Repara con nylon igual.' },
  { n: 'Tarraya / atarraya', d: 'Rueda con plomos: revisa plomos + jareta cada salida. Un plomo suelto abre la rueda y enreda.' },
  { n: 'Red de huerta / pajarera', d: 'Sisal o malla plastica reutilizada para arvejas, porotos y frutales. La red vieja de pesca sirve 2-3 temporadas aqui.' },
  { n: 'Malla sombra / lona', d: 'No es red de pesca: se fija con tensor ajustable, no con nudo fijo. Deja gotero (curva hacia abajo) para la lluvia.' }
];
var EPEW = [
  { t: 'El zorro y el puma (epew)', energia: 'Luna Creciente · aprendizaje', txt: 'El zorro (gürü) se creia el mas vivo del monte y se burlaba del puma (pangi) por cazar de frente. Una tarde de hambre, el zorro quiso robar la presa del puma y cayo en su propia trampa de lazos. El puma, en vez de castigarlo, le mostro como cazar limpio: "El vivo de verdad deja carne para manana". Desde entonces el zorro caza al amanecer y deja siempre un resto para el que viene detras.' },
  { t: 'La Pincoya del Golfo (mito local)', energia: 'Luna Llena · celebracion', txt: 'Dicen en Lirquen y Penco que cuando la Pincoya baila mirando al mar, la pesca sera abundante y alegre; si baila mirando la costa, hay que guardar las redes. Los antiguos la saludaban antes de zarpar con un poco de muday derramado al agua. Si la ves en luna llena, comparte tu primera captura: el mar devuelve el doble.' },
  { t: 'El Caleuche en la bahia (mito local)', energia: 'Luna Nueva · misterio', txt: 'En noches sin luna, los pescadores del Golfo de Arauco hablan de un barco de luces que navega sin ruido: el Caleuche. No hay que seguirlo ni llamarlo; se le respeta. Los abuelos dicen que aparece cuando alguien saca mas de lo que necesita. Moraleja de mar: pesca lo justo y el barco de luces pasara de largo.' },
  { t: 'El Trempulcahue (viaje de las almas)', energia: 'Luna Menguante · despedida y consejo', txt: 'Las ballenas (trempulcahue) llevan las almas de los justos hacia la isla del poniente. Por eso frente a Penco, cuando pasa una ballena en invierno, se hace silencio y se agradece. Ensenanza: vivir derecho para que, al partir, haya una ballena esperandonos.' },
  { t: 'El Nguruvilu del estero (cuidado del agua)', energia: 'Luna Nueva · misterio', txt: 'En los esteros y pozas vive el Nguruvilu, zorro-serpiente de agua que enturbia donde hay desorden. Si el agua baja turbia sin lluvia, los antiguos limpiaban la orilla y pedian permiso antes de sacar agua. Moraleja: el agua se cuida en su casa, no solo en el vaso.' },
  { t: 'La luciérnaga que guardo el fuego (epew)', energia: 'Luna Llena · celebracion', txt: 'Cuando se apago el fuego de la ruka en pleno Pukem, todos los animales tuvieron miedo de ir a buscarlo. Solo la pequena luciernaga (kudewallu) volo entre la lluvia con su lamparita. Trajo una brasa en su cola y por eso brilla hasta hoy. Moraleja: el mas pequeno puede guardar la luz de todos.' }
];
var KIMUN = [
  ['Queltrehue / Treile', 'Aves · humedal', 'Treile siempre avisa: su grito anuncia visitas o cambios de tiempo.'],
  ['Loica', 'Aves · pradera', 'Pecho rojo como el copihue; canta fuerte en Pewu.'],
  ['Bandurria', 'Aves · humedal', 'Cuello largo, grito metalico al volar en bandada.'],
  ['Pilpilen', 'Aves · playa', 'Blanco y negro, pico rojo; cuida sus nidos en la arena.'],
  ['Fio-fio', 'Aves · bosque', 'Pequeno cantor que llega con la primavera.'],
  ['Zorzal', 'Aves · jardin', 'Canta en invierno al amanecer; anuncia la luz que vuelve.'],
  ['Concon', 'Aves · bosque', 'Buho del bosque nativo; caza de noche sin ruido.'],
  ['Yeco', 'Aves · mar', 'Cormoran que seca sus alas al sol en las rocas.'],
  ['Wampo', 'Mar · pesca', 'Canoa o bote pequeno de la caleta.'],
  ['Chalupa / Lancha', 'Mar · pesca', 'Embarcacion artesanal del Golfo de Arauco.'],
  ['Kollof (cochayuyo)', 'Mar · algas', 'Alga grande; se corta la fronda, no la raiz.'],
  ['Luchi (luche)', 'Mar · algas', 'Alga fina de invierno; se recoge en bajamar.'],
  ['Red / Malla', 'Mar · pesca', 'Pano de pesca; se repara rombo por rombo.'],
  ['Anzuelo', 'Mar · pesca', 'Con nudo de pescador bien humedecido.'],
  ['Semilla', 'Huerta', 'Se guarda seca, rotulada y en lugar fresco.'],
  ['Tierra / Suelo', 'Huerta', 'Se alimenta con compost, no solo se usa.'],
  ['Agua / Lluvia', 'Huerta', 'Mawun: la lluvia que purifica en Pukem.'],
  ['Brote', 'Huerta', 'Pewu: tiempo de brotes y almácigos.'],
  ['Cosecha', 'Huerta', 'Walung-Rimu: cosechar y guardar con medida.'],
  ['Foye (canelo)', 'Bosque', 'Arbol sagrado; no se tala, se protege.'],
  ['Pewen (araucaria)', 'Bosque', 'Da el pinon; se recoge del suelo con respeto.'],
  ['Maqui', 'Bosque', 'Baya negra; dejar un tercio para las aves.'],
  ['Boldo', 'Bosque · lawen', 'Hoja digestiva; pocas hojas por rama.'],
  ['Fuego / Fogon', 'Casa', 'Kutral: centro de la ruka, se cuida siempre.'],
  ['Casa / Ruka', 'Casa', 'Se mantiene, se abriga y se comparte.'],
  ['Minga', 'Comunidad', 'Trabajo colectivo: hoy por ti, manana por mi.'],
  ['Trafkintu', 'Comunidad', 'Intercambio de semillas y saberes.'],
  ['Muday', 'Comida', 'Bebida de trigo o pinon para celebrar y ofrendar.'],
  ['Catuto', 'Comida', 'Pan de trigo cocido de la cocina mapuche.'],
  ['Mari mari', 'Saludo', 'Saludo: "hola, ¿como estas?" con respeto.'],
  ['Chaltu may', 'Agradecimiento', '"Muchas gracias" desde el corazon.'],
  ['Pewkayal', 'Despedida', '"Nos vemos": la red queda tendida.'],
  ['Kimun', 'Saber', 'Conocimiento que se comparte, no se vende.'],
  ['Lawen', 'Medicina', 'Remedio de hierbas; se pide permiso al cortar.'],
  ['Kuyen (luna)', 'Cielo', 'La luna que ordena siembra, pesca y cuerpo.'],
  ['Antu (sol)', 'Cielo', 'El sol que marca el We Tripantu.'],
  ['Wangulen (estrella)', 'Cielo', 'Las estrellas que guian de noche.'],
  ['Choike (nandu del cielo)', 'Cielo', 'Constelacion del sur: la Cruz guia al caminante.'],
  ['Wunelfe (lucero)', 'Cielo', 'Venus, estrella de la manana que abre el dia.']
];

/* ---------- inyeccion de botones en grupos existentes ---------- */
var NUEVOS_BTNS = [
  { id: 'btnAgua', txt: '💧 Agua', kw: 'agua lluvia estanque pozo milimetros reserva litros sequia corte rio rios medicion nivel ph riego goteo mulch cosecha techo potabilizar cloro filtro aguas grises ahorro consumo medidor essbio emergencia', grupo: 'territorio', sub: 'tierra' },
  { id: 'btnBodega', txt: '🍯 La Bodega', kw: 'bodega conservas fermentos mermelada chucrut kombucha deshidratado frasco caducidad maduracion lunar', grupo: 'hogar', sub: 'casa' },
  { id: 'btnCrianza', txt: '🧒 Crianza', kw: 'crianza infantil niños niñas hijos pedagogia montessori waldorf pikler reggio disciplina positiva juego infancia educacion', grupo: 'aprender', sub: 'infancias' },
  { id: 'btnNudos', txt: '🪢 Nudos y Redes', kw: 'nudos amarras redes pesca ballestrinque as de guia pescador kayak camping entutorado tejer reparar', grupo: 'territorio', sub: 'mar' },
  { id: 'btnTaller', txt: '🔧 Bitácora Taller', kw: 'taller reparacion mantenimiento herramienta bote bicicleta aceite afilado bomba alerta luna', grupo: 'hogar', sub: 'energia' },
  { id: 'btnTrueque', txt: '🔄 Trueque y Feria', kw: 'trueque feria local economia circular intercambio vecino feria libre penco gastos cuenta reciclaje punto limpio basura residuo botella pila aceite ropa recoleccion aseo', grupo: 'comunidad', sub: 'red' },
  { id: 'btnMinga', txt: '🤝 Minga · Red de Apoyo', kw: 'minga red apoyo comunidad ayuda techo cosecha tormenta llamado offline bluetooth vecino', grupo: 'comunidad', sub: 'red' },
  { id: 'btnFerti', txt: '🤰 Fertilidad Natural', kw: 'fertilidad ciclo sintotermico temperatura basal moco cervical ovulacion test lh buscar evitar embarazo parto puerperio lactancia bebe guagua hitos 1000 dias fur fpp vacunas controles crecimiento planificacion familiar natural privado', grupo: 'cuerpo', sub: 'ciclos' },
  { id: 'btnDerechos', txt: '⚖️ Derechos y Deberes', kw: 'derechos deberes constitucion ciudadano reclamo denuncia sernac trabajo salud educacion consumidor carabineros pdi juzgado municipalidad', grupo: 'comunidad', sub: 'red' },
];
function cleanupEpewSeparado() {
  try {
    var oldBtn = $('btnEpew');
    if (oldBtn && oldBtn.parentNode) oldBtn.parentNode.removeChild(oldBtn);
    var oldDlg = $('epewDialog');
    if (oldDlg && oldDlg.parentNode) oldDlg.parentNode.removeChild(oldDlg);
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf) {
      var i = ALL_BTNS.indexOf('btnEpew');
      if (i >= 0) ALL_BTNS.splice(i, 1);
    }
  } catch (e) {}
}
function cleanupForrajeSeparado() {
  try {
    var oldBtn = $('btnForraje');
    if (oldBtn && oldBtn.parentNode) oldBtn.parentNode.removeChild(oldBtn);
    var oldDlg = $('forrajeDialog');
    if (oldDlg && oldDlg.parentNode) oldDlg.parentNode.removeChild(oldDlg);
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf) {
      var i = ALL_BTNS.indexOf('btnForraje');
      if (i >= 0) ALL_BTNS.splice(i, 1);
    }
  } catch (e) {}
}
function cleanupTrafSeparado() {
  try {
    var oldBtn = $('btnTrafkintu');
    if (oldBtn && oldBtn.parentNode) oldBtn.parentNode.removeChild(oldBtn);
    var oldDlg = $('trafDialog');
    if (oldDlg && oldDlg.parentNode) oldDlg.parentNode.removeChild(oldDlg);
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf) {
      var i = ALL_BTNS.indexOf('btnTrafkintu');
      if (i >= 0) ALL_BTNS.splice(i, 1);
    }
  } catch (e) {}
}
function cleanupCieloSeparado() {
  try {
    var oldBtn = $('btnCielo');
    if (oldBtn && oldBtn.parentNode) oldBtn.parentNode.removeChild(oldBtn);
    var oldDlg = $('cieloDialog');
    if (oldDlg && oldDlg.parentNode) oldDlg.parentNode.removeChild(oldDlg);
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf) {
      var i = ALL_BTNS.indexOf('btnCielo');
      if (i >= 0) ALL_BTNS.splice(i, 1);
    }
  } catch (e) {}
}
function injectButtons() {
  try { cleanupEpewSeparado(); } catch (e) {}
  try { cleanupCocrea(); } catch (e) {}
  try { cleanupForrajeSeparado(); } catch (e) {}
  try { cleanupTrafSeparado(); } catch (e) {}
  try { cleanupCieloSeparado(); } catch (e) {}
  var added = 0;
  NUEVOS_BTNS.forEach(function (b) {
    if ($(b.id)) return;
    var g = document.querySelector('.action-group[data-group="' + b.grupo + '"] .group-btns');
    if (!g) return;
    var btn = document.createElement('button');
    btn.id = b.id; btn.className = 'btn'; btn.type = 'button';
    btn.textContent = b.txt;
    btn.setAttribute('data-keywords', b.kw);
    try { if (b.sub) btn.setAttribute('data-sub', b.sub); } catch (e2) {}
    var ref = g.querySelector('#btnDonate');
    if (b.grupo === 'herramientas' && ref) g.insertBefore(btn, ref);
    else if (b.id === 'btnAgua') {
      var refCompost = g.querySelector('#btnCompost');
      if (refCompost && refCompost.nextSibling) g.insertBefore(btn, refCompost.nextSibling);
      else if (refCompost) g.appendChild(btn);
      else g.appendChild(btn);
    }
    else g.appendChild(btn);
    added++;
  });
  try { ordenarTerritorio(); } catch (e) {}
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push) {
      NUEVOS_BTNS.forEach(function (b) { if (ALL_BTNS.indexOf(b.id) < 0) ALL_BTNS.push(b.id); });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  return added;
}

/* ---------- orden Territorio: Costa y Mar, luego Tierra y Monte (1 Huerta, 2 Siembra, 3 Bosque...), Cielo y Ritmo, Penco ---------- */
var ORDEN_TERRITORIO = ['btnTides','btnFishing','btnIntermareal','btnNudos','btnKayak','btnBallenas','btnHuerta','btnSiembra','btnBosque','btnCompost','btnAgua','btnHidroponia','btnElectrocultura','btnFlora','btnLawen','btnBirds','btnMeli','btnHongos','btnSenderos','btnFuego','btnWeather','btnAstro','btnGolden','btnCircadian','btnEkadashi','btnComuna'];
function ordenarTerritorio() {
  var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
  if (!g) return;
  // Si btnAgua aun no existe, igual ordena el resto; cuando se inyecte se vuelve a ordenar
  var byId = {};
  Array.prototype.forEach.call(g.querySelectorAll('button[id]'), function (b) { byId[b.id] = b; });
  ORDEN_TERRITORIO.forEach(function (id) {
    var b = byId[id] || $(id);
    if (b && b.parentNode !== g) { try { g.appendChild(b); } catch (e) {} byId[id] = b; }
    else if (b) { try { g.appendChild(b); } catch (e) {} }
  });
}

/* ---------- fabrica de dialogs ---------- */
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
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { d.showModal(); } catch (e) { try { d.show(); } catch (e2) {} } } }

/* ============================================================
   1) RECOLECCION SILVESTRE Y LAWEN
   ============================================================ */
var forrajeEditEspId = null;
function getForrajeEspecies() { var a = store('forrajeEspecies', []); return Array.isArray(a) ? a : []; }
function getEspeciesCompletas() {
  var mias = getForrajeEspecies().map(function (e) { e.mine = true; return e; });
  var base = RECOLECCION.map(function (e) { e.mine = false; return e; });
  return base.concat(mias);
}
function renderForraje(filtro, soloLuna) {
  var box = $('forrajeFichas'); if (!box) return;
  var q = (filtro || '').toLowerCase();
  var list = getEspeciesCompletas().filter(function (f) {
    if (soloLuna && soloLuna !== 'todas' && f.lunas.indexOf(+soloLuna) < 0) return false;
    if (!q) return true;
    return (f.n + ' ' + f.c + ' ' + f.t + ' ' + f.hab).toLowerCase().indexOf(q) >= 0;
  });
  var st = $('forrajeCount');
  if (st) st.textContent = '🌿 ' + RECOLECCION.length + ' fichas base + ' + getForrajeEspecies().length + ' mías · mostrando ' + list.length;
  if (!list.length) { box.innerHTML = '<p class="muted">Sin resultados. Prueba con "hongo", "alga" o "hoja" — o agrégala abajo como especie propia.</p>'; return; }
  box.innerHTML = list.map(function (f) {
    var tox = /TOXICO|PELIGRO|CONFUSION|Evitar|embarazo/i.test(f.tox || '');
    var mineChip = f.mine ? ' <span class="chip" style="font-size:10px;background:#a9d18e22;color:#a9d18e;border-color:#a9d18e55;white-space:nowrap">🌱 mía</span>' : '';
    var mineBtns = f.mine ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn" style="width:auto;font-size:11px" data-espedit="' + f.id + '">✏️ Editar</button><button type="button" class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-espdel="' + f.id + '">✕ Borrar</button></div>' : '';
    return '<div class="si-card lawen-card' + (f.mine ? ' mine' : '') + '"' + (f.mine ? ' style="border-style:dashed;border-color:var(--gold)"' : '') + '><div class="lawen-head"><span class="lawen-ico">' + (f.icon || '🌱') + '</span>' +
      '<span class="lawen-name">' + esc(f.n) + ' <small class="muted">· ' + esc(f.c || '') + '</small></span>' + mineChip +
      '<span class="chip lawen-luna">' + esc(f.t || '') + '</span></div>' +
      '<div class="lawen-grid"><span class="lawen-label">Lunas</span><span class="lawen-val">' + (f.lunas || []).join(' · ') + '</span>' +
      '<span class="lawen-label">Dónde</span><span class="lawen-val">' + esc(f.hab || '') + '</span>' +
      '<span class="lawen-label">Reconocer</span><span class="lawen-val">' + esc(f.mine ? (f.reconocer || '') : (f.id || '')) + '</span>' +
      '<span class="lawen-label">Preparar</span><span class="lawen-val">' + esc(f.prep || '') + '</span>' +
      '<span class="lawen-label dim">Óptimo</span><span class="lawen-val">' + esc(f.opt || '') + '</span></div>' +
      '<div class="lawen-warn" style="' + (tox ? '' : 'background:rgba(143,214,148,.08);border-color:rgba(143,214,148,.3);color:#bfe6c4') + '">' +
      (tox ? '⚠️ ' : '✓ ') + esc(f.tox || 'Sin advertencia registrada.') + '</div>' + mineBtns + '</div>';
  }).join('');
  box.querySelectorAll('[data-espdel]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar tu especie?')) return; var d = getForrajeEspecies(); var i = d.findIndex(function (x) { return String(x.id) === b.getAttribute('data-espdel'); }); if (i >= 0) d.splice(i, 1); save('Especie borrada'); refreshForrajeFichas(); }; });
  box.querySelectorAll('[data-espedit]').forEach(function (b) { b.onclick = function () { var e = getForrajeEspecies().find(function (x) { return String(x.id) === b.getAttribute('data-espedit'); }); if (!e) return; forrajeEditEspId = e.id; $('espNombre').value = e.n || ''; $('espCient').value = e.c || ''; $('espTipo').value = e.t || 'Lawen (hoja)'; $('espHab').value = e.hab || ''; $('espReconocer').value = e.reconocer || e.id || ''; $('espPrep').value = e.prep || ''; $('espTox').value = e.tox || ''; $('espOpt').value = e.opt || ''; $('espIcon').value = e.icon || '🌱'; paintEspLunas(e.lunas || []); $('espAdd').textContent = '↻ Actualizar especie'; $('espCancelEdit').classList.remove('hidden'); $('espNombre').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }; });
}
function refreshForrajeFichas() {
  var q = ($('forrajeQ') || {}).value || '';
  var lv = ($('forrajeLuna') || {}).value || 'todas';
  renderForraje(q, lv === 'todas' ? 'todas' : +lv);
}
function paintEspLunas(sel) {
  sel = sel || [];
  document.querySelectorAll('[data-espluna]').forEach(function (c) {
    c.checked = sel.indexOf(+c.getAttribute('data-espluna')) >= 0;
  });
}
function readEspLunas() {
  var out = [];
  document.querySelectorAll('[data-espluna]:checked').forEach(function (c) { out.push(+c.getAttribute('data-espluna')); });
  return out.length ? out : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
}
var forrajeEditId = null;
function getForrajeLog() { var a = store('forrajeLog', []); return Array.isArray(a) ? a : []; }
function renderForrajeLog() {
  var box = $('forrajeLog'); if (!box) return;
  var data = getForrajeLog();
  var st = $('forrajeStats');
  if (!data.length) { box.innerHTML = '<p class="muted">Sin salidas aún. Registra tu primera recolección arriba.</p>'; if (st) st.textContent = '0 registros'; return; }
  var s = data.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  box.innerHTML = s.map(function (r) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span><b>' + esc(r.especie) + '</b> · ' + esc(r.cant) + '<br><span class="muted" style="font-size:11px">' + r.fecha + ' · ' + esc(lunaTxt(r.fecha)) + ' · ' + esc(r.lugar || '') + ' · ' + esc(r.uso || '') + '</span>' + (r.nota ? '<br><span class="muted" style="font-size:11px">' + esc(r.nota) + '</span>' : '') + '</span><span style="display:flex;gap:6px;flex:0 0 auto"><button class="btn" style="width:auto;font-size:11px" data-edit="' + r.id + '">✏️</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></span></div>';
  }).join('');
  if (st) st.textContent = data.length + ' recolecciones';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Eliminar registro?')) return; var d = getForrajeLog(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderForrajeLog(); }; });
  box.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { var d = getForrajeLog(); var r = d.find(function (x) { return x.id === b.getAttribute('data-edit'); }); if (!r) return; forrajeEditId = r.id; $('forFecha').value = r.fecha; $('forEspecie').value = r.especie; $('forCant').value = r.cant; $('forLugar').value = r.lugar || ''; $('forUso').value = r.uso || ''; $('forNota').value = r.nota || ''; $('forrajeAdd').textContent = '↻ Actualizar'; }; });
}
function switchLawenTab(t) {
  var esForraje = (t === 'forraje');
  var herb = $('lawenHerbarioPanel'), forr = $('lawenForrajePanel');
  if (herb) herb.classList.toggle('hidden', esForraje);
  if (forr) forr.classList.toggle('hidden', !esForraje);
  var b1 = $('tabLawenHerbario'), b2 = $('tabLawenForraje');
  if (b1) b1.classList.toggle('btn-accent', !esForraje);
  if (b2) b2.classList.toggle('btn-accent', esForraje);
}
function paintForrajeHoy() {
  var k = todayKey(), l = lunaDeFecha(k);
  var box = $('forrajeHoy'); if (!box) return;
  box.innerHTML = '<h4>🌙 Hoy · ' + k + (l ? ' · Luna ' + l.luna : '') + '</h4><p class="muted" style="font-size:12px">' + esc(l && FENOLOGIA[l.luna] ? FENOLOGIA[l.luna] : 'Observa y registra.') + '</p>';
  if (l && $('forrajeLuna')) $('forrajeLuna').value = String(l.luna);
  paintForrajeFeno();
  refreshForrajeFichas();
  if ($('forFecha') && !$('forFecha').value) $('forFecha').value = k;
  renderForrajeLog();
}
function paintForrajeFeno() {
  var f = $('forrajeFeno'); if (!f) return;
  var v = ($('forrajeLuna') || {}).value || 'todas';
  f.textContent = v === 'todas' ? 'Mostrando todas las fichas. Filtra por luna para ver qué está disponible.' : ('Luna ' + v + ': ' + (FENOLOGIA[v] || ''));
}
/* ============================================================
   1) RECOLECCION (fusionado: pestana dentro de Lawen Herbario 🌿)
   El dialogo separado #forrajeDialog y el boton #btnForraje se
   eliminan; el contenido vive como pestana "Recoleccion" dentro
   de #lawenDialog. Incluye alta de especies propias.
   ============================================================ */
function setupForraje() {
  try { cleanupForrajeSeparado(); } catch (e) {}
  var dlg = $('lawenDialog');
  if (!dlg) { window._forrajeLawenRetry = (window._forrajeLawenRetry || 0) + 1; if (window._forrajeLawenRetry < 40) setTimeout(setupForraje, 500); return; }
  var form = dlg.querySelector('form') || dlg;
  if (!$('tabLawenForraje')) {
    var tabs = document.createElement('div');
    tabs.className = 'timer-tabs';
    tabs.style.cssText = 'margin:10px 0;flex-wrap:wrap';
    tabs.innerHTML = '<button type="button" id="tabLawenHerbario" class="btn btn-accent" style="width:auto">🌿 Herbario</button>' +
      '<button type="button" id="tabLawenForraje" class="btn" style="width:auto">🍄 Recolección y Lawen</button>';
    var herb = document.createElement('div');
    herb.id = 'lawenHerbarioPanel';
    var anchorSearch = $('lawenSearch');
    var anchorRow = anchorSearch ? anchorSearch.closest('.conv-row') : null;
    var moveNodes = [];
    if (anchorRow) moveNodes.push(anchorRow);
    ['lawenAddBox', 'lawenList'].forEach(function (id) { var n = $(id); if (n) moveNodes.push(n); });
    Array.prototype.forEach.call(form.querySelectorAll('.menstrual-card'), function (n) {
      if (n.querySelector && n.querySelector('h4') && /Reglas lawen seguro/.test(n.querySelector('h4').textContent || '')) moveNodes.push(n);
    });
    var refNode = anchorRow || $('lawenAddBox') || $('lawenList') || form.children[2] || null;
    if (refNode && refNode.parentNode) refNode.parentNode.insertBefore(tabs, refNode);
    else form.appendChild(tabs);
    if (refNode && refNode.parentNode) refNode.parentNode.insertBefore(herb, tabs.nextSibling);
    else form.appendChild(herb);
    moveNodes.forEach(function (n) { herb.appendChild(n); });
    var panel = document.createElement('div');
    panel.id = 'lawenForrajePanel';
    panel.className = 'hidden';
    panel.innerHTML =
      '<p class="muted" style="line-height:1.5">Guía fenológica por luna para Penco y Lirquén: qué hay disponible cada luna, cómo reconocerlo, su toxicidad y cómo prepararlo. <b>Cosecha con medida: corta, no arranques; deja 30%.</b></p>' +
      '<div id="forrajeHoy" class="menstrual-card" style="border-color:var(--gold)"></div>' +
      '<div class="conv-row" style="margin-top:10px"><label style="flex:2">Buscar <input type="text" id="forrajeQ" placeholder="hongo, alga, hoja..." autocomplete="off"></label>' +
      '<label>Ver luna <select id="forrajeLuna"><option value="todas">Todas</option>' + Array.from({ length: 13 }, function (_, i) { return '<option value="' + (i + 1) + '">Luna ' + (i + 1) + '</option>'; }).join('') + '</select></label></div>' +
      '<div id="forrajeFeno" class="chip" style="display:block;white-space:normal;margin-top:8px"></div>' +
      '<div id="forrajeCount" class="muted" style="font-size:11px;margin-top:6px"></div>' +
      '<div id="forrajeFichas" style="margin-top:8px;display:flex;flex-direction:column;gap:10px;max-height:340px;overflow-y:auto"></div>' +
      '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>➕ Agregar especie (si no está en la lista)</h4>' +
      '<p class="muted" style="font-size:11px">Suma tu hallazgo del territorio: queda <b>privado y local</b> en tu usuario y se filtra por luna como las base.</p>' +
      '<div class="conv-row"><label style="flex:2">Nombre * <input type="text" id="espNombre" placeholder="ej: Chupón, Hierba del paño" maxlength="40"></label><label>Icono <input type="text" id="espIcon" placeholder="🌱" maxlength="4" style="width:70px;text-align:center"></label></div>' +
      '<div class="conv-row"><label>Nombre científico <input type="text" id="espCient" placeholder="ej: Greigia sphacelata" maxlength="60"></label><label>Tipo <select id="espTipo"><option>Lawen (hoja)</option><option>Lawen (flor)</option><option>Fruto nativo</option><option>Hongo</option><option>Alga</option><option>Hierba de huerta</option><option>Otro</option></select></label></div>' +
      '<label>Dónde la viste <input type="text" id="espHab" placeholder="ej: Quebrada Honda, roquerío Playa Negra" maxlength="60"></label>' +
      '<label>Cómo reconocerla <input type="text" id="espReconocer" placeholder="ej: roseta verde, flor rosada en verano" maxlength="120"></label>' +
      '<label>Cómo prepararla / usarla <input type="text" id="espPrep" placeholder="ej: infusión 1 cdta / taza" maxlength="120"></label>' +
      '<label>⚠️ Advertencia / toxicidad <input type="text" id="espTox" placeholder="ej: No en embarazo / solo observado" maxlength="120"></label>' +
      '<label>Momento óptimo <input type="text" id="espOpt" placeholder="ej: Lunas 10-12, después de lluvia" maxlength="80"></label>' +
      '<div style="margin-top:6px"><span class="muted" style="font-size:11px">Lunas disponible (marca al menos una):</span>' +
      '<div id="espLunasBox" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">' + Array.from({ length: 13 }, function (_, i) { return '<label class="check-row" style="margin:0;font-size:11px;border:1px solid var(--line);border-radius:6px;padding:2px 6px"><input type="checkbox" data-espluna="' + (i + 1) + '" checked> ' + (i + 1) + '</label>'; }).join('') + '</div>' +
      '<div style="display:flex;gap:6px;margin-top:6px"><button type="button" id="espLunasTodas" class="btn" style="width:auto;font-size:11px">Todas</button><button type="button" id="espLunasNinguna" class="btn" style="width:auto;font-size:11px">Ninguna</button></div></div>' +
      '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="espAdd" class="btn btn-accent" style="width:auto">+ Guardar especie</button><button type="button" id="espCancelEdit" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>📓 Mi bitácora de recolección (privada)</h4>' +
      '<div class="conv-row"><label>Fecha <input type="date" id="forFecha"></label><label>Especie <input type="text" id="forEspecie" placeholder="ej: Cochayuyo" maxlength="30"></label><label>Cantidad <input type="text" id="forCant" placeholder="ej: 2 kg" maxlength="20"></label></div>' +
      '<div class="conv-row"><label>Lugar <input type="text" id="forLugar" placeholder="ej: Playa Negra" maxlength="30"></label><label>Uso <select id="forUso"><option value="comida">Comida</option><option value="medicina">Medicina / lawen</option><option value="semilla">Semilla</option><option value="observación">Solo observación</option></select></label></div>' +
      '<label>Notas <input type="text" id="forNota" placeholder="corte limpio, dejé raíz, 30%..." maxlength="80"></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="forrajeAdd" class="btn btn-accent" style="width:auto">+ Guardar</button></div>' +
      '<div id="forrajeLog" class="habits-list" style="margin-top:10px;max-height:220px"></div>' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="forrajeStats" class="muted" style="font-size:11px"></span><button type="button" id="forrajeShare" class="btn" style="width:auto">📤 Compartir</button></div></div>';
    herb.parentNode.insertBefore(panel, herb.nextSibling);
    $('tabLawenHerbario').onclick = function () { switchLawenTab('herbario'); };
    $('tabLawenForraje').onclick = function () { paintForrajeHoy(); switchLawenTab('forraje'); };
    $('forrajeQ').oninput = function () { refreshForrajeFichas(); };
    $('forrajeLuna').onchange = function () { paintForrajeFeno(); refreshForrajeFichas(); };
    $('espLunasTodas').onclick = function () { paintEspLunas([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]); };
    $('espLunasNinguna').onclick = function () { paintEspLunas([]); };
    $('espAdd').onclick = function () {
      var n = clean($('espNombre').value, 40);
      if (!n) return alert('Ponle nombre a la especie');
      var rec = { id: forrajeEditEspId || uid('fx'), n: n, c: clean($('espCient').value, 60) || '—', t: $('espTipo').value || 'Otro', icon: ($('espIcon').value || '🌱').slice(0, 4), hab: clean($('espHab').value, 60), reconocer: clean($('espReconocer').value, 120), prep: clean($('espPrep').value, 120), tox: clean($('espTox').value, 120), opt: clean($('espOpt').value, 80), lunas: readEspLunas() };
      var d = getForrajeEspecies();
      if (forrajeEditEspId) { var i = d.findIndex(function (x) { return String(x.id) === String(forrajeEditEspId); }); if (i >= 0) d[i] = rec; forrajeEditEspId = null; $('espAdd').textContent = '+ Guardar especie'; $('espCancelEdit').classList.add('hidden'); }
      else d.push(rec);
      save('Especie guardada 🌱');
      ['espNombre', 'espCient', 'espHab', 'espReconocer', 'espPrep', 'espTox', 'espOpt'].forEach(function (id) { var el = $(id); if (el) el.value = ''; });
      paintEspLunas([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
      refreshForrajeFichas();
    };
    $('espCancelEdit').onclick = function () {
      forrajeEditEspId = null; $('espAdd').textContent = '+ Guardar especie'; $('espCancelEdit').classList.add('hidden');
      ['espNombre', 'espCient', 'espHab', 'espReconocer', 'espPrep', 'espTox', 'espOpt'].forEach(function (id) { var el = $(id); if (el) el.value = ''; });
      paintEspLunas([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    };
    $('forrajeAdd').onclick = function () {
      var f = $('forFecha').value; if (!f) return alert('Elige fecha');
      var esp = clean($('forEspecie').value, 30); if (!esp) return alert('Escribe la especie');
      var rec = { id: forrajeEditId || uid('fr'), fecha: f, especie: esp, cant: clean($('forCant').value, 20), lugar: clean($('forLugar').value, 30), uso: $('forUso').value, nota: clean($('forNota').value, 80) };
      var d = getForrajeLog();
      if (forrajeEditId) { var i = d.findIndex(function (x) { return x.id === forrajeEditId; }); if (i >= 0) d[i] = rec; forrajeEditId = null; $('forrajeAdd').textContent = '+ Guardar'; }
      else d.push(rec);
      save(); $('forEspecie').value = ''; $('forCant').value = ''; $('forNota').value = ''; renderForrajeLog();
    };
    $('forrajeShare').onclick = function () { var d = getForrajeLog(); if (!d.length) return alert('Sin registros'); share('🍄 Mis recolecciones', d.map(function (r) { return '· ' + r.fecha + ' — ' + r.especie + ' (' + r.cant + ') en ' + (r.lugar || '?'); }).join('\n')); };
  }
  var b = $('btnLawen');
  if (b && !b.dataset.forrajeWrapped) {
    b.dataset.forrajeWrapped = '1';
    var prev = b.onclick;
    b.onclick = function (ev) {
      try { if (typeof prev === 'function') prev.call(b, ev); } catch (e) {
        try { if (typeof renderLawenList === 'function') renderLawenList(); } catch (e2) {}
        try { $('lawenDialog').showModal(); } catch (e3) {}
      }
      try { paintForrajeHoy(); } catch (e) {}
      try { switchLawenTab('herbario'); } catch (e) {}
      try {
        var btn = document.querySelector('#btnLawen');
        if (btn && btn.dataset && btn.dataset.keywords && btn.dataset.keywords.indexOf('recoleccion') < 0) btn.dataset.keywords += ' recoleccion silvestre forraje hongos cochayuyo luche changle maqui fenologia toxicidad alga fruto hongo';
      } catch (e) {}
    };
  } else {
    try {
      var btn2 = $('btnLawen');
      if (btn2 && btn2.dataset && btn2.dataset.keywords && btn2.dataset.keywords.indexOf('recoleccion') < 0) btn2.dataset.keywords += ' recoleccion silvestre forraje hongos cochayuyo luche changle maqui fenologia toxicidad alga fruto hongo';
    } catch (e) {}
  }
  try { paintForrajeHoy(); } catch (e) {}
}

/* ============================================================
   2) LA BODEGA (conservas y fermentos, maduración lunar)
   ============================================================ */
function bodegaCalc(fechaElab, tipo) {
  var t = BODEGA_TIPOS[tipo] || { mad: 1, cad: 12 };
  var lista = addDaysKey(fechaElab, t.mad * 28);
  var caduca = addDaysKey(fechaElab, Math.round(t.cad * 30.44));
  var l1 = lunaDeFecha(fechaElab), l2 = lunaDeFecha(lista);
  return { lista: lista, caduca: caduca, frase: 'Fermentado en Luna ' + (l1 ? l1.luna : '?') + ', listo para abrir en Luna ' + (l2 ? l2.luna : '?') + ' (' + lista + ')' };
}
function getBodega() { var a = store('bodega', []); return Array.isArray(a) ? a : []; }
function renderBodega() {
  var box = $('bodegaList'); if (!box) return;
  var data = getBodega();
  var hoy = todayKey();
  if (!data.length) { box.innerHTML = '<p class="muted">Bodega vacía. Registra tu primer frasco arriba.</p>'; $('bodegaStats').textContent = '0 frascos'; return; }
  var s = data.slice().sort(function (a, b) { return a.elab.localeCompare(b.elab); });
  box.innerHTML = s.map(function (r) {
    var c = bodegaCalc(r.elab, r.tipo);
    var estado = hoy < c.lista ? '⏳ Madurando' : (hoy <= c.caduca ? '✅ Listo' : '⚠️ Revisar caducidad');
    var color = hoy < c.lista ? '#e8c56a' : (hoy <= c.caduca ? '#8fd694' : '#e76e8a');
    return '<div class="habit-item"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span><b>🍯 ' + esc(r.producto) + '</b> <span class="chip" style="font-size:10px">' + esc(r.tipo) + '</span></span><span class="chip" style="font-size:11px;border-color:' + color + '55;color:' + color + '">' + estado + '</span></div>' +
      '<div class="muted" style="font-size:11px;margin-top:4px">' + esc(r.cant) + ' · elab. ' + r.elab + ' (' + esc(lunaTxt(r.elab)) + ')<br>🌙 ' + esc(c.frase) + '<br>📅 Caduca aprox: ' + c.caduca + (r.nota ? '<br>📝 ' + esc(r.nota) : '') + '</div>' +
      '<div style="display:flex;gap:6px;margin-top:6px"><button class="btn" style="width:auto;font-size:11px" data-open="' + r.id + '">✅ Abrir / consumir</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('');
  var listos = s.filter(function (r) { var c = bodegaCalc(r.elab, r.tipo); return hoy >= c.lista && hoy <= c.caduca; }).length;
  $('bodegaStats').textContent = data.length + ' frascos · ' + listos + ' listos para abrir';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Eliminar frasco?')) return; var d = getBodega(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderBodega(); }; });
  box.querySelectorAll('[data-open]').forEach(function (b) { b.onclick = function () { var d = getBodega(); var r = d.find(function (x) { return x.id === b.getAttribute('data-open'); }); if (!r) return; r.nota = ((r.nota ? r.nota + ' | ' : '') + 'Abierto ' + hoy); save('Guardado OK'); renderBodega(); }; });
}
function setupBodega() {
  var opts = Object.keys(BODEGA_TIPOS).map(function (k) { return '<option>' + k + '</option>'; }).join('');
  makeDialog('bodegaDialog', '🍯 La Bodega · conservas y fermentos',
    'Cuando hay cosecha abundante, se envasa. Cada frasco calcula su <b>maduración óptima en lunas</b> y su caducidad estimada.',
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Nuevo frasco</h4>' +
    '<div class="conv-row"><label style="flex:2">Producto <input type="text" id="bodProd" placeholder="ej: Mermelada de mora" maxlength="40"></label><label>Tipo <select id="bodTipo">' + opts + '</select></label></div>' +
    '<div class="conv-row"><label>Cantidad <input type="text" id="bodCant" placeholder="ej: 3 frascos 500ml" maxlength="30"></label><label>Elaboración <input type="date" id="bodFecha"></label></div>' +
    '<label>Notas <input type="text" id="bodNota" placeholder="azúcar, sal %, lote..." maxlength="80"></label>' +
    '<div id="bodPreview" class="chip" style="display:block;white-space:normal;margin:6px 0"></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="bodAdd" class="btn btn-accent" style="width:auto">+ Envasar</button></div></div>' +
    '<div id="bodegaList" class="habits-list" style="margin-top:10px;max-height:300px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="bodegaStats" class="muted" style="font-size:11px"></span><button type="button" id="bodShare" class="btn" style="width:auto">📤 Compartir</button></div>');
  var paint = function () {
    var f = $('bodFecha').value || todayKey(), t = $('bodTipo').value;
    var c = bodegaCalc(f, t);
    $('bodPreview').innerHTML = '🌙 <b>' + esc(c.frase) + '</b><br><span class="muted">Caduca aprox: ' + c.caduca + ' · ' + esc((BODEGA_TIPOS[t] || {}).nota || '') + '</span>';
  };
  var b = $('btnBodega'); if (b) b.onclick = function () { if (!$('bodFecha').value) $('bodFecha').value = todayKey(); paint(); renderBodega(); openDlg('bodegaDialog'); };
  $('bodTipo').onchange = paint; $('bodFecha').onchange = paint;
  $('bodAdd').onclick = function () {
    var p = clean($('bodProd').value, 40); if (!p) return alert('Nombra el producto');
    getBodega().push({ id: uid('bo'), producto: p, tipo: $('bodTipo').value, cant: clean($('bodCant').value, 30) || '1 frasco', elab: $('bodFecha').value || todayKey(), nota: clean($('bodNota').value, 80) });
    save(); $('bodProd').value = ''; $('bodCant').value = ''; $('bodNota').value = ''; renderBodega();
  };
  $('bodShare').onclick = function () { var d = getBodega(); if (!d.length) return alert('Bodega vacía'); share('🍯 Mi Bodega', d.map(function (r) { var c = bodegaCalc(r.elab, r.tipo); return '· ' + r.producto + ' (' + r.tipo + ') — ' + c.frase; }).join('\n')); };
}

/* ============================================================
   3) TRAFKINTU (fusionado: dentro de Mis Semillas de Siembra Lunar)
   El boton #btnTrafkintu y el dialogo #trafDialog se eliminan.
   Los datos viejos se migran una vez a semillasInv (con respaldo
   en trafkintuBackup) y la red de intercambios vive como bloque
   "Trafkintu" dentro de la pestana Mis Semillas. El formulario de
   Mis Semillas se extiende con gramos / ano / germinacion / origen.
   ============================================================ */
function getTraf() { var a = store('trafkintu', []); return Array.isArray(a) ? a : []; }
function migrateTrafToSemillas() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return;
    if (u.trafMigrado) return;
    var t = Array.isArray(u.trafkintu) ? u.trafkintu : [];
    if (!t.length) { u.trafMigrado = true; return; }
    if (!Array.isArray(u.semillasInv)) u.semillasInv = [];
    t.forEach(function (r) {
      var name = String((r && r.nombre) || '').trim();
      if (!name) return;
      var parts = [];
      if (r.gramos) parts.push(r.gramos + ' g');
      if (r.anio) parts.push('cosecha ' + r.anio);
      if (r.germ !== undefined && r.germ !== null && r.germ !== '' && r.germ !== '?') parts.push('germ ~' + r.germ + '%');
      if (r.origen) parts.push('origen: ' + r.origen);
      if (r.nota) parts.push(r.nota);
      var found = null;
      for (var i = 0; i < u.semillasInv.length; i++) {
        if (String(u.semillasInv[i].name || '').toLowerCase() === name.toLowerCase()) { found = u.semillasInv[i]; break; }
      }
      if (found) {
        if (parts.length && !found.note) found.note = parts.join(' · ').slice(0, 80);
        if (r.red && r.red.length) found.red = (found.red || []).concat(r.red);
        found.trafkintu = true;
      } else {
        u.semillasInv.push({ name: name.slice(0, 40), qty: 1, harvest: '', note: parts.join(' · ').slice(0, 80), red: r.red || [], trafkintu: true });
      }
    });
    u.trafkintuBackup = t;
    u.trafkintu = [];
    u.trafMigrado = true;
    save('Semillas unificadas 🌱');
  } catch (e) {}
}
function getSemillasInv() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return [];
    if (!Array.isArray(u.semillasInv)) u.semillasInv = [];
    return u.semillasInv;
  } catch (e) { return []; }
}
function renderTrafRed() {
  var box = $('trafRedList'); if (!box) return;
  var arr = getSemillasInv();
  if (!arr.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin variedades aún. Agrega tu primera semilla arriba y luego registra aquí tus intercambios.</p>'; return; }
  box.innerHTML = arr.map(function (e, i) {
    var red = (e.red || []).map(function (x) { return esc(x.quien) + ' (' + esc(x.detalle) + (x.fecha ? ' · ' + x.fecha : '') + ')'; }).join(' · ');
    return '<div class="habit-item"><span><b>🌰 ' + esc(e.name) + '</b>' +
      (red ? '<br><span style="font-size:11px;color:var(--gold)">🤝 ' + red + '</span>' : '<br><span class="muted" style="font-size:11px">Sin intercambios registrados</span>') + '</span>' +
      '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><button type="button" class="btn" style="width:auto;font-size:11px" data-trafgift="' + i + '">🤝 Registrar trafkintu</button></div>' +
      '<div class="hidden" data-trafform="' + i + '" style="margin-top:8px;background:var(--panel);border:1px dashed var(--gold);border-radius:8px;padding:8px">' +
      '<div class="conv-row"><label>¿Con quién? <input type="text" data-trafquien="' + i + '" placeholder="ej: vecina Juanita" maxlength="30"></label></div>' +
      '<label>Detalle <input type="text" data-trafdet="' + i + '" placeholder="ej: regalé 20 g, me dio porotos" maxlength="40"></label>' +
      '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><button type="button" class="btn btn-accent" style="width:auto;font-size:11px" data-trafsave="' + i + '">✓ Guardar</button><button type="button" class="btn" style="width:auto;font-size:11px" data-trafcancel="' + i + '">Cancelar</button></div></div></div>';
  }).join('');
  box.querySelectorAll('[data-trafgift]').forEach(function (b) {
    b.onclick = function () {
      var i = b.getAttribute('data-trafgift');
      var f = box.querySelector('[data-trafform="' + i + '"]');
      if (f) { f.classList.toggle('hidden'); var q = f.querySelector('[data-trafquien]'); if (q && !f.classList.contains('hidden')) q.focus(); }
    };
  });
  box.querySelectorAll('[data-trafcancel]').forEach(function (b) {
    b.onclick = function () {
      var f = box.querySelector('[data-trafform="' + b.getAttribute('data-trafcancel') + '"]');
      if (f) f.classList.add('hidden');
    };
  });
  box.querySelectorAll('[data-trafsave]').forEach(function (b) {
    b.onclick = function () {
      var i = parseInt(b.getAttribute('data-trafsave'), 10);
      var arr2 = getSemillasInv();
      var r = arr2[isNaN(i) ? -1 : i];
      if (!r) return;
      var qEl = box.querySelector('[data-trafquien="' + i + '"]');
      var dEl = box.querySelector('[data-trafdet="' + i + '"]');
      var quien = clean((qEl || {}).value || '', 30);
      if (!quien) { alert('Escribe con quién fue el intercambio'); if (qEl) qEl.focus(); return; }
      var det = clean((dEl || {}).value || '', 40) || 'intercambio';
      r.red = r.red || [];
      r.red.push({ quien: quien, detalle: det, fecha: todayKey() });
      save('Trafkintu registrado 🤝');
      try { renderSiembraSemillas(); } catch (e) { renderTrafRed(); }
    };
  });
}
function extendSemillasForm() {
  if ($('semInvGramosRow')) return;
  var noteInput = $('semInvNote');
  if (!noteInput) return;
  var row = noteInput.closest('.conv-row');
  if (!row || !row.parentNode) return;
  var div = document.createElement('div');
  div.className = 'conv-row';
  div.id = 'semInvGramosRow';
  div.style.marginTop = '6px';
  div.innerHTML = '<label>⚖️ Gramos <input type="number" id="semInvGramos" min="0" step="1" placeholder="50"></label>' +
    '<label>📅 Año cosecha <input type="number" id="semInvAnio" min="2000" max="2100" placeholder="2026"></label>' +
    '<label>🌱 Germ % <input type="number" id="semInvGerm" min="0" max="100" placeholder="85"></label>' +
    '<label>Origen <input type="text" id="semInvOrigen" placeholder="propia / vecina" maxlength="20"></label>';
  row.parentNode.insertBefore(div, row.nextSibling);
  var add = $('semInvAdd');
  if (add && !add.dataset.trafWrapped) {
    add.dataset.trafWrapped = '1';
    var prev = add.onclick;
    add.onclick = function (ev) {
      try {
        var parts = [];
        var g = ($('semInvGramos') || {}).value || '';
        var a = ($('semInvAnio') || {}).value || '';
        var ge = ($('semInvGerm') || {}).value || '';
        var o = clean((($('semInvOrigen') || {}).value || ''), 20);
        if (g) parts.push(g + ' g');
        if (a) parts.push('cosecha ' + a);
        if (ge !== '') parts.push('germ ~' + ge + '%');
        if (o) parts.push('origen: ' + o);
        if (parts.length && noteInput && !noteInput.value.trim()) noteInput.value = parts.join(' · ').slice(0, 30);
        else if (parts.length && noteInput) noteInput.value = (noteInput.value + ' · ' + parts.join(' · ')).slice(0, 30);
      } catch (e) {}
      try { if (typeof prev === 'function') prev.call(add, ev); } catch (e) {}
      try {
        var arr = getSemillasInv();
        var nm = '';
        try { nm = (($('semInvName') || {}).value || '').trim().toLowerCase(); } catch (e2) {}
        for (var i = 0; i < arr.length; i++) {
          if (String(arr[i].name || '').toLowerCase() === nm) {
            var gg = ($('semInvGramos') || {}).value || '';
            var aa = ($('semInvAnio') || {}).value || '';
            var geg = ($('semInvGerm') || {}).value || '';
            var oo = '';
            try { oo = clean((($('semInvOrigen') || {}).value || ''), 20); } catch (e3) {}
            if (gg || aa || geg || oo) arr[i].trafkintu = true;
            break;
          }
        }
        ['semInvGramos', 'semInvAnio', 'semInvGerm', 'semInvOrigen'].forEach(function (id) { var el = $(id); if (el) el.value = ''; });
      } catch (e) {}
      try { renderTrafRed(); } catch (e) {}
    };
  }
}
function paintTrafkintuBlock() {
  var box = $('siembraSemillasBox'); if (!box) return;
  try { extendSemillasForm(); } catch (e) {}
  var blk = $('trafFusionBlock');
  if (!blk) {
    blk = document.createElement('div');
    blk.id = 'trafFusionBlock';
    blk.className = 'menstrual-card';
    blk.style.cssText = 'margin-top:10px;border-style:dashed;border-color:var(--gold)';
    blk.innerHTML = '<h4 style="color:var(--gold)">🤝 Trafkintu · red de intercambio</h4>' +
      '<p class="muted" style="font-size:11px">El trafkintu mapuche es intercambio de semillas y saberes entre familias y vecinos: <b>regala, recibe y devuelve</b>. Tus variedades de arriba y las migradas del antiguo Trafkintu viven aquí mismo. Registra con quién intercambiaste cada variedad.</p>' +
      '<div id="trafRedList" class="habits-list" style="margin-top:8px;max-height:240px"></div>';
    box.appendChild(blk);
  }
  try { renderTrafRed(); } catch (e) {}
}
function setupTrafFusion() {
  try { cleanupTrafSeparado(); } catch (e) {}
  try { migrateTrafToSemillas(); } catch (e) {}
  try {
    var btn = $('btnSiembra');
    if (btn && btn.dataset && btn.dataset.keywords && btn.dataset.keywords.indexOf('trafkintu') < 0) btn.dataset.keywords += ' trafkintu intercambio regalo banco origen germinacion';
  } catch (e) {}
  if (typeof renderSiembraSemillas === 'function' && !window._trafFusionWrapped) {
    window._trafFusionWrapped = true;
    var origSem = renderSiembraSemillas;
    renderSiembraSemillas = function () {
      try { migrateTrafToSemillas(); } catch (e) {}
      var r = origSem();
      try { paintTrafkintuBlock(); } catch (e) {}
      return r;
    };
  }
}

/* ============================================================
   4) AGUA — lluvia, estanque, riego, casa, calidad y emergencia
   Penco: cortes ESSBIO, pozos y lluvia Pukem + sequía Walüng.
   Todo local y privado por usuario.
   ============================================================ */
var AGUA_RIEGO_GUIA = [
  { n: 'Horario pencono', ico: '🌅', txt: 'Verano (Walüng): riega 06–09h profundo, nunca de noche encharcado (babosas y hongos). Invierno (Pukem): solo si pasan 7 días sin lluvia. Con viento sur fuerte no riegues por aspersión: se evapora la mitad.' },
  { n: 'Cuánto por cultivo', ico: '🥬', txt: 'Hoja (lechuga, acelga): 4–6 L/m²/día en verano, 2–3 en primavera. Tomate/zapallo con fruto: 6–8 L/planta/día en Walüng con mulch. Hierbas y nativo establecido: 1–2 riegos/semana. Maceta al sol: revisa con dedo a 3 cm, si sale seco riega.' },
  { n: 'Mulch: 1 riego de cada 3 ahorrado', ico: '🍂', txt: 'Capa 5–7 cm de paja, hojas de boldo, viruta o cartón picado. Baja evaporación, frena maleza y alimenta lombriz. No pegues el mulch al tallo (pudre): deja 3 cm libres.' },
  { n: 'Goteo casero', ico: '💧', txt: 'Botella 2 L enterrada con 2 hoyitos = 1 día para 1 tomate. Línea con goteros 2–4 L/h, 30–60 min en verano. Un tambor en altura (1 m) da presión para 10 m de cinta sin bomba.' },
  { n: 'Riego y luna', ico: '🌙', txt: 'Creciente–llena: la savia sube, almácigos y trasplantes piden agua pareja. Menguante: riega menos, es tiempo de podar, desmalezar y limpiar estanques. Nueva: revisa canales y repara fugas.' },
  { n: 'Suelo Penco', ico: '🪱', txt: 'Arcilla de Penco se encharca: riega menos veces pero profundo + compost para drenar. Arena de Lirquén–Playa Negra se seca: riega más seguido + mulch grueso. Prueba del puño: bola que se desarma = punto justo.' }
];
var AGUA_CASA_TIPS = [
  { n: 'Ducha', ico: '🚿', txt: 'Ducha 5 min ≈ 45 L (con cabezal eficiente 9 L/min). Cierra mientras enjabonas: ahorras 20 L. Un balde en la ducha junta 8–10 L para el WC o riego.' },
  { n: 'WC', ico: '🚽', txt: 'Estanque clásico 10–12 L por descarga. Botella de 1 L dentro del estanque ahorra 1 L por descarga sin perder fuerza. Doble descarga o descarga corta cuando se pueda.' },
  { n: 'Lavadora y loza', ico: '👕', txt: 'Carga llena: 50–70 L por lavado. Reutiliza el agua del enjuague para patio (sin cloro fuerte). Lava loza con tina, no con chorro: 40 L vs 80 L.' },
  { n: 'Fugas: el enemigo invisible', ico: '🔍', txt: 'Goteo 1 gota/seg = 2.500 L/mes. Revisa: medidor girando con todo cerrado = fuga. Estanque WC con colorante: si tiñe la taza sin descargar, cambia el flotador ($3 mil).' },
  { n: 'Aguas grises', ico: '♻️', txt: 'Ducha + lavamanos + lavadora (sin cloro ni pañales) sirven para frutales y ornamentales con filtro de malla + trampa de grasa. NO a hortalizas de hoja cruda ni a pozos. Jabón popeye/biodegradable sí, suavizante no.' },
  { n: 'Meta familiar', ico: '🎯', txt: 'Chile urbano ≈ 130–170 L/persona/día. Meta Penco resiliente: 80–100 L/persona/día sin sufrir. 4 personas × 90 L = 360 L/día = 10.800 L/mes.' }
];
var AGUA_CALIDAD_GUIA = [
  { n: '¿Es segura mi agua?', ico: '🔬', txt: 'Clara + sin olor + pH 6.5–8.5 = buen indicio (no garantía). Turbia, color té, olor a huevo podrido o sabor metálico = no tomar sin tratar. Pozo nuevo o tras temporal: hervir o clorar 1 semana.' },
  { n: 'Hervir (lo más seguro)', ico: '♨️', txt: 'Ebullición franca 3 min (Penco está a nivel del mar: 1 min basta, 3 min da margen). Guarda en bidón limpio tapado máx 3 días. Para guaguas y enfermos: siempre hervida.' },
  { n: 'Cloración de emergencia', ico: '🧪', txt: 'Cloro doméstico SIN aroma (4–6%): 2 gotas por litro de agua clara, 4 si está turbia (filtrar primero con paño). Agita, espera 30 min. Debe oler leve a cloro; si no, repite dosis. 1 tapa (≈5 ml) por 20 L aprox.' },
  { n: 'Filtro casero + sol (SODIS)', ico: '☀️', txt: 'Filtra con paño → botella PET clara 2 L al sol 6 h (2 días si nublado). Mata virus y bacterias, no químicos. Primer agua del techo tras sequía: descarta (first flush 20 L con desviador o balde).' },
  { n: 'Estanque sano', ico: '🛢️', txt: 'Tapa oscura siempre (sin luz = sin algas). Limpieza 2×/año (Menguante Pukem): vacía, escobilla con cloro 100 ml/10 L, enjuaga. Malla en entrada + rebalse con trampa de bichos.' }
];
function getAguaCfg() {
  var d = { cap: 1000, nivel: 500, consumo: 60, techo: 40, personas: 4, meta: 100, riegoM2: 10 };
  var o = store('aguaCfg', d);
  if (typeof o !== 'object' || !o) return { cap: 1000, nivel: 500, consumo: 60, techo: 40, personas: 4, meta: 100, riegoM2: 10 };
  ['cap', 'nivel', 'consumo', 'techo', 'personas', 'meta', 'riegoM2'].forEach(function (k) { if (typeof o[k] !== 'number') o[k] = d[k]; });
  return o;
}
function getLluvia() { var a = store('lluviaLog', []); return Array.isArray(a) ? a : []; }
function getRios() { var a = store('riosLog', []); return Array.isArray(a) ? a : []; }
function getAguaRiego() { var a = store('aguaRiegoLog', []); return Array.isArray(a) ? a : []; }
function getAguaCasa() { var a = store('aguaCasaLog', []); return Array.isArray(a) ? a : []; }
function getAguaCal() { var a = store('aguaCalLog', []); return Array.isArray(a) ? a : []; }
function aguaCosechaL(mm, m2) { return Math.round((parseFloat(mm) || 0) * (parseFloat(m2) || 0) * 0.8); }
function aguaMesMM(list, ym) { return list.filter(function (r) { return (r.fecha || '').slice(0, 7) === ym; }).reduce(function (a, r) { return a + (parseFloat(r.mm) || 0); }, 0); }
function switchAguaTab(t) {
  [['Hoy', 'aguaHoyPanel'], ['Estanque', 'aguaEstPanel'], ['Lluvia', 'aguaLluPanel'], ['Riego', 'aguaRiePanel'], ['Casa', 'aguaCasaPanel'], ['Calidad', 'aguaCalPanel']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $('tabAgua' + x[0]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
}
function renderAguaHoy() {
  var box = $('aguaHoyBox'); if (!box) return;
  var cfg = getAguaCfg(), data = getLluvia();
  var ym = todayKey().slice(0, 7);
  var mesMM = aguaMesMM(data, ym);
  var anioMM = data.filter(function (r) { return (r.fecha || '').slice(0, 4) === ym.slice(0, 4); }).reduce(function (a, r) { return a + (parseFloat(r.mm) || 0); }, 0);
  var dias = cfg.consumo > 0 ? Math.floor(cfg.nivel / cfg.consumo) : 0;
  var pct = cfg.cap > 0 ? Math.min(100, Math.round(cfg.nivel / cfg.cap * 100)) : 0;
  var cosechaMes = aguaCosechaL(mesMM, cfg.techo);
  var l = null; try { l = lunaDeFecha(todayKey()); } catch (e) {}
  var consejoLuna = !l ? 'Mide tu estanque 1 vez por semana.' : l.luna <= 3 ? 'Pukem: limpia canaletas y estanque en menguante. Cada 10 mm sobre tu techo de ' + cfg.techo + ' m² ≈ ' + aguaCosechaL(10, cfg.techo) + ' L cosechables.' : l.luna <= 6 ? 'Pewü: riega almácigos parejo en creciente. Revisa goteros antes del calor.' : l.luna <= 9 ? 'Walüng: sombrea el estanque y riega 06–09h. Si tu autonomía < 7 días, prioriza goteo + mulch.' : 'Rimü: últimas lluvias para llenar. Repara fugas y guarda agua para el verano.';
  var alerta = dias < 3 ? '<p style="font-size:12px;color:#ff9a9a">🔴 Reserva crítica (' + dias + ' días): solo consumo humano + animales. Corta riego ornamental.</p>'
    : dias < 7 ? '<p style="font-size:12px;color:#e8c56a">🟡 Reserva baja (' + dias + ' días): goteo + reutiliza ducha/WC. Revisa fugas hoy.</p>'
    : '<p style="font-size:12px;color:#8fd694">🟢 Reserva sana: ' + dias + ' días de autonomía.</p>';
  box.innerHTML = '<h4>💧 Hoy · ' + pct + '% (' + cfg.nivel + ' / ' + cfg.cap + ' L)</h4>' +
    '<div class="astro-bar" style="height:10px;margin:6px 0"><i style="width:' + pct + '%"></i></div>' +
    '<p class="muted" style="font-size:12px">🚰 Consumo ~' + cfg.consumo + ' L/día → <b>' + dias + ' días</b> · 🌧️ Este mes <b>' + mesMM.toFixed(1) + ' mm</b> (≈' + cosechaMes + ' L en tu techo) · Año <b>' + anioMM.toFixed(1) + ' mm</b></p>' +
    '<p class="muted" style="font-size:12px">🌙 ' + esc(lunaTxt(todayKey()) || 'Luna actual') + ' — ' + esc(consejoLuna) + '</p>' + alerta;
}
function renderRios() {
  var box = $('riosList'); if (!box) return;
  var data = getRios().slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 40);
  if (!data.length) { box.innerHTML = '<p class="muted">Sin mediciones. Registra tu primera medición del estero/río.</p>'; return; }
  box.innerHTML = data.map(function (r) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span>🌊 <b>' + esc(r.rio) + '</b> · ' + esc(r.fecha || '') +
      ' · nivel ' + esc(r.nivel) + ' cm' + (r.ph ? ' · pH ' + esc(r.ph) : '') + (r.turb ? ' · ' + esc(r.turb) : '') + (r.nota ? ' <span class="muted">· ' + esc(r.nota) + '</span>' : '') +
      '</span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var d = getRios(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderRios(); }; });
}
function renderAgua() {
  try { renderAguaHoy(); } catch (e) {}
  // --- Lluvia: lista + resumen 6 meses ---
  try {
    var data = getLluvia();
    var box = $('lluviaList');
    if (box) {
      if (!data.length) box.innerHTML = '<p class="muted">Sin lluvias registradas.</p>';
      else box.innerHTML = data.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 40).map(function (r) {
        var lit = r.techo ? ' → ~' + aguaCosechaL(r.mm, r.techo) + ' L' : '';
        return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span>🌧️ <b>' + esc(String(r.mm)) + ' mm</b> · ' + esc(r.fecha || '') + lit + (r.nota ? ' <span class="muted">· ' + esc(r.nota) + '</span>' : '') + '</span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
      }).join('');
      box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var d = getLluvia(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderAgua(); }; });
    }
    var st = $('lluviaStats');
    if (st) {
      var out = [], d0 = new Date(todayKey() + 'T12:00:00');
      for (var i = 5; i >= 0; i--) {
        var dd = new Date(d0); dd.setMonth(dd.getMonth() - i);
        var ym = dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0');
        out.push(ym.slice(5) + ': <b>' + aguaMesMM(data, ym).toFixed(0) + ' mm</b>');
      }
      var totAnio = data.filter(function (r) { return (r.fecha || '').slice(0, 4) === todayKey().slice(0, 4); }).reduce(function (a, r) { return a + (parseFloat(r.mm) || 0); }, 0);
      st.innerHTML = 'Últimos 6 meses — ' + out.join(' · ') + '<br>Total ' + todayKey().slice(0, 4) + ': <b>' + totAnio.toFixed(1) + ' mm</b> en ' + data.length + ' registros. Penco: ~1.000–1.300 mm/año, 80% en Pukem (may–ago).';
    }
  } catch (e) {}
  try { renderRios(); } catch (e) {}
  try { renderAguaRiego(); } catch (e) {}
  try { renderAguaCasa(); } catch (e) {}
  try { renderAguaCal(); } catch (e) {}
}
function renderAguaRiego() {
  var box = $('riegoList'); if (!box) return;
  var data = getAguaRiego().slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 30);
  var tot7 = getAguaRiego().filter(function (r) {
    try { return (Date.now() - new Date(r.fecha + 'T12:00:00').getTime()) < 7 * 864e5; } catch (e) { return false; }
  }).reduce(function (a, r) { return a + (parseFloat(r.litros) || 0); }, 0);
  var st = $('riegoStats');
  if (st) st.textContent = data.length + ' riegos · ~' + Math.round(tot7) + ' L últimos 7 días' + (tot7 > 500 ? ' — revisa mulch/goteo si sube en Walüng' : '');
  if (!data.length) { box.innerHTML = '<p class="muted">Sin riegos anotados. Registra el primero arriba.</p>'; return; }
  box.innerHTML = data.map(function (r) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span>💧 <b>' + esc(String(r.litros || '?')) + ' L</b> · ' + esc(r.fecha || '') + ' · ' + esc(r.sector || 'huerta') + ' <span class="muted">· ' + esc(r.sistema || '') + (r.nota ? ' · ' + esc(r.nota) : '') + '</span></span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var d = getAguaRiego(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderAguaRiego(); try { renderAguaHoy(); } catch (e) {} }; });
}
function renderAguaCasa() {
  var box = $('casaList'); if (!box) return;
  var data = getAguaCasa().slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  var st = $('casaStats');
  var cfg = getAguaCfg();
  if (data.length >= 2) {
    var a = data[data.length - 2], b = data[data.length - 1];
    try {
      var d1 = new Date(a.fecha + 'T12:00:00').getTime(), d2 = new Date(b.fecha + 'T12:00:00').getTime();
      var dias = Math.max(1, Math.round((d2 - d1) / 864e5));
      var m3 = (parseFloat(b.m3) || 0) - (parseFloat(a.m3) || 0);
      var lpd = m3 > 0 ? Math.round(m3 * 1000 / dias / (cfg.personas || 1)) : 0;
      if (st) st.innerHTML = 'Entre ' + esc(a.fecha) + ' y ' + esc(b.fecha) + ': <b>' + Math.round(m3 * 1000) + ' L</b> en ' + dias + ' días → <b>' + lpd + ' L/persona/día</b> (meta ' + cfg.meta + ')' + (lpd > cfg.meta ? ' ⚠️ sobre la meta: revisa fugas y ducha.' : ' ✓ dentro de la meta.');
    } catch (e) { if (st) st.textContent = data.length + ' lecturas.'; }
  } else if (st) st.textContent = data.length ? '1 lectura: agrega una segunda para calcular L/persona/día.' : 'Sin lecturas. Anota tu medidor 1 vez por semana.';
  if (!data.length) { box.innerHTML = '<p class="muted">Sin lecturas de medidor.</p>'; return; }
  box.innerHTML = data.slice(-12).reverse().map(function (r) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span>🧾 <b>' + esc(String(r.m3)) + ' m³</b> · ' + esc(r.fecha || '') + (r.nota ? ' <span class="muted">· ' + esc(r.nota) + '</span>' : '') + '</span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var d = getAguaCasa(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderAguaCasa(); }; });
}
function renderAguaCal() {
  var box = $('calList'); if (!box) return;
  var data = getAguaCal().slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 30);
  var st = $('calStats');
  if (st) {
    var malas = data.filter(function (r) { var ph = parseFloat(r.ph); return (r.turb && /turbia|muy turbia/i.test(r.turb)) || (!isNaN(ph) && (ph < 6.5 || ph > 8.5)); }).length;
    st.textContent = data.length ? (data.length + ' controles' + (malas ? ' · ' + malas + ' con turbidez/pH fuera de rango ⚠️' : ' · todos en rango ✓')) : 'Sin controles. Parte con 1 por origen (pozo, estanque, río).';
  }
  if (!data.length) { box.innerHTML = '<p class="muted">Sin controles de calidad.</p>'; return; }
  box.innerHTML = data.map(function (r) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span>🔬 <b>' + esc(r.origen || 'agua') + '</b> · ' + esc(r.fecha || '') + (r.ph ? ' · pH ' + esc(r.ph) : '') + (r.turb ? ' · ' + esc(r.turb) : '') + (r.cloro ? ' · cloro ' + esc(r.cloro) : '') + (r.nota ? ' <span class="muted">· ' + esc(r.nota) + '</span>' : '') + '</span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var d = getAguaCal(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderAguaCal(); }; });
}
function paintAguaGuias() {
  var b1 = $('aguaRiegoGuia');
  if (b1 && !b1.dataset.done) {
    b1.dataset.done = '1';
    b1.innerHTML = AGUA_RIEGO_GUIA.map(function (g) {
      return '<div class="si-card"><h4>' + g.ico + ' ' + esc(g.n) + '</h4><p>' + esc(g.txt) + '</p></div>';
    }).join('');
  }
  var b2 = $('aguaCasaGuia');
  if (b2 && !b2.dataset.done) {
    b2.dataset.done = '1';
    b2.innerHTML = AGUA_CASA_TIPS.map(function (g) {
      return '<div class="si-card"><h4>' + g.ico + ' ' + esc(g.n) + '</h4><p>' + esc(g.txt) + '</p></div>';
    }).join('');
  }
  var b3 = $('aguaCalGuia');
  if (b3 && !b3.dataset.done) {
    b3.dataset.done = '1';
    b3.innerHTML = AGUA_CALIDAD_GUIA.map(function (g) {
      return '<div class="si-card"><h4>' + g.ico + ' ' + esc(g.n) + '</h4><p>' + esc(g.txt) + '</p></div>';
    }).join('');
  }
}
function setupAgua() {
  makeDialog('aguaDialog', '💧 Agua · estanque, lluvia, riego y casa',
    'Para Penco con cortes, pozo o lluvia: reserva, cosecha del techo, riego de huerta, ahorro en casa y agua segura. Todo <b>privado y local</b>.',
    '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
    '<button type="button" id="tabAguaHoy" class="btn btn-accent" style="width:auto">🌙 Hoy</button>' +
    '<button type="button" id="tabAguaEstanque" class="btn" style="width:auto">🛢️ Estanque</button>' +
    '<button type="button" id="tabAguaLluvia" class="btn" style="width:auto">🌧️ Lluvia</button>' +
    '<button type="button" id="tabAguaRiego" class="btn" style="width:auto">💧 Riego</button>' +
    '<button type="button" id="tabAguaCasa" class="btn" style="width:auto">🏠 Casa</button>' +
    '<button type="button" id="tabAguaCalidad" class="btn" style="width:auto">🔬 Calidad y Ríos</button></div>' +
    '<div id="aguaHoyPanel"><div id="aguaHoyBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div class="menstrual-card" style="margin-top:10px;border-color:#e76e8a55"><h4>🚨 Corte de agua — kit 72 h (Penco)</h4>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">Guarda <b>15 L/persona/día × 3 días</b> (toma + cocina + higiene mínima). Familia de 4 = <b>180 L</b> en bidones tapados, rotados cada 6 meses.<br>' +
    '1) Llena ahora botellas + tambor si anuncian corte. 2) WC: balde + agua de riego/lluvia. 3) Avisa a vecinos mayores. 4) Reclamo ESSBIO 600 331 1000 / *3311 · Superintendencia SISS www.siss.cl · Municipalidad Penco 41 226 1033.<br>' +
    '<span style="font-size:11px">Tras el corte: deja correr 2 min antes de tomar (barro en cañería) y hierve 3 min el primer día.</span></p></div>' +
    '<div class="si-card" style="margin-top:10px"><h4>🌊 Penco en 1 minuto</h4><p>Pukem (may–ago) trae 80% de la lluvia: llena y limpia. Walüng (dic–feb) seca pozos y sube cortes: mulch + goteo + aguas grises. 1 mm sobre 1 m² de techo ≈ 1 L; con pérdidas ≈ 0.8 L.</p></div></div>' +
    '<div id="aguaEstPanel" class="hidden"><div class="menstrual-card"><h4>⚙️ Mi estanque y casa</h4>' +
    '<div class="conv-row"><label>Capacidad (L) <input type="number" id="aguaCap" min="0" step="50"></label><label>Nivel actual (L) <input type="number" id="aguaNivel" min="0" step="10"></label><label>Consumo día (L) <input type="number" id="aguaCons" min="0" step="5"></label></div>' +
    '<div class="conv-row"><label>m² techo <input type="number" id="aguaTecho" min="0" step="1"></label><label>Personas <input type="number" id="aguaPers" min="1" max="20" step="1"></label><label>Meta L/pers/día <input type="number" id="aguaMeta" min="20" max="300" step="5"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="aguaSave" class="btn btn-accent" style="width:auto">💾 Guardar</button></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🧮 Cosecha del techo</h4><div class="conv-row"><label>Lluvia (mm) <input type="number" id="cosMm" min="0" step="0.5" placeholder="ej: 20"></label><label>Techo (m²) <input type="number" id="cosTecho" min="0" step="1" placeholder="40"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="cosCalc" class="btn" style="width:auto">Calcular</button></div>' +
    '<div id="cosOut" class="chip" style="margin-top:6px;display:block;white-space:normal">—</div>' +
    '<p class="muted" style="font-size:10px">Fórmula: mm × m² × 0.8 (20% pérdidas en canaleta/first flush). Ej: 20 mm × 40 m² ≈ 640 L.</p></div></div>' +
    '<div id="aguaLluPanel" class="hidden"><div class="menstrual-card"><h4>🌧️ Registrar lluvia</h4><div class="conv-row"><label>Fecha <input type="date" id="lluFecha"></label><label>mm <input type="number" id="lluMm" min="0" step="0.5" placeholder="ej: 12.5"></label><label>m² techo (opcional) <input type="number" id="lluTecho" min="0" step="1" placeholder="40"></label></div>' +
    '<label>Nota <input type="text" id="lluNota" placeholder="temporal sur, granizo..." maxlength="60"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="lluAdd" class="btn btn-accent" style="width:auto">+ Guardar lluvia</button><button type="button" id="lluShare" class="btn" style="width:auto">📤 Compartir</button><button type="button" id="lluClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></div>' +
    '<div id="lluviaStats" class="chip" style="margin-top:8px;display:block;white-space:normal"></div>' +
    '<div id="lluviaList" class="habits-list" style="margin-top:10px;max-height:220px"></div></div></div>' +
    '<div id="aguaRiePanel" class="hidden"><div class="menstrual-card"><h4>💧 Registrar riego</h4><div class="conv-row"><label>Fecha <input type="date" id="rieFecha"></label><label>Litros <input type="number" id="rieLitros" min="0" step="1" placeholder="ej: 40"></label><label>Sector <input type="text" id="rieSector" placeholder="bancal 1 / tomates" maxlength="30"></label></div>' +
    '<div class="conv-row"><label>Sistema <select id="rieSis"><option>Goteo</option><option>Manguera / regadera</option><option>Botella enterrada</option><option>Aspersión</option><option>Surco</option></select></label><label>Nota <input type="text" id="rieNota" placeholder="mulch, 06:30, viento sur..." maxlength="60"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="rieAdd" class="btn btn-accent" style="width:auto">+ Guardar riego</button><button type="button" id="rieShare" class="btn" style="width:auto">📤 Compartir</button></div>' +
    '<div id="riegoStats" class="chip" style="margin-top:8px;display:block;white-space:normal"></div>' +
    '<div id="riegoList" class="habits-list" style="margin-top:10px;max-height:220px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🧮 ¿Cuánto regar hoy?</h4><div class="conv-row"><label>m² <input type="number" id="rieM2" min="0" step="1" placeholder="10"></label><label>Temporada <select id="rieTemp"><option value="6">Verano Walüng (6 L/m²)</option><option value="4">Primavera Pewü (4 L/m²)</option><option value="2">Otoño Rimü (2 L/m²)</option><option value="0.5">Invierno Pukem (0.5 L/m²)</option></select></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="rieCalc" class="btn" style="width:auto">Calcular</button></div>' +
    '<div id="rieOut" class="chip" style="margin-top:6px;display:block;white-space:normal">—</div></div>' +
    '<div id="aguaRiegoGuia" style="display:flex;flex-direction:column;gap:8px;margin-top:10px"></div></div>' +
    '<div id="aguaCasaPanel" class="hidden"><div class="menstrual-card"><h4>🧾 Lectura del medidor</h4><div class="conv-row"><label>Fecha <input type="date" id="casaFecha"></label><label>Lectura (m³) <input type="number" id="casaM3" min="0" step="0.1" placeholder="ej: 123.5"></label><label>Nota <input type="text" id="casaNota" placeholder="mensual / semanal" maxlength="40"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="casaAdd" class="btn btn-accent" style="width:auto">+ Guardar lectura</button><button type="button" id="casaShare" class="btn" style="width:auto">📤 Compartir</button><button type="button" id="casaClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></div>' +
    '<div id="casaStats" class="chip" style="margin-top:8px;display:block;white-space:normal"></div>' +
    '<div id="casaList" class="habits-list" style="margin-top:10px;max-height:200px"></div></div>' +
    '<div id="aguaCasaGuia" style="display:flex;flex-direction:column;gap:8px;margin-top:10px"></div></div>' +
    '<div id="aguaCalPanel" class="hidden"><div class="menstrual-card"><h4>🔬 Control de calidad</h4><div class="conv-row"><label>Fecha <input type="date" id="calFecha"></label><label>Origen <select id="calOrigen"><option>Pozo</option><option>Estanque lluvia</option><option>Red ESSBIO</option><option>Estero / río</option><option>Otro</option></select></label></div>' +
    '<div class="conv-row"><label>pH <input type="number" id="calPh" min="0" max="14" step="0.1" placeholder="7.0"></label><label>Aspecto <select id="calTurb"><option>Clara</option><option>Leve turbia</option><option>Turbia</option><option>Muy turbia / color</option></select></label><label>Cloro <select id="calCloro"><option>—</option><option>Sin olor</option><option>Leve olor ✓</option><option>Fuerte olor</option></select></label></div>' +
    '<label>Nota <input type="text" id="calNota" placeholder="tras lluvia, hervida, filtrada..." maxlength="60"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="calAdd" class="btn btn-accent" style="width:auto">+ Guardar control</button></div>' +
    '<div id="calStats" class="chip" style="margin-top:8px;display:block;white-space:normal"></div>' +
    '<div id="calList" class="habits-list" style="margin-top:10px;max-height:200px"></div></div>' +
    '<div id="aguaCalGuia" style="display:flex;flex-direction:column;gap:8px;margin-top:10px"></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌊 Bitácora de ríos y esteros</h4><div class="conv-row"><label>Río <select id="rioNombre"><option>Estero Penco</option><option>Río Lirquén</option><option>Río Andalién</option><option>Otro</option></select></label><label>Fecha <input type="date" id="rioFecha"></label><label>Nivel (cm) <input type="number" id="rioNivel" min="0" step="1" placeholder="ej: 45"></label></div>' +
    '<div class="conv-row"><label>pH (opcional) <input type="number" id="rioPh" min="0" max="14" step="0.1" placeholder="7.0"></label><label>Aspecto <select id="rioTurb"><option>Clara</option><option>Leve turbia</option><option>Turbia tras lluvia</option><option>Muy turbia / espuma</option></select></label></div>' +
    '<label>Nota <input type="text" id="rioNota" placeholder="ej: agua clara, subió tras lluvia..." maxlength="60"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="rioAdd" class="btn btn-accent" style="width:auto">+ Guardar medición</button></div>' +
    '<div id="riosList" class="habits-list" style="margin-top:10px;max-height:220px"></div>' +
    '<p class="muted" style="font-size:10px">No tomes directo del estero sin hervir/clorar. Si ves espuma, mortandad o color raro avisa a Municipalidad / SISS. Nguruvilu enseña: el agua se cuida en su casa.</p></div></div>');
  ['Hoy', 'Estanque', 'Lluvia', 'Riego', 'Casa', 'Calidad'].forEach(function (t) {
    var btn = $('tabAgua' + t);
    if (btn) btn.onclick = function () { switchAguaTab(t); };
  });
  var b = $('btnAgua');
  if (b) {
    try { b.textContent = '💧 Agua'; } catch (e) {}
    b.onclick = function () {
      var c = getAguaCfg();
      if ($('aguaCap')) $('aguaCap').value = c.cap;
      if ($('aguaNivel')) $('aguaNivel').value = c.nivel;
      if ($('aguaCons')) $('aguaCons').value = c.consumo;
      if ($('aguaTecho')) $('aguaTecho').value = c.techo;
      if ($('aguaPers')) $('aguaPers').value = c.personas;
      if ($('aguaMeta')) $('aguaMeta').value = c.meta;
      if (!$('lluFecha').value) $('lluFecha').value = todayKey();
      if ($('rioFecha') && !$('rioFecha').value) $('rioFecha').value = todayKey();
      if ($('rieFecha') && !$('rieFecha').value) $('rieFecha').value = todayKey();
      if ($('casaFecha') && !$('casaFecha').value) $('casaFecha').value = todayKey();
      if ($('calFecha') && !$('calFecha').value) $('calFecha').value = todayKey();
      try { paintAguaGuias(); } catch (e) {}
      switchAguaTab('Hoy');
      renderAgua();
      openDlg('aguaDialog');
    };
  }
  if ($('aguaSave')) $('aguaSave').onclick = function () {
    var c = getAguaCfg();
    c.cap = +$('aguaCap').value || 0; c.nivel = Math.min(c.cap || Infinity, +$('aguaNivel').value || 0); c.consumo = +$('aguaCons').value || 0;
    c.techo = +$('aguaTecho').value || 0; c.personas = +$('aguaPers').value || 1; c.meta = +$('aguaMeta').value || 100;
    save('Estanque guardado 🛢️'); renderAgua();
  };
  if ($('cosCalc')) $('cosCalc').onclick = function () {
    var mm = parseFloat($('cosMm').value) || 0, t = parseFloat($('cosTecho').value) || getAguaCfg().techo || 0;
    $('cosOut').innerHTML = mm <= 0 || t <= 0 ? 'Escribe mm y m².' : '🌧️ ' + mm + ' mm × ' + t + ' m² ≈ <b>' + aguaCosechaL(mm, t) + ' L</b> cosechables (ya descontado 20%).';
  };
  if ($('lluAdd')) $('lluAdd').onclick = function () {
    var f = $('lluFecha').value || todayKey(), mm = parseFloat($('lluMm').value);
    if (!(mm >= 0)) return alert('Escribe los mm');
    var techo = parseFloat($('lluTecho').value) || 0;
    getLluvia().push({ id: uid('ll'), fecha: f, mm: mm, techo: techo || undefined, nota: clean($('lluNota').value, 60) });
    if (techo > 0) { var c = getAguaCfg(); c.nivel = Math.min(c.cap, Math.round(c.nivel + mm * techo * 0.8)); if ($('aguaNivel')) $('aguaNivel').value = c.nivel; }
    save('Lluvia guardada 🌧️'); $('lluMm').value = ''; $('lluNota').value = ''; renderAgua();
  };
  if ($('lluShare')) $('lluShare').onclick = function () {
    var d = getLluvia(); if (!d.length) return alert('Sin lluvias');
    share('🌧️ Mis lluvias', d.slice(-12).map(function (r) { return '· ' + r.fecha + ': ' + r.mm + ' mm' + (r.nota ? ' (' + r.nota + ')' : ''); }).join('\n'));
  };
  if ($('lluClear')) $('lluClear').onclick = function () { if (!confirm('¿Borrar todas las lluvias?')) return; store('lluviaLog', []); try { userData().lluviaLog = []; } catch (e) {} save(); renderAgua(); };
  if ($('rieAdd')) $('rieAdd').onclick = function () {
    var f = ($('rieFecha') || {}).value || todayKey(), li = parseFloat(($('rieLitros') || {}).value);
    if (!(li >= 0)) return alert('Escribe los litros');
    getAguaRiego().push({ id: uid('rg'), fecha: f, litros: li, sector: clean(($('rieSector') || {}).value || 'huerta', 30), sistema: ($('rieSis') || {}).value || 'Goteo', nota: clean(($('rieNota') || {}).value, 60) });
    save('Riego guardado 💧'); if ($('rieLitros')) $('rieLitros').value = ''; if ($('rieNota')) $('rieNota').value = ''; renderAguaRiego(); try { renderAguaHoy(); } catch (e) {}
  };
  if ($('rieShare')) $('rieShare').onclick = function () {
    var d = getAguaRiego(); if (!d.length) return alert('Sin riegos');
    share('💧 Mis riegos', d.slice(-12).map(function (r) { return '· ' + r.fecha + ': ' + r.litros + ' L · ' + r.sector + ' (' + r.sistema + ')'; }).join('\n'));
  };
  if ($('rieCalc')) $('rieCalc').onclick = function () {
    var m2 = parseFloat(($('rieM2') || {}).value) || getAguaCfg().riegoM2 || 0, t = parseFloat(($('rieTemp') || {}).value) || 4;
    if (!(m2 > 0)) { $('rieOut').textContent = 'Escribe los m².'; return; }
    var tot = Math.round(m2 * t);
    $('rieOut').innerHTML = '💧 ' + m2 + ' m² ≈ <b>' + tot + ' L/día</b> en esta temporada. Con goteo 2 L/h: ' + Math.round(tot / 2) + ' gotero-horas (ej: 10 goteros × ' + Math.round(tot / 2 / 10 * 60) + ' min). Con mulch resta 1/3: ~' + Math.round(tot * 0.66) + ' L.';
  };
  if ($('casaAdd')) $('casaAdd').onclick = function () {
    var f = ($('casaFecha') || {}).value || todayKey(), m = parseFloat(($('casaM3') || {}).value);
    if (!(m >= 0)) return alert('Escribe la lectura en m³');
    getAguaCasa().push({ id: uid('cs'), fecha: f, m3: m, nota: clean(($('casaNota') || {}).value, 40) });
    save('Lectura guardada 🧾'); if ($('casaM3')) $('casaM3').value = ''; renderAguaCasa();
  };
  if ($('casaShare')) $('casaShare').onclick = function () {
    var d = getAguaCasa(); if (!d.length) return alert('Sin lecturas');
    share('🧾 Mi consumo de agua', d.slice(-12).map(function (r) { return '· ' + r.fecha + ': ' + r.m3 + ' m³'; }).join('\n'));
  };
  if ($('casaClear')) $('casaClear').onclick = function () { if (!confirm('¿Borrar lecturas del medidor?')) return; try { userData().aguaCasaLog = []; } catch (e) {} save(); renderAguaCasa(); };
  if ($('calAdd')) $('calAdd').onclick = function () {
    var f = ($('calFecha') || {}).value || todayKey();
    getAguaCal().push({ id: uid('cal'), fecha: f, origen: ($('calOrigen') || {}).value || 'Pozo', ph: clean(($('calPh') || {}).value || '', 6), turb: ($('calTurb') || {}).value || 'Clara', cloro: ($('calCloro') || {}).value || '—', nota: clean(($('calNota') || {}).value, 60) });
    save('Control guardado 🔬'); if ($('calPh')) $('calPh').value = ''; if ($('calNota')) $('calNota').value = ''; renderAguaCal();
  };
  if ($('rioAdd') && !$('rioAdd').dataset.wired) {
    $('rioAdd').dataset.wired = '1';
    $('rioAdd').onclick = function () {
      var rio = $('rioNombre') ? $('rioNombre').value : 'Río';
      var f = ($('rioFecha') && $('rioFecha').value) || todayKey();
      var niv = $('rioNivel') ? String($('rioNivel').value || '').trim() : '';
      if (!niv) return alert('Escribe el nivel en cm');
      var ph = $('rioPh') ? String($('rioPh').value || '').trim() : '';
      var turb = $('rioTurb') ? $('rioTurb').value : '';
      getRios().push({ id: uid('rio'), rio: rio, fecha: f, nivel: niv, ph: ph, turb: turb, nota: clean(($('rioNota') || { value: '' }).value, 60) });
      save('Medición guardada 🌊'); if ($('rioNivel')) $('rioNivel').value = ''; if ($('rioPh')) $('rioPh').value = ''; if ($('rioNota')) $('rioNota').value = ''; renderRios();
    };
  }
}

/* ============================================================
   5) NUDOS, AMARRAS Y REDES
   ============================================================ */
function getNudosMios() { var a = store('nudosMios', []); return Array.isArray(a) ? a : []; }
/* Animaciones 3D (Knots3D): tienen derechos de autor y no se copian al proyecto; se enlazan (requieren internet, se abren en el navegador). */
var NUDOS_LINKS = [
  ['https://knots3d.com/es/as-de-gu%C3%ADa-nudo', 'https://www.animatedknots.com/bowline-knot'],
  ['https://knots3d.com/es/ballestrinque-extremo-nudo'],
  ['https://knots3d.com/es/nudo-de-pescador-doble'],
  ['https://knots3d.com/es/nudo-en-ocho-con-gaza'],
  ['https://knots3d.com/es/nudo-de-rizo'],
  ['https://knots3d.com/es/vuelta-de-escota-nudo'],
  [], [], [], [], [], [], [], [], []
];
function getNudosPract() { var a = store('nudosPract', {}); return (a && typeof a === 'object' && !Array.isArray(a)) ? a : {}; }
function openNudoAnim(idx, n) {
  var l = NUDOS_LINKS[idx] || [];
  var url = l[n] || l[0];
  if (!url) return;
  try { if (typeof openExternalLink === 'function') { openExternalLink(url); return; } } catch (e) {}
  try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (e2) {}
}
function switchNudosTab(t) {
  [['Nudos', 'nudosPanelNudos'], ['Redes', 'nudosPanelRedes'], ['Cabos', 'nudosPanelCabos'], ['Practica', 'nudosPanelPract']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $('tabNud' + x[0]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
}
function nudoCardHTML(k, idx) {
  var lis = (k.pasos || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('');
  var LK = NUDOS_LINKS[idx] || [];
  var visor = LK.length ? '<div class="asguia-visor"><p class="fin-tip-desc">Animacion 3D paso a paso (requiere internet):</p><div style="display:flex;gap:6px;flex-wrap:wrap">' + LK.map(function (u, n) { return '<button type="button" class="btn' + (n === 0 ? ' btn-accent' : '') + '" data-nudoanim="' + idx + ':' + n + '" style="width:auto;font-size:11px">Ver ' + (n === 0 ? 'en 3D' : 'paso a paso') + '</button>'; }).join('') + '</div></div>' : '';
  var pract = getNudosPract();
  var done = !!pract['k' + idx];
  return '<div class="si-card"><div class="fin-tip-head"><span class="fin-tip-ico">Nudo</span><h4>' + esc(k.n) + '</h4></div>' +
    '<p style="margin:2px 0"><span class="chip" style="font-size:10px">' + esc(k.cat || 'Nudo') + '</span> ' + (done ? '<span class="chip" style="font-size:10px;color:#8fd694;border-color:#8fd69455">practicado</span>' : '') + '</p>' +
    '<p class="fin-tip-desc">' + esc(k.uso) + '</p>' + visor +
    '<ol class="esp-steps">' + lis + '</ol>' +
    '<p class="fin-tip-tip">' + esc(k.tip) + '</p>' +
    '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><button type="button" class="btn" style="width:auto;font-size:11px" data-nudpract="' + idx + '">' + (done ? 'Practicado (tocar para quitar)' : 'Lo practique con cuerda real') + '</button><button type="button" class="btn" style="width:auto;font-size:11px" data-nudspeak="' + idx + '">Escuchar pasos</button></div></div>';
}
function renderNudos() {
  var box = $('nudosList'); if (!box) return;
  var q = (($('nudSearch') && $('nudSearch').value) || '').toLowerCase();
  var cf = ($('nudCatFilter') && $('nudCatFilter').value) || '';
  var mios = getNudosMios();
  var pract = getNudosPract();
  var idxs = NUDOS.map(function (_, i) { return i; }).filter(function (i) {
    var k = NUDOS[i];
    if (cf && (k.cat || '') !== cf) return false;
    if (q && ((k.n + ' ' + k.uso + ' ' + (k.cat || '') + ' ' + (k.pasos || []).join(' ')).toLowerCase().indexOf(q) < 0)) return false;
    return true;
  });
  var base = idxs.map(function (idx) { return nudoCardHTML(NUDOS[idx], idx); }).join('');
  if (!base) base = '<p class="muted" style="text-align:center">Sin resultados. Prueba "pesca", "bote", "carpa", "huerta".</p>';
  var mine = mios.map(function (k) {
    return '<div class="si-card" style="border-left:3px solid #8fd694"><div class="fin-tip-head"><span class="fin-tip-ico">Mi nudo</span><h4>' + esc(k.n) + '</h4></div>' +
      '<p class="fin-tip-desc">' + esc(k.uso || 'Nudo agregado por ti') + '</p>' +
      '<ol class="esp-steps">' + (k.pasos || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>' +
      (k.tip ? '<p class="fin-tip-tip">' + esc(k.tip) + '</p>' : '') +
      '<div style="display:flex;gap:6px;margin-top:6px"><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-delnudo="' + k.id + '">Eliminar</button></div></div>';
  }).join("");
  box.innerHTML = base + mine;
  var hecha = Object.keys(pract).filter(function (k) { return pract[k]; }).length;
  var st = $('nudStats');
  if (st) st.textContent = NUDOS.length + ' nudos base · ' + hecha + ' practicados · ' + mios.length + ' propios';
  box.querySelectorAll('[data-delnudo]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Eliminar este nudo?')) return;
      var d = getNudosMios();
      var ix = d.findIndex(function (x) { return x.id === b.getAttribute('data-delnudo'); });
      if (ix >= 0) d.splice(ix, 1);
      save(); renderNudos();
    };
  });
  box.querySelectorAll('[data-nudoanim]').forEach(function (btn) {
    btn.onclick = function () { var qq = (btn.getAttribute('data-nudoanim') || '0:0').split(':'); openNudoAnim(+qq[0], +qq[1]); };
  });
  box.querySelectorAll('[data-nudpract]').forEach(function (btn) {
    btn.onclick = function () {
      var i = btn.getAttribute('data-nudpract');
      var p = getNudosPract();
      if (p['k' + i]) delete p['k' + i]; else p['k' + i] = todayKey();
      save(p['k' + i] ? 'Nudo practicado: la mano ya recuerda' : 'Marcado como pendiente');
      renderNudos();
    };
  });
  box.querySelectorAll('[data-nudspeak]').forEach(function (btn) {
    btn.onclick = function () {
      var k = NUDOS[+btn.getAttribute('data-nudspeak')];
      if (!k) return;
      try { speak(k.n + '. ' + (k.pasos || []).join(' ')); } catch (e) {}
    };
  });
  try { renderNudosRedes(); } catch (e) {}
  try { renderNudosCabos(); } catch (e) {}
  try { renderNudosPractPanel(); } catch (e) {}
}
function renderNudosRedes() {
  var box = $('nudosRedesList'); if (!box) return;
  var tipos = (typeof REDES_TIPOS !== 'undefined' ? REDES_TIPOS : []).map(function (t) {
    return '<div class="si-card"><h4>' + esc(t.n) + '</h4><p class="fin-tip-desc">' + esc(t.d) + '</p></div>';
  }).join('');
  box.innerHTML = tipos +
    '<div class="si-card" style="border-left:3px solid var(--gold)"><div class="fin-tip-head"><span class="fin-tip-ico">Red</span><h4>Reparar y tejer paso a paso (12 pasos)</h4></div>' +
    '<ol class="esp-steps">' + REDES_GUIA.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') + '</ol>' +
    '<p class="fin-tip-tip">Kit minimo: aguja de red, tablilla medidora, hilo extra del mismo grosor, tijera y lana de color para marcar rotos. Practica primero con red de huerta (entutorado).</p></div>';
}
function renderNudosCabos() {
  var box = $('nudosCabosList'); if (!box) return;
  var cabos = (typeof CABOS_GUIA !== 'undefined' ? CABOS_GUIA : []).map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('');
  var err = (typeof NUDOS_ERRORES !== 'undefined' ? NUDOS_ERRORES : []).map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('');
  box.innerHTML = '<div class="si-card"><h4>Cabos: cual usar y como cuidarlo</h4><ol class="esp-steps">' + cabos + '</ol></div>' +
    '<div class="si-card" style="border-left:3px solid #e76e8a"><h4>6 errores que rompen faenas</h4><ol class="esp-steps">' + err + '</ol><p class="fin-tip-tip">Revision por luna: 1 vez por luna palpa tus cabos de bote y kayak. 5 minutos salvan una salida.</p></div>';
}
function renderNudosPractPanel() {
  var box = $('nudosPractList'); if (!box) return;
  var p = getNudosPract();
  var hecha = Object.keys(p).filter(function (k) { return p[k]; }).length;
  var pct = Math.round(hecha / NUDOS.length * 100);
  box.innerHTML = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>Mi progreso: ' + hecha + '/' + NUDOS.length + ' (' + pct + '%)</h4>' +
    '<p class="muted" style="font-size:11px">Practica con cuerda REAL (1 m de cordel basta). Marca cada nudo solo cuando te salga 3 veces seguidas sin mirar. Meta: 3 por luna.</p>' +
    '<div style="background:var(--panel);border-radius:8px;height:10px;overflow:hidden;margin-top:6px"><div style="height:100%;width:' + pct + '%;background:var(--gold)"></div></div></div>' +
    '<div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">' + NUDOS.map(function (k, i) {
      var d = p['k' + i];
      return '<div class="hora-item" style="justify-content:flex-start;gap:8px"><span style="font-size:16px">' + (d ? 'OK' : '  ') + '</span><span style="font-size:12px"><b>' + esc(k.n) + '</b> <span class="chip" style="font-size:10px">' + esc(k.cat || '') + '</span>' + (d ? '<br><span class="muted" style="font-size:10px">practicado ' + esc(d) + '</span>' : '') + '</span></div>';
    }).join('') + '</div>';
  var sh = $('nudShare');
  if (sh) sh.onclick = function () {
    var pp = getNudosPract();
    var listos = NUDOS.filter(function (_, i) { return pp['k' + i]; }).map(function (k) { return '- ' + k.n; });
    var txt = 'Mis nudos (' + listos.length + '/' + NUDOS.length + ' practicados)\n' + (listos.join('\n') || 'Aun practicando los primeros...') + '\n\nRedes: domino ' + REDES_GUIA.length + ' pasos de reparacion.';
    try { shareText('Mis nudos y redes', txt, null); } catch (e) { try { share('Mis nudos y redes', txt); } catch (e2) {} }
  };
}
function setupNudos() {
  makeDialog('nudosDialog', '🪢 Nudos, amarras y redes',
    'Biblioteca para pesca artesanal, kayak, camping y huerta (entutorado). <b>15 nudos + redes + cabos + practica.</b> Practica con una cuerda real.',
    '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
    '<button type="button" id="tabNudNudos" class="btn btn-accent" style="width:auto">Nudos</button>' +
    '<button type="button" id="tabNudRedes" class="btn" style="width:auto">Redes</button>' +
    '<button type="button" id="tabNudCabos" class="btn" style="width:auto">Cabos</button>' +
    '<button type="button" id="tabNudPractica" class="btn" style="width:auto">Practica</button></div>' +
    '<div id="nudosPanelNudos">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>¿Que nudo uso?</h4><div id="nudosUsoRapido" style="font-size:12px;line-height:1.7"></div>' +
    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">Buscar <input type="text" id="nudSearch" placeholder="ej: anzuelo, bote, carpa, huerta..." autocomplete="off"></label>' +
    '<label>Filtrar <select id="nudCatFilter"><option value="">Todas</option><option>Presilla</option><option>Union</option><option>Tope</option><option>Amarre</option><option>Pesca</option><option>Ajustable</option><option>Construccion</option><option>Remate</option><option>Redes</option></select></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><span id="nudStats" class="muted" style="font-size:11px"></span></div></div>' +
    '<div id="nudosList" style="display:flex;flex-direction:column;gap:10px;margin-top:10px"></div></div>' +
    '<div id="nudosPanelRedes" class="hidden"><div id="nudosRedesList" style="display:flex;flex-direction:column;gap:10px"></div></div>' +
    '<div id="nudosPanelCabos" class="hidden"><div id="nudosCabosList" style="display:flex;flex-direction:column;gap:10px"></div></div>' +
    '<div id="nudosPanelPract" class="hidden"><div id="nudosPractList"></div>' +
    '<div class="menstrual-card" style="border-color:var(--gold);margin-top:10px"><h4>Agregar mi nudo</h4>' +
    '<label>Nombre <input type="text" id="nudNom" placeholder="ej: Nudo de mi abuelo" maxlength="40"></label>' +
    '<label>Uso <input type="text" id="nudUso" placeholder="ej: Para amarrar el bote" maxlength="80"></label>' +
    '<label>Pasos (uno por linea) <textarea id="nudPasos" rows="3" placeholder="Haz un seno..." style="width:100%;resize:vertical"></textarea></label>' +
    '<label>Consejo (opcional) <input type="text" id="nudTip" placeholder="ej: Humedece antes de apretar" maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;gap:8px"><button type="button" id="nudAdd" class="btn btn-accent" style="width:auto">+ Guardar nudo</button><button type="button" id="nudShare" class="btn" style="width:auto">Compartir progreso</button></div></div></div>');
  try {
    var ur = $('nudosUsoRapido');
    if (ur && typeof NUDOS_USO_RAPIDO !== 'undefined') ur.innerHTML = NUDOS_USO_RAPIDO.map(function (r) { return '· <b>' + esc(r.s) + ':</b> ' + esc(r.n); }).join('<br>');
  } catch (e) {}
  var b = $('btnNudos'); if (b) b.onclick = function () { switchNudosTab('Nudos'); renderNudos(); openDlg('nudosDialog'); };
  ['Nudos', 'Redes', 'Cabos', 'Practica'].forEach(function (t) { var tb = $('tabNud' + t); if (tb) tb.onclick = function () { switchNudosTab(t); }; });
  var qs = $('nudSearch'); if (qs) qs.oninput = renderNudos;
  var cf2 = $('nudCatFilter'); if (cf2) cf2.onchange = renderNudos;
  try {
    var btn = $('btnNudos');
    if (btn) { var kw = btn.getAttribute('data-keywords') || ''; if (kw.indexOf('palomar') < 0) btn.setAttribute('data-keywords', kw + ' palomar clinch ancla tensor carpa amarra cuadrada margarita cabo cuerda presilla remate practica red huerta'); }
  } catch (e2) {}
  var add = $('nudAdd');
  if (add) add.onclick = function () {
    var n = clean($('nudNom').value, 40);
    var pasos = String($('nudPasos').value || '').split('\n').map(function (x) { return x.trim(); }).filter(function (x) { return x; }).slice(0, 12);
    if (!n) return alert('Ponle un nombre al nudo');
    if (!pasos.length) return alert('Escribe al menos 1 paso (uno por linea)');
    getNudosMios().push({ id: uid('nu'), n: n, uso: clean($('nudUso').value, 80), pasos: pasos.map(function (x) { return clean(x, 140); }), tip: clean($('nudTip').value, 120) });
    save('Nudo guardado');
    $('nudNom').value = ''; $('nudUso').value = ''; $('nudPasos').value = ''; $('nudTip').value = '';
    renderNudos();
  };
}
/* ============================================================
   6) BITACORA DE TALLER
   ============================================================ */
function getTaller() { var a = store('tallerLog', []); return Array.isArray(a) ? a : []; }
function renderTaller() {
  var box = $('tallerList'); if (!box) return;
  var data = getTaller();
  if (!data.length) { box.innerHTML = '<p class="muted">Sin registros. Agrega tu primera herramienta.</p>'; $('tallerStats').textContent = '0 registros'; return; }
  var atrasadas = 0;
  box.innerHTML = data.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).map(function (r) {
    var d = lunasEntre(r.fecha);
    var prox = addDaysKey(r.fecha, (parseFloat(r.cada) || 6) * 28);
    var ok = todayKey() <= prox;
    if (!ok) atrasadas++;
    var proxL = lunaDeFecha(prox);
    return '<div class="habit-item"><b>🔧 ' + esc(r.herr) + '</b> <span class="muted" style="font-size:11px">· ' + esc(r.tipo) + '</span><br>' +
      '<span class="muted" style="font-size:11px">Última: ' + r.fecha + ' (' + d.txt + ' sin revisar)<br>⏰ Próxima: ' + prox + (proxL ? ' (Luna ' + proxL.luna + ')' : '') + ' — ' + (ok ? '<span style="color:#8fd694">al día ✓</span>' : '<span style="color:#ff9a9a">⚠️ Hace ' + d.lunas + ' lunas: ¡revisar!</span>') + '</span>' +
      (r.nota ? '<br><span class="muted" style="font-size:11px">' + esc(r.nota) + '</span>' : '') +
      '<div style="display:flex;gap:6px;margin-top:6px"><button class="btn" style="width:auto;font-size:11px" data-ok="' + r.id + '">✓ Marcar hecha hoy</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('');
  $('tallerStats').textContent = data.length + ' equipos · ' + atrasadas + ' con mantención atrasada';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Eliminar?')) return; var d = getTaller(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderTaller(); }; });
  box.querySelectorAll('[data-ok]').forEach(function (b) { b.onclick = function () { var d = getTaller(); var r = d.find(function (x) { return x.id === b.getAttribute('data-ok'); }); if (!r) return; r.fecha = todayKey(); save('Mantención al día ✓'); renderTaller(); }; });
}
function setupTaller() {
  makeDialog('tallerDialog', '🔧 Bitácora de reparaciones y mantenimiento',
    'Historial de salud de tus herramientas: motor del bote, techo, afilado, bicicleta, bomba de agua. <b>Alertas automáticas basadas en lunas.</b>',
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Registro</h4>' +
    '<div class="conv-row"><label style="flex:2">Equipo <input type="text" id="talHerr" placeholder="ej: Motor bote, Bomba agua" maxlength="40"></label><label>Tipo <select id="talTipo"><option>Cambio aceite</option><option>Afiliado / filo</option><option>Impermeabilizar</option><option>Limpieza cañón</option><option>Bicicleta</option><option>Otra mantención</option></select></label></div>' +
    '<div class="conv-row"><label>Fecha hecha <input type="date" id="talFecha"></label><label>Cada cuántas lunas <input type="number" id="talCada" min="1" max="24" value="6"></label></div>' +
    '<label>Notas <input type="text" id="talNota" placeholder="qué se hizo, repuestos..." maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="talAdd" class="btn btn-accent" style="width:auto">+ Guardar</button></div></div>' +
    '<div id="tallerList" class="habits-list" style="margin-top:10px;max-height:300px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="tallerStats" class="muted" style="font-size:11px"></span><button type="button" id="talShare" class="btn" style="width:auto">📤 Compartir</button></div>');
  var b = $('btnTaller'); if (b) b.onclick = function () { if (!$('talFecha').value) $('talFecha').value = todayKey(); renderTaller(); openDlg('tallerDialog'); };
  $('talAdd').onclick = function () {
    var h = clean($('talHerr').value, 40); if (!h) return alert('Nombra el equipo');
    getTaller().push({ id: uid('ta'), herr: h, tipo: $('talTipo').value, fecha: $('talFecha').value || todayKey(), cada: $('talCada').value || 6, nota: clean($('talNota').value, 80) });
    save(); $('talHerr').value = ''; $('talNota').value = ''; renderTaller();
  };
  $('talShare').onclick = function () { var d = getTaller(); if (!d.length) return alert('Sin registros'); share('🔧 Mi taller', d.map(function (r) { return '· ' + r.herr + ' (' + r.tipo + ') — última ' + r.fecha; }).join('\n')); };
}

/* ============================================================
   7) LEÑA & INVIERNO (fusionado: $/kWh + plan Pukem en un solo dialogo)
   El dialogo original #lenaDialog ($/kWh) se conserva intacto y se le
   agrega la seccion "Plan de invierno" (m2, aislacion, estufa) +
   construccion natural. Un solo boton: el #btnLena existente.
   ============================================================ */
function setupInvierno() {
  var b = $('btnLena');
  if (b) {
    b.textContent = '🪵 Leña & Invierno';
    var kw = b.getAttribute('data-keywords') || '';
    if (kw.indexOf('plan invierno') < 0) b.setAttribute('data-keywords', kw + ' plan invierno m2 aislacion construccion natural paja quincha burlete');
  }
  var dlg = $('lenaDialog');
  if (!dlg || $('invM2')) return; // ya fusionado
  var closer = dlg.querySelector('#lenaClose');
  var anchor = closer ? closer.closest('.dlg-actions') : null;
  var sec = document.createElement('div');
  sec.id = 'lenaInviernoSec';
  sec.innerHTML =
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>❄️ Plan de invierno (Pukem) · ¿cuánta leña necesito?</h4>' +
    '<div class="conv-row"><label>m² a calefaccionar <input type="number" id="invM2" min="10" max="300" value="60"></label><label>Aislación <select id="invAis"><option value="0.8">Buena (doble muro/ventana)</option><option value="1" selected>Media (casa Penco típica)</option><option value="1.4">Mala (fugas, techo sin aislar)</option></select></label></div>' +
    '<div class="conv-row"><label>Estufa <select id="invEst"><option value="0.75">Bosca / eficiente (75%)</option><option value="0.55">Salamandra (55%)</option><option value="0.45">Cocina a leña (45%)</option><option value="0.9">Pellet (90%)</option></select></label><label>Leña <select id="invLen"><option value="4.5">Eucalipto seco</option><option value="4">Pino / aromo</option><option value="2.6">Leña húmeda (+30%)</option></select></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="invCalc" class="btn btn-accent" style="width:auto">🪵 Calcular invierno</button></div>' +
    '<div id="invResult" class="menstrual-card" style="margin-top:10px;background:var(--panel)"><span class="muted" style="font-size:11px">Ingresa tus m² para estimar la temporada jun–sep.</span></div></div>' +
    '<div class="si-card" style="border-left:3px solid var(--gold);margin-top:10px"><h4>🏠 Aislación y construcción natural (Penco)</h4><p class="fin-tip-desc">El techo pierde 30% del calor: prioriza aislar techo con lana, celulosa o fardos de paja revocados. Muros: quincha o paja + barro regulan la humedad costera. Piso: tarima sobre poyo ventilado evita hongos. Burletes en puertas/ventanas ≈ 1 m³ de leña ahorrado.</p><p class="fin-tip-tip">🌱 Corte responsable: solo seco/caído, nunca nativo vivo; compra con guía CONAF y guarda bajo techo ventilado 6+ meses (verTips de leña seca arriba).</p></div>';
  if (anchor) anchor.parentNode.insertBefore(sec, anchor);
  else dlg.querySelector('form').appendChild(sec);
  $('invCalc').onclick = function () {
    var m2 = +$('invM2').value || 60, ais = +$('invAis').value || 1, ef = +$('invEst').value || 0.55, kwhKg = +$('invLen').value || 4.5;
    var base = 80 * m2 * ais; // kWh útiles temporada Pukem (jun-sep)
    var real = base / ef; // kWh brutos
    var kg = real / kwhKg, m3 = kg / 450;
    $('invResult').innerHTML = '<h4>📊 Tu invierno (' + m2 + ' m²)</h4>' +
      '<p class="muted" style="font-size:12px">🔥 Necesitas ~<b>' + Math.round(real).toLocaleString('es-CL') + ' kWh</b> brutos (' + Math.round(base).toLocaleString('es-CL') + ' útiles).<br>🪵 ≈ <b>' + Math.round(kg).toLocaleString('es-CL') + ' kg</b> → <b>' + m3.toFixed(1) + ' m³ estéreos</b>.<br>💡 Pasar de aislación Mala→Media ahorra ~' + (Math.round(m3 * 0.28 * 10) / 10) + ' m³. Usa la calculadora de $/kWh de arriba para comparar precios antes de comprar.</p>';
  };
}

/* ============================================================
   8) TRUEQUE, FERIAS Y RECICLAJE (fusionado y ordenado por pestanas)
   Libro de trueque + Ferias libres de Penco/Lirquen + guia de
   reciclaje "donde va cada cosa" (ex seccion Reciclaje & Ferias).
   ============================================================ */
function getTrueque() { var a = store('truequeLog', []); return Array.isArray(a) ? a : []; }
function renderTrueque() {
  var box = $('truequeList'); if (!box) return;
  var data = getTrueque();
  var saldos = {}, gastoFeria = 0;
  data.forEach(function (r) {
    if (r.modo === 'Gasto feria') gastoFeria += (+r.valor || 0);
    else { var k = (r.quien || 'vecino').toLowerCase(); saldos[k] = saldos[k] || { quien: r.quien, bal: 0 }; saldos[k].bal += (r.modo === 'Di' ? -(+r.valor || 0) : (+r.valor || 0)); }
  });
  $('truequeResumen').innerHTML = '<h4>💰 Resumen</h4><p class="muted" style="font-size:12px">🛒 Gasto en Feria Libre: <b>$' + gastoFeria.toLocaleString('es-CL') + '</b> (detalle en pestaña 🥬 Ferias)<br>🤝 Saldos vecinos: ' + (Object.keys(saldos).length ? Object.keys(saldos).map(function (k) { var s = saldos[k]; return esc(s.quien) + ' ' + (s.bal === 0 ? '(a mano ✓)' : (s.bal > 0 ? 'me debe $' + s.bal.toLocaleString('es-CL') : 'le debo $' + Math.abs(s.bal).toLocaleString('es-CL'))); }).join(' · ') : 'sin movimientos') + '</p>';
  if (!data.length) { box.innerHTML = '<p class="muted">Libro vacío. Ej: "Le di 3 kg de papas a Juan".</p>'; }
  else box.innerHTML = data.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 60).map(function (r) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span>' + (r.modo === 'Gasto feria' ? '🛒' : (r.modo === 'Di' ? '📤 Di' : '📥 Recibí')) + ' <b>' + esc(r.detalle) + '</b><br><span class="muted" style="font-size:11px">' + r.fecha + (r.quien && r.modo !== 'Gasto feria' ? ' · ' + esc(r.quien) : '') + ' · $' + (+r.valor || 0).toLocaleString('es-CL') + ' ref.' + '</span></span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var d = getTrueque(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderTrueque(); }; });
  try { renderFeriaGasto(); } catch (e) {}
}
function tqReciItems() {
  try { if (typeof RECICLA_ITEMS !== 'undefined' && RECICLA_ITEMS && RECICLA_ITEMS.length) return RECICLA_ITEMS; } catch (e) {}
  return [
    { n: 'Botella plástica PET', d: 'Punto limpio', e: 'Lava, aplasta, sin tapa', k: 'botella plastico pet bebida' },
    { n: 'Vidrio (botella/frasco)', d: 'Punto limpio', e: 'Sin quebrar, sin tapa, no ventanas', k: 'vidrio botella frasco' },
    { n: 'Cartón / papel', d: 'Punto limpio', e: 'Seco, amarra, no encerado ni sucio con grasa', k: 'carton papel diario caja' },
    { n: 'Lata aluminio / conserva', d: 'Punto limpio', e: 'Lava y aplasta', k: 'lata aluminio conserva atun' },
    { n: 'Pilas / baterías', d: 'Peligroso', e: 'Nunca a basura. Punto limpio o campaña municipal', k: 'pila bateria control' },
    { n: 'Aceite cocina usado', d: 'Peligroso', e: 'En botella cerrada a punto limpio. Nunca al lavaplatos', k: 'aceite fritura cocina' },
    { n: 'Ropa buena', d: 'Feria', e: 'Feria, trueque o donación', k: 'ropa zapato textil' },
    { n: 'Ropa rota / trapo', d: 'Basura', e: 'Bolsa cerrada a aseo. No a punto limpio', k: 'trapo ropa rota' },
    { n: 'Restos verdura / cáscara', d: 'Compost', e: 'A compost. No carne/lácteos', k: 'verdura cascara resto comida compost' },
    { n: 'Escombro / voluminoso', d: 'Basura', e: 'Operativo municipal / Aseo 41 226 1033, no a humedal', k: 'escombro mueble colchon voluminoso' },
    { n: 'Electrónico chico', d: 'Peligroso', e: 'Campaña e-waste municipal, no a basura', k: 'celular cargador electronico tele' },
    { n: 'Tetra pack', d: 'Punto limpio', e: 'Lava, abre y seca', k: 'tetra leche jugo' },
    { n: 'Plumavit', d: 'Basura', e: 'Evita. Solo limpio en algunos puntos', k: 'plumavit aislapol' },
    { n: 'Medicamento vencido', d: 'Peligroso', e: 'A farmacia/CESFAM, nunca WC ni basura suelta', k: 'remedio medicamento vencido' }
  ];
}
function renderTqReci() {
  var box = $('tqReciList'); if (!box) return;
  var q = (($('tqReciQ') && $('tqReciQ').value) || '').toLowerCase();
  var f = (($('tqReciF') && $('tqReciF').value) || '');
  var list = tqReciItems().filter(function (p) { if (f && p.d !== f) return false; if (q && (p.n + ' ' + p.e + ' ' + p.k).toLowerCase().indexOf(q) < 0) return false; return true; });
  var col = { 'Punto limpio': '#7ab8ff', 'Feria': '#a9d18e', 'Compost': '#c9a86a', 'Basura': '#9aa3c7', 'Peligroso': '#e76e8a' };
  box.innerHTML = list.length ? '<div style="display:flex;flex-direction:column;gap:6px">' + list.map(function (p) {
    return '<div class="hora-item" style="justify-content:flex-start;gap:8px"><span class="chip" style="font-size:10px;background:' + col[p.d] + '22;color:' + col[p.d] + ';border-color:' + col[p.d] + '55;white-space:nowrap">' + esc(p.d) + '</span><span style="font-size:12px"><b>' + esc(p.n) + '</b> — ' + esc(p.e) + '</span></div>';
  }).join('') + '</div>' : '<p class="muted" style="text-align:center">Sin resultados. Prueba "botella", "pila", "aceite".</p>';
}
function renderFeriaGasto() {
  var box = $('feriaGasto'); if (!box) return;
  var data = getTrueque().filter(function (r) { return r.modo === 'Gasto feria'; }).sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  var tot = data.reduce(function (a, r) { return a + (+r.valor || 0); }, 0);
  box.innerHTML = '<h4>🧾 Mis gastos en feria · $' + tot.toLocaleString('es-CL') + ' en total</h4>' +
    (data.length ? '<div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">' + data.slice(0, 12).map(function (r) {
      return '<div class="hora-item" style="justify-content:flex-start;gap:8px"><span style="font-size:12px">🛒 <b>' + esc(r.detalle) + '</b><br><span class="muted">' + r.fecha + (r.quien ? ' · ' + esc(r.quien) : '') + ' · $' + (+r.valor || 0).toLocaleString('es-CL') + '</span></span></div>';
    }).join('') + '</div><p class="muted" style="font-size:10px;margin-top:6px">Para anotar un gasto nuevo usa la pestaña 🔄 Trueque (tipo "Gasto feria").</p>' : '<p class="muted">Aún sin gastos anotados.</p>');
}
function switchTqTab(t) {
  [['Libro', 'tqLibroPanel'], ['Feria', 'tqFeriaPanel'], ['Reci', 'tqReciPanel']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $('tabTq' + x[0]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
}
function setupTrueque() {
  makeDialog('truequeDialog', '🔄 Trueque, Ferias y Reciclaje',
    'Economía circular pencona, ordenada por pestañas: trueque con vecinos, ferias libres y guía de reciclaje.',
    '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
    '<button type="button" id="tabTqLibro" class="btn btn-accent" style="width:auto">🔄 Trueque</button>' +
    '<button type="button" id="tabTqFeria" class="btn" style="width:auto">🥬 Ferias</button>' +
    '<button type="button" id="tabTqReci" class="btn" style="width:auto">♻️ Reciclaje</button></div>' +
    '<div id="tqLibroPanel"><div id="truequeResumen" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>➕ Anotar</h4><div class="conv-row"><label>Tipo <select id="truModo"><option>Di</option><option>Recibí</option><option>Gasto feria</option></select></label><label>Fecha <input type="date" id="truFecha"></label></div>' +
    '<div class="conv-row"><label>Detalle <input type="text" id="truDet" placeholder="3 kg papas / arreglo reja / verduras feria" maxlength="60"></label><label>Valor ref. $ <input type="number" id="truValor" min="0" step="500" placeholder="5000"></label></div>' +
    '<label>Vecino / puesto <input type="text" id="truQuien" placeholder="Juan / Feria Penco" maxlength="30"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="truAdd" class="btn btn-accent" style="width:auto">+ Anotar</button></div></div>' +
    '<div id="truequeList" class="habits-list" style="margin-top:10px;max-height:280px"></div></div>' +
    '<div id="tqFeriaPanel" class="hidden"><div class="help-grid">' +
    '<div class="help-card"><h4>🥬 Ferias libres</h4><p style="font-size:11px;line-height:1.5"><b>Penco centro:</b> mié y sáb 8:30–14:00 · <b>Lirquén:</b> sáb mañana. Lleva bolsa reutilizable, compra de temporada (ver 🌱 Siembra) y conversa trueque.</p></div>' +
    '<div class="help-card"><h4>🗓️ Recolección Penco</h4><p style="font-size:11px;line-height:1.5">Domiciliaria 2–3x/semana según sector (Aseo y Ornato 41 226 1033). Saca la noche anterior, no con viento sur fuerte. Voluminosos: operativos por junta de vecinos.</p></div></div>' +
    '<div id="feriaGasto" class="menstrual-card" style="margin-top:10px"></div>' +
    '<p class="muted" style="font-size:10px;margin-top:6px">Guía offline y orientativa: verifica horarios en munipenco.cl porque cambian.</p></div>' +
    '<div id="tqReciPanel" class="hidden"><p class="muted" style="font-size:11px">♻️ <b>¿Dónde va cada cosa?</b> Busca y filtra. Lo reutilizable va a Feria/trueque; lo orgánico a compost (ver 🪱 Compost).</p>' +
    '<div class="conv-row" style="align-items:center"><label style="flex:2">🔍 ¿Dónde va? <input type="text" id="tqReciQ" placeholder="ej: botella, pila, aceite, ropa" autocomplete="off"></label>' +
    '<label>Filtrar <select id="tqReciF"><option value="">Todo</option><option value="Punto limpio">Punto limpio</option><option value="Feria">Feria / Reutiliza</option><option value="Compost">Compost</option><option value="Basura">Basura / Aseo</option><option value="Peligroso">Peligroso</option></select></label></div>' +
    '<div id="tqReciList" style="margin-top:10px;max-height:300px;overflow-y:auto"></div></div>');
  var b = $('btnTrueque'); if (b) b.onclick = function () { if (!$('truFecha').value) $('truFecha').value = todayKey(); switchTqTab('Libro'); renderTrueque(); renderTqReci(); openDlg('truequeDialog'); };
  $('tabTqLibro').onclick = function () { switchTqTab('Libro'); };
  $('tabTqFeria').onclick = function () { switchTqTab('Feria'); renderFeriaGasto(); };
  $('tabTqReci').onclick = function () { switchTqTab('Reci'); renderTqReci(); };
  var q = $('tqReciQ'); if (q) q.oninput = renderTqReci;
  var f = $('tqReciF'); if (f) f.onchange = renderTqReci;
  $('truAdd').onclick = function () {
    var d = clean($('truDet').value, 60); if (!d) return alert('Describe el intercambio');
    getTrueque().push({ id: uid('tq'), modo: $('truModo').value, fecha: $('truFecha').value || todayKey(), detalle: d, valor: +$('truValor').value || 0, quien: clean($('truQuien').value, 30) });
    save(); $('truDet').value = ''; $('truValor').value = ''; renderTrueque();
  };
}

/* ============================================================
   9) MINGA / RED DE APOYO
   ============================================================ */
function getMinga() { var a = store('mingaLog', []); return Array.isArray(a) ? a : []; }
function renderMinga() {
  var box = $('mingaList'); if (!box) return;
  var data = getMinga();
  if (!data.length) { box.innerHTML = '<p class="muted">Sin llamados. Crea el primero: techo, cosecha rápida antes de tormenta, limpieza...</p>'; return; }
  box.innerHTML = data.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).map(function (r) {
    return '<div class="habit-item" style="' + (r.estado === 'Abierto' ? 'border-color:var(--gold)' : 'opacity:.7') + '"><b>' + (r.estado === 'Abierto' ? '📢' : '✓') + ' ' + esc(r.titulo) + '</b> <span class="chip" style="font-size:10px">' + esc(r.estado) + '</span><br>' +
      '<span class="muted" style="font-size:11px">📍 ' + esc(r.lugar) + ' · 📅 ' + r.fecha + ' ' + esc(r.hora || '') + '<br>🙌 Se necesita: ' + esc(r.ayuda) + '<br>📞 ' + esc(r.contacto) + (r.asist ? ' · ✅ Van ' + esc(r.asist) : '') + '</span>' +
      '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><button class="btn" style="width:auto;font-size:11px" data-join="' + r.id + '">🙋 Me sumo</button><button class="btn" style="width:auto;font-size:11px" data-toggle="' + r.id + '">' + (r.estado === 'Abierto' ? '✓ Cerrar' : '↻ Reabrir') + '</button><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤 Difundir</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar llamado?')) return; var d = getMinga(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderMinga(); }; });
  box.querySelectorAll('[data-toggle]').forEach(function (b) { b.onclick = function () { var d = getMinga(); var r = d.find(function (x) { return x.id === b.getAttribute('data-toggle'); }); if (!r) return; r.estado = r.estado === 'Abierto' ? 'Cerrado' : 'Abierto'; save(); renderMinga(); }; });
  box.querySelectorAll('[data-join]').forEach(function (b) { b.onclick = function () { var n = prompt('¿Tu nombre? (quedará en la lista local)'); if (!n) return; var d = getMinga(); var r = d.find(function (x) { return x.id === b.getAttribute('data-join'); }); if (!r) return; r.asist = (r.asist ? r.asist + ', ' : '') + clean(n, 20); save('¡Te sumaste! 🤝'); renderMinga(); }; });
  box.querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var d = getMinga(); var r = d.find(function (x) { return x.id === b.getAttribute('data-share'); }); if (!r) return; share('🤝 Llamado a Minga: ' + r.titulo, '📍 ' + r.lugar + '\n📅 ' + r.fecha + ' ' + (r.hora || '') + '\n🙌 Se necesita: ' + r.ayuda + '\n📞 ' + r.contacto + '\n(Aviso de vecin@s en radio cercano · Penco)'); }; });
}
function setupMinga() {
  makeDialog('mingaDialog', '🤝 Minga · red de apoyo',
    'Organiza trabajos comunitarios: levantar un techo, cosechar rápido antes de tormenta. <b>Offline-first:</b> todo funciona sin internet; difunde por Bluetooth / Wi-Fi Direct / boca a boca en un radio de ~2 km.',
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📢 Nuevo llamado</h4>' +
    '<label>Título <input type="text" id="minTit" placeholder="ej: Levantar techo de la vecina" maxlength="60"></label>' +
    '<div class="conv-row"><label>Lugar <input type="text" id="minLug" placeholder="ej: Lirquén, pasaje 3" maxlength="40"></label><label>Fecha <input type="date" id="minFec"></label><label>Hora <input type="time" id="minHor" value="09:00"></label></div>' +
    '<label>¿Qué ayuda se necesita? <input type="text" id="minAyu" placeholder="4 personas, escalera, martillos..." maxlength="80"></label>' +
    '<label>Contacto <input type="text" id="minCon" placeholder="nombre + teléfono o casa" maxlength="60"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="minAdd" class="btn btn-accent" style="width:auto">+ Llamar a Minga</button></div></div>' +
    '<div id="mingaList" class="habits-list" style="margin-top:10px;max-height:300px"></div>' +
    '<p class="muted" style="font-size:10px;margin-top:6px">Sin internet la app sigue mostrando tus llamados. Para avisar sin red usa compartir por Bluetooth / Nearby / Wi-Fi Direct de tu celular.</p>');
  var b = $('btnMinga'); if (b) b.onclick = function () { renderMinga(); openDlg('mingaDialog'); };
  $('minAdd').onclick = function () {
    var t = clean($('minTit').value, 60); if (!t) return alert('Ponle título al llamado');
    getMinga().push({ id: uid('mi'), titulo: t, lugar: clean($('minLug').value, 40), fecha: $('minFec').value || todayKey(), hora: $('minHor').value, ayuda: clean($('minAyu').value, 80), contacto: clean($('minCon').value, 60), estado: 'Abierto', asist: '' });
    save('Minga convocada 🤝'); $('minTit').value = ''; $('minAyu').value = ''; renderMinga();
  };
}

/* ============================================================
   10) CIELO MAPUCHE (fusionado: pestana dentro de Astro 🔭)
   El dialogo separado #cieloDialog y el boton #btnCielo se eliminan;
   el contenido vive como pestana "Cielo Mapuche" dentro de #astroDialog.
   ============================================================ */
var CIELO_CONS = [
  { n: 'Choike (Ñandú)', e: 'Cruz del Sur + Epsilon Centauri', d: 'El avestruz andino que cruza el cielo del sur. Su cuello (la Cruz) apunta al polo sur celeste: brújula natural de navegantes y pescadores del Golfo.' },
  { n: 'Ruka (la Casa / Vía Láctea)', e: 'Franja lechosa este-oeste', d: 'La casa grande de arriba. En invierno se ve altísima y nítida desde la costa de Penco en luna nueva: el mejor momento para pedir deseos y contar epew.' },
  { n: 'Wüñelfe (el Lucero)', e: 'Venus al amanecer/atardecer', d: 'Estrella de la mañana. Anuncia el día; los pescadores salen cuando aparece. No es estrella: es el planeta Venus.' },
  { n: 'Wangülen (las Estrellas)', e: 'Pléyades y estrellas brillantes', d: 'Cada wangülen es un antepasado que mira. Cielo muy estrellado = aire limpio y estable, buena señal para sembrar.' },
  { n: 'Melipal (las Cuatro)', e: 'Cruz del Sur (4 puntas)', d: 'Las cuatro estrellas que sostienen el cielo. Cuando están altas al sur a medianoche, es pleno verano (Walüng).' }
];
function getCieloLluvias() {
  try {
    var ev = (typeof EVENTOS_ASTRONOMICOS !== 'undefined') ? EVENTOS_ASTRONOMICOS : ((window.pencoData || {}).EVENTOS_ASTRONOMICOS || []);
    return ev.filter(function (e) { return e.tipo === 'lluvia'; });
  } catch (e) { return []; }
}
function renderCieloPanel() {
  var k = todayKey(), illum = null;
  try { var mi = window.astro.moonInfo(new Date(k + 'T12:00:00').getTime()); illum = Math.round((mi.fraction || 0) * 100); } catch (e) {}
  var buena = illum !== null && illum < 35;
  var todayBox = $('astroTodayBox');
  if (todayBox) {
    todayBox.innerHTML = '<h4 style="color:var(--gold)">✨ Cielo Mapuche · hoy ' + k + '</h4>' +
      '<p class="muted" style="font-size:12px">Iluminación lunar ~' + (illum === null ? '?' : illum + '%') + ' → ' + (buena ? '<b style="color:#8fd694">✓ Buena noche para Ruka y estrellas</b> (busca oscuridad en Playa Negra / borde costero).' : '<b style="color:#e8c56a">Luna brillante: mejor para epew junto al fuego que para cielo profundo.</b>') + '</p>';
  }
  var list = $('astroList'); if (!list) return;
  var lluvias = getCieloLluvias();
  list.innerHTML = '<p class="muted" style="line-height:1.5">Mapa del hemisferio sur: constelaciones mapuche, lluvias de estrellas y cuándo ver la Vía Láctea desde la costa.</p>' +
    '<div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">' + CIELO_CONS.map(function (c) { return '<div class="si-card"><h4>⭐ ' + esc(c.n) + '</h4><p class="muted" style="font-size:11px">🔭 ' + esc(c.e) + '</p><p>' + esc(c.d) + '</p></div>'; }).join('') + '</div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>☄️ Calendario de lluvias de estrellas</h4>' +
    (lluvias.length ? lluvias.map(function (e) { return '<div class="habit-item" style="font-size:12px">☄️ <b>' + esc(e.nombre) + '</b> · ' + e.date + '<br><span class="muted">' + esc(e.desc) + '</span></div>'; }).join('') : '<p class="muted">Sin datos de lluvias.</p>') +
    '<p class="muted" style="font-size:11px;margin-top:6px">🌌 Vía Láctea (Ruka): más visible en <b>Pukem (jun-ago), luna nueva, 22:00-04:00</b>, lejos de luces de Talcahuano. Luna llena la borra: prefiere semana de luna nueva.</p></div>';
}
function setupCieloFusion() {
  try { cleanupCieloSeparado(); } catch (e) {}
  var tabYear = $('tabAstroYear');
  if (!tabYear) { window._cieloAstroRetry = (window._cieloAstroRetry || 0) + 1; if (window._cieloAstroRetry < 40) setTimeout(setupCieloFusion, 500); return; }
  if (!$('tabAstroCielo')) {
    var bC = document.createElement('button');
    bC.type = 'button'; bC.id = 'tabAstroCielo'; bC.className = 'btn'; bC.style.width = 'auto';
    bC.textContent = '✨ Cielo Mapuche';
    tabYear.parentNode.appendChild(bC);
    bC.onclick = function () { try { renderAstroDialog('cielo'); } catch (e) {} };
  }
  try {
    var btn = $('btnAstro');
    if (btn && btn.dataset && btn.dataset.keywords && btn.dataset.keywords.indexOf('mapuche') < 0) btn.dataset.keywords += ' mapuche cielo oscuro choike via lactea ruka wuñelfe wangulen melipal cruz sur lucero estrella';
  } catch (e) {}
  if (typeof renderAstroDialog === 'function' && !window._cieloAstroWrapped) {
    window._cieloAstroWrapped = true;
    var origAstro = renderAstroDialog;
    renderAstroDialog = function (tab) {
      if (tab === 'cielo') {
        try { astroTab = 'cielo'; } catch (e) {}
        ['tabAstroUpcoming', 'tabAstroMesLunar', 'tabAstroYear'].forEach(function (id) { var el = $(id); if (el) el.classList.remove('btn-accent'); });
        var tc = $('tabAstroCielo'); if (tc) tc.classList.add('btn-accent');
        try { renderCieloPanel(); } catch (e) {}
        return;
      }
      var r = origAstro(tab);
      var tc2 = $('tabAstroCielo'); if (tc2) tc2.classList.remove('btn-accent');
      return r;
    };
  }
  var b = $('btnAstro');
  if (b && !(b.onclick && b.onclick._cieloWrapped)) {
    var prev = b.onclick;
    var wrapped = function (ev) {
      try { if (typeof prev === 'function') prev.call(b, ev); } catch (e) {
        try { renderAstroDialog('upcoming'); } catch (e2) {}
        try { $('astroDialog').showModal(); } catch (e3) {}
      }
    };
    wrapped._cieloWrapped = true;
    b.onclick = wrapped;
  }
}

/* ============================================================
   11) EPEW (fusionado: pestana dentro de Cuentos 📖)
   El dialogo separado #epewDialog y el boton #btnEpew se eliminan;
   el contenido vive como pestana "Epew" dentro de #talesDialog.
   ============================================================ */
function epewFaseHoy() {
  var k = todayKey(), fase = 'Historias para cada luna';
  try {
    var mi = window.astro.moonInfo(new Date(k + 'T12:00:00').getTime());
    var ph = (mi.phase || 0);
    fase = ph < 0.13 || ph > 0.87 ? 'Luna Nueva · historias de misterio 🌑' : (ph < 0.37 ? 'Luna Creciente · historias de aprendizaje 🌒' : (ph < 0.63 ? 'Luna Llena · historias de celebración 🌕' : 'Luna Menguante · historias de consejo 🌘'));
  } catch (e) {}
  return { key: k, fase: fase };
}
var epewEditId = null;
function getEpewMios() { var a = store('epewMios', []); return Array.isArray(a) ? a : []; }
function renderEpewDentroTales() {
  var box = $('epewListInTales'); if (!box) return;
  var hoy = $('epewHoyInTales');
  var info = epewFaseHoy();
  if (hoy) hoy.textContent = '🌙 Hoy: ' + info.fase + '. Sugerencia: elige el epew con esa energía.';
  var mios = getEpewMios();
  var base = EPEW.map(function (e, i) {
    return '<div class="si-card"><h4>🦊 ' + esc(e.t) + '</h4><p class="muted" style="font-size:11px">🌙 ' + esc(e.energia) + '</p><p>' + esc(e.txt) + '</p><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn" style="width:auto;font-size:11px" data-hear="' + i + '">🔊 Escuchar</button><button type="button" class="btn" style="width:auto;font-size:11px" data-share="' + i + '">📤 Compartir</button></div></div>';
  }).join('');
  var propios = mios.length ? mios.slice().sort(function (a, b) { return (b.creado || '').localeCompare(a.creado || ''); }).map(function (e) {
    return '<div class="si-card" style="border-style:dashed;border-color:var(--gold)"><h4>✍️ ' + esc(e.t) + ' <span class="chip" style="font-size:10px">mi epew</span></h4><p class="muted" style="font-size:11px">🌙 ' + esc(e.energia || 'Todas las lunas') + '</p><p>' + esc(e.txt) + '</p><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn" style="width:auto;font-size:11px" data-mihear="' + e.id + '">🔊 Escuchar</button><button type="button" class="btn" style="width:auto;font-size:11px" data-mishare="' + e.id + '">📤 Compartir</button><button type="button" class="btn" style="width:auto;font-size:11px" data-miedit="' + e.id + '">✏️ Editar</button><button type="button" class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-midel="' + e.id + '">✕ Borrar</button></div></div>';
  }).join('') : '<p class="muted" style="font-size:11px">Aún no agregas tu epew. Escribe el primero abajo: lo que te contó tu abuela, lo del fuego, lo del mar.</p>';
  box.innerHTML = base +
    '<div class="menstrual-card" style="margin-top:4px;border-style:dashed;border-color:var(--gold)"><h4>✍️ Mis epew — tradición viva</h4>' + propios + '</div>';
  box.querySelectorAll('[data-hear]').forEach(function (x) { x.onclick = function () { var e = EPEW[+x.getAttribute('data-hear')]; speak(e.t + '. ' + e.txt); }; });
  box.querySelectorAll('[data-share]').forEach(function (x) { x.onclick = function () { var e = EPEW[+x.getAttribute('data-share')]; share('🦊 ' + e.t, e.txt); }; });
  box.querySelectorAll('[data-mihear]').forEach(function (x) { x.onclick = function () { var e = getEpewMios().find(function (y) { return y.id === x.getAttribute('data-mihear'); }); if (e) speak(e.t + '. ' + e.txt); }; });
  box.querySelectorAll('[data-mishare]').forEach(function (x) { x.onclick = function () { var e = getEpewMios().find(function (y) { return y.id === x.getAttribute('data-mishare'); }); if (e) share('🦊 ' + e.t + ' (mi epew)', e.txt); }; });
  box.querySelectorAll('[data-midel]').forEach(function (x) { x.onclick = function () { if (!confirm('¿Borrar tu epew?')) return; var d = getEpewMios(); var i = d.findIndex(function (y) { return y.id === x.getAttribute('data-midel'); }); if (i >= 0) d.splice(i, 1); save('Epew borrado'); renderEpewDentroTales(); }; });
  box.querySelectorAll('[data-miedit]').forEach(function (x) { x.onclick = function () { var e = getEpewMios().find(function (y) { return y.id === x.getAttribute('data-miedit'); }); if (!e) return; epewEditId = e.id; $('epewMiTit').value = e.t; $('epewMiEnergia').value = e.energia || 'Luna Llena · celebración 🌕'; $('epewMiTxt').value = e.txt; $('epewMiAdd').textContent = '↻ Actualizar mi epew'; $('epewMiCancelEdit').classList.remove('hidden'); $('epewMiTit').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }; });
  var st = $('epewMiStats');
  if (st) st.textContent = mios.length + (mios.length === 1 ? ' epew propio guardado (privado)' : ' epew propios guardados (privados)');
}
function switchTalesTab(t) {
  var esEpew = (t === 'epew');
  var grid = $('talesGrid'), reader = $('talesReader'), editBox = $('talesEditBox');
  var epewPanel = $('epewPanelInTales');
  if (grid) grid.classList.toggle('hidden', esEpew);
  if (reader && esEpew) reader.classList.add('hidden');
  if (editBox && esEpew) editBox.classList.add('hidden');
  if (epewPanel) epewPanel.classList.toggle('hidden', !esEpew);
  var b1 = $('tabTalesCuentos'), b2 = $('tabTalesEpew');
  if (b1) b1.classList.toggle('btn-accent', !esEpew);
  if (b2) b2.classList.toggle('btn-accent', esEpew);
}
function setupEpew() {
  try { cleanupEpewSeparado(); } catch (e) {}
  var dlg = $('talesDialog');
  if (!dlg) { window._epewTalesRetry = (window._epewTalesRetry || 0) + 1; if (window._epewTalesRetry < 40) setTimeout(setupEpew, 500); return; }
  if (!$('tabTalesEpew')) {
    var tabs = document.createElement('div');
    tabs.className = 'timer-tabs';
    tabs.style.cssText = 'margin-bottom:10px;flex-wrap:wrap';
    tabs.innerHTML = '<button type="button" id="tabTalesCuentos" class="btn btn-accent" style="width:auto">📖 Cuentos lunares</button>' +
      '<button type="button" id="tabTalesEpew" class="btn" style="width:auto">🦊 Epew · tradición oral</button>';
    var grid = $('talesGrid');
    if (grid && grid.parentNode) grid.parentNode.insertBefore(tabs, grid);
    var panel = document.createElement('div');
    panel.id = 'epewPanelInTales';
    panel.className = 'hidden';
    panel.innerHTML = '<p class="muted" style="line-height:1.5">Historias para compartir alrededor del fuego, organizadas por la energía de la luna: <b>misterio en Luna Nueva, celebración en Luna Llena.</b> Toca 🔊 para escuchar.</p>' +
      '<div id="epewHoyInTales" class="chip" style="display:block;white-space:normal;margin-bottom:8px"></div>' +
      '<div id="epewListInTales" style="display:flex;flex-direction:column;gap:8px;max-height:380px;overflow-y:auto"></div>' +
      '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>➕ Agregar mi epew / cuento</h4>' +
      '<p class="muted" style="font-size:11px">Guarda el que te contaron, el que inventaste con tus niños o el del territorio. Queda <b>privado y local</b> en tu usuario.</p>' +
      '<label>Título <input type="text" id="epewMiTit" placeholder="ej: El chucao de la quebrada" maxlength="60"></label>' +
      '<label>Energía lunar <select id="epewMiEnergia"><option>Luna Nueva · misterio 🌑</option><option>Luna Creciente · aprendizaje 🌒</option><option>Luna Llena · celebración 🌕</option><option>Luna Menguante · consejo 🌘</option><option>Todas las lunas 🌙</option></select></label>' +
      '<label>Cuento <textarea id="epewMiTxt" rows="4" placeholder="Había una vez en Penco..." style="min-height:80px"></textarea></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="epewMiAdd" class="btn btn-accent" style="width:auto">+ Guardar mi epew</button><button type="button" id="epewMiCancelEdit" class="btn hidden" style="width:auto">Cancelar</button></div>' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="epewMiStats" class="muted" style="font-size:11px"></span><button type="button" id="epewMiShareAll" class="btn" style="width:auto">📤 Compartir mis epew</button></div></div>';
    if (grid && grid.parentNode) grid.parentNode.insertBefore(panel, grid.nextSibling);
    else dlg.querySelector('form').appendChild(panel);
    $('tabTalesCuentos').onclick = function () { switchTalesTab('cuentos'); };
    $('tabTalesEpew').onclick = function () { renderEpewDentroTales(); switchTalesTab('epew'); };
    $('epewMiAdd').onclick = function () {
      var t = clean($('epewMiTit').value, 60);
      var txt = clean($('epewMiTxt').value, 2000);
      if (!t) return alert('Ponle título a tu epew');
      if (!txt) return alert('Escribe el cuento');
      var d = getEpewMios();
      if (epewEditId) {
        var r = d.find(function (y) { return y.id === epewEditId; });
        if (r) { r.t = t; r.txt = txt; r.energia = $('epewMiEnergia').value; }
        epewEditId = null;
        $('epewMiAdd').textContent = '+ Guardar mi epew';
        $('epewMiCancelEdit').classList.add('hidden');
      } else {
        d.push({ id: uid('ew'), t: t, txt: txt, energia: $('epewMiEnergia').value, creado: todayKey() });
      }
      save('Epew guardado 🦊'); $('epewMiTit').value = ''; $('epewMiTxt').value = ''; renderEpewDentroTales();
    };
    $('epewMiCancelEdit').onclick = function () {
      epewEditId = null; $('epewMiTit').value = ''; $('epewMiTxt').value = '';
      $('epewMiAdd').textContent = '+ Guardar mi epew'; $('epewMiCancelEdit').classList.add('hidden');
    };
    $('epewMiShareAll').onclick = function () {
      var d = getEpewMios(); if (!d.length) return alert('Aún no tienes epew propios');
      share('🦊 Mis epew', d.map(function (e) { return '· ' + e.t + ' (' + (e.energia || '') + ')\n' + e.txt; }).join('\n\n'));
    };
  }
  var b = $('btnTales');
  if (b && !b.dataset.epewWrapped) {
    b.dataset.epewWrapped = '1';
    var prev = b.onclick;
    b.onclick = function (ev) {
      try { if (typeof prev === 'function') prev.call(b, ev); } catch (e) {
        try { if (typeof renderTalesGrid === 'function') renderTalesGrid(); } catch (e2) {}
        try { $('talesDialog').showModal(); } catch (e3) {}
      }
      try { renderEpewDentroTales(); } catch (e) {}
      try { switchTalesTab('cuentos'); } catch (e) {}
      try {
        var btn = document.querySelector('#btnTales');
        if (btn && btn.dataset && btn.dataset.keywords && btn.dataset.keywords.indexOf('epew') < 0) btn.dataset.keywords += ' epew tradicion oral zorro puma caleuche pincoya mito golfo arauco fuego luna';
      } catch (e) {}
    };
  } else {
    try {
      var btn2 = $('btnTales');
      if (btn2 && btn2.dataset && btn2.dataset.keywords && btn2.dataset.keywords.indexOf('epew') < 0) btn2.dataset.keywords += ' epew tradicion oral zorro puma caleuche pincoya mito golfo arauco fuego luna';
    } catch (e) {}
  }
  try { renderEpewDentroTales(); } catch (e) {}
}

/* ============================================================
   12) KIMUN TERRITORIAL (fusionado: pestana dentro de Kimun Mapuzugun)
   El curso original #mapuDialog (palabra, numeros, intermedio, avanzado,
   lunas, quiz) se conserva intacto; se agrega la pestana "Territorial"
   con el diccionario del lugar. Sin boton ni dialogo separados.
   ============================================================ */
function terrListHTML(q) {
  q = (q || '').toLowerCase();
  var list = KIMUN.filter(function (w) { return !q || (w[0] + ' ' + w[1] + ' ' + w[2]).toLowerCase().indexOf(q) >= 0; });
  if (!list.length) return '<p class="muted">Sin resultados. Prueba "ave", "mar", "huerta", "cielo".</p>';
  return list.map(function (w) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span><b>' + esc(w[0]) + '</b> <span class="chip" style="font-size:10px">' + esc(w[1]) + '</span><br><span class="muted" style="font-size:11px">' + esc(w[2]) + '</span></span><button class="btn" style="width:auto" data-say="' + esc(w[0]) + '" title="Escuchar pronunciacion aproximada">🔊</button></div>';
  }).join('');
}
function bindTerrSpeaks(scope) {
  (scope || document).querySelectorAll('[data-say]').forEach(function (x) {
    x.onclick = function () { speak(x.getAttribute('data-say')); };
  });
}
function paintTerritorial() {
  var box = $('mapuPanel'); if (!box) return;
  box.innerHTML =
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🗺️ Kimün Territorial — el mapuzugun del lugar</h4>' +
    '<p class="muted" style="font-size:11px">No es de la A a la Z: es territorial. <b>"¿Cómo se dice esta ave del humedal? ¿Esta herramienta de pesca?"</b> 🔊 Pronunciación aproximada; ideal: grabar a hablantes locales y practicar en el lugar.</p>' +
    '<label>Buscar <input type="text" id="mpTerrQ" placeholder="ave, mar, huerta, cielo, casa..." autocomplete="off"></label></div>' +
    '<div id="mpTerrList" class="habits-list" style="margin-top:10px;max-height:340px"></div>' +
    '<p class="muted" style="font-size:10px;margin-top:6px">💡 Pide a un hablante local que te grabe un audio por WhatsApp y escúchalo en el humedal, el bote o la huerta. El kimün se aprende en el territorio.</p>';
  var q = $('mpTerrQ');
  $('mpTerrList').innerHTML = terrListHTML('');
  bindTerrSpeaks(box);
  if (q) q.oninput = function () { $('mpTerrList').innerHTML = terrListHTML(q.value); bindTerrSpeaks($('mpTerrList')); };
}
function setupKimun() {
  var old = $('kimunDialog'); if (old) old.remove();
  var t1 = $('tabMP1'); if (!t1) return;
  if (!$('tabMP7')) {
    var b7 = document.createElement('button');
    b7.type = 'button'; b7.id = 'tabMP7'; b7.className = 'btn'; b7.style.width = 'auto';
    b7.textContent = '🗺️ Territorial';
    t1.parentNode.appendChild(b7);
    b7.onclick = function () { try { mapuQuizQ = null; } catch (e) {} renderMapuPanel('territorial'); };
  }
  if (!window._mpTerrWrapped && typeof renderMapuPanel === 'function') {
    window._mpTerrWrapped = true;
    var origMP = renderMapuPanel;
    renderMapuPanel = function (tab) {
      if (tab === 'territorial') {
        try { mapuTab = 'territorial'; } catch (e) {}
        ['tabMP1', 'tabMP2', 'tabMP3', 'tabMP4', 'tabMP5', 'tabMP6'].forEach(function (id) { var el = $(id); if (el) el.classList.remove('btn-accent'); });
        var m = $('tabMP7'); if (m) m.classList.add('btn-accent');
        try { if (typeof renderMapuStreak === 'function') renderMapuStreak(); } catch (e) {}
        paintTerritorial();
        return;
      }
      var r = origMP(tab);
      var m2 = $('tabMP7'); if (m2) m2.classList.remove('btn-accent');
      return r;
    };
  }
}

/* ============================================================
   13) MI PLAN CIRCADIANO (pestaña dentro de 🌞 Ritmo Circadiano)
   Fusionado sep 2026: antes botón propio btnRutina + rutinaDialog.
   Ahora vive en circadianDialog > ritmoPlanPanel (HTML estático).
   Datos preservados en la misma clave 'rutinaCfg'.
   ============================================================ */
function getRutina() { return store('rutinaCfg', { despierta: '07:00' }); }
function setupRutina() {
  // limpieza de la versión anterior (botón y diálogo propios)
  try { var rb = $('btnRutina'); if (rb && rb.parentNode) rb.parentNode.removeChild(rb); } catch (e0) {}
  try { var rd = $('rutinaDialog'); if (rd && rd.parentNode) rd.parentNode.removeChild(rd); } catch (e0) {}
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf) {
      var ri = ALL_BTNS.indexOf('btnRutina');
      if (ri >= 0) ALL_BTNS.splice(ri, 1);
    }
  } catch (e0) {}
  // precargar hora guardada al abrir la pestaña Mi plan
  try {
    var tp = $('tabRitmoPlan');
    if (tp && !tp.dataset.rutB) {
      tp.dataset.rutB = '1';
      tp.addEventListener('click', function () { try { $('rutHora').value = getRutina().despierta || '07:00'; } catch (e) {} });
    }
  } catch (e0) {}
  if (!$('rutGen') || !$('rutHora') || !$('rutPlan')) return;
  $('rutGen').onclick = function () {
    var h = $('rutHora').value || '07:00';
    try { getRutina().despierta = h; save(); } catch (e) {}
    var p = h.split(':'), base = (+p[0]) * 60 + (+p[1]);
    var f = function (m) { var t = base + m; t = ((t % 1440) + 1440) % 1440; return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
    var sol = { rise: null, set: null };
    try { var s = cal.sunForDay(Date.now()); if (s.rise) sol.rise = cal.fmtTime.format(new Date(s.rise)); if (s.set) sol.set = cal.fmtTime.format(new Date(s.set)); } catch (e) {}
    var bloques = [
      ['🌅 ' + f(0) + ' · Despertar + luz', 'Sol de Penco ~' + (sol.rise || '--') + '. Luz natural 10 min, agua, movimiento suave. Pico de cortisol: no redes.'],
      ['💪 ' + f(30) + '–' + f(150) + ' · Pico de foco', 'Tareas pesadas y estudio difícil aquí (trabajo, matemáticas, herramientas). Protege este bloque.'],
      ['🍲 ' + f(300) + ' · Almuerzo y pausa', 'Comida principal, caminata corta. Evita pantallas acostado.'],
      ['🎨 ' + f(420) + '–' + f(540) + ' · Creatividad', 'Ideas, música, huerta liviana, conversación. El cuerpo pide variar.'],
      ['📸 ' + (sol.set || f(660)) + ' · Hora dorada', 'Atardecer Penco ~' + (sol.set || '--') + '. Paseo, grounding descalzo, fotos, gratitud. Baja luces después.'],
      ['🌙 ' + f(780) + ' · Apagado', 'Cena liviana, luz roja/cálida, lectura o epew. Dormir ~' + f(900) + ' para 7-8 h.']
    ];
    $('rutPlan').innerHTML = bloques.map(function (x) { return '<div class="si-card"><h4>' + esc(x[0]) + '</h4><p>' + esc(x[1]) + '</p></div>'; }).join('') +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="rutShare" class="btn" style="width:auto">📤 Compartir mi plan</button></div>';
    $('rutShare').onclick = function () { share('🧘 Mi rutina circadiana (despierto ' + h + ')', bloques.map(function (x) { return '· ' + x[0] + ': ' + x[1]; }).join('\n')); };
  };
}

/* ============================================================
   14) FERTILIDAD SINTOTERMICA + 1000 DIAS (privado)
   Pestañas: Registro diario · Ventana fértil · 1000 días
   (embarazo, bebé, crecimiento, vacunas, hitos, acompañamiento).
   Todo local y privado por usuario (store + save). Educativo, no médico.
   ============================================================ */
function getFerti() { var a = store('fertiLog', []); return Array.isArray(a) ? a : []; }
function getFertiMeta() { var o = store('fertiMeta', { intencion: 'registrar' }); if (typeof o !== 'object' || !o) return { intencion: 'registrar' }; return o; }
function fertiNum(t) { var n = parseFloat(String(t == null ? '' : t).replace(',', '.')); return isFinite(n) ? n : null; }
function fertiStarts(s) {
  // inicios de ciclo: primer día de cada racha de sangrado
  var starts = [];
  for (var i = 0; i < s.length; i++) {
    if (s[i].moco === 'sangrado' && (i === 0 || s[i - 1].moco !== 'sangrado' || diffDays(s[i - 1].fecha, s[i].fecha) > 2)) starts.push(s[i].fecha);
  }
  return starts;
}
function diffDays(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }
function renderFerti() {
  var box = $('fertiList'); if (!box) return;
  var meta = getFertiMeta();
  if ($('ferInt') && document.activeElement !== $('ferInt')) $('ferInt').value = meta.intencion || 'registrar';
  var data = getFerti();
  if (!data.length) { box.innerHTML = '<p class="muted">Sin registros. Marca cada mañana tu temp + moco y la ventana fértil se estimará sola. Todo queda solo en este dispositivo.</p>'; if ($('fertiInfo')) $('fertiInfo').innerHTML = ''; }
  else {
    var s = data.slice().sort(function (a, b) { return a.fecha.localeCompare(b.fecha); });
    var ult = s[s.length - 1];
    var pico = null;
    for (var i = s.length - 1; i >= 0; i--) { if (s[i].moco === 'clara elástica') { pico = s[i]; break; } }
    var lh = null;
    for (var j = s.length - 1; j >= 0; j--) { if (s[j].lh === 'positivo') { lh = s[j]; break; } }
    var info = '📅 Último registro: <b>' + ult.fecha + '</b> · temp ' + (ult.temp || '—') + '°C · moco: ' + (ult.moco || '—') + (ult.lh && ult.lh !== '—' ? ' · LH: ' + ult.lh : '');
    if (pico) info += '<br>💧 Pico de moco fértil: <b>' + pico.fecha + '</b> → ventana aprox pico ±5 días (referencial).';
    if (lh) info += '<br>🧪 Último LH positivo: <b>' + lh.fecha + '</b> → ovulación probable en 24-36 h.';
    var inten = meta.intencion === 'buscar' ? '🤍 Intención: <b>buscar embarazo</b> — enfoca el registro en la ventana fértil.' : (meta.intencion === 'evitar' ? '🛡️ Intención: <b>evitar embarazo</b> — este registro solo NO basta como anticonceptivo: usa método seguro + guía de matrona.' : '📝 Intención: <b>solo registrar y conocerme</b>.');
    info += '<br>' + inten;
    info += '<br><span class="muted">Regla sintotérmica: 3 temps altas seguidas sobre la línea base + pico de moco confirman ovulación pasada. No es método anticonceptivo seguro por sí solo: fórmate con profesional/matrona.</span>';
    $('fertiInfo').innerHTML = info;
    box.innerHTML = s.slice().reverse().slice(0, 60).map(function (r) {
      return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + r.fecha + '</b> · 🌡️ ' + esc(r.temp || '—') + '°C · 💧 ' + esc(r.moco || '—') + (r.lh && r.lh !== '—' ? ' · 🧪LH ' + esc(r.lh) : '') + '<br><span class="muted" style="font-size:11px">🤍 cérvix: ' + esc(r.cervix || '—') + (r.rel ? ' · 💞 relaciones' : '') + (r.nota ? ' · ' + esc(r.nota) : '') + '</span></span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
    }).join('');
    box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar registro íntimo?')) return; var d = getFerti(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderFerti(); renderFerVent(); }; });
  }
  try { renderFerVent(); } catch (e) {}
}
function renderFerVent() {
  var box = $('ferVenBox'); if (!box) return;
  var hoy = todayKey();
  var s = getFerti().slice().sort(function (a, b) { return a.fecha.localeCompare(b.fecha); });
  if (!s.length) { box.innerHTML = '<p class="muted">Aún sin datos. Con 1 ciclo de sangrados + temps + moco verás aquí tu ventana estimada, tu día del ciclo y el estado de hoy.</p>'; return; }
  var starts = fertiStarts(s);
  var lastStart = starts.length ? starts[starts.length - 1] : null;
  var lens = [];
  for (var i = 1; i < starts.length; i++) { var L = diffDays(starts[i - 1], starts[i]); if (L >= 20 && L <= 45) lens.push(L); }
  lens = lens.slice(-3);
  var avgLen = lens.length ? Math.round(lens.reduce(function (a, b) { return a + b; }, 0) / lens.length) : 28;
  var diaCiclo = lastStart ? diffDays(lastStart, hoy) + 1 : null;
  var ovu = lastStart ? addDaysKey(lastStart, avgLen - 14) : null;
  var fIni = ovu ? addDaysKey(ovu, -5) : null, fFin = ovu ? addDaysKey(ovu, 1) : null;
  var enVentana = (ovu && hoy >= fIni && hoy <= fFin);
  // alza térmica: últimas 3 temps sobre el máx de las 6 previas (+0.15)
  var temps = s.map(function (r) { return { f: r.fecha, t: fertiNum(r.temp) }; }).filter(function (x) { return x.t !== null; });
  var alza = false, base = null;
  if (temps.length >= 9) {
    var prev = temps.slice(-9, -3).map(function (x) { return x.t; });
    var ult3 = temps.slice(-3).map(function (x) { return x.t; });
    base = Math.max.apply(null, prev);
    alza = ult3.every(function (t) { return t > base + 0.15; });
  }
  var meta = getFertiMeta();
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌿 Hoy: ' + hoy + '</h4>';
  if (diaCiclo !== null && diaCiclo >= 1 && diaCiclo <= avgLen + 5) html += '<p style="font-size:13px">📍 Día <b>' + diaCiclo + '</b> del ciclo (ciclo ref ~' + avgLen + ' días' + (lens.length ? ' · promedio de ' + lens.length + ' ciclos' : ' · supuesto 28, registra sangrados para afinar') + ').</p>';
  else html += '<p style="font-size:13px">📍 Sin inicio de ciclo claro: marca <b>sangrado</b> en moco cuando menstrúes.</p>';
  if (ovu) html += '<p style="font-size:13px">✨ Ovulación estimada: <b>' + ovu + '</b><br>💧 Ventana fértil aprox: <b>' + fIni + ' → ' + fFin + '</b> ' + (enVentana ? '<span class="chip" style="background:#8fd69433;color:#8fd694;border-color:#8fd69466">HOY en ventana</span>' : '<span class="muted">(hoy fuera de ventana)</span>') + '</p>';
  html += '<p style="font-size:12px">🌡️ Alza térmica sostenida: <b>' + (alza ? 'SÍ — probable post-ovulación (base ' + base.toFixed(2) + '°C)' : 'no detectada aún') + '</b></p>';
  if (meta.intencion === 'buscar') html += '<p style="font-size:12px">🤍 Buscar: relaciones días alternos en ' + (ovu ? '<b>' + fIni + ' → ' + fFin + '</b>' : 'la ventana') + ' + ácido fólico diario + control preconcepcional con matrona.</p>';
  else if (meta.intencion === 'evitar') html += '<p style="font-size:12px">🛡️ Evitar: este calendario <b>no protege solo</b>. En ventana fértil usa preservativo u otro método seguro. Ante duda o atraso, test + matrona.</p>';
  html += '<p class="muted" style="font-size:11px">Estimación educativa con tus datos locales. Se afina con cada ciclo registrado. Cruza con 🌸 Ciclo del calendario.</p>';
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" id="ferVerCiclo" class="btn" style="width:auto">🌸 Ver mi Ciclo</button></div></div>';
  box.innerHTML = html;
  if ($('ferVerCiclo')) $('ferVerCiclo').onclick = function () { try { var b = $('btnMenstrual'); if (b) b.click(); } catch (e2) {} };
}
function switchFerTab(t) {
  [['Reg', 'ferRegPanel'], ['Ven', 'ferVenPanel'], ['Mil', 'ferMilPanel']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $('tabFer' + x[0]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
}
function setupFerti() {
  addKw('btnFerti', 'embarazo parto puerperio bebe guagua lactancia hitos 1000 dias fur fpp semana gestacion ovulacion test lh buscar evitar');
  makeDialog('fertiDialog', '🤰 Fertilidad Natural + 1000 días',
    '<b>Privado y local:</b> nada sale de este dispositivo. Método sintotérmico (temperatura basal + moco cervical + test LH opcional) y acompañamiento de los 1000 días. <b>Educativo, no médico.</b>',
    '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
    '<button type="button" id="tabFerReg" class="btn btn-accent" style="width:auto">📝 Registro</button>' +
    '<button type="button" id="tabFerVen" class="btn" style="width:auto">🌿 Ventana fértil</button>' +
    '<button type="button" id="tabFerMil" class="btn" style="width:auto">🤱 1000 días</button></div>' +
    '<div id="ferRegPanel">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Registro diario (al despertar, antes de levantarte)</h4>' +
    '<div class="conv-row"><label>Intención <select id="ferInt"><option value="registrar">📝 Solo registrarme</option><option value="buscar">🤍 Buscar embarazo</option><option value="evitar">🛡️ Evitar embarazo</option></select></label><label>Fecha <input type="date" id="ferFecha"></label><label>Temp basal °C <input type="number" id="ferTemp" min="35" max="38" step="0.05" placeholder="36.60"></label></div>' +
    '<div class="conv-row"><label>Moco cervical <select id="ferMoco"><option value="">—</option><option>seca</option><option>pegajosa</option><option>cremosa</option><option>clara elástica</option><option>sangrado</option></select></label><label>Test LH <select id="ferLH"><option value="—">—</option><option>negativo</option><option>positivo</option></select></label><label>Cérvix <select id="ferCerv"><option value="">—</option><option>bajo/duro/cerrado</option><option>alto/blando/abierto</option></select></label><label class="check-row" style="align-self:flex-end"><input type="checkbox" id="ferRel"> 💞 relaciones</label></div>' +
    '<label>Notas <input type="text" id="ferNota" placeholder="enferma, trasnoche, alcohol, test..." maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="ferAdd" class="btn btn-accent" style="width:auto">+ Guardar</button></div></div>' +
    '<div id="fertiInfo" class="chip" style="display:block;white-space:normal;margin-top:10px"></div>' +
    '<div id="fertiList" class="habits-list" style="margin-top:10px;max-height:260px"></div></div>' +
    '<div id="ferVenPanel" class="hidden"><div id="ferVenBox"></div></div>' +
    '<div id="ferMilPanel" class="hidden"><div id="milSection"></div></div>');
  var b = $('btnFerti'); if (b) b.onclick = function () {
    if (!$('ferFecha').value) $('ferFecha').value = todayKey();
    switchFerTab('Reg'); renderFerti();
    try { renderMilDias(); } catch (e) {}
    openDlg('fertiDialog');
  };
  if ($('tabFerReg')) $('tabFerReg').onclick = function () { switchFerTab('Reg'); };
  if ($('tabFerVen')) $('tabFerVen').onclick = function () { switchFerTab('Ven'); renderFerVent(); };
  if ($('tabFerMil')) $('tabFerMil').onclick = function () { switchFerTab('Mil'); try { renderMilDias(); } catch (e) {} };
  if ($('ferInt')) $('ferInt').onchange = function () { try { userData().fertiMeta = { intencion: $('ferInt').value }; } catch (e) {} save('Intención guardada 🤍'); renderFerti(); };
  $('ferAdd').onclick = function () {
    var f = $('ferFecha').value || todayKey();
    var d = getFerti().filter(function (x) { return x.fecha !== f; });
    d.push({ id: uid('fe'), fecha: f, temp: $('ferTemp').value, moco: $('ferMoco').value, lh: $('ferLH').value, cervix: $('ferCerv').value, rel: $('ferRel').checked, nota: clean($('ferNota').value, 80) });
    try { userData().fertiLog = d; } catch (e) {}
    save('Guardado íntimo ✓'); $('ferTemp').value = ''; $('ferNota').value = ''; renderFerti();
  };
}

/* ============================================================
   15) DERECHOS Y DEBERES (Chile · Penco)
   Guia informativa + deberes comunitarios + como reclamar
   + registro privado local. No es asesoria legal.
   ============================================================ */
var DERECHOS_LIST = [
  { icon: '🧍', t: 'Igualdad y no discriminación', d: 'Misma dignidad ante la ley, sin distinción de origen, sexo, creencia o condición. Si te niegan un servicio por discriminar, puedes reclamar y denunciar.' },
  { icon: '🏥', t: 'Salud digna y oportuna', d: 'Atención en CESFAM/SAR Penco, AUGE-GES para patologías garantizadas, consentimiento informado y ficha clínica confidencial. Reclamos: OIRS del centro, Superintendencia de Salud.' },
  { icon: '📚', t: 'Educación', d: 'Acceso, no expulsión arbitraria, convivencia sin violencia, apoyo a NEE. Reclamos: convivencia escolar del colegio, Superintendencia de Educación.' },
  { icon: '💼', t: 'Trabajo digno', d: 'Contrato, sueldo mínimo, jornada máxima, pago de cotizaciones, fuero maternal y seguridad. Sin acoso laboral ni sexual. Reclamos: Inspección del Trabajo Concepción.' },
  { icon: '🛒', t: 'Consumidor (SERNAC)', d: 'Garantía legal 6 meses, derecho a retracto en compras online (10 días), información veraz de precios. Reclamos: SERNAC, Juzgado de Policía Local.' },
  { icon: '🏠', t: 'Vivienda y barrio digno', d: 'Postulación a subsidios (MINVU/SERVIU), gastos comunes transparentes, arriendo con contrato. Corte de luz/agua solo con aviso y procedimiento.' },
  { icon: '🌿', t: 'Medio ambiente sano', d: 'Aire, agua y borde costero libres de contaminación. Puedes denunciar microbasurales, ruidos y descargas en Municipalidad, SMA y Capitanía de Puerto.' },
  { icon: '🗣️', t: 'Cultura, lengua y participación', d: 'Derecho a la identidad mapuche, uso del mapuzugun y participación en juntas de vecinos, consultas y presupuestos participativos de Penco.' },
  { icon: '👶', t: 'Niñas, niños y adolescentes', d: 'Protección integral, buen trato, educación y salud. Si hay vulneración: OPD Penco, Tribunal de Familia, 800 730 800 (Fono Infancia).' },
  { icon: '👵', t: 'Personas mayores y discapacidad', d: 'Trato preferente en salud y trámites, accesibilidad, no maltrato. SENAMA 800 400 035 · SENADIS. Credencial de discapacidad en COMPIN.' },
  { icon: '🔒', t: 'Datos personales y privacidad', d: 'Tus datos del calendario quedan solo en este dispositivo. Frente a empresas: derecho a saber, rectificar y borrar tus datos (Ley 19.628).' },
  { icon: '🚔', t: 'Ante Carabineros / PDI / Fiscalía', d: 'Puedes pedir identificación al funcionario, guardar silencio, llamar a un familiar/abogado y denunciar apremios. Denuncias: Fiscalía, 133/134, PDI.' }
];
var DEBERES_LIST = [
  { icon: '📜', t: 'Respetar la ley y a las personas', d: 'No violencia, no insultos ni amenazas, resolver por diálogo o mediación vecinal. El ejemplo parte en casa.' },
  { icon: '🌊', t: 'Cuidar el mar y el humedal', d: 'Respeta vedas y tallas, no dejes basura en Playa Negra ni Rocuant, corta cochayuyo sin arrancar raíz, deja 30% en la roca.' },
  { icon: '🌳', t: 'Cuidar el bosque y el cerro', d: 'No hagas fuego en bosque, vuelve con tu basura, planta nativo en Pukem, controla zarza y eucalipto invasor.' },
  { icon: '🐾', t: 'Tenencia responsable', d: 'Vacuna, esteriliza, pasea con correa, recoge fecas, no abandones. Denuncia maltrato (ver 🐾 Cuidado Animal).' },
  { icon: '🔥', t: 'Prevenir incendios y riesgos', d: 'Mantén leña lejos de la estufa, limpia cañón, ten extintor y vía de evacuación clara. En sismo/tsunami sigue rutas (ver 🌊🚨 Evacuación).' },
  { icon: '🏘️', t: 'Buena vecindad', d: 'Ruidos solo hasta las 23:00, basura en día y hora de recolección, vereda despejada, mascotas contenidas, avisa tus trabajos ruidosos.' },
  { icon: '🗳️', t: 'Participar y votar', d: 'Votar informado, asistir a asamblea de junta de vecinos, cuidar espacios públicos y mobiliario común.' },
  { icon: '🤝', t: 'Minga y solidaridad', d: 'Hoy por ti, mañana por mí: apoya cosechas, techos y limpiezas. Usa 🤝 Minga para convocar.' },
  { icon: '💰', t: 'Cumplir compromisos', d: 'Paga arriendo, pensión de alimentos y deudas a tiempo. Si no puedes, renegocia antes de que crezca.' }
];
function getDerechosLog() { var a = store('derechosLog', []); return Array.isArray(a) ? a : []; }
function renderDerechosList() {
  var box = $('derList'); if (!box) return;
  var q = (($('derQ') || {}).value || '').toLowerCase();
  var list = DERECHOS_LIST.filter(function (x) { return !q || (x.t + ' ' + x.d).toLowerCase().indexOf(q) >= 0; });
  box.innerHTML = list.length ? list.map(function (x) {
    return '<div class="si-card"><h4>' + x.icon + ' ' + esc(x.t) + '</h4><p>' + esc(x.d) + '</p></div>';
  }).join('') : '<p class="muted">Sin resultados. Prueba con "salud", "trabajo" o "consumidor".</p>';
}
function renderDeberesList() {
  var box = $('debCheck'); if (!box) return;
  var done = store('deberesCheck', {});
  var list = DEBERES_LIST;
  var n = list.filter(function (_, i) { return done['d' + i]; }).length;
  box.innerHTML = '<p class="muted" style="font-size:11px">✅ Mi compromiso comunitario: <b>' + n + ' / ' + list.length + '</b> deberes que practico. Queda solo en este dispositivo.</p>' +
    '<div class="dio-compact">' + list.map(function (x, i) {
      var k = 'd' + i, c = done[k] ? ' done' : '';
      return '<label class="dio-item' + c + '"><input type="checkbox" data-deb="' + k + '"' + (done[k] ? ' checked' : '') + '><span class="dio-txt"><b>' + x.icon + ' ' + esc(x.t) + '</b><small>' + esc(x.d) + '</small></span><span class="dio-check">' + (done[k] ? '✓ practico' : 'marcar') + '</span></label>';
    }).join('') + '</div>';
  box.querySelectorAll('[data-deb]').forEach(function (c) {
    c.onchange = function () { var d = store('deberesCheck', {}); d[c.getAttribute('data-deb')] = c.checked; save(c.checked ? 'Compromiso anotado 🤝' : 'Guardado'); renderDeberesList(); };
  });
}
function renderDerechosLog() {
  var box = $('derLog'); if (!box) return;
  var data = getDerechosLog();
  var st = $('derStats');
  if (!data.length) { box.innerHTML = '<p class="muted">Sin anotaciones. Registra aquí tu caso para llevar orden (fecha, a quién reclamaste, folio).</p>'; if (st) st.textContent = '0 casos'; return; }
  box.innerHTML = data.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).map(function (r) {
    return '<div class="habit-item"><b>' + esc(r.tema) + '</b> <span class="chip" style="font-size:10px">' + esc(r.estado) + '</span><br>' +
      '<span class="muted" style="font-size:11px">📅 ' + r.fecha + (r.lugar ? ' · 📍 ' + esc(r.lugar) : '') + (r.folio ? ' · 🧾 folio ' + esc(r.folio) : '') + (r.nota ? '<br>📝 ' + esc(r.nota) : '') + '</span>' +
      '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><button class="btn" style="width:auto;font-size:11px" data-ok="' + r.id + '">✓ Avanzar estado</button><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤 Compartir</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('');
  if (st) st.textContent = data.length + ' casos en seguimiento';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar anotación?')) return; var d = getDerechosLog(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderDerechosLog(); }; });
  box.querySelectorAll('[data-ok]').forEach(function (b) { b.onclick = function () { var d = getDerechosLog(); var r = d.find(function (x) { return x.id === b.getAttribute('data-ok'); }); if (!r) return; r.estado = r.estado === 'Anotado' ? 'Reclamado' : (r.estado === 'Reclamado' ? 'En seguimiento' : 'Resuelto ✓'); save(); renderDerechosLog(); }; });
  box.querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var d = getDerechosLog(); var r = d.find(function (x) { return x.id === b.getAttribute('data-share'); }); if (!r) return; share('⚖️ Mi caso: ' + r.tema, '📅 ' + r.fecha + '\n📍 ' + (r.lugar || '?') + '\n🧾 Folio: ' + (r.folio || '—') + '\n📝 ' + (r.nota || '—') + '\nEstado: ' + r.estado); }; });
}
function switchDerTab(t) {
  [['Der', 'derPanel'], ['Deb', 'debPanel'], ['Rec', 'recPanel'], ['Log', 'logPanel']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $('tabDer' + x[0]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
}
function setupDerechos() {
  makeDialog('derechosDialog', '⚖️ Derechos y Deberes',
    'Guía ciudadana simple para Penco y Chile: <b>qué derechos te protegen, qué deberes nos cuidan como comunidad y cómo reclamar paso a paso.</b> Informativa, no es asesoría legal. Todo registro queda <b>privado y local</b>.',
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🆘 Si es urgente ahora</h4>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><a href="tel:133" class="btn" style="width:auto;text-decoration:none;text-align:center">🚔 133 Carabineros</a>' +
    '<a href="tel:134" class="btn" style="width:auto;text-decoration:none;text-align:center">🔎 134 PDI</a>' +
    '<a href="tel:1455" class="btn" style="width:auto;text-decoration:none;text-align:center">🟣 1455 SERNAMEG</a>' +
    '<a href="tel:131" class="btn" style="width:auto;text-decoration:none;text-align:center">🚑 131 SAMU</a></div></div>' +
    '<div class="timer-tabs" style="flex-wrap:wrap;margin:10px 0">' +
    '<button type="button" id="tabDerDer" class="btn btn-accent" style="width:auto">⚖️ Derechos</button>' +
    '<button type="button" id="tabDerDeb" class="btn" style="width:auto">🤝 Deberes</button>' +
    '<button type="button" id="tabDerRec" class="btn" style="width:auto">📢 Cómo reclamar</button>' +
    '<button type="button" id="tabDerLog" class="btn" style="width:auto">📓 Mis casos</button></div>' +
    '<div id="derPanel"><div class="conv-row"><label style="flex:2">🔍 Buscar derecho <input type="text" id="derQ" placeholder="ej: salud, trabajo, arriendo..." autocomplete="off"></label></div>' +
    '<div id="derList" style="margin-top:10px;display:flex;flex-direction:column;gap:8px;max-height:340px;overflow-y:auto"></div></div>' +
    '<div id="debPanel" class="hidden"><div id="debCheck"></div></div>' +
    '<div id="recPanel" class="hidden"><div class="si-card" style="border-color:var(--gold)"><h4>📢 Reclama en 4 pasos (guárdalo todo)</h4><p>1️⃣ <b>Anota:</b> fecha, lugar, nombres y qué pasó. Guarda boletas, fotos y pantallazos.<br>2️⃣ <b>Reclama donde corresponde</b> (ver lista abajo) y pide número de folio.<br>3️⃣ <b>Si no responden en 15–20 días hábiles,</b> sube el caso: SERNAC → Juzgado Policía Local; salud/educación → Superintendencia; trabajo → Inspección.<br>4️⃣ <b>Si hay delito o peligro,</b> denuncia en Fiscalía, Carabineros o PDI el mismo día.</p></div>' +
    '<div class="help-grid" style="margin-top:8px">' +
    '<div class="help-card"><h4>🛒 Consumo y servicios</h4><p style="font-size:11px;line-height:1.5"><b>SERNAC:</b> 800 700 100 · sernac.cl<br><b>Juzgado Policía Local Penco:</b> O\'Higgins 500, 41 226 1020<br><b>SEC (luz/gas):</b> 600 600 0732<br><b>SISS (agua ESSBIO):</b> 800 381 800</p></div>' +
    '<div class="help-card"><h4>💼 Trabajo y salud</h4><p style="font-size:11px;line-height:1.5"><b>Inspección del Trabajo Conce:</b> 600 450 4000 · dt.gob.cl<br><b>Super Salud:</b> 600 836 9000 · FONASA 600 360 3000<br><b>CESFAM Penco / SAR:</b> 41 272 6350</p></div>' +
    '<div class="help-card"><h4>📚 Educación y familia</h4><p style="font-size:11px;line-height:1.5"><b>Super Educación:</b> 600 360 0311<br><b>OPD Penco (niñez):</b> DIDECO 41 226 1020<br><b>Tribunal Familia Conce:</b> 41 274 4000<br><b>Fono Infancia:</b> 800 730 800</p></div>' +
    '<div class="help-card"><h4>🏠 Municipal y territorio</h4><p style="font-size:11px;line-height:1.5"><b>Muni Penco:</b> O\'Higgins 500 · 41 226 1020 · munipenco.cl<br><b>Aseo y Ornato:</b> 41 226 1033 (microbasural, retiro)<br><b>2ª Comisaría Penco:</b> 41 214 3240 / 133<br><b>Capitanía Talcahuano:</b> 41 256 1800 (borde costero)</p></div></div>' +
    '<p class="muted" style="font-size:10px;margin-top:6px">Teléfonos orientativos y offline: verifica en munipenco.cl, chileatiende.cl y sernac.cl porque pueden cambiar.</p></div>' +
    '<div id="logPanel" class="hidden"><div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Anotar mi caso (privado)</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="derFecha"></label><label>Tema <select id="derTema"><option>Consumo / garantía</option><option>Trabajo</option><option>Salud</option><option>Educación</option><option>Arriendo / vivienda</option><option>Vecinal / ruidos</option><option>Medio ambiente</option><option>Trámite municipal</option><option>Otro</option></select></label></div>' +
    '<div class="conv-row"><label>Lugar / empresa <input type="text" id="derLugar" placeholder="ej: tienda X, CESFAM, vecino" maxlength="40"></label><label>Folio / N° reclamo <input type="text" id="derFolio" placeholder="ej: 12345" maxlength="20"></label></div>' +
    '<label>Detalle <input type="text" id="derNota" placeholder="qué pasó, a quién hablaste, qué te dijeron" maxlength="100"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="derAdd" class="btn btn-accent" style="width:auto">+ Guardar caso</button></div></div>' +
    '<div id="derLog" class="habits-list" style="margin-top:10px;max-height:260px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="derStats" class="muted" style="font-size:11px"></span><button type="button" id="derShareAll" class="btn" style="width:auto">📤 Compartir resumen</button></div></div>');
  var b = $('btnDerechos'); if (b) b.onclick = function () { if ($('derFecha') && !$('derFecha').value) $('derFecha').value = todayKey(); switchDerTab('Der'); renderDerechosList(); renderDeberesList(); renderDerechosLog(); openDlg('derechosDialog'); };
  if ($('tabDerDer')) $('tabDerDer').onclick = function () { switchDerTab('Der'); };
  if ($('tabDerDeb')) $('tabDerDeb').onclick = function () { switchDerTab('Deb'); renderDeberesList(); };
  if ($('tabDerRec')) $('tabDerRec').onclick = function () { switchDerTab('Rec'); };
  if ($('tabDerLog')) $('tabDerLog').onclick = function () { switchDerTab('Log'); renderDerechosLog(); };
  if ($('derQ')) $('derQ').oninput = renderDerechosList;
  if ($('derAdd')) $('derAdd').onclick = function () {
    var t = $('derTema').value || 'Otro';
    getDerechosLog().push({ id: uid('de'), fecha: $('derFecha').value || todayKey(), tema: t, lugar: clean($('derLugar').value, 40), folio: clean($('derFolio').value, 20), nota: clean($('derNota').value, 100), estado: 'Anotado' });
    save('Caso guardado ⚖️'); $('derLugar').value = ''; $('derFolio').value = ''; $('derNota').value = ''; renderDerechosLog();
  };
  if ($('derShareAll')) $('derShareAll').onclick = function () { var d = getDerechosLog(); if (!d.length) return alert('Sin casos'); share('⚖️ Mis casos (resumen)', d.map(function (r) { return '· ' + r.fecha + ' — ' + r.tema + ' [' + r.estado + '] ' + (r.lugar || '') + (r.folio ? ' folio ' + r.folio : ''); }).join('\n')); };
}

/* ============================================================
   FASE A — Cuerpo & Salud (sin botones ni grupos nuevos)
   A1 Ventana 1000 días → pestaña 🤱 en #fertiDialog (btnFerti): embarazo,
   bebé, crecimiento, vacunas, hitos y acompañamiento
   A2 Duelo y memoria viva → pestaña en #espiritualDialog
   A3 Sueños + arquetipos/patrones → fusión en #dreamsDialog
   A4 Bitácora meditación + racha → fusión en #breathDialog
   Todo local y privado por usuario (store + save).
   ============================================================ */
var MILDIAS_HITOS = ['Primera sonrisa', 'Sostiene la cabeza', 'Se sienta solo', 'Primer diente', 'Gateo', 'Primera palabra', 'Primeros pasos', 'Primera comida', 'Cumple 1 año', 'Cumple 2 años', 'Destete', 'Otro hito'];
var SUENOS_ARQ = ['🌊 Agua / mar / río', '🌙 Luna / noche', '🕊️ Vuelo', '🏠 Casa / hogar', '🐾 Animal guía', '👵 Ancestro / abuela', '🌑 Sombra / persecución', '☀️ Luz / amanecer', '🔥 Fuego', '🌳 Bosque / árbol', '🌧️ Lluvia / tormenta', '🛤️ Camino / viaje'];
var SUENOS_EMO = ['calma', 'alegría', 'miedo', 'tristeza', 'rabia', 'amor', 'confusión', 'poder', 'gratitud', 'vergüenza', 'culpa', 'asombro'];
var SUENOS_TIPOS = ['🌊 Común', '👁️ Lúcido', '😱 Pesadilla', '🔁 Recurrente', '👵 Visita / ancestro', '✨ Sincronía / aviso'];
var SUENOS_DICC = [
  { n: '🌊 Agua / mar / río', k: ['agua', 'mar', 'rio', 'río', 'ola', 'playa', 'orilla', 'lago'], s: 'Emociones y memoria. Agua clara = calma; turbia o crecida = algo pide cauce.', p: '¿Qué emoción crece en mí como este agua?' },
  { n: '🕊️ Volar', k: ['vuel', 'volar', 'alas', 'pluma'], s: 'Deseo de libertad o perspectiva. Vuelo libre = poder; vuelo que cae = exigencia que pesa.', p: '¿De qué necesito tomar altura?' },
  { n: '🏠 Casa / hogar', k: ['casa', 'hogar', 'pieza', 'cocina', 'puerta', 'ventana'], s: 'Tu psique: cada pieza es una parte tuya. Casa en ruina = descuido; casa luminosa = orden interno.', p: '¿Qué pieza de mi vida pide limpieza?' },
  { n: '🌳 Bosque / árbol', k: ['bosque', 'arbol', 'árbol', 'hoja'], s: 'Crecimiento y raíces. Bosque oscuro = inconsciente fértil; árbol firme = sostén.', p: '¿Qué estoy echando a brotar?' },
  { n: '👵 Ancestro / abuela', k: ['abuela', 'abuelo', 'ancestro', 'mama vieja', 'difunto'], s: 'Pewma de consejo: guía y memoria del linaje. Suele traer frase o gesto.', p: '¿Qué me vino a recordar?' },
  { n: '🔥 Fuego', k: ['fuego', 'llama', 'incendio', 'fogon', 'fogón', 'brasa'], s: 'Energía que transforma. Fuego cuidado = pasión; incendio = rabia o apuro.', p: '¿Qué fuego debo cuidar y cuál apagar?' },
  { n: '🌙 Luna / noche', k: ['luna', 'noche', 'estrella', 'cielo'], s: 'Ciclos, intuición y lo femenino. Luna llena = revelación; noche cerrada = duelo o espera.', p: '¿Qué ciclo mío está cambiando?' },
  { n: '🌑 Sombra / persecución', k: ['perseg', 'corre', 'huyo', 'huir', 'sombra', 'monstruo', 'ladron', 'ladrón'], s: 'Lo que evitas te persigue hasta que lo miras. No es enemigo: es parte exiliada.', p: '¿Qué evito enfrentar despierta/o?' },
  { n: '🐾 Animal guía', k: ['perro', 'gato', 'zorzal', 'pajaro', 'pájaro', 'caballo', 'culebra', 'pez', 'ave', 'animal'], s: 'Instinto y cualidad del animal (lealtad, vuelo, sigilo). Fíjate qué hace.', p: '¿Qué cualidad de este animal me falta o me sobra?' },
  { n: '🌧️ Lluvia / tormenta', k: ['lluvia', 'tormenta', 'trueno', 'relampago', 'relámpago', 'granizo'], s: 'Limpieza o tensión acumulada. Lluvia suave = alivio; tormenta = conflicto que estalla.', p: '¿Qué necesita llover (soltarse) en mí?' },
  { n: '🛤️ Camino / viaje', k: ['camino', 'viaje', 'sendero', 'ruta', 'bus', 'micro', 'auto', 'tren'], s: 'Tu dirección vital. Camino claro = rumbo; perdido o roto = decisión pendiente.', p: '¿Hacia dónde voy realmente?' },
  { n: '😬 Caída / dientes', k: ['caer', 'caida', 'caída', 'diente', 'muelas', 'abismo'], s: 'Clásicos de inseguridad o cambio: miedo a perder control, imagen o sostén.', p: '¿Qué temo perder si todo cambia?' },
  { n: '🤰 Bebé / embarazo', k: ['bebe', 'bebé', 'guagua', 'embarazo', 'embarazada', 'hijo'], s: 'Proyecto nuevo naciendo (no siempre hijo): idea, casa, oficio que pide cuidado.', p: '¿Qué proyecto estoy gestando?' },
  { n: '☀️ Luz / amanecer', k: ['luz', 'sol', 'amanecer', 'alba', 'brillo'], s: 'Conciencia y esperanza. Amanecer tras noche difícil = salida cercana.', p: '¿Qué se está aclarando en mi vida?' },
  { n: '🕊️ Muerte / despedida', k: ['muerte', 'muerto', 'funeral', 'velorio', 'despedida', 'entierro'], s: 'Casi nunca es literal: es cierre de etapa. Despedir para hacer espacio.', p: '¿Qué etapa debo dejar ir con gratitud?' },
  { n: '🌍 Terremoto / temblor', k: ['terremoto', 'temblor', 'sismo'], s: 'En Chile, sacudón real o interno: bases que se mueven (casa, pega, vínculo).', p: '¿Qué base mía tiembla y cómo la afirmo?' }
];
var SUENOS_STOP = ['para', 'pero', 'como', 'esta', 'esto', 'estaba', 'porque', 'donde', 'cuando', 'mucho', 'tenia', 'habia', 'despues', 'sueño', 'sone', 'soñe'];
var MEDITA_TRAD = ['Zen (zazen)', 'Vipassana', 'Llellipun mapuche', 'Respiración consciente', 'Contemplación lunar', 'Silencio / quietud'];
function addKw(id, extra) {
  try { var b = $(id); if (b && b.dataset && b.dataset.keywords && b.dataset.keywords.indexOf(extra.split(' ')[0]) < 0) b.dataset.keywords += ' ' + extra; } catch (e) {}
}
/* ---------- A1: 1000 días (embarazo + primera infancia) ---------- */
var MILDIAS_HITOS = ['Primera sonrisa', 'Sostiene la mirada', 'Sostiene la cabeza', 'Balbuceo', 'Se sienta con apoyo', 'Se sienta solo', 'Primer diente', 'Pinza con dedos', 'Gateo', 'Primera palabra (mamá/papá)', 'Se pone de pie', 'Primeros pasos', 'Camina con apoyo', 'Primera comida', 'Apila cubos', 'Garabatea', 'Corre', 'Cumple 1 año', 'Control de esfínteres', 'Cumple 2 años', 'Destete', 'Cumple 3 años', 'Otro hito'];
var MIL_CTRL_EMB = [
  { k: 'c1', t: '1er control < 12 semanas', d: 'Ingresa al CESFAM/SAR con tu FUR. Lleva carnet y exámenes previos.' },
  { k: 'c2', t: 'Ecografía 11–14 semanas', d: 'Tamizaje + fecha bien la edad gestacional.' },
  { k: 'c3', t: 'Ecografía 20–24 semanas', d: 'Anatómica: revisa órganos y crecimiento.' },
  { k: 'c4', t: 'Exámenes: VIH, VDRL, TSH, glicemia', d: 'Pídelos en el control; la TTOG suele ir ~24–28 sem.' },
  { k: 'c5', t: 'Hierro + ácido fólico diarios', d: 'Según indicación de tu matrona. No los suspendas por tu cuenta.' },
  { k: 'c6', t: 'Vacunas del embarazo', d: 'Influenza, Tdap (tos convulsiva) y las que indique tu matrona.' },
  { k: 'c7', t: 'Curso prenatal / taller', d: 'Pregunta en tu CESFAM por talleres de preparto y lactancia.' },
  { k: 'c8', t: 'Plan de parto + mochila', d: 'Acompañante, lugar, ruta y mochila lista desde la semana 36.' }
];
var MIL_VACUNAS = [
  { k: 'vbcg', e: 'Recién nacido', t: 'BCG (tuberculosis)' },
  { k: 'v2m', e: '2 meses', t: 'Pentavalente + Polio + Neumocócica + Rotavirus' },
  { k: 'v4m', e: '4 meses', t: 'Pentavalente + Polio + Neumocócica' },
  { k: 'v6m', e: '6 meses', t: 'Pentavalente + Polio + Influenza' },
  { k: 'v12m', e: '12 meses', t: 'Tres vírica + Meningocócica + Neumocócica refuerzo' },
  { k: 'v18m', e: '18 meses', t: 'DTP + Polio + Hepatitis A + Varicela' },
  { k: 'v4a', e: '4 años', t: 'DTP + Polio refuerzo (ingreso escolar)' }
];
var MIL_ACOMP_AREAS = ['Puerperio', 'Lactancia', 'Sueño', 'Vínculo y apego', 'Salud y consultas', 'Otro'];
function getMilHitos() { var a = store('milDiasHitos', []); return Array.isArray(a) ? a : []; }
function getMilCrec() { var a = store('milCrec', []); return Array.isArray(a) ? a : []; }
function getMilAcomp() { var a = store('milAcomp', []); return Array.isArray(a) ? a : []; }
function getMilBebe() { var o = store('milBebe', {}); return (o && typeof o === 'object') ? o : {}; }
function milSemana(fur) {
  var d = Math.floor((Date.now() - new Date(fur + 'T12:00:00').getTime()) / 86400000);
  if (d < 0) return { sem: 0, dias: d, txt: 'fecha futura' };
  return { sem: Math.min(42, Math.floor(d / 7) + 1), dias: d, txt: 'semana ' + Math.min(42, Math.floor(d / 7) + 1) + ' · día ' + d + ' (~' + Math.floor(d / 28) + ' lunas)' };
}
function milEdad(nac) {
  var d = Math.floor((Date.now() - new Date(nac + 'T12:00:00').getTime()) / 86400000);
  if (d < 0) return { txt: 'fecha futura' };
  var m = Math.floor(d / 30.4);
  var txt = d + ' días';
  if (m >= 1) txt += ' (~' + m + (m === 1 ? ' mes' : ' meses') + ')';
  txt += ' · ~' + Math.floor(d / 28) + ' lunas 🌙';
  return { dias: d, meses: m, txt: txt };
}
function milChecklist(boxId, items, storeKey, suffix) {
  var box = $(boxId); if (!box) return;
  var done = store(storeKey, {});
  var n = items.filter(function (x) { return done[x.k]; }).length;
  box.innerHTML = '<p class="muted" style="font-size:11px">✅ ' + n + ' / ' + items.length + (suffix || '') + '</p>' +
    '<div class="dio-compact">' + items.map(function (x) {
      var c = done[x.k] ? ' done' : '';
      var head = x.e ? '<b>' + esc(x.e) + ' — ' + esc(x.t) + '</b>' : '<b>' + esc(x.t) + '</b>';
      return '<label class="dio-item' + c + '"><input type="checkbox" data-milk="' + x.k + '"' + (done[x.k] ? ' checked' : '') + '><span class="dio-txt">' + head + (x.d ? '<small>' + esc(x.d) + '</small>' : '') + '</span><span class="dio-check">' + (done[x.k] ? '✓ listo' : 'marcar') + '</span></label>';
    }).join('') + '</div>';
  box.querySelectorAll('[data-milk]').forEach(function (c) {
    c.onchange = function () { var d = store(storeKey, {}); d[c.getAttribute('data-milk')] = c.checked; save(c.checked ? 'Anotado ✓' : 'Guardado'); renderMilDias(); };
  });
}
function renderMilDias() {
  if (!$('milFUR')) return;
  var fur = store('milDiasFUR', '');
  if (document.activeElement !== $('milFUR')) $('milFUR').value = fur || '';
  var box = $('milInfo');
  if (fur) {
    var fpp = addDaysKey(fur, 280);
    var s = milSemana(fur);
    var tri = s.sem <= 13 ? '1er trimestre 🌱' : (s.sem <= 27 ? '2do trimestre 🌸' : '3er trimestre 🌕');
    box.innerHTML = '🤰 FUR <b>' + fur + '</b> → FPP aprox <b>' + fpp + '</b> (40 sem ≈ 10 lunas)<br>📍 Hoy: <b>' + s.txt + '</b> · ' + tri +
      '<br><span class="muted">Chile: 1er control &lt;12 sem · ecografías 11-14 y 20-24 sem · TSH/glicemia según matrona. No es consejo médico.</span>';
  } else box.innerHTML = '<span class="muted">Fija la FUR para ver semana, lunas y FPP. O baja directo al bebé y sus hitos.</span>';
  // bebé
  var bb = getMilBebe();
  if (document.activeElement !== $('milBebeNombre')) $('milBebeNombre').value = bb.nombre || '';
  if (document.activeElement !== $('milBebeSexo')) $('milBebeSexo').value = bb.sexo || '';
  if (document.activeElement !== $('milBebePeso')) $('milBebePeso').value = bb.peso || '';
  if (document.activeElement !== $('milBebeTalla')) $('milBebeTalla').value = bb.talla || '';
  if (!$('milNac').value) $('milNac').value = store('milDiasNac', '') || '';
  var nac = store('milDiasNac', '');
  $('milBebeInfo').innerHTML = nac ? ('👶 ' + (bb.nombre ? '<b>' + esc(bb.nombre) + '</b> · ' : '') + nac + ' → <b>' + milEdad(nac).txt + '</b>' + (bb.peso || bb.talla ? '<br><span class="muted">Al nacer: ' + esc(bb.peso || '—') + ' kg · ' + esc(bb.talla || '—') + ' cm</span>' : '')) : '<span class="muted">Registra el nacimiento para ver la edad en días, meses y lunas.</span>';
  // crecimiento
  var cr = getMilCrec().slice().sort(function (a, b) { return a.fecha.localeCompare(b.fecha); });
  var last = cr.length ? cr[cr.length - 1] : null;
  $('milCrecInfo').innerHTML = last ? ('📏 Último control: <b>' + last.fecha + '</b> · ' + esc(last.peso || '—') + ' kg · ' + esc(last.talla || '—') + ' cm' + (last.pc ? ' · PC ' + esc(last.pc) + ' cm' : '') + ' <span class="muted">(' + cr.length + ' controles)</span>') : '<span class="muted">Sin controles de crecimiento. Anota peso/talla de cada control sano.</span>';
  $('milCrecList').innerHTML = cr.length ? cr.slice().reverse().slice(0, 20).map(function (r) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + r.fecha + '</b> · ' + esc(r.peso || '—') + ' kg · ' + esc(r.talla || '—') + ' cm' + (r.pc ? ' · PC ' + esc(r.pc) : '') + (r.nota ? '<br><span class="muted" style="font-size:11px">' + esc(r.nota) + '</span>' : '') + '</span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
  }).join('') : '';
  $('milCrecList').querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar control?')) return; var d = getMilCrec(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderMilDias(); }; });
  // hitos
  var h = getMilHitos().slice().sort(function (a, b) { return a.fecha.localeCompare(b.fecha); });
  $('milHitosList').innerHTML = h.length ? h.map(function (r) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span>🌙 <b>' + esc(r.hito) + '</b> · ' + r.fecha + '<br><span class="muted" style="font-size:11px">' + esc(lunaTxt(r.fecha)) + (r.nota ? ' · ' + esc(r.nota) : '') + '</span></span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
  }).join('') : '<p class="muted">Sin hitos aún. El gateo (~7-10 m), primera palabra (~12 m) y pasos (~12-15 m) son rangos: cada bebé tiene su luna.</p>';
  $('milHitosList').querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar hito?')) return; var d = getMilHitos(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderMilDias(); }; });
  // checklists
  milChecklist('milCtrlBox', MIL_CTRL_EMB, 'milCtrlCheck', ' controles de embarazo');
  milChecklist('milVacBox', MIL_VACUNAS, 'milVacCheck', ' vacunas (orientativo: manda tu carnet del CESFAM)');
  // acompañamiento
  var ac = getMilAcomp().slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  $('milAcompList').innerHTML = ac.length ? ac.slice(0, 30).map(function (r) {
    return '<div class="habit-item"><b>' + esc(r.area) + '</b> · <span class="muted" style="font-size:11px">' + r.fecha + '</span><p style="font-size:12px">' + esc(r.texto) + '</p><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕ Borrar</button></div>';
  }).join('') : '<p class="muted">Sin notas aún. Puerperio, lactancia, sueño, vínculo… escribirlo también es cuidar.</p>';
  $('milAcompList').querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar nota?')) return; var d = getMilAcomp(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderMilDias(); }; });
  var st = $('milStats'); if (st) st.textContent = h.length + ' hitos · ' + cr.length + ' controles · ' + ac.length + ' notas · ' + (fur ? milSemana(fur).txt : (nac ? milEdad(nac).txt : 'sin FUR ni nacimiento'));
}
function setupMilDias() {
  var dlg = $('fertiDialog'); if (!dlg) { setTimeout(setupMilDias, 800); return; }
  var sec = $('milSection'); if (!sec) { setTimeout(setupMilDias, 800); return; }
  addKw('btnFerti', 'embarazo parto puerperio bebe guagua lactancia hitos 1000 dias fur fpp semana gestacion vacunas controles crecimiento acompanamiento');
  var b = $('btnFerti');
  if (b && !b.dataset.milWrapped) {
    b.dataset.milWrapped = '1';
    b.addEventListener('click', function () { setTimeout(function () { try { renderMilDias(); } catch (e) {} }, 60); });
  }
  if ($('milFUR')) { try { renderMilDias(); } catch (e) {} return; }
  sec.innerHTML =
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🤰 Embarazo <span class="muted" style="font-weight:normal">· 40 semanas ≈ 10 lunas</span></h4>' +
    '<p class="muted" style="font-size:11px">Fija la FUR (fecha última regla) para ver semana, lunas y FPP. Marca los controles a tu ritmo.</p>' +
    '<div class="conv-row"><label>Última regla (FUR) <input type="date" id="milFUR"></label></div>' +
    '<div id="milInfo" class="chip" style="display:block;white-space:normal;margin-top:6px"></div>' +
    '<div id="milCtrlBox" style="margin-top:8px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>👶 Mi bebé <span class="muted" style="font-weight:normal">· la personita que llega</span></h4>' +
    '<div class="conv-row"><label style="flex:2">Nombre <input type="text" id="milBebeNombre" placeholder="ej: Rayén" maxlength="30"></label><label>Sexo <select id="milBebeSexo"><option value="">—</option><option>Niña</option><option>Niño</option><option>Intersex</option></select></label></div>' +
    '<div class="conv-row"><label>Nacimiento <input type="date" id="milNac"></label><label>Peso al nacer (kg) <input type="number" id="milBebePeso" min="0.5" max="7" step="0.01" placeholder="3.40"></label><label>Talla al nacer (cm) <input type="number" id="milBebeTalla" min="30" max="60" step="0.5" placeholder="50"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="milBebeSave" class="btn" style="width:auto">💾 Guardar bebé</button></div>' +
    '<div id="milBebeInfo" class="chip" style="display:block;white-space:normal;margin-top:6px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>📏 Crecimiento <span class="muted" style="font-weight:normal">· controles de niño sano</span></h4>' +
    '<div id="milCrecInfo" class="chip" style="display:block;white-space:normal"></div>' +
    '<div class="conv-row" style="margin-top:8px"><label>Fecha <input type="date" id="milCrecFecha"></label><label>Peso (kg) <input type="number" id="milCrecPeso" min="0.5" max="40" step="0.01" placeholder="4.20"></label><label>Talla (cm) <input type="number" id="milCrecTalla" min="30" max="130" step="0.5" placeholder="55"></label><label>PC (cm) <input type="number" id="milCrecPC" min="20" max="60" step="0.5" placeholder="40"></label></div>' +
    '<label>Nota <input type="text" id="milCrecNota" placeholder="ej: control 2 meses, todo bien" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="milCrecAdd" class="btn btn-accent" style="width:auto">+ Guardar control</button><button type="button" id="milCrecShare" class="btn" style="width:auto">📤 Compartir</button></div>' +
    '<div id="milCrecList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌙 Hitos lunares</h4>' +
    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">Hito <select id="milHito">' + MILDIAS_HITOS.map(function (h) { return '<option>' + h + '</option>'; }).join('') + '</select></label><label>Fecha <input type="date" id="milFecha"></label></div>' +
    '<label>Nota <input type="text" id="milNota" placeholder="ej: dos dientecitos abajo, dijo agua" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="milAdd" class="btn btn-accent" style="width:auto">+ Guardar hito</button><button type="button" id="milShare" class="btn" style="width:auto">📤 Compartir</button></div>' +
    '<div id="milHitosList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>💉 Vacunas <span class="muted" style="font-weight:normal">· calendario Chile (orientativo)</span></h4>' +
    '<p class="muted" style="font-size:11px">Referencia general: siempre manda tu carnet de vacunas del CESFAM.</p>' +
    '<div id="milVacBox" style="margin-top:6px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🤍 Acompañamiento <span class="muted" style="font-weight:normal">· puerperio, lactancia y vínculo</span></h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="milAcompFecha"></label><label style="flex:2">Área <select id="milAcompArea">' + MIL_ACOMP_AREAS.map(function (a) { return '<option>' + a + '</option>'; }).join('') + '</select></label></div>' +
    '<label>Nota <textarea id="milAcompTexto" rows="2" placeholder="cómo estás, cómo va la lactancia, el sueño, lo que necesites soltar..." maxlength="400"></textarea></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="milAcompAdd" class="btn btn-accent" style="width:auto">+ Guardar nota</button></div>' +
    '<div id="milAcompList" class="habits-list" style="margin-top:8px;max-height:220px"></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">📖 Lee un cuento por luna en 📖 Cuentos. Si hay tristeza profunda o malestar que no pasa, pide apoyo en tu CESFAM o llama <b>Salud Responde 600 360 7777</b>.</p></div>' +
    '<span id="milStats" class="muted" style="font-size:11px"></span>';
  $('milFUR').onchange = function () { try { userData().milDiasFUR = $('milFUR').value; } catch (e) {} save('FUR guardada 🤱'); renderMilDias(); };
  $('milNac').onchange = function () { try { userData().milDiasNac = $('milNac').value; } catch (e) {} save('Guardado ✓'); renderMilDias(); };
  $('milBebeSave').onclick = function () {
    try { userData().milBebe = { nombre: clean($('milBebeNombre').value, 30), sexo: $('milBebeSexo').value, peso: $('milBebePeso').value, talla: $('milBebeTalla').value }; } catch (e) {}
    save('Bebé guardado 👶'); renderMilDias();
  };
  $('milCrecAdd').onclick = function () {
    var f = $('milCrecFecha').value || todayKey();
    getMilCrec().push({ id: uid('mc'), fecha: f, peso: $('milCrecPeso').value, talla: $('milCrecTalla').value, pc: $('milCrecPC').value, nota: clean($('milCrecNota').value, 80) });
    save('Control guardado 📏'); $('milCrecNota').value = ''; renderMilDias();
  };
  $('milCrecShare').onclick = function () { var d = getMilCrec(); if (!d.length) return alert('Sin controles'); share('📏 Crecimiento de ' + (getMilBebe().nombre || 'mi bebé'), d.map(function (r) { return '· ' + r.fecha + ' — ' + (r.peso || '?') + ' kg · ' + (r.talla || '?') + ' cm' + (r.pc ? ' · PC ' + r.pc : ''); }).join('\n')); };
  $('milAdd').onclick = function () {
    var f = $('milFecha').value || todayKey();
    getMilHitos().push({ id: uid('mh'), fecha: f, hito: $('milHito').value, nota: clean($('milNota').value, 80) });
    save('Hito guardado 🌙'); $('milNota').value = ''; renderMilDias();
  };
  $('milShare').onclick = function () { var d = getMilHitos(); if (!d.length) return alert('Sin hitos'); share('🌙 Hitos lunares de ' + (getMilBebe().nombre || 'mi bebé'), d.map(function (r) { return '· ' + r.fecha + ' — ' + r.hito + ' (' + lunaTxt(r.fecha) + ')'; }).join('\n')); };
  $('milAcompAdd').onclick = function () {
    var t = clean($('milAcompTexto').value, 400); if (!t) return alert('Escribe la nota');
    getMilAcomp().push({ id: uid('ma'), fecha: $('milAcompFecha').value || todayKey(), area: $('milAcompArea').value, texto: t });
    save('Nota guardada 🤍'); $('milAcompTexto').value = ''; renderMilDias();
  };
  try { renderMilDias(); } catch (e) {}
}
/* ---------- A2: duelo ---------- */
function getDueloMem() { var a = store('dueloMemorias', []); return Array.isArray(a) ? a : []; }
function dueloRituales(fecha) {
  return [
    { n: '1 luna · 28 días', f: addDaysKey(fecha, 28), txt: '🕯️ Encender vela + contar una historia en voz alta' },
    { n: '3 lunas · 84 días', f: addDaysKey(fecha, 84), txt: '🍲 Cocinar su receta + invitar a alguien que lo quiso' },
    { n: '1 año · 365 días', f: addDaysKey(fecha, 365), txt: '🌳 Plantar / visitar + leer las memorias guardadas' }
  ];
}
function renderDuelo() {
  if (!$('dueFecha')) return;
  var f = store('dueloFecha', '');
  if (document.activeElement !== $('dueFecha')) $('dueFecha').value = f || '';
  var hoy = todayKey(), box = $('dueRituales');
  if (!f) box.innerHTML = '<p class="muted">Fija la fecha de partida para ver el calendario de memoria (1 luna · 3 lunas · 1 año).</p>';
  else box.innerHTML = dueloRituales(f).map(function (r) {
    var est = hoy === r.f ? '🕯️ <b>HOY</b>' : (hoy < r.f ? 'en ' + Math.round((new Date(r.f + 'T12:00:00') - new Date(hoy + 'T12:00:00')) / 86400000) + ' días' : 'vivido ✓');
    return '<div class="si-card"><h4>' + esc(r.n) + ' → ' + r.f + ' <span class="chip" style="font-size:10px">' + est + '</span></h4><p>' + esc(r.txt) + ' <span class="muted">(' + esc(lunaTxt(r.f) || 'luna fuera de rango del calendario') + ')</span></p></div>';
  }).join('');
  var m = getDueloMem().slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  $('dueList').innerHTML = m.length ? m.map(function (r) {
    return '<div class="habit-item"><b>' + esc(r.icon || '🕊️') + ' ' + esc(r.titulo) + '</b> <span class="chip" style="font-size:10px">' + esc(r.tipo) + '</span><br><span class="muted" style="font-size:11px">' + r.fecha + ' · ' + esc(lunaTxt(r.fecha)) + '</span><p style="font-size:12px;white-space:pre-wrap">' + esc(r.texto) + '</p><div style="display:flex;gap:6px"><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Vacío. Guarda su receta, su canción, su dicho, una carta que no alcanzaste a darle.</p>';
  $('dueList').querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar memoria?')) return; var d = getDueloMem(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderDuelo(); }; });
  $('dueList').querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var d = getDueloMem(); var r = d.find(function (x) { return x.id === b.getAttribute('data-share'); }); if (r) share('🕊️ Memoria viva: ' + r.titulo, r.texto); }; });
  var st = $('dueStats'); if (st) st.textContent = m.length + ' memorias guardadas · privadas en este dispositivo';
}
/* ---------- A2: duelo (RETIRADO de Practicas Espirituales: vive en su seccion completa 🕊️ Duelo) ---------- */
function setupDuelo() {
  try {
    var tb = $('espTabDuelo');
    if (tb && tb.parentNode) tb.parentNode.removeChild(tb);
    var pn = $('espDueloPanel');
    if (pn && pn.parentNode) pn.parentNode.removeChild(pn);
    var b = $('btnEspiritual');
    if (b && b.dataset && b.dataset.keywords) {
      var kw = ' ' + b.dataset.keywords + ' ';
      ['duelo', 'difunto', 'despedida', 'luto', 'aniversario'].forEach(function (w) {
        kw = kw.split(' ' + w + ' ').join(' ');
      });
      b.dataset.keywords = kw.replace(/\s+/g, ' ').replace(/^ | $/g, '');
    }
  } catch (e) {}
}
/* ---------- A3: sueños + ---------- */
function getSuenos() { var a = store('suenosLog', []); return Array.isArray(a) ? a : []; }
function suenosRacha() {
  var set = {};
  getSuenos().forEach(function (r) { set[r.fecha] = true; });
  var s = 0, cur = new Date(todayKey() + 'T12:00:00');
  if (!set[todayKey()]) cur = new Date(cur.getTime() - 86400000);
  for (var i = 0; i < 365; i++) {
    var k = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
    if (set[k]) s++; else break;
    cur = new Date(cur.getTime() - 86400000);
  }
  return s;
}
function suenosPista(texto) {
  var t = ' ' + String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') + ' ';
  for (var i = 0; i < SUENOS_DICC.length; i++) {
    var e = SUENOS_DICC[i];
    for (var j = 0; j < e.k.length; j++) {
      if (t.indexOf(e.k[j]) >= 0) return e;
    }
  }
  return null;
}
function renderSueDicc() {
  var grid = $('sueDiccGrid'); if (!grid) return;
  var q = '';
  try { q = ($('sueDiccQ').value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); } catch (e) {}
  var list = SUENOS_DICC.filter(function (e) {
    if (!q) return true;
    return (e.n + ' ' + e.s + ' ' + e.p + ' ' + e.k.join(' ')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').indexOf(q) >= 0;
  });
  grid.innerHTML = list.length ? list.map(function (e) {
    return '<div class="discipline-card" style="text-align:left"><h4>' + esc(e.n) + '</h4><p style="font-size:12px">' + esc(e.s) + '</p><p class="muted" style="font-size:11px">💬 ' + esc(e.p) + '</p></div>';
  }).join('') : '<p class="muted">Sin coincidencia. Prueba con agua, casa, volar, dientes, camino...</p>';
}
var sueEditingId = null;
function suenosClearForm() {
  sueEditingId = null;
  try {
    if ($('dreamText')) $('dreamText').value = '';
    if ($('suePlusTitulo')) $('suePlusTitulo').value = '';
    if ($('suePlusMsg')) $('suePlusMsg').value = '';
    if ($('suePlusLuc')) $('suePlusLuc').checked = false;
    if ($('suePlusViv')) $('suePlusViv').value = '3';
    if ($('suePlusFecha')) $('suePlusFecha').value = todayKey();
    var sb = $('dreamSave'); if (sb) sb.textContent = '💾 Guardar en mi Diario';
    var ce = $('dreamCancelEdit'); if (ce) ce.classList.add('hidden');
  } catch (e) {}
}
function suenosLoadToForm(r) {
  if (!r) return;
  sueEditingId = r.id;
  try {
    if ($('dreamText')) $('dreamText').value = r.texto || '';
    if ($('suePlusTitulo')) $('suePlusTitulo').value = r.titulo || '';
    if ($('suePlusTipo')) $('suePlusTipo').value = r.tipo || '🌊 Común';
    if ($('suePlusArq')) $('suePlusArq').value = r.arq || '';
    if ($('suePlusEmo')) $('suePlusEmo').value = r.emo || '';
    if ($('suePlusViv')) $('suePlusViv').value = r.viv || 3;
    if ($('suePlusMsg')) $('suePlusMsg').value = r.msg || '';
    if ($('suePlusLuc')) $('suePlusLuc').checked = !!r.luc;
    if ($('suePlusFecha')) $('suePlusFecha').value = r.fecha || todayKey();
    var sb = $('dreamSave'); if (sb) sb.textContent = '💾 Actualizar sueño';
    var ce = $('dreamCancelEdit'); if (ce) ce.classList.remove('hidden');
    switchSueTab('Anotar');
    if ($('dreamText')) $('dreamText').focus();
  } catch (e) {}
}
/* Importa líneas "Sueño: ..." que hayan quedado en notas del día al Diario aparte y las borra de las notas */
function suenosImportFromNotes() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u || !u.cycles) return alert('Sin notas para revisar');
    var imported = 0, cleaned = 0;
    var existing = {};
    getSuenos().forEach(function (r) { existing[(r.fecha || '') + '|' + (r.texto || '')] = true; });
    var re = /^\s*sue[ñn]os?\s*(\d{4}-\d{2}-\d{2})?\s*:?\s*(.+)?$/i;
    Object.keys(u.cycles).forEach(function (yKey) {
      var keyByLuna = {};
      try {
        var cycBuilt = cal.buildCycle(parseInt(yKey, 10));
        cycBuilt.days.forEach(function (d) {
          if (d.luna === 'dft') return;
          var k = cal.fmtKey.format(new Date(d.noonMs));
          keyByLuna[d.luna + '-' + d.diaN] = k;
        });
      } catch (e) {}
      var cycData = u.cycles[yKey];
      if (!cycData || !cycData.moons) return;
      Object.keys(cycData.moons).forEach(function (lunaK) {
        var moon = cycData.moons[lunaK];
        if (!moon || !moon.days) return;
        Object.keys(moon.days).forEach(function (diaK) {
          var cell = moon.days[diaK];
          if (!cell || !cell.nota) return;
          var lines = String(cell.nota).split('\n');
          var keep = [];
          var fecha = keyByLuna[lunaK + '-' + diaK] || todayKey();
          lines.forEach(function (ln) {
            var m = ln.match(re);
            var low = ln.trim().toLowerCase();
            var isSue = m || low.indexOf('sueño') === 0 || low.indexOf('sueno') === 0 || low.indexOf('sueño:') >= 0 && low.length < 300;
            if (isSue) {
              var txt = '';
              if (m && m[2]) txt = m[2].trim();
              else txt = ln.replace(/^\s*sue[ñn]os?\s*(\d{4}-\d{2}-\d{2})?\s*:?\s*/i, '').trim() || ln.trim();
              if (m && m[1]) fecha = m[1];
              txt = clean(txt, 800);
              if (txt && !existing[fecha + '|' + txt]) {
                getSuenos().push({ id: uid('su'), fecha: fecha, titulo: txt.split(/\n|。|\./)[0].slice(0, 60) || 'Sueño', tipo: '🌊 Común', texto: txt, arq: '', emo: '', viv: 0, msg: '', luc: false, importado: true });
                existing[fecha + '|' + txt] = true;
                imported++;
              }
              cleaned++;
            } else keep.push(ln);
          });
          cell.nota = keep.join('\n').replace(/\n{3,}/g, '\n\n').trim();
        });
      });
      // DFT
      try {
        if (cycData.dft && cycData.dft.nota) {
          var lines = String(cycData.dft.nota).split('\n');
          var keep = [];
          lines.forEach(function (ln) {
            var m = ln.match(re);
            if (m) {
              var txt = clean((m[2] || '').trim() || ln.trim(), 800);
              var fecha = (m[1] || todayKey());
              if (txt && !existing[fecha + '|' + txt]) { getSuenos().push({ id: uid('su'), fecha: fecha, titulo: txt.slice(0, 60) || 'Sueño', tipo: '🌊 Común', texto: txt, arq: '', emo: '', viv: 0, msg: '', luc: false, importado: true }); existing[fecha + '|' + txt] = true; imported++; }
              cleaned++;
            } else keep.push(ln);
          });
          cycData.dft.nota = keep.join('\n').trim();
        }
      } catch (e) {}
    });
    save();
    try { renderSuenosPlus(); } catch (e) {}
    try { if (typeof renderCurrentView === 'function') renderCurrentView(); } catch (e) {}
    alert(imported ? ('🌙 Importados ' + imported + ' sueños al Diario y quitados de las notas ✓') : (cleaned ? 'Ya estaban en el Diario (se limpiaron duplicados de notas)' : 'No se encontraron líneas "Sueño:" en las notas'));
  } catch (e) { alert('No se pudo importar'); }
}
function renderSuenosPlus() {
  try { renderSueDicc(); } catch (e) {}
  var box = $('suePlusPatrones'); if (!box) return;
  var d = getSuenos();
  if (!d.length) { box.innerHTML = '<span class="muted">Sin sueños en el diario aún. Al guardar, quedan aquí con luna, tipo y arquetipo para ver patrones.</span>'; }
  else {
    var arq = {}, emo = {}, tip = {}, luc = 0, vivSum = 0, vivN = 0;
    d.forEach(function (r) {
      arq[r.arq || '?'] = (arq[r.arq || '?'] || 0) + 1;
      emo[r.emo || '?'] = (emo[r.emo || '?'] || 0) + 1;
      tip[r.tipo || '?'] = (tip[r.tipo || '?'] || 0) + 1;
      if (r.luc) luc++;
      if (+r.viv) { vivSum += (+r.viv); vivN++; }
    });
    var top = function (o) { return Object.keys(o).sort(function (a, b) { return o[b] - o[a]; }).slice(0, 2).map(function (k) { return k + ' ×' + o[k]; }).join(' · ') || '—'; };
    var freq = {};
    d.forEach(function (r) { (r.texto || '').toLowerCase().replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).forEach(function (w) { w = w.trim(); if (w.length >= 4 && SUENOS_STOP.indexOf(w) < 0) freq[w] = (freq[w] || 0) + 1; }); });
    var topW = Object.keys(freq).filter(function (w) { return freq[w] >= 2; }).sort(function (a, b) { return freq[b] - freq[a]; }).slice(0, 6).map(function (w) { return w + ' ×' + freq[w]; }).join(' · ') || '— (aparecen al repetirse palabras)';
    var llenas = d.filter(function (r) { var l = null; try { var m = mensLunaForKey(r.fecha); if (m) l = m.dia; } catch (e) {} return l >= 13 && l <= 16; }).length;
    box.innerHTML = '📊 <b>' + d.length + '</b> sueños · 🔥 racha <b>' + suenosRacha() + ' días</b> · 👁️ lúcidos <b>' + luc + '</b>' + (vivN ? ' · ✨ viveza prom <b>' + (vivSum / vivN).toFixed(1) + '/5</b>' : '') +
      '<br>🗂️ Tipos: ' + esc(top(tip)) + '<br>🏷️ Arquetipos: ' + esc(top(arq)) + ' · 💛 Emoción top: ' + esc(top(emo)) +
      '<br>🔁 Palabras que vuelven: ' + esc(topW) + '<br>🌕 En luna llena aprox: <b>' + llenas + '</b>';
  }
  var q = '';
  try { q = ($('suePlusQ').value || '').toLowerCase().trim(); } catch (e) {}
  var list = $('suePlusList');
  if (!list) return;
  var items = d.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  if (q) items = items.filter(function (r) { return ((r.titulo || '') + ' ' + (r.texto || '') + ' ' + (r.msg || '') + ' ' + (r.arq || '') + ' ' + (r.emo || '') + ' ' + (r.tipo || '')).toLowerCase().indexOf(q) >= 0; });
  list.innerHTML = items.length ? items.slice(0, 30).map(function (r) {
    var pista = suenosPista((r.titulo || '') + ' ' + (r.texto || ''));
    var viv = +r.viv ? (' · ' + '★'.repeat(Math.min(5, +r.viv)) + '☆'.repeat(Math.max(0, 5 - (+r.viv)))) : '';
    return '<div class="habit-item" style="align-items:flex-start"><div style="flex:1"><b>' + esc(r.titulo || 'Sueño') + '</b> <span class="chip" style="font-size:10px">' + esc(r.tipo || '🌊 Común') + '</span><br>' +
      '<span class="muted" style="font-size:11px">' + r.fecha + ' · ' + esc(lunaTxt(r.fecha)) + ' · ' + esc(r.arq || '') + ' · ' + esc(r.emo || '') + esc(viv) + (r.luc ? ' · 👁️ lúcido' : '') + '</span>' +
      '<p style="font-size:12px;white-space:pre-wrap;margin:4px 0">' + esc((r.texto || '').slice(0, 400)) + '</p>' +
      (r.msg ? '<p style="font-size:11px">👉 <b>Me pide:</b> ' + esc(r.msg) + '</p>' : '') +
      (pista ? '<p class="muted" style="font-size:11px">📖 ' + esc(pista.n) + ': ' + esc(pista.p) + '</p>' : '') +
      '<div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap"><button class="btn" style="width:auto;font-size:11px" data-edit="' + r.id + '">✏️ Editar</button><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div></div>';
  }).join('') + (d.length > 30 ? '<p class="muted" style="font-size:11px">Mostrando 30 de ' + d.length + '. Usa el buscador para filtrar.</p>' : '') : (d.length ? '<p class="muted">Sin resultados para esa búsqueda.</p>' : '');
  try { var tabD = $('tabSueDiario'); if (tabD) tabD.textContent = '📓 Diario (' + d.length + ')'; } catch (e) {}
  list.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar este sueño de tu Diario?')) return; var dd = getSuenos(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderSuenosPlus(); }; });
  list.querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var dd = getSuenos(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-share'); }); if (r) share('💭 ' + (r.titulo || 'Mi sueño') + ' (' + r.fecha + ')', (r.texto || '') + (r.msg ? '\n👉 Me pide: ' + r.msg : '')); }; });
  list.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { var dd = getSuenos(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-edit'); }); if (r) suenosLoadToForm(r); }; });
}
var SUE_TABS = ['Anotar', 'Practicas', 'Guia', 'Dicc', 'Diario'];
function switchSueTab(t) {
  SUE_TABS.forEach(function (x) {
    var p = $('sueTab' + x), b = $('tabSue' + x);
    if (p) p.classList.toggle('hidden', x !== t);
    if (b) b.classList.toggle('btn-accent', x === t);
  });
  try { if (t === 'Diario' || t === 'Dicc') renderSuenosPlus(); } catch (e) {}
}
function setupSuenos() {
  var dlg = $('dreamsDialog'); if (!dlg || !$('dreamSave')) { setTimeout(setupSuenos, 800); return; }
  addKw('btnDreams', 'arquetipo sincronicidad patron lucido luna jung sombra diccionario pesadilla recurrente visita interpretacion viveza');
  // pestañas (una sola vez)
  SUE_TABS.forEach(function (t) {
    var tb = $('tabSue' + t);
    if (tb && !tb.dataset.w) { tb.dataset.w = '1'; tb.addEventListener('click', function () { switchSueTab(t); }); }
  });
  var b = $('btnDreams');
  if (b && !b.dataset.sueWrapped) {
    b.dataset.sueWrapped = '1';
    b.addEventListener('click', function () { setTimeout(function () { try { switchSueTab('Anotar'); renderSuenosPlus(); } catch (e) {} }, 60); });
  }
  // los selects de Anotar viven en el HTML: si están vacíos, se rellenan desde las listas
  try {
    var fill = function (id, arr) { var s = $(id); if (s && s.options && s.options.length < 2 && arr) s.innerHTML = arr.map(function (a) { return '<option>' + a + '</option>'; }).join(''); };
    fill('suePlusTipo', SUENOS_TIPOS); fill('suePlusArq', SUENOS_ARQ); fill('suePlusEmo', SUENOS_EMO);
  } catch (e) {}
  var dq = $('sueDiccQ');
  if (dq && !dq.dataset.sueBound) {
    dq.dataset.sueBound = '1';
    dq.addEventListener('input', function () { try { renderSueDicc(); } catch (e) {} });
  }
  var saveBtn = $('dreamSave');
  if (saveBtn && !saveBtn.dataset.suePlusWrapped) {
    saveBtn.dataset.suePlusWrapped = '1';
    saveBtn.addEventListener('click', function () {
      var txt = ($('dreamText').value || '').trim();
      if (!txt) { alert('Escribe tu sueño, aunque sea una palabra.'); return; }
      try {
        var tipo = $('suePlusTipo') ? $('suePlusTipo').value : '🌊 Común';
        var isLuc = ($('suePlusLuc') ? $('suePlusLuc').checked : false) || (tipo.indexOf('Lúcido') >= 0);
        var fecha = ($('suePlusFecha') && $('suePlusFecha').value) ? $('suePlusFecha').value : todayKey();
        var data = {
          titulo: clean($('suePlusTitulo') ? $('suePlusTitulo').value : '', 60) || txt.split(/\n|。|\./)[0].slice(0, 60) || 'Sueño',
          tipo: tipo, texto: clean(txt, 2000),
          arq: $('suePlusArq') ? $('suePlusArq').value : '',
          emo: $('suePlusEmo') ? $('suePlusEmo').value : '',
          viv: $('suePlusViv') ? +$('suePlusViv').value : 0,
          msg: clean($('suePlusMsg') ? $('suePlusMsg').value : '', 140),
          luc: isLuc, fecha: fecha
        };
        if (sueEditingId) {
          var dd = getSuenos();
          var ix = dd.findIndex(function (x) { return x.id === sueEditingId; });
          if (ix >= 0) { Object.keys(data).forEach(function (k) { dd[ix][k] = data[k]; }); }
          save('Sueño actualizado ✓');
        } else {
          data.id = uid('su');
          getSuenos().push(data);
          save('Sueño guardado en tu Diario ✓');
        }
        suenosClearForm();
        var st = $('dreamStatus'); if (st) { st.textContent = 'Guardado en tu Diario ✓ (no queda en notas)'; setTimeout(function () { st.textContent = ''; }, 2500); }
      } catch (e) {}
      setTimeout(function () { try { switchSueTab('Diario'); } catch (e) {} }, 60);
    });
  }
  var cancelBtn = $('dreamCancelEdit');
  if (cancelBtn && !cancelBtn.dataset.sueBound) {
    cancelBtn.dataset.sueBound = '1';
    cancelBtn.addEventListener('click', function () { suenosClearForm(); });
  }
  try { if ($('suePlusFecha') && !$('suePlusFecha').value) $('suePlusFecha').value = todayKey(); } catch (e) {}
  if ($('suePlusList')) { try { switchSueTab('Anotar'); renderSuenosPlus(); } catch (e) {} return; }
  var mount = $('suePlusMount');
  var form = dlg.querySelector('form') || dlg;
  var sec = document.createElement('div');
  sec.innerHTML =
    '<div class="menstrual-card" style="margin-top:2px;border-color:var(--gold)"><h4>📓 Mi Diario de sueños</h4>' +
    '<p class="muted" style="font-size:11px">Sección aparte: lo que anotas en ✍️ Anotar queda solo aquí, con tipo, arquetipo y luna para detectar patrones. <b>No se mezcla con las notas del día.</b> Conecta con 🪞 Autoconocimiento (Jung) y 🌸 Ciclo.</p>' +
    '<div id="suePlusPatrones" class="chip" style="display:block;white-space:normal;margin-top:6px"></div>' +
    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">🔎 Buscar en mi diario <input type="text" id="suePlusQ" placeholder="ej: río, abuela, miedo..." maxlength="30"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="suePlusShare" class="btn" style="width:auto">📤 Compartir diario</button><button type="button" id="suePlusImport" class="btn" style="width:auto" title="Busca líneas Sueño: en tus notas del día y las mueve al Diario">📥 Importar desde notas</button></div>' +
    '<div id="suePlusList" class="habits-list" style="margin-top:8px;max-height:260px"></div></div>';
  if (mount) mount.appendChild(sec);
  else { var closeRow = form.querySelector('.dlg-actions:last-child'); if (closeRow) form.insertBefore(sec, closeRow); else form.appendChild(sec); }
  if ($('suePlusQ')) $('suePlusQ').addEventListener('input', function () { try { renderSuenosPlus(); } catch (e) {} });
  if ($('suePlusImport')) $('suePlusImport').onclick = function () { suenosImportFromNotes(); };
  if ($('suePlusShare')) $('suePlusShare').onclick = function () {
    var dd = getSuenos();
    if (!dd.length) return alert('Sin sueños aún');
    share('💭 Mi diario de sueños (' + dd.length + ')', dd.slice().sort(function (a, b) { return a.fecha.localeCompare(b.fecha); }).map(function (r) { return '· ' + r.fecha + ' — ' + (r.titulo || 'Sueño') + ' [' + (r.tipo || '') + ' · ' + (r.emo || '') + '] ' + (r.texto || '').slice(0, 120); }).join('\n'));
  };
  try { renderSuenosPlus(); } catch (e) {}
}
/* ---------- A4: meditación ---------- */
function getMedita() { var a = store('meditaLog', []); return Array.isArray(a) ? a : []; }
function meditaRacha() {
  var set = {};
  getMedita().forEach(function (r) { set[r.fecha] = true; });
  var s = 0, cur = new Date(todayKey() + 'T12:00:00');
  if (!set[todayKey()]) cur = new Date(cur.getTime() - 86400000);
  for (var i = 0; i < 365; i++) {
    var k = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
    if (set[k]) s++; else break;
    cur = new Date(cur.getTime() - 86400000);
  }
  return s;
}
function renderMedita() {
  var box = $('medStats'); if (!box) return;
  var d = getMedita();
  var me = null; try { me = mensLunaForKey(todayKey()); } catch (e) {}
  var enLuna = me ? d.filter(function (r) { try { var m = mensLunaForKey(r.fecha); return m && m.luna === me.luna; } catch (e) { return false; } }) : [];
  var minLuna = enLuna.reduce(function (a, r) { return a + (+r.min || 0); }, 0);
  box.innerHTML = '🔥 Racha: <b>' + meditaRacha() + ' días</b> · 🌙 Esta luna: <b>' + enLuna.length + '</b> sesiones · <b>' + minLuna + '</b> min · total: ' + d.length + ' sesiones';
  var list = $('medList');
  if (list) list.innerHTML = d.length ? d.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 20).map(function (r) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span>🧘 <b>' + r.fecha + '</b> · ' + (+r.min || 0) + ' min · ' + esc(r.trad || '') + '<br><span class="muted" style="font-size:11px">' + esc(r.tec || '') + ' · ' + esc(lunaTxt(r.fecha)) + '</span></span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
  }).join('') : '<p class="muted">Sin sesiones aún. Usa el temporizador arriba y guarda al terminar.</p>';
  if (list) list.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var dd = getMedita(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderMedita(); }; });
}
function setupMedita() {
  var dlg = $('breathDialog'); if (!dlg) { setTimeout(setupMedita, 800); return; }
  addKw('btnBreath', 'meditacion vipassana zen zazen llellipun racha bitacora mindfulness');
  var b = $('btnBreath');
  if (b && !b.dataset.medWrapped) {
    b.dataset.medWrapped = '1';
    b.addEventListener('click', function () { setTimeout(function () { try { renderMedita(); } catch (e) {} }, 60); });
  }
  if ($('medTrad')) { try { renderMedita(); } catch (e) {} return; }
  var form = dlg.querySelector('form') || dlg;
  var sec = document.createElement('div');
  sec.innerHTML =
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold);text-align:left"><h4 style="text-align:center">🧘 Bitácora de meditación y respiración</h4>' +
    '<p class="muted" style="font-size:11px">Guarda cada práctica con su tradición. Racha por luna. Conecta con 📿 Métodos y ⏱ Tiempo.</p>' +
    '<div class="conv-row"><label>Tradición <select id="medTrad">' + MEDITA_TRAD.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></label><label>Minutos <input type="number" id="medMin" min="1" max="180" value="10" style="width:80px"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="medAdd" class="btn btn-accent" style="width:auto">+ Guardar práctica de hoy</button></div>' +
    '<div id="medStats" class="chip" style="display:block;white-space:normal;margin-top:6px"></div>' +
    '<div id="medList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div>';
  var closeRow = form.querySelector('.dlg-actions:last-child');
  if (closeRow) form.insertBefore(sec, closeRow); else form.appendChild(sec);
  $('medAdd').onclick = function () {
    var tec = ''; try { tec = ($('breathTitle') || {}).textContent || ''; } catch (e) {}
    getMedita().push({ id: uid('me'), fecha: todayKey(), trad: $('medTrad').value, min: Math.max(1, +$('medMin').value || 10), tec: clean(tec, 40) });
    save('Práctica guardada 🧘'); renderMedita();
  };
  try { renderMedita(); } catch (e) {}
}

/* ============================================================
   FASE B — Legado y puente generacional (Mente & Estudio)
   B1 Cuaderno de Transición → fusión en #psicoDialog
   B2 Voz de los Abuelos (grabador) → fusión en #talesDialog
   B3 Árbol genealógico lunar → pestaña en #memoryDialog
   B4 Mapa de mi año interior → fusión en #habitsDialog
   Todo local y privado por usuario (store + save).
   ============================================================ */
var TRANS_TIPOS = ['💌 Mensaje a un ser querido', '📖 Historia que quiero que recuerdes', '🕯️ Deseo de despedida', '🙏 Perdón y gratitud'];
var VOZ_TIPOS = ['🍲 Receta familiar', '🏔️ Historia del territorio', '💡 Consejo de vida', '📖 Cuento para desbloquear'];
var ARBOL_VINC = ['madre', 'padre', 'abuela', 'abuelo', 'bisabuela/o', 'tía/o', 'hermana/o', 'hija/o', 'sobrina/o', 'nieta/o', 'otro'];
function getTrans() { var a = store('transicionLog', []); return Array.isArray(a) ? a : []; }
/* ---------- B1: cuaderno de transición ---------- */
function renderTrans() {
  if (!$('trTipo')) return;
  var d = getTrans().slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  $('trList').innerHTML = d.length ? d.map(function (r) {
    return '<div class="habit-item"><b>' + esc(r.tipo) + '</b> → ' + esc(r.para || 'quien lo lea') + ' <span class="muted" style="font-size:11px">· ' + r.fecha + ' · ' + esc(lunaTxt(r.fecha)) + '</span><p style="font-size:12px;white-space:pre-wrap">' + esc(r.texto) + '</p><div style="display:flex;gap:6px"><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Vacío. Este cuaderno es solemne y privado: mensajes, historias que quieres que recuerden, deseos de despedida. Conecta con 📖 Epew y 🧩 Memoria.</p>';
  $('trList').querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar esta página del cuaderno?')) return; var dd = getTrans(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderTrans(); }; });
  $('trList').querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var dd = getTrans(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-share'); }); if (r) share('🪶 ' + r.tipo + ' → ' + (r.para || ''), r.texto); }; });
  var st = $('trStats'); if (st) st.textContent = d.length + ' páginas · solo en este dispositivo';
}
function setupTrans() {
  var dlg = $('psicoDialog'); if (!dlg) { setTimeout(setupTrans, 800); return; }
  addKw('btnPsico', 'transicion legado despedida mensaje historia voluntad final duelo');
  var b = $('btnPsico');
  if (b && !b.dataset.trWrapped) { b.dataset.trWrapped = '1'; b.addEventListener('click', function () { setTimeout(function () { try { renderTrans(); } catch (e) {} }, 60); }); }
  if ($('trTipo')) { try { renderTrans(); } catch (e) {} return; }
  var form = dlg.querySelector('form') || dlg;
  var sec = document.createElement('div');
  sec.innerHTML =
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🪶 Cuaderno de Transición <span class="muted" style="font-weight:normal">· legado consciente</span></h4>' +
    '<p class="muted" style="font-size:11px">Espacio solemne y privado para dejar mensajes, historias y deseos de despedida (no solo médicos). <b>Nada sale de este dispositivo.</b> Si estás en crisis, pide ayuda: <b>*4141</b> (Chile, 24h).</p>' +
    '<div class="conv-row"><label style="flex:2">Tipo <select id="trTipo">' + TRANS_TIPOS.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></label><label>Para <input type="text" id="trPara" placeholder="ej: mi hija Millaray" maxlength="40"></label></div>' +
    '<label>Texto <textarea id="trTexto" rows="4" placeholder="Lo que quiero que recuerdes..." maxlength="1500"></textarea></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="trAdd" class="btn btn-accent" style="width:auto">+ Guardar página</button></div>' +
    '<div id="trList" class="habits-list" style="margin-top:8px;max-height:240px"></div>' +
    '<span id="trStats" class="muted" style="font-size:11px"></span></div>';
  var closeRow = form.querySelector('.dlg-actions:last-child');
  if (closeRow) form.insertBefore(sec, closeRow); else form.appendChild(sec);
  $('trAdd').onclick = function () {
    var x = clean($('trTexto').value, 1500); if (!x) return alert('Escribe la página primero');
    getTrans().push({ id: uid('tr'), fecha: todayKey(), tipo: $('trTipo').value, para: clean($('trPara').value, 40), texto: x });
    save('Página guardada 🪶'); $('trTexto').value = ''; $('trPara').value = ''; renderTrans();
  };
  try { renderTrans(); } catch (e) {}
}
/* ---------- B2: voz de los abuelos ---------- */
function getVoz() { var a = store('vozAbuelos', []); return Array.isArray(a) ? a : []; }
function vozBytes() { var n = 0; getVoz().forEach(function (r) { n += (r.dataUrl || '').length; }); return n; }
function vozLunaActual() { try { var m = mensLunaForKey(todayKey()); if (m) return m.luna; } catch (e) {} return 1; }
function renderVoz() {
  if (!$('vozList')) return;
  var sup = (typeof MediaRecorder !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  var w = $('vozWarn'); if (w) w.innerHTML = sup ? '' : '⚠️ Este dispositivo no permite grabar audio aquí; igual puedes guardar el texto/transcripción abajo.';
  var hoy = vozLunaActual();
  var d = getVoz().slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  var kb = Math.round(vozBytes() / 1024);
  var st = $('vozStats'); if (st) st.textContent = d.length + ' grabaciones · ~' + kb + ' KB en este dispositivo (límite sugerido 4 MB)';
  if (!d.length) { $('vozList').innerHTML = '<p class="muted">Sin voces aún. Graba una receta, una historia de Penco o un consejo. Los niños desbloquean un cuento por luna.</p>'; return; }
  $('vozList').innerHTML = d.map(function (r) {
    var disp = (+r.desbloqueo || 1) <= hoy;
    return '<div class="habit-item" style="' + (disp ? 'border-color:var(--gold)' : '') + '"><b>' + esc(r.icon || '🎙️') + ' ' + esc(r.titulo) + '</b> <span class="chip" style="font-size:10px">' + esc(r.tipo) + '</span> ' +
      '<span class="chip" style="font-size:10px">' + (disp ? '🌕 desbloqueado (Luna ' + r.desbloqueo + ')' : '🔒 se desbloquea Luna ' + r.desbloqueo) + '</span><br>' +
      '<span class="muted" style="font-size:11px">🎙️ ' + esc(r.quien || 'abuelo/a') + ' · ' + r.fecha + (r.dur ? ' · ' + r.dur + 's' : '') + '</span>' +
      (r.dataUrl ? '<br><audio controls preload="none" src="' + r.dataUrl + '" style="width:100%;margin-top:6px"></audio>' : '') +
      (r.texto ? '<p style="font-size:12px;white-space:pre-wrap">' + esc(r.texto) + '</p>' : '') +
      '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤 Compartir texto</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕ Borrar</button></div></div>';
  }).join('');
  $('vozList').querySelectorAll('[data-del]').forEach(function (bb) { bb.onclick = function () { if (!confirm('¿Borrar esta grabación?')) return; var dd = getVoz(); var i = dd.findIndex(function (x) { return x.id === bb.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderVoz(); }; });
  $('vozList').querySelectorAll('[data-share]').forEach(function (bb) { bb.onclick = function () { var dd = getVoz(); var r = dd.find(function (x) { return x.id === bb.getAttribute('data-share'); }); if (r) share('🗣️ ' + r.titulo + ' (' + (r.quien || '') + ')', (r.texto || '(solo audio, privado en el dispositivo)') + '\n— ' + r.tipo); }; });
}
var vozRec = null, vozChunks = [], vozStart = 0;
function setupVoz() {
  /* La Voz de los Abuelos ahora es seccion completa (vozDialog): no inyectar el panel antiguo en Cuentos. */
  if ($('vozDialog')) return;
  var dlg = $('talesDialog'); if (!dlg) { setTimeout(setupVoz, 800); return; }
  addKw('btnTales', 'abuelo abuela voz grabar receta historia consejo transmitir oral desbloquear');
  var b = $('btnTales');
  if (b && !b.dataset.vozWrapped) { b.dataset.vozWrapped = '1'; b.addEventListener('click', function () { setTimeout(function () { try { renderVoz(); } catch (e) {} }, 60); }); }
  if ($('vozTitulo')) { try { renderVoz(); } catch (e) {} return; }
  var form = dlg.querySelector('form') || dlg;
  var sec = document.createElement('div');
  sec.innerHTML =
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🗣️ La Voz de los Abuelos <span class="muted" style="font-weight:normal">· transmisión oral</span></h4>' +
    '<p class="muted" style="font-size:11px">Graba recetas, historias del territorio y consejos. Cada grabación se <b>desbloquea en una luna</b>: los niños descubren un cuento por luna. Privado y local. Conecta con 📖 Epew y Cuentos.</p>' +
    '<div id="vozWarn" class="chip" style="display:block;white-space:normal"></div>' +
    '<div class="conv-row"><label style="flex:2">Título <input type="text" id="vozTitulo" placeholder="ej: Cómo era Penco antes" maxlength="60"></label><label>Quién <input type="text" id="vozQuien" placeholder="ej: abuela Rosa" maxlength="30"></label></div>' +
    '<div class="conv-row"><label>Tipo <select id="vozTipo">' + VOZ_TIPOS.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></label><label>Desbloqueo <select id="vozLuna">' + Array.from({ length: 13 }, function (_, i) { return '<option value="' + (i + 1) + '">Luna ' + (i + 1) + '</option>'; }).join('') + '</select></label></div>' +
    '<label>Texto / transcripción (opcional) <textarea id="vozTexto" rows="2" placeholder="resumen o transcripción..." maxlength="800"></textarea></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;align-items:center"><button type="button" id="vozRec" class="btn btn-accent" style="width:auto">⏺️ Grabar</button><button type="button" id="vozStop" class="btn hidden" style="width:auto">⏹️ Detener</button><span id="vozTimer" class="chip">00:00</span></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="vozAdd" class="btn" style="width:auto">+ Guardar solo texto</button></div>' +
    '<div id="vozList" class="habits-list" style="margin-top:8px;max-height:280px"></div>' +
    '<span id="vozStats" class="muted" style="font-size:11px"></span></div>';
  var closeRow = form.querySelector('.dlg-actions:last-child');
  if (closeRow) form.insertBefore(sec, closeRow); else form.appendChild(sec);
  try { $('vozLuna').value = String(vozLunaActual()); } catch (e) {}
  var timerInt = null;
  function paintT() { var s = Math.floor((Date.now() - vozStart) / 1000); $('vozTimer').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); if (s >= 180) stopRec(); }
  function stopRec() {
    clearInterval(timerInt); timerInt = null;
    $('vozRec').classList.remove('hidden'); $('vozStop').classList.add('hidden');
    if (vozRec && vozRec.state !== 'inactive') { try { vozRec.stop(); } catch (e) {} }
  }
  $('vozRec').onclick = function () {
    if (!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return alert('Grabación no disponible; guarda el texto.');
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      vozChunks = [];
      var mime = ''; try { if (MediaRecorder.isTypeSupported('audio/webm')) mime = 'audio/webm'; } catch (e) {}
      vozRec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      vozRec.ondataavailable = function (e) { if (e.data && e.data.size) vozChunks.push(e.data); };
      vozRec.onstop = function () {
        try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
        var dur = Math.floor((Date.now() - vozStart) / 1000);
        var blob = new Blob(vozChunks, { type: (vozRec && vozRec.mimeType) || 'audio/webm' });
        var rd = new FileReader();
        rd.onload = function () {
          var url = String(rd.result || '');
          if (vozBytes() + url.length > 4 * 1024 * 1024) return alert('Muy pesado para el almacenamiento local: prueba más corto (<60s) o guarda texto.');
          var icons = { '🍲 Receta familiar': '🍲', '🏔️ Historia del territorio': '🏔️', '💡 Consejo de vida': '💡', '📖 Cuento para desbloquear': '📖' };
          getVoz().push({ id: uid('vz'), fecha: todayKey(), tipo: $('vozTipo').value, titulo: clean($('vozTitulo').value, 60) || 'Sin título', quien: clean($('vozQuien').value, 30), desbloqueo: +$('vozLuna').value || 1, texto: clean($('vozTexto').value, 800), dur: dur, dataUrl: url, icon: icons[$('vozTipo').value] || '🎙️' });
          save('Voz guardada 🗣️'); $('vozTitulo').value = ''; $('vozTexto').value = ''; renderVoz();
        };
        rd.readAsDataURL(blob);
      };
      vozRec.start(); vozStart = Date.now();
      $('vozRec').classList.add('hidden'); $('vozStop').classList.remove('hidden');
      timerInt = setInterval(paintT, 500); paintT();
    }).catch(function () { alert('Sin permiso de micrófono. Revisa el permiso del sistema.'); });
  };
  $('vozStop').onclick = stopRec;
  if (!dlg.dataset.vozCloseWrapped) {
    dlg.dataset.vozCloseWrapped = '1';
    dlg.addEventListener('close', function () {
      try { if (vozRec && vozRec.state && vozRec.state !== 'inactive') { try { vozRec.stop(); } catch (e) {} } } catch (e) {}
      try { clearInterval(timerInt); } catch (e) {} timerInt = null;
      var rb = $('vozRec'), sb = $('vozStop');
      if (rb) rb.classList.remove('hidden'); if (sb) sb.classList.add('hidden');
    });
  }
  $('vozAdd').onclick = function () {
    var t = clean($('vozTitulo').value, 60); if (!t) return alert('Ponle título');
    var icons = { '🍲 Receta familiar': '🍲', '🏔️ Historia del territorio': '🏔️', '💡 Consejo de vida': '💡', '📖 Cuento para desbloquear': '📖' };
    getVoz().push({ id: uid('vz'), fecha: todayKey(), tipo: $('vozTipo').value, titulo: t, quien: clean($('vozQuien').value, 30), desbloqueo: +$('vozLuna').value || 1, texto: clean($('vozTexto').value, 800), dur: 0, dataUrl: '', icon: icons[$('vozTipo').value] || '🎙️' });
    save('Guardado 🗣️'); $('vozTitulo').value = ''; $('vozTexto').value = ''; renderVoz();
  };
  try { renderVoz(); } catch (e) {}
}
/* ---------- B3: árbol genealógico lunar ---------- */
function getArbol() { var a = store('arbolLunar', []); return Array.isArray(a) ? a : []; }
function renderArbol() {
  if (!$('arbList')) return;
  var d = getArbol();
  var porLuna = {};
  d.forEach(function (r) { (porLuna[r.luna] = porLuna[r.luna] || []).push(r); });
  $('arbCircle').innerHTML = Array.from({ length: 13 }, function (_, i) {
    var n = i + 1, names = (porLuna[n] || []).map(function (r) { return esc(r.nombre) + (r.partio ? ' 🕊️' : ''); }).join('<br>');
    return '<div class="chip" style="font-size:10px;text-align:center;min-width:88px;' + (names ? 'border-color:var(--gold)' : '') + '">🌙 L' + n + (names ? '<br><b>' + names + '</b>' : '<br><span class="muted">—</span>') + '</div>';
  }).join('');
  $('arbList').innerHTML = d.length ? d.slice().sort(function (a, b) { return a.luna - b.luna; }).map(function (r) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span>🌙 L' + r.luna + ' · <b>' + esc(r.nombre) + '</b> (' + esc(r.vinc) + ')' + (r.partio ? ' 🕊️' : ' 🌱') + (r.nota ? '<br><span class="muted" style="font-size:11px">' + esc(r.nota) + '</span>' : '') + '</span><span style="display:flex;gap:6px;flex:0 0 auto"><button class="btn" style="width:auto;font-size:11px" data-hon="' + r.id + '" title="Alternar honra">🕯️</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></span></div>';
  }).join('') : '<p class="muted">Vacío. Registra a cada ancestro en su luna de nacimiento: un círculo, no una línea. Honra a quienes partieron 🕊️.</p>';
  $('arbList').querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar del árbol?')) return; var dd = getArbol(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderArbol(); }; });
  $('arbList').querySelectorAll('[data-hon]').forEach(function (b) { b.onclick = function () { var dd = getArbol(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-hon'); }); if (r) r.partio = !r.partio; save('Guardado 🕯️'); renderArbol(); }; });
  var st = $('arbStats'); if (st) st.textContent = d.length + ' ancestros · ' + d.filter(function (r) { return r.partio; }).length + ' honrados 🕊️';
}
function setupArbol() {
  var dlg = $('memoryDialog'); if (!dlg) { setTimeout(setupArbol, 800); return; }
  addKw('btnMemory', 'arbol genealógico ancestro familia honrar abuelo luna nacimiento');
  var b = $('btnMemory');
  if (b && !b.dataset.arbWrapped) { b.dataset.arbWrapped = '1'; b.addEventListener('click', function () { setTimeout(function () { try { renderArbol(); } catch (e) {} }, 60); }); }
  ['tabMemoryLoci', 'tabMemoryPairs', 'tabMemorySeq', 'tabMemoryWords', 'tabMemoryAtt', 'tabMemoryProg'].forEach(function (id) {
    var t = $(id);
    if (t && !t.dataset.arbWrapped) { t.dataset.arbWrapped = '1'; t.addEventListener('click', function () { var p = $('memoryArbolPanel'); if (p) p.classList.add('hidden'); var tb = $('tabMemoryArbol'); if (tb) tb.classList.remove('btn-accent'); }); }
  });
  if ($('tabMemoryArbol')) { try { renderArbol(); } catch (e) {} return; }
  var ref = $('tabMemoryProg');
  var tabBtn = document.createElement('button');
  tabBtn.type = 'button'; tabBtn.id = 'tabMemoryArbol'; tabBtn.className = 'btn'; tabBtn.style.width = 'auto';
  tabBtn.textContent = '🌳 Árbol';
  if (ref && ref.parentNode) ref.parentNode.appendChild(tabBtn);
  var refP = $('memoryProgPanel');
  var panel = document.createElement('div');
  panel.id = 'memoryArbolPanel'; panel.className = 'hidden';
  panel.innerHTML =
    '<div class="menstrual-card"><h4>🌳 Árbol genealógico lunar</h4>' +
    '<p class="muted" style="font-size:11px">Registro circular: cada ancestro en su <b>luna de nacimiento</b>. 🕯️ honra a quienes partieron. Conecta con 🏔️ Territorio y 🪶 Legado. Privado y local.</p>' +
    '<div id="arbCircle" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:8px 0"></div>' +
    '<div class="conv-row"><label style="flex:2">Nombre <input type="text" id="arbNombre" placeholder="ej: Abuela Rosa" maxlength="40"></label><label>Vínculo <select id="arbVinc">' + ARBOL_VINC.map(function (v) { return '<option>' + v + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Luna nacimiento <select id="arbLuna">' + Array.from({ length: 13 }, function (_, i) { return '<option value="' + (i + 1) + '">Luna ' + (i + 1) + '</option>'; }).join('') + '</select></label><label class="check-row" style="align-self:flex-end"><input type="checkbox" id="arbPartio"> 🕊️ ya partió</label></div>' +
    '<label>Nota / honra <input type="text" id="arbNota" placeholder="ej: me enseñó el charquicán" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="arbAdd" class="btn btn-accent" style="width:auto">+ Agregar al círculo</button></div>' +
    '<div id="arbList" class="habits-list" style="margin-top:8px;max-height:220px"></div>' +
    '<span id="arbStats" class="muted" style="font-size:11px"></span></div>';
  if (refP && refP.parentNode) refP.parentNode.appendChild(panel);
  tabBtn.onclick = function () {
    ['memoryLociPanel', 'memoryPairsPanel', 'memorySeqPanel', 'memoryWordsPanel', 'memoryAttPanel', 'memoryProgPanel'].forEach(function (pid) { var p = $(pid); if (p) p.classList.add('hidden'); });
    ['tabMemoryLoci', 'tabMemoryPairs', 'tabMemorySeq', 'tabMemoryWords', 'tabMemoryAtt', 'tabMemoryProg'].forEach(function (tid) { var t = $(tid); if (t) t.classList.remove('btn-accent'); });
    panel.classList.remove('hidden'); tabBtn.classList.add('btn-accent'); renderArbol();
  };
  $('arbAdd').onclick = function () {
    var n = clean($('arbNombre').value, 40); if (!n) return alert('Escribe el nombre');
    getArbol().push({ id: uid('ab'), nombre: n, vinc: $('arbVinc').value, luna: +$('arbLuna').value || 1, partio: $('arbPartio').checked, nota: clean($('arbNota').value, 80) });
    save('Ancestro al círculo 🌳'); $('arbNombre').value = ''; $('arbNota').value = ''; $('arbPartio').checked = false; renderArbol();
  };
  try { renderArbol(); } catch (e) {}
}
/* ---------- B4: mapa de mi año interior ---------- */
function getMapaTxt() { var a = store('mapaAnioTxt', {}); return (a && typeof a === 'object') ? a : {}; }
function mapaYear() { try { if (typeof currentCycleYear === 'function') return currentCycleYear(); } catch (e) {} return new Date().getFullYear(); }
function mapaStats() {
  var per = {};
  for (var i = 1; i <= 13; i++) per[i] = { hab: 0, gra: 0, psi: 0, sue: 0, med: 0 };
  var memo = {};
  function mluna(k) { if (memo[k] === undefined) { try { memo[k] = mensLunaForKey(k); } catch (e) { memo[k] = null; } } return memo[k]; }
  try {
    var h = getHabitData(); Object.keys(h.entries || {}).forEach(function (k) {
      try { var m = mluna(k); if (m && per[m.luna]) per[m.luna].hab += Object.keys(h.entries[k]).length; } catch (e) {}
    });
  } catch (e) {}
  try {
    var g = getGratitudData(); Object.keys(g.entries || {}).forEach(function (k) {
      try { var m = mluna(k); if (m && per[m.luna]) { var gg = g.entries[k]; var hasG = (typeof gratTiene === 'function') ? gratTiene(gg) : (gg && (gg.t1 || gg.t2 || gg.t3)); if (hasG) per[m.luna].gra++; } } catch (e) {}
    });
  } catch (e) {}
  try {
    var p = getPsicoData(); Object.keys((p && p.entries) || {}).forEach(function (k) {
      try { var m = mluna(k); if (m && per[m.luna]) per[m.luna].psi += Object.keys(p.entries[k]).length; } catch (e) {}
    });
  } catch (e) {}
  try {
    getSuenos().forEach(function (r) { try { var m = mluna(r.fecha); if (m && per[m.luna]) per[m.luna].sue++; } catch (e) {} });
    getMedita().forEach(function (r) { try { var m = mluna(r.fecha); if (m && per[m.luna]) per[m.luna].med++; } catch (e) {} });
  } catch (e) {}
  return per;
}
function renderMapa() {
  if (!$('mapaBars')) return;
  var per = mapaStats(), y = mapaYear(), txt = getMapaTxt();
  var max = 1; for (var i = 1; i <= 13; i++) max = Math.max(max, per[i].hab + per[i].gra + per[i].psi + per[i].sue + per[i].med);
  $('mapaBars').innerHTML = Array.from({ length: 13 }, function (_, k) {
    var n = k + 1, p = per[n], tot = p.hab + p.gra + p.psi + p.sue + p.med;
    var key = y + '-L' + n, aprend = txt[key] || '';
    return '<div class="si-card"><h4>🌙 Luna ' + n + ' <span class="chip" style="font-size:10px">' + tot + ' huellas</span></h4>' +
      '<div style="background:var(--panel);border-radius:6px;height:10px;overflow:hidden"><div style="width:' + Math.round(tot / max * 100) + '%;height:100%;background:linear-gradient(90deg,#7ab8ff,#e8c56a,#a9d18e)"></div></div>' +
      '<p class="muted" style="font-size:11px;margin-top:4px">✅ ' + p.hab + ' · 🙏 ' + p.gra + ' · 🪞 ' + p.psi + ' · 💭 ' + p.sue + ' · 🧘 ' + p.med + '</p>' +
      '<label style="font-size:11px">Aprendizaje <input type="text" data-mapakey="' + key + '" value="' + esc(aprend) + '" placeholder="una frase de esta luna..." maxlength="120"></label></div>';
  }).join('');
  $('mapaBars').querySelectorAll('[data-mapakey]').forEach(function (inp) {
    inp.onchange = function () { var t = getMapaTxt(); t[inp.getAttribute('data-mapakey')] = clean(inp.value, 120); try { userData().mapaAnioTxt = t; } catch (e) {} save('Mapa guardado 📊'); };
  });
  var totTxt = Object.keys(txt).filter(function (k) { return String(k).indexOf(y + '-L') === 0 && txt[k]; }).length;
  var st = $('mapaStats'); if (st) st.textContent = 'Ciclo ' + y + ' · ' + totTxt + '/13 lunas con aprendizaje · resumen de tu viaje (hábitos, gratitud, psico, sueños, meditación)';
}
function setupMapa() {
  var dlg = $('habitsDialog'); if (!dlg) { setTimeout(setupMapa, 800); return; }
  addKw('btnHabits', 'mapa año interior resumen anual viaje emociones hitos aprendizajes ciclo');
  var b = $('btnHabits');
  if (b && !b.dataset.mapaWrapped) { b.dataset.mapaWrapped = '1'; b.addEventListener('click', function () { setTimeout(function () { try { renderMapa(); } catch (e) {} }, 60); }); }
  if ($('mapaBars')) { try { renderMapa(); } catch (e) {} return; }
  var form = dlg.querySelector('form') || dlg;
  var sec = document.createElement('div');
  sec.innerHTML =
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>📊 Mapa de mi año interior <span class="muted" style="font-weight:normal">· tu viaje en 13 lunas</span></h4>' +
    '<p class="muted" style="font-size:11px">Visualización anual: huellas por luna (hábitos, gratitud, autoconocimiento, sueños, meditación) + tu aprendizaje. Al cerrar el ciclo, léelo como resumen del viaje. Conecta con ✅ Hábitos y 📓 Gratitud.</p>' +
    '<span id="mapaStats" class="muted" style="font-size:11px"></span>' +
    '<div id="mapaBars" style="margin-top:8px;display:flex;flex-direction:column;gap:8px;max-height:340px;overflow-y:auto"></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="mapaShare" class="btn" style="width:auto">📤 Compartir resumen</button></div></div>';
  var closeRow = form.querySelector('.dlg-actions:last-child');
  if (closeRow) form.insertBefore(sec, closeRow); else form.appendChild(sec);
  $('mapaShare').onclick = function () {
    var per = mapaStats(), y = mapaYear(), txt = getMapaTxt();
    share('📊 Mi año interior · ciclo ' + y, Array.from({ length: 13 }, function (_, k) {
      var n = k + 1, p = per[n];
      return 'Luna ' + n + ': ✅' + p.hab + ' 🙏' + p.gra + ' 🪞' + p.psi + ' 💭' + p.sue + ' 🧘' + p.med + (txt[y + '-L' + n] ? ' — “' + txt[y + '-L' + n] + '”' : '');
    }).join('\n'));
  };
  try { renderMapa(); } catch (e) {}
}

/* ============================================================
   FASE D — Comunidad (Emergencias & Comunidad, sin grupos nuevos)
   D1 Directivas anticipadas Ley 21.331 → pestaña en #derechosDialog
   D2 Círculo de Saberes (wiki) → sección en #mingaDialog
   D3 Círculos de presencia → sección en #mingaDialog
   ============================================================ */
function getVolunt() { var a = store('voluntades', null); return (a && typeof a === 'object') ? a : {}; }
function renderVolunt() {
  if (!$('volQuiero')) return;
  var v = getVolunt();
  if (document.activeElement !== $('volQuiero')) $('volQuiero').value = v.quiero || '';
  if (document.activeElement !== $('volNoQuiero')) $('volNoQuiero').value = v.noquiero || '';
  if (document.activeElement !== $('volRepre')) $('volRepre').value = v.repre || '';
  if ($('volFecha') && !v.fecha) { try { if (!$('volFecha').value) $('volFecha').value = todayKey(); } catch (e) {} }
  if ($('volFecha') && v.fecha && document.activeElement !== $('volFecha') && !$('volFecha').value) $('volFecha').value = v.fecha;
  var st = $('volStats');
  if (st) st.textContent = (v.quiero || v.noquiero) ? ('Plantilla guardada (' + (v.fecha || 'sin fecha') + ') · privada en este dispositivo · revísala cada luna') : 'Plantilla vacía: escríbela con calma, conversada en familia.';
}
function setupVoluntades() {
  var dlg = $('derechosDialog'); if (!dlg || !$('tabDerLog')) { setTimeout(setupVoluntades, 800); return; }
  addKw('btnDerechos', 'voluntad anticipada ley 21331 fin vida cuidados paliativos representante reanimacion');
  if ($('tabDerVol')) { try { renderVolunt(); } catch (e) {} return; }
  var tabBtn = document.createElement('button');
  tabBtn.type = 'button'; tabBtn.id = 'tabDerVol'; tabBtn.className = 'btn'; tabBtn.style.width = 'auto';
  tabBtn.textContent = '📜 Voluntades';
  $('tabDerLog').parentNode.appendChild(tabBtn);
  var logPanel = $('logPanel');
  var panel = document.createElement('div');
  panel.id = 'volPanel'; panel.className = 'hidden';
  panel.innerHTML =
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📜 Guía local · Ley 21.331 de voluntades anticipadas</h4>' +
    '<p style="font-size:12px;line-height:1.6">Puedes dejar por escrito <b>qué cuidados aceptas y cuáles no</b> si algún día no puedes decidir (accidente, enfermedad grave). <b>Requisitos:</b> ser mayor de edad, documento escrito y firmado (ideal ante notario o en tu CESFAM/hospital, que lo archiva en tu ficha). <b>Es revocable</b> cuando quieras. <b>No reemplaza testamento</b> (eso es bienes, esto es cuidados). <b>Informativo, no asesoría legal:</b> confirma en chileatiende.cl y con tu matrona/médico. Conecta con ⚖️ Derechos y 🪶 Transición.</p></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>✍️ Mi plantilla (privada)</h4>' +
    '<div class="conv-row"><label>Representante <input type="text" id="volRepre" placeholder="ej: mi hermana Ana · +56 9..." maxlength="60"></label><label>Fecha <input type="date" id="volFecha"></label></div>' +
    '<label>✅ Lo que QUIERO <textarea id="volQuiero" rows="3" placeholder="ej: estar en casa si es posible · acompañamiento de mi familia · mis ritos (vela, canto, epew) · alivio del dolor siempre..." maxlength="600"></textarea></label>' +
    '<label>🚫 Lo que NO quiero <textarea id="volNoQuiero" rows="3" placeholder="ej: reanimación si no hay posibilidad de recuperarme · hospitalización prolongada sin sentido · ..." maxlength="600"></textarea></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="volSave" class="btn btn-accent" style="width:auto">💾 Guardar plantilla</button><button type="button" id="volShare" class="btn" style="width:auto">📤 Compartir</button></div>' +
    '<span id="volStats" class="muted" style="font-size:11px"></span></div>';
  logPanel.parentNode.appendChild(panel);
  tabBtn.onclick = function () { try { switchDerTab('Vol'); } catch (e) {} };
  if (typeof switchDerTab === 'function' && !switchDerTab._volWrapped) {
    var orig = switchDerTab;
    switchDerTab = function (t) {
      var pp = $('volPanel'), tb = $('tabDerVol');
      if (t === 'Vol') {
        ['derPanel', 'debPanel', 'recPanel', 'logPanel'].forEach(function (pid) { var p = $(pid); if (p) p.classList.add('hidden'); });
        if (pp) pp.classList.remove('hidden');
        ['tabDerDer', 'tabDerDeb', 'tabDerRec', 'tabDerLog'].forEach(function (id) { var x = $(id); if (x) x.classList.remove('btn-accent'); });
        if (tb) tb.classList.add('btn-accent'); renderVolunt(); return;
      }
      orig(t);
      if (pp) pp.classList.add('hidden'); if (tb) tb.classList.remove('btn-accent');
    };
    switchDerTab._volWrapped = true;
  }
  $('volSave').onclick = function () {
    try {
      userData().voluntades = { quiero: clean($('volQuiero').value, 600), noquiero: clean($('volNoQuiero').value, 600), repre: clean($('volRepre').value, 60), fecha: $('volFecha').value || todayKey() };
    } catch (e) {}
    save('Voluntades guardadas 📜'); renderVolunt();
  };
  $('volShare').onclick = function () {
    var v = getVolunt();
    if (!v.quiero && !v.noquiero) return alert('Plantilla vacía');
    share('📜 Mis voluntades anticipadas (' + (v.fecha || '') + ')', 'Representante: ' + (v.repre || '—') + '\n\n✅ QUIERO:\n' + (v.quiero || '—') + '\n\n🚫 NO QUIERO:\n' + (v.noquiero || '—'));
  };
  var b = $('btnDerechos');
  if (b && !b.dataset.volWrapped) { b.dataset.volWrapped = '1'; b.addEventListener('click', function () { setTimeout(function () { try { renderVolunt(); } catch (e) {} }, 60); }); }
  try { renderVolunt(); } catch (e) {}
}
/* ---------- D2+D3: saberes + círculos en Minga ---------- */
var SAB_CAT = ['🌿 Salud / lawen', '🍲 Cocina', '🌊 Territorio / mar', '🛠️ Oficio', '📖 Historia local', '🗣️ Mapuzugun'];
function getSaberes() { var a = store('saberes', []); return Array.isArray(a) ? a : []; }
function getCirculos() { var a = store('circulos', []); return Array.isArray(a) ? a : []; }
function renderSaberes() {
  if (!$('sabList')) return;
  var q = (($('sabQ') || {}).value || '').toLowerCase();
  var cat = ($('sabCatF') || {}).value || 'todas';
  var d = getSaberes().slice().sort(function (a, b) { return (b.val || 0) - (a.val || 0) || b.fecha.localeCompare(a.fecha); })
    .filter(function (r) { if (cat !== 'todas' && r.cat !== cat) return false; if (q && (r.titulo + ' ' + r.texto + ' ' + (r.autor || '')).toLowerCase().indexOf(q) < 0) return false; return true; });
  $('sabList').innerHTML = d.length ? d.map(function (r) {
    return '<div class="si-card"><h4>' + esc(r.cat || '🌿') + ' ' + esc(r.titulo) + '</h4><p>' + esc(r.texto) + '</p><p class="muted" style="font-size:11px">— ' + esc(r.autor || 'vecina/o') + ' · ' + r.fecha + ' · 👍 ' + (r.val || 0) + '</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" style="width:auto;font-size:11px" data-val="' + r.id + '">👍 Me sirve</button><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Sin saberes aún. Ej: “Mi abuela curaba el empacho con...”, “En mi calle se juntaban a...”. Se modera en comunidad.</p>';
  $('sabList').querySelectorAll('[data-val]').forEach(function (x) { x.onclick = function () { var dd = getSaberes(); var r = dd.find(function (z) { return z.id === x.getAttribute('data-val'); }); if (r) { r.val = (r.val || 0) + 1; save('¡Chaltu! 👍'); renderSaberes(); } }; });
  $('sabList').querySelectorAll('[data-del]').forEach(function (x) { x.onclick = function () { if (!confirm('¿Borrar aporte?')) return; var dd = getSaberes(); var i = dd.findIndex(function (z) { return z.id === x.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderSaberes(); }; });
  $('sabList').querySelectorAll('[data-share]').forEach(function (x) { x.onclick = function () { var dd = getSaberes(); var r = dd.find(function (z) { return z.id === x.getAttribute('data-share'); }); if (r) share('🌿 ' + r.titulo, r.texto + '\n— ' + (r.autor || '')); }; });
  var st = $('sabStats'); if (st) st.textContent = getSaberes().length + ' saberes compartidos';
}
function renderCirculos() {
  if (!$('cirList')) return;
  var hoy = todayKey();
  var d = getCirculos().slice().sort(function (a, b) { return a.fecha.localeCompare(b.fecha); });
  $('cirList').innerHTML = d.length ? d.map(function (r) {
    var est = r.fecha === hoy ? '🕯️ <b>HOY</b>' : (r.fecha > hoy ? 'próximo' : 'realizado');
    return '<div class="habit-item"><b>🕯️ ' + esc(r.nombre) + '</b> <span class="chip" style="font-size:10px">' + esc(r.tipo) + '</span> <span class="chip" style="font-size:10px">' + est + '</span><br>' +
      '<span class="muted" style="font-size:11px">📅 ' + r.fecha + ' ' + esc(r.hora || '') + ' · 📍 ' + esc(r.lugar || '') + (r.cupo ? ' · cupo ' + esc(r.cupo) : '') + ' · ✅ voy: ' + (r.voy ? 'sí' : '—') + (r.extras ? ' +' + r.extras : '') + '</span>' +
      '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><button class="btn" style="width:auto;font-size:11px" data-voy="' + r.id + '">' + (r.voy ? '✓ Voy' : '👋 Anotarme') + '</button><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤 Invitar</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Sin círculos. Convoca meditación, tejido, siembra o canto en Penco/Bío-Bío, ideal en luna nueva o llena.</p>';
  $('cirList').querySelectorAll('[data-voy]').forEach(function (x) { x.onclick = function () { var dd = getCirculos(); var r = dd.find(function (z) { return z.id === x.getAttribute('data-voy'); }); if (r) { r.voy = !r.voy; save(r.voy ? 'Anotado 🕯️' : 'Guardado'); renderCirculos(); } }; });
  $('cirList').querySelectorAll('[data-del]').forEach(function (x) { x.onclick = function () { if (!confirm('¿Borrar círculo?')) return; var dd = getCirculos(); var i = dd.findIndex(function (z) { return z.id === x.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderCirculos(); }; });
  $('cirList').querySelectorAll('[data-share]').forEach(function (x) { x.onclick = function () { var dd = getCirculos(); var r = dd.find(function (z) { return z.id === x.getAttribute('data-share'); }); if (r) share('🕯️ Círculo: ' + r.nombre, '📅 ' + r.fecha + ' ' + (r.hora || '') + '\n📍 ' + (r.lugar || '') + '\n' + r.tipo); }; });
}
function setupSaberesCirculos() {
  var dlg = $('mingaDialog'); if (!dlg) { setTimeout(setupSaberesCirculos, 800); return; }
  addKw('btnMinga', 'saberes wiki conocimiento local circulo encuentro presencial meditar tejer sembrar canto comunidad');
  var b = $('btnMinga');
  if (b && !b.dataset.sabWrapped) { b.dataset.sabWrapped = '1'; b.addEventListener('click', function () { setTimeout(function () { try { renderSaberes(); renderCirculos(); } catch (e) {} }, 60); }); }
  if ($('sabTitulo')) { try { renderSaberes(); renderCirculos(); } catch (e) {} return; }
  var form = dlg.querySelector('form') || dlg;
  var sec = document.createElement('div');
  sec.innerHTML =
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🌿 Círculo de Saberes <span class="muted" style="font-weight:normal">· wiki comunitaria</span></h4>' +
    '<p class="muted" style="font-size:11px">Conocimiento local open source (“mi abuela curaba...”, “en mi calle...”). La comunidad valida con 👍. Conecta con 🌿 Lawen y Kimün.</p>' +
    '<div class="conv-row"><label style="flex:2">🔍 Buscar <input type="text" id="sabQ" placeholder="empacho, cochayuyo..." autocomplete="off"></label><label>Categoría <select id="sabCatF"><option value="todas">Todas</option>' + SAB_CAT.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label style="flex:2">Título <input type="text" id="sabTitulo" placeholder="ej: Empacho de mi abuela" maxlength="60"></label><label>Tipo <select id="sabCat">' + SAB_CAT.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></label></div>' +
    '<label>Saber <textarea id="sabTexto" rows="2" placeholder="cuéntalo como lo contarías en la cocina..." maxlength="500"></textarea></label>' +
    '<label>Autor/a (opcional) <input type="text" id="sabAutor" placeholder="ej: Rosa de Lirquén" maxlength="40"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="sabAdd" class="btn btn-accent" style="width:auto">+ Aportar saber</button></div>' +
    '<div id="sabList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto"></div>' +
    '<span id="sabStats" class="muted" style="font-size:11px"></span></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕯️ Círculos de presencia <span class="muted" style="font-weight:normal">· encuentros en Penco/Bío-Bío</span></h4>' +
    '<div class="conv-row"><label style="flex:2">Nombre <input type="text" id="cirNombre" placeholder="ej: Tejido de luna llena" maxlength="60"></label><label>Tipo <select id="cirTipo"><option>meditación</option><option>tejido</option><option>siembra</option><option>canto</option><option>minga lunar</option></select></label></div>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="cirFecha"></label><label>Hora <input type="time" id="cirHora" value="18:00"></label><label>Lugar <input type="text" id="cirLugar" placeholder="ej: Playa Negra" maxlength="40"></label><label>Cupo <input type="text" id="cirCupo" placeholder="ej: 12" maxlength="6" style="width:70px"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="cirAdd" class="btn btn-accent" style="width:auto">+ Convocar círculo</button></div>' +
    '<div id="cirList" class="habits-list" style="margin-top:8px;max-height:240px"></div></div>';
  var closeRow = form.querySelector('.dlg-actions:last-child');
  if (closeRow) form.insertBefore(sec, closeRow); else form.appendChild(sec);
  $('sabQ').oninput = renderSaberes; $('sabCatF').onchange = renderSaberes;
  $('sabAdd').onclick = function () {
    var t = clean($('sabTitulo').value, 60); if (!t) return alert('Ponle título al saber');
    var x = clean($('sabTexto').value, 500); if (!x) return alert('Cuenta el saber');
    getSaberes().push({ id: uid('sb'), fecha: todayKey(), titulo: t, cat: $('sabCat').value, texto: x, autor: clean($('sabAutor').value, 40), val: 0 });
    save('Saber aportado 🌿'); $('sabTitulo').value = ''; $('sabTexto').value = ''; renderSaberes();
  };
  $('cirAdd').onclick = function () {
    var t = clean($('cirNombre').value, 60); if (!t) return alert('Nombra el círculo');
    if (!$('cirFecha').value) return alert('Elige fecha');
    getCirculos().push({ id: uid('ci'), nombre: t, tipo: $('cirTipo').value, fecha: $('cirFecha').value, hora: $('cirHora').value, lugar: clean($('cirLugar').value, 40), cupo: clean($('cirCupo').value, 6), voy: true, extras: 0 });
    save('Círculo convocado 🕯️'); $('cirNombre').value = ''; renderCirculos();
  };
  try { renderSaberes(); renderCirculos(); } catch (e) {}
}

/* ============================================================
   FASE C — Hogar vivo (Vida diaria, sin grupos nuevos)
   C2 Caja de Tesoros → sección en #bodegaDialog
   C3+C4 Roles + Acuerdos → pestaña única en #homeTasksDialog
   ============================================================ */
var ROLES_HOGAR = ['🍳 Cocina y compras', '👕 Ropa y lavandería', '🚿 Baños y limpieza', '🌿 Patio y plantas', '🛠️ Reparaciones y mantención', '🧹 Orden general y basura'];
function getRoles() { var a = store('rolesHogar', {}); return (a && typeof a === 'object') ? a : {}; }
function getAcuerdos() {
  var a = store('acuerdosFam', null);
  if (Array.isArray(a)) return a;
  var old = store('ritualesFam', []);
  return Array.isArray(old) ? old : [];
}
function saveAcuerdos(dd) { try { userData().acuerdosFam = dd; } catch (e) {} }
function renderRoles() {
  if (!$('rolGrid')) return;
  var as = getRoles(), l = null;
  try { var m = mensLunaForKey(todayKey()); if (m) l = 'Luna ' + m.luna; } catch (e) {}
  $('rolLuna').textContent = l ? ('Rotación de ' + l + ' · rota cada luna') : 'Rotación mensual por luna';
  $('rolGrid').innerHTML = ROLES_HOGAR.map(function (rol) {
    return '<label style="font-size:12px">' + esc(rol) + ' <input type="text" data-rol="' + esc(rol) + '" value="' + esc(as[rol] || '') + '" placeholder="¿quién? ej: mamá, papá, hijos" maxlength="30"></label>';
  }).join('');
  $('rolGrid').querySelectorAll('[data-rol]').forEach(function (inp) {
    inp.onchange = function () { var a = getRoles(); a[inp.getAttribute('data-rol')] = clean(inp.value, 30); try { userData().rolesHogar = a; } catch (e) {} save('Rol asignado 🗝️'); };
  });
}
function renderAcuerdos() {
  if (!$('acuList')) return;
  var hoy = todayKey();
  var d = getAcuerdos().slice().sort(function (a, b) { return a.prox.localeCompare(b.prox); });
  $('acuList').innerHTML = d.length ? d.map(function (r) {
    var est = r.prox === hoy ? '🤝 <b>HOY</b>' : (r.prox > hoy ? r.prox : 'pendiente');
    return '<div class="habit-item"><b>🤝 ' + esc(r.nombre) + '</b> <span class="chip" style="font-size:10px">' + esc(r.momento) + '</span> <span class="chip" style="font-size:10px">' + est + '</span><p class="muted" style="font-size:11px">' + esc(r.desc || '') + (r.ult ? ' · último: ' + r.ult : '') + '</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" style="width:auto;font-size:11px" data-done="' + r.id + '">✅ Cumplido</button><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Sin acuerdos. Ej: sin pantallas en la comida, ordenar piezas antes de dormir, turnos de cocina.</p>';
  $('acuList').querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar acuerdo?')) return; var dd = getAcuerdos(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) { dd.splice(i, 1); saveAcuerdos(dd); } save(); renderAcuerdos(); }; });
  $('acuList').querySelectorAll('[data-done]').forEach(function (b) { b.onclick = function () { var dd = getAcuerdos(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-done'); }); if (!r) return; r.ult = hoy; if (r.momento === 'cada luna' || r.momento === 'semanal') r.prox = addDaysKey(hoy, r.momento === 'semanal' ? 7 : 28); saveAcuerdos(dd); save('Acuerdo cumplido 🤝'); renderAcuerdos(); }; });
  $('acuList').querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var dd = getAcuerdos(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-share'); }); if (r) share('🤝 Nuestro acuerdo: ' + r.nombre, (r.desc || '') + '\n' + r.momento + ' · próximo: ' + r.prox); }; });
}
function setupHogar() {
  var dlg = $('homeTasksDialog'); if (!dlg || typeof renderHomeTasksTab !== 'function') { setTimeout(setupHogar, 800); return; }
  addKw('btnHomeTasks', 'roles acuerdo familia luna convivencia tareas reparto');
  ['tabHomeCrianza', 'tabHomeRoles', 'tabHomeRituales'].forEach(function (tid) { var x = $(tid); if (x) x.remove(); });
  ['homeCrianzaPanel', 'homeRolesPanel', 'homeRitualesPanel'].forEach(function (pid) { var p = $(pid); if (p) p.remove(); });
  var b = $('btnHomeTasks');
  if (b && !b.dataset.hogarWrapped) { b.dataset.hogarWrapped = '1'; b.addEventListener('click', function () { setTimeout(function () { try { renderRoles(); renderAcuerdos(); } catch (e) {} }, 80); }); }
  ['tabHomeTareas', 'tabHomeSemana', 'tabHomePlantillas', 'tabHomeStats', 'tabHomeDiogenes'].forEach(function (id) {
    var t = $(id);
    if (t && !t.dataset.hogarWrapped) { t.dataset.hogarWrapped = '1'; t.addEventListener('click', function () { var p = $('homeAcuerdosPanel'); if (p) p.classList.add('hidden'); var tb = $('tabHomeAcuerdos'); if (tb) tb.classList.remove('btn-accent'); }); }
  });
  if ($('tabHomeAcuerdos')) { try { renderRoles(); renderAcuerdos(); } catch (e) {} return; }
  function mkTab(id, label, refId) {
    var t = document.createElement('button');
    t.type = 'button'; t.id = id; t.className = 'btn'; t.style.width = 'auto'; t.textContent = label;
    var ref = $(refId); if (ref && ref.parentNode) ref.parentNode.appendChild(t);
    return t;
  }
  var tA = mkTab('tabHomeAcuerdos', '🤝 Acuerdos', 'tabHomeDiogenes');
  var anchor = $('homeTasksDiogenesPanel');
  function mkPanel(id) { var p = document.createElement('div'); p.id = id; p.className = 'hidden'; if (anchor && anchor.parentNode) anchor.parentNode.appendChild(p); return p; }
  var pA = mkPanel('homeAcuerdosPanel');
  pA.innerHTML = '<div class="menstrual-card"><h4>🗝️ Roles del hogar <span class="muted" style="font-weight:normal">· distribución consciente</span></h4>' +
    '<p class="muted" style="font-size:11px" id="rolLuna"></p><div id="rolGrid" class="conv-row" style="flex-wrap:wrap"></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="rolRotar" class="btn" style="width:auto">🔄 Rotar roles</button><button type="button" id="rolClear" class="btn" style="width:auto">🧹 Limpiar</button></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🤝 Acuerdos familiares</h4>' +
    '<div class="conv-row"><label style="flex:2">Acuerdo <input type="text" id="acuNombre" placeholder="ej: Sin pantallas en la comida" maxlength="60"></label><label>Frecuencia <select id="acuMomento"><option>diario</option><option>semanal</option><option>cada luna</option><option>fecha libre</option></select></label><label>Próximo <input type="date" id="acuProx"></label></div>' +
    '<label>Cómo lo cumplimos <input type="text" id="acuDesc" placeholder="ej: dejamos el celular y conversamos todos" maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="acuAdd" class="btn btn-accent" style="width:auto">+ Crear acuerdo</button></div>' +
    '<div id="acuList" class="habits-list" style="margin-top:8px;max-height:240px"></div></div>';
  function show(panel, btn) {
    ['homeTasksTareasPanel', 'homeTasksSemanaPanel', 'homeTasksPlantillasPanel', 'homeTasksStatsPanel', 'homeTasksDiogenesPanel', 'homeAcuerdosPanel'].forEach(function (pid) { var p = $(pid); if (p) p.classList.add('hidden'); });
    ['tabHomeTareas', 'tabHomeSemana', 'tabHomePlantillas', 'tabHomeStats', 'tabHomeDiogenes', 'tabHomeAcuerdos'].forEach(function (tid) { var x = $(tid); if (x) x.classList.remove('btn-accent'); });
    try { homeTasksCurrentTab = 'hogar'; } catch (e) {}
    panel.classList.remove('hidden'); btn.classList.add('btn-accent');
  }
  tA.onclick = function () { show(pA, tA); renderRoles(); renderAcuerdos(); };
  if (!window._hogarTabWrapped && typeof renderHomeTasksTab === 'function') {
    window._hogarTabWrapped = true;
    var origHome = renderHomeTasksTab;
    renderHomeTasksTab = function (tab) {
      origHome(tab);
      if (tab !== 'acuerdos') {
        var p = $('homeAcuerdosPanel'); if (p) p.classList.add('hidden');
        var tb = $('tabHomeAcuerdos'); if (tb) tb.classList.remove('btn-accent');
      }
    };
  }
  $('rolRotar').onclick = function () {
    var a = getRoles(), names = ROLES_HOGAR.map(function (r) { return a[r] || ''; });
    names.unshift(names.pop());
    ROLES_HOGAR.forEach(function (r, i) { a[r] = names[i]; });
    try { userData().rolesHogar = a; } catch (e) {}
    save('Roles rotados 🔄'); renderRoles();
  };
  $('rolClear').onclick = function () { if (!confirm('¿Limpiar roles?')) return; try { userData().rolesHogar = {}; } catch (e) {} save(); renderRoles(); };
  $('acuAdd').onclick = function () {
    var n = clean($('acuNombre').value, 60); if (!n) return alert('Nombra el acuerdo');
    var dd = getAcuerdos();
    dd.push({ id: uid('ac'), nombre: n, momento: $('acuMomento').value, prox: $('acuProx').value || todayKey(), desc: clean($('acuDesc').value, 120), ult: '' });
    saveAcuerdos(dd);
    save('Acuerdo creado 🤝'); $('acuNombre').value = ''; $('acuDesc').value = ''; renderAcuerdos();
  };
  try { renderRoles(); renderAcuerdos(); } catch (e) {}
}

/* ---------- C2: caja de tesoros en Bodega ---------- */
var TES_TIPOS = ['📖 Libro', '🌱 Semillas', '🛠️ Herramienta', '🧵 Tejido / textil', '🍯 Receta / cuaderno', '🖼️ Foto / objeto', '🌳 Árbol plantado', 'otro'];
function getTesoros() { var a = store('tesoros', []); return Array.isArray(a) ? a : []; }
function renderTesoros() {
  if (!$('tesList')) return;
  var d = getTesoros().slice().sort(function (a, b) { return (a.estado === b.estado) ? a.fecha.localeCompare(b.fecha) : (a.estado === 'guardado' ? -1 : 1); });
  $('tesList').innerHTML = d.length ? d.map(function (r) {
    return '<div class="habit-item"><b>' + esc(r.tipo) + ' ' + esc(r.objeto) + '</b> <span class="chip" style="font-size:10px">' + esc(r.estado) + '</span><br>' +
      '<span class="muted" style="font-size:11px">de ' + esc(r.de || '?') + ' → para ' + esc(r.para || '?') + ' · ' + r.fecha + ' (' + esc(lunaTxt(r.fecha)) + ')' + (r.nota ? ' · ' + esc(r.nota) : '') + '</span>' +
      '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><button class="btn" style="width:auto;font-size:11px" data-ok="' + r.id + '">' + (r.estado === 'guardado' ? '🎁 Entregar' : '↩ Guardar') + '</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Vacía. Planifica qué objetos, libros, semillas o herramientas pasan de generación en generación. Conecta con 🍯 Bodega y 🌱 Siembra.</p>';
  $('tesList').querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Sacar de la caja?')) return; var dd = getTesoros(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderTesoros(); }; });
  $('tesList').querySelectorAll('[data-ok]').forEach(function (b) { b.onclick = function () { var dd = getTesoros(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-ok'); }); if (r) { r.estado = r.estado === 'guardado' ? 'entregado ✓' : 'guardado'; save('Guardado 🎁'); renderTesoros(); } }; });
  var st = $('tesStats'); if (st) st.textContent = d.length + ' tesoros · ' + d.filter(function (r) { return r.estado === 'guardado'; }).length + ' por entregar';
}
function setupTesoros() {
  var dlg = $('bodegaDialog'); if (!dlg) { setTimeout(setupTesoros, 800); return; }
  addKw('btnBodega', 'tesoro legado herencia objeto semilla libro herramienta generacion');
  var b = $('btnBodega');
  if (b && !b.dataset.tesWrapped) { b.dataset.tesWrapped = '1'; b.addEventListener('click', function () { setTimeout(function () { try { renderTesoros(); } catch (e) {} }, 60); }); }
  if ($('tesObjeto')) { try { renderTesoros(); } catch (e) {} return; }
  var form = dlg.querySelector('form') || dlg;
  var sec = document.createElement('div');
  sec.innerHTML =
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🎁 La Caja de los Tesoros <span class="muted" style="font-weight:normal">· legado material y simbólico</span></h4>' +
    '<div class="conv-row"><label style="flex:2">Objeto <input type="text" id="tesObjeto" placeholder="ej: semillas de poroto de la abuela" maxlength="60"></label><label>Tipo <select id="tesTipo">' + TES_TIPOS.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>De <input type="text" id="tesDe" placeholder="ej: abuela Rosa" maxlength="30"></label><label>Para <input type="text" id="tesPara" placeholder="ej: Millaray" maxlength="30"></label><label>Entregar (luna/fecha) <input type="text" id="tesFecha" placeholder="ej: Luna 4 o 2026-09-13" maxlength="20"></label></div>' +
    '<label>Historia del objeto <input type="text" id="tesNota" placeholder="ej: las trajo del campo en los 80..." maxlength="100"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="tesAdd" class="btn btn-accent" style="width:auto">+ Guardar tesoro</button></div>' +
    '<div id="tesList" class="habits-list" style="margin-top:8px;max-height:240px"></div>' +
    '<span id="tesStats" class="muted" style="font-size:11px"></span></div>';
  var closeRow = form.querySelector('.dlg-actions:last-child');
  if (closeRow) form.insertBefore(sec, closeRow); else form.appendChild(sec);
  $('tesAdd').onclick = function () {
    var o = clean($('tesObjeto').value, 60); if (!o) return alert('Describe el tesoro');
    var f = $('tesFecha').value.trim() || todayKey();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) f = todayKey();
    getTesoros().push({ id: uid('tz'), objeto: o, tipo: $('tesTipo').value, de: clean($('tesDe').value, 30), para: clean($('tesPara').value, 30), fecha: f, nota: clean($('tesNota').value, 100), estado: 'guardado' });
    save('Tesoro guardado 🎁'); $('tesObjeto').value = ''; $('tesNota').value = ''; renderTesoros();
  };
  try { renderTesoros(); } catch (e) {}
}

/* ============================================================
   FASE E — Puente inicio + open source (sin grupos nuevos)
   E1 Ritual bienvenida / Nombre lunar → sección en #talesDialog
   E2 Taller de Co-creación → botón en Herramientas + diálogo
   ============================================================ */
function getNombres() { var a = store('nombresLunares', []); return Array.isArray(a) ? a : []; }
function renderNombres() {
  if (!$('nomList')) return;
  var d = getNombres().slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  $('nomList').innerHTML = d.length ? d.map(function (r) {
    var luna = null; try { var m = mensLunaForKey(r.fecha); if (m) luna = m; } catch (e) {}
    var energia = '';
    try { var M = (window.pencoData || {}).MOONS; if (M && luna) energia = M[luna.luna - 1].nombre + ' · ' + M[luna.luna - 1].traduccion; } catch (e) {}
    return '<div class="habit-item"><b>🌙 ' + esc(r.nombre) + '</b>' + (r.signif ? ' — <i>' + esc(r.signif) + '</i>' : '') + '<br>' +
      '<span class="muted" style="font-size:11px">nació ' + r.fecha + (luna ? ' · Luna ' + luna.luna + ' día ' + luna.dia : ' · <i>luna fuera de rango</i>') + (energia ? ' · ' + esc(energia) : '') + (r.cerem ? ' · ceremonia: ' + esc(r.cerem) : '') + '</span>' +
      '<div style="display:flex;gap:6px;margin-top:6px"><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤 Compartir</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Vacío. Registra cada nacimiento con su luna, no solo la fecha gregoriana, y su ceremonia de bienvenida al territorio.</p>';
  $('nomList').querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar registro?')) return; var dd = getNombres(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderNombres(); }; });
  $('nomList').querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var dd = getNombres(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-share'); }); if (r) share('🌙 Nombre lunar: ' + r.nombre, 'Nació ' + r.fecha + ' (' + lunaTxt(r.fecha) + ')' + (r.signif ? '\nSignifica: ' + r.signif : '')); }; });
}
function setupNombreLunar() {
  var dlg = $('talesDialog'); if (!dlg) { setTimeout(setupNombreLunar, 800); return; }
  addKw('btnTales', 'nacimiento nombre lunar bienvenida lakutun ceremonia territorio bebe');
  var b = $('btnTales');
  if (b && !b.dataset.nomWrapped) { b.dataset.nomWrapped = '1'; b.addEventListener('click', function () { setTimeout(function () { try { renderNombres(); } catch (e) {} }, 60); }); }
  if ($('nomNombre')) { try { renderNombres(); } catch (e) {} return; }
  var form = dlg.querySelector('form') || dlg;
  var sec = document.createElement('div');
  sec.innerHTML =
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>👶 Ritual de bienvenida / Nombre lunar</h4>' +
    '<p class="muted" style="font-size:11px">El nacimiento según la <b>energía de la luna</b>. Guía de bienvenida al territorio (inspirada en el <i>lakutun</i> mapuche: presentar al bebé a la comunidad y a la tierra con respeto). Conecta con 🏔️ Territorio y 📖 Epew.</p>' +
    '<div class="conv-row"><label style="flex:2">Nombre <input type="text" id="nomNombre" placeholder="ej: Millaray" maxlength="40"></label><label>Significado <input type="text" id="nomSignif" placeholder="ej: flor de oro" maxlength="60"></label><label>Nacimiento <input type="date" id="nomFecha"></label></div>' +
    '<div id="nomEnergia" class="chip" style="display:block;white-space:normal"></div>' +
    '<label>Ceremonia <select id="nomCerem"><option>presentación al territorio (río/mar)</option><option>lakutun familiar (presentar a la comunidad)</option><option>plantar su árbol</option><option>canto de bienvenida</option><option>otra</option></select></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="nomAdd" class="btn btn-accent" style="width:auto">+ Registrar bienvenida</button></div>' +
    '<div id="nomList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div>';
  var closeRow = form.querySelector('.dlg-actions:last-child');
  if (closeRow) form.insertBefore(sec, closeRow); else form.appendChild(sec);
  function paintEnergia() {
    var f = $('nomFecha').value, box = $('nomEnergia');
    if (!f) { box.innerHTML = '<span class="muted">Elige la fecha para ver su luna y energía.</span>'; return; }
    var t = lunaTxt(f), en = '';
    try { var m = mensLunaForKey(f); var M = (window.pencoData || {}).MOONS; if (m && M && M[m.luna - 1]) en = M[m.luna - 1].nombre + ' · ' + M[m.luna - 1].traduccion; } catch (e) {}
    if (!t && !en) { box.innerHTML = '<span class="muted">🌙 Fecha fuera del rango del calendario (cubre ±2/4 años desde hoy): se guarda igual, sin energía lunar.</span>'; return; }
    box.innerHTML = '🌙 ' + esc(t) + (en ? ' · <b>' + esc(en) + '</b>' : '');
  }
  $('nomFecha').onchange = paintEnergia;
  paintEnergia();
  $('nomAdd').onclick = function () {
    var n = clean($('nomNombre').value, 40); if (!n) return alert('Escribe el nombre');
    if (!$('nomFecha').value) return alert('Elige la fecha de nacimiento');
    getNombres().push({ id: uid('nl'), nombre: n, signif: clean($('nomSignif').value, 60), fecha: $('nomFecha').value, cerem: $('nomCerem').value });
    save('Bienvenida registrada 👶'); $('nomNombre').value = ''; $('nomSignif').value = ''; renderNombres();
  };
  try { renderNombres(); } catch (e) {}
}
/* ---------- E2: taller de co-creación (ELIMINADO) ---------- */
function cleanupCocrea() {
  try {
    var oldBtn = $('btnCocrear');
    if (oldBtn && oldBtn.parentNode) oldBtn.parentNode.removeChild(oldBtn);
    var oldDlg = $('cocreaDialog');
    if (oldDlg && oldDlg.parentNode) oldDlg.parentNode.removeChild(oldDlg);
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf) {
      var i = ALL_BTNS.indexOf('btnCocrear');
      if (i >= 0) ALL_BTNS.splice(i, 1);
    }
  } catch (e) {}
}

/* ============================================================
   CRIANZA INFANTIL — guía completa 0-12 para acompañar
   Métodos (12): Montessori · Waldorf · Pedagogía 3000 · Pikler ·
   Reggio Emilia · Crianza respetuosa + Apego/porteo · Kimün
   mapuche · Bosque-escuela · CNV · Freinet · Hogar. Cada método
   con ficha completa (pasos, ejemplos por edad, frases, errores,
   cuándo elegir, con qué combinar) + comparativa + test + reto 7 días.
   Etapas (gestación–12), salud, juego, límites/rabietas, ambiente y bitácora.
   Todo local y privado por usuario.
   Conecta con 🤱 1000 días, 📖 Cuentos, 🌱 Adolescencia y ✅ Hábitos.
   ============================================================ */
var CRIANZA_METODOS = [
  { id: 'montessori', icon: '🧩', t: 'Montessori', aut: 'María Montessori · Italia',
    idea: 'El niño aprende solo con las manos en un ambiente preparado. El adulto observa y no interrumpe la concentración.',
    princ: ['Ambiente preparado: todo a su altura, orden y belleza', 'Autonomía: "ayúdame a hacerlo solo"', 'Periodos sensibles: orden, lenguaje, movimiento, sentidos', 'Material concreto antes que abstracto', 'Sin premios ni castigos: el error enseña'],
    amb: 'Estante bajo con 4-6 actividades · silla y mesa a su medida · cama baja · utensilios reales de su tamaño · rincón de naturaleza.',
    rol: 'Observa en silencio, presenta lento y con pocas palabras, retira lo que ya domina.',
    act: 'Trasvasar agua/semillas · abrochar y abotonar · clasificar porotos por color · regar plantas · barrer su espacio.',
    edad: 'Brilla 1–6 años; el ambiente ordenado sirve a todas las edades.' },
  { id: 'waldorf', icon: '🌈', t: 'Waldorf', aut: 'Rudolf Steiner · Alemania',
    idea: 'Educar cabeza, corazón y manos por septenios: 0-7 hacer (imitar), 7-14 sentir (imaginar), 14-21 pensar (juzgar).',
    princ: ['Ritmo diario y semanal: respirar entre expansión y recogimiento', 'Juego libre con materiales nobles (madera, lana, tela)', 'Cuentos, epew, canciones y rondas antes que letras', 'Pantallas fuera en la primera infancia', 'Arte cada día: acuarela, cera, pan, huerta'],
    amb: 'Canasto de tesoros naturales · telas de colores · mesa de estación según la luna · rincón de cuentos con vela.',
    rol: 'Sé digno de imitar: haz tu oficio con calma y alegría frente a ellos.',
    act: 'Amasar pan · caminata del tesoro (piedra, hoja, piña) · ronda con canto · mesa de estación de la luna · títeres de cuentos.',
    edad: '0–7 imitación y ritmo; 7–14 arte e imaginación.' },
  { id: 'p3000', icon: '🌟', t: 'Pedagogía 3000', aut: 'Noemí Paymal · Latinoamérica',
    idea: 'Los niños de hoy traen otra conciencia: educación integral que une cuerpo, emoción, mente y espíritu, en vínculo con la Tierra.',
    princ: ['Integral: físico + emocional + cognitivo + espiritual a la vez', 'Herramientas bio-inteligentes: respiración, mandalas, silencio, juego cooperativo', 'Multiculturalidad: mapuzugun, epew y saberes del territorio', 'Co-educación familia-escuela-comunidad', 'La naturaleza como maestra (huerta, mar, bosque)'],
    amb: 'Círculo de inicio del día · altar/mesa viva con elementos del territorio · espacios de silencio y de movimiento.',
    rol: 'Acompaña sin imponer: pregunta, propone y aprende con ellos.',
    act: 'Minuto de silencio mirando el mar · mandala con semillas · saludo al sol/mapu · mingas familiares · diario de gratitud.',
    edad: 'Todas; ideal para mezclar con las demás pedagogías.' },
  { id: 'pikler', icon: '🐣', t: 'Pikler', aut: 'Emmi Pikler · Hungría',
    idea: 'Movimiento libre y cuidado como vínculo: el bebé llega solo a cada postura si nadie lo fuerza ni lo apura.',
    princ: ['No sentar, parar ni caminar al bebé: cada hito a su tiempo', 'Juego autónomo en suelo firme desde el inicio', 'Cuidados lentos (muda, baño, comida) avisando cada paso', 'Vínculo estable con pocos cuidadores', 'Ropa cómoda que deje moverse'],
    amb: 'Suelo firme y tibio · pocos objetos a su alcance · sin andadores ni saltarinas.',
    rol: 'En los cuidados ve despacio y conversando; en el juego, presente pero sin dirigir.',
    act: 'Tiempo boca abajo libre · canasto del tesoro (objetos seguros variados) · muda cantada y avisada.',
    edad: 'Esencial 0–2 años; el respeto al ritmo sirve siempre.' },
  { id: 'reggio', icon: '🎨', t: 'Reggio Emilia', aut: 'Loris Malaguzzi · Italia',
    idea: 'El niño tiene cien lenguajes: dibuja, construye, canta y pregunta. El adulto documenta y proyecta con ellos.',
    princ: ['Niño protagonista e investigador', 'Los cien lenguajes: arte, barro, luz, palabra, cuerpo', 'Documentar: fotos y frases para volver a mirar', 'Ambiente tercer maestro: bello, ordenado, con luz natural', 'Proyectos que nacen de sus preguntas'],
    amb: 'Atelier con barro, papeles y lápices · mesa de luz o ventana · muro para exponer sus obras.',
    rol: 'Escucha de verdad, anota sus frases y devuelve preguntas: "¿cómo lo descubriste?".',
    act: 'Proyecto de una pregunta ("¿a dónde va la luna?") · dibujar el mismo árbol cada luna · barro del humedal · exposición familiar.',
    edad: 'Brilla 2–8 años; documentar sirve a todas.' },
  { id: 'respetuosa', icon: '🤍', t: 'Crianza respetuosa + Disciplina positiva', aut: 'J. Bowlby · A. Adler / J. Nelsen',
    idea: 'Límites firmes con empatía: el niño coopera cuando se siente vinculado. Sin gritos, sin golpes, sin humillación.',
    princ: ['Vínculo primero, corrección después', 'Límites pocos, claros y sostenidos', 'Consecuencias lógicas, no castigos', 'Rutinas que anticipan (tabla visual)', 'Reparar: pedir perdón y arreglar lo roto'],
    amb: 'Tabla visual de rutinas · rincón de calma (no de castigo) · acuerdos familiares visibles.',
    rol: 'Calma tu tormenta primero; nombra su emoción ("veo rabia") y ofrece opciones.',
    act: 'Rincón de calma con cojín y cuentos · reuniones familiares cortas · "¿qué necesitas?" antes del reto · reparar juntos.',
    edad: 'Todas; clave en rabietas 1–5 años y límites 6–12.' },
  { id: 'apego', icon: '🦘', t: 'Apego seguro + Porteo', aut: 'J. Bowlby · M. Ainsworth · C. Manning',
    idea: 'El contacto corporal construye seguridad: brazos, porteo y colecho seguro regulan llanto, sueño y estrés del bebé y de quien cría.',
    princ: ['Responder al llanto siempre: el llanto es comunicación, no manipulación', 'Mucho contacto piel con piel el primer año', 'Porteo ergonómico (rodillas en M, espalda en C) en vez de coche todo el día', 'Colecho seguro o cama cercana si se elige: superficie firme, sin almohadas ni alcohol/tabaco', 'Cuidadores estables y predecibles: pocos, siempre los mismos'],
    amb: 'Fular o mochila ergonómica · muda y teta a mano · catre colecho o cuna pegada · hamaca baja solo para siesta corta vigilada.',
    rol: 'Sé su refugio: acoge, calma y luego explora. Tu calma regula la suya.',
    act: 'Porteo en caminata diaria · piel con piel 30 min · "te escucho, estoy aquí" ante cada llanto · turno de descanso para quien cría.',
    edad: 'Esencial gestación–2 años; el vínculo seguro sostiene todo lo demás.' },
  { id: 'kimun', icon: '🌿', t: 'Kimün mapuche · Crianza del territorio', aut: 'Saberes mapuche · Epew y Mapuzugun',
    idea: 'Criar enraizado: el niño es parte del lof y del mapu. Se aprende mirando, haciendo y escuchando epew junto a mayores.',
    princ: ['El niño aprende participando en la vida real (huerta, cocina, minga), no apartado', 'Epew (cuentos) y mapuzugun cada día: lengua e identidad', 'Respeto a toda vida: agua, bosque y animales no se dañan por juego', 'Los mayores enseñan con ejemplo y consejo, no con grito', 'Comunidad cría: tíos, abuelos y vecinos también acompañan'],
    amb: 'Rincón del mapu: piedras, semillas, lana · canasto de epew y cantos · huerta o maceta propia · saludo al sol y a la luna.',
    rol: 'Lleva al niño contigo a tu oficio y nombra el mundo en dos lenguas.',
    act: 'Un epew por semana · 3 palabras en mapuzugun al día · minga familiar mensual · ofrenda de agua/semilla en cada luna.',
    edad: 'Todas; raíz ideal 2–12 años.' },
  { id: 'bosque', icon: '🌳', t: 'Bosque-escuela · Juego libre y riesgo medido', aut: 'P. Gray · Escuelas bosque (Dinamarca/Alemania)',
    idea: 'Afuera se aprende mejor: barro, agua, palos y desnivel desarrollan cuerpo, criterio y creatividad más que cualquier juguete.',
    princ: ['Juego libre no dirigido mínimo 1 h diaria afuera', 'Riesgo medido sí: trepar bajo, usar herramientas reales con guía, mojarse', 'Pocos juguetes, muchos elementos sueltos (palos, piedras, telas, barro)', 'Con cualquier clima: piloto y botas, no encierro', 'El adulto cuida el perímetro, no dirige la obra'],
    amb: 'Cajón de barro y agua · palos, cuerdas y telas · cerco o perímetro claro · muda seca siempre lista.',
    rol: 'Guardia del juego: mira de lejos, interviene solo ante peligro real.',
    act: 'Tarde de barro semanal · caminata del tesoro en Penco/Lirquén · cabaña con palos · saltar charcos con lluvia.',
    edad: 'Brilla 2–9 años; salir a diario sirve siempre.' },
  { id: 'cnv', icon: '💬', t: 'Comunicación no violenta con niños', aut: 'M. Rosenberg adaptado a familia',
    idea: 'Detrás de cada "mala conducta" hay una necesidad: hambre, sueño, juego, autonomía o conexión. Se pone en palabras sin culpar.',
    princ: ['Observa sin juzgar: "veo bloques en el suelo" en vez de "eres desordenado"', 'Nombra sentimiento + necesidad: "estás frustrado, querías seguir jugando"', 'Pide en positivo y concreto: "guardemos 5 bloques juntos" en vez de "no seas así"', 'Escucha el no: ofrece 2 opciones aceptables', 'Límites con empatía: sostienes el límite y acoges el llanto que provoca'],
    amb: 'Tarjetas de emociones a la vista · reloj visual para transiciones · frases-puente pegadas en el refri.',
    rol: 'Traduce la conducta a necesidad y presta palabras al niño hasta que las tenga.',
    act: 'Frase "veo/siento/necesito/pido" una vez al día · anticipar transiciones ("en 5 min guardamos") · reparar con abrazo y plan.',
    edad: 'Todas; clave 2–8 años (rabietas y peleas entre hermanos).' },
  { id: 'freinet', icon: '🖨️', t: 'Freinet · Pedagogía viva', aut: 'C. Freinet · Francia (escuela viva)',
    idea: 'Se aprende haciendo y decidiendo: asamblea, proyectos reales y oficios en vez de fichas y dictados. El tanteo (probar y corregir) es el motor.',
    princ: ['Asamblea semanal: proponen, votan y reparten tareas', 'Texto y proyecto libre: dibuja, dicta o escribe lo que le importa', 'Talleres y oficios reales: cocina, huerta, carpintería simple, radio', 'Cooperación en vez de competencia: ayuda al que va distinto', 'Salida al territorio: paseo-estudio y diario de campo'],
    amb: 'Muro de acuerdos de la asamblea · caja de palabras/dibujos · taller con herramientas reales adaptadas · diario de campo.',
    rol: 'Facilita, no dicta: propone el marco, ellos llenan el contenido.',
    act: 'Asamblea familiar de 10 min cada domingo · paseo-estudio con libreta · taller de cocina o huerta semanal.',
    edad: 'Brilla 3–12 años; la asamblea sirve desde los 3.' },
  { id: 'hogar', icon: '🏡', t: 'Aprendizaje en familia (homeschool)', aut: 'J. Holt · I. Illich · familias educadoras Chile',
    idea: 'La casa y el territorio también educan: rutina simple, lectura diaria y salidas, sin correr detrás del currículum completo cada día.',
    princ: ['Rutina mínima viable: lectura + matemática viva + oficio/juego libre cada día', 'Aprender en la vida: feria (sumar), cocina (medir), mapa Penco (orientar)', 'Socializar en comunidad: taller, deporte, minga, primos y vecinos', 'Registro simple: foto + frase por semana (portafolio)', 'Red y derechos: en Chile se puede educar en casa y rendir exámenes libres (MINEDUC)'],
    amb: 'Rincón de estudio ordenado · biblioteca viva (no solo textos) · calendario de salidas · portafolio (carpeta o cuaderno).',
    rol: 'Guía y calendariza: 1 bloque foco en la mañana, tarde libre y territorio.',
    act: 'Bloque 25 min lectura + 25 min matemática viva · salida pedagógica semanal (museo, humedal, feria) · portafolio dominical.',
    edad: 'Ideal 4–12 años; lectura diaria sirve desde bebé.' }
];
/* ---------- Fichas completas por método: cómo empezar, ejemplos por edad,
   frases, errores, cuándo elegir y con qué combinar ---------- */
var CRIANZA_MET_FICHA = {
  montessori: { ed: ['1-3', '3-6', '6-12'],
    pasos: ['Baja 1 estante a su altura con 4 actividades y retira el resto a una caja de rotación.', 'Presenta 1 actividad lento y en silencio: "mira, así se hace", sin corregir hablando encima.', 'Deja terminar y repetir: no interrumpas la concentración aunque "se demore".', 'Rota 1-2 actividades por luna según lo que domine o ignore.'],
    ejemplos: ['0–2: trasvasar con esponja y jarra pequeña · abrir y cerrar potes · canasto de objetos reales.', '3–6: vestirse solo (cierres grandes) · clasificar porotos/semillas · regar y barrer su espacio · letras con lija antes que planas.', '6–12: cocinar recetas con medida · cuidar una planta/huerta propia · organizar su mochila y pieza por zonas.'],
    frases: ['"¿Quieres hacerlo tú o lo hacemos juntos?"', '"Mira, yo lo hago así, ahora te toca."', '"Veo que te cuesta: ¿probamos más despacio?"', 'Evita: "así no, pásame, yo lo hago más rápido".'],
    evita: ['Poner 20 juguetes a la vez: satura y no elige.', 'Corregir en caliente o con premio/castigo: mata la motivación interna.', 'Comprar todo "montessori" caro: lo casero y real funciona igual.'],
    elige: 'Elígela si tu hijo/a se concentra con las manos, pide "yo solo" y la casa vive desordenada.',
    combina: 'Combina con Pikler (0–2, ritmo), Waldorf (ritmo y cuentos) y CNV (palabras para la frustración).',
    libro: 'M. Montessori, "El niño, el secreto de la infancia" · Chile Crece Contigo: guías de autonomía por edad.' },
  waldorf: { ed: ['0-2', '1-3', '3-6', '6-12'],
    pasos: ['Fija un ritmo diario visible: expansión (afuera) / recogimiento (cuento, pan, dibujo).', 'Crea la mesa de estación de la luna con 3 cosas del territorio.', 'Saca pantallas de la primera infancia y pon cuento + ronda diaria.', 'Suma 1 arte fijo por semana: pan, acuarela o cera.'],
    ejemplos: ['0–2: rondas con canto · telas de colores · paseo diario con ritmo (misma hora).', '3–6: amasar pan · caminata del tesoro · títeres del cuento de la luna · acuarela 1 vez/semana.', '6–12: flauta o canto · huerta y oficios · epew y leyendas antes que resúmenes.'],
    frases: ['"Ahora es tiempo de recoger, cantemos la canción."', '"Mira lo que hacen mis manos, hazlo conmigo."', '"Hoy la mesa cuenta que llegó la luna nueva."', 'Evita: "apúrate, ponte el video mientras cocino".'],
    evita: ['Sobre-agendar talleres: Waldorf pide aire, no running infantil.', 'Alfabetizar antes de tiempo: primero cuerpo, ritmo e imagen.', 'Pantalla de niñera en la tarde: rompe el ritmo y el sueño.'],
    elige: 'Elígela si hay pantallas de más, poco ritmo o un niño/a que imita todo y necesita calma.',
    combina: 'Combina con Montessori (ambiente a su altura), Kimün (epew y territorio) y Bosque-escuela (afuera diario).',
    libro: 'R. Steiner, conferencias de pedagogía Waldorf (resúmenes) · mesa de estación según la luna (pestaña Ambiente).' },
  p3000: { ed: ['3-6', '6-12'],
    pasos: ['Abre el día con círculo: 1 respiración + "¿cómo vengo hoy?" en 1 palabra.', 'Suma 1 herramienta bio-inteligente por semana: silencio, mandala, gratitud.', 'Lleva 1 saber del territorio al mes: mapuzugun, epew, mingas.', 'Cierra la luna con gratitud: 3 cosas que aprendimos juntos.'],
    ejemplos: ['3–6: minuto de silencio mirando el mar · mandala con semillas · saludo al mapu.', '6–12: diario de gratitud · mingas familiares · círculo para resolver peleas.', 'En casa: co-educa con la escuela, no contra ella: 1 acuerdo común por luna.'],
    frases: ['"Respiremos juntos y después hablamos."', '"¿Qué necesita tu cuerpo ahora: agua, aire o abrazo?"', '"Agradezcamos 1 cosa antes de comer."', 'Evita: "cálmate al tiro o te castigo".'],
    evita: ['Querer hacerlo todo junto: elige 1 herramienta por luna.', 'Solo discurso "espiritual" sin cuerpo ni naturaleza.', 'Dejar sola a la escuela: pide 1 reunión para alinear.'],
    elige: 'Elígela si quieres unir cuerpo, emoción y tierra sin fragmentar por materias.',
    combina: 'Es pegamento: combina con cualquiera, en especial Kimün, Waldorf y Freinet.',
    libro: 'N. Paymal, "Pedagooogía 3000" (libros gratis en el link de abajo) · epew y mapuzugun del territorio.' },
  pikler: { ed: ['0-2'],
    pasos: ['Pon suelo firme y tibio con 3 objetos: bebé boca arriba, tú cerca sin dirigir.', 'Haz cada muda/baño avisando y sin apuro: "te voy a levantar, ¿lista?"', 'Viste ropa cómoda que deje moverse; guarda el andador.', 'Observa 5 min al día sin intervenir: anota qué logró solo.'],
    ejemplos: ['0–6 m: boca arriba en suelo · piel con piel · paseos mirando el mundo.', '6–12 m: alcanzar y girar solo · canasto del tesoro · comer con manos.', '12–24 m: trepar bajo · empujar y arrastrar · vestirse participando.'],
    frases: ['"Te voy a mudar, te levanto despacio."', '"Te veo intentando girar, estoy aquí."', '"Lloras, te escucho: ¿teta, abrazo o sueño?"', 'Evita: "siéntate, párate, camina, ¡dale!".'],
    evita: ['Sentar/parar/caminar al bebé antes de que llegue solo.', 'Saltarinas y andadores: deforman el patrón de movimiento.', 'Sobre-estimular con pantallas y juguetes sonoros.'],
    elige: 'Elígela siempre con bebés: es la base del movimiento libre y el vínculo.',
    combina: 'Combina con Apego y porteo (brazos + suelo) y Montessori (ambiente a su altura).',
    libro: 'E. Pikler, "Moverse en libertad" · controles niño sano + Chile Crece Contigo.' },
  reggio: { ed: ['1-3', '3-6', '6-12'],
    pasos: ['Parte de 1 pregunta del niño: "¿a dónde va la luna?" y anótala tal cual.', 'Ofrece 3 lenguajes para responder: dibujo, barro y cuerpo/movimiento.', 'Documenta: foto + frase del niño en el muro de obras.', 'Cierra con exposición familiar: él/ella explica.'],
    ejemplos: ['1–3: dibujar el mismo árbol cada luna · barro del humedal · luz y sombras con linterna.', '3–6: proyecto de 2 semanas sobre el mar/las aves · maqueta con reciclaje.', '6–12: investigación con salida a terreno + presentación a la familia.'],
    frases: ['"¿Cómo lo descubriste? Cuéntame más."', '"Dibújalo como lo ves tú."', '"Guardemos tu frase para no olvidarla."', 'Evita: "eso está mal, la luna no es así".'],
    evita: ['Dirigir el proyecto: el adulto propone marco, no resultado.', 'Pedir "bonito": valora el proceso y la idea.', 'No documentar: sin registro se pierde el aprendizaje.'],
    elige: 'Elígela si pregunta "¿por qué?" sin fin y ama dibujar, construir y desarmar.',
    combina: 'Combina con Bosque-escuela (material vivo), Freinet (proyecto real) y Montessori (orden del atelier).',
    libro: 'L. Malaguzzi, "los cien lenguajes" · muro de obras (pestaña Ambiente).' },
  respetuosa: { ed: ['0-2', '1-3', '3-6', '6-12'],
    pasos: ['Acuerda 3 límites innegociables y escríbelos en visible (ej: no pegar, cinturón, horario sueño).', 'Arma el rincón de calma (no castigo) con 2 cuentos y 1 cojín.', 'Practica el guion: calma adulta → nombra emoción → límite + 2 opciones → repara.', 'Haz reunión familiar de 10 min cada luna: qué funcionó y qué ajustamos.'],
    ejemplos: ['0–2: anticipar con palabras y rutina · sostener el llanto sin ceder el límite de seguridad.', '2–5: tabla visual de rutinas · reloj de arena para transiciones · reparar lo roto juntos.', '6–12: acuerdos escritos · consecuencias lógicas (si rompe, repara/paga) · mesada con reglas.'],
    frases: ['"Veo rabia. El límite es no pegar: ¿cojín o ayuda?"', '"En 5 min guardamos: ¿ponemos el reloj?"', '"Me equivoqué al gritar, perdón. Reparo."', 'Evita: "eres malo/mañoso" o "si no, te dejo".'],
    evita: ['Muchos límites: 3 firmes valen más que 20 blandos.', 'Castigos largos o quitar el juego por días.', 'Etiquetas y amenazas: frenan hoy, dañan mañana.'],
    elige: 'Elígela si hay gritos, rabietas largas o peleas entre hermanos: es tu base de límites.',
    combina: 'Combina con CNV (palabras exactas) y Waldorf (ritmo que previene). Pestaña Límites trae el protocolo.',
    libro: 'J. Nelsen, "Disciplina positiva" · Fono Infancia 800 200 818 si necesitas apoyo.' },
  apego: { ed: ['0-2'],
    pasos: ['Responde al llanto siempre los primeros meses: brazos, teta, piel con piel.', 'Porta ergonómico 1 caminata diaria (rodillas en M, espalda en C, beso a mano).', 'Si colechas, hazlo seguro: firme, sin almohadas, sin alcohol/tabaco.', 'Organiza turnos de descanso: quien cría también duerme y come.'],
    ejemplos: ['0–3 m: piel con piel 30 min · porteo corto · misma persona que calma.', '3–12 m: cuna pegada · ritual de sueño fijo · despedidas breves y siempre avisadas.', '1–2 a: "voy y vuelvo" con objeto de apego · vuelta celebrada.'],
    frases: ['"Te escucho, estoy aquí, ya llegué."', '"Mamá/papá vuelve después de la feria."', '"¿Teta, abrazo o paseo?"', 'Evita: "déjalo llorar para que aprenda" en bebés.'],
    evita: ['Dejar llorar solo para "acostumbrar" el primer año.', 'Muchos cuidadores rotando sin referente estable.', 'Colecho inseguro (sillón, alcohol, almohadas sueltas).'],
    elige: 'Elígela con bebés, llanto alto o sueño liviano: el contacto regula.',
    combina: 'Combina con Pikler (brazos + suelo libre) y tu autocuidado (pestaña Salud).',
    libro: 'J. Bowlby / M. Ainsworth (apego seguro) · matrona y CESFAM: porteo y lactancia.' },
  kimun: { ed: ['1-3', '3-6', '6-12'],
    pasos: ['Suma 3 palabras en mapuzugun al día nombrando lo visible (ko, anümka, küyen).', 'Cuenta 1 epew por semana y conversa: "¿qué nos enseña?"', 'Da 1 responsabilidad real en la casa/huerta/minga.', 'Saluda al sol y la luna 1 vez por luna en familia.'],
    ejemplos: ['1–3: cantos y epew cortos · tocar tierra y agua · ayudar a regar.', '3–6: huerta propia · 3 palabras diarias · minga familiar.', '6–12: historia del territorio · oficio con un mayor · cuidar a un menor.'],
    frases: ['"El agua se cuida: ¿cómo la usamos bien?"', '"Escuchemos al epew y después conversamos."', '"Hoy ayudas como los grandes: ¿riegas tú?"', 'Evita burlarse del epew o usar el mapuzugun como castigo.'],
    evita: ['Folclorizar 1 vez al año: kimün es diario, no disfraz.', 'Separar al niño de la vida real "para que no moleste".', 'Enseñar sin ejemplo adulto: el mayor muestra primero.'],
    elige: 'Elígela si quieres raíz, lengua e identidad del Bío-Bío en la crianza diaria.',
    combina: 'Combina con Bosque-escuela (mapu como aula), P3000 (círculo y gratitud) y Cuentos.',
    libro: 'Epew y kimün del territorio · Mapuzugun con la familia y la escuela.' },
  bosque: { ed: ['1-3', '3-6', '6-12'],
    pasos: ['Agenda 1 h afuera diaria con piloto y botas (la lluvia no suspende).', 'Marca un perímetro claro y 1 lugar para trepar bajo.', 'Entrega elementos sueltos (palos, cuerdas, barro) en vez de juguete que hace todo.', 'Cierra con muda seca + algo tibio: el confort sostiene el hábito.'],
    ejemplos: ['1–3: barro con manos · charcos con botas · caminar en desnivel suave.', '3–6: cabaña con palos · caminata del tesoro · herramientas reales con guía.', '6–12: bici y cerro · mar con cuidado · diario de naturaleza.'],
    frases: ['"Revisa tu cuerpo: ¿está firme esa rama?"', '"Mójate, traje muda seca."', '"Dejamos el lugar mejor de lo que estaba."', 'Evita: "bájate, te vas a caer, no toques nada".'],
    evita: ['Encierro por clima: equipa, no suspendas.', 'Dirigir el juego: cuida el perímetro, no la obra.', 'Llevarse seres vivos de pozas y bosque.'],
    elige: 'Elígela si hay encierro, pantallas de más o cuerpo inquieto que necesita moverse.',
    combina: 'Combina con Pikler (riesgo medido), Kimün (respeto al mapu) y Montessori (pocos elementos).',
    libro: 'P. Gray ("juego libre") · escuelas bosque · bajamares y cerros de Penco (pestaña Juego).' },
  cnv: { ed: ['1-3', '3-6', '6-12'],
    pasos: ['Describe sin juzgar: "veo bloques en el suelo" (no "eres desordenado").', 'Nombra sentimiento + necesidad: "estás frustrado, querías seguir".', 'Pide en positivo: "guardemos 5 juntos" + ofrece 2 opciones.', 'Si hay no, acógelo y repara después con abrazo y plan.'],
    ejemplos: ['2–4: anticipar transiciones con reloj visual · tarjetas de emociones.', '4–6: "veo/siento/necesito/pido" 1 vez al día · reparar lo roto.', '6–12: asamblea para peleas · acuerdos escritos · pedir perdón adulto también vale.'],
    frases: ['"Veo bloques en el suelo. ¿Guardamos 5 juntos?"', '"Estás frustrado: querías seguir. Te ayudo a parar."', '"¿Agua, abrazo o un minuto?"', 'Evita: "porque lo digo yo" o "no llores por eso".'],
    evita: ['Sermonear en plena tormenta: primero calma, después palabras.', 'Pedir en negativo ("no seas así"): el cerebro infantil no lo procesa.', 'Exigir perdón vacío: mejor reparar con acción.'],
    elige: 'Elígela si las rabietas y peleas se repiten: pone palabras donde faltan.',
    combina: 'Es el lenguaje de la Crianza respetuosa. Úsala con Límites (protocolo) y Freinet (asamblea).',
    libro: 'M. Rosenberg, "Comunicación no violenta" (resúmenes) · frases-puente en el refri.' },
  freinet: { ed: ['3-6', '6-12'],
    pasos: ['Haz asamblea familiar de 10 min el domingo: proponen, votan, reparten.', 'Abre la caja de palabras: dibuja/dicta/escribe 1 texto libre por semana.', 'Agenda 1 taller real semanal: cocina, huerta, madera simple o radio.', 'Sal una vez al mes a estudiar el territorio con libreta (paseo-estudio).'],
    ejemplos: ['3–6: asamblea con dibujos · taller de cocina · paseo con tesoro.', '6–12: diario de campo · proyecto con presentación · oficio con guía.', 'En casa: 1 acuerdo de asamblea vale más que 10 órdenes.'],
    frases: ['"¿Qué propones para esta semana?"', '"Votemos: ¿huerta o cocina primero?"', '"Tu texto libre va al muro."', 'Evita: "eso no, haz la ficha".'],
    evita: ['Convertir el taller en clase frontal.', 'Votar y no cumplir: la asamblea muere si no se ejecuta.', 'Comparar proyectos entre hermanos.'],
    elige: 'Elígela si ama decidir, crear y salir: aprende haciendo, no repitiendo.',
    combina: 'Combina con Reggio (proyecto), Bosque-escuela (salida) y Homeschool (portafolio).',
    libro: 'C. Freinet, "técnicas de la escuela moderna" · diario de campo + muro de obras.' },
  hogar: { ed: ['3-6', '6-12'],
    pasos: ['Define la mínima viable: 25 min lectura + 25 min matemática viva + oficio/juego libre.', 'Enseña en la vida: feria (sumas), cocina (medidas), mapa (orientación).', 'Socializa en comunidad: 2 espacios semanales (taller, deporte, minga).', 'Registra 1 foto + 1 frase por semana en el portafolio.'],
    ejemplos: ['4–6: lectura en voz alta 15 min · contar en la feria · huerta como ciencia.', '6–9: bloque foco en la mañana + tarde libre · biblioteca viva.', '9–12: proyecto con propósito + exámenes libres si corresponde (infórmate en MINEDUC).'],
    frases: ['"Hoy toca bloque foco y después territorio."', '"¿Qué aprendiste? Anotémoslo al portafolio."', '"Preguntemos a la vecina sabia."', 'Evita: "8 horas de mesa copiando".'],
    evita: ['Replicar la escuela completa en casa 8 h.', 'Aislar: socializar es parte del plan.', 'No registrar: sin portafolio no se ve el avance.'],
    elige: 'Elígela si la escuela queda lejos, hay necesidades distintas o quieren ritmo familiar.',
    combina: 'Usa Montessori (ambiente), Freinet (proyectos) y Bosque-escuela (salidas). Revisa derechos MINEDUC.',
    libro: 'J. Holt ("aprender sin escuela") · MINEDUC exámenes libres · portafolio semanal.' }
};
var CRIANZA_MET_COMPARA = [
  { m: '🧩 Montessori', foco: 'Autonomía con las manos', edad: '1–6', cuando: 'Pide "yo solo" y se dispersa con mucho estímulo' },
  { m: '🌈 Waldorf', foco: 'Ritmo, cuento y arte', edad: '0–7', cuando: 'Muchas pantallas, poco ritmo, necesita calma' },
  { m: '🌟 P. 3000', foco: 'Integral cuerpo-emoción-tierra', edad: '3–12', cuando: 'Quieres unir todo sin fragmentar' },
  { m: '🐣 Pikler', foco: 'Movimiento libre bebé', edad: '0–2', cuando: 'Bebé en casa: suelo, no apuro' },
  { m: '🎨 Reggio', foco: 'Proyectos e investigación', edad: '2–8', cuando: 'Pregunta todo y crea sin parar' },
  { m: '🤍 Respetuosa', foco: 'Límites firmes sin grito', edad: 'Todas', cuando: 'Rabietas y peleas: base de límites' },
  { m: '🦘 Apego', foco: 'Vínculo y contacto', edad: '0–2', cuando: 'Llanto alto, sueño liviano' },
  { m: '🌿 Kimün', foco: 'Raíz y territorio', edad: '2–12', cuando: 'Quieres lengua e identidad diaria' },
  { m: '🌳 Bosque', foco: 'Afuera y riesgo medido', edad: '2–9', cuando: 'Encierro y cuerpo inquieto' },
  { m: '💬 CNV', foco: 'Palabras para emociones', edad: '2–8', cuando: 'Rabietas que se repiten' },
  { m: '🖨️ Freinet', foco: 'Decidir y hacer', edad: '3–12', cuando: 'Ama decidir y salir a terreno' },
  { m: '🏡 Hogar', foco: 'Rutina familiar simple', edad: '4–12', cuando: 'Educan en casa o refuerzan' }
];
var CRIANZA_MET_QUIZ = [
  { k: 'q1', t: 'Se aburre rápido y necesita usar las manos', m: ['montessori', 'reggio', 'bosque', 'freinet'] },
  { k: 'q2', t: 'Rabietas, gritos o peleas entre hermanos', m: ['respetuosa', 'cnv', 'waldorf'] },
  { k: 'q3', t: 'Muchas pantallas / poco ritmo y sueño movido', m: ['waldorf', 'bosque', 'p3000'] },
  { k: 'q4', t: 'Es bebé (0–2): movimiento y llanto', m: ['pikler', 'apego', 'montessori'] },
  { k: 'q5', t: 'Pregunta todo, dibuja y crea proyectos', m: ['reggio', 'freinet', 'p3000', 'hogar'] },
  { k: 'q6', t: 'Quiero raíz mapuche y territorio', m: ['kimun', 'bosque', 'p3000', 'waldorf'] },
  { k: 'q7', t: 'Educamos en casa / reforzamos la escuela', m: ['hogar', 'montessori', 'freinet', 'reggio'] }
];
var CRIANZA_MEZCLA_TXT = 'Ningún método puro cría solo. Arma tu mezcla: 1 base de vínculo (Respetuosa/CNV/Apego) + 1 de ambiente (Montessori/Waldorf) + 1 de mundo (Kimün/Bosque/Freinet). Prueba 1 cambio por luna y anota en Bitácora.';
/* ---------- Links oficiales por método (verificados, se abren fuera de la app) ---------- */
var CRIANZA_MET_LINKS = {
  montessori: { u: 'https://montessori-ami.org', t: 'AMI · Asociación Montessori Internacional' },
  waldorf: { u: 'https://www.waldorfeducation.org', t: 'AWSNA · Educación Waldorf' },
  p3000: { u: 'https://p3000.info/index.php/libros-3000/', t: 'P3000 · Libros gratis de Noemí Paymal' },
  pikler: { u: 'https://pikler.org', t: 'Pikler® USA · Enfoque Pikler/Lóczy' },
  reggio: { u: 'https://www.reggiochildren.it/en', t: 'Reggio Children · Reggio Emilia Approach' },
  respetuosa: { u: 'https://www.positivediscipline.com', t: 'Disciplina Positiva · Jane Nelsen' },
  apego: { u: 'https://www.crececontigo.gob.cl', t: 'Chile Crece Contigo · crianza y apego' },
  kimun: { u: 'https://peib.mineduc.cl', t: 'PEIB MINEDUC · Educación Intercultural Bilingüe' },
  bosque: { u: 'https://forestschoolassociation.org/what-is-forest-school', t: 'Forest School Association · qué es bosque-escuela' },
  cnv: { u: 'https://www.cnvc.org', t: 'CNVC · Comunicación No Violenta' },
  freinet: { u: 'https://www.fimem-freinet.org/en', t: 'FIMEM · Pedagogía Freinet internacional' },
  hogar: { u: 'https://www.ayudamineduc.cl/ficha/examenes-libres-menores-de-18-anos-11', t: 'Ayuda MINEDUC · Exámenes libres' }
};
function criaMetLink(id) { try { return (typeof CRIANZA_MET_LINKS !== 'undefined' && CRIANZA_MET_LINKS[id]) || null; } catch (e) { return null; } }
var CRIANZA_ETAPAS = [
  { e: 'Gestación', n: '🤰 Semilla', nec: 'Calma, vínculo y cuidados de quien gesta. El bebé escucha y siente desde el vientre.',
    ofr: 'Hablar y cantar a la guata · epew y mapuzugun · controles al día (CESFAM/matrona) · plan de parto conversado · red de apoyo postparto.',
    evi: 'Alcohol, tabaco y automedicación · sobrecarga de trabajo sin descanso · enfrentar el parto sin información.',
    luna: 'Una carta o canto por luna al bebé; prepara el nido (rincón, muda, red).' },
  { e: '0–12 meses', n: '🌱 Nido', nec: 'Brazo, pecho, sueño y calma. Vínculo seguro ante todo.',
    ofr: 'Pikler + pecho a demanda · porteo y piel con piel · cantos y epew · paseos diarios · controles niño sano + vacunas.',
    evi: 'Pantallas · andador · apurar hitos (sentar/parar) · sobre-estimular con juguetes sonoros.',
    luna: 'Un cuento por luna en 📖 Cuentos; registra hitos en 🤱 1000 días.' },
  { e: '1–2 años', n: '🐾 Primeros pasos', nec: 'Moverse libre, ensuciarse y decir ¡no! Caminar, trepar y probar límites.',
    ofr: 'Suelo firme para moverse · trasvasar y encajar Montessori · rutinas visuales · palabras para emociones ("rabia, pena").',
    evi: 'Castigos y gritos · pantallas como niñera · zapatos rígidos todo el día · compararlo con otros.',
    luna: 'Rincón de calma + muda cantada y avisada (Pikler).' },
  { e: '2–4 años', n: '🌋 Volcán tierno', nec: 'Rabietas intensas y cortas: necesita límites firmes y brazos que sostengan.',
    ofr: 'Protocolo rabieta (abajo, pestaña Límites) · juego simbólico (cocina, doctores) · mesa de estación Waldorf · turnos con reloj de arena.',
    evi: 'Pegar/devolver el golpe · ceder todo por cansancio · etiquetar ("mañoso, terrible") · pantallas para calmar siempre.',
    luna: 'Un cuento de emociones por luna; dibujo libre semanal.' },
  { e: '4–6 años', n: '🔥 Creador', nec: 'Jugar, imaginar y pertenecer. Pregunta "¿por qué?" sin fin.',
    ofr: 'Waldorf (cuentos, rondas, pan) · Reggio (proyectos, barro) · huerta propia · responsabilidades reales (regar, ordenar).',
    evi: 'Alfabetizar a la fuerza · sobre-agenda de talleres · comparar con otros niños · burlarse de sus miedos.',
    luna: 'Proyecto de una pregunta por luna; dibuja el árbol de la luna.' },
  { e: '6–9 años', n: '🌊 Navegante', nec: 'Amigos, reglas justas y sentirse capaz. Escuela y tareas entran fuerte.',
    ofr: 'Pedagogía 3000 (círculos, mingas) · oficios (cocinar, tejer, sembrar) · deporte y mar con cuidado · lectura diaria 15 min.',
    evi: 'Humillar por notas · quitar el juego como castigo · pantallas sin límite · hacerle sus tareas.',
    luna: 'Bitácora de gratitud + un oficio nuevo por luna.' },
  { e: '9–12 años', n: '🌙 Pensador', nec: 'Opinar, decidir y encontrar su lugar en el grupo. Pre-adolescencia.',
    ofr: 'Proyectos con propósito (huerto, trueque, radio) · acuerdos familiares · mapuzugun e historia del territorio · mesada con regla 50-30-20.',
    evi: 'Control total o abandono total · exponerlo en redes · decidir todo por él · celular sin acuerdo.',
    luna: 'Reunión familiar cada luna: logros, roces y acuerdos.' }
];
var CRIANZA_AMBIENTE = [
  { k: 'a1', t: 'Todo a su altura', d: 'Percha, vaso, estante y cama que alcance sin pedir ayuda.' },
  { k: 'a2', t: 'Pocas cosas, ordenadas', d: '4-6 actividades visibles; el resto guardado y rotando por luna.' },
  { k: 'a3', t: 'Materiales nobles', d: 'Madera, tela, barro, semillas: nada que haga todo solo (pilas).' },
  { k: 'a4', t: 'Rincón de calma', d: 'Cojín, mantas y 2 cuentos. Nunca como castigo.' },
  { k: 'a5', t: 'Mesa de la luna', d: 'Piedra, hoja o dibujo de la luna actual: marca el ritmo del mes.' },
  { k: 'a6', t: 'Rutinas visibles', d: 'Tabla con dibujos: despertar, comida, juego, cuento, dormir.' },
  { k: 'a7', t: 'Naturaleza diaria', d: 'Tierra, agua o caminata todos los días, con lluvia también.' },
  { k: 'a8', t: 'Cero pantallas al comer y dormir', d: 'Acuerdo familiar: mesa y pieza libres de pantalla.' },
  { k: 'a9', t: 'Rincón lector', d: 'Canasto con 5-8 libros/cuentos + luz cálida. 15 min diarios de lectura en voz alta.' },
  { k: 'a10', t: 'Movimiento libre seguro', d: 'Suelo firme, perímetro claro y 1 lugar para trepar bajo. Sin andador.' },
  { k: 'a11', t: 'Muro de sus obras', d: 'Cuerda + pinzas para exponer dibujos y barro. Se cambia cada luna (Reggio).' },
  { k: 'a12', t: 'Pacto de pantallas familiar', d: 'Horarios, lugar de carga fuera de piezas y ejemplo adulto. Ver pestaña Salud.' }
];
var CRIANZA_SALUD = [
  { n: '😴 Sueño por edad', ico: '🌙', txt: '0–3 m: 14–17 h · 4–11 m: 12–15 h · 1–2 a: 11–14 h (con siesta) · 3–5 a: 10–13 h · 6–12 a: 9–12 h. Misma hora ±30 min, ritual fijo (baño tibio, cuento, luz tenue), pieza oscura y fresca, sin pantalla 60 min antes. Si ronca fuerte, pausa la respiración o moja la cama a los 6+ seguido: consulta CESFAM.' },
  { n: '🥗 Comida real', ico: '🍲', txt: 'Pecho exclusivo hasta 6 m, luego + comida (guías CESFAM/Chile Crece). Plato: mitad verduras, cuarto proteína (huevo, legumbres, pescado), cuarto cereal + agua. Sin jugos ni bebidas antes de 2 años; azúcar y ultraprocesados lo menos posible. Comer juntos, sin pantalla, dejando que toque y se ensucie: así aprende.' },
  { n: '📱 Pantallas por edad (OMS)', ico: '📵', txt: '0–2 a: cero (solo videollamada con familia). 2–5 a: máx 1 h/día de contenido lento y acompañado, nunca antes de dormir ni comiendo. 6–12 a: con acuerdo familiar (horarios, lugares sin pantalla, contenido revisado). Señales de exceso: rabietas al apagar, menos juego libre, peor sueño. El ejemplo adulto manda.' },
  { n: '🦷 Dientes y control sano', ico: '🪥', txt: 'Desde el primer diente: cepillo suave + pasta con flúor del porte de un grano de arroz (hasta 3 a) o arveja (3+), 2 veces/día con ayuda adulta hasta los 8. Control niño sano + vacunas al día en CESFAM. Chile Crece Contigo entrega apoyo y materiales gratis: pregunta en tu control.' },
  { n: '☀️ Sol, aire y movimiento', ico: '🌳', txt: '1 h diaria afuera: plaza, playa, cerro o patio. Sol suave de mañana, gorro y agua. Descalzo en pasto/arena cuando se pueda. Movimiento libre > andador, saltarina o mucho coche: suelo firme y tiempo.' },
  { n: '🛡️ Seguridad en casa (0–6)', ico: '🔌', txt: 'Tapa enchufes, fija muebles altos a la pared, reja en escaleras y cocina, remedios y cloro bajo llave y en alto, agua del calefón a temperatura segura, nunca solo en tina/piscina/mar. Cuchillos y herramientas reales solo con acompañamiento (bosque-escuela).' },
  { n: '🤒 Fiebre y moquillos', ico: '🌿', txt: 'Observa al niño más que al termómetro: si juega, toma líquido y respira bien, suele ser cuadro viral. Signos de consulta pronto: menor de 3 m con fiebre, dificultad para respirar, decaimiento marcado, no toma líquido, fiebre + manchas que no se borran, golpe fuerte en cabeza. No automediques antibióticos. Lawen suave (tila, matico externo) no reemplaza control médico.' },
  { n: '💉 Controles y vacunas Chile', ico: '📋', txt: 'Calendario PNI al día + control niño sano por edad. Lleva carnet de salud a cada control y anota dudas antes de ir. Si faltan vacunas, el CESFAM las pone al día sin costo. Anota hitos en 🤱 1000 días y avisa si algo te preocupa (ver Alertas en pestaña Límites).' }
];
var CRIANZA_JUEGOS = [
  { e: '0–12 meses', ico: '🐣', juegos: 'Piel con piel y cantos · canasto del tesoro (cuchara madera, paño, limón, piña) · tiempo boca abajo · espejo irrompible · paseo nombrando el mundo.' },
  { e: '1–2 años', ico: '🐾', juegos: 'Trasvasar agua/semillas/arena · encajar y apilar · empujar y arrastrar · esconder y encontrar · barro con manos · caminar en desnivel suave.' },
  { e: '2–4 años', ico: '🌋', juegos: 'Juego simbólico (cocina, doctor, feria) · masa y barro · rondas y títeres · trasvasar con embudo · trepar bajo y saltar · regar la huerta.' },
  { e: '4–6 años', ico: '🔥', juegos: 'Construir cabañas · amasar pan · mandalas con semillas · memoria de sonidos/olores · bici sin pedales · sembrar y cosechar su maceta.' },
  { e: '6–9 años', ico: '🌊', juegos: 'Oficios reales (cocinar, tejer, clavar con guía) · ajedrez y juegos de mesa · bici, mar y cerro con cuidado · diario de naturaleza · trueque con amigos.' },
  { e: '9–12 años', ico: '🌙', juegos: 'Proyectos con propósito (huerto, radio, video) · deporte en equipo · cocina completa · mapa del territorio en bici · mentor de un menor (enseñar afirma).' },
  { e: 'Juego en Penco (todo el año)', ico: '🌊', juegos: 'Bajamares: mirar pozas sin llevarse nada vivo · Playa Negra/Lirquén: tesoro de piedras y deriva (no basura al mar) · cerro: caminata del epew · lluvia: saltar charcos con botas + chocolate después · minga: el mejor juego es trabajar juntos.' }
];
var CRIANZA_LIMITES = {
  pasos: ['1 · Calma tu tormenta primero: respira 4-6, baja tu voz y tu cuerpo a su altura. Sin gritos ni golpes: tú eres su freno externo.', '2 · Conecta antes de corregir: "veo que estás con mucha rabia, estoy aquí". Contacto y mirada blanda.', '3 · Nombra y valida: "querías seguir jugando y te dio rabia parar". Presta palabras; no sermonees en plena tormenta.', '4 · Límite breve + opción: "no se pega. Puedes apretar el cojín o pedir ayuda". 1 límite claro, 2 opciones aceptables.', '5 · Repara y anticipa: abrazo, "¿cómo lo arreglamos?", y acuerdo para la próxima ("avisamos 5 min antes"). Lo que se rompe se arregla juntos.'],
  frases: ['"Veo que estás frustrado/a. Estoy aquí."', '"El límite es no pegar. Te ayudo a parar."', '"¿Necesitas agua, abrazo o un minuto?"', '"Guardamos juntos 5 bloques y seguimos."', '"En 5 min guardamos: ¿ponemos el reloj?"', '"Tu rabia cabe aquí; los golpes no."', '"¿Qué necesitas: seguir, pausar o cambiar?"', '"Nos calmamos y después hablamos."', '"Me equivoqué al gritar, perdón. Reparo."', '"¿Cómo lo arreglamos juntos?"', '"Te amo siempre, incluso enojados."', '"Mañana lo intentamos de nuevo."'],
  errores: ['Gritar, amenazar o humillar: frena en el minuto, daña en el tiempo.', 'Etiquetar ("mañoso, terrible"): describe la conducta, no al niño.', 'Ceder todo por cansancio: el límite intermitente genera más rabietas.', 'Castigos largos o quitar el juego días: no enseñan, solo alejan.', 'Pantalla para calmar siempre: tapa la emoción, no la procesa.', 'Pelear entre adultos frente a ellos sin reparar: si pasa, repara frente a ellos también.'],
  alertas: ['No fija mirada ni responde a su nombre a los 12 m, no balbucea ni señala a los 12–15 m, no camina a los 18 m, pierde habilidades que ya tenía → consulta pronto (CESFAM / Chile Crece Contigo).', 'Rabietas +1 h diarias, se golpea fuerte, no duerme casi nada semanas, deja de comer/jugar días → pide apoyo (Fono Infancia 800 200 818, CESFAM).', 'Si hay gritos, golpes o miedo en casa: 149 Fono Familia · 133 emergencia · CESFAM. Pedir ayuda protege.', 'Si tú, criando, lloras a diario, no duermes o sientes que vas a explotar: Salud Responde 600 360 7777 · CESFAM · tu persona segura. Cuidarte también es criar.']
};
var CRIANZA_RITMO = 'Despertar misma hora + luz de mañana · juego afuera en la mañana · comida sin pantalla · siesta (hasta 4-5 a) · tarde de oficio/juego libre · cena temprano · ritual noche (baño tibio, cuento, gratitud) · dormir misma hora. Ritmo predecible = menos rabietas.';
var CRIANZA_CHILE = 'Chile Crece Contigo (controles, materiales y apoyo gratuitos) · CESFAM Penco (niño sano, vacunas, matrona, psicólogo) · JUNJI/Integra (jardines) · Fono Infancia 800 200 818 · Salud Responde 600 360 7777 · 149 Fono Familia · 133 emergencia.';
var CRIANZA_AREAS = ['Juego y aprendizaje', 'Límites y emociones', 'Rabieta que viví', 'Salud y sueño', 'Comida', 'Pantallas', 'Vínculo y familia', 'Escuela / jardín', 'Mi cuidado (quien cría)', 'Otro'];
function getCrianza() { var a = store('crianzaLog', []); return Array.isArray(a) ? a : []; }
function switchCriaTab(t) {
  [['Met', 'criaMetPanel'], ['Eda', 'criaEdaPanel'], ['Sal', 'criaSalPanel'], ['Jue', 'criaJuePanel'], ['Lim', 'criaLimPanel'], ['Amb', 'criaAmbPanel'], ['Bit', 'criaBitPanel']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $('tabCria' + x[0]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
}
function criaMetFicha(id) { try { return (typeof CRIANZA_MET_FICHA !== 'undefined' && CRIANZA_MET_FICHA[id]) || null; } catch (e) { return null; } }
function renderCriaMet(f, edadF) {
  var box = $('criaMetList'); if (!box) return;
  var q = ((f === undefined ? (($('criaQ') || {}).value || '') : f) + '').toLowerCase();
  var ef = edadF === undefined ? (($('criaEdadF') || {}).value || 'todas') : edadF;
  var list = CRIANZA_METODOS.filter(function (m) {
    var F = criaMetFicha(m.id);
    var txt = (m.t + ' ' + m.aut + ' ' + m.idea + ' ' + m.princ.join(' ') + ' ' + m.act + ' ' +
      (F ? (F.pasos.join(' ') + ' ' + F.ejemplos.join(' ') + ' ' + F.frases.join(' ') + ' ' + F.evita.join(' ') + ' ' + F.elige + ' ' + F.combina) : '')).toLowerCase();
    var okQ = !q || txt.indexOf(q) >= 0;
    var okE = !ef || ef === 'todas' || !F || !F.ed || F.ed.indexOf(ef) >= 0;
    return okQ && okE;
  });
  var comp = '';
  try {
    if (typeof CRIANZA_MET_COMPARA !== 'undefined' && !q && (ef === 'todas')) {
      comp = '<details class="menstrual-card" style="margin-top:8px"><summary style="cursor:pointer;font-size:12px"><b>⚖️ Comparativa rápida: ¿cuál para qué momento? (12 caminos)</b></summary>' +
        '<div style="overflow-x:auto"><table style="font-size:11px;border-collapse:collapse;width:100%;margin-top:6px">' +
        '<tr><th style="text-align:left;border-bottom:1px solid #ccc;padding:3px">Método</th><th style="text-align:left;border-bottom:1px solid #ccc;padding:3px">Foco</th><th style="text-align:left;border-bottom:1px solid #ccc;padding:3px">Edad ★</th><th style="text-align:left;border-bottom:1px solid #ccc;padding:3px">Úsalo cuando…</th></tr>' +
        CRIANZA_MET_COMPARA.map(function (c) { return '<tr><td style="padding:3px"><b>' + esc(c.m) + '</b></td><td style="padding:3px">' + esc(c.foco) + '</td><td style="padding:3px">' + esc(c.edad) + '</td><td style="padding:3px">' + esc(c.cuando) + '</td></tr>'; }).join('') +
        '</table></div><p class="muted" style="font-size:11px;margin-top:6px">' + esc(CRIANZA_MEZCLA_TXT) + '</p></details>';
    }
  } catch (e) {}
  var quiz = '';
  try {
    if (typeof CRIANZA_MET_QUIZ !== 'undefined' && !q) {
      quiz = '<details class="menstrual-card" style="margin-top:8px;border-color:var(--gold)"><summary style="cursor:pointer;font-size:12px"><b>🧭 Test: ¿qué camino te sirve hoy? (marca y ver)</b></summary>' +
        '<div style="margin-top:6px">' + CRIANZA_MET_QUIZ.map(function (x) { return '<label class="check-row" style="font-size:12px;margin:4px 0"><input type="checkbox" class="cria-quiz" value="' + x.k + '"> ' + esc(x.t) + '</label>'; }).join('') + '</div>' +
        '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button type="button" id="criaQuizVer" class="btn btn-accent" style="width:auto">Ver recomendación</button>' +
        '<button type="button" id="criaQuizLimpiar" class="btn" style="width:auto">Limpiar</button></div><div id="criaQuizRes" style="margin-top:8px"></div></details>';
    }
  } catch (e2) {}
  box.innerHTML = comp + quiz + (list.length ? '<p class="muted" style="font-size:11px;margin:8px 0">' + list.length + ' caminos · toca cada uno para ver pasos, ejemplos por edad, frases y errores.</p>' + list.map(function (m, i) {
    var F = criaMetFicha(m.id);
    var pasosH = F ? '<p style="font-size:12px;margin:6px 0 2px"><b>👣 Empieza esta semana (4 pasos)</b></p><ol style="font-size:12px;margin:2px 0 4px 18px;line-height:1.6">' + F.pasos.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>' : '';
    var ejH = F ? '<p style="font-size:12px;margin:6px 0 2px"><b>🎯 Ejemplos por edad</b></p><ul style="font-size:12px;margin:2px 0 4px 18px;line-height:1.6">' + F.ejemplos.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' : '';
    var frH = F ? '<p style="font-size:12px;margin:6px 0 2px"><b>💬 Frases que ayudan</b></p><p style="font-size:12px">' + F.frases.map(function (p) { return '• ' + esc(p); }).join('<br>') + '</p>' : '';
    var evH = F ? '<p style="font-size:12px;margin:6px 0 2px"><b>🚫 Errores comunes</b></p><p style="font-size:12px">' + F.evita.map(function (p) { return '• ' + esc(p); }).join('<br>') + '</p>' : '';
    var elH = F ? (function () {
      var LK = criaMetLink(m.id);
      var linkH = LK ? '<br>🔗 <a href="' + LK.u + '" target="_blank" rel="noopener">' + esc(LK.t) + ' ↗</a>' : '';
      return '<p style="font-size:12px"><b>🧭 Elige si:</b> ' + esc(F.elige) + '<br><b>🔗 Combina:</b> ' + esc(F.combina) + '<br><span class="muted">📚 ' + esc(F.libro) + '</span>' + linkH + '</p>';
    })() : '';
    return '<details class="menstrual-card" style="margin-top:8px"' + (i === 0 && q ? ' open' : '') + '><summary style="cursor:pointer;font-size:13px"><b>' + m.icon + ' ' + esc(m.t) + '</b> <span class="muted" style="font-size:11px">· ' + esc(m.aut) + '</span></summary>' +
      '<p style="font-size:12px;margin:8px 0"><b>Idea:</b> ' + esc(m.idea) + '</p>' +
      '<p style="font-size:12px;margin:4px 0"><b>🧭 Principios</b></p><ul style="font-size:12px;margin:4px 0 4px 18px;line-height:1.6">' + m.princ.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
      pasosH + ejH + frH + evH +
      '<p style="font-size:12px"><b>🏠 Ambiente:</b> ' + esc(m.amb) + '</p>' +
      '<p style="font-size:12px"><b>🧑‍🌾 Tu rol:</b> ' + esc(m.rol) + '</p>' +
      '<p style="font-size:12px"><b>🎲 Prueba hoy:</b> ' + esc(m.act) + '</p>' + elH +
      '<p class="muted" style="font-size:11px"><b>Edades:</b> ' + esc(m.edad) + '</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button type="button" class="btn btn-accent cria-reto" data-met="' + esc(m.t) + '" style="width:auto;font-size:11px">📓 Probar 7 días (anotar)</button></div></details>';
  }).join('') : '<p class="muted">Sin resultados. Prueba con "juego", "límite", "rabieta", "porteo" o "mapuche".</p>');
  try {
    var qv = $('criaQuizVer');
    if (qv) qv.onclick = function () {
      var checked = Array.prototype.map.call(document.querySelectorAll('.cria-quiz:checked'), function (x) { return x.value; });
      var res = $('criaQuizRes');
      if (!checked.length) { if (res) res.innerHTML = '<p class="muted" style="font-size:12px">Marca 1 o 2 frases que vivan hoy para recomendarte.</p>'; return; }
      var pts = {};
      CRIANZA_MET_QUIZ.forEach(function (x) { if (checked.indexOf(x.k) >= 0) x.m.forEach(function (id) { pts[id] = (pts[id] || 0) + 1; }); });
      var order = Object.keys(pts).sort(function (a, b) { return pts[b] - pts[a]; }).slice(0, 3);
      var names = {};
      CRIANZA_METODOS.forEach(function (m) { names[m.id] = m.icon + ' ' + m.t; });
      if (res) res.innerHTML = '<div class="si-card" style="border-color:var(--gold)"><h4>Tu punto de partida esta luna</h4><p>' +
        order.map(function (id, ix) { return '<b>' + (ix + 1) + '.</b> ' + esc(names[id] || id) + ' (' + pts[id] + ' coincidencia' + (pts[id] > 1 ? 's' : '') + ')'; }).join('<br>') +
        '</p><p class="muted" style="font-size:11px">Abre sus fichas abajo, elige 1 y dale 7 días. Anota en 📓 Bitácora qué cambió. ' + esc(CRIANZA_MEZCLA_TXT) + '</p></div>';
    };
    var qc = $('criaQuizLimpiar');
    if (qc) qc.onclick = function () { document.querySelectorAll('.cria-quiz').forEach(function (x) { x.checked = false; }); var r = $('criaQuizRes'); if (r) r.innerHTML = ''; };
  } catch (e3) {}
  box.querySelectorAll('.cria-reto').forEach(function (b) {
    b.onclick = function () {
      try {
        var met = b.getAttribute('data-met') || 'Mezcla propia';
        getCrianza().push({ id: uid('cr'), fecha: todayKey(), area: 'Juego y aprendizaje', metodo: met, hijo: '', texto: 'Reto 7 días con ' + met + ': 1 cambio pequeño diario. Día 1: ___. Observo: ___' });
        save('Reto anotado 📓'); renderCrianza();
        switchCriaTab('Bit');
      } catch (e) { try { switchCriaTab('Bit'); } catch (e2) {} }
    };
  });
}
function renderCriaEda() {
  var box = $('criaEdaList'); if (!box) return;
  box.innerHTML = CRIANZA_ETAPAS.map(function (e) {
    return '<div class="si-card"><h4>' + esc(e.n) + ' · ' + esc(e.e) + '</h4><p><b>Necesita:</b> ' + esc(e.nec) + '<br><b>Ofrece:</b> ' + esc(e.ofr) + '<br><b>Evita:</b> ' + esc(e.evi) + '<br><span class="muted">🌙 ' + esc(e.luna) + '</span></p></div>';
  }).join('') +
  '<div class="si-card" style="border-left:3px solid var(--gold)"><h4>🔁 Ritmo diario que calma</h4><p>' + esc(CRIANZA_RITMO) + '</p><p class="muted" style="font-size:11px">🇨🇱 Apoyos: ' + esc(CRIANZA_CHILE) + '</p></div>';
}
function renderCriaSal() {
  var box = $('criaSalList'); if (!box || typeof CRIANZA_SALUD === 'undefined') return;
  box.innerHTML = CRIANZA_SALUD.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + esc(c.txt) + '</p></div>';
  }).join('');
}
function renderCriaJue() {
  var box = $('criaJueList'); if (!box || typeof CRIANZA_JUEGOS === 'undefined') return;
  box.innerHTML = CRIANZA_JUEGOS.map(function (j) {
    return '<div class="si-card"><h4>' + j.ico + ' ' + esc(j.e) + '</h4><p>' + esc(j.juegos) + '</p></div>';
  }).join('');
}
function renderCriaLim() {
  var box = $('criaLimBox'); if (!box || typeof CRIANZA_LIMITES === 'undefined') return;
  var L = CRIANZA_LIMITES;
  box.innerHTML =
    '<div class="si-card" style="border-left:3px solid var(--gold)"><h4>🌋 Protocolo rabieta (5 pasos)</h4><ol style="font-size:12px;line-height:1.7;margin:4px 0 4px 18px">' + L.pasos.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol></div>' +
    '<div class="discipline-grid"><div class="discipline-card"><h4>💬 12 frases que sí funcionan</h4><p>' + L.frases.map(function (f) { return '• ' + esc(f); }).join('<br>') + '</p></div>' +
    '<div class="discipline-card"><h4>🚫 6 errores que agrandan la tormenta</h4><p>' + L.errores.map(function (f) { return '• ' + esc(f); }).join('<br>') + '</p></div></div>' +
    '<div class="si-card" style="border-left:3px solid #e76e8a"><h4>🚨 ¿Cuándo pedir ayuda?</h4><p>' + L.alertas.map(function (f) { return '• ' + esc(f); }).join('<br>') + '</p></div>';
}
function renderCriaAmb() {
  var box = $('criaAmbBox'); if (!box) return;
  var done = store('crianzaAmb', {});
  var n = CRIANZA_AMBIENTE.filter(function (x) { return done[x.k]; }).length;
  box.innerHTML = '<p class="muted" style="font-size:11px">✅ Ambiente preparado: <b>' + n + ' / ' + CRIANZA_AMBIENTE.length + '</b>. Avanza a tu ritmo, una por luna si quieres.</p>' +
    '<div class="dio-compact">' + CRIANZA_AMBIENTE.map(function (x) {
      var c = done[x.k] ? ' done' : '';
      return '<label class="dio-item' + c + '"><input type="checkbox" data-criaamb="' + x.k + '"' + (done[x.k] ? ' checked' : '') + '><span class="dio-txt"><b>' + esc(x.t) + '</b><small>' + esc(x.d) + '</small></span><span class="dio-check">' + (done[x.k] ? '✓ listo' : 'marcar') + '</span></label>';
    }).join('') + '</div>';
  box.querySelectorAll('[data-criaamb]').forEach(function (c) {
    c.onchange = function () { var d = store('crianzaAmb', {}); d[c.getAttribute('data-criaamb')] = c.checked; save(c.checked ? 'Ambiente avanza 🏠' : 'Guardado'); renderCriaAmb(); };
  });
}
function renderCrianza() {
  renderCriaMet(); renderCriaEda(); renderCriaAmb();
  try { renderCriaSal(); } catch (e) {}
  try { renderCriaJue(); } catch (e2) {}
  try { renderCriaLim(); } catch (e3) {}
  var box = $('criaList'); if (!box) return;
  var d = getCrianza().slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  box.innerHTML = d.length ? d.slice(0, 40).map(function (r) {
    return '<div class="habit-item"><b>' + esc(r.area) + '</b> <span class="chip" style="font-size:10px">' + esc(r.metodo) + '</span><br>' +
      '<span class="muted" style="font-size:11px">📅 ' + r.fecha + (r.hijo ? ' · 👶 ' + esc(r.hijo) : '') + '</span><p style="font-size:12px">' + esc(r.texto) + '</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤 Compartir</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Sin notas aún. Anota qué probaste, cómo respondió y qué ajustarás: criar también se aprende.</p>';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar nota?')) return; var dd = getCrianza(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderCrianza(); }; });
  box.querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var dd = getCrianza(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-share'); }); if (!r) return; share('🧒 Crianza: ' + r.area, '📅 ' + r.fecha + ' · ' + r.metodo + '\n' + r.texto); }; });
  var st = $('criaStats'); if (st) st.textContent = d.length + ' notas de crianza';
}
function setupCrianza() {
  addKw('btnCrianza', 'montessori waldorf pedagogia 3000 pikler reggio emilia disciplina positiva apego porteo kimun mapuche bosque escuela cnv freinet hogar homeschool limites rabietas juego autonomia etapas ambiente preparado sueno comida pantallas fiebre dientes ritmo alertas comparativa test mezcla frases errores chile crece contigo');
  makeDialog('crianzaDialog', '🧒 Crianza infantil — guía completa 0-12',
    'Doce caminos para acompañar: <b>Montessori, Waldorf, Pedagogía 3000, Pikler, Reggio, Crianza respetuosa + Apego y porteo, Kimün mapuche, Bosque-escuela, CNV, Freinet y Aprendizaje en familia</b>. Cada método trae <b>pasos, ejemplos por edad, frases, errores y con qué combinar</b>, más comparativa, test orientador y reto de 7 días. Mézclalos: ningún método puro cría solo. Todo <b>privado y local</b>.',
    '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
    '<button type="button" id="tabCriaMet" class="btn btn-accent" style="width:auto">🌱 Métodos</button>' +
    '<button type="button" id="tabCriaEda" class="btn" style="width:auto">🎂 Por edad</button>' +
    '<button type="button" id="tabCriaSal" class="btn" style="width:auto">🩺 Salud</button>' +
    '<button type="button" id="tabCriaJue" class="btn" style="width:auto">🎲 Juego</button>' +
    '<button type="button" id="tabCriaLim" class="btn" style="width:auto">🌋 Límites</button>' +
    '<button type="button" id="tabCriaAmb" class="btn" style="width:auto">🏠 Ambiente</button>' +
    '<button type="button" id="tabCriaBit" class="btn" style="width:auto">📓 Bitácora</button></div>' +
    '<div id="criaMetPanel"><div class="conv-row"><label style="flex:2">🔍 Buscar en métodos <input type="text" id="criaQ" placeholder="ej: juego, rabieta, porteo, mapuche, frases..." autocomplete="off"></label><label>Edad <select id="criaEdadF"><option value="todas">Todas</option><option value="0-2">Bebé 0–2</option><option value="1-3">1–3 años</option><option value="3-6">3–6 años</option><option value="6-12">6–12 años</option></select></label></div><div id="criaMetList"></div></div>' +
    '<div id="criaEdaPanel" class="hidden"><p class="muted" style="font-size:11px">Gestación + 6 etapas hasta los 12: lo que necesita, lo que puedes ofrecer, lo que conviene evitar y un ritmo lunar.</p><div id="criaEdaList" style="display:flex;flex-direction:column;gap:8px"></div></div>' +
    '<div id="criaSalPanel" class="hidden"><p class="muted" style="font-size:11px">Sueño, comida, pantallas, dientes, seguridad y controles. Base OMS + CESFAM Chile.</p><div id="criaSalList" style="display:flex;flex-direction:column;gap:8px"></div></div>' +
    '<div id="criaJuePanel" class="hidden"><p class="muted" style="font-size:11px">Qué jugar en cada edad con cosas simples + ideas para Penco con lluvia o sol.</p><div id="criaJueList" style="display:flex;flex-direction:column;gap:8px"></div></div>' +
    '<div id="criaLimPanel" class="hidden"><div id="criaLimBox"></div></div>' +
    '<div id="criaAmbPanel" class="hidden"><div id="criaAmbBox"></div></div>' +
    '<div id="criaBitPanel" class="hidden"><div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Nota de crianza (privada)</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="criaFecha"></label><label style="flex:2">Área <select id="criaArea">' + CRIANZA_AREAS.map(function (a) { return '<option>' + a + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Método que probé <select id="criaMetodo"><option>Ninguno aún</option><option>Montessori</option><option>Waldorf</option><option>Pedagogía 3000</option><option>Pikler</option><option>Reggio Emilia</option><option>Crianza respetuosa</option><option>Apego y porteo</option><option>Kimün mapuche</option><option>Bosque-escuela</option><option>Comunicación no violenta</option><option>Freinet</option><option>Aprendizaje en familia</option><option>Mezcla propia</option></select></label><label style="flex:2">Niño/a (opcional) <input type="text" id="criaHijo" placeholder="ej: León" maxlength="20"></label></div>' +
    '<label>Qué pasó / qué probé <textarea id="criaTexto" rows="2" placeholder="ej: probé rincón de calma en la rabieta, funcionó a los 5 min..." maxlength="400"></textarea></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="criaAdd" class="btn btn-accent" style="width:auto">+ Guardar nota</button></div></div>' +
    '<div id="criaList" class="habits-list" style="margin-top:10px;max-height:260px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="criaStats" class="muted" style="font-size:11px"></span><button type="button" id="criaShareAll" class="btn" style="width:auto">📤 Compartir resumen</button></div></div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px"><button type="button" id="criaGoCuentos" class="btn" style="width:auto">📖 Cuentos</button>' +
    '<button type="button" id="criaGoMil" class="btn" style="width:auto">🤱 1000 días</button>' +
    '<button type="button" id="criaGoAdol" class="btn" style="width:auto">🌱 Adolescencia</button>' +
    '<button type="button" id="criaGoHabitos" class="btn" style="width:auto">✅ Hábitos</button></div>');
  var b = $('btnCrianza');
  if (b) b.onclick = function () { if (!$('criaFecha').value) $('criaFecha').value = todayKey(); switchCriaTab('Met'); renderCrianza(); openDlg('crianzaDialog'); };
  if ($('tabCriaMet')) $('tabCriaMet').onclick = function () { switchCriaTab('Met'); };
  if ($('tabCriaEda')) $('tabCriaEda').onclick = function () { switchCriaTab('Eda'); renderCriaEda(); };
  if ($('tabCriaSal')) $('tabCriaSal').onclick = function () { switchCriaTab('Sal'); renderCriaSal(); };
  if ($('tabCriaJue')) $('tabCriaJue').onclick = function () { switchCriaTab('Jue'); renderCriaJue(); };
  if ($('tabCriaLim')) $('tabCriaLim').onclick = function () { switchCriaTab('Lim'); renderCriaLim(); };
  if ($('tabCriaAmb')) $('tabCriaAmb').onclick = function () { switchCriaTab('Amb'); renderCriaAmb(); };
  if ($('tabCriaBit')) $('tabCriaBit').onclick = function () { switchCriaTab('Bit'); };
  if ($('criaQ')) $('criaQ').oninput = function () { renderCriaMet($('criaQ').value); };
  if ($('criaEdadF')) $('criaEdadF').onchange = function () { renderCriaMet(); };
  if ($('criaAdd')) $('criaAdd').onclick = function () {
    var t = clean($('criaTexto').value, 400); if (!t) return alert('Escribe la nota');
    getCrianza().push({ id: uid('cr'), fecha: $('criaFecha').value || todayKey(), area: $('criaArea').value, metodo: $('criaMetodo').value, hijo: clean($('criaHijo').value, 20), texto: t });
    save('Nota guardada 🧒'); $('criaTexto').value = ''; $('criaHijo').value = ''; renderCrianza();
  };
  if ($('criaShareAll')) $('criaShareAll').onclick = function () { var d = getCrianza(); if (!d.length) return alert('Sin notas'); share('🧒 Bitácora de crianza (resumen)', d.map(function (r) { return '· ' + r.fecha + ' — ' + r.area + ' [' + r.metodo + ']\n' + r.texto; }).join('\n\n')); };
  if ($('criaGoCuentos')) $('criaGoCuentos').onclick = function () { try { var x = $('btnTales'); if (x) x.click(); } catch (e) {} };
  if ($('criaGoMil')) $('criaGoMil').onclick = function () { try { var x = $('btnFerti'); if (x) x.click(); setTimeout(function () { try { switchFerTab('Mil'); } catch (e) {} }, 150); } catch (e2) {} };
  if ($('criaGoAdol')) $('criaGoAdol').onclick = function () { try { var x = $('btnAdolescencia'); if (x) x.click(); } catch (e) {} };
  if ($('criaGoHabitos')) $('criaGoHabitos').onclick = function () { try { var x = $('btnHabits'); if (x) x.click(); } catch (e) {} };
}

/* ---------- init ---------- */
var _initTries = 0;
/* ---------- Clima y Mareas en ventana emergente (dialog) como el resto ---------- */
function setupClimaMareasDialog() {
  function ensureStyle() {
    if ($('climaMareasDlgStyle')) return;
    var st = document.createElement('style');
    st.id = 'climaMareasDlgStyle';
    st.textContent = '#weatherDialog,#tidesDialog{width:680px;max-width:96vw;max-height:88vh;overflow-y:auto;}' +
      '#weatherDialog #weatherPanel,#tidesDialog #tidesPanel{display:block!important;margin-top:0;max-width:none;background:transparent;border:none;border-radius:0;padding:0;}' +
      '#weatherDialog #weatherPanel.hidden,#tidesDialog #tidesPanel.hidden{display:block!important;}';
    document.head.appendChild(st);
  }
  function ensureDialog(id, title) {
    var d = $(id);
    if (d) return d;
    d = document.createElement('dialog');
    d.id = id;
    d.innerHTML = '<form method="dialog">' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
      '<h3 style="margin:0;color:var(--accent)">' + title + '</h3>' +
      '<button type="button" class="btn btn-icon" data-close="' + id + '" title="Cerrar">✕</button></div>' +
      '<div data-body="' + id + '"></div>' +
      '<div class="dlg-actions" style="margin-top:10px"><button type="button" class="btn" data-close="' + id + '">Cerrar</button></div>' +
      '</form>';
    document.body.appendChild(d);
    d.querySelectorAll('[data-close]').forEach(function (b) {
      b.onclick = function () { try { d.close(); } catch (e) {} };
    });
    return d;
  }
  function openDlg(id) {
    var d = $(id);
    if (!d) return;
    try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} }
  }
  ensureStyle();
  var wDlg = ensureDialog('weatherDialog', '🌤️ Clima — Penco');
  var tDlg = ensureDialog('tidesDialog', '🌊 Mareas — Penco');
  // Mover los paneles inline dentro de los dialogs (una sola vez)
  try {
    var wp = $('weatherPanel');
    var wb = wDlg.querySelector('[data-body="weatherDialog"]');
    if (wp && wb && wp.parentNode !== wb) wb.appendChild(wp);
  } catch (e) {}
  try {
    var tp = $('tidesPanel');
    var tb = tDlg.querySelector('[data-body="tidesDialog"]');
    if (tp && tb && tp.parentNode !== tb) tb.appendChild(tp);
  } catch (e) {}
  try { addKw('btnWeather', 'clima dialogo ventana pronostico'); } catch (e) {}
  try { addKw('btnTides', 'mareas dialogo ventana shoa'); } catch (e) {}
  var bW = $('btnWeather');
  if (bW && !bW.dataset.dlgWrapped) {
    bW.dataset.dlgWrapped = '1';
    bW.onclick = function () {
      try {
        var wp2 = $('weatherPanel'); if (wp2) wp2.classList.remove('hidden');
        var tp2 = $('tidesPanel'); if (tp2) tp2.classList.add('hidden');
      } catch (e) {}
      openDlg('weatherDialog');
      try {
        if (typeof fetchWeather === 'function') fetchWeather();
        else if (typeof renderWeatherPanel === 'function') renderWeatherPanel();
      } catch (e) {}
      try {
        var wp3 = $('weatherPanel'); if (wp3) wp3.classList.remove('hidden');
      } catch (e) {}
    };
  }
  var bT = $('btnTides');
  if (bT && !bT.dataset.dlgWrapped) {
    bT.dataset.dlgWrapped = '1';
    bT.onclick = function () {
      try {
        var tp2 = $('tidesPanel'); if (tp2) tp2.classList.remove('hidden');
      } catch (e) {}
      openDlg('tidesDialog');
      try { if (typeof renderTidesPanel3 === 'function') renderTidesPanel3(); } catch (e) {}
      try {
        var tp3 = $('tidesPanel'); if (tp3) tp3.classList.remove('hidden');
      } catch (e) {}
    };
  }
}

function init() {
  _initTries++;
  if (!document.querySelector('.action-group[data-group]')) { if (_initTries < 40) setTimeout(init, 500); return; }
  try { injectButtons(); } catch (e) {}
  try { setupClimaMareasDialog(); } catch (e) {}
  try { setupForraje(); } catch (e) {}
  try { setupBodega(); } catch (e) {}
  try { setupTrafFusion(); } catch (e) {}
  try { setupAgua(); } catch (e) {}
  try { setupNudos(); } catch (e) {}
  try { setupTaller(); } catch (e) {}
  try { setupInvierno(); } catch (e) {}
  try { setupTrueque(); } catch (e) {}
  try { setupMinga(); } catch (e) {}
  try { setupCieloFusion(); } catch (e) {}
  try { setupEpew(); } catch (e) {}
  try { setupKimun(); } catch (e) {}
  try { setupRutina(); } catch (e) {}
  try { setupFerti(); } catch (e) {}
  try { setupDerechos(); } catch (e) {}
  try { setupMilDias(); } catch (e) {}
  try { setupDuelo(); } catch (e) {}
  try { setupSuenos(); } catch (e) {}
  try { setupMedita(); } catch (e) {}
  try { setupTrans(); } catch (e) {}
  try { setupVoz(); } catch (e) {}
  try { setupArbol(); } catch (e) {}
  try { setupMapa(); } catch (e) {}
  try { setupVoluntades(); } catch (e) {}
  try { setupSaberesCirculos(); } catch (e) {}
  try { setupHogar(); } catch (e) {}
  try { setupTesoros(); } catch (e) {}
  try { setupNombreLunar(); } catch (e) {}
  try { setupCrianza(); } catch (e) {}
  try { cleanupCocrea(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 800); });
else setTimeout(init, 800);
setTimeout(init, 2500);

})();
