/* ============================================================
   AMI · EL NIÑO DE LAS ESTRELLAS — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente sobre la trilogía de
   Enrique Barrios (Ami 1, Ami regresa, Ami 3 Civilizaciones internas):
   - Botón btnAmi (grupo Linaje > Interior, tras btnAnastasia)
   - Diálogo amiDialog con 5 pestañas:
     1) Guía (quién es Ami, Pedrito, Ofir, Vinka, medida
        evolutiva, mundos evolucionados, federación,
        cómo leer sin grupo ni gurú, cuidados)
     2) Libros y Enseñanzas (los 3 libros + 12 enseñanzas madre con
        buscador + detalle + favorita + "vivir hoy")
     3) Prácticas (9 prácticas del corazón + vuelo nocturno 3 min
        + registro diario)
     4) Test (20 afirmaciones: ¿corazón, explorador o cuidador?
        + nivel de miedo/sistema)
     5) Mi Vuelo (mi vía, diario, prácticas, historial,
        racha, compartir, llevar a nota, borrar)
   - Todo local y privado por usuario: userData().ami
     { tests:[], miVia:'', practs:[], diario:{}, favs:[] }
   - Puentes: Crianza (🧒), Convivencia (🤝), Gratitud (📓),
     Disciplina (🎯), Bosque/Playa Penco (🌊🌳), Oráculo (🌬️).
   - Educativo, no religión ni terapia. 100% offline.
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
  try { if (typeof cal !== 'undefined' && cal.fmtKey) return cal.fmtKey.format(new Date()); } catch (e) {}
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function blank() { return { tests: [], miVia: '', practs: [], diario: {}, favs: [] }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.ami) u.ami = blank();
    var e = u.ami;
    if (!Array.isArray(e.tests)) e.tests = [];
    if (!Array.isArray(e.practs)) e.practs = [];
    if (!e.diario) e.diario = {};
    if (!Array.isArray(e.favs)) e.favs = [];
    if (typeof e.miVia !== 'string') e.miVia = '';
    return e;
  } catch (e2) { return blank(); }
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
function switchTab(name) {
  ['Guia', 'Libros', 'Pract', 'Test', 'Camino'].forEach(function (t) {
    var p = $('ami' + t), b = $('tabAmi' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ============================================================
   DATOS — 3 libros (resumen educativo breve, paráfrasis propia)
   ============================================================ */
var AMI_LIBROS = [
  { id: 'l1', n: 'Libro 1 · Ami, el niño de las estrellas (1986)', ico: '🛸', tag: 'Pedrito playa verano Ami Ofir encuentro ovni amor',
    resumen: 'Pedrito, niño chileno de 9 años, veranea solo en la playa cuando una noche aparece Ami: un niño de otro mundo que baja de una nave. En tres noches de vuelo le muestra la Tierra desde arriba, lo lleva a Ofir y a otros mundos, y le enseña la ley fundamental del universo. Pedrito vuelve cambiado: ya no puede burlarse ni pelear como antes.',
    llave: 'El amor es la ley fundamental del universo: todo lo que se aleja de él, se destruye.' },
  { id: 'l2', n: 'Libro 2 · Ami regresa (1987)', ico: '💫', tag: 'Ami regresa Vinka Kia amor pareja mundos no evolucionados',
    resumen: 'Ami vuelve por Pedrito y por su primo Víctor, más grande y escéptico. Esta vez el viaje incluye a Vinka, niña del mundo incivilizado de Kía, rescatada con amor. Los tres niños visitan mundos dolorosos y mundos felices, y aprenden que nadie se salva solo: hay que amar también al que piensa distinto.',
    llave: 'Nadie evoluciona solo: el amor incluye al diferente, no lo deja fuera.' },
  { id: 'l3', n: 'Libro 3 · Ami y las civilizaciones internas', ico: '🌎', tag: 'civilizaciones internas intraterrenos Perlita mision semilla',
    resumen: 'Cierre con Perlita y los pueblos que viven dentro de la Tierra cuidando la semilla humana. Pedrito entiende su misión: no ser famoso ni gurú, sino un niño bueno que escribe su verdad para que otros niños despierten. Mensaje final: los niños de hoy harán el mundo nuevo si los adultos los dejan amar.',
    llave: 'Tu misión no es salvar el mundo: es ser bueno donde estás y contar lo que aprendiste.' }
];
function amiLibro(id) { for (var i = 0; i < AMI_LIBROS.length; i++) if (AMI_LIBROS[i].id === id) return AMI_LIBROS[i]; return null; }

