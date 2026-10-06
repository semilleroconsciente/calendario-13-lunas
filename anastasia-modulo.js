/* ============================================================
   ANASTASIA · CEDROS RESONANTES — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente sobre el libro
   "Los Cedros Resonantes de Rusia" de Vladimir Megre:
   - Botón btnAnastasia (grupo Linaje > Interior, tras btnTao)
   - Diálogo anastasiaDialog con 5 pestañas:
     1) Guía (quién es Anastasia, Megre y la taiga, vedas rusos,
        cedro resonante, Espacio de Amor, hacienda familiar 1 ha,
        cómo leer sin grupo ni gurú, cuidados)
     2) Libros y Saberes (los 10 libros + 12 saberes madre con
        buscador + detalle + favorita + "vivir hoy")
     3) Prácticas (9 prácticas del Espacio de Amor + silencio
        de taiga 3 min + registro diario)
     4) Test (20 afirmaciones: ¿jardinero, soñador o creador?
        + nivel de prisa/sistema)
     5) Mi Espacio (mi vía, diario, prácticas, historial,
        racha, compartir, llevar a nota, borrar)
   - Todo local y privado por usuario: userData().anastasia
     { tests:[], miVia:'', practs:[], diario:{}, favs:[] }
   - Puentes: Siembra lunar (🌱), Bosque Nativo (🌳), Lawen (🌿),
     Crianza/Huerta, Gratitud (📓), Disciplina (🎯).
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
    if (!u.anastasia) u.anastasia = blank();
    var e = u.anastasia;
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
    var p = $('ana' + t), b = $('tabAna' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ============================================================
   DATOS — 10 libros de la serie (resumen educativo breve)
   ============================================================ */
var ANA_LIBROS = [
  { id: 'l1', n: 'Libro 1 · Anastasia (1996)', ico: '🌲', tag: 'encuentro taiga Ob cedro resonante origen',
    resumen: 'El empresario Vladimir Megre sube el río Ob buscando el cedro resonante y conoce a Anastasia, joven de la taiga que vive sin nada y lo tiene todo. Tres días de revelaciones le cambian la vida: deja el comercio y se va a Moscú a escribir, sin dinero, lo vivido.',
    llave: 'La felicidad no se compra: se crea con pensamiento claro y contacto vivo con la tierra.' },
  { id: 'l2', n: 'Libro 2 · Los Cedros Resonantes (1997)', ico: '🔔', tag: 'cedros resonantes energia curacion aceite piñon',
    resumen: 'Anastasia explica el cedro que zumba/resuena: acumula energía del cosmos y la devuelve a quien lo cuida. Su aceite, piñón y hasta una tablita en casa sanan cuerpo y ánimo. Megre comprueba en Moscú que el sueño de Anastasia ya se cumple solo.',
    llave: 'Un árbol cuidado con amor es botiquín, antena y maestro a la vez.' },
  { id: 'l3', n: 'Libro 3 · El Espacio del Amor (1998)', ico: '💚', tag: 'espacio amor familia hacienda una hectarea concepcion',
    resumen: 'El corazón de la serie: cada familia merece crear su Espacio de Amor. Anastasia tiene a su hijo y enseña la concepción consciente, el parto sin miedo y la lactancia como transmisión de saber. El amor de pareja crea mundos cuando hay tierra donde anclarlo.',
    llave: 'Amor + tierra + hijo esperado = futuro nuevo.' },
  { id: 'l4', n: 'Libro 4 · La Co-creación (1999)', ico: '🌅', tag: 'cocreacion Adan Eva vedas historia jardin Eden',
    resumen: 'Relectura de Adán y Eva y de la historia védica: el ser humano fue creado para co-crear con Dios, no para obedecer por miedo. El sistema actual nos cortó de esa memoria. Recuperarla es volver a ser jardineros del paraíso.',
    llave: 'No somos culpables: somos creadores olvidados.' },
  { id: 'l5', n: 'Libro 5 · ¿Quiénes somos? (2001)', ico: '🪞', tag: 'quienes somos sacerdotes sistema poder pensamiento',
    resumen: 'Quién maneja al mundo: no los presidentes, sino las imágenes que nos hacen creer. Los antiguos sacerdotes programan con miedo y prisa. Salir es pensar por uno mismo y verificar en la propia vida, no en la tele.',
    llave: 'Si una idea te da miedo y prisa, revísala: quizá no es tuya.' },
  { id: 'l6', n: 'Libro 6 · El Libro del Linaje (2002)', ico: '📖', tag: 'linaje familia libro parentesco antepasados memoria',
    resumen: 'Cada familia debe escribir su propio Libro del Linaje: quiénes somos, qué soñamos, qué tierra cuidamos. Sin memoria no hay futuro: los hijos necesitan saber de dónde vienen para saber a dónde van.',
    llave: 'Escribe tu historia o el sistema la escribirá por ti.' },
  { id: 'l7', n: 'Libro 7 · La Energía de la Vida (2003)', ico: '⚡', tag: 'energia vida alimentacion sueño sexo sentido',
    resumen: 'Dónde se va tu energía: comida muerta, sexo sin amor, sueños ajenos, trabajo sin sentido. Cómo recuperarla: alimento vivo, pensamientos claros, descanso real y un propósito que te levante contento.',
    llave: 'Cuida tu energía como cuidas tu plata: no la regales.' },
  { id: 'l8a', n: 'Libro 8.1 · La Nueva Civilización (2005)', ico: '🏡', tag: 'nueva civilizacion ecoaldeas haciendas Tekos escuela',
    resumen: 'Miles de lectores ya crean haciendas familiares y ecoaldeas en Rusia y el mundo. Se muestra la escuela de Tekos (Shchetinin): niños que en un año aprenden lo de diez, construyendo, sembrando y enseñando a otros.',
    llave: 'Otro mundo ya existe: son vecinos plantando.' },
  { id: 'l8b', n: 'Libro 8.2 · Los Ritos del Amor (2006)', ico: '💍', tag: 'ritos amor boda novios fiesta creacion pareja',
    resumen: 'Cómo enamorarse, casarse y crear sin copiar fiestas caras ni ritos vacíos: ritos vivos creados por los novios, con tierra, árboles y comunidad de testigo. El amor necesita ceremonia propia, no importada.',
    llave: 'Tu amor merece su propio rito, no el del mall.' },
  { id: 'l10', n: 'Libro 10 · Anasta (2010)', ico: '🌸', tag: 'Anasta hija nieta futuro sueño cumplido',
    resumen: 'Cierre con Anasta, la nieta: el sueño ya camina solo. Los niños del futuro nacen en Espacios de Amor y traen respuestas que los mayores olvidaron. Mensaje final: planta hoy aunque no veas el bosque.',
    llave: 'Siembra para tus nietos: el bosque te alcanza.' }
];
function anaLibro(id) { for (var i = 0; i < ANA_LIBROS.length; i++) if (ANA_LIBROS[i].id === id) return ANA_LIBROS[i]; return null; }

