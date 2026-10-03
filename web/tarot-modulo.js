/* ============================================================
   TAROT — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa e independiente:
   - Boton btnTarot (grupo Linaje > Interior)
   - Dialogo tarotDialog con 5 pestanas:
     1) Guia (que es, como preguntar, etica)
     2) Arcanos Mayores (22 fichas + buscador + detalle)
     3) Arcanos Menores (4 palos x 14: significados + cortesanas)
     4) Tiradas (carta del dia, 3 cartas, cruz de consejo, si/no)
     5) Mi diario (historial, notas, compartir, llevar al dia)
   - Todo local y privado por usuario: userData().tarot
     { lecturas:[], diario:{}, favs:[] }
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
    if (!u) return { lecturas: [], diario: {}, favs: [] };
    if (!u.tarot) u.tarot = { lecturas: [], diario: {}, favs: [] };
    var t = u.tarot;
    if (!Array.isArray(t.lecturas)) t.lecturas = [];
    if (!t.diario) t.diario = {};
    if (!Array.isArray(t.favs)) t.favs = [];
    return t;
  } catch (e2) { return { lecturas: [], diario: {}, favs: [] }; }
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
function switchTab(name) {
  ['Guia', 'Mayores', 'Menores', 'Tiradas', 'Diario'].forEach(function (t) {
    var p = $('tar' + t), b = $('tabTar' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}
// hash determinista para "carta del dia" (misma fecha = misma carta base)
function hashStr(s) { var h = 0; for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; } return Math.abs(h); }
function shuffled(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* ============================================================
   DATOS — 22 Arcanos Mayores (Rider-Waite tradicional)
   ============================================================ */
