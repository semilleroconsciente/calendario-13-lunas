/* ============================================================
   JAPONÉS · 日本語 N5 → N1 + CULTURA — Calendario 13 Lunas
   Sección completa dentro de Aprender > Idiomas y cultura:
   - Botón btnJapones (grupo aprender, sub idiomas, junto a
     Kimün Mapuzugun, Inglés, Portugués, Chino, Hindi, Italiano y Ruso)
   - Diálogo japonesDialog con 6 pestañas:
     1) ☀️ Palabra del día (kana+kanji rotativo + romaji + TTS ja-JP)
     2) 🌱 N5 Supervivencia (20 tarjetas + desu/masu + números + mini-diálogo)
     3) 🌿 N4 Vida diaria (14 tarjetas + pasado con mashita + direcciones)
     4) 💬 N3 Viajar, trabajar y opinar (10 + te-form + keigo básico)
     5) 📜 N2–N1 + Cultura (kotowaza, partículas que cambian todo,
        kana↔kanji, pitch accent, té, matsuri, haiku, omotenashi)
     6) 🧩 Quiz por niveles + quiz de romaji + racha local
   - Todo local y privado por usuario:
     userData().japones = { ok, total, streak, lastDay }
   - 100% offline. TTS usa la voz del dispositivo (speechSynthesis
     con lang ja-JP), igual que Inglés, Portugués, Chino e Hindi.
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
/* jp: japonés (kana + kanji) · ro: romaji simple · es: español · ex: ejemplo */
var JA_A1 = [
  { jp: 'こんにちは', ro: 'konnichiwa', es: 'hola (de día)', ex: 'こんにちは、元気ですか。— Hola, ¿cómo estás?' },
  { jp: 'ありがとう / ありがとうございます', ro: 'arigatou / arigatou gozaimasu', es: 'gracias / muchas gracias (formal)', ex: 'どうもありがとうございます。— Muchísimas gracias.' },
  { jp: 'おねがいします', ro: 'onegaishimasu', es: 'por favor (al pedir algo)', ex: 'コーヒーをおねがいします。— Un café, por favor.' },
  { jp: 'おはようございます', ro: 'ohayou gozaimasu', es: 'buenos días (formal)', ex: 'おはよう、みんな。— Buenos días, clase.' },
  { jp: 'こんばんは / おやすみなさい', ro: 'konbanwa / oyasuminasai', es: 'buenas noches (saludo / despedida)', ex: 'おやすみなさい、また明日。— Buenas noches, hasta mañana.' },
  { jp: 'わたしはアナです', ro: 'watashi wa Ana desu', es: 'me llamo Ana / soy Ana', ex: 'わたしはペンコから来ました。— Soy de Penco.' },
  { jp: 'チリから来ました', ro: 'Chiri kara kimashita', es: 'vine de Chile / soy de Chile', ex: 'ペンコから来ました。— Soy de Penco, Chile.' },
  { jp: 'スペイン語を話しますか？', ro: 'Supein-go o hanashimasu ka?', es: '¿hablas español?', ex: '日本語を少し話します。— Hablo un poco de japonés.' },
  { jp: '水（みず）', ro: 'mizu', es: 'agua', ex: '水をください。— Un vaso de agua, por favor.' },
  { jp: 'ごはん / パン', ro: 'gohan / pan', es: 'comida cocida-arroz / pan', ex: '魚とごはん、おねがいします。— Pescado y arroz, por favor.' },
  { jp: '家（いえ）/ うち', ro: 'ie / uchi', es: 'casa / hogar', ex: 'わたしの家は海の近くです。— Mi casa queda cerca del mar.' },
  { jp: '今日（きょう）', ro: 'kyou', es: 'hoy', ex: '今日はいい日です。— Hoy es un buen día.' },
  { jp: 'です / ます', ro: 'desu / masu', es: 'ser-estar / verbo cortés', ex: '学生です。— Soy estudiante.' },
  { jp: '〜があります / 〜がいます', ro: '~ ga arimasu / ~ ga imasu', es: 'tener-haber (cosas / personas-animales)', ex: '兄弟が二人います。— Tengo dos hermanos.' },
  { jp: '数字 1–10', ro: 'ichi, ni, san, yon, go, roku, nana, hachi, kyuu, juu', es: 'números 1–10', ex: 'いち、に、さん…じゅう。— Uno, dos, tres… diez.' },
  { jp: '赤い、あおい、みどり', ro: 'akai, aoi, midori', es: 'rojo, azul, verde', ex: '海はあおいです。— El mar es azul.' },
  { jp: 'お母さん、お父さん', ro: 'okaasan, otousan', es: 'mamá, papá (cariñoso)', ex: '母は料理が上手です。— Mi mamá cocina bien.' },
  { jp: '〜が好きです', ro: '~ ga suki desu', es: 'me gusta…', ex: '海が好きです。— Me gusta el mar.' },
  { jp: '〜が必要です', ro: '~ ga hitsuyou desu', es: 'necesito…', ex: '助けが必要です。— Necesito ayuda.' },
  { jp: 'また明日（あした）', ro: 'mata ashita', es: 'nos vemos mañana', ex: 'じゃあ、また明日！— ¡Chao! ¡Nos vemos mañana!' }
];
var JA_A2 = [
  { jp: '昨日（きのう）何をしましたか？', ro: 'kinou nani o shimashita ka?', es: '¿qué hiciste ayer?', ex: '畑で働きました。— Trabajé en la huerta.' },
  { jp: '〜 going to: 〜します / 〜するつもりです', ro: '~ shimasu / ~ suru tsumori desu', es: 'voy a… / tengo pensado…', ex: '料理します。— Voy a cocinar.' },
  { jp: '〜より大きい / 一番（いちばん）', ro: '~ yori ookii / ichiban', es: 'más grande que / el más', ex: '海は川より大きいです。— El mar es más grande que el río.' },
  { jp: 'いくらですか？/ いくつ？', ro: 'ikura desu ka? / ikutsu?', es: '¿cuánto cuesta? / ¿cuántos?', ex: 'これはいくらですか？— ¿Cuánto cuesta esto?' },
  { jp: '〜なければなりません', ro: '~ nakereba narimasen', es: 'tengo que…', ex: '今行かなければなりません。— Me tengo que ir ahora.' },
  { jp: '手伝ってもらえますか？', ro: 'tetsudatte moraemasu ka?', es: '¿puedes ayudarme?', ex: 'ゆっくり話してください。— Habla despacio, por favor.' },
  { jp: '〜があります (hay)', ro: '~ ga arimasu', es: 'hay', ex: 'ここに市場があります。— Aquí hay un mercado.' },
  { jp: '雨が降っています / 晴れ', ro: 'ame ga futte imasu / hare', es: 'llueve / despejado', ex: 'ペンコは今日雨です。— Hoy llueve en Penco.' },
  { jp: '行きました、食べました、見ました', ro: 'ikimashita, tabemashita, mimashita', es: 'fui, comí, vi (pasado cortés)', ex: '海岸に行きました。— Fuimos a la playa.' },
  { jp: '買い物：高いですね！', ro: 'kaimono: takai desu ne!', es: 'compras: ¡qué caro!', ex: '五千ペソです。— Son cinco mil pesos.' },
  { jp: '右に曲がって / 左に曲がって', ro: 'migi ni magatte / hidari ni magatte', es: 'gira a la derecha / izquierda', ex: '広場で左に曲がってください。— Gira a la izquierda en la plaza.' },
  { jp: 'うれしい、疲れた、病気', ro: 'ureshii, tsukareta, byouki', es: 'feliz, cansado/a, enfermo/a', ex: '今日はとても疲れました。— Hoy estoy muy cansada.' },
  { jp: '作る / 掃除する / 洗う', ro: 'tsukuru / souji suru / arau', es: 'cocinar-hacer / limpiar / lavar', ex: '毎日料理します。— Cocino todos los días.' },
  { jp: '三時に会いましょう', ro: 'sanji ni aimashou', es: 'juntémonos a las tres', ex: '五時に会いましょう。— Nos vemos a las cinco.' }
];
var JA_B1 = [
  { jp: 'ここに五年住んでいます', ro: 'koko ni go-nen sunde imasu', es: 'vivo aquí desde hace 5 años', ex: '雪を見たことがありません。— Nunca he visto nieve.' },
  { jp: '雨が降ったら、家にいます', ro: 'ame ga futtara, uchi ni imasu', es: 'si llueve, me quedo (〜たら)', ex: '勉強したら、上手になります。— Si estudias, mejorarás.' },
  { jp: '探す / 世話する / あきらめないで', ro: 'sagasu / sewa suru / akiramenaide', es: 'buscar / cuidar / no te rindas', ex: 'あきらめないで！がんばって！— ¡No te rindas! ¡Ánimo!' },
  { jp: '旅行：切符を一枚おねがいします', ro: 'ryokou: kippu o ichi-mai onegaishimasu', es: 'viajes: un pasaje, por favor', ex: 'コンセプシオンまでの切符。— Un pasaje a Concepción.' },
  { jp: '仕事：〜を担当しています', ro: 'shigoto: ~ o tantou shite imasu', es: 'trabajo: estoy a cargo de…', ex: '畑を担当しています。— Estoy a cargo de la huerta.' },
  { jp: '〜と思います / 私の意見では', ro: '~ to omoimasu / watashi no iken dewa', es: 'creo que / en mi opinión', ex: 'いい考えだと思います。— Creo que es buena idea.' },
  { jp: '昔＋verbo (〜ていました)', ro: 'mukashi + verbo', es: 'antes / solía…', ex: '昔ギターを弾いていました。— Antes tocaba guitarra.' },
  { jp: 'だから / なぜなら / でも', ro: 'dakara / nazenara / demo', es: 'así que / porque / pero', ex: '寒かったから家にいました。— Hacía frío, así que nos quedamos.' },
  { jp: '健康：頭が痛いです', ro: 'kenkou: atama ga itai desu', es: 'salud: me duele la cabeza', ex: '病院に行きたいです。— Quiero ir al médico.' },
  { jp: 'メール：よろしくおねがいします', ro: 'meeru: yoroshiku onegaishimasu', es: 'correo: atentamente / por favor', ex: 'よろしく、アナ。— Saludos, Ana.' }
];
var JA_B2C1 = [
  { jp: '七転び八起き', ro: 'nanakorobi yaoki', es: 'cae 7 veces, levántate 8 (proverbio)', ex: '失敗しても七転び八起き。— Aunque falles, levántate una vez más.' },
  { jp: '一期一会', ro: 'ichigo ichie', es: 'un encuentro, una vez (té zen)', ex: 'お茶のように、一期一会。— Como el té: cada encuentro es único.' },
  { jp: '雨降って地固まる', ro: 'ame futte ji katamaru', es: 'después de la lluvia, la tierra se afirma', ex: 'ケンカの後は仲直り：雨降って地固まる。— Tras pelear, más unidos.' },
  { jp: 'がんばって！/ お疲れさま', ro: 'ganbatte! / otsukaresama', es: '¡ánimo! / gracias por tu esfuerzo', ex: '試験がんばって！— ¡Ánimo con la prueba!' },
  { jp: '彼が来たとき、もう出ていました', ro: 'kare ga kita toki, mou dete imashita', es: 'ya me había ido (〜ていた)', ex: 'Para contar historias en pasado continuo-resultado.' },
  { jp: '勉強していたら、受かったのに', ro: 'benkyou shiteitara, ukatta noni', es: 'si hubiera estudiado, habría aprobado', ex: 'Arrepentimientos y lecciones con 〜ていたら〜のに.' },
  { jp: 'ボランティアに海岸を掃除してもらった', ro: 'borantia ni kaigan o souji shite moratta', es: 'pasiva de beneficio: me limpiaron la playa', ex: 'Pasiva japonesa: 〜てもらう = recibir la acción.' },
  { jp: '疲れていると言っていました', ro: 'tsukarete iru to itte imashita', es: 'dijo que estaba cansada (discurso indirecto)', ex: 'Directo → indirecto con と言っていました.' },
  { jp: '面接：私の強みは…', ro: 'mensetsu: watashi no tsuyomi wa…', es: 'entrevista: mi fortaleza es…', ex: 'チームワークが得意です。— Soy buena trabajando en equipo.' },
  { jp: 'しかし / さらに', ro: 'shikashi / sarani', es: 'sin embargo / además (ensayo)', ex: 'しかし、海は命です。— Sin embargo, el mar es vida.' }
];
var JA_KANA = [
  ['🔤 ひらがな (hiragana) — lo primero', 'あいうえお・かきくけこ・さしすせそ… 46 signos base. Todo lo japonés se puede escribir SOLO en hiragana: domínalo antes que el katakana. Escribe あ 5 veces con el dedo: el músculo recuerda.'],
  ['🔤 カタカナ (katakana) — para lo de afuera', 'アイウエオ・カキクケコ… mismo sonido, trazo recto. Para チリ (Chile)、コーヒー (café)、パン (pan). Regla: palabra extranjera o ruido (ドン！) → katakana.'],
  ['🀄 漢字 (kanji) — 100 para vivir, 2000 para leer el diario', '日 (sol-día)・本 (origen)・人 (persona)・水 (agua)・山 (montaña)・海 (mar). Empieza con los del calendario: 今日 (hoy)、明日 (mañana)、日本 (Japón). 1 kanji/día × 1 año = 365.'],
  ['🔊 Dakuten ゛y chōon ー', 'か→が・さ→ざ・た→だ・は→ば→ぱ (vocean). おばさん (tía) ≠ おばあさん (abuela): la vocal LARGA cambia todo. コーヒー sin ー es “cohi”: alarga el doble.'],
  ['⏸ Sokuon っ・ヶ — la mini-tsu que frena', 'がっこう (escuela) ≠ がこう (no existe). La っ pequeña duplica la consonante: kita → kitte (corta). En romaji se escribe doble: gakkou, kippu, motto.'],
  ['⚠️ は wa・へ e・を o — se escriben distinto de como suenan', 'わたしは (watashi WA, no “ha”)・東京へ (Toukyou E, no “he”)・水を (mizu O, no “wo”). Si lo lees literal, suenas robot. Lee la partícula, no la letra.'],
  ['📏 Orden de trazos en 1 minuto', '1) arriba → abajo · 2) izquierda → derecha · 3) horizontal antes que vertical · 4) afuera antes que adentro · 5) cierra al final: 国 se cierra con el último trazo. Con el hanzi del día: 5 veces con el dedo.'],
  ['📏 Regla de oro', 'HIRAGANA primero (2 semanas) → KATAKANA (1 semana) → KANJI de a 1/día. Tapa una columna y recita la otra. Romaji es muleta: suéltala en el día 15.']
];
var JA_BUNPOU = [
  ['🧭 は (wa) tema ≠ が (ga) sujeto', 'わたしは学生です (yo, hablando de mí, soy estudiante) · 雨が降っています (LA LLUVIA llueve: ga marca lo nuevo). Error típico: は en todo = suenas plano. Nuevo-presentación → が.'],
  ['🎯 を (o) objeto · に (ni) destino-tiempo · へ (e) dirección · で (de) lugar-medio', 'ごはんを食べる (COMO arroz) · 学校に行く (VOY a la escuela) · ペンコで泳ぐ (NADO en Penco). を→qué, に→a-en, で→con-en. Cambiar una partícula cambia la escena.'],
  ['👌 の (no) el pegamento · も (mo) también · と (to) y-con · や (ya) y-entre otros', '私の本 (MI libro) · 私も行く (YO TAMBIÉN voy) · 友達と行く (voy CON mi amiga). の encadena: 海の水 (agua DEL mar).'],
  ['⏳ Pasado 〜ました · negación 〜ません · pregunta 〜か', '食べます→食べました (comí) →食べません (no como) →食べますか？ (¿comes?). Solo cambia la cola: el verbo base BEBE nunca se toca. 1 forma bien > 10 a medias.'],
  ['🔗 Forma て (te-form): el cuchillo suizo', '食べて (comiendo/comete) + ください (por favor)・+ います (estoy comiendo)・+ もいいです (puedo comer)・+ はいけません (no debo). Si dominas TE, dominas el japonés hablado.'],
  ['🙏 です・ます (teineigo) → タメ口 (amigos)', '先生：食べますか？ Amigo：食べる？ (¿comes?). Con desconocidos y clientes SIEMPRE です・ます. El plain llega solo con anime y amigos: no lo fuerces en la feria.'],
  ['🌟 さん・さま・くん・ちゃん (nunca te llames -san)', 'アナさん (Srta. Ana, respeto) · お客様 (okyaku-SAMA, cliente-dios) · くん (compañero menor) · ちゃん (cariño-niña). Decir “わたしはアナさん” = presentarte como visita en tu propia casa.'],
  ['⚖️ SOV: sujeto-objeto-verbo SIEMPRE al final', 'わたしはお茶を飲みます (yo té bebo = yo bebo té). El verbo cierra: escucha hasta el final. Pregunta con か al final: 行きますか？ (¿vas?).']
];

