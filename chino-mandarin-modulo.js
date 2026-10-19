/* ============================================================
   CHINO MANDARÍN · HSK 1 → HSK 5 + CULTURA — Calendario 13 Lunas
   Sección completa dentro de Aprender > Idiomas y cultura:
   - Botón btnChino (grupo aprender, sub idiomas, junto a
     Kimün Mapuzugun, Inglés y Portugués)
   - Diálogo chinoDialog con 7 pestañas:
     1) ☀️ Palabra del día (hanzi rotativo + pinyin + tono + TTS zh-CN)
     2) 🌱 A1 Supervivencia (20 tarjetas + tonos + números + mini-diálogo)
     3) 🌿 A2 Vida diaria (14 tarjetas + pasado con le/guo + direcciones)
     4) 💬 B1 Viajar, trabajar y opinar (10 + 把/被 + futuro 要/会)
     5) 📜 B2–C1 + Cultura (chengyu, tonos que cambian todo, 简↔繁,
        orden de trazos, té, Año Nuevo, Confucio y Tao)
     6) 💬 Frases famosas (portada del día + tarjetas con audio y copiar)
     7) 🧩 Quiz por niveles + quiz de tonos + racha local
   - Todo local y privado por usuario:
     userData().chino = { ok, total, streak, lastDay }
   - 100% offline. TTS usa la voz del dispositivo (speechSynthesis
     con lang zh-CN), igual que Inglés y Portugués.
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
/* hz: hanzi (simplificado) · py: pinyin con tono · es: español · ex: ejemplo */
var ZH_A1 = [
  { hz: '你好', py: 'nǐ hǎo', es: 'hola', ex: '你好吗？— ¿Cómo estás?' },
  { hz: '谢谢', py: 'xièxie', es: 'gracias', ex: '谢谢你。— Gracias.' },
  { hz: '请', py: 'qǐng', es: 'por favor / invitar', ex: '请坐。— Siéntate, por favor.' },
  { hz: '早上好', py: 'zǎoshang hǎo', es: 'buenos días', ex: '早上好，同学们。— Buenos días, clase.' },
  { hz: '晚安', py: 'wǎn ān', es: 'buenas noches', ex: '晚安，明天见。— Buenas noches, nos vemos mañana.' },
  { hz: '我叫…', py: 'wǒ jiào…', es: 'me llamo…', ex: '我叫安娜。— Me llamo Ana.' },
  { hz: '我是智利人', py: 'wǒ shì Zhìlì rén', es: 'soy chilena/o', ex: '我是彭科人。— Soy de Penco.' },
  { hz: '你会说西班牙语吗？', py: 'nǐ huì shuō Xībānyá yǔ ma?', es: '¿hablas español?', ex: '我说一点中文。— Hablo un poco de chino.' },
  { hz: '水', py: 'shuǐ', es: 'agua', ex: '一杯水，谢谢。— Un vaso de agua, gracias.' },
  { hz: '饭 / 面包', py: 'fàn / miànbāo', es: 'comida cocida / pan', ex: '米饭和鱼。— Arroz y pescado.' },
  { hz: '家', py: 'jiā', es: 'casa / familia', ex: '我的家在海边。— Mi casa está junto al mar.' },
  { hz: '今天', py: 'jīntiān', es: 'hoy', ex: '今天很好。— Hoy es un buen día.' },
  { hz: '是 / 不是', py: 'shì / bú shì', es: 'ser / no ser', ex: '我是学生。— Soy estudiante.' },
  { hz: '有 / 没有', py: 'yǒu / méi yǒu', es: 'tener / no tener', ex: '我有两个姐妹。— Tengo dos hermanas.' },
  { hz: '数字 1–10', py: 'yī èr sān sì wǔ liù qī bā jiǔ shí', es: 'números 1–10', ex: '一，二，三…十。— Uno, dos, tres… diez.' },
  { hz: '红色，蓝色，绿色', py: 'hóngsè, lánsè, lǜsè', es: 'rojo, azul, verde', ex: '大海是蓝色的。— El mar es azul.' },
  { hz: '妈妈，爸爸', py: 'māma, bàba', es: 'mamá, papá', ex: '我妈妈做饭很好吃。— Mi mamá cocina rico.' },
  { hz: '我喜欢…', py: 'wǒ xǐhuan…', es: 'me gusta…', ex: '我喜欢大海。— Me gusta el mar.' },
  { hz: '我需要…', py: 'wǒ xūyào…', es: 'necesito…', ex: '我需要帮助。— Necesito ayuda.' },
  { hz: '明天见', py: 'míngtiān jiàn', es: 'nos vemos mañana', ex: '再见！明天见。— ¡Chao! Nos vemos mañana.' }
];
var ZH_A2 = [
  { hz: '你昨天做了什么？', py: 'nǐ zuótiān zuò le shénme?', es: '¿qué hiciste ayer?', ex: '我在菜园工作了。— Trabajé en la huerta.' },
  { hz: '我要… (futuro próximo)', py: 'wǒ yào…', es: 'voy a… / quiero…', ex: '我要做饭。— Voy a cocinar.' },
  { hz: '比 / 最', py: 'bǐ / zuì', es: 'más que / el más', ex: '大海比河大。— El mar es más grande que el río.' },
  { hz: '多少钱？/ 几个？', py: 'duōshao qián? / jǐ ge?', es: '¿cuánto cuesta? / ¿cuántos?', ex: '这个多少钱？— ¿Cuánto cuesta esto?' },
  { hz: '我得工作', py: 'wǒ děi gōngzuò', es: 'tengo que trabajar', ex: '我现在得走了。— Me tengo que ir ahora.' },
  { hz: '你能帮我吗？', py: 'nǐ néng bāng wǒ ma?', es: '¿puedes ayudarme?', ex: '请说慢一点。— Habla más despacio, por favor.' },
  { hz: '有 (hay)', py: 'yǒu', es: 'hay', ex: '这儿有一个市场。— Aquí hay un mercado.' },
  { hz: '下雨 / 出太阳', py: 'xià yǔ / chū tàiyang', es: 'llueve / hay sol', ex: '彭科今天下雨。— Hoy llueve en Penco.' },
  { hz: '去了，吃了，看了', py: 'qù le, chī le, kàn le', es: 'fui, comí, vi (pasado con 了)', ex: '我们去了海滩。— Fuimos a la playa.' },
  { hz: '买东西：太贵了', py: 'mǎi dōngxi: tài guì le', es: 'comprar: ¡qué caro!', ex: '五千比索。— Cinco mil pesos.' },
  { hz: '左转 / 右转', py: 'zuǒ zhuǎn / yòu zhuǎn', es: 'gira a la izquierda / derecha', ex: '在广场左转。— Gira a la izquierda en la plaza.' },
  { hz: '高兴，累，生病', py: 'gāoxìng, lèi, shēngbìng', es: 'feliz, cansado/a, enfermo/a', ex: '我今天很累。— Hoy estoy cansada.' },
  { hz: '做饭 / 打扫 / 洗', py: 'zuò fàn / dǎsǎo / xǐ', es: 'cocinar / limpiar / lavar', ex: '我每天做饭。— Cocino todos los días.' },
  { hz: '下午三点见', py: 'xiàwǔ sān diǎn jiàn', es: 'nos vemos a las tres', ex: '五点见。— Nos vemos a las cinco.' }
];
var ZH_B1 = [
  { hz: '我在这里住了五年了', py: 'wǒ zài zhèlǐ zhù le wǔ nián le', es: 'vivo aquí desde hace 5 años', ex: '我从没见过雪。— Nunca he visto nieve.' },
  { hz: '如果下雨，我们就在家', py: 'rúguǒ xià yǔ, wǒmen jiù zài jiā', es: 'si llueve, nos quedamos (如果…就…)', ex: '如果你学习，就会进步。— Si estudias, avanzarás.' },
  { hz: '找 / 照顾 / 放弃', py: 'zhǎo / zhàogu / fàngqì', es: 'buscar / cuidar / rendirse', ex: '别放弃！— ¡No te rindas!' },
  { hz: '旅行：我要一张票', py: 'lǚxíng: wǒ yào yì zhāng piào', es: 'viajes: quiero un pasaje', ex: '去康塞普西翁的票。— Un pasaje a Concepción.' },
  { hz: '工作：我负责…', py: 'gōngzuò: wǒ fùzé…', es: 'trabajo: soy responsable de…', ex: '我负责菜园。— Estoy a cargo de la huerta.' },
  { hz: '我觉得 / 在我看来', py: 'wǒ juéde / zài wǒ kànlai', es: 'creo que / en mi opinión', ex: '我觉得这是个好主意。— Creo que es buena idea.' },
  { hz: '以前 + verbo', py: 'yǐqián + verbo', es: 'antes / solía…', ex: '我以前弹吉他。— Antes tocaba guitarra.' },
  { hz: '所以 / 因为 / 虽然', py: 'suǒyǐ / yīnwèi / suīrán', es: 'así que / porque / aunque', ex: '很冷，所以我们在家。— Hacía frío, así que nos quedamos.' },
  { hz: '健康：我头疼', py: 'jiànkāng: wǒ tóu téng', es: 'salud: me duele la cabeza', ex: '我需要看医生。— Necesito hora médica.' },
  { hz: '邮件：祝好 / 此致', py: 'yóujiàn: zhù hǎo / cǐzhì', es: 'correo: saludos / atentamente', ex: '祝好，安娜。— Saludos, Ana.' }
];
var ZH_B2C1 = [
  { hz: '打破僵局', py: 'dǎpò jiāngjú', es: 'romper el hielo (chengyu moderno)', ex: '一个笑话打破了僵局。— Un chiste rompió el hielo.' },
  { hz: '入乡随俗', py: 'rù xiāng suí sú', es: 'donde fueres, haz lo que vieres', ex: '在中国，入乡随俗。— En China, haz como los locales.' },
  { hz: '马马虎虎', py: 'mǎmǎ hūhū', es: 'más o menos (chengyu clásico)', ex: '你的中文怎么样？马马虎虎。— ¿Tu chino? Más o menos.' },
  { hz: '加油！', py: 'jiāyóu!', es: '¡vamos! ¡ánimo! (lit. pon bencina)', ex: '考试加油！— ¡Ánimo con la prueba!' },
  { hz: '他到的时候，我已经走了', py: 'tā dào de shíhou, wǒ yǐjīng zǒu le', es: 'ya me había ido (已经…了)', ex: 'Para contar historias en pasado.' },
  { hz: '如果我学了，就会通过', py: 'rúguǒ wǒ xué le, jiù huì tōngguò', es: 'si hubiera estudiado, habría pasado', ex: 'Arrepentimientos y lecciones.' },
  { hz: '海滩被志愿者打扫干净了', py: 'hǎitān bèi zhìyuànzhě dǎsǎo gānjìng le', es: 'la playa fue limpiada (voz pasiva con 被)', ex: 'Pasiva: 被 + agente + verbo.' },
  { hz: '她说她很累', py: 'tā shuō tā hěn lèi', es: 'dijo que estaba cansada (discurso indirecto)', ex: 'Directo → indirecto: no cambia el verbo, cambia el contexto.' },
  { hz: '面试：我的优点是…', py: 'miànshì: wǒ de yōudiǎn shì…', es: 'entrevista: mi fortaleza es…', ex: '我善于团队合作。— Soy buena trabajando en equipo.' },
  { hz: '然而 / 此外', py: 'rán ér / cǐwài', es: 'sin embargo / además (ensayo)', ex: '然而，大海就是生命。— Sin embargo, el mar es vida.' }
];
var ZH_FRASES = [
  { hz: '学而时习之', py: 'xué ér shí xí zhī', es: 'aprender y repasar a tiempo', ex: 'Confucio, Analectas — Repite 5 minutos al día y se queda.' },
  { hz: '有朋自远方来', py: 'yǒu péng zì yuǎnfāng lái', es: 'tener amigos que vienen de lejos', ex: 'Confucio — Qué alegría recibir visitas: atiende bien.' },
  { hz: '三人行，必有我师', py: 'sān rén xíng, bì yǒu wǒ shī', es: 'entre tres, siempre hay un maestro', ex: 'Confucio — De cada vecino se aprende algo.' },
  { hz: '己所不欲，勿施于人', py: 'jǐ suǒ bú yù, wù shī yú rén', es: 'no hagas a otros lo que no quieres para ti', ex: 'Confucio — Regla de oro china.' },
  { hz: '温故而知新', py: 'wēn gù ér zhī xīn', es: 'repasar lo viejo para entender lo nuevo', ex: 'Confucio — Repasa tus notas: ahí nace lo nuevo.' },
  { hz: '道可道，非常道', py: 'dào kě dào, fēi cháng dào', es: 'el Tao que se nombra no es el Tao eterno', ex: 'Laozi, Tao Te Ching — Lo esencial no cabe en palabras.' },
  { hz: '千里之行，始于足下', py: 'qiānlǐ zhī xíng, shǐ yú zúxià', es: 'un viaje de mil li empieza bajo tus pies', ex: 'Laozi — Empieza hoy con un paso chico.' },
  { hz: '知足常乐', py: 'zhī zú cháng lè', es: 'quien se contenta, siempre alegre', ex: 'Proverbio — Agradece lo que hay.' },
  { hz: '滴水穿石', py: 'dī shuǐ chuān shí', es: 'la gota horada la piedra', ex: 'Chengyu — Poco cada día vence lo duro.' },
  { hz: '熟能生巧', py: 'shú néng shēng qiǎo', es: 'la práctica hace la maestría', ex: 'Chengyu — Repite el oficio hasta dominarlo.' },
  { hz: '失败是成功之母', py: 'shībài shì chénggōng zhī mǔ', es: 'el fracaso es madre del éxito', ex: 'Proverbio — Cada error enseña.' },
  { hz: '慢工出细活', py: 'màn gōng chū xì huó', es: 'trabajo lento, obra fina', ex: 'Proverbio — Festina lente en chino.' },
  { hz: '团结就是力量', py: 'tuánjié jiùshì lìliàng', es: 'la unión es fuerza', ex: 'Lema — Junta vecinal fuerte.' },
  { hz: '活到老，学到老', py: 'huó dào lǎo, xué dào lǎo', es: 'vive hasta viejo, aprende hasta viejo', ex: 'Proverbio — Nunca dejes de estudiar.' },
  { hz: '好记性不如烂笔头', py: 'hǎo jìxìng bùrú làn bǐtóu', es: 'mejor lápiz flojo que buena memoria', ex: 'Proverbio — Escríbelo: lo escrito queda.' },
  { hz: '一分耕耘，一分收获', py: 'yì fēn gēngyún, yì fēn shōuhuò', es: 'cada esfuerzo, su cosecha', ex: 'Proverbio de huerta — Siembra y cosecha.' },
  { hz: '吃一堑，长一智', py: 'chī yí qiàn, zhǎng yí zhì', es: 'de cada caída, una sabiduría', ex: 'Proverbio — Tropezar enseña.' },
  { hz: '万事开头难', py: 'wànshì kāitóu nán', es: 'todo comienzo es difícil', ex: 'Proverbio — Lo duro es partir: parte igual.' },
  { hz: '心急吃不了热豆腐', py: 'xīnjí chī bù liǎo rè dòufu', es: 'ansioso no come tofu caliente', ex: 'Proverbio — Con calma se come mejor.' },
  { hz: '读万卷书，行万里路', py: 'dú wàn juàn shū, xíng wàn lǐ lù', es: 'lee mil libros, viaja mil leguas', ex: 'Proverbio — Libro + camino: doble escuela.' },
  { hz: '前事不忘，后事之师', py: 'qiánshì bú wàng, hòushì zhī shī', es: 'no olvides el pasado, maestro del futuro', ex: 'Proverbio — Historia magistra vitae.' },
  { hz: '海内存知己，天涯若比邻', py: 'hǎi nèi cún zhījǐ, tiānyá ruò bǐlín', es: 'con amigos, el fin del mundo es vecindario', ex: 'Wang Bo — La amistad acorta distancias.' },
  { hz: '春眠不觉晓', py: 'chūn mián bù jué xiǎo', es: 'en primavera duermo sin sentir el alba', ex: 'Meng Haoran — Poema de primavera para recitar.' },
  { hz: '床前明月光', py: 'chuáng qián míng yuè guāng', es: 'luz de luna ante mi cama', ex: 'Li Bai — El poema más recitado de China.' },
  { hz: '白日依山尽', py: 'bái rì yī shān jìn', es: 'el sol se pone tras las montañas', ex: 'Wang Zhihuan — Mira lejos para subir más.' },
  { hz: '有志者事竟成', py: 'yǒu zhì zhě shì jìng chéng', es: 'quien tiene meta, lo logra', ex: 'Proverbio — Querer es poder.' },
  { hz: '不入虎穴，焉得虎子', py: 'bú rù hǔxué, yān dé hǔzǐ', es: 'sin entrar a la cueva, no hay cachorro', ex: 'Chengyu — Audaces fortuna iuvat.' },
  { hz: '一日之计在于晨', py: 'yí rì zhī jì zàiyú chén', es: 'el día se planea en la mañana', ex: 'Proverbio — Club 5am en chino: madruga.' },
  { hz: '天下兴亡，匹夫有责', py: 'tiānxià xīngwáng, pǐfū yǒu zé', es: 'el destino del mundo es deber de cada uno', ex: 'Gu Yanwu — Tu barrio también te necesita.' },
  { hz: '加油！', py: 'jiāyóu!', es: '¡vamos! ¡ánimo!', ex: 'Ánimo diario — Dilo antes de la prueba o el partido.' }
];
var ZH_TONOS = [
  ['mā (妈) 1er tono ─ alto y plano', 'mamá. Como cantar una nota sostenida: “maaa”.'],
  ['má (麻) 2º tono ↗ sube', 'cáñamo / adormecer. Como preguntar “¿sí?”: la voz sube.'],
  ['mǎ (马) 3er tono ↘↗ baja y sube', 'caballo. Baja y luego sube, como dudar: “puees…”.'],
  ['mà (骂) 4º tono ↘ cae fuerte', 'regañar. Corto y enojado: “¡no!”.'],
  ['ma (吗) tono neutro · suave', 'partícula de pregunta. Cortita y sin fuerza: 没有吗？'],
  ['买 mǎi (3º) vs 卖 mài (4º)', 'comprar vs vender: ¡el tono decide si pagas o cobras! Tercer tono = compro, cuarto = vendo.'],
  ['睡 shuì (4º) vs 水 shuǐ (3º)', 'dormir vs agua: “我要睡觉” (quiero dormir) ≠ “我要水” (quiero agua).'],
  ['十 shí (2º) vs 四 sì (4º)', 'diez vs cuatro: el clásico del mercado. Exagera el tono al pagar.']
];
var ZH_SIMPLI = [
  ['🀄 国 (guó) país', 'Simplificado 国 vs tradicional 國： la cajita 玉 encierra al territorio. Con 国 te entienden en todas partes.'],
  ['🀄 爱 (ài) amor', 'Simplificado 爱 vs tradicional 愛 (con 心 corazón adentro). Los profes bromean: “el amor simplificado perdió el corazón”.'],
  ['🀄 马 (mǎ) caballo', 'Simplificado 马 vs tradicional 馬： fíjate en los trazos largos de la crin. Chile usa simplificado (China continental).'],
  ['📏 Regla de oro', 'Aprende SIMPLIFICADO + pinyin primero (China continental, HSK, negocios). El tradicional llega solo con series de Taiwán/Hong Kong.']
];

