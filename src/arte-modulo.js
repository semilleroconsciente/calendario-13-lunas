/* ============================================================
   ARTE — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa dentro de Aprender, Crear y Jugar:
   nueva sub-sección data-sub="arte" (🎨 Arte y creación visual).

   Botones (grupo aprender, sub arte):
     btnArte .......... 🎨 Aprende Arte (guía universal + plan 28 días)
     btnDibujo ........ ✏️ Dibujo (lápiz, ver, sombrear, retrato)
     btnPintura ....... 🖌️ Pintura (acuarela, témpera, acrílico)
     btnFoto .......... 📸 Fotografía (celular, luz, composición)
     btnManualidades .. ✂️ Manualidades (collage, fanzine, reciclaje)

   Cada botón abre su propio diálogo con 5 pestañas:
     1) 🌱 Aprende (pasos progresivos)
     2) 🧰 Técnicas / fundamentos
     3) 🎯 Proyectos (ideas por nivel + Penco)
     4) 🌙 Ritmo lunar + cuidado (materiales baratos, seguridad)
     5) 📓 Bitácora (privada por usuario)

   Datos local y privado por usuario: userData().arte { logs:[] }
   Cada log: { id, fecha, area, que, min, foto, nota }
   100% offline. Sin dependencias. Enfoque: crear con lo que hay,
   mirar el territorio y compartir en feria/minga, sin comparar.
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
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { logs: [] };
    if (!u.arte) u.arte = { logs: [] };
    if (!Array.isArray(u.arte.logs)) u.arte.logs = [];
    return u.arte;
  } catch (e2) { return { logs: [] }; }
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

/* ---------------- DATOS ---------------- */
var ARTE_PASOS = [
  { n: 'Paso 1 · Mirar 5 minutos (días 1–4)', ico: '👀', para: 'Quien dice “no sé dibujar”: el arte entra por los ojos, no por la mano.', mat: 'Lápiz + cualquier papel + 1 objeto de la casa.', como: 'Elige 1 objeto (taza, cochayuyo, hoja de boldo). Míralo 5 min sin dibujar: ¿qué forma grande es? ¿dónde hay luz y sombra? Recién después, dibuja el contorno en 3 min. Sin borrar.', nota: 'Dibuja lo que ves, no lo que crees: una taza de lado no es un óvalo perfecto.', cuidado: 'Sin compararte con redes: tu primera meta es terminar, no que quede “lindo”.' },
  { n: 'Paso 2 · Formas grandes + garabato suelto (días 5–10)', ico: '⭕', para: 'Soltar la muñeca y perder el miedo a la hoja en blanco.', mat: 'Los mismos + goma.', como: 'Todo se arma con 4 formas: círculo, óvalo, rectángulo y triángulo. Practica planas de cada una 3 min. Después arma un pelícano o una casa con esas 4 formas. Calienta siempre 2 min de garabatos sueltos.', nota: 'Hoja cara bloquea: parte en cuaderno barato, diario viejo o reverso de guías.', cuidado: 'Hombro arriba = raya tiesa. Suelta hombro, respira, raya desde el codo.' },
  { n: 'Paso 3 · Luz y sombra (días 11–16)', ico: '🌗', para: 'Que el dibujo tenga volumen con solo el lápiz.', mat: 'Lápiz B o 2B (o el más blando que tengas) + difumino (algodón/cotonito).', como: 'Escala de 5 grises en una tira. Esfera: luz → medio → sombra → reflejo. Aplica a 1 fruta y 1 piedra de la playa. Sombrea en una sola dirección.', nota: 'La sombra no es negra pareja: deja siempre un punto de luz.', cuidado: 'No aplastes el lápiz al inicio: capas suaves se corrigen, surcos no.' },
  { n: 'Paso 4 · Color con lo que hay (días 17–22)', ico: '🎨', para: 'Entender el color sin comprar set caro.', mat: 'Témpera escolar o lápices de colores + 1 pincel + vaso de agua.', como: 'Rueda básica: primarios (rojo-amarillo-azul) → secundarios (naranja-verde-morado). Mezcla cada secundario tú. Pinta 1 atardecer de la bahía con solo 3 colores + blanco.', nota: '“No tengo materiales” no frena: témpera escolar bien cuidada rinde meses.', cuidado: 'Lava el pincel al tiro y no lo dejes en el agua: se abre y muere.' },
  { n: 'Paso 5 · Tu primera serie (días 23–28)', ico: '🖼️', para: 'Cerrar el plan con algo mostrable: 3 piezas, 1 tema.', mat: 'Lo que elegiste + cartón para enmarcar.', como: 'Elige 1 tema penqueño: “ventanas de Lirquén”, “3 aves del humedal”, “mi familia en objetos”. Haz 3 piezas chicas (máx 15×15 cm). Firma, fecha y guárdalas juntas: eso ya es una serie.', nota: 'Muestra a 1 persona de confianza y anota qué te dijo: la obra crece cuando circula.', cuidado: 'Foto con luz de día antes de regalar: tu bitácora guarda el avance.' }
];

var ARTE_FUND = [
  { n: 'Mirar: encuadre y proporción', ico: '🖼️', txt: 'Marco con las manos (pulgar + índice en L) para encuadrar. Mide con el lápiz estirado: ¿cuántas “cabezas” cabe el cuerpo? ¿el cerro es 2 o 3 veces la casa? Dibuja primero las relaciones, después los detalles. Quien mide bien, se parece sin “talento”.' },
  { n: 'Línea: 3 calidades', ico: '✏️', txt: 'Línea de construcción (suave, se borra), línea de contorno (firme, define) y línea de gesto (rápida, da vida). Practica las 3 en la misma hoja: construye suave, define firme, suelta 1 gesto al final. Todo dibujo usa las 3.' },
  { n: 'Valor: 5 tonos mandan', ico: '🌗', txt: 'Blanco papel, luz, medio, sombra, negro acento. Si tu dibujo no se lee en 5 grises, el color no lo salva. Haz la prueba: saca foto y ponla en blanco y negro. ¿Se entiende? Listo.' },
  { n: 'Color: poco y mezclado', ico: '🎨', txt: 'Paleta mínima que lo hace todo: rojo cálido + amarillo + azul + blanco (+ negro solo para oscurecer pizca). Mezcla en plato blanco o tapa. Anota tus mezclas (“cielo Penco = azul + pizca blanco + gota verde”): repetir un color es oficio.' },
  { n: 'Composición: regla de tercios', ico: '📐', txt: 'Divide en 3×3 mental. Pon el horizonte en el tercio de arriba o abajo (nunca al medio) y el motivo en un cruce. Deja “aire” hacia donde mira el motivo. Con eso, una foto o dibujo simple ya se ve profesional.' },
  { n: 'Bodegón penqueño (naturaleza + objeto)', ico: '🐚', txt: 'Cochayuyo + lapa + paño a cuadros: estudia texturas (rugoso, liso, tela). Fondo simple (cartulina o pared). Luz de ventana lateral: modela sin lámpara cara.' }
];

