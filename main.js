const { app, BrowserWindow, ipcMain, dialog } = require('electron');
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
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0b1026',
    title: 'Calendario de las 13 Lunas · Mari Küla Küyen',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.setMenuBarVisibility(false);
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

const dataFile = () => path.join(app.getPath('userData'), 'calendario-data.json');

ipcMain.handle('data:load', async () => {
  try {
    return fs.readFileSync(dataFile(), 'utf8');
  } catch {
    return '{}';
  }
});

ipcMain.handle('data:save', async (_e, json) => {
  try {
    fs.writeFileSync(dataFile(), json, 'utf8');
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

ipcMain.handle('backup:save', async (_e, json) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Guardar respaldo de notas',
    defaultPath: path.join(app.getPath('documents'), 'respaldo-calendario-13-lunas.json'),
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

ipcMain.handle('image:save', async (_e, dataUrl) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Guardar imagen del día',
    defaultPath: path.join(app.getPath('pictures'), 'calendario-13-lunas.png'),
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
    const r = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps], { windowsHide: true });
    if (r.status !== 0 || !fs.existsSync(lnk)) {
      return { ok: false, error: (r.stderr || '').toString().slice(0, 300) || 'No se pudo crear el acceso directo' };
    }
    return { ok: true, path: lnk };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});
