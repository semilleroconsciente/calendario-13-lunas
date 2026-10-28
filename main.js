// Calendario de las 13 Lunas · Mari Küla Küyen — Copyright (C) 2026 Semillero Consciente.
// CÓDIGO bajo GNU GPLv3 o posterior (ver COPYING). Sin garantía.
// SPDX-License-Identifier: GPL-3.0-or-later
const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

let win;

function pngToIco(pngBuf) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = 0;
  entry[1] = 0;
  entry[2] = 0;
  entry[3] = 0;
  entry[4] = 1;
  entry[5] = 32;
  entry.writeUInt32LE(pngBuf.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, pngBuf]);
}

const q = s => s.replace(/'/g, "''");

function createWindow() {
  win = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 380,
    minHeight: 640,
    backgroundColor: '#0b1026',
    show: false,
    title: 'Calendario de las 13 Lunas · Mari Küla Küyen',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      enableWebSQL: false
    }
  });
  // Muestra en cuanto hay algo que pintar (no espera a los 50+ scripts diferidos).
  win.once('ready-to-show', () => { try { win.show(); } catch {} });
  win.setMenuBarVisibility(false);
  // Abrir links externos en navegador por defecto (solo http/https)
  win.webContents.setWindowOpenHandler(({ url }) => { if (!isHttpUrl(url)) return { action: 'deny' }; try { shell.openExternal(url); } catch {} return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => {
    if (url !== win.webContents.getURL()) { e.preventDefault(); if (isHttpUrl(url)) { try { shell.openExternal(url); } catch {} } }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  // Ventana primero: en PC con caché grande, clearStorageData demoraba
  // segundos con pantalla vacía. Ahora abre de inmediato y la limpieza
  // (versiones con SW sobre file:// que mostraban "Sin conexión") va en
  // segundo plano. La app de escritorio es 100% local y no usa SW.
  // (No toca calendario-data.json)
  createWindow();
  try {
    const p = session.defaultSession.clearStorageData({ storages: ['serviceworkers', 'cachestorage'] });
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch {}
  // Auto-update (solo instalador NSIS empaquetado, no portable ni dev):
  // electron-updater no soporta portable; sin feed publicado es no-op
  // silencioso. Publicar un Release en GitHub + `publish` en package.json
  // lo activa (la PWA ya avisa vía SW en web).
  try {
    if (app.isPackaged && !process.env.PORTABLE_EXECUTABLE_DIR) {
      const { autoUpdater } = require('electron-updater');
      autoUpdater.autoDownload = false;
      try { autoUpdater.allowDowngrade = false; } catch {}
      try { autoUpdater.autoInstallOnAppQuit = false; } catch {}
      autoUpdater.on('update-available', () => {
        try { autoUpdater.downloadUpdate(); } catch {}
      });
      autoUpdater.on('update-downloaded', () => {
        try {
          dialog.showMessageBox(win, {
            type: 'info',
            buttons: ['Reiniciar y actualizar', 'Después'],
            defaultId: 0,
            message: 'Hay una versión nueva del Calendario 13 Lunas.',
            detail: 'Se instalará al reiniciar la app.'
          }).then((r) => { try { if (r.response === 0) autoUpdater.quitAndInstall(); } catch {} });
        } catch {}
      });
      autoUpdater.on('error', (err) => { try { console.warn('[updater]', String((err && err.message) || err).slice(0, 300)); } catch {} });
      setTimeout(() => { try { autoUpdater.checkForUpdatesAndNotify(); } catch {} }, 20000);
    }
  } catch {}
  // Nota: allowDowngrade=false y autoInstallOnAppQuit=false se fijan si la
  // versión de electron-updater los soporta (defensa contra rollback).
});
app.on('window-all-closed', () => app.quit());

const dataFile = () => path.join(app.getPath('userData'), 'calendario-data.json');

function isEnvelope(o) {
  return o && typeof o === 'object' && o.app === 'cal13' && typeof o.v === 'number' && ('data' in o);
}

ipcMain.handle('data:load', async () => {
  // Desenvuelve el sobre versionado (ver web-api.js); legado pasa tal cual.
  try {
    const raw = fs.readFileSync(dataFile(), 'utf8');
    try {
      const o = JSON.parse(raw);
      if (isEnvelope(o)) return JSON.stringify(o.data === undefined ? {} : o.data);
    } catch {}
    return raw;
  } catch {
    return '{}';
  }
});

ipcMain.handle('data:save', async (_e, json) => {
  // Escritura atomica: tmp + rename, conservando una copia .bak del ultimo
  // guardado bueno. Si el JSON es un sobre versionado (ver web-api.js),
  // se valida antes de tocar el archivo estable.
  // Límite 15 MB: evita DoS por renderer comprometido.
  try {
    const str = String(json);
    if (str.length > 15 * 1024 * 1024) return false;
    try {
      const o = JSON.parse(str);
      if (o && typeof o === 'object' && o.app === 'cal13' && !('data' in o)) return false;
    } catch {}
    const file = dataFile();
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, str, 'utf8');
    try {
      if (fs.existsSync(file)) fs.copyFileSync(file, file + '.bak');
    } catch {}
    fs.renameSync(tmp, file);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('data:path', async () => dataFile());

ipcMain.handle('donate:load', async () => {
  try {
    return fs.readFileSync(path.join(__dirname, 'donate.json'), 'utf8');
  } catch {
    try {
      return fs.readFileSync(path.join(app.getAppPath(), 'donate.json'), 'utf8');
    } catch {
      return null;
    }
  }
});

function isHttpUrl(u) {
  try {
    const p = new URL(String(u)).protocol;
    return p === 'http:' || p === 'https:';
  } catch {
    return false;
  }
}

ipcMain.handle('openExternal', async (_e, url) => {
  // Lista blanca: solo http(s). Bloquea file:, javascript:, data:, etc.
  if (!isHttpUrl(url)) return false;
  try { await shell.openExternal(url); return true; } catch { return false; }
});

function sanitizePdfHtml(html) {
  // Sanea el HTML antes de cargarlo en la ventana oculta de impresión.
  // Defensa en profundidad (notas de usuario pueden contener XSS):
  // elimina script/style/iframe/object/embed + svg/math (vectores onbegin/onload),
  // handlers on*, style con expression/url, javascript:/data:text/html.
  // No es render fiel al 100%, es impresión segura.
  let s = String(html || '');
  s = s.replace(/<script[\s\S]*?<\/script\s*>/gi, '').replace(/<style[\s\S]*?<\/style\s*>/gi, '');
  s = s.replace(/<(iframe|object|embed|link|meta|base|form|svg|math|video|audio|source|track)[\s\S]*?<\/\1\s*>/gi, '').replace(/<(iframe|object|embed|link|meta|base|form|svg|math|video|audio|source|track)(\s[^>]*)?\/?>/gi, '');
  s = s.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/\sstyle\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  s = s.replace(/(href|src|action|xlink:href)\s*=\s*("|')\s*(javascript|data:text\/html|vbscript)[^"']*\2/gi, '$1=$2#$2');
  // Límite de tamaño: evita DoS en printToPDF.
  if (s.length > 500000) s = s.slice(0, 500000);
  return s;
}

ipcMain.handle('export:pdf', async (_e, html) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Exportar calendario a PDF',
    defaultPath: path.join(app.getPath('documents'), 'calendario-13-lunas.pdf'),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (canceled || !filePath) return null;
  if (typeof esRutaPermitida === 'function' && !esRutaPermitida(filePath)) return null;
  const pdfWin = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
      // Nota: no existe `javascript:false`; JS se bloquea con CSP del data: URL + sandbox.
    }
  });
  // La ventana de impresión nunca navega fuera: deniega todo.
  try {
    pdfWin.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    pdfWin.webContents.on('will-navigate', (e) => e.preventDefault());
  } catch {}
  const cspPdf = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; script-src 'none';">`;
  await pdfWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(cspPdf + sanitizePdfHtml(html)));
  await new Promise(r => setTimeout(r, 600));
  const pdf = await pdfWin.webContents.printToPDF({
    landscape: false,
    printBackground: true,
    pageSize: 'Letter',
    margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 }
  });
  fs.writeFileSync(filePath, pdf);
  pdfWin.destroy();
  return filePath;
});

