// Prueba «La isla del recreo»: juega cada nivel bien y mal en tablet (apaisada y vertical, táctil) y en móvil.
// node fisla.mjs [--rapido]   (servidor de public/ en :8765: bash srv.sh)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/home/claude/.npm-global/lib/node_modules/playwright'); }
const SLUG = 'la-isla-del-recreo', NIV = 6;
const PANTALLAS = process.argv.includes('--rapido') ? [[1280, 800]] : [[1280, 800], [800, 1280], [390, 844]];
const b = await pw.chromium.launch();
let fallos = 0;
for (const [w, h] of PANTALLAS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: w < 500, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
  const desborda = () => p.evaluate(() => { const m = document.querySelector('.mesa-juego'); return document.documentElement.scrollWidth > innerWidth + 1 || (m && m.scrollWidth > m.clientWidth + 4); });
  for (let L = 0; L < NIV; L++) {
    for (const modo of ['bien', 'mal']) {
      await p.goto('http://localhost:8765/');
      await p.evaluate(([s, L]) => { localStorage.clear(); localStorage.setItem('cajon-progreso:/juegos/' + s + '/', JSON.stringify({ progreso: 5, nivel: L })); }, [SLUG, L]);
      await p.goto(`http://localhost:8765/juegos/${SLUG}/?sinportada&prueba`);
      await p.waitForSelector('.ll-tablero, .ll-vigila', { timeout: 8000 });
      await p.waitForTimeout(300);
      if (modo === 'bien') await p.screenshot({ path: `/tmp/ll-${L}-${w}.png` });
      if (await p.locator('.ll-vigila').count()) {
        for (let k = 0; k < 6 && !(await p.locator('.correccion:not([hidden])').count()); k++) {
          const sol = await p.evaluate(() => window.__sol());
          const op = modo === 'bien' ? sol : sol === 'tc' ? 'rey' : 'tc';
          await p.locator(`.ll-op[data-op="${op}"]`).click();
          await p.waitForFunction(() => document.querySelector('.ll-op:not(:disabled)') || document.querySelector('.correccion:not([hidden])'), null, { timeout: 6000 });
        }
      } else {
        const sol = await p.evaluate(() => window.__sol());
        for (const k of ['normas', 'cumplir', 'juzgar']) {
          const destino = modo === 'bien' ? sol[k] : 0;
          await p.locator(`.ll-llave[data-llave="${k}"]`).click();
          await p.locator(`.ll-pj[data-i="${destino}"]`).click({ position: { x: 30, y: 30 } });
        }
        if (modo === 'bien') await p.screenshot({ path: `/tmp/ll-${L}-${w}-b.png` });
        await p.locator('.acciones .tecla').click();
        await p.waitForTimeout(200);
        if (await p.locator('.aviso.mal').count()) await p.locator('.acciones .tecla').click();
        await p.waitForSelector('.correccion:not([hidden])', { timeout: 15000 }).catch(() => {});
      }
      const ok = await p.locator('.correccion:not([hidden])').count();
      const est = ok ? await p.locator('.correccion .estrellas .si').count() : -1;
      const msg = ok ? (await p.locator('.correccion .texto p').first().innerText()).replace(/\n/g, ' ') : 'SIN CORRECCIÓN';
      const d = await desborda();
      if (modo === 'bien') await p.screenshot({ path: `/tmp/ll-${L}-${w}-fin.png` });
      else await p.screenshot({ path: `/tmp/ll-${L}-${w}-mal.png` });
      const esperado = modo === 'bien' ? est === 3 : est >= 0 && est < 3;
      if (!esperado || d) fallos++;
      console.log(`${w}x${h} nivel ${L + 1} ${modo}: ${est} estrellas${d ? ' DESBORDA' : ''}${esperado ? '' : ' ¡INESPERADO!'} · ${msg.slice(0, 170)}`);
    }
  }
  console.log(errores.length ? `${w}: ERRORES: ` + [...new Set(errores)].join(' | ') : `${w}: sin errores de consola`);
  fallos += errores.length;
  await ctx.close();
}
await b.close();
console.log(fallos ? `FALLOS: ${fallos}` : 'TODO BIEN');
process.exit(fallos ? 1 : 0);