function allJa() { return JA_A1.concat(JA_A2, JA_B1, JA_B2C1); }

/* ---------------- ESTADO ---------------- */
var jaTab = 'palabra';
var jaQuizQ = null;
var jaQuizLevel = 'todo';
var jaQuizMode = 'significado';
var jaShown = null;

function getJaData() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { ok: 0, total: 0, streak: 0, lastDay: '' };
    if (!u.japones) u.japones = { ok: 0, total: 0, streak: 0, lastDay: '' };
    return u.japones;
  } catch (e) { return { ok: 0, total: 0, streak: 0, lastDay: '' }; }
}
function jaDayIndex(n) {
  try {
    var d = new Date();
    var s = d.getFullYear() * 1000 + Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
    return s % n;
  } catch (e) { return 0; }
}
/* ---------------- AUDIO (TTS ja robusto) ---------------- */
var jaVoicesCache = null;
var jaSlow = false;
var jaResumeTimer = null;
var jaSpeaking = false;
var jaSpeakToken = 0;
var jaOnlineAudio = null;
function jaEnsureVoices() {
  try {
    if (!('speechSynthesis' in window)) return [];
    var vs = window.speechSynthesis.getVoices() || [];
    if (vs && vs.length) jaVoicesCache = vs;
    return vs && vs.length ? vs : (jaVoicesCache || []);
  } catch (e) { return jaVoicesCache || []; }
}
try {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    var jaWarm = function () { try { jaEnsureVoices(); } catch (e) {} };
    try { jaWarm(); } catch (e) {}
    try {
      if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = function () { try { jaEnsureVoices(); jaRefreshVoiceStatus(); } catch (e) {} };
      }
    } catch (e) {}
  }
} catch (e) {}
function jaPickVoice() {
  var vs = jaEnsureVoices();
  if (!vs || !vs.length) return null;
  var score = function (v) {
    var lang = String((v && v.lang) || '');
    var name = String((v && v.name) || '').toLowerCase();
    var l = lang.toLowerCase();
    if (/^ja[-_]jp/i.test(lang)) return 100;
    if (/^ja/i.test(l) && /kyoko|haruka|ayumi|mizuki|otoya|keita|japanese/i.test(name)) return 95;
    if (/^ja/i.test(l)) return 85;
    if (/japan/i.test(name)) return 70;
    return -1;
  };
  var best = null, bestScore = -1;
  for (var i = 0; i < vs.length; i++) {
    var s = score(vs[i]);
    if (s > bestScore) { bestScore = s; best = vs[i]; }
  }
  return bestScore >= 0 ? best : null;
}
function jaHasJaVoice() { return !!jaPickVoice(); }
function jaClearResume() {
  try { if (jaResumeTimer) { clearInterval(jaResumeTimer); jaResumeTimer = null; } } catch (e) {}
}
function jaStop() {
  try { jaSpeakToken++; } catch (e) {}
  try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
  try { if (jaOnlineAudio) { jaOnlineAudio.pause(); try { jaOnlineAudio.src = ''; } catch (x) {} jaOnlineAudio = null; } } catch (e) {}
  jaClearResume();
  jaSpeaking = false;
  try { jaPaintSpeakState(); } catch (e) {}
}
function jaVoiceStatus() {
  try {
    if (!('speechSynthesis' in window)) return { ok: false, msg: 'Este dispositivo no tiene voz disponible (speechSynthesis ausente).' };
    var v = jaPickVoice();
    if (v) return { ok: true, msg: '🔊 Voz: ' + (v.name || 'japonesa') + ' (' + (v.lang || 'ja-JP') + ')' };
    return { ok: false, msg: '⚠️ Sin voz japonesa instalada: se intentará igual, pero puede sonar con acento raro o quedar en silencio.' };
  } catch (e) { return { ok: false, msg: '' }; }
}
function jaCountVoices() {
  try {
    var vs = jaEnsureVoices();
    var n = vs ? vs.length : 0, jc = 0;
    for (var i = 0; i < (vs || []).length; i++) {
      var l = String((vs[i] && vs[i].lang) || '').toLowerCase();
      var nm = String((vs[i] && vs[i].name) || '').toLowerCase();
      if (/^ja/.test(l) || /japan/.test(nm)) jc++;
    }
    return { total: n, ja: jc };
  } catch (e) { return { total: 0, ja: 0 }; }
}
function jaRefreshVoiceStatus() {
  var el = $('jaVoiceStatus');
  if (!el) return;
  var st = jaVoiceStatus();
  var c = jaCountVoices();
  var info = ' <span class="muted">(' + c.ja + ' japonesa(s) de ' + c.total + ' voces)</span>';
  el.innerHTML = esc(st.msg) + info +
    ' <button type="button" id="jaVoiceTest" class="btn su-337714">🔊 Probar voz</button>' +
    ' <button type="button" id="jaOnlineTest" class="btn su-337714" title="Usa internet si tu equipo no tiene voz japonesa">🌐 Oír online</button>' +
    (st.ok ? '' : '<br><span class="muted">Sin voz japonesa el audio local puede quedar mudo: usa 🌐 Oír online (requiere internet) o instala voz japonesa: <b>Windows:</b> Configuración → Hora e idioma → Voz → Agregar voz (Japonés). <b>Android:</b> Ajustes → Idioma → Salida TTS → instalar japonés. <b>iPhone:</b> Ajustes → Accesibilidad → Voces → Japonés. Luego recarga.</span>');
  try {
    var bt = $('jaVoiceTest');
    if (bt) bt.onclick = function (e) { try { e.preventDefault(); } catch (x) {} jaSpeak('こんにちは', { forceLocal: true }); };
    var on = $('jaOnlineTest');
    if (on) on.onclick = function (e) { try { e.preventDefault(); } catch (x) {} jaSpeakOnline(jaShown ? jaShown.jp : 'こんにちは'); };
  } catch (e) {}
}
function jaSpeakOnline(txt) {
  var text = String(txt == null ? '' : txt).trim();
  if (!text) return;
  try { jaStop(); } catch (e) {}
  try {
    var url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=' + encodeURIComponent(text);
    var a = new Audio(url);
    jaOnlineAudio = a;
    jaSpeaking = true;
    try { jaPaintSpeakState(); } catch (e) {}
    a.onended = function () { jaSpeaking = false; jaOnlineAudio = null; try { jaPaintSpeakState(); } catch (x) {} };
    a.onerror = function () {
      jaSpeaking = false; jaOnlineAudio = null;
      try { jaPaintSpeakState(); } catch (x) {}
      alert('No se pudo reproducir el audio online. Revisa tu conexión o instala una voz japonesa en el dispositivo.');
    };
    var p = a.play();
    if (p && p.catch) p.catch(function () {
      jaSpeaking = false; jaOnlineAudio = null;
      try { jaPaintSpeakState(); } catch (x) {}
    });
  } catch (e) { alert('No se pudo reproducir el audio online.'); }
}
function jaPaintSpeakState() {
  try {
    var btns = document.querySelectorAll('#japonesDialog .ja-speaking');
    for (var i = 0; i < btns.length; i++) {
      if (jaSpeaking) btns[i].classList.add('btn-accent');
      else btns[i].classList.remove('btn-accent');
    }
  } catch (e) {}
}
function jaSpeak(txt, opts) {
  opts = opts || {};
  var text = String(txt == null ? '' : txt).trim();
  if (!text) return;
  if (opts.forceOnline) { jaSpeakOnline(text); return; }
  try {
    if (!('speechSynthesis' in window)) { jaSpeakOnline(text); return; }
    if (!opts.forceLocal && !jaHasJaVoice()) { jaSpeakOnline(text); return; }
    var my = ++jaSpeakToken;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    try { if (jaOnlineAudio) { jaOnlineAudio.pause(); jaOnlineAudio = null; } } catch (e) {}
    jaClearResume();
    jaSpeaking = false;
    try { jaPaintSpeakState(); } catch (e) {}
    setTimeout(function () {
      if (my !== jaSpeakToken) return;
      try {
        try { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); } catch (x) {}
        var u = new SpeechSynthesisUtterance(text);
        var voice = jaPickVoice();
        if (voice) { try { u.voice = voice; } catch (e) {} }
        u.lang = (voice && voice.lang) ? voice.lang : 'ja-JP';
        var slow = (opts.slow != null) ? !!opts.slow : jaSlow;
        u.rate = slow ? 0.55 : 0.85;
        u.pitch = 1;
        u.volume = 1;
        jaSpeaking = true;
        try { jaPaintSpeakState(); } catch (e) {}
        var fellBack = false;
        u.onend = function () { jaSpeaking = false; jaClearResume(); try { jaPaintSpeakState(); } catch (e) {} if (typeof opts.onend === 'function') { try { opts.onend(); } catch (x) {} } };
        u.onerror = function (ev) {
          jaSpeaking = false; jaClearResume();
          try { jaPaintSpeakState(); } catch (e) {}
          try { jaRefreshVoiceStatus(); } catch (e) {}
          if (!fellBack && !opts.forceLocal && !jaHasJaVoice()) {
            fellBack = true;
            jaSpeakOnline(text);
            return;
          }
          if (typeof opts.onerror === 'function') { try { opts.onerror(ev); } catch (x) {} }
        };
        window.speechSynthesis.speak(u);
        try {
          jaClearResume();
          jaResumeTimer = setInterval(function () {
            try {
              if (window.speechSynthesis && window.speechSynthesis.speaking) {
                window.speechSynthesis.resume();
              } else { jaClearResume(); }
            } catch (e) { jaClearResume(); }
          }, 8000);
        } catch (e) {}
        try { jaRefreshVoiceStatus(); } catch (e) {}
      } catch (e) {}
    }, 120);
  } catch (e) {}
}
function jaSpeakExample(ex) {
  var t = String(ex || '');
  var cut = t.split('—')[0].trim().replace(/[.…。!！?？]+.*$/, '').trim();
  if (!cut) cut = t;
  var m = cut.match(/[぀-ヿ一-鿿々〆。、！？・…]+/g);
  if (m && m.join(' ').length >= 2) cut = m.join(' ');
  jaSpeak(cut);
}
function jaQuizPool() {
  if (jaQuizLevel === 'a1') return JA_A1;
  if (jaQuizLevel === 'a2') return JA_A2;
  if (jaQuizLevel === 'b1') return JA_B1;
  if (jaQuizLevel === 'avanzado') return JA_B2C1;
  return allJa();
}

