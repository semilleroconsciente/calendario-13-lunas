/* ============================================================
   NUEVOS MODULOS — Calendario 13 Lunas (Penco · Bio-Bio)
   14 secciones integradas dentro de los grupos existentes:
   - Territorio: Agua (+ Recoleccion fusionada en Lawen Herbario, Trafkintu
     fusionado en Mis Semillas de Siembra Lunar, Cielo Mapuche en Astro)
   - Vida diaria: La Bodega (conservas y fermentos)
   - Herramientas/Oficios: Nudos y Redes, Bitacora Taller, Gestion Invernal
   - Emergencias & Comunidad: Trueque y Feria, Minga
   - Mente & Estudio: Epew (+ Territorial dentro de Mapuzugun)
   - Cuerpo & Salud: Rutinas Circadianas, Fertilidad Sintotermica
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
  { n: 'As de guia', uso: 'Kayak, amarre seguro que no se aprieta. Presilla que salva vidas.', pasos: ['Haz un seno (lazo) con el chicote encima.', 'Pasa el chicote por el seno desde abajo (la "serpiente sale del lago").', 'Rodea el firme por detras (rodea el arbol).', 'Vuelve a entrar al seno por donde salio.', 'Ajusta: tira firme y seno a la vez.'], tip: 'Verificacion: cuenta 3 partes paralelas. Para kayak: une cabo de remolque.' },
  { n: 'Ballestrinque', uso: 'Entutorado de huerta, amarrar a poste o vara. Rapido y ajustable.', pasos: ['Da una vuelta completa al poste.', 'Cruza el chicote sobre el firme formando una X.', 'Da segunda vuelta al poste.', 'Pasa el chicote bajo la X.', 'Tensa ambos lados.'], tip: 'Con carga constante aguanta; si vibra, remata con medio cote.' },
  { n: 'Nudo de pescador (doble)', uso: 'Unir dos lineas de pesca o nylon del mismo grosor.', pasos: ['Superpon 10 cm de ambas lineas en sentidos opuestos.', 'Con una, haz 3 vueltas sobre la otra y pasa por el centro.', 'Repite con la otra linea.', 'Humedece y tira de los 4 cabos a la vez.', 'Corta sobrantes a 3 mm.'], tip: 'Humedece siempre antes de apretar nylon o se quema y pierde 50% fuerza.' },
  { n: 'Ocho (doble ocho)', uso: 'Tope y presilla de seguridad. Base de escalada y kayak.', pasos: ['Haz un seno y cruza formando un 8.', 'Pasa el chicote por el primer ojo del 8.', 'Sigue el dibujo si es doble (para presilla).', 'Peina el nudo (acomoda cada vuelta).', 'Tensa. Deja 10 cm de cola.'], tip: 'El nudo rey: no se deshace solo y se desata facil tras carga.' },
  { n: 'Rizo (llano)', uso: 'Atar fardos, cerrar sacos, unir cuerdas iguales sin carga critica.', pasos: ['Derecha sobre izquierda y pasa.', 'Izquierda sobre derecha y pasa.', 'Tensa parejo.', 'Verifica: dos senos simetricos.', 'NUNCA para vidas o cargas distintas.'], tip: 'Si las cuerdas son distintas o resbalan: usa vuelta de escota.' },
  { n: 'Vuelta de escota', uso: 'Unir cuerda gruesa con delgada (red + cabo, carpa + viento).', pasos: ['Haz un seno con la gruesa.', 'Pasa la delgada por dentro del seno.', 'Rodea el seno completo por detras.', 'Pasa bajo su propio firme.', 'Tensa. Doble vuelta si resbala.'], tip: 'Clave para reparar redes: malla (delgada) a relinga (gruesa).' }
];
var REDES_GUIA = ['Corta el pano danado en rectangulo limpio (no dejes picos).', 'Prepara aguja de red + hilo del mismo grosor (nylon pesca / sisal huerta).', 'Sujeta el pano tenso entre dos puntos (poste + peso).', 'Teje malla por malla con nudo de pescador simple en cada rombo, copiando el tamano con una tablilla.', 'Remata bordes con vuelta de escota a la relinga.', 'Revisa al sol: ningun rombo mayor ni menor. Prueba en agua antes de faena.'];
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
  { id: 'btnAgua', txt: '💧 Agua', kw: 'agua lluvia estanque pozo milimetros reserva litros sequia corte rio rios medicion nivel ph', grupo: 'territorio' },
  { id: 'btnBodega', txt: '🍯 La Bodega', kw: 'bodega conservas fermentos mermelada chucrut kombucha deshidratado frasco caducidad maduracion lunar', grupo: 'vida' },
  { id: 'btnCrianza', txt: '🧒 Crianza', kw: 'crianza infantil niños niñas hijos pedagogia montessori waldorf pikler reggio disciplina positiva juego infancia educacion', grupo: 'vida' },
  { id: 'btnNudos', txt: '🪢 Nudos y Redes', kw: 'nudos amarras redes pesca ballestrinque as de guia pescador kayak camping entutorado tejer reparar', grupo: 'herramientas' },
  { id: 'btnTaller', txt: '🔧 Bitácora Taller', kw: 'taller reparacion mantenimiento herramienta bote bicicleta aceite afilado bomba alerta luna', grupo: 'herramientas' },
  { id: 'btnTrueque', txt: '🔄 Trueque y Feria', kw: 'trueque feria local economia circular intercambio vecino feria libre penco gastos cuenta reciclaje punto limpio basura residuo botella pila aceite ropa recoleccion aseo', grupo: 'emergencia' },
  { id: 'btnMinga', txt: '🤝 Minga · Red de Apoyo', kw: 'minga red apoyo comunidad ayuda techo cosecha tormenta llamado offline bluetooth vecino', grupo: 'emergencia' },
  { id: 'btnRutina', txt: '🧘 Rutinas Circadianas', kw: 'rutina circadiano hora dorada cortisol planificador habito sueño energia creatividad descanso', grupo: 'cuerpo' },
  { id: 'btnFerti', txt: '🤰 Fertilidad Natural', kw: 'fertilidad ciclo sintotermico temperatura basal moco cervical ovulacion test lh buscar evitar embarazo parto puerperio lactancia bebe guagua hitos 1000 dias fur fpp vacunas controles crecimiento planificacion familiar natural privado', grupo: 'cuerpo' },
  { id: 'btnDerechos', txt: '⚖️ Derechos y Deberes', kw: 'derechos deberes constitucion ciudadano reclamo denuncia sernac trabajo salud educacion consumidor carabineros pdi juzgado municipalidad', grupo: 'emergencia' },
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
  return added;
}

/* ---------- orden Territorio: Clima, Mareas, Astro, Intermareal, Pesca, Aves, Siembra, Bosque, Flora, Compost, Agua, Penco, Circadiano, Hora Dorada, Ekadashi ---------- */
var ORDEN_TERRITORIO = ['btnWeather','btnTides','btnAstro','btnIntermareal','btnFishing','btnBirds','btnSiembra','btnBosque','btnFlora','btnCompost','btnAgua','btnComuna','btnCircadian','btnGolden','btnEkadashi'];
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
   4) AGUA (lluvia y estanques)
   ============================================================ */
