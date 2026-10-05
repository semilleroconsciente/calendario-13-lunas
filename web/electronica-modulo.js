/* ============================================================
   ELECTRONICA — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección dentro de Hogar y Vida Práctica > Energía y Taller:
   - Botón btnElectronica (inyectado en grupo hogar, sub energia,
     junto a Consumo eléctrico / Mecánica / Domótica)
   - Diálogo electronicaDialog con 6 pestañas:
     1) 📘 Guía base (seguridad, herramientas, soldar, antiestática)
     2) 🔌 Componentes (fichas: qué es, cómo probar, falla típica)
     3) 📐 Circuitos (Ohm, serie/paralelo, protoboard, fuentes,
         + calculadoras offline: Ohm, potencia, divisor, LED)
     4) 🛠️ Proyectos (8 proyectos paso a paso de ferretería/casa)
     5) 📏 Medir (multímetro + diagnóstico en 5 pasos + pilas/fusibles)
     6) 📓 Mi banco (inventario + bitácora reparaciones + chequeo)
   - Todo local y privado por usuario: userData().electronica
     { inventario:[], bitacora:[], checks:{} }
   - 100% offline. Enfoque Chile 220V + SEC: tablero y 220V directo
     solo con eléctrico autorizado; aquí se trabaja en BAJA tensión
     (pilas, 5V, 12V) salvo medir con cuidado lo ya armado.
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
  try { return cal.fmtKey.format(new Date()); } catch (e) {
    var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { inventario: [], bitacora: [], checks: {} };
    if (!u.electronica) u.electronica = { inventario: [], bitacora: [], checks: {} };
    var m = u.electronica;
    if (!Array.isArray(m.inventario)) m.inventario = [];
    if (!Array.isArray(m.bitacora)) m.bitacora = [];
    if (!m.checks || typeof m.checks !== 'object' || Array.isArray(m.checks)) m.checks = {};
    return m;
  } catch (e2) { return { inventario: [], bitacora: [], checks: {} }; }
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

/* ---------------- DATOS ---------------- */
var GUIAS = [
  { n: 'Seguridad primero (lee siempre)', ico: '⛑️', txt: 'Aquí trabajamos en BAJA tensión (pilas AA/AAA 1.5V, 9V, USB 5V, fuentes 12V). La red 220V de la casa NO se abre ni se modifica: eso es tablero + eléctrico autorizado SEC (ver 🏠 Domótica y ⚡ Consumo eléctrico). Reglas: 1) Un circuito a la vez, manos secas, mesa despejada. 2) Desconecta la fuente antes de mover cables. 3) Condensadores grandes (fuentes, microondas, soldadoras) guardan carga: no los toques sin descargar con resistencia. 4) Nada de inventos en enchufes 220V, zapatillas ni calefones. 5) Baterías de litio hinchadas, calientes o con olor dulce = fuera de servicio, al punto limpio e-waste, nunca a la basura.' },
  { n: 'Tu banco mínimo ($20–40 mil ferretería)', ico: '🧰', txt: 'Multímetro digital barato (mide V, Ω, continuidad con pito), cautín 30–60W + estaño 0.8mm + esponja, protoboard + cables dupont/jumper, alicate de corte + pelacables, destornilladores precisión, pinza, lupa o celu con zoom, huincha aisladora + termocontraíble, pilas AA/9V + portapilas, resistencias surtidas + LEDs + 1 Arduino Nano o ESP32 para practicar. Con eso reparas el 70%: cables cortados, soldaduras frías, fusibles, interruptores, pilas y cargadores.' },
  { n: 'Cómo leer un componente (sin memorizar todo)', ico: '🔍', txt: 'RESISTENCIAS: bandas de color (marrón-negro-rojo = 1kΩ). CONDENSADORES: número 104 = 100nF, electrolíticos con franja = negativo. DIODOS/LED: la pata larga es + (ánodo); solo conducen en un sentido. TRANSISTORES: 3 patas (base-colector-emisor); el código impreso se busca en su hoja de datos. INTEGRADOS: muesca o punto = pin 1. Regla de oro: saca foto ANTES de desoldar; anota colores y posición.' },
  { n: 'Soldar bien en 5 pasos (y sin quemar nada)', ico: '🔥', txt: '1) Punta limpia y estañada (brillante, no negra). 2) Calienta la UNIÓN 2–3 seg (no el estaño solo). 3) Toca con estaño la unión caliente: debe fluir como agua, cono brillante. 4) Saca cautín, no muevas 3 seg (soldadura fría = opaca y granulada = falla). 5) Corta sobrante, revisa con lupa: sin puentes entre pistas. Ventila (humo fuera, no lo respires), apoya el cautín en su base, nunca en la mesa. Practica primero uniendo 10 cables viejos.' },
  { n: 'Antiestática y humedad de Penco', ico: '🌧️', txt: 'La humedad sulfata contactos y el sur trae cortes que queman fuentes. Guarda placas en bolsa ziploc con sílica, cajita hermética (no a la intemperie del patio). Antes de tocar un chip: tócate la palma a algo metálico grande (descargas tu estática). En cortes: desconecta equipos sensibles (PC, TV, consolas); vuelve a enchufar 5 min DESPUÉS que vuelve la luz (evitas el pico). Un protector de sobretensión decente ($15–25 mil) vale más que 3 alargadores baratos.' },
  { n: 'Luna y banco (ritmo de mantención)', ico: '🌙', txt: 'Menguante: mantención programada (limpiar polvo con brocha, reapretar borneras, revisar pilas, medir fuentes). Creciente–llena: probar y observar (¿parpadea? ¿se calienta? ¿suena?). Cada 3 lunas: revisa cargadores y cables (pelados = se cambian hoy). Invierno (Pukem): protege de humedad + revisa UPS/linternas. Verano (Walüng): ventilación de fuentes y focos LED (el calor mata LEDs).' }
];

