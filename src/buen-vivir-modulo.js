/* ============================================================
   BUEN VIVIR — Calendario 13 Lunas (Penco · Bio-Bío)
   Apartado: Territorio > Buen Vivir (btnBuenVivir -> buenVivirDialog),
   pestañas: Visión | Pueblos | Práctica.
   Enfoque:
      🌎 Ética de lo suficiente: Küme Mongen, Sumak Kawsay,
         Ñande Reko, Vivir Bien kolla, Shiir Waras, Balu Wala,
         Suma Qamaña, Lekil Kuxlejal, Kawsak Sacha (Abya Yala)
         + Ubuntu, Harambee, Teranga, Ujamaa, Sankofa (África)
         + Sarvodaya, Tri Hita Karana, Satoyama, Gotong Royong,
         Bayanihan (Asia) + Kaitiakitanga, Mālama ʻĀina, Vanua,
         Caring for Country (Oceanía) + Hózhó, Séptima Generación,
         Mitakuye Oyasin, Potlatch (Norteamérica) + Friluftsliv,
         Lagom, Auzolan (Europa): 30 miradas de los pueblos
         originarios del mundo.
      🌱 Práctica pencona: compromisos cotidianos (agua, residuos,
         consumo local, minga, nativo, energía, gratitud) con
         puentes a los módulos del calendario.
   Todo local, sin red obligatoria. Se edita aquí mismo.
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
  try { if (typeof cal !== 'undefined' && cal.fmtKey) return cal.fmtKey.format(new Date()); } catch (e) {}
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function store(key, def) {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return def;
    if (u[key] === undefined) u[key] = def;
    return u[key];
  } catch (e) { return def; }
}
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {} }
function lunaTxt(key) {
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return 'Luna ' + m.luna + ' · día ' + m.dia; }
  } catch (e) {}
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' · día ' + r.diaN; }
  } catch (e) {}
  return '';
}
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text, null);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}

/* ---------- contenido ---------- */
var BV_PRINCIPIOS = [
  '🌎 Ética de lo suficiente, no del acumular',
  '🌿 Parte viva de la comunidad terrenal, no dueña',
  '💧🌬️🔥 Aire, agua, suelo, montaña, árbol, animal: familia',
  '♻️ Frugal, consciente y regenerativo',
  '❤️ Afectivo, espiritual y comunitario',
  '✊ No al individualismo, lucro desmedido y mercantilización de la vida'
];

