// Prueba el mapa de «El cajón vota» (Sociales, tema 2): historia, cada juego se abre y vuelve al mapa,
// el progreso marca los compartimentos, el examen se abre al terminar y el final de la historia sale una vez.
// En tablet apaisada y vertical (táctil) y en móvil. Cero errores de consola y nada de desborde horizontal.
// Uso: node fcajon-vota.mjs      (servidor de public/ en :8765: bash srv.sh)   Capturas en /tmp/fcv/
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/home/claude/.npm-global/lib/node_modules/playwright'); }
const URL = 'http://localhost:8765', MAPA = '/juegos/el-cajon-vota/', EXAMEN = 'el-examen-del-29n';
const COMP = [['la-constitucion-del-cajon'], ['alcaldesa-por-un-dia'], ['la-isla-del-recreo'], ['la-noche-del-escrutinio', 'la-maquina-de-repartir', 'los-176'], ['la-ley-del-cargador']];
const JUEGOS = COMP.flat();
const SAL = '/tmp/fcv'; mkdirSync(SAL, { recursive: true });
const b = await pw.chromium.launch();
const errores = [], problemas = [];
const mal = (m) => { problemas.push(m); console.log('  ✗ ' + m); };

for (const [w, h] of [[1280, 800], [800, 1280], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: w < 500, reducedMotion: w === 800 ? 'no-preference' : 'reduce' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push(`${w}: ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && errores.push(`${w}: ${m.text()}`));
  p.on('response', (r) => r.url().startsWith(URL) && r.status() >= 400 && !r.url().endsWith('favicon.ico') && errores.push(`${w}: ${r.status()} ${r.url().slice(URL.length)}`));
  const toca = async (sel) => { const l = typeof sel === 'string' ? p.locator(sel).first() : sel; await l.scrollIntoViewIfNeeded().catch(() => {}); await l.tap({ timeout: 5000 }); };
  const desborde = async (que) => { const d = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (d > 1) mal(`${w} ${que}: desborde horizontal de ${d}px`); };
  const pon = (hechos, extra = {}) => p.evaluate(([hs, ex]) => { localStorage.clear(); for (const s of hs) localStorage.setItem(`cajon-hecho:/juegos/${s}/`, '2026-11-24'); for (const [k, v] of Object.entries(ex)) localStorage.setItem(k, v); }, [hechos, extra]);
  const estado = () => p.evaluate(() => ({
    texto: document.querySelector('.texto-progreso')?.textContent,
    ordenados: [...document.querySelectorAll('.compartimento-cajon')].map((c) => c.classList.contains('ordenado')),
    examen: document.querySelector('.final-cajon a.tecla')?.getAttribute('href') ?? null,
    nota: document.querySelector('.final-cajon .nota-final p')?.textContent,
    album: document.querySelector('.boton-album b')?.textContent,
    volver: document.querySelector('.barra-juego a.volver')?.getAttribute('href'),
  }));

  // 1. primera visita: la historia, el mapa vacío y el examen cerrado
  await p.goto(URL + '/'); await pon([]);
  await p.goto(URL + MAPA);
  await p.waitForSelector('.vineta-capa', { timeout: 6000 }).catch(() => mal(`${w}: no sale la historia la primera vez`));
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${SAL}/${w}-historia.png` });
  for (let k = 0; k < 6 && (await p.locator('.vineta-capa').count()); k++) { await toca(p.locator('.vineta-capa button', { hasText: 'Siguiente' }).or(p.locator('.vineta-capa button', { hasText: /A jugar/ })).first()).catch(() => {}); await p.waitForTimeout(500); }
  if (await p.locator('.vineta-capa').count()) mal(`${w}: la historia no se cierra`);
  await p.waitForTimeout(500);
  let e = await estado();
  console.log(w, 'vacío:', e.texto, '·', e.album, '·', e.nota, '· examen', e.examen, '· volver', e.volver);
  if (e.examen) mal(`${w}: el examen está abierto sin hacer nada`);
  if (e.volver !== '../../sociales/') mal(`${w}: «La cajonera» lleva a ${e.volver}`);
  if (e.ordenados.some(Boolean)) mal(`${w}: hay compartimentos aprobados sin jugar`);
  await desborde('mapa vacío');
  await p.screenshot({ path: `${SAL}/${w}-vacio.png`, fullPage: true });

  // 2. cada juego se abre desde su tarjeta y su «Menú» vuelve al mapa
  for (const s of JUEGOS) {
    await toca(`.tarjeta-juego[href="../${s}/"]`);
    await p.waitForURL(`**/juegos/${s}/`, { timeout: 6000 }).catch(() => mal(`${w}: la tarjeta de ${s} no abre el juego`));
    await p.waitForSelector('.portada-capa', { timeout: 8000 }).catch(() => mal(`${w}: ${s} no llega a la portada`));
    await p.waitForTimeout(400);
    if (s === 'la-noche-del-escrutinio' || w === 390) await p.screenshot({ path: `${SAL}/${w}-juego-${s}.png` });
    const vuelta = await p.locator('.portada-volver').getAttribute('href');
    if (vuelta !== '../el-cajon-vota/') mal(`${w}: «Menú» de ${s} lleva a ${vuelta}`);
    await toca('.portada-volver');
    await p.waitForURL('**' + MAPA, { timeout: 6000 }).catch(() => mal(`${w}: desde ${s} no se vuelve al mapa`));
    await p.waitForSelector('.compartimento-cajon', { timeout: 6000 });
  }

  // 3. el progreso: la noche electoral a medias y luego entera
  await pon(['la-noche-del-escrutinio', 'la-maquina-de-repartir'], { 'cajon-mapa:/juegos/el-cajon-vota/': '1' });
  await p.goto(URL + MAPA); await p.waitForTimeout(2600);
  e = await estado();
  if (e.ordenados[3]) mal(`${w}: la noche electoral sale aprobada con 2 de 3`);
  await pon(['la-noche-del-escrutinio', 'la-maquina-de-repartir', 'los-176', 'la-constitucion-del-cajon'], { 'cajon-mapa:/juegos/el-cajon-vota/': '1' });
  await p.goto(URL + MAPA); await p.waitForTimeout(3200);
  e = await estado();
  console.log(w, 'a medias:', e.texto, e.ordenados.join(','), '·', e.album, '·', e.nota);
  if (!(e.ordenados[0] && e.ordenados[3]) || e.ordenados.filter(Boolean).length !== 2) mal(`${w}: los aprobados no cuadran ${e.ordenados}`);
  if (!/^2 de 5/.test(e.texto)) mal(`${w}: el texto del progreso dice «${e.texto}»`);
  if (e.examen) mal(`${w}: el examen se abre con el cajón a medias`);
  if (await p.locator('.sello-ordenado').count() !== 2) mal(`${w}: no hay 2 sellos de APROBADO`);
  await desborde('mapa a medias');
  await p.screenshot({ path: `${SAL}/${w}-medias.png`, fullPage: true });
  // el álbum
  await toca('.boton-album'); await p.waitForTimeout(700);
  const alb = await p.evaluate(() => [document.querySelectorAll('.hoja-album li.tiene').length, document.querySelectorAll('.hoja-album li').length, document.querySelectorAll('.hoja-album li.tiene svg').length]);
  if (alb[0] !== 4 || alb[1] !== 8 || alb[2] !== 4) mal(`${w}: el álbum tiene ${alb[0]} de ${alb[1]} pegatinas (${alb[2]} dibujadas)`);
  await p.screenshot({ path: `${SAL}/${w}-album.png` });
  await toca(p.locator('.album button', { hasText: 'Cerrar' }));

  // 4. todo hecho: se abre el examen, se entra y se vuelve
  await pon(JUEGOS, { 'cajon-mapa:/juegos/el-cajon-vota/': '1' });
  await p.goto(URL + MAPA); await p.waitForTimeout(3000);
  e = await estado();
  console.log(w, 'todo:', e.texto, '·', e.nota, '· examen', e.examen);
  if (e.examen !== `../${EXAMEN}/` || e.ordenados.some((x) => !x)) mal(`${w}: con todo hecho, el examen no se abre (${e.examen})`);
  await desborde('mapa entero');
  await p.screenshot({ path: `${SAL}/${w}-todo.png`, fullPage: true });
  await toca('.final-cajon a.tecla');
  await p.waitForURL(`**/juegos/${EXAMEN}/`, { timeout: 6000 }).catch(() => mal(`${w}: el botón no abre el examen`));
  await p.waitForSelector('.portada-capa', { timeout: 8000 }).catch(() => mal(`${w}: el examen no llega a la portada`));
  await p.waitForTimeout(600);
  await desborde('portada del examen');
  await p.screenshot({ path: `${SAL}/${w}-examen-portada.png` });
  await toca('.portada-volver');
  await p.waitForURL('**' + MAPA, { timeout: 6000 }).catch(() => mal(`${w}: desde el examen no se vuelve al mapa`));

  // 5. examen hecho: el final de la historia, una sola vez, y la pegatina del examen en el álbum
  await pon([...JUEGOS, EXAMEN], { 'cajon-mapa:/juegos/el-cajon-vota/': '1' });
  await p.goto(URL + MAPA);
  const finHist = await p.waitForSelector('.vineta-capa', { timeout: 25000 }).then(() => true).catch(() => false);
  if (!finHist) mal(`${w}: no sale el final de la historia`);
  else { await p.waitForTimeout(500); await p.screenshot({ path: `${SAL}/${w}-final-historia.png` }); }
  await p.goto(URL + MAPA); await p.waitForTimeout(2500);
  if (await p.locator('.vineta-capa').count()) mal(`${w}: el final de la historia sale otra vez`);
  e = await estado();
  console.log(w, 'examen hecho:', e.album, '·', e.nota);
  if (!/^8 de 8/.test(e.album || '')) mal(`${w}: el álbum dice ${e.album}`);
  await p.screenshot({ path: `${SAL}/${w}-fin.png`, fullPage: true });
  await ctx.close();
}
console.log(problemas.length ? `PROBLEMAS (${problemas.length})` : 'sin problemas');
console.log(errores.length ? 'ERRORES: ' + [...new Set(errores)].join(' | ') : 'sin errores de consola');
await b.close();
process.exit(errores.length || problemas.length ? 1 : 0);
