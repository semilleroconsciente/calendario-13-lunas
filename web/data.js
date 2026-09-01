const PENCO = { lat: -36.73194, lng: -72.9925 };

const ESTACIONES = {
  PUKEM: { nombre: 'Pukem · Invierno', desc: 'Las lluvias que purifican la tierra', color: '#4a6fa5' },
  PEWU: { nombre: 'Pewü · Primavera', desc: 'El florecimiento y los nuevos brotes', color: '#7a9e7e' },
  WALUNG: { nombre: 'Walüng · Verano', desc: 'La abundancia y los días largos', color: '#d4a947' },
  RIMU: { nombre: 'Rimü · Otoño', desc: 'La cosecha guardada y el descanso', color: '#b06a4c' }
};

const MOONS = [
  {
    n: 1, nombre: 'We Tripantü Küyen', traduccion: 'Luna del año nuevo',
    estacion: 'PUKEM',
    descripcion: 'Mar de invierno y marejadas frente a Penco y Lirquén. Es tiempo de recogimiento: las primeras lluvias fuertes purifican la tierra tras el We Tripantu.'
  },
  {
    n: 2, nombre: 'Llitunül Wilki Küyen', traduccion: 'Luna en que comienza el canto del zorzal',
    estacion: 'PUKEM',
    descripcion: 'Migración de ballenas frente a la costa del golfo de Arauco. Los días más cortos del año quedan atrás y la luz empieza, apenas, a alargarse.'
  },
  {
    n: 3, nombre: 'Llitun Pofpof Anümka Küyen', traduccion: 'Luna en que brotan las semillas plantadas',
    estacion: 'PUKEM',
    descripcion: 'Primeros brotes en la vegetación de la cordillera de Nahuelbuta. El frío cede terreno y la savia comienza a despertar en los árboles nativos.'
  },
  {
    n: 4, nombre: 'Rayen Awar Küyen', traduccion: 'Luna en que florecen las habas',
    estacion: 'PEWU',
    descripcion: 'Floración de copihues y avellanos en los cerros de Penco. Pewü, tiempo de florecimiento: la tierra se cubre de color después del invierno.'
  },
  {
    n: 5, nombre: 'Longkon Kachilla Küyen', traduccion: 'Luna de las espigas',
    estacion: 'PEWU',
    descripcion: 'Llegada de aves migratorias a los humedales del Bío-Bío. La luz se alarga cada día y el aire empieza a templarse sobre la bahía.'
  },
  {
    n: 6, nombre: 'Karü Kachilla Küyen', traduccion: 'Luna del trigo verde',
    estacion: 'PEWU',
    descripcion: 'Inicio de la temporada de pesca artesanal en las caletas de la bahía de Concepción. Se preparan las artes de pesca para los meses de mayor actividad.'
  },
  {
    n: 7, nombre: 'Kudewallüng Küyen', traduccion: 'Luna de las luciérnagas',
    estacion: 'WALUNG',
    descripcion: 'Días largos, apertura de playas en Penco y Rocuant. Comienza Walüng, tiempo de abundancia y de vida al aire libre junto al mar.'
  },
  {
    n: 8, nombre: 'Püramuwün Kachilla Küyen · Are Küyen', traduccion: 'Luna de la cosecha · Luna del calor',
    estacion: 'WALUNG',
    descripcion: 'Pleno verano: máxima actividad costera, turismo y vida social en el borde mar. El sol se demora en irse tras la cordillera de la costa.'
  },
  {
    n: 9, nombre: 'Trüntarü Küyen', traduccion: 'Luna de las termitas',
    estacion: 'WALUNG',
    descripcion: 'Vendimia y cosecha en los valles interiores del Bío-Bío. El verano empieza a madurar hacia su fin, cargado de frutos.'
  },
  {
    n: 10, nombre: 'Ngülliw Küyen', traduccion: 'Luna de los piñones',
    estacion: 'RIMU',
    descripcion: 'Cambio de color en los bosques nativos y primeras lluvias. Comienza Rimü, tiempo de cosecha guardada, de recoger antes de que llegue el frío.'
  },
  {
    n: 11, nombre: 'Malliñ Ko Küyen', traduccion: 'Luna del agua en los llanos',
    estacion: 'RIMU',
    descripcion: 'Recolección de piñones y frutos del bosque en la precordillera. Es tiempo de guardar reservas y preparar la casa para el invierno.'
  },
  {
    n: 12, nombre: 'Trangliñ Küyen', traduccion: 'Luna de las heladas',
    estacion: 'RIMU',
    descripcion: 'Enfriamiento del mar y del aire sobre la bahía. La tierra se prepara para el descanso más profundo del ciclo.'
  },
  {
    n: 13, nombre: 'Mawün Kürüf Küyen', traduccion: 'Luna de la lluvia y el viento',
    estacion: 'RIMU',
    descripcion: 'Noches más largas, cierre del ciclo. Última luna antes del Día Fuera del Tiempo y el regreso del sol en el nuevo We Tripantu.'
  }
];

