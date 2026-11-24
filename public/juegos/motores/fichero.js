// Motor «fichero»: automatizar los hechos multiplicativos, contra el reloj y con memoria.
//   fichero → tandas de fichas con tiempo. Cada hecho vive en un fichero de 4 cajones (caja de Leitner):
//             si lo recuerdas a tiempo avanza un cajón; si fallas o se acaba la tira, vuelve al 1.
//             Del cajón 4 sale al álbum. El 1 sale siempre; los demás, cada vez más espaciados (por días).
//   minuto  → contrarreloj de un minuto con un mazo. Récord por mazo, guardado en la tablet.
// Mazos: faciles (×2, ×5, ×10, ×0, ×1) · dificiles (las 21 con 3, 4, 6, 7, 8 y 9) · division (las 21 al revés) · extra.
// Parámetros de cada nivel: generar.segundos (tiempo por ficha), generar.fichas (cuántas por tanda).
// La memoria de cada hecho se guarda solo en esta tablet (localStorage «cajon-fichero»).
import { el, num, barajar, marca } from './nucleo.js';
import { espera, chispasEn, temblor, bote, vibra } from './efectos.js';
import { campo, lee } from './kit.js';

/* ================================================================ los mazos */
const par = (a, b) => (a <= b ? `${a}x${b}` : `${b}x${a}`);
function hechos(lista) { const vistos = new Set(), out = []; for (const [a, b] of lista) { const id = par(a, b); if (!vistos.has(id)) { vistos.add(id); out.push({ id, a: Math.min(a, b), b: Math.max(a, b) }); } } return out; }
const DIF = [3, 4, 6, 7, 8, 9];
const todos = (xs, ys) => xs.flatMap((a) => ys.map((b) => [a, b]));
const MAZOS = {
  faciles: {
    nombre: 'Fácil', titulo: 'Los de calentar', detalle: '×2, ×5, ×10, ×0 y ×1',
    hechos: [...hechos(todos([2, 5, 10], [2, 3, 4, 5, 6, 7, 8, 9, 10])), { id: 'x0', a: 0, b: null }, { id: 'x1', a: 1, b: null }],
  },
  dificiles: { nombre: 'Medio', titulo: 'Las 21', detalle: 'las que cuestan: con 3, 4, 6, 7, 8 y 9', hechos: hechos(todos(DIF, DIF)) },
  division: { nombre: 'Difícil', titulo: 'Las 21 al revés', detalle: 'divisiones: 56 : 8, 42 : 6…', div: true, hechos: hechos(todos(DIF, DIF)) },
  extra: {
    nombre: 'Extra', titulo: 'Para nota', detalle: '×11, ×12, ×25 y cuadrados',
    hechos: [...hechos([...todos([11, 12], [3, 4, 5, 6, 7, 8, 9]), ...todos([25], [2, 3, 4, 6, 8]), [11, 11], [12, 12], [13, 13], [14, 14], [15, 15]])],
  },
};
const ORDEN = ['faciles', 'dificiles', 'division', 'extra'];
const ALBUM = 5; // cajones 1–4 y, después, el álbum
const ESPERA = { 1: 0, 2: 1, 3: 2, 4: 4 }; // días hasta que vuelve a salir una ficha de cada cajón

/* ================================================================ memoria en la tablet */
const CLAVE = 'cajon-fichero';
const hoy = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
function lee_() { try { const m = JSON.parse(localStorage.getItem(CLAVE)); if (m && m.v === 1) return m; } catch {} return { v: 1, mazos: {}, records: {}, ultimo: null }; }
let MEM = lee_();
const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(MEM)); } catch {} };
const estado = (mazo, id) => MEM.mazos[mazo]?.[id] ?? null;
const pon = (mazo, id, c) => { (MEM.mazos[mazo] ??= {})[id] = { c, d: hoy() }; };
const toca = (st) => st && st.c < ALBUM && hoy() - st.d >= ESPERA[st.c];

