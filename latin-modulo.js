/* ============================================================
   LATÍN · LATINA A1 → C1 + FRASES CON PRONUNCIACIÓN — Calendario 13 Lunas
   Sección completa dentro de Aprender > Idiomas y cultura:
   - Botón btnLatin (grupo aprender, sub idiomas, junto a
     Kimün Mapuzugun, Inglés, Portugués, Chino, Hindi,
     Italiano, Ruso y Japonés)
   - Diálogo latinDialog con 6 pestañas:
     1) ☀️ Verbum diei (palabra/frase rotativa + TTS it-IT,
        pronunciación eclesiástica, la más usada en Chile)
     2) 🌱 A1 Fundamenta (20 tarjetas + esse/habere + mini-diálogo)
     3) 🌿 A2 Vita cotidiana (14 tarjetas + perfecto + direcciones)
     4) 💬 B1 Iter, opus et opinio (10 + futuro/participios)
     5) 🏛️ Frases latinas + pronunciación (82 frases célebres con
        guía fonética en español + B2–C1 + cultura romana)
     6) 🧩 Quiz por niveles + racha local
   - Todo local y privado por usuario:
     userData().latin = { ok, total, streak, lastDay }
   - 100% offline. TTS usa la voz del dispositivo (speechSynthesis
     con lang it-IT: el italiano suena casi igual que el latín
     eclesiástico), igual que Inglés, Portugués, Italiano, etc.
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
/* la: latín · es: español · pron: pronunciación eclesiástica (fonética chilena) · ex: ejemplo (latín — español) */
var LA_A1 = [
  { la: 'salvē / salvēte', es: 'hola (a 1 / a varios)', pron: 'SÁL-ue / sal-UÉ-te', ex: 'Salvē, amīce! — ¡Hola, amigo!' },
  { la: 'grātiās (tibi agō)', es: 'gracias (te doy gracias)', pron: 'GRÁ-tsi-as (TÍ-bi Á-go)', ex: 'Grātiās maximās! — ¡Muchísimas gracias!' },
  { la: 'amābō tē / per favorem', es: 'por favor (lit. te amaré / por favor)', pron: 'a-MÁ-bo te / per fa-UÓ-rem', ex: 'Aquam, amābō tē. — Agua, por favor.' },
  { la: 'bonum diem / bonam noctem', es: 'buenos días / buenas noches', pron: 'BÓ-num DÍ-em / BÓ-nam NÓK-tem', ex: 'Bonam noctem, crās vidēbimus. — Buenas noches, nos vemos mañana.' },
  { la: 'valē / valēte', es: 'chao / adiós (cuídate)', pron: 'UÁ-le / ua-LÉ-te', ex: 'Valē! Crās vidēbimus. — ¡Chao! Nos vemos mañana.' },
  { la: 'mihi nōmen est…', es: 'me llamo…', pron: 'MÍ-i NÓ-men est', ex: 'Mihi nōmen est Ana. — Me llamo Ana.' },
  { la: 'ex Chile (e Penco) sum', es: 'soy de Chile (de Penco)', pron: 'eks CHÍ-le (e PÉN-ko) sum', ex: 'E Penco, Chile sum. — Soy de Penco, Chile.' },
  { la: 'Latīnē loqueris?', es: '¿hablas latín?', pron: 'la-TÍ-ne LÓ-kue-ris', ex: 'Paulum Latīnē loquor. — Hablo un poco de latín.' },
  { la: 'aqua', es: 'agua', pron: 'Á-kua', ex: 'Poculum aquae, amābō tē. — Un vaso de agua, por favor.' },
  { la: 'pānis / cibus', es: 'pan / comida', pron: 'PÁ-nis / CHÍ-bus', ex: 'Pānem et piscem, amābō tē. — Pan y pescado, por favor.' },
  { la: 'domus', es: 'casa / hogar', pron: 'DÓ-mus', ex: 'Domus mea prope mare est. — Mi casa queda cerca del mar.' },
  { la: 'diēs / hodiē', es: 'día / hoy', pron: 'DÍ-es / o-DÍ-e', ex: 'Hodiē pulcher diēs est. — Hoy es un lindo día.' },
  { la: 'esse: ego sum / tū es', es: 'ser-estar: yo soy-estoy / tú eres-estás', pron: 'É-go sum / tu es', ex: 'Ego fessa sum. Tū benignus es. — Estoy cansada. Eres amable.' },
  { la: 'habēre: ego habeō', es: 'tener-haber: yo tengo-he', pron: 'É-go Á-be-o', ex: 'Duās sorōrēs habeō. — Tengo dos hermanas.' },
  { la: 'numerī 1–20', es: 'números 1–20', pron: 'NÚ-me-ri', ex: 'Ūnus, duo, trēs… vīgintī. — Uno, dos, tres… veinte.' },
  { la: 'colōrēs: ruber, caeruleus, viridis', es: 'colores: rojo, azul (mar), verde', pron: 'RÚ-ber, che-RÚ-le-us, UÍ-ri-dis', ex: 'Mare caeruleum est. — El mar es azul.' },
  { la: 'familia: māter, pater', es: 'familia: madre, padre', pron: 'MÁ-ter, PÁ-ter', ex: 'Māter mea bene coquit. — Mi mamá cocina bien.' },
  { la: 'amō… / mihi placet…', es: 'amo… / me gusta…', pron: 'Á-mo / MÍ-i PLÁ-chet', ex: 'Mare mihi placet. — Me gusta el mar.' },
  { la: 'mihi opus est…', es: 'necesito… (me es necesario)', pron: 'MÍ-i Ó-pus est', ex: 'Mihi auxiliō opus est. — Necesito ayuda.' },
  { la: 'crās vidēbimus', es: 'nos vemos mañana', pron: 'kras ui-DÉ-bi-mus', ex: 'Valē! Crās vidēbimus. — ¡Chao! Nos vemos mañana.' }
];
var LA_A2 = [
  { la: 'Quid heri fēcistī?', es: '¿Qué hiciste ayer?', pron: 'kuid É-ri fe-CHÍS-ti', ex: 'In hortō labōrāvī. — Trabajé en la huerta.' },
  { la: 'cras + futurum (coquam)', es: 'voy a… / haré (futuro: coquam = cocinaré)', pron: 'kras + fu-TÚ-rum', ex: 'Crās coquam. — Mañana voy a cocinar.' },
  { la: 'maior quam / maximus', es: 'más grande que / el más grande', pron: 'ma-YOR kuam / MÁK-si-mus', ex: 'Mare flūmine maius est. — El mar es más grande que el río.' },
  { la: 'quantī (pretium)? / quot?', es: '¿cuánto cuesta? / ¿cuántos?', pron: 'KUÁN-ti / kuot', ex: 'Quantī cōnstat? — ¿Cuánto cuesta?' },
  { la: 'mihi labōrandum est', es: 'tengo que trabajar (gerundivo)', pron: 'MÍ-i la-bo-RÁN-dum est', ex: 'Nunc mihi abeundum est. — Me tengo que ir ahora.' },
  { la: 'potesne mē adiuvāre?', es: '¿puedes ayudarme?', pron: 'po-TÉS-ne me ad-yu-UÁ-re', ex: 'Potesne lentē loquī? — ¿Puedes hablar despacio?' },
  { la: 'est / sunt', es: 'hay (singular / plural)', pron: 'est / sunt', ex: 'Forum est. — Hay una feria.' },
  { la: 'tempestās: sōl lūcet / pluit', es: 'clima: hay sol / llueve', pron: 'sol LÚ-chet / PLU-it', ex: 'Hodiē Penci pluit. — Hoy llueve en Penco.' },
  { la: 'perfectum: īvī, comēdī, vīdī', es: 'pasado: fui, comí, vi', pron: 'Í-ui, ko-MÉ-di, UÍ-di', ex: 'Ad lītus īvimus. — Fuimos a la playa.' },
  { la: 'mercātūra: quantī cōnstat?', es: 'compras: ¿cuánto es?', pron: 'mer-ka-TÚ-ra', ex: 'Quīnque mīlia nummōrum. — Son cinco mil pesos.' },
  { la: 'itineris ductiō: ad laevam / ad dextram', es: 'direcciones: a la izquierda / a la derecha', pron: 'ad LÉ-uam / ad DÉKS-tram', ex: 'Ad laevam in forō flecte. — Gira a la izquierda en la plaza.' },
  { la: 'animī habitūs: laetus, fessus, aeger', es: 'ánimo: feliz, cansado/a, enfermo/a', pron: 'LÉ-tus, FÉS-sus, É-ger', ex: 'Hodiē valdē fessa sum. — Hoy estoy muy cansada.' },
  { la: 'coquere / purgāre / lavāre', es: 'cocinar / limpiar / lavar', pron: 'KÓ-kue-re / pur-GÁ-re / la-UÁ-re', ex: 'Cotīdiē coquō. — Cocino todos los días.' },
  { la: 'conventus: hora tertia post meridiem', es: 'cita: a las tres de la tarde', pron: 'o-RA TER-tsi-a post me-RI-di-em', ex: 'Hora quinta conveniemus. — Nos vemos a las cinco.' }
];
/*__PART2__*/
var LA_B1 = [
  { la: 'hic quinque annos habitamus', es: 'vivimos aqui desde hace 5 anos', pron: 'hik KUIN-kue AN-nos a-bi-TA-mus', ex: 'Numquam nivem vidi. — Nunca he visto nieve.' },
  { la: 'si pluet, domi manebimus', es: 'si llueve, nos quedamos (si + futuro)', pron: 'si PLU-et, DO-mi ma-ne-BI-mus', ex: 'Si studueris, disces. — Si estudias, aprenderas.' },
  { la: 'quaerere / curare / noli desperare', es: 'buscar / cuidar / no desesperes', pron: 'kue-RE-re / ku-RA-re / NO-li des-pe-RA-re', ex: 'Noli desperare! — No te rindas!' },
  { la: 'iter: tessera ad Concepcionem', es: 'viajes: un pasaje a Concepcion', pron: 'TES-se-ra ad kon-chep-tsi-O-nem', ex: 'Tessera ad Concepcionem, amabo te. — Un pasaje a Concepcion, por favor.' },
  { la: 'opus: horti curator sum', es: 'trabajo: estoy a cargo de la huerta', pron: 'OR-ti ku-RA-tor sum', ex: 'Horti curator sum. — Estoy a cargo de la huerta.' },
  { la: 'opinio: censeo / meo iudicio', es: 'opinion: creo que / en mi opinion', pron: 'CHEN-se-o / ME-o yu-DI-chi-o', ex: 'Censeo bonam ideam esse. — Creo que es buena idea.' },
  { la: 'olim + imperfectum (ludbam)', es: 'solia + verbo (imperfecto: ludebam)', pron: 'O-lim + im-per-FEK-tum', ex: 'Parva cithara ludebam. — De nina tocaba guitarra.' },
  { la: 'ergo / quia / etiamsi', es: 'asi que / porque / aunque', pron: 'ER-go / KUI-a / et-YAM-si', ex: 'Frigus erat, ergo domi mansimus. — Hacia frio, asi que nos quedamos.' },
  { la: 'valetudo: caput mihi dolet', es: 'salud: me duele la cabeza', pron: 'KA-put MI-i DO-let', ex: 'Medico mihi opus est. — Necesito una hora medica.' },
  { la: 'epistula: cura ut valeas / amplector', es: 'correo: cuidate / un abrazo', pron: 'KU-ra ut UA-le-as / am-PLEK-tor', ex: 'Cura ut valeas, Ana. — Cuidate, Ana.' }
];
var LA_B2C1 = [
  { la: 'glaciem frangere', es: 'romper el hielo', pron: 'GLA-chi-em FRAN-ge-re', ex: 'Iocus glaciem frangit. — Un chiste rompe el hielo.' },
  { la: 'duos lepores uno ictu capere', es: 'matar dos pajaros de un tiro', pron: 'DU-os le-PO-res U-no IK-tu KA-pe-re', ex: 'Avia et amita una visitatione: duos lepores! — Visito a abuela y tia de una vez.' },
  { la: 'manus in massa habere', es: 'estar metido en todo (manos en la masa)', pron: 'MA-nus in MAS-sa a-BE-re', ex: 'Ubique manus habet. — Esta metido en todo.' },
  { la: 'iam profectus eram cum venisti', es: 'ya me habia ido cuando llegaste (pluscuamperfecto)', pron: 'yam pro-FEK-tus E-ram kum ue-NIS-ti', ex: 'Para contar historias en pasado: eram + participio.' },
  { la: 'si studuissem, probavissem', es: 'si hubiera estudiado, habria aprobado', pron: 'si stu-du-IS-sem, pro-ba-UIS-sem', ex: 'Arrepentimientos y lecciones: si + subjuntivo + condicional.' },
  { la: 'litus a voluntariis purgatum est', es: 'la playa fue limpiada (voz pasiva)', pron: 'LI-tus a uo-lun-TA-ris pur-GA-tum est', ex: 'Pasiva: esse + participio + a/ab + ablativo.' },
  { la: 'dixit se fessam esse', es: 'dijo que estaba cansada (estilo indirecto)', pron: 'DIK-sit se FES-sam ES-se', ex: 'Directo a indirecto: sum - esse con acusativo.' },
  { la: 'colloquium: mea virtus est…', es: 'entrevista: mi fortaleza es…', pron: 'kol-LO-kui-um: ME-a UIR-tus est', ex: 'Mea virtus est labor communis. — Mi fortaleza es el trabajo en equipo.' },
  { la: 'tamen / praeterea', es: 'sin embargo / ademas (ensayo)', pron: 'TA-men / pre-TE-re-a', ex: 'Tamen, mare vita est. — Sin embargo, el mar es vida.' },
  { la: 'de gustibus non est disputandum', es: 'sobre gustos no hay disputa', pron: 'de GUS-ti-bus non est dis-pu-TAN-dum', ex: 'Gerundivo de obligacion: non est + gerundivo.' }
];
/*__PART3__*/
var LA_FRASES = [
  { la: 'Carpe diem', es: 'aprovecha el dia (no lo dejes pasar)', pron: 'KAR-pe DI-em', ex: 'Horacio, Odas — Carpe diem, quam minimum credula postero. — Aprovecha hoy, no confies en manana.' },
  { la: 'Veni, vidi, vici', es: 'vine, vi, venci', pron: 'UE-ni, UI-di, UI-chi', ex: 'Julio Cesar (Zela, 47 a.C.) — Tres verbos perfectos: victoria rapidisima.' },
  { la: 'Alea iacta est', es: 'la suerte esta echada', pron: 'A-le-a YAK-ta est', ex: 'Cesar al cruzar el Rubicon — Dicho antes de una decision sin retorno.' },
  { la: 'Cogito, ergo sum', es: 'pienso, luego existo', pron: 'KO-yi-to, ER-go sum', ex: 'Descartes — Base de la filosofia moderna: si dudo, existo.' },
  { la: 'Per aspera ad astra', es: 'por lo aspero, hasta las estrellas', pron: 'per AS-pe-ra ad AS-tra', ex: 'Seneca — El esfuerzo dificil lleva a lo alto. Lema de la NASA y escuelas.' },
  { la: 'Amor vincit omnia', es: 'el amor todo lo vence', pron: 'A-mor UIN-chit OM-ni-a', ex: 'Virgilio, Eglogas — El amor como fuerza que supera todo.' },
  { la: 'Memento mori', es: 'recuerda que moriras', pron: 'me-MEN-to MO-ri', ex: 'Filosofia estoica — Recuerda lo finito para vivir lo esencial.' },
  { la: 'Tempus fugit', es: 'el tiempo huye (vuela)', pron: 'TEM-pus FU-yit', ex: 'Virgilio, Georgicas — El tiempo no espera: usalo hoy.' },
  { la: 'Errare humanum est', es: 'errar es humano', pron: 'er-RA-re u-MA-num est', ex: 'Seneca — Equivocarse es humano; perseverar en el error, no.' },
  { la: 'Festina lente', es: 'apresurate despacio (sin pausa, sin prisa)', pron: 'fes-TI-na LEN-te', ex: 'Augusto — Hazlo rapido pero bien: lema de este calendario.' },
  { la: 'Audaces fortuna iuvat', es: 'la fortuna ayuda a los audaces', pron: 'au-DA-ches for-TU-na YU-vat', ex: 'Virgilio, Eneida — Atrevete: la suerte sigue al que actua.' },
  { la: 'Dum spiro, spero', es: 'mientras respiro, espero', pron: 'dum SPI-ro, SPE-ro', ex: 'Ciceron — Mientras hay vida, hay esperanza.' },
  { la: 'Si vis pacem, para bellum', es: 'si quieres la paz, prepara la defensa', pron: 'si uis PA-chem, PA-ra BEL-lum', ex: 'Vegecio — La mejor defensa evita la pelea.' },
  { la: 'Divide et impera', es: 'divide y gobernaras', pron: 'di-UI-de et im-PE-ra', ex: 'Estrategia romana — Une a tu gente para que nadie te divida.' },
  { la: 'Sapere aude', es: 'atrevete a saber (piensa por ti)', pron: 'sa-PE-re AU-de', ex: 'Horacio; lema ilustrado (Kant) — Atrevete a usar tu razon.' },
  { la: 'Veritas vos liberabit', es: 'la verdad los hara libres', pron: 'UE-ri-tas vos li-be-RA-bit', ex: 'Evangelio de Juan 8:32 — La verdad libera.' },
  { la: 'Ora et labora', es: 'reza y trabaja', pron: 'O-ra et la-BO-ra', ex: 'Regla benedictina — Ora y trabaja: las dos alas del dia.' },
  { la: 'Labor omnia vincit', es: 'el trabajo todo lo vence', pron: 'LA-bor OM-ni-a UIN-chit', ex: 'Virgilio, Georgicas — La constancia vence: ideal para la huerta.' },
  { la: 'Mens sana in corpore sano', es: 'mente sana en cuerpo sano', pron: 'mens SA-na in KOR-po-re SA-no', ex: 'Juvenal — Entrena cuerpo y mente juntos.' },
  { la: 'Ars longa, vita brevis', es: 'el arte es largo, la vida breve', pron: 'ars LON-ga, UI-ta BRE-uis', ex: 'Hipocrates (en latin) — Aprende un oficio toda la vida.' },
  { la: 'Ex nihilo nihil fit', es: 'de la nada, nada sale', pron: 'eks NI-i-lo NI-il fit', ex: 'Lucrecio — Todo fruto pide semilla y trabajo.' },
  { la: 'Vanitas vanitatum, omnia vanitas', es: 'vanidad de vanidades, todo es vanidad', pron: 'UA-ni-tas ua-ni-TA-tum, OM-ni-a UA-ni-tas', ex: 'Eclesiastes — Lo que no amas se vuelve humo.' },
  { la: 'Acta non verba', es: 'hechos, no palabras', pron: 'AK-ta non UER-ba', ex: 'Lema de accion — Menos discurso y mas huerta, barrio y oficio.' },
  { la: 'Ad infinitum', es: 'hasta el infinito (sin fin)', pron: 'ad in-fi-NI-tum', ex: 'Uso diario — Y asi ad infinitum: cuando algo se repite sin parar.' },
  { la: 'Alma mater', es: 'madre nutricia (tu universidad o escuela)', pron: 'AL-ma MA-ter', ex: 'Vida universitaria — Mi alma mater: donde aprendi el oficio.' },
  { la: 'Alter ego', es: 'otro yo (amigo del alma, doble)', pron: 'AL-ter E-go', ex: 'Ciceron — Un amigo es un alter ego: otro yo.' },
  { la: 'Amor fati', es: 'ama tu destino', pron: 'a-MOR FA-ti', ex: 'Estoicos, Nietzsche — Ama lo que te toca y usalo para crecer.' },
  { la: 'Aurea mediocritas', es: 'dorado punto medio (ni mucho ni poco)', pron: 'AU-re-a me-dio-KRI-tas', ex: 'Horacio — La felicidad esta en el justo medio, sin excesos.' },
  { la: 'Aut vincere aut mori', es: 'o vencer o morir', pron: 'aut UIN-che-re aut MO-ri', ex: 'Grito romano — Compromiso total: darlo todo en lo importante.' },
  { la: 'Bona fide', es: 'de buena fe (con honestidad)', pron: 'BO-na FI-de', ex: 'Derecho y tratos — Acuerdo bona fide: sin letra chica.' },
  { la: 'Carpe noctem', es: 'aprovecha la noche', pron: 'KAR-pe NOK-tem', ex: 'Pareja de Carpe diem — De dia trabajar, de noche descansar y mirar estrellas.' },
  { la: 'Citius, altius, fortius', es: 'mas rapido, mas alto, mas fuerte', pron: 'CHI-tsi-us AL-tsi-us FOR-tsi-us', ex: 'Lema olimpico — Ideal para deporte y natacion: superate cada dia.' },
  { la: 'Conditio sine qua non', es: 'condicion sin la cual no (requisito esencial)', pron: 'kon-DI-tsi-o SI-ne kua non', ex: 'Derecho y vida — El agua es conditio sine qua non de la huerta.' },
  { la: 'Cum grano salis', es: 'con un grano de sal (con criterio, sin creerse todo)', pron: 'kum GRA-no SA-lis', ex: 'Consejo romano — Toma las noticias cum grano salis: verifica.' },
  { la: 'Deus ex machina', es: 'dios desde la maquina (solucion inesperada)', pron: 'DE-us eks MA-ki-na', ex: 'Teatro griego y romano — Cuando todo se arregla de golpe, como en las teleseries.' },
  { la: 'E pluribus unum', es: 'de muchos, uno', pron: 'e PLU-ri-bus U-num', ex: 'Lema de union — Muchas familias, una comunidad: Penco unido.' },
  { la: 'Ecce homo', es: 'he aqui el hombre', pron: 'E-che O-mo', ex: 'Evangelio de Juan 19:5 — Pilato presenta a Jesus: mira la humanidad.' },
  { la: 'Exempli gratia (e.g.)', es: 'por ejemplo', pron: 'ek-SEM-pli GRA-tsi-a', ex: 'Uso diario — Cita asi: peces, exempli gratia, jurel y sardina.' },
  { la: 'Fiat lux', es: 'hagase la luz', pron: 'FI-at luks', ex: 'Genesis 1:3 — Que se haga la luz: empezar algo nuevo con claridad.' },
  { la: 'Finis coronat opus', es: 'el fin corona la obra', pron: 'FI-nis ko-RO-nat O-pus', ex: 'Refran romano — Termina lo que empiezas: el final le da sentido.' },
  { la: 'Gaudeamus igitur', es: 'alegremonos pues', pron: 'gau-de-A-mus I-yi-tur', ex: 'Himno universitario — Gaudeamus igitur, iuvenes dum sumus: gocemos mientras somos jovenes.' },
  { la: 'Habeas corpus', es: 'que tengas el cuerpo (derecho a no estar preso sin causa)', pron: 'a-BE-as KOR-pus', ex: 'Derecho — Nadie preso sin juicio justo: garantia basica.' },
  { la: 'Historia magistra vitae', es: 'la historia es maestra de la vida', pron: 'is-TO-ri-a ma-YIS-tra UI-te', ex: 'Ciceron — Estudia el pasado de Penco para no repetir errores.' },
  { la: 'Homo homini lupus', es: 'el hombre es lobo para el hombre', pron: 'O-mo O-mi-ni LU-pus', ex: 'Plauto, Hobbes — Si no nos cuidamos, nos danamos: elijamos cuidarnos.' },
  { la: 'Homo sum, humani nihil a me alienum puto', es: 'soy humano, nada humano me es ajeno', pron: 'O-mo sum, u-MA-ni NI-il a me a-li-E-num PU-to', ex: 'Terencio — Todo lo humano me importa: empatia total.' },
  { la: 'In hoc signo vinces', es: 'con este signo venceras', pron: 'in ok SIN-yo UIN-ches', ex: 'Constantino — Vision antes de la batalla: con tu emblema venceras.' },
  { la: 'In medio stat virtus', es: 'la virtud esta en el medio', pron: 'in ME-di-o stat UIR-tus', ex: 'Aristoteles en latin — Ni flojo ni ansioso: el punto justo.' },
  { la: 'In vino veritas', es: 'en el vino esta la verdad', pron: 'in UI-no UE-ri-tas', ex: 'Plinio — Con unas copas se suelta la lengua: escucha con humor.' },
  { la: 'Scientia potentia est', es: 'el saber es poder', pron: 'shi-EN-tsi-a po-TEN-tsi-a est', ex: 'Bacon — Estudiar te hace libre: cada oficio es poder.' },
  { la: 'Mea culpa', es: 'por mi culpa (reconozco mi error)', pron: 'ME-a KUL-pa', ex: 'Liturgia — Decir mea culpa arregla peleas en casa y en el trabajo.' },
  { la: 'Medice, cura te ipsum', es: 'medico, curate a ti mismo', pron: 'ME-di-che, KU-ra te IP-sum', ex: 'Evangelio de Lucas 4:23 — Antes de aconsejar, ordena tu propia casa.' },
  { la: 'Memento vivere', es: 'recuerda vivir', pron: 'me-MEN-to ui-UE-re', ex: 'Pareja de Memento mori — Recuerda que moriras, asi que vive hoy.' },
  { la: 'Modus vivendi', es: 'modo de vivir (acuerdo para convivir)', pron: 'MO-dus ui-UEN-di', ex: 'Convivencia — Buscar un modus vivendi con vecinos y familia.' },
  { la: 'Mors certa, hora incerta', es: 'la muerte es segura, la hora incierta', pron: 'mors CHER-ta, O-ra in-CHER-ta', ex: 'Medieval — Vive listo: haz hoy lo esencial.' },
  { la: 'Ne quid nimis', es: 'nada en exceso', pron: 'ne kuid NI-mis', ex: 'Templo de Delfos — Ni mucho celular ni mucho trabajo: medida.' },
  { la: 'Nil desperandum', es: 'nada hay que desesperar (no te rindas)', pron: 'nil des-pe-RAN-dum', ex: 'Horacio — Aunque llueva en Penco, nil desperandum: sigue.' },
  { la: 'Noli me tangere', es: 'no me toques', pron: 'NO-li me TAN-ge-re', ex: 'Evangelio de Juan 20:17 — Jesus a Magdalena: respeta mi espacio y tiempo.' },
  { la: 'Non ducor, duco', es: 'no soy guiado, yo guio', pron: 'non DU-kor, DU-ko', ex: 'Lema de liderazgo — No sigo la masa: yo marco el rumbo.' },
  { la: 'Non scholae sed vitae discimus', es: 'no aprendemos para la escuela sino para la vida', pron: 'non SKO-le sed UI-te dis-CHI-mus', ex: 'Seneca — Estudia para la vida real, no solo para la prueba.' },
  { la: 'Nosce te ipsum', es: 'conocete a ti mismo', pron: 'NOSH-che te IP-sum', ex: 'Delfos, Socrates — El primer viaje es hacia adentro.' },
  { la: 'O tempora, o mores!', es: 'oh tiempos, oh costumbres!', pron: 'o TEM-po-ra, o MO-res', ex: 'Ciceron contra Catilina — Cuando todo cambia: exclamacion clasica.' },
  { la: 'Tempora mutantur, et nos mutamur in illis', es: 'los tiempos cambian y nosotros cambiamos con ellos', pron: 'TEM-po-ra mu-TAN-tur, et nos mu-TA-mur in IL-lis', ex: 'Proverbio — Adaptate: cambia el barrio y cambiamos nosotros.' },
  { la: 'Pacta sunt servanda', es: 'los pactos deben cumplirse', pron: 'PAK-ta sunt ser-UAN-da', ex: 'Derecho — Lo prometido se cumple: palabra empeñada.' },
  { la: 'Panem et circenses', es: 'pan y circo', pron: 'PA-nem et chir-CHEN-ses', ex: 'Juvenal — Critica al pueblo que cambia derechos por entretencion.' },
  { la: 'Pax vobiscum', es: 'la paz este con ustedes', pron: 'paks vo-BIS-kum', ex: 'Liturgia — Saludo de paz en misa y en casa.' },
  { la: 'Post tenebras lux', es: 'despues de las tinieblas, la luz', pron: 'post TE-ne-bras luks', ex: 'Lema de esperanza — Tras la tormenta sale el sol en el Biobio.' },
  { la: 'Quid pro quo', es: 'algo por algo (un favor por otro)', pron: 'kuid pro kuo', ex: 'Tratos — Te ayudo en la huerta quid pro quo: tu me ayudas manana.' },
  { la: 'Quis custodiet ipsos custodes?', es: 'quien vigila a los vigilantes?', pron: 'kuis kus-TO-di-et IP-sos kus-TO-des', ex: 'Juvenal — Pregunta ciudadana: quien controla al poder.' },
  { la: 'Quo vadis?', es: 'a donde vas?', pron: 'kuo UA-dis', ex: 'Tradicion de Pedro — Pregunta esencial: quo vadis con tu vida.' },
  { la: 'Repetitio est mater studiorum', es: 'la repeticion es madre del estudio', pron: 're-pe-TI-tsi-o est MA-ter stu-di-O-rum', ex: 'Pedagogia — Repite 5 minutos al dia y se queda para siempre.' },
  { la: 'Semper fidelis', es: 'siempre fiel', pron: 'SEM-per fi-DE-lis', ex: 'Lema militar y familiar — Semper fidelis a tu gente y tus valores.' },
  { la: 'Senatus Populusque Romanus (SPQR)', es: 'el Senado y el Pueblo Romano', pron: 'se-NA-tus po-PU-lus-kue ro-MA-nus', ex: 'Roma — SPQR en estandartes y edificios: el pueblo manda.' },
  { la: 'Sic semper tyrannis', es: 'asi siempre a los tiranos (asi caen)', pron: 'sik SEM-per ti-RAN-nis', ex: 'Lema contra dictadores — Ningun abuso dura para siempre.' },
  { la: 'Sic parvis magna', es: 'lo grande nace de lo pequeño', pron: 'sik PAR-uis MAN-ya', ex: 'Lema marinero — De una semilla, un bosque: empieza chico.' },
  { la: 'Suum cuique', es: 'a cada uno lo suyo', pron: 'SU-um KUI-kue', ex: 'Justicia — Suum cuique: paga justo y reparte justo.' },
  { la: 'Tabula rasa', es: 'tabla rasa (empezar de cero)', pron: 'TA-bu-la RA-za', ex: 'Filosofia — Haz tabula rasa y parte de nuevo sin rencores.' },
  { la: 'Urbi et orbi', es: 'a la ciudad y al mundo', pron: 'UR-bi et OR-bi', ex: 'Bendicion papal — Mensaje urbi et orbi: para todos, sin exclusion.' },
  { la: 'Vae victis', es: 'ay de los vencidos', pron: 'ue UIK-tis', ex: 'Breno, jefe galo — El fuerte impone: por eso defiende a tu gente unida.' },
  { la: 'Verba volant, scripta manent', es: 'las palabras vuelan, lo escrito queda', pron: 'UER-ba VO-lant, SKRIP-ta MA-nent', ex: 'Proverbio — Escribe tus acuerdos: lo escrito protege.' },
  { la: 'Vox populi, vox Dei', es: 'voz del pueblo, voz de Dios', pron: 'voks PO-pu-li, voks DE-i', ex: 'Proverbio — Escucha a la comunidad: ahi habla lo sagrado.' },
  { la: 'Dura lex, sed lex', es: 'dura es la ley, pero es la ley', pron: 'DU-ra leks, sed leks', ex: 'Derecho — Aunque cueste, la regla pareja nos cuida a todos.' },
  { la: 'Gutta cavat lapidem', es: 'la gota horada la piedra (la constancia vence)', pron: 'GUT-ta KA-vat LA-pi-dem', ex: 'Ovidio — Poco cada dia: la gota diaria rompe la piedra.' }
];
var LA_PRON = [
/*__PART4__*/
  ['Vocales como en espanol + ae/oe = E', 'a e i o u suenan igual que en Chile. ae y oe se leen E: Caesar = CHE-zar, poena = PE-na. Sin diptongos raros.'],
  ['C: CH ante e,i / K en el resto', 'cena = CHE-na, Cicero = CHI-che-ro; casa = KA-za, corpus = KOR-pus. La TTS it-IT ya lo hace asi.'],
  ['G: Y ante e,i / G dura en el resto', 'gens = YENS, ager = A-yer; gallus = GAL-lus. Si la voz dice gu, igual se entiende.'],
  ['V = U · J = Y · H muda', 'veni = UE-ni, vinum = UI-num, iam = yam, hora = O-ra. Lee toda V como U y toda J como Y.'],
  ['GN = ni · TI + vocal = tsi · SC + e,i = sh', 'magnus = MA-nyus, natio = NA-tsio, scientia = shi-EN-tsia. ch = K: schola = SKO-la, chorus = KO-rus.'],
  ['X = ks · dobles se alargan · acento', 'ex = eks, terra = TER-ra (erre larga), anno = AN-no. Acento: palabra llana si la penultima es larga (a-MI-cus), si no, esdrujula (DO-mi-nus).']
];
var LA_NORTE = [
/*__PART5__*/
  ['Clasico (Cesar) o eclesiastico (Iglesia): entiende los dos', 'Clasico: ueni, uidi, uiki (todo con K, U). Eclesiastico: UE-ni, UI-di, UI-chi (con CH, Y). Este modulo usa el eclesiastico porque es el de los colegios, misas y canciones en Chile.'],
  ['Casos: el final de la palabra dice su funcion', 'Rosa (sujeto), rosam (objeto), rosae (de la rosa). No memorices tablas: mira el final y el contexto, como hacen los ninos.'],
  ['Tres verbos abren el 50% del dia: esse, habere, facere', 'sum / es / est (soy-eres-es), habeo (tengo), facio (hago). Con esos tres + quiero (volo) y voy (eo) ya conversas.'],
  ['El latin vive en tu espanol', 'Mas del 60% de tus palabras vienen del latin: mare-mar, panis-pan, mater-madre, nox-noche. Cada palabra latina te regala 5 en espanol.'],
  ['Roma en Penco: derecho, calendario, republca', 'Senado, republica, calendario, justicia, medicina, universidad: Roma invento las palabras que usas en la muni, la escuela y el consultorio.']
];
/*__PART6__*/
/* ---------------- ESTADO ---------------- */
var latTab = 'verbum';
var latQuizQ = null;
var latQuizLevel = 'todo';