const DFT = {
  titulo: 'El Día Fuera del Tiempo',
  texto1: 'Después de la luna 13, queda un día que no pertenece a ninguna cuenta: ni a esta luna ni a la siguiente. Es el día en que el calendario se detiene un instante antes de reiniciar — un espacio fuera del tiempo administrado, dedicado al cierre, la memoria y la transición hacia el nuevo ciclo.',
  sub2: 'La víspera del We Tripantu',
  texto2: 'En la tradición mapuche, la noche que antecede al amanecer del nuevo ciclo se vive en vigilia. Las familias se reúnen alrededor del fuego para compartir comida, conversación y relatos antiguos: un momento de fortalecimiento interno antes que una celebración pública. Se comparten platos como mote, catutos, sopaipillas y muday, mientras se espera el amanecer.',
  texto3: 'Al alba, antes de que salga el sol, muchas comunidades realizan un baño ritual en un río, estero o —como ocurre en Talcahuano, al otro lado de esta misma bahía— en el mar: un gesto de purificación para dejar atrás lo viejo y recibir el nuevo ciclo renovados. Luego, mirando hacia el oriente, se agradece el ciclo que termina y se pide por el que comienza.',
  sub3: 'Cómo llevar esto a Penco',
  texto4: 'Si puedes, cierra este día junto al fuego o una vela, compartiendo una comida sencilla con quienes te acompañan.',
  texto5: 'Al amanecer del día siguiente, una caminata hasta la costa —Penco, Lirquén o Rocuant— puede ser tu propia versión del gesto de renovación frente al mar.',
  texto6: 'Usa el recuadro de abajo para mirar el ciclo completo: qué cambió, qué quieres soltar, qué esperas del año que comienza.'
};

const MOODS = [
  { e: '😊', c: '#7fbf5f', n: 'Feliz' },
  { e: '🙂', c: '#b5d16b', n: 'Tranquilo' },
  { e: '😐', c: '#9aa3c7', n: 'Neutral' },
  { e: '😴', c: '#6a8fd8', n: 'Cansado' },
  { e: '😢', c: '#8a6fd8', n: 'Triste' },
  { e: '😤', c: '#e0913f', n: 'Tenso' },
  { e: '💪', c: '#d4a947', n: 'Productivo' },
  { e: '🌟', c: '#c96fb1', n: 'Especial' }
];

const EFEMERIDES = {
  '03-20': 'Equinoccio de otoño',
  '06-21': 'We Tripantu · Año Nuevo Mapuche y solsticio de invierno',
  '06-29': 'San Pedro · fiesta de los pescadores en las caletas',
  '09-22': 'Equinoccio de primavera',
  '12-21': 'Solsticio de verano'
};