function renderJaStreak() {
  var b = $('jaStreakBox'); if (!b) return;
  var d = getJaData();
  var pct = d.total ? Math.round(d.ok / d.total * 100) : 0;
  b.innerHTML = '<b>🗾 Tu japonés:</b> ' + d.ok + '/' + d.total + ' correctas (' + pct + '%) · racha ' + d.streak + ' 🔥 ' +
    '<span class="muted su-11a508">— 1 palabra por día · N5→N1 + cultura · todo guardado local y privado.</span>';
}
function jaCard(item, lv) {
  return '<button type="button" class="btn eng-word su-6cd6a1" data-w="' + esc(item.jp) + '"><b>🔊 ' + esc(item.jp) + '</b> ' +
    '<span class="chip su-0d5be0">' + esc(lv) + '</span><br><span class="su-2f290d">' + esc(item.ro) + ' · ' + esc(item.es) + '</span><br>' +
    '<span class="muted su-11a508">“' + esc(item.ex) + '”</span></button>';
}

function renderJaPanel(tab) {
  try { jaStop(); } catch (e) {}
  jaTab = tab || jaTab;
  var ids = { palabra: 'tabJA1', a1: 'tabJA2', a2: 'tabJA3', b1: 'tabJA4', cultura: 'tabJA5', quiz: 'tabJA6' };
  Object.keys(ids).forEach(function (k) { var el = $(ids[k]); if (el) el.classList.toggle('btn-accent', k === jaTab); });
  renderJaStreak();
  var box = $('jaPanel'); if (!box) return;
  var html = '';
  if (jaTab === 'palabra') {
    var all = allJa();
    var dayIdx = jaDayIndex(all.length);
    if (!jaShown || jaShown._day !== dayIdx || !jaShown._rand) {
      var base = all[dayIdx];
      jaShown = { jp: base.jp, ro: base.ro, es: base.es, ex: base.ex, _day: dayIdx };
    }
    var w = jaShown;
    var rel = [all[(dayIdx + 7) % all.length], all[(dayIdx + 13) % all.length]];
    var fecha = '';
    try { fecha = cal.fmtDate.format(new Date()); } catch (e) { try { fecha = new Date().toLocaleDateString(); } catch (e2) { fecha = ''; } }
    html += '<div class="menstrual-card su-3fa1a8">' +
      '<p class="muted su-11a508">☀️ 今日のことば PALABRA DEL DÍA · ' + esc(fecha) + ' · ' + all.length + ' palabras y frases</p>' +
      '<div class="su-6adb68">' + esc(w.jp) + '</div>' +
      '<div class="su-cd8bd8"><b>' + esc(w.ro) + '</b> · ' + esc(w.es) + '</div>' +
      '<p class="muted su-2b0979">“' + esc(w.ex) + '”</p>' +
      '<div class="su-9bc2df"><button type="button" id="jaSpeakBtn" class="btn btn-accent su-30e741 ja-speaking">🔊 Escuchar (日本語)</button> ' +
      '<button type="button" id="jaOnlineBtn" class="btn su-30e741" title="Audio por internet (funciona aunque tu equipo no tenga voz japonesa)">🌐 Online</button> ' +
      '<button type="button" id="jaSlowBtn" class="btn su-30e741">🐢 Lento: ' + (jaSlow ? 'ON' : 'OFF') + '</button> ' +
      '<button type="button" id="jaExBtn" class="btn su-30e741">🗣️ Oír ejemplo</button> ' +
      '<button type="button" id="jaStopBtn" class="btn su-30e741">⏹ Detener</button> ' +
      '<button type="button" id="jaNextBtn" class="btn su-30e741">🎲 Otra palabra</button></div>' +
      '<p id="jaVoiceStatus" class="muted su-11a508"></p></div>' +
      '<div class="help-grid su-d2c171">' +
      rel.map(function (r) { return '<div class="help-card"><h4>' + esc(r.jp) + ' <span class="muted">' + esc(r.ro) + '</span></h4><p class="su-11a508">' + esc(r.es) + '<br><span class="muted">“' + esc(r.ex) + '”</span></p></div>'; }).join('') + '</div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>🗣️ ¿Cómo practicar?</h4><p class="su-b439ab">1) <b>Escucha</b> con 🔊 y repite 3 veces en voz alta.<br>2) <b>Escribe</b> 1 frase con la palabra en las Notas del día.<br>3) <b>Úsala hoy</b>: 1 palabra/día → ~365/año.<br>Pasa a N4 cuando sepas 20 sin mirar.</p></div>' +
      '<div class="help-card"><h4>📚 Niveles (JLPT)</h4><p class="su-b439ab">🌱 <b>N5:</b> sobrevivir (こんにちは、水、家).<br>🌿 <b>N4:</b> vida diaria (pasado 〜ました、compras, direcciones).<br>💬 <b>N3:</b> viaje + trabajo + opinión + forma て.<br>📜 <b>N2–N1:</b> kotowaza, keigo, pasiva, entrevista + cultura.</p></div></div>';
  } else if (jaTab === 'a1') {
    html += '<div class="menstrual-card su-5a6934"><h4 class="su-752b1a">🌱 N5 Supervivencia — sobrevive en japonés</h4>' +
      '<p class="muted su-a6c665">Meta: presentarte, pedir agua/comida, contar 1–10. Gramática: <b>です (ser cortés), 〜があります/います (hay-tener), números + contadores, は/が/を/に básicos</b>. No hay plural ni género: contexto manda. Toca 🔊 en cada tarjeta para oír (ja-JP).</p>' +
      '<div class="su-5e3875">' + JA_A1.map(function (x) { return jaCard(x, 'N5'); }).join('') + '</div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>⚙️ です + ます (el 50% del día)</h4><p class="su-583677"><b>わたしは</b>学生です (yo soy estudiante)<br><b>あなたは</b>親切です (tú eres amable)<br><b>食べます</b> (como) · <b>食べました</b> (comí) · <b>食べません</b> (no como)<br><span class="muted">Negación: <b>〜ません</b>. Pregunta: <b>〜ますか？</b> alzando la voz.</span></p></div>' +
      '<div class="help-card"><h4>🎭 Mini-diálogo: en la feria</h4><p class="su-583677">— <b>こんにちは！これはいくらですか？</b> (¡Hola! ¿Cuánto cuesta?)<br>— <b>五千ペソです。</b> (Cinco mil pesos.)<br>— <b>ありがとう！また明日！</b> (¡Gracias! ¡Nos vemos!)<br><span class="muted">Practica: una persona por línea. En Japón cambia “pesos” por “円” (en).</span></p></div></div>';
  } else if (jaTab === 'a2') {
    html += '<div class="menstrual-card su-018729"><h4 class="su-721a46">🌿 N4 Vida diaria — el día a día</h4>' +
      '<p class="muted su-a6c665">Meta: contar qué hiciste, planes, compras y direcciones. Gramática: <b>pasado 〜ました, 〜するつもり (planes), より/いちばん (comparar), 〜なければ (tener que), 〜てもらえますか (pedir favor)</b>.</p>' +
      '<div class="su-5e3875">' + JA_A2.map(function (x) { return jaCard(x, 'N4'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>🎭 Mini-diálogo: pidiendo dirección en Penco</h4><p class="su-583677">— <b>すみません、海はどこですか？</b> (Disculpa, ¿dónde queda la playa?)<br>— <b>まっすぐ行って、広場で左に曲がってください。</b> (Sigue recto y gira a la izquierda en la plaza.)<br>— <b>ありがとうございます！</b> — <b>どういたしまして！</b> (¡Gracias! / ¡De nada!)<br><span class="muted">Clave: どこ (dónde) + 右/左 (derecha/izquierda).</span></p></div>';
  } else if (jaTab === 'b1') {
    html += '<div class="menstrual-card su-d4d722"><h4 class="su-7c91e2">💬 N3 Intermedio — viajar, trabajar y opinar</h4>' +
      '<p class="muted su-a6c665">Meta: viajar, trabajar y opinar. Gramática estrella: <b>〜たら (si… entonces…)</b> + 住んでいます (vivir desde hace) + 昔 (antes) + だから/でも (conectores) + forma て.</p>' +
      '<div class="su-5e3875">' + JA_B1.map(function (x) { return jaCard(x, 'N3'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>🎭 Mini-diálogo: viaje a Concepción</h4><p class="su-583677">— <b>コンセプシオンまでの切符を一枚おねがいします。</b> (Un pasaje a Concepción, por favor.)<br>— <b>片道ですか、往復ですか？</b> (¿Solo ida o ida y vuelta?) — <b>往復でおねがいします。</b><br>— <b>ここにいつから住んでいますか？</b> — <b>五年です。</b> (¿Hace cuánto vives aquí? Cinco años.)<br><span class="muted">Practica con horarios, precios y “verbos que terminan siempre en ます”.</span></p></div>';
  } else if (jaTab === 'cultura') {
    html += '<div class="menstrual-card su-5b7cd0"><h4 class="su-399074">📜 N2–N1 Avanzado + Cultura viva</h4>' +
      '<p class="muted su-a6c665">Meta: entrevistas, kotowaza y no pasar vergüenza con は/が/を. Gramática: <b>〜ていた (ya…), 〜たら〜のに (condicional pasado), pasiva de beneficio 〜てもらう, indirecto と言っていました, conectores しかし/さらに</b>.</p>' +
      '<div class="su-5e3875">' + JA_B2C1.map(function (x) { return jaCard(x, 'N2–N1'); }).join('') + '</div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>⚠️ 8 llaves que salvan vidas</h4><p class="su-583677">' + JA_KANA.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div>' +
      '<div class="help-card"><h4>🧭 Partículas ↔ keigo ¿Qué uso?</h4><p class="su-583677">' + JA_BUNPOU.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>🍵 Cultura para probar y celebrar</h4><p class="su-b439ab"><b>Probar:</b> té verde (お茶)、onigiri (おにぎり)、miso (味噌): lee la receta en japonés y cocina.<br><b>Escuchar:</b> さくらさくら, canciones infantiles どんぐりころころ: 1 canción × 7 días.<br><b>Celebrar:</b> お正月 (Año Nuevo, enero, como el We Tripantu) y お花見 (hanami, ver cerezos en primavera).<br><span class="muted">Haiku (俳句), el té (茶道) y el respeto (おもてなし): el calendario también es ritual. Inclínate 🙇 al saludar: abre cualquier puerta.</span></p></div>' +
      '<div class="help-card"><h4>🎎 Contadores que sí se usan</h4><p class="su-b439ab"><b>〜つ</b> cosas: ひとつ、ふたつ、みっつ (1, 2, 3 cosas)<br><b>〜人</b> personas: 一人、二人 (hitori, futari = 1-2 irregulares)<br><b>〜枚</b> planos: 切符を一枚 (un pasaje)<br><b>〜本</b> largos: ビールを三本 (tres botellas)<br><span class="muted">Pide “una cosa” con ひとつ： en la feria te entienden siempre.</span></p></div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>💼 Kit entrevista de trabajo</h4><p class="su-583677">— <b>自己紹介をおねがいします。</b> (Preséntese, por favor.)<br>— <b>責任感があって、チームワークが得意です。</b> (Soy responsable y trabajo bien en equipo.)<br>— <b>私の強みは…目標は…</b> (Mi fortaleza es… mi meta es…)<br><span class="muted">Cierra: “お時間をありがとうございます。” (Gracias por su tiempo.)</span></p></div>';
  } else if (jaTab === 'quiz') {
    var d = getJaData();
    if (!jaQuizQ) {
      var pool = jaQuizPool();
      var wq = pool[Math.floor(Math.random() * pool.length)];
      var opts = {};
      opts[jaQuizMode === 'romaji' ? wq.ro : wq.es] = 1;
      var guard = 0;
      while (Object.keys(opts).length < 4 && guard < 60) { guard++; var c = pool[Math.floor(Math.random() * pool.length)]; opts[jaQuizMode === 'romaji' ? c.ro : c.es] = 1; }
      var arr = Object.keys(opts).sort(function () { return Math.random() - 0.5; });
      jaQuizQ = { w: wq, opts: arr };
    }
    var q = jaQuizQ;
    var lvBtn = function (v, l) { return '<button type="button" class="btn ja-lv' + (jaQuizLevel === v ? ' btn-accent' : '') + ' su-337714" data-lv="' + v + '">' + l + '</button>'; };
    var mdBtn = function (v, l) { return '<button type="button" class="btn ja-md' + (jaQuizMode === v ? ' btn-accent' : '') + ' su-337714" data-md="' + v + '">' + l + '</button>'; };
    html += '<div class="menstrual-card su-1f2df9"><h4 class="su-399074">🧩 Quiz por niveles</h4>' +
      '<div class="su-a8712a">' + lvBtn('todo', '🌎 Todo') + lvBtn('a1', '🌱 N5') + lvBtn('a2', '🌿 N4') + lvBtn('b1', '💬 N3') + lvBtn('avanzado', '📜 N2–N1') + '</div>' +
      '<div class="su-a8712a">' + mdBtn('significado', '🇪🇸 Significado') + mdBtn('romaji', '🔤 Romaji') + '</div>' +
      '<div class="su-73ce29">“' + esc(q.w.jp) + '” <span class="muted su-11a508">' + (jaQuizMode === 'romaji' ? '¿cómo se lee?' : '¿qué significa?') + '</span></div>' +
      '<button type="button" id="jaQuizSpeak" class="btn su-337714 ja-speaking">🔊 Escuchar</button> ' +
      '<button type="button" id="jaQuizOnline" class="btn su-337714" title="Audio por internet">🌐</button> ' +
      '<button type="button" id="jaQuizSlow" class="btn su-337714">🐢 Lento: ' + (jaSlow ? 'ON' : 'OFF') + '</button> ' +
      '<button type="button" id="jaQuizStop" class="btn su-337714">⏹</button>' +
      '<p id="jaVoiceStatus" class="muted su-11a508"></p>' +
      '<div class="su-ae0e71">' + q.opts.map(function (o) { return '<button type="button" class="btn ja-opt su-046678" data-o="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div>' +
      '<div id="jaQuizFb" class="su-ac1122"></div>' +
      '<p class="muted su-e13d76">Correctas ' + d.ok + '/' + d.total + ' · racha ' + d.streak + ' · nivel: <b>' + esc(jaQuizLevel) + '</b> · modo: <b>' + esc(jaQuizMode) + '</b> · banco: ' + jaQuizPool().length + ' palabras/frases</p></div>';
  }
  box.innerHTML = html + '<p class="muted su-a953a7">🔊 Toca cualquier tarjeta para oír en japonés (voz japonesa del dispositivo). El quiz suma a tu racha local y privada.</p>';
  try { jaEnsureVoices(); jaRefreshVoiceStatus(); } catch (e) {}
  try { jaPaintSpeakState(); } catch (e) {}
  var sp = $('jaSpeakBtn');
  if (sp) sp.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (jaShown) jaSpeak(jaShown.jp); };
  var onB = $('jaOnlineBtn');
  if (onB) onB.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (jaShown) jaSpeakOnline(jaShown.jp); };
  var sl = $('jaSlowBtn');
  if (sl) sl.onclick = function (e) { try { e.preventDefault(); } catch (x) {} jaSlow = !jaSlow; sl.textContent = '🐢 Lento: ' + (jaSlow ? 'ON' : 'OFF'); if (jaShown) jaSpeak(jaShown.jp); };
  var exB = $('jaExBtn');
  if (exB) exB.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (jaShown) jaSpeakExample(jaShown.ex); };
  var stB = $('jaStopBtn');
  if (stB) stB.onclick = function (e) { try { e.preventDefault(); } catch (x) {} jaStop(); };
  var nx = $('jaNextBtn');
  if (nx) nx.onclick = function () {
    try {
      var a = allJa();
      var di = jaDayIndex(a.length);
      var pick = a[Math.floor(Math.random() * a.length)];
      var gd = 0;
      while (jaShown && pick.jp === jaShown.jp && gd < 25) { gd++; pick = a[Math.floor(Math.random() * a.length)]; }
      jaShown = { jp: pick.jp, ro: pick.ro, es: pick.es, ex: pick.ex, _day: di, _rand: 1 };
      jaStop();
      renderJaPanel('palabra');
      if (jaShown) jaSpeak(jaShown.jp);
    } catch (e) { try { renderJaPanel('palabra'); } catch (x) {} }
  };
  var qs = $('jaQuizSpeak');
  if (qs) qs.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (jaQuizQ) jaSpeak(jaQuizQ.w.jp); };
  var qo = $('jaQuizOnline');
  if (qo) qo.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (jaQuizQ) jaSpeakOnline(jaQuizQ.w.jp); };
  var qsl = $('jaQuizSlow');
  if (qsl) qsl.onclick = function (e) { try { e.preventDefault(); } catch (x) {} jaSlow = !jaSlow; qsl.textContent = '🐢 Lento: ' + (jaSlow ? 'ON' : 'OFF'); if (jaQuizQ) jaSpeak(jaQuizQ.w.jp); };
  var qst = $('jaQuizStop');
  if (qst) qst.onclick = function (e) { try { e.preventDefault(); } catch (x) {} jaStop(); };
  box.querySelectorAll('.eng-word').forEach(function (b) {
    b.onclick = function (e) { try { e.preventDefault(); } catch (x) {} jaSpeak(b.getAttribute('data-w')); };
  });
  box.querySelectorAll('.ja-lv').forEach(function (b) {
    b.onclick = function () { jaQuizLevel = b.getAttribute('data-lv'); jaQuizQ = null; renderJaPanel('quiz'); };
  });
  box.querySelectorAll('.ja-md').forEach(function (b) {
    b.onclick = function () { jaQuizMode = b.getAttribute('data-md'); jaQuizQ = null; renderJaPanel('quiz'); };
  });
  box.querySelectorAll('.ja-opt').forEach(function (b) {
    b.onclick = function () {
      var d2 = getJaData();
      var good = jaQuizMode === 'romaji' ? jaQuizQ.w.ro : jaQuizQ.w.es;
      var ok = b.getAttribute('data-o') === good;
      d2.total = (d2.total || 0) + 1;
      if (ok) { d2.ok = (d2.ok || 0) + 1; d2.streak = (d2.streak || 0) + 1; }
      else { d2.streak = 0; }
      try { if (typeof scheduleSave === 'function') scheduleSave('Guardado ✓'); } catch (e) {}
      var fb = $('jaQuizFb');
      if (fb) fb.innerHTML = ok ? '✅ ¡Muy bien! <b>' + esc(jaQuizQ.w.jp) + '</b> ' + esc(jaQuizQ.w.ro) + ' — “' + esc(jaQuizQ.w.ex) + '”'
        : '❌ Era <b>' + esc(good) + '</b> — ' + esc(jaQuizQ.w.jp) + ' ' + esc(jaQuizQ.w.ro) + ' “' + esc(jaQuizQ.w.ex) + '”';
      box.querySelectorAll('.ja-opt').forEach(function (x) {
        x.disabled = true;
        if (x.getAttribute('data-o') === good) x.classList.add('btn-accent');
      });
      renderJaStreak();
      setTimeout(function () { jaQuizQ = null; if (jaTab === 'quiz') renderJaPanel('quiz'); }, ok ? 1400 : 2400);
    };
  });
}

/* ---------------- DIÁLOGO ---------------- */
function buildDialog() {
  if ($('japonesDialog')) return;
  var d = document.createElement('dialog');
  d.id = 'japonesDialog';
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053"><h3 class="su-ee0cfe">🗾 Japonés — N5 → N1 + cultura</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Aprende <b>japonés (日本語, hiragana + katakana + kanji + romaji) por niveles JLPT + cultura viva</b>, como el Kimün, el Inglés, el Portugués, el Chino y el Hindi: 1 palabra por día + kana + quiz. Toca 🔊 para oír (voz del dispositivo, ja-JP). Todo queda <b>local y privado</b> por usuario.</p>' +
    '<div id="jaStreakBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="timer-tabs su-f7ad78">' +
    '<button type="button" id="tabJA1" class="btn btn-accent su-30e741">☀️ Palabra del día</button>' +
    '<button type="button" id="tabJA2" class="btn su-30e741">🌱 N5</button>' +
    '<button type="button" id="tabJA3" class="btn su-30e741">🌿 N4</button>' +
    '<button type="button" id="tabJA4" class="btn su-30e741">💬 N3</button>' +
    '<button type="button" id="tabJA5" class="btn su-30e741">📜 N2–N1 + Cultura</button>' +
    '<button type="button" id="tabJA6" class="btn su-30e741">🧩 Quiz</button></div>' +
    '<div id="jaPanel"></div>' +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { jaStop(); } catch (e) {} try { d.close(); } catch (e2) {} }; });
  try {
    d.addEventListener('close', function () { try { jaStop(); } catch (e) {} });
    d.addEventListener('cancel', function () { try { jaStop(); } catch (e) {} });
  } catch (e) {}
}

