// Test rapido de librerias vendorizadas (qrcode-generator + jsQR)
const path = require('path');
const ROOT = path.join(__dirname, '..');

// 1) qrcode-generator (en browser es global `var qrcode`; en Node la evaluamos sin exports/define)
const fs = require('fs');
const srcQR = fs.readFileSync(path.join(ROOT, 'qrcode-lib.js'), 'utf8');
const qrcodeFn = new Function('module', 'exports', 'define', srcQR + '\n;return qrcode;')(undefined, undefined, undefined);
if (!qrcodeFn) { console.log('FALLO: global qrcode no definido'); process.exit(1); }
const q = qrcodeFn(0, 'M');
q.addData('PRUEBA CAL13 123');
q.make();
console.log('qrcode-generator OK — modulos:', q.getModuleCount());
// createDataURL disponible?
if (typeof q.createDataURL === 'function') {
  const url = q.createDataURL(4, 8);
  console.log('createDataURL OK — largo:', url.length);
}

// 2) jsQR (UMD: module.exports en Node)
const jsQR = require(path.join(ROOT, 'jsqr-lib.js'));
if (typeof jsQR !== 'function') { console.log('FALLO: jsQR no es funcion'); process.exit(1); }
// decodificar el QR recien creado: render a matriz RGBA manual
const n = q.getModuleCount();
const size = n;
const data = new Uint8ClampedArray(size * size * 4);
for (let r = 0; r < n; r++) {
  for (let c = 0; c < n; c++) {
    const v = q.isDark(r, c) ? 0 : 255;
    const o = (r * size + c) * 4;
    data[o] = data[o + 1] = data[o + 2] = v; data[o + 3] = 255;
  }
}
const res = jsQR(data, size, size);
if (res && res.data === 'PRUEBA CAL13 123') {
  console.log('jsQR OK — round-trip QR: "' + res.data + '"');
} else {
  console.log('FALLO jsQR round-trip:', res ? res.data : '(sin deteccion — puede ser normal con QR denso sin quiet zone)');
  // reintento con quiet zone de 4 modulos (mas realista)
  const qz = 4, s2 = n + qz * 2;
  const d2 = new Uint8ClampedArray(s2 * s2 * 4).fill(255);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (q.isDark(r, c)) { const o = ((r + qz) * s2 + (c + qz)) * 4; d2[o] = d2[o+1] = d2[o+2] = 0; }
  }
  const res2 = jsQR(d2, s2, s2);
  if (res2 && res2.data === 'PRUEBA CAL13 123') console.log('jsQR OK con quiet zone — "' + res2.data + '"');
  else { console.log('FALLO definitivo jsQR'); process.exit(1); }
}
console.log('TODO OK');
