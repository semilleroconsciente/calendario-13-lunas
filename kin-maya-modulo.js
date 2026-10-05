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
    { nombre: 'Este', color: '#e53935', desc: 'Casa Roja del Nacer. Inicia, despierta, trae la vida. Raza roja: Dragón, Serpiente, Luna, Caminante y Tierra.', keywords: 'este rojo inicia nacer' },
    { nombre: 'Norte', color: '#eceff1', desc: 'Casa Blanca del Refinar. Purifica, comunica, lleva al espíritu. Raza blanca: Viento, Enlazador, Perro, Mago y Espejo.', keywords: 'norte blanco refina espiritu' },
    { nombre: 'Oeste', color: '#1e88e5', desc: 'Casa Azul del Transformar. Cambia, sueña, hace magia con la noche. Raza azul: Noche, Mano, Mono, Águila y Tormenta.', keywords: 'oeste azul transforma' },
    { nombre: 'Sur', color: '#fdd835', desc: 'Casa Amarilla del Madurar. Cosecha, ilumina, da fruto. Raza amarilla: Semilla, Estrella, Humano, Guerrero y Sol.', keywords: 'sur amarillo madura' },
    { nombre: 'Centro', color: '#43a047', desc: 'Casa Verde del Encantar. El corazón que sostiene las 4 direcciones y los 5 castillos.', keywords: 'centro verde corazon' }
  ];

  // ---- Guía práctica por sello: afirmación, luz, sombra, pregunta y gesto ----
  var SELLO_GUIA = {
    1: { afirma: 'Yo soy el nacimiento. Nutro la vida que empieza.', luz: 'Nutrir, iniciar, cuidar lo nuevo', sombra: 'Controlar el inicio o abandonar lo que nace', pregunta: '¿Qué quiere nacer hoy a través de mí?', practica: 'Inicia algo pequeño: una semilla, una frase, un gesto.' },
    2: { afirma: 'Yo soy el aliento. Comunico el espíritu.', luz: 'Comunicar claro, respirar, inspirar', sombra: 'Hablar de más o callar lo esencial', pregunta: '¿Qué necesita ser dicho hoy?', practica: 'Respira 3 veces consciente y di una verdad simple.' },
    3: { afirma: 'Yo soy la noche. Sueño la abundancia.', luz: 'Intuir, soñar, confiar en la oscuridad fértil', sombra: 'Quedarse en la queja o el miedo', pregunta: '¿Qué sueño me está hablando?', practica: 'Anota tu sueño o una intuición antes de dormir.' },
    4: { afirma: 'Yo soy la semilla. Florezco con dirección.', luz: 'Enfocar, perseverar, crecer', sombra: 'Dispersarse o enterrar el potencial', pregunta: '¿En qué pongo mi energía hoy?', practica: 'Elige UNA meta y dale un paso concreto.' },
    5: { afirma: 'Yo soy la fuerza vital. Despierto mi cuerpo.', luz: 'Vitalidad, pasión, movimiento', sombra: 'Quemarse o reprimir el deseo', pregunta: '¿Qué necesita mi cuerpo hoy?', practica: 'Mueve el cuerpo 10 min: camina, danza, estira.' },
    6: { afirma: 'Yo tiendo puentes. Suelto e igualo.', luz: 'Perdonar, conectar, soltar', sombra: 'Apegarse o cortar de golpe', pregunta: '¿Qué puente puedo tender hoy?', practica: 'Perdona o reconcíliate con alguien (o contigo).' },
    7: { afirma: 'Yo soy la mano que sana. Realizo.', luz: 'Sanar, hacer, concretar', sombra: 'Hacer por hacer sin sentido', pregunta: '¿Qué puedo sanar con mis manos hoy?', practica: 'Haz algo manual: cocina, repara, toca, escribe a mano.' },
    8: { afirma: 'Yo soy la estrella. Embellezco el mundo.', luz: 'Crear belleza, armonizar', sombra: 'Buscar perfección que paraliza', pregunta: '¿Cómo traigo belleza hoy?', practica: 'Ordena o adorna un rincón; haz algo bello.' },
    9: { afirma: 'Yo soy la luna. Fluyo y purifico.', luz: 'Fluir, limpiar, soltar emociones', sombra: 'Ahogarse en la emoción', pregunta: '¿Qué emoción necesita fluir?', practica: 'Toma agua consciente; escribe y suelta una emoción.' },
    10: { afirma: 'Yo soy el amor. Soy leal al corazón.', luz: 'Amar, acompañar, ser leal', sombra: 'Celos o dependencia', pregunta: '¿A quién amo hoy con hechos?', practica: 'Un gesto de amor concreto a alguien cercano.' },
    11: { afirma: 'Yo juego la magia. Creo con alegría.', luz: 'Jugar, reír, imaginar', sombra: 'Tomarse todo demasiado en serio', pregunta: '¿Dónde pongo juego hoy?', practica: 'Haz algo por puro placer 15 min.' },
    12: { afirma: 'Yo elijo libre. Influyo con sabiduría.', luz: 'Elegir consciente, guiar', sombra: 'Culpar o manipular', pregunta: '¿Qué elijo hoy con libertad?', practica: 'Toma UNA decisión pendiente con calma.' },
    13: { afirma: 'Yo exploro el espacio. Abro caminos.', luz: 'Explorar, expandir, conectar mundos', sombra: 'Perderse sin rumbo', pregunta: '¿Qué territorio nuevo exploro?', practica: 'Cambia una ruta, conoce un lugar o idea nueva.' },
    14: { afirma: 'Yo soy el mago. Habito el ahora.', luz: 'Presencia, encanto, atemporalidad', sombra: 'Querer controlar el tiempo', pregunta: '¿Puedo estar 100% aquí y ahora?', practica: '5 min de presencia total: mira, escucha, siente.' },
    15: { afirma: 'Yo veo con altura. Sueño la visión.', luz: 'Visión global, mente clara', sombra: 'Perderse en el detalle o la crítica', pregunta: '¿Cuál es el panorama grande?', practica: 'Sube a un mirador (real o mental) y mira tu semana.' },
    16: { afirma: 'Yo soy el guerrero. Pregunto con valor.', luz: 'Cuestionar, defender, perseverar', sombra: 'Pelear por pelear', pregunta: '¿Qué debo cuestionar con valentía?', practica: 'Haz la pregunta difícil que vienes evitando.' },
    17: { afirma: 'Yo navego la tierra. Sincronizo.', luz: 'Sincronía, orientación, evolución', sombra: 'Forzar el rumbo', pregunta: '¿Qué sincronía me guía hoy?', practica: 'Sigue una señal del día: un encuentro, un aviso.' },
    18: { afirma: 'Yo reflejo el orden. Soy el espejo.', luz: 'Reflejar verdad, ordenar', sombra: 'Juzgar o culpar al espejo', pregunta: '¿Qué me está reflejando el otro?', practica: 'Ordena algo externo para ordenar lo interno.' },
    19: { afirma: 'Yo transformo la tormenta. Renazco.', luz: 'Catarsis sana, cambio, energía', sombra: 'Drama que destruye', pregunta: '¿Qué necesita transformarse ya?', practica: 'Suelta algo físico: limpia, dona, bota.' },
    20: { afirma: 'Yo soy el sol. Ilumino la vida.', luz: 'Iluminar, dar vida, celebrar', sombra: 'Quemar con ego', pregunta: '¿A quién ilumino hoy?', practica: 'Agradece al sol; comparte una alegría.' }
  };

  // ---- Guía por tono: pregunta, práctica y meditación ----
  var TONO_GUIA = {
    1: { pregunta: '¿Cuál es mi propósito?', practica: 'Escribe tu meta del ciclo en una frase.', meditacion: 'Unifico. Atraigo el propósito.' },
    2: { pregunta: '¿Cuál es mi desafío?', practica: 'Nombra el obstáculo y su regalo.', meditacion: 'Polarizo para estabilizar.' },
    3: { pregunta: '¿Cómo sirvo?', practica: 'Ofrece un servicio concreto hoy.', meditacion: 'Vinculo el servicio con movimiento.' },
    4: { pregunta: '¿Qué forma toma?', practica: 'Dibuja o escribe la estructura.', meditacion: 'Defino la forma con medida.' },
    5: { pregunta: '¿Cómo mando la energía?', practica: 'Pon un límite o una orden clara.', meditacion: 'Guío la radiación hacia afuera.' },
    6: { pregunta: '¿Cómo equilibro?', practica: 'Ajusta ritmo: descanso y acción.', meditacion: 'Equilibro con ritmo e igualdad.' },
    7: { pregunta: '¿Cómo sintonizo?', practica: 'Medita o camina en silencio 10 min.', meditacion: 'Armonizo y canalizo.' },
    8: { pregunta: '¿Vivo lo que creo?', practica: 'Sé ejemplo en algo pequeño.', meditacion: 'Modelo con integridad.' },
    9: { pregunta: '¿Qué intención realizo?', practica: 'Declara tu intención en voz alta.', meditacion: 'Realizo con intención solar.' },
    10: { pregunta: '¿Qué se manifiesta?', practica: 'Muestra un avance concreto.', meditacion: 'Produzco la manifestación.' },
    11: { pregunta: '¿Qué suelto?', practica: 'Suelta una cosa que ya cumplió.', meditacion: 'Divulgo liberando.' },
    12: { pregunta: '¿Con quién coopero?', practica: 'Comparte o pide ayuda.', meditacion: 'Universalizo en cooperación.' },
    13: { pregunta: '¿Cómo trasciendo?', practica: 'Cierra, agradece y suelta el ciclo.', meditacion: 'Trasciendo en presencia.' }
  };

  // ---- 20 ondas encantadas: misión, lección y pregunta ----
  var ONDA_INFO = [
    { sello: 'Dragón', mision: 'Iniciar el nacimiento', poder: 'Nutrir lo nuevo', leccion: 'Todo ciclo empieza cuidando la vida.', pregunta: '¿Qué quiero gestar?' },
    { sello: 'Mago', mision: 'Habitar la atemporalidad', poder: 'Encantar el presente', leccion: 'La magia vive en el ahora.', pregunta: '¿Estoy presente?' },
    { sello: 'Mano', mision: 'Concretar la sanación', poder: 'Realizar con las manos', leccion: 'Sanar es hacer con amor.', pregunta: '¿Qué sano haciendo?' },
    { sello: 'Sol', mision: 'Iluminar la vida', poder: 'Dar luz y alegría', leccion: 'Iluminar sin quemar.', pregunta: '¿Qué ilumino?' },
    { sello: 'Caminante del Cielo', mision: 'Explorar el espacio', poder: 'Abrir caminos', leccion: 'Crecer es salir del mapa.', pregunta: '¿Qué exploro?' },
    { sello: 'Enlazador de Mundos', mision: 'Soltar y tender puentes', poder: 'Igualar y perdonar', leccion: 'Soltar también es amar.', pregunta: '¿Qué suelto?' },
    { sello: 'Tormenta', mision: 'Transformar con energía', poder: 'Renovar por catarsis', leccion: 'La tormenta limpia si la guías.', pregunta: '¿Qué transformo?' },
    { sello: 'Humano', mision: 'Elegir con sabiduría', poder: 'Libre albedrío', leccion: 'Elegir es el poder humano.', pregunta: '¿Qué elijo?' },
    { sello: 'Serpiente', mision: 'Despertar el cuerpo', poder: 'Fuerza vital', leccion: 'El cuerpo sabe el camino.', pregunta: '¿Qué me pide el cuerpo?' },
    { sello: 'Espejo', mision: 'Reflejar la verdad', poder: 'Orden sin fin', leccion: 'El otro me muestra.', pregunta: '¿Qué me refleja?' },
    { sello: 'Mono', mision: 'Jugar la magia', poder: 'Crear con alegría', leccion: 'Jugar también crea realidad.', pregunta: '¿Dónde juego?' },
    { sello: 'Semilla', mision: 'Florecer con dirección', poder: 'Enfocar el potencial', leccion: 'La semilla rompe para florecer.', pregunta: '¿Qué hago florecer?' },
    { sello: 'Tierra', mision: 'Navegar la sincronía', poder: 'Orientarse evolucionando', leccion: 'Sigue las señales.', pregunta: '¿Qué señal sigo?' },
    { sello: 'Perro', mision: 'Amar con lealtad', poder: 'Corazón', leccion: 'Amar es acompañar.', pregunta: '¿A quién acompaño?' },
    { sello: 'Noche', mision: 'Soñar la abundancia', poder: 'Intuición', leccion: 'El sueño también guía.', pregunta: '¿Qué sueño?' },
    { sello: 'Estrella', mision: 'Embellecer el mundo', poder: 'Arte y armonía', leccion: 'La belleza eleva.', pregunta: '¿Qué embellezco?' },
    { sello: 'Luna', mision: 'Purificar fluyendo', poder: 'Agua universal', leccion: 'Fluir limpia.', pregunta: '¿Qué dejo fluir?' },
    { sello: 'Viento', mision: 'Comunicar el espíritu', poder: 'Aliento', leccion: 'Decir lo esencial.', pregunta: '¿Qué comunico?' },
    { sello: 'Águila', mision: 'Ver con altura', poder: 'Visión', leccion: 'Mira el todo antes del detalle.', pregunta: '¿Cuál es mi visión?' },
    { sello: 'Guerrero', mision: 'Cuestionar con valor', poder: 'Inteligencia valiente', leccion: 'Preguntar abre caminos.', pregunta: '¿Qué cuestiono?' }
  ];

  // ---- 7 plasmas radiales (semana de 13 lunas): chakra + mantra ----
  var PLASMAS = [
    { nombre: 'Dali', dia: 'Lunes · día 1, 8, 15, 22', chakra: 'Coronario (arriba)', mantra: 'OM', practica: 'Día de calentar y ofrecer: enciende una vela o intención.' },
    { nombre: 'Seli', dia: 'Martes · día 2, 9, 16, 23', chakra: 'Raíz (base)', mantra: 'HRAM', practica: 'Día de enraizar: camina descalzo, toca tierra.' },
    { nombre: 'Gamma', dia: 'Miércoles · día 3, 10, 17, 24', chakra: 'Tercer ojo (frente)', mantra: 'HRAHA', practica: 'Día de mirar: medita 5 min con ojos cerrados.' },
    { nombre: 'Kali', dia: 'Jueves · día 4, 11, 18, 25', chakra: 'Sacral (bajo vientre)', mantra: 'HRIM', practica: 'Día de soltar: limpia un cajón, un vínculo, un hábito.' },
    { nombre: 'Alfa', dia: 'Viernes · día 5, 12, 19, 26', chakra: 'Garganta (voz)', mantra: 'HRAUM', practica: 'Día de decir: canta, conversa, declara.' },
    { nombre: 'Limi', dia: 'Sábado · día 6, 13, 20, 27', chakra: 'Plexo solar (boca del estómago)', mantra: 'HRUM', practica: 'Día de digerir: ayuno suave o comida simple.' },
    { nombre: 'Silio', dia: 'Domingo · día 7, 14, 21, 28', chakra: 'Corazón (pecho)', mantra: 'HRAIM', practica: 'Día de amar: perdona, agradece, abraza.' }
  ];

  // ---- Glosario Dreamspell mínimo ----
  var GLOSARIO = [
    { t: 'Kin', d: 'Unidad de energía diaria: un sello + un tono (1 de 260). Tu kin natal es tu firma.' },
    { t: 'Tzolkin', d: 'Calendario sagrado de 260 días (20 sellos × 13 tonos). La matriz de sincronización.' },
    { t: 'Sello solar', d: 'Arquetipo de 20 días (Dragón→Sol). Dice QUÉ energía.' },
    { t: 'Tono galáctico', d: 'Pulso de 13 (Magnético→Cósmico). Dice CÓMO actúa el sello.' },
    { t: 'Onda encantada', d: 'Ciclo de 13 kins (13 tonos) con un sello regente. 20 ondas por Tzolkin.' },
    { t: 'Castillo', d: 'Ciclo de 52 kins (4 ondas). 5 castillos: Rojo, Blanco, Azul, Amarillo y Verde.' },
    { t: 'Familia terrestre', d: 'Grupo de 4 sellos (uno de cada color) con misión común: Polar, Cardinal, Central, Señal y Portal.' },
    { t: 'Raza raíz / color', d: 'Rojo inicia, Blanco refina, Azul transforma, Amarillo madura.' },
    { t: 'Portal galáctico (GAP)', d: '52 kins de activación intensa. Días de energía fuerte: medita, no decidas en caliente.' },
    { t: 'Oráculo 5ª fuerza', d: 'Tu kin desplegado en 5: Destino, Análogo (apoyo), Antípoda (desafío), Oculto (inconsciente) y Guía.' },
    { t: 'Hunab Ku 0.0', d: '29 de febrero: día fuera del conteo, sin kin. Se toma el kin del 28-feb o 1-mar.' },
    { t: 'Retorno galáctico', d: 'Cuando vuelve tu mismo kin (~cada 260 días efectivos). Tu “cumpleaños maya”.' },
    { t: 'Plasma radial', d: 'Energía del día semanal de 13 lunas (Dali→Silio), ligada a un chakra. 7 por cada luna de 28 días.' }
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
  function firmaLarga(k) {
    if (!k || k.hunabKu) return '0.0 Hunab Ku (29 de febrero, día fuera del tiempo)';
    return 'Kin ' + k.kin + ' · ' + k.sello.n + ' (' + k.sello.maya + ') ' + k.tono.nombre +
      ' · Onda ' + k.onda + ' de ' + k.ondaSello + ' · ' + k.castilloNombre;
  }
  function afirmacionKin(k) {
    if (!k || k.hunabKu) return 'Hoy descanso en el silencio del Hunab Ku: todo es posible.';
    var g = SELLO_GUIA[k.sello.num] || {};
    var tg = TONO_GUIA[k.tono.num] || {};
    return '“Yo ' + k.tono.poder.toLowerCase() + ' con el fin de ' + k.sello.poder.toLowerCase() + '. ' + (g.afirma || k.sello.cualidad) + ' ' + (tg.meditacion || '') + '”';
  }
  function practicaKin(k) {
    if (!k || k.hunabKu) return 'Medita, ayuna de ruido y escucha: el vacío también enseña.';
    var g = SELLO_GUIA[k.sello.num] || {};
    var tg = TONO_GUIA[k.tono.num] || {};
    return (g.practica || '') + ' ' + (tg.practica || '');
  }
  function plasmaDeLunaDia(diaLuna) {
    try {
      var idx = ((Number(diaLuna) - 1) % 7 + 7) % 7;
      return PLASMAS[idx];
    } catch (e) { return null; }
  }
  function familiaDeSello(selloNum) {
    for (var i = 0; i < FAMILIAS.length; i++) {
      if (FAMILIAS[i].sellos.indexOf(selloNum) >= 0) return FAMILIAS[i];
    }
    return null;
  }
  function kinCompleto(num) {
    if (!num || num < 1 || num > 260) return null;
    var sello = SELLOS[(num - 1) % 20];
    var tono = TONOS[(num - 1) % 13];
    var onda = ondaDeKin(num);
    var castillo = castilloDeKin(num);
    return { kin: num, sello: sello, tono: tono, onda: onda, ondaSello: ONDAS[onda - 1],
      castillo: castillo, castilloNombre: CASTILLOS[castillo - 1].nombre };
  }
  function compatKins(a, b) {
    if (!a || !b || a.hunabKu || b.hunabKu) return null;
    var puntos = 0, notas = [];
    if (a.sello.num === b.sello.num) { puntos += 3; notas.push('✨ Mismo sello (' + a.sello.n + '): se entienden sin hablar. Riesgo: amplificar la sombra.'); }
    if (a.tono.num === b.tono.num) { puntos += 2; notas.push('🥁 Mismo tono (' + a.tono.nombre + '): actúan al mismo ritmo.'); }
    if (a.onda === b.onda) { puntos += 2; notas.push('🌊 Misma onda (' + a.ondaSello + '): comparten misión de 13 días.'); }
    if (a.castillo === b.castillo) { puntos += 1; notas.push('🏰 Mismo castillo: misma etapa evolutiva.'); }
    var fa = familiaDeSello(a.sello.num), fb = familiaDeSello(b.sello.num);
    if (fa && fb && fa.nombre === fb.nombre) { puntos += 2; notas.push('👪 Misma familia ' + fa.nombre + ' (' + fa.mision.toLowerCase() + '): equipo natural.'); }
    if (a.sello.colorNombre === b.sello.colorNombre) { puntos += 1; notas.push('🎨 Mismo color ' + a.sello.colorNombre + ': mismo modo (iniciar/refinar/transformar/madurar).'); }
    // análogo / antípoda / oculto cruzado
    var ora = oraculoDe(a);
    if (ora) {
      if (ora.analogo.sello.num === b.sello.num) { puntos += 2; notas.push('🤝 Eres su análogo: tú lo apoyas, él te inspira.'); }
      if (ora.antipoda.sello.num === b.sello.num) { puntos += 1; notas.push('⚡ Eres su antípoda: desafío fértil. Lo que te irrita te enseña.'); }
      if (ora.oculto.sello.num === b.sello.num) { puntos += 2; notas.push('🌙 Eres su oculto: conexión inconsciente y magnética.'); }
      if (ora.guia.sello.num === b.sello.num) { puntos += 2; notas.push('🧭 Eres su guía (o viceversa): aprende de su ejemplo.'); }
    }
    var nivel = puntos >= 8 ? 'Afinidad muy alta — alianza natural' : puntos >= 5 ? 'Afinidad alta — buen equipo con conciencia' : puntos >= 3 ? 'Afinidad media — se complementan si se escuchan' : 'Desafío creativo — les toca integrar lo distinto';
    return { puntos: puntos, nivel: nivel, notas: notas.length ? notas : ['Energías distintas: no compiten, se completan. Miren onda y familia para colaborar.'] };
  }
  function proximosKins(n, desdeKey) {
    var out = [];
    try {
      var base = new Date(String(desdeKey || todayKey()) + 'T12:00:00');
      for (var i = 0; i < n; i++) {
        var d = new Date(base.getTime()); d.setDate(d.getDate() + i);
        var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        var k = calcKinMaya(key);
        out.push({ fecha: key, kin: k });
      }
    } catch (e) {}
    return out;
  }
  function kinDelAnio(fechaNac, anio) {
    try {
      var p = parseYMD(fechaNac); if (!p) return null;
      var extra = (p.m === 2 && p.d === 29) ? ' (nació 29-feb: se usa 28-feb)' : '';
      var mm = (p.m === 2 && p.d === 29) ? 2 : p.m;
      var dd = (p.m === 2 && p.d === 29) ? 28 : p.d;
      var key = anio + '-' + String(mm).padStart(2, '0') + '-' + String(dd).padStart(2, '0');
      var k = calcKinMaya(key);
      if (k) k.notaAnio = extra;
      return k;
    } catch (e) { return null; }
  }
  function selOndaActual() {
    try {
      var s = $('kinOndaSel'); if (s) return parseInt(s.value, 10) || null;
    } catch (e) {}
    return null;
  }

  function getKinData() {
    var cur = null;
    try { cur = userData().kinMayaData; } catch (e) { cur = null; }
    if (cur && typeof cur === 'object') {
      if (!Array.isArray(cur.historial)) cur.historial = [];
      if (!Array.isArray(cur.perfiles)) cur.perfiles = [];
      if (cur.nota === undefined) cur.nota = '';
      if (cur.fechaNac === undefined) cur.fechaNac = '';
      if (cur.nombre === undefined) cur.nombre = '';
      return cur;
    }
    var fresh = { fechaNac: '', nombre: '', nota: '', historial: [], perfiles: [] };
    try { userData().kinMayaData = fresh; } catch (e) {}
    return fresh;
  }
  // Kin a destacar en la pestaña Tzolkin (salto desde Mi kin / oráculo).
  var _kinVerTz = 0;
  function diasEntreYMD(a, b) {
    var pa = parseYMD(a), pb = parseYMD(b);
    if (!pa || !pb) return null;
    return Math.round((pb.utc - pa.utc) / 86400000);
  }
  function vueltasTzolkin(fechaNac, hoyKey) {
    var d = diasEntreYMD(fechaNac, hoyKey);
    if (d === null || d < 0) return null;
    var febs = 0;
    try {
      var pa = parseYMD(fechaNac), pb = parseYMD(hoyKey);
      var base = new Date(pa.utc), fin = new Date(pb.utc);
      for (var y = base.getUTCFullYear(); y <= fin.getUTCFullYear(); y++) {
        if (!isLeap(y)) continue;
        var f = Date.UTC(y, 1, 29);
        if (f > pa.utc && f <= pb.utc) febs++;
      }
    } catch (e) {}
    var eff = d - febs;
    return { dias: d, efectivos: eff, vueltas: Math.floor(eff / 260), resto: eff % 260 };
  }
  var ORACULO_ROL = {
    destino: { titulo: 'Destino · tu esencia', txt: 'Quién eres en el centro. Vívelo a diario: es tu energía de base.' },
    analogo: { titulo: 'Análogo · tu apoyo', txt: 'Tu aliado natural: misma frecuencia, te sostiene. Busca personas o días con este sello cuando necesites ayuda.' },
    antipoda: { titulo: 'Antípoda · tu desafío', txt: 'Tu maestro incómodo: lo que te irrita te enseña. No lo evites: pregúntale qué viene a mostrarte.' },
    oculto: { titulo: 'Oculto · tu poder inconsciente', txt: 'Tu fuerza dormida. Aparece en sueños, crisis y corazonadas. Sus tonos suman 14 con el tuyo.' },
    guia: { titulo: 'Guía · tu norte', txt: 'El ejemplo a seguir. Si es tu propio sello, vas “guiado por ti”: doble poder, doble responsabilidad.' }
  };

  function renderKinGuia() {
    var box = $('kinGuiaBox'); if (!box) return;
    var coloresHTML = COLORES.map(function (c) {
      return '<div class="si-card" style="border-left:3px solid ' + c.color + '"><h4 style="font-size:12px">' + esc(c.nombre) + '</h4><p style="font-size:11px">' + esc(c.desc) + '</p></div>';
    }).join('');
    var dirsHTML = DIRECCIONES.map(function (d) {
      return '<div class="si-card" style="border-left:3px solid ' + d.color + '"><h4 style="font-size:12px">' + esc(d.nombre) + '</h4><p style="font-size:11px">' + esc(d.desc) + '</p></div>';
    }).join('');
    var plasHTML = PLASMAS.map(function (p) {
      return '<div class="habit-item" style="align-items:flex-start"><div><b>' + esc(p.nombre) + '</b> · ' + esc(p.dia) + '<br><span class="muted" style="font-size:11px">Chakra: ' + esc(p.chakra) + ' · Mantra: ' + esc(p.mantra) + ' — ' + esc(p.practica) + '</span></div></div>';
    }).join('');
    var gloHTML = GLOSARIO.map(function (g) {
      return '<div class="habit-item" style="align-items:flex-start"><div><b>' + esc(g.t) + ':</b> <span style="font-size:11px">' + esc(g.d) + '</span></div></div>';
    }).join('');
    box.innerHTML =
      '<div class="si-card"><h4>¿Qué es el kin maya?</h4><p>El <b>kin maya</b> es tu firma en el calendario sagrado <b>Tzolkin</b> de 260 días (20 sellos × 13 tonos). Cada día tiene una energía única. Tu kin natal revela tu <b>sello</b> (qué energía) y tu <b>tono</b> (cómo actúa): propósito, forma de actuar y camino de evolución.</p></div>' +
      '<div class="si-card"><h4>¿Cómo se calcula? (Dreamspell canónico)</h4><p>Referencia oficial: <b>26-07-1987 = Kin 34</b> (Mago Galáctico Blanco). Se cuentan los días hasta tu fecha, <b>sin contar los 29 de febrero</b> (día 0.0 Hunab Ku, sin kin), y se aplica módulo 260. Verificado: 26-07-2013 = Kin 164 y 21-12-2012 = Kin 207.</p></div>' +
      '<div class="si-card"><h4>Cómo usar esta sección</h4><p style="font-size:12px">1️⃣ Ve a <b>☀️ Hoy</b> para tu energía diaria (afirmación + práctica).<br>2️⃣ Calcula tu kin en <b>Mi kin</b> (oráculo + onda natal + retorno).<br>3️⃣ Explora <b>Sellos</b> y <b>Tonos</b> tocando cada tarjeta para ver luz, sombra y pregunta.<br>4️⃣ Compara vínculos en <b>Sinastría</b> y registra en <b>Diario</b> cómo viviste el día.</p></div>' +
      '<div class="si-card"><h4>29 de febrero: 0.0 Hunab Ku</h4><p>El 29-feb no tiene kin ni avanza la cuenta. Quienes nacen ese día eligen el kin del 28-feb o del 1-mar. Así el ciclo solar-galáctico de 52 años se mantiene perfecto.</p></div>' +
      '<div class="menstrual-card"><h4>🎨 Los 4 colores / razas raíz</h4>' + coloresHTML + '</div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>🧭 Las direcciones</h4>' + dirsHTML + '</div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>🌈 Los 7 plasmas radiales (semana de 13 lunas)</h4><p class="muted" style="font-size:11px">Cada luna de 28 días trae 4 vueltas de estos 7 plasmas. Úsalos como ritual semanal junto a tu kin.</p>' + plasHTML + '</div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>📖 Glosario mínimo</h4>' + gloHTML + '</div>' +
      '<div class="si-card" style="border-left:3px solid var(--gold)"><h4>🙏 Oración a las 7 direcciones</h4><p>Rezo diario de apertura (Este · Norte · Oeste · Sur · Arriba · Abajo · Centro) con cierre <b>¡Ah Yum Hunab K\u2019u Evam Maya E Ma Ho!</b> La tienes completa en la pestaña <b>🙏 Oración</b>: recítala al amanecer antes de ver tu kin del día.</p></div>';
  }

  function detalleSelloDialog(num) {
    var s = SELLOS[num - 1]; if (!s) return;
    var g = SELLO_GUIA[num] || {};
    var fam = familiaDeSello(num);
    var kins = [];
    for (var n = 1; n <= 260; n++) { if (((n - 1) % 20) + 1 === num) kins.push(n); }
    var body = '<div class="si-card" style="border-left:3px solid ' + s.color + '">' +
      '<p style="font-size:12px"><b>Color:</b> ' + esc(s.colorNombre) + ' · <b>Dirección:</b> ' + esc(s.direccion) + ' · <b>Familia:</b> ' + esc(s.familia) + (fam ? ' (' + esc(fam.mision) + ')' : '') + '</p>' +
      '<p style="font-size:12px"><b>Poder:</b> ' + esc(s.poder) + ' · <b>Raza:</b> ' + esc(s.raza) + '</p>' +
      '<p style="font-size:12px">' + esc(s.desc) + '</p></div>' +
      '<div class="menstrual-card"><h4>💬 Afirmación</h4><p style="font-size:12px"><i>' + esc(g.afirma || '') + '</i></p></div>' +
      '<div class="menstrual-card" style="margin-top:8px"><h4>☯ Luz y sombra</h4><p style="font-size:12px">☀️ <b>Luz:</b> ' + esc(g.luz || '') + '<br>🌑 <b>Sombra:</b> ' + esc(g.sombra || '') + '</p>' +
      '<p style="font-size:12px;margin-top:4px">❓ <b>Pregunta:</b> ' + esc(g.pregunta || '') + '<br>👣 <b>Práctica:</b> ' + esc(g.practica || '') + '</p></div>' +
      '<div class="menstrual-card" style="margin-top:8px"><h4>🌀 Los 13 kins con este sello</h4><p style="font-size:11px">' + kins.map(function (k) { return 'Kin ' + k; }).join(' · ') + '</p>' +
      '<p class="muted" style="font-size:11px">Toca un kin en la pestaña Tzolkin para ver su tono y onda.</p></div>';
    var d = makeDialog('kinSelloDlg', s.num + ' · ' + s.n + ' (' + s.maya + ')', esc(s.cualidad), body);
    openDlg('kinSelloDlg');
  }

  function renderKinSellos() {
    var box = $('kinSellosBox'); if (!box) return;
    var q = (($('kinSellosQ') || {}).value || '').toLowerCase();
    var fil = SELLOS.filter(function (s) {
      var g = SELLO_GUIA[s.num] || {};
      if (q && (s.n + ' ' + s.maya + ' ' + s.cualidad + ' ' + s.keywords + ' ' + s.colorNombre + ' ' + s.direccion + ' ' + s.familia + ' ' + (g.afirma || '') + ' ' + (g.pregunta || '')).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    box.innerHTML = (fil.length ? fil.map(function (s) {
      var g = SELLO_GUIA[s.num] || {};
      return '<div class="si-card" data-sello="' + s.num + '" style="border-left:3px solid ' + s.color + ';cursor:pointer" title="Toca para ver detalle">' +
        '<h4 style="font-size:13px"><span style="color:' + s.color + '">●</span> ' + s.num + ' · ' + esc(s.n) + ' (' + esc(s.maya) + ')</h4>' +
        '<p style="font-size:11px"><b>Color:</b> ' + esc(s.colorNombre) + ' · <b>Dirección:</b> ' + esc(s.direccion) + ' · <b>Familia:</b> ' + esc(s.familia) + '</p>' +
        '<p style="font-size:11px"><b>Poder:</b> ' + esc(s.poder) + ' · <b>Raza:</b> ' + esc(s.raza) + '</p>' +
        '<p style="font-size:11px;margin-top:4px">' + esc(s.desc) + '</p>' +
        '<p style="font-size:11px;margin-top:4px"><i>“' + esc(g.afirma || '') + '”</i><br><span class="muted">❓ ' + esc(g.pregunta || '') + ' · Toca para luz/sombra/práctica →</span></p>' +
        '</div>';
    }).join('') : '<p class="muted">Sin resultados.</p>');
    try {
      box.querySelectorAll('[data-sello]').forEach(function (el) {
        el.onclick = function () { detalleSelloDialog(parseInt(el.getAttribute('data-sello'), 10)); };
      });
    } catch (e) {}
  }

  function renderKinTonos() {
    var box = $('kinTonosBox'); if (!box) return;
    box.innerHTML = TONOS.map(function (t) {
      var g = TONO_GUIA[t.num] || {};
      return '<div class="si-card" style="border-left:3px solid ' + t.color + '">' +
        '<h4 style="font-size:13px"><span style="color:' + t.color + '">●</span> ' + t.num + ' · ' + esc(t.nombre) + '</h4>' +
        '<p style="font-size:11px"><b>Poder:</b> ' + esc(t.poder) + ' · <b>Acción:</b> ' + esc(t.accion) + '</p>' +
        '<p style="font-size:11px">' + esc(t.desc) + '</p>' +
        '<p style="font-size:11px;margin-top:4px">❓ <b>Pregunta:</b> ' + esc(g.pregunta || '') + '<br>👣 <b>Práctica:</b> ' + esc(g.practica || '') + '<br><i>' + esc(g.meditacion || '') + '</i></p>' +
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

  function firmaMiKin(kin, nombre) {
    if (!kin || kin.hunabKu) return 'Mi kin: 0.0 Hunab Ku (29 de febrero, día fuera del tiempo).';
    var fam2 = familiaDeSello(kin.sello.num);
    return (nombre ? nombre + ' · ' : '') + 'Mi kin maya: Kin ' + kin.kin + ' · ' + kin.sello.n + ' (' + kin.sello.maya + ') ' + kin.tono.nombre +
      ' | Onda ' + kin.onda + ' de ' + kin.ondaSello + ' | Castillo: ' + kin.castilloNombre +
      ' | Familia ' + (fam2 ? fam2.nombre : '') + ' | Fecha: ' + kin.fecha + '\n' + afirmacionKin(kin);
  }
  function consejoSincronia(n) {
    if (n >= 4) return 'Día espejo: actúa como eres. Buen día para decidir e iniciar.';
    if (n >= 2) return 'Día aliado: apóyate en lo que coincide y observa lo distinto.';
    if (n >= 1) return 'Día puente: una coincidencia te sostiene; el resto te estira.';
    return 'Día maestro: integra energías distintas a la tuya. Escucha más, fuerza menos.';
  }

  function renderKinCalculo() {
    var box = $('kinCalculoBox'); if (!box) return;
    var data = getKinData();
    var kin = data.fechaNac ? calcKinMaya(data.fechaNac) : null;

    // ---- 1. Cabecera: datos + perfiles ----
    var perfOpts = (data.perfiles || []).map(function (p) {
      var kk = calcKinMaya(p.fecha);
      var det = (kk && !kk.hunabKu) ? (' · Kin ' + kk.kin) : '';
      return '<option value="' + esc(p.id) + '">' + esc(p.nombre || p.fecha) + ' (' + esc(p.fecha) + det + ')</option>';
    }).join('');
    var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>⭐ Mi kin</h4>' +
      '<p class="muted" style="font-size:11px">Tu firma galáctica natal. Guárdala una vez y úsala en Hoy, Sinastría y Diario. Dreamspell canónico: 26-07-1987 = Kin 34 · 29-feb = 0.0 Hunab Ku.</p>' +
      '<div class="conv-row"><label style="flex:1">Nombre (opcional) <input type="text" id="kinNombre" placeholder="ej: Ana" maxlength="30" value="' + esc(data.nombre || '') + '"></label>' +
      '<label>Fecha de nacimiento <input type="date" id="kinFechaNac" value="' + esc(data.fechaNac) + '"></label></div>' +
      '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap;gap:6px">' +
      '<button type="button" id="kinCalcBtn" class="btn btn-accent" style="width:auto">Calcular</button>' +
      '<button type="button" id="kinAddPerf" class="btn" style="width:auto">💾 Guardar perfil</button></div>' +
      ((data.perfiles || []).length ? '<div class="conv-row" style="margin-top:6px"><label style="flex:1">Perfiles guardados <select id="kinPerfSel"><option value="">— elegir —</option>' + perfOpts + '</select></label>' +
      '<button type="button" id="kinPerfLoad" class="btn" style="width:auto">Cargar</button>' +
      '<button type="button" id="kinPerfDel" class="btn" style="width:auto">✕</button></div>' : '') +
      '</div>';

    // ---- 2. Estado vacío ----
    if (!kin) {
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>👆 Empieza aquí</h4>' +
        '<p style="font-size:12px">Ingresa tu fecha arriba y pulsa <b>Calcular</b>. Verás tu sello, tono, oráculo, onda, ciclos y guía práctica.</p>' +
        '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap;gap:6px">' +
        '<button type="button" class="btn" style="width:auto" data-ej="hoy">Probar con hoy</button>' +
        '<button type="button" class="btn" style="width:auto" data-ej="1987-07-26">Ejemplo Kin 34</button>' +
        '<button type="button" class="btn" style="width:auto" data-ej="2012-12-21">Ejemplo Kin 207</button></div></div>';
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>🔎 Calculadora libre (cualquier fecha)</h4>' +
        '<div class="conv-row"><label style="flex:1">Fecha <input type="date" id="kinLibreFecha" value="' + esc(data.fechaLibre || '') + '"></label>' +
        '<button type="button" id="kinLibreGo" class="btn" style="width:auto">Ver kin</button></div><div id="kinLibreRes"></div></div>';
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>Historial de cálculos</h4><div id="kinHistorial"></div></div>';
      box.innerHTML = html;
      renderKinHistorial();
      wireKinCalcBase(data);
      return;
    }
    if (kin.hunabKu) {
      html += '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>0.0 Hunab Ku ✦</h4><p style="font-size:12px">' + esc(kin.nota) + '</p>' +
        '<p class="muted" style="font-size:11px">Naciste un día fuera del tiempo. Elige el kin del 28-feb o del 1-mar como tu firma de trabajo: calcúlalos en la calculadora libre de abajo.</p></div>';
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>🔎 Calculadora libre (cualquier fecha)</h4>' +
        '<div class="conv-row"><label style="flex:1">Fecha <input type="date" id="kinLibreFecha" value="' + esc(data.fechaLibre || '') + '"></label>' +
        '<button type="button" id="kinLibreGo" class="btn" style="width:auto">Ver kin</button></div><div id="kinLibreRes"></div></div>';
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>Nota personal</h4>' +
        '<textarea id="kinNota" rows="3" placeholder="¿Qué significa tu kin para ti? ¿Cómo lo vives?" maxlength="500">' + esc(data.nota) + '</textarea>' +
        '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="kinNotaSave" class="btn btn-accent" style="width:auto">Guardar nota</button></div></div>';
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>Historial de cálculos</h4><div id="kinHistorial"></div></div>';
      box.innerHTML = html;
      renderKinHistorial();
      wireKinCalcBase(data);
      return;
    }

    (function () {
      var familia = familiaDeSello(kin.sello.num);
      var orac = oraculoDe(kin);
      var hoyK = calcKinMaya(todayKey());
      var ret = proximoRetorno(todayKey(), kin.kin);
      var ondaKins = kinsDeOnda(kin.onda);
      var ondaInfo = ONDA_INFO[kin.onda - 1] || {};
      var posOnda = ((kin.kin - 1) % 13) + 1;
      var cast = CASTILLOS[kin.castillo - 1];
      var portal = esPortal(kin.kin);
      var gNat = SELLO_GUIA[kin.sello.num] || {};
      var tgNat = TONO_GUIA[kin.tono.num] || {};
      var quien = data.nombre ? esc(data.nombre) + ', tu' : 'Tu';

      // ---- 3. Ficha hero ----
      html += '<div class="menstrual-card" style="margin-top:10px;border-color:' + kin.sello.color + ';text-align:center">' +
        '<div style="font-size:42px;font-weight:800;color:' + kin.sello.color + ';line-height:1">' + kin.kin + '</div>' +
        '<h4 style="margin:4px 0">' + quien + ' kin: ' + esc(kin.sello.n) + ' ' + esc(kin.tono.nombre) + (portal ? ' · <span style="color:var(--gold)">Portal ✦</span>' : '') + '</h4>' +
        '<p style="font-size:12px"><b>' + esc(kin.sello.n) + '</b> (' + esc(kin.sello.maya) + ') · <b>' + esc(kin.tono.nombre) + '</b> · Onda ' + kin.onda + ' de ' + esc(kin.ondaSello) + ' · ' + esc(cast.nombre) + '</p>' +
        '<p style="font-size:13px"><i>' + esc(afirmacionKin(kin)) + '</i></p>' +
        '<div class="dlg-actions" style="justify-content:center;margin-top:8px;flex-wrap:wrap;gap:6px">' +
        '<button type="button" id="kinShareBtn" class="btn btn-accent" style="width:auto">📤 Compartir</button>' +
        '<button type="button" id="kinCopyBtn" class="btn" style="width:auto">📋 Copiar</button>' +
        '<button type="button" id="kinVerTz" class="btn" style="width:auto">🌀 Ver en Tzolkin</button>' +
        '<button type="button" id="kinLlevarHoy" class="btn" style="width:auto">📝 Llevar a nota de hoy</button></div></div>';

      // ---- 4. Tu energía en detalle ----
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>🔍 Tu energía en detalle</h4>' +
        '<div class="habit-item" style="align-items:flex-start"><div style="font-size:12px"><b>Sello ' + kin.sello.num + '/20 · ' + esc(kin.sello.n) + ' (' + esc(kin.sello.maya) + '):</b> ' + esc(kin.sello.poder) + ' · ' + esc(kin.sello.cualidad) + '<br><span class="muted">' + esc(kin.sello.desc) + '</span><br>☀️ Luz: ' + esc(gNat.luz || '') + ' · 🌑 Sombra: ' + esc(gNat.sombra || '') + '<br>❓ ' + esc(gNat.pregunta || '') + ' · 👣 ' + esc(gNat.practica || '') + '</div></div>' +
        '<div class="habit-item" style="align-items:flex-start"><div style="font-size:12px"><b>Tono ' + kin.tono.num + '/13 · ' + esc(kin.tono.nombre) + ':</b> ' + esc(kin.tono.poder) + ' / ' + esc(kin.tono.accion) + '<br><span class="muted">' + esc(kin.tono.desc) + '</span><br>❓ ' + esc(tgNat.pregunta || '') + ' · 👣 ' + esc(tgNat.practica || '') + ' · <i>' + esc(tgNat.meditacion || '') + '</i></div></div>' +
        '<p style="font-size:12px">🎨 <b>' + esc(kin.sello.colorNombre) + '</b> (' + esc(kin.sello.direccion) + ') · ' + esc(kin.sello.raza) + ' · 👪 <b>Familia ' + esc(familia ? familia.nombre : '') + '</b> — ' + esc(familia ? familia.mision : '') + '</p>' +
        '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap;gap:6px">' +
        '<button type="button" id="kinGoOnda" class="btn" style="width:auto">🌊 Ver mi onda</button>' +
        '<button type="button" id="kinGoCastillo" class="btn" style="width:auto">🏰 Ver mi castillo</button>' +
        '<button type="button" id="kinGoSinas" class="btn" style="width:auto">💞 Comparar en Sinastría</button></div></div>';

      // ---- 5. Oráculo explicado ----
      if (orac) {
        html += '<div class="menstrual-card" style="margin-top:10px"><h4>🌀 Oráculo de la 5ª fuerza</h4>' +
          '<p class="muted" style="font-size:11px">Tu kin desplegado en 5 poderes. Análogo y antípoda comparten tu tono; el oculto lo espeja (' + kin.tono.num + ' + ' + orac.oculto.tono.num + ' = 14). Toca 🔍 para ver cada kin en el Tzolkin.</p>';
        html += ['destino', 'analogo', 'antipoda', 'oculto', 'guia'].map(function (key) {
          var o = orac[key];
          var rol = ORACULO_ROL[key] || {};
          var extra = key === 'guia' && o.propio ? ' — guiado por tu propio poder duplicado' : '';
          return '<div class="habit-item" style="align-items:flex-start"><div style="font-size:12px"><b>' + esc(rol.titulo || o.rol) + ':</b> Kin ' + o.kin + ' · ' + esc(o.sello.n) + ' ' + esc(o.tono.nombre) + extra +
            '<br><span class="muted">' + esc(rol.txt || '') + '</span><br><span class="muted">' + esc(o.sello.poder) + ' · ' + esc(o.sello.cualidad) + '</span></div>' +
            '<button type="button" class="btn" style="width:auto" data-oratz="' + o.kin + '">🔍</button></div>';
        }).join('') + '</div>';
      }

      // ---- 6. Onda natal ----
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>🌊 Onda ' + kin.onda + ' de ' + esc(kin.ondaSello) + ' (tu onda natal)</h4>' +
        '<p style="font-size:12px"><b>Misión:</b> ' + esc(ondaInfo.mision || '') + ' · <b>Poder:</b> ' + esc(ondaInfo.poder || '') + '</p>' +
        '<p class="muted" style="font-size:11px">' + esc(ondaInfo.leccion || '') + ' Vas en la posición <b>' + posOnda + '/13</b> (tu tono). ❓ ' + esc(ondaInfo.pregunta || '') + '</p>' +
        '<table style="width:100%;font-size:11px;border-collapse:collapse">' +
        '<tr style="text-align:left"><th style="padding:4px">Tono</th><th style="padding:4px">Kin</th><th style="padding:4px">Sello</th></tr>' +
        ondaKins.map(function (w, idx) {
          var yo = (w.kin === kin.kin);
          return '<tr style="border-top:1px solid var(--line)' + (yo ? ';background:rgba(232,197,106,.12)' : '') + '"><td style="padding:4px">' + (idx + 1) + ' ' + esc(w.tono.nombre) + (yo ? ' ◀ tú' : '') + '</td><td style="padding:4px">' + w.kin + (esPortal(w.kin) ? ' ✦' : '') + '</td><td style="padding:4px;color:' + w.sello.color + '">' + esc(w.sello.n) + '</td></tr>';
        }).join('') + '</table></div>';

      // ---- 7. Ciclos y retornos ----
      var v = vueltasTzolkin(data.fechaNac, todayKey());
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>♻️ Tus ciclos</h4>';
      if (v) html += '<p style="font-size:12px">🎡 Has vivido <b>' + v.vueltas + ' vueltas completas</b> al Tzolkin (' + v.efectivos + ' días galácticos)' + (portal ? ' · tu kin es <b>portal</b>: cada retorno se siente fuerte.' : '') + '</p>';
      if (ret) html += '<p style="font-size:12px">🔁 <b>Próximo retorno galáctico:</b> ' + esc(ret.fecha) + ' (en <b>' + ret.dias + ' días</b> vuelve tu mismo kin: tu “cumpleaños maya”).</p>';
      else html += '<p class="muted" style="font-size:11px">No se pudo calcular el próximo retorno.</p>';
      try {
        var anioH = new Date().getFullYear();
        var filas = [];
        for (var a = anioH; a <= anioH + 2; a++) {
          var ka = kinDelAnio(data.fechaNac, a);
          if (ka && !ka.hunabKu) filas.push('<div class="habit-item"><div style="font-size:12px"><b>' + a + ':</b> Kin ' + ka.kin + ' · ' + esc(ka.sello.n) + ' ' + esc(ka.tono.nombre) + (a === anioH ? ' ◀ este año' : '') + '</div></div>');
        }
        html += '<p style="font-size:12px;margin-top:6px"><b>🎂 Tu kin de cumpleaños (año gregoriano):</b></p>' + filas.join('') +
          '<p class="muted" style="font-size:11px">Cada cumpleaños caes en un kin distinto: es tu “tono del año”. El ciclo completo fecha+kin se repite cada 52 años.</p>';
      } catch (eAnio) {}
      html += '</div>';

      // ---- 8. Hoy y tu kin ----
      if (hoyK && !hoyK.hunabKu) {
        var rel = [];
        if (hoyK.sello.num === kin.sello.num) rel.push('mismo sello (tu energía central)');
        if (hoyK.tono.num === kin.tono.num) rel.push('mismo tono (tu forma de actuar)');
        if (hoyK.onda === kin.onda) rel.push('misma onda encantada');
        if (hoyK.castillo === kin.castillo) rel.push('mismo castillo');
        var famHoy = familiaDeSello(hoyK.sello.num);
        if (famHoy && familia && famHoy.nombre === familia.nombre) rel.push('misma familia ' + famHoy.nombre);
        html += '<div class="menstrual-card" style="margin-top:10px"><h4>📍 Hoy y tu kin</h4>' +
          '<p style="font-size:12px"><b>Hoy:</b> ' + firmaCorta(hoyK) + ' · Onda ' + hoyK.onda + ' · Castillo ' + hoyK.castillo + '</p>' +
          (rel.length ? '<p style="font-size:12px"><b>Sincronías (' + rel.length + '):</b> ' + esc(rel.join(' · ')) + '.</p>' : '<p class="muted" style="font-size:11px">Hoy no coincide sello, tono, onda ni castillo.</p>') +
          '<p style="font-size:12px"><b>Consejo:</b> ' + esc(consejoSincronia(rel.length)) + '</p></div>';
      }

      // ---- 9. Guía práctica + ritual ----
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>🌱 Guía práctica de tu kin</h4>' +
        '<p style="font-size:12px">💬 <b>Afirmación:</b> <i>' + esc(afirmacionKin(kin)) + '</i><br>' +
        '👣 <b>Acción:</b> ' + esc(practicaKin(kin)) + '<br>' +
        '❓ <b>Preguntas:</b> ' + esc(gNat.pregunta || '') + ' / ' + esc(tgNat.pregunta || '') + '<br>' +
        '☀️ <b>Luz:</b> ' + esc(gNat.luz || kin.sello.cualidad) + ' · 🌑 <b>Sombra:</b> ' + esc(gNat.sombra || 'forzar o retener esa energía') + '.</p>' +
        '<p class="muted" style="font-size:11px">⏱️ <b>Ritual de 1 minuto:</b> lee tu afirmación en voz alta → respira 3 veces → haz hoy un gesto mínimo de ' + esc(kin.sello.poder.toLowerCase()) + '.</p></div>';

      // ---- 10. Calculadora libre ----
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>🔎 Calculadora libre (cualquier fecha)</h4>' +
        '<div class="conv-row"><label style="flex:1">Fecha <input type="date" id="kinLibreFecha" value="' + esc(data.fechaLibre || '') + '"></label>' +
        '<button type="button" id="kinLibreGo" class="btn" style="width:auto">Ver kin</button></div><div id="kinLibreRes"></div></div>';
    })();

    html += '<div class="menstrual-card" style="margin-top:10px"><h4>💌 Nota personal</h4>' +
      '<p class="muted" style="font-size:11px">¿Qué significa tu kin para ti? ¿Cuándo lo ves en acción? ¿Cuál es su sombra en ti?</p>' +
      '<textarea id="kinNota" rows="3" placeholder="Ej: Soy Luna Cristal: me cuesta fluir cuando..." maxlength="500">' + esc(data.nota) + '</textarea>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="kinNotaSave" class="btn btn-accent" style="width:auto">Guardar nota</button></div></div>';
    if ((data.perfiles || []).length) {
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>👪 Perfiles guardados</h4>' +
        data.perfiles.map(function (p) {
          var kk = calcKinMaya(p.fecha);
          var det = (kk && !kk.hunabKu) ? ('Kin ' + kk.kin + ' · ' + kk.sello.n + ' ' + kk.tono.nombre) : 'Hunab Ku';
          return '<div class="habit-item"><div><b>' + esc(p.nombre || p.fecha) + '</b> · ' + esc(p.fecha) + ' · ' + esc(det) + '</div>' +
            '<span style="display:flex;gap:6px"><button type="button" class="btn" style="width:auto" data-perfload="' + esc(p.id) + '">Cargar</button>' +
            '<button type="button" class="btn" style="width:auto" data-perfdel="' + esc(p.id) + '">✕</button></span></div>';
        }).join('') + '</div>';
    }
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>🕘 Historial de cálculos</h4><div id="kinHistorial"></div></div>';
    box.innerHTML = html;
    renderKinHistorial();
    wireKinCalcBase(data, kin);
  }

  function wireKinCalcBase(data, kin) {
    var btn = $('kinCalcBtn');
    if (btn) btn.onclick = function () {
      var f = $('kinFechaNac').value;
      if (!f) return alert('Ingresa tu fecha de nacimiento');
      var nm = clean((($('kinNombre') || {}).value || ''), 30);
      var d = getKinData();
      d.fechaNac = f; d.nombre = nm;
      d.historial = d.historial || [];
      var kk = calcKinMaya(f);
      d.historial.unshift({ fecha: f, kin: kk ? (kk.hunabKu ? '0.0 Hunab Ku' : kk.kin) : '?', sello: kk && kk.sello ? kk.sello.n : '', tono: kk && kk.tono ? kk.tono.nombre : '', cuando: todayKey() });
      if (d.historial.length > 20) d.historial = d.historial.slice(0, 20);
      save('Kin calculado');
      renderKinCalculo();
    };
    try {
      box0ej();
    } catch (e) {}
    function box0ej() {
      var box = $('kinCalculoBox'); if (!box) return;
      box.querySelectorAll('[data-ej]').forEach(function (b) {
        b.onclick = function () {
          var v = b.getAttribute('data-ej');
          var f = (v === 'hoy') ? todayKey() : v;
          var d = getKinData(); d.fechaNac = f; save('Kin calculado');
          renderKinCalculo();
        };
      });
    }
    var ap = $('kinAddPerf');
    if (ap) ap.onclick = function () {
      var f = ($('kinFechaNac') || {}).value || '';
      var nm = clean((($('kinNombre') || {}).value || ''), 30);
      if (!f) return alert('Primero ingresa una fecha');
      var d = getKinData(); d.perfiles = d.perfiles || [];
      if (d.perfiles.filter(function (p) { return p.fecha === f && (p.nombre || '') === nm; }).length) return alert('Ese perfil ya está guardado');
      d.perfiles.push({ id: uid('perf'), nombre: nm, fecha: f });
      if (d.perfiles.length > 12) d.perfiles = d.perfiles.slice(-12);
      save('Perfil guardado');
      renderKinCalculo();
    };
    var pl = $('kinPerfLoad');
    if (pl) pl.onclick = function () {
      var sel = $('kinPerfSel'); if (!sel || !sel.value) return alert('Elige un perfil');
      var d = getKinData();
      var p = (d.perfiles || []).filter(function (x) { return x.id === sel.value; })[0];
      if (!p) return;
      d.fechaNac = p.fecha; d.nombre = p.nombre || '';
      save('Perfil cargado'); renderKinCalculo();
    };
    var pd = $('kinPerfDel');
    if (pd) pd.onclick = function () {
      var sel = $('kinPerfSel'); if (!sel || !sel.value) return;
      var d = getKinData();
      d.perfiles = (d.perfiles || []).filter(function (x) { return x.id !== sel.value; });
      save('Perfil borrado'); renderKinCalculo();
    };
    try {
      var box2 = $('kinCalculoBox');
      if (box2) {
        box2.querySelectorAll('[data-perfload]').forEach(function (b) {
          b.onclick = function () {
            var d = getKinData();
            var p = (d.perfiles || []).filter(function (x) { return x.id === b.getAttribute('data-perfload'); })[0];
            if (!p) return;
            d.fechaNac = p.fecha; d.nombre = p.nombre || '';
            save('Perfil cargado'); renderKinCalculo();
          };
        });
        box2.querySelectorAll('[data-perfdel]').forEach(function (b) {
          b.onclick = function () {
            var d = getKinData();
            d.perfiles = (d.perfiles || []).filter(function (x) { return x.id !== b.getAttribute('data-perfdel'); });
            save('Perfil borrado'); renderKinCalculo();
          };
        });
        box2.querySelectorAll('[data-oratz]').forEach(function (b) {
          b.onclick = function () {
            _kinVerTz = parseInt(b.getAttribute('data-oratz'), 10) || 0;
            switchKinTab('Tzolkin');
            try { renderKinTzolkin(); } catch (e) {}
          };
        });
      }
    } catch (e) {}
    var goS = $('kinGoSinas');
    if (goS) goS.onclick = function () {
      try {
        var dd = getKinData();
        if (kin && !kin.hunabKu && $('kinFechaNac') && $('kinFechaNac').value) dd.fechaNac = $('kinFechaNac').value;
        save();
      } catch (e) {}
      switchKinTab('Sinas');
      try { renderKinSinas(); } catch (e2) {}
    };
    var go = $('kinGoOnda');
    if (go) go.onclick = function () { switchKinTab('Onda'); };
    var gc = $('kinGoCastillo');
    if (gc) gc.onclick = function () { switchKinTab('Castillo'); };
    var ns = $('kinNotaSave');
    if (ns) ns.onclick = function () {
      var d = getKinData();
      d.nota = clean($('kinNota').value, 500);
      try { d.nombre = clean((($('kinNombre') || {}).value || d.nombre || ''), 30); } catch (e) {}
      save('Nota guardada');
      try { alert('Guardado ✓'); } catch (e2) {}
    };
    var lb = $('kinLibreGo');
    if (lb) lb.onclick = function () {
      var f = $('kinLibreFecha').value;
      var r = $('kinLibreRes'); if (!r) return;
      if (!f) { r.innerHTML = '<p class="muted">Elige una fecha.</p>'; return; }
      var kk = calcKinMaya(f);
      var dd = getKinData(); dd.fechaLibre = f; save();
      if (!kk) { r.innerHTML = '<p class="muted">Fecha no válida.</p>'; return; }
      if (kk.hunabKu) { r.innerHTML = '<p style="font-size:12px"><b>0.0 Hunab Ku</b>: ' + esc(kk.nota) + '</p>'; return; }
      r.innerHTML = '<p style="font-size:12px;margin-top:6px"><b>' + firmaLarga(kk) + '</b>' + (esPortal(kk.kin) ? ' · <span style="color:var(--gold)">Portal ✦</span>' : '') +
        '<br><span class="muted">' + esc(afirmacionKin(kk)) + '</span></p>';
    };
    var sh = $('kinShareBtn');
    if (sh && kin) sh.onclick = function () { share('Mi Kin Maya', firmaMiKin(kin, (($('kinNombre') || {}).value || ''))); };
    var cp = $('kinCopyBtn');
    if (cp && kin) cp.onclick = function () {
      var t = firmaMiKin(kin, (($('kinNombre') || {}).value || ''));
      try {
        if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { alert('Firma copiada'); }, function () { alert(t); });
        else alert(t);
      } catch (e) { try { alert(t); } catch (e2) {} }
    };
    var vt = $('kinVerTz');
    if (vt && kin) vt.onclick = function () {
      _kinVerTz = kin.kin;
      switchKinTab('Tzolkin');
      try { renderKinTzolkin(); } catch (e) {}
    };
    var lv = $('kinLlevarHoy');
    if (lv && kin) lv.onclick = function () {
      try {
        var info = (typeof todayInfo === 'function') ? todayInfo() : null;
        if (!info) return alert('No se pudo ubicar hoy');
        var nm = (($('kinNombre') || {}).value || '');
        var note = ('⭐ ' + firmaMiKin(kin, nm)).slice(0, 900);
        if (info.luna === 'dft') { var c = cyc(currentCycleYear()); c.dft.nota = (c.dft.nota ? c.dft.nota + '\n' : '') + note; }
        else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + note; }
        save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
        alert('Firma llevada a la nota de hoy ✓');
      } catch (e2) { alert('No se pudo llevar a la nota'); }
    };
  }

  function renderKinHistorial() {
    var box = $('kinHistorial'); if (!box) return;
    var h = getKinData().historial || [];
    if (!h.length) { box.innerHTML = '<p class="muted">Sin cálculos aún.</p>'; return; }
    var counts = {};
    h.forEach(function (r) { var k = String(r.kin); counts[k] = (counts[k] || 0) + 1; });
    var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 3);
    box.innerHTML = '<p class="muted" style="font-size:11px">Más consultados: ' + top.map(function (k) { return 'Kin ' + esc(k) + ' (×' + counts[k] + ')'; }).join(' · ') + '</p>' +
      h.map(function (r) {
        var det = (r.sello || r.tono) ? ' · ' + esc(r.sello || '') + ' ' + esc(r.tono || '') : '';
        return '<div class="habit-item"><div><b>' + esc(r.fecha) + '</b> · Kin ' + esc(String(r.kin)) + det + ' <span class="muted" style="font-size:11px">· ' + esc(r.cuando || '') + '</span></div>' +
          '<button type="button" class="btn" style="width:auto" data-kinfecha="' + esc(r.fecha) + '">Ver</button></div>';
      }).join('') +
      '<div class="dlg-actions" style="justify-content:flex-end"><button type="button" id="kinHistClear" class="btn" style="width:auto">🗑 Borrar historial</button></div>';
    try {
      box.querySelectorAll('[data-kinfecha]').forEach(function (b) {
        b.onclick = function () {
          var f = b.getAttribute('data-kinfecha');
          var d = getKinData(); d.fechaNac = f; save('Kin cargado');
          renderKinCalculo();
          try { var inp = $('kinFechaNac'); if (inp) inp.scrollIntoView({ block: 'center' }); } catch (e) {}
        };
      });
      var hc = $('kinHistClear');
      if (hc) hc.onclick = function () {
        if (!confirm('¿Borrar el historial de cálculos?')) return;
        var d = getKinData(); d.historial = [];
        save('Historial borrado'); renderKinHistorial();
      };
    } catch (e) {}
  }

  // ---- ☀️ Kin de hoy: afirmación, práctica, oráculo y plasma ----
  function renderKinHoy() {
    var box = $('kinHoyBox'); if (!box) return;
    var hoy = todayKey();
    var k = calcKinMaya(hoy);
    if (!k) { box.innerHTML = '<p class="muted">No se pudo calcular hoy.</p>'; return; }
    if (k.hunabKu) { box.innerHTML = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>Hoy: 0.0 Hunab Ku ✦</h4><p style="font-size:12px">' + esc(k.nota) + '</p><p class="muted" style="font-size:11px">Día fuera del tiempo: medita, perdona, no firmes nada importante.</p></div>'; return; }
    var g = SELLO_GUIA[k.sello.num] || {};
    var tg = TONO_GUIA[k.tono.num] || {};
    var fam = familiaDeSello(k.sello.num);
    var orac = oraculoDe(k);
    var l = lunaDeFecha(hoy);
    var plasma = l ? plasmaDeLunaDia(l.dia) : null;
    var html = '<div class="menstrual-card" style="border-color:' + k.sello.color + '"><h4>☀️ Hoy · ' + esc(hoy) + ' ' + (esPortal(k.kin) ? '· <span style="color:var(--gold)">Portal galáctico ✦</span>' : '') + '</h4>' +
      '<p style="font-size:15px"><b>Kin ' + k.kin + ' · ' + esc(k.sello.n) + ' (' + esc(k.sello.maya) + ') ' + esc(k.tono.nombre) + '</b></p>' +
      '<p style="font-size:12px"><b>Onda ' + k.onda + ' de ' + esc(k.ondaSello) + '</b> · <b>Castillo:</b> ' + esc(k.castilloNombre) + ' · <b>Familia:</b> ' + esc(fam ? fam.nombre : '') + '</p>' +
      (l ? '<p style="font-size:12px"><b>' + esc(lunaTxt(hoy)) + '</b>' + (plasma ? ' · <b>Plasma ' + esc(plasma.nombre) + '</b> (' + esc(plasma.chakra) + ' · ' + esc(plasma.mantra) + ')' : '') + '</p>' : '') +
      (esPortal(k.kin) ? '<p style="font-size:11px;color:var(--gold)"><b>Día portal:</b> energía intensa. Medita, respira, evita decisiones en caliente.</p>' : '') + '</div>' +
      '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>💬 Afirmación de hoy</h4>' +
      '<p style="font-size:13px"><i>' + esc(afirmacionKin(k)) + '</i></p>' +
      '<p style="font-size:12px;margin-top:6px">❓ <b>Pregunta:</b> ' + esc(g.pregunta || '') + ' · ' + esc(tg.pregunta || '') + '</p>' +
      '<p style="font-size:12px">👣 <b>Práctica:</b> ' + esc(practicaKin(k)) + '</p>' +
      '<p class="muted" style="font-size:11px">☀️ Luz: ' + esc(g.luz || '') + ' · 🌑 Sombra: ' + esc(g.sombra || '') + '</p>' +
      '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap;gap:6px;margin-top:8px">' +
      '<button type="button" id="kinHoyShare" class="btn btn-accent" style="width:auto">📤 Compartir</button>' +
      '<button type="button" id="kinHoyCopy" class="btn" style="width:auto">📋 Copiar</button>' +
      '<button type="button" id="kinHoyLlevar" class="btn" style="width:auto">📝 Llevar a nota de hoy</button></div></div>';
    if (orac) {
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>🌀 Oráculo del día (5ª fuerza)</h4>' +
        ['destino', 'analogo', 'antipoda', 'oculto', 'guia'].map(function (key) {
          var o = orac[key];
          return '<div class="habit-item" style="align-items:flex-start"><div><b>' + esc(o.rol) + ':</b> Kin ' + o.kin + ' · ' + esc(o.sello.n) + ' ' + esc(o.tono.nombre) +
            '<br><span class="muted" style="font-size:11px">' + esc(o.sello.poder) + '</span></div></div>';
        }).join('') + '</div>';
    }
    box.innerHTML = html;
    var txt = 'Kin de hoy ' + hoy + ': ' + firmaLarga(k) + '\n' + afirmacionKin(k) + '\nPráctica: ' + practicaKin(k);
    var sh = $('kinHoyShare'); if (sh) sh.onclick = function () { share('Kin de hoy', txt); };
    var cp = $('kinHoyCopy'); if (cp) cp.onclick = function () {
      try { if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { alert('Kin de hoy copiado'); }, function () { alert(txt); }); else alert(txt); }
      catch (e) { try { alert(txt); } catch (e2) {} }
    };
    var lv = $('kinHoyLlevar'); if (lv) lv.onclick = function () {
      try {
        var info = (typeof todayInfo === 'function') ? todayInfo() : null;
        if (!info) return alert('No se pudo ubicar hoy');
        var note = ('☀️ ' + txt).slice(0, 900);
        if (info.luna === 'dft') { var c = cyc(currentCycleYear()); c.dft.nota = (c.dft.nota ? c.dft.nota + '\n' : '') + note; }
        else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + note; }
        save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
        alert('Kin de hoy llevado a la nota ✓');
      } catch (e2) { alert('No se pudo llevar a la nota'); }
    };
  }

  // ---- 🌊 Las 20 ondas encantadas con selector ----
  function renderKinOnda() {
    var box = $('kinOndaBox'); if (!box) return;
    var hoy = todayKey();
    var kinHoy = calcKinMaya(hoy);
    var ondaHoy = (kinHoy && !kinHoy.hunabKu) ? kinHoy.onda : 1;
    var sel = selOndaActual() || ondaHoy;
    var info = ONDA_INFO[sel - 1];
    var kins = kinsDeOnda(sel);
    var opts = ONDA_INFO.map(function (o, i) {
      return '<option value="' + (i + 1) + '"' + ((i + 1) === sel ? ' selected' : '') + '>Onda ' + (i + 1) + ' · ' + esc(o.sello) + ((i + 1) === ondaHoy ? ' ◀ hoy' : '') + '</option>';
    }).join('');
    var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌊 Ondas encantadas (20 × 13 días)</h4>' +
      '<div class="conv-row"><label style="flex:1">Elige onda <select id="kinOndaSel">' + opts + '</select></label></div>' +
      '<p class="muted" style="font-size:11px">Cada onda la rige un sello y recorre los 13 tonos. La onda de hoy es la <b>' + ondaHoy + ' de ' + esc(ONDAS[ondaHoy - 1]) + '</b>.</p></div>' +
      '<div class="menstrual-card" style="margin-top:10px;border-color:' + (SELLOS.filter(function (s) { return s.n === info.sello; })[0] || {}).color + '"><h4>Onda ' + sel + ' de ' + esc(info.sello) + (sel === ondaHoy ? ' ◀ estás aquí' : '') + '</h4>' +
      '<p style="font-size:12px"><b>Misión:</b> ' + esc(info.mision) + ' · <b>Poder:</b> ' + esc(info.poder) + '</p>' +
      '<p style="font-size:12px"><b>Lección:</b> ' + esc(info.leccion) + '</p>' +
      '<p class="muted" style="font-size:11px">❓ Pregunta de la onda: <b>' + esc(info.pregunta) + '</b></p>' +
      '<table style="width:100%;font-size:11px;border-collapse:collapse;margin-top:6px">' +
      '<tr style="text-align:left"><th style="padding:4px">Tono</th><th style="padding:4px">Kin</th><th style="padding:4px">Firma</th><th style="padding:4px"></th></tr>' +
      kins.map(function (w, idx) {
        var yo = kinHoy && !kinHoy.hunabKu && w.kin === kinHoy.kin;
        return '<tr style="border-top:1px solid var(--line)' + (yo ? ';background:rgba(232,197,106,.12)' : '') + '"><td style="padding:4px">' + (idx + 1) + ' ' + esc(w.tono.nombre) + '</td><td style="padding:4px">' + w.kin + (esPortal(w.kin) ? ' ✦' : '') + '</td><td style="padding:4px;color:' + w.sello.color + '">' + esc(w.sello.n) + '</td><td style="padding:4px">' + (yo ? '◀ hoy' : '') + '</td></tr>';
      }).join('') + '</table></div>';
    if (kinHoy && !kinHoy.hunabKu) {
      var posEnOnda = ((kinHoy.kin - 1) % 13) + 1;
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>📍 Tú hoy en la onda</h4>' +
        '<p style="font-size:12px"><b>Kin ' + kinHoy.kin + ' (' + esc(kinHoy.sello.n) + ' ' + esc(kinHoy.tono.nombre) + ')</b> · posición ' + posEnOnda + '/13 de la onda ' + ondaHoy + '.</p>' +
        '<p class="muted" style="font-size:11px">Tono ' + kinHoy.tono.num + ' = ' + esc(kinHoy.tono.poder) + ' / ' + esc(kinHoy.tono.accion) + '. Pregunta: ' + esc((TONO_GUIA[kinHoy.tono.num] || {}).pregunta || '') + '</p></div>';
    }
    box.innerHTML = html;
    var s = $('kinOndaSel'); if (s) s.onchange = function () { renderKinOnda(); };
  }

  // ---- ✦ Portales galácticos ----
  function renderKinPortales() {
    var box = $('kinPortalesBox'); if (!box) return;
    var prox = proximosKins(30, todayKey()).filter(function (r) { return r.kin && !r.kin.hunabKu && esPortal(r.kin.kin); });
    var lista = GAP_KINS.map(function (n) { return 'Kin ' + n; }).join(' · ');
    var html = '<div class="si-card"><h4>✦ ¿Qué es un portal galáctico (GAP)?</h4><p>Son <b>52 kins de activación intensa</b>: columnas centrales del Tzolkin donde la energía entra más fuerte. Días para <b>meditar, crear y observar</b>; evita firmar o discutir en caliente. Si tu kin natal es portal, eres “puerta”: activas a otros con tu presencia.</p></div>' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🔜 Próximos portales (30 días)</h4>' +
      (prox.length ? prox.map(function (r) {
        return '<div class="habit-item"><div><b>' + esc(r.fecha) + '</b> · Kin ' + r.kin.kin + ' · ' + esc(r.kin.sello.n) + ' ' + esc(r.kin.tono.nombre) + '</div></div>';
      }).join('') : '<p class="muted">Sin portales en los próximos 30 días (raro: revisa tu fecha).</p>') + '</div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>📜 Los 52 kins portal</h4><p style="font-size:11px">' + esc(lista) + '</p></div>';
    box.innerHTML = html;
  }

  // ---- 💞 Sinastría: comparar dos kins ----
  function renderKinSinas() {
    var box = $('kinSinasBox'); if (!box) return;
    var d = getKinData();
    var hoy = todayKey();
    var fA = d.fechaNac || '';
    var fB = d.sinasB || hoy;
    var kA = fA ? calcKinMaya(fA) : null;
    var kB = fB ? calcKinMaya(fB) : null;
    var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>💞 Sinastría galáctica</h4>' +
      '<p class="muted" style="font-size:11px">Compara dos firmas: pareja, hijo, socio, amigo. No es “compatible o no”: muestra dónde fluyen y dónde se enseñan.</p>' +
      '<div class="conv-row"><label>Persona 1 <input type="date" id="kinSinasA" value="' + esc(fA) + '"></label>' +
      '<label>Persona 2 <input type="date" id="kinSinasB" value="' + esc(fB) + '"></label></div>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="kinSinasGo" class="btn btn-accent" style="width:auto">Comparar</button></div></div>';
    if (kA && !kA.hunabKu && kB && !kB.hunabKu) {
      var c = compatKins(kA, kB);
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>' + firmaCorta(kA) + ' × ' + firmaCorta(kB) + '</h4>' +
        '<p style="font-size:13px"><b>' + esc(c.nivel) + '</b> (' + c.puntos + ' pts)</p>' +
        c.notas.map(function (n) { return '<div class="habit-item" style="align-items:flex-start"><div style="font-size:12px">' + esc(n) + '</div></div>'; }).join('') +
        '<p class="muted" style="font-size:11px;margin-top:6px">Consejo: el Antípoda no es enemigo: es el maestro. El Análogo es el mejor aliado para proyectos.</p>' +
        '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="kinSinasShare" class="btn" style="width:auto">📤 Compartir</button></div></div>';
    } else if ((kA && kA.hunabKu) || (kB && kB.hunabKu)) {
      html += '<div class="menstrual-card" style="margin-top:10px"><p style="font-size:12px">Una de las fechas es 29-feb (0.0 Hunab Ku): usa 28-feb o 1-mar para comparar.</p></div>';
    }
    box.innerHTML = html;
    var go = $('kinSinasGo');
    if (go) go.onclick = function () {
      var dd = getKinData();
      dd.fechaNac = $('kinSinasA').value;
      dd.sinasB = $('kinSinasB').value;
      save('Sinastría calculada');
      renderKinSinas();
    };
    var sh2 = $('kinSinasShare');
    if (sh2 && kA && kB) sh2.onclick = function () {
      var cc = compatKins(kA, kB);
      share('Sinastría Kin Maya', firmaLarga(kA) + '  ×  ' + firmaLarga(kB) + '\n' + cc.nivel + '\n' + cc.notas.join('\n'));
    };
  }

  // ---- 🌀 Tzolkin visual 260 ----
  function renderKinTzolkin() {
    var box = $('kinTzolkinBox'); if (!box) return;
    var q = (($('kinTzolkinQ') || {}).value || '').trim();
    var hoyK = calcKinMaya(todayKey());
    var data = getKinData();
    var mio = data.fechaNac ? calcKinMaya(data.fechaNac) : null;
    var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌀 Tzolkin 260: busca tu kin</h4>' +
      '<div class="conv-row"><label style="flex:1">Kin 1–260 o fecha <input type="text" id="kinTzolkinQ" placeholder="ej: 34, 207 o 1990-05-17" value="' + esc(q) + '"></label>' +
      '<button type="button" id="kinTzolkinGo" class="btn btn-accent" style="width:auto">Ver</button></div>' +
      '<div id="kinTzolkinRes"></div></div>';
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>Matriz 13 tonos × 20 sellos</h4>' +
      '<p class="muted" style="font-size:11px">Toca un kin para ver su firma. ✦ = portal · <span style="color:var(--gold)">dorado = hoy</span>' + (mio && !mio.hunabKu ? ' · <span style="color:#7ab8ff">azul = tu kin</span>' : '') + '.</p>' +
      '<div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:10px;min-width:560px">';
    html += '<tr><th style="padding:3px">Tono \\ Sello</th>' + SELLOS.map(function (s) { return '<th style="padding:3px" title="' + esc(s.n) + '">' + s.num + '</th>'; }).join('') + '</tr>';
    for (var t = 1; t <= 13; t++) {
      html += '<tr><td style="padding:3px"><b>' + t + '</b></td>';
      for (var sN = 1; sN <= 20; sN++) {
        var kn = kinPorSelloTono(sN, t);
        var isHoy = hoyK && !hoyK.hunabKu && hoyK.kin === kn;
        var isMio = mio && !mio.hunabKu && mio.kin === kn;
        var bg = isHoy ? 'background:rgba(232,197,106,.35);' : isMio ? 'background:rgba(122,184,255,.3);' : '';
        var dot = esPortal(kn) ? '✦' : '';
        html += '<td style="padding:3px;border:1px solid var(--line);text-align:center;' + bg + '"><button type="button" data-tzkin="' + kn + '" style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--text)" title="Kin ' + kn + '">' + kn + dot + '</button></td>';
      }
      html += '</tr>';
    }
    html += '</table></div></div>';
    box.innerHTML = html;
    try {
      box.querySelectorAll('[data-tzkin]').forEach(function (b) {
        b.onclick = function () {
          var kn = parseInt(b.getAttribute('data-tzkin'), 10);
          var kc = kinCompleto(kn);
          var r = $('kinTzolkinRes'); if (!r || !kc) return;
          r.innerHTML = '<p style="font-size:12px;margin-top:8px"><b>' + firmaLarga(kc) + '</b>' + (esPortal(kn) ? ' · <span style="color:var(--gold)">Portal ✦</span>' : '') + '<br><span class="muted">' + esc(afirmacionKin(kc)) + '</span></p>';
          try { r.scrollIntoView({ block: 'nearest' }); } catch (e) {}
        };
      });
    } catch (e) {}
    var go = $('kinTzolkinGo');
    if (go) go.onclick = function () {
      var v = ($('kinTzolkinQ').value || '').trim();
      var r = $('kinTzolkinRes'); if (!r) return;
      var kc = null;
      if (/^\d{1,3}$/.test(v)) kc = kinCompleto(parseInt(v, 10));
      else if (/^\d{4}-\d{2}-\d{2}$/.test(v)) kc = calcKinMaya(v);
      if (!kc || kc.hunabKu) { r.innerHTML = '<p class="muted" style="font-size:12px">Kin no válido (1–260 o fecha YYYY-MM-DD).</p>'; return; }
      r.innerHTML = '<p style="font-size:12px;margin-top:8px"><b>' + firmaLarga(kc) + '</b>' + (esPortal(kc.kin) ? ' · <span style="color:var(--gold)">Portal ✦</span>' : '') + '<br><span class="muted">' + esc(afirmacionKin(kc)) + ' ' + esc(practicaKin(kc)) + '</span></p>';
    };
    if (_kinVerTz >= 1 && _kinVerTz <= 260) {
      var kc2 = kinCompleto(_kinVerTz);
      var r2 = $('kinTzolkinRes');
      if (kc2 && r2) {
        r2.innerHTML = '<p style="font-size:12px;margin-top:8px"><b>' + firmaLarga(kc2) + '</b>' + (esPortal(kc2.kin) ? ' · <span style="color:var(--gold)">Portal ✦</span>' : '') + '<br><span class="muted">' + esc(afirmacionKin(kc2)) + ' ' + esc(practicaKin(kc2)) + '</span></p>';
        try { var qi = $('kinTzolkinQ'); if (qi) qi.value = String(_kinVerTz); } catch (e) {}
      }
      _kinVerTz = 0;
    }
  }

  // ---- 📓 Diario del kin ----
  function renderKinDiario() {
    var box = $('kinDiarioBox'); if (!box) return;
    var d = getKinData();
    d.diario = d.diario || [];
    var hoy = todayKey();
    var k = calcKinMaya(hoy);
    var ex = d.diario.filter(function (r) { return r.fecha === hoy; })[0];
    var counts = {};
    d.diario.forEach(function (r) { counts[r.kin] = (counts[r.kin] || 0) + 1; });
    var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 5);
    var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📓 ¿Cómo viviste el kin de hoy?</h4>' +
      '<p style="font-size:12px"><b>' + esc(hoy) + '</b> · ' + esc(firmaCorta(k)) + '</p>' +
      '<div class="conv-row"><label>Energía (1–5) <select id="kinDiaPts">' + [5, 4, 3, 2, 1].map(function (n) { return '<option value="' + n + '"' + (ex && ex.pts === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label></div>' +
      '<label>Nota <input type="text" id="kinDiaNota" placeholder="¿Cómo se expresó el sello/tono hoy?" maxlength="140" value="' + esc(ex ? ex.nota : '') + '"></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start;margin-top:6px"><button type="button" id="kinDiaSave" class="btn btn-accent" style="width:auto">Guardar hoy</button></div>' +
      (top.length ? '<p class="muted" style="font-size:11px;margin-top:6px">Tus kins más vividos: ' + top.map(function (n) { return 'Kin ' + n + ' (×' + counts[n] + ')'; }).join(' · ') + '</p>' : '') + '</div>';
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>Historial (' + d.diario.length + ')</h4>' +
      (d.diario.length ? d.diario.slice().reverse().slice(0, 30).map(function (r) {
        return '<div class="habit-item"><div><b>' + esc(r.fecha) + '</b> · Kin ' + esc(String(r.kin)) + ' · ' + '★'.repeat(r.pts) + '<br><span class="muted" style="font-size:11px">' + esc(r.nota || '') + '</span></div>' +
          '<button type="button" class="btn" style="width:auto" data-diadel="' + esc(r.fecha) + '">✕</button></div>';
      }).join('') : '<p class="muted">Aún sin registros. Guarda cómo viviste hoy y vuelve mañana.</p>') + '</div>';
    box.innerHTML = html;
    var sv = $('kinDiaSave');
    if (sv) sv.onclick = function () {
      var dd = getKinData(); dd.diario = dd.diario || [];
      var kk = calcKinMaya(todayKey());
      var rec = { fecha: todayKey(), kin: kk && !kk.hunabKu ? kk.kin : 0, pts: parseInt($('kinDiaPts').value, 10) || 3, nota: clean($('kinDiaNota').value, 140) };
      dd.diario = dd.diario.filter(function (r) { return r.fecha !== rec.fecha; });
      dd.diario.push(rec);
      save('Diario kin guardado');
      renderKinDiario();
    };
    try {
      box.querySelectorAll('[data-diadel]').forEach(function (b) {
        b.onclick = function () {
          var dd = getKinData();
          dd.diario = (dd.diario || []).filter(function (r) { return r.fecha !== b.getAttribute('data-diadel'); });
          save('Registro borrado'); renderKinDiario();
        };
      });
    } catch (e) {}
  }

  function renderKinLunas() {
    var box = $('kinLunasBox'); if (!box) return;
    var hoy = todayKey();
    var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌙 Kin maya y las 13 lunas</h4>' +
      '<p class="muted" style="font-size:11px">El Tzolkin (260 días) y las 13 lunas (364 días) se entrelazan: cada día lunar tiene su kin. Aquí van los próximos 28 días desde hoy con su luna, plasma y kin.</p></div>';
    var l = lunaDeFecha(hoy);
    if (l) {
      var plasma = plasmaDeLunaDia(l.dia);
      html += '<div class="menstrual-card" style="margin-top:10px"><h4>' + esc(lunaTxt(hoy)) + '</h4>' +
        (plasma ? '<p style="font-size:12px"><b>Plasma ' + esc(plasma.nombre) + '</b> · ' + esc(plasma.chakra) + ' · mantra ' + esc(plasma.mantra) + '<br><span class="muted">' + esc(plasma.practica) + '</span></p>' : '') + '</div>';
    } else {
      html += '<div class="menstrual-card" style="margin-top:10px"><p class="muted" style="font-size:11px">Hoy estás fuera de luna mapeada: igual puedes leer los kins de los próximos días.</p></div>';
    }
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>Próximos 28 días: luna + kin</h4><table style="width:100%;font-size:11px;border-collapse:collapse">' +
      '<tr style="text-align:left"><th style="padding:4px">Fecha</th><th style="padding:4px">Luna</th><th style="padding:4px">Kin</th><th style="padding:4px">Firma</th></tr>';
    proximosKins(28, hoy).forEach(function (r, i) {
      var lt = lunaTxt(r.fecha);
      var f = (r.kin && !r.kin.hunabKu) ? ('<b>' + r.kin.kin + (esPortal(r.kin.kin) ? ' ✦' : '') + '</b></td><td style="padding:4px;color:' + r.kin.sello.color + '">' + esc(r.kin.sello.n) + ' ' + esc(r.kin.tono.nombre)) : ('0.0 Hunab Ku</td><td style="padding:4px">—');
      html += '<tr style="border-top:1px solid var(--line)' + (i === 0 ? ';background:rgba(232,197,106,.12)' : '') + '"><td style="padding:4px">' + (i === 0 ? 'Hoy ' : '') + esc(r.fecha.slice(5)) + '</td><td style="padding:4px">' + esc(lt || '—') + '</td><td style="padding:4px">' + f + '</td></tr>';
    });
    html += '</table></div>';
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>Guía de lectura</h4>' +
      '<p style="font-size:11px">• <b>Kin natal:</b> tu esencia fija (pestaña Mi kin).<br>• <b>Kin del día:</b> la energía del momento (pestaña Hoy).<br>• <b>Plasma:</b> el ritual semanal (Dali→Silio).<br>• <b>Portal ✦:</b> día intenso: medita antes de actuar.</p></div>';
    box.innerHTML = html;
  }

  // Oración a las 7 direcciones galácticas (tradición Dreamspell / Ley del Tiempo).
  // Se recita al amanecer, orientando cuerpo y atención a cada dirección.
  var ORACION_DIRECCIONES = [
    { desde: 'Desde el Este', dir: 'Este', casa: 'Casa de la Luz', icon: '🌅', color: '#e53935', texto: 'Que la sabiduría se abra en aurora sobre nosotros, para que veamos las cosas con claridad.' },
    { desde: 'Desde el Norte', dir: 'Norte', casa: 'Casa de la Noche', icon: '🌌', color: '#eceff1', texto: 'Que la sabiduría madure en nosotros, para que conozcamos todo desde adentro.' },
    { desde: 'Desde el Oeste', dir: 'Oeste', casa: 'Casa de la Transformación', icon: '🌇', color: '#1e88e5', texto: 'Que la sabiduría se transforme en acción correcta, para que hagamos lo que debe ser hecho.' },
    { desde: 'Desde el Sur', dir: 'Sur', casa: 'Casa del Sol Eterno', icon: '☀️', color: '#fdd835', texto: 'Que la acción correcta nos dé la cosecha, para que disfrutemos de los frutos del ser planetario.' },
    { desde: 'Desde Arriba', dir: 'Arriba', casa: 'Casa del Cielo', icon: '✨', color: '#7ab8ff', texto: 'Donde la gente de las estrellas y los antepasados se reúnen, que sus bendiciones lleguen hasta nosotros ahora.' },
    { desde: 'Desde Abajo', dir: 'Abajo', casa: 'Casa de la Tierra', icon: '🌎', color: '#8fd694', texto: 'Que el latido del corazón de cristal del planeta nos bendiga con sus armonías para que terminemos con toda guerra.' },
    { desde: 'Desde el Centro', dir: 'Centro', casa: 'Fuente Galáctica', icon: '💛', color: '#e8c56a', texto: 'Que está en todas partes y al mismo tiempo, que todo se reconozca como luz de amor mutuo.' }
  ];
  var ORACION_CIERRE = '¡Ah Yum Hunab K\u2019u Evam Maya E Ma Ho!';
  var ORACION_CIERRE_TRAD = '¡Sol Central de la Galaxia, bendice la armonía de la mente y la naturaleza!';

  function textoOracionPlano() {
    var t = 'Oración a las 7 direcciones galácticas\n\n';
    ORACION_DIRECCIONES.forEach(function (d) {
      t += d.desde + ', ' + d.casa + '\n' + d.texto + '\n\n';
    });
    t += 'Cierre tradicional:\n' + ORACION_CIERRE + '\n(«' + ORACION_CIERRE_TRAD + '»)';
    return t;
  }

  function renderKinOracion() {
    var box = $('kinOracionBox'); if (!box) return;
    var html = '<div class="si-card"><h4>🙏 Oración a las 7 direcciones galácticas</h4>' +
      '<p>Rezo de apertura del día en la tradición del sincronario de 13 lunas (Ley del Tiempo). Se recita al amanecer, de cara a cada dirección, para alinear mente y naturaleza antes de consultar tu kin del día.</p></div>';
    html += ORACION_DIRECCIONES.map(function (d) {
      return '<div class="si-card" style="border-left:3px solid ' + d.color + '">' +
        '<h4 style="font-size:13px">' + d.icon + ' ' + esc(d.desde) + ', ' + esc(d.casa) + '</h4>' +
        '<p style="font-size:12px"><i>' + esc(d.texto) + '</i></p></div>';
    }).join('');
    html += '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌟 Cierre tradicional</h4>' +
      '<p style="font-size:14px"><b>' + esc(ORACION_CIERRE) + '</b></p>' +
      '<p class="muted" style="font-size:11px">«' + esc(ORACION_CIERRE_TRAD) + '»</p>' +
      '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap;gap:6px">' +
      '<button type="button" id="ora7Share" class="btn btn-accent" style="width:auto">📤 Compartir</button>' +
      '<button type="button" id="ora7Copy" class="btn" style="width:auto">📋 Copiar</button>' +
      '<button type="button" id="ora7Llevar" class="btn" style="width:auto">📝 Llevar a nota de hoy</button></div></div>';
    box.innerHTML = html;
    var sh = $('ora7Share');
    if (sh) sh.onclick = function () { share('Oración 7 direcciones', textoOracionPlano()); };
    var cp = $('ora7Copy');
    if (cp) cp.onclick = function () {
      var t = textoOracionPlano();
      try {
        if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { alert('Oración copiada'); }, function () { alert(t); });
        else alert(t);
      } catch (e) { try { alert(t); } catch (e2) {} }
    };
    var lv = $('ora7Llevar');
    if (lv) lv.onclick = function () {
      try {
        var info = (typeof todayInfo === 'function') ? todayInfo() : null;
        if (!info) return alert('No se pudo ubicar hoy');
        var note = ('🙏 Oración 7 direcciones:\n' + textoOracionPlano()).slice(0, 900);
        if (info.luna === 'dft') { var c = cyc(currentCycleYear()); c.dft.nota = (c.dft.nota ? c.dft.nota + '\n' : '') + note; }
        else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + note; }
        save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
        alert('Oración llevada a la nota de hoy ✓');
      } catch (e2) { alert('No se pudo llevar a la nota'); }
    };
  }

  function renderKinAll() {
    try { renderKinGuia(); } catch (e) {}
    try { renderKinHoy(); } catch (e) {}
    try { renderKinOracion(); } catch (e) {}
    try { renderKinSellos(); } catch (e) {}
    try { renderKinTonos(); } catch (e) {}
    try { renderKinFamilias(); } catch (e) {}
    try { renderKinCastillo(); } catch (e) {}
    try { renderKinCalculo(); } catch (e) {}
    try { renderKinOnda(); } catch (e) {}
    try { renderKinPortales(); } catch (e) {}
    try { renderKinSinas(); } catch (e) {}
    try { renderKinTzolkin(); } catch (e) {}
    try { renderKinDiario(); } catch (e) {}
    try { renderKinLunas(); } catch (e) {}
  }

  var KIN_TABS = ['Guia', 'Hoy', 'Sellos', 'Tonos', 'Familias', 'Castillo', 'Calculo', 'Onda', 'Portales', 'Sinas', 'Tzolkin', 'Lunas', 'Diario', 'Oracion'];

  function buildDialog() {
    makeDialog('kinMayaDialog', 'Kin Maya — Tzolkin y sincronización',
      'El <b>kin maya</b> es tu firma energética en el calendario sagrado de 260 días. Descubre tu sello solar, tu tono galáctico y cómo se sincroniza con las 13 lunas. Todo queda <b>privado y local</b>.',
      '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
      '<button type="button" id="tabKinGuia" class="btn btn-accent" style="width:auto">Guía</button>' +
      '<button type="button" id="tabKinHoy" class="btn" style="width:auto">☀️ Hoy</button>' +
      '<button type="button" id="tabKinSellos" class="btn" style="width:auto">Sellos</button>' +
      '<button type="button" id="tabKinTonos" class="btn" style="width:auto">Tonos</button>' +
      '<button type="button" id="tabKinFamilias" class="btn" style="width:auto">Familias</button>' +
      '<button type="button" id="tabKinCastillo" class="btn" style="width:auto">Castillo</button>' +
      '<button type="button" id="tabKinCalculo" class="btn" style="width:auto">Mi kin</button>' +
      '<button type="button" id="tabKinOnda" class="btn" style="width:auto">🌊 Ondas</button>' +
      '<button type="button" id="tabKinPortales" class="btn" style="width:auto">✦ Portales</button>' +
      '<button type="button" id="tabKinSinas" class="btn" style="width:auto">💞 Sinastría</button>' +
      '<button type="button" id="tabKinTzolkin" class="btn" style="width:auto">🌀 Tzolkin</button>' +
      '<button type="button" id="tabKinLunas" class="btn" style="width:auto">Lunas</button>' +
      '<button type="button" id="tabKinDiario" class="btn" style="width:auto">📓 Diario</button>' +
      '<button type="button" id="tabKinOracion" class="btn" style="width:auto">🙏 Oración</button></div>' +
      '<div id="kinGuia"><div id="kinGuiaBox"></div></div>' +
      '<div id="kinHoy" class="hidden"><div id="kinHoyBox"></div></div>' +
      '<div id="kinSellos" class="hidden">' +
      '<div class="conv-row" style="margin-bottom:8px"><label style="flex:1">Buscar sello <input type="text" id="kinSellosQ" placeholder="nombre, cualidad, color, pregunta..." autocomplete="off"></label></div>' +
      '<div id="kinSellosBox"></div></div>' +
      '<div id="kinTonos" class="hidden"><div id="kinTonosBox"></div></div>' +
      '<div id="kinFamilias" class="hidden"><div id="kinFamiliasBox"></div></div>' +
      '<div id="kinCastillo" class="hidden"><div id="kinCastilloBox"></div></div>' +
      '<div id="kinCalculo" class="hidden"><div id="kinCalculoBox"></div></div>' +
      '<div id="kinOnda" class="hidden"><div id="kinOndaBox"></div></div>' +
      '<div id="kinPortales" class="hidden"><div id="kinPortalesBox"></div></div>' +
      '<div id="kinSinas" class="hidden"><div id="kinSinasBox"></div></div>' +
      '<div id="kinTzolkin" class="hidden"><div class="conv-row" style="margin-bottom:8px"></div><div id="kinTzolkinBox"></div></div>' +
      '<div id="kinLunas" class="hidden"><div id="kinLunasBox"></div></div>' +
      '<div id="kinDiario" class="hidden"><div id="kinDiarioBox"></div></div>' +
      '<div id="kinOracion" class="hidden"><div id="kinOracionBox"></div></div>');
  }

  function switchKinTab(t) {
    switchTab('kin', t, KIN_TABS);
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
    try { addKw('btnKinMaya', 'oracion siete 7 direcciones galacticas rezo amanecer hunab ku portal sinastria tzolkin diario onda encantada plasma afirmacion hoy'); } catch (e3) {}

    buildDialog();
    renderKinAll();

    var b = $('btnKinMaya');
    if (b) b.onclick = function () { switchKinTab('Hoy'); renderKinAll(); switchKinTab('Hoy'); openDlg('kinMayaDialog'); };

    KIN_TABS.forEach(function (t) {
      var tb = $('tabKin' + t);
      if (tb) tb.onclick = function () { switchKinTab(t); };
    });

    var q = $('kinSellosQ'); if (q) q.oninput = function () { renderKinSellos(); };
    try {
      if (typeof window !== 'undefined') {
        window.KinMaya = window.KinMaya || {};
        window.KinMaya.open = function (tab) { try { renderKinAll(); switchKinTab(tab || 'Hoy'); openDlg('kinMayaDialog'); } catch (e) {} };
        window.KinMaya.tab = switchKinTab;
        window.KinMaya.calc = calcKinMaya;
        window.KinMaya.hoy = function () { try { return calcKinMaya(todayKey()); } catch (e) { return null; } };
      }
    } catch (eW) {}
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
