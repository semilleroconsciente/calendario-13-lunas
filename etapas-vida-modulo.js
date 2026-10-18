/* ============================================================
   ETAPAS DE LA VIDA — Calendario 13 Lunas (Penco · Bío-Bío)
   Completa el ciclo junto a 🧒 Crianza (0-12, nuevos-modulos.js)
   y 🌱 Adolescencia (10-19, adolescencia-modulo.js):

     1) 🌅 Juventud (20-39) ....... btnJuventud / juventudDialog
     2) 🏠 Adultez (35-59) ........ btnAdultez / adultezDialog
     3) 🔥 Climaterio (45-64) ..... btnClimaterio / climaterioDialog
     4) 🦉 Vejez Sabia (60+) ...... btnVejez / vejezDialog
     5) 🌀 Septenios (0-70+) ...... btnSeptenios / septeniosDialog
      6) 🙏 Camino Lakota ............ btnLakota / lakotaDialog
          Femenino (7 caminos Mujer Bufalo Blanco) + Masculino (7 etapas Wicasa)
          Mapuche-Lafkenche (5 etapas Kimun) ......... btnKimun / kimunDialog
      8) 🕉️ Ashramas Hindúes (4 ashramas) .. btnAshramas / ashramasDialog
      9) 🏮 Décadas Confucio (6 décadas) .... btnConfucio / confucioDialog
      10) ⛰️ Cosmovisión Andina (3 energías) . btnAndina / andinaDialog
      11) 🧭 Estadios Jung (4 estadios) ...... btnJung / jungDialog
      12) 🍀 Rueda Celta (4 estaciones) ...... btnCelta / celtaDialog
      13) 🌙 Viaje Sufí (7 nafs) ............. btnSufi / sufiDialog

   Cada sección es completa e independiente, con 5 pestañas:
     Guía · Cuerpo & Salud · Mente & Vínculos · Vida práctica ·
     Mi espacio (chequeo + metas por luna + diario privado)
   Todo local y privado por usuario: userData().etapasVida
     { juv:{checks,metas}, adu:{...}, cli:{checks,sintomas,metas},
       vej:{checks,metas} }
   Educativo: NO reemplaza CESFAM, médico ni terapia.
   Sin dependencias externas. 100% offline.
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
function gotoBtn(id) {
  try {
    if (id === 'ritmoPlan') {
      if (window.abrirRitmoCircadiano) { window.abrirRitmoCircadiano('plan'); return; }
      id = 'btnCircadian';
    }
    var x = $(id); if (x) x.click();
  } catch (e) {}
}

/* Nodo de almacenamiento por etapa */
function stageStore(key) {
  var blank = { checks: {}, metas: [] };
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank;
    if (!u.etapasVida) u.etapasVida = {};
    if (!u.etapasVida[key]) u.etapasVida[key] = { checks: {}, metas: [] };
    var e = u.etapasVida[key];
    if (!e.checks) e.checks = {};
    if (!Array.isArray(e.metas)) e.metas = [];
    return e;
  } catch (e2) { return blank; }
}

/* ---------------- CONTENIDOS ---------------- */
var SOS_HTML = '<div class="si-card su-7266f7"><h4>🆘 Si la estás pasando mal ahora</h4>' +
  '<p class="su-6cb285">No tienes que aguantarlo solo/a: <b>*4141</b> prevención del suicidio (24 h, gratis) · <b>149</b> Fono Familia · <b>1455</b> violencia · <b>600 360 7777</b> Salud Responde · <b>800 400 035</b> SENAMA (personas mayores) · En Penco: tu <b>CESFAM</b>. Peligro inmediato: <b>133</b> / <b>131</b> SAMU.</p></div>';

var EMOS_BASE = ['alegría', 'tranquilidad', 'motivación', 'orgullo', 'cariño', 'tristeza', 'rabia', 'miedo', 'ansiedad', 'culpa', 'soledad', 'cansancio'];

