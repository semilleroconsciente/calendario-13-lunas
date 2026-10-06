/* ============================================================
   IA — Inteligencia Artificial — Calendario 13 Lunas (Penco)
   Seccion: Aprender, Crear y Jugar > Sub "ia"
   Botones (sub "ia"):
     btnIAGuia, btnIAPrompts, btnIAUsos,
     btnIASegura, btnIATaller, btnIAGlos
   Dialogo iaDialog con 6 pestanas:
     1) Guia: que es, como funciona, limites, metodo C.R.I.A.
     2) Prompts: biblioteca copiable + mis prompts guardados
     3) Usos: por area del calendario (huerta, cocina, estudio,
        trabajo, salud, interior, hogar, territorio)
     4) Segura: privacidad, alucinaciones, deepfakes, estafas con IA
     5) Taller: 5 ejercicios + chequeo 12 puntos + bitacora local
     6) Glosario + quiz de 6 preguntas
   - Todo local y privado por usuario: userData().ia
     { prompts:[], exps:[], checks:{}, quizBest:0 }
   - 100% offline. No llama a ninguna IA ni envia datos:
     ensena a usar la IA de tu celu/PC con criterio territorial.
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
    if (!u) return { prompts: [], exps: [], checks: {}, quizBest: 0 };
    if (!u.ia) u.ia = { prompts: [], exps: [], checks: {}, quizBest: 0 };
    var r = u.ia;
    if (!Array.isArray(r.prompts)) r.prompts = [];
    if (!Array.isArray(r.exps)) r.exps = [];
    if (!r.checks || Array.isArray(r.checks)) r.checks = {};
    if (typeof r.quizBest !== 'number') r.quizBest = 0;
    return r;
  } catch (e) { return { prompts: [], exps: [], checks: {}, quizBest: 0 }; }
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
function copyTxt(t) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () {
        if (typeof toast === 'function') toast('Copiado 📋');
        else alert('Copiado. Pegalo en tu app de IA favorita.');
      }, function () { alert(t); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = t; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); alert('Copiado 📋'); } catch (e) { alert(t); }
      ta.remove();
    }
  } catch (e) { try { alert(t); } catch (e2) {} }
}
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }
function openTab(t) { buildIfNeeded(); switchTab(t); renderAll(); openDlg('iaDialog'); }

/* ---------------- DATOS ---------------- */
var REGLAS = [
  { n: 'La IA predice palabras, no sabe la verdad', ico: '🧠', txt: 'Un chat de IA <b>adivina la respuesta mas probable</b>, no consulta un libro sagrado. Por eso a veces <b>inventa con total seguridad</b> (fechas, leyes, remedios, citas). Regla de oro: <b>todo dato importante se verifica</b> en otra fuente (CESFAM, municipio, Sernapesca, tu profe, el frasco del remedio).' },
  { n: 'Tu contexto manda: directiva vaga = respuesta vaga', ico: '🎯', txt: 'Si pides “hazme una dieta”, te da algo generico. Si dices <b>quien eres, que tienes y para que lo quieres</b>, te da algo util. Usa siempre el metodo <b>C.R.I.A.</b> (pestana Guia): Contexto + Rol + Instruccion + Ajuste.' },
  { n: 'Parte en chico: una tarea, una pregunta', ico: '🌱', txt: 'No le pidas “arreglame la vida”. Pidele <b>una cosa concreta</b>: “resumeme este texto en 5 ideas”, “dame 3 ideas de once sana con lo que tengo”, “corrigeme esta carta”. Lo chico sale bien; lo gigante sale enredado.' },
  { n: 'Itera: pide, revisa, corrige, repite', ico: '🔁', txt: 'La primera respuesta es un <b>borrador</b>, no el final. Responde: “mas corto”, “con palabras simples”, “ahora en lista para copiar”, “dame otra version para ninos”. <b>2 o 3 vueltas</b> cambian todo.' },
  { n: 'Tus datos valen: no subas lo sensible', ico: '🤐', txt: '<b>Nunca</b> pegues RUT, claves, fotos de carnet, cuentas bancarias, fotos intimas ni datos de ninos con nombre y colegio. Lo que subes a un chat gratis <b>puede guardarse y entrenar modelos</b>. Anonimizalo primero (ver pestana Uso seguro).' },
  { n: 'La IA no reemplaza al territorio', ico: '🌊', txt: 'Para siembra, pesca, salud y tramites de Penco <b>manda el saber local</b>: la vecina, el pescador, la matrona, el funcionario. Usa la IA para <b>ordenar ideas, redactar, estudiar y planificar</b>; la decision final la tomas tu con gente real.' }
];

var METODO_CRIA = [
  { l: 'C — Contexto', t: 'Quien eres y que tienes. Ej: “Soy de Penco, tengo huerta chica con sombra manana, 2 ninos, presupuesto bajo”. Sin contexto, la IA inventa uno gringo.' },
  { l: 'R — Rol', t: 'A quien le pides que sea. Ej: “Actua como profesora de basica paciente”, “como nutricionista chilena”, “como contador simple”. El rol afina el tono y el nivel.' },
  { l: 'I — Instruccion', t: 'Que quieres, en que formato y cuanto. Ej: “Dame 3 menus de 20 min, en lista de compras por feria, maximo 150 palabras”. Formato + limite = respuesta usable.' },
  { l: 'A — Ajuste', t: 'La vuelta 2 y 3. Ej: “Mas barato”, “Sin lactosa”, “En simple para mi mama”, “Ahora hazme las preguntas que te faltan para hacerlo mejor”. El ajuste es donde aparece la calidad.' }
];

