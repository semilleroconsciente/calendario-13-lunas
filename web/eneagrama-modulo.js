/* ============================================================
   ENEAGRAMA — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa e independiente:
   - Boton btnEneagrama (grupo Mente & Estudio, inyectado)
   - Dialogo eneagramaDialog con 5 pestanas:
     1) Que es (guia completa)
     2) 9 Eneatipos (fichas + buscador + detalle)
     3) Test (36 preguntas, 4 por tipo, escala 0-3)
     4) Subtipos / Instintos (conservacion, social, sexual)
     5) Mi camino (mi tipo, diario, historial, compartir)
   - Todo local y privado por usuario: userData().eneagrama
     { tests:[], miTipo, subtipo, diario:{}, favs:[] }
   - Sin dependencias externas. 100% offline.
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
    if (!u) return { tests: [], miTipo: 0, subtipo: '', diario: {}, favs: [] };
    if (!u.eneagrama) u.eneagrama = { tests: [], miTipo: 0, subtipo: '', diario: {}, favs: [] };
    var e = u.eneagrama;
    if (!Array.isArray(e.tests)) e.tests = [];
    if (!e.diario) e.diario = {};
    if (!Array.isArray(e.favs)) e.favs = [];
    return e;
  } catch (e2) { return { tests: [], miTipo: 0, subtipo: '', diario: {}, favs: [] }; }
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
function switchEneTab(name) {
  ['Guia', 'Tipos', 'Test', 'Sub', 'Camino'].forEach(function (t) {
    var p = $('ene' + t), b = $('tabEne' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ============================================================
   DATOS — los 9 eneatipos
   ============================================================ */