var COMP = [
  { n: 'Resistencia', ico: '➖', para: 'Limitar corriente (proteger LEDs), divisor de voltaje, pull-up/down.', mat: 'Multímetro en Ω, tabla de colores.', como: 'Mide FUERA del circuito (una pata levantada) o marca mal por caminos paralelos. Valor = bandas: negro 0, marrón 1, rojo 2, naranja 3, amarillo 4, verde 5, azul 6, violeta 7, gris 8, blanco 9; multiplicador igual; dorado ±5%. Si mide infinito = abierta (quemada); si mide 0 = revisar (rara vez se ponen en corto).', nota: 'Potencia manda: 1/4W para señales/LED; si se calienta al tocar, sube a 1/2W o 1W o reparte.', cuidado: 'Resistencia negra/rajada + olor = hubo sobrecorriente: busca el corto antes de cambiarla o se quema de nuevo.' },
  { n: 'LED y diodo', ico: '💡', para: 'Luz, piloto, protección contra inversión de polaridad.', mat: 'Multímetro con modo diodo (símbolo ▶|), pila 3V + resistencia 220Ω para probar.', como: 'LED: pata larga +. En modo diodo debe encender tenue en un sentido y nada al revés. Caída típica: rojo ~1.8V, verde/amarillo ~2V, blanco/azul ~3V. SIEMPRE con resistencia en serie (ver calculadora LED): LED directo a 5V/12V = muere en segundos.', nota: 'Diodo 1N4007 (rectificador) y 1N4148 (señal): 0.5–0.7V en directo, infinito al revés. En corto ambos lados = malo.', cuidado: 'Tira LED 12V que parpadea por tramos = tramo o soldadura, no toda la tira: revisa uniones.' },
  { n: 'Condensador / capacitor', ico: '🔋', para: 'Filtrar, suavizar fuente, arranque de motores.', mat: 'Multímetro (algunos miden nF/µF), destornillador aislado + resistencia 1k para descargar.', como: 'DESCARGA primero (cortocircuita con resistencia 1k unos segundos, nunca con destornillador directo en grandes). Electrolítico hinchado, con costra o base abultada = muerto (típico en fuentes y teles que no prenden). Cerámico rajado = cambio directo. Mide capacidad si tu tester lo permite: ±20% es normal.', nota: 'Respeta voltaje igual o mayor (ej 16V→25V OK) y polaridad en electrolíticos (franja = negativo).', cuidado: 'Fuente con zumbido + se apaga = condensadores de salida secos. Si no sabes soldar en fuente conmutada, llévala a técnico.' },
  { n: 'Transistor (BJT / MOSFET)', ico: '🔀', para: 'Interruptor o amplificador: prende motores, relés, tiras LED con Arduino.', mat: 'Multímetro modo diodo, hoja de datos del código (ej 2N2222, BC547, IRFZ44N).', como: 'BJT NPN: base-emisor y base-colector se comportan como 2 diodos (~0.6V). Si todo da 0 o todo infinito = quemado. MOSFET: mide que no haya corto entre drenaje y surtidor; el gate no debe conducir a los otros (infinito). Prueba viva: conmutación con LED + resistencia en protoboard.', nota: 'El que más muere es el de potencia sin disipador: si se calienta que quema el dedo (>60°C), necesita disipador o ventilación.', cuidado: 'MOSFET se mata con estática: no lo toques sin descargarte y no lo pruebes con fuente alta de una.' },
  { n: 'Interruptor, pulsador, relé', ico: '🔘', para: 'Prender/apagar, cambiar modos, aislar 220V con bobina de 5/12V.', mat: 'Multímetro en continuidad (pito).', como: 'Interruptor: debe pitar en ON y callar en OFF; si raspa o pita a medias = sucio o gastado (limpia-contactos o cambio). Relé: bobina debe medir 50–500Ω (no 0 ni infinito); al energizar bobina con su voltaje se escucha CLAC y los contactos cambian. Sin CLAC = bobina muerta.', nota: 'Relé es el puente seguro: con 5V controlas 220V SIN mezclar. Módulo relé + Arduino = automatización casera (ver 🛠️ Proyectos).', cuidado: 'Contactos 220V picados/negros = no los lijes para “salvarlos” en cargas grandes: se cambian.' },
  { n: 'Pilas, baterías y fuentes', ico: '🔌', para: 'Energía de todo: controles, juguetes, linternas, respaldo.', mat: 'Multímetro en V DC, cargador original.', como: 'Alcalina AA nueva: 1.5–1.6V; bajo 1.2V = cambio. Recargable NiMH llena: ~1.4V. Litio 18650 llena: 4.2V, vacía 3.0V (bajo eso se daña). Fuente 12V debe dar 11.5–12.5V SIN carga y no caerse bajo 11V CON carga; si se cae = fuente agotada o sobrecarga. Prueba con carga real (foco/motor), no solo en vacío.', nota: '18650 sin protección + cargador chino = riesgo de incendio. Usa celdas con PCB y cargador con corte.', cuidado: 'Nunca cargues litio sobre cama/sillón ni de noche sin supervisión. Hinchada = punto limpio, no basura.' },
  { n: 'Fusible y protección', ico: '🧷', para: 'El que se sacrifica para salvar el equipo (y la casa).', mat: 'Multímetro en continuidad.', como: 'Debe pitar (0Ω). Si no pita = quemado. Cambia por EL MISMO valor (ej T2A 250V): ni más grande (“para que no se queme”) ni con alambre/papel aluminio (incendio seguro). Si el nuevo se quema al tiro = hay corto aguas abajo: no insistas, diagnostica.', nota: 'Lleva 2–3 fusibles de repuesto de tus equipos (alargador, amplificador, cargador). Cuestan $500 y salvan $50 mil.', cuidado: 'Fusible quemado + olor a quemado + mancha negra = técnico, no segundo fusible.' },
  { n: 'Placa / soldadura fría / cables', ico: '🟩', para: 'El 50% de las fallas “misteriosas”: falso contacto.', mat: 'Lupa, multímetro en continuidad, cautín.', como: 'Golpea suave el equipo: si falla y vuelve = falso contacto. Mira con lupa: soldadura opaca, con aro/grieta = fría (re-suelda). Cable: mide continuidad moviéndolo; si pita y se corta al mover = hilo quebrado interno (típico en audífonos y cargadores). Conector sulfatado (verde/blanco Penco) = limpia-contactos + cepillo.', nota: 'Regla: empieza SIEMPRE por cables, conectores y soldaduras antes de culpar al chip.', cuidado: 'No raspes pistas con cuchillo: las levantas y matas la placa. Fibra suave + alcohol isopropílico.' }
];

