// Prueba «176» (motor investidura): cada nivel, bien y mal, en tablet horizontal y vertical (táctil) y en móvil.
// node flos-176.mjs [--rapido] [--movimiento] [--noche=mayoria|sin|nada]   (sirve public/ en :8781, o PUERTO=…)
// Capturas en /tmp/l176/: n<nivel>-<vista>-a.png (reto) y -b.png (tras votar).
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const PUERTO = process.env.PUERTO || 8781;
const URL0 = `http://localhost:${PUERTO}`;
const SLUG = 'los-176', NIVELES = 8;
const VISTAS = { h: { width: 1280, height: 800, hasTouch: true }, v: { width: 800, height: 1280, hasTouch: true }, m: { width: 390, height: 844, hasTouch: true } };
const rapido = process.argv.includes('--rapido');
const noche = (process.argv.find((a) => a.startsWith('--noche=')) || '--noche=nada').split('=')[1];
const NOCHES = {
  sin: { provincia: { nombre: 'Juguete', escanos: 7 }, hemiciclo: { parque: 141, aparcamiento: 128, pista: 81 } },
  mayoria: { provincia: { nombre: 'Juguete', escanos: 7 }, hemiciclo: { parque: 190, aparcamiento: 100, pista: 60 } },
};
const b = await chromium.launch();
const errores = [];
let fallos = 0, bloqueos = 0;
for (const [vista, vp] of Object.entries(VISTAS)) {
  if (rapido && vista !== 'h') continue;
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.hasTouch, isMobile: vista === 'm', reducedMotion: process.argv.includes('--movimiento') ? 'no-preference' : 'reduce' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push(`[${vista}] ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && errores.push(`[${vista}] ${m.text()}`));
  for (let L = 0; L < NIVELES; L++) {
    for (const bien of [true, false]) {
      await p.goto(URL0 + '/');
      await p.evaluate(([s, L, n]) => { localStorage.clear(); localStorage.setItem('cajon-progreso:/juegos/' + s + '/', JSON.stringify({ progreso: 5, nivel: L })); if (n) localStorage.setItem('cajon-noche-electoral', JSON.stringify({ ...n, fecha: Date.now() })); }, [SLUG, L, NOCHES[noche]]);
      await p.goto(`${URL0}/juegos/${SLUG}/?sinportada&prueba`);
      await p.waitForSelector('.inv', { timeout: 8000 }).catch(() => errores.push(`[${vista}] nivel ${L}: no aparece el tablero`));
      await p.waitForTimeout(500);
      const ancho = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (ancho > 1) errores.push(`[${vista}] nivel ${L}: desborde horizontal de ${ancho}px`);
      if (bien) await p.screenshot({ path: `/tmp/l176/n${L}-${vista}-a.png` });
      const sol = await p.evaluate(() => window.__sol?.());
      const toca = async (sel) => { const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded().catch(() => {}); await (vp.hasTouch ? l.tap({ timeout: 3000 }) : l.click({ timeout: 3000 })); };
      try {
        if (sol.modo === 'votacion') {
          const r = bien ? sol.r : ['primera', 'segunda', 'no'].find((x) => x !== sol.r);
          await toca(`.inv-op[data-r="${r}"]`);
          await toca('.acciones .tecla.primaria');
        } else if (sol.modo === 'apoyos') {
          if (bien) for (const [id, v] of Object.entries(sol.votos)) if (v !== 'no' && await p.locator(`.inv-opcion[data-p="${id}"][data-v="${v}"]`).count()) await toca(`.inv-opcion[data-p="${id}"][data-v="${v}"]`);
          await toca('.acciones .tecla.primaria');
          await toca(`.inv-pred[data-r="${bien ? sol.r : 'primera'}"]`);
        } else {
          if (sol.elige) await toca(`.inv-proponer[data-id="${bien ? sol.cand : await p.evaluate(() => [...document.querySelectorAll('.inv-partido')].sort((a, b) => +b.querySelector('.inv-esc b').textContent - +a.querySelector('.inv-esc b').textContent)[0].dataset.p)}"]`);
          if (bien && !sol.elige) {
            // si lo cedes todo, tus diputados no te votan: el juego no te deja ir a votar
            const todas = await p.locator('.inv-peticion:not(:disabled)').evaluateAll((bs) => bs.map((x) => x.dataset.id));
            for (const id of todas) await toca(`.inv-peticion[data-id="${id}"]`);
            if (await p.locator('.inv-partido.candidato.roto').count()) {
              await toca('.acciones .tecla.primaria');
              if (await p.locator('.inv-predice').count()) errores.push(`[${vista}] nivel ${L}: deja votar sin el sí de tu partido`);
              else bloqueos++;
            }
            for (const id of todas) await toca(`.inv-peticion[data-id="${id}"]`);
          }
          if (bien) for (const id of sol.acepta) await toca(`.inv-peticion[data-id="${id}"]`);
          if (bien && vista === 'h') await p.screenshot({ path: `/tmp/l176/n${L}-${vista}-pacto.png` });
          await toca('.acciones .tecla.primaria');
          if (bien && vista === 'h') await p.screenshot({ path: `/tmp/l176/n${L}-${vista}-predice.png` });
          await toca(`.inv-pred[data-r="${bien ? sol.r : 'primera'}"]`);
        }
        await p.waitForSelector('.correccion:not([hidden])', { timeout: 8000 });
      } catch (e) { errores.push(`[${vista}] nivel ${L} ${bien ? 'bien' : 'mal'}: ${e.message.split('\n')[0]}`); }
      await p.waitForTimeout(300);
      const est = await p.locator('.correccion .estrellas').getAttribute('aria-label').catch(() => '?');
      const txt = (await p.locator('.correccion .texto p').first().innerText().catch(() => 'SIN CORRECCIÓN')).replace(/\n/g, ' ');
      const ancho2 = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (ancho2 > 1) errores.push(`[${vista}] nivel ${L} tras votar: desborde horizontal de ${ancho2}px`);
      const esperado = bien ? /^3 /.test(est) : /^[01] /.test(est);
      if (!esperado) { fallos++; errores.push(`[${vista}] nivel ${L} ${bien ? 'bien' : 'mal'}: estrellas ${est}`); }
      if (bien) await p.screenshot({ path: `/tmp/l176/n${L}-${vista}-b.png`, fullPage: false });
      console.log(vista, L, sol?.modo, bien ? 'bien' : 'mal ', '·', est, '·', txt.slice(0, 150));
    }
  }
  await ctx.close();
}
console.log('bloqueos comprobados (tu partido no te vota):', bloqueos);
console.log(errores.length ? 'ERRORES:\n' + [...new Set(errores)].join('\n') : 'sin errores');
await b.close();
process.exit(errores.length ? 1 : 0);
