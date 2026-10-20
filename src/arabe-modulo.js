/* ============================================================
   ÁRABE · اَلْعَرَبِيَّة A1 → C1 + CULTURA — Calendario 13 Lunas
   Sección completa dentro de Aprender > Idiomas y cultura:
   - Botón btnArabe (grupo aprender, sub idiomas, junto a
     Kimün Mapuzugun, Inglés, Portugués, Chino, Hindi, Italiano,
     Ruso, Japonés y Latín)
   - Diálogo arabeDialog con 7 pestañas:
     1) ☀️ Palabra del día (árabe RTL + transliteración + TTS ar-SA)
     2) 🌱 A1 Supervivencia (20 tarjetas + pronombres + ser/estar + mini-diálogo)
     3) 🌿 A2 Vida diaria (14 tarjetas + pasado + futuro + direcciones)
     4) 💬 B1 Viajar, trabajar y opinar (10 + idafa + kana + conectores)
     5) 📜 B2–C1 + Cultura (expresiones, fonética que cambia todo,
         raíz ↔ forma, sol/luna, Ramadán, hospitalidad, caligrafía,
         Fairuz/Umm Kulzum, zoco)
     6) 💬 Frases famosas (portada del día + tarjetas con audio y copiar)
     7) 🧩 Quiz por niveles + quiz de transliteración + racha local
   - Todo local y privado por usuario:
     userData().arabe = { ok, total, streak, lastDay }
   - 100% offline. TTS usa la voz del dispositivo (speechSynthesis
     con lang ar-SA), igual que Inglés, Portugués, Chino, Hindi,
     Italiano, Ruso y Japonés. Con respaldo online si no hay voz árabe.
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
/* ar: árabe (MSA, con vocalización breve donde ayuda) · tr: transliteración simple para hispanohablantes · es: español · ex: ejemplo */
var AR_A1 = [
  { ar: 'السَّلَامُ عَلَيْكُمْ', tr: 'as-salamu alaykum', es: 'hola (lit. “la paz sea contigo”)', ex: 'السَّلَامُ عَلَيْكُمْ، كَيْفَ حَالُكَ؟ — Hola, ¿cómo estás?' },
  { ar: 'شُكْرًا', tr: 'shukran', es: 'gracias', ex: 'شُكْرًا جَزِيلًا. — Muchas gracias.' },
  { ar: 'مِنْ فَضْلِكَ / مِنْ فَضْلِكِ', tr: 'min fadlik (a él) / min fadliki (a ella)', es: 'por favor', ex: 'قَهْوَة، مِنْ فَضْلِكَ. — Un café, por favor.' },
  { ar: 'صَبَاحُ الْخَيْر', tr: 'sabah al-jair', es: 'buenos días', ex: 'صَبَاحُ الْخَيْر، يَا أَطْفَال. — Buenos días, clase.' },
  { ar: 'مَسَاءُ الْخَيْر / تُصْبِحُ عَلَى خَيْر', tr: 'masa al-jair / tusbih ala jair', es: 'buenas tardes / buenas noches (al despedirse)', ex: 'تُصْبِحُ عَلَى خَيْر، إِلَى الْغَد. — Buenas noches, hasta mañana.' },
  { ar: 'اِسْمِي…', tr: 'ismi…', es: 'me llamo…', ex: 'اِسْمِي آنَا. — Me llamo Ana.' },
  { ar: 'أَنَا مِنْ تْشِيلِي', tr: 'ana min chili', es: 'soy de Chile', ex: 'أَنَا مِنْ بِنْكُو، تْشِيلِي. — Soy de Penco, Chile.' },
  { ar: 'هَلْ تَتَكَلَّمُ الْإِسْبَانِيَّة؟', tr: 'hal tatakallam al-isbaniya?', es: '¿hablas español?', ex: 'أَتَكَلَّمُ قَلِيلًا مِنَ الْعَرَبِيَّة. — Hablo un poco de árabe.' },
  { ar: 'مَاء', tr: "ma'", es: 'agua', ex: 'كَأْسُ مَاء، مِنْ فَضْلِكَ. — Un vaso de agua, por favor.' },
  { ar: 'خُبْز / طَعَام', tr: 'jubz / taam', es: 'pan / comida', ex: 'خُبْز وَسَمَك، مِنْ فَضْلِكَ. — Pan y pescado, por favor.' },
  { ar: 'بَيْت', tr: 'bait', es: 'casa / hogar', ex: 'بَيْتِي قَرِيبٌ مِنَ الْبَحْر. — Mi casa queda cerca del mar.' },
  { ar: 'اَلْيَوْم', tr: 'al-yaum', es: 'hoy', ex: 'اَلْيَوْمُ يَوْمٌ جَمِيل. — Hoy es un lindo día.' },
  { ar: 'أَنَا / أَنْتَ / أَنْتِ / هُوَ / هِيَ', tr: 'ana / anta / anti / huwa / hiya', es: 'yo / tú (m) / tú (f) / él / ella', ex: 'أَنَا طَالِبَة. أَنْتَ لَطِيف. — Soy estudiante. Eres amable.' },
  { ar: 'عِنْدِي…', tr: 'indi…', es: 'tengo… (lit. “junto a mí hay”)', ex: 'عِنْدِي أَخَوَان. — Tengo dos hermanos.' },
  { ar: 'أَرْقَام ١–١٠', tr: 'uahid, iznain, zalaza, arbaa, jamsa, sitta, saba, zamaniya, tisa, ashara', es: 'números 1–10', ex: 'وَاحِد، اِثْنَان، ثَلَاثَة… عَشَرَة. — Uno, dos, tres… diez.' },
  { ar: 'أَحْمَر، أَزْرَق، أَخْضَر', tr: 'ahmar, azraq, ajdar', es: 'rojo, azul, verde', ex: 'اَلْبَحْرُ أَزْرَق. — El mar es azul.' },
  { ar: 'أُمّ، أَب', tr: 'umm, ab', es: 'mamá, papá', ex: 'أُمِّي تَطْبُخُ جَيِّدًا. — Mi mamá cocina rico.' },
  { ar: 'يُعْجِبُنِي…', tr: "yu'yibuni…", es: 'me gusta…', ex: 'يُعْجِبُنِي الْبَحْر. — Me gusta el mar.' },
  { ar: 'أَحْتَاجُ…', tr: 'ahtayu…', es: 'necesito…', ex: 'أَحْتَاجُ مُسَاعَدَة. — Necesito ayuda.' },
  { ar: 'إِلَى اللِّقَاء', tr: 'ila al-liqa', es: 'adiós / nos vemos', ex: 'مَعَ السَّلَامَة! إِلَى الْغَد! — ¡Chao! ¡Nos vemos mañana!' }
];
var AR_A2 = [
  { ar: 'مَاذَا فَعَلْتَ أَمْس؟', tr: 'maza faalta ams?', es: '¿qué hiciste ayer?', ex: 'عَمِلْتُ فِي الْحَدِيقَة. — Trabajé en la huerta.' },
  { ar: 'سَوْفَ… / سَأَ…', tr: 'saufa… / sa-…', es: 'voy a… / haré…', ex: 'سَوْفَ أَطْبُخ. — Voy a cocinar.' },
  { ar: 'أَكْبَرُ مِنْ / اَلْأَكْبَر', tr: 'akbar min / al-akbar', es: 'más grande que / el más grande', ex: 'اَلْبَحْرُ أَكْبَرُ مِنَ النَّهْر. — El mar es más grande que el río.' },
  { ar: 'بِكَمْ؟ / كَمْ؟', tr: 'bikam? / kam?', es: '¿cuánto cuesta? / ¿cuántos?', ex: 'بِكَمْ هَذَا؟ — ¿Cuánto cuesta esto?' },
  { ar: 'يَجِبُ أَنْ أَعْمَل', tr: 'yayib an amal', es: 'tengo que trabajar', ex: 'يَجِبُ أَنْ أَذْهَبَ الْآن. — Me tengo que ir ahora.' },
  { ar: 'هَلْ يُمْكِنُكَ مُسَاعَدَتِي؟', tr: 'hal yumkinuk musaadati?', es: '¿puedes ayudarme?', ex: 'تَكَلَّمْ بِبُطْء، مِنْ فَضْلِكَ. — Habla despacio, por favor.' },
  { ar: 'يُوجَد / هُنَاكَ', tr: 'yuyad / hunaka', es: 'hay', ex: 'يُوجَدُ سُوقٌ هُنَا. — Aquí hay un mercado.' },
  { ar: 'اَلْجَوُّ مُمْطِر / مُشْمِس', tr: 'al-yaww mumtir / mushmis', es: 'llueve / hay sol', ex: 'اَلْيَوْمَ مُمْطِرٌ فِي بِنْكُو. — Hoy llueve en Penco.' },
  { ar: 'ذَهَبَ، أَكَلَ، رَأَى', tr: 'zahaba, akala, raa', es: 'fue, comió, vio (pasado)', ex: 'ذَهَبْنَا إِلَى الشَّاطِئ. — Fuimos a la playa.' },
  { ar: 'اَلتَّسَوُّق: هَذَا غَالٍ', tr: 'at-tasawwuq: haza ghalin', es: 'compras: ¡qué caro!', ex: 'خَمْسَةُ آلَافِ بَيْسُو. — Cinco mil pesos.' },
  { ar: 'إِلَى الْيَمِين / إِلَى الْيَسَار', tr: 'ila al-yamin / ila al-yasar', es: 'a la derecha / a la izquierda (¡ojo: se leen al revés en español!)', ex: 'فِي السَّاحَة إِلَى الْيَسَار. — Gire a la izquierda en la plaza.' },
  { ar: 'سَعِيد، مُتْعَب، مَرِيض', tr: "said, mutab, marid", es: 'feliz, cansado/a, enfermo/a', ex: 'أَنَا مُتْعَبَةٌ الْيَوْم. — Hoy estoy cansada.' },
  { ar: 'يَطْبُخُ / يُنَظِّفُ / يَغْسِلُ', tr: 'yatbuju / yunazzifu / yagsilu', es: 'cocinar / limpiar / lavar', ex: 'أَطْبُخُ كُلَّ يَوْم. — Cocino todos los días.' },
  { ar: 'نَلْتَقِي فِي الثَّالِثَة', tr: 'naltaqi fi az-zaliza', es: 'nos vemos a las tres', ex: 'إِلَى الْخَامِسَة! — ¡Nos vemos a las cinco!' }
];
var AR_B1 = [
  { ar: 'أَعِيشُ هُنَا مُنْذُ خَمْسِ سَنَوَات', tr: 'aishu huna munzu jamsi sanawat', es: 'vivo aquí desde hace 5 años', ex: 'لَمْ أَرَ الثَّلْجَ أَبَدًا. — Nunca he visto nieve.' },
  { ar: 'إِذَا أَمْطَرَتْ، سَنَبْقَى فِي الْبَيْت', tr: 'iza amtarat, sanabqa fi al-bait', es: 'si llueve, nos quedamos (إذا… فـ…)', ex: 'إِذَا دَرَسْتَ، سَتَنْجَح. — Si estudias, avanzarás.' },
  { ar: 'يَبْحَثُ / يَعْتَنِي / لَا تَسْتَسْلِم', tr: 'yabhazu / yatani / la tastaslim', es: 'buscar / cuidar / rendirse', ex: 'لَا تَسْتَسْلِمْ! — ¡No te rindas!' },
  { ar: 'اَلسَّفَر: أُرِيدُ تَذْكِرَة', tr: 'as-safar: uridu tazkira', es: 'viajes: quiero un pasaje', ex: 'تَذْكِرَة إِلَى كُونْسِبْسِيُون، مِنْ فَضْلِكَ. — Un pasaje a Concepción.' },
  { ar: 'اَلْعَمَل: أَنَا مَسْؤُولٌ عَنْ…', tr: "al-amal: ana masul an…", es: 'trabajo: soy responsable de…', ex: 'أَنَا مَسْؤُولٌ عَنِ الْحَدِيقَة. — Estoy a cargo de la huerta.' },
  { ar: 'أَعْتَقِدُ أَنَّ… / فِي رَأْيِي', tr: "a'taqid anna… / fi rayi", es: 'creo que / en mi opinión', ex: 'أَعْتَقِدُ أَنَّهَا فِكْرَةٌ جَيِّدَة. — Creo que es buena idea.' },
  { ar: 'كُنْتُ + فعل (كَانَ)', tr: 'kuntu + verbo', es: 'solía / era… (imperfecto con كان)', ex: 'كُنْتُ أَعْزِفُ الْغِيتَار. — Antes tocaba guitarra.' },
  { ar: 'لِذَلِكَ / لِأَنَّ / رَغْمَ أَنَّ', tr: 'lizalika / lianna / raghma anna', es: 'así que / porque / aunque', ex: 'كَانَ الْجَوُّ بَارِدًا، لِذَلِكَ بَقِينَا. — Hacía frío, así que nos quedamos.' },
  { ar: 'اَلصِّحَّة: رَأْسِي يُؤْلِمُنِي', tr: 'as-sihha: rasi yulimuni', es: 'salud: me duele la cabeza', ex: 'أَحْتَاجُ مَوْعِدًا طِبِّيًّا. — Necesito hora médica.' },
  { ar: 'اَلرِّسَالَة: مَعَ التَّحِيَّات', tr: 'ar-risala: maa at-tahiyyat', es: 'correo: atentamente', ex: 'مَعَ التَّحِيَّات، آنَا. — Atentamente, Ana.' }
];
var AR_B2C1 = [
  { ar: 'يَلَّا! / إِنْ شَاءَ الله / اَلْحَمْدُ لِلَّه', tr: 'yalla! / inshallah / alhamdulillah', es: '¡vamos! / si Dios quiere / gracias a Dios (las 3 llaves del día)', ex: 'يَلَّا، نَبْدَأ! إِنْ شَاءَ الله نَنْجَح. — ¡Vamos, empecemos! Si Dios quiere, saldrá bien.' },
  { ar: 'اَلْعَجَلَةُ مِنَ الشَّيْطَان', tr: 'al-ayala min ash-shaitan', es: 'la prisa es del diablo (proverbio: despacio se avanza)', ex: 'Proverbio nº1 para exámenes y huerta: la calma da fruto.' },
  { ar: 'مَنْ جَدَّ وَجَدَ', tr: 'man yadda wayada', es: 'quien se esfuerza, encuentra (el que la sigue la consigue)', ex: 'Tatuaje mental para la racha: constancia > talento.' },
  { ar: 'أَحْسَنْتَ! / هَيَّا!', tr: 'ahsanta! / hayya!', es: '¡bien hecho! ¡vamos!', ex: 'أَحْسَنْتَ فِي الاِمْتِحَان! — ¡Bien en la prueba!' },
  { ar: 'عِنْدَمَا وَصَلَ، كُنْتُ قَدْ غَادَرْتُ', tr: 'indama wasala, kuntu qad ghadartu', es: 'ya me había ido (كان + قد + pasado)', ex: 'Para contar historias en pluscuamperfecto.' },
  { ar: 'لَوْ دَرَسْتُ، لَنَجَحْتُ', tr: 'lau darastu, lanayahtu', es: 'si hubiera estudiado, habría aprobado (لو… لـ…)', ex: 'Arrepentimientos y lecciones: لو + pasado + لـ + pasado.' },
  { ar: 'نُظِّفَ الشَّاطِئُ بِوَاسِطَةِ الْمُتَطَوِّعِين', tr: 'nuzzif ash-shatiu biwasitat al-mutatawwiin', es: 'la playa fue limpiada (pasiva)', ex: 'Pasiva formal: verbo 3ª persona + نائب فاعل.' },
  { ar: 'قَالَتْ إِنَّهَا مُتْعَبَة', tr: 'qalat innaha mutaba', es: 'dijo que estaba cansada (discurso indirecto con أنَّ)', ex: 'Directo → indirecto con أنَّ + cambio de pronombre.' },
  { ar: 'مُقَابَلَةُ عَمَل: نُقْطَةُ قُوَّتِي…', tr: 'muqabalat amal: nuqtat quwwati…', es: 'entrevista: mi fortaleza es…', ex: 'أَعْمَلُ جَيِّدًا فِي فَرِيق. — Trabajo bien en equipo.' },
  { ar: 'وَمَعَ ذَلِكَ / بِالْإِضَافَة', tr: 'wa maa zalika / bil-idafa', es: 'sin embargo / además (ensayo)', ex: 'وَمَعَ ذَلِكَ، اَلْبَحْرُ هُوَ الْحَيَاة. — Sin embargo, el mar es vida.' }
];
var AR_FRASES = [
  { ar: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', tr: 'inna maa al-usri yusraa', es: 'con la dificultad viene la facilidad', ex: 'Corán 94:6 — Tras lo duro, alivio: aguanta.' },
  { ar: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', tr: 'wa qul rabbi zidni ilmaa', es: '¡Señor, auméntame en saber!', ex: 'Corán 20:114 — Pide saber cada mañana.' },
  { ar: 'خَيْرُ الْكَلَامِ مَا قَلَّ وَدَلَّ', tr: 'jayru al-kalaam maa qalla wa dalla', es: 'la mejor palabra es breve y clara', ex: 'Proverbio — Di poco y claro.' },
  { ar: 'اَلصَّبْرُ مِفْتَاحُ الْفَرَج', tr: 'as-sabru miftaahu al-faray', es: 'la paciencia es llave del alivio', ex: 'Proverbio — Festina lente en árabe.' },
  { ar: 'مَنْ جَدَّ وَجَدَ', tr: 'man yadda wayada', es: 'quien se esfuerza, encuentra', ex: 'Proverbio — Constancia mayor que talento.' },
  { ar: 'اَلْعِلْمُ نُور', tr: 'al-ilmu nuur', es: 'el saber es luz', ex: 'Proverbio — Fiat lux: estudia.' },
  { ar: 'اَلْوَقْتُ كَالسَّيْف', tr: 'al-waqtu kas-saif', es: 'el tiempo es como la espada', ex: 'Proverbio — Si no lo usas, te corta: úsalo.' },
  { ar: 'فِي التَّأَنِّي السَّلَامَة', tr: 'fi at-taanni as-salaama', es: 'en la calma está la seguridad', ex: 'Proverbio — Despacio y seguro.' },
  { ar: 'اَلِاتِّحَادُ قُوَّة', tr: 'al-ittihaadu quwwa', es: 'la unión es fuerza', ex: 'Proverbio — Junta vecinal fuerte.' },
  { ar: 'اَلْجَارُ قَبْلَ الدَّار', tr: 'al-yaaru qabla ad-daar', es: 'el vecino antes que la casa', ex: 'Proverbio — Elige bien tu vecindario.' },
  { ar: 'كُلُّ إِنَاءٍ بِمَا فِيهِ يَنْضَح', tr: 'kullu inaa bi-maa fihi yandah', es: 'cada vasija rezuma lo que contiene', ex: 'Proverbio — Das lo que llevas dentro.' },
  { ar: 'اَلْكِتَابُ خَيْرُ جَلِيس', tr: 'al-kitaabu jayru yaliis', es: 'el libro es el mejor compañero', ex: 'Proverbio — Lee cada día.' },
  { ar: 'اَلتَّكْرَارُ أُمُّ التَّعَلُّم', tr: 'at-takraaru ummu at-taallum', es: 'la repetición es madre del saber', ex: 'Proverbio — Repite 5 minutos.' },
  { ar: 'أَوْلَادُكُمْ لَيْسُوا أَوْلَادَكُمْ', tr: 'aulaadukum laisuu aulaadakum', es: 'vuestros hijos no son vuestros hijos', ex: 'Gibran, El Profeta — Son flechas, no propiedad.' },
  { ar: 'اَلْعَمَلُ هُوَ الْحُبُّ ظَاهِرًا', tr: 'al-amalu huwa al-hubbu zaahiraa', es: 'el trabajo es el amor visible', ex: 'Gibran — Trabaja con amor.' },
  { ar: 'عَلَى قَدْرِ أَهْلِ الْعَزْمِ تَأْتِي الْعَزَائِم', tr: 'alaa qadri ahli al-azmi', es: 'según tu audacia, tus hazañas', ex: 'Al-Mutanabbi — Audaces fortuna iuvat.' },
  { ar: 'مَا كُلُّ مَا يَتَمَنَّى الْمَرْءُ يُدْرِكُه', tr: 'maa kullu maa yatamannaa', es: 'no todo lo deseado se alcanza', ex: 'Al-Mutanabbi — Los vientos no siempre obedecen.' },
  { ar: 'رُبَّ ضَارَّةٍ نَافِعَة', tr: 'rubba daarratin naafia', es: 'a veces el daño trae provecho', ex: 'Proverbio — Lo malo trae un bien.' },
  { ar: 'اَلْقَنَاعَةُ كَنْزٌ لَا يَفْنَى', tr: 'al-qanaaatu kanzun laa yafnaa', es: 'el contento es tesoro inagotable', ex: 'Proverbio — Agradece lo que hay.' },
  { ar: 'لِسَانُكَ حِصَانُك', tr: 'lisaanuka hisaanuk', es: 'tu lengua es tu caballo', ex: 'Proverbio — Cuida tus palabras.' },
  { ar: 'مَنْ حَفَرَ حُفْرَةً لِأَخِيهِ وَقَعَ فِيهَا', tr: 'man hafara hufratan', es: 'quien cava fosa a su hermano, cae en ella', ex: 'Proverbio — No hagas daño: vuelve.' },
  { ar: 'كَمَا تَزْرَعُ تَحْصُد', tr: 'kamaa tazrau tahsud', es: 'como siembres, cosecharás', ex: 'Proverbio de huerta — Siembra bien.' },
  { ar: 'اَلْعَقْلُ زِينَة', tr: 'al-aqlu ziina', es: 'la razón es adorno', ex: 'Proverbio — Sapere aude: piensa.' },
  { ar: 'أَعْطِنِي النَّايَ وَغَنِّ', tr: 'aatini an-naaya wa ghanni', es: 'dame la flauta y canta', ex: 'Gibran / Fairuz — Canta tus penas.' },
  { ar: 'أَنْتَ عُمْرِي', tr: 'anta umri', es: 'tú eres mi vida', ex: 'Umm Kulzum — La canción árabe más famosa.' },
  { ar: 'رَمَضَان كَرِيم', tr: 'ramadaan kariim', es: 'Ramadán generoso (feliz Ramadán)', ex: 'Saludo de Ramadán — Ayuno y generosidad.' },
  { ar: 'كُلُّ عَامٍ وَأَنْتُمْ بِخَيْر', tr: 'kullu aam wa antum bijayr', es: 'felicidades cada año (feliz fiesta)', ex: 'Saludo de Eïd — Para las dos fiestas.' },
  { ar: 'اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ الله', tr: 'as-salaamu alaykum', es: 'la paz y misericordia de Dios contigo', ex: 'Saludo — Responde: wa alaykum as-salaam.' },
  { ar: 'أَهْلًا وَسَهْلًا', tr: 'ahlan wa sahlan', es: 'bienvenido (lit. familia y llanura)', ex: 'Bienvenida — Hospitalidad beduina.' },
  { ar: 'يَلَّا يَا Penco!', tr: 'yalla yaa Penco!', es: '¡vamos Penco!', ex: 'Ánimo — Úsalo en el partido.' }
];
var AR_FON = [
  ['ع غ ح هـ — las 4 que no existen en español', 'ع (ain, desde la garganta: “a” estrangulada) ≠ أ (hamza, corte seco). غ (ghain, gárgara francesa) · ح (ha profunda, como empañar un vidrio) ≠ هـ (ha suave). Practica el par: عَلَم (bandera) vs أَلَم (dolor). Te entenderán aunque no salga perfecto el primer mes.'],
  ['ق ك — profunda vs suave', 'ق (qaf, “k” desde el fondo: قلب qalb, corazón) vs ك (kaf suave: كلب kalb, perro). Un punto de garganta cambia “corazón” por “perro”: marca la ق desde el día 1. Practica: قَمَر (luna) vs كَمَر… no, mejor قَهْوَة (café).'],
  ['ص س / ض د / ط ت / ظ ذ — enfáticas que tiñen la vocal', 'ص ض ط ظ se dicen con la lengua ancha y la vocal oscura: صَيْف (verano) ≠ سَيْف (espada) · ضَالّ (perdido) ≠ دَالّ. Regla: si la palabra “suena grave”, es enfática. Escucha la vocal, no solo la consonante.'],
  ['ث ذ — la “z” suave española sí sirve', 'ث (za: como “z” de España: ثلاثة zalaza, tres) · ذ (como “d” suave: ذَهَب zahaba, oro/fue) · ز (z vibrante: زَيْت zait, aceite). Con ث/ذ/ز lees precios del zoco sin miedo.'],
  ['ش ج — suaves y amigas', 'ش (shin = “sh”: شَمْس shams, sol) · ج (yim: estándar “y” suave; en Egipto suena “g”: جميل yamīl/gamīl, lindo). شَاي (shai, té) es tu primera palabra útil: pídela en cualquier parte.'],
  ['و ي ا + حركات — 3 letras, 6 vocales', 'Las cortas (َ ِ ُ: a/i/u de 1 tiempo) vs largas (ا و ي: 2 tiempos): قَلْب (corazón) ≠ قَالَب (molde) · مِن (de) ≠ مِين (¿quién?, dialectal). Alargar mal cambia el sentido: practica con pares mínimos y palmadas (1 vs 2).'],
  ['ة + شَدَّة ّ — dos signos que lo cambian todo', 'ة (ta marbuta: suena -a, plural -aat: مدرسة madrasa, escuela) · ّ (shadda = doble: دَرَسَ darasa, estudió ≠ دَرَّسَ darrasa, enseñó). Sin shadda lees a medias: márcala siempre en tu cuaderno.'],
  ['الـ sol/luna + RTL — leer de derecha a izquierda', 'الـ ante letra solar (ت ث د ذ ر ز س ش ص ض ط ظ ل ن) se asimila: الشَّمْس se dice “ash-shams” (la sh duplica). Ante lunar se oye: الْقَمَر “al-qamar”. Y todo se lee → de derecha a izquierda: empieza por la derecha, respira, y sigue. En 28 días lees carteles.']
];
var AR_GRAM = [
  ['🌳 Raíz de 3 letras — 1 raíz, 20 palabras', 'ك-ت-ب (escribir): كِتَاب (libro) · مَكْتَبَة (biblioteca) · كَاتِب (escritor) · يَكْتُبُ (escribe). Aprende RAÍCES, no palabras sueltas: con 50 raíces entiendes 1000 palabras. Pregunta siempre “¿cuál es la raíz?”.'],
  ['⚥ Género + plural roto (el famoso “roto”)', 'Femenino casi siempre termina en ة: معلم (profe m) → معلمة (profe f). Plural sano: معلمون/معلمات. Plural roto (cambia por dentro): كتاب → كتب (libros) · بيت → بيوت. No hay regla única: aprende cada sustantivo CON su plural.'],
  ['✌️ Dual — el árabe cuenta 1, 2 y muchos', 'Singular / dual -ان / plural: يوم (día) → يومان (2 días) → أيام (días) · عين → عينان (dos ojos). Para ojos, manos y padres el dual es diario: والدَان (los 2 padres). Marca el dual desde A1: suena culto al tiro.'],
  ['🔗 Idafa — “de” sin decir “de”', 'كتابُ المعلّمِ (el libro DEL profe): 2 palabras pegadas, la 2ª con “de” implícito. بيتُ أُمِّي (la casa DE mi mamá). Sin “de / del”: el orden + la terminación lo dicen todo. Domina la idafa y suenas B1 al tiro.'],
  ['⏳ Pasado + presente (y futuro con سـ/سوف)', 'Pasado con sufijos: كتبْتُ/كتبْتَ/كتبَتْ (escribí/escribiste…). Presente con prefijos: أكتبُ/تكتبُ/يكتبُ. Futuro: سأكتبُ / سوف أكتُب (escribiré). Solo domina كتب + فعل (hacer) + ذهب (ir) en pasado y presente el primer mes.'],
  ['🚫 Negar: ما / لا / لَمْ / لَنْ (cada una en su tiempo)', 'ما + pasado (ما فهمتُ = no entendí) · لا + presente (لا أفهم = no entiendo) · لم + pasado corto (لم أذهبْ = no fui) · لن + futuro (لن أذهبَ = no iré). No mezcles: el tiempo manda la partícula. Es la regla nº1 del mercado.'],
  ['🙋 أنتَ/أنتِ + حضرتك — cuándo cuál', 'أنتَ (tú m) / أنتِ (tú f) / أنتم (ustedes): familia, pares, jóvenes. حضرتك / أستاذ (usted, Egipto/Levante) · Usted formal MSA: inicio con السلام + título. Con forma respetuosa nunca fallas: empieza SIEMPRE formal con mayores, clientes y profes.']
];

function allAr() { return AR_A1.concat(AR_A2, AR_B1, AR_FRASES, AR_B2C1); }

/* ---------------- ESTADO ---------------- */
var arTab = 'palabra';
var arQuizQ = null;
var arQuizLevel = 'todo';
var arQuizMode = 'significado';
var arShown = null;

function getArData() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { ok: 0, total: 0, streak: 0, lastDay: '' };
    if (!u.arabe) u.arabe = { ok: 0, total: 0, streak: 0, lastDay: '' };
    return u.arabe;
  } catch (e) { return { ok: 0, total: 0, streak: 0, lastDay: '' }; }
}
function arDayIndex(n) {
  try {
    var d = new Date();
    var s = d.getFullYear() * 1000 + Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
    return s % n;
  } catch (e) { return 0; }
}
/* ---------------- AUDIO (TTS ar robusto) ---------------- */
var arVoicesCache = null;
var arSlow = false;
var arResumeTimer = null;
var arSpeaking = false;
var arSpeakToken = 0;
var arOnlineAudio = null;
function arEnsureVoices() {
  try {
    if (!('speechSynthesis' in window)) return [];
    var vs = window.speechSynthesis.getVoices() || [];
    if (vs && vs.length) arVoicesCache = vs;
    return vs && vs.length ? vs : (arVoicesCache || []);
  } catch (e) { return arVoicesCache || []; }
}
try {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    var arWarm = function () { try { arEnsureVoices(); } catch (e) {} };
    try { arWarm(); } catch (e) {}
    try {
      if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = function () { try { arEnsureVoices(); arRefreshVoiceStatus(); } catch (e) {} };
      }
    } catch (e) {}
  }
} catch (e) {}
function arPickVoice() {
  var vs = arEnsureVoices();
  if (!vs || !vs.length) return null;
  var score = function (v) {
    var lang = String((v && v.lang) || '');
    var name = String((v && v.name) || '').toLowerCase();
    var l = lang.toLowerCase();
    if (/^ar[-_]sa/i.test(lang)) return 100;
    if (/^ar[-_]eg/i.test(lang)) return 96;
    if (/^ar/i.test(l) && /hoda|naayf|hedayat|layla|tarik|salma|google|microsoft|samsung|amina/i.test(name)) return 95;
    if (/^ar/i.test(l)) return 85;
    if (/arab/i.test(name)) return 70;
    return -1;
  };
  var best = null, bestScore = -1;
  for (var i = 0; i < vs.length; i++) {
    var s = score(vs[i]);
    if (s > bestScore) { bestScore = s; best = vs[i]; }
  }
  return bestScore >= 0 ? best : null;
}
function arHasArVoice() { return !!arPickVoice(); }
function arClearResume() {
  try { if (arResumeTimer) { clearInterval(arResumeTimer); arResumeTimer = null; } } catch (e) {}
}
function arStop() {
  try { arSpeakToken++; } catch (e) {}
  try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
  try { if (arOnlineAudio) { arOnlineAudio.pause(); try { arOnlineAudio.src = ''; } catch (x) {} arOnlineAudio = null; } } catch (e) {}
  arClearResume();
  arSpeaking = false;
  try { arPaintSpeakState(); } catch (e) {}
}
function arVoiceStatus() {
  try {
    if (!('speechSynthesis' in window)) return { ok: false, msg: 'Este dispositivo no tiene voz disponible (speechSynthesis ausente).' };
    var v = arPickVoice();
    if (v) return { ok: true, msg: '🔊 Voz: ' + (v.name || 'árabe') + ' (' + (v.lang || 'ar-SA') + ')' };
    return { ok: false, msg: '⚠️ Sin voz árabe instalada: se intentará igual, pero puede sonar con acento raro o quedar en silencio.' };
  } catch (e) { return { ok: false, msg: '' }; }
}
function arCountVoices() {
  try {
    var vs = arEnsureVoices();
    var n = vs ? vs.length : 0, rc = 0;
    for (var i = 0; i < (vs || []).length; i++) {
      var l = String((vs[i] && vs[i].lang) || '').toLowerCase();
      var nm = String((vs[i] && vs[i].name) || '').toLowerCase();
      if (/^ar/.test(l) || /arab/.test(nm)) rc++;
    }
    return { total: n, ar: rc };
  } catch (e) { return { total: 0, ar: 0 }; }
}
function arRefreshVoiceStatus() {
  var el = $('arVoiceStatus');
  if (!el) return;
  var st = arVoiceStatus();
  var c = arCountVoices();
  var info = ' <span class="muted">(' + c.ar + ' árabe(s) de ' + c.total + ' voces)</span>';
  el.innerHTML = esc(st.msg) + info +
    ' <button type="button" id="arVoiceTest" class="btn su-337714">🔊 Probar voz</button>' +
    ' <button type="button" id="arOnlineTest" class="btn su-337714" title="Usa internet si tu equipo no tiene voz árabe">🌐 Oír online</button>' +
    (st.ok ? '' : '<br><span class="muted">Sin voz árabe el audio local puede quedar mudo: usa 🌐 Oír online (requiere internet) o instala voz árabe: <b>Windows:</b> Configuración → Hora e idioma → Voz → Agregar voz (Árabe). <b>Android:</b> Ajustes → Idioma → Salida TTS → instalar árabe. <b>iPhone:</b> Ajustes → Accesibilidad → Voces → Árabe. Luego recarga.</span>');
  try {
    var bt = $('arVoiceTest');
    if (bt) bt.onclick = function (e) { try { e.preventDefault(); } catch (x) {} arSpeak('السلام عليكم', { forceLocal: true }); };
    var on = $('arOnlineTest');
    if (on) on.onclick = function (e) { try { e.preventDefault(); } catch (x) {} arSpeakOnline(arShown ? arShown.ar : 'السلام عليكم'); };
  } catch (e) {}
}
function arVozLimpia(t) {
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
function arSpeakOnline(txt) {
  var text = arVozLimpia(txt);
  if (!text) text = String(txt == null ? '' : txt).trim();
  if (!text) return;
  try { arStop(); } catch (e) {}
  try {
    var url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=' + encodeURIComponent(text);
    var a = new Audio(url);
    arOnlineAudio = a;
    arSpeaking = true;
    try { arPaintSpeakState(); } catch (e) {}
    a.onended = function () { arSpeaking = false; arOnlineAudio = null; try { arPaintSpeakState(); } catch (x) {} };
    a.onerror = function () {
      arSpeaking = false; arOnlineAudio = null;
      try { arPaintSpeakState(); } catch (x) {}
      alert('No se pudo reproducir el audio online. Revisa tu conexión o instala una voz árabe en el dispositivo.');
    };
    var p = a.play();
    if (p && p.catch) p.catch(function () {
      arSpeaking = false; arOnlineAudio = null;
      try { arPaintSpeakState(); } catch (x) {}
    });
  } catch (e) { alert('No se pudo reproducir el audio online.'); }
}
function arPaintSpeakState() {
  try {
    var btns = document.querySelectorAll('#arabeDialog .ar-speaking');
    for (var i = 0; i < btns.length; i++) {
      if (arSpeaking) btns[i].classList.add('btn-accent');
      else btns[i].classList.remove('btn-accent');
    }
  } catch (e) {}
}
function arSpeak(txt, opts) {
  opts = opts || {};
  var text = arVozLimpia(txt);
  if (!text) text = String(txt == null ? '' : txt).trim();
  if (!text) return;
  if (opts.forceOnline) { arSpeakOnline(text); return; }
  try {
    if (!('speechSynthesis' in window)) { arSpeakOnline(text); return; }
    if (!opts.forceLocal && !arHasArVoice()) { arSpeakOnline(text); return; }
    var my = ++arSpeakToken;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    try { if (arOnlineAudio) { arOnlineAudio.pause(); arOnlineAudio = null; } } catch (e) {}
    arClearResume();
    arSpeaking = false;
    try { arPaintSpeakState(); } catch (e) {}
    setTimeout(function () {
      if (my !== arSpeakToken) return;
      try {
        try { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); } catch (x) {}
        var u = new SpeechSynthesisUtterance(text);
        var voice = arPickVoice();
        if (voice) { try { u.voice = voice; } catch (e) {} }
        u.lang = (voice && voice.lang) ? voice.lang : 'ar-SA';
        var slow = (opts.slow != null) ? !!opts.slow : arSlow;
        u.rate = slow ? 0.55 : 0.8;
        u.pitch = 1;
        u.volume = 1;
        arSpeaking = true;
        try { arPaintSpeakState(); } catch (e) {}
        var fellBack = false;
        u.onend = function () { arSpeaking = false; arClearResume(); try { arPaintSpeakState(); } catch (e) {} if (typeof opts.onend === 'function') { try { opts.onend(); } catch (x) {} } };
        u.onerror = function (ev) {
          arSpeaking = false; arClearResume();
          try { arPaintSpeakState(); } catch (e) {}
          try { arRefreshVoiceStatus(); } catch (e) {}
          if (!fellBack && !opts.forceLocal && !arHasArVoice()) {
            fellBack = true;
            arSpeakOnline(text);
            return;
          }
          if (typeof opts.onerror === 'function') { try { opts.onerror(ev); } catch (x) {} }
        };
        window.speechSynthesis.speak(u);
        try {
          arClearResume();
          arResumeTimer = setInterval(function () {
            try {
              if (window.speechSynthesis && window.speechSynthesis.speaking) {
                window.speechSynthesis.resume();
              } else { arClearResume(); }
            } catch (e) { arClearResume(); }
          }, 8000);
        } catch (e) {}
        try { arRefreshVoiceStatus(); } catch (e) {}
      } catch (e) {}
    }, 120);
  } catch (e) {}
}
function arSpeakExample(ex) {
  var t = String(ex || '');
  var cut = t.split('—')[0].trim().replace(/[.…!！?？]+.*$/, '').trim();
  if (!cut) cut = t;
  arSpeak(cut);
}
function arQuizPool() {
  if (arQuizLevel === 'a1') return AR_A1;
  if (arQuizLevel === 'a2') return AR_A2;
  if (arQuizLevel === 'b1') return AR_B1;
  if (arQuizLevel === 'frases') return AR_FRASES;
  if (arQuizLevel === 'avanzado') return AR_B2C1;
  return allAr();
}

