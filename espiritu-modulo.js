/* ============================================================
   ESPIRITU — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente:
   - Botón btnEspiritu (grupo Linaje > practicas, tras btnEspiritual)
   - Diálogo espirituDialog con 8 pestañas:
     1) Guía (qué es espíritu, cuerpo-mente-espíritu, 7 pilares,
        señales, cómo practicar sin templo ni maestro, cuidados)
     2) Luces (12 principios en lenguaje simple +
        buscador + detalle + favorita + "vivir hoy")
     3) Prácticas (10 prácticas + silencio 5 min
        + registro del día del espíritu)
     4) Cosmovisiones (8 fichas: mapuche, andina, cristiana,
        budista, tolteca, yoruba, laica y propia + favoritas
        + buscador + llevar a diario)
     5) Mundo espiritual (7 puertas: qué es, ancestros, guías,
        sueños y señales, protección, territorio, partida +
        buscador + llevar a diario + discernimiento)
     6) Elementales (6 fichas: tierra, agua, aire, fuego, éter
        y hogar + Ngen mapuche + bitácora de encuentros)
     7) Test (20 afirmaciones: paz, sentido, conexión,
        gratitud + nivel de ruido/ego)
     8) Mi Camino (mi pilar, diario, días, historial,
        racha, compartir, llevar a nota, borrar)
   - Todo local y privado por usuario: userData().espiritu
     { tests:[], miPilar:'', practs:[], diario:{}, favs:[],
       cosmoFavs:[], elemLog:[] }
   - Puentes: Prácticas Espirituales (cuerpo/luz), Gratitud,
     Respiración, Duelo, Recapitulación, Métodos.
   - Laico y respetuoso: no impone religión ni reemplaza
     terapia. Compatible con fe mapuche, cristiana u otra.
     100% offline.
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
function blank() { return { tests: [], miPilar: '', practs: [], diario: {}, favs: [], cosmoFavs: [], elemLog: [] }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.espiritu) u.espiritu = blank();
    var e = u.espiritu;
    if (!Array.isArray(e.tests)) e.tests = [];
    if (!Array.isArray(e.practs)) e.practs = [];
    if (!e.diario) e.diario = {};
    if (!Array.isArray(e.favs)) e.favs = [];
    if (!Array.isArray(e.cosmoFavs)) e.cosmoFavs = [];
    if (!Array.isArray(e.elemLog)) e.elemLog = [];
    if (typeof e.miPilar !== 'string') e.miPilar = '';
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
var ESP_TABS = ['Guia', 'Luces', 'Pract', 'Cosmo', 'Mundo', 'Elem', 'Test', 'Camino'];
function switchTab(name) {
  ESP_TABS.forEach(function (t) {
    var p = $('esp' + t), b = $('tabEsp' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ============================================================
   DATOS — 7 pilares del espíritu (base del test y del camino)
   ============================================================ */
var ESP_PILARES = {
  Z: { nombre: 'Paz · silencio interior', ico: '🧘', desc: 'Tu fuerza es la calma: paras, respiras y no te arrastra la ola. Riesgo: confundir paz con evasión (callar todo y no resolver).',
       entrena: 'Suma rito: 5 min de silencio a la misma hora + 1 pausa STOP al día + examen de noche de 1 línea.' },
  S: { nombre: 'Sentido · para qué vivo', ico: '✨', desc: 'Tu fuerza es el rumbo: sabes qué te mueve aunque el día sea gris. Riesgo: exigir un gran propósito y despreciar lo chico.',
       entrena: 'Suma gratitud: 1 frase de sentido al despertar + 3 agradecimientos + servir 10 min a la semana.' },
  C: { nombre: 'Conexión · amor y servicio', ico: '🤲', desc: 'Tu fuerza es el vínculo: cuidas gente, tierra y animales; no vives solo para ti. Riesgo: darte entero y quemarte.',
       entrena: 'Suma paz: 1 servicio acotado por semana (10–30 min) + pedir ayuda 1 vez sin culpa.' },
  G: { nombre: 'Gratitud · perdón que libera', ico: '🙏', desc: 'Tu fuerza es soltar: agradeces lo que hay y perdonas lo que dolió. Riesgo: perdonar rápido para no sentir (taparlo).',
       entrena: 'Suma presencia: carta no enviada + 1 acto de reparación real cuando corresponda.' }
};

/* ============================================================
   DATOS — 12 luces (principios en paráfrasis educativa breve)
   ============================================================ */
var ESP_LUCES = [
  { id: 'silencio', cap: '1 · El silencio ordena', ico: '🧘', tag: 'silencio calma ruido mente aquietar presencia',
    texto: '“En el silencio se escucha lo que el ruido tapa: tu voz de adentro.”',
    idea: 'El espíritu habla bajito. Si el día es puro ruido (pantalla, noticias, reclamos), no lo oyes. Cinco minutos de silencio al día —sentado, sin celu— ordenan más que una hora de vueltas.',
    sirve: 'Cabeza llena, insomnio por pensar, reaccionar en caliente, no saber qué quieres.',
    practica: 'Hoy 5 min: siéntate, pies en tierra, respira 4-6. Cuenta respiraciones del 1 al 10 y vuelve a empezar. Anota 1 frase de lo que apareció.',
    trampa: 'Buscar “mente en blanco” y frustrarse. El silencio no vacía: deja pasar y observa.',
    pregunta: '¿Qué me está diciendo bajito mi interior?' },
  { id: 'gratitud', cap: '2 · Agradecer abre', ico: '🙏', tag: 'gratitud gracias agradecer contento suficiente bendicion',
    texto: '“Quien agradece, multiplica lo bueno sin comprar nada.”',
    idea: 'La gratitud cambia el foco: de lo que falta a lo que sostiene (agua, pan, manos, techo, mar). No niega el dolor: le pone al lado lo que sí hay. Tres al día entrenan el ojo.',
    sirve: 'Queja crónica, envidia, sentir que nada alcanza, pena sorda.',
    practica: 'Nombra 3 en voz alta cada noche (una del cuerpo, una de una persona, una del territorio). Escríbelas en tu diario 7 días.',
    trampa: 'Agradecer por obligación o para tapar rabia legítima. Se agradece y también se pone límite.',
    pregunta: '¿Qué tres cosas me sostuvieron hoy?' },
  { id: 'perdon', cap: '3 · Perdonar suelta', ico: '💧', tag: 'perdon perdonar rencor soltar culpa reconciliar hooponopono',
    texto: '“Perdonar no aprueba lo que pasó: te libera del peso de cargarlo.”',
    idea: 'El rencor es cargar una piedra ajena. Perdonar es soltarla: a veces con palabra, a veces con distancia sana, a veces con reparación. Empieza por lo chico y pide apoyo en lo grande.',
    sirve: 'Rabia vieja, herida familiar, culpa que no deja dormir, pelea atascada.',
    practica: 'Carta no enviada: escribe lo que dolió, lo que necesitaste y lo que sueltas. Léela en voz alta a solas y quémala o guárdala. Si hay daño grave, hazlo acompañada/o.',
    trampa: 'Perdonar rápido para “ser espiritual” sin sentir ni reparar. El perdón real a veces pide acto, no solo frase.',
    pregunta: '¿Qué piedra puedo soltar hoy?' },
  { id: 'servicio', cap: '4 · Servir enciende', ico: '🤲', tag: 'servicio ayudar dar minga solidario vecino ofrenda',
    texto: '“El espíritu crece cuando sirve: quien da, se da sentido.”',
    idea: 'Un acto chico y concreto (acompañar 10 min, limpiar tu vereda, llevar sopa) te saca del yo-yo-yo y te devuelve al nosotros. La minga penqueña es espiritualidad práctica.',
    sirve: 'Vacío, sentirte inútil, encierro, tristeza que se mira el ombligo.',
    practica: 'Hoy 1 servicio de 10 min sin foto ni aviso: saluda, ayuda, repara, acompaña. Márcalo con 🤲 y siente el calorcito.',
    trampa: 'Dar hasta quemarte o para que te quieran. Servicio sano: acotado, alegre y sin deuda.',
    pregunta: '¿A quién puedo aliviar 10 minutos hoy?' },
  { id: 'naturaleza', cap: '5 · La tierra sostiene', ico: '🌊', tag: 'naturaleza tierra mar bosque luna sol pacha respeto kimun',
    texto: '“Toca tierra, mira mar: eres parte, no dueña/o.”',
    idea: 'El espíritu se ordena afuera: arena húmeda, hoja, luna, pájaro. En Penco basta Playa Negra, el humedal o tu huerta. Pide permiso, saluda y deja limpio: el kimün mapuche lo dice claro.',
    sirve: 'Desconexión, cemento todo el día, angustia urbana, olvidar de dónde viene el agua y el pan.',
    practica: '10 min descalza/o en pasto/arena/tierra + 3 respiraciones mirando el mar o un árbol. Recoge 1 basura ajena como ofrenda.',
    trampa: 'Usar la naturaleza como fondo de foto y dejar basura. Visitar es cuidar.',
    pregunta: '¿Cuándo toqué tierra por última vez?' },
  { id: 'trascendencia', cap: '6 · Hay algo más grande', ico: '✨', tag: 'trascendencia dios ngenechen sagrado fe misterio oracion',
    texto: '“Creas en lo que creas, hay un misterio que te excede y te abraza.”',
    idea: 'Llámalo Dios, Ngenechén, universo, amor o misterio: reconocer algo más grande achica el ego y agranda la confianza. Tu fe —mapuche, cristiana, otra o propia— cabe aquí sin pelear.',
    sirve: 'Soberbia, control total, miedo a la muerte, sentirte sola/o en lo difícil.',
    practica: 'Mira el cielo 1 min (día o noche) y di tu frase: “gracias / ayúdame / hágase”. Si rezas, reza; si no, contempla. Anota qué se movió.',
    trampa: 'Usar lo grande para no hacer tu parte (“Dios proveerá” y no te mueves). Fe y acto van juntos.',
    pregunta: '¿En qué misterio descanso hoy?' },
  { id: 'rito', cap: '7 · El rito marca', ico: '🕯️', tag: 'rito ritual vela luna costumbre habito sagrado repeticion',
    texto: '“Repite con amor y lo ordinario se vuelve sagrado.”',
    idea: 'Vela del domingo, mate de la mañana, saludo al mar, luna llena en familia: el rito marca el tiempo y dice “esto importa”. No necesita templo: necesita repetición y corazón.',
    sirve: 'Días iguales, todo da lo mismo, familia dispersa, lunas que pasan sin pena ni gloria.',
    practica: 'Elige 1 mini-rito de 2 min por 1 luna (vela, saludo al sol, 3 gratitudes). Mismo lugar, misma hora. Si fallas un día, retoma sin látigo.',
    trampa: 'Llenarte de ritos y volverte esclava/o de ellos. Uno vivo vale más que diez obligados.',
    pregunta: '¿Qué rito chico quiero sembrar esta luna?' },
  { id: 'palabra', cap: '8 · La palabra crea', ico: '💬', tag: 'palabra rezo decreto oracion canto epew consejo hablar',
    texto: '“Lo que repites, te habita: habla siembra.”',
    idea: 'Rezo, canto, epew, consejo de abuela, decreto o simple frase: la palabra repetida con fe ordena la emoción. Elige qué repites (queja o siembra) porque te construye.',
    sirve: 'Diálogo interno cruel, garabatos todo el día, casa con gritos, miedo que se cuenta solo.',
    practica: 'Elige 1 frase madre (“estoy sostenida/o”, “paso a paso”, “chaltu may”) y repítela 10 veces al despertar y al acostarte por 7 días.',
    trampa: 'Repetir frases mágicas y no actuar. La palabra abre; el paso confirma.',
    pregunta: '¿Qué frase quiero que me habite?' },
  { id: 'duelo', cap: '9 · El dolor también reza', ico: '🕊️', tag: 'duelo perdida muerte luto despedida memoria consuelo',
    texto: '“Llorar a quien partió también es orar: el amor no muere.”',
    idea: 'El espíritu no evita el duelo: lo honra. Vela, carta, visita al cementerio, comida de recuerdo, nombrar en voz alta. La pena tiene lunas: respétalas y pide compañía.',
    sirve: 'Pérdida reciente o antigua atascada, fecha que duele, culpa de sobreviviente.',
    practica: 'Enciende 1 vela y cuenta 1 recuerdo bueno en voz alta. Si la pena desborda, abre 🕊️ Duelo del calendario o pide apoyo (CESFAM, *4141).',
    trampa: 'Apurar el duelo (“ya supéralo”) o quedarte sola/o con dolor grande. Acompañada/o, la pena camina.',
    pregunta: '¿A quién quiero honrar hoy?' },
  { id: 'amor', cap: '10 · Amar es practicar', ico: '❤️', tag: 'amor cariño pareja hijo familia abrazo perdon ternura',
    texto: '“Amar no es sentir bonito: es cuidar concreto.”',
    idea: 'El amor espiritual se ve: abrazo, escucha sin celu, perdón rápido, plato servido, saludo. Menos “te amo” de boca y más cuidado de manos. Parte por casa.',
    sirve: 'Frialdad en casa, pareja en modo trámite, hijos con pantalla en vez de abrazo.',
    practica: 'Hoy 1 acto de amor concreto y nombrado: abrazo de 20 seg, escucha de 10 min, nota en la almohada. Sin esperar devuelta.',
    trampa: 'Amor que controla o compra (“te amo, por eso obedéceme”). Amar libera, no amarra.',
    pregunta: '¿Cómo se verá mi amor hoy?' },
  { id: 'presencia', cap: '11 · Estar aquí sana', ico: '👁️', tag: 'presencia atencion aqui ahora mindfulness respiracion foco',
    texto: '“El espíritu vive en el ahora: el pasado pesa y el futuro asusta.”',
    idea: 'Comer mirando el plato, caminar sintiendo los pies, escuchar sin interrumpir: la presencia devuelve la vida al momento. Tres respiraciones te traen de vuelta cuando te vas.',
    sirve: 'Ansiedad de futuro, culpa de pasado, comer/workear en automático, no disfrutar nada.',
    practica: '3 veces hoy: detente, 3 respiraciones 4-6, nombra 3 cosas que ves/oyes/sientes. 1 min basta.',
    trampa: 'Querer estar presente todo el día y culparte por distraerte. Vuelve amable, cien veces.',
    pregunta: '¿Dónde estoy ahora mismo?' },
  { id: 'entrega', cap: '12 · Suelta y confía', ico: '🌙', tag: 'soltar entrega confianza aceptar rendirse fluir control',
    texto: '“Haz tu parte y suelta el resultado: la luna también mengua.”',
    idea: 'Hay batallas que se ganan soltando: el hijo que elige, la enfermedad que avanza, la pega que no salió. Entregar no es rendirse: es hacer lo tuyo y confiar el resto al misterio y al tiempo.',
    sirve: 'Control obsesivo, no dormir por querer resolverlo todo, apretar lo que se escapa.',
    practica: 'Escribe “hice ___; suelto ___; confío en ___”. Léelo en voz alta mirando la luna o el mar. Respira y duerme.',
    trampa: 'Soltar para no hacer tu parte. Primero el paso, después la entrega.',
    pregunta: '¿Qué suelto esta noche?' }
];
function espLuz(id) { for (var i = 0; i < ESP_LUCES.length; i++) if (ESP_LUCES[i].id === id) return ESP_LUCES[i]; return null; }