/* 12 enseñanzas madre (lo esencial para vivirlo en Penco) */
var AMI_SABERES = [
  { id: 'amor', cap: '1 · El Amor es la ley', ico: '❤️', libro: 'Libros 1–3', tag: 'amor ley fundamental universo Dios energia frecuencia vibracion',
    texto: '“Todo en el universo tiene una medida. La del ser humano es el amor.”',
    idea: 'La idea madre de toda la trilogía: el universo funciona con una sola ley, el Amor. No es un sentimiento romántico: es la fuerza que une, cuida y hace crecer. Cuando una persona, familia o planeta vive contra esa ley (odio, violencia, egoísmo), se enferma y se destruye. Cuando vive a favor, todo florece: salud, inteligencia y alegría.',
    historia: 'Ami le muestra a Pedrito dos planetas desde la nave: uno gris, con guerras y contaminación, donde la gente vive con miedo; y Ofir, luminoso, con casas entre jardines y niños felices. La única diferencia, le dice, es cuántos “grados de amor” alcanzó cada mundo. La Tierra está al medio: puede subir o caer, según lo que hagamos nosotros.',
    como: 'El amor se mide en actos, no en palabras: tratar bien, no dañar, ayudar sin esperar pago, perdonar, cuidar lo vivo. Ami explica que el corazón tiene una “puerta” que se abre con ternura y se cierra con miedo. Cada acto bueno la abre un poco más; cada burla o golpe la cierra. Así sube o baja tu medida, día a día.',
    sirve: 'Peleas en casa, bullying en el colegio, rabia contra el mundo, ganas de ser malo “porque todos lo son”, tristeza sin motivo.',
    practica: 'Hoy 3 actos de amor chico: 1 gracias mirando a los ojos + 1 ayuda sin que te pidan + 0 burlas. Anótalos.',
    pasos: '1) Mañana: promete 0 burlas hoy. 2) Haz 1 ayuda silenciosa (ordenar, convidar, acompañar). 3) Di 1 gracias mirando a los ojos. 4) Noche: cuenta amores vs enojos en tu diario.',
    frases: '“El amor es mi ley.” / “Elijo tratar bien.” / “Gracias por existir.”',
    senal: 'Te buscan para jugar, duermes tranquilo y te cuesta burlarte: el corazón te avisa antes.',
    penco: 'Micro, fila del consultorio, patio del colegio: ahí se entrena. Con vecinos difíciles, parte por saludar 7 días seguidos.',
    puente: '📓 Gratitud (agradecer) · 🤝 Convivencia (pedir sin gritar) · 🧒 Crianza (ternura diaria).',
    trampa: 'Decir “amor y paz” y tratar mal en casa, o dejar que te peguen llamándolo amor. Amar incluye poner límites con calma.',
    pregunta: '¿Esto que haré une o hiere?' },
  { id: 'medida', cap: '2 · La medida evolutiva (los 750)', ico: '📏', libro: 'Libro 1', tag: 'medida 750 evolucion sensor Ami Ofir mundos nota',
    texto: '“Para entrar a la federación un mundo necesita 750 de medida. La Tierra tiene poco más de 500.”',
    idea: 'Ami trae un “sensor” que mide el nivel de amor de personas y mundos. No mide plata ni inteligencia: mide bondad en acción. Ofir tiene más de 900; la Tierra anda por los 500 y algo. La buena noticia: cada persona que sube su medida, sube la del planeta. Nadie está condenado: todos pueden subir.',
    historia: 'En la nave, Ami mide a Pedrito y a gente famosa de la tele: se ríen al ver que un campesino bueno marca más que un general con medallas. Pedrito se asusta (“¿yo tan bajo?”) y Ami lo tranquiliza: lo que importa no es dónde partes, sino hacia dónde caminas. Desde esa noche Pedrito se propone subir su nota siendo bueno de verdad.',
    como: 'Tu medida sube con: decir la verdad, no dañar animales ni plantas, compartir, perdonar, trabajar con alegría, cuidar tu cuerpo. Baja con: mentir, burlarse, pegar, robar, contaminar, tratar mal a la mamá. No es nota de colegio para compararse: es brújula para mirarse uno mismo cada noche.',
    sirve: 'Compararse con otros, creerse “malo sin remedio”, envidia de notas o ropa, ganas de rendirse.',
    practica: 'Ponte tu nota de amor hoy del 1 al 10. Mañana súbela en 1 punto con 1 acto concreto.',
    pasos: '1) Noche: ¿fui bueno hoy? nota del 1 al 10 sin mentirme. 2) Elige 1 punto a subir mañana (ej: no gritar). 3) Hazlo y anótalo. 4) Celebra cada subida, aunque sea de 4 a 5.',
    frases: '“Hoy subo un punto.” / “No me comparo: crezco.” / “Puedo ser mejor.”',
    senal: 'Dejas de compararte, te alegras del bien ajeno y tu nota sube sin darte cuenta.',
    penco: 'Úsalo en 📓 Gratitud y 🎯 Disciplina: nota diaria + 1 acto. En familia, jueguen a subir la nota de la casa.',
    puente: '🎯 Disciplina (acto diario) · 📓 Gratitud · 🪞 Autoconocimiento (mirarse sin mentira).',
    trampa: 'Usar la medida para juzgar (“tú eres 300”) o para creerse superior. El que mide a otros, baja su propia nota.',
    pregunta: '¿Hacia dónde camino hoy: subo o bajo?' },
  { id: 'mundos', cap: '3 · Mundos evolucionados y no evolucionados', ico: '🪐', libro: 'Libros 1–2', tag: 'mundos evolucionados Ofir Kia Tierra guerras sistema felicidad',
    texto: '“Hay mundos felices y mundos que sufren. La diferencia no es la tecnología: es el amor.”',
    idea: 'Ami muestra que hay planetas donde nadie pasa hambre, nadie hace la guerra y los niños estudian jugando; y otros, como Kía y como la Tierra a ratos, donde hay guerras, pobreza y miedo. La diferencia no es tener más naves o plata: es haber elegido el amor como organización. La tecnología sin amor destruye; con amor, libera.',
    historia: 'Pedrito visita Ofir: sin rejas, sin humo, con música, fruta y trabajo alegre; y visita Kía: con soldados, muros y niños tristes. Vinka, la niña de Kía, llora al ver Ofir porque entiende que su mundo podría ser así. Ami explica que la Tierra está en la bifurcación: o sigue a Kía o camina a Ofir. Los niños de hoy votan con su conducta.',
    como: 'Un mundo sube cuando: nadie mata por ideas, la comida alcanza, los niños ríen, se cuida el aire y el agua, y el trabajo sirve a todos. Baja cuando: manda el miedo, se gasta en armas, se contamina por plata y se educa con castigo. Tu casa y tu curso son tu “planetita”: lo que haces ahí vota por Ofir o por Kía.',
    sirve: 'Noticias que asustan, “el mundo está perdido”, peleas por política, contaminación que da rabia e impotencia.',
    practica: 'Haz tu pieza o tu curso 1% más Ofir hoy: ordena, ventila, comparte, ríe sin burla.',
    pasos: '1) Mira tu pieza/curso: ¿parece Kía u Ofir? 2) Elige 1 mejora (orden, planta, silencio, juego bueno). 3) Hazla hoy con alguien. 4) Cuéntala en tu diario como “voto por Ofir”.',
    frases: '“Mi casa vota por Ofir.” / “Yo hago mundo feliz.” / “Cuidar es evolucionar.”',
    senal: 'Tu pieza se ordena sola casi, invitas sin pelear y otros copian lo bueno.',
    penco: 'Playa Negra sin basura, humedal Rocuant cuidado, huerta del colegio: cada minga es un voto por Ofir. Súmate en 🤝 Minga.',
    puente: '🤝 Minga (planeta local) · 🌱 Siembra (tierra viva) · 🌊 Territorio (mar y bosque).',
    trampa: 'Quedarse mirando el cielo esperando que “ellos” nos salven, o odiar a la Tierra por no ser Ofir. Ofir se construye aquí.',
    pregunta: '¿Mi rincón hoy es Kía u Ofir?' },
  { id: 'ayuda', cap: '4 · Los hermanos mayores ayudan sin imponerse', ico: '🤝', libro: 'Libros 1–3', tag: 'hermanos mayores ayuda federacion intervencion respeto libre albedrio ovni',
    texto: '“No podemos obligarlos a ser buenos. Solo podemos mostrarles que se puede vivir mejor.”',
    idea: 'Los mundos evolucionados forman una federación que ayuda a los que sufren, pero con una regla de oro: no intervenir a la fuerza. No invaden, no castigan, no se muestran en masa para no asustar. Ayudan en silencio: inspiran sueños, cuidan a los buenos, rescatan a algunos niños, y esperan a que cada mundo pida ayuda con amor. Respetan el ritmo de cada uno.',
    historia: 'Pedrito pregunta por qué Ami no baja con su nave a la plaza a decirle a todos la verdad. Ami le explica que ya lo intentaron en otros mundos: cuando se mostraron de golpe, los tomaron por dioses o por demonios y hubo guerras. Por eso trabajan de a poco: con niños soñadores, con gente buena, con libros como este. El que está listo, escucha.',
    como: 'Ayudar bien tiene 3 reglas: 1) No obligar (muestra, no impongas). 2) No humillar (ayuda sin hacer sentir menos). 3) No esperar gracias (el bien se hace porque sí). Así ayudan los hermanos mayores, y así puedes ayudar tú en tu curso: al nuevo, al que se equivoca, al pesado, sin creerte superior.',
    sirve: 'Ganas de convencer a todos, peleas por tener la razón, “nadie me escucha”, frustración por ayudar y que no te pesquen.',
    practica: 'Ayuda hoy a 1 persona sin decirle lo que tiene que hacer: muestra con tu ejemplo.',
    pasos: '1) Elige a quién ayudar sin sermón. 2) Haz o muestra (no expliques largo). 3) Si no quiere, respeta y sigue tu camino. 4) Anota cómo te sentiste ayudando en silencio.',
    frases: '“Muestro, no impongo.” / “Ayudo sin humillar.” / “Respeto tu ritmo.”',
    senal: 'Te piden ayuda solos, discutes menos y ayudas más.',
    penco: 'En el curso y la pega: enseña haciendo. Si alguien no quiere, no insistas: tu ejemplo queda sembrado.',
    puente: '🤝 Minga · 🧒 Crianza (guiar sin gritar) · 📿 Métodos (¿ayudo o impongo?).',
    trampa: 'Creerse “hermano mayor” y mirar en menos, o contar que hablas con Ami para llamar la atención. El verdadero ayudante pasa piola.',
    pregunta: '¿Estoy mostrando o imponiendo?' },
  { id: 'escuela', cap: '5 · La escuela del amor (aprender con alegría)', ico: '🏫', libro: 'Libros 1–2', tag: 'escuela educacion Ofir juegos deporte arte amor examenes castigo Pedrito',
    texto: '“En los mundos evolucionados nadie llora para ir a la escuela. Aprender es una fiesta.”',
    idea: 'En Ofir no hay pruebas con miedo, filas en silencio ni castigos. Se aprende jugando, con arte, deporte, música y paseos; cada niño avanza a su ritmo y enseña lo que sabe. El maestro es un amigo mayor que ama, no un juez. Pedrito, que odia su escuela, entiende que el problema no es estudiar: es estudiar con miedo.',
    historia: 'Ami lleva a Pedrito a una escuela de Ofir: niños que ríen, hacen teatro, miden un huerto con matemáticas de verdad y meditan mirando el cielo. Nadie repite de curso porque nadie compite: todos cooperan. Víctor, el primo grande, se burla al inicio (“así cualquiera”), pero termina jugando con ellos y reconociendo que así sí dan ganas.',
    como: 'Aprender con amor tiene 3 ingredientes: juego (el cuerpo se mueve), belleza (música, color, risa) y sentido (esto sirve para algo real). En casa se aplica igual: 25 min de estudio alegre + pausa jugada + enseñar a otro lo aprendido. El que enseña, aprende dos veces.',
    sirve: 'Odio a las tareas, miedo a las pruebas, “soy tonto”, homeschool que termina en grito, niños aburridos.',
    practica: 'Estudia hoy 25 min jugando: dibuja, canta o enseña lo aprendido a alguien.',
    pasos: '1) Elige 1 materia odiada. 2) Ponle juego (dibujo, canción, desafío con tiempo). 3) Estudia 25 min + 5 de juego libre. 4) Enséñale a alguien 1 cosa: esa es tu prueba.',
    frases: '“Aprender es jugar.” / “Enseño y aprendo.” / “Me gusta saber.”',
    senal: 'Estudias sin que te manden, preguntas por gusto y enseñas a otros.',
    penco: 'Pide apoyo en 🧠 Estudio y 📚 Horario de la app. Proyecto real por luna: huerta, pan, mapa de Penco.',
    puente: '🧠 Estudio · 📚 Horario · 🌱 Siembra (matemáticas midiendo la huerta).',
    trampa: 'Pedir escuela Ofir sin poner alegría propia, o no estudiar “porque el sistema es malo”. El amor estudia igual, pero feliz.',
    pregunta: '¿Cómo le pongo juego a esto?' },
  { id: 'planeta', cap: '6 · Cuidar el planeta (ecología del amor)', ico: '🌎', libro: 'Libros 1–3', tag: 'ecologia planeta contaminacion Tierra mar bosque aire cuidado',
    texto: '“Maltratar la Tierra es como ensuciar tu propia casa.”',
    idea: 'Para Ami la ecología no es moda: es amor en acción. El planeta es un ser vivo que nos da aire, agua y comida gratis. En los mundos evolucionados nadie bota basura al mar, nadie quema bosques por plata ni envenena el aire. Pedrito, que pescaba con anzuelo chico y devolvía los chicos, ya vivía esta enseñanza sin saberlo.',
    historia: 'Desde la nave, Pedrito ve la Tierra de noche: luces hermosas, pero con manchas negras de humo y mares con basura. Ami le muestra después Ofir: ríos que se pueden tomar, aire que huele a flores, animales que no arrancan. “Ustedes también pueden”, le dice, “si dejan de creer que la plata vale más que el agua”.',
    como: 'Cuidar es: no botar (lleva tu basura), no quemar (hojas al compost), no envenenar (menos químico, más natural), plantar (1 árbol por año) y pescar/cosechar con medida (deja chicos y semilla). Todo parte en tu cuadra: una cuadra limpia enseña más que mil discursos.',
    sirve: 'Basura en la playa, humo que ahoga, ganas de hacer algo y no saber qué, pena por animales y bosque.',
    practica: 'Recoge hoy 1 bolsa de basura de tu playa, plaza o calle. Pésala y anótala.',
    pasos: '1) Lleva bolsa cuando salgas. 2) Recoge 10 minutos (guantes si hay vidrio). 3) Separa: plástico, vidrio, resto. 4) Anota kilos y lugar en tu diario o bitácora.',
    frases: '“Mi planeta es mi casa.” / “Dejo limpio.” / “Planto vida.”',
    senal: 'Te duele ver basura, llevas bolsa sin pensarlo y otros se suman.',
    penco: 'Playa Negra, Lirquén, humedal Rocuant, cerro: 10 min bastan. Registra en 🌊 Territorio y súmate a mingas.',
    puente: '🌊 Mareas/Intermareal · 🌳 Bosque · 🌱 Siembra · 🤝 Minga.',
    trampa: 'Cuidar lejos (marcha, foto) y ensuciar cerca (patio, pieza). El planeta empieza en tu pieza.',
    pregunta: '¿Qué le devuelvo hoy a mi planeta?' },
  { id: 'corazon', cap: '7 · Escuchar el corazón (telepatía del amor)', ico: '💓', libro: 'Libro 1', tag: 'corazon telepatia sentir intuicion pensar sentir Ami Pedrito',
    texto: '“Nosotros no hablamos tanto con la boca. Nos comunicamos de corazón a corazón.”',
    idea: 'En Ofir casi no discuten porque se escuchan de verdad: sienten lo que el otro siente antes de hablar. Ami enseña que el corazón entiende más rápido que la cabeza. Pedrito aprende a distinguir: la cabeza grita (miedo, apuro, enojo), el corazón susurra (calma, ternura, verdad). Escuchar ese susurro es la “telepatía” que todos podemos entrenar.',
    historia: 'Ami habla a veces sin mover los labios y Pedrito lo entiende igual. Al principio Pedrito cree que es magia; Ami se ríe: “Tú también lo haces cuando sabes que tu mamá está triste sin que te lo diga”. En el vuelo, Pedrito siente el miedo de un niño de Kía a lo lejos y llora: ahí entiende que todos estamos conectados.',
    como: 'Se entrena con silencio: 1 minuto quieto, mano al pecho, respirar lento y preguntar “¿qué siento de verdad?”. La respuesta verdadera calma; la falsa apura. También se entrena mirando a los ojos cuando escuchas, sin interrumpir. Quien escucha así, casi no necesita pelear.',
    sirve: 'Cabeza que no para, decisiones con miedo, peleas por no escuchar, “nadie me entiende”.',
    practica: 'Hoy escucha 5 min sin interrumpir a alguien. Mano al pecho antes de responder.',
    pasos: '1) Silencio 1 min, mano al pecho, 3 respiraciones. 2) Escucha 5 min mirando a los ojos, sin interrumpir. 3) Repite lo que entendiste (“¿te entendí bien?”). 4) Responde desde la calma.',
    frases: '“Te escucho de corazón.” / “¿Qué sientes?” / “Mi corazón sabe.”',
    senal: 'Interrumpes menos, adivinas menos y aciertas más, peleas más cortas.',
    penco: 'Practícalo en la once familiar y en el curso. Puente con 🌬️ Respiración y 🪞 Autoconocimiento.',
    puente: '🌬️ Respiración · 🪞 Autoconocimiento · 🤝 Convivencia.',
    trampa: 'Decir “mi corazón dice” para hacer lo que quiero sin pensar, o espiar sentimientos para manipular. El corazón no miente ni usa.',
    pregunta: '¿Qué me dice mi corazón en calma?' },
  { id: 'miedo', cap: '8 · Soltar el miedo y el ego (Pedrito aprende)', ico: '🦁', libro: 'Libros 1–2', tag: 'miedo ego burla valentia Pedrito Victor verguenza perdon',
    texto: '“El miedo te hace pequeño. El amor te hace grande.”',
    idea: 'Pedrito parte miedoso: miedo a la oscuridad, a que se burlen, a decir lo que vio. Víctor parte agrandado: se burla para no mostrar miedo. Ami les muestra que burla, fanfarronería y violencia son miedo disfrazado. El valiente de verdad no es el que pega: es el que dice la verdad con ternura aunque se rían.',
    historia: 'Pedrito no cuenta su encuentro con Ami por miedo a que le digan loco. En el segundo viaje, cuando defiende a Vinka frente a burlas, tiembla pero habla igual: ahí Ami lo felicita (“subiste tu medida”). Víctor, que se burlaba de todo, llora al ver un mundo en guerra y pide perdón: su dureza era pura pena guardada.',
    como: 'El miedo se suelta nombrándolo (“tengo miedo de ___”), respirándolo (3 lentas) y actuando igual en chico (decir 1 verdad al día). El ego se baja riéndose de uno mismo y pidiendo perdón rápido. Cada vez que eliges ternura en vez de burla, el miedo se achica.',
    sirve: 'Miedo a hablar, a la oscuridad, a equivocarse; burlas que duelen; vergüenza de pedir perdón.',
    practica: 'Di hoy 1 verdad con ternura aunque tiembles. Si te burlaste, pide perdón hoy mismo.',
    pasos: '1) Nombra tu miedo en 1 frase. 2) Respira 3 lentas. 3) Haz igual el acto bueno chico. 4) Si fallaste, pide perdón concreto hoy (no mañana).',
    frases: '“Tengo miedo y actúo igual.” / “Perdóname, me equivoqué.” / “Me río con, no de.”',
    senal: 'Pides perdón más rápido, te burlas menos y duermes sin repasar peleas.',
    penco: 'En el colegio: defiende sin pegar (palabra + profe + grupo). Si te superan, pide ayuda: *4141, profe, CESFAM.',
    puente: '🟣 Convivencia · 🔁 Recapitulación (soltar) · 💭 Diario Sueños (miedos de noche).',
    trampa: 'Confundir valentía con pelear o con no sentir miedo. Valiente es sentir miedo y elegir el bien igual.',
    pregunta: '¿Actúo desde miedo o desde amor?' },
  { id: 'familia', cap: '9 · Familia y ternura (la abuelita)', ico: '👵', libro: 'Libros 1–3', tag: 'familia abuela abuelita padres ternura Pedrito amor hogar',
    texto: '“Nadie evoluciona sin ternura. La primera nave es el abrazo.”',
    idea: 'Pedrito no es huérfano de amor: tiene una abuelita sabia que lo escucha, le cree y le cocina rico. Ami dice que los abuelos son “bibliotecas del corazón”: guardan la ternura que el sistema apurado olvida. La familia es la primera escuela del amor: ahí se aprende a pedir perdón, a compartir y a cuidar.',
    historia: 'Cuando Pedrito vuelve de su vuelo, solo su abuelita le cree sin reírse. Ella le dice: “Si te hizo más bueno, fue verdad”. En el libro 2, Pedrito extraña a su abuela en plena nave y Ami lo trae de vuelta a abrazarla: ningún viaje a las estrellas vale si olvidas abrazar en casa. Vinka sana cuando una familia la acoge con comida y cuento.',
    como: 'La ternura se practica: abrazo largo (20 segundos), comida sin tele, cuento o sobremesa, perdón antes de dormir (no acostarse peleados), y escuchar a los abuelos grabando su historia. Una familia que se abraza, resiste al sistema.',
    sirve: 'Peleas en casa, abuelos solos, niños encerrados con pantalla, perdones pendientes, pena de estar lejos.',
    practica: 'Abraza hoy 20 segundos a alguien de tu familia + 1 comida sin pantallas.',
    pasos: '1) Abrazo largo hoy (cuenta hasta 20). 2) Una comida sin tele ni celu. 3) Pregunta a un mayor 1 historia y escúchala. 4) Perdón antes de dormir si hubo roce.',
    frases: '“Te creo.” / “Gracias por cuidarme.” / “Perdón y abrazo.”',
    senal: 'Buscan tu abrazo, la sobremesa se alarga y los abuelos cuentan más.',
    penco: 'Graba a tus abuelos en 🗣️ Voz de los Abuelos. Once sin tele 1 vez por semana.',
    puente: '🗣️ Voz de los Abuelos · 🌳 Árbol Genealógico · 🧒 Crianza.',
    trampa: 'Amar a la humanidad y tratar mal en casa, o idealizar a Ami y olvidar a la abuela. El amor empieza en la cocina.',
    pregunta: '¿A quién abrazo hoy?' },
  { id: 'trabajo', cap: '10 · Trabajo con alegría (hacer lo que amas)', ico: '🛠️', libro: 'Libros 1–2', tag: 'trabajo oficio alegria Ofir vocacion Pedrito Victor futuro',
    texto: '“En los mundos felices nadie trabaja por obligación. Todos hacen lo que aman.”',
    idea: 'En Ofir no existe el trabajo odiado: cada uno descubre lo que ama y sirve con eso. El panadero canta, la maestra juega, el constructor dibuja. Ami explica que el cansancio feo no viene de trabajar mucho, sino de trabajar sin amor. Pedrito, que soñaba con ser “importante”, entiende que lo importante es ser útil y feliz.',
    historia: 'Víctor dice que de grande quiere un trabajo que dé plata aunque sea fome. Ami lo lleva a un taller de Ofir donde un niño repara naves riendo: “¿Cambiarías tu alegría por plata?”, le pregunta. Víctor calla. De vuelta, Víctor cuenta que quiere enseñar fútbol a niños chicos: su primer sueño con amor.',
    como: 'Se descubre probando: 1 oficio por luna (cocinar, sembrar, arreglar, enseñar, cantar), 1 maestro (abuelo, vecino, profe) y 1 obra que sirva a otros. La pregunta no es “¿qué da más plata?”, sino “¿qué haría gratis y bien?”. La plata llega después, cuando sirves bien.',
    sirve: '“No sé qué ser”, pega fome, cesantía, trabajo odiado, jóvenes sin rumbo.',
    practica: 'Prueba 1 oficio esta luna 3 veces: haz algo útil gratis para alguien.',
    pasos: '1) Lista 3 cosas que haces feliz. 2) Elige 1 y practícala 3 veces esta luna. 3) Regala 1 obra (pan, arreglo, clase). 4) Pide a 1 mayor que te enseñe su oficio.',
    frases: '“Trabajo con alegría.” / “Sirvo con lo que amo.” / “Aprendo un oficio.”',
    senal: 'Te piden ayuda en eso, el tiempo vuela y te pagan o convidan sin pedirlo.',
    penco: 'Talleres de Penco, oficio de la abuela, huerto, pan, pesca con medida: aprende en 🤝 Minga y 📚 Horario.',
    puente: '🌸 Ikigai (propósito) · 📚 Horario · 🤝 Minga.',
    trampa: 'Esperar el trabajo soñado sin practicar nada, o despreciar oficios simples. Todo oficio con amor es estelar.',
    pregunta: '¿Qué haría feliz aunque no me pagaran?' },
  { id: 'unidad', cap: '11 · Unidad: la federación (todos hermanos)', ico: '🌌', libro: 'Libros 1–3', tag: 'federacion unidad hermanos religiones paises razas Kía Ofir paz',
    texto: '“En el universo no hay extranjeros. Todos somos hermanos.”',
    idea: 'La federación de mundos evolucionados no pregunta religión, país ni color: pregunta medida de amor. Por eso Ami puede ser amigo de Pedrito (chileno), Vinka (de Kía) y Perlita (de adentro) a la vez. La enseñanza para la Tierra: dejar de dividirnos por camiseta, bandera o creencia. El que divide por odio, baja; el que une por amor, sube.',
    historia: 'En la nave viajan juntos un chileno miedoso, un primo burlón y una niña salvaje de otro mundo que no hablan el mismo idioma al inicio. Al final se entienden sin traductor: jugando, riendo y llorando juntos. Ami sonríe: “Ya son federación”. Pedrito entiende que su curso también puede serlo si dejan de hacer grupos que se pelean.',
    como: 'Unir es: no hacer grupos para excluir, invitar al nuevo, no hablar mal del ausente, celebrar fiestas de todos, y pelear por ideas sin odiar a la persona. En casa: una mesa donde caben todos. En Penco: una minga donde ayudan todos.',
    sirve: 'Grupos que se pelean, discriminación, peleas por religión o política, soledad del nuevo.',
    practica: 'Invita hoy al que siempre queda fuera: juega, come o camina con él.',
    pasos: '1) Mira quién queda fuera en tu curso/cuadra. 2) Invítalo a algo simple hoy. 3) No hables mal de nadie hoy. 4) Celebra 1 diferencia (comida, palabra, juego de otro).',
    frases: '“Todos somos hermanos.” / “Aquí caben todos.” / “Te invito.”',
    senal: 'Tu grupo se agranda, hay menos cahuín y los nuevos te buscan.',
    penco: 'Fiestas de Penco, feria, minga, partido: invita al nuevo, al de otro barrio, al distinto.',
    puente: '🤝 Minga · 🔄 Trueque · 🟣 Convivencia.',
    trampa: 'Decir “todos hermanos” y hacer grupo cerrado, o unirte solo con los iguales. La unidad se prueba con el diferente.',
    pregunta: '¿A quién dejo fuera hoy?' },
  { id: 'mision', cap: '12 · Tu misión (semilla de estrellas)', ico: '🌱', libro: 'Libro 3', tag: 'mision semilla estrellas Perlita escribir contar despertar niños nuevos',
    texto: '“No me creas: vive bien y cuenta lo que aprendiste. Esa es tu misión.”',
    idea: 'Cierre de la trilogía: Pedrito no tiene que hacerse famoso ni fundar nada. Su misión es simple: ser un niño bueno y escribir su historia para que otros niños recuerden que vienen de las estrellas. Perlita le dice que hay miles de “semillas” como él en la Tierra, esperando que alguien les hable con amor para despertar. Tú puedes ser una.',
    historia: 'Pedrito llora porque cree que no podrá hacer nada grande siendo un niño pobre de Chile. Ami le muestra en la nave cientos de lucecitas en la Tierra: niños buenos que brillan en la oscuridad. “Cada uno alumbra su cuadra”, le dice, “y juntos amanecen el planeta”. Pedrito vuelve y escribe su libro a mano: esta trilogía.',
    como: 'Tu misión tiene 3 patas: ser bueno (tu conducta), contar (tu historia) y sembrar (tu acto). Se escribe en 5 líneas: quién soy, qué aprendí, qué sueño, qué haré hoy, a quién ayudaré. Se relee cada luna llena y se cumple en chico, todos los días.',
    sirve: '“Soy chico, pobre, nadie”, desesperanza, “ya es tarde”, ganas de rendirse, jóvenes sin rumbo.',
    practica: 'Escribe tu misión en 5 líneas y léela bajo las estrellas hoy.',
    pasos: '1) Escribe 5 líneas en presente (soy, aprendí, sueño, haré, ayudaré). 2) Léela en voz alta mirando el cielo. 3) Haz hoy 1 acto de tu misión. 4) Cuéntasela a 1 persona que la celebre.',
    frases: '“Soy semilla de estrellas.” / “Cuento y siembro.” / “Alumbro mi cuadra.”',
    senal: 'Te levantas con ganas, otros te cuentan sus sueños y tu cuadra te conoce por lo bueno.',
    penco: 'Mira el cielo desde Playa Negra o el cerro sin luz blanca (usa roja). Escribe tu misión en 🌳 Árbol Genealógico y 📓 Gratitud.',
    puente: '🌸 Ikigai · 🌳 Árbol Genealógico · 📓 Gratitud · 🌌 Astro (mirar el cielo).',
    trampa: 'Esperar nave, señal o fama para empezar, o cambiar de misión cada semana. La misión pide una cuadra y una década.',
    pregunta: '¿Qué semilla siembro hoy?' }
];
function amiSaber(id) { for (var i = 0; i < AMI_SABERES.length; i++) if (AMI_SABERES[i].id === id) return AMI_SABERES[i]; return null; }