const SIEMBRA = {
  nueva: {
    fase: '🌑 Luna Nueva',
    titulo: 'Siembra de hojas y preparación',
    texto: 'La savia baja hacia las raíces: buen momento para abonar, preparar la tierra y sembrar plantas de hoja.',
    siembra: 'Lechuga, espinaca, acelga, perejil, cilantro, repollo.',
    tareas: 'Abonar y mulchear · remover tierra · controlar malezas · evitar podar.'
  },
  creciente: {
    fase: '🌓 Cuarto Creciente',
    titulo: 'Siembra de frutos y flores',
    texto: 'La savia sube: es el mejor momento para sembrar y trasplantar lo que da fruto o flor.',
    siembra: 'Tomate, poroto, zapallo, choclo, pimentón, flores y hierbas aromáticas.',
    tareas: 'Trasplantar · sembrar frutales · regar más seguido · cosechar flores para secar.'
  },
  llena: {
    fase: '🌕 Luna Llena',
    titulo: 'Cosecha de máxima savia',
    texto: 'La planta está en su punto más alto de savia: ideal para cosechar hojas, frutos y hierbas medicinales.',
    siembra: 'No sembrar: cosechar. Hierbas medicinales en plena mañana.',
    tareas: 'Cosechar hojas y frutos · elaborar conservas · fermentar · preparar tinturas.'
  },
  menguante: {
    fase: '🌗 Cuarto Menguante',
    titulo: 'Raíces, poda y cuidado',
    texto: 'La energía vuelve a las raíces: tiempo de sembrar lo que crece bajo tierra, podar y prevenir plagas.',
    siembra: 'Papa, zanahoria, betarraga, rabanito, ajo, cebolla.',
    tareas: 'Podar árboles y arbustos · combatir plagas · cosechar raíces · abonar para el ciclo siguiente.'
  }
};

