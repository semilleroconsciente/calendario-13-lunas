/* ============================================================
   CIBERSEGURIDAD — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección: Comunidad, Emergencia y Sistema > 🛡️ Ciberseguridad
   Botones (sub "ciberseguridad"):
     btnCiberGuia, btnCiberClaves, btnCiberEstafas,
     btnCiberPriv, btnCiberChequeo, btnCiberAyuda
   - Diálogo ciberDialog con 6 pestañas:
       1) 📖 Guía: reglas de oro + método ALTO + qué proteger
       2) 🔑 Claves: generador offline + 2FA + gestor + qué nunca hacer
       3) 🎣 Estafas: fichas Chile (phishing, WhatsApp, falso banco,
          bono gobierno, deepfake voz, préstamos, QR) + quiz
       4) 🔒 Privacidad: permisos, fotos/menores, wifi pública,
          ubicación, respaldo, huella digital
       5) ✅ Chequeo: checklist 12 puntos con puntaje + plan + registro
       6) 🆘 Ayuda: si ya pasó (paso a paso por cuenta) + recursos
          Chile (PDI, *4242, SERNAC, banco, SUBTEL) + bitácora local
   - Todo local y privado por usuario: userData().ciber
     { checks:{}, incidentes:[], quizBest:0 }
   - 100% offline. Orientación general, no asesoría legal:
     verifica siempre en canales oficiales (PDI, Banco, SERNAC).
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
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { checks: {}, incidentes: [], quizBest: 0 };
    if (!u.ciber) u.ciber = { checks: {}, incidentes: [], quizBest: 0 };
    var r = u.ciber;
    if (!r.checks || Array.isArray(r.checks)) r.checks = {};
    if (!Array.isArray(r.incidentes)) r.incidentes = [];
    if (typeof r.quizBest !== 'number') r.quizBest = 0;
    return r;
  } catch (e) { return { checks: {}, incidentes: [], quizBest: 0 }; }
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
function openTab(t) { buildIfNeeded(); switchTab(t); renderAll(); openDlg('ciberDialog'); }

/* ---------------- DATOS ---------------- */
var REGLAS = [
  { n: 'ALTO ante lo urgente', ico: '✋', txt: 'Toda estafa mete <b>prisa + miedo o premio</b>: “tu cuenta se bloquea hoy”, “ganaste un bono, cobra ahora”, “tu hijo está detenido, transfiere”. <b>Regla: mensaje urgente = pausa obligada.</b> Respira, no toques el link, verifica por otro canal (llama al número guardado, entra al banco escribiendo la dirección tú). El que mete prisa, miente.' },
  { n: 'El link se mira, no se toca', ico: '🔗', txt: 'Pasa el dedo o el mouse <b>sin abrir</b>: mira el remitente real y la dirección. <b>banco-estado-seguro.top</b> no es bancoestado.cl. <b>mercadopago-cobro.xyz</b> no es mercadopago. Los bancos y el Estado <b>nunca</b> piden clave por SMS, WhatsApp ni correo. Si dudas: borra y entra tú directo a la app oficial.' },
  { n: 'El código que llega es tuyo', ico: '🔐', txt: 'El SMS/WhatsApp con <b>código de 6 dígitos</b> es la llave de tu cuenta. <b>Nunca se dicta, nunca se reenvía, nunca se fotografía.</b> Ni el banco, ni “soporte”, ni tu hijo, ni Carabineros te lo van a pedir. Quien pide el código, quiere robarte la cuenta. Corta y bloquea.' },
  { n: 'Verifica por otro camino', ico: '📞', txt: '¿Te escribió “tu banco / tu hijo / la municipalidad”? <b>No respondas en el mismo chat.</b> Llama al número que ya tenías guardado, pregunta en persona o escribe a la cuenta oficial. 2 minutos de verificación ahorran meses de Calvario. En Penco: pregunta en la JJ.VV. o en el CESFAM si el “operativo / bono” existe.' },
  { n: 'Menos datos = menos robo', ico: '🤐', txt: 'No publiques RUT, dirección exacta, fotos de tus hijos con uniforme, ni que “quedó la casa sola”. Configura WhatsApp y redes en <b>privado</b> (ver pestaña 🔒 Privacidad). Lo que subes, lo puede usar un estafador para imitarte con IA.' },
  { n: 'Respaldo y 2 pasos siempre', ico: '🛡️', txt: 'Activa la <b>verificación en 2 pasos</b> en WhatsApp, Gmail y banco (ver pestaña 🔑 Claves). Haz <b>respaldo</b> (ver 💾 Respaldo de la app) 1 vez por luna: si te roban el celu, recuperas fotos y chats sin pagar rescate.' }
];

var CLAVES_MALAS = ['123456', 'password', 'qwerty', 'penco123', 'colocolo', 'teamo', 'fecha de nacimiento', 'misma clave en todo'];
var FRASES_TIPO = [
  'Mi perra Luna ladra al camión de las 7:30 en Lirquén!',
  'En Pukem guardo 3 sacos de leña bajo el alero verde.',
  'El bote Don Manuel sale con marejada y vuelve contento.'
];

