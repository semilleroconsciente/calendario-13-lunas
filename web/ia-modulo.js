/* ============================================================
   IA — Inteligencia Artificial — Calendario 13 Lunas (Penco) v4 (con OpenCode + modelos abiertos)
   Seccion: Aprender, Crear y Jugar > Sub "ia"
   Botones (sub "ia"):
     btnIAGuia, btnIAPrompts, btnIAUsos,
     btnIAModelos, btnIACrear,
     btnIASegura, btnIATaller, btnIAProy, btnIAGlos
   Dialogo iaDialog con 9 pestanas:
     1) Guia: que es, como funciona, limites, metodo C.R.I.A.,
        errores flojo->CRIA, FAQ, mitos
     2) Prompts: biblioteca copiable (32) + constructor CRIA
        interactivo + evaluador de prompts + mis prompts guardados
     3) Usos: por area del calendario (12 areas)
     4) Modelos: comparativa de asistentes + buscador "cual me conviene"
     5) Crear: textos, imagenes, ideas, cuentos, guiones + derechos
     6) Segura: 8 riesgos + anonimizador mejorado
     7) Taller: 8 ejercicios + chequeo 15 puntos + bitacora local
     8) Proyectos: 8 proyectos territoriales guiados paso a paso
     9) Glosario (28) + quiz de 10 preguntas
   - Todo local y privado por usuario: userData().ia
     { prompts:[], exps:[], checks:{}, quizBest:0, proys:{} }
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
  return String(s == null ? '' : s).slice(0, n || 500);
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
    if (!u) return { prompts: [], exps: [], checks: {}, quizBest: 0, proys: {} };
    if (!u.ia) u.ia = { prompts: [], exps: [], checks: {}, quizBest: 0, proys: {} };
    var r = u.ia;
    if (!Array.isArray(r.prompts)) r.prompts = [];
    if (!Array.isArray(r.exps)) r.exps = [];
    if (!r.checks || Array.isArray(r.checks)) r.checks = {};
    if (typeof r.quizBest !== 'number') r.quizBest = 0;
    if (!r.proys || Array.isArray(r.proys)) r.proys = {};
    return r;
  } catch (e) { return { prompts: [], exps: [], checks: {}, quizBest: 0, proys: {} }; }
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
  { n: 'La IA no reemplaza al territorio', ico: '🌊', txt: 'Para siembra, pesca, salud y tramites de Penco <b>manda el saber local</b>: la vecina, el pescador, la matrona, el funcionario. Usa la IA para <b>ordenar ideas, redactar, estudiar y planificar</b>; la decision final la tomas tu con gente real.' },
  { n: 'Pide fuentes y fecha: la IA se desactualiza', ico: '📅', txt: 'Cada modelo tiene <b>fecha de corte</b>: lo que paso despues puede no saberlo (bonos nuevos, vedas 2026, precios). Pide siempre: <b>“dame las fuentes y dime hasta que fecha sabes”</b>. Si no da fuentes reales, desconfia y verifica en chileatiende.cl, sernapesca.cl o tu Muni.' },
  { n: 'Uso responsable: tu firma, tu responsabilidad', ico: '⚖️', txt: 'Si la IA te ayuda con un trabajo, prueba o carta, <b>revisalo, entiendelo y hazlo tuyo</b>. No presentes como propio lo que no entiendes, no difames a vecinos ni hagas trampa en pruebas: la herramienta no te quita la responsabilidad. <b>Cita la ayuda</b> cuando corresponda (“redactado con apoyo de IA, revisado por mi”).' }
];

var METODO_CRIA = [
  { l: 'C — Contexto', t: 'Quien eres y que tienes. Ej: “Soy de Penco, tengo huerta chica con sombra manana, 2 ninos, presupuesto bajo”. Sin contexto, la IA inventa uno gringo.' },
  { l: 'R — Rol', t: 'A quien le pides que sea. Ej: “Actua como profesora de basica paciente”, “como nutricionista chilena”, “como contador simple”. El rol afina el tono y el nivel.' },
  { l: 'I — Instruccion', t: 'Que quieres, en que formato y cuanto. Ej: “Dame 3 menus de 20 min, en lista de compras por feria, maximo 150 palabras”. Formato + limite = respuesta usable.' },
  { l: 'A — Ajuste', t: 'La vuelta 2 y 3. Ej: “Mas barato”, “Sin lactosa”, “En simple para mi mama”, “Ahora hazme las preguntas que te faltan para hacerlo mejor”. El ajuste es donde aparece la calidad.' }
];

var EJEMPLOS_CRIA = [
  { tema: '🍽️ Cocina', flojo: 'hazme un menu sano', cria: 'C: somos 4 en Penco, 2 ninos, poco presupuesto y solo feria. R: actua como cocinera chilena practica. I: dame 3 almuerzos de 25 min en tabla con ingredientes en kilos. A: despues te pido version sin fritura.' },
  { tema: '🌱 Huerta', flojo: 'que siembro ahora', cria: 'C: patio chico en Penco, sol de manana, luna menguante, tengo compost. R: actua como huertera del Bio-Bio. I: dame 6 cultivos de otono en tabla (cultivo | almacigo o directo | riego). A: preguntame lo que te falte para afinar.' },
  { tema: '💼 Carta formal', flojo: 'hazme una carta para la muni', cria: 'C: vecina de Penco, pido poda de arbol en pasaje. R: actua como redactora formal chilena. I: carta de 120 palabras con asunto, 3 parrafos y despedida, deja [brackets] para mis datos. A: dame version mas firme si no responden en 15 dias.' }
];

var ERRORES = [
  { f: '“Hazme la tarea”', por: 'Demasiado vago: no sabe nivel, ramo ni formato.', fix: 'Pegale la materia y pide: “explicame en simple + ejemplo de Penco + quiz de 5, una pregunta a la vez”.' },
  { f: '“Dame una dieta / un remedio”', por: 'Pide diagnostico sin verte: peligroso y generico.', fix: '“Ayudame a ordenar mis preguntas para el CESFAM del jueves + 3 ideas de once sana con lo que tengo”.' },
  { f: '“Escribeme el informe entero” y lo entrego tal cual', por: 'Trampa + riesgo de inventos con tu nombre.', fix: '“Hazme esquema de 5 puntos + corrigeme mi borrador + dime que mejorar”. Tu escribes el final.' },
  { f: 'Pegar foto del carnet “para que me ayude con el tramite”', por: 'Regalas identidad: RUT + foto sirven para estafas.', fix: 'Dicta solo lo necesario y anonimo: “tramite X, me piden papel Y, ¿que significa en simple?”.' },
  { f: '“Dame la ley exacta para demandar”', por: 'Las citas legales son el invento favorito de la IA.', fix: '“Orientame en simple y dime donde verificar la ley vigente (leychile.cl / Muni)”.' },
  { f: 'Un solo mensaje gigante con 10 pedidos', por: 'Se enreda: mezcla todo y responde mal.', fix: 'Un chat por tema, un pedido por vez. Termina uno, parte otro.' }
];

var FAQ = [
  { q: '¿La IA de esta app me espia o me cobra?', a: 'No. Esta seccion es 100% offline: no se conecta a ninguna IA, no envia nada, no cobra. Te ensena a usar la IA de tu celu o PC (la que ya tienes) con criterio. Tus prompts y bitacora quedan solo en tu usuario local.' },
  { q: '¿Cual IA gratis me sirve si tengo poco internet?', a: 'Meta AI dentro de WhatsApp (liviana, sirve con datos bajos) o Gemini en el navegador del celu. Escribe corto y pide respuestas cortas: “en 100 palabras”. Ve a la pestana Modelos y usa el buscador “cual me conviene”.' },
  { q: '¿Puedo usar IA sin cuenta ni correo?', a: 'Si: Meta AI por WhatsApp no pide otra cuenta; Copilot en Edge y muchos Gemini web dejan probar sin registro, pero con limite. Si te pide RUT, clave bancaria o instalar algo raro para “activar la IA”, es estafa: corta.' },
  { q: '¿Como le pido imagenes?', a: 'Describe como si se lo contaras a un dibujante: sujeto + lugar Penco + luz + estilo + lo que NO quieres. Ej: “atardecer en playa de Penco, pescadores, estilo acuarela, sin texto”. Parte en la pestana Crear: hay 6 guias copiables.' },
  { q: '¿La IA hace la pega por mi para vender?', a: 'Te ayuda con descripciones, precios, avisos y fotos de tus productos, pero el trato, la entrega y la garantia los pones tu. Pide: “describeme este tejido en 60 palabras que antoje, sin mentir ni inventar medidas”.' },
  { q: '¿Se da cuenta el profe si copio todo?', a: 'Casi siempre: tono parejo, palabras raras, datos inventados y cero faltas te delatan. Ademas aprendes cero. Usala para estudiar (que te explique y te pregunte) y entrega con tus palabras.' },
  { q: '¿Puedo subir la voz de mi abuela para “revivirla”?', a: 'Tecnicamente si, pero piensalo en familia: pide permiso, no la uses para enganar ni para pedir plata, y cuida ese audio como tesoro (no lo subas a apps raras). Mejor uso: transcribir sus historias para la Voz de los Abuelos.' },
  { q: '¿Que hago si la IA me dice algo que me asusta (salud, tramite, denuncia)?', a: 'Respira y no actues solo por el chat. Salud: llama 131 o *4141 (salud mental) / anda al CESFAM. Tramite/plata: confirma en ChileAtiende, banco o Muni. Guarda el texto y muestralo a un humano competente.' },
  { q: '¿Puedo publicar lo que creo con IA y decir que es mio?', a: 'Puedes, pero con honestidad: revisalo, corrigelo y agrega “hecho con apoyo de IA”. No vendas fotos de personas falsas como reales ni inventes testimonios. Ve el recuadro de derechos en la pestana Crear.' },
  { q: '¿Y el mapuzugun / lo chileno?', a: 'La IA sabe poquito y a veces inventa palabras. Usala para practicar frases que YA viste en la seccion Kimun Mapuzugun, y pide: “corrigeme con amabilidad y dime si alguna palabra es inventada”. El kimche (sabio) manda: valida con hablantes.' }
];

var PROMPTS = [
  { cat: 'huerta', ico: '🌱', t: 'Plan de siembra Penco', p: 'Actua como huertera de la costa del Bio-Bio. Tengo [espacio: balcon/patio chico], [sol: manana/todo el dia], luna actual [X]. Dame que sembrar este mes en Penco, en tabla: cultivo | almacigo o directo | dias a cosecha | consejo de riego. Maximo 10 cultivos, lenguaje simple.' },
  { cat: 'huerta', ico: '🐛', t: 'Plaga: diagnostico paso a paso', p: 'Tengo [cultivo] con [sintoma: hojas amarillas / bichitos negros / hoyos]. Hazme 5 preguntas para diagnosticar, luego dame 3 soluciones naturales de bajo costo (preparados, manejo, prevencion) y cuando derivar a un agronomo. Sin inventar pesticidas prohibidos.' },
  { cat: 'huerta', ico: '🌙', t: 'Siembra segun la luna', p: 'Estoy en luna [creciente/llena/menguante/nueva] en Penco, otono. Tengo semillas de [lista]. Dime cuales sembrar ahora, cuales esperar y por que, en lista corta. Cruza con regla simple: hoja arriba en creciente, raiz abajo en menguante.' },
  { cat: 'huerta', ico: '🧪', t: 'Biol con lo que tengo', p: 'Tengo [guano/lentejas/cascaras/ortiga...]. Dame receta de biol o purin paso a paso con medidas caseras (tazas, baldes), tiempo de fermentacion y como aplicarlo sin quemar plantas. Aviso de seguridad si es fuerte.' },
  { cat: 'cocina', ico: '🍽️', t: 'Once con lo que hay', p: 'Tengo en casa: [lista 5 ingredientes]. Dame 3 ideas de once chilena sana de maximo 20 minutos, con pasos numerados cortos y que le guste a ninos. Sin ingredientes caros ni importados raros.' },
  { cat: 'cocina', ico: '🛒', t: 'Lista feria semanal', p: 'Somos [N personas], presupuesto [$]. Hazme lista de feria para 5 almuerzos de la semana, estilo chileno, con cantidades en kilos y un menu dia por dia. Barato, de estacion en el Bio-Bio.' },
  { cat: 'cocina', ico: '♻️', t: 'Cocina sin botar (aprovechar)', p: 'Me sobro [pan duro / arroz cocido / verduras medias lacias]. Dame 2 recetas de aprovechamiento chilenas, con tiempo y pasos cortos. Sin botar comida, sin comprar raro.' },
  { cat: 'cocina', ico: '🫙', t: 'Conservar y fermentar', p: 'Quiero conservar [tomates / repollo / cochayuyo]. Dame 1 receta de conserva o fermento segura paso a paso, con higiene, frascos, sal y cuanto dura. Avisa cuando NO comerlo (olor, espuma rara).' },
  { cat: 'estudio', ico: '📚', t: 'Explicame como si tuviera 12', p: 'Explicame [tema] como si tuviera 12 anos, con un ejemplo de Penco (mar, feria, micro), luego dame 5 preguntas de quiz con respuestas al final. Maximo 200 palabras la explicacion.' },
  { cat: 'estudio', ico: '➗', t: 'Mate paso a paso sin darme todo', p: 'Me enreda [ejercicio]. No me des la respuesta altiro: guiame con 1 pista a la vez, espera mi intento, corrigeme con carino y al final resume la regla en 2 lineas. Nivel [basica/media].' },
  { cat: 'estudio', ico: '🗣️', t: 'Practicar ingles / mapuzugun', p: 'Quiero practicar [ingles basico / mapuzugun saludos]. Hazme un dialogo corto de [situacion: comprar en feria], corrige mis errores con amabilidad y dame 5 frases utiles con pronunciacion. Una correccion a la vez, no me abrumes.' },
  { cat: 'estudio', ico: '📝', t: 'Resumir texto largo', p: 'Te pego un texto [pegar]. Resumelo en 5 ideas clave + 3 palabras dificiles explicadas + 1 ejemplo de Penco. Maximo 150 palabras. Sin inventar datos que no estan en el texto.' },
  { cat: 'trabajo', ico: '💼', t: 'CV simple que postula', p: 'Actua como orientadora laboral OMIL. Mi experiencia: [lista]. Hazme un CV de 1 pagina en espanol chileno, con perfil de 3 lineas, experiencia con verbos de accion y habilidades. Sin inventar titulos ni fechas.' },
  { cat: 'trabajo', ico: '📝', t: 'Carta / correo formal', p: 'Redactame una [carta / correo / solicitud] para [municipalidad / colegio / pega], motivo: [X]. Tono respetuoso y claro, maximo 150 palabras, con asunto, saludo, 3 parrafos y despedida. Deja [brackets] donde deba completar mis datos.' },
  { cat: 'trabajo', ico: '🎤', t: 'Practicar entrevista', p: 'Hazme una entrevista de pega para [puesto: aseo / cocina / retail]. Hazme 1 pregunta a la vez, escucha mi respuesta, dame nota 1-7 y como mejorarla en 2 lineas. 6 preguntas en total, tono amable.' },
  { cat: 'trabajo', ico: '💡', t: 'Idea de negocio chico', p: 'Se hacer [tejido / pan / arreglos / aseo]. En Penco, con [$] de capital y [horas] a la semana. Dame 3 ideas de negocio chico con precio sugerido en lucas, donde vender (feria, WhatsApp, JJVV) y primer paso de esta semana.' },
  { cat: 'interior', ico: '🪞', t: 'Ordenar una pena (no terapia)', p: 'Estoy [emocion] por [situacion breve]. Ayudame a ordenarlo: 1) reflejame lo que entendi, 2) 3 preguntas suaves para pensar, 3) un ejercicio de respiracion o escritura de 5 min. No diagnostiques ni des remedios. Si menciono hacerme dano, dame el *4141 de Chile primero.' },
  { cat: 'interior', ico: '🎯', t: 'Meta de la luna en pasos', p: 'Mi meta esta luna: [X]. Transformala en plan de 4 semanas con 2 acciones chicas por semana, un indicador simple y un ritual de cierre. Considera que trabajo [horario] y tengo [tiempo real]. Motivame sin frases vacias.' },
  { cat: 'interior', ico: '📓', t: 'Journaling guiado 10 min', p: 'Guiame un journaling de 10 min sobre [tema de hoy]. Hazme 1 pregunta a la vez (4 en total), espera mi respuesta y al final resumeme lo que descubri en 3 lineas + 1 micro-accion de manana.' },
  { cat: 'hogar', ico: '💰', t: 'Presupuesto quincena', p: 'Gano [$], gastos fijos: [lista con montos]. Hazme presupuesto quincenal en tabla simple, con 3 recortes posibles sin sufrir y un monto de ahorro aunque sea chico. Sin juzgarme, con pasos concretos.' },
  { cat: 'hogar', ico: '🏠', t: 'Orden por zonas 15 min', p: 'Mi casa es [descripcion breve]. Dame un plan de orden por zonas de 15 minutos diarios por 7 dias, con lista de tareas tachable y regla de que botar/donar/guardar. Para alguien que se abruma rapido: empieza por lo mas facil.' },
  { cat: 'hogar', ico: '🧾', t: 'Entender una cuenta o tramite', p: 'Me llego [cuenta de luz / papel de la muni / contrato]. Te copio lo que dice [pegar anonimo]. Explicamelo en simple: que me cobran, que es urgente y que puedo reclamar, en 10 lineas. Sin inventar leyes: dime donde verificar.' },
  { cat: 'territorio', ico: '🎣', t: 'Salida de pesca / bosque', p: 'Voy a [pescar a orilla / caminar al cerro] en Penco este [dia]. Dame checklist de seguridad (clima, marea, equipo, aviso a familia), que llevar en mochila chica y 3 reglas de cuidado del lugar. No inventes datos de mareas: dime que los revise en SHOA.' },
  { cat: 'territorio', ico: '🌿', t: 'Lawen: ordenar preguntas CESFAM', p: 'Tengo [molestia breve, sin pedir diagnostico]. Ayudame a preparar mis 5 preguntas para el CESFAM + que llevar anotado (desde cuando, que empeora/mejora). Sin diagnosticar ni dar dosis. Recuerdame llevar carnet y hora pedida.' },
  { cat: 'comunidad', ico: '📢', t: 'Aviso vecinal claro', p: 'Necesito un aviso para [minga / taller / venta / junta]. Datos: [fecha, hora, lugar, que traer]. Redactalo en 80 palabras, con titulo llamativo, 3 emojis maximo y llamado a la accion. Dame version WhatsApp y version cartel.' },
  { cat: 'comunidad', ico: '🤝', t: 'Acta de reunion en simple', p: 'Te dicto lo que paso en la reunion [pegar apuntes]. Ordenalo en acta simple: fecha, asistentes, 3 acuerdos con responsable y fecha, y proxima reunion. Tono vecinal, sin tecnicismos.' },
  { cat: 'comunidad', ico: '🎉', t: 'Taller o clase que quiero dar', p: 'Se [oficio] y quiero dar un taller de [horas] en [JJVV / colegio]. Armame programa: objetivo, materiales baratos, paso a paso por bloques y como cerrar. Para [ninos / adultos mayores].' },
  { cat: 'crear', ico: '🎨', t: 'Imagen para mi emprendimiento', p: 'Necesito una imagen para [producto: mermelada / tejido]. Descripcion para generador: “[producto] artesanal de Penco sobre mesa de madera, luz calida de manana, fondo mar desenfocado, estilo foto real, sin texto ni manos raras”. Dame 3 variantes + que evitar.' },
  { cat: 'crear', ico: '📖', t: 'Cuento para mis ninos', p: 'Cuentame un cuento de 300 palabras para [edad] con [animal de Penco: loica / pinguino / pez], que deje ensenanza de [cuidar el mar / compartir]. Lenguaje simple, final abrigado, sin sustos. Dame titulo + moraleja.' },
  { cat: 'crear', ico: '🎬', t: 'Guion video corto para vender', p: 'Vendo [producto] en [feria/WhatsApp]. Hazme guion de video de 30 segundos: gancho 3 seg + 3 beneficios + precio + llamado (hablame al WhatsApp). Tono cercano penqueno, sin mentir.' },
  { cat: 'emergencia', ico: '🆘', t: 'Mensaje claro en emergencia', p: 'Necesito avisar a mi familia/red que [situacion breve, sin datos sensibles]. Redactame mensaje de 50 palabras: que paso, donde estoy seguro, que necesito y que NO hagan (no llamar, no difundir). Calmo y claro.' },
  { cat: 'emergencia', ico: '📋', t: 'Plan familiar simple', p: 'Somos [N] en casa en [sector Penco]. Armame plan familiar de 1 pagina: punto de encuentro, mochila (lista de 10), quien hace que, numeros clave (131, 132, 133, *4242). Para pegar en el refri.' }
];

var USOS = [
  { a: '🌱 Huerta y siembra lunar', u: 'Calendario de almacigos, asociar cultivos, diagnosticar plagas con fotos descritas, preparar bioles con lo que tienes.', e: '“Tengo tomates con hojas enrolladas en pleno viento sur de Penco, ¿riego, hongo o frio? Hazme preguntas y dame manejo organico.”', c: 'Cruza siempre con la Siembra lunar de la app y con tu observacion: la IA no ve tu tierra.' },
  { a: '🍽️ Cocina y despensa', u: 'Menus con lo que hay, listas de feria baratas, conservar y fermentar, adaptar recetas a alergias.', e: 'Foto mental: “tengo cochayuyo seco, papas y cebolla: 2 recetas de 30 min”.', c: 'Pide cantidades en gramos y tiempo real; desconfia de “superalimentos milagrosos”.' },
  { a: '📚 Estudio e idiomas', u: 'Resumir textos, explicar mate paso a paso, practicar ingles/mapuzugun, hacer quizzes, preparar pruebas.', e: 'Pegale tu materia y pide: “resumen en 5 ideas + ejemplo de la feria + quiz de 5”.', c: 'Verifica fechas y formulas en tu cuaderno: la IA se equivoca en numeros.' },
  { a: '💼 Trabajo y tramites', u: 'CV, cartas, correos formales, practicar entrevistas, entender un tramite en simple.', e: '“Explicame el Registro Social de Hogares como si fuera mi primera vez, en 10 pasos”.', c: 'El tramite real se confirma en ChileAtiende o la Muni: la IA orienta, no decreta.' },
  { a: '💚 Salud y cuerpo', u: 'Organizar habitos, ideas de movimiento en casa, ordenar preguntas para llevar al CESFAM.', e: '“Ayudame a preparar mis 5 preguntas para el control de presion del jueves”.', c: 'Jamas diagnostico ni dosis por chat. Urgencia: llama 131 / *4141 salud mental.' },
  { a: '🪞 Interior y memoria', u: 'Diario guiado, ordenar ideas, cartas no enviadas, plan de habitos, reflexion lunar.', e: '“Guiame un journaling de 10 min sobre esta luna: 4 preguntas, una a la vez”.', c: 'Si aparece trauma o ideas de dano: pausa y pide apoyo humano (*4141, CESFAM).' },
  { a: '🏠 Hogar y plata', u: 'Presupuestos, listas de compras, planes de aseo por zonas, comparar cuentas de luz/lena.', e: '“Gano 500 mil, arriendo 250: armame quincena con ahorro de 20 mil”.', c: 'No pegues cartolas ni claves: dicta solo montos anonimos.' },
  { a: '🌊 Territorio Penco', u: 'Planificar salidas seguras, redactar avisos vecinales, rescatar historias para la Voz de los Abuelos.', e: '“Transcribe esta historia de mi abuela y separala en 3 partes para contarla”.', c: 'Vedas, mareas y alertas se verifican en Sernapesca/SHOA/Senapred, no en el chat.' },
  { a: '💡 Negocio y ventas', u: 'Descripciones que antojen, precios en lucas, avisos WhatsApp/cartel, guion de video 30 seg, nombres para tu marca.', e: '“Describeme mi pan amasado en 60 palabras que antoje, sin mentir, con precio y pedido por WhatsApp”.', c: 'No inventes sellos ni propiedades magicas; lo que prometes lo debes cumplir.' },
  { a: '🤝 Comunidad y dirigencia', u: 'Actas simples, proyectos JJVV, cartas a la Muni, programas de taller, listas de materiales baratos.', e: '“Ordename estos apuntes en acta con 3 acuerdos, responsable y fecha”.', c: 'Los acuerdos los valida la asamblea, no el chat: la IA ordena, la gente decide.' },
  { a: '🎨 Crear y jugar', u: 'Cuentos para ninos, ideas de dibujo, letras de cueca, juegos de memoria, disfraces con reciclaje.', e: '“Cuento de 300 palabras con una loica que cuida el humedal Rocuant”.', c: 'Revisa que el lenguaje sea para la edad y sin sustos; tu le das el calor.' },
  { a: '🆘 Emergencia y comunicacion', u: 'Mensajes claros para la familia, planes de 1 pagina, listas de mochila, practicar que decir sin panico.', e: '“Redactame aviso de 50 palabras: estamos bien, punto de encuentro X, no llamar”.', c: 'En emergencia real manda Senapred/Bomberos/Carabineros, no el chat.' }
];

var MODELOS = [
  { n: 'Meta AI (en WhatsApp)', ico: '💬', donde: 'Dentro de WhatsApp e Instagram, boton redondo azul.', costo: 'Gratis, gasta pocos datos.', red: 'Necesita internet (datos o wifi).', priv: 'Lo que escribes lo ve Meta: anonimiza siempre.', ideal: 'Partir YA sin instalar nada, dudas rapidas, practicar ingles, ideas de cocina.', cuidado: 'No mandes fotos de carnet ni audios intimos; borra chats delicados.' },
  { n: 'Gemini (Google)', ico: '✨', donde: 'App Gemini o gemini.google.com en el navegador.', costo: 'Gratis con limite diario; version paga opcional.', red: 'Necesita internet. Resume YouTube y Docs si le das el link.', priv: 'Guarda historial: usa modo temporal para temas delicados.', ideal: 'Estudiar con documentos, resumir textos largos, ayuda con Gmail/Drive.', cuidado: 'Revisa citas y fechas: inventa “fuentes” que no existen.' },
  { n: 'ChatGPT (OpenAI)', ico: '🤖', donde: 'App ChatGPT o chatgpt.com.', costo: 'Gratis limitado; Plus paga por mes (caro).', red: 'Necesita internet. El gratis es bueno para texto.', priv: 'Gratis entrena con tus chats salvo que lo desactives.', ideal: 'Redactar cartas, CV, cuentos, planes, practicar entrevistas.', cuidado: 'Desactiva “mejorar el modelo con mis datos” si te preocupa la privacidad.' },
  { n: 'Copilot (Microsoft)', ico: '🖥️', donde: 'En Edge, Windows y Bing.', costo: 'Gratis generoso con cuenta Microsoft.', red: 'Necesita internet. Navega y cita paginas reales.', priv: 'Ligado a tu cuenta Microsoft: no mezcles trabajo sensible.', ideal: 'Buscar con fuentes, ayuda con Word/Excel, tramites explicados con links.', cuidado: 'Cita links: abre 1 o 2 para comprobar que existen.' },
  { n: 'Claude (Anthropic)', ico: '🧡', donde: 'App Claude o claude.ai.', costo: 'Gratis limitado; paga si lo usas mucho.', red: 'Necesita internet. Muy bueno redactando largo y cuidando el tono.', priv: 'Politica mas cuidadosa, igual anonimiza.', ideal: 'Cartas delicadas, actas vecinales, textos largos ordenados.', cuidado: 'Tambien alucina: verifica datos duros igual.' },
  { n: 'Perplexity (buscador con IA)', ico: '🔍', donde: 'App o perplexity.ai.', costo: 'Gratis con limite de busquedas “pro”.', red: 'Necesita internet. Responde CON fuentes clicables.', priv: 'Todo queda registrado: no pegues datos personales.', ideal: 'Cuando necesitas respuesta con links: “bono 2026, vedas, precios”.', cuidado: 'Abre las fuentes: a veces cita paginas que no dicen eso.' },
  { n: 'Llama / apps sin internet', ico: '📴', donde: 'Apps que corren en el celu sin mandar nada (ej: buscadores “offline AI”, PocketPal).', costo: 'Gratis, pero pesan y son mas lentas.', red: 'FUNCIONA SIN INTERNET una vez instalada.', priv: 'Lo mas privado: nada sale del celu.', ideal: 'Campo, cerro, caleta sin senal: ideas, diario, practica de idiomas.', cuidado: 'Responde mas corto y se equivoca mas: usala para borradores, no datos duros.' },
  { n: 'OpenCode (agente de codigo open source)', ico: '⌨️', donde: 'Se instala en el PC (opencode.ai): trabaja DENTRO de tu carpeta de archivos, con terminal.', costo: 'Gratis y abierto (MIT). Tu pagas solo el uso del modelo que elijas, o usas uno local gratis.', red: 'Funciona con internet (modelos nube) O con modelos locales via Ollama (sin internet).', priv: 'Tu decides: con Ollama local nada sale del PC; con nube anonimizas igual que un chat.', ideal: 'Arreglar y crear cosas con archivos: esta misma app Calendario, planillas, paginas, cartas largas, ordenar fotos por nombre.', cuidado: 'Es potente: que no borre nada sin tu permiso. Pide “primero dime que vas a cambiar” y parte por copias de prueba.' },
  { n: 'Ollama (motor local: tu IA sin nube)', ico: '📦', donde: 'Programa gratis para PC/Mac/Linux (ollama.com) o apps de celu basadas en el. Descarga el modelo 1 vez y listo.', costo: 'Gratis. Pesa 2 a 8 GB por modelo; pide PC con 8+ GB de RAM.', red: 'FUNCIONA SIN INTERNET tras descargar. OpenCode se conecta a Ollama.', priv: 'Maxima privacidad: todo queda en tu equipo. Ideal para datos vecinales o de ninos.', ideal: 'Diario privado, estudiar sin datos, redactar en el campo, programar con OpenCode sin pagar ni exponer nada.', cuidado: 'Responde mas lento y mas corto que los gigantes; verifica datos duros con senal despues.' },
  { n: 'Llama 3 (Meta, pesos abiertos)', ico: '🦙', donde: 'Dentro de Ollama, HuggingChat o apps offline (descarga ~5 GB).', costo: 'Gratis, licencia abierta con condiciones.', red: 'En Ollama: sin internet. En web: con internet.', priv: 'Local = nada sale; en web de terceros = anonimiza.', ideal: 'El equilibrado open: conversa bien en espanol, resume, redacta, ayuda a OpenCode con codigo simple.', cuidado: 'En espanol chileno a veces suena neutro: aterrizalo (“en Penco, simple, barato”).' },
  { n: 'Mistral / Mixtral (europeo, liviano)', ico: '🇪🇺', donde: 'En Ollama (mistral 7B ~4 GB) o HuggingChat gratis.', costo: 'Gratis, abierto (Apache 2.0).', red: 'Local sin internet via Ollama; web con internet.', priv: 'Local = privado total; legislacion europea mas estricta en su nube.', ideal: 'PC viejos o pocos datos: rapido, bueno resumiendo y redactando corto. Rinde bien con OpenCode para tareas chicas.', cuidado: 'Sabe menos de Chile que los gigantes: dale tu contexto siempre.' },
  { n: 'DeepSeek R1 (razona paso a paso)', ico: '🧩', donde: 'En Ollama (versiones 1.5B a 8B para casa) o deepseek.com.', costo: 'Gratis y abierto (MIT). El mas barato en nube si pagas API.', red: 'Local sin internet; web con internet.', priv: 'Ojo: su web/app guarda en servidores fuera de Chile. Para privado usa su modelo DENTRO de Ollama.', ideal: 'Mate, logica, planificar plata y comparar opciones: muestra su razonamiento. Bueno con OpenCode para codigo.', cuidado: 'Es verboso (responde largo): pide “en 100 palabras” y verifica fechas/leyes igual.' },
  { n: 'Qwen 3 / Gemma 3 / Phi (chicos para celu viejo)', ico: '📱', donde: 'En Ollama o apps offline livianas (1 a 3 GB). Qwen (Alibaba), Gemma (Google), Phi (Microsoft).', costo: 'Gratis, licencias abiertas.', red: 'Disenados para correr SIN INTERNET en equipos modestos.', priv: 'Local = nada sale: los mas recomendados para celu compartido o de pocos recursos.', ideal: 'Practicar idiomas, ideas de cocina, diario, quiz de estudio en celu viejo o con pocos datos.', cuidado: 'Vocabulario mas simple e inventan mas: solo borradores y estudio, nunca dosis ni leyes.' },
  { n: 'HuggingChat (puerta gratis a los abiertos)', ico: '🤗', donde: 'Web huggingface.co/chat: prueba Llama, Mistral, Qwen y mas sin instalar.', costo: 'Gratis con limite, sin instalar nada.', red: 'Necesita internet, pero sirve para PROBAR antes de descargar el pesado a tu PC.', priv: 'Es vidriera, no bodega: no pegues datos sensibles, solo pruebas.', ideal: 'Elegir cual modelo abierto descargar en Ollama: compara 2 con el mismo prompt CRIA y quédate con el que te entienda mejor.', cuidado: 'Se llena y anda lento a ratos: ten paciencia o prueba en otro horario.' }
];

var CREAR = [
  { t: '✍️ Textos que venden y avisan', ico: '✍️', pasos: ['1) Dile que vende y a quien: “pan amasado, vecinas de Penco, WhatsApp”.', '2) Pide 3 versiones cortas (60 palabras) y elige 1.', '3) Corrige precios, horarios y mentiras: la IA inventa.', '4) Cierra con pedido claro: “hablame al +56 9... (tu numero real)”'], prompt: 'Describeme [producto] artesanal de Penco en 60 palabras que antoje, sin mentir ni inventar medidas, con precio en lucas y llamado a pedir por WhatsApp. Tono cercano, 2 emojis maximo.', no: 'No vendas curas milagrosas ni uses fotos falsas del producto.' },
  { t: '🎨 Imagenes (portadas, logos, avisos)', ico: '🎨', pasos: ['1) Describe sujeto + lugar + luz + estilo en 1 frase.', '2) Agrega “sin texto, sin manos raras, sin marca”.', '3) Genera 3 y elige; repite cambiando 1 cosa.', '4) Si es para vender, usa tu foto real al final: la IA adorna, no reemplaza.'], prompt: '[Producto] artesanal de Penco sobre mesa de madera, luz calida de manana, fondo mar desenfocado, estilo foto real, colores calidos, sin texto ni logos.', no: 'No publiques caras falsas como si fueran vecinas reales ni carnet falsos.' },
  { t: '📖 Cuentos y epew para ninos', ico: '📖', pasos: ['1) Edad + animal de Penco + valor (cuidar, compartir).', '2) Pide 300 palabras, final abrigado, sin sustos.', '3) Leelo en voz alta: si traba, pide “mas simple”.', '4) Ilustralo con dibujo propio: vale mas que IA.'], prompt: 'Cuento de 300 palabras para [edad] con [animal de Penco], que ensene [valor]. Simple, calido, con titulo y moraleja de 1 linea. Sin violencia ni sustos.', no: 'Revisa que no meta moralejas raras ni palabras adultas.' },
  { t: '🎬 Videos cortos (30 seg)', ico: '🎬', pasos: ['1) Gancho 3 seg (“¿once rica con 3 lucas?”).', '2) 3 beneficios + precio + donde.', '3) Llamado: “guardalo y hablame”.', '4) Graba con luz de ventana: el guion es 50%, tu cara el otro 50%.'], prompt: 'Guion de video 30 seg para vender [producto] en feria/WhatsApp: gancho 3 seg + 3 beneficios + precio en lucas + llamado a escribirme. Tono penqueno cercano.', no: 'No prometas lo que no cumples (delivery, stock).' },
  { t: '🎶 Cuecas, rimas y saludos', ico: '🎶', pasos: ['1) Tema + para quien (cumple de la mama).', '2) Pide 2 versiones y mezcla lo mejor.', '3) Cambia 3 versos con tus palabras: queda tuyo.', '4) Cantala: si no cabe en la guitarra, pide “mas corta”.'], prompt: 'Escribeme una cueca corta de [tema] para [persona], con 2 pies, lenguaje chileno carinoso, sin garabatos. Dame 2 versiones para elegir.', no: 'Si usas musica generada, revisa que la app te deje uso comercial.' },
  { t: '📚 Guias y clases que enseño yo', ico: '📚', pasos: ['1) Lo que se hacer + a quienes (ninos, abuelas).', '2) Pide programa por bloques con materiales baratos.', '3) Prueba 1 bloque con tu familia.', '4) Cobra justo: la IA arma el papel, tu pones el saber.'], prompt: 'Armame programa de taller de [oficio] de [horas] para [publico] en JJVV: objetivo, materiales baratos en Penco, paso a paso por bloques y cierre. Simple.', no: 'No ensenes salud/seguridad solo con IA: valida con profesional.' }
];

var RIESGOS = [
  { n: 'Alucinaciones: inventa seguro', ico: '🌀', q: 'Fechas, leyes, dosis, citas y “estudios” pueden ser falsos aunque suenen perfectos.', h: ['Pide fuentes y revisalas (que existan de verdad).', 'Cruza datos duros en 2 fuentes oficiales.', 'Si es salud, plata o tramite: confirma con humano competente.'] },
  { n: 'Tus datos quedan registrados', ico: '👁️', q: 'Lo gratis se paga con datos. Lo que pegas puede guardarse para entrenar.', h: ['Anonimiza: “mi hija de 8 del colegio X” → “una nina de 8”.', 'Tacha RUT, direcciones, patentes en fotos antes de subir.', 'Usa el modo temporal / sin historial si tu app lo tiene.'] },
  { n: 'Voz e imagen clonada (deepfake)', ico: '🎙️', q: 'Con 10 segundos de un video ya clonan una voz que llora “mamá, ayudame”.', h: ['Palabra secreta familiar (ej: nombre del perro de la abuela).', 'Cuelga y llama al numero de SIEMPRE.', 'Nunca transfieras por audio o videollamada corta apurada.'] },
  { n: 'Estafas potenciadas con IA', ico: '🎣', q: 'Mensajes sin faltas, “ofertas de pega”, videos de famosos vendiendo inversiones: todo lo hace la IA.', h: ['Metodo ALTO: urgente = pausa + verificar por otro canal.', 'Premio sin concurso = mentira. Pega que paga por reenviar plata = lavado.', 'Denuncia: PDI, *4242, SERNAC. Ver 🛡️ Ciberseguridad.'] },
  { n: 'Sesgo: habla como gringo', ico: '🌎', q: 'Por defecto receta con ingredientes caros, medidas en tazas gringas y “otoño en octubre”.', h: ['Aterrizala: “en Penco, Chile, con feria y presupuesto bajo”.', 'Pide unidades chilenas (kilos, lucas) y estacion del sur.', 'Si repite estereotipos, corrigela: “reformulalo sin prejuicios”.'] },
  { n: 'Dependencia: que no piense por ti', ico: '⚖️', q: 'Si le delegas todo, se atrofia tu criterio (y tu memoria).', h: ['Usala para borrador, tu pones el juicio final.', 'Estudia CON ella, no EN vez de ti: que te pregunte, no solo responda.', '1 dia a la semana sin IA: cuaderno, conversa, territorio.'] },
  { n: 'Amores y amistades falsas con IA', ico: '💔', q: 'Perfiles perfectos que “se enamoran” en 3 dias y luego piden plata o fotos intimas. Muchos son IA.', h: ['Nunca mandes fotos intimas ni plata a quien no has visto en persona.', 'Videollamada en vivo con gestos raros (“tocate la nariz”) delata filtro.', 'Cuenta a alguien de confianza y denuncia el perfil.'] },
  { n: 'Trampa escolar / laboral que se paga caro', ico: '📉', q: 'Entregar todo hecho por IA se nota y te deja sin aprender justo cuando mas lo necesitas.', h: ['Pide esquema + correccion de TU borrador, no el trabajo listo.', 'Guarda tus borradores: prueban tu proceso.', 'Si el profe permite IA, citala (“con apoyo de IA, revisado por mi”).'] }
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
  { id: 'c12', t: 'Cierro con accion concreta (no solo chateo)' },
  { id: 'c13', t: 'Elijo el modelo segun tarea (rapida, con fuentes, sin internet)' },
  { id: 'c14', t: 'Cito la ayuda (“con apoyo de IA, revisado por mi”)' },
  { id: 'c15', t: 'Ya le ensene a alguien de mi casa a pedir bien' }
];

var TALLER = [
  { n: '1 · Mi primer CRIA (15 min)', p: 'Elige UNA tarea real de hoy (un correo, una once, un resumen). Escribela floja (“hazme un menu”), guarda la respuesta, y reescribela con C.R.I.A. completo. Compara en tu bitacora: ¿que mejoro? Marca 1 aprendizaje.' },
  { n: '2 · Caza-alucinaciones (15 min)', p: 'Pidele “dame 5 fechas de fiestas de Penco con fuente”. Revisa una por una si existen. Anota cuales invento y como sonaba de segura. Leccion: tono seguro no es verdad. Registra tu % de acierto detective.' },
  { n: '3 · Anonimiza como espia (10 min)', p: 'Toma un problema real con datos sensibles y reescribelo 2 veces: version peligrosa (con nombres, RUT, colegio) y version segura (anonima). Pega SOLO la segura. Guarda ambas en tu cuaderno como plantilla.' },
  { n: '4 · Profe particular (20 min)', p: 'Pegale una materia que te cueste y pide: “explicame en simple + ejemplo de Penco + quiz de 5, una pregunta a la vez”. Responde el quiz sin mirar. Anota nota y lo que aun te enreda.' },
  { n: '5 · Del chat a la accion (20 min)', p: 'Pide un plan de 7 dias para una meta chica (caminar, ordenar pieza, ahorrar). Conviertelo en compromisos en el Calendario (Notas del dia + recordatorio). Al 7mo dia evalua: ¿sirvio? ¿que ajusto?' },
  { n: '6 · Duelo de IAs (20 min)', p: 'Pega EL MISMO prompt CRIA en 2 apps (ej: Meta AI y Gemini). Compara: ¿cual dio mejor formato? ¿cual invento menos? Anota tu ganadora por tipo de tarea en la bitacora.' },
  { n: '7 · Crea y publica (30 min)', p: 'Crea algo real: aviso de venta, cuento o cartel de minga (ver pestana Crear). Publicalo en tu WhatsApp o feria y anota: ¿cuantos respondieron? La IA propone, tu cara vende.' },
  { n: '8 · Ensena a otro (15 min)', p: 'Ensenale a alguien de tu casa el metodo C.R.I.A. con 1 ejemplo. Que esa persona pida algo y te muestre el antes/despues. Si logras que pida bien sola, marca el check 15: ya eres guia.' }
];

var PROYS = [
  { id: 'p1', ico: '🌱', n: 'Huerta de otono en 4 semanas', tiempo: '4 semanas · 15 min/dia', para: 'Patio o balcon penqueno que quiere partir sin gastar.', pasos: ['Pidele plan de siembra con tu espacio, sol y luna (prompt huerta 1).', 'Pidele lista de compras minima en feria/semillero.', 'Pidele calendario de riego segun tu sombra.', 'Cruza con Siembra lunar de la app y planta 3 cultivos.', 'Foto semanal + nota en bitacora: ¿broto? ¿plaga?'], prompt: 'Tengo [patio/balcon] en Penco con [sol], luna [X]. Dame plan de 4 semanas para huerta de otono barata: que sembrar, cuando regar y 3 errores tipicos. En tabla simple.', entrega: '3 cultivos sembrados + foto.' },
  { id: 'p2', ico: '💼', n: 'CV + carta que postulan', tiempo: '3 dias · 20 min/dia', para: 'Buscar pega con papeles dignos y sin faltas.', pasos: ['Dicta tu experiencia anonima y pide CV 1 pagina.', 'Pide 3 mejoras con verbos de accion.', 'Pide carta para [pega] con [brackets] para datos.', 'Leelo en voz alta y corrige 5 palabras tuyas.', 'Postula a 1 aviso real y anota respuesta.'], prompt: 'Mi experiencia: [lista anonima]. Hazme CV de 1 pagina + carta de 120 palabras para [puesto], tono respetuoso chileno, sin inventar fechas ni titulos.', entrega: 'CV + carta impresos o en PDF.' },
  { id: 'p3', ico: '🍽️', n: 'Quincena que alcanza', tiempo: '1 tarde · 40 min', para: 'Ordenar la plata sin sufrir.', pasos: ['Dicta ingresos y gastos fijos anonimos.', 'Pide presupuesto quincenal en tabla + 3 recortes.', 'Pide lista de feria de 5 almuerzos baratos.', 'Pega el plan en el refri y sigue 15 dias.', 'Evalua: ¿sobro algo? Ajusta y repite.'], prompt: 'Gano [$], fijos [lista]. Hazme quincena en tabla + 3 recortes sin sufrir + ahorro chico + lista feria 5 almuerzos. Sin juzgarme.', entrega: 'Plan pegado en el refri.' },
  { id: 'p4', ico: '📚', n: 'Pasar la prueba que me cuesta', tiempo: '5 dias · 20 min/dia', para: 'Estudiar de verdad, no copiar.', pasos: ['Pegale la materia y pide explicacion de 12 anos + ejemplo Penco.', 'Pide quiz de 5, una pregunta a la vez, 3 rondas.', 'Anota errores y pide solo esos de nuevo.', 'Haz resumen final con tus palabras (ella corrige).', 'Da la prueba y compara nota con tu bitacora.'], prompt: 'Tema [X] nivel [basica/media]. Explicame simple con ejemplo de Penco + quiz de 5 de a una + resumen final de 5 lineas. Espera mis respuestas.', entrega: 'Resumen propio + nota.' },
  { id: 'p5', ico: '📢', n: 'Minga / taller que junta gente', tiempo: '1 semana', para: 'Dirigentes, vecinas y emprendedoras.', pasos: ['Pide aviso WhatsApp + cartel con tus datos.', 'Pide programa del taller por bloques baratos.', 'Pide lista de materiales y que llevar.', 'Publica y confirma 5 asistentes.', 'Pide acta simple con acuerdos y responsables.'], prompt: 'Organizo [minga/taller] el [fecha] en [lugar Penco]. Dame aviso WhatsApp + cartel 80 palabras + programa por bloques + lista barata + acta base.', entrega: 'Actividad hecha + acta.' },
  { id: 'p6', ico: '🎨', n: 'Mi marca chica (nombre + aviso + foto)', tiempo: '3 dias', para: 'Vender mas con imagen digna.', pasos: ['Pide 10 nombres + elige 1 y registra uso.', 'Pide descripcion 60 palabras que antoje.', 'Genera imagen con prompt de Crear (3 variantes).', 'Arma aviso con precio, lugar y WhatsApp.', 'Publica y mide: ¿cuantos preguntaron?'], prompt: 'Vendo [producto] en Penco. Dame 10 nombres cortos chilenos + descripcion 60 palabras + guion video 30 seg + descripcion de imagen sin texto.', entrega: 'Aviso publicado.' },
  { id: 'p7', ico: '🗣️', n: 'Historia de mi abuela en 3 partes', tiempo: '2 tardes', para: 'Memoria familiar (Voz de los Abuelos).', pasos: ['Graba audio con permiso (10 min, sin apuro).', 'Pide transcripcion ordenada en 3 partes.', 'Pide titulo + 1 moraleja + preguntas para nietos.', 'Guarda audio + texto en tu respaldo.', 'Cuentala en familia y anota reaccion.'], prompt: 'Te dicto historia de mi abuela [texto anonimo]. Ordenala en 3 partes para contar, con titulo, lenguaje simple y 3 preguntas para ninos. Sin inventar datos.', entrega: 'Historia guardada + contada.' },
  { id: 'p8', ico: '🆘', n: 'Plan familiar en el refri', tiempo: '1 tarde', para: 'Toda casa en Penco (sismo/tsunami).', pasos: ['Pide plan 1 pagina con tu sector y N personas.', 'Pide lista mochila de 10 + punto encuentro.', 'Dibuja mapa simple con tu familia.', 'Pegalo en el refri y practica 1 salida.', 'Revisa con Senapred/Muni los puntos reales.'], prompt: 'Somos [N] en [sector Penco]. Dame plan familiar 1 pagina: encuentro, mochila de 10, roles, numeros 131/132/133/*4242. Simple para pegar en refri.', entrega: 'Plan pegado + practica hecha.' }
];

var GLOS = [
  ['IA / Inteligencia Artificial', 'Programa que aprende patrones de millones de textos para predecir respuestas utiles. No “piensa” como tu: calcula lo mas probable.'],
  ['Chat / Asistente', 'La ventanita donde conversas (ChatGPT, Gemini, Copilot, etc.). Es SOLO la puerta: el motor esta atras.'],
  ['Modelo / LLM', 'El “cerebro” entrenado con texto (GPT, Gemini, Claude, Llama). Cada uno tiene fecha de corte: lo nuevo puede no saberlo.'],
  ['App con IA vs IA de verdad', 'Muchas apps dicen “con IA” pero solo usan un modelo prestado atras. Lo que importa: ¿guarda tus datos? ¿cita fuentes? ¿funciona sin internet?'],
  ['Prompt', 'Tu instruccion. Prompt bueno = contexto + rol + pedido + formato + limite. Es el 80% del resultado.'],
  ['Prompt negativo', 'Lo que le dices que NO haga: “sin texto en la imagen, sin ingredientes caros, sin palabras dificiles”. Ahorra vueltas.'],
  ['Contexto / Ventana', 'Lo que “recuerda” en esa conversa. Si es largo, se marea: parte un chat nuevo por tema.'],
  ['Token', 'Pedacito de palabra que cobra y cuenta. Mas texto = mas tokens = mas lento/caro. Pide corto.'],
  ['Fecha de corte', 'Hasta cuando “estudio” el modelo. Si le preguntas algo posterior, inventa o se queda corto: verifica en la web.'],
  ['Alucinacion', 'Invento dicho con seguridad (fecha, cita, ley falsa). Se detecta verificando, no “sintiendolo”.'],
  ['Sesgo', 'Inclinacion aprendida de sus datos (gringo, urbano, joven). Se corrige aterrizando: “en Penco, barato, simple”.'],
  ['Rol / System', 'El papel que le das (“actua como profe paciente”). Define tono, nivel y cuidado.'],
  ['Iterar', 'Dar vueltas de mejora: “mas corto”, “mas simple”, “en lista”. La calidad vive en la vuelta 2-3.'],
  ['Temperatura / creatividad', 'Perilla invisible: alta = mas loco y variado; baja = mas serio y fiel. Para tramites pide “se exacto”; para cuentos “se creativo”.'],
  ['Multimodal (texto + foto + voz)', 'Modelos que leen foto, audio y texto. Util para describir una plaga por foto, pero TAPA datos sensibles antes.'],
  ['Generador de imagenes', 'Crea fotos/dibujos desde texto (DALL-E, Imagen, Firefly). Describe sujeto + lugar + luz + estilo + lo prohibido.'],
  ['Voz clonada / TTS', 'Voz que lee o imita. Util para practicar ingles; peligrosa si imita a tu familia para estafar. Palabra secreta siempre.'],
  ['RAG / con fuentes', 'Cuando la IA busca en la web o tus papeles antes de responder (Perplexity, Copilot). Exige links y abre 1 o 2.'],
  ['Codigo abierto (open source)', 'Modelos que puedes instalar (Llama y primos): mas privados y offline, pero mas debiles solos. Buenos para campo sin senal.'],
  ['Verificacion en 2 pasos', 'Doble llave de tus cuentas (clave + codigo). Frenan el robo aunque te roben la clave. Activalo hoy.'],
  ['Deepfake', 'Voz/imagen falsa hiperreal. Defensa: palabra secreta + llamar al numero de siempre.'],
  ['Phishing con IA', 'Estafa escrita perfecta gracias a la IA. Defensa: metodo ALTO (ver Ciberseguridad).'],
  ['Privacidad / Anonimizar', 'Quitar datos que identifican antes de pegar. Regla: si te daria verguenza verlo publicado, no lo pegues.'],
  ['Modo temporal', 'Opcion de algunos chats para no guardar historial. Usalo para temas delicados (igual anonimiza).'],
  ['Derechos / uso comercial', 'Lo que creas con IA se puede usar, pero revisa las reglas de la app y no vendas caras falsas ni textos copiados de otros.'],
  ['Marca de agua / “hecho con IA”', 'Senal de que algo lo hizo la IA. Ponla tu tambien cuando publiques: da confianza y evita malentendidos.'],
  ['Costo / limite gratis', 'Los planes gratis se acaban (mensajes por dia). Pide corto y junta pedidos: ahorras vueltas y datos.'],
  ['OpenCode', 'Programa gratis y abierto que usa una IA para trabajar con TUS archivos: ordena fotos, arregla cartas, arma planillas. Se instala en el PC y tu eliges el modelo (nube u Ollama local).'],
  ['Ollama', 'Motor gratis para correr modelos abiertos en tu propio PC/celu, sin internet y sin mandar datos. Descargas 1 modelo (Llama, Mistral, Qwen...) y conversas en privado.'],
  ['Pesos abiertos (open weights)', 'Modelo cuyo “cerebro” se puede descargar y revisar (Llama, Mistral, DeepSeek, Qwen, Gemma, Phi). A diferencia del cerrado, lo corres tu: mas privacidad, mas libertad, un poco menos de potencia.'],
  ['Agente de codigo', 'IA que no solo responde: ACTUA en tus archivos (lee, escribe, ordena) con tu permiso, como OpenCode. Util para arreglar documentos y proyectos; siempre revisa antes de aceptar cambios.'],
  ['Uso responsable', 'Verificar, no delegar el juicio, citar ayuda, no hacer trampa en pruebas ni difamar. La herramienta no te quita la responsabilidad.']
];

var QUIZ = [
  { q: 'Le pegas a la IA los RUT y notas de tus hijos para que “les haga un plan de estudio”. ¿Esta bien?', opts: ['Si, total es privado', 'No: anonimizo primero (edades y ramos, sin nombres/colegio/RUT)', 'Si, si borro el chat despues igual da lo mismo'], ok: 1, por: 'Los datos de ninos nunca se suben identificables. Se anonimiza siempre, aunque el chat prometa no guardar.' },
  { q: 'La IA te da una “ley” con numero y articulo para un reclamo en la Muni. Suena perfecta. ¿Que haces?', opts: ['La copio tal cual a la carta', 'La verifico en leychile.cl o pregunto en la Muni antes de usarla', 'Le pido otra ley mas larga'], ok: 1, por: 'Las citas legales son el invento favorito de la IA. Toda ley se verifica en fuente oficial.' },
  { q: 'Te llega un audio de tu hijo llorando pidiendo plata urgente a una cuenta rara. ¿Que haces?', opts: ['Transfiero altiro, es su voz', 'Cuelgo, lo llamo al numero de siempre y uso la palabra secreta familiar', 'Le pido a la IA que analice si es verdad'], ok: 1, por: 'La voz se clona facil. Palabra secreta + llamar al numero guardado: esa es la defensa.' },
  { q: '¿Cual pedido (prompt) da mejor resultado?', opts: ['“Hazme una dieta”', '“Soy de Penco, 2 ninos, poco presupuesto: dame 3 menus de 20 min en lista de feria, max 150 palabras”', '“Dime algo rico”'], ok: 1, por: 'Contexto + formato + limite = respuesta usable. Lo vago da humo.' },
  { q: 'La IA te da dosis de un remedio natural “infalible”. ¿Que haces?', opts: ['Lo tomo, es natural', 'No lo tomo por chat: consulto CESFAM/farmacia y el envase; la IA no receta', 'Le subo la dosis si no hace efecto'], ok: 1, por: 'Ningun chat receta ni dosifica. Salud = profesional + fuente oficial.' },
  { q: 'Para una prueba, ¿cual es el uso responsable?', opts: ['Que me de las respuestas para copiar', 'Que me explique con ejemplos y me haga quiz para estudiar yo', 'Que escriba el trabajo entero con mi nombre'], ok: 1, por: 'Estudiar CON la IA te hace mas capaz; copiar te deja vacio el dia que importa.' },
  { q: 'Necesitas el bono 2026 vigente y la IA te lo “asegura” sin links. ¿Que haces?', opts: ['Lo creo y lo difundo altiro', 'Lo verifico en chileatiende.cl o Perplexity/Copilot con fuentes abiertas', 'Le pido que lo jure'], ok: 1, por: 'Bonos, vedas y precios cambian: solo vale la fuente oficial abierta y clicable.' },
  { q: 'Vas al cerro sin senal y quieres ideas para el diario. ¿Que modelo conviene?', opts: ['Cualquiera online, igual funciona', 'Uno offline en el celu (tipo Llama local): no necesita internet y nada sale del equipo', 'Ninguno, la IA no sirve sin internet nunca'], ok: 1, por: 'Las apps offline sirven para borradores e ideas en terreno; para datos duros verifica despues con senal.' },
  { q: 'Vendes pan y la IA te hace foto y descripcion. ¿Como lo publicas bien?', opts: ['Tal cual, diciendo que es mi pan exacto aunque la foto sea generada', 'Reviso, corrijo precio/stock, uso mi foto real y agrego “hecho con apoyo de IA”', 'Con foto de otra panaderia que se ve mejor'], ok: 1, por: 'Honestidad vende: tu foto real + texto revisado + mencion de IA = confianza vecinal.' },
  { q: 'Tu vecina nunca uso IA y le da susto. ¿Que haces?', opts: ['Le pido su celu y le creo cuentas con sus datos', 'Le ensenas 1 prompt CRIA chico, sin sus datos, y que ella toque los botones', 'Le dices que eso es para jovenes'], ok: 1, por: 'Se ensena de a 1 tarea, sin datos sensibles, con ella al mando: asi pierde el miedo y gana criterio.' },
  { q: 'Quieres ayuda con cartas vecinales con datos delicados y sin internet en el PC. ¿Que conviene?', opts: ['Pegar todo en un chat gratis con nube', 'Ollama + modelo abierto (Llama/Mistral/Qwen) en el equipo, y OpenCode si hay archivos que ordenar', 'Esperar a tener datos y mandar fotos del carnet'], ok: 1, por: 'Lo abierto y local no manda nada afuera: privado y sin internet. OpenCode suma si hay que trabajar con archivos.' }
];

/* ---------------- DIALOGO ---------------- */
var TABS = ['Guia', 'Prompts', 'Usos', 'Modelos', 'Crear', 'Segura', 'Taller', 'Proy', 'Glos'];
var TAB_LABEL = { Guia: '📖 Guia', Prompts: '💬 Prompts', Usos: '🛠️ Usos', Modelos: '🤖 Modelos', Crear: '🎨 Crear', Segura: '🛡️ Uso seguro', Taller: '🧪 Taller', Proy: '🚀 Proyectos', Glos: '📚 Glosario' };
function switchTab(t) {
  TABS.forEach(function (x) {
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
    '<p class="muted" style="line-height:1.5">Guia practica y territorial: <b>pedir bien, verificar siempre y cuidar tus datos</b>. 100% offline: esta seccion no se conecta a ninguna IA, te prepara para usar la de tu celu o PC con criterio penqueno. <b>9 pestanas, 32 prompts, 14 modelos (cerrados + abiertos + OpenCode) y 8 proyectos.</b></p>' +
    '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
    '<button type="button" id="tabIAGuia" class="btn btn-accent" style="width:auto">📖 Guia</button>' +
    '<button type="button" id="tabIAPrompts" class="btn" style="width:auto">💬 Prompts</button>' +
    '<button type="button" id="tabIAUsos" class="btn" style="width:auto">🛠️ Usos</button>' +
    '<button type="button" id="tabIAModelos" class="btn" style="width:auto">🤖 Modelos</button>' +
    '<button type="button" id="tabIACrear" class="btn" style="width:auto">🎨 Crear</button>' +
    '<button type="button" id="tabIASegura" class="btn" style="width:auto">🛡️ Uso seguro</button>' +
    '<button type="button" id="tabIATaller" class="btn" style="width:auto">🧪 Taller</button>' +
    '<button type="button" id="tabIAProy" class="btn" style="width:auto">🚀 Proyectos</button>' +
    '<button type="button" id="tabIAGlos" class="btn" style="width:auto">📚 Glosario</button></div>' +
    '<div id="iaGuia"></div>' +
    '<div id="iaPrompts" class="hidden"></div>' +
    '<div id="iaUsos" class="hidden"></div>' +
    '<div id="iaModelos" class="hidden"></div>' +
    '<div id="iaCrear" class="hidden"></div>' +
    '<div id="iaSegura" class="hidden"></div>' +
    '<div id="iaTaller" class="hidden"></div>' +
    '<div id="iaProy" class="hidden"></div>' +
    '<div id="iaGlos" class="hidden"></div>' +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  TABS.forEach(function (t) {
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
    '<div class="si-card"><h4>🤖 ¿Que es (en simple)?</h4><p>Es como un <b>vecino muy leido pero que a veces inventa</b>: conversas por texto, te resume, redacta, explica y te da ideas en segundos. Sirve para <b>borradores, planes, estudio y cartas</b>. No sirve como <b>oraculo</b>: no sabe tu tierra, no ve tu huerta, no conoce la ultima ordenanza. Tu pones el contexto de Penco y el juicio final.</p>' +
    '<p class="muted" style="font-size:11px">¿Donde esta la IA que uso? En tu celu/PC: WhatsApp (Meta AI), navegador (Gemini, ChatGPT, Copilot, Perplexity) o apps sin internet (ver 🤖 Modelos). Esta app solo te entrena: no manda nada a la nube.</p></div>' +
    REGLAS.map(function (r) {
      return '<div class="si-card"><h4>' + r.ico + ' ' + esc(r.n) + '</h4><p>' + r.txt + '</p></div>';
    }).join('') +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🎯 Metodo C.R.I.A. (pegado al refri)</h4>' +
    METODO_CRIA.map(function (m) { return '<p style="font-size:12px"><b>' + esc(m.l) + ':</b> ' + esc(m.t) + '</p>'; }).join('') +
    '<div class="si-card" style="margin-top:8px"><h4>Flojo vs CRIA (3 ejemplos reales)</h4>' +
    EJEMPLOS_CRIA.map(function (e) { return '<p style="font-size:12px"><b>' + esc(e.tema) + '</b><br><span class="muted">❌ ' + esc(e.flojo) + '</span><br>✅ ' + esc(e.cria) + '</p>'; }).join('') + '</div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="iaGoPrompts" class="btn btn-accent" style="width:auto">💬 Ir a prompts copiables →</button> ' +
    '<button type="button" id="iaGoModelos" class="btn" style="width:auto">🤖 ¿Cual IA me conviene? →</button></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🚫 6 errores que todos cometemos</h4>' +
    ERRORES.map(function (e) { return '<p style="font-size:12px"><b>❌ ' + esc(e.f) + '</b><br><span class="muted">' + esc(e.por) + '</span><br>✅ ' + esc(e.fix) + '</p>'; }).join('') + '</div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>❓ Preguntas de la junta (toca para abrir)</h4>' +
    FAQ.map(function (f) { return '<details style="margin:6px 0"><summary style="font-size:12px;cursor:pointer"><b>' + esc(f.q) + '</b></summary><p class="muted" style="font-size:12px">' + esc(f.a) + '</p></details>'; }).join('') + '</div>';
  var g = $('iaGoPrompts');
  if (g) g.onclick = function () { switchTab('Prompts'); renderAll(); };
  var gm = $('iaGoModelos');
  if (gm) gm.onclick = function () { switchTab('Modelos'); renderAll(); };
}

function buildPromptFromCRIA(c, r, i, a) {
  var parts = [];
  if (c) parts.push(c);
  if (r) parts.push('Actua como ' + r + '.');
  if (i) parts.push(i);
  if (a) parts.push(a);
  return parts.join('\n');
}
function evalPromptScore(t) {
  var s = String(t || '');
  var low = s.toLowerCase();
  var pts = 0, tips = [];
  var checks = [
    { ok: s.length > 25, label: 'Pide algo concreto (mas de 25 letras)', tip: 'Alarga 1 linea: ¿que quieres exactamente?' },
    { ok: /(soy|tengo|vivo|somos|presupuesto|penco|bio|horario|ninos|hijos|casa|huerta)/.test(low), label: 'Tiene contexto (quien eres, que tienes)', tip: 'Agrega: “soy de Penco, tengo X, presupuesto Y”.' },
    { ok: /(actua como|como (profe|nutri|cocinera|contador|orientadora|huertera)|rol)/.test(low), label: 'Da un rol (actua como...)', tip: 'Agrega: “actua como profesora paciente”.' },
    { ok: /(lista|tabla|pasos|resumen|guion|esquema|carta|menu|plan)/.test(low), label: 'Pide formato (lista, tabla, pasos...)', tip: 'Agrega: “en lista / tabla simple”.' },
    { ok: /(\d+\s?(palabras|minutos|ideas|pasos|preguntas)|maximo|max|corto|simple)/.test(low), label: 'Pone limite (N palabras, minutos, ideas)', tip: 'Agrega: “maximo 150 palabras” o “3 ideas”.' },
    { ok: /(pregunta|ajusta|corrige|mas (corto|simple|barato)|otra version)/.test(low), label: 'Invita a ajustar (2da vuelta)', tip: 'Cierra con: “hazme las preguntas que te falten”.' }
  ];
  checks.forEach(function (c) { if (c.ok) pts += Math.round(100 / checks.length); else tips.push(c.tip); });
  var peligro = /(rut|clave|contraseña|cuenta\s?\d|carnet|dorsal|colegio\s+[a-z]|direcci[oó]n\s+\S+\s+\d+)/i.test(s);
  if (peligro) { pts = Math.max(0, pts - 20); tips.unshift('⚠️ Tiene datos sensibles: anonimizalo antes de pegar.'); }
  if (pts > 100) pts = 100;
  return { pts: pts, checks: checks, tips: tips, peligro: peligro };
}

function renderPrompts() {
  var box = $('iaPrompts'); if (!box) return;
  var cats = {};
  PROMPTS.forEach(function (p) { (cats[p.cat] = cats[p.cat] || []).push(p); });
  var catNames = { huerta: '🌱 Huerta', cocina: '🍽️ Cocina', estudio: '📚 Estudio', trabajo: '💼 Trabajo', interior: '🪞 Interior', hogar: '🏠 Hogar', territorio: '🌊 Territorio', comunidad: '🤝 Comunidad', crear: '🎨 Crear', emergencia: '🆘 Emergencia' };
  box.innerHTML =
    '<div class="si-card"><h4>💬 Biblioteca: toca 📋 para copiar (32 prompts)</h4><p>Reemplaza los <b>[brackets]</b> con tus datos ANONIMOS antes de pegar en tu chat de IA. Parte por 1 solo prompt hoy. ¿No sabes por donde partir? Usa el <b>constructor C.R.I.A.</b> de abajo.</p>' +
    '<div class="conv-row"><label style="flex:2">🔍 Filtrar <input type="text" id="iaPCat" placeholder="ej: cv, feria, huerta, entrevista..." autocomplete="off"></label></div><div id="iaPList"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🧩 Constructor C.R.I.A. (arma tu pedido perfecto)</h4>' +
    '<p class="muted" style="font-size:11px">Completa 4 casilleros y te armo el prompt listo para copiar. Ejemplo guiado incluido.</p>' +
    '<label>C — Contexto (quien eres, que tienes) <input type="text" id="iaCctx" maxlength="200" placeholder="ej: soy de Penco, 2 ninos, poco presupuesto, solo feria"></label>' +
    '<label>R — Rol (a quien le pides que sea) <input type="text" id="iaCrol" maxlength="120" placeholder="ej: cocinera chilena practica"></label>' +
    '<label>I — Instruccion (que + formato + limite) <input type="text" id="iaCins" maxlength="250" placeholder="ej: dame 3 almuerzos de 25 min en tabla con kilos, max 150 palabras"></label>' +
    '<label>A — Ajuste (que te pregunte / versiones) <input type="text" id="iaCaju" maxlength="200" placeholder="ej: despues preguntame lo que te falte y dame version sin fritura"></label>' +
    '<div id="iaCOut" class="chip" style="display:block;white-space:pre-wrap;margin-top:8px">Aqui aparece tu prompt armado…</div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="iaCGen" class="btn btn-accent" style="width:auto">✨ Armar prompt</button> ' +
    '<button type="button" id="iaCCopy" class="btn" style="width:auto">📋 Copiar</button> ' +
    '<button type="button" id="iaCSave" class="btn" style="width:auto">⭐ Guardar</button></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🔎 Evaluador: ¿mi prompt es bueno? (0-100)</h4>' +
    '<p class="muted" style="font-size:11px">Pega tu pedido y te digo que le falta, sin mandar nada a internet: todo se revisa aqui mismo.</p>' +
    '<label>Tu pedido <textarea id="iaEvalIn" rows="2" maxlength="800" placeholder="Pega aqui tu prompt, ej: hazme un menu..."></textarea></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="iaEvalBtn" class="btn btn-accent" style="width:auto">🔎 Evaluar</button></div>' +
    '<div id="iaEvalOut" style="margin-top:8px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>⭐ Mis prompts (guardados aqui, privados)</h4>' +
    '<div class="conv-row"><label style="flex:2">Titulo <input type="text" id="iaMyPT" placeholder="ej: menu feria quincena" maxlength="40"></label></div>' +
    '<label>Prompt <textarea id="iaMyPX" rows="2" placeholder="Pega o escribe tu mejor version CRIA..." maxlength="800"></textarea></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="iaMyPAdd" class="btn btn-accent" style="width:auto">+ Guardar mi prompt</button></div>' +
    '<div id="iaMyPList" class="habits-list" style="margin-top:8px;max-height:240px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="iaMyPStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px"><button type="button" id="iaMyPShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="iaMyPClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>';

  function paintList(filter) {
    var q = String(filter || '').toLowerCase();
    var keys = Object.keys(cats);
    var html = keys.map(function (c) {
      var items = cats[c].map(function (p, i) { p._gi = c + ':' + i; return p; })
        .filter(function (p) { return !q || (p.t + ' ' + p.p + ' ' + c).toLowerCase().indexOf(q) >= 0; });
      if (!items.length) return '';
      return '<div class="menstrual-card" style="margin-top:8px"><h4>📌 ' + esc(catNames[c] || c) + ' (' + items.length + ')</h4>' +
        items.map(function (p) {
          return '<div class="habit-item"><b>' + p.ico + ' ' + esc(p.t) + '</b><p class="muted" style="font-size:11px;white-space:pre-wrap;margin:6px 0">' + esc(p.p) + '</p>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" style="width:auto;font-size:11px" data-copy="' + p._gi + '">📋 Copiar</button>' +
            '<button class="btn" style="width:auto;font-size:11px" data-savep="' + p._gi + '">⭐ Guardar en mis prompts</button></div></div>';
        }).join('') + '</div>';
    }).join('') || '<p class="muted">Sin resultados. Prueba “feria”, “cv” o “cuento”.</p>';
    $('iaPList').innerHTML = html;
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
        save('Prompt guardado ⭐'); paintMine();
      };
    });
  }
  paintList('');
  if ($('iaPCat')) $('iaPCat').oninput = function () { paintList($('iaPCat').value); };

  function currentBuilt() { return buildPromptFromCRIA(clean(($('iaCctx') || {}).value, 200), clean(($('iaCrol') || {}).value, 120), clean(($('iaCins') || {}).value, 250), clean(($('iaCaju') || {}).value, 200)); }
  if ($('iaCGen')) $('iaCGen').onclick = function () {
    var t = currentBuilt();
    if (!t.trim()) { $('iaCOut').textContent = 'Completa al menos Contexto e Instruccion para armar algo util.'; return; }
    $('iaCOut').textContent = t;
    var ev = evalPromptScore(t);
    $('iaCOut').textContent = t + '\n\n— Puntaje estimado: ' + ev.pts + '/100 —';
  };
  if ($('iaCCopy')) $('iaCCopy').onclick = function () { var t = currentBuilt(); if (t.trim()) copyTxt(t); else alert('Arma primero tu prompt'); };
  if ($('iaCSave')) $('iaCSave').onclick = function () {
    var t = currentBuilt(); if (!t.trim()) return alert('Arma primero tu prompt');
    store().prompts.push({ id: uid('ip'), t: 'CRIA ' + todayKey(), x: t, fecha: todayKey() });
    save('Prompt CRIA guardado ⭐'); paintMine();
  };
  if ($('iaEvalBtn')) $('iaEvalBtn').onclick = function () {
    var v = ($('iaEvalIn') || {}).value || '';
    if (!v.trim()) { $('iaEvalOut').innerHTML = '<p class="muted">Pega primero tu pedido.</p>'; return; }
    var ev = evalPromptScore(v);
    var col = ev.pts >= 80 ? '#8fd694' : (ev.pts >= 50 ? '#e8c56a' : '#e76e8a');
    $('iaEvalOut').innerHTML =
      '<p><b>Puntaje: ' + ev.pts + '/100</b></p>' +
      '<div style="background:var(--panel);border-radius:6px;height:8px;overflow:hidden;margin:6px 0"><div style="width:' + ev.pts + '%;height:100%;background:' + col + '"></div></div>' +
      ev.checks.map(function (c) { return '<p style="font-size:12px">' + (c.ok ? '✅' : '⬜') + ' ' + esc(c.label) + '</p>'; }).join('') +
      (ev.tips.length ? '<p style="font-size:12px"><b>Para subir nota:</b><br>· ' + ev.tips.map(esc).join('<br>· ') + '</p>' : '<p style="font-size:12px">✅ Listo para pegar. Itera 2 vueltas y verifica datos duros.</p>');
  };

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
  box.innerHTML = '<div class="si-card"><h4>🛠️ La IA por rincon del calendario (12 areas)</h4><p>Cada area tiene su <b>uso estrella, un ejemplo copiable y su cuidado</b>. La IA propone, el territorio dispone. Toca 📋 para llevarte el ejemplo.</p></div>' +
    USOS.map(function (u, i) {
      return '<div class="si-card"><h4>' + esc(u.a) + '</h4><p><b>Uso:</b> ' + esc(u.u) + '</p>' +
        '<p class="muted" style="font-size:11px"><b>Ejemplo:</b> ' + esc(u.e) + '</p>' +
        '<p style="font-size:11px"><b>⚠️ Cuidado:</b> ' + esc(u.c) + '</p>' +
        '<div style="display:flex;gap:6px"><button class="btn" style="width:auto;font-size:11px" data-uej="' + i + '">📋 Copiar ejemplo</button></div></div>';
    }).join('');
  box.querySelectorAll('[data-uej]').forEach(function (b) {
    b.onclick = function () { var u = USOS[+b.getAttribute('data-uej')]; if (u) copyTxt(u.e); };
  });
}

function renderModelos() {
  var box = $('iaModelos'); if (!box) return;
  box.innerHTML = '<div class="si-card"><h4>🤖 ¿Cual IA uso? (comparativa honesta 2026: cerradas + abiertas)</h4><p>Todas sirven, pero <b>no todas sirven para lo mismo</b>. Las <b>cerradas</b> (ChatGPT, Gemini, Claude) rinden mas con internet; las <b>abiertas</b> (Llama, Mistral, DeepSeek, Qwen, Gemma) se pueden usar <b>en tu equipo, sin mandar tus datos</b> via Ollama. Y <b>OpenCode</b> es el ayudante abierto que trabaja con tus archivos. Parte por la que ya tienes.</p></div>' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🔓 Abierto vs cerrado (en 30 segundos)</h4><p class="muted" style="font-size:12px"><b>Cerrado:</b> solo lo usas por su web/app, tus palabras viajan a su nube. Mas capaz, menos privado.<br><b>Abierto (pesos abiertos):</b> puedes descargarlo (Ollama) y correrlo en tu PC/celu: <b>nada sale</b>, funciona sin internet, gratis para siempre. Un poco mas basico.<br><b>OpenCode:</b> programa abierto que conecta esos modelos con tus archivos: les dice “arregla esta carta / ordena estas fotos” y lo hace.</p></div>' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🧭 Buscador: ¿cual me conviene?</h4>' +
    '<div class="conv-row"><label>Quiero <select id="iaModPara"><option value="rapida">una duda rapida por WhatsApp</option><option value="estudio">estudiar / resumir textos</option><option value="cartas">redactar cartas, CV, actas</option><option value="fuentes">respuestas con fuentes y links</option><option value="campo">usar sin internet (campo/cerro)</option><option value="negocio">vender / negocio</option><option value="codigo">arreglar/crear archivos y codigo (OpenCode)</option><option value="abierto">maxima privacidad con modelo abierto</option></select></label>' +
    '<label>Internet <select id="iaModNet"><option value="pocos">tengo pocos datos</option><option value="wifi">tengo wifi</option><option value="nada">a veces no tengo nada</option></select></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="iaModBtn" class="btn btn-accent" style="width:auto">✨ Recomiendame</button></div>' +
    '<div id="iaModOut" class="chip" style="display:block;white-space:normal;margin-top:8px">Responde arriba y te digo por donde partir…</div></div>' +
    MODELOS.map(function (m) {
      return '<div class="si-card"><h4>' + m.ico + ' ' + esc(m.n) + '</h4>' +
        '<p style="font-size:12px"><b>📍 Donde:</b> ' + esc(m.donde) + '<br><b>💰 Costo:</b> ' + esc(m.costo) + '<br><b>🌐 Internet:</b> ' + esc(m.red) + '<br><b>👁️ Privacidad:</b> ' + esc(m.priv) + '</p>' +
        '<p style="font-size:12px"><b>✅ Ideal:</b> ' + esc(m.ideal) + '</p>' +
        '<p class="muted" style="font-size:11px"><b>⚠️ Cuidado:</b> ' + esc(m.cuidado) + '</p></div>';
    }).join('') +
    '<div class="menstrual-card"><h4>💡 Regla de cambio (no te marees)</h4><p class="muted" style="font-size:12px">Si tu IA actual te da respuestas utiles y cortas, <b>no la cambies</b>: mejora tus prompts (pestana 💬). Cambia solo si: se acaba el limite justo en la prueba, inventa muchos links, necesitas <b>privacidad total (Ollama local)</b> o quieres <b>trabajar con archivos (OpenCode)</b>. Dominar 1 bien vale mas que probar 14 mal. Ruta sugerida: 1) chat facil (Meta AI/Gemini) → 2) probar abiertos en HuggingChat → 3) Ollama local → 4) OpenCode + Ollama.</p></div>';
  if ($('iaModBtn')) $('iaModBtn').onclick = function () {
    var para = ($('iaModPara') || {}).value || 'rapida';
    var net = ($('iaModNet') || {}).value || 'pocos';
    var txt = '';
    if (para === 'codigo') txt = '⌨️ Usa OpenCode en tu PC: apunta a tu carpeta (“arregla esta carta / ordena estas fotos por fecha”) y elije modelo. Sin internet o con datos sensibles: conectalo a Ollama local (Llama 3 o Qwen). Con internet y apuro: un modelo de nube. Regla: “primero dime que vas a cambiar, sin borrar nada”.';
    else if (para === 'abierto') txt = '🔓 Instala Ollama y descarga 1 modelo chico (Qwen o Gemma si tu equipo es modesto, Llama 3 si es mejor). Pruebalo primero en HuggingChat web para elegir. Todo queda en tu equipo: ideal para diario, ninos y trabajo vecinal.';
    else if (net === 'nada') txt = '📴 Sin senal manda lo offline: Ollama + Llama/Qwen en PC o app offline en celu (ver fichas 📴📦📱) para ideas y diario en terreno. Para datos duros (vedas, bonos, mareas) espera wifi y verifica en fuente oficial.';
    else if (para === 'fuentes') txt = '🔍 Parte por Perplexity o Copilot: responden con links clicables. Abre 1 o 2 y comprueba. Para redactar bonito, lleva ese dato a ChatGPT o Claude.';
    else if (para === 'estudio') txt = '✨ Parte por Gemini (resume Docs/YouTube) o ChatGPT: pegale la materia y pide “simple + ejemplo Penco + quiz de a una”. Si tienes pocos datos, Meta AI en WhatsApp con pedidos cortos. ¿Privado/offline? Mistral o Qwen en Ollama.';
    else if (para === 'cartas') txt = '🧡 Parte por Claude o ChatGPT: tono formal chileno, 120 palabras, con [brackets]. Luego verifica leyes/tramites en ChileAtiende o la Muni. Cartas delicadas sin nube: Llama 3 local.';
    else if (para === 'campo') txt = '📴 Instala Ollama + 1 modelo (Qwen/Gemma si es celu/PC viejo) y practica en casa. En el pueblo con datos, remata con Gemini o Meta AI.';
    else if (para === 'negocio') txt = '💡 Parte por ChatGPT o Meta AI: descripciones, nombres y guion 30 seg (ver 🎨 Crear). La foto final que sea real de tu producto: vende mas. Textos con datos de clientes: mejor en local (Ollama).';
    else txt = '💬 Parte por Meta AI en tu WhatsApp: cero instalacion, pocos datos. Pide corto: “en 100 palabras”. Si se limita, salta a Gemini web.';
    $('iaModOut').textContent = txt;
  };
}

function renderCrear() {
  var box = $('iaCrear'); if (!box) return;
  box.innerHTML = '<div class="si-card"><h4>🎨 Crear con IA (sin perder lo propio)</h4><p>La IA es <b>ayudante, no autora</b>: tu pones la idea, el saber y la cara; ella ordena, propone y varia. Todo lo que publiques <b>revisalo, corrigelo y mencionalo</b>.</p></div>' +
    CREAR.map(function (g, i) {
      return '<div class="si-card"><h4>' + esc(g.t) + '</h4>' +
        '<p style="font-size:12px"><b>Paso a paso:</b><br>' + g.pasos.map(esc).join('<br>') + '</p>' +
        '<p class="muted" style="font-size:11px;white-space:pre-wrap"><b>Prompt base:</b> ' + esc(g.prompt) + '</p>' +
        '<p style="font-size:11px"><b>⛔ No:</b> ' + esc(g.no) + '</p>' +
        '<div style="display:flex;gap:6px"><button class="btn" style="width:auto;font-size:11px" data-cr="' + i + '">📋 Copiar prompt</button></div></div>';
    }).join('') +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>⚖️ Derechos en 4 lineas (para no meter las patas)</h4>' +
    '<p class="muted" style="font-size:12px">1) Lo que creas con IA lo puedes usar, pero <b>revisa las reglas de la app</b> (algunas piden mencion).<br>2) <b>No vendas</b> fotos de personas falsas como reales, ni copies textos/fotos ajenas.<br>3) Si es para negocio, <b>tu foto y medidas reales</b> mandan: la IA adorna, no inventa stock.<br>4) Agrega siempre: <b>“hecho con apoyo de IA, revisado por mi”</b>: da confianza vecinal.</p></div>';
  box.querySelectorAll('[data-cr]').forEach(function (b) {
    b.onclick = function () { var g = CREAR[+b.getAttribute('data-cr')]; if (g) copyTxt(g.prompt); };
  });
}

function renderSegura() {
  var box = $('iaSegura'); if (!box) return;
  box.innerHTML = '<div class="si-card"><h4>🛡️ Usar IA sin regalar tu vida (8 riesgos)</h4><p>8 riesgos reales con su defensa en simple. Leelos 1 vez en familia: protegen mas que cualquier antivirus. Si ya te paso algo, ve 🛡️ Ciberseguridad → Ayuda.</p></div>' +
    RIESGOS.map(function (r) {
      return '<div class="si-card"><h4>' + r.ico + ' ' + esc(r.n) + '</h4><p><b>El problema:</b> ' + esc(r.q) + '</p>' +
        '<p><b>✅ Defensa:</b><br>' + r.h.map(function (h, i) { return (i + 1) + ') ' + h; }).join('<br>') + '</p></div>';
    }).join('') +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🤐 Antes de pegar, anonimiza (30 seg)</h4>' +
    '<p class="muted" style="font-size:11px">“Mi hija Antonia, 3°B colegio X, RUT 12.345…” → “Una nina de 9, materia matematicas”. “Gano 650 en pesquera Y” → “Sueldo medio, trabajo por turnos”. La herramienta tapa lo comun: <b>tu revisas lo que quede</b>.</p>' +
    '<div class="conv-row"><label style="flex:2">Pegalo peligroso <input type="text" id="iaAnonIn" placeholder="ej: vivo en calle X 123, Penco..." maxlength="200"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="iaAnonBtn" class="btn btn-accent" style="width:auto">🛡️ Anonimizar</button> ' +
    '<button type="button" id="iaAnonCopy" class="btn" style="width:auto">📋 Copiar segura</button></div>' +
    '<div id="iaAnonOut" class="chip" style="display:block;white-space:normal;margin-top:8px">Aqui aparece tu version segura…</div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">✅ Lista rapida antes de pegar: ¿sin RUT? ¿sin direccion exacta? ¿sin nombres de ninos/colegio? ¿sin patente/foto carnet? ¿sin cuenta/clave?</p></div>';
  function anonimizar(v) {
    var out = String(v || '');
    out = out.replace(/\b\d{1,2}\.\d{3}\.\d{3}-[\dkK]\b/g, '[RUT]')
      .replace(/\b\d{7,9}-[\dkK]\b/g, '[RUT]')
      .replace(/(calle|pasaje|av\.?|avenida)\s+[a-záéíóúñ\s]+\d+/gi, '[mi calle]')
      .replace(/\b\d{9}\b/g, '[telefono]')
      .replace(/colegio\s+[a-záéíóúñ\s]+/gi, '[su colegio]')
      .replace(/\+?56\s?9\s?\d{4}\s?\d{4}/g, '[telefono]')
      .replace(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+\b/g, '[nombre]')
      .replace(/\b\d{1,3}\s?(mil|millones|lucas)\b/gi, '[monto]')
      .replace(/@[\w.]+/g, '[correo]');
    return out.slice(0, 300);
  }
  if ($('iaAnonBtn')) $('iaAnonBtn').onclick = function () {
    var v = ($('iaAnonIn') || {}).value || '';
    if (!v.trim()) { $('iaAnonOut').textContent = 'Escribe primero un ejemplo.'; return; }
    var out = anonimizar(v);
    $('iaAnonOut').textContent = 'Version segura (revisa antes de pegar): "' + out + '" — ¿Quedo algun dato que te identifique? Sacalo tambien.';
  };
  if ($('iaAnonCopy')) $('iaAnonCopy').onclick = function () {
    var t = ($('iaAnonOut') || {}).textContent || '';
    if (!t || t.indexOf('Aqui aparece') === 0) return alert('Anonimiza primero');
    copyTxt(t);
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
    '<div class="si-card"><h4>🧪 8 ejercicios (1 por dia, 10-30 min)</h4><p>Hazlos en orden: cada uno deja 1 registro en tu bitacora. La gracia no es “saber de IA”, es <b>pedir mejor y verificar siempre</b>. Del 6 al 8 son nivel avanzado: duelos, crear y ensenar.</p></div>' +
    TALLER.map(function (t) { return '<div class="si-card"><h4>' + esc(t.n) + '</h4><p>' + esc(t.p) + '</p></div>'; }).join('') +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>✅ Mi chequeo IA (' + done + '/' + CHECKS.length + ')</h4>' +
    '<div style="background:var(--panel);border-radius:6px;height:8px;overflow:hidden;margin:6px 0"><div style="width:' + Math.round(done / CHECKS.length * 100) + '%;height:100%;background:linear-gradient(90deg,#7ab8ff,#e8c56a,#8fd694)"></div></div>' +
    '<div id="iaChecksBox">' + CHECKS.map(function (c) {
      return '<label class="check-row" style="font-size:12px"><input type="checkbox" data-chk="' + c.id + '"' + (st.checks[c.id] ? ' checked' : '') + '> ' + esc(c.t) + '</label>';
    }).join('') + '</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>📓 Bitacora de experimentos (privada)</h4>' +
    '<p class="muted" style="font-size:11px">Que pedi, que me dio, que verifique y que aprendi. 3 lineas bastan. Promedio alto = prompts que sirven: guardalos en ⭐.</p>' +
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
      if (d2 === CHECKS.length) { try { alert('🎉 ¡Chequeo completo! Ya usas IA con criterio. Ensenale a alguien de tu casa.'); } catch (e) {} }
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

function renderProy() {
  var box = $('iaProy'); if (!box) return;
  var st = store();
  var doneIds = Object.keys(st.proys || {}).filter(function (k) { return st.proys[k]; });
  box.innerHTML = '<div class="si-card"><h4>🚀 8 proyectos territoriales (del chat a la accion)</h4><p>Cada proyecto trae <b>pasos, prompt copiable y entrega concreta</b>. Marca ✅ cuando termines: el progreso queda guardado. Parte por 1 solo.</p>' +
    '<p class="muted" style="font-size:11px">Avance: <b>' + doneIds.length + '/' + PROYS.length + '</b></p>' +
    '<div style="background:var(--panel);border-radius:6px;height:8px;overflow:hidden;margin:6px 0"><div style="width:' + Math.round(doneIds.length / PROYS.length * 100) + '%;height:100%;background:linear-gradient(90deg,#7ab8ff,#e8c56a,#8fd694)"></div></div></div>' +
    PROYS.map(function (p) {
      var done = !!(st.proys && st.proys[p.id]);
      return '<div class="si-card" style="' + (done ? 'opacity:.75;border-color:#8fd694' : '') + '"><h4>' + p.ico + ' ' + esc(p.n) + ' ' + (done ? '✅' : '') + '</h4>' +
        '<p class="muted" style="font-size:11px">⏱ ' + esc(p.tiempo) + ' · 👥 ' + esc(p.para) + '</p>' +
        '<p style="font-size:12px"><b>Pasos:</b><br>' + p.pasos.map(function (s, i) { return (i + 1) + ') ' + s; }).join('<br>') + '</p>' +
        '<p class="muted" style="font-size:11px;white-space:pre-wrap"><b>Prompt base:</b> ' + esc(p.prompt) + '</p>' +
        '<p style="font-size:12px"><b>🎁 Entrega:</b> ' + esc(p.entrega) + '</p>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" style="width:auto;font-size:11px" data-pcopy="' + p.id + '">📋 Copiar prompt</button>' +
        '<button class="btn ' + (done ? '' : 'btn-accent') + '" style="width:auto;font-size:11px" data-pdone="' + p.id + '">' + (done ? '↩ Reabrir' : '✅ Marcar terminado') + '</button></div></div>';
    }).join('') +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span class="muted" style="font-size:11px">Tip: el proyecto 8 (plan familiar) protege a toda la casa.</span>' +
    '<button type="button" id="iaProyShare" class="btn" style="width:auto">📤 Compartir avance</button></div>';
  box.querySelectorAll('[data-pcopy]').forEach(function (b) {
    b.onclick = function () {
      var p = PROYS.find(function (x) { return x.id === b.getAttribute('data-pcopy'); });
      if (p) copyTxt(p.prompt);
    };
  });
  box.querySelectorAll('[data-pdone]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-pdone');
      var s = store();
      s.proys[id] = !s.proys[id];
      save(s.proys[id] ? 'Proyecto terminado 🚀' : 'Guardado OK');
      renderProy();
    };
  });
  if ($('iaProyShare')) $('iaProyShare').onclick = function () {
    var s = store();
    var d = PROYS.filter(function (p) { return s.proys[p.id]; });
    if (!d.length) return alert('Marca 1 proyecto terminado primero');
    share('🚀 Mis proyectos IA (' + d.length + '/' + PROYS.length + ')', d.map(function (p) { return '✅ ' + p.n + ' → ' + p.entrega; }).join('\n'));
  };
}

