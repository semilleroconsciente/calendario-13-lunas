/* ============================================================
   HINDI · देवनागरी A1 → B2/C1 + CULTURA — Calendario 13 Lunas
   Sección completa dentro de Aprender > Idiomas y cultura:
   - Botón btnHindi (grupo aprender, sub idiomas, junto a
     Kimün Mapuzugun, Inglés, Portugués y Chino)
   - Diálogo hindiDialog con 6 pestañas:
     1) ☀️ Palabra del día (devanagari rotativo + transliteración + TTS hi-IN)
     2) 🌱 A1 Supervivencia (20 tarjetas + है/हूँ + números + mini-diálogo)
     3) 🌿 A2 Vida diaria (14 tarjetas + pasado con ने + futuro + direcciones)
     4) 💬 B1 Viajar, trabajar y opinar (10 + postposiciones + formalidad आप)
     5) 📜 B2–C1 + Cultura (expresiones, tú/tum/aap, retroflejas que cambian
         todo, devanagari↔romano, orden SOV, Diwali/Holi, yoga, comida, cine)
     6) 🧩 Quiz por niveles + quiz de transliteración + racha local
   - Todo local y privado por usuario:
     userData().hindi = { ok, total, streak, lastDay }
   - 100% offline. TTS usa la voz del dispositivo (speechSynthesis
     con lang hi-IN), igual que Inglés, Portugués y Chino.
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
function openDlg(id) {
  var d = $(id);
  if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } }
}

/* ---------------- CONTENIDO ---------------- */
/* dv: devanagari · tr: transliteración simple para hispanohablantes · es: español · ex: ejemplo */
var HI_A1 = [
  { dv: 'नमस्ते', tr: 'namaste', es: 'hola (respetuoso, lit. “me inclino ante ti”)', ex: 'नमस्ते, आप कैसे हैं? — Hola, ¿cómo está usted?' },
  { dv: 'धन्यवाद / शुक्रिया', tr: 'dhan-yavad / shukriya', es: 'gracias (formal / coloquial)', ex: 'बहुत-बहुत धन्यवाद। — Muchas gracias.' },
  { dv: 'कृपया', tr: 'kripya', es: 'por favor', ex: 'कृपया बैठिए। — Siéntese, por favor.' },
  { dv: 'सुप्रभात', tr: 'suprabhat', es: 'buenos días', ex: 'सुप्रभात, बच्चों। — Buenos días, clase.' },
  { dv: 'शुभ रात्रि', tr: 'shubh ratri', es: 'buenas noches', ex: 'शुभ रात्रि, कल मिलेंगे। — Buenas noches, nos vemos mañana.' },
  { dv: 'मेरा नाम… है', tr: 'mera naam… hai', es: 'me llamo…', ex: 'मेरा नाम आना है। — Me llamo Ana.' },
  { dv: 'मैं चिली से हूँ', tr: 'main chili se hun', es: 'soy de Chile', ex: 'मैं पेन्को से हूँ। — Soy de Penco.' },
  { dv: 'क्या आप स्पेनिश बोलते हैं?', tr: 'kya aap spenish bolte hain?', es: '¿habla usted español?', ex: 'मैं थोड़ी हिंदी बोलती हूँ। — Hablo un poco de hindi.' },
  { dv: 'पानी', tr: 'paani', es: 'agua', ex: 'एक गिलास पानी, कृपया। — Un vaso de agua, por favor.' },
  { dv: 'खाना / रोटी', tr: 'khana / roti', es: 'comida / pan plano', ex: 'दाल और चावल। — Lentejas y arroz.' },
  { dv: 'घर', tr: 'ghar', es: 'casa / hogar', ex: 'मेरा घर समुद्र के पास है। — Mi casa está junto al mar.' },
  { dv: 'आज', tr: 'aaj', es: 'hoy', ex: 'आज अच्छा दिन है। — Hoy es un buen día.' },
  { dv: 'है / हूँ / हैं', tr: 'hai / hun / hain', es: 'es/son/soy (ser-estar)', ex: 'मैं छात्रा हूँ। — Soy estudiante.' },
  { dv: 'मेरे पास… है', tr: 'mere paas… hai', es: 'tengo… (lit. “junto a mí hay”)', ex: 'मेरे दो भाई हैं। — Tengo dos hermanos.' },
  { dv: 'संख्याएँ 1–10', tr: 'ek, do, teen, chaar, paanch, chhah, saat, aath, nau, das', es: 'números 1–10', ex: 'एक, दो, तीन… दस। — Uno, dos, tres… diez.' },
  { dv: 'लाल, नीला, हरा', tr: 'laal, neela, hara', es: 'rojo, azul, verde', ex: 'समुद्र नीला है। — El mar es azul.' },
  { dv: 'माँ, पापा', tr: 'maan, papa', es: 'mamá, papá', ex: 'मेरी माँ अच्छा खाना बनाती हैं। — Mi mamá cocina rico.' },
  { dv: 'मुझे… पसंद है', tr: 'mujhe… pasand hai', es: 'me gusta…', ex: 'मुझे समुद्र पसंद है। — Me gusta el mar.' },
  { dv: 'मुझे… चाहिए', tr: 'mujhe… chaahiye', es: 'necesito…', ex: 'मुझे मदद चाहिए। — Necesito ayuda.' },
  { dv: 'कल मिलेंगे', tr: 'kal milenge', es: 'nos vemos mañana (kal = ayer Y mañana)', ex: 'अलविदा! कल मिलेंगे। — ¡Chao! Nos vemos mañana.' }
];
var HI_A2 = [
  { dv: 'आपने कल क्या किया?', tr: 'aapne kal kya kiya?', es: '¿qué hizo ayer?', ex: 'मैंने बगीचे में काम किया। — Trabajé en la huerta.' },
  { dv: 'मैं… करूँगी / करूँगा', tr: 'main… karungi / karunga', es: 'voy a… / haré… (futura/o)', ex: 'मैं खाना बनाऊँगी। — Voy a cocinar.' },
  { dv: 'से बड़ा / सबसे बड़ा', tr: 'se bada / sabse bada', es: 'más grande que / el más grande', ex: 'समुद्र नदी से बड़ा है। — El mar es más grande que el río.' },
  { dv: 'कितने का है? / कितने?', tr: 'kitne ka hai? / kitne?', es: '¿cuánto cuesta? / ¿cuántos?', ex: 'यह कितने का है? — ¿Cuánto cuesta esto?' },
  { dv: 'मुझे काम करना है', tr: 'mujhe kaam karna hai', es: 'tengo que trabajar', ex: 'मुझे अभी जाना है। — Me tengo que ir ahora.' },
  { dv: 'क्या आप मेरी मदद कर सकते हैं?', tr: 'kya aap meri madad kar sakte hain?', es: '¿puede ayudarme?', ex: 'धीरे बोलिए, कृपया। — Hable despacio, por favor.' },
  { dv: 'है (hay)', tr: 'hai', es: 'hay', ex: 'यहाँ एक बाज़ार है। — Aquí hay un mercado.' },
  { dv: 'बारिश हो रही है / धूप है', tr: 'baarish ho rahi hai / dhoop hai', es: 'llueve / hay sol', ex: 'पेन्को में आज बारिश हो रही है। — Hoy llueve en Penco.' },
  { dv: 'गया, खाया, देखा', tr: 'gaya, khaaya, dekha', es: 'fui, comí, vi (pasado)', ex: 'हम समुद्र तट गए। — Fuimos a la playa.' },
  { dv: 'खरीदारी: बहुत महँगा है', tr: 'khareedaari: bahut mahanga hai', es: 'comprar: ¡qué caro!', ex: 'पाँच हज़ार पेसो। — Cinco mil pesos.' },
  { dv: 'बाएँ मुड़िए / दाएँ मुड़िए', tr: 'baaen mudiie / daaen mudiie', es: 'gire a la izquierda / derecha (formal)', ex: 'चौराहे पर बाएँ मुड़िए। — Gire a la izquierda en la plaza.' },
  { dv: 'खुश, थका हुआ, बीमार', tr: 'khush, thaka hua, beemaar', es: 'feliz, cansado/a, enfermo/a', ex: 'मैं आज बहुत थकी हूँ। — Hoy estoy cansada.' },
  { dv: 'बनाना / साफ़ करना / धोना', tr: 'banaana / saaf karna / dhona', es: 'cocinar / limpiar / lavar', ex: 'मैं रोज़ खाना बनाती हूँ। — Cocino todos los días.' },
  { dv: 'तीन बजे मिलेंगे', tr: 'teen baje milenge', es: 'nos vemos a las tres', ex: 'पाँच बजे मिलेंगे। — Nos vemos a las cinco.' }
];
var HI_B1 = [
  { dv: 'मैं यहाँ पाँच साल से रह रही हूँ', tr: 'main yahaan paanch saal se reh rahi hun', es: 'vivo aquí desde hace 5 años', ex: 'मैंने कभी बर्फ़ नहीं देखी। — Nunca he visto nieve.' },
  { dv: 'अगर बारिश होगी, हम घर पर रहेंगे', tr: 'agar baarish hogi, ham ghar par rahenge', es: 'si llueve, nos quedamos (अगर… तो…)', ex: 'अगर तुम पढ़ोगे, सफल होगे। — Si estudias, avanzarás.' },
  { dv: 'ढूँढ़ना / देखभाल / हार न मानना', tr: 'dhundhna / dekhbhaal / haar na maanna', es: 'buscar / cuidar / rendirse', ex: 'हार मत मानो! — ¡No te rindas!' },
  { dv: 'यात्रा: मुझे एक टिकट चाहिए', tr: 'yaatra: mujhe ek tikat chaahiye', es: 'viajes: quiero un pasaje', ex: 'कन्सेप्सियोन का एक टिकट, कृपया। — Un pasaje a Concepción.' },
  { dv: 'काम: मैं… की ज़िम्मेदार हूँ', tr: 'kaam: main… ki zimmedaar hun', es: 'trabajo: soy responsable de…', ex: 'मैं बगीचे की ज़िम्मेदार हूँ। — Estoy a cargo de la huerta.' },
  { dv: 'मुझे लगता है / मेरे विचार से', tr: 'mujhe lagta hai / mere vichaar se', es: 'creo que / en mi opinión', ex: 'मुझे लगता है, यह अच्छा विचार है। — Creo que es buena idea.' },
  { dv: 'पहले + verbo', tr: 'pehle + verbo', es: 'antes / solía…', ex: 'मैं पहले गिटार बजाती थी। — Antes tocaba guitarra.' },
  { dv: 'इसलिए / क्योंकि / हालाँकि', tr: 'isliye / kyonki / haalaanki', es: 'así que / porque / aunque', ex: 'ठंड थी, इसलिए हम घर पर रहे। — Hacía frío, así que nos quedamos.' },
  { dv: 'स्वास्थ्य: मेरे सिर में दर्द है', tr: 'svaasthya: mere sir me dard hai', es: 'salud: me duele la cabeza', ex: 'मुझे डॉक्टर से मिलना है। — Necesito hora médica.' },
  { dv: 'ईमेल: सादर / शुभकामनाएँ', tr: 'eemel: saadar / shubhkaamnaayen', es: 'correo: atentamente / saludos', ex: 'सादर, आना। — Atentamente, Ana.' }
];
var HI_B2C1 = [
  { dv: 'बर्फ़ तोड़ना', tr: 'barf todna', es: 'romper el hielo', ex: 'एक मज़ाक ने बर्फ़ तोड़ दी। — Un chiste rompió el hielo.' },
  { dv: 'जैसा देश, वैसा भेष', tr: 'jaisa desh, vaisa bhesh', es: 'donde fueres, haz lo que vieres', ex: 'भारत में, जैसा देश वैसा भेष। — En India, haz como los locales.' },
  { dv: 'ऊँट के मुँह में जीरा', tr: 'oont ke munh me jeera', es: 'como comino en boca de camello (donde cabe mucho, poco)', ex: 'Proverbio clásico: una gota para un océano.' },
  { dv: 'शाबाश! / चक दे!', tr: 'shaabaash! / chak de!', es: '¡bien hecho! ¡vamos!', ex: 'परीक्षा के लिए चक दे! — ¡Ánimo con la prueba!' },
  { dv: 'जब वह आया, मैं जा चुकी थी', tr: 'jab vah aaya, main jaa chuki thi', es: 'ya me había ido (चुका था)', ex: 'Para contar historias en pasado pluscuamperfecto.' },
  { dv: 'अगर मैंने पढ़ा होता, पास हो जाती', tr: 'agar mainne padha hota, paas ho jaati', es: 'si hubiera estudiado, habría aprobado', ex: 'Arrepentimientos y lecciones.' },
  { dv: 'समुद्र तट स्वयंसेवकों द्वारा साफ़ किया गया', tr: 'samudra tat svayansevakon dvaara saaf kiya gaya', es: 'la playa fue limpiada (pasiva con द्वारा)', ex: 'Pasiva formal: द्वारा + गया.' },
  { dv: 'उसने कहा कि वह थकी थी', tr: 'usne kahaa ki vah thaki thi', es: 'dijo que estaba cansada (discurso indirecto)', ex: 'Directo → indirecto con कि.' },
  { dv: 'इंटरव्यू: मेरी खूबी है…', tr: 'interview: meri khoobi hai…', es: 'entrevista: mi fortaleza es…', ex: 'मुझे टीम में काम करना आता है। — Soy buena trabajando en equipo.' },
  { dv: 'हालाँकि / इसके अलावा', tr: 'haalaanki / iske alaava', es: 'sin embargo / además (ensayo)', ex: 'हालाँकि, समुद्र ही जीवन है। — Sin embargo, el mar es vida.' }
];
var HI_RETRO = [
  ['ट ठ ड ढ ण — retroflejas (lengua al paladar)', 'त (dental, lengua a los dientes) ≠ ट (retrofleja, lengua atrás). ठंडा (frío) ≠ तंबू (carpa). Practica: ta-ta-ta moviendo la lengua 1 cm atrás.'],
  ['ख घ छ झ — aspiradas (con soplo)', 'क (k) + soplo = ख (kh). Gana/ghana: कान (oído) ≠ खान (mina). Pon un papel: debe moverse con ख घ छ झ, no con क ग च ज.'],
  ['ड़ ढ़ — los sonidos que no existen en español', 'पड़ना (caer/aprender) ≠ पदना (no existe solo). Golpea la lengua contra el paladar: es una “r” corta y dura. Escucha 20 veces antes de repetir.'],
  ['ज्ञ = gya · क्ष = ksha · त्र = tra', 'ज्ञान (gyaan, conocimiento) · क्षमा (kshama, perdón) · त्रिशूल (trishul). No se leen letra por letra: son ligaduras.'],
  ['ं (anusvara) y ः (visarga)', 'ं nasaliza: हिंदू (hindu), चाँद (luna, chaand). ः es un eco: नमः (namah). La rayita Chandrabindu (ँ) en गाँव (aldea) también nasaliza.'],
  ['श ष स — tres “s”', 'श (sha suave, como “show”) · ष (sha profunda) · स (sa dental). शहर (ciudad) vs सामान (equipaje). Al inicio, usa siempre श suave: te entenderán.'],
  ['a final muda: राम = “raam”, no “raama”', 'El hindi BORRA la -a final: नमस्ते se dice “namaste”, कमल (“kamal”, loto) no “kamala”. Excepción: palabras prestadas y poesía la conservan.'],
  ['राम vs रॉम · दस vs दस? — vocales largas importan', 'कम (kam, poco) ≠ काम (kaam, trabajo) · दिन (din, día) ≠ दीन (deen, pobre). Alarga el doble: aa, ee, oo. Exagera al pagar en el mercado.']
];
var HI_REGISTRO = [
  ['🙏 तू (tu) — íntimo o menor', 'Solo familia muy cercana, niños, dioses y poesía. Decirle “tu” a un desconocido suena rudo. Con tu cuaderno: úsalo solo en canciones.'],
  ['🤝 तुम (tum) — cercano e igual', 'Amigos, compañeros, jóvenes entre sí. Verbos en -o: तुम बोलो (habla). Es el “tú” chileno: cariñoso y horizontal.'],
  ['🌟 आप (aap) — respeto y distancia', 'Mayores, desconocidos, clientes, profesores. Verbos en -ie/-iye: आप बोलिए (hable usted). Con आप nunca fallas: empieza SIEMPRE en आप.'],
  ['🧭 में · पर · से · को · का/की/के (postposiciones)', 'El hindi NO tiene preposiciones: van DESPUÉS. घर में (en casa) · मेज़ पर (sobre la mesa) · चिली से (desde Chile) · मुझको (a mí) · मेरा/मेरी/मेरे (mi, según género).'],
  ['⚖️ género: -ा masculino · -ी femenino', 'लड़का (niño) / लड़की (niña) · बड़ा घर (casa grande, masc.) / बड़ी नदी (río grande, fem.). El verbo concuerda: वह गया (él fue) / वह गई (ella fue).'],
  ['🔀 orden SOV: sujeto-objeto-verbo', 'मैं चाय पीती हूँ (yo té bebo = yo bebo té). El verbo SIEMPRE al final. Pregunta con क्या al inicio: क्या आप…? (¿usted…?).'],
  ['🚫 नहीं (antes del verbo) · मत (prohibir)', 'मैं नहीं जानती (no sé) · अंदर मत जाओ (no entres). ने marca el pasado transitivo: मैंने खाया (yo comí). Sin ने en presente.']
];
var HI_NAGARI = [
  ['🀄 देवनागरी: 13 vocales + 33 consonantes', 'अ आ इ ई उ ऊ… + क ख ग घ… Cada consonante trae una “a” pegada (क = ka). La virama ् la quita: क् = k. Con el alfabeto base lees el 80%.'],
  ['✍️ La línea de arriba (शिरोरेखा) manda', 'क म ल escriben colgados de la línea superior. Escribe de izquierda a derecha, línea primero, trazos después. El dedo recuerda: 5 veces cada letra.'],
  ['🔤 Romano ↔ Nagari: Hinglish puente', 'Namaste = नमस्ते · shukriya = शुक्रिया. Los jóvenes escriben “main tumse pyaar karti hun” en WhatsApp. Aprende NAGARI primero, el romano llega solo.'],
  ['📏 Regla de oro', 'Lee NAGARI + transliteración juntas (como aquí: devanagari + tr). Tapa una columna y recita la otra. En 28 días lees carteles de Penco… y de Delhi.']
];