var ETAPAS_CONF = [
/* ============ 1) JUVENTUD 20-39 ============ */
{
  key: 'juv', btn: 'btnJuventud', btnTxt: '🌅 Juventud',
  dlg: 'juventudDialog', title: '🌅 Juventud (20 a 39)',
  sub: 'Salir del liceo no viene con manual: trabajo, estudios, casa, pareja y plata al mismo tiempo. Aquí ordenas tu base: <b>1 paso por luna</b>. Todo queda <b>privado y local</b>. <b>Educativo: no reemplaza orientación laboral, salud ni terapia.</b>',
  kw: 'juventud joven adulto joven 20 30 trabajo primer empleo cv entrevista arriendo independizarse universidad instituto becas pareja paternidad maternidad proyecto vida ahorro',
  p: 'juv', tabNames: ['Guia', 'Cuerpo', 'Mente', 'Prac', 'Espacio'],
  tabLabels: ['🧭 Guía', '💪 Cuerpo', '🧠 Mente', '🧰 Vida práctica', '📓 Mi espacio'],
  intro: 'Etapa de <b>despegue y construcción</b>: nadie tiene todo resuelto a los 25, aunque las redes digan lo contrario. Tu tarea no es "tenerlo todo": es armar <b>base de salud, oficio y plata</b> que te sostenga a los 40.',
  fases: [
    { n: '20–24 · Despegue', ico: '🛫', q: 'Sales del liceo o terminas tu primera formación. Pruebas trabajos, turnos, quizás te vas de la casa o estudias y trabajas a la vez. Todo es ensayo: equivocarse barato ahora vale oro.',
      cuerpo: 'Trasnoche pasa la cuenta: cuida sueño y comida aunque el bolsillo apriete.',
      mente: 'Comparación feroz ("todos avanzan menos yo"). Cada historia recorta: compara tu hoy con tu hace 1 año, no con otros.',
      tip: '🌙 1 meta de oficio + 1 de plata por luna. Ej: "CV listo + ahorrar 20 lucas".' },
    { n: '25–29 · Construcción', ico: '🧱', q: 'Eliges camino con más consecincias: carrera u oficio, pareja más estable, quizás hijos o arriendo. Aparecen deudas, CAE, tarjetas: ordenar la plata es ordenar la cabeza.',
      cuerpo: 'El cuerpo ya no perdona todo: menos alcohol, más movimiento y chequeo dental/visión al año.',
      mente: 'Presión por "definirse". Se vale cambiar de rubro: la mayoría lo hace. Pide consejo a quien ya recorrió el tramo.',
      tip: '🌙 Fondo de emergencia: junta 1 mes de gastos. Después apunta a 3.' },
    { n: '30–39 · Consolidación', ico: '🌳', q: 'Sostienes: trabajo, casa, crianza o proyectos propios. Menos fiesta, más decisiones (casa, especialización, salud). Lo que sembraste en hábitos se empieza a notar.',
      cuerpo: 'Chequeos base cada 1-2 años: presión, peso, glicemia. Espalda y rodillas piden técnica, no solo fuerza.',
      mente: 'Duelo de caminos no tomados + orgullo de lo construido. Terapia, mentor o grupo: no lo hagas solo.',
      tip: '🌙 Revisa cada luna: ¿qué sostengo, qué suelto, qué delego?' }
  ],
  mitos: '• "A los 30 deberías tener casa, auto y familia" → mito: cada territorio y bolsillo tiene su ritmo.<br>• "Cambiar de carrera es fracasar" → es actualizar datos con más información.<br>• "Pedir ayuda es no ser adulto" → adulto es saber cuándo pedirla.<br>• "La tarjeta tapa el mes" → la tarjeta cara cobra 3 veces después.',
  uso: '1) Lee la <b>Guía</b> una vez.<br>2) Marca tu chequeo en <b>Cuerpo</b> según tu semana.<br>3) Elige 1 herramienta de <b>Mente</b>.<br>4) Avanza 1 trámite en <b>Vida práctica</b>.<br>5) Registra en <b>Mi espacio</b> y relee cada luna.',
  familia: 'Para familias: acompañar sin rescatar siempre. Ayuda concreta (cuidar guagua 1 tarde, prestar herramientas, enseñar a postular) sirve más que pagar la cuenta completa. Acuerden plazos y aportes en casa.',
  cuerpoIntro: 'A los 20 el cuerpo perdona; a los 35 pasa la cuenta. Base barata: <b>dormir, moverte, comer real y chequearte</b>. Cuesta menos que enfermarse.',
  cuerpo: [
    { n: 'Sueño 7–9 h (aunque haya turno)', ico: '😴', txt: 'Turnos y estudio nocturno rompen el ciclo: misma hora ±1 h, oscuridad real, sin pantalla 30 min antes, nada de cafeína después de las 15:00. Si trabajas de noche, antifaz + tapones + luz fuerte al despertar. Dormir poco 3+ meses sube peso, ánimo y accidentes.' },
    { n: 'Comida real con poco presupuesto', ico: '🥘', txt: 'Base Penco: legumbres 2-3 veces/semana, huevo, jurel o pollo, arroz/avena/papa + verdura de feria. Cocinar 2 veces/semana ahorra más que cualquier app. Agua antes que bebida; alcohol: menos días y nunca manejando. Usa 🥗 Comidas del calendario para planificar.' },
    { n: 'Movimiento 150 min/semana', ico: '🏃', txt: 'Caminar a buen ritmo, bici, fútbol, baile o calistenia: 30 min × 5 días. 2 días de fuerza (sentadilla, plancha, remo con mochila) cuidan espalda y rodillas. Elongar 5 min post turno evita lesiones. 💪 Entrenamientos del calendario te ordena.' },
    { n: 'Salud sexual y planificación', ico: '💛', txt: 'Consentimiento siempre: sí libre, informado, entusiasta y reversible. Preservativo + método de largo plazo (consejería matrona CESFAM, confidencial) previenen embarazo e ITS. Si buscas o evitas embarazo, 🤰 Fertilidad del calendario te enseña el ciclo. PAP cada 3 años (25-64), test de ITS si hay nueva pareja o riesgo.' },
    { n: 'Chequeos que sí tocan', ico: '🩺', txt: '1 vez/año: presión, peso, dental y visión. Cada 1-2 años: glicemia/colesterol si hay sobrepeso o familia con diabetes. Autoexamen testicular/mamario mensual: conoce tu normal y consulta cambios. Vacunas al día (influenza, COVID según campaña).' },
    { n: 'Alcohol, tabaco y otras', ico: '🚭', txt: 'A tu edad el riesgo es accidente, pelea, deuda y dependencia. Reglas que salvan: nunca manejar ni subirte con quien tomó, no mezclar, comer y tomar agua, plan de vuelta antes de salir. Si no puedes parar o faltas al trabajo/estudio por consumo: SENDA 1412 + CESFAM. Vender a menores es delito.' }
  ],
  menteIntro: 'Construir cansa la cabeza. Lo normal: dudar, cambiar de opinión, sentir que vas tarde. Lo que ayuda: <b>1 rutina + 1 persona + 1 proyecto</b>.',
  mente: [
    { n: 'Comparación y redes', ico: '📱', txt: 'Las redes muestran el 5% bueno. Limpia 1 vez por luna: silencia cuentas que te dejan mal, limita a 1 h de scroll con temporizador (⏱ Tiempo del calendario). Regla: crear 1 (tu oficio, tu huerta, tu música) antes de consumir 1 hora.' },
    { n: 'Ansiedad del "voy tarde"', ico: '🌬️', txt: 'Plan 10-10-10: ¿importará en 10 días, 10 meses, 10 años? Respiración 4-6 × 2 min + parte la meta en el paso de hoy ("mandar 1 CV", "caminar 20 min"). Si la angustia dura semanas o te bota el sueño/apetito: CESFAM / *4141 si hay ideas de daño.' },
    { n: 'Pareja: construir o desgastar', ico: '💛', txt: 'Sana: te deja crecer, respeta tu no, hablan de plata y planes. Alerta: revisa tu celu, te aísla, te apura sexualmente, grita y dice "es amor". Violencia es delito: 1455 / 149. Convivir: acuerden gastos 50-30-20 y tareas por escrito antes que por rabia.' },
    { n: 'Amistades que cambian', ico: '🤝', txt: 'Normal: unos se van a Santiago, otros son padres, otros toman otro rumbo. Cuida 3-5 vínculos con junta fija (fútbol, mate, minga). Mejor pocos presentes que cien en línea. Si te presionan a consumir o endeudarte: cambia de panorama, no de valores.' },
    { n: 'Pedir ayuda a tiempo', ico: '🫂', txt: 'Mentor de oficio + profesional de salud + 1 amigo que escuche sin juzgar. CESFAM tiene matrona, psicólogo y trabajador social gratis (Fonasa). Pedir hora cuesta 10 minutos; no pedirla cuesta meses.' }
  ],
  pracIntro: 'La adultez se juega en papeles: <b>pega, plata, casa y estudios</b>. Un trámite por semana te cambia el año.',
  prac: [
    { n: 'Pega: CV y entrevista', ico: '📄', txt: 'CV de 1 página: datos, perfil de 3 líneas, experiencia con logros ("vendí X", "cuidé Y"), cursos y referencias. Foto simple, correo serio, sin faltas. Entrevista: llega 15 min antes, investiga la empresa, 2 preguntas listas ("¿cómo es un buen día aquí?"), sueldo: da rango según mercado (revisa portales + pregunta a 2 personas del rubro). Guarda postulaciones en 📚 Horario / ⏱ Tiempo.' },
    { n: 'Plata: 50-30-20 + colchón', ico: '💰', txt: '50% necesario (arriendo, comida, pasajes), 30% gustos, 20% ahorro/deuda. Primero colchón de 1 mes de gastos en cuenta aparte; después ataca la deuda más cara. Antes de comprar: espera 48 h. Nunca arriendes tu cuenta RUT. Usa 💰 Finanzas del calendario: 5 min al día.' },
    { n: 'Casa: allegado o arriendo', ico: '🏠', txt: 'Arrienda si la cuota + gastos ≤ 30% de tu ingreso y el contrato está escrito (inventario con fotos, reajuste claro, garantía). Allegado: aporta fijo + tareas + fecha de revisión. Revisa humedad, luz, locomoción y riesgo tsunami (🌊🚨 Evacuación). Minga para mudarse sale más barato y junta gente.' },
    { n: 'Estudios: oficio o título', ico: '🎓', txt: 'CFT/IP/U, oficios (soldadura, cocina, cuidado, mar, construcción, programación): elige por 3 cruces (me gusta + soy bueno + da pega en Bío-Bío). Becas y gratuidad: revisa FUAS cada año; SENCE tiene cursos gratis con certificado. 25 min diarios (🍅 Pomodoro) > 5 h un domingo.' },
    { n: 'Hijos: decidir con datos', ico: '👶', txt: 'Tener o no tener: ambas son decisiones válidas. Si van: conversen plata, red de apoyo (¿quién cuida?), salud (controles, 🤰 Fertilidad + 🤱 1000 días) y reparto de tareas antes del parto. Si no van: planifiquen con matrona sin culpa ni presión familiar.' },
    { n: 'Proyecto a 1 luna', ico: '🎯', txt: 'Elige 1: "CV + 5 postulaciones", "colchón de 100 lucas", "pieza ordenada para arrendar", "curso SENCE inscrito". Escríbelo en 📓 Mi espacio (máx 3 metas), revísalo cada luna llena. Lo chico cumplido crea al adulto que cumple lo grande.' }
  ],
  espacioExtra: 'avance',
  espacioExtraLabel: 'Avance de mi proyecto (1-10)',
  bridges: [['juvGoFinanzas', 'btnFinance'], ['juvGoHabitos', 'btnHabits'], ['juvGoFerti', 'btnFerti'], ['juvGoStudy', 'btnStudy'], ['juvGoBreath', 'btnBreath'], ['juvGoGym', 'btnGym']],
  bridgesLabel: '🔗 Sigue en tu calendario',
  bridgesTxt: 'Tu base vive en otras secciones: úsalas sin salir del hábito.'
},
/* ============ 2) ADULTEZ 35-59 ============ */
{
  key: 'adu', btn: 'btnAdultez', btnTxt: '🏠 Adultez',
  dlg: 'adultezDialog', title: '🏠 Adultez (35 a 59)',
  sub: 'Sostienes a varios a la vez: hijos, padres, trabajo y casa. Esta etapa ordena la <b>generación sándwich</b> sin quemarte: salud preventiva, plata madura y tiempo propio. Todo <b>privado y local</b>. <b>Educativo: no reemplaza médico, terapeuta ni asesor previsional.</b>',
  kw: 'adultez adulto crisis mediana edad generacion sandwich cuidar padres hijos trabajo liderazgo salud preventiva presion diabetes colesterol burnout menopausia andropausia pension apv vivienda deuda',
  p: 'adu', tabNames: ['Guia', 'Cuerpo', 'Mente', 'Prac', 'Espacio'],
  tabLabels: ['🧭 Guía', '🩺 Cuerpo', '🧠 Mente', '🧰 Vida práctica', '📓 Mi espacio'],
  intro: 'Etapa de <b>sostener y decidir</b>: lo que cuidas hoy (cuerpo, plata, vínculos) define cómo llegas a los 70. No se trata de poder con todo: se trata de <b>elegir qué sostienes tú y qué se comparte o se suelta</b>.',
  fases: [
    { n: '35–44 · Expansión', ico: '🌊', q: 'Hijos chicos o adolescentes, arriendo o dividendo, pega con más responsabilidad. El día no alcanza: el riesgo es vivir en deuda de sueño y de tiempo propio.',
      cuerpo: 'Chequeos cada 1-2 años aunque "te sientas bien". Espalda, rodillas y presión avisan primero.',
      mente: 'Culpa por no alcanzar ("mal padre/madre, mal hijo/a, mal trabajador"). Culpa = señal de ajustar reparto, no de exigirse más.',
      tip: '🌙 1 control de salud + 1 conversación de reparto por luna.' },
    { n: '45–54 · Revisión', ico: '🪞', q: 'La famosa "crisis de los 40": en verdad es revisión. Cuerpo cambia (ver 🔥 Climaterio), hijos se van, padres envejecen, la pega pregunta sentido. Revisar no es fracasar: es actualizar el mapa.',
      cuerpo: 'Metabólico y hormonal se mueven: exámenes al día + fuerza 2×/semana + sueño protegido.',
      mente: 'Duelo de juventud + preguntas grandes (¿para qué trabajo tanto?). Mentoría, terapia o grupo de pares ordena más que un auto nuevo.',
      tip: '🌙 Escribe tu revisión: ¿qué sigo, qué cambio, qué suelto este año?' },
    { n: '55–59 · Transición', ico: '🌅', q: 'Se acerca la jubilación o un segundo oficio. Hijos adultos, quizás nietos, padres muy mayores. Cuidar tu salud ahora es tu mejor "pensión".',
      cuerpo: 'Densitometría, colon 45+, próstata/mama al día. Equilibrio y fuerza evitan caídas futuras.',
      mente: 'Miedo a "no servir" al jubilar. Ensaya tu después: oficio, minga, huerta, aprender algo nuevo.',
      tip: '🌙 1 paso previsional + 1 paso de salud por luna.' }
  ],
  mitos: '• "Cuidarme es egoísta con mi familia" → cuidarte ES cuidar a tu familia (nadie sostiene desde la cama).<br>• "A mi edad ya no cambio de pega" → cambias de rol, no de valor: tu experiencia vale.<br>• "El estrés es normal" → el estrés crónico enferma: se mide y se trata.<br>• "La menopausia/andropausia se aguanta en silencio" → se acompaña y se trata (ver 🔥 Climaterio).',
  uso: '1) Lee la <b>Guía</b> una vez.<br>2) Agenda tus <b>chequeos en Cuerpo</b>.<br>3) Elige 1 límite sano en <b>Mente</b>.<br>4) Avanza 1 papel en <b>Vida práctica</b>.<br>5) Chequea tu carga en <b>Mi espacio</b> cada luna.',
  familia: 'Reunión familiar de 30 min por luna: plata, cuidados y tareas sobre la mesa. Los acuerdos escritos evitan el 80% de las peleas. Incluye a los mayores en decisiones: opinar también es cuidar.',
  cuerpoIntro: 'Después de los 40 el cuerpo pide mantención programada, como el bote: <b>exámenes, fuerza, sueño y menos tóxicos</b>. Prevenir es 10 veces más barato que tratar.',
  cuerpo: [
    { n: 'Chequeos que salvan (GES/AUGE)', ico: '🩺', txt: 'Presión + peso cada año; glicemia/colesterol cada 1-2 años. PAP cada 3 años (25-64) + mamografía cada 2 (50-74, antes si hay familia). Próstata con médico desde los 50 (45 si hay familia). Colon desde los 45. EMPA en tu CESFAM es gratis y ordena todo esto en 1 mañana: pide tu hora.' },
    { n: 'Corazón y metabolismo', ico: '❤️', txt: 'Camina 30 min × 5 días + fuerza 2×/semana (sentadilla, remo, plancha). Sal moderada, fritos 1×/semana, alcohol poco o nada, tabaco cero (CESFAM ayuda a dejarlo). Si roncas fuerte + sueño de día: consulta (apnea). Dolor al pecho, falta de aire o desmayo: 131 de inmediato.' },
    { n: 'Huesos y articulaciones', ico: '🦴', txt: 'Calcio (lácteos, sardina/jurel con espina, hojas verdes) + vitamina D (sol de mañana 15 min) + fuerza. Dolor >2 semanas, hinchazón o crujido con traba: kine/CESFAM, no aguante. Peso sano cuida rodillas más que cualquier pastilla. 💪 Entrenamientos + 🧘 Rutinas del calendario.' },
    { n: 'Sueño protegido', ico: '😴', txt: '7-8 h. Misma hora, pieza oscura/fresca, sin noticias ni pantallas 45 min antes. Siesta máx 20 min antes de las 15:00. Ronquido + pausas de respiración, piernas inquietas o insomnio 3+ semanas: consulta. Dormir mal sube presión, peso y accidentes.' },
    { n: 'Espalda de quien carga', ico: '🧱', txt: 'Técnica: peso pegado al cuerpo, rodillas flectadas, giros con pies no con cintura. Pausa cada 50 min si trabajas sentado/de pie. Dolor con hormigueo, pérdida de fuerza o control de esfínter: urgencia. Calor local + movimiento suave mejor que cama total.' },
    { n: 'Menos tóxicos, más años', ico: '🚭', txt: 'Alcohol: si tomas, días sin consumo + nunca manejar. Tabaco: dejarlo a cualquier edad suma años en meses. Revisa tus remedios 1×/año con médico/químico (interacciones). Vacunas: influenza anual + COVID según campaña + antitetánica si trabajas tierra/fierro.' }
  ],
  menteIntro: 'Sostener a todos quema si nadie te sostiene a ti. <b>Carga visible + reparto + tiempo propio</b>: esa es la fórmula.',
  mente: [
    { n: 'Burnout: el incendio lento', ico: '🔥', txt: 'Señales: cansancio que no se va con dormir, cinismo ("todo me carga"), errores tontos, dormir/comer distinto 2+ semanas. Apaga: 1 tarea menos (delegar/borrar), 1 límite (hora de salida real), 1 recuperación diaria (caminar, mate sin pantalla). Si dura +1 mes o hay ideas de daño: CESFAM / *4141.' },
    { n: 'Generación sándwich sin culpa', ico: '🥪', txt: 'Hijos + padres + pega = triple turno. Reparte por escrito: quién cuida qué días, qué se paga, qué se externaliza (cuidadora, centro diurno, hermano). Cuidar 24/7 sin relevo enferma al cuidador: pide horas de respiro en CESFAM/Municipalidad. Culpa ≠ amor: amor con relevo dura más.' },
    { n: 'Pareja larga: renegociar', ico: '💛', txt: 'Con hijos o padres en casa, la pareja queda última. Cita de 1 h/semana sin pantallas + reparto de plata y tareas revisado cada luna. Gritos, control o miedo no son "estrés": son violencia (1455 / 149). Terapia de pareja a tiempo sale más barata que el divorcio.' },
    { n: 'Hijos adolescentes o que se van', ico: '🌱', txt: 'Con adolescentes: escucha sin sermón, reglas pocas y claras (ver 🌱 Adolescencia del calendario). Con nido vacío: duelo normal + oportunidad (oficio, viaje, pieza propia). Mantén puente: comida fija semanal vale más que control diario.' },
    { n: 'Tiempo propio no negociable', ico: '🌿', txt: '3×30 min/semana solo para ti (caminar, pescar, tejer, jugar): agéndalo como hora médica. Decir no a 1 cosa por semana es decir sí a tu salud. 🕉️ Prácticas + 📓 Gratitud del calendario sostienen.' }
  ],
  pracIntro: 'Papeles de adulto: <b>salud, plata, casa y relevo</b>. Un papel por semana y el año se ordena.',
  prac: [
    { n: 'Plata madura: deudas y pensión', ico: '💰', txt: 'Orden: 1) fondo emergencia 3-6 meses, 2) matar deuda cara (tarjeta, avance), 3) APV/cotizar lagunas (revisa tu cartola AFP 1×/año), 4) vivienda. Cotiza independiente aunque sea poco: cada año cotizado es pensión futura. Ojo estafas "gana plata fácil". Usa 💰 Finanzas del calendario.' },
    { n: 'Pega: liderar y plan B', ico: '🧭', txt: 'Liderar = enseñar, delegar y cuidar al equipo (no gritar). Negocia sueldo con datos (mercado + logros). Plan B siempre vivo: 1 oficio/curso al año (SENCE, oficio local). Guarda 3 meses de contactos y papeles (contratos, liquidaciones, certificados).' },
    { n: 'Casa que envejece contigo', ico: '🏠', txt: 'Anticipa: ducha con antideslizante, pasamanos, buena luz, dormitorio en primer piso si puedes. Mantención por luna (techo antes del invierno, estufa limpia). Papeles: escritura, cuentas y seguros en 1 carpeta que tu familia sepa ubicar. 🏠 Tareas Hogar te ordena.' },
    { n: 'Cuidar a tus padres', ico: '🫂', txt: 'Conversen HOY (no en urgencia): médico tratante, remedios, alergias, caídas, plata, quién decide qué. Casa segura (ver 🦉 Vejez) + controles + red (vecino llave, CESFAM, centro diurno). Cuidador con relevo: turnos escritos + descanso semanal. Maltrato al mayor es delito: SENAMA 800 400 035.' },
    { n: 'Duelo y legado en vida', ico: '🕊️', txt: 'Las pérdidas a esta edad duelen y enseñan: 🕊️ Duelo del calendario acompaña. Legado en vida: enseña tu oficio, graba historias (🗣️ Voz de los Abuelos), arma tu 🌳 Árbol. Testamento y voluntades conversados evitan peleas después.' },
    { n: 'Revisión de mitad (1 tarde)', ico: '📓', txt: 'Preguntas: ¿qué me da energía? ¿qué me enferma? ¿qué quiero a los 70? Elige 1 cambio chico por luna (dormir 30 min más, caminar con un amigo, curso). Revisa en 📓 Mi espacio + 🔁 Recapitulación si quieres soltar historia vieja.' }
  ],
  espacioExtra: 'carga',
  espacioExtraLabel: 'Carga que llevo hoy (1-10)',
  bridges: [['aduGoRutina', 'ritmoPlan', '🌞 Mi ritmo'], ['aduGoFinanzas', 'btnFinance'], ['aduGoDuelo', 'btnDueloFull'], ['aduGoClimaterio', 'btnClimaterio'], ['aduGoGym', 'btnGym'], ['aduGoGrat', 'btnGratitud']],
  bridgesLabel: '🔗 Sigue en tu calendario',
  bridgesTxt: 'Puentes directos a lo que más usa esta etapa.'
},
/* ============ 3) CLIMATERIO 45-64 ============ */
{
  key: 'cli', btn: 'btnClimaterio', btnTxt: '🔥 Climaterio',
  dlg: 'climaterioDialog', title: '🔥 Climaterio (45 a 64)',
  sub: 'Menopausia y andropausia explicadas sin susto ni silencio: <b>síntomas, qué alivia, tratamientos con médico y sexualidad madura</b>. Para mujeres, hombres y parejas. Todo <b>privado y local</b>. <b>Educativo: no reemplaza matrona, médico ni terapia.</b>',
  kw: 'climaterio menopausia perimenopausia andropausia bochorno sofoco insomnio sequedad libido hueso osteoporosis corazon terapia hormonal pap mamografia prostata',
  p: 'cli', tabNames: ['Guia', 'Cuerpo', 'Mente', 'Prac', 'Espacio'],
  tabLabels: ['🧭 Guía', '🌡️ Síntomas y alivio', '💛 Mente y pareja', '🧰 Plan de consultas', '📓 Mi espacio'],
  intro: '<b>Climaterio</b> es la transición hormonal de la mitad de la vida: en mujeres termina en <b>menopausia</b> (12 meses sin regla, promedio 50-52 años); en hombres el cambio (<b>andropausia</b>) es más lento. No es enfermedad: es <b>etapa que se acompaña, se mide y se trata</b>.',
  fases: [
    { n: 'Perimenopausia (años previos)', ico: '🌗', q: 'Reglas irregulares (más juntas o separadas, más o menos sangrado), bochornos nocturnos, sueño cortado, ánimo cambiante, niebla mental. Puede durar 4-8 años. Anotar el ciclo (🌸 Ciclo del calendario) muestra el patrón al médico.',
      cuerpo: 'Sangrado que empapa en 1 h por varias horas, reglas <21 días seguidas o sangrado post-menopausia: consulta pronto.',
      mente: 'Irritabilidad + llanto fácil + "no me reconozco": hormonal y real, no "locura". Hablémoslo en casa y en el trabajo.',
      tip: '🌙 Registra síntomas abajo: fecha, intensidad y qué ayudó.' },
    { n: 'Menopausia (12 meses sin regla)', ico: '🌕', q: 'Diagnóstico mirando atrás: 12 meses seguidos sin menstruar (sin otra causa). Bochornos, sequedad vaginal, baja libido, huesos y corazón piden más cuidado. Tratamientos existen: no hay que "aguantar no más".',
      cuerpo: 'Densitometría, mamografía, PAP, presión/lípidos/glicemia al día. Fuerza 2×/semana + calcio + vitamina D.',
      mente: 'Duelo de fertilidad + alivio de no sangrar: ambas válidas. Pareja informada discute menos.',
      tip: '🌙 1 examen pendiente por luna hasta ponerte al día.' },
    { n: 'Andropausia (cambio lento)', ico: '🌅', q: 'En hombres 45+: testosterona baja lento. Cansancio, menos deseo o erecciones, ánimo bajo, panza, menos fuerza, ronquido. Se confunde con "estrés": se mide con examen y se trata con médico (no con pócimas).',
      cuerpo: 'Próstata (tacto/PSA según médico), cardiovascular, glicemia, apnea del sueño. Fuerza + caminar + menos alcohol.',
      mente: 'Vergüenza de hablarlo: hablarlo es el tratamiento 1. Pareja que escucha ayuda más que pastilla escondida.',
      tip: '🌙 Conversación pendiente: doctor + pareja. Agéndalas este mes.' }
  ],
  mitos: '• "Hay que aguantar en silencio" → hay alivio con evidencia: consulta.<br>• "La terapia hormonal es peligrosa siempre" → tiene beneficios y riesgos según cada caso: se decide con médico, no con vecina ni con miedo.<br>• "Se acaba el deseo" → cambia, no se acaba: lubricación, tiempo y comunicación lo renuevan.<br>• "A los hombres no les pasa" → les pasa más lento y también merece cuidado.',
  uso: '1) Lee la <b>Guía</b> según tu caso.<br>2) Ubica tus <b>síntomas y alivios</b>.<br>3) Conversa <b>mente y pareja</b>.<br>4) Arma tu <b>plan de consultas</b>.<br>5) Lleva tu <b>registro mensual</b> en Mi espacio: con 2 lunas de datos el médico decide 10 veces mejor.',
  familia: 'Para parejas y familias: bochorno nocturno no es "maña", insomnio no es "flojera", sequedad no es "rechazo". Pregunten "¿qué te alivia?" y repartan: ventilación, relevo de noche, paciencia. Acompañar también es tratamiento.',
  cuerpoIntro: 'Los síntomas son reales y medibles. <b>Lo que alivia con evidencia + cuándo consultar</b>, sin humo.',
  cuerpo: [
    { n: 'Bochornos y sudor nocturno', ico: '🌡️', txt: 'Capas de ropa, pieza fresca (18-20°), agua fría a mano, evitar alcohol/picante/cafeína de tarde. Respiración lenta 6×/min corta varios. Frecuentes + te botan el sueño: consulta (hay tratamiento hormonal y no hormonal con receta). Anota hora y gatillo en el registro.' },
    { n: 'Sueño cortado', ico: '😴', txt: 'Misma hora, sin pantalla 45 min, ducha tibia, nada de alcohol como "somnífero" (rompe el sueño). Si despiertas empapada/o: muda seca lista + ventilación. Insomnio 3+ semanas o ronquido con pausas: consulta (apnea e insomnio se tratan).' },
    { n: 'Sequedad vaginal y deseo', ico: '💧', txt: 'Lubricantes base agua + hidratantes vaginales de farmacia alivian el día a día; estrógeno local con receta ayuda mucho y se conversa con matrona/médico. Dolor que impide relaciones, sangrado con roce o flujo con mal olor: consulta. Deseo: más juego previo, más tiempo, más palabra: el cuerpo maduro responde distinto, no peor.' },
    { n: 'Huesos, corazón y peso', ico: '🦴', txt: 'Huesos: fuerza 2×/semana + caminar + calcio (lácteo, jurel/sardina, verduras) + vitamina D (sol 15 min) + no fumar. Corazón: presión/lípidos/glicemia al día, sal moderada, alcohol poco. Peso: la panza de esta edad es metabólica: proteína + fibra + movimiento diario + dormir. Densitometría según médico (típico 65+, antes con riesgo).' },
    { n: 'Hombres: próstata y energía', ico: '🩺', txt: 'Orinar de noche muchas veces, chorro débil, urgencia o sangre: consulta (próstata). Erecciones: 8 de 10 veces con dificultad 3+ meses = consulta (corazón, glicemia, ánimo y hormonas se revisan juntos). Cuidado con "potenciadores" sin receta: pueden bajar la presión peligrosamente. Menos alcohol + dormir + moverse mejora más que cualquier frasco.' },
    { n: 'Tratamientos: decide con médico', ico: '💊', txt: 'Opciones reales: terapia hormonal (pastilla/parche/gel/dosis vaginal), no hormonales con receta, y apoyo (sueño, ánimo, kine pelvic). Trae tu registro de 2 lunas + exámenes + lista de remedios a la consulta. Lawen (manzanilla, toronjil, pasiflora) puede acompañar el relajo, no reemplaza tratamiento. Desconfía de quien promete "rejuvenecer hormonas" sin exámenes.' }
  ],
  menteIntro: 'Hormonas + vida (hijos que se van, padres que envejecen, pega exigente) se juntan. <b>Nombrar + pedir + acordar</b>.',
  mente: [
    { n: 'Ánimo y niebla mental', ico: '🌧️', txt: 'Olvidos de palabras, llanto fácil, irritabilidad: típico y transitorio en la mayoría. Ayuda: dormir, moverse, lista escrita, 1 tarea a la vez. Tristeza 2+ semanas casi todos los días, sin ganas, o ideas de daño: pide ayuda HOY (*4141 / CESFAM). No es "la edad": la depresión se trata a cualquier edad.' },
    { n: 'Sexualidad madura', ico: '💛', txt: 'Consentimiento + lubricación + tiempo + humor. Hablen fuera de la cama: qué gusta ahora, qué duele, qué ritmo. Sequedad/dolor tienen solución médica: no se adivina, se consulta. Intimidad no es solo penetración: piel, risa y cuidado también cuentan.' },
    { n: 'Pareja: informar para discutir menos', ico: '🤝', txt: 'Lean juntos 1 tarjeta de síntomas. Acuerdos: relevo nocturno (ventilador, mudas), paciencia con el ánimo, citas sin pantallas. Si hay gritos, control o miedo: eso no es climaterio, es violencia (1455 / 149). Terapia de pareja a tiempo ordena.' },
    { n: 'Trabajo con síntomas', ico: '🧭', txt: 'Bochorno en reunión: agua, capas, respira, sigue (nadie lo nota tanto como tú). Pide lo razonable: ventilación, pausas, uniforme fresco. Niebla mental: escribe todo, parte en chico, revisa. Si el insomnio te bota el rendimiento: certificado + consulta, no renuncia.' },
    { n: 'Red que sostiene', ico: '🫂', txt: 'Grupo de pares (amigas, taller, caminata) + 1 profesional (matrona/médico/psicólogo CESFAM). Hablarlo baja la mitad del peso. 📓 Gratitud + 🌬️ Respiración del calendario para el día a día.' }
  ],
  pracIntro: 'Tu plan de consultas: <b>qué pedir, qué llevar y en qué orden</b>. Una hora bien usada vale 3 vueltas.',
  prac: [
    { n: 'Chequeo mujer 45-64', ico: '📋', txt: 'Pide en CESFAM: EMPA + control matrona/médico. Exámenes típicos: PAP (cada 3 años 25-64), mamografía (cada 2 años 50-74), presión/lípidos/glicemia, densitometría según riesgo/edad. Lleva: registro de síntomas 2 lunas + fechas de reglas + lista de remedios + preguntas escritas.' },
    { n: 'Chequeo hombre 45-64', ico: '📋', txt: 'Pide: EMPA + control médico. Revisan: presión, glicemia/lípidos, próstata (tacto/PSA según criterio médico), corazón, sueño/apnea, ánimo, alcohol/tabaco. Lleva: síntomas (orina, erección, energía, sueño) + remedios + preguntas. Vergüenza 10 min < tranquilidad 10 años.' },
    { n: 'Preguntas para la consulta', ico: '❓', txt: 'Copia y lleva: 1) ¿Mis síntomas calzan con climaterio? 2) ¿Qué exámenes me tocan? 3) ¿Soy candidata/o a terapia hormonal? (beneficios/riesgos en MI caso) 4) ¿Qué opciones no hormonales hay? 5) ¿Cuándo vuelvo y por qué signos vuelvo antes?' },
    { n: 'Kit de la luna', ico: '🌙', txt: 'Ventilador o abanico + botella de agua + mudas livianas + lubricante base agua + antifaz/tapones + lista de remedios a la vista. En el velador: agua + muda seca + luz tenue. En la cartera: abanico + agua. Lo simple repetido alivia más que lo caro una vez.' },
    { n: 'Derechos y GES', ico: '⚖️', txt: 'GES/AUGE cubre: cáncer de mama, cervicouterino, depresión, entre otros. Licencia por insomnio/depresión severa es derecho, no favor. En el trabajo puedes pedir ajustes razonables de ambiente. Si te discriminan por edad o salud: Inspección del Trabajo + ⚖️ Derechos del calendario.' },
    { n: 'Registro que decide', ico: '📓', txt: 'Abajo en Mi espacio: marca síntomas + intensidad + qué ayudó. En 2 lunas verás gatillos (alcohol, café, calor, estrés) y el médico verá tratamiento. Exporta y lleva impreso o en el celu a tu hora.' }
  ],
  espacioExtra: 'sintomas',
  espacioExtraLabel: null,
  bridges: [['cliGoCiclo', 'btnMenstrual'], ['cliGoRutina', 'ritmoPlan', '🌞 Mi ritmo'], ['cliGoGym', 'btnGym'], ['cliGoBreath', 'btnBreath'], ['cliGoAdultez', 'btnAdultez'], ['cliGoGrat', 'btnGratitud']],
  bridgesLabel: '🔗 Sigue en tu calendario',
  bridgesTxt: 'El climaterio se lleva mejor con ciclo, rutinas, fuerza y calma.'
},
/* ============ 4) VEJEZ SABIA 60+ ============ */
{
  key: 'vej', btn: 'btnVejez', btnTxt: '🦉 Vejez Sabia',
  dlg: 'vejezDialog', title: '🦉 Vejez Sabia (60+)',
  sub: 'Envejecer no es enfermar: es <b>cambiar de ritmo con autonomía, cuidados y legado</b>. Guía para personas mayores y para quienes acompañan. Todo <b>privado y local</b>. <b>Educativo: no reemplaza médico, kine ni asistente social.</b>',
  kw: 'vejez adulto mayor persona mayor abuelo abuela jubilacion pension pgu memoria caidas baston cuidado cuidador testamento legado autonomia geriatria senama demencia alzheimer',
  p: 'vej', tabNames: ['Guia', 'Cuerpo', 'Mente', 'Prac', 'Espacio'],
  tabLabels: ['🧭 Guía', '🦴 Cuerpo', '💛 Mente', '🧰 Vida práctica', '📓 Mi espacio'],
  intro: 'Etapa de <b>cosecha y transmisión</b>: lo que sabes (oficio, historia, lawen, mar y bosque) vale para Penco. La meta es <b>autonomía el mayor tiempo posible</b>: hacer solo lo que puedas, pedir ayuda en lo justo, decidir siempre.',
  fases: [
    { n: '60–74 · Activa', ico: '🌅', q: 'Jubilación o medio tiempo, nietos, viajes cortos, dirigentes, huerta, iglesia, club. El cuerpo pide mantención pero responde bien. Ideal para enseñar oficio y ordenar papeles con calma.',
      cuerpo: 'Fuerza + equilibrio + caminar. Vista, oído, dientes y pies al día: 4 ladrones silenciosos de autonomía.',
      mente: 'Riesgo: "ya no sirvo". Antídoto: rol claro (enseñar, cuidar huerta, contar historia) + grupo semanal.',
      tip: '🌙 1 salida + 1 enseñanza por luna (receta, nudo, historia).' },
    { n: '75–89 · Cuidada', ico: '🏠', q: 'Más pausas, más remedios, quizás bastón o audífono. Autonomía por capas: sola/o en lo posible, acompañada/o en lo riesgoso (ducha, noche, trámites). Pedir ayuda es inteligencia, no derrota.',
      cuerpo: 'Casa anticaídas + pastillero + controles. Caída = aviso: se revisa causa, no se esconde.',
      mente: 'Duelos (pareja, amigos, salud) se juntan: 🕊️ Duelo + grupo + fe/comunidad sostienen.',
      tip: '🌙 Revisa con familia: ¿qué hago sola/o, en qué pido mano?' },
    { n: '90+ · Acompañada', ico: '🕯️', q: 'Frágil y valiosa. Prioridad: confort, vínculo y decidir (dónde estar, quién cuida, qué tratamientos sí/no). Cuidados paliativos alivian, no apuran: se piden en CESFAM/hospital.',
      cuerpo: 'Piel, hidratación, movilizar a diario, dolor siempre tratado. Silla y cama seguras.',
      mente: 'Presencia > palabras: mano, música, fotos, epew. La persona entiende cariño hasta el final.',
      tip: '🌙 1 recuerdo grabado por luna: tu voz queda (🗣️ Voz de los Abuelos).' }
  ],
  mitos: '• "Vejez = enfermedad" → envejecer sano es lo normal con cuidados; enfermar se trata a cualquier edad.<br>• "Ya no aprende" → aprende a su ritmo y con práctica: paciencia, no gritos.<br>• "Mejor no molestar al doctor" → molestar es su trabajo: consulta temprano.<br>• "Quitarle tareas es cuidarlo" → quitarle todo lo apaga: autonomy se usa o se pierde.',
  uso: '1) Lee la <b>Guía</b> según tu tramo.<br>2) Revisa <b>Cuerpo</b> (casa + controles).<br>3) Cuida <b>Mente</b> (memoria, ánimo, trato).<br>4) Ordena <b>Vida práctica</b> (plata, papeles, cuidados).<br>5) Marca tu día en <b>Mi espacio</b>: 1 minuto que muestra tu autonomía en el tiempo.',
  familia: 'Para quienes acompañan: pregunten antes de hacer ("¿te ayudo o lo haces tú?"), hablen de frente y despacio, inclúyanlo en decisiones de SU vida y SU plata. Cuidar sin relevo quema: turnos + descanso + ayuda municipal/CESFAM. Gritos, encierro, quitarle la plata o dejarlo solo días: es maltrato (SENAMA 800 400 035 / 149).',
  cuerpoIntro: 'Cuatro pilares: <b>moverse, comer y tomar agua, remedios ordenados y casa sin caídas</b>. Más controles al día.',
  cuerpo: [
    { n: 'Moverse: fuerza + equilibrio', ico: '🚶', txt: 'Caminar 20-30 min casi todos los días + fuerza liviana 2×/semana (levantarse de silla, botellas de agua, banda) + equilibrio (pararse en 1 pie con apoyo, tai chi). Dolor que deja cojo 2+ días, mareo con caída o falta de aire: consulta. Kine CESFAM enseña gratis la rutina segura.' },
    { n: 'Casa anticaídas', ico: '🏠', txt: 'Luz en pasillo y baño, barras en ducha y WC, antideslizante en ducha, alfombras fijadas o fuera, cables pegados, silla firme para vestirse, bastón a la medida (muñeca). Revisa con esta lista 1×/luna. Caída aunque "no fue nada": cuéntala en tu control (avisa de presión, vista, remedio o piso).' },
    { n: 'Ojos, oídos, dientes y pies', ico: '👓', txt: 'Vista borrosa, no oír puerta/timbre, dolor de muela o no masticar, uñas encarnadas: quitan autonomía en silencio. Control anual (oftalmo, audio, dental, podología CESFAM). Audífono y lentes se usan: guardarlos no sirve. Anteojos limpios + luz buena evitan la mitad de los tropiezos.' },
    { n: 'Remedios ordenados', ico: '💊', txt: 'Pastillero semanal + lista (nombre, dosis, hora, para qué) en velador y en celu de un familiar. Lleva TODOS los frascos a cada control (incluye hierbas y "naturales": también interactúan). Nunca prestes ni partas remedios sin indicación. Mareo, caída o confusión nueva tras cambio de dosis: consulta pronto.' },
    { n: 'Comida e hidratación', ico: '🥗', txt: 'Proteína diaria (huevo, legumbre, pescado, pollo, lácteo) + verdura + agua 6-8 vasos (aunque no dé sed). Poca sal, poco azúcar, alcohol mínimo (pega más fuerte con la edad y con remedios). Si bajas de peso sin querer, te cuesta tragar o te mareas al pararte: consulta. Cocinar acompañado (🥗 Comidas) abre el apetito.' },
    { n: 'Controles y vacunas', ico: '🩺', txt: 'EMPA + control crónico (presión, diabetes) sin faltar. Vacunas: influenza anual, COVID y neumococo según campaña. Piel: revisa manchas nuevas que crecen/sangran. Dolor: todo dolor merece alivio (no "es la edad"). Urgencias: pecho, falta de aire, cara torcida, habla rara, desmayo → 131.' }
  ],
  menteIntro: 'Memoria, ánimo y trato: <b>lo normal, lo que avisa y dónde pedir ayuda</b>.',
  mente: [
    { n: 'Memoria: normal vs alerta', ico: '🧠', txt: 'Normal: olvidar nombres y acordarse después, perder llaves a veces. Alerta: perderse en lugares conocidos, repetir la misma pregunta sin notar, no manejar su plata de siempre, cambios de conducta. Ante alerta: control con acompañante + lista de ejemplos (fecha y qué pasó). Estimula: leer, conversar, juegos (🧩 Memoria, ♟ Ajedrez), enseñar oficio. No se grita ni se humilla: se acompaña.' },
    { n: 'Ánimo y soledad', ico: '🌤️', txt: 'Viudez, jubilación y dolores bajan el ánimo: duelo normal + rutina + grupo lo levantan. Salida fija semanal (club, iglesia, caminata, feria) + 1 llamada diaria + sol de mañana. Tristeza 2+ semanas, sin ganas de comer/salir/bañarse, o ideas de daño: ayuda HOY (*4141 / CESFAM). La depresión en mayores SÍ se trata.' },
    { n: 'Duelo y viudez', ico: '🕊️', txt: 'Perder compañero/a o amigos duele el cuerpo también: llanto, cansancio, olvidos. 🕊️ Duelo del calendario + ritual (velorio, misa, visita al cementerio, memoria en casa) + no decidir grande los primeros meses. Si te aíslas meses o dejas remedios/comida: pide compañía profesional y familiar.' },
    { n: 'Buen trato siempre', ico: '🛡️', txt: 'Nadie puede gritarte, encerrarte, quitarte tu plata, amenazarte o dejarte sin comida/remedios: eso es maltrato aunque sea familia. Guarda tus documentos y tu clave. Ayuda: SENAMA 800 400 035, 149, 1455, CESFAM, Carabineros 133. Vecinos: si ven a un mayor solo o descuidado, avisen (Municipalidad/CESFAM).' },
    { n: 'Sentido y espiritualidad', ico: '🕯️', txt: 'Fe, meditación, epew, misa, nguillatun, gratitud: lo que te dé paz es medicina. Enseñar (oficio, cocina, historia) da rol y alegría. 🕉️ Prácticas + 📓 Gratitud + 🗣️ Voz de los Abuelos del calendario guardan tu sabiduría.' }
  ],
  pracIntro: 'Papeles y cuidados ordenados = tranquilidad para ti y tu familia. <b>De a 1 por luna, sin apuro pero sin pausa.</b>',
  prac: [
    { n: 'Plata: pensión y PGU', ico: '💰', txt: 'Revisa: cotizaciones (AFP), PGU y beneficios (Registro Social de Hogares, Municipalidad). Presupuesto simple: remedios + comida + casa primero; avisa si no alcanza (hay ayudas). Cuida tu clave y tu cuenta: NADIE de banco/AFP pide clave por teléfono o link (corta y llama tú al oficial). Si alguien te presiona a firmar o regalar: no firmes y pide 2 opiniones. 💰 Finanzas te ordena.' },
    { n: 'Papeles en 1 carpeta', ico: '📁', txt: 'Carnet, credenciales (Fonasa/AFP), lista de remedios, alergias, contactos de emergencia, escritura/arriendo, cuentas, seguros, voluntades. Copia en casa de 1 familiar de confianza. Poderes y trámites: con abogado/Corporación de Asistencia Judicial, nunca en blanco. Conversa en vida: dónde quiero estar, qué tratamientos sí/no (testamento vital).' },
    { n: 'Cuidados: quién y cómo', ico: '🫂', txt: 'Acuerdo escrito: quién cuida qué días, qué se paga, teléfono de urgencias a la vista, relevo semanal del cuidador (sin relevo el cuidador enferma). Apoyos: CESFAM (visita domiciliaria, cuidadores), Municipalidad (centro diurno, ayudas), SENAMA. Cuidados paliativos: alivio del dolor y compañía, se piden sin miedo.' },
    { n: 'Jubilación con vida', ico: '🌅', txt: 'Ensaya tu semana ideal: 1 grupo + 1 movimiento + 1 enseñanza + 1 descanso. Trabajo liviano u oficio (feria, reparaciones, cocina, cuidado) si quieres y puedes: por gusto, no por necesidad extrema (revisa ayudas primero). Aprender algo nuevo (🧩 Memoria, 🎸 Guitarra, 🗣️ Mapuzugun) mantiene el cerebro vivo.' },
    { n: 'Legado: tu voz queda', ico: '🗣️', txt: 'Graba 1 historia por luna (🗣️ Voz de los Abuelos): infancia, trabajo, Penco antiguo, consejo. Arma tu 🌳 Árbol con fotos y nombres. Enseña 1 cosa (receta, tejido, nudo, epew). El legado no es plata: es saber que sigue vivo en otros.' },
    { n: 'Acompañar el final', ico: '🕯️', txt: 'Hablar de la muerte en familia alivia: miedos, deseos (lugar, rito, música), pendientes y perdones. 🕊️ Duelo acompaña el después. Nadie debe partir con dolor tratable ni solo pudiendo estar acompañado: pide ayuda paliativa y espiritual a tiempo.' }
  ],
  espacioExtra: 'autonomia',
  espacioExtraLabel: 'Autonomía de hoy (1-10: me valí solo/a)',
  bridges: [['vejGoVoz', 'btnVozAbuelos'], ['vejGoArbol', 'btnArbolFull'], ['vejGoDuelo', 'btnDueloFull'], ['vejGoRutina', 'ritmoPlan', '🌞 Mi ritmo'], ['vejGoMemory', 'btnMemory'], ['vejGoGrat', 'btnGratitud']],
  bridgesLabel: '🔗 Sigue en tu calendario',
  bridgesTxt: 'Tu sabiduría y tus cuidados viven también en estas secciones.'
},
/* ============ 5) SEPTENIOS 0-70+ ============ */
{
  key: 'sep', btn: 'btnSeptenios', btnTxt: '🌀 Septenios',
  dlg: 'septeniosDialog', title: '🌀 Septenios (ciclos de 7 años)',
  sub: 'Mapa de la vida en ciclos de 7 años: <b>cada septenio trae un cuerpo, una tarea del alma y una crisis que abre la puerta al siguiente</b>. Sirve para ubicarte, entender tu momento y preparar el que viene. Todo <b>privado y local</b>. <b>Educativo: no reemplaza médico, terapeuta ni consejería.</b>',
  kw: 'septenios septenio ciclos 7 siete anos antroposofia steiner biografia crisis nudo lunar saturno retorno 21 28 35 42 49 56 63 mision vocacion proposito edad etapas',
  p: 'sep', tabNames: ['Guia', 'Cuerpo', 'Mente', 'Prac', 'Espacio'],
  tabLabels: ['🧭 Guía', '🌗 Mapa 0-70+', '🧠 Mente', '🧰 Vida práctica', '📓 Mi espacio'],
  intro: 'Etapa que las contiene a todas: de los 0 a los 70+ avanzamos por <b>septenios</b>. Cada 7 años madura una capa: primero el <b>cuerpo</b> (0-21), luego el <b>alma</b> (21-42) y después el <b>espíritu</b> (42 en adelante). Las crisis de los 21, 28, 35, 42 o 49 no son fallas: son <b>cambios de piel</b>. Ubica tu septenio abajo y trabaja solo ese: lo demás llega solo.',
  fases: [
    { n: '0–7 · Cuerpo y hogar', ico: '🌱', q: 'El niño aprende por imitación: lo que ve en casa lo vuelve cuerpo. Necesita calor, ritmo (dormir, comer, jugar a la misma hora), naturaleza y cuentos más que pantallas. Los dientes, el caminar y el hablar marcan el cierre.',
      cuerpo: 'Ritmo fijo, juego libre afuera, comida casera y límites con cariño. Menos pantalla, más bosque y mar.',
      mente: 'Mundo bueno: "el mundo es bueno". Si hay gritos o sustos seguidos, el cuerpo los guarda: calma y reparación rápida.',
      tip: '🌙 Para padres: 1 cuento + 1 paseo por luna. Ver 🧒 Crianza del calendario.' },
    { n: '7–14 · Sentir y aprender', ico: '🌸', q: 'Cambia los dientes, nace la memoria y el corazón pide belleza: música, arte, epew, deporte en equipo. La autoridad amorosa (profe, mamá, papá) enseña más que mil reglas. Pubertad anuncia el cierre.',
      cuerpo: 'Dormir 10 h, moverse a diario, comida que sostenga el estirón. Ojo mochila y postura.',
      mente: 'Mundo bello: "el mundo es bello". Burla o humillación duelen años: nombrar y reparar.',
      tip: '🌙 1 oficio manual por luna (cocinar, tejer, sembrar, arreglar).' },
    { n: '14–21 · Verdad e identidad', ico: '🔥', q: 'Despierta el juicio propio: ideales, amistades intensas, primer amor, liceo, vocación. Todo se cuestiona. Tarea: decir yo sin romper el nido. Ideal con grupo y adulto que escuche sin sermón.',
      cuerpo: 'Sueño (crece de noche), deporte que descargue, cuidado de salud sexual y de consumos (ver 🌱 Adolescencia).',
      mente: 'Mundo verdadero: "el mundo es verdadero". Comparación y rabia son materiales de identidad: canalizar en crear.',
      tip: '🌙 Pregunta guía: ¿qué me indigna y qué quiero crear con eso?' },
    { n: '21–28 · Alma sensible: salir al mundo', ico: '🛫', q: 'Independencia real: trabajo, estudios superiores, primera casa, pareja elegida. Todo se siente fuerte y se prueba. Nudo lunar ~18-19: ¿sigo el guion familiar o el mío? Ensayo barato vale oro.',
      cuerpo: 'Trasnoche pasa cuenta: protege sueño y comida aunque apriete el bolsillo.',
      mente: 'Hipersensibilidad + idealismo. Duelo de caminos + aprender a decir no sin culpa.',
      tip: '🌙 1 oficio + 1 colchón de plata por luna. Ver 🌅 Juventud.' },
    { n: '28–35 · Alma racional: ordenar', ico: '🧱', q: 'Retorno de Saturno (~28-30): la vida pide estructura. Pareja más estable, hijos o proyectos, deudas, oficio que rinde. Se cae lo prestado y queda lo propio. Crisis fértil: ¿esto lo elegí yo?',
      cuerpo: 'Chequeos base, fuerza 2×/semana, menos alcohol. Espalda y rodillas piden técnica.',
      mente: 'Exigencia y comparación. Se vale cambiar de rubro con datos, no con impulso.',
      tip: '🌙 Fondo de emergencia de 1 mes, después 3. Ver 💰 Finanzas.' },
    { n: '35–42 · Alma consciente: autenticidad', ico: '🪞', q: 'Pregunta grande: ¿esta vida es la mía? Cuerpo cambia, hijos crecen, padres envejecen, la pega pregunta sentido. Lo que no es tuyo pesa el doble. Revisar no es fracasar: es actualizar el mapa.',
      cuerpo: 'Metabólico se mueve: exámenes al día + fuerza + sueño protegido. Ver 🏠 Adultez.',
      mente: 'Duelo de juventud + ganas de verdad. Terapia, mentor o grupo ordenan más que un auto nuevo.',
      tip: '🌙 Escribe: ¿qué sigo, qué cambio, qué suelto este año?' },
    { n: '42–49 · Yo y misión', ico: '🌗', q: 'Nudo lunar ~37 y mitad del septenio: ¿para quién vivo lo que sé hacer? Climaterio en muchos cuerpos, hijos que se van, padres muy mayores. Tarea: poner tu don al servicio sin quemarte. Menos ego, más legado.',
      cuerpo: 'Acompaña síntomas sin silencio (ver 🔥 Climaterio), fuerza, corazón y huesos.',
      mente: 'Crisis de sentido fértil. Pareja se renegocia, amistades se podan, vocación se afina.',
      tip: '🌙 1 enseñanza por luna: lo que sabes vale para otros.' },
    { n: '49–56 · Cosecha y enseñanza', ico: '🌾', q: 'Lo sembrado se ve: oficio maduro, hijos adultos, quizás nietos. Tarea: enseñar y soltar poder. Si guardaste salud y vínculos, cosechas liviano. Si no, es tiempo de reparar: pedir perdón también es cosechar.',
      cuerpo: 'Mantención programada: EMPA, vista, oído, dientes, equilibrio. Caminar + fuerza sostienen.',
      mente: 'Miedo a "no servir" si baja el ritmo. Antídoto: rol de guía (minga, taller, historia).',
      tip: '🌙 Graba 1 historia por luna (🗣️ Voz de los Abuelos).' },
    { n: '56–63 · Sabiduría y soltar', ico: '🦉', q: 'Segundo retorno de Saturno (~58-60): suelta cargos, hereda mando, cuida energía. Tarea: ser faro, no tractor. Jubilación o segundo oficio por gusto. Casa y papeles en orden dan paz.',
      cuerpo: 'Densitometría, colon, próstata/mama al día. Casa anticaídas + pastillero ordenado.',
      mente: 'Duelos se juntan: 🕊️ Duelo + grupo + fe sostienen. Enseñar rejuvenece.',
      tip: '🌙 Revisa con familia: ¿qué hago sola/o, en qué pido mano?' },
    { n: '63+ · Legado y trascendencia', ico: '🕯️', q: 'Frágil y valiosa. Prioridad: confort, vínculo y decidir (dónde estar, quién cuida, qué tratamientos sí/no). Tarea: bendecir. Lo que perdonas y cuentas queda vivo en otros. Cuidados paliativos alivian, no apuran.',
      cuerpo: 'Piel, hidratación, moverse a diario, dolor siempre tratado. Ver 🦉 Vejez Sabia.',
      mente: 'Presencia más que palabras: mano, música, fotos, epew. La persona entiende cariño hasta el final.',
      tip: '🌙 1 recuerdo grabado por luna: tu voz queda.' }
  ],
  mitos: '• "La crisis de los 40 es tontera" → es revisión real del alma: ignorarla la alarga, escucharla la acorta.<br>• "A los 30 deberías tener todo listo" → cada septenio tiene su tarea: apurar quema etapas.<br>• "Después de los 50 ya no cambias" → el espíritu madura hasta el final: se aprende a todo septenio.<br>• "Los astros mandan" → los ciclos orientan, no obligan: tú decides con datos y ayuda.',
  uso: '1) Calcula tu septenio: <b>edad ÷ 7</b> (ej: 34 años = 5° septenio 28-35).<br>2) Lee solo <b>tu septenio + el anterior + el siguiente</b>.<br>3) Marca tu chequeo en <b>Mente</b> según tu semana.<br>4) Elige 1 tarea en <b>Vida práctica</b>.<br>5) Registra en <b>Mi espacio</b> cada luna: en 3 lunas verás tu patrón.',
  familia: 'Para familias: cada integrante vive un septenio distinto y necesita trato distinto (juego, belleza, verdad, ensayo, estructura, sentido, legado). No pidas peras al manzano de 7 ni obediencia ciega al de 16. Pregunten en casa: "¿en qué septenio estás y qué necesitas?" y repartan cuidados según eso.',
  cuerpoIntro: 'Cada septenio pide un cuidado distinto, pero la base es la misma: <b>dormir, moverse, comer real y chequearse</b>. Aquí el mapa por edad.',
  cuerpo: [
    { n: 'Ritmo: el remedio de todo septenio', ico: '🌙', txt: '0-7: misma hora para dormir/comer/jugar. 7-21: sueño largo (10 h y luego 8-9 h) + horarios de estudio. 21+: misma hora ±1 h, sin pantalla 30-45 min antes, cafeína hasta las 15:00. Turnos nocturnos: antifaz + tapones + luz fuerte al despertar. Dormir mal 3+ semanas: consulta CESFAM.' },
    { n: 'Movimiento según década', ico: '🏃', txt: 'Niños: juego libre 2 h/día. 14-35: deporte + fuerza 2×/semana (sentadilla, plancha, remo). 35-55: caminar 30 min × 5 + fuerza + elongar. 55+: caminar 20-30 min + equilibrio (1 pie con apoyo, tai chi) + levantarse de silla. Dolor >2 semanas o caída: kine/CESFAM, no aguante. 💪 Entrenamientos del calendario.' },
    { n: 'Comida que sostiene el ciclo', ico: '🥘', txt: 'Base Penco en todo septenio: legumbres 2-3 veces/semana, huevo, jurel/pollo, arroz/avena/papa + verdura de feria. Niños y estirón: proteína + leche si hay. 35+: menos sal/azúcar, más fibra y proteína. 60+: proteína diaria + 6-8 vasos de agua aunque no dé sed. Usa 🥗 Comidas para planificar.' },
    { n: 'Chequeos por septenio', ico: '🩺', txt: '7-14: visión, dientes, vacunas. 14-21: salud sexual (matrona confidencial), dental, visión. 21-35: presión, peso, dental/visión anual; PAP cada 3 años (25-64). 35-55: EMPA gratis en CESFAM (presión, glicemia, colesterol) + mamografía (50-74) + próstata (50+, 45 con familia) + colon 45+. 55+: EMPA + crónicos + vista/oído/dental/pies anual.' },
    { n: 'Salud sexual y fertilidad por edad', ico: '💛', txt: '14-21: consentimiento + preservativo + consejería (ver 🌱 Adolescencia). 21-35: planificar con datos (🤰 Fertilidad + 🌸 Ciclo): buscar o evitar con matrona. 35-49: perimenopausia y andropausia se acompañan (ver 🔥 Climaterio). 49+: deseo cambia, no se acaba: lubricación, tiempo y palabra.' },
    { n: 'Tóxicos y remedios a cada edad', ico: '🚭', txt: '14-28: el riesgo es accidente, pelea y deuda: nunca manejar ni subirte con quien tomó, plan de vuelta antes de salir. 28+: alcohol poco o nada, tabaco cero (CESFAM ayuda: SENDA 1412). 50+: revisa remedios 1×/año (interacciones) + pastillero + lista a la vista. Vacunas: influenza anual + COVID según campaña.' }
  ],
  menteIntro: 'Cada septenio trae su pregunta y su nudo. <b>Nombrar + pedir + acordar</b>: esa es la herramienta.',
  mente: [
    { n: 'Nudos: 19, 28-30, 37, 58-60', ico: '🪢', txt: 'Alrededor de esas edades casi todos sienten tirón: cambio de casa, pega, pareja o sentido. No decidas grande en la semana más oscura: escribe 10 días, conversa con 2 personas que ya pasaron el tramo y decide en calma. Si hay ideas de daño: *4141 hoy mismo. La crisis pasa; la decisión apurada queda.' },
    { n: 'Vocación: el hilo rojo', ico: '🧭', txt: 'Pregunta de todo septenio: ¿qué hago bien, qué me gusta y qué sirve en Bío-Bío? 14-21: prueba barato (talleres, oficios, voluntariado). 21-35: elige y profundiza (SENCE, CFT, oficio). 35-49: afina (enseña lo que sabes). 49+: hereda (forma a otro). 1 curso u oficio por año mantiene vivo el hilo. Ver 🎓 Oficios del calendario.' },
    { n: 'Vínculos según septenio', ico: '🤝', txt: '0-14: padres y profes sostienen. 14-28: pares y primer amor enseñan límites (consentimiento siempre). 28-49: pareja e hijos piden renegociar plata y tareas cada luna. 49+: amistad y comunidad sostienen más que la familia ideal. Gritos, control o miedo nunca son "etapa": son violencia (1455 / 149).' },
    { n: 'Ánimo y niebla por edad', ico: '🌧️', txt: '14-21: comparación feroz: limpia redes 1×/luna. 21-42: burnout (cansancio que no se va durmiendo 2+ semanas): quita 1 tarea, pon 1 límite, suma 1 recuperación diaria. 42+: niebla y llanto fácil pueden ser hormonales y vitales: registra 2 lunas y consulta. Tristeza 2+ semanas casi a diario: CESFAM / *4141.' },
    { n: 'Pedir ayuda a tiempo', ico: '🫂', txt: 'Cada septenio tiene su adulto: matrona, profe, mentor de oficio, psicólogo CESFAM, grupo de pares, SENAMA 800 400 035 en vejez. Pedir hora cuesta 10 minutos; no pedirla cuesta meses. Vecinos: si ven a un niño o mayor solo o descuidado, avisen (CESFAM/Municipalidad).' }
  ],
  pracIntro: 'Tu biografía en 1 tarde: <b>calcula, ubica, elige 1 tarea y ritualiza cada 7</b>.',
  prac: [
    { n: 'Calcula tu septenio hoy', ico: '🔢', txt: 'Divide tu edad por 7 y redondea hacia arriba: 0-7 = 1°, 7-14 = 2°, 14-21 = 3°, 21-28 = 4°, 28-35 = 5°, 35-42 = 6°, 42-49 = 7°, 49-56 = 8°, 56-63 = 9°, 63-70 = 10°, 70+ = 11°. Ej: 34 años = 5° septenio (28-35). Anota: estoy en el año X de mi septenio (ej: 34 = año 7 del 5°: año de cierre y balance).' },
    { n: 'Lee tu tríada (anterior + actual + siguiente)', ico: '📖', txt: 'Lee arriba tu septenio actual completo + el anterior (qué debí cerrar) + el siguiente (qué se anuncia). Preguntas: ¿qué del anterior me quedó pendiente? ¿qué de este me cuesta? ¿qué del siguiente me ilusiona? Escríbelo en 📓 Mi espacio en 5 líneas.' },
    { n: 'Biografía en 1 página', ico: '📓', txt: 'Dibuja línea de 0 a tu edad, marca cada 7 y anota 1 hito + 1 aprendizaje por septenio (casa, escuela, pega, amor, pérdida, logro). Verás tu hilo rojo en 20 minutos. Guarda foto en tu diario. Para profundizar: 🔁 Recapitulación + 🌳 Árbol + 🗣️ Voz de los Abuelos del calendario.' },
    { n: 'Ritual de cada 7 cumpleaños', ico: '🎂', txt: 'A los 7, 14, 21, 28, 35, 42, 49, 56, 63, 70: celebra distinto (no solo carrete). Propuesta Penco: caminata al amanecer + carta (qué suelto, qué agradezco, qué pido) + comida con tus 5 personas + 1 compromiso público chico. Los años intermedios: revisión de 30 min cada luna de tu cumpleaños.' },
    { n: 'Plan del septenio (1 página)', ico: '🎯', txt: 'Elige 1 meta de cuerpo + 1 de alma + 1 de mundo para tu septenio actual. Ej (28-35): "fuerza 2×/semana + fondo 3 meses + curso oficio". Parte en chico: 1 paso por luna en 📓 Mi espacio (máx 3 metas). Lo chico cumplido 7 años te cambia la biografía.' },
    { n: 'Puentes a tu etapa fina', ico: '🌉', txt: 'Septenios es el mapa; las etapas son el territorio fino: ve a 🌅 Juventud (20-39), 🏠 Adultez (35-59), 🔥 Climaterio (45-64) o 🦉 Vejez (60+) según tu edad para cuerpo, mente y papeles detallados. Abajo tienes los botones directos.' }
  ],
  espacioExtra: 'sentido',
  espacioExtraLabel: 'Sentido de mi ciclo actual (1-10)',
  bridges: [['sepGoJuventud', 'btnJuventud'], ['sepGoAdultez', 'btnAdultez'], ['sepGoClimaterio', 'btnClimaterio'], ['sepGoVejez', 'btnVejez'], ['sepGoDuelo', 'btnDueloFull'], ['sepGoGrat', 'btnGratitud']],
  bridgesLabel: '🔗 Sigue en tu calendario',
  bridgesTxt: 'Del mapa al territorio: baja a tu etapa detallada.'
},
/* ============ 6) CAMINO LAKOTA (femenino 7 + masculino 7) ============ */
{
  key: 'lak', btn: 'btnLakota', btnTxt: '🙏 Camino Lakota',
  dlg: 'lakotaDialog', title: '🙏💗🌎 Camino Iniciatico de la Nacion Lakota',
  sub: 'El mito sioux de la <b>Mujer Bufalo Blanco</b> describe las siete etapas que sigue la mujer en su camino hacia la autorrealizacion. Su origen es conocido como <b>EL CAMINO DE LA BELLEZA</b>: un ritual sagrado que dura toda la vida. Aqui estan la version <b>femenina (7 caminos)</b> y la <b>masculina (7 etapas)</b>, complementarias e igualmente sagradas. Todo <b>privado y local</b>. <b>Educativo: no reemplaza guia espiritual, medico, matrona ni terapia.</b>',
  kw: 'lakota sioux mujer bufalo blanco camino belleza hija mujer madre recogedora ritualista maestra sabia hokshila koskalaka hanbleceya wicasa wakan tiospaye vision guerrero proveedor anciano legado virtudes complementariedad',
  p: 'lak', tabNames: ['Guia', 'Fem', 'Masc', 'Prac', 'Espacio'],
  tabLabels: ['🧽 Guia', '💗 Camino Femenino (7)', '🦅 Camino Masculino (7)', '🤝 Integracion', '📓 Mi espacio'],
  guiaTitulo: '🙏 El Camino de la Belleza: ritual de toda la vida',
  intro: 'Un mito sioux, el de la <b>Mujer Bufalo Blanco</b>, describe las <b>siete etapas que sigue la mujer en su camino hacia la autorrealizacion</b>. El origen del mito Lakota es conocido como <b>EL CAMINO DE LA BELLEZA</b> y es un ritual sagrado que dura toda la vida. No hay que quemar etapas: hay que vivir con entrega y aceptacion cada experiencia, sea aparentemente buena o mala, porque es lo que nos toca vivir. A menudo las grandes ensenanzas estan en las pequenas dificultades diarias.',
  fases: [
    { n: 'El mito de la Mujer Bufalo Blanco', ico: '🙏', q: 'La Mujer Bufalo Blanco trae la pipa sagrada y las siete ensenanzas: el camino femenino hacia la totalidad. Cada prueba o dificultad superada es un paso mas en el viaje hacia la totalidad.',
      cuerpo: 'Origen oral Lakota: las versiones escritas modernas resumen la tradicion; honra la fuente y evita usar ceremonias sin guia nativa.',
      mente: 'Lee primero el camino completo (femenino y masculino) y luego trabaja solo 1 camino por luna.',
      tip: '🌙 Principio: el poder espiritual es para servir, no para dominar.' },
    { n: 'El Camino de la Belleza', ico: '🌎', q: 'Belleza aqui significa equilibrio y armonia con todo lo existente: humildad, orden, respeto, dignidad y cuidado de toda criatura. El equilibrio que caracteriza al universo se vuelve parte profunda de quien camina.',
      cuerpo: 'Equilibrio entre realidad interna y externa: esa es la base del ritual sagrado.',
      mente: 'Sentido del humor incluido: la sabia y el anciano rien; la rigidez es senal de ego.',
      tip: '🌙 Pregunta guia: lo que vivo hoy, me acerca o me aleja del equilibrio?' },
    { n: 'Las dos vias son complementarias', ico: '🤝', q: 'El camino de la mujer se arraiga en crear, nutrir y transformar la vida desde su interior; el del hombre en proteger, proveer y buscar la vision para devolverla a la comunidad. Al final convergen: vivir en armonia (Wochekiye).',
      cuerpo: 'Femenino: poder de dar vida y sostenerla. Masculino: poder de cuidar el circulo y traer vision.',
      mente: 'Ninguno vale mas: sin cuidado no hay vida que sostener; sin vida no hay circulo que cuidar.',
      tip: '🌙 En pareja o familia: preguntense en que camino esta cada uno y que necesita.' },
    { n: 'Como caminar esta seccion (1 paso por luna)', ico: '🗺', q: 'No es un curso rapido: es un mapa de toda la vida. Ubica tu camino actual, lee su tarjeta completa, elige 1 practica chica y registrala en Mi espacio.',
      cuerpo: 'Mujeres: atencion especial a madre y recogedora, las etapas mas exigentes del ego.',
      mente: 'Hombres: atencion especial a vision (Hanbleceya) y a servicio sin ego (Wicasa Wakan).',
      tip: '🌙 Relee cada luna: en 3 lunas veras tu patron.' }
  ],
  mitos: '&bull; "Lo espiritual se logra rapido" &rarr; es un ritual de toda la vida: apurar quema etapas.<br>&bull; "Hay que saltarse la maternidad o el sacrificio" &rarr; madre y recogedora son las pruebas mas dificiles y las que mas ensenan.<br>&bull; "El poder espiritual es para mandar" &rarr; es para servir sin danarse ni danar: sin equilibrio puede ser un desastre para la comunidad.<br>&bull; "Femenino y masculino compiten" &rarr; son complementarios e igualmente sagrados.',
  uso: '1) Lee la <b>Guia</b> una vez.<br>2) Ubica tu camino actual en <b>Femenino o Masculino</b> y lee su tarjeta completa.<br>3) Elige <b>1 practica</b> en <b>Integracion</b>.<br>4) Registra en <b>Mi espacio</b> (animo, energia, conexion con tu camino + diario).<br>5) Relee cada luna: el avance se ve en meses, no en dias.',
  familia: 'Para familias y parejas: cada integrante esta en un camino distinto. No exijan a la hija lo de la maestra, ni al joven lo del anciano. Acompanar es preguntar "que te toca vivir y que necesitas", repartir cuidados y sostener sin rescatar siempre. Si hay gritos, control, miedo o maltrato, eso no es "etapa": es violencia (149 / 1455 / 133).',
  cuerpoTitulo: '💗 Camino Femenino: los 7 caminos de la Mujer Bufalo Blanco',
  cuerpoIntro: 'Los siete caminos proporcionan a la mujer la fuerza, la disciplina y la profunda conexion que necesita para canalizar el poder espiritual sin causar dano a si misma ni a los demas. Le ayudan a desarrollar humildad, orden, respeto, dignidad y el sentido de cuidar a toda criatura. El camino de la madre y el de la recogedora son las etapas mas dificiles: sacrificio del ego y aprendizaje del amor no egoista.',
  cuerpo: [
    { n: '1. El Camino de la Hija', ico: '👧', txt: 'Desde el nacimiento hasta la aparicion de la primera regla. Todavia es una nina, fisica y psiquicamente dependiente, mentalmente receptiva, que absorbe todo tipo de ensenanza, ejemplo o estimulo que se le presenta. Si todas estas influencias exteriores son apropiadas, estructuradas y emocionalmente equilibradas, la nina desarrollara el equilibrio, respeto, dignidad y autoconfianza que luego necesitara como recursos para llevar una vida en armonia con todo lo existente.' },
    { n: '2. El Camino de la Mujer', ico: '🌺', txt: 'Abarca los anos en que la mujer desarrolla la autoconfianza, aprendiendo a controlar su vida independiente de los adultos. Aprende a traves de la experiencia personal, desarrolla sus propias respuestas emocionales y mentales y elige sus relaciones. Empieza a explorar su sexualidad y a construir su espiritualidad. Son los anos en los que empieza a conocerse y, poco a poco, llega a ser una persona responsable y madura (en nuestra sociedad actual este periodo va desde la adolescencia hasta los 28-32 anos).' },
    { n: '3. El Camino de la Madre', ico: '🤱', txt: 'Desde el punto de vista espiritual, el nacimiento de un hijo es el evento mas importante de la vida de una mujer; ya que entonces entra a formar parte de la comunidad espiritual femenina. Al cruzar la frontera entre la vida y la muerte con el parto es recibida en la comunidad de las matronas, donde inicia la verdadera ensenanza. Aprende la disciplina del sacrificio: cuerpo, tiempo, psique, conocimiento, vida social, condicion economica, relaciones y valores son puestos al servicio de los ninos. Este pasaje, ambivalente como ningun otro, la empuja a superar todos los limites que tenia previstos. Aprende a relacionarse en armonia con su mundo, armonizando sus necesidades individuales con las demandas externas; alcanza asi el poderoso equilibrio entre realidad interna y externa sobre el cual se basa este ritual sagrado. En el camino de la madre, la vida espiritual de la mujer pone sus raices y florece: en muchas culturas antiguas el dar a luz simbolizaba una iniciacion.' },
    { n: '4. El Camino de la Recogedora', ico: '🌿', txt: 'Recoger es una disciplina que requiere respeto antes que nada; desarrolla poderes especiales de observacion y discernimiento en el conocimiento de las estaciones, del clima, de la astronomia y de la curacion. Armada unicamente de conocimiento, de intuicion y de oraciones, la mujer recolecta gran cantidad de plantas y de sustancias minerales para la cocina, la magia, la higiene y la cosmetica. La recogedora tiene que conocer perfectamente donde y cuando encontrar lo que necesita, la forma mas adecuada de conservar, almacenar, preparar las sustancias y utilizarlas en condiciones que resulten eficaces e inocuas.' },
    { n: '5. El Camino de la Ritualista', ico: '🔥', txt: 'Una Mujer Medicina nativa nunca aplica el mismo remedio al mismo sintoma fisico en distintos pacientes, ya que trata al ser en su totalidad. Para ella hacer medicina es conocer al paciente, a su familia, su condicion espiritual, mental, fisica, ambiental y social, y como combinar todo esto en el proceso de curacion. Es muy consciente del espiritu que hay tras la planta, roca o cristal usados en el tratamiento, a los cuales hay que dar las gracias por la ayuda. Esta parte del trabajo se caracteriza por la tension espiritual, aunque no tan intensa como su primer parto, sus primeras reglas o su responsabilidad de mujer joven de aprender a respetar a los demas (humanos e inhumanos) y a si misma. Sin equilibrio, responsabilidad y consciencia puede suponer un desastre para la comunidad, porque el poder de la mujer es grande, y cuanto mas desarrolle la disciplina y la devocion, mas aumentara su poder. Quien sigue este camino ha de ser interiormente segura, estar profundamente preocupada por la vida espiritual del planeta y ser capaz de sacrificar su trabajo y su ego por el bien de la comunidad.' },
    { n: '6. El Camino de la Maestra', ico: '🌕', txt: 'Aprendiendo, experimentando, alimentando y trabajando la mujer alcanza la edad en la cual se vuelve transmisora de sabiduria espiritual y social. Es compartiendo con los demas las tecnicas, las teorias y las experiencias que ha vivido como llega a ser una maestra. Entra en la menopausia tan profunda y madura como la fruta, como la flora. Si ha seguido los caminos con armonia entrara en el reino de lo sagrado como miembro de la comunidad cosmica, derecho ganado a traves de su trabajo, sacrificio y devocion. Puede elegir su campo: educacion, servicio publico o cualquier profesion, practicada de forma sana y espiritual; o ser abuela, con nietos, bisnietos u otros ninos ayudandoles a crecer. Gran parte de su ensenanza se transmite con el ejemplo; su presencia y esencia revitalizan y enriquecen la vida de su comunidad entera.' },
    { n: '7. El Camino de la Sabia', ico: '🌟', txt: 'Alcanzada la vejez, la chamana entra en el periodo de la maestria, habiendo desarrollado una verdadera sabiduria. El sentido del equilibrio que caracteriza al universo es ahora parte profunda de ella, asi como el sentido del humor. Esta en contacto directo con hechos naturales y sobrenaturales, siendo capaz de aceptar sus directrices. Su trabajo ha trascendido su ser personal y privado, su familia; su comunidad se extiende ahora hacia las estrellas. Es un ser sagrado: es completa. Los siete caminos le dan fuerza, disciplina y conexion para canalizar el poder sin dano, con humildad, orden, respeto, dignidad y cuidado de toda criatura, y una profunda comprension de si misma en lo interior y lo exterior.' }
  ],
  menteTitulo: '🦅 Camino Masculino: las 7 etapas hacia el Wicasa Wakan',
  menteIntro: 'No existe un unico texto espejo tan popularizado como el de los 7 caminos de la mujer, pero las ensenanzas orales Lakota describen el ciclo del hombre a traves de responsabilidad, ritos de paso y evolucion espiritual, para convertirlo en un Wicasa Wasaka (Hombre Fuerte) y, eventualmente, en un Wicasa Wakan (Hombre Santo).',
  mente: [
    { n: '1. El Camino del Nino (Hokshila)', ico: '👦', txt: 'Desde el nacimiento hasta la pubertad. El nino es moldeado por los hombres de la tribu (padres, abuelos, tios). Aprende humildad, obediencia, respeto por todos los seres vivos y las habilidades basicas de supervivencia, caza y observacion. Su mente es receptiva y se le ensena que la verdadera fuerza no es la agresividad, sino el autocontrol y la capacidad de escuchar.' },
    { n: '2. El Camino del Joven (Koskalaka)', ico: '🦅', txt: 'Adolescencia y transicion: el joven debe encontrar su proposito. El rito fundamental es la Busqueda de Vision (Hanbleceya): ayuna y ora en soledad en un lugar elevado, desprendiendose de las comodidades fisicas para recibir una vision que le otorgue proposito de vida, nombre espiritual y conexion con sus guardianes. Deja de ser nino y empieza a forjar su identidad espiritual.' },
    { n: '3. El Camino del Guerrero y Proveedor (Wicasa)', ico: '🛡', txt: 'Adultez joven y madura. Asume proteger y sustentar a su Tiospaye (familia y comunidad extendida). Aqui se forja el Wicasa Wasaka (Hombre de Caracter). Su valia no se mide solo por su habilidad fisica en la caza o la defensa, sino por su generosidad (Wacantognaka), su valentia moral y su disposicion a sacrificarse por el bien comun antes que por su propio ego.' },
    { n: '4. El Camino del Lider y Consejero (Wicasa Tanka)', ico: '🏔', txt: 'Madurez consolidada. Probado su valor y ganado su lugar, se vuelve pilar de referencia. Su autoridad no se impone por la fuerza ni el titulo: se gana con ejemplo, justicia, calma y capacidad de mediar conflictos. Guia a los jovenes con experiencia practica y equilibrio emocional.' },
    { n: '5. El Camino del Anciano (Wicahcala)', ico: '👴', txt: 'Vejez respetada. Deja la accion fisica intensa para volverse guardian de la historia oral, las canciones sagradas y las ensenanzas ancestrales. Su presencia aporta calma y su palabra tiene peso espiritual profundo. Es el abuelo que nutre con sabiduria, paciencia y humor a las nuevas generaciones, ensenando con el ejemplo de una vida bien vivida.' },
    { n: '6. El Camino del Hombre Santo (Wicasa Wakan)', ico: '🔥', txt: 'El chaman o Hombre Medicina. Aunque el llamado puede llegar en cualquier momento, suele consolidarse aqui. Ha trascendido lo personal para servir de puente entre el mundo fisico y el espiritual (Wakan Tanka). Dedica su vida a sanar, interpretar visiones y dirigir ceremonias (Inipi, Danza del Sol) para mantener el equilibrio del mundo. Su poder es inmenso: debe estar libre de ego y entregado al servicio.' },
    { n: '7. El Camino de la Trascendencia (El Legado)', ico: '🌌', txt: 'Completud del ciclo. Ha integrado las Siete Virtudes Sagradas: Sabiduria, Respeto, Amor, Humildad, Honestidad, Verdad y Valentia. Su vida es una ofrenda viva: comprende que sus acciones impactaran a las siete generaciones futuras. Su espiritu se prepara para volver al Gran Misterio en armonia, sin deudas con la comunidad ni con la tierra.' }
  ],
  pracTitulo: '🧰 Integracion: complementariedad y practica de una luna',
  pracIntro: 'Femenino y masculino convergen en lo mismo: vivir en armonia (Wochekiye), sirviendo a la totalidad. Aqui lo bajas a tierra en 1 practica por luna.',
  prac: [
    { n: 'La complementariedad de los caminos', ico: '🤝', txt: 'Ambos caminos son complementarios e igualmente sagrados. El de la mujer se arraiga en crear, nutrir y transformar la vida desde su interior; el del hombre en proteger, proveer y buscar la vision para devolverla a la comunidad. Quien completa su camino converge en el mismo objetivo: armonia, habiendo aprendido que el verdadero poder espiritual no es para dominar, sino para servir.' },
    { n: 'Las 7 virtudes (medicion semanal)', ico: '🌟', txt: 'Sabiduria, Respeto, Amor, Humildad, Honestidad, Verdad y Valentia. Elige 1 por semana y practica 1 acto concreto (ej: Humildad: pedir consejo; Verdad: decir lo incomodo con respeto; Valentia: pedir hora medica pendiente). Marca en Mi espacio cual practicaste.' },
    { n: 'Las 7 generaciones (decision larga)', ico: '🌱', txt: 'Pregunta antes de decidir en grande: esto ayuda a mis hijos, nietos y a la tierra en 7 generaciones? Sirve para plata, casa, trabajo y conflictos. Lo rapido que dana el futuro sale caro: elige lo que nutre aunque cueste hoy.' },
    { n: 'No quemar etapas (tu camino actual)', ico: '👣', txt: 'Ubicate: hija, mujer, madre, recogedora/ritualista, maestra, sabia; nino, joven, guerrero, lider, anciano, santo, legado. Lee solo tu camino + el anterior + el siguiente. Pregunta: que del anterior me falta cerrar? que de este me cuesta? que del siguiente me ilusiona? Escribelo en 5 lineas en Mi espacio.' },
    { n: 'Ley del dar antes de recoger', ico: '🌾', txt: 'La aspirante a chamana da y da mucho tiempo antes de recoger, aunque solo sea poco, y todo lo que obtiene de su esfuerzo lo usa en alimentar y fomentar la vida. Practica: 1 servicio semanal sin vitrina (cuidar, cocinar, ensenar, limpiar) + 1 ofrenda de gratitud (oracion, tabaco simbolico, silencio, cuidado del agua). Da primero; el poder llega solo.' },
    { n: 'Honrar la fuente (respeto cultural)', ico: '🙏', txt: 'Tradicion oral Lakota viva: este resumen educativo no reemplaza a sus portadores. Honra sin apropiarte: no dirijas ceremonias (Inipi, Temazcal, Danza del Sol, busqueda de vision) sin guia autorizada, no uses objetos sagrados como decoracion, nombra la fuente (Nacion Lakota, Mujer Bufalo Blanco) y, si puedes, aprende de voces nativas y apoya sus causas. En Penco: aplica el espiritu (servir, cuidar el agua y el bosque, escuchar a los mayores) sin copiar formas ajenas.' }
  ],
  espacioExtra: 'camino',
  espacioExtraLabel: 'Conexion con mi camino hoy (1-10)',
  bridges: [['lakGoJuventud', 'btnJuventud'], ['lakGoAdultez', 'btnAdultez'], ['lakGoClimaterio', 'btnClimaterio'], ['lakGoVejez', 'btnVejez'], ['lakGoSeptenios', 'btnSeptenios'], ['lakGoGrat', 'btnGratitud']],
  bridgesLabel: '🔗 Sigue en tu calendario',
  bridgesTxt: 'Tu camino se sostiene con etapas, ciclo y gratitud: baja a tu etapa detallada.'
},
/* ============ 7) CICLO DEL KIMUN (mapuche-lafkenche, 5 etapas) ============ */
{
  key: 'map', btn: 'btnKimun', btnTxt: '🌿 Ciclo Kimün',
  dlg: 'kimunDialog', title: '🌿🌊 EL CICLO DEL KIMÜN: Las Etapas de la Vida Mapuche-Lafkenche',
  sub: 'En el territorio de Penco, donde la tierra (<b>Mapu</b>) se encuentra con el mar (<b>Lafken</b>), la vida humana es un reflejo de los ciclos de la naturaleza. El <b>Kimün</b> (sabiduría ancestral) enseña que cada persona nace con un <b>Newen</b> (fuerza vital) único, que se transforma, madura y se entrega a la comunidad. Todo <b>privado y local</b>. <b>Educativo: no reemplaza guía espiritual, médico, matrona ni terapia.</b>',
  kw: 'kimun mapuche lafkenche mapu lafken newen püñiñ chuchu weche wentru domo fucha kude püllü kimche lonko lof epew mapudungun ngenechen nor feleal wacantognaka penco bío-bío etapas vida ancestralidad',
  p: 'kim', tabNames: ['Guia', 'Ciclo', 'Vida', 'Prac', 'Espacio'],
  tabLabels: ['🧭 Guía', '🌿 El Ciclo (5 etapas)', '🌊 Vida en el Lafken', '🤝 Práctica', '📓 Mi espacio'],
  guiaTitulo: '🌊 Mapu y Lafken: la vida como reflejo de la naturaleza',
  intro: 'En el territorio de Penco, donde la tierra (<b>Mapu</b>) se encuentra con el mar (<b>Lafken</b>), la vida humana es un reflejo de los ciclos de la naturaleza. El <b>Kimün</b> (sabiduría ancestral) nos enseña que cada persona nace con un <b>Newen</b> (fuerza vital) único, y que a lo largo de la vida, este Newen se transforma, madura y se entrega a la comunidad. No hay prisa, pues cada luna y cada marea trae el momento justo para cada paso.',
  fases: [
    { n: 'El territorio: Mapu se encuentra con Lafken', ico: '🌊', q: 'Penco es borde: tierra y mar se tocan. Aquí la vida se lee en dos lenguajes a la vez: lo que pasa en la tierra (siembra, brote, tronco, raíz) y lo que pasa en el mar (mareas, lunas, corrientes). Quien aprende a mirar ambos, aprende a leer su propio momento.',
      cuerpo: 'Tierra: semilla, brote, tronco firme, raíz profunda. Mar: cada luna y cada marea trae el momento justo.',
      mente: 'Pregunta guía: ¿en qué orilla estoy hoy, en la de sembrar o en la de recoger?',
      tip: '🌙 Mira una marea esta luna: anota cómo estaba tu ánimo con mar lleno y con mar bajo.' },
    { n: 'Kimün y Newen: sabiduría y fuerza única', ico: '🔥', q: 'Kimün es la sabiduría ancestral que se hereda escuchando y practicando. Newen es tu fuerza vital única: nadie la tiene igual. A lo largo de la vida tu Newen se transforma (brote, flor, tronco, raíz) y al final se entrega: lo que aprendiste queda en la comunidad como Püllü.',
      cuerpo: 'Tu tarea no es copiar a otro: es madurar tu propio Newen y ponerlo al servicio.',
      mente: 'Compararse quema Newen: cada semilla tiene su luna para brotar.',
      tip: '🌙 Nombra tu Newen en una palabra (ej: calma, risa, manos, escucha) y úsala una vez esta luna.' },
    { n: 'Las 5 etapas de un vistazo', ico: '🌿', q: 'Püñiñ/Chuchu (semilla y brote: ser amado y observar) → Weche (florecimiento: aprender oficios y forjar carácter) → Wentru/Domó (tronco firme: sostener hogar y Lof) → Fucha/Kude (raíz profunda: guardar memoria y aconsejar) → Püllü (retorno: cuidar desde la memoria).',
      cuerpo: 'Lee tu etapa completa en la pestaña El Ciclo y las vecinas (anterior + siguiente).',
      mente: 'Cada etapa tiene su tarea; apurar es como arrancar un brote: lo mata.',
      tip: '🌙 Ubícate hoy: ¿semilla, flor, tronco, raíz o memoria que cuida?' },
    { n: 'Cómo caminar esta sección (1 paso por luna)', ico: '🗺️', q: 'No es un curso: es un mapa de toda la vida. Ubica tu etapa, lee su tarjeta, elige 1 práctica chica de la pestaña Práctica y regístrala en Mi espacio. Relee cada luna: el avance se ve en meses.',
      cuerpo: 'Jóvenes (Weche): oficio + idioma + trabajo comunitario. Adultos: sostener sin quemarse.',
      mente: 'Mayores (Fucha/Kude): contar historia + aconsejar. Duelo: el Püllü acompaña (ver 🕊️ Duelo).',
      tip: '🌙 1 práctica por luna basta: lo chico cumplido sostiene lo grande.' }
  ],
  mitos: '• "La vejez es declive" → en el Kimün es la cúspide: el Fucha y la Kude son Kimche, lo más lúcido de la comunidad.<br>• "El niño debe producir pronto" → su única tarea es ser amado, protegido y observar: apurar quema el brote.<br>• "La muerte es el final" → es transformación: el Püllü sigue cuidando desde los sueños y las señales.<br>• "La mujer y el hombre compiten" → son pilares complementarios: jerarquía de responsabilidades compartidas, no de poder.',
  uso: '1) Lee la <b>Guía</b> una vez.<br>2) Ubica tu etapa en <b>El Ciclo</b> y lee su tarjeta completa.<br>3) Elige <b>1 práctica</b> en la pestaña <b>Práctica</b>.<br>4) Registra en <b>Mi espacio</b> (ánimo, energía, conexión con tu Newen + diario).<br>5) Relee cada luna: en 3 lunas verás tu patrón.',
  familia: 'Para familias: cada integrante vive una etapa distinta (semilla, flor, tronco, raíz). Al brote se le protege, a la flor se le enseña oficio, al tronco se le reparte la carga, a la raíz se le escucha. Pregunten en casa: "¿en qué etapa estás y qué necesitas?" Si hay gritos, control, miedo o maltrato, eso no es "etapa": es violencia (149 / 1455 / 133).',
  cuerpoTitulo: '🌿 El Ciclo: las 5 etapas de la vida',
  cuerpoIntro: 'Cada persona nace con un Newen único que se transforma, madura y se entrega a la comunidad. Estas son las 5 etapas: léelas todas una vez y luego trabaja solo la tuya.',
  cuerpo: [
    { n: '1. Püñiñ / Chuchu: La Semilla y el Brote (La Infancia)', ico: '🌱', txt: 'Desde el nacimiento hasta la primera infancia. El niño o niña es considerado un regalo de Ngenechen (la fuerza creadora). En esta etapa, su única tarea es ser amado, protegido y observar. Aprende escuchando los sonidos del viento, el mar y las voces de los mayores. Se le enseña el respeto (Nor feleal) por todos los seres vivos, comprendiendo que no es dueño de la naturaleza, sino parte de ella.' },
    { n: '2. Weche: El Florecimiento (La Juventud)', ico: '🌸', txt: 'La adolescencia y la juventud. Es el tiempo en que el Newen físico se despierta con fuerza. El Weche Wentru (joven hombre) y la Weche Domó (joven mujer) comienzan a aprender los oficios, la pesca, la recolección, el idioma (Mapudungun) y las historias (Epew). Es una etapa de aprendizaje activo, donde se forja el carácter a través del trabajo comunitario y se comienza a escuchar el llamado del propio espíritu.' },
    { n: '3. Wentru / Domó: El Tronco Firme (La Adultez)', ico: '🌳', txt: 'La plenitud de la vida. El hombre y la mujer asumen su rol complementario como pilares de la comunidad. No hay jerarquía de poder, sino de responsabilidades compartidas. Construyen el hogar, crían a los hijos, trabajan la tierra o el mar, y participan activamente en las decisiones del Lof. Es la etapa de la máxima entrega: su fuerza se pone al servicio del bienestar colectivo, practicando la generosidad (Wacantognaka) y la justicia.' },
    { n: '4. Fucha / Kude: La Raíz Profunda (La Ancianidad)', ico: '🌾', txt: 'La vejez no es un declive, sino la cúspide del Kimün. El Fucha (anciano) y la Kude (anciana) se convierten en Kimche (personas sabias). Sus cuerpos pueden cansarse, pero su espíritu y su memoria están más lúcidos que nunca. Son los guardianes de la historia oral, los consejeros del Lonko (líder) y quienes interpretan las señales de las 13 lunas, el clima y las mareas. Su palabra es semilla; su presencia, un refugio de calma y orientación para las generaciones más jóvenes.' },
    { n: '5. Püllü: El Retorno a la Memoria (La Ancestralidad)', ico: '✨', txt: 'El paso al mundo espiritual no es un final, sino una transformación. Al dejar el cuerpo físico, la persona se convierte en Püllü (espíritu ancestral). Desde allí, continúa cuidando a su familia y a su territorio, manifestándose en los sueños, en el canto de los pájaros o en la brisa marina. El ciclo se cierra para volver a comenzar, recordándonos que somos polvo de estrellas y sal del mar, eternos en la memoria de la tierra.' }
  ],
  menteTitulo: '🌊 Vida en el Lafken: lo que sostiene el ciclo',
  menteIntro: 'El ciclo no se camina solo: lo sostienen el respeto, los oficios, la lengua, el Lof y la lectura de la naturaleza. Estas son sus raíces.',
  mente: [
    { n: 'Tu Newen: único y en transformación', ico: '🔥', txt: 'Naces con un Newen que nadie más tiene. De niño es brote (observar), de joven es flor (aprender haciendo), de adulto es tronco (sostener), de mayor es raíz (aconsejar) y después es memoria que cuida (Püllü). Si hoy te sientes débil, quizá estás cambiando de forma, no perdiendo fuerza: el tronco también fue brote.' },
    { n: 'Nor feleal: respeto por todo ser vivo', ico: '🤲', txt: 'No eres dueño de la naturaleza: eres parte de ella. El respeto (Nor feleal) se practica pidiendo permiso (al agua, al bosque, a la persona), tomando solo lo necesario y devolviendo (limpiar, sembrar, cuidar). En Penco: no dejes basura en playa ni bosque, cuida el agua, saluda a los mayores. Lo que dañas afuera, lo dañas adentro.' },
    { n: 'Oficios, pesca y recolección', ico: '🎣', txt: 'El Weche aprende haciendo: pesca, recolección, huerta, cocina, tejido, construcción, cuidado. Elige 1 oficio y practícalo 1 vez por luna con alguien que sepa (abuelo, vecina, taller). El carácter se forja en el trabajo comunitario: minga, ayuda al vecino, turno compartido. Ver 🎣 Pesca, 🌱 Huerta y 🧰 Oficios del calendario.' },
    { n: 'Mapudungun y Epew: lengua e historias', ico: '🗣️', txt: 'La lengua guarda el Kimün: aprende 1 palabra por semana (mapu, lafken, küyen/luna, ko/agua, newen, kimün) y úsala en casa. Los Epew (historias) enseñan sin sermón: pide 1 historia a un mayor por luna y grá-bala si te deja (🗣️ Voz de los Abuelos). Contar es cuidar: lo que no se cuenta, se pierde.' },
    { n: 'El Lof: decidir juntos', ico: '🤝', txt: 'El Lof es la comunidad que decide junta: nadie manda solo. En casa y barrio aplica lo mismo: reunión corta, todos hablan, se acuerda y se cumple. Adultos (tronco): participar en decisiones, repartir cargas por escrito, practicar generosidad y justicia. Liderar es servir, como el Lonko aconsejado por los Kimche.' },
    { n: 'Lunas, clima, mareas y sueños', ico: '🌙', txt: 'Los mayores leen señales: las 13 lunas, el clima, las mareas y los sueños. Práctica simple: anota cada luna (llena/menguante) tu ánimo, tu sueño y 1 señal que viste (pájaro, viento, mar). En 3 lunas verás tu propio calendario. Si sueñas a quien partió y despiertas en paz, es Püllü que cuida: agradécelo. Duelo difícil o sueños que angustian semanas: 🕊️ Duelo y CESFAM acompañan.' }
  ],
  pracTitulo: '🧰 Práctica: tu paso de esta luna',
  pracIntro: 'El Kimün se aprende haciendo, no leyendo. Elige 1 práctica por luna y márcala en Mi espacio.',
  prac: [
    { n: 'Ubica tu etapa hoy', ico: '📍', txt: '¿Semilla (Püñiñ), flor (Weche), tronco (Wentru/Domó), raíz (Fucha/Kude) o memoria que cuida (Püllü)? Lee tu tarjeta + la anterior (qué debo cerrar) + la siguiente (qué se anuncia). Escríbelo en 5 líneas en Mi espacio: qué cierro, qué me cuesta, qué me ilusiona.' },
    { n: 'Una palabra en Mapudungun por semana', ico: '🗣️', txt: 'Semana 1: mapu (tierra), lafken (mar). Semana 2: küyen (luna), ko (agua). Semana 3: newen (fuerza), kimün (sabiduría). Semana 4: epew (historia), lof (comunidad). Úsalas en casa y enséñalas a un niño: quien enseña, aprende dos veces.' },
    { n: 'Un oficio, una minga', ico: '🧤', txt: 'Practica 1 oficio esta luna (pescar, sembrar, cocinar, tejer, arreglar) con alguien que sepa, y participa en 1 trabajo comunitario (minga, limpieza de playa, ayuda a un mayor). El Weche se forja sirviendo; el tronco se honra sosteniendo.' },
    { n: 'Escucha a una raíz', ico: '👂', txt: 'Visita o llama a un Fucha/Kude esta luna: 1 historia, 1 consejo, 1 receta. Pregunta por Penco antiguo, por las lunas, por su oficio. Graba su voz si acepta (🗣️ Voz de los Abuelos) o anota su historia en tu 🌳 Árbol. Su palabra es semilla: siémbrala contándola a otro.' },
    { n: 'Cuida Mapu y Lafken', ico: '🌊', txt: '1 acción concreta: recoger basura en playa/bosque, cuidar el agua (reparar fuga, juntar lluvia), sembrar nativo, no sacar más marisco o leña de lo permitido. Pide permiso y da las gracias: Nor feleal en acto. Si ves daño grande (contaminación, extracción ilegal): avisa a la Municipalidad/Capitanía.' },
    { n: 'Honrar la fuente (respeto cultural)', ico: '🙏', txt: 'El Kimün es sabiduría viva del pueblo Mapuche: este resumen educativo no reemplaza a sus portadores. Honra sin apropiarte: no dirijas ceremonias (Nguillatun, Machitún, Epew como rito) sin guía autorizada, no uses símbolos sagrados (Kultrun, Rewe) como decoración, nombra la fuente y aprende de voces mapuche. En Penco Lafkenche: aplica el espíritu (respeto, servicio, cuidado del agua y del borde costero) sin copiar formas ajenas.' }
  ],
  espacioExtra: 'newen',
  espacioExtraLabel: 'Conexión con mi Newen hoy (1-10)',
  bridges: [['kimGoJuventud', 'btnJuventud'], ['kimGoAdultez', 'btnAdultez'], ['kimGoVejez', 'btnVejez'], ['kimGoSeptenios', 'btnSeptenios'], ['kimGoLakota', 'btnLakota'], ['kimGoGrat', 'btnGratitud']],
  bridgesLabel: '🔗 Sigue en tu calendario',
  bridgesTxt: 'Tu ciclo se sostiene con etapas, memoria y gratitud: baja a tu etapa detallada.'
},
/* ============ 8) LOS 4 ASHRAMAS HINDUES ============ */
{
  key: 'hin', btn: 'btnAshramas', btnTxt: '🕉️ Ashramas Hindúes',
  dlg: 'ashramasDialog', title: '🕉️ La Cosmovisión Hindú: Los 4 Ashramas (Etapas del Alma)',
  sub: 'El hinduismo tradicional divide la vida en <b>cuatro etapas de 25 años</b>, cada una con un <b>Dharma (deber sagrado)</b>. Aprende, sostiene, suelta y trasciende. Todo <b>privado y local</b>. <b>Educativo: no reemplaza guía espiritual, médico ni terapia.</b>',
  kw: 'ashrama hindu india dharma brahmacharya grihastha vanaprastha sannyasa moksha vedas guru etapas alma deber',
  p: 'hin', tabNames: ['Guia', 'Cuerpo', 'Mente', 'Prac', 'Espacio'],
  tabLabels: ['🧭 Guía', '🕉️ Los 4 Ashramas', '🧠 Mente y Dharma', '🧰 Vida práctica', '📓 Mi espacio'],
  guiaTitulo: '🕉️ El Dharma: tu deber según tu etapa',
  intro: 'En la tradición hindú la vida humana (<b>100 años ideales</b>) se recorre en <b>4 ashramas</b> de ~25 años. Cada etapa tiene un <b>Dharma</b>: lo correcto para ese momento. Sufrimos cuando hacemos el deber de otra etapa (ej: querer retirarse a los 25 o acumular sin fin a los 70). Ubica tu ashrama y vive su tarea plena.',
  fases: [
    { n: 'Brahmacharya (0–25 · El Estudiante)', ico: '📚', q: 'Aprendizaje, disciplina, castidad y absorción de conocimientos de un maestro (Guru). El cuerpo y la mente se entrenan: estudio, celibato moderado, respeto y servicio al maestro. Lo que siembras aquí sostiene todo lo demás.',
      cuerpo: 'Rutina, sueño, estudio diario, deporte y moderación. Energía joven canalizada en aprender.',
      mente: 'Humildad del aprendiz: pregunta, escucha, practica. El ego de saberlo todo es el fracaso de esta etapa.',
      tip: '🌙 1 aprendizaje + 1 disciplina por luna (ej: curso SENCE + dormir a la misma hora).' },
    { n: 'Grihastha (25–50 · El Padre/Madre de Familia)', ico: '🏠', q: 'Vida en el mundo: matrimonio, crianza, trabajo, riqueza (Artha) y placer legítimo (Kama) al servicio del deber. Es el ashrama que sostiene a los otros tres: quien produce, alimenta, enseña y dona.',
      cuerpo: 'Chequeos, fuerza, sostener sin quemarse. Ganar bien y gastar con medida.',
      mente: 'Generosidad + límites: sostener a muchos sin perderse. Culpa se ordena repartiendo.',
      tip: '🌙 1 meta de plata + 1 de familia por luna. Ver 🏠 Adultez.' },
    { n: 'Vanaprastha (50–75 · El Retiro)', ico: '🌲', q: 'El que se va al bosque. Se delegan responsabilidades, se reduce el apego material y crece la reflexión, la meditación y el estudio espiritual. No es abandonar: es pasar de protagonista a consejero.',
      cuerpo: 'Climaterio acompañado, caminar, huesos y corazón. Menos carga, más descanso.',
      mente: 'Soltar poder y controlar menos. Enseñar lo aprendido: el legado empieza aquí.',
      tip: '🌙 1 cosa delegada + 1 práctica contemplativa por luna.' },
    { n: 'Sannyasa (75+ · La Renuncia)', ico: '🔥', q: 'Abandono de apegos mundanos para dedicar la vida a la liberación (Moksha) y la conexión con lo divino. Simplicidad total, bendecir y prepararse para trascender. Lo que perdonas y agradeces queda vivo en otros.',
      cuerpo: 'Confort, vínculo, autonomía por capas. Dolor siempre tratado, nunca aguantado.',
      mente: 'Paz y desapego amoroso: nada me posee, todo lo agradezco. Presencia más que palabras.',
      tip: '🌙 1 recuerdo grabado + 1 perdón por luna. Ver 🦉 Vejez.' }
  ],
  mitos: '• "Espiritual es solo meditar" → en Grihastha lo espiritual es trabajar honrado y cuidar a tu gente.<br>• "Retirarse es fracasar" → Vanaprastha es graduarse: delegar es sabiduría, no derrota.<br>• "Renuncia es abandonar a la familia" → es soltar el control, no el amor: se bendice más cuando se posee menos.<br>• "Hay que apurar etapas" → cada ashrama prepara al siguiente: saltarse Grihastha deja raíces débiles.',
  uso: '1) Lee la <b>Guía</b> y ubica tu ashrama por edad (0-25 / 25-50 / 50-75 / 75+).<br>2) Lee tu tarjeta en <b>Los 4 Ashramas</b> + la anterior y la siguiente.<br>3) Elige 1 práctica de <b>Dharma</b> en Mente.<br>4) Avanza 1 paso en <b>Vida práctica</b>.<br>5) Registra en <b>Mi espacio</b> cada luna.',
  familia: 'Para familias: cada integrante vive un ashrama distinto. Al joven se le exige estudiar, al adulto sostener, al mayor aconsejar y al anciano bendecir. No pidan renuncia al joven ni acumulación al anciano. Pregunten: ¿en qué ashrama estás y qué necesitas?',
  cuerpoTitulo: '🕉️ Los 4 Ashramas en detalle',
  cuerpoIntro: 'Cada ashrama pide un cuerpo distinto. La base es la misma: <b>dormir, moverse, comer real y chequearse</b>. Aquí el mapa hindú aplicado a Penco.',
  cuerpo: [
    { n: 'Brahmacharya: cuerpo del aprendiz', ico: '📚', txt: 'Dormir 7-9 h, misma hora; moverse a diario (deporte + fuerza 2 veces/semana); comida casera barata (legumbres, huevo, jurel, avena); moderación de alcohol y pantallas. Celibato aquí significa enfoque: menos dispersión, más maestría. Salud sexual con matrona si corresponde.' },
    { n: 'Grihastha: cuerpo que sostiene', ico: '🏠', txt: 'EMPA en CESFAM, presión, glicemia y colesterol al día; caminar 30 min por 5 días + fuerza; espalda y rodillas con técnica. Comer para rendir, no solo para llenar. Chequeos de mama/próstata/colon según edad. Dormir aunque haya guagua o turno: turnos de relevo.' },
    { n: 'Vanaprastha: cuerpo que suelta carga', ico: '🌲', txt: 'Fuerza + equilibrio + caminar; calcio, vitamina D (sol de mañana) y proteína; densitometría y corazón al día. Acompaña síntomas del climaterio sin silencio (ver 🔥 Climaterio). Simplifica: menos peso cargado, más pausas.' },
    { n: 'Sannyasa: cuerpo cuidado con ternura', ico: '🔥', txt: 'Moverse a diario sin exigirse, casa anticaídas, remedios ordenados en pastillero, ojos/oídos/dientes/pies al día, hidratación y proteína diaria. Todo dolor merece alivio. Autonomía el mayor tiempo posible, ayuda pedida sin culpa.' },
    { n: 'Dharma del alimento (Ahimsa)', ico: '🥗', txt: 'Comer sattvico en lo posible: fresco, simple, compartido, sin violencia. En Penco: feria, legumbres, verduras, cocinar en casa 2 veces/semana, agradecer antes de comer. Alcohol poco o nada; tabaco cero. Lo simple repetido alivia más que lo caro una vez.' },
    { n: 'Yoga y respiración por etapa', ico: '🧘', txt: 'Joven: práctica activa (saludos al sol, deporte). Adulto: 20 min de pausa (caminata + respiración 4-6). Retiro: meditación 10-20 min diarios + lectura sagrada. Renuncia: contemplación, silencio, mantra o gratitud. 🌬️ Respiración y 🕉️ Prácticas del calendario te ordenan.' }
  ],
  menteTitulo: '🧠 Dharma: lo correcto para tu momento',
  menteIntro: 'El Dharma no es una regla externa: es <b>lo que tu etapa te pide</b>. Estas 5 llaves ordenan la mente y los vínculos.',
  mente: [
    { n: 'Los 4 fines (Purusharthas)', ico: '🎯', txt: 'Dharma (deber), Artha (riqueza bien habida), Kama (placer legítimo) y Moksha (liberación). Joven: Dharma de aprender. Adulto: Artha + Kama al servicio del Dharma (ganar y gozar sin dañar). Mayor: soltar Artha/Kama hacia Moksha. Pregunta guía: ¿esto que quiero, a qué fin sirve en mi etapa?' },
    { n: 'Estudiante: humildad y Guru', ico: '🙏', txt: 'Elige un maestro u oficio y síguelo 1 año (taller, SENCE, mentor del barrio). Reglas: llega a la hora, anota, practica 25 min diarios, pregunta sin vergüenza. Compararte quema: compara tu hoy con tu hace 1 año.' },
    { n: 'Padre/Madre: sostener sin quemarse', ico: '🥪', txt: 'Generación sándwich: hijos + padres + pega. Reparte por escrito quién cuida qué días, qué se paga y qué se externaliza. Tiempo propio 3 por 30 min/semana. Culpa no es amor: amor con relevo dura más. Ver 🏠 Adultez.' },
    { n: 'Retiro: delegar y enseñar', ico: '🌾', txt: 'Haz lista de tus cargos (casa, pega, club, iglesia) y entrega 1 por luna con enseñanza incluida. Pasa de hacer a aconsejar. Duelo de protagonismo es normal: se cura enseñando. Graba 1 historia por luna (🗣️ Voz de los Abuelos).' },
    { n: 'Renuncia: desapego amoroso', ico: '💛', txt: 'Práctica: cada luna elige 1 objeto, 1 rencor y 1 pendiente y suéltalos (donar, perdonar, cerrar). Medita o reza 10 min diarios. Bendice en vez de dirigir. Si hay tristeza 2+ semanas o ideas de daño: ayuda HOY (*4141 / CESFAM). El desapego sano da paz, no vacío.' }
  ],
  pracTitulo: '🧰 Tu Dharma esta luna',
  pracIntro: 'El Dharma se practica, no se lee. <b>1 paso por luna</b> según tu ashrama.',
  prac: [
    { n: 'Ubica tu ashrama hoy', ico: '📍', txt: '0-25 estudiante, 25-50 familia, 50-75 retiro, 75+ renuncia. Lee tu tarjeta + anterior (qué debí cerrar) + siguiente (qué se anuncia). Escríbelo en 5 líneas en Mi espacio: qué cierro, qué me cuesta, qué me ilusiona.' },
    { n: 'Si eres estudiante: 1 oficio', ico: '🎓', txt: 'Inscríbete en 1 curso (SENCE, oficio local) y practica 25 min/día (🍅 Pomodoro). Arma CV de 1 página y pide a 1 maestro que lo revise. Fondo chico: 1 mes de gastos. Ver 🌅 Juventud.' },
    { n: 'Si sostienes familia: orden de plata', ico: '💰', txt: 'Presupuesto 50-30-20, fondo 3-6 meses, mata la deuda cara primero. Revisa AFP 1 vez/año. Reunión familiar 30 min/luna: plata, cuidados y tareas sobre la mesa. Usa 💰 Finanzas.' },
    { n: 'Si vas al retiro: delega 1', ico: '🤝', txt: 'Elige 1 responsabilidad y entrégala este mes con manual chico (cómo se hace, a quién llamar). Reemplaza esa hora por contemplación: caminata, lectura, meditación. Casa envejezcante: antideslizante, luz, dormitorio abajo si puedes.' },
    { n: 'Si eres mayor: simplifica y bendice', ico: '🕯️', txt: 'Carpeta en 1 lugar (carnet, remedios, contactos, voluntades). Dona lo que no usas. Llama o visita a 1 persona por semana para bendecirla (gracias concretas). Legado: 1 historia grabada por luna.' },
    { n: 'Honrar la fuente', ico: '🙏', txt: 'Tradición viva de India: este resumen es educativo y no reemplaza maestros. Honra sin apropiarte: no dirijas ceremonias hindúes sin guía, nombra la fuente (Vedas, Upanishads, Bhagavad Gita) y, si puedes, aprende de voces de la tradición. Aplica el espíritu (deber, servicio, desapego) sin copiar formas ajenas.' }
  ],
  espacioExtra: 'dharma',
  espacioExtraLabel: 'Vivo mi deber de etapa hoy (1-10)',
  bridges: [['hinGoJuv', 'btnJuventud'], ['hinGoAdu', 'btnAdultez'], ['hinGoSep', 'btnSeptenios'], ['hinGoVejez', 'btnVejez'], ['hinGoLakota', 'btnLakota'], ['hinGoGrat', 'btnGratitud']],
  bridgesLabel: '🔗 Sigue en tu calendario',
  bridgesTxt: 'Tu ashrama se camina mejor con tu etapa chilena al lado.'
},
/* ============ 9) LAS 6 DECADAS DE CONFUCIO ============ */
{
  key: 'con', btn: 'btnConfucio', btnTxt: '🏮 Décadas Confucio',
  dlg: 'confucioDialog', title: '🏮 La Sabiduría China: Las 6 Décadas de Confucio',
  sub: 'En las <b>Analectas (2:4)</b> Confucio describe su maduración interior: <b>no logros externos, sino paz interna</b>. De los 15 a los 70, un mapa para ubicarte y preparar la década que viene. Todo <b>privado y local</b>. <b>Educativo.</b>',
  kw: 'confucio china analectas decadas 15 30 40 50 60 70 aprendizaje firmeza dudas mandato cielo oido docil virtud sabiduria mandarin',
  p: 'con', tabNames: ['Guia', 'Cuerpo', 'Mente', 'Prac', 'Espacio'],
  tabLabels: ['🧭 Guía', '🏮 Las 6 Décadas', '🧠 Mente y Paz', '🧰 Vida práctica', '📓 Mi espacio'],
  guiaTitulo: '🏮 Madurar por dentro, no solo por fuera',
  intro: 'Confucio no lista cargos ni riquezas: lista <b>estados del corazón</b>. A los 15 aprender, a los 30 afirmarse, a los 40 soltar dudas, a los 50 conocer el mandato, a los 60 escuchar sin alterarse, a los 70 ser libre sin dañar. Es un espejo amable: ¿dónde estoy y qué me falta madurar?',
  fases: [
    { n: '15 · Puse el corazón en aprender', ico: '🌱', q: 'La semilla: curiosidad y disciplina. Sin amor por aprender, lo demás no brota. Tarea: estudiar con un maestro, leer, practicar a diario.',
      cuerpo: 'Ritmo, sueño y deporte: el cuerpo joven aprende mejor moviéndose.',
      mente: 'Humildad: no sé, quiero aprender. Pregunta más de lo que afirmas.',
      tip: '🌙 25 min diarios de estudio real (🍅 Pomodoro).' },
    { n: '30 · Me mantuve firme', ico: '🧱', q: 'Establecí principios y mi lugar en el mundo. Ya no todo vale: hay columna vertebral. Tarea: oficio, palabra cumplida, casa y vínculos estables.',
      cuerpo: 'Chequeos base, fuerza, menos trasnoche. Sostener pide cuerpo.',
      mente: 'Decir no sin culpa y sí con compromiso. Principios por escrito.',
      tip: '🌙 1 principio practicado por luna (ej: puntualidad, ahorro).' },
    { n: '40 · No tuve dudas', ico: '🔦', q: 'Claridad mental y emocional. Ya probaste, ya fallaste: sabes lo tuyo y lo que no. Las dudas opinan menos.',
      cuerpo: 'Metabólico se mueve: exámenes + proteína + caminar.',
      mente: 'Soltar caminos no tomados sin amargura. Lo elegido se honra.',
      tip: '🌙 Escribe qué ya no dudas y qué sí: poda 1 duda.' },
    { n: '50 · Conocí el mandato del cielo', ico: '🌌', q: 'Comprendí mi propósito y mi lugar en el universo. No todo depende de mí: hay un mandato mayor. Tarea: servir con lo aprendido, enseñar.',
      cuerpo: 'Corazón y huesos piden mantención. Fuerza 2 veces/semana.',
      mente: 'Aceptar lo que no controlo, responder por lo que sí. Serenidad.',
      tip: '🌙 1 enseñanza entregada por luna.' },
    { n: '60 · Mi oído se volvió dócil', ico: '👂', q: 'Capacidad de escuchar cualquier verdad sin juzgar ni alterarse. La crítica ya no te rompe: la escuchas, rescatas y sigues.',
      cuerpo: 'Vista, oído, dientes al día. Escuchar también es salud.',
      mente: 'Escucha activa: parafrasea antes de responder. El ego baja, la sabiduría sube.',
      tip: '🌙 1 conversación difícil escuchada entera.' },
    { n: '70 · Sigo mi corazón sin transgredir', ico: '🕊️', q: 'Libertad máxima: voluntad personal y ley universal son una sola. Haces lo que amas y eso mismo es lo correcto. Pocos llegan: es fruto de las 5 anteriores.',
      cuerpo: 'Moverse, comer, vínculo diario. Autonomía con ayuda pedida.',
      mente: 'Bendecir y soltar. El corazón manda y no daña.',
      tip: '🌙 1 acto de puro gozo bueno por luna.' }
  ],
  mitos: '• "Madurar es tener éxito" → para Confucio madurar es tener paz, no títulos.<br>• "A los 40 no se duda nunca" → significa no ser esclavo de la duda, no no pensar.<br>• "Escuchar dócil es someterse" → es fortaleza: escuchas todo, eliges lo justo.<br>• "Libertad es hacer lo que quiero" → a los 70 la libertad es querer lo correcto.',
  uso: '1) Ubica tu década por edad.<br>2) Lee tu década + anterior + siguiente.<br>3) Elige 1 virtud en <b>Mente</b>.<br>4) Haz 1 práctica en <b>Vida práctica</b>.<br>5) Registra en <b>Mi espacio</b> cada luna.',
  familia: 'En casa conviven varias décadas: el de 15 necesita maestro, el de 30 necesita confianza, el de 50 necesita ser escuchado, el de 70 necesita libertad. Rito simple: una comida donde cada uno cuente qué aprendió este mes. Los mayores enseñan con ejemplo, no con sermón.',
  cuerpoTitulo: '🏮 Cuerpo que sostiene cada década',
  cuerpoIntro: 'La paz interna necesita base física. <b>Mismo cuerpo, distinto énfasis</b> por década.',
  cuerpo: [
    { n: '15-30: base del aprendiz firme', ico: '🌱', txt: 'Dormir 7-9 h, deporte + fuerza, comida casera, estudio con pausas. Menos scroll, más práctica. Salud sexual y dental al día. El cuerpo disciplinado ordena la mente.' },
    { n: '30-40: sostener sin quemarse', ico: '🧱', txt: 'Caminar 150 min/semana + fuerza 2 veces; presión, peso, glicemia cada 1-2 años. Espalda con técnica. Dormir aunque haya pega e hijos: relevo y horarios.' },
    { n: '40-50: claridad metabólica', ico: '🔦', txt: 'EMPA en CESFAM; lípidos, presión, PAP/mamografía o próstata según caso; proteína + fibra; alcohol poco. Niebla mental: registra sueño y estrés 2 lunas y consulta si no pasa.' },
    { n: '50-60: mandato con corazón sano', ico: '❤️', txt: 'Corazón, huesos y sueño protegidos. Fuerza + equilibrio, calcio + vitamina D, sal moderada. Climaterio acompañado (ver 🔥 Climaterio). Enseñar rejuvenece.' },
    { n: '60-70: oído y cuerpo finos', ico: '👂', txt: 'Audición, visión, dental y pies al día: 4 ladrones de autonomía. Caminar 20-30 min + fuerza liviana + equilibrio. Audífono y lentes se usan, no se guardan.' },
    { n: '70+: libertad cuidada', ico: '🕊️', txt: 'Casa anticaídas, pastillero, controles crónicos, hidratación y compañía diaria. Moverse a diario, dolor siempre tratado. Autonomía por capas: solo en lo posible, acompañado en lo riesgoso.' }
  ],
  menteTitulo: '🧠 Las virtudes que dan paz',
  menteIntro: 'Cada década entrena una virtud. <b>Practica solo la tuya</b> este mes.',
  mente: [
    { n: 'Aprender (15): amor al estudio', ico: '📖', txt: 'Pregunta guía: ¿qué aprendí esta luna? Técnica: 25 min diarios, 1 maestro, 1 cuaderno. Ren (benevolencia) empieza escuchando al que sabe.' },
    { n: 'Firmeza (30): principios', ico: '🧱', txt: 'Escribe 3 principios (ej: cumplo mi palabra, no debo lo que no puedo pagar, cuido mi casa). Revísalos cada luna. Li (rito correcto): puntualidad, orden y palabra son espiritualidad diaria.' },
    { n: 'Sin dudas (40): poda', ico: '✂️', txt: 'Lista lo que te divide (2 pegas, 2 amores, 2 rumbos) y elige con datos + 10-10-10. Lo no elegido se suelta con ritual (carta, conversación). Dudar menos es decidir mejor.' },
    { n: 'Mandato (50): propósito', ico: '🌌', txt: 'Pregunta: ¿para quién sirve lo que sé hacer? Escribe tu mandato en 1 frase (ej: enseñar oficio a jóvenes de Penco). Sirve 2 h/mes (minga, taller, club). Yi (justicia) es hacer lo correcto aunque cueste.' },
    { n: 'Oído dócil (60) y libertad (70)', ico: '💛', txt: 'Práctica semanal: escucha 10 min sin interrumpir, parafrasea, recién responde. En conflicto: qué es verdad en lo que dice, aunque duela. Libertad buena: haz 1 cosa que ames y que nutra a otro. Así voluntad y ley se vuelven una.' }
  ],
  pracTitulo: '🧰 Tu década esta luna',
  pracIntro: 'Confucio se practica en lo chico. <b>1 virtud por luna</b>.',
  prac: [
    { n: 'Ubica tu década', ico: '📍', txt: '15 aprender, 30 firmeza, 40 sin dudas, 50 mandato, 60 oído, 70 libertad. Lee la tuya + anterior + siguiente. Anota en 5 líneas: qué aprendí, en qué soy firme, qué duda suelto.' },
    { n: 'Rito de estudio (todas)', ico: '📚', txt: '15 min de lectura + 10 min de práctica enseñando a otro. Jóvenes: oficio/SENCE. Adultos: 1 curso/año. Mayores: enseñar 1 vez/luna. Quien enseña, aprende dos veces.' },
    { n: 'Firmeza de plata y palabra', ico: '💰', txt: '30-50: presupuesto 50-30-20, fondo emergencia, deuda cara primero. Cumple 1 compromiso chico por semana (hora, pago, visita). La confianza se construye en chico.' },
    { n: 'Poda de los 40', ico: '🌿', txt: 'Elige 1 cosa que soltar este mes (deuda chica, compromiso que enferma, red que resta). Conversación + carta + acto. Menos carga, más claridad.' },
    { n: 'Servicio del mandato (50+)', ico: '🤝', txt: '2 h/mes de servicio fijo (taller, iglesia, club, huerta comunitaria). Enseña tu oficio a 1 joven. Graba 1 historia (🗣️ Voz de los Abuelos). Servir es el examen del mandato.' },
    { n: 'Escucha y gozo (60-70+)', ico: '🫖', txt: 'Té o mate semanal con un mayor o un joven: solo escuchar. 1 paseo gozoso por luna (mar, bosque, feria) sin culpa. Honra la fuente: Analectas 2:4; respeta la tradición china viva sin caricaturizarla.' }
  ],
  espacioExtra: 'paz',
  espacioExtraLabel: 'Paz interna hoy (1-10)',
  bridges: [['conGoJuv', 'btnJuventud'], ['conGoAdu', 'btnAdultez'], ['conGoSep', 'btnSeptenios'], ['conGoVejez', 'btnVejez'], ['conGoKimun', 'btnKimun'], ['conGoGrat', 'btnGratitud']],
  bridgesLabel: '🔗 Sigue en tu calendario',
  bridgesTxt: 'Tu década se vive mejor con tu etapa chilena al lado.'
},
/* ============ 10) COSMOVISION ANDINA ============ */
{
  key: 'and', btn: 'btnAndina', btnTxt: '⛰️ Cosmovisión Andina',
  dlg: 'andinaDialog', title: '⛰️ La Cosmovisión Andina (Quechua): Llankay, Yachay, Munay',
  sub: 'En los Andes la vida no se mide por edad sino por <b>equilibrio de 3 energías al servicio del Ayllu (comunidad)</b>: <b>Llankay (hacer), Yachay (saber), Munay (amar)</b>. Joven predomina el cuerpo, adulto la mente, mayor el corazón. Todo <b>privado y local</b>. <b>Educativo.</b>',
  kw: 'andina quechua llankay yachay munay ayllu apus pachamama ayni minka energia comunidad andes trabajo sabiduria amor',
  p: 'and', tabNames: ['Guia', 'Cuerpo', 'Mente', 'Prac', 'Espacio'],
  tabLabels: ['🧭 Guía', '⛰️ Las 3 Energías', '💛 Mente y Ayllu', '🧰 Vida práctica', '📓 Mi espacio'],
  guiaTitulo: '⛰️ Crecer es equilibrar, no solo cumplir años',
  intro: 'No hay edades fijas: hay <b>predominios</b>. De joven das brazos (<b>Llankay</b>), de adulto das cabeza (<b>Yachay</b>), de mayor das corazón (<b>Munay</b>). Persona plena = las 3 equilibradas al servicio del <b>Ayllu</b>. Pregunta guía: ¿qué energía me falta hoy?',
  fases: [
    { n: 'Llankay (Trabajo/Acción)', ico: '💪', q: 'Predomina en la juventud. Energía del cuerpo: servicio práctico, construcción, agricultura, esfuerzo por el bienestar común. Se aprende haciendo, no mirando. El flojo no es malo: está con energía dormida.',
      cuerpo: 'Fuerza, resistencia, técnica para no lesionarse. Comer para rendir.',
      mente: 'Orgullo del hacer bien: puntual, cumplidor, solidario. Ayni: hoy por ti, mañana por mí.',
      tip: '🌙 1 trabajo concreto por el común al mes (minga, arreglo, huerta).' },
    { n: 'Yachay (Sabiduría/Conocimiento)', ico: '🧠', q: 'Florece en la madurez. Energía de la mente y la memoria: guía, enseña oficios, resuelve conflictos, preserva historia oral. El que sabe y no enseña, enferma de saber guardado.',
      cuerpo: 'Cuidar cabeza y corazón: dormir, pausas, chequeos. Enseñar cansa si no te cuidas.',
      mente: 'Escuchar antes de aconsejar. Memoria: anotar para no olvidar.',
      tip: '🌙 1 enseñanza entregada por luna.' },
    { n: 'Munay (Amor/Voluntad superior)', ico: '💛', q: 'Se alcanza en la vejez. No es romance: es compasión profunda, bendecir, sanar con presencia, conectar con Apus y Pachamama desde la entrega total. El mayor que bendice sostiene al pueblo entero.',
      cuerpo: 'Ternura: moverse suave, comer liviano, dormir y compañía.',
      mente: 'Perdón y gratitud. Bendecir en vez de criticar.',
      tip: '🌙 1 bendición consciente por semana.' }
  ],
  mitos: '• "Trabajo manual vale menos" → Llankay es sagrado: sin manos no hay comunidad.<br>• "Sabio es el que más habla" → Yachay escucha primero, habla justo.<br>• "Amor es solo pareja" → Munay es compasión por todo ser vivo.<br>• "Joven no puede tener Munay ni mayor Llankay" → predominan, no excluyen: todos usan las 3.',
  uso: '1) Ubica tu energía predominante por momento vital.<br>2) Lee su tarjeta + las otras dos.<br>3) Marca tu equilibrio en <b>Mente</b>.<br>4) Haz 1 Ayni en <b>Vida práctica</b>.<br>5) Registra en <b>Mi espacio</b>.',
  familia: 'Ayllu = familia extendida + vecinos + territorio. Reparto andino: jóvenes ponen brazos, adultos ponen cabeza y plata, mayores ponen consejo y bendición. Minga mensual ordena más que mil retos. Si hay gritos o control, eso no es tradición: es violencia (149 / 1455).',
  cuerpoTitulo: '⛰️ Cuerpo al servicio del Ayllu',
  cuerpoIntro: 'Cada energía pide un cuerpo. <b>Equilibra las 3</b> aunque predomine una.',
  cuerpo: [
    { n: 'Llankay: cuerpo fuerte y sano', ico: '💪', txt: 'Fuerza 2 veces/semana + caminar o trabajo activo; técnica (rodillas flectadas, peso pegado) para no lesionarse; comida que rinde (legumbre, huevo, papa, verdura). Dormir 7-8 h aunque haya turno. 💪 Entrenamientos del calendario.' },
    { n: 'Yachay: cabeza cuidada', ico: '🧠', txt: 'Dormir, pausas cada 50 min, vista al día, presión/glicemia en EMPA. Anotar: agenda, lista, diario. Niebla 2+ semanas: registra y consulta. Enseñar con ejemplo y paciencia, no a gritos.' },
    { n: 'Munay: cuerpo tierno', ico: '💛', txt: 'Movimiento suave diario (caminata, tai chi), comida liviana y agua, remedios ordenados, casa abrigada y sin caídas. Cariño también es medicina: mano, mate, música, paseo al mar.' },
    { n: 'Pachamama: comer con respeto', ico: '🌽', txt: 'Cocinar simple, agradecer, no desperdiciar, compartir. Feria + huerta + trueque. Cuidar agua y semilla. En Penco: no dejar basura en playa/bosque, cuidar el borde costero.' },
    { n: 'Apus y respiración', ico: '🏔️', txt: 'Subir cerro o mirar el mar 1 vez/luna: caminar lento, respirar 4-6, agradecer. El aire ordena la cabeza. Si subes, avisa ruta y lleva agua/abrigo. 🌬️ Respiración del calendario.' },
    { n: 'Descanso y festejo', ico: '🎶', txt: 'Trabajar, sí; festejar, también. Música, baile y comida compartida recargan Llankay. Dormir la fiesta no la borra: planifica vuelta segura, sin manejar si tomaste.' }
  ],
  menteTitulo: '💛 Ayllu: nadie crece solo',
  menteIntro: 'Las 3 energías solo maduran <b>en comunidad</b>. Estas llaves las equilibran.',
  mente: [
    { n: 'Ayni: reciprocidad', ico: '🤝', txt: 'Hoy por ti, mañana por mí. Anota favores dados y recibidos para equilibrar, no para cobrar. 1 Ayni semanal (cuidar, prestar herramienta, enseñar, cocinar). Quien solo recibe se seca; quien solo da se quema.' },
    { n: 'Minka: trabajo común', ico: '🧤', txt: '1 minga mensual (limpieza, arreglo, huerta, ayuda a un mayor). Jóvenes brazos, adultos organización, mayores consejo y comida. Terminar con comida compartida: el cierre festeja el hacer.' },
    { n: 'Yachay: enseñar y mediar', ico: '🗣️', txt: 'Si sabes algo, enséñalo 1 vez/luna (oficio, receta, historia). En conflicto: escucha a ambos, busca el bien del Ayllu, acuerda por escrito. Pedir perdón también es Yachay.' },
    { n: 'Munay: bendecir y perdonar', ico: '🕯️', txt: 'Práctica diaria: agradece 3 cosas, bendice a 1 persona en silencio, suelta 1 rencor chico. Con mayores: pedir su bendición y consejo. Con la tierra: pedir permiso y dar las gracias (Nor feleal mapuche y respeto andino se abrazan).' },
    { n: 'Equilibrio personal', ico: '⚖️', txt: 'Marca cada luna de 1 a 10 tus 3 energías. ¿Cuál está baja? Súbela con 1 acto chico (Llankay: arreglar algo; Yachay: aprender/enseñar 25 min; Munay: llamar y agradecer). Equilibrio imperfecto y constante vale más que perfección de un día.' }
  ],
  pracTitulo: '🧰 Tu Ayni esta luna',
  pracIntro: 'La cosmovisión se hace con las manos. <b>1 Ayni + 1 aprendizaje + 1 bendición</b> por luna.',
  prac: [
    { n: 'Mide tus 3 energías', ico: '📊', txt: 'En Mi espacio puntúa Llankay, Yachay y Munay (1-10). Elige subir solo la más baja este mes. Relee en 3 lunas: verás tu ritmo.' },
    { n: 'Llankay: 1 hacer concreto', ico: '🔨', txt: 'Arregla, siembra, cocina, pesca o construye algo útil para tu casa o vecino. Hazlo con técnica y termina. Foto del antes/después en tu diario: el hacer visible anima.' },
    { n: 'Yachay: 1 saber compartido', ico: '📖', txt: 'Aprende 1 palabra quechua/mapudungun por semana (ej: ayllu, minka, newen, küyen) y úsala. Enseña 1 oficio 1 vez/luna. Pide 1 historia a un mayor y grábala si acepta.' },
    { n: 'Munay: 1 amar que sana', ico: '💛', txt: 'Visita o llamada semanal a un mayor: solo escuchar y agradecer. Perdona 1 cosa chica por escrito (carta no enviada o conversación). Ofrenda simple a la tierra: limpiar, sembrar, cuidar agua.' },
    { n: 'Minka mensual', ico: '🌊', txt: 'Súmate u organiza 1 trabajo común: limpieza de playa/bosque, ayuda a vecino, huerta comunitaria. Acuerda hora, tarea y cierre con comida. Niños y mayores también tienen rol: todos sirven.' },
    { n: 'Honrar la fuente', ico: '🙏', txt: 'Sabiduría viva quechua-andina: resumen educativo, no reemplaza portadores. Honra sin apropiarte: no dirijas ceremonias andinas sin guía autorizada, nombra la fuente y aprende de voces andinas. Aplica el espíritu (reciprocidad, comunidad, cuidado de la tierra) en Penco sin copiar formas ajenas.' }
  ],
  espacioExtra: 'ayllu',
  espacioExtraLabel: 'Equilibrio Llankay-Yachay-Munay hoy (1-10)',
  bridges: [['andGoJuv', 'btnJuventud'], ['andGoAdu', 'btnAdultez'], ['andGoVejez', 'btnVejez'], ['andGoSep', 'btnSeptenios'], ['andGoKimun', 'btnKimun'], ['andGoGrat', 'btnGratitud']],
  bridgesLabel: '🔗 Sigue en tu calendario',
  bridgesTxt: 'Tus 3 energías se sostienen con etapas, comunidad y gratitud.'
},
/* ============ 11) LOS 4 ESTADIOS DE JUNG ============ */
{
  key: 'jun', btn: 'btnJung', btnTxt: '🧭 Estadios Jung',
  dlg: 'jungDialog', title: '🧭 La Psicología Arquetípica (C.G. Jung): Los 4 Estadios de la Individuación',
  sub: 'Jung, influido por mitos antiguos, propuso un camino de <b>maduración psicológica y espiritual</b>: <b>Atleta, Guerrero, Estadista y Espíritu</b>. Del cuerpo al alma, del yo al nosotros. Todo <b>privado y local</b>. <b>Educativo: no reemplaza terapia.</b>',
  kw: 'jung psicologia arquetipo individuacion atleta guerrero estadista anima espiritu ego sombra inconsciente maduracion',
  p: 'jun', tabNames: ['Guia', 'Cuerpo', 'Mente', 'Prac', 'Espacio'],
  tabLabels: ['🧭 Guía', '🧭 Los 4 Estadios', '🧠 Mente y Sombra', '🧰 Vida práctica', '📓 Mi espacio'],
  guiaTitulo: '🧭 Individuación: llegar a ser quien eres',
  intro: 'Individuación = <b>integrar lo que soy</b> (luz y sombra) hasta volverse uno mismo, no copia. Cada estadio tiene su foco: <b>cuerpo, mente, corazón, alma</b>. No se salta: el Guerrero no integrado no puede ser buen Estadista; el Estadista apurado no llega a Espíritu. Ubica tu foco actual.',
  fases: [
    { n: 'El Atleta (Infancia/Juventud)', ico: '🏃', q: 'Foco en el cuerpo, desarrollo físico, competencia y exploración del mundo exterior. Tarea: conocer límites, jugar, probar, ganar y perder. Sin cuerpo vivido no hay mente firme.',
      cuerpo: 'Deporte, juego, dormir y comer para crecer. Lesiones enseñan límites.',
      mente: 'Comparación y grupo: normal. Canaliza en crear, no en destruir.',
      tip: '🌙 1 deporte + 1 exploración nueva por luna.' },
    { n: 'El Guerrero (Adultez temprana/media)', ico: '🛡️', q: 'Foco en mente, voluntad, carrera, protección de la familia y conquista de metas. Tarea: sostener, decidir, proveer. Riesgo: identificarme solo con el logro y quemarme.',
      cuerpo: 'Fuerza, chequeos, dormir aunque haya pega. El guerrero dormido rinde el doble.',
      mente: 'Disciplina + límites. La sombra del guerrero es control y orgullo.',
      tip: '🌙 1 meta de proveer + 1 límite sano por luna.' },
    { n: 'El Estadista / Ánima (Adultez madura)', ico: '💛', q: 'Foco en corazón y relaciones. Se busca significado, conexión emocional, mentoría y equilibrio entre éxito externo y paz interna. Integra lo femenino interno (ánima/animus): escucha, cuida, crea.',
      cuerpo: 'Corazón, estrés y sueño: el cuerpo pide sentido, no solo rendimiento.',
      mente: 'Mentoría, pareja renegociada, amistad profunda. Pregunta: ¿para quién sirve lo que sé?',
      tip: '🌙 1 enseñanza + 1 conversación honesta por luna.' },
    { n: 'El Espíritu (Vejez)', ico: '✨', q: 'Foco en el alma. Se trasciende el ego personal. La persona se vuelve canal de sabiduría, humor y compasión, preparándose para la trascendencia. Menos yo, más nosotros y más misterio.',
      cuerpo: 'Ternura, paseo, contemplación. Dolor tratado, no aguantado.',
      mente: 'Humor, perdón, gratitud y entrega. Bendecir es el último poder.',
      tip: '🌙 1 historia + 1 perdón por luna.' }
  ],
  mitos: '• "Madurar es dejar de jugar" → cada estadio incluye al anterior: el Espíritu también ríe y se mueve.<br>• "Guerrero es solo hombre" → es energía disponible para todos: proveer y proteger.<br>• "Espiritual es evadirse" → en Jung lo espiritual integra: cuerpo, vínculo y sombra incluidos.<br>• "La crisis es fracaso" → es llamado del siguiente estadio: escúchala, no la tapes.',
  uso: '1) Ubica tu estadio por momento vital.<br>2) Lee tu tarjeta + anterior + siguiente.<br>3) Trabaja 1 sombra en <b>Mente</b>.<br>4) Haz 1 acto en <b>Vida práctica</b>.<br>5) Registra en <b>Mi espacio</b>.',
  familia: 'En casa hay atletas, guerreros, estadistas y espíritus a la vez. Al atleta ponle juego, al guerrero respeta su lucha y ponle límites, al estadista pídele consejo, al espíritu escúchalo. No exijan espíritu al adolescente ni atleta al anciano frágil.',
  cuerpoTitulo: '🧭 Cuerpo en cada estadio',
  cuerpoIntro: 'Cada foco pide un cuerpo. <b>El alma no flota sin base física</b>.',
  cuerpo: [
    { n: 'Atleta: cuerpo explorado', ico: '🏃', txt: 'Juego diario, deporte 3-5 veces/semana, fuerza 2 veces, dormir 8-9 h, comida que sostiene el estirón. Lesión: reposo + kine, no aguante. Salud sexual y dental al día.' },
    { n: 'Guerrero: cuerpo que rinde', ico: '🛡️', txt: '150 min aeróbico + fuerza 2 veces/semana; EMPA, presión, glicemia; espalda con técnica; dormir 7-8 h. Alcohol poco, tabaco cero. El guerrero que duerme decide mejor.' },
    { n: 'Estadista: cuerpo con sentido', ico: '💛', txt: 'Caminar + fuerza + equilibrio; corazón, huesos y sueño protegidos; pausas reales (sin pantalla). Estrés 2+ semanas: registra, comparte, consulta. Cuidarse es cuidar a los que guías.' },
    { n: 'Espíritu: cuerpo templo sereno', ico: '✨', txt: 'Movimiento suave diario, casa segura, remedios ordenados, sentidos al día, hidratación y compañía. Contemplación: mirar mar/bosque, respirar, agradecer. Paseo lento también es práctica.' },
    { n: 'Sueño y energía', ico: '😴', txt: 'Todos los estadios: misma hora ±1 h, sin pantalla 30-45 min antes, cafeína hasta las 15:00. Siesta 20 min máx antes de las 15:00. Insomnio 3+ semanas o ronquido con pausas: consulta.' },
    { n: 'Comida que integra', ico: '🥗', txt: 'Base Penco en todo estadio: legumbre, huevo, pescado, verdura de feria, agua. Joven: comer para crecer. Adulto: proteína + fibra. Mayor: proteína diaria + 6-8 vasos aunque no dé sed. Cocinar acompañado abre el apetito.' }
  ],
  menteTitulo: '🧠 Sombra e integración',
  menteIntro: 'Cada estadio tiene su <b>sombra</b> (lo negado). Integrarla es madurar. <b>1 sombra por luna</b>.',
  mente: [
    { n: 'Sombra del Atleta: comparación', ico: '🪞', txt: 'Si valgo solo si gano, pierdo siempre. Antídoto: compara tu hoy con tu hace 1 año; limpia redes 1 vez/luna; crea 1 antes de consumir 1 hora. Pregunta: ¿qué me enseña esta derrota?' },
    { n: 'Sombra del Guerrero: control', ico: '⚔️', txt: 'Querer todo ya y a mi modo quema vínculos. Antídoto: delega 1, dice no a 1, pide ayuda en 1. Burnout (cansancio que no se va durmiendo 2+ semanas): quita 1 tarea, pon 1 límite, suma 1 recuperación diaria.' },
    { n: 'Sombra del Estadista: complacer', ico: '🎭', txt: 'Quedar bien con todos traiciona a uno: tú. Antídoto: renegocia (pareja, pega, familia) por escrito; mentoría con límites de horario; duelo de juventud nombrado. Terapia/grupo ordena más que un auto nuevo.' },
    { n: 'Sombra del Espíritu: evasión', ico: '☁️', txt: 'Usar lo espiritual para no pagar cuentas ni pedir perdón no es espíritu: es fuga. Antídoto: papeles en orden, perdones concretos, servicio semanal. Trascender incluye reparar.' },
    { n: 'Diálogo con la sombra', ico: '🌗', txt: 'Técnica Jung simple: escribe 10 min qué te irrita del otro; subraya 3 frases que también son tuyas; elige 1 acto de integración esta luna. Si un recuerdo desborda: detente y pide apoyo (*4141 / CESFAM). 🔁 Recapitulación te ayuda.' }
  ],
  pracTitulo: '🧰 Tu estadio esta luna',
  pracIntro: 'La individuación se practica en lo cotidiano. <b>1 acto por luna</b>.',
  prac: [
    { n: 'Ubica tu estadio', ico: '📍', txt: '¿Mi foco es cuerpo (atleta), logro (guerrero), vínculo (estadista) o alma (espíritu)? Lee tu tarjeta + anterior + siguiente. Escríbelo en 5 líneas: qué domino, qué me cuesta, qué se anuncia.' },
    { n: 'Atleta: juega y prueba', ico: '⚽', txt: '1 deporte fijo + 1 prueba nueva por luna (taller, oficio, ruta). Anota qué aprendiste del cuerpo. Ver 🌱 Adolescencia o 🌅 Juventud para detalle.' },
    { n: 'Guerrero: provee con límites', ico: '🧭', txt: '1 meta de proveer (plata, arreglo, cuidado) + 1 límite (hora de salida, 1 no). Revisa AFP/deudas 1 vez/luna. Plan B vivo: 1 curso/año. Ver 🏠 Adultez.' },
    { n: 'Estadista: guía y vincula', ico: '🤝', txt: 'Enseña 1 vez/luna, ten 1 conversación honesta semanal (pareja/amigo/hijo), repara 1 vínculo pendiente. Pregunta guía: ¿para quién sirve lo que sé hacer?' },
    { n: 'Espíritu: bendice y suelta', ico: '🕯️', txt: 'Graba 1 historia/luna, perdona 1 pendiente, sirve 2 h/mes. Simplifica 1 cosa material. Paseo contemplativo semanal. Ver 🦉 Vejez y 🕊️ Duelo.' },
    { n: 'Sueños y señales', ico: '🌙', txt: 'Jung amaba los sueños: anota 1 sueño/semana (imagen + emoción + qué me dice). No interpretes literal: pregunta qué parte de mí habla. Si angustian semanas: acompáñalo con profesional.' }
  ],
  espacioExtra: 'integracion',
  espacioExtraLabel: 'Integración cuerpo-mente-corazón-alma (1-10)',
  bridges: [['junGoJuv', 'btnJuventud'], ['junGoAdu', 'btnAdultez'], ['junGoSep', 'btnSeptenios'], ['junGoClim', 'btnClimaterio'], ['junGoVejez', 'btnVejez'], ['junGoGrat', 'btnGratitud']],
  bridgesLabel: '🔗 Sigue en tu calendario',
  bridgesTxt: 'Tu estadio se camina mejor con tu etapa chilena al lado.'
},
/* ============ 12) LA RUEDA CELTA ============ */
{
  key: 'cel', btn: 'btnCelta', btnTxt: '🍀 Rueda Celta',
  dlg: 'celtaDialog', title: '🍀 La Rueda Celta de la Vida (Las 4 Estaciones del Ser)',
  sub: 'Los pueblos celtas vinculaban la vida al <b>ciclo agrícola y las estaciones</b>, muy afín a un <b>calendario de 13 lunas</b>: <b>Primavera, Verano, Otoño, Invierno</b>. Cada estación tiene su tarea y su fiesta. Todo <b>privado y local</b>. <b>Educativo.</b>',
  kw: 'celta rueda estaciones primavera verano otono invierno imbolc beltane lughnasadh mabon samhain yule ancestro cosecha calendario agricola',
  p: 'cel', tabNames: ['Guia', 'Cuerpo', 'Mente', 'Prac', 'Espacio'],
  tabLabels: ['🧭 Guía', '🍀 Las 4 Estaciones', '🧠 Mente y Ciclo', '🧰 Vida práctica', '📓 Mi espacio'],
  guiaTitulo: '🍀 Vivir como la tierra: sembrar, cosechar, soltar, descansar',
  intro: 'La rueda no es recta: <b>gira</b>. A veces estás en primavera (nacer), otras en invierno (recoger). No hay estación mala: hay <b>estación negada</b> (querer cosechar sin sembrar, o producir sin descansar). Ubica tu estación y honra su tarea.',
  fases: [
    { n: 'Primavera (Imbolc/Beltane) · Niñez y Juventud', ico: '🌸', q: 'Brote, imaginación, aprendizaje y descubrimiento de la identidad. Todo es posible: se prueba, se juega, se pregunta. Tarea: sembrar bueno y cuidar el brote.',
      cuerpo: 'Jugar, dormir mucho, comer para crecer. Proteger, no exigir producción.',
      mente: 'Curiosidad + cuentos. El error es abono, no vergüenza.',
      tip: '🌙 1 juego nuevo + 1 aprendizaje por luna.' },
    { n: 'Verano (Lughnasadh) · Adultez Joven', ico: '☀️', q: 'Pasión, acción, primera cosecha, familia y comunidad. Energía alta: construir casa, oficio, amor. Tarea: trabajar y festejar lo logrado.',
      cuerpo: 'Rendimiento con descanso. Fuerza, chequeos, dormir aunque haya fiesta.',
      mente: 'Pasión con compromiso. Elegir y sostener.',
      tip: '🌙 1 construcción + 1 festejo por luna.' },
    { n: 'Otoño (Mabon) · Madurez', ico: '🍂', q: 'Reflexión, compartir la cosecha (sabiduría), enseñar a jóvenes y soltar lo que no sirve. Tarea: podar y repartir. Lo que no se suelta, se pudre.',
      cuerpo: 'Mantención: corazón, huesos, sueño. Poda también de agenda.',
      mente: 'Balance: qué guardo, qué suelto, a quién enseño.',
      tip: '🌙 1 cosa soltada + 1 enseñanza por luna.' },
    { n: 'Invierno (Samhain/Yule) · Ancianidad', ico: '❄️', q: 'Introspección, volverse Ancestro en vida, contar historias junto al fuego y honrar descanso y memoria. Tarea: recordar, bendecir y prepararse para renacer.',
      cuerpo: 'Abrigo, descanso, compañía, remedios ordenados.',
      mente: 'Memoria y duelo honrados. Presencia más que prisa.',
      tip: '🌙 1 historia contada + 1 descanso real por luna.' }
  ],
  mitos: '• "Productivo es solo verano" → otoño reparte e invierno guarda: sin ellos no hay próxima siembra.<br>• "Soltar es perder" → podar fortalece: lo soltado abona.<br>• "Invierno es tristeza" → es recogimiento fértil: historias, fuego y memoria.<br>• "La rueda es superstición" → es lectura de la naturaleza: también la ciencia descansa por ciclos.',
  uso: '1) Ubica tu estación por edad y por momento (puedes vivir un invierno a los 30).<br>2) Lee tu tarjeta + la anterior y siguiente.<br>3) Elige 1 práctica de <b>Mente</b>.<br>4) Celebra 1 fiesta chica en <b>Vida práctica</b>.<br>5) Registra en <b>Mi espacio</b>.',
  familia: 'En casa hay 4 estaciones a la vez: al brote se le cuida, al verano se le acompaña el esfuerzo, al otoño se le pide consejo, al invierno se le escucha. Fiesta familiar por estación (comida + historia + agradecimiento) une más que mil retos.',
  cuerpoTitulo: '🍀 Cuerpo en cada estación',
  cuerpoIntro: 'La tierra enseña: <b>no se exige lo mismo en siembra que en cosecha</b>.',
  cuerpo: [
    { n: 'Primavera: cuerpo que brota', ico: '🌱', txt: 'Juego libre 2 h/día en niños; jóvenes deporte + fuerza; dormir 8-10 h; comida que sostiene el estirón. Vacunas, visión y dental al día. Menos pantalla, más bosque y mar.' },
    { n: 'Verano: cuerpo que rinde', ico: '☀️', txt: '150 min aeróbico + fuerza 2 veces; EMPA, presión, glicemia; protector solar y agua; dormir 7-8 h. Fiesta sí, accidente no: plan de vuelta, sin manejar si tomaste.' },
    { n: 'Otoño: cuerpo que poda', ico: '🍂', txt: 'Caminar + fuerza + elongar; corazón, colesterol y huesos al día; sal y azúcar moderadas; dormir protegido. Revisa remedios 1 vez/año. Soltar agenda también baja la presión.' },
    { n: 'Invierno: cuerpo que descansa', ico: '🕯️', txt: 'Abrigo, luz y anticaídas en casa; movimiento suave diario; proteína + agua; remedios ordenados; compañía diaria. Todo dolor merece alivio. Paseo corto con sol de mañana levanta el ánimo.' },
    { n: 'Comer de estación (Penco)', ico: '🥗', txt: 'Primavera: hojas y siembra. Verano: fruta y festejo. Otoño: cosecha y guarda (conservas, legumbres). Invierno: caldos y mate compartido. Feria + huerta + cocinar 2 veces/semana. Agradecer antes de comer.' },
    { n: 'Lunas y mareas', ico: '🌙', txt: 'Como buen calendario lunar: siembra en creciente (proyectos), cosecha en llena (muestra y festeja), poda en menguante (suelta), descansa en nueva (duerme y planea). Anota ánimo y energía por luna 3 meses: verás tu propia rueda.' }
  ],
  menteTitulo: '🧠 Soltar, agradecer, recordar',
  menteIntro: 'Cada estación entrena el corazón. <b>Practica la tuya</b>.',
  mente: [
    { n: 'Primavera: imaginar', ico: '🌸', txt: 'Pregunta: ¿qué quiero sembrar este año? Dibuja o escribe 3 brotes (oficio, vínculo, lugar). Protege 1 hora/semana de juego puro. El error se nombra y se riega distinto la próxima.' },
    { n: 'Verano: comprometerse', ico: '🔥', txt: 'Elige 1 construcción (casa, pega, familia) y ponle fecha + 1 paso/luna. Festeja cada avance chico. Pasión sin compromiso quema; con compromiso alumbra.' },
    { n: 'Otoño: podar y repartir', ico: '🍂', txt: 'Lista: qué guardo, qué suelto, a quién enseño. Suelta 1 cosa/mes (objeto, deuda chica, compromiso que enferma). Enseña 1 vez/luna. Pedir perdón también es cosecha.' },
    { n: 'Invierno: recordar y honrar', ico: '🕯️', txt: 'Cuenta 1 historia/luna junto a la mesa (Penco antiguo, familia, oficio). Duelo honrado: ritual, visita, vela. Soledad 2+ semanas con desgano: pide compañía (*4141 / CESFAM). Recordar juntos calienta.' },
    { n: 'La rueda personal', ico: '🎡', txt: 'Dibuja tu año en círculo: marca tus primaveras, veranos, otoños e inviernos (no solo por edad). Verás que ya giraste varias veces. Pregunta: ¿qué estación me toca honrar hoy?' }
  ],
  pracTitulo: '🧰 Tu estación esta luna',
  pracIntro: 'La rueda se celebra, no solo se entiende. <b>1 fiesta chica + 1 tarea</b> por luna.',
  prac: [
    { n: 'Ubica tu estación', ico: '📍', txt: '¿Brotas, rindes, podas o descansas? Lee tu tarjeta + vecinas. Escríbelo en 5 líneas: qué siembro, qué cosecho, qué suelto, qué descanso.' },
    { n: 'Fiesta de estación (Penco)', ico: '🎉', txt: 'Primavera: siembra algo (huerta, curso). Verano: muestra y festeja (comida, partido). Otoño: reparte (trueque, enseñanza). Invierno: recuerda (historias, fotos, 🗣️ Voz de los Abuelos). 1 festejo simple por estación une a la familia.' },
    { n: 'Huerta y manos', ico: '🌱', txt: 'Siembra 1, cuida 1, cosecha 1, comparte 1. Sin patio: maceta, hierbas, almácigo. Niños: riegan. Adultos: construyen. Mayores: enseñan. Ver 🌱 Huerta del calendario.' },
    { n: 'Poda de otoño', ico: '✂️', txt: 'Closet, papeles, deudas chicas, agenda: elige 1 y poda este mes. Dona lo bueno. Lo podado libera energía para lo que sí importa.' },
    { n: 'Fuego de invierno', ico: '🔥', txt: '1 tarde de historias/mate sin pantalla por luna. Llama a 1 mayor. Revisa casa de invierno: techo, estufa limpia, abrigo, luz. Descansar también es producir el próximo brote.' },
    { n: 'Honrar la fuente', ico: '🙏', txt: 'Tradición celta viva (Irlanda, Escocia, Gales, Bretaña): resumen educativo. Honra sin apropiarte: nombra la fuente (Imbolc, Beltane, Lughnasadh, Mabon, Samhain, Yule) y aprende de voces celtas si puedes. Aplica el espíritu (ciclos, tierra, comunidad) en el borde costero sin copiar ritos ajenos.' }
  ],
  espacioExtra: 'estacion',
  espacioExtraLabel: 'Vivo mi estación hoy (1-10)',
  bridges: [['celGoJuv', 'btnJuventud'], ['celGoAdu', 'btnAdultez'], ['celGoVejez', 'btnVejez'], ['celGoSep', 'btnSeptenios'], ['celGoKimun', 'btnKimun'], ['celGoGrat', 'btnGratitud']],
  bridgesLabel: '🔗 Sigue en tu calendario',
  bridgesTxt: 'Tu estación se vive mejor con tu etapa chilena al lado.'
},
/* ============ 13) EL VIAJE SUFI DEL NAFS ============ */
{
  key: 'suf', btn: 'btnSufi', btnTxt: '🌙 Viaje Sufí',
  dlg: 'sufiDialog', title: '🌙 La Tradición Sufí: El Viaje del Nafs (El Alma)',
  sub: 'En el misticismo islámico la vida es <b>alquimia interior</b> para purificar el <b>Nafs (ego o alma inferior)</b>: del alma que ordena el mal hasta el <b>alma en paz y perfecta</b>. Un mapa de 7 estaciones para ubicarte con compasión. Todo <b>privado y local</b>. <b>Educativo: no reemplaza guía espiritual ni terapia.</b>',
  kw: 'sufi nafs islam misticismo ammara lawwama mulhima mutmainna radiya mardiya kamila alma ego purificacion dhikr corazon',
  p: 'suf', tabNames: ['Guia', 'Cuerpo', 'Mente', 'Prac', 'Espacio'],
  tabLabels: ['🧭 Guía', '🌙 Las 7 Estaciones', '💛 Mente y Corazón', '🧰 Vida práctica', '📓 Mi espacio'],
  guiaTitulo: '🌙 Pulir el corazón: del impulso a la paz',
  intro: 'Nafs = tu yo que desea, teme y se defiende. El viaje no es matarlo: es <b>educarlo hasta que confía</b>. Caer y volver es parte del camino: cada estación te espera sin condena. Ubica tu estación hoy con honestidad amable.',
  fases: [
    { n: '1. Nafs al-Ammarah · ordena el mal', ico: '🔥', q: 'Dominada por instintos y deseos. Reacciono, culpo, quiero ya. Todos pasamos por aquí: es el punto de partida, no una sentencia.',
      cuerpo: 'Impulso se siente en el cuerpo: respiración corta, puño, prisa. Pausa y agua antes de actuar.',
      mente: 'Nombrar sin golpearse: quiero, temo, envidio. Es información, no identidad.',
      tip: '🌙 Regla de la pausa: 6 respiraciones antes de responder.' },
    { n: '2. Nafs al-Lawwamah · se auto-acusa', ico: '🪞', q: 'Despierta la conciencia y el arrepentimiento. Me duele lo que hice: buena señal. Tarea: reparar, no flagelarse.',
      cuerpo: 'Culpa tensa hombros y estómago: caminar, respirar, dormir ordenan.',
      mente: 'Arrepentir + reparar 1 cosa concreta. Culpa que repara sana; culpa que rumia enferma.',
      tip: '🌙 1 reparación chica por luna (perdón, pago, devolución).' },
    { n: '3. Nafs al-Mulhimah · inspirada', ico: '💡', q: 'Comienza a recibir intuiciones divinas. Hay destellos: sueños, señales, ideas buenas. Tarea: discernir y anotar, no creerse iluminado.',
      cuerpo: 'Inspiración llega con cuerpo descansado: duerme y pasea.',
      mente: 'Anota y contrasta con un sabio o amigo recto. Lo verdadero da paz duradera.',
      tip: '🌙 Cuaderno de intuiciones: 1 línea diaria.' },
    { n: '4. Nafs al-Mutmainnah · en paz', ico: '🕊️', q: 'Encuentra serenidad y confianza en lo divino. Acepta lo que llega sin pelear con todo. Tarea: sostener la paz en lo cotidiano.',
      cuerpo: 'Ritmo, respiración lenta, menos ruido. Paz también es dormir bien.',
      mente: 'Gratitud diaria + confianza. Lo que no controlo lo entrego.',
      tip: '🌙 3 gratitudes diarias (📓 Gratitud).' },
    { n: '5. Nafs ar-Radiyah · complacida', ico: '💛', q: 'Acepta todo lo que viene con gratitud. No resignación amarga: contento activo. Hasta lo difícil trae enseñanza.',
      cuerpo: 'Sonrisa, postura abierta, servicio. El cuerpo agradece moviéndose.',
      mente: 'Reencuadre: ¿qué me enseña esto? Agradecer también lo que no elegí.',
      tip: '🌙 1 queja transformada en gracias por semana.' },
    { n: '6. Nafs al-Mardiyyah · complaciente', ico: '🤲', q: 'Se vuelve instrumento de la voluntad divina. Ya no busco mi brillo: sirvo. Tarea: servicio constante y discreto.',
      cuerpo: 'Servicio con cuerpo cuidado: si me quemo no sirvo.',
      mente: 'Intención pura: hago el bien aunque nadie mire. Ego vigilado con humor.',
      tip: '🌙 1 servicio semanal sin vitrina.' },
    { n: '7. Nafs al-Kamilah · perfecta/pura', ico: '✨', q: 'Completud y unidad. Pocos llegan establemente: es faro, no meta para presumir. Quien llega, guía con presencia silenciosa y compasión total.',
      cuerpo: 'Simplicidad, descanso, naturaleza. El cuerpo es templo sereno.',
      mente: 'Unidad: todo es signo. Bendecir a todos, incluso al que daña (a distancia sana).',
      tip: '🌙 Bendice en silencio a 1 persona/día.' }
  ],
  mitos: '• "Nafs malo hay que matarlo" → se educa, no se mata: el deseo ordenado sirve.<br>• "Si caigo, volví a cero" → el viaje es espiral: cada vuelta sube con lo aprendido.<br>• "Paz es no sentir" → Mutmainnah siente todo y confía igual.<br>• "Santo no se equivoca" → el perfecto repara rápido y sin show.',
  uso: '1) Ubica tu estación sin castigarte (hoy mando yo o mando mi impulso?).<br>2) Lee tu tarjeta + la siguiente.<br>3) Practica 1 herramienta de <b>Mente</b>.<br>4) Haz 1 acto en <b>Vida práctica</b>.<br>5) Registra en <b>Mi espacio</b>.',
  familia: 'En casa hay varios nafs: el que explota, el que se culpa, el que repara. Norma sufí doméstica: pausa antes de gritar, reparación antes de dormir, gratitud en la mesa. Si hay gritos, control o miedo seguido, no es estación: es violencia (149 / 1455 / 133).',
  cuerpoTitulo: '🌙 Cuerpo que ayuda al corazón',
  cuerpoIntro: 'El Nafs se calma primero por el <b>cuerpo</b>: respiración, sueño, comida y movimiento.',
  cuerpo: [
    { n: 'Pausa de 6 respiraciones', ico: '🌬️', txt: 'Ammarah pide ya: inhala 4, exhala 6, 6 ciclos antes de responder, salir o comprar. Manos abiertas, pies en tierra, agua. 2 minutos evitan 2 meses de reparación. 🌬️ Respiración del calendario.' },
    { n: 'Dormir para no reaccionar', ico: '😴', txt: 'Cansado soy otro: misma hora, sin pantalla 45 min, pieza fresca. Si Lawwamah te desvela (culpa nocturna): escribe mañana reparo con 1 frase y duerme. Insomnio 3+ semanas: consulta.' },
    { n: 'Comer con medida', ico: '🥗', txt: 'Hambre e impulso son primos: horarios, proteína + fibra, agua antes que antojo, alcohol poco o nada. Ayuno solo si tu salud lo permite y con guía médica: no es castigo, es orden.' },
    { n: 'Mover el impulso', ico: '🚶', txt: 'Rabia, ansiedad o deseo fuerte: camina 20 min, barre, arregla algo. El cuerpo tramita lo que la cabeza repite. 150 min/semana + fuerza 2 veces. El impulso pasado por piernas se vuelve idea.' },
    { n: 'Corazón y chequeos', ico: '❤️', txt: 'Palpitaciones, presión alta u opresión seguidas: EMPA/CESFAM (presión, glicemia, corazón). Respiración no reemplaza control. Dolor al pecho, falta de aire o desmayo: 131.' },
    { n: 'Limpieza y orden (Tahara)', ico: '💧', txt: 'Aseo, ropa limpia, casa ventilada y cama hecha ordenan el Nafs. 10 min diarios de orden + ducha consciente + 1 rincón bello. Lo de afuera sostiene lo de adentro.' }
  ],
  menteTitulo: '💛 Del reproche a la confianza',
  menteIntro: 'Cada estación tiene su medicina. <b>Practica solo tu estación</b> este mes.',
  mente: [
    { n: 'Ammarah: nombrar el impulso', ico: '🏷️', txt: 'Di en voz baja: siento rabia/antojo/envidia, intensidad X/10, necesito Y. Escribe 3 líneas y espera 24 h para decidir en grande. Si rompes la promesa, repara sin golpearte y ajusta la regla.' },
    { n: 'Lawwamah: reparar, no rumiar', ico: '🤝', txt: 'Repara 1: perdón concreto + acto (pagar, devolver, ayudar). Carta no enviada si no puedes hablar. Rumia 2+ semanas con insomnio o desgano: acompáñalo (CESFAM / 🔁 Recapitulación). Culpa que repara, se va.' },
    { n: 'Mulhimah: discernir', ico: '🔦', txt: 'Anota intuición + fecha. Pregunta: ¿da paz duradera o euforia corta? ¿sirve a otros o solo a mi ego? Contrasta con 1 persona sabia. Lo verdadero se confirma en calma y en tiempo.' },
    { n: 'Mutmainnah y Radiyah: gratitud', ico: '🕊️', txt: '3 gratitudes diarias + 1 queja transformada/semana + dhikr o frase que calme (10 min). Aceptar no es aguantar maltrato: lo injusto se nombra y se pone límite con serenidad. Paz con límites dura.' },
    { n: 'Mardiyyah y Kamilah: servir', ico: '✨', txt: '1 servicio semanal discreto + bendición silenciosa diaria. Vigila el ego espiritual (contar lo bueno que hago lo desinfla). Guía con ejemplo: puntual, amable, cumplidor. El faro no grita: alumbra.' }
  ],
  pracTitulo: '🧰 Tu estación esta luna',
  pracIntro: 'La alquimia se hace en lo diario. <b>1 práctica por estación</b>, de a 1 luna.',
  prac: [
    { n: 'Ubica tu estación hoy', ico: '📍', txt: '¿Ordeno mal (1), me acuso (2), intuyo (3), confío (4), agradezco todo (5), sirvo (6) o uno (7)? Lee tu tarjeta + siguiente. Anota en 5 líneas: dónde estoy, qué me saca, qué me devuelve.' },
    { n: 'Regla de la pausa (1-2)', ico: '⏸️', txt: 'Pega en la puerta: respiro 6, tomo agua, respondo. Más caminata 20 min si hierve. Repara antes de dormir (mensaje, abrazo, orden). 1 semana de pausas cambia el clima de la casa.' },
    { n: 'Cuaderno del corazón (3-4)', ico: '📓', txt: '1 línea diaria: impulso, intuición o gratitud. Revisa cada luna llena: verás tu espiral (caídas más cortas, paz más larga). Comparte 1 aprendizaje/semana con alguien de confianza.' },
    { n: 'Servicio discreto (5-6)', ico: '🤲', txt: 'Elige 1 servicio fijo/semana (cuidar, cocinar, enseñar, limpiar) sin publicar. Hazlo excelente y en silencio. Si te pica contarlo, sonríe y sigue: el Nafs se pule en secreto.' },
    { n: 'Noche de perdón (todas)', ico: '🌙', txt: 'Antes de dormir: a quién bendigo, a quién perdono, qué reparo mañana (1 frase cada una). Duelo o culpa vieja atorada: 🕊️ Duelo + 🔁 Recapitulación + CESFAM si pesa semanas.' },
    { n: 'Honrar la fuente', ico: '🙏', txt: 'Tradición viva islámica-sufí: resumen educativo, no reemplaza maestros ni textos (Corán, Rumi, Al-Ghazali, Ibn Arabi). Honra sin apropiarte: no dirijas dhikr ni ceremonias sin guía autorizada, nombra la fuente y aprende de voces musulmanas. Aplica el espíritu (purificar intención, servir, agradecer) sin copiar formas ajenas.' }
  ],
  espacioExtra: 'pazcorazon',
  espacioExtraLabel: 'Paz del corazón hoy (1-10)',
  bridges: [['sufGoJuv', 'btnJuventud'], ['sufGoAdu', 'btnAdultez'], ['sufGoSep', 'btnSeptenios'], ['sufGoDuelo', 'btnDueloFull'], ['sufGoLakota', 'btnLakota'], ['sufGoGrat', 'btnGratitud']],
  bridgesLabel: '🔗 Sigue en tu calendario',
  bridgesTxt: 'Tu viaje interior se sostiene con etapas, duelo y gratitud.'
}]



