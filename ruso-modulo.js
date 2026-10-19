/* ============================================================
   RUSO · РУССКИЙ A1 → C1 + CULTURA — Calendario 13 Lunas
   Sección completa dentro de Aprender > Idiomas y cultura:
   - Botón btnRuso (grupo aprender, sub idiomas, junto a
     Kimün Mapuzugun, Inglés, Portugués, Chino, Hindi e Italiano)
   - Diálogo rusoDialog con 7 pestañas:
     1) ☀️ Palabra del día (cirílico rotativo + transliteración + TTS ru-RU)
     2) 🌱 A1 Supervivencia (20 tarjetas + это/у меня есть + mini-diálogo)
     3) 🌿 A2 Vida diaria (14 tarjetas + pasado + futuro + direcciones)
     4) 💬 B1 Viajar, trabajar y opinar (10 + casos + aspecto verbal)
     5) 📜 B2–C1 + Cultura (expresiones, fonética que cambia todo,
         casos ↔ preposiciones, acento libre, Maslenitsa, té, Dostoievski)
     6) 💬 Frases famosas (portada del día + tarjetas con audio y copiar)
     7) 🧩 Quiz por niveles + quiz de transliteración + racha local
   - Todo local y privado por usuario:
     userData().ruso = { ok, total, streak, lastDay }
   - 100% offline. TTS usa la voz del dispositivo (speechSynthesis
     con lang ru-RU), igual que Inglés, Portugués, Chino e Hindi.
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
/* ru: cirílico · tr: transliteración simple para hispanohablantes · es: español · ex: ejemplo */
var RU_A1 = [
  { ru: 'привет', tr: 'privet', es: 'hola (informal)', ex: 'Привет, как дела? — Hola, ¿cómo estás?' },
  { ru: 'спасибо', tr: 'spasiba', es: 'gracias', ex: 'Большое спасибо. — Muchas gracias.' },
  { ru: 'пожалуйста', tr: 'pazhalusta', es: 'por favor / de nada', ex: 'Кофе, пожалуйста. — Un café, por favor.' },
  { ru: 'доброе утро', tr: 'dobraye utra', es: 'buenos días', ex: 'Доброе утро, ребята. — Buenos días, clase.' },
  { ru: 'спокойной ночи', tr: 'spakoynai nochi', es: 'buenas noches', ex: 'Спокойной ночи, до завтра. — Buenas noches, hasta mañana.' },
  { ru: 'меня зовут…', tr: 'menya zovut…', es: 'me llamo…', ex: 'Меня зовут Ана. — Me llamo Ana.' },
  { ru: 'я из Чили', tr: 'ya iz Chili', es: 'soy de Chile', ex: 'Я из Пенко, Чили. — Soy de Penco, Chile.' },
  { ru: 'вы говорите по-испански?', tr: 'vy gavarite pa-ispanski?', es: '¿habla usted español?', ex: 'Я немного говорю по-русски. — Hablo un poco de ruso.' },
  { ru: 'вода', tr: 'vadá', es: 'agua', ex: 'Стакан воды, пожалуйста. — Un vaso de agua, por favor.' },
  { ru: 'еда / хлеб', tr: 'yedá / jlep', es: 'comida / pan', ex: 'Хлеб и рыба, пожалуйста. — Pan y pescado, por favor.' },
  { ru: 'дом', tr: 'dom', es: 'casa / hogar', ex: 'Мой дом у моря. — Mi casa está junto al mar.' },
  { ru: 'сегодня', tr: 'sivodnia', es: 'hoy', ex: 'Сегодня хороший день. — Hoy es un buen día.' },
  { ru: 'я / ты / он, она', tr: 'ya / ty / on, aná', es: 'yo / tú / él, ella', ex: 'Я ученица. Ты добрый. — Soy estudiante. Eres amable.' },
  { ru: 'у меня есть…', tr: 'u menya yest…', es: 'tengo… (lit. “junto a mí hay”)', ex: 'У меня два брата. — Tengo dos hermanos.' },
  { ru: 'числа 1–10', tr: 'adin, dva, tri, chetyre, piat, shest, siem, vosiem, deviat, desiat', es: 'números 1–10', ex: 'Один, два, три… десять. — Uno, dos, tres… diez.' },
  { ru: 'красный, синий, зелёный', tr: 'krasny, sini, zilionai', es: 'rojo, azul, verde', ex: 'Море синее. — El mar es azul.' },
  { ru: 'мама, папа', tr: 'mama, papa', es: 'mamá, papá', ex: 'Моя мама хорошо готовит. — Mi mamá cocina rico.' },
  { ru: 'мне нравится…', tr: 'mne nravitsa…', es: 'me gusta…', ex: 'Мне нравится море. — Me gusta el mar.' },
  { ru: 'мне нужно…', tr: 'mne nuzhna…', es: 'necesito…', ex: 'Мне нужна помощь. — Necesito ayuda.' },
  { ru: 'до свидания', tr: 'da svidania', es: 'adiós / nos vemos', ex: 'Пока! До завтра! — ¡Chao! ¡Nos vemos mañana!' }
];
var RU_A2 = [
  { ru: 'что ты делал вчера?', tr: 'shto ty delal fchera?', es: '¿qué hiciste ayer?', ex: 'Я работал в огороде. — Trabajé en la huerta.' },
  { ru: 'я буду… / я собираюсь…', tr: 'ya budu… / ya sabiraius…', es: 'voy a… / haré…', ex: 'Я буду готовить. — Voy a cocinar.' },
  { ru: 'больше, чем / самый большой', tr: 'bolshe, chem / samy balshoy', es: 'más grande que / el más grande', ex: 'Море больше реки. — El mar es más grande que el río.' },
  { ru: 'сколько стоит? / сколько?', tr: 'skolka stoit? / skolka?', es: '¿cuánto cuesta? / ¿cuántos?', ex: 'Сколько это стоит? — ¿Cuánto cuesta esto?' },
  { ru: 'мне надо работать', tr: 'mne nada rabotat', es: 'tengo que trabajar', ex: 'Мне надо идти. — Me tengo que ir ahora.' },
  { ru: 'вы можете мне помочь?', tr: 'vy mozhete mne pamoch?', es: '¿puede ayudarme?', ex: 'Говорите медленнее, пожалуйста. — Hable más despacio, por favor.' },
  { ru: 'есть (hay)', tr: 'yest', es: 'hay', ex: 'Здесь есть рынок. — Aquí hay un mercado.' },
  { ru: 'идёт дождь / солнечно', tr: 'idiot dozhd / solnechna', es: 'llueve / hay sol', ex: 'В Пенко сегодня дождь. — Hoy llueve en Penco.' },
  { ru: 'ходил, ел, видел', tr: 'jadil, yel, videl', es: 'fui, comí, vi (pasado)', ex: 'Мы ходили на пляж. — Fuimos a la playa.' },
  { ru: 'покупки: это дорого', tr: 'pakupki: eta doraga', es: 'compras: ¡qué caro!', ex: 'Пять тысяч песо. — Cinco mil pesos.' },
  { ru: 'налево / направо', tr: 'naleva / naprava', es: 'a la izquierda / derecha', ex: 'На площади налево. — Gire a la izquierda en la plaza.' },
  { ru: 'счастливый, усталый, больной', tr: 'schislivy, ustalai, balnoy', es: 'feliz, cansado/a, enfermo/a', ex: 'Я сегодня устала. — Hoy estoy cansada.' },
  { ru: 'готовить / убирать / мыть', tr: 'gatovit / ubirat / myt', es: 'cocinar / limpiar / lavar', ex: 'Я готовлю каждый день. — Cocino todos los días.' },
  { ru: 'встретимся в три часа', tr: 'fstretimsa f tri chasa', es: 'nos vemos a las tres', ex: 'До пяти! — ¡Nos vemos a las cinco!' }
];
var RU_B1 = [
  { ru: 'я живу здесь пять лет', tr: 'ya zhivu zdes piat let', es: 'vivo aquí desde hace 5 años', ex: 'Я никогда не видел снега. — Nunca he visto nieve.' },
  { ru: 'если будет дождь, останемся дома', tr: 'yesli budet dozhd, astanemsa doma', es: 'si llueve, nos quedamos (если… то…)', ex: 'Если будешь учиться, добьёшься успеха. — Si estudias, avanzarás.' },
  { ru: 'искать / заботиться / не сдавайся', tr: 'iskat / zabotitsa / ne sdavaysa', es: 'buscar / cuidar / rendirse', ex: 'Не сдавайся! — ¡No te rindas!' },
  { ru: 'путешествие: мне нужен билет', tr: 'puteshestvie: mne nuzhen bilet', es: 'viajes: quiero un pasaje', ex: 'Билет до Консепсьона, пожалуйста. — Un pasaje a Concepción.' },
  { ru: 'работа: я отвечаю за…', tr: 'rabota: ya atvichaiu za…', es: 'trabajo: soy responsable de…', ex: 'Я отвечаю за огород. — Estoy a cargo de la huerta.' },
  { ru: 'я думаю / по-моему', tr: 'ya dumaiu / pa-moyemu', es: 'creo que / en mi opinión', ex: 'Я думаю, это хорошая идея. — Creo que es buena idea.' },
  { ru: 'раньше + verbo', tr: 'ranshe + verbo', es: 'antes / solía…', ex: 'Раньше я играл на гитаре. — Antes tocaba guitarra.' },
  { ru: 'поэтому / потому что / хотя', tr: 'paetamu / patamu shto / jatia', es: 'así que / porque / aunque', ex: 'Было холодно, поэтому остались дома. — Hacía frío, así que nos quedamos.' },
  { ru: 'здоровье: у меня болит голова', tr: 'zdarovye: u menya balit galava', es: 'salud: me duele la cabeza', ex: 'Мне нужно к врачу. — Necesito hora médica.' },
  { ru: 'письмо: с уважением', tr: 'pismo: s uvazheniem', es: 'correo: atentamente', ex: 'С уважением, Ана. — Atentamente, Ana.' }
];
var RU_B2C1 = [
  { ru: 'ломать лёд', tr: 'lamat liot', es: 'romper el hielo', ex: 'Шутка сломала лёд. — Un chiste rompió el hielo.' },
  { ru: 'без труда не выловишь и рыбку из пруда', tr: 'bez truda ne vylavish i rybku iz pruda', es: 'sin esfuerzo no hay recompensa (proverbio clásico)', ex: 'Proverbio nº1: el trabajo todo lo logra.' },
  { ru: 'язык до Киева доведёт', tr: 'yazyk da Kieva davidiot', es: 'preguntando se llega a Roma (lit. “la lengua lleva hasta Kiev”)', ex: 'No tengas miedo de preguntar en ruso.' },
  { ru: 'молодец! / давай!', tr: 'maladets! / davay!', es: '¡bien hecho! ¡vamos!', ex: 'Давай на экзамен! — ¡Ánimo con la prueba!' },
  { ru: 'когда он пришёл, я уже ушёл', tr: 'kagda on prishiol, ya uzhe ushcol', es: 'ya me había ido (уже + pasado)', ex: 'Para contar historias en pluscuamperfecto.' },
  { ru: 'если бы я учился, я бы сдал', tr: 'yesli by ya uchilsa, ya by sdal', es: 'si hubiera estudiado, habría aprobado (если бы… бы)', ex: 'Arrepentimientos y lecciones.' },
  { ru: 'пляж был убран волонтёрами', tr: 'pliash byl ubran valantiorami', es: 'la playa fue limpiada (pasiva con был + instrumental)', ex: 'Pasiva formal: был + participio + instrumental.' },
  { ru: 'она сказала, что устала', tr: 'ana skazala, shto ustala', es: 'dijo que estaba cansada (discurso indirecto con что)', ex: 'Directo → indirecto con что.' },
  { ru: 'собеседование: моя сильная сторона…', tr: 'sabisedavanie: maya silnaia starana…', es: 'entrevista: mi fortaleza es…', ex: 'Я хорошо работаю в команде. — Trabajo bien en equipo.' },
  { ru: 'однако / кроме того', tr: 'adnaka / krome tavo', es: 'sin embargo / además (ensayo)', ex: 'Однако море — это жизнь. — Sin embargo, el mar es vida.' }
];
var RU_FRASES = [
  { ru: 'Повторение — мать учения', tr: 'paftarenie — mat uchenia', es: 'la repetición es madre del saber', ex: 'Proverbio — Repite 5 minutos al día.' },
  { ru: 'Тише едешь — дальше будешь', tr: 'tishe edesh — dalshe budesh', es: 'despacio vas, lejos llegas', ex: 'Proverbio — Festina lente en ruso.' },
  { ru: 'Ученье — свет, а неученье — тьма', tr: 'uchenie — svet, a neuchenie — tma', es: 'el saber es luz, la ignorancia oscuridad', ex: 'Proverbio — Fiat lux: estudia.' },
  { ru: 'Век живи — век учись', tr: 'vek zhivi — vek uchis', es: 'vive un siglo, aprende un siglo', ex: 'Proverbio — Nunca dejes de aprender.' },
  { ru: 'Делу время, потехе час', tr: 'delu vremia, patehe chas', es: 'al trabajo su hora, al juego su hora', ex: 'Proverbio — Ora et labora.' },
  { ru: 'Капля камень точит', tr: 'kaplia kamen tochit', es: 'la gota horada la piedra', ex: 'Proverbio — Poco cada día vence.' },
  { ru: 'Терпение и труд всё перетрут', tr: 'terpenie i trut fsio peretrut', es: 'paciencia y trabajo todo lo vencen', ex: 'Proverbio — Labor omnia vincit.' },
  { ru: 'Одна голова хорошо, а две лучше', tr: 'adna galava harasho, a dve luchshe', es: 'una cabeza bien, dos mejor', ex: 'Proverbio — Pide consejo.' },
  { ru: 'Не имей сто рублей, а имей сто друзей', tr: 'ne imei sto rublei, a imei sto druzei', es: 'mejor cien amigos que cien rublos', ex: 'Proverbio — La amistad vale más.' },
  { ru: 'Сделал дело — гуляй смело', tr: 'sdelal dela — guliai smela', es: 'hecho el deber, pasea tranquilo', ex: 'Proverbio — Termina y descansa.' },
  { ru: 'Любишь кататься — люби и саночки возить', tr: 'liubish katatsa — liubi i sanachki vazit', es: 'si te gusta el paseo, carga el trineo', ex: 'Proverbio — Todo gusto pide esfuerzo.' },
  { ru: 'В гостях хорошо, а дома лучше', tr: 'f gastiaj harasho, a doma luchshe', es: 'de visita bien, en casa mejor', ex: 'Proverbio — Ubi bene, ibi patria.' },
  { ru: 'Хлеб — всему голова', tr: 'jlep — fsemu galava', es: 'el pan es cabeza de todo', ex: 'Proverbio — Honra el pan diario.' },
  { ru: 'Мир не без добрых людей', tr: 'mir ne bez dobryj liudei', es: 'el mundo no está sin buena gente', ex: 'Proverbio — Confía en tu comunidad.' },
  { ru: 'Мороз и солнце; день чудесный!', tr: 'maros i solntse; den chudesny!', es: '¡helada y sol; día maravilloso!', ex: 'Pushkin — Poema de invierno para recitar.' },
  { ru: 'Сказка ложь, да в ней намёк', tr: 'skaska losh, da v nei namiok', es: 'el cuento es mentira, pero trae moraleja', ex: 'Pushkin — Cada cuento enseña.' },
  { ru: 'Все счастливые семьи похожи друг на друга', tr: 'fse schastlivye semji pahozhi', es: 'todas las familias felices se parecen', ex: 'Tolstoi, Anna Karenina — Inicio más famoso.' },
  { ru: 'Красота спасёт мир', tr: 'krasata spasiot mir', es: 'la belleza salvará al mundo', ex: 'Dostoievski, El idiota — La belleza que une.' },
  { ru: 'Поехали!', tr: 'paejali!', es: '¡vamos!', ex: 'Gagarin (1961) — Primera palabra en el espacio.' },
  { ru: 'Тяжело в учении — легко в бою', tr: 'tiazholo v uchenii — legko v baiu', es: 'duro entrenar, fácil combatir', ex: 'Suvorov — Entrena fuerte, rinde fácil.' },
  { ru: 'Береги честь смолоду', tr: 'beregi chest smoladu', es: 'cuida tu honor desde joven', ex: 'Pushkin, La hija del capitán — Tu nombre te precede.' },
  { ru: 'Краткость — сестра таланта', tr: 'kratkast — sestra talanta', es: 'la brevedad es hermana del talento', ex: 'Chéjov — Di poco y claro.' },
  { ru: 'Доверяй, но проверяй', tr: 'daveriai, no praveriai', es: 'confía, pero verifica', ex: 'Proverbio — Cum grano salis.' },
  { ru: 'Лучше поздно, чем никогда', tr: 'luchshe pozdna, chem nikagda', es: 'mejor tarde que nunca', ex: 'Proverbio — Empieza hoy.' },
  { ru: 'Дарёному коню в зубы не смотрят', tr: 'darianomu kaniu v zuby ne smatriat', es: 'a caballo regalado no se le miran dientes', ex: 'Proverbio — Agradece el regalo.' },
  { ru: 'Человек — это звучит гордо!', tr: 'chelovek — eta zvuchit gorda!', es: '¡el Hombre suena orgulloso!', ex: 'Gorki — Dignidad humana.' },
  { ru: 'С миру по нитке — голому рубаха', tr: 's miru pa nitke — golomu rubaja', es: 'de cada uno un hilo, al desnudo camisa', ex: 'Proverbio — Comunidad que viste.' },
  { ru: 'Язык до Киева доведёт', tr: 'yazyk da Kieva davidiot', es: 'preguntando se llega lejos', ex: 'Proverbio — Pregunta sin miedo.' },
  { ru: 'Без труда не выловишь и рыбку из пруда', tr: 'bez truda ne vylavish i rybku', es: 'sin esfuerzo ni un pez del estanque', ex: 'Proverbio nº1 — Trabaja y logra.' },
  { ru: 'Давай, Россия! / Давай, Penco!', tr: 'davai, Rassia! / davai, Penco!', es: '¡vamos Rusia! ¡vamos Penco!', ex: 'Grito deportivo — Úsalo en el partido.' }
];
var RU_FON = [
  ['Ы — la vocal que no existe en español', 'ты (tú) ≠ ти. Pon la lengua como para decir “i” pero retrae el centro: sale un sonido entre i y u. Practica: мы, вы, ты, рыба (pez). Te entenderán aunque no salga perfecto el primer mes.'],
  ['Ь y Ъ — blando y duro (matan o salvan palabras)', 'мать (madre) ≠ мат (grosería) · сел (se sentó) ≠ съел (se comió). Ь ablanda la consonante anterior (como una “i” fantasma). Ъ separa: подъезд (entrada) se lee pad-YEZD.'],
  ['Ш vs Щ — dura vs suave', 'Ш (sha dura: шум, ruido) con lengua atrás · Щ (schia suave: щи, sopa) con sonrisa. Борщ se dice “borsch” suave. Practica el par: шесть (seis) vs шить (coser).'],
  ['Р vibrante + ensordecimiento final', 'Р siempre vibrante simple (una sola vibración): река, море. Y la sonora se apaga al final: хлеб suena “jlep”, город suena “gorat”, друг suena “druk”. Regla: b→p, d→t, g→k, v→f, zh→sh al final.'],
  ['О → А: аканье (la “o” átona suena “a”)', 'молоко se dice “malakó” · хорошо = “jarashó” · Москва = “Maskvá”. Solo la O acentuada suena O. Marca el acento en tu cuaderno: el acento en ruso es libre y lo cambia todo.'],
  ['Е / Э / Ё — tres “e”', 'Э (e abierta, al inicio: это = eta) · Е (ye tras vocal: мое = mayó) · Ё (YO siempre acentuada: всё = fso, “todo” ≠ все = fse, “todos”). Dos puntitos que cambian el sentido: nunca los ignores.'],
  ['Acento libre: замок vs замок', 'за́мок (castillo) ≠ замо́к (cerradura) · му́ка (harina) ≠ мука́ (tormento). El acento se mueve al conjugar: пишу́ / пи́шешь. Aprende cada palabra CON su acento marcado desde el día 1.'],
  ['Х, Ж, Ц, Ч — las “difíciles” que son fáciles', 'Х = jota suave (хлеб = jlep) · Ж = “j” francesa (журнал = zhurnal) · Ц = “ts” (цветок = tsvetok, flor) · Ч = “ch” suave (чай = chay, té). Con estas 4 lees el 90% de los carteles.']
];
var RU_CASOS = [
  ['🙋 Ты (tú) vs Вы (usted) — cuándo cuál', 'Ты: familia, amigos, niños, pares jóvenes. Вы: mayores, desconocidos, clientes, jefes, profes (verbo en plural: Вы говорите). Con Вы nunca fallas: empieza SIEMPRE en Вы. Tutear sin permiso suena rudo.'],
  ['🧭 6 casos: el mapa del ruso', 'Именительный (quién: мама) · Родительный (de quién: мамы) · Дательный (a quién: маме) · Винительный (a quién/qué: маму) · Творительный (con quién: мамой) · Предложный (sobre quién: о маме. Solo tras в/на/о. La pregunta manda: кто? → кого? → кому? → кем? → о ком?'],
  ['🔀 Sin “de / a / con”: van pegados al final', 'El español usa preposiciones delante; el ruso cambia la TERMINACIÓN. книга мамы (el libro DE mamá) · даю маме (doy A mamá) · с мамой (CON mamá) · о маме (SOBRE mamá). Una palabra, 6 trajes.'],
  ['⚖️ hacer vs haber hecho: вид (aspecto)', 'делать (hacer, proceso) ≠ сделать (hacer y terminar). Pastel imperfecto: я читал (leía/estaba leyendo) · perfectivo: я прочитал (leí y terminé). Pregunta: ¿proceso o resultado? El prefijo с-/про- suele marcar “terminado”.'],
  ['🚶 идти vs ехать (y el pasado que dice género)', 'идти (ir a pie) ≠ ехать (ir en transporte). Y el pasado concierta en género: он говорил / она говорила / они говорили. Escucha la -а final: te dice si hablaba él o ella.'],
  ['🚫 нет + genitivo · у меня нет…', 'No hay / no tengo exigen GENITIVO: у меня нет времени (no tengo tiempo) · здесь нет молока (aquí no hay leche). Afirmar en nominativo + negar en genitivo: хлеб есть → хлеба нет. Es la regla nº1 del mercado.'],
  ['📏 Regla de oro: orden flexible pero verbo al centro', 'SVO base (я люблю море), pero el caso permite jugar: море люблю я (al mar amo yo, poético). Empieza siempre SVO + preposiciones simples (в, на, с, к, о): el oído ordena el resto solo.']
];

