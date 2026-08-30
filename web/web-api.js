window.api = {
  loadData: async () => {
    try { return localStorage.getItem('cal13-data') || '{}'; } catch { return '{}'; }
  },
  saveData: async (json) => {
    try { localStorage.setItem('cal13-data', json); return true; } catch { return false; }
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
  backupSave: async (json) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = 'respaldo-calendario-13-lunas.json';
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
  imageSave: async (dataUrl) => {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'calendario-13-lunas.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Calendario de las 13 Lunas' });
        return 'compartido';
      }
    } catch {}
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'calendario-13-lunas.png';
    a.click();
    return 'descargado';
  }
};
