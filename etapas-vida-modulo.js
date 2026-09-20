/* ============================================================
   ETAPAS DE LA VIDA — Calendario 13 Lunas (Penco · Bío-Bío)
   Completa el ciclo junto a 🧒 Crianza (0-12, nuevos-modulos.js)
   y 🌱 Adolescencia (10-19, adolescencia-modulo.js):

     1) 🌅 Juventud (20-39) ....... btnJuventud / juventudDialog
     2) 🏠 Adultez (35-59) ........ btnAdultez / adultezDialog
     3) 🔥 Climaterio (45-64) ..... btnClimaterio / climaterioDialog
     4) 🦉 Vejez Sabia (60+) ...... btnVejez / vejezDialog

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
var SOS_HTML = '<div class="si-card" style="border-left:3px solid #e76e8a"><h4>🆘 Si la estás pasando mal ahora</h4>' +
  '<p style="font-size:12px">No tienes que aguantarlo solo/a: <b>*4141</b> prevención del suicidio (24 h, gratis) · <b>149</b> Fono Familia · <b>1455</b> violencia · <b>600 360 7777</b> Salud Responde · <b>800 400 035</b> SENAMA (personas mayores) · En Penco: tu <b>CESFAM</b>. Peligro inmediato: <b>133</b> / <b>131</b> SAMU.</p></div>';

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
}
];

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
    return '<label class="check-row" style="margin:2px 8px 2px 0;font-size:12px"><input type="checkbox" class="' + p + '-emo" value="' + esc(e) + '"> ' + esc(e) + '</label>';
  }).join('');
}
function cliSintomasHTML() {
  return CLI_SINTOMAS.map(function (s) {
    return '<label class="check-row" style="margin:2px 8px 2px 0;font-size:12px"><input type="checkbox" class="cli-sin" value="' + esc(s) + '"> ' + esc(s) + '</label>';
  }).join('');
}

function buildDialogFor(cf) {
  var p = cf.p;
  var tabs = cf.tabNames.map(function (t, i) {
    return '<button type="button" id="tab' + p + t + '" class="btn' + (i === 0 ? ' btn-accent' : '') + '" style="width:auto">' + cf.tabLabels[i] + '</button>';
  }).join('');

  var extraField = '';
  if (cf.key === 'cli') {
    extraField = '<p class="muted" style="font-size:11px;margin:6px 0 4px">Síntomas de esta luna (marca los presentes):</p>' +
      '<div style="display:flex;flex-wrap:wrap">' + cliSintomasHTML() + '</div>' +
      '<div class="conv-row" style="align-items:center"><label style="flex:1">Intensidad máx (1-10) <input type="number" id="' + p + 'Inten" min="1" max="10" value="5"></label>' +
      '<label style="flex:2">Qué me alivió <input type="text" id="' + p + 'Alivio" placeholder="ej: ventilador, caminar, mate" maxlength="60"></label></div>';
  } else {
    extraField = '<div class="conv-row" style="align-items:center"><label style="flex:1">' + esc(cf.espacioExtraLabel) + ' <input type="range" id="' + p + 'Extra" min="1" max="10" value="6" style="width:100%"></label><span id="' + p + 'ExtraV" class="chip" style="min-width:44px;text-align:center">6</span></div>';
  }

  var bridgesBtns = cf.bridges.map(function (b) {
    var label = b[2] || b[1].replace(/^btn/, '');
    return '<button type="button" id="' + b[0] + '" class="btn" style="width:auto">' + esc(label) + '</button>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin:12px 0 10px;flex-wrap:wrap">' + tabs + '</div>' +
    '<div id="' + p + 'Streak" class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px"></div>' +
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
    '<div class="si-card"><h4>💪 Lo esencial</h4><p>' + cf.cuerpoIntro + '</p></div>' +
    cards(cf.cuerpo) +
    '</div>' +

    '<div id="' + p + cf.tabNames[2] + '" class="hidden">' +
    '<div class="si-card"><h4>🧠 Lo normal y lo que avisa</h4><p>' + cf.menteIntro + '</p></div>' +
    cards(cf.mente) +
    '</div>' +

    '<div id="' + p + cf.tabNames[3] + '" class="hidden">' +
    '<div class="si-card"><h4>🧰 Papeles y decisiones</h4><p>' + cf.pracIntro + '</p></div>' +
    cards(cf.prac) +
    '<div class="menstrual-card"><h4>' + esc(cf.bridgesLabel) + '</h4><p class="muted" style="font-size:11px">' + esc(cf.bridgesTxt) + '</p><div style="display:flex;gap:6px;flex-wrap:wrap">' + bridgesBtns + '</div></div>' +
    '</div>' +

    '<div id="' + p + cf.tabNames[4] + '" class="hidden">' +
    '<div class="menstrual-card" style="margin-bottom:10px"><h4>💚 Chequeo — 1 minuto</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="' + p + 'Fecha"></label></div>' +
    '<div class="conv-row" style="align-items:center"><label style="flex:1">Ánimo 1-10 <input type="range" id="' + p + 'Animo" min="1" max="10" value="6" style="width:100%"></label><span id="' + p + 'AnimoV" class="chip" style="min-width:44px;text-align:center">6</span>' +
    '<label style="flex:1">Energía 1-10 <input type="range" id="' + p + 'Energia" min="1" max="10" value="6" style="width:100%"></label><span id="' + p + 'EnergiaV" class="chip" style="min-width:44px;text-align:center">6</span></div>' +
    '<div class="conv-row" style="align-items:center"><label style="flex:1">Sueño anoche (h) <input type="number" id="' + p + 'Sueno" min="0" max="14" step="0.5" value="7"></label></div>' +
    extraField +
    '<p class="muted" style="font-size:11px;margin:6px 0 4px">Emociones (marca las presentes):</p>' +
    '<div style="display:flex;flex-wrap:wrap">' + emoChipsHTML(p) + '</div>' +
    '<label>Diario (5 líneas bastan) <textarea id="' + p + 'Nota" rows="3" placeholder="Hoy me sentí... / Me costó... / Mañana quiero..." maxlength="600"></textarea></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="' + p + 'CheckSave" class="btn btn-accent" style="width:auto">💾 Guardar chequeo</button></div></div>' +

    '<div class="menstrual-card" style="margin-bottom:10px"><h4>🎯 Mis metas de la luna (máx 3)</h4>' +
    '<p class="muted" style="font-size:11px">Chicas y medibles: "caminar 20 min × 3" mejor que "cuidarme más".</p>' +
    '<div class="conv-row"><label style="flex:2">Meta <input type="text" id="' + p + 'MetaTxt" placeholder="ej: pedir hora EMPA" maxlength="80"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="' + p + 'MetaAdd" class="btn btn-accent" style="width:auto">+ Agregar meta</button></div>' +
    '<div id="' + p + 'Metas" class="habits-list" style="margin-top:10px"></div></div>' +

    '<div class="menstrual-card"><h4>📓 Mi diario (últimos 15)</h4><div id="' + p + 'Log" class="habits-list" style="max-height:240px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="' + p + 'Stats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="' + p + 'Share" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="' + p + 'Export" class="btn" style="width:auto">📥 Exportar</button>' +
    '<button type="button" id="' + p + 'Clear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +
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
    '<span class="muted" style="font-size:11px"> — relee cada luna: ahí se ven los avances</span>';
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
    return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(k) + '</b> · ' + dayLine(c[k] || {}) + '</span>' +
      '<button type="button" class="btn btn-icon ' + p + '-daydel" data-k="' + esc(k) + '">✕</button></div>';
  }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin chequeos. Guarda el primero arriba: 1 minuto.</p>';
  box.querySelectorAll('.' + p + '-daydel').forEach(function (x) {
    x.onclick = function () { var e = stageStore(cf.key); delete e.checks[x.dataset.k]; save(); renderStreak(cf); renderLog(cf); };
  });
  var st = $(p + 'Stats'); if (st) st.textContent = keys.length ? Object.keys(c).length + ' día(s) registrados' : '';
}
function renderMetas(cf) {
  var p = cf.p;
  var box = $(p + 'Metas'); if (!box) return;
  var ms = stageStore(cf.key).metas || [];
  if (!ms.length) { box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin metas. Agrega 1 pequeña arriba para esta luna.</p>'; return; }
  box.innerHTML = ms.map(function (m) {
    return '<div class="hora-item"><span style="font-size:12px">' + (m.done ? '✅ <s>' : '⬜ ') + esc(m.txt) + (m.done ? '</s>' : '') +
      '<br><span class="muted" style="font-size:10px">' + esc(m.fecha || '') + '</span></span>' +
      '<span style="display:flex;gap:6px"><button type="button" class="btn btn-icon ' + p + '-mdone" data-k="' + esc(m.id) + '" title="Marcar/desmarcar">✓</button>' +
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
  { id: 'btnVejez', txt: '🦉 Vejez Sabia', kw: '' }
];

function injectButtons() {
  try {
    var HOME = { btnJuventud: ['cuerpo', 'ciclos'], btnClimaterio: ['cuerpo', 'ciclos'], btnAdultez: ['linaje', 'familia'], btnVejez: ['linaje', 'familia'] };
    ETAPAS_CONF.forEach(function (cf) {
      if ($(cf.btn)) {
        // migrar a su grupo nuevo si quedó en un grupo viejo
        try {
          var home = HOME[cf.btn];
          if (home) {
            var cur = $(cf.btn);
            var curG = cur.closest ? cur.closest('.action-group') : null;
            var curName = curG && curG.getAttribute ? curG.getAttribute('data-group') : null;
            if (curName && curName !== home[0]) {
              var gd = document.querySelector('.action-group[data-group="' + home[0] + '"] .group-btns');
              if (gd) { gd.appendChild(cur); try { cur.setAttribute('data-sub', home[1]); } catch (eS) {} }
            }
          }
        } catch (eM) {}
        return;
      }
      var home2 = HOME[cf.btn] || ['linaje', 'familia'];
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
          else if (pr === 'infantil' || pr === 'adolescente' || pr === 'estudiante') PRESETS[pr][cf.btn] = (cf.key === 'juv' && pr === 'adolescente') ? true : false;
          else if (pr === 'mayor') PRESETS[pr][cf.btn] = (cf.key !== 'juv');
          else if (pr === 'salud') PRESETS[pr][cf.btn] = (cf.key === 'adu' || cf.key === 'cli' || cf.key === 'vej');
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
      var esLinaje = (t.indexOf('Linaje') >= 0 || t.indexOf('Interior') >= 0);
      if (!esCuerpo && !esLinaje) return;
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
