// Gira la panorámica a muchos ángulos y cuenta píxeles del fondo oscuro (huecos entre caras)
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: process.argv.includes('--gpu') ? ['--enable-gpu', '--use-angle=swiftshader'] : [] });
const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
await p.goto('http://localhost:8765/juegos/la-maqueta/');
await p.evaluate(() => localStorage.setItem('cajon-progreso:/juegos/la-maqueta/', JSON.stringify({ progreso: 5, nivel: 1 })));
await p.goto('http://localhost:8765/juegos/la-maqueta/?sinportada');
await p.waitForSelector('.vs-visor'); await p.waitForTimeout(1200);
const v = await p.$('.vs-visor'); const r = await v.boundingBox();
let peor = 0;
for (let i = 0; i < 16; i++) {
  await p.mouse.move(r.x + 600, r.y + 250); await p.mouse.down();
  await p.mouse.move(r.x + 600 - 190, r.y + 250 + (i % 4 - 1.5) * 30, { steps: 4 }); await p.mouse.up();
  await p.waitForTimeout(+process.env.ESPERA || 150);
  const buf = await p.screenshot({ clip: { x: r.x + 6, y: r.y + 6, width: r.width - 12, height: r.height - 12 } });
  const png = PNG.sync.read(buf); let n = 0;
  for (let k = 0; k < png.data.length; k += 4) if (png.data[k] === 0xe9 && png.data[k + 1] === 0xe2 && png.data[k + 2] === 0xd0) n++;
  const frac = n / (png.width * png.height); peor = Math.max(peor, frac);
  if (frac > 0.002) { await p.screenshot({ path: `/tmp/hueco-${i}.png` }); console.log('hueco', i, (frac * 100).toFixed(2) + '%'); }
}
console.log('peor', (peor * 100).toFixed(2) + '%');
await b.close();
