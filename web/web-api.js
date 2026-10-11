// Bridge web/localStorage — SOLO si Electron (preload.js) no definió window.api.
// En Electron window.api viene del preload (IPC a archivos). Este shim es para
// abrir index.html por http(s) o file:// sin preload: guarda en localStorage.
(function () {
  if (window.api) return;
  // Sobre versionado: {app:'cal13', v:1, savedAt, data:{...}}.
  // La app (renderer) sigue viendo solo el JSON de DATA: este borde envuelve
  // al guardar y desenvuelve al cargar. Legado (sin sobre) pasa tal cual.
  // Misma convencion en main.js (data:load/data:save) para Electron.
  var isEnvelope = function (o) {
    return o && typeof o === 'object' && o.app === 'cal13' && typeof o.v === 'number' && ('data' in o);
  };
  var wrapData = function (json) {
    try {
      var o = JSON.parse(json);
      if (isEnvelope(o)) return json;
      return JSON.stringify({ app: 'cal13', v: 1, savedAt: new Date().toISOString(), data: o });
    } catch (e) { return json; }
  };
  var unwrapData = function (stored) {
    if (!stored) return '{}';
    try {
      var o = JSON.parse(stored);
      if (isEnvelope(o)) return JSON.stringify(o.data === undefined ? {} : o.data);
      return stored;
    } catch (e) { return stored; }
  };
  window.api = {
    openExternal: async (url) => { try { window.open(url, '_blank', 'noopener,noreferrer'); return true; } catch { window.location.href = url; return false; } },
    loadData: async () => {
      // IndexedDB primero (cuota amplia, asíncrono); localStorage como fallback.
      try {
        if (window.cal13idb) return unwrapData(await window.cal13idb.get('cal13-data') || '{}');
      } catch {}
      try { return unwrapData(localStorage.getItem('cal13-data') || '{}'); } catch { return '{}'; }
    },
    saveData: async (json) => {
      var wrapped = wrapData(json);
      try {
        if (window.cal13idb) { await window.cal13idb.set('cal13-data', wrapped); return true; }
      } catch {}
      try { localStorage.setItem('cal13-data', wrapped); return true; } catch { return false; }
    },
    dataPath: async () => 'Guardado en este navegador (almacenamiento local)',
    exportPDF: async (html) => {
      const w = window.open('', '_blank');
      if (!w) return null;
      w.document.open();
      w.document.write(html);
      w.document.close();
      setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 900);
      return 'impresion';
    },
    createShortcut: async () => {
      const url = window.location.href.split('#')[0];
      const content = "[InternetShortcut]\r\nURL=" + url + "\r\n";
      const blob = new Blob([content], { type: "application/octet-stream" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "Calendario 13 Lunas.url";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      return { ok: true, path: "Descargado: Calendario 13 Lunas.url (arrástralo al escritorio)" };
    },
    backupSave: async (json, fileName) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = (fileName || 'respaldo-calendario-13-lunas.json');
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
    imageSave: async (dataUrl, suggestedName) => {
      const fileName = suggestedName || 'calendario-13-lunas.png';
      try {
        const blob = await (await fetch(dataUrl)).blob();
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