var PROMPTS = [
  { cat: 'huerta', ico: '🌱', t: 'Plan de siembra Penco', p: 'Actua como huertera de la costa del Bio-Bio. Tengo [espacio: balcon/patio chico], [sol: manana/todo el dia], luna actual [X]. Dame que sembrar este mes en Penco, en tabla: cultivo | almácigo o directo | dias a cosecha | consejo de riego. Maximo 10 cultivos, lenguaje simple.' },
  { cat: 'huerta', ico: '🐛', t: 'Plaga: diagnostico paso a paso', p: 'Tengo [cultivo] con [sintoma: hojas amarillas / bichitos negros / hoyos]. Hazme 5 preguntas para diagnosticar, luego dame 3 soluciones naturales de bajo costo (preparados, manejo, prevencion) y cuando derivar a un agronomo. Sin inventar pesticidas prohibidos.' },
  { cat: 'cocina', ico: '🍽️', t: 'Once con lo que hay', p: 'Tengo en casa: [lista 5 ingredientes]. Dame 3 ideas de once chilena sana de maximo 20 minutos, con pasos numerados cortos y que le guste a ninos. Sin ingredientes caros ni importados raros.' },
  { cat: 'cocina', ico: '🛒', t: 'Lista feria semanal', p: 'Somos [N personas], presupuesto [$]. Hazme lista de feria para 5 almuerzos de la semana, estilo chileno, con cantidades en kilos y un menu dia por dia. Barato, de estacion en el Bio-Bio.' },
  { cat: 'estudio', ico: '📚', t: 'Explicame como si tuviera 12', p: 'Explicame [tema] como si tuviera 12 anos, con un ejemplo de Penco (mar, feria, micro), luego dame 5 preguntas de quiz con respuestas al final. Maximo 200 palabras la explicacion.' },
  { cat: 'estudio', ico: '🗣️', t: 'Practicar ingles / mapuzugun', p: 'Quiero practicar [ingles basico / mapuzugun saludos]. Hazme un dialogo corto de [situacion: comprar en feria], corrige mis errores con amabilidad y dame 5 frases utiles con pronunciacion. Una correccion a la vez, no me abrumes.' },
  { cat: 'trabajo', ico: '💼', t: 'CV simple que postula', p: 'Actua como orientadora laboral OMIL. Mi experiencia: [lista]. Hazme un CV de 1 pagina en espanol chileno, con perfil de 3 lineas, experiencia con verbos de accion y habilidades. Sin inventar titulos ni fechas.' },
  { cat: 'trabajo', ico: '📝', t: 'Carta / correo formal', p: 'Redactame una [carta / correo / solicitud] para [municipalidad / colegio / pega], motivo: [X]. Tono respetuoso y claro, maximo 150 palabras, con asunto, saludo, 3 parrafos y despedida. Deja [brackets] donde deba completar mis datos.' },
  { cat: 'interior', ico: '🪞', t: 'Ordenar una pena (no terapia)', p: 'Estoy [emocion] por [situacion breve]. Ayudame a ordenarlo: 1) reflejame lo que entendi, 2) 3 preguntas suaves para pensar, 3) un ejercicio de respiracion o escritura de 5 min. No diagnostiques ni des remedios. Si menciono hacerme dano, dame el *4141 de Chile primero.' },
  { cat: 'interior', ico: '🎯', t: 'Meta de la luna en pasos', p: 'Mi meta esta luna: [X]. Transformala en plan de 4 semanas con 2 acciones chicas por semana, un indicador simple y un ritual de cierre. Considera que trabajo [horario] y tengo [tiempo real]. Motivame sin frases vacias.' },
  { cat: 'hogar', ico: '💰', t: 'Presupuesto quincena', p: 'Gano [$], gastos fijos: [lista con montos]. Hazme presupuesto quincenal en tabla simple, con 3 recortes posibles sin sufrir y un monto de ahorro aunque sea chico. Sin juzgarme, con pasos concretos.' },
  { cat: 'hogar', ico: '🏠', t: 'Orden por zonas 15 min', p: 'Mi casa es [descripcion breve]. Dame un plan de orden por zonas de 15 minutos diarios por 7 dias, con lista de tareas tachable y regla de que botar/donar/guardar. Para alguien que se abruma rapido: empieza por lo mas facil.' },
  { cat: 'territorio', ico: '🎣', t: 'Salida de pesca / bosque', p: 'Voy a [pescar a orilla / caminar al cerro] en Penco este [dia]. Dame checklist de seguridad (clima, marea, equipo, aviso a familia), que llevar en mochila chica y 3 reglas de cuidado del lugar. No inventes datos de mareas: dime que los revise en SHOA.' },
  { cat: 'comunidad', ico: '📢', t: 'Aviso vecinal claro', p: 'Necesito un aviso para [minga / taller / venta / junta]. Datos: [fecha, hora, lugar, que traer]. Redactalo en 80 palabras, con titulo llamativo, 3 emojis maximo y llamado a la accion. Dame version WhatsApp y version cartel.' }
];

var USOS = [
  { a: '🌱 Huerta y siembra lunar', u: 'Calendario de almácigos, asociar cultivos, diagnosticar plagas con fotos descritas, preparar bioles con lo que tienes.', e: '“Tengo tomates con hojas enrolladas en pleno viento sur de Penco, ¿riego, hongo o frio? Hazme preguntas y dame manejo organico.”', c: 'Cruza siempre con la Siembra lunar de la app y con tu observacion: la IA no ve tu tierra.' },
  { a: '🍽️ Cocina y despensa', u: 'Menus con lo que hay, listas de feria baratas, conservar y fermentar, adaptar recetas a alergias.', e: 'Foto mental: “tengo cochayuyo seco, papas y cebolla: 2 recetas de 30 min”.', c: 'Pide cantidades en gramos y tiempo real; desconfia de “superalimentos milagrosos”.' },
  { a: '📚 Estudio e idiomas', u: 'Resumir textos, explicar mate paso a paso, practicar ingles/mapuzugun, hacer quizzes, preparar pruebas.', e: 'Pegale tu materia y pide: “resumen en 5 ideas + ejemplo de la feria + quiz de 5”.', c: 'Verifica fechas y formulas en tu cuaderno: la IA se equivoca en numeros.' },
  { a: '💼 Trabajo y tramites', u: 'CV, cartas, correos formales, practicar entrevistas, entender un tramite en simple.', e: '“Explicame el Registro Social de Hogares como si fuera mi primera vez, en 10 pasos”.', c: 'El tramite real se confirma en ChileAtiende o la Muni: la IA orienta, no decreta.' },
  { a: '💚 Salud y cuerpo', u: 'Organizar habitos, ideas de movimiento en casa, ordenar preguntas para llevar al CESFAM.', e: '“Ayudame a preparar mis 5 preguntas para el control de presion del jueves”.', c: 'Jamas diagnostico ni dosis por chat. Urgencia: llama 131 / *4141 salud mental.' },
  { a: '🪞 Interior y memoria', u: 'Diario guiado, ordenar ideas, cartas no enviadas, plan de habitos, reflexion lunar.', e: '“Guiame un journaling de 10 min sobre esta luna: 4 preguntas, una a la vez”.', c: 'Si aparece trauma o ideas de dano: pausa y pide apoyo humano (*4141, CESFAM).' },
  { a: '🏠 Hogar y plata', u: 'Presupuestos, listas de compras, planes de aseo por zonas, comparar cuentas de luz/lena.', e: '“Gano 500 mil, arriendo 250: armame quincena con ahorro de 20 mil”.', c: 'No pegues cartolas ni claves: dicta solo montos anonimos.' },
  { a: '🌊 Territorio Penco', u: 'Planificar salidas seguras, redactar avisos vecinales, rescatar historias para la Voz de los Abuelos.', e: '“Transcribe esta historia de mi abuela y separala en 3 partes para contarla”.', c: 'Vedas, mareas y alertas se verifican en Sernapesca/SHOA/Senapred, no en el chat.' }
];

