import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const errores = [];
for (const [nivel, ancho, alto] of [[0, 1280, 860], [1, 1280, 860], [2, 820, 1100], [3, 1280, 860], [6, 390, 800]]) {
  const p = await b.newPage({ viewport: { width: ancho, height: alto } });
  p.on('pageerror', (e) => errores.push(nivel + ': ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errores.push(nivel + ' consola: ' + m.text()));
  await p.goto('http://localhost:8765/juegos/la-maqueta/');
  await p.evaluate((n) => localStorage.setItem('cajon-progreso:/juegos/la-maqueta/', JSON.stringify({ progreso: 5, nivel: n })), nivel);
  await p.goto('http://localhost:8765/juegos/la-maqueta/?sinportada');
  await p.waitForSelector('.vs-visor', { timeout: 15000 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `/tmp/vs-${nivel}-a.png` });
  // girar arrastrando
  const v = await p.$('.vs-visor'); const r = await v.boundingBox();
  await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down();
  await p.mouse.move(r.x + r.width / 2 - 250, r.y + r.height / 2 + 40, { steps: 10 }); await p.mouse.up();
  await p.waitForTimeout(400);
  // tocar el primer punto visible que esté en pantalla
  const ok = await p.evaluate(() => { const bs = [...document.querySelectorAll('.vs-punto:not([hidden])')]; const vr = document.querySelector('.vs-visor').getBoundingClientRect();
    const b = bs.find((x) => { const q = x.getBoundingClientRect(); return q.left > vr.left && q.right < vr.right && q.top > vr.top && q.bottom < vr.bottom; }); if (!b) return 'ninguno en pantalla'; b.click(); return b.getBoundingClientRect().left|0; });
  await p.waitForTimeout(600);
  const g = await p.$('.vs-grupo'); if (g) { await g.click(); await p.waitForTimeout(500); }
  await p.screenshot({ path: `/tmp/vs-${nivel}-b.png` });
  console.log(nivel, ok, await p.evaluate(() => document.querySelector('.aviso')?.textContent));
  await p.close();
}
console.log(errores.length ? errores.join('\n') : 'sin errores');
await b.close();