var ARTE_PROY = [
  { n: 'Nivel 🌱 · Bitácora visual (1 por semana)', ico: '🌱', para: 'Hábito sin presión: 20 min.', mat: 'Cuaderno barato + lápiz.', como: '1 página por semana: arriba fecha + luna, dibujo chico + 2 líneas (“qué vi / qué me costó”). En 1 luna tienes 4 páginas: tu avance visible.', nota: 'La bitácora de la app calza aquí: anota fecha, minutos y qué hiciste.' },
  { n: 'Nivel 🌿 · Postal de Penco (regalo)', ico: '💌', para: 'Pieza terminable en 1 tarde.', mat: 'Cartón 10×15 + témpera o colores.', como: 'Dibuja/pinta 1 postal: faro, lancha, boldo o tu calle. Atrás escribe fecha y a quién va. Regálala o pégala en la feria/trueque.', nota: 'Formato chico termina: evita el cuadro gigante que queda a medias.' },
  { n: 'Nivel 🌳 · Serie de 3 + muestra familiar', ico: '🖼️', para: 'Proyecto de 1 luna.', mat: '3 soportes iguales + marco de cartón.', como: 'Tema único (ej: “3 lunas sobre la bahía”). Misma paleta en las 3. Muestra en casa 1 tarde: cuelga con washis, invita 3 personas, pide 1 comentario escrito por obra.', nota: 'Serie = tema + tamaño + paleta común. Eso la hace ver profesional.' },
  { n: 'En familia y con niños', ico: '🧒', para: 'Crear juntos sin pelear por el “bien/mal”.', mat: 'Papel grande + témperas lavables + delantales.', como: 'Mural colectivo: cada uno pinta su parte sin pasar la línea del otro. Turnos de 10 min + música. Se firma entre todos. Foto final a la bitácora.', nota: 'Con niños: proceso manda (manchar, mezclar), no el resultado. Elogia 1 decisión (“buena mezcla ese verde”).' },
  { n: 'Llevar a feria / trueque', ico: '🔄', para: 'Que el arte circule en Penco.', mat: '3–5 piezas chicas + precio trueque claro.', como: 'Postales, stickers dibujados o copias foto. Precio simple (“2 postales x 1 mermelada” o aporte voluntario). Lleva bitácora de qué se fue y a quién: es tu primera estadística.', nota: 'Protege con bolsita o cartón: la presentación vende la mitad.' }
];

var ARTE_LUNA = [
  { n: 'Ritmo lunar (20 min que sí caben)', ico: '🌙', txt: 'Nueva: bocetos y pruebas (permiso para errar). Creciente: sube minutos y termina 1 pieza. Llena: muestra (foto con luz de día, pide 1 opinión). Menguante: ordena, limpia pinceles, bota agua sucia fuera del lavaplatos si tiene acrílico, revisa bitácora. 20 min × 4 veces/semana > 3 h un domingo.' },
  { n: 'Materiales baratos que rinden', ico: '💰', txt: 'Lápiz 2B + goma + cuaderno barato para dibujo. Témpera escolar + 2 pinceles (plano + redondo) + mezclador blanco para pintura. Celular que ya tienes para foto. Diario, cartón y envases para manualidades. Compra 1 cosa por luna, no todo junto: primero agota lo que tienes.' },
  { n: 'Cuidado y seguridad', ico: '🛟', txt: 'Ventila si usas esmalte, aerosol o pegamento fuerte (patio, no pieza cerrada). Nada de solventes con niños: solo base agua. Cúter siempre con regla metálica y corte hacia afuera; niños solo tijera punta roma. Lávalo todo al terminar: pincel parado con el pelo arriba. Guarda fotos de menores solo con permiso para mostrarlas.' },
  { n: 'Lugares de Penco para crear y mirar', ico: '🗺️', txt: 'Borde costero (luz de mañana, poco viento), humedal Rocuant (aves quietas para dibujar), Biblioteca Penco (mesas grandes y silencio), sede o multicancha techada en invierno. Lleva bolsa para tu basura + paño: dejar limpio también es arte comunitario.' }
];