var RIESGOS = [
  { n: 'Alucinaciones: inventa seguro', ico: '🌀', q: 'Fechas, leyes, dosis, citas y “estudios” pueden ser falsos aunque suenen perfectos.', h: ['Pide fuentes y revisalas (que existan de verdad).', 'Cruza datos duros en 2 fuentes oficiales.', 'Si es salud, plata o tramite: confirma con humano competente.'] },
  { n: 'Tus datos quedan registrados', ico: '👁️', q: 'Lo gratis se paga con datos. Lo que pegas puede guardarse para entrenar.', h: ['Anonimiza: “mi hija de 8 del colegio X” → “una nina de 8”.', 'Tacha RUT, direcciones, patentes en fotos antes de subir.', 'Usa el modo temporal / sin historial si tu app lo tiene.'] },
  { n: 'Voz e imagen clonada (deepfake)', ico: '🎙️', q: 'Con 10 segundos de un video ya clonan una voz que llora “mamá, ayudame”.', h: ['Palabra secreta familiar (ej: nombre del perro de la abuela).', 'Cuelga y llama al numero de SIEMPRE.', 'Nunca transfieras por audio o videollamada corta apurada.'] },
  { n: 'Estafas potenciadas con IA', ico: '🎣', q: 'Mensajes sin faltas, “ofertas de pega”, videos de famosos vendiendo inversiones: todo lo hace la IA.', h: ['Metodo ALTO: urgente = pausa + verificar por otro canal.', 'Premio sin concurso = mentira. Pega que paga por reenviar plata = lavado.', 'Denuncia: PDI, *4242, SERNAC. Ver 🛡️ Ciberseguridad.'] },
  { n: 'Sesgo: habla como gringo', ico: '🌎', q: 'Por defecto receta con ingredientes caros, medidas en tazas gringas y “otoño en octubre”.', h: ['Aterrizala: “en Penco, Chile, con feria y presupuesto bajo”.', 'Pide unidades chilenas (kilos, lucas) y estacion del sur.', 'Si repite estereotipos, corrigela: “reformulalo sin prejuicios”.'] },
  { n: 'Dependencia: que no piense por ti', ico: '⚖️', q: 'Si le delegas todo, se atrofia tu criterio (y tu memoria).', h: ['Usala para borrador, tu pones el juicio final.', 'Estudia CON ella, no EN vez de ti: que te pregunte, no solo responda.', '1 dia a la semana sin IA: cuaderno, conversa, territorio.'] }
];

var CHECKS = [
  { id: 'c1', t: 'Se pedir con contexto (quien soy + que tengo)' },
  { id: 'c2', t: 'Doy rol + formato + limite (tabla, lista, N palabras)' },
  { id: 'c3', t: 'Itero 2-3 vueltas antes de dar por bueno' },
  { id: 'c4', t: 'No subo RUT, claves, carnet ni datos de ninos' },
  { id: 'c5', t: 'Verifico datos duros en 2da fuente' },
  { id: 'c6', t: 'Detecto alucinaciones (fechas, citas, dosis)' },
  { id: 'c7', t: 'Tengo palabra secreta familiar anti-deepfake' },
  { id: 'c8', t: 'Se anonimizar antes de pegar (nombres, fotos)' },
  { id: 'c9', t: 'La uso para estudiar, no para copiar sin pensar' },
  { id: 'c10', t: 'Confirmo tramites/salud/mareas con fuente oficial' },
  { id: 'c11', t: 'Se pedir “pregunta lo que te falta” para afinar' },
  { id: 'c12', t: 'Cierro con accion concreta (no solo chateo)' }
];

var TALLER = [
  { n: '1 · Mi primer CRIA (15 min)', p: 'Elige UNA tarea real de hoy (un correo, una once, un resumen). Escribela floja (“hazme un menu”), guarda la respuesta, y reescribela con C.R.I.A. completo. Compara en tu bitacora: ¿que mejoro? Marca 1 aprendizaje.' },
  { n: '2 · Caza-alucinaciones (15 min)', p: 'Pidele “dame 5 fechas de fiestas de Penco con fuente”. Revisa una por una si existen. Anota cuales invento y como sonaba de segura. Leccion: tono seguro ≠ verdad. Registra tu % de acierto detective.' },
  { n: '3 · Anonimiza como espia (10 min)', p: 'Toma un problema real con datos sensibles y reescribelo 2 veces: version peligrosa (con nombres, RUT, colegio) y version segura (anonima). Pega SOLO la segura. Guarda ambas en tu cuaderno como plantilla.' },
  { n: '4 · Profe particular (20 min)', p: 'Pegale una materia que te cueste y pide: “explicame en simple + ejemplo de Penco + quiz de 5, una pregunta a la vez”. Responde el quiz sin mirar. Anota nota y lo que aun te enreda.' },
  { n: '5 · Del chat a la accion (20 min)', p: 'Pide un plan de 7 dias para una meta chica (caminar, ordenar pieza, ahorrar). Conviertelo en compromisos en el Calendario (Notas del dia + recordatorio). Al 7mo dia evalua: ¿sirvio? ¿que ajusto?' }
];

