/* ============================================================
   NUMEROLOGIA — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa e independiente:
   - Boton btnNumerologia (grupo Linaje > Interior)
   - Dialogo numerologiaDialog con 6 pestanas:
     1) Guia (que es, reduccion, maestros, karmicos, tabla)
     2) Camino de Vida (fecha nacimiento + numero + pinaculos
        + desafios + madurez + energia del dia)
     3) Nombre (destino/expresion, alma, personalidad,
        equilibrio, madurez por nombre, analisis letra x letra)
     4) Ciclos (ano personal, mes personal, dia personal,
        hora personal + calendario del ano + luna actual)
     5) Compatibilidad (dos caminos de vida o dos fechas,
        matriz 1-9/11/22 + consejo de vinculo)
     6) Mis registros (perfiles guardados, historial de
        calculos, diario, compartir, llevar a nota del dia)
   - Todo local y privado por usuario:
     userData().numerologia = { perfiles:[], calcs:[], diario:{} }
   - Pitagorica clasica, maestros 11/22/33 no se reducen,
     karmicos 13/14/16/19 se avisan. 100% offline.
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
function blank() { return { perfiles: [], calcs: [], diario: {} }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.numerologia) u.numerologia = blank();
    var n = u.numerologia;
    if (!Array.isArray(n.perfiles)) n.perfiles = [];
    if (!Array.isArray(n.calcs)) n.calcs = [];
    if (!n.diario) n.diario = {};
    return n;
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
function makeDialog(id, title, sub, bodyHTML) {
  var old = $(id);
  if (old) old.remove();
  var d = document.createElement('dialog');
  d.id = id;
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">' + title + '</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">\u2715</button></div>' +
    (sub ? '<p class="muted" style="line-height:1.5">' + sub + '</p>' : '') +
    bodyHTML +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }
function switchTab(name) {
  ['Guia', 'Vida', 'Nombre', 'Ciclos', 'Compat', 'Reg'].forEach(function (t) {
    var p = $('num' + t), b = $('tabNum' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}
function lunaTxt(key) {
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' \u00B7 d\u00EDa ' + r.diaN; }
  } catch (e) {}
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return 'Luna ' + m.luna + ' \u00B7 d\u00EDa ' + m.dia; }
  } catch (e2) {}
  return '';
}

/* ============================================================
   NUCLEO NUMEROLOGICO
   ============================================================ */