var MAYORES = [
  { n: 0, nombre: 'El Loco', icon: '🃏', clave: 'Salto, libertad, comienzo', luz: 'Espontaneidad, fe en el camino, aventura. Momento de partir sin mapa: la vida premia al que se atreve.', sombra: 'Imprudencia, huida, caos por no mirar el barranco. Picardía sin responsabilidad.', amor: 'Amor libre o encuentro inesperado. En pareja: pide juego y aire, no control.', trabajo: 'Nuevo proyecto, cambio de rumbo. Atrévete, pero lleva paracaídas: un plan mínimo.', consejo: 'Da el primer paso aunque no veas toda la escalera.', pregunta: '¿Qué haría si el miedo no mandara?', inv: 'Freno necesario: mira el barranco antes de saltar. No confundas libertad con evasión.' },
  { n: 1, nombre: 'El Mago', icon: '🎩', clave: 'Voluntad, recursos, inicio', luz: 'Tienes todo sobre la mesa: mente, palabra, manos y corazón. Es hora de actuar y manifestar.', sombra: 'Manipulación, truco, prometer más de lo que hay. Talento usado para impresionar.', amor: 'Conquista, chispa, iniciativa. Habla claro lo que quieres.', trabajo: 'Excelente para lanzar, negociar y mostrar tu oficio. Usa tus herramientas.', consejo: 'Convierte la idea en un gesto concreto hoy.', pregunta: '¿Qué recurso ya tengo y no estoy usando?', inv: 'Energía dispersa o bloqueo: ordena tus herramientas. Cuidado con quien vende humo (incluyéndote).' },
  { n: 2, nombre: 'La Sacerdotisa', icon: '🌙', clave: 'Intuición, misterio, espera', luz: 'Escucha lo no dicho. Sueños, cuerpo y señales saben más que el ruido. Estudia en silencio.', sombra: 'Secretos, pasividad que se vuelve estancamiento, intuición ignorada.', amor: 'Amor que aún no se nombra. No fuerces definiciones; observa.', trabajo: 'Investiga antes de firmar. Lo importante está entre líneas.', consejo: 'Guarda silencio 24 h y deja que la respuesta madure.', pregunta: '¿Qué sé en el cuerpo que mi mente aún no acepta?', inv: 'Ruido externo tapa tu voz interior. Desconecta y vuelve al diario y al sueño.' },
  { n: 3, nombre: 'La Emperatriz', icon: '👑', clave: 'Abundancia, cuidado, crear', luz: 'Fertilidad en todo sentido: proyectos, hogar, cuerpo. Nutre y deja florecer.', sombra: 'Sobreprotección, dependencia, descuido propio por cuidar a todos.', amor: 'Amor que nutre: ternura, placer, hogar. También anuncio posible de embarazo/maternidad.', trabajo: 'Crear, embellecer, hacer crecer. Buen momento para cosechar lo sembrado.', consejo: 'Cuida algo hoy (planta, cuerpo, vínculo) con presencia total.', pregunta: '¿Qué necesita ser nutrido en mi vida ahora?', inv: 'Agotamiento de tanto dar. Vuelve a ti: descanso, placer y límites.' },
  { n: 4, nombre: 'El Emperador', icon: '🏛️', clave: 'Orden, estructura, límites', luz: 'Pon orden: reglas claras, horarios, presupuesto. La firmeza amorosa sostiene.', sombra: 'Rigidez, autoritarismo, control que asfixia.', amor: 'Pide compromiso claro y acuerdos. Menos promesa, más hecho.', trabajo: 'Lidera con estructura: plan, roles, plazos. Ideal para trámites y jefaturas.', consejo: 'Define una regla que te proteja y cúmplela 7 días.', pregunta: '¿Qué estructura me daría libertad?', inv: 'Afloja el control: delega una cosa. Revisa si mandas por miedo.' },
  { n: 5, nombre: 'El Hierofante', icon: '⛪', clave: 'Tradición, guía, valores', luz: 'Maestro, ritual, comunidad de sentido. Aprende de quien ya recorrió el camino.', sombra: 'Dogma, culpa, obedecer sin pensar. "Siempre se hizo así".', amor: 'Vínculo que busca formalizarse o bendecirse. Valores compartidos importan.', trabajo: 'Capacítate, certifícate, busca mentor. Las instituciones juegan a tu favor si sigues el conducto.', consejo: 'Crea o retoma un ritual que te ordene (luna, domingo, diario).', pregunta: '¿Qué valor no negocio, pase lo que pase?', inv: 'Cuestiona la norma: ¿es tuya o heredada? Busca tu propia espiritualidad.' },
  { n: 6, nombre: 'Los Enamorados', icon: '💞', clave: 'Elección, vínculo, valores', luz: 'Decisión de corazón: elige lo que amas y comprométete. Unión fecunda.', sombra: 'Duda crónica, triangulación, elegir con culpa o por presión.', amor: 'Gran carta de amor: encuentro significativo o profundizar el vínculo con elección consciente.', trabajo: 'Sociedad o decisión vocacional. Elige por sentido, no solo por plata.', consejo: 'Elige hoy una cosa y suelta la otra sin mirar atrás.', pregunta: 'Si me amara de verdad, ¿qué elegiría?', inv: 'Desalineación de valores. Conversa lo difícil antes de decidir.' },
  { n: 7, nombre: 'El Carro', icon: '🏇', clave: 'Avance, voluntad, victoria', luz: 'Toma las riendas: dirección + disciplina = victoria. Viaje o mudanza favorable.', sombra: 'Aceleración sin rumbo, ganar a cualquier costo, agotamiento.', amor: 'Conquista con constancia. Si hay distancia, el movimiento acerca.', trabajo: 'Avanza con foco: una meta, un plan, un ritmo. Triunfo por perseverancia.', consejo: 'Define tu norte en una frase y avanza 1 km hoy.', pregunta: '¿Hacia dónde tiro realmente mis caballos?', inv: 'Frena y reorienta: fuerza sin dirección es desgaste. Revisa el rumbo.' },
  { n: 8, nombre: 'La Fuerza', icon: '🦁', clave: 'Coraje suave, paciencia', luz: 'Domina al león con ternura, no con látigo: constancia amable sobre impulsos y miedos.', sombra: 'Represión o explosión. Forzar cuando hay que esperar.', amor: 'Paciencia con el proceso del otro. La ternura desarma más que la exigencia.', trabajo: 'Resiste el tramo difícil: tu constancia silenciosa gana.', consejo: 'Respira 4-6 y responde (no reacciones) en el próximo roce.', pregunta: '¿Qué fiera interna necesita cariño en vez de jaula?', inv: 'Recarga: estás peleando cansada/o. Descansa antes de seguir domando.' },
  { n: 9, nombre: 'El Ermitaño', icon: '🏮', clave: 'Retiro, búsqueda, guía interior', luz: 'Tiempo de cueva fértil: silencio, estudio, ordenar. La lámpara alumbra a otros después.', sombra: 'Aislamiento, soledad crónica, rumiar sin pedir ayuda.', amor: 'Pausa para saber qué quieres. Mejor solo/a un tiempo que mal acompañado/a.', trabajo: 'Investiga, audita, profundiza. Menos reuniones, más fondo.', consejo: 'Regálate una hora sin pantallas para escucharte.', pregunta: '¿Qué necesito en soledad para volver más claro/a?', inv: 'Sal de la cueva: comparte lo hallado. Si el encierro duele, pide compañía.' },
  { n: 10, nombre: 'La Rueda de la Fortuna', icon: '🎡', clave: 'Cambio, ciclos, suerte', luz: 'Giro del destino: lo estancado se mueve. Aprovecha la ola cuando sube.', sombra: 'Altibajos, azar, creer que no controlas nada (o que controlas todo).', amor: 'Cambio de etapa: reencuentro, giro inesperado. Fluye con el ciclo.', trabajo: 'Oportunidad que gira: postula, muévete, acepta el cambio de turno/rol.', consejo: 'Haz hoy lo que harías "cuando cambie la suerte".', pregunta: '¿En qué parte del ciclo estoy: sembrar, esperar o cosechar?', inv: 'Resiste menos el cambio: lo que se traba pide soltar el eje viejo.' },
  { n: 11, nombre: 'La Justicia', icon: '⚖️', clave: 'Verdad, equilibrio,后果', luz: 'Actúa con rectitud: contratos, papeles y acuerdos claros. Recibes lo sembrado.', sombra: 'Injusticia, letra chica, autoengaño. Culpar afuera.', amor: 'Pide equidad: dar y recibir parejo. Conversaciones honestas.', trabajo: 'Temas legales, firmas y evaluaciones: lee todo dos veces.', consejo: 'Pon por escrito el acuerdo (aunque sea con lápiz).', pregunta: '¿Estoy siendo justa/o —conmigo también?', inv: 'Revisa tu parte antes de reclamar. Corrige un desequilibrio pendiente.' },
  { n: 12, nombre: 'El Colgado', icon: '🙃', clave: 'Pausa, entrega, otra mirada', luz: 'Detente y mira al revés: la respuesta llega cuando sueltas el forcejeo. Sacrificio fértil.', sombra: 'Victimismo, espera infinita, sacrificio que nadie pidió.', amor: 'Pausa amorosa: no presiones. Mira la relación desde sus zapatos.', trabajo: 'Proyecto en espera: úsala para rediseñar, no para angustiarte.', consejo: 'Suelta una cuerda hoy: deja de empujar lo que no se mueve.', pregunta: '¿Qué pasaría si dejara de pelear con esto?', inv: 'La pausa terminó: elige y actúa. El sacrificio ya dio su fruto.' },
  { n: 13, nombre: 'La Muerte', icon: '🦋', clave: 'Fin, transformación', luz: 'Cierre necesario: termina para renacer. Suelta piel vieja (hábito, vínculo, rol).', sombra: 'Resistencia al cambio, aferrarse a lo muerto, duelo negado.', amor: 'Fin o metamorfosis: o se cierra con dignidad o renace distinto. Nada sigue igual.', trabajo: 'Cierra ciclo: renuncia, cambio de área, fin de proyecto. Lo nuevo ya golpea.', consejo: 'Entierra algo simbólicamente: carta, objeto, hábito.', pregunta: '¿Qué debe morir para que yo viva?', inv: 'Duelo lento: date tiempo. Lo que se resiste a morir pide ritual de despedida.' },
  { n: 14, nombre: 'La Templanza', icon: '🏺', clave: 'Alquimia, medida, sanación', luz: 'Mezcla con medida: paciencia, autocuidado, paso a paso. Sanación en curso.', sombra: 'Excesos, impaciencia, mezclar lo que no combina.', amor: 'Amor sereno que se construye de a poco. Reconciliación posible con calma.', trabajo: 'Dosis justa: ni quemarte ni abandonar. Equilibra cargas.', consejo: 'Baja un cambio: menos pero mejor, todos los días.', pregunta: '¿Cuál es mi medida justa en esto?', inv: 'Recalibra: algo está desbordado (trabajo, copa, pantalla). Vuelve al centro.' },
  { n: 15, nombre: 'El Diablo', icon: '⛓️', clave: 'Apego, sombra, deseo', luz: 'Mira tu sombra de frente: deseo, dinero, poder. Nombrarla le quita fuerza.', sombra: 'Adicción, dependencia tóxica, materialismo que encadena. Relación o hábito que te usa.', amor: 'Pasión intensa pero con apego: revisa celos, control o dependencia.', trabajo: 'Ojo con deudas, contratos leoninos o trabajos que te compran el alma.', consejo: 'Nombra tu cadena en voz alta y pide ayuda si no puedes solo/a (*4141 / red).', pregunta: '¿A qué soy esclavo/a sin querer admitirlo?', inv: 'Liberación cercana: las cadenas estaban flojas. Da el paso de soltar.' },
  { n: 16, nombre: 'La Torre', icon: '🗼', clave: 'Ruptura, verdad, liberación', luz: 'Cae lo falso para mostrar lo real: crisis que libera. Duele pero aclara.', sombra: 'Catastrofismo, resistir lo inevitable, romper por romper.', amor: 'Verdad que remueve: crisis o revelación. Mejor verdad que derrumbe que mentira que sostiene.', trabajo: 'Cambio brusco: despido, quiebre, giro. Reconstruye sobre base honesta.', consejo: 'Salva lo esencial y deja caer el resto. Pide apoyo, no pases esto solo/a.', pregunta: '¿Qué torre estoy sosteniendo que ya se cae sola?', inv: 'Réplica suave: procesa el susto y reconstruye despacio, ladrillo a ladrillo.' },
  { n: 17, nombre: 'La Estrella', icon: '⭐', clave: 'Esperanza, guía, sanación', luz: 'Después de la tormenta: esperanza real, guía y sanación. Muéstrate tal cual eres.', sombra: 'Desánimo, fe ingenua, brillar para otros y apagarse dentro.', amor: 'Amor que sana: ternura honesta. Buen momento para mostrar vulnerabilidad.', trabajo: 'Vocación y visibilidad: comparte tu don, la red responde.', consejo: 'Haz un gesto de fe hoy: riega, escribe, llama.', pregunta: '¿Qué estrella me guía cuando todo oscurece?', inv: 'Recupera la fe de a poco: un ritual pequeño cada noche.' },
  { n: 18, nombre: 'La Luna', icon: '🌕', clave: 'Sueño, niebla, inconsciente', luz: 'Escucha sueños y señales: lo oculto se revela. Creatividad fértil en la niebla.', sombra: 'Confusión, engaño, ansiedad nocturna. No todo lo que brilla es verdad.', amor: 'Niebla amorosa: idealización o celos. No decidas en la noche; espera la mañana.', trabajo: 'Información incompleta: verifica, no firmes a ciegas.', consejo: 'Anota tus sueños 3 noches: ahí está el mapa.', pregunta: '¿Qué me asusta mirar de frente?', inv: 'La niebla se disipa: la verdad sale a la luz. Respira, ya aclara.' },
  { n: 19, nombre: 'El Sol', icon: '☀️', clave: 'Alegría, éxito, claridad', luz: 'La mejor carta: vitalidad, éxito, amor luminoso. Todo se ve y se celebra.', sombra: 'Optimismo ingenuo, ego que enceguece, quemarse por exceso de sol.', amor: 'Amor feliz y visible: compromiso, hijo, fiesta. Disfruta sin culpa.', trabajo: 'Éxito y reconocimiento: muestra tu trabajo, pide lo que mereces.', consejo: 'Celebra en voz alta algo bueno de hoy.', pregunta: '¿Qué me hace brillar sin esfuerzo?', inv: 'Nublado pasajero: la alegría vuelve. Busca sol real: gente, aire, juego.' },
  { n: 20, nombre: 'El Juicio', icon: '📯', clave: 'Llamado, perdón, despertar', luz: 'Llamado a despertar: perdona, responde a tu vocación, levántate renovado/a.', sombra: 'Culpa eterna, juicio ajeno, sordera al propio llamado.', amor: 'Reconciliación o llamado honesto: perdonar y elegir de nuevo.', trabajo: 'Segunda oportunidad, evaluación que reconoce tu camino. Responde al llamado mayor.', consejo: 'Perdona (o pídete perdón) por escrito hoy.', pregunta: '¿A qué vida me están llamando?', inv: 'Deja de juzgarte: el pasado ya enseñó. Levántate cuando estés lista/o.' },
  { n: 21, nombre: 'El Mundo', icon: '🌍', clave: 'Plenitud, cierre, logro', luz: 'Ciclo completo: logro, viaje, celebración. Integraste la lección: agradece y comparte.', sombra: 'Cierre postergado, éxito vacío, quedarse a un paso de la meta.', amor: 'Amor pleno o etapa cumplida con gratitud. Lo completo también puede partir.', trabajo: 'Meta cumplida: titulación, proyecto cerrado, reconocimiento. Celebra y abre ciclo.', consejo: 'Cierra con ritual: agradece, ordena, celebra.', pregunta: '¿Qué ciclo puedo cerrar en belleza esta luna?', inv: 'Último tramo: un detalle traba el cierre. Remátalo y libérate.' }
];