var CIRC = [
  { n: 'Ley de Ohm (la única fórmula que necesitas)', ico: '📐', formula: 'V = I × R · I = V / R · R = V / I', txt: 'Voltaje (V) empuja, corriente (A) fluye, resistencia (Ω) frena. Ejemplo: LED rojo 2V en 5V con 15mA → R = (5−2)/0.015 = 200Ω (usa 220Ω comercial). Usa la calculadora de abajo: mete 2 datos y te da el tercero.' },
  { n: 'Potencia (para no quemar nada)', ico: '🔥', formula: 'P = V × I = V² / R = I² × R', txt: 'Todo componente aguanta una potencia máxima. Ejemplo: resistencia 220Ω con 12V → P = 144/220 = 0.65W → una de 1/4W (0.25W) se quema: usa 1W. Regla: elige el doble de lo calculado.' },
  { n: 'Serie vs paralelo', ico: '⛓️', formula: 'Serie: R = R1+R2 · Paralelo: 1/R = 1/R1+1/R2', txt: 'SERIE (uno tras otro): misma corriente, voltajes se suman. Pilas en serie suman voltaje (2×1.5V = 3V). PARALELO (lado a lado): mismo voltaje, corrientes se suman. LEDs en paralelo CADA UNO con su resistencia (nunca 1 sola para 3 LEDs: uno se come todo). Resistencias en paralelo aguantan más potencia repartida.' },
  { n: 'Divisor de voltaje y pull-up', ico: '⚖️', formula: 'Vout = Vin × R2 / (R1+R2)', txt: 'Dos resistencias en serie “reparten” el voltaje: sirve para leer 12V con Arduino de 5V (ej R1=10k, R2=4.7k → 12V baja a ~3.8V). Pull-up/down: resistencia 10k a VCC o GND para que un botón no quede “flotando” (lee 0/1 limpio). Nunca alimentes un motor directo del divisor: es solo para señales.' },
  { n: 'Protoboard sin miedo', ico: '🧪', formula: 'Rieles laterales = poder · hoyos centrales = circuito', txt: 'Rieles rojos/azules de los bordes: todo conectado a lo largo (VCC y GND). Zona central: columnas de 5 hoyos conectados entre sí, separadas por el canal del medio (ahí calza el chip). Regla: arma SIN energía, revisa polaridad, recién energiza. Foto al terminar: tu “plano” para repetirlo.' },
  { n: 'Fuentes: qué usar y qué evitar', ico: '🔌', formula: 'Pila 9V < USB 5V < Fuente 12V 2A < Batería 12V', txt: 'PRACTICAR: USB 5V o 4×AA (6V) — seguro y barato. MOTORES/TIRAS: fuente 12V 2A dedicada. EVITAR: cargador pelado sin carcasa, fuente que se calienta sola, “adaptador universal” en voltaje máximo. Polaridad: centro-positivo es lo común; si inviertes, el diodo de protección te salva (o el humo te avisa).' },
  { n: 'Arduino / ESP32 (puerta de entrada, offline)', ico: '🤖', formula: 'GND con GND siempre · 5V o 3.3V según placa', txt: 'Arduino Nano/Uno (5V, fácil) o ESP32 (3.3V, wifi para domótica local). Primeros 3 ejercicios offline: 1) Parpadear LED (blink). 2) Leer botón + prender LED. 3) Leer sensor + activar relé. Une con 🏠 Domótica: sensor puerta + ESP32 = aviso al celu sin nube. Alimenta aparte los motores (no del pin: el pin da 20mA, un motor pide 500mA).' }
];

var PROY = [
  { n: '1 · Linterna 3×AA que siempre funciona', ico: '🔦', dif: 'Fácil · 1 tarde', costo: '$5–12 mil', mat: 'Portapilas 3×AA, LED blanco 1W o módulo LED 3V, interruptor, resistencia 10Ω 1W, caja plástica, cables.', pasos: 'Suelda portapilas → interruptor → resistencia → LED (+ largo al +). Aísla con termocontraíble. Fija en caja con el LED asomando. Prueba: 4.5V − 3V LED = 1.5V / 10Ω = 150mA ideal. Marca + y − afuera con plumón.', tip: 'Versión Penco-corte: 2 linternas + pilas recargables + cargador solar chico. Revisa carga cada luna.' },
  { n: '2 · Alargador con protección (no más zapatillas asesinas)', ico: '🔌', dif: 'Fácil · 1 hora', costo: '$12–25 mil', mat: 'Caja Dexon/alargador certificado 16A, cable 3×1.5mm², enchufe macho + hembra certificados, protector sobretensión (opcional), fusible si trae.', pasos: 'Corta cable a medida (sin enrollar de más). Conecta fase-neutro-tierra respetando colores (verde-amarillo = tierra SIEMPRE). Atornilla firme (tira: no debe soltarse). Prueba con tester y una lámpara antes de enchufar caro. Rotula “PC”, “cocina”, etc.', tip: 'Si va al tablero o hay que picar muro: eléctrico SEC. Esto es solo alargador y reemplazo 1 a 1.' },
  { n: '3 · Luz de emergencia automática (corte = se prende)', ico: '💡', dif: 'Fácil · 1 tarde', costo: '$8–18 mil', mat: 'Módulo LED 12V o ampolleta 12V, batería 12V 1.3Ah o pack 18650 con BMS, cargador/mantenedor 13.8V o fuente + diodo, relé 12V o módulo automático.', pasos: 'Arma: cargador mantiene batería flotando; al cortarse la red, el relé conmuta a batería y prende el LED. Monta en pasillo en caja ventilada. Prueba desenchufando: debe prender en <1 seg. Anota fecha de batería (dura 2–3 años).', tip: 'Complementa con UPS de router (ver 🏠 Domótica): luz + internet sobreviven al temporal.' },
  { n: '4 · Cargador solar de celu (patio/bote)', ico: '☀️', dif: 'Media · 1 fin de semana', costo: '$25–60 mil', mat: 'Panel 10–20W 12V, regulador PWM chico, batería 12V 7Ah o powerbank con entrada solar, módulo USB step-down (12V→5V 2A), caja estanca IP65.', pasos: 'Panel → regulador → batería (respeta +/−). Del regulador/batería al módulo USB. Todo en caja estanca con prensaestopas; panel mirando al norte ~30°. Mide: a pleno sol debe dar 13–14V cargando. Rotula “solar 12V”.', tip: 'En invierno Penco rinde 30–50%: panel más grande o paciencia. Nunca directo panel→celu sin regulador.' },
  { n: '5 · Sensor que avisa cuando la planta tiene sed', ico: '🌱', dif: 'Fácil · 1 tarde', costo: '$8–20 mil', mat: 'Arduino Nano o ESP32 + sensor humedad suelo (capacitivo, no el dorado que se oxida), buzzer o LED, cables, macetero de prueba.', pasos: 'Conecta sensor a pin analógico + VCC/GND. Programa: si lectura < umbral 3 días → pita LED. Calibra: mide en tierra mojada vs seca y fija el punto medio. Entierra solo hasta la marca (electrónica afuera). Une con 🌱 Siembra: riega de mañana, no de noche.', tip: 'El sensor resistivo barato se pudre en 1 mes: compra el capacitivo (negro/rojo) que dura años.' },
  { n: '6 · Parlante/cargador muerto: resucítalo', ico: '🔊', dif: 'Media · 1 tarde', costo: '$0–10 mil', mat: 'Multímetro, cautín, cable USB/dupont de repuesto, limpia-contactos.', pasos: '1) Prueba otro cable y otro cargador. 2) Mide salida del cargador (5V/9V/12V según etiqueta). 3) Abre equipo: busca fusible, cable quebrado en la bisagra, soldadura fría, condensador hinchado. 4) Repara lo simple (cable/fusible/soldadura); si es chip quemado con hoyo, se jubila. Anota en 📓 Mi banco.', tip: 'El 60% es cable quebrado junto al conector: corta 10 cm y suelda conector nuevo.' },
  { n: '7 · Portón que avisa + luz (con ESP32, sin nube)', ico: '🚪', dif: 'Media · 1 fin de semana', costo: '$20–40 mil', mat: 'ESP32 + sensor magnético puerta + relé/foco 12V o ampolleta wifi existente, fuente USB 5V 2A, caja estanca.', pasos: 'Sensor al ESP32 (pull-up 10k). Programa: si abre de noche → activa relé 3 min + pita. Alimenta con USB dedicado (no del PC). Monta sensor <1cm, caja bajo techo. Prueba entreabierto. Une con 🏠 Domótica: mismo aviso al celu en red local.', tip: 'Si el portón es fierro + lluvia y falla el wifi, acerca repetidor a la ventana más cercana.' },
  { n: '8 · Riego por goteo con temporizador (huerta Penco)', ico: '💧', dif: 'Media · 1 fin de semana', costo: '$30–80 mil', mat: 'Temporizador a pila para llave + electroválvula 12V o 9V (opcional con relé), manguera goteo, filtro, sensor lluvia (opcional).', pasos: 'Arma goteo a bancales. Programa 2 riegos cortos al amanecer. Si usas válvula + ESP32: relé la abre 15 min 2×/día; sensor lluvia la salta. Revisa filtro cada luna (sarro tapa goteros). Mide consumo de pila mensual.', tip: 'Combina con 🪱 Compost: suelo con materia orgánica pide la mitad de agua.' }
];

