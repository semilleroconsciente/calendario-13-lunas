/* ============================================================
   VIGYAN BHAIRAV TANTRA — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente: los 112 sutras de meditación
   del texto tántrico clásico (diálogo Devi–Shiva / Bhairava).
   - Botón btnVigyan (grupo Linaje > Interior, tras btnTao)
   - Diálogo vigyanDialog con 5 pestañas:
     1) Guía (qué es, Devi y Bhairava, qué es vigyan, las 7
        familias de puertas, cómo practicar sin gurú, cuidados)
     2) Sutras (los 112 completos + buscador por familia +
        detalle + favorita + "practicar hoy")
     3) Prácticas (8 puertas madre + pausa guiada 3 min +
        registro diario de la brecha)
     4) Test (20 afirmaciones: tu puerta natural R/S/C/M/G +
        nivel de dispersión)
     5) Mi Camino (mi puerta, diario, prácticas, historial,
        racha, compartir, llevar a nota, borrar)
   - Todo local y privado por usuario: userData().vigyan
     { tests:[], miPuerta:'', practs:[], diario:{}, favs:[] }
   - Puentes: Métodos (ficha Tantra), Respiración (pausa),
     Disciplina (volver al centro), Gratitud (asombro).
   - Educativo y contemplativo, no religión ni terapia.
     Paráfrasis breves en lenguaje simple (no traducción
     literal). 100% offline.
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
function blank() { return { tests: [], miPuerta: '', practs: [], diario: {}, favs: [] }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.vigyan) u.vigyan = blank();
    var e = u.vigyan;
    if (!Array.isArray(e.tests)) e.tests = [];
    if (!Array.isArray(e.practs)) e.practs = [];
    if (!e.diario) e.diario = {};
    if (!Array.isArray(e.favs)) e.favs = [];
    if (typeof e.miPuerta !== 'string') e.miPuerta = '';
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
  ['Guia', 'Sutras', 'Pract', 'Test', 'Camino'].forEach(function (t) {
    var p = $('vbt' + t), b = $('tabVbt' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* Familias de las 112 puertas */
var VBT_FAMS = {
  R: { n: 'Respiro y pausa', ico: '🌬️', desc: 'El aire que entra y sale y la pausa entre ambos. La puerta más directa.' },
  E: { n: 'Energía y centro', ico: '⚡', desc: 'Hormigueo, calor, latido y el centro del corazón. Sentir la corriente sin manejarla.' },
  S: { n: 'Sonido y silencio', ico: '🔔', desc: 'Escuchar hasta que el sonido se apaga. Mantras, música y el silencio que queda.' },
  L: { n: 'Luz, sombra y espacio', ico: '🌌', desc: 'Mirar la oscuridad con ojos cerrados, el cielo, la llama. Disolverse en lo vasto.' },
  C: { n: 'Cuerpo y sentidos', ico: '🤲', desc: 'Tacto, gusto, abrazo, dolor y placer mirados con presencia total.' },
  M: { n: 'Mente, sueño e imagen', ico: '💭', desc: 'Pensamientos como nubes, sueños, recuerdos e imaginación usada como puente.' },
  G: { n: 'Corazón y asombro', ico: '💛', desc: 'Devoción simple, gratitud, asombro de principiante y entrega sin pedir nada.' }
};

/* ============================================================
   LOS 112 SUTRAS — paráfrasis educativa breve (no literal).
   Orden clásico del texto, agrupado en 7 familias.
   ============================================================ */