var BV_PUEBLOS = [
  // ---- Abya Yala (América Latina) ----
  { nombre: 'Küme Mongen', pueblo: 'Pueblo Mapuche', conti: 'Abya Yala', sig: '“buen vivir”', ico: '🌎',
    texto: 'Conexión profunda con la naturaleza, en equilibrio con las fuerzas y seres que la habitan. Armonía entre el agua, el territorio, la vida personal, familiar y comunitaria, la cultura y las energías espirituales. Reconstruir el Küme Mongen es reconstruir una sociedad con dignidad, solidaridad y reciprocidad para todos los pueblos. Es, ante todo, una lucha por amor a la vida.' },
  { nombre: 'Sumak Kawsay', pueblo: 'Pueblo Kichwa · Ecuador', conti: 'Abya Yala', sig: '“vida plena en armonía”', ico: '🌎',
    texto: 'Guía las relaciones dentro del Ayllu (comunidad) y entre la comunidad y la naturaleza. Vivir en equilibrio con los ríos, los bosques, las montañas, los espíritus protectores y los dioses: todo está interconectado y merece respeto.' },
  { nombre: 'Ñande Reko', pueblo: 'Pueblo Guaraní', conti: 'Abya Yala', sig: '“nuestro modo de ser”', ico: '🌎',
    texto: 'Libertad, alegría comunitaria, reciprocidad y convite. Todo orientado a la búsqueda de la Tierra Sin Mal: un mundo justo, en paz y en plenitud.' },
  { nombre: 'Vivir Bien', pueblo: 'Pueblo Kolla · Argentina', conti: 'Abya Yala', sig: 'crecer con la naturaleza', ico: '🌎',
    texto: 'Crecer con la naturaleza, no contra ella. Como dice el sabio Huanacuni: “El ser humano es tierra que anda”. La vida florece solo cuando se respeta ese vínculo sagrado.' },
  { nombre: 'Shiir Waras', pueblo: 'Pueblo Shuar · Ecuador', conti: 'Abya Yala', sig: '“buen vivir”', ico: '🌎',
    texto: 'Paz doméstica y vida armoniosa, en equilibrio con la familia, la comunidad y la naturaleza. Bienestar integral, tejido en el día a día.' },
  { nombre: 'Balu Wala', pueblo: 'Pueblo Guna · Panamá y Colombia', conti: 'Abya Yala', sig: '“árbol de sal”', ico: '🌎',
    texto: 'Eje filosófico de la existencia guna: relación indisoluble entre humanidad, naturaleza y universo, fundada en el respeto, la equidad y la armonía. Guía las relaciones políticas, económicas y sociales, y fortalece la producción comunitaria y la calidad de vida colectiva, desde la memoria y el presente comunitario.' },
  { nombre: 'Suma Qamaña', pueblo: 'Pueblos Aymara y Quechua · Andes', conti: 'Abya Yala', sig: '“vivir bien”', ico: '🌎',
    texto: 'Paradigma andino: relacionalidad, complementariedad, ciclicidad, correspondencia y conciencia natural. La vida es un todo orgánico donde dialogan Jaqi (seres humanos), Wak’a (divinidades) y Sallqa (naturaleza silvestre). Con-vivir en armonía con la Tierra, el mundo espiritual y las futuras generaciones.' },
  { nombre: 'Lekil Kuxlejal', pueblo: 'Pueblos Maya Tseltal y Tsotsil · Chiapas', conti: 'Abya Yala', sig: '“vida buena y justa para todos”', ico: '🌎',
    texto: 'Vida buena que solo es buena si es compartida: tierra comunal, asamblea que decide, fiesta que une y trabajo que dignifica. Sin justicia y sin comunidad no hay bienestar verdadero.' },
  { nombre: 'Kawsak Sacha', pueblo: 'Pueblo Kichwa amazónico · Sarayaku, Ecuador', conti: 'Abya Yala', sig: '“selva viviente”', ico: '🌎',
    texto: 'La selva es un ser vivo y sagrado, con dueños y espíritus que la cuidan. Defender el territorio es defender la vida misma: el petróleo y la mina no entran donde la selva habla y enseña.' },
  // ---- África ----
  { nombre: 'Ubuntu', pueblo: 'Pueblos Zulú y Xhosa · Sudáfrica', conti: 'África', sig: '“soy porque somos”', ico: '🌍',
    texto: '“Una persona es persona a través de otras personas”. La identidad y el bienestar nacen del vínculo: cuidar al otro, compartir lo que hay, perdonar y reparar. Sin comunidad no hay humanidad plena.' },
  { nombre: 'Harambee', pueblo: 'Pueblos de Kenia', conti: 'África', sig: '“tiremos juntos”', ico: '🌍',
    texto: 'Trabajo colectivo y ayuda mutua: toda la aldea levanta la casa, cosecha o enfrenta la dificultad. Nadie se salva solo; la fuerza está en tirar la cuerda al mismo tiempo y repartir el fruto.' },
  { nombre: 'Teranga', pueblo: 'Pueblo Wolof · Senegal', conti: 'África', sig: '“hospitalidad que comparte”', ico: '🌍',
    texto: 'El honor está en recibir bien: al visitante se le da techo, plato y palabra. Compartir comida y tiempo no empobrece, multiplica la alegría y teje paz entre familias y pueblos.' },
  { nombre: 'Ujamaa', pueblo: 'Tanzania · legado de Nyerere', conti: 'África', sig: '“familia extendida”', ico: '🌍',
    texto: 'La aldea como familia grande: tierra en común, decisiones en asamblea y economía al servicio de todos. Nadie avanza pisando al vecino; el desarrollo se mide en dignidad compartida.' },
  { nombre: 'Sankofa', pueblo: 'Pueblo Akan · Ghana', conti: 'África', sig: '“vuelve y recoge lo olvidado”', ico: '🌍',
    texto: 'El pájaro que mira atrás para avanzar: recoger la sabiduría de los ancestros antes de caminar al futuro. Quien olvida su raíz, pierde el camino; quien la honra, florece.' },
  // ---- Asia ----
  { nombre: 'Sarvodaya', pueblo: 'India · legado de Gandhi', conti: 'Asia', sig: '“bienestar de todos”', ico: '🌏',
    texto: 'Que nadie quede atrás: vida simple, trabajo digno, no-violencia (ahimsa) y economía al servicio del último. El progreso verdadero se mide por la felicidad del más humilde.' },
  { nombre: 'Tri Hita Karana', pueblo: 'Bali · Indonesia', conti: 'Asia', sig: '“tres causas de armonía”', ico: '🌏',
    texto: 'Armonía en tres direcciones: con lo sagrado (Parahyangan), entre humanos (Pawongan) y con la naturaleza (Palemahan). Los arrozales subak se riegan por acuerdo comunitario y rito, no por competencia.' },
  { nombre: 'Satoyama', pueblo: 'Japón rural', conti: 'Asia', sig: '“vivir entre monte y aldea”', ico: '🌏',
    texto: 'Paisaje donde bosque, chacra, agua y aldea se cuidan en ciclo: leña medida, compost, bosque comestible y fiesta estacional. El humano es jardinero del equilibrio, no dueño del monte.' },
  { nombre: 'Gotong Royong', pueblo: 'Java · Indonesia', conti: 'Asia', sig: '“cargar juntos la carga”', ico: '🌏',
    texto: 'Ayuda mutua como deber cotidiano: reparar el camino, levantar la casa o preparar la fiesta entre todos. El peso repartido pesa menos y el mérito es del barrio entero.' },
  { nombre: 'Bayanihan', pueblo: 'Filipinas', conti: 'Asia', sig: '“levantar la casa entre todos”', ico: '🌏',
    texto: 'Todo el pueblo carga sobre sus hombros la casa del vecino para moverla a mejor suelo. Espíritu de heroísmo comunitario (bayani): servir sin esperar pago y celebrar después con mesa común.' },
  // ---- Oceanía ----
  { nombre: 'Kaitiakitanga', pueblo: 'Pueblo Maorí · Aotearoa (N. Zelanda)', conti: 'Oceanía', sig: '“guardianía viva”', ico: '🌊',
    texto: 'Ser kaitiaki: guardián del río, del bosque y del mar, por las generaciones que vienen. El río es ancestro (tupuna), no recurso: si el agua enferma, la gente enferma. Cuidar es devolver el mauri (fuerza vital).' },
  { nombre: 'Mālama ʻĀina', pueblo: 'Kānaka Maoli · Hawái', conti: 'Oceanía', sig: '“cuidar la tierra que alimenta”', ico: '🌊',
    texto: 'La tierra (ʻāina) es la que da de comer y por eso es familia. Trabajar el taro, limpiar el estero y repartir la cosecha mantienen el aloha ʻāina: amor que se practica cuidando.' },
  { nombre: 'Vanua', pueblo: 'Fiyi y Melanesia', conti: 'Oceanía', sig: '“tierra, gente y espíritu son uno”', ico: '🌊',
    texto: 'Vanua no es solo suelo: es la trama viva entre tierra, mar, ancestros, comunidad y espíritu. Cuidar el arrecife y el taro es cuidar el nombre y el futuro del pueblo.' },
  { nombre: 'Caring for Country', pueblo: 'Pueblos aborígenes · Australia', conti: 'Oceanía', sig: '“cuidar el Country”', ico: '🌊',
    texto: 'El Country —tierra, agua, cielo, canto y ancestro— necesita su gente y su fuego bueno. Quemas cuidadas, lectura de huellas y ley viva: si el Country está sano, la gente está sana.' },
  // ---- Norteamérica ----
  { nombre: 'Hózhó', pueblo: 'Pueblo Diné (Navajo)', conti: 'Norteamérica', sig: '“belleza, equilibrio”', ico: '🦅',
    texto: 'Caminar en belleza: salud, pensamiento, palabra y acto en equilibrio con la tierra, el cielo y la comunidad. La enfermedad es desarmonía; sanar es restaurar la relación con todo.' },
  { nombre: 'Séptima Generación', pueblo: 'Haudenosaunee · noreste', conti: 'Norteamérica', sig: '“pensar siete generaciones”', ico: '🦅',
    texto: 'Toda decisión debe cuidar a quienes nacerán siete generaciones después. El consejo escucha a los niños, a los ancianos y a la naturaleza antes de actuar: el futuro también vota.' },
  { nombre: 'Mitakuye Oyasin', pueblo: 'Pueblo Lakota · llanuras', conti: 'Norteamérica', sig: '“todos somos parientes”', ico: '🦅',
    texto: 'Oración y ley a la vez: el búfalo, el río, la piedra y el humano son familia. Nada se toma sin rezo ni se deja sin ofrenda; dañar a uno es dañarse a sí mismo.' },
  { nombre: 'Potlatch', pueblo: 'Pueblos de la costa noroeste', conti: 'Norteamérica', sig: '“dar es ser rico”', ico: '🦅',
    texto: 'Fiesta de reparto: quien más da, más honor recibe. Mantas, salmón y cantos circulan para equilibrar la comunidad. La riqueza guardada avergüenza; la riqueza repartida nombra jefes.' },
  // ---- Europa ----
  { nombre: 'Friluftsliv', pueblo: 'Pueblos nórdicos · Noruega', conti: 'Europa', sig: '“vida al aire libre”', ico: '🏔️',
    texto: 'Vivir afuera, simple y cerca: caminar, esquiar, acampar y compartir cabaña sin lujo. El derecho de paso (allemannsretten) dice que la naturaleza es de todos si se pisa con respeto. Lo suficiente abriga igual.' },
  { nombre: 'Lagom', pueblo: 'Suecia', conti: 'Europa', sig: '“ni mucho ni poco, lo justo”', ico: '🏔️',
    texto: 'La medida sueca de lo suficiente: tomar lo que toca y dejar para el otro, en la mesa, en el trabajo y en el bosque. Equilibrio sin alarde que cuida al grupo y al recurso.' },
  { nombre: 'Auzolan', pueblo: 'Euskal Herria · pueblo vasco', conti: 'Europa', sig: '“faena vecinal”', ico: '🏔️',
    texto: 'Trabajo comunal de vecindad: arreglar el camino, la frontonera o el caserío entre todos, a mano vuelta. Lo que es de todos se cuida entre todos, con palabra y kaldero compartido.' }
];