/* Arcanos menores: 4 palos + 10 números + 4 figuras */
var PALOS = [
  { id: 'bastos', nombre: 'Bastos', icon: '🔥', elemento: 'Fuego', ambito: 'acción, deseo, trabajo, proyectos', clave: 'Impulso creador: partir, arriesgar, liderar.' },
  { id: 'copas', nombre: 'Copas', icon: '💧', elemento: 'Agua', ambito: 'emociones, amor, vínculos, sueños', clave: 'Mundo afectivo: sentir, amar, intuir.' },
  { id: 'espadas', nombre: 'Espadas', icon: '🗡️', elemento: 'Aire', ambito: 'mente, palabra, verdad, conflicto', clave: 'Mundo mental: pensar, decidir, cortar.' },
  { id: 'oros', nombre: 'Oros', icon: '🪙', elemento: 'Tierra', ambito: 'cuerpo, dinero, casa, oficio', clave: 'Mundo material: sostener, construir, cosechar.' }
];
var NUMEROS = [
  { n: 'As', idea: 'Semilla y oportunidad pura del palo. Un regalo que pide ser tomado.' },
  { n: 'Dos', idea: 'Elección y equilibrio: dos fuerzas que se miran. Decidir o aliarse.' },
  { n: 'Tres', idea: 'Expansión y colaboración: lo inicial crece con otros. Celebración.' },
  { n: 'Cuatro', idea: 'Estabilidad y pausa: ordenar, descansar, consolidar base.' },
  { n: 'Cinco', idea: 'Crisis y fricción: pérdida o conflicto que enseña. Pedir ayuda vale.' },
  { n: 'Seis', idea: 'Armonía recuperada: dar/recibir, reconciliar, avanzar suave.' },
  { n: 'Siete', idea: 'Desafío y evaluación: defender lo propio, revisar estrategia.' },
  { n: 'Ocho', idea: 'Movimiento rápido: noticias, viajes, maestría por repetición.' },
  { n: 'Nueve', idea: 'Casi-cima: resistencia, cosecha cercana, cuidado con la ansiedad.' },
  { n: 'Diez', idea: 'Culminación y exceso: ciclo completo que pide soltar y cerrar.' }
];
var FIGURAS = [
  { n: 'Paje', idea: 'Aprendiz curioso: noticias, estudio, mensaje nuevo. Explora sin miedo.' },
  { n: 'Caballero', idea: 'Acción lanzada: avanzar, viajar, perseguir. Energía joven, a veces impulsiva.' },
  { n: 'Reina', idea: 'Maestría receptiva: nutre y sostiene su palo con sabiduría emocional.' },
  { n: 'Rey', idea: 'Maestría activa: lidera y ordena su palo con visión y responsabilidad.' }
];
function paloDe(id) { for (var i = 0; i < PALOS.length; i++) if (PALOS[i].id === id) return PALOS[i]; return PALOS[0]; }
function cartaMenorTexto(paloId, rango) {
  var p = paloDe(paloId);
  var base;
  var idx = -1;
  for (var i = 0; i < NUMEROS.length; i++) if (NUMEROS[i].n === rango) idx = i;
  if (idx >= 0) base = NUMEROS[idx].idea;
  else { for (var j = 0; j < FIGURAS.length; j++) if (FIGURAS[j].n === rango) base = FIGURAS[j].idea; }
  return { palo: p, texto: rango + ' de ' + p.nombre + ' (' + p.elemento + ' · ' + p.ambito + '): ' + base };
}
function mazoCompleto78() {
  var m = [];
  MAYORES.forEach(function (c) { m.push({ tipo: 'mayor', n: c.n, nombre: c.nombre, icon: c.icon, ref: c }); });
  PALOS.forEach(function (p) {
    NUMEROS.forEach(function (r) { m.push({ tipo: 'menor', palo: p.id, rango: r.n, nombre: r.n + ' de ' + p.nombre, icon: p.icon }); });
    FIGURAS.forEach(function (r) { m.push({ tipo: 'menor', palo: p.id, rango: r.n, nombre: r.n + ' de ' + p.nombre, icon: p.icon }); });
  });
  return m;
}
function detalleCarta(c) {
  if (c.tipo === 'mayor') {
    var m = c.ref;
    return { titulo: m.icon + ' ' + m.n + ' · ' + m.nombre, clave: m.clave, luz: m.luz, sombra: m.sombra, amor: m.amor, trabajo: m.trabajo, consejo: m.consejo, pregunta: m.pregunta, inv: m.inv };
  }
  var t = cartaMenorTexto(c.palo, c.rango);
  return { titulo: c.icon + ' ' + c.nombre, clave: t.palo.clave, luz: t.texto, sombra: 'En exceso: el don del palo se desborda (' + t.palo.ambito + '). En carencia: falta cultivar ese fuego/agua/aire/tierra.', amor: paloAmor(c.palo), trabajo: paloTrabajo(c.palo), consejo: 'Pregúntate: ¿qué pide este ' + t.palo.elemento.toLowerCase() + ' en mi vida hoy?', pregunta: '¿Dónde estoy en el ciclo del ' + c.rango.toLowerCase() + ' de ' + t.palo.nombre.toLowerCase() + '?', inv: 'Energía del palo bloqueada o exagerada: vuelve a la medida justa.' };
}
function paloAmor(pid) {
  return pid === 'copas' ? 'Corazón en primer plano: expresa lo que sientes, escucha lo que siente el otro.' :
    pid === 'bastos' ? 'Deseo y chispa: propone, juega, enciende. Cuidado con quemar etapas.' :
    pid === 'espadas' ? 'Palabra clara: conversa lo difícil con verdad y respeto, sin herir.' :
    'Cuidado concreto: presencia, casa, cuerpo y acuerdos que sostienen el amor.';
}
function paloTrabajo(pid) {
  return pid === 'bastos' ? 'Proyectos y liderazgo: lanza, emprende, muestra iniciativa.' :
    pid === 'copas' ? 'Vocación y equipo: trabaja con sentido y buen trato.' :
    pid === 'espadas' ? 'Estrategia y comunicación: planifica, escribe, negocia con datos.' :
    'Oficio y finanzas: ordena plata, perfecciona tu arte, cosecha con paciencia.';
}