function allHi() { return HI_A1.concat(HI_A2, HI_B1, HI_B2C1); }

/* ---------------- ESTADO ---------------- */
var hiTab = 'palabra';
var hiQuizQ = null;
var hiQuizLevel = 'todo';
var hiQuizMode = 'significado';
var hiShown = null; // palabra visible en "Palabra del día" (para 🎲 y 🔊 ejemplo)

function getHiData() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { ok: 0, total: 0, streak: 0, lastDay: '' };
    if (!u.hindi) u.hindi = { ok: 0, total: 0, streak: 0, lastDay: '' };
    return u.hindi;
  } catch (e) { return { ok: 0, total: 0, streak: 0, lastDay: '' }; }
}
function hiDayIndex(n) {
  try {
    var d = new Date();
    var s = d.getFullYear() * 1000 + Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
    return s % n;
  } catch (e) { return 0; }
}
/* ---------------- AUDIO (TTS hi robusto) ---------------- */
var hiVoicesCache = null;
var hiSlow = false;
var hiResumeTimer = null;
var hiSpeaking = false;
var hiSpeakToken = 0;
var hiOnlineAudio = null;
function hiEnsureVoices() {
  try {
    if (!('speechSynthesis' in window)) return [];
    var vs = window.speechSynthesis.getVoices() || [];
    if (vs && vs.length) hiVoicesCache = vs;
    return vs && vs.length ? vs : (hiVoicesCache || []);
  } catch (e) { return hiVoicesCache || []; }
}
try {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    var hiWarm = function () { try { hiEnsureVoices(); } catch (e) {} };
    try { hiWarm(); } catch (e) {}
    try {
      if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = function () { try { hiEnsureVoices(); hiRefreshVoiceStatus(); } catch (e) {} };
      }
    } catch (e) {}
  }
} catch (e) {}
function hiPickVoice() {
  var vs = hiEnsureVoices();
  if (!vs || !vs.length) return null;
  var score = function (v) {
    var lang = String((v && v.lang) || '');
    var name = String((v && v.name) || '').toLowerCase();
    var l = lang.toLowerCase();
    if (/^hi[-_]in/i.test(lang)) return 100;
    if (/^hi/i.test(l) && /hindi|swara|veena|lekha|kavya/i.test(name)) return 95;
    if (/^hi/i.test(l)) return 85;
    if (/hindi/i.test(name)) return 70;
    return -1;
  };
  var best = null, bestScore = -1;
  for (var i = 0; i < vs.length; i++) {
    var s = score(vs[i]);
    if (s > bestScore) { bestScore = s; best = vs[i]; }
  }
  return bestScore >= 0 ? best : null;
}
function hiHasHiVoice() { return !!hiPickVoice(); }
function hiClearResume() {
  try { if (hiResumeTimer) { clearInterval(hiResumeTimer); hiResumeTimer = null; } } catch (e) {}
}
function hiStop() {
  try { hiSpeakToken++; } catch (e) {}
  try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
  try { if (hiOnlineAudio) { hiOnlineAudio.pause(); try { hiOnlineAudio.src = ''; } catch (x) {} hiOnlineAudio = null; } } catch (e) {}
  hiClearResume();
  hiSpeaking = false;
  try { hiPaintSpeakState(); } catch (e) {}
}
function hiVoiceStatus() {
  try {
    if (!('speechSynthesis' in window)) return { ok: false, msg: 'Este dispositivo no tiene voz disponible (speechSynthesis ausente).' };
    var v = hiPickVoice();
    if (v) return { ok: true, msg: '🔊 Voz: ' + (v.name || 'hindi') + ' (' + (v.lang || 'hi-IN') + ')' };
    return { ok: false, msg: '⚠️ Sin voz hindi instalada: se intentará igual, pero puede sonar con acento raro o quedar en silencio.' };
  } catch (e) { return { ok: false, msg: '' }; }
}
function hiCountVoices() {
  try {
    var vs = hiEnsureVoices();
    var n = vs ? vs.length : 0, hc = 0;
    for (var i = 0; i < (vs || []).length; i++) {
      var l = String((vs[i] && vs[i].lang) || '').toLowerCase();
      var nm = String((vs[i] && vs[i].name) || '').toLowerCase();
      if (/^hi/.test(l) || /hindi/.test(nm)) hc++;
    }
    return { total: n, hi: hc };
  } catch (e) { return { total: 0, hi: 0 }; }
}
function hiRefreshVoiceStatus() {
  var el = $('hiVoiceStatus');
  if (!el) return;
  var st = hiVoiceStatus();
  var c = hiCountVoices();
  var info = ' <span class="muted">(' + c.hi + ' hindi(s) de ' + c.total + ' voces)</span>';
  el.innerHTML = esc(st.msg) + info +
    ' <button type="button" id="hiVoiceTest" class="btn su-337714">🔊 Probar voz</button>' +
    ' <button type="button" id="hiOnlineTest" class="btn su-337714" title="Usa internet si tu equipo no tiene voz hindi">🌐 Oír online</button>' +
    (st.ok ? '' : '<br><span class="muted">Sin voz hindi el audio local puede quedar mudo: usa 🌐 Oír online (requiere internet) o instala voz hindi: <b>Windows:</b> Configuración → Hora e idioma → Voz → Agregar voz (Hindi). <b>Android:</b> Ajustes → Idioma → Salida TTS → instalar hindi. <b>iPhone:</b> Ajustes → Accesibilidad → Voces → Hindi. Luego recarga.</span>');
  try {
    var bt = $('hiVoiceTest');
    if (bt) bt.onclick = function (e) { try { e.preventDefault(); } catch (x) {} hiSpeak('नमस्ते', { forceLocal: true }); };
    var on = $('hiOnlineTest');
    if (on) on.onclick = function (e) { try { e.preventDefault(); } catch (x) {} hiSpeakOnline(hiShown ? hiShown.dv : 'नमस्ते'); };
  } catch (e) {}
}
function hiSpeakOnline(txt) {
  var text = String(txt == null ? '' : txt).trim();
  if (!text) return;
  try { hiStop(); } catch (e) {}
  try {
    var url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=hi&client=tw-ob&q=' + encodeURIComponent(text);
    var a = new Audio(url);
    hiOnlineAudio = a;
    hiSpeaking = true;
    try { hiPaintSpeakState(); } catch (e) {}
    a.onended = function () { hiSpeaking = false; hiOnlineAudio = null; try { hiPaintSpeakState(); } catch (x) {} };
    a.onerror = function () {
      hiSpeaking = false; hiOnlineAudio = null;
      try { hiPaintSpeakState(); } catch (x) {}
      alert('No se pudo reproducir el audio online. Revisa tu conexión o instala una voz hindi en el dispositivo.');
    };
    var p = a.play();
    if (p && p.catch) p.catch(function () {
      hiSpeaking = false; hiOnlineAudio = null;
      try { hiPaintSpeakState(); } catch (x) {}
    });
  } catch (e) { alert('No se pudo reproducir el audio online.'); }
}
function hiPaintSpeakState() {
  try {
    var btns = document.querySelectorAll('#hindiDialog .hi-speaking');
    for (var i = 0; i < btns.length; i++) {
      if (hiSpeaking) btns[i].classList.add('btn-accent');
      else btns[i].classList.remove('btn-accent');
    }
  } catch (e) {}
}
function hiSpeak(txt, opts) {
  opts = opts || {};
  var text = String(txt == null ? '' : txt).trim();
  if (!text) return;
  if (opts.forceOnline) { hiSpeakOnline(text); return; }
  try {
    if (!('speechSynthesis' in window)) { hiSpeakOnline(text); return; }
    if (!opts.forceLocal && !hiHasHiVoice()) { hiSpeakOnline(text); return; }
    var my = ++hiSpeakToken;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    try { if (hiOnlineAudio) { hiOnlineAudio.pause(); hiOnlineAudio = null; } } catch (e) {}
    hiClearResume();
    hiSpeaking = false;
    try { hiPaintSpeakState(); } catch (e) {}
    setTimeout(function () {
      if (my !== hiSpeakToken) return;
      try {
        try { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); } catch (x) {}
        var u = new SpeechSynthesisUtterance(text);
        var voice = hiPickVoice();
        if (voice) { try { u.voice = voice; } catch (e) {} }
        u.lang = (voice && voice.lang) ? voice.lang : 'hi-IN';
        var slow = (opts.slow != null) ? !!opts.slow : hiSlow;
        u.rate = slow ? 0.55 : 0.8;
        u.pitch = 1;
        u.volume = 1;
        hiSpeaking = true;
        try { hiPaintSpeakState(); } catch (e) {}
        var fellBack = false;
        u.onend = function () { hiSpeaking = false; hiClearResume(); try { hiPaintSpeakState(); } catch (e) {} if (typeof opts.onend === 'function') { try { opts.onend(); } catch (x) {} } };
        u.onerror = function (ev) {
          hiSpeaking = false; hiClearResume();
          try { hiPaintSpeakState(); } catch (e) {}
          try { hiRefreshVoiceStatus(); } catch (e) {}
          if (!fellBack && !opts.forceLocal && !hiHasHiVoice()) {
            fellBack = true;
            hiSpeakOnline(text);
            return;
          }
          if (typeof opts.onerror === 'function') { try { opts.onerror(ev); } catch (x) {} }
        };
        window.speechSynthesis.speak(u);
        try {
          hiClearResume();
          hiResumeTimer = setInterval(function () {
            try {
              if (window.speechSynthesis && window.speechSynthesis.speaking) {
                window.speechSynthesis.resume();
              } else { hiClearResume(); }
            } catch (e) { hiClearResume(); }
          }, 8000);
        } catch (e) {}
        try { hiRefreshVoiceStatus(); } catch (e) {}
      } catch (e) {}
    }, 120);
  } catch (e) {}
}
function hiSpeakExample(ex) {
  var t = String(ex || '');
  var cut = t.split('—')[0].trim().replace(/[.…।!！?？]+.*$/, '').trim();
  if (!cut) cut = t;
  var m = cut.match(/[ऀ-ॿ।॥]+/g);
  if (m && m.join(' ').length >= 2) cut = m.join(' ');
  hiSpeak(cut);
}
function hiQuizPool() {
  if (hiQuizLevel === 'a1') return HI_A1;
  if (hiQuizLevel === 'a2') return HI_A2;
  if (hiQuizLevel === 'b1') return HI_B1;
  if (hiQuizLevel === 'avanzado') return HI_B2C1;
  return allHi();
}

