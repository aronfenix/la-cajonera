import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })).newPage();
await p.goto('http://localhost:8765/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('cajon-progreso:/juegos/suena-raro/', JSON.stringify({ progreso: 5, nivel: 3 })); });
await p.goto('http://localhost:8765/juegos/suena-raro/?sinportada'); await p.waitForSelector('.reto'); await p.waitForTimeout(3500);
await p.locator('.tl-pal:not([aria-disabled="true"])').nth(1).tap(); await p.waitForTimeout(400);
console.log(await p.evaluate(() => { const a = document.querySelector('.acciones'), f = document.querySelector('.t-folio').getBoundingClientRect(), l = document.querySelector('.tl-lupa').getBoundingClientRect(); const cs = getComputedStyle(a); return { accPos: cs.position, accTop: Math.round(a.getBoundingClientRect().top), folio: [Math.round(f.top), Math.round(f.bottom)], lupa: [Math.round(l.top), Math.round(l.bottom)], docH: document.documentElement.scrollHeight, bodyOv: getComputedStyle(document.body).overflow }; }));
console.log(await p.evaluate(() => { let e = document.querySelector('.acciones'); while (e && !(/(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight)) e = e.parentElement; return e ? [e.className, e.scrollHeight, e.clientHeight] : 'nada hace scroll'; })); await p.screenshot({ path: '/tmp/tl-m3b.png' }); await b.close();