var DIBUJO_PASOS = [
  { n: 'Paso 1 · Calienta la mano (1ª semana)', ico: '🤸', para: 'Raya suelta antes de “dibujar bien”.', mat: 'Lápiz + 5 hojas baratas.', como: 'Planás 5 min: líneas rectas, círculos, ondas, espirales. Después contornos ciegos (mira el objeto, no la hoja) 3 min. Termina con 1 objeto simple sin borrar.', nota: 'Sin goma esta semana: el error también dibuja.' },
  { n: 'Paso 2 · Encaja con formas (2ª semana)', ico: '📦', para: 'Que “se parezca” sin sufrir.', mat: 'Los mismos + regla.', como: 'Encaja todo en caja: alto vs ancho con el lápiz. Dibuja la caja, mete las 4 formas dentro, recién detalla. Practica con zapatilla, tetera y mano propia.', nota: 'Si no cabe en la caja, no cabe en la hoja: achica antes de detallar.' },
  { n: 'Paso 3 · Sombra que da volumen (3ª semana)', ico: '🌗', para: 'Del contorno plano al objeto real.', mat: 'Lápiz blando + cotonito.', como: 'Esfera + cubo + cilindro en 5 tonos. Después 1 piedra y 1 plátano. Luz siempre del mismo lado en toda la hoja.', nota: 'Difumina poco: mejor capas cruzadas (trama) que mancha.' },
  { n: 'Paso 4 · Manos, caras y cuerpo (4ª semana)', ico: '🖐️', para: 'Lo que más cuesta, por partes.', mat: 'Espejo + fotos propias.', como: 'Manos: 4 poses de tu mano no dominante. Cara: óvalo + línea ojos al medio + tercios (frente/nariz/mentón). Cuerpo: monito de palitos con articulaciones antes del músculo.', nota: 'Autorretrato 1 vez por luna: es tu regla de avance.' }
];
var DIBUJO_FUND = [
  { n: 'Proporción con el lápiz', ico: '📏', txt: 'Brazo estirado, lápiz vertical: mide el alto del modelo con el pulgar y compáralo con el ancho. Traslada esa razón a la hoja. 2 min de medir ahorran 20 de borrar.' },
  { n: 'Trama y difuminado', ico: '✏️', txt: 'Trama: líneas paralelas → cruzadas → más capas = más oscuro. Difuminado: cotonito solo al final y poco. Papel con diente (rugoso) agarra mejor el grafito que el papel liso de impresora.' },
  { n: 'Perspectiva de 1 punto (calle de Penco)', ico: '🛤️', txt: 'Horizonte a la altura de tus ojos + 1 punto de fuga. Todo lo que se aleja va a ese punto. Dibuja tu cuadra así una vez: verás por qué las casas “se caen” cuando no fugan.' },
  { n: 'Errores que frenan', ico: '⚠️', txt: '1) Detallar antes de encajar. 2) Borrar a cada rato (mancha). 3) Dibujar de foto enana del celu: amplía o imprime. 4) Solo copiar anime/manga sin observar real: alterna 1 copia + 1 del natural.' }
];

var PINTURA_PASOS = [
  { n: 'Paso 1 · Acuarela: agua manda (semana 1)', ico: '💧', para: 'Transparencia sin frustrarse.', mat: 'Acuarela escolar + pincel redondo + papel grueso.', como: 'Carta de mojado: seco, húmedo, mojado. Lava del claro al oscuro (lo blanco es el papel). 3 manchas de cielo + 1 bote simple.', nota: 'Menos agua = más control. Seca entre capas o se hace barro.' },
  { n: 'Paso 2 · Témpera: cubre y corrige (semana 2)', ico: '🍯', para: 'Color plano y alegre.', mat: 'Témpera + pincel plano + cartón.', como: 'Fondo → formas grandes → detalles. Si te equivocas, deja secar y pinta encima. Practica degradado (color + blanco paso a paso).', nota: 'Témpera revive con agua aunque se seque: no la botes.' },
  { n: 'Paso 3 · Acrílico: capas y textura (semana 3)', ico: '🧱', para: 'Cuadro que dura.', mat: 'Acrílico + espátula o cartón + bastidor o trupán.', como: 'Fondo oscuro o claro parejo → bloqueo de masas → luces al final. Textura con esponja/cartón para roqueríos. Barniza solo cuando esté bien seco.', nota: 'Acrílico seca en minutos: mezcla poco y cierra los potes.' },
  { n: 'Paso 4 · Tu paleta Penco (semana 4)', ico: '🌊', para: 'Colores de aquí, repetibles.', mat: 'Cuaderno de mezclas.', como: 'Anota 5 mezclas: mar invierno, mar verano, cielo sur, boldo, madera lancha. Pinta el mismo motivo en acuarela y témpera y compara.', nota: 'Paleta anotada = estilo propio en 3 lunas.' }
];
var PINTURA_FUND = [
  { n: 'Círculo cromático en 10 min', ico: '🎡', txt: 'Primarios en triángulo, secundarios entre ellos, tierra (sombra tostada + azul) para grises. Con eso pintas todo Penco sin comprar 24 colores.' },
  { n: 'Soportes que no se curvan', ico: '🪵', txt: 'Papel fino se ondula con agua: pégalo con cinta por los 4 bordes a una tabla. Cartón + 1 mano de cola fría con blanco sirve de bastidor barato. Prueba siempre atrás.' },
  { n: 'Pinceles: 2 bastan', ico: '🖌️', txt: 'Plano para fondos y redondo para detalle. Lava con jabón neutro, enjuaga, forma la punta con los dedos y seca horizontal. Pincel parado con el pelo abajo se abre.' },
  { n: 'Limpieza sin tapar cañerías', ico: '🚰', txt: 'Acuarela/témpera: agua al lavaplatos sin drama. Acrílico: deja decantar el agua sucia en balde, bota el sedimento a la basura (no al desagüe) y el agua clara al patio. Cuida el humedal.' }
];

var FOTO_PASOS = [
  { n: 'Paso 1 · Limpia y encuadra (días 1–7)', ico: '🧼', para: 'El 80% de la “mala foto” es lente sucio y fondo desordenado.', mat: 'Celular + paño.', como: 'Limpia el lente. Activa la cuadrícula (tercios). 10 fotos del mismo rincón cambiando el ángulo (arriba, abajo, cerca, lejos). Quédate con 1 y borra el resto.', nota: 'Fondo simple gana: 2 pasos al lado cambian todo.' },
  { n: 'Paso 2 · Luz: hora y ventana (días 8–14)', ico: '☀️', para: 'Luz linda sin pagar nada.', mat: 'Solo el celu.', como: 'Foto la misma lancha a las 9, 13 y 19 h: compara. Retrato siempre con ventana al lado (no detrás). De noche: apoya el celu (no pulso) y usa temporizador.', nota: 'Hora dorada penqueña (ver 📸 Hora Dorada): sombras largas y mar dorado.' },
  { n: 'Paso 3 · Cuenta algo en 3 fotos (días 15–21)', ico: '📖', para: 'De foto suelta a historia.', mat: 'Celular + libreta.', como: 'Serie de 3: plano general (dónde) + medio (quién/cómo) + detalle (qué). Ej: caleta → manos encarnando → anzuelo. Titula la serie en 5 palabras.', nota: '3 fotos buenas > 50 repetidas. Edita borrando.' },
  { n: 'Paso 4 · Edita poco y muestra (días 22–28)', ico: '✨', para: 'Revelado honesto en el mismo celu.', mat: 'Editor del celu (sin app nueva).', como: 'Solo: enderezar + recortar + luz/sombra suave + 1 filtro leve igual para toda la serie. Exporta y muestra en familia o feria. Pide permiso si hay caras.', nota: 'Si se nota el filtro, te pasaste: baja a la mitad.' }
];
var FOTO_FUND = [
  { n: 'Composición en 4 ideas', ico: '📐', txt: 'Tercios + líneas que llevan (muelle, ola, camino) + marco natural (ventana, ramas) + fondo limpio. Una sola por foto: si aplicas las 4, saturas.' },
  { n: 'Retrato que no incomoda', ico: '🙂', txt: 'Pide permiso, explica para qué es, muestra el resultado. Niños: permiso del adulto + sin datos (escuela, dirección). Mejor luz: sombra suave (bajo techo mirando afuera) que sol directo que achina los ojos.' },
  { n: 'Paisaje y mar sin “plano”', ico: '🌊', txt: 'Primer plano (roca, bote) + medio (ola, muelle) + fondo (cerro, cielo). Sin primer plano el mar se ve vacío. Marea baja da texturas; atardecer da color: revisa 🌊 Mareas antes de salir.' },
  { n: 'Respaldo y orden', ico: '💾', txt: 'Carpeta por luna (2026-Luna03-arte). Nombra: fecha-tema (2026-11-02-muelle.jpg). 1 copia en otro lado 1 vez por luna (ver 💾 Respaldo). Borra duplicadas el mismo día: el orden es parte del oficio.' }
];