var VBT_SUTRAS = [
/* ---- R: RESPIRO Y PAUSA (1-16) ---- */
{id:'s1',fam:'R',n:'1 · La pausa entre dos respiros',tag:'respiracion pausa brecha entre inhalar exhalar',idea:'Entre el aire que entra y el que sale hay un instante quieto donde no haces nada. Si pones tu atención justo ahí, la mente se detiene sola un momento y aparece una calma que no fabricaste.',practica:'Siéntate. Sigue 9 respiraciones y marca mentalmente la pausa de arriba (lleno) y la de abajo (vacío). Quédate solo ahí.'},
{id:'s2',fam:'R',n:'2 · Quedarse en el vacío de abajo',tag:'exhalar vacio pausa retencion suave',idea:'Al soltar todo el aire queda un fondo vacío antes de volver a tomar. Descansar en ese fondo enseña que no pasa nada si no controlas: la vida vuelve sola.',practica:'Exhala largo por la nariz, no tomes aire de inmediato: habita 2-3 segundos ese vacío. Repite 7 veces.'},
{id:'s3',fam:'R',n:'3 · El aire como columpio',tag:'respiracion centro vaiven hamsa',idea:'El aire entra y sale como un columpio que pasa siempre por el mismo centro: tu corazón. Seguir el vaivén hasta su punto medio aquieta el ir y venir de la cabeza.',practica:'Visualiza el aire pasando por el centro del pecho al entrar y salir, 3 minutos sin apurar.'},
{id:'s4',fam:'R',n:'4 · Llenarse hasta la coronilla',tag:'inhalar llenar energia subir coronilla',idea:'Al inhalar, siente que el aire te llena desde la base hasta arriba de la cabeza, como agua que sube. Esa llenura total deja poco espacio para el parloteo.',practica:'Inhala lento sintiendo el llenado por pisos: vientre, pecho, frente. Exhala suelto. 7 rondas.'},
{id:'s5',fam:'R',n:'5 · Vaciarse hasta la raíz',tag:'exhalar vaciar soltar raiz',idea:'Al exhalar, siente que te vacías completo hacia abajo, como una vasija que se vuelca. El vaciamiento enseña a soltar: pensamientos, hombros, apuro.',practica:'Exhala imaginando que bajas por dentro hasta el suelo pélvico. 7 rondas soltando hombros.'},
{id:'s6',fam:'R',n:'6 · El punto donde nace el aire',tag:'origen respiracion pausa antes de inhalar',idea:'Justo antes de que nazca la inhalación hay un impulso silencioso. Atrapar ese instante previo es tocar la fuente: el querer vivir antes de la acción.',practica:'Tras exhalar, espera y observa el momento exacto en que el cuerpo decide inhalar. No lo provoques: obsérvalo 5 veces.'},
{id:'s7',fam:'R',n:'7 · El hilo del centro (madhya)',tag:'canal central columna sushumna medio',idea:'Imagina un hilo fino por el centro del cuerpo, de la coronilla a la base. Sube y baja la atención por ese hilo con la respiración: el centro ordena los extremos.',practica:'Con ojos cerrados recorre el hilo 9 veces arriba-abajo al ritmo del aire.'},
{id:'s8',fam:'R',n:'8 · Doce dedos más allá (dvadashanta)',tag:'dvadashanta doce dedos exhalacion horizonte',idea:'El texto dice que el aire exhalado se disuelve a doce dedos de la nariz. Seguir el aire hasta que desaparece afuera enseña a soltar hasta el final.',practica:'Exhala por la nariz y sigue con la mente el aire 30 cm más allá, hasta que se pierde. 9 veces.'},
{id:'s9',fam:'R',n:'9 · Respirar por el corazón',tag:'corazon respiracion latido centro pecho',idea:'Lleva la respiración al centro del pecho: como si el corazón respirara. El pecho se ablanda y lo emocional se calma sin analizar nada.',practica:'Mano en el pecho 3 minutos: inhala al corazón, exhala desde el corazón.'},
{id:'s10',fam:'R',n:'10 · Suspender el pensamiento en la pausa',tag:'pausa pensamiento detener mente gap',idea:'En la pausa natural entre aires no hay pensamiento si no lo invitas. Prolongar un segundo esa pausa es probar que puedes existir sin pensar.',practica:'Tras inhalar, pausa 2 segundos sin pensar a propósito. Si viene idea, vuelve al aire. 9 rondas.'},
{id:'s11',fam:'R',n:'11 · El “ham” que sale y el “sa” que entra',tag:'hamsa soham mantra respiracion sonido',idea:'El roce del aire suena: “sa” al entrar, “ham” al salir. Escuchar ese mantra natural convierte respirar en rezo sin palabras.',practica:'Escucha el roce 5 minutos: “saaa” entra, “hamm” sale. Sin forzarlo.'},
{id:'s12',fam:'R',n:'12 · Cortar el aire en la garganta',tag:'garganta retencion leve jalandhara pausa',idea:'Una pausa suave con la garganta relajada (como tragar sin tragar) concentra la energía arriba y aclara: menos vueltas, más presencia.',practica:'Inhala, pausa 3 segundos con garganta suave y mentón levemente entrado. Exhala. Solo 5 veces, sin presión.'},
{id:'s13',fam:'R',n:'13 · Respirar como si fuera la última',tag:'impermanencia ultima respiracion presencia',idea:'Si este aire fuera el último, lo sentirías completo. Tratar cada respiración como única devuelve el valor a lo ordinario.',practica:'Toma 3 respiraciones “últimas”: lentas, completas, agradecidas.'},
{id:'s14',fam:'R',n:'14 · Contar sin contar',tag:'contar respiraciones atencion plena ancla',idea:'Contar del 1 al 10 cada ciclo y volver a empezar ata la mente dispersa a un riel simple hasta que se cansa de fugarse.',practica:'Cuenta 3 ciclos completos de 1 a 10. Si te pierdes, vuelve al 1 sin pelear.'},
{id:'s15',fam:'R',n:'15 · El aire que toca la piel',tag:'piel aire tacto brisa poros',idea:'Sentir el aire rozando el labio superior, las fosas y la piel convierte la respiración en tacto: sales de la cabeza y entras al cuerpo.',practica:'2 minutos solo en el roce del aire bajo la nariz. Frío entra, tibio sale.'},
{id:'s16',fam:'R',n:'16 · Dormirse en la exhalación',tag:'dormir exhalacion descanso noche insomnio',idea:'Alargar la exhalación le dice al cuerpo que no hay peligro: el sueño llega. Es la puerta para noches con cabeza acelerada.',practica:'Acostado: inhala 4, exhala 6-8 por la nariz, 9 rondas. Suelta el día en cada salida.'},
/* ---- E: ENERGÍA Y CENTRO (17-30) ---- */
{id:'s17',fam:'E',n:'17 · El estremecimiento (spanda)',tag:'spanda vibracion estremecimiento energia temblor',idea:'A veces el cuerpo tiembla, hormiguea o late solo (frío, susto, alegría). Si lo recibes sin miedo, ese temblor te muestra que estás vivo por dentro.',practica:'Cuando hormiguee o tiemble algo, no lo cortes: obsérvalo 1 minuto como olas.'},
{id:'s18',fam:'E',n:'18 · La enredadera de fuego que sube',tag:'kundalini subir calor columna despertar suave',idea:'Imagina un calor suave subiendo por la columna con la inhalación, vértebra a vértebra. Es solo imaginación que ordena la atención de abajo hacia arriba.',practica:'Inhala subiendo la atención por la espalda hasta la nuca; exhala bajando por delante. 7 vueltas, sin forzar.'},
{id:'s19',fam:'E',n:'19 · El rayo en el entrecejo',tag:'entrecejo tercer ojo concentracion luz',idea:'Llevar la atención al punto entre las cejas reúne la mente dispersa en un solo punto luminoso, como juntar rayos con una lupa.',practica:'Ojos cerrados, mira suave hacia el entrecejo 2 minutos. Si duele, suelta y mira al corazón.'},
{id:'s20',fam:'E',n:'20 · El corazón que late solo',tag:'latido corazon pulso escucha interior',idea:'El corazón late sin tu permiso desde antes de nacer. Escucharlo te recuerda que la vida te sostiene sin que la manejes.',practica:'Mano al pecho o al pulso, 2 minutos solo latiendo. Gracias en silencio.'},
{id:'s21',fam:'E',n:'21 · Llenar el cuerpo de néctar',tag:'plenitud ambrosia bienestar expandir pecho',idea:'Con cada inhalación imagina que un néctar tibio llena el pecho y se reparte. La imagen de plenitud produce plenitud real: el cuerpo cree lo que siente.',practica:'3 inhalaciones imaginando luz tibia que llena y rebalsa hacia brazos y cara.'},
{id:'s22',fam:'E',n:'22 · Tocar el centro con un dedo de luz',tag:'centro pecho concentrar punto energia',idea:'Reducir toda tu atención a un punto del tamaño de un grano en el centro del pecho corta el ruido: un punto no admite dos pensamientos.',practica:'Imagina un punto de luz en el centro del pecho y quédate ahí 3 minutos.'},
{id:'s23',fam:'E',n:'23 · La vasija que rebalsa por arriba',tag:'coronilla rebalse energia desborde dar',idea:'Cuando te sientas lleno (respiración, cariño, comida rica), imagina que rebalsas por la coronilla y das hacia afuera. Lo lleno que se da no se estanca.',practica:'Tras algo bueno de hoy, cierra ojos 1 minuto e imagina que lo irradias.'},
{id:'s24',fam:'E',n:'24 · Temblar hasta aquietarse',tag:'sacudir cuerpo liberar tension trauma suave',idea:'Sacudir el cuerpo suelto 1-2 minutos y luego detenerse de golpe deja un silencio corporal profundo: el contraste enseña qué es quietud.',practica:'De pie, sacude hombros, brazos y piernas 1 minuto. Frena de golpe, quieto 1 minuto sintiendo el hormigueo. Solo si tu cuerpo lo permite.'},
{id:'s25',fam:'E',n:'25 · El calor del vientre',tag:'vientre hara calor digestivo centro bajo',idea:'Llevar aire y manos tibias al vientre bajo despierta el horno interno: digestión, ánimo y coraje nacen del mismo fuego.',practica:'Manos en vientre, respira ahí 9 veces sintiendo calor. Ideal en mañanas frías.'},
{id:'s26',fam:'E',n:'26 · La raíz que se aprieta suave',tag:'suelo pelvico mula bandha raiz sostener',idea:'Apretar suavemente el suelo pélvico al exhalar (como sostener las ganas) y soltar al inhalar junta la energía dispersa hacia el centro.',practica:'5 ciclos: exhala apretando suave, inhala soltando. Sin pujar ni aguantar el aire.'},
{id:'s27',fam:'E',n:'27 · Disolverse en el escalofrío',tag:'escalofrio piel gozo disolverse',idea:'El escalofrío de una música o un recuerdo abre una grieta de gozo. Entrar en él en vez de comentarlo es meditar con el cuerpo.',practica:'Cuando llegue, cierra ojos y métete dentro del escalofrío 30 segundos.'},
{id:'s28',fam:'E',n:'28 · Ser lamido por la energía',tag:'energia recorre cuerpo olas aceptar',idea:'A veces una ola recorre la espalda o la nuca. No la nombres ni la dirijas: déjala pasar como lengua tibia que te recorre.',practica:'Ante la ola, quietud y “sí”. 1 minuto de mera recepción.'},
{id:'s29',fam:'E',n:'29 · El centro inmóvil del movimiento',tag:'centro quieto girar bailar rueda',idea:'Al girar bailando o dar vueltas con un niño, hay un eje quieto dentro del giro. Buscar ese eje enseña que puedes moverte sin perderte.',practica:'Gira 3 veces lento con brazos abiertos y frena: siente el eje quieto 30 segundos.'},
{id:'s30',fam:'E',n:'30 · Dormir despierto en el ombligo',tag:'ombligo dormir atencion vientre descanso',idea:'Llevar la atención al ombligo al acostarte hunde la mente en el cuerpo y el sueño llega sin lucha: el ombligo fue tu primera boca.',practica:'Acostado, atiende el subir-bajar del ombligo hasta dormirte.'},
/* ---- S: SONIDO Y SILENCIO (31-46) ---- */
{id:'s31',fam:'S',n:'31 · Seguir un sonido hasta que muere',tag:'escuchar sonido apaga atencion nada',idea:'Un cuenco, una campana o el microondas dejan una cola que se apaga. Seguirla hasta el cero entrena la atención y te deja en silencio sin esfuerzo.',practica:'Produce un sonido largo y síguelo hasta que no quede nada. 3 veces.'},
{id:'s32',fam:'S',n:'32 · El zumbido de la abeja (bhramari)',tag:'bhramari zumbido abeja garganta calmar',idea:'Zumbar con labios cerrados y oídos tapados con los pulgares llena la cabeza de vibración dulce que borra el ruido mental.',practica:'Tapa oídos suave, inhala y zumba “mmm” largo. 7 veces. Ideal antes de dormir.'},
{id:'s33',fam:'S',n:'33 · Cantar una vocal hasta disolverse',tag:'vocal cantar aa oo mmm resonancia',idea:'Cantar “aaa”, “ooo” o “mmm” sintiendo dónde vibra (pecho, garganta, cráneo) convierte la voz en masaje interno.',practica:'Canta cada vocal 3 veces larga, sintiendo su lugar. Termina en silencio 1 minuto.'},
{id:'s34',fam:'S',n:'34 · El “Om” por capas',tag:'om aum mantra capas silencio',idea:'El Om tiene 4 partes: A (vientre), U (pecho), M (cabeza) y el silencio final. Recorrerlas es viajar de lo grueso a lo sutil.',practica:'Canta Om lento 7 veces, alargando cada vez más el silencio final.'},
{id:'s35',fam:'S',n:'35 · Escuchar el silencio entre sonidos',tag:'silencio entre ruidos pausa auditiva',idea:'Entre bocina y bocina, entre palabra y palabra, hay silencio. Atender el fondo en vez de la figura descansa más que taparse los oídos.',practica:'2 minutos: no sigas los ruidos, sigue los huecos silenciosos entre ellos.'},
{id:'s36',fam:'S',n:'36 · El sonido del corazón (nada interior)',tag:'nada interior zumbido oido sutil anahata',idea:'En silencio total aparece un zumbido finísimo dentro del oído. Los antiguos lo llamaron el sonido sin golpe: escucharlo es escuchar a la vida funcionando.',practica:'En pieza silenciosa, tapa oídos suave 1 minuto y escucha el hilo fino interno.'},
{id:'s37',fam:'S',n:'37 · Repetir un nombre amado',tag:'mantra nombre amado japa repeticion',idea:'Repetir en silencio una palabra amada (paz, luz, mamá, mar) con cariño recoge la mente como una madre recoge a sus pollitos.',practica:'Elige 1 palabra y repítela suave 5 minutos al ritmo del aire.'},
{id:'s38',fam:'S',n:'38 · Escuchar como si fueras oreja',tag:'escucha total convertirte oido presencia',idea:'En vez de oír desde tu cabeza, imagina que eres solo una gran oreja: sin opinar, sin nombrar. La escucha total disuelve al que escucha.',practica:'3 minutos: todo lo que llegue (pájaros, micro, respiración) solo se recibe.'},
{id:'s39',fam:'S',n:'39 · La música que sigue adentro',tag:'musica interior resonancia despues',idea:'Cuando termina una canción que amas, sigue sonando adentro un rato. Quedarse en esa resonancia es meditar sin técnica.',practica:'Tras tu canción favorita, quédate quieto 2 minutos en su eco interno.'},
{id:'s40',fam:'S',n:'40 · Decir “no” en silencio',tag:'mente callar basta interior limite ruido',idea:'Ante la catarata mental, decir por dentro un “basta” firme y amoroso una sola vez, y quedar en el hueco que abre.',practica:'Cuando la mente no pare, di “basta” interno y habita el silencio de 5 segundos que sigue.'},
{id:'s41',fam:'S',n:'41 · El trueno que se aleja',tag:'sonido fuerte susto retumbe soltar',idea:'Un trueno, un portazo o una ola grande dejan una vibración que se aleja. Seguirla enseña que hasta lo fuerte pasa.',practica:'Ante un ruido fuerte (sin peligro), sigue su cola hasta que se pierde.'},
{id:'s42',fam:'S',n:'42 · Hablar en el susurro mínimo',tag:'susurro hablar bajo mantra suave',idea:'Decir tu palabra amada cada vez más bajo hasta mover solo los labios y luego solo la mente: cada rebaje hunde la atención un piso.',practica:'Repite 3 veces en voz, 3 en susurro, 3 solo mental. Quédate en silencio.'},
{id:'s43',fam:'S',n:'43 · El grito que se vuelve silencio',tag:'grito almohada liberar voz silencio cojin',idea:'Un grito ahogado en cojín o en el mar libera la olla a presión del pecho; el silencio posterior es profundo y natural.',practica:'Solo en privado: 1 grito contenido en cojín, luego 2 minutos de silencio total. No fuerces la garganta.'},
{id:'s44',fam:'S',n:'44 · Escuchar tu nombre desde lejos',tag:'nombre llamado atencion identidad soltar yo',idea:'Imaginar que te llaman por tu nombre desde muy lejos y escuchar ese llamado adelgaza el “yo”: eres el que escucha, no el llamado.',practica:'Ojos cerrados 2 minutos: escucha tu nombre venir del horizonte interior.'},
{id:'s45',fam:'S',n:'45 · El latido del tambor interno',tag:'tambor ritmo pulso danza corazon',idea:'Marcar un ritmo suave con los dedos y luego suspenderlo quedándote en su pulso interno ordena cuerpo y mente como una danza.',practica:'Tamborilea dedos 1 minuto, detente y quédate en el pulso fantasma 1 minuto.'},
{id:'s46',fam:'S',n:'46 · Callar después de reír',tag:'risa silencio despues gozo aquietar',idea:'Tras reír de verdad queda un vientre suelto y una mente en blanco. No llenarlo de inmediato: ese hueco es oro meditativo.',practica:'Después de reír, cierra ojos 30 segundos y habita el hueco feliz.'},
/* ---- L: LUZ, SOMBRA Y ESPACIO (47-64) ---- */
{id:'s47',fam:'L',n:'47 · Mirar la oscuridad con ojos cerrados',tag:'oscuridad ojos cerrados vacio mirar',idea:'Tras cerrar los ojos aparece una pantalla oscura con puntitos y nubes. Mirarla sin querer ver nada es la primera lección del vacío fértil.',practica:'Ojos cerrados 3 minutos: mira la oscuridad como quien mira el mar de noche.'},
{id:'s48',fam:'L',n:'48 · La llama sin parpadear (trataka suave)',tag:'vela llama mirada fija trataka ojos',idea:'Mirar una vela 1-2 minutos sin forzar y luego cerrar los ojos quedándote con su huella de luz concentra y serena.',practica:'Vela a 1 metro, mira suave 1 minuto, cierra y contempla la huella hasta que se apague. No fuerces ni ardan ojos.'},
{id:'s49',fam:'L',n:'49 · El cielo interior',tag:'cielo espacio interior vastedad craneo',idea:'Imaginar el cráneo como cielo vacío donde los pensamientos son pájaros que cruzan y se van: no hay que atrapar ninguno.',practica:'3 minutos: pensamientos = pájaros cruzando tu cielo interno.'},
{id:'s50',fam:'L',n:'50 · Mirar el cielo real hasta perderse',tag:'cielo nubes horizonte vastedad asombro',idea:'Acostarse a mirar nubes o estrellas hasta olvidar el cuerpo devuelve la medida real: eres parte de algo inmenso y eso alivia.',practica:'10 minutos de cielo (día o noche) sin celu. Ideal en Penco mirando el golfo.'},
{id:'s51',fam:'L',n:'51 · La sombra que también eres',tag:'sombra oscuridad integrar miedo noche',idea:'Mirar tu sombra proyectada o la noche sin pelear enseña que lo oscuro también te pertenece: lo negado se calma cuando se mira.',practica:'De noche, camina 5 minutos sintiendo la oscuridad como manta, no como amenaza. Vía iluminada y acompañado.'},
{id:'s52',fam:'L',n:'52 · El cuarto vacío',tag:'habitacion vacia espacio shunya desapego',idea:'Sentarse en una pieza vacía o imaginarla vacía muestra que el espacio sostiene todo sin esfuerzo: sé como el cuarto, no como los muebles.',practica:'1 minuto imaginando tu pecho como pieza vacía y luminosa.'},
{id:'s53',fam:'L',n:'53 · El agujero luminoso',tag:'punto luz tunel atencion concentrar bindu',idea:'Imaginar un puntito de luz lejana e ir hacia él con la mente reúne toda la atención en una sola dirección.',practica:'Visualiza un punto brillante al fondo y acércate a él 3 minutos.'},
{id:'s54',fam:'L',n:'54 · Disolverse en la niebla',tag:'niebla costa disolverse humo blanco',idea:'En la niebla de Penco los bordes se borran: úsala de maestra e imagina tus bordes borrándose también.',practica:'En mañana nublada, camina lento sintiendo que te mezclas con lo blanco.'},
{id:'s55',fam:'L',n:'55 · El sol del amanecer en la piel',tag:'sol amanecer piel luz damiana sungazing suave',idea:'Recibir el primer sol tibio con ojos cerrados y cara al oriente carga de luz sin mirar directo: la piel también ve.',practica:'5 minutos de sol suave matinal en cara y manos. Nunca mires directo al sol fuerte.'},
{id:'s56',fam:'L',n:'56 · La luna llena dentro',tag:'luna llena frescor mente calma nectar',idea:'Imaginar una luna llena fresca en la coronilla derramando frescor apaga el incendio mental: lo caliente se rinde ante lo fresco.',practica:'Visualiza luna plateada arriba derramando frescura 3 minutos. Ideal en noches de insomnio.'},
{id:'s57',fam:'L',n:'57 · El relámpago interno',tag:'relampago destello insight instante despertar',idea:'A veces una comprensión llega como relámpago. En vez de anotarla al tiro, quédate en su luz 30 segundos: el destello también medita.',practica:'Ante un “¡ajá!”, pausa y habita el destello antes de contarlo.'},
{id:'s58',fam:'L',n:'58 · Mirar sin mirar (visión periférica)',tag:'mirada periferica atencion abierta campo visual',idea:'Abrir la mirada a todo el campo sin fijar nada relaja el control: ves más y fuerzas menos.',practica:'Mira al frente abarcando los bordes con la vista 2 minutos, sin mover ojos.'},
{id:'s59',fam:'L',n:'59 · El espejo que no juzga',tag:'espejo mirarse sin juicio rostro aceptacion',idea:'Mirarte al espejo 1 minuto sin arreglar ni criticar, como mirarías a un niño dormido: el rostro se ablanda y el juez se calla.',practica:'Espejo 1 minuto: solo mirar con cariño neutro, sin frases.'},
{id:'s60',fam:'L',n:'60 · El espacio entre dos objetos',tag:'espacio entre cosas intervalo vacio ver',idea:'Mirar el aire entre la taza y la mano, entre dos árboles: el intervalo también existe y sostiene. Verlo calma la fijación en cosas.',practica:'Elige 2 objetos y contempla el aire entre ellos 2 minutos.'},
{id:'s61',fam:'L',n:'61 · Caer hacia adentro',tag:'caer interior abismo entregarse vertigo',idea:'Imaginar que caes suavemente hacia adentro como en un sueño enseña la entrega: no te agarras, te dejas sostener.',practica:'Acostado, imagina caer lento por un pozo tibio 2 minutos. Si da miedo, vuelve al aire.'},
{id:'s62',fam:'L',n:'62 · El parpadeo cósmico',tag:'parpadeo abrir cerrar ojos aparecer desaparecer',idea:'Abrir y cerrar los ojos lento y notar que el mundo aparece y desaparece muestra su carácter de sueño lúcido: todo viene y va.',practica:'Parpadea muy lento 9 veces notando el aparecer-desaparecer.'},
{id:'s63',fam:'L',n:'63 · Ser el horizonte',tag:'horizonte mar linea fundirse lejania',idea:'Mirar la línea donde el mar se junta con el cielo hasta sentirte esa línea: ni agua ni aire, el encuentro.',practica:'Frente al mar 5 minutos fundiéndote con la línea lejana.'},
{id:'s64',fam:'L',n:'64 · Apagar la luz por dentro',tag:'apagar imagenes mente pantalla negra descanso',idea:'Imaginar que bajas un interruptor y todo se pone negro adentro es dar permiso de descanso a la fábrica de imágenes.',practica:'Ojos cerrados: “apago” y negro total 2 minutos. Si vuelve imagen, apaga de nuevo sin rabia.'},
/* ---- C: CUERPO Y SENTIDOS (65-82) ---- */
{id:'s65',fam:'C',n:'65 · Un sentido por vez',tag:'sentidos uno por vez tacto gusto olfato atencion',idea:'Atender un solo sentido (solo tacto de pies, solo sonidos) devuelve la nitidez: la mente no puede fugarse si el sentido manda.',practica:'Elige 1 sentido y dale 3 minutos de mando total.'},
{id:'s66',fam:'C',n:'66 · El tacto del agua',tag:'agua ducha manos tacto presencia lavar',idea:'Sentir el agua en manos o ducha gota a gota convierte lo cotidiano en templo: el tacto presente lava más que el agua.',practica:'Al lavarte, 1 minuto solo sintiendo temperatura, presión y recorrido.'},
{id:'s67',fam:'C',n:'67 · Comer como primera vez',tag:'comer degustar sabor atencion plena comida',idea:'Masticar lento un bocado notando textura, jugo y cambio de sabor es meditación comestible: el hambre ansiosa se vuelve gratitud.',practica:'Un bocado al día comido en 1 minuto completo de atención.'},
{id:'s68',fam:'C',n:'68 · Oler hasta el fondo',tag:'olor oler respiracion memoria aroma',idea:'Oler algo amado (pan, tierra mojada, boldo) hasta el fondo del pecho abre memoria y calma de un golpe.',practica:'Inhala 3 veces largo un aroma amigo y quédate en lo que trae.'},
{id:'s69',fam:'C',n:'69 · El abrazo que se queda',tag:'abrazo contacto presencia pareja respeto consentimiento',idea:'Abrazar 20 segundos sintiendo respiraciones que se acompasan (con consentimiento y cariño) disuelve corazas mejor que mil palabras.',practica:'Hoy un abrazo de 20 segundos con presencia total. Solo si es bienvenido.'},
{id:'s70',fam:'C',n:'70 · La unión como oración (con respeto)',tag:'union pareja intimidad sagrada consentimiento presencia',idea:'El texto honra la unión amorosa como puerta cuando hay amor, consentimiento y presencia sin apuro ni meta. Lo sagrado es el cuidado mutuo, no la técnica.',practica:'Solo adultos, en pareja y con acuerdo: lentitud, mirada y respiración juntas. Sin metas ni exigencias. Si hay incomodidad, se detiene y se conversa.'},
{id:'s71',fam:'C',n:'71 · El dolor mirado de frente',tag:'dolor observar respiracion umbral cuidado',idea:'Mirar un dolor leve (cansancio, picazón, pena física) respirando alrededor sin historia (“pobrecito yo”) le quita la mitad de su fuerza.',practica:'Ante molestia leve: localízala, respira alrededor 9 veces. Si es intenso o nuevo, consulta salud.'},
{id:'s72',fam:'C',n:'72 · El placer sin culpa',tag:'placer gozo sol tibio comida mar gratitud',idea:'Recibir un placer simple (sol, comida, mar en pies) sin apurarlo ni culparte lo vuelve oración: el gozo presente es generoso.',practica:'Hoy un placer de 2 minutos recibido completo, sin celu.'},
{id:'s73',fam:'C',n:'73 · Caminar sintiendo los pies',tag:'caminar pies planta paso meditacion',idea:'Sentir talón-planta-dedos en cada paso amarra la mente al suelo: no hay rumia que aguante 50 pasos sentidos.',practica:'50 pasos sintiendo cada apoyo. Ideal descalzo en pasto o arena segura.'},
{id:'s74',fam:'C',n:'74 · Acariciar con todo el ser',tag:'tacto mano objeto textura presencia niño mascota',idea:'Tocar una manta, la cabeza de un niño o el lomo de un animal sintiendo cada milímetro despierta ternura sin palabras.',practica:'1 minuto de tacto total con algo o alguien querido (con respeto).'},
{id:'s75',fam:'C',n:'75 · El bostezo total',tag:'bostezo estirar desperezar soltar mandibula',idea:'Bostezar y desperezarse a fondo como un gato suelta mandíbula, hombros y pena contenida: el cuerpo sabe bostezar tristezas.',practica:'Provoca 3 bostezos grandes estirando brazos. Siente el después.'},
{id:'s76',fam:'C',n:'76 · Temblar de frío y de calor',tag:'frio calor piel umbral sentir extremos',idea:'Sentir el frío o calor en la piel sin quejarte de inmediato (con cuidado) te enseña a recibir lo que es.',practica:'30 segundos sintiendo la temperatura tal cual, agradeciendo techo y abrigo.'},
{id:'s77',fam:'C',n:'77 · La postura de montaña',tag:'postura columna erguida quietud cuerpo templo',idea:'Sentarse erguido e inmóvil 5 minutos como montaña: el cuerpo quieto aquieta la mente móvil.',practica:'Espalda digna, quietud total 5 minutos. Si duele, ajusta con cariño.'},
{id:'s78',fam:'C',n:'78 · Mirar las manos como nuevas',tag:'manos mirar asombro cuerpo gratitud',idea:'Mirar tus manos como si las vieras por primera vez (líneas, venas, historia) devuelve asombro por tu herramienta más fiel.',practica:'Mira tus manos 1 minuto y agradéceles 3 trabajos de hoy.'},
{id:'s79',fam:'C',n:'79 · El peso del cuerpo en la tierra',tag:'peso tierra grounding acostarse entregar',idea:'Acostado, sentir cada kilo entregado a la tierra: la gravedad te sostiene gratis desde siempre.',practica:'2 minutos nombrando partes que se entregan: pies, piernas, espalda, cabeza.'},
{id:'s80',fam:'C',n:'80 · El baño de mar consciente',tag:'mar pies ola bautismo frio presencia',idea:'Entrar al mar sintiendo cada ola en tobillos o cuerpo (con seguridad) lava más que el cuerpo: lava el apuro.',practica:'En playa apta y con precaución: 3 olas solo sentidas, sin hablar.'},
{id:'s81',fam:'C',n:'81 · La caricia del viento sur',tag:'viento cara piel sur respiracion',idea:'Pararse al viento y sentirlo en cara y manos como caricia áspera que ordena: el sur de Penco también enseña.',practica:'2 minutos de cara al viento, respirando su ritmo.'},
{id:'s82',fam:'C',n:'82 · Quedarse quieto tras el esfuerzo',tag:'descanso despues ejercicio shavasana silencio',idea:'Tras subir un cerro o barrer la casa, quedarse quieto 2 minutos sintiendo el cuerpo vibrar: el esfuerzo entrega su néctar en el descanso.',practica:'Después de moverte, quietud total 2 minutos recibiendo el latido.'},
/* ---- M: MENTE, SUEÑO E IMAGEN (83-97) ---- */
{id:'s83',fam:'M',n:'83 · Pensamientos como nubes',tag:'pensamientos nubes cielo observar sin pelear',idea:'No empujes pensamientos: míralos cruzar como nubes. Lo que no se toca, pasa solo.',practica:'3 minutos etiquetando apenas “nube” cada idea y volviendo al aire.'},
{id:'s84',fam:'M',n:'84 · Preguntar “¿quién se da cuenta?”',tag:'quien soy testigo conciencia atma vichara',idea:'Ante una ola mental pregunta: ¿quién se da cuenta de esto? La pregunta te saca de la ola a la orilla que mira.',practica:'3 veces al día, ante un enredo, pregunta y quédate en el que mira.'},
{id:'s85',fam:'M',n:'85 · Recordar un sueño al despertar',tag:'sueño recordar diario onirico pewma',idea:'Quedarse quieto 1 minuto al despertar pescando el sueño antes de que se escape entrena la memoria sutil y el asombro.',practica:'Mañana: quieto, repesca 1 imagen y anótala. Puente con 💭 Diario Sueños.'},
{id:'s86',fam:'M',n:'86 · Entrar al sueño despierto',tag:'sueño lucido ensueño imagen dirigir suave',idea:'Imaginar de noche que entras a un lugar amado (bosque, mar calmo) y pasear ahí adormece la mente en belleza.',practica:'Acostado, pasea 5 minutos por tu lugar seguro imaginado.'},
{id:'s87',fam:'M',n:'87 · El recuerdo que duele, mirado',tag:'recuerdo herida perdon observar recapitular',idea:'Traer un recuerdo molesto y mirarlo como película 1 minuto, respirando, sin meterte a actuarlo de nuevo: se achica.',practica:'Solo recuerdos leves. Si desborda, detente y pide apoyo. Puente con 🔁 Recapitulación.'},
{id:'s88',fam:'M',n:'88 · Imaginar lo que deseas y soltarlo',tag:'visualizar deseo soltar apego intencion',idea:'Visualiza 1 minuto tu deseo cumplido con detalle, agradécelo y suéltalo como carta al mar: intención sin aferramiento.',practica:'Visualiza, agradece, suelta. Luego 1 paso hormiga real hoy.'},
{id:'s89',fam:'M',n:'89 · La pantalla en blanco',tag:'mente blanco vaciar lienzo imaginacion',idea:'Imaginar una pantalla blanca donde no se proyecta nada es darle vacaciones al cine interno.',practica:'2 minutos de pantalla blanca. Cada imagen que llegue se borra suave.'},
{id:'s90',fam:'M',n:'90 · Cambiar el tamaño del problema',tag:'problema achicar agrandar perspectiva juego mental',idea:'Imaginar tu problema del tamaño de una arveja y luego del porte de un cerro muestra que el tamaño lo pone tu miedo.',practica:'Juega 1 minuto achicando y agrandando la imagen. Quédate con la arveja y actúa.'},
{id:'s91',fam:'M',n:'91 · El “como si” luminoso',tag:'como si actuar personaje virtud practicar',idea:'Actúa 10 minutos “como si” ya fueras calmo, generoso o valiente: el cuerpo ensaya y la mente aprende por imitación.',practica:'Elige 1 virtud y vívela 10 minutos como obra de teatro sagrada.'},
{id:'s92',fam:'M',n:'92 · Dormirse contando hacia atrás',tag:'dormir contar atras 100 relajacion noche',idea:'Contar de 100 hacia atrás alargando la exhalación apaga la radio mental mejor que pelear con ella.',practica:'100, 99, 98… con aire lento. Si te pierdes, vuelve a 100 sin rabia.'},
{id:'s93',fam:'M',n:'93 · El susto como maestro instantáneo',tag:'susto sorpresa presencia susto portazo',idea:'Un susto leve te trae al presente de golpe. En vez de enojarte, aprovecha ese presente regalado 30 segundos.',practica:'Tras susto sin peligro: 3 respiraciones habitando el “estoy aquí”.'},
{id:'s94',fam:'M',n:'94 · El déjà vu como puerta',tag:'deja vu extrañeza misterio presente',idea:'Esa sensación de “esto ya lo viví” abre una grieta en lo lineal: métete en la extrañeza en vez de explicarla.',practica:'Ante el déjà vu, pausa 30 segundos sintiendo el misterio.'},
{id:'s95',fam:'M',n:'95 · Pensar con el corazón',tag:'corazon pensar sentir decidir intuicion',idea:'Ante una decisión, pregúntale al pecho (apretado o abierto) antes que a la lista de pros y contras: el cuerpo vota primero.',practica:'Mano al pecho ante tu dilema de hoy: ¿se abre o se cierra?'},
{id:'s96',fam:'M',n:'96 · Escribir y quemar (soltar)',tag:'escribir soltar quemar seguro carta duelo',idea:'Escribir lo que pesa y quemarlo con seguridad (o romperlo) es decirle al cuerpo: esto ya pasó.',practica:'Escribe 10 líneas, rompe o quema en lugar seguro, ventila. Luego agua y caminar.'},
{id:'s97',fam:'M',n:'97 · El futuro como semilla',tag:'futuro semilla intencion sembrar luna',idea:'Imaginar el mes que viene como semilla en tu mano (no como amenaza) y sembrarla con 1 acción de hoy.',practica:'Nombra tu semilla del mes y haz hoy su primer riego: 10 minutos.'},
/* ---- G: CORAZÓN Y ASOMBRO (98-112) ---- */
{id:'s98',fam:'G',n:'98 · Asombro de principiante',tag:'asombro principiante primera vez mirar nuevo',idea:'Mira algo viejo (tu calle, tus manos, el pan) como si fuera la primera vez: el asombro es la meditación más corta.',practica:'Elige 1 cosa diaria y mírala 1 minuto como extranjera.'},
{id:'s99',fam:'G',n:'99 · Gracias antes de comer',tag:'gracias comida gratitud bendecir alimento',idea:'Agradecer en silencio a manos, tierra y lluvia antes de comer convierte el almuerzo en fiesta humilde.',practica:'Hoy 10 segundos de gracias real antes de comer. Puente con 📓 Gratitud.'},
{id:'s100',fam:'G',n:'100 · Ofrecer lo que haces',tag:'ofrecer trabajo servicio dedicar accion amor',idea:'Dedicar tu aseo, tu pega o tu cuidado a alguien que amas (“esto por ti”) quita el peso del deber.',practica:'Hoy dedica 1 tarea: “esto lo hago por ___”.'},
{id:'s101',fam:'G',n:'101 · Llorar hasta quedar claro',tag:'llorar lagrimas limpieza permitir pena',idea:'Llorar sin cortarlo ni explicarlo lava por dentro; después queda una claridad que ningún consejo da.',practica:'En lugar seguro, permite el llanto 5 minutos. Pañuelo, agua y abrigo después.'},
{id:'s102',fam:'G',n:'102 · Reír con todo el vientre',tag:'risa vientre carcajada soltar diafragma',idea:'Reír hasta que duela la guata suelta diafragma y pena vieja: la risa es llanto dado vuelta.',practica:'Busca hoy algo que te haga reír de verdad 3 minutos.'},
{id:'s103',fam:'G',n:'103 · Pedir perdón por dentro',tag:'perdon pedir soltar culpa reparar humildad',idea:'Decir por dentro “perdóname, lo hice lo mejor que supe” ante quien heriste (viva o no) ablanda el nudo aunque no puedas hablarle.',practica:'1 perdón interno hoy. Si es posible y sano, repara con 1 acción.'},
{id:'s104',fam:'G',n:'104 · Perdonar por dentro',tag:'perdonar soltar rencor liberar corazon',idea:'Decir “te suelto, me suelto” ante quien te hirió no aprueba lo hecho: te devuelve tu energía.',practica:'1 frase de soltura hoy. Si la herida es grande, pide apoyo, no te apures.'},
{id:'s105',fam:'G',n:'105 · Amar sin pedir nada 5 minutos',tag:'amar sin pedir devocion entrega gratuita',idea:'Amar a alguien, un árbol o el mar 5 minutos sin esperar nada de vuelta es probar el amor en su forma limpia.',practica:'Elige un ser y ámalo en silencio 5 minutos, sin mensaje ni prueba.'},
{id:'s106',fam:'G',n:'106 · Ponerse en los zapatos del otro',tag:'empatia otro zapatos compasion escuchar',idea:'Imaginar 1 minuto el día del otro desde adentro (cansancio, miedo, apuro) derrite el juicio.',practica:'Ante un roce de hoy: 1 minuto en sus zapatos antes de responder.'},
{id:'s107',fam:'G',n:'107 · Servir en secreto',tag:'servir secreto ayudar anonimo dar',idea:'Hacer un bien sin que se sepa (ordenar algo ajeno, dejar pan, recoger basura) alegra sin inflar el ego.',practica:'1 bien secreto hoy. No lo cuentes: guárdalo como brasa.'},
{id:'s108',fam:'G',n:'108 · La pregunta de Devi',tag:'pregunta quien soy realidad devi shiva asombro',idea:'Devi pregunta: ¿quién eres, qué es esto real? Hacerte la pregunta sin responderla abre espacio sagrado en plena cocina.',practica:'Hoy pregúntate 3 veces “¿qué es esto real?” y quédate en silencio 10 segundos.'},
{id:'s109',fam:'G',n:'109 · El “sí” total a este momento',tag:'si aceptar momento entrega amor fati',idea:'Decirle “sí” por dentro a este momento tal cual (ruido, loza, cansancio) termina la guerra con lo que es.',practica:'Ante lo molesto de hoy: “sí a esto” + 3 respiraciones.'},
{id:'s110',fam:'G',n:'110 · Despedirse como maestro',tag:'despedida cada encuentro impermanencia amar',idea:'Despedirte de cada encuentro como si fuera valioso (mirada, gracias) vuelve cada día menos automático.',practica:'Hoy 1 despedida con presencia: mirada + gracias + buen deseo.'},
{id:'s111',fam:'G',n:'111 · El altar mínimo',tag:'altar piedra vela flor intencion casa',idea:'Una piedra, una vela o una flor en un rincón recuerda lo sagrado sin templos caros: lo simple sostiene.',practica:'Arma tu rincón mínimo hoy. Míralo 1 minuto al pasar.'},
{id:'s112',fam:'G',n:'112 · Disolverse en Bhairava (la vastedad)',tag:'bhairava vastedad disolverse todo conciencia fundirse',idea:'Cierre del texto: deja que todo (aire, sonido, luz, cuerpo, mente, amor) se funda en una vastedad que respira. No haces nada: eres hecho.',practica:'5 minutos: suelta cada puerta en la siguiente y quédate en lo vasto. Si te pierdes, vuelve a la respiración (sutra 1).'}
];
function vbtSutra(id) { for (var i = 0; i < VBT_SUTRAS.length; i++) if (VBT_SUTRAS[i].id === id) return VBT_SUTRAS[i]; return null; }

