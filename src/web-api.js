// Bridge web/localStorage — SOLO si Electron (preload.js) no definió window.api.
// En Electron window.api viene del preload (IPC a archivos). Este shim es para
// abrir index.html por http(s) o file:// sin preload: guarda en localStorage.
(function () {
  if (window.api) return;
  // Sobre versionado: {app:'cal13', v:1, schema:N, savedAt, data:{...}}.
  // v = versión del contenedor; schema = versión del esquema de DATA
  // (data-schema.js). La app sigue viendo solo el JSON de DATA.
  var isEnvelope = function (o) {
    return o && typeof o === 'object' && o.app === 'cal13' && typeof o.v === 'number' && ('data' in o);
  };
  var schemaVersion = function () {
    try {
      if (window.cal13schema && typeof window.cal13schema.SCHEMA_VERSION === 'number') {
        return window.cal13schema.SCHEMA_VERSION;
      }
    } catch (e) {}
    return 1;
  };
  var wrapData = function (json) {
    try {
      var o = JSON.parse(json);
      if (isEnvelope(o)) return json;
      return JSON.stringify({ app: 'cal13', v: 1, schema: schemaVersion(), savedAt: new Date().toISOString(), data: o });
    } catch (e) { return json; }
  };
  // Lectura estricta: un contenedor de una versión futura o un JSON corrupto
  // no se devuelven como si fueran datos válidos. El llamador debe abortar sin
  // sobrescribir el archivo original.
  var unwrapData = function (stored) {
    if (!stored) return '{}';
    var o;
    try { o = JSON.parse(stored); }
    catch (e) { throw new Error('datos-corruptos'); }
    if (isEnvelope(o)) {
      if (typeof o.schema === 'number' && o.schema > schemaVersion()) throw new Error('schema-futuro');
      return JSON.stringify(o.data === undefined ? {} : o.data);
    }
    return stored;
  };
  // Migración total a IndexedDB (v1.8): las bitácoras (grupos registrados por
  // bitacoras-respaldo-modulo vía cal13idb.registrarGrupos) viven en el store
  // propio 'bitacoras' con id 'uid:grupo' y DOBLE copia (IDB + espejo LS).
  // - partirGruposAlStore: al guardar, saca esas claves del blob (el blob se
  //   adelgaza; el store es la fuente primaria de esas claves).
  // - overlayGruposDesdeStore: al cargar, las reinyecta en DATA.notas[uid].
  // Sin grupos registrados o sin IDB: comportamiento legado (blob completo).
  // Si el store no trae un grupo, se conservan las claves del blob (sin pérdida).
  async function gruposActivos() {
    try {
      if (window.cal13idb && window.cal13idb.gruposRegistrados) {
        return await window.cal13idb.gruposRegistrados();
      }
    } catch {}
    return [];
  }
  async function partirGruposAlStore(wrapped) {
    try {
      const grupos = await gruposActivos();
      if (!grupos.length) return wrapped;
      const env = JSON.parse(wrapped);
      const data = (env && env.data) || env;
      if (!data || !data.notas) return wrapped;
      for (const uid of Object.keys(data.notas)) {
        const u = data.notas[uid];
        if (!u) continue;
        for (const g of grupos) {
          const keys = {};
          let n = 0;
          for (const k of (g.keys || [])) {
            if (u && Object.prototype.hasOwnProperty.call(u, k)) { keys[k] = u[k]; n++; }
          }
          if (!n) continue;
          const r = await window.cal13idb.bitacoraGuardar(uid + ':' + g.id, { titulo: g.id, keys });
          // Solo adelgazar el blob si la copia en el store quedó confirmada.
          // Antes se borraba aunque la escritura fallara (pérdida silenciosa).
          if (!r || !r.ok) continue;
          for (const k of Object.keys(keys)) { try { delete u[k]; } catch {} }
        }
      }
      return JSON.stringify(env.data !== undefined ? { ...env, data } : data);
    } catch { return wrapped; }
  }
  async function overlayGruposDesdeStore(blobJson) {
    try {
      const grupos = await gruposActivos();
      if (!grupos.length) return blobJson;
      const o = JSON.parse(blobJson);
      if (!o || !o.notas) return blobJson;
      for (const uid of Object.keys(o.notas)) {
        const u = o.notas[uid];
        if (!u) continue;
        for (const g of grupos) {
          try {
            const rec = await window.cal13idb.bitacoraLeer(uid + ':' + g.id);
            if (rec && rec.keys) {
              for (const k of (g.keys || [])) {
                if (rec.keys[k] !== undefined) u[k] = rec.keys[k];
              }
            }
          } catch {}
        }
      }
      return JSON.stringify(o);
    } catch { return blobJson; }
  }
  // Estado real de la última escritura, para que la UI no anuncie éxito
  // cuando solo hay una copia en memoria o cuando el fallback es degradado.
  var publicarEstado = function (estado) {
    estado = estado || { ok: false, backend: 'desconocido' };
    try { window.api.lastSaveState = estado; } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('cal13:persistencia', { detail: estado }));
    } catch (e) {}
    return !!estado.ok;
  };
  var canon = function (v) {
    if (Array.isArray(v)) return v.map(canon);
    if (v && typeof v === 'object') {
      var o = {};
      Object.keys(v).sort().forEach(function (k) { o[k] = canon(v[k]); });
      return o;
    }
    return v;
  };
  var mismoJSON = function (a, b) {
    try { return JSON.stringify(canon(a)) === JSON.stringify(canon(b)); } catch (e) { return false; }
  };
  var isHttpUrl = function (u) {
    try { var p = new URL(String(u), window.location.href).protocol; return p === 'http:' || p === 'https:'; }
    catch (e) { return false; }
  };
  var sanitizePrintHtml = function (html) {
    try {
      // Si core-sanitize ya cargó, es la vía preferida (allowlist real).
      if (typeof window !== 'undefined' && typeof window.sanitizeHTML === 'function') {
        var out = window.sanitizeHTML(String(html || ''));
        return String(out).slice(0, 500000);
      }
    } catch (e) {}
    var s = String(html || '');
    s = s.replace(/<script[\s\S]*?<\/script\s*>/gi, '').replace(/<style[\s\S]*?<\/style\s*>/gi, '').replace(/<(iframe|object|embed|link|meta|base|form|svg|math|video|audio|source|track)[\s\S]*?<\/\1\s*>/gi, '').replace(/<(iframe|object|embed|link|meta|base|form|svg|math|video|audio|source|track)(\s[^>]*)?\/?>/gi, '');
    s = s.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/\sstyle\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/(href|src|action|xlink:href)\s*=\s*("|')\s*(javascript|data:text\/html|vbscript)[^"']*\2/gi, '$1=$2#$2');
    return s.slice(0, 500000);
  };
  window.api = {
    openExternal: async (url) => { if (!isHttpUrl(url)) return false; try { window.open(url, '_blank', 'noopener,noreferrer'); return true; } catch { return false; } },
    loadData: async () => {
      // IndexedDB primero (cuota amplia, asíncrono); localStorage como fallback.
      // Un JSON corrupto o un esquema futuro se propaga como error: el
      // llamador NO debe crear datos vacíos ni sobrescribir el original.
      // Si el blob está cifrado (CAL13ENC1.), se requiere la clave en memoria.
      var crudo = null;
      var errorIdb = null;
      try {
        if (window.cal13idb) crudo = await window.cal13idb.get('cal13-data');
      } catch (e) { errorIdb = e; }
      if (crudo === null || crudo === undefined || crudo === '') {
        try { crudo = localStorage.getItem('cal13-data'); } catch (e) {}
      }
      if (!crudo) {
        if (errorIdb) throw errorIdb;
        return '{}';
      }
      try {
        if (window.cal13cifrado && window.cal13cifrado.esCifrado(crudo)) {
          var pw = (window.cal13cifrado.clave && window.cal13cifrado.clave()) || null;
          if (!pw) { var err = new Error('cifrado-requiere-clave'); throw err; }
          crudo = await window.cal13cifrado.descifrarTexto(pw, crudo);
        }
      } catch (e) {
        throw e;
      }
      const blob = unwrapData(crudo);
      return await overlayGruposDesdeStore(blob);
    },
    saveData: async (json) => {
      // Si la carga inicial falló (datos corruptos o esquema futuro), no se
      // permite sobrescribir el almacenamiento con un estado vacío/nuevo.
      if (window.cal13NoGuardar) {
        return publicarEstado({ ok: false, backend: 'bloqueado', motivo: 'carga-fallida' });
      }
      // Blob ya cifrado (vía core-storage en Electron): guardar opaco.
      try {
        if (window.cal13cifrado && window.cal13cifrado.esCifrado(json)) {
          var enc0 = String(json);
          try {
            if (window.cal13idb) {
              const r0 = await window.cal13idb.set('cal13-data', enc0);
              if (r0 && r0.ok) return publicarEstado(r0);
            }
          } catch (e0) {}
          try {
            localStorage.setItem('cal13-data', enc0);
            return publicarEstado({ ok: true, backend: 'localstorage', degradado: true });
          } catch (e1) {
            return publicarEstado({ ok: false, backend: 'memoria', temporal: true });
          }
        }
      } catch (e00) {}
      var wrapped = wrapData(json);
      var alRest = wrapped;
      try {
        // Cifrado at-rest: se parte en claro y se cifra el resultado.
        if (window.cal13cifrado && window.cal13cifrado.hayClave && window.cal13cifrado.hayClave()) {
          var pw2 = window.cal13cifrado.clave();
          var slim0 = await partirGruposAlStore(wrapped);
          alRest = await window.cal13cifrado.cifrarTexto(pw2, slim0);
          try {
            if (window.cal13idb) {
              const r = await window.cal13idb.set('cal13-data', alRest);
              if (r && r.ok) return publicarEstado({ ok: true, backend: r.backend || 'indexeddb', degradado: false, cifrado: true });
            }
          } catch (e2) {}
          try {
            localStorage.setItem('cal13-data', alRest);
            return publicarEstado({ ok: true, backend: 'localstorage', degradado: true, cifrado: true });
          } catch (e3) {
            return publicarEstado({ ok: false, backend: 'memoria', temporal: true });
          }
        }
      } catch (e4) { return publicarEstado({ ok: false, backend: 'error', motivo: 'cifrado' }); }
      try {
        if (window.cal13idb) {
          const slim = await partirGruposAlStore(wrapped);
          const r = await window.cal13idb.set('cal13-data', slim);
          if (r && r.ok) return publicarEstado(r);
          // Sin copia durable en IDB ni espejo: último intento directo en LS.
          if (r && r.temporal) {
            try {
              localStorage.setItem('cal13-data', wrapped);
              return publicarEstado({ ok: true, backend: 'localstorage', degradado: true });
            } catch (e) {
              return publicarEstado({ ok: false, backend: 'memoria', temporal: true });
            }
          }
          return publicarEstado(r);
        }
      } catch (e) {}
      try {
        localStorage.setItem('cal13-data', wrapped);
        return publicarEstado({ ok: true, backend: 'localstorage', degradado: true });
      } catch (e) {
        return publicarEstado({ ok: false, backend: 'memoria', temporal: true });
      }
    },
    // Restauración coordinada: además de escribir el blob, elimina registros
    // del store de bitácoras que no pertenecen al estado restaurado. Sin esto,
    // overlayGruposDesdeStore reinyectaba datos antiguos al volver a cargar.
    replaceData: async (json) => {
      var wrapped = wrapData(json);
      var nuevo;
      try {
        var env = JSON.parse(wrapped);
        if (env && typeof env.schema === 'number' && window.cal13schema &&
            env.schema > window.cal13schema.SCHEMA_VERSION) {
          return publicarEstado({ ok: false, backend: 'error', motivo: 'schema-futuro' });
        }
        nuevo = (env && env.data !== undefined) ? env.data : env;
      } catch (e) {
        return publicarEstado({ ok: false, backend: 'error', motivo: 'json' });
      }
      var anterior = null;
      try { anterior = await window.api.loadData(); }
      catch (e) {
        // No se puede verificar el estado anterior: no se toca el store.
        return publicarEstado({ ok: false, backend: 'error', motivo: (e && e.message) || 'lectura-previa' });
      }
      var restaurarAnterior = async function () {
        if (anterior) { try { await window.api.saveData(anterior); } catch (e) {} }
      };
      // 1) Borrar grupos del store que no existen en el respaldo (por usuario
      //    ausente o porque ninguna de sus claves está en el estado nuevo).
      try {
        if (window.cal13idb && window.cal13idb.bitacorasListar) {
          const lista = await window.cal13idb.bitacorasListar();
          const notas = (nuevo && nuevo.notas) || {};
          for (const item of lista) {
            const rec = await window.cal13idb.bitacoraLeer(item.id);
            const uid = String(item.id).split(':')[0];
            const claves = (rec && rec.keys) || {};
            const presente = notas[uid] && Object.keys(claves).some(function (k) {
              return Object.prototype.hasOwnProperty.call(notas[uid], k);
            });
            if (!presente) {
              const r = await window.cal13idb.bitacoraBorrar(item.id);
              if (!r || !r.ok) throw new Error('borrar:' + item.id);
            }
          }
        }
      } catch (e) {
        await restaurarAnterior();
        return publicarEstado({ ok: false, backend: 'error', motivo: 'restauracion-limpieza' });
      }
      // 2) Escribir el estado nuevo y verificar lectura de vuelta.
      var ok = await window.api.saveData(json);
      if (!ok) { await restaurarAnterior(); return false; }
      try {
        const leido = JSON.parse(await window.api.loadData() || '{}');
        if (!mismoJSON(leido, nuevo)) {
          await restaurarAnterior();
          return publicarEstado({ ok: false, backend: 'error', motivo: 'verificacion' });
        }
      } catch (e) {
        await restaurarAnterior();
        return publicarEstado({ ok: false, backend: 'error', motivo: 'verificacion' });
      }
      return publicarEstado({
        ok: true,
        backend: (window.cal13idb && window.cal13idb.backend && window.cal13idb.backend() === 'indexeddb') ? 'indexeddb' : 'localstorage',
        restaurado: true
      });
    },
    dataPath: async () => 'Guardado en este navegador (almacenamiento local)',
    exportPDF: async (html) => {
      const w = window.open('', '_blank', 'noopener,noreferrer');
      if (!w) return null;
      try { w.opener = null; } catch {}
      w.document.open();
      // Sin document.write con string crudo: se parsea via template y se
      // inserta ya sanitizado para reducir tabnabbing/XSS.
      var doc = w.document;
      try {
        var tpl = doc.createElement('template');
        tpl.innerHTML = sanitizePrintHtml(html);
        doc.open();
        doc.write('<!DOCTYPE html><html><head><title>Calendario 13 Lunas</title></head><body></body></html>');
        doc.close();
        while (doc.body.firstChild) doc.body.removeChild(doc.body.firstChild);
        while (tpl.content.firstChild) doc.body.appendChild(tpl.content.firstChild);
      } catch (e) {
        try { w.document.open(); w.document.write(sanitizePrintHtml(html)); w.document.close(); } catch {}
      }
      setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 900);
      return 'impresion';
    },
    createShortcut: async () => {
      const url = window.location.href.split('#')[0];
      const icoName = 'Calendario 13 Lunas.ico';
      // IconFile relativo: Windows lo resuelve junto al .url → muestra el
      // logo nuevo en el escritorio si ambos archivos van a la misma carpeta.
      const content = '[InternetShortcut]\r\nURL=' + url + '\r\nIconFile=' + icoName + '\r\nIconIndex=0\r\n';
      const blob = new Blob([content], { type: 'application/octet-stream' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Calendario 13 Lunas.url';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      // .ico con el logo nuevo (icon-512.png → 256px PNG dentro de ICO).
      try {
        const img = await new Promise((res, rej) => {
          const im = new Image();
          im.onload = () => res(im);
          im.onerror = rej;
          im.src = 'icon-512.png';
        });
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        c.getContext('2d').drawImage(img, 0, 0, 256, 256);
        const pngBlob = await new Promise((res) => c.toBlob(res, 'image/png'));
        const pngBuf = new Uint8Array(await pngBlob.arrayBuffer());
        const head = new DataView(new ArrayBuffer(22));
        head.setUint16(0, 0, true);
        head.setUint16(2, 1, true);
        head.setUint16(4, 1, true);
        head.setUint8(6, 0); // 0 = 256px
        head.setUint8(7, 0);
        head.setUint8(8, 0);
        head.setUint8(9, 0);
        head.setUint16(10, 1, true);
        head.setUint16(12, 32, true);
        head.setUint32(14, pngBuf.length, true);
        head.setUint32(18, 22, true);
        const ico = new Blob([head.buffer, pngBuf], { type: 'image/x-icon' });
        const b = document.createElement('a');
        b.href = URL.createObjectURL(ico);
        b.download = icoName;
        document.body.appendChild(b);
        b.click();
        b.remove();
        setTimeout(() => URL.revokeObjectURL(b.href), 2000);
      } catch {}
      return { ok: true, path: 'Descargados .url + .ico (déjalos juntos y arrastra el .url al escritorio)' };
    },
    backupSave: async (json, fileName) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      if (!fileName) {
        try {
          const d = new Date();
          const p = (n) => String(n).padStart(2, '0');
          fileName = 'respaldo-calendario-13-lunas-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + '.json';
        } catch (e) { fileName = 'respaldo-calendario-13-lunas.json'; }
      }
      a.download = fileName;
      a.click();
      return 'descargado';
    },
    backupOpen: () => new Promise(res => {
      const i = document.createElement('input');
      i.type = 'file';
      i.accept = '.json,application/json';
      i.onchange = () => {
        const f = i.files[0];
        if (!f) return res(null);
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.readAsText(f);
      };
      i.click();
    }),
    // .ics (compromisos): mismo patrón que backup, con tipo text/calendar.
    // Lo usa ics-modulo.js; en Electron (preload) va con diálogo nativo.
    icsSave: async (text, fileName) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
      a.download = (fileName || 'compromisos-13-lunas.ics');
      a.click();
      return 'descargado';
    },
    icsOpen: () => new Promise(res => {
      const i = document.createElement('input');
      i.type = 'file';
      i.accept = '.ics,text/calendar';
      i.onchange = () => {
        const f = i.files[0];
        if (!f) return res(null);
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.readAsText(f);
      };
      i.click();
    }),
    imageSave: async (dataUrl, suggestedName) => {
      const fileName = String(suggestedName || 'calendario-13-lunas.png').replace(/[\\/:*?"<>|]/g, '-').slice(0, 120) || 'calendario-13-lunas.png';
      try {
        const s = String(dataUrl || '');
        if (!s.startsWith('data:image/')) return null;
        const blob = await (await fetch(dataUrl)).blob();
        if (!blob || !blob.type.startsWith('image/')) return null;
        const file = new File([blob], fileName, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: fileName.replace(/\.png$/i, '') });
          return 'compartido';
        }
      } catch {}
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fileName;
      a.click();
      return 'descargado';
    },
    loadDonate: async () => {
      try {
        const r = await fetch('donate.json', { cache: 'no-store' });
        if (r && r.ok) return await r.text();
      } catch {}
      return null;
    }
  };
})();
