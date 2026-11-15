// Tildes: prueba el silabeo y juega «Suena raro» (cada nivel a lo bruto y resuelto). Servidor de public/ en :8765.
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
const p = await ctx.newPage(); const errores = [];
p.on('pageerror', (e) => errores.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/404/.test(m.text()) && errores.push(m.text()));
await p.goto('http://localhost:8765/juegos/suena-raro/?sinportada');
const casos = { camión: 'ca-MION', camion: 'CA-mion', árbol: 'AR-bol', arbol: 'ar-BOL', examen: 'e-XA-men', canciones: 'can-CIO-nes', jóvenes: 'JO-ve-nes', país: 'pa-IS', pais: 'pais', día: 'DI-a', dia: 'dia', búho: 'BU-ho', buho: 'buho', águila: 'A-gui-la', quería: 'que-RI-a', héroe: 'HE-ro-e', océano: 'o-CE-a-no', teléfono: 'te-LE-fo-no', renglones: 'ren-GLO-nes', historia: 'his-TO-ria', guardó: 'guar-DO', planeó: 'pla-ne-O', rapidísimo: 'ra-pi-DI-si-mo', reloj: 're-LOJ', estoy: 'es-TOY', fue: 'fue', María: 'ma-RI-a', construir: 'cons-TRUIR', ahora: 'a-HO-ra', almohada: 'al-mo-HA-da', lápices: 'LA-pi-ces', cigüeña: 'ci-GÜE-ña', pingüino: 'pin-GÜI-no', línea: 'LI-ne-a', caído: 'ca-I-do', Raúl: 'ra-UL', ciudad: 'ciu-DAD', perro: 'PE-rro', calle: 'CA-lle', atleta: 'at-LE-ta', inglés: 'in-GLES', excursión: 'ex-cur-SION', transporte: 'trans-POR-te' };
const mal = await p.evaluate(async (casos) => { const { pron } = await import('/juegos/motores/texto-tildes.js'); return Object.entries(casos).filter(([w, e]) => pron(w).txt !== e).map(([w, e]) => `${w}: ${pron(w).txt} (esperaba ${e})`); }, casos);
console.log('silabeo:', mal.length ? mal.join(' | ') : `${Object.keys(casos).length} palabras bien`);
const corr = () => p.locator('.correccion:not([hidden])').count();
for (let L = 0; L < 9; L++) {
  for (const exacto of [false, true]) {
    await p.goto('http://localhost:8765/'); await p.evaluate((L) => { localStorage.clear(); localStorage.setItem('cajon-progreso:/juegos/suena-raro/', JSON.stringify({ progreso: 5, nivel: L })); }, L);
    await p.goto('http://localhost:8765/juegos/suena-raro/?sinportada&prueba'); await p.waitForSelector('.reto', { timeout: 8000 }); await p.waitForTimeout(400);
    const texto = await p.locator('.t-folio').count();
    if (!exacto && process.argv.includes('--capturas')) await p.screenshot({ path: `/tmp/tl-${L}.png` });
    if (texto) {
      if (exacto) await p.evaluate(() => window.__resuelve());
      else { await p.locator('.tl-pal:not([aria-disabled="true"])').nth(2).click(); await p.locator('.tl-v').first().click(); if (process.argv.includes('--capturas')) await p.screenshot({ path: `/tmp/tl-${L}b.png` }); await p.locator('.t-leer').click(); await p.waitForFunction(() => /Leer/.test(document.querySelector('.t-leer').textContent), null, { timeout: 30000 }); if (process.argv.includes('--capturas')) await p.screenshot({ path: `/tmp/tl-${L}c.png` }); }
      for (let k = 0; k < 3 && !(await corr()); k++) { await p.locator('.acciones .tecla', { hasText: 'Comprobar' }).click(); await p.waitForTimeout(150); }
    } else {
      for (let k = 0; k < 12 && !(await corr()); k++) {
        if (exacto) { // pone la tilde donde la lleva la palabra que «se dice»
          const meta = await p.locator('.tl-dice').innerText(), ahora = await p.locator('.tl-lee').innerText();
          if (meta.replace(/\s/g, '') !== ahora.replace(/\s/g, '')) { const n = await p.locator('.tl-v').count(); for (let v = 0; v < n; v++) { await p.locator('.tl-v').nth(v).click(); if ((await p.locator('.tl-lee').innerText()).replace(/\s/g, '') === meta.replace(/\s/g, '')) break; } }
          else if (await p.locator('.tl-v.con').count()) await p.locator('.tl-v.con').click();
        }
        await p.locator('.acciones .tecla', { hasText: 'Así está bien' }).click(); await p.waitForTimeout(exacto ? 500 : 1000);
      }
    }
    console.log(L, exacto ? 'resuelto' : 'bruto', '·', (await corr()) ? (await p.locator('.correccion .texto p').first().innerText()).slice(0, 120).replace(/\n/g, ' ') : 'SIN CORRECCIÓN');
  }
}
console.log(errores.length ? 'ERRORES: ' + [...new Set(errores)].join(' | ') : 'sin errores');
await b.close();
