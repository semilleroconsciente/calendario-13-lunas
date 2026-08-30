const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
  await w.loadURL('data:text/html,<canvas id="c" width="512" height="512"></canvas>');
  const draw = `(() => {
    const c = document.getElementById('c'), x = c.getContext('2d');
    const g = x.createRadialGradient(256, 200, 40, 256, 256, 260);
    g.addColorStop(0, '#232f66'); g.addColorStop(1, '#0b1026');
    x.fillStyle = g; x.beginPath(); x.arc(256, 256, 248, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#e8c56a'; x.lineWidth = 10; x.stroke();
    x.fillStyle = '#ffffff';
    [[124,116,6],[392,88,5],[420,240,6],[104,300,4],[352,380,5]].forEach(([sx,sy,r])=>{x.beginPath();x.arc(sx,sy,r,0,Math.PI*2);x.fill();});
    x.fillStyle = '#f0d488'; x.beginPath(); x.arc(236, 224, 112, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#131a3a'; x.beginPath(); x.arc(292, 192, 100, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#e8c56a'; x.font = 'bold 80px Georgia, serif'; x.textAlign = 'center';
    x.fillText('13 LUNAS', 256, 452);
    return c.toDataURL('image/png').split(',')[1];
  })()`;
  const b64 = await w.webContents.executeJavaScript(draw);
  const p512 = path.join(__dirname, '..', 'web', 'icon-512.png');
  fs.writeFileSync(p512, Buffer.from(b64, 'base64'));
  const b64b = await w.webContents.executeJavaScript(`(() => {
    const c = document.getElementById('c');
    const s = document.createElement('canvas'); s.width = 192; s.height = 192;
    s.getContext('2d').drawImage(c, 0, 0, 192, 192);
    return s.toDataURL('image/png').split(',')[1];
  })()`);
  fs.writeFileSync(path.join(__dirname, '..', 'web', 'icon-192.png'), Buffer.from(b64b, 'base64'));
  console.log('iconos generados');
  app.quit();
});