var BV_PRACTICAS = [
  { ico: '💧', t: 'Cuida el agua', d: 'Ducha corta, repara goteos, riega al atardecer. El agua no se gasta: se devuelve limpia.' },
  { ico: '♻️', t: 'Reutiliza y recicla', d: 'Separa vidrio, plástico, papel y aceite. Lleva al punto limpio; lo orgánico al compost.' },
  { ico: '🥬', t: 'Consume local y de estación', d: 'Feria de Penco, trueque con vecinos, huerta propia. Menos envase, más territorio.' },
  { ico: '🤝', t: 'Haz minga', d: 'Una mano lava la otra: ayuda en cosechas, techos o limpieza de quebrada. Anótala y convoca.' },
  { ico: '🌱', t: 'Planta nativo', d: 'Peumo, quillay, boldo, chilco en Pukem con lluvia. En el cerro: foto antes que muestra.' },
  { ico: '🔥', t: 'Energía justa', d: 'Leña seca, olla tapada, luz solo donde estás. Lo suficiente abriga igual.' },
  { ico: '🙏', t: 'Agradece y pide permiso', d: 'Llellipun antes de cortar, gratitud después de recibir. Devuelve algo siempre.' },
  { ico: '🗣️', t: 'Transmite', d: 'Enseña un oficio, graba a tus abuelos, cuenta un epew. La memoria también se siembra.' }
];