var ESTAFAS = [
  { id: 'phishing', ico: '📧', nombre: 'Correo / SMS falso del banco o Estado',
    como: '“Tu CuentaRUT será bloqueada, valida aquí”. Link a página idéntica que pide RUT + clave + coordenadas. También “bono gobierno / devolución SII / multa TAG”.',
    senal: 'Dirección rara (.top, .xyz, guiones), faltas de ortografía, saludo genérico (“estimado cliente”), prisa (“últimas 2 horas”), adjunto .html o acortador.',
    que: ['No abras el link. Borra el mensaje.', 'Entra tú a la app oficial (sin usar el link) y revisa: no habrá ningún bloqueo.', 'Si ya pusiste la clave: cambia la clave desde la app oficial + llama al banco (600 200 7000 BancoEstado) y bloquea.', 'Reporta: reenvía el SMS al 8888 (SUBTEL antispam) y denuncia en PDI.'],
    decir: '“Gracias, lo reviso directo en mi app. No abro links.”' },
  { id: 'wsp', ico: '📱', nombre: ' Robo de WhatsApp (el código de 6 dígitos)',
    como: '“Soy soporte / soy tu hijo con número nuevo, me llegó un código a tu celu, dícamelo”. Con ese código te quitan el WhatsApp y piden plata a tus contactos.',
    senal: 'Te piden el código que TE llegó a ti. Perfil nuevo con tu foto. Urgencia (“es ahora o pierdo el vuelo”). Videollamada que “no se ve”.',
    que: ['NUNCA dictes el código. Corta.', 'Activa ya: WhatsApp → Ajustes → Cuenta → Verificación en dos pasos → PIN de 6 dígitos + correo.', 'Si ya te lo quitaron: reinstala WhatsApp, verifica con TU chip (SMS), avisa a todos “ese no soy yo”, y pide a tus contactos que reporten el número falso.', 'Si pidieron plata a tu nombre: que nadie transfiera; denuncia en PDI con pantallazos.'],
    decir: '“Los códigos no se comparten. Te llamo al número de siempre para verificar.”' },
  { id: 'falsobanco', ico: '🏦', nombre: 'Falso ejecutivo que “te protege”',
    como: 'Llaman “del banco / de la PDI” porque “detectaron fraude”. Te piden instalar AnyDesk/TeamViewer o dictar la clave “para bloquear”. Mientras hablas, vacían tu cuenta.',
    senal: 'Te llaman ellos (tú no pediste ayuda). Piden instalar app de control remoto, dictar claves o “devolver” una transferencia que ELLOS te mandaron.',
    que: ['Cuelga. Ningún banco pide claves ni acceso remoto por teléfono.', 'Llama TÚ al número oficial de tu banco (el de la tarjeta).', 'Revisa movimientos en la app; desconoce cargos de inmediato.', 'Bloquea tarjetas desde la app y denuncia en PDI + Banco.'],
    decir: '“Corto y llamo yo directo al banco. Gracias.”' },
  { id: 'bono', ico: '🎁', nombre: 'Bono / premio / pega fácil',
    como: '“Ganaste $500.000 del Gobierno / de Falabella, cobra con tus datos”. O “pega desde casa: $50.000 diarios solo reenviando plata” (te usan de mula). O “préstamo sin DICOM, solo paga el seguro antes”.',
    senal: 'Premio sin concurso. Piden pago adelantado (“seguro”, “impuesto”). Pega que paga demasiado por nada. Cuenta de “gobierno” con Gmail o WhatsApp personal.',
    que: ['Bonos reales se consultan SOLO en chileatiende.cl / red de protección (escribe tú la dirección).', 'Nunca pagues por adelantado por un préstamo o premio.', 'La “pega de reenviar plata” es lavado de dinero: te deja como cómplice. Rechaza y bloquea.', 'Guarda pantallazos y denuncia: SERNAC (reclamo) + PDI (estafa).'],
    decir: '“Los bonos se revisan en ChileAtiende, no por WhatsApp. No participo.”' },
  { id: 'voz', ico: '🎙️', nombre: 'Voz clonada / deepfake de un familiar',
    como: 'Audio o videollamada corta con la voz de tu hijo/a llorando: “mamá, choqué, transfiera al abogado”. Con 10 segundos de un TikTok ya clonan una voz.',
    senal: 'Llamada angustiada + “no me llames, escríbeme aquí” + pide plata a cuenta desconocida + no responde una pregunta íntima.',
    que: ['Palan palabra familiar secreta (ej: “¿cómo se llama el perro de la abuela?”). Si no la sabe, es falso.', 'Cuelga y llama al número de SIEMPRE de tu familiar.', 'No transfieras sin voz en vivo de ida y vuelta.', 'Cuenta a la familia: el primero que avisa, protege a todos.'],
    decir: '“Te llamo ahora al número de siempre, dame un minuto.”' },
  { id: 'qr', ico: '🧾', nombre: 'QR trucho / aviso de encomienda / compra-venta',
    como: 'QR pegado ENCIMA del original en feria/local (“paga aquí”) que manda a otra cuenta. “Correos: tu paquete está retenido, paga $1.500”. En Marketplace: “te compro, te mando un link de pago/extracción” o billete falso + “te transfiero de más, devuélveme la diferencia”.',
    senal: 'QR con sticker encima, bordes despegados. Link de “pago” que pide tus claves (el que PAGA nunca pone claves). Sobrepago con devolución.',
    que: ['En feria: confirma el nombre del destinatario en la app ANTES de poner la clave.', 'Correos reales: sigue tu envío solo en correos.cl (escribe tú la dirección).', 'Vende con entrega en lugar público, de día, y revisa que la plata esté ABONADA (no pantallazo).', 'Si pagaste a QR falso: bloquea, guarda comprobante y denuncia en PDI.'],
    decir: '“Verifico el destinatario en mi app antes de pagar. Sin apuro.”' }
];