var MEDIR = [
  { n: 'Voltaje DC (lo que más vas a medir)', ico: '🔋', txt: 'Perilla en V⎓ (DC, línea sólida+punteada). Negro a COM, rojo a VΩ. Rojo al + y negro al −/GND. USB debe dar 4.75–5.25V; fuente 12V debe dar 11.5–12.5V. Si marca negativo (−5V) es que pusiste las puntas al revés (no pasa nada en DC bajo). NUNCA midas 220V AC con puntas peladas o perilla equivocada: si necesitas 220V, que lo mida el eléctrico.' },
  { n: 'Continuidad (el pito que encuentra cortes)', ico: '🔔', txt: 'Perilla en •))) (pito). Sin energía en el circuito. Toca las puntas entre sí: debe pitar (0Ω). Cable bueno = pita; cable cortado = calla. Fusible bueno = pita. Interruptor ON = pita, OFF = calla. Mueve el cable mientras mides: si pita y se corta = hilo quebrado interno. Desconecta 1 punta del circuito para no medir caminos paralelos.' },
  { n: 'Resistencia y modo diodo', ico: '➖', txt: 'Ω para resistencias FUERA del circuito (una pata afuera). Diodo ▶| para LEDs/diodos/transistores: 0.5–0.7V silicio, 1.8–3V LED en directo; infinito al revés. Si marca 0 ambos lados = corto (malo); infinito ambos = abierto (malo o mal conectado). Anota el valor antes de desoldar.' },
  { n: 'Pilas y fuentes con carga (no te mientas)', ico: '⚡', txt: 'Medir sin carga miente: una pila muerta marca 1.4V en vacío y se cae a 0.9V con el motor. Prueba SIEMPRE con carga real (el equipo prendido o una ampolleta/resistencia). Fuente que cae >10% con carga = agotada o chica. Batería 12V plomo: 12.6V llena, 12.0V media, <11.8V cárgala hoy o se sulfata.' },
  { n: 'Diagnóstico en 5 pasos (todo equipo)', ico: '🔍', txt: '1) ENERGÍA: ¿llega voltaje? (pila/fuente/cable/fusible). 2) OJOS-NARIZ: ¿hinchado, negro, olor, cable pelado? 3) CONEXIONES: mueve cables, reaprieta, limpia sulfato. 4) POR BLOQUES: divide (fuente → control → salida) y mide entre bloques. 5) COMPONENTE: el sospechoso se mide fuera o se reemplaza por uno bueno conocido. El 80% se resuelve en pasos 1–3.' },
  { n: 'Cuándo NO insistir (al técnico)', ico: '🚨', txt: 'Microondas (condensador mortal aunque desenchufado), TV/fuente conmutada con chasquido, equipo con humo + fusible quemado repetido, litio hinchado/caliente, cualquier cosa con 220V directo adentro. Lleva tu bitácora (qué mediste + cuándo): el técnico diagnostica en 10 min lo que sin datos tarda 2 horas.' }
];

var CHECKS = [
  { id: 'e_banco', n: 'Banco ordenado y rotulado', d: 'Cada cajita dice qué hay (resistencias, LEDs, cables, pilas). No compro duplicado porque sé lo que tengo.' },
  { id: 'e_multi', n: 'Multímetro con pila buena', d: 'Mide bien 5V de un USB (4.75–5.25V). Puntas sanas, sin cobre a la vista. Pila 9V interna cambiada este año.' },
  { id: 'e_cautin', n: 'Cautín seguro', d: 'Base firme, punta estañada, esponja húmeda, enchufe sin pelados. Se desenchufa al terminar, siempre.' },
  { id: 'e_pilas', n: 'Pilas al día, sin fugas', d: 'Ningún equipo con pilas derramadas (polvo blanco). Recargables cargadas 1 vez por luna; litio guardado a media carga.' },
  { id: 'e_cables', n: 'Cables y cargadores sanos', d: 'Ningún cable pelado, con cinta enrollada ni conector suelto. El que falló se reparó o se jubiló esta luna.' },
  { id: 'e_fus', n: 'Fusibles de repuesto', d: 'Tengo 2–3 del valor de mis equipos (ej T2A 250V). Sé que se cambia por el MISMO valor, nunca más grande.' },
  { id: 'e_hum', n: 'Humedad controlada', d: 'Placas y repuestos en caja cerrada con sílica, bajo techo. Sin óxido verde en conectores (Penco manda).' },
  { id: 'e_corte', n: 'Plan anti-corte', d: 'Sé qué desenchufo con temporal (TV, PC, consola) y tengo linterna + banco cargado + clave wifi en papel.' },
  { id: 'e_220', n: '220V solo técnico', d: 'Tengo claro: yo trabajo hasta 12V; tablero, enchufes y 220V los toca eléctrico SEC. Sin excepciones.' },
  { id: 'e_litio', n: 'Litio bajo control', d: 'Carga vigilada, nunca de noche en la cama. Hinchada/caliente = fuera + punto limpio. Solo cargador original.' },
  { id: 'e_bit', n: 'Bitácora al día', d: 'Toda reparación anotada (qué era, qué medí, qué cambié). Me ahorra repetir errores y vale al vender.' },
  { id: 'e_luna', n: 'Mantención de la luna', d: '15 min en menguante: medir fuentes, probar linternas, limpiar polvo, revisar avisos. Hecho este mes.' }
];

var TIPOS_INV = ['🔌 Cable / conector', '🔋 Pila / batería', '💡 LED / diodo', '➖ Resistencia', '🔋 Condensador', '🔀 Transistor / chip', '🔘 Interruptor / relé', '🔧 Herramienta', '🤖 Arduino / ESP32 / sensor', '🔌 Fuente / cargador', '📦 Otro'];
var ESTADOS = ['😍 OK', '🙂 Funciona con maña', '🛠️ Para reparar', '♻️ Repuesto / donante', '🛒 Falta comprar'];

