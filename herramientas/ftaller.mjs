import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const err = [];
p.on('pageerror', (e) => err.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/404/.test(m.text()) && err.push(m.text()));
const base = process.argv[2] || 'http://localhost:8765';
await p.goto(base + '/juegos/puntua-tu-texto/'); await p.waitForTimeout(800);
await p.fill('#titulo', 'Robinson, capítulo 3');
await p.fill('#texto', 'Robinson pasó la primera noche subido a un árbol. Tenía miedo de las fieras, del frío y de quedarse dormido. Al amanecer bajó y miró el mar.\nEl barco seguía allí, encallado en las rocas. Decidió nadar hasta él antes de que la marea se lo llevara. ¿Quedaría algo de comida? No lo sabía, pero tenía que intentarlo.');
await p.check('input[value=pca]'); await p.click('#prepara'); await p.waitForTimeout(200);
await p.screenshot({ path: '/tmp/taller-editor.png' });
const url = await p.inputValue('#enlace'); console.log('enlace:', url.length, 'caracteres ·', await p.textContent('#resumen'));
await p.goto(url + ''); await p.reload(); await p.waitForTimeout(5500);
console.log('portada:', await p.locator('.portada, .portada-capa').count(), await p.locator('h1, .portada-titulo').first().innerText().catch(() => '?'));
await p.goto(url.replace('#', '?sinportada&prueba#')); await p.reload(); await p.waitForSelector('.reto', { timeout: 8000 }); await p.waitForTimeout(600);
let rondas = 0;
for (; rondas < 6; rondas++) {
  if (!(await p.locator('.t-folio').isVisible().catch(() => false))) break;
  const sol = await p.evaluate(() => window.__sol());
  for (let j = 0; j < sol.length; j++) if (sol[j]) { await p.locator(`.t-sello[data-s="${sol[j]}"]`).click(); await p.locator('.t-folio .t-pal').nth(j).click(); }
  if (rondas === 0) await p.screenshot({ path: '/tmp/taller-juego.png' });
  await p.locator('.acciones .tecla', { hasText: 'Comprobar' }).click(); await p.waitForTimeout(300);
  console.log('ronda', rondas + 1, '·', (await p.locator('.t-texto').innerText()).slice(0, 70).replace(/\n/g, ' ⏎ '), '·', (await p.locator('.correccion .texto p').first().innerText()).slice(0, 50));
  const sig = p.locator('.correccion .tecla').first(); if (!(await sig.count())) break; await sig.click(); await p.waitForTimeout(900);
}
console.log('después:', (await p.locator('body').innerText()).slice(0, 120).replace(/\n/g, ' '));
console.log(err.join(' | ') || 'sin errores'); await b.close();
