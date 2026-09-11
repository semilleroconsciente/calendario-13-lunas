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
  { id: 'btnAgua', txt: '💧 Agua · Lluvia y Estanque', kw: 'agua lluvia estanque pozo milimetros reserva litros sequia corte', grupo: 'territorio' },
  { id: 'btnBodega', txt: '🍯 La Bodega', kw: 'bodega conservas fermentos mermelada chucrut kombucha deshidratado frasco caducidad maduracion lunar', grupo: 'vida' },
  { id: 'btnNudos', txt: '🪢 Nudos y Redes', kw: 'nudos amarras redes pesca ballestrinque as de guia pescador kayak camping entutorado tejer reparar', grupo: 'herramientas' },
  { id: 'btnTaller', txt: '🔧 Bitácora Taller', kw: 'taller reparacion mantenimiento herramienta bote bicicleta aceite afilado bomba alerta luna', grupo: 'herramientas' },
  { id: 'btnTrueque', txt: '🔄 Trueque y Feria', kw: 'trueque feria local economia circular intercambio vecino feria libre penco gastos cuenta reciclaje punto limpio basura residuo botella pila aceite ropa recoleccion aseo', grupo: 'emergencia' },
  { id: 'btnMinga', txt: '🤝 Minga · Red de Apoyo', kw: 'minga red apoyo comunidad ayuda techo cosecha tormenta llamado offline bluetooth vecino', grupo: 'emergencia' },
  { id: 'btnRutina', txt: '🧘 Rutinas Circadianas', kw: 'rutina circadiano hora dorada cortisol planificador habito sueño energia creatividad descanso', grupo: 'cuerpo' },
  { id: 'btnFerti', txt: '🤰 Fertilidad Natural', kw: 'fertilidad ciclo sintotermico temperatura basal moco cervical planificacion familiar natural privado', grupo: 'cuerpo' },
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
    else g.appendChild(btn);
    added++;
  });
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push) {
      NUEVOS_BTNS.forEach(function (b) { if (ALL_BTNS.indexOf(b.id) < 0) ALL_BTNS.push(b.id); });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  return added;
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
}
function setupAgua() {
  makeDialog('aguaDialog', '💧 Gestión del Agua · lluvia y estanques',
    'Para Penco y zonas rurales con cortes o agua de pozo/lluvia. Registra milímetros y estima cuántos litros quedan.',
    '<div id="aguaResumen" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>⚙️ Mi estanque</h4><div class="conv-row"><label>Capacidad (L) <input type="number" id="aguaCap" min="0" step="50"></label><label>Nivel actual (L) <input type="number" id="aguaNivel" min="0" step="10"></label><label>Consumo día (L) <input type="number" id="aguaCons" min="0" step="5"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="aguaSave" class="btn btn-accent" style="width:auto">💾 Guardar estanque</button></div>' +
    '<p class="muted" style="font-size:10px">Tip: 1 mm de lluvia sobre 1 m² de techo ≈ 1 litro cosechable (descuenta 20% por pérdidas).</p></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌧️ Registrar lluvia</h4><div class="conv-row"><label>Fecha <input type="date" id="lluFecha"></label><label>mm <input type="number" id="lluMm" min="0" step="0.5" placeholder="ej: 12.5"></label><label>m² techo (opcional) <input type="number" id="lluTecho" min="0" step="1" placeholder="40"></label></div>' +
    '<label>Nota <input type="text" id="lluNota" placeholder="temporal sur, granizo..." maxlength="60"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="lluAdd" class="btn btn-accent" style="width:auto">+ Guardar lluvia</button></div>' +
    '<div id="lluviaList" class="habits-list" style="margin-top:10px;max-height:220px"></div></div>');
  var b = $('btnAgua'); if (b) b.onclick = function () { var c = getAguaCfg(); $('aguaCap').value = c.cap; $('aguaNivel').value = c.nivel; $('aguaCons').value = c.consumo; if (!$('lluFecha').value) $('lluFecha').value = todayKey(); renderAgua(); openDlg('aguaDialog'); };
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
   14) FERTILIDAD SINTOTERMICA (privada)
   ============================================================ */
