// Prueba «La máquina de repartir» (motor repartir): cada nivel, jugado bien y mal, en tablet apaisada,
// tablet vertical y móvil, con el dedo. Captura cada nivel en /tmp/frep/. Comprueba además que se guarda
// un hemiciclo de 350 sin mayoría absoluta (para «176») y que usa la provincia de La noche del escrutinio.
// Uso: node frepartir.mjs [--rapido]      (servidor de public/ en :8765: bash srv.sh)
import { createRequire } from 'module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire('/opt/npm-tools/node_modules/')('playwright')); }
import { mkdirSync, existsSync } from 'fs';
const SLUG = 'la-maquina-de-repartir', NIVELES = 8, URL = 'http://localhost:8765';
const PANTALLAS = process.argv.includes('--rapido') ? [[1280, 800]] : [[1280, 800], [800, 1280], [390, 844]];
mkdirSync('/tmp/frep', { recursive: true });
const b = await chromium.launch(existsSync('/usr/bin/google-chrome') ? { executablePath: '/usr/bin/google-chrome' } : {});
const errores = [], problemas = [];
let fallosPrueba = 0;
const IDS = ['parque', 'aparcamiento', 'pista'];
const NOCHE = { provincia: { nombre: 'Tijerales', escanos: 4 }, votos: { parque: 1520, aparcamiento: 1218, pista: 1217, blanco: 40, nulo: 22 }, fecha: 1 };