var ESP_PRACTICAS = [
  { id: 'silencio5', n: 'Silencio de 5 minutos', ico: '🧘', tiempo: '5 min al despertar o al acostarte',
    pasos: 'Siéntate, pies en tierra, celu lejos. Respira 4-6 y cuenta del 1 al 10, una y otra vez. Cuando te vayas a un pensamiento, vuelve amable. Cierra anotando 1 frase.',
    tip: 'Misma hora y mismo rincón por 7 días: el cuerpo aprende el rito. Si 5 es mucho, parte con 2.' },
  { id: 'gratitud3', n: 'Tres gratitudes', ico: '🙏', tiempo: '2 min en la noche',
    pasos: 'Di en voz alta o escribe 3: una del cuerpo (“mis piernas me llevaron”), una de una persona, una del territorio (mar, lluvia, pan). Detalle chico vale oro.',
    tip: 'Puente con 📓 Gratitud Diaria del calendario: allá llevas la racha larga.' },
  { id: 'perdoncarta', n: 'Carta que libera (no enviada)', ico: '💧', tiempo: '15 min, 1 vez por luna',
    pasos: 'Elige 1 herida chica-mediana. Escribe: qué pasó, qué sentí, qué necesité, qué suelto hoy. Léela en voz alta a solas. Quémala o guárdala. Con herida grave o trauma, hazlo acompañada/o.',
    tip: 'Puente con 🔁 Recapitulación (inventario) y 🌺 Ho’oponopono si te resuena el “lo siento, perdóname, gracias, te amo”.' },
  { id: 'servicio10', n: 'Servicio de 10 minutos', ico: '🤲', tiempo: '10 min, 1 vez por semana',
    pasos: 'Elige 1 acto concreto: acompañar, limpiar, llevar, reparar, visitar. Sin foto ni deuda. Al terminar, anota cómo quedó tu pecho.',
    tip: 'Puente con 🤲 Minga y Trueque: tu servicio sostiene la red penqueña.' },
  { id: 'ofrenda', n: 'Ofrenda a la mar y la tierra', ico: '🌊', tiempo: '10 min en tu salida',
    pasos: 'En playa, humedal, cerro o huerta: saluda (“mari mari, permiso”), respira 3 veces, recoge 1 basura ajena, deja todo limpio. Si llevas ofrenda (flor, semilla, muday), que sea biodegradable.',
    tip: 'Respeto kimün: se pide permiso, no se arranca, no se raya, no se grita. Con marea alta u olas, solo mirador.' },
  { id: 'rezo', n: 'Mi rezo u oración propia', ico: '🕯️', tiempo: '3 min mañana y noche',
    pasos: 'Con tus palabras y tu fe (o sin religión): gracias + ayuda + entrega. Ejemplo: “Gracias por este día; ayúdame con ___; suelto ___”. Vela o luz baja si quieres. Vale mapuzugun, español o silencio.',
    tip: 'Si vas a misa, culto o nguillatun, este rezo diario lo sostiene entre semana.' },
  { id: 'lectura', n: 'Lectura que eleva', ico: '📖', tiempo: '10 min con lápiz',
    pasos: 'Elige 1 texto que te eleve (una Luz de esta sección, un salmo, un epew, una carta de abuela). Lee lento, subraya 1 frase, cópiala en tu diario y vívela hoy.',
    tip: 'Una frase vivida 7 días vale más que un libro devorado.' },
  { id: 'pausa', n: 'Pausa sagrada (ayuno chico)', ico: '🌙', tiempo: '1 tarde o mañana por luna',
    pasos: 'Elige 1: sin pantallas 3 h, sin azúcar 1 día, sin alegatos 1 día, o cena liviana y temprano. Avisa en casa, toma agua, camina suave. Anota qué se aquietó.',
    tip: 'No es castigo ni dieta: es descanso. Con embarazo, lactancia, diabetes o trastorno alimentario, elige pausa digital o de queja, no de comida. Si tomas remedios, consulta.' },
  { id: 'vigilia', n: 'Vigilia lunar (mirar la luna)', ico: '🌕', tiempo: '5–10 min en luna llena/nueva',
    pasos: 'Sal a mirar la luna (llena para agradecer, nueva para sembrar intención). Di tu intención en voz alta, respira lento, anota 1 compromiso para la luna. Abrígate: en Penco corre viento.',
    tip: 'Puente con 🌙 calendario y 📿 Ekadashi: la luna ordena cuerpo, siembra y ánimo.' },
  { id: 'escritura', n: 'Escritura del alma', ico: '✍️', tiempo: '10 min libres',
    pasos: 'Escribe sin parar ni corregir: “hoy mi espíritu está… necesito… agradezco…”. 10 min de corrido. Relee y subraya 1 joya. Guarda privado.',
    tip: 'Puente con 💭 Sueños y 🪞 Autoconocimiento: lo que sale aquí a veces pide conversarse.' }
];

var ESP_TEST = [
  { c: 'Z', txt: 'Me detengo y respiro antes de reaccionar cuando algo me enciende.' },
  { c: 'S', txt: 'Siento que mi vida tiene un para qué, incluso en días grises.' },
  { c: 'C', txt: 'Dedico tiempo real a cuidar a otros (familia, vecinos, tierra, animales).' },
  { c: 'G', txt: 'Agradezco en voz alta o por escrito casi todos los días.' },
  { c: 'F', txt: 'Vivo corriendo y con ruido todo el día, sin un minuto de silencio.' },
  { c: 'Z', txt: 'Puedo estar 5 minutos en silencio sin angustiarme ni mirar el celu.' },
  { c: 'S', txt: 'Cuando sufro, busco qué me enseña en vez de solo quejarme.' },
  { c: 'C', txt: 'Pido ayuda cuando la necesito, sin vergüenza.' },
  { c: 'G', txt: 'He soltado (o estoy soltando) un rencor viejo que me pesaba.' },
  { c: 'F', txt: 'Me cuesta dormir por dar vueltas a lo mismo una y otra vez.' },
  { c: 'Z', txt: 'Vuelvo al presente (respiro, miro, toco tierra) cuando me voy al futuro o al pasado.' },
  { c: 'S', txt: 'Tengo un rito chico que me ordena (vela, rezo, saludo al mar, gratitud).' },
  { c: 'C', txt: 'Trato con cariño concreto: abrazo, escucho, acompaño, no solo digo “te quiero”.' },
  { c: 'G', txt: 'Perdono rápido lo chico y pongo límite sano en lo grande.' },
  { c: 'F', txt: 'Siento vacío o “¿para qué todo esto?” más de una vez por semana.' },
  { c: 'Z', txt: 'Acepto lo que no puedo cambiar sin pelearlo todo el día.' },
  { c: 'S', txt: 'Mi fe o mi misterio (Dios, Ngenechén, amor, universo) me sostiene en lo difícil.' },
  { c: 'C', txt: 'Cuido la naturaleza: no boto basura, saludo y dejo limpio donde paso.' },
  { c: 'G', txt: 'Digo “gracias” y “perdón” de verdad, mirando a los ojos.' },
  { c: 'F', txt: 'Exploto o me apago con facilidad y después me arrepiento.' }
];
var ESP_LIKERT = [
  { v: 0, t: 'Nunca' }, { v: 1, t: 'A veces' }, { v: 2, t: 'A menudo' }, { v: 3, t: 'Muy cierto' }
];

var ESP_LUNAS = [
  'Lunas 1-3 (Pukem · invierno): adentro. Silencio 5 min + 3 gratitudes + 1 vela semanal. Lee luces 1, 2 y 9. Pregunta: ¿qué me sostiene en este frío?',
  'Lunas 4-6 (Pewu · primavera): brotar sirviendo. 1 servicio de 10 min por semana + ofrenda a la tierra. Lee luces 4, 5 y 8. Siembra tu rito chico.',
  'Lunas 7-9 (Walung · verano): celebrar y amar. Vigilia de luna llena + acto de amor concreto al día. Lee luces 10, 6 y 11. Comparte tu pan y tu canto.',
  'Lunas 10-13 (Rimu · otoño): soltar y honrar. Carta que libera + honra a quien partió + relee tu diario. Lee luces 3, 9 y 12. Elige tu pilar madre.'
];

/* ============================================================
   DATOS — El espíritu según 8 cosmovisiones (fichas comparables)
   Tono laico y respetuoso: describe, no impone ni mezcla ritos
   cerrados. Si practicas una fe, vive tu fe; lo demás se estudia.
   ============================================================ */
var ESP_COSMO = [
  { id: 'mapuche', cap: 'Mapuche · Küme Mongen', ico: '🌿', tag: 'mapuche kimun ngenechen newen pillan ngen epew nguillatun machi',
    texto: '“Ixofij mogen: todo vive y todo se respeta.”',
    idea: 'El espíritu (püllü / am) es parte del ixofij mogen (toda la vida junta). Ngenechén sostiene, los Ngen cuidan cada lugar (agua, bosque, piedra) y los ancestros (püllü de abuelos) acompañan. El küme mongen (buen vivir en equilibrio) se practica: saludar y pedir permiso, no arrancar de más, compartir (minga), escuchar epew (relatos que enseñan).',
    cree: 'Hay un orden vivo: persona, familia, comunidad, tierra y espíritus se cuidan entre sí. El daño a la tierra es daño al espíritu.',
    practica: 'Saludo con respeto: al entrar a playa, humedal, cerro o bosque di en voz baja “mari mari, permiso” + recoge 1 basura ajena. En casa, comparte 1 epew o consejo de abuela a la semana.',
    respeto: 'El nguillatun, el machitún y otros ritos los guían sus dueños. No se improvisan ni se miran como espectáculo: se acompañan solo si te invitan, con silencio y obediencia.',
    pregunta: '¿Qué lugar de Penco me sostiene y cómo lo cuido de vuelta?' },
  { id: 'andina', cap: 'Andina · Ayni y Pachamama', ico: '⛰️', tag: 'andina pachamama ayni apu quechua aymara ofrenda pago',
    texto: '“Ayni: hoy doy, mañana recibo; la tierra es madre.”',
    idea: 'Todo es ayllu (comunidad extendida: gente, cerros-apus, agua, semilla). La Pachamama da y se le devuelve con pago/ofrenda sencilla y trabajo (minga). El espíritu sano es el que está en ayni: reciprocidad concreta, no solo intención.',
    cree: 'La salud espiritual se mide en relaciones sanas: con la tierra, con la familia y con la palabra dada.',
    practica: 'Pago chico y limpio: entierra 1 puñado de semillas o riega 1 planta con intención de gracias + cumple 1 promesa chica esta semana.',
    respeto: 'El pago grande a los apus lo hacen sus paqos Yatiri. No copies ritos con alcohol, coca u ofrendas animales: quédate con el principio (reciprocidad) y tu gesto local biodegradable.',
    pregunta: '¿A quién o a qué tierra le debo un “gracias” con acto?' },
  { id: 'cristiana', cap: 'Cristiana · Amor y gracia', ico: '✝️', tag: 'cristiana jesus dios virgen oracion misa culto biblia gracia amor projimo',
    texto: '“Ama a tu prójimo como a ti misma/o.”',
    idea: 'El espíritu es soplo de Dios que te habita; se cultiva con oración, lectura, sacramentos/comunidad y caridad concreta. El examen de noche, el perdón (70 veces 7) y el servicio al más chico son su columna. Cabe católica, evangélica, ortodoxa u otra: cada iglesia ordena los pasos.',
    cree: 'Dios es amor cercano que perdona y levanta; la fe se muestra en obras.',
    practica: 'Oración de 3 frases (gracias + perdón + ayuda) mañana y noche + 1 obra chica semanal (visita, plato, escucha). Si vas a misa/culto, lleva ahí tu intención de la semana.',
    respeto: 'Los sacramentos y la guía pastoral son de tu iglesia: esta ficha no los reemplaza. Si algo aquí choca con tu doctrina, sigue a tu pastor/cura y usa solo lo compatible.',
    pregunta: '¿A quién me cuesta amar y qué acto chico puedo hacer igual?' },
  { id: 'budista', cap: 'Budista · Calma y compasión', ico: '☸️', tag: 'budista buda meditacion compasion atencion plena karma impermanencia',
    texto: '“El dolor se aquieta cuando sueltas el aferrarte.”',
    idea: 'El espíritu se entrena como la mente: atención plena (estar aquí), compasión (desear bien a todos, incluso al difícil) e impermanencia (todo pasa, también esta pena). Sentarse 5 min a mirar la respiración es su templo portátil.',
    cree: 'Nada es fijo: con causa y práctica, el ánimo cambia. El daño vuelve (karma): cuida tu sembrar.',
    practica: '5 min de respiración contada + frase de compasión: “que yo esté bien, que mi familia esté bien, que Penco esté bien”. Úsala antes de responder en caliente.',
    respeto: 'El refugio y los retiros se toman con maestras/os reconocidas/os. No mezcles mantras de iniciación cerrada: basta respiración y bondad concreta.',
    pregunta: '¿Qué estoy apretando que ya está pasando igual?' },
  { id: 'tolteca', cap: 'Tolteca · Recapitulación e impecabilidad', ico: '🐆', tag: 'tolteca castaneda recapitulacion ensueño acecho nagual tonal impecable',
    texto: '“Recupera tu energía del pasado para estar entera/o hoy.”',
    idea: 'El espíritu pierde fuerza en heridas no miradas. La recapitulación (repasar con respiración, como en 🔁 tu sección) + vivir impecable (cumple tu palabra, no te tomes nada personal, haz siempre lo mejor) lo devuelven. El ensueño (soñar consciente) y el acecho (observarte en acto) son estudios largos.',
    cree: 'Eres energía en un mundo vivo: lo que no sueltas, te maneja.',
    practica: '1 recuerdo chico por sesión: 10 respiraciones de barrido + 1 frase de aprendizaje. Puente directo con 🔁 Recapitulación del calendario.',
    respeto: 'El camino del nagual pide maestro y años: no uses plantas de poder ni ritos del desierto por tu cuenta. Quédate con recapitulación, palabra y silencio.',
    pregunta: '¿Qué recuerdo chico me sigue cobrando energía?' },
  { id: 'yoruba', cap: 'Africana · Ashé y ancestro', ico: '🌍', tag: 'yoruba ashe orisha ancestro candomble santeria africa respeto tambor',
    texto: '“Soy porque fueron: el ancestro vive en mi paso.”',
    idea: 'El espíritu (ashé = fuerza vital) circula entre dioses-orishas, ancestros y comunidad. Se honra al ancestro con nombre, comida, canto y conducta digna; la cabeza (orí) se cuida con buen consejo y limpieza de vida.',
    cree: 'Nadie camina sola/o: la familia visible e invisible sostiene si se honra.',
    practica: 'Honra simple y universal: nombra en voz alta a 1 abuela/o, cuenta 1 historia suya y cocina/comparte algo que le gustaba. Sin adivinación ni ofrenda animal en casa.',
    respeto: 'La iniciación, el tambor sagrado y la adivinación son de sus sacerdotes. No improvises collares, santos ni sacrificios: honra con memoria y conducta.',
    pregunta: '¿Qué fuerza de mis abuelas/os quiero continuar?' },
  { id: 'laica', cap: 'Humanista laica · Sentido sin templo', ico: '🌈', tag: 'laica humanista ciencia sentido etica razon solidaridad atea agnostica',
    texto: '“No necesito templo para vivir con sentido y bondad.”',
    idea: 'El espíritu se nombra como sentido, valores y vínculo: asombro ante el mar, ética (no dañar), solidaridad y legado (qué dejo). La ciencia explica el cómo; cada persona elige el para qué. Meditar, agradecer y servir funcionan igual sin fe religiosa.',
    cree: 'La vida vale por sí misma: cuidarla con razón y cariño basta.',
    practica: 'Rito laico de 3 min: asombro (mira cielo/mar 1 min) + valores (¿qué valor viví hoy?) + legado (¿qué dejo mañana?). Escríbelo en 1 línea.',
    respeto: 'Ser laica/o no es burlarse de quien cree: aquí todas las fes se respetan. Si acompañas ritos ajenos, hazlo en silencio y sin interrumpir.',
    pregunta: '¿Qué valor quiero que se note en mi semana?' },
  { id: 'propia', cap: 'Tu mezcla penqueña · Tu camino', ico: '🧭', tag: 'propia mezcla camino personal sincretismo penco familia mi fe',
    texto: '“Tomo lo bueno de cada casa y armo mi altar chico.”',
    idea: 'La mayoría mezcla: rezo cristiano + saludo mapuche al mar + respiración budista + minga vecinal. Vale, si es con respeto y coherencia: elige 1–2 raíces madre (tu familia) y suma solo prácticas abiertas y compatibles, sin disfrazarte de lo que no eres.',
    cree: 'Tu conciencia manda: lo que te da paz, te ordena y no daña, sirve.',
    practica: 'Dibuja tu mapa en 1 hoja: mi raíz (___) + mi rito diario (___) + mi servicio semanal (___). Revisa cada luna: ¿me da calma real o puro adorno?',
    respeto: 'No uses símbolos cerrados (vestidos, plumas, collares iniciados, cantos sagrados) como decoración. Aprende, cita la fuente y pide permiso.',
    pregunta: '¿Cuáles son mis 2 raíces y mi 1 rito diario?' }
];
function espCosmo(id) { for (var i = 0; i < ESP_COSMO.length; i++) if (ESP_COSMO[i].id === id) return ESP_COSMO[i]; return null; }

/* ============================================================
   DATOS — El mundo espiritual (7 puertas, con discernimiento)
   ============================================================ */
var ESP_MUNDO = [
  { id: 'velo', cap: '1 · ¿Qué es el mundo espiritual?', ico: '🌌', tag: 'mundo espiritual velo plano dimension invisible energia',
    texto: '“Lo invisible sostiene lo visible, como la raíz al árbol.”',
    idea: 'Casi todas las cosmovisiones dicen: además de lo que tocamos hay una dimensión viva (espíritus, ancestros, fuerzas de la tierra, misterio). No se ve con ojos, se percibe por efectos: calma, sueños, sincronicidades, consuelo en duelo. Creas o dudes, esta puerta se estudia con respeto y prudencia.',
    sirve: 'Curiosidad sana, duelo, susto nocturno, “siento presencias”, ganas de proteger tu casa.',
    practica: 'Estudio tranquilo 10 min: lee 1 puerta por día (no las 7 de golpe). Anota: ¿qué me da paz? ¿qué me da miedo? Conversa lo que te mueva con alguien de confianza.',
    cuidado: 'No busques “abrir el tercer ojo” rápido ni mezcles alcohol/drogas con ritos. Lo espiritual apurado desordena: lento y acompañado.',
    pregunta: '¿Qué creo yo hoy del mundo invisible?' },
  { id: 'ancestros', cap: '2 · Ancestros y linaje', ico: '🕯️', tag: 'ancestros abuelos linaje difuntos altar memoria honra',
    texto: '“Tus abuelas/os caminan contigo si los nombras.”',
    idea: 'La memoria viva sostiene: foto, vela, comida de recuerdo, contar su historia. Honrar no es adorar ni pedirles todo: es agradecer, pedir consejo en silencio y continuar lo bueno. Puente con 🌳 Árbol y 🕊️ Duelo.',
    sirve: 'Duelo, desarraigo, hijos que no conocen su historia, decisiones grandes.',
    practica: 'Altar chico 1 semana: 1 foto + 1 vela + 1 objeto suyo + 1 frase (“gracias por ___”). Cuéntales tu día en voz baja 3 min. Cierra agradeciendo.',
    cuidado: 'Si el vínculo fue dañino, honra a distancia (agradece la vida, pon límite). No hables con difuntos buscando órdenes: si una “voz” te manda daño, corta y pide ayuda profesional y espiritual.',
    pregunta: '¿A qué ancestro quiero agradecer hoy?' },
  { id: 'guias', cap: '3 · Guías, ángeles y protectores', ico: '👼', tag: 'guias angeles protectores arcangeles virgen santo orisha ayuda',
    texto: '“Pide bien y escucha mejor.”',
    idea: 'Cada fe nombra ayudas: ángeles, vírgenes/santos, orishas, guías, el Ngen del lugar. Pedir es legítimo (protección, claridad, consuelo). La respuesta suele llegar como calma, idea clara, ayuda humana o puerta que se abre: no como voz que grita.',
    sirve: 'Miedo, viaje, enfermedad, casa pesada, decisión difícil.',
    practica: 'Petición de 3 líneas (gracias + pido ___ + me comprometo a ___) + vela o luz baja 5 min. Anota 7 días qué cambió. Agradece siempre el cierre.',
    cuidado: 'Desconfía de quien te cobra por “limpias” urgentes, te amenaza (“si no pagas te pasa algo”) o te aísla de tu familia. Guía sana: te deja más libre y tranquila/o, no dependiente.',
    pregunta: '¿Qué ayuda concreta pido y qué parte hago yo?' },
  { id: 'suenos', cap: '4 · Sueños y señales', ico: '💭', tag: 'suenos señales sincronicidad dreamt penae intuicion presagio',
    texto: '“El sueño es carta: no toda carta es orden.”',
    idea: 'El sueño procesa el día y a veces trae mensaje (visita de quien partió, aviso, consuelo). Las “señales” (hora repetida, pájaro, canción) valen si te ordenan, no si te obsesionan. Anota 1 mes y verás el patrón. Puente con 💭 Sueños.',
    sirve: 'Sueño repetido, duelo con visitas, corazonadas, decisiones.',
    practica: 'Cuaderno junto a la cama: al despertar, 3 líneas (qué vi + qué sentí + qué haré). 1 vez por luna relee y marca 1 joya. No decidas grande por 1 solo sueño.',
    cuidado: 'Pesadillas seguidas + insomnio + miedo diurno = pide apoyo (CESFAM, terapeuta, tu guía). No busques diccionarios mágicos alarmistas en internet de noche.',
    pregunta: '¿Qué me repite mi soñar este mes?' },
  { id: 'proteccion', cap: '5 · Protección y discernimiento', ico: '🛡️', tag: 'proteccion limpieza discernimiento envidia mal de ojo casa pesada limite',
    texto: '“Lo primero que protege es una vida ordenada.”',
    idea: 'Casa en orden, cuerpo descansado, palabra cumplida y límites claros protegen más que cualquier amuleto. Suma: luz (vela/oración), aire (ventilar y sahumar suave con romero/laurel local), agua (baño de descarga con sal gruesa enjuagada) y tierra (orden y basura fuera). Discierne: ¿esto me da paz o me mete miedo y gasto?',
    sirve: 'Casa “pesada”, racha mala, envidia, miedo nocturno, visitas que agotan.',
    practica: 'Limpieza de 20 min: ventila + ordena 1 pieza + luz + oración/frase madre + agua con sal (pies o ducha, enjuaga bien). Anota cómo quedó el pecho. Repite 1 vez por luna, no cada día por miedo.',
    cuidado: 'No hagas “limpias” fuertes (huevo, fuego, cortes, beber cosas) sin guía reconocida, y nunca en niñas/os ni embarazadas. Si hay violencia o amenaza real, protege con red y denuncia, no solo con rito.',
    pregunta: '¿Qué orden chico protege mi casa hoy?' },
  { id: 'lugares', cap: '6 · Lugares con espíritu (territorio)', ico: '📍', tag: 'lugares sagrados territorio humedal playa cerro vertiente ngen energia',
    texto: '“Hay lugares que rezan solos: se entra con permiso.”',
    idea: 'Humedal, desembocadura, bosque nativo, vertiente, cementerio, capilla, rehue: cada uno tiene su genio/Ngen y sus reglas. En Penco: Playa Negra con viento, humedal Rocuant-Andalién con aves, cerros con eucalipto seco (cuidado fuego). Se saluda, se deja limpio y no se grita ni se raya.',
    sirve: 'Paseos, ofrendas, fotos, pedidos al mar, turismo espiritual.',
    practica: 'Visita con regla de 3: saluda y pide permiso + recoge 1 basura + agradece al salir. Sin parlante fuerte, sin fuego, sin rayar. Si llevas ofrenda, solo biodegradable (flor, semilla).',
    cuidado: 'Marea, viento y noche penqueña son reales: no te acerques a roqueríos con ola ni entres a humedal de noche. El respeto también es autocuidado. Con alta marea, solo mirador.',
    pregunta: '¿Qué lugar me llama y con qué regla entro?' },
  { id: 'partida', cap: '7 · La partida y el más allá', ico: '🕊️', tag: 'muerte mas alla partida duelo cielo reencarnacion juicio consuelo',
    texto: '“Cada fe cuenta el cruce distinto; todas piden vivir bien hoy.”',
    idea: 'Mapuche: el püllü viaja y acompaña; cristiana: juicio, cielo y resurrección; budista/andina/africana: ciclos y retorno; laica: legado en los que quedan. No pelees por el mapa: todas coinciden en vivir con amor, perdonar y dejar ordenado (palabra, papeles, abrazos).',
    sirve: 'Miedo a la muerte, enfermedad, vejez, acompañar a quien parte.',
    practica: 'Orden amoroso 1 tarde: carta (“te amo, gracias, te dejo ___”), papeles a mano, abrazo nombrado. Si acompañas: presencia, mano, silencio y su rezo propio. Eso es escatología práctica.',
    cuidado: 'Duelo que no deja vivir meses (no comer/dormir/trabajar, ideas de partir) pide ayuda ya: *4141 24 h Chile, CESFAM, tu guía. Acompañar no es aguantar sola/o.',
    pregunta: '¿Qué quiero dejar ordenado con amor?' }
];
function espMundo(id) { for (var i = 0; i < ESP_MUNDO.length; i++) if (ESP_MUNDO[i].id === id) return ESP_MUNDO[i]; return null; }

/* ============================================================
   DATOS — Elementales de la naturaleza (5 + Ngen)
   Síntesis educativa y respetuosa: tradición europea + kimün
   mapuche. No invoca ni ata nada: honra cuidando.
   ============================================================ */
var ESP_ELEM = [
  { id: 'tierra', cap: 'Tierra · Gnomos y Ngen-mawiza', ico: '🪨', tag: 'tierra gnomo duende mawiza bosque raiz piedra semilla huerta',
    elemento: 'Tierra', seres: 'Gnomos, duendes del bosque · Ngen-mawiza (espíritu del monte)',
    donde: 'En Penco: bosque relicto, huerta, plaza con añoso, cerro. Se nota en raíces, piedras musgosas, hormigas y semillas.',
    honrar: 'Toca tierra descalza 5 min + planta o riega 1 semilla + no arranques de más. Saluda: “permiso, vengo a cuidar”.',
    noHacer: 'No rayes piedras/troncos, no saques tierra ni plantas del bosque, no dejes colillas ni plástico.',
    ofrenda: 'Puñado de semillas nativas o compost casero enterrado. Nada sintético.',
    mini: 'Hoy: 10 min en huerta/plaza + recoge 3 basuras + anota 1 olor de la tierra.',
    pregunta: '¿Qué me pide la tierra de mi casa?' },
  { id: 'agua', cap: 'Agua · Ondinas y Ngen-ko', ico: '💧', tag: 'agua ondina sirena ngenko mar rio humedal lluvia vertiente ko',
    elemento: 'Agua', seres: 'Ondinas, damas del agua · Ngen-ko (espíritu del agua)',
    donde: 'En Penco: Playa Negra, desembocadura, humedal Rocuant-Andalién, vertientes, lluvia del pukem. Se nota en olas, neblina y aves.',
    honrar: 'Mira el agua 3 respiraciones + lleva tu basura + la ajena (1 bolsa) + no orines ni laves con jabón en vertiente/río.',
    noHacer: 'No te metas con marea alta ni de noche, no tires colillas/aceite/toallitas, no uses parlante que espanta aves.',
    ofrenda: 'Flor o pétalo que el agua se lleva (biodegradable). Nunca vidrio, vela ni plástico.',
    mini: 'Hoy: saludo al mar (“mari mari lafken”) + 1 min de silencio mirando olas + 1 basura recogida.',
    pregunta: '¿Qué emoción me lava el agua hoy?' },
  { id: 'aire', cap: 'Aire · Sílfides y Ngen-kürüf', ico: '🌬️', tag: 'aire silfide kürüf viento pajaro pluma nube respiracion',
    elemento: 'Aire', seres: 'Sílfides, guardianes del viento · Ngen-kürüf (espíritu del aire)',
    donde: 'En Penco: el famoso viento costero, gaviotas, chercanes, nubes rápidas. Se nota en respiración, canto y veletas.',
    honrar: 'Respira 4-6 mirando el cielo 1 min + cuelga silencio (apaga 1 ruido) + cuida un ave (agua limpia, no migas con sal).',
    noHacer: 'No quemes basura/plástico (humo enferma), no sueltes globos ni linternas chinas, no grites en nidos.',
    ofrenda: 'Tu aliento consciente + 1 canto/silbo alegre al viento. Sin humo ni fuego.',
    mini: 'Hoy: 3 respiraciones al viento + nombra 3 pájaros que oíste + apaga 1 pantalla 1 hora.',
    pregunta: '¿Qué pensamiento se lleva el viento?' },
  { id: 'fuego', cap: 'Fuego · Salamandras y Ngen-kutral', ico: '🔥', tag: 'fuego salamandra kutral vela sol fogata cocina incendio',
    elemento: 'Fuego', seres: 'Salamandras del fuego · Ngen-kutral (espíritu del fuego)',
    donde: 'En Penco: sol, cocina a leña, vela del altar, fogatas (¡con cuidado!). Se nota en calor, chispa y ceniza.',
    honrar: '1 vela con intención clara (no 10) + cocina compartida + abrigo a quien tiene frío. Fuego para unir, no para mostrar.',
    noHacer: 'Nada de fogatas en cerro/playa con viento ni en verano seco; jamás fuego en humedal o bosque; nunca dejes vela sola ni al alcance de niñas/os.',
    ofrenda: 'Luz cuidada + ceniza fría al compost (poca). Nada de quemar ropa/plástico “para limpiar”.',
    mini: 'Hoy: enciende 1 vela 5 min + di tu intención + apágala agradeciendo. Anota tu calorcito.',
    pregunta: '¿Qué enciendo y qué apago en mi vida?' },
  { id: 'eter', cap: 'Éter · El bosque-mar que une todo', ico: '🌳', tag: 'eter quintaesencia bosque mar espiritu lugar ngen red vida',
    elemento: 'Éter (la red)', seres: 'El Ngen del lugar completo: bosque + mar + gente (ixofij mogen)',
    donde: 'En Penco: el borde donde se abrazan cerro, humedal y mar. Ahí se siente “algo grande” sin ver a nadie.',
    honrar: 'Camina lento 15 min sin audífonos + saluda al llegar y al irte + deja el lugar mejor que como estaba.',
    noHacer: 'No cortes tu “atajo” por duna/humedal (mata nidos), no acampes ni hagas rito ruidoso donde anidan aves.',
    ofrenda: 'Tu presencia atenta + 1 acto de reparación (plantar nativo, limpiar microbasural con guantes).',
    mini: 'Hoy: paseo de 15 min en silencio + 3 fotos mentales (no de celu) + 1 gracias en voz alta.',
    pregunta: '¿Cómo soy parte y no dueña/o?' },
  { id: 'hogar', cap: 'Casa · Tu Ngen doméstico', ico: '🏠', tag: 'casa hogar cocina altar duende domestico orden limpieza umbral',
    elemento: 'Casa (los 4 juntos)', seres: 'El “duende” de la casa: el ánimo que queda cuando hay orden, olor rico y palabra buena',
    donde: 'Tu cocina, tu puerta, tu patio, tu altar chico. Se nota cuando entras y respiras (“qué rica está mi casa”) o cuando pesa.',
    honrar: 'Ventila 10 min + 1 rincón ordenado al día + olor natural (romero/laurel hervido) + palabra amable en la mesa.',
    noHacer: 'No acumules basura ni ropa sucia días, no grites en la mesa, no dejes altar con vela sola o polvo meses.',
    ofrenda: 'Pan compartido + mesa puesta con cariño. La mejor ofrenda doméstica es invitar.',
    mini: 'Hoy: ordena tu velador/altar + ventila + di 1 gracias en voz alta al entrar.',
    pregunta: '¿Qué rincón de mi casa pide amor hoy?' }
];
function espElem(id) { for (var i = 0; i < ESP_ELEM.length; i++) if (ESP_ELEM[i].id === id) return ESP_ELEM[i]; return null; }

/* ============================================================
   DIÁLOGO
   ============================================================ */