var ENE_TIPOS = [
  { n: 1, nombre: 'El Reformador', alias: 'El Perfeccionista', icon: '⚖️', centro: 'Víscera · ira', triada: 'Hace (8-9-1): cuerpo, control e ira contenida',
    pasion: 'Ira (resentimiento ordenado)', virtud: 'Serenidad', miedo: 'Ser malo, corrupto o imperfecto', deseo: 'Ser bueno, íntegro y correcto',
    mensaje: '“Está bien cometer errores”', foco: 'Lo que está mal y cómo corregirlo. Reglas, detalle, deber.',
    habla: ['“Hay que hacerlo bien”', '“No es suficiente”', '“Yo me encargo”'],
    luz: ['Ético, honesto y confiable', 'Ordenado, puntual y trabajador', 'Idealista que mejora lo común'],
    sombra: ['Crítico duro (consigo y con otros)', 'Rígido: blanco o negro', 'Resentimiento cuando otros “no cumplen”'],
    estres: 'En estrés va al 4: se vuelve melancólico y autocrítico (“nada me sale”).',
    seguridad: 'En seguridad va al 7: se suelta, ríe, improvisa y disfruta.',
    alas: '9 → más diplomático y calmo · 2 → más servicial y cálido.',
    pareja: 'Ama con lealtad y actos. Practica: agradecer en voz alta antes de corregir.',
    trabajo: 'Brilla en calidad y procesos. Cuidado: micro-control y culpa por delegar.',
    practica: '5 min: “suficientemente bueno hoy”. Haz algo al 80% a propósito y respira.',
    pregunta: '¿Qué pasaría si hoy nada fuera perfecto y aun así fuera valioso?' },
  { n: 2, nombre: 'El Ayudador', alias: 'El que Da', icon: '💞', centro: 'Corazón · vergüenza', triada: 'Siente (2-3-4): imagen, vínculo y vergüenza',
    pasion: 'Orgullo (necesidad de ser necesitado)', virtud: 'Humildad', miedo: 'No ser amado ni necesitado', deseo: 'Sentirse amado y necesario',
    mensaje: '“Tus necesidades también importan”', foco: 'Las necesidades de otros. Ser útil, gustar, conectar.',
    habla: ['“¿Necesitas algo?”', '“Yo te ayudo”', '“No me cuesta nada”'],
    luz: ['Cálido, generoso y empático', 'Sabe cuidar y consolar', 'Crea comunidad y red'],
    sombra: ['Da para recibir (y se resiente si no vuelven)', 'Le cuesta pedir y decir no', 'Se olvida de sí hasta agotarse'],
    estres: 'En estrés va al 8: se vuelve exigente y mandón (“¡después de todo lo que hice!”).',
    seguridad: 'En seguridad va al 4: se vuelve honesto con su dolor y creativo.',
    alas: '1 → más ético y ordenado · 3 → más brillante y ejecutivo.',
    pareja: 'Ama cuidando. Practica: pedir 1 cosa concreta al día sin justificarte.',
    trabajo: 'Brilla en personas y servicio. Cuidado: salvar a todos y quemarse.',
    practica: '5 min: escribe 3 necesidades tuyas y atiende 1 hoy, pequeña.',
    pregunta: 'Si nadie me necesitara hoy, ¿quién soy yo?' },
  { n: 3, nombre: 'El Triunfador', alias: 'El que Logra', icon: '🏆', centro: 'Corazón · vergüenza', triada: 'Siente (2-3-4): imagen, éxito y vergüenza al fracaso',
    pasion: 'Vanidad (imagen de éxito)', virtud: 'Veracidad (autenticidad)', miedo: 'Ser un fracasado, no valer', deseo: 'Valer, ser admirado y exitoso',
    mensaje: '“Eres amado por quien eres, no por lo que logras”', foco: 'Metas, resultados, eficiencia, imagen.',
    habla: ['“Lo logré”', '“Vamos a la meta”', '“Se puede optimizar”'],
    luz: ['Motivador, enérgico y resolutivo', 'Convierte ideas en resultados', 'Inspira a otros a superarse'],
    sombra: ['Confunde valor con rendimiento', 'Esconde el fracaso, muestra vitrina', 'Trabaja sin parar, sin sentir'],
    estres: 'En estrés va al 9: se apaga, posterga y se anestesia (scroll, series).',
    seguridad: 'En seguridad va al 6: se vuelve leal, cooperador y prudente.',
    alas: '2 → más encantador y humano · 4 → más auténtico y creativo.',
    pareja: 'Ama celebrando al otro. Practica: contar 1 fracaso del día sin chiste.',
    trabajo: 'Brilla en metas y ventas. Cuidado: quemar etapas y personas por el objetivo.',
    practica: '5 min: haz algo sin mostrarlo a nadie. Siente tu valor sin aplauso.',
    pregunta: 'Si nadie viera mis logros, ¿qué haría igual?' },
  { n: 4, nombre: 'El Individualista', alias: 'El Artista', icon: '🎨', centro: 'Corazón · vergüenza', triada: 'Siente (2-3-4): identidad, profundidad y envidia',
    pasion: 'Envidia (comparación: “a mí me falta” / “soy distinto”)', virtud: 'Ecuanimidad', miedo: 'No tener identidad ni ser nadie', deseo: 'Ser único, auténtico y comprendido',
    mensaje: '“Eres completo aquí y ahora”', foco: 'Lo auténtico, lo profundo, lo bello, lo que falta.',
    habla: ['“Nadie me entiende”', '“Esto es profundo”', '“Yo soy distinto”'],
    luz: ['Creativo, sensible y profundo', 'Da sentido a lo doloroso', 'Belleza y originalidad'],
    sombra: ['Comparación y melancolía', 'Idealiza lo ausente, desprecia lo presente', 'Altibajos: intensidad o bajón'],
    estres: 'En estrés va al 2: se apega y ayuda para ser querido (“quédate”).',
    seguridad: 'En seguridad va al 1: se vuelve disciplinado y termina lo que empieza.',
    alas: '3 → más ambicioso y visible · 5 → más reflexivo y reservado.',
    pareja: 'Ama con intensidad y estética. Practica: agradecer 1 cosa ordinaria al día.',
    trabajo: 'Brilla en arte, sentido y diseño. Cuidado: abandonar cuando deja de “inspirar”.',
    practica: '5 min: crea algo feo a propósito. Suelta el ideal y quédate con lo real.',
    pregunta: '¿Qué hay de valioso en mi vida tal como es, sin drama?' },
  { n: 5, nombre: 'El Investigador', alias: 'El Observador', icon: '🔭', centro: 'Cabeza · miedo', triada: 'Piensa (5-6-7): mente, análisis y miedo a invadir',
    pasion: 'Avaricia (retener tiempo, energía, saber)', virtud: 'Desapego (dar lo que sé)', miedo: 'Ser inútil, invadido o incapaz', deseo: 'Entenderlo todo y ser competente',
    mensaje: '“Tus necesidades no son un problema”', foco: 'Datos, teorías, refugio mental. Observar antes de entrar.',
    habla: ['“Necesito pensarlo”', '“Dame espacio”', '“En realidad…”'],
    luz: ['Lúcido, objetivo y sabio', 'Experto que va al fondo', 'Calmo en crisis'],
    sombra: ['Se aísla y posterga la vida', 'Guarda saber y no lo comparte', 'Tacaño de tiempo y emoción'],
    estres: 'En estrés va al 7: se dispersa en mil ideas y consumos.',
    seguridad: 'En seguridad va al 8: actúa, decide y pone el cuerpo.',
    alas: '4 → más sensible y creativo · 6 → más leal y previsor.',
    pareja: 'Ama compartiendo su mundo. Practica: 15 min de presencia sin analizar.',
    trabajo: 'Brilla en análisis e investigación. Cuidado: prepararse eterno sin lanzar.',
    practica: '5 min: enseña algo que sabes a alguien hoy. Sal del refugio.',
    pregunta: '¿Qué haría si ya supiera suficiente?' },
  { n: 6, nombre: 'El Leal', alias: 'El Compañero', icon: '🛡️', centro: 'Cabeza · miedo', triada: 'Piensa (5-6-7): seguridad, duda y miedo a quedarse solo',
    pasion: 'Miedo (ansiedad, escenarios catastróficos)', virtud: 'Coraje', miedo: 'Quedarse sin apoyo ni guía', deseo: 'Seguridad, apoyo y confianza',
    mensaje: '“Estás a salvo”', foco: 'Riesgos, autoridades, lealtades, peor escenario.',
    habla: ['“¿Y si sale mal?”', '“¿En quién confiamos?”', '“Yo soy leal”'],
    luz: ['Leal, responsable y valiente', 'Gran compañero y trabajador en equipo', 'Prevé y previene de verdad'],
    sombra: ['Duda y se paraliza (o se lanza contra-fóbico)', 'Desconfía o se somete a la autoridad', 'Ansiedad que contagia'],
    estres: 'En estrés va al 3: se acelera a rendir para probarse.',
    seguridad: 'En seguridad va al 9: se calma, confía y fluye.',
    alas: '5 → más analítico y prudente · 7 → más alegre y aventurero.',
    pareja: 'Ama con compromiso total. Practica: decidir 1 cosa sin pedir 3 opiniones.',
    trabajo: 'Brilla en equipos y prevención. Cuidado: frenar todo por miedo.',
    practica: '5 min: escribe el peor escenario, el más probable y 1 paso. Actúa el paso.',
    pregunta: '¿Qué haría si confiara en mí y en la vida?' },
  { n: 7, nombre: 'El Entusiasta', alias: 'El Aventurero', icon: '🎈', centro: 'Cabeza · miedo', triada: 'Piensa (5-6-7): huida del dolor hacia opciones',
    pasion: 'Gula (más: planes, sabores, viajes, ideas)', virtud: 'Sobriedad (quedarse con una cosa)', miedo: 'Quedar atrapado en dolor o aburrimiento', deseo: 'Ser libre, feliz y lleno de opciones',
    mensaje: '“Todo estará bien aunque duela”', foco: 'Lo positivo, lo nuevo, el próximo plan.',
    habla: ['“¡Qué entretenido!”', '“Tengo una idea mejor”', '“No me amarren”'],
    luz: ['Alegre, creativo y contagioso', 'Abre caminos y anima', 'Ve posibilidades donde otros ven muro'],
    sombra: ['Evita el dolor y lo pendiente', 'Empieza mucho, termina poco', 'Disperso, impulsivo, incumplidor'],
    estres: 'En estrés va al 1: se vuelve crítico y exigente de golpe.',
    seguridad: 'En seguridad va al 5: se aquieta, profundiza y termina.',
    alas: '6 → más responsable y compañero · 8 → más directo y líder.',
    pareja: 'Ama con juego y risa. Practica: quedarte 10 min en una emoción incómoda sin huir.',
    trabajo: 'Brilla en ideas y motivación. Cuidado: vender humo y dejar cachos.',
    practica: '5 min: elige UNA tarea pendiente y termínala entera. Celebra sobrio.',
    pregunta: '¿De qué estoy huyendo cuando me lleno de planes?' },
  { n: 8, nombre: 'El Desafiador', alias: 'El Líder', icon: '🔥', centro: 'Víscera · ira', triada: 'Hace (8-9-1): poder, justicia e ira directa',
    pasion: 'Lujuria (exceso de intensidad y control)', virtud: 'Inocencia (ternura sin coraza)', miedo: 'Ser dañado, controlado o traicionado', deseo: 'Protegerse y proteger: ser fuerte y libre',
    mensaje: '“Está bien ser vulnerable”', foco: 'Poder, justicia, quién manda, quién es leal.',
    habla: ['“Yo lo resuelvo”', '“Dímelo de frente”', '“No me pasen a llevar”'],
    luz: ['Protector, justo y generoso', 'Lidera en tormenta', 'Energía que mueve montañas'],
    sombra: ['Controla e intimida sin notar', 'Blanco/negro: amigo o enemigo', 'Le cuesta mostrar ternura'],
    estres: 'En estrés va al 5: se encierra y planea en frío.',
    seguridad: 'En seguridad va al 2: se vuelve tierno, cuidador y generoso.',
    alas: '7 → más expansivo y gozador · 9 → más calmado y mediador.',
    pareja: 'Ama protegiendo. Practica: pedir perdón 1 vez al día cuando te pases.',
    trabajo: 'Brilla liderando y decidiendo. Cuidado: pasar la máquina por encima.',
    practica: '5 min: baja la voz a la mitad y escucha entero. Anota lo que sientes.',
    pregunta: '¿Qué pasaría si mostrara mi herida en vez de mi fuerza?' },
  { n: 9, nombre: 'El Pacificador', alias: 'El Mediador', icon: '☁️', centro: 'Víscera · ira', triada: 'Hace (8-9-1): inercia, fusión e ira dormida',
    pasion: 'Pereza (de sí: postergar lo propio por fusionarse)', virtud: 'Acción (correcta, a tiempo)', miedo: 'Perder conexión, separarse, pelear', deseo: 'Paz, armonía y unión',
    mensaje: '“Tu presencia importa”', foco: 'Los otros, evitar conflicto, mantener la calma.',
    habla: ['“Me da lo mismo”', '“Como quieran”', '“Después lo hago”'],
    luz: ['Acoge, escucha y une', 'Calmo que calma', 'Ve todos los lados'],
    sombra: ['Se olvida de sí y se anestesia (comida, tele, rutina)', 'Dice sí por fuera, no por dentro (pasivo)', 'Explota tarde y raro'],
    estres: 'En estrés va al 6: se vuelve ansioso y desconfiado.',
    seguridad: 'En seguridad va al 3: se activa, brilla y logra.',
    alas: '8 → más firme y directo · 1 → más ordenado y correcto.',
    pareja: 'Ama acompañando. Practica: decir tu preferencia real 3 veces al día.',
    trabajo: 'Brilla mediando y sosteniendo. Cuidado: no priorizar y llegar tarde a todo.',
    practica: '5 min: escribe TU prioridad nº1 y haz 1 paso hoy, aunque incomode.',
    pregunta: '¿Qué quiero YO, aunque moleste un poco?' }
];
function eneTipo(n) { for (var i = 0; i < ENE_TIPOS.length; i++) if (ENE_TIPOS[i].n === n) return ENE_TIPOS[i]; return null; }

