// Mudanza: lo guardado en la web vieja (otro origen) llega a la nueva, con las claves sin /la-cajonera/, sin pisar lo que ya hay.
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await b.newPage();
await p.goto('http://localhost:8765/juegos/motores/nucleo.js'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('cajon-hecho:/juegos/suena-raro/', 'NUEVO'); });
await p.goto('http://127.0.0.1:8802/vacia.html'); await p.evaluate(() => { localStorage.clear();
  localStorage.setItem('cajon-progreso:/la-cajonera/juegos/sin-aliento/', '{"progreso":40,"nivel":3}');
  localStorage.setItem('cajon-hecho:/la-cajonera/juegos/suena-raro/', 'VIEJO');
  localStorage.setItem('cajon-sellado:/la-cajonera/juegos/la-feria/:Pato ñandú', '1');
  localStorage.setItem('aplanatron-otro', 'no se lleva'); });
await p.goto('http://127.0.0.1:8802/la-cajonera/juegos/sin-aliento/?sinportada');
await p.waitForURL(/localhost:8765\/juegos\/sin-aliento\//, { timeout: 8000 });
await p.waitForLoadState('load'); await p.waitForTimeout(800); console.log('llega a', p.url());
console.log(await p.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)]))));
await b.close();
