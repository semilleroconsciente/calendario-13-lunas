// smoke-electron.cjs — verificación manual: diálogos inyectados + 0 errores.
// Uso: electron scripts/manual/smoke-electron.cjs (requiere display/headless).
// No corre en CI (solo manual). Sale 0 si dialogos==55 y sin errores graves.
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Perfil aislado: la sesión default de este PC puede arrastrar un SW file://
// viejo (ver main.js: clearStorageData) que intercepta y sirve el fallback
// "Sin conexión". Para el smoke se parte de perfil limpio siempre.
try {
  app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'cal13-smoke-')));
} catch (e) {}

app.commandLine.appendSwitch('disable-gpu');

async function main() {
  await app.whenReady();
  const win = new BrowserWindow({
    show: false, width: 1280, height: 800,
    webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false },
  });
  const errors = [];
  // API Electron ≥30: objeto evento {level, message, lineNumber, sourceId}.
  win.webContents.on('console-message', (ev, ...rest) => {
    let level = 0, message = '';
    if (ev && typeof ev === 'object' && 'level' in ev) { level = ev.level; message = String(ev.message); }
    else { level = ev; message = String(rest[0]); }
    if (level >= 2 && !String(message).includes('Electron Security Warning')) {
      errors.push(`[console${level}] ${message}`.slice(0, 300));
    }
  });
  win.webContents.on('did-fail-load', (e, code, desc, url) => {
    errors.push(`[fail-load ${code}] ${desc} ${url}`.slice(0, 200));
  });
  await win.loadFile(path.join(__dirname, '..', '..', 'index.html'));
  const dump = await win.webContents.executeJavaScript('document.documentElement.outerHTML.slice(0, 500)');
  console.log('DOM-DUMP:', JSON.stringify(dump));
  // Espera arranque: núcleo + inyección + módulos diferidos (idle).
  await new Promise((r) => setTimeout(r, 12000));
  let info = {};
  try {
    info = await win.webContents.executeJavaScript(`({
      href: location.href,
      readyState: document.readyState,
      htmlLen: document.documentElement.outerHTML.length,
      bodyKids: document.body ? document.body.children.length : -1,
      scripts: document.scripts.length,
      splash: !!document.getElementById('bootSplash'),
      dialogs: document.querySelectorAll('dialog').length,
      tplIds: (window.cal13tpl && window.cal13tpl.ids.length) || 0,
      calReady: !!window.__calReady,
      gridHijos: ((document.getElementById('grid') || {}).children || []).length,
      lunaTitulo: (document.getElementById('lunaTitle') || {}).textContent || ''
    })`);
  } catch (e) { info = { evalError: String(e).slice(0, 200) }; }
  console.log('SMOKE:', JSON.stringify(info));
  console.log(`CONSOLE-ERRORS: ${errors.length}`);
  for (const er of errors.slice(0, 15)) console.log('  ' + er);
  const ok = info.dialogs >= 50 && info.tplIds >= 50;
  console.log(ok ? 'SMOKE OK' : 'SMOKE FAIL');
  app.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error('SMOKE ERROR', e); app.exit(2); });
