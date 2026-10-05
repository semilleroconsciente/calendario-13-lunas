/* ============================================================
   FORTALEZAS VIA — Calendario 13 Lunas (Penco · Bio-Bio)
   Modelo VIA de Fortalezas de Caracter (Peterson & Seligman):
   6 virtudes x 24 fortalezas. Version educativa y practica.
   - Boton btnVIA (grupo Linaje > Interior, inyectado)
   - Dialogo viaDialog con 5 pestanas:
     1) Guia (que es, 6 virtudes, como usar, mitos, VIA x lunas)
     2) 24 Fortalezas (fichas + buscador + filtro virtud + detalle)
     3) Test (48 afirmaciones, 2 por fortaleza, escala 1-5)
     4) Mis firma (top 5 auto + selector, practicas, historial)
     5) Diario & Puentes (uso diario, puentes con el calendario)
   - Todo local y privado por usuario: userData().via
     { tests:[], firma:[], diario:{}, favs:[] }
   - Educativo: NO diagnostica. Sin dependencias. 100% offline.
   - Puentes: Gratitud, Habitos, Ikigai, Eneagrama, Psicologia,
     Metodos, Disciplina y nota de hoy (botones que abren cada
     modulo si existe; si no, avisan sin romper).
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
function blank() { return { tests: [], firma: [], diario: {}, favs: [] }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.via) u.via = blank();
    var e = u.via;
    if (!Array.isArray(e.tests)) e.tests = [];
    if (!Array.isArray(e.firma)) e.firma = [];
    if (!e.diario) e.diario = {};
    if (!Array.isArray(e.favs)) e.favs = [];
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
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }
function goMod(btnId, fallbackTab) {
  try {
    var d = $('viaDialog'); if (d && d.open) d.close();
  } catch (e) {}
  setTimeout(function () {
    try {
      var b = $(btnId);
      if (b) { b.click(); return; }
      alert('Ese modulo aun no esta cargado en esta sesion. Se carga solo a los segundos: reintenta.');
    } catch (e2) {}
  }, fallbackTab || 180);
}
function switchTab(name) {
  ['Guia', 'Fort', 'Test', 'Firma', 'Diario'].forEach(function (t) {
    var p = $('via' + t), b = $('tabVia' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ============================================================
   DATOS — 6 virtudes x 24 fortalezas (orden oficial VIA)
   ============================================================ */
var VIA_VIRTUDES = [
  { id: 'sabiduria', ico: '🦉', nombre: 'Sabiduria', desc: 'Fortalezas cognitivas: buscar, ordenar y regalar lo aprendido. El saber al servicio del buen vivir.' },
  { id: 'coraje', ico: '🔥', nombre: 'Coraje', desc: 'Fortalezas emocionales: sostener lo dificil con el corazon firme, sin pasar por encima de nadie.' },
  { id: 'humanidad', ico: '💞', nombre: 'Humanidad', desc: 'Fortalezas del vinculo: cuidar, querer y entender a la gente cercana.' },
  { id: 'justicia', ico: '⚖️', nombre: 'Justicia', desc: 'Fortalezas civicas: hacer comunidad justa, donde todas las voces cuentan.' },
  { id: 'templanza', ico: '🌊', nombre: 'Templanza', desc: 'Fortalezas del equilibrio: frenar el impulso y cuidar la medida.' },
  { id: 'trascendencia', ico: '🌟', nombre: 'Trascendencia', desc: 'Fortalezas del sentido: conectar con algo mas grande (belleza, gratitud, esperanza, humor, espiritu).' }
];
function virtudNombre(id) {
  for (var i = 0; i < VIA_VIRTUDES.length; i++) if (VIA_VIRTUDES[i].id === id) return VIA_VIRTUDES[i].ico + ' ' + VIA_VIRTUDES[i].nombre;
  return id;
}