/* Puertas madre (prácticas) */
var VBT_PRACTICAS = [
  { id: 'pausa', n: 'Pausa entre respiros (4-2-4-2)', ico: '🌬️', tiempo: '3 min, 1-2 veces al día',
    pasos: '1) Inhala 4 tiempos. 2) Pausa 2 habitando lo lleno. 3) Exhala 4 soltando todo. 4) Pausa 2 habitando lo vacío. 9 rondas. Hay botón con tiempo abajo.',
    tip: 'Puerta 1 y 2. Ideal antes de decidir o al despertar. Puente: 🌬️ Respiración.' },
  { id: 'escucha', n: 'Escucha hasta el cero', ico: '🔔', tiempo: '3 min',
    pasos: 'Produce un sonido largo (olla, aplauso suave, vocal) y síguelo hasta que muera del todo. Quédate 30 segundos en el silencio que deja. Repite 3 veces.',
    tip: 'Puertas 31-36. Entrena atención sin esfuerzo.' },
  { id: 'oscuridad', n: 'Mirada en la oscuridad amiga', ico: '🌌', tiempo: '3 min ojos cerrados',
    pasos: 'Ojos cerrados, mira la pantalla oscura sin buscar formas. Si vienen imágenes, déjalas cruzar como nubes. Termina abriendo lento y mirando lejos.',
    tip: 'Puertas 47-49. No presiones los ojos; si mareas, abre y respira.' },
  { id: 'sentido', n: 'Baño de un sentido', ico: '🤲', tiempo: '3 min',
    pasos: 'Elige 1 sentido (pies al caminar, manos al lavar, oídos al mate). Dale mando total 3 minutos. Todo lo demás es fondo.',
    tip: 'Puertas 65-68. La más fácil para días dispersos.' },
  { id: 'asombro', n: 'Asombro de 1 minuto', ico: '✨', tiempo: '1 min',
    pasos: 'Mira algo cotidiano como primera vez: describe por dentro 5 detalles nuevos. Termina con gracias en silencio.',
    tip: 'Puerta 98. Antídoto contra la rutina y el mal humor.' },
  { id: 'corazon', n: 'Mano al corazón', ico: '💛', tiempo: '3 min',
    pasos: 'Mano al pecho. Inhala al corazón, exhala desde el corazón. Nombra 1 herida y 1 gratitud sin analizar. Quédate en el latido.',
    tip: 'Puertas 20, 95, 99-105. Ideal noches revueltas.' },
  { id: 'entrecejo', n: 'Luz en el entrecejo (suave)', ico: '🪔', tiempo: '2 min',
    pasos: 'Ojos cerrados, mirada suave al entrecejo como quien mira una luciérnaga lejana. Si tensa, baja al corazón. 2 minutos máximo.',
    tip: 'Puerta 19. Suave siempre: sin apretar ojos ni aguantar aire.' },
  { id: 'stop', n: 'STOP tántrico de 1 minuto', ico: '⏸️', tiempo: '1 min, 3 veces al día',
    pasos: 'Al sonar tu alarma: frena todo, siente pies + aire + 1 sonido + 1 latido. Pregunta: “¿quién se da cuenta?”. Sigue.',
    tip: 'Puerta 84. La bisagra que une las 112 con tu día real.' }
];