function getAguaCfg() { var o = store('aguaCfg', { cap: 1000, nivel: 500, consumo: 60 }); if (typeof o !== 'object') return { cap: 1000, nivel: 500, consumo: 60 }; return o; }
function getLluvia() { var a = store('lluviaLog', []); return Array.isArray(a) ? a : []; }
function getRios() { var a = store('riosLog', []); return Array.isArray(a) ? a : []; }
function renderRios() {
  var box = $('riosList'); if (!box) return;
  var data = getRios().slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 40);
  if (!data.length) { box.innerHTML = '<p class="muted">Sin mediciones. Registra tu primera medición del río.</p>'; return; }
  box.innerHTML = data.map(function (r) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span>🌊 <b>' + esc(r.rio) + '</b> · ' + r.fecha +
      ' · nivel ' + esc(r.nivel) + ' cm' + (r.ph ? ' · pH ' + esc(r.ph) : '') + (r.nota ? ' <span class="muted">· ' + esc(r.nota) + '</span>' : '') +
      '</span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var d = getRios(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderRios(); }; });
}
function renderAgua() {
  var cfg = getAguaCfg(), data = getLluvia();
  var mes = data.filter(function (r) { return r.fecha.slice(0, 7) === todayKey().slice(0, 7); }).reduce(function (a, r) { return a + (parseFloat(r.mm) || 0); }, 0);
  var dias = cfg.consumo > 0 ? Math.floor(cfg.nivel / cfg.consumo) : 0;
  var pct = cfg.cap > 0 ? Math.min(100, Math.round(cfg.nivel / cfg.cap * 100)) : 0;
  $('aguaResumen').innerHTML = '<h4>💧 Reserva · ' + pct + '%</h4>' +
    '<div class="astro-bar" style="height:10px;margin:6px 0"><i style="width:' + pct + '%"></i></div>' +
    '<p class="muted" style="font-size:12px">🚰 ' + cfg.nivel + ' / ' + cfg.cap + ' L · consumo ~' + cfg.consumo + ' L/día → <b>' + dias + ' días de autonomía</b><br>🌧️ Lluvia este mes: <b>' + mes.toFixed(1) + ' mm</b> (' + data.length + ' registros)</p>' +
    (dias < 7 ? '<p style="font-size:12px;color:#ff9a9a">⚠️ Reserva baja: prioriza riego por goteo y reutiliza aguas grises.</p>' : '<p style="font-size:12px;color:#8fd694">✓ Reserva sana para Penco y cortes puntuales.</p>');
  var box = $('lluviaList');
  if (!data.length) box.innerHTML = '<p class="muted">Sin lluvias registradas.</p>';
  else box.innerHTML = data.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 40).map(function (r) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span>🌧️ <b>' + r.mm + ' mm</b> · ' + r.fecha + (r.nota ? ' <span class="muted">· ' + esc(r.nota) + '</span>' : '') + '</span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var d = getLluvia(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderAgua(); }; });
  try { renderRios(); } catch (e) {} // rios
}
function setupAgua() {
  makeDialog('aguaDialog', '💧 Agua',
    'Para Penco y zonas rurales con cortes o agua de pozo/lluvia. Registra milímetros y estima cuántos litros quedan.',
    '<div id="aguaResumen" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>⚙️ Mi estanque</h4><div class="conv-row"><label>Capacidad (L) <input type="number" id="aguaCap" min="0" step="50"></label><label>Nivel actual (L) <input type="number" id="aguaNivel" min="0" step="10"></label><label>Consumo día (L) <input type="number" id="aguaCons" min="0" step="5"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="aguaSave" class="btn btn-accent" style="width:auto">💾 Guardar estanque</button></div>' +
    '<p class="muted" style="font-size:10px">Tip: 1 mm de lluvia sobre 1 m² de techo ≈ 1 litro cosechable (descuenta 20% por pérdidas).</p></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌧️ Registrar lluvia</h4><div class="conv-row"><label>Fecha <input type="date" id="lluFecha"></label><label>mm <input type="number" id="lluMm" min="0" step="0.5" placeholder="ej: 12.5"></label><label>m² techo (opcional) <input type="number" id="lluTecho" min="0" step="1" placeholder="40"></label></div>' +
    '<label>Nota <input type="text" id="lluNota" placeholder="temporal sur, granizo..." maxlength="60"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="lluAdd" class="btn btn-accent" style="width:auto">+ Guardar lluvia</button></div>' +
    '<div id="lluviaList" class="habits-list" style="margin-top:10px;max-height:220px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌊 Bitácora de ríos</h4><div class="conv-row"><label>Río <select id="rioNombre"><option>Estero Penco</option><option>Río Lirquén</option><option>Río Andalién</option><option>Otro</option></select></label><label>Fecha <input type="date" id="rioFecha"></label><label>Nivel (cm) <input type="number" id="rioNivel" min="0" step="1" placeholder="ej: 45"></label><label>pH (opcional) <input type="number" id="rioPh" min="0" max="14" step="0.1" placeholder="7.0"></label></div>' +
    '<label>Nota <input type="text" id="rioNota" placeholder="ej: agua clara, subió tras lluvia..." maxlength="60"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="rioAdd" class="btn btn-accent" style="width:auto">+ Guardar medición</button></div>' +
    '<div id="riosList" class="habits-list" style="margin-top:10px;max-height:220px"></div></div>');
  var b = $('btnAgua'); if (b) { try { b.textContent = '💧 Agua'; } catch (e) {} b.onclick = function () { var c = getAguaCfg(); $('aguaCap').value = c.cap; $('aguaNivel').value = c.nivel; $('aguaCons').value = c.consumo; if (!$('lluFecha').value) $('lluFecha').value = todayKey(); if ($('rioFecha') && !$('rioFecha').value) $('rioFecha').value = todayKey(); renderAgua(); try { renderRios(); } catch (e) {} openDlg('aguaDialog'); }; }
  if ($('rioAdd') && !$('rioAdd').dataset.wired) { $('rioAdd').dataset.wired = '1'; $('rioAdd').onclick = function () {
    var rio = $('rioNombre') ? $('rioNombre').value : 'Río';
    var f = ($('rioFecha') && $('rioFecha').value) || todayKey();
    var niv = $('rioNivel') ? String($('rioNivel').value || '').trim() : '';
    if (!niv) return alert('Escribe el nivel en cm');
    var ph = $('rioPh') ? String($('rioPh').value || '').trim() : '';
    getRios().push({ id: uid('rio'), rio: rio, fecha: f, nivel: niv, ph: ph, nota: clean(($('rioNota') || { value: '' }).value, 60) });
    save('Medición guardada 🌊'); if ($('rioNivel')) $('rioNivel').value = ''; if ($('rioPh')) $('rioPh').value = ''; if ($('rioNota')) $('rioNota').value = ''; renderRios();
  }; }
  $('aguaSave').onclick = function () { var c = getAguaCfg(); c.cap = +$('aguaCap').value || 0; c.nivel = +$('aguaNivel').value || 0; c.consumo = +$('aguaCons').value || 0; save(); renderAgua(); };
  $('lluAdd').onclick = function () {
    var f = $('lluFecha').value || todayKey(), mm = parseFloat($('lluMm').value);
    if (!(mm >= 0)) return alert('Escribe los mm');
    var techo = parseFloat($('lluTecho').value) || 0;
    getLluvia().push({ id: uid('ll'), fecha: f, mm: mm, nota: clean($('lluNota').value, 60) });
    if (techo > 0) { var c = getAguaCfg(); c.nivel = Math.min(c.cap, Math.round(c.nivel + mm * techo * 0.8)); }
    save('Lluvia guardada 🌧️'); $('lluMm').value = ''; $('lluNota').value = ''; $('aguaNivel').value = getAguaCfg().nivel; renderAgua();
  };
}

