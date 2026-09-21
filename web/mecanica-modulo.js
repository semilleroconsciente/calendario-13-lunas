/* ============================================================
   MECANICA — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección dentro de Hogar y Vida Práctica > Energía y Taller:
   - Botón btnMecanica (inyectado en grupo hogar, sub energia)
   - Diálogo mecanicaDialog con 6 pestañas:
     1) 🧰 Guías básicas (seguridad, herramientas, diagnóstico 5 pasos)
     2) 🚲 Bicicleta
     3) 🏍️ Moto
     4) 🚗 Auto
     5) ⚙️ Motores (2T / 4T, bencina, diésel, eléctricos, bomba/bote)
     6) 📓 Mi taller (bitácora privada por vehículo)
   - Todo local y privado por usuario: userData().mecanica
     { logs:[], checks:{} }
   - 100% offline. Enfoque seguridad: calzas, batería, combustible.
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
    if (!u) return { logs: [], checks: {} };
    if (!u.mecanica) u.mecanica = { logs: [], checks: {} };
    var m = u.mecanica;
    if (!Array.isArray(m.logs)) m.logs = [];
    if (!m.checks || typeof m.checks !== 'object' || Array.isArray(m.checks)) m.checks = {};
    return m;
  } catch (e2) { return { logs: [], checks: {} }; }
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
  { n: 'Seguridad primero (lee siempre)', ico: '⛑️', txt: 'Motor frío antes de meter manos (escape quema 30+ min). Calza ruedas + freno de mano / pata firme; nunca te metas bajo un auto solo con gata (usa caballetes). Desconecta batería: primero negativo (−) negro. Bencina lejos de chispas/llamas, en bidón homologado y a la sombra. Si huele fuerte a bencina o gas: no des arranque, ventila y revisa fugas.' },
  { n: 'Caja básica de herramientas', ico: '🧰', txt: 'Llaves punta-corona 8–19 mm, dados + chicharra, destornilladores cruz/paleta, alicates, llave de bujía, medidor de presión de neumáticos, inflador/bomba, lubricante multiuso WD-40 o similar, grasa, trapos, linterna frontal, guantes, gata + caballetes (auto), multímetro barato ($10 mil salva diagnósticos).' },
  { n: 'Diagnóstico en 5 pasos (todo vehículo)', ico: '🔍', txt: '1) ESCUCHA-MIRA-HUELE: ¿ruido nuevo, humo, olor, mancha en el suelo? 2) NIVELES: aceite, refrigerante, frenos, bencina. 3) ENERGÍA: batería/bobina/bujía (¿da arranque? ¿hay chispa?). 4) AIRE-COMBUSTIBLE: filtro aire tapado, llave bencina, ahogador. 5) TRANSMISIÓN: cadena/correa/neumático/freno. El 80% de las panas caseras está en estos 5.' },
  { n: 'Fluidos: qué mirar cada luna', ico: '🛢️', txt: 'Aceite motor: varilla entre MIN–MAX, color miel→negro normal, lechoso = agua (taller). Refrigerante: vaso expansor en frío, nunca abrir radiador caliente. Líquido frenos: si baja, hay desgaste o fuga (no solo rellenar). Transmisión/cadena: limpia + lubrica. Anota fecha y km/horas en 📓 Mi taller.' },
  { n: 'Cuándo ir al taller (no insistir)', ico: '🚨', txt: 'Frenos esponjosos o chillido metálico, humo azul/blanco denso constante, aceite con metal molido, sobrecalentamiento reiterado, airbag/check parpadeando, dirección suelta. Lleva tu bitácora (qué hiciste + cuándo): el mecánico diagnostica en 10 min lo que sin datos tarda 2 horas.' },
  { n: 'Luna y taller (ritmo Penco)', ico: '🌙', txt: 'Menguante: mantención programada (aceite, filtros, aprietes, limpieza). Creciente–llena: prueba y observación (ruidos, consumo, luces). Invierno (Pukem): batería, neumáticos, luces y anticongelante. Verano (Walüng): refrigeración, presión neumáticos y viajes largos.' }
];

var BICI = [
  { n: 'ABC antes de salir (30 seg)', ico: '✅', para: 'Toda salida, sobre todo con lluvia/sur.', mat: 'Manos + ojos.', como: 'A = Aire: aprieta cubierta (firme, no piedra ni blanda). B = Brakes/Frenos: ambas manillas frenan sin tocar manillar. C = Cadena/Casco: cadena aceitada sin óxido + casco abrochado. Regla: si algo suena suelto, no salgas.', nota: 'Presión típica: urbana 50–65 psi, MTB 30–45 psi, ruta 80–110 psi (ver flanco del neumático).', cuidado: 'Freno que llega al puño = cable estirado o pastilla gastada: regula hoy.' },
  { n: 'Pinchazo: repara en 15 min', ico: '🛞', para: 'Clavo, espina, llantazo en camino a Lirquén.', mat: 'Palas plásticas, parche + pegamento o cámara de repuesto, bomba.', como: 'Saca rueda (abre cierre rápido o tuerca). Destalona un lado con palas. Saca cámara, infla y busca fuga (agua/oreja). Lija, pega parche 2 min o cambia cámara. Revisa el neumático por dentro (el clavo sigue ahí). Monta, infla a presión y gira.', nota: 'Lleva siempre 1 cámara de tu medida (ej 26×1.95, 700×32) + bomba. Es más rápido que parchar en ruta.', cuidado: 'No uses destornillador metálico como pala: muerde la cámara.' },
  { n: 'Frenos: pastillas y cable', ico: '🛑', para: 'V-brake, disco mecánico o hidráulico.', mat: 'Llave Allen 4–5 mm, destornillador.', como: 'V-brake: pastilla a 1 mm del aro, paralela. Si patina: lija pastilla + limpia aro con alcohol. Disco mecánico: regula ruedita roja hasta roce leve y suelta 1/4 vuelta. Hidráulico con tacto esponjoso: purga en taller.', nota: 'Chillido + surco brillante = pastilla cristalizada: lija fina y prueba.', cuidado: 'Nunca aceite en disco/pastilla. Si se contaminó: pastilla nueva.' },
  { n: 'Cambios que saltan', ico: '⚙️', para: 'Piñón/plato que no entra o raspa.', mat: 'Destornillador cruz, Allen 5 mm.', como: 'Cadena al piñón medio. Gira pedal y prueba: si no sube, gira el regulador del shifter media vuelta antihorario. Si no baja, horario. Tornillos H/L del descarrilador solo 1/4 de vuelta por vez.', nota: 'Cadena estirada (>0,75% en medidor) gasta piñón: cámbiala a tiempo ($15 mil ahorra $60 mil).', cuidado: 'No ajustes con la bici al revés apoyada en shifter: se dobla la pata.' },
  { n: 'Mantención por lunas', ico: '📅', para: 'Calendario simple.', mat: 'Aceite de cadena (seco/húmedo según lluvia), trapo.', como: 'Cada salida: ABC. Cada luna: limpia + lubrica cadena (1 gota por eslabón, retira exceso), revisa aprietes (potencia, sillín, ruedas), presión. Cada 6 lunas: cadena, frenos, cables, mazas. Invierno Penco: lubricante húmedo + guardabarros + luz.', nota: 'Bici guardada: cuélgala, cambios en piñón chico (descansa el resorte).', cuidado: 'Manguera fuerte directo a mazas/caja pedal: mete agua y mata rodamientos.' }
];

var MOTO = [
  { n: 'T-CLOCS antes de rodar (1 min)', ico: '✅', para: 'Toda salida, obligatoria.', mat: 'Checklist de memoria.', como: 'T = Tires: presión + dibujo. C = Controls: embrague, acelerador vuelve solo, frenos. L = Lights: alta/baja, intermitentes, bocina. O = Oil: nivel por mirilla/varilla en frío y vertical. C = Chain: tensión 2–3 cm juego medio + lubricada. S = Stand: pata + espejos + bencina.', nota: 'Presión típica 125–150cc: 28–32 psi delante, 30–36 detrás (manual manda).', cuidado: 'Neumático cuadrado o con telas = no sale a carretera.' },
  { n: 'Cadena: tensión y lubricación', ico: '⛓️', para: 'La pana N°1 en moto chica.', mat: 'Llaves 12–19 mm, lubricante cadena, regla.', como: 'En caballete/pata, punto medio entre piñón y corona: juego 20–30 mm. Si está tensa como cuerda de guitarra: suelta eje + tensores parejos (misma marca ambos lados). Limpia con trapo + parafina, lubrica por dentro girando rueda.', nota: 'Cadena seca = se estira y come piñón. En lluvia Penco: lubrica cada 300–500 km.', cuidado: 'Cadena con eslabón trabado o corona en punta de tiburón: kit nuevo, no solo cadena.' },
  { n: 'Aceite y filtro (4T)', ico: '🛢️', para: 'Motor 4 tiempos (la mayoría).', mat: 'Aceite 10W-40 o 20W-50 JASO MA2 (moto, no auto), filtro, bandeja, embudo.', como: 'Motor tibio 2 min, apaga, moto vertical. Suelta tapón cárter, escurre 10 min. Cambia filtro/arandela. Rellena lo que dice manual (ej 900 ml), mide sin enroscar varilla. Prende 1 min, revisa fuga + nivel.', nota: 'Cada 2.000–3.000 km en 125–200cc de uso diario. Guarda boleta + km en bitácora.', cuidado: 'Aceite de auto con “ahorro combustible” patina el embrague de moto.' },
  { n: 'No parte: chispa-bencina-aire', ico: '🔌', para: 'Diagnóstico express.', mat: 'Llave bujía, bujía de repuesto.', como: '1) ¿Hay bencina + llave abierta + corta-corriente en ON? 2) Saca bujía: café claro = bien; negra hollín = mezcla rica/filtro; mojada = se ahogó (seca + patea sin ahogador). 3) Apoya bujía al metal y da arranque: ¿hay chispa azul? No hay = fusible, cachimba, bobina. 4) Filtro aire: si está negro aceitoso, cámbialo.', nota: 'Bujía se cambia cada 6.000–10.000 km; lleva una de repuesto bajo el asiento.', cuidado: 'Pasta de arranque/éter en exceso lava el cilindro: 1 puff, no medio tarro.' },
  { n: 'Frenos y neumáticos (vida o muerte)', ico: '🛑', para: 'Revisión crítica mensual.', mat: 'Linterna, moneda para dibujo.', como: 'Pastilla: si queda <2 mm o chillido metálico, cambio. Disco rayado profundo = rectificar/cambiar. Líquido freno oscuro = cambio cada 2 años. Neumático: dibujo >1,6 mm, sin grietas laterales, presión semanal.', nota: 'Frena 70% delante + 30% atrás en seco; en mojado anticipa el doble de distancia.', cuidado: 'Pastillas nuevas: asiéntalas 200 km sin frenadas bruscas.' }
];

var AUTO = [
  { n: 'CHECK semanal (5 min, motor frío)', ico: '✅', para: 'Todo auto bencinero/diésel.', mat: 'Varilla, linterna, medidor presión.', como: 'Aceite entre MIN–MAX. Refrigerante en vaso (nunca abrir caliente). Líquido frenos + dirección/washer. Correa visible sin hilachas. Neumáticos: presión puerta/manual + repuesto. Luces + bocina + plumillas.', nota: 'Presión típica citycar: 30–33 psi. Revisa en frío (antes de andar).', cuidado: 'Aceite bajo MIN + testigo encendido = no andes: rellena o grúa.' },
  { n: 'Batería que muere en invierno', ico: '🔋', para: 'Pukem: el 60% de las no-partidas.', mat: 'Multímetro o tester, llave 10 mm, vaselina.', como: '12,4–12,7 V reposo = sana; <12 V = carga. Bornes: limpia sarro (agua caliente + cepillo), aprieta y vaselina fina. Si gira lento + click-click: puente con cables (rojo + muerto a + vivo, negro a masa) o carga lenta 8 h.', nota: 'Batería dura 2–4 años. Si tiene +3 inviernos: testéala en abril, no en junio.', cuidado: 'Desconecta primero negativo (−). Chispa cerca de batería = gas explosivo: ventila.' },
  { n: 'Sobrecalentamiento (aguja arriba)', ico: '🌡️', para: 'Emergencia típica taco/verano.', mat: 'Agua/refrigerante de reserva, trapo.', como: '1) Calefacción al máximo + ventilador (saca calor del motor). 2) Detente a la sombra, NO abras radiador caliente. 3) Espera 30–40 min, revisa vaso: si vacío y sin fuga visible, rellena. 4) Si hierve de nuevo o hay humo blanco dulce: grúa (culata en riesgo).', nota: 'Causa común: termostato, electroventilador, manguera, tapa radiador.', cuidado: 'Andar “un poquito más” con aguja en rojo = culata torcida ($500 mil+).' },
  { n: 'Cambio de rueda (pinchazo)', ico: '🛞', para: 'Ruta, noche, lluvia.', mat: 'Gata, llave cruz, repuesto, chaleco + triángulo, calza.', como: 'Orilla firme y plana, freno mano + primera/P + calza rueda opuesta. Afloja tuercas 1/2 vuelta ANTES de levantar. Gata en punto del manual (nunca en lata). Sube, cambia, baja, aprieta en cruz. Reaprieta a los 50 km.', nota: 'Repuesto temporal (“galleta”): máx 80 km/h y 200 km. Repara el original esta semana.', cuidado: 'Nunca parte del cuerpo bajo el auto solo con gata.' },
  { n: 'Mantención por km (no olvidar)', ico: '📅', para: 'Pauta base bencinero.', mat: 'Manual + bitácora.', como: 'Cada 10.000 km o 1 año: aceite + filtro aceite + filtro aire + revisión frenos. Cada 20.000: filtro bencina/polen, rotación neumáticos. Cada 40.000–60.000: bujías, correa accesorios, refrigerante, líquido frenos. Distribución: lo que diga manual (corte = motor).', nota: 'Anota fecha + km + qué aceite (ej 10W-40 semi) en 📓 Mi taller: vale plata al vender.', cuidado: 'Check engine parpadeando = detente; fijo = escáner pronto (no meses).' }
];

var MOTORES = [
  { n: '2T vs 4T (no te equivoques)', ico: '🔀', para: 'Motosierra, desbrozadora, bote, moto.', mat: 'Ojo al estanque.', como: '2T: mezcla bencina + aceite (ej 50:1 = 20 ml por litro). Sin humo azul = sin lubricación = se funde. 4T: bencina pura + aceite en cárter aparte (varilla). Si pones mezcla en 4T o pura en 2T, no insistas: vacía y parte de cero.', nota: 'Mezcla vieja (+30 días) falla: prepara poco y agita antes de usar.', cuidado: 'Aceite 2T de moto ≠ aceite de auto: usa el de la etiqueta.' },
  { n: 'Motor que no parte (bencinero chico)', ico: '🔌', para: 'Generador, motobomba, cortapasto, bote.', mat: 'Bujía, filtro, bencina fresca.', como: '1) Bencina fresca + llave abierta + interruptor ON + ahogador si está frío. 2) Filtro aire limpio (prueba sin filtro 10 seg). 3) Bujía: limpia, calibre 0,7 mm, chispa azul a masa. 4) Si se ahogó: saca bujía, seca, tira 5 veces sin bujía, rearma sin ahogador. 5) Carburador con bencina vieja = chicler tapado: limpia con limpia-carburador.', nota: 'El 70% de “murió el motor” es bencina de 3 meses en el estanque.', cuidado: 'Partidor en spray directo al cilindro en exceso dobla biela en motores chicos.' },
  { n: 'Diésel: aire y agua son el enemigo', ico: '🚜', para: 'Camioneta, tractor, generador diésel.', mat: 'Filtros, decantador.', como: 'Si chupa aire (cambio filtro/manguera): purga con bombín hasta que salga diésel sin burbujas. Drena agua del decantador cada luna en invierno (diésel con agua = inyectores caros). Precalienta bujías incandescentes 2–3 veces con frío antes de dar arranque.', nota: 'Humo negro = exceso diésel/filtro aire; humo blanco frío = normal 1 min, si sigue = taller.', cuidado: 'Éter en diésel con precalentador puede reventar: prohibido salvo manual.' },
  { n: 'Refrigeración y sobrecarga', ico: '🌡️', para: 'Bomba de agua, generador, fuera de borda.', mat: 'Agua, rejilla limpia.', como: 'Fuera de borda: chorro testigo debe salir siempre; si no sale: para, revisa toma tapada (alga/bolsa), nunca andes sin agua. Generador/bomba: rejilla + aletas limpias, aceite a nivel, no más del 80% de carga continua. Sombra + ventilación, nunca dentro de pieza (CO mortal).', nota: 'Impulsor (impeller) de bote: cambio cada 2 años o 200 h.', cuidado: 'Escape caliente + bencina derramada = incendio: extintor ABC a mano.' },
  { n: 'Eléctricos y baterías (bici/moto/auto EV)', ico: '⚡', para: 'E-bike, scooter, herramientas a batería.', mat: 'Cargador original.', como: 'Carga entre 20–80% para diario; 100% solo antes de viaje largo. Guarda a media carga en lugar fresco (no a pleno sol ni helada). Conector seco y firme; si se calienta el enchufe: detén y revisa. Autonomía cae 20–30% con frío Penco: planifica.', nota: 'Batería hinchada, olor dulce o calor excesivo = fuera de servicio + punto limpio e-waste.', cuidado: 'Solo cargador original y ventilado; nunca de noche sobre cama/sillón sin supervisión.' },
  { n: 'Guardado de invierno (6+ lunas parado)', ico: '❄️', para: 'Moto, bote, generador que descansa en Pukem.', mat: 'Estabilizador, funda, caballete.', como: 'Estanque lleno + estabilizador (evita óxido y gomas). Bencina de carburador: cierra llave y deja andar hasta que se apague. Batería desconectada (−) + carga mensual. Neumáticos inflados + sobre caballete. Funda transpirable, no nylon pegado.', nota: 'Partirlo 5 min al mes sin andar crea condensación: mejor guardado completo + 1 partida larga por luna.', cuidado: 'Bidones a la sombra, rotulados, lejos de living/pieza.' }
];

/* ---------------- DIALOGO ---------------- */
function rowCard(c) {
  if (c.txt) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4>' +
      '<p style="line-height:1.5">' + esc(c.txt) + '</p></div>';
  }
  return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4>' +
    (c.para ? '<p><b>Para:</b> ' + esc(c.para) + '</p>' : '') +
    (c.mat ? '<p><b>Necesitas:</b> ' + esc(c.mat) + '</p>' : '') +
    '<p><b>Cómo:</b> ' + esc(c.como) + '</p>' +
    (c.nota ? '<p class="muted">' + esc(c.nota) + '</p>' : '') +
    (c.cuidado ? '<p style="font-size:11px;color:#e8c56a">⚠️ ' + esc(c.cuidado) + '</p>' : '') + '</div>';
}
function switchTab(name) {
  ['Guia', 'Bici', 'Moto', 'Auto', 'Motores', 'Taller'].forEach(function (t) {
    var p = $('mec' + t), b = $('tabMec' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

function buildDialog() {
  var guiaHTML = GUIAS.map(rowCard).join('');
  var biciHTML = BICI.map(rowCard).join('');
  var motoHTML = MOTO.map(rowCard).join('');
  var autoHTML = AUTO.map(rowCard).join('');
  var motoresHTML = MOTORES.map(rowCard).join('');

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabMecGuia" class="btn btn-accent" style="width:auto">🧰 Guías básicas</button>' +
    '<button type="button" id="tabMecBici" class="btn" style="width:auto">🚲 Bicicleta</button>' +
    '<button type="button" id="tabMecMoto" class="btn" style="width:auto">🏍️ Moto</button>' +
    '<button type="button" id="tabMecAuto" class="btn" style="width:auto">🚗 Auto</button>' +
    '<button type="button" id="tabMecMotores" class="btn" style="width:auto">⚙️ Motores</button>' +
    '<button type="button" id="tabMecTaller" class="btn" style="width:auto">📓 Mi taller</button></div>' +
    '<div id="mecGuia">' + guiaHTML +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🧰 Regla de oro</h4><p class="muted" style="font-size:12px">Limpio + apretado + lubricado + a nivel resuelve el 80%. Lo que huela a bencina, eche humo raro o frene mal: se revisa HOY, no “después del viaje”.</p></div></div>' +
    '<div id="mecBici" class="hidden"><div class="conv-row"><label style="flex:1">🔍 Filtrar <input type="text" id="mecBiciQ" placeholder="pinchazo, freno, cambio, cadena..."></label></div><div class="mec-list" id="mecBiciList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + biciHTML + '</div></div>' +
    '<div id="mecMoto" class="hidden"><div class="conv-row"><label style="flex:1">🔍 Filtrar <input type="text" id="mecMotoQ" placeholder="cadena, aceite, bujía, freno..."></label></div><div class="mec-list" id="mecMotoList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + motoHTML + '</div></div>' +
    '<div id="mecAuto" class="hidden"><div class="conv-row"><label style="flex:1">🔍 Filtrar <input type="text" id="mecAutoQ" placeholder="batería, rueda, temperatura, aceite..."></label></div><div class="mec-list" id="mecAutoList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + autoHTML + '</div></div>' +
    '<div id="mecMotores" class="hidden"><div class="conv-row"><label style="flex:1">🔍 Filtrar <input type="text" id="mecMotoresQ" placeholder="2T, diésel, bote, eléctrico..."></label></div><div class="mec-list" id="mecMotoresList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' + motoresHTML + '</div></div>' +
    '<div id="mecTaller" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Anotar mantención</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="mecFecha"></label><label>Vehículo <select id="mecVeh"><option>Bicicleta</option><option>Moto</option><option>Auto</option><option>Motor / Bote / Generador</option><option>Otro</option></select></label></div>' +
    '<div class="conv-row"><label>Nombre <input type="text" id="mecNombre" placeholder="ej: Bici trek, YBR 125, V16, Motosierra" maxlength="40"></label><label>Tipo <select id="mecTipo"><option>Aceite / lubricación</option><option>Frenos</option><option>Transmisión / cadena</option><option>Neumático / rueda</option><option>Eléctrico / batería / bujía</option><option>Refrigeración</option><option>Filtros</option><option>Reparación</option><option>Revisión general</option></select></label></div>' +
    '<div class="conv-row"><label>Km / horas <input type="text" id="mecKm" placeholder="ej: 45.200 km / 120 h" maxlength="20"></label><label>Costo $ <input type="number" id="mecCosto" min="0" step="500" placeholder="ej: 15000"></label></div>' +
    '<label>Detalle <input type="text" id="mecDetalle" placeholder="qué se hizo, repuesto, próxima fecha..." maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="mecAdd" class="btn btn-accent" style="width:auto">+ Guardar</button></div></div>' +
    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">🔍 Buscar <input type="text" id="mecLogQ" placeholder="bici, freno, aceite..."></label><label>Filtrar <select id="mecLogF"><option value="">Todo</option><option>Bicicleta</option><option>Moto</option><option>Auto</option><option>Motor / Bote / Generador</option><option>Otro</option></select></label></div>' +
    '<div id="mecResumen" class="menstrual-card" style="margin-top:8px"></div>' +
    '<div id="mecLog" class="habits-list" style="margin-top:8px;max-height:280px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="mecStats" class="muted" style="font-size:11px"></span><span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="mecShare" class="btn" style="width:auto">📤 Compartir</button><button type="button" id="mecClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>';

  makeDialog('mecanicaDialog', '🔧 Mecánica — Bicicleta · Moto · Auto · Motores',
    'Guías básicas + fichas por vehículo + tu bitácora. Vive en <b>🏡 Hogar y Vida Práctica > 🔧 Energía y Taller</b>, junto a ⚡ Consumo eléctrico y 🔧 Bitácora Taller. Todo <b>privado y local</b>, 100% offline.',
    body);
}

/* ---------------- BITÁCORA ---------------- */
function renderLog() {
  var box = $('mecLog'); if (!box) return;
  var m = store();
  var data = m.logs || [];
  var q = (($('mecLogQ') && $('mecLogQ').value) || '').toLowerCase();
  var f = (($('mecLogF') && $('mecLogF').value) || '');
  var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
  var list = data.filter(function (r) {
    if (f && r.veh !== f) return false;
    if (q) {
      var t = ((r.nombre || '') + ' ' + (r.tipo || '') + ' ' + (r.detalle || '') + ' ' + (r.km || '')).toLowerCase();
      var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
      if (tn.indexOf(qn) < 0) return false;
    }
    return true;
  });
  var res = $('mecResumen'), st = $('mecStats');
  var tot = data.reduce(function (a, r) { return a + (+r.costo || 0); }, 0);
  if (res) {
    res.innerHTML = '<h4>📊 Resumen</h4><p class="muted" style="font-size:12px">' + data.length + ' registro(s) · 💰 $' + tot.toLocaleString('es-CL') + ' total' +
      (data.length ? '<br>Último: ' + esc(data.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); })[0].fecha || '') : '') + '</p>';
  }
  if (!list.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin registros' + (data.length ? ' para este filtro.' : '. Anota tu primera mantención arriba.') + '</p>';
    if (st) st.textContent = data.length ? data.length + ' en total' : '';
    return;
  }
  box.innerHTML = list.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 80).map(function (r) {
    var ico = r.veh === 'Bicicleta' ? '🚲' : r.veh === 'Moto' ? '🏍️' : r.veh === 'Auto' ? '🚗' : r.veh.indexOf('Motor') === 0 ? '⚙️' : '🔧';
    return '<div class="hora-item"><span style="font-size:12px">' + ico + ' <b>' + esc(r.nombre || r.veh || 'Vehículo') + '</b> · ' + esc(r.tipo || '') +
      '<br><span class="muted" style="font-size:10px">' + esc(r.fecha || '') + ' · ' + esc(r.veh || '') + (r.km ? ' · ' + esc(r.km) : '') + (r.costo ? ' · $' + (+r.costo).toLocaleString('es-CL') : '') + (r.detalle ? ' · ' + esc(r.detalle) : '') + '</span></span>' +
      '<button type="button" class="btn btn-icon mec-del" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.mec-del').forEach(function (x) {
    x.onclick = function () {
      var s2 = store();
      s2.logs = (s2.logs || []).filter(function (r) { return r.id !== x.dataset.k; });
      save(); renderLog();
    };
  });
  if (st) st.textContent = list.length + ' mostrado(s) · ' + data.length + ' total';
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
  /* 1) inyectar botón en Hogar y Vida Práctica > Energía y Taller (entre Taller y Conversión) */
  try {
    var existing = $('btnMecanica');
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
        btn.id = 'btnMecanica'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🔧 Mecánica';
        try { btn.setAttribute('data-sub', 'energia'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'mecanica taller bicicleta bici moto auto motor aceite frenos cadena neumatico rueda pinchazo bujia carburador bateria 2t 4t diesel bencina mantencion reparacion guia');
        var refC = g.querySelector('#btnConvert');
        if (refC) g.insertBefore(btn, refC);
        else g.appendChild(btn);
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + orden hogar|energia + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnMecanica') < 0) ALL_BTNS.push('btnMecanica');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnMecanica = ['hogar', 'energia'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['hogar|energia'] && BTN_ORDER['hogar|energia'].indexOf('btnMecanica') < 0) {
      var _o = BTN_ORDER['hogar|energia'], _ni = _o.indexOf('btnConvert');
      if (_ni < 0) _o.push('btnMecanica'); else _o.splice(_ni, 0, 'btnMecanica');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnMecanica = true; });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Hogar y Vida Práctica) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnMecanica"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Hogar') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnMecanica"> 🔧 Mecánica';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnMecanica !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnMecanica = lab.querySelector('input').checked;
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
  renderLog();

  var b = $('btnMecanica');
  if (b) b.onclick = function () {
    if ($('mecFecha') && !$('mecFecha').value) $('mecFecha').value = todayKey();
    renderLog();
    openDlg('mecanicaDialog');
  };

  ['Guia', 'Bici', 'Moto', 'Auto', 'Motores', 'Taller'].forEach(function (t) {
    var tb = $('tabMec' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  bindFilter('mecBiciQ', 'mecBiciList');
  bindFilter('mecMotoQ', 'mecMotoList');
  bindFilter('mecAutoQ', 'mecAutoList');
  bindFilter('mecMotoresQ', 'mecMotoresList');
  var lq = $('mecLogQ'); if (lq) lq.oninput = renderLog;
  var lf = $('mecLogF'); if (lf) lf.onchange = renderLog;

  var ad = $('mecAdd');
  if (ad) ad.onclick = function () {
    var nom = clean((($('mecNombre') || {}).value || '').trim(), 40);
    if (!nom) return alert('Escribe el nombre del vehículo (ej: Bici, YBR 125)');
    var m = store();
    m.logs.push({
      id: uid('mec'),
      fecha: ($('mecFecha') || {}).value || todayKey(),
      veh: ($('mecVeh') || {}).value || 'Otro',
      nombre: nom,
      tipo: ($('mecTipo') || {}).value || 'Revisión general',
      km: clean((($('mecKm') || {}).value || '').trim(), 20),
      costo: parseFloat(($('mecCosto') || {}).value) || 0,
      detalle: clean((($('mecDetalle') || {}).value || '').trim(), 120)
    });
    save('Mantención guardada 🔧');
    if ($('mecNombre')) $('mecNombre').value = '';
    if ($('mecDetalle')) $('mecDetalle').value = '';
    if ($('mecCosto')) $('mecCosto').value = '';
    if ($('mecKm')) $('mecKm').value = '';
    renderLog();
  };

  var sh = $('mecShare');
  if (sh) sh.onclick = async function () {
    var d = store().logs || [];
    if (!d.length) return alert('Sin registros aún');
    var t = '🔧 Mi taller mecánico\n' + d.slice().sort(function (a, b) { return (a.fecha || '').localeCompare(b.fecha || ''); }).map(function (r) {
      return '• ' + r.fecha + ' · ' + r.nombre + ' (' + r.veh + ' · ' + r.tipo + ')' + (r.km ? ' · ' + r.km : '') + (r.costo ? ' · $' + (+r.costo).toLocaleString('es-CL') : '') + (r.detalle ? ' — ' + r.detalle : '');
    }).join('\n');
    await share('Mecánica', t);
  };
  var cl = $('mecClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu bitácora de mecánica?')) return;
    try { var u = userData(); if (u && u.mecanica) u.mecanica.logs = []; } catch (e) {}
    save(); renderLog();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