function getLatData() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { ok: 0, total: 0, streak: 0, lastDay: '' };
    if (!u.latin) u.latin = { ok: 0, total: 0, streak: 0, lastDay: '' };
    return u.latin;
  } catch (e) { return { ok: 0, total: 0, streak: 0, lastDay: '' }; }
}
function latDayIndex(n) {
  try {
    var d = new Date();
    var s = d.getFullYear() * 1000 + Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
    return s % n;
  } catch (e) { return 0; }
}
function latVozLimpia(t) {
  t = String(t == null ? '' : t);
  t = t.replace(/\s*\/\s*/g, ', ');
  t = t.replace(/(\d)\s*[-_\u2013\u2014]+\s*(\d)/g, '$1 al $2');
  t = t.replace(/[\u2014\u2013]+/g, ', ');
  t = t.replace(/\s*[:;]+\s*/g, ', ');
  t = t.replace(/[()\[\]{}<>]+/g, ', ');
  t = t.replace(/["'\u00b7\u2022|\\_#*+=~^_]+/g, ' ');
  t = t.replace(/\.{2,}/g, '.');
  t = t.replace(/\s*,\s*,\s*/g, ', ');
  t = t.replace(/[ \t\u00a0]{2,}/g, ' ');
  t = t.replace(/\s*,\s*/g, ', ').replace(/,{2,}/g, ',');
  t = t.replace(/^[,\s]+|[,\s]+$/g, '').trim();
  return t;
}
function latSpeak(txt) {
  try {
    if (!('speechSynthesis' in window)) { alert('Este dispositivo no tiene voz disponible'); return; }
    var limpio = latVozLimpia(txt);
    if (!limpio) limpio = String(txt || '');
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(limpio);
    u.lang = 'it-IT'; u.rate = 0.85; u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}
function latQuizPool() {
  if (latQuizLevel === 'a1') return LA_A1;
  if (latQuizLevel === 'a2') return LA_A2;
  if (latQuizLevel === 'b1') return LA_B1;
  if (latQuizLevel === 'frases') return LA_FRASES;
  if (latQuizLevel === 'avanzado') return LA_B2C1;
  return LA_A1.concat(LA_A2, LA_B1, LA_FRASES, LA_B2C1);
}
function latAll() { return LA_A1.concat(LA_A2, LA_B1, LA_FRASES, LA_B2C1); }
function latItemLa(x) { return x.la || ''; }
function latItemEs(x) { return x.es || ''; }

function renderLatStreak() {
  var b = $('latStreakBox'); if (!b) return;
  var d = getLatData();
  var pct = d.total ? Math.round(d.ok / d.total * 100) : 0;
  b.innerHTML = '<b>Lingua Latina tua:</b> ' + d.ok + '/' + d.total + ' recte (' + pct + '%) · series ' + d.streak + ' — ' +
    '<span class="muted su-11a508">1 verbum per diem · A1-C1 + sententiae cum pronuntiatione · locale et privatum.</span>';
}
/*__PART7__*/
function latCard(item, lv) {
  return '<button type="button" class="btn eng-word su-6cd6a1" data-w="' + esc(latItemLa(item)) + '"><b>🔊 ' + esc(latItemLa(item)) + '</b> ' +
    '<span class="chip su-0d5be0">' + esc(lv) + '</span><br><span class="su-2f290d">' + esc(latItemEs(item)) + '</span><br>' +
    '<span class="su-11a508">🗣️ ' + esc(item.pron || '') + '</span><br>' +
    '<span class="muted su-11a508">“' + esc(item.ex) + '”</span></button>';
}
function latFraseCard(f) {
  return '<div class="menstrual-card su-4adf8c"><h4>🔊 ' + esc(f.la) + '</h4>' +
    '<p><b>' + esc(f.es) + '</b><br><span class="su-11a508">🗣️ Pronunciación: <b>' + esc(f.pron) + '</b></span><br>' +
    '<span class="muted">“' + esc(f.ex) + '”</span></p>' +
    '<div class="su-9bc2df"><button type="button" class="btn btn-accent su-30e741 lat-hear" data-w="' + esc(f.la) + '">🔊 Audire</button> ' +
    '<button type="button" class="btn su-30e741 lat-copy" data-w="' + esc(f.la) + '|' + esc(f.es) + '|' + esc(f.pron) + '">📋 Copiar</button></div></div>';
}

function renderLatPanel(tab) {
  latTab = tab || latTab;
  var ids = { verbum: 'tabLA1', a1: 'tabLA2', a2: 'tabLA3', b1: 'tabLA4', frases: 'tabLA5', quiz: 'tabLA6' };
  Object.keys(ids).forEach(function (k) { var el = $(ids[k]); if (el) el.classList.toggle('btn-accent', k === latTab); });
  renderLatStreak();
  var box = $('latPanel'); if (!box) return;
  var html = '';
  if (latTab === 'verbum') {
    var all = latAll();
    var w = all[latDayIndex(all.length)];
    var rel = [all[(latDayIndex(all.length) + 7) % all.length], all[(latDayIndex(all.length) + 13) % all.length]];
    var f = new Date();
    var fecha = '';
    try { fecha = cal.fmtDate.format(f); } catch (e) { fecha = f.toLocaleDateString(); }
    html += '<div class="menstrual-card su-3fa1a8">' +
      '<p class="muted su-11a508">☀️ VERBUM DIEI · ' + esc(fecha) + ' · ' + all.length + ' verba et sententiae</p>' +
      '<div class="su-6adb68">' + esc(latItemLa(w)) + '</div>' +
      '<div class="su-cd8bd8"><b>' + esc(latItemEs(w)) + '</b></div>' +
      '<p class="su-11a508">🗣️ <b>' + esc(w.pron || '') + '</b></p>' +
      '<p class="muted su-2b0979">“' + esc(w.ex) + '”</p>' +
      '<div class="su-9bc2df"><button type="button" id="latSpeakBtn" class="btn btn-accent su-30e741">🔊 Audire</button> ' +
      '<button type="button" id="latNextBtn" class="btn su-30e741">🎲 Aliud verbum</button></div></div>' +
      '<div class="help-grid su-d2c171">' +
      rel.map(function (r) { return '<div class="help-card"><h4>' + esc(latItemLa(r)) + '</h4><p class="su-11a508">' + esc(latItemEs(r)) + '<br>🗣️ ' + esc(r.pron || '') + '<br><span class="muted">“' + esc(r.ex) + '”</span></p></div>'; }).join('') + '</div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>🗣️ ¿Cómo practicar?</h4><p class="su-b439ab">1) <b>Escucha</b> con 🔊 y repite 3 veces en voz alta mirando la pronunciación.<br>2) <b>Escribe</b> 1 frase con la palabra en las Notas del día.<br>3) <b>Úsala hoy</b>: 1 palabra/día son ~365 al año.<br>Pasa a A2 cuando sepas 20 sin mirar.</p></div>' +
      '<div class="help-card"><h4>📚 Niveles (CEFR adaptado)</h4><p class="su-b439ab">🌱 <b>A1:</b> sobrevivir (salve, gratias, domus).<br>🌿 <b>A2:</b> vida diaria (perfecto, futuro, foro).<br>💬 <b>B1:</b> viaje + trabajo + opinión.<br>🏛️ <b>Frases:</b> 82 sententiae con pronunciación.<br>📜 <b>B2–C1:</b> pasiva, gerundivo, indirecto + Roma.</p></div></div>';
  } else if (latTab === 'a1') {
    html += '<div class="menstrual-card su-5a6934"><h4 class="su-752b1a">🌱 A1 Fundamenta — sobrevive en latín</h4>' +
      '<p class="muted su-a6c665">Meta: saludar, pedir agua y pan, contar 1–20. Gramática: <b>esse (ego sum / tu es), habere (habeo), unus/una/unum, mihi placet / mihi opus est, plural -i/-ae/-a</b>. Toca 🔊 en cada tarjeta (it-IT = pronunciación eclesiástica).</p>' +
      '<div class="su-5e3875">' + LA_A1.map(function (x) { return latCard(x, 'A1'); }).join('') + '</div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>⚙️ Esse + habere (el 50% del día)</h4><p class="su-583677"><b>Ego sum</b> fessa · <b>Tu es</b> benignus<br><b>Is/ea est</b> hic · <b>Nos sumus</b> amici<br><b>Ego habeo</b> duos filios · <b>Tu habes</b> tempus?<br><span class="muted">Negación: ego <b>non</b> sum… Pregunta: <b>esne…?</b> o subiendo la voz.</span></p></div>' +
      '<div class="help-card"><h4>🎭 Mini-diálogo: in foro (en la feria)</h4><p class="su-583677">— <b>Salve! Quanti constat?</b><br>— <b>Quinque milia nummorum.</b><br>— <b>Gratias. Cras videbimus!</b><br><span class="muted">Practica: una persona por línea. Cambia nummorum por denarios en Roma.</span></p></div></div>';
  } else if (latTab === 'a2') {
    html += '<div class="menstrual-card su-018729"><h4 class="su-721a46">🌿 A2 Vita cotidiana — el día a día</h4>' +
      '<p class="muted su-a6c665">Meta: contar qué hiciste, planes, compras y direcciones. Gramática: <b>perfecto (ivi/comedi/vidi), cras + futuro, comparativos, mihi + gerundivo, posse</b>.</p>' +
      '<div class="su-5e3875">' + LA_A2.map(function (x) { return latCard(x, 'A2'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>🎭 Mini-diálogo: viam rogare (pedir dirección en Penco)</h4><p class="su-583677">— <b>Ignosce, ubi est litus?</b><br>— <b>Recta perge, deinde ad laevam in foro flecte.</b><br>— <b>Gratias maximas!</b> — <b>Libenter!</b><br><span class="muted">Clave: recta = derecho, flectere = girar, prope = cerca.</span></p></div>';
  } else if (latTab === 'b1') {
    html += '<div class="menstrual-card su-d4d722"><h4 class="su-7c91e2">💬 B1 — iter, opus et opinio (viajar, trabajar y opinar)</h4>' +
      '<p class="muted su-a6c665">Meta: viajar, trabajar y opinar. Gramática estrella: <b>si + futuro (si pluet, manebimus)</b> + imperfecto (ludebam) + <b>hic + acusativo de tiempo</b> (quinque annos = desde hace 5 años).</p>' +
      '<div class="su-5e3875">' + LA_B1.map(function (x) { return latCard(x, 'B1'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>🎭 Mini-diálogo: iter Concepcionem (viaje a Concepción)</h4><p class="su-583677">— <b>Tessera ad Concepcionem, amabo te.</b><br>— <b>Itus tantum an itus reditusque?</b> — <b>Itus reditusque, amabo te.</b><br>— <b>Hic multos annos habitas?</b> — <b>Hic quinque annos habitamus.</b><br><span class="muted">Practica con horarios, precios y hic + tiempo.</span></p></div>';
/*__PART8__*/
  } else if (latTab === 'frases') {
    html += '<div class="menstrual-card su-5b7cd0"><h4 class="su-399074">🏛️ Sententiae Latinae — 82 frases latinas con pronunciación</h4>' +
      '<p class="muted su-a6c665">La subsección pedida: cada frase trae <b>latín + español + 🗣️ pronunciación eclesiástica</b> (la de colegios e iglesia en Chile) y su historia. Toca <b>🔊 Audire</b> para oírla con la voz del dispositivo (it-IT). Gramática B2–C1: <b>pluscuamperfecto (profectus eram), pasiva (purgatum est), indirecto (dixit se…), gerundivo (disputandum), conectores (tamen, praeterea)</b>.</p>' +
      '<div class="su-5e3875">' + LA_B2C1.map(function (x) { return latCard(x, 'B2–C1'); }).join('') + '</div></div>' +
      '<div class="si-card"><h4>🗣️ Pronunciación en 1 minuto (eclesiástica = suena como italiano)</h4><p>' +
      LA_PRON.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div>' +
      LA_FRASES.map(latFraseCard).join('') +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>🏛️ Clásico o eclesiástico + casos sin miedo</h4><p class="su-583677">' + LA_NORTE.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div>' +
      '<div class="help-card"><h4>🎶 Cultura para oír y saborear</h4><p class="su-b439ab"><b>Oír:</b> Carmina Burana (O Fortuna), Gaudeamus igitur (himno universitario). 1 pieza x 7 días.<br><b>Leer:</b> Eneida I:1 Arma virumque cano (canto a las armas y al héroe).<br><b>Ver:</b> Coliseo, foro, acueductos: Roma = arquitectura que aún se usa.<br><b>Probar:</b> panis, caseus, olivae: lee la receta en latín y cocínala.<br><span class="muted">Séneca, Cicerón y Marco Aurelio: el calendario también es filosofía.</span></p></div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>💼 Kit entrevista de trabajo (en latín y en serio)</h4><p class="su-583677">— <b>Dic mihi de te.</b> (Háblame de ti.)<br>— <b>Diligens sum et bene in turma laboro.</b> (Soy responsable y trabajo bien en equipo.)<br>— <b>Mea virtus est… Meum propositum est…</b> (Mi fortaleza es… Mi objetivo es…)<br><span class="muted">Cierra: Gratias tibi pro tempore tuo. (Gracias por tu tiempo.)</span></p></div>';
  } else if (latTab === 'quiz') {
    var d = getLatData();
    if (!latQuizQ) {
      var pool = latQuizPool();
      var wq = pool[Math.floor(Math.random() * pool.length)];
      var opts = {};
      opts[latItemEs(wq)] = 1;
      var guard = 0;
      while (Object.keys(opts).length < 4 && guard < 60) { guard++; opts[latItemEs(pool[Math.floor(Math.random() * pool.length)])] = 1; }
      var arr = Object.keys(opts).sort(function () { return Math.random() - 0.5; });
      latQuizQ = { w: wq, opts: arr };
    }
    var q = latQuizQ;
    var lvBtn = function (v, l) { return '<button type="button" class="btn lat-lv' + (latQuizLevel === v ? ' btn-accent' : '') + ' su-337714" data-lv="' + v + '">' + l + '</button>'; };
    html += '<div class="menstrual-card su-1f2df9"><h4 class="su-399074">🧩 Quiz por niveles</h4>' +
      '<div class="su-a8712a">' + lvBtn('todo', '🌎 Todo') + lvBtn('a1', '🌱 A1') + lvBtn('a2', '🌿 A2') + lvBtn('b1', '💬 B1') + lvBtn('frases', '🏛️ Frases') + lvBtn('avanzado', '📜 B2–C1') + '</div>' +
      '<div class="su-73ce29">“' + esc(latItemLa(q.w)) + '”</div>' +
      '<p class="su-11a508">🗣️ ' + esc(q.w.pron || '') + '</p>' +
      '<button type="button" id="latQuizSpeak" class="btn su-337714">🔊 Audire</button>' +
      '<div class="su-ae0e71">' + q.opts.map(function (o) { return '<button type="button" class="btn lat-opt su-046678" data-o="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div>' +
      '<div id="latQuizFb" class="su-ac1122"></div>' +
      '<p class="muted su-e13d76">Recte ' + d.ok + '/' + d.total + ' · series ' + d.streak + ' · nivel: <b>' + esc(latQuizLevel) + '</b> · banco: ' + latQuizPool().length + ' verba/sententiae</p></div>';
  }
  box.innerHTML = html + '<p class="muted su-a953a7">🔊 Toca cualquier tarjeta para oír latín eclesiástico (it-IT, voz del dispositivo) y lee la 🗣️ pronunciación. El quiz suma a tu serie local y privada.</p>';
/*__PART9__*/
  var sp = $('latSpeakBtn');
  if (sp) sp.onclick = function (e) { try { e.preventDefault(); } catch (x) {} var a = latAll(); latSpeak(latItemLa(a[latDayIndex(a.length)])); };
  var nx = $('latNextBtn');
  if (nx) nx.onclick = function () { renderLatPanel('verbum'); };
  var qs = $('latQuizSpeak');
  if (qs) qs.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (latQuizQ) latSpeak(latItemLa(latQuizQ.w)); };
  box.querySelectorAll('.eng-word').forEach(function (b) {
    b.onclick = function (e) { try { e.preventDefault(); } catch (x) {} latSpeak(b.getAttribute('data-w')); };
  });
  box.querySelectorAll('.lat-hear').forEach(function (b) {
    b.onclick = function (e) { try { e.preventDefault(); } catch (x) {} latSpeak(b.getAttribute('data-w')); };
  });
  box.querySelectorAll('.lat-copy').forEach(function (b) {
    b.onclick = function (e) {
      try { e.preventDefault(); } catch (x) {}
      var parts = (b.getAttribute('data-w') || '').split('|');
      var txt = '🏛️ ' + (parts[0] || '') + ' = ' + (parts[1] || '') + ' 🗣️ ' + (parts[2] || '');
      try {
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { alert('Copiado: ' + txt); }, function () { alert(txt); });
        else alert(txt);
      } catch (err) { try { alert(txt); } catch (e2) {} }
    };
  });
  box.querySelectorAll('.lat-lv').forEach(function (b) {
    b.onclick = function () { latQuizLevel = b.getAttribute('data-lv'); latQuizQ = null; renderLatPanel('quiz'); };
  });
  box.querySelectorAll('.lat-opt').forEach(function (b) {
    b.onclick = function () {
      var d2 = getLatData();
      var ok = b.getAttribute('data-o') === latItemEs(latQuizQ.w);
      d2.total = (d2.total || 0) + 1;
      if (ok) { d2.ok = (d2.ok || 0) + 1; d2.streak = (d2.streak || 0) + 1; }
      else { d2.streak = 0; }
      try { if (typeof scheduleSave === 'function') scheduleSave('Guardado OK'); } catch (e) {}
      var fb = $('latQuizFb');
      if (fb) fb.innerHTML = ok ? '✅ Recte! <b>' + esc(latQuizQ.w.ex) + '</b><br>🗣️ ' + esc(latQuizQ.w.pron || '') : '❌ Erat <b>' + esc(latItemEs(latQuizQ.w)) + '</b> — “' + esc(latQuizQ.w.ex) + '”';
      box.querySelectorAll('.lat-opt').forEach(function (x) {
        x.disabled = true;
        if (x.getAttribute('data-o') === latItemEs(latQuizQ.w)) x.classList.add('btn-accent');
      });
      renderLatStreak();
      setTimeout(function () { latQuizQ = null; if (latTab === 'quiz') renderLatPanel('quiz'); }, ok ? 1400 : 2200);
    };
  });
}

/* ---------------- DIALOGO ---------------- */
function buildDialog() {
  if ($('latinDialog')) return;
  var d = document.createElement('dialog');
  d.id = 'latinDialog';
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053"><h3 class="su-ee0cfe">🏛️ Latín — A1 a C1 + frases con pronunciación</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Aprende <b>latín por niveles + 82 frases célebres con su pronunciación</b>, como el Kimün, el Inglés o el Italiano: 1 verbum al día + grammatica + quiz. Toca 🔊 para oír (voz del dispositivo, it-IT = latín eclesiástico). Todo queda <b>local y privado</b> por usuario.</p>' +
    '<div id="latStreakBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="timer-tabs su-f7ad78">' +
    '<button type="button" id="tabLA1" class="btn btn-accent su-30e741">☀️ Verbum diei</button>' +
    '<button type="button" id="tabLA2" class="btn su-30e741">🌱 A1</button>' +
    '<button type="button" id="tabLA3" class="btn su-30e741">🌿 A2</button>' +
    '<button type="button" id="tabLA4" class="btn su-30e741">💬 B1</button>' +
    '<button type="button" id="tabLA5" class="btn su-30e741">🏛️ Frases + pronunciación</button>' +
    '<button type="button" id="tabLA6" class="btn su-30e741">🧩 Quiz</button></div>' +
    '<div id="latPanel"></div>' +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
}

function bindTabs() {
  var map = { tabLA1: 'verbum', tabLA2: 'a1', tabLA3: 'a2', tabLA4: 'b1', tabLA5: 'frases', tabLA6: 'quiz' };
  Object.keys(map).forEach(function (id) {
    var el = $(id);
    if (el) el.onclick = function () { if (map[id] !== 'quiz') latQuizQ = null; renderLatPanel(map[id]); };
  });
}

/* ---------------- SETUP ---------------- */
function ensureButton() {
  try {
    var existing = $('btnLatin');
    if (existing) { try { existing.setAttribute('data-sub', 'idiomas'); } catch (e) {} return existing; }
    var g = document.querySelector('.action-group[data-group="aprender"] .group-btns');
    if (!g) return null;
    var btn = document.createElement('button');
    btn.id = 'btnLatin'; btn.className = 'btn'; btn.type = 'button';
    btn.textContent = '🏛️ Latín';
    try { btn.setAttribute('data-sub', 'idiomas'); } catch (e2) {}
    btn.setAttribute('data-keywords', 'latin latín lingua latina roma frases pronunciacion sententiae carpe diem veni vidi vici memento mori veritas clasico eclesiastico casos gramatica quiz vocabulario cultura seneca ciceron cesar');
    var ref = g.querySelector('#btnJapones') || g.querySelector('#btnRuso') || g.querySelector('#btnItaliano') || g.querySelector('#btnHindi') || g.querySelector('#btnChino') || g.querySelector('#btnPortugues');
    if (ref && ref.parentNode === g) g.insertBefore(btn, ref.nextSibling);
    else {
      var refEn = g.querySelector('#btnEnglish');
      if (refEn && refEn.parentNode === g) g.insertBefore(btn, refEn.nextSibling);
      else g.appendChild(btn);
    }
    return btn;
  } catch (e) { return null; }
}

function registerGlobals() {
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnLatin') < 0) {
      var i = -1;
      try { i = ALL_BTNS.indexOf('btnJapones'); } catch (e) {}
      if (i < 0) { try { i = ALL_BTNS.indexOf('btnRuso'); } catch (e2) {} }
      if (i < 0) { try { i = ALL_BTNS.indexOf('btnItaliano'); } catch (e3) {} }
      if (i >= 0) ALL_BTNS.splice(i + 1, 0, 'btnLatin');
      else ALL_BTNS.push('btnLatin');
    }
  } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnLatin = ['aprender', 'idiomas']; } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['aprender|idiomas'] && BTN_ORDER['aprender|idiomas'].indexOf('btnLatin') < 0) {
      BTN_ORDER['aprender|idiomas'].push('btnLatin');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p] && (p === 'todo' || p === 'adulto' || p === 'estudiante' || p === 'docente' || p === 'adolescente')) PRESETS[p].btnLatin = true;
      });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnLatin"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Aprender') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnLatin"> 🏛️ Latín';
          var ref2 = gr.querySelector('input[data-btn="btnJapones"]') || gr.querySelector('input[data-btn="btnRuso"]') || gr.querySelector('input[data-btn="btnItaliano"]');
          if (ref2 && ref2.closest && ref2.closest('label') && ref2.closest('label').parentNode) {
            ref2.closest('label').parentNode.insertBefore(lab, ref2.closest('label').nextSibling);
          } else { gr.appendChild(lab); }
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnLatin !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnLatin = lab.querySelector('input').checked;
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
  renderLatPanel('verbum');
  var b = $('btnLatin');
  if (!b) { if ((setup._r = (setup._r || 0) + 1) < 60) setTimeout(setup, 500); return; }
  if (!b.dataset.lat) {
    b.dataset.lat = '1';
    b.addEventListener('click', function () {
      latQuizQ = null;
      renderLatPanel('verbum');
      openDlg('latinDialog');
    });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 500); });
else setTimeout(setup, 500);

})();