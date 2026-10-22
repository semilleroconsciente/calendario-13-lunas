/* ============================================================
   OPEN SOURCE / CODIGO ABIERTO — Calendario 13 Lunas (Penco)
   Licencia dual del proyecto:
     - CODIGO (Web, APK, .exe): GNU GPLv3 o posterior (ver COPYING).
     - CONTENIDO CREATIVO (diseno, textos, ilustraciones de las
       lunas): CC BY-NC-SA 4.0 (ver LICENCIA-CONTENIDO-CC-BY-NC-SA-4.0.md
       y LICENSE.md).
   SPDX-License-Identifier: GPL-3.0-or-later
   Seccion: Comunidad, Emergencia y Sistema > sub "codigo-abierto"
   Botones:
     btnOpenGuia, btnOpenLicencias, btnOpenProgramas,
     btnOpenProyecto, btnOpenAportar, btnOpenQuiz
   Dialogo openSourceDialog con 6 pestanas:
     1) Guia: que es, 4 libertades, gratis vs libre, por que
        importa en Penco, mitos, metodo L.E.E.R.
      2) Licencias: GPLv3 (codigo del proyecto), CC BY-NC-SA 4.0
         (contenido del proyecto), mas MIT, Apache, MPL y dominio
         publico como referencia.
        Comparativa + "cual elijo" + licencia de este proyecto.
     3) Programas libres: catalogo territorial por necesidad
        (sistema, oficina, mapas, diseno, audio, video, nube,
        seguridad) con buscador + ficha "para que / reemplaza a".
     4) Este proyecto: anatomia del Calendario 13 Lunas
        (archivos, offline-first, datos locales), invitacion a la
        comunidad para replicarla en otra comuna y hacerla crecer.
     5) Aportar: contribuir sin saber programar + con codigo,
        checklist primer aporte, bitacora local de aportes,
        plantillas copiar/pegar (reporte, idea, nuevo modulo).
     6) Soberania + quiz: chequeo 10 puntos, glosario y quiz.
   - Todo local y privado: userData().opensource
     { checks:{}, quizBest:0, aportes:[], exploradas:{} }
   - 100% offline. Sin cuentas, sin rastreo.
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
  return String(s == null ? '' : s).slice(0, n || 500);
}
function uid(p) { return (p || 'os') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { checks: {}, quizBest: 0, aportes: [], exploradas: {} };
    if (!u.opensource) u.opensource = { checks: {}, quizBest: 0, aportes: [], exploradas: {} };
    var r = u.opensource;
    if (!r.checks || Array.isArray(r.checks)) r.checks = {};
    if (typeof r.quizBest !== 'number') r.quizBest = 0;
    if (!Array.isArray(r.aportes)) r.aportes = [];
    if (!r.exploradas || Array.isArray(r.exploradas)) r.exploradas = {};
    return r;
  } catch (e) { return { checks: {}, quizBest: 0, aportes: [], exploradas: {} }; }
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
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }
function openTab(t) { buildIfNeeded(); switchTab(t); renderAll(); openDlg('openSourceDialog'); }
function markSeen(k) { try { var s = store(); if (!s.exploradas[k]) { s.exploradas[k] = 1; save(); paintProgress(); } } catch (e) {} }

/* ---------------- DATOS ---------------- */
var LIBERTADES = [
  { n: 'Libertad 0 · Usar', ico: '▶️', txt: 'Usar el programa <b>para lo que quieras</b>, sin pedir permiso y sin pagar licencia: en tu casa, en la escuela, en el negocio, en la JJ.VV. Nadie te lo puede quitar a distancia.' },
  { n: 'Libertad 1 · Estudiar', ico: '🔍', txt: 'Ver <b>cómo funciona por dentro</b> (el código fuente está disponible). Como receta abierta: puedes leerla, aprender y verificar que no espía ni esconde nada.' },
  { n: 'Libertad 2 · Compartir', ico: '🤝', txt: '<b>Copiar y regalar</b> copias a quien quieras: a tu vecina, al colegio, a otra comuna. Legal, sin piratería, sin “activadores” truchos.' },
  { n: 'Libertad 3 · Mejorar', ico: '🛠️', txt: '<b>Cambiarlo y compartir tu mejora</b> para que toda la comunidad se beneficie. Así nació este Calendario: alguien aportó mareas, otra persona aves, otra recetas.' }
];

var MITOS = [
  { m: '“Open source = gratis y malo”', r: 'Falso. Libre habla de <b>libertad, no de precio</b>. Firefox, Linux, VLC o este mismo Calendario son libres y de calidad profesional. Se sostienen con aportes, servicios y comunidad, no con candados.' },
  { m: '“Es solo para programadores”', r: 'Falso. La mayoría de los aportes son <b>sin código</b>: probar, reportar un error con foto, traducir, escribir una guía, dibujar un icono, enseñar a usarlo en la sede. Ver pestaña Aportar.' },
  { m: '“Si es abierto, me roban los datos”', r: 'Al revés: al ser abierto se puede <b>auditar</b>. Este Calendario guarda todo <b>en tu dispositivo</b> (sin nube obligatoria). Lo cerrado no se puede revisar: hay que creerle a la empresa.' },
  { m: '“Puedo tomar lo libre y venderlo como mío cerrado”', r: 'Depende de la <b>licencia</b> (ver pestaña Licencias). Apache/MIT permiten casi todo con atribución; <b>GPL (la del código de este Calendario) exige mantener abierto lo derivado</b>. Libre no es “sin reglas”.' }
];

var LICENCIAS = [
  { id: 'gpl', ico: '🔁', nombre: 'GPL v3 (la del CODIGO de este Calendario)', tipo: 'Recíproca: lo derivado sigue libre', permite: 'Usar, estudiar, modificar y compartir; vender servicios y copias.', exige: 'Si distribuyes una versión modificada, <b>debes publicar tu código fuente</b> con la misma licencia GPLv3 y marcar tus cambios. Ver archivo COPYING.', ideal: 'Bienes comunes que nadie pueda apropiarse: este Calendario (Web, APK, .exe) usa GPLv3.', ojo: 'Copyleft fuerte: no puedes cerrar el código derivado. Es la protección del bien común.' },
  { id: 'cc', ico: '🎨', nombre: 'CC BY-NC-SA 4.0 (el CONTENIDO de este Calendario)', tipo: 'Para diseño, textos e ilustraciones de las lunas', permite: 'Compartir y adaptar con <b>crédito (BY)</b>, solo en usos <b>no comerciales (NC)</b>.', exige: 'Dar crédito + indicar cambios + compartir tu adaptación con la <b>misma licencia (SA)</b>. Pedir permiso para uso comercial.', ideal: 'Relatos de las lunas, guías, cuentos, ilustraciones e iconos propios de este proyecto.', ojo: 'NC impide la explotación comercial sin permiso; SA mantiene libre lo derivado creativo.' },
  { id: 'mit', ico: '🪶', nombre: 'MIT', tipo: 'Permisiva · corta (2 párrafos)', permite: 'Usar, copiar, modificar, vender y cerrar derivados, con crédito al autor.', exige: 'Mantener el aviso de licencia y autoría en las copias.', ideal: 'Proyectos que quieren máxima difusión aceptando que alguien no devuelva mejoras.', ojo: 'Permite cerrar derivados: por eso este proyecto NO la usa para su código (usa GPLv3).' },
  { id: 'apache', ico: '🛡️', nombre: 'Apache 2.0', tipo: 'Permisiva + patentes', permite: 'Lo mismo que MIT, más protección expresa de patentes.', exige: 'Aviso de licencia + registrar cambios importantes + atribución.', ideal: 'Proyectos con empresas/instituciones (protege de demandas de patentes).', ojo: 'Texto más largo que MIT; hay que documentar cambios.' },
  { id: 'mpl', ico: '🧩', nombre: 'MPL 2.0 (copyleft por archivo)', tipo: 'Intermedia archivo por archivo', permite: 'Mezclar con código cerrado a nivel de proyecto.', exige: 'Los <b>archivos MPL modificados</b> se liberan; el resto puede ir cerrado.', ideal: 'Bibliotecas que quieren mejoras devueltas sin “contagiar” todo el proyecto.', ojo: 'Hay que marcar qué archivos son MPL.' },
  { id: 'dominio', ico: '🌍', nombre: 'Dominio público (CC0 / Unlicense)', tipo: 'Sin restricciones', permite: 'Todo, sin siquiera pedir crédito (aunque darlo es buena práctica).', exige: 'Nada (verifica que la obra sea realmente tuya para liberarla).', ideal: 'Datos abiertos, plantillas, saberes que quieres regalar sin fricción.', ojo: 'Irreversible: una vez liberado, no puedes retractarte.' }
];

var PROGRAMAS = [
  { cat: 'Sistema y PC viejo', n: 'Linux Mint / Ubuntu', ico: '🐧', para: 'Revive un PC lento de 10 años: rápido, sin virus típicos, con oficina incluida.', reemplaza: 'Windows + antivirus de pago', dato: 'Se instala desde un pendrive; pide ayuda en la pestaña Aportar si es tu primera vez.', links: [{ t: 'Linux Mint', u: 'https://linuxmint.com' }, { t: 'Ubuntu', u: 'https://ubuntu.com' }] },
  { cat: 'Sistema y PC viejo', n: 'LibreOffice', ico: '📄', para: 'Cartas, planillas de gastos, presentaciones para la JJ.VV. Abre archivos de Word/Excel.', reemplaza: 'Microsoft 365 de pago', dato: 'Guarda en .odt propio o exporta a .pdf para imprimir.', links: [{ t: 'LibreOffice', u: 'https://www.libreoffice.org' }] },
  { cat: 'Internet y privacidad', n: 'Firefox + uBlock Origin', ico: '🦊', para: 'Navegar con menos rastreo y sin avisos trampa. Base de la pestaña 🛡️ Ciberseguridad.', reemplaza: 'Navegadores con publicidad invasiva', dato: 'Activa “protección estricta” en Ajustes → Privacidad.', links: [{ t: 'Firefox', u: 'https://www.mozilla.org/firefox/' }, { t: 'uBlock Origin', u: 'https://github.com/gorhill/uBlock' }] },
  { cat: 'Internet y privacidad', n: 'Brave / Tor Browser', ico: '🧅', para: 'Brave bloquea rastreadores; Tor para casos sensibles (denuncias, violencia).', reemplaza: 'Modo incógnito (que no protege nada)', dato: 'Tor es lento: úsalo solo cuando necesites anonimato real.', links: [{ t: 'Brave', u: 'https://brave.com' }, { t: 'Tor', u: 'https://www.torproject.org' }] },
  { cat: 'Mapas y territorio', n: 'OpenStreetMap + Organic Maps', ico: '🗺️', para: 'Mapa offline del territorio, sin cuenta Google: senderos, puntos de encuentro, evacuación tsunami.', reemplaza: 'Google Maps (exige datos y cuenta)', dato: 'Descarga el mapa del Bío-Bío una vez y úsalo sin internet. ¡Puedes agregar tu sede!', links: [{ t: 'OpenStreetMap', u: 'https://www.openstreetmap.org' }, { t: 'Organic Maps', u: 'https://organicmaps.app' }] },
  { cat: 'Mapas y territorio', n: 'QGIS', ico: '🧭', para: 'Mapa serio: zonas de riesgo, huertas comunitarias, redes de agua. Lo usan municipalidades.', reemplaza: 'Software GIS de miles de dólares', dato: 'Nivel avanzado; parte con un taller (ver Proyectos en módulo IA).', links: [{ t: 'QGIS', u: 'https://qgis.org' }] },
  { cat: 'Diseño y difusión', n: 'GIMP + Inkscape', ico: '🎨', para: 'Afiches de la fiesta, logos de emprendimientos, letreros de la feria.', reemplaza: 'Photoshop / Illustrator', dato: 'Inkscape = vectores (logos); GIMP = fotos. Exporta en .png y .pdf.', links: [{ t: 'GIMP', u: 'https://www.gimp.org' }, { t: 'Inkscape', u: 'https://inkscape.org' }] },
  { cat: 'Diseño y difusión', n: 'Kdenlive / Shotcut', ico: '🎬', para: 'Editar videos del taller, la minga o el emprendimiento, en PC modesto.', reemplaza: 'Premiere / Filmora con marca de agua', dato: 'Corta, une y subtitula: suficiente para redes del territorio.', links: [{ t: 'Kdenlive', u: 'https://kdenlive.org' }, { t: 'Shotcut', u: 'https://www.shotcut.org' }] },
  { cat: 'Audio y música', n: 'Audacity', ico: '🎙️', para: 'Grabar Voz de los Abuelos, podcast del barrio, limpiar audio de entrevistas.', reemplaza: 'Grabadoras con suscripción', dato: 'Graba en .wav, exporta en .mp3. Guarda siempre el original.', links: [{ t: 'Audacity', u: 'https://www.audacityteam.org' }] },
  { cat: 'Oficio y negocio', n: 'Odoo Comunitario / Dolibarr', ico: '🧾', para: 'Boletas, stock del almacén, clientes del taller. Orden sin cuaderno perdido.', reemplaza: 'ERP de pago mensual', dato: 'Requiere alguien que lo instale; alternativa simple: planilla LibreOffice.', links: [{ t: 'Odoo', u: 'https://www.odoo.com' }, { t: 'Dolibarr', u: 'https://www.dolibarr.org' }] },
  { cat: 'Comunicación libre', n: 'Signal', ico: '💬', para: 'Chat cifrado para coordinar cuadrillas, compras colectivas, emergencias.', reemplaza: 'Grupos expuestos sin cifrado', dato: 'Activa mensajes que desaparecen en temas sensibles.', links: [{ t: 'Signal', u: 'https://signal.org' }] },
  { cat: 'Comunicación libre', n: 'Jitsi Meet', ico: '📹', para: 'Reunión por video sin instalar nada ni crear cuenta: link y listo.', reemplaza: 'Zoom con límite de 40 min', dato: 'Funciona en el navegador; con mala señal, apaguen cámaras.', links: [{ t: 'Jitsi Meet', u: 'https://meet.jit.si' }] },
  { cat: 'Nube propia', n: 'Nextcloud / Syncthing', ico: '☁️', para: 'Carpeta compartida de la organización sin depender de una empresa extranjera.', reemplaza: 'Drive con tope y rastreo', dato: 'Syncthing = entre aparatos, sin servidor. Ideal para respaldo local.', links: [{ t: 'Nextcloud', u: 'https://nextcloud.com' }, { t: 'Syncthing', u: 'https://syncthing.net' }] },
  { cat: 'Seguridad', n: 'Bitwarden / KeePassXC', ico: '🔑', para: 'Gestor de claves (conecta con 🛡️ Ciberseguridad): una maestra, resto automático.', reemplaza: 'Papelito + misma clave en todo', dato: 'KeePassXC es 100% local; Bitwarden se puede auto-hospedar.', links: [{ t: 'Bitwarden', u: 'https://bitwarden.com' }, { t: 'KeePassXC', u: 'https://keepassxc.org' }] },
  { cat: 'Aprender y crear', n: 'Moodle / Kolibri', ico: '🏫', para: 'Aula offline: cursos del taller, Kimün Mapuzugun, manuales, sin internet.', reemplaza: 'Plataformas con suscripción', dato: 'Kolibri corre en un celu/PC viejo como “escuela de bolsillo”.', links: [{ t: 'Moodle', u: 'https://moodle.org' }, { t: 'Kolibri', u: 'https://learningequality.org/kolibri/' }] },
  { cat: 'Aprender y crear', n: 'Blender', ico: '🧱', para: '3D, animación y hasta planos simples del invernadero o la sede.', reemplaza: 'Software 3D propietario', dato: 'Exige PC medio; hay miles de tutoriales en español.', links: [{ t: 'Blender', u: 'https://www.blender.org' }] },
  { cat: 'Campo y datos', n: 'QField / ODK Collect', ico: '🌱', para: 'Ficha en terreno sin señal: árboles, pozos, daños tras temporal; luego se sincroniza.', reemplaza: 'Papel que se moja y se pierde', dato: 'Combina con OpenStreetMap y QGIS: catastro comunitario completo.', links: [{ t: 'QField', u: 'https://qfield.org' }, { t: 'ODK', u: 'https://getodk.org' }] },
  { cat: 'Este ecosistema', n: 'Este Calendario 13 Lunas (GPLv3 + CC BY-NC-SA 4.0)', ico: '🌙', para: 'Calendario lunar + 60 herramientas territoriales, offline y privado. El código ES la lección.', reemplaza: '5 apps sueltas con publicidad', dato: 'Ver pestaña “Este proyecto”: código GPLv3 + contenido CC BY-NC-SA 4.0. Archivos .js por tema, datos en data/territorios/.', links: [] }
];