/* 12 saberes madre (lo esencial para vivirlo en Penco) */
var ANA_SABERES = [
  { id: 'cedro', cap: '1 · El Cedro Resonante', ico: '🌲', libro: 'Libros 1–2', tag: 'cedro resonante zumba energia curacion aceite piñon taiga Biblia Pallas',
    texto: '“Cuando el cedro acumula suficiente energía del cosmos, empieza a zumbar. Ese es el cedro resonante: pide ser cortado para entregar su fuerza a la gente.”',
    idea: 'El cedro siberiano es el árbol sagrado de la serie: vive 500 años, no se enferma y guarda energía del sol y las estrellas como una batería viva. Cuando ya no puede sostenerla, vibra y zumba: entonces se corta con respeto y su madera, aceite y piñón reparten esa fuerza. En Penco no tenemos cedro siberiano, pero el principio es el mismo con peumo, arrayán, canelo y quillay: un árbol viejo y sano ordena el aire, el agua y el ánimo de todo el barrio.',
    historia: 'Dos ancianos del Ob le cuentan a Megre que un trocito de cedro resonante cambia a las personas: Lidia Petrovna, 36 años, se vuelve más risueña y benevolente. En el hospital, Megre verifica en libros de medicina popular y en Pallas (1792): el piñón devuelve vigor y juventud, la madera ahuyenta polillas y limpia el aire, y en 5 km a la redonda del cedral no hay enfermedad. La Biblia lo nombra 42 veces solo en el Antiguo Testamento, siempre como medicina primera.',
    como: 'Anastasia lo explica así: el árbol capta lo que el humano no alcanza a procesar (radiación, ruido, apuro) y lo devuelve ordenado como calma y defensas. Funciona en tres vías: aire (fitoncidas que desinfectan), alimento (piñón completo en aminoácidos y aceite vivo) y contacto (tablita al pecho o paseo diario que baja el pulso). No tala por codicia: pide permiso, corta solo el que zumba y planta tres por cada uno.',
    sirve: 'Casas encerradas con humo a leña, inviernos con resfríos encadenados, ansiedad que solo se calma en el bosque, barrios sin sombra, niños que no conocen un árbol grande.',
    practica: 'Adopta o planta 1 nativo esta luna y visítalo cada semana. Si no tienes tierra: cuida 1 árbol de tu calle todo el ciclo.',
    pasos: '1) Elige: peumo, arrayán, canelo o quillay (vivero local). 2) Hoyo 40x40 con compost, planta con las manos y riega lento. 3) Ponle nombre y promesa en voz alta. 4) Visítalo cada luna: abraza 1 minuto, respira hondo, anota cómo está.',
    frases: '“Gracias por limpiar mi aire.” / “Crecemos juntos.” / “Tomo tu fuerza y te cuido.”',
    senal: 'Duermes más hondo, te resfrías menos, buscas el árbol sin pensarlo y los pájaros vuelven a tu cuadra.',
    penco: 'Cerro, Quebrada Honda, borde costero: planta en Pukem con lluvia. En depa: macetero con arrayán enano o cuida el árbol de la vereda y denuncia si lo mutilan.',
    puente: '🌳 Bosque Nativo (ficha tu árbol) · 🌱 Siembra lunar (fecha de plantación) · 🌬️ Respiración (paseo consciente).',
    trampa: 'Comprar aceite caro creyendo que sana solo, o talar nativo para “limpiar”. Sin cambio de vida y sin plantar, el frasco no hace milagros.',
    pregunta: '¿Qué árbol me está esperando para cuidarlo?' },
  { id: 'espacio', cap: '2 · El Espacio de Amor', ico: '💚', libro: 'Libro 3', tag: 'espacio amor creacion viva entorno familia naturaleza taiga padres',
    texto: '“El nivel espiritual de una persona se ve en el entorno que ha creado a su alrededor.”',
    idea: 'Es la idea madre de toda la saga: tu casa y tu tierra son tu espejo. Un Espacio de Amor es una creación viva pensada con amor e inteligencia, donde la familia crece, aprende y se enriquece con la naturaleza como maestra. Anastasia vive en el que sus padres crearon para ella: ahí lo tiene todo sin necesitar nada nuestro. No se compra hecho: se crea de a poco, con las manos y con imágenes claras, hasta que el lugar te devuelve fuerza en vez de quitártela.',
    historia: 'Anastasia muestra a Megre su claro en la taiga: sin casa, sin bodega, sin ruido, y sin embargo con comida, abrigo, remedios y calma todo el año. Sus padres lo diseñaron antes de que ella naciera: dónde duerme, dónde bebe, qué plantas la esperan. Megre entiende que su departamento en la ciudad, lleno de cosas, le da menos vida que ese claro vacío. De ahí nace el desafío: cada familia puede crear lo mismo donde esté.',
    como: 'Funciona por correspondencia: lo que ordenas afuera se ordena adentro. Un lugar con verde, agua, tierra suelta y rincones de silencio baja el cortisol, mejora el sueño y une a la familia porque todos cuidan algo común. Al revés, el desorden y el cemento suben la irritación. El Espacio se crea en capas: limpiar, plantar, habitar (sentarse a diario), bendecir (agradecer en voz alta) y heredar (pensarlo para los nietos).',
    sirve: 'Patios de cemento, arriendos chicos sin alma, casas donde todos pelean, ganas de irse al campo sin saber cómo, duelo o cesantía que piden empezar de nuevo.',
    practica: 'Elige 1 m² hoy: límpialo, pon 1 planta o semilla y siéntate ahí 5 min. Ese es tu embrión de Espacio.',
    pasos: '1) Mira tu casa y marca el rincón más botado. 2) Saca todo, limpia y deja solo lo útil y bello. 3) Pon vida: 1 planta, 1 semilla o 1 piedra linda. 4) Habítalo 5 min diarios (té, respiro, lectura). 5) Cada luna agrégale algo: otra planta, un palo con tu sueño, una foto.',
    frases: '“Este lugar me ama y yo lo amo.” / “Aquí crece mi familia.” / “Gracias por sostenerme.”',
    senal: 'Llegas y respiras hondo sin darte cuenta, los niños buscan ese rincón, las plantas prenden y te cuesta irte.',
    penco: 'Depto o allegado: balcón, ventana con hierbas y 1 m² de patio compartido. Casa: fondo con 3 frutales + hierbas + silla al sol. Toma nota en 🏡 Hogar y pide hora en 🌱 Siembra para fechas.',
    puente: '🏡 Tareas Hogar (orden por piezas) · 🌱 Siembra lunar · 📓 Gratitud (bendecir el lugar).',
    trampa: 'Esperar la hectárea perfecta para empezar, o llenarlo de adornos comprados. El Amor empieza en 1 m² y con las manos, no con la tarjeta.',
    pregunta: '¿Qué rincón pide mi amor hoy?' },
  { id: 'hectarea', cap: '3 · La Hacienda Familiar (1 ha)', ico: '🏡', libro: 'Libros 3 y 8.1', tag: 'hectarea hacienda familiar tierra bosque estanque huerto casa ecoaldea herencia',
    texto: '“Una hectárea por familia: bosque, huerto, estanque, casa y prado. Entregada gratis, sin vender, heredada a los hijos.”',
    idea: 'La propuesta social de la saga: cada familia recibe 1 hectárea para crear su Espacio de Amor, que no se vende ni se embarga y pasa a los hijos. El diseño modelo reparte: cerca de 1/3 de bosque vivo que da leña, sombra y pájaros; huerto y frutales cerca de la cocina; estanque que llama lluvia, ranas y riego; casa de materiales sanos orientada al sol; cerco vivo que da comida y protege del viento. Miles de haciendas así, juntas, forman ecoaldeas que no necesitan sistema para comer, sanar ni educar.',
    historia: 'Megre vuelve a Moscú y ve cumplirse el sueño sin empujarlo: lectores que ni se conocen empiezan a pedir tierra, plantar cedros y juntarse en cooperativas. En el libro 8 ya hay cientos de asentamientos en Rusia y otros países, con familias que viven de su hectárea, paren en casa, educan sin colegio y escriben su linaje. La prueba de Anastasia era simple: si la imagen es verdadera, la gente la construye sola.',
    como: 'Cada pieza cumple dos funciones: el bosque frena el viento sur y da hongos y leña; el estanque cría vida y guarda agua para enero-febrero; el huerto junto a la casa se riega con aguas grises; el cerco vivo (maqui, avellano, mosqueta) da fruta y esconde sin rejas. La regla de oro: nada se vende, todo se hereda, y cada generación planta para la siguiente. Así la tierra mejora en vez de cansarse.',
    sirve: 'Arriendo eterno, allegamiento, sueño de campo que parece imposible, herencias que dividen, ganas de vivir de la tierra con los hijos cerca.',
    practica: 'Dibuja tu hectárea soñada en 1 hoja (aunque vivas en depa): bosque, agua, casa, huerto. Pégala donde la veas.',
    pasos: '1) Dibuja el óvalo de tu hectárea y marca el norte y el viento sur. 2) Ubica: bosque atrás, casa al sol, agua al centro, huerto junto a la cocina. 3) Lista lo que ya tienes (patio, sitio de la abuela, huerto comunitario). 4) Elige el primer cuarto: cerco vivo o 3 frutales este Pukem. 5) Conversa herencia en familia sin pelear: quién cuida qué.',
    frases: '“Esta tierra es para mis nietos.” / “Planto lo que no veré.” / “Mi casa da vida.”',
    senal: 'El plano deja de ser dibujo: ya plantaste el primer árbol, guardas agua y hablas de herencia sin pelear.',
    penco: 'Realista: sitio urbano + huerto comunitario + 3 frutales; parcela a medias con hermanos; postular a tierra rural con comité. Planta nativo en Pukem, frutal en Pewu, estanque pequeño con totora si hay vertiente.',
    puente: '🌱 Siembra lunar (qué plantar por luna) · 💧 Agua (estanque y riego) · 🌳 Bosque Nativo · 🤝 Minga.',
    trampa: 'Pelear con la familia por la tierra o endeudarse por el campo ideal. La hacienda une o no es Amor: parte con lo que tienes.',
    pregunta: '¿Qué cuarto de mi hectárea planto esta luna?' },
  { id: 'semilla', cap: '4 · La Semilla Consciente', ico: '🌱', libro: 'Libro 1', tag: 'semilla boca siembra consciente huerto informacion planta saliva pies descalzos',
    texto: '“Pon la semilla bajo tu lengua, siente tu cuerpo, siémbrala con alegría y riega con tus pies descalzos.”',
    idea: 'El rito más famoso de la saga y el más practicado en el mundo. Anastasia dice que la semilla lee tu saliva, tu aliento y el sudor de tus pies, y que la planta que nace ajusta sus frutos a lo que tu cuerpo necesita esa temporada. Más allá de la explicación, el efecto es real: quien siembra así observa, riega, conversa y cosecha a tiempo, y la huerta rinde más con menos insumos.',
    historia: 'En el libro 1 Anastasia le reprocha a Megre que siembran sin amor: tiran la semilla apurados, con químicos y quejas, y después culpan a la tierra. Le enseña el gesto completo: ayunar una mañana, sostener cada semilla en la boca, contarle quién la sembró y qué familia alimentará, sembrarla en día bueno y regar descalzo para cerrar el círculo. Los lectores que lo prueban reportan plantas más firmes y cosechas que alcanzan justo.',
    como: 'Tres canales juntos: información (saliva y aliento con tu estado), intención (le hablas de tu salud y tu sueño en voz baja) y contacto (pies descalzos al regar, manos sin guante al aporcar). La planta “te conoce” porque vives con ella: la miras a diario, le sacas el gusano a tiempo, le das compost casero. No reemplaza la técnica (luna, distancia, agua), la corona.',
    sirve: 'Huertas que no resultan, semillas guardadas años que no germinan, siembra apurada sin cariño, niños que creen que la comida viene del super.',
    practica: 'Toma 1 semilla (poroto, arveja, cilantro): tenla en la boca, cuéntale tu sueño, siémbrala y riega descalzo. Marca la luna.',
    pasos: '1) Elige semilla local y luna de siembra (creciente para hoja, menguante para raíz). 2) En ayunas o tranquilo, tenla unos minutos en la boca pensando en tu familia. 3) Sóplala suave y siémbrala a dos dedos con alegría. 4) Riega descalzo y marca variedad + fecha lunar. 5) Visítala a diario: observa, ralea, aporca.',
    frases: '“Crece fuerte para mi familia.” / “Te cuido y me cuidas.” / “Gracias por alimentarnos.”',
    senal: 'Germinan parejas, riegas sin que te lo pidan y guardas tus propias semillas por primera vez.',
    penco: 'Pewu: arveja, haba, cilantro, lechuga. Walung: poroto, tomate, zapallo. Rimu: ajo, cebolla. Anota en 🌱 Siembra y guarda en Trafkintu del Semillero.',
    puente: '🌱 Siembra lunar (fecha exacta) · 🌱 Semillero (almácigos) · 🪱 Compost (comida de la semilla).',
    trampa: 'Hacerlo una vez como truco y olvidar regar, o usar semilla vieja sin probar germinación. El rito es diario, no magia de un día.',
    pregunta: '¿Qué quiero que mi huerta sepa de mí?' },
  { id: 'pensamiento', cap: '5 · El Pensamiento Creador', ico: '💭', libro: 'Libros 4–5', tag: 'pensamiento imagen creadora sueño atencion energia sacerdotes tele',
    texto: '“El ser humano crea con el pensamiento. Donde pones tu atención, pones tu futuro.”',
    idea: 'Para Anastasia el pensamiento es la herramienta con que fuimos creados para co-crear: una imagen sostenida con amor organiza el cuerpo, la familia y hasta los hechos. Por eso advierte que quien controla tus imágenes (tele, miedo, apuro) controla tu vida. Pensar no es soñar despierto: es elegir una imagen clara, limpiarla de miedo y sostenerla con actos diarios hasta que cuaja.',
    historia: 'En el libro 5 Megre descubre a los sacerdotes antiguos: no gobiernan con ejércitos sino con imágenes de miedo (guerras, escasez, castigo) repetidas hasta que la gente las cree y las crea. Anastasia le muestra lo contrario: ella “ve” el futuro como quien riega un almácigo y crea a distancia sanando a desconocidos, solo sosteniendo su imagen sana. La prueba que le pide a Megre es escribir: si el libro toca a millones sin publicidad, la imagen era verdadera. Y así fue.',
    como: 'Tres condiciones de la imagen viva: clara (se puede dibujar), presente (se dice en hoy: vivo, siembro, agradezco) y amada (te alegra leerla). Se contamina con queja, tele-basura y discusiones repetidas. Se limpia con ayuno de noticias, caminata y escritura diaria. Una imagen + un acto diario por 1 luna mueve más que un año de planes.',
    sirve: 'Cabeza llena de noticias malas, planes que se caen, discusiones que se repiten, cesantía o enfermedad que piden rumbo.',
    practica: 'Escribe tu imagen en 1 frase presente y léela mañana y noche 1 luna, con 1 acto diario hacia ella.',
    pasos: '1) Escribe 5 líneas en presente: dónde vivo, con quién, qué hago, qué agradezco, qué doy. 2) Tacha todo miedo (“sin deudas, sin enfermedad”) y déjalo en afirmativo. 3) Léela en voz alta mañana y noche. 4) Haz 1 acto diario hacia ella (llamada, semilla, ahorro). 5) Relee cada luna y ajusta.',
    frases: '“Vivo en mi Espacio con mi familia y agradezco.” / “Mi pensamiento crea bien.” / “Elijo esta imagen.”',
    senal: 'Duermes con la imagen en vez de con la noticia, dices que no a lo que te desvía y aparece ayuda “casual”.',
    penco: 'Pégala en la puerta del refri y en la nota del celu. Si hay tele prendida todo el día: acuerda 1 día sin noticias por semana.',
    puente: '🎯 Disciplina (imagen → acto) · 📓 Gratitud · 🌙 Diario Sueños (revisa tu imagen al despertar).',
    trampa: 'Pensar bonito acostado sin mover las manos, o pedir imágenes ajenas (auto, viaje) que no te alegran de verdad. La imagen pide tierra.',
    pregunta: '¿Qué imagen estoy regando hoy: miedo o futuro?' },
  { id: 'palabra', cap: '6 · La Palabra Viva', ico: '🗣️', libro: 'Libros 4–5', tag: 'palabra verdad groseria queja bendecir hablar chisme decreto',
    texto: '“Las palabras feas destruyen; las palabras claras construyen. Habla como si cada frase sembrara.”',
    idea: 'La palabra es pensamiento sonoro: lo que dices en voz alta ordena tu casa más rápido que lo que piensas callado. Anastasia muestra que el garabato, la queja crónica y el chisme ensucian tu propio Espacio y enferman a quien los dice primero. Al revés, bendecir la comida, saludar al día, pedir claro en vez de reclamar y agradecer en voz alta cambian el ánimo de la casa en días.',
    historia: 'Megre se ríe de “hablarle a la semilla” hasta que Anastasia le hace notar cómo habla él: apurado, con garabatos al volante y quejas del gobierno en la sobremesa. Le propone un experimento de una semana: cero groserías, cero chisme, tres bendiciones diarias. Al tercer día su hijo lo corrige jugando y Megre entiende que los niños heredan el vocabulario antes que la herencia.',
    como: 'Tres filtros antes de hablar: ¿es verdad en mi experiencia? ¿es necesario ahora? ¿construye o hiere? Si falla uno, se calla o se reformula como pedido (“necesito silencio para terminar” en vez de “cállate”). La bendición no es rezo largo: es nombrar el bien (“qué rica esta cazuela, gracias a quien sembró”). El cuerpo la prefiere breve, diaria y mirando a los ojos.',
    sirve: 'Casas con gritos, parejas que solo reclaman, niños que repiten garabatos, pegas con cahuín, duelos donde nadie se dice lo bueno.',
    practica: 'Hoy 0 queja + 3 bendiciones en voz alta (comida, salida, noche). Anota cómo cambia el ánimo.',
    pasos: '1) Promete la mañana: hoy 0 quejas. 2) Cada queja que pilles, cámbiala por pedido claro y breve. 3) Bendice 3 momentos en voz alta mirando a los ojos. 4) Noche: cuenta quejas vs bendiciones en tu diario. 5) Si fallaste, repara mañana con 1 disculpa concreta.',
    frases: '“Necesito ___.” / “Gracias por ___.” / “Bendigo esta comida y a quien la sembró.”',
    senal: 'Los niños te copian lo bueno, las peleas duran minutos y la casa suena distinta.',
    penco: 'Taco, fila del CESFAM, micro: ahí se entrena. Acuerda con tu familia una palabra clave (“semilla”) para avisarse sin pelear.',
    puente: '🤝 Prácticas Toltecas (palabra impecable) · 📓 Gratitud · 🟣 Convivencia (pedir sin gritar).',
    trampa: 'Fingir dulzura por fuera y hervir por dentro, o usar “sinceridad” para herir. La palabra viva nace de calma real, no de libreto.',
    pregunta: '¿Esto que diré siembra o envenena?' },
  { id: 'pareja', cap: '7 · Amor y Concepción Consciente', ico: '💞', libro: 'Libro 3', tag: 'amor pareja concepcion hijo esperado sexo sagrado estrellas familia',
    texto: '“Que el hijo sea esperado por los dos, invitado con amor bajo las estrellas, no por accidente.”',
    idea: 'El libro 3 es el más íntimo: el hijo debe ser invitado, no accidental. Tres condiciones: amor de verdad entre los dos, deseo compartido de crear y un lugar bello que lo reciba (tu Espacio). Así, dice Anastasia, el niño llega con su energía completa y sin la carga del susto o la pelea. Y si tus hijos ya nacieron, nunca es tarde: se los puede re-invitar cada cumpleaños contándoles cómo fueron esperados y qué sueño trajeron.',
    historia: 'Megre y Anastasia conciben a su hijo en la taiga, de madrugada y bajo las estrellas, después de conversar su sueño común. Ella le explica que el acto sin amor y apurado crea niños inquietos, mientras el acto esperado y celebrado crea niños sanadores. Años después Megre vuelve y conoce a su hijo: sano, despierto y criado en bosque, que lo reconoce sin haberlo visto. La escena sostiene toda la tesis: el amor planeado se nota en el cuerpo.',
    como: 'El rito tiene tres tiempos: antes (conversar el sueño de familia sin apuro, limpiar peleas), durante (buscar belleza y calma, sin alcohol ni prisa, invitando en voz baja al hijo) y después (contar la historia al niño cuando crezca, celebrar su llegada cada año con fiesta propia). No es técnica sexual: es contexto de amor. Con hijos grandes se aplica igual: 20 minutos semanales de conversación sin celu reparan más que un regalo caro.',
    sirve: 'Parejas apagadas por rutina, peleas frente a los niños, hijos no planeados con culpa guardada, fertilidad buscada con angustia, ganas de pololear mejor.',
    practica: 'Conversen 20 min sin celu su sueño de familia. Si hay hijos, cuéntenles esta luna cómo fueron esperados.',
    pasos: '1) Agenden 20 min sin celu ni tele. 2) Cada uno dice su sueño de familia en 3 frases. 3) Acuerden 1 gesto de amor semanal (caminata, comida, carta). 4) Si hay hijos: cuéntenles su historia de llegada con orgullo. 5) Creen su rito propio (lugar, frase, fecha) y repítanlo.',
    frases: '“Te elijo.” / “Nuestro hijo fue esperado.” / “Nuestro amor tiene tierra.”',
    senal: 'Pelean menos delante de los niños, se ríen más y los hijos preguntan su historia con brillo.',
    penco: 'Playa Negra al atardecer, cerro al amanecer: Penco da lugares bellos gratis. Si están distanciados, partan por la caminata semanal sin tocar temas de plata.',
    puente: '💞 Pareja y Crianza (si tienes el módulo) · 🧒 Crianza · 📓 Gratitud · 🟣 Convivencia.',
    trampa: 'Usarlo para culpar el pasado (“llegaste por accidente”) o para exigir otro hijo. El Amor repara hacia adelante y nunca presiona.',
    pregunta: '¿Nuestro amor tiene tierra donde crecer?' },
  { id: 'crianza', cap: '8 · Parto y Crianza sin Miedo', ico: '🤱', libro: 'Libro 3', tag: 'parto lactancia crianza niños miedo escuela padres teta bosque verdad',
    texto: '“Parir sin miedo, amamantar largo y dejar que el bosque eduque: el niño sabe.”',
    idea: 'Anastasia pare sola, sin gritos ni miedo, y amamanta años como quien transmite información y calma, no solo leche. Su tesis: el miedo se hereda más que la enfermedad. Si la madre llega confiada, acompañada y sin apuro, el parto fluye; si al niño se le responde la verdad, se le deja tocar tierra y se le da teta a demanda, crece sano y despierto. Critica la crianza de sistema: cuna aparte, mamadera apurada, pantalla de niñera y grito como método.',
    historia: 'Megre vuelve a la taiga y encuentra a su hijo criado en bosque: descalzo, fuerte, que habla con animales y entiende todo sin colegio. Anastasia le muestra cómo amamanta mirándolo a los ojos y contándole el mundo, y cómo nunca le miente: cada “por qué” recibe respuesta completa a su medida. El niño no teme al bosque porque lo conoce tocándolo, y no teme a la gente porque nunca fue engañado.',
    como: 'Tres pilares: contacto (brazos, cama cercana, porteo, teta a demanda el tiempo que se pueda), tierra (juego diario con barro, agua, hojas y bichos, sin miedo exagerado a ensuciarse) y verdad (responder cada pregunta sin inventos ni “ya verás”, y pedir perdón cuando el adulto se equivoca). La lactancia se cuida con comida viva y calma; el parto se prepara con caminata, respiración y un plan conversado con la matrona, nunca sola ni contra el equipo de salud.',
    sirve: 'Miedo al parto, culpa por no dar pecho, niños encerrados con pantalla, pataletas que terminan en grito, abuelos que quieren ayudar sin saber cómo.',
    practica: 'Hoy 1 hora de tierra con tu niño sin pantalla: barro, hojas, agua. Responde 1 por qué con verdad completa.',
    pasos: '1) Agenda 1 hora de tierra sin pantalla (plaza, patio, playa). 2) Deja que se ensucie: lleva muda, no retos. 3) Responde 1 por qué con verdad a su medida. 4) Cierra con teta, abrazo largo o cuento (contacto). 5) Anota qué descubrió: eso es su clase de hoy.',
    frases: '“Estoy aquí.” / “Pregúntame todo.” / “Perdóname, me equivoqué.”',
    senal: 'Duerme mejor, pregunta más, se enferma menos y te busca para contarte antes de llorar.',
    penco: 'Humedal Rocuant a mirar aves, Playa Negra a mojar pies, plaza con tierra y hojas. En invierno: barro del patio + olla con agua tibia. Control sano en CESFAM siempre al día.',
    puente: '🧒 Crianza · 🤰 Fertilidad Natural · 🌿 Lawen (botiquín suave) · 💭 Diario Sueños (miedos del niño).',
    trampa: 'Copiar la taiga al pie de la letra (parir sola, sacar del colegio, dejar medicamentos) sin red. Adapta: más bosque y brazos, menos pantalla y grito, siempre con matrona y médico.',
    pregunta: '¿Qué necesita este niño de mí hoy: brazos, tierra o verdad?' },
  { id: 'escuela', cap: '9 · La Escuela Viva (Tekos)', ico: '🏫', libro: 'Libro 8.1', tag: 'escuela Tekos Shchetinin niños aprender haciendo proyecto matematicas',
    texto: '“En un año aprenden lo de diez: porque construyen su escuela, enseñan a otros y siembran su comida.”',
    idea: 'La escuela de Tekos, en el Cáucaso, dirigida por Shchetinin: sin grados, sin timbres ni pruebas de memoria. Los niños levantan sus edificios, siembran su comida, resuelven matemáticas para medir de verdad y cantan e ilustran su historia. Aprenden a toda velocidad porque cada saber sirve para algo real y porque enseñan a los menores lo que acaban de aprender. En casa se aplica igual: un proyecto real por luna enseña más que un mes de tareas.',
    historia: 'Megre visita Tekos y no lo cree: adolescentes que hablan varios idiomas, integran cálculo, albañilería y danza, y administran su internado sin inspectores. El secreto que le cuentan los maestros: partir de la imagen del niño (qué quiere crear), darle responsabilidad real (un muro, un almácigo, una clase) y pedirle que lo enseñe. El que enseña, aprende dos veces. De ahí sale la frase que recorre el libro: un año ahí vale por diez afuera.',
    como: 'Tres reglas: proyecto real (algo que se come, se habita o se regala), medida real (matemáticas para cubicar, pesar y cobrar) y enseñanza real (el mayor enseña al menor cada semana). Sin notas como premio o castigo: la obra terminada es la nota. En familia basta 1 proyecto por luna con roles claros, cuaderno de medidas y presentación final a la familia.',
    sirve: 'Niños aburridos, tareas odiadas, “no aprende nada”, homeschool que se vuelve grito, adolescentes sin oficio ni ganas.',
    practica: 'Elige 1 proyecto de luna con tus niños: almácigo, pan, mapa del barrio. Que ellos midan, anoten y enseñen.',
    pasos: '1) Elijan proyecto útil (almácigo, gallinero, pan, libro familiar). 2) Midan y anoten: qué necesitan, cuánto sale, qué pasos siguen. 3) Hagan juntos 3 sesiones por semana, con rol de cada uno. 4) Que el niño enseñe a otro lo aprendido. 5) Cierren mostrando la obra a la familia.',
    frases: '“¿Para qué sirve esto?” / “Enséñame tú.” / “Lo hicimos nosotros.”',
    senal: 'Pregunta por gusto, mide sin que le pidan y quiere mostrar su obra a los abuelos.',
    penco: 'Huerto escolar, pan amasado de la abuela, mapa de la caleta, maqueta del cerro. Pide apoyo en 📚 Horario y 🧠 Estudio de la app.',
    puente: '🧠 Estudio · 📚 Horario · 🌱 Siembra (proyecto huerta) · 🗣️ Voz de los Abuelos (proyecto linaje).',
    trampa: 'Exigir notas Tekos sin dar libertad Tekos, o sobrecargar con 3 proyectos a la vez. Sin propósito real, no hay milagro: uno por luna basta.',
    pregunta: '¿Qué proyecto vivo aprenderemos esta luna?' },
  { id: 'comida', cap: '10 · Comida Viva y Piñón', ico: '🥗', libro: 'Libros 2 y 7', tag: 'comida viva piñon alimentacion huerto estacion feria aceite energia',
    texto: '“Come lo que tu tierra te da en su estación, con alegría y sin glotonería.”',
    idea: 'El piñón de cedro es presentado como alimento casi completo: grasa viva, proteína y aceite que levantan defensas y ánimo. Pero la lección vale con piñón, avellana, nuez o castaña local: comer lo de tu tierra, en su estación, fresco y con gratitud. Anastasia suma dos reglas: sin glotonería (el cuerpo avisa cuando basta) y con alegría (bendecido sabe mejor y cae mejor). Menos paquete, más olla; menos microondas, más sobremesa.',
    historia: 'En el libro 2 Anastasia le explica a Megre las propiedades del aceite y el piñón para la salud física, emocional y espiritual, y le muestra cómo con un puñado al día los leñadores siberianos aguantan el invierno. Megre, enfermo de úlcera y columna por años de banquetes de negocios, cambia su dieta en Moscú: feria, olla simple y horarios tranquilos. Su mejoría es parte de la prueba del libro: el cuerpo responde cuando se le da vivo y calma.',
    como: 'Tres ejes: origen (feria y huerta antes que super), estación (lo que madura ahora alimenta ahora) y estado (comer tranquilo, masticando, sin tele ni pelea). El aceite de piñón o la avellana tostada son el “plus” de invierno, no la base: la base es verdura diaria, legumbre y grano local. Guardar la semilla de lo comido cierra el círculo con la huerta.',
    sirve: 'Comida cara y fome, guatas hinchadas, niños que no comen verduras, subidas de presión y azúcar, cocinar apurado todos los días.',
    practica: 'Esta semana: 1 comida 100% de feria o huerta, bendecida en voz alta, sin tele. Guarda semillas de lo comido.',
    pasos: '1) Compra 1 canasta de feria de estación. 2) Cocina 1 olla simple (cazuela, lentejas, charquicán de cochayuyo). 3) Bendice en voz alta y come sin pantallas. 4) Guarda 1 semilla (zapallo, poroto, tomate) para tu huerta. 5) Repite 1 vez por semana hasta que sea costumbre.',
    frases: '“Gracias a quien sembró.” / “Como vivo y me alegro.” / “Mi cuerpo sabe.”',
    senal: 'Te llenas con menos, los niños piden repetir verdura y la basura de paquetes baja a la mitad.',
    penco: 'Feria de Penco y Lirquén, cochayuyo y luche de bajamar, avellana y castaña en Rimu. Anota gastos en 💰 Finanzas y recetas en 🍯 La Bodega.',
    puente: '🥗 Nutrición · 🍯 La Bodega (conservas) · 🌱 Siembra (lo que comes, lo siembras).',
    trampa: 'Volverse policía de la comida o gastar lo que no hay en superalimentos importados. Lo vivo local alegra; lo importado con culpa enferma.',
    pregunta: '¿Esto me da vida o me la cobra?' },
  { id: 'sistema', cap: '11 · El Sistema y las Vedas', ico: '⛓️', libro: 'Libros 4–5', tag: 'sistema vedas sacerdotes despertar historia oculta Adan Eva miedo tele',
    texto: '“Hace 10.000 años sabíamos co-crear. El sistema nos hizo olvidar para manejarnos.”',
    idea: 'La historia védica que cuenta Anastasia: fuimos creados para co-crear con lo divino, como jardineros del paraíso, y una casta de sacerdotes del poder nos cortó la memoria con religiones de miedo, culpa y obediencia. Después vinieron escuelas sin alma, trabajos sin sentido y noticias que programan susto diario. Despertar no es pelear contra ellos: es dejar de alimentarlos y salir creando tu Espacio, tu libro y tu escuela. El sistema muere de inanición cuando la gente planta.',
    historia: 'En el libro 4 Anastasia relee Adán y Eva al revés: no hubo pecado original sino plan original (crear juntos), y la “serpiente” fue la primera imagen de miedo instalada. En el libro 5 Megre recorre Moscú viendo cómo cada pantalla repite susto y apuro, y entiende que no necesita combatir a nadie: le basta escribir su verdad y plantar su hacienda. Los sacerdotes del relato tiemblan no ante la protesta, sino ante cada familia que deja de pedirles permiso.',
    como: 'El sistema opera con tres ganchos: miedo (te va a faltar), prisa (decide ya) y culpa (fue tu culpa). Cada vez que compras, votas o crías desde esos tres, lo alimentas. La salida tiene tres pasos espejo: verificar en tu experiencia (¿esto es verdad en mi vida?), frenar el apuro (caminata y noche antes de decidir) y crear lo propio (huerta, libro, oficio). Sin violencia y sin fuga: presencia que crea.',
    sirve: 'Rabia contra políticos, jefes o curas, sensación de que todo está malo, discusiones familiares por noticias, angustia que no te deja dormir.',
    practica: 'Ayuno de noticias 1 día + caminata 20 min preguntando qué sí puedes crear. Anota 1 acto.',
    pasos: '1) Apaga noticias 24 h (avisa a tu familia). 2) Camina 20 min con la pregunta: ¿qué sí puedo crear yo? 3) Escribe 1 acto concreto (llamada, semilla, ahorro, carta). 4) Hazlo en 48 h. 5) Cuenta en tu diario qué cambió en tu ánimo.',
    frases: '“Verifico en mi vida.” / “No decido con miedo.” / “Creo lo mío.”',
    senal: 'Discutes menos de política, duermes mejor y hablas más de tu huerta que del gobierno.',
    penco: 'Ferias, mingas, trueque y huerto comunitario son salida real. Si el tema te quema: 1 día sin pantallas + borde costero + conversa con vecinos.',
    puente: '🤝 Minga · 🔄 Trueque · 🎯 Disciplina (foco) · 📵 Bienestar digital (si lo tienes).',
    trampa: 'Quedarse en conspiración y no plantar nada, o pelear con la familia “despierta vs dormida”. El que despierta, siembra y une.',
    pregunta: '¿Esto me hace más libre o más miedoso?' },
  { id: 'sueno', cap: '12 · El Sueño que se Cumple Solo', ico: '🌅', libro: 'Libros 8–10', tag: 'sueño colectivo Anasta futuro ecoaldeas esperanza nietos imagen',
    texto: '“No me creas: planta un cedro y verifica. El sueño verdadero se cumple sin empujar.”',
    idea: 'Cierre de la saga: el sueño verdadero no se empuja, se sostiene. Anastasia le pide a Megre que no la crea: que plante, escriba y verifique por sí mismo. Y el sueño se cumplió solo: miles de haciendas y ecoaldeas sin jefes ni publicidad, niños que nacen en Espacios de Amor y traen respuestas nuevas. Tu tarea no es salvar el mundo: es sostener tu imagen clara y tu metro de paraíso. Lo demás resuena solo, como el cedro que zumba cuando está lleno.',
    historia: 'El libro 10 se llama Anasta, como la nieta: el futuro ya camina. Megre, viejo y enfermo al inicio de la saga, termina rodeado de hijos, nietos, lectores-plantadores y escuelas vivas. La última lección de Anastasia es despedirse: ella se queda en la taiga, él vuelve a la gente, y el libro queda como semilla. Cada lector que planta un cedro y escribe su linaje continúa la historia sin necesitar más libros.',
    como: 'Un sueño que se cumple tiene tres marcas: alegra al leerlo (no asusta), sirve a otros (no solo a ti) y se puede plantar hoy (tiene primer paso en tierra). Se sostiene con lectura diaria, relato a otros (contarlo lo fortalece) y siembra que lo represente (un árbol por cada sueño grande). Si el sueño solo pide plata o fama, se revisa; si pide bosque, familia y oficio, se riega.',
    sirve: 'Desesperanza, “ya es tarde”, ganas de rendirse, duelos, vejez que siente que ya no aporta, jóvenes sin rumbo.',
    practica: 'Escribe tu sueño de 10 años en 5 líneas y léelo bajo tu árbol. Planta algo que lo represente.',
    pasos: '1) Escribe tu sueño de 10 años en 5 líneas presentes. 2) Léelo en voz alta bajo tu árbol o planta. 3) Planta algo que lo represente (nativo para legado, frutal para familia). 4) Cuéntaselo a 1 persona que lo celebre. 5) Relee cada luna llena y poda lo que ya no vibra.',
    frases: '“Planto para mis nietos.” / “Mi sueño ya camina.” / “Verifico plantando.”',
    senal: 'Te levantas con ganas, otros se suman sin que los convenzas y tu árbol crece con tu historia.',
    penco: 'Planta el árbol de tu sueño en Pukem con lluvia e invita a tu familia. Escríbelo en 🌳 Árbol Genealógico y en tu Libro del Linaje.',
    puente: '🌳 Árbol Genealógico (tu linaje) · 🌟 Ikigai (tu propósito) · 📓 Gratitud · 🌲 Tu árbol adoptado.',
    trampa: 'Soñar acostado esperando que “el universo” lo haga, o cambiar de sueño cada semana. El sueño pide una tierra y una década.',
    pregunta: '¿Qué plantaré hoy para mis nietos?' }
];
function anaSaber(id) { for (var i = 0; i < ANA_SABERES.length; i++) if (ANA_SABERES[i].id === id) return ANA_SABERES[i]; return null; }