function defaultBackupName() {
  try {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return 'respaldo-calendario-13-lunas-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + '.json';
  } catch { return 'respaldo-calendario-13-lunas.json'; }
}
ipcMain.handle('backup:save', async (_e, json, fileName) => {
  const str = String(json == null ? '' : json);
  if (str.length > 15 * 1024 * 1024) return null; // límite anti-DoS
  const safe = String(fileName || defaultBackupName()).replace(/[\\/:*?"<>|]/g, '-').slice(0, 120) || defaultBackupName();
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Guardar respaldo de notas',
    defaultPath: path.join(app.getPath('documents'), safe),
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (canceled || !filePath) return null;
  if (!esRutaPermitida(filePath)) return null;
  fs.writeFileSync(filePath, str, 'utf8');
  return filePath;
});

ipcMain.handle('backup:open', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Restaurar respaldo',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (canceled || !filePaths[0]) return null;
  try {
    const st = fs.statSync(filePaths[0]);
    if (st.size > 15 * 1024 * 1024) return null;
  } catch { return null; }
  return fs.readFileSync(filePaths[0], 'utf8');
});

// .ics (compromisos de ics-modulo.js): diálogo nativo con filtro de calendario.
ipcMain.handle('ics:save', async (_e, text, fileName) => {
  const str = String(text == null ? '' : text);
  if (str.length > 5 * 1024 * 1024) return null;
  const safe = String(fileName || 'compromisos-13-lunas.ics').replace(/[\\/:*?"<>|]/g, '-').slice(0, 120) || 'compromisos-13-lunas.ics';
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Exportar compromisos (.ics)',
    defaultPath: path.join(app.getPath('documents'), safe),
    filters: [{ name: 'Calendario', extensions: ['ics'] }]
  });
  if (canceled || !filePath) return null;
  if (!esRutaPermitida(filePath)) return null;
  fs.writeFileSync(filePath, str, 'utf8');
  return filePath;
});

ipcMain.handle('ics:open', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Importar compromisos (.ics)',
    filters: [{ name: 'Calendario', extensions: ['ics'] }],
    properties: ['openFile']
  });
  if (canceled || !filePaths[0]) return null;
  try {
    const st = fs.statSync(filePaths[0]);
    if (st.size > 5 * 1024 * 1024) return null;
  } catch { return null; }
  return fs.readFileSync(filePaths[0], 'utf8');
});