var VIA_FORTS = [
  /* SABIDURIA */
  { id: 'creatividad', v: 'sabiduria', ico: '🎨', n: 'Creatividad', tag: 'original ingenio ideas soluciones',
    que: 'Pensar soluciones nuevas y utiles: no solo arte, tambien arreglar con lo que hay, inventar juegos, cocinar distinto.',
    senal: 'Se te ocurren ideas rapido y te gusta probar formas nuevas aunque no sean perfectas.',
    luz: ['Original y recursiva', 'Ve salidas donde otros ven muro', 'Juega y experimenta sin miedo al error'],
    exceso: 'Tantas ideas que no termina ninguna; desprecia lo simple que ya funciona.',
    practica: '5 min: toma 1 problema chico de hoy y escribe 3 soluciones locas + 1 aplicable. Prueba la aplicable.',
    pregunta: '¿Que haria distinto un nino de 7 anos con esto?',
    penco: 'Arreglar con retazos, trueque creativo, decorar la ramada con material reciclado.' },
  { id: 'curiosidad', v: 'sabiduria', ico: '🔭', n: 'Curiosidad', tag: 'explorar preguntar aprender descubrir interes',
    que: 'Interes vivo por el mundo: preguntar, explorar, husmear con respeto. Motor de todo aprendizaje.',
    senal: 'Preguntas “¿por que?” y te quedas mirando el mar, el bosque o un libro mas de lo planeado.',
    luz: ['Exploradora y abierta', 'Aprende rapido porque le importa', 'Encuentra novedad en lo cotidiano'],
    exceso: 'Dispersa: pica todo y no profundiza; mete la cuchara donde no la llaman.',
    practica: '5 min: elige 1 cosa de hoy (una planta, una palabra en mapuzugun, una marea) e investiga 3 datos.',
    pregunta: '¿Que me esta invitando a descubrir esto?',
    penco: 'Observar aves en Rocuant, preguntar a los abuelos por el nombre de cada quebrada.' },
  { id: 'juicio', v: 'sabiduria', ico: '⚖️', n: 'Juicio', tag: 'criterio pensar critico evidencia decisiones',
    que: 'Pensar las cosas por todos lados y decidir con evidencia, no con apuro ni con moda.',
    senal: 'Escuchas pros y contras antes de opinar y cambias de idea si aparece buen dato.',
    luz: ['Objetiva y ponderada', 'No se deja llevar por el rumor', 'Decide con calma y fundamento'],
    exceso: 'Analisis-paralisis: tanto pensar que nunca decide; critica todo y no propone.',
    practica: '5 min: ante 1 decision de hoy, lista 2 pros + 2 contras + “¿que diria mi yo de 80 anos?”. Decide.',
    pregunta: '¿Que evidencia tengo y que me falta?',
    penco: 'Decidir siembra segun luna y suelo real, no solo por costumbre.' },
  { id: 'aprender', v: 'sabiduria', ico: '📚', n: 'Amor por aprender', tag: 'estudio lectura oficio saber maestro',
    que: 'Gusto genuino por dominar algo nuevo: oficios, idiomas, instrumentos, mar, huerta.',
    senal: 'Te metes a talleres, ves tutoriales o practicas por puro gusto, sin que te obliguen.',
    luz: ['Constante y humilde ante el saber', 'Acumula oficios utiles', 'Disfruta el proceso, no solo el titulo'],
    exceso: 'Colecciona cursos sin aplicar; se cree superior por saber mas.',
    practica: '5 min: practica 1 micro-habilidad (1 acorde, 1 nudo, 1 palabra nueva) y anota que aprendiste.',
    pregunta: '¿Que minusculo puedo dominar esta semana?',
    penco: 'Talleres de Penco, kimun mapuzugun, Horario de estudio del calendario.' },
  { id: 'perspectiva', v: 'sabiduria', ico: '🦅', n: 'Perspectiva', tag: 'sabiduria consejo mirada amplia sentido',
    que: 'Ver el cuadro grande y dar consejo sensato: la voz que calma y ordena.',
    senal: 'La gente te pide consejo porque ves lo que otros no ven enredados.',
    luz: ['Sabia y serena', 'Une puntos dispersos', 'Aconseja sin imponer'],
    exceso: 'Da catedra sin que se la pidan; se pone por encima (“yo ya lo vivi”).',
    practica: '5 min: escribe tu problema como si fuera de una amiga: ¿que le aconsejarias en 3 lineas?',
    pregunta: '¿Como se vera esto en 5 lunas mas?',
    penco: 'Voz de los Abuelos: grabar y pedir consejo a quien camino antes.' },
  /* CORAJE */
  { id: 'valentia', v: 'coraje', ico: '🦁', n: 'Valentia', tag: 'valor miedo enfrentar defender coraje',
    que: 'Hacer lo correcto aunque duela o de miedo: hablar, defender, partir, pedir ayuda.',
    senal: 'Actuas aun con miedo cuando algo te importa de verdad.',
    luz: ['Defiende lo justo', 'Se atreve a empezar', 'Sostiene aunque tiemble'],
    exceso: 'Temeridad: se lanza sin medir y arrastra a otros; confunde gritar con ser valiente.',
    practica: '5 min: haz hoy 1 micro-acto valiente (decir no, pedir perdon, llamar, publicar tu oficio).',
    pregunta: '¿Que haria si el miedo no mandara 10 minutos?',
    penco: 'Denunciar microbasural, defender a un vecino, cruzar a pedir hora al CESFAM.' },
  { id: 'perseverancia', v: 'coraje', ico: '⛰️', n: 'Perseverancia', tag: 'constancia terminar disciplina esfuerzo industria',
    que: 'Terminar lo que se empieza con esfuerzo sostenido y gusto por el trabajo bien hecho.',
    senal: 'Sigues aunque sea lento: riegas, remas, estudias igual los dias grises.',
    luz: ['Constante y trabajadora', 'Termina y entrega', 'Tolera la frustracion'],
    exceso: 'Terquedad: sigue aunque duela el cuerpo o ya no tenga sentido; se quema.',
    practica: '5 min: retoma 1 pendiente chico y terminalo entero hoy. Celebra marcandolo.',
    pregunta: '¿Cual es el proximo paso mas pequeno que igual cuenta?',
    penco: 'Huerta por lunas, Habitos del calendario con racha, terminar la minga.' },
  { id: 'honestidad', v: 'coraje', ico: '🪞', n: 'Honestidad', tag: 'autenticidad verdad integridad sincero coherencia',
    que: 'Vivir en verdad: decir lo real con respeto y actuar como se habla.',
    senal: 'Dices lo que piensas sin mascara y reconoces tus errores sin culpar.',
    luz: ['Autentica y confiable', 'Coherente entre dicho y hecho', 'Asume sin excusas'],
    exceso: 'Brutalidad “sincera” que hiere; se confiesa sin reparar.',
    practica: '5 min: reconoce 1 error de hoy en voz alta y repara con 1 acto concreto.',
    pregunta: '¿Que verdad chica estoy evitando decirme?',
    penco: 'Cobrar justo, decir “me equivoque” en la pega y en la casa.' },
  { id: 'entusiasmo', v: 'coraje', ico: '⚡', n: 'Entusiasmo', tag: 'vitalidad energia animo pasion ganas vigor',
    que: 'Vivir con energia y ganas: contagiar pilas sin quemarse.',
    senal: 'Te levantas con algo que te mueve y la gente se energiza contigo.',
    luz: ['Vital y motivadora', 'Le pone cuerpo a lo que hace', 'Levanta grupos caidos'],
    exceso: 'Acelerada: contagia ansiedad, no para ni deja parar; se funde en una semana.',
    practica: '5 min: mueve el cuerpo (camina, baila, rema en seco) y nombra 1 cosa que te da ganas hoy.',
    pregunta: '¿Que me daria 1% mas de vida hoy?',
    penco: 'Entrenamientos, Natacion, bailar cueca en fiestas de Penco.' },
  /* HUMANIDAD */
  { id: 'amor', v: 'humanidad', ico: '❤️', n: 'Amor', tag: 'carino cercania vinculo querer afeccion',
    que: 'Valorar las relaciones cercanas y sostenerlas: dar y dejarse querer.',
    senal: 'Cuidas a tu gente con gestos y aceptas cuidado cuando lo necesitas.',
    luz: ['Carinosa y presente', 'Sostiene en las malas', 'Crea hogar donde este'],
    exceso: 'Apego que asfixia: celos, control o sacrificarse hasta desaparecer.',
    practica: '5 min: escribe o di 1 “gracias por existir” concreto a alguien hoy.',
    pregunta: '¿Quien necesita hoy 5 minutos de mi corazon?',
    penco: 'Once con la abuela, llamar al que esta solo, Voz de los Abuelos.' },
  { id: 'amabilidad', v: 'humanidad', ico: '🤲', n: 'Amabilidad', tag: 'generosidad servicio ayudar bondad dar',
    que: 'Hacer favores y actos buenos sin pedir nada a cambio.',
    senal: 'Ayudas aunque nadie mire: das la pasada, compartes, acompañas.',
    luz: ['Generosa y servicial', 'Ve al que nadie ve', 'Da sin llevar la cuenta'],
    exceso: 'Da hasta vaciarse y no sabe decir no; ayuda para que la quieran.',
    practica: '5 min: 1 acto amable anonimo hoy (pan regalado, mensaje, ayuda en la micro).',
    pregunta: '¿A quien puedo aliviarle 1 kilo hoy?',
    penco: 'Minga, trueque, acompañar a mayores, feria solidaria.' },
  { id: 'social', v: 'humanidad', ico: '🫂', n: 'Inteligencia social', tag: 'empatia escuchar emociones gente trato',
    que: 'Notar lo que sienten otros y actuar con tino: escuchar, calmar, unir.',
    senal: 'Captas el animo de una pieza apenas entras y sabes que decir.',
    luz: ['Empatica y diplomatica', 'Escucha de verdad', 'Une sin tomar partido'],
    exceso: 'Manipula con lo que capta; se mete en todos los conflictos.',
    practica: '5 min: escucha 5 minutos sin interrumpir ni aconsejar. Repite lo que entendiste.',
    pregunta: '¿Que estara sintiendo esta persona que aun no dijo?',
    penco: 'Convivencia Vecinal, Red Comunitaria, mediar en la junta.' },
  /* JUSTICIA */
  { id: 'equipo', v: 'justicia', ico: '🤝', n: 'Trabajo en equipo', tag: 'colaborar grupo lealtad comunidad cooperar',
    que: 'Aportar al grupo como miembro leal: cumplir tu parte y celebrar la comun.',
    senal: 'Cumples tu turno, avisas, y te alegra el logro colectivo.',
    luz: ['Leal y cumplidora', 'Hace su parte sin excusas', 'Celebra al grupo, no solo su brillo'],
    exceso: 'Se borra en el grupo o tapa errores del grupo por lealtad ciega.',
    practica: '5 min: cumple hoy 1 compromiso de grupo a tiempo y avisa tu avance.',
    pregunta: '¿Que necesita hoy mi equipo de mi?',
    penco: 'Minga, club deportivo, apoderados, cuadrilla de limpieza de quebrada.' },
  { id: 'equidad', v: 'justicia', ico: '⚖️', n: 'Equidad', tag: 'justo imparcial trato igual derechos',
    que: 'Tratar a todos con justicia, sin favoritismos: mismas reglas, misma dignidad.',
    senal: 'Repartes parejo y reclamas cuando alguien queda fuera.',
    luz: ['Justa e imparcial', 'Da la palabra al callado', 'Repara sin humillar'],
    exceso: 'Rigidez de reglamento: “parejo” aunque duela el caso especial.',
    practica: '5 min: revisa 1 reparto de hoy (tareas, comida, palabra): ¿quedo parejo? Ajusta 1 cosa.',
    pregunta: '¿A quien estoy dejando fuera sin darme cuenta?',
    penco: 'Reparto de agua, turnos, premios en talleres de Penco.' },
  { id: 'liderazgo', v: 'justicia', ico: '🧭', n: 'Liderazgo', tag: 'guiar organizar motivar dirigir equipo',
    que: 'Organizar al grupo para lograrlo en buena: animar, ordenar, cuidar el clima.',
    senal: 'Cuando algo se desordena, ordenas con calma y la gente te sigue.',
    luz: ['Organiza y anima', 'Cuida el clima del grupo', 'Asume y da la cara'],
    exceso: 'Manda y controla; se queda con el credito o con el microfono.',
    practica: '5 min: propone 1 plan chico con roles claros (quien, que, cuando) y parte tu primero.',
    pregunta: '¿Como saco lo mejor de cada quien hoy?',
    penco: 'Dirigir minga, capitanear equipo, coordinar junta de vecinos.' },
  /* TEMPLANZA */
  { id: 'perdon', v: 'templanza', ico: '🕊️', n: 'Perdon', tag: 'perdonar soltar rencor misericordia reconciliar',
    que: 'Soltar el rencor y dar segunda oportunidad sin negar el dano.',
    senal: 'Puedes recordar sin que te queme y volver a confiar con cuidado.',
    luz: ['Suelta sin negar', 'Reconcilia sin humillarse', 'Libera energia atrapada'],
    exceso: 'Perdona rapido para evitar el conflicto y deja que la pasen a llevar de nuevo.',
    practica: '5 min: escribe “me dolio ___, elijo soltar ___ y cuidar ___”. Respira 3 veces.',
    pregunta: '¿Que peso estoy lista/o para dejar hoy?',
    penco: 'Recapitulacion, Duelo, carta de honra del Arbol Genealogico.' },
  { id: 'humildad', v: 'templanza', ico: '🌱', n: 'Humildad', tag: 'modestia sencillo sin ego reconocer limites',
    que: 'Verse en su justa medida: sin agrandarse ni achicarse; dejar brillar a otros.',
    senal: 'Reconoces errores y aciertos sin show, y celebras a otros de verdad.',
    luz: ['Sencilla y ubicadita', 'Aprende de cualquiera', 'Comparte el credito'],
    exceso: 'Se achica: esconde sus dones por no “presumir” y deja que decidan por ella.',
    practica: '5 min: anota 1 acierto + 1 limite de hoy. Agradece 1 aporte de otra persona en voz alta.',
    pregunta: '¿Donde me estoy agrandando o achicando?',
    penco: 'Trueque justo, pedir ayuda en la vecindad, aprender de pescadores.' },
  { id: 'prudencia', v: 'templanza', ico: '🦉', n: 'Prudencia', tag: 'cuidado precaucion medir riesgo preveer pensar',
    que: 'Cuidar los pasos: prever riesgos y elegir con cabeza fria.',
    senal: 'Miras el pronostico, el bolsillo y el cuerpo antes de lanzarte.',
    luz: ['Previsora y cuidadosa', 'Evita accidentes y deudas', 'Piensa el despues'],
    exceso: 'Miedo disfrazado: tanta precaucion que nunca parte ni disfruta.',
    practica: '5 min: antes de 1 decision, pregunta “¿que puede salir mal y como lo cuido?” en 3 lineas.',
    pregunta: '¿Que cuidaria mi yo de manana?',
    penco: 'Mareas SHOA antes de salir, leña seca, presupuesto de Finanzas.' },
  { id: 'autorregulacion', v: 'templanza', ico: '🎯', n: 'Autorregulacion', tag: 'autocontrol habitos disciplina impulsos orden',
    que: 'Manejar impulsos y emociones: ordenar habitos aunque cueste.',
    senal: 'Cumples lo que te propones la mayoria de los dias, incluso sin ganas.',
    luz: ['Disciplinada y pareja', 'Frena a tiempo', 'Sostiene habitos'],
    exceso: 'Rigidez: control total que agota y explota el fin de semana.',
    practica: '5 min: elige 1 impulso de hoy y ponle pausa de 10 min con respiracion + agua. Luego decide.',
    pregunta: '¿Que habito chico me acerca a quien quiero ser?',
    penco: 'Habitos, Disciplina, Respiracion, Adicciones (apoyo) del calendario.' },
  /* TRASCENDENCIA */
  { id: 'belleza', v: 'trascendencia', ico: '🌅', n: 'Apreciacion de la belleza', tag: 'belleza arte naturaleza asombro excelencia',
    que: 'Notar y conmoverse con lo bello y lo bien hecho: mar, arte, oficio maestro.',
    senal: 'Te detienes ante un atardecer, un canto o un trabajo bien hecho.',
    luz: [' sensible y contemplativa', 'Cuida lo bello', 'Se inspira y crea'],
    exceso: 'Solo lo “lindo” vale; desprecia lo rustico o imperfecto.',
    practica: '5 min: Hora Dorada: mira el cielo o una planta 3 minutos y anota 3 bellezas.',
    pregunta: '¿Donde hay belleza que estoy pasando por alto?',
    penco: 'Hora Dorada, Bosque Nativo, Aves, Intermareal.' },
  { id: 'gratitud', v: 'trascendencia', ico: '🙏', n: 'Gratitud', tag: 'agradecer gracias apreciar valorar bendicion',
    que: 'Reconocer lo bueno recibido y agradecerlo: a personas, tierra y vida.',
    senal: 'Dices gracias especifico (“gracias por ___”) y lo sientes en el cuerpo.',
    luz: ['Agradecida y generosa', 'Ve lo que si hay', 'Devuelve lo recibido'],
    exceso: 'Gratitud forzada que tapa penas reales (“agradece y calla”).',
    practica: '5 min: escribe 3 gracias concretas de hoy (quien, que, como te toco).',
    pregunta: '¿Que don de hoy no me gane y sin embargo recibi?',
    penco: 'Gratitud Diaria del calendario, llellipun antes de cosechar.' },
  { id: 'esperanza', v: 'trascendencia', ico: '🌈', n: 'Esperanza', tag: 'optimismo futuro fe animo proposito caminos',
    que: 'Esperar lo mejor y trabajar por ello: ver caminos donde otros ven muro.',
    senal: 'Ante el bajon, buscas el proximo paso y lo das.',
    luz: ['Optimista con pies en tierra', 'Busca caminos, no excusas', 'Anima sin mentir'],
    exceso: 'Optimismo ciego: promete sin base y se estrella (y estrella a otros).',
    practica: '5 min: escribe 1 meta + 2 caminos + 1 paso de hoy. Da el paso.',
    pregunta: 'Si esto saliera bien, ¿cual seria el primer signo?',
    penco: 'Proyecto de huerta, negocio pencon, tratamiento de salud.' },
  { id: 'humor', v: 'trascendencia', ico: '😄', n: 'Humor', tag: 'risa alegria juego reir liviandad chiste',
    que: 'Reir y hacer reir con cariño: aliviar lo pesado sin burlarse.',
    senal: 'Pones la talla justa que descomprime sin herir.',
    luz: ['Alegre y liviana', 'Une con la risa', 'Se rie de si misma'],
    exceso: 'Burla que hiere o risa para evitar lo serio siempre.',
    practica: '5 min: cuenta 1 talla sana o juega 5 minutos (con niños, mascotas, amigos).',
    pregunta: '¿Donde puedo poner liviandad sin faltar el respeto?',
    penco: 'Juegos de Aprender, fiestas de Penco, sobremesa familiar.' },
  { id: 'espiritualidad', v: 'trascendencia', ico: '🕉️', n: 'Espiritualidad', tag: 'sentido proposito fe sacred sagrado trascender',
    que: 'Tener creencias sobre el proposito y sentir conexion con lo sagrado o lo grande.',
    senal: 'Tienes un “para que” que te sostiene y practicas que te centran.',
    luz: ['Con proposito y calma', 'Respeta todos los caminos', 'Encuentra sentido en el dolor'],
    exceso: 'Se encierra en su verdad y juzga otros caminos; huye de lo terrenal.',
    practica: '5 min: tu practica (amanecer, respiracion, oracion, grounding) hoy, con intencion clara.',
    pregunta: '¿Para que mas grande estoy viviendo esto?',
    penco: 'Practicas Espirituales, Ekadashi, Metodos, Kimun mapuche.' }
];
function fortById(id) {
  for (var i = 0; i < VIA_FORTS.length; i++) if (VIA_FORTS[i].id === id) return VIA_FORTS[i];
  return null;
}