var GLOS = [
  ['IA / Inteligencia Artificial', 'Programa que aprende patrones de millones de textos para predecir respuestas utiles. No “piensa” como tu: calcula lo mas probable.'],
  ['Chat / Asistente', 'La ventanita donde conversas (ChatGPT, Gemini, Copilot, etc.). Es SOLO la puerta: el motor esta atras.'],
  ['Modelo / LLM', 'El “cerebro” entrenado con texto (GPT, Gemini, Claude, Llama). Cada uno tiene fecha de corte: lo nuevo puede no saberlo.'],
  ['Prompt', 'Tu instruccion. Prompt bueno = contexto + rol + pedido + formato + limite. Es el 80% del resultado.'],
  ['Contexto / Ventana', 'Lo que “recuerda” en esa conversa. Si es largo, se marea: parte un chat nuevo por tema.'],
  ['Token', 'Pedacito de palabra que cobra y cuenta. Mas texto = mas tokens = mas lento/caro. Pide corto.'],
  ['Alucinacion', 'Invento dicho con seguridad (fecha, cita, ley falsa). Se detecta verificando, no “sintiendolo”.'],
  ['Sesgo', 'Inclinacion aprendida de sus datos (gringo, urbano, joven). Se corrige aterrizando: “en Penco, barato, simple”.'],
  ['Rol / System', 'El papel que le das (“actua como profe paciente”). Define tono, nivel y cuidado.'],
  ['Iterar', 'Dar vueltas de mejora: “mas corto”, “mas simple”, “en lista”. La calidad vive en la vuelta 2-3.'],
  ['Verificacion en 2 pasos', 'Doble llave de tus cuentas (clave + codigo). Frenan el robo aunque te roben la clave. Activalo hoy.'],
  ['Deepfake', 'Voz/imagen falsa hiperreal. Defensa: palabra secreta + llamar al numero de siempre.'],
  ['Phishing con IA', 'Estafa escrita perfecta gracias a la IA. Defensa: metodo ALTO (ver Ciberseguridad).'],
  ['Privacidad / Anonimizar', 'Quitar datos que identifican antes de pegar. Regla: si te daria verguenza verlo publicado, no lo pegues.'],
  ['Modo temporal', 'Opcion de algunos chats para no guardar historial. Usalo para temas delicados (igual anonimiza).'],
  ['Uso responsable', 'Verificar, no delegar el juicio, citar ayuda, no hacer trampa en pruebas ni difamar. La herramienta no te quita la responsabilidad.']
];

var QUIZ = [
  { q: 'Le pegas a la IA los RUT y notas de tus hijos para que “les haga un plan de estudio”. ¿Esta bien?', opts: ['Si, total es privado', 'No: anonimizo primero (edades y ramos, sin nombres/colegio/RUT)', 'Si, si borro el chat despues igual da lo mismo'], ok: 1, por: 'Los datos de ninos nunca se suben identificables. Se anonimiza siempre, aunque el chat prometa no guardar.' },
  { q: 'La IA te da una “ley” con numero y articulo para un reclamo en la Muni. Suena perfecta. ¿Que haces?', opts: ['La copio tal cual a la carta', 'La verifico en leychile.cl o pregunto en la Muni antes de usarla', 'Le pido otra ley mas larga'], ok: 1, por: 'Las citas legales son el invento favorito de la IA. Toda ley se verifica en fuente oficial.' },
  { q: 'Te llega un audio de tu hijo llorando pidiendo plata urgente a una cuenta rara. ¿Que haces?', opts: ['Transfiero altiro, es su voz', 'Cuelgo, lo llamo al numero de siempre y uso la palabra secreta familiar', 'Le pido a la IA que analice si es verdad'], ok: 1, por: 'La voz se clona facil. Palabra secreta + llamar al numero guardado: esa es la defensa.' },
  { q: '¿Cual pedido (prompt) da mejor resultado?', opts: ['“Hazme una dieta”', '“Soy de Penco, 2 ninos, poco presupuesto: dame 3 menus de 20 min en lista de feria, max 150 palabras”', '“Dime algo rico”'], ok: 1, por: 'Contexto + formato + limite = respuesta usable. Lo vago da humo.' },
  { q: 'La IA te da dosis de un remedio natural “infalible”. ¿Que haces?', opts: ['Lo tomo, es natural', 'No lo tomo por chat: consulto CESFAM/farmacia y el envase; la IA no receta', 'Le subo la dosis si no hace efecto'], ok: 1, por: 'Ningun chat receta ni dosifica. Salud = profesional + fuente oficial.' },
  { q: 'Para una prueba, ¿cual es el uso responsable?', opts: ['Que me de las respuestas para copiar', 'Que me explique con ejemplos y me haga quiz para estudiar yo', 'Que escriba el trabajo entero con mi nombre'], ok: 1, por: 'Estudiar CON la IA te hace mas capaz; copiar te deja vacio el dia que importa.' }
];

/* ---------------- DIALOGO ---------------- */
function switchTab(t) {
  ['Guia', 'Prompts', 'Usos', 'Segura', 'Taller', 'Glos'].forEach(function (x) {
    var p = $('ia' + x), b = $('tabIA' + x);
    if (p) p.classList.toggle('hidden', x !== t);
    if (b) b.classList.toggle('btn-accent', x === t);
  });
}
function makeDialog() {
  if ($('iaDialog')) return $('iaDialog');
  var d = document.createElement('dialog');
  d.id = 'iaDialog';
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🤖 Inteligencia Artificial — usala a tu favor</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Guia practica y territorial: <b>pedir bien, verificar siempre y cuidar tus datos</b>. 100% offline: esta seccion no se conecta a ninguna IA, te prepara para usar la de tu celu o PC con criterio penqueño.</p>' +
    '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
    '<button type="button" id="tabIAGuia" class="btn btn-accent" style="width:auto">📖 Guia</button>' +
    '<button type="button" id="tabIAPrompts" class="btn" style="width:auto">💬 Prompts</button>' +
    '<button type="button" id="tabIAUsos" class="btn" style="width:auto">🛠️ Usos</button>' +
    '<button type="button" id="tabIASegura" class="btn" style="width:auto">🛡️ Uso seguro</button>' +
    '<button type="button" id="tabIATaller" class="btn" style="width:auto">🧪 Taller</button>' +
    '<button type="button" id="tabIAGlos" class="btn" style="width:auto">📚 Glosario</button></div>' +
    '<div id="iaGuia"></div>' +
    '<div id="iaPrompts" class="hidden"></div>' +
    '<div id="iaUsos" class="hidden"></div>' +
    '<div id="iaSegura" class="hidden"></div>' +
    '<div id="iaTaller" class="hidden"></div>' +
    '<div id="iaGlos" class="hidden"></div>' +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  ['Guia', 'Prompts', 'Usos', 'Segura', 'Taller', 'Glos'].forEach(function (t) {
    var b = $('tabIA' + t);
    if (b) b.onclick = function () { switchTab(t); renderAll(); };
  });
  return d;
}
function buildIfNeeded() { makeDialog(); }