function esRutaPermitida(filePath) {
  // Post-diálogo: el usuario eligió, pero el renderer no debe sacarnos de
  // carpetas de usuario (bloquea \\?\ , system32, recursos de la app).
  try {
    const norm = path.resolve(String(filePath));
    const bases = [app.getPath('documents'), app.getPath('pictures'), app.getPath('desktop'), app.getPath('downloads'), app.getPath('userData')].map((b) => { try { return path.resolve(b); } catch { return ''; } }).filter(Boolean);
    if (bases.some((b) => norm === b || norm.startsWith(b + path.sep))) return true;
    // Fallback: permite si el diálogo devolvió algo dentro del home del usuario.
    try { const home = path.resolve(app.getPath('home')); if (norm.startsWith(home + path.sep)) return true; } catch {}
    return false;
  } catch { return false; }
}

ipcMain.handle('image:save', async (_e, dataUrl, suggestedName) => {
  const safeName = String(suggestedName || 'calendario-13-lunas.png').replace(/[\\/:*?"<>|]/g, '-').slice(0, 120) || 'calendario-13-lunas.png';
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Guardar imagen del día',
    defaultPath: path.join(app.getPath('pictures'), safeName),
    filters: [{ name: 'PNG', extensions: ['png'] }]
  });
  if (canceled || !filePath) return null;
  if (!esRutaPermitida(filePath)) return null;
  try {
    const s = String(dataUrl || '');
    if (!s.startsWith('data:image/png;base64,')) return null;
    if (s.length > 12 * 1024 * 1024) return null; // ~9 MB binario
    const b64 = s.split(',')[1];
    // Valida TODO el base64 (antes solo 100 chars) + largo múltiplo de 4.
    if (!b64 || b64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) return null;
    const buf = Buffer.from(b64, 'base64');
    // Magic bytes PNG: 89 50 4E 47 0D 0A 1A 0A.
    if (buf.length < 8 || buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return null;
    fs.writeFileSync(filePath, buf);
  } catch { return null; }
  return filePath;
});

ipcMain.handle('shortcut:create', async (_e, pngB64) => {
  try {
    const appDir = app.getAppPath();
    const desktop = app.getPath('desktop');
    const lnk = path.join(desktop, 'Calendario 13 Lunas.lnk');
    let iconPath = process.execPath;
    // El icon.ico empaquetado ya trae el logo nuevo (luna dorada 13 Lunas):
    // se prefiere al PNG del renderer (versiones viejas dibujaban el logo
    // anterior en canvas y lo sobrescribirían aquí).
    const bundledIco = path.join(appDir, 'icon.ico');
    if (fs.existsSync(bundledIco)) {
      iconPath = bundledIco;
    } else if (pngB64) {
      const b64 = String(pngB64);
      if (b64.length > 2 * 1024 * 1024) throw new Error('icono demasiado grande');
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) throw new Error('icono inválido');
      const png = Buffer.from(b64, 'base64');
      if (png.length > 1500000 || png[0] !== 0x89 || png[1] !== 0x50) throw new Error('icono inválido');
      iconPath = path.join(appDir, 'icon.ico');
      fs.writeFileSync(iconPath, pngToIco(png));
    }
    const ps = [
      `$s=(New-Object -ComObject WScript.Shell).CreateShortcut('${q(lnk)}')`,
      `$s.TargetPath='${q(process.execPath)}'`,
      `$s.Arguments='"${q(appDir)}"'`,
      `$s.WorkingDirectory='${q(appDir)}'`,
      `$s.IconLocation='${q(iconPath)},0'`,
      `$s.Description='Calendario de las 13 Lunas - Mari Kula Kuyen'`,
      '$s.Save()'
    ].join('; ');
    // Sin interpolacion en la linea de comandos: el script viaja en Base64
    // (UTF-16LE, -EncodedCommand), asi ninguna ruta puede romper el quoting.
    const encoded = Buffer.from(ps, 'utf16le').toString('base64');
    const r = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded], { windowsHide: true });
    if (r.status !== 0 || !fs.existsSync(lnk)) {
      return { ok: false, error: (r.stderr || '').toString().slice(0, 300) || 'No se pudo crear el acceso directo' };
    }
    return { ok: true, path: lnk };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});