function getFerti() { var a = store('fertiLog', []); return Array.isArray(a) ? a : []; }
function renderFerti() {
  var box = $('fertiList'); if (!box) return;
  var data = getFerti();
  if (!data.length) { box.innerHTML = '<p class="muted">Sin registros. Todo queda solo en este dispositivo.</p>'; $('fertiInfo').innerHTML = ''; return; }
  var s = data.slice().sort(function (a, b) { return a.fecha.localeCompare(b.fecha); });
  var ult = s[s.length - 1];
  var pico = null;
  for (var i = s.length - 1; i >= 0; i--) { if (s[i].moco === 'clara elástica') { pico = s[i]; break; } }
  var info = '📅 Último registro: <b>' + ult.fecha + '</b> · temp ' + (ult.temp || '—') + '°C · moco: ' + (ult.moco || '—');
  if (pico) info += '<br>💧 Pico de moco fértil: <b>' + pico.fecha + '</b> → ventana fértil aprox pico ±5 días (referencial).';
  info += '<br><span class="muted">Confirma con 3 temps altas seguidas + pico de moco. No es método anticonceptivo seguro por sí solo: fórmate con profesional/matrona.</span>';
  $('fertiInfo').innerHTML = info;
  box.innerHTML = s.slice().reverse().slice(0, 40).map(function (r) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + r.fecha + '</b> · 🌡️ ' + esc(r.temp || '—') + '°C · 💧 ' + esc(r.moco || '—') + '<br><span class="muted" style="font-size:11px">🤍 cérvix: ' + esc(r.cervix || '—') + (r.rel ? ' · 💞 relaciones' : '') + (r.nota ? ' · ' + esc(r.nota) : '') + '</span></span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar registro íntimo?')) return; var d = getFerti(); var i = d.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d.splice(i, 1); save(); renderFerti(); }; });
}
function setupFerti() {
  makeDialog('fertiDialog', '🤰 Fertilidad y planificación familiar natural',
    '<b>Privado y local:</b> nada sale de este dispositivo. Método sintotérmico: temperatura basal + moco cervical (+ cérvix opcional). <b>Educativo, no médico.</b>',
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Registro diario (al despertar, antes de levantarte)</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="ferFecha"></label><label>Temp basal °C <input type="number" id="ferTemp" min="35" max="38" step="0.05" placeholder="36.60"></label></div>' +
    '<div class="conv-row"><label>Moco cervical <select id="ferMoco"><option value="">—</option><option>seca</option><option>pegajosa</option><option>cremosa</option><option>clara elástica</option><option>sangrado</option></select></label><label>Cérvix <select id="ferCerv"><option value="">—</option><option>bajo/duro/cerrado</option><option>alto/blando/abierto</option></select></label><label class="check-row" style="align-self:flex-end"><input type="checkbox" id="ferRel"> 💞 relaciones</label></div>' +
    '<label>Notas <input type="text" id="ferNota" placeholder="enferma, trasnoche, alcohol..." maxlength="60"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="ferAdd" class="btn btn-accent" style="width:auto">+ Guardar</button></div></div>' +
    '<div id="fertiInfo" class="chip" style="display:block;white-space:normal;margin-top:10px"></div>' +
    '<div id="fertiList" class="habits-list" style="margin-top:10px;max-height:260px"></div>');
  var b = $('btnFerti'); if (b) b.onclick = function () { if (!$('ferFecha').value) $('ferFecha').value = todayKey(); renderFerti(); openDlg('fertiDialog'); };
  $('ferAdd').onclick = function () {
    var f = $('ferFecha').value || todayKey();
    var d = getFerti().filter(function (x) { return x.fecha !== f; });
    d.push({ id: uid('fe'), fecha: f, temp: $('ferTemp').value, moco: $('ferMoco').value, cervix: $('ferCerv').value, rel: $('ferRel').checked, nota: clean($('ferNota').value, 60) });
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

/* ---------- init ---------- */
var _initTries = 0;
function init() {
  _initTries++;
  if (!document.querySelector('.action-group[data-group]')) { if (_initTries < 40) setTimeout(init, 500); return; }
  try { injectButtons(); } catch (e) {}
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
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 800); });
else setTimeout(init, 800);
setTimeout(init, 2500);

})();