const SIEMBRA_LUNAS = {
  1: { titulo: 'Siembra de pleno invierno — guardar y preparar', epoca: '21 jun – 18 jul · Pukem · lluvias y heladas', directa: 'Haba, arveja, ajo chilote, cebolla, rábano, zanahoria temprana bajo túnel, lechuga de invierno, espinaca.', almacigos: 'Ninguno a la intemperie; solo bajo cubierta: lechuga y acelga en almácigo protegido.', cosecha: 'Últimas papas guardadas, manzanas de guarda, hierbas secas.', tareas: 'Compostar y mulchear · podar frutales a raíz desnuda (manzano, cerezo) · preparar camas con guano · desmalezar y drenar.' },
  2: { titulo: 'Siembra de salida de invierno — almácigos bajo techo', epoca: '19 jul – 15 ago · Pukem · ballenas y luz que vuelve', directa: 'Haba, arveja, espinaca, acelga, betarraga, zanahoria, lechuga, rábano, ajo, perejil, cilantro.', almacigos: 'Tomate, pimiento, ají, zapallo, albahaca, berenjena en invernadero o ventana luminosa.', cosecha: 'Habas tempranas si hubo siembra otoñal, hierbas perennes.', tareas: 'Abonar y airear compost · plantar frutillas · limpiar acequias · proteger brotes de heladas tardías.' },
  3: { titulo: 'Fin de invierno — tierra que despierta', epoca: '16 ago – 12 sep · Pukem · brotes en Nahuelbuta', directa: 'Arveja, haba, lechuga, rúcula, espinaca, betarraga, zanahoria, perejil, cilantro, rábano, cebolla.', almacigos: 'Tomate, zapallo, poroto, maíz, albahaca, pimentón.', cosecha: 'Primeros rabanitos y lechugas de invierno.', tareas: 'Trasplantar cebolla · preparar papas tempranas · abonar ligero · acolchar para retener humedad.' },
  4: { titulo: 'Equinoccio de primavera — plantar con fuerza', epoca: '13 sep – 10 oct · Pewü · copihues y avellanos', directa: 'Poroto, maíz, zapallo, lechuga, acelga, zanahoria, betarraga, rabanito, perejil, cilantro, flores (caléndula, cosmos).', almacigos: 'Tomate, pimiento, pepino, albahaca, zapallo italiano.', cosecha: 'Habas y arvejas en flor; hierbas para secar.', tareas: 'Trasplantar tomates al exterior (tras heladas) · plantar papas · aporcar habas · riego moderado.' },
  5: { titulo: 'Primavera plena — crecimiento veloz', epoca: '11 oct – 7 nov · Pewü · aves migratorias', directa: 'Poroto verde, maíz, zapallo italiano, pepino, lechuga, acelga, espinaca, betarraga, zanahoria, rábano, albahaca, girasol.', almacigos: 'Tomate tardío, berenjena, pimentón.', cosecha: 'Primeras arvejas y habas tiernas; frutillas.', tareas: 'Tutorar tomates · deshierbe frecuente · acolchar · cosechar flores para polinizadores.' },
  6: { titulo: 'Antesala del verano — riego y cuidado', epoca: '8 nov – 5 dic · Pewü · pesca artesanal', directa: 'Poroto, maíz tardío, zapallo, pepino, lechuga de verano, rúcula, betarraga, zanahoria, rabanito, albahaca.', almacigos: 'Albahaca y flores de verano.', cosecha: 'Habas y arvejas a granel, lechugas de primavera, frutillas, cerezas tempranas.', tareas: 'Riego profundo y temprano · aporcar maíz y papas · plantar camote · cosechar semillas de haba.' },
  7: { titulo: 'Solsticio de verano — abundancia', epoca: '6 dic – 2 ene · Walüng · playas abiertas', directa: 'Poroto verde 2ª siembra, maíz, zapallo, lechuga de verano, albahaca, cilantro, rabanito, betarraga, perejil.', almacigos: 'Repicado de albahaca y flores.', cosecha: 'Tomate, pimiento, pepino, zapallito, papas tempranas, frutillas, arándanos, cerezas.', tareas: 'Cosechar y conservar (salsa, mermelada) · guardar semillas · riego al atardecer · sombra a almacigos.' },
  8: { titulo: 'Pleno verano — cosechar y guardar', epoca: '3 – 30 ene · Walüng · calor y costa', directa: 'Lechuga, acelga, espinaca de verano, rábano, betarraga, zanahoria para otoño, cilantro.', almacigos: 'Lechuga y acelga para otoño.', cosecha: 'Tomate, pimiento, choclo, poroto verde, zapallo italiano, berries, duraznos, ciruelas.', tareas: 'Cosecha diaria · secar hierbas · feriar e intercambiar · preparar almácigos otoñales bajo malla.' },
  9: { titulo: 'Cierre de verano — segunda oportunidad', epoca: '31 ene – 27 feb · Walüng · vendimia', directa: 'Lechuga, espinaca, acelga, betarraga, zanahoria, rábano, haba temprana, arveja otoñal, brócoli, coliflor.', almacigos: 'Brócoli, coliflor, repollo para otoño-invierno.', cosecha: 'Tomates tardíos, zapallos de guarda, choclos, pimientos, uvas, manzanas tempranas.', tareas: 'Conservar y fermentar · guardar semillas de tomate y zapallo · plantar frutillas nuevas.' },
  10: { titulo: 'Inicio de otoño — guardar para el frío', epoca: '28 feb – 27 mar · Rimü · bosques que cambian', directa: 'Haba, arveja, lechuga otoñal, espinaca, acelga, betarraga, zanahoria, rábano, repollo, brócoli, coliflor, ajo, cebolla.', almacigos: 'Habas y arvejas directo es mejor que almácigo.', cosecha: 'Zapallos de guarda, maíz para choclo seco, porotos granados, manzanas, membrillos, nueces.', tareas: 'Cosechar y almacenar papas · compostar hojas · trasplantar frutillas · sembrar abono verde (avena/vicia).' },
  11: { titulo: 'Otoño medio — piñones y reservas', epoca: '28 mar – 24 abr · Rimü · recolección en precordillera', directa: 'Ajo, cebolla, haba, arveja, lechuga, espinaca, acelga, rabanito, betarraga, zanahoria, repollo, brócoli.', almacigos: 'Ajo chilote en surco profundo.', cosecha: 'Piñones (ngülliw), avellanas, manzanas tardías, membrillos; hongos de pino.', tareas: 'Recolectar piñones · plantar frutales · acolchar con hojas · guardar leña y conservas.' },
  12: { titulo: 'Otoño tardío — heladas que se acercan', epoca: '25 abr – 22 may · Rimü · mar que se enfría', directa: 'Ajo, haba, arveja, lechuga bajo túnel, espinaca, rábano, cilantro, perejil, ciboulette.', almacigos: 'Ajos en luna menguante; habas y arvejas directo.', cosecha: 'Últimos piñones, nueces, membrillos; hierbas para secar antes de heladas.', tareas: 'Plantar ajos · levantar camas con compost · preparar invernadero · podar hojas secas.' },
  13: { titulo: 'Antes del nuevo sol — descanso de la tierra', epoca: '23 may – 19 jun · Rimü · noches más largas', directa: 'Ajo, haba, arveja, lechuga de invierno, espinaca, rábano bajo cubierta.', almacigos: 'Solo bajo cubierta: lechuga, acelga.', cosecha: 'Piñones finales, nueces, hierbas secas; nada más hasta el nuevo ciclo.', tareas: 'Abonar con compost maduro · podar frutales · planificar rotación · descanso, memoria y preparación para We Tripantu.' }
};