var ARQUITECTURA = [
  { n: 'index.html', ico: '🏠', d: 'La casa: estructura, grupos de botones (Mi Día, Territorio, Comunidad…) y el cargador diferido de módulos (línea ~4344). Agregar un botón aquí es opcional: los módulos se auto-inyectan.' },
  { n: 'styles.css + renderer.js + cal.js', ico: '🧱', d: 'Paredes y motor: estilos, dibujo de las 13 lunas y navegación. No tocar para un aporte normal.' },
  { n: '*-modulo.js (uno por tema)', ico: '🧩', d: 'Piezas: cada herramienta es un archivo independiente (ej: este archivo, ia-modulo.js, ciberseguridad-modulo.js). Patrón: datos arriba + diálogo + ensureSection + registro en ALL_BTNS/BTN_HOME.' },
  { n: 'data/territorios/penco/*.json', ico: '🗺️', d: 'El territorio en datos: lunas, eventos, talleres, especies, actores. Para llevarlo a otra comuna, entra a la comunidad: ahí te guiamos para copiar y reescribir estos JSON sin romper nada.' },
  { n: 'userData local (sin nube)', ico: '🔒', d: 'Tus bitácoras viven en tu perfil del dispositivo (Electron userData / localStorage web). Nada se envía fuera. Respaldo en 💾 Respaldo.' },
  { n: 'sw.js + manifest + package.json', ico: '📦', d: 'Offline y empaque: service worker para web, manifiesto instalable, y lista de archivos para el .exe portable y Android.' }
];

var COMUNIDAD_CAL = {
  whatsapp: 'https://chat.whatsapp.com/GjY8HaN7YlQ5efaVhrrdXp',
  telegram: 'https://t.me/+N00Hp6jwdOBmYWUx',
  github: 'https://github.com/semilleroconsciente/calendario-13-lunas',
  email: 'semilleroconsciente@gmail.com'
};

var REPLICA = [
  { t: '1 · Entra a la comunidad', d: 'No lo hagas en soledad. Entra al <b>WhatsApp o Telegram del Calendario</b>: ahí están las personas que ya lo mantienen, responden dudas y te dan la bienvenida a tu comuna.' },
  { t: '2 · Recibe las instrucciones guiadas', d: 'En la comunidad recibes <b>paso a paso cómo replicar el Calendario en tu comuna</b> (qué copiar, qué datos cambiar, cómo probar y cómo compartir), sin necesidad de saber programar al inicio.' },
  { t: '3 · Adapta con acompañamiento', d: 'Con ayuda de la comunidad adaptas nombres, fiestas, mareas, teléfonos y especies de tu territorio. Si te trabas, preguntas y alguien te apaña.' },
  { t: '4 · Ayuda a hacerlo crecer y mejorar', d: 'Comparte lo que aprendiste, reporta errores, trae datos de tu comuna o enseña a otros. Cada réplica <b>mejora el Calendario para todas las comunas</b> (código GPLv3 + contenido CC BY-NC-SA 4.0, siempre con crédito).' }
];

var SIN_CODIGO = [
  { n: 'Probar y reportar', ico: '🔎', d: 'Usa una herramienta 10 min y anota: qué hiciste, qué esperabas, qué pasó (con foto del error). Un buen reporte vale oro.' },
  { n: 'Escribir y traducir', ico: '✍️', d: 'Mejora un texto confuso, traduce al mapuzugun o crea una guía de 1 página para tu sector. Contenido = aporte.' },
  { n: 'Enseñar en terreno', ico: '🙋', d: 'Haz un taller de 30 min en tu JJ.VV. con esta sección abierta. Anota dudas: son la lista de mejoras.' },
  { n: 'Datos del territorio', ico: '🗺️', d: 'Aporta teléfonos vigentes, fechas de fiestas, puntos de encuentro, especies vistas. Los .json viven de eso.' },
  { n: 'Diseño y difusión', ico: '🎨', d: 'Iconos, afiches, videos cortos explicando una herramienta. El contenido propio va con licencia CC BY-NC-SA 4.0 para reutilizar (con crédito, sin uso comercial y compartiendo igual).' },
  { n: 'Validar saberes', ico: '🌿', d: 'En Lawen/Huerta/Bosque: confirma o corrige con tu experiencia (“en mi sector la siembra va 2 semanas después”).' }
];

var CON_CODIGO = [
  { n: 'Arreglar un detalle', ico: '🔧', d: 'Falta ortográfica, botón sin keywords, fecha desactualizada. Cambios chicos, riesgo cero. Ideal primer aporte.' },
  { n: 'Nuevo módulo temático', ico: '🧩', d: 'Copia este archivo como plantilla, cambia datos y diálogo, regístralo en MODS + sw.js + package.json. 1 tema = 1 archivo.' },
  { n: 'Mejora de accesibilidad', ico: '♿', d: 'Contraste, tamaño de letra, navegación por teclado, textos para lector de pantalla. Ayuda a mayores y baja visión.' },
  { n: 'Rendimiento / offline', ico: '⚡', d: 'Achicar imágenes, diferir scripts, cachear JSON. Cada KB menos = más hogares con celu viejo incluido.' }
];

var CHEQUEO = [
  { id: 'o1', n: 'Uso al menos 2 programas libres a diario', d: 'Navegador libre, oficina libre, mapas offline… Cuenta lo que ya usas.' },
  { id: 'o2', n: 'Sé explicar las 4 libertades en 1 minuto', d: 'Usar, estudiar, compartir, mejorar. Si puedes contarlo, puedes enseñarlo.' },
  { id: 'o3', n: 'Distingo gratis vs libre', d: 'WhatsApp es gratis pero cerrado; Firefox es libre (y también gratis). El precio no define la libertad.' },
  { id: 'o4', n: 'Reviso la licencia antes de copiar', d: 'GPL/CC: sé qué puedo hacer y qué crédito debo dar (código GPLv3 + contenido CC BY-NC-SA 4.0 en este proyecto).' },
  { id: 'o5', n: 'Mi respaldo no depende de una sola empresa', d: 'Copia local + 💾 Respaldo de la app, no solo “la nube” de un gigante.' },
  { id: 'o6', n: 'Compartí algo libre este mes', d: 'Pasaste el Calendario en pendrive, enseñaste Firefox, agregaste tu sede al mapa.' },
  { id: 'o7', n: 'Reporté o propuse 1 mejora', d: 'Un error con foto, una idea escrita, un dato corregido. Quedó en tu bitácora.' },
  { id: 'o8', n: 'Entiendo dónde viven mis datos', d: 'Sé qué guarda esta app en local y qué subo yo a redes/nubes externas.' },
  { id: 'o9', n: 'Puedo instalar sin “activador” trucho', d: 'Nada pirata en mi PC/celu: todo con licencia clara (libre o pagada).' },
  { id: 'o10', n: 'Sé replicar este proyecto', d: 'Podría copiar la carpeta y adaptarla a otra comuna siguiendo la pestaña Proyecto.' }
];