function buildDialog() {
  var txGrid = ESP_LUCES.map(function (it) {
    return '<button type="button" class="btn est-tx-card su-1c48e1" data-tx="' + it.id + '">' +
      '<b>' + it.ico + ' ' + esc(it.cap) + '</b><br>' +
      '<span class="muted su-11a508">' + esc(it.tag.split(' ').slice(0, 3).join(' · ')) + '</span></button>';
  }).join('');

  var testHTML = ESP_TEST.map(function (q, i) {
    var opts = ESP_LIKERT.map(function (o) {
      return '<label class="check-row su-a16b97"><input type="radio" name="esp2Q' + i + '" value="' + o.v + '"> ' + o.t + '</label>';
    }).join('');
    return '<div class="menstrual-card su-fdf33f"><b class="su-6cb285">' + (i + 1) + '. ' + esc(q.txt) + '</b>' +
      '<div class="su-8fd176">' + opts + '</div></div>';
  }).join('');

  var practHTML = ESP_PRACTICAS.map(function (p) {
    return '<div class="menstrual-card"><h4>' + p.ico + ' ' + esc(p.n) + '</h4>' +
      '<p class="muted su-11a508">⏱ ' + esc(p.tiempo) + '</p>' +
      '<p class="su-6cb285">' + esc(p.pasos) + '</p>' +
      '<p class="muted su-6cb285">💡 ' + esc(p.tip) + '</p>' +
      '<button type="button" class="btn esp2-pract-add su-30e741" data-p="' + esc(p.n) + '">+ Anotar en mi diario de hoy</button></div>';
  }).join('');

  var cosmoGrid = ESP_COSMO.map(function (it) {
    return '<button type="button" class="btn est-tx-card su-1c48e1" data-cosmo="' + it.id + '">' +
      '<b>' + it.ico + ' ' + esc(it.cap) + '</b><br>' +
      '<span class="muted su-11a508">' + esc(it.tag.split(' ').slice(0, 3).join(' · ')) + '</span></button>';
  }).join('');

  var mundoGrid = ESP_MUNDO.map(function (it) {
    return '<button type="button" class="btn est-tx-card su-1c48e1" data-mundo="' + it.id + '">' +
      '<b>' + it.ico + ' ' + esc(it.cap) + '</b><br>' +
      '<span class="muted su-11a508">' + esc(it.tag.split(' ').slice(0, 3).join(' · ')) + '</span></button>';
  }).join('');

  var elemGrid = ESP_ELEM.map(function (it) {
    return '<button type="button" class="btn est-tx-card su-1c48e1" data-elem="' + it.id + '">' +
      '<b>' + it.ico + ' ' + esc(it.cap) + '</b><br>' +
      '<span class="muted su-11a508">' + esc(it.elemento) + ' · ' + esc(it.tag.split(' ').slice(0, 2).join(' · ')) + '</span></button>';
  }).join('');

  var body =
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabEspGuia" class="btn btn-accent su-30e741">📖 Guía</button>' +
    '<button type="button" id="tabEspLuces" class="btn su-30e741">✨ 12 Luces</button>' +
    '<button type="button" id="tabEspPract" class="btn su-30e741">🛠️ Prácticas</button>' +
    '<button type="button" id="tabEspCosmo" class="btn su-30e741">🌍 Cosmovisiones</button>' +
    '<button type="button" id="tabEspMundo" class="btn su-30e741">🌌 Mundo espiritual</button>' +
    '<button type="button" id="tabEspElem" class="btn su-30e741">🌿 Elementales</button>' +
    '<button type="button" id="tabEspTest" class="btn su-30e741">📝 Test del espíritu</button>' +
    '<button type="button" id="tabEspCamino" class="btn su-30e741">🌱 Mi Camino</button></div>' +

    '<div id="espGuia">' +
    '<div class="menstrual-card su-68a1a9"><h4>✨ ¿Qué es el espíritu?</h4>' +
    '<p class="muted su-616df7">No es una religión: es tu <b>dimensión más honda</b>. El cuerpo se cansa, la mente piensa, el <b>espíritu da sentido</b>: por qué te levantas, qué amas, qué te sostiene cuando todo falla. Puedes tener fe mapuche, cristiana, otra o la tuya propia: esta sección es <b>laica y respetuosa</b>, suma sin imponer.</p>' +
    '<p class="muted su-616df7">Imagen simple: <b>cuerpo 🚶 + mente 🧠 + espíritu ✨</b>. Si solo cuidas cuerpo y mente, igual falta algo: el centro. Si hoy enciendes 1 vela, agradeces 3 y sirves 10 minutos, ya cuidaste tu espíritu.</p></div>' +
    '<div class="fishing-grid su-d2c171">' +
    '<div class="menstrual-card"><h4>🗺️ Los 7 pilares</h4>' +
    '<p class="muted su-6cb285"><b>🧘 Silencio:</b> parar para oírte. <b>🙏 Gratitud:</b> ver lo que sostiene. <b>💧 Perdón:</b> soltar la piedra. <b>🤲 Servicio:</b> darte con medida. <b>🌊 Naturaleza:</b> ser parte. <b>✨ Trascendencia:</b> confiar en lo grande. <b>🕯️ Rito:</b> repetir con amor. El test te dice tu pilar fuerte y el que pide riego.</p></div>' +
    '<div class="menstrual-card"><h4>🔥 Señales de tu espíritu</h4>' +
    '<p class="muted su-6cb285"><b>Encendido:</b> calma aunque haya tormenta, gratitud fácil, ganas de servir, sueño tranquilo, perdón posible.<br><b>Apagado:</b> vacío, queja todo el día, insomnio de vueltas, explosiones, “¿para qué todo esto?”. Ninguna es condena: es brújula. Si estás apagada/o, parte por 1 luz y 1 práctica chica.</p></div></div>' +
    '<details class="menstrual-details"><summary>🚶 ¿Cómo practicar sin templo ni maestro? (rutina mínima)</summary>' +
    '<p class="muted su-6cb285"><b>Mañana (3 min):</b> 1 frase madre + intención del día (“hoy agradezco ___, suelto ___”). <b>Día:</b> 1 presencia de 1 min + 1 servicio o amor concreto. <b>Noche (3 min):</b> 3 gratitudes + examen de 1 línea (“mi espíritu hoy estuvo ___”). <b>Por luna:</b> 1 luz madre + 1 vigilia lunar + releer diario. 10 min diarios bastan.</p></details>' +
    '<details class="menstrual-details"><summary>🤝 Respeto de creencias (léeme)</summary>' +
    '<p class="muted su-6cb285">Aquí caben <b>kimün mapuche, fe cristiana, otras fes y búsqueda propia</b>: nadie te dirá qué creer. Si vas a nguillatun, misa o culto, esta sección lo sostiene entre semana, no lo reemplaza. No se burla ni se impone: se comparte. Si algo choca con tu fe, quédate con lo que te sirva y suelta el resto en paz.</p></details>' +
    '<details class="menstrual-details"><summary>⚠️ Cuidados (léeme)</summary>' +
    '<p class="muted su-6cb285">✅ Esto es <b>formación laica</b>, no religión ni terapia. ✅ No reemplaza médico, psicólogo ni machi/pastor/cura: con pena honda, ansiedad fuerte, duelo que desborda o ideas de daño, pide apoyo (CESFAM, *4141 en Chile 24 h, tu red, tu guía espiritual). ✅ Con ayuno o vigilia nocturna: cuida cuerpo (embarazo, lactancia, diabetes, remedios, turno noche). Si un ejercicio te remueve mucho, detente, camina, toma agua y conversa.</p></details>' +
    '<div class="menstrual-card su-d2c171"><h4>🌙 Espíritu × 13 lunas (Penco)</h4><div id="espLunasBox"></div>' +
    '<p class="muted su-e13d76">Puentes dentro de la app: 🕉️ <b>Prácticas</b> (sol, agua, tierra) · 📓 <b>Gratitud</b> (racha) · 🌬️ <b>Respiración</b> (volver al ahora) · 🕊️ <b>Duelo</b> (honrar) · 🔁 <b>Recapitulación</b> (soltar).</p></div>' +
    '</div>' +

    '<div id="espLuces" class="hidden">' +
    '<div class="conv-row"><label class="su-4b3de7">Buscar <input type="text" id="esp2Q" placeholder="ej: silencio, perdón, rito, duelo, amor, soltar..." maxlength="40"></label></div>' +
    '<div id="esp2TxGrid" class="su-1e9d45">' + txGrid + '</div>' +
    '<div id="esp2Detalle" class="menstrual-card su-51d56a"><p class="muted">Toca una luz para ver su ficha completa 👆</p></div></div>' +

    '<div id="espPract" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>🧘 Silencio de 5 minutos</h4>' +
    '<p class="muted su-6cb285">Cuando todo quema: siéntate, pies en tierra, respira 4-6. El botón te marca el tiempo con fases.</p>' +
    '<div class="su-58703f"><button type="button" id="esp2SilencioBtn" class="btn btn-accent su-30e741">▶ Silencio ahora (5 min)</button>' +
    '<span id="esp2SilencioMsg" class="muted su-6cb285"></span></div>' +
    '<div class="conv-row su-8a77e5"><label>Hoy mi intención… <input type="text" id="esp2Intencion" placeholder="ej: estar calma con mis hijos" maxlength="140"></label></div>' +
    '<div class="conv-row"><label>Hoy suelto… <input type="text" id="esp2Suelto" placeholder="ej: la pelea de ayer" maxlength="140"></label>' +
    '<label>Hoy agradezco… <input type="text" id="esp2Agradezco" placeholder="ej: el pan, la lluvia, mi mamá" maxlength="140"></label></div>' +
    '<div class="dlg-actions su-41efc8"><button type="button" id="esp2PractSave" class="btn btn-accent su-30e741">💾 Guardar día del espíritu</button>' +
    '<button type="button" id="esp2GoRespira" class="btn su-30e741">🌬️ Ir a Respiración</button></div></div>' +
    practHTML +
    '<div class="menstrual-card su-d2c171"><h4>🔗 Conecta tu espíritu</h4>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="esp2GoPracticas" class="btn su-30e741">🕉️ Prácticas (sol y tierra)</button>' +
    '<button type="button" id="esp2GoGratitud" class="btn su-30e741">📓 Gratitud</button>' +
    '<button type="button" id="esp2GoDuelo" class="btn su-30e741">🕊️ Duelo</button></div></div></div>' +

    '<div id="espCosmo" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>🌍 El espíritu según 8 cosmovisiones</h4>' +
    '<p class="muted su-6cb285">Ninguna fe es dueña del espíritu: cada pueblo lo nombra a su modo. Aquí se <b>describe para comprender</b>, no para mezclar ritos cerrados. Vive tu raíz madre y estudia las demás con respeto. Toca una ficha 👇, márcala ☆ si te sostiene y llévala a tu diario.</p>' +
    '<details class="menstrual-details"><summary>🤝 Regla de respeto (léeme antes)</summary>' +
    '<p class="muted su-6cb285">1) Tu fe manda: si algo choca con tu iglesia, tu kimün o tu conciencia, suéltalo en paz. 2) Los ritos cerrados (nguillatun, sacramentos, iniciaciones, tambor sagrado, plantas de poder) <b>no se improvisan</b>: solo con sus dueños y por invitación. 3) No uses símbolos ajenos como disfraz o decoración. 4) Cita la fuente cuando compartas (“aprendí que en la cosmovisión ___ …”).</p></details></div>' +
    '<div class="conv-row"><label class="su-4b3de7">Buscar <input type="text" id="esp2QCosmo" placeholder="ej: mapuche, pachamama, oración, karma, ancestro..." maxlength="40"></label></div>' +
    '<div id="esp2CosmoGrid" class="su-1e9d45">' + cosmoGrid + '</div>' +
    '<div id="esp2CosmoDetalle" class="menstrual-card su-51d56a"><p class="muted">Toca una cosmovisión para ver su ficha completa 👆</p></div>' +
    '<div class="menstrual-card su-d2c171"><h4>☆ Mis cosmovisiones que me sostienen</h4><div id="esp2CosmoFavs"></div></div></div>' +

    '<div id="espMundo" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>🌌 El mundo espiritual: 7 puertas</h4>' +
    '<p class="muted su-6cb285">Lo invisible sostiene lo visible como la raíz al árbol: ancestros, guías, sueños, señales, lugares con fuerza y la partida. Se entra <b>lento, de día y acompañada/o</b>: 1 puerta por día, anotando qué da paz y qué da miedo. No es juego ni atajo: es estudio con discernimiento.</p>' +
    '<details class="menstrual-details"><summary>🛡️ Discernimiento y cuidados (léeme)</summary>' +
    '<p class="muted su-6cb285">✅ Guía sana = más paz, más libertad, más orden; te invita a cuidar cuerpo, casa y vínculos. 🚩 Alerta = miedo, apuro (“hazlo hoy o te pasa algo”), cobros altos, secreto (“no le cuentes a tu familia”), voz que manda daño o aislamiento. Ante eso: corta, ventila, camina, conversa y pide ayuda (tu guía, CESFAM, *4141 24 h Chile). Con niñas/os, embarazo o duelo fresco: solo oración, memoria amorosa y orden de casa; nada de invocaciones.</p></details></div>' +
    '<div class="conv-row"><label class="su-4b3de7">Buscar <input type="text" id="esp2QMundo" placeholder="ej: ancestro, ángel, sueño, protección, territorio..." maxlength="40"></label></div>' +
    '<div id="esp2MundoGrid" class="su-1e9d45">' + mundoGrid + '</div>' +
    '<div id="esp2MundoDetalle" class="menstrual-card su-51d56a"><p class="muted">Toca una puerta para abrirla 👆</p></div></div>' +

    '<div id="espElem" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>🌿🔥💧🌬️ Elementales: los cuidadores de la naturaleza</h4>' +
    '<p class="muted su-6cb285">Cada elemento tiene sus cuidadores: la tradición europea los llama <b>gnomos (tierra), ondinas (agua), sílfides (aire), salamandras (fuego)</b>; el kimün mapuche los reconoce como <b>Ngen</b> (espíritu dueño/cuidador de cada lugar: Ngen-ko del agua, Ngen-mawiza del monte, Ngen-kürüf del aire, Ngen-kutral del fuego). No se mandan ni se atan: <b>se honran cuidando</b>.</p>' +
    '<details class="menstrual-details"><summary>🤝 Cómo tratar con elementales (regla de oro)</summary>' +
    '<p class="muted su-6cb285">1) <b>Saluda y pide permiso</b> (“mari mari, permiso”) al entrar a playa, humedal, bosque o cerro. 2) <b>Deja mejor</b>: recoge al menos 1 basura ajena. 3) <b>Ofrenda solo biodegradable</b> (flor, semilla, agua limpia): nunca vidrio, vela, plástico ni comida con sal. 4) <b>No invoques ni prometas</b> nada a cambio de favores: agradece y cumple tu parte (regar, plantar, limpiar). 5) Con viento, marea alta o fuego: <b>solo mirador</b>, sin acercarte.</p></details>' +
    '<details class="menstrual-details"><summary>⚠️ Fuego y agua en Penco (léeme)</summary>' +
    '<p class="muted su-6cb285">Eucalipto + viento = incendio rápido: jamás fogata en cerro, playa con viento ni humedal/bosque en estación seca. Vela siempre vigilada y lejos de niñas/os y cortinas. En el mar: no te acerques a roqueríos con ola ni entres al agua de noche o con marejada.</p></details></div>' +
    '<div id="esp2ElemGrid" class="su-1e9d45">' + elemGrid + '</div>' +
    '<div id="esp2ElemDetalle" class="menstrual-card su-51d56a"><p class="muted">Toca un elemental para ver cómo honrarlo 👆</p></div>' +
    '<div class="menstrual-card su-68a1a9"><h4>📓 Mi bitácora de encuentros (cuidar cuenta)</h4>' +
    '<div class="conv-row"><label>Elemento <select id="esp2ElemSel"><option value="Tierra 🪨">Tierra 🪨</option><option value="Agua 💧">Agua 💧</option><option value="Aire 🌬️">Aire 🌬️</option><option value="Fuego 🔥">Fuego 🔥</option><option value="Éter 🌳">Éter 🌳</option><option value="Casa 🏠">Casa 🏠</option></select></label><label>Lugar <input type="text" id="esp2ElemLugar" placeholder="ej: humedal, Playa Negra, mi huerta" maxlength="60"></label></div>' +
    '<label>Gesto de cuidado que hice <input type="text" id="esp2ElemGesto" placeholder="ej: recogí 1 bolsa, regué nativo, apagué vela agradeciendo" maxlength="140"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="esp2ElemAdd" class="btn btn-accent su-30e741">+ Guardar encuentro</button></div>' +
    '<div id="esp2ElemLog" class="habits-list su-ebf445"></div></div></div>' +

    '<div id="espTest" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>📝 Test: tus 4 pilares (20 afirmaciones)</h4>' +
    '<p class="muted su-6cb285">Responde según <b>cómo eres casi siempre</b>. Escala: Nunca (0) · A veces (1) · A menudo (2) · Muy cierto (3). ~5 minutos. Mide <b>Paz 🧘 · Sentido ✨ · Conexión 🤲 · Gratitud 🙏</b> + tu <b>nivel de ruido 🌪️</b> (F). <b>No es diagnóstico</b>: es un espejo para regar.</p>' +
    '<div class="su-3de8f9"><button type="button" id="esp2TestReset" class="btn su-30e741">↺ Limpiar</button>' +
    '<button type="button" id="esp2TestCalc" class="btn btn-accent su-30e741">📊 Ver mi resultado</button></div>' +
    '<div id="esp2Progreso" class="muted su-e13d76"></div></div>' +
    '<div id="esp2TestBox" class="su-d2c171">' + testHTML + '</div>' +
    '<div id="esp2Resultado" class="menstrual-card hidden su-51d56a"></div></div>' +

    '<div id="espCamino" class="hidden">' +
    '<div class="menstrual-grid"><div class="menstrual-card su-68a1a9"><h4>🌱 Mi pilar a regar</h4>' +
    '<div class="conv-row"><label>Mi pilar <select id="esp2MiPilar"><option value="">— sin definir —</option><option value="Z">🧘 Paz · silencio interior</option><option value="S">✨ Sentido · para qué vivo</option><option value="C">🤲 Conexión · amor y servicio</option><option value="G">🙏 Gratitud · perdón que libera</option></select></label></div>' +
    '<div id="esp2MiPilarBox" class="su-fe7b49"></div></div>' +
    '<div class="menstrual-card"><h4>📓 Diario del espíritu</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="esp2DiaFecha"></label></div>' +
    '<label>Hoy en mi camino… (agradezco / suelto / sirvo) <input type="text" id="esp2DiaTxt" placeholder="ej: agradezco el sol; suelto el apuro; serví a mi vecina" maxlength="140"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="esp2DiaAdd" class="btn btn-accent su-30e741">+ Guardar hoy</button></div>' +
    '<div id="esp2DiaList" class="habits-list su-ebf445"></div></div></div>' +
    '<div class="menstrual-card su-d2c171"><h4>✨ Mis días del espíritu (racha del alma)</h4><div id="esp2PractsBox"></div></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🕘 Historial de tests</h4><div id="esp2HistBox"></div></div>' +
    '<div class="dlg-actions su-a1935c">' +
    '<span id="esp2Stats" class="muted su-11a508"></span>' +
    '<span class="su-3de8f9"><button type="button" id="esp2Share" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="esp2ToNote" class="btn su-30e741">📝 Llevar a nota de hoy</button>' +
    '<button type="button" id="esp2Clear" class="btn su-214f75">🗑 Borrar todo</button></span></div></div>';

  makeDialog('espirituDialog', '✨ Espíritu',
    'Tu centro que ordena cuerpo y mente: 12 luces, 10 prácticas, 8 cosmovisiones, 7 puertas del mundo espiritual y 6 elementales. Laico, respetuoso y offline. Todo <b>privado y local</b>.',
    body);
}