var AMI_PRACTICAS = [
  { id: 'estrellas', n: 'Saludo a las estrellas', ico: '🌌', tiempo: '5 min de noche',
    pasos: '1) Sal sin luz blanca (usa roja o ninguna). 2) Mira el cielo 1 min en silencio. 3) Di en voz alta: gracias + tu misión de mañana. 4) Respira 3 veces hondo imaginando que abrazas al planeta.',
    tip: 'En Penco: Playa Negra, cerro o patio oscuro. Puente: 🔭 Astro y 🌬️ Respiración.' },
  { id: 'amor3', n: '3 amores del día', ico: '❤️', tiempo: '5 min',
    pasos: '1) Mañana promete 0 burlas. 2) Haz 1 ayuda + 1 gracias mirando a los ojos + 1 perdón si hizo falta. 3) Noche: anota los 3 en tu diario.',
    tip: 'Puente: 📓 Gratitud para anotar y 🤝 Convivencia para pedir sin gritar.' },
  { id: 'nuevo', n: 'Invita al que queda fuera', ico: '🤝', tiempo: '10 min',
    pasos: '1) Mira quién queda solo en tu curso, pega o cuadra. 2) Invítalo a algo simple (jugar, once, caminar). 3) Escúchalo 5 min sin interrumpir. 4) Anota cómo cambió tu día.',
    tip: 'Es la federación en chico: tu curso como nave. Si hay bullying grave, avisa a un adulto.' },
  { id: 'planeta', n: '1 bolsa por mi planeta', ico: '🌎', tiempo: '10 min',
    pasos: '1) Lleva bolsa cuando salgas. 2) Recoge 10 min (playa, plaza, calle). 3) Separa lo reciclable. 4) Anota kilos y lugar.',
    tip: 'Puente: 🌊 Territorio y 🤝 Minga. Guantes si hay vidrio.' },
  { id: 'corazon', n: 'Escucha del corazón', ico: '💓', tiempo: '5 min',
    pasos: 'Mano al pecho, 3 respiraciones lentas, pregunta “¿qué siento de verdad?”. Escucha a alguien 5 min mirando a los ojos y repite lo entendido antes de responder.',
    tip: 'Si la cabeza grita (miedo/apuro) y el corazón susurra (calma), sigue al susurro.' },
  { id: 'verdad', n: '1 verdad con ternura', ico: '🦁', tiempo: '3 min',
    pasos: '1) Nombra tu miedo en 1 frase. 2) Respira 3 lentas. 3) Di tu verdad con calma, sin burla ni grito. 4) Si heriste, pide perdón hoy.',
    tip: 'Valiente no es pegar: es decir la verdad con ternura aunque tiemble la voz.' },
  { id: 'abuela', n: 'Ternura en casa', ico: '👵', tiempo: '15 min',
    pasos: '1) Abrazo de 20 segundos. 2) Una comida sin pantallas. 3) Pregunta 1 historia a un mayor y escúchala. 4) Perdón antes de dormir si hubo roce.',
    tip: 'Grábala en 🗣️ Voz de los Abuelos: es tu biblioteca del corazón.' },
  { id: 'oficio', n: 'Mi oficio estelar', ico: '🛠️', tiempo: '20 min, 3 veces por luna',
    pasos: '1) Elige 1 cosa que haces feliz. 2) Practícala 3 veces esta luna con un mayor que sepa. 3) Regala 1 obra a alguien. 4) Anota qué aprendiste.',
    tip: 'Puente: 🌸 Ikigai y 📚 Horario. Todo oficio con amor es estelar.' },
  { id: 'mision', n: 'Carta de mi misión', ico: '🌱', tiempo: '10 min por luna',
    pasos: 'Escribe 5 líneas en presente: quién soy, qué aprendí, qué sueño, qué haré hoy, a quién ayudaré. Léela bajo las estrellas. Guárdala en tu diario.',
    tip: 'Sin “quiero tener”: afirma (“soy, hago, ayudo, agradezco”). Relee cada luna llena.' }
];