var ANA_PRACTICAS = [
  { id: 'amanecer', n: 'Saludo al amanecer descalzo', ico: '🌅', tiempo: '5 min al despertar',
    pasos: '1) Sal descalzo (patio, tierra, pasto). 2) Mira al este, estira brazos, respira 3 veces hondo. 3) Di en voz alta: gracias por este día + tu imagen de hoy. 4) Toca 1 planta y vuelve dentro liviano.',
    tip: 'En Penco con frío: manta + pies 1 min basta. Puente: 🌞 Ritmo Circadiano y 🌬️ Respiración.' },
  { id: 'semilla', n: 'Semilla en la boca y siembra', ico: '🌱', tiempo: '10 min',
    pasos: '1) Elige 1 semilla (poroto, arveja, cilantro). 2) Tenla en la boca unos minutos pensando en tu salud y familia. 3) Escúpela suave en la palma, sóplala, siémbrala a 2 dedos. 4) Riega descalzo y marca la luna. Cuídala a diario.',
    tip: 'Puente: 🌱 Siembra lunar para fecha + Semillero para almácigo. Anota variedad y luna.' },
  { id: 'arbol', n: 'Planta o adopta tu cedro (nativo)', ico: '🌲', tiempo: '20 min una vez por luna',
    pasos: '1) Elige nativo (peumo, arrayán, canelo, quillay; cedro si consigues). 2) Hoyo 40x40 con compost, planta con las manos, riega lento. 3) Ponle nombre y promesa (“crecemos juntos”). 4) Visítalo cada luna.',
    tip: 'Puente: 🌳 Bosque Nativo para ficha y bitácora. Si arriendas: adopta 1 árbol de la calle o plaza.' },
  { id: 'caminata', n: 'Caminata taiga (silencio en verde)', ico: '🚶', tiempo: '10 min sin audífonos',
    pasos: 'Camina lento sintiendo pies + respiración + verde (hojas, pájaros, olor a mar). Lleva 1 pregunta (“¿qué crearé?”) sin responderla: deja que los pasos respondan. Al volver anota 1 frase.',
    tip: 'Ideal: borde costero, cerro o quebrada. Hay botón de 3 min abajo para partir.' },
  { id: 'comida', n: 'Comida viva bendecida', ico: '🥗', tiempo: '1 comida al día',
    pasos: '1) Cocina simple de feria/huerta. 2) Antes de comer: agradece en voz alta a quien sembró. 3) Come sin tele, mastica lento. 4) Guarda 1 semilla de lo comido para tu huerta.',
    tip: 'Piñón cuando haya; si no, avellana, nuez o castaña local. Lo vivo local vale doble.' },
  { id: 'metro', n: 'Mi metro de paraíso (1 m²)', ico: '🏡', tiempo: '15 min',
    pasos: '1) Marca 1 m² (patio, balcón, macetero grande). 2) Limpia, suelta tierra, pon compost. 3) Siembra 3 amigas (ej: lechuga + cilantro + flor). 4) Pon piedra o palo con tu sueño escrito. Riega cada día.',
    tip: 'Es tu maqueta de hectárea: lo que aprendas aquí se agranda después.' },
  { id: 'imagen', n: 'Carta de la imagen clara', ico: '💭', tiempo: '10 min por luna',
    pasos: 'Escribe 5 líneas en presente: dónde vivo, con quién, qué hago, qué agradezco, qué doy. Léela en voz alta bajo tu árbol o planta. Guarda la carta en tu Libro del Linaje.',
    tip: 'Sin lloriqueo ni “quiero”: afirma (“vivo, siembro, enseño, agradezco”).' },
  { id: 'palabra', n: 'Día de palabra viva (0 queja)', ico: '🗣️', tiempo: 'todo el día',
    pasos: '1) Mañana: promete 0 quejas. 2) Cada queja que pilles, cámbiala por pedido claro (“necesito ___”). 3) Noche: cuenta quejas y bendiciones. Celebra si bajan.',
    tip: 'Puente: 🤝 Prácticas Toltecas (palabra impecable) y 📓 Gratitud.' },
  { id: 'noche', n: 'Noche de bosque (soltar el sistema)', ico: '🌙', tiempo: '3 min antes de dormir',
    pasos: 'Acostado: repasa el día como hojas que caen (no te detengas). Suelta 1 noticia mala (“eso ya pasó”). 3 respiraciones lentas imaginando tu Espacio. Duerme sembrando sueño lindo.',
    tip: 'Si la cabeza no para, escribe las vueltas en papel junto a la cama y suéltalas ahí.' }
];