function renderHiStreak() {
  var b = $('hiStreakBox'); if (!b) return;
  var d = getHiData();
  var pct = d.total ? Math.round(d.ok / d.total * 100) : 0;
  b.innerHTML = '<b>🕉️ Tu hindi:</b> ' + d.ok + '/' + d.total + ' correctas (' + pct + '%) · racha ' + d.streak + ' 🔥 ' +
    '<span class="muted su-11a508">— 1 palabra por día · A1→C1 + cultura · todo guardado local y privado.</span>';
}
function hiCard(item, lv) {
  return '<button type="button" class="btn eng-word su-6cd6a1" data-w="' + esc(item.dv) + '"><b>🔊 ' + esc(item.dv) + '</b> ' +
    '<span class="chip su-0d5be0">' + esc(lv) + '</span><br><span class="su-2f290d">' + esc(item.tr) + ' · ' + esc(item.es) + '</span><br>' +
    '<span class="muted su-11a508">“' + esc(item.ex) + '”</span></button>';
}

function renderHiPanel(tab) {
  try { hiStop(); } catch (e) {}
  hiTab = tab || hiTab;
  var ids = { palabra: 'tabHI1', a1: 'tabHI2', a2: 'tabHI3', b1: 'tabHI4', cultura: 'tabHI5', quiz: 'tabHI6' };
  Object.keys(ids).forEach(function (k) { var el = $(ids[k]); if (el) el.classList.toggle('btn-accent', k === hiTab); });
  renderHiStreak();
  var box = $('hiPanel'); if (!box) return;
  var html = '';
  if (hiTab === 'palabra') {
    var all = allHi();
    var dayIdx = hiDayIndex(all.length);
    if (!hiShown || hiShown._day !== dayIdx || !hiShown._rand) {
      var base = all[dayIdx];
      hiShown = { dv: base.dv, tr: base.tr, es: base.es, ex: base.ex, _day: dayIdx };
    }
    var w = hiShown;
    var rel = [all[(dayIdx + 7) % all.length], all[(dayIdx + 13) % all.length]];
    var fecha = '';
    try { fecha = cal.fmtDate.format(new Date()); } catch (e) { try { fecha = new Date().toLocaleDateString(); } catch (e2) { fecha = ''; } }
    html += '<div class="menstrual-card su-3fa1a8">' +
      '<p class="muted su-11a508">☀️ आज का शब्द PALABRA DEL DÍA · ' + esc(fecha) + ' · ' + all.length + ' palabras y frases</p>' +
      '<div class="su-6adb68">' + esc(w.dv) + '</div>' +
      '<div class="su-cd8bd8"><b>' + esc(w.tr) + '</b> · ' + esc(w.es) + '</div>' +
      '<p class="muted su-2b0979">“' + esc(w.ex) + '”</p>' +
      '<div class="su-9bc2df"><button type="button" id="hiSpeakBtn" class="btn btn-accent su-30e741 hi-speaking">🔊 Escuchar (हिन्दी)</button> ' +
      '<button type="button" id="hiOnlineBtn" class="btn su-30e741" title="Audio por internet (funciona aunque tu equipo no tenga voz hindi)">🌐 Online</button> ' +
      '<button type="button" id="hiSlowBtn" class="btn su-30e741">🐢 Lento: ' + (hiSlow ? 'ON' : 'OFF') + '</button> ' +
      '<button type="button" id="hiExBtn" class="btn su-30e741">🗣️ Oír ejemplo</button> ' +
      '<button type="button" id="hiStopBtn" class="btn su-30e741">⏹ Detener</button> ' +
      '<button type="button" id="hiNextBtn" class="btn su-30e741">🎲 Otra palabra</button></div>' +
      '<p id="hiVoiceStatus" class="muted su-11a508"></p></div>' +
      '<div class="help-grid su-d2c171">' +
      rel.map(function (r) { return '<div class="help-card"><h4>' + esc(r.dv) + ' <span class="muted">' + esc(r.tr) + '</span></h4><p class="su-11a508">' + esc(r.es) + '<br><span class="muted">“' + esc(r.ex) + '”</span></p></div>'; }).join('') + '</div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>🗣️ ¿Cómo practicar?</h4><p class="su-b439ab">1) <b>Escucha</b> con 🔊 y repite 3 veces en voz alta.<br>2) <b>Escribe</b> 1 frase con la palabra en las Notas del día.<br>3) <b>Úsala hoy</b>: 1 palabra/día → ~365/año.<br>Pasa a A2 cuando sepas 20 sin mirar.</p></div>' +
      '<div class="help-card"><h4>📚 Niveles (CEFR)</h4><p class="su-b439ab">🌱 <b>A1:</b> sobrevivir (नमस्ते, पानी, घर).<br>🌿 <b>A2:</b> vida diaria (pasado con ने, futuro, compras).<br>💬 <b>B1:</b> viaje + trabajo + opinión.<br>📜 <b>B2–C1:</b> proverbios, pasiva con द्वारा, entrevista + cultura.</p></div></div>';
  } else if (hiTab === 'a1') {
    html += '<div class="menstrual-card su-5a6934"><h4 class="su-752b1a">🌱 A1 Supervivencia — sobrevive en hindi</h4>' +
      '<p class="muted su-a6c665">Meta: presentarte, pedir agua/comida, contar 1–10. Gramática: <b>है/हूँ/हैं (ser-estar), मेरे पास (tener), नहीं para negar, क्या…? para preguntar</b>. No hay artículos (el/la): contexto manda. Toca 🔊 en cada tarjeta para oír (hi-IN).</p>' +
      '<div class="su-5e3875">' + HI_A1.map(function (x) { return hiCard(x, 'A1'); }).join('') + '</div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>⚙️ है + मेरे पास (el 50% del día)</h4><p class="su-583677"><b>मैं हूँ</b> (yo soy) · <b>तुम हो</b> (tú eres) · <b>आप हैं</b> (usted es)<br><b>वह है</b> (él/ella es) · <b>हम हैं</b> (somos)<br><b>मेरे पास समय नहीं है</b> (no tengo tiempo)<br><span class="muted">Negación: <b>नहीं</b> antes del verbo. Pregunta: <b>क्या</b> al inicio.</span></p></div>' +
      '<div class="help-card"><h4>🎭 Mini-diálogo: en la feria</h4><p class="su-583677">— <b>नमस्ते! यह कितने का है?</b> (¡Hola! ¿Cuánto cuesta?)<br>— <b>पाँच हज़ार पेसो।</b> (Cinco mil pesos.)<br>— <b>धन्यवाद! कल मिलेंगे!</b> (¡Gracias! ¡Nos vemos!)<br><span class="muted">Practica: una persona por línea. En India cambia “pesos” por “रुपये” (rupaye).</span></p></div></div>';
  } else if (hiTab === 'a2') {
    html += '<div class="menstrual-card su-018729"><h4 class="su-721a46">🌿 A2 Vida diaria — el día a día</h4>' +
      '<p class="muted su-a6c665">Meta: contar qué hiciste, planes, compras y direcciones. Gramática: <b>पासado con ने (मैंने किया), futuro -ूँगा/-ेगी, से/sabse (comparar), सकता (poder)</b>.</p>' +
      '<div class="su-5e3875">' + HI_A2.map(function (x) { return hiCard(x, 'A2'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>🎭 Mini-diálogo: pidiendo dirección en Penco</h4><p class="su-583677">— <b>माफ़ कीजिए, समुद्र तट कहाँ है?</b> (Disculpa, ¿dónde queda la playa?)<br>— <b>सीधे जाइए, फिर चौराहे पर बाएँ मुड़िए।</b> (Sigue recto y gira a la izquierda en la plaza.)<br>— <b>धन्यवाद!</b> — <b>कोई बात नहीं!</b> (¡Gracias! / ¡De nada!)<br><span class="muted">Clave: कहाँ (dónde) + बाएँ/दाएँ (izquierda/derecha).</span></p></div>';
  } else if (hiTab === 'b1') {
    html += '<div class="menstrual-card su-d4d722"><h4 class="su-7c91e2">💬 B1 Intermedio — viajar, trabajar y opinar</h4>' +
      '<p class="muted su-a6c665">Meta: viajar, trabajar y opinar. Gramática estrella: <b>अगर… तो… (si… entonces…)</b> + से रहना (vivir desde hace) + पहले (antes) + इसलिए/क्योंकि/हालाँकि (conectores).</p>' +
      '<div class="su-5e3875">' + HI_B1.map(function (x) { return hiCard(x, 'B1'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>🎭 Mini-diálogo: viaje a Concepción</h4><p class="su-583677">— <b>मुझे कन्सेप्सियोन का एक टिकट चाहिए।</b> (Quiero un pasaje a Concepción.)<br>— <b>एक तरफ़ा या दोनों तरफ़ा?</b> (¿Solo ida o ida y vuelta?) — <b>दोनों तरफ़ा, कृपया।</b><br>— <b>आप यहाँ कब से रह रहे हैं?</b> — <b>पाँच साल से।</b> (¿Hace cuánto vives aquí? Cinco años.)<br><span class="muted">Practica con horarios, precios y “verbos que concuerdan en género”.</span></p></div>';
  } else if (hiTab === 'cultura') {
    html += '<div class="menstrual-card su-5b7cd0"><h4 class="su-399074">📜 B2–C1 Avanzado + Cultura viva</h4>' +
      '<p class="muted su-a6c665">Meta: entrevistas, proverbios y no pasar vergüenza con तू/तुम/आप. Gramática: <b>चुका था (ya…), होता… (condicional), pasiva con द्वारा, indirecto con कि, conectores हालाँकि/इसके अलावा</b>.</p>' +
      '<div class="su-5e3875">' + HI_B2C1.map(function (x) { return hiCard(x, 'B2–C1'); }).join('') + '</div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>⚠️ 8 sonidos que salvan vidas</h4><p class="su-583677">' + HI_RETRO.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div>' +
      '<div class="help-card"><h4>🙏 तू ↔ तुम ↔ आप ¿Cuál uso?</h4><p class="su-583677">' + HI_REGISTRO.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>🀄 देवनागरी ↔ Romano ¿Por dónde parto?</h4><p class="su-583677">' + HI_NAGARI.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div>' +
      '<div class="help-card"><h4>🪔 Cultura para probar y celebrar</h4><p class="su-b439ab"><b>Probar:</b> chai (चाय), dal (दाल), samosa (समोसा): lee la receta en hindi y cocina.<br><b>Escuchar:</b> bhajans, “Mile Sur Mera Tumhara”, 1 canción × 7 días.<br><b>Celebrar:</b> Diwali (दीवाली, fiesta de luces, oct/nov) y Holi (होली, fiesta de colores, marzo).<br><span class="muted">Sabios: yoga (योग), ayurveda y los Vedas: el calendario también es ritual. Namaste con 🙏 abre cualquier puerta.</span></p></div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>💼 Kit entrevista de trabajo</h4><p class="su-583677">— <b>कृपया अपना परिचय दीजिए।</b> (Preséntese, por favor.)<br>— <b>मैं ज़िम्मेदार हूँ, टीम में अच्छा काम करती हूँ।</b> (Soy responsable y trabajo bien en equipo.)<br>— <b>मेरी खूबी है… मेरा लक्ष्य है…</b> (Mi fortaleza es… mi meta es…)<br><span class="muted">Cierra: “आपके समय के लिए धन्यवाद।” (Gracias por su tiempo.)</span></p></div>';
  } else if (hiTab === 'quiz') {
    var d = getHiData();
    if (!hiQuizQ) {
      var pool = hiQuizPool();
      var wq = pool[Math.floor(Math.random() * pool.length)];
      var opts = {};
      opts[hiQuizMode === 'translit' ? wq.tr : wq.es] = 1;
      var guard = 0;
      while (Object.keys(opts).length < 4 && guard < 60) { guard++; var c = pool[Math.floor(Math.random() * pool.length)]; opts[hiQuizMode === 'translit' ? c.tr : c.es] = 1; }
      var arr = Object.keys(opts).sort(function () { return Math.random() - 0.5; });
      hiQuizQ = { w: wq, opts: arr };
    }
    var q = hiQuizQ;
    var lvBtn = function (v, l) { return '<button type="button" class="btn hi-lv' + (hiQuizLevel === v ? ' btn-accent' : '') + ' su-337714" data-lv="' + v + '">' + l + '</button>'; };
    var mdBtn = function (v, l) { return '<button type="button" class="btn hi-md' + (hiQuizMode === v ? ' btn-accent' : '') + ' su-337714" data-md="' + v + '">' + l + '</button>'; };
    html += '<div class="menstrual-card su-1f2df9"><h4 class="su-399074">🧩 Quiz por niveles</h4>' +
      '<div class="su-a8712a">' + lvBtn('todo', '🌎 Todo') + lvBtn('a1', '🌱 A1') + lvBtn('a2', '🌿 A2') + lvBtn('b1', '💬 B1') + lvBtn('avanzado', '📜 B2–C1') + '</div>' +
      '<div class="su-a8712a">' + mdBtn('significado', '🇪🇸 Significado') + mdBtn('translit', '🔤 Transliteración') + '</div>' +
      '<div class="su-73ce29">“' + esc(q.w.dv) + '” <span class="muted su-11a508">' + (hiQuizMode === 'translit' ? '¿cómo se pronuncia?' : '¿qué significa?') + '</span></div>' +
      '<button type="button" id="hiQuizSpeak" class="btn su-337714 hi-speaking">🔊 Escuchar</button> ' +
      '<button type="button" id="hiQuizOnline" class="btn su-337714" title="Audio por internet">🌐</button> ' +
      '<button type="button" id="hiQuizSlow" class="btn su-337714">🐢 Lento: ' + (hiSlow ? 'ON' : 'OFF') + '</button> ' +
      '<button type="button" id="hiQuizStop" class="btn su-337714">⏹</button>' +
      '<p id="hiVoiceStatus" class="muted su-11a508"></p>' +
      '<div class="su-ae0e71">' + q.opts.map(function (o) { return '<button type="button" class="btn hi-opt su-046678" data-o="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div>' +
      '<div id="hiQuizFb" class="su-ac1122"></div>' +
      '<p class="muted su-e13d76">Correctas ' + d.ok + '/' + d.total + ' · racha ' + d.streak + ' · nivel: <b>' + esc(hiQuizLevel) + '</b> · modo: <b>' + esc(hiQuizMode) + '</b> · banco: ' + hiQuizPool().length + ' palabras/frases</p></div>';
  }
  box.innerHTML = html + '<p class="muted su-a953a7">🔊 Toca cualquier tarjeta para oír en hindi (voz hindi del dispositivo). El quiz suma a tu racha local y privada.</p>';
  try { hiEnsureVoices(); hiRefreshVoiceStatus(); } catch (e) {}
  try { hiPaintSpeakState(); } catch (e) {}
  var sp = $('hiSpeakBtn');
  if (sp) sp.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (hiShown) hiSpeak(hiShown.dv); };
  var onB = $('hiOnlineBtn');
  if (onB) onB.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (hiShown) hiSpeakOnline(hiShown.dv); };
  var sl = $('hiSlowBtn');
  if (sl) sl.onclick = function (e) { try { e.preventDefault(); } catch (x) {} hiSlow = !hiSlow; sl.textContent = '🐢 Lento: ' + (hiSlow ? 'ON' : 'OFF'); if (hiShown) hiSpeak(hiShown.dv); };
  var exB = $('hiExBtn');
  if (exB) exB.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (hiShown) hiSpeakExample(hiShown.ex); };
  var stB = $('hiStopBtn');
  if (stB) stB.onclick = function (e) { try { e.preventDefault(); } catch (x) {} hiStop(); };
  var nx = $('hiNextBtn');
  if (nx) nx.onclick = function () {
    try {
      var a = allHi();
      var di = hiDayIndex(a.length);
      var pick = a[Math.floor(Math.random() * a.length)];
      var gd = 0;
      while (hiShown && pick.dv === hiShown.dv && gd < 25) { gd++; pick = a[Math.floor(Math.random() * a.length)]; }
      hiShown = { dv: pick.dv, tr: pick.tr, es: pick.es, ex: pick.ex, _day: di, _rand: 1 };
      hiStop();
      renderHiPanel('palabra');
      if (hiShown) hiSpeak(hiShown.dv);
    } catch (e) { try { renderHiPanel('palabra'); } catch (x) {} }
  };
  var qs = $('hiQuizSpeak');
  if (qs) qs.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (hiQuizQ) hiSpeak(hiQuizQ.w.dv); };
  var qo = $('hiQuizOnline');
  if (qo) qo.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (hiQuizQ) hiSpeakOnline(hiQuizQ.w.dv); };
  var qsl = $('hiQuizSlow');
  if (qsl) qsl.onclick = function (e) { try { e.preventDefault(); } catch (x) {} hiSlow = !hiSlow; qsl.textContent = '🐢 Lento: ' + (hiSlow ? 'ON' : 'OFF'); if (hiQuizQ) hiSpeak(hiQuizQ.w.dv); };
  var qst = $('hiQuizStop');
  if (qst) qst.onclick = function (e) { try { e.preventDefault(); } catch (x) {} hiStop(); };
  box.querySelectorAll('.eng-word').forEach(function (b) {
    b.onclick = function (e) { try { e.preventDefault(); } catch (x) {} hiSpeak(b.getAttribute('data-w')); };
  });
  box.querySelectorAll('.hi-lv').forEach(function (b) {
    b.onclick = function () { hiQuizLevel = b.getAttribute('data-lv'); hiQuizQ = null; renderHiPanel('quiz'); };
  });
  box.querySelectorAll('.hi-md').forEach(function (b) {
    b.onclick = function () { hiQuizMode = b.getAttribute('data-md'); hiQuizQ = null; renderHiPanel('quiz'); };
  });
  box.querySelectorAll('.hi-opt').forEach(function (b) {
    b.onclick = function () {
      var d2 = getHiData();
      var good = hiQuizMode === 'translit' ? hiQuizQ.w.tr : hiQuizQ.w.es;
      var ok = b.getAttribute('data-o') === good;
      d2.total = (d2.total || 0) + 1;
      if (ok) { d2.ok = (d2.ok || 0) + 1; d2.streak = (d2.streak || 0) + 1; }
      else { d2.streak = 0; }
      try { if (typeof scheduleSave === 'function') scheduleSave('Guardado ✓'); } catch (e) {}
      var fb = $('hiQuizFb');
      if (fb) fb.innerHTML = ok ? '✅ ¡Muy bien! <b>' + esc(hiQuizQ.w.dv) + '</b> ' + esc(hiQuizQ.w.tr) + ' — “' + esc(hiQuizQ.w.ex) + '”'
        : '❌ Era <b>' + esc(good) + '</b> — ' + esc(hiQuizQ.w.dv) + ' ' + esc(hiQuizQ.w.tr) + ' “' + esc(hiQuizQ.w.ex) + '”';
      box.querySelectorAll('.hi-opt').forEach(function (x) {
        x.disabled = true;
        if (x.getAttribute('data-o') === good) x.classList.add('btn-accent');
      });
      renderHiStreak();
      setTimeout(function () { hiQuizQ = null; if (hiTab === 'quiz') renderHiPanel('quiz'); }, ok ? 1400 : 2400);
    };
  });
}

/* ---------------- DIÁLOGO ---------------- */
function buildDialog() {
  if ($('hindiDialog')) return;
  var d = document.createElement('dialog');
  d.id = 'hindiDialog';
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053"><h3 class="su-ee0cfe">🕉️ Hindi — A1 → C1 + cultura</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Aprende <b>hindi (हिन्दी, devanagari + transliteración) por niveles CEFR + cultura viva</b>, como el Kimün, el Inglés, el Portugués y el Chino: 1 palabra por día + retroflejas + quiz. Toca 🔊 para oír (voz del dispositivo, hi-IN). Todo queda <b>local y privado</b> por usuario.</p>' +
    '<div id="hiStreakBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="timer-tabs su-f7ad78">' +
    '<button type="button" id="tabHI1" class="btn btn-accent su-30e741">☀️ Palabra del día</button>' +
    '<button type="button" id="tabHI2" class="btn su-30e741">🌱 A1</button>' +
    '<button type="button" id="tabHI3" class="btn su-30e741">🌿 A2</button>' +
    '<button type="button" id="tabHI4" class="btn su-30e741">💬 B1</button>' +
    '<button type="button" id="tabHI5" class="btn su-30e741">📜 B2–C1 + Cultura</button>' +
    '<button type="button" id="tabHI6" class="btn su-30e741">🧩 Quiz</button></div>' +
    '<div id="hiPanel"></div>' +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { hiStop(); } catch (e) {} try { d.close(); } catch (e2) {} }; });
  try {
    d.addEventListener('close', function () { try { hiStop(); } catch (e) {} });
    d.addEventListener('cancel', function () { try { hiStop(); } catch (e) {} });
  } catch (e) {}
}