/* ---------------- RENDER ---------------- */
function renderGuia() {
  var box = $('iaGuia'); if (!box) return;
  box.innerHTML =
    '<div class="si-card"><h4>🤖 ¿Que es (en simple)?</h4><p>Es como un <b>vecino muy leido pero que a veces inventa</b>: conversas por texto, te resume, redacta, explica y te da ideas en segundos. Sirve para <b>borradores, planes, estudio y cartas</b>. No sirve como <b>oraculo</b>: no sabe tu tierra, no ve tu huerta, no conoce la ultima ordenanza. Tu pones el contexto de Penco y el juicio final.</p></div>' +
    REGLAS.map(function (r) {
      return '<div class="si-card"><h4>' + r.ico + ' ' + esc(r.n) + '</h4><p>' + r.txt + '</p></div>';
    }).join('') +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🎯 Metodo C.R.I.A. (pegado al refri)</h4>' +
    METODO_CRIA.map(function (m) { return '<p style="font-size:12px"><b>' + esc(m.l) + ':</b> ' + esc(m.t) + '</p>'; }).join('') +
    '<div class="si-card" style="margin-top:8px"><h4>Ejemplo flojo vs CRIA</h4><p class="muted" style="font-size:11px">❌ Flojo: “hazme un menu sano”.</p><p style="font-size:12px">✅ CRIA: “<b>C:</b> somos 4 en Penco, 2 ninos, poco presupuesto y solo feria. <b>R:</b> actua como cocinera chilena practica. <b>I:</b> dame 3 almuerzos de 25 min en tabla con ingredientes en kilos. <b>A:</b> despues te pido version sin fritura”. Copialo y adaptalo: esta en 💬 Prompts.</p></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="iaGoPrompts" class="btn btn-accent" style="width:auto">💬 Ir a prompts copiables →</button></div></div>';
  var g = $('iaGoPrompts');
  if (g) g.onclick = function () { switchTab('Prompts'); renderAll(); };
}

function renderPrompts() {
  var box = $('iaPrompts'); if (!box) return;
  var cats = {};
  PROMPTS.forEach(function (p) { (cats[p.cat] = cats[p.cat] || []).push(p); });
  var mine = store().prompts.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  box.innerHTML =
    '<div class="si-card"><h4>💬 Biblioteca: toca 📋 para copiar</h4><p>Reemplaza los <b>[brackets]</b> con tus datos ANONIMOS antes de pegar en tu chat de IA. Parte por 1 solo prompt hoy.</p></div>' +
    Object.keys(cats).map(function (c) {
      return '<div class="menstrual-card" style="margin-top:8px"><h4>📌 ' + esc(c) + ' (' + cats[c].length + ')</h4>' +
        cats[c].map(function (p, i) {
          return '<div class="habit-item"><b>' + p.ico + ' ' + esc(p.t) + '</b><p class="muted" style="font-size:11px;white-space:pre-wrap;margin:6px 0">' + esc(p.p) + '</p>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" style="width:auto;font-size:11px" data-copy="' + c + ':' + i + '">📋 Copiar</button>' +
            '<button class="btn" style="width:auto;font-size:11px" data-savep="' + c + ':' + i + '">⭐ Guardar en mis prompts</button></div></div>';
        }).join('') + '</div>';
    }).join('') +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>⭐ Mis prompts (guardados aqui, privados)</h4>' +
    '<div class="conv-row"><label style="flex:2">Titulo <input type="text" id="iaMyPT" placeholder="ej: menu feria quincena" maxlength="40"></label></div>' +
    '<label>Prompt <textarea id="iaMyPX" rows="2" placeholder="Pega o escribe tu mejor version CRIA..." maxlength="800"></textarea></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="iaMyPAdd" class="btn btn-accent" style="width:auto">+ Guardar mi prompt</button></div>' +
    '<div id="iaMyPList" class="habits-list" style="margin-top:8px;max-height:240px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="iaMyPStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px"><button type="button" id="iaMyPShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="iaMyPClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>';
  box.querySelectorAll('[data-copy]').forEach(function (b) {
    b.onclick = function () {
      var k = b.getAttribute('data-copy').split(':');
      var p = (cats[k[0]] || [])[+k[1]];
      if (p) copyTxt(p.p);
    };
  });
  box.querySelectorAll('[data-savep]').forEach(function (b) {
    b.onclick = function () {
      var k = b.getAttribute('data-savep').split(':');
      var p = (cats[k[0]] || [])[+k[1]];
      if (!p) return;
      store().prompts.push({ id: uid('ip'), t: p.t, x: p.p, fecha: todayKey() });
      save('Prompt guardado ⭐'); renderPrompts();
    };
  });
  function paintMine() {
    var lb = $('iaMyPList'); if (!lb) return;
    var m = store().prompts.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
    lb.innerHTML = m.length ? m.map(function (r) {
      return '<div class="habit-item"><b>⭐ ' + esc(r.t) + '</b> <span class="muted" style="font-size:10px">' + esc(r.fecha || '') + '</span>' +
        '<p class="muted" style="font-size:11px;white-space:pre-wrap">' + esc(r.x) + '</p>' +
        '<div style="display:flex;gap:6px"><button class="btn" style="width:auto;font-size:11px" data-cp="' + r.id + '">📋</button>' +
        '<button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
    }).join('') : '<p class="muted">Vacio. Guarda aqui los que te resulten: tu biblioteca personal vale oro.</p>';
    var st = $('iaMyPStats');
    if (st) st.textContent = m.length + ' prompts propios';
    lb.querySelectorAll('[data-del]').forEach(function (x) {
      x.onclick = function () {
        var dd = store().prompts;
        var i = dd.findIndex(function (z) { return z.id === x.getAttribute('data-del'); });
        if (i >= 0) dd.splice(i, 1);
        save(); paintMine();
      };
    });
    lb.querySelectorAll('[data-cp]').forEach(function (x) {
      x.onclick = function () {
        var dd = store().prompts;
        var r = dd.find(function (z) { return z.id === x.getAttribute('data-cp'); });
        if (r) copyTxt(r.x);
      };
    });
  }
  paintMine();
  if ($('iaMyPAdd')) $('iaMyPAdd').onclick = function () {
    var t = clean($('iaMyPT').value, 40); if (!t) return alert('Ponle un titulo');
    var x = clean($('iaMyPX').value, 800); if (!x) return alert('Escribe el prompt');
    store().prompts.push({ id: uid('ip'), t: t, x: x, fecha: todayKey() });
    save('Prompt guardado ⭐'); $('iaMyPT').value = ''; $('iaMyPX').value = ''; paintMine();
  };
  if ($('iaMyPClear')) $('iaMyPClear').onclick = function () {
    if (!confirm('¿Borrar mis prompts? (la biblioteca base se mantiene)')) return;
    try { store().prompts = []; } catch (e) {}
    save(); paintMine();
  };
  if ($('iaMyPShare')) $('iaMyPShare').onclick = function () {
    var m = store().prompts;
    if (!m.length) return alert('Sin prompts propios');
    share('⭐ Mis prompts IA (' + m.length + ')', m.map(function (r) { return '· ' + r.t + '\n' + r.x; }).join('\n\n'));
  };
}