var ANA_TEST = [
  { c: 'J', txt: 'Tengo plantas a mi cargo y las toco/riego casi todos los días.' },
  { c: 'S', txt: 'Tengo una imagen clara de dónde quiero vivir en 5-10 años.' },
  { c: 'C', txt: 'Bendigo o agradezco la comida en voz alta.' },
  { c: 'X', txt: 'Paso más de 2 horas al día en noticias o scroll que me dejan mal.' },
  { c: 'J', txt: 'Guardo semillas o planto algo cada luna/temporada.' },
  { c: 'S', txt: 'Escribo o dibujo mis sueños (no solo los pienso).' },
  { c: 'C', txt: 'Evito la queja: pido claro en vez de reclamar.' },
  { c: 'X', txt: 'Compro comida de paquete casi todos los días.' },
  { c: 'J', txt: 'Camino descalzo en tierra/pasto o saludo al sol cada semana.' },
  { c: 'S', txt: 'Pienso en mis abuelos/linaje y cuento su historia.' },
  { c: 'C', txt: 'Hago algo con mis manos cada semana (pan, huerta, arreglo, arte).' },
  { c: 'X', txt: 'Me cuesta estar en silencio sin celu o tele.' },
  { c: 'J', txt: 'Como verdura de feria/huerta casi todos los días.' },
  { c: 'S', txt: 'Antes de decidir, imagino el resultado y escucho mi cuerpo.' },
  { c: 'C', txt: 'Enseño algo a un niño (cocinar, sembrar, contar, cantar).' },
  { c: 'X', txt: 'Siento que el trabajo/sistema me deja sin energía.' },
  { c: 'J', txt: 'Cuido un árbol, patio o sitio como si fuera mío.' },
  { c: 'S', txt: 'Tengo un cuaderno/libro con mi historia o sueños.' },
  { c: 'C', txt: 'Saludo el día o la noche con gratitud.' },
  { c: 'X', txt: 'Discuto o me angustio por noticias/política cada semana.' }
];
var ANA_LIKERT = [
  { v: 0, t: 'Nunca' }, { v: 1, t: 'A veces' }, { v: 2, t: 'A menudo' }, { v: 3, t: 'Muy cierto' }
];
var ANA_VIAS = {
  J: { nombre: 'Jardinero · Manos en tierra', ico: '🌱', desc: 'Tu fuerza es cuidar lo vivo: sembrar, regar, alimentar, plantar. Como el cedro: das sombra y fruto sin ruido. Riesgo: quedarte solo en la huerta y olvidar soñar y amar.',
       entrena: 'Suma sueño: carta de imagen clara + 1 m² de paraíso con cartel de tu sueño. Riega y sueña.' },
  S: { nombre: 'Soñador · Imagen clara', ico: '💭', desc: 'Tu fuerza es ver el futuro: imágenes, historias, linaje, propósito. Como Anastasia en la taiga: ves lo que otros no ven. Riesgo: soñar acostado sin mover las manos.',
       entrena: 'Ancla cada sueño en tierra: 1 semilla en boca + 1 acto diario hacia tu imagen. Soñar + hacer.' },
  C: { nombre: 'Creador · Amor que hace', ico: '💚', desc: 'Tu arte es amar haciendo: cocinar vivo, criar sin grito, enseñar, bendecir. Como un Espacio de Amor andando. Riesgo: dar tanto que te vacías (cocinar para todos y no comer tú).',
       entrena: 'Recarga: saludo al amanecer + comida viva para ti primero + día de palabra viva. Dar con taza llena.' }
};