var GLOSARIO = [
  { t: 'Código fuente', d: 'La “receta” legible del programa (.js, .html…). Abierto = puedes leerlo y modificarlo.' },
  { t: 'Licencia', d: 'El permiso escrito de qué puedes hacer. Sin licencia clara, por defecto es “todos los derechos reservados”.' },
  { t: 'Copyleft', d: 'Regla recíproca (GPL): si mejoras y distribuyes, debes compartir tu mejora con la misma libertad.' },
  { t: 'Fork / réplica', d: 'Copia independiente para llevarla por otro camino (ej: este Calendario adaptado a otra comuna).' },
  { t: 'Repositorio', d: 'Carpeta con historia de cambios (ej: Git/GitHub). Aquí el proyecto vive en archivos + git.' },
  { t: 'Offline-first', d: 'Diseñado para funcionar sin internet primero (como esta app); la red es opcional.' },
  { t: 'Dominio público', d: 'Sin derechos reservados: uso totalmente libre (CC0).' },
  { t: 'Atribución', d: 'Dar crédito al autor original. Casi todas las licencias libres lo exigen: es lo mínimo.' },
  { t: 'Binario vs fuente', d: 'Binario = programa compilado (solo corre); fuente = receta (se estudia). Lo libre entrega la receta.' },
  { t: 'Soberanía digital', d: 'Que tu comunidad decida sobre sus datos y herramientas, sin depender de un proveedor extranjero.' },
  { t: 'Puerta trasera', d: 'Acceso oculto en software cerrado. El código abierto permite descubrirlo; el cerrado no.' },
  { t: 'Estándar abierto', d: 'Formato sin dueño (ej: .odt, .pdf, .json): garantiza que podrás abrir tus archivos en 20 años.' }
];

var QUIZ = [
  { q: '¿Qué significa que un programa sea “libre” (open source)?', opts: ['Que es gratis y puedo piratearlo', 'Que tengo las 4 libertades: usar, estudiar, compartir y mejorar', 'Que no tiene dueño ni reglas'], ok: 1, por: 'Libre = libertad (las 4), no precio. Y sí tiene reglas: su licencia.' },
  { q: 'Encuentras un programa “gratis” pero sin código ni licencia. ¿Es open source?', opts: ['Sí, si no pagué es libre', 'No: sin fuente y sin licencia no hay libertades garantizadas', 'Sí, si lo compartió un amigo'], ok: 1, por: 'Gratis ≠ libre. Sin fuente no puedes estudiarlo; sin licencia no puedes compartirlo legalmente.' },
  { q: 'Quieres adaptar este Calendario (código GPLv3) a tu comuna y compartirlo. ¿Qué debes hacer?', opts: ['Pedir permiso al autor y pagar', 'Copiar libremente manteniendo el crédito y publicando tu versión también como GPLv3', 'No se puede: es de Penco'], ok: 1, por: 'GPLv3 lo permite expresamente: copia, adapta y comparte conservando el crédito y la misma licencia (copyleft).' },
  { q: 'Mejoras un programa GPL y lo distribuyes en tu organización. ¿Qué exige la GPL?', opts: ['Nada, me quedo el código', 'Publicar mi versión modificada también como GPL', 'Pagar al autor original'], ok: 1, por: 'Copyleft: lo derivado distribuido debe seguir libre con la misma licencia.' },
  { q: 'Quieres usar una ilustración de las lunas (CC BY-NC-SA 4.0) en un afiche que vas a VENDER. ¿Qué debes hacer?', opts: ['Usarla igual: lo libre es gratis para todo', 'Pedir permiso previo: el NC prohíbe el uso comercial sin autorización', 'Cambiarle los colores y ya es mía'], ok: 1, por: 'CC BY-NC-SA 4.0: el componente NC exige permiso para usos comerciales. Los usos comunitarios/educativos sin fines de lucro sí están permitidos.' },
  { q: '¿Cuál es un aporte válido SIN saber programar?', opts: ['Ninguno, solo programadores aportan', 'Reportar un error con foto y pasos para repetirlo', 'Compartir mi clave para que otro arregle'], ok: 1, por: 'Reportar, probar, traducir, enseñar y corregir datos son aportes centrales.' },
  { q: '¿Qué formato garantiza abrir tus archivos en 20 años?', opts: ['Un formato cerrado de una sola empresa', 'Un estándar abierto (.odt, .pdf, .json, .csv)', 'Una captura de pantalla'], ok: 1, por: 'Estándares abiertos sin dueño = futuro legible. Lo cerrado puede volverse ilegible.' },
  { q: 'Tu JJ.VV. quiere mapa offline sin dar datos a una empresa. ¿Qué recomiendas?', opts: ['Google Maps con cuenta obligatoria', 'OpenStreetMap + Organic Maps con mapa descargado', 'Foto del mapa de papel por WhatsApp'], ok: 1, por: 'OSM es libre, offline y comunitario: la sede puede agregar sus propios puntos.' },
  { q: '¿Dónde viven tus notas de ESTA app?', opts: ['En un servidor extranjero obligatoriamente', 'En tu dispositivo (local y privado), con respaldo manual tuyo', 'En Facebook'], ok: 1, por: 'Offline-first: tus bitácoras están en tu perfil local. Tú decides si exportarlas.' }
];

/* ---------------- DIALOGO ---------------- */
var TABS = ['Guia', 'Licencias', 'Programas', 'Proyecto', 'Aportar', 'Quiz'];
function switchTab(t) {
  TABS.forEach(function (x) {
    var p = $('os' + x), b = $('tabOs' + x);
    if (p) p.classList.toggle('hidden', x !== t);
    if (b) b.classList.toggle('btn-accent', x === t);
  });
  markSeen('tab-' + t);
}
function makeDialog() {
  var old = $('openSourceDialog');
  if (old) return old;
  var d = document.createElement('dialog');
  d.id = 'openSourceDialog';
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">🌐 Código Abierto — el saber se comparte</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Por qué existe lo libre, qué puedes usar gratis y legal en Penco, cómo funciona <b>esta misma app (código GPLv3 + contenido CC BY-NC-SA 4.0)</b> y cómo aportar aunque no programes. Todo <b>offline y privado</b>.</p>' +
    '<div id="osProgress" class="muted su-245797"></div>' +
    '<div class="timer-tabs su-dd1da5">' +
    '<button type="button" id="tabOsGuia" class="btn btn-accent su-30e741">📖 Guía</button>' +
    '<button type="button" id="tabOsLicencias" class="btn su-30e741">⚖️ Licencias</button>' +
    '<button type="button" id="tabOsProgramas" class="btn su-30e741">🧰 Programas</button>' +
    '<button type="button" id="tabOsProyecto" class="btn su-30e741">🌙 Este proyecto</button>' +
    '<button type="button" id="tabOsAportar" class="btn su-30e741">🤝 Aportar</button>' +
    '<button type="button" id="tabOsQuiz" class="btn su-30e741">🧠 Soberanía + quiz</button></div>' +
    '<div id="osGuia"></div>' +
    '<div id="osLicencias" class="hidden"></div>' +
    '<div id="osProgramas" class="hidden"></div>' +
    '<div id="osProyecto" class="hidden"></div>' +
    '<div id="osAportar" class="hidden"></div>' +
    '<div id="osQuiz" class="hidden"></div>' +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  TABS.forEach(function (t) {
    var b = $('tabOs' + t);
    if (b) b.onclick = function () { switchTab(t); renderAll(); };
  });
  return d;
}
function buildIfNeeded() { makeDialog(); }

function paintProgress() {
  var box = $('osProgress'); if (!box) return;
  try {
    var s = store();
    var vistos = TABS.filter(function (t) { return s.exploradas['tab-' + t]; }).length;
    var checks = CHEQUEO.filter(function (c) { return s.checks[c.id]; }).length;
    box.textContent = '🌱 Exploradas ' + vistos + '/6 pestañas · ✅ Chequeo ' + checks + '/10 · 🏆 Quiz mejor: ' + (s.quizBest || 0) + '/' + QUIZ.length + ' · 🤝 Aportes: ' + s.aportes.length;
  } catch (e) {}
}