/* ---------- estado de tirada ---------- */
var TIRADA = { tipo: 'dia', pregunta: '', cartas: [], invertidas: true, reveladas: 0 };
var POS3 = ['Pasado · raíz', 'Presente · nudo', 'Futuro · fruto'];
var POS5 = ['Situación', 'Obstáculo / ayuda cruzada', 'Raíz inconsciente', 'Guía · qué hacer', 'Resultado probable'];
var POS_CUERPO = ['Cuerpo · qué sostener', 'Mente · qué aclarar', 'Espíritu · qué honrar'];

/* ---------- dialogo ---------- */
function cartaHTML(c, inv, pos) {
  var d = detalleCarta(c);
  return '<div class="menstrual-card" style="border-color:var(--gold)">' +
    (pos ? '<p class="muted" style="font-size:11px;margin:0 0 4px">📍 ' + esc(pos) + '</p>' : '') +
    '<h4>' + esc(d.titulo) + (inv ? ' <span class="chip" style="font-size:10px">↺ invertida</span>' : '') + '</h4>' +
    '<p style="font-size:12px"><b>Clave:</b> ' + esc(inv ? d.inv : d.clave) + '</p>' +
    '<p style="font-size:12px"><b>☀️ En luz:</b> ' + esc(d.luz) + '</p>' +
    '<p style="font-size:12px"><b>🌑 En sombra:</b> ' + esc(d.sombra) + '</p>' +
    '<p class="muted" style="font-size:11px"><b>💞 Amor:</b> ' + esc(d.amor) + '<br><b>💼 Trabajo:</b> ' + esc(d.trabajo) + '<br><b>🧭 Consejo:</b> ' + esc(d.consejo) + '<br><b>❓ Pregunta:</b> <i>' + esc(d.pregunta) + '</i></p>' +
    '</div>';
}