/* ---------- Test: 48 afirmaciones (2 por fortaleza, escala 1-5) ---------- */
var VIA_LIKERT = [
  { v: 1, t: '1 · Casi nunca' }, { v: 2, t: '2' }, { v: 3, t: '3 · A veces' }, { v: 4, t: '4' }, { v: 5, t: '5 · Casi siempre' }
];
var VIA_TEST = [
  { f: 'creatividad', txt: 'Se me ocurren formas nuevas de resolver problemas cotidianos.' },
  { f: 'creatividad', txt: 'Me gusta probar maneras distintas aunque no sepa si resultaran.' },
  { f: 'curiosidad', txt: 'Me nace preguntar y explorar cuando algo me llama la atencion.' },
  { f: 'curiosidad', txt: 'Descubro algo interesante incluso en dias comunes y corrientes.' },
  { f: 'juicio', txt: 'Antes de opinar, miro varios lados del asunto.' },
  { f: 'juicio', txt: 'Cambio de opinion cuando aparece una buena evidencia.' },
  { f: 'aprender', txt: 'Disfruto aprender algo nuevo aunque nadie me lo pida.' },
  { f: 'aprender', txt: 'Practico para dominar oficios o habilidades por puro gusto.' },
  { f: 'perspectiva', txt: 'Otras personas me piden consejo porque veo el cuadro completo.' },
  { f: 'perspectiva', txt: 'Puedo mirar un problema dificil con calma y encontrarle sentido.' },
  { f: 'valentia', txt: 'Actuo aunque tenga miedo cuando algo me importa.' },
  { f: 'valentia', txt: 'Defiendo lo que creo justo aunque sea incomodo.' },
  { f: 'perseverancia', txt: 'Termino lo que empiezo aunque se ponga cuesta arriba.' },
  { f: 'perseverancia', txt: 'Sigo con mi esfuerzo incluso los dias sin ganas.' },
  { f: 'honestidad', txt: 'Digo la verdad con respeto aunque me cueste.' },
  { f: 'honestidad', txt: 'Reconozco mis errores sin echarle la culpa a otros.' },
  { f: 'entusiasmo', txt: 'Enfrento el dia con energia y ganas.' },
  { f: 'entusiasmo', txt: 'La gente se anima cuando me sumo a algo.' },
  { f: 'amor', txt: 'Cuido mis relaciones cercanas con gestos concretos.' },
  { f: 'amor', txt: 'Acepto cariño y ayuda cuando los necesito.' },
  { f: 'amabilidad', txt: 'Hago favores sin esperar nada a cambio.' },
  { f: 'amabilidad', txt: 'Ayudo aunque nadie lo vaya a saber.' },
  { f: 'social', txt: 'Noto rapido como se siente la gente a mi alrededor.' },
  { f: 'social', txt: 'Se escuchar sin interrumpir ni imponer mi opinion.' },
  { f: 'equipo', txt: 'Cumplo mi parte en los trabajos de grupo.' },
  { f: 'equipo', txt: 'Me alegra el logro colectivo tanto como el propio.' },
  { f: 'equidad', txt: 'Trato a todas las personas con la misma dignidad.' },
  { f: 'equidad', txt: 'Reclamo (con respeto) cuando alguien queda fuera injustamente.' },
  { f: 'liderazgo', txt: 'Cuando algo se desordena, ordeno con calma y la gente me sigue.' },
  { f: 'liderazgo', txt: 'Organizo roles y animo para que el grupo logre su meta.' },
  { f: 'perdon', txt: 'Puedo soltar rencores sin negar lo que dolio.' },
  { f: 'perdon', txt: 'Doy segundas oportunidades con cuidado, sin humillarme.' },
  { f: 'humildad', txt: 'Reconozco mis aciertos y mis limites sin show.' },
  { f: 'humildad', txt: 'Celebro de verdad los logros de otras personas.' },
  { f: 'prudencia', txt: 'Pienso las consecuencias antes de lanzarme.' },
  { f: 'prudencia', txt: 'Cuido plata, cuerpo y riesgos antes de decidir.' },
  { f: 'autorregulacion', txt: 'Cumplo lo que me propongo aunque no tenga ganas.' },
  { f: 'autorregulacion', txt: 'Puedo frenar un impulso a tiempo (comida, pantallas, compras, rabia).' },
  { f: 'belleza', txt: 'Me detengo ante algo bello (mar, cielo, musica, oficio bien hecho).' },
  { f: 'belleza', txt: 'Noto la excelencia y me inspira a cuidar o crear.' },
  { f: 'gratitud', txt: 'Agradezco en concreto lo bueno que recibo cada dia.' },
  { f: 'gratitud', txt: 'Siento que recibo dones que no me gane (gente, tierra, vida).' },
  { f: 'esperanza', txt: 'Ante un bajon, busco el proximo paso y lo doy.' },
  { f: 'esperanza', txt: 'Veo caminos donde otras personas solo ven muros.' },
  { f: 'humor', txt: 'Pongo liviandad con respeto cuando el ambiente esta pesado.' },
  { f: 'humor', txt: 'Puedo reirme de mi misma/o sin destruirme.' },
  { f: 'espiritualidad', txt: 'Tengo un “para que” que me sostiene en dias dificiles.' },
  { f: 'espiritualidad', txt: 'Practico algo que me conecta con lo grande (amanecer, oracion, mar, respiracion).' }
];