function bindTabs() {
  var map = { tabJA1: 'palabra', tabJA2: 'a1', tabJA3: 'a2', tabJA4: 'b1', tabJA5: 'cultura', tabJA6: 'quiz' };
  Object.keys(map).forEach(function (id) {
    var el = $(id);
    if (el) el.onclick = function () {
      try { jaStop(); } catch (e) {}
      if (map[id] !== 'quiz') jaQuizQ = null;
      if (map[id] === 'palabra') jaShown = null;
      renderJaPanel(map[id]);
    };
  });
}

/* ---------------- SETUP ---------------- */
function ensureButton() {
  try {
    var existing = $('btnJapones');
    if (existing) { try { existing.setAttribute('data-sub', 'idiomas'); } catch (e) {} return existing; }
    var g = document.querySelector('.action-group[data-group="aprender"] .group-btns');
    if (!g) return null;
    var btn = document.createElement('button');
    btn.id = 'btnJapones'; btn.className = 'btn'; btn.type = 'button';
    btn.textContent = '🗾 Japonés';
    try { btn.setAttribute('data-sub', 'idiomas'); } catch (e2) {}
    btn.setAttribute('data-keywords', 'japones nihongo hiragana katakana kanji romaji tokio japon jlpt n5 n4 n3 n2 n1 anime manga sushi haiku samurai keigo particulas wa ga wo ni de cultura idioma niveles basico intermedio avanzado quiz vocabulario gramatica kotowaza');
    var ref = g.querySelector('#btnRuso');
    if (ref && ref.parentNode === g) g.insertBefore(btn, ref.nextSibling);
    else g.appendChild(btn);
    return btn;
  } catch (e) { return null; }
}