var BV_AMBITOS = ['💧 Agua', '♻️ Residuos', '🥬 Consumo', '🤝 Comunidad', '🌱 Territorio', '🔥 Energía', '🙏 Espíritu'];

/* ---------- bitácora privada ---------- */
function getBvData() {
  var a = store('buenVivir', { compromisos: [] });
  if (!a || !Array.isArray(a.compromisos)) {
    try { var u = userData(); u.buenVivir = { compromisos: [] }; return u.buenVivir; } catch (e) { return { compromisos: [] }; }
  }
  return a;
}
function bvStats() {
  var list = [];
  try { list = getBvData().compromisos || []; } catch (e) {}
  var hechas = list.filter(function (x) { return x.hecho; }).length;
  return { total: list.length, hechas: hechas };
}
function buildBvShareText(list) {
  if (!list.length) return '🌎 Mis compromisos del Buen Vivir — aún sin registros';
  var t = '🌎 Mis compromisos del Buen Vivir · ' + list.length + '\n\n';
  list.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); }).forEach(function (c) {
    t += (c.hecho ? '✅ ' : '• ') + c.fecha + ' · ' + (c.ambito || 'vivir bien') + ' · ' + c.texto + '\n';
  });
  return t + '\n— Vivir Bien es Vivir Juntos · Penco';
}

/* ---------- pestañas ---------- */
var bvTab = 'vision';
function switchBvTab(t) {
  bvTab = t;
  var b1 = $('tabBvVision'), b2 = $('tabBvPueblos'), b3 = $('tabBvPract');
  if (b1) b1.classList.toggle('btn-accent', t === 'vision');
  if (b2) b2.classList.toggle('btn-accent', t === 'pueblos');
  if (b3) b3.classList.toggle('btn-accent', t === 'pract');
  var p1 = $('bvVisionPanel'), p2 = $('bvPueblosPanel'), p3 = $('bvPractPanel');
  if (p1) p1.classList.toggle('hidden', t !== 'vision');
  if (p2) p2.classList.toggle('hidden', t !== 'pueblos');
  if (p3) p3.classList.toggle('hidden', t !== 'pract');
  if (t === 'pract') renderBvComp();
}