function renderUsos() {
  var box = $('iaUsos'); if (!box) return;
  box.innerHTML = '<div class="si-card"><h4>🛠️ La IA por rincon del calendario</h4><p>Cada area tiene su <b>uso estrella, un ejemplo copiable y su cuidado</b>. La IA propone, el territorio dispone.</p></div>' +
    USOS.map(function (u) {
      return '<div class="si-card"><h4>' + esc(u.a) + '</h4><p><b>Uso:</b> ' + esc(u.u) + '</p>' +
        '<p class="muted" style="font-size:11px"><b>Ejemplo:</b> ' + esc(u.e) + '</p>' +
        '<p style="font-size:11px"><b>⚠️ Cuidado:</b> ' + esc(u.c) + '</p></div>';
    }).join('');
}

function renderSegura() {
  var box = $('iaSegura'); if (!box) return;
  box.innerHTML = '<div class="si-card"><h4>🛡️ Usar IA sin regalar tu vida</h4><p>6 riesgos reales con su defensa en simple. Leelos 1 vez en familia: protegen mas que cualquier antivirus.</p></div>' +
    RIESGOS.map(function (r) {
      return '<div class="si-card"><h4>' + r.ico + ' ' + esc(r.n) + '</h4><p><b>El problema:</b> ' + esc(r.q) + '</p>' +
        '<p><b>✅ Defensa:</b><br>' + r.h.map(function (h, i) { return (i + 1) + ') ' + h; }).join('<br>') + '</p></div>';
    }).join('') +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🤐 Antes de pegar, anonimiza (30 seg)</h4>' +
    '<p class="muted" style="font-size:11px">“Mi hija Antonia, 3°B colegio X, RUT 12.345…” → “Una nina de 9, materia matematicas”. “Gano 650 en pesquera Y” → “Sueldo medio, trabajo por turnos”.</p>' +
    '<div class="conv-row"><label style="flex:2">Pegalo peligroso <input type="text" id="iaAnonIn" placeholder="ej: vivo en calle X 123, Penco..." maxlength="120"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="iaAnonBtn" class="btn btn-accent" style="width:auto">🛡️ Anonimizar</button></div>' +
    '<div id="iaAnonOut" class="chip" style="display:block;white-space:normal;margin-top:8px">Aqui aparece tu version segura…</div></div>';
  if ($('iaAnonBtn')) $('iaAnonBtn').onclick = function () {
    var v = ($('iaAnonIn') || {}).value || '';
    if (!v.trim()) { $('iaAnonOut').textContent = 'Escribe primero un ejemplo.'; return; }
    var out = v
      .replace(/\b\d{1,2}\.\d{3}\.\d{3}-[\dkK]\b/g, '[RUT]')
      .replace(/\b\d{7,9}-[\dkK]\b/g, '[RUT]')
      .replace(/(calle|pasaje|av\.?|avenida)\s+[a-záéíóúñ\s]+\d+/gi, '[mi calle]')
      .replace(/\b\d{9}\b/g, '[telefono]')
      .replace(/colegio\s+[a-záéíóúñ\s]+/gi, '[su colegio]')
      .replace(/\+?56\s?9\s?\d{4}\s?\d{4}/g, '[telefono]');
    out = 'Version segura (revisa antes de pegar): "' + out.replace(/Antonia|Martín|Camila|Javiera|Benjamín/gi, '[nombre]').slice(0, 200) + '" — ¿Quedó algun dato que te identifique? Sacalo tambien.';
    $('iaAnonOut').textContent = out;
  };
}