function allRu() { return RU_A1.concat(RU_A2, RU_B1, RU_FRASES, RU_B2C1); }

/* ---------------- ESTADO ---------------- */
var ruTab = 'palabra';
var ruQuizQ = null;
var ruQuizLevel = 'todo';
var ruQuizMode = 'significado';
var ruShown = null; // palabra visible en "Palabra del día" (para 🎲 y 🔊 ejemplo)

function getRuData() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { ok: 0, total: 0, streak: 0, lastDay: '' };
    if (!u.ruso) u.ruso = { ok: 0, total: 0, streak: 0, lastDay: '' };
    return u.ruso;
  } catch (e) { return { ok: 0, total: 0, streak: 0, lastDay: '' }; }
}
function ruDayIndex(n) {
  try {
    var d = new Date();
    var s = d.getFullYear() * 1000 + Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
    return s % n;
  } catch (e) { return 0; }
}
/* ---------------- AUDIO (TTS ru robusto) ---------------- */
var ruVoicesCache = null;
var ruSlow = false;
var ruResumeTimer = null;
var ruSpeaking = false;
var ruSpeakToken = 0;
var ruOnlineAudio = null;
function ruEnsureVoices() {
  try {
    if (!('speechSynthesis' in window)) return [];
    var vs = window.speechSynthesis.getVoices() || [];
    if (vs && vs.length) ruVoicesCache = vs;
    return vs && vs.length ? vs : (ruVoicesCache || []);
  } catch (e) { return ruVoicesCache || []; }
}
try {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    var ruWarm = function () { try { ruEnsureVoices(); } catch (e) {} };
    try { ruWarm(); } catch (e) {}
    try {
      if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = function () { try { ruEnsureVoices(); ruRefreshVoiceStatus(); } catch (e) {} };
      }
    } catch (e) {}
  }
} catch (e) {}
function ruPickVoice() {
  var vs = ruEnsureVoices();
  if (!vs || !vs.length) return null;
  var score = function (v) {
    var lang = String((v && v.lang) || '');
    var name = String((v && v.name) || '').toLowerCase();
    var l = lang.toLowerCase();
    if (/^ru[-_]ru/i.test(lang)) return 100;
    if (/^ru/i.test(l) && /milena|yuri|irina|pavel|anna|dariya|google|microsoft|samsung/i.test(name)) return 95;
    if (/^ru/i.test(l)) return 85;
    if (/russian|русск/i.test(name)) return 70;
    return -1;
  };
  var best = null, bestScore = -1;
  for (var i = 0; i < vs.length; i++) {
    var s = score(vs[i]);
    if (s > bestScore) { bestScore = s; best = vs[i]; }
  }
  return bestScore >= 0 ? best : null;
}
function ruHasRuVoice() { return !!ruPickVoice(); }
function ruClearResume() {
  try { if (ruResumeTimer) { clearInterval(ruResumeTimer); ruResumeTimer = null; } } catch (e) {}
}
function ruStop() {
  try { ruSpeakToken++; } catch (e) {}
  try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
  try { if (ruOnlineAudio) { ruOnlineAudio.pause(); try { ruOnlineAudio.src = ''; } catch (x) {} ruOnlineAudio = null; } } catch (e) {}
  ruClearResume();
  ruSpeaking = false;
  try { ruPaintSpeakState(); } catch (e) {}
}
function ruVoiceStatus() {
  try {
    if (!('speechSynthesis' in window)) return { ok: false, msg: 'Este dispositivo no tiene voz disponible (speechSynthesis ausente).' };
    var v = ruPickVoice();
    if (v) return { ok: true, msg: '🔊 Voz: ' + (v.name || 'rusa') + ' (' + (v.lang || 'ru-RU') + ')' };
    return { ok: false, msg: '⚠️ Sin voz rusa instalada: se intentará igual, pero puede sonar con acento raro o quedar en silencio.' };
  } catch (e) { return { ok: false, msg: '' }; }
}
function ruCountVoices() {
  try {
    var vs = ruEnsureVoices();
    var n = vs ? vs.length : 0, rc = 0;
    for (var i = 0; i < (vs || []).length; i++) {
      var l = String((vs[i] && vs[i].lang) || '').toLowerCase();
      var nm = String((vs[i] && vs[i].name) || '').toLowerCase();
      if (/^ru/.test(l) || /russian|русск/.test(nm)) rc++;
    }
    return { total: n, ru: rc };
  } catch (e) { return { total: 0, ru: 0 }; }
}
function ruRefreshVoiceStatus() {
  var el = $('ruVoiceStatus');
  if (!el) return;
  var st = ruVoiceStatus();
  var c = ruCountVoices();
  var info = ' <span class="muted">(' + c.ru + ' rusa(s) de ' + c.total + ' voces)</span>';
  el.innerHTML = esc(st.msg) + info +
    ' <button type="button" id="ruVoiceTest" class="btn su-337714">🔊 Probar voz</button>' +
    ' <button type="button" id="ruOnlineTest" class="btn su-337714" title="Usa internet si tu equipo no tiene voz rusa">🌐 Oír online</button>' +
    (st.ok ? '' : '<br><span class="muted">Sin voz rusa el audio local puede quedar mudo: usa 🌐 Oír online (requiere internet) o instala voz rusa: <b>Windows:</b> Configuración → Hora e idioma → Voz → Agregar voz (Ruso). <b>Android:</b> Ajustes → Idioma → Salida TTS → instalar ruso. <b>iPhone:</b> Ajustes → Accesibilidad → Voces → Ruso. Luego recarga.</span>');
  try {
    var bt = $('ruVoiceTest');
    if (bt) bt.onclick = function (e) { try { e.preventDefault(); } catch (x) {} ruSpeak('привет', { forceLocal: true }); };
    var on = $('ruOnlineTest');
    if (on) on.onclick = function (e) { try { e.preventDefault(); } catch (x) {} ruSpeakOnline(ruShown ? ruShown.ru : 'привет'); };
  } catch (e) {}
}
function ruVozLimpia(t) {
  // Evita que el locutor del PC diga "barra", "dos puntos", "guion", etc.
  // "еда / хлеб" -> "еда, хлеб" (pausa en vez de "barra").
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
function ruSpeakOnline(txt) {
  var text = ruVozLimpia(txt);
  if (!text) text = String(txt == null ? '' : txt).trim();
  if (!text) return;
  try { ruStop(); } catch (e) {}
  try {
    var url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=ru&client=tw-ob&q=' + encodeURIComponent(text);
    var a = new Audio(url);
    ruOnlineAudio = a;
    ruSpeaking = true;
    try { ruPaintSpeakState(); } catch (e) {}
    a.onended = function () { ruSpeaking = false; ruOnlineAudio = null; try { ruPaintSpeakState(); } catch (x) {} };
    a.onerror = function () {
      ruSpeaking = false; ruOnlineAudio = null;
      try { ruPaintSpeakState(); } catch (x) {}
      alert('No se pudo reproducir el audio online. Revisa tu conexión o instala una voz rusa en el dispositivo.');
    };
    var p = a.play();
    if (p && p.catch) p.catch(function () {
      ruSpeaking = false; ruOnlineAudio = null;
      try { ruPaintSpeakState(); } catch (x) {}
    });
  } catch (e) { alert('No se pudo reproducir el audio online.'); }
}
function ruPaintSpeakState() {
  try {
    var btns = document.querySelectorAll('#rusoDialog .ru-speaking');
    for (var i = 0; i < btns.length; i++) {
      if (ruSpeaking) btns[i].classList.add('btn-accent');
      else btns[i].classList.remove('btn-accent');
    }
  } catch (e) {}
}
function ruSpeak(txt, opts) {
  opts = opts || {};
  var text = ruVozLimpia(txt);
  if (!text) text = String(txt == null ? '' : txt).trim();
  if (!text) return;
  if (opts.forceOnline) { ruSpeakOnline(text); return; }
  try {
    if (!('speechSynthesis' in window)) { ruSpeakOnline(text); return; }
    if (!opts.forceLocal && !ruHasRuVoice()) { ruSpeakOnline(text); return; }
    var my = ++ruSpeakToken;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    try { if (ruOnlineAudio) { ruOnlineAudio.pause(); ruOnlineAudio = null; } } catch (e) {}
    ruClearResume();
    ruSpeaking = false;
    try { ruPaintSpeakState(); } catch (e) {}
    setTimeout(function () {
      if (my !== ruSpeakToken) return;
      try {
        try { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); } catch (x) {}
        var u = new SpeechSynthesisUtterance(text);
        var voice = ruPickVoice();
        if (voice) { try { u.voice = voice; } catch (e) {} }
        u.lang = (voice && voice.lang) ? voice.lang : 'ru-RU';
        var slow = (opts.slow != null) ? !!opts.slow : ruSlow;
        u.rate = slow ? 0.55 : 0.8;
        u.pitch = 1;
        u.volume = 1;
        ruSpeaking = true;
        try { ruPaintSpeakState(); } catch (e) {}
        var fellBack = false;
        u.onend = function () { ruSpeaking = false; ruClearResume(); try { ruPaintSpeakState(); } catch (e) {} if (typeof opts.onend === 'function') { try { opts.onend(); } catch (x) {} } };
        u.onerror = function (ev) {
          ruSpeaking = false; ruClearResume();
          try { ruPaintSpeakState(); } catch (e) {}
          try { ruRefreshVoiceStatus(); } catch (e) {}
          if (!fellBack && !opts.forceLocal && !ruHasRuVoice()) {
            fellBack = true;
            ruSpeakOnline(text);
            return;
          }
          if (typeof opts.onerror === 'function') { try { opts.onerror(ev); } catch (x) {} }
        };
        window.speechSynthesis.speak(u);
        try {
          ruClearResume();
          ruResumeTimer = setInterval(function () {
            try {
              if (window.speechSynthesis && window.speechSynthesis.speaking) {
                window.speechSynthesis.resume();
              } else { ruClearResume(); }
            } catch (e) { ruClearResume(); }
          }, 8000);
        } catch (e) {}
        try { ruRefreshVoiceStatus(); } catch (e) {}
      } catch (e) {}
    }, 120);
  } catch (e) {}
}
function ruSpeakExample(ex) {
  var t = String(ex || '');
  var cut = t.split('—')[0].trim().replace(/[.…!！?？]+.*$/, '').trim();
  if (!cut) cut = t;
  var m = cut.match(/[А-Яа-яЁё]+/g);
  if (m && m.join(' ').length >= 2) cut = m.join(' ');
  ruSpeak(cut);
}
function ruQuizPool() {
  if (ruQuizLevel === 'a1') return RU_A1;
  if (ruQuizLevel === 'a2') return RU_A2;
  if (ruQuizLevel === 'b1') return RU_B1;
  if (ruQuizLevel === 'frases') return RU_FRASES;
  if (ruQuizLevel === 'avanzado') return RU_B2C1;
  return allRu();
}