function buildDialog() {
  var mayoresHTML = MAYORES.map(function (m) {
    return '<div class="si-card tar-may" data-q="' + esc((m.n + ' ' + m.nombre + ' ' + m.clave).toLowerCase()) + '" data-n="' + m.n + '" style="cursor:pointer">' +
      '<h4>' + m.icon + ' ' + m.n + ' · ' + esc(m.nombre) + '</h4><p class="muted" style="font-size:11px">' + esc(m.clave) + '</p></div>';
  }).join('');

  var palosHTML = PALOS.map(function (p) {
    var nums = NUMEROS.map(function (r) { return '<span class="chip tar-menor" data-palo="' + p.id + '" data-rango="' + r.n + '" style="cursor:pointer;margin:2px">' + p.icon + ' ' + r.n + '</span>'; }).join('');
    var figs = FIGURAS.map(function (r) { return '<span class="chip tar-menor" data-palo="' + p.id + '" data-rango="' + r.n + '" style="cursor:pointer;margin:2px;border-color:var(--gold)">' + p.icon + ' ' + r.n + '</span>'; }).join('');
    return '<div class="menstrual-card" style="margin-bottom:10px"><h4>' + p.icon + ' ' + p.nombre + ' · ' + p.elemento + '</h4>' +
      '<p class="muted" style="font-size:11px">' + esc(p.clave) + ' Ámbito: ' + esc(p.ambito) + '.</p>' +
      '<div>' + nums + '</div><div style="margin-top:6px">' + figs + '</div></div>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin:12px 0 10px;flex-wrap:wrap">' +
    '<button type="button" id="tabTarGuia" class="btn btn-accent" style="width:auto">🧭 Guía</button>' +
    '<button type="button" id="tabTarMayores" class="btn" style="width:auto">🌟 Mayores (22)</button>' +
    '<button type="button" id="tabTarMenores" class="btn" style="width:auto">🃏 Menores (56)</button>' +
    '<button type="button" id="tabTarTiradas" class="btn" style="width:auto">🔮 Tiradas</button>' +
    '<button type="button" id="tabTarDiario" class="btn" style="width:auto">📓 Diario</button></div>' +

    '<div id="tarHoyBox" class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px"></div>' +

    /* GUIA */
    '<div id="tarGuia">' +
    '<div class="si-card"><h4>🔮 ¿Qué es el tarot?</h4><p>Un mazo de <b>78 cartas</b> que funciona como <b>espejo</b>: no adivina un destino fijo, te muestra el presente con más claridad para que elijas mejor. <b>22 Arcanos Mayores</b> = grandes temas de la vida (del Loco al Mundo). <b>56 Menores</b> = lo cotidiano en 4 palos: 🔥 Bastos (acción), 💧 Copas (emociones), 🗡️ Espadas (mente), 🪙 Oros (materia).</p></div>' +
    '<div class="discipline-grid">' +
    '<div class="discipline-card"><h4>❓ Cómo preguntar bien</h4><p>• Mejor <b>"¿qué necesito ver sobre X?"</b> que "¿voy a...?".<br>• Una pregunta por tirada, concreta y con plazo ("esta luna").<br>• Evita preguntar lo mismo 5 veces: la primera respuesta es la honesta.<br>• Escribe tu pregunta antes de tirar: ordena la mente.</p></div>' +
    '<div class="discipline-card"><h4>↺ ¿Cartas invertidas?</h4><p>Si sale invertida no es "mala suerte": es la misma energía <b>bloqueada, en exceso o en proceso</b>. Puedes desactivarlas abajo si recién partes —el mazo igual habla.</p></div>' +
    '</div>' +
    '<div class="discipline-grid">' +
    '<div class="discipline-card"><h4>🌙 Ritual mínimo (2 min)</h4><p>1) Respira 3 veces. 2) Nombra tu pregunta en voz alta. 3) Baraja pensando en ella. 4) Tira y lee sin apuro. 5) Anota 1 frase que te llevas.</p></div>' +
    '<div class="discipline-card"><h4>⚠️ Ética de esta sección</h4><p>Orientación y autoconocimiento, <b>no predicción fatalista</b>. Nada aquí reemplaza salud, terapia ni decisiones legales/financieras. Si una lectura te angustia, conversa con alguien de confianza o pide apoyo (*4141 / CESFAM).</p></div>' +
    '</div>' +
    '<div class="si-card"><h4>🗺️ Cómo usar esta sección</h4><p>1) Lee la Guía una vez. 2) Estudia 1 <b>Arcano Mayor</b> por día (22 días = vuelta completa). 3) Haz tu <b>Tirada</b> con pregunta escrita. 4) Guarda en el <b>Diario</b> y relee cada luna: el tarot se aprende en el tiempo, no en una tarde.</p></div>' +
    '</div>' +

    /* MAYORES */
    '<div id="tarMayores" class="hidden">' +
    '<input type="search" id="tarQ" placeholder="🔍 Buscar arcano... ej: amor, cambio, 13" style="display:block;width:100%;margin:0 0 10px;background:var(--card);border:1px solid var(--line);color:var(--text);border-radius:8px;padding:8px">' +
    '<div class="discipline-grid" id="tarMayGrid">' + mayoresHTML + '</div>' +
    '<div id="tarMayDetalle" style="margin-top:10px"></div></div>' +

    /* MENORES */
    '<div id="tarMenores" class="hidden">' +
    '<div class="si-card"><h4>🃏 Los 56 menores: sistema simple</h4><p><b>Palo</b> = área de vida · <b>Número (As–10)</b> = momento del ciclo · <b>Figura</b> = persona o modo de actuar. Toca cualquier carta para ver su lectura. Las 56 salen también en las tiradas.</p></div>' +
    palosHTML +
    '<div id="tarMenorDetalle" style="margin-top:10px"></div></div>' +

    /* TIRADAS */
    '<div id="tarTiradas" class="hidden">' +
    '<div class="menstrual-card" style="margin-bottom:10px"><h4>🔮 Nueva tirada</h4>' +
    '<label>Tu pregunta <input type="text" id="tarPregunta" placeholder="ej: ¿qué necesito ver sobre mi trabajo esta luna?" maxlength="140"></label>' +
    '<div class="conv-row" style="margin-top:8px"><label>Tipo de tirada <select id="tarTipo"><option value="dia">🌅 Carta del día (1)</option><option value="p3">🔀 Pasado · Presente · Futuro (3)</option><option value="cruz">✚ Cruz de consejo (5)</option><option value="sino">⚖️ Sí / No (1 + veredicto)</option></select></label>' +
    '<label class="check-row" style="align-self:end"><input type="checkbox" id="tarInv" checked> ↺ con invertidas</label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="tarTirar" class="btn btn-accent" style="width:auto">🔀 Barajar y tirar</button></div></div>' +
    '<div id="tarTiradaBox"></div>' +
    '<div class="menstrual-card hidden" id="tarGuardarBox" style="margin-top:10px"><h4>💾 Guardar esta lectura</h4>' +
    '<label>Mi frase clave / nota <input type="text" id="tarNota" placeholder="ej: soltar el control y avanzar un paso hoy" maxlength="160"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="tarGuardar" class="btn btn-accent" style="width:auto">💾 Guardar en diario</button></div></div>' +
    '</div>' +

    /* DIARIO */
    '<div id="tarDiario" class="hidden">' +
    '<div class="menstrual-card" style="margin-bottom:10px"><h4>📓 Diario de tarot</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="tarDiaFecha"></label></div>' +
    '<label>Reflexión del día <input type="text" id="tarDiaTxt" placeholder="ej: La Torre me recordó soltar el proyecto que ya cayó" maxlength="200"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="tarDiaAdd" class="btn btn-accent" style="width:auto">+ Guardar reflexión</button></div></div>' +
    '<div id="tarHistBox"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap">' +
    '<span id="tarStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="tarShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="tarClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar todo</button></span></div>' +
    '</div>';

  makeDialog('tarotDialog', '🔮 Tarot — espejo de 78 cartas',
    'Guía completa, 22 mayores, 56 menores, tiradas y diario. Todo queda <b>privado y local</b> en este dispositivo.',
    body);
}

/* ---------- renders ---------- */
function renderHoy() {
  var box = $('tarHoyBox'); if (!box) return;
  var k = todayKey();
  var m = mazoCompleto78();
  var idx = hashStr('tarot-' + k) % m.length;
  var c = m[idx];
  var d = detalleCarta(c);
  box.innerHTML = '<h4>🌅 Carta de hoy · ' + esc(k) + '</h4>' +
    '<p style="font-size:13px"><b>' + esc(d.titulo) + '</b> — ' + esc(d.clave) + '</p>' +
    '<p class="muted" style="font-size:11px">' + esc(d.consejo) + ' <i>' + esc(d.pregunta) + '</i></p>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="tarHoyVer" class="btn" style="width:auto">Ver ficha completa</button></div>';
  var v = $('tarHoyVer');
  if (v) v.onclick = function () {
    if (c.tipo === 'mayor') { switchTab('Mayores'); renderDetalleMayor(c.ref.n); }
    else { switchTab('Menores'); renderDetalleMenor(c.palo, c.rango); }
  };
}
function renderDetalleMayor(n) {
  var box = $('tarMayDetalle'); if (!box) return;
  var m = null;
  MAYORES.forEach(function (x) { if (x.n === n) m = x; });
  if (!m) return;
  var e = store();
  var fav = e.favs.indexOf('M' + n) >= 0;
  box.innerHTML = cartaHTML({ tipo: 'mayor', ref: m }, false, null) +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="tarFavM" class="btn" style="width:auto">' + (fav ? '⭐ En favoritos ✓' : '☆ Marcar favorita') + '</button>' +
    '<button type="button" id="tarLlevarM" class="btn" style="width:auto">📝 Llevar a nota de hoy</button></div>';
  $('tarFavM').onclick = function () {
    var s = store(); var k = 'M' + n; var i = s.favs.indexOf(k);
    if (i >= 0) s.favs.splice(i, 1); else s.favs.push(k);
    save(); renderDetalleMayor(n); renderStats();
  };
  $('tarLlevarM').onclick = function () { llevarANota('🔮 ' + m.n + ' · ' + m.nombre + ': ' + m.consejo); };
  try { box.scrollIntoView({ block: 'nearest' }); } catch (e) {}
}
function renderDetalleMenor(paloId, rango) {
  var box = $('tarMenorDetalle'); if (!box) return;
  var c = { tipo: 'menor', palo: paloId, rango: rango, nombre: rango + ' de ' + paloDe(paloId).nombre, icon: paloDe(paloId).icon };
  box.innerHTML = cartaHTML(c, false, null) +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="tarLlevarMen" class="btn" style="width:auto">📝 Llevar a nota de hoy</button></div>';
  $('tarLlevarMen').onclick = function () { var t = cartaMenorTexto(paloId, rango); llevarANota('🃏 ' + t.texto); };
  try { box.scrollIntoView({ block: 'nearest' }); } catch (e) {}
}
function filterMayores() {
  var q = (($('tarQ') || {}).value || '').toLowerCase();
  document.querySelectorAll('#tarMayGrid .tar-may').forEach(function (el) {
    el.style.display = (!q || (el.dataset.q || '').indexOf(q) >= 0) ? '' : 'none';
  });
}
function tirar() {
  var tipo = ($('tarTipo') || {}).value || 'dia';
  var pregunta = clean((($('tarPregunta') || {}).value || '').trim(), 140);
  var conInv = !$('tarInv') || $('tarInv').checked;
  var m = shuffled(mazoCompleto78());
  var n = tipo === 'dia' ? 1 : tipo === 'p3' ? 3 : tipo === 'cruz' ? 5 : 1;
  var pos = tipo === 'p3' ? POS3 : tipo === 'cruz' ? POS5 : tipo === 'sino' ? ['Veredicto'] : ['Carta del día'];
  var cartas = [];
  for (var i = 0; i < n; i++) {
    var c = m[i];
    var inv = conInv && Math.random() < 0.22;
    cartas.push({ c: c, inv: inv });
  }
  TIRADA = { tipo: tipo, pregunta: pregunta, cartas: cartas, invertidas: conInv, reveladas: n };
  renderTirada(pos);
}
function renderTirada(pos) {
  var box = $('tarTiradaBox'); if (!box) return;
  var gb = $('tarGuardarBox');
  if (!TIRADA.cartas.length) { box.innerHTML = '<p class="muted">Aún sin tirada: escribe tu pregunta y pulsa <b>Barajar y tirar</b>.</p>'; if (gb) gb.classList.add('hidden'); return; }
  var html = (TIRADA.pregunta ? '<div class="si-card"><h4>❓ Tu pregunta</h4><p>' + esc(TIRADA.pregunta) + '</p></div>' : '');
  TIRADA.cartas.forEach(function (x, i) {
    html += cartaHTML(x.c, x.inv, (pos && pos[i]) || ('Carta ' + (i + 1)));
  });
  if (TIRADA.tipo === 'sino') html += veredictoSino();
  box.innerHTML = html;
  if (gb) gb.classList.remove('hidden');
  try { box.scrollIntoView({ block: 'nearest' }); } catch (e) {}
}
function veredictoSino() {
  var x = TIRADA.cartas[0];
  var d = detalleCarta(x.c);
  var sombra = x.inv || /sombra|crisis|pausa|espera|no |bloque|revisa|cuidado/i.test(d.luz + ' ' + d.clave);
  var txt = sombra
    ? '⚖️ <b>Tendencia: NO / aún no.</b> La carta pide pausa, ajuste o esperar una luna antes de decidir.'
    : '⚖️ <b>Tendencia: SÍ.</b> La carta acompaña avanzar con conciencia y un paso concreto hoy.';
  return '<div class="menstrual-card" style="border-color:var(--gold)"><h4>⚖️ Veredicto oracular</h4><p style="font-size:12px">' + txt + '</p><p class="muted" style="font-size:11px">El sí/no es una brújula, no una sentencia: úsalo para aclarar tu deseo real más que para obedecer.</p></div>';
}
function guardarLectura() {
  var nota = clean((($('tarNota') || {}).value || '').trim(), 160);
  if (!TIRADA.cartas.length) return alert('Primero haz una tirada');
  var s = store();
  s.lecturas.push({
    id: uid('lec'), fecha: todayKey(), tipo: TIRADA.tipo,
    pregunta: TIRADA.pregunta || '(sin pregunta escrita)',
    cartas: TIRADA.cartas.map(function (x) { return { nombre: x.c.nombre, tipo: x.c.tipo, palo: x.c.palo || null, rango: x.c.rango || null, n: (x.c.ref ? x.c.ref.n : null), inv: !!x.inv }; }),
    nota: nota
  });
  if (s.lecturas.length > 200) s.lecturas = s.lecturas.slice(-200);
  save('Lectura guardada ✓'); $('tarNota').value = '';
  renderHist(); renderStats();
  alert('Lectura guardada en tu diario ✓');
}
function renderHist() {
  var box = $('tarHistBox'); if (!box) return;
  var s = store();
  var fecha = ($('tarDiaFecha') || {}).value || '';
  var lista = s.lecturas.slice().reverse();
  var html = '';
  var notas = Object.keys(s.diario || {}).sort().reverse();
  if (fecha && s.diario[fecha]) html += '<div class="si-card"><h4>📅 ' + esc(fecha) + '</h4><p>' + esc(s.diario[fecha]) + '</p></div>';
  else if (!lista.length && !notas.length) html += '<p class="muted">Sin registros aún. Tus tiradas guardadas y reflexiones aparecerán aquí, privadas en este dispositivo.</p>';
  lista.slice(0, 30).forEach(function (l) {
    var cartas = l.cartas.map(function (c) { return esc(c.nombre) + (c.inv ? ' ↺' : ''); }).join(' · ');
    html += '<div class="si-card"><h4>🔮 ' + esc(l.fecha) + ' · ' + esc(nombreTirada(l.tipo)) + '</h4>' +
      '<p class="muted" style="font-size:11px">❓ ' + esc(l.pregunta) + '</p>' +
      '<p style="font-size:12px"><b>' + cartas + '</b></p>' +
      (l.nota ? '<p style="font-size:12px">📝 ' + esc(l.nota) + '</p>' : '') +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" class="btn tar-del" data-id="' + l.id + '" style="width:auto;font-size:11px">🗑 Borrar</button></div></div>';
  });
  if (notas.length) {
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>💭 Reflexiones (' + notas.length + ')</h4>' +
      notas.slice(0, 20).map(function (k) { return '<p style="font-size:12px"><b>' + esc(k) + ':</b> ' + esc(s.diario[k]) + '</p>'; }).join('') + '</div>';
  }
  box.innerHTML = html;
  box.querySelectorAll('.tar-del').forEach(function (b) {
    b.onclick = function () {
      var st = store();
      st.lecturas = st.lecturas.filter(function (l) { return l.id !== b.dataset.id; });
      save(); renderHist(); renderStats();
    };
  });
}
function nombreTirada(t) { return t === 'dia' ? 'Carta del día' : t === 'p3' ? 'Pasado · Presente · Futuro' : t === 'cruz' ? 'Cruz de consejo' : 'Sí / No'; }
function renderStats() {
  var st = $('tarStats'); if (!st) return;
  var s = store();
  st.textContent = s.lecturas.length + ' lectura(s) · ' + Object.keys(s.diario || {}).length + ' reflexión(es)' + (s.favs.length ? ' · ' + s.favs.length + ' favorita(s)' : '');
}
function llevarANota(txt) {
  if (!txt) return alert('Nada que llevar');
  try {
    var info = (typeof todayInfo === 'function') ? todayInfo() : null;
    if (!info) return alert('No se pudo ubicar hoy');
    var note = String(txt).slice(0, 280);
    if (info.luna === 'dft') { var c = cyc(currentCycleYear()); c.dft.nota = (c.dft.nota ? c.dft.nota + '\n' : '') + note; }
    else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + note; }
    save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
    alert('Llevado a la nota de hoy ✓');
  } catch (e2) { alert('No se pudo llevar a la nota'); }
}

/* ---------- setup ---------- */
function setup() {
  try {
    if (!$('btnTarot')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnTarot'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🔮 Tarot';
        try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'tarot cartas arcanos mayores menores tirada lectura cruz consejo pasado presente futuro sino adivinacion espejo rider waite');
        // ubicar junto a Kin Maya / Eneagrama dentro de Interior
        var ref = $('btnKinMaya') || $('btnEneagrama');
        if (ref && ref.parentNode === g) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnTarot');
        var curG = cur.closest ? cur.closest('.action-group') : null;
        var curN = curG && curG.getAttribute ? curG.getAttribute('data-group') : null;
        if (curN && curN !== 'linaje') {
          var gd = document.querySelector('.action-group[data-group="linaje"] .group-btns');
          if (gd) { gd.appendChild(cur); try { cur.setAttribute('data-sub', 'interior'); } catch (eS2) {} }
        }
      } catch (eM) {}
    }
  } catch (e) {}
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnTarot') < 0) ALL_BTNS.push('btnTarot');
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnTarot = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnTarot"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnTarot"> 🔮 Tarot';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnTarot !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnTarot = lab.querySelector('input').checked;
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
  try { addKw('btnPsico', 'tarot cartas tirada arcanos'); } catch (e2) {}

  buildDialog();
  renderHoy();
  renderHist();
  renderStats();

  var b = $('btnTarot');
  if (b) b.onclick = function () { renderHoy(); renderHist(); renderStats(); openDlg('tarotDialog'); };

  ['Guia', 'Mayores', 'Menores', 'Tiradas', 'Diario'].forEach(function (t) {
    var tb = $('tabTar' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });
  var q = $('tarQ'); if (q) q.oninput = filterMayores;
  document.querySelectorAll('#tarMayGrid .tar-may').forEach(function (card) {
    card.onclick = function () { renderDetalleMayor(+card.dataset.n); };
  });
  document.querySelectorAll('.tar-menor').forEach(function (chip) {
    chip.onclick = function () { renderDetalleMenor(chip.dataset.palo, chip.dataset.rango); };
  });
  var tr = $('tarTirar'); if (tr) tr.onclick = tirar;
  var gd2 = $('tarGuardar'); if (gd2) gd2.onclick = guardarLectura;
  var da = $('tarDiaAdd');
  if (da) da.onclick = function () {
    var k = ($('tarDiaFecha') && $('tarDiaFecha').value) || todayKey();
    var txt = clean((($('tarDiaTxt') || {}).value || '').trim(), 200);
    if (!txt) return alert('Escribe tu reflexión primero (2 líneas bastan)');
    var s = store();
    s.diario[k] = txt;
    save('Guardado ✓'); $('tarDiaTxt').value = '';
    renderHist(); renderStats();
  };
  var df = $('tarDiaFecha');
  if (df) df.onchange = renderHist;
  var sh = $('tarShare');
  if (sh) sh.onclick = async function () {
    var s = store();
    var last = (s.lecturas || []).slice(-1)[0];
    var txt = last
      ? ('🔮 Mi lectura (' + last.fecha + ' · ' + nombreTirada(last.tipo) + ')\n❓ ' + last.pregunta + '\n🃏 ' + last.cartas.map(function (c) { return c.nombre + (c.inv ? ' (inv.)' : ''); }).join(' · ') + (last.nota ? '\n📝 ' + last.nota : ''))
      : '🔮 Tarot: aún sin lecturas guardadas';
    await share('Mi Tarot', txt);
  };
  var cl = $('tarClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar todo tu registro de Tarot (lecturas, diario, favoritas)?')) return;
    try { var u = userData(); u.tarot = { lecturas: [], diario: {}, favs: [] }; } catch (e) {}
    save(); renderHist(); renderStats();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 400); });
else setTimeout(setup, 400);

})();
