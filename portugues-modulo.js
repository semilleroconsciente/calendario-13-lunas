/* ============================================================
   PORTUGUÉS · BRASILEIRO A1 → C1 + CULTURA — Calendario 13 Lunas
   Sección completa dentro de Aprender > Idiomas y cultura:
   - Botón btnPortugues (grupo aprender, sub idiomas, junto a
     Kimün Mapuzugun e Inglés)
   - Diálogo portuguesDialog con 6 pestañas:
     1) ☀️ Palavra do dia (palabra/frase rotativa + TTS pt-BR)
     2) 🌱 A1 Sobrevivência (20 tarjetas + ser/ter + mini-diálogo)
     3) 🌿 A2 Vida diária (14 tarjetas + passado + direções)
     4) 💬 B1 Viajar, trabalhar e opinar (10 + futuro/subjuntivo)
     5) 📜 B2–C1 + Cultura (expressões, falsos amigos, BR↔PT,
        pronúncia, música, comida, capoeira)
     6) 🧩 Quiz por níveis + racha local
   - Todo local y privado por usuario:
     userData().portugues = { ok, total, streak, lastDay }
   - 100% offline. TTS usa la voz del dispositivo (speechSynthesis
     con lang pt-BR), igual que el módulo de Inglés.
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
var PT_A1 = [
  { pt: 'olá / oi', es: 'hola', ex: 'Olá, como vai? — Hola, ¿cómo estás?' },
  { pt: 'obrigado / obrigada', es: 'gracias (hombre / mujer)', ex: 'Muito obrigado. — Muchas gracias.' },
  { pt: 'por favor', es: 'por favor', ex: 'Um café, por favor. — Un café, por favor.' },
  { pt: 'bom dia', es: 'buenos días', ex: 'Bom dia, turma. — Buenos días, clase.' },
  { pt: 'boa noite', es: 'buenas noches (saludo y despedida)', ex: 'Boa noite, até amanhã. — Buenas noches, hasta mañana.' },
  { pt: 'meu nome é…', es: 'me llamo…', ex: 'Meu nome é Ana. — Me llamo Ana.' },
  { pt: 'sou do Chile / sou chilena', es: 'soy de Chile / soy chilena', ex: 'Sou de Penco, Chile. — Soy de Penco, Chile.' },
  { pt: 'você fala espanhol?', es: '¿hablas español?', ex: 'Você fala espanhol? Falo um pouco. — ¿Hablas español? Hablo un poco.' },
  { pt: 'água', es: 'agua', ex: 'Uma água de coco, por favor. — Una agua de coco, por favor.' },
  { pt: 'comida / pão', es: 'comida / pan', ex: 'Pão e peixe, por favor. — Pan y pescado, por favor.' },
  { pt: 'casa', es: 'casa / hogar', ex: 'Minha casa fica perto do mar. — Mi casa queda cerca del mar.' },
  { pt: 'dia / hoje', es: 'día / hoy', ex: 'Hoje é um bom dia. — Hoy es un buen día.' },
  { pt: 'ser: eu sou / você é', es: 'ser: yo soy / tú eres', ex: 'Eu sou cansada. Você é gentil. — Estoy cansada. Eres amable.' },
  { pt: 'ter: eu tenho', es: 'tener: yo tengo', ex: 'Tenho duas irmãs. — Tengo dos hermanas.' },
  { pt: 'números 1–20', es: 'números 1–20', ex: 'Um, dois, três… vinte. — Uno, dos, tres… veinte.' },
  { pt: 'cores: vermelho, azul, verde', es: 'colores: rojo, azul, verde', ex: 'O mar é azul. — El mar es azul.' },
  { pt: 'família: mãe, pai', es: 'familia: mamá, papá', ex: 'Minha mãe cozinha bem. — Mi mamá cocina bien.' },
  { pt: 'eu gosto de…', es: 'me gusta…', ex: 'Gosto do mar. — Me gusta el mar.' },
  { pt: 'eu preciso de…', es: 'necesito…', ex: 'Preciso de ajuda, por favor. — Necesito ayuda, por favor.' },
  { pt: 'até amanhã', es: 'nos vemos mañana', ex: 'Tchau! Até amanhã. — ¡Chao! Nos vemos mañana.' }
];
var PT_A2 = [
  { pt: 'O que você fez ontem?', es: '¿Qué hiciste ayer?', ex: 'Trabalhei na horta. — Trabajé en la huerta.' },
  { pt: 'eu vou… (futuro próximo)', es: 'voy a…', ex: 'Vou cozinhar. — Voy a cocinar.' },
  { pt: 'maior que / o maior', es: 'más grande que / el más grande', ex: 'O mar é maior que o rio. — El mar es más grande que el río.' },
  { pt: 'quanto custa? / quantos?', es: '¿cuánto cuesta? / ¿cuántos?', ex: 'Quanto custa? — ¿Cuánto cuesta?' },
  { pt: 'tenho que trabalhar', es: 'tengo que trabajar', ex: 'Tenho que ir agora. — Me tengo que ir ahora.' },
  { pt: 'você pode me ajudar?', es: '¿puedes ayudarme?', ex: 'Pode falar devagar? — ¿Puedes hablar despacio?' },
  { pt: 'tem / há', es: 'hay', ex: 'Tem um mercado. — Hay un mercado.' },
  { pt: 'tempo: está sol / está chovendo', es: 'clima: hay sol / llueve', ex: 'Está ventando em Penco. — Está ventoso en Penco.' },
  { pt: 'passado: fui, comi, vi', es: 'pasado: fui, comí, vi', ex: 'Fomos à praia. — Fuimos a la playa.' },
  { pt: 'compras: quanto é?', es: 'compras: ¿cuánto es?', ex: 'São cinco mil pesos. — Son cinco mil pesos.' },
  { pt: 'direções: vire à esquerda / direita', es: 'direcciones: gira a la izquierda / derecha', ex: 'Vire à esquerda na praça. — Gira a la izquierda en la plaza.' },
  { pt: 'sentimentos: feliz, cansado, doente', es: 'sentimientos: feliz, cansado, enfermo', ex: 'Hoje estou cansada. — Hoy estoy cansada.' },
  { pt: 'cozinhar / limpar / lavar', es: 'cocinar / limpiar / lavar', ex: 'Cozinho todo dia. — Cocino todos los días.' },
  { pt: 'encontro: às três da tarde', es: 'cita: a las tres de la tarde', ex: 'Até às cinco. — Nos vemos a las cinco.' }
];
var PT_B1 = [
  { pt: 'moro aqui há 5 anos', es: 'vivo aquí desde hace 5 años', ex: 'Nunca vi neve. — Nunca he visto nieve.' },
  { pt: 'se chover, ficamos em casa', es: 'si llueve, nos quedamos (futuro de subjuntivo)', ex: 'Se você estudar, vai aprender. — Si estudias, aprenderás.' },
  { pt: 'procurar / cuidar / desistir', es: 'buscar / cuidar / rendirse', ex: 'Não desista! — ¡No te rindas!' },
  { pt: 'viagem: quero uma passagem', es: 'viajes: quiero un pasaje', ex: 'Uma passagem para Concepción, por favor. — Un pasaje a Concepción, por favor.' },
  { pt: 'trabalho: sou responsável por…', es: 'trabajo: soy responsable de…', ex: 'Sou responsável pela horta. — Estoy a cargo de la huerta.' },
  { pt: 'opinião: acho que / na minha opinião', es: 'opinión: creo que / en mi opinión', ex: 'Acho uma boa ideia. — Creo que es buena idea.' },
  { pt: 'costumava + infinitivo', es: 'solía + verbo', ex: 'Costumava tocar violão. — Solía tocar guitarra.' },
  { pt: 'então / porque / embora', es: 'así que / porque / aunque', ex: 'Estava frio, então ficamos em casa. — Hacía frío, así que nos quedamos.' },
  { pt: 'saúde: estou com dor de cabeça', es: 'salud: me duele la cabeza', ex: 'Preciso de uma consulta. — Necesito una hora médica.' },
  { pt: 'e-mail: abraços / atenciosamente', es: 'correo: abrazo / atentamente', ex: 'Atenciosamente, Ana. — Atentamente, Ana.' }
];
var PT_B2C1 = [
  { pt: 'quebrar o gelo', es: 'romper el hielo', ex: 'Uma piada quebra o gelo. — Un chiste rompe el hielo.' },
  { pt: 'pagar o pato', es: 'pagar los platos rotos', ex: 'Sempre eu pago o pato. — Siempre yo pago los platos rotos.' },
  { pt: 'chutar o balde', es: 'tirar la toalla / mandarlo todo lejos', ex: 'Quase chutei o balde. — Casi tiro la toalla.' },
  { pt: 'chorar sobre o leite derramado', es: 'llorar sobre la leche derramada', ex: 'Não adianta chorar. — No sirve llorar.' },
  { pt: 'tinha saído quando cheguei', es: 'ya se había ido cuando llegué (pretérito mais-que-perfeito)', ex: 'Para contar histórias no passado.' },
  { pt: 'se tivesse estudado, teria passado', es: 'si hubiera estudiado, habría pasado (condicional)', ex: 'Arrependimentos e lições.' },
  { pt: 'a praia foi limpa por voluntários', es: 'la playa fue limpiada (voz pasiva)', ex: 'Passiva: ser + particípio.' },
  { pt: 'ela disse que estava cansada', es: 'dijo que estaba cansada (discurso indireto)', ex: 'Direto → indireto: estou → estava.' },
  { pt: 'entrevista: meu ponto forte é…', es: 'entrevista: mi fortaleza es…', ex: 'Meu ponto forte é o trabalho em equipe. — Mi fortaleza es el trabajo en equipo.' },
  { pt: 'no entanto / além disso', es: 'sin embargo / además (ensayo)', ex: 'No entanto, o mar é vida. — Sin embargo, el mar es vida.' }
];
var PT_FALSOS = [
  ['🇪🇸 embarazada → 🇧🇷 grávida', 'embaraçada = avergonzada. “Estou embaraçada” NO es embarazo.'],
  ['🇪🇸 cena (escena) → 🇧🇷 cena = escena… ¡pero jantar = cena de noche!', '“Vamos jantar?” = ¿vamos a cenar? Cena también es escena: contexto manda.'],
  ['🇪🇸 presunto (supuesto) → 🇧🇷 presunto = jamón cocido', '“Pão com presunto” = pan con jamón. Nada de presupuestos.'],
  ['🇪🇸 largo → 🇧🇷 longo', 'largo en portugués = ancho. Largo (extenso) se dice comprido o longo.'],
  ['🇪🇸 oficina → 🇧🇷 oficina = taller mecánico', '“Levar o carro à oficina” = llevar el auto al taller. Escritório = oficina de trabajo.'],
  ['🇪🇸 polvo → 🇧🇷 polvo = pulpo', '“Polvo à lagareiro” = pulpo al horno. Poeira = polvo en el aire.'],
  ['🇪🇸 exquisito → 🇧🇷 esquisito = raro', '“Que comida esquisita” = qué comida tan rara (no rica). Gostoso = rico.'],
  ['🇪🇸 borracha → 🇧🇷 borracha = goma', '“Borracha” también es goma de borrar. Bêbada = borracha (persona).']
];
var PT_BRPT = [
  ['🚌 ônibus (BR) / autocarro (PT)', 'celular (BR) / telemóvel (PT) · geladeira (BR) / frigorífico (PT)'],
  ['🚂 trem (BR) / comboio (PT)', 'suco (BR) / sumo (PT) · banheiro (BR) / casa de banho (PT)'],
  ['🗣️ você (BR) / tu (PT)', 'BR usa você + verbo de 3ª persona (você fala). PT usa tu + verbo de 2ª (tu falas). Con você estás lista para Brasil.'],
  ['🔊 estou falando (BR) / estou a falar (PT)', 'Gerundio con -ndo en Brasil; en Portugal “a + infinitivo”. Entiende ambos, usa el BR.'],
  ['🍍 abacaxi (BR) / ananás (PT)', 'açaí, mandioca/macaxeira, caipirinha: solo existen en Brasil. Pregunta por ellas: abren conversación.']
];

/* ---------------- ESTADO ---------------- */
var portuTab = 'palavra';
var portuQuizQ = null;
var portuQuizLevel = 'todo';