var QUIZ = [
  { q: 'Te llega un SMS: “BANCO: tu cuenta será bloqueada hoy, valida en banco-seguro.top”. ¿Qué haces?', opts: ['Abro el link rápido para no perder la cuenta', 'Borro el SMS y reviso directo en mi app oficial', 'Reenvío el link a mi familia para que validen'], ok: 1, por: 'Los bancos nunca piden claves por link. Se verifica entrando tú a la app oficial.' },
  { q: 'Tu “hija con número nuevo” te pide por WhatsApp el código de 6 dígitos que te acaba de llegar. ¿Qué haces?', opts: ['Se lo dicto, es urgente', 'No lo comparto, la llamo al número de siempre', 'Le mando foto del código para que sea más rápido'], ok: 1, por: 'Ese código es la llave de TU WhatsApp. Quien lo pide, quiere robártelo.' },
  { q: 'Te llaman “del banco” y te piden instalar una app para “protegerte” y dictar tu clave. ¿Qué haces?', opts: ['Instalo y dicto, suena profesional', 'Cuelgo y llamo yo al número oficial del banco', 'Les doy solo la mitad de la clave'], ok: 1, por: 'Ningún banco pide control remoto ni claves por teléfono. Cuelga y llama tú.' },
  { q: 'Un audio con la voz de tu hijo llorando pide una transferencia urgente a una cuenta desconocida. ¿Qué haces?', opts: ['Transfiero de inmediato', 'Cuelgo y lo llamo al número de siempre + pregunto la palabra familiar', 'Pido el RUT del “abogado” y transfiero'], ok: 1, por: 'La voz se clona con IA. La prueba es llamar al número real y la palabra secreta.' },
  { q: '¿Cuál es una clave segura?', opts: ['penco123 (fácil de recordar)', 'Mi fecha de nacimiento + nombre de mi hijo', 'Frase larga única + 2FA activado (ej: “En Pukem guardo 3 sacos…!”)'], ok: 2, por: 'Larga + única + con 2FA. Corta y personal se adivina en minutos.' },
  { q: 'Vendes una bici en Marketplace y el comprador te manda un “link de pago” que te pide TUS claves para “recibir” la plata. ¿Qué haces?', opts: ['Pongo mis claves, quiero vender hoy', 'No pongo nada: el que recibe nunca pone claves; cobro solo con abono verificado', 'Le mando foto de mi tarjeta para agilizar'], ok: 1, por: 'Recibir plata jamás exige tus claves. Es robo disfrazado de pago.' }
];

var CHECKS = [
  { id: 'c2fa_wsp', n: 'WhatsApp con PIN en 2 pasos', d: 'Ajustes → Cuenta → Verificación en dos pasos → Activar (PIN + correo). Frena el robo de cuenta más común en Chile.' },
  { id: 'c2fa_gmail', n: 'Gmail / correo con 2 pasos', d: 'El correo recupera TODO (banco, redes). Activa verificación en 2 pasos + teléfono de recuperación vigente.' },
  { id: 'c2fa_banco', n: 'Banco con 2ª clave / BE Pass', d: 'Activa la segunda clave y los avisos por cada movimiento. Pon tope diario bajo para transferencias.' },
  { id: 'cclave_unica', n: 'Sin claves repetidas en banco, correo y redes', d: 'Si una se filtra, no caen todas. Mínimo: 3 claves distintas (banco / correo / resto).' },
  { id: 'cbloqueo', n: 'Celu con bloqueo + borrado remoto', d: 'PIN/huella + “Encontrar mi dispositivo” activo. Anota tu IMEI (*#06#) en papel guardado.' },
  { id: 'cactualiza', n: 'Celu y apps actualizados', d: 'Las actualizaciones tapan agujeros. Activa actualización automática con wifi.' },
  { id: 'cpermisos', n: 'Permisos de apps revisados', d: 'Linterna no necesita tu ubicación ni tus contactos. Quita permisos raros (ver pestaña Privacidad).' },
  { id: 'crespaldo', n: 'Respaldo al día (1 vez por luna)', d: 'Fotos + chats a salvo. Usa 💾 Respaldo de la app. Si te roban el celu, no pierdes tu historia.' },
  { id: 'canti_urg', n: 'Regla familiar anti-urgencia', d: 'Acordaron palabra secreta + “llamar al número de siempre”. Los niños y abuelos la conocen.' },
  { id: 'cno_link', n: 'No abro links de banco/bono por SMS/WhatsApp', d: 'Entro escribiendo yo la dirección o por la app. El link urgente se borra.' },
  { id: 'cwifi', n: 'Sin banca en wifi pública / prestada', d: 'Plaza, bus o vecino: solo mirar. Banco y claves solo con datos propios o wifi de casa.' },
  { id: 'cayuda', n: 'Sé dónde pedir ayuda (PDI, *4242, banco)', d: 'Tengo los números anotados en papel (ver pestaña Ayuda). Ante la duda, pregunto antes de pagar.' }
];

var RECUPERAR = [
  { n: 'WhatsApp robado', ico: '📱', pasos: '1) Reinstala WhatsApp y verifica con TU chip (SMS tuyo). 2) Activa de inmediato el PIN en 2 pasos. 3) Avisa a TODOS tus grupos: “ese número no soy yo, no transfieran”. 4) Pide a 3 familiares que reporten el número falso (chat → reportar). 5) Denuncia en PDI con pantallazos.' },
  { n: 'Gmail / Facebook / Instagram', ico: '📧', pasos: '1) Desde un celu/PC limpio entra a “recuperar cuenta” oficial (escribe tú la dirección). 2) Cambia clave + cierra todas las sesiones + activa 2 pasos. 3) Revisa reenvíos y teléfonos agregados por el ladrón y quítalos. 4) Avisa a tus contactos si pidieron plata a tu nombre.' },
  { n: 'Banco: cargo o transferencia que no hiciste', ico: '🏦', pasos: '1) Bloquea tarjetas desde la app AHORA. 2) Llama al banco (BancoEstado 600 200 7000) y desconoce el movimiento (pide N° de reclamo). 3) Cambia claves desde la app oficial. 4) Denuncia en PDI + reclamo en SERNAC con el N° del banco. Guarda todo: hora, monto, comprobantes.' },
  { n: 'Celu robado / perdido', ico: '📵', pasos: '1) Llama a tu compañía y bloquea el CHIP (así no reciben tus SMS de banco). 2) Desde otro equipo: “Encontrar mi dispositivo” → bloquear/borrar. 3) Bloquea tarjetas y cambia clave de Gmail primero. 4) Denuncia con IMEI en Carabineros/PDI (sirve para el seguro y para bloquear el equipo en SUBTEL).' }
];