/* Síntomas del climaterio (checklist del registro) */
var CLI_SINTOMAS = ['bochorno día', 'sudor nocturno', 'insomnio', 'ánimo bajo/irritable', 'ansiedad', 'niebla mental/olvidos', 'sequedad vaginal', 'bajo deseo', 'dolor articular', 'palpitaciones', 'sequedad piel/cabello', 'orina frecuente/urgencia'];

/* ---------------- CONSTRUCCIÓN GENÉRICA ---------------- */
function switchTab(p, name, names) {
  names.forEach(function (t) {
    var pg = $(p + t), b = $('tab' + p + t);
    if (pg) pg.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}
function cards(list) {
  return list.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + esc(c.txt) + '</p></div>';
  }).join('');
}
function fasesHTML(fases) {
  return fases.map(function (e) {
    return '<div class="si-card"><h4>' + e.ico + ' ' + esc(e.n) + '</h4><p>' + esc(e.q) + '</p>' +
      '<p><b>Cuerpo:</b> ' + esc(e.cuerpo) + '<br><b>Mente/vínculos:</b> ' + esc(e.mente) + '</p>' +
      '<p class="muted">' + esc(e.tip) + '</p></div>';
  }).join('');
}
function emoChipsHTML(p) {
  return EMOS_BASE.map(function (e) {
    return '<label class="check-row su-d16943"><input type="checkbox" class="' + p + '-emo" value="' + esc(e) + '"> ' + esc(e) + '</label>';
  }).join('');
}
function cliSintomasHTML() {
  return CLI_SINTOMAS.map(function (s) {
    return '<label class="check-row su-d16943"><input type="checkbox" class="cli-sin" value="' + esc(s) + '"> ' + esc(s) + '</label>';
  }).join('');
}

function buildDialogFor(cf) {
  var p = cf.p;
  var tabs = cf.tabNames.map(function (t, i) {
    return '<button type="button" id="tab' + p + t + '" class="btn' + (i === 0 ? ' btn-accent' : '') + ' su-30e741">' + cf.tabLabels[i] + '</button>';
  }).join('');

  var extraField = '';
  if (cf.key === 'cli') {
    extraField = '<p class="muted su-db6a1e">Síntomas de esta luna (marca los presentes):</p>' +
      '<div class="su-2fb621">' + cliSintomasHTML() + '</div>' +
      '<div class="conv-row su-7c6197"><label class="su-97445a">Intensidad máx (1-10) <input type="number" id="' + p + 'Inten" min="1" max="10" value="5"></label>' +
      '<label class="su-4b3de7">Qué me alivió <input type="text" id="' + p + 'Alivio" placeholder="ej: ventilador, caminar, mate" maxlength="60"></label></div>';
  } else {
    extraField = '<div class="conv-row su-7c6197"><label class="su-97445a">' + esc(cf.espacioExtraLabel) + ' <input type="range" id="' + p + 'Extra" min="1" max="10" value="6" class="su-046678"></label><span id="' + p + 'ExtraV" class="chip su-78a96b">6</span></div>';
  }

  var bridgesBtns = cf.bridges.map(function (b) {
    var label = b[2] || b[1].replace(/^btn/, '');
    return '<button type="button" id="' + b[0] + '" class="btn su-30e741">' + esc(label) + '</button>';
  }).join('');

  var body =
    '<div class="timer-tabs su-f7ad78">' + tabs + '</div>' +
    '<div id="' + p + 'Streak" class="menstrual-card su-39553d"></div>' +
    SOS_HTML +

    '<div id="' + p + cf.tabNames[0] + '">' +
    '<div class="si-card"><h4>🧭 ¿Qué es esta etapa?</h4><p>' + cf.intro + '</p></div>' +
    fasesHTML(cf.fases) +
    '<div class="discipline-grid">' +
    '<div class="discipline-card"><h4>🚫 Mitos que pesan</h4><p>' + cf.mitos + '</p></div>' +
    '<div class="discipline-card"><h4>🗺️ Cómo usar esta sección</h4><p>' + cf.uso + '</p></div>' +
    '</div>' +
    '<div class="si-card"><h4>👨‍👩‍👧 Para la familia</h4><p>' + cf.familia + '</p></div>' +
    '</div>' +

    '<div id="' + p + cf.tabNames[1] + '" class="hidden">' +
    '<div class="si-card"><h4>' + esc(cf.cuerpoTitulo || '💪 Lo esencial') + '</h4><p>' + cf.cuerpoIntro + '</p></div>' +
    cards(cf.cuerpo) +
    '</div>' +

    '<div id="' + p + cf.tabNames[2] + '" class="hidden">' +
    '<div class="si-card"><h4>' + esc(cf.menteTitulo || '🧠 Lo normal y lo que avisa') + '</h4><p>' + cf.menteIntro + '</p></div>' +
    cards(cf.mente) +
    '</div>' +

    '<div id="' + p + cf.tabNames[3] + '" class="hidden">' +
    '<div class="si-card"><h4>' + esc(cf.pracTitulo || '🧰 Papeles y decisiones') + '</h4><p>' + cf.pracIntro + '</p></div>' +
    cards(cf.prac) +
    '<div class="menstrual-card"><h4>' + esc(cf.bridgesLabel) + '</h4><p class="muted su-11a508">' + esc(cf.bridgesTxt) + '</p><div class="su-6157e8">' + bridgesBtns + '</div></div>' +
    '</div>' +

    '<div id="' + p + cf.tabNames[4] + '" class="hidden">' +
    '<div class="menstrual-card su-761d3a"><h4>💚 Chequeo — 1 minuto</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="' + p + 'Fecha"></label></div>' +
    '<div class="conv-row su-7c6197"><label class="su-97445a">Ánimo 1-10 <input type="range" id="' + p + 'Animo" min="1" max="10" value="6" class="su-046678"></label><span id="' + p + 'AnimoV" class="chip su-78a96b">6</span>' +
    '<label class="su-97445a">Energía 1-10 <input type="range" id="' + p + 'Energia" min="1" max="10" value="6" class="su-046678"></label><span id="' + p + 'EnergiaV" class="chip su-78a96b">6</span></div>' +
    '<div class="conv-row su-7c6197"><label class="su-97445a">Sueño anoche (h) <input type="number" id="' + p + 'Sueno" min="0" max="14" step="0.5" value="7"></label></div>' +
    extraField +
    '<p class="muted su-db6a1e">Emociones (marca las presentes):</p>' +
    '<div class="su-2fb621">' + emoChipsHTML(p) + '</div>' +
    '<label>Diario (5 líneas bastan) <textarea id="' + p + 'Nota" rows="3" placeholder="Hoy me sentí... / Me costó... / Mañana quiero..." maxlength="600"></textarea></label>' +
    '<div class="dlg-actions su-117179"><button type="button" id="' + p + 'CheckSave" class="btn btn-accent su-30e741">💾 Guardar chequeo</button></div></div>' +

    '<div class="menstrual-card su-761d3a"><h4>🎯 Mis metas de la luna (máx 3)</h4>' +
    '<p class="muted su-11a508">Chicas y medibles: "caminar 20 min × 3" mejor que "cuidarme más".</p>' +
    '<div class="conv-row"><label class="su-4b3de7">Meta <input type="text" id="' + p + 'MetaTxt" placeholder="ej: pedir hora EMPA" maxlength="80"></label></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="' + p + 'MetaAdd" class="btn btn-accent su-30e741">+ Agregar meta</button></div>' +
    '<div id="' + p + 'Metas" class="habits-list su-d2c171"></div></div>' +

    '<div class="menstrual-card"><h4>📓 Mi diario (últimos 15)</h4><div id="' + p + 'Log" class="habits-list su-5701fb"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="' + p + 'Stats" class="muted su-11a508"></span>' +
    '<span class="su-3de8f9"><button type="button" id="' + p + 'Share" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="' + p + 'Export" class="btn su-30e741">📥 Exportar</button>' +
    '<button type="button" id="' + p + 'Clear" class="btn su-214f75">🗑 Borrar</button></span></div></div>' +
    '</div>';

  makeDialog(cf.dlg, cf.title, cf.sub, body);
}

