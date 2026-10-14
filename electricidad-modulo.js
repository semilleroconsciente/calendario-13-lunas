/* ============================================================
   ELECTRICIDAD DOMICILIARIA — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección hub dentro de Hogar y Vida Práctica > Energía y Taller:
   - Botón btnElectricidad (inyectado en grupo hogar, sub energia,
     primero: hub integrador junto a Consumo / Leña / Taller /
     Mecánica / Domótica / Electrónica / Herramientas)
   - Diálogo electricidadDialog con 6 pestañas:
     1) 📘 Guía base (qué puedes tocar tú / qué toca eléctrico SEC)
     2) 🧰 Tablero y protecciones (automáticos, diferencial, tierra)
     3) 🔌 Circuitos de la casa (enchufes, luz, cocina, baño, patio)
     4) 🧾 Boleta y consumo (leer boleta, kWh, tarifa, calculadora)
     5) ☀️ Autonomía y cortes (solar, generador, UPS, temporal)
     6) 📓 Mi instalación (circuitos + lecturas kWh + bitácora + chequeo)
   - No duplica: deriva detalle a las secciones que ya existen:
     📊 Consumo (btnEnergy: artefactos y $), 🏠 Domótica (btnDomotica),
     🔌 Electrónica (btnElectronica: baja tensión), 🧰 Herramientas,
     🔧 Bitácora Taller (btnTaller). Esta sección es la RED 220V.
   - Todo local y privado por usuario: userData().electricidad
     { circuitos:[], lecturas:[], bitacora:[], checks:{} }
   - 100% offline. Enfoque Chile 220V + SEC: tablero adentro y
     empalme solo con eléctrico/instalador autorizado (TE1/TE4).
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
    if (!u) return { circuitos: [], lecturas: [], bitacora: [], checks: {} };
    if (!u.electricidad) u.electricidad = { circuitos: [], lecturas: [], bitacora: [], checks: {} };
    var m = u.electricidad;
    if (!Array.isArray(m.circuitos)) m.circuitos = [];
    if (!Array.isArray(m.lecturas)) m.lecturas = [];
    if (!Array.isArray(m.bitacora)) m.bitacora = [];
    if (!m.checks || typeof m.checks !== 'object' || Array.isArray(m.checks)) m.checks = {};
    return m;
  } catch (e2) { return { circuitos: [], lecturas: [], bitacora: [], checks: {} }; }
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
function gotoBtn(id) { try { var x = $(id); if (x) { x.click(); return true; } } catch (e) {} return false; }

/* ---------------- DATOS ---------------- */
var GUIAS = [
  { n: 'Tu instalación en 1 dibujo', ico: '🗺️', txt: 'Empalme (medidor en la calle, de la compañía) → tablero (automáticos + diferencial, dentro de tu casa) → circuitos (enchufes, luz, cocina, patio). Tú vives DESPUÉS del tablero: enchufes, ampolletas, alargadores y artefactos. El empalme y el interior del tablero con sus automáticos los certifica un instalador autorizado SEC (TE1). Si tu casa no tiene TE1 ni tablero rotulado, esa es tu primera meta.' },
  { n: 'Lo que SÍ puedes hacer tú', ico: '✅', txt: 'Cambiar ampolletas por LED, reponer un enchufe/ interruptor 1 a 1 con la luz CORTADA (mismo lugar, mismos cables, respetando colores), armar alargadores certificados 16A, medir consumos con enchufe medidor, anotar lecturas kWh, limpiar tablero por fuera, probar el botón TEST del diferencial, rotular circuitos, detectar enchufes calientes o con olor y CORTAR su automático hasta que venga el técnico.' },
  { n: 'Lo que toca SOLO eléctrico SEC', ico: '⛔', txt: 'Abrir o modificar el tablero por dentro (agregar automáticos, cambiar el general, mover el diferencial), aumentar potencia o pedir empalme nuevo, picar muros para circuitos nuevos, instalar ducha eléctrica, cocina eléctrica, termo o bomba, certificar TE1/TE4, revisar empalme con sellos rotos, cualquier arreglo donde saltó el diferencial y no sabes por qué. Regla: si hay que pelar un cable que viene del muro y no sabes de qué automático depende: páralo y llama.' },
  { n: 'Los 3 guardianes (memorízalos)', ico: '🛡️', txt: 'AUTOMÁTICO (magnetotérmico): corta por sobrecarga y cortocircuito (ej 10A luz, 16A enchufes, 20–25A cocina). DIFERENCIAL (disyuntor 30mA): te salva a ti: corta si la corriente se escapa por tu cuerpo o a tierra; tiene botón TEST que debes apretar 1 vez por luna. TIERRA (cable verde-amarillo + barra): da camino seguro a la fuga; sin tierra el diferencial sirve a medias. Los 3 juntos o no hay seguridad.' },
  { n: 'Colores y calibres Chile', ico: '🎨', txt: 'FASE: rojo/negro/café (el que pega). NEUTRO: blanco o celeste claro (retorno). TIERRA: verde-amarillo SIEMPRE (no se usa para otra cosa). Calibres típicos domiciliarios: 1,5 mm² solo luz (10A), 2,5 mm² enchufes (16A), 4–6 mm² cocina/ducha eléctrica (20–32A, solo técnico). Alambre pelado, cinta enrollada o cable de parlante para 220V = incendio anunciado: se cambia hoy.' },
  { n: 'Penco manda: humedad, sur y sal', ico: '🌧️', txt: 'La humedad sulfata enchufes (polvo verde/blanco), el viento sur suelta techumbres sobre cables del patio y la brisa marina oxida cajas. Guarda el tablero seco y ventilado (nunca tras la ducha ni bajo filtración), usa cajas estancas IP65 afuera, silicona en pasadas y revisa patio/bodega cada otoño. En temporal: desenchufa TV/PC/consolas y vuelve a enchufar 5 min DESPUÉS que vuelve la luz (evitas el pico).' }
];

