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
      nodeIntegration: false
    }
  });
  // Muestra en cuanto hay algo que pintar (no espera a los 50+ scripts diferidos).
  win.once('ready-to-show', () => { try { win.show(); } catch {} });
  win.setMenuBarVisibility(false);
  // Abrir links externos en navegador por defecto
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => {
    if (url !== win.webContents.getURL()) { e.preventDefault(); shell.openExternal(url); }
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
      autoUpdater.on('error', () => {});
      setTimeout(() => { try { autoUpdater.checkForUpdatesAndNotify(); } catch {} }, 20000);
    }
  } catch {}
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
  try {
    const str = String(json);
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

ipcMain.handle('export:pdf', async (_e, html) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Exportar calendario a PDF',
    defaultPath: path.join(app.getPath('documents'), 'calendario-13-lunas.pdf'),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (canceled || !filePath) return null;
  const pdfWin = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
  await pdfWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
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

ipcMain.handle('backup:save', async (_e, json, fileName) => {
  const safe = String(fileName || 'respaldo-calendario-13-lunas.json').replace(/[\\/:*?"<>|]/g, '-').slice(0, 120) || 'respaldo-calendario-13-lunas.json';
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Guardar respaldo de notas',
    defaultPath: path.join(app.getPath('documents'), safe),
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (canceled || !filePath) return null;
  fs.writeFileSync(filePath, json, 'utf8');
  return filePath;
});

ipcMain.handle('backup:open', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Restaurar respaldo',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (canceled || !filePaths[0]) return null;
  return fs.readFileSync(filePaths[0], 'utf8');
});

ipcMain.handle('image:save', async (_e, dataUrl, suggestedName) => {
  const safeName = suggestedName || 'calendario-13-lunas.png';
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Guardar imagen del día',
    defaultPath: path.join(app.getPath('pictures'), safeName),
    filters: [{ name: 'PNG', extensions: ['png'] }]
  });
  if (canceled || !filePath) return null;
  fs.writeFileSync(filePath, Buffer.from(dataUrl.split(',')[1], 'base64'));
  return filePath;
});

ipcMain.handle('shortcut:create', async (_e, pngB64) => {
  try {
    const appDir = app.getAppPath();
    const desktop = app.getPath('desktop');
    const lnk = path.join(desktop, 'Calendario 13 Lunas.lnk');
    let iconPath = process.execPath;
    if (pngB64) {
      const png = Buffer.from(pngB64, 'base64');
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