/* ---------- Test: 36 preguntas (4 por tipo) ---------- */
var ENE_TEST = [
  { t: 1, txt: 'Me molesta mucho cuando las cosas están mal hechas o desordenadas.' },
  { t: 2, txt: 'Me cuesta decir que no cuando alguien necesita ayuda.' },
  { t: 3, txt: 'Me importa lograr metas y que se note mi rendimiento.' },
  { t: 4, txt: 'Siento que soy diferente y que pocos me comprenden a fondo.' },
  { t: 5, txt: 'Necesito tiempo a solas para recargar y pensar.' },
  { t: 6, txt: 'Antes de decidir pienso en lo que podría salir mal.' },
  { t: 7, txt: 'Me aburro rápido y busco algo nuevo o entretenido.' },
  { t: 8, txt: 'Prefiero mandar que me manden; soy directo y fuerte.' },
  { t: 9, txt: 'Evito los conflictos aunque tenga que ceder.' },
  { t: 1, txt: 'Tengo reglas claras de lo que está bien y mal.' },
  { t: 2, txt: 'Adivino lo que otros necesitan antes de que lo pidan.' },
  { t: 3, txt: 'Me adapto a cada grupo para dar una buena imagen.' },
  { t: 4, txt: 'Vivo las emociones con intensidad, para bien o mal.' },
  { t: 5, txt: 'Prefiero observar y entender antes de participar.' },
  { t: 6, txt: 'Soy leal: si confío, estoy hasta el final.' },
  { t: 7, txt: 'Tengo muchos planes e ideas al mismo tiempo.' },
  { t: 8, txt: 'Protejo a los míos y enfrento la injusticia.' },
  { t: 9, txt: 'Me cuesta priorizar lo mío; dejo pasar el tiempo.' },
  { t: 1, txt: 'Me critico duro cuando cometo un error.' },
  { t: 2, txt: 'Me duele cuando no agradecen lo que doy.' },
  { t: 3, txt: 'Me cuesta parar de trabajar hasta lograrlo.' },
  { t: 4, txt: 'Idealizo lo que no tengo y me comparo con otros.' },
  { t: 5, txt: 'Guardo mi tiempo y energía; me agotan las interrupciones.' },
  { t: 6, txt: 'Busco una autoridad, grupo o creencia en la que confiar.' },
  { t: 7, txt: 'Evito el dolor ocupándome en cosas entretenidas.' },
  { t: 8, txt: 'Digo lo que pienso de frente, aunque incomode.' },
  { t: 9, txt: 'Digo “me da lo mismo” aunque por dentro sí me importe.' },
  { t: 1, txt: 'Corrijo a otros aunque no me lo pidan.' },
  { t: 2, txt: 'Me olvido de mis necesidades por atender a otros.' },
  { t: 3, txt: 'Escondo mis fracasos y muestro solo lo bueno.' },
  { t: 4, txt: 'Necesito expresarme de forma única y auténtica.' },
  { t: 5, txt: 'Acumulo conocimiento: leo, investigo, aprendo.' },
  { t: 6, txt: 'Cuando tengo miedo, o me paralizo o me lanzo de golpe.' },
  { t: 7, txt: 'Empiezo muchas cosas y me cuesta terminarlas.' },
  { t: 8, txt: 'Me cuesta mostrarme débil o pedir ayuda.' },
  { t: 9, txt: 'Me anestesio con comida, pantallas o rutina para no pensar.' }
];
var ENE_LIKERT = [
  { v: 0, t: 'Nunca' }, { v: 1, t: 'A veces' }, { v: 2, t: 'A menudo' }, { v: 3, t: 'Muy cierto' }
];