function renderBvVision() {
  var box = $('bvVisionPanel');
  if (!box) return;
  box.innerHTML =
    '<div class="menstrual-card su-68a1a9"><h4>🙏🌎 El Buen Vivir no es un ideal individual</h4>' +
    '<p class="su-616df7">Es una <b>ética de lo suficiente para toda la comunidad</b>: una visión holística del ser humano, entendido no como dueño del mundo, sino como <b>parte viva de la gran comunidad terrenal</b>.</p></div>' +
    '<div class="menstrual-card"><h4>🌿 Comunión con la Ñuke Mapu</h4>' +
    '<p class="su-616df7">El aire que respiramos 🌬️, el agua que nos da vida 💧, los suelos que nos sostienen, las montañas que nos protegen, los árboles que nos cobijan 🌳, los animales que comparten nuestro camino: estar en profunda comunión con la <b>Ñuke Mapu (Madre Tierra)</b> y con las energías del universo 🌈🌕🔥.</p></div>' +
    '<div class="menstrual-card"><h4>🌱 Contra el consumir, acumular y dominar</h4>' +
    '<p class="su-616df7">La naturaleza y la comunidad ya nos dan todo lo necesario. Vivir en armonía con todo lo que existe, celebrando ritos sagrados que renuevan, una y otra vez, los lazos entre lo <b>individual, lo colectivo y lo cósmico</b>.</p></div>' +
    '<div class="menstrual-card"><h4>♻️ Consumo frugal, consciente y regenerativo</h4>' +
    '<p class="su-616df7">No tomar más de lo que el ecosistema puede regenerar, no generar residuos que no podamos reintegrar, reutilizar, reciclar y honrar cada recurso. <b>Y así, no habrá escasez.</b></p></div>' +
    '<div class="menstrual-card"><h4>❤️ Afectivo, espiritual y comunitario</h4>' +
    '<p class="su-616df7">Bienes materiales en equilibrio con la naturaleza y las personas. Nadie vive aislado: vivimos en familia, en sociedad, en diálogo con el entorno. <b>No se puede Vivir Bien si se daña la Tierra.</b></p></div>' +
    '<div class="menstrual-card"><h4>✊ Una relación distinta</h4>' +
    '<p class="su-616df7">Se opone al individualismo, al lucro desmedido, a la lógica fría del costo-beneficio, a la mercantilización de la vida, a la explotación y a la violencia del consumismo egoísta. Propone otra relación: entre humanos, entre culturas, y entre la humanidad y la naturaleza — con dimensión ética, humana y cósmica, enraizada en la historia, la espiritualidad y el respeto mutuo.</p>' +
    '<div class="su-c158a9">' + BV_PRINCIPIOS.map(function (p) { return '<span class="chip su-4d5ab7">' + esc(p) + '</span>'; }).join('') + '</div></div>';
}

function renderBvPueblos() {
  var box = $('bvPueblosPanel');
  if (!box) return;
  var orden = ['Abya Yala', 'África', 'Asia', 'Oceanía', 'Norteamérica', 'Europa'];
  var icoConti = { 'Abya Yala': '🌎', 'África': '🌍', 'Asia': '🌏', 'Oceanía': '🌊', 'Norteamérica': '🦅', 'Europa': '🏔️' };
  var grupos = {};
  BV_PUEBLOS.forEach(function (p) {
    var c = p.conti || 'Abya Yala';
    if (!grupos[c]) grupos[c] = [];
    grupos[c].push(p);
  });
  var html = '<div class="menstrual-card su-68a1a9"><h4>🌿 ' + BV_PUEBLOS.length + ' miradas, un mismo horizonte</h4>' +
    '<p class="muted su-11a508">Los pueblos originarios de todos los continentes ofrecen caminos reales hacia el bien común. Toca tu compromiso en la pestaña 🌱 Práctica.</p>' +
    '<div class="su-c158a9">' + orden.filter(function (c) { return grupos[c]; }).map(function (c) {
      return '<span class="chip su-4d5ab7">' + (icoConti[c] || '🌐') + ' ' + esc(c) + ' · ' + grupos[c].length + '</span>';
    }).join('') + '</div></div>';
  orden.forEach(function (c) {
    var arr = grupos[c];
    if (!arr || !arr.length) return;
    html += '<div class="menstrual-card su-68a1a9"><h4>' + (icoConti[c] || '🌐') + ' ' + esc(c) + ' · ' + arr.length + '</h4></div>';
    html += arr.map(function (p) {
      return '<div class="si-card su-cfa1ec"><h4 class="su-6750b2">' + p.ico + ' ' + esc(p.nombre) + ' <span class="muted su-7e3a94">· ' + esc(p.pueblo) + '</span></h4>' +
        '<p class="su-49f9d7"><i>' + esc(p.sig) + '</i></p>' +
        '<p class="su-83cb86">' + esc(p.texto) + '</p></div>';
    }).join('');
  });
  // Por si algún pueblo futuro trae un continente no listado, se muestra igual.
  Object.keys(grupos).forEach(function (c) {
    if (orden.indexOf(c) >= 0) return;
    html += '<div class="menstrual-card su-68a1a9"><h4>🌐 ' + esc(c) + '</h4></div>' +
      grupos[c].map(function (p) {
        return '<div class="si-card su-cfa1ec"><h4 class="su-6750b2">' + p.ico + ' ' + esc(p.nombre) + ' <span class="muted su-7e3a94">· ' + esc(p.pueblo) + '</span></h4>' +
          '<p class="su-49f9d7"><i>' + esc(p.sig) + '</i></p>' +
          '<p class="su-83cb86">' + esc(p.texto) + '</p></div>';
      }).join('');
  });
  html += '<div class="menstrual-card su-68a1a9"><p class="su-616df7">🌱 Como sociedad global, tenemos mucho que aprender de estas visiones: no solo una crítica al modelo actual, sino caminos profundos y sanadores hacia el bien común, la solidaridad activa y una vida digna para todos los seres.<br><b>Porque Vivir Bien es Vivir Juntos. ❤️🌱</b></p></div>';
  box.innerHTML = html;
}