var RECURSOS = [
  { n: 'PDI — Brigada del Cibercrimen', d: 'Denuncia online: pdichile.cl / Denuncia Seguro. Presencial: cuartel PDI más cercano (Concepción). Lleva celu + pantallazos + números + horas. Sin denuncia no hay investigación.', tag: 'estafa consumada' },
  { n: 'Denuncia Seguro *4242', d: 'Fono gratuito, anónimo, 24/7. Sirve para estafas, amenazas y datos de bandas. Te dan código de seguimiento.', tag: 'anónimo 24/7' },
  { n: 'Carabineros 133 / Plan cuadrante Penco', d: 'Si hay amenaza en curso, extorsión con tu dirección o cobro presencial. 133 emergencia, plan cuadrante para tu sector.', tag: 'riesgo físico' },
  { n: 'Tu banco (bloqueo + desconocer)', d: 'BancoEstado: 600 200 7000. Otros: el número al reverso de tu tarjeta. Pide bloqueo + N° de reclamo y desconoce el cargo el mismo día.', tag: 'plata en riesgo' },
  { n: 'SERNAC 800 700 100 / sernac.cl', d: 'Reclamo contra empresa (banco, telefonía, tienda) que no responde. Con el reclamo, la empresa debe responder en plazo.', tag: 'empresa no responde' },
  { n: 'SUBTEL — SMS spam al 8888', d: 'Reenvía el SMS fraudulento al 8888. Bloquea y reporta el número. Para equipo robado: pide bloqueo por IMEI con tu compañía.', tag: 'spam / robos' },
  { n: 'En Penco: JJ.VV. + DIDECO + ChileAtiende', d: 'Pregunta si el “bono/operativo” existe antes de dar datos. O’Higgins 500 (municipalidad). Bonos reales: solo chileatiende.cl.', tag: 'verificar en territorio' }
];

/* ---------------- DIALOGO ---------------- */
function switchTab(t) {
  ['Guia', 'Claves', 'Estafas', 'Priv', 'Chequeo', 'Ayuda'].forEach(function (x) {
    var p = $('ciber' + x), b = $('tabCiber' + x);
    if (p) p.classList.toggle('hidden', x !== t);
    if (b) b.classList.toggle('btn-accent', x === t);
  });
}
function makeDialog() {
  var old = $('ciberDialog');
  if (old) return old;
  var d = document.createElement('dialog');
  d.id = 'ciberDialog';
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🛡️ Ciberseguridad — cuida tu plata y tus datos</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Estafas por celu, claves robadas y cuentas quitadas: aquí aprendes a frenarlas con reglas simples, <b>sin tecnicismos</b>. Todo es <b>offline y privado</b>: nada sale de este dispositivo.</p>' +
    '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
    '<button type="button" id="tabCiberGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabCiberClaves" class="btn" style="width:auto">🔑 Claves</button>' +
    '<button type="button" id="tabCiberEstafas" class="btn" style="width:auto">🎣 Estafas</button>' +
    '<button type="button" id="tabCiberPriv" class="btn" style="width:auto">🔒 Privacidad</button>' +
    '<button type="button" id="tabCiberChequeo" class="btn" style="width:auto">✅ Chequeo</button>' +
    '<button type="button" id="tabCiberAyuda" class="btn" style="width:auto">🆘 Ayuda</button></div>' +
    '<div id="ciberGuia"></div>' +
    '<div id="ciberClaves" class="hidden"></div>' +
    '<div id="ciberEstafas" class="hidden"></div>' +
    '<div id="ciberPriv" class="hidden"></div>' +
    '<div id="ciberChequeo" class="hidden"></div>' +
    '<div id="ciberAyuda" class="hidden"></div>' +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  ['Guia', 'Claves', 'Estafas', 'Priv', 'Chequeo', 'Ayuda'].forEach(function (t) {
    var b = $('tabCiber' + t);
    if (b) b.onclick = function () { switchTab(t); renderAll(); };
  });
  return d;
}
function buildIfNeeded() { makeDialog(); }

/* ---------------- RENDER ---------------- */
function renderGuia() {
  var box = $('ciberGuia'); if (!box) return;
  box.innerHTML =
    '<div class="si-card"><h4>🛡️ ¿Por qué ciberseguridad en Penco?</h4><p>El robo ya no es solo en la feria: es por <b>WhatsApp, SMS y llamadas</b>. Quitan tu WhatsApp con un código, vacían la CuentaRUT con un link falso y piden plata a tu familia con tu foto. Pasa en Lirquén, Cosmito y el centro, sobre todo a <b>mayores y jóvenes</b>. La buena noticia: con 6 reglas simples frenas el 90%.</p></div>' +
    REGLAS.map(function (r) {
      return '<div class="si-card"><h4>' + r.ico + ' ' + esc(r.n) + '</h4><p>' + r.txt + '</p></div>';
    }).join('') +
    '<div class="si-card"><h4>🧭 Método ALTO (pégalo en el refri)</h4><p><b>A</b> — Alto: ¿me mete prisa o miedo? → pausa.<br><b>L</b> — Lee: ¿quién manda REALMENTE? (dirección, número, faltas).<br><b>T</b> — Toca nada: ni link, ni código, ni app que te pidan.<br><b>O</b> — Otro canal: verifica llamando al número guardado o en persona.</p></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="ciberGoChequeo" class="btn btn-accent" style="width:auto">✅ Hacer mi chequeo (2 min) →</button></div>';
  var g = $('ciberGoChequeo');
  if (g) g.onclick = function () { switchTab('Chequeo'); renderAll(); };
}