/* ---------------- RENDER POR ETAPA ---------------- */
function streakOf(key) {
  var c = stageStore(key).checks, s = 0, d = new Date();
  for (var i = 0; i < 365; i++) {
    var k;
    try { k = cal.fmtKey.format(d); } catch (e) { k = d.toISOString().slice(0, 10); }
    var day = c[k];
    var has = day && ((day.nota && day.nota.trim()) || day.animo);
    if (has) { s++; d.setDate(d.getDate() - 1); }
    else if (i === 0) { d.setDate(d.getDate() - 1); continue; }
    else break;
  }
  return s;
}
function renderStreak(cf) {
  var b = $(cf.p + 'Streak'); if (!b) return;
  var e = stageStore(cf.key);
  var n = Object.keys(e.checks || {}).length;
  var nm = (e.metas || []).filter(function (m) { return m.done; }).length;
  b.innerHTML = '<b>' + esc(cf.btnTxt) + ' · Racha:</b> ' + streakOf(cf.key) + ' días · <b>' + n + '</b> chequeos · <b>' + nm + '</b> metas logradas' +
    '<span class="muted su-11a508"> — relee cada luna: ahí se ven los avances</span>';
}
function dayLine(d) {
  var bits = 'ánimo ' + esc(String(d.animo || '-')) + '/10 · energía ' + esc(String(d.energia || '-')) + '/10' +
    (d.sueno != null && d.sueno !== '' ? ' · 😴 ' + esc(String(d.sueno)) + 'h' : '');
  if (d.extraLabel && (d.extra != null && d.extra !== '')) bits += ' · ' + esc(d.extraLabel) + ' ' + esc(String(d.extra)) + '/10';
  if (d.sintomas && d.sintomas.length) bits += '<br>Síntomas (' + esc(String(d.inten || '?')) + '/10): ' + esc(d.sintomas.join(', ')) + (d.alivio ? ' → alivia: ' + esc(d.alivio) : '');
  if (d.emociones && d.emociones.length) bits += '<br>Emociones: ' + esc(d.emociones.join(', '));
  if (d.nota) bits += '<br>' + esc(d.nota);
  return bits;
}
function renderLog(cf) {
  var p = cf.p;
  var box = $(p + 'Log'); if (!box) return;
  var c = stageStore(cf.key).checks;
  var keys = Object.keys(c).sort().reverse().slice(0, 15);
  box.innerHTML = keys.length ? keys.map(function (k) {
    return '<div class="hora-item su-0486f7"><span class="su-11a508"><b>' + esc(k) + '</b> · ' + dayLine(c[k] || {}) + '</span>' +
      '<button type="button" class="btn btn-icon ' + p + '-daydel" data-k="' + esc(k) + '">✕</button></div>';
  }).join('') : '<p class="muted su-e201a8">Sin chequeos. Guarda el primero arriba: 1 minuto.</p>';
  box.querySelectorAll('.' + p + '-daydel').forEach(function (x) {
    x.onclick = function () { var e = stageStore(cf.key); delete e.checks[x.dataset.k]; save(); renderStreak(cf); renderLog(cf); };
  });
  var st = $(p + 'Stats'); if (st) st.textContent = keys.length ? Object.keys(c).length + ' día(s) registrados' : '';
}
function renderMetas(cf) {
  var p = cf.p;
  var box = $(p + 'Metas'); if (!box) return;
  var ms = stageStore(cf.key).metas || [];
  if (!ms.length) { box.innerHTML = '<p class="muted su-e201a8">Sin metas. Agrega 1 pequeña arriba para esta luna.</p>'; return; }
  box.innerHTML = ms.map(function (m) {
    return '<div class="hora-item"><span class="su-6cb285">' + (m.done ? '✅ <s>' : '⬜ ') + esc(m.txt) + (m.done ? '</s>' : '') +
      '<br><span class="muted su-0d5be0">' + esc(m.fecha || '') + '</span></span>' +
      '<span class="su-49cd09"><button type="button" class="btn btn-icon ' + p + '-mdone" data-k="' + esc(m.id) + '" title="Marcar/desmarcar">✓</button>' +
      '<button type="button" class="btn btn-icon ' + p + '-mdel" data-k="' + esc(m.id) + '">✕</button></span></div>';
  }).join('');
  box.querySelectorAll('.' + p + '-mdone').forEach(function (x) {
    x.onclick = function () {
      var e = stageStore(cf.key);
      var m = (e.metas || []).filter(function (e2) { return e2.id === x.dataset.k; })[0];
      if (m) m.done = !m.done;
      save(m && m.done ? 'Meta lograda 🎉' : 'Guardado'); renderStreak(cf); renderMetas(cf);
    };
  });
  box.querySelectorAll('.' + p + '-mdel').forEach(function (x) {
    x.onclick = function () { var e = stageStore(cf.key); e.metas = (e.metas || []).filter(function (e2) { return e2.id !== x.dataset.k; }); save(); renderStreak(cf); renderMetas(cf); };
  });
}
function refresh(cf) { renderStreak(cf); renderLog(cf); renderMetas(cf); }