function cuenta(mazo) {
  const caj = [0, 0, 0, 0, 0, 0]; // 0 = sin estrenar
  for (const h of MAZOS[mazo].hechos) caj[estado(mazo, h.id)?.c ?? 0]++;
  return caj;
}
function recomendado() {
  const usado = (m) => Object.keys(MEM.mazos[m] ?? {}).length > 0;
  if (!ORDEN.some(usado)) return 'dificiles';
  const c = Object.fromEntries(ORDEN.map((m) => [m, cuenta(m)]));
  if (c.faciles[1] > 0) return 'faciles';
  if (!usado('faciles') && c.dificiles[1] >= 10) return 'faciles';
  if (c.dificiles[ALBUM] + c.dificiles[4] < MAZOS.dificiles.hechos.length) return 'dificiles';
  if (c.division[ALBUM] + c.division[4] < MAZOS.division.hechos.length) return 'division';
  return 'extra';
}

/* ================================================================ fichas */
function ficha(mazo, h) {
  const M = MAZOS[mazo];
  if (h.b == null) { const n = 2 + Math.floor(Math.random() * 8); return Math.random() < 0.5 ? { h, a: h.a, b: n, op: '×', r: h.a * n } : { h, a: n, b: h.a, op: '×', r: h.a * n }; }
  if (M.div) { const p = h.a * h.b, d = Math.random() < 0.5 ? h.a : h.b; return { h, a: p, b: d, op: ':', r: p / d }; }
  return Math.random() < 0.5 ? { h, a: h.a, b: h.b, op: '×', r: h.a * h.b } : { h, a: h.b, b: h.a, op: '×', r: h.a * h.b };
}
const texto = (f) => `${num(f.a)} ${f.op} ${num(f.b)}`;
const etiqueta = (mazo, h) => (h.b == null ? `${h.a} × n` : MAZOS[mazo].div ? `${num(h.a * h.b)} : ${h.a}` : `${h.a} × ${h.b}`);

// La estrategia de cada hecho, con sus números. Nivel 1: la idea; nivel 2: la cuenta entera.
const PRIO = [10, 0, 1, 2, 5, 9, 11, 12, 25, 4, 8, 3, 6];
function estrategia(f, nivel = 2) {
  if (f.op === ':') return nivel === 1 ? `Piensa en la tabla del ${f.b}: ¿qué número por **${f.b}** da ${num(f.a)}?` : `${num(f.a)} : ${f.b} → ¿qué número por ${f.b} da ${num(f.a)}? ${f.b} × ${f.r} = ${num(f.a)}. Son **${f.r}**.`;
  const [x, y] = [f.a, f.b];
  if (x === y && x >= 13) return nivel === 1 ? `Parte el ${x} en ${10} y ${x - 10}.` : `${x} × ${x} = ${x} × 10 + ${x} × ${x - 10} = ${10 * x} + ${x * (x - 10)} = **${num(x * x)}**.`;
  if (x === 7 && y === 7) return nivel === 1 ? '7 × 5 lo sabes. ¿Cuántos sietes faltan?' : '7 × 5 = 35, y dos sietes más: 35 + 14 = **49**.';
  const k = PRIO.find((p) => p === x || p === y);
  const n = k === x ? y : x;
  const R = {
    10: ['Por 10, le pones un cero.', `${n} × 10: le pones un cero. **${num(n * 10)}**.`],
    0: ['Cualquier número por 0…', 'Cualquier número por 0 da **0**.'],
    1: ['Por 1, el número se queda igual.', `Por 1 se queda igual: **${n}**.`],
    2: ['Por 2 es el doble.', `Por 2 es el doble: ${n} + ${n} = **${2 * n}**.`],
    5: ['Por 5 es la mitad de por 10.', `Por 5 es la mitad de por 10: ${n} × 10 = ${10 * n}, la mitad, **${5 * n}**.`],
    9: ['Por 9 es por 10 y quitas uno.', `Por 9 es por 10 y quitas uno: ${n} × 10 = ${10 * n}, menos ${n}, **${9 * n}**.`],
    11: ['Por 11 es por 10 y uno más.', `Por 11 es por 10 y uno más: ${num(10 * n)} + ${n} = **${num(11 * n)}**.`],
    12: ['Por 12 es por 10 más por 2.', `Por 12 es por 10 más por 2: ${num(10 * n)} + ${2 * n} = **${num(12 * n)}**.`],
    25: ['Por 25 es la cuarta parte de por 100.', `Por 25 es la cuarta parte de por 100: ${n} × 100 = ${num(100 * n)}, la mitad ${num(50 * n)} y otra vez la mitad, **${num(25 * n)}**.`],
    4: ['Por 4 es el doble del doble.', `Por 4 es el doble del doble: ${n} × 2 = ${2 * n}, y el doble, **${4 * n}**.`],
    8: ['Por 8 es el doble de por 4.', `Por 8 es el doble de por 4: ${n} × 4 = ${4 * n}, y el doble, **${8 * n}**.`],
    3: ['Por 3 es por 2 y uno más.', `Por 3 es por 2 y uno más: ${n} × 2 = ${2 * n}, más ${n}, **${3 * n}**.`],
    6: ['Por 6 es por 5 y uno más.', `Por 6 es por 5 y uno más: ${n} × 5 = ${5 * n}, más ${n}, **${6 * n}**.`],
  }[k];
  return R ? R[nivel === 1 ? 0 : 1] : `${texto(f)} = **${num(f.r)}**.`;
}