const INTRO = {
  titulo: 'CALENDARIO DE LAS 13 LUNAS',
  subtitulo: 'Mari Küla Küyen',
  lugar: 'Golfo de Arauco · Penco, Bío-Bío, Chile'
};

const DONATE = {
  banco: 'BancoEstado',
  tipo: 'CuentaRUT',
  cuenta: '', // privado: ver donate.json
  rut: '', // privado
  titular: '', // privado
  correo: '', // privado
  flow: '',
  mercadopago: '', // privado: ver donate.json
  paypal: '', // privado
  kofi: '',
  machBanco: 'BCI/MACHBANK',
  machTipo: 'Cuenta Vista',
  machCuenta: '', // privado
  machRut: '', // privado
  machTitular: '', // privado
  machCorreo: '' // privado
};

const AVES_PENCO = [
  { nombre: "Gaviota dominicana", cient: "Larus dominicanus", hab: "Costa, playa, bahía", icon: "🕊️", epoca: "Todo el año" },
  { nombre: "Zarapito", cient: "Numenius phaeopus", hab: "Humedal Rocuant, orilla", icon: "🦩", epoca: "Sep – Mar (migratoria)" },
  { nombre: "Pilpilén", cient: "Haematopus palliatus", hab: "Playa, roqueríos", icon: "🐦", epoca: "Todo el año" },
  { nombre: "Garza cuca", cient: "Ardea cocoi", hab: "Humedal, estero Penco", icon: "🦢", epoca: "Todo el año" },
  { nombre: "Cisne coscoroba", cient: "Coscoroba coscoroba", hab: "Humedal Rocuant", icon: "🦢", epoca: "Invierno-primavera" },
  { nombre: "Trabajador", cient: "Phleocryptes melanops", hab: "Totora, humedal", icon: "🐦", epoca: "Todo el año" },
  { nombre: "Loica", cient: "Leistes loyca", hab: "Pradera, borde cerro", icon: "🐦", epoca: "Todo el año – canto primavera" },
  { nombre: "Chorlo nevado", cient: "Charadrius nivosus", hab: "Playa, duna", icon: "🐧", epoca: "Oct – Feb (nidifica)" },
  { nombre: "Yeco / Cormorán", cient: "Phalacrocorax brasilianus", hab: "Rocas, muelle Lirquén", icon: "🦅", epoca: "Todo el año" },
  { nombre: "Pato jergón", cient: "Anas georgica", hab: "Humedal, laguna", icon: "🦆", epoca: "Todo el año" },
  { nombre: "Fío-fío", cient: "Elaenia albiceps", hab: "Matorral, bosque", icon: "🐦", epoca: "Sep – Mar" },
  { nombre: "Zorzal", cient: "Turdus falcklandii", hab: "Jardín, bosque", icon: "🐦", epoca: "Todo el año – canto invierno" },
  { nombre: "Bandurria", cient: "Theristicus melanopis", hab: "Pradera, humedal", icon: "🦩", epoca: "Todo el año" },
  { nombre: "Queltrehue / Treile", cient: "Vanellus chilensis", hab: "Pastizal, cancha", icon: "🐦", epoca: "Todo el año" },
  { nombre: "Picaflor chico", cient: "Sephanoides sephaniodes", hab: "Jardín, bosque", icon: "🐝", epoca: "Sep – Abr" },
  { nombre: "Concón", cient: "Strix rufipes", hab: "Bosque nativo", icon: "🦉", epoca: "Todo el año – nocturna" }
];

