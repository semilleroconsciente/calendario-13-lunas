// captura-screenshots.cjs — screenshots REALES del manifest (mejora PWA).
// Usa Electron offscreen (sin display): arranca web/server.js, captura la
// app booteada en móvil 540×720 y desktop 1280×720, y guarda PNG en
// screenshots/. Luego actualiza manifest.json (src+sizes) a mano o con
// --fix-manifest. Manual: no corre en CI (requiere Electron).
// Uso: node_modules/.bin/electron scripts/manual/captura-screenshots.cjs [--fix-manifest]
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const SHOTS = path.join(ROOT, 'screenshots');
const FIX_MANIFEST = process.argv.includes('--fix-manifest');

try { app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'cal13-shots-'))); } catch (e) {}
app.commandLine.appendSwitch('disable-gpu');

async function captura(url, w, h, dest) {
  const win = new BrowserWindow({ show: false, width: w, height: h, webPreferences: { offscreen: true } });
  await win.loadURL(url);
  await new Promise((r) => setTimeout(r, 10000)); // boot + diferidos
  const img = await win.webContents.capturePage();
  // Recorta/escala exacta al viewport pedido.
  const png = (img.getSize().width === w && img.getSize().height === h)
    ? img.toPNG()
    : img.resize({ width: w, height: h }).toPNG();
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.writeFileSync(dest, png);
  win.close();
  return fs.statSync(dest).size;
}

async function main() {
  await app.whenReady();
  const srv = spawn(process.execPath, [path.join(ROOT, 'web', 'server.js')], { stdio: 'pipe' });
  await new Promise((r) => setTimeout(r, 1500));
  try {
    const m = await captura('http://localhost:8137/index.html', 540, 720,
      path.join(SHOTS, 'movil-540x720.png'));
    console.log(`  + screenshots/movil-540x720.png (${Math.round(m / 1024)} KB)`);
    const d = await captura('http://localhost:8137/index.html', 1280, 720,
      path.join(SHOTS, 'desktop-1280x720.png'));
    console.log(`  + screenshots/desktop-1280x720.png (${Math.round(d / 1024)} KB)`);
    if (FIX_MANIFEST) {
      const mp = path.join(ROOT, 'manifest.json');
      const man = JSON.parse(fs.readFileSync(mp, 'utf8'));
      man.screenshots = [
        { src: 'screenshots/movil-540x720.png', sizes: '540x720', type: 'image/png', label: 'Calendario 13 Lunas en el teléfono — vista de luna' },
        { src: 'screenshots/desktop-1280x720.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide', label: 'Mari Küla Küyen en escritorio — calendario y bitácora' },
      ];
      fs.writeFileSync(mp, JSON.stringify(man, null, 2) + '\n', 'utf8');
      console.log('  + manifest.json screenshots actualizados.');
    } else {
      console.log('  (re-ejecuta con --fix-manifest para apuntar manifest.json a estos PNG)');
    }
  } finally {
    srv.kill();
  }
  app.exit(0);
}

main().catch((e) => { console.error('SHOTS ERROR', e); app.exit(2); });