function fuerzaClave(cl) {
  var pts = 0;
  if (cl.length >= 12) pts += 2; else if (cl.length >= 8) pts += 1;
  if (/[a-z]/.test(cl) && /[A-Z]/.test(cl)) pts += 1;
  if (/\d/.test(cl)) pts += 1;
  if (/[^A-Za-z0-9]/.test(cl)) pts += 1;
  if (/(123|abc|penco|colocolo|password|qwerty)/i.test(cl)) pts -= 2;
  return pts;
}
function genClave(n, simbolos) {
  var base = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  if (simbolos) base += '!@#%*_+-?';
  var out = '';
  try {
    var buf = new Uint32Array(n);
    (crypto.getRandomValues ? crypto.getRandomValues(buf) : buf.map(function () { return Math.floor(Math.random() * 4294967295); }));
    for (var i = 0; i < n; i++) out += base[buf[i] % base.length];
  } catch (e) {
    for (var j = 0; j < n; j++) out += base[Math.floor(Math.random() * base.length)];
  }
  return out;
}
function renderClaves() {
  var box = $('ciberClaves'); if (!box) return;
  box.innerHTML =
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🎲 Generador offline (aquí mismo, sin internet)</h4>' +
    '<p class="muted" style="font-size:11px">Crea una clave y cópiala a tu cuaderno o gestor. <b>Este calendario NO guarda claves</b>: el generador no registra nada.</p>' +
    '<div class="conv-row"><label>Largo <select id="ciberGenLen"><option value="12">12 (mínimo)</option><option value="16" selected>16 (recomendado)</option><option value="20">20 (banco/correo)</option></select></label>' +
    '<label class="check-row" style="align-self:flex-end"><input type="checkbox" id="ciberGenSim" checked> Símbolos (!@#%)</label></div>' +
    '<div class="conv-row"><label style="flex:2">Tu clave <input type="text" id="ciberGenOut" readonly placeholder="toca Generar…" style="font-family:monospace"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="ciberGenBtn" class="btn btn-accent" style="width:auto">🎲 Generar</button>' +
    '<button type="button" id="ciberGenCopy" class="btn" style="width:auto">📋 Copiar</button>' +
    '<button type="button" id="ciberGenFrase" class="btn" style="width:auto">💬 Idea de frase</button></div>' +
    '<div style="margin-top:8px"><span class="muted" style="font-size:11px">Medidor: </span><span id="ciberFuerza" class="chip">—</span>' +
    '<div style="background:var(--panel);border-radius:6px;height:8px;overflow:hidden;margin-top:4px"><div id="ciberFuerzaBar" style="width:0%;height:100%;background:linear-gradient(90deg,#e76e8a,#e8c56a,#8fd694)"></div></div></div></div>' +
    '<div class="si-card"><h4>🔑 La regla de las 3 claves</h4><p>Necesitas <b>3 claves distintas como mínimo</b>: 1) banco, 2) correo (Gmail), 3) resto (redes). Si repites la misma en todo, con una filtración caen todas. Truco de memoria: <b>frase larga</b> que solo tú entiendes + un número + un símbolo. Ej: <i>“' + esc(FRASES_TIPO[0]) + '”</i> → <i>LunaLadra7:30-Lirq!</i></p>' +
    '<p class="muted" style="font-size:11px">❌ Nunca uses: ' + CLAVES_MALAS.map(esc).join(' · ') + '.</p></div>' +
    '<div class="si-card"><h4>📓 ¿Dónde guardo mis claves?</h4><p><b>Mejor:</b> gestor del celu (Google / iCloud) o app de claves con una clave maestra.<br><b>Bueno:</b> cuaderno en casa (no al lado del celu, no con foto).<br><b>Nunca:</b> en Notas sin clave, en foto de galería, en el chat conmigo misma, en papel en la billetera, ni dictadas por teléfono.</p></div>' +
    '<div class="si-card"><h4>🔐 Activa el 2° paso HOY (5 minutos)</h4><p><b>WhatsApp:</b> Ajustes → Cuenta → Verificación en dos pasos → Activar → PIN + correo.<br><b>Gmail:</b> Cuenta Google → Seguridad → Verificación en 2 pasos → activar.<br><b>BancoEstado:</b> app → BE Pass / segunda clave + avisos por movimiento.<br>Con 2 pasos, aunque te roben la clave, no entran sin tu celu.</p></div>';
  var out = $('ciberGenOut'), bar = $('ciberFuerzaBar'), chip = $('ciberFuerza');
  function paint() {
    var v = out.value || '';
    if (!v) { chip.textContent = '—'; bar.style.width = '0%'; return; }
    var p = fuerzaClave(v);
    var pct = Math.max(5, Math.min(100, (p / 6) * 100));
    bar.style.width = pct + '%';
    chip.textContent = p <= 1 ? '🔴 Débil — genera otra' : (p <= 3 ? '🟡 Media — súmale largo + símbolo' : '🟢 Fuerte — guárdala en tu gestor/cuaderno');
  }
  $('ciberGenBtn').onclick = function () {
    var n = +($('ciberGenLen').value || 16);
    out.value = genClave(n, $('ciberGenSim').checked);
    paint();
  };
  $('ciberGenFrase').onclick = function () {
    out.value = '';
    alert('💬 Ideas de frase (adáptala a tu vida):\n\n· ' + FRASES_TIPO.join('\n· ') + '\n\nToma 1 frase, deja mayúsculas + número + símbolo. Ej: "En Pukem guardo 3 sacos!"');
  };
  $('ciberGenCopy').onclick = function () {
    if (!out.value) return alert('Genera primero una clave');
    try {
      out.select();
      if (navigator.clipboard) navigator.clipboard.writeText(out.value);
      else document.execCommand('copy');
      alert('Copiada. Pégala en tu gestor o cuaderno y borra este campo después.');
    } catch (e) { alert(out.value); }
  };
}