/* ---------------- SETUP POR ETAPA ---------------- */
function setupOne(cf) {
  var p = cf.p;
  buildDialogFor(cf);
  refresh(cf);

  var b = $(cf.btn);
  if (b) b.onclick = function () {
    if ($(p + 'Fecha') && !$(p + 'Fecha').value) $(p + 'Fecha').value = todayKey();
    refresh(cf);
    openDlg(cf.dlg);
  };

  cf.tabNames.forEach(function (t) {
    var tb = $('tab' + p + t);
    if (tb) tb.onclick = function () { switchTab(p, t, cf.tabNames); };
  });

  [['Animo', 'AnimoV'], ['Energia', 'EnergiaV'], ['Extra', 'ExtraV']].forEach(function (pair) {
    var r = $(p + pair[0]), v = $(p + pair[1]);
    if (r) r.oninput = function () { if (v) v.textContent = r.value; };
  });

  var sv = $(p + 'CheckSave');
  if (sv) sv.onclick = function () {
    var k = ($(p + 'Fecha') && $(p + 'Fecha').value) || todayKey();
    var emos = Array.prototype.map.call(document.querySelectorAll('.' + p + '-emo:checked'), function (x) { return x.value; });
    var rec = {
      animo: +($(p + 'Animo') ? $(p + 'Animo').value : 5),
      energia: +($(p + 'Energia') ? $(p + 'Energia').value : 5),
      sueno: (($(p + 'Sueno') || {}).value || ''),
      emociones: emos,
      nota: clean((($(p + 'Nota') || {}).value || '').trim(), 600)
    };
    if (cf.key === 'cli') {
      var sins = Array.prototype.map.call(document.querySelectorAll('.cli-sin:checked'), function (x) { return x.value; });
      rec.sintomas = sins;
      rec.inten = (($(p + 'Inten') || {}).value || '');
      rec.alivio = clean((($(p + 'Alivio') || {}).value || '').trim(), 60);
    } else {
      rec.extra = (($(p + 'Extra') || {}).value || '');
      rec.extraLabel = cf.espacioExtraLabel || '';
    }
    stageStore(cf.key).checks[k] = rec;
    save('Guardado ✓');
    if ($(p + 'Nota')) $(p + 'Nota').value = '';
    document.querySelectorAll('.' + p + '-emo:checked').forEach(function (x) { x.checked = false; });
    if (cf.key === 'cli') document.querySelectorAll('.cli-sin:checked').forEach(function (x) { x.checked = false; });
    refresh(cf);
  };

  var ma = $(p + 'MetaAdd');
  if (ma) ma.onclick = function () {
    var t = clean((($(p + 'MetaTxt') || {}).value || '').trim(), 80);
    if (!t) return alert('Escribe tu meta primero');
    var e = stageStore(cf.key);
    if ((e.metas || []).filter(function (m) { return !m.done; }).length >= 3) return alert('Máximo 3 metas activas: termina o borra una para sumar otra.');
    e.metas.push({ id: uid(p + 'm'), fecha: todayKey(), txt: t, done: false });
    save('Meta guardada 🎯');
    if ($(p + 'MetaTxt')) $(p + 'MetaTxt').value = '';
    refresh(cf);
  };

  cf.bridges.forEach(function (br) {
    var x = $(br[0]);
    if (x) x.onclick = function () { gotoBtn(br[1]); };
  });

  var sh = $(p + 'Share');
  if (sh) sh.onclick = async function () {
    var c = stageStore(cf.key).checks;
    var keys = Object.keys(c).sort().reverse().slice(0, 7);
    var t = keys.length ? (cf.btnTxt + ' · mi semana\n' + keys.map(function (k) {
      var d = c[k]; return '• ' + k + ': ánimo ' + d.animo + '/10, energía ' + d.energia + '/10' + (d.nota ? ' — ' + d.nota : '');
    }).join('\n')) : (cf.btnTxt + ': sin chequeos aún');
    await share('Mi espacio', t);
  };
  var ex = $(p + 'Export');
  if (ex) ex.onclick = async function () {
    var e = stageStore(cf.key);
    var t = cf.title + ' — exportación ' + todayKey() + '\n\nCHEQUEOS\n' +
      Object.keys(e.checks).sort().map(function (k) {
        var d = e.checks[k];
        return k + ' | ánimo ' + d.animo + ' | energía ' + d.energia + ' | sueño ' + (d.sueno || '-') + 'h' +
          (d.extra ? ' | ' + (d.extraLabel || 'extra') + ' ' + d.extra : '') +
          (d.sintomas && d.sintomas.length ? ' | síntomas(' + (d.inten || '?') + '): ' + d.sintomas.join(',') + (d.alivio ? ' → ' + d.alivio : '') : '') +
          ' | ' + (d.emociones || []).join(',') + ' | ' + (d.nota || '');
      }).join('\n') +
      '\n\nMETAS\n' + (e.metas || []).map(function (m) { return (m.done ? '[x] ' : '[ ] ') + m.txt + ' (' + m.fecha + ')'; }).join('\n');
    await share('Exportar ' + cf.btnTxt, t);
  };
  var cl = $(p + 'Clear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu Mi espacio de ' + cf.btnTxt + ' (chequeos y metas)?')) return;
    try { var u = userData(); if (u && u.etapasVida && u.etapasVida[cf.key]) u.etapasVida[cf.key] = { checks: {}, metas: [] }; } catch (e) {}
    save(); refresh(cf);
  };
}