var VIA_LUNAS = [
  { luna: 'Lunas 1-3 · Pukem (invierno)', tip: 'Mirar adentro: haz el test una vez y lee tu top 5. Riega Templanza (perdon, autorregulacion) con diario + respiracion. Ideal: gratitud y espiritualidad al calorcito.' },
  { luna: 'Lunas 4-6 · Pewu (primavera)', tip: 'Sembrar: elige 1 fortaleza firma y usala en 1 desafio nuevo (Sabiduria + Coraje). Prueba 28 dias: curiosidad + perseverancia.' },
  { luna: 'Lunas 7-9 · Walung (verano)', tip: 'Mostrarte: pon tu firma al servicio (Humanidad + Justicia). Minga, taller, feria: amabilidad + trabajo en equipo + liderazgo.' },
  { luna: 'Lunas 10-13 · Rimu (otono)', tip: 'Cosechar y soltar: revisa tu diario. ¿Que fortaleza te salvo? ¿Cual te falta? Practica perdon + perspectiva e inventario.' }
];

/* Practicas por fortaleza para “usar tu firma en un desafio” */
var VIA_USOS = {
  creatividad: 'Disena 3 versiones de tu desafio y prueba la mas simple hoy.',
  curiosidad: 'Haz 5 preguntas antes de opinar sobre el desafio.',
  juicio: 'Lista pros/contras y decide con 1 dato real, no con rumor.',
  aprender: 'Aprende 1 micro-habilidad que el desafio pide y aplicala.',
  perspectiva: 'Pregunta a alguien sabio y escribe su consejo en 1 frase.',
  valentia: 'Da el primer paso chico aunque tiemble la voz.',
  perseverancia: 'Compromete 10 min diarios por 28 dias y marca la racha.',
  honestidad: 'Di la verdad pendiente del desafio hoy, con respeto.',
  entusiasmo: 'Ponle cuerpo y musica: parte con energia contagiosa.',
  amor: 'Pide apoyo a tu gente en vez de pelear sola/o.',
  amabilidad: 'Ofrece 1 ayuda concreta ligada al desafio.',
  social: 'Escucha a cada involucrado 5 min sin interrumpir.',
  equipo: 'Reparte roles claros y cumple tu parte primero.',
  equidad: 'Revisa que nadie quede fuera del beneficio.',
  liderazgo: 'Propón plan + plazos y sostén el animo del grupo.',
  perdon: 'Suelta 1 rencor que te frena y libera esa energia.',
  humildad: 'Pide ayuda a quien sabe mas y dale el credito.',
  prudencia: 'Chequea riesgos y prepara plan B antes de lanzarte.',
  autorregulacion: 'Frena 1 impulso que te saca del desafio (pantalla, gasto, rabia).',
  belleza: 'Hazlo lindo: ordena el espacio para inspirarte.',
  gratitud: 'Agradece cada avance chico y a quien te ayudo.',
  esperanza: 'Escribe meta + 2 caminos + paso de hoy.',
  humor: 'Riete del enredo (no de la gente) y sigue liviano.',
  espiritualidad: 'Conecta tu desafio con tu para que mayor.'
};

/* ============================================================
   DIALOGO
   ============================================================ */
