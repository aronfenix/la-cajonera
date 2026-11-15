import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const err = [];
let p = await b.newPage({ viewport: { width: 1280, height: 800 } }); p.on('pageerror', (e) => err.push(e.message));
await p.goto('http://localhost:8765/juegos/_hoja-escenas.html'); await p.waitForTimeout(600); await p.screenshot({ path: '/tmp/te-escenas.png', fullPage: true });
// portada
await p.goto('http://localhost:8765/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('cajon-historia:/juegos/sin-aliento/', '1'); });
await p.goto('http://localhost:8765/juegos/sin-aliento/'); await p.waitForTimeout(4500); await p.screenshot({ path: '/tmp/te-portada.png' });
// a media lectura, sin poner ningún punto
await p.evaluate(() => localStorage.setItem('cajon-progreso:/juegos/sin-aliento/', JSON.stringify({ progreso: 5, nivel: 2 })));
await p.goto('http://localhost:8765/juegos/sin-aliento/?sinportada'); await p.waitForSelector('.reto'); await p.waitForTimeout(900);
await p.locator('.t-pal').nth(3).click(); await p.locator('.t-leer').click(); await p.waitForTimeout(6500); await p.screenshot({ path: '/tmp/te-lee.png' });
await p.close();
// móvil
p = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })).newPage(); p.on('pageerror', (e) => err.push(e.message));
for (const L of [6, 8]) {
  await p.goto('http://localhost:8765/'); await p.evaluate((L) => { localStorage.clear(); localStorage.setItem('cajon-progreso:/juegos/sin-aliento/', JSON.stringify({ progreso: 5, nivel: L })); }, L);
  await p.goto('http://localhost:8765/juegos/sin-aliento/?sinportada'); await p.waitForSelector('.reto'); await p.waitForTimeout(1500);
  await p.locator('.t-pal').nth(1).tap(); await p.waitForTimeout(500); await p.screenshot({ path: `/tmp/te-m${L}.png` });
}
console.log(err.join(' | ') || 'sin errores'); await b.close();