function renderBvPractGuia() {
  var box = $('bvPractGuia');
  if (!box) return;
  box.innerHTML = '<h4>🌱 Práctica pencona de todos los días</h4>' +
    '<div class="su-14b4b5">' + BV_PRACTICAS.map(function (p) {
      return '<div class="si-card su-7aab68"><b class="su-6cb285">' + p.ico + ' ' + esc(p.t) + '</b><p class="muted su-aa314c">' + esc(p.d) + '</p></div>';
    }).join('') + '</div>';
}

function renderBvComp() {
  renderBvPractGuia();
  var box = $('bvCompList');
  if (!box) return;
  var list = [];
  try { list = getBvData().compromisos || []; } catch (e) {}
  var st = $('bvCompStats');
  var s = bvStats();
  if (st) st.textContent = s.total ? (s.total + ' compromisos · ' + s.hechas + ' cumplidos') : 'Sin compromisos aún';
  if (!list.length) { box.innerHTML = '<p class="muted su-11a508">Sin compromisos. Elige una práctica de arriba y escríbela como compromiso: “esta luna, yo…”.</p>'; return; }
  var sorted = list.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  box.innerHTML = sorted.slice(0, 60).map(function (c) {
    return '<div class="habit-item su-533ebe"><span class="su-fbb1e4">' +
      (c.hecho ? '✅ <s>' + esc(c.texto) + '</s>' : '• <b>' + esc(c.texto) + '</b>') +
      '<br><span class="muted su-4adef8">' + esc(c.ambito || '') + ' · ' + esc(c.fecha || '') + '</span></span>' +
      '<span class="su-3a76ac">' +
      '<button type="button" class="btn bv-done su-337714" data-id="' + c.id + '" title="Marcar cumplido">' + (c.hecho ? '↩️' : '✅') + '</button>' +
      '<button type="button" class="btn bv-del su-fd834a" data-id="' + c.id + '">✕</button></span></div>';
  }).join('');
  box.querySelectorAll('.bv-done').forEach(function (b) {
    b.onclick = function () {
      var arr = getBvData().compromisos;
      var it = arr.find(function (x) { return x.id === b.getAttribute('data-id'); });
      if (it) { it.hecho = !it.hecho; save(it.hecho ? 'Compromiso cumplido ✅' : 'Guardado ✓'); renderBvComp(); }
    };
  });
  box.querySelectorAll('.bv-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este compromiso?')) return;
      var arr = getBvData().compromisos;
      var i = arr.findIndex(function (x) { return x.id === b.getAttribute('data-id'); });
      if (i >= 0) arr.splice(i, 1);
      save(); renderBvComp();
    };
  });
}