/* ---------------- SETUP GLOBAL ---------------- */
var NEW_BTNS = [
  { id: 'btnJuventud', txt: '🌅 Juventud', kw: '' },
  { id: 'btnAdultez', txt: '🏠 Adultez', kw: '' },
  { id: 'btnClimaterio', txt: '🔥 Climaterio', kw: '' },
  { id: 'btnVejez', txt: '🦉 Vejez Sabia', kw: '' },
  { id: 'btnSeptenios', txt: '🌀 Septenios', kw: 'septenios septenio ciclos 7 siete anos biografia' },
  { id: 'btnLakota', txt: '🙏 Camino Lakota', kw: 'lakota sioux bufalo blanco belleza wicasa vision' },
  { id: 'btnKimun', txt: '🌿 Ciclo Kimün', kw: 'kimun mapuche lafkenche newen etapas' },
  { id: 'btnAshramas', txt: '🕉️ Ashramas Hindúes', kw: 'ashrama hindu india dharma brahmacharya grihastha vanaprastha sannyasa' },
  { id: 'btnConfucio', txt: '🏮 Décadas Confucio', kw: 'confucio china analectas decadas mandato cielo' },
  { id: 'btnAndina', txt: '⛰️ Cosmovisión Andina', kw: 'andina quechua llankay yachay munay ayllu' },
  { id: 'btnJung', txt: '🧭 Estadios Jung', kw: 'jung arquetipo individuacion atleta guerrero estadista espiritu' },
  { id: 'btnCelta', txt: '🍀 Rueda Celta', kw: 'celta rueda estaciones imbolc beltane samhain mabon' },
  { id: 'btnSufi', txt: '🌙 Viaje Sufí', kw: 'sufi nafs islam alma ego purificacion' }
];