var TABLERO = [
  { n: 'Lee tu tablero en 2 minutos', ico: '🧰', para: 'Saber qué corta qué, antes de la emergencia.', mat: 'Lápiz, papel, linterna, un ayudante con celu.', como: 'Abre la tapa (no el interior). Apaga 1 automático, grita “¿qué se apagó?” y anota (ej “C2: enchufes living + patio”). Repite con cada uno. Marca el GENERAL (corta todo) y el DIFERENCIAL (con botón TEST). Pega la lista dentro de la tapa con huincha transparente. Anota el mapa en 📓 Mi instalación.', nota: 'Si hay automáticos sin nombre, con scotch quemado o “arreglo con alambre”: foto + eléctrico esta luna.', cuidado: 'No saques la tapa interior metálica ni toques borneras: ahí vive 220V pelado.' },
  { n: 'Diferencial: pruébalo cada luna', ico: '🔘', para: 'El único que te protege a ti, no a los cables.', mat: 'Tu dedo + 10 segundos.', como: 'Con la casa funcionando normal, aprieta TEST: debe saltar al tiro y cortar media casa o toda. Vuelve a subirlo. Si NO salta, si está trabado, o si salta solo sin razón aparente 2+ veces en la semana: no lo “aguantes” subiéndolo a la fuerza, llama a eléctrico. Anota la prueba en el chequeo.', nota: 'Diferencial ideal: 2 polos 25–40A 30mA para casa. Si tu casa vieja no tiene: es la mejora N°1 (más que pintar).', cuidado: 'Diferencial que salta con la ducha, el hervidor o la lavadora avisa una fuga real: no lo puentees jamás.' },
  { n: 'Saltó un automático: qué hacer', ico: '⚠️', para: 'Volver con calma y sin quemar nada.', mat: 'Linterna (no velas junto al tablero).', como: '1) Desenchufa lo último que conectaste en ese circuito. 2) Baja TODOS los del circuito afectado, sube el general/diferencial, y sube de a UNO: el que salta de nuevo es el culpable. 3) Si es sobrecarga (estufa + hervidor + microondas juntos), reparte en otros enchufes. 4) Si salta con todo desenchufado = falla en el muro: déjalo ABAJO y llama.', nota: 'Automático tibio o con olor a quemado = cambio por técnico (mismo valor, nunca más grande “para que aguante”).', cuidado: 'Subir y subir el que salta derrite cables dentro del muro: 2 intentos y se para.' },
  { n: 'Tierra: la olvidada que salva', ico: '🌍', para: 'Casas viejas de Penco sin tierra real.', mat: 'Destornillador, tester o técnico con telurómetro.', como: 'Mira un enchufe: debe tener 3 patas y el cable verde-amarillo atrás. Prueba barata: buscapolo + tester entre fase y tierra debe dar ~220V; entre neutro y tierra ~0–5V. Si todos tus enchufes son de 2 patas o hay “tierra” amarrada a una cañería: anota “sin tierra” en 📓 Mi instalación y pide presupuesto (barra + cable + revisión).', nota: 'Adaptadores “universales sin tierra” solo para cargadores chicos, nunca para lavadora, calefón, microondas ni herramientas.', cuidado: 'Corte de tierra + calefón/ducha eléctrica = riesgo mortal: esos van con tierra y diferencial sí o sí.' },
  { n: 'Cuándo pedir TE1 / aumento de potencia', ico: '📄', para: 'Vendes, arriendas, amplías o pones cocina eléctrica.', mat: 'Instalador autorizado SEC (busca en sec.cl por RUT).', como: 'El instalador revisa tablero, tierra, circuitos y declara la instalación (TE1) ante la SEC; si pones paneles con inyección a la red, sigue el TE4 + NetBilling con la distribuidora (CGE/Frontel). Guarda el certificado en papel + foto en 📓 Mi instalación. Sin TE1 la compañía puede negarte empalme nuevo y el seguro no responde ante incendio.', nota: 'Potencia típica casa Penco: 3–6 kW. Si salta el empalme (medidor) con todo normal: pide revisión, no “más potencia” a ciegas.', cuidado: 'Desconfía del “maestro que te aumenta el automático del medidor”: es ilegal y funde el empalme.' }
];

var CIRCUITOS = [
  { n: 'Enchufes que no queman', ico: '🔌', para: 'Living, piezas, escritorio con muchos cargadores.', mat: 'Enchufes 16A certificados, tapas, buscapolo.', como: 'Un enchufe tibio, con chispa al conectar o tapa amarilla = cámbialo 1 a 1 con la luz cortada (foto antes, mismos colores, apriete firme: tira el cable, no debe soltarse). Un enchufe por equipo grande; nada de zapatilla sobre zapatilla ni enrollados alimentando estufa/hervidor. Si suena “frito” o huele a quemado: corta su automático hoy.', nota: 'Cocina y lavadero piden circuitos propios de 16–20A; el resto se reparte para no sobrecargar uno solo.', cuidado: 'Enchufe de baño o cocina sin tapa/aleta + manos mojadas = solo con diferencial y técnico.' },
  { n: 'Luz: LED bien puesto', ico: '💡', para: 'Toda la casa: bajar cuenta sin penar.', mat: 'Ampolletas LED 9–12W cálidas 2700–3000K, soquetes sanos.', como: 'Cambia halógenas/incandescentes por LED (misma rosca E27, ~8 veces menos gasto). Soquete negro o que parpadea al tocar = cambia el soquete con luz cortada. Patio y pasillo con sensor o fotocelda (ver 🏠 Domótica): luz que se apaga sola ahorra más que la más eficiente prendida toda la noche.', nota: 'LED que parpadea con interruptor apagado = interruptor con piloto o sin neutro: cambia el interruptor o usa otra marca.', cuidado: 'Nada de LED dentro de campana/estufa ni dimmer viejo de muralla sin ser compatible.' },
  { n: 'Cocina: el circuito que más sufre', ico: '🍳', para: 'Hervidor 1500W + microondas 1200W + horno: juntos funden todo.', mat: 'Enchufes 16A dedicados, reloj mental de turnos.', como: 'Regla de turnos: 1 grande a la vez por circuito (hierve, luego calienta). Hervidor, microondas y horno directo al enchufe de muralla, nunca a zapatilla ni alargador enrollado. Si el enchufe de la cocina sale caliente: reparte hoy y anota en bitácora; si se repite con un solo equipo = técnico.', nota: 'Cocina eléctrica, encimera o termo: circuito nuevo + automático propio dimensionado por eléctrico (no es “un enchufe más”).', cuidado: 'Alargador enrollado con estufa/hervidor se calienta como estufa: desenrolla todo o no lo uses.' },
  { n: 'Baño y lavadero: agua + 220V', ico: '🚿', para: 'Zona más peligrosa de la casa.', mat: 'Diferencial + tapas + orden.', como: 'Todo baño/lavadero cuelga del diferencial: pruébalo esta luna. Enchufes con tapa, lejos del chorro (mín 60 cm de ducha/lavamanos), secador/plancha desenchufados al terminar, nada de calefactor barato junto a la cortina. Calefón con llama amarilla, hollín o que se apaga = técnico a gas ya (CO). Ducha eléctrica: solo con tierra + diferencial + circuito propio instalado por técnico.', nota: 'Estufa a parafina en baño cerrado = CO + humedad: prefiere tiro balanceado o eléctrica con temporizador.', cuidado: 'Manos mojadas + enchufe picado = no tocar: corta el automático y ventila.' },
  { n: 'Patio, bodega y antejardín', ico: '🏕️', para: 'Foco, portón, bomba, herramientas afuera.', mat: 'Cajas IP65, prensaestopas, silicona, cable exterior.', como: 'Todo afuera en caja estanca con prensaestopa y cable por tubo/enterrado (no “tirado” por el pasto). Uniones con conector + huincha autosoldante, nunca pelado con cinta. Foco a 2,5 m con sensor/fotocelda; si parpadea con lluvia = entra agua: corta y sella. Herramientas eléctricas afuera solo con alargador 3×1,5 mm² desenrollado + diferencial.', nota: 'Viento sur de Penco: fija focos y cables con abrazaderas, no con alambre que corta el forro.', cuidado: 'Cable a la vista al alcance de niños/perros o cruzando el paso = se entuba hoy.' },
  { n: 'Los 5 errores que más incendios causan', ico: '🔥', para: 'Chequeo visual de 10 minutos.', mat: 'Ojos, nariz y manos (con luz cortada al tocar).', como: '1) Zapatilla sobre zapatilla. 2) Alargador enrollado con estufa/hervidor. 3) Enchufe caliente, chispeante o con tapa derretida. 4) Cables pelados, con cinta enrollada o “de parlante” en 220V. 5) Tablero sin rotular con automáticos “amarrados”. Si marcas 1: se corrige esta semana y se anota en 📓 Mi instalación. Si marcas 2+: corta esos circuitos y llama.', nota: 'El olor a pescado/plástico quemado sin humo visible es cable recalentado: corta y busca.', cuidado: 'Extintor ABC a mano en cocina + números 132 Bomberos pegados junto al tablero.' }
];