function renderRuStreak() {
  var b = $('ruStreakBox'); if (!b) return;
  var d = getRuData();
  var pct = d.total ? Math.round(d.ok / d.total * 100) : 0;
  b.innerHTML = '<b>🪆 Tu ruso:</b> ' + d.ok + '/' + d.total + ' correctas (' + pct + '%) · racha ' + d.streak + ' 🔥 ' +
    '<span class="muted su-11a508">— 1 palabra por día · A1→C1 + cultura · todo guardado local y privado.</span>';
}
function ruCard(item, lv) {
  return '<button type="button" class="btn eng-word su-6cd6a1" data-w="' + esc(item.ru) + '"><b>🔊 ' + esc(item.ru) + '</b> ' +
    '<span class="chip su-0d5be0">' + esc(lv) + '</span><br><span class="su-2f290d">' + esc(item.tr) + ' · ' + esc(item.es) + '</span><br>' +
    '<span class="muted su-11a508">“' + esc(item.ex) + '”</span></button>';
}

var ruFraseIdx = -1;
function renderRuPanel(tab) {
  try { ruStop(); } catch (e) {}
  ruTab = tab || ruTab;
  var ids = { palabra: 'tabRU1', a1: 'tabRU2', a2: 'tabRU3', b1: 'tabRU4', cultura: 'tabRU5', frases: 'tabRU7', quiz: 'tabRU6' };
  Object.keys(ids).forEach(function (k) { var el = $(ids[k]); if (el) el.classList.toggle('btn-accent', k === ruTab); });
  renderRuStreak();
  var box = $('ruPanel'); if (!box) return;
  var html = '';
  if (ruTab === 'palabra') {
    var all = allRu();
    var dayIdx = ruDayIndex(all.length);
    if (!ruShown || ruShown._day !== dayIdx || !ruShown._rand) {
      var base = all[dayIdx];
      ruShown = { ru: base.ru, tr: base.tr, es: base.es, ex: base.ex, _day: dayIdx };
    }
    var w = ruShown;
    var rel = [all[(dayIdx + 7) % all.length], all[(dayIdx + 13) % all.length]];
    var fecha = '';
    try { fecha = cal.fmtDate.format(new Date()); } catch (e) { try { fecha = new Date().toLocaleDateString(); } catch (e2) { fecha = ''; } }
    html += '<div class="menstrual-card su-3fa1a8">' +
      '<p class="muted su-11a508">☀️ СЛОВО ДНЯ · PALABRA DEL DÍA · ' + esc(fecha) + ' · ' + all.length + ' palabras y frases</p>' +
      '<div class="su-6adb68">' + esc(w.ru) + '</div>' +
      '<div class="su-cd8bd8"><b>' + esc(w.tr) + '</b> · ' + esc(w.es) + '</div>' +
      '<p class="muted su-2b0979">“' + esc(w.ex) + '”</p>' +
      '<div class="su-9bc2df"><button type="button" id="ruSpeakBtn" class="btn btn-accent su-30e741 ru-speaking">🔊 Escuchar (по-русски)</button> ' +
      '<button type="button" id="ruOnlineBtn" class="btn su-30e741" title="Audio por internet (funciona aunque tu equipo no tenga voz rusa)">🌐 Online</button> ' +
      '<button type="button" id="ruSlowBtn" class="btn su-30e741">🐢 Lento: ' + (ruSlow ? 'ON' : 'OFF') + '</button> ' +
      '<button type="button" id="ruExBtn" class="btn su-30e741">🗣️ Oír ejemplo</button> ' +
      '<button type="button" id="ruStopBtn" class="btn su-30e741">⏹ Detener</button> ' +
      '<button type="button" id="ruNextBtn" class="btn su-30e741">🎲 Otra palabra</button></div>' +
      '<p id="ruVoiceStatus" class="muted su-11a508"></p></div>' +
      '<div class="help-grid su-d2c171">' +
      rel.map(function (r) { return '<div class="help-card"><h4>' + esc(r.ru) + ' <span class="muted">' + esc(r.tr) + '</span></h4><p class="su-11a508">' + esc(r.es) + '<br><span class="muted">“' + esc(r.ex) + '”</span></p></div>'; }).join('') + '</div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>🗣️ ¿Cómo practicar?</h4><p class="su-b439ab">1) <b>Escucha</b> con 🔊 y repite 3 veces en voz alta.<br>2) <b>Escribe</b> 1 frase con la palabra en las Notas del día.<br>3) <b>Úsala hoy</b>: 1 palabra/día → ~365/año.<br>Pasa a A2 cuando sepas 20 sin mirar (cirílico + acento).</p></div>' +
      '<div class="help-card"><h4>📚 Niveles (CEFR)</h4><p class="su-b439ab">🌱 <b>A1:</b> sobrevivir (привет, вода, дом).<br>🌿 <b>A2:</b> vida diaria (pasado, futuro, compras).<br>💬 <b>B1:</b> viaje + trabajo + opinión (casos).<br>📜 <b>B2–C1:</b> proverbios, pasiva, entrevista + cultura.</p></div></div>';
  } else if (ruTab === 'a1') {
    html += '<div class="menstrual-card su-5a6934"><h4 class="su-752b1a">🌱 A1 Supervivencia — sobrevive en ruso</h4>' +
      '<p class="muted su-a6c665">Meta: presentarte, pedir agua/comida, contar 1–10. Gramática: <b>у меня есть (tener), нет para negar, вы…? para preguntar</b>. No hay artículos (el/la) ni verbo “ser” en presente (я студент = “yo estudiante”). Toca 🔊 en cada tarjeta para oír (ru-RU).</p>' +
      '<div class="su-5e3875">' + RU_A1.map(function (x) { return ruCard(x, 'A1'); }).join('') + '</div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>⚙️ У меня есть (el 50% del día)</h4><p class="su-583677"><b>У меня есть</b> (yo tengo) · <b>У тебя есть</b> (tú tienes) · <b>У вас есть</b> (usted tiene)<br><b>Это</b> (esto es) · <b>Здесь есть</b> (aquí hay)<br><b>У меня нет времени</b> (no tengo tiempo, ¡con genitivo!)<br><span class="muted">Negación: <b>нет / не</b>. Pregunta: entonación que sube o <b>ли</b>.</span></p></div>' +
      '<div class="help-card"><h4>🎭 Mini-diálogo: en la feria</h4><p class="su-583677">— <b>Здравствуйте! Сколько стоит?</b> (¡Hola! ¿Cuánto cuesta?)<br>— <b>Пять тысяч песо.</b> (Cinco mil pesos.)<br>— <b>Спасибо! До свидания!</b> (¡Gracias! ¡Adiós!)<br><span class="muted">Practica: una persona por línea. En Rusia cambia “pesos” por “рублей” (rubléi).</span></p></div></div>';
  } else if (ruTab === 'a2') {
    html += '<div class="menstrual-card su-018729"><h4 class="su-721a46">🌿 A2 Vida diaria — el día a día</h4>' +
      '<p class="muted su-a6c665">Meta: contar qué hiciste, planes, compras y direcciones. Gramática: <b>pasado en -л (делал/делала), буду + infinitivo, больше/самый, мочь (poder), надо (hay que)</b>.</p>' +
      '<div class="su-5e3875">' + RU_A2.map(function (x) { return ruCard(x, 'A2'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>🎭 Mini-diálogo: pidiendo dirección en Penco</h4><p class="su-583677">— <b>Извините, где пляж?</b> (Disculpa, ¿dónde queda la playa?)<br>— <b>Идите прямо, потом налево.</b> (Sigue recto y gira a la izquierda.)<br>— <b>Спасибо!</b> — <b>Пожалуйста!</b> (¡Gracias! / ¡De nada!)<br><span class="muted">Clave: где (dónde) + налево/направо (izquierda/derecha) + прямо (recto).</span></p></div>';
  } else if (ruTab === 'b1') {
    html += '<div class="menstrual-card su-d4d722"><h4 class="su-7c91e2">💬 B1 Intermedio — viajar, trabajar y opinar</h4>' +
      '<p class="muted su-a6c665">Meta: viajar, trabajar y opinar. Gramática estrella: <b>если… то… (si… entonces…)</b> + instrumental (я доволен работой) + preposicional (о море) + conectores поэтому/хотя.</p>' +
      '<div class="su-5e3875">' + RU_B1.map(function (x) { return ruCard(x, 'B1'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>🎭 Mini-diálogo: viaje a Concepción</h4><p class="su-583677">— <b>Мне нужен билет до Консепсьона.</b> (Quiero un pasaje a Concepción.)<br>— <b>В одну сторону или туда-обратно?</b> (¿Solo ida o ida y vuelta?) — <b>Туда-обратно, пожалуйста.</b><br>— <b>Вы давно здесь живёте?</b> — <b>Пять лет.</b> (¿Hace cuánto vives aquí? Cinco años.)<br><span class="muted">Practica con horarios, precios y “verbos que concuerdan en género”.</span></p></div>';
  } else if (ruTab === 'cultura') {
    html += '<div class="menstrual-card su-5b7cd0"><h4 class="su-399074">📜 B2–C1 Avanzado + Cultura viva</h4>' +
      '<p class="muted su-a6c665">Meta: entrevistas, proverbios y no pasar vergüenza con ты/вы ni con el acento. Gramática: <b>уже + pasado (ya…), если бы… бы (condicional), pasiva con был, indirecto con что, conectores однако/кроме того</b>.</p>' +
      '<div class="su-5e3875">' + RU_B2C1.map(function (x) { return ruCard(x, 'B2–C1'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>💬 Frases famosas</h4>' +
      '<p class="su-11a508">Las <b>30 frases famosas</b> tienen su propia pestaña: portada del día + tarjetas con 🔊 Escuchar y 📋 Copiar.</p>' +
      '<div class="su-9bc2df"><button type="button" class="btn btn-accent su-30e741 ru-goto-frases">💬 Ver frases famosas →</button></div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>⚠️ 8 sonidos que salvan vidas</h4><p class="su-583677">' + RU_FON.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div>' +
      '<div class="help-card"><h4>🙋 Ты ↔ Вы + 6 casos ¿Cuál uso?</h4><p class="su-583677">' + RU_CASOS.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>🪆 Alfabeto en 1 minuto: lo que ya sabes</h4><p class="su-583677">Ya lees 12 letras: <b>А К М О Т (iguales)</b> + <b>В Е Н Х Р С (parecidas: ve, ye, en, ja, er, es)</b>. Solo 21 son nuevas, y 4 son parejas: <b>Б/б Д/д Л/л П/п</b>. En 28 días lees carteles de Penco… y de Moscú.</p></div>' +
      '<div class="help-card"><h4>🍵 Cultura para probar y celebrar</h4><p class="su-b439ab"><b>Probar:</b> té con limón (чай), borsch (борщ), pelmeni (пельмени): lee la receta en ruso y cocina.<br><b>Escuchar:</b> «Катюша», «Подмосковные вечера», 1 canción × 7 días.<br><b>Celebrar:</b> Maslenitsa (Масленица, semana de panqueques, fin del invierno) y Año Nuevo (Новый год, 31 dic, más grande que Navidad).<br><span class="muted">Sabios: Dostoievski (leer 1 página/día), la dacha (casa de campo) y el baño ruso (баня): el calendario también es ritual. Здравствуйте con sonrisa abre cualquier puerta.</span></p></div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>💼 Kit entrevista de trabajo</h4><p class="su-583677">— <b>Расскажите о себе.</b> (Cuénteme de usted.)<br>— <b>Я ответственный, хорошо работаю в команде.</b> (Soy responsable y trabajo bien en equipo.)<br>— <b>Моя сильная сторона… Моя цель…</b> (Mi fortaleza es… mi meta es…)<br><span class="muted">Cierra: «Спасибо за ваше время». (Gracias por su tiempo.)</span></p></div>';
  } else if (ruTab === 'frases') {
    if (ruFraseIdx < 0) ruFraseIdx = ruDayIndex(RU_FRASES.length);
    var FDAY = RU_FRASES[ruFraseIdx % RU_FRASES.length];
    var fdate = '';
    try { fdate = cal.fmtDate.format(new Date()); } catch (e) { fdate = new Date().toLocaleDateString(); }
    html += '<div class="menstrual-card su-3fa1a8">' +
      '<p class="muted su-11a508">💬 FRASE DEL DÍA · ' + esc(fdate) + ' · ' + RU_FRASES.length + ' frases famosas</p>' +
      '<div class="su-6adb68">' + '“' + esc(FDAY.ru) + '”</div>' +
      '<div class="su-cd8bd8"><b>' + esc(FDAY.es) + '</b></div>' +
      '<p class="su-11a508">🔤 <b>' + esc(FDAY.tr) + '</b></p>' +
            '<p class="muted su-2b0979">“' + esc(FDAY.ex) + '”</p>' +
      '<div class="su-9bc2df"><button type="button" class="btn btn-accent su-30e741 ru-hear" data-w="' + esc(FDAY.ru) + '">🔊 Escuchar</button> ' +
      '<button type="button" id="ruFraseRnd" class="btn su-30e741">🎲 Otra frase</button></div></div>' +
      RU_FRASES.map(function (x) {
        return '<div class="menstrual-card su-4adf8c"><h4>“' + esc(x.ru) + '”</h4>' +
          '<p><b>' + esc(x.es) + '</b>' +
          '<br><span class="su-11a508">🔤 ' + esc(x.tr) + '</span>' +
          '<br><span class="muted">“' + esc(x.ex) + '”</span></p>' +
          '<div class="su-9bc2df"><button type="button" class="btn btn-accent su-30e741 ru-hear" data-w="' + esc(x.ru) + '">🔊 Escuchar</button> ' +
          '<button type="button" class="btn su-30e741 ru-copy" data-w="' + esc(x.ru) + '|' + esc(x.es) + '">📋 Copiar</button></div></div>';
      }).join('') +
      '<div class="menstrual-card su-5a6934"><h4 class="su-752b1a">🗣️ ¿Cómo practicar?</h4>' +
      '<p class="muted su-a6c665">1) <b>Escucha</b> la frase del día con 🔊 y repítela 3 veces en voz alta.<br>2) <b>Copia</b> tu favorita con 📋 y pégala en las Notas del día.<br>3) <b>Úsala hoy</b>: una frase al día son 365 al año.</p></div>';
  } else if (ruTab === 'quiz') {
    var d = getRuData();
    if (!ruQuizQ) {
      var pool = ruQuizPool();
      var wq = pool[Math.floor(Math.random() * pool.length)];
      var opts = {};
      opts[ruQuizMode === 'translit' ? wq.tr : wq.es] = 1;
      var guard = 0;
      while (Object.keys(opts).length < 4 && guard < 60) { guard++; var c = pool[Math.floor(Math.random() * pool.length)]; opts[ruQuizMode === 'translit' ? c.tr : c.es] = 1; }
      var arr = Object.keys(opts).sort(function () { return Math.random() - 0.5; });
      ruQuizQ = { w: wq, opts: arr };
    }
    var q = ruQuizQ;
    var lvBtn = function (v, l) { return '<button type="button" class="btn ru-lv' + (ruQuizLevel === v ? ' btn-accent' : '') + ' su-337714" data-lv="' + v + '">' + l + '</button>'; };
    var mdBtn = function (v, l) { return '<button type="button" class="btn ru-md' + (ruQuizMode === v ? ' btn-accent' : '') + ' su-337714" data-md="' + v + '">' + l + '</button>'; };
    html += '<div class="menstrual-card su-1f2df9"><h4 class="su-399074">🧩 Quiz por niveles</h4>' +
      '<div class="su-a8712a">' + lvBtn('todo', '🌎 Todo') + lvBtn('a1', '🌱 A1') + lvBtn('a2', '🌿 A2') + lvBtn('b1', '💬 B1') + lvBtn('frases', '💬 Frases') + lvBtn('avanzado', '📜 B2–C1') + '</div>' +
      '<div class="su-a8712a">' + mdBtn('significado', '🇪🇸 Significado') + mdBtn('translit', '🔤 Transliteración') + '</div>' +
      '<div class="su-73ce29">“' + esc(q.w.ru) + '” <span class="muted su-11a508">' + (ruQuizMode === 'translit' ? '¿cómo se pronuncia?' : '¿qué significa?') + '</span></div>' +
      '<button type="button" id="ruQuizSpeak" class="btn su-337714 ru-speaking">🔊 Escuchar</button> ' +
      '<button type="button" id="ruQuizOnline" class="btn su-337714" title="Audio por internet">🌐</button> ' +
      '<button type="button" id="ruQuizSlow" class="btn su-337714">🐢 Lento: ' + (ruSlow ? 'ON' : 'OFF') + '</button> ' +
      '<button type="button" id="ruQuizStop" class="btn su-337714">⏹</button>' +
      '<p id="ruVoiceStatus" class="muted su-11a508"></p>' +
      '<div class="su-ae0e71">' + q.opts.map(function (o) { return '<button type="button" class="btn ru-opt su-046678" data-o="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div>' +
      '<div id="ruQuizFb" class="su-ac1122"></div>' +
      '<p class="muted su-e13d76">Correctas ' + d.ok + '/' + d.total + ' · racha ' + d.streak + ' · nivel: <b>' + esc(ruQuizLevel) + '</b> · modo: <b>' + esc(ruQuizMode) + '</b> · banco: ' + ruQuizPool().length + ' palabras/frases</p></div>';
  }
  box.innerHTML = html + '<p class="muted su-a953a7">🔊 Toca cualquier tarjeta para oír en ruso (voz rusa del dispositivo). El quiz suma a tu racha local y privada.</p>';
  try { ruEnsureVoices(); ruRefreshVoiceStatus(); } catch (e) {}
  try { ruPaintSpeakState(); } catch (e) {}
  var sp = $('ruSpeakBtn');
  if (sp) sp.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (ruShown) ruSpeak(ruShown.ru); };
  var onB = $('ruOnlineBtn');
  if (onB) onB.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (ruShown) ruSpeakOnline(ruShown.ru); };
  var sl = $('ruSlowBtn');
  if (sl) sl.onclick = function (e) { try { e.preventDefault(); } catch (x) {} ruSlow = !ruSlow; sl.textContent = '🐢 Lento: ' + (ruSlow ? 'ON' : 'OFF'); if (ruShown) ruSpeak(ruShown.ru); };
  var exB = $('ruExBtn');
  if (exB) exB.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (ruShown) ruSpeakExample(ruShown.ex); };
  var stB = $('ruStopBtn');
  if (stB) stB.onclick = function (e) { try { e.preventDefault(); } catch (x) {} ruStop(); };
  var nx = $('ruNextBtn');
  if (nx) nx.onclick = function () {
    try {
      var a = allRu();
      var di = ruDayIndex(a.length);
      var pick = a[Math.floor(Math.random() * a.length)];
      var gd = 0;
      while (ruShown && pick.ru === ruShown.ru && gd < 25) { gd++; pick = a[Math.floor(Math.random() * a.length)]; }
      ruShown = { ru: pick.ru, tr: pick.tr, es: pick.es, ex: pick.ex, _day: di, _rand: 1 };
      ruStop();
      renderRuPanel('palabra');
      if (ruShown) ruSpeak(ruShown.ru);
    } catch (e) { try { renderRuPanel('palabra'); } catch (x) {} }
  };
  var qs = $('ruQuizSpeak');
  if (qs) qs.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (ruQuizQ) ruSpeak(ruQuizQ.w.ru); };
  var qo = $('ruQuizOnline');
  if (qo) qo.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (ruQuizQ) ruSpeakOnline(ruQuizQ.w.ru); };
  var qsl = $('ruQuizSlow');
  if (qsl) qsl.onclick = function (e) { try { e.preventDefault(); } catch (x) {} ruSlow = !ruSlow; qsl.textContent = '🐢 Lento: ' + (ruSlow ? 'ON' : 'OFF'); if (ruQuizQ) ruSpeak(ruQuizQ.w.ru); };
  var qst = $('ruQuizStop');
  if (qst) qst.onclick = function (e) { try { e.preventDefault(); } catch (x) {} ruStop(); };
  box.querySelectorAll('.eng-word').forEach(function (b) {
    b.onclick = function (e) { try { e.preventDefault(); } catch (x) {} ruSpeak(b.getAttribute('data-w')); };
  });
  box.querySelectorAll('.ru-hear').forEach(function (b) {
    b.onclick = function (e) { try { e.preventDefault(); } catch (x) {} ruSpeak(b.getAttribute('data-w')); };
  });
  box.querySelectorAll('.ru-copy').forEach(function (b) {
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
  box.querySelectorAll('.ru-goto-frases').forEach(function (b) {
    b.onclick = function () { renderRuPanel('frases'); };
  });
  var frnd = $('ruFraseRnd');
  if (frnd) frnd.onclick = function () { ruFraseIdx = Math.floor(Math.random() * RU_FRASES.length); renderRuPanel('frases'); };

  box.querySelectorAll('.ru-lv').forEach(function (b) {
    b.onclick = function () { ruQuizLevel = b.getAttribute('data-lv'); ruQuizQ = null; renderRuPanel('quiz'); };
  });
  box.querySelectorAll('.ru-md').forEach(function (b) {
    b.onclick = function () { ruQuizMode = b.getAttribute('data-md'); ruQuizQ = null; renderRuPanel('quiz'); };
  });
  box.querySelectorAll('.ru-opt').forEach(function (b) {
    b.onclick = function () {
      var d2 = getRuData();
      var good = ruQuizMode === 'translit' ? ruQuizQ.w.tr : ruQuizQ.w.es;
      var ok = b.getAttribute('data-o') === good;
      d2.total = (d2.total || 0) + 1;
      if (ok) { d2.ok = (d2.ok || 0) + 1; d2.streak = (d2.streak || 0) + 1; }
      else { d2.streak = 0; }
      try { if (typeof scheduleSave === 'function') scheduleSave('Guardado ✓'); } catch (e) {}
      var fb = $('ruQuizFb');
      if (fb) fb.innerHTML = ok ? '✅ ¡Muy bien! <b>' + esc(ruQuizQ.w.ru) + '</b> ' + esc(ruQuizQ.w.tr) + ' — “' + esc(ruQuizQ.w.ex) + '”'
        : '❌ Era <b>' + esc(good) + '</b> — ' + esc(ruQuizQ.w.ru) + ' ' + esc(ruQuizQ.w.tr) + ' “' + esc(ruQuizQ.w.ex) + '”';
      box.querySelectorAll('.ru-opt').forEach(function (x) {
        x.disabled = true;
        if (x.getAttribute('data-o') === good) x.classList.add('btn-accent');
      });
      renderRuStreak();
      setTimeout(function () { ruQuizQ = null; if (ruTab === 'quiz') renderRuPanel('quiz'); }, ok ? 1400 : 2400);
    };
  });
}

/* ---------------- DIÁLOGO ---------------- */
function buildDialog() {
  if ($('rusoDialog')) return;
  var d = document.createElement('dialog');
  d.id = 'rusoDialog';
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053"><h3 class="su-ee0cfe">🪆 Ruso — A1 → C1 + cultura</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Aprende <b>ruso (русский, cirílico + transliteración) por niveles CEFR + cultura viva</b>, como el Kimün, el Inglés, el Portugués, el Chino, el Hindi y el Italiano: 1 palabra por día + casos + quiz. Toca 🔊 para oír (voz del dispositivo, ru-RU). Todo queda <b>local y privado</b> por usuario.</p>' +
    '<div id="ruStreakBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="timer-tabs su-f7ad78">' +
    '<button type="button" id="tabRU1" class="btn btn-accent su-30e741">☀️ Palabra del día</button>' +
    '<button type="button" id="tabRU2" class="btn su-30e741">🌱 A1</button>' +
    '<button type="button" id="tabRU3" class="btn su-30e741">🌿 A2</button>' +
    '<button type="button" id="tabRU4" class="btn su-30e741">💬 B1</button>' +
    '<button type="button" id="tabRU5" class="btn su-30e741">📜 B2–C1 + Cultura</button>' +
    '<button type="button" id="tabRU7" class="btn su-30e741">💬 Frases famosas</button>' +
    '<button type="button" id="tabRU6" class="btn su-30e741">🧩 Quiz</button></div>' +
    '<div id="ruPanel"></div>' +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { ruStop(); } catch (e) {} try { d.close(); } catch (e2) {} }; });
  try {
    d.addEventListener('close', function () { try { ruStop(); } catch (e) {} });
    d.addEventListener('cancel', function () { try { ruStop(); } catch (e) {} });
  } catch (e) {}
}

function bindTabs() {
  var map = { tabRU1: 'palabra', tabRU2: 'a1', tabRU3: 'a2', tabRU4: 'b1', tabRU5: 'cultura', tabRU6: 'quiz', tabRU7: 'frases' };
  Object.keys(map).forEach(function (id) {
    var el = $(id);
    if (el) el.onclick = function () {
      try { ruStop(); } catch (e) {}
      if (map[id] !== 'quiz') ruQuizQ = null;
      if (map[id] === 'palabra') ruShown = null;
      renderRuPanel(map[id]);
    };
  });
}

/* ---------------- SETUP ---------------- */
function ensureButton() {
  try {
    var existing = $('btnRuso');
    if (existing) { try { existing.setAttribute('data-sub', 'idiomas'); } catch (e) {} return existing; }
    var g = document.querySelector('.action-group[data-group="aprender"] .group-btns');
    if (!g) return null;
    var btn = document.createElement('button');
    btn.id = 'btnRuso'; btn.className = 'btn'; btn.type = 'button';
    btn.textContent = '🪆 Ruso';
    try { btn.setAttribute('data-sub', 'idiomas'); } catch (e2) {}
    btn.setAttribute('data-keywords', 'ruso rusia russia ruski russky cirilico transliteracion privet spasibo matrioshka dostoievski tolstoi te borsch pelmeni maslenitsa idioma niveles a1 a2 b1 b2 c1 basico intermedio avanzado quiz vocabulario gramatica casos fonetica acento');
    var ref = g.querySelector('#btnItaliano') || g.querySelector('#btnHindi') || g.querySelector('#btnChino') || g.querySelector('#btnPortugues');
    if (ref && ref.parentNode === g) g.insertBefore(btn, ref.nextSibling);
    else g.appendChild(btn);
    return btn;
  } catch (e) { return null; }
}

function registerGlobals() {
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnRuso') < 0) {
      var i = -1;
      try { i = ALL_BTNS.indexOf('btnItaliano'); } catch (e) {}
      if (i < 0) { try { i = ALL_BTNS.indexOf('btnHindi'); } catch (e2) {} }
      if (i < 0) { try { i = ALL_BTNS.indexOf('btnChino'); } catch (e3) {} }
      if (i >= 0) ALL_BTNS.splice(i + 1, 0, 'btnRuso');
      else ALL_BTNS.push('btnRuso');
    }
  } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnRuso = ['aprender', 'idiomas']; } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['aprender|idiomas'] && BTN_ORDER['aprender|idiomas'].indexOf('btnRuso') < 0) {
      BTN_ORDER['aprender|idiomas'].push('btnRuso');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p] && (p === 'todo' || p === 'adulto' || p === 'estudiante' || p === 'docente' || p === 'adolescente')) PRESETS[p].btnRuso = true;
      });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnRuso"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Aprender') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnRuso"> 🪆 Ruso';
          var ref2 = gr.querySelector('input[data-btn="btnItaliano"]') || gr.querySelector('input[data-btn="btnHindi"]') || gr.querySelector('input[data-btn="btnChino"]');
          if (ref2 && ref2.closest && ref2.closest('label') && ref2.closest('label').parentNode) {
            ref2.closest('label').parentNode.insertBefore(lab, ref2.closest('label').nextSibling);
          } else { gr.appendChild(lab); }
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnRuso !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnRuso = lab.querySelector('input').checked;
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
  renderRuPanel('palabra');
  var b = $('btnRuso');
  if (!b) { if ((setup._r = (setup._r || 0) + 1) < 60) setTimeout(setup, 500); return; }
  if (!b.dataset.ruu) {
    b.dataset.ruu = '1';
    b.addEventListener('click', function () {
      ruQuizQ = null;
      ruShown = null;
      try { ruEnsureVoices(); } catch (e) {}
      renderRuPanel('palabra');
      openDlg('rusoDialog');
    });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 500); });
else setTimeout(setup, 500);

})();