function renderGlos() {
  var box = $('iaGlos'); if (!box) return;
  var best = 0;
  try { best = store().quizBest || 0; } catch (e) {}
  box.innerHTML = '<div class="si-card"><h4>📚 Glosario en chileno (' + GLOS.length + ' palabras)</h4><p>Si entiendes estas ' + GLOS.length + ', entiendes el 90% de lo que hablan de IA. Sin humo tecnico. Busca arriba.</p></div>' +
    '<div class="menstrual-card"><div class="conv-row"><label style="flex:2">🔍 Buscar <input type="text" id="iaGlosQ" placeholder="ej: prompt, alucinacion..." autocomplete="off"></label></div><div id="iaGlosBox">' + GLOS.map(function (g) {
      return '<p style="font-size:12px;margin:6px 0"><b>' + esc(g[0]) + ':</b> <span class="muted">' + esc(g[1]) + '</span></p>';
    }).join('') + '</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🧠 Quiz: ¿usas IA con criterio? (' + QUIZ.length + ' casos · mejor: ' + best + '/' + QUIZ.length + ')</h4>' +
    '<div id="iaQuizBox"><p class="muted">' + QUIZ.length + ' situaciones reales. Toca empezar: 3 minutos.</p></div>' +
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
      qb.innerHTML = '<p><b>Resultado: ' + quizPts + '/' + QUIZ.length + '</b> ' + (quizPts === QUIZ.length ? '🟢 ¡Criterio total! Ensenale a tu familia.' : (quizPts >= 7 ? '🟡 Bien, repasa Uso seguro.' : '🔴 Lee la Guia y el Uso seguro con calma y repite.')) + '</p>' +
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
  try { renderModelos(); } catch (e) {}
  try { renderCrear(); } catch (e) {}
  try { renderSegura(); } catch (e) {}
  try { renderTaller(); } catch (e) {}
  try { renderProy(); } catch (e) {}
  try { renderGlos(); } catch (e) {}
}

