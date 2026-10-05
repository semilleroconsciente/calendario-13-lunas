/* ============================================================
   DOMOTICA — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección dentro de Hogar y Vida Práctica > Energía y Taller:
   - Botón btnDomotica (inyectado en grupo hogar, sub energia,
     junto a Consumo eléctrico / Bitácora Taller / Mecánica)
   - Diálogo domoticaDialog con 6 pestañas:
     1) 🏠 Guía (niveles, reglas de oro 220V, wifi local, privacidad)
     2) 💡 Iluminación (ampolletas, relés, sensores, patio)
     3) 🛡️ Seguridad y sensores (puerta, humo, gas, agua, cámaras)
     4) ⚡ Energía y clima (medir consumo, vampiros, humedad, cortes)
     5) 🛠️ Proyectos (8 proyectos paso a paso de ferretería)
     6) 📓 Mi casa (inventario + automatizaciones + bitácora + chequeo)
   - Todo local y privado por usuario: userData().domotica
     { dispositivos:[], autos:[], bitacora:[], checks:{} }
   - 100% offline. Enfoque Chile 220V + SEC: si no sabes,
     no tocas el tablero; llamas a eléctrico autorizado.
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
    if (!u) return { dispositivos: [], autos: [], bitacora: [], checks: {} };
    if (!u.domotica) u.domotica = { dispositivos: [], autos: [], bitacora: [], checks: {} };
    var m = u.domotica;
    if (!Array.isArray(m.dispositivos)) m.dispositivos = [];
    if (!Array.isArray(m.autos)) m.autos = [];
    if (!Array.isArray(m.bitacora)) m.bitacora = [];
    if (!m.checks || typeof m.checks !== 'object' || Array.isArray(m.checks)) m.checks = {};
    return m;
  } catch (e2) { return { dispositivos: [], autos: [], bitacora: [], checks: {} }; }
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
  { n: 'Qué es domótica (sin humo)', ico: '🏠', txt: 'Domótica = que la casa haga sola lo repetido: prender el patio al oscurecer, avisarte si quedó el portón abierto, cortar el hervidor a los 10 min, medir cuánto gasta el freezer. No es lujo: es ahorro de luz, seguridad y comodidad. Parte por 1 problema real (ej: “el patio queda prendido toda la noche”), no por comprar gadgets.' },
  { n: 'Los 3 niveles (elige el tuyo)', ico: '🪜', txt: 'NIVEL 1 · Sin picar ni tablero: ampolletas wifi, enchufes inteligentes, sensores a pila con aviso al celu. Lo hace cualquiera. NIVEL 2 · Con relé wifi (Sonoff Mini, Shelly): el interruptor de muralla sigue funcionando + se controla del celu. Requiere cortar la luz y cablear bien (si dudas, eléctrico). NIVEL 3 · Casa local (Home Assistant en PC vieja o Raspberry): todo funciona sin internet, con automatizaciones potentes. Solo cuando ya dominas 1 y 2.' },
  { n: 'Regla de oro 220V Chile', ico: '⚡', txt: 'Corta el automático ANTES de abrir cualquier caja o interruptor y verifica con buscapolo que no hay energía. Nunca trabajes con las manos mojadas ni descalzo. Respeta fase/neutro/tierra (en Chile el verde-amarillo es tierra y salva vidas). Lo que va DENTRO del tablero (automáticos, diferencial) lo toca SOLO eléctrico autorizado SEC. Si huele a quemado, hay chisporroteo o el diferencial salta: no insistas, llama a técnico.' },
  { n: 'Wifi que no se cae (Penco)', ico: '📶', txt: 'La domótica wifi vive o muere por el router. Pon el router al centro y en alto, lejos del microondas y del calefón metálico. Nombra tu red 2.4 GHz aparte (muchos sensores NO hablan 5 GHz). Si el patio/bodega queda sin señal: repetidor o punto de acceso a medio camino. Anota en 📓 Mi casa el nombre de red, IP y clave de cada equipo.' },
  { n: 'Privacidad: que tu casa no hable a China', ico: '🔒', txt: 'Muchos equipos baratos mandan tus horarios a nubes extranjeras. Prefiere marcas con modo local (Shelly, Tasmota, ESPHome, Zigbee + Home Assistant). Cambia la clave de fábrica de cada cámara/enchufe, crea una red wifi de invitados para visitas y nunca mires tus cámaras desde wifi pública sin clave. Lo crítico (chapa, gas, humo) debe funcionar AUNQUE se caiga internet.' },
  { n: 'Terremoto, corte y lluvia: diseña para fallar bien', ico: '🌧️', txt: 'En Penco manda la realidad: corte de luz en temporal, sismo, humedad que sulfata todo. Regla: todo automático debe tener su “modo manual” (interruptor físico que sigue funcionando). Luz de emergencia + UPS para router (2–4 h de internet) + linterna a mano. Sensores de exterior: caja estanca IP65 y silicona en pasadas de cable. Repasa el chequeo 1 vez por luna.' }
];

var LUCES = [
  { n: 'Ampolleta wifi (el primer paso)', ico: '💡', para: 'Pieza, living, velador que quieres prender/apagar con celu o por horario.', mat: 'Ampolleta wifi E27 2.4 GHz (9–12 W), app del fabricante.', como: 'Enrosca, prende el interruptor (debe quedar SIEMPRE prendido), agrega en la app a tu wifi 2.4 GHz, ponle nombre (“Patio”, “Pieza”). Crea 1 rutina: prender al atardecer + apagar 23:30. Pega un cartelito “no apagar del interruptor” mientras la familia se acostumbra.', nota: 'Gasta 0.5–1 W en espera. Si alguien apaga del interruptor, queda “tonta” hasta prenderlo de nuevo.', cuidado: 'No para dentro de campana/estufa (calor) ni para dimmer viejo de muralla: parpadea y se quema.' },
  { n: 'Relé wifi tras el interruptor (Shelly / Sonoff Mini)', ico: '🔌', para: 'Quieres conservar el interruptor físico + sumar control por celu y horario.', mat: 'Relé wifi (Shelly 1 Mini, Sonoff Mini R4), buscapolo, huincha aisladora, conector Wago.', como: 'CORTA el automático y verifica sin energía. Abre el interruptor, identifica fase y vuelta de lámpara, conecta el relé según su diagrama (fase-neutro + salida a lámpara + botón S1-S2 al interruptor). Cierra, da la luz, configura wifi y deja el interruptor en modo “toggle”.', nota: 'Ideal para patio, antejardín y pasillo: el que no tiene celu sigue usando el interruptor normal.', cuidado: 'Si la caja no tiene neutro (casas viejas), NO improvises puentes: usa ampolleta wifi o llama a eléctrico. Tablero = solo SEC.' },
  { n: 'Sensor de movimiento para patio y pasillo', ico: '🚶', para: 'Luz que se prende sola al pasar (seguridad + no dejar prendido).', mat: 'Sensor PIR wifi/Zigbee o foco LED con sensor incluido, escalera firme.', como: 'Apunta a 2–2.5 m de alto hacia donde caminas (no a la calle: cada auto la prendería). Ajusta tiempo 1–3 min y sensibilidad media. Rutina: solo de noche (ej 20:00–07:00) + aviso al celu si detecta entre 00:00–05:00.', nota: 'Los gatos/perros la disparan: apúntala más alta o baja sensibilidad.', cuidado: 'Altura con escalera avisada. Conexión 220V del foco con luz cortada.' },
  { n: 'Fotocelda: el patio se manda solo', ico: '🌙', para: 'Foco del antejardín o letrero que debe prender al oscurecer y apagar al amanecer.', mat: 'Fotocelda 220V 10 A + foco LED, caja estanca si va afuera.', como: 'Instala la fotocelda mirando al cielo (no bajo el foco que ella misma prende: queda parpadeando). Ajusta el tornillito de sensibilidad al atardecer. Prueba tapándola con la mano: debe prender en 10–30 seg.', nota: 'Más barato y confiable que programar horarios todo el año (el atardecer cambia).', cuidado: 'Toda unión a la intemperie con conector + huincha autosoldante, nunca “pelado con cinta”.' },
  { n: 'Tira LED con horario (cocina, escritorio, altar)', ico: '✨', para: 'Luz cálida de apoyo sin velador prendido toda la noche.', mat: 'Tira LED 12 V + transformador + enchufe inteligente o controlador wifi.', como: 'Pega en superficie limpia y seca, esconde el transformador ventilado (no dentro de plumavit). Programa: 19:30–23:00 al 70%. Si es USB a tele/router: se apaga sola con ellos.', nota: 'Luz cálida 2700–3000 K descansa mejor que la blanca fría.', cuidado: 'Transformador chino sin ventilación se calienta: déjalo al aire, no tapado con ropa.' },
  { n: 'Temporizador del hervidor / plancha / estufa', ico: '⏱️', para: 'Evitar el “quedó prendido” (el olvido más caro y peligroso).', mat: 'Enchufe inteligente con temporizador y medición (10–16 A).', como: 'Enchufa el equipo al enchufe inteligente, crea regla “apagar a los X min” (hervidor 10, plancha 15, estufa 60) + aviso al celu. Revisa 1 vez que el consumo marcado calza (hervidor ~1500 W).', nota: 'Ahorro real: una estufa 2000 W olvidada 3 h = 6 kWh (~$1.000).', cuidado: 'Solo enchufes de 16 A certificados para estufas/hervidores. Nada de “zapatillas” en serie ni alargador enrollado (se calienta).' }
];

var SEGURIDAD = [
  { n: 'Sensor puerta/ventana con aviso', ico: '🚪', para: 'Portón, puerta cocina, ventana que da al patio: aviso si queda abierta.', mat: 'Sensor magnético wifi/Zigbee a pila (2 partes: imán + sensor).', como: 'Pega el sensor en el marco y el imán en la hoja a <1 cm. Nómbralo (“Portón”, “Ventana baño”). Rutina: si abre de noche → aviso + prende luz patio 3 min. Prueba con la puerta entreabierta (la clásica).', nota: 'Pila CR2450 dura 1–2 años; agenda cambio cada 12 lunas en 📓 Mi casa.', cuidado: 'No reemplaza chapa ni reja: es aviso, no blindaje.' },
  { n: 'Detector de humo y CO (el que salva vidas)', ico: '🔥', para: 'Cocina, living con estufa a leña, pasillo de piezas.', mat: 'Detector de humo fotoeléctrico + detector de CO si hay gas/leña/pellet, a pila 10 años o interconectados.', como: 'Humo al TECHO al centro del pasillo (el humo sube); CO a 1.5 m en muralla fuera de piezas. Prueba el botón 1 vez por luna. Si suena de noche: ventila, corta gas/estufa, sal y llama a Bomberos 132 (no entres a “ver qué era”).', nota: 'Interconectados: si suena uno, suenan todos (ideal 2 pisos).', cuidado: 'No en cocina pegado a la olla (vapor = falsas alarmas) ni en baño con ducha. Pintar el detector lo mata.' },
  { n: 'Detector de gas licuado / natural', ico: '⛽', para: 'Cocina con balón o cañería: aviso antes de que huela toda la casa.', mat: 'Detector de gas 220V o a pila con sirena + electroválvula (opcional con técnico).', como: 'Gas licuado pesa más que el aire: va ABAJO (20–30 cm del suelo, cerca del balón/cocina). Gas natural/de cañería sube: va ARRIBA. Al sonar: no prendas/apagues luces, no enchufes nada, abre ventanas, corta la llave, sal y llama desde fuera.', nota: 'Cambia flexible y regulador cada 5 años aunque “se vean buenos”.', cuidado: 'El detector avisa, no corta solo (salvo electroválvula instalada por gasfíter autorizado SEC).' },
  { n: 'Sensor de agua bajo lavadora / calefón', ico: '💧', para: 'Filtración silenciosa que pudre piso y pared en invierno.', mat: 'Sensor de inundación wifi a pila (planito, con patitas).', como: 'Ponlo en el suelo tras la lavadora y otro bajo el calefón/lavaplatos. Rutina: al detectar agua → aviso fuerte + (si tienes electroválvula) corta el agua. Revisa mangueras trenzadas 1 vez por luna: globo/hongo = cambio hoy.', nota: 'En Penco la humedad hace lo suyo: este sensor de $15 mil ahorra un piso de $500 mil.', cuidado: 'No lo sumerjas “para probar” largo rato: tócalo con paño mojado 3 seg.' },
  { n: 'Sirena + luz ante sismo o intruso', ico: '🚨', para: 'Disuadir y avisar a vecinos (no armar “búnker”).', mat: 'Sirena wifi interior/exterior + sensor puerta + control o app, cartel disuasivo.', como: 'Sirena interior fuerte (110 dB) + foco patio que prende con el mismo evento. Arma 2 modos: “En casa noche” (solo perímetro) y “Fuera” (todo). Ensaya con la familia para que nadie se asuste ni llame a Carabineros por error.', nota: 'Sismo: la sirena NO predice; sirve para avisar corte de gas posterior si sumas sensor.', cuidado: 'Sirena exterior a volumen bestial toda la noche = multa y vecinos enemigos. Prueba de día, 5 seg.' },
  { n: 'Cámara local sin nube (mirar sin regalar)', ico: '📷', para: 'Ver portón/patio desde el celu sin pagar suscripción ni subir todo a internet.', mat: 'Cámara con ranura microSD + modo local/RTSP (o kit con NVR), transformador interior.', como: 'Apunta a TU propiedad (no al dormitorio del vecino: ley de privacidad). Graba en SD/NVR local, cambia clave admin, desactiva “subir a la nube” si no la quieres. Acceso remoto por app oficial o VPN/WireGuard (no abras puertos a lo loco).', nota: 'Cartel “zona videovigilada” disuade más que cámara escondida.', cuidado: 'Cámara a 220V afuera con cable a la vista = la cortan. Cable por dentro o por tubo.' },
  { n: 'Botón de pánico para abuelos / niños', ico: '🆘', para: 'Abuela sola, niño que llega del colegio: 1 botón pide ayuda.', mat: 'Botón wifi/Zigbee tipo llavero + rutina de aviso a 2–3 familiares.', como: 'Botón en velador/cuello: 1 toque = aviso “necesito ayuda” a la familia + prende luz entrada. Ensaya 1 vez al mes (que no les dé vergüenza usarlo). Pega al lado los números: Bomberos 132, Ambulancia 131, Carabineros 133.', nota: 'Complementa, no reemplaza: el teléfono con minutos sigue siendo el plan A.', cuidado: 'Botón sin pila = adorno. Revisa pila junto al detector de humo, cada luna.' }
];

var ENERGIA = [
  { n: 'Enchufe medidor: descubre los vampiros', ico: '🧛', para: 'Saber qué gasta de verdad (freezer viejo, deco, hervidor, PC).', mat: 'Enchufe inteligente con medición (W/kWh) + app.', como: 'Mide 24–48 h cada equipo: anota W en uso y en espera. Ataca primero lo que gasta dormido (deco, consola, parlante, cargadores). Regla: zapatilla con interruptor para el centro de entretención: 1 click y mueren 5 vampiros.', nota: '1 W eterno = 8.7 kWh/año. 5 vampiros de 5 W = ~$30 mil/año.', cuidado: 'Medir no es enchufar todo junto al mismo enchufe medidor: 1 equipo por vez en grandes (freezer, estufa).' },
  { n: 'Freezer y refrigerador: el gasto silencioso', ico: '❄️', para: 'Bajar 10–20% la cuenta sin comprar nada nuevo.', mat: 'Termómetro barato + enchufe medidor (opcional), aspiradora.', como: 'Limpia serpentín trasero cada 6 lunas (polvo = +15% gasto). Gomas: mete un billete y cierra; si sale fácil, cambia goma. Temp: refrí 3–4 °C, freezer −18 °C. No pegues el equipo a la muralla (10 cm aire) ni metas olla caliente.', nota: 'Freezer escarchado de 1 cm gasta ~20% más: descongela en menguante otoñal.', cuidado: 'Desenchufa antes de limpiar atrás. No pinches el hielo con cuchillo (pinchas el gas).' },
  { n: 'Humedad de Penco: sensor que avisa el hongo', ico: '🌫️', para: 'Pieza con olor a humedad, closet con manchas, ventana llorando.', mat: 'Termohigrómetro wifi (T° + HR) por pieza crítica.', como: 'Meta sana: 40–60% HR. Si marca >70% seguido: ventila 10 min mañana y tarde (aunque llueva, el aire de afuera frío seca al entrar), separa muebles 5 cm de la muralla, usa deshumedecedor o estufa seca con sensor que la apague al llegar a 55%.', nota: 'El hongo negro no se tapa con pintura: se lava con cloro diluido + guantes + mascarilla y se ataca la causa (ventilación/filtración).', cuidado: 'Estufa a parafina sin ventilación = CO + más humedad. Prefiere tiro balanceado o pellet certificado.' },
  { n: 'Corte de luz: que internet sobreviva', ico: '🔋', para: 'Temporal con corte: mantener router + 1 luz + carga de celus.', mat: 'UPS 600–1000 VA para router/ONT + luz de emergencia LED + banco de energía.', como: 'UPS solo para router + fibra (no para estufa ni hervidor: lo funde). Luz de emergencia enchufada siempre en pasillo (se prende sola al corte). Banco cargado para 2 cargas de celu. Anota en papel la clave wifi (sin luz no la buscas en el celu descargado).', nota: 'UPS 600 VA ≈ 2–4 h solo router. Prueba 1 vez cada 3 lunas: desenchufa y mide cuánto aguanta.', cuidado: 'Generador bencinero: NUNCA dentro ni en logia cerrada (CO mortal). Afuera, bajo techo ventilado, con alargador.' },
  { n: 'Agua caliente sin derroche (calefón / termo)', ico: '🚿', para: 'Ducha que sale hirviendo + fría = gas/luz a la basura.', mat: 'Termómetro ducha + (opcional) enchufe programable para termo eléctrico.', como: 'Calefón: ajusta llama/paso para ducharte solo con la caliente casi plena (mezclar mucha fría = pagas gas de más). Termo eléctrico: programa 1–2 h antes de la ducha, no 24 h (termo 1500 W todo el día ≈ 15 kWh). Ducha 5 min con cabezal eficiente.', nota: 'Baja 2 °C al termo y casi no lo notas, pero la cuenta sí.', cuidado: 'Calefón con llama amarilla/hollín o que se apaga = mantención con técnico ya (CO).' },
  { n: 'Rutina “Salí de casa” y “Llegué”', ico: '🏃', para: 'Un toque apaga/enciende lo importante sin recorrer la casa.', mat: '2–3 enchufes/ampolletas wifi + app con escenas o Home Assistant.', como: 'Escena SALIR: apaga luces + estufa eléctrica + parlante + deja solo freezer/router/cámaras; avisa si quedó puerta abierta. Escena LLEGAR (al acercarte o al abrir portón): prende entrada + desactiva sirena. Ensaya 1 semana y ajusta.', nota: 'La mejor automatización es la que nadie nota: si hay que “pelear” con ella, simplifícala.', cuidado: 'Nunca automatices corte de freezer, bomba de achique, ni equipo médico: eso va directo, sin wifi de por medio.' }
];

var PROYECTOS = [
  { n: '1 · Luz de patio que se prende sola', ico: '💡', dif: 'Fácil · 1 tarde', costo: '$25–60 mil', mat: 'Foco LED 20–30 W con sensor PIR o foco + sensor aparte, caja estanca, cable, conectores.', pasos: 'Corta la luz. Saca el foco viejo. Fija el nuevo a 2.5 m mirando al paso (no a la calle). Conecta fase-neutro-tierra con conectores (no “pelado”). Sella pasadas con silicona. Da la luz y ajusta 2 min de noche.', tip: 'Si arriendas: usa foco solar con sensor (sin cables, $20 mil) pegado con tornillo mínimo.' },
  { n: '2 · Portón que avisa al celu', ico: '🚪', dif: 'Fácil · 1 hora', costo: '$12–25 mil', mat: 'Sensor magnético wifi a pila + buena señal wifi en el portón.', pasos: 'Limpia y seca el fierro. Pega sensor en marco e imán en hoja (<1 cm). Agrega a wifi 2.4 GHz y nómbralo “Portón”. Crea aviso “si abre de noche”. Prueba entreabierto.', tip: 'Fierro + lluvia matan señal: si falla, acerca un repetidor a la ventana más cercana.' },
  { n: '3 · Alarma casera puerta + sirena', ico: '🚨', dif: 'Fácil · 1 tarde', costo: '$30–60 mil', mat: '2 sensores puerta + sirena wifi interior + app con modos Casa/Fuera.', pasos: 'Instala sensores en puerta principal y ventana patio. Pon sirena enchufada al centro (se escucha en toda la casa). Crea modo Noche (solo perímetro) y Fuera (todo). Ensaya con la familia de día.', tip: 'Suma foco patio a la misma rutina: luz + bulla disuaden el doble.' },
  { n: '4 · Detectores de humo interconectados', ico: '🔥', dif: 'Fácil · 1 hora', costo: '$30–70 mil (2–3 unid.)', mat: '2–3 detectores humo fotoeléctricos interconectados (radio) + CO si hay leña/gas.', pasos: 'Uno al techo del pasillo de piezas, otro en living/escalera. CO a 1.5 m fuera de piezas. Enlázalos según manual (botón 3 seg). Prueba mensual con el botón.', tip: 'Fecha con plumón detrás: cámbialos a los 10 años aunque “piten bien”.' },
  { n: '5 · Guardián de la lavadora (anti-inundación)', ico: '💧', dif: 'Fácil · 30 min', costo: '$15–30 mil', mat: 'Sensor inundación wifi + mangueras trenzadas si las viejas están globosas.', pasos: 'Pon sensor en el suelo tras la lavadora. Cambia mangueras cuarteadas por trenzadas con goma nueva. Crea aviso fuerte al celu. Cierra la llave del agua si sales más de 1 día.', tip: 'Suma otro bajo el lavaplatos: es el segundo lugar que más se inunda.' },
  { n: '6 · Caza vampiros en 1 semana', ico: '🧛', dif: 'Fácil · ratos libres', costo: '$12–20 mil (1 medidor)', mat: '1 enchufe medidor + zapatilla con interruptor + papel para anotar.', pasos: 'Mide 24 h: deco, tele, consola, PC, cargadores. Anota W dormido. Agrupa entretención en zapatilla con interruptor. Programa apagado nocturno del router secundario (no el principal). Calcula ahorro en ⚡ Consumo eléctrico.', tip: 'Meta realista: bajar 5–10% el primer mes sin sufrir.' },
  { n: '7 · Velador del abuelo (luz + botón)', ico: '👵', dif: 'Fácil · 1 hora', costo: '$25–45 mil', mat: 'Ampolleta wifi velador + botón wifi llavero + números de emergencia en papel.', pasos: 'Ampolleta cálida con rutina “tenue 21:00–07:00”. Botón: 1 toque = aviso a familia + prende entrada. Pega números 132/131/133 al lado. Ensaya juntos 1 vez.', tip: 'Luz tenue nocturna evita caídas al baño: más importante que cualquier sensor.' },
  { n: '8 · Riego que no inunda (huerta Penco)', ico: '🌱', dif: 'Media · 1 fin de semana', costo: '$30–80 mil', mat: 'Temporizador de pila para llave + manguera goteo + (opcional) sensor lluvia.', pasos: 'Arma goteo a bancales (ver 🌱 Siembra). Programa 2 riegos cortos al amanecer (mejor que 1 largo). Si llueve, el sensor lo salta solo. Revisa filtros cada luna (agua con sarro tapa goteros).', tip: 'Combina con 🪱 Compost: suelo con materia orgánica pide la mitad de agua.' }
];

var CHECKS = [
  { id: 'd_tablero', n: 'Tablero sano y rotulado', d: 'Sé cuál automático corta cada zona, el diferencial salta al probarlo (botón TEST) y no hay “arreglo con alambre”. Si no: eléctrico esta luna.' },
  { id: 'd_tierra', n: 'Tierra y diferencial vivos', d: 'Enchufes con tierra real (tester o técnico), sin adaptadores “sin tierra”. El diferencial protege baño/cocina/patio.' },
  { id: 'd_zapa', n: 'Sin zapatillas en cadena', d: 'Ninguna zapatilla sobre otra, ningún enrollado alimentando estufa/hervidor/microondas. Grandes directo al enchufe de muralla.' },
  { id: 'd_humo', n: 'Humo + CO con pila y prueba', d: 'Detectores instalados, botón probado esta luna, fecha de vencimiento anotada (<10 años).' },
  { id: 'd_gas', n: 'Gas vigilado', d: 'Flexible + regulador <5 años, detector donde corresponde (licuado abajo / natural arriba), llave de paso ubicada por todos.' },
  { id: 'd_claves', n: 'Claves de fábrica cambiadas', d: 'Cada cámara/enchufe/ampolleta con clave propia + red wifi con clave. Nada con “admin/admin”.' },
  { id: 'd_local', n: 'Lo crítico anda sin internet', d: 'Chapa, humo, gas, luz de emergencia y linterna funcionan con corte de luz e internet caído.' },
  { id: 'd_agua', n: 'Agua vigilada', d: 'Sensor bajo lavadora/calefón + mangueras sanas + llave de corte ubicada. Se cierra si salen 1+ día.' },
  { id: 'd_respaldo', n: 'Respaldo de corte listo', d: 'UPS/router probado, luz emergencia enchufada, banco cargado, clave wifi en papel.' },
  { id: 'd_inventario', n: 'Inventario al día', d: 'Todo equipo anotado en 📓 Mi casa: dónde está, qué red usa, cuándo se le cambió pila.' },
  { id: 'd_familia', n: 'Familia entrenada', d: 'Todos saben modo manual, botón de pánico, números 132/131/133 y dónde cortar luz/agua/gas.' },
  { id: 'd_luna', n: 'Mantención de la luna', d: 'Probar detectores + mirar app de consumos + limpiar serpentín/polvo + revisar avisos. 15 min, menguante.' }
];

var TIPOS_DISP = ['💡 Luz / ampolleta', '🔌 Enchufe inteligente', '📦 Relé (Shelly/Sonoff)', '🚶 Sensor movimiento', '🚪 Sensor puerta/ventana', '🔥 Humo / CO / gas', '💧 Agua / humedad', '📷 Cámara', '🚨 Sirena / botón', '🌡️ Clima (T°/HR)', '⏱️ Temporizador / riego', '🔋 Respaldo (UPS/luz)', '🧠 Hub / Home Assistant', '📦 Otro'];
var ESTADOS = ['😍 OK', '🙂 Intermitente', '🛠️ Revisar', '🔋 Sin pila/batería', '📶 Sin wifi', '🛒 Reponer'];

/* ---------------- DIALOGO ---------------- */
function rowCard(c) {
  if (c.txt) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4>' +
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
  ['Guia', 'Luces', 'Seg', 'Energia', 'Proy', 'Casa'].forEach(function (t) {
    var p = $('dom' + t), b = $('tabDom' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

function buildDialog() {
  var guiaHTML = GUIAS.map(rowCard).join('');
  var lucesHTML = LUCES.map(rowCard).join('');
  var segHTML = SEGURIDAD.map(rowCard).join('');
  var eneHTML = ENERGIA.map(rowCard).join('');
  var proyHTML = PROYECTOS.map(rowCard).join('');

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabDomGuia" class="btn btn-accent" style="width:auto">🏠 Guía</button>' +
    '<button type="button" id="tabDomLuces" class="btn" style="width:auto">💡 Iluminación</button>' +
    '<button type="button" id="tabDomSeg" class="btn" style="width:auto">🛡️ Seguridad</button>' +
    '<button type="button" id="tabDomEnergia" class="btn" style="width:auto">⚡ Energía</button>' +
    '<button type="button" id="tabDomProy" class="btn" style="width:auto">🛠️ Proyectos</button>' +
    '<button type="button" id="tabDomCasa" class="btn" style="width:auto">📓 Mi casa</button></div>' +

    '<div id="domGuia">' + guiaHTML +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🧭 Por dónde partir hoy</h4><p class="muted" style="font-size:12px">1) Elige 1 dolor (patio prendido, portón abierto, cuenta alta). 2) Haz el proyecto N°1–8 que lo resuelve. 3) Anótalo en 📓 Mi casa. 4) Cuando domines 3 equipos, recién piensa en Home Assistant. Lo simple que funciona le gana a lo avanzado a medias.</p></div></div>' +

    '<div id="domLuces" class="hidden"><div class="conv-row"><label style="flex:1">🔍 Filtrar <input type="text" id="domLucesQ" placeholder="patio, relé, sensor, temporizador..."></label></div><div id="domLucesList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + lucesHTML + '</div></div>' +
    '<div id="domSeg" class="hidden"><div class="conv-row"><label style="flex:1">🔍 Filtrar <input type="text" id="domSegQ" placeholder="humo, gas, agua, cámara, puerta..."></label></div><div id="domSegList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + segHTML + '</div></div>' +
    '<div id="domEnergia" class="hidden"><div class="conv-row"><label style="flex:1">🔍 Filtrar <input type="text" id="domEnergiaQ" placeholder="vampiro, freezer, humedad, corte, calefón..."></label></div><div id="domEnergiaList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + eneHTML + '</div></div>' +
    '<div id="domProy" class="hidden"><div class="menstrual-card"><h4>🛠️ 8 proyectos para hacer en casa</h4><p class="muted" style="font-size:11px">Costos referenciales ferretería Biobío 2026. Si algo va al tablero o a gas: técnico autorizado.</p></div><div id="domProyList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + proyHTML + '</div></div>' +

    '<div id="domCasa" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Anotar equipo</h4>' +
    '<div class="conv-row"><label style="flex:2">Equipo * <input type="text" id="domNombre" placeholder="ej: Foco patio, Sensor portón, Cámara entrada" maxlength="50"></label>' +
    '<label>Tipo <select id="domTipo">' + TIPOS_DISP.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Lugar <input type="text" id="domLugar" placeholder="ej: patio, cocina, pieza abuela" maxlength="30"></label>' +
    '<label>Red / IP <input type="text" id="domRed" placeholder="ej: Casa_2.4G / 192.168.1.50" maxlength="30"></label>' +
    '<label>Estado <select id="domEstado">' + ESTADOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<label>Nota (pila, clave, vencimiento...) <input type="text" id="domNota" placeholder="ej: pila CR2450 cambiada ene 2026, detector vence 2032" maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="domAdd" class="btn btn-accent" style="width:auto">+ Guardar equipo</button></div></div>' +

    '<div class="menstrual-card" style="margin-top:8px"><h4>🤖 Automatización (si → entonces)</h4>' +
    '<div class="conv-row"><label style="flex:2">Si pasa esto <input type="text" id="domAutoSi" placeholder="ej: portón abre de noche" maxlength="60"></label>' +
    '<label style="flex:2">Entonces haz esto <input type="text" id="domAutoHz" placeholder="ej: prende foco patio 3 min + avisa" maxlength="60"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="domAutoAdd" class="btn" style="width:auto">+ Guardar automatización</button></div>' +
    '<div id="domAutoList" style="margin-top:8px"></div></div>' +

    '<div class="menstrual-card" style="margin-top:8px"><h4>🧰 Bitácora (fallas y mantención)</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="domBitFecha"></label><label style="flex:2">Qué pasó / qué hice <input type="text" id="domBitTxt" placeholder="ej: sensor portón sin wifi, acerqué repetidor, OK" maxlength="120"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="domBitAdd" class="btn" style="width:auto">+ Guardar en bitácora</button></div>' +
    '<div id="domBitList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div>' +

    '<div class="menstrual-card" style="margin-top:8px"><h4>✅ Chequeo casa inteligente y segura</h4><p class="muted" style="font-size:11px">12 puntos. Meta sana: 9/12. Repite 1 vez por luna (menguante).</p><div id="domCheckList"></div>' +
    '<div style="background:var(--panel);border-radius:6px;height:10px;overflow:hidden;margin-top:8px"><div id="domCheckBar" style="width:0%;height:100%;background:linear-gradient(90deg,#e76e8a,#e8c56a,#8fd694)"></div></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px" id="domCheckTxt"></p></div>' +

    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">🔍 Buscar en mi casa <input type="text" id="domQ" placeholder="patio, cámara, pila..."></label></div>' +
    '<div id="domResumen" class="menstrual-card" style="margin-top:8px"></div>' +
    '<div id="domLog" style="margin-top:8px;display:flex;flex-direction:column;gap:8px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="domStats" class="muted" style="font-size:11px"></span><span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="domShare" class="btn" style="width:auto">📤 Compartir</button><button type="button" id="domClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>';

  makeDialog('domoticaDialog', '🏠 Domótica — casa que ayuda y avisa',
    'Iluminación, sensores, energía y 8 proyectos paso a paso + tu inventario. Vive en <b>🏡 Hogar y Vida Práctica > 🔧 Energía y Taller</b>, junto a ⚡ Consumo eléctrico y 🔧 Mecánica. Todo <b>privado y local</b>, 100% offline. 220V Chile: ante la duda, eléctrico SEC.',
    body);
}