const EVENTOS_ASTRONOMICOS = [
  // 2026 – visibles sur Chile / general
  { date: "2026-02-17", tipo: "eclipse", icon: "🌘", nombre: "Eclipse anular de Sol", desc: "Antártida / sur. Desde Penco parcial muy bajo. No mirar directo." },
  { date: "2026-03-03", tipo: "eclipse", icon: "🌕", nombre: "Eclipse total de Luna", desc: "Visible en Chile madrugada. Luna roja ~3:00–4:30 CL." },
  { date: "2026-03-20", tipo: "equinoccio", icon: "🍂", nombre: "Equinoccio de otoño", desc: "Inicio otoño sur. Sol cruza ecuador." },
  { date: "2026-06-21", tipo: "solsticio", icon: "❄️", nombre: "Solsticio de invierno + We Tripantu", desc: "Día más corto. Año nuevo mapuche." },
  { date: "2026-08-12", tipo: "eclipse", icon: "🌘", nombre: "Eclipse total de Sol (Ártico/Europa)", desc: "No visible en Chile. Lo listamos para referencia." },
  { date: "2026-08-28", tipo: "eclipse", icon: "🌕", nombre: "Eclipse parcial de Luna", desc: "Visible en Chile al amanecer. Parte norte." },
  { date: "2026-09-22", tipo: "equinoccio", icon: "🌸", nombre: "Equinoccio de primavera", desc: "Inicio primavera sur." },
  { date: "2026-12-21", tipo: "solsticio", icon: "☀️", nombre: "Solsticio de verano", desc: "Día más largo." },
  { date: "2026-11-24", tipo: "superluna", icon: "🌕", nombre: "Superluna (perigeo)", desc: "Luna llena más grande. Marea más alta." },
  { date: "2026-12-24", tipo: "superluna", icon: "🌕", nombre: "Superluna fría", desc: "Última llena del año, perigeo." },
  // Lluvias anuales (picos)
  { date: "2026-01-03", tipo: "lluvia", icon: "☄️", nombre: "Cuadrántidas (pico)", desc: "Hasta 40 met/h. Mejor 03:00-06:00." },
  { date: "2026-04-22", tipo: "lluvia", icon: "☄️", nombre: "Líridas (pico)", desc: "10-15 met/h. Madrugada." },
  { date: "2026-05-06", tipo: "lluvia", icon: "☄️", nombre: "Eta Acuáridas (pico)", desc: "Restos cometa Halley. Sur ideal 30 met/h." },
  { date: "2026-08-12", tipo: "lluvia", icon: "☄️", nombre: "Perseidas (pico)", desc: "50 met/h. Mejor norte, pero visible." },
  { date: "2026-10-21", tipo: "lluvia", icon: "☄️", nombre: "Oriónidas (pico)", desc: "Halley otra vez. 15 met/h." },
  { date: "2026-11-17", tipo: "lluvia", icon: "☄️", nombre: "Leónidas (pico)", desc: "10 met/h, bólidos." },
  { date: "2026-12-14", tipo: "lluvia", icon: "☄️", nombre: "Gemínidas (pico)", desc: "Mejor del año 120 met/h. Madrugada." },
  // 2027 adelanto
  { date: "2027-02-06", tipo: "eclipse", icon: "🌘", nombre: "Eclipse anular de Sol", desc: "África/Sur América. Parcial en sur Chile tarde." },
  { date: "2027-08-02", tipo: "eclipse", icon: "🌘", nombre: "Eclipse total de Sol", desc: "Norte África/España. No visible Chile." }
];