/* ---------------- SETUP: integra en Aprender ---------------- */
var BTNS = [
  { id: 'btnIAGuia', label: '📖 Guia IA', tab: 'Guia', kw: 'ia inteligencia artificial guia que es como funciona cria prompt chatbot chatgpt gemini faq errores' },
  { id: 'btnIAPrompts', label: '💬 Prompts utiles', tab: 'Prompts', kw: 'prompt prompts pedir instrucciones ejemplos copiar recetas cv cartas menu huerta constructor evaluador cria' },
  { id: 'btnIAUsos', label: '🛠️ Usos por area', tab: 'Usos', kw: 'usos huerta cocina estudio trabajo salud hogar territorio negocio comunidad crear emergencia ejemplos' },
  { id: 'btnIAModelos', label: '🤖 Modelos: cual uso', tab: 'Modelos', kw: 'modelos chatgpt gemini copilot claude meta whatsapp perplexity llama offline comparar cual conviene gratis opencode ollama mistral deepseek qwen gemma phi huggingchat codigo abierto open source privado local' },
  { id: 'btnIACrear', label: '🎨 Crear con IA', tab: 'Crear', kw: 'crear imagen texto cuento video marca negocio dibujo guion derechos autor publicar' },
  { id: 'btnIASegura', label: '🛡️ Uso seguro', tab: 'Segura', kw: 'seguro privacidad datos anonimo anonimizar alucinacion deepfake estafa voz clonada riesgo trampa amor falso' },
  { id: 'btnIATaller', label: '🧪 Taller y bitacora', tab: 'Taller', kw: 'taller ejercicios practica chequeo bitacora experimentos aprender duelo ensenar' },
  { id: 'btnIAProy', label: '🚀 Proyectos guiados', tab: 'Proy', kw: 'proyectos huerta cv quincena prueba minga marca historia plan familiar paso a paso' },
  { id: 'btnIAGlos', label: '📚 Glosario y quiz', tab: 'Glos', kw: 'glosario terminos token llm quiz prueba vocabulario corte multimodal open source' }
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