var AMI_TEST = [
  { c: 'A', txt: 'Agradezco o digo algo bueno a alguien casi todos los días.' },
  { c: 'E', txt: 'Miro el cielo, me pregunto de dónde venimos o leo para aprender.' },
  { c: 'C', txt: 'Cuido plantas, animales o recojo basura sin que me lo pidan.' },
  { c: 'X', txt: 'Me burlo o pongo sobrenombres que duelen, aunque sea “jugando”.' },
  { c: 'A', txt: 'Pido perdón cuando me equivoco, sin demorarme días.' },
  { c: 'E', txt: 'Escribo o dibujo mis sueños (no solo los pienso).' },
  { c: 'C', txt: 'Ayudo en casa o en el curso sin que me manden.' },
  { c: 'X', txt: 'Paso mucho rato en pantallas o noticias que me dejan mal.' },
  { c: 'A', txt: 'Escucho sin interrumpir cuando alguien me cuenta algo.' },
  { c: 'E', txt: 'Me gusta enseñar a otros lo que aprendo (juego, materia, oficio).' },
  { c: 'C', txt: 'Comparto comida, útiles o tiempo con quien lo necesita.' },
  { c: 'X', txt: 'Me cuesta estar en silencio o a oscuras mirando el cielo.' },
  { c: 'A', txt: 'Abrazo o acompaño a mi familia (abrazos, once, conversa).' },
  { c: 'E', txt: 'Antes de decidir, respiro y escucho mi corazón, no solo el miedo.' },
  { c: 'C', txt: 'Hago algo con mis manos cada semana (cocinar, sembrar, arreglar, arte).' },
  { c: 'X', txt: 'Siento que todo está malo y no hay nada que yo pueda hacer.' },
  { c: 'A', txt: 'Defiendo sin pegar al que se burlan o dejan fuera.' },
  { c: 'E', txt: 'Tengo un cuaderno con mi historia, misión o sueños.' },
  { c: 'C', txt: 'Saludo el día o la noche con gratitud (gracias por hoy).' },
  { c: 'X', txt: 'Discuto o me enojo por tele, redes o política cada semana.' }
];
var AMI_LIKERT = [
  { v: 0, t: 'Nunca' }, { v: 1, t: 'A veces' }, { v: 2, t: 'A menudo' }, { v: 3, t: 'Muy cierto' }
];
var AMI_VIAS = {
  A: { nombre: 'Corazón · Amor que une', ico: '❤️', desc: 'Tu fuerza es la ternura: agradecer, perdonar, abrazar, incluir. Como la abuelita de Pedrito: sanas con presencia. Riesgo: dar tanto que te olvidas de ti.',
       entrena: 'Recarga: saludo a las estrellas + escucha del corazón + 1 perdón pendiente. Dar con taza llena.' },
  E: { nombre: 'Explorador · Ojos a las estrellas', ico: '🔭', desc: 'Tu fuerza es preguntar y contar: leer el cielo, escribir, enseñar, soñar misiones. Como Pedrito escritor: despiertas a otros. Riesgo: volar tanto que olvidas la pieza y la casa.',
       entrena: 'Aterriza cada sueño: carta de misión + 1 oficio estelar + 1 acto por tu cuadra. Soñar + hacer.' },
  C: { nombre: 'Cuidador · Manos al planeta', ico: '🌎', desc: 'Tu fuerza es cuidar lo vivo: recoger, plantar, compartir, reparar. Como Vinka que aprende a cuidar: das casa al futuro. Riesgo: cuidar el planeta y pelear con la gente.',
       entrena: 'Suma ternura: invita al que queda fuera + 1 verdad con amor. Cuidar tierra y gente.' }
};