function registerGlobals() {
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnJapones') < 0) {
      var i = ALL_BTNS.indexOf('btnRuso');
      if (i >= 0) ALL_BTNS.splice(i + 1, 0, 'btnJapones');
      else ALL_BTNS.push('btnJapones');
    }
  } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnJapones = ['aprender', 'idiomas']; } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['aprender|idiomas'] && BTN_ORDER['aprender|idiomas'].indexOf('btnJapones') < 0) {
      BTN_ORDER['aprender|idiomas'].push('btnJapones');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p] && (p === 'todo' || p === 'adulto' || p === 'estudiante' || p === 'docente' || p === 'adolescente')) PRESETS[p].btnJapones = true;
      });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnJapones"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Aprender') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnJapones"> 🗾 Japonés';
          var ref2 = gr.querySelector('input[data-btn="btnRuso"]');
          if (ref2 && ref2.closest && ref2.closest('label') && ref2.closest('label').parentNode) {
            ref2.closest('label').parentNode.insertBefore(lab, ref2.closest('label').nextSibling);
          } else { gr.appendChild(lab); }
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnJapones !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnJapones = lab.querySelector('input').checked;
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
  renderJaPanel('palabra');
  var b = $('btnJapones');
  if (!b) { if ((setup._r = (setup._r || 0) + 1) < 60) setTimeout(setup, 500); return; }
  if (!b.dataset.jau) {
    b.dataset.jau = '1';
    b.addEventListener('click', function () {
      jaQuizQ = null;
      jaShown = null;
      try { jaEnsureVoices(); } catch (e) {}
      renderJaPanel('palabra');
      openDlg('japonesDialog');
    });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 500); });
else setTimeout(setup, 500);

})();