/* ---------------- DIALOGO ---------------- */
function rowCard(c) {
  if (c.txt) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4>' +
      (c.formula ? '<p class="chip" style="display:inline-block;font-family:monospace">' + esc(c.formula) + '</p>' : '') +
      '<p style="line-height:1.5">' + esc(c.txt) + '</p></div>';
  }
  if (c.formula && !c.mat) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4>' +
      '<p class="chip" style="display:inline-block;font-family:monospace">' + esc(c.formula) + '</p>' +
      '<p style="line-height:1.5">' + esc(c.txt) + '</p></div>';
  }
  if (c.pasos) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4>' +
      '<p class="muted" style="font-size:11px">' + esc(c.dif || '') + (c.costo ? ' · 💰 ' + esc(c.costo) : '') + '</p>' +
      '<p><b>Necesitas:</b> ' + esc(c.mat) + '</p>' +
      '<p><b>Paso a paso:</b> ' + esc(c.pasos) + '</p>' +
      (c.tip ? '<p class="muted">💡 ' + esc(c.tip) + '</p>' : '') + '</div>';
  }
  return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4>' +
    (c.para ? '<p><b>Para:</b> ' + esc(c.para) + '</p>' : '') +
    (c.mat ? '<p><b>Necesitas:</b> ' + esc(c.mat) + '</p>' : '') +
    '<p><b>Cómo:</b> ' + esc(c.como) + '</p>' +
    (c.nota ? '<p class="muted">' + esc(c.nota) + '</p>' : '') +
    (c.cuidado ? '<p style="font-size:11px;color:#e8c56a">⚠️ ' + esc(c.cuidado) + '</p>' : '') + '</div>';
}
function switchTab(name) {
  ['Guia', 'Comp', 'Circ', 'Proy', 'Medir', 'Banco'].forEach(function (t) {
    var p = $('elec' + t), b = $('tabElec' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

function calcOhm() {
  var v = parseFloat(($('elecOhmV') || {}).value);
  var i = parseFloat(($('elecOhmI') || {}).value);
  var r = parseFloat(($('elecOhmR') || {}).value);
  var out = $('elecOhmOut');
  if (!out) return;
  var n = 0;
  if (!isNaN(v)) n++; if (!isNaN(i)) n++; if (!isNaN(r)) n++;
  if (n < 2) { out.innerHTML = '<span class="muted">Escribe 2 valores (ej V + R) y toca Calcular.</span>'; return; }
  if (!isNaN(v) && !isNaN(i) && isNaN(r)) r = v / i;
  else if (!isNaN(v) && !isNaN(r) && isNaN(i)) i = v / r;
  else if (!isNaN(i) && !isNaN(r) && isNaN(v)) v = i * r;
  else { r = v / i; }
  if (!isFinite(v) || !isFinite(i) || !isFinite(r) || r <= 0) { out.innerHTML = '⚠️ Revisa los valores (R debe ser > 0).'; return; }
  var p = v * i;
  out.innerHTML = 'V = <b>' + v.toFixed(2) + ' V</b> · I = <b>' + (i * 1000).toFixed(1) + ' mA</b> · R = <b>' + (r >= 1000 ? (r / 1000).toFixed(2) + ' kΩ' : r.toFixed(1) + ' Ω') + '</b> · P = <b>' + p.toFixed(2) + ' W</b>' +
    (p > 0.2 ? '<br><span style="color:#e8c56a">⚠️ Usa resistencia de ' + (p * 2 < 1 ? '1/2W o 1W' : Math.ceil(p * 2) + 'W') + ' (doble de ' + p.toFixed(2) + 'W).</span>' : '<br>✅ Con 1/4W basta.');
}
function calcLed() {
  var vs = parseFloat(($('elecLedVs') || {}).value);
  var vf = parseFloat(($('elecLedVf') || {}).value);
  var imA = parseFloat(($('elecLedI') || {}).value);
  var out = $('elecLedOut');
  if (!out) return;
  if (isNaN(vs) || isNaN(vf) || isNaN(imA) || imA <= 0) { out.innerHTML = '<span class="muted">Completa fuente, Vf del LED y corriente (ej 12, 2, 15).</span>'; return; }
  if (vs <= vf) { out.innerHTML = '⚠️ La fuente (' + vs + 'V) debe ser mayor que el LED (' + vf + 'V).'; return; }
  var r = (vs - vf) / (imA / 1000);
  var comerciales = [10, 22, 47, 100, 150, 220, 330, 470, 680, 1000, 2200, 4700, 10000];
  var rec = comerciales.filter(function (x) { return x >= r; })[0] || Math.ceil(r);
  var p = (vs - vf) * (imA / 1000);
  out.innerHTML = 'R = <b>' + r.toFixed(0) + ' Ω</b> → usa comercial <b>' + rec + ' Ω</b> · P = <b>' + p.toFixed(2) + ' W</b> ' + (p > 0.2 ? '(usa 1/2W o 1W ⚠️)' : '(1/4W OK ✅)');
}
function calcDiv() {
  var vin = parseFloat(($('elecDivVin') || {}).value);
  var r1 = parseFloat(($('elecDivR1') || {}).value);
  var r2 = parseFloat(($('elecDivR2') || {}).value);
  var out = $('elecDivOut');
  if (!out) return;
  if (isNaN(vin) || isNaN(r1) || isNaN(r2) || r1 <= 0 || r2 <= 0) { out.innerHTML = '<span class="muted">Escribe Vin y ambas resistencias (en kΩ, ej 12, 10, 4.7).</span>'; return; }
  var vo = vin * r2 / (r1 + r2);
  out.innerHTML = 'Vout = <b>' + vo.toFixed(2) + ' V</b>' + (vo > 5.2 && vo <= 12 ? ' <span class="muted">(ojo: para Arduino 5V usa valores que bajen a ≤5V)</span>' : '') + (vo <= 5 ? ' ✅ apto para entrada 5V' : '');
}

function buildDialog() {
  var guiaHTML = GUIAS.map(rowCard).join('');
  var compHTML = COMP.map(rowCard).join('');
  var circHTML = CIRC.map(rowCard).join('');
  var proyHTML = PROY.map(rowCard).join('');
  var medirHTML = MEDIR.map(rowCard).join('');

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabElecGuia" class="btn btn-accent" style="width:auto">📘 Guía base</button>' +
    '<button type="button" id="tabElecComp" class="btn" style="width:auto">🔌 Componentes</button>' +
    '<button type="button" id="tabElecCirc" class="btn" style="width:auto">📐 Circuitos</button>' +
    '<button type="button" id="tabElecProy" class="btn" style="width:auto">🛠️ Proyectos</button>' +
    '<button type="button" id="tabElecMedir" class="btn" style="width:auto">📏 Medir</button>' +
    '<button type="button" id="tabElecBanco" class="btn" style="width:auto">📓 Mi banco</button></div>' +

    '<div id="elecGuia">' + guiaHTML +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🧭 Regla de oro</h4><p class="muted" style="font-size:12px">Mide sin energía (Ω, continuidad, diodo) y con energía solo voltaje en BAJA tensión. Lo que huela a quemado, esté hinchado o lleve 220V adentro: se revisa con técnico, no con coraje.</p></div></div>' +

    '<div id="elecComp" class="hidden"><div class="conv-row"><label style="flex:1">🔍 Filtrar <input type="text" id="elecCompQ" placeholder="led, fusible, pila, transistor..."></label></div><div id="elecCompList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + compHTML + '</div></div>' +

    '<div id="elecCirc" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🧮 Calculadora Ohm (offline)</h4>' +
    '<p class="muted" style="font-size:11px">Escribe 2 valores, deja el tercero vacío. I en amperes (ej 0.015 = 15mA).</p>' +
    '<div class="conv-row"><label>V (volts) <input type="number" id="elecOhmV" step="0.1" placeholder="ej: 5"></label><label>I (amp) <input type="number" id="elecOhmI" step="0.001" placeholder="ej: 0.015"></label><label>R (ohm) <input type="number" id="elecOhmR" step="1" placeholder="ej: 220"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="elecOhmGo" class="btn btn-accent" style="width:auto">Calcular</button></div>' +
    '<div id="elecOhmOut" class="chip" style="display:block;white-space:normal;margin-top:6px">—</div></div>' +
    '<div class="menstrual-card" style="margin-top:8px"><h4>💡 Resistencia para LED</h4>' +
    '<div class="conv-row"><label>Fuente Vs <input type="number" id="elecLedVs" step="0.1" value="12"></label><label>LED Vf <select id="elecLedVf"><option value="1.8">Rojo 1.8V</option><option value="2">Verde/amarillo 2V</option><option value="3" selected>Blanco/azul 3V</option></select></label><label>mA <input type="number" id="elecLedI" step="1" value="15"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="elecLedGo" class="btn btn-accent" style="width:auto">Calcular R</button></div>' +
    '<div id="elecLedOut" class="chip" style="display:block;white-space:normal;margin-top:6px">—</div></div>' +
    '<div class="menstrual-card" style="margin-top:8px"><h4>⚖️ Divisor de voltaje</h4>' +
    '<div class="conv-row"><label>Vin <input type="number" id="elecDivVin" step="0.1" value="12"></label><label>R1 (kΩ) <input type="number" id="elecDivR1" step="0.1" value="10"></label><label>R2 (kΩ) <input type="number" id="elecDivR2" step="0.1" value="4.7"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="elecDivGo" class="btn btn-accent" style="width:auto">Calcular Vout</button></div>' +
    '<div id="elecDivOut" class="chip" style="display:block;white-space:normal;margin-top:6px">—</div></div>' +
    '<div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + circHTML + '</div></div>' +

    '<div id="elecProy" class="hidden"><div class="menstrual-card"><h4>🛠️ 8 proyectos para la casa</h4><p class="muted" style="font-size:11px">Costos referenciales ferretería Biobío 2026. Todo en baja tensión; si algo toca 220V o tablero: técnico SEC.</p></div><div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + proyHTML + '</div></div>' +

    '<div id="elecMedir" class="hidden">' + medirHTML +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🧰 Chuleta multímetro</h4><p class="muted" style="font-size:12px">V⎓ = voltaje DC · •))) = continuidad/pito · Ω = resistencia (sin energía) · ▶| = diodo/LED · A = corriente (en SERIE, con cuidado). Negro siempre en COM.</p></div></div>' +

    '<div id="elecBanco" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Anotar repuesto / herramienta</h4>' +
    '<div class="conv-row"><label style="flex:2">Qué es * <input type="text" id="elecNombre" placeholder="ej: Resistencias 220Ω, ESP32, Fuente 12V 2A" maxlength="50"></label>' +
    '<label>Tipo <select id="elecTipo">' + TIPOS_INV.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Cantidad <input type="text" id="elecCant" placeholder="ej: 10, 1 pack" maxlength="20"></label>' +
    '<label>Dónde está <input type="text" id="elecLugar" placeholder="ej: caja 2, banco, mochila" maxlength="30"></label>' +
    '<label>Estado <select id="elecEstado">' + ESTADOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<label>Nota <input type="text" id="elecNota" placeholder="ej: comprado ene 2026, sirve para LEDs" maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="elecAdd" class="btn btn-accent" style="width:auto">+ Guardar</button></div></div>' +

    '<div class="menstrual-card" style="margin-top:8px"><h4>🔧 Bitácora de reparaciones</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="elecBitFecha"></label><label style="flex:2">Equipo * <input type="text" id="elecBitEquipo" placeholder="ej: Parlante BT, Linterna, Cargador" maxlength="50"></label></div>' +
    '<div class="conv-row"><label>Falla <input type="text" id="elecBitFalla" placeholder="ej: no prende, parpadea, no carga" maxlength="60"></label>' +
    '<label>Solución <input type="text" id="elecBitSol" placeholder="ej: cable quebrado, fusible T2A, soldadura fría" maxlength="60"></label></div>' +
    '<div class="conv-row"><label>Costo $ <input type="number" id="elecBitCosto" min="0" step="500" placeholder="ej: 2000"></label>' +
    '<label>Resultado <select id="elecBitRes"><option>✅ Reparado</option><option>🙂 Funciona con maña</option><option>🔁 En proceso</option><option>♻️ Jubilado / donante</option></select></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="elecBitAdd" class="btn" style="width:auto">+ Guardar reparación</button></div>' +
    '<div id="elecBitList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div>' +

    '<div class="menstrual-card" style="margin-top:8px"><h4>✅ Chequeo banco electrónico</h4><p class="muted" style="font-size:11px">12 puntos. Meta sana: 9/12. Repite 1 vez por luna (menguante).</p><div id="elecCheckList"></div>' +
    '<div style="background:var(--panel);border-radius:6px;height:10px;overflow:hidden;margin-top:8px"><div id="elecCheckBar" style="width:0%;height:100%;background:linear-gradient(90deg,#e76e8a,#e8c56a,#8fd694)"></div></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px" id="elecCheckTxt"></p></div>' +

    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">🔍 Buscar en mi banco <input type="text" id="elecQ" placeholder="led, esp32, fuente..."></label></div>' +
    '<div id="elecResumen" class="menstrual-card" style="margin-top:8px"></div>' +
    '<div id="elecLog" style="margin-top:8px;display:flex;flex-direction:column;gap:8px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="elecStats" class="muted" style="font-size:11px"></span><span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="elecShare" class="btn" style="width:auto">📤 Compartir</button><button type="button" id="elecClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>';

  makeDialog('electronicaDialog', '🔌 Electrónica — mide, repara y crea en baja tensión',
    'Componentes, circuitos, 8 proyectos y tu banco + bitácora. Vive en <b>🏡 Hogar y Vida Práctica > 🔧 Energía y Taller</b>, junto a ⚡ Consumo eléctrico, 🔧 Mecánica y 🏠 Domótica. Todo <b>privado y local</b>, 100% offline. 220V y tablero: solo eléctrico SEC.',
    body);
}

/* ---------------- MI BANCO ---------------- */
function puntaje() {
  var s = store(), n = 0;
  CHECKS.forEach(function (c) { if (s.checks[c.id]) n++; });
  return n;
}
function renderChecks() {
  var box = $('elecCheckList'); if (!box) return;
  var s = store();
  box.innerHTML = CHECKS.map(function (c) {
    var on = !!s.checks[c.id];
    return '<label class="check-row" style="align-items:flex-start;border:1px solid var(--line);border-radius:8px;padding:8px;margin-bottom:6px;cursor:pointer">' +
      '<input type="checkbox" data-echk="' + c.id + '"' + (on ? ' checked' : '') + ' style="margin-top:3px"> ' +
      '<span><b>' + esc(c.n) + '</b><br><span class="muted" style="font-size:11px">' + esc(c.d) + '</span></span></label>';
  }).join('');
  var pts = puntaje(), tot = CHECKS.length, pct = Math.round(pts / tot * 100);
  var bar = $('elecCheckBar'), txt = $('elecCheckTxt');
  if (bar) bar.style.width = pct + '%';
  if (txt) txt.textContent = 'Mi banco: ' + pts + '/' + tot + ' (' + pct + '%) ' + (pts <= 4 ? '🔴 Parte por multímetro + pilas + 220V-solo-técnico.' : (pts <= 8 ? '🟡 En camino: cierra los que faltan.' : (pts < tot ? '🟢 Casi listo: mantén 1 revisión por luna.' : '🟢 Banco al día: repasa cada luna.')));
  box.querySelectorAll('[data-echk]').forEach(function (c) {
    c.onchange = function () {
      var st = store();
      st.checks[c.getAttribute('data-echk')] = c.checked ? true : false;
      save(c.checked ? 'Paso activado ✅' : 'Guardado');
      renderChecks();
    };
  });
}
function renderBanco() {
  renderChecks();
  renderBit();
  var box = $('elecLog'); if (!box) return;
  var m = store();
  var q = (($('elecQ') && $('elecQ').value) || '').toLowerCase();
  var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
  var list = m.inventario.filter(function (r) {
    if (!q) return true;
    var t = ((r.nombre || '') + ' ' + (r.tipo || '') + ' ' + (r.lugar || '') + ' ' + (r.nota || '')).toLowerCase();
    var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
    return tn.indexOf(qn) >= 0;
  });
  var res = $('elecResumen'), st = $('elecStats');
  var mal = m.inventario.filter(function (r) { return (r.estado || '').indexOf('OK') < 0; }).length;
  var totRep = m.bitacora.filter(function (r) { return (r.res || '').indexOf('Reparado') >= 0; }).length;
  var gasto = m.bitacora.reduce(function (a, r) { return a + (+r.costo || 0); }, 0);
  if (res) {
    res.innerHTML = '<h4>📊 Resumen</h4><p class="muted" style="font-size:12px">' + m.inventario.length + ' repuesto(s)' +
      ' · 🔧 ' + m.bitacora.length + ' reparación(es) (' + totRep + ' OK)' +
      (gasto ? ' · 💰 $' + gasto.toLocaleString('es-CL') + ' en repuestos' : '') +
      (mal ? ' · ⚠️ ' + mal + ' por revisar/comprar' : ' · 🟢 todo OK') +
      ' · ✅ chequeo ' + puntaje() + '/' + CHECKS.length + '</p>';
  }
  if (!list.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">' + (m.inventario.length ? 'Sin resultados para ese filtro.' : 'Sin repuestos aún. Anota el primero arriba: ej “Resistencias 220Ω”.') + '</p>';
  } else {
    box.innerHTML = list.slice().sort(function (a, b) { return String(a.nombre).localeCompare(String(b.nombre)); }).slice(0, 80).map(function (r) {
      var ico = (r.tipo || '📦').split(' ')[0];
      return '<div class="si-card"><h4>' + esc(ico + ' ' + (r.nombre || 'Repuesto')) + '</h4>' +
        '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">' + esc(r.tipo || '') + '</span>' +
        (r.cant ? '<span class="chip" style="font-size:10px">× ' + esc(r.cant) + '</span>' : '') +
        (r.lugar ? '<span class="chip" style="font-size:10px">📍 ' + esc(r.lugar) + '</span>' : '') +
        (r.estado ? '<span class="chip" style="font-size:10px">' + esc(r.estado) + '</span>' : '') + '</p>' +
        (r.nota ? '<p class="muted">' + esc(r.nota) + '</p>' : '') +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
        '<button type="button" class="btn elec-ok" data-k="' + esc(r.id) + '" style="width:auto;font-size:11px">✅ OK</button>' +
        '<button type="button" class="btn elec-del" data-k="' + esc(r.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div></div>';
    }).join('');
    box.querySelectorAll('.elec-del').forEach(function (x) {
      x.onclick = function () {
        if (!confirm('¿Borrar este repuesto del inventario?')) return;
        var s2 = store();
        s2.inventario = (s2.inventario || []).filter(function (r) { return r.id !== x.dataset.k; });
        save(); renderBanco();
      };
    });
    box.querySelectorAll('.elec-ok').forEach(function (x) {
      x.onclick = function () {
        var s2 = store();
        var r = (s2.inventario || []).filter(function (a) { return a.id === x.dataset.k; })[0];
        if (r) { r.estado = '😍 OK'; save('Repuesto OK ✅'); renderBanco(); }
      };
    });
  }
  if (st) st.textContent = list.length + ' mostrado(s) · ' + m.inventario.length + ' total';
}
function renderBit() {
  var box = $('elecBitList'); if (!box) return;
  var m = store();
  var data = (m.bitacora || []).slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  if (!data.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin reparaciones. Anota la primera arriba: te ahorra repetir errores.</p>'; return; }
  box.innerHTML = data.slice(0, 60).map(function (r) {
    return '<div class="hora-item"><span style="font-size:12px">🔧 <b>' + esc(r.equipo || '') + '</b> · ' + esc(r.res || '') +
      '<br><span class="muted" style="font-size:10px">' + esc(r.fecha || '') + (r.falla ? ' · falla: ' + esc(r.falla) : '') + (r.sol ? ' → ' + esc(r.sol) : '') + (r.costo ? ' · $' + (+r.costo).toLocaleString('es-CL') : '') + '</span></span>' +
      '<button type="button" class="btn btn-icon elec-bit-del" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.elec-bit-del').forEach(function (x) {
    x.onclick = function () {
      var s2 = store();
      s2.bitacora = (s2.bitacora || []).filter(function (r) { return r.id !== x.dataset.k; });
      save(); renderBanco();
    };
  });
}

function bindFilter(qId, listId) {
  var q = $(qId);
  if (q) q.oninput = function () {
    var v = (q.value || '').toLowerCase();
    var vn = v.normalize ? v.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : v;
    var list = $(listId); if (!list) return;
    list.querySelectorAll('.si-card').forEach(function (c) {
      var t = (c.textContent || '').toLowerCase();
      var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
      c.style.display = (!v || tn.indexOf(vn) >= 0) ? '' : 'none';
    });
  };
}

/* ---------------- SETUP ---------------- */
function setup() {
  /* 1) inyectar botón en Hogar y Vida Práctica > Energía y Taller */
  try {
    var existing = $('btnElectronica');
    if (existing) {
      var oldG = existing.closest ? existing.closest('.action-group') : null;
      var inHogar = oldG && oldG.getAttribute && oldG.getAttribute('data-group') === 'hogar';
      if (!inHogar) { try { existing.remove(); } catch (e0) { try { existing.parentNode.removeChild(existing); } catch (e1) {} } existing = null; }
      else { try { existing.setAttribute('data-sub', 'energia'); } catch (eS) {} }
    }
    if (!existing) {
      var g = document.querySelector('.action-group[data-group="hogar"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnElectronica'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🔌 Electrónica';
        try { btn.setAttribute('data-sub', 'energia'); } catch (eS2) {}
        btn.setAttribute('data-keywords', 'electronica circuitos componentes resistencia led transistor soldar cautín multimetro protoboard arduino esp32 fuente pila bateria reparacion Ohm potencia divisor taller hogar ferreteria sensor riego luz emergencia solar cargador placa fusible condensador diodo rele');
        var refC = g.querySelector('#btnConvert');
        if (refC) g.insertBefore(btn, refC);
        else g.appendChild(btn);
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + orden hogar|energia + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnElectronica') < 0) ALL_BTNS.push('btnElectronica');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnElectronica = ['hogar', 'energia'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['hogar|energia'] && BTN_ORDER['hogar|energia'].indexOf('btnElectronica') < 0) {
      var _o = BTN_ORDER['hogar|energia'], _ni = _o.indexOf('btnConvert');
      if (_ni < 0) _o.push('btnElectronica'); else _o.splice(_ni, 0, 'btnElectronica');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnElectronica = true; });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Hogar y Vida Práctica) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnElectronica"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Hogar') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnElectronica"> 🔌 Electrónica';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnElectronica !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnElectronica = lab.querySelector('input').checked;
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

  /* 4) diálogo */
  buildDialog();
  renderBanco();

  var b = $('btnElectronica');
  if (b) b.onclick = function () {
    renderBanco();
    switchTab('Guia');
    openDlg('electronicaDialog');
  };

  ['Guia', 'Comp', 'Circ', 'Proy', 'Medir', 'Banco'].forEach(function (t) {
    var tb = $('tabElec' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  bindFilter('elecCompQ', 'elecCompList');

  var og = $('elecOhmGo'); if (og) og.onclick = calcOhm;
  var lg = $('elecLedGo'); if (lg) lg.onclick = calcLed;
  var dg = $('elecDivGo'); if (dg) dg.onclick = calcDiv;

  var dq = $('elecQ'); if (dq) dq.oninput = renderBanco;
  try { if ($('elecBitFecha') && !$('elecBitFecha').value) $('elecBitFecha').value = todayKey(); } catch (e) {}

  var ad = $('elecAdd');
  if (ad) ad.onclick = function () {
    var nom = clean((($('elecNombre') || {}).value || '').trim(), 50);
    if (!nom) return alert('Escribe qué repuesto es (ej: Resistencias 220Ω)');
    var m = store();
    m.inventario.push({
      id: uid('ele'),
      nombre: nom,
      tipo: ($('elecTipo') || {}).value || TIPOS_INV[0],
      cant: clean((($('elecCant') || {}).value || '').trim(), 20),
      lugar: clean((($('elecLugar') || {}).value || '').trim(), 30),
      estado: ($('elecEstado') || {}).value || ESTADOS[0],
      nota: clean((($('elecNota') || {}).value || '').trim(), 120),
      fecha: todayKey()
    });
    save('Repuesto guardado 🔌');
    if ($('elecNombre')) $('elecNombre').value = '';
    if ($('elecCant')) $('elecCant').value = '';
    if ($('elecLugar')) $('elecLugar').value = '';
    if ($('elecNota')) $('elecNota').value = '';
    renderBanco();
  };

  var ba = $('elecBitAdd');
  if (ba) ba.onclick = function () {
    var eq = clean((($('elecBitEquipo') || {}).value || '').trim(), 50);
    if (!eq) return alert('Escribe el equipo reparado (ej: Parlante BT)');
    var m2 = store();
    m2.bitacora.push({
      id: uid('ebi'),
      fecha: ($('elecBitFecha') || {}).value || todayKey(),
      equipo: eq,
      falla: clean((($('elecBitFalla') || {}).value || '').trim(), 60),
      sol: clean((($('elecBitSol') || {}).value || '').trim(), 60),
      costo: parseFloat(($('elecBitCosto') || {}).value) || 0,
      res: ($('elecBitRes') || {}).value || '✅ Reparado'
    });
    save('Reparación guardada 🔧');
    if ($('elecBitEquipo')) $('elecBitEquipo').value = '';
    if ($('elecBitFalla')) $('elecBitFalla').value = '';
    if ($('elecBitSol')) $('elecBitSol').value = '';
    if ($('elecBitCosto')) $('elecBitCosto').value = '';
    renderBanco();
  };

  var sh = $('elecShare');
  if (sh) sh.onclick = async function () {
    var d = store();
    if (!d.inventario.length && !d.bitacora.length) return alert('Sin repuestos ni reparaciones aún');
    var t = '🔌 Mi banco electrónico · ' + todayKey() + ' · ✅ ' + puntaje() + '/' + CHECKS.length + '\n\nRepuestos:\n' + d.inventario.map(function (r) {
      return '• ' + r.nombre + ' (' + (r.tipo || '') + ')' + (r.cant ? ' ×' + r.cant : '') + ' · ' + (r.estado || '');
    }).join('\n') + (d.bitacora.length ? '\n\nReparaciones:\n' + d.bitacora.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).map(function (r) { return '• ' + r.fecha + ' · ' + r.equipo + ' · ' + (r.falla || '') + ' → ' + (r.sol || '') + ' ' + (r.res || ''); }).join('\n') : '');
    await share('Mi electrónica', t);
  };
  var cl = $('elecClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu banco de electrónica (inventario + bitácora)? El chequeo se conserva.')) return;
    try { var u = userData(); if (u && u.electronica) { u.electronica.inventario = []; u.electronica.bitacora = []; } } catch (e) {}
    save(); renderBanco();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