// Elige las fichas de una tanda: primero las del cajón 1, luego las que tocan, unas pocas nuevas y, si falta, repaso.
function eligeTanda(mazo, n) {
  const hs = MAZOS[mazo].hechos;
  const st = (h) => estado(mazo, h.id);
  const uno = barajar(hs.filter((h) => st(h)?.c === 1));
  const tocan = barajar(hs.filter((h) => st(h) && st(h).c > 1 && toca(st(h)))).sort((p, q) => st(p).c - st(q).c);
  const nuevas = barajar(hs.filter((h) => !st(h))).slice(0, uno.length >= 5 ? 1 : uno.length >= 2 ? 2 : 4);
  let lista = [...uno.slice(0, n - Math.min(nuevas.length, 2)), ...nuevas, ...tocan];
  lista = [...new Set(lista)].slice(0, n);
  if (lista.length < n) {
    // relleno: primero repaso de las que ya han salido (de menos a más sabidas), luego sin estrenar y, al final, del álbum
    const orden = (h) => { const c = st(h)?.c; return c == null ? 4.5 : c === ALBUM ? 9 : c; };
    const resto = barajar(hs.filter((h) => !lista.includes(h))).sort((p, q) => orden(p) - orden(q));
    lista.push(...resto.slice(0, n - lista.length));
  }
  return barajar(lista).map((h) => h.id);
}

/* ================================================================ piezas de la mesa */
const CAJ = ['', '1', '2', '3', '4', 'Álbum'];
function ficheroNodo(mazo, { grande = false } = {}) {
  const c = cuenta(mazo);
  const caja = el('div', { class: 'fichero' + (grande ? ' grande' : ''), role: 'img', 'aria-label': `Fichero: ${c[1]} en el 1, ${c[2]} en el 2, ${c[3]} en el 3, ${c[4]} en el 4, ${c[ALBUM]} en el álbum y ${c[0]} sin estrenar` });
  for (let k = 1; k <= ALBUM; k++) {
    caja.append(el('div', { class: 'cajon-f fch-c' + k, 'data-k': k },
      el('span', { class: 'pestana', text: CAJ[k] }),
      el('div', { class: 'fch-tacos' }, Array.from({ length: Math.min(c[k], 12) }, () => el('i'))),
      el('b', { class: 'fch-cuantas', text: c[k] })));
  }
  return caja;
}
const actualiza = (nodo, mazo) => { const nuevo = ficheroNodo(mazo, { grande: nodo.classList.contains('grande') }); nodo.replaceWith(nuevo); return nuevo; };

// La tira de papel que se va cortando: el tiempo de cada ficha. Se puede pausar.
function tira(segundos, alAcabar) {
  const relleno = el('span', { class: 'relleno-tira' });
  const nodo = el('div', { class: 'tira-tiempo', role: 'timer', 'aria-label': `${segundos} segundos` }, relleno);
  let resto = segundos * 1000, t0 = 0, raf = 0, vivo = false;
  const paso = (t) => {
    const q = Math.max(0, resto - (t - t0));
    relleno.style.transform = `scaleX(${(q / (segundos * 1000)).toFixed(4)})`;
    nodo.classList.toggle('fch-poco', q < segundos * 300);
    if (q <= 0) { vivo = false; alAcabar(); return; }
    raf = requestAnimationFrame(paso);
  };
  return {
    nodo,
    arranca() { vivo = true; t0 = performance.now(); raf = requestAnimationFrame(paso); },
    para() { if (!vivo) return 0; cancelAnimationFrame(raf); vivo = false; resto = Math.max(0, resto - (performance.now() - t0)); return resto; },
    gastado() { return segundos * 1000 - (vivo ? resto - (performance.now() - t0) : resto); },
  };
}