var quizIdx = 0, quizPts = 0;
function renderEstafas() {
  var box = $('ciberEstafas'); if (!box) return;
  var html = '<div class="si-card"><h4>🎣 Las 6 que más llegan a Penco</h4><p>Toca cada una: cómo operan, señales y qué hacer paso a paso. Léelas 1 vez en familia: el que sabe, protege a los demás.</p></div>';
  html += ESTAFAS.map(function (e) {
    return '<div class="si-card"><h4>' + e.ico + ' ' + esc(e.nombre) + '</h4>' +
      '<p><b>Cómo es:</b> ' + e.como + '</p>' +
      '<p><b>🚩 Señales:</b> ' + e.senal + '</p>' +
      '<p><b>✅ Haz esto:</b><br>' + e.que.map(function (q, i) { return (i + 1) + ') ' + q; }).join('<br>') + '</p>' +
      '<p class="muted" style="font-size:11px"><b>Frase que salva:</b> ' + esc(e.decir) + '</p></div>';
  }).join('');
  var best = 0;
  try { best = store().quizBest || 0; } catch (e) {}
  html += '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🧠 Quiz: ¿la detectas? (mejor: ' + best + '/' + QUIZ.length + ')</h4>' +
    '<div id="ciberQuizBox"></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="ciberQuizStart" class="btn btn-accent" style="width:auto">▶ Empezar quiz</button></div></div>';
  box.innerHTML = html;
  $('ciberQuizStart').onclick = function () { quizIdx = 0; quizPts = 0; paintQuiz(); };
  function paintQuiz() {
    var qb = $('ciberQuizBox'); if (!qb) return;
    if (quizIdx >= QUIZ.length) {
      var s = store();
      if (quizPts > (s.quizBest || 0)) { s.quizBest = quizPts; save('Récord quiz 🧠'); }
      qb.innerHTML = '<p><b>Resultado: ' + quizPts + '/' + QUIZ.length + '</b> ' + (quizPts === QUIZ.length ? '🟢 ¡Ojo de lince! Enséñale a tu familia.' : (quizPts >= 4 ? '🟡 Bien, repasa las fichas de arriba.' : '🔴 Lee las 6 fichas con calma y repite el quiz.')) + '</p>' +
        '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="ciberQuizAgain" class="btn" style="width:auto">🔁 Repetir</button>' +
        '<button type="button" id="ciberQuizShare" class="btn" style="width:auto">📤 Compartir resultado</button></div>';
      $('ciberQuizAgain').onclick = function () { quizIdx = 0; quizPts = 0; paintQuiz(); };
      $('ciberQuizShare').onclick = function () { share('🛡️ Mi quiz de ciberseguridad', 'Saqué ' + quizPts + '/' + QUIZ.length + ' en el quiz anti-estafas del Calendario 13 Lunas. ¿Y tú? Regla de oro: mensaje urgente = pausa + verificar por otro canal.'); };
      return;
    }
    var q = QUIZ[quizIdx];
    qb.innerHTML = '<p style="font-size:13px"><b>' + (quizIdx + 1) + '/' + QUIZ.length + '.</b> ' + esc(q.q) + '</p>' +
      q.opts.map(function (o, i) { return '<button type="button" class="btn" style="width:100%;text-align:left;margin-bottom:6px;white-space:normal" data-q="' + i + '">' + esc(o) + '</button>'; }).join('') +
      '<div id="ciberQuizFeed" class="muted" style="font-size:12px"></div>';
    qb.querySelectorAll('[data-q]').forEach(function (b) {
      b.onclick = function () {
        var i = +b.getAttribute('data-q');
        var f = $('ciberQuizFeed');
        if (i === q.ok) { quizPts++; f.innerHTML = '✅ ¡Correcto! ' + esc(q.por); }
        else f.innerHTML = '❌ No. ' + esc(q.por);
        setTimeout(function () { quizIdx++; paintQuiz(); }, 1600);
      };
    });
  }
}

function renderPriv() {
  var box = $('ciberPriv'); if (!box) return;
  box.innerHTML =
    '<div class="si-card"><h4>📱 Permisos: la linterna no necesita tu ubicación</h4><p>Revisa 1 vez por luna: Ajustes → Aplicaciones → Permisos. Quita lo absurdo: juego con acceso a contactos, linterna con micrófono, app de fotos con llamadas. <b>Menos permisos = menos espionaje y menos batería gastada.</b> Borra las apps que no usaste en 3 lunas.</p></div>' +
    '<div class="si-card"><h4>📸 Fotos y menores: piénsalo 2 veces</h4><p>No subas: RUT, patente, dirección, uniforme del colegio, ni “solos en casa”. En WhatsApp pon foto de perfil en <b>Mis contactos</b> (Ajustes → Privacidad). Para los niños: sin nombre del colegio ni ubicación en vivo. Lo que sube un familiar, lo ve un estafador.</p></div>' +
    '<div class="si-card"><h4>📍 Ubicación: solo cuando se usa</h4><p>Pon ubicación en <b>“solo con la app en uso”</b>, nunca “siempre”. Quita el historial de Google Maps si no lo usas. En fotos, desactiva “guardar ubicación” si las compartes en grupos grandes. En citas de compra-venta: junta en lugar público, de día, sin mandar tu ubicación en vivo.</p></div>' +
    '<div class="si-card"><h4>☕ Wifi pública: mirar sí, banco no</h4><p>Plaza, bus, consultorio: sirve para mirar noticias, <b>no para banco ni claves</b>. Un wifi falso “Municipalidad_Gratis” puede leer lo que escribes. Regla: banco y pagos solo con <b>datos propios o wifi de casa con clave</b>. Si te prestan wifi, que tenga clave y la cambien 1 vez al año.</p></div>' +
    '<div class="si-card"><h4>👣 Huella digital: lo gratis también cobra</h4><p>Cada “test divertido” (qué famoso eres, tu casa ideal) que pide tu Facebook te perfila para estafas dirigidas. Antes de autorizar con Google/Facebook en una app: ¿la necesito? Usa <b>correo distinto</b> para juegos/concursos y el serio para banco/Estado. Revisa sesiones abiertas 1 vez por luna y cierra las viejas.</p></div>' +
    '<div class="si-card"><h4>💾 Respaldo: tu red de seguridad</h4><p>Activa copia de fotos + chats (Google Fotos / iCloud + copia de WhatsApp). Además usa <b>💾 Respaldo</b> del calendario para tus notas. Prueba restaurar 1 vez: un respaldo que nunca se probó, no es respaldo. Guarda el correo de recuperación en papel.</p></div>';
}