/* ---------- diálogo + botón ---------- */
function ensureBvDialog() {
  if ($('buenVivirDialog')) return $('buenVivirDialog');
  var d = document.createElement('dialog');
  d.id = 'buenVivirDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">🌎 Buen Vivir — Küme Mongen</h3>' +
    '<button type="button" id="bvCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Ética de lo suficiente para toda la comunidad 🙏🌎. Pueblos del mundo, un horizonte: <b>Vivir Bien es Vivir Juntos</b>. Tus compromisos quedan <b>privados y locales</b>.</p>' +
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabBvVision" class="btn btn-accent su-30e741">🌎 Visión</button>' +
    '<button type="button" id="tabBvPueblos" class="btn su-30e741">🌿 Pueblos</button>' +
    '<button type="button" id="tabBvPract" class="btn su-30e741">🌱 Práctica</button></div>' +
    '<div id="bvVisionPanel"></div>' +
    '<div id="bvPueblosPanel" class="hidden"></div>' +
    '<div id="bvPractPanel" class="hidden"><div id="bvPractGuia" class="su-be2653"></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🤝 Mis compromisos del Buen Vivir</h4>' +
    '<div class="conv-row"><label class="su-4b3de7">Compromiso <input type="text" id="bvCompInput" placeholder="ej: esta luna llevo mi bolsa a la feria" maxlength="90"></label>' +
    '<label>Ámbito <select id="bvCompAmbito"></select></label></div>' +
    '<div class="dlg-actions su-117179"><button type="button" id="bvCompAdd" class="btn btn-accent su-30e741">+ Comprometerme</button>' +
    '<button type="button" id="bvCompShare" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="bvCompExport" class="btn su-30e741">📥 Exportar</button>' +
    '<button type="button" id="bvCompClear" class="btn su-214f75">🗑 Borrar</button></div>' +
    '<div id="bvCompList" class="habits-list su-ebf445"></div>' +
    '<p id="bvCompStats" class="muted su-e13d76"></p></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🔗 Camina con el calendario</h4>' +
    '<div class="su-6157e8">' +
    '<button type="button" class="btn bv-go su-337714" data-go="btnGratitud">📓 Gratitud</button>' +
    '<button type="button" class="btn bv-go su-337714" data-go="btnEspiritual">🕉️ Prácticas</button>' +
    '<button type="button" class="btn bv-go su-337714" data-go="btnVozAbuelos">🗣️ Abuelos</button>' +
    '<button type="button" class="btn bv-go su-337714" data-go="btnMapu">🗣️ Kimün</button>' +
    '<button type="button" class="btn bv-go su-337714" data-go="btnMinga">🤝 Minga</button>' +
    '<button type="button" class="btn bv-go su-337714" data-go="btnTrueque">🔄 Trueque</button>' +
    '<button type="button" class="btn bv-go su-337714" data-go="btnSiembra">🌱 Siembra</button>' +
    '<button type="button" class="btn bv-go su-337714" data-go="btnCompost">🪱 Compost</button>' +
    '</div></div></div>' +
    '<div class="dlg-actions"><button type="button" id="bvClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  var amb = d.querySelector('#bvCompAmbito');
  if (amb) BV_AMBITOS.forEach(function (a) {
    var o = document.createElement('option'); o.value = a; o.textContent = a; amb.appendChild(o);
  });
  return d;
}

function ensureBvButton() {
  var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
  if (!g || $('btnBuenVivir')) return;
  var b = document.createElement('button');
  b.id = 'btnBuenVivir';
  b.className = 'btn';
  b.setAttribute('data-sub', 'tierra');
  b.setAttribute('data-keywords', 'buen vivir vivir bien kume mongen küme mongen sumak kawsay ñande reko suma qamaña shiir waras balu wala lekil kuxlejal kawsak sacha tseltal tsotsil maya sarayaku amazonia filosofia indigena originario mapuche kichwa guarani kolla shuar guna aymara quechua madre tierra nuke mapu ñuke mapu comunidad etica suficiente armonia tierra sin mal ayllu jaqi wak sallqa huanacuni ubuntu harambee teranga ujamaa sankofa akan africa sarvodaya tri hita karana satoyama gotong royong bayanihan asia kaitiakitanga malama aina vanua country aborigen oceania maori hawai hozho septima generacion mitakuye oyasin potlatch lakota norteamerica friluftsliv lagom auzolan europa');
  b.textContent = '🌎 Buen Vivir';
  var ref = $('btnFlora') || $('btnBosque');
  if (ref && ref.parentNode === g) {
    if (ref.nextSibling) g.insertBefore(b, ref.nextSibling);
    else g.appendChild(b);
  } else g.appendChild(b);
}

function ensureBvCheckbox() {
  if (document.querySelector('[data-btn="btnBuenVivir"]')) return;
  var ref = document.querySelector('[data-btn="btnFlora"]') || document.querySelector('[data-btn="btnBosque"]');
  if (ref && ref.closest) {
    var lab = document.createElement('label');
    lab.className = 'check-row';
    lab.innerHTML = '<input type="checkbox" data-btn="btnBuenVivir"> 🌎 Buen Vivir';
    ref.closest('label').parentNode.insertBefore(lab, ref.closest('label').nextSibling);
  }
}