/* ---------------- RENDER ---------------- */
function renderGuia() {
  var box = $('osGuia'); if (!box) return;
  box.innerHTML =
    '<div class="si-card"><h4>🌐 ¿Qué es el código abierto? (en 1 minuto)</h4><p>Es saber con la <b>receta a la vista</b>: cualquier persona puede usar, copiar, estudiar y mejorar un programa o una guía. Como la cocina de la abuela que comparte la receta en vez de venderla envasada y secreta. Este Calendario es así: <b>código GPLv3 + contenido CC BY-NC-SA 4.0</b> (ver LICENSE.md), funciona sin internet y tus datos quedan en tu aparato.</p>' +
    '<p><b>Método L.E.E.R.</b> ante cualquier programa: <b>L</b>ibre ¿o solo gratis? · <b>E</b>studia quién lo hace y qué pide a cambio · <b>E</b>xporta: ¿puedo sacar mis datos? · <b>R</b>eparte: ¿puedo compartirlo legal con mi vecina?</p></div>' +
    LIBERTADES.map(function (r) {
      return '<div class="si-card"><h4>' + r.ico + ' ' + esc(r.n) + '</h4><p>' + r.txt + '</p></div>';
    }).join('') +
    '<div class="si-card"><h4>🌱 ¿Por qué le sirve a Penco?</h4><p>• <b>Plata:</b> equipar una sede o un negocio sin pagar licencias ni caer en piratería.<br>• <b>PC viejos:</b> Linux + LibreOffice reviven equipos que Windows ya botó.<br>• <b>Sin señal:</b> mapas, manuales y este calendario funcionan offline (temporal, cerro, caleta).<br>• <b>Confianza:</b> al ser auditable, la posta, la escuela o la JJ.VV. pueden verificar que no espía.<br>• <b>Herencia:</b> si quien lo creó se va, la comunidad conserva la receta y sigue mejorándola.</p></div>' +
    '<div class="si-card"><h4>🚫 Mitos frecuentes</h4>' + MITOS.map(function (m) {
      return '<p><b>' + esc(m.m) + '</b><br><span class="muted">' + m.r + '</span></p>';
    }).join('') + '</div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="osGoProg" class="btn btn-accent su-30e741">🧰 Ver programas libres para mi casa →</button></div>';
  var g = $('osGoProg');
  if (g) g.onclick = function () { switchTab('Programas'); renderAll(); };
}

var licSel = 'gpl';
function renderLicencias() {
  var box = $('osLicencias'); if (!box) return;
  var sel = LICENCIAS.filter(function (l) { return l.id === licSel; })[0] || LICENCIAS[0];
  box.innerHTML =
    '<div class="si-card"><h4>⚖️ Licencias en simple: el permiso escrito</h4><p>Sin licencia clara, todo es “reservado”. Con licencia libre, el autor <b>regala libertades por escrito</b>. Toca cada una para ver qué permite, qué exige y cuándo conviene. <b>Este proyecto usa licencia dual</b>: código <b>GPLv3</b> (package.json → "license": "GPL-3.0-or-later", archivo COPYING) + contenido creativo <b>CC BY-NC-SA 4.0</b> (diseño, textos, ilustraciones — ver LICENSE.md).</p></div>' +
    '<div class="timer-tabs su-62da06">' + LICENCIAS.map(function (l) {
      return '<button type="button" data-lic="' + l.id + '" class="btn' + (l.id === licSel ? ' btn-accent' : '') + ' su-30e741">' + l.ico + ' ' + esc(l.nombre.split(' (')[0]) + '</button>';
    }).join('') + '</div>' +
    '<div class="menstrual-card su-f3d143"><h4>' + sel.ico + ' ' + esc(sel.nombre) + '</h4>' +
    '<p class="muted su-11a508">' + esc(sel.tipo) + '</p>' +
    '<p><b>✅ Permite:</b> ' + sel.permite + '</p>' +
    '<p><b>📋 Exige:</b> ' + sel.exige + '</p>' +
    '<p><b>🎯 Ideal para:</b> ' + sel.ideal + '</p>' +
    '<p class="muted su-11a508"><b>⚠️ Ojo:</b> ' + sel.ojo + '</p></div>' +
    '<div class="si-card"><h4>🤔 ¿Cuál elijo para lo mío?</h4><p>• <b>Quiero máxima difusión</b> (guía, app comunitaria) → <b>MIT o CC BY</b>.<br>• <b>Me da miedo que alguien se lo apropie o lo venda cerrado</b> → <b>GPL</b> (código, como este proyecto) o <b>CC BY-NC-SA</b> (contenido, como este proyecto).<br>• <b>Es biblioteca para que otros la usen</b> → <b>Apache 2.0 o MPL</b>.<br>• <b>Son datos/plantillas para regalar</b> → <b>CC0</b>.<br>• <b>No sé aún</b> → parte con GPL (código) / CC BY-NC-SA (contenido) si quieres proteger el bien común, como este Calendario.</p>' +
    '<p class="muted su-11a508">Regla de oro: la licencia se escribe en archivos (COPYING + LICENSE.md o encabezado) + se nombra en la portada. Sin archivo, no vale.</p></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="osCopyMit" class="btn su-30e741">📋 Copiar aviso de licencia dual de este proyecto</button></div>';
  box.querySelectorAll('[data-lic]').forEach(function (b) {
    b.onclick = function () { licSel = b.getAttribute('data-lic'); markSeen('lic-' + licSel); renderLicencias(); };
  });
  var c = $('osCopyMit');
  if (c) c.onclick = function () { share('Licencia dual — Calendario 13 Lunas', 'Calendario de las 13 Lunas — Mari Küla Küyen (Penco), © 2026 Semillero Consciente. CÓDIGO: GNU GPLv3 o posterior (ver COPYING). CONTENIDO (diseño, textos, ilustraciones): CC BY-NC-SA 4.0 (https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es). Puedes usar, copiar y adaptar manteniendo el crédito y la misma licencia. Sin garantía.'); };
}