function puntajeChequeo() {
  var s = store(), n = 0;
  CHECKS.forEach(function (c) { if (s.checks[c.id]) n++; });
  return n;
}
function renderChequeo() {
  var box = $('ciberChequeo'); if (!box) return;
  var s = store(), pts = puntajeChequeo(), tot = CHECKS.length;
  var pct = Math.round(pts / tot * 100);
  var nivel = pts <= 4 ? '🔴 Expuesto — parte por las 3 primeras esta semana' : (pts <= 8 ? '🟡 En camino — te faltan ' + (tot - pts) + ' pasos' : (pts < tot ? '🟢 Casi blindado — cierra las que faltan' : '🟢 Blindado — mantén 1 revisión por luna'));
  box.innerHTML =
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>✅ Mi escudo digital: ' + pts + '/' + tot + ' (' + pct + '%)</h4>' +
    '<div style="background:var(--panel);border-radius:6px;height:10px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#e76e8a,#e8c56a,#8fd694)"></div></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">' + nivel + '</p>' +
    '<p class="muted" style="font-size:11px">Marca lo que YA tienes activo. Se guarda <b>privado y local</b>. Meta sana: 9/12. Repite 1 vez por luna.</p></div>' +
    CHECKS.map(function (c) {
      var on = !!s.checks[c.id];
      return '<label class="check-row" style="align-items:flex-start;border:1px solid var(--line);border-radius:8px;padding:8px;margin-bottom:6px;cursor:pointer">' +
        '<input type="checkbox" data-chk="' + c.id + '"' + (on ? ' checked' : '') + ' style="margin-top:3px"> ' +
        '<span><b>' + esc(c.n) + '</b><br><span class="muted" style="font-size:11px">' + esc(c.d) + '</span></span></label>';
    }).join('') +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="ciberChkStats" class="muted" style="font-size:11px">' + pts + ' de ' + tot + ' activos</span>' +
    '<span style="display:flex;gap:8px"><button type="button" id="ciberChkShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="ciberChkReset" class="btn" style="width:auto;color:#e76e8a">↺ Reiniciar</button></span></div>';
  box.querySelectorAll('[data-chk]').forEach(function (c) {
    c.onchange = function () {
      var st = store();
      st.checks[c.getAttribute('data-chk')] = c.checked ? true : false;
      save(c.checked ? 'Paso activado ✅' : 'Guardado');
      renderChequeo();
    };
  });
  $('ciberChkShare').onclick = function () {
    var st2 = store(), faltan = CHECKS.filter(function (c) { return !st2.checks[c.id]; }).map(function (c) { return '· ' + c.n; });
    share('🛡️ Mi escudo digital (' + puntajeChequeo() + '/' + CHECKS.length + ')',
      faltan.length ? 'Me falta:\n' + faltan.join('\n') + '\n\nRegla: mensaje urgente = pausa + verificar por otro canal.' : 'Tengo todo activo 🟢. Repito mi chequeo 1 vez por luna.');
  };
  $('ciberChkReset').onclick = function () {
    if (!confirm('¿Desmarcar todo el chequeo?')) return;
    try { store().checks = {}; } catch (e) {}
    save(); renderChequeo();
  };
}