var ENE_SUBTIPOS = [
  { id: 'conservacion', icon: '🏠', nombre: 'Conservación (yo)', desc: 'Foco en cuerpo, casa, plata, comida, descanso, seguridad material. Pregunta: ¿tengo lo suficiente para estar bien?',
    ej: 'E1 conservación: orden maniático en casa · E7 conservación: junta recursos para sus planes · E9 conservación: comodidad y rutina que adormece.' },
  { id: 'social', icon: '👥', nombre: 'Social (nosotros)', desc: 'Foco en grupo, pertenencia, rol, prestigio, deber con la comunidad. Pregunta: ¿dónde pertenezco y qué aporto?',
    ej: 'E2 social: el que ayuda a todos en la organización · E3 social: imagen de éxito ante el grupo · E6 social: lealtad total a su equipo o causa.' },
  { id: 'sexual', icon: '🔥', nombre: 'Sexual / 1 a 1 (tú y yo)', desc: 'Foco en vínculo intenso, química, fusión con una persona o pasión. Pregunta: ¿con quién conecto de verdad?',
    ej: 'E4 sexual: amor fusión, celos e intensidad · E8 sexual: entrega y prueba total · E5 sexual: pocos vínculos pero profundísimos.' }
];

var ENE_GUIA_LUNAS = [
  { luna: '1-3 (Pukem · invierno)', tip: 'Mirar adentro: ideal para E4, E5 y E9. Práctica: diario + 1 hora sin estímulo al día.' },
  { luna: '4-6 (Pewü · primavera)', tip: 'Sembrar cambios: ideal para E1, E3 y E8. Práctica: 1 hábito nuevo de 5 min ligado a tu virtud.' },
  { luna: '7-9 (Walüng · verano)', tip: 'Mostrarte: ideal para E2, E3 y E7. Práctica: compartir tu proceso con alguien de confianza.' },
  { luna: '10-13 (Rimü · otoño)', tip: 'Cosechar y soltar: ideal para E6, E9 y E1. Práctica: inventario (qué suelto / qué agradezco).' }
];

/* ============================================================
   DIALOGO
   ============================================================ */