function cartulina(f, { pequena = false } = {}) {
  return el('div', { class: 'cartulina' + (pequena ? ' pequena' : '') }, el('span', { class: 'op-ficha', text: texto(f) }));
}

// En pantallas bajas el teclado en pantalla puede tapar el campo: se desplaza la mesa lo justo.
function aLaVista(nodo) {
  requestAnimationFrame(() => {
    const k = document.querySelector('.teclado');
    if (!k || k.hidden) return;
    const r = nodo.getBoundingClientRect(), t = k.getBoundingClientRect();
    if (r.bottom > t.top - 10) nodo.closest('.mesa-juego')?.scrollBy({ top: r.bottom - t.top + 18, behavior: 'smooth' });
  });
}

/* ================================================================ elegir mazo */
function eligeMazo(ctx, { minuto = false } = {}) {
  return new Promise((ok) => {
    const rec = recomendado();
    ctx.reto(minuto ? '¿Con qué fichas te pones contra el reloj?' : '¿Qué fichas sacas hoy?');
    ctx.pista(minuto ? 'Tu récord con cada mazo se queda guardado en esta tablet.' : 'Elige un mazo. El marcado con «Te toca» es el que te conviene ahora, por cómo te fue la última vez.');
    const lista = el('div', { class: 'fch-mazos' });
    for (const m of ORDEN) {
      const M = MAZOS[m], c = cuenta(m), total = M.hechos.length;
      const extra = minuto ? (MEM.records[m] ? `Récord: ${MEM.records[m]}` : 'Sin récord') : `En el álbum: ${c[ALBUM]} de ${total}`;
      const b = el('button', { type: 'button', class: 'fch-mazo' + (m === rec ? ' recomendado' : ''), 'data-mazo': m },
        m === rec && el('span', { class: 'sello-rec', text: 'Te toca' }),
        el('b', { class: 'nombre-mazo', text: M.nombre }),
        el('span', { class: 'titulo-mazo', text: M.titulo }),
        el('small', { text: M.detalle }),
        el('span', { class: 'medidor' }, el('i', { style: { width: (100 * c[ALBUM]) / total + '%' } })),
        el('small', { class: 'extra-mazo', text: extra }));
      b.onclick = () => { ctx.suena('pon'); MEM.ultimo = m; guarda(); lista.remove(); verBtn.remove(); mapa.remove(); ok(m); };
      lista.append(b);
    }
    const mapa = el('div', { class: 'mapa-fichas', hidden: true });
    const verBtn = el('button', { type: 'button', class: 'tecla ver-fichero', text: 'Ver mis fichas' });
    verBtn.onclick = () => {
      mapa.hidden = !mapa.hidden; verBtn.textContent = mapa.hidden ? 'Ver mis fichas' : 'Ocultar mis fichas';
      if (!mapa.hidden) {
        mapa.replaceChildren(...ORDEN.map((m) => el('section', {}, el('h3', { text: `${MAZOS[m].nombre} · ${MAZOS[m].titulo}` }),
          el('div', { class: 'chips' }, MAZOS[m].hechos.map((h) => { const s = estado(m, h.id); return el('span', { class: 'chip fch-c' + (s?.c ?? 0), title: s ? (s.c === ALBUM ? 'En el álbum' : `Cajón ${s.c}`) : 'Sin estrenar' }, etiqueta(m, h), el('i', { text: s ? CAJ[s.c] === 'Álbum' ? '★' : CAJ[s.c] : '·' })); })))),
          el('p', { class: 'leyenda-chips', text: 'El número es el cajón donde está cada ficha. ★ = en el álbum. · = sin estrenar.' }));
      }
    };
    ctx.escenario.append(lista, verBtn, mapa);
    setTimeout(() => lista.querySelector('.recomendado')?.focus({ preventScroll: true }), 80);
  });
}

/* ================================================================ la tanda (modo fichero) */
let mazoActual = null;
const porAciertos = (ok, n) => { const q = n ? ok / n : 0; return q >= 0.9 ? 3 : q >= 0.7 ? 2 : q >= 0.4 ? 1 : 0; };