var BOLETA = [
  { n: 'Lee tu boleta en 1 minuto', ico: '🧾', para: 'Saber qué pagas: kWh, tarifa y potencia.', mat: 'Última boleta CGE/Frontel (papel o app).', como: 'Busca: 1) kWh del mes (energía consumida). 2) $/kWh (cargo energía + transmisión). 3) Cargo fijo + potencia contratada (kW). 4) Lectura anterior vs actual (¿estimada o real?). 5) Gráfico 13 meses (¿sube en invierno?). Anota kWh + $ en 📓 Mi instalación cada luna: con 3 meses ya ves tu patrón.', nota: 'Casa Penco típica: 120–250 kWh/mes. Sobre 350 con todo normal = vampiros, freezer viejo o fuga (ver abajo).', cuidado: 'Boleta “estimada” 2+ meses seguidos: reclama lectura real (pagas promedio, no tu gasto).' },
  { n: 'kWh, W y potencia sin enredos', ico: '📐', para: 'La única cuenta que importa.', mat: 'Etiqueta del artefacto (W) + calculadora de abajo.', como: 'kWh/mes = W × cantidad × horas/día × días / 1000. Ej: hervidor 1500W × 0,5 h × 30 días = 22,5 kWh (~$3.500 a $155/kWh). Potencia (kW) es lo instantáneo (todo junto); energía (kWh) es lo acumulado (la boleta). Si el empalme salta, te pasaste de potencia; si la boleta duele, te pasaste de energía.', nota: 'Estufa 2000W olvidada 3 h = 6 kWh (~$1.000 por olvido). Temporizador la paga solo.', cuidado: 'Medidor con rueda loca o números que corren con todo cortado = fuga o robo: corta tu general y mira.' },
  { n: 'Caza tu gasto con 📊 Consumo', ico: '🧛', para: 'El detalle artefacto por artefacto.', mat: 'Botón 📊 Consumo (btnEnergy) + 1 enchufe medidor si puedes.', como: 'Toca “📊 Abrir mi Consumo” abajo: anota cada artefacto (W, horas, días) y ve kWh/$ al mes ordenados de mayor a menor. Ataca primero el top 3 (casi siempre: estufa, hervidor/ducha, freezer viejo, secadora). Vuelve aquí y anota el total en Lecturas para comparar con la boleta.', nota: '1W eterno = 8,7 kWh/año. 5 vampiros de 5W (deco, consolas, parlantes) ≈ $30 mil/año por estar “apagados”.', cuidado: 'Freezer escarchado 1 cm gasta ~20% más: descongela en menguante otoñal (ver 🧊 guía en Consumo).' },
  { n: 'NetBilling: si piensas en paneles', ico: '☀️', para: 'Inyectar y descontar (no “vender” caro).', mat: 'Instalador SEC + distribuidora (TE4).', como: 'Con paneles + TE4 puedes inyectar excedentes y descontarlos de tu boleta ( pagan ~60–70% de lo que te cobran el kWh). Dimensiona para tu consumo real (usa la calculadora solar de 📊 Consumo): casa 180 kWh/mes ≈ 1,5–2 kWp en Penco. Cotiza 3 instaladores SEC con TE4 incluido; sin TE4 no hay descuento.', nota: 'HSP Penco: ~4,9 h promedio, invierno 2,8–3 h: en invierno produces la mitad. No sobredimensiones sin medir.', cuidado: '“Panel directo al enchufe sin trámite” es ilegal y peligroso para cuadrillas en cortes: TE4 o nada.' }
];

var AUTONOMIA = [
  { n: 'Plan anti-corte Penco (temporal + sur)', ico: '🌧️', para: 'Que el corte no te pille a oscuras ni sin internet.', mat: 'Luz emergencia + UPS router + banco celu + clave en papel.', como: 'Luz de emergencia enchufada siempre en pasillo (prende sola). UPS 600–1000 VA SOLO para router/fibra (2–4 h internet, no para estufas). Banco cargado para 2 cargas. Clave wifi en papel (sin luz no la buscas en celu muerto). Prueba cada 3 lunas: desenchufa y mide cuánto aguanta. Anota en chequeo.', nota: 'Al volver la luz espera 5 min antes de enchufar TV/PC/consolas (pico de reposición quema fuentes).', cuidado: 'Generador bencinero NUNCA dentro ni en logia cerrada (CO mortal): afuera, bajo techo ventilado, con alargador.' },
  { n: 'Generador sin matar a nadie', ico: '🛢️', para: 'El que más accidentes causa en cortes largos.', mat: 'Generador + alargador grueso + bencina rotulada a la sombra.', como: 'Afuera y ventilado, lejos de ventanas. Equipos UNO por UNO con alargador (nunca “inyectar” al enchufe de la casa: energizas la red y electrocutas cuadrillas). Apágalo antes de recargar bencina. Aceite a nivel, no más del 80% de carga continua. Extintor ABC al lado. Si llueve fuerte: techo ventilado, nunca pieza/bodega cerrada.', nota: '2–3 kVA bastan para luz + router + freezer por turnos + carga celus. Toda la casa con ducha incluida = 6+ kVA + tablero de transferencia (técnico).', cuidado: 'Escape caliente + bencina derramada + niños cerca = incendio: perímetro y supervisión.' },
  { n: 'Solar de respaldo (sin vender humo)', ico: '☀️', para: 'Luces + router + celus aunque dure el corte.', mat: 'Panel 100–400W + regulador + batería LiFePO4 + inversor chico.', como: 'Empieza chico y útil: panel al norte ~30° + batería 100Ah 12V (~1 kWh) + inversor 500W: alcanza para 6–10 h de luz LED + router + 3 cargas. Calcula en 📊 Consumo → Solar. Batería a media carga en lugar fresco, fusible junto al positivo, todo bajo techo ventilado. Crece por bloques, no con “ofertones” sueltos incompatibles.', nota: 'En invierno Penco rinde 30–50%: panel más grande o paciencia. Nunca panel directo al celu sin regulador.', cuidado: 'Batería de litio hinchada/caliente u olor dulce = fuera + punto limpio e-waste (ver 🔌 Electrónica).' },
  { n: 'Leña y 220V se complementan', ico: '🪵', para: 'Invierno sin fundirte ni congelarte.', mat: 'Leña seca <25% + estufa certificada + botón 🪵 Leña.', como: 'La leña seca calienta barato lo grande (living); el 220V calienta preciso lo chico (baño 15 min con temporizador). Toca “🪵 Abrir Leña” abajo para humedad, estiba y tiraje. Estufa a leña con tiraje tapado + casa sellada = CO: entrada de aire + detector de CO (ver 🏠 Domótica).', nota: 'Leña húmeda = humo + hollín + la mitad del calor + multa: mide con higrómetro ($15 mil).', cuidado: 'Estufa 2000W + alargador enrollado + zapatilla = el trío del incendio de invierno.' }
];