function renderArStreak() {
  var b = $('arStreakBox'); if (!b) return;
  var d = getArData();
  var pct = d.total ? Math.round(d.ok / d.total * 100) : 0;
  b.innerHTML = '<b>🕌 Tu árabe:</b> ' + d.ok + '/' + d.total + ' correctas (' + pct + '%) · racha ' + d.streak + ' 🔥 ' +
    '<span class="muted su-11a508">— 1 palabra por día · A1→C1 + cultura · todo guardado local y privado.</span>';
}
function arCard(item, lv) {
  return '<button type="button" class="btn eng-word su-6cd6a1" data-w="' + esc(item.ar) + '"><b lang="ar" dir="rtl">🔊 ' + esc(item.ar) + '</b> ' +
    '<span class="chip su-0d5be0">' + esc(lv) + '</span><br><span class="su-2f290d">' + esc(item.tr) + ' · ' + esc(item.es) + '</span><br>' +
    '<span class="muted su-11a508">“' + esc(item.ex) + '”</span></button>';
}

var arFraseIdx = -1;
function renderArPanel(tab) {
  try { arStop(); } catch (e) {}
  arTab = tab || arTab;
  var ids = { palabra: 'tabAR1', a1: 'tabAR2', a2: 'tabAR3', b1: 'tabAR4', cultura: 'tabAR5', frases: 'tabAR7', quiz: 'tabAR6' };
  Object.keys(ids).forEach(function (k) { var el = $(ids[k]); if (el) el.classList.toggle('btn-accent', k === arTab); });
  renderArStreak();
  var box = $('arPanel'); if (!box) return;
  var html = '';
  if (arTab === 'palabra') {
    var all = allAr();
    var dayIdx = arDayIndex(all.length);
    if (!arShown || arShown._day !== dayIdx || !arShown._rand) {
      var base = all[dayIdx];
      arShown = { ar: base.ar, tr: base.tr, es: base.es, ex: base.ex, _day: dayIdx };
    }
    var w = arShown;
    var rel = [all[(dayIdx + 7) % all.length], all[(dayIdx + 13) % all.length]];
    var fecha = '';
    try { fecha = cal.fmtDate.format(new Date()); } catch (e) { try { fecha = new Date().toLocaleDateString(); } catch (e2) { fecha = ''; } }
    html += '<div class="menstrual-card su-3fa1a8">' +
      '<p class="muted su-11a508">☀️ كَلِمَةُ الْيَوْم · PALABRA DEL DÍA · ' + esc(fecha) + ' · ' + all.length + ' palabras y frases</p>' +
      '<div class="su-6adb68" lang="ar" dir="rtl">' + esc(w.ar) + '</div>' +
      '<div class="su-cd8bd8"><b>' + esc(w.tr) + '</b> · ' + esc(w.es) + '</div>' +
      '<p class="muted su-2b0979">“' + esc(w.ex) + '”</p>' +
      '<div class="su-9bc2df"><button type="button" id="arSpeakBtn" class="btn btn-accent su-30e741 ar-speaking">🔊 Escuchar (بِالْعَرَبِيَّة)</button> ' +
      '<button type="button" id="arOnlineBtn" class="btn su-30e741" title="Audio por internet (funciona aunque tu equipo no tenga voz árabe)">🌐 Online</button> ' +
      '<button type="button" id="arSlowBtn" class="btn su-30e741">🐢 Lento: ' + (arSlow ? 'ON' : 'OFF') + '</button> ' +
      '<button type="button" id="arExBtn" class="btn su-30e741">🗣️ Oír ejemplo</button> ' +
      '<button type="button" id="arStopBtn" class="btn su-30e741">⏹ Detener</button> ' +
      '<button type="button" id="arNextBtn" class="btn su-30e741">🎲 Otra palabra</button></div>' +
      '<p id="arVoiceStatus" class="muted su-11a508"></p></div>' +
      '<div class="help-grid su-d2c171">' +
      rel.map(function (r) { return '<div class="help-card"><h4><span lang="ar" dir="rtl">' + esc(r.ar) + '</span> <span class="muted">' + esc(r.tr) + '</span></h4><p class="su-11a508">' + esc(r.es) + '<br><span class="muted">“' + esc(r.ex) + '”</span></p></div>'; }).join('') + '</div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>🗣️ ¿Cómo practicar?</h4><p class="su-b439ab">1) <b>Escucha</b> con 🔊 y repite 3 veces en voz alta.<br>2) <b>Copia</b> la palabra a mano: el árabe se aprende escribiendo (de derecha a izquierda).<br>3) <b>Úsala hoy</b>: 1 palabra/día → ~365/año.<br>Pasa a A2 cuando leas 20 sin transliteración.</p></div>' +
      '<div class="help-card"><h4>📚 Niveles (CEFR)</h4><p class="su-b439ab">🌱 <b>A1:</b> sobrevivir (سلام، ماء، بيت).<br>🌿 <b>A2:</b> vida diaria (pasado, futuro, compras).<br>💬 <b>B1:</b> viaje + trabajo + opinión (idafa + كان).<br>📜 <b>B2–C1:</b> proverbios, pasiva, entrevista + cultura.</p></div></div>';
  } else if (arTab === 'a1') {
    html += '<div class="menstrual-card su-5a6934"><h4 class="su-752b1a">🌱 A1 Supervivencia — sobrevive en árabe</h4>' +
      '<p class="muted su-a6c665">Meta: presentarte, pedir agua/comida, contar 1–10. Gramática: <b>أنا/أنتَ/أنتِ + عِنْدِي (tener) + لا para negar</b>. No hay verbo “ser” en presente (أنا طالبة = “yo estudiante”). Todo se lee de <b>derecha a izquierda</b>. Toca 🔊 en cada tarjeta para oír (ar-SA).</p>' +
      '<div class="su-5e3875">' + AR_A1.map(function (x) { return arCard(x, 'A1'); }).join('') + '</div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>⚙️ عِنْدِي (el 50% del día)</h4><p class="su-583677"><b>عِنْدِي</b> (yo tengo) · <b>عِنْدَكَ</b> (tú tienes, m) · <b>عِنْدَكِ</b> (tú tienes, f)<br><b>هَذَا</b> (esto es) · <b>يُوجَد</b> (hay)<br><b>مَا عِنْدِي وَقْت</b> (no tengo tiempo)<br><span class="muted">Negación: <b>مَا / لَا</b>. Pregunta: <b>هَلْ…؟</b> al inicio.</span></p></div>' +
      '<div class="help-card"><h4>🎭 Mini-diálogo: en la feria</h4><p class="su-583677">— <b>اَلسَّلَامُ عَلَيْكُمْ! بِكَمْ هَذَا؟</b> (¡Hola! ¿Cuánto cuesta?)<br>— <b>خَمْسَةُ آلَافِ بَيْسُو.</b> (Cinco mil pesos.)<br>— <b>شُكْرًا! إِلَى اللِّقَاء!</b> (¡Gracias! ¡Nos vemos!)<br><span class="muted">Practica: una persona por línea. Responde siempre سلام primero: abre puertas.</span></p></div></div>';
  } else if (arTab === 'a2') {
    html += '<div class="menstrual-card su-018729"><h4 class="su-721a46">🌿 A2 Vida diaria — el día a día</h4>' +
      '<p class="muted su-a6c665">Meta: contar qué hiciste, planes, compras y direcciones. Gramática: <b>pasado con -تُ/-تَ (فعلتُ), سوف/سـ + presente, أكبر/الأكبر, يجب, هل يمكنك…؟</b>.</p>' +
      '<div class="su-5e3875">' + AR_A2.map(function (x) { return arCard(x, 'A2'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>🎭 Mini-diálogo: pidiendo dirección en Penco</h4><p class="su-583677">— <b>عَفْوًا، أَيْنَ الشَّاطِئ؟</b> (Disculpa, ¿dónde queda la playa?)<br>— <b>إِلَى الْأَمَام، ثُمَّ إِلَى الْيَسَار.</b> (Sigue recto y gira a la izquierda.)<br>— <b>شُكْرًا!</b> — <b>عَفْوًا!</b> (¡Gracias! / ¡De nada!)<br><span class="muted">Clave: أين (dónde) + يمين/يسار (derecha/izquierda) + أمام (recto).</span></p></div>';
  } else if (arTab === 'b1') {
    html += '<div class="menstrual-card su-d4d722"><h4 class="su-7c91e2">💬 B1 Intermedio — viajar, trabajar y opinar</h4>' +
      '<p class="muted su-a6c665">Meta: viajar, trabajar y opinar. Gramática estrella: <b>إذا… فـ… (si… entonces…)</b> + كان لل pasado continuo + إضافة (idafa) + conectores لذلك/رغم أن.</p>' +
      '<div class="su-5e3875">' + AR_B1.map(function (x) { return arCard(x, 'B1'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>🎭 Mini-diálogo: viaje a Concepción</h4><p class="su-583677">— <b>أُرِيدُ تَذْكِرَةً إِلَى كُونْسِبْسِيُون.</b> (Quiero un pasaje a Concepción.)<br>— <b>ذَهَاب فَقَط أَمْ ذَهَاب وَعَوْدَة؟</b> (¿Solo ida o ida y vuelta?) — <b>ذَهَاب وَعَوْدَة، مِنْ فَضْلِكَ.</b><br>— <b>مُنْذُ مَتَى تَعِيشُ هُنَا؟</b> — <b>مُنْذُ خَمْسِ سَنَوَات.</b> (¿Hace cuánto vives aquí? Cinco años.)<br><span class="muted">Practica con horarios, precios y “منذ + tiempo”.</span></p></div>';
  } else if (arTab === 'cultura') {
    html += '<div class="menstrual-card su-5b7cd0"><h4 class="su-399074">📜 B2–C1 Avanzado + Cultura viva</h4>' +
      '<p class="muted su-a6c665">Meta: entrevistas, proverbios y no pasar vergüenza con formalidad ni con ع/ح/ق. Gramática: <b>كان + قد (ya…), لو… لـ… (condicional), pasiva, indirecto con أنَّ, conectores ومع ذلك/بالإضافة</b>.</p>' +
      '<div class="su-5e3875">' + AR_B2C1.map(function (x) { return arCard(x, 'B2–C1'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>💬 Frases famosas</h4>' +
      '<p class="su-11a508">Las <b>30 frases famosas</b> tienen su propia pestaña: portada del día + tarjetas con 🔊 Escuchar y 📋 Copiar.</p>' +
      '<div class="su-9bc2df"><button type="button" class="btn btn-accent su-30e741 ar-goto-frases">💬 Ver frases famosas →</button></div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>⚠️ 8 sonidos que salvan vidas</h4><p class="su-583677">' + AR_FON.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div>' +
      '<div class="help-card"><h4>🌳 Raíz + género + idafa ¿Cuál uso?</h4><p class="su-583677">' + AR_GRAM.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>✍️ Alfabeto en 1 minuto: lo que ya puedes</h4><p class="su-583677">28 letras, todas con formas <b>inicial/media/final/aislada</b> pero la misma base. Ya distingues 6 fáciles: <b>ا ب ت ن م ل</b>. Solo cambian los puntos: <b>ب ت ث · ج ح خ · د ذ · ر ز · س ش · ص ض · ط ظ · ع غ · ف ق</b>. En 28 días copias tu nombre y lees carteles.</p></div>' +
      '<div class="help-card"><h4>🌙 Cultura para probar y celebrar</h4><p class="su-b439ab"><b>Probar:</b> té شَاي con menta, dátiles تَمْر, pan خبز: lee la receta en árabe y cocina.<br><b>Escuchar:</b> Fairuz («Atini al-nay»), Umm Kulzum («Alf leila»), 1 canción × 7 días.<br><b>Celebrar:</b> Ramadán (رَمَضَان, mes de ayuno y familia) y Eid al-Fitr (عيد الفطر, fiesta del desayuno).<br><span class="muted">Sabios: caligrafía (خط), zoco (سوق) y hospitalidad (ضيافة): decir أهلاً وسهلاً con sonrisa abre cualquier puerta.</span></p></div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>💼 Kit entrevista de trabajo</h4><p class="su-583677">— <b>حَدِّثْنَا عَنْ نَفْسِكَ.</b> (Cuénteme de usted.)<br>— <b>أَنَا مَسْؤُول وَأَعْمَلُ جَيِّدًا فِي فَرِيق.</b> (Soy responsable y trabajo bien en equipo.)<br>— <b>نُقْطَةُ قُوَّتِي… هَدَفِي…</b> (Mi fortaleza es… mi meta es…)<br><span class="muted">Cierra: «شُكْرًا لِوَقْتِكُم». (Gracias por su tiempo.)</span></p></div>';
  } else if (arTab === 'frases') {
    if (arFraseIdx < 0) arFraseIdx = arDayIndex(AR_FRASES.length);
    var FDAY = AR_FRASES[arFraseIdx % AR_FRASES.length];
    var fdate = '';
    try { fdate = cal.fmtDate.format(new Date()); } catch (e) { fdate = new Date().toLocaleDateString(); }
    html += '<div class="menstrual-card su-3fa1a8">' +
      '<p class="muted su-11a508">💬 FRASE DEL DÍA · ' + esc(fdate) + ' · ' + AR_FRASES.length + ' frases famosas</p>' +
      '<div class="su-6adb68" lang="ar" dir="rtl">' + '“' + esc(FDAY.ar) + '”</div>' +
      '<div class="su-cd8bd8"><b>' + esc(FDAY.es) + '</b></div>' +
      '<p class="su-11a508">🔤 <b>' + esc(FDAY.tr) + '</b></p>' +
            '<p class="muted su-2b0979">“' + esc(FDAY.ex) + '”</p>' +
      '<div class="su-9bc2df"><button type="button" class="btn btn-accent su-30e741 ar-hear" data-w="' + esc(FDAY.ar) + '">🔊 Escuchar</button> ' +
      '<button type="button" id="arFraseRnd" class="btn su-30e741">🎲 Otra frase</button></div></div>' +
      AR_FRASES.map(function (x) {
        return '<div class="menstrual-card su-4adf8c"><h4 lang="ar" dir="rtl">“' + esc(x.ar) + '”</h4>' +
          '<p><b>' + esc(x.es) + '</b>' +
          '<br><span class="su-11a508">🔤 ' + esc(x.tr) + '</span>' +
          '<br><span class="muted">“' + esc(x.ex) + '”</span></p>' +
          '<div class="su-9bc2df"><button type="button" class="btn btn-accent su-30e741 ar-hear" data-w="' + esc(x.ar) + '">🔊 Escuchar</button> ' +
          '<button type="button" class="btn su-30e741 ar-copy" data-w="' + esc(x.ar) + '|' + esc(x.es) + '">📋 Copiar</button></div></div>';
      }).join('') +
      '<div class="menstrual-card su-5a6934"><h4 class="su-752b1a">🗣️ ¿Cómo practicar?</h4>' +
      '<p class="muted su-a6c665">1) <b>Escucha</b> la frase del día con 🔊 y repítela 3 veces en voz alta.<br>2) <b>Copia</b> tu favorita con 📋 y pégala en las Notas del día.<br>3) <b>Úsala hoy</b>: una frase al día son 365 al año.</p></div>';
  } else if (arTab === 'quiz') {
    var d = getArData();
    if (!arQuizQ) {
      var pool = arQuizPool();
      var wq = pool[Math.floor(Math.random() * pool.length)];
      var opts = {};
      opts[arQuizMode === 'translit' ? wq.tr : wq.es] = 1;
      var guard = 0;
      while (Object.keys(opts).length < 4 && guard < 60) { guard++; var c = pool[Math.floor(Math.random() * pool.length)]; opts[arQuizMode === 'translit' ? c.tr : c.es] = 1; }
      var arr = Object.keys(opts).sort(function () { return Math.random() - 0.5; });
      arQuizQ = { w: wq, opts: arr };
    }
    var q = arQuizQ;
    var lvBtn = function (v, l) { return '<button type="button" class="btn ar-lv' + (arQuizLevel === v ? ' btn-accent' : '') + ' su-337714" data-lv="' + v + '">' + l + '</button>'; };
    var mdBtn = function (v, l) { return '<button type="button" class="btn ar-md' + (arQuizMode === v ? ' btn-accent' : '') + ' su-337714" data-md="' + v + '">' + l + '</button>'; };
    html += '<div class="menstrual-card su-1f2df9"><h4 class="su-399074">🧩 Quiz por niveles</h4>' +
      '<div class="su-a8712a">' + lvBtn('todo', '🌎 Todo') + lvBtn('a1', '🌱 A1') + lvBtn('a2', '🌿 A2') + lvBtn('b1', '💬 B1') + lvBtn('frases', '💬 Frases') + lvBtn('avanzado', '📜 B2–C1') + '</div>' +
      '<div class="su-a8712a">' + mdBtn('significado', '🇪🇸 Significado') + mdBtn('translit', '🔤 Transliteración') + '</div>' +
      '<div class="su-73ce29" lang="ar" dir="rtl">“' + esc(q.w.ar) + '”</div><div class="muted su-11a508">' + esc(q.w.tr) + ' · ' + (arQuizMode === 'translit' ? '¿cómo se pronuncia?' : '¿qué significa?') + '</div>' +
      '<button type="button" id="arQuizSpeak" class="btn su-337714 ar-speaking">🔊 Escuchar</button> ' +
      '<button type="button" id="arQuizOnline" class="btn su-337714" title="Audio por internet">🌐</button> ' +
      '<button type="button" id="arQuizSlow" class="btn su-337714">🐢 Lento: ' + (arSlow ? 'ON' : 'OFF') + '</button> ' +
      '<button type="button" id="arQuizStop" class="btn su-337714">⏹</button>' +
      '<p id="arVoiceStatus" class="muted su-11a508"></p>' +
      '<div class="su-ae0e71">' + q.opts.map(function (o) { return '<button type="button" class="btn ar-opt su-046678" data-o="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div>' +
      '<div id="arQuizFb" class="su-ac1122"></div>' +
      '<p class="muted su-e13d76">Correctas ' + d.ok + '/' + d.total + ' · racha ' + d.streak + ' · nivel: <b>' + esc(arQuizLevel) + '</b> · modo: <b>' + esc(arQuizMode) + '</b> · banco: ' + arQuizPool().length + ' palabras/frases</p></div>';
  }
  box.innerHTML = html + '<p class="muted su-a953a7">🔊 Toca cualquier tarjeta para oír en árabe (voz árabe del dispositivo, ar-SA). El quiz suma a tu racha local y privada. El árabe se lee de derecha a izquierda: sigue la flecha → empieza por la derecha.</p>';
  try { arEnsureVoices(); arRefreshVoiceStatus(); } catch (e) {}
  try { arPaintSpeakState(); } catch (e) {}
  var sp = $('arSpeakBtn');
  if (sp) sp.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (arShown) arSpeak(arShown.ar); };
  var onB = $('arOnlineBtn');
  if (onB) onB.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (arShown) arSpeakOnline(arShown.ar); };
  var sl = $('arSlowBtn');
  if (sl) sl.onclick = function (e) { try { e.preventDefault(); } catch (x) {} arSlow = !arSlow; sl.textContent = '🐢 Lento: ' + (arSlow ? 'ON' : 'OFF'); if (arShown) arSpeak(arShown.ar); };
  var exB = $('arExBtn');
  if (exB) exB.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (arShown) arSpeakExample(arShown.ex); };
  var stB = $('arStopBtn');
  if (stB) stB.onclick = function (e) { try { e.preventDefault(); } catch (x) {} arStop(); };
  var nx = $('arNextBtn');
  if (nx) nx.onclick = function () {
    try {
      var a = allAr();
      var di = arDayIndex(a.length);
      var pick = a[Math.floor(Math.random() * a.length)];
      var gd = 0;
      while (arShown && pick.ar === arShown.ar && gd < 25) { gd++; pick = a[Math.floor(Math.random() * a.length)]; }
      arShown = { ar: pick.ar, tr: pick.tr, es: pick.es, ex: pick.ex, _day: di, _rand: 1 };
      arStop();
      renderArPanel('palabra');
      if (arShown) arSpeak(arShown.ar);
    } catch (e) { try { renderArPanel('palabra'); } catch (x) {} }
  };
  var qs = $('arQuizSpeak');
  if (qs) qs.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (arQuizQ) arSpeak(arQuizQ.w.ar); };
  var qo = $('arQuizOnline');
  if (qo) qo.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (arQuizQ) arSpeakOnline(arQuizQ.w.ar); };
  var qsl = $('arQuizSlow');
  if (qsl) qsl.onclick = function (e) { try { e.preventDefault(); } catch (x) {} arSlow = !arSlow; qsl.textContent = '🐢 Lento: ' + (arSlow ? 'ON' : 'OFF'); if (arQuizQ) arSpeak(arQuizQ.w.ar); };
  var qst = $('arQuizStop');
  if (qst) qst.onclick = function (e) { try { e.preventDefault(); } catch (x) {} arStop(); };
  box.querySelectorAll('.eng-word').forEach(function (b) {
    b.onclick = function (e) { try { e.preventDefault(); } catch (x) {} arSpeak(b.getAttribute('data-w')); };
  });
  box.querySelectorAll('.ar-hear').forEach(function (b) {
    b.onclick = function (e) { try { e.preventDefault(); } catch (x) {} arSpeak(b.getAttribute('data-w')); };
  });
  box.querySelectorAll('.ar-copy').forEach(function (b) {
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
  box.querySelectorAll('.ar-goto-frases').forEach(function (b) {
    b.onclick = function () { renderArPanel('frases'); };
  });
  var frnd = $('arFraseRnd');
  if (frnd) frnd.onclick = function () { arFraseIdx = Math.floor(Math.random() * AR_FRASES.length); renderArPanel('frases'); };

  box.querySelectorAll('.ar-lv').forEach(function (b) {
    b.onclick = function () { arQuizLevel = b.getAttribute('data-lv'); arQuizQ = null; renderArPanel('quiz'); };
  });
  box.querySelectorAll('.ar-md').forEach(function (b) {
    b.onclick = function () { arQuizMode = b.getAttribute('data-md'); arQuizQ = null; renderArPanel('quiz'); };
  });
  box.querySelectorAll('.ar-opt').forEach(function (b) {
    b.onclick = function () {
      var d2 = getArData();
      var good = arQuizMode === 'translit' ? arQuizQ.w.tr : arQuizQ.w.es;
      var ok = b.getAttribute('data-o') === good;
      d2.total = (d2.total || 0) + 1;
      if (ok) { d2.ok = (d2.ok || 0) + 1; d2.streak = (d2.streak || 0) + 1; }
      else { d2.streak = 0; }
      try { if (typeof scheduleSave === 'function') scheduleSave('Guardado ✓'); } catch (e) {}
      var fb = $('arQuizFb');
      if (fb) fb.innerHTML = ok ? '✅ ¡Muy bien! <b><span lang="ar" dir="rtl">' + esc(arQuizQ.w.ar) + '</span></b> ' + esc(arQuizQ.w.tr) + ' — “' + esc(arQuizQ.w.ex) + '”'
        : '❌ Era <b>' + esc(good) + '</b> — <span lang="ar" dir="rtl">' + esc(arQuizQ.w.ar) + '</span> ' + esc(arQuizQ.w.tr) + ' “' + esc(arQuizQ.w.ex) + '”';
      box.querySelectorAll('.ar-opt').forEach(function (x) {
        x.disabled = true;
        if (x.getAttribute('data-o') === good) x.classList.add('btn-accent');
      });
      renderArStreak();
      setTimeout(function () { arQuizQ = null; if (arTab === 'quiz') renderArPanel('quiz'); }, ok ? 1400 : 2400);
    };
  });
}

/* ---------------- DIÁLOGO ---------------- */
function buildDialog() {
  if ($('arabeDialog')) return;
  var d = document.createElement('dialog');
  d.id = 'arabeDialog';
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053"><h3 class="su-ee0cfe">🕌 Árabe — A1 → C1 + cultura</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Aprende <b>árabe (اَلْعَرَبِيَّة, con transliteración) por niveles CEFR + cultura viva</b>, como el Kimün, el Inglés, el Portugués, el Chino, el Hindi, el Italiano, el Ruso, el Japonés y el Latín: 1 palabra por día + raíz + quiz. Toca 🔊 para oír (voz del dispositivo, ar-SA). Todo queda <b>local y privado</b> por usuario. Se lee de <b>derecha a izquierda</b>.</p>' +
    '<div id="arStreakBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="timer-tabs su-f7ad78">' +
    '<button type="button" id="tabAR1" class="btn btn-accent su-30e741">☀️ Palabra del día</button>' +
    '<button type="button" id="tabAR2" class="btn su-30e741">🌱 A1</button>' +
    '<button type="button" id="tabAR3" class="btn su-30e741">🌿 A2</button>' +
    '<button type="button" id="tabAR4" class="btn su-30e741">💬 B1</button>' +
    '<button type="button" id="tabAR5" class="btn su-30e741">📜 B2–C1 + Cultura</button>' +
    '<button type="button" id="tabAR7" class="btn su-30e741">💬 Frases famosas</button>' +
    '<button type="button" id="tabAR6" class="btn su-30e741">🧩 Quiz</button></div>' +
    '<div id="arPanel"></div>' +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { arStop(); } catch (e) {} try { d.close(); } catch (e2) {} }; });
  try {
    d.addEventListener('close', function () { try { arStop(); } catch (e) {} });
    d.addEventListener('cancel', function () { try { arStop(); } catch (e) {} });
  } catch (e) {}
}

function bindTabs() {
  var map = { tabAR1: 'palabra', tabAR2: 'a1', tabAR3: 'a2', tabAR4: 'b1', tabAR5: 'cultura', tabAR6: 'quiz', tabAR7: 'frases' };
  Object.keys(map).forEach(function (id) {
    var el = $(id);
    if (el) el.onclick = function () {
      try { arStop(); } catch (e) {}
      if (map[id] !== 'quiz') arQuizQ = null;
      if (map[id] === 'palabra') arShown = null;
      renderArPanel(map[id]);
    };
  });
}

/* ---------------- SETUP ---------------- */
function ensureButton() {
  try {
    var existing = $('btnArabe');
    if (existing) { try { existing.setAttribute('data-sub', 'idiomas'); } catch (e) {} return existing; }
    var g = document.querySelector('.action-group[data-group="aprender"] .group-btns');
    if (!g) return null;
    var btn = document.createElement('button');
    btn.id = 'btnArabe'; btn.className = 'btn'; btn.type = 'button';
    btn.textContent = '🕌 Árabe';
    try { btn.setAttribute('data-sub', 'idiomas'); } catch (e2) {}
    btn.setAttribute('data-keywords', 'arabe arab arabic arabia fusha darija coran quran ramadan salam shukran caligrafia mecca egipto marruecos idioma niveles a1 a2 b1 b2 c1 basico intermedio avanzado quiz vocabulario gramatica raiz idafa transliteracion dual plural sol luna');
    var ref = g.querySelector('#btnLatin') || g.querySelector('#btnJapones') || g.querySelector('#btnRuso') || g.querySelector('#btnItaliano') || g.querySelector('#btnHindi');
    if (ref && ref.parentNode === g) g.insertBefore(btn, ref.nextSibling);
    else g.appendChild(btn);
    return btn;
  } catch (e) { return null; }
}

function registerGlobals() {
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnArabe') < 0) {
      var i = -1;
      try { i = ALL_BTNS.indexOf('btnLatin'); } catch (e) {}
      if (i < 0) { try { i = ALL_BTNS.indexOf('btnJapones'); } catch (e2) {} }
      if (i < 0) { try { i = ALL_BTNS.indexOf('btnRuso'); } catch (e3) {} }
      if (i >= 0) ALL_BTNS.splice(i + 1, 0, 'btnArabe');
      else ALL_BTNS.push('btnArabe');
    }
  } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnArabe = ['aprender', 'idiomas']; } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['aprender|idiomas'] && BTN_ORDER['aprender|idiomas'].indexOf('btnArabe') < 0) {
      BTN_ORDER['aprender|idiomas'].push('btnArabe');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p] && (p === 'todo' || p === 'adulto' || p === 'estudiante' || p === 'docente' || p === 'adolescente')) PRESETS[p].btnArabe = true;
      });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnArabe"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Aprender') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnArabe"> 🕌 Árabe';
          var ref2 = gr.querySelector('input[data-btn="btnLatin"]') || gr.querySelector('input[data-btn="btnJapones"]') || gr.querySelector('input[data-btn="btnRuso"]');
          if (ref2 && ref2.closest && ref2.closest('label') && ref2.closest('label').parentNode) {
            ref2.closest('label').parentNode.insertBefore(lab, ref2.closest('label').nextSibling);
          } else { gr.appendChild(lab); }
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnArabe !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnArabe = lab.querySelector('input').checked;
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
  renderArPanel('palabra');
  var b = $('btnArabe');
  if (!b) { if ((setup._r = (setup._r || 0) + 1) < 60) setTimeout(setup, 500); return; }
  if (!b.dataset.ara) {
    b.dataset.ara = '1';
    b.addEventListener('click', function () {
      arQuizQ = null;
      arShown = null;
      try { arEnsureVoices(); } catch (e) {}
      renderArPanel('palabra');
      openDlg('arabeDialog');
    });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 500); });
else setTimeout(setup, 500);

})();