var ANA_LUNAS = [
  'Lunas 1-3 (Pukem · invierno): leer y soñar. Libros 1-2-5 + carta de imagen + plantar nativo con lluvia. Pregunta: ¿qué sueño me sostiene en el frío?',
  'Lunas 4-6 (Pewu · primavera): sembrar. Semilla en boca + 1 m² de paraíso + almácigos. Libros 3-4. Riega descalzo, no tires la semilla.',
  'Lunas 7-9 (Walung · verano): crear y compartir. Comida viva + enseñar a niños + dibujar tu hectárea. Libros 6-7-8. Cosecha y convida.',
  'Lunas 10-13 (Rimu · otoño): cosechar y escribir. Guardar semillas + Libro del Linaje + plantar bosque. Libro 10 Anasta. Elige tu vía madre.'
];

/* ============================================================
   DIÁLOGO
   ============================================================ */
function buildDialog() {
  var libroGrid = ANA_LIBROS.map(function (it) {
    return '<button type="button" class="btn ana-lib-card" data-lib="' + it.id + '" style="text-align:left;height:auto;padding:10px">' +
      '<b>' + it.ico + ' ' + esc(it.n) + '</b><br>' +
      '<span class="muted" style="font-size:11px">' + esc(it.tag.split(' ').slice(0, 3).join(' · ')) + '</span></button>';
  }).join('');

  var sabGrid = ANA_SABERES.map(function (it) {
    return '<button type="button" class="btn ana-sab-card" data-sab="' + it.id + '" style="text-align:left;height:auto;padding:10px">' +
      '<b>' + it.ico + ' ' + esc(it.cap) + '</b><br>' +
      '<span class="muted" style="font-size:11px">' + esc(it.libro) + '</span></button>';
  }).join('');

  var testHTML = ANA_TEST.map(function (q, i) {
    var opts = ANA_LIKERT.map(function (o) {
      return '<label class="check-row" style="margin:0;font-size:12px"><input type="radio" name="anaQ' + i + '" value="' + o.v + '"> ' + o.t + '</label>';
    }).join('');
    return '<div class="menstrual-card" style="margin-bottom:8px"><b style="font-size:12px">' + (i + 1) + '. ' + esc(q.txt) + '</b>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' + opts + '</div></div>';
  }).join('');

  var practHTML = ANA_PRACTICAS.map(function (p) {
    return '<div class="menstrual-card"><h4>' + p.ico + ' ' + esc(p.n) + '</h4>' +
      '<p class="muted" style="font-size:11px">⏱ ' + esc(p.tiempo) + '</p>' +
      '<p style="font-size:12px">' + esc(p.pasos) + '</p>' +
      '<p class="muted" style="font-size:12px">💡 ' + esc(p.tip) + '</p>' +
      '<button type="button" class="btn ana-pract-add" data-p="' + esc(p.n) + '" style="width:auto">+ Anotar en mi diario de hoy</button></div>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabAnaGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabAnaLibros" class="btn" style="width:auto">📚 Libros y Saberes</button>' +
    '<button type="button" id="tabAnaPract" class="btn" style="width:auto">🛠️ Prácticas</button>' +
    '<button type="button" id="tabAnaTest" class="btn" style="width:auto">📝 Test del Espacio</button>' +
    '<button type="button" id="tabAnaCamino" class="btn" style="width:auto">🌱 Mi Espacio</button></div>' +

    '<div id="anaGuia">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌲 ¿Quién es Anastasia?</h4>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">En 1994 el empresario <b>Vladimir Megre</b> sube el río Ob (Siberia) buscando el <b>cedro resonante</b> del que le habló un anciano: un árbol que zumba cargado de energía y sana. En la taiga conoce a <b>Anastasia</b> (nacida en 1969), criada casi sola entre abuelo, bisabuelo y animales, descendiente de los <b>vedas rusos</b>: cultura que vivió miles de años en el bosque recordando cómo co-crear con la naturaleza. En 3 días le muestra sexo sagrado, parto sin miedo, educación viva y el <b>Espacio de Amor</b>. Megre vuelve cambiado: deja el negocio y escribe en Moscú, sin plata, el primer libro. Sin más publicidad que el boca a boca, la serie vende <b>+10 millones</b> solo en Rusia y se traduce a <b>20 idiomas</b>.</p>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">Idea de una línea: <b>tu pensamiento crea, tu tierra responde</b>. Ordena tu imagen, siembra con amor y cría sin miedo: el bosque hace el resto.</p></div>' +
    '<div class="fishing-grid" style="margin-top:10px">' +
    '<div class="menstrual-card"><h4>🗺️ El mapa en 6 piezas</h4>' +
    '<p class="muted" style="font-size:12px"><b>1) Cedro resonante 🌲:</b> árbol-antena que limpia aire y ánimo. <b>2) Espacio de Amor 💚:</b> lugar creado con amor donde la familia crece con la naturaleza. <b>3) Hacienda 1 ha 🏡:</b> bosque + huerto + agua + casa, heredable. <b>4) Pensamiento-imagen 💭:</b> lo que riegas con atención, crece. <b>5) Palabra viva 🗣️:</b> hablar que siembra, no que envenena. <b>6) Libro del Linaje 📖:</b> tu historia escrita para tus nietos.</p></div>' +
    '<div class="menstrual-card"><h4>📚 Cómo leer la saga (10 libros)</h4>' +
    '<p class="muted" style="font-size:12px">Parte por <b>1 Anastasia + 2 Cedros + 3 Espacio del Amor</b>: ahí está todo. Sigue con <b>4 Co-creación y 5 Quiénes somos</b> si te gusta la historia. <b>6 Linaje, 7 Energía, 8 Nueva Civilización / Ritos y 10 Anasta</b> son para vivirlo (escuela, huerta, fiesta). Lee de a poco: 10 páginas diarias + 1 práctica valen más que devorarlos.</p></div></div>' +
    '<details class="menstrual-details"><summary>🚶 ¿Cómo practicar sin grupo ni gurú? (rutina mínima)</summary>' +
    '<p class="muted" style="font-size:12px"><b>Mañana:</b> saludo descalzo + imagen clara del día. <b>Día:</b> 1 m² de paraíso + comida viva sin tele + 0 quejas. <b>Noche:</b> soltar el sistema 3 min + 1 línea en tu diario. <b>Por luna:</b> 1 saber madre + 1 árbol + 1 carta al linaje. 15 min diarios bastan; lo simple, repetido, hace bosque.</p></details>' +
    '<details class="menstrual-details"><summary>⚠️ Cuidados (léeme)</summary>' +
    '<p class="muted" style="font-size:12px">✅ Esto es <b>literatura y sabiduría educativa</b>, no religión ni terapia. ✅ Nadie serio te pide plata grande, obediencia ni irte al bosque lejos de tu familia: desconfía de “anastasianos” que cobren caro o separen. ✅ El parto en casa, dejar medicamentos o sacar niños del colegio son decisiones delicadas: consúltalas con matrona, médico y red (CESFAM, *4141 en Chile 24 h). Si un ejercicio te desborda, detente, camina, toma agua y conversa.</p></details>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌙 Anastasia × 13 lunas (Penco)</h4><div id="anaLunasBox"></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">Puentes dentro de la app: 🌱 <b>Siembra lunar</b> (fecha) · 🌳 <b>Bosque Nativo</b> (tu árbol) · 🌿 <b>Lawen</b> (botiquín) · 📓 <b>Gratitud</b> (bendecir) · 🎯 <b>Disciplina</b> (imagen → acto).</p></div>' +
    '</div>' +

    '<div id="anaLibros" class="hidden">' +
    '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="anaQ" placeholder="ej: cedro, amor, semilla, escuela, sistema, Anasta..." maxlength="40"></label></div>' +
    '<h4 style="margin:10px 0 6px">📚 Los 10 libros (toca para ver su llave)</h4>' +
    '<div id="anaLibGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px">' + libroGrid + '</div>' +
    '<h4 style="margin:12px 0 6px">🌲 Los 12 saberes madre (lo esencial para vivirlo)</h4>' +
    '<div id="anaSabGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px">' + sabGrid + '</div>' +
    '<div id="anaDetalle" class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><p class="muted">Toca un libro o un saber para ver su ficha completa 👆</p></div></div>' +

    '<div id="anaPract" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🤫 Silencio de taiga — 3 minutos</h4>' +
    '<p class="muted" style="font-size:12px">Como en el bosque: escucha todo a la vez, siente tus pies en la tierra. El botón te marca el tiempo; al terminar anota tu día de Espacio.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button type="button" id="anaSilencioBtn" class="btn btn-accent" style="width:auto">▶ Silencio ahora (3 min)</button>' +
    '<span id="anaSilencioMsg" class="muted" style="font-size:12px"></span></div>' +
    '<div class="conv-row" style="margin-top:8px"><label>Hoy sembré / cuidé… <input type="text" id="anaSembreHoy" placeholder="ej: semilla de poroto en boca + regué mi m² descalzo" maxlength="140"></label></div>' +
    '<div class="conv-row"><label>Hoy soñé / imaginé… <input type="text" id="anaSoneHoy" placeholder="ej: leí mi imagen: casa con huerto y niños riendo" maxlength="140"></label>' +
    '<label>Hoy amé / agradecí… <input type="text" id="anaAmeHoy" placeholder="ej: comida viva sin tele + 0 quejas con mi hijo" maxlength="100"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap;gap:8px"><button type="button" id="anaPractSave" class="btn btn-accent" style="width:auto">💾 Guardar día de Espacio</button>' +
    '<button type="button" id="anaGoSiembra" class="btn" style="width:auto">🌱 Ir a Siembra</button>' +
    '<button type="button" id="anaGoBosque" class="btn" style="width:auto">🌳 Ir a Bosque</button></div></div>' +
    practHTML + '</div>' +

    '<div id="anaTest" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📝 Test: ¿cómo está tu Espacio? (20 afirmaciones)</h4>' +
    '<p class="muted" style="font-size:12px">Responde según <b>cómo vives casi siempre</b>. Escala: Nunca (0) · A veces (1) · A menudo (2) · Muy cierto (3). ~5 minutos. Mide tu <b>Jardinero 🌱 · Soñador 💭 · Creador 💚</b> + tu <b>nivel de prisa/sistema ⛓️</b> (X). <b>No es diagnóstico</b>: es un espejo para elegir por dónde empezar.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="anaTestReset" class="btn" style="width:auto">↺ Limpiar</button>' +
    '<button type="button" id="anaTestCalc" class="btn btn-accent" style="width:auto">📊 Ver mi resultado</button></div>' +
    '<div id="anaProgreso" class="muted" style="font-size:11px;margin-top:6px"></div></div>' +
    '<div id="anaTestBox" style="margin-top:10px">' + testHTML + '</div>' +
    '<div id="anaResultado" class="menstrual-card hidden" style="margin-top:10px;border-color:var(--gold)"></div></div>' +

    '<div id="anaCamino" class="hidden">' +
    '<div class="menstrual-grid"><div class="menstrual-card" style="border-color:var(--gold)"><h4>🌱 Mi vía</h4>' +
    '<div class="conv-row"><label>Mi vía dominante <select id="anaMiVia"><option value="">— sin definir —</option><option value="J">🌱 Jardinero · Manos en tierra</option><option value="S">💭 Soñador · Imagen clara</option><option value="C">💚 Creador · Amor que hace</option></select></label></div>' +
    '<div id="anaMiViaBox" style="margin-top:6px"></div></div>' +
    '<div class="menstrual-card"><h4>📓 Diario del Espacio</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="anaDiaFecha"></label></div>' +
    '<label>Hoy en mi Espacio… (sembré + soñé + amé) <input type="text" id="anaDiaTxt" placeholder="ej: regué mi m², leí mi imagen, cociné vivo sin tele" maxlength="140"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="anaDiaAdd" class="btn btn-accent" style="width:auto">+ Guardar hoy</button></div>' +
    '<div id="anaDiaList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌲 Mis días de Espacio (racha de Amor)</h4><div id="anaPractsBox"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕘 Historial de tests</h4><div id="anaHistBox"></div></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap;gap:8px">' +
    '<span id="anaStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="anaShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="anaToNote" class="btn" style="width:auto">📝 Llevar a nota de hoy</button>' +
    '<button type="button" id="anaClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar todo</button></span></div></div>';

  makeDialog('anastasiaDialog', '🌲 Anastasia · Cedros Resonantes',
    'El Espacio de Amor de Vladimir Megre para la vida común: siembra con amor, sueña claro y cría sin miedo. En Penco, en tu casa, hoy. Todo <b>privado y local</b>.',
    body);
}

function renderLunasBox() {
  var box = $('anaLunasBox'); if (!box) return;
  box.innerHTML = ANA_LUNAS.map(function (t) {
    return '<div class="si-card"><p>' + esc(t) + '</p></div>';
  }).join('');
}

function renderDetalleLibro(id) {
  var box = $('anaDetalle'); if (!box) return;
  var t = anaLibro(id); if (!t) return;
  box.innerHTML =
    '<h4 style="color:var(--gold)">' + t.ico + ' ' + esc(t.n) + '</h4>' +
    '<p style="font-size:12px;line-height:1.6">' + esc(t.resumen) + '</p>' +
    '<div class="si-card"><h4>🔑 Llave para hoy</h4><p>' + esc(t.llave) + '</p></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
    '<button type="button" class="btn btn-accent" id="anaLeerBtn" style="width:auto">✓ Leer este esta luna</button></div>';
  var hb = $('anaLeerBtn');
  if (hb) hb.onclick = function () {
    var k = todayKey();
    var d = store();
    d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '📚 Esta luna leo: ' + t.n + ' — ' + t.llave;
    save('Libro llevado a tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
  };
}

function renderDetalle(id) {
  var box = $('anaDetalle'); if (!box) return;
  var t = anaSaber(id); if (!t) return;
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
    sec('⚙️', 'Cómo funciona según Anastasia', t.como) +
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
    '<button type="button" class="btn" id="anaFavBtn" style="width:auto">' + (fav ? '★ Quitar de favoritas' : '☆ Marcar favorita') + '</button>' +
    '<button type="button" class="btn btn-accent" id="anaHoyBtn" style="width:auto">✓ Vivir este hoy</button></div>';
  var fb = $('anaFavBtn');
  if (fb) fb.onclick = function () {
    var d = store();
    var i = d.favs.indexOf(id);
    if (i >= 0) d.favs.splice(i, 1); else d.favs.push(id);
    save(); renderDetalle(id);
  };
  var hb = $('anaHoyBtn');
  if (hb) hb.onclick = function () {
    var k = todayKey();
    var d = store();
    d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🌲 Hoy vivo: ' + t.cap + ' — ' + t.pregunta;
    save('Saber llevado a tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
  };
}

function filterSaberes() {
  var q = (($('anaQ') || {}).value || '').toLowerCase();
  document.querySelectorAll('#anaLibGrid .ana-lib-card').forEach(function (card) {
    var t = anaLibro(card.dataset.lib);
    if (!t) return;
    var hay = ((t.n + ' ' + t.tag + ' ' + t.resumen + ' ' + t.llave).toLowerCase().indexOf(q) >= 0);
    card.style.display = hay ? '' : 'none';
  });
  document.querySelectorAll('#anaSabGrid .ana-sab-card').forEach(function (card) {
    var t = anaSaber(card.dataset.sab);
    if (!t) return;
    var hay = ((t.cap + ' ' + t.tag + ' ' + t.idea + ' ' + t.texto + ' ' + t.libro + ' ' + (t.historia || '') + ' ' + (t.como || '') + ' ' + (t.penco || '')).toLowerCase().indexOf(q) >= 0);
    card.style.display = hay ? '' : 'none';
  });
}

function calcTest() {
  var sc = { J: 0, S: 0, C: 0, X: 0 };
  var contestadas = 0;
  for (var i = 0; i < ANA_TEST.length; i++) {
    var sel = document.querySelector('input[name="anaQ' + i + '"]:checked');
    if (sel) { contestadas++; sc[ANA_TEST[i].c] += +sel.value; }
  }
  return { sc: sc, contestadas: contestadas };
}
function updateProgreso() {
  var r = calcTest();
  var box = $('anaProgreso');
  if (box) box.textContent = r.contestadas + ' / ' + ANA_TEST.length + ' respondidas' + (r.contestadas < ANA_TEST.length ? ' — responde todas para un espejo fiel' : ' ✓ listo para calcular');
}
function showResultado(sc) {
  var box = $('anaResultado'); if (!box) return;
  var arr = [{ k: 'J', p: sc.J }, { k: 'S', p: sc.S }, { k: 'C', p: sc.C }];
  arr.sort(function (a, b) { return b.p - a.p; });
  var max = Math.max(arr[0].p, 1);
  var dom = arr[0].k;
  var sistema = sc.X;
  var sisTxt = sistema <= 5 ? 'Liviano: el sistema te roba poco. Sostén con 1 práctica diaria.' : sistema <= 9 ? 'Medio: prisa y ruido frecuentes. 1 ayuno de noticias + caminata te cambian la luna.' : 'Pesado: mucho sistema y poca tierra. Parte por 1 semilla + 1 silencio, sin exigirte todo.';
  box.classList.remove('hidden');
  box.innerHTML = '<h4>📊 Tu espejo (sin guardar)</h4>' +
    '<p class="muted" style="font-size:11px">Máximo por vía: 15 (5 preguntas × 3). Sistema (X): máximo 15 — mientras más alto, más prisa y ruido.</p>' +
    arr.map(function (a) {
      var c = ANA_VIAS[a.k];
      var pct = Math.round(a.p / max * 100);
      var isTop = dom === a.k;
      return '<div style="display:flex;align-items:center;gap:8px;margin:4px 0">' +
        '<span style="min-width:150px;font-size:12px"><b>' + c.ico + ' ' + esc(c.nombre) + '</b></span>' +
        '<span style="flex:1;background:var(--panel);border:1px solid var(--line);border-radius:6px;height:14px;position:relative;overflow:hidden">' +
        '<span style="display:block;height:100%;width:' + pct + '%;background:' + (isTop ? 'var(--gold)' : 'var(--accent)') + ';opacity:' + (isTop ? '1' : '.55') + '"></span></span>' +
        '<b style="min-width:30px;text-align:right">' + a.p + '</b></div>';
    }).join('') +
    '<div class="si-card" style="margin-top:8px"><h4>' + ANA_VIAS[dom].ico + ' Tu vía fuerte: ' + esc(ANA_VIAS[dom].nombre) + '</h4>' +
    '<p>' + esc(ANA_VIAS[dom].desc) + '</p><p><b>Entrena así:</b> ' + esc(ANA_VIAS[dom].entrena) + '</p>' +
    '<p class="muted">⛓️ Nivel de sistema: <b>' + sistema + '/15</b> — ' + esc(sisTxt) + '</p></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn btn-accent" id="anaSaveTest" style="width:auto">💾 Guardar este test</button>' +
    '<button type="button" class="btn" id="anaSetVia" style="width:auto">✓ Mi vía: ' + esc(ANA_VIAS[dom].nombre) + '</button>' +
    '<button type="button" class="btn" id="anaReadSab" style="width:auto">📖 Leer saber que me sirve</button></div>';
  var sv = $('anaSaveTest');
  if (sv) sv.onclick = function () {
    var d = store();
    d.tests.push({ id: uid('t'), fecha: todayKey(), J: sc.J, S: sc.S, C: sc.C, X: sc.X, dom: dom });
    save('Test guardado ✓'); renderHist(); renderStats();
  };
  var st = $('anaSetVia');
  if (st) st.onclick = function () {
    var d = store(); d.miVia = dom; save('Tu vía guardada ✓');
    syncMiVia(); renderMiViaBox(); renderStats(); switchTab('Camino');
  };
  var ri = $('anaReadSab');
  if (ri) ri.onclick = function () {
    var map = { J: 'semilla', S: 'pensamiento', C: 'espacio' };
    if (sistema >= 10) map[dom] = 'sistema';
    switchTab('Libros'); renderDetalle(map[dom] || 'espacio');
  };
  try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}

function syncMiVia() {
  var sel = $('anaMiVia'); if (!sel) return;
  sel.value = store().miVia || '';
}
function renderMiViaBox() {
  var box = $('anaMiViaBox'); if (!box) return;
  var k = store().miVia || '';
  if (!k || !ANA_VIAS[k]) { box.innerHTML = '<p class="muted" style="font-size:12px">Aún sin definir. Haz el test 📝 o elígela arriba: es tu punto de partida, no tu jaula.</p>'; return; }
  var c = ANA_VIAS[k];
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
  var box = $('anaPractsBox'); if (!box) return;
  var d = store().practs || [];
  var ult7 = d.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 7);
  box.innerHTML = '<p class="muted" style="font-size:11px">💚 Racha: <b>' + rachaPracts() + ' días</b> · ' + d.length + ' día(s) de Espacio · sembré → soñé → amé.</p>' +
    (ult7.length ? ult7.map(function (r) {
      return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b><br>' +
        (r.sembre ? '🌱 ' + esc(r.sembre) + '<br>' : '') + (r.sone ? '💭 ' + esc(r.sone) + '<br>' : '') + (r.ame ? '💚 ' + esc(r.ame) : '') + '</span>' +
        '<button type="button" class="btn btn-icon ana-pract-del" data-id="' + r.id + '">✕</button></div>';
    }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin días aún. Guarda tu primer día de Espacio arriba 🌲.</p>');
  box.querySelectorAll('.ana-pract-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.practs = e.practs.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderPracts(); renderStats(); };
  });
}
function renderDiario() {
  var box = $('anaDiaList'); if (!box) return;
  var d = store().diario || {};
  var keys = Object.keys(d).sort().reverse().slice(0, 30);
  if (!keys.length) { box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin registros. 3 líneas bastan: sembré + soñé + amé.</p>'; return; }
  box.innerHTML = keys.map(function (k) {
    return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(k) + '</b><br>' + esc(d[k]) + '</span>' +
      '<button type="button" class="btn btn-icon ana-dia-del" data-k="' + esc(k) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.ana-dia-del').forEach(function (x) {
    x.onclick = function () { var e = store(); delete e.diario[x.dataset.k]; save(); renderDiario(); renderStats(); };
  });
}
function renderHist() {
  var box = $('anaHistBox'); if (!box) return;
  var t = (store().tests || []).slice().reverse().slice(0, 10);
  if (!t.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin tests guardados. Responde y pulsa “💾 Guardar este test”.</p>'; return; }
  box.innerHTML = t.map(function (r) {
    return '<div class="hora-item"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b> · 🌱' + r.J + ' 💭' + r.S + ' 💚' + r.C + ' · fuerte <b>' + esc(r.dom || '') + '</b> · sistema ' + esc(String(r.X)) + '/15</span>' +
      '<button type="button" class="btn btn-icon ana-hist-del" data-id="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.ana-hist-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.tests = e.tests.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderHist(); renderStats(); };
  });
}
function renderStats() {
  var st = $('anaStats'); if (!st) return;
  var e = store();
  var nd = Object.keys(e.diario || {}).length;
  var c = e.miVia ? ANA_VIAS[e.miVia].nombre : 'sin vía';
  st.textContent = (e.tests.length ? e.tests.length + ' test(s)' : 'sin tests') + ' · ' + nd + ' día(s) diario · ' + e.practs.length + ' día(s) de Espacio · ' + c;
}

/* Silencio timer 3 min */
var anaSilTimer = null;
function runSilencio() {
  var msg = $('anaSilencioMsg'), btn = $('anaSilencioBtn');
  if (!msg) return;
  if (anaSilTimer) { clearInterval(anaSilTimer); anaSilTimer = null; if (btn) btn.textContent = '▶ Silencio ahora (3 min)'; msg.textContent = ''; return; }
  var seg = 180;
  if (btn) btn.textContent = '⏹ Detener';
  msg.textContent = 'Escucha el bosque… 3:00 (pies en tierra)';
  anaSilTimer = setInterval(function () {
    seg--;
    if (seg <= 0) {
      clearInterval(anaSilTimer); anaSilTimer = null;
      if (btn) btn.textContent = '▶ Silencio ahora (3 min)';
      msg.textContent = '✓ Listo. ¿Qué imagen quedó cuando calló el ruido? Anota tu día abajo.';
      try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
      return;
    }
    var m = Math.floor(seg / 60), s = seg % 60;
    if (seg === 90) msg.textContent = 'Siente tus pies, como raíces… 1:30';
    else if (seg === 30) msg.textContent = 'Vuelve suave al verde… 0:30';
    else msg.textContent = 'Escucha y enraíza… ' + m + ':' + String(s).padStart(2, '0');
  }, 1000);
}

function openAnastasia() {
  try {
    if ($('anaDiaFecha') && !$('anaDiaFecha').value) $('anaDiaFecha').value = todayKey();
    syncMiVia(); renderMiViaBox(); renderDiario(); renderHist(); renderPracts(); renderStats(); updateProgreso();
  } catch (e) {}
  openDlg('anastasiaDialog');
}
try { window.openAnastasia = openAnastasia; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar botón en Linaje > Interior (tras Tao si existe) */
  try {
    if (!$('btnAnastasia')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnAnastasia'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🌲 Anastasia';
        try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'anastasia megre cedros resonantes rusia taiga siberia espacio amor hacienda familiar hectarea semilla boca pensamiento imagen palabra viva concepcion parto crianza escuela Tekos comida viva piñon sistema vedas Anasta linaje co-creacion');
        var ref = g.querySelector('#btnTao') || g.querySelector('#btnTolteca');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnAnastasia');
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
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnAnastasia') < 0) ALL_BTNS.push('btnAnastasia');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnAnastasia = ['linaje', 'interior'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|interior'] && BTN_ORDER['linaje|interior'].indexOf('btnAnastasia') < 0) {
      var oi = BTN_ORDER['linaje|interior'].indexOf('btnTao');
      if (oi >= 0) BTN_ORDER['linaje|interior'].splice(oi + 1, 0, 'btnAnastasia');
      else BTN_ORDER['linaje|interior'].push('btnAnastasia');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnAnastasia = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnAnastasia"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnAnastasia"> 🌲 Anastasia';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnAnastasia !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnAnastasia = lab.querySelector('input').checked;
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
  try { addKw('btnMetodos', 'anastasia megre cedros espacio amor'); } catch (e2) {}
  try { addKw('btnSiembra', 'anastasia semilla boca siembra amor'); } catch (e3) {}
  try { addKw('btnBosque', 'anastasia cedro plantar arbol espacio amor'); } catch (e4) {}

  /* 4) diálogo */
  buildDialog();
  renderLunasBox();
  syncMiVia();
  renderMiViaBox();
  renderDiario();
  renderHist();
  renderPracts();
  renderStats();

  var b = $('btnAnastasia');
  if (b) b.onclick = function () { openAnastasia(); };

  ['Guia', 'Libros', 'Pract', 'Test', 'Camino'].forEach(function (t) {
    var tb = $('tabAna' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var q = $('anaQ'); if (q) q.oninput = filterSaberes;
  document.querySelectorAll('#anaLibGrid .ana-lib-card').forEach(function (card) {
    card.onclick = function () { renderDetalleLibro(card.dataset.lib); };
  });
  document.querySelectorAll('#anaSabGrid .ana-sab-card').forEach(function (card) {
    card.onclick = function () { renderDetalle(card.dataset.sab); };
  });
  document.querySelectorAll('.ana-pract-add').forEach(function (bp) {
    bp.onclick = function () {
      var k = todayKey();
      var d = store();
      d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🛠️ Practiqué: ' + bp.dataset.p;
      save('Práctica anotada en tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
    };
  });

  var sb = $('anaSilencioBtn'); if (sb) sb.onclick = runSilencio;
  var ps = $('anaPractSave');
  if (ps) ps.onclick = function () {
    var sm = clean((($('anaSembreHoy') || {}).value || ''), 140);
    var so = clean((($('anaSoneHoy') || {}).value || ''), 140);
    var am = clean((($('anaAmeHoy') || {}).value || ''), 100);
    if (!sm && !so && !am) { alert('Escribe al menos qué sembraste, soñaste o amaste hoy 🌲'); return; }
    var e = store();
    e.practs = e.practs.filter(function (r) { return r.fecha !== todayKey(); });
    e.practs.push({ id: uid('p'), fecha: todayKey(), sembre: sm, sone: so, ame: am });
    var txt = '🌲 Día de Espacio';
    if (sm) txt += ' · 🌱 ' + sm;
    if (so) txt += ' · 💭 ' + so;
    if (am) txt += ' · 💚 ' + am;
    e.diario[todayKey()] = (e.diario[todayKey()] ? e.diario[todayKey()] + ' | ' : '') + txt;
    save('Día de Espacio guardado ✓');
    if ($('anaSembreHoy')) $('anaSembreHoy').value = '';
    if ($('anaSoneHoy')) $('anaSoneHoy').value = '';
    if ($('anaAmeHoy')) $('anaAmeHoy').value = '';
    renderPracts(); renderDiario(); renderStats();
  };
  var gs = $('anaGoSiembra');
  if (gs) gs.onclick = function () { try { var r = $('btnSiembra'); if (r) r.click(); else alert('Abre 🌱 Siembra desde Territorio'); } catch (e) {} };
  var gb = $('anaGoBosque');
  if (gb) gb.onclick = function () { try { var r2 = $('btnBosque'); if (r2) r2.click(); else alert('Abre 🌳 Bosque desde Territorio'); } catch (e) {} };

  var tc = $('anaTestCalc');
  if (tc) tc.onclick = function () {
    var r = calcTest();
    if (r.contestadas < ANA_TEST.length) { alert('Te faltan ' + (ANA_TEST.length - r.contestadas) + ' por responder para un espejo fiel 🌲'); }
    showResultado(r.sc);
  };
  var tr = $('anaTestReset');
  if (tr) tr.onclick = function () {
    for (var i = 0; i < ANA_TEST.length; i++) {
      document.querySelectorAll('input[name="anaQ' + i + '"]').forEach(function (x) { x.checked = false; });
    }
    var rb = $('anaResultado'); if (rb) rb.classList.add('hidden');
    updateProgreso();
  };
  document.querySelectorAll('#anaTestBox input[type="radio"]').forEach(function (x) {
    x.onchange = updateProgreso;
  });

  var ma = $('anaMiVia');
  if (ma) ma.onchange = function () { var e = store(); e.miVia = ma.value || ''; save('Tu vía guardada ✓'); renderMiViaBox(); renderStats(); };
  var da = $('anaDiaAdd');
  if (da) da.onclick = function () {
    var f = ($('anaDiaFecha') || {}).value || todayKey();
    var t = clean((($('anaDiaTxt') || {}).value || ''), 300);
    if (!t) { alert('Escribe 1 línea de tu Espacio de hoy 🌲'); return; }
    var e = store();
    e.diario[f] = (e.diario[f] ? e.diario[f] + ' | ' : '') + t;
    save('Diario guardado ✓');
    if ($('anaDiaTxt')) $('anaDiaTxt').value = '';
    renderDiario(); renderStats();
  };
  var sh = $('anaShare');
  if (sh) sh.onclick = function () {
    var e = store();
    var nd = Object.keys(e.diario || {}).length;
    var c = e.miVia ? ANA_VIAS[e.miVia].nombre : 'vía por definir';
    share('🌲 Mi Espacio de Amor', 'Anastasia · Cedros Resonantes · ' + c + '\n💚 Racha: ' + rachaPracts() + ' días · ' + e.practs.length + ' días de Espacio · ' + nd + ' días de diario · ' + e.tests.length + ' test(s).\n' + ANA_LUNAS[0]);
  };
  var tn = $('anaToNote');
  if (tn) tn.onclick = function () {
    try {
      var e = store();
      var c2 = e.miVia ? ANA_VIAS[e.miVia].nombre : 'crear mi Espacio de Amor';
      var txt2 = '🌲 Anastasia (' + c2 + ') · racha ' + rachaPracts() + 'd · ' + (e.diario[todayKey()] || 'hoy siembro, sueño y amo en mi m²');
      if (typeof appendToTodayNote === 'function') { appendToTodayNote(txt2); save('Llevado a tu nota de hoy ✓'); }
      else if (typeof userData === 'function') {
        var u = userData();
        u.notas = u.notas || {}; var k = todayKey();
        u.notas[k] = u.notas[k] || {}; u.notas[k].nota = ((u.notas[k].nota || '') + '\n' + txt2).trim();
        save('Llevado a tu nota de hoy ✓');
      }
    } catch (e) {}
  };
  var cl = $('anaClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar todo tu Espacio (tests, diario, días, favoritas)?')) return;
    try {
      var u = (typeof userData === 'function') ? userData() : null;
      if (u) u.anastasia = blank();
    } catch (e) {}
    syncMiVia(); renderMiViaBox(); renderDiario(); renderHist(); renderPracts(); renderStats();
    save('Espacio borrado');
  };

  updateProgreso();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
else setup();

})();