const EVENTOS_COMUNA_PENCO = [
  { md: "02-12", nombre: "Aniversario fundación de Penco", icon: "🏛️", desc: "1550 fundación de Concepción en Penco. Actos municipales, desfile", cat: "municipal" },
  { md: "02-14", nombre: "Carnaval de Penco — Playa", icon: "🎭", desc: "Música, comparsas en costanera. Fecha móvil feb", cat: "fiesta" },
  { md: "03-08", nombre: "Día de la Mujer — Feria Rocuant", icon: "💜", desc: "Feria de emprendedoras, humedal", cat: "cultura" },
  { md: "05-21", nombre: "Glorias Navales — desfile", icon: "⚓", desc: "Escuelas y Armada en plaza", cat: "municipal" },
  { md: "06-21", nombre: "We Tripantu comunal", icon: "🌿", desc: "Rogativa al amanecer en playa/borde río", cat: "cultura" },
  { md: "06-29", nombre: "Fiesta de San Pedro — Caleta Lirquén", icon: "🐟", desc: "Patrono pescadores. Misa, procesión a mar", cat: "religioso" },
  { md: "07-26", nombre: "Santa Ana — patrona Penco", icon: "⛪", desc: "Fiesta religiosa local, feria", cat: "religioso" },
  { md: "08-15", nombre: "Feria costumbrista invierno", icon: "🥘", desc: "Gastronomía, chupalla, artesanía", cat: "feria" },
  { md: "09-18", nombre: "Fiestas Patrias — ramadas Penco", icon: "🇨🇱", desc: "18-19 ramadas en estadio/costanera", cat: "fiesta" },
  { md: "10-12", nombre: "Aniversario Cuerpo Bomberos Penco", icon: "🚒", desc: "Desfile, ejercicio", cat: "municipal" },
  { md: "11-01", nombre: "Noche de las velas — cementerio", icon: "🕯️", desc: "Tradición familiar", cat: "cultura" },
  { md: "12-08", nombre: "Virgen de la Candelaria — Lirquén", icon: "🙏", desc: "Procesión", cat: "religioso" },
  { md: "12-31", nombre: "Año Nuevo en playa — show pirotecnia", icon: "🎆", desc: "Costanera Penco, música", cat: "fiesta" },
  { md: "01-01", nombre: "Año Nuevo — feria amanecida", icon: "🎉", desc: "Feria madrugada 1 ene", cat: "feria" }
];

 window.pencoData = { PENCO, ESTACIONES, MOONS, DFT, INTRO, MOODS, EFEMERIDES, SIEMBRA, SIEMBRA_LUNAS, DONATE, AVES_PENCO, EVENTOS_ASTRONOMICOS, EVENTOS_COMUNA_PENCO };