function allZh() { return ZH_A1.concat(ZH_A2, ZH_B1, ZH_FRASES, ZH_B2C1); }

/* ---------------- ESTADO ---------------- */
var zhTab = 'palabra';
var zhQuizQ = null;
var zhQuizLevel = 'todo';
var zhQuizMode = 'significado';
var zhShown = null; // palabra visible en "Palabra del día" (para 🎲 y 🔊 ejemplo)

function getZhData() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { ok: 0, total: 0, streak: 0, lastDay: '' };
    if (!u.chino) u.chino = { ok: 0, total: 0, streak: 0, lastDay: '' };
    return u.chino;
  } catch (e) { return { ok: 0, total: 0, streak: 0, lastDay: '' }; }
}
function zhDayIndex(n) {
  try {
    var d = new Date();
    var s = d.getFullYear() * 1000 + Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
    return s % n;
  } catch (e) { return 0; }
}
/* ---------------- AUDIO (TTS zh robusto) ----------------
   Fallos que arregla:
   - Antes solo ponía lang='zh-CN' sin elegir voz: en equipos sin voz
     china instalada sonaba con voz española o quedaba mudo.
   - Ahora: elige la mejor voz zh disponible, precarga voces async,
     control 🐢 lento/normal, toggle ⏹ detener, hack resume de Chrome
     y aviso con cómo instalar voz china si no hay ninguna. */