var quizIdx = 0, quizPts = 0;
function renderTaller() {
  var box = $('iaTaller'); if (!box) return;
  var st = store();
  var ids = CHECKS.map(function (c) { return c.id; });
  var done = ids.filter(function (id) { return st.checks[id]; }).length;
  var exps = st.exps.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  box.innerHTML =
    '<div class="si-card"><h4>🧪 5 ejercicios (1 por dia, 10-20 min)</h4><p>Hazlos en orden: cada uno deja 1 registro en tu bitacora. La gracia no es “saber de IA”, es <b>pedir mejor y verificar siempre</b>.</p></div>' +
    TALLER.map(function (t) { return '<div class="si-card"><h4>' + esc(t.n) + '</h4><p>' + esc(t.p) + '</p></div>'; }).join('') +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>✅ Mi chequeo IA (' + done + '/12)</h4>' +
    '<div style="background:var(--panel);border-radius:6px;height:8px;overflow:hidden;margin:6px 0"><div style="width:' + Math.round(done / 12 * 100) + '%;height:100%;background:linear-gradient(90deg,#7ab8ff,#e8c56a,#8fd694)"></div></div>' +
    '<div id="iaChecksBox">' + CHECKS.map(function (c) {
      return '<label class="check-row" style="font-size:12px"><input type="checkbox" data-chk="' + c.id + '"' + (st.checks[c.id] ? ' checked' : '') + '> ' + esc(c.t) + '</label>';
    }).join('') + '</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>📓 Bitacora de experimentos (privada)</h4>' +
    '<p class="muted" style="font-size:11px">Que pedi, que me dio, que verifique y que aprendi. 3 lineas bastan.</p>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="iaExpDate" value="' + todayKey() + '"></label>' +
    '<label>Nota /10 <select id="iaExpNota"><option>3</option><option>5</option><option selected>7</option><option>8</option><option>10</option></select></label></div>' +
    '<label>Pedi <input type="text" id="iaExpP" placeholder="ej: menu feria con CRIA" maxlength="80"></label>' +
    '<label>Aprendi <input type="text" id="iaExpA" placeholder="ej: con formato tabla sirve; invento precios" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="iaExpAdd" class="btn btn-accent" style="width:auto">+ Guardar experimento</button></div>' +
    '<div id="iaExpList" class="habits-list" style="margin-top:8px;max-height:220px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="iaExpStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px"><button type="button" id="iaExpShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="iaExpClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>';
  box.querySelectorAll('[data-chk]').forEach(function (c) {
    c.onchange = function () {
      var s = store();
      s.checks[c.getAttribute('data-chk')] = c.checked;
      save(c.checked ? 'Avance guardado ✅' : 'Guardado OK');
      var ids2 = CHECKS.map(function (x) { return x.id; });
      var d2 = ids2.filter(function (id) { return s.checks[id]; }).length;
      if (d2 === 12) { try { alert('🎉 ¡Chequeo completo! Ya usas IA con criterio. Ensenale a alguien de tu casa.'); } catch (e) {} }
      renderTaller();
    };
  });
  function paintExps() {
    var lb = $('iaExpList'); if (!lb) return;
    var m = store().exps.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
    lb.innerHTML = m.length ? m.slice(0, 30).map(function (r) {
      return '<div class="habit-item"><b>🧪 ' + esc(r.fecha) + '</b> · nota ' + esc(r.nota) + '/10' +
        '<br><span style="font-size:12px">Pedi: ' + esc(r.p) + '</span><br><span class="muted" style="font-size:11px">Aprendi: ' + esc(r.a) + '</span>' +
        '<div style="display:flex;gap:6px;margin-top:4px"><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
    }).join('') : '<p class="muted">Sin experimentos. Guarda el primero hoy: vale mas 1 prueba que 10 videos.</p>';
    var s2 = $('iaExpStats');
    if (s2) s2.textContent = m.length + ' experimentos' + (m.length ? (' · promedio ' + (m.reduce(function (a, r) { return a + (+r.nota || 0); }, 0) / m.length).toFixed(1) + '/10') : '');
    lb.querySelectorAll('[data-del]').forEach(function (x) {
      x.onclick = function () {
        var dd = store().exps;
        var i = dd.findIndex(function (z) { return z.id === x.getAttribute('data-del'); });
        if (i >= 0) dd.splice(i, 1);
        save(); paintExps();
      };
    });
  }
  paintExps();
  if ($('iaExpAdd')) $('iaExpAdd').onclick = function () {
    var p = clean($('iaExpP').value, 80); if (!p) return alert('¿Que le pediste?');
    var a = clean($('iaExpA').value, 80); if (!a) return alert('¿Que aprendiste?');
    store().exps.push({ id: uid('ie'), fecha: $('iaExpDate').value || todayKey(), nota: $('iaExpNota').value || '7', p: p, a: a });
    save('Experimento guardado 🧪'); $('iaExpP').value = ''; $('iaExpA').value = ''; paintExps();
  };
  if ($('iaExpClear')) $('iaExpClear').onclick = function () {
    if (!confirm('¿Borrar bitacora de experimentos?')) return;
    try { store().exps = []; } catch (e) {}
    save(); paintExps();
  };
  if ($('iaExpShare')) $('iaExpShare').onclick = function () {
    var m = store().exps;
    if (!m.length) return alert('Bitacora vacia');
    share('🧪 Mis experimentos IA (' + m.length + ')', m.slice(0, 15).map(function (r) { return '· ' + r.fecha + ' (' + r.nota + '/10) Pedi: ' + r.p + ' → Aprendi: ' + r.a; }).join('\n'));
  };
}