function bindTabs() {
  var map = { tabHI1: 'palabra', tabHI2: 'a1', tabHI3: 'a2', tabHI4: 'b1', tabHI5: 'cultura', tabHI6: 'quiz' };
  Object.keys(map).forEach(function (id) {
    var el = $(id);
    if (el) el.onclick = function () {
      try { hiStop(); } catch (e) {}
      if (map[id] !== 'quiz') hiQuizQ = null;
      if (map[id] === 'palabra') hiShown = null;
      renderHiPanel(map[id]);
    };
  });
}

/* ---------------- SETUP ---------------- */
function ensureButton() {
  try {
    var existing = $('btnHindi');
    if (existing) { try { existing.setAttribute('data-sub', 'idiomas'); } catch (e) {} return existing; }
    var g = document.querySelector('.action-group[data-group="aprender"] .group-btns');
    if (!g) return null;
    var btn = document.createElement('button');
    btn.id = 'btnHindi'; btn.className = 'btn'; btn.type = 'button';
    btn.textContent = '🕉️ Hindi';
    try { btn.setAttribute('data-sub', 'idiomas'); } catch (e2) {}
    btn.setAttribute('data-keywords', 'hindi hindu india devanagari transliteracion namaste diwali holi yoga bollywood cricket chai ayurveda idioma niveles a1 a2 b1 b2 c1 basico intermedio avanzado quiz vocabulario gramatica retroflejas postposiciones');
    var ref = g.querySelector('#btnChino');
    if (ref && ref.parentNode === g) g.insertBefore(btn, ref.nextSibling);
    else g.appendChild(btn);
    return btn;
  } catch (e) { return null; }
}

