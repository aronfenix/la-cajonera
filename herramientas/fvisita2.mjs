// Juega enteros varios niveles de «La maqueta» acertando, y uno fallando, y mira el mensaje final.
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const errores = [];
const juega = async (nivel, falla = false) => {
  const p = await b.newPage({ viewport: { width: 1180, height: 820 } });
  p.on('pageerror', (e) => errores.push(nivel + ': ' + e.message));
  await p.goto('http://localhost:8765/juegos/la-maqueta/');
  await p.evaluate((n) => localStorage.setItem('cajon-progreso:/juegos/la-maqueta/', JSON.stringify({ progreso: 5, nivel: n })), nivel);
  await p.goto('http://localhost:8765/juegos/la-maqueta/?sinportada');
  await p.waitForSelector('.vs-visor:not(.cargando)'); await p.waitForTimeout(500);
  const cfg = await p.evaluate(() => JSON.parse(document.getElementById('config').textContent));
  const L = cfg.niveles[nivel], E = cfg.escenas[L.escena];
  for (let paso = 0; paso < 30; paso++) {
    if (await p.$('.correccion:not([hidden])')) break;
    if (L.modo === 'clasifica') {
      const id = await p.evaluate(() => { const b = [...document.querySelectorAll('.vs-punto')].find((x) => !x.hidden && !x.classList.contains('hecho')); if (!b) return null; b.click(); return [...document.querySelectorAll('.vs-punto')].indexOf(b); });
      if (id == null) { await p.waitForTimeout(400); continue; }
      const pid = Object.keys(E.puntos)[id], g = (E.grupos || cfg.grupos).find((x) => x.id === E.puntos[pid].grupo);
      await p.waitForTimeout(150);
      const nombres = await p.$$eval('.vs-grupo', (bs) => bs.map((x) => x.textContent));
      const elige = falla && paso === 0 ? nombres.find((n) => n !== g.nombre) : g.nombre;
      await p.click(`.vs-grupo:text-is("${elige}")`); await p.waitForTimeout(2400);
    } else if (L.modo === 'ordena') {
      const orden = falla ? [L.orden[1], ...L.orden] : L.orden;
      for (const id of orden) { await p.evaluate((i) => document.querySelectorAll('.vs-punto')[i].click(), Object.keys(E.puntos).indexOf(id)); await p.waitForTimeout(200); }
      await p.waitForTimeout(500);
    } else {
      const reto = await p.$eval('.reto', (x) => x.textContent);
      const q = E.preguntas.find((x) => x.q.replace(/\*\*/g, '') === reto.trim());
      if (!q) { console.log('no encuentro la pregunta', reto); break; }
      if (falla && paso === 0) { const otro = Object.keys(E.puntos).find((k) => !q.vale.includes(k)); await p.evaluate((i) => document.querySelectorAll('.vs-punto')[i].click(), Object.keys(E.puntos).indexOf(otro)); await p.waitForTimeout(200); }
      await p.evaluate((i) => document.querySelectorAll('.vs-punto')[i].click(), Object.keys(E.puntos).indexOf(q.vale[0])); await p.waitForTimeout(2200);
    }
  }
  const fin = await p.$eval('.correccion', (x) => x.innerText.replace(/\s+/g, ' ').slice(0, 220)).catch(() => 'SIN CORRECCIÓN');
  console.log(nivel, L.modo, L.escena, falla ? '(fallando)' : '', '→', fin);
  if (nivel === 4) await p.screenshot({ path: '/tmp/vs-fin.png' });
  await p.close();
};
for (const n of [1, 2, 3, 4, 7, 9]) await juega(n);
await juega(3, true); await juega(5, true);
console.log(errores.length ? errores.join('\n') : 'sin errores');
await b.close();