async function tanda(d, ctx) {
  // las pistas se registran ya (el núcleo las lee nada más empezar el reto); su texto depende de la ficha que haya en la mesa
  const ayuda = { texto: () => 'Primero elige un mazo.', ver: () => {} };
  ctx.pistas([1, 2, 3].map(() => ({ get texto() { return ayuda.texto(); }, ver() { ayuda.ver(); } })));
  if (ctx.ronda === 0 && ctx.intento === 1) mazoActual = null;
  if (!mazoActual) {
    mazoActual = await eligeMazo(ctx);
  }
  const mazo = mazoActual, M = MAZOS[mazo];
  if (ctx.pizarra) return pizarra(d, ctx, mazo);
  d.ids ??= eligeTanda(mazo, d.fichas ?? 10);
  const porId = Object.fromEntries(M.hechos.map((h) => [h.id, h]));
  const cola = d.ids.map((id) => ({ f: ficha(mazo, porId[id]), repaso: false }));
  const N = cola.length;
  const segundosDe = (f) => (d.segundos ?? 6) + (f.r >= 100 ? 1 : 0) + (M.div ? 1 : 0) + (mazo === 'extra' ? 2 : 0);

  ctx.reto('Escribe el resultado **antes de que se acabe la tira**.');
  ctx.pista(`${M.nombre} · ${M.titulo}. Unos ${d.segundos ?? 6} segundos por ficha. Si fallas, la ficha vuelve al cajón 1.`);
  const contador = el('small', { class: 'contador-fichas' });
  const enCajon = el('span', { class: 'en-cajon' });
  const sitio = el('div', { class: 'sitio-ficha' });
  const i = campo('Resultado', 4, { class: 'campo-num campo-ficha' });
  const linea = el('label', { class: 'linea-ficha' }, el('span', { text: '=' }), i);
  const fila = el('div', { class: 'fila-ficha' }, sitio, linea);
  const tarjeta = el('div', { class: 'mesa-ficha' }, el('div', { class: 'cabeza-ficha' }, contador, enCajon), fila);
  let fich = ficheroNodo(mazo);
  ctx.escenario.append(el('div', { class: 'tanda' }, tarjeta, fich));

  let actual = null, reloj = null, fase = 'responde', ocupado = false, ayudaEnEsta = 0, primeras = 0, aTiempo = 0;
  const resultados = []; // { f, res: 'bien'|'mal'|'tarde'|'pista', de, a }
  const subidas = [];

  ayuda.texto = () => { if (!actual) return 'Escribe el resultado y pulsa ✓.'; ayudaEnEsta++; return estrategia(actual.f, ayudaEnEsta >= 2 ? 2 : 1); };
  ayuda.ver = () => { if (actual && fase === 'responde') { reloj?.para(); tarjeta.classList.add('con-ayuda'); } setTimeout(() => { if (!i.readOnly && i.isConnected) i.focus({ preventScroll: true }); }, 60); };

  const siguiente = async () => {
    if (!cola.length) return termina();
    actual = cola.shift();
    const f = actual.f, st = estado(mazo, f.h.id);
    if (!actual.repaso) primeras++;
    contador.textContent = actual.repaso ? 'Vuelve una ficha' : `Ficha ${primeras} de ${N}`;
    enCajon.textContent = !st ? 'Nueva' : st.c === ALBUM ? 'Del álbum' : `Cajón ${st.c}`;
    enCajon.className = 'en-cajon fch-c' + (st?.c ?? 0);
    sitio.replaceChildren(cartulina(f));
    tarjeta.classList.remove('fch-fallo', 'con-ayuda', 'fch-acierto');
    ayudaEnEsta = 0; fase = 'responde';
    i.value = ''; i.classList.remove('mal', 'bien'); i.readOnly = false;
    i.maxLength = String(f.r).length + 1;
    reloj = tira(segundosDe(f), () => falla('tarde'));
    tarjeta.querySelector('.tira-tiempo')?.remove();
    fila.after(reloj.nodo);
    sitio.firstChild.animate?.([{ transform: 'translateY(-30px) rotate(-6deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'cubic-bezier(.3,1.4,.5,1)' });
    i.focus({ preventScroll: true });
    aLaVista(i);
    reloj.arranca();
  };

  // Resultado de la primera vez que sale una ficha en la tanda: decide su cajón.
  const anota = (res) => {
    const f = actual.f, st = estado(mazo, f.h.id), de = st?.c ?? 0;
    let a = de;
    if (res === 'bien') {
      if (!st) a = 3; // la sabía desde el principio
      else if (toca(st)) a = Math.min(ALBUM, st.c + 1);
      if (a !== de || !st) pon(mazo, f.h.id, a);
      if (a === ALBUM && de !== ALBUM) subidas.push(f);
    } else { a = 1; pon(mazo, f.h.id, 1); }
    guarda();
    resultados.push({ f, res, de, a });
  };

  const acierta = async () => {
    ocupado = true; reloj.para(); fase = 'nada';
    const conAyuda = tarjeta.classList.contains('con-ayuda');
    i.classList.add('bien'); i.readOnly = true;
    if (!actual.repaso) { anota(conAyuda ? 'pista' : 'bien'); if (!conAyuda) aTiempo++; }
    if (conAyuda && !actual.repaso) cola.splice(Math.min(3, cola.length), 0, { f: ficha(mazo, actual.f.h), repaso: true });
    tarjeta.classList.add('fch-acierto');
    ctx.suena('estrella', primeras); chispasEn(i, 6, '#9bd84a'); vibra(15);
    fich = actualiza(fich, mazo);
    await espera(conAyuda ? 500 : 280);
    ocupado = false; siguiente();
  };

  // Fallo o tiempo agotado: se enseña el resultado con su estrategia y hay que escribirlo para seguir.
  const falla = (res) => {
    if (fase !== 'responde') return;
    reloj.para(); fase = 'copia';
    if (!actual.repaso) anota(tarjeta.classList.contains('con-ayuda') && res === 'mal' ? 'mal' : res);
    const veces = (actual.veces ?? 0) + 1;
    if (veces <= 2 && !cola.some((x) => x.f.h.id === actual.f.h.id)) cola.splice(Math.min(3, cola.length), 0, { f: ficha(mazo, actual.f.h), repaso: true, veces });
    tarjeta.classList.add('fch-fallo');
    ctx.suena(res === 'tarde' ? 'atras' : 'mal'); temblor(sitio, 6); vibra([30, 40, 30]);
    const f = actual.f;
    // la ficha se da la vuelta: por detrás lleva el resultado y cómo sacarlo
    sitio.querySelector('.cartulina')?.append(el('p', { class: 'dorso-ficha' }, el('b', { text: res === 'tarde' ? 'Se acabó la tira. ' : 'No. ' }), marca(estrategia(f, 2)), el('span', { class: 'copia', text: ' Escríbelo tú y sigue.' })));
    i.value = ''; i.classList.remove('mal', 'bien'); i.readOnly = false;
    fich = actualiza(fich, mazo);
    i.focus({ preventScroll: true });
    aLaVista(i);
  };

  const responde = () => {
    if (ocupado || !actual) return;
    const v = lee(i); if (v == null) return;
    if (fase === 'responde') return v === actual.f.r ? acierta() : (i.classList.add('mal'), falla('mal'));
    if (fase === 'copia') {
      if (v === actual.f.r) { fase = 'nada'; i.classList.add('bien'); i.readOnly = true; ctx.suena('pon'); setTimeout(siguiente, 350); }
      else { i.classList.add('mal'); temblor(i, 5); setTimeout(() => { i.value = ''; i.classList.remove('mal'); }, 380); }
    }
  };
  // se comprueba solo al escribir tantas cifras como tiene el resultado (o con ✓ / Intro)
  i.addEventListener('input', () => { if (actual && i.value.length >= String(actual.f.r).length && !i.readOnly) responde(); });
  i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); responde(); } });

  const termina = async () => {
    fase = 'nada'; actual = null;
    tarjeta.remove(); ctx.pista('');
    const grande = ficheroNodo(mazo, { grande: true });
    const fila = el('div', { class: 'resumen-tanda' }, resultados.map((r) => el('span', { class: 'chip-res fch-' + r.res, title: r.res === 'bien' ? 'A tiempo' : r.res === 'tarde' ? 'Se acabó el tiempo' : r.res === 'pista' ? 'Con pista' : 'Fallo' },
      texto(r.f), el('i', { text: r.res === 'bien' ? (r.a === ALBUM && r.de !== ALBUM ? '★' : r.a !== r.de ? `→${CAJ[r.a]}` : '✓') : '→1' }))));
    fich.replaceWith(el('div', { class: 'cierre-tanda' }, grande, fila));
    ctx.reto('Así queda tu fichero');
    for (const f of subidas) {
      const peg = el('div', { class: 'pegatina-hecho', role: 'status' }, el('b', { text: etiqueta(mazo, f.h) }), el('small', { text: '¡Al álbum!' }));
      grande.append(peg); ctx.suena('sello'); bote(peg, 14); await espera(700);
    }
    const fallos = resultados.filter((r) => r.res !== 'bien');
    const estrellas = porAciertos(aTiempo, N);
    const nombres = [...new Set(fallos.map((r) => texto(r.f)))].slice(0, 3).map((t) => `**${t}**`);
    const msj = [
      `${aTiempo} de ${N} a tiempo.`,
      subidas.length ? `${subidas.length === 1 ? 'Una ficha nueva' : `${subidas.length} fichas nuevas`} en el álbum.` : '',
      fallos.length ? `Al cajón 1: ${nombres.join(', ')}${fallos.length > 3 ? '…' : ''}. Saldrán más a menudo hasta que dejen de resistirse.` : 'Ninguna al cajón 1.',
      estrellas === 3 && !resultados.some((r) => r.res === 'pista') && (d.segundos ?? 6) > 3 ? 'La próxima tanda, con menos tiempo.' : '',
    ].filter(Boolean).join(' ');
    ctx.fin(estrellas, msj);
  };

  ctx.boton('✓', responde).classList.add('ok-ficha');
  siguiente();
}

