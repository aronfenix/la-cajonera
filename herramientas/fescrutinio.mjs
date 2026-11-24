// Prueba «La noche del escrutinio» (motor escrutinio): cada nivel, jugado bien y mal, en tablet apaisada,
// tablet vertical y móvil, con el dedo. Captura cada nivel en /tmp/fesc/. Cuenta errores de consola y desbordes.
// Uso: node fescrutinio.mjs [--rapido]      (servidor de public/ en :8765: bash srv.sh)
import { createRequire } from 'module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire('/opt/npm-tools/node_modules/')('playwright')); }
import { mkdirSync, existsSync } from 'fs';
const SLUG = 'la-noche-del-escrutinio', NIVELES = 7, URL = 'http://localhost:8765';
const PANTALLAS = process.argv.includes('--rapido') ? [[1280, 800]] : [[1280, 800], [800, 1280], [390, 844]];
mkdirSync('/tmp/fesc', { recursive: true });
const b = await chromium.launch(existsSync('/usr/bin/google-chrome') ? { executablePath: '/usr/bin/google-chrome' } : {});
const errores = [], problemas = [];
let fallosPrueba = 0;

for (const [w, h] of PANTALLAS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: w < 500, reducedMotion: w === 800 ? 'no-preference' : 'reduce' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push(`${w}: ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && !/favicon|404 \(File not found\)/.test(m.text()) && errores.push(`${w}: ${m.text()}`));
  const toca = async (sel) => { const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded().catch(() => {}); await l.tap({ timeout: 4000 }); };
  const sol = () => p.evaluate(() => window.__sol?.() ?? null);
  const corregido = () => p.locator('.correccion:not([hidden])').count();
  const desborde = () => p.evaluate(() => { const m = document.querySelector('.mesa-juego'); return Math.max(document.documentElement.scrollWidth - innerWidth, m ? m.scrollWidth - m.clientWidth : 0); });

  async function juega(bien) {
    let hecho = null;
    for (let vuelta = 0; vuelta < 80; vuelta++) {
      if (await corregido()) return true;
      if (await p.locator('.ec-seguir:visible').count()) { await toca('.ec-seguir:visible'); await p.waitForTimeout(250); continue; }
      const s = await sol();
      if (!s) { await p.waitForTimeout(200); continue; }
      if ((s.modo === 'cola' || s.modo === 'sobres') && hecho === s.modo + s.i) { await p.waitForTimeout(150); continue; }
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
      } else if (s.modo === 'acta') {
        await p.fill('input[data-campo="candidaturas"]', String(s.candidaturas));
        await p.fill('input[data-campo="validos"]', String(bien ? s.validos : s.candidaturas));
        await toca('.acciones .tecla');
        await p.waitForTimeout(300);
      } else if (s.modo === 'provincia') {
        for (const [k, c] of s.clases.entries()) {
          const otra = c === 'nulo' ? 'blanco' : 'nulo';
          await toca(`.ec-dud[data-i="${k}"] .ec-dud-op[data-b="${bien || k ? c : otra}"]`);
        }
        await toca(`.acciones [data-cambia="${(bien ? s.cambia : !s.cambia) ? 'si' : 'no'}"]`);
        await p.waitForTimeout(1600);
      }
    }
    return corregido();
  }

  for (let L = 0; L < NIVELES; L++) {
    for (const bien of [true, false]) {
      await p.goto(URL + '/');
      await p.evaluate(([s, L]) => { localStorage.clear(); localStorage.setItem('cajon-progreso:/juegos/' + s + '/', JSON.stringify({ progreso: 5, nivel: L })); }, [SLUG, L]);
      await p.goto(`${URL}/juegos/${SLUG}/?sinportada&prueba`);
      await p.waitForSelector('.reto', { timeout: 8000 }).catch(() => errores.push(`${w} nivel ${L}: sin reto`));
      await p.waitForTimeout(900);
      if (bien) await p.screenshot({ path: `/tmp/fesc/${w}-n${L}.png` });
      const d0 = await desborde();
      const ok = await juega(bien);
      const d1 = await desborde();
      if (d0 > 2 || d1 > 2) problemas.push(`${w} nivel ${L}: desborde horizontal de ${Math.max(d0, d1)} px`);
      const estrellas = ok ? await p.locator('.correccion .estrellas .si').count() : -1;
      const msg = ok ? (await p.locator('.correccion .texto p').first().innerText()).replace(/\n/g, ' ').slice(0, 110) : 'SIN CORRECCIÓN';
      if (bien) await p.screenshot({ path: `/tmp/fesc/${w}-n${L}-fin.png` });
      const esperado = bien ? estrellas === 3 : estrellas < 3;
      if (!ok || !esperado) fallosPrueba++;
      console.log(`${w}×${h} nivel ${L} ${bien ? 'bien' : 'mal '} ${ok ? '★' + estrellas : 'FALLA'}${esperado ? '' : ' ¡INESPERADO!'} · ${msg}`);
      if (L >= 5 && bien) {
        const noche = await p.evaluate(() => JSON.parse(localStorage.getItem('cajon-noche-electoral') || 'null'));
        const okN = noche?.provincia?.nombre && noche.provincia.escanos > 0 && ['parque', 'aparcamiento', 'pista', 'blanco', 'nulo'].every((k) => Number.isInteger(noche.votos?.[k]));
        if (!okN) { problemas.push(`${w} nivel ${L}: la noche no se ha guardado bien`); fallosPrueba++; }
      }
    }
  }
  await ctx.close();
}
console.log(problemas.length ? 'PROBLEMAS: ' + problemas.join(' | ') : 'sin desbordes');
console.log(errores.length ? 'ERRORES: ' + [...new Set(errores)].join(' | ') : 'sin errores de consola');
console.log(fallosPrueba ? `${fallosPrueba} partidas no salieron como se esperaba` : 'todas las partidas, como se esperaba');
await b.close();
process.exit(errores.length || problemas.length || fallosPrueba ? 1 : 0);
