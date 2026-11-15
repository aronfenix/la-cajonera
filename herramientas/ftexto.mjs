// Prueba «Sin aliento»: cada nivel a lo bruto (hasta la corrección) y, con ?prueba, la solución exacta (debe dar 3 estrellas).
// node ftexto.mjs [--movil] [--capturas]   (servidor de public/ en :8765)
import { chromium } from 'playwright';
const movil = process.argv.includes('--movil'), W = movil ? [390, 844] : [1280, 800];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: W[0], height: W[1] }, hasTouch: movil, reducedMotion: 'reduce' });
const p = await ctx.newPage(); const errores = [];
p.on('pageerror', (e) => errores.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/404/.test(m.text()) && errores.push(m.text()));
const abre = async (L) => {
  await p.goto('http://localhost:8765/'); await p.evaluate((L) => { localStorage.clear(); localStorage.setItem('cajon-progreso:/juegos/sin-aliento/', JSON.stringify({ progreso: 5, nivel: L })); }, L);
  await p.goto('http://localhost:8765/juegos/sin-aliento/?sinportada&prueba'); await p.waitForSelector('.reto', { timeout: 8000 }); await p.waitForTimeout(500);
};
const corr = () => p.locator('.correccion:not([hidden])').count();
const comp = () => p.locator('.acciones .tecla', { hasText: /Comprobar|Así está bien/ }).click();
for (let L = 0; L < 10; L++) {
  // 1) a lo bruto
  await abre(L);
  if (process.argv.includes('--capturas')) await p.screenshot({ path: `/tmp/t-${L}${movil ? 'm' : ''}.png` });
  const sentido = await p.locator('.t-sentido').count();
  if (!sentido) { await p.locator('.t-pal').nth(1).click(); await p.locator('.acciones .tecla', { hasText: 'Leer' }).click(); await p.waitForFunction(() => /Leer/.test(document.querySelector('.t-leer').textContent), null, { timeout: 30000 }); }
  for (let k = 0; k < 4 && !(await corr()); k++) { await comp(); await p.waitForTimeout(150); }
  const bruto = await corr() ? (await p.locator('.correccion .texto p').first().innerText()).slice(0, 110).replace(/\n/g, ' ') : 'SIN CORRECCIÓN';
  if (process.argv.includes('--capturas')) await p.screenshot({ path: `/tmp/t-${L}${movil ? 'm' : ''}-fin.png` });
  // 2) la solución exacta
  await abre(L);
  let bien = 'n/a';
  if (!(await p.locator('.t-sentido').count())) {
    const sol = await p.evaluate(() => window.__sol());
    const act = await p.evaluate(() => [...document.querySelectorAll('.t-folio .t-pal')].map((b) => (b.querySelector('.t-salto, .x') , b.lastChild.textContent)));
    for (let j = 0; j < sol.length; j++) {
      if (sol[j] == null) continue;
      const quiero = sol[j], tengo = act[j] ?? '';
      const salto = await p.evaluate((j) => !document.querySelectorAll('.t-salto')[j].hidden, j);
      const ahora = tengo === '.' && salto ? '¶' : tengo;
      if (quiero === ahora) continue;
      await p.locator(`.t-sello[data-s="${quiero || 'x'}"]`).click(); await p.locator('.t-folio .t-pal').nth(j).click();
    }
    await comp(); await p.waitForTimeout(200);
    bien = (await p.locator('.correccion .estrella.on, .correccion .estrellas .on').count()) + '★ ' + ((await corr()) ? (await p.locator('.correccion .texto p').first().innerText()).slice(0, 70) : 'SIN CORRECCIÓN');
  }
  console.log(L, '| bruto:', bruto, '| exacto:', bien);
}
console.log(errores.length ? 'ERRORES: ' + [...new Set(errores)].join(' | ') : 'sin errores');
await b.close();