function getPortuData() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { ok: 0, total: 0, streak: 0, lastDay: '' };
    if (!u.portugues) u.portugues = { ok: 0, total: 0, streak: 0, lastDay: '' };
    return u.portugues;
  } catch (e) { return { ok: 0, total: 0, streak: 0, lastDay: '' }; }
}
function portuDayIndex(n) {
  try {
    var d = new Date();
    var s = d.getFullYear() * 1000 + Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
    return s % n;
  } catch (e) { return 0; }
}
function portuVozLimpia(t) {
  // "olá / oi" -> "olá, oi": evita que el locutor diga "barra".
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
function portuSpeak(txt) {
  try {
    if (!('speechSynthesis' in window)) { alert('Este dispositivo no tiene voz disponible'); return; }
    var limpio = portuVozLimpia(txt);
    if (!limpio) limpio = String(txt || '');
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(limpio);
    u.lang = 'pt-BR'; u.rate = 0.9; u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}
function portuQuizPool() {
  if (portuQuizLevel === 'a1') return PT_A1;
  if (portuQuizLevel === 'a2') return PT_A2;
  if (portuQuizLevel === 'b1') return PT_B1;
  if (portuQuizLevel === 'avanzado') return PT_B2C1;
  return PT_A1.concat(PT_A2, PT_B1, PT_B2C1);
}
function portuAll() { return PT_A1.concat(PT_A2, PT_B1, PT_B2C1); }

function renderPortuStreak() {
  var b = $('portuStreakBox'); if (!b) return;
  var d = getPortuData();
  var pct = d.total ? Math.round(d.ok / d.total * 100) : 0;
  b.innerHTML = '<b>🌱 Seu português:</b> ' + d.ok + '/' + d.total + ' certas (' + pct + '%) · sequência ' + d.streak + ' 🔥 ' +
    '<span class="muted su-11a508">— 1 palavra por dia · A1→C1 + cultura · tudo salvo local e privado.</span>';
}
function portuCard(item, lv) {
  return '<button type="button" class="btn eng-word su-6cd6a1" data-w="' + esc(item.pt) + '"><b>🔊 ' + esc(item.pt) + '</b> ' +
    '<span class="chip su-0d5be0">' + esc(lv) + '</span><br><span class="su-2f290d">' + esc(item.es) + '</span><br>' +
    '<span class="muted su-11a508">“' + esc(item.ex) + '”</span></button>';
}

function renderPortuPanel(tab) {
  portuTab = tab || portuTab;
  var ids = { palavra: 'tabPT1', a1: 'tabPT2', a2: 'tabPT3', b1: 'tabPT4', cultura: 'tabPT5', quiz: 'tabPT6' };
  Object.keys(ids).forEach(function (k) { var el = $(ids[k]); if (el) el.classList.toggle('btn-accent', k === portuTab); });
  renderPortuStreak();
  var box = $('portuPanel'); if (!box) return;
  var html = '';
  if (portuTab === 'palavra') {
    var all = portuAll();
    var w = all[portuDayIndex(all.length)];
    var rel = [all[(portuDayIndex(all.length) + 7) % all.length], all[(portuDayIndex(all.length) + 13) % all.length]];
    var f = new Date();
    var fecha = '';
    try { fecha = cal.fmtDate.format(f); } catch (e) { fecha = f.toLocaleDateString(); }
    html += '<div class="menstrual-card su-3fa1a8">' +
      '<p class="muted su-11a508">☀️ PALAVRA DO DIA · ' + esc(fecha) + ' · ' + all.length + ' palavras e frases</p>' +
      '<div class="su-6adb68">' + esc(w.pt) + '</div>' +
      '<div class="su-cd8bd8"><b>' + esc(w.es) + '</b></div>' +
      '<p class="muted su-2b0979">“' + esc(w.ex) + '”</p>' +
      '<div class="su-9bc2df"><button type="button" id="portuSpeakBtn" class="btn btn-accent su-30e741">🔊 Ouvir</button> ' +
      '<button type="button" id="portuNextBtn" class="btn su-30e741">🎲 Outra palavra</button></div></div>' +
      '<div class="help-grid su-d2c171">' +
      rel.map(function (r) { return '<div class="help-card"><h4>' + esc(r.pt) + '</h4><p class="su-11a508">' + esc(r.es) + '<br><span class="muted">“' + esc(r.ex) + '”</span></p></div>'; }).join('') + '</div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>🗣️ Como praticar?</h4><p class="su-b439ab">1) <b>Ouve</b> com 🔊 e repete 3 vezes em voz alta.<br>2) <b>Escreve</b> 1 frase com a palavra nas Notas do dia.<br>3) <b>Usa hoje</b>: 1 palavra/dia → ~365/ano.<br>Passa a A2 quando souberes 20 sem olhar.</p></div>' +
      '<div class="help-card"><h4>📚 Níveis (CEFR)</h4><p class="su-b439ab">🌱 <b>A1:</b> sobreviver (olá, comida, casa).<br>🌿 <b>A2:</b> vida diária (passado, futuro, compras).<br>💬 <b>B1:</b> viagem + trabalho + opinião.<br>📜 <b>B2–C1:</b> expressões, passiva, entrevista + cultura.</p></div></div>';
  } else if (portuTab === 'a1') {
    html += '<div class="menstrual-card su-5a6934"><h4 class="su-752b1a">🌱 A1 Sobrevivência — sobreviva em português</h4>' +
      '<p class="muted su-a6c665">Meta: apresentar-se, pedir comida, contar 1–20. Gramática: <b>ser (eu sou / você é), um/uma/o/a, eu gosto / eu preciso, plural -s</b>. Toca 🔊 em cada cartão para ouvir (pt-BR).</p>' +
      '<div class="su-5e3875">' + PT_A1.map(function (x) { return portuCard(x, 'A1'); }).join('') + '</div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>⚙️ Ser + ter (o 50% do dia)</h4><p class="su-583677"><b>Eu sou</b> cansada · <b>Você é</b> gentil<br><b>Ele/ela é</b> daqui · <b>Nós somos</b> amigos<br><b>Eu tenho</b> dois filhos · <b>Você tem</b> tempo?<br><span class="muted">Negação: eu <b>não</b> sou… Pergunta: <b>você é…?</b></span></p></div>' +
      '<div class="help-card"><h4>🎭 Mini-diálogo: na feira</h4><p class="su-583677">— <b>Olá! Quanto custa?</b><br>— <b>Cinco mil pesos.</b><br>— <b>Obrigada. Até amanhã!</b><br><span class="muted">Treina: uma pessoa por linha. Troca “pesos” por “reais” no Brasil.</span></p></div></div>';
  } else if (portuTab === 'a2') {
    html += '<div class="menstrual-card su-018729"><h4 class="su-721a46">🌿 A2 Vida diária — o dia a dia</h4>' +
      '<p class="muted su-a6c665">Meta: contar o que fez, planos, compras e direções. Gramática: <b>pretérito (fui/comi/vi), vou + infinitivo, comparativos, tem, poder</b>.</p>' +
      '<div class="su-5e3875">' + PT_A2.map(function (x) { return portuCard(x, 'A2'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>🎭 Mini-diálogo: pedindo direção em Penco</h4><p class="su-583677">— <b>Com licença, onde fica a praia?</b><br>— <b>Siga reto, depois vire à esquerda na praça.</b><br>— <b>Muito obrigada!</b> — <b>De nada!</b><br><span class="muted">Chave: reto = derecho, virar = girar, perto = cerca.</span></p></div>';
  } else if (portuTab === 'b1') {
    html += '<div class="menstrual-card su-d4d722"><h4 class="su-7c91e2">💬 B1 Intermediário — viagem, trabalho e opinião</h4>' +
      '<p class="muted su-a6c665">Meta: viajar, trabalhar e opinar. Gramática estrella: <b>se + futuro do subjuntivo (se chover, ficamos)</b> + pretérito perfeito com <b>há</b> (moro aqui há 5 anos) + costumava.</p>' +
      '<div class="su-5e3875">' + PT_B1.map(function (x) { return portuCard(x, 'B1'); }).join('') + '</div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>🎭 Mini-diálogo: viagem a Concepción</h4><p class="su-583677">— <b>Quero uma passagem para Concepción.</b><br>— <b>Ida ou ida e volta?</b> — <b>Ida e volta, por favor.</b><br>— <b>Você mora aqui há muito tempo?</b> — <b>Moro aqui há cinco anos.</b><br><span class="muted">Treina com horários, preços e “há + tempo”.</span></p></div>';
  } else if (portuTab === 'cultura') {
    html += '<div class="menstrual-card su-5b7cd0"><h4 class="su-399074">📜 B2–C1 Avançado + Cultura viva</h4>' +
      '<p class="muted su-a6c665">Meta: entrevistas, expressões e não passar vergonha com falsos amigos. Gramática: <b>mais-que-perfeito (tinha saído), condicional (teria passado), voz passiva, discurso indireto, conectores (no entanto, além disso)</b>.</p>' +
      '<div class="su-5e3875">' + PT_B2C1.map(function (x) { return portuCard(x, 'B2–C1'); }).join('') + '</div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>⚠️ 8 falsos amigos que salvam vidas</h4><p class="su-583677">' + PT_FALSOS.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div>' +
      '<div class="help-card"><h4>🇧🇷↔️🇵🇹 Brasil ou Portugal?</h4><p class="su-583677">' + PT_BRPT.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div></div>' +
      '<div class="help-grid su-d2c171">' +
      '<div class="help-card"><h4>🗣️ Pronúncia em 1 minuto</h4><p class="su-b439ab"><b>ão</b> nasal: pão, coração (nariz vibra)<br><b>lh</b> ≈ li: filho (filiu) · <b>nh</b> ≈ ñ: vinho (viño)<br><b>r</b> inicial ≈ j: rato (jato) · <b>s</b> entre vogais = z: casa (caza)<br><b>o</b> final ≈ u: obrigado (obrigadu) · <b>e</b> final ≈ i: cidade (sidadji)<br><span class="muted">Fala devagar e nasalando: melhor que perfeito.</span></p></div>' +
      '<div class="help-card"><h4>🎶 Cultura para ouvir e provar</h4><p class="su-b439ab"><b>Ouvir:</b> Garota de Ipanema (bossa nova), Asa Branca (forró), Mas que Nada (samba). 1 música × 7 dias.<br><b>Provar:</b> feijoada, brigadeiro, pão de queijo — procura a receita e lê em português.<br><b>Ver:</b> capoeira (roda + berimbau): “jogar capoeira” não é lutar, é conversar com o corpo.<br><span class="muted">Festa junina (junho, como o We Tripantu) e carnaval: o calendário também é festa.</span></p></div></div>' +
      '<div class="menstrual-card su-4adf8c"><h4>💼 Kit entrevista de trabalho</h4><p class="su-583677">— <b>Fale um pouco sobre você.</b><br>— <b>Sou responsável e trabalho bem em equipe.</b><br>— <b>Meu ponto forte é… Meu objetivo é…</b><br><span class="muted">Fecha: “Obrigada pelo seu tempo.”</span></p></div>';
  } else if (portuTab === 'quiz') {
    var d = getPortuData();
    if (!portuQuizQ) {
      var pool = portuQuizPool();
      var wq = pool[Math.floor(Math.random() * pool.length)];
      var opts = {};
      opts[wq.es] = 1;
      var guard = 0;
      while (Object.keys(opts).length < 4 && guard < 60) { guard++; opts[pool[Math.floor(Math.random() * pool.length)].es] = 1; }
      var arr = Object.keys(opts).sort(function () { return Math.random() - 0.5; });
      portuQuizQ = { w: wq, opts: arr };
    }
    var q = portuQuizQ;
    var lvBtn = function (v, l) { return '<button type="button" class="btn portu-lv' + (portuQuizLevel === v ? ' btn-accent' : '') + ' su-337714" data-lv="' + v + '">' + l + '</button>'; };
    html += '<div class="menstrual-card su-1f2df9"><h4 class="su-399074">🧩 Quiz por níveis</h4>' +
      '<div class="su-a8712a">' + lvBtn('todo', '🌎 Todo') + lvBtn('a1', '🌱 A1') + lvBtn('a2', '🌿 A2') + lvBtn('b1', '💬 B1') + lvBtn('avanzado', '📜 B2–C1') + '</div>' +
      '<div class="su-73ce29">“' + esc(q.w.pt) + '”</div>' +
      '<button type="button" id="portuQuizSpeak" class="btn su-337714">🔊 Ouvir</button>' +
      '<div class="su-ae0e71">' + q.opts.map(function (o) { return '<button type="button" class="btn portu-opt su-046678" data-o="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div>' +
      '<div id="portuQuizFb" class="su-ac1122"></div>' +
      '<p class="muted su-e13d76">Certas ' + d.ok + '/' + d.total + ' · sequência ' + d.streak + ' · nível: <b>' + esc(portuQuizLevel) + '</b> · banco: ' + portuQuizPool().length + ' palavras/frases</p></div>';
  }
  box.innerHTML = html + '<p class="muted su-a953a7">🔊 Toca qualquer cartão para ouvir em português (pt-BR, voz do dispositivo). O quiz soma à tua sequência local e privada.</p>';
  var sp = $('portuSpeakBtn');
  if (sp) sp.onclick = function (e) { try { e.preventDefault(); } catch (x) {} var a = portuAll(); portuSpeak(a[portuDayIndex(a.length)].pt); };
  var nx = $('portuNextBtn');
  if (nx) nx.onclick = function () { renderPortuPanel('palavra'); };
  var qs = $('portuQuizSpeak');
  if (qs) qs.onclick = function (e) { try { e.preventDefault(); } catch (x) {} if (portuQuizQ) portuSpeak(portuQuizQ.w.pt); };
  box.querySelectorAll('.eng-word').forEach(function (b) {
    b.onclick = function (e) { try { e.preventDefault(); } catch (x) {} portuSpeak(b.getAttribute('data-w')); };
  });
  box.querySelectorAll('.portu-lv').forEach(function (b) {
    b.onclick = function () { portuQuizLevel = b.getAttribute('data-lv'); portuQuizQ = null; renderPortuPanel('quiz'); };
  });
  box.querySelectorAll('.portu-opt').forEach(function (b) {
    b.onclick = function () {
      var d2 = getPortuData();
      var ok = b.getAttribute('data-o') === portuQuizQ.w.es;
      d2.total = (d2.total || 0) + 1;
      if (ok) { d2.ok = (d2.ok || 0) + 1; d2.streak = (d2.streak || 0) + 1; }
      else { d2.streak = 0; }
      try { if (typeof scheduleSave === 'function') scheduleSave('Guardado ✓'); } catch (e) {}
      var fb = $('portuQuizFb');
      if (fb) fb.innerHTML = ok ? '✅ Muito bem! <b>' + esc(portuQuizQ.w.ex) + '</b>' : '❌ Era <b>' + esc(portuQuizQ.w.es) + '</b> — “' + esc(portuQuizQ.w.ex) + '”';
      box.querySelectorAll('.portu-opt').forEach(function (x) {
        x.disabled = true;
        if (x.getAttribute('data-o') === portuQuizQ.w.es) x.classList.add('btn-accent');
      });
      renderPortuStreak();
      setTimeout(function () { portuQuizQ = null; if (portuTab === 'quiz') renderPortuPanel('quiz'); }, ok ? 1400 : 2200);
    };
  });
}

/* ---------------- DIÁLOGO ---------------- */
function buildDialog() {
  if ($('portuguesDialog')) return;
  var d = document.createElement('dialog');
  d.id = 'portuguesDialog';
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053"><h3 class="su-ee0cfe">🇧🇷 Português — A1 → C1 + cultura</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Aprende <b>português brasileiro (pt-BR) por níveis CEFR + cultura viva</b>, como o Kimün e o Inglês: 1 palavra por dia + gramática + quiz. Toca 🔊 para ouvir (voz do dispositivo, pt-BR). Todo fica <b>local e privado</b> por usuário.</p>' +
    '<div id="portuStreakBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="timer-tabs su-f7ad78">' +
    '<button type="button" id="tabPT1" class="btn btn-accent su-30e741">☀️ Palavra do dia</button>' +
    '<button type="button" id="tabPT2" class="btn su-30e741">🌱 A1</button>' +
    '<button type="button" id="tabPT3" class="btn su-30e741">🌿 A2</button>' +
    '<button type="button" id="tabPT4" class="btn su-30e741">💬 B1</button>' +
    '<button type="button" id="tabPT5" class="btn su-30e741">📜 B2–C1 + Cultura</button>' +
    '<button type="button" id="tabPT6" class="btn su-30e741">🧩 Quiz</button></div>' +
    '<div id="portuPanel"></div>' +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
}

function bindTabs() {
  var map = { tabPT1: 'palavra', tabPT2: 'a1', tabPT3: 'a2', tabPT4: 'b1', tabPT5: 'cultura', tabPT6: 'quiz' };
  Object.keys(map).forEach(function (id) {
    var el = $(id);
    if (el) el.onclick = function () { if (map[id] !== 'quiz') portuQuizQ = null; renderPortuPanel(map[id]); };
  });
}

/* ---------------- SETUP ---------------- */
function ensureButton() {
  try {
    var existing = $('btnPortugues');
    if (existing) { try { existing.setAttribute('data-sub', 'idiomas'); } catch (e) {} return existing; }
    var g = document.querySelector('.action-group[data-group="aprender"] .group-btns');
    if (!g) return null;
    var btn = document.createElement('button');
    btn.id = 'btnPortugues'; btn.className = 'btn'; btn.type = 'button';
    btn.textContent = '🇧🇷 Portugués';
    try { btn.setAttribute('data-sub', 'idiomas'); } catch (e2) {}
    btn.setAttribute('data-keywords', 'portugues portugués brasil brasilero brasileiro pt br idioma niveles a1 a2 b1 b2 c1 basico intermedio avanzado quiz vocabulario gramatica frases samba bossa capoeira feijoada falsos amigos cah');
    var ref = g.querySelector('#btnEnglish');
    if (ref && ref.parentNode === g) g.insertBefore(btn, ref.nextSibling);
    else g.appendChild(btn);
    return btn;
  } catch (e) { return null; }
}

function registerGlobals() {
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnPortugues') < 0) {
      var i = ALL_BTNS.indexOf('btnEnglish');
      if (i >= 0) ALL_BTNS.splice(i + 1, 0, 'btnPortugues');
      else ALL_BTNS.push('btnPortugues');
    }
  } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnPortugues = ['aprender', 'idiomas']; } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['aprender|idiomas'] && BTN_ORDER['aprender|idiomas'].indexOf('btnPortugues') < 0) {
      BTN_ORDER['aprender|idiomas'].push('btnPortugues');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p] && (p === 'todo' || p === 'adulto' || p === 'estudiante' || p === 'docente' || p === 'adolescente')) PRESETS[p].btnPortugues = true;
      });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnPortugues"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Aprender') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnPortugues"> 🇧🇷 Portugués';
          var ref2 = gr.querySelector('input[data-btn="btnEnglish"]');
          if (ref2 && ref2.closest && ref2.closest('label') && ref2.closest('label').parentNode) {
            ref2.closest('label').parentNode.insertBefore(lab, ref2.closest('label').nextSibling);
          } else { gr.appendChild(lab); }
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnPortugues !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnPortugues = lab.querySelector('input').checked;
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
  renderPortuPanel('palavra');
  var b = $('btnPortugues');
  if (!b) { if ((setup._r = (setup._r || 0) + 1) < 60) setTimeout(setup, 500); return; }
  if (!b.dataset.ptu) {
    b.dataset.ptu = '1';
    b.addEventListener('click', function () {
      portuQuizQ = null;
      renderPortuPanel('palavra');
      openDlg('portuguesDialog');
    });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 500); });
else setTimeout(setup, 500);

})();