function registerGlobals() {
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnHindi') < 0) {
      var i = ALL_BTNS.indexOf('btnChino');
      if (i >= 0) ALL_BTNS.splice(i + 1, 0, 'btnHindi');
      else ALL_BTNS.push('btnHindi');
    }
  } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnHindi = ['aprender', 'idiomas']; } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['aprender|idiomas'] && BTN_ORDER['aprender|idiomas'].indexOf('btnHindi') < 0) {
      BTN_ORDER['aprender|idiomas'].push('btnHindi');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p] && (p === 'todo' || p === 'adulto' || p === 'estudiante' || p === 'docente' || p === 'adolescente')) PRESETS[p].btnHindi = true;
      });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnHindi"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Aprender') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnHindi"> 🕉️ Hindi';
          var ref2 = gr.querySelector('input[data-btn="btnChino"]');
          if (ref2 && ref2.closest && ref2.closest('label') && ref2.closest('label').parentNode) {
            ref2.closest('label').parentNode.insertBefore(lab, ref2.closest('label').nextSibling);
          } else { gr.appendChild(lab); }
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnHindi !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnHindi = lab.querySelector('input').checked;
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
}

function setup() {
  ensureButton();
  registerGlobals();
  buildDialog();
  bindTabs();
  renderHiPanel('palabra');
  var b = $('btnHindi');
  if (!b) { if ((setup._r = (setup._r || 0) + 1) < 60) setTimeout(setup, 500); return; }
  if (!b.dataset.hiu) {
    b.dataset.hiu = '1';
    b.addEventListener('click', function () {
      hiQuizQ = null;
      hiShown = null;
      try { hiEnsureVoices(); } catch (e) {}
      renderHiPanel('palabra');
      openDlg('hindiDialog');
    });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 500); });
else setTimeout(setup, 500);

})();
