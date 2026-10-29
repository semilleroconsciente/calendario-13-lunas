/* ============================================================
   ENLACES RELACIONADOS — Calendario 13 Lunas (Penco · Bío-Bío)
   Bloque "🔗 Enlaces relacionados" inyectado al final de cada
   diálogo: 1) botones internos (otras secciones de la app) +
   2) enlaces externos oficiales (SHOA, Sernapesca, MMA, CONAF,
   Meteochile, ChileAtiende, etc.).
   - 100% offline-first: si no hay internet, los internos siguen
     funcionando; los externos solo son <a> normales.
   - CSP fase 1: sin inline handlers, sin fetch, sin eval.
   - Se engancha a cualquier <dialog> abierto desde un btn*.
   ============================================================ */
(function () {
'use strict';

function esc(s) {
  if (typeof escapeHtml === 'function') return escapeHtml(s);
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* Etiqueta corta para botones internos (si el botón no existe en el DOM, se omite) */
function btnLabel(id) {
  try {
    var b = document.getElementById(id);
    if (b && b.textContent) return b.textContent.trim().slice(0, 32);
  } catch (e) {}
  return id;
}
function btnExists(id) { try { return !!document.getElementById(id); } catch (e) { return false; } }

/* ---------- Mapa por sub-sección (data-sub) ---------- */
/* in: botones internos de la app · ex: [etiqueta, url] oficiales */
var POR_SUB = {
  /* 📅 Mi Día */
  'organizar': {
    in: ['btnHabits', 'btnRutinas', 'btnDiscipline', 'btnSchedule', 'btnTimer', 'btnRemind', 'btnEnergia', 'btnCircadian'],
    ex: [['🕰️ Hora Oficial Chile', 'https://www.horaoficial.cl'], ['🧠 Técnicas de estudio', 'https://www.bpdigital.cl']]
  },
  'registrar': {
    in: ['btnGratitud', 'btnDreams', 'btnBreath', 'btnEnergia', 'btnPsico', 'btnEspiritu'],
    ex: [['🌬️ Respiración y salud (OMS)', 'https://www.who.int/es'], ['😴 Higiene del sueño (MINSAL)', 'https://www.minsal.cl']]
  },
  /* 🌊 Territorio Penco */
  'mar': {
    in: ['btnTides', 'btnFishing', 'btnIntermareal', 'btnNudos', 'btnKayak', 'btnBallenas', 'btnFaunaMarina', 'btnWeather'],
    ex: [['🌊 Tabla de mareas · Penco', 'https://tablademareas.com/cl/biobio/penco#_mareas'], ['🐟 Sernapesca · Vedas y marea roja', 'https://www.sernapesca.cl'], ['🌊 Directemar · Seguridad náutica', 'https://www.directemar.cl']]
  },
  'tierra': {
    in: ['btnHuerta', 'btnSiembra', 'btnBosque', 'btnCompost', 'btnAgua', 'btnHidroponia', 'btnFlora', 'btnLawen', 'btnBirds', 'btnMeli', 'btnHongos', 'btnFenologia', 'btnSenderos'],
    ex: [['🌳 CONAF · Bosque y prevención', 'https://www.conaf.cl'], ['🦉 SIMBIO MMA · Especies', 'https://simbio.mma.gob.cl'], ['🌸 Chileflora · Flora nativa', 'https://www.chileflora.com'], ['🔎 iNaturalist · Ciencia ciudadana', 'https://www.inaturalist.org']]
  },
  'cielo': {
    in: ['btnWeather', 'btnAstro', 'btnGolden', 'btnCircadian', 'btnEkadashi', 'btnTides', 'btnEnergia'],
    ex: [['🌤️ Meteochile · Pronóstico oficial', 'https://www.meteochile.gob.cl'], ['🌕 Fases lunares (timeanddate)', 'https://www.timeanddate.com/moon/phases/'], ['🔭 ALMA · Astronomía Chile', 'https://www.almaobservatory.org']]
  },
  'penco': {
    in: ['btnComuna', 'btnEducacion', 'btnBiblioPenco', 'btnIglesias', 'btnMuni', 'btnBomberos', 'btnActores', 'btnAmenazas', 'btnSenderos'],
    ex: [['🏛️ Municipalidad de Penco', 'https://www.penco.cl'], ['📚 BiblioRedes Penco', 'https://www.biblioredes.gob.cl/bibliotecas/penco'], ['🏫 DEM Penco · Establecimientos', 'https://educapenco.cl/dem/establecimientos']]
  },
  /* 💚 Cuerpo & Salud */
  'ciclos': {
    in: ['btnMenstrual', 'btnFerti', 'btnClimaterio', 'btnMujerMedicina', 'btnLawen', 'btnMedic'],
    ex: [['💚 MINSAL · Salud sexual', 'https://www.minsal.cl'], ['📘 Chile Crece Contigo', 'https://www.crececontigo.gob.cl']]
  },
  'etapas': {
    in: ['btnAdolescencia', 'btnJuventud', 'btnAdultez', 'btnVejez', 'btnSeptenios', 'btnKimun', 'btnCrianza', 'btnArbolFull'],
    ex: [['🧒 Chile Crece Contigo', 'https://www.crececontigo.gob.cl'], ['👵 SENAMA · Personas mayores', 'https://www.senama.gob.cl']]
  },
  'cuidado': {
    in: ['btnMedic', 'btnNutri', 'btnAyurveda', 'btnMTC', 'btnGym', 'btnNatacion', 'btnPelo', 'btnRituales', 'btnEnergia', 'btnLawen', 'btnBreath'],
    ex: [['🥗 Guías alimentarias MINSAL', 'https://www.minsal.cl'], ['🌿 SIMBIO · Plantas nativas', 'https://simbio.mma.gob.cl']]
  },
  'deportes': {
    in: ['btnFutbol', 'btnCapoeira', 'btnPingPong', 'btnGym', 'btnNatacion', 'btnSenderos', 'btnKayak'],
    ex: [['🏟️ IND · Deporte Chile', 'https://www.ind.cl'], ['⚽ ANFP · Fútbol chileno', 'https://www.anfp.cl']]
  },
  /* 🧠 Aprender, Crear y Jugar */
  'estudio': {
    in: ['btnStudy', 'btnMemory', 'btnMatematicas', 'btnSchedule', 'btnDiscipline', 'btnTimer'],
    ex: [['📝 DEMRE · PAES', 'https://demre.cl'], ['📚 Biblioteca Pública Digital', 'https://www.bpdigital.cl']]
  },
  'idiomas': {
    in: ['btnIdiomas', 'btnMapu', 'btnEnglish', 'btnPortugues', 'btnChino', 'btnHindi', 'btnTales'],
    ex: [['📖 RAE · Español', 'https://www.rae.es'], ['🗣️ CONADI · Pueblos originarios', 'https://www.conadi.gob.cl']]
  },
  'musica': {
    in: ['btnAprenderInstrumento', 'btnGuitar', 'btnUkelele', 'btnFlauta', 'btnTeclado', 'btnCajon', 'btnCanto', 'btnViolin', 'btnMusicaPractica'],
    ex: [['🎶 Biblioteca Pública Digital · Música', 'https://www.bpdigital.cl'], ['🎭 Ministerio de las Culturas', 'https://www.cultura.gob.cl']]
  },
  'juegos': {
    in: ['btnAjedrez', 'btnDama', 'btnSudoku', 'btnCrucigrama', 'btnSopa', 'btnSolitario', 'btnMemory'],
    ex: [['♟️ Lichess · Ajedrez libre', 'https://lichess.org'], ['🧩 Sudoku gratuito', 'https://sudoku.com/es']]
  },
  'infancias': {
    in: ['btnTales', 'btnCrianza', 'btnAdolescencia', 'btnVozAbuelos', 'btnMapu'],
    ex: [['🧒 Chile Crece Contigo · Cuentos', 'https://www.crececontigo.gob.cl'], ['📚 BPDigital infantil', 'https://www.bpdigital.cl']]
  },
  /* 🪞 Interior, Linaje y Memoria */
  'conocerse': {
    in: ['btnPsico', 'btnPsicologia', 'btnEneagrama', 'btnVIA', 'btnIkigai', 'btnNeurodiversidad', 'btnGratitud'],
    ex: [['🧠 Salud mental (MINSAL)', 'https://www.minsal.cl'], ['📞 Salud Responde 600 360 7777', 'https://www.minsal.cl']]
  },
  'practicas': {
    in: ['btnEspiritual', 'btnEspiritu', 'btnTao', 'btnMantak', 'btnRecap', 'btnTolteca', 'btnEstoicismo', 'btnBreath', 'btnEkadashi'],
    ex: []
  },
  'tradiciones': {
    in: ['btnMetodos', 'btnSilva', 'btnGrabovoi', 'btnVigyan', 'btnAnastasia', 'btnAmi', 'btnTao', 'btnEstoicismo'],
    ex: []
  },
  'oraculos': {
    in: ['btnKinMaya', 'btnTarot', 'btnNumerologia', 'btnOraculo', 'btnAstro'],
    ex: [['🌕 Fases lunares', 'https://www.timeanddate.com/moon/phases/']]
  },
  'sosten': {
    in: ['btnDueloFull', 'btnAdicciones', 'btnPsicologia', 'btnApoyo', 'btnConvivHablar'],
    ex: [['🆘 SENDA · Adicciones *4141', 'https://www.senda.gob.cl'], ['📞 Fono Salud Responde', 'https://www.minsal.cl']]
  },
  /* 🏡 Hogar y Vida Práctica */
  'casa': {
    in: ['btnMeal', 'btnShopping', 'btnFinance', 'btnHomeTasks', 'btnBodega', 'btnDespensa', 'btnCloset', 'btnCorral', 'btnMovilidad', 'btnEscolar', 'btnHuerta'],
    ex: [['🛒 SERNAC · Derechos del consumidor', 'https://www.sernac.cl'], ['🎒 JUNAEB · Alimentación escolar', 'https://www.junaeb.cl']]
  },
  'energia': {
    in: ['btnEnergy', 'btnLena', 'btnTaller', 'btnHerramientas', 'btnMecanica', 'btnDomotica', 'btnConvert', 'btnFuego'],
    ex: [['⚡ SEC · Electricidad y combustibles', 'https://www.sec.cl'], ['☀️ Energía (Ministerio)', 'https://www.energia.gob.cl']]
  },
  'familia': {
    in: ['btnArbolFull', 'btnVozAbuelos', 'btnConstelaciones', 'btnCrianza', 'btnTales'],
    ex: [['📜 Registro Civil · Partidas y certificados', 'https://www.registrocivil.cl'], ['🧒 Chile Crece Contigo', 'https://www.crececontigo.gob.cl']]
  },
  /* 🤝 Comunidad */
  'red': {
    in: ['btnTrueque', 'btnMinga', 'btnDerechos', 'btnAnimalCare', 'btnComuna'],
    ex: [['📜 ChileAtiende · Trámites', 'https://www.chileatiende.gob.cl'], ['🐾 Subdere · Tenencia responsable', 'https://www.subdere.gov.cl']]
  },
  'red-comunitaria': {
    in: ['btnRedGuia', 'btnRedMeshtastic', 'btnRedDiagnostico', 'btnRedRadio', 'btnRedNodos', 'btnEvac', 'btnApoyo'],
    ex: [['📻 SUBTEL · Radioaficionados', 'https://www.subtel.gob.cl'], ['📡 Meshtastic · Red libre', 'https://meshtastic.org']]
  },
  'convivencia-vecinal': {
    in: ['btnConvivGuia', 'btnConvivFichas', 'btnConvivHablar', 'btnConvivBitacora', 'btnConvivLuna', 'btnConvivRecursos', 'btnMuni', 'btnDerechos'],
    ex: [['🏘️ Ley de Copropiedad (MINVU)', 'https://www.minvu.gob.cl'], ['📜 ChileAtiende · Mediación', 'https://www.chileatiende.gob.cl']]
  },
  'ciberseguridad': {
    in: ['btnCiberGuia', 'btnCiberClaves', 'btnCiberEstafas', 'btnCiberPriv', 'btnCiberChequeo', 'btnCiberAyuda', 'btnOpenGuia'],
    ex: [['🛡️ CSIRT Chile · Alertas', 'https://csirt.gob.cl'], ['🚔 PDI · Cibercrimen', 'https://www.pdi.cl']]
  },
  'codigo-abierto': {
    in: ['btnOpenGuia', 'btnOpenLicencias', 'btnOpenProgramas', 'btnOpenProyecto', 'btnOpenAportar', 'btnOpenQuiz'],
    ex: [['📜 Licencias GNU GPL', 'https://www.gnu.org/licenses/gpl-3.0.html'], ['📜 Creative Commons BY-NC-SA', 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es']]
  },
  'emergencia': {
    in: ['btnFirstAid', 'btnViolence', 'btnEvac', 'btnApoyo', 'btnBomberos', 'btnMuni', 'btnFuego', 'btnWeather', 'btnTides'],
    ex: [['🚨 SENAPRED · Emergencias', 'https://www.senapred.cl'], ['🚒 Bomberos de Chile', 'https://www.bomberos.cl'], ['⚓ SHOA · Tsunami', 'https://www.shoa.cl'], ['🌊 Sistema de marejadas (SHOA)', 'https://www.shoa.cl']]
  }
};

/* ---------- Ajustes finos por botón (sección por sección) ---------- */
/* Si un botón está aquí, sus listas reemplazan a las del sub-grupo */
var POR_BTN = {
  'btnTides': { in: ['btnFishing', 'btnIntermareal', 'btnKayak', 'btnWeather', 'btnEvac', 'btnGolden'], ex: [['🌊 Tabla de mareas · Penco', 'https://tablademareas.com/cl/biobio/penco#_mareas'], ['🌊 Meteochile · Oleaje', 'https://www.meteochile.gob.cl']] },
  'btnFishing': { in: ['btnTides', 'btnIntermareal', 'btnFaunaMarina', 'btnNudos', 'btnKayak'], ex: [['🐟 Sernapesca · Vedas y tallas', 'https://www.sernapesca.cl'], ['⚓ SHOA · Mareas', 'https://www.shoa.cl']] },
  'btnIntermareal': { in: ['btnTides', 'btnFishing', 'btnFaunaMarina', 'btnLawen', 'btnFenologia'], ex: [['🦀 Sernapesca · Marea roja', 'https://www.sernapesca.cl'], ['🔎 iNaturalist · Registra tu hallazgo', 'https://www.inaturalist.org']] },
  'btnKayak': { in: ['btnTides', 'btnWeather', 'btnNudos', 'btnFishing', 'btnFirstAid'], ex: [['⚓ Directemar · Seguridad náutica', 'https://www.directemar.cl'], ['🌤️ Meteochile · Viento y oleaje', 'https://www.meteochile.gob.cl']] },
  'btnHuerta': { in: ['btnSiembra', 'btnCompost', 'btnAgua', 'btnBodega', 'btnMeal', 'btnFenologia'], ex: [['🌱 FAO · Huertos urbanos', 'https://www.fao.org'], ['🪱 INIA · Manejo agroecológico', 'https://www.inia.cl']] },
  'btnSiembra': { in: ['btnHuerta', 'btnCompost', 'btnAstro', 'btnFenologia', 'btnBodega', 'btnMeal'], ex: [['🌙 Fases lunares', 'https://www.timeanddate.com/moon/phases/'], ['🌱 FAO · Calendario de cultivos', 'https://www.fao.org']] },
  'btnBosque': { in: ['btnFlora', 'btnHongos', 'btnBirds', 'btnMeli', 'btnSenderos', 'btnFuego', 'btnFenologia'], ex: [['🌳 CONAF · Bosque nativo', 'https://www.conaf.cl'], ['🦉 SIMBIO · Fichas de especies', 'https://simbio.mma.gob.cl']] },
  'btnWeather': { in: ['btnTides', 'btnGolden', 'btnKayak', 'btnSenderos', 'btnFuego', 'btnEvac'], ex: [['🌤️ Meteochile · Penco', 'https://www.meteochile.gob.cl'], ['💨 Open-Meteo (fuente de la app)', 'https://open-meteo.com/']] },
  'btnAstro': { in: ['btnSiembra', 'btnGolden', 'btnKinMaya', 'btnEkadashi', 'btnCircadian'], ex: [['🔭 ALMA Observatory', 'https://www.almaobservatory.org'], ['🌕 Fases de la Luna', 'https://www.timeanddate.com/moon/phases/']] },
  'btnComuna': { in: ['btnMuni', 'btnEducacion', 'btnBiblioPenco', 'btnActores', 'btnAmenazas', 'btnSenderos'], ex: [['🏛️ Municipalidad de Penco', 'https://www.penco.cl'], ['🎉 DIDECO · Talleres', 'https://www.penco.cl']] },
  'btnMuni': { in: ['btnComuna', 'btnEducacion', 'btnBomberos', 'btnEvac', 'btnApoyo', 'btnDerechos'], ex: [['🏛️ Municipalidad de Penco', 'https://www.penco.cl'], ['📜 ChileAtiende · Trámites', 'https://www.chileatiende.gob.cl']] },
  'btnBomberos': { in: ['btnFuego', 'btnEvac', 'btnFirstAid', 'btnApoyo', 'btnMuni'], ex: [['🚒 Bomberos de Chile', 'https://www.bomberos.cl'], ['🔥 CONAF · Incendios forestales', 'https://www.conaf.cl']] },
  'btnAmenazas': { in: ['btnActores', 'btnEvac', 'btnApoyo', 'btnMuni', 'btnFuego'], ex: [['🛰️ SEA · Expedientes ambientales', 'https://sea.gob.cl'], ['⚖️ SMA · Denuncias', 'https://www.sma.gob.cl'], ['🚨 SENAPRED', 'https://www.senapred.cl']] },
  'btnEvac': { in: ['btnFirstAid', 'btnApoyo', 'btnBomberos', 'btnTides', 'btnWeather', 'btnMuni'], ex: [['🚨 SENAPRED · Plan familia', 'https://www.senapred.cl'], ['⚓ SHOA · Cartas de inundación', 'https://www.shoa.cl']] },
  'btnMapu': { in: ['btnTales', 'btnVozAbuelos', 'btnKimun', 'btnLawen', 'btnIdiomas'], ex: [['🗣️ CONADI', 'https://www.conadi.gob.cl'], ['📚 BPDigital · Mapuzugun', 'https://www.bpdigital.cl']] },
  'btnLawen': { in: ['btnMedic', 'btnBosque', 'btnFlora', 'btnIntermareal', 'btnMujerMedicina'], ex: [['🌿 SIMBIO · Flora nativa', 'https://simbio.mma.gob.cl'], ['🌸 Chileflora', 'https://www.chileflora.com']] },
  'btnBirds': { in: ['btnFenologia', 'btnBosque', 'btnSenderos', 'btnFaunaMarina'], ex: [['🦅 eBird · Registra aves', 'https://ebird.org'], ['🔎 iNaturalist', 'https://www.inaturalist.org']] },
  'btnEducacion': { in: ['btnEscolar', 'btnBiblioPenco', 'btnStudy', 'btnMovilidad'], ex: [['🏫 DEM Penco', 'https://educapenco.cl/dem/establecimientos'], ['📝 SAE · Admisión escolar', 'https://admision.mineduc.cl']] },
  'btnBiblioPenco': { in: ['btnEducacion', 'btnTales', 'btnStudy', 'btnMapu'], ex: [['📚 BiblioRedes Penco', 'https://www.biblioredes.gob.cl/bibliotecas/penco'], ['📖 Biblioteca Pública Digital', 'https://www.bpdigital.cl']] },
  'btnNutri': { in: ['btnMeal', 'btnHuerta', 'btnBodega', 'btnDespensa', 'btnSiembra'], ex: [['🥗 Guías alimentarias MINSAL', 'https://www.minsal.cl'], ['🌱 FAO · Nutrición', 'https://www.fao.org']] },
  'btnMedic': { in: ['btnLawen', 'btnFirstAid', 'btnNutri', 'btnMujerMedicina', 'btnFerti'], ex: [['🌿 MINSAL · Medicina complementaria', 'https://www.minsal.cl']] },
  'btnAdicciones': { in: ['btnPsicologia', 'btnDueloFull', 'btnApoyo', 'btnGratitud', 'btnHabits'], ex: [['🌿 SENDA · Ayuda *4141', 'https://www.senda.gob.cl'], ['📞 Salud Responde 600 360 7777', 'https://www.minsal.cl']] },
  'btnFirstAid': { in: ['btnEvac', 'btnBomberos', 'btnApoyo', 'btnMedic', 'btnNatacion'], ex: [['🩹 SAMU 131 · MINSAL', 'https://www.minsal.cl'], ['🚒 Bomberos 132', 'https://www.bomberos.cl']] }
};

function datosPara(btnId) {
  if (POR_BTN[btnId]) return POR_BTN[btnId];
  try {
    var b = document.getElementById(btnId);
    var sub = b ? b.getAttribute('data-sub') : null;
    if (sub && POR_SUB[sub]) return POR_SUB[sub];
    /* fallback por grupo */
    var g = b ? b.closest('.action-group') : null;
    var gd = g ? g.getAttribute('data-group') : null;
    if (gd === 'territorio') return POR_SUB.tierra;
    if (gd === 'dia') return POR_SUB.organizar;
    if (gd === 'cuerpo') return POR_SUB.cuidado;
    if (gd === 'aprender') return POR_SUB.estudio;
    if (gd === 'linaje') return POR_SUB.conocerse;
    if (gd === 'hogar') return POR_SUB.casa;
    if (gd === 'comunidad') return POR_SUB.emergencia;
  } catch (e) {}
  return { in: [], ex: [] };
}

function construirBloque(btnId) {
  var d = datosPara(btnId);
  var internos = (d.in || []).filter(function (id) { return id !== btnId && btnExists(id); }).slice(0, 8);
  var externos = (d.ex || []).slice(0, 4);
  if (!internos.length && !externos.length) return null;
  var wrap = document.createElement('div');
  wrap.className = 'si-card enlaces-rel su-cfa1ec';
  wrap.setAttribute('data-enlaces-para', btnId);
  var h = '<h4 class="su-6cb285">🔗 Enlaces relacionados</h4>';
  if (internos.length) {
    h += '<p class="muted su-11a508">Sigue en la app:</p><div class="su-c158a9">';
    h += internos.map(function (id) {
      return '<button type="button" class="btn su-337714" data-ir="' + esc(id) + '">' + esc(btnLabel(id)) + '</button>';
    }).join('');
    h += '</div>';
  }
  if (externos.length) {
    h += '<p class="muted su-11a508">Fuentes oficiales (requiere internet):</p><div class="su-c158a9">';
    h += externos.map(function (par) {
      return '<a class="btn su-337714" href="' + esc(par[1]) + '" target="_blank" rel="noopener">' + esc(par[0]) + ' ↗</a>';
    }).join('');
    h += '</div>';
  }
  h += '<p class="muted su-11a508" style="margin:.4em 0 0">💡 Consejo: los botones de arriba abren la sección sin perder tu lugar.</p>';
  wrap.innerHTML = h;
  wrap.querySelectorAll('[data-ir]').forEach(function (b) {
    b.addEventListener('click', function () {
      var target = b.getAttribute('data-ir');
      try {
        var dlg = b.closest('dialog');
        if (dlg && dlg.open) { try { dlg.close(); } catch (e) {} }
      } catch (e2) {}
      setTimeout(function () {
        try {
          var t = document.getElementById(target);
          if (t) { t.click(); if (t.scrollIntoView) { try { t.scrollIntoView({ block: 'center' }); } catch (e3) {} } }
        } catch (e4) {}
      }, 90);
    });
  });
  return wrap;
}

var ultimoBtn = null;
function inyectarEn(dialogo) {
  try {
    if (!dialogo || dialogo.querySelector('.enlaces-rel')) return;
    if (!ultimoBtn) return;
    var bloque = construirBloque(ultimoBtn);
    if (!bloque) return;
    /* Insertar antes de la fila de Cerrar (último .dlg-actions) o al final del form */
    var form = dialogo.querySelector('form') || dialogo;
    var cierres = form.querySelectorAll(':scope .dlg-actions');
    if (cierres && cierres.length) {
      form.insertBefore(bloque, cierres[cierres.length - 1]);
    } else {
      form.appendChild(bloque);
    }
  } catch (e) {}
}

/* Rastrear qué botón abrió el diálogo */
document.addEventListener('click', function (ev) {
  try {
    var t = ev.target && ev.target.closest ? ev.target.closest('[id^="btn"]') : null;
    if (t && t.id) ultimoBtn = t.id;
  } catch (e) {}
}, true);

/* Observar diálogos que se abren */
var obs = null;
function observar() {
  try {
    if (obs) return;
    obs = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n && n.tagName === 'DIALOG') setTimeout(function () { inyectarEn(n); }, 250);
        });
        if (m.target && m.target.tagName === 'DIALOG' && m.target.open) {
          setTimeout(function () { inyectarEn(m.target); }, 250);
        }
      });
    });
    obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
  } catch (e) {}
}

/* Respaldo: cuando un dialog hace showModal, poll corto */
document.addEventListener('click', function () {
  setTimeout(function () {
    try {
      document.querySelectorAll('dialog[open]').forEach(function (dg) { inyectarEn(dg); });
    } catch (e) {}
  }, 350);
}, true);

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observar);
else observar();

})();