var VBT_TEST = [
  { c: 'R', txt: 'Noto mi respiración varias veces al día sin proponérmelo.' },
  { c: 'F', txt: 'Mi cabeza no para: repaso y planeo incluso de noche.' },
  { c: 'C', txt: 'Disfruto sentir el cuerpo: caminar, agua, comida, abrazo.' },
  { c: 'S', txt: 'Me conmueven la música, el silencio o un mantra.' },
  { c: 'M', txt: 'Recuerdo sueños o tengo imaginación muy viva.' },
  { c: 'G', txt: 'Siento gratitud o ternura con facilidad.' },
  { c: 'R', txt: 'Ante el estrés, respirar hondo me resulta natural.' },
  { c: 'F', txt: 'Reviso el celu a cada rato por si algo se me escapa.' },
  { c: 'C', txt: 'Noto rápido el cansancio, el hambre o la tensión corporal.' },
  { c: 'S', txt: 'Escucho hasta el final los sonidos (lluvia, olas, canciones).' },
  { c: 'M', txt: 'Me pierdo en pensamientos o fantasías a menudo.' },
  { c: 'G', txt: 'Me nace cuidar, agradecer o pedir perdón.' },
  { c: 'R', txt: 'Las pausas (silencio, vacío, detención) me calman.' },
  { c: 'F', txt: 'Me cuesta estar quieto: me pica el cuerpo o la mente.' },
  { c: 'C', txt: 'Aprendo mejor haciendo y tocando que leyendo.' },
  { c: 'S', txt: 'El ruido me afecta mucho (me carga o me eleva).' },
  { c: 'M', txt: 'Preguntas como “¿quién soy?” me intrigan de verdad.' },
  { c: 'G', txt: 'La belleza (un cielo, un niño, un canto) me detiene.' },
  { c: 'F', txt: 'Empiezo meditaciones y las dejo a los pocos días.' },
  { c: 'F', txt: 'Me comparo con otros y siento que voy atrasado.' }
];
var VBT_LIKERT = [
  { v: 0, t: 'Nunca' }, { v: 1, t: 'A veces' }, { v: 2, t: 'A menudo' }, { v: 3, t: 'Muy cierto' }
];
var VBT_PUERTAS = {
  R: { nombre: 'Respiro · La pausa', ico: '🌬️', sutras: '1 al 16', desc: 'Tu puerta es el aire y su pausa. Calmas la mente volviendo a la respiración y al hueco entre aires. Eres de ritmo: te ordena lo simple y repetido.',
       entrena: 'Pausa 4-2-4-2 cada mañana + 1 STOP al día. Sutras madre: 1, 2, 11. Evita retener el aire con fuerza.' },
  S: { nombre: 'Sonido · El silencio', ico: '🔔', sutras: '31 al 46', desc: 'Tu puerta es escuchar. Un sonido seguido hasta el cero te lleva al silencio sin pelear con la mente. Sensible al ambiente: el ruido te mueve.',
       entrena: 'Escucha hasta el cero + zumbido abeja en la noche. Sutras madre: 31, 32, 35. Cuida tus oídos del ruido fuerte.' },
  C: { nombre: 'Cuerpo · Los sentidos', ico: '🤲', sutras: '65 al 82 (y energía 17-30)', desc: 'Tu puerta es el cuerpo: tacto, gusto, pies, abrazo. Entiendes con la piel. Te pierdes cuando vives solo en la cabeza.',
       entrena: 'Baño de un sentido + caminar 50 pasos sentidos. Sutras madre: 65, 67, 73. Atiende señales del cuerpo temprano.' },
  M: { nombre: 'Mente · Sueño e imagen', ico: '💭', sutras: '83 al 97', desc: 'Tu puerta es la propia mente: observar pensamientos, sueños e imágenes hasta que se disuelven. Curioso y visionario; riesgo: enredarte.',
       entrena: 'Nubes + pregunta “¿quién se da cuenta?” + anotar 1 sueño. Sutras madre: 83, 84, 85. Escribe para no girar en círculo.' },
  G: { nombre: 'Corazón · Asombro', ico: '💛', sutras: '98 al 112', desc: 'Tu puerta es el corazón: gratitud, perdón, servicio y asombro. Amas fácil y eso te ordena. Riesgo: darte entero y vaciarte.',
       entrena: 'Asombro 1 min + mano al corazón de noche. Sutras madre: 98, 99, 105. Da con orilla: 1 bien secreto, no diez.' }
};