for (const [w, h] of PANTALLAS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: w < 500, reducedMotion: w === 800 ? 'no-preference' : 'reduce' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push(`${w}: ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && !/favicon|404 \(File not found\)/.test(m.text()) && errores.push(`${w}: ${m.text()}`));
  const toca = async (sel) => { const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded().catch(() => {}); await l.tap({ timeout: 4000 }); };
  const sol = () => p.evaluate(() => window.__sol?.() ?? null);
  const corregido = () => p.locator('.correccion:not([hidden])').count();
  const desborde = () => p.evaluate(() => { const m = document.querySelector('.mesa-juego'); return Math.max(document.documentElement.scrollWidth - innerWidth, m ? m.scrollWidth - m.clientWidth : 0); });
  const ponPalancas = async (N, metodo, umbral) => {
    for (let k = 0; k < 60; k++) { const n = +(await p.locator('.rp-esc-n').innerText()); if (n === N) break; await toca(n < N ? '.rp-esc-mas' : '.rp-esc-menos'); }
    await toca(`.rp-met[data-metodo="${metodo}"]`);
    if ((await p.locator('.rp-umbral').getAttribute('aria-checked')) !== String(umbral)) await toca('.rp-umbral');
  };

  async function juega(bien) {
    for (let vuelta = 0; vuelta < 30; vuelta++) {
      if (await corregido()) return true;
      const s = await sol();
      if (!s) { await p.waitForTimeout(250); continue; }
      if (s.modo === 'predice') {
        const pred = { ...s.reparto };
        if (!bien) { const a = IDS.find((id) => pred[id] > 0), c = IDS.find((id) => id !== a); pred[a]--; pred[c]++; }
        for (const id of IDS) for (let k = 0; k < pred[id]; k++) await toca(`.rp-fila[data-p="${id}"] .rp-mas`);
        await toca('.acciones .tecla.primaria');
        await p.waitForTimeout(800);
      } else if (s.modo === 'cocientes') {
        for (const [k, v] of Object.entries(s.huecos)) { await toca(`input[data-k="${k}"]`); await p.fill(`input[data-k="${k}"]`, String(bien ? v : v + 10)); await p.press(`input[data-k="${k}"]`, 'Enter'); }
        const celdas = bien ? s.celdas : [...s.celdas.slice(0, -1), await p.evaluate((cs) => [...document.querySelectorAll('.rp-celda')].map((c) => c.dataset.k).find((k) => !cs.includes(k)), s.celdas)];
        for (const k of celdas) await toca(`.rp-celda[data-k="${k}"]`);
        await toca('.acciones .tecla');
        await p.waitForTimeout(800);
      } else if (s.modo === 'consigue') {
        if (!bien) { await toca('.acciones .tecla'); await p.waitForTimeout(150); if (!(await p.locator('.aviso.mal').count())) problemas.push(`${w}: «Lo tengo» sin conseguirlo no avisa`); }
        await ponPalancas(bien || s.metodo === 'ganador' ? s.escanos : Math.min(40, s.escanos + 2), s.metodo, s.umbral);
        await toca('.acciones .tecla');
        await p.waitForTimeout(400);
        if (!bien && s.metodo === 'ganador' && !(await corregido())) { await toca('.acciones .tecla'); }
      } else if (s.modo === 'cuesta') {
        await p.fill('input[data-campo="a"]', String(bien ? s.a : s.a * 2));
        await p.fill('input[data-campo="b"]', String(bien ? s.b : Math.round(s.b / 2)));
        await toca('.acciones .tecla');
        await p.waitForTimeout(600);
      } else if (s.modo === 'pais') {
        if (await p.locator('.acciones [data-llega]').count()) { await toca(`.acciones [data-llega="${bien ? 'no' : 'si'}"]`); await p.waitForTimeout(3500); }
        await p.locator('input[data-campo="faltan"]').waitFor({ timeout: 8000 });
        await p.fill('input[data-campo="faltan"]', String(bien ? s.faltan : s.faltan + 1));
        await toca('.acciones .tecla');
        await p.waitForTimeout(400);
      }
    }
    return corregido();
  }

  for (let L = 0; L < NIVELES; L++) {
    for (const bien of [true, false]) {
      await p.goto(URL + '/');
      await p.evaluate(([s, L, noche]) => { localStorage.clear(); localStorage.setItem('cajon-progreso:/juegos/' + s + '/', JSON.stringify({ progreso: 5, nivel: L })); if (noche) localStorage.setItem('cajon-noche-electoral', JSON.stringify(noche)); }, [SLUG, L, L === 2 || L === 7 ? NOCHE : null]);
      await p.goto(`${URL}/juegos/${SLUG}/?sinportada&prueba`);
      await p.waitForSelector('.reto', { timeout: 8000 }).catch(() => errores.push(`${w} nivel ${L}: sin reto`));
      await p.waitForTimeout(900);
      if (bien) await p.screenshot({ path: `/tmp/frep/${w}-n${L}.png` });
      if (L === 2 && bien && !(await p.locator('.pista', { hasText: 'Tijerales' }).count())) { problemas.push(`${w}: el nivel 2 no usa la provincia de la noche`); fallosPrueba++; }
      const d0 = await desborde();
      const ok = await juega(bien);
      const d1 = await desborde();
      if (d0 > 2 || d1 > 2) problemas.push(`${w} nivel ${L}: desborde horizontal de ${Math.max(d0, d1)} px`);
      const estrellas = ok ? await p.locator('.correccion .estrellas .si').count() : -1;
      const msg = ok ? (await p.locator('.correccion .texto p').first().innerText()).replace(/\n/g, ' ').slice(0, 110) : 'SIN CORRECCIÓN';
      if (bien) await p.screenshot({ path: `/tmp/frep/${w}-n${L}-fin.png` });
      const esperado = bien ? estrellas === 3 : estrellas < 3;
      if (!ok || !esperado) fallosPrueba++;
      console.log(`${w}×${h} nivel ${L} ${bien ? 'bien' : 'mal '} ${ok ? '★' + estrellas : 'FALLA'}${esperado ? '' : ' ¡INESPERADO!'} · ${msg}`);
      // el hemiciclo de 350 para «176»
      const noche = await p.evaluate(() => JSON.parse(localStorage.getItem('cajon-noche-electoral') || 'null'));
      const hm = noche?.hemiciclo, suma = hm ? IDS.reduce((a, id) => a + hm[id], 0) : 0;
      if (!hm || suma !== 350 || Math.max(...IDS.map((id) => hm[id])) >= 176 || IDS.some((id) => !Number.isInteger(hm[id]))) { problemas.push(`${w} nivel ${L}: hemiciclo mal guardado ${JSON.stringify(hm)}`); fallosPrueba++; }
      if ((L === 2 || L === 7) && noche?.votos?.parque !== NOCHE.votos.parque) { problemas.push(`${w} nivel ${L}: se ha perdido la noche del escrutinio`); fallosPrueba++; }
    }
  }
  await ctx.close();
}
console.log(problemas.length ? 'PROBLEMAS: ' + problemas.join(' | ') : 'sin desbordes ni problemas');
console.log(errores.length ? 'ERRORES: ' + [...new Set(errores)].join(' | ') : 'sin errores de consola');
console.log(fallosPrueba ? `${fallosPrueba} partidas no salieron como se esperaba` : 'todas las partidas, como se esperaba');
await b.close();
process.exit(errores.length || problemas.length || fallosPrueba ? 1 : 0);