var ciberIncEditId = null;
function renderAyuda() {
  var box = $('ciberAyuda'); if (!box) return;
  box.innerHTML =
    '<div class="si-card"><h4>🚨 Si ya pasó: respira, no te culpes, actúa en orden</h4><p>Le pasa a miles en Chile cada semana. <b>No borres nada</b> (los pantallazos son prueba), no sigas pagando “para recuperar”, y avisa a tu familia hoy mismo. Abajo el paso a paso por caso.</p></div>' +
    RECUPERAR.map(function (r) {
      return '<div class="si-card"><h4>' + r.ico + ' ' + esc(r.n) + '</h4><p>' + esc(r.pasos).split(/\d\)/).filter(function (x) { return x.trim(); }).map(function (x, i) { return (i + 1) + ') ' + x.trim(); }).join('<br>') + '</p></div>';
    }).join('') +
    '<div class="si-card"><h4>📞 Dónde pedir ayuda en Chile (anota en papel)</h4>' +
    RECURSOS.map(function (r) {
      return '<p style="font-size:12px"><b>' + esc(r.n) + '</b> <span class="chip" style="font-size:10px">' + esc(r.tag) + '</span><br><span class="muted">' + esc(r.d) + '</span></p>';
    }).join('') + '</div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>📓 Bitácora privada (solo en tu celu)</h4>' +
    '<p class="muted" style="font-size:11px">Anota qué pasó para la denuncia y para no olvidar: fecha, canal, qué te pidieron, cuánto, pantallazo guardado. <b>No anotes claves aquí.</b></p>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="ciberIncFecha"></label><label>Tipo <select id="ciberIncTipo"><option>WhatsApp robado</option><option>Link falso / phishing</option><option>Llamada falsa banco</option><option>Bono/premio falso</option><option>Voz clonada</option><option>QR / compra-venta</option><option>Otro</option></select></label></div>' +
    '<div class="conv-row"><label>Monto / daño <input type="text" id="ciberIncMonto" placeholder="ej: $0, solo susto / $120.000" maxlength="30"></label>' +
    '<label class="check-row" style="align-self:flex-end"><input type="checkbox" id="ciberIncDen"> Denuncié (PDI/*4242)</label></div>' +
    '<label>Qué pasó <input type="text" id="ciberIncTxt" placeholder="ej: SMS banco-seguro.top, no abrí / abrí y cambié clave" maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="ciberIncAdd" class="btn btn-accent" style="width:auto">+ Guardar registro</button>' +
    '<button type="button" id="ciberIncCancel" class="btn hidden" style="width:auto">Cancelar</button></div>' +
    '<div id="ciberIncList" class="habits-list" style="margin-top:8px;max-height:220px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="ciberIncStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px"><button type="button" id="ciberIncShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="ciberIncClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>';
  if ($('ciberIncFecha') && !$('ciberIncFecha').value) $('ciberIncFecha').value = todayKey();
  $('ciberIncAdd').onclick = function () {
    var t = clean($('ciberIncTxt').value, 120);
    if (!t) return alert('Cuéntanos en 1 línea qué pasó');
    var rec = { id: ciberIncEditId || uid('cb'), fecha: $('ciberIncFecha').value || todayKey(), tipo: $('ciberIncTipo').value, monto: clean($('ciberIncMonto').value, 30), den: $('ciberIncDen').checked, txt: t };
    var dd = store().incidentes;
    if (ciberIncEditId) { var i = dd.findIndex(function (x) { return x.id === ciberIncEditId; }); if (i >= 0) dd[i] = rec; ciberIncEditId = null; $('ciberIncAdd').textContent = '+ Guardar registro'; $('ciberIncCancel').classList.add('hidden'); }
    else dd.push(rec);
    save('Registro guardado 📓');
    $('ciberIncTxt').value = ''; $('ciberIncMonto').value = ''; $('ciberIncDen').checked = false;
    renderAyuda();
  };
  $('ciberIncCancel').onclick = function () { ciberIncEditId = null; $('ciberIncAdd').textContent = '+ Guardar registro'; $('ciberIncCancel').classList.add('hidden'); $('ciberIncTxt').value = ''; };
  renderIncidentes();
  $('ciberIncShare').onclick = function () {
    var dd = store().incidentes;
    if (!dd.length) return alert('Bitácora vacía');
    share('🛡️ Mi bitácora de seguridad (' + dd.length + ')', dd.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).map(function (r) { return '· ' + r.fecha + ' — ' + r.tipo + ' — ' + r.txt + (r.monto ? ' (' + r.monto + ')' : '') + (r.den ? ' [denunciado]' : ''); }).join('\n'));
  };
  $('ciberIncClear').onclick = function () {
    if (!confirm('¿Borrar toda la bitácora de seguridad?')) return;
    try { store().incidentes = []; } catch (e) {}
    save(); renderAyuda();
  };
}
function renderIncidentes() {
  var box = $('ciberIncList'); if (!box) return;
  var dd = store().incidentes.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  var st = $('ciberIncStats');
  if (!dd.length) { box.innerHTML = '<p class="muted">Sin registros. Ojalá siga así 🍀.</p>'; if (st) st.textContent = '0 registros'; return; }
  box.innerHTML = dd.map(function (r) {
    return '<div class="habit-item"><div style="display:flex;justify-content:space-between;gap:8px"><span><b>' + esc(r.tipo) + '</b> <span class="muted" style="font-size:11px">· ' + r.fecha + '</span></span>' +
      '<span class="chip" style="font-size:10px">' + (r.den ? '✅ denunciado' : '⚠️ sin denuncia') + '</span></div>' +
      '<div class="muted" style="font-size:11px;margin-top:4px">' + esc(r.txt) + (r.monto ? ' · ' + esc(r.monto) : '') + '</div>' +
      '<div style="display:flex;gap:6px;margin-top:6px"><button class="btn" style="width:auto;font-size:11px" data-edit="' + r.id + '">✏️</button>' +
      '<button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('');
  if (st) st.textContent = dd.length + ' registros · ' + dd.filter(function (r) { return r.den; }).length + ' denunciados';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar registro?')) return; var d2 = store().incidentes; var i = d2.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) d2.splice(i, 1); save(); renderAyuda(); }; });
  box.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { var d2 = store().incidentes; var r = d2.find(function (x) { return x.id === b.getAttribute('data-edit'); }); if (!r) return; ciberIncEditId = r.id;
    $('ciberIncFecha').value = r.fecha; $('ciberIncTipo').value = r.tipo; $('ciberIncMonto').value = r.monto || ''; $('ciberIncTxt').value = r.txt || ''; $('ciberIncDen').checked = !!r.den;
    $('ciberIncAdd').textContent = '↻ Actualizar'; $('ciberIncCancel').classList.remove('hidden');
  }; });
}

function renderAll() {
  try { renderGuia(); } catch (e) {}
  try { renderClaves(); } catch (e) {}
  try { renderEstafas(); } catch (e) {}
  try { renderPriv(); } catch (e) {}
  try { renderChequeo(); } catch (e) {}
  try { renderAyuda(); } catch (e) {}
}

/* ---------------- SETUP: integra en Comunidad ---------------- */
var BTNS = [
  { id: 'btnCiberGuia', label: '📖 Guía base', tab: 'Guia', sub: 'ciberseguridad', kw: 'ciberseguridad guia reglas oro alto estafa fraude internet seguridad digital' },
  { id: 'btnCiberClaves', label: '🔑 Claves seguras', tab: 'Claves', sub: 'ciberseguridad', kw: 'claves contraseña generador 2fa doble factor verificacion gestor pin banco gmail whatsapp' },
  { id: 'btnCiberEstafas', label: '🎣 Estafas y fraudes', tab: 'Estafas', sub: 'ciberseguridad', kw: 'estafa fraude phishing smishing vishing whatsapp robado falso banco bono premio voz clonada qr marketplace quiz' },
  { id: 'btnCiberPriv', label: '🔒 Privacidad', tab: 'Priv', sub: 'ciberseguridad', kw: 'privacidad permisos ubicacion fotos menores wifi publica huella datos personales' },
  { id: 'btnCiberChequeo', label: '✅ Chequeo escudo', tab: 'Chequeo', sub: 'ciberseguridad', kw: 'chequeo escudo diagnostico revision puntaje pasos activar proteccion' },
  { id: 'btnCiberAyuda', label: '🆘 Ayuda y denuncia', tab: 'Ayuda', sub: 'ciberseguridad', kw: 'ayuda denuncia pdi 4242 sernac banco recuperar cuenta hackeo robo celular bitacora' }
];
var SUB_LABEL = { id: 'ciberseguridad', label: '🛡️ Ciberseguridad' };

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
  } else if (!lab.textContent || lab.textContent.indexOf('Ciberseguridad') < 0) {
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
    try { el.setAttribute('data-sub', b.sub); el.dataset.sub = b.sub; } catch (eS) {}
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
      BTNS.forEach(function (b) { BTN_HOME[b.id] = ['comunidad', 'ciberseguridad']; });
    }
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      BTN_ORDER['comunidad|ciberseguridad'] = BTNS.map(function (b) { return b.id; });
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
