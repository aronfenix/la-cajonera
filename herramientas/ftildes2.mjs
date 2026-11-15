import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const err = [];
let p = await b.newPage({ viewport: { width: 960, height: 420 } }); p.on('pageerror', (e) => err.push(e.message));
await p.goto('http://localhost:8765/juegos/_hoja-escenas.html'); await p.waitForTimeout(600); await p.screenshot({ path: '/tmp/tl-escenas.png', fullPage: true }); await p.close();
p = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })).newPage(); p.on('pageerror', (e) => err.push(e.message));
for (const L of [0, 3]) {
  await p.goto('http://localhost:8765/'); await p.evaluate((L) => { localStorage.clear(); localStorage.setItem('cajon-progreso:/juegos/suena-raro/', JSON.stringify({ progreso: 5, nivel: L })); }, L);
  await p.goto('http://localhost:8765/juegos/suena-raro/?sinportada'); await p.waitForSelector('.reto'); await p.waitForTimeout(1500);
  if (L) { await p.locator('.tl-pal:not([aria-disabled="true"])').nth(1).tap(); await p.waitForTimeout(400); }
  await p.screenshot({ path: `/tmp/tl-m${L}.png`, fullPage: true });
}
console.log(err.join(' | ') || 'sin errores'); await b.close();