function makeDialog() {
  var old = $('viaDialog');
  if (old) old.remove();

  var fortGrid = VIA_FORTS.map(function (f) {
    return '<button type="button" class="btn via-fort-card" data-fort="' + f.id + '" data-v="' + f.v + '" style="text-align:left;height:auto;padding:10px">' +
      '<b>' + f.ico + ' ' + esc(f.n) + '</b><br>' +
      '<span class="muted" style="font-size:10px">' + esc(virtudNombre(f.v)) + '</span></button>';
  }).join('');

  var testHTML = VIA_TEST.map(function (q, i) {
    var f = fortById(q.f);
    var opts = VIA_LIKERT.map(function (o) {
      return '<label class="check-row" style="margin:0;font-size:11px;white-space:nowrap"><input type="radio" name="viaQ' + i + '" value="' + o.v + '"> ' + o.t + '</label>';
    }).join('');
    return '<div class="menstrual-card" style="margin-bottom:8px"><b style="font-size:12px">' + (i + 1) + '. ' + esc(q.txt) + '</b>' +
      '<span class="muted" style="font-size:10px"> · ' + (f ? esc(f.ico + ' ' + f.n) : '') + '</span>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' + opts + '</div></div>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabViaGuia" class="btn btn-accent" style="width:auto">📖 Guia</button>' +
    '<button type="button" id="tabViaFort" class="btn" style="width:auto">🌟 24 Fortalezas</button>' +
    '<button type="button" id="tabViaTest" class="btn" style="width:auto">📝 Test (48)</button>' +
    '<button type="button" id="tabViaFirma" class="btn" style="width:auto">💎 Mis firma</button>' +
    '<button type="button" id="tabViaDiario" class="btn" style="width:auto">🌱 Diario & Puentes</button></div>' +

    '<div id="viaStreak" class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px"></div>' +

    /* GUIA */
    '<div id="viaGuia">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌟 Modelo VIA: lo mejor de ti, con nombre</h4>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">El <b>Modelo VIA</b> (Values in Action, Peterson & Seligman) estudio lo que hace florecer a las personas en todas las culturas: encontro <b>6 virtudes</b> universales y <b>24 fortalezas de caracter</b> —capacidades morales y practicas que se pueden <b>medir, entrenar y poner al servicio</b>. No habla de dones raros: habla de tu curiosidad, tu amabilidad, tu perseverancia de todos los dias.</p>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">La gracia: en vez de pelear contra tus defectos, <b>usas tus fortalezas firma (top 5)</b> para sostener habitos, trabajar, cuidar y sanar. La ciencia muestra que usar tu firma de forma nueva cada semana sube el bienestar y baja la depre leve. Aqui lo hacemos a la pencona: chico, diario y en comunidad.</p></div>' +
    '<div class="menstrual-card"><h4>🦉🔥💞⚖️🌊🌟 Las 6 virtudes (con sus fortalezas)</h4><div id="viaVirtBox"></div></div>' +
    '<div class="discipline-grid">' +
    '<div class="discipline-card"><h4>🧭 Como usar esta seccion</h4><p>1) Lee la <b>Guia</b> una vez. 2) Explora las <b>24 Fortalezas</b> y marca tus favoritas ☆. 3) Haz el <b>Test (48)</b> pensando en como eres casi siempre (~8 min). 4) Revisa <b>Mis firma</b>: tu top 5 + 1 a cultivar. 5) Registra en <b>Diario</b> 1 uso diario y relee cada luna.</p></div>' +
    '<div class="discipline-card"><h4>🚫 Mitos que frenan</h4><p>• “Tengo que tenerlas todas altas” → no: <b>el perfil disparejo es lo normal</b>; se trabaja con el top y se riega 1 baja.<br>• “Mi baja es mi defecto” → es una fortaleza dormida, no una falla.<br>• “El test me etiqueta” → es una foto de hoy; tu firma se confirma usandola.<br>• “Esto reemplaza terapia” → no: si hay sufrimiento fuerte, pide ayuda (CESFAM / *4141).</p></div>' +
    '</div>' +
    '<div class="si-card" style="border-left:3px solid #8fd694"><h4>🌱 Regla de oro VIA</h4><p><b>Usa tu top en lo dificil + riega 1 baja con micro-practica.</b> Ejemplo: si tu firma es Amabilidad y tu desafio es ordenar la casa, invita a alguien y ordenan juntas (firma al servicio). Si te falta Autorregulacion, ponle pausa de 10 min con respiracion.</p></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌙 VIA x 13 lunas x kume mongen</h4><div id="viaLunasBox"></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">Como el <i>kume mongen</i>: floreces ubicada/o —en tu cuerpo, tu familia, tu territorio— y devuelves algo. Tus fortalezas penconas pueden ser cuidar la quebrada (prudencia), amasar para la veci (amabilidad), enseñar mapuzugun (amor por aprender).</p></div>' +
    '</div>' +

    /* FORTALEZAS */
    '<div id="viaFort" class="hidden">' +
    '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="viaQ" placeholder="ej: perdon, risa, valentia, equipo..." maxlength="40"></label>' +
    '<label>Virtud <select id="viaVirtF"><option value="">Todas</option>' + VIA_VIRTUDES.map(function (v) { return '<option value="' + v.id + '">' + v.ico + ' ' + esc(v.nombre) + '</option>'; }).join('') + '</select></label></div>' +
    '<div id="viaFortGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px">' + fortGrid + '</div>' +
    '<div id="viaDetalle" class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><p class="muted">Toca una fortaleza para ver su ficha completa (luz, exceso, practica pencona) 👆</p></div></div>' +

    /* TEST */
    '<div id="viaTest" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📝 Test breve (48 afirmaciones)</h4>' +
    '<p class="muted" style="font-size:12px">Responde segun <b>como eres casi siempre</b>, no como te gustaria ser. Escala 1 (casi nunca) a 5 (casi siempre). ~8 minutos. <b>No es diagnostico</b>: es un espejo para descubrir tu top 5 y tu fortaleza a regar.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="viaTestReset" class="btn" style="width:auto">↺ Limpiar</button>' +
    '<button type="button" id="viaTestCalc" class="btn btn-accent" style="width:auto">📊 Ver mi resultado</button></div>' +
    '<div id="viaProgreso" class="muted" style="font-size:11px;margin-top:6px"></div></div>' +
    '<div style="margin-top:10px">' + testHTML + '</div>' +
    '<div id="viaResultado" class="menstrual-card hidden" style="margin-top:10px;border-color:var(--gold)"></div></div>' +

    /* FIRMA */
    '<div id="viaFirma" class="hidden">' +
    '<div class="menstrual-grid"><div class="menstrual-card" style="border-color:var(--gold)"><h4>💎 Mis fortalezas firma (top 5)</h4>' +
    '<div id="viaFirmaBox"></div>' +
    '<div class="conv-row" style="margin-top:8px"><label>Desafio actual <input type="text" id="viaDesafio" placeholder="ej: ordenar la casa, vender pan, estudiar" maxlength="80"></label></div>' +
    '<div id="viaUsoBox" style="margin-top:6px"></div></div>' +
    '<div class="menstrual-card"><h4>🌱 A regar (mi baja elegida)</h4>' +
    '<div class="conv-row"><label>Fortaleza a cultivar <select id="viaRegar"></select></label></div>' +
    '<div id="viaRegarBox" style="margin-top:6px"></div>' +
    '<div class="conv-row" style="margin-top:8px"><label>Mis 5 firma (edita si el test no te reconoce) <input type="text" id="viaFirmaEdit" placeholder="ej: gratitud, amabilidad, humor..." maxlength="120"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="viaFirmaSave" class="btn btn-accent" style="width:auto">💾 Guardar mi firma</button></div></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕘 Historial de tests</h4><div id="viaHistBox"></div></div></div>' +

    /* DIARIO & PUENTES */
    '<div id="viaDiario" class="hidden">' +
    '<div class="menstrual-grid"><div class="menstrual-card" style="border-color:var(--gold)"><h4>📓 Uso de hoy — 1 minuto</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="viaDiaFecha"></label>' +
    '<label>Fortaleza usada <select id="viaDiaFort"></select></label></div>' +
    '<label>Como la use hoy… <input type="text" id="viaDiaTxt" placeholder="ej: use mi perseverancia y termine el informe" maxlength="140"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="viaDiaAdd" class="btn btn-accent" style="width:auto">+ Guardar hoy</button></div>' +
    '<div id="viaDiaList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div>' +
    '<div class="menstrual-card"><h4>🔗 Puentes: tu firma caminando con el calendario</h4>' +
    '<p class="muted" style="font-size:11px">Tu firma no vive encerrada: usala donde ya estas trabajando. Toca y el calendario te lleva (cierra este dialogo y abre el modulo).</p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
    '<button type="button" class="btn via-go" data-go="btnGratitud" style="width:auto;font-size:11px">📓 Gratitud (riega 🙏)</button>' +
    '<button type="button" class="btn via-go" data-go="btnHabits" style="width:auto;font-size:11px">✅ Habitos (sostiene 🎯⛰️)</button>' +
    '<button type="button" class="btn via-go" data-go="btnIkigai" style="width:auto;font-size:11px">🌸 Ikigai (firma → proposito)</button>' +
    '<button type="button" class="btn via-go" data-go="btnEneagrama" style="width:auto;font-size:11px">🔺 Eneagrama (firma vs patron)</button>' +
    '<button type="button" class="btn via-go" data-go="btnPsico" style="width:auto;font-size:11px">🪞 Autoconocimiento</button>' +
    '<button type="button" class="btn via-go" data-go="btnPsicologia" style="width:auto;font-size:11px">🧠 Psicologia (TCC + tests)</button>' +
    '<button type="button" class="btn via-go" data-go="btnDiscipline" style="width:auto;font-size:11px">🎯 Disciplina (foco 5 min)</button>' +
    '<button type="button" class="btn via-go" data-go="btnBreath" style="width:auto;font-size:11px">🌬️ Respiracion (pausa sabia)</button>' +
    '<button type="button" class="btn via-go" data-go="btnBuenVivir" style="width:auto;font-size:11px">🌎 Buen Vivir (firma al territorio)</button>' +
    '</div>' +
    '<div class="si-card" style="margin-top:8px"><h4>🧭 Idea de cruce rapido</h4><p id="viaCruceTxt">Haz el test y vuelve: aqui aparecera como usar tu firma nº1 en tu desafio de hoy.</p></div>' +
    '</div></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap;gap:8px">' +
    '<span id="viaStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="viaShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="viaExport" class="btn" style="width:auto">📥 Exportar</button>' +
    '<button type="button" id="viaToNote" class="btn" style="width:auto">📝 Llevar a nota de hoy</button>' +
    '<button type="button" id="viaClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar todo</button></span></div></div>';

  var old2 = $('viaDialog');
  if (old2) old2.remove();
  var d = document.createElement('dialog');
  d.id = 'viaDialog';
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🌟 Fortalezas VIA — lo mejor de ti en accion</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">6 virtudes x 24 fortalezas (Peterson & Seligman). Guia + fichas + test + firma + diario. Todo <b>privado y local</b> por usuario. <b>Educativo: no diagnostica.</b></p>' +
    body +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}

/* ---------------- RENDERS ---------------- */
function renderVirtBox() {
  var box = $('viaVirtBox'); if (!box) return;
  box.innerHTML = VIA_VIRTUDES.map(function (v) {
    var fs = VIA_FORTS.filter(function (f) { return f.v === v.id; });
    return '<div class="si-card" style="padding:6px 10px"><b style="font-size:12px">' + v.ico + ' ' + esc(v.nombre) + '</b>' +
      '<p class="muted" style="font-size:11px;margin:2px 0">' + esc(v.desc) + '</p>' +
      '<div style="display:flex;gap:4px;flex-wrap:wrap">' + fs.map(function (f) {
        return '<button type="button" class="chip via-jump" data-fort="' + f.id + '" style="font-size:10px;cursor:pointer;color:var(--text,#e8ecff)">' + f.ico + ' ' + esc(f.n) + '</button>';
      }).join('') + '</div></div>';
  }).join('');
  box.querySelectorAll('.via-jump').forEach(function (b) {
    b.onclick = function () { switchTab('Fort'); renderDetalle(b.dataset.fort); };
  });
  var lb = $('viaLunasBox');
  if (lb) lb.innerHTML = VIA_LUNAS.map(function (g) {
    return '<div class="si-card"><h4>' + esc(g.luna) + '</h4><p>' + esc(g.tip) + '</p></div>';
  }).join('');
}
function renderDetalle(id) {
  var box = $('viaDetalle'); if (!box) return;
  var t = fortById(id); if (!t) return;
  var e = store();
  var fav = e.favs.indexOf(id) >= 0;
  box.innerHTML =
    '<h4 style="color:var(--gold)">' + t.ico + ' ' + esc(t.n) + ' <span class="muted">· ' + esc(virtudNombre(t.v)) + '</span></h4>' +
    '<p style="font-size:12px"><b>Que es:</b> ' + esc(t.que) + '</p>' +
    '<p class="muted" style="font-size:12px"><b>Se nota cuando:</b> ' + esc(t.senal) + '</p>' +
    '<div class="fishing-grid"><div><p style="font-size:12px">🌟 <b>En luz:</b><br>· ' + t.luz.map(esc).join('<br>· ') + '</p></div>' +
    '<div><p style="font-size:12px">🌑 <b>En exceso (sombra):</b><br>' + esc(t.exceso) + '</p>' +
    '<p style="font-size:12px">🌱 <b>Penco:</b> ' + esc(t.penco) + '</p></div></div>' +
    '<div class="si-card"><h4>✏️ Practica 5 min</h4><p>' + esc(t.practica) + '</p><p class="muted">Pregunta sabia: <i>' + esc(t.pregunta) + '</i></p></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
    '<button type="button" class="btn" id="viaFavBtn" style="width:auto">' + (fav ? '★ Quitar de favoritas' : '☆ Marcar favorita') + '</button>' +
    '<button type="button" class="btn btn-accent" id="viaUseBtn" style="width:auto">🌱 Usarla hoy</button></div>';
  var fb = $('viaFavBtn');
  if (fb) fb.onclick = function () {
    var dd = store();
    var i = dd.favs.indexOf(id);
    if (i >= 0) dd.favs.splice(i, 1); else dd.favs.push(id);
    save(); renderDetalle(id); renderStats();
  };
  var ub = $('viaUseBtn');
  if (ub) ub.onclick = function () {
    switchTab('Diario');
    var sel = $('viaDiaFort');
    if (sel) sel.value = id;
    var tx = $('viaDiaTxt');
    if (tx) { tx.focus(); }
  };
}
function filterForts() {
  var q = (($('viaQ') || {}).value || '').toLowerCase();
  var v = ($('viaVirtF') || {}).value || '';
  document.querySelectorAll('#viaFortGrid .via-fort-card').forEach(function (card) {
    var f = fortById(card.dataset.fort);
    var hay = ((f.n + ' ' + f.que + ' ' + f.tag + ' ' + f.senal + ' ' + virtudNombre(f.v)).toLowerCase().indexOf(q) >= 0);
    var okV = !v || f.v === v;
    card.style.display = (hay && okV) ? '' : 'none';
  });
}
function calcTest() {
  var per = {};
  VIA_FORTS.forEach(function (f) { per[f.id] = { sum: 0, n: 0 }; });
  var contestadas = 0;
  for (var i = 0; i < VIA_TEST.length; i++) {
    var sel = document.querySelector('input[name="viaQ' + i + '"]:checked');
    if (sel) { contestadas++; var fid = VIA_TEST[i].f; per[fid].sum += (+sel.value); per[fid].n++; }
  }
  var arr = VIA_FORTS.map(function (f) {
    var p = per[f.id];
    return { id: f.id, avg: p.n ? (p.sum / p.n) : 0, sum: p.sum };
  });
  arr.sort(function (a, b) { return b.avg - a.avg || b.sum - a.sum; });
  // virtudes promedio
  var vv = {};
  VIA_VIRTUDES.forEach(function (vx) {
    var fs = VIA_FORTS.filter(function (f) { return f.v === vx.id; });
    var s = 0, m = 0;
    fs.forEach(function (f) { if (per[f.id].n) { s += per[f.id].sum / per[f.id].n; m++; } });
    vv[vx.id] = m ? (s / m) : 0;
  });
  return { per: per, arr: arr, virt: vv, contestadas: contestadas };
}
function updateProgreso() {
  var r = calcTest();
  var box = $('viaProgreso');
  if (box) box.textContent = r.contestadas + ' / ' + VIA_TEST.length + ' respondidas' + (r.contestadas < VIA_TEST.length ? ' — responde todas para un resultado fiable' : ' ✓ lista para calcular');
}
function showResultado(res, saved) {
  var box = $('viaResultado'); if (!box) return;
  var arr = res.arr;
  var top = arr.slice(0, 5);
  var low = arr.slice(-1)[0];
  var max = 5;
  box.classList.remove('hidden');
  box.innerHTML = '<h4>📊 Tu resultado ' + (saved ? '(guardado ✓)' : '(sin guardar)') + '</h4>' +
    '<p class="muted" style="font-size:11px">Promedio por fortaleza (1-5, 2 preguntas c/u). Tu <b>top 5 = tus firma</b>. La mas baja = tu riego de esta luna (sin culpa: es dormida, no defecto).</p>' +
    arr.map(function (a, idx) {
      var f = fortById(a.id);
      var pct = Math.round(a.avg / max * 100);
      var isTop = idx < 5;
      return '<div style="display:flex;align-items:center;gap:8px;margin:4px 0">' +
        '<span style="min-width:150px;font-size:11px"><b>' + f.ico + ' ' + esc(f.n) + '</b>' + (isTop ? ' 💎' : '') + '</span>' +
        '<span style="flex:1;background:var(--panel);border:1px solid var(--line);border-radius:6px;height:14px;overflow:hidden"><span style="display:block;height:100%;width:' + pct + '%;background:' + (isTop ? 'var(--gold)' : 'var(--accent)') + ';opacity:' + (isTop ? '1' : '.55') + '"></span></span>' +
        '<b style="min-width:36px;text-align:right">' + a.avg.toFixed(1) + '</b>' +
        '<button type="button" class="btn btn-icon via-ver" data-id="' + a.id + '" title="Ver ficha">👁</button></div>';
    }).join('') +
    '<div class="si-card" style="margin-top:8px"><h4>💎 Tus firma: ' + top.map(function (a) { var f = fortById(a.id); return f.ico + ' ' + f.n; }).join(' · ') + '</h4>' +
    '<p>🌱 A regar: <b>' + fortById(low.id).ico + ' ' + esc(fortById(low.id).n) + '</b> (' + low.avg.toFixed(1) + '/5): ' + esc(fortById(low.id).practica) + '</p></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn btn-accent" id="viaSaveTest" style="width:auto">💾 Guardar (firma + historial)</button>' +
    '<button type="button" class="btn" id="viaReadTop" style="width:auto">📖 Leer mi firma nº1</button></div>';
  box.querySelectorAll('.via-ver').forEach(function (b) {
    b.onclick = function () { switchTab('Fort'); renderDetalle(b.dataset.id); };
  });
  var rt = $('viaReadTop');
  if (rt) rt.onclick = function () { switchTab('Fort'); renderDetalle(top[0].id); };
  var sv = $('viaSaveTest');
  if (sv) sv.onclick = function () {
    var dd = store();
    var avgs = {};
    arr.forEach(function (a) { avgs[a.id] = Math.round(a.avg * 10) / 10; });
    dd.tests.push({ id: uid('v'), fecha: todayKey(), avgs: avgs, top: top.map(function (a) { return a.id; }), low: low.id });
    dd.firma = top.map(function (a) { return a.id; });
    save('Firma guardada 💎');
    syncFirmaUI(); renderHist(); renderStats(); renderStreak(); renderUsoBox();
    showResultado(res, true);
  };
  try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}
function syncFirmaUI() {
  var dd = store();
  var selR = $('viaRegar');
  if (selR && (!selR.options || selR.options.length <= 1)) {
    selR.innerHTML = VIA_FORTS.map(function (f) {
      return '<option value="' + f.id + '">' + f.ico + ' ' + esc(f.n) + '</option>';
    }).join('');
  }
  var selD = $('viaDiaFort');
  if (selD && (!selD.options || !selD.options.length)) {
    selD.innerHTML = VIA_FORTS.map(function (f) {
      return '<option value="' + f.id + '">' + f.ico + ' ' + esc(f.n) + '</option>';
    }).join('');
  }
  // regar por defecto: ultima baja del ultimo test
  var last = (dd.tests || []).slice(-1)[0];
  if (selR) {
    if (last && last.low) selR.value = last.low;
    else if (!selR.value && VIA_FORTS.length) selR.value = VIA_FORTS[0].id;
  }
  var box = $('viaFirmaBox');
  if (box) {
    if (!dd.firma || !dd.firma.length) {
      box.innerHTML = '<p class="muted" style="font-size:12px">Aun sin firma. Haz el test 📝 o escribe tus 5 abajo a mano (vale igual: tu te conoces).</p>';
    } else {
      box.innerHTML = '<div style="display:flex;gap:6px;flex-wrap:wrap">' + dd.firma.map(function (id, i) {
        var f = fortById(id);
        if (!f) return '';
        return '<button type="button" class="chip via-firma-jump" data-id="' + id + '" style="font-size:11px;border-color:var(--gold);cursor:pointer;color:var(--text,#e8ecff)" title="Ver ficha">' + (i + 1) + '. ' + f.ico + ' <b>' + esc(f.n) + '</b></button>';
      }).join('') + '</div>' +
      '<p class="muted" style="font-size:11px;margin-top:6px">Toca una para leer su ficha. Tu nº1 es tu motor: usala primero en tu desafio.</p>';
      box.querySelectorAll('.via-firma-jump').forEach(function (b) {
        b.onclick = function () { switchTab('Fort'); renderDetalle(b.dataset.id); };
      });
    }
  }
  var eb = $('viaFirmaEdit');
  if (eb && document.activeElement !== eb) eb.value = (dd.firma || []).map(function (id) { var f = fortById(id); return f ? f.n : id; }).join(', ');
  renderRegarBox();
  renderUsoBox();
}
function renderRegarBox() {
  var box = $('viaRegarBox'); if (!box) return;
  var sel = $('viaRegar');
  var id = sel ? sel.value : null;
  var f = (id && fortById(id)) || null;
  if (!f) { box.innerHTML = ''; return; }
  box.innerHTML = '<div class="chip" style="display:block;white-space:normal;line-height:1.6">🌱 <b>' + f.ico + ' ' + esc(f.n) + '</b> (' + esc(virtudNombre(f.v)) + ')<br><span class="muted">Micro-practica: ' + esc(f.practica) + '</span></div>';
}
function renderUsoBox() {
  var box = $('viaUsoBox'); if (!box) return;
  var dd = store();
  var des = (($('viaDesafio') || {}).value || '').trim();
  if (!dd.firma || !dd.firma.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Cuando tengas tu firma, aqui veras como usarla en tu desafio.</p>'; return; }
  var rows = dd.firma.slice(0, 5).map(function (id, i) {
    var f = fortById(id);
    if (!f) return '';
    var uso = VIA_USOS[id] || ('Usa tu ' + f.n + ' hoy en algo concreto.');
    return '<div class="si-card" style="padding:6px 10px"><b style="font-size:12px">' + (i + 1) + '. ' + f.ico + ' ' + esc(f.n) + '</b><p class="muted" style="font-size:11px;margin:2px 0 0">' + esc(uso) + (des ? ' → Desafio: “' + esc(des) + '”.' : '') + '</p></div>';
  }).join('');
  box.innerHTML = rows;
  var ct = $('viaCruceTxt');
  if (ct) {
    var f1 = fortById(dd.firma[0]);
    ct.textContent = f1 ? ('Tu motor hoy: ' + f1.n + ' — ' + (VIA_USOS[f1.id] || '')) + (des ? (' Desafio: ' + des + '.') : ' Escribe tu desafio en 💎 Mis firma para afinarlo.') : 'Haz el test primero.';
  }
}
function streak() {
  var d = store().diario, s = 0, cur = new Date(todayKey() + 'T12:00:00');
  var has = function (k) { return !!(d[k] && String(d[k].txt || d[k] || '').trim()); };
  if (!has(todayKey())) cur = new Date(cur.getTime() - 86400000);
  for (var i = 0; i < 365; i++) {
    var k = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
    if (has(k)) s++; else break;
    cur = new Date(cur.getTime() - 86400000);
  }
  return s;
}
function renderStreak() {
  var b = $('viaStreak'); if (!b) return;
  var e = store();
  var nd = Object.keys(e.diario || {}).length;
  var nt = (e.tests || []).length;
  var f = (e.firma || []).map(function (id) { var x = fortById(id); return x ? x.ico : ''; }).join(' ');
  b.innerHTML = '<b>🌟 Racha:</b> ' + streak() + ' dias · <b>' + nd + '</b> dias de diario · <b>' + nt + '</b> tests' +
    (f ? ' · firma: ' + f : '') +
    '<span class="muted" style="font-size:11px"> — 1 uso diario vale mas que 1 test al ano</span>';
}
function renderDiario() {
  var box = $('viaDiaList'); if (!box) return;
  var d = store().diario || {};
  var keys = Object.keys(d).sort().reverse().slice(0, 30);
  if (!keys.length) { box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin registros. Anota 1 uso al dia (1 linea basta).</p>'; return; }
  box.innerHTML = keys.map(function (k) {
    var r = d[k];
    var txt = typeof r === 'string' ? r : (r.txt || '');
    var fid = (r && r.fort) || '';
    var f = fid ? fortById(fid) : null;
    return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(k) + '</b>' + (f ? ' · ' + f.ico + ' ' + esc(f.n) : '') + '<br>' + esc(txt) + '</span>' +
      '<button type="button" class="btn btn-icon via-dia-del" data-k="' + esc(k) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.via-dia-del').forEach(function (x) {
    x.onclick = function () { var e = store(); delete e.diario[x.dataset.k]; save(); renderDiario(); renderStats(); renderStreak(); };
  });
}
function renderHist() {
  var box = $('viaHistBox'); if (!box) return;
  var t = store().tests || [];
  if (!t.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin tests guardados. Responde el test y pulsa “💾 Guardar”.</p>'; return; }
  box.innerHTML = t.slice().reverse().slice(0, 10).map(function (r) {
    var tops = (r.top || []).slice(0, 3).map(function (id) { var f = fortById(id); return f ? f.ico + ' ' + f.n : id; }).join(' · ');
    var lf = r.low ? fortById(r.low) : null;
    return '<div class="hora-item"><span style="font-size:11px"><b>' + esc(r.fecha || '') + '</b> · ' + esc(tops) + (lf ? ' · 🌱 ' + esc(lf.n) : '') + '</span>' +
      '<button type="button" class="btn btn-icon via-hist-del" data-id="' + r.id + '" title="Borrar">✕</button></div>';
  }).join('');
  box.querySelectorAll('.via-hist-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.tests = e.tests.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderHist(); renderStats(); renderStreak(); };
  });
}
function renderStats() {
  var st = $('viaStats'); if (!st) return;
  var e = store();
  st.textContent = (e.tests.length ? e.tests.length + ' test(s)' : 'sin tests') + ' · ' + Object.keys(e.diario || {}).length + ' dia(s) de diario' + ((e.firma || []).length ? ' · ' + e.firma.length + ' firma' : '') + ((e.favs || []).length ? ' · ' + e.favs.length + ' favoritas' : '');
}
function buildShareText() {
  var e = store();
  var t = '🌟 Mis Fortalezas VIA · ' + todayKey() + '\n\n';
  if ((e.firma || []).length) {
    t += '💎 Firma: ' + e.firma.map(function (id) { var f = fortById(id); return f ? f.ico + ' ' + f.n : id; }).join(' · ') + '\n';
    var f1 = fortById(e.firma[0]);
    if (f1) t += 'Motor: ' + f1.n + ' — ' + (VIA_USOS[f1.id] || '') + '\n';
  } else t += 'Sin firma aun (haz el test 📝).\n';
  var last = (e.tests || []).slice(-1)[0];
  if (last) {
    var lf = last.low ? fortById(last.low) : null;
    if (lf) t += 'A regar: ' + lf.ico + ' ' + lf.n + '\n';
  }
  var dk = Object.keys(e.diario || {}).sort().reverse().slice(0, 3);
  if (dk.length) t += '\nUltimos usos:\n' + dk.map(function (k) { var r = e.diario[k]; var txt = typeof r === 'string' ? r : (r.txt || ''); return '• ' + k + ': ' + txt; }).join('\n') + '\n';
  return t + '\n— Usar lo mejor de mi, cada dia · Penco';
}

/* ---------------- PUENTES DE ENTRADA (desde otros modulos) ---------------- */
function bridgeIntoOthers() {
  // 1) Boton “ver VIA” dentro del dialogo de Psicologia (pestana Tests)
  try {
    var dlg = $('psicologiaDialog');
    if (dlg && !dlg.querySelector('.via-open-full')) {
      var cards = dlg.querySelectorAll('.menstrual-card');
      for (var i = 0; i < cards.length; i++) {
        var h = cards[i].querySelector('h4');
        if (h && /historial de tests/i.test(h.textContent || '')) {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'btn btn-accent via-open-full';
          b.style.cssText = 'width:auto;margin-top:8px';
          b.textContent = '🌟 Abrir mis Fortalezas VIA';
          b.onclick = function () { try { var m = $('psicologiaDialog'); if (m && m.open) m.close(); } catch (e) {} setTimeout(function () { try { $('btnVIA').click(); } catch (e2) {} }, 150); };
          cards[i].appendChild(b);
          break;
        }
      }
    }
  } catch (e) {}
  // 2) Keywords cruzadas para que el buscador encuentre VIA desde otros botones
  try { addKw('btnPsico', 'fortalezas via virtudes caracter firma test'); } catch (e2) {}
  try { addKw('btnPsicologia', 'fortalezas via virtudes caracter'); } catch (e3) {}
  try { addKw('btnEneagrama', 'fortalezas via virtudes firma'); } catch (e4) {}
  try { addKw('btnIkigai', 'fortalezas via firma talentos usar'); } catch (e5) {}
  try { addKw('btnMetodos', 'fortalezas via virtudes estoicismo caracter'); } catch (e6) {}
}

/* ---------------- SETUP ---------------- */
function ensureButton() {
  try {
    if (!$('btnVIA')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnVIA'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🌟 Fortalezas VIA';
        try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'fortalezas via virtudes caracter firma test valores accion peterson seligman sabiduria coraje humanidad justicia templanza trascendencia creatividad curiosidad juicio aprender perspectiva valentia perseverancia honestidad entusiasmo amor amabilidad inteligencia social equipo equidad liderazgo perdon humildad prudencia autorregulacion belleza gratitud esperanza humor espiritualidad bienestar florecer usar top regar');
        var ref = $('btnIkigai') || $('btnEneagrama') || $('btnMetodos');
        if (ref && ref.parentNode === g) {
          if (ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
          else g.appendChild(btn);
        } else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnVIA');
        var grp = cur.closest ? cur.closest('.action-group') : null;
        var nm = grp && grp.getAttribute ? grp.getAttribute('data-group') : null;
        if (nm && nm !== 'linaje') {
          var gd = document.querySelector('.action-group[data-group="linaje"] .group-btns');
          if (gd) { gd.appendChild(cur); try { cur.setAttribute('data-sub', 'interior'); } catch (eS2) {} }
        }
      } catch (eM) {}
    }
  } catch (e) {}
}
function ensureCheckbox() {
  try {
    if (document.querySelector('#configDialog input[data-btn="btnVIA"]')) return;
    var groups = document.querySelectorAll('#configDialog .config-group');
    groups.forEach(function (gr) {
      var h = gr.querySelector('h5');
      if (h && h.textContent.indexOf('Linaje') >= 0) {
        var lab = document.createElement('label');
        lab.className = 'check-row';
        lab.innerHTML = '<input type="checkbox" data-btn="btnVIA"> 🌟 Fortalezas VIA';
        gr.appendChild(lab);
        try {
          var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
          lab.querySelector('input').checked = !vis || vis.btnVIA !== false;
          lab.querySelector('input').onchange = function () {
            try {
              var DR = (typeof DATA !== 'undefined') ? DATA : null;
              if (DR) {
                DR.config = DR.config || {}; DR.config.visible = DR.config.visible || {};
                DR.config.visible.btnVIA = lab.querySelector('input').checked;
                if (typeof scheduleSave === 'function') scheduleSave();
                if (typeof applyVisibility === 'function') applyVisibility();
              }
            } catch (e2) {}
          };
        } catch (e2) {}
      }
    });
  } catch (e) {}
}

function ensureViaCss() {
  // Los <button class="chip"> heredan el color negro del navegador y no se
  // leen sobre el fondo oscuro. Se fuerza color claro + hover visible.
  try {
    if ($('viaContrastCss')) return;
    var st = document.createElement('style');
    st.id = 'viaContrastCss';
    st.textContent =
      '#viaDialog button.chip, #viaDialog .chip { color: var(--text, #e8ecff); }' +
      '#viaDialog .chip b { color: var(--gold, #e8c56a); }' +
      '#viaDialog button.chip { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 5px 11px; font: inherit; }' +
      '#viaDialog button.chip:hover { border-color: var(--gold, #e8c56a); background: rgba(232,197,106,.12); }' +
      '#viaDialog .via-jump, #viaDialog .via-firma-jump { color: var(--text, #e8ecff); }' +
      '#viaDialog .muted { color: var(--muted); }';
    document.head.appendChild(st);
  } catch (e) {}
}

function wire() {
  ensureViaCss();
  ensureButton();
  makeDialog();
  renderVirtBox();
  syncFirmaUI();
  renderDiario();
  renderHist();
  renderStats();
  renderStreak();
  updateProgreso();

  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnVIA') < 0) ALL_BTNS.push('btnVIA');
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (k) {
        var p = PRESETS[k];
        if (!p || typeof p !== 'object') return;
        if (p.btnEneagrama && p.btnVIA === undefined) p.btnVIA = true;
        if (p.btnMetodos && p.btnVIA === undefined) p.btnVIA = true;
        if (p.btnPsicologia && p.btnVIA === undefined) p.btnVIA = true;
      });
    }
  } catch (e) {}
  ensureCheckbox();
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  bridgeIntoOthers();

  var b = $('btnVIA');
  if (b && !b.dataset.viaW) {
    b.dataset.viaW = '1';
    b.onclick = function () {
      try { renderVirtBox(); } catch (e) {}
      try { syncFirmaUI(); } catch (e2) {}
      try { renderDiario(); renderHist(); renderStats(); renderStreak(); updateProgreso(); } catch (e3) {}
      if ($('viaDiaFecha') && !$('viaDiaFecha').value) $('viaDiaFecha').value = todayKey();
      switchTab('Guia');
      openDlg('viaDialog');
    };
  }

  ['Guia', 'Fort', 'Test', 'Firma', 'Diario'].forEach(function (t) {
    var tb = $('tabVia' + t);
    if (tb && !tb.dataset.w) { tb.dataset.w = '1'; tb.onclick = function () { switchTab(t); }; }
  });

  var q = $('viaQ'); if (q && !q.dataset.w) { q.dataset.w = '1'; q.oninput = filterForts; }
  var cf = $('viaVirtF'); if (cf && !cf.dataset.w) { cf.dataset.w = '1'; cf.onchange = filterForts; }
  document.querySelectorAll('#viaFortGrid .via-fort-card').forEach(function (card) {
    if (card.dataset.w) return; card.dataset.w = '1';
    card.onclick = function () { renderDetalle(card.dataset.fort); };
  });

  document.querySelectorAll('input[name^="viaQ"]').forEach(function (r) {
    if (!r.dataset.w) { r.dataset.w = '1'; r.onchange = updateProgreso; }
  });
  var rs = $('viaTestReset');
  if (rs && !rs.dataset.w) {
    rs.dataset.w = '1';
    rs.onclick = function () {
      document.querySelectorAll('input[name^="viaQ"]').forEach(function (r) { r.checked = false; });
      var rb = $('viaResultado'); if (rb) rb.classList.add('hidden');
      updateProgreso();
    };
  }
  var calc = $('viaTestCalc');
  if (calc && !calc.dataset.w) {
    calc.dataset.w = '1';
    calc.onclick = function () {
      var r = calcTest();
      if (r.contestadas < VIA_TEST.length) {
        if (!confirm('Respondiste ' + r.contestadas + ' de ' + VIA_TEST.length + '. El resultado sera poco fiable. ¿Verlo igual?')) return;
      }
      showResultado(r, false);
      switchTab('Test');
    };
  }

  var rg = $('viaRegar');
  if (rg && !rg.dataset.w) { rg.dataset.w = '1'; rg.onchange = function () { renderRegarBox(); }; }
  var de = $('viaDesafio');
  if (de && !de.dataset.w) { de.dataset.w = '1'; de.oninput = function () { renderUsoBox(); }; }
  var fs = $('viaFirmaSave');
  if (fs && !fs.dataset.w) {
    fs.dataset.w = '1';
    fs.onclick = function () {
      var raw = clean((($('viaFirmaEdit') || {}).value || ''), 120).trim();
      if (!raw) return alert('Escribe tus 5 firma separadas por coma');
      var parts = raw.split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
      var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
      var ids = [];
      parts.forEach(function (p) {
        var np = norm(p);
        for (var i = 0; i < VIA_FORTS.length; i++) {
          var f = VIA_FORTS[i];
          if (norm(f.n) === np || norm(f.n).indexOf(np) === 0 || np.indexOf(norm(f.n)) >= 0) {
            if (ids.indexOf(f.id) < 0) ids.push(f.id);
            break;
          }
        }
      });
      if (ids.length < 3) return alert('Pude reconocer ' + ids.length + ' (necesito al menos 3). Revisa los nombres: ej “gratitud, humor, perseverancia”.');
      var dd = store();
      dd.firma = ids.slice(0, 5);
      save('Firma guardada 💎');
      syncFirmaUI(); renderStats(); renderStreak();
      switchTab('Diario');
    };
  }

  var da = $('viaDiaAdd');
  if (da && !da.dataset.w) {
    da.dataset.w = '1';
    da.onclick = function () {
      var k = ($('viaDiaFecha') && $('viaDiaFecha').value) || todayKey();
      var fid = ($('viaDiaFort') && $('viaDiaFort').value) || '';
      var txt = clean((($('viaDiaTxt') || {}).value || '').trim(), 300);
      if (!txt) return alert('Escribe como la usaste hoy (1 linea basta)');
      var e = store();
      e.diario[k] = { fort: fid, txt: txt };
      save('Guardado ✓'); $('viaDiaTxt').value = '';
      renderDiario(); renderStats(); renderStreak();
    };
  }

  document.querySelectorAll('.via-go').forEach(function (btn2) {
    if (btn2.dataset.w) return; btn2.dataset.w = '1';
    btn2.onclick = function () { goMod(btn2.dataset.go); };
  });

  var sh = $('viaShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = async function () { await share('🌟 Mis Fortalezas VIA', buildShareText()); };
  }
  var ex = $('viaExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var blob = new Blob([buildShareText()], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mis-fortalezas-via.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var tn = $('viaToNote');
  if (tn && !tn.dataset.w) {
    tn.dataset.w = '1';
    tn.onclick = function () {
      var e = store();
      var txt = (($('viaDiaTxt') || {}).value || '').trim();
      if (!txt && (e.firma || []).length) {
        var f1 = fortById(e.firma[0]);
        txt = f1 ? ('🌟 Mi firma: ' + f1.n + ' — ' + (VIA_USOS[f1.id] || '')) : '';
      }
      if (!txt) txt = '🌟 Trabajo de fortalezas VIA';
      try {
        var info = (typeof todayInfo === 'function') ? todayInfo() : null;
        if (!info) return alert('No se pudo ubicar hoy');
        var note = txt.slice(0, 280);
        if (info.luna === 'dft') { var c = cyc(currentCycleYear()); c.dft.nota = (c.dft.nota ? c.dft.nota + '\n' : '') + note; }
        else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + note; }
        save(); if (typeof renderLuna === 'function' && typeof currentView !== 'undefined' && currentView.tipo === 'luna') renderLuna();
        alert('Llevado a la nota de hoy ✓');
      } catch (e2) { alert('No se pudo llevar a la nota'); }
    };
  }
  var cl = $('viaClear');
  if (cl && !cl.dataset.w) {
    cl.dataset.w = '1';
    cl.onclick = function () {
      if (!confirm('¿Borrar todo tu registro VIA (tests, firma, diario)?')) return;
      try { var u = userData(); u.via = blank(); } catch (e) {}
      save(); syncFirmaUI(); renderDiario(); renderHist(); renderStats(); renderStreak();
    };
  }
}

window.VIA = { tab: switchTab, forts: VIA_FORTS, virtudes: VIA_VIRTUDES, data: store, shareText: buildShareText, usos: VIA_USOS };

var _retry = 0;
function setup() {
  var ready = false;
  try { ready = !!document.querySelector('.action-group[data-group="linaje"] .group-btns') && (typeof userData === 'function'); } catch (e) {}
  if (!ready) {
    _retry++;
    if (_retry < 80) setTimeout(setup, 500);
    return;
  }
  try { wire(); } catch (e) {}
  setTimeout(function () { try { bridgeIntoOthers(); } catch (e) {} }, 2500);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 400); });
else setTimeout(setup, 400);

})();
