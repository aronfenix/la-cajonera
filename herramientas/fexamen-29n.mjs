// Prueba «El examen del 29-N» (motor mezcla, con retos de los siete motores de «El cajón vota»):
// el examen entero, jugado bien y jugado mal, en tablet apaisada y vertical (táctil) y en móvil.
// Cada reto se resuelve como en la prueba de su motor (fescrutinio, frepartir, flos-176, falcaldesa, fisla, fconstitucion).
// Uso: node fexamen-29n.mjs [--rapido]      (servidor de public/ en :8765: bash srv.sh)   Capturas en /tmp/f29n/
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/home/claude/.npm-global/lib/node_modules/playwright'); }
const SLUG = 'el-examen-del-29n', URL = 'http://localhost:8765', RETOS = 10;
const PANTALLAS = process.argv.includes('--rapido') ? [[1280, 800]] : process.argv.includes('--movil') ? [[390, 844]] : [[1280, 800], [800, 1280], [390, 844]];
const SAL = '/tmp/f29n'; mkdirSync(SAL, { recursive: true });
const IDS = ['parque', 'aparcamiento', 'pista'];
const b = await pw.chromium.launch();
const errores = [], problemas = [];
let fallos = 0;

for (const [w, h] of PANTALLAS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: w < 500, reducedMotion: w === 800 ? 'no-preference' : 'reduce' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push(`${w}: ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && errores.push(`${w}: ${m.text()}`));
  const toca = async (sel) => { const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded().catch(() => {}); await l.tap({ timeout: 4000 }); };
  const sol = () => p.evaluate(() => window.__sol?.() ?? null);
  const corregido = () => p.locator('.correccion:not([hidden])').count();
  const desborde = () => p.evaluate(() => { const m = document.querySelector('.mesa-juego'); return Math.max(document.documentElement.scrollWidth - innerWidth, m ? m.scrollWidth - m.clientWidth : 0); });
  // qué se sale por la derecha (para el informe de desbordes)
  const culpables = () => p.evaluate(() => [...document.querySelectorAll('.mesa-juego *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 2; }).slice(0, 3).map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].join('.')}→${Math.round(e.getBoundingClientRect().right)}`).join(' '));

  // ---------- un solucionador por motor
  const JUEGA = {
    async constitucion(bien) { await p.evaluate((b) => (b ? window.__sol() : window.__mal()), bien); },
    async cargador(bien) { await p.evaluate((b) => (b ? window.__sol() : window.__mal()), bien); },
    async alcaldia(bien) {
      let mal = 0;
      for (let pasos = 0; pasos < 40 && !(await corregido()); pasos++) {
        const s = await sol();
        if (!s) { await p.waitForTimeout(150); continue; }
        await p.waitForFunction(() => !document.querySelector('.al-sello'), null, { timeout: 4000 }).catch(() => {});
        let accion = s;
        if (!bien && mal < 2) { const otras = await p.$$eval('.al-accion:not(:disabled)', (bs, s) => bs.map((x) => x.dataset.accion).filter((a) => a !== s), s); if (otras.length) { accion = otras[0]; mal++; } }
        await p.waitForFunction(() => document.querySelector('.al-accion:not(:disabled)'), null, { timeout: 4000 }).catch(() => {});
        await toca(`.al-accion[data-accion="${accion}"]`);
        await p.waitForTimeout(250);
      }
    },
    async llaves(bien) {
      const s = await sol();
      for (const k of ['normas', 'cumplir', 'juzgar']) {
        await toca(`.ll-llave[data-llave="${k}"]`);
        const pj = p.locator(`.ll-pj[data-i="${bien ? s[k] : 0}"]`).first();
        await pj.scrollIntoViewIfNeeded().catch(() => {});
        await pj.tap({ position: { x: 30, y: 30 } });
      }
      await toca('.acciones .tecla');
      await p.waitForTimeout(200);
      if (await p.locator('.aviso.mal').count()) await toca('.acciones .tecla');
      await p.waitForSelector('.correccion:not([hidden])', { timeout: 15000 }).catch(() => {});
    },
    async escrutinio(bien) {
      let hecho = null;
      for (let vuelta = 0; vuelta < 80 && !(await corregido()); vuelta++) {
        if (await p.locator('.ec-seguir:visible').count()) { await toca('.ec-seguir:visible'); await p.waitForTimeout(250); continue; }
        const s = await sol();
        if (!s || hecho === s.modo + s.i) { await p.waitForTimeout(150); continue; }
        if (s.modo === 'cola') {
          if (!(await p.locator('.acciones [data-v="si"]:not([disabled])').count())) { await p.waitForTimeout(150); continue; }
          hecho = s.modo + s.i;
          const vota = bien ? s.vota : !s.vota;
          if (vota) await toca('.acciones [data-v="si"]');
          else { await toca('.acciones [data-v="no"]'); await toca(`.ec-motivo[data-m="${bien ? s.motivo : 'personal'}"]`); }
          await p.waitForTimeout(300);
        } else if (s.modo === 'sobres') {
          if (!(await p.locator('.ec-mesa .ec-contenido').count())) { await p.waitForTimeout(150); continue; }
          await p.waitForTimeout(300); hecho = s.modo + s.i;
          const otra = ['parque', 'aparcamiento', 'pista', 'blanco', 'nulo'].find((x) => x !== s.bandeja);
          await toca(`.ec-bandeja[data-b="${bien ? s.bandeja : otra}"]`);
          await p.waitForTimeout(350);
        }
      }
    },
    async repartir(bien) {
      const s = await sol();
      const pred = { ...s.reparto };
      if (!bien) { const a = IDS.find((id) => pred[id] > 0), c = IDS.find((id) => id !== a); pred[a]--; pred[c]++; }
      for (const id of IDS) for (let k = 0; k < pred[id]; k++) await toca(`.rp-fila[data-p="${id}"] .rp-mas`);
      await toca('.acciones .tecla.primaria');
      await p.waitForTimeout(800);
    },
    async investidura(bien) {
      const s = await sol();
      await toca(`.inv-op[data-r="${bien ? s.r : ['primera', 'segunda', 'no'].find((x) => x !== s.r)}"]`);
      await toca('.acciones .tecla.primaria');
    },
  };

  for (const bien of [true, false]) {
    await p.goto(URL + '/');
    await p.evaluate(() => localStorage.clear());
    await p.goto(`${URL}/juegos/${SLUG}/?sinportada&prueba`);
    const vistos = [];
    for (let n = 0; n < RETOS; n++) {
      await p.waitForFunction(() => window.__motor && document.querySelector('.reto')?.textContent && document.querySelector('.correccion')?.hidden, null, { timeout: 10000 }).catch(() => errores.push(`${w} reto ${n + 1}: no aparece`));
      await p.waitForTimeout(700);
      const [motor, modo] = await p.evaluate(() => [window.__motor, window.__modo]);
      vistos.push(motor + '/' + modo);
      if (bien) await p.screenshot({ path: `${SAL}/${w}-r${n + 1}-${motor}.png` });
      const d0 = await desborde();
      try { await JUEGA[motor](bien); } catch (e) { errores.push(`${w} reto ${n + 1} ${motor}/${modo} ${bien ? 'bien' : 'mal'}: ${e.message.split('\n')[0]}`); }
      const ok = await p.waitForSelector('.correccion:not([hidden])', { timeout: 15000 }).then(() => true).catch(() => false);
      await p.waitForTimeout(300);
      const d1 = await desborde();
      if (d0 > 2 || d1 > 2) problemas.push(`${w} reto ${n + 1} (${motor}): desborde horizontal de ${Math.max(d0, d1)} px ${await culpables()}`);
      const est = ok ? await p.locator('.correccion .estrellas .si').count() : -1;
      const msg = ok ? (await p.locator('.correccion .texto p').first().innerText()).replace(/\n/g, ' ').slice(0, 120) : 'SIN CORRECCIÓN';
      if (bien) await p.screenshot({ path: `${SAL}/${w}-r${n + 1}-${motor}-fin.png` });
      const esperado = ok && (bien ? est === 3 : est < 3);
      if (!esperado) fallos++;
      console.log(`${w}×${h} ${bien ? 'bien' : 'mal '} ${String(n + 1).padStart(2)} ${motor}/${modo} ★${est}${esperado ? '' : ' ¡INESPERADO!'} · ${msg}`);
      if (!ok) break;
      // siguiente reto (si sale mal, «Pasar al siguiente»)
      const pasar = p.locator('.correccion .opciones .tecla', { hasText: 'Pasar al siguiente' });
      if (await pasar.count()) await pasar.tap(); else await toca('.correccion .opciones .tecla.primaria');
      await p.waitForTimeout(400);
    }
    const fin = await p.waitForSelector('.final:not([hidden])', { timeout: 8000 }).then(() => true).catch(() => false);
    if (!fin) { problemas.push(`${w} ${bien ? 'bien' : 'mal'}: no llega a la pantalla final`); fallos++; }
    const hecho = await p.evaluate((s) => localStorage.getItem(`cajon-hecho:/juegos/${s}/`), SLUG);
    const pegatina = await p.locator('.final .premio-pegatina').count();
    if (!hecho || !pegatina) { problemas.push(`${w} ${bien ? 'bien' : 'mal'}: el examen no queda hecho (${hecho}) o no da pegatina (${pegatina})`); fallos++; }
    if (new Set(vistos.map((v) => v.split('/')[0])).size !== 7) problemas.push(`${w}: no salen los siete motores: ${vistos.join(', ')}`);
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${SAL}/${w}-final-${bien ? 'bien' : 'mal'}.png` });
    const d = await desborde(); if (d > 2) problemas.push(`${w} pantalla final: desborde ${d}px ${await culpables()}`);
  }
  await ctx.close();
}
console.log(problemas.length ? 'PROBLEMAS: ' + problemas.join(' | ') : 'sin desbordes ni problemas');
console.log(errores.length ? 'ERRORES: ' + [...new Set(errores)].join(' | ') : 'sin errores de consola');
console.log(fallos ? `${fallos} retos no salieron como se esperaba` : 'todos los retos, como se esperaba');
await b.close();
process.exit(errores.length || problemas.length || fallos ? 1 : 0);