function reducir(n, keepMasters) {
  var pasos = [n];
  var cur = n;
  while (cur > 9) {
    if (keepMasters && (cur === 11 || cur === 22 || cur === 33)) break;
    var s = 0, t = Math.abs(cur);
    while (t > 0) { s += t % 10; t = Math.floor(t / 10); }
    cur = s;
    pasos.push(cur);
    if (pasos.length > 12) break;
  }
  return { final: cur, pasos: pasos };
}
function sumaDigitosFecha(key) {
  // key YYYY-MM-DD -> suma D+M+A reducida por partes (metodo clasico)
  var p = String(key || '').split('-');
  if (p.length < 3) return null;
  var y = +p[0], m = +p[1], d = +p[2];
  if (!y || !m || !d) return null;
  var rd = reducir(d, true), rm = reducir(m, true), ry = reducir(y, true);
  var total = rd.final + rm.final + ry.final;
  var r = reducir(total, true);
  return { d: d, m: m, y: y, rd: rd, rm: rm, ry: ry, total: total, r: r };
}
function caminoDeVida(key) {
  var s = sumaDigitosFecha(key);
  if (!s) return null;
  return s;
}
// Tabla pitagorica: AJS=1 BKT=2 CLU=3 DMV=4 ENW=5 FOX=6 GPY=7 HQZ=8 IR=9
var PIT = { A:1,J:1,S:1,B:2,K:2,T:2,C:3,L:3,U:3,D:4,M:4,V:4,E:5,N:5,'\u00D1':5,W:5,F:6,O:6,X:6,G:7,P:7,Y:7,H:8,Q:8,Z:8,I:9,R:9 };
function normLetra(ch) {
  ch = String(ch || '').toUpperCase();
  if (ch === '\u00C1') return 'A';
  if (ch === '\u00C9') return 'E';
  if (ch === '\u00CD') return 'I';
  if (ch === '\u00D3') return 'O';
  if (ch === '\u00DA' || ch === '\u00DC') return 'U';
  if (ch === '\u00D1') return 'N'; // eñe suena N (criterio simple y estable)
  return ch;
}
function esVocal(ch) { return 'AEIOU'.indexOf(ch) >= 0; }
function analizarNombre(nombre) {
  var limpio = String(nombre || '').toUpperCase();
  var letras = [];
  var tot = 0, voc = 0, con = 0, ini = 0, nIni = 0;
  var primera = null;
  for (var i = 0; i < limpio.length; i++) {
    var c = normLetra(limpio[i]);
    if (c === ' ' || c === '-' || c === "'") continue;
    // inicial de cada palabra
    var esInicio = (i === 0) || /[\s\-']/.test(limpio[i - 1]);
    if (PIT[c]) {
      if (!primera) primera = c;
      letras.push({ l: limpio[i], base: c, v: PIT[c], vocal: esVocal(c), inicio: esInicio });
      tot += PIT[c];
      if (esVocal(c)) voc += PIT[c]; else con += PIT[c];
      if (esInicio) { ini += PIT[c]; nIni++; }
    }
  }
  return {
    letras: letras,
    total: tot, dest: reducir(tot, true),
    alma: reducir(voc, true), pers: reducir(con, true),
    equil: reducir(ini, true), primeraLetra: primera, nLetras: letras.length
  };
}
function desafioDeFecha(key) {
  var p = String(key || '').split('-');
  if (p.length < 3) return null;
  var d = +p[2], m = +p[1], y = +p[0];
  function rd1(n) { while (n > 9) { var s = 0; while (n > 0) { s += n % 10; n = Math.floor(n / 10); } n = s; } return n; }
  var D = rd1(d), M = rd1(m), Y = rd1(y);
  var c1 = Math.abs(D - M), c2 = Math.abs(D - Y), c3 = Math.abs(c1 - c2);
  return { d1: c1, d2: c2, principal: c3 };
}
function pinaculosDeFecha(key) {
  var p = String(key || '').split('-');
  if (p.length < 3) return null;
  function rd1(n) { while (n > 9) { var s = 0; while (n > 0) { s += n % 10; n = Math.floor(n / 10); } n = s; } return n; }
  var D = rd1(+p[2]), M = rd1(+p[1]), Y = rd1(+p[0]);
  var p1 = reducir(D + M, true).final, p2 = reducir(D + Y, true).final,
      p3 = reducir(p1 + p2, true).final, p4 = reducir(M + Y, true).final;
  return [p1, p2, p3, p4];
}
function madurez(camino, destino) { return reducir((camino || 0) + (destino || 0), true).final; }
function anoPersonal(keyNac, keyFecha) {
  var pn = String(keyNac || '').split('-'), pf = String(keyFecha || todayKey()).split('-');
  if (pn.length < 3 || pf.length < 3) return null;
  function rd1(n) { while (n > 9) { var s = 0; while (n > 0) { s += n % 10; n = Math.floor(n / 10); } n = s; } return n; }
  var d = rd1(+pn[2]) + rd1(+pn[1]) + rd1(+pf[0]);
  return reducir(d, false).final; // ano personal 1-9 (sin maestros)
}
function mesPersonal(anoP, keyFecha) {
  var pf = String(keyFecha || todayKey()).split('-');
  var m = +pf[1] || 1;
  function rd1(n) { while (n > 9) { var s = 0; while (n > 0) { s += n % 10; n = Math.floor(n / 10); } n = s; } return n; }
  return reducir(anoP + rd1(m), false).final;
}
function diaPersonal(anoP, mesP, keyFecha) {
  var pf = String(keyFecha || todayKey()).split('-');
  var d = +pf[2] || 1;
  function rd1(n) { while (n > 9) { var s = 0; while (n > 0) { s += n % 10; n = Math.floor(n / 10); } n = s; } return n; }
  return reducir(mesP + rd1(d), false).final;
}

/* ============================================================
   SIGNIFICADOS
   ============================================================ */
var NUM_INFO = {
  1: { n: 1, nombre: 'El Iniciador', icon: '\uD83D\uDD25', luz: 'Liderazgo, autonomia, iniciativa, foco.', sombra: 'Egoismo, impaciencia, autoritarismo si se desequilibra.', amor: 'Necesita admirar y espacio propio. Mejor con 3, 5 y 9.', trabajo: 'Emprender, liderar, abrir caminos.', practica: 'Empieza una cosa pendiente hoy, aunque sea en pequeno.', color: 'rojo', piedra: 'granate', dia: 'domingo' },
  2: { n: 2, nombre: 'El Cooperador', icon: '\uD83E\uDD1D', luz: 'Diplomacia, paciencia, escucha, tacto.', sombra: 'Hipersensibilidad, indecision, postergarse.', amor: 'Romantico y cuidador. Mejor con 4, 6 y 8.', trabajo: 'Mediar, acompanar, detallar, sanar equipos.', practica: 'Escucha completa a alguien sin interrumpir.', color: 'naranjo suave', piedra: 'cuarzo rosa', dia: 'lunes' },
  3: { n: 3, nombre: 'El Creador', icon: '\uD83C\uDFA8', luz: 'Expresion, alegria, arte, comunicacion.', sombra: 'Dispersion, drama, hablar sin actuar.', amor: 'Chispa y juego. Mejor con 1, 5 y 7.', trabajo: 'Crear, comunicar, ensenar con humor.', practica: 'Escribe, dibuja o canta 10 minutos hoy.', color: 'amarillo', piedra: 'citrino', dia: 'martes' },
  4: { n: 4, nombre: 'El Constructor', icon: '\uD83E\uDDF1', luz: 'Orden, constancia, trabajo serio, base solida.', sombra: 'Rigidez, terquedad, workaholism.', amor: 'Leal y estable. Mejor con 2, 6 y 8.', trabajo: 'Construir sistemas, oficios, tierra y numeros.', practica: 'Ordena un cajon o termina un tramite pendiente.', color: 'verde', piedra: 'jade', dia: 'miercoles' },
  5: { n: 5, nombre: 'El Libre', icon: '\uD83C\uDF2C\uFE0F', luz: 'Libertad, cambio, viaje, adaptacion.', sombra: 'Excesos, inquietud, huir del compromiso.', amor: 'Pasional y libre. Mejor con 1, 3 y 7.', trabajo: 'Ventas, movimiento, medios, aventura.', practica: 'Cambia una rutina: otro camino, otra comida.', color: 'turquesa', piedra: 'aguamarina', dia: 'jueves' },
  6: { n: 6, nombre: 'El Cuidador', icon: '\uD83D\uDC9A', luz: 'Hogar, servicio, belleza, responsabilidad amorosa.', sombra: 'Control “por tu bien”, culpa, sobrecarga.', amor: 'Comprometido y familiar. Mejor con 2, 4 y 8.', trabajo: 'Cuidar, educar, salud, comunidad.', practica: 'Arregla algo de tu hogar y agradece en voz alta.', color: 'rosado', piedra: 'cuarzo rosa', dia: 'viernes' },
  7: { n: 7, nombre: 'El Sabio', icon: '\uD83D\uDD2E', luz: 'Analisis, estudio, espiritualidad, silencio fertil.', sombra: 'Aislamiento, frialdad, escepticismo extremo.', amor: 'Profundo y selectivo. Mejor con 3, 5 y 9.', trabajo: 'Investigar, analizar, sanar, programar.', practica: '20 min de estudio o meditacion sin celular.', color: 'violeta', piedra: 'amatista', dia: 'sabado' },
  8: { n: 8, nombre: 'El Manifestador', icon: '\uD83D\uDCB0', luz: 'Abundancia, poder justo, gestion, karma equilibrado.', sombra: 'Ambicion dura, control del dinero, agotamiento.', amor: 'Intenso y protector. Mejor con 2, 4 y 6.', trabajo: 'Negocios, finanzas, direccion, justicia.', practica: 'Revisa un numero real: gasto, deuda o ahorro.', color: 'dorado', piedra: 'pirita', dia: 'sabado' },
  9: { n: 9, nombre: 'El Humanitario', icon: '\uD83D\uDD4A\uFE0F', luz: 'Compasion, cierre, arte mayor, servicio al mundo.', sombra: 'Drama del salvador, apego al pasado.', amor: 'Amor universal. Mejor con 1, 3 y 7.', trabajo: 'Arte, sanacion, causas, docencia.', practica: 'Suelta algo hoy: dona, perdona o cierra.', color: 'blanco', piedra: 'selenita', dia: 'domingo' },
  11: { n: 11, nombre: 'El Iluminador (maestro)', icon: '\u2728', luz: 'Intuicion alta, inspiracion, canal espiritual.', sombra: 'Ansiedad, nerviosismo, “mucho voltaje”.', amor: 'Conexion de alma. Pide calma y verdad.', trabajo: 'Guiar, inspirar, crear con sentido.', practica: 'Anota tu corazonada y verifica en 3 dias.', color: 'plateado', piedra: 'labradorita', dia: 'lunes' },
  22: { n: 22, nombre: 'El Gran Constructor (maestro)', icon: '\uD83C\uDFDB\uFE0F', luz: 'Sueno grande vuelto obra concreta para muchos.', sombra: 'Presion enorme, autoexigencia, colapso.', amor: 'Socio de proyecto de vida. Pide equipo.', trabajo: 'Grandes obras, territorio, organizacion.', practica: 'Baja tu sueno a 3 pasos con fecha.', color: 'dorado profundo', piedra: 'obsidiana dorada', dia: 'miercoles' },
  33: { n: 33, nombre: 'El Sanador (maestro)', icon: '\uD83D\uDC9B', luz: 'Amor que sana, servicio desinteresado.', sombra: 'Martirio, cargar a todos, olvidar el cuerpo.', amor: 'Amor devocional. Pide limites sanos.', trabajo: 'Sanar, ensenar, cuidar comunidad.', practica: 'Sirve 1 hora sin esperar nada a cambio.', color: 'rosa dorado', piedra: 'cuarzo maestro', dia: 'viernes' }
};
var KARMI = {
  13: 'Deuda 13: transformar el “atajo” en disciplina. Clave: orden diario, terminar lo empezado.',
  14: 'Deuda 14: transformar el exceso en libertad sana. Clave: moderacion + compromiso.',
  16: 'Deuda 16: la torre que limpia el ego. Clave: humildad, soltar lo falso, reconstruir.',
  19: 'Deuda 19: aprender a pedir y recibir ayuda. Clave: interdependencia, no solo autosuficiencia.'
};
var CICLO_INFO = {
  1: { t: 'Sembrar e iniciar', d: 'Buen momento para partir, pedir, lanzar. Planta intenciones.' },
  2: { t: 'Paciencia y alianzas', d: 'No forces. Negocia, escucha, riega lo sembrado.' },
  3: { t: 'Crear y mostrar', d: 'Comunica, vende, celebra. Energia social alta.' },
  4: { t: 'Ordenar y trabajar', d: 'Rutina, papeles, salud, casa. Constancia silenciosa.' },
  5: { t: 'Cambio y movimiento', d: 'Viaja, prueba, suelta rutina. Ojo con excesos.' },
  6: { t: 'Hogar y responsabilidad', d: 'Familia, hogar, compromisos. Repara vinculos.' },
  7: { t: 'Pausa y estudio', d: 'Reflexiona, estudia, descansa. No firmes a lo loco.' },
  8: { t: 'Cosecha y poder', d: 'Cobra, negocia, decide dinero. Recoge lo sembrado.' },
  9: { t: 'Cerrar y soltar', d: 'Termina, perdona, dona, limpia. Prepara el ciclo nuevo.' }
};
function numInfo(n) { return NUM_INFO[n] || NUM_INFO[reducir(n, false).final] || NUM_INFO[1]; }
function pasosTxt(pasos) { return pasos.join(' \u2192 '); }
function karmicoAviso(total) { return KARMI[total] || null; }

/* Compatibilidad simple por suma de caminos */
function compatLectura(a, b) {
  var s = reducir(a + b, true).final;
  var base = {
    1: 'Chispa de inicios: se activan mutuamente. Acuerden quien lidera que.',
    2: 'Vinculo tierno y paciente: hogar emocional. Cuiden no postergarse.',
    3: 'Alegria y juego: risa facil. Pongan foco para no dispersarse.',
    4: 'Base solida: construyen lento y firme. Agenden tambien el placer.',
    5: 'Aventura compartida: viajes y cambios. Pacten libertad con respeto.',
    6: 'Hogar y cuidado: familia, nido. Ojo con controlar “por amor”.',
    7: 'Conexion profunda: silencio fertil. Respeten espacios a solas.',
    8: 'Poder y cosecha: buenos socios. Hablen de dinero sin tabu.',
    9: 'Amor grande: se sanan y cierran ciclos. Suelten el pasado juntos.',
    11: 'Encuentro espejo: se despiertan mutuamente. Calma con la intensidad.',
    22: 'Proyecto mayor: pueden construir algo que sirva a muchos.',
    33: 'Servicio amoroso: sanan juntos. Limites sanos primero.'
  };
  return { suma: s, texto: base[s] || base[reducir(s, false).final] };
}

/* ============================================================
   DIALOGO
   ============================================================ */
function cardNum(n, extra) {
  var info = numInfo(n);
  return '<div class="menstrual-card" style="border-color:var(--gold);background:linear-gradient(135deg,var(--panel),var(--card))">' +
    '<h4 style="color:var(--gold)">' + info.icon + ' N\u00FAmero ' + info.n + ' \u00B7 ' + esc(info.nombre) + '</h4>' +
    (extra || '') +
    '<p style="font-size:12px;line-height:1.55"><b>Luz:</b> ' + esc(info.luz) + '<br><b>Sombra a cuidar:</b> ' + esc(info.sombra) + '</p>' +
    '<p class="muted" style="font-size:11px"><b>Amor:</b> ' + esc(info.amor) + '<br><b>Trabajo:</b> ' + esc(info.trabajo) + '<br><b>Practica hoy:</b> ' + esc(info.practica) + '<br>Color: ' + esc(info.color) + ' \u00B7 Piedra: ' + esc(info.piedra) + ' \u00B7 Dia: ' + esc(info.dia) + '</p></div>';
}
function buildDialog() {
  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabNumGuia" class="btn btn-accent" style="width:auto">\uD83D\uDCD6 Gu\u00EDa</button>' +
    '<button type="button" id="tabNumVida" class="btn" style="width:auto">\uD83C\uDF31 Camino de Vida</button>' +
    '<button type="button" id="tabNumNombre" class="btn" style="width:auto">\uD83D\uDD24 Nombre</button>' +
    '<button type="button" id="tabNumCiclos" class="btn" style="width:auto">\uD83C\uDF19 Ciclos</button>' +
    '<button type="button" id="tabNumCompat" class="btn" style="width:auto">\uD83D\uDC9E Compatibilidad</button>' +
    '<button type="button" id="tabNumReg" class="btn" style="width:auto">\uD83D\uDCD3 Mis registros</button></div>' +

    /* GUIA */
    '<div id="numGuia">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4 style="color:var(--gold)">\u2728 Numerolog\u00EDa pitag\u00F3rica — el mapa de tus n\u00FAmeros</h4>' +
    '<p class="muted" style="font-size:11px;line-height:1.6">Todo se <b>reduce sumando d\u00EDgitos</b> hasta 1-9, salvo los <b>n\u00FAmeros maestros 11, 22 y 33</b>, que no se reducen: traen voltaje extra y prueba extra. Ejemplo: 29 \u2192 2+9=11 (maestro, se conserva) \u2192 si quieres simple: 1+1=2.</p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><span class="chip">1-9 personales</span><span class="chip">11/22/33 maestros</span><span class="chip">13/14/16/19 k\u00E1rmicos</span></div></div>' +
    '<div class="help-grid" style="margin-top:10px">' +
    '<div class="help-card"><h4>\uD83C\uDF31 Camino de Vida</h4><p style="font-size:11px">Tu fecha de nacimiento reducida. Es tu <b>escuela de vida</b>: no cambia. Se calcula d\u00EDa + mes + a\u00F1o por separado y luego se suma.</p></div>' +
    '<div class="help-card"><h4>\uD83D\uDD24 Destino / Expresi\u00F3n</h4><p style="font-size:11px">Tu <b>nombre completo</b> sumado (tabla pitag\u00F3rica). Habla de tu misi\u00F3n y talentos: lo que vienes a entregar.</p></div>' +
    '<div class="help-card"><h4>\uD83D\uDC96 Alma (vocales)</h4><p style="font-size:11px">Lo que tu coraz\u00F3n quiere en secreto. Suma solo <b>vocales</b> del nombre.</p></div>' +
    '<div class="help-card"><h4>\uD83C\uDFAD Personalidad (consonantes)</h4><p style="font-size:11px">Tu m\u00E1scara, lo que otros ven primero. Suma solo <b>consonantes</b>.</p></div>' +
    '<div class="help-card"><h4>\u2696\uFE0F Equilibrio + Madurez</h4><p style="font-size:11px"><b>Equilibrio:</b> iniciales del nombre (como act\u00FAas bajo presi\u00F3n). <b>Madurez:</b> Camino + Destino (florece desde los ~40).</p></div>' +
    '<div class="help-card"><h4>\uD83C\uDF19 Ciclos 1-9</h4><p style="font-size:11px"><b>A\u00F1o + Mes + D\u00EDa personal</b> (siempre 1-9). Te dicen si es tiempo de sembrar, cuidar o cosechar.</p></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>\uD83D\uDD22 Tabla pitag\u00F3rica (la que usa esta secci\u00F3n)</h4>' +
    '<p class="muted" style="font-size:11px;line-height:1.7"><b>1:</b> A J S &nbsp; <b>2:</b> B K T &nbsp; <b>3:</b> C L U &nbsp; <b>4:</b> D M V &nbsp; <b>5:</b> E N W (\u00D1\u2192N) &nbsp; <b>6:</b> F O X &nbsp; <b>7:</b> G P Y &nbsp; <b>8:</b> H Q Z &nbsp; <b>9:</b> I R<br>Tildes se ignoran (\u00C1\u2192A). Se usa el <b>nombre de nacimiento completo</b> para el Destino; apodos solo para jugar.</p></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>\u26A0\uFE0F N\u00FAmeros k\u00E1rmicos 13 · 14 · 16 · 19</h4>' +
    '<p class="muted" style="font-size:11px;line-height:1.6">Si en tu suma aparece un 13, 14, 16 o 19 antes de reducir, esta secci\u00F3n te avisa con su lecci\u00F3n. No es castigo: es <b>tarea pendiente bien concreta</b> (disciplina, moderaci\u00F3n, humildad, pedir ayuda).</p></div>' +
    '<div class="menstrual-card" style="margin-top:10px;background:var(--panel)"><h4>\uD83C\uDF19 Numerolog\u00EDa + Luna (Penco)</h4>' +
    '<p class="muted" style="font-size:11px;line-height:1.6">Cruza tu <b>D\u00EDa personal</b> con la luna: d\u00EDas 1-3-5-8 rinden con <b>luna creciente</b> (lanzar); d\u00EDas 2-6-7 piden <b>menguante</b> (ordenar, descansar); d\u00EDas 4 y 9 cierran bien con <b>luna nueva/llena</b> (ritual de suelta). Tu luna de hoy aparece en cada c\u00E1lculo.</p></div>' +
    '</div>' +

    /* VIDA */
    '<div id="numVida" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4 style="color:var(--gold)">\uD83C\uDF31 Tu Camino de Vida</h4>' +
    '<div class="conv-row"><label style="flex:1">Fecha de nacimiento <input type="date" id="numNac"></label>' +
    '<label style="flex:2">Nombre (para Madurez) <input type="text" id="numNacNombre" placeholder="ej: Rosa Elena Parra" maxlength="80"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="numCalcVida" class="btn btn-accent" style="width:auto">\u2728 Calcular mi mapa</button>' +
    '<button type="button" id="numSavePerfil" class="btn" style="width:auto">\uD83D\uDCBE Guardar perfil</button></div>' +
    '<p class="muted" id="numVidaLuna" style="font-size:11px"></p></div>' +
    '<div id="numVidaOut" style="margin-top:10px"></div></div>' +

    /* NOMBRE */
    '<div id="numNombre" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4 style="color:var(--gold)">\uD83D\uDD24 Poder de tu nombre</h4>' +
    '<label>Nombre completo (ideal: nacimiento) <input type="text" id="numNombreIn" placeholder="ej: Juan Pablo Sepulveda Rojas" maxlength="90"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="numCalcNombre" class="btn btn-accent" style="width:auto">\uD83D\uDD24 Analizar nombre</button>' +
    '<button type="button" id="numNombreToPerfil" class="btn" style="width:auto">\uD83D\uDCBE Guardar como perfil</button></div></div>' +
    '<div id="numNombreOut" style="margin-top:10px"></div></div>' +

    /* CICLOS */
    '<div id="numCiclos" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4 style="color:var(--gold)">\uD83C\uDF19 Tus ciclos personales</h4>' +
    '<div class="conv-row"><label style="flex:1">Nacimiento <input type="date" id="numCicloNac"></label>' +
    '<label style="flex:1">Ver fecha <input type="date" id="numCicloFecha"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="numCalcCiclo" class="btn btn-accent" style="width:auto">\uD83C\uDF19 Ver mis ciclos</button>' +
    '<button type="button" id="numCicloHoy" class="btn" style="width:auto">Hoy</button>' +
    '<button type="button" id="numCicloToNote" class="btn" style="width:auto">\uD83D\uDCDD Llevar al d\u00EDa</button></div>' +
    '<p class="muted" id="numCicloLuna" style="font-size:11px"></p></div>' +
    '<div id="numCicloOut" style="margin-top:10px"></div>' +
    '<div id="numCicloYear" style="margin-top:10px"></div></div>' +

    /* COMPAT */
    '<div id="numCompat" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4 style="color:var(--gold)">\uD83D\uDC9E Compatibilidad de Caminos de Vida</h4>' +
    '<p class="muted" style="font-size:11px">Compara dos personas por fecha de nacimiento (o escribe directo sus Caminos). Es orientaci\u00F3n, no sentencia: el v\u00EDnculo lo construyen ustedes.</p>' +
    '<div class="conv-row"><label style="flex:1">Persona 1 · nacimiento <input type="date" id="numCompA"></label>' +
    '<label style="flex:1">Persona 2 · nacimiento <input type="date" id="numCompB"></label></div>' +
    '<div class="conv-row"><label style="flex:1">o Camino 1 (1-9/11/22/33) <input type="number" id="numCompN1" min="1" max="33" placeholder="ej: 7"></label>' +
    '<label style="flex:1">o Camino 2 <input type="number" id="numCompN2" min="1" max="33" placeholder="ej: 3"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="numCalcCompat" class="btn btn-accent" style="width:auto">\uD83D\uDC9E Comparar</button></div></div>' +
    '<div id="numCompatOut" style="margin-top:10px"></div></div>' +

    /* REGISTROS */
    '<div id="numReg" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4 style="color:var(--gold)">\uD83D\uDCD3 Perfiles guardados</h4>' +
    '<p class="muted" style="font-size:11px">Guarda tu familia o equipo una vez y recalcula sin reescribir. Todo <b>privado y local</b>.</p>' +
    '<div class="conv-row"><label style="flex:2">Nombre <input type="text" id="numPerfNombre" placeholder="ej: Mam\u00E1" maxlength="60"></label>' +
    '<label style="flex:1">Nacimiento <input type="date" id="numPerfNac"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="numPerfAdd" class="btn btn-accent" style="width:auto">+ Guardar perfil</button></div></div>' +
    '<div id="numPerfList" class="habits-list" style="margin-top:10px;max-height:260px"></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>\uD83D\uDCD2 Historial de c\u00E1lculos</h4><div id="numHistList" class="habits-list" style="max-height:220px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="numHistStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px"><button type="button" id="numHistShare" class="btn" style="width:auto">\uD83D\uDCE4 Compartir</button>' +
    '<button type="button" id="numHistClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">\uD83D\uDDD1 Borrar</button></span></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>\uD83D\uDCDD Diario numerol\u00F3gico</h4>' +
    '<p class="muted" style="font-size:11px">Una l\u00EDnea por d\u00EDa: \u00BFc\u00F3mo se sinti\u00F3 tu n\u00FAmero hoy? Queda ligado al calendario.</p>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="numDiaFecha"></label></div>' +
    '<label>Nota <input type="text" id="numDiaTxt" placeholder="ej: d\u00EDa 5: cambi\u00E9 la ruta y rend\u00ED mejor" maxlength="160"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="numDiaAdd" class="btn btn-accent" style="width:auto">+ Guardar nota</button>' +
    '<button type="button" id="numDiaToNote" class="btn" style="width:auto">\uD83D\uDCDD Llevar a nota del d\u00EDa</button></div>' +
    '<div id="numDiaList" class="habits-list" style="margin-top:8px;max-height:200px"></div></div>' +
    '</div>';

  makeDialog('numerologiaDialog', '\uD83D\uDD22 Numerolog\u00EDa',
    'Tu mapa pitag\u00F3rico completo: <b>Camino de Vida, Destino, Alma, ciclos y compatibilidad</b>. Todo <b>privado y local</b>, 100% offline.',
    body);
}

/* ---------- renders ---------- */
function pushHist(txt) {
  var s = store();
  s.calcs.unshift({ id: uid('nc'), fecha: todayKey(), txt: String(txt).slice(0, 280) });
  if (s.calcs.length > 80) s.calcs.length = 80;
  save();
}
function vidaHTML(key, nombre) {
  var cv = caminoDeVida(key);
  if (!cv) return '<p class="muted">Escribe una fecha v\u00E1lida.</p>';
  var r = cv.r;
  var karm = karmicoAviso(cv.total) || karmicoAviso(cv.rd.final + 0 > 99 ? 0 : 0);
  // karmicos tambien en sumandos: dia/mes/ano sin reducir
  var k2 = karmicoAviso(cv.d) || karmicoAviso(cv.m) || karmicoAviso(cv.y) || karm;
  var an = analizarNombre(nombre || '');
  var destN = an.nLetras ? an.dest.final : null;
  var mad = (destN != null) ? madurez(r.final, destN) : null;
  var des = desafioDeFecha(key);
  var pin = pinaculosDeFecha(key);
  var info = numInfo(r.final);
  var h = cardNum(r.final,
    '<p class="muted" style="font-size:11px">Suma: ' + cv.d + ' + ' + cv.m + ' + ' + cv.y +
    ' \u2192 d\u00EDa ' + pasosTxt(cv.rd.pasos) + ' · mes ' + pasosTxt(cv.rm.pasos) + ' · a\u00F1o ' + pasosTxt(cv.ry.pasos) +
    ' \u2192 total ' + cv.total + ' \u2192 <b>' + pasosTxt(r.pasos) + '</b> ' + lunaTxt(key) + '</p>');
  if (k2) h += '<div class="menstrual-card" style="border-color:#e8a56a"><h4>\u26A0\uFE0F N\u00FAmero k\u00E1rmico presente</h4><p class="muted" style="font-size:11px">' + esc(k2) + '</p></div>';
  h += '<div class="help-grid" style="margin-top:10px">' +
    '<div class="help-card"><h4>\u26F0\uFE0F Desaf\u00EDos ' + des.d1 + ' · ' + des.d2 + ' · principal ' + des.principal + '</h4><p style="font-size:11px">' + esc(numInfo(des.principal === 0 ? r.final : (des.principal || r.final)).luz) + '<br><span class="muted">Tu “m\u00FAsculo” a entrenar: el desaf\u00EDo principal (' + des.principal + ') marca d\u00F3nde la vida te pide crecer.</span></p></div>' +
    '<div class="help-card"><h4>\uD83C\uDFD4\uFE0F Pin\u00E1culos ' + pin.join(' · ') + '</h4><p style="font-size:11px">4 cimas de ~9 a\u00F1os: <b>' + pin[0] + '</b> (juventud) \u2192 <b>' + pin[1] + '</b> \u2192 <b>' + pin[2] + '</b> (cosecha mayor) \u2192 <b>' + pin[3] + '</b> (sabidur\u00EDa). Lee cada n\u00FAmero arriba como clima de esa etapa.</p></div></div>';
  if (destN != null) {
    h += '<div class="menstrual-card" style="margin-top:10px"><h4>\uD83C\uDF1F Madurez: ' + mad + ' · ' + esc(numInfo(mad).nombre) + '</h4>' +
      '<p class="muted" style="font-size:11px">Camino ' + r.final + ' + Destino ' + destN + ' = ' + mad + '. Florece con los a\u00F1os: tu “segundo aire”.</p></div>';
  } else {
    h += '<p class="muted" style="font-size:11px;margin-top:8px">Escribe tu nombre arriba para ver tambi\u00E9n tu <b>Madurez</b> (Camino + Destino).</p>';
  }
  var ap = anoPersonal(key, todayKey()), mp = mesPersonal(ap, todayKey()), dp = diaPersonal(ap, mp, todayKey());
  h += '<div class="menstrual-card" style="margin-top:10px;background:var(--panel)"><h4>\uD83C\uDF19 Hoy para este mapa (' + esc(todayKey()) + ' ' + esc(lunaTxt(todayKey())) + ')</h4>' +
    '<p style="font-size:12px">A\u00F1o personal <b>' + ap + '</b> · Mes <b>' + mp + '</b> · D\u00EDa <b>' + dp + '</b> — ' + esc(CICLO_INFO[dp].t) + ': ' + esc(CICLO_INFO[dp].d) + '</p></div>';
  return h;
}
function nombreHTML(nombre) {
  var an = analizarNombre(nombre);
  if (!an.nLetras) return '<p class="muted">Escribe tu nombre completo.</p>';
  var det = an.letras.map(function (o) { return esc(o.l) + '=' + o.v; }).join(' · ');
  var h = cardNum(an.dest.final, '<p class="muted" style="font-size:11px">Destino / Expresi\u00F3n: total ' + an.total + ' \u2192 <b>' + pasosTxt(an.dest.pasos) + '</b></p>');
  h += '<div class="help-grid" style="margin-top:10px">' +
    '<div class="help-card"><h4>\uD83D\uDC96 Alma ' + an.alma.final + ' · ' + esc(numInfo(an.alma.final).nombre) + '</h4><p style="font-size:11px">Vocales \u2192 <b>' + pasosTxt(an.alma.pasos) + '</b><br>' + esc(numInfo(an.alma.final).luz) + '</p></div>' +
    '<div class="help-card"><h4>\uD83C\uDFAD Personalidad ' + an.pers.final + ' · ' + esc(numInfo(an.pers.final).nombre) + '</h4><p style="font-size:11px">Consonantes \u2192 <b>' + pasosTxt(an.pers.pasos) + '</b><br>' + esc(numInfo(an.pers.final).luz) + '</p></div>' +
    '<div class="help-card"><h4>\u2696\uFE0F Equilibrio ' + an.equil.final + '</h4><p style="font-size:11px">Iniciales \u2192 <b>' + pasosTxt(an.equil.pasos) + '</b><br><span class="muted">Tu recurso bajo presi\u00F3n. L\u00E9elo como n\u00FAmero gu\u00EDa arriba.</span></p></div>' +
    '<div class="help-card"><h4>\uD83D\uDD21 Primera letra: ' + esc(an.primeraLetra || '—') + '</h4><p style="font-size:11px"><span class="muted">Color de entrada: c\u00F3mo abres caminos. Letras: ' + an.nLetras + '.</span></p></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>\uD83D\uDD24 Letra por letra</h4><p class="muted" style="font-size:11px;line-height:1.8">' + det + '</p></div>';
  return h;
}
function cicloHTML(nac, ver) {
  var ap = anoPersonal(nac, ver), mp = mesPersonal(ap, ver), dp = diaPersonal(ap, mp, ver);
  if (ap == null) return '<p class="muted">Escribe tu fecha de nacimiento.</p>';
  function cbox(label, n, extra) {
    var c = CICLO_INFO[n];
    return '<div class="help-card"><h4>' + label + ' ' + n + ' · ' + esc(c.t) + '</h4><p style="font-size:11px">' + esc(c.d) + (extra || '') + '</p></div>';
  }
  var h = '<div class="help-grid">' +
    cbox('\uD83D\uDCC5 A\u00F1o personal', ap, '') +
    cbox('\uD83D\uDCC6 Mes personal', mp, '') +
    cbox('\u2600\uFE0F D\u00EDa personal', dp, '<br><span class="muted">' + esc(lunaTxt(ver)) + '</span>') + '</div>';
  h += cardNum(ap, '<p class="muted" style="font-size:11px">Clima del a\u00F1o: ' + esc(CICLO_INFO[ap].d) + '</p>');
  return h;
}
function cicloYearHTML(nac, verYear) {
  var y = +String(verYear || (todayKey().split('-')[0])) || new Date().getFullYear();
  var h = '<div class="menstrual-card"><h4>\uD83D\uDCC5 Mapa mes a mes · ' + y + '</h4><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">';
  var ap = anoPersonal(nac, y + '-06-15');
  for (var m = 1; m <= 12; m++) {
    var key = y + '-' + String(m).padStart(2, '0') + '-15';
    var mp = mesPersonal(ap, key);
    h += '<span class="chip" title="' + esc(CICLO_INFO[mp].t) + '">M' + m + ': ' + mp + '</span>';
  }
  h += '</div><p class="muted" style="font-size:10px;margin-top:6px">Toca tu mes en el calendario y compara con tu Mes personal: meses 1/8 para lanzar y cobrar, 2/7 para cuidar y estudiar, 9 para cerrar.</p></div>';
  return h;
}

/* ---------- registros ---------- */
function renderPerfiles() {
  var box = $('numPerfList');
  if (!box) return;
  var s = store();
  if (!s.perfiles.length) { box.innerHTML = '<p class="muted" style="font-size:11px">A\u00FAn sin perfiles. Guarda el tuyo arriba.</p>'; return; }
  box.innerHTML = s.perfiles.map(function (p) {
    var cv = caminoDeVida(p.nac);
    var n = cv ? cv.r.final : '?';
    var an = p.nombre ? analizarNombre(p.nombreFull || p.nombre) : null;
    var d = (an && an.nLetras) ? ' · Dest ' + an.dest.final : '';
    return '<div class="habit-row"><span><b>' + esc(p.nombre) + '</b> <span class="muted">· ' + esc(p.nac || '') + ' · Camino ' + n + d + '</span></span>' +
      '<span style="display:flex;gap:6px"><button class="btn" style="width:auto" data-ver="' + p.id + '">Ver</button>' +
      '<button class="btn" style="width:auto" data-del="' + p.id + '">\uD83D\uDDD1</button></span></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) {
    b.onclick = function () {
      var s2 = store();
      s2.perfiles = s2.perfiles.filter(function (x) { return x.id !== b.dataset.del; });
      save(); renderPerfiles();
    };
  });
  box.querySelectorAll('[data-ver]').forEach(function (b) {
    b.onclick = function () {
      var s2 = store();
      var p = s2.perfiles.filter(function (x) { return x.id === b.dataset.ver; })[0];
      if (!p) return;
      if ($('numNac')) $('numNac').value = p.nac || '';
      if ($('numNacNombre')) $('numNacNombre').value = p.nombreFull || p.nombre || '';
      if ($('numCicloNac')) $('numCicloNac').value = p.nac || '';
      if ($('numNombreIn')) $('numNombreIn').value = p.nombreFull || p.nombre || '';
      switchTab('Vida');
      calcVida();
    };
  });
}
function renderHist() {
  var box = $('numHistList'), st = $('numHistStats');
  if (!box) return;
  var s = store();
  if (!s.calcs.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin c\u00E1lculos a\u00FAn. Calcula tu Camino de Vida o tu nombre.</p>'; if (st) st.textContent = ''; return; }
  box.innerHTML = s.calcs.slice(0, 30).map(function (c) {
    return '<div class="habit-row"><span style="font-size:11px"><b>' + esc(c.fecha) + '</b> · ' + esc(c.txt) + '</span></div>';
  }).join('');
  if (st) st.textContent = s.calcs.length + ' c\u00E1lculos guardados (local)';
}
function renderDiario() {
  var box = $('numDiaList');
  if (!box) return;
  var s = store();
  var ks = Object.keys(s.diario || {}).sort().reverse().slice(0, 30);
  if (!ks.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin notas. Escribe tu primera l\u00EDnea.</p>'; return; }
  box.innerHTML = ks.map(function (k) {
    return '<div class="habit-row"><span style="font-size:11px"><b>' + esc(k) + '</b> ' + esc(lunaTxt(k)) + '<br>' + esc(s.diario[k]) + '</span>' +
      '<button class="btn" style="width:auto" data-k="' + esc(k) + '">\uD83D\uDDD1</button></div>';
  }).join('');
  box.querySelectorAll('[data-k]').forEach(function (b) {
    b.onclick = function () {
      var s2 = store();
      delete s2.diario[b.dataset.k];
      save(); renderDiario();
    };
  });
}

/* ---------- acciones ---------- */
function calcVida() {
  var key = ($('numNac') && $('numNac').value) || '';
  var nom = ($('numNacNombre') && $('numNacNombre').value) || '';
  if (!key) { if ($('numVidaOut')) $('numVidaOut').innerHTML = '<p class="muted">Elige tu fecha de nacimiento para calcular.</p>'; return; }
  var html = vidaHTML(key, nom);
  if ($('numVidaOut')) $('numVidaOut').innerHTML = html;
  var cv = caminoDeVida(key);
  if (cv) pushHist('Camino ' + cv.r.final + ' (' + key + (nom ? ' · ' + nom : '') + ')');
  renderHist();
  if ($('numVidaLuna')) $('numVidaLuna').textContent = 'Hoy: ' + todayKey() + ' · ' + lunaTxt(todayKey());
}
function calcNombre() {
  var nom = ($('numNombreIn') && $('numNombreIn').value) || '';
  if ($('numNombreOut')) $('numNombreOut').innerHTML = nombreHTML(nom);
  var an = analizarNombre(nom);
  if (an.nLetras) pushHist('Nombre: Dest ' + an.dest.final + ' · Alma ' + an.alma.final + ' · Pers ' + an.pers.final + ' (' + nom.slice(0, 40) + ')');
  renderHist();
}
function calcCiclo() {
  var nac = ($('numCicloNac') && $('numCicloNac').value) || '';
  var ver = ($('numCicloFecha') && $('numCicloFecha').value) || todayKey();
  if ($('numCicloOut')) $('numCicloOut').innerHTML = cicloHTML(nac, ver);
  if ($('numCicloYear')) $('numCicloYear').innerHTML = cicloYearHTML(nac, String(ver).split('-')[0]);
  if ($('numCicloLuna')) $('numCicloLuna').textContent = 'Viendo: ' + ver + ' · ' + lunaTxt(ver);
  var ap = anoPersonal(nac, ver);
  if (ap != null) { var mp = mesPersonal(ap, ver), dp = diaPersonal(ap, mp, ver); pushHist('Ciclos ' + ver + ': A' + ap + ' M' + mp + ' D' + dp); renderHist(); }
}
function calcCompat() {
  var out = $('numCompatOut');
  var n1 = +(($('numCompN1') || {}).value || 0), n2 = +(($('numCompN2') || {}).value || 0);
  var a = ($('numCompA') || {}).value || '', b = ($('numCompB') || {}).value || '';
  if (a) { var ca = caminoDeVida(a); if (ca) n1 = ca.r.final; }
  if (b) { var cb = caminoDeVida(b); if (cb) n2 = cb.r.final; }
  if (!n1 || !n2) { if (out) out.innerHTML = '<p class="muted">Escribe las dos fechas o los dos Caminos.</p>'; return; }
  var lec = compatLectura(n1, n2);
  var h = '<div class="fishing-grid"><div>' + cardNum(n1, '<p class="muted" style="font-size:11px">Persona 1 · Camino ' + n1 + '</p>') + '</div>' +
    '<div>' + cardNum(n2, '<p class="muted" style="font-size:11px">Persona 2 · Camino ' + n2 + '</p>') + '</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4 style="color:var(--gold)">\uD83D\uDC9E Suma del v\u00EDnculo: ' + lec.suma + '</h4>' +
    '<p style="font-size:12px;line-height:1.6">' + esc(lec.texto) + '</p>' +
    '<p class="muted" style="font-size:11px">Consejo pr\u00E1ctico: 1-4-8 pacten dinero y tareas por escrito · 2-6-9 hablen culpa y l\u00EDmites sin pelear · 3-5-7 agenden juego + silencio a solas. Si hay maestro (11/22/33), el v\u00EDnculo pide m\u00E1s verdad y m\u00E1s calma.</p></div>';
  if (out) out.innerHTML = h;
  pushHist('Compat ' + n1 + ' + ' + n2 + ' = ' + lec.suma);
  renderHist();
}
function toDayNote(txt) {
  try {
    var info = (typeof todayInfo === 'function') ? todayInfo() : null;
    if (!info) return alert('No se pudo ubicar hoy');
    var note = String(txt || '').slice(0, 280);
    if (!note) return alert('Calcula primero');
    if (info.luna === 'dft') { var c = cyc(currentCycleYear()); c.dft.nota = (c.dft.nota ? c.dft.nota + '\n' : '') + note; }
    else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + note; }
    save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
    alert('Llevado a la nota de hoy \u2713');
  } catch (e2) { alert('No se pudo llevar a la nota'); }
}

/* ---------- setup ---------- */
function setup() {
  buildDialog();

  // defaults
  try {
    if ($('numCicloFecha') && !$('numCicloFecha').value) $('numCicloFecha').value = todayKey();
    if ($('numDiaFecha') && !$('numDiaFecha').value) $('numDiaFecha').value = todayKey();
  } catch (e) {}

  ['Guia', 'Vida', 'Nombre', 'Ciclos', 'Compat', 'Reg'].forEach(function (t) {
    var b = $('tabNum' + t);
    if (b) b.onclick = function () { switchTab(t); };
  });

  var cv = $('numCalcVida'); if (cv) cv.onclick = calcVida;
  var cn = $('numCalcNombre'); if (cn) cn.onclick = calcNombre;
  var cc = $('numCalcCiclo'); if (cc) cc.onclick = calcCiclo;
  var cx = $('numCalcCompat'); if (cx) cx.onclick = calcCompat;
  var ch = $('numCicloHoy');
  if (ch) ch.onclick = function () { if ($('numCicloFecha')) $('numCicloFecha').value = todayKey(); calcCiclo(); };
  var ctn = $('numCicloToNote');
  if (ctn) ctn.onclick = function () {
    var nac = ($('numCicloNac') || {}).value || '', ver = ($('numCicloFecha') || {}).value || todayKey();
    var ap = anoPersonal(nac, ver);
    if (ap == null) return alert('Escribe tu nacimiento primero');
    var mp = mesPersonal(ap, ver), dp = diaPersonal(ap, mp, ver);
    toDayNote('\uD83D\uDD22 Ciclos ' + ver + ': A' + ap + ' M' + mp + ' D' + dp + ' (' + CICLO_INFO[dp].t + ') ' + lunaTxt(ver));
  };
  var sp = $('numSavePerfil');
  if (sp) sp.onclick = function () {
    var nac = ($('numNac') || {}).value || '';
    var nom = clean((($('numNacNombre') || {}).value || '').trim(), 80);
    if (!nac) return alert('Elige fecha de nacimiento primero');
    var s = store();
    s.perfiles.unshift({ id: uid('np'), nombre: nom || ('Perfil ' + nac), nombreFull: nom, nac: nac });
    if (s.perfiles.length > 40) s.perfiles.length = 40;
    save('Perfil guardado \u2713'); renderPerfiles();
  };
  var ntp = $('numNombreToPerfil');
  if (ntp) ntp.onclick = function () {
    var nom = clean((($('numNombreIn') || {}).value || '').trim(), 80);
    if (!nom) return alert('Escribe un nombre primero');
    var s = store();
    s.perfiles.unshift({ id: uid('np'), nombre: nom.split(' ').slice(0, 2).join(' '), nombreFull: nom, nac: ($('numNac') || {}).value || '' });
    if (s.perfiles.length > 40) s.perfiles.length = 40;
    save('Perfil guardado \u2713'); renderPerfiles();
  };
  var pa = $('numPerfAdd');
  if (pa) pa.onclick = function () {
    var nom = clean((($('numPerfNombre') || {}).value || '').trim(), 60);
    var nac = ($('numPerfNac') || {}).value || '';
    if (!nom || !nac) return alert('Nombre + nacimiento para guardar');
    var s = store();
    s.perfiles.unshift({ id: uid('np'), nombre: nom, nombreFull: nom, nac: nac });
    if (s.perfiles.length > 40) s.perfiles.length = 40;
    save('Perfil guardado \u2713');
    if ($('numPerfNombre')) $('numPerfNombre').value = '';
    renderPerfiles();
  };
  var da = $('numDiaAdd');
  if (da) da.onclick = function () {
    var k = ($('numDiaFecha') || {}).value || todayKey();
    var txt = clean((($('numDiaTxt') || {}).value || '').trim(), 200);
    if (!txt) return alert('Escribe tu nota primero');
    var s = store();
    s.diario[k] = txt;
    save('Guardado \u2713'); if ($('numDiaTxt')) $('numDiaTxt').value = '';
    renderDiario();
  };
  var dtn = $('numDiaToNote');
  if (dtn) dtn.onclick = function () {
    var txt = (($('numDiaTxt') || {}).value || '').trim();
    if (!txt) { var k = ($('numDiaFecha') || {}).value || todayKey(); txt = (store().diario[k] || ''); }
    toDayNote('\uD83D\uDD22 ' + txt);
  };
  var hs = $('numHistShare');
  if (hs) hs.onclick = async function () {
    var s = store();
    var txt = s.calcs.slice(0, 10).map(function (c) { return c.fecha + ' · ' + c.txt; }).join('\n');
    await share('Mi Numerolog\u00EDa', txt || 'Sin c\u00E1lculos a\u00FAn');
  };
  var hc = $('numHistClear');
  if (hc) hc.onclick = function () {
    if (!confirm('\u00BFBorrar historial de c\u00E1lculos? (perfiles y diario se conservan)')) return;
    store().calcs = []; save(); renderHist();
  };

  renderPerfiles(); renderHist(); renderDiario();

  var b = $('btnNumerologia');
  if (b) b.onclick = function () {
    switchTab('Guia');
    try {
      var last = store().calcs[0];
      if (last && $('numVidaOut') && !$('numVidaOut').innerHTML) { /* deja guia primero */ }
    } catch (e) {}
    openDlg('numerologiaDialog');
  };

  try {
    if (typeof window !== 'undefined') {
      window.Numerologia = window.Numerologia || {};
      window.Numerologia.open = function (tab) { try { switchTab(tab || 'Guia'); openDlg('numerologiaDialog'); } catch (e) {} };
      window.Numerologia.camino = caminoDeVida;
      window.Numerologia.nombre = analizarNombre;
      window.Numerologia.anoPersonal = anoPersonal;
    }
  } catch (eW) {}
}

var _init = 0;
function init() {
  _init++;
  if (!document.querySelector('.action-group[data-group]') || !$('btnNumerologia')) {
    if (_init < 60) setTimeout(init, 500);
    return;
  }
  try { setup(); } catch (e) {}
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 450); });
else setTimeout(init, 450);

})();