var CHECKS = [
  { id: 'el_tablero', n: 'Tablero rotulado y sano', d: 'Sé qué corta cada automático, el general corta todo y no hay “arreglos con alambre”. Mapa pegado dentro de la tapa.' },
  { id: 'el_dif', n: 'Diferencial probado esta luna', d: 'Apreté TEST y saltó al tiro. Sé volver a subirlo. Sin trabas ni saltos misteriosos.' },
  { id: 'el_tierra', n: 'Tierra real', d: 'Enchufes de 3 patas con verde-amarillo atrás (baño/cocina/patio verificados). Sin “tierra a la cañería”.' },
  { id: 'el_zapa', n: 'Sin zapatillas en cadena', d: 'Ninguna sobre otra, ningún enrollado con estufa/hervidor/microondas. Grandes directo a muralla.' },
  { id: 'el_calientes', n: 'Nada caliente ni chispeante', d: 'Ningún enchufe tibio, con chispa, olor o tapa amarilla. El que falló se cambió 1 a 1 o está cortado.' },
  { id: 'el_cocina', n: 'Cocina por turnos', d: '1 grande a la vez por circuito. Hervidor/microondas/horno a muralla, no a zapatilla.' },
  { id: 'el_bano', n: 'Baño/lavadero con diferencial', d: 'Enchufes con tapa, lejos del agua, todo desenchufado al terminar. Calefón/ducha con mantención.' },
  { id: 'el_patio', n: 'Patio estanco', d: 'Cajas IP65, cables por tubo, sin cables tirados al paso. Foco firme contra el sur.' },
  { id: 'el_boleta', n: 'Boleta a la vista', d: 'Anoté kWh + $ de este mes en Lecturas. Sé mi promedio 3 meses y mi top 3 de gasto.' },
  { id: 'el_corte', n: 'Plan de corte listo', d: 'Luz emergencia enchufada, UPS/banco probados, clave wifi en papel. Sé qué desenchufo con temporal.' },
  { id: 'el_te1', n: 'Papeles al día', d: 'Sé si tengo TE1 y qué potencia tengo contratada. Certificado guardado (papel + foto aquí).' },
  { id: 'el_luna', n: 'Mantención de la luna', d: '15 min en menguante: TEST diferencial + mirar tablero + probar luces patio + revisar avisos. Hecho este mes.' }
];

var ZONAS = ['Living / comedor', 'Cocina', 'Baño', 'Piezas', 'Lavadero', 'Patio / exterior', 'Bodega / taller', 'Todo el tablero', 'Otro'];
var CALIBRES = ['1,5 mm² (luz 10A)', '2,5 mm² (enchufes 16A)', '4 mm² (cocina 20–25A)', '6 mm² (ducha/cocina eléc.)', 'No sé (anotar y averiguar)'];
var ESTADOS_C = ['😍 OK', '🙂 Funciona con maña', '🛠️ Revisar pronto', '⛔ Cortado (espera técnico)', '🛒 Falta hacer'];
var ESTADOS_B = ['✅ Resuelto', '🙂 Funciona con maña', '🔁 En seguimiento', '⛔ Esperando técnico'];