function injectButtons() {
  try {
    var HOME = { btnJuventud: ['cuerpo', 'etapas'], btnClimaterio: ['cuerpo', 'ciclos'], btnAdultez: ['cuerpo', 'etapas'], btnVejez: ['cuerpo', 'etapas'], btnSeptenios: ['cuerpo', 'etapas'], btnLakota: ['cuerpo', 'etapas'], btnKimun: ['cuerpo', 'etapas'], btnAshramas: ['cuerpo', 'etapas'], btnConfucio: ['cuerpo', 'etapas'], btnAndina: ['cuerpo', 'etapas'], btnJung: ['cuerpo', 'etapas'], btnCelta: ['cuerpo', 'etapas'], btnSufi: ['cuerpo', 'etapas'] };
    ETAPAS_CONF.forEach(function (cf) {
      if ($(cf.btn)) {
        // migrar a su grupo/sub nuevo si quedó en una ubicación vieja
        // (p. ej. Juventud en cuerpo|ciclos, Adultez/Vejez en hogar|familia)
        try {
          var home = HOME[cf.btn];
          if (home) {
            var cur = $(cf.btn);
            var curG = cur.closest ? cur.closest('.action-group') : null;
            var curName = curG && curG.getAttribute ? curG.getAttribute('data-group') : null;
            var curSub = cur.dataset ? (cur.dataset.sub || cur.getAttribute('data-sub')) : cur.getAttribute('data-sub');
            if (curName && (curName !== home[0] || curSub !== home[1])) {
              var gd = document.querySelector('.action-group[data-group="' + home[0] + '"] .group-btns');
              if (gd && curName !== home[0]) gd.appendChild(cur);
              try { cur.setAttribute('data-sub', home[1]); if (cur.dataset) cur.dataset.sub = home[1]; } catch (eS) {}
            }
            try { if (typeof BTN_HOME !== 'undefined') BTN_HOME[cf.btn] = home; } catch (eH) {}
          }
        } catch (eM) {}
        return;
      }
      var home2 = HOME[cf.btn] || ['hogar', 'familia'];
      var g = document.querySelector('.action-group[data-group="' + home2[0] + '"] .group-btns');
      if (!g) g = document.querySelector('.action-group[data-group="hogar"] .group-btns');
      if (!g) return;
      var btn = document.createElement('button');
      btn.id = cf.btn; btn.className = 'btn'; btn.type = 'button';
      btn.textContent = cf.btnTxt;
      btn.setAttribute('data-keywords', cf.kw);
      try { btn.setAttribute('data-sub', home2[1]); } catch (eS) {}
      g.appendChild(btn);
    });
  } catch (e) {}
  try {
    if (typeof ALL_BTNS !== 'undefined') {
      ETAPAS_CONF.forEach(function (cf) { if (ALL_BTNS.indexOf(cf.btn) < 0) ALL_BTNS.push(cf.btn); });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ETAPAS_CONF.forEach(function (cf) {
        Object.keys(PRESETS).forEach(function (pr) {
          if (!PRESETS[pr]) return;
          if (pr === 'todo' || pr === 'adulto') PRESETS[pr][cf.btn] = true;
          else if (pr === 'adolescente' || pr === 'estudiante') PRESETS[pr][cf.btn] = (cf.key === 'juv' || cf.key === 'sep') ? true : false;
          else if (pr === 'mayor') PRESETS[pr][cf.btn] = (cf.key !== 'juv');
          else if (pr === 'salud') PRESETS[pr][cf.btn] = (cf.key === 'adu' || cf.key === 'cli' || cf.key === 'vej' || cf.key === 'sep');
          else if (pr === 'docente') PRESETS[pr][cf.btn] = false;
          else if (PRESETS[pr] && !(cf.btn in PRESETS[pr])) PRESETS[pr][cf.btn] = true;
        });
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
}

function injectConfigChecks() {
  try {
    var groups = document.querySelectorAll('#configDialog .config-group');
    groups.forEach(function (gr) {
      var h = gr.querySelector('h5');
      if (!h) return;
      var t = h.textContent || '';
      var esCuerpo = (t.indexOf('Cuerpo') >= 0);
      var esHogar = (t.indexOf('Hogar') >= 0);
      if (!esCuerpo && !esHogar) return;
      ETAPAS_CONF.forEach(function (cf) {
        if (gr.querySelector('input[data-btn="' + cf.btn + '"]')) return;
        var lab = document.createElement('label');
        lab.className = 'check-row';
        lab.innerHTML = '<input type="checkbox" data-btn="' + cf.btn + '"> ' + esc(cf.btnTxt);
        gr.appendChild(lab);
        try {
          var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
          lab.querySelector('input').checked = !vis || vis[cf.btn] !== false;
          lab.querySelector('input').onchange = function () {
            try {
              var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
              if (DATAref) {
                DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                DATAref.config.visible[cf.btn] = lab.querySelector('input').checked;
                if (typeof scheduleSave === 'function') scheduleSave();
                if (typeof applyVisibility === 'function') applyVisibility();
              }
            } catch (e2) {}
          };
        } catch (e2) {}
      });
    });
  } catch (e) {}
}

function setup() {
  injectButtons();
  injectConfigChecks();
  ETAPAS_CONF.forEach(setupOne);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 500); });
else setTimeout(setup, 500);

})();