/* ============================================================
   5) NUDOS, AMARRAS Y REDES
   ============================================================ */
var nudoAnim = null;
function renderNudos() {
  var box = $('nudosList'); if (!box) return;
  box.innerHTML = NUDOS.map(function (k, i) {
    return '<div class="si-card"><div class="fin-tip-head"><span class="fin-tip-ico">🪢</span><h4>' + esc(k.n) + '</h4></div>' +
      '<p class="fin-tip-desc">🎯 ' + esc(k.uso) + '</p>' +
      '<ol class="esp-steps">' + k.pasos.map(function (p, j) { return '<li data-n="' + i + '" data-s="' + j + '">' + esc(p) + '</li>'; }).join('') + '</ol>' +
      '<p class="fin-tip-tip">💡 ' + esc(k.tip) + '</p>' +
      '<div style="display:flex;gap:6px;margin-top:6px"><button class="btn" style="width:auto;font-size:11px" data-anim="' + i + '">▶ Animar paso a paso</button></div>' +
      '<div class="chip hidden" style="margin-top:6px;white-space:normal" id="nudoMsg' + i + '"></div></div>';
  }).join('') + '<div class="si-card" style="border-left:3px solid var(--gold)"><div class="fin-tip-head"><span class="fin-tip-ico">🎣</span><h4>Reparar y tejer redes de pesca</h4></div>' +
    '<ol class="esp-steps">' + REDES_GUIA.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') + '</ol>' +
    '<p class="fin-tip-tip">🧵 Lleva siempre: aguja de red, tablilla medidora, hilo extra y tijera. Practica primero con red de huerta (entutorado).</p></div>';
  box.querySelectorAll('[data-anim]').forEach(function (btn) {
    btn.onclick = function () {
      if (nudoAnim) { clearInterval(nudoAnim); nudoAnim = null; }
      var i = +btn.getAttribute('data-anim'), steps = box.querySelectorAll('li[data-n="' + i + '"]');
      var msg = $('nudoMsg' + i); if (msg) msg.classList.remove('hidden');
      var s = 0;
      steps.forEach(function (li) { li.style.background = ''; });
      btn.textContent = '⏸ Animando... (toca para detener)';
      nudoAnim = setInterval(function () {
        steps.forEach(function (li) { li.style.background = ''; });
        if (s >= steps.length) { clearInterval(nudoAnim); nudoAnim = null; btn.textContent = '▶ Animar paso a paso'; if (msg) msg.textContent = '✓ Nudo completo. Repítelo 3 veces sin mirar.'; return; }
        steps[s].style.background = 'rgba(232,197,106,.15)';
        if (msg) msg.textContent = 'Paso ' + (s + 1) + '/' + steps.length + ': ' + NUDOS[i].pasos[s];
        s++;
      }, 1400);
      btn.onclick = function () { if (nudoAnim) { clearInterval(nudoAnim); nudoAnim = null; btn.textContent = '▶ Animar paso a paso'; } else renderNudos(); };
    };
  });
}
function setupNudos() {
  makeDialog('nudosDialog', '🪢 Nudos, amarras y redes',
    'Biblioteca visual para pesca artesanal, kayak, camping y huerta (entutorado). Toca <b>Animar</b> y practica con una cuerda real.',
    '<div id="nudosList" style="display:flex;flex-direction:column;gap:10px"></div>');
  var b = $('btnNudos'); if (b) b.onclick = function () { renderNudos(); openDlg('nudosDialog'); };
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
   13) RUTINAS CIRCADIANAS + HORA DORADA
   ============================================================ */