var progQ = '', progCat = 'todas';
function renderProgramas() {
  var box = $('osProgramas'); if (!box) return;
  var cats = ['todas'];
  PROGRAMAS.forEach(function (p) { if (cats.indexOf(p.cat) < 0) cats.push(p.cat); });
  function progLinks(p) {
    var out = '';
    try {
      (p.links || []).forEach(function (l) {
        if (l && l.u) out += '<a href="' + esc(l.u) + '" target="_blank" rel="noopener" class="btn su-abb0f2">🌐 ' + esc(l.t || 'Sitio oficial') + '</a>';
      });
    } catch (e) {}
    return out;
  }
  function progHay(p) {
    var names = '';
    try { names = ' ' + (p.links || []).map(function (l) { return l.t || ''; }).join(' '); } catch (e) {}
    return (p.n + ' ' + p.para + ' ' + p.reemplaza + ' ' + p.cat + names);
  }
  var q = (progQ || '').toLowerCase();
  var list = PROGRAMAS.filter(function (p) {
    var okC = (progCat === 'todas' || p.cat === progCat);
    var okQ = (!q || progHay(p).toLowerCase().indexOf(q) >= 0);
    return okC && okQ;
  });
  box.innerHTML =
    '<div class="si-card"><h4>🧰 Botiquín libre para la casa y la organización</h4><p>Todo aquí es <b>legal, gratuito y auditable</b>. Busca por necesidad (“mapa sin internet”, “oficina”, “video”) o filtra por grupo. El botón <b>🌐 abre el sitio oficial</b> (solo necesitas internet para descargar; después todo funciona offline).</p>' +
    '<div class="conv-row"><label class="su-4b3de7">Buscar <input type="text" id="osProgQ" placeholder="ej: mapa sin internet, oficina, claves, video..." maxlength="60" value="' + esc(progQ) + '"></label>' +
    '<label>Grupo <select id="osProgCat">' + cats.map(function (c) { return '<option value="' + esc(c) + '"' + (c === progCat ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></label></div>' +
    '<p class="muted su-11a508">' + list.length + ' programas · toca el que te sirva y márcalo como “ya lo probé”.</p></div>' +
    (list.length ? list.map(function (p, i) {
      var seen = false;
      try { seen = !!store().exploradas['prog-' + p.n]; } catch (e) {}
      var lk = progLinks(p);
      return '<div class="si-card"><h4>' + p.ico + ' ' + esc(p.n) + ' ' + (seen ? '<span class="chip">✅ probado</span>' : '') + '</h4>' +
        '<p><b>¿Para qué?</b> ' + p.para + '</p>' +
        '<p><b>Reemplaza a:</b> ' + esc(p.reemplaza) + ' · <span class="muted">' + esc(p.cat) + '</span></p>' +
        '<p class="muted su-11a508">💡 ' + esc(p.dato) + '</p>' +
        (lk ? '<div class="dlg-actions su-117179">' + lk + '</div>' : '') +
        '<div class="dlg-actions su-59a5a8"><button type="button" data-prog="' + esc(p.n) + '" class="btn su-30e741">' + (seen ? '↩️ Marcar por probar' : '✅ Ya lo probé') + '</button></div></div>';
    }).join('') : '<p class="muted">Sin resultados. Prueba “mapa”, “oficina”, “video”, “claves”…</p>');
  var qi = $('osProgQ'), cs = $('osProgCat');
  if (qi) qi.oninput = function () { progQ = qi.value; var pos = qi.selectionStart; renderProgramas(); var nq = $('osProgQ'); if (nq) { try { nq.focus(); nq.setSelectionRange(pos, pos); } catch (e) {} } };
  if (cs) cs.onchange = function () { progCat = cs.value; renderProgramas(); };
  box.querySelectorAll('[data-prog]').forEach(function (b) {
    b.onclick = function () {
      try {
        var s = store(); var k = 'prog-' + b.getAttribute('data-prog');
        if (s.exploradas[k]) delete s.exploradas[k]; else s.exploradas[k] = 1;
        save('Progreso guardado'); renderProgramas(); paintProgress();
      } catch (e) {}
    };
  });
}

function renderProyecto() {
  var box = $('osProyecto'); if (!box) return;
  box.innerHTML =
    '<div class="si-card"><h4>🌙 Esta app ES la lección (GPLv3 + CC BY-NC-SA 4.0)</h4><p>El <b>Calendario de las 13 Lunas</b> es libre con licencia dual: el <b>código</b> (Web, APK, .exe) bajo <b>GNU GPLv3</b> y el <b>contenido creativo</b> (diseño, textos, ilustraciones de las lunas) bajo <b>CC BY-NC-SA 4.0</b>. Puedes leer cada archivo, copiarlo y adaptarlo a tu comuna manteniendo el crédito y la misma licencia. Funciona <b>offline-first</b>, guarda todo <b>en tu dispositivo</b> y cada tema es un archivo <b>*-modulo.js</b> independiente —incluida esta sección que estás leyendo (<b>open-source-modulo.js</b>).</p>' +
    '<p class="muted su-11a508">package.json → "license": "GPL-3.0-or-later" · COPYING (GPLv3) + LICENSE.md (dual) incluidos · Sin cuentas · Sin rastreo · Funciona con doble clic.</p></div>' +
    '<div class="si-card"><h4>🧩 Anatomía (¿dónde está cada cosa?)</h4>' + ARQUITECTURA.map(function (a) {
      return '<p><b>' + a.ico + ' ' + esc(a.n) + ':</b> ' + a.d + '</p>';
    }).join('') + '</div>' +
    '<div class="si-card"><h4>🗺️ Llévalo a tu comuna con la comunidad 🌱</h4><p>¿Quieres este Calendario en <b>tu comuna</b>? No lo hagas en soledad: <b>entra a la comunidad del Calendario</b>. Ahí recibes <b>todas las instrucciones paso a paso</b> para replicarlo, con acompañamiento de quienes ya lo mantienen, <b>y nos ayudas a hacerlo crecer y mejorar</b> para todas las comunas.</p>' +
    REPLICA.map(function (r) {
      return '<p><b>' + esc(r.t) + ':</b> ' + r.d + '</p>';
    }).join('') +
    '<div class="dlg-actions su-117179">' +
    '<a href="' + COMUNIDAD_CAL.whatsapp + '" target="_blank" rel="noopener" class="btn btn-accent su-30e741">💬 Entrar al WhatsApp</a> ' +
    '<a href="' + COMUNIDAD_CAL.telegram + '" target="_blank" rel="noopener" class="btn su-30e741">✈️ Entrar al Telegram</a></div>' +
    '<p class="muted su-11a508">Al entrar preséntate: “Hola, soy de [tu comuna] y quiero replicar el Calendario”. Te pasamos la guía completa y te acompañamos. También puedes escribir a ' + esc(COMUNIDAD_CAL.email) + ' o ver el código en GitHub.</p>' +
    '<div class="dlg-actions su-117179">' +
    '<a href="' + COMUNIDAD_CAL.github + '" target="_blank" rel="noopener" class="btn su-abb0f2">🌐 Ver comunidad en GitHub</a></div></div>' +
    '<div class="si-card"><h4>🔗 Puentes con otras secciones</h4><p>• <b>🛡️ Ciberseguridad:</b> verifica links, usa gestor de claves y 2 pasos antes de publicar tu réplica.<br>• <b>🤖 IA (módulo Aprender):</b> pide a la IA “explícame este .js como si tuviera 12 años” o “redacta la guía de mi comuna”.<br>• <b>📡 Red Comunitaria:</b> comparte la app en pendrive o Mesh sin internet.<br>• <b>💾 Respaldo:</b> exporta tus bitácoras antes de experimentar con copias.</p></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="osGoAportar" class="btn btn-accent su-30e741">🤝 Quiero aportar →</button> ' +
    '<button type="button" id="osShareProj" class="btn su-30e741">📤 Compartir el proyecto</button></div>';
  var g = $('osGoAportar');
  if (g) g.onclick = function () { switchTab('Aportar'); renderAll(); };
  var sp = $('osShareProj');
  if (sp) sp.onclick = function () { share('🌙 Calendario 13 Lunas — libre (GPLv3 + CC BY-NC-SA 4.0)', 'Calendario de las 13 Lunas (Penco): app offline, privada y libre. Código GPLv3 + contenido CC BY-NC-SA 4.0. Léelo, cópialo y adaptalo a tu comuna. Pestaña 🌐 Código Abierto → Este proyecto.'); };
}

function renderAportar() {
  var box = $('osAportar'); if (!box) return;
  var s = store();
  var aportes = s.aportes || [];
  box.innerHTML =
    '<div class="si-card"><h4>🤝 Aportar: hay lugar para todas las manos</h4><p>El open source vive de aportes chicos y constantes, no de genios aislados. <b>No necesitas programar</b> para empezar: el 80% de lo que falta es probar, escribir claro y traer datos del territorio.</p></div>' +
    '<div class="si-card"><h4>🌱 Sin saber programar (empieza aquí)</h4>' + SIN_CODIGO.map(function (a) {
      return '<p><b>' + a.ico + ' ' + esc(a.n) + ':</b> ' + a.d + '</p>';
    }).join('') + '</div>' +
    '<div class="si-card"><h4>💻 Con código (cuando quieras)</h4>' + CON_CODIGO.map(function (a) {
      return '<p><b>' + a.ico + ' ' + esc(a.n) + ':</b> ' + a.d + '</p>';
    }).join('') +
    '<p class="muted su-11a508">Plantilla ideal: copia <b>open-source-modulo.js</b> (este archivo, el más comentado) y cámbiale datos + textos. Patrón obligatorio: diálogo propio + ensureSection + registro ALL_BTNS/BTN_HOME/BTN_ORDER + entrada en MODS, sw.js y package.json.</p></div>' +
    '<div class="menstrual-card su-68a1a9"><h4>✅ Checklist de mi primer aporte</h4>' +
    ['Elegí algo chico (1 error, 1 dato, 1 texto)', 'Probé mi cambio con doble clic a index.html', 'Anoté qué cambié en 3 líneas', 'Pedí a otra persona que lo pruebe', 'Compartí mi copia (pendrive / archivo)'].map(function (t, i) {
      var on = !!(s.checks['aporte-step-' + i]);
      return '<label class="check-row"><input type="checkbox" data-apstep="' + i + '"' + (on ? ' checked' : '') + '> ' + esc(t) + '</label>';
    }).join('') + '</div>' +
    '<div class="menstrual-card"><h4>📓 Mi bitácora de aportes (privada, local)</h4>' +
    '<p class="muted su-11a508">Queda solo en tu dispositivo. Anota qué aportaste para no olvidar y celebrar tu racha.</p>' +
    '<div class="conv-row"><label class="su-4b3de7">Mi aporte <input type="text" id="osAporteTxt" placeholder="ej: corregí teléfono CESFAM Lirquén, enseñé Firefox a mi mamá" maxlength="120"></label></div>' +
    '<div class="conv-row"><label>Tipo <select id="osAporteTipo"><option>Probar / reportar</option><option>Dato territorial</option><option>Texto / traducción</option><option>Enseñar / taller</option><option>Diseño / difusión</option><option>Código</option></select></label>' +
    '<label>Fecha <input type="date" id="osAporteFecha"></label></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="osAporteAdd" class="btn btn-accent su-30e741">+ Guardar aporte</button></div>' +
    '<div id="osAporteList" class="habits-list su-d2c171">' + (aportes.length ? aportes.map(function (a) {
      return '<div class="habit-row"><span>🤝 <b>' + esc(a.tipo) + '</b> · ' + esc(a.txt) + ' <span class="muted">(' + esc(a.fecha || '') + ')</span></span><span class="su-49cd09"><button type="button" class="btn su-30e741" data-apshare="' + a.id + '">📤</button><button type="button" class="btn su-214f75" data-apdel="' + a.id + '">✕</button></span></div>';
    }).join('') : '<p class="muted">Aún sin aportes. El primero puede ser de 5 minutos: reporta algo que no entendiste de esta sección.</p>') + '</div>' +
    '<div class="dlg-actions su-efea1d"><span class="muted su-11a508">Total: ' + aportes.length + ' aporte(s)</span><button type="button" id="osAporteShareAll" class="btn su-30e741">📤 Compartir mi racha</button></div></div>' +
    '<div class="si-card"><h4>📋 Plantillas copiar/pegar</h4>' +
    '<div class="dlg-actions su-117179">' +
    '<button type="button" id="osTplBug" class="btn su-30e741">🐞 Reporte de error</button>' +
    '<button type="button" id="osTplIdea" class="btn su-30e741">💡 Propuesta de mejora</button>' +
    '<button type="button" id="osTplMod" class="btn su-30e741">🧩 Ficha de módulo nuevo</button></div>' +
    '<p class="muted su-11a508">Se copian al portapapeles: pégalas en tu cuaderno, WhatsApp o donde coordine tu grupo.</p></div>';
  box.querySelectorAll('[data-apstep]').forEach(function (c) {
    c.onchange = function () {
      var st = store(); st.checks['aporte-step-' + c.getAttribute('data-apstep')] = c.checked ? 1 : 0;
      save('Guardado ✓'); paintProgress();
    };
  });
  var add = $('osAporteAdd');
  if (add) add.onclick = function () {
    var t = clean((($('osAporteTxt') || {}).value || ''), 120);
    if (!t) return alert('Escribe tu aporte en 1 línea primero');
    var tipo = ($('osAporteTipo') || {}).value || 'Aporte';
    var f = ($('osAporteFecha') || {}).value || '';
    var st = store();
    st.aportes.unshift({ id: uid('ap'), txt: t, tipo: tipo, fecha: f });
    save('Aporte guardado 🤝'); renderAportar(); paintProgress();
  };
  box.querySelectorAll('[data-apdel]').forEach(function (b) {
    b.onclick = function () {
      var st = store(); st.aportes = st.aportes.filter(function (a) { return a.id !== b.getAttribute('data-apdel'); });
      save('Borrado'); renderAportar(); paintProgress();
    };
  });
  box.querySelectorAll('[data-apshare]').forEach(function (b) {
    b.onclick = function () {
      var st = store(); var a = st.aportes.filter(function (x) { return x.id === b.getAttribute('data-apshare'); })[0];
      if (a) share('🤝 Mi aporte al código abierto', a.tipo + ': ' + a.txt + (a.fecha ? ' (' + a.fecha + ')' : '') + ' — Calendario 13 Lunas.');
    };
  });
  var sa = $('osAporteShareAll');
  if (sa) sa.onclick = function () {
    var st = store();
    if (!st.aportes.length) return alert('Guarda tu primer aporte arriba 🙂');
    share('🤝 Mi racha open source', 'Llevo ' + st.aportes.length + ' aporte(s) al Calendario 13 Lunas: ' + st.aportes.slice(0, 5).map(function (a) { return a.tipo + ': ' + a.txt; }).join(' · '));
  };
  var tb = $('osTplBug');
  if (tb) tb.onclick = function () { share('🐞 Reporte de error', '🐞 REPORTE\n1) Dónde estaba (botón/sección): \n2) Qué hice (pasos): \n3) Qué esperaba: \n4) Qué pasó (pega foto si puedes): \n5) Mi aparato (ej: Samsung A12 / PC Windows): '); };
  var ti = $('osTplIdea');
  if (ti) ti.onclick = function () { share('💡 Propuesta de mejora', '💡 IDEA\nProblema en Penco que resuelve: \nPropuesta en 2 líneas: \nPara quién es (mayores, jóvenes, negocio…): \nCómo sabré que funcionó: '); };
  var tm = $('osTplMod');
  if (tm) tm.onclick = function () { share('🧩 Ficha de módulo nuevo', '🧩 MÓDULO NUEVO\nNombre + icono: \nQué problema resuelve: \nPestañas (3-6): \nDatos que necesita: \nBitácora local (qué guarda): '); };
}

var quizIdx = 0, quizPts = 0;
function renderQuiz() {
  var box = $('osQuiz'); if (!box) return;
  var s = store();
  var html = '<div class="si-card"><h4>🧭 Chequeo de soberanía digital (10 puntos)</h4><p>Márcalo con honestidad 1 vez por luna. No se envía a nadie: es tu brújula.</p></div>';
  html += '<div class="menstrual-card"><h4>✅ Mi chequeo (<span id="osCheckN">' + CHEQUEO.filter(function (c) { return s.checks[c.id]; }).length + '</span>/10)</h4>';
  html += CHEQUEO.map(function (c) {
    var on = !!s.checks[c.id];
    return '<label class="check-row" title="' + esc(c.d) + '"><input type="checkbox" data-oscheck="' + c.id + '"' + (on ? ' checked' : '') + '> ' + esc(c.n) + '</label><p class="muted su-a8c315">' + esc(c.d) + '</p>';
  }).join('');
  html += '<div class="dlg-actions su-59a5a8"><button type="button" id="osCheckShare" class="btn su-30e741">📤 Compartir mi puntaje</button></div></div>';
  html += '<div class="si-card"><h4>📚 Glosario mínimo (12 palabras)</h4>' + GLOSARIO.map(function (g) {
    return '<p><b>' + esc(g.t) + ':</b> <span class="muted">' + esc(g.d) + '</span></p>';
  }).join('') + '</div>';
  html += '<div class="menstrual-card su-68a1a9"><h4>🧠 Quiz: ¿cachai lo libre? (mejor: ' + (s.quizBest || 0) + '/' + QUIZ.length + ')</h4><div id="osQuizBox"><p class="muted">' + QUIZ.length + ' preguntas, unos minutos. Toca empezar.</p></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="osQuizStart" class="btn btn-accent su-30e741">▶ Empezar quiz</button></div></div>';
  box.innerHTML = html;
  box.querySelectorAll('[data-oscheck]').forEach(function (c) {
    c.onchange = function () {
      var st = store(); st.checks[c.getAttribute('data-oscheck')] = c.checked ? 1 : 0;
      save('Guardado ✓');
      var n = $('osCheckN'); if (n) n.textContent = CHEQUEO.filter(function (x) { return st.checks[x.id]; }).length;
      paintProgress();
    };
  });
  var sh = $('osCheckShare');
  if (sh) sh.onclick = function () {
    var st = store(); var n2 = CHEQUEO.filter(function (x) { return st.checks[x.id]; }).length;
    share('🧭 Mi soberanía digital', 'Saqué ' + n2 + '/10 en el chequeo de soberanía digital del Calendario 13 Lunas. Mi próximo paso: compartir 1 programa libre esta luna.');
  };
  $('osQuizStart').onclick = function () { quizIdx = 0; quizPts = 0; paintQuiz(); };
  function paintQuiz() {
    var qb = $('osQuizBox'); if (!qb) return;
    if (quizIdx >= QUIZ.length) {
      var st = store();
      if (quizPts > (st.quizBest || 0)) { st.quizBest = quizPts; save('Récord quiz 🏆'); }
      paintProgress();
      qb.innerHTML = '<p><b>Resultado: ' + quizPts + '/' + QUIZ.length + '</b> ' + (quizPts === QUIZ.length ? '🟢 ¡Semilla libre! Ya puedes enseñar esta sección.' : (quizPts >= 5 ? '🟡 Bien encaminado: repasa Licencias.' : '🔴 Lee la Guía con calma y repite.')) + '</p>' +
        '<div class="dlg-actions su-59a5a8"><button type="button" id="osQuizAgain" class="btn su-30e741">🔁 Repetir</button>' +
        '<button type="button" id="osQuizShare" class="btn su-30e741">📤 Compartir resultado</button></div>';
      $('osQuizAgain').onclick = function () { quizIdx = 0; quizPts = 0; paintQuiz(); };
      $('osQuizShare').onclick = function () { share('🌐 Mi quiz open source', 'Saqué ' + quizPts + '/' + QUIZ.length + ' en el quiz de código abierto del Calendario 13 Lunas. Libre = usar, estudiar, compartir y mejorar.'); };
      return;
    }
    var qq = QUIZ[quizIdx];
    qb.innerHTML = '<p><b>' + (quizIdx + 1) + '/' + QUIZ.length + ' ·</b> ' + esc(qq.q) + '</p>' +
      qq.opts.map(function (o, i) { return '<button type="button" data-osopt="' + i + '" class="btn su-b6f6af">' + esc(o) + '</button>'; }).join('') +
      '<p class="muted su-11a508">Puntos: ' + quizPts + '</p>';
    qb.querySelectorAll('[data-osopt]').forEach(function (b) {
      b.onclick = function () {
        var ok = (+b.getAttribute('data-osopt') === qq.ok);
        if (ok) quizPts++;
        qb.innerHTML = '<p>' + (ok ? '✅ ¡Correcto!' : '❌ Casi…') + '</p><p class="muted">' + esc(qq.por) + '</p>' +
          '<div class="dlg-actions su-59a5a8"><button type="button" id="osQuizNext" class="btn btn-accent su-30e741">Siguiente →</button></div>';
        $('osQuizNext').onclick = function () { quizIdx++; paintQuiz(); };
      };
    });
  }
}

function renderAll() {
  try { renderGuia(); } catch (e) {}
  try { renderLicencias(); } catch (e) {}
  try { renderProgramas(); } catch (e) {}
  try { renderProyecto(); } catch (e) {}
  try { renderAportar(); } catch (e) {}
  try { renderQuiz(); } catch (e) {}
  try { paintProgress(); } catch (e) {}
}

/* ---------------- SETUP: integra en Comunidad ---------------- */
var BTNS = [
  { id: 'btnOpenGuia', label: '📖 Qué es lo libre', tab: 'Guia', kw: 'open source codigo abierto libre gratis libertades leer programa auditar soberania digital que es compartir' },
  { id: 'btnOpenLicencias', label: '⚖️ Licencias', tab: 'Licencias', kw: 'licencia gpl gplv3 cc by-nc-sa creative commons copyleft codigo contenido permiso copiar compartir atribuir no comercial' },
  { id: 'btnOpenProgramas', label: '🧰 Programas libres', tab: 'Programas', kw: 'programas gratis linux libreoffice firefox mapas offline osm qgis gimp kdenlive audacity signal jitsi nextcloud bitwarden' },
  { id: 'btnOpenProyecto', label: '🌙 Este proyecto GPL', tab: 'Proyecto', kw: 'proyecto calendario gplv3 cc replicar comuna archivos modulo offline arquitectura github clonar licencia dual' },
  { id: 'btnOpenAportar', label: '🤝 Aportar', tab: 'Aportar', kw: 'aportar contribuir ayudar reportar idea taller codigo voluntariado bitacora checklist como ayudo' },
  { id: 'btnOpenQuiz', label: '🧠 Soberanía + quiz', tab: 'Quiz', kw: 'soberania chequeo quiz glosario prueba puntaje dependencia autonomia' }
];
var SUB_LABEL = { id: 'codigo-abierto', label: '🌐 Código Abierto' };

function ensureSection() {
  var box = document.querySelector('.action-group[data-group="comunidad"] .group-btns');
  if (!box) return;
  var lab = box.querySelector('.sub-label[data-sub="' + SUB_LABEL.id + '"]');
  if (!lab) {
    lab = document.createElement('span');
    lab.className = 'sub-label'; lab.setAttribute('data-sub', SUB_LABEL.id); lab.textContent = SUB_LABEL.label;
    var appLab = box.querySelector('.sub-label[data-sub="app"]');
    if (appLab && appLab.parentNode === box) box.insertBefore(lab, appLab);
    else box.appendChild(lab);
  } else if (!lab.textContent || lab.textContent.indexOf('Código') < 0) {
    lab.textContent = SUB_LABEL.label;
  }
  BTNS.forEach(function (b) {
    var el = document.getElementById(b.id);
    if (!el) {
      el = document.createElement('button');
      el.id = b.id; el.className = 'btn'; el.type = 'button';
      box.appendChild(el);
    }
    el.textContent = b.label;
    el.setAttribute('data-keywords', b.kw);
    try { el.setAttribute('data-sub', SUB_LABEL.id); el.dataset.sub = SUB_LABEL.id; } catch (eS) {}
  });
  try {
    var anchor = lab.nextSibling;
    var appLab2 = box.querySelector('.sub-label[data-sub="app"]');
    BTNS.forEach(function (b) {
      var el = document.getElementById(b.id);
      if (!el) return;
      if (appLab2) box.insertBefore(el, appLab2);
      else box.insertBefore(el, anchor);
    });
    box.insertBefore(lab, document.getElementById(BTNS[0].id));
  } catch (eO) {}
  BTNS.forEach(function (b) {
    var el2 = document.getElementById(b.id);
    if (el2) el2.onclick = function () { openTab(b.tab); };
  });
}

function registerVisibility() {
  try {
    if (typeof ALL_BTNS !== 'undefined') {
      BTNS.forEach(function (b) { if (ALL_BTNS.indexOf(b.id) < 0) ALL_BTNS.push(b.id); });
    }
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') {
      BTNS.forEach(function (b) { BTN_HOME[b.id] = ['comunidad', 'codigo-abierto']; });
    }
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      BTN_ORDER['comunidad|codigo-abierto'] = BTNS.map(function (b) { return b.id; });
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p] && p !== 'esencial') {
          BTNS.forEach(function (b) { PRESETS[p][b.id] = true; });
        }
      });
      if (PRESETS.esencial) BTNS.forEach(function (b) { PRESETS.esencial[b.id] = true; });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
}

function setup() {
  ensureSection();
  registerVisibility();
  buildIfNeeded();
  renderAll();
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);
setTimeout(function () { try { ensureSection(); registerVisibility(); } catch (e) {} }, 2000);

})();