// En la pizarra digital: sin reloj ni memoria. La clase lo dice en voz alta y se destapa.
function pizarra(d, ctx, mazo) {
  const M = MAZOS[mazo];
  const ids = barajar(M.hechos).slice(0, d.fichas ?? 10);
  ctx.reto(`${M.nombre} · ${M.titulo}`);
  ctx.pista('Decidlo en voz alta y destapad el resultado.');
  const sitio = el('div', { class: 'sitio-ficha pizarra-ficha' });
  const res = el('p', { class: 'res-pizarra' });
  ctx.escenario.append(el('div', { class: 'mesa-ficha' }, sitio, res));
  let k = 0, f = null;
  const btn = ctx.boton('Destapar', () => {
    if (res.textContent) { k++; if (k >= ids.length) return ctx.fin(3, `${ids.length} fichas repasadas en voz alta.`); return pinta(); }
    res.textContent = `= ${num(f.r)}`; btn.textContent = 'Siguiente';
  });
  const pinta = () => { f = ficha(mazo, ids[k]); sitio.replaceChildren(cartulina(f)); res.textContent = ''; btn.textContent = 'Destapar'; };
  pinta();
}

/* ================================================================ el minuto (contrarreloj) */
async function minuto(d, ctx) {
  if (ctx.ronda === 0 && ctx.intento === 1) mazoActual = null;
  if (!mazoActual) mazoActual = await eligeMazo(ctx, { minuto: !ctx.pizarra });
  const mazo = mazoActual, M = MAZOS[mazo];
  if (ctx.pizarra) return pizarra(d, ctx, mazo);
  const SEG = d.segundos ?? 60;
  const record = MEM.records[mazo] ?? 0;
  ctx.reto(`**Un minuto.** Todas las que puedas.`);
  ctx.pista(`${M.nombre} · ${M.titulo}. ${record ? `Tu récord: ${record}.` : 'Aún no tienes récord con este mazo.'} El reloj empieza con la primera ficha.`);
  const cifra = el('b', { class: 'segundos-minuto', text: SEG });
  const aciertosN = el('b', { class: 'aciertos-minuto', text: '0' });
  const marcador = el('div', { class: 'marcador-minuto' }, el('div', { class: 'reloj-minuto' }, cifra, el('small', { text: 'segundos' })), el('div', { class: 'cuenta-minuto' }, aciertosN, el('small', { text: 'bien' })), record ? el('div', { class: 'cuenta-minuto rec' }, el('b', { text: record }), el('small', { text: 'récord' })) : null);
  const sitio = el('div', { class: 'sitio-ficha' });
  const i = campo('Resultado', 4, { class: 'campo-num campo-ficha' });
  const tarjeta = el('div', { class: 'mesa-ficha' }, el('div', { class: 'fila-ficha' }, sitio, el('label', { class: 'linea-ficha' }, el('span', { text: '=' }), i)));
  ctx.escenario.append(el('div', { class: 'tanda minuto' }, marcador, tarjeta));
  ctx.pistas([]);

  // las fichas: más de las que se resisten, alguna nueva y repaso
  const hs = M.hechos;
  const peso = (h) => { const s = estado(mazo, h.id); return !s ? 2 : s.c === 1 ? 4 : s.c === ALBUM ? 1 : 2; };
  const bolsa = hs.flatMap((h) => Array(peso(h)).fill(h));
  let ultimo = null;
  const saca = () => { let h; do h = bolsa[Math.floor(Math.random() * bolsa.length)]; while (h === ultimo && hs.length > 1); ultimo = h; return ficha(mazo, h); };

  let f = null, bien = 0, empezado = false, acabado = false, ocupado = false, t0 = 0;
  const fallos = [];
  const tic = () => {
    if (acabado) return;
    const q = Math.max(0, SEG - Math.floor((performance.now() - t0) / 1000));
    if (cifra.textContent !== String(q)) { cifra.textContent = q; if (q <= 10) { cifra.classList.add('fch-poco'); if (q) ctx.suena('clic'); } }
    if (q <= 0) return acaba();
    requestAnimationFrame(tic);
  };
  const pinta = () => { f = saca(); sitio.replaceChildren(cartulina(f)); i.value = ''; i.classList.remove('mal', 'bien'); i.readOnly = false; i.maxLength = String(f.r).length + 1; i.focus({ preventScroll: true }); };
  const responde = async () => {
    if (ocupado || acabado) return;
    const v = lee(i); if (v == null) return;
    if (!empezado) { empezado = true; t0 = performance.now(); requestAnimationFrame(tic); }
    if (v === f.r) { bien++; aciertosN.textContent = bien; bote(aciertosN, 6); ctx.suena('estrella', bien); pinta(); return; }
    ocupado = true; i.classList.add('mal'); ctx.suena('mal'); temblor(sitio, 5);
    fallos.push(f); if (estado(mazo, f.h.id)?.c !== 1) { pon(mazo, f.h.id, 1); guarda(); }
    sitio.querySelector('.cartulina')?.append(el('p', { class: 'dorso-ficha' }, marca(`${texto(f)} = **${num(f.r)}**`)));
    aLaVista(i);
    await espera(1100); ocupado = false; if (!acabado) pinta();
  };
  // en el minuto el reloj arranca al escribir la primera cifra
  i.addEventListener('input', () => {
    if (!empezado && i.value) { empezado = true; t0 = performance.now(); requestAnimationFrame(tic); }
    if (f && i.value.length >= String(f.r).length && !i.readOnly) responde();
  });
  i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); responde(); } });
  const acaba = () => {
    acabado = true; i.readOnly = true; i.blur(); ctx.suena('sube');
    const nuevo = bien > record;
    if (nuevo) { MEM.records[mazo] = bien; guarda(); }
    const estrellas = !record ? (bien >= 15 ? 3 : bien >= 8 ? 2 : bien ? 1 : 0) : nuevo ? 3 : bien >= record * 0.8 ? 2 : bien ? 1 : 0;
    const atasco = [...new Set(fallos.map(texto))].slice(0, 3).map((t) => `**${t}**`);
    ctx.fin(estrellas, [
      `**${bien}** bien en un minuto.`,
      nuevo ? (record ? `¡Récord nuevo! El anterior era ${record}.` : 'Ya tienes récord con este mazo.') : `Tu récord sigue en ${record}.`,
      atasco.length ? `Se te han atascado ${atasco.join(', ')}: van al cajón 1 del fichero.` : '',
    ].filter(Boolean).join(' '));
  };
  ctx.boton('✓', responde).classList.add('ok-ficha');
  pinta();
}

/* ================================================================ interfaz del motor */
export function generar(spec) {
  const d = structuredClone(spec);
  const g = spec.generar || {};
  d.modo ??= 'fichero';
  d.segundos ??= g.segundos;
  d.fichas ??= g.fichas ?? 10;
  return d;
}
export function ronda(d, ctx) {
  MEM = lee_();
  return (d.modo === 'minuto' ? minuto : tanda)(d, ctx);
}
// para las pruebas y para un futuro panel: los mazos y la estrategia de cada hecho
export const _prueba = { MAZOS, estrategia, eligeTanda, ficha, recomendado, cuenta };