function buildDialog() {
  var tiposGrid = ENE_TIPOS.map(function (t) {
    return '<button type="button" class="btn ene-tipo-card" data-tipo="' + t.n + '" style="text-align:left;height:auto;padding:10px">' +
      '<b>' + t.icon + ' ' + t.n + ' · ' + esc(t.nombre) + '</b><br>' +
      '<span class="muted" style="font-size:11px">' + esc(t.alias) + ' · ' + esc(t.centro.split('·')[0].trim()) + '</span></button>';
  }).join('');

  var testHTML = ENE_TEST.map(function (q, i) {
    var opts = ENE_LIKERT.map(function (o) {
      return '<label class="check-row" style="margin:0;font-size:12px"><input type="radio" name="eneQ' + i + '" value="' + o.v + '"> ' + o.t + '</label>';
    }).join('');
    return '<div class="menstrual-card" style="margin-bottom:8px"><b style="font-size:12px">' + (i + 1) + '. ' + esc(q.txt) + '</b>' +
      '<span class="muted" style="font-size:10px"> · tipo ' + q.t + ' (oculto al responder, visible al corregir)</span>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' + opts + '</div></div>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabEneGuia" class="btn btn-accent" style="width:auto">📖 ¿Qué es?</button>' +
    '<button type="button" id="tabEneTipos" class="btn" style="width:auto">🔢 9 Tipos</button>' +
    '<button type="button" id="tabEneTest" class="btn" style="width:auto">📝 Test (36)</button>' +
    '<button type="button" id="tabEneSub" class="btn" style="width:auto">🔥 Subtipos</button>' +
    '<button type="button" id="tabEneCamino" class="btn" style="width:auto">🌱 Mi camino</button></div>' +

    /* GUIA */
    '<div id="eneGuia">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>⭘ ¿Qué es el Eneagrama?</h4>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">El <b>Eneagrama</b> (“dibujo de 9”) es un mapa de la personalidad: describe <b>9 formas de ver el mundo</b>, cada una con un miedo, un deseo y una estrategia que se armó en la infancia para sentirse seguro y amado. <b>No te encierra en una caja: te muestra la caja en la que ya estás</b> para que puedas salir.</p>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">La figura es un círculo con 9 puntos unidos por flechas. Cada punto es un <b>eneatipo</b> (del 1 al 9, sin jerarquía: ninguno es mejor). Lo que importa no es lo que haces, sino <b>por qué lo haces</b>: dos personas pueden ayudar (E2 por amor, E1 por deber, E3 por imagen).</p></div>' +
    '<div class="fishing-grid" style="margin-top:10px">' +
    '<div class="menstrual-card"><h4>🧭 Los 3 centros</h4>' +
    '<p class="muted" style="font-size:12px"><b>Víscera (8-9-1) · tema: ira.</b> Deciden con el cuerpo: control, territorio, justicia. Ira: el 8 la explota, el 9 la duerme, el 1 la contiene.</p>' +
    '<p class="muted" style="font-size:12px"><b>Corazón (2-3-4) · tema: vergüenza.</b> Deciden con la imagen: vínculo, éxito, identidad. Vergüenza: el 2 la tapa ayudando, el 3 rindiendo, el 4 hundiéndose.</p>' +
    '<p class="muted" style="font-size:12px"><b>Cabeza (5-6-7) · tema: miedo.</b> Deciden con la mente: análisis, seguridad, opciones. Miedo: el 5 se esconde, el 6 duda, el 7 huye.</p></div>' +
    '<div class="menstrual-card"><h4>🪽 Alas · ➡️ Flechas · 🔥 Subtipos</h4>' +
    '<p class="muted" style="font-size:12px"><b>Alas:</b> tus vecinos te tiñen. Un 4 con ala 3 es más ambicioso; con ala 5, más reservado. Todos tenemos algo de ambas.</p>' +
    '<p class="muted" style="font-size:12px"><b>Flechas:</b> en <b>estrés</b> tomas lo peor del otro número; en <b>seguridad</b>, lo mejor. Ej: el 1 estresado se pone melancólico como el 4; seguro, suelto como el 7.</p>' +
    '<p class="muted" style="font-size:12px"><b>Subtipos (instintos):</b> conservación (yo), social (nosotros) y sexual/1a1 (tú y yo). El mismo tipo se ve muy distinto según su instinto dominante. Ver pestaña 🔥.</p></div></div>' +
    '<details class="menstrual-details"><summary>📜 Origen en 1 minuto</summary>' +
    '<p class="muted" style="font-size:12px">Raíces antiguas (sufismo, Gurdjieff) + psicología moderna (Óscar Ichazo, Claudio Naranjo en los 70). Hoy se usa en terapia, empresas y autoconocimiento. <b>No es ciencia dura ni horóscopo</b>: es un lenguaje útil si se usa con honestidad y sin etiquetar a otros.</p></details>' +
    '<details class="menstrual-details"><summary>⚠️ Cómo usarlo bien (y 5 errores comunes)</summary>' +
    '<p class="muted" style="font-size:12px">✅ Úsalo para <b>entenderte y suavizar tu patrón</b>, no para justificarlo (“soy 8, así soy”). ✅ Confirma tu tipo leyendo 2-3 fichas y preguntando a quien te conoce. ✅ Trabaja <b>un hábito</b> de tu virtud, no todo a la vez.<br>❌ No tipifiques a otros en su cara. ❌ No lo uses para contratar, diagnosticar o pelear (“típico de 4”). ❌ No te cases con el resultado del test: es una <b>pista</b>, el tipo lo eliges tú al reconocerte. ❌ No mezcles con crisis de salud mental: si hay sufrimiento fuerte, busca ayuda profesional.</p></details>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌙 Eneagrama × 13 lunas</h4><div id="eneLunasBox"></div></div>' +
    '</div>' +

    /* TIPOS */
    '<div id="eneTipos" class="hidden">' +
    '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="eneQ" placeholder="ej: perfeccionista, miedo, ira, ayuda..." maxlength="40"></label>' +
    '<label>Centro <select id="eneCentroF"><option value="">Todos</option><option value="Víscera">Víscera (8-9-1)</option><option value="Corazón">Corazón (2-3-4)</option><option value="Cabeza">Cabeza (5-6-7)</option></select></label></div>' +
    '<div id="eneTiposGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px">' + tiposGrid + '</div>' +
    '<div id="eneDetalle" class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><p class="muted">Toca un tipo para ver su ficha completa 👆</p></div></div>' +

    /* TEST */
    '<div id="eneTest" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📝 Test rápido (36 afirmaciones)</h4>' +
    '<p class="muted" style="font-size:12px">Responde según <b>cómo eres casi siempre</b>, no cómo te gustaría ser. Escala: Nunca (0) · A veces (1) · A menudo (2) · Muy cierto (3). Toma ~6 minutos. <b>No es diagnóstico</b>: es una pista para que luego leas tus 2-3 tipos más altos y elijas el que más te reconozca (incluso en lo incómodo).</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="eneTestReset" class="btn" style="width:auto">↺ Limpiar</button>' +
    '<button type="button" id="eneTestCalc" class="btn btn-accent" style="width:auto">📊 Ver mi resultado</button></div>' +
    '<div id="eneProgreso" class="muted" style="font-size:11px;margin-top:6px"></div></div>' +
    '<div id="eneTestBox" style="margin-top:10px">' + testHTML + '</div>' +
    '<div id="eneResultado" class="menstrual-card hidden" style="margin-top:10px;border-color:var(--gold)"></div></div>' +

    /* SUBTIPOS */
    '<div id="eneSub" class="hidden">' +
    '<div class="menstrual-card"><h4>🔥 Los 3 instintos (subtipos)</h4>' +
    '<p class="muted" style="font-size:12px">Cada eneatipo tiene 3 versiones según su instinto dominante. Por eso dos personas del mismo tipo pueden verse muy distintas. Lee los 3 y elige el que más te mueva (no el que “debería”).</p></div>' +
    '<div id="eneSubBox" style="margin-top:8px"></div>' +
    '<div class="conv-row" style="margin-top:8px"><label>Mi instinto dominante <select id="eneSubSel"><option value="">— elegir —</option><option value="conservacion">🏠 Conservación (yo)</option><option value="social">👥 Social (nosotros)</option><option value="sexual">🔥 Sexual / 1 a 1</option></select></label></div></div>' +

    /* CAMINO */
    '<div id="eneCamino" class="hidden">' +
    '<div class="menstrual-grid"><div class="menstrual-card" style="border-color:var(--gold)"><h4>🌱 Mi tipo</h4>' +
    '<div class="conv-row"><label>Mi eneatipo <select id="eneMiTipo"><option value="0">— sin definir —</option></select></label></div>' +
    '<div id="eneMiTipoBox" style="margin-top:6px"></div></div>' +
    '<div class="menstrual-card"><h4>📓 Diario de trabajo interior</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="eneDiaFecha"></label></div>' +
    '<label>Hoy observé de mi patrón… <input type="text" id="eneDiaTxt" placeholder="ej: corregí 3 veces; respiré y agradecí 1" maxlength="140"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="eneDiaAdd" class="btn btn-accent" style="width:auto">+ Guardar hoy</button></div>' +
    '<div id="eneDiaList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕘 Historial de tests</h4><div id="eneHistBox"></div></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap;gap:8px">' +
    '<span id="eneStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="eneShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="eneToNote" class="btn" style="width:auto">📝 Llevar a nota de hoy</button>' +
    '<button type="button" id="eneClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar todo</button></span></div></div>';

  makeDialog('eneagramaDialog', '🔺 Eneagrama — mapa de 9 personalidades',
    'Qué eres, por qué actúas así y cómo suavizar tu patrón. Guía + fichas + test + diario. Todo <b>privado y local</b> por usuario.',
    body);
}

function renderLunasBox() {
  var box = $('eneLunasBox'); if (!box) return;
  box.innerHTML = ENE_GUIA_LUNAS.map(function (g) {
    return '<div class="si-card"><h4>' + esc(g.luna) + '</h4><p>' + esc(g.tip) + '</p></div>';
  }).join('');
}

function renderDetalle(n) {
  var box = $('eneDetalle'); if (!box) return;
  var t = eneTipo(n); if (!t) return;
  var e = store();
  var fav = e.favs.indexOf(n) >= 0;
  box.innerHTML =
    '<h4 style="color:var(--gold)">' + t.icon + ' Tipo ' + t.n + ' · ' + esc(t.nombre) + ' <span class="muted">(' + esc(t.alias) + ')</span></h4>' +
    '<p class="muted" style="font-size:12px"><b>Centro:</b> ' + esc(t.centro) + ' · ' + esc(t.triada) + '<br><b>Pasión:</b> ' + esc(t.pasion) + ' · <b>Virtud a entrenar:</b> ' + esc(t.virtud) + '</p>' +
    '<div class="fishing-grid"><div><p style="font-size:12px"><b>😨 Miedo base:</b> ' + esc(t.miedo) + '<br><b>💛 Deseo base:</b> ' + esc(t.deseo) + '<br><b>💬 Mensaje que sana:</b> ' + esc(t.mensaje) + '<br><b>🔍 Foco de atención:</b> ' + esc(t.foco) + '</p>' +
    '<p class="muted" style="font-size:12px"><b>Habla típica:</b> ' + t.habla.map(esc).join(' · ') + '</p></div>' +
    '<div><p style="font-size:12px">🌟 <b>En luz:</b><br>· ' + t.luz.map(esc).join('<br>· ') + '</p>' +
    '<p style="font-size:12px">🌑 <b>En sombra:</b><br>· ' + t.sombra.map(esc).join('<br>· ') + '</p></div></div>' +
    '<p class="muted" style="font-size:12px">➡️ <b>Flechas:</b> ' + esc(t.estres) + ' ' + esc(t.seguridad) + '<br>🪽 <b>Alas:</b> ' + esc(t.alas) + '</p>' +
    '<p style="font-size:12px">❤️ <b>En pareja:</b> ' + esc(t.pareja) + '<br>💼 <b>En trabajo:</b> ' + esc(t.trabajo) + '</p>' +
    '<div class="si-card"><h4>✏️ Práctica 5 min</h4><p>' + esc(t.practica) + '</p><p class="muted">Pregunta sombra: <i>' + esc(t.pregunta) + '</i></p></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
    '<button type="button" class="btn" id="eneFavBtn" style="width:auto">' + (fav ? '★ Quitar de favoritos' : '☆ Marcar favorito') + '</button>' +
    '<button type="button" class="btn btn-accent" id="eneSoyBtn" style="width:auto">✓ Este soy yo</button></div>';
  var fb = $('eneFavBtn');
  if (fb) fb.onclick = function () {
    var d = store();
    var i = d.favs.indexOf(n);
    if (i >= 0) d.favs.splice(i, 1); else d.favs.push(n);
    save(); renderDetalle(n);
  };
  var sb = $('eneSoyBtn');
  if (sb) sb.onclick = function () {
    var d = store(); d.miTipo = n; save('Tu tipo guardado ✓');
    syncMiTipo(); renderMiTipoBox(); switchEneTab('Camino');
  };
}

function filterTipos() {
  var q = (($('eneQ') || {}).value || '').toLowerCase();
  var c = ($('eneCentroF') || {}).value || '';
  var cards = document.querySelectorAll('#eneTiposGrid .ene-tipo-card');
  cards.forEach(function (card) {
    var n = +card.dataset.tipo;
    var t = eneTipo(n);
    var hay = ((t.nombre + ' ' + t.alias + ' ' + t.miedo + ' ' + t.deseo + ' ' + t.pasion + ' ' + t.virtud + ' ' + t.foco + ' ' + t.centro).toLowerCase().indexOf(q) >= 0);
    var okC = !c || t.centro.indexOf(c) === 0;
    card.style.display = (hay && okC) ? '' : 'none';
  });
}

function calcTest() {
  var scores = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var contestadas = 0;
  for (var i = 0; i < ENE_TEST.length; i++) {
    var sel = document.querySelector('input[name="eneQ' + i + '"]:checked');
    if (sel) { contestadas++; scores[ENE_TEST[i].t] += +sel.value; }
  }
  return { scores: scores, contestadas: contestadas };
}
function updateProgreso() {
  var r = calcTest();
  var box = $('eneProgreso');
  if (box) box.textContent = r.contestadas + ' / ' + ENE_TEST.length + ' respondidas' + (r.contestadas < ENE_TEST.length ? ' — responde todas para un resultado fiable' : ' ✓ listo para calcular');
}
function showResultado(scores, saved) {
  var box = $('eneResultado'); if (!box) return;
  var arr = [];
  for (var n = 1; n <= 9; n++) arr.push({ n: n, p: scores[n] });
  arr.sort(function (a, b) { return b.p - a.p; });
  var max = Math.max.apply(null, arr.map(function (a) { return a.p; })) || 1;
  var top = arr.slice(0, 3);
  box.classList.remove('hidden');
  box.innerHTML = '<h4>📊 Tu resultado ' + (saved ? '(guardado ✓)' : '(sin guardar)') + '</h4>' +
    '<p class="muted" style="font-size:11px">Puntaje máximo por tipo: 12 (4 preguntas × 3). Lee tus 2-3 más altos y elige el que más te reconozca, sobre todo en lo incómodo.</p>' +
    arr.map(function (a) {
      var t = eneTipo(a.n);
      var pct = Math.round(a.p / max * 100);
      var isTop = top[0].n === a.n;
      return '<div style="display:flex;align-items:center;gap:8px;margin:4px 0">' +
        '<span style="min-width:92px;font-size:12px"><b>' + t.icon + ' E' + a.n + '</b> ' + esc(t.alias.replace('El ', '').replace('La ', '')) + '</span>' +
        '<span style="flex:1;background:var(--panel);border:1px solid var(--line);border-radius:6px;height:14px;position:relative;overflow:hidden">' +
        '<span style="display:block;height:100%;width:' + pct + '%;background:' + (isTop ? 'var(--gold)' : 'var(--accent)') + ';opacity:' + (isTop ? '1' : '.55') + '"></span></span>' +
        '<b style="min-width:34px;text-align:right">' + a.p + '</b>' +
        '<button type="button" class="btn btn-icon ene-ver" data-n="' + a.n + '" title="Ver ficha">👁</button></div>';
    }).join('') +
    '<div class="si-card" style="margin-top:8px"><h4>🔎 Tus 3 probables: ' + top.map(function (a) { return 'E' + a.n + ' (' + a.p + ')'; }).join(' · ') + '</h4>' +
    '<p>' + esc(eneTipo(top[0].n).nombre) + ': ' + esc(eneTipo(top[0].n).practica) + '</p>' +
    '<p class="muted">Toca 👁 para leer cada ficha y luego marca “✓ Este soy yo” en la que más te reconozcas.</p></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn btn-accent" id="eneSaveTest" style="width:auto">💾 Guardar este test</button>' +
    '<button type="button" class="btn" id="eneReadTop" style="width:auto">📖 Leer mi probable (E' + top[0].n + ')</button></div>';
  box.querySelectorAll('.ene-ver').forEach(function (b) {
    b.onclick = function () { switchEneTab('Tipos'); renderDetalle(+b.dataset.n); };
  });
  var rt = $('eneReadTop');
  if (rt) rt.onclick = function () { switchEneTab('Tipos'); renderDetalle(top[0].n); };
  var sv = $('eneSaveTest');
  if (sv) sv.onclick = function () {
    var d = store();
    d.tests.push({ id: uid('t'), fecha: todayKey(), scores: scores.slice(1), top: top.map(function (a) { return a.n; }) });
    save('Test guardado ✓'); renderHist(); renderStats();
  };
  try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}

function renderSubs() {
  var box = $('eneSubBox'); if (!box) return;
  var d = store();
  box.innerHTML = ENE_SUBTIPOS.map(function (s) {
    var active = d.subtipo === s.id;
    return '<div class="menstrual-card" style="' + (active ? 'border-color:var(--gold)' : '') + '"><h4>' + s.icon + ' ' + esc(s.nombre) + (active ? ' ✓ tu dominante' : '') + '</h4>' +
      '<p class="muted" style="font-size:12px">' + esc(s.desc) + '</p><p style="font-size:12px">' + esc(s.ej) + '</p>' +
      '<button type="button" class="btn ene-sub-pick" data-id="' + s.id + '" style="width:auto">' + (active ? '✓ Dominante' : 'Elegir como dominante') + '</button></div>';
  }).join('');
  box.querySelectorAll('.ene-sub-pick').forEach(function (b) {
    b.onclick = function () { var e = store(); e.subtipo = b.dataset.id; save(); renderSubs(); syncSubSel(); };
  });
}
function syncSubSel() { var s = $('eneSubSel'); if (s) s.value = store().subtipo || ''; }
function syncMiTipo() {
  var sel = $('eneMiTipo'); if (!sel) return;
  if (!sel.options || sel.options.length <= 1) {
    sel.innerHTML = '<option value="0">— sin definir —</option>' + ENE_TIPOS.map(function (t) {
      return '<option value="' + t.n + '">' + t.icon + ' E' + t.n + ' · ' + esc(t.nombre) + '</option>';
    }).join('');
  }
  sel.value = String(store().miTipo || 0);
}
function renderMiTipoBox() {
  var box = $('eneMiTipoBox'); if (!box) return;
  var n = +store().miTipo || 0;
  if (!n) { box.innerHTML = '<p class="muted" style="font-size:12px">Aún sin definir. Haz el test 📝 o lee las fichas 🔢 y marca “✓ Este soy yo”.</p>'; return; }
  var t = eneTipo(n);
  var sub = ENE_SUBTIPOS.filter(function (s) { return s.id === store().subtipo; })[0];
  box.innerHTML = '<div class="chip" style="display:block;white-space:normal;line-height:1.5"><b>' + t.icon + ' E' + t.n + ' · ' + esc(t.nombre) + '</b> (' + esc(t.alias) + ')<br>' +
    'Virtud a entrenar: <b>' + esc(t.virtud) + '</b> · Pasión a observar: ' + esc(t.pasion) +
    (sub ? '<br>Instinto dominante: <b>' + esc(sub.nombre) + '</b>' : '') +
    '<br><span class="muted">Práctica de hoy: ' + esc(t.practica) + '</span></div>' +
    '<div style="margin-top:6px"><button type="button" class="btn" id="eneVerMiTipo" style="width:auto">📖 Ver mi ficha completa</button></div>';
  var b = $('eneVerMiTipo');
  if (b) b.onclick = function () { switchEneTab('Tipos'); renderDetalle(n); };
}
function renderDiario() {
  var box = $('eneDiaList'); if (!box) return;
  var d = store().diario || {};
  var keys = Object.keys(d).sort().reverse().slice(0, 30);
  if (!keys.length) { box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin registros. Anota 1 observación de tu patrón al día (2 líneas bastan).</p>'; return; }
  box.innerHTML = keys.map(function (k) {
    return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(k) + '</b><br>' + esc(d[k]) + '</span>' +
      '<button type="button" class="btn btn-icon ene-dia-del" data-k="' + esc(k) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.ene-dia-del').forEach(function (x) {
    x.onclick = function () { var e = store(); delete e.diario[x.dataset.k]; save(); renderDiario(); renderStats(); };
  });
}
function renderHist() {
  var box = $('eneHistBox'); if (!box) return;
  var t = store().tests || [];
  if (!t.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin tests guardados. Responde el test y pulsa “💾 Guardar este test”.</p>'; return; }
  box.innerHTML = t.slice().reverse().slice(0, 10).map(function (r) {
    var arr = (r.scores || []).map(function (p, i) { return { n: i + 1, p: p }; }).sort(function (a, b) { return b.p - a.p; });
    var top3 = arr.slice(0, 3).map(function (a) { return 'E' + a.n + ':' + a.p; }).join(' · ');
    return '<div class="hora-item"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b> · ' + esc(top3) + '</span>' +
      '<span style="display:flex;gap:6px"><button type="button" class="btn btn-icon ene-hist-ver" data-id="' + r.id + '" title="Ver">👁</button>' +
      '<button type="button" class="btn btn-icon ene-hist-del" data-id="' + r.id + '" title="Borrar">✕</button></span></div>';
  }).join('');
  box.querySelectorAll('.ene-hist-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.tests = e.tests.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderHist(); renderStats(); };
  });
  box.querySelectorAll('.ene-hist-ver').forEach(function (x) {
    x.onclick = function () {
      var e = store(); var r = null;
      e.tests.forEach(function (t2) { if (t2.id === x.dataset.id) r = t2; });
      if (!r) return;
      var scores = [0].concat(r.scores || [0, 0, 0, 0, 0, 0, 0, 0, 0]);
      switchEneTab('Test'); showResultado(scores, true);
    };
  });
}
function renderStats() {
  var st = $('eneStats'); if (!st) return;
  var e = store();
  var nd = Object.keys(e.diario || {}).length;
  st.textContent = (e.tests.length ? e.tests.length + ' test(s)' : 'sin tests') + ' · ' + nd + ' día(s) de diario' + (e.miTipo ? ' · E' + e.miTipo + ' ' + eneTipo(+e.miTipo).nombre : '');
}

/* ---------- setup ---------- */
function setup() {
  // 1) inyectar boton en Linaje > Interior (estático en index.html; migrar si quedó en grupo viejo)
  try {
    if (!$('btnEneagrama')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnEneagrama'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🔺 Eneagrama';
        try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'eneagrama eneatipo personalidad test autoconocimiento reforma ayudador triunfador artista investigador leal entusiasta desafiador pacificador alas flechas subtipo instinto virtud pasion');
        g.appendChild(btn);
      }
    } else {
      try {
        var curE = $('btnEneagrama');
        var curGE = curE.closest ? curE.closest('.action-group') : null;
        var curNE = curGE && curGE.getAttribute ? curGE.getAttribute('data-group') : null;
        if (curNE && curNE !== 'linaje') {
          var gdE = document.querySelector('.action-group[data-group="linaje"] .group-btns');
          if (gdE) { gdE.appendChild(curE); try { curE.setAttribute('data-sub', 'interior'); } catch (eS) {} }
        }
      } catch (eM) {}
    }
  } catch (e) {}
  // 2) registrar en ALL_BTNS + PRESETS + visibilidad
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnEneagrama') < 0) ALL_BTNS.push('btnEneagrama');
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnEneagrama = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  // 3) checkbox en configDialog (grupo Linaje)
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnEneagrama"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnEneagrama"> 🔺 Eneagrama';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnEneagrama !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnEneagrama = lab.querySelector('input').checked;
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
  try { addKw('btnPsico', 'eneagrama test eneatipo'); } catch (e2) {}

  // 4) dialogo
  buildDialog();
  renderLunasBox();
  renderSubs();
  syncSubSel();
  syncMiTipo();
  renderMiTipoBox();
  renderDiario();
  renderHist();
  renderStats();

  var b = $('btnEneagrama');
  if (b) b.onclick = function () {
    if (!$('eneDiaFecha').value) $('eneDiaFecha').value = todayKey();
    syncMiTipo(); renderMiTipoBox(); renderDiario(); renderHist(); renderStats(); updateProgreso();
    openDlg('eneagramaDialog');
  };

  ['Guia', 'Tipos', 'Test', 'Sub', 'Camino'].forEach(function (t) {
    var tb = $('tabEne' + t);
    if (tb) tb.onclick = function () { switchEneTab(t); };
  });

  var q = $('eneQ'); if (q) q.oninput = filterTipos;
  var cf = $('eneCentroF'); if (cf) cf.onchange = filterTipos;
  document.querySelectorAll('#eneTiposGrid .ene-tipo-card').forEach(function (card) {
    card.onclick = function () { renderDetalle(+card.dataset.tipo); };
  });

  document.querySelectorAll('input[name^="eneQ"]').forEach(function (r) {
    r.onchange = updateProgreso;
  });
  var rs = $('eneTestReset');
  if (rs) rs.onclick = function () {
    document.querySelectorAll('input[name^="eneQ"]').forEach(function (r) { r.checked = false; });
    var rb = $('eneResultado'); if (rb) rb.classList.add('hidden');
    updateProgreso();
  };
  var calc = $('eneTestCalc');
  if (calc) calc.onclick = function () {
    var r = calcTest();
    if (r.contestadas < ENE_TEST.length) {
      if (!confirm('Respondiste ' + r.contestadas + ' de ' + ENE_TEST.length + '. El resultado será poco fiable. ¿Verlo igual?')) return;
    }
    showResultado(r.scores, false);
    switchEneTab('Test');
  };

  var ss = $('eneSubSel');
  if (ss) ss.onchange = function () { var e = store(); e.subtipo = ss.value; save(); renderSubs(); };

  var mt = $('eneMiTipo');
  if (mt) mt.onchange = function () { var e = store(); e.miTipo = +mt.value || 0; save('Tu tipo guardado ✓'); renderMiTipoBox(); renderStats(); };

  var da = $('eneDiaAdd');
  if (da) da.onclick = function () {
    var k = ($('eneDiaFecha') && $('eneDiaFecha').value) || todayKey();
    var txt = clean((($('eneDiaTxt') || {}).value || '').trim(), 300);
    if (!txt) return alert('Escribe tu observación primero (2 líneas bastan)');
    var e = store();
    e.diario[k] = txt;
    save('Guardado ✓'); $('eneDiaTxt').value = '';
    renderDiario(); renderStats();
  };

  var sh = $('eneShare');
  if (sh) sh.onclick = async function () {
    var e = store();
    var t = e.miTipo ? eneTipo(+e.miTipo) : null;
    var sub = ENE_SUBTIPOS.filter(function (s) { return s.id === e.subtipo; })[0];
    var txt = t ? ('🔺 Mi eneatipo: E' + t.n + ' · ' + t.nombre + ' (' + t.alias + ')\nVirtud a entrenar: ' + t.virtud + '\nPráctica: ' + t.practica + (sub ? '\nInstinto: ' + sub.nombre : '')) : '🔺 Eneagrama: aún sin tipo definido';
    var last = (e.tests || []).slice(-1)[0];
    if (last) txt += '\nÚltimo test (' + last.fecha + '): ' + last.top.map(function (n) { return 'E' + n; }).join(' · ');
    await share('Mi Eneagrama', txt);
  };
  var tn = $('eneToNote');
  if (tn) tn.onclick = function () {
    var e = store();
    var t = e.miTipo ? eneTipo(+e.miTipo) : null;
    var txt = (($('eneDiaTxt') || {}).value || '').trim() || (t ? ('🔺 E' + t.n + ' ' + t.nombre + ': ' + t.practica) : '🔺 Trabajo de eneagrama');
    if (!txt) return alert('Escribe algo primero');
    try {
      var info = (typeof todayInfo === 'function') ? todayInfo() : null;
      if (!info) return alert('No se pudo ubicar hoy');
      var note = txt.slice(0, 280);
      if (info.luna === 'dft') { var c = cyc(currentCycleYear()); c.dft.nota = (c.dft.nota ? c.dft.nota + '\n' : '') + note; }
      else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + note; }
      save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
      alert('Llevado a la nota de hoy ✓');
    } catch (e2) { alert('No se pudo llevar a la nota'); }
  };
  var cl = $('eneClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar todo tu registro de Eneagrama (tests, tipo, diario)?')) return;
    try { var u = userData(); u.eneagrama = { tests: [], miTipo: 0, subtipo: '', diario: {}, favs: [] }; } catch (e) {}
    save(); syncMiTipo(); syncSubSel(); renderSubs(); renderMiTipoBox(); renderDiario(); renderHist(); renderStats();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 400); });
else setTimeout(setup, 400);

})();