var MANU_PASOS = [
  { n: 'Paso 1 · Collage con revistas (semana 1)', ico: '📰', para: 'Crear sin “saber dibujar”.', mat: 'Revistas/diarios + tijera + cola fría + cartón.', como: 'Tema + paleta (ej: “mar en azules”). Recorta 20 piezas, ordena sin pegar, pega de atrás hacia adelante. Sella con cola aguada encima.', nota: 'Corta más de lo que pegas: seleccionar es el arte.' },
  { n: 'Paso 2 · Fanzine de 1 hoja (semana 2)', ico: '📄', para: 'Tu mini-revista fotocopiable.', mat: '1 hoja oficio + lápiz + tijera.', como: 'Dobla en 8, corta el centro, dobla en librito (hay tutoriales sin internet: prueba 2 veces). 8 páginas: portada, 3 dibujos, 1 poema, 1 dato Penco, contraportada. Fotocopia 5 y regala.', nota: 'Fanzine feo y terminado > perfecto eterno.' },
  { n: 'Paso 3 · Reciclaje útil (semana 3)', ico: '♻️', para: 'Del desecho al objeto.', mat: 'Envases, ropa vieja, pallets/cartón.', como: 'Elige 1: macetero de bidón, bolsa de polera sin coser, portalápices de latas, marco de cartón. Lija/corta seguro, pinta y usa 1 semana antes de regalar.', nota: 'Que se use: lo útil se conserva, lo solo-lindo se bota.' },
  { n: 'Paso 4 · Regalo y feria (semana 4)', ico: '🎁', para: 'Cerrar regalando o trocando.', mat: 'Tus 3 piezas + tarjeta firmada.', como: 'Arma 3 regalos con tarjeta (quién lo hizo, materiales, fecha). Lleva 1 a trueque/feria con precio claro. Anota qué se fue: es tu catálogo.', nota: 'Foto con luz de día + medidas anotadas: la próxima feria es más fácil.' }
];
var MANU_FUND = [
  { n: 'Corte y pegado que dura', ico: '✂️', txt: 'Tijera afilada para papel/tela fina; cúter + regla metálica solo adultos para cartón. Cola fría en capa fina en ambas caras; cinta de papel para sujetar mientras seca. Prensa con libros 1 noche: plano para siempre.' },
  { n: 'Letras a mano (lettering base)', ico: '✍️', txt: 'Lápiz primero, plumón después. Palos parejos + curvas suaves; guía con 2 líneas. 1 estilo por pieza (no mezcles 4). Para feria: título grande + precio legible a 2 m.' },
  { n: 'Telas y bordado simple', ico: '🧵', txt: 'Punto atrás + punto relleno bastan para personalizar. Hilo encerado o lana fina, aguja gruesa, bastidor o tapa. Remata por detrás con nudo doble: lo que se lava se debe rematar.' },
  { n: 'Seguridad en casa', ico: '🛟', txt: 'Cúter/pistola caliente solo adultos; niños tijera punta roma + cola fría. Ventila con aerosol/esmalte. Guarda botones/piezas chicas lejos de menores de 3. Limpia recortes al tiro: el orden evita accidentes.' }
];