var zhVoicesCache = null;
var zhSlow = false;
var zhResumeTimer = null;
var zhSpeaking = false;
var zhSpeakToken = 0;
var zhOnlineAudio = null;
function zhEnsureVoices() {
  try {
    if (!('speechSynthesis' in window)) return [];
    var vs = window.speechSynthesis.getVoices() || [];
    if (vs && vs.length) zhVoicesCache = vs;
    return vs && vs.length ? vs : (zhVoicesCache || []);
  } catch (e) { return zhVoicesCache || []; }
}
try {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    var zhWarm = function () { try { zhEnsureVoices(); } catch (e) {} };
    try { zhWarm(); } catch (e) {}
    try {
      if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = function () { try { zhEnsureVoices(); zhRefreshVoiceStatus(); } catch (e) {} };
      }
    } catch (e) {}
  }
} catch (e) {}
function zhPickVoice() {
  var vs = zhEnsureVoices();
  if (!vs || !vs.length) return null;
  var score = function (v) {
    var lang = String((v && v.lang) || '');
    var name = String((v && v.name) || '').toLowerCase();
    var l = lang.toLowerCase();
    if (/^zh[-_]cn/i.test(lang)) return 100;
    if (/^zh/i.test(l) && /mandarin|putonghua|普通|pǔ|xiaoxiao|yunjian|yaoyao|meimei|kangkang/i.test(name)) return 95;
    if (/^zh/i.test(l) && /han|mei|lin|ting|hui|chinese/i.test(name)) return 90;
    if (/^zh/i.test(l)) return 80;
    if (/^cmn/i.test(l)) return 75;
    if (/chinese|mandarin/i.test(name)) return 70;
    return -1;
  };
  var best = null, bestScore = -1;
  for (var i = 0; i < vs.length; i++) {
    var s = score(vs[i]);
    if (s > bestScore) { bestScore = s; best = vs[i]; }
  }
  return bestScore >= 0 ? best : null;
}
function zhHasZhVoice() { return !!zhPickVoice(); }
function zhClearResume() {
  try { if (zhResumeTimer) { clearInterval(zhResumeTimer); zhResumeTimer = null; } } catch (e) {}
}
function zhStop() {
  try { zhSpeakToken++; } catch (e) {}
  try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
  try { if (zhOnlineAudio) { zhOnlineAudio.pause(); try { zhOnlineAudio.src = ''; } catch (x) {} zhOnlineAudio = null; } } catch (e) {}
  zhClearResume();
  zhSpeaking = false;
  try { zhPaintSpeakState(); } catch (e) {}
}
function zhVoiceStatus() {
  try {
    if (!('speechSynthesis' in window)) return { ok: false, msg: 'Este dispositivo no tiene voz disponible (speechSynthesis ausente).' };
    var v = zhPickVoice();
    if (v) return { ok: true, msg: '🔊 Voz: ' + (v.name || 'china') + ' (' + (v.lang || 'zh-CN') + ')' };
    return { ok: false, msg: '⚠️ Sin voz china instalada: se intentará igual, pero puede sonar con acento raro o quedar mudo.' };
  } catch (e) { return { ok: false, msg: '' }; }
}
function zhCountVoices() {
  try {
    var vs = zhEnsureVoices();
    var n = vs ? vs.length : 0, zh = 0;
    for (var i = 0; i < (vs || []).length; i++) {
      var l = String((vs[i] && vs[i].lang) || '').toLowerCase();
      var nm = String((vs[i] && vs[i].name) || '').toLowerCase();
      if (/^zh|^cmn/.test(l) || /chinese|mandarin|putonghua/.test(nm)) zh++;
    }
    return { total: n, zh: zh };
  } catch (e) { return { total: 0, zh: 0 }; }
}
function zhRefreshVoiceStatus() {
  var el = $('zhVoiceStatus');
  if (!el) return;
  var st = zhVoiceStatus();
  var c = zhCountVoices();
  var info = ' <span class="muted">(' + c.zh + ' china(s) de ' + c.total + ' voces)</span>';
  el.innerHTML = esc(st.msg) + info +
    ' <button type="button" id="zhVoiceTest" class="btn su-337714">🔊 Probar voz</button>' +
    ' <button type="button" id="zhOnlineTest" class="btn su-337714" title="Usa internet si tu equipo no tiene voz china">🌐 Oír online</button>' +
    (st.ok ? '' : '<br><span class="muted">Sin voz china el audio local queda mudo: usa 🌐 Oír online (requiere internet) o instala voz china: <b>Windows:</b> Configuración → Hora e idioma → Voz → Agregar voz (Chino simplificado). <b>Android:</b> Ajustes → Idioma → Salida TTS → instalar chino. <b>iPhone:</b> Ajustes → Accesibilidad → Voces → Chino mandarín. Luego recarga.</span>');
  try {
    var bt = $('zhVoiceTest');
    if (bt) bt.onclick = function (e) { try { e.preventDefault(); } catch (x) {} zhSpeak('你好', { forceLocal: true }); };
    var on = $('zhOnlineTest');
    if (on) on.onclick = function (e) { try { e.preventDefault(); } catch (x) {} zhSpeakOnline(zhShown ? zhShown.hz : '你好'); };
  } catch (e) {}
}
// Fallback online (requiere internet): TTS de Google para zh-CN.
// Se usa cuando el equipo no tiene voz china instalada.
function zhVozLimpia(t) {
  // Evita que el locutor del PC diga "barra", "dos puntos", "guion", etc.
  t = String(t == null ? '' : t);
  t = t.replace(/\s*\/\s*/g, ', ');
  t = t.replace(/(\d)\s*[-‐‑‒–—―－]\s*(\d)/g, '$1 al $2');
  t = t.replace(/[—–―─－]+/g, ', ');
  t = t.replace(/\s*[:;：；]\s*/g, ', ');
  t = t.replace(/[()（）\[\]{}<>«»]+/g, ', ');
  t = t.replace(/["“”‘’'´`·•●◦▪|\\_#*+=~^°]+/g, ' ');
  t = t.replace(/[〜~]+/g, ' ');
  t = t.replace(/[…]+/g, ' ');
  t = t.replace(/\.{2,}/g, '.');
  t = t.replace(/\s*,\s*,\s*/g, ', ');
  t = t.replace(/[ \t\u00a0]{2,}/g, ' ');
  t = t.replace(/\s*,\s*/g, ', ').replace(/,{2,}/g, ',');
  t = t.replace(/^[,\s]+|[,\s]+$/g, '').trim();
  t = t.replace(/^,|,$/g, '').trim();
  return t;
}
function zhSpeakOnline(txt) {
  var text = zhVozLimpia(txt);
  if (!text) text = String(txt == null ? '' : txt).trim();
  if (!text) return;
  try { zhStop(); } catch (e) {}
  try {
    var url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=' + encodeURIComponent(text);
    var a = new Audio(url);
    zhOnlineAudio = a;
    zhSpeaking = true;
    try { zhPaintSpeakState(); } catch (e) {}
    a.onended = function () { zhSpeaking = false; zhOnlineAudio = null; try { zhPaintSpeakState(); } catch (x) {} };
    a.onerror = function () {
      zhSpeaking = false; zhOnlineAudio = null;
      try { zhPaintSpeakState(); } catch (x) {}
      alert('No se pudo reproducir el audio online. Revisa tu conexión o instala una voz china en el dispositivo.');
    };
    var p = a.play();
    if (p && p.catch) p.catch(function () {
      zhSpeaking = false; zhOnlineAudio = null;
      try { zhPaintSpeakState(); } catch (x) {}
    });
  } catch (e) { alert('No se pudo reproducir el audio online.'); }
}
function zhPaintSpeakState() {
  try {
    var btns = document.querySelectorAll('#chinoDialog .zh-speaking');
    for (var i = 0; i < btns.length; i++) {
      if (zhSpeaking) btns[i].classList.add('btn-accent');
      else btns[i].classList.remove('btn-accent');
    }
  } catch (e) {}
}
function zhSpeak(txt, opts) {
  opts = opts || {};
  var text = zhVozLimpia(txt);
  if (!text) text = String(txt == null ? '' : txt).trim();
  if (!text) return;
  if (opts.forceOnline) { zhSpeakOnline(text); return; }
  try {
    if (!('speechSynthesis' in window)) { zhSpeakOnline(text); return; }
    // Sin voz china local el resultado suele ser mudo o con acento
    // equivocado: ir directo al fallback online (salvo forceLocal).
    if (!opts.forceLocal && !zhHasZhVoice()) { zhSpeakOnline(text); return; }
    var my = ++zhSpeakToken;
    // Cancela primero y habla con retardo: en Chrome hablar en el mismo
    // tick que cancel() cancela también el utterance nuevo (silencio).
    try { window.speechSynthesis.cancel(); } catch (e) {}
    try { if (zhOnlineAudio) { zhOnlineAudio.pause(); zhOnlineAudio = null; } } catch (e) {}
    zhClearResume();
    zhSpeaking = false;
    try { zhPaintSpeakState(); } catch (e) {}
    setTimeout(function () {
      if (my !== zhSpeakToken) return; // el usuario ya pidió otra cosa
      try {
        // Algunos Android/Edge exigen resume() tras un gesto táctil
        try { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); } catch (x) {}
        var u = new SpeechSynthesisUtterance(text);
        var voice = zhPickVoice();
        if (voice) { try { u.voice = voice; } catch (e) {} }
        u.lang = (voice && voice.lang) ? voice.lang : 'zh-CN';
        var slow = (opts.slow != null) ? !!opts.slow : zhSlow;
        u.rate = slow ? 0.55 : 0.8;
        u.pitch = 1;
        u.volume = 1;
        zhSpeaking = true;
        try { zhPaintSpeakState(); } catch (e) {}
        var fellBack = false;
        u.onend = function () { zhSpeaking = false; zhClearResume(); try { zhPaintSpeakState(); } catch (e) {} if (typeof opts.onend === 'function') { try { opts.onend(); } catch (x) {} } };
        u.onerror = function (ev) {
          zhSpeaking = false; zhClearResume();
          try { zhPaintSpeakState(); } catch (e) {}
          try { zhRefreshVoiceStatus(); } catch (e) {}
          // Error real sin voz china → intenta online una vez
          if (!fellBack && !opts.forceLocal && !zhHasZhVoice()) {
            fellBack = true;
            zhSpeakOnline(text);
            return;
          }
          if (typeof opts.onerror === 'function') { try { opts.onerror(ev); } catch (x) {} }
        };
        window.speechSynthesis.speak(u);
        // Hack Chrome: pausa utterances largos (~15s). Resume mientras hable.
        try {
          zhClearResume();
          zhResumeTimer = setInterval(function () {
            try {
              if (window.speechSynthesis && window.speechSynthesis.speaking) {
                window.speechSynthesis.resume();
              } else { zhClearResume(); }
            } catch (e) { zhClearResume(); }
          }, 8000);
        } catch (e) {}
        try { zhRefreshVoiceStatus(); } catch (e) {}
      } catch (e) {}
    }, 120);
  } catch (e) {}
}
// Habla solo la parte hanzi del ejemplo ("hanzi — español" / "hanzi. — ...")
function zhSpeakExample(ex) {
  var t = String(ex || '');
  var cut = t.split('—')[0].split('—')[0];
  // corta en "—" o ".—" típico de los ejemplos
  cut = t.split('—')[0];
  cut = cut.replace(/[.…。!！?？]+.*$/, '').trim();
  // si quedó con caracteres latinos largos (ej: "lǚxíng: ..."), habla el hanzi igual
  if (!cut) cut = t;
  // si el ejemplo trae pinyin + hanzi mezclado, prioriza hanzi (rango CJK)
  var m = cut.match(/[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef，。？！、…]+/g);
  if (m && m.join(' ').length >= 2) cut = m.join(' ');
  zhSpeak(cut);
}
function zhQuizPool() {
  if (zhQuizLevel === 'a1') return ZH_A1;
  if (zhQuizLevel === 'a2') return ZH_A2;
  if (zhQuizLevel === 'b1') return ZH_B1;
  if (zhQuizLevel === 'frases') return ZH_FRASES;
  if (zhQuizLevel === 'avanzado') return ZH_B2C1;
  return allZh();
}

function renderZhStreak() {
  var b = $('zhStreakBox'); if (!b) return;
  var d = getZhData();
  var pct = d.total ? Math.round(d.ok / d.total * 100) : 0;
  b.innerHTML = '<b>🐉 Tu chino:</b> ' + d.ok + '/' + d.total + ' correctas (' + pct + '%) · racha ' + d.streak + ' 🔥 ' +
    '<span class="muted su-11a508">— 1 hanzi por día · HSK 1→5 + cultura · todo guardado local y privado.</span>';
}
function zhCard(item, lv) {
  return '<button type="button" class="btn eng-word su-6cd6a1" data-w="' + esc(item.hz) + '"><b>🔊 ' + esc(item.hz) + '</b> ' +
    '<span class="chip su-0d5be0">' + esc(lv) + '</span><br><span class="su-2f290d">' + esc(item.py) + ' · ' + esc(item.es) + '</span><br>' +
    '<span class="muted su-11a508">“' + esc(item.ex) + '”</span></button>';
}

var zhFraseIdx = -1;
function renderZhPanel(tab) {
  try { zhStop(); } catch (e) {}
  zhTab = tab || zhTab;
  var ids = { palabra: 'tabZH1', a1: 'tabZH2', a2: 'tabZH3', b1: 'tabZH4', cultura: 'tabZH5', frases: 'tabZH7', quiz: 'tabZH6' };
  Object.keys(ids).forEach(function (k) { var el = $(ids[k]); if (el) el.classList.toggle('btn-accent', k === zhTab); });
  renderZhStreak();
  var box = $('zhPanel'); if (!box) return;
  var html = '';
  if (zhTab === 'palabra') {
    var all = allZh();
    var dayIdx = zhDayIndex(all.length);
    // Mantiene la palabra visible para que 🎲 sí cambie (antes siempre
    // recalculaba el índice del día y mostraba la misma).
    if (!zhShown || zhShown._day !== dayIdx || !zhShown._rand) {
      var base = all[dayIdx];
      zhShown = { hz: base.hz, py: base.py, es: base.es, ex: base.ex, _day: dayIdx };
    }
    var w = zhShown;
    var rel = [all[(dayIdx + 7) % all.length], all[(dayIdx + 13) % all.length]];
    var fecha = '';
    try { fecha = cal.fmtDate.format(new Date()); } catch (e) { try { fecha = new Date().toLocaleDateString(); } catch (e2) { fecha = ''; } }
    html += '<div class="menstrual-card su-3fa1a8">' +
      '<p class="muted su-11a508">☀️ 每日一字 PALABRA DEL DÍA · ' + esc(fecha) + ' · ' + all.length + ' hanzi y frases</p>' +
      '<div class="su-6adb68">' + esc(w.hz) + '</div>' +
      '<div class="su-cd8bd8"><b>' + esc(w.py) + '</b> · ' + esc(w.es) + '</div>' +
      '<p class="muted su-2b0979">“' + esc(w.ex) + '”</p>' +
      '<div class="su-9bc2df"><button type="button" id="zhSpeakBtn" class="btn btn-accent su-30e741 zh-speaking">🔊 Escuchar (中文)</button> ' +
      '<button type="button" id="zhOnlineBtn" class="btn su-30e741" title="Audio por internet (funciona aunque tu equipo no tenga voz china)">🌐 Online</button> ' +
      '<button type="button" id="zhSlowBtn" class="btn su-30e741">🐢 Lento: ' + (zhSlow ? 'ON' : 'OFF') + '</button> ' +
      '<button type="button" id="zhExBtn" class="btn su-30e741">🗣️ Oír ejemplo</button> ' +
      '<button type="button" id="zhStopBtn" class="btn su-30e741">⏹ Detener</button> ' +
      '<button type="button" id="zhNextBtn" class="btn su-30e741">🎲 Otro hanzi</button></div>' +
      '<p id="zhVoiceStatus" class="muted su-11a508"></p></div>' +
      '<div class="help-grid su-d2c171">' +
      rel.map(function (r) { return '<div class="help-card"><h4>' + esc(r.hz) + ' <span class="muted">' + esc(r.py) + '</span></h4><p class="su-11a508">' + esc(r.es) + '<br><span class="muted">“' + esc(r.ex) + '”</span></p></div>'; }).join('') + '</div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>🗣️ ¿Cómo practicar?</h4><p class="su-b439ab">1) <b>Escucha</b> con 🔊 y repite 3 veces en voz alta.<br>2) <b>Escribe</b> 1 frase con el hanzi en las Notas del día.<br>3) <b>Úsalo hoy</b>: 1 hanzi/día → ~365/año.<br>Pasa a A2 cuando sepas 20 sin mirar.</p></div>' +
      '<div class="help-card"><h4>📚 Niveles (HSK)</h4><p class="su-b439ab">🌱 <b>HSK 1–2 (A1):</b> sobrevivir (你好，谢谢，家).<br>🌿 <b>HSK 3 (A2):</b> vida diaria (了，direcciones, compras).<br>💬 <b>HSK 4 (B1):</b> viaje + trabajo + opinión.<br>📜 <b>HSK 5 (B2–C1):</b> chengyu, 把/被, entrevista + cultura.</p></div></div>';
  } else if (zhTab === 'a1') {
    html += '<div class="menstrual-card su-5a6934"><h4 class="su-752b1a">🌱 A1 Supervivencia — sobrevive en mandarín</h4>' +
      '<p class="muted su-a6c665">Meta: presentarte, pedir agua/comida, contar 1–10. Gramática: <b>是 (shì ser), 有 (yǒu tener/hay), 不/没 para negar, 吗 para preguntar</b>. No hay conjugaciones: el verbo nunca cambia. Toca 🔊 en cada tarjeta para oír (zh-CN).</p>' +
      '<div class="su-5e3875">' + ZH_A1.map(function (x) { return zhCard(x, 'HSK 1'); }).join('') + '</div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>🎵 Los 4 tonos (+ neutro)</h4><p class="su-583677"><b>1º ─</b> alto plano: mā<br><b>2º ↗</b> sube: má<br><b>3º ↘↗</b> baja-sube: mǎ<br><b>4º ↘</b> cae fuerte: mà<br><b>neutro ·</b> suave: ma<br><span class="muted">Mismo “ma”, 5 significados. Exagera al inicio: mejor actriz que robot.</span></p></div>' +
      '<div class="help-card"><h4>🎭 Mini-diálogo: en la feria</h4><p class="su-583677">— <b>你好！这个多少钱？</b> (¡Hola! ¿Cuánto cuesta?)<br>— <b>五千比索。</b> (Cinco mil pesos.)<br>— <b>谢谢！明天见！</b> (¡Gracias! ¡Nos vemos!)<br><span class="muted">Practica: una persona por línea. Cambia “pesos” por “块” (kuài) en China.</span></p></div></div>';
  } else if (zhTab === 'a2') {
    html += '<div class="menstrual-card su-018729"><h4 class="su-721a46">🌿 A2 Vida diaria — el día a día</h4>' +
      '<p class="muted su-a6c665">Meta: contar qué hiciste, planes, compras y direcciones. Gramática: <b>了 (le: acción cumplida), 要 (yào: voy a/quiero), 比 (bǐ: comparaciones), 能 (néng: poder)</b>.</p>' +
      '<div class="su-5e3875">' + ZH_A2.map(function (x) { return zhCard(x, 'HSK 2–3'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>🎭 Mini-diálogo: pidiendo dirección en Penco</h4><p class="su-583677">— <b>请问，海滩在哪儿？</b> (Disculpa, ¿dónde queda la playa?)<br>— <b>一直走，然后在广场左转。</b> (Sigue recto y gira a la izquierda en la plaza.)<br>— <b>谢谢！</b> — <b>不客气！</b> (¡Gracias! / ¡De nada!)<br><span class="muted">Clave: 在哪儿 (dónde) + 左/右 (izquierda/derecha).</span></p></div>';
  } else if (zhTab === 'b1') {
    html += '<div class="menstrual-card su-d4d722"><h4 class="su-7c91e2">💬 B1 Intermedio — viajar, trabajar y opinar</h4>' +
      '<p class="muted su-a6c665">Meta: viajar, trabajar y opinar. Gramática estrella: <b>如果…就… (si… entonces…)</b> + 住…了 (vivir desde hace) + 以前 (antes) + 所以/因为/虽然 (conectores).</p>' +
      '<div class="su-5e3875">' + ZH_B1.map(function (x) { return zhCard(x, 'HSK 4'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>🎭 Mini-diálogo: viaje a Concepción</h4><p class="su-583677">— <b>我要一张去康塞普西翁的票。</b> (Quiero un pasaje a Concepción.)<br>— <b>单程还是往返？</b> (¿Solo ida o ida y vuelta?) — <b>往返，谢谢。</b><br>— <b>你在这里住了多久？</b> — <b>五年了。</b> (¿Hace cuánto vives aquí? Cinco años.)<br><span class="muted">Practica con horarios, precios y “verbos que nunca cambian”.</span></p></div>';
  } else if (zhTab === 'cultura') {
    html += '<div class="menstrual-card su-5b7cd0"><h4 class="su-399074">📜 B2–C1 Avanzado + Cultura viva</h4>' +
      '<p class="muted su-a6c665">Meta: entrevistas, chengyu y no pasar vergüenza con los tonos. Gramática: <b>把 (bǎ: objeto adelantado), 被 (bèi: pasiva), 已经…了 (ya…), discurso indirecto con 说</b>.</p>' +
      '<div class="su-5e3875">' + ZH_B2C1.map(function (x) { return zhCard(x, 'HSK 5'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>💬 Frases famosas</h4>' +
      '<p class="su-11a508">Las <b>30 frases famosas</b> tienen su propia pestaña: portada del día + tarjetas con 🔊 Escuchar y 📋 Copiar.</p>' +
      '<div class="su-9bc2df"><button type="button" class="btn btn-accent su-30e741 zh-goto-frases">💬 Ver frases famosas →</button></div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>⚠️ 8 tonos que salvan vidas</h4><p class="su-583677">' + ZH_TONOS.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div>' +
      '<div class="help-card"><h4>🀄 简体 ↔ 繁體 ¿Simplificado o tradicional?</h4><p class="su-583677">' + ZH_SIMPLI.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>✍️ Orden de trazos en 1 minuto</h4><p class="su-b439ab"><b>1.</b> arriba → abajo · <b>2.</b> izquierda → derecha<br><b>3.</b> horizontal antes que vertical · <b>4.</b> afuera antes que adentro<br><b>5.</b> cierra al final: 国 se cierra con el último trazo.<br><span class="muted">Escribe el hanzi del día 5 veces con el dedo: el músculo recuerda.</span></p></div>' +
      '<div class="help-card"><h4>🍵 Cultura para probar y celebrar</h4><p class="su-b439ab"><b>Probar:</b> té verde (绿茶), dumplings (饺子), arroz frito (炒饭): lee la receta en chino y cocina.<br><b>Escuchar:</b> 茉莉花 (Jazmín), canciones infantiles 两只老虎: 1 canción × 7 días.<br><b>Celebrar:</b> Año Nuevo chino (春节, enero/febrero, como el We Tripantu) y Fiesta del Medio Otoño (中秋节, luna llena).<br><span class="muted">Sabios: Confucio (孔子: estudia y practica) y Laozi (老子: el Tao): el calendario también es filosofía.</span></p></div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>💼 Kit entrevista de trabajo</h4><p class="su-583677">— <b>请介绍一下你自己。</b> (Preséntate, por favor.)<br>— <b>我负责，善于团队合作。</b> (Soy responsable y trabajo bien en equipo.)<br>— <b>我的优点是…我的目标是…</b> (Mi fortaleza es… mi meta es…)<br><span class="muted">Cierra: “谢谢你的时间。” (Gracias por tu tiempo.)</span></p></div>';
  } else if (zhTab === 'frases') {
    if (zhFraseIdx < 0) zhFraseIdx = zhDayIndex(ZH_FRASES.length);
    var FDAY = ZH_FRASES[zhFraseIdx % ZH_FRASES.length];
    var fdate = '';
    try { fdate = cal.fmtDate.format(new Date()); } catch (e) { fdate = new Date().toLocaleDateString(); }
    html += '<div class="menstrual-card su-3fa1a8">' +
      '<p class="muted su-11a508">💬 FRASE DEL DÍA · ' + esc(fdate) + ' · ' + ZH_FRASES.length + ' frases famosas</p>' +
      '<div class="su-6adb68">' + '“' + esc(FDAY.hz) + '”</div>' +
      '<div class="su-cd8bd8"><b>' + esc(FDAY.es) + '</b></div>' +
      '<p class="su-11a508">🎵 <b>' + esc(FDAY.py) + '</b></p>' +
            '<p class="muted su-2b0979">“' + esc(FDAY.ex) + '”</p>' +
      '<div class="su-9bc2df"><button type="button" class="btn btn-accent su-30e741 zh-hear" data-w="' + esc(FDAY.hz) + '">🔊 Escuchar</button> ' +
      '<button type="button" id="zhFraseRnd" class="btn su-30e741">🎲 Otra frase</button></div></div>' +
      ZH_FRASES.map(function (x) {
        return '<div class="menstrual-card su-4adf8c"><h4>“' + esc(x.hz) + '”</h4>' +
          '<p><b>' + esc(x.es) + '</b>' +
          '<br><span class="su-11a508">🎵 ' + esc(x.py) + '</span>' +
          '<br><span class="muted">“' + esc(x.ex) + '”</span></p>' +
          '<div class="su-9bc2df"><button type="button" class="btn btn-accent su-30e741 zh-hear" data-w="' + esc(x.hz) + '">🔊 Escuchar</button> ' +
          '<button type="button" class="btn su-30e741 zh-copy" data-w="' + esc(x.hz) + '|' + esc(x.es) + '">📋 Copiar</button></div></div>';
      }).join('') +
      '<div class="menstrual-card su-5a6934"><h4 class="su-752b1a">🗣️ ¿Cómo practicar?</h4>' +
      '<p class="muted su-a6c665">1) <b>Escucha</b> la frase del día con 🔊 y repítela 3 veces en voz alta.<br>2) <b>Copia</b> tu favorita con 📋 y pégala en las Notas del día.<br>3) <b>Úsala hoy</b>: una frase al día son 365 al año.</p></div>';
  } else if (zhTab === 'quiz') {
    var d = getZhData();
    if (!zhQuizQ) {
      var pool = zhQuizPool();
      var wq = pool[Math.floor(Math.random() * pool.length)];
      var opts = {};
      opts[zhQuizMode === 'pinyin' ? wq.py : wq.es] = 1;
      var guard = 0;
      while (Object.keys(opts).length < 4 && guard < 60) { guard++; var c = pool[Math.floor(Math.random() * pool.length)]; opts[zhQuizMode === 'pinyin' ? c.py : c.es] = 1; }
      var arr = Object.keys(opts).sort(function () { return Math.random() - 0.5; });
      zhQuizQ = { w: wq, opts: arr };
    }
    var q = zhQuizQ;
    var lvBtn = function (v, l) { return '<button type="button" class="btn zh-lv' + (zhQuizLevel === v ? ' btn-accent' : '') + ' su-337714" data-lv="' + v + '">' + l + '</button>'; };
    var mdBtn = function (v, l) { return '<button type="button" class="btn zh-md' + (zhQuizMode === v ? ' btn-accent' : '') + ' su-337714" data-md="' + v + '">' + l + '</button>'; };
    html += '<div class="menstrual-card su-1f2df9"><h4 class="su-399074">🧩 Quiz por niveles</h4>' +
      '<div class="su-a8712a">' + lvBtn('todo', '🌎 Todo') + lvBtn('a1', '🌱 HSK 1') + lvBtn('a2', '🌿 HSK 2–3') + lvBtn('b1', '💬 HSK 4') + lvBtn('frases', '💬 Frases') + lvBtn('avanzado', '📜 HSK 5') + '</div>' +
      '<div class="su-a8712a">' + mdBtn('significado', '🇪🇸 Significado') + mdBtn('pinyin', '🎵 Pinyin') + '</div>' +
      '<div class="su-73ce29">“' + esc(q.w.hz) + '” <span class="muted su-11a508">' + (zhQuizMode === 'pinyin' ? '¿cómo se pronuncia?' : '¿qué significa?') + '</span></div>' +
      '<button type="button" id="zhQuizSpeak" class="btn su-337714 zh-speaking">🔊 Escuchar</button> ' +
      '<button type="button" id="zhQuizOnline" class="btn su-337714" title="Audio por internet">🌐</button> ' +
      '<button type="button" id="zhQuizSlow" class="btn su-337714">🐢 Lento: ' + (zhSlow ? 'ON' : 'OFF') + '</button> ' +
      '<button type="button" id="zhQuizStop" class="btn su-337714">⏹</button>' +
      '<p id="zhVoiceStatus" class="muted su-11a508"></p>' +
      '<div class="su-ae0e71">' + q.opts.map(function (o) { return '<button type="button" class="btn zh-opt su-046678" data-o="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div>' +
      '<div id="zhQuizFb" class="su-ac1122"></div>' +
      '<p class="muted su-e13d76">Correctas ' + d.ok + '/' + d.total + ' · racha ' + d.streak + ' · nivel: <b>' + esc(zhQuizLevel) + '</b> · modo: <b>' + esc(zhQuizMode) + '</b> · banco: ' + zhQuizPool().length + ' hanzi/frases</p></div>';
  }
  box.innerHTML = html + '<p class="muted su-a953a7">🔊 Toca cualquier tarjeta para oír en mandarín (voz china del dispositivo). El quiz suma a tu racha local y privada.</p>';
  try { zhEnsureVoices(); zhRefreshVoiceStatus(); } catch (e) {}
  try { zhPaintSpeakState(); } catch (e) {}
  var sp = $('zhSpeakBtn');
  if (sp) sp.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (zhShown) zhSpeak(zhShown.hz); };
  var onB = $('zhOnlineBtn');
  if (onB) onB.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (zhShown) zhSpeakOnline(zhShown.hz); };
  var sl = $('zhSlowBtn');
  if (sl) sl.onclick = function (e) { try { e.preventDefault(); } catch (x) {} zhSlow = !zhSlow; sl.textContent = '🐢 Lento: ' + (zhSlow ? 'ON' : 'OFF'); if (zhShown) zhSpeak(zhShown.hz); };
  var exB = $('zhExBtn');
  if (exB) exB.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (zhShown) zhSpeakExample(zhShown.ex); };
  var stB = $('zhStopBtn');
  if (stB) stB.onclick = function (e) { try { e.preventDefault(); } catch (x) {} zhStop(); };
  var nx = $('zhNextBtn');
  if (nx) nx.onclick = function () {
    try {
      var a = allZh();
      var di = zhDayIndex(a.length);
      var pick = a[Math.floor(Math.random() * a.length)];
      var guard = 0;
      while (zhShown && pick.hz === zhShown.hz && guard < 25) { guard++; pick = a[Math.floor(Math.random() * a.length)]; }
      // Copia plana + _day del día actual para que el render la conserve
      zhShown = { hz: pick.hz, py: pick.py, es: pick.es, ex: pick.ex, _day: di, _rand: 1 };
      zhStop();
      renderZhPanel('palabra');
      if (zhShown) zhSpeak(zhShown.hz);
    } catch (e) { try { renderZhPanel('palabra'); } catch (x) {} }
  };
  var qs = $('zhQuizSpeak');
  if (qs) qs.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (zhQuizQ) zhSpeak(zhQuizQ.w.hz); };
  var qo = $('zhQuizOnline');
  if (qo) qo.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (zhQuizQ) zhSpeakOnline(zhQuizQ.w.hz); };
  var qsl = $('zhQuizSlow');
  if (qsl) qsl.onclick = function (e) { try { e.preventDefault(); } catch (x) {} zhSlow = !zhSlow; qsl.textContent = '🐢 Lento: ' + (zhSlow ? 'ON' : 'OFF'); if (zhQuizQ) zhSpeak(zhQuizQ.w.hz); };
  var qst = $('zhQuizStop');
  if (qst) qst.onclick = function (e) { try { e.preventDefault(); } catch (x) {} zhStop(); };
  box.querySelectorAll('.eng-word').forEach(function (b) {
    b.onclick = function (e) { try { e.preventDefault(); } catch (x) {} zhSpeak(b.getAttribute('data-w')); };
  });
  box.querySelectorAll('.zh-hear').forEach(function (b) {
    b.onclick = function (e) { try { e.preventDefault(); } catch (x) {} zhSpeak(b.getAttribute('data-w')); };
  });
  box.querySelectorAll('.zh-copy').forEach(function (b) {
    b.onclick = function (e) {
      try { e.preventDefault(); } catch (x) {}
      var parts = (b.getAttribute('data-w') || '').split('|');
      var txt = '💬 ' + (parts[0] || '') + ' = ' + (parts[1] || '');
      try {
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { alert('Copiado: ' + txt); }, function () { alert(txt); });
        else alert(txt);
      } catch (err) { try { alert(txt); } catch (e2) {} }
    };
  });
  box.querySelectorAll('.zh-goto-frases').forEach(function (b) {
    b.onclick = function () { renderZhPanel('frases'); };
  });
  var frnd = $('zhFraseRnd');
  if (frnd) frnd.onclick = function () { zhFraseIdx = Math.floor(Math.random() * ZH_FRASES.length); renderZhPanel('frases'); };

  box.querySelectorAll('.zh-lv').forEach(function (b) {
    b.onclick = function () { zhQuizLevel = b.getAttribute('data-lv'); zhQuizQ = null; renderZhPanel('quiz'); };
  });
  box.querySelectorAll('.zh-md').forEach(function (b) {
    b.onclick = function () { zhQuizMode = b.getAttribute('data-md'); zhQuizQ = null; renderZhPanel('quiz'); };
  });
  box.querySelectorAll('.zh-opt').forEach(function (b) {
    b.onclick = function () {
      var d2 = getZhData();
      var good = zhQuizMode === 'pinyin' ? zhQuizQ.w.py : zhQuizQ.w.es;
      var ok = b.getAttribute('data-o') === good;
      d2.total = (d2.total || 0) + 1;
      if (ok) { d2.ok = (d2.ok || 0) + 1; d2.streak = (d2.streak || 0) + 1; }
      else { d2.streak = 0; }
      try { if (typeof scheduleSave === 'function') scheduleSave('Guardado ✓'); } catch (e) {}
      var fb = $('zhQuizFb');
      if (fb) fb.innerHTML = ok ? '✅ ¡Muy bien! <b>' + esc(zhQuizQ.w.hz) + '</b> ' + esc(zhQuizQ.w.py) + ' — “' + esc(zhQuizQ.w.ex) + '”'
        : '❌ Era <b>' + esc(good) + '</b> — ' + esc(zhQuizQ.w.hz) + ' ' + esc(zhQuizQ.w.py) + ' “' + esc(zhQuizQ.w.ex) + '”';
      box.querySelectorAll('.zh-opt').forEach(function (x) {
        x.disabled = true;
        if (x.getAttribute('data-o') === good) x.classList.add('btn-accent');
      });
      renderZhStreak();
      setTimeout(function () { zhQuizQ = null; if (zhTab === 'quiz') renderZhPanel('quiz'); }, ok ? 1400 : 2400);
    };
  });
}

/* ---------------- DIÁLOGO ---------------- */
function buildDialog() {
  if ($('chinoDialog')) return;
  var d = document.createElement('dialog');
  d.id = 'chinoDialog';
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053"><h3 class="su-ee0cfe">🐉 Chino Mandarín — HSK 1 → 5 + cultura</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Aprende <b>mandarín (普通话, simplificado + pinyin) por niveles HSK + cultura viva</b>, como el Kimün, el Inglés y el Portugués: 1 hanzi por día + tonos + quiz. Toca 🔊 para oír (voz del dispositivo, zh-CN). Todo queda <b>local y privado</b> por usuario.</p>' +
    '<div id="zhStreakBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="timer-tabs su-f7ad78">' +
    '<button type="button" id="tabZH1" class="btn btn-accent su-30e741">☀️ Palabra del día</button>' +
    '<button type="button" id="tabZH2" class="btn su-30e741">🌱 HSK 1</button>' +
    '<button type="button" id="tabZH3" class="btn su-30e741">🌿 HSK 2–3</button>' +
    '<button type="button" id="tabZH4" class="btn su-30e741">💬 HSK 4</button>' +
    '<button type="button" id="tabZH5" class="btn su-30e741">📜 HSK 5 + Cultura</button>' +
    '<button type="button" id="tabZH7" class="btn su-30e741">💬 Frases famosas</button>' +
    '<button type="button" id="tabZH6" class="btn su-30e741">🧩 Quiz</button></div>' +
    '<div id="zhPanel"></div>' +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { zhStop(); } catch (e) {} try { d.close(); } catch (e2) {} }; });
  try {
    d.addEventListener('close', function () { try { zhStop(); } catch (e) {} });
    d.addEventListener('cancel', function () { try { zhStop(); } catch (e) {} });
  } catch (e) {}
}

function bindTabs() {
  var map = { tabZH1: 'palabra', tabZH2: 'a1', tabZH3: 'a2', tabZH4: 'b1', tabZH5: 'cultura', tabZH6: 'quiz', tabZH7: 'frases' };
  Object.keys(map).forEach(function (id) {
    var el = $(id);
    if (el) el.onclick = function () {
      try { zhStop(); } catch (e) {}
      if (map[id] !== 'quiz') zhQuizQ = null;
      if (map[id] === 'palabra') zhShown = null; // volver a la palabra del día
      renderZhPanel(map[id]);
    };
  });
}

/* ---------------- SETUP ---------------- */
function ensureButton() {
  try {
    var existing = $('btnChino');
    if (existing) { try { existing.setAttribute('data-sub', 'idiomas'); } catch (e) {} return existing; }
    var g = document.querySelector('.action-group[data-group="aprender"] .group-btns');
    if (!g) return null;
    var btn = document.createElement('button');
    btn.id = 'btnChino'; btn.className = 'btn'; btn.type = 'button';
    btn.textContent = '🐉 Chino Mandarín';
    try { btn.setAttribute('data-sub', 'idiomas'); } catch (e2) {}
    btn.setAttribute('data-keywords', 'chino mandarín mandarin hanzi hsk pinyin tonos china Confucio tao chengyu simplificado tradicional idioma niveles basico intermedio avanzado quiz vocabulario gramatica caracteres trazos té fiesta primavera');
    var ref = g.querySelector('#btnPortugues');
    if (ref && ref.parentNode === g) g.insertBefore(btn, ref.nextSibling);
    else g.appendChild(btn);
    return btn;
  } catch (e) { return null; }
}

function registerGlobals() {
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnChino') < 0) {
      var i = ALL_BTNS.indexOf('btnPortugues');
      if (i >= 0) ALL_BTNS.splice(i + 1, 0, 'btnChino');
      else ALL_BTNS.push('btnChino');
    }
  } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnChino = ['aprender', 'idiomas']; } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['aprender|idiomas'] && BTN_ORDER['aprender|idiomas'].indexOf('btnChino') < 0) {
      BTN_ORDER['aprender|idiomas'].push('btnChino');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p] && (p === 'todo' || p === 'adulto' || p === 'estudiante' || p === 'docente' || p === 'adolescente')) PRESETS[p].btnChino = true;
      });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnChino"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Aprender') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnChino"> 🐉 Chino Mandarín';
          var ref2 = gr.querySelector('input[data-btn="btnPortugues"]');
          if (ref2 && ref2.closest && ref2.closest('label') && ref2.closest('label').parentNode) {
            ref2.closest('label').parentNode.insertBefore(lab, ref2.closest('label').nextSibling);
          } else { gr.appendChild(lab); }
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnChino !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnChino = lab.querySelector('input').checked;
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
  renderZhPanel('palabra');
  var b = $('btnChino');
  if (!b) { if ((setup._r = (setup._r || 0) + 1) < 60) setTimeout(setup, 500); return; }
  if (!b.dataset.zhu) {
    b.dataset.zhu = '1';
    b.addEventListener('click', function () {
      zhQuizQ = null;
      zhShown = null;
      try { zhEnsureVoices(); } catch (e) {}
      renderZhPanel('palabra');
      openDlg('chinoDialog');
    });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 500); });
else setTimeout(setup, 500);

})();
