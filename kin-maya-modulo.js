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
  function store(key, def) {
    try {
      var u = (typeof userData === 'function') ? userData() : null;
      if (!u) return def;
      if (u[key] === undefined) u[key] = def;
      return u[key];
    } catch (e) { return def; }
  }
  function save(msg) {
    try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {}
  }
  function lunaDeFecha(key) {
    try {
      if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return { y: r.y, luna: r.luna, dia: r.diaN }; }
    } catch (e) {}
    try {
      if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return { y: null, luna: m.luna, dia: m.dia }; }
    } catch (e) {}
    return null;
  }
  function lunaTxt(key) {
    var l = lunaDeFecha(key);
    return l ? ('Luna ' + l.luna + ' · dia ' + l.dia) : '';
  }
  async function share(title, text) {
    try {
      if (typeof shareText === 'function') return await shareText(title, text);
      if (navigator.share) return await navigator.share({ title: title, text: text });
      await navigator.clipboard.writeText(title + '\n' + text);
      alert('Copiado al portapapeles');
    } catch (e) { try { alert(text); } catch (e2) {} }
  }
  function addKw(id, extra) {
    try { var b = $(id); if (b && b.dataset && b.dataset.keywords && b.dataset.keywords.indexOf(extra.split(' ')[0]) < 0) b.dataset.keywords += ' ' + extra; } catch (e) {}
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
  function switchTab(prefix, name, tabs) {
    tabs.forEach(function (t) {
      var p = $(prefix + t), b = $('tab' + prefix.charAt(0).toUpperCase() + prefix.slice(1) + t);
      if (p) p.classList.toggle('hidden', t !== name);
      if (b) b.classList.toggle('btn-accent', t === name);
    });
  }

  // Sellos canónicos Dreamspell (Argüelles): color rota Rojo-Blanco-Azul-Amarillo.
  // Rojo=Este(inicia) Blanco=Norte(refina) Azul=Oeste(transforma) Amarillo=Sur(madura).
  // Familia terrestre canónica: Cardinal, Central, Señal, Portal, Polar.
  var SELLOS = [
    { n: 'Dragón', maya: 'Imix', num: 1, colorNombre: 'Rojo', color: '#e53935', direccion: 'Este', raza: 'Roja · Iniciadores', familia: 'Cardinal', poder: 'Nacimiento', cualidad: 'Nacimiento, nutrición, existencia', keywords: 'inicio nutrir vida nacimiento dragon imix', desc: 'El primer sello. Nacimiento, nutrición y existencia pura. Inicia todo ciclo: la fuerza que trae la vida al mundo.' },
    { n: 'Viento', maya: 'Ik', num: 2, colorNombre: 'Blanco', color: '#eceff1', direccion: 'Norte', raza: 'Blanca · Refinadores', familia: 'Central', poder: 'Espíritu', cualidad: 'Aliento, comunicación, espíritu', keywords: 'comunicacion aliento espiritu viento ik', desc: 'El aliento de vida. Comunicación, movimiento y conexión con el espíritu.' },
    { n: 'Noche', maya: 'Akbal', num: 3, colorNombre: 'Azul', color: '#1e88e5', direccion: 'Oeste', raza: 'Azul · Transformadores', familia: 'Señal', poder: 'Abundancia', cualidad: 'Sueño, intuición, abundancia', keywords: 'sueno intuicion abundancia noche akbal', desc: 'La noche que todo lo cubre. Intuición, sueño y abundancia: nutre en la oscuridad.' },
    { n: 'Semilla', maya: 'Kan', num: 4, colorNombre: 'Amarillo', color: '#fdd835', direccion: 'Sur', raza: 'Amarilla · Maduradores', familia: 'Portal', poder: 'Florecimiento', cualidad: 'Crecimiento, dirección, floración', keywords: 'crecimiento direccion semilla kan', desc: 'La semilla con todo el potencial. Crecimiento, dirección y propósito.' },
    { n: 'Serpiente', maya: 'Chicchan', num: 5, colorNombre: 'Rojo', color: '#e53935', direccion: 'Este', raza: 'Roja · Iniciadores', familia: 'Polar', poder: 'Fuerza vital', cualidad: 'Vida, sexualidad, kundalini', keywords: 'vitalidad pasion serpiente chicchan', desc: 'La fuerza vital. Sexualidad, kundalini y energía de vida en espiral.' },
    { n: 'Enlazador de Mundos', maya: 'Cimi', num: 6, colorNombre: 'Blanco', color: '#eceff1', direccion: 'Norte', raza: 'Blanca · Refinadores', familia: 'Cardinal', poder: 'Muerte', cualidad: 'Conexión, puente, igualdad', keywords: 'conexion puente enlazador cimi muerte', desc: 'El que enlaza mundos. Puentes entre personas y dimensiones; iguala y armoniza.' },
    { n: 'Mano', maya: 'Manik', num: 7, colorNombre: 'Azul', color: '#1e88e5', direccion: 'Oeste', raza: 'Azul · Transformadores', familia: 'Central', poder: 'Realización', cualidad: 'Curación, acción, realización', keywords: 'curacion accion mano manik', desc: 'La mano que sana. Curación y realización a través del tacto y la acción.' },
    { n: 'Estrella', maya: 'Lamat', num: 8, colorNombre: 'Amarillo', color: '#fdd835', direccion: 'Sur', raza: 'Amarilla · Maduradores', familia: 'Señal', poder: 'Belleza', cualidad: 'Arte, belleza, elegancia', keywords: 'arte belleza estrella lamat', desc: 'La estrella que brilla. Arte, belleza y elegancia que elevan el espíritu.' },
    { n: 'Luna', maya: 'Muluc', num: 9, colorNombre: 'Rojo', color: '#e53935', direccion: 'Este', raza: 'Roja · Iniciadores', familia: 'Portal', poder: 'Agua universal', cualidad: 'Polaridad, flujo, purificación', keywords: 'flujo purificacion luna muluc', desc: 'La luna que refleja. Flujo, polaridad y purificación que limpia y renueva.' },
    { n: 'Perro', maya: 'Oc', num: 10, colorNombre: 'Blanco', color: '#eceff1', direccion: 'Norte', raza: 'Blanca · Refinadores', familia: 'Polar', poder: 'Corazón', cualidad: 'Amor, lealtad, corazón', keywords: 'amor lealtad perro oc', desc: 'El perro fiel. Amor incondicional, lealtad y corazón.' },
    { n: 'Mono', maya: 'Chuen', num: 11, colorNombre: 'Azul', color: '#1e88e5', direccion: 'Oeste', raza: 'Azul · Transformadores', familia: 'Cardinal', poder: 'Magia', cualidad: 'Juego, magia, ilusión', keywords: 'juego creatividad mono chuen', desc: 'El mono juguetón. Juego y magia: crea realidades con la imaginación.' },
    { n: 'Humano', maya: 'Eb', num: 12, colorNombre: 'Amarillo', color: '#fdd835', direccion: 'Sur', raza: 'Amarilla · Maduradores', familia: 'Central', poder: 'Libre albedrío', cualidad: 'Libre albedrío, influencia, sabiduría', keywords: 'libre albedrio humano eb', desc: 'El humano sabio. Libre albedrío, influencia y sabiduría: elige y guía.' },
    { n: 'Caminante del Cielo', maya: 'Ben', num: 13, colorNombre: 'Rojo', color: '#e53935', direccion: 'Este', raza: 'Roja · Iniciadores', familia: 'Señal', poder: 'Espacio', cualidad: 'Exploración, espacio, evolución', keywords: 'exploracion evolucion caminante ben', desc: 'El caminante del cielo. Explora el espacio y expande los límites.' },
    { n: 'Mago', maya: 'Ix', num: 14, colorNombre: 'Blanco', color: '#eceff1', direccion: 'Norte', raza: 'Blanca · Refinadores', familia: 'Portal', poder: 'Atemporalidad', cualidad: 'Atemporalidad, magia, encantamiento', keywords: 'magia atemporal mago ix', desc: 'El mago atemporal. Magia y encantamiento que trascienden el tiempo.' },
    { n: 'Águila', maya: 'Men', num: 15, colorNombre: 'Azul', color: '#1e88e5', direccion: 'Oeste', raza: 'Azul · Transformadores', familia: 'Polar', poder: 'Visión', cualidad: 'Visión, mente, trascendencia', keywords: 'vision trascendencia aguila men', desc: 'El águila que todo lo ve. Visión y mente que trascienden lo evidente.' },
    { n: 'Guerrero', maya: 'Cib', num: 16, colorNombre: 'Amarillo', color: '#fdd835', direccion: 'Sur', raza: 'Amarilla · Maduradores', familia: 'Cardinal', poder: 'Inteligencia', cualidad: 'Valentía, intrepidez, cuestionamiento', keywords: 'valentia coraje guerrero cib', desc: 'El guerrero valiente. Intrepidez y cuestionamiento ante los desafíos.' },
    { n: 'Tierra', maya: 'Caban', num: 17, colorNombre: 'Rojo', color: '#e53935', direccion: 'Este', raza: 'Roja · Iniciadores', familia: 'Central', poder: 'Navegación', cualidad: 'Navegación, sincronía, evolución', keywords: 'navegacion evolucion tierra caban', desc: 'La tierra que navega. Sincronía y evolución que guían el cambio.' },
    { n: 'Espejo', maya: 'Etznab', num: 18, colorNombre: 'Blanco', color: '#eceff1', direccion: 'Norte', raza: 'Blanca · Refinadores', familia: 'Señal', poder: 'Sin fin', cualidad: 'Reflexión, orden, infinito', keywords: 'reflexion orden espejo etznab', desc: 'El espejo que refleja. Orden y verdad sin fin.' },
    { n: 'Tormenta', maya: 'Cauac', num: 19, colorNombre: 'Azul', color: '#1e88e5', direccion: 'Oeste', raza: 'Azul · Transformadores', familia: 'Portal', poder: 'Autogeneración', cualidad: 'Transformación, catarsis, energía', keywords: 'transformacion energia tormenta cauac', desc: 'La tormenta que transforma. Catarsis y energía que renuevan.' },
    { n: 'Sol', maya: 'Ahau', num: 20, colorNombre: 'Amarillo', color: '#fdd835', direccion: 'Sur', raza: 'Amarilla · Maduradores', familia: 'Polar', poder: 'Fuego universal', cualidad: 'Iluminación, vida, fuego universal', keywords: 'iluminacion vida sol ahau', desc: 'El sol que ilumina. Vida y fuego universal para todo lo existente.' }
  ];

  // Tonos galácticos canónicos: nombre + poder (verbo) + acción (propósito).
  var TONOS = [
    { num: 1, nombre: 'Magnético', poder: 'Atrae', accion: 'Propósito', color: '#e53935', desc: 'Tono 1 Magnético: atrae el propósito, unifica e inicia. Define la meta de la onda.', keywords: 'magnetico proposito atrae inicio' },
    { num: 2, nombre: 'Lunar', poder: 'Estabiliza', accion: 'Desafío', color: '#eceff1', desc: 'Tono 2 Lunar: estabiliza el desafío, polariza. Muestra el obstáculo a trascender.', keywords: 'lunar desafio polariza dualidad' },
    { num: 3, nombre: 'Eléctrico', poder: 'Vincula', accion: 'Servicio', color: '#1e88e5', desc: 'Tono 3 Eléctrico: vincula el servicio, activa el movimiento.', keywords: 'electrico servicio activa movimiento' },
    { num: 4, nombre: 'Autoexistente', poder: 'Mide', accion: 'Forma', color: '#fdd835', desc: 'Tono 4 Autoexistente: mide la forma, define la estructura.', keywords: 'autoexistente forma estructura' },
    { num: 5, nombre: 'Entonado', poder: 'Guía', accion: 'Radiación', color: '#e53935', desc: 'Tono 5 Entonado: guía la radiación, potencia y manda la energía hacia afuera.', keywords: 'entonado radiacion poder' },
    { num: 6, nombre: 'Rítmico', poder: 'Equilibra', accion: 'Igualdad', color: '#eceff1', desc: 'Tono 6 Rítmico: equilibra la igualdad, organiza el ritmo.', keywords: 'ritmico igualdad ritmo equilibrio' },
    { num: 7, nombre: 'Resonante', poder: 'Armoniza', accion: 'Armonización', color: '#1e88e5', desc: 'Tono 7 Resonante: armoniza, canaliza e inspira la sintonía con el todo.', keywords: 'resonante armonia sintonia' },
    { num: 8, nombre: 'Galáctico', poder: 'Modela', accion: 'Integridad', color: '#fdd835', desc: 'Tono 8 Galáctico: modela la integridad, demuestra con el ejemplo.', keywords: 'galactico integridad modelo' },
    { num: 9, nombre: 'Solar', poder: 'Realiza', accion: 'Realización', color: '#e53935', desc: 'Tono 9 Solar: realiza con intención, pulsa hacia la meta.', keywords: 'solar realizacion intencion' },
    { num: 10, nombre: 'Planetario', poder: 'Produce', accion: 'Manifestación', color: '#eceff1', desc: 'Tono 10 Planetario: produce la manifestación, perfecciona lo iniciado.', keywords: 'planetario manifestacion perfeccion' },
    { num: 11, nombre: 'Espectral', poder: 'Divulga', accion: 'Liberación', color: '#1e88e5', desc: 'Tono 11 Espectral: divulga la liberación, disuelve lo que ya no sirve.', keywords: 'espectral liberacion disuelve' },
    { num: 12, nombre: 'Cristal', poder: 'Universaliza', accion: 'Cooperación', color: '#fdd835', desc: 'Tono 12 Cristal: universaliza la cooperación, dedica en comunidad.', keywords: 'cristal cooperacion comunidad' },
    { num: 13, nombre: 'Cósmico', poder: 'Trasciende', accion: 'Presencia', color: '#e53935', desc: 'Tono 13 Cósmico: trasciende en presencia, perdura más allá.', keywords: 'cosmico presencia trasciende' }
  ];

  // 5 Familias Terrestres canónicas (4 sellos c/u, uno de cada color).
  var FAMILIAS = [
    { nombre: 'Polar', mision: 'Tocan los cromáticos', color: '#1e88e5', sellos: [5, 10, 15, 20], desc: 'Familia Polar: Serpiente, Perro, Águila y Sol. Tocan los cromáticos, reciben por el chakra coronario.', keywords: 'polar cromaticos serpiente perro aguila sol' },
    { nombre: 'Cardinal', mision: 'Establecen el génesis', color: '#e53935', sellos: [1, 6, 11, 16], desc: 'Familia Cardinal: Dragón, Enlazador de Mundos, Mono y Guerrero. Establecen el génesis, transmiten en experiencias.', keywords: 'cardinal genesis dragon enlazador mono guerrero' },
    { nombre: 'Central', mision: 'Cavan los túneles', color: '#eceff1', sellos: [2, 7, 12, 17], desc: 'Familia Central: Viento, Mano, Humano y Tierra. Cavan los túneles del tiempo, chakra cardíaco.', keywords: 'central tuneles viento mano humano tierra' },
    { nombre: 'Señal', mision: 'Descifran el misterio', color: '#fdd835', sellos: [3, 8, 13, 18], desc: 'Familia Señal: Noche, Estrella, Caminante del Cielo y Espejo. Descifran el misterio, guían el retorno.', keywords: 'senal misterio noche estrella caminante espejo' },
    { nombre: 'Portal', mision: 'Abren los portales', color: '#43a047', sellos: [4, 9, 14, 19], desc: 'Familia Portal: Semilla, Luna, Mago y Tormenta. Abren los portales de la evolución.', keywords: 'portal semilla luna mago tormenta' }
  ];

  var CASTILLOS = [
    { num: 1, nombre: 'Rojo Este del Girar', color: '#e53935', desde: 1, hasta: 52, desc: 'Castillo 1 (kin 1-52): corte del nacimiento. Ondas del Dragón, Mago, Mano y Sol.' },
    { num: 2, nombre: 'Blanco Norte del Cruzar', color: '#eceff1', desde: 53, hasta: 104, desc: 'Castillo 2 (kin 53-104): corte de la muerte. Ondas del Caminante, Enlazador, Tormenta y Humano.' },
    { num: 3, nombre: 'Azul Oeste del Quemar', color: '#1e88e5', desde: 105, hasta: 156, desc: 'Castillo 3 (kin 105-156): corte de la magia. Ondas de la Serpiente, Espejo, Mono y Semilla.' },
    { num: 4, nombre: 'Amarillo Sur del Dar', color: '#fdd835', desde: 157, hasta: 208, desc: 'Castillo 4 (kin 157-208): corte de la inteligencia. Ondas de la Tierra, Perro, Noche y Estrella.' },
    { num: 5, nombre: 'Verde Central del Encantar', color: '#43a047', desde: 209, hasta: 260, desc: 'Castillo 5 (kin 209-260): corte del encantar. Ondas de la Luna, Viento, Águila y Guerrero.' }
  ];

  var ONDAS = ['Dragón', 'Mago', 'Mano', 'Sol', 'Caminante del Cielo', 'Enlazador de Mundos', 'Tormenta', 'Humano', 'Serpiente', 'Espejo', 'Mono', 'Semilla', 'Tierra', 'Perro', 'Noche', 'Estrella', 'Luna', 'Viento', 'Águila', 'Guerrero'];

  var COLORES = [
    { nombre: 'Rojo', color: '#e76e8a', desc: 'El color del nacimiento, la sangre, la vida. Representa el inicio y la fuerza vital.', keywords: 'nacimiento sangre vida' },
    { nombre: 'Blanco', color: '#7ab8ff', desc: 'El color del espíritu, la pureza, la claridad. Representa la conexión con lo divino.', keywords: 'espíritu pureza claridad' },
    { nombre: 'Azul', color: '#c9a9c9', desc: 'El color del cielo, el agua, la intuición. Representa la emoción y la profundidad.', keywords: 'cielo agua intuición' },
    { nombre: 'Amarillo', color: '#8fd694', desc: 'El color del sol, la luz, la mente. Representa la iluminación y el poder.', keywords: 'sol luz mente' }
  ];

  var DIRECCIONES = [
    { nombre: 'Norte', color: '#7ab8ff', desc: 'La dirección del espíritu, la sabiduría, el invierno. Conecta con la comunicación y el aliento.', keywords: 'espíritu sabiduría invierno' },
    { nombre: 'Sur', color: '#c9a9c9', desc: 'La dirección del agua, la emoción, el verano. Conecta con la intuición y los sueños.', keywords: 'agua emoción verano' },
    { nombre: 'Este', color: '#8fd694', desc: 'La dirección del fuego, la acción, la primavera. Conecta con el crecimiento y la dirección.', keywords: 'fuego acción primavera' },
    { nombre: 'Oeste', color: '#e76e8a', desc: 'La dirección de la tierra, la estabilidad, el otoño. Conecta con la nutrición y la existencia.', keywords: 'tierra estabilidad otoño' }
  ];

  // Cálculo Dreamspell canónico (Fundación Ley del Tiempo / Argüelles):
  // - Referencia: 26-07-1987 = Kin 34 (Mago Galáctico Blanco, 8 Ix).
  //   Verificado: 26-07-2013 = Kin 164 y 21-12-2012 = Kin 207.
  // - 29 de febrero = 0.0 Hunab Ku: no tiene kin, no avanza la cuenta.
  // - Kin = ((33 + díasEfectivos) mod 260) + 1, donde díasEfectivos descuenta los 29-feb.
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0); }
  function parseYMD(fecha) {
    var parts = String(fecha || '').split('-');
    if (parts.length !== 3) return null;
    var y = parseInt(parts[0], 10), m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
    if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
    return { y: y, m: m, d: d, utc: Date.UTC(y, m - 1, d) };
  }
  function countFeb29ExclusiveToInclusive(fromUtc, toUtc) {
    // Cuenta 29-feb con fromUtc < feb29 <= toUtc (hacia adelante).
    var from = new Date(fromUtc), to = new Date(toUtc);
    var y0 = from.getUTCFullYear(), y1 = to.getUTCFullYear();
    var n = 0;
    for (var y = y0; y <= y1; y++) {
      if (!isLeap(y)) continue;
      var f = Date.UTC(y, 1, 29);
      if (f > fromUtc && f <= toUtc) n++;
    }
    return n;
  }
  function ondaDeKin(kin) { return Math.floor((kin - 1) / 13) + 1; }
  function castilloDeKin(kin) { return Math.floor((kin - 1) / 52) + 1; }
  function calcKinMaya(fecha) {
    var p = parseYMD(fecha);
    if (!p) return null;
    if (p.m === 2 && p.d === 29) {
      return { kin: 0, hunabKu: true, fecha: fecha, sello: null, tono: null,
        nota: '29 de febrero = 0.0 Hunab Ku: día fuera del conteo, sin kin. Se elige el kin del 28-feb o del 1-mar.' };
    }
    var epoch = Date.UTC(1987, 6, 26); // 26-07-1987 = Kin 34
    var diff = Math.round((p.utc - epoch) / 86400000);
    var eff;
    if (diff >= 0) eff = diff - countFeb29ExclusiveToInclusive(epoch, p.utc);
    else eff = diff + countFeb29ExclusiveToInclusive(p.utc, epoch);
    var kin0 = (((33 + eff) % 260) + 260) % 260;
    var kin = kin0 + 1;
    var sello = SELLOS[kin0 % 20];
    var tono = TONOS[kin0 % 13];
    var onda = ondaDeKin(kin);
    var castillo = castilloDeKin(kin);
    return {
      kin: kin, sello: sello, tono: tono, fecha: fecha,
      onda: onda, ondaSello: ONDAS[onda - 1],
      castillo: castillo, castilloNombre: CASTILLOS[castillo - 1].nombre
    };
  }
  try { if (typeof window !== 'undefined') window.calcKinMaya = calcKinMaya; } catch (e) {}

  // ---- Lectura ampliada: oráculo, onda natal, retorno galáctico ----
  var GAP_KINS = [1, 2, 20, 22, 23, 24, 39, 40, 41, 55, 56, 57, 72, 73, 74, 89, 90, 91, 105, 106, 107, 120, 121, 122, 135, 136, 137, 150, 151, 152, 165, 166, 167, 180, 181, 182, 195, 196, 197, 210, 211, 212, 225, 226, 227, 240, 241, 242, 257, 258, 259, 260];
  function esPortal(kin) { return GAP_KINS.indexOf(kin) >= 0; }
  function kinPorSelloTono(selloNum, tonoNum) {
    for (var n = 1; n <= 260; n++) {
      if (((n - 1) % 20) + 1 === selloNum && ((n - 1) % 13) + 1 === tonoNum) return n;
    }
    return null;
  }
  function selloGuia(selloNum, tonoNum) {
    var s = selloNum - 1, t = tonoNum;
    if (t === 1 || t === 6 || t === 11) return selloNum;
    if (t === 2 || t === 7 || t === 12) return ((s + 12) % 20) + 1;
    if (t === 3 || t === 8 || t === 13) return ((s + 4) % 20) + 1;
    if (t === 4 || t === 9) return ((s - 4 + 20) % 20) + 1;
    return ((s + 8) % 20) + 1; // t 5, 10
  }
  function oraculoDe(kinObj) {
    if (!kinObj || kinObj.hunabKu) return null;
    var S = kinObj.sello.num, T = kinObj.tono.num;
    var anaS = 19 - S; if (anaS <= 0) anaS += 20;
    var ocuS = 21 - S;
    var ocuT = 14 - T;
    var antS = ((S - 1 + 10) % 20) + 1;
    var guiaS = selloGuia(S, T);
    return {
      destino: { kin: kinObj.kin, sello: SELLOS[S - 1], tono: TONOS[T - 1], rol: 'Destino' },
      analogo: { kin: kinPorSelloTono(anaS, T), sello: SELLOS[anaS - 1], tono: TONOS[T - 1], rol: 'Análogo · apoyo' },
      antipoda: { kin: kinPorSelloTono(antS, T), sello: SELLOS[antS - 1], tono: TONOS[T - 1], rol: 'Antípoda · desafío' },
      oculto: { kin: kinPorSelloTono(ocuS, ocuT), sello: SELLOS[ocuS - 1], tono: TONOS[ocuT - 1], rol: 'Oculto · poder inconsciente' },
      guia: { kin: kinPorSelloTono(guiaS, T), sello: SELLOS[guiaS - 1], tono: TONOS[T - 1], rol: 'Guía', propio: guiaS === S }
    };
  }
  function kinsDeOnda(onda) {
    var ini = (onda - 1) * 13 + 1, out = [];
    for (var k = ini; k < ini + 13; k++) {
      out.push({ kin: k, sello: SELLOS[(k - 1) % 20], tono: TONOS[(k - 1) % 13] });
    }
    return out;
  }
  function proximoRetorno(fechaDesde, kinBuscado) {
    try {
      var base = new Date(String(fechaDesde) + 'T12:00:00');
      for (var i = 1; i <= 370; i++) {
        var d = new Date(base.getTime()); d.setDate(d.getDate() + i);
        var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        var k = calcKinMaya(key);
        if (k && !k.hunabKu && k.kin === kinBuscado) return { fecha: key, dias: i };
      }
    } catch (e) {}
    return null;
  }
  function firmaCorta(k) {
    if (!k || k.hunabKu) return '0.0 Hunab Ku';
    return 'Kin ' + k.kin + ' · ' + k.sello.n + ' ' + k.tono.nombre;
  }

  function getKinData() {
    var cur = null;
    try { cur = userData().kinMayaData; } catch (e) { cur = null; }
    if (cur && cur.fechaNac) return cur;
    var fresh = { fechaNac: '', nota: '', historial: [] };
    try { userData().kinMayaData = fresh; } catch (e) {}
    return fresh;
  }

  function renderKinGuia() {
    var box = $('kinGuiaBox'); if (!box) return;
    box.innerHTML =
      '<div class="si-card"><h4>¿Qué es el kin maya?</h4><p>El <b>kin maya</b> es un sistema de sincronización basado en el calendario sagrado <b>Tzolkin</b> de 260 días. Cada día tiene una energía única definida por la combinación de <b>20 sellos solares</b> y <b>13 tonos galácticos</b>. Tu kin de nacimiento revela tu "sello solar" y tu "tono galáctico": una firma energética que describe tu propósito, tu forma de actuar y tu camino de evolución.</p></div>' +
      '<div class="si-card"><h4>¿Cómo se calcula? (Dreamspell canónico)</h4><p>Referencia oficial: <b>26-07-1987 = Kin 34</b> (Mago Galáctico Blanco). Se cuentan los días hasta tu fecha, <b>sin contar los 29 de febrero</b> (día 0.0 Hunab Ku, sin kin), y se aplica módulo 260. Verificado: 26-07-2013 = Kin 164 y 21-12-2012 = Kin 207.</p></div>' +
      '<div class="si-card"><h4>Los 4 colores</h4><p><b style="color:#e53935">Rojo</b> (Este, inicia) · <b>Blanco</b> (Norte, refina) · <b style="color:#1e88e5">Azul</b> (Oeste, transforma) · <b style="color:#b89b00">Amarillo</b> (Sur, madura). El color rota cada sello y define su raza raíz.</p></div>' +
      '<div class="si-card"><h4>29 de febrero: 0.0 Hunab Ku</h4><p>El 29-feb no tiene kin ni avanza la cuenta. Quienes nacen ese día eligen el kin del 28-feb o del 1-mar. Así el ciclo solar-galáctico de 52 años se mantiene perfecto.</p></div>' +
      '<div class="si-card"><h4>Los 20 sellos solares</h4><p>Cada sello representa una energía arquetípica: desde el Dragón (nacimiento) hasta el Sol (iluminación). Tu sello de nacimiento es tu "color" principal: tu esencia, tu don, tu forma de estar en el mundo.</p></div>' +
      '<div class="si-card"><h4>Los 13 tonos galácticos</h4><p>Cada tono describe la forma en que se expresa el sello: el tono 1 es propósito puro, el tono 5 es radiación, el tono 13 es presencia. Juntos crean 260 combinaciones únicas.</p></div>' +
      '<div class="si-card"><h4>La onda encantada</h4><p>La <b>onda encantada</b> es un ciclo de 13 días (13 tonos) que se repite 20 veces en el Tzolkin. Cada onda tiene un tema y un propósito. Saber en qué onda estás ayuda a sintonizar con la energía del momento.</p></div>' +
      '<div class="si-card"><h4>El castillo</h4><p>El <b>castillo</b> es un ciclo de 52 días (4 ondas) que se repite 5 veces en el Tzolkin. Cada castillo tiene un tema mayor y representa una etapa de evolución.</p></div>' +
      '<div class="si-card"><h4>Sincronización con las 13 lunas</h4><p>El calendario de 13 lunas (364 días) y el Tzolkin (260 días) son dos ciclos que se entrelazan. Cada luna tiene su propia energía, y cada día dentro de ella tiene su kin. Juntos crean una trama rica de sincronías para la vida cotidiana.</p></div>';
  }

  function renderKinSellos() {
    var box = $('kinSellosBox'); if (!box) return;
    var q = (($('kinSellosQ') || {}).value || '').toLowerCase();
    var fil = SELLOS.filter(function (s) {
      if (q && (s.n + ' ' + s.cualidad + ' ' + s.keywords + ' ' + s.colorNombre + ' ' + s.direccion + ' ' + s.familia).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    box.innerHTML = fil.length ? fil.map(function (s) {
      return '<div class="si-card" style="border-left:3px solid ' + s.color + '">' +
        '<h4 style="font-size:13px"><span style="color:' + s.color + '">●</span> ' + s.num + ' · ' + esc(s.n) + ' (' + esc(s.maya) + ')</h4>' +
        '<p style="font-size:11px"><b>Color:</b> ' + esc(s.colorNombre) + ' · <b>Dirección:</b> ' + esc(s.direccion) + ' · <b>Familia:</b> ' + esc(s.familia) + '</p>' +
        '<p style="font-size:11px"><b>Poder:</b> ' + esc(s.poder) + ' · <b>Raza:</b> ' + esc(s.raza) + '</p>' +
        '<p style="font-size:11px;margin-top:4px">' + esc(s.desc) + '</p>' +
        '</div>';
    }).join('') : '<p class="muted">Sin resultados.</p>';
  }

  function renderKinTonos() {
    var box = $('kinTonosBox'); if (!box) return;
    box.innerHTML = TONOS.map(function (t) {
      return '<div class="si-card" style="border-left:3px solid ' + t.color + '">' +
        '<h4 style="font-size:13px"><span style="color:' + t.color + '">●</span> ' + t.num + ' · ' + esc(t.nombre) + '</h4>' +
        '<p style="font-size:11px"><b>Poder:</b> ' + esc(t.poder) + ' · <b>Acción:</b> ' + esc(t.accion) + '</p>' +
        '<p style="font-size:11px">' + esc(t.desc) + '</p>' +
        '</div>';
    }).join('');
  }

  function renderKinFamilias() {
    var box = $('kinFamiliasBox'); if (!box) return;
    box.innerHTML = FAMILIAS.map(function (f) {
      var sellos = f.sellos.map(function (n) { return SELLOS[n - 1]; });
      return '<div class="si-card" style="border-left:3px solid ' + f.color + '">' +
        '<h4 style="font-size:13px"><span style="color:' + f.color + '">●</span> Familia ' + esc(f.nombre) + '</h4>' +
        '<p style="font-size:11px"><b>Misión:</b> ' + esc(f.mision) + '</p>' +
        '<p style="font-size:11px">' + esc(f.desc) + '</p>' +
        '<p style="font-size:11px;margin-top:4px"><b>Sellos:</b> ' + sellos.map(function (s) { return esc(s.n); }).join(', ') + '</p>' +
        '</div>';
    }).join('');
  }

  function renderKinCastillo() {
    var box = $('kinCastilloBox'); if (!box) return;
    var hoy = todayKey();
    var kinHoy = calcKinMaya(hoy);
    var html = '';
    if (kinHoy && kinHoy.hunabKu) {
      html += '<div class="menstrual-card" style="border-color:var(--gold)"><h4>Hoy: 0.0 Hunab Ku</h4><p style="font-size:12px">' + esc(kinHoy.nota) + '</p></div>';
    } else if (kinHoy) {
      var posEnCastillo = ((kinHoy.kin - 1) % 52) + 1;
      html += '<div class="menstrual-card" style="border-color:var(--gold)"><h4>Tu castillo hoy</h4>' +
        '<p style="font-size:13px"><b>Kin de hoy:</b> ' + kinHoy.kin + ' (' + esc(kinHoy.sello.n) + ' ' + esc(kinHoy.tono.nombre) + ')</p>' +
        '<p style="font-size:13px"><b>Castillo:</b> ' + kinHoy.castillo + '/5 ' + esc(kinHoy.castilloNombre) + ' · <b>Posición:</b> ' + posEnCastillo + '/52</p>' +
        '<p class="muted" style="font-size:11px">El castillo es un ciclo de 52 días (4 ondas). Cada castillo tiene un tema mayor y representa una etapa de evolución.</p></div>';
    }
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>Los 5 castillos</h4>';
    html += CASTILLOS.map(function (c) {
      return '<div class="si-card" style="border-left:3px solid ' + c.color + '">' +
        '<h4 style="font-size:13px"><span style="color:' + c.color + '">●</span> ' + c.num + ' · ' + esc(c.nombre) + ' (kin ' + c.desde + '-' + c.hasta + ')</h4>' +
        '<p style="font-size:11px">' + esc(c.desc) + '</p>' +
        '</div>';
    }).join('');
    html += '</div>';
    box.innerHTML = html;
  }

  function renderKinCalculo() {
    var box = $('kinCalculoBox'); if (!box) return;
    var data = getKinData();
    var kin = data.fechaNac ? calcKinMaya(data.fechaNac) : null;
    var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>Calcular mi kin</h4>' +
      '<div class="conv-row"><label>Fecha de nacimiento <input type="date" id="kinFechaNac" value="' + esc(data.fechaNac) + '"></label>' +
      '<button type="button" id="kinCalcBtn" class="btn btn-accent" style="width:auto">Calcular</button></div>' +
      '<p class="muted" style="font-size:11px">Dreamspell canónico: 26-07-1987 = Kin 34 · 29-feb = 0.0 Hunab Ku (sin kin). Verificado con 26-07-2013 = Kin 164.</p></div>';
    if (kin && kin.hunabKu) {
      html += '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>0.0 Hunab Ku</h4><p style="font-size:12px">' + esc(kin.nota) + '</p></div>';
    } else if (kin) {
      var familia = FAMILIAS.filter(function (f) { return f.sellos.indexOf(kin.sello.num) >= 0; })[0];
      var orac = oraculoDe(kin);
      var hoyK = calcKinMaya(todayKey());
      var ret = proximoRetorno(data.fechaNac, kin.kin);
      var ondaKins = kinsDeOnda(kin.onda);
      var posOnda = ((kin.kin - 1) % 13) + 1;
      var cast = CASTILLOS[kin.castillo - 1];
      var portal = esPortal(kin.kin);
      html += '<div class="menstrual-card" style="margin-top:10px;border-color:' + kin.sello.color + '">' +
        '<h4>Tu kin: ' + kin.kin + ' · ' + esc(kin.sello.n) + ' ' + esc(kin.tono.nombre) + (portal ? ' · <span style="color:var(--gold)">Portal galáctico ✦</span>' : '') + '</h4>' +
        '<p style="font-size:13px"><b>Firma galáctica:</b> ' + esc(kin.sello.n) + ' (' + esc(kin.sello.maya) + ') ' + esc(kin.tono.nombre) + ' — “Yo ' + esc(kin.tono.poder.toLowerCase()) + ' con el fin de ' + esc(kin.sello.poder.toLowerCase()) + '”.</p>' +
        '<p style="font-size:13px;margin-top:6px"><b>Sello ' + kin.sello.num + '/20:</b> ' + esc(kin.sello.n) + ' (' + esc(kin.sello.maya) + ') — ' + esc(kin.sello.poder) + ' · ' + esc(kin.sello.cualidad) + '</p>' +
        '<p style="font-size:13px"><b>Tono ' + kin.tono.num + '/13:</b> ' + esc(kin.tono.nombre) + ' — ' + esc(kin.tono.poder) + ' / ' + esc(kin.tono.accion) + '</p>' +
        '<p style="font-size:11px;margin-top:6px"><b>Color:</b> ' + esc(kin.sello.colorNombre) + ' (' + esc(kin.sello.direccion) + ') · <b>Raza raíz:</b> ' + esc(kin.sello.raza) + ' · <b>Familia terrestre:</b> ' + esc(familia ? (familia.nombre + ' — ' + familia.mision) : '') + '</p>' +
        '<p style="font-size:11px;margin-top:4px"><b>Onda encantada ' + kin.onda + '/20 de ' + esc(kin.ondaSello) + ':</b> vas en la posición ' + posOnda + '/13 (tu tono). Misión de la onda: ' + esc(kin.ondaSello) + ' del propósito a la presencia.</p>' +
        '<p style="font-size:11px;margin-top:4px"><b>Castillo ' + kin.castillo + '/5:</b> ' + esc(cast.nombre) + ' (kin ' + cast.desde + '-' + cast.hasta + ')' + (portal ? ' · <b>Kin portal:</b> tu kin es una puerta de activación galáctica, días de energía intensa.' : '') + '</p>' +
        '<p class="muted" style="font-size:11px;margin-top:6px">' + esc(kin.sello.desc) + '</p>' +
        '<p class="muted" style="font-size:11px;margin-top:4px">' + esc(kin.tono.desc) + '</p>';
      if (ret) html += '<p style="font-size:11px;margin-top:6px"><b>Próximo retorno galáctico:</b> ' + esc(ret.fecha) + ' (en ' + ret.dias + ' días vuelve tu mismo kin).</p>';
      html += '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px;flex-wrap:wrap;gap:6px">' +
        '<button type="button" id="kinShareBtn" class="btn btn-accent" style="width:auto">Compartir</button>' +
        '<button type="button" id="kinCopyBtn" class="btn" style="width:auto">Copiar firma</button>' +
        '<button type="button" id="kinGoOnda" class="btn" style="width:auto">Ver mi onda</button>' +
        '<button type="button" id="kinGoCastillo" class="btn" style="width:auto">Ver mi castillo</button></div></div>';
      // Oráculo de la 5ª fuerza
      if (orac) {
        html += '<div class="menstrual-card" style="margin-top:10px"><h4>Oráculo de la 5ª fuerza</h4>' +
          '<p class="muted" style="font-size:11px">Tu kin desplegado en 5 poderes: destino, apoyo, desafío, inconsciente y guía. Análogo/antípoda comparten tu tono; el oculto espeja el tono (' + kin.tono.num + ' + ' + orac.oculto.tono.num + ' = 14).</p>';
        html += ['destino', 'analogo', 'antipoda', 'oculto', 'guia'].map(function (key) {
          var o = orac[key];
          var extra = key === 'guia' && o.propio ? ' — guiado por tu propio poder duplicado' : '';
          return '<div class="habit-item" style="align-items:flex-start"><div><b>' + esc(o.rol) + ':</b> Kin ' + o.kin + ' · ' + esc(o.sello.n) + ' ' + esc(o.tono.nombre) + extra +
            '<br><span class="muted" style="font-size:11px">' + esc(o.sello.poder) + ' · ' + esc(o.sello.cualidad) + '</span></div></div>';
        }).join('') + '</div>';
      }
      // Onda natal completa
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>Onda ' + kin.onda + ' de ' + esc(kin.ondaSello) + ' (tu onda natal)</h4>' +
        '<p class="muted" style="font-size:11px">Los 13 kins de tu onda, del tono 1 al 13. El resaltado es tu posición natal.</p><table style="width:100%;font-size:11px;border-collapse:collapse">' +
        '<tr style="text-align:left"><th style="padding:4px">Tono</th><th style="padding:4px">Kin</th><th style="padding:4px">Sello</th></tr>' +
        ondaKins.map(function (w, idx) {
          var yo = (w.kin === kin.kin);
          return '<tr style="border-top:1px solid var(--line)' + (yo ? ';background:rgba(232,197,106,.12)"' : '"') + '><td style="padding:4px">' + (idx + 1) + (yo ? ' ◀ tú' : '') + '</td><td style="padding:4px">' + w.kin + '</td><td style="padding:4px;color:' + w.sello.color + '">' + esc(w.sello.n) + ' ' + esc(w.tono.nombre) + '</td></tr>';
        }).join('') + '</table></div>';
      // Hoy vs tu kin
      if (hoyK && !hoyK.hunabKu) {
        var rel = [];
        if (hoyK.sello.num === kin.sello.num) rel.push('mismo sello (tu energía central)');
        if (hoyK.tono.num === kin.tono.num) rel.push('mismo tono (tu forma de actuar)');
        if (hoyK.onda === kin.onda) rel.push('misma onda encantada');
        if (hoyK.castillo === kin.castillo) rel.push('mismo castillo');
        var famHoy = FAMILIAS.filter(function (f) { return f.sellos.indexOf(hoyK.sello.num) >= 0; })[0];
        if (famHoy && familia && famHoy.nombre === familia.nombre) rel.push('misma familia ' + famHoy.nombre);
        html += '<div class="menstrual-card" style="margin-top:10px"><h4>Hoy y tu kin</h4>' +
          '<p style="font-size:12px"><b>Hoy:</b> ' + firmaCorta(hoyK) + ' · Onda ' + hoyK.onda + ' · Castillo ' + hoyK.castillo + '</p>' +
          (rel.length ? '<p style="font-size:11px"><b>Sincronías:</b> ' + esc(rel.join(' · ')) + '.</p>' : '<p class="muted" style="font-size:11px">Hoy no coincide sello, tono, onda ni castillo: día para integrar energías distintas a la tuya.</p>') + '</div>';
      }
      // Guía práctica
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>Guía práctica de tu kin</h4>' +
        '<p style="font-size:11px">• <b>Afirmación:</b> “Yo ' + esc(kin.tono.poder.toLowerCase()) + ' con el fin de ' + esc(kin.sello.poder.toLowerCase()) + '. ' + esc(kin.sello.cualidad) + '.”<br>' +
        '• <b>Acción:</b> hoy practica un gesto de ' + esc(kin.sello.poder.toLowerCase()) + ' con modo ' + esc(kin.tono.accion.toLowerCase()) + ' (tono ' + kin.tono.num + ').<br>' +
        '• <b>Pregunta guía:</b> ¿cómo ' + esc(kin.tono.poder.toLowerCase()) + ' mi ' + esc(kin.sello.poder.toLowerCase()) + ' al servicio de otros?<br>' +
        '• <b>Luz:</b> habitar ' + esc(kin.sello.cualidad.toLowerCase()) + '. <b>Sombra:</b> forzar o retener esa energía en vez de dejarla fluir.</p></div>';
    }
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>Nota personal</h4>' +
      '<textarea id="kinNota" rows="3" placeholder="¿Qué significa tu kin para ti? ¿Cómo lo vives?" maxlength="500">' + esc(data.nota) + '</textarea>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="kinNotaSave" class="btn btn-accent" style="width:auto">Guardar nota</button></div></div>';
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>Historial de cálculos</h4>' +
      '<div id="kinHistorial"></div></div>';
    box.innerHTML = html;
    renderKinHistorial();
    var btn = $('kinCalcBtn');
    if (btn) btn.onclick = function () {
      var f = $('kinFechaNac').value;
      if (!f) return alert('Ingresa una fecha');
      var d = getKinData();
      d.fechaNac = f;
      d.historial = d.historial || [];
      var kk = calcKinMaya(f);
      d.historial.unshift({ fecha: f, kin: kk ? (kk.hunabKu ? '0.0 Hunab Ku' : kk.kin) : '?', sello: kk && kk.sello ? kk.sello.n : '', tono: kk && kk.tono ? kk.tono.nombre : '', cuando: todayKey() });
      if (d.historial.length > 20) d.historial = d.historial.slice(0, 20);
      save('Kin calculado');
      renderKinCalculo();
    };
    var firmaTxt = function () {
      if (!kin || kin.hunabKu) return 'Mi kin: 0.0 Hunab Ku (29 de febrero, día fuera del tiempo).';
      var fam2 = FAMILIAS.filter(function (f) { return f.sellos.indexOf(kin.sello.num) >= 0; })[0];
      return 'Mi kin maya: Kin ' + kin.kin + ' · ' + kin.sello.n + ' (' + kin.sello.maya + ') ' + kin.tono.nombre +
        ' | Onda ' + kin.onda + ' de ' + kin.ondaSello + ' | Castillo: ' + kin.castilloNombre +
        ' | Familia ' + (fam2 ? fam2.nombre : '') + ' | Fecha: ' + kin.fecha;
    };
    var sh = $('kinShareBtn');
    if (sh) sh.onclick = function () { share('Mi Kin Maya', firmaTxt()); };
    var cp = $('kinCopyBtn');
    if (cp) cp.onclick = function () {
      try {
        if (navigator.clipboard) navigator.clipboard.writeText(firmaTxt()).then(function () { alert('Firma copiada'); }, function () { alert(firmaTxt()); });
        else alert(firmaTxt());
      } catch (e) { try { alert(firmaTxt()); } catch (e2) {} }
    };
    var go = $('kinGoOnda');
    if (go) go.onclick = function () { switchKinTab('Onda'); };
    var gc = $('kinGoCastillo');
    if (gc) gc.onclick = function () { switchKinTab('Castillo'); };
    var ns = $('kinNotaSave');
    if (ns) ns.onclick = function () {
      var d = getKinData();
      d.nota = clean($('kinNota').value, 500);
      save('Nota guardada');
    };
  }

  function renderKinHistorial() {
    var box = $('kinHistorial'); if (!box) return;
    var h = getKinData().historial || [];
    box.innerHTML = h.length ? h.map(function (r) {
      var det = (r.sello || r.tono) ? ' · ' + esc(r.sello || '') + ' ' + esc(r.tono || '') : '';
      return '<div class="habit-item"><div><b>' + esc(r.fecha) + '</b> · Kin ' + esc(String(r.kin)) + det + ' <span class="muted" style="font-size:11px">· ' + esc(r.cuando || '') + '</span></div>' +
        '<button type="button" class="btn" style="width:auto" data-kinfecha="' + esc(r.fecha) + '">Ver</button></div>';
    }).join('') : '<p class="muted">Sin cálculos aún.</p>';
    try {
      box.querySelectorAll('[data-kinfecha]').forEach(function (b) {
        b.onclick = function () {
          var f = b.getAttribute('data-kinfecha');
          var d = getKinData(); d.fechaNac = f; save('Kin cargado');
          renderKinCalculo();
          try { var inp = $('kinFechaNac'); if (inp) inp.scrollIntoView({ block: 'center' }); } catch (e) {}
        };
      });
    } catch (e) {}
  }

  function renderKinOnda() {
    var box = $('kinOndaBox'); if (!box) return;
    var hoy = todayKey();
    var kinHoy = calcKinMaya(hoy);
    if (!kinHoy) return;
    if (kinHoy.hunabKu) { box.innerHTML = '<div class="menstrual-card"><h4>Hoy: 0.0 Hunab Ku</h4><p style="font-size:12px">' + esc(kinHoy.nota) + '</p></div>'; return; }
    var onda = ondaDeKin(kinHoy.kin);
    var posEnOnda = ((kinHoy.kin - 1) % 13) + 1;
    var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>Tu onda encantada hoy</h4>' +
      '<p style="font-size:13px"><b>Kin de hoy:</b> ' + kinHoy.kin + ' (' + esc(kinHoy.sello.n) + ' ' + esc(kinHoy.tono.nombre) + ')</p>' +
      '<p style="font-size:13px"><b>Onda ' + onda + '/20 de ' + esc(ONDAS[onda - 1]) + '</b> · <b>Posición:</b> ' + posEnOnda + '/13 (tono ' + kinHoy.tono.num + ')</p>' +
      '<p class="muted" style="font-size:11px">La onda encantada es un ciclo de 13 días (13 tonos). Cada onda la rige un sello. Cuando completas 13 días, cambias de onda.</p></div>';
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>Próximos 13 días</h4><table style="width:100%;font-size:11px;border-collapse:collapse">';
    html += '<tr style="text-align:left"><th style="padding:4px">Día</th><th style="padding:4px">Kin</th><th style="padding:4px">Sello</th><th style="padding:4px">Tono</th></tr>';
    for (var i = 0; i < 13; i++) {
      var d = new Date(hoy + 'T12:00:00');
      d.setDate(d.getDate() + i);
      var k = calcKinMaya(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
      if (!k) continue;
      if (k.hunabKu) { html += '<tr style="border-top:1px solid var(--line)"><td style="padding:4px">' + (i === 0 ? 'Hoy' : '+' + i) + '</td><td colspan="3" style="padding:4px">0.0 Hunab Ku</td></tr>'; continue; }
      html += '<tr style="border-top:1px solid var(--line)"><td style="padding:4px">' + (i === 0 ? 'Hoy' : '+' + i) + '</td><td style="padding:4px">' + k.kin + '</td><td style="padding:4px;color:' + k.sello.color + '">' + esc(k.sello.n) + '</td><td style="padding:4px;color:' + k.tono.color + '">' + esc(k.tono.nombre) + '</td></tr>';
    }
    html += '</table></div>';
    box.innerHTML = html;
  }

  function renderKinLunas() {
    var box = $('kinLunasBox'); if (!box) return;
    var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>Kin maya y las 13 lunas</h4>' +
      '<p class="muted" style="font-size:11px">Cada luna del calendario de 13 lunas tiene una energía particular. Aquí verás el kin de hoy y cómo se relaciona con la luna actual.</p></div>';
    var l = lunaDeFecha(todayKey());
    if (l) {
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>Luna actual: ' + l.luna + '</h4>' +
        '<p style="font-size:12px">Día ' + l.dia + ' de 28</p>' +
        '<p class="muted" style="font-size:11px">La luna ' + l.luna + ' trae su propia energía. Combínala con tu kin de hoy para una lectura más completa.</p></div>';
    }
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>Guía de lectura</h4>' +
      '<p style="font-size:11px">• <b>Sello de la luna:</b> la energía del día.<br>• <b>Tono de la luna:</b> cómo se expresa.<br>• <b>Tu kin natal:</b> tu esencia fija.<br>• <b>Kin de hoy:</b> la energía del momento.<br><br>La intersección de estas cuatro lecturas da una imagen rica del día.</p></div>';
    box.innerHTML = html;
  }

  function renderKinAll() {
    try { renderKinGuia(); } catch (e) {}
    try { renderKinSellos(); } catch (e) {}
    try { renderKinTonos(); } catch (e) {}
    try { renderKinFamilias(); } catch (e) {}
    try { renderKinCastillo(); } catch (e) {}
    try { renderKinCalculo(); } catch (e) {}
    try { renderKinOnda(); } catch (e) {}
    try { renderKinLunas(); } catch (e) {}
  }

  function buildDialog() {
    makeDialog('kinMayaDialog', 'Kin Maya — Tzolkin y sincronización',
      'El <b>kin maya</b> es tu firma energética en el calendario sagrado de 260 días. Descubre tu sello solar, tu tono galáctico y cómo se sincroniza con las 13 lunas. Todo queda <b>privado y local</b>.',
      '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
      '<button type="button" id="tabKinGuia" class="btn btn-accent" style="width:auto">Guía</button>' +
      '<button type="button" id="tabKinSellos" class="btn" style="width:auto">Sellos</button>' +
      '<button type="button" id="tabKinTonos" class="btn" style="width:auto">Tonos</button>' +
      '<button type="button" id="tabKinFamilias" class="btn" style="width:auto">Familias</button>' +
      '<button type="button" id="tabKinCastillo" class="btn" style="width:auto">Castillo</button>' +
      '<button type="button" id="tabKinCalculo" class="btn" style="width:auto">Mi kin</button>' +
      '<button type="button" id="tabKinOnda" class="btn" style="width:auto">Onda</button>' +
      '<button type="button" id="tabKinLunas" class="btn" style="width:auto">Lunas</button></div>' +
      '<div id="kinGuia"><div id="kinGuiaBox"></div></div>' +
      '<div id="kinSellos" class="hidden">' +
      '<div class="conv-row" style="margin-bottom:8px"><label style="flex:1">Buscar sello <input type="text" id="kinSellosQ" placeholder="nombre, cualidad, color..." autocomplete="off"></label></div>' +
      '<div id="kinSellosBox"></div></div>' +
      '<div id="kinTonos" class="hidden"><div id="kinTonosBox"></div></div>' +
      '<div id="kinFamilias" class="hidden"><div id="kinFamiliasBox"></div></div>' +
      '<div id="kinCastillo" class="hidden"><div id="kinCastilloBox"></div></div>' +
      '<div id="kinCalculo" class="hidden"><div id="kinCalculoBox"></div></div>' +
      '<div id="kinOnda" class="hidden"><div id="kinOndaBox"></div></div>' +
      '<div id="kinLunas" class="hidden"><div id="kinLunasBox"></div></div>');
  }

  function switchKinTab(t) {
    switchTab('kin', t, ['Guia', 'Sellos', 'Tonos', 'Familias', 'Castillo', 'Calculo', 'Onda', 'Lunas']);
  }

  function setup() {
    try {
      if (!$('btnKinMaya')) {
        var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
        if (g) {
          var btn = document.createElement('button');
          btn.id = 'btnKinMaya'; btn.className = 'btn'; btn.type = 'button';
          btn.textContent = 'Kin Maya';
          try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
          btn.setAttribute('data-keywords', 'kin maya tzolkin sello solar tono galactico onda encantada 260 dias calendario sagrado sincronizacion');
          g.appendChild(btn);
        }
      } else {
        try {
          var curE = $('btnKinMaya');
          var curGE = curE.closest ? curE.closest('.action-group') : null;
          var curNE = curGE && curGE.getAttribute ? curGE.getAttribute('data-group') : null;
          if (curNE && curNE !== 'linaje') {
            var gdE = document.querySelector('.action-group[data-group="linaje"] .group-btns');
            if (gdE) { gdE.appendChild(curE); try { curE.setAttribute('data-sub', 'interior'); } catch (eS) {} }
          }
        } catch (eM) {}
      }
    } catch (e) {}
    try {
      if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnKinMaya') < 0) ALL_BTNS.push('btnKinMaya');
    } catch (e) {}
    try {
      if (typeof PRESETS !== 'undefined') {
        ['adolescente', 'estudiante', 'salud', 'docente'].forEach(function (p) {
          if (PRESETS[p]) PRESETS[p].btnKinMaya = true;
        });
      }
    } catch (e) {}
    try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
    try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
    try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
    try {
      if (!document.querySelector('#configDialog input[data-btn="btnKinMaya"]')) {
        var groups = document.querySelectorAll('#configDialog .config-group');
        groups.forEach(function (gr) {
          var h = gr.querySelector('h5');
          if (h && h.textContent.indexOf('Linaje') >= 0) {
            var lab = document.createElement('label');
            lab.className = 'check-row';
            lab.innerHTML = '<input type="checkbox" data-btn="btnKinMaya"> Kin Maya';
            gr.appendChild(lab);
            try {
              var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
              lab.querySelector('input').checked = !vis || vis.btnKinMaya !== false;
              lab.querySelector('input').onchange = function () {
                try {
                  var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                  if (DATAref) {
                    DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                    DATAref.config.visible.btnKinMaya = lab.querySelector('input').checked;
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
    try { addKw('btnPsico', 'kin maya tzolkin'); } catch (e2) {}

    buildDialog();
    renderKinAll();

    var b = $('btnKinMaya');
    if (b) b.onclick = function () { switchKinTab('Guia'); renderKinAll(); openDlg('kinMayaDialog'); };

    ['Guia', 'Sellos', 'Tonos', 'Familias', 'Castillo', 'Calculo', 'Onda', 'Lunas'].forEach(function (t) {
      var tb = $('tabKin' + t);
      if (tb) tb.onclick = function () { switchKinTab(t); };
    });

    var q = $('kinSellosQ'); if (q) q.oninput = function () { renderKinSellos(); };
  }

  var _kinInit = 0;
  function init() {
    _kinInit++;
    if (!document.querySelector('.action-group[data-group]')) { if (_kinInit < 40) setTimeout(init, 500); return; }
    try { setup(); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 450); });
  else setTimeout(init, 450);

})();