/* Catálogo de secciones (5 botones/diálogos) */
var SECCIONES = [
  { id: 'btnArte', label: '🎨 Aprende Arte', dlg: 'arteDialog', area: 'arte',
    titulo: '🎨 Aprende Arte — mira, mezcla y termina',
    sub: 'Guía universal de <b>🎨 Arte y creación visual</b> en <b>🧠 Aprender, Crear y Jugar</b>: mirar, formas, luz/sombra, color y tu primera serie en 28 días. Todo <b>privado y local</b>, 100% offline.',
    tabs: [
      { id: 'Aprende', label: '🌱 Aprende (28 días)', cards: ARTE_PASOS },
      { id: 'Fund', label: '🧰 Fundamentos', soloTxt: ARTE_FUND },
      { id: 'Proy', label: '🎯 Proyectos', cards: ARTE_PROY },
      { id: 'Luna', label: '🌙 Ritmo + cuidado', soloTxt: ARTE_LUNA }
    ] },
  { id: 'btnDibujo', label: '✏️ Dibujo', dlg: 'dibujoDialog', area: 'dibujo',
    titulo: '✏️ Dibujo — del garabato al parecido',
    sub: 'Sección completa de dibujo: calienta, encaja, sombrea y retrata con lápiz y papel barato. Todo <b>privado y local</b>.',
    tabs: [
      { id: 'Aprende', label: '🌱 Aprende (4 semanas)', cards: DIBUJO_PASOS },
      { id: 'Fund', label: '🧰 Técnicas', soloTxt: DIBUJO_FUND },
      { id: 'Proy', label: '🎯 Proyectos', cards: [
        { n: 'Reto 7 días · 1 objeto diario', ico: '📦', para: 'Constancia sin agobio.', mat: 'Cuaderno + lápiz.', como: 'Mismo horario 15 min: taza, llave, zapato, mano, ventana, planta, autorretrato. Sin borrar la semana 1.', nota: 'Al día 7 compara el 1 con el 7: ahí está tu curso.' },
        { n: 'Cuadra en 1 punto de fuga', ico: '🛤️', para: 'Perspectiva real.', mat: 'Regla + lápiz.', como: 'Dibuja tu calle con horizonte + punto de fuga. Agrega 3 casas, 1 poste y 1 persona. Tinta encima lo que fugue bien.', nota: 'Foto del antes/después a la bitácora.' },
        { n: 'Retrato a alguien que quieres', ico: '🙂', para: 'Regalo que se guarda.', mat: 'Papel mejorcito + 2B.', como: '3 sesiones de 20 min con foto grande y buena luz. Tercios de cara + sombra suave. Enmarca en cartón y regala.', nota: 'Pide permiso para mostrarlo fuera de casa.' }
      ] },
      { id: 'Luna', label: '🌙 Ritmo + cuidado', soloTxt: [
        { n: 'Ritmo lunar', ico: '🌙', txt: 'Nueva: garabato y encaje (errar barato). Creciente: 1 dibujo terminado. Llena: muestra y pide 1 opinión. Menguante: ordena, afila, revisa bitácora. 15–20 min por sesión.' },
        { n: 'Cuida tus manos y ojos', ico: '🖐️', txt: 'Pausa cada 25 min (mira lejos 20 seg, suelta hombros). Luz lateral, no de frente ni de espalda. Si duele la muñeca, lápiz más grueso y menos presión.' }
      ] }
    ] },
  { id: 'btnPintura', label: '🖌️ Pintura', dlg: 'pinturaDialog', area: 'pintura',
    titulo: '🖌️ Pintura — agua, tierra y color',
    sub: 'Acuarela, témpera y acrílico con materiales baratos y paleta penqueña. Todo <b>privado y local</b>.',
    tabs: [
      { id: 'Aprende', label: '🌱 Aprende (4 semanas)', cards: PINTURA_PASOS },
      { id: 'Fund', label: '🧰 Técnicas', soloTxt: PINTURA_FUND },
      { id: 'Proy', label: '🎯 Proyectos', cards: [
        { n: 'Mismo muelle en 3 técnicas', ico: '⛵', para: 'Comparar para elegir tu técnica.', mat: 'Acuarela + témpera + acrílico.', como: 'Pinta el mismo motivo 3 veces (1 por técnica, 20×15 cm). Monta las 3 juntas y anota cuál te rindió y por qué.', nota: 'Tríptico ideal para feria: se vende junto.' },
        { n: 'Cielo Penco × 7 días', ico: '🌅', para: 'Serie corta de color.', mat: 'Cuaderno o cartones chicos.', como: 'Mismo encuadre 7 días a la misma hora. Solo manchas de color, sin detalle. Al final elige 3 y enmárcalas.', nota: 'Revisa 📸 Hora Dorada para la luz.' },
        { n: 'Mural familiar o de sede', ico: '🧱', para: 'Pintar grande y juntos.', mat: 'Látex + témpera + brochas (pide permiso del muro).', como: 'Boceto en papel → cuadrícula al muro → fondo colectivo → detalles por turnos. Foto del proceso a la bitácora.', nota: 'Pide permiso escrito si es sede o vecino: el mural queda años.' }
      ] },
      { id: 'Luna', label: '🌙 Ritmo + cuidado', soloTxt: [
        { n: 'Ritmo lunar', ico: '🌙', txt: 'Nueva: pruebas y mezclas. Creciente: avanza el cuadro. Llena: barniza/muestra con luz de día. Menguante: lava todo, decanta aguas de acrílico, ordena.' },
        { n: 'Sin intoxicarse ni tapar caños', ico: '🚰', txt: 'Solo base agua con niños. Aerosol/esmalte solo adultos y al aire. Agua de acrílico se decanta (sedimento a la basura, no al lavaplatos).' }
      ] }
    ] },
  { id: 'btnFoto', label: '📸 Fotografía', dlg: 'fotoDialog', area: 'foto',
    titulo: '📸 Fotografía — cuenta Penco en 3 fotos',
    sub: 'Fotografía con el celular que ya tienes: luz, composición, serie y edición mínima. Todo <b>privado y local</b>.',
    tabs: [
      { id: 'Aprende', label: '🌱 Aprende (28 días)', cards: FOTO_PASOS },
      { id: 'Fund', label: '🧰 Fundamentos', soloTxt: FOTO_FUND },
      { id: 'Proy', label: '🎯 Proyectos', cards: [
        { n: 'Serie “Mi cuadra” (9 fotos)', ico: '🏘️', para: 'Retrato del barrio.', mat: 'Celular.', como: '3 generales + 3 medios + 3 detalles de tu cuadra. Elige 9, mismo recorte, titula en 5 palabras. Muestra en casa.', nota: 'Pide permiso para caras y patios.' },
        { n: 'Calendario lunar (4 fotos)', ico: '🌙', para: 'La luna manda también en foto.', mat: 'Celular + trípode improvisado.', como: '1 foto por fase (nueva, creciente, llena, menguante) del mismo lugar. Misma hora, apoya el celu. Compara luz.', nota: 'Revisa 🔭 Astro para la hora de salida.' },
        { n: 'Postal para feria (3 fotos)', ico: '💌', para: 'Fotos que se venden o regalan.', mat: 'Celular + cartón.', como: 'Elige 3, edita igual, imprime o copia en pendrive/librería. Monta en cartón con título + fecha. Precio o trueque claro.', nota: 'Sin filtros fuertes: lo natural se vende más.' }
      ] },
      { id: 'Luna', label: '🌙 Ritmo + cuidado', soloTxt: [
        { n: 'Ritmo lunar', ico: '🌙', txt: 'Nueva: borra y ordena (carrete liviano). Creciente: sale a buscar luz. Llena: serie nocturna con apoyo. Menguante: respalda 1 vez (ver 💾 Respaldo) y elige 3 favoritas.' },
        { n: 'Respeto y permiso', ico: '🤝', txt: 'Caras, niños, casas y ferias: pregunta antes. Muestra después. Si alguien dice no, se borra sin discutir. Eso también es oficio.' }
      ] }
    ] },
  { id: 'btnManualidades', label: '✂️ Manualidades', dlg: 'manualidadesDialog', area: 'manualidades',
    titulo: '✂️ Manualidades — collage, fanzine y reciclaje',
    sub: 'Manualidades útiles con lo que hay: collage, fanzine, reciclaje y regalos para feria. Todo <b>privado y local</b>.',
    tabs: [
      { id: 'Aprende', label: '🌱 Aprende (4 semanas)', cards: MANU_PASOS },
      { id: 'Fund', label: '🧰 Técnicas', soloTxt: MANU_FUND },
      { id: 'Proy', label: '🎯 Proyectos', cards: [
        { n: 'Caja de regalo penqueña (3 piezas)', ico: '🎁', para: 'Regalo completo hecho a mano.', mat: 'Cartón + collage + 1 útil.', como: 'Postal + fanzine o marcador + objeto útil (macetero, bolsa). Envuelve en diario intervenido. Tarjeta firmada.', nota: 'Regalo hecho > comprado para cumpleaños (ver 🎂 Cumpleaños).' },
        { n: 'Fanzine del barrio (8 páginas)', ico: '📄', para: 'Contar Penco en papel.', mat: 'Hojas + lápices + fotocopias.', como: 'Portada + mapa dibujado + 1 receta + 1 historia de vecino (con permiso) + avisos + contraportada. Tira 10 copias para trueque.', nota: 'Fecha y nº de edición: el nº2 es más fácil.' },
        { n: 'Puesto de feria (5 piezas)', ico: '🔄', para: 'Probar vender/trocar.', mat: '5 piezas chicas + cartel precio.', como: '5 piezas mismo estilo, precio visible a 2 m, bolsitas. Anota qué se fue y a cuánto: es tu estudio de mercado.', nota: 'Lleva bitácora + fotos: la próxima feria rindes el doble.' }
      ] },
      { id: 'Luna', label: '🌙 Ritmo + cuidado', soloTxt: [
        { n: 'Ritmo lunar', ico: '🌙', txt: 'Nueva: junta material (pide, no compres). Creciente: produce. Llena: regala/muestra. Menguante: ordena retazos (caja por material) y limpia herramientas.' },
        { n: 'Seguridad', ico: '🛟', txt: 'Cúter y silicona caliente solo adultos. Niños: tijera roma + cola fría. Ventila con esmaltes. Piezas chicas lejos de menores.' }
      ] }
    ] }
];