function getRutina() { return store('rutinaCfg', { despierta: '07:00' }); }
function setupRutina() {
  makeDialog('rutinaDialog', '🧘 Rutinas circadianas y hora dorada',
    'Convierte tu <b>Hora Dorada</b> y <b>Circadiano</b> en un plan diario: tareas pesadas con el pico de cortisol matutino, creatividad en la tarde y descanso al atardecer.',
    '<div class="conv-row"><label>Me despierto <input type="time" id="rutHora" value="07:00"></label><button type="button" id="rutGen" class="btn btn-accent" style="width:auto;align-self:flex-end">☀️ Generar mi plan de hoy</button></div>' +
    '<div id="rutPlan" style="margin-top:10px"></div>');
  var b = $('btnRutina'); if (b) b.onclick = function () { try { $('rutHora').value = getRutina().despierta || '07:00'; } catch (e) {} openDlg('rutinaDialog'); };
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
var SUENOS_ARQ = ['🌊 Agua / mar', '🌙 Luna', '🕊️ Vuelo', '🏠 Casa / hogar', '🐾 Animal guía', '👵 Ancestro / abuela', '🌑 Sombra / noche', '☀️ Luz / amanecer', '🔥 Fuego', '🌳 Bosque / árbol'];
var SUENOS_EMO = ['calma', 'alegría', 'miedo', 'tristeza', 'rabia', 'amor', 'confusión', 'poder', 'gratitud'];
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
function renderSuenosPlus() {
  var box = $('suePlusPatrones'); if (!box) return;
  var d = getSuenos();
  if (!d.length) { box.innerHTML = '<span class="muted">Sin sueños en el diario aún. Al guardar, quedan aquí con luna y arquetipo para ver patrones.</span>'; return; }
  var arq = {};
  d.forEach(function (r) { arq[r.arq || '?'] = (arq[r.arq || '?'] || 0) + 1; });
  var topA = Object.keys(arq).sort(function (a, b) { return arq[b] - arq[a]; }).slice(0, 3).map(function (k) { return k + ' ×' + arq[k]; }).join(' · ');
  var freq = {};
  d.forEach(function (r) { (r.texto || '').toLowerCase().replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).forEach(function (w) { w = w.trim(); if (w.length >= 4 && SUENOS_STOP.indexOf(w) < 0) freq[w] = (freq[w] || 0) + 1; }); });
  var topW = Object.keys(freq).filter(function (w) { return freq[w] >= 2; }).sort(function (a, b) { return freq[b] - freq[a]; }).slice(0, 6).map(function (w) { return w + ' ×' + freq[w]; }).join(' · ') || '— (se revelan al repetirse palabras)';
  var llenas = d.filter(function (r) { var l = null; try { var m = mensLunaForKey(r.fecha); if (m) l = m.dia; } catch (e) {} return l >= 13 && l <= 16; }).length;
  box.innerHTML = '📊 <b>' + d.length + '</b> sueños · arquetipos: ' + esc(topA || '—') + '<br>🔁 Palabras que vuelven: ' + esc(topW) + '<br>🌕 En luna llena aprox: <b>' + llenas + '</b>';
  var list = $('suePlusList');
  if (list) list.innerHTML = d.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 30).map(function (r) {
    return '<div class="habit-item"><b>' + r.fecha + '</b> · ' + esc(r.arq || '') + ' · ' + esc(r.emo || '') + (r.luc ? ' · 👁️ lúcido' : '') + '<br><span class="muted" style="font-size:11px">' + esc(lunaTxt(r.fecha)) + '</span><p style="font-size:12px">' + esc((r.texto || '').slice(0, 220)) + '</p><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
  }).join('');
  if (list) list.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar sueño del diario? (la nota del día se mantiene)')) return; var dd = getSuenos(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderSuenosPlus(); }; });
}
function setupSuenos() {
  var dlg = $('dreamsDialog'); if (!dlg || !$('dreamSave')) { setTimeout(setupSuenos, 800); return; }
  addKw('btnDreams', 'arquetipo sincronicidad patron lucido luna jung sombra');
  var b = $('btnDreams');
  if (b && !b.dataset.sueWrapped) {
    b.dataset.sueWrapped = '1';
    b.addEventListener('click', function () { setTimeout(function () { try { renderSuenosPlus(); } catch (e) {} }, 60); });
  }
  var saveBtn = $('dreamSave');
  if (saveBtn && !saveBtn.dataset.suePlusWrapped) {
    saveBtn.dataset.suePlusWrapped = '1';
    saveBtn.addEventListener('click', function () {
      var txt = ($('dreamText').value || '').trim();
      if (!txt) return;
      try {
        getSuenos().push({ id: uid('su'), fecha: todayKey(), texto: clean(txt, 600), arq: $('suePlusArq') ? $('suePlusArq').value : '', emo: $('suePlusEmo') ? $('suePlusEmo').value : '', luc: $('suePlusLuc') ? $('suePlusLuc').checked : false });
        save();
        if ($('suePlusLuc')) $('suePlusLuc').checked = false;
      } catch (e) {}
      setTimeout(function () { try { renderSuenosPlus(); } catch (e) {} }, 60);
    });
  }
  if ($('suePlusArq')) { try { renderSuenosPlus(); } catch (e) {} return; }
  var form = dlg.querySelector('form') || dlg;
  var sec = document.createElement('div');
  sec.innerHTML =
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🔍 Diario de sueños y sincronicidades</h4>' +
    '<p class="muted" style="font-size:11px">Al guardar, el sueño queda en la nota del día <b>y</b> en este diario con arquetipo lunar para detectar patrones. Conecta con 🪞 Autoconocimiento (Jung) y 🌸 Ciclo.</p>' +
    '<div class="conv-row"><label>Arquetipo <select id="suePlusArq">' + SUENOS_ARQ.map(function (a) { return '<option>' + a + '</option>'; }).join('') + '</select></label><label>Emoción <select id="suePlusEmo">' + SUENOS_EMO.map(function (a) { return '<option>' + a + '</option>'; }).join('') + '</select></label><label class="check-row" style="align-self:flex-end"><input type="checkbox" id="suePlusLuc"> 👁️ lúcido</label></div>' +
    '<div id="suePlusPatrones" class="chip" style="display:block;white-space:normal;margin-top:6px"></div>' +
    '<div id="suePlusList" class="habits-list" style="margin-top:8px;max-height:240px"></div></div>';
  var closeRow = form.querySelector('.dlg-actions:last-child');
  if (closeRow) form.insertBefore(sec, closeRow); else form.appendChild(sec);
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
      try { var m = mluna(k); if (m && per[m.luna]) per[m.luna].gra++; } catch (e) {}
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
   CRIANZA INFANTIL — pedagogías vivas para acompañar
   Métodos: Montessori · Waldorf · Pedagogía 3000 · Pikler ·
   Reggio Emilia · Crianza respetuosa. Guía por edades, ambiente
   preparado y bitácora. Todo local y privado por usuario.
   Conecta con 🤱 1000 días, 📖 Cuentos y ✅ Hábitos.
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
    edad: 'Todas; clave en rabietas 1–5 años y límites 6–12.' }
];
var CRIANZA_ETAPAS = [
  { e: '0–12 meses', n: '🌱 Nido', nec: 'Brazo, pecho, sueño y calma. Vínculo seguro ante todo.',
    ofr: 'Pikler + pecho a demanda · porteo · cantos y epew · paseos diarios · misa/mesa familiar.',
    evi: 'Pantallas · andador · apurar hitos · sobre-estimular con juguetes sonoros.',
    luna: 'Un cuento por luna en 📖 Cuentos; registra hitos en 🤱 1000 días.' },
  { e: '1–3 años', n: '🐾 Explorador', nec: 'Moverse, tocarlo todo y decir ¡no! para ser alguien.',
    ofr: 'Montessori (trasvasar, vestirse solo) · juego libre en tierra y agua · rutinas visuales.',
    evi: 'Castigos y gritos · pantallas como niñera · demasiadas opciones a la vez.',
    luna: 'Rincón de calma + mesa de estación Waldorf según la luna.' },
  { e: '3–6 años', n: '🔥 Creador', nec: 'Jugar, imaginar y pertenecer. Pregunta "¿por qué?" sin fin.',
    ofr: 'Waldorf (cuentos, rondas, pan) · Reggio (proyectos, barro) · huerta propia · responsabilidades reales.',
    evi: 'Alfabetizar a la fuerza · sobre-agenda de talleres · comparar con otros niños.',
    luna: 'Proyecto de una pregunta por luna; dibuja el árbol de la luna.' },
  { e: '6–9 años', n: '🌊 Navegante', nec: 'Amigos, reglas justas y sentirse capaz.',
    ofr: 'Pedagogía 3000 (círculos, mingas) · oficios (cocinar, tejer, sembrar) · deporte y mar con cuidado.',
    evi: 'Humillar por notas · quitar el juego como castigo · pantallas sin límite.',
    luna: 'Bitácora de gratitud + un oficio nuevo por luna.' },
  { e: '9–12 años', n: '🌙 Pensador', nec: 'Opinar, decidir y encontrar su lugar en el grupo.',
    ofr: 'Proyectos con propósito (huerto, trueque, radio) · acuerdos familiares · mapuzugun e historia del territorio.',
    evi: 'Control total o abandono total · exponerlo en redes · decidir todo por él.',
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
  { k: 'a8', t: 'Cero pantallas al comer y dormir', d: 'Acuerdo familiar: mesa y pieza libres de pantalla.' }
];
var CRIANZA_AREAS = ['Juego y aprendizaje', 'Límites y emociones', 'Salud y sueño', 'Vínculo y familia', 'Escuela / jardín', 'Otro'];
function getCrianza() { var a = store('crianzaLog', []); return Array.isArray(a) ? a : []; }
function switchCriaTab(t) {
  [['Met', 'criaMetPanel'], ['Eda', 'criaEdaPanel'], ['Amb', 'criaAmbPanel'], ['Bit', 'criaBitPanel']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $('tabCria' + x[0]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
}
function renderCriaMet(f) {
  var box = $('criaMetList'); if (!box) return;
  var q = ((f === undefined ? (($('criaQ') || {}).value || '') : f) + '').toLowerCase();
  var list = CRIANZA_METODOS.filter(function (m) { return !q || (m.t + ' ' + m.aut + ' ' + m.idea + ' ' + m.princ.join(' ')).toLowerCase().indexOf(q) >= 0; });
  box.innerHTML = list.length ? list.map(function (m, i) {
    return '<details class="menstrual-card" style="margin-top:8px"' + (i === 0 && q ? ' open' : '') + '><summary style="cursor:pointer;font-size:13px"><b>' + m.icon + ' ' + esc(m.t) + '</b> <span class="muted" style="font-size:11px">· ' + esc(m.aut) + '</span></summary>' +
      '<p style="font-size:12px;margin:8px 0"><b>Idea:</b> ' + esc(m.idea) + '</p>' +
      '<p style="font-size:12px;margin:4px 0"><b>🧭 Principios</b></p><ul style="font-size:12px;margin:4px 0 4px 18px;line-height:1.6">' + m.princ.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
      '<p style="font-size:12px"><b>🏠 Ambiente:</b> ' + esc(m.amb) + '</p>' +
      '<p style="font-size:12px"><b>🧑‍🌾 Tu rol:</b> ' + esc(m.rol) + '</p>' +
      '<p style="font-size:12px"><b>🎲 Prueba hoy:</b> ' + esc(m.act) + '</p>' +
      '<p class="muted" style="font-size:11px"><b>Edades:</b> ' + esc(m.edad) + '</p></details>';
  }).join('') : '<p class="muted">Sin resultados. Prueba con "juego", "límite" o "naturaleza".</p>';
}
function renderCriaEda() {
  var box = $('criaEdaList'); if (!box) return;
  box.innerHTML = CRIANZA_ETAPAS.map(function (e) {
    return '<div class="si-card"><h4>' + esc(e.n) + ' · ' + esc(e.e) + '</h4><p><b>Necesita:</b> ' + esc(e.nec) + '<br><b>Ofrece:</b> ' + esc(e.ofr) + '<br><b>Evita:</b> ' + esc(e.evi) + '<br><span class="muted">🌙 ' + esc(e.luna) + '</span></p></div>';
  }).join('');
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
  addKw('btnCrianza', 'montessori waldorf pedagogia 3000 pikler reggio emilia disciplina positiva limites rabietas juego autonomia etapas ambiente preparado');
  makeDialog('crianzaDialog', '🧒 Crianza infantil — pedagogías vivas',
    'Seis caminos para acompañar a tus niños y niñas: <b>Montessori, Waldorf, Pedagogía 3000, Pikler, Reggio Emilia y Crianza respetuosa</b>. Mézclalos a tu manera: ningún método puro cría solo. Todo registro queda <b>privado y local</b>.',
    '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
    '<button type="button" id="tabCriaMet" class="btn btn-accent" style="width:auto">🌱 Métodos</button>' +
    '<button type="button" id="tabCriaEda" class="btn" style="width:auto">🎂 Por edad</button>' +
    '<button type="button" id="tabCriaAmb" class="btn" style="width:auto">🏠 Ambiente</button>' +
    '<button type="button" id="tabCriaBit" class="btn" style="width:auto">📓 Bitácora</button></div>' +
    '<div id="criaMetPanel"><div class="conv-row"><label style="flex:2">🔍 Buscar en métodos <input type="text" id="criaQ" placeholder="ej: juego, límites, pantallas..." autocomplete="off"></label></div><div id="criaMetList"></div></div>' +
    '<div id="criaEdaPanel" class="hidden"><p class="muted" style="font-size:11px">Cada etapa trae lo que necesita, lo que puedes ofrecer, lo que conviene evitar y un ritmo lunar.</p><div id="criaEdaList" style="display:flex;flex-direction:column;gap:8px"></div></div>' +
    '<div id="criaAmbPanel" class="hidden"><div id="criaAmbBox"></div></div>' +
    '<div id="criaBitPanel" class="hidden"><div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Nota de crianza (privada)</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="criaFecha"></label><label style="flex:2">Área <select id="criaArea">' + CRIANZA_AREAS.map(function (a) { return '<option>' + a + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Método que probé <select id="criaMetodo"><option>Ninguno aún</option><option>Montessori</option><option>Waldorf</option><option>Pedagogía 3000</option><option>Pikler</option><option>Reggio Emilia</option><option>Crianza respetuosa</option><option>Mezcla propia</option></select></label><label style="flex:2">Niño/a (opcional) <input type="text" id="criaHijo" placeholder="ej: León" maxlength="20"></label></div>' +
    '<label>Qué pasó / qué probé <textarea id="criaTexto" rows="2" placeholder="ej: probé rincón de calma en la rabieta, funcionó a los 5 min..." maxlength="400"></textarea></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="criaAdd" class="btn btn-accent" style="width:auto">+ Guardar nota</button></div></div>' +
    '<div id="criaList" class="habits-list" style="margin-top:10px;max-height:260px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="criaStats" class="muted" style="font-size:11px"></span><button type="button" id="criaShareAll" class="btn" style="width:auto">📤 Compartir resumen</button></div></div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px"><button type="button" id="criaGoCuentos" class="btn" style="width:auto">📖 Cuentos</button>' +
    '<button type="button" id="criaGoMil" class="btn" style="width:auto">🤱 1000 días</button>' +
    '<button type="button" id="criaGoHabitos" class="btn" style="width:auto">✅ Hábitos</button></div>');
  var b = $('btnCrianza');
  if (b) b.onclick = function () { if (!$('criaFecha').value) $('criaFecha').value = todayKey(); switchCriaTab('Met'); renderCrianza(); openDlg('crianzaDialog'); };
  if ($('tabCriaMet')) $('tabCriaMet').onclick = function () { switchCriaTab('Met'); };
  if ($('tabCriaEda')) $('tabCriaEda').onclick = function () { switchCriaTab('Eda'); renderCriaEda(); };
  if ($('tabCriaAmb')) $('tabCriaAmb').onclick = function () { switchCriaTab('Amb'); renderCriaAmb(); };
  if ($('tabCriaBit')) $('tabCriaBit').onclick = function () { switchCriaTab('Bit'); };
  if ($('criaQ')) $('criaQ').oninput = function () { renderCriaMet($('criaQ').value); };
  if ($('criaAdd')) $('criaAdd').onclick = function () {
    var t = clean($('criaTexto').value, 400); if (!t) return alert('Escribe la nota');
    getCrianza().push({ id: uid('cr'), fecha: $('criaFecha').value || todayKey(), area: $('criaArea').value, metodo: $('criaMetodo').value, hijo: clean($('criaHijo').value, 20), texto: t });
    save('Nota guardada 🧒'); $('criaTexto').value = ''; $('criaHijo').value = ''; renderCrianza();
  };
  if ($('criaShareAll')) $('criaShareAll').onclick = function () { var d = getCrianza(); if (!d.length) return alert('Sin notas'); share('🧒 Bitácora de crianza (resumen)', d.map(function (r) { return '· ' + r.fecha + ' — ' + r.area + ' [' + r.metodo + ']\n' + r.texto; }).join('\n\n')); };
  if ($('criaGoCuentos')) $('criaGoCuentos').onclick = function () { try { var x = $('btnTales'); if (x) x.click(); } catch (e) {} };
  if ($('criaGoMil')) $('criaGoMil').onclick = function () { try { var x = $('btnFerti'); if (x) x.click(); setTimeout(function () { try { switchFerTab('Mil'); } catch (e) {} }, 150); } catch (e2) {} };
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