function renderLunasBox() {
  var box = $('espLunasBox'); if (!box) return;
  box.innerHTML = ESP_LUNAS.map(function (t) {
    return '<div class="si-card"><p>' + esc(t) + '</p></div>';
  }).join('');
}

function renderDetalle(id) {
  var box = $('esp2Detalle'); if (!box) return;
  var t = espLuz(id); if (!t) return;
  var e = store();
  var fav = e.favs.indexOf(id) >= 0;
  box.innerHTML =
    '<h4 class="su-e39eba">' + t.ico + ' ' + esc(t.cap) + '</h4>' +
    '<blockquote class="dlg-quote su-6cb285">' + esc(t.texto) + '</blockquote>' +
    '<p class="su-616df7">' + esc(t.idea) + '</p>' +
    '<p class="su-6cb285">🧰 <b>¿Cuándo sirve?</b> ' + esc(t.sirve) + '</p>' +
    '<div class="si-card"><h4>✏️ Práctica de hoy</h4><p>' + esc(t.practica) + '</p><p class="muted">Pregunta que despierta: <i>' + esc(t.pregunta) + '</i></p></div>' +
    '<p class="muted su-6cb285">⚠️ Trampa típica: ' + esc(t.trampa) + '</p>' +
    '<div class="su-67b198">' +
    '<button type="button" class="btn su-30e741" id="esp2FavBtn">' + (fav ? '★ Quitar de favoritas' : '☆ Marcar favorita') + '</button>' +
    '<button type="button" class="btn btn-accent su-30e741" id="esp2HoyBtn">✓ Vivir esta hoy</button></div>';
  var fb = $('esp2FavBtn');
  if (fb) fb.onclick = function () {
    var d = store();
    var i = d.favs.indexOf(id);
    if (i >= 0) d.favs.splice(i, 1); else d.favs.push(id);
    save(); renderDetalle(id);
  };
  var hb = $('esp2HoyBtn');
  if (hb) hb.onclick = function () {
    var k = todayKey();
    var d = store();
    d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '✨ Hoy vivo: ' + t.cap + ' — ' + t.pregunta;
    save('Luz llevada a tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
  };
}

function filterLuces() {
  var q = (($('esp2Q') || {}).value || '').toLowerCase();
  var cards = document.querySelectorAll('#esp2TxGrid .est-tx-card');
  cards.forEach(function (card) {
    var t = espLuz(card.dataset.tx);
    if (!t) return;
    var hay = ((t.cap + ' ' + t.tag + ' ' + t.idea + ' ' + t.texto).toLowerCase().indexOf(q) >= 0);
    card.style.display = hay ? '' : 'none';
  });
}

function renderCosmoDetalle(id) {
  var box = $('esp2CosmoDetalle'); if (!box) return;
  var t = espCosmo(id); if (!t) return;
  var e = store();
  var fav = e.cosmoFavs.indexOf(id) >= 0;
  box.innerHTML =
    '<h4 class="su-e39eba">' + t.ico + ' ' + esc(t.cap) + '</h4>' +
    '<blockquote class="dlg-quote su-6cb285">' + esc(t.texto) + '</blockquote>' +
    '<p class="su-616df7">' + esc(t.idea) + '</p>' +
    '<p class="su-6cb285">💠 <b>Su corazón:</b> ' + esc(t.cree) + '</p>' +
    '<div class="si-card"><h4>✏️ Práctica abierta de hoy</h4><p>' + esc(t.practica) + '</p><p class="muted">Pregunta que despierta: <i>' + esc(t.pregunta) + '</i></p></div>' +
    '<p class="muted su-6cb285">🤝 Respeto: ' + esc(t.respeto) + '</p>' +
    '<div class="su-67b198">' +
    '<button type="button" class="btn su-30e741" id="esp2CosmoFavBtn">' + (fav ? '★ Quitar de las que me sostienen' : '☆ Me sostiene: marcar') + '</button>' +
    '<button type="button" class="btn btn-accent su-30e741" id="esp2CosmoHoyBtn">✓ Llevar a mi diario</button></div>';
  var fb = $('esp2CosmoFavBtn');
  if (fb) fb.onclick = function () {
    var d = store();
    var i = d.cosmoFavs.indexOf(id);
    if (i >= 0) d.cosmoFavs.splice(i, 1); else d.cosmoFavs.push(id);
    save(); renderCosmoDetalle(id); renderCosmoFavs(); renderStats();
  };
  var hb = $('esp2CosmoHoyBtn');
  if (hb) hb.onclick = function () {
    var k = todayKey();
    var d = store();
    d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🌍 Cosmovisión: ' + t.cap + ' — ' + t.pregunta;
    save('Cosmovisión llevada a tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
  };
}
function filterCosmo() {
  var q = (($('esp2QCosmo') || {}).value || '').toLowerCase();
  var cards = document.querySelectorAll('#esp2CosmoGrid .est-tx-card');
  cards.forEach(function (card) {
    var t = espCosmo(card.dataset.cosmo);
    if (!t) return;
    var hay = ((t.cap + ' ' + t.tag + ' ' + t.idea + ' ' + t.texto).toLowerCase().indexOf(q) >= 0);
    card.style.display = hay ? '' : 'none';
  });
}
function renderCosmoFavs() {
  var box = $('esp2CosmoFavs'); if (!box) return;
  var favs = store().cosmoFavs || [];
  if (!favs.length) { box.innerHTML = '<p class="muted su-e201a8">Sin marcar. Elige 1–2 raíces madre: son tu casa; lo demás se visita con respeto.</p>'; return; }
  box.innerHTML = favs.map(function (id) {
    var t = espCosmo(id); if (!t) return '';
    return '<div class="hora-item su-0486f7"><span class="su-11a508"><b>' + t.ico + ' ' + esc(t.cap) + '</b><br>' + esc(t.texto) + '</span>' +
      '<button type="button" class="btn btn-icon esp2-cosmo-del" data-id="' + id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.esp2-cosmo-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.cosmoFavs = e.cosmoFavs.filter(function (v) { return v !== x.dataset.id; }); save(); renderCosmoFavs(); renderStats(); };
  });
}

function renderMundoDetalle(id) {
  var box = $('esp2MundoDetalle'); if (!box) return;
  var t = espMundo(id); if (!t) return;
  box.innerHTML =
    '<h4 class="su-e39eba">' + t.ico + ' ' + esc(t.cap) + '</h4>' +
    '<blockquote class="dlg-quote su-6cb285">' + esc(t.texto) + '</blockquote>' +
    '<p class="su-616df7">' + esc(t.idea) + '</p>' +
    '<p class="su-6cb285">🧰 <b>¿Cuándo sirve?</b> ' + esc(t.sirve) + '</p>' +
    '<div class="si-card"><h4>✏️ Práctica de hoy</h4><p>' + esc(t.practica) + '</p><p class="muted">Pregunta que despierta: <i>' + esc(t.pregunta) + '</i></p></div>' +
    '<p class="muted su-6cb285">🛡️ Cuidado: ' + esc(t.cuidado) + '</p>' +
    '<div class="su-67b198">' +
    '<button type="button" class="btn btn-accent su-30e741" id="esp2MundoHoyBtn">✓ Llevar a mi diario</button></div>';
  var hb = $('esp2MundoHoyBtn');
  if (hb) hb.onclick = function () {
    var k = todayKey();
    var d = store();
    d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🌌 Puerta: ' + t.cap + ' — ' + t.pregunta;
    save('Puerta llevada a tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
  };
}
function filterMundo() {
  var q = (($('esp2QMundo') || {}).value || '').toLowerCase();
  var cards = document.querySelectorAll('#esp2MundoGrid .est-tx-card');
  cards.forEach(function (card) {
    var t = espMundo(card.dataset.mundo);
    if (!t) return;
    var hay = ((t.cap + ' ' + t.tag + ' ' + t.idea + ' ' + t.texto).toLowerCase().indexOf(q) >= 0);
    card.style.display = hay ? '' : 'none';
  });
}

function renderElemDetalle(id) {
  var box = $('esp2ElemDetalle'); if (!box) return;
  var t = espElem(id); if (!t) return;
  box.innerHTML =
    '<h4 class="su-e39eba">' + t.ico + ' ' + esc(t.cap) + '</h4>' +
    '<p class="su-616df7">✨ <b>Seres:</b> ' + esc(t.seres) + '</p>' +
    '<p class="su-6cb285">📍 <b>En Penco:</b> ' + esc(t.donde) + '</p>' +
    '<div class="si-card"><h4>🤲 Cómo honrar (cuidando)</h4><p>' + esc(t.honrar) + '</p>' +
    '<p><b>Mini hoy:</b> ' + esc(t.mini) + '</p><p class="muted">Pregunta: <i>' + esc(t.pregunta) + '</i></p></div>' +
    '<p class="muted su-6cb285">🚫 No hacer: ' + esc(t.noHacer) + '</p>' +
    '<p class="su-6cb285">🎁 Ofrenda que sí: ' + esc(t.ofrenda) + '</p>' +
    '<div class="su-67b198">' +
    '<button type="button" class="btn btn-accent su-30e741" id="esp2ElemHoyBtn">✓ Anotar encuentro con este elemento</button></div>';
  var hb = $('esp2ElemHoyBtn');
  if (hb) hb.onclick = function () {
    var sel = $('esp2ElemSel');
    var mapSel = { tierra: 'Tierra 🪨', agua: 'Agua 💧', aire: 'Aire 🌬️', fuego: 'Fuego 🔥', eter: 'Éter 🌳', hogar: 'Casa 🏠' };
    if (sel && mapSel[t.id]) sel.value = mapSel[t.id];
    var g = $('esp2ElemGesto');
    if (g) { g.value = t.mini.slice(0, 140); try { g.focus(); } catch (e) {} }
    try { $('esp2ElemGesto').scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e2) {}
  };
}
function renderElemLog() {
  var box = $('esp2ElemLog'); if (!box) return;
  var d = (store().elemLog || []).slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 30);
  if (!d.length) { box.innerHTML = '<p class="muted su-e201a8">Sin encuentros. Guarda tu primero: elemento + lugar + gesto de cuidado 🌿.</p>'; return; }
  var porEl = {};
  (store().elemLog || []).forEach(function (r) { porEl[r.elem] = (porEl[r.elem] || 0) + 1; });
  var resumen = Object.keys(porEl).map(function (k) { return k + ' ×' + porEl[k]; }).join(' · ');
  box.innerHTML = '<p class="muted su-11a508">' + (store().elemLog || []).length + ' encuentro(s) · ' + esc(resumen) + '</p>' + d.map(function (r) {
    return '<div class="hora-item su-0486f7"><span class="su-11a508"><b>' + esc(r.fecha) + '</b> · ' + esc(r.elem) + '<br>📍 ' + esc(r.lugar || '—') + '<br>🤲 ' + esc(r.gesto || '') + '</span>' +
      '<button type="button" class="btn btn-icon esp2-elem-del" data-id="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.esp2-elem-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.elemLog = e.elemLog.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderElemLog(); renderStats(); };
  });
}

function calcTest() {
  var sc = { Z: 0, S: 0, C: 0, G: 0, F: 0 };
  var contestadas = 0;
  for (var i = 0; i < ESP_TEST.length; i++) {
    var sel = document.querySelector('input[name="esp2Q' + i + '"]:checked');
    if (sel) { contestadas++; sc[ESP_TEST[i].c] += +sel.value; }
  }
  return { sc: sc, contestadas: contestadas };
}
function updateProgreso() {
  var r = calcTest();
  var box = $('esp2Progreso');
  if (box) box.textContent = r.contestadas + ' / ' + ESP_TEST.length + ' respondidas' + (r.contestadas < ESP_TEST.length ? ' — responde todas para un espejo fiel' : ' ✓ listo para calcular');
}
function showResultado(sc) {
  var box = $('esp2Resultado'); if (!box) return;
  var arr = [{ k: 'Z', p: sc.Z }, { k: 'S', p: sc.S }, { k: 'C', p: sc.C }, { k: 'G', p: sc.G }];
  arr.sort(function (a, b) { return b.p - a.p; });
  var max = 12;
  var dom = arr[0].k;
  var ruido = sc.F;
  var ruidoTxt = ruido <= 3 ? 'Sereno: poco ruido. Sostén con silencio y rito diario.' : ruido <= 6 ? 'Medio: ruido frecuente. Riega con 5 min de silencio + 3 gratitudes cada día.' : 'Alto: mucho ruido y vacío. Parte por 1 silencio + 1 gratitud + 1 servicio chico, sin exigirte todo.';
  box.classList.remove('hidden');
  var icoMap = { Z: '🧘', S: '✨', C: '🤲', G: '🙏' };
  var nomMap = { Z: 'Paz', S: 'Sentido', C: 'Conexión', G: 'Gratitud' };
  box.innerHTML = '<h4>📊 Tu espejo (sin guardar)</h4>' +
    '<p class="muted su-11a508">Máximo por pilar: 12 (4 preguntas × 3). Ruido (F): máximo 12 — mientras más alto, más te tapa el alma.</p>' +
    arr.map(function (a) {
      var pct = Math.round(a.p / max * 100);
      var isTop = dom === a.k;
      return '<div class="su-0d84b3">' +
        '<span class="su-b53707"><b>' + icoMap[a.k] + ' ' + esc(nomMap[a.k]) + '</b></span>' +
        '<span class="su-2982dd">' +
        '<span class="esp2-bar" data-w="' + pct + '" data-top="' + (isTop ? '1' : '0') + '"></span></span>' +
        '<b class="su-803c87">' + a.p + '</b></div>';
    }).join('') +
    '<div class="si-card su-8a77e5"><h4>' + ESP_PILARES[dom].ico + ' Tu pilar fuerte: ' + esc(ESP_PILARES[dom].nombre) + '</h4>' +
    '<p>' + esc(ESP_PILARES[dom].desc) + '</p><p><b>Riega así:</b> ' + esc(ESP_PILARES[dom].entrena) + '</p>' +
    '<p class="muted">🌪️ Nivel de ruido: <b>' + ruido + '/12</b> — ' + esc(ruidoTxt) + '</p></div>' +
    '<div class="su-ac5453"><button type="button" class="btn btn-accent su-30e741" id="esp2SaveTest">💾 Guardar este test</button>' +
    '<button type="button" class="btn su-30e741" id="esp2SetPilar">✓ Mi pilar: ' + esc(ESP_PILARES[dom].nombre) + '</button>' +
    '<button type="button" class="btn su-30e741" id="esp2ReadTx">📖 Leer luz que me sirve</button></div>';
  box.querySelectorAll('.esp2-bar').forEach(function (bar) {
    try {
      var w = +bar.getAttribute('data-w') || 0;
      var top = bar.getAttribute('data-top') === '1';
      bar.style.display = 'block'; bar.style.height = '100%'; bar.style.width = w + '%';
      bar.style.background = top ? 'var(--gold)' : 'var(--accent)';
      bar.style.opacity = top ? '1' : '.55';
    } catch (e) {}
  });
  var sv = $('esp2SaveTest');
  if (sv) sv.onclick = function () {
    var d = store();
    d.tests.push({ id: uid('t'), fecha: todayKey(), Z: sc.Z, S: sc.S, C: sc.C, G: sc.G, F: sc.F, dom: dom });
    save('Test guardado ✓'); renderHist(); renderStats();
  };
  var st = $('esp2SetPilar');
  if (st) st.onclick = function () {
    var d = store(); d.miPilar = dom; save('Tu pilar guardado ✓');
    syncMiPilar(); renderMiPilarBox(); renderStats(); switchTab('Camino');
  };
  var ri = $('esp2ReadTx');
  if (ri) ri.onclick = function () {
    var map = { Z: 'silencio', S: 'trascendencia', C: 'servicio', G: 'gratitud' };
    if (ruido >= 7) map[dom] = 'silencio';
    switchTab('Luces'); renderDetalle(map[dom] || 'silencio');
  };
  try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}

function syncMiPilar() {
  var sel = $('esp2MiPilar'); if (!sel) return;
  sel.value = store().miPilar || '';
}
function renderMiPilarBox() {
  var box = $('esp2MiPilarBox'); if (!box) return;
  var k = store().miPilar || '';
  if (!k || !ESP_PILARES[k]) { box.innerHTML = '<p class="muted su-6cb285">Aún sin definir. Haz el test 📝 o elígela arriba: es tu punto de partida, no tu jaula.</p>'; return; }
  var c = ESP_PILARES[k];
  box.innerHTML = '<div class="chip su-d7c8b3"><b>' + c.ico + ' ' + esc(c.nombre) + '</b><br>' +
    '<span class="muted">' + esc(c.desc) + '<br><b>Riega:</b> ' + esc(c.entrena) + '</span></div>';
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
  var box = $('esp2PractsBox'); if (!box) return;
  var d = store().practs || [];
  var ult7 = d.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 7);
  box.innerHTML = '<p class="muted su-11a508">✨ Racha: <b>' + rachaPracts() + ' días</b> · ' + d.length + ' día(s) del espíritu · intención → suelto → agradezco.</p>' +
    (ult7.length ? ult7.map(function (r) {
      return '<div class="hora-item su-0486f7"><span class="su-11a508"><b>' + esc(r.fecha) + '</b><br>' +
        (r.intencion ? '✨ ' + esc(r.intencion) + '<br>' : '') + (r.suelto ? '🌙 ' + esc(r.suelto) + '<br>' : '') + (r.agradece ? '🙏 ' + esc(r.agradece) : '') + '</span>' +
        '<button type="button" class="btn btn-icon esp2-pract-del" data-id="' + r.id + '">✕</button></div>';
    }).join('') : '<p class="muted su-e201a8">Sin días aún. Guarda tu primer día del espíritu arriba ✨.</p>');
  box.querySelectorAll('.esp2-pract-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.practs = e.practs.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderPracts(); renderStats(); };
  });
}
function renderDiario() {
  var box = $('esp2DiaList'); if (!box) return;
  var d = store().diario || {};
  var keys = Object.keys(d).sort().reverse().slice(0, 30);
  if (!keys.length) { box.innerHTML = '<p class="muted su-e201a8">Sin registros. 3 semillas bastan: agradezco + suelto + sirvo.</p>'; return; }
  box.innerHTML = keys.map(function (k) {
    return '<div class="hora-item su-0486f7"><span class="su-11a508"><b>' + esc(k) + '</b><br>' + esc(d[k]) + '</span>' +
      '<button type="button" class="btn btn-icon esp2-dia-del" data-k="' + esc(k) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.esp2-dia-del').forEach(function (x) {
    x.onclick = function () { var e = store(); delete e.diario[x.dataset.k]; save(); renderDiario(); renderStats(); };
  });
}
function renderHist() {
  var box = $('esp2HistBox'); if (!box) return;
  var t = (store().tests || []).slice().reverse().slice(0, 10);
  if (!t.length) { box.innerHTML = '<p class="muted su-11a508">Sin tests guardados. Responde y pulsa “💾 Guardar este test”.</p>'; return; }
  box.innerHTML = t.map(function (r) {
    return '<div class="hora-item"><span class="su-11a508"><b>' + esc(r.fecha) + '</b> · 🧘' + r.Z + ' ✨' + r.S + ' 🤲' + r.C + ' 🙏' + r.G + ' · fuerte <b>' + esc(r.dom || '') + '</b> · ruido ' + esc(String(r.F)) + '/12</span>' +
      '<button type="button" class="btn btn-icon esp2-hist-del" data-id="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.esp2-hist-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.tests = e.tests.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderHist(); renderStats(); };
  });
}
function renderStats() {
  var st = $('esp2Stats'); if (!st) return;
  var e = store();
  var nd = Object.keys(e.diario || {}).length;
  var c = e.miPilar ? ESP_PILARES[e.miPilar].nombre : 'sin pilar';
  var nc = (e.cosmoFavs || []).length, ne = (e.elemLog || []).length;
  st.textContent = (e.tests.length ? e.tests.length + ' test(s)' : 'sin tests') + ' · ' + nd + ' día(s) diario · ' + e.practs.length + ' día(s) del espíritu · ' + nc + ' cosmovision(es) · ' + ne + ' encuentro(s) elemental(es) · ' + c;
}