var VBT_LUNAS = [
  'Lunas 1-3 (Pukem · invierno): oscuridad amiga + luna interior. Sutras 47, 56 y 16. Pregunta: ¿qué vacío necesito habitar?',
  'Lunas 4-6 (Pewu · primavera): respiro y sentidos que despiertan. Sutras 1, 65 y 98. Riega 1 puerta 10 min al día.',
  'Lunas 7-9 (Walung · verano): mar, abrazo y servicio. Sutras 80, 69 y 107. Comparte 1 bien secreto por semana.',
  'Lunas 10-13 (Rimu · otoño): soltar y fundirse. Sutras 83, 96 y 112. Relee tu diario y elige 1 sutra madre.'
];

/* ============================================================
   DIÁLOGO
   ============================================================ */
function famChips() {
  return Object.keys(VBT_FAMS).map(function (k) {
    var f = VBT_FAMS[k];
    return '<button type="button" class="btn vbt-fam" data-fam="' + k + '" style="width:auto;font-size:11px">' + f.ico + ' ' + esc(f.n) + '</button>';
  }).join('');
}
function buildDialog() {
  var sutGrid = VBT_SUTRAS.map(function (it) {
    var f = VBT_FAMS[it.fam];
    return '<button type="button" class="btn vbt-sutra-card" data-sutra="' + it.id + '" data-fam="' + it.fam + '" style="text-align:left;height:auto;padding:8px">' +
      '<b style="font-size:11px">' + esc(it.n) + '</b><br>' +
      '<span class="muted" style="font-size:10px">' + f.ico + ' ' + esc(f.n) + '</span></button>';
  }).join('');

  var testHTML = VBT_TEST.map(function (q, i) {
    var opts = VBT_LIKERT.map(function (o) {
      return '<label class="check-row" style="margin:0;font-size:12px"><input type="radio" name="vbtQ' + i + '" value="' + o.v + '"> ' + o.t + '</label>';
    }).join('');
    return '<div class="menstrual-card" style="margin-bottom:8px"><b style="font-size:12px">' + (i + 1) + '. ' + esc(q.txt) + '</b>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' + opts + '</div></div>';
  }).join('');

  var practHTML = VBT_PRACTICAS.map(function (p) {
    return '<div class="menstrual-card"><h4>' + p.ico + ' ' + esc(p.n) + '</h4>' +
      '<p class="muted" style="font-size:11px">⏱ ' + esc(p.tiempo) + '</p>' +
      '<p style="font-size:12px">' + esc(p.pasos) + '</p>' +
      '<p class="muted" style="font-size:12px">💡 ' + esc(p.tip) + '</p>' +
      '<button type="button" class="btn vbt-pract-add" data-p="' + esc(p.n) + '" style="width:auto">+ Anotar en mi diario de hoy</button></div>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabVbtGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabVbtSutras" class="btn" style="width:auto">📜 112 Sutras</button>' +
    '<button type="button" id="tabVbtPract" class="btn" style="width:auto">🛠️ Prácticas</button>' +
    '<button type="button" id="tabVbtTest" class="btn" style="width:auto">📝 Test de puerta</button>' +
    '<button type="button" id="tabVbtCamino" class="btn" style="width:auto">🌱 Mi Camino</button></div>' +

    '<div id="vbtGuia">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🕉️ ¿Qué es el Vigyan Bhairav Tantra?</h4>' +
    '<p class="muted" style="font-size:12px;line-height:1.6"><b>Vigyan</b> = conocer penetrando · <b>Bhairava</b> = la conciencia vasta y terrible-amorosa (Shiva) · <b>Tantra</b> = tejido, método. El texto es un diálogo: la diosa <b>Devi (Parvati)</b> pregunta “¿qué es lo real, amado?” y <b>Bhairava (Shiva)</b> responde no con teoría sino con <b>112 puertas de meditación</b>: “prueba esto y mira”. Es del linaje tántrico de Cachemira (siglos VII-X aprox.), breve, poético y práctico.</p>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">Su idea en una línea: <b>lo sagrado está en lo ordinario</b> —el aire, el bostezo, la ola, el abrazo, el susto— si lo miras con presencia total. No promete poderes: promete dejar de estar dormido en tu propio día.</p></div>' +
    '<div class="fishing-grid" style="margin-top:10px">' +
    '<div class="menstrual-card"><h4>🗺️ El mapa: 7 familias (112 puertas)</h4>' +
    '<p class="muted" style="font-size:12px"><b>🌬️ Respiro y pausa (1-16):</b> la pausa entre aires. <b>⚡ Energía y centro (17-30):</b> hormigueo, latido, calor. <b>🔔 Sonido y silencio (31-46):</b> seguir el sonido hasta el cero. <b>🌌 Luz, sombra y espacio (47-64):</b> oscuridad, cielo, horizonte. <b>🤲 Cuerpo y sentidos (65-82):</b> comer, caminar, abrazar. <b>💭 Mente, sueño e imagen (83-97):</b> nubes, sueños, “¿quién se da cuenta?”. <b>💛 Corazón y asombro (98-112):</b> gracias, perdón, entrega. No se hacen en orden: se elige 1 y se vive semanas.</p></div>' +
    '<div class="menstrual-card"><h4>📚 Cómo leer los 112 sin enredarse</h4>' +
    '<p class="muted" style="font-size:12px">1) Haz el <b>test de puerta</b> 📝 o elige la familia que más te tiró. 2) Toma <b>1 solo sutra madre</b> por 1-2 semanas (ej: el 1, el 31, el 65 o el 98). 3) 5-10 min diarios bastan. 4) Anota 1 línea en tu diario. 5) Si no pasa nada, cambia de puerta sin culpa: el texto mismo dice que hay 112 porque somos distintos. Atajo: <b>1 → 31 → 65 → 83 → 98 → 112</b> (una por familia).</p></div></div>' +
    '<details class="menstrual-details"><summary>🚶 ¿Cómo practicar sin gurú? (rutina mínima)</summary>' +
    '<p class="muted" style="font-size:12px"><b>Mañana:</b> 3 min de tu puerta (pausa, escucha o sentido) + 1 STOP. <b>Día:</b> 1 asombro + 1 baño de sentido. <b>Noche:</b> mano al corazón o luna interior + 1 línea de diario. <b>Por luna:</b> 1 sutra madre nuevo + releer diario. Sin posturas raras, sin aguantar el aire hasta doler, sin pagar caro por “iniciaciones exprés”.</p></details>' +
    '<details class="menstrual-details"><summary>⚠️ Cuidados (léeme)</summary>' +
    '<p class="muted" style="font-size:12px">✅ Sabiduría educativa, no religión ni terapia. ✅ Retenciones y energías: <b>suave siempre</b>; si mareas, duele o angustia, abre ojos, camina, toma agua y detente. ✅ Unión amorosa (sutra 70): solo adultos, con consentimiento y cuidado; nada reemplaza respeto y conversación. ✅ No reemplaza médico, terapeuta ni red: con pena, ansiedad fuerte o crisis pide apoyo (CESFAM, *4141 en Chile 24 h). Desconfía de quien cobre obediencia o “poderes”.</p></details>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌙 Tantra × 13 lunas (Penco)</h4><div id="vbtLunasBox"></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">Puentes dentro de la app: 🌬️ <b>Respiración</b> (pausa) · 🎯 <b>Disciplina</b> (volver al centro) · 📿 <b>Métodos</b> (ficha Tantra) · 💭 <b>Sueños</b> (puerta 85) · 📓 <b>Gratitud</b> (puerta 99).</p></div>' +
    '</div>' +

    '<div id="vbtSutras" class="hidden">' +
    '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="vbtQ" placeholder="ej: pausa, sonido, abrazo, sueño, luna, perdón..." maxlength="40"></label></div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0"><button type="button" class="btn vbt-fam" data-fam="todas" style="width:auto;font-size:11px">🌐 Todas (112)</button>' + famChips() + '</div>' +
    '<div id="vbtCount" class="muted" style="font-size:11px"></div>' +
    '<div id="vbtGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px;max-height:300px;overflow-y:auto">' + sutGrid + '</div>' +
    '<div id="vbtDetalle" class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><p class="muted">Toca un sutra para ver su ficha completa 👆 (empezar por 1, 31, 65, 98 u 112 es buena idea).</p></div></div>' +

    '<div id="vbtPract" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌬️ Pausa guiada — 3 minutos</h4>' +
    '<p class="muted" style="font-size:12px">Inhala 4 · pausa 2 · exhala 4 · pausa 2. El botón marca el tiempo; al terminar anota tu brecha del día.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button type="button" id="vbtRespiraBtn" class="btn btn-accent" style="width:auto">▶ Pausar ahora (3 min)</button>' +
    '<span id="vbtRespiraMsg" class="muted" style="font-size:12px"></span></div>' +
    '<div class="conv-row" style="margin-top:8px"><label>Mi sutra madre de estas semanas <input type="text" id="vbtSutraHoy" placeholder="ej: 1 · la pausa entre dos respiros" maxlength="80"></label></div>' +
    '<div class="conv-row"><label>Lo que noté hoy… <input type="text" id="vbtNotoHoy" placeholder="ej: la pausa de abajo me calma más" maxlength="140"></label>' +
    '<label>Mi brecha (minutos de presencia)… <input type="text" id="vbtMinHoy" placeholder="ej: 5 min pausa + 1 STOP" maxlength="100"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap;gap:8px"><button type="button" id="vbtPractSave" class="btn btn-accent" style="width:auto">💾 Guardar día de práctica</button>' +
    '<button type="button" id="vbtGoRespira" class="btn" style="width:auto">🌬️ Ir a Respiración</button></div></div>' +
    practHTML + '</div>' +

    '<div id="vbtTest" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📝 Test: ¿cuál es tu puerta? (20 afirmaciones)</h4>' +
    '<p class="muted" style="font-size:12px">Responde según <b>cómo eres casi siempre</b>. Escala: Nunca (0) · A veces (1) · A menudo (2) · Muy cierto (3). ~5 minutos. Mide tu puerta natural <b>🌬️ Respiro · 🔔 Sonido · 🤲 Cuerpo · 💭 Mente · 💛 Corazón</b> + tu <b>nivel de dispersión 🌪️</b> (F). <b>No es diagnóstico</b>: es brújula para elegir por dónde entrar.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="vbtTestReset" class="btn" style="width:auto">↺ Limpiar</button>' +
    '<button type="button" id="vbtTestCalc" class="btn btn-accent" style="width:auto">📊 Ver mi resultado</button></div>' +
    '<div id="vbtProgreso" class="muted" style="font-size:11px;margin-top:6px"></div></div>' +
    '<div id="vbtTestBox" style="margin-top:10px">' + testHTML + '</div>' +
    '<div id="vbtResultado" class="menstrual-card hidden" style="margin-top:10px;border-color:var(--gold)"></div></div>' +

    '<div id="vbtCamino" class="hidden">' +
    '<div class="menstrual-grid"><div class="menstrual-card" style="border-color:var(--gold)"><h4>🌱 Mi puerta</h4>' +
    '<div class="conv-row"><label>Mi puerta natural <select id="vbtMiPuerta"><option value="">— sin definir —</option><option value="R">🌬️ Respiro · La pausa</option><option value="S">🔔 Sonido · El silencio</option><option value="C">🤲 Cuerpo · Los sentidos</option><option value="M">💭 Mente · Sueño e imagen</option><option value="G">💛 Corazón · Asombro</option></select></label></div>' +
    '<div id="vbtMiPuertaBox" style="margin-top:6px"></div></div>' +
    '<div class="menstrual-card"><h4>📓 Diario de la brecha</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="vbtDiaFecha"></label></div>' +
    '<label>Hoy en mi práctica… (sutra + lo notado) <input type="text" id="vbtDiaTxt" placeholder="ej: s31 seguir el sonido: el silencio posterior duró más" maxlength="140"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="vbtDiaAdd" class="btn btn-accent" style="width:auto">+ Guardar hoy</button></div>' +
    '<div id="vbtDiaList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕉️ Mis días de práctica (racha de presencia)</h4><div id="vbtPractsBox"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕘 Historial de tests</h4><div id="vbtHistBox"></div></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap;gap:8px">' +
    '<span id="vbtStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="vbtShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="vbtToNote" class="btn" style="width:auto">📝 Llevar a nota de hoy</button>' +
    '<button type="button" id="vbtClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar todo</button></span></div></div>';

  makeDialog('vigyanDialog', '🕉️ Vigyan Bhairav · las 112 puertas',
    'Devi pregunta y Bhairava responde con 112 meditaciones: elige 1 puerta (aire, sonido, cuerpo, mente o corazón) y vívela semanas. Todo <b>privado y local</b>.',
    body);
}

function renderLunasBox() {
  var box = $('vbtLunasBox'); if (!box) return;
  box.innerHTML = VBT_LUNAS.map(function (t) {
    return '<div class="si-card"><p>' + esc(t) + '</p></div>';
  }).join('');
}

function renderDetalle(id) {
  var box = $('vbtDetalle'); if (!box) return;
  var t = vbtSutra(id); if (!t) return;
  var e = store();
  var fav = e.favs.indexOf(id) >= 0;
  var f = VBT_FAMS[t.fam];
  var num = parseInt(id.slice(1), 10);
  var prev = num > 1 ? 's' + (num - 1) : null;
  var next = num < 112 ? 's' + (num + 1) : null;
  box.innerHTML =
    '<h4 style="color:var(--gold)">' + esc(t.n) + '</h4>' +
    '<p class="muted" style="font-size:11px">' + f.ico + ' Familia: <b>' + esc(f.n) + '</b> · ' + esc(f.desc) + '</p>' +
    '<p style="font-size:12px;line-height:1.6">' + esc(t.idea) + '</p>' +
    '<div class="si-card"><h4>✏️ Práctica de hoy</h4><p>' + esc(t.practica) + '</p></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
    '<button type="button" class="btn" id="vbtFavBtn" style="width:auto">' + (fav ? '★ Quitar de favoritas' : '☆ Marcar favorita') + '</button>' +
    '<button type="button" class="btn btn-accent" id="vbtHoyBtn" style="width:auto">✓ Practicar este hoy</button>' +
    (prev ? '<button type="button" class="btn" id="vbtPrevBtn" style="width:auto">◀ ' + (num - 1) + '</button>' : '') +
    (next ? '<button type="button" class="btn" id="vbtNextBtn" style="width:auto">' + (num + 1) + ' ▶</button>' : '') + '</div>';
  var fb = $('vbtFavBtn');
  if (fb) fb.onclick = function () {
    var d = store();
    var i = d.favs.indexOf(id);
    if (i >= 0) d.favs.splice(i, 1); else d.favs.push(id);
    save(); renderDetalle(id); renderCount($('vbtQ') ? $('vbtQ').value : '');
  };
  var hb = $('vbtHoyBtn');
  if (hb) hb.onclick = function () {
    var k = todayKey();
    var d = store();
    d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🕉️ Hoy practico: ' + t.n;
    save('Sutra llevado a tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
  };
  var pb = $('vbtPrevBtn');
  if (pb && prev) pb.onclick = function () { renderDetalle(prev); };
  var nb = $('vbtNextBtn');
  if (nb && next) nb.onclick = function () { renderDetalle(next); };
  try { box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
}

function filterSutras() {
  var q = (($('vbtQ') || {}).value || '').toLowerCase();
  renderCount(q);
  var cards = document.querySelectorAll('#vbtGrid .vbt-sutra-card');
  var activeFam = window._vbtFam || 'todas';
  cards.forEach(function (card) {
    var t = vbtSutra(card.dataset.sutra);
    if (!t) return;
    var okFam = (activeFam === 'todas' || t.fam === activeFam);
    var hay = ((t.n + ' ' + t.tag + ' ' + t.idea + ' ' + t.practica + ' ' + VBT_FAMS[t.fam].n).toLowerCase().indexOf(q) >= 0);
    card.style.display = (okFam && hay) ? '' : 'none';
  });
}
function renderCount(q) {
  var box = $('vbtCount'); if (!box) return;
  q = (q || '').toLowerCase();
  var activeFam = window._vbtFam || 'todas';
  var list = VBT_SUTRAS.filter(function (t) {
    var okFam = (activeFam === 'todas' || t.fam === activeFam);
    if (!okFam) return false;
    if (!q) return true;
    return ((t.n + ' ' + t.tag + ' ' + t.idea).toLowerCase().indexOf(q) >= 0);
  });
  var e = store();
  box.textContent = '🕉️ 112 puertas · mostrando ' + list.length + ' · ' + e.favs.length + ' favorita(s). Filtra por familia o busca (ej: pausa, luna, abrazo, sueño).';
}

function calcTest() {
  var sc = { R: 0, S: 0, C: 0, M: 0, G: 0, F: 0 };
  var contestadas = 0;
  for (var i = 0; i < VBT_TEST.length; i++) {
    var sel = document.querySelector('input[name="vbtQ' + i + '"]:checked');
    if (sel) { contestadas++; sc[VBT_TEST[i].c] += +sel.value; }
  }
  return { sc: sc, contestadas: contestadas };
}
function updateProgreso() {
  var r = calcTest();
  var box = $('vbtProgreso');
  if (box) box.textContent = r.contestadas + ' / ' + VBT_TEST.length + ' respondidas' + (r.contestadas < VBT_TEST.length ? ' — responde todas para una brújula fiel' : ' ✓ lista para calcular');
}
function showResultado(sc) {
  var box = $('vbtResultado'); if (!box) return;
  var arr = [{ k: 'R', p: sc.R }, { k: 'S', p: sc.S }, { k: 'C', p: sc.C }, { k: 'M', p: sc.M }, { k: 'G', p: sc.G }];
  arr.sort(function (a, b) { return b.p - a.p; });
  var max = Math.max(arr[0].p, 1);
  var dom = arr[0].k;
  var dis = sc.F;
  var disTxt = dis <= 5 ? 'Serena: te dispersas poco. Sostén con 1 puerta diaria.' : dis <= 9 ? 'Media: dispersión frecuente. 1 STOP + 1 puerta corta cada día.' : 'Alta: mucha fuga mental. Parte por lo más corporal (puertas 65, 73 o 1) + caminata, sin exigirte todo.';
  box.classList.remove('hidden');
  box.innerHTML = '<h4>📊 Tu brújula (sin guardar)</h4>' +
    '<p class="muted" style="font-size:11px">Dispersión (F): máximo 15 — mientras más alto, más fuga mental. Puertas: puntaje por afinidad.</p>' +
    arr.map(function (a) {
      var c = VBT_PUERTAS[a.k];
      var pct = Math.round(a.p / max * 100);
      var isTop = dom === a.k;
      return '<div style="display:flex;align-items:center;gap:8px;margin:4px 0">' +
        '<span style="min-width:150px;font-size:12px"><b>' + c.ico + ' ' + esc(c.nombre) + '</b></span>' +
        '<span style="flex:1;background:var(--panel);border:1px solid var(--line);border-radius:6px;height:14px;position:relative;overflow:hidden">' +
        '<span style="display:block;height:100%;width:' + pct + '%;background:' + (isTop ? 'var(--gold)' : 'var(--accent)') + ';opacity:' + (isTop ? '1' : '.55') + '"></span></span>' +
        '<b style="min-width:30px;text-align:right">' + a.p + '</b></div>';
    }).join('') +
    '<div class="si-card" style="margin-top:8px"><h4>' + VBT_PUERTAS[dom].ico + ' Tu puerta: ' + esc(VBT_PUERTAS[dom].nombre) + ' <span class="muted" style="font-size:11px">(sutras ' + esc(VBT_PUERTAS[dom].sutras) + ')</span></h4>' +
    '<p>' + esc(VBT_PUERTAS[dom].desc) + '</p><p><b>Entrena así:</b> ' + esc(VBT_PUERTAS[dom].entrena) + '</p>' +
    '<p class="muted">🌪️ Dispersión: <b>' + dis + '/15</b> — ' + esc(disTxt) + '</p></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn btn-accent" id="vbtSaveTest" style="width:auto">💾 Guardar este test</button>' +
    '<button type="button" class="btn" id="vbtSetPuerta" style="width:auto">✓ Mi puerta: ' + esc(VBT_PUERTAS[dom].nombre) + '</button>' +
    '<button type="button" class="btn" id="vbtReadSutra" style="width:auto">📖 Ir a mi primer sutra</button></div>';
  var sv = $('vbtSaveTest');
  if (sv) sv.onclick = function () {
    var d = store();
    d.tests.push({ id: uid('t'), fecha: todayKey(), R: sc.R, S: sc.S, C: sc.C, M: sc.M, G: sc.G, F: sc.F, dom: dom });
    save('Test guardado ✓'); renderHist(); renderStats();
  };
  var st = $('vbtSetPuerta');
  if (st) st.onclick = function () {
    var d = store(); d.miPuerta = dom; save('Tu puerta guardada ✓');
    syncMiPuerta(); renderMiPuertaBox(); renderStats(); switchTab('Camino');
  };
  var ri = $('vbtReadSutra');
  if (ri) ri.onclick = function () {
    var map = { R: 's1', S: 's31', C: 's65', M: 's83', G: 's98' };
    switchTab('Sutras'); renderDetalle(map[dom] || 's1');
  };
  try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}

function syncMiPuerta() {
  var sel = $('vbtMiPuerta'); if (!sel) return;
  sel.value = store().miPuerta || '';
}
function renderMiPuertaBox() {
  var box = $('vbtMiPuertaBox'); if (!box) return;
  var k = store().miPuerta || '';
  if (!k || !VBT_PUERTAS[k]) { box.innerHTML = '<p class="muted" style="font-size:12px">Aún sin definir. Haz el test 📝 o elígela arriba: es tu entrada, no tu jaula (las 112 siguen abiertas).</p>'; return; }
  var c = VBT_PUERTAS[k];
  box.innerHTML = '<div class="chip" style="display:block;white-space:normal;line-height:1.5"><b>' + c.ico + ' ' + esc(c.nombre) + '</b> <span class="muted" style="font-size:11px">(sutras ' + esc(c.sutras) + ')</span><br>' +
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
  var box = $('vbtPractsBox'); if (!box) return;
  var d = store().practs || [];
  var ult7 = d.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 7);
  box.innerHTML = '<p class="muted" style="font-size:11px">🕉️ Racha: <b>' + rachaPracts() + ' días</b> · ' + d.length + ' día(s) de práctica.</p>' +
    (ult7.length ? ult7.map(function (r) {
      return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b><br>' +
        (r.sutra ? '📜 ' + esc(r.sutra) + '<br>' : '') + (r.noto ? '👁 ' + esc(r.noto) + '<br>' : '') + (r.minutos ? '⏱ ' + esc(r.minutos) : '') + '</span>' +
        '<button type="button" class="btn btn-icon vbt-pract-del" data-id="' + r.id + '">✕</button></div>';
    }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin días aún. Guarda tu primer día de práctica arriba 🕉️.</p>');
  box.querySelectorAll('.vbt-pract-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.practs = e.practs.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderPracts(); renderStats(); };
  });
}
function renderDiario() {
  var box = $('vbtDiaList'); if (!box) return;
  var d = store().diario || {};
  var keys = Object.keys(d).sort().reverse().slice(0, 30);
  if (!keys.length) { box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin registros. 1 línea basta: sutra + lo notado.</p>'; return; }
  box.innerHTML = keys.map(function (k) {
    return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(k) + '</b><br>' + esc(d[k]) + '</span>' +
      '<button type="button" class="btn btn-icon vbt-dia-del" data-k="' + esc(k) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.vbt-dia-del').forEach(function (x) {
    x.onclick = function () { var e = store(); delete e.diario[x.dataset.k]; save(); renderDiario(); renderStats(); };
  });
}
function renderHist() {
  var box = $('vbtHistBox'); if (!box) return;
  var t = (store().tests || []).slice().reverse().slice(0, 10);
  if (!t.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin tests guardados. Responde y pulsa “💾 Guardar este test”.</p>'; return; }
  box.innerHTML = t.map(function (r) {
    return '<div class="hora-item"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b> · 🌬️' + r.R + ' 🔔' + r.S + ' 🤲' + r.C + ' 💭' + r.M + ' 💛' + r.G + ' · puerta <b>' + esc(r.dom || '') + '</b> · dispersión ' + esc(String(r.F)) + '/15</span>' +
      '<button type="button" class="btn btn-icon vbt-hist-del" data-id="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.vbt-hist-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.tests = e.tests.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderHist(); renderStats(); };
  });
}
function renderStats() {
  var st = $('vbtStats'); if (!st) return;
  var e = store();
  var nd = Object.keys(e.diario || {}).length;
  var c = e.miPuerta ? VBT_PUERTAS[e.miPuerta].nombre : 'sin puerta';
  st.textContent = (e.tests.length ? e.tests.length + ' test(s)' : 'sin tests') + ' · ' + nd + ' día(s) diario · ' + e.practs.length + ' día(s) práctica · ' + e.favs.length + ' favorita(s) · ' + c;
}

/* Pausa timer 3 min */
var vbtRespTimer = null;
function runRespira() {
  var msg = $('vbtRespiraMsg'), btn = $('vbtRespiraBtn');
  if (!msg) return;
  if (vbtRespTimer) { clearInterval(vbtRespTimer); vbtRespTimer = null; if (btn) btn.textContent = '▶ Pausar ahora (3 min)'; msg.textContent = ''; return; }
  var seg = 180;
  if (btn) btn.textContent = '⏹ Detener';
  msg.textContent = 'Inhala 4… 3:00';
  vbtRespTimer = setInterval(function () {
    seg--;
    if (seg <= 0) {
      clearInterval(vbtRespTimer); vbtRespTimer = null;
      if (btn) btn.textContent = '▶ Pausar ahora (3 min)';
      msg.textContent = '✓ Listo. ¿Qué brecha se abrió? Anota tu día abajo.';
      try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
      return;
    }
    var m = Math.floor(seg / 60), s = seg % 60;
    var fase = seg % 12;
    var txt = fase >= 10 ? 'Inhala 4…' : fase >= 8 ? 'Pausa 2 (lleno)…' : fase >= 4 ? 'Exhala 4…' : 'Pausa 2 (vacío)…';
    if (seg === 90) txt = 'Suelta los hombros… 1:30 · ' + txt;
    else if (seg === 30) txt = 'Últimas rondas… 0:30 · ' + txt;
    else txt = txt + ' ' + m + ':' + String(s).padStart(2, '0');
    msg.textContent = txt;
  }, 1000);
}

/* Puente hacia Métodos */
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
      if (low.indexOf('tantra') < 0 && low.indexOf('bhairav') < 0 && low.indexOf('vigyan') < 0) return;
      if ($('vbtOpenFromMetodos')) { clearInterval(iv); return; }
      var btns = dlg.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        var t = (b.textContent || '').toLowerCase();
        if (t.indexOf('tantra') >= 0 || t.indexOf('bhairav') >= 0) {
          var open = document.createElement('button');
          open.type = 'button'; open.id = 'vbtOpenFromMetodos';
          open.className = 'btn btn-accent'; open.style.width = 'auto'; open.style.marginLeft = '8px';
          open.textContent = '🕉️ Abrir las 112 puertas';
          open.onclick = function (ev) { try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {} openVbt(); };
          try { b.parentNode.insertBefore(open, b.nextSibling); } catch (e) { dlg.appendChild(open); }
          clearInterval(iv); return;
        }
      }
    }, 500);
  } catch (e) {}
}

function openVbt() {
  try {
    if ($('vbtDiaFecha') && !$('vbtDiaFecha').value) $('vbtDiaFecha').value = todayKey();
    syncMiPuerta(); renderMiPuertaBox(); renderDiario(); renderHist(); renderPracts(); renderStats(); updateProgreso();
    renderCount($('vbtQ') ? $('vbtQ').value : '');
  } catch (e) {}
  openDlg('vigyanDialog');
}
try { window.openVbt = openVbt; window.openVigyan = openVbt; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar botón en Linaje > Interior (tras Tao si existe) */
  try {
    if (!$('btnVigyan')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnVigyan'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🕉️ Tantra · 112 meditaciones';
        try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'vigyan bhairav tantra shiva devi parvati cachemira 112 sutras dharanas meditacion respiracion pausa mantra om silencio vacio energia kundalini luz oscuridad cuerpo sentidos sueño corazon asombro presencia spanda hamsa dvadashanta nada shunya');
        var ref = g.querySelector('#btnTao') || g.querySelector('#btnTolteca') || g.querySelector('#btnRecap');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnVigyan');
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
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnVigyan') < 0) ALL_BTNS.push('btnVigyan');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnVigyan = ['linaje', 'interior'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|interior'] && BTN_ORDER['linaje|interior'].indexOf('btnVigyan') < 0) {
      var oi = BTN_ORDER['linaje|interior'].indexOf('btnTao');
      if (oi >= 0) BTN_ORDER['linaje|interior'].splice(oi + 1, 0, 'btnVigyan');
      else BTN_ORDER['linaje|interior'].push('btnVigyan');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnVigyan = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnVigyan"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnVigyan"> 🕉️ Tantra · 112 meditaciones';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnVigyan !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnVigyan = lab.querySelector('input').checked;
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
  try { addKw('btnMetodos', 'tantra bhairav vigyan 112'); } catch (e2) {}
  try { addKw('btnBreath', 'vigyan pausa 4-2-4-2 hamsa'); } catch (e3) {}
  try { addKw('btnDiscipline', 'tantra volver centro stop presencia'); } catch (e4) {}

  /* 4) diálogo */
  buildDialog();
  renderLunasBox();
  syncMiPuerta();
  renderMiPuertaBox();
  renderDiario();
  renderHist();
  renderPracts();
  renderStats();
  renderCount('');

  var b = $('btnVigyan');
  if (b) b.onclick = function () { openVbt(); };

  ['Guia', 'Sutras', 'Pract', 'Test', 'Camino'].forEach(function (t) {
    var tb = $('tabVbt' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var q = $('vbtQ'); if (q) q.oninput = filterSutras;
  document.querySelectorAll('#vbtGrid .vbt-sutra-card').forEach(function (card) {
    card.onclick = function () { renderDetalle(card.dataset.sutra); };
  });
  document.querySelectorAll('.vbt-fam').forEach(function (fb2) {
    fb2.onclick = function () {
      window._vbtFam = fb2.dataset.fam;
      document.querySelectorAll('.vbt-fam').forEach(function (x) { x.classList.toggle('btn-accent', x === fb2); });
      filterSutras();
    };
  });
  document.querySelectorAll('.vbt-pract-add').forEach(function (bp) {
    bp.onclick = function () {
      var k = todayKey();
      var d = store();
      d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🛠️ Practiqué: ' + bp.dataset.p;
      save('Práctica anotada en tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
    };
  });

  var sb = $('vbtRespiraBtn'); if (sb) sb.onclick = runRespira;
  var ps = $('vbtPractSave');
  if (ps) ps.onclick = function () {
    var su = clean((($('vbtSutraHoy') || {}).value || ''), 80);
    var no = clean((($('vbtNotoHoy') || {}).value || ''), 140);
    var mi = clean((($('vbtMinHoy') || {}).value || ''), 100);
    if (!su && !no && !mi) { alert('Escribe al menos tu sutra madre, lo notado o tus minutos de hoy 🕉️'); return; }
    var e = store();
    e.practs = e.practs.filter(function (r) { return r.fecha !== todayKey(); });
    e.practs.push({ id: uid('p'), fecha: todayKey(), sutra: su, noto: no, minutos: mi });
    var txt = '🕉️ Día Tantra';
    if (su) txt += ' · 📜 ' + su;
    if (no) txt += ' · 👁 ' + no;
    if (mi) txt += ' · ⏱ ' + mi;
    e.diario[todayKey()] = (e.diario[todayKey()] ? e.diario[todayKey()] + ' | ' : '') + txt;
    save('Día de práctica guardado ✓');
    if ($('vbtSutraHoy')) $('vbtSutraHoy').value = '';
    if ($('vbtNotoHoy')) $('vbtNotoHoy').value = '';
    if ($('vbtMinHoy')) $('vbtMinHoy').value = '';
    renderPracts(); renderDiario(); renderStats();
  };
  var gr = $('vbtGoRespira');
  if (gr) gr.onclick = function () { try { var r = $('btnBreath'); if (r) r.click(); else alert('Abre 🌬️ Respiración desde Mi Día'); } catch (e) {} };

  var tc = $('vbtTestCalc');
  if (tc) tc.onclick = function () {
    var r = calcTest();
    if (r.contestadas < VBT_TEST.length) { alert('Te faltan ' + (VBT_TEST.length - r.contestadas) + ' por responder para una brújula fiel 🕉️'); }
    showResultado(r.sc);
  };
  var tr = $('vbtTestReset');
  if (tr) tr.onclick = function () {
    for (var i = 0; i < VBT_TEST.length; i++) {
      document.querySelectorAll('input[name="vbtQ' + i + '"]').forEach(function (x) { x.checked = false; });
    }
    var rb = $('vbtResultado'); if (rb) rb.classList.add('hidden');
    updateProgreso();
  };
  document.querySelectorAll('#vbtTestBox input[type="radio"]').forEach(function (x) {
    x.onchange = updateProgreso;
  });

  var ma = $('vbtMiPuerta');
  if (ma) ma.onchange = function () { var e = store(); e.miPuerta = ma.value || ''; save('Tu puerta guardada ✓'); renderMiPuertaBox(); renderStats(); };
  var da = $('vbtDiaAdd');
  if (da) da.onclick = function () {
    var f = ($('vbtDiaFecha') || {}).value || todayKey();
    var t = clean((($('vbtDiaTxt') || {}).value || ''), 300);
    if (!t) { alert('Escribe 1 línea de tu práctica de hoy 🕉️'); return; }
    var e = store();
    e.diario[f] = (e.diario[f] ? e.diario[f] + ' | ' : '') + t;
    save('Diario guardado ✓');
    if ($('vbtDiaTxt')) $('vbtDiaTxt').value = '';
    renderDiario(); renderStats();
  };
  var sh = $('vbtShare');
  if (sh) sh.onclick = function () {
    var e = store();
    var nd = Object.keys(e.diario || {}).length;
    var c = e.miPuerta ? VBT_PUERTAS[e.miPuerta].nombre : 'puerta por definir';
    share('🕉️ Mi Tantra · 112 puertas', 'Vigyan Bhairav · ' + c + '\n🕉️ Racha: ' + rachaPracts() + ' días · ' + e.practs.length + ' días de práctica · ' + nd + ' días de diario · ' + e.tests.length + ' test(s) · ' + e.favs.length + ' favorita(s).\n' + VBT_LUNAS[0]);
  };
  var tn = $('vbtToNote');
  if (tn) tn.onclick = function () {
    try {
      var e = store();
      var c2 = e.miPuerta ? VBT_PUERTAS[e.miPuerta].nombre : 'una puerta del Tantra';
      var txt2 = '🕉️ Tantra (' + c2 + ') · racha ' + rachaPracts() + 'd · ' + (e.diario[todayKey()] || 'hoy 5 min de mi sutra madre');
      if (typeof appendToTodayNote === 'function') { appendToTodayNote(txt2); save('Llevado a tu nota de hoy ✓'); }
      else if (typeof userData === 'function') {
        var u = userData();
        u.notas = u.notas || {}; var k = todayKey();
        u.notas[k] = u.notas[k] || {}; u.notas[k].nota = ((u.notas[k].nota || '') + '\n' + txt2).trim();
        save('Llevado a tu nota de hoy ✓');
      }
    } catch (e) {}
  };
  var cl = $('vbtClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar todo tu Tantra (tests, diario, días, favoritas)?')) return;
    try {
      var u = (typeof userData === 'function') ? userData() : null;
      if (u) u.vigyan = blank();
    } catch (e) {}
    syncMiPuerta(); renderMiPuertaBox(); renderDiario(); renderHist(); renderPracts(); renderStats(); renderCount('');
    save('Tantra borrado');
  };

  puenteMetodos();
  updateProgreso();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
else setup();

})();