var AMI_LUNAS = [
  'Lunas 1-3 (Pukem · invierno): leer y abrigar. Libro 1 + saludo a las estrellas + ternura en casa. Pregunta: ¿a quién abrigo con mi amor?',
  'Lunas 4-6 (Pewu · primavera): sembrar y aprender. Libro 2 + escuela con juego + 1 oficio estelar. No te burles de lo nuevo.',
  'Lunas 7-9 (Walung · verano): cuidar y unir. 1 bolsa por mi planeta + invita al que queda fuera. Libro 3. Tu curso como federación.',
  'Lunas 10-13 (Rimu · otoño): contar y sembrar. Escribe tu misión en 5 líneas + cuéntala + planta algo que la represente. Elige tu vía.'
];

/* ============================================================
   DIÁLOGO
   ============================================================ */
function buildDialog() {
  var libroGrid = AMI_LIBROS.map(function (it) {
    return '<button type="button" class="btn ami-lib-card" data-lib="' + it.id + '" style="text-align:left;height:auto;padding:10px">' +
      '<b>' + it.ico + ' ' + esc(it.n) + '</b><br>' +
      '<span class="muted" style="font-size:11px">' + esc(it.tag.split(' ').slice(0, 3).join(' · ')) + '</span></button>';
  }).join('');

  var sabGrid = AMI_SABERES.map(function (it) {
    return '<button type="button" class="btn ami-sab-card" data-sab="' + it.id + '" style="text-align:left;height:auto;padding:10px">' +
      '<b>' + it.ico + ' ' + esc(it.cap) + '</b><br>' +
      '<span class="muted" style="font-size:11px">' + esc(it.libro) + '</span></button>';
  }).join('');

  var testHTML = AMI_TEST.map(function (q, i) {
    var opts = AMI_LIKERT.map(function (o) {
      return '<label class="check-row" style="margin:0;font-size:12px"><input type="radio" name="amiQ' + i + '" value="' + o.v + '"> ' + o.t + '</label>';
    }).join('');
    return '<div class="menstrual-card" style="margin-bottom:8px"><b style="font-size:12px">' + (i + 1) + '. ' + esc(q.txt) + '</b>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' + opts + '</div></div>';
  }).join('');

  var practHTML = AMI_PRACTICAS.map(function (p) {
    return '<div class="menstrual-card"><h4>' + p.ico + ' ' + esc(p.n) + '</h4>' +
      '<p class="muted" style="font-size:11px">⏱ ' + esc(p.tiempo) + '</p>' +
      '<p style="font-size:12px">' + esc(p.pasos) + '</p>' +
      '<p class="muted" style="font-size:12px">💡 ' + esc(p.tip) + '</p>' +
      '<button type="button" class="btn ami-pract-add" data-p="' + esc(p.n) + '" style="width:auto">+ Anotar en mi diario de hoy</button></div>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabAmiGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabAmiLibros" class="btn" style="width:auto">📚 Libros y Enseñanzas</button>' +
    '<button type="button" id="tabAmiPract" class="btn" style="width:auto">🛠️ Prácticas</button>' +
    '<button type="button" id="tabAmiTest" class="btn" style="width:auto">📝 Test del Corazón</button>' +
    '<button type="button" id="tabAmiCamino" class="btn" style="width:auto">🌱 Mi Vuelo</button></div>' +

    '<div id="amiGuia">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🛸 ¿Quién es Ami?</h4>' +
    '<p class="muted" style="font-size:12px;line-height:1.6"><b>Ami</b> es un niño de las estrellas del planeta <b>Ofir</b>, creado por el escritor chileno <b>Enrique Barrios</b> (1986). Una noche de verano aparece en la playa ante <b>Pedrito</b>, un niño chileno de 9 años, y lo lleva a volar en su nave. En 3 libros le muestra mundos felices y mundos que sufren, y le enseña la <b>ley del Amor</b>. Lo acompañan <b>Vinka</b> (niña rescatada de Kía), el primo <b>Víctor</b> y <b>Perlita</b>. La abuelita de Pedrito, que le cree sin reírse, es la ternura que sostiene todo.</p>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">Idea de una línea: <b>el amor se mide en actos</b>. Trata bien, cuida tu planeta, aprende con alegría y cuenta lo aprendido: así subes tu medida y la de la Tierra.</p></div>' +
    '<div class="fishing-grid" style="margin-top:10px">' +
    '<div class="menstrual-card"><h4>🗺️ El mapa en 6 piezas</h4>' +
    '<p class="muted" style="font-size:12px"><b>1) Amor-ley ❤️:</b> lo que une, evoluciona. <b>2) Medida 📏:</b> tu nota de bondad (la Tierra ~500, Ofir 900+). <b>3) Mundos 🪐:</b> Ofir (feliz) vs Kía (sufre): la Tierra elige. <b>4) Hermanos mayores 🤝:</b> ayudan sin imponer. <b>5) Escuela viva 🏫:</b> aprender jugando. <b>6) Misión 🌱:</b> ser bueno y contarlo.</p></div>' +
    '<div class="menstrual-card"><h4>📚 Cómo leer la trilogía (3 libros)</h4>' +
    '<p class="muted" style="font-size:12px">Parte por el <b>1 (encuentro y ley del Amor)</b>. Sigue con el <b>2 (Vinka y amar al diferente)</b>. Cierra con el <b>3 (misión y civilizaciones internas)</b>. Lee de a poco en familia: 1 capítulo + 1 conversa + 1 acto bueno valen más que devorarlos. Ideal para leer con niños (8+).</p></div></div>' +
    '<details class="menstrual-details"><summary>🚶 ¿Cómo practicar sin grupo ni gurú? (rutina mínima)</summary>' +
    '<p class="muted" style="font-size:12px"><b>Noche:</b> saludo a las estrellas 5 min + pregunta del corazón. <b>Día:</b> 0 burlas + 3 amores (gracias, ayuda, perdón). <b>Por luna:</b> 1 enseñanza madre + 1 bolsa por el planeta + 1 invitación al que queda fuera. 15 min diarios bastan; lo chico, repetido, hace federación.</p></details>' +
    '<details class="menstrual-details"><summary>⚠️ Cuidados (léeme)</summary>' +
    '<p class="muted" style="font-size:12px">✅ Esto es <b>literatura educativa</b>, no religión ni terapia. ✅ Nadie serio te pide plata, obediencia ni dice que habla con Ami: desconfía de “contactados” que cobren o separen familias. ✅ No dejes escuela, médico ni remedios por un libro: conversa todo con tu familia, profe y CESFAM (*4141 en Chile, 24 h). Si un ejercicio te angustia, detente, respira, abraza y conversa.</p></details>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌙 Ami × 13 lunas (Penco)</h4><div id="amiLunasBox"></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">Puentes dentro de la app: 🧒 <b>Crianza</b> (ternura) · 🤝 <b>Convivencia</b> (no burla) · 📓 <b>Gratitud</b> (gracias diario) · 🎯 <b>Disciplina</b> (acto diario) · 🔭 <b>Astro</b> (mirar el cielo).</p></div>' +
    '</div>' +

    '<div id="amiLibros" class="hidden">' +
    '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="amiQ" placeholder="ej: amor, Ofir, escuela, miedo, misión, Vinka..." maxlength="40"></label></div>' +
    '<h4 style="margin:10px 0 6px">📚 Los 3 libros (toca para ver su llave)</h4>' +
    '<div id="amiLibGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px">' + libroGrid + '</div>' +
    '<h4 style="margin:12px 0 6px">💫 Las 12 enseñanzas madre (lo esencial para vivirlo)</h4>' +
    '<div id="amiSabGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px">' + sabGrid + '</div>' +
    '<div id="amiDetalle" class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><p class="muted">Toca un libro o una enseñanza para ver su ficha completa 👆</p></div></div>' +

    '<div id="amiPract" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌌 Vuelo nocturno — 3 minutos</h4>' +
    '<p class="muted" style="font-size:12px">Como en la nave de Ami: mira el cielo (o imagínalo), siente tu corazón y abraza al planeta. El botón te marca el tiempo; al terminar anota tu día de vuelo.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button type="button" id="amiVueloBtn" class="btn btn-accent" style="width:auto">▶ Volar ahora (3 min)</button>' +
    '<span id="amiVueloMsg" class="muted" style="font-size:12px"></span></div>' +
    '<div class="conv-row" style="margin-top:8px"><label>Hoy amé… <input type="text" id="amiAmeHoy" placeholder="ej: ayudé a mi mamá + 0 burlas + gracias al profe" maxlength="140"></label></div>' +
    '<div class="conv-row"><label>Hoy cuidé… <input type="text" id="amiCuideHoy" placeholder="ej: regué mi planta + recogí basura en la playa" maxlength="140"></label>' +
    '<label>Hoy aprendí / soñé… <input type="text" id="amiSoneHoy" placeholder="ej: estudié jugando + leí mi misión bajo las estrellas" maxlength="100"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap;gap:8px"><button type="button" id="amiPractSave" class="btn btn-accent" style="width:auto">💾 Guardar día de vuelo</button></div></div>' +
    practHTML + '</div>' +

    '<div id="amiTest" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📝 Test: ¿cómo está tu corazón? (20 afirmaciones)</h4>' +
    '<p class="muted" style="font-size:12px">Responde según <b>cómo vives casi siempre</b>. Escala: Nunca (0) · A veces (1) · A menudo (2) · Muy cierto (3). ~5 minutos. Mide tu <b>Corazón ❤️ · Explorador 🔭 · Cuidador 🌎</b> + tu <b>nivel de miedo/sistema 🌫️</b> (X). <b>No es diagnóstico</b>: es un espejo para elegir por dónde empezar.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="amiTestReset" class="btn" style="width:auto">↺ Limpiar</button>' +
    '<button type="button" id="amiTestCalc" class="btn btn-accent" style="width:auto">📊 Ver mi resultado</button></div>' +
    '<div id="amiProgreso" class="muted" style="font-size:11px;margin-top:6px"></div></div>' +
    '<div id="amiTestBox" style="margin-top:10px">' + testHTML + '</div>' +
    '<div id="amiResultado" class="menstrual-card hidden" style="margin-top:10px;border-color:var(--gold)"></div></div>' +

    '<div id="amiCamino" class="hidden">' +
    '<div class="menstrual-grid"><div class="menstrual-card" style="border-color:var(--gold)"><h4>🌱 Mi vía</h4>' +
    '<div class="conv-row"><label>Mi vía dominante <select id="amiMiVia"><option value="">— sin definir —</option><option value="A">❤️ Corazón · Amor que une</option><option value="E">🔭 Explorador · Ojos a las estrellas</option><option value="C">🌎 Cuidador · Manos al planeta</option></select></label></div>' +
    '<div id="amiMiViaBox" style="margin-top:6px"></div></div>' +
    '<div class="menstrual-card"><h4>📓 Diario del Vuelo</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="amiDiaFecha"></label></div>' +
    '<label>Hoy en mi vuelo… (amé + cuidé + soñé) <input type="text" id="amiDiaTxt" placeholder="ej: 0 burlas, recogí basura, leí mi misión" maxlength="140"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="amiDiaAdd" class="btn btn-accent" style="width:auto">+ Guardar hoy</button></div>' +
    '<div id="amiDiaList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🛸 Mis días de vuelo (racha de amor)</h4><div id="amiPractsBox"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕘 Historial de tests</h4><div id="amiHistBox"></div></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap;gap:8px">' +
    '<span id="amiStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="amiShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="amiToNote" class="btn" style="width:auto">📝 Llevar a nota de hoy</button>' +
    '<button type="button" id="amiClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar todo</button></span></div></div>';

  makeDialog('amiDialog', '🛸 Ami · El niño de las estrellas',
    'La ley del Amor de Enrique Barrios para la vida común: trata bien, cuida tu planeta y cuenta lo aprendido. En Penco, en tu casa, hoy. Todo <b>privado y local</b>.',
    body);
}

function renderLunasBox() {
  var box = $('amiLunasBox'); if (!box) return;
  box.innerHTML = AMI_LUNAS.map(function (t) {
    return '<div class="si-card"><p>' + esc(t) + '</p></div>';
  }).join('');
}

function renderDetalleLibro(id) {
  var box = $('amiDetalle'); if (!box) return;
  var t = amiLibro(id); if (!t) return;
  box.innerHTML =
    '<h4 style="color:var(--gold)">' + t.ico + ' ' + esc(t.n) + '</h4>' +
    '<p style="font-size:12px;line-height:1.6">' + esc(t.resumen) + '</p>' +
    '<div class="si-card"><h4>🔑 Llave para hoy</h4><p>' + esc(t.llave) + '</p></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
    '<button type="button" class="btn btn-accent" id="amiLeerBtn" style="width:auto">✓ Leer este esta luna</button></div>';
  var hb = $('amiLeerBtn');
  if (hb) hb.onclick = function () {
    var k = todayKey();
    var d = store();
    d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '📚 Esta luna leo: ' + t.n + ' — ' + t.llave;
    save('Libro llevado a tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
  };
}

function renderDetalle(id) {
  var box = $('amiDetalle'); if (!box) return;
  var t = amiSaber(id); if (!t) return;
  var e = store();
  var fav = e.favs.indexOf(id) >= 0;
  function sec(ico, tit, val) {
    if (!val) return '';
    return '<div class="si-card" style="margin-top:8px"><h4>' + ico + ' ' + tit + '</h4><p>' + esc(val) + '</p></div>';
  }
  box.innerHTML =
    '<h4 style="color:var(--gold)">' + t.ico + ' ' + esc(t.cap) + ' <span class="muted" style="font-size:11px">· ' + esc(t.libro) + '</span></h4>' +
    '<blockquote class="dlg-quote" style="font-size:12px">' + esc(t.texto) + '</blockquote>' +
    '<p style="font-size:12px;line-height:1.6">' + esc(t.idea) + '</p>' +
    sec('📖', 'Lo que cuenta el libro', t.historia) +
    sec('⚙️', 'Cómo funciona según Ami', t.como) +
    '<p style="font-size:12px">🧰 <b>¿Cuándo sirve?</b> ' + esc(t.sirve) + '</p>' +
    '<div class="si-card"><h4>✏️ Práctica de hoy</h4><p>' + esc(t.practica) + '</p>' +
    (t.pasos ? '<p style="margin-top:6px"><b>Paso a paso:</b><br>' + esc(t.pasos) + '</p>' : '') +
    '<p class="muted">Pregunta que despierta: <i>' + esc(t.pregunta) + '</i></p></div>' +
    sec('🗣️', 'Frases para decir en voz alta', t.frases) +
    sec('🌱', 'Señal de que avanza', t.senal) +
    sec('📍', 'En Penco (adáptalo así)', t.penco) +
    sec('🔗', 'Sigue en la app', t.puente) +
    '<p class="muted" style="font-size:12px">⚠️ Trampa típica: ' + esc(t.trampa) + '</p>' +
    '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
    '<button type="button" class="btn" id="amiFavBtn" style="width:auto">' + (fav ? '★ Quitar de favoritas' : '☆ Marcar favorita') + '</button>' +
    '<button type="button" class="btn btn-accent" id="amiHoyBtn" style="width:auto">✓ Vivir esta hoy</button></div>';
  var fb = $('amiFavBtn');
  if (fb) fb.onclick = function () {
    var d = store();
    var i = d.favs.indexOf(id);
    if (i >= 0) d.favs.splice(i, 1); else d.favs.push(id);
    save(); renderDetalle(id);
  };
  var hb = $('amiHoyBtn');
  if (hb) hb.onclick = function () {
    var k = todayKey();
    var d = store();
    d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🛸 Hoy vivo: ' + t.cap + ' — ' + t.pregunta;
    save('Enseñanza llevada a tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
  };
}

function filterSaberes() {
  var q = (($('amiQ') || {}).value || '').toLowerCase();
  document.querySelectorAll('#amiLibGrid .ami-lib-card').forEach(function (card) {
    var t = amiLibro(card.dataset.lib);
    if (!t) return;
    var hay = ((t.n + ' ' + t.tag + ' ' + t.resumen + ' ' + t.llave).toLowerCase().indexOf(q) >= 0);
    card.style.display = hay ? '' : 'none';
  });
  document.querySelectorAll('#amiSabGrid .ami-sab-card').forEach(function (card) {
    var t = amiSaber(card.dataset.sab);
    if (!t) return;
    var hay = ((t.cap + ' ' + t.tag + ' ' + t.idea + ' ' + t.texto + ' ' + t.libro + ' ' + (t.historia || '') + ' ' + (t.como || '') + ' ' + (t.penco || '')).toLowerCase().indexOf(q) >= 0);
    card.style.display = hay ? '' : 'none';
  });
}

function calcTest() {
  var sc = { A: 0, E: 0, C: 0, X: 0 };
  var contestadas = 0;
  for (var i = 0; i < AMI_TEST.length; i++) {
    var sel = document.querySelector('input[name="amiQ' + i + '"]:checked');
    if (sel) { contestadas++; sc[AMI_TEST[i].c] += +sel.value; }
  }
  return { sc: sc, contestadas: contestadas };
}
function updateProgreso() {
  var r = calcTest();
  var box = $('amiProgreso');
  if (box) box.textContent = r.contestadas + ' / ' + AMI_TEST.length + ' respondidas' + (r.contestadas < AMI_TEST.length ? ' — responde todas para un espejo fiel' : ' ✓ listo para calcular');
}
function showResultado(sc) {
  var box = $('amiResultado'); if (!box) return;
  var arr = [{ k: 'A', p: sc.A }, { k: 'E', p: sc.E }, { k: 'C', p: sc.C }];
  arr.sort(function (a, b) { return b.p - a.p; });
  var max = Math.max(arr[0].p, 1);
  var dom = arr[0].k;
  var sistema = sc.X;
  var sisTxt = sistema <= 5 ? 'Liviano: el miedo te frena poco. Sostén con 1 acto de amor diario.' : sistema <= 9 ? 'Medio: burlas, pantallas y apuro frecuentes. 1 noche de estrellas + 1 ayuda te cambian la luna.' : 'Pesado: mucho miedo y poca ternura. Parte por 1 gracias + 1 escucha, sin exigirte todo.';
  box.classList.remove('hidden');
  box.innerHTML = '<h4>📊 Tu espejo (sin guardar)</h4>' +
    '<p class="muted" style="font-size:11px">Máximo por vía: 15 (5 preguntas × 3). Miedo/sistema (X): máximo 15 — mientras más alto, más burla, miedo y ruido.</p>' +
    arr.map(function (a) {
      var c = AMI_VIAS[a.k];
      var pct = Math.round(a.p / max * 100);
      var isTop = dom === a.k;
      return '<div style="display:flex;align-items:center;gap:8px;margin:4px 0">' +
        '<span style="min-width:150px;font-size:12px"><b>' + c.ico + ' ' + esc(c.nombre) + '</b></span>' +
        '<span style="flex:1;background:var(--panel);border:1px solid var(--line);border-radius:6px;height:14px;position:relative;overflow:hidden">' +
        '<span style="display:block;height:100%;width:' + pct + '%;background:' + (isTop ? 'var(--gold)' : 'var(--accent)') + ';opacity:' + (isTop ? '1' : '.55') + '"></span></span>' +
        '<b style="min-width:30px;text-align:right">' + a.p + '</b></div>';
    }).join('') +
    '<div class="si-card" style="margin-top:8px"><h4>' + AMI_VIAS[dom].ico + ' Tu vía fuerte: ' + esc(AMI_VIAS[dom].nombre) + '</h4>' +
    '<p>' + esc(AMI_VIAS[dom].desc) + '</p><p><b>Entrena así:</b> ' + esc(AMI_VIAS[dom].entrena) + '</p>' +
    '<p class="muted">🌫️ Nivel de miedo/sistema: <b>' + sistema + '/15</b> — ' + esc(sisTxt) + '</p></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn btn-accent" id="amiSaveTest" style="width:auto">💾 Guardar este test</button>' +
    '<button type="button" class="btn" id="amiSetVia" style="width:auto">✓ Mi vía: ' + esc(AMI_VIAS[dom].nombre) + '</button>' +
    '<button type="button" class="btn" id="amiReadSab" style="width:auto">📖 Leer enseñanza que me sirve</button></div>';
  var sv = $('amiSaveTest');
  if (sv) sv.onclick = function () {
    var d = store();
    d.tests.push({ id: uid('t'), fecha: todayKey(), A: sc.A, E: sc.E, C: sc.C, X: sc.X, dom: dom });
    save('Test guardado ✓'); renderHist(); renderStats();
  };
  var st = $('amiSetVia');
  if (st) st.onclick = function () {
    var d = store(); d.miVia = dom; save('Tu vía guardada ✓');
    syncMiVia(); renderMiViaBox(); renderStats(); switchTab('Camino');
  };
  var ri = $('amiReadSab');
  if (ri) ri.onclick = function () {
    var map = { A: 'familia', E: 'mision', C: 'planeta' };
    if (sistema >= 10) map[dom] = 'miedo';
    switchTab('Libros'); renderDetalle(map[dom] || 'amor');
  };
  try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}

function syncMiVia() {
  var sel = $('amiMiVia'); if (!sel) return;
  sel.value = store().miVia || '';
}
function renderMiViaBox() {
  var box = $('amiMiViaBox'); if (!box) return;
  var k = store().miVia || '';
  if (!k || !AMI_VIAS[k]) { box.innerHTML = '<p class="muted" style="font-size:12px">Aún sin definir. Haz el test 📝 o elígela arriba: es tu punto de partida, no tu jaula.</p>'; return; }
  var c = AMI_VIAS[k];
  box.innerHTML = '<div class="chip" style="display:block;white-space:normal;line-height:1.5"><b>' + c.ico + ' ' + esc(c.nombre) + '</b><br>' +
    '<span class="muted">' + esc(c.desc) + '<br><b>Entrena:</b> ' + esc(c.entrena) + '</span></div>';
}
function rachaPracts() {
  var set = {};
  (store().practs || []).forEach(function (r) { set[r.fecha] = true; });
  var s = 0, d = new Date();
  for (var i = 0; i < 365; i++) {
    var k;
    try { k = cal.fmtKey.format(d); } catch (e) { k = d.toISOString().slice(0, 10); }
    if (set[k]) { s++; d.setDate(d.getDate() - 1); }
    else if (i === 0) { d.setDate(d.getDate() - 1); continue; }
    else break;
  }
  return s;
}
function renderPracts() {
  var box = $('amiPractsBox'); if (!box) return;
  var d = store().practs || [];
  var ult7 = d.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 7);
  box.innerHTML = '<p class="muted" style="font-size:11px">🛸 Racha: <b>' + rachaPracts() + ' días</b> · ' + d.length + ' día(s) de vuelo · amé → cuidé → soñé.</p>' +
    (ult7.length ? ult7.map(function (r) {
      return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b><br>' +
        (r.ame ? '❤️ ' + esc(r.ame) + '<br>' : '') + (r.cuide ? '🌎 ' + esc(r.cuide) + '<br>' : '') + (r.sone ? '🌱 ' + esc(r.sone) : '') + '</span>' +
        '<button type="button" class="btn btn-icon ami-pract-del" data-id="' + r.id + '">✕</button></div>';
    }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin días aún. Guarda tu primer día de vuelo arriba 🛸.</p>');
  box.querySelectorAll('.ami-pract-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.practs = e.practs.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderPracts(); renderStats(); };
  });
}
function renderDiario() {
  var box = $('amiDiaList'); if (!box) return;
  var d = store().diario || {};
  var keys = Object.keys(d).sort().reverse().slice(0, 30);
  if (!keys.length) { box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin registros. 3 líneas bastan: amé + cuidé + soñé.</p>'; return; }
  box.innerHTML = keys.map(function (k) {
    return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(k) + '</b><br>' + esc(d[k]) + '</span>' +
      '<button type="button" class="btn btn-icon ami-dia-del" data-k="' + esc(k) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.ami-dia-del').forEach(function (x) {
    x.onclick = function () { var e = store(); delete e.diario[x.dataset.k]; save(); renderDiario(); renderStats(); };
  });
}
function renderHist() {
  var box = $('amiHistBox'); if (!box) return;
  var t = (store().tests || []).slice().reverse().slice(0, 10);
  if (!t.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin tests guardados. Responde y pulsa “💾 Guardar este test”.</p>'; return; }
  box.innerHTML = t.map(function (r) {
    return '<div class="hora-item"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b> · ❤️' + r.A + ' 🔭' + r.E + ' 🌎' + r.C + ' · fuerte <b>' + esc(r.dom || '') + '</b> · miedo ' + esc(String(r.X)) + '/15</span>' +
      '<button type="button" class="btn btn-icon ami-hist-del" data-id="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.ami-hist-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.tests = e.tests.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderHist(); renderStats(); };
  });
}
function renderStats() {
  var st = $('amiStats'); if (!st) return;
  var e = store();
  var nd = Object.keys(e.diario || {}).length;
  var c = e.miVia ? AMI_VIAS[e.miVia].nombre : 'sin vía';
  st.textContent = (e.tests.length ? e.tests.length + ' test(s)' : 'sin tests') + ' · ' + nd + ' día(s) diario · ' + e.practs.length + ' día(s) de vuelo · ' + c;
}

/* Vuelo timer 3 min */
var amiVueloTimer = null;
function runVuelo() {
  var msg = $('amiVueloMsg'), btn = $('amiVueloBtn');
  if (!msg) return;
  if (amiVueloTimer) { clearInterval(amiVueloTimer); amiVueloTimer = null; if (btn) btn.textContent = '▶ Volar ahora (3 min)'; msg.textContent = ''; return; }
  var seg = 180;
  if (btn) btn.textContent = '⏹ Aterrizar';
  msg.textContent = 'Despegamos… 3:00 (mira o imagina las estrellas)';
  amiVueloTimer = setInterval(function () {
    seg--;
    if (seg <= 0) {
      clearInterval(amiVueloTimer); amiVueloTimer = null;
      if (btn) btn.textContent = '▶ Volar ahora (3 min)';
      msg.textContent = '✓ Aterrizaje suave. ¿Qué te dijo tu corazón arriba? Anota tu día abajo.';
      try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
      return;
    }
    var m = Math.floor(seg / 60), s = seg % 60;
    if (seg === 90) msg.textContent = 'Abraza al planeta desde arriba… 1:30';
    else if (seg === 30) msg.textContent = 'Volvemos suave a casa… 0:30';
    else msg.textContent = 'Vuela y siente… ' + m + ':' + String(s).padStart(2, '0');
  }, 1000);
}

function openAmi() {
  try {
    if ($('amiDiaFecha') && !$('amiDiaFecha').value) $('amiDiaFecha').value = todayKey();
    syncMiVia(); renderMiViaBox(); renderDiario(); renderHist(); renderPracts(); renderStats(); updateProgreso();
  } catch (e) {}
  openDlg('amiDialog');
}
try { window.openAmi = openAmi; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar botón en Linaje > Interior (tras Anastasia si existe) */
  try {
    if (!$('btnAmi')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnAmi'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🛸 Ami';
        try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'ami niño estrellas barrios pedrito ofir vinka victor perlita kia amor medida 750 mundos evolucionados federacion hermanos mayores escuela amor ecologia planeta mision semilla corazon miedo ego familia abuelita trabajo alegria unidad cuento infantil lectura niños');
        var ref = g.querySelector('#btnAnastasia') || g.querySelector('#btnTao') || g.querySelector('#btnTolteca');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnAmi');
        var curG = cur.closest ? cur.closest('.action-group') : null;
        var curN = curG && curG.getAttribute ? curG.getAttribute('data-group') : null;
        if (curN && curN !== 'linaje') {
          var gd = document.querySelector('.action-group[data-group="linaje"] .group-btns');
          if (gd) { gd.appendChild(cur); try { cur.setAttribute('data-sub', 'interior'); } catch (eS) {} }
        }
      } catch (eM) {}
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnAmi') < 0) ALL_BTNS.push('btnAmi');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnAmi = ['linaje', 'interior'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|interior'] && BTN_ORDER['linaje|interior'].indexOf('btnAmi') < 0) {
      var oi = BTN_ORDER['linaje|interior'].indexOf('btnAnastasia');
      if (oi >= 0) BTN_ORDER['linaje|interior'].splice(oi + 1, 0, 'btnAmi');
      else BTN_ORDER['linaje|interior'].push('btnAmi');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnAmi = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnAmi"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnAmi"> 🛸 Ami';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnAmi !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnAmi = lab.querySelector('input').checked;
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
  try { addKw('btnTales', 'ami cuento estrellas niños pedrito ofir'); } catch (e2) {}
  try { addKw('btnCrianza', 'ami amor ternura niños escuela juego vinka'); } catch (e3) {}
  try { addKw('btnAstro', 'ami estrellas ofir cielo nave federacion'); } catch (e4) {}

  /* 4) diálogo */
  buildDialog();
  renderLunasBox();
  syncMiVia();
  renderMiViaBox();
  renderDiario();
  renderHist();
  renderPracts();
  renderStats();

  var b = $('btnAmi');
  if (b) b.onclick = function () { openAmi(); };

  ['Guia', 'Libros', 'Pract', 'Test', 'Camino'].forEach(function (t) {
    var tb = $('tabAmi' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var q = $('amiQ'); if (q) q.oninput = filterSaberes;
  document.querySelectorAll('#amiLibGrid .ami-lib-card').forEach(function (card) {
    card.onclick = function () { renderDetalleLibro(card.dataset.lib); };
  });
  document.querySelectorAll('#amiSabGrid .ami-sab-card').forEach(function (card) {
    card.onclick = function () { renderDetalle(card.dataset.sab); };
  });
  document.querySelectorAll('.ami-pract-add').forEach(function (bp) {
    bp.onclick = function () {
      var k = todayKey();
      var d = store();
      d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🛠️ Practiqué: ' + bp.dataset.p;
      save('Práctica anotada en tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
    };
  });

  var sb = $('amiVueloBtn'); if (sb) sb.onclick = runVuelo;
  var ps = $('amiPractSave');
  if (ps) ps.onclick = function () {
    var am = clean((($('amiAmeHoy') || {}).value || ''), 140);
    var cu = clean((($('amiCuideHoy') || {}).value || ''), 140);
    var so = clean((($('amiSoneHoy') || {}).value || ''), 100);
    if (!am && !cu && !so) { alert('Escribe al menos qué amaste, cuidaste o soñaste hoy 🛸'); return; }
    var e = store();
    e.practs = e.practs.filter(function (r) { return r.fecha !== todayKey(); });
    e.practs.push({ id: uid('p'), fecha: todayKey(), ame: am, cuide: cu, sone: so });
    var txt = '🛸 Día de vuelo';
    if (am) txt += ' · ❤️ ' + am;
    if (cu) txt += ' · 🌎 ' + cu;
    if (so) txt += ' · 🌱 ' + so;
    e.diario[todayKey()] = (e.diario[todayKey()] ? e.diario[todayKey()] + ' | ' : '') + txt;
    save('Día de vuelo guardado ✓');
    if ($('amiAmeHoy')) $('amiAmeHoy').value = '';
    if ($('amiCuideHoy')) $('amiCuideHoy').value = '';
    if ($('amiSoneHoy')) $('amiSoneHoy').value = '';
    renderPracts(); renderDiario(); renderStats();
  };

  var tc = $('amiTestCalc');
  if (tc) tc.onclick = function () {
    var r = calcTest();
    if (r.contestadas < AMI_TEST.length) { alert('Te faltan ' + (AMI_TEST.length - r.contestadas) + ' por responder para un espejo fiel 🛸'); }
    showResultado(r.sc);
  };
  var tr = $('amiTestReset');
  if (tr) tr.onclick = function () {
    for (var i = 0; i < AMI_TEST.length; i++) {
      document.querySelectorAll('input[name="amiQ' + i + '"]').forEach(function (x) { x.checked = false; });
    }
    var rb = $('amiResultado'); if (rb) rb.classList.add('hidden');
    updateProgreso();
  };
  document.querySelectorAll('#amiTestBox input[type="radio"]').forEach(function (x) {
    x.onchange = updateProgreso;
  });

  var ma = $('amiMiVia');
  if (ma) ma.onchange = function () { var e = store(); e.miVia = ma.value || ''; save('Tu vía guardada ✓'); renderMiViaBox(); renderStats(); };
  var da = $('amiDiaAdd');
  if (da) da.onclick = function () {
    var f = ($('amiDiaFecha') || {}).value || todayKey();
    var t = clean((($('amiDiaTxt') || {}).value || ''), 300);
    if (!t) { alert('Escribe 1 línea de tu vuelo de hoy 🛸'); return; }
    var e = store();
    e.diario[f] = (e.diario[f] ? e.diario[f] + ' | ' : '') + t;
    save('Diario guardado ✓');
    if ($('amiDiaTxt')) $('amiDiaTxt').value = '';
    renderDiario(); renderStats();
  };
  var sh = $('amiShare');
  if (sh) sh.onclick = function () {
    var e = store();
    var nd = Object.keys(e.diario || {}).length;
    var c = e.miVia ? AMI_VIAS[e.miVia].nombre : 'vía por definir';
    share('🛸 Mi vuelo con Ami', 'Ami · El niño de las estrellas · ' + c + '\n🛸 Racha: ' + rachaPracts() + ' días · ' + e.practs.length + ' días de vuelo · ' + nd + ' días de diario · ' + e.tests.length + ' test(s).\n' + AMI_LUNAS[0]);
  };
  var tn = $('amiToNote');
  if (tn) tn.onclick = function () {
    try {
      var e = store();
      var c2 = e.miVia ? AMI_VIAS[e.miVia].nombre : 'crecer en amor cada día';
      var txt2 = '🛸 Ami (' + c2 + ') · racha ' + rachaPracts() + 'd · ' + (e.diario[todayKey()] || 'hoy amé, cuidé y soñé');
      if (typeof appendToTodayNote === 'function') { appendToTodayNote(txt2); save('Llevado a tu nota de hoy ✓'); }
      else if (typeof userData === 'function') {
        var u = userData();
        u.notas = u.notas || {}; var k = todayKey();
        u.notas[k] = u.notas[k] || {}; u.notas[k].nota = ((u.notas[k].nota || '') + '\n' + txt2).trim();
        save('Llevado a tu nota de hoy ✓');
      }
    } catch (e) {}
  };
  var cl = $('amiClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar todo tu vuelo (tests, diario, días, favoritas)?')) return;
    try {
      var u = (typeof userData === 'function') ? userData() : null;
      if (u) u.ami = blank();
    } catch (e) {}
    syncMiVia(); renderMiViaBox(); renderDiario(); renderHist(); renderPracts(); renderStats();
    save('Vuelo borrado');
  };

  updateProgreso();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
else setup();

})();
