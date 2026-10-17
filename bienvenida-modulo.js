// bienvenida-modulo.js — pantalla de bienvenida (primera vez) + creación del perfil inicial.
// Convención IIFE + auto-registro, sin dependencias duras (CSP script-src 'self').
// Animación con anime.js v4 UMD vendored (anime-v4.js -> window.anime) + fallback CSS/rAF.
// Flujo: 0 Bienvenida -> 1 Perfil (nombre + preset) -> 2 Listo. Solo auto en instalación fresca.
(function () {
  'use strict';
  var KEY = 'cal13-bienvenida-v1';
  var ONB_KEY = 'cal13-onboarding-v2';
  var MOONS = ['🌑', '🌒', '🌒', '🌓', '🌓', '🌔', '🌕', '🌖', '🌗', '🌗', '🌘', '🌘', '🌑'];
  var FRASES = [
    '“13 lunas × 28 días = 364 días para sembrar, cuidar y recordar.”',
    '“La luna manda en la huerta: siembra en creciente, poda en menguante.”',
    '“Todo queda en tu dispositivo: privado, offline y libre (GPLv3).”'
  ];
  var PRESETS = [
    { id: 'esencial', ico: '✨', nom: 'Esencial', des: 'Lo justo y necesario' },
    { id: 'todo', ico: '🌙', nom: 'Todo', des: 'Calendario completo' },
    { id: 'adolescente', ico: '🧒', nom: 'Adolescente', des: 'Estudio + ánimo' },
    { id: 'adulto', ico: '🧑', nom: 'Adulto', des: 'Todo, vista auto' },
    { id: 'mayor', ico: '👵', nom: 'Mayor', des: 'Calma + salud' },
    { id: 'estudiante', ico: '📚', nom: 'Estudiante', des: 'Estudio + foco' },
    { id: 'agricultor', ico: '🌱', nom: 'Agricultor', des: 'Luna + huerta' },
    { id: 'pescador', ico: '🎣', nom: 'Pescador', des: 'Mareas + mar' },
    { id: 'salud', ico: '💚', nom: 'Salud', des: 'Cuerpo + energía' },
    { id: 'deportista', ico: '💪', nom: 'Deportista', des: 'Entreno + ritmo' },
    { id: 'docente', ico: '🍎', nom: 'Docente', des: 'Aula + familia' }
  ];
  var elegido = 'esencial';
  var overlay = null;
  var paso = 0;
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function A() { try { return window.anime || window.Anime || null; } catch (e) { return null; } }
  function tieneAnime() { var a = A(); return !!(a && (a.animate || a.createTimeline)); }

  // anime.js v4 UMD vendored (anime-v4.js) se precarga LAZY solo cuando puede
  // hacer falta (primera visita): así no penaliza el presupuesto de arranque
  // (scripts/perf-budget.cjs) en cada apertura. Todo el módulo degrada a
  // animación CSS/rAF si la precarga falla (offline sin caché, file://, etc.).
  var animeSrc = 'min/anime-v4.min.js?v=1';
  try {
    if (/^file:$/.test(location.protocol)) animeSrc = 'min/anime-v4.min.js';
  } catch (e) {}
  var animePromesa = null;
  function precargarAnime() {
    if (tieneAnime()) return null;
    if (animePromesa) return animePromesa;
    try {
      animePromesa = new Promise(function (res) {
        var s = document.createElement('script');
        s.src = animeSrc;
        s.async = true;
        var listo = false;
        function fin() { if (!listo) { listo = true; res(); } }
        s.onload = fin;
        s.onerror = fin;
        try { document.head.appendChild(s); } catch (e) { fin(); return; }
        setTimeout(fin, 3500); // red: sin anime igual se muestra (fallback)
      });
    } catch (e) { animePromesa = null; }
    return animePromesa;
  }

  // Memoria de sesión: si localStorage está bloqueado (WebView/APK con
  // almacenamiento desactivado, file:// sin cookies), igual se muestra 1 vez
  // por sesión en vez de nunca (web, APK y .exe comparten estas claves).
  var vistoMem = false;
  function visto() { try { if (vistoMem) return true; return localStorage.getItem(KEY) === '1'; } catch (e) { return vistoMem; } }
  function marcar() { vistoMem = true; try { localStorage.setItem(KEY, '1'); } catch (e) {} }
  function marcarOnboarding() { try { localStorage.setItem(ONB_KEY, '1'); } catch (e) {} }

  function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function limpiarNombre(s) {
    var t = (s || '').toString().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, 30);
    return t.replace(/\s{2,}/g, ' ');
  }

  function datosFrescos() {
    // Instalación fresca: usuario único "Principal" sin uso real.
    try {
      if (typeof DATA === 'undefined' || !DATA) return false;
      var us = DATA.usuarios;
      if (!us || !us.length) return true;
      if (us.length > 1) return false;
      if ((us[0].nombre || '') !== 'Principal') return false;
      if (localStorage.getItem('cal13-ultimo-respaldo')) return false;
      var d = null;
      try { d = localStorage.getItem('cal13-data'); } catch (e2) {}
      if (d && d.length > 2000) return false;
      try {
        var notas = DATA.notas && DATA.notas[DATA.actual || 'u1'];
        if (notas && JSON.stringify(notas).length > 2000) return false;
      } catch (e3) {}
      return true;
    } catch (e) { return true; }
  }

  // ¿PC o celular? Espeja isMobileWidth() de core-calendario.js (920px).
  // En PC la bienvenida debe dejar la vista de PC (🌙 Luna); en celular la
  // de Hoy. Si renderer no cargó, se decide por matchMedia/ancho.
  function esPC() {
    try { if (typeof isMobileWidth === 'function') return !isMobileWidth(); } catch (e) {}
    try {
      if (document.body && document.body.dataset && document.body.dataset.forceMobile === '1') return false;
      if (window.matchMedia) return !window.matchMedia('(max-width: 920px)').matches;
      return (window.innerWidth || 9999) > 920;
    } catch (e) { return true; }
  }

  // Aplica preset replicando renderer.js sin depender de sus const internas
  // (const de scope global clásico no son visibles como window.*; se usa
  // homeBlocksForPreset() para vista + bloques ◉ Hoy y se deja visible todo
  // para no esconder nada por error; el ajuste fino vive en ⚙️ Personalizar).
  function aplicarPresetSeguro(nombre) {
    try {
      if (typeof DATA === 'undefined' || !DATA) return;
      DATA.config = DATA.config || {};
      var esTodo = (nombre === 'todo' || nombre === 'adulto');
      try {
        if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS && ALL_BTNS.forEach) {
          var vis = {};
          ALL_BTNS.forEach(function (k) { vis[k] = esTodo ? true : true; });
          // Sin acceso al mapa del preset, el filtrado fino lo hará el
          // usuario en ⚙️ Personalizar; el home sí queda filtrado abajo.
          // Para no esconder nada por error, se dejan visibles.
          DATA.config.visible = vis;
        }
      } catch (e2) {}
      DATA.config.perfil = nombre;
      try {
        if (typeof homeBlocksForPreset === 'function') {
          var hp = homeBlocksForPreset(nombre);
          if (hp) {
            DATA.config.home = DATA.config.home || {};
            DATA.config.home.startView = hp.startView;
            DATA.config.home.blocks = hp.blocks;
            // En PC no se entra en Hoy (vista de celular): 'auto' resuelve a
            // 🌙 Luna en PC y a ◉ Hoy en celular (ver applyStartView).
            if (esPC() && DATA.config.home.startView === 'hoy') DATA.config.home.startView = 'auto';
          }
        }
      } catch (e3) {}
      try { if (typeof syncHomeConfigUI === 'function') syncHomeConfigUI(); } catch (e4) {}
      try { if (typeof syncPerfilUI === 'function') syncPerfilUI(); } catch (e5) {}
      try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e6) {}
    } catch (e) {}
  }

  function guardarPerfil(nombre, preset) {
    if (typeof DATA === 'undefined' || !DATA) return null;
    if (!DATA.usuarios) { DATA.usuarios = [{ id: 'u1', nombre: 'Principal' }]; DATA.actual = 'u1'; }
    if (!DATA.notas) DATA.notas = {};
    var fresco = DATA.usuarios.length === 1 && DATA.usuarios[0].id === 'u1' &&
      ((DATA.usuarios[0].nombre || '') === 'Principal' || !(DATA.usuarios[0].nombre || '').trim());
    var id;
    if (fresco) {
      DATA.usuarios[0].nombre = nombre;
      id = 'u1';
      DATA.actual = 'u1';
      if (!DATA.notas.u1) DATA.notas.u1 = { cycles: {} };
    } else {
      id = 'u' + Date.now();
      DATA.usuarios.push({ id: id, nombre: nombre });
      DATA.notas[id] = { cycles: {} };
      DATA.actual = id;
    }
    aplicarPresetSeguro(preset);
    try { if (typeof buildSidebar === 'function') buildSidebar(); } catch (e) {}
    try { if (typeof scheduleSave === 'function') scheduleSave('¡Perfil creado! 🌙'); } catch (e2) {}
    try { if (window.api && window.api.saveData) window.api.saveData(JSON.stringify(DATA)).catch(function () {}); } catch (e3) {}
    return id;
  }

  function construir() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'bienvenidaOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Bienvenida al Calendario de las 13 Lunas');
    overlay.hidden = true;
    var moonsHtml = MOONS.map(function (m, i) {
      return '<span class="bv-moon" data-i="' + i + '" aria-hidden="true">' + m + '</span>';
    }).join('');
    var presetsHtml = PRESETS.map(function (p) {
      var on = p.id === elegido ? ' aria-pressed="true"' : ' aria-pressed="false"';
      return '<button type="button" class="bv-preset" data-preset="' + p.id + '"' + on + '>' +
        esc(p.ico + ' ' + p.nom) + '<small>' + esc(p.des) + '</small></button>';
    }).join('');
    overlay.innerHTML =
      '<canvas id="bvStars" aria-hidden="true"></canvas>' +
      '<div class="bv-card">' +
      '<div class="bv-moons" aria-hidden="true">' + moonsHtml + '</div>' +
      '<div class="bv-kicker">Penco · Bío-Bío · Chile</div>' +
      '<h2 class="bv-title" id="bvTitle">Mari Küla Küyen</h2>' +
      '<p class="bv-sub">Calendario de las 13 Lunas · 13 × 28 días</p>' +
      '<div class="bv-lunas-count" id="bvCount" aria-live="polite"></div>' +
      '<div class="bv-steps">' +
      '<section class="bv-step active" data-step="0" aria-label="Bienvenida">' +
      '<h3>🌙 ¡Bienvenid@ a tu calendario lunar!</h3>' +
      '<p>Las <b>13 lunas</b> ordenan tu siembra, tus mareas y tu memoria.' +
      ' Todo queda <b>privado en tu dispositivo</b>, sin cuentas ni publicidad.</p>' +
      '<p class="bv-hint">Te tomará 20 segundos crear tu perfil inicial.</p>' +
      '<div class="bv-actions"><button type="button" class="btn btn-accent" data-a="ir-perfil">Crear mi perfil →</button></div>' +
      '</section>' +
      '<section class="bv-step" data-step="1" aria-label="Crear perfil inicial">' +
      '<h3>👤 Crea tu perfil inicial</h3>' +
      '<div class="bv-field"><label for="bvNombre">¿Cómo te llamamos?</label>' +
      '<input type="text" id="bvNombre" maxlength="30" placeholder="ej: Mamá, Esteban, Semillero…" autocomplete="off">' +
      '<div class="bv-err" id="bvErr" aria-live="polite"></div></div>' +
      '<div class="bv-field"><label>Elige tu perfil (define tu pantalla de inicio)</label>' +
      '<div class="bv-presets" role="group" aria-label="Perfiles">' + presetsHtml + '</div></div>' +
      '<div class="bv-actions"><button type="button" class="btn" data-a="atras">← Atrás</button>' +
      '<button type="button" class="btn btn-accent" data-a="crear">Guardar y entrar ✓</button></div>' +
      '</section>' +
      '<section class="bv-step" data-step="2" aria-label="Listo">' +
      '<div class="bv-ok" aria-hidden="true">🌕</div>' +
      '<h3 id="bvHola">¡Listo!</h3>' +
      '<p id="bvResumen">Tu calendario ya está preparado.</p>' +
      '<div class="bv-actions"><button type="button" class="btn btn-accent" data-a="entrar">¡Empezar! ✓</button></div>' +
      '</section>' +
      '</div>' +
      '<div class="bv-dots" aria-hidden="true"><span class="bv-dot on"></span><span class="bv-dot"></span><span class="bv-dot"></span></div>' +
      '<button type="button" class="bv-skip" data-a="omitir">Explorar sin crear perfil</button>' +
      '<div class="bv-frase" id="bvFrase" aria-live="polite"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    // split título en chars para stagger (patrón text.split de anime v4)
    try {
      var t = overlay.querySelector('#bvTitle');
      var txt = t.textContent;
      t.setAttribute('aria-label', txt);
      t.innerHTML = '';
      txt.split('').forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'bv-ch';
        s.setAttribute('aria-hidden', 'true');
        s.textContent = ch === ' ' ? ' ' : ch;
        t.appendChild(s);
      });
    } catch (e) {}
    cablear();
    return overlay;
  }

  function cablear() {
    overlay.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-a],[data-preset]') : null;
      if (!b) return;
      if (b.hasAttribute('data-preset')) { elegirPreset(b); return; }
      var a = b.getAttribute('data-a');
      if (a === 'ir-perfil') irPaso(1, 1);
      else if (a === 'atras') irPaso(0, -1);
      else if (a === 'crear') crear();
      else if (a === 'entrar') cerrar(true);
      else if (a === 'omitir') cerrar(false);
    });
    try {
      var inp = overlay.querySelector('#bvNombre');
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); crear(); }
      });
    } catch (e) {}
  }

  function elegirPreset(btn) {
    elegido = btn.getAttribute('data-preset') || 'esencial';
    try {
      overlay.querySelectorAll('.bv-preset').forEach(function (x) {
        x.setAttribute('aria-pressed', x === btn ? 'true' : 'false');
      });
    } catch (e) {}
    // micro-interacción (anime v4 animate + fallback)
    try {
      var a = A();
      if (a && a.animate && !reduceMotion) a.animate(btn, { scale: [0.94, 1], duration: 280, ease: 'outBack' });
    } catch (e) {}
  }

  function irPaso(n, dir) {
    var prev = overlay.querySelector('.bv-step.active');
    var next = overlay.querySelector('.bv-step[data-step="' + n + '"]');
    if (!next) return;
    paso = n;
    try {
      overlay.querySelectorAll('.bv-dot').forEach(function (d, i) {
        d.classList.toggle('on', i === n);
      });
    } catch (e) {}
    var a = A();
    if (!tieneAnime() || reduceMotion || !prev || prev === next) {
      if (prev) prev.classList.remove('active');
      next.classList.add('active');
      if (n === 1) try { overlay.querySelector('#bvNombre').focus(); } catch (e) {}
      return;
    }
    try {
      a.animate(prev, {
        opacity: [1, 0], x: [0, -26 * (dir || 1)], duration: 220, ease: 'inQuad',
        onComplete: function () {
          prev.classList.remove('active');
          next.classList.add('active');
          a.animate(next, { opacity: [0, 1], x: [26 * (dir || 1), 0], duration: 380, ease: 'outExpo' });
          if (n === 1) try { overlay.querySelector('#bvNombre').focus(); } catch (e2) {}
        }
      });
    } catch (e) {
      prev.classList.remove('active');
      next.classList.add('active');
    }
  }

  function crear() {
    var inp = overlay.querySelector('#bvNombre');
    var err = overlay.querySelector('#bvErr');
    var nombre = limpiarNombre(inp ? inp.value : '');
    if (!nombre) {
      if (err) err.textContent = 'Escribe tu nombre (2 a 30 letras) para continuar.';
      try {
        var a = A();
        if (a && a.animate && !reduceMotion) a.animate(inp, { x: [0, -9, 9, -6, 6, 0], duration: 380, ease: 'outQuad' });
      } catch (e) {}
      try { inp.focus(); } catch (e2) {}
      return;
    }
    if (err) err.textContent = '';
    var id = guardarPerfil(nombre, elegido);
    if (!id) {
      if (err) err.textContent = 'No se pudo guardar (reintenta).';
      return;
    }
    try {
      overlay.querySelector('#bvHola').textContent = '¡Listo, ' + nombre + '! 🌙';
      var pnom = 'Esencial';
      try {
        for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === elegido) pnom = PRESETS[i].nom;
      } catch (e) {}
      overlay.querySelector('#bvResumen').textContent = esPC()
        ? 'Perfil «' + pnom + '» aplicado: entraste en la vista de PC (🌙 Luna) con lo esencial para ti.'
        : 'Perfil «' + pnom + '» aplicado: tu pantalla ◉ Hoy ya muestra lo esencial para ti.';
    } catch (e) {}
    // celebración: pulso de lunas (stagger from center, patrón examples/stagger)
    try {
      var an = A();
      if (an && an.animate && !reduceMotion) {
        an.animate(overlay.querySelectorAll('.bv-moon'), {
          scale: [1, 1.35, 1], duration: 700, ease: 'inOutQuad',
          delay: an.stagger ? an.stagger(60, { from: 'center' }) : 60
        });
      }
    } catch (e) {}
    irPaso(2, 1);
  }

  function animarEntrada() {
    var an = A();
    if (!tieneAnime() || reduceMotion) return;
    try {
      var moons = overlay.querySelectorAll('.bv-moon');
      var chars = overlay.querySelectorAll('.bv-ch');
      var tl = null;
      if (an.createTimeline) {
        tl = an.createTimeline({ defaults: { ease: 'outExpo' } });
        tl.add(moons, { scale: [0, 1], opacity: [0, 1], y: [26, 0], duration: 700, delay: an.stagger ? an.stagger(70, { from: 'center' }) : 70 }, 0)
          .add(chars, { y: ['.6em', 0], opacity: [0, 1], rotate: [8, 0], duration: 650, delay: an.stagger ? an.stagger(26, { from: 'center' }) : 26 }, 150)
          .add('.bv-sub', { opacity: [0, 1], y: [14, 0], duration: 500 }, '-=400')
          .add('.bv-step.active', { opacity: [0, 1], y: [18, 0], duration: 450 }, '-=300')
          .add('.bv-preset', { scale: [0.9, 1], opacity: [0, 1], duration: 400, delay: an.stagger ? an.stagger(35) : 35 }, '-=350');
        if (tl.init) { try { tl.init(); } catch (e) {} }
      } else if (an.animate) {
        an.animate(moons, { scale: [0, 1], opacity: [0, 1], duration: 700, delay: an.stagger ? an.stagger(70, { from: 'center' }) : 70, ease: 'outExpo' });
        an.animate(chars, { y: ['.6em', 0], opacity: [0, 1], duration: 650, delay: an.stagger ? an.stagger(26, { from: 'center' }) : 26, ease: 'outExpo' });
      }
      // contador 0→13 (patrón modifier roundPad de la skill)
      try {
        var cnt = overlay.querySelector('#bvCount');
        var obj = { n: 0 };
        if (an.animate && an.utils && an.utils.roundPad) {
          an.animate(obj, { n: [0, 13], duration: 1300, ease: 'inOutQuad', modifier: an.utils.roundPad(0), onUpdate: function () { cnt.textContent = '✨ ' + Math.round(obj.n) + ' / 13 lunas'; } });
        } else { cnt.textContent = '✨ 13 / 13 lunas'; }
      } catch (e) {}
    } catch (e) {}
  }

  function animarSalida(cb) {
    var hecho = false;
    function unaVez() { if (!hecho) { hecho = true; cb(); } }
    var an = A();
    if (!tieneAnime() || reduceMotion) { unaVez(); return; }
    try {
      an.animate(overlay.querySelector('.bv-card'), {
        opacity: [1, 0], y: [0, 26], scale: [1, 0.97], duration: 320, ease: 'inQuad',
        onComplete: unaVez
      });
      setTimeout(unaVez, 450); // red de seguridad si onComplete no dispara
    } catch (e) { unaVez(); }
  }

  var fraseTimer = null;
  function rotarFrases() {
    var i = 0;
    var el = overlay.querySelector('#bvFrase');
    if (!el) return;
    el.textContent = FRASES[0];
    try { if (fraseTimer) clearInterval(fraseTimer); } catch (e) {}
    fraseTimer = setInterval(function () {
      try {
        if (!document.body.contains(overlay) || overlay.hidden) { clearInterval(fraseTimer); return; }
        i = (i + 1) % FRASES.length;
        var an = A();
        if (an && an.animate && !reduceMotion) {
          an.animate(el, {
            opacity: [1, 0], duration: 260, ease: 'inQuad',
            onComplete: function () {
              el.textContent = FRASES[i];
              an.animate(el, { opacity: [0, 1], duration: 360, ease: 'outQuad' });
            }
          });
        } else { el.textContent = FRASES[i]; }
      } catch (e) {}
    }, 5200);
  }

  function fondoEstrellas() {
    try {
      var cv = overlay.querySelector('#bvStars');
      if (!cv) return;
      var ctx = cv.getContext('2d');
      if (!ctx) return;
      var W = 0, H = 0, estrellas = [];
      function medir() {
        var r = overlay.getBoundingClientRect();
        W = cv.width = Math.max(300, Math.floor(r.width));
        H = cv.height = Math.max(300, Math.floor(r.height));
      }
      medir();
      var N = reduceMotion ? 40 : 90;
      for (var i = 0; i < N; i++) {
        estrellas.push({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8, f: 0.4 + Math.random() * 1.6, p: Math.random() * 6.28 });
      }
      var t0 = 0;
      function pintar(t) {
        try {
          if (!document.body.contains(overlay) || overlay.hidden) return;
          ctx.clearRect(0, 0, W, H);
          for (var k = 0; k < estrellas.length; k++) {
            var s = estrellas[k];
            var tw = reduceMotion ? 0.75 : (0.35 + 0.65 * Math.abs(Math.sin(t / 1000 * s.f + s.p)));
            ctx.globalAlpha = tw;
            ctx.fillStyle = '#f5e9c8';
            ctx.beginPath();
            ctx.arc(s.x * W, s.y * H, s.r, 0, 6.2832);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        } catch (e) {}
      }
      var an = A();
      if (an && an.createTimer && !reduceMotion) {
        try {
          an.createTimer({ frameRate: 30, onUpdate: function (tm) { pintar(tm.currentTime); } });
        } catch (e) { pintar(0); }
      } else if (reduceMotion) {
        pintar(0);
      } else {
        (function loop(t) {
          pintar(t || 0);
          if (document.body.contains(overlay) && !overlay.hidden) requestAnimationFrame(loop);
        })();
      }
      try { window.addEventListener('resize', medir); } catch (e) {}
    } catch (e) {}
  }

  function mostrar() {
    construir();
    try {
      var ob = document.getElementById('onbBox');
      if (ob) ob.remove();
    } catch (e) {}
    paso = 0;
    try {
      overlay.querySelectorAll('.bv-step').forEach(function (s, i) {
        s.classList.toggle('active', i === 0);
      });
      overlay.querySelectorAll('.bv-dot').forEach(function (d, i) {
        d.classList.toggle('on', i === 0);
      });
      var inp = overlay.querySelector('#bvNombre');
      if (inp) { inp.value = ''; }
      var err = overlay.querySelector('#bvErr');
      if (err) err.textContent = '';
    } catch (e) {}
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    animarEntrada();
    fondoEstrellas();
    rotarFrases();
    setTimeout(function () {
      try {
        var b = overlay.querySelector('[data-a="ir-perfil"]');
        if (b) b.focus();
      } catch (e) {}
    }, 650);
  }

  var cerrando = false;
  function cerrar(creoPerfil) {
    if (cerrando) return;
    cerrando = true;
    try { if (fraseTimer) clearInterval(fraseTimer); } catch (e) {}
    animarSalida(function () {
      try {
        overlay.hidden = true;
        document.body.style.overflow = '';
      } catch (e) {}
      marcar();
      try {
        var ob = document.getElementById('onbBox');
        if (ob) ob.remove();
      } catch (e) {}
      if (creoPerfil) {
        // La bienvenida ya explicó Hoy/Luna/Bitácora: no duplicar el tour.
        marcarOnboarding();
        try {
          var el = document.getElementById('statusMsg');
          if (el) el.textContent = '✓ Perfil listo — busca funciones con 🔍 (Ctrl+K).';
        } catch (e) {}
        // En PC se entra en la vista de PC (🌙 Luna), no en Hoy.
        try {
          if (esPC() && typeof applyStartView === 'function') {
            var inf = (typeof todayInfo === 'function') ? todayInfo() : null;
            applyStartView(inf);
          }
        } catch (e2) {}
      } else {
        // Sin perfil: ceder a la guía inicial existente tras cerrar.
        setTimeout(function () {
          try {
            if (window.cal13onboarding && window.cal13onboarding.show) window.cal13onboarding.show();
          } catch (e) {}
        }, 600);
      }
      cerrando = false;
    });
  }

  function esperarLista() {
    // La precarga lazy arranca ya: cuando se muestre (~1s después), anime
    // suele estar listo y la entrada usa el timeline completo.
    try { if (!visto()) precargarAnime(); } catch (e) {}
    var intentos = 0;
    var t = setInterval(function () {
      intentos++;
      try {
        var lista = (typeof DATA !== 'undefined' && DATA && DATA.usuarios) ||
          (window.__calReady) ||
          ((document.getElementById('grid') || {}).children || []).length;
        if (lista) {
          clearInterval(t);
          setTimeout(function () {
            if (!visto() && datosFrescos()) mostrar();
          }, 700);
        } else if (intentos > 40) {
          clearInterval(t);
          // Sin núcleo (fallo parcial): no bloquear; reintentar una vez tarde.
          setTimeout(function () {
            try { if (!visto() && datosFrescos()) mostrar(); } catch (e) {}
          }, 8000);
        }
      } catch (e) { clearInterval(t); }
    }, 500);
    setTimeout(function () { try { clearInterval(t); } catch (e) {} }, 30000);
  }

  window.cal13bienvenida = { show: function () { construir(); mostrar(); }, version: 1 };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', esperarLista);
  else esperarLista();
})();