/* ---------------- DIALOGO ---------------- */
function rowCard(c) {
  if (c.txt) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4>' +
      '<p class="su-77e2fe">' + esc(c.txt) + '</p></div>';
  }
  return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4>' +
    (c.para ? '<p><b>Para:</b> ' + esc(c.para) + '</p>' : '') +
    (c.mat ? '<p><b>Necesitas:</b> ' + esc(c.mat) + '</p>' : '') +
    '<p><b>Cómo:</b> ' + esc(c.como) + '</p>' +
    (c.nota ? '<p class="muted">' + esc(c.nota) + '</p>' : '') +
    (c.cuidado ? '<p class="su-d33357">⚠️ ' + esc(c.cuidado) + '</p>' : '') + '</div>';
}
function switchTab(name) {
  ['Guia', 'Tablero', 'Circuitos', 'Boleta', 'Cortes', 'Mia'].forEach(function (t) {
    var p = $('ele' + t), b = $('tabEle' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}
function hubRow() {
  return '<div class="menstrual-card su-68a1a9"><h4>🧭 Esta sección integra tu Energía y Taller</h4>' +
    '<p class="muted su-11a508">⚡ Electricidad es la <b>red 220V de la casa</b>. El detalle vive donde corresponde:</p>' +
    '<div class="su-67b198">' +
    '<button type="button" class="btn su-30e741" data-hub="btnEnergy">📊 Consumo</button>' +
    '<button type="button" class="btn su-30e741" data-hub="btnLena">🪵 Leña</button>' +
    '<button type="button" class="btn su-30e741" data-hub="btnDomotica">🏠 Domótica</button>' +
    '<button type="button" class="btn su-30e741" data-hub="btnElectronica">🔌 Electrónica</button>' +
    '<button type="button" class="btn su-30e741" data-hub="btnHerramientas">🧰 Herramientas</button>' +
    '<button type="button" class="btn su-30e741" data-hub="btnTaller">🔧 B. Taller</button>' +
    '<button type="button" class="btn su-30e741" data-hub="btnMecanica">🔧 Mecánica</button>' +
    '</div><p class="muted su-11a508" id="eleHubMsg">Si un botón no aparece, actívalo en ⚙️ Personalizar.</p></div>';
}
function bindHub(scope) {
  (scope || document).querySelectorAll('[data-hub]').forEach(function (b) {
    b.onclick = function () {
      if (!gotoBtn(b.getAttribute('data-hub'))) {
        var m = $('eleHubMsg');
        if (m) m.textContent = 'Esa herramienta está oculta: actívala en ⚙️ Personalizar.';
      }
    };
  });
}

function calcKwh() {
  var w = parseFloat(($('eleCalcW') || {}).value);
  var c = parseFloat(($('eleCalcC') || {}).value) || 1;
  var h = parseFloat(($('eleCalcH') || {}).value);
  var d = parseFloat(($('eleCalcD') || {}).value) || 30;
  var t = parseFloat(($('eleCalcT') || {}).value) || 155;
  var out = $('eleCalcOut');
  if (!out) return;
  if (isNaN(w) || isNaN(h) || w <= 0 || h < 0 || h > 24) { out.innerHTML = '<span class="muted">Escribe W y horas/día (ej 1500, 0.5). Días 30, tarifa 155.</span>'; return; }
  var kwh = w * c * h * d / 1000;
  out.innerHTML = '<b>' + kwh.toFixed(1) + ' kWh/mes</b> · $' + Math.round(kwh * t).toLocaleString('es-CL') + ' a $' + t + '/kWh' +
    (kwh >= 100 ? '<br><span class="su-7c91e2">⚠️ Es un gigante: ¿temporizador, turnos o recambio?</span>' : '<br>✅ Gasto acotado si es 1 solo equipo así.');
}

function buildDialog() {
  var guiaHTML = GUIAS.map(rowCard).join('');
  var tabHTML = TABLERO.map(rowCard).join('');
  var cirHTML = CIRCUITOS.map(rowCard).join('');
  var bolHTML = BOLETA.map(rowCard).join('');
  var corHTML = AUTONOMIA.map(rowCard).join('');

  var body =
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabEleGuia" class="btn btn-accent su-30e741">📘 Guía base</button>' +
    '<button type="button" id="tabEleTablero" class="btn su-30e741">🧰 Tablero</button>' +
    '<button type="button" id="tabEleCircuitos" class="btn su-30e741">🔌 Circuitos</button>' +
    '<button type="button" id="tabEleBoleta" class="btn su-30e741">🧾 Boleta</button>' +
    '<button type="button" id="tabEleCortes" class="btn su-30e741">☀️ Cortes</button>' +
    '<button type="button" id="tabEleMia" class="btn su-30e741">📓 Mi instalación</button></div>' +

    '<div id="eleGuia">' + hubRow() + guiaHTML +
    '<div class="menstrual-card su-51d56a"><h4>🧭 Regla de oro</h4><p class="muted su-6cb285">Tú mandas DESPUÉS del enchufe; el muro y el tablero por dentro mandan con eléctrico SEC. Ante la duda (olor, chispa, calor, diferencial que salta): corta el automático y llama. El coraje no aísla 220V.</p></div></div>' +

    '<div id="eleTablero" class="hidden"><div class="conv-row"><label class="su-97445a">🔍 Filtrar <input type="text" id="eleTabQ" placeholder="diferencial, tierra, TE1, automático..."></label></div><div id="eleTabList" class="su-bf3828">' + tabHTML + '</div></div>' +

    '<div id="eleCircuitos" class="hidden"><div class="conv-row"><label class="su-97445a">🔍 Filtrar <input type="text" id="eleCirQ" placeholder="cocina, baño, patio, LED, enchufe..."></label></div><div id="eleCirList" class="su-bf3828">' + cirHTML + '</div></div>' +

    '<div id="eleBoleta" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>🧮 Calculadora rápida kWh / $ (offline)</h4>' +
    '<div class="conv-row"><label>Watts <input type="number" id="eleCalcW" step="1" placeholder="ej: 1500"></label><label>Cant. <input type="number" id="eleCalcC" step="1" value="1"></label><label>Horas/día <input type="number" id="eleCalcH" step="0.1" placeholder="ej: 0.5"></label></div>' +
    '<div class="conv-row"><label>Días/mes <input type="number" id="eleCalcD" step="1" value="30"></label><label>Tarifa $/kWh <input type="number" id="eleCalcT" step="1" value="155"></label></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="eleCalcGo" class="btn btn-accent su-30e741">Calcular</button><button type="button" class="btn su-30e741" data-hub="btnEnergy">📊 Detalle en Consumo</button></div>' +
    '<div id="eleCalcOut" class="chip su-e75717">—</div></div>' +
    '<div class="su-bf3828">' + bolHTML + '</div></div>' +

    '<div id="eleCortes" class="hidden"><div class="su-bf3828">' + corHTML + '</div>' +
    '<div class="menstrual-card"><h4>🔗 Seguir en</h4><div class="su-67b198"><button type="button" class="btn su-30e741" data-hub="btnLena">🪵 Leña</button><button type="button" class="btn su-30e741" data-hub="btnDomotica">🏠 Domótica (UPS, sensores)</button><button type="button" class="btn su-30e741" data-hub="btnMecanica">🔧 Mecánica (generador/bencina)</button></div></div></div>' +

    '<div id="eleMia" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>🗺️ Mi mapa de circuitos</h4>' +
    '<div class="conv-row"><label class="su-4b3de7">Circuito * <input type="text" id="eleCNom" placeholder="ej: C2 enchufes living + patio" maxlength="50"></label>' +
    '<label>Zona <select id="eleCZona">' + ZONAS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Cable <select id="eleCCal">' + CALIBRES.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label>Automático <input type="text" id="eleCAuto" placeholder="ej: 16A curva C" maxlength="20"></label>' +
    '<label>Estado <select id="eleCEst">' + ESTADOS_C.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<label>Nota <input type="text" id="eleCNota" placeholder="ej: corta living+patio, tierra OK, diferencial asociado" maxlength="120"></label>' +
    '<div class="dlg-actions su-8f9e27"><button type="button" id="eleCAdd" class="btn btn-accent su-30e741">+ Guardar circuito</button></div></div>' +

    '<div class="menstrual-card su-8a77e5"><h4>🧾 Lecturas de boleta (kWh + $)</h4>' +
    '<div class="conv-row"><label>Mes <input type="month" id="eleLMes"></label><label>kWh <input type="number" id="eleLKwh" min="0" step="1" placeholder="ej: 185"></label><label>$ Total <input type="number" id="eleLMonto" min="0" step="500" placeholder="ej: 29000"></label></div>' +
    '<label>Nota <input type="text" id="eleLNota" placeholder="ej: estimada, con visitas, más estufa" maxlength="80"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="eleLAdd" class="btn su-30e741">+ Guardar lectura</button></div>' +
    '<div id="eleLChart" class="su-443263"></div>' +
    '<div id="eleLResumen" class="muted su-11a508"></div></div>' +

    '<div class="menstrual-card su-8a77e5"><h4>🧰 Bitácora eléctrica (fallas y arreglos)</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="eleBFecha"></label><label class="su-4b3de7">Qué pasó * <input type="text" id="eleBQue" placeholder="ej: enchufe cocina caliente, saltó C3" maxlength="60"></label></div>' +
    '<div class="conv-row"><label>Detalle / solución <input type="text" id="eleBDet" placeholder="ej: corté C3, cambié enchufe 16A, OK" maxlength="100"></label>' +
    '<label>Costo $ <input type="number" id="eleBCosto" min="0" step="500" placeholder="ej: 8000"></label>' +
    '<label>Estado <select id="eleBEst">' + ESTADOS_B.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="eleBAdd" class="btn su-30e741">+ Guardar en bitácora</button></div>' +
    '<div id="eleBList" class="habits-list su-ebf445"></div></div>' +

    '<div class="menstrual-card su-8a77e5"><h4>✅ Chequeo instalación segura</h4><p class="muted su-11a508">12 puntos. Meta sana: 10/12. Repite 1 vez por luna (menguante).</p><div id="eleCheckList"></div>' +
    '<div class="su-241b37"><div id="eleCheckBar" class="su-75fe76"></div></div>' +
    '<p class="muted su-e13d76" id="eleCheckTxt"></p></div>' +

    '<div class="conv-row su-8a77e5"><label class="su-4b3de7">🔍 Buscar en mi instalación <input type="text" id="eleQ" placeholder="cocina, patio, diferencial..."></label></div>' +
    '<div id="eleResumen" class="menstrual-card su-8a77e5"></div>' +
    '<div id="eleLog" class="su-bf3828"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="eleStats" class="muted su-11a508"></span><span class="su-3de8f9"><button type="button" id="eleShare" class="btn su-30e741">📤 Compartir</button><button type="button" id="eleExport" class="btn su-30e741">📥 Exportar</button><button type="button" id="eleClear" class="btn su-214f75">🗑 Borrar</button></span></div></div>';

  makeDialog('electricidadDialog', '⚡ Electricidad — tu red 220V segura y a la vista',
    'Tablero, circuitos, boleta, cortes y tu mapa + lecturas. Hub de <b>🏡 Hogar y Vida Práctica > 🔧 Energía y Taller</b>: deriva el detalle a 📊 Consumo, 🏠 Domótica, 🔌 Electrónica y 🧰 Herramientas. Todo <b>privado y local</b>, 100% offline. Tablero adentro y empalme: solo eléctrico SEC.',
    body);
}

/* ---------------- MI INSTALACIÓN ---------------- */
function puntaje() {
  var s = store(), n = 0;
  CHECKS.forEach(function (c) { if (s.checks[c.id]) n++; });
  return n;
}
function renderChecks() {
  var box = $('eleCheckList'); if (!box) return;
  var s = store();
  box.innerHTML = CHECKS.map(function (c) {
    var on = !!s.checks[c.id];
    return '<label class="check-row su-2f4cbf">' +
      '<input type="checkbox" data-echk="' + c.id + '"' + (on ? ' checked' : '') + ' class="su-c00d39"> ' +
      '<span><b>' + esc(c.n) + '</b><br><span class="muted su-11a508">' + esc(c.d) + '</span></span></label>';
  }).join('');
  var pts = puntaje(), tot = CHECKS.length, pct = Math.round(pts / tot * 100);
  var bar = $('eleCheckBar'), txt = $('eleCheckTxt');
  if (bar) bar.style.width = pct + '%';
  if (txt) txt.textContent = 'Mi red: ' + pts + '/' + tot + ' (' + pct + '%) ' + (pts <= 4 ? '🔴 Parte por tablero + diferencial + zapatillas esta semana.' : (pts <= 7 ? '🟡 En camino: cierra cocina, baño y boleta.' : (pts < tot ? '🟢 Casi lista: mantén 1 revisión por luna.' : '🟢 Red al día: repasa cada luna.')));
  box.querySelectorAll('[data-echk]').forEach(function (c) {
    c.onchange = function () {
      var st = store();
      st.checks[c.getAttribute('data-echk')] = c.checked ? true : false;
      save(c.checked ? 'Paso activado ✅' : 'Guardado');
      renderChecks();
    };
  });
}
function renderLecturas() {
  var chart = $('eleLChart'), res = $('eleLResumen');
  if (!chart && !res) return;
  var m = store();
  var data = (m.lecturas || []).slice().sort(function (a, b) { return String(a.mes).localeCompare(String(b.mes)); }).slice(-12);
  if (!data.length) {
    if (chart) chart.innerHTML = '';
    if (res) res.textContent = 'Sin lecturas: anota tu primera boleta arriba (mes + kWh + $).';
    return;
  }
  var maxK = Math.max.apply(null, data.map(function (r) { return +r.kwh || 0; }).concat([1]));
  if (chart) {
    chart.style.cssText = 'display:flex;align-items:flex-end;gap:6px;min-height:90px;padding:8px 2px;';
    chart.innerHTML = data.map(function (r) {
      var h = 12 + Math.round((+r.kwh || 0) / maxK * 68);
      return '<span title="' + esc(r.mes + ' · ' + r.kwh + ' kWh · $' + (+r.monto || 0).toLocaleString('es-CL')) + '" style="flex:1;max-width:44px;height:' + h + 'px;background:#caa64f;border-radius:4px;display:inline-block"></span>';
    }).join('');
  }
  if (res) {
    var totK = data.reduce(function (a, r) { return a + (+r.kwh || 0); }, 0);
    var totM = data.reduce(function (a, r) { return a + (+r.monto || 0); }, 0);
    var prom = totK / data.length;
    var ult = data[data.length - 1], ant = data.length > 1 ? data[data.length - 2] : null;
    var dif = ant ? ((+ult.kwh || 0) - (+ant.kwh || 0)) : null;
    var consejo = dif == null ? 'Con 3 meses verás tu patrón por lunas.' :
      dif > 20 ? '⚠️ Subiste +' + dif + ' kWh vs mes anterior: ¿estufa, visitas o freezer? Revisa 📊 Consumo.' :
      dif < -20 ? '🌱 Bajaste ' + Math.abs(dif) + ' kWh: lo que hiciste, repítelo.' :
      '➖ Estable: compara con tu boleta y mantén turnos en cocina.';
    res.innerHTML = 'Promedio <b>' + prom.toFixed(0) + ' kWh/mes</b> · total período ' + totK.toFixed(0) + ' kWh ($' + totM.toLocaleString('es-CL') + ') · última ' + esc(ult.mes) + ': ' + esc(String(ult.kwh)) + ' kWh. ' + esc(consejo);
  }
}
function renderMia() {
  renderChecks();
  renderLecturas();
  renderBit();
  var box = $('eleLog'); if (!box) return;
  var m = store();
  var q = (($('eleQ') && $('eleQ').value) || '').toLowerCase();
  var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
  var list = m.circuitos.filter(function (r) {
    if (!q) return true;
    var t = ((r.nombre || '') + ' ' + (r.zona || '') + ' ' + (r.auto || '') + ' ' + (r.nota || '') + ' ' + (r.estado || '')).toLowerCase();
    var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
    return tn.indexOf(qn) >= 0;
  });
  var res = $('eleResumen'), st = $('eleStats');
  var mal = m.circuitos.filter(function (r) { return (r.estado || '').indexOf('OK') < 0; }).length;
  var cortados = m.circuitos.filter(function (r) { return (r.estado || '').indexOf('Cortado') >= 0; }).length;
  if (res) {
    res.innerHTML = '<h4>📊 Resumen</h4><p class="muted su-6cb285">' + m.circuitos.length + ' circuito(s)' +
      ' · 🧾 ' + m.lecturas.length + ' lectura(s)' +
      ' · 🧰 ' + m.bitacora.length + ' nota(s)' +
      (mal ? ' · ⚠️ ' + mal + ' por revisar' : ' · 🟢 todo OK') +
      (cortados ? ' · ⛔ ' + cortados + ' cortado(s): no subir sin técnico' : '') +
      ' · ✅ chequeo ' + puntaje() + '/' + CHECKS.length + '</p>';
  }
  if (!list.length) {
    box.innerHTML = '<p class="muted su-e201a8">' + (m.circuitos.length ? 'Sin resultados para ese filtro.' : 'Sin circuitos aún. Anota el primero arriba: ej “C2 enchufes living + patio”.') + '</p>';
  } else {
    box.innerHTML = list.slice().sort(function (a, b) { return String(a.nombre).localeCompare(String(b.nombre)); }).slice(0, 80).map(function (r) {
      return '<div class="si-card"><h4>🔌 ' + esc(r.nombre || 'Circuito') + '</h4>' +
        '<p class="su-6157e8"><span class="chip su-0d5be0">' + esc(r.zona || '') + '</span>' +
        (r.calibre ? '<span class="chip su-0d5be0">' + esc(r.calibre) + '</span>' : '') +
        (r.auto ? '<span class="chip su-0d5be0">' + esc(r.auto) + '</span>' : '') +
        (r.estado ? '<span class="chip su-0d5be0">' + esc(r.estado) + '</span>' : '') + '</p>' +
        (r.nota ? '<p class="muted">' + esc(r.nota) + '</p>' : '') +
        '<div class="su-c158a9">' +
        '<button type="button" class="btn ele-ok su-337714" data-k="' + esc(r.id) + '">✅ OK</button>' +
        '<button type="button" class="btn ele-del su-fd834a" data-k="' + esc(r.id) + '">✕</button></div></div>';
    }).join('');
    box.querySelectorAll('.ele-del').forEach(function (x) {
      x.onclick = function () {
        if (!confirm('¿Borrar este circuito de tu mapa?')) return;
        var s2 = store();
        s2.circuitos = (s2.circuitos || []).filter(function (r) { return r.id !== x.dataset.k; });
        save(); renderMia();
      };
    });
    box.querySelectorAll('.ele-ok').forEach(function (x) {
      x.onclick = function () {
        var s2 = store();
        var r = (s2.circuitos || []).filter(function (a) { return a.id === x.dataset.k; })[0];
        if (r) { r.estado = '😍 OK'; save('Circuito OK ✅'); renderMia(); }
      };
    });
  }
  if (st) st.textContent = list.length + ' mostrado(s) · ' + m.circuitos.length + ' total';
}
function renderBit() {
  var box = $('eleBList'); if (!box) return;
  var m = store();
  var data = (m.bitacora || []).slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  if (!data.length) { box.innerHTML = '<p class="muted su-11a508">Sin notas. Anota fallas y arreglos: vale oro para el técnico.</p>'; return; }
  box.innerHTML = data.slice(0, 60).map(function (r) {
    return '<div class="hora-item"><span class="su-6cb285">🧰 <b>' + esc(r.que || '') + '</b> · ' + esc(r.est || '') +
      '<br><span class="muted su-0d5be0">' + esc(r.fecha || '') + (r.det ? ' · ' + esc(r.det) : '') + (r.costo ? ' · $' + (+r.costo).toLocaleString('es-CL') : '') + '</span></span>' +
      '<button type="button" class="btn btn-icon ele-bit-del" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.ele-bit-del').forEach(function (x) {
    x.onclick = function () {
      var s2 = store();
      s2.bitacora = (s2.bitacora || []).filter(function (r) { return r.id !== x.dataset.k; });
      save(); renderMia();
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
  /* 1) inyectar botón hub en Hogar y Vida Práctica > Energía y Taller (primero) */
  try {
    var existing = $('btnElectricidad');
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
        btn.id = 'btnElectricidad'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '⚡ Electricidad';
        try { btn.setAttribute('data-sub', 'energia'); } catch (eS2) {}
        btn.setAttribute('data-keywords', 'electricidad 220v tablero automatico diferencial tierra enchufe luz boleta kwh tarifa consumo corte generador solar ups sec te1 empalme cocina baño patio cable futura instala casa energia taller hogar');
        var refE = g.querySelector('#btnEnergy');
        if (refE) g.insertBefore(btn, refE);
        else {
          var refC = g.querySelector('#btnConvert');
          if (refC) g.insertBefore(btn, refC);
          else g.appendChild(btn);
        }
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + orden hogar|energia + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnElectricidad') < 0) ALL_BTNS.push('btnElectricidad');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnElectricidad = ['hogar', 'energia'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['hogar|energia'] && BTN_ORDER['hogar|energia'].indexOf('btnElectricidad') < 0) {
      var _o = BTN_ORDER['hogar|energia'], _ni = _o.indexOf('btnEnergy');
      if (_ni < 0) _o.unshift('btnElectricidad'); else _o.splice(_ni, 0, 'btnElectricidad');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnElectricidad = true; });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Hogar y Vida Práctica) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnElectricidad"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Hogar') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnElectricidad"> ⚡ Electricidad';
          gr.insertBefore(lab, gr.firstChild ? gr.firstChild.nextSibling : null);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnElectricidad !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnElectricidad = lab.querySelector('input').checked;
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
  renderMia();
  bindHub(document);

  var b = $('btnElectricidad');
  if (b) b.onclick = function () {
    renderMia();
    bindHub(document);
    switchTab('Guia');
    openDlg('electricidadDialog');
  };

  ['Guia', 'Tablero', 'Circuitos', 'Boleta', 'Cortes', 'Mia'].forEach(function (t) {
    var tb = $('tabEle' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  bindFilter('eleTabQ', 'eleTabList');
  bindFilter('eleCirQ', 'eleCirList');

  var cg = $('eleCalcGo'); if (cg) cg.onclick = calcKwh;

  var dq = $('eleQ'); if (dq) dq.oninput = renderMia;
  try { if ($('eleBFecha') && !$('eleBFecha').value) $('eleBFecha').value = todayKey(); } catch (e) {}
  try {
    if ($('eleLMes') && !$('eleLMes').value) {
      var tk = todayKey().slice(0, 7);
      $('eleLMes').value = tk;
    }
  } catch (e2) {}

  var ca = $('eleCAdd');
  if (ca) ca.onclick = function () {
    var nom = clean((($('eleCNom') || {}).value || '').trim(), 50);
    if (!nom) return alert('Escribe el circuito (ej: C2 enchufes living + patio)');
    var m = store();
    m.circuitos.push({
      id: uid('elc'),
      nombre: nom,
      zona: ($('eleCZona') || {}).value || ZONAS[0],
      calibre: ($('eleCCal') || {}).value || CALIBRES[0],
      auto: clean((($('eleCAuto') || {}).value || '').trim(), 20),
      estado: ($('eleCEst') || {}).value || ESTADOS_C[0],
      nota: clean((($('eleCNota') || {}).value || '').trim(), 120),
      fecha: todayKey()
    });
    save('Circuito guardado ⚡');
    if ($('eleCNom')) $('eleCNom').value = '';
    if ($('eleCAuto')) $('eleCAuto').value = '';
    if ($('eleCNota')) $('eleCNota').value = '';
    renderMia();
  };

  var la = $('eleLAdd');
  if (la) la.onclick = function () {
    var mes = ($('eleLMes') || {}).value || '';
    if (!/^\d{4}-\d{2}$/.test(mes)) return alert('Elige el mes de la boleta');
    var kwh = parseFloat(($('eleLKwh') || {}).value);
    if (isNaN(kwh) || kwh < 0) return alert('Escribe los kWh del mes (ej: 185)');
    var m2 = store();
    var idx = -1;
    m2.lecturas.forEach(function (r, i) { if (r.mes === mes) idx = i; });
    var reg = {
      id: idx >= 0 ? m2.lecturas[idx].id : uid('ell'),
      mes: mes,
      kwh: kwh,
      monto: parseFloat(($('eleLMonto') || {}).value) || 0,
      nota: clean((($('eleLNota') || {}).value || '').trim(), 80)
    };
    if (idx >= 0) m2.lecturas[idx] = reg;
    else m2.lecturas.push(reg);
    save(idx >= 0 ? 'Lectura actualizada 🧾' : 'Lectura guardada 🧾');
    if ($('eleLKwh')) $('eleLKwh').value = '';
    if ($('eleLMonto')) $('eleLMonto').value = '';
    if ($('eleLNota')) $('eleLNota').value = '';
    renderMia();
  };

  var ba = $('eleBAdd');
  if (ba) ba.onclick = function () {
    var qu = clean((($('eleBQue') || {}).value || '').trim(), 60);
    if (!qu) return alert('Cuenta en 1 línea qué pasó (ej: saltó C3 con hervidor)');
    var m3 = store();
    m3.bitacora.push({
      id: uid('elb'),
      fecha: ($('eleBFecha') || {}).value || todayKey(),
      que: qu,
      det: clean((($('eleBDet') || {}).value || '').trim(), 100),
      costo: parseFloat(($('eleBCosto') || {}).value) || 0,
      est: ($('eleBEst') || {}).value || ESTADOS_B[0]
    });
    save('Bitácora guardada 🧰');
    if ($('eleBQue')) $('eleBQue').value = '';
    if ($('eleBDet')) $('eleBDet').value = '';
    if ($('eleBCosto')) $('eleBCosto').value = '';
    renderMia();
  };

  var sh = $('eleShare');
  if (sh) sh.onclick = async function () {
    var d = store();
    if (!d.circuitos.length && !d.lecturas.length && !d.bitacora.length) return alert('Sin circuitos, lecturas ni bitácora aún');
    var t = '⚡ Mi instalación eléctrica · ' + todayKey() + ' · ✅ ' + puntaje() + '/' + CHECKS.length + '\n\nCircuitos:\n' +
      d.circuitos.map(function (r) { return '• ' + r.nombre + ' (' + (r.zona || '') + (r.auto ? ' · ' + r.auto : '') + ') · ' + (r.estado || ''); }).join('\n') +
      (d.lecturas.length ? '\n\nLecturas:\n' + d.lecturas.slice().sort(function (a, b) { return String(a.mes).localeCompare(String(b.mes)); }).map(function (r) { return '• ' + r.mes + ': ' + r.kwh + ' kWh ($' + (+r.monto || 0).toLocaleString('es-CL') + ')'; }).join('\n') : '') +
      (d.bitacora.length ? '\n\nBitácora:\n' + d.bitacora.slice(-8).map(function (r) { return '• ' + r.fecha + ' · ' + r.que + ' · ' + (r.est || ''); }).join('\n') : '');
    await share('Mi electricidad', t);
  };
  var ex = $('eleExport');
  if (ex) ex.onclick = async function () {
    var d2 = store();
    var t2 = '⚡ ELECTRICIDAD — exportación ' + todayKey() + '\n\nCIRCUITOS\n' +
      d2.circuitos.map(function (r) { return [r.nombre, r.zona, r.calibre, r.auto, r.estado, r.nota].join(' | '); }).join('\n') +
      '\n\nLECTURAS\n' + d2.lecturas.map(function (r) { return [r.mes, r.kwh, r.monto, r.nota].join(' | '); }).join('\n') +
      '\n\nBITÁCORA\n' + d2.bitacora.map(function (r) { return [r.fecha, r.que, r.det, r.costo, r.est].join(' | '); }).join('\n');
    await share('Exportar electricidad', t2 || 'Sin datos');
  };
  var cl = $('eleClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu mapa eléctrico (circuitos + lecturas + bitácora)? El chequeo se conserva.')) return;
    try { var u = userData(); if (u && u.electricidad) { u.electricidad.circuitos = []; u.electricidad.lecturas = []; u.electricidad.bitacora = []; } } catch (e) {}
    save(); renderMia();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

try { window.cal13electricidad = { store: store, puntaje: puntaje }; } catch (e) {}

})();