/* Silencio timer 5 min */
var espSilencioTimer = null;
function runSilencio() {
  var msg = $('esp2SilencioMsg'), btn = $('esp2SilencioBtn');
  if (!msg) return;
  if (espSilencioTimer) { clearInterval(espSilencioTimer); espSilencioTimer = null; if (btn) btn.textContent = '▶ Silencio ahora (5 min)'; msg.textContent = ''; return; }
  var seg = 300;
  if (btn) btn.textContent = '⏹ Detener';
  msg.textContent = 'Siéntate, pies en tierra… 5:00 (cuenta del 1 al 10)';
  espSilencioTimer = setInterval(function () {
    seg--;
    if (seg <= 0) {
      clearInterval(espSilencioTimer); espSilencioTimer = null;
      if (btn) btn.textContent = '▶ Silencio ahora (5 min)';
      msg.textContent = '✓ Listo. Anota 1 frase de lo que apareció y guarda tu día abajo.';
      try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
      return;
    }
    var m = Math.floor(seg / 60), s = seg % 60;
    var fase = seg > 180 ? 'Respira 4-6… ' : (seg > 60 ? 'Vuelve amable al conteo… ' : 'Suelta y agradece… ');
    msg.textContent = fase + m + ':' + String(s).padStart(2, '0');
  }, 1000);
}

/* Puente hacia Métodos: botón "Abrir mi Espíritu" en su ficha */
function puenteMetodos() {
  try {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (tries > 40) { clearInterval(iv); return; }
      var dlg = $('metodosDialog') || document.getElementById('metodosDialog');
      if (!dlg) return;
      var html = dlg.innerHTML || '';
      var low = html.toLowerCase();
      if (low.indexOf('espiritu') < 0 && low.indexOf('trascenden') < 0 && low.indexOf('oraci') < 0 && low.indexOf('perd') < 0) return;
      if ($('espOpenFromMetodos')) { clearInterval(iv); return; }
      var btns = dlg.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        var t = (b.textContent || '').toLowerCase();
        if (t.indexOf('espiritu') >= 0 || t.indexOf('trascenden') >= 0 || t.indexOf('perd') >= 0) {
          var open = document.createElement('button');
          open.type = 'button'; open.id = 'espOpenFromMetodos';
          open.className = 'btn btn-accent'; open.style.width = 'auto'; open.style.marginLeft = '8px';
          open.textContent = '✨ Abrir mi Espíritu';
          open.onclick = function (ev) { try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {} openEsp(); };
          try { b.parentNode.insertBefore(open, b.nextSibling); } catch (e) { dlg.appendChild(open); }
          clearInterval(iv); return;
        }
      }
    }, 500);
  } catch (e) {}
}

/* Puente desde Prácticas Espirituales hacia Espíritu */
function puentePracticas() {
  try {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (tries > 40) { clearInterval(iv); return; }
      var dlg = $('espiritualDialog') || document.getElementById('espiritualDialog');
      if (!dlg) return;
      if ($('esp2OpenFromPract')) { clearInterval(iv); return; }
      var anchor = $('espGoBreath') || $('espGoGolden') || $('espGoCircadian');
      if (!anchor || !anchor.parentNode) return;
      var open = document.createElement('button');
      open.type = 'button'; open.id = 'esp2OpenFromPract';
      open.className = 'btn btn-accent'; open.style.width = 'auto';
      open.textContent = '✨ Abrir mi Espíritu';
      open.onclick = function (ev) { try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {} try { dlg.close(); } catch (e2) {} setTimeout(openEsp, 150); };
      try { anchor.parentNode.appendChild(open); } catch (e) {}
      clearInterval(iv);
    }, 600);
  } catch (e) {}
}

