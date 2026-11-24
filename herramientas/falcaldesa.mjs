// Prueba «Alcaldesa por un día»: juega cada nivel bien y mal en tablet (apaisada y vertical, táctil) y en móvil.
// node falcaldesa.mjs [--rapido]   (servidor de public/ en :8765: bash srv.sh)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/home/claude/.npm-global/lib/node_modules/playwright'); }
const SLUG = 'alcaldesa-por-un-dia', NIV = 6;
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
      await p.waitForSelector('.al-peticion', { timeout: 8000 });
      await p.waitForTimeout(300);
      if (modo === 'bien') await p.screenshot({ path: `/tmp/al-${L}-${w}.png` });
      let pasos = 0, mal = 0;
      while (pasos++ < 40 && !(await p.locator('.correccion:not([hidden])').count())) {
        const sol = await p.evaluate(() => window.__sol?.());
        if (!sol) { await p.waitForTimeout(150); continue; }
        await p.waitForFunction(() => !document.querySelector('.al-sello'), null, { timeout: 4000 }).catch(() => {});
        let accion = sol;
        if (modo === 'mal' && mal < 2) {
          const otras = await p.$$eval('.al-accion:not(:disabled)', (bs, s) => bs.map((x) => x.dataset.accion).filter((a) => a !== s), sol);
          if (otras.length) { accion = otras[0]; mal++; }
        }
        await p.waitForFunction(() => document.querySelector('.al-accion:not(:disabled)'), null, { timeout: 4000 }).catch(() => {});
        try { await p.locator(`.al-accion[data-accion="${accion}"]`).click({ timeout: 3000 }); }
        catch (e) { console.log('  no se pudo tocar', accion, 'sol', sol, await p.evaluate(() => [...document.querySelectorAll('.al-accion')].map((b) => b.dataset.accion + (b.disabled ? '(off)' : '')).join(' ') + ' | ' + document.querySelector('.al-peticion')?.innerText.replace(/\n/g, ' '))); fallos++; break; }
        if (modo === 'bien' && pasos === 2) await p.screenshot({ path: `/tmp/al-${L}-${w}-b.png` });
        await p.waitForTimeout(250);
      }
      const ok = await p.locator('.correccion:not([hidden])').count();
      const est = ok ? await p.locator('.correccion .estrellas .si').count() : -1;
      const msg = ok ? (await p.locator('.correccion .texto p').first().innerText()).replace(/\n/g, ' ') : 'SIN CORRECCIÓN';
      const d = await desborda();
      if (modo === 'bien') await p.screenshot({ path: `/tmp/al-${L}-${w}-fin.png`, fullPage: false });
      const esperado = modo === 'bien' ? est === 3 : est >= 0 && est < 3;
      if (!esperado || d) fallos++;
      console.log(`${w}x${h} nivel ${L + 1} ${modo}: ${est} estrellas${d ? ' DESBORDA' : ''}${esperado ? '' : ' ¡INESPERADO!'} · ${msg.slice(0, 150)}`);
    }
  }
  console.log(errores.length ? `${w}: ERRORES: ` + [...new Set(errores)].join(' | ') : `${w}: sin errores de consola`);
  fallos += errores.length;
  await ctx.close();
}
await b.close();
console.log(fallos ? `FALLOS: ${fallos}` : 'TODO BIEN');
process.exit(fallos ? 1 : 0);