function wireBv() {
  ensureBvButton();
  ensureBvDialog();
  ensureBvCheckbox();
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push && ALL_BTNS.indexOf('btnBuenVivir') < 0) ALL_BTNS.push('btnBuenVivir');
  } catch (e) {}
  try {
    if (typeof ORDEN_TERRITORIO !== 'undefined' && Array.isArray(ORDEN_TERRITORIO) && ORDEN_TERRITORIO.indexOf('btnBuenVivir') < 0) {
      var i = ORDEN_TERRITORIO.indexOf('btnFlora');
      if (i < 0) i = ORDEN_TERRITORIO.indexOf('btnBosque');
      if (i >= 0) ORDEN_TERRITORIO.splice(i + 1, 0, 'btnBuenVivir');
      else ORDEN_TERRITORIO.push('btnBuenVivir');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (k) {
        var p = PRESETS[k];
        if (!p || typeof p !== 'object') return;
        if (p.btnFlora && p.btnBuenVivir === undefined) p.btnBuenVivir = true;
      });
    }
  } catch (e) {}
  try { if (typeof ordenarTerritorio === 'function') ordenarTerritorio(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  var btn = $('btnBuenVivir');
  if (btn && !btn.dataset.bvW) {
    btn.dataset.bvW = '1';
    btn.onclick = function () {
      try { renderBvVision(); } catch (e) {}
      try { renderBvPueblos(); } catch (e2) {}
      try { switchBvTab(bvTab || 'vision'); } catch (e3) {}
      try { renderBvComp(); } catch (e4) {}
      var dlg = $('buenVivirDialog');
      if (dlg && dlg.showModal) { try { dlg.showModal(); } catch (e5) { try { dlg.show(); } catch (e6) {} } }
    };
  }
  var t1 = $('tabBvVision'), t2 = $('tabBvPueblos'), t3 = $('tabBvPract');
  if (t1 && !t1.dataset.w) { t1.dataset.w = '1'; t1.onclick = function () { switchBvTab('vision'); }; }
  if (t2 && !t2.dataset.w) { t2.dataset.w = '1'; t2.onclick = function () { switchBvTab('pueblos'); }; }
  if (t3 && !t3.dataset.w) { t3.dataset.w = '1'; t3.onclick = function () { switchBvTab('pract'); }; }
  var ct = $('bvCloseTop'), cb = $('bvClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { try { $('buenVivirDialog').close(); } catch (e) {} }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { try { $('buenVivirDialog').close(); } catch (e) {} }; }
  var dlg2 = $('buenVivirDialog');
  if (dlg2 && !dlg2.dataset.goW) {
    dlg2.dataset.goW = '1';
    dlg2.querySelectorAll('.bv-go').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-go');
        try { $('buenVivirDialog').close(); } catch (e) {}
        setTimeout(function () { try { var t = $(id); if (t) t.click(); } catch (e2) {} }, 150);
      };
    });
  }
  var add = $('bvCompAdd');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var v = clean(($('bvCompInput') || {}).value || '', 90).trim();
      if (!v) { alert('Escribe tu compromiso primero'); return; }
      getBvData().compromisos.push({
        id: uid('bv'), texto: v,
        ambito: (($('bvCompAmbito') || {}).value || BV_AMBITOS[0]),
        fecha: todayKey(), hecho: false
      });
      $('bvCompInput').value = '';
      save('Compromiso guardado 🌎');
      renderBvComp();
    };
  }
  var sh = $('bvCompShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var list = [];
      try { list = getBvData().compromisos || []; } catch (e) {}
      if (!list.length) { alert('Sin compromisos aún'); return; }
      share('🌎 Mis compromisos del Buen Vivir', buildBvShareText(list));
    };
  }
  var ex = $('bvCompExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var list = [];
      try { list = getBvData().compromisos || []; } catch (e) {}
      if (!list.length) { alert('Sin compromisos aún'); return; }
      var blob = new Blob([buildBvShareText(list)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'buen-vivir-compromisos.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var cl = $('bvCompClear');
  if (cl && !cl.dataset.w) {
    cl.dataset.w = '1';
    cl.onclick = function () {
      if (!confirm('¿Borrar todos tus compromisos?')) return;
      getBvData().compromisos = [];
      save(); renderBvComp();
    };
  }
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
}

window.BuenVivir = {
  tab: switchBvTab, renderVision: renderBvVision, renderPueblos: renderBvPueblos,
  renderComp: renderBvComp, list: getBvData, pueblos: BV_PUEBLOS, practicas: BV_PRACTICAS
};

var _bvRetry = 0;
function setupBv() {
  if (!document.querySelector('.action-group[data-group="territorio"] .group-btns') || typeof userData !== 'function') {
    _bvRetry++;
    if (_bvRetry < 80) setTimeout(setupBv, 500);
    return;
  }
  try { wireBv(); } catch (e) {}
  try { renderBvVision(); } catch (e2) {}
  try { renderBvPueblos(); } catch (e3) {}
}
setTimeout(setupBv, 700);

})();
