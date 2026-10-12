// orden-herramientas-modulo.js — reordenar herramientas, secciones y subsecciones.
// - Los 7 grupos base quedan FIJOS (dia, territorio, cuerpo, aprender, linaje, hogar, comunidad).
// - Se puede mover: herramientas (botones) dentro de su subseccion, entre
//   subsecciones del mismo u otro grupo, y el orden de las subsecciones
//   (sub-labels) dentro de cada grupo.
// - Todo se guarda en DATA.config.orden por instalacion (como visible/secciones)
//   y se reaplica de forma idempotente tras cada cambio del DOM (observer).
(function () {
  'use strict';

  var GRUPOS_FIJOS = ['dia', 'territorio', 'cuerpo', 'aprender', 'linaje', 'hogar', 'comunidad'];
  var GRUPO_NOMBRE = {
    dia: '📅 Mi Día', territorio: '🌊 Territorio Penco', cuerpo: '💚 Cuerpo & Salud',
    aprender: '🧠 Aprender, Crear y Jugar', linaje: '🪞 Interior, Linaje y Memoria',
    hogar: '🏡 Hogar y Vida Práctica', comunidad: '🤝 Comunidad'
  };

  function $(id) { return document.getElementById(id); }
  function data() { try { return (typeof DATA !== 'undefined') ? DATA : (window.DATA || {}); } catch (e) { return {}; } }
  function guardar(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Orden guardado ✓'); } catch (e) {} }

  // ---- persistencia ----
  function getOrden() {
    try {
      var D = data();
      D.config = D.config || {};
      var o = D.config.orden;
      if (!o || typeof o !== 'object') { o = { subs: {}, btns: {}, ubic: {} }; D.config.orden = o; }
      if (!o.subs || typeof o.subs !== 'object') o.subs = {};
      if (!o.btns || typeof o.btns !== 'object') o.btns = {};
      if (!o.ubic || typeof o.ubic !== 'object') o.ubic = {};
      return o;
    } catch (e) { return { subs: {}, btns: {}, ubic: {} }; }
  }

  function grupoDe(el) {
    try {
      var g = el && el.closest ? el.closest('.action-group') : null;
      return g ? (g.getAttribute('data-group') || '') : '';
    } catch (e) { return ''; }
  }
  function subDeBtn(btn) {
    try {
      var s = (btn.dataset && btn.dataset.sub) || '';
      if (s) return s;
      // recorre hacia atras buscando su sub-label
      var n = btn.previousElementSibling;
      while (n) {
        if (n.classList && n.classList.contains('sub-label')) return n.getAttribute('data-sub') || '';
        n = n.previousElementSibling;
      }
      return '';
    } catch (e) { return ''; }
  }
  function clave(group, sub) { return (group || '') + '|' + (sub || ''); }

  function botonesDe(group, sub) {
    try {
      var box = document.querySelector('.action-group[data-group="' + group + '"] .group-btns');
      if (!box) return [];
      return Array.prototype.filter.call(box.querySelectorAll('.btn[id]'), function (b) {
        return subDeBtn(b) === sub;
      });
    } catch (e) { return []; }
  }
  function subsDe(group) {
    try {
      var box = document.querySelector('.action-group[data-group="' + group + '"] .group-btns');
      if (!box) return [];
      var out = [];
      box.querySelectorAll('.sub-label[data-sub]').forEach(function (l) {
        var s = l.getAttribute('data-sub');
        if (s && out.indexOf(s) < 0) out.push(s);
      });
      // subs huerfanas: botones con data-sub sin label
      box.querySelectorAll('.btn[id]').forEach(function (b) {
        var s = subDeBtn(b);
        if (s && out.indexOf(s) < 0) out.push(s);
      });
      return out;
    } catch (e) { return []; }
  }
  function nombreBtn(id) {
    try {
      var b = $(id);
      var t = b ? (b.textContent || '').replace(/\s+/g, ' ').trim() : id;
      return t.slice(0, 42) || id;
    } catch (e) { return id; }
  }
  function nombreSub(group, sub) {
    try {
      var l = document.querySelector('.action-group[data-group="' + group + '"] .sub-label[data-sub="' + sub + '"]');
      if (l) {
        // sin los controles de orden (▲▼) que se inyectan en modo ordenar
        var c = l.cloneNode ? l.cloneNode(true) : null;
        if (c && c.querySelectorAll) {
          c.querySelectorAll('.ord-sub,.ord-wrap').forEach(function (x) { try { x.remove(); } catch (e2) {} });
          return (c.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48);
        }
        return (l.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48);
      }
    } catch (e) {}
    return sub || '(sin sección)';
  }

  function asegurarSubLabel(group, sub) {
    try {
      var box = document.querySelector('.action-group[data-group="' + group + '"] .group-btns');
      if (!box || !sub) return null;
      var lab = box.querySelector('.sub-label[data-sub="' + sub + '"]');
      if (lab) return lab;
      lab = document.createElement('span');
      lab.className = 'sub-label';
      lab.setAttribute('data-sub', sub);
      lab.textContent = sub;
      box.appendChild(lab);
      return lab;
    } catch (e) { return null; }
  }

  // ---- aplicar orden personalizado (despues de reordenarAcciones) ----
  // Idempotente: si el DOM ya refleja el orden deseado no toca nada (evita
  // bucles con el MutationObserver y con los reordenamientos del nucleo).
  function igual(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  var __aplicando = false;
  function fijarGrupos() {
    try {
      var root = $('actions');
      if (!root) return;
      var actual = [];
      Array.prototype.forEach.call(root.children, function (d) {
        try {
          if (d.classList && d.classList.contains('action-group')) {
            var g = d.getAttribute('data-group');
            if (g && GRUPOS_FIJOS.indexOf(g) >= 0) actual.push(g);
          }
        } catch (e) {}
      });
      var esperado = GRUPOS_FIJOS.filter(function (g) { return actual.indexOf(g) >= 0; });
      if (igual(actual, esperado)) return;
      GRUPOS_FIJOS.forEach(function (g) {
        var d = root.querySelector('.action-group[data-group="' + g + '"]');
        if (d) root.appendChild(d);
      });
    } catch (e) {}
  }

  function aplicarOrden() {
    if (__aplicando) return;
    __aplicando = true;
    try {
      fijarGrupos();
      var o = getOrden();
      // 1) reubicar herramientas movidas a otra seccion/subseccion
      Object.keys(o.ubic || {}).forEach(function (id) {
        try {
          var dest = String(o.ubic[id] || '');
          var p = dest.split('|');
          if (p.length !== 2 || GRUPOS_FIJOS.indexOf(p[0]) < 0) return;
          var el = $(id);
          if (!el) return;
          var gAct = grupoDe(el), sAct = subDeBtn(el);
          if (gAct === p[0] && sAct === p[1]) return;
          var box = document.querySelector('.action-group[data-group="' + p[0] + '"] .group-btns');
          if (!box) return;
          asegurarSubLabel(p[0], p[1]);
          try { el.setAttribute('data-sub', p[1]); if (el.dataset) el.dataset.sub = p[1]; } catch (e2) {}
          // inserta tras su sub-label (antes del primer boton de esa sub)
          var lab = box.querySelector('.sub-label[data-sub="' + p[1] + '"]');
          if (lab) {
            var n = lab.nextElementSibling, ref = null;
            while (n) {
              if (n.classList && n.classList.contains('sub-label')) break;
              if (n.classList && n.classList.contains('btn') && n.id !== id && !ref) {
                var s2 = subDeBtn(n);
                if (s2 === p[1]) ref = n;
              }
              n = n.nextElementSibling;
            }
            if (ref && ref.parentNode === box) box.insertBefore(el, ref);
            else if (lab.nextSibling) box.insertBefore(el, lab.nextSibling);
            else box.appendChild(el);
          } else box.appendChild(el);
        } catch (e3) {}
      });
      // 2) ordenar subsecciones dentro de cada grupo + herramientas dentro de cada sub
      GRUPOS_FIJOS.forEach(function (g) {
        try {
          var box = document.querySelector('.action-group[data-group="' + g + '"] .group-btns');
          if (!box) return;
          // --- subs: custom primero, nuevas al final en orden DOM ---
          var domSubs = subsDe(g);
          var custom = Array.isArray(o.subs[g]) ? o.subs[g].slice() : null;
          var ordenSubs;
          if (custom && custom.length) {
            ordenSubs = custom.filter(function (s) { return domSubs.indexOf(s) >= 0; });
            domSubs.forEach(function (s) { if (ordenSubs.indexOf(s) < 0) ordenSubs.push(s); });
          } else ordenSubs = domSubs;
          // --- btns por sub: custom primero, nuevos al final ---
          var bySub = {};
          var necesita = !igual(domSubs, ordenSubs);
          ordenSubs.forEach(function (s) {
            var domBtns = botonesDe(g, s).map(function (b) { return b.id; });
            var ck = clave(g, s);
            var cb = Array.isArray(o.btns[ck]) ? o.btns[ck] : null;
            var lista;
            if (cb && cb.length) {
              lista = cb.filter(function (id) { return domBtns.indexOf(id) >= 0; });
              domBtns.forEach(function (id) { if (lista.indexOf(id) < 0) lista.push(id); });
            } else lista = domBtns;
            bySub[s] = lista;
            if (!igual(domBtns, lista)) necesita = true;
          });
          if (!necesita) return; // ya en orden: no mutar (corta el bucle del observer)
          // reconstruir: label + sus botones en orden
          ordenSubs.forEach(function (s) {
            var lab = box.querySelector('.sub-label[data-sub="' + s + '"]');
            if (lab) box.appendChild(lab);
            (bySub[s] || []).forEach(function (id) {
              var b = $(id);
              if (b) box.appendChild(b);
            });
          });
        } catch (e4) {}
      });
      try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
      try { if (typeof refreshSubLabels === 'function') refreshSubLabels(); } catch (e2) {}
    } catch (e) {} finally { __aplicando = false; }
  }

  // ---- movimientos ----
  function moverBtn(id, dir) {
    try {
      var el = $(id);
      if (!el) return;
      var g = grupoDe(el), s = subDeBtn(el);
      var lista = botonesDe(g, s).map(function (b) { return b.id; });
      var i = lista.indexOf(id);
      var j = i + dir;
      if (i < 0 || j < 0 || j >= lista.length) return;
      var t = lista[i]; lista[i] = lista[j]; lista[j] = t;
      var o = getOrden();
      o.btns[clave(g, s)] = lista;
      guardar('Orden guardado ✓');
      aplicarOrden();
      refrescarEditor();
      if (document.body.dataset.orden === '1') pintarControles();
    } catch (e) {}
  }
  function moverBtnA(id, destino) {
    try {
      var p = String(destino || '').split('|');
      if (p.length !== 2 || GRUPOS_FIJOS.indexOf(p[0]) < 0 || !p[1]) return;
      var el = $(id);
      if (!el) return;
      var g0 = grupoDe(el), s0 = subDeBtn(el);
      // saca de la lista vieja
      var o = getOrden();
      var ck0 = clave(g0, s0);
      var vieja = botonesDe(g0, s0).map(function (b) { return b.id; }).filter(function (x) { return x !== id; });
      o.btns[ck0] = vieja.length ? vieja : (o.btns[ck0] || vieja);
      // registra destino y agrega al final de la lista destino
      o.ubic[id] = destino;
      var ck1 = clave(p[0], p[1]);
      var dest = botonesDe(p[0], p[1]).map(function (b) { return b.id; }).filter(function (x) { return x !== id; });
      if (o.btns[ck1] && o.btns[ck1].length) {
        var base = o.btns[ck1].filter(function (x) { return x !== id; });
        dest.forEach(function (x) { if (base.indexOf(x) < 0) base.push(x); });
        if (base.indexOf(id) < 0) base.push(id);
        o.btns[ck1] = base;
      } else {
        if (dest.indexOf(id) < 0) dest.push(id);
        o.btns[ck1] = dest;
      }
      guardar('Herramienta movida ✓');
      aplicarOrden();
      refrescarEditor();
      if (document.body.dataset.orden === '1') pintarControles();
    } catch (e) {}
  }
  function moverSub(group, sub, dir) {
    try {
      var dom = subsDe(group);
      var o = getOrden();
      var base = (Array.isArray(o.subs[group]) && o.subs[group].length)
        ? o.subs[group].filter(function (s) { return dom.indexOf(s) >= 0; }).concat(dom.filter(function (s) { return o.subs[group].indexOf(s) < 0; }))
        : dom.slice();
      var i = base.indexOf(sub), j = i + dir;
      if (i < 0 || j < 0 || j >= base.length) return;
      var t = base[i]; base[i] = base[j]; base[j] = t;
      o.subs[group] = base;
      guardar('Orden guardado ✓');
      aplicarOrden();
      refrescarEditor();
      if (document.body.dataset.orden === '1') pintarControles();
    } catch (e) {}
  }
  function restablecer() {
    try {
      var D = data();
      if (D.config) delete D.config.orden;
      guardar('Orden restablecido ✓');
      // vuelve al orden base del nucleo y luego aplica (sin personalizado = no-op)
      try { if (window.reordenarAcciones) window.reordenarAcciones(); } catch (e) {}
      try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e2) {}
      aplicarOrden();
      refrescarEditor();
      if (document.body.dataset.orden === '1') pintarControles();
    } catch (e) {}
  }

  // NOTA: no se reasigna `reordenarAcciones` (global del nucleo; lo prohibe
  // tests/iife-globals.test.js). El orden propio se reaplica de forma
  // idempotente via MutationObserver sobre #actions + llamadas directas.

  // ---- estilos ----
  // NOTA: los controles usan clase propia `ord-btn` (NO `btn`): el nucleo
  // selecciona `#actions .group-btns .btn` para herramientas (reordenar,
  // conteos, busqueda, registro tardio). Con `btn` los rompia/desarmaba.
  function inyectarCSS() {
    try {
      if ($('ordenHerrCss')) return;
      var st = document.createElement('style');
      st.id = 'ordenHerrCss';
      st.textContent = [
        'body[data-orden="1"] #actions .group-btns .btn{outline:1px dashed var(--gold);outline-offset:1px}',
        '.ord-wrap{display:inline-flex;gap:2px;margin:2px 4px 2px 0;vertical-align:middle}',
        '.ord-sub{display:inline-flex;gap:2px;margin-left:8px;vertical-align:middle}',
        '.ord-btn{padding:2px 8px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--text);cursor:pointer;font-size:12px;line-height:1.4;width:auto}',
        '.ord-btn:hover{background:var(--card-hover)}',
        '.ord-sub .ord-btn{padding:1px 7px}',
        '#btnOrdenar.activa{background:linear-gradient(135deg,#caa64f,#a8842f);color:#14100a;font-weight:700}',
        '#ordenDialog{min-width:min(680px,94vw);max-width:720px;max-height:88vh}',
        '#ordenDialog .ord-group{border:1px solid var(--line);border-radius:10px;padding:8px;margin:8px 0}',
        '#ordenDialog .ord-row{display:flex;align-items:center;gap:6px;padding:3px 0;flex-wrap:wrap}',
        '#ordenDialog .ord-row .nm{flex:1;min-width:140px;font-size:13px}',
        '#ordenDialog .ord-row select{max-width:220px;font-size:12px}',
        '#ordenDialog .mini{padding:2px 8px;font-size:12px;width:auto}',
        '#ordenDialog .sub-h{font-weight:700;margin-top:6px;font-size:13px;color:var(--gold)}'
      ].join('\n');
      document.head.appendChild(st);
    } catch (e) {}
  }

  // ---- modo ordenar en la vista principal ----
  function limpiarControles() {
    try { document.querySelectorAll('.ord-wrap,.ord-sub').forEach(function (x) { x.remove(); }); } catch (e) {}
  }
  function pintarControles() {
    try {
      limpiarControles();
      if (document.body.dataset.orden !== '1') return;
      document.querySelectorAll('#actions .action-group').forEach(function (gr) {
        var g = gr.getAttribute('data-group');
        // controles de subseccion junto a cada label
        gr.querySelectorAll('.sub-label[data-sub]').forEach(function (lab) {
          var s = lab.getAttribute('data-sub');
          var sp = document.createElement('span');
          sp.className = 'ord-sub';
          sp.innerHTML = '<button type="button" class="ord-btn" data-m="sub-up" title="Subir sección">▲</button>' +
            '<button type="button" class="ord-btn" data-m="sub-dn" title="Bajar sección">▼</button>';
          sp.querySelector('[data-m="sub-up"]').onclick = function (e) { e.stopPropagation(); moverSub(g, s, -1); };
          sp.querySelector('[data-m="sub-dn"]').onclick = function (e) { e.stopPropagation(); moverSub(g, s, 1); };
          lab.appendChild(sp);
        });
        // controles de herramienta tras cada boton
        gr.querySelectorAll('.group-btns .btn[id]').forEach(function (b) {
          var id = b.id;
          var w = document.createElement('span');
          w.className = 'ord-wrap';
          w.innerHTML = '<button type="button" class="ord-btn" data-m="up" title="Subir">▲</button>' +
            '<button type="button" class="ord-btn" data-m="dn" title="Bajar">▼</button>' +
            '<button type="button" class="ord-btn" data-m="mv" title="Mover a otra sección…">⇄</button>';
          w.querySelector('[data-m="up"]').onclick = function (e) { e.stopPropagation(); moverBtn(id, -1); };
          w.querySelector('[data-m="dn"]').onclick = function (e) { e.stopPropagation(); moverBtn(id, 1); };
          w.querySelector('[data-m="mv"]').onclick = function (e) {
            e.stopPropagation();
            try { abrirEditor(id); } catch (e2) {}
          };
          if (b.nextSibling) b.parentNode.insertBefore(w, b.nextSibling);
          else b.parentNode.appendChild(w);
        });
      });
    } catch (e) {}
  }
  function setModo(on) {
    try {
      if (on) document.body.dataset.orden = '1';
      else delete document.body.dataset.orden;
      var b = $('btnOrdenar');
      if (b) { b.classList.toggle('activa', !!on); b.textContent = on ? '✓ Terminar orden' : '↕️ Ordenar'; }
      pintarControles();
    } catch (e) {}
  }

  function botonToolbar() {
    try {
      if ($('btnOrdenar')) return;
      var bar = document.querySelector('.actions-toolbar');
      if (!bar) return;
      var b = document.createElement('button');
      b.type = 'button'; b.id = 'btnOrdenar'; b.className = 'btn';
      b.textContent = '↕️ Ordenar';
      b.title = 'Mover herramientas y secciones (los 7 grupos quedan fijos). Se guarda solo.';
      b.onclick = function () { setModo(document.body.dataset.orden !== '1'); };
      var inp = $('actionSearch');
      if (inp && inp.parentNode === bar) bar.insertBefore(b, inp);
      else bar.insertBefore(b, bar.firstChild);
    } catch (e) {}
  }

  // ---- dialogo editor ----
  function asegurarDialogo() {
    try {
      var d = $('ordenDialog');
      if (d) return d;
      d = document.createElement('dialog');
      d.id = 'ordenDialog';
      d.innerHTML = '<form method="dialog">' +
        '<div class="dlg-actions"><h3>↕️ Orden de herramientas</h3>' +
        '<button type="button" id="ordenCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
        '<p class="muted">Los <b>7 grupos están fijos</b> 🔒. Aquí mueves <b>secciones</b> (subsecciones) dentro de cada grupo y <b>herramientas</b> dentro o entre secciones. Todo se <b>guarda solo</b>.</p>' +
        '<div class="conv-row"><button type="button" id="ordenReset" class="btn">↺ Restablecer orden original</button>' +
        '<button type="button" id="ordenModo" class="btn">✏️ Ordenar directamente en la lista</button></div>' +
        '<div id="ordenBody"></div>' +
        '<div class="dlg-actions"><button type="button" id="ordenClose" class="btn btn-accent">Guardar y cerrar</button></div>' +
        '</form>';
      document.body.appendChild(d);
      var cerrar = function () { try { d.close(); } catch (e) {} setModo(false); };
      d.querySelector('#ordenCloseTop').onclick = cerrar;
      d.querySelector('#ordenClose').onclick = cerrar;
      d.querySelector('#ordenReset').onclick = function (e) { e.preventDefault(); e.stopPropagation(); if (confirm('¿Volver al orden original?')) restablecer(); };
      d.querySelector('#ordenModo').onclick = function (e) {
        e.preventDefault(); e.stopPropagation();
        try { d.close(); } catch (e2) {}
        setModo(true);
        try { var a = $('actions'); if (a) a.scrollIntoView({ behavior: 'smooth' }); } catch (e3) {}
      };
      return d;
    } catch (e) { return null; }
  }

  function opcionesDestino(selActual) {
    try {
      var out = [];
      GRUPOS_FIJOS.forEach(function (g) {
        subsDe(g).forEach(function (s) { out.push({ v: clave(g, s), t: (GRUPO_NOMBRE[g] || g) + ' › ' + nombreSub(g, s) }); });
      });
      // destinos con botones huerfanos aunque no tengan label visible
      return out;
    } catch (e) { return []; }
  }

  function refrescarEditor(focoBtn) {
    try {
      var dlg = $('ordenDialog');
      var body = $('ordenBody');
      if (!body || !dlg || !dlg.open) return;
      var sc = 0;
      try { sc = dlg.scrollTop || 0; } catch (e0) {}
      var dests = opcionesDestino();
      var html = '';
      GRUPOS_FIJOS.forEach(function (g) {
        var subs = subsDe(g);
        html += '<div class="ord-group"><h4>' + (GRUPO_NOMBRE[g] || g) + ' <span class="muted">🔒 fijo</span></h4>';
        if (!subs.length) html += '<p class="muted">Sin secciones.</p>';
        subs.forEach(function (s) {
          var btns = botonesDe(g, s);
          html += '<div class="sub-h">▸ ' + esc(nombreSub(g, s)) +
            ' <button type="button" class="btn mini" data-sub-up="' + esc(g) + '|' + esc(s) + '" title="Subir sección">▲</button>' +
            '<button type="button" class="btn mini" data-sub-dn="' + esc(g) + '|' + esc(s) + '" title="Bajar sección">▼</button>' +
            ' <span class="muted">(' + btns.length + ')</span></div>';
          btns.forEach(function (b) {
            html += '<div class="ord-row"><span class="nm">' + esc(nombreBtn(b.id)) + '</span>' +
              '<button type="button" class="btn mini" data-up="' + esc(b.id) + '" title="Subir">▲</button>' +
              '<button type="button" class="btn mini" data-dn="' + esc(b.id) + '" title="Bajar">▼</button>' +
              '<select data-mv="' + esc(b.id) + '" title="Mover a otra sección">' +
              dests.map(function (o) {
                var sel = (o.v === clave(g, s)) ? ' selected' : '';
                return '<option value="' + esc(o.v) + '"' + sel + '>' + esc(o.t) + '</option>';
              }).join('') + '</select></div>';
          });
        });
        html += '</div>';
      });
      body.innerHTML = html;
      body.querySelectorAll('[data-up]').forEach(function (x) { x.onclick = function () { moverBtn(x.getAttribute('data-up'), -1); }; });
      body.querySelectorAll('[data-dn]').forEach(function (x) { x.onclick = function () { moverBtn(x.getAttribute('data-dn'), 1); }; });
      body.querySelectorAll('[data-mv]').forEach(function (x) {
        x.onchange = function () { moverBtnA(x.getAttribute('data-mv'), x.value); };
      });
      body.querySelectorAll('[data-sub-up]').forEach(function (x) {
        x.onclick = function () { var p = x.getAttribute('data-sub-up').split('|'); moverSub(p[0], p[1], -1); };
      });
      body.querySelectorAll('[data-sub-dn]').forEach(function (x) {
        x.onclick = function () { var p = x.getAttribute('data-sub-dn').split('|'); moverSub(p[0], p[1], 1); };
      });
      if (focoBtn) {
        try {
          var sel = body.querySelector('[data-mv="' + focoBtn + '"]');
          if (sel) { sel.focus(); sel.scrollIntoView({ block: 'center' }); }
        } catch (e) {}
      } else {
        try { dlg.scrollTop = sc; } catch (e2) {}
      }
    } catch (e) {}
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function abrirEditor(focoBtn) {
    try {
      var d = asegurarDialogo();
      refrescarEditor();
      if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) {} }
      refrescarEditor(focoBtn || null);
    } catch (e) {}
  }

  // ---- entrada en Personalizar ----
  function inyectarEnConfig() {
    try {
      var dlg = $('configDialog');
      if (!dlg || dlg.dataset.ordenOk) return;
      var grupos = dlg.querySelectorAll('.config-group');
      var ref = null;
      grupos.forEach(function (gr) {
        try {
          var h = gr.querySelector('h5');
          if (h && /Perfiles/.test(h.textContent || '')) ref = gr;
        } catch (e) {}
      });
      var box = document.createElement('div');
      box.className = 'config-group';
      box.innerHTML = '<h5>↕️ Orden de herramientas</h5>' +
        '<p class="muted">Los <b>7 grupos están fijos</b> 🔒. Mueve secciones y herramientas:</p>' +
        '<div class="conv-row"><button type="button" id="cfgOrdenBtn" class="btn">↕️ Mover secciones y herramientas</button></div>' +
        '<p class="muted">Se guarda automáticamente.</p>';
      if (ref && ref.parentNode) ref.parentNode.insertBefore(box, ref);
      else dlg.querySelector('form').appendChild(box);
      box.querySelector('#cfgOrdenBtn').onclick = function (e) {
        e.preventDefault(); e.stopPropagation();
        try { dlg.close(); } catch (e2) {}
        setTimeout(function () { abrirEditor(); }, 120);
      };
      dlg.dataset.ordenOk = '1';
    } catch (e) {}
  }

  // ---- arranque ----
  var _deb = null;
  function esNodoPropio(n) {
    try {
      if (!n || n.nodeType !== 1) return false;
      if (n.classList && (n.classList.contains('ord-wrap') || n.classList.contains('ord-sub'))) return true;
      if (n.querySelector && n.querySelector('.ord-wrap,.ord-sub')) return true;
      return false;
    } catch (e) { return false; }
  }
  function observar() {
    try {
      var root = $('actions');
      if (!root || window.__ordenObs) return;
      window.__ordenObs = true;
      var Obs = window.MutationObserver;
      if (!Obs) return;
      var ob = new Obs(function (recs) {
        try {
          if (__aplicando) return; // cambio hecho por aplicarOrden: ignorar
          var soloPropio = true;
          (recs || []).forEach(function (r) {
            try {
              var otros = [];
              Array.prototype.forEach.call(r.addedNodes || [], function (n) { if (!esNodoPropio(n)) otros.push(n); });
              Array.prototype.forEach.call(r.removedNodes || [], function (n) { if (!esNodoPropio(n)) otros.push(n); });
              if (otros.length) soloPropio = false;
            } catch (e) { soloPropio = false; }
          });
          if (soloPropio) return; // solo se movieron nuestros controles: nada que hacer
        } catch (e) {}
        clearTimeout(_deb);
        _deb = setTimeout(function () {
          try { aplicarOrden(); } catch (e) {}
          try { if (document.body.dataset.orden === '1') pintarControles(); } catch (e2) {}
        }, 600);
      });
      ob.observe(root, { childList: true, subtree: true });
    } catch (e) {}
  }

  function init() {
    try {
      inyectarCSS();
      botonToolbar();
      asegurarDialogo();
      inyectarEnConfig();
      aplicarOrden();
      observar();
      setTimeout(function () { try { aplicarOrden(); botonToolbar(); inyectarEnConfig(); if (document.body.dataset.orden === '1') pintarControles(); } catch (e) {} }, 1200);
      setTimeout(function () { try { aplicarOrden(); botonToolbar(); inyectarEnConfig(); } catch (e) {} }, 2600);
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  try {
    window.cal13orden = {
      aplicar: aplicarOrden, abrir: abrirEditor, reset: restablecer,
      moverBtn: moverBtn, moverSub: moverSub, moverA: moverBtnA, gruposFijos: GRUPOS_FIJOS.slice()
    };
  } catch (e) {}
})();
