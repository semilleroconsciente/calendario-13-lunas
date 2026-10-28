// lighthouse-ci.cjs — corre Lighthouse contra web/server.js y exige umbral.
// Uso: node scripts/lighthouse-ci.cjs [--preset=mobile|desktop] [--min=0.7]
// Descarga Chrome vía npx la primera vez (lento); en CI se cachea con npm.
// El gate duro de CI es check:perf (rápido, sin deps); esto es la validación
// de render real (LCP, TBT) con umbral documentado.
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Pin exacto: evita descarga-ejecución flotante (Shai-Hulud / A08 integrity failure).
// Para subir versión: cambiar aquí + package-lock + CI SHA-pin.
const LIGHTHOUSE_PIN = 'lighthouse@12.8.2';

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = (k, d) => {
  const m = args.find((a) => a.startsWith(k + '='));
  return m ? m.slice(k.length + 1) : d;
};
const PRESET = opt('--preset', 'mobile');
const MIN = Number(opt('--min', PRESET === 'mobile' ? '0.65' : '0.85'));
const EXIGIR = args.includes('--exigir'); // en CI con Chrome: falla bajo umbral
const PORT = 8137;
const OUT = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cal13-lh-')), 'lh.json');

function buscarChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const cands = process.platform === 'win32'
    ? [
      process.env['PROGRAMFILES'] + '\\Google\\Chrome\\Application\\chrome.exe',
      process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    ]
    : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  for (const c of cands) {
    try { if (c && fs.existsSync(c)) return c; } catch {}
  }
  return null;
}

async function esperaServer(srv) {
  for (let i = 0; i < 100; i++) {
    const txt = await new Promise((res) => {
      require('http').get(`http://localhost:${PORT}/index.html`, (r) => {
        r.resume();
        r.on('end', () => res('ok'));
      }).on('error', () => res(''));
    });
    if (txt === 'ok') return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('server.js no respondió');
}

async function main() {
  const chrome = buscarChrome();
  if (!chrome) {
    console.log('  ~ sin Chrome instalado: lighthouse omitido (el gate duro es check:perf).');
    console.log('    En CI (ubuntu con google-chrome) corre con --exigir.');
    if (!EXIGIR) return;
    throw new Error('sin Chrome y se pidió --exigir');
  }
  const srv = spawn(process.execPath, [path.join(ROOT, 'web', 'server.js')], { stdio: 'pipe' });
  try {
    await esperaServer(srv);
    const lhArgs = [
      LIGHTHOUSE_PIN, `http://localhost:${PORT}/`,
      `--preset=${PRESET}`, '--only-categories=performance',
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
      '--output=json', `--output-path=${OUT}`, '--quiet',
    ];
    // Validación estricta: OUT/PORT son internos (no argv crudo) y sin shell.
    if (!/^[\w./\\:-]+$/.test(OUT) || !Number.isInteger(PORT)) throw new Error('ruta/puerto inválido');
    console.log('  i lighthouse (' + PRESET + '), esto tarda 1-3 min la primera vez…');
    const env = { ...process.env, CHROME_PATH: chrome };
    const code = await new Promise((res) => {
      // Sin shell:true: argv separado, sin interpolación. npx --yes con pin exacto.
      const p = execFile(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--yes', ...lhArgs], { stdio: 'inherit', env });
      p.on('close', res);
      p.on('error', (e) => { console.log('  x spawn: ' + e.message); res(127); });
    });
    if (code !== 0) throw new Error('lighthouse salió con código ' + code);
    const rep = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    const perf = rep.categories.performance.score;
    const lcp = rep.audits['largest-contentful-paint'].displayValue;
    const tbt = rep.audits['total-blocking-time'].displayValue;
    console.log(`  = performance: ${perf} (umbral ${MIN}) | LCP ${lcp} | TBT ${tbt}`);
    if (perf < MIN) {
      console.log(`  x performance ${perf} bajo el umbral ${MIN}`);
      process.exit(1);
    }
    console.log('OK: lighthouse sobre el umbral.');
  } finally {
    srv.kill();
  }
}
main().catch((e) => { console.log('  x lighthouse-ci: ' + e.message); process.exit(1); });