function openEsp() {
  try {
    if ($('esp2DiaFecha') && !$('esp2DiaFecha').value) $('esp2DiaFecha').value = todayKey();
    syncMiPilar(); renderMiPilarBox(); renderDiario(); renderHist(); renderPracts(); renderCosmoFavs(); renderElemLog(); renderStats(); updateProgreso();
  } catch (e) {}
  openDlg('espirituDialog');
}
try { window.openEspiritu = openEsp; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar botón en Linaje > practicas (tras Prácticas Espirituales si existe) */
  try {
    if (!$('btnEspiritu')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnEspiritu'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '✨ Espíritu';
        try { btn.setAttribute('data-sub', 'practicas'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'espiritu alma sentido proposito fe silencio gratitud perdon servicio trascendencia rito oracion rezo meditacion interior paz duelo amor presencia ofrenda luna vela confianza soltar centro cosmovisiones mundo espiritual elementales ngen mapuche pachamama ancestros guias angeles sueños proteccion tierra agua aire fuego gnomos ondinas silfides salamandras');
        var ref = g.querySelector('#btnEspiritual') || g.querySelector('#btnTao') || g.querySelector('#btnRecap');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else if (ref) g.appendChild(btn);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnEspiritu');
        var curG = cur.closest ? cur.closest('.action-group') : null;
        var curN = curG && curG.getAttribute ? curG.getAttribute('data-group') : null;
        if (curN && curN !== 'linaje') {
          var gd = document.querySelector('.action-group[data-group="linaje"] .group-btns');
          if (gd) { gd.appendChild(cur); try { cur.setAttribute('data-sub', 'practicas'); } catch (eS) {} }
        }
      } catch (eM) {}
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnEspiritu') < 0) ALL_BTNS.push('btnEspiritu');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnEspiritu = ['linaje', 'practicas'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|practicas'] && BTN_ORDER['linaje|practicas'].indexOf('btnEspiritu') < 0) {
      var oi = BTN_ORDER['linaje|practicas'].indexOf('btnEspiritual');
      if (oi >= 0) BTN_ORDER['linaje|practicas'].splice(oi + 1, 0, 'btnEspiritu');
      else BTN_ORDER['linaje|practicas'].push('btnEspiritu');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['todo', 'adulto', 'adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnEspiritu = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnEspiritu"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnEspiritu"> ✨ Espíritu';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnEspiritu !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnEspiritu = lab.querySelector('input').checked;
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
  try { addKw('btnMetodos', 'espiritu alma sentido trascendencia perdon rito'); } catch (e2) {}
  try { addKw('btnEspiritual', 'espiritu alma centro sentido perdon rito trascendencia'); } catch (e3) {}
  try { addKw('btnGratitud', 'espiritu gratitud gracias alma centro'); } catch (e4) {}
  try { addKw('btnPsico', 'espiritu sentido alma centro autoconocimiento'); } catch (e5) {}
  try { addKw('btnDueloFull', 'espiritu duelo honra alma despedida trascendencia'); } catch (e6) {}
  try { addKw('btnRecap', 'espiritu perdon soltar alma liberacion'); } catch (e7) {}
  try { addKw('btnIkigai', 'espiritu sentido proposito alma ikigai'); } catch (e8) {}
  try { addKw('btnBreath', 'espiritu silencio presencia respiracion calma'); } catch (e9) {}

  /* 4) diálogo */
  buildDialog();
  renderLunasBox();
  syncMiPilar();
  renderMiPilarBox();
  renderDiario();
  renderHist();
  renderPracts();
  renderCosmoFavs();
  renderElemLog();
  renderStats();

  var b = $('btnEspiritu');
  if (b) b.onclick = function () { openEsp(); };

  ESP_TABS.forEach(function (t) {
    var tb = $('tabEsp' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var q = $('esp2Q'); if (q) q.oninput = filterLuces;
  document.querySelectorAll('#esp2TxGrid .est-tx-card').forEach(function (card) {
    card.onclick = function () { renderDetalle(card.dataset.tx); };
  });
  var qc = $('esp2QCosmo'); if (qc) qc.oninput = filterCosmo;
  document.querySelectorAll('#esp2CosmoGrid .est-tx-card').forEach(function (card) {
    card.onclick = function () { renderCosmoDetalle(card.dataset.cosmo); };
  });
  var qm = $('esp2QMundo'); if (qm) qm.oninput = filterMundo;
  document.querySelectorAll('#esp2MundoGrid .est-tx-card').forEach(function (card) {
    card.onclick = function () { renderMundoDetalle(card.dataset.mundo); };
  });
  document.querySelectorAll('#esp2ElemGrid .est-tx-card').forEach(function (card) {
    card.onclick = function () { renderElemDetalle(card.dataset.elem); };
  });
  var eadd = $('esp2ElemAdd');
  if (eadd) eadd.onclick = function () {
    var el = clean((($('esp2ElemSel') || {}).value || 'Tierra'), 20);
    var lu = clean((($('esp2ElemLugar') || {}).value || ''), 60);
    var ge = clean((($('esp2ElemGesto') || {}).value || ''), 140);
    if (!ge) { alert('Escribe el gesto de cuidado que hiciste 🤲🌿'); return; }
    var e = store();
    e.elemLog.push({ id: uid('e'), fecha: todayKey(), elem: el, lugar: lu, gesto: ge });
    var k = todayKey();
    e.diario[k] = (e.diario[k] ? e.diario[k] + ' | ' : '') + '🌿 Elemental (' + el + ' en ' + (lu || 'Penco') + '): ' + ge;
    save('Encuentro guardado 🌿');
    if ($('esp2ElemLugar')) $('esp2ElemLugar').value = '';
    if ($('esp2ElemGesto')) $('esp2ElemGesto').value = '';
    renderElemLog(); renderDiario(); renderStats();
  };
  document.querySelectorAll('.esp2-pract-add').forEach(function (bp) {
    bp.onclick = function () {
      var k = todayKey();
      var d = store();
      d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🛠️ Practiqué: ' + bp.dataset.p;
      save('Práctica anotada en tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
    };
  });

  var sb = $('esp2SilencioBtn'); if (sb) sb.onclick = runSilencio;
  var ps = $('esp2PractSave');
  if (ps) ps.onclick = function () {
    var it = clean((($('esp2Intencion') || {}).value || ''), 140);
    var su = clean((($('esp2Suelto') || {}).value || ''), 140);
    var ag = clean((($('esp2Agradezco') || {}).value || ''), 140);
    if (!it && !su && !ag) { alert('Escribe al menos tu intención, lo que sueltas o lo que agradeces ✨'); return; }
    var e = store();
    e.practs = e.practs.filter(function (r) { return r.fecha !== todayKey(); });
    e.practs.push({ id: uid('p'), fecha: todayKey(), intencion: it, suelto: su, agradece: ag });
    var txt = '✨ Día del espíritu';
    if (it) txt += ' · ✨ ' + it;
    if (su) txt += ' · 🌙 ' + su;
    if (ag) txt += ' · 🙏 ' + ag;
    e.diario[todayKey()] = (e.diario[todayKey()] ? e.diario[todayKey()] + ' | ' : '') + txt;
    save('Día del espíritu guardado ✓');
    if ($('esp2Intencion')) $('esp2Intencion').value = '';
    if ($('esp2Suelto')) $('esp2Suelto').value = '';
    if ($('esp2Agradezco')) $('esp2Agradezco').value = '';
    renderPracts(); renderDiario(); renderStats();
  };
  var gr = $('esp2GoRespira');
  if (gr) gr.onclick = function () { try { var r = $('btnBreath'); if (r) r.click(); else alert('Abre 🌬️ Respiración desde Mi Día'); } catch (e) {} };
  var gp = $('esp2GoPracticas');
  if (gp) gp.onclick = function () { try { var r = $('btnEspiritual'); if (r) r.click(); else alert('Abre 🕉️ Prácticas desde Interior'); } catch (e) {} };
  var gg = $('esp2GoGratitud');
  if (gg) gg.onclick = function () { try { var r = $('btnGratitud'); if (r) r.click(); else alert('Abre 📓 Gratitud desde Mi Día'); } catch (e) {} };
  var gdu = $('esp2GoDuelo');
  if (gdu) gdu.onclick = function () { try { var r = $('btnDueloFull'); if (r) r.click(); else alert('Abre 🕊️ Duelo desde Interior'); } catch (e) {} };

  var tc = $('esp2TestCalc');
  if (tc) tc.onclick = function () {
    var r = calcTest();
    if (r.contestadas < ESP_TEST.length) { alert('Te faltan ' + (ESP_TEST.length - r.contestadas) + ' por responder para un espejo fiel ✨'); }
    showResultado(r.sc);
  };
  var tr = $('esp2TestReset');
  if (tr) tr.onclick = function () {
    for (var i = 0; i < ESP_TEST.length; i++) {
      document.querySelectorAll('input[name="esp2Q' + i + '"]').forEach(function (x) { x.checked = false; });
    }
    var rb = $('esp2Resultado'); if (rb) rb.classList.add('hidden');
    updateProgreso();
  };
  document.querySelectorAll('#esp2TestBox input[type="radio"]').forEach(function (x) {
    x.onchange = updateProgreso;
  });

  var ma = $('esp2MiPilar');
  if (ma) ma.onchange = function () { var e = store(); e.miPilar = ma.value || ''; save('Tu pilar guardado ✓'); renderMiPilarBox(); renderStats(); };
  var da = $('esp2DiaAdd');
  if (da) da.onclick = function () {
    var f = ($('esp2DiaFecha') || {}).value || todayKey();
    var t = clean((($('esp2DiaTxt') || {}).value || ''), 300);
    if (!t) { alert('Escribe 1 línea de tu camino de hoy ✨'); return; }
    var e = store();
    e.diario[f] = (e.diario[f] ? e.diario[f] + ' | ' : '') + t;
    save('Diario guardado ✓');
    if ($('esp2DiaTxt')) $('esp2DiaTxt').value = '';
    renderDiario(); renderStats();
  };
  var sh = $('esp2Share');
  if (sh) sh.onclick = function () {
    var e = store();
    var nd = Object.keys(e.diario || {}).length;
    var c = e.miPilar ? ESP_PILARES[e.miPilar].nombre : 'pilar por definir';
    share('✨ Mi Espíritu', 'Centro que ordena cuerpo y mente · ' + c + '\n✨ Racha: ' + rachaPracts() + ' días · ' + e.practs.length + ' días del espíritu · ' + nd + ' días de diario · ' + e.tests.length + ' test(s) · ' + (e.cosmoFavs || []).length + ' cosmovision(es) · ' + (e.elemLog || []).length + ' encuentro(s) elemental(es).\n' + ESP_LUNAS[0]);
  };
  var tn = $('esp2ToNote');
  if (tn) tn.onclick = function () {
    try {
      var e = store();
      var c2 = e.miPilar ? ESP_PILARES[e.miPilar].nombre : 'intención + suelto + agradezco';
      var txt2 = '✨ Espíritu (' + c2 + ') · racha ' + rachaPracts() + 'd · ' + (e.diario[todayKey()] || 'hoy: 1 silencio + 3 gratitudes + 1 servicio');
      if (typeof appendToTodayNote === 'function') { appendToTodayNote(txt2); save('Llevado a tu nota de hoy ✓'); }
      else if (typeof userData === 'function') {
        var u = userData();
        u.notas = u.notas || {}; var k = todayKey();
        u.notas[k] = u.notas[k] || {}; u.notas[k].nota = ((u.notas[k].nota || '') + '\n' + txt2).trim();
        save('Llevado a tu nota de hoy ✓');
      }
    } catch (e) {}
  };
  var cl = $('esp2Clear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar todo tu Espíritu (tests, diario, días, favoritas, cosmovisiones, elementales)?')) return;
    try {
      var u = (typeof userData === 'function') ? userData() : null;
      if (u) u.espiritu = blank();
    } catch (e) {}
    syncMiPilar(); renderMiPilarBox(); renderDiario(); renderHist(); renderPracts(); renderCosmoFavs(); renderElemLog(); renderStats();
    save('Espíritu borrado');
  };

  puenteMetodos();
  puentePracticas();
  updateProgreso();
}

var _retry = 0;
function setupRetry() {
  var ready = false;
  try { ready = !!document.querySelector('.action-group[data-group="linaje"] .group-btns'); } catch (e) {}
  if (!ready) {
    _retry++;
    if (_retry < 80) { setTimeout(setupRetry, 500); return; }
  }
  try { setup(); } catch (e) {}
  setTimeout(function () { try { puenteMetodos(); } catch (e2) {} try { puentePracticas(); } catch (e3) {} }, 2500);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setupRetry, 400); });
else setTimeout(setupRetry, 400);

})();