function renderGlos() {
  var box = $('iaGlos'); if (!box) return;
  var best = 0;
  try { best = store().quizBest || 0; } catch (e) {}
  box.innerHTML = '<div class="si-card"><h4>📚 Glosario en chileno (16 palabras)</h4><p>Si entiendes estas 16, entiendes el 90% de lo que hablan de IA. Sin humo tecnico.</p></div>' +
    '<div class="menstrual-card"><div id="iaGlosBox">' + GLOS.map(function (g) {
      return '<p style="font-size:12px;margin:6px 0"><b>' + esc(g[0]) + ':</b> <span class="muted">' + esc(g[1]) + '</span></p>';
    }).join('') + '</div>' +
    '<div class="conv-row"><label style="flex:2">🔍 Buscar <input type="text" id="iaGlosQ" placeholder="ej: prompt, alucinacion..." autocomplete="off"></label></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🧠 Quiz: ¿usas IA con criterio? (mejor: ' + best + '/' + QUIZ.length + ')</h4>' +
    '<div id="iaQuizBox"><p class="muted">6 situaciones reales. Toca empezar: 2 minutos.</p></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="iaQuizStart" class="btn btn-accent" style="width:auto">▶ Empezar quiz</button></div></div>';
  if ($('iaGlosQ')) $('iaGlosQ').oninput = function () {
    var q = ($('iaGlosQ').value || '').toLowerCase();
    $('iaGlosBox').innerHTML = GLOS.filter(function (g) {
      return !q || (g[0] + ' ' + g[1]).toLowerCase().indexOf(q) >= 0;
    }).map(function (g) {
      return '<p style="font-size:12px;margin:6px 0"><b>' + esc(g[0]) + ':</b> <span class="muted">' + esc(g[1]) + '</span></p>';
    }).join('') || '<p class="muted">Sin resultados. Prueba con “prompt” o “datos”.</p>';
  };
  if ($('iaQuizStart')) $('iaQuizStart').onclick = function () { quizIdx = 0; quizPts = 0; paintQuiz(); };
  function paintQuiz() {
    var qb = $('iaQuizBox'); if (!qb) return;
    if (quizIdx >= QUIZ.length) {
      var s = store();
      if (quizPts > (s.quizBest || 0)) { s.quizBest = quizPts; save('Record quiz 🧠'); }
      qb.innerHTML = '<p><b>Resultado: ' + quizPts + '/' + QUIZ.length + '</b> ' + (quizPts === QUIZ.length ? '🟢 ¡Criterio total! Ensenale a tu familia.' : (quizPts >= 4 ? '🟡 Bien, repasa Uso seguro.' : '🔴 Lee la Guia y el Uso seguro con calma y repite.')) + '</p>' +
        '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="iaQuizAgain" class="btn" style="width:auto">🔁 Repetir</button>' +
        '<button type="button" id="iaQuizShare" class="btn" style="width:auto">📤 Compartir</button></div>';
      $('iaQuizAgain').onclick = function () { quizIdx = 0; quizPts = 0; paintQuiz(); };
      $('iaQuizShare').onclick = function () { share('🤖 Mi quiz IA: ' + quizPts + '/' + QUIZ.length, quizPts === QUIZ.length ? 'Uso la IA con criterio: contexto, verificacion y datos cuidados.' : 'Aprendiendo a usar la IA con criterio en Penco.'); };
      return;
    }
    var q = QUIZ[quizIdx];
    qb.innerHTML = '<p style="font-size:12px"><b>' + (quizIdx + 1) + '/' + QUIZ.length + '.</b> ' + esc(q.q) + '</p>' +
      q.opts.map(function (o, i) {
        return '<button type="button" class="btn" style="width:100%;margin-top:6px;text-align:left;white-space:normal" data-opt="' + i + '">' + esc(o) + '</button>';
      }).join('') + '<p class="muted" style="font-size:11px;margin-top:6px">Puntos: ' + quizPts + '</p>';
    qb.querySelectorAll('[data-opt]').forEach(function (b) {
      b.onclick = function () {
        var i = +b.getAttribute('data-opt');
        if (i === q.ok) { quizPts++; try { alert('✅ Correcto: ' + q.por); } catch (e) {} }
        else { try { alert('❌ Casi: ' + q.por); } catch (e) {} }
        quizIdx++; paintQuiz();
      };
    });
  }
}

function renderAll() {
  try { renderGuia(); } catch (e) {}
  try { renderPrompts(); } catch (e) {}
  try { renderUsos(); } catch (e) {}
  try { renderSegura(); } catch (e) {}
  try { renderTaller(); } catch (e) {}
  try { renderGlos(); } catch (e) {}
}

/* ---------------- SETUP: integra en Aprender ---------------- */
var BTNS = [
  { id: 'btnIAGuia', label: '📖 Guia IA', tab: 'Guia', kw: 'ia inteligencia artificial guia que es como funciona cria prompt chatbot chatgpt gemini' },
  { id: 'btnIAPrompts', label: '💬 Prompts utiles', tab: 'Prompts', kw: 'prompt prompts pedir instrucciones ejemplos copiar recetas cv cartas menu huerta' },
  { id: 'btnIAUsos', label: '🛠️ Usos por area', tab: 'Usos', kw: 'usos huerta cocina estudio trabajo salud hogar territorio ejemplos' },
  { id: 'btnIASegura', label: '🛡️ Uso seguro', tab: 'Segura', kw: 'seguro privacidad datos anonimo alucinacion deepfake estafa voz clonada riesgo' },
  { id: 'btnIATaller', label: '🧪 Taller y bitacora', tab: 'Taller', kw: 'taller ejercicios practica chequeo bitacora experimentos aprender' },
  { id: 'btnIAGlos', label: '📚 Glosario y quiz', tab: 'Glos', kw: 'glosario terminos token llm quiz prueba vocabulario' }
];

function ensureSection() {
  var box = document.querySelector('.action-group[data-group="aprender"] .group-btns');
  if (!box) return;
  var lab = box.querySelector('.sub-label[data-sub="ia"]');
  if (!lab) {
    lab = document.createElement('span');
    lab.className = 'sub-label';
    lab.setAttribute('data-sub', 'ia');
    lab.textContent = '🤖 Inteligencia Artificial';
  } else if (!lab.textContent || lab.textContent.indexOf('Inteligencia') < 0) {
    lab.textContent = '🤖 Inteligencia Artificial';
  }
  var created = {};
  BTNS.forEach(function (b) {
    var el = document.getElementById(b.id);
    if (!el) {
      el = document.createElement('button');
      el.id = b.id; el.className = 'btn'; el.type = 'button';
      created[b.id] = el;
    }
    el.textContent = b.label;
    el.setAttribute('data-keywords', b.kw);
    try { el.setAttribute('data-sub', 'ia'); el.dataset.sub = 'ia'; } catch (eS) {}
  });
  try {
    var ref = box.querySelector('.sub-label[data-sub="infancias"]');
    box.insertBefore(lab, ref || null);
    BTNS.forEach(function (b) {
      var el = document.getElementById(b.id) || created[b.id];
      if (el) box.insertBefore(el, ref || null);
    });
    var first = document.getElementById(BTNS[0].id) || created[BTNS[0].id];
    if (first) box.insertBefore(lab, first);
  } catch (eO) {}
  BTNS.forEach(function (b) {
    var el2 = document.getElementById(b.id) || created[b.id];
    if (el2) el2.onclick = function () { openTab(b.tab); };
  });
}

function registerVisibility() {
  try {
    if (typeof ALL_BTNS !== 'undefined') {
      BTNS.forEach(function (b) { if (ALL_BTNS.indexOf(b.id) < 0) ALL_BTNS.push(b.id); });
    }
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') {
      BTNS.forEach(function (b) { BTN_HOME[b.id] = ['aprender', 'ia']; });
    }
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      BTN_ORDER['aprender|ia'] = BTNS.map(function (b) { return b.id; });
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p] && p !== 'esencial') {
          BTNS.forEach(function (b) { PRESETS[p][b.id] = true; });
        }
      });
      if (PRESETS.esencial) BTNS.forEach(function (b) { PRESETS.esencial[b.id] = true; });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
}

function setup() {
  ensureSection();
  registerVisibility();
  buildIfNeeded();
  renderAll();
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);
setTimeout(function () { try { ensureSection(); registerVisibility(); } catch (e) {} }, 2000);

})();
