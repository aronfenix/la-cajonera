// Prueba «La Constitución del cajón» (y, con otro slug, «La ley del cargador»): cada nivel, bien y mal,
// en tablet apaisada y vertical (táctil) y en móvil. Cero errores de consola y nada de desborde horizontal.
// Uso: node fconstitucion.mjs [slug] [--rapido]     (sirve public/ en :8765 con srv.sh)
// Capturas en /tmp/cn/<slug>-<vista>-<nivel>-{reto,fin}.png
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const NIVELES = { 'la-constitucion-del-cajon': 8, 'la-ley-del-cargador': 8 };
const slug = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'la-constitucion-del-cajon';
const rapido = process.argv.includes('--rapido');
const VISTAS = rapido ? [['tablet', 1280, 800, true]] : [['tablet', 1280, 800, true], ['vertical', 800, 1280, true], ['movil', 390, 844, true]];
const SAL = '/tmp/cn'; mkdirSync(SAL, { recursive: true });
const b = await chromium.launch().catch(() => chromium.launch({ executablePath: '/usr/bin/google-chrome' }));
const errores = [];
let fallos = 0;
for (const [vista, w, h, tactil] of VISTAS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: tactil, isMobile: w < 500, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push(`${vista}: ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && errores.push(`${vista}: ${m.text()}`));
  for (let L = 0; L < NIVELES[slug]; L++) {
    for (const modo of ['bien', 'mal']) {
      await p.goto('http://localhost:8765/');
      await p.evaluate(([s, L]) => { localStorage.clear(); localStorage.setItem('cajon-progreso:/juegos/' + s + '/', JSON.stringify({ progreso: 5, nivel: L })); }, [slug, L]);
      await p.goto(`http://localhost:8765/juegos/${slug}/?sinportada&prueba`);
      await p.waitForSelector('.reto:not(:empty)', { timeout: 8000 }).catch(() => errores.push(`${vista} ${L}: sin reto`));
      await p.waitForTimeout(700);
      const desborde = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (desborde > 1) { errores.push(`${vista} ${L}: desborde horizontal de ${desborde}px`); }
      if (modo === 'bien') await p.screenshot({ path: `${SAL}/${slug}-${vista}-${L}-reto.png` });
      const reto = (await p.locator('.reto').innerText()).replace(/\n/g, ' ');
      await p.evaluate((m) => (m === 'bien' ? window.__sol() : window.__mal()), modo).catch((e) => errores.push(`${vista} ${L} ${modo}: ${e.message}`));
      const hay = await p.waitForSelector('.correccion:not([hidden])', { timeout: 8000 }).then(() => true).catch(() => false);
      const estrellas = hay ? await p.locator('.correccion .estrellas .si').count() : -1;
      const msg = hay ? (await p.locator('.correccion .texto p').first().innerText()).replace(/\n/g, ' ') : 'SIN CORRECCIÓN';
      const ok = modo === 'bien' ? estrellas === 3 : estrellas >= 0 && estrellas <= 1;
      if (!ok) fallos++;
      const desborde2 = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (desborde2 > 1) errores.push(`${vista} ${L} tras corregir: desborde horizontal de ${desborde2}px`);
      if (modo === 'bien' || vista === 'tablet') await p.screenshot({ path: `${SAL}/${slug}-${vista}-${L}-${modo === 'bien' ? 'fin' : 'mal'}.png`, fullPage: true });
      if (vista === 'tablet' || !ok) console.log(`${ok ? 'ok ' : 'MAL'} ${vista} n${L} ${modo} ★${estrellas} · ${reto.slice(0, 70)} → ${msg.slice(0, 150)}`);
    }
  }
  await ctx.close();
}
console.log(fallos ? `${fallos} retos no dieron lo esperado` : 'todos los retos dieron lo esperado');
console.log(errores.length ? 'ERRORES:\n' + [...new Set(errores)].join('\n') : 'sin errores de consola ni desbordes');
await b.close();
process.exit(fallos || errores.length ? 1 : 0);