var BTN_META = {};
SECCIONES.forEach(function (s) {
  BTN_META[s.id] = s;
  BTN_META[s.area] = s;
});

/* ---------------- UI genérica ---------------- */
function rowCard(c) {
  if (c.txt) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4>' +
      '<p class="su-77e2fe">' + esc(c.txt) + '</p></div>';
  }
  return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4>' +
    (c.para ? '<p><b>Para:</b> ' + esc(c.para) + '</p>' : '') +
    (c.mat ? '<p><b>Necesitas:</b> ' + esc(c.mat) + '</p>' : '') +
    '<p><b>Cómo:</b> ' + esc(c.como) + '</p>' +
    (c.nota ? '<p class="muted">' + esc(c.nota) + '</p>' : '') +
    (c.cuidado ? '<p class="su-d33357">⚠️ ' + esc(c.cuidado) + '</p>' : '') + '</div>';
}

function switchTab(cfg, name) {
  ['Aprende', 'Fund', 'Proy', 'Luna', 'Bit'].forEach(function (t) {
    var p = $(cfg.dlg + '_' + t);
    var b = $('tab' + cfg.dlg + '_' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

function renderLog(cfg) {
  var box = $('log_' + cfg.area);
  if (!box) return;
  var all = store().logs || [];
  var data = all.filter(function (r) { return (r.area || 'arte') === cfg.area; });
  var q = (($('q_' + cfg.area) || {}).value || '').toLowerCase();
  var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
  var list = data.filter(function (r) {
    if (!q) return true;
    var t = ((r.que || '') + ' ' + (r.nota || '')).toLowerCase();
    var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
    return tn.indexOf(qn) >= 0;
  });
  var res = $('res_' + cfg.area), st = $('st_' + cfg.area);
  var totMin = data.reduce(function (a, r) { return a + (+r.min || 0); }, 0);
  if (res) {
    var last = data.slice().sort(function (a, b) { return String(b.fecha || '').localeCompare(String(a.fecha || '')); })[0];
    res.innerHTML = '<h4>📊 Resumen</h4><p class="muted su-6cb285">' + data.length + ' obra(s)/sesión(es) · ⏱ ' + totMin + ' min' +
      (last ? '<br>Última: ' + esc(last.fecha || '') + ' · ' + esc(last.que || '') : '') + '</p>';
  }
  if (!list.length) {
    box.innerHTML = '<p class="muted su-e201a8">Sin registros' + (data.length ? ' para este filtro.' : '. Anota tu primera sesión arriba: hasta “15 min de garabatos” cuenta.') + '</p>';
    if (st) st.textContent = data.length ? data.length + ' en total' : '';
    return;
  }
  box.innerHTML = list.slice().sort(function (a, b) { return String(b.fecha || '').localeCompare(String(a.fecha || '')); }).slice(0, 80).map(function (r) {
    return '<div class="hora-item"><span class="su-6cb285">🎨 <b>' + esc(r.que || 'Sesión') + '</b>' +
      '<br><span class="muted su-0d5be0">' + esc(r.fecha || '') + (r.min ? ' · ' + esc(String(r.min)) + ' min' : '') + (r.nota ? ' · ' + esc(r.nota) : '') + '</span></span>' +
      '<button type="button" class="btn btn-icon art-del" data-k="' + esc(r.id) + '" data-a="' + esc(cfg.area) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.art-del').forEach(function (x) {
    x.onclick = function () {
      try {
        var u = userData();
        if (u && u.arte) u.arte.logs = (u.arte.logs || []).filter(function (r) { return r.id !== x.dataset.k; });
      } catch (e) {}
      save(); renderLog(cfg);
    };
  });
  if (st) st.textContent = list.length + ' mostrada(s) · ' + data.length + ' total';
}

function bitacoraHTML(cfg) {
  return '<div class="menstrual-card su-68a1a9"><h4>➕ Anotar sesión u obra</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="f_' + cfg.area + '"></label>' +
    '<label>Minutos <input type="number" id="m_' + cfg.area + '" min="0" step="5" placeholder="ej: 20"></label></div>' +
    '<label>¿Qué hiciste? <input type="text" id="w_' + cfg.area + '" placeholder="ej: esfera en 5 tonos, postal del muelle..." maxlength="80"></label>' +
    '<label>Nota <input type="text" id="n_' + cfg.area + '" placeholder="qué aprendí / qué me costó..." maxlength="120"></label>' +
    '<div class="dlg-actions su-8f9e27"><button type="button" id="add_' + cfg.area + '" class="btn btn-accent su-30e741">+ Guardar</button></div></div>' +
    '<div class="conv-row su-8a77e5"><label class="su-4b3de7">🔍 Buscar <input type="text" id="q_' + cfg.area + '" placeholder="postal, luna, mezcla..."></label></div>' +
    '<div id="res_' + cfg.area + '" class="menstrual-card su-8a77e5"></div>' +
    '<div id="log_' + cfg.area + '" class="habits-list su-9daa59"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="st_' + cfg.area + '" class="muted su-11a508"></span>' +
    '<span class="su-3de8f9"><button type="button" id="sh_' + cfg.area + '" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="cl_' + cfg.area + '" class="btn su-214f75">🗑 Borrar</button></span></div>';
}

function buildDialog(cfg) {
  var body = '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tab' + cfg.dlg + '_Aprende" class="btn btn-accent su-30e741">🌱 Aprende</button>' +
    '<button type="button" id="tab' + cfg.dlg + '_Fund" class="btn su-30e741">🧰 Técnicas</button>' +
    '<button type="button" id="tab' + cfg.dlg + '_Proy" class="btn su-30e741">🎯 Proyectos</button>' +
    '<button type="button" id="tab' + cfg.dlg + '_Luna" class="btn su-30e741">🌙 Ritmo</button>' +
    '<button type="button" id="tab' + cfg.dlg + '_Bit" class="btn su-30e741">📓 Bitácora</button></div>';
  cfg.tabs.forEach(function (t) {
    var inner = '';
    if (t.cards) inner = t.cards.map(rowCard).join('');
    else if (t.soloTxt) inner = t.soloTxt.map(rowCard).join('');
    if (cfg.area === 'arte' && t.id === 'Aprende') {
      inner += '<div class="menstrual-card su-51d56a"><h4>🎨 Regla de oro</h4><p class="muted su-6cb285">Termina chico y seguido: 20 min × 4 veces/semana. Mira el territorio, mezcla con lo que hay y muestra 1 vez por luna. El oficio llega solo.</p></div>';
    }
    body += '<div id="' + cfg.dlg + '_' + t.id + '"' + (t.id === 'Aprende' ? '' : ' class="hidden"') + '>' + inner + '</div>';
  });
  body += '<div id="' + cfg.dlg + '_Bit" class="hidden">' + bitacoraHTML(cfg) + '</div>';
  makeDialog(cfg.dlg, cfg.titulo, cfg.sub, body);
}

function wireDialog(cfg) {
  ['Aprende', 'Fund', 'Proy', 'Luna', 'Bit'].forEach(function (t) {
    var b = $('tab' + cfg.dlg + '_' + t);
    if (b) b.onclick = function () { switchTab(cfg, t); if (t === 'Bit') renderLog(cfg); };
  });
  var f = $('f_' + cfg.area);
  if (f && !f.value) f.value = todayKey();
  var q = $('q_' + cfg.area);
  if (q) q.oninput = function () { renderLog(cfg); };
  var ad = $('add_' + cfg.area);
  if (ad) ad.onclick = function () {
    var que = clean((($('w_' + cfg.area) || {}).value || '').trim(), 80);
    if (!que) { alert('Cuéntanos qué hiciste (ej: postal del muelle, 20 min)'); return; }
    var m = store();
    m.logs.push({
      id: uid('art'),
      fecha: ($('f_' + cfg.area) || {}).value || todayKey(),
      area: cfg.area,
      que: que,
      min: parseFloat(($('m_' + cfg.area) || {}).value) || 0,
      nota: clean((($('n_' + cfg.area) || {}).value || '').trim(), 120)
    });
    save('Arte guardado 🎨');
    if ($('w_' + cfg.area)) $('w_' + cfg.area).value = '';
    if ($('n_' + cfg.area)) $('n_' + cfg.area).value = '';
    if ($('m_' + cfg.area)) $('m_' + cfg.area).value = '';
    renderLog(cfg);
  };
  var sh = $('sh_' + cfg.area);
  if (sh) sh.onclick = async function () {
    var d = (store().logs || []).filter(function (r) { return (r.area || 'arte') === cfg.area; });
    if (!d.length) { alert('Sin registros aún'); return; }
    var t = '🎨 Mi arte (' + cfg.area + ')\n' + d.slice().sort(function (a, b) { return String(a.fecha || '').localeCompare(String(b.fecha || '')); }).map(function (r) {
      return '• ' + r.fecha + ' · ' + r.que + (r.min ? ' · ' + r.min + ' min' : '') + (r.nota ? ' — ' + r.nota : '');
    }).join('\n');
    await share(cfg.label || 'Mi arte', t);
  };
  var cl = $('cl_' + cfg.area);
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu bitácora de ' + cfg.area + '?')) return;
    try { var u = userData(); if (u && u.arte) u.arte.logs = (u.arte.logs || []).filter(function (r) { return (r.area || 'arte') !== cfg.area; }); } catch (e) {}
    save(); renderLog(cfg);
  };
}

/* ---------------- SETUP (botones + registro) ---------------- */
function ensureArteSub(g) {
  try {
    var lab = g.querySelector('.sub-label[data-sub="arte"]');
    if (!lab) {
      lab = document.createElement('span');
      lab.className = 'sub-label';
      lab.setAttribute('data-sub', 'arte');
      lab.textContent = '🎨 Arte y creación visual';
      var refJuegos = g.querySelector('.sub-label[data-sub="juegos"]');
      if (refJuegos && refJuegos.parentNode === g) g.insertBefore(lab, refJuegos);
      else {
        var refInf = g.querySelector('.sub-label[data-sub="infancias"]');
        if (refInf && refInf.parentNode === g) g.insertBefore(lab, refInf);
        else g.appendChild(lab);
      }
    } else if (!lab.textContent || lab.textContent.indexOf('Arte') < 0) {
      lab.textContent = '🎨 Arte y creación visual';
    }
    return lab;
  } catch (e) { return null; }
}

function ensureButtons() {
  try {
    var g = document.querySelector('.action-group[data-group="aprender"] .group-btns');
    if (!g) return;
    ensureArteSub(g);
    var defs = [
      { id: 'btnArte', txt: '🎨 Aprende Arte', kw: 'arte crear dibujo pintura fotografia manualidades collage fanzine acuarela tempera acrilico color composicion bitacora serie postal feria' },
      { id: 'btnDibujo', txt: '✏️ Dibujo', kw: 'dibujo lapiz grafito sombreado retrato perspectiva encaje proporcion mano cara cuerpo dibujar' },
      { id: 'btnPintura', txt: '🖌️ Pintura', kw: 'pintura acuarela tempera acrilico pincel color mezcla paleta paisaje bote mar cuadro mural' },
      { id: 'btnFoto', txt: '📸 Fotografía', kw: 'fotografia foto celular camara luz composicion tercios retrato paisaje serie hora dorada edicion' },
      { id: 'btnManualidades', txt: '✂️ Manualidades', kw: 'manualidades collage fanzine reciclaje carton regalo feria trueque lettering bordado tijera cola' }
    ];
    defs.forEach(function (d) {
      var ex = $(d.id);
      if (ex) { try { ex.setAttribute('data-sub', 'arte'); } catch (e) {} return; }
      var btn = document.createElement('button');
      btn.id = d.id; btn.className = 'btn'; btn.type = 'button';
      btn.textContent = d.txt;
      try { btn.setAttribute('data-sub', 'arte'); } catch (e2) {}
      btn.setAttribute('data-keywords', d.kw);
      var lab = g.querySelector('.sub-label[data-sub="arte"]');
      var juegos = g.querySelector('.sub-label[data-sub="juegos"]');
      if (juegos && juegos.parentNode === g) g.insertBefore(btn, juegos);
      else if (lab && lab.nextSibling) g.insertBefore(btn, lab.nextSibling);
      else g.appendChild(btn);
      // Mantener orden btnArte primero dentro del sub
      try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e3) {}
    });
  } catch (e) {}
}

function registerGlobals() {
  var ids = ['btnArte', 'btnDibujo', 'btnPintura', 'btnFoto', 'btnManualidades'];
  try {
    if (typeof ALL_BTNS !== 'undefined') ids.forEach(function (id) { if (ALL_BTNS.indexOf(id) < 0) ALL_BTNS.push(id); });
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') ids.forEach(function (id) { BTN_HOME[id] = ['aprender', 'arte']; });
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      if (!BTN_ORDER['aprender|arte']) BTN_ORDER['aprender|arte'] = ids.slice();
      else ids.forEach(function (id) { if (BTN_ORDER['aprender|arte'].indexOf(id) < 0) BTN_ORDER['aprender|arte'].push(id); });
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p] && (p === 'todo' || p === 'adulto' || p === 'estudiante' || p === 'docente' || p === 'adolescente' || p === 'salud' || p === 'mayor')) {
          ids.forEach(function (id) { PRESETS[p][id] = true; });
        }
      });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try {
    var groups = document.querySelectorAll('#configDialog .config-group');
    groups.forEach(function (gr) {
      var h = gr.querySelector('h4') || gr.querySelector('h5');
      if (h && h.textContent.indexOf('Aprender') >= 0) {
        ids.forEach(function (id, idx) {
          if (document.querySelector('#configDialog input[data-btn="' + id + '"]')) return;
          var labels = ['🎨 Aprende Arte', '✏️ Dibujo', '🖌️ Pintura', '📸 Fotografía', '✂️ Manualidades'];
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="' + id + '"> ' + labels[idx];
          var refJ = gr.querySelector('input[data-btn="btnAjedrez"]');
          if (refJ && refJ.closest && refJ.closest('label') && refJ.closest('label').parentNode) {
            var pPrev = refJ.closest('label').previousSibling;
            // insertar antes del bloque Juegos: buscar el <p> con 🎮
            var ps = gr.querySelectorAll('p');
            var juegosP = null;
            ps.forEach(function (p) { if ((p.textContent || '').indexOf('Juegos') >= 0) juegosP = p; });
            if (juegosP && juegosP.parentNode) juegosP.parentNode.insertBefore(lab, juegosP);
            else refJ.closest('label').parentNode.insertBefore(lab, refJ.closest('label'));
          } else { gr.appendChild(lab); }
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis[id] !== false;
            (function (bid, lb) {
              lb.querySelector('input').onchange = function () {
                try {
                  var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                  if (DATAref) {
                    DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                    DATAref.config.visible[bid] = lb.querySelector('input').checked;
                    if (typeof scheduleSave === 'function') scheduleSave();
                    if (typeof applyVisibility === 'function') applyVisibility();
                  }
                } catch (e2) {}
              };
            })(id, lab);
          } catch (e2) {}
        });
      }
    });
  } catch (e) {}
}

function setup() {
  ensureButtons();
  registerGlobals();
  SECCIONES.forEach(function (cfg) {
    buildDialog(cfg);
    wireDialog(cfg);
    var b = $(cfg.id);
    if (b && !b.dataset.arte) {
      b.dataset.arte = '1';
      (function (c) {
        b.addEventListener('click', function () {
          var f = $('f_' + c.area);
          if (f && !f.value) f.value = todayKey();
          renderLog(c);
          switchTab(c, 'Aprende');
          openDlg(c.dlg);
        });
      })(cfg);
    }
  });
  var missing = SECCIONES.filter(function (c) { return !$(c.id); });
  if (missing.length && (setup._r = (setup._r || 0) + 1) < 60) { setTimeout(setup, 500); return; }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