/* ---------------- MI CASA ---------------- */
function puntaje() {
  var s = store(), n = 0;
  CHECKS.forEach(function (c) { if (s.checks[c.id]) n++; });
  return n;
}
function renderChecks() {
  var box = $('domCheckList'); if (!box) return;
  var s = store();
  box.innerHTML = CHECKS.map(function (c) {
    var on = !!s.checks[c.id];
    return '<label class="check-row" style="align-items:flex-start;border:1px solid var(--line);border-radius:8px;padding:8px;margin-bottom:6px;cursor:pointer">' +
      '<input type="checkbox" data-dchk="' + c.id + '"' + (on ? ' checked' : '') + ' style="margin-top:3px"> ' +
      '<span><b>' + esc(c.n) + '</b><br><span class="muted" style="font-size:11px">' + esc(c.d) + '</span></span></label>';
  }).join('');
  var pts = puntaje(), tot = CHECKS.length, pct = Math.round(pts / tot * 100);
  var bar = $('domCheckBar'), txt = $('domCheckTxt');
  if (bar) bar.style.width = pct + '%';
  if (txt) txt.textContent = 'Mi escudo: ' + pts + '/' + tot + ' (' + pct + '%) ' + (pts <= 4 ? '🔴 Parte por tablero + humo + claves esta semana.' : (pts <= 8 ? '🟡 En camino: cierra los que faltan.' : (pts < tot ? '🟢 Casi lista: mantén 1 revisión por luna.' : '🟢 Casa al día: repasa cada luna.')));
  box.querySelectorAll('[data-dchk]').forEach(function (c) {
    c.onchange = function () {
      var st = store();
      st.checks[c.getAttribute('data-dchk')] = c.checked ? true : false;
      save(c.checked ? 'Paso activado ✅' : 'Guardado');
      renderChecks();
    };
  });
}
function renderCasa() {
  renderChecks();
  var box = $('domLog'); if (!box) return;
  var m = store();
  var q = (($('domQ') && $('domQ').value) || '').toLowerCase();
  var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
  var list = m.dispositivos.filter(function (r) {
    if (!q) return true;
    var t = ((r.nombre || '') + ' ' + (r.tipo || '') + ' ' + (r.lugar || '') + ' ' + (r.nota || '')).toLowerCase();
    var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
    return tn.indexOf(qn) >= 0;
  });
  var res = $('domResumen'), st = $('domStats');
  var mal = m.dispositivos.filter(function (r) { return (r.estado || '').indexOf('OK') < 0; }).length;
  if (res) {
    res.innerHTML = '<h4>📊 Resumen</h4><p class="muted" style="font-size:12px">' + m.dispositivos.length + ' equipo(s) · ' +
      m.autos.length + ' automatización(es) · ' + m.bitacora.length + ' nota(s) bitácora' +
      (mal ? ' · ⚠️ ' + mal + ' por revisar' : ' · 🟢 todo OK') +
      ' · ✅ chequeo ' + puntaje() + '/' + CHECKS.length + '</p>';
  }
  if (!list.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">' + (m.dispositivos.length ? 'Sin resultados para ese filtro.' : 'Sin equipos aún. Anota el primero arriba: ej “Foco patio”.') + '</p>';
  } else {
    box.innerHTML = list.slice().sort(function (a, b) { return String(a.nombre).localeCompare(String(b.nombre)); }).slice(0, 80).map(function (r) {
      var ico = (r.tipo || '📦').split(' ')[0];
      return '<div class="si-card"><h4>' + esc(ico + ' ' + (r.nombre || 'Equipo')) + '</h4>' +
        '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">' + esc(r.tipo || '') + '</span>' +
        (r.lugar ? '<span class="chip" style="font-size:10px">📍 ' + esc(r.lugar) + '</span>' : '') +
        (r.red ? '<span class="chip" style="font-size:10px">📶 ' + esc(r.red) + '</span>' : '') +
        (r.estado ? '<span class="chip" style="font-size:10px">' + esc(r.estado) + '</span>' : '') + '</p>' +
        (r.nota ? '<p class="muted">' + esc(r.nota) + '</p>' : '') +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
        '<button type="button" class="btn dom-ok" data-k="' + esc(r.id) + '" style="width:auto;font-size:11px">✅ OK</button>' +
        '<button type="button" class="btn dom-del" data-k="' + esc(r.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div></div>';
    }).join('');
    box.querySelectorAll('.dom-del').forEach(function (x) {
      x.onclick = function () {
        if (!confirm('¿Borrar este equipo del inventario?')) return;
        var s2 = store();
        s2.dispositivos = (s2.dispositivos || []).filter(function (r) { return r.id !== x.dataset.k; });
        save(); renderCasa();
      };
    });
    box.querySelectorAll('.dom-ok').forEach(function (x) {
      x.onclick = function () {
        var s2 = store();
        var r = (s2.dispositivos || []).filter(function (a) { return a.id === x.dataset.k; })[0];
        if (r) { r.estado = '😍 OK'; save('Equipo OK ✅'); renderCasa(); }
      };
    });
  }
  if (st) st.textContent = list.length + ' mostrado(s) · ' + m.dispositivos.length + ' total';
  renderAutos();
  renderBit();
}
function renderAutos() {
  var box = $('domAutoList'); if (!box) return;
  var m = store();
  if (!m.autos.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin automatizaciones. Ej: Si “portón abre de noche” → “prende patio 3 min”.</p>'; return; }
  box.innerHTML = m.autos.map(function (r) {
    return '<div class="hora-item"><span style="font-size:12px">🤖 Si <b>' + esc(r.si) + '</b> → ' + esc(r.hz) + ' <span class="muted">· ' + esc(r.fecha || '') + '</span></span>' +
      '<button type="button" class="btn btn-icon dom-auto-del" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.dom-auto-del').forEach(function (x) {
    x.onclick = function () {
      var s2 = store();
      s2.autos = (s2.autos || []).filter(function (r) { return r.id !== x.dataset.k; });
      save(); renderCasa();
    };
  });
}
function renderBit() {
  var box = $('domBitList'); if (!box) return;
  var m = store();
  var data = (m.bitacora || []).slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  if (!data.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin notas. Anota fallas y arreglos: te ahorra repetir errores.</p>'; return; }
  box.innerHTML = data.slice(0, 60).map(function (r) {
    return '<div class="hora-item"><span style="font-size:12px">📝 <b>' + esc(r.fecha || '') + '</b> · ' + esc(r.txt || '') + '</span>' +
      '<button type="button" class="btn btn-icon dom-bit-del" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.dom-bit-del').forEach(function (x) {
    x.onclick = function () {
      var s2 = store();
      s2.bitacora = (s2.bitacora || []).filter(function (r) { return r.id !== x.dataset.k; });
      save(); renderCasa();
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
    var existing = $('btnDomotica');
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
        btn.id = 'btnDomotica'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🏠 Domótica';
        try { btn.setAttribute('data-sub', 'energia'); } catch (eS2) {}
        btn.setAttribute('data-keywords', 'domotica casa inteligente smart home wifi sensor rele shelly sonoff automatizacion iluminacion camara humo gas inundacion energia consumo alexa google home assistant zigbee tasmota esphome taller hogar');
        var refC = g.querySelector('#btnConvert');
        if (refC) g.insertBefore(btn, refC);
        else g.appendChild(btn);
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + orden hogar|energia + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnDomotica') < 0) ALL_BTNS.push('btnDomotica');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnDomotica = ['hogar', 'energia'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['hogar|energia'] && BTN_ORDER['hogar|energia'].indexOf('btnDomotica') < 0) {
      var _o = BTN_ORDER['hogar|energia'], _ni = _o.indexOf('btnConvert');
      if (_ni < 0) _o.push('btnDomotica'); else _o.splice(_ni, 0, 'btnDomotica');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnDomotica = true; });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Hogar y Vida Práctica) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnDomotica"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Hogar') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnDomotica"> 🏠 Domótica';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnDomotica !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnDomotica = lab.querySelector('input').checked;
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
  renderCasa();

  var b = $('btnDomotica');
  if (b) b.onclick = function () {
    renderCasa();
    switchTab('Guia');
    openDlg('domoticaDialog');
  };

  ['Guia', 'Luces', 'Seg', 'Energia', 'Proy', 'Casa'].forEach(function (t) {
    var tb = $('tabDom' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  bindFilter('domLucesQ', 'domLucesList');
  bindFilter('domSegQ', 'domSegList');
  bindFilter('domEnergiaQ', 'domEnergiaList');
  var dq = $('domQ'); if (dq) dq.oninput = renderCasa;

  var ad = $('domAdd');
  if (ad) ad.onclick = function () {
    var nom = clean((($('domNombre') || {}).value || '').trim(), 50);
    if (!nom) return alert('Escribe el nombre del equipo (ej: Foco patio)');
    var m = store();
    m.dispositivos.push({
      id: uid('dom'),
      nombre: nom,
      tipo: ($('domTipo') || {}).value || TIPOS_DISP[0],
      lugar: clean((($('domLugar') || {}).value || '').trim(), 30),
      red: clean((($('domRed') || {}).value || '').trim(), 30),
      estado: ($('domEstado') || {}).value || ESTADOS[0],
      nota: clean((($('domNota') || {}).value || '').trim(), 120),
      fecha: todayKey()
    });
    save('Equipo guardado 🏠');
    if ($('domNombre')) $('domNombre').value = '';
    if ($('domLugar')) $('domLugar').value = '';
    if ($('domRed')) $('domRed').value = '';
    if ($('domNota')) $('domNota').value = '';
    renderCasa();
  };

  var aa = $('domAutoAdd');
  if (aa) aa.onclick = function () {
    var si = clean((($('domAutoSi') || {}).value || '').trim(), 60);
    var hz = clean((($('domAutoHz') || {}).value || '').trim(), 60);
    if (!si || !hz) return alert('Escribe el “si” y el “entonces” (ej: Si portón abre de noche → prende patio)');
    store().autos.push({ id: uid('dau'), si: si, hz: hz, fecha: todayKey() });
    save('Automatización guardada 🤖');
    if ($('domAutoSi')) $('domAutoSi').value = '';
    if ($('domAutoHz')) $('domAutoHz').value = '';
    renderCasa();
  };

  var ba = $('domBitAdd');
  if (ba) ba.onclick = function () {
    var tx = clean((($('domBitTxt') || {}).value || '').trim(), 120);
    if (!tx) return alert('Cuéntanos en 1 línea qué pasó o qué hiciste');
    store().bitacora.push({ id: uid('dbi'), fecha: ($('domBitFecha') || {}).value || todayKey(), txt: tx });
    save('Bitácora guardada 📝');
    if ($('domBitTxt')) $('domBitTxt').value = '';
    renderCasa();
  };
  try { if ($('domBitFecha') && !$('domBitFecha').value) $('domBitFecha').value = todayKey(); } catch (e) {}

  var sh = $('domShare');
  if (sh) sh.onclick = async function () {
    var d = store();
    if (!d.dispositivos.length && !d.autos.length) return alert('Sin equipos aún');
    var t = '🏠 Mi casa domótica · ' + todayKey() + ' · ✅ ' + puntaje() + '/' + CHECKS.length + '\n\nEquipos:\n' + d.dispositivos.map(function (r) {
      return '• ' + r.nombre + ' (' + (r.tipo || '') + ')' + (r.lugar ? ' · ' + r.lugar : '') + ' · ' + (r.estado || '');
    }).join('\n') + (d.autos.length ? '\n\nAutomatizaciones:\n' + d.autos.map(function (r) { return '• Si ' + r.si + ' → ' + r.hz; }).join('\n') : '');
    await share('Mi domótica', t);
  };
  var cl = $('domClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu inventario de domótica (equipos + autos + bitácora)? El chequeo se conserva.')) return;
    try { var u = userData(); if (u && u.domotica) { u.domotica.dispositivos = []; u.domotica.autos = []; u.domotica.bitacora = []; } } catch (e) {}
    save(); renderCasa();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
