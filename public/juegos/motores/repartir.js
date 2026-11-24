// Motor «repartir»: Sociales, tema 2 (El cajón vota). La máquina que convierte votos en escaños.
//   predice   → con las palancas fijas, predices cuántos escaños saca cada partido y tiras de la palanca
//   cocientes → la tabla de D'Hondt: rellenas los huecos y eliges los números más grandes (cada uno, un escaño)
//   consigue  → sin cambiar un solo voto, mueves las palancas (escaños, método, umbral) hasta conseguir algo
//   cuesta    → Soria y Madrid: ¿cuántos votos cuesta un escaño en cada una?
//   pais      → toda la noche: provincia a provincia, hasta 350. ¿Llega alguien a 176? (se guarda para «176»)
import { el, num, azar, elige, barajar, suena } from './nucleo.js';
import { gsap } from './vendor/gsap.js';
import { espera, bote, temblor, chispasEn } from './efectos.js';
import { PARTIDOS, partido, iconoPartido, dhondt, leerNoche, guardarNoche } from './civica-comun.js';
import { hemiciclo, escanoSVG } from './civica-hemiciclo.js';

const T = '#1b1e3a';
const lento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const B = (t) => String(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const IDS = PARTIDOS.map((p) => p.id);
const corto = (id) => partido(id).corto;
const pct = (v, tot) => (tot ? ((100 * v) / tot).toFixed(1).replace('.', ',').replace(',0', '') : '0') + ' %';
const PRUEBA = new URLSearchParams(location.search).has('prueba');
let solucion = null;
if (PRUEBA) window.__sol = () => (typeof solucion === 'function' ? solucion() : solucion);
const METODOS = { exacto: 'Proporcional exacto', dhondt: "D'Hondt", ganador: 'El que gana se lo lleva todo' };
const METODO_CORTO = { exacto: 'Exacto', dhondt: "D'Hondt", ganador: 'Todo al que gana' };

/* =========================================================================== el reparto */
// votos: {parque, aparcamiento, pista, blanco}. Devuelve { escanos, fuera, cocientes, orden }
export function reparte(votos, N, metodo = 'dhondt', umbral = true) {
  const validos = IDS.reduce((a, id) => a + (votos[id] || 0), 0) + (votos.blanco || 0);
  const fuera = umbral ? IDS.filter((id) => (votos[id] || 0) < 0.03 * validos) : [];
  const dentro = IDS.filter((id) => !fuera.includes(id) && (votos[id] || 0) > 0);
  const escanos = Object.fromEntries(IDS.map((id) => [id, 0]));
  let cocientes = [], orden = [];
  if (!dentro.length || N < 1) return { escanos, fuera, cocientes, orden, validos };
  if (metodo === 'exacto') {
    const tot = dentro.reduce((a, id) => a + votos[id], 0);
    for (const id of dentro) escanos[id] = (N * votos[id]) / tot;
  } else if (metodo === 'ganador') {
    const g = dentro.reduce((a, b) => (votos[b] > votos[a] ? b : a));
    escanos[g] = N;
  } else {
    const r = dhondt(Object.fromEntries(dentro.map((id) => [id, votos[id]])), N);
    Object.assign(escanos, r.escanos); cocientes = r.cocientes; orden = r.cocientes.filter((c) => c.gana);
  }
  return { escanos, fuera, cocientes, orden, validos };
}
const entero = (x) => Math.abs(x - Math.round(x)) < 1e-9;

/* =========================================================================== provincias de juguete y datos reales */
const PROVINCIAS = ['Villacajón', 'Valdegoma', 'San Clip de la Sierra', 'Tijerales', 'Puente Celo', 'Sacapuntas del Río', 'Montecarpeta', 'Villarregla', 'Las Grapas', 'Torrecompás', 'Fuentetiza', 'Pegamento de Abajo', 'Castrolápiz', 'Navaestuche', 'Peñagrapadora', 'Valdecera', 'Cartulinas', 'Puerto Folio', 'Rotuladores', 'Laguna del Celo', 'Ceras del Monte', 'Villacuaderno', 'Archivadores', 'Hoyo del Clip', 'Plastilinares'];
const REALES = { soria: { nombre: 'Soria', escanos: 2, porEscano: [24000, 25000, 26000] }, madrid: { nombre: 'Madrid', escanos: 38, porEscano: [95000, 100000, 105000] }, barcelona: { nombre: 'Barcelona', escanos: 32, porEscano: [85000, 90000] } };

// generador con semilla: la misma noche da siempre el mismo hemiciclo
function semilla(n) { let a = n >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

// la noche entera: ~25 provincias que suman 350 escaños, cada una con su D'Hondt y su umbral del 3 %
let NOCHE = null;
export function nocheEntera() {
  if (NOCHE) return NOCHE;
  const guardada = leerNoche();
  const tuya = guardada?.votos && guardada?.provincia ? { nombre: guardada.provincia.nombre, escanos: guardada.provincia.escanos, votos: { parque: guardada.votos.parque, aparcamiento: guardada.votos.aparcamiento, pista: guardada.votos.pista, blanco: guardada.votos.blanco || 0 } } : null;
  const rnd = semilla(tuya ? hash(JSON.stringify(tuya)) : 2026);
  const r = (a, b) => a + rnd() * (b - a);
  for (let intento = 0; intento < 400; intento++) {
    // reparto de escaños entre provincias
    const tamanos = [36, 32, 16, 15, 12, 12, 11, 10, 10, 9, 8, 8, 8, 7, 7, 7, 6, 6, 6, 5, 5, 5, 4, 3, 2];
    const n0 = tuya ? tuya.escanos : 0;
    const lista = tamanos.slice(0, tuya ? 24 : 25).map((e, i) => ({ nombre: PROVINCIAS[i + 1] ?? `Provincia ${i + 1}`, escanos: e }));
    let falta = 350 - n0 - lista.reduce((a, p) => a + p.escanos, 0);
    for (let i = 0; falta !== 0; i = (i + 1) % 6) { lista[i].escanos += Math.sign(falta); falta -= Math.sign(falta); }
    // cuotas nacionales: si hay noche, el orden de tu provincia manda un poco
    const orden = tuya ? [...IDS].sort((a, b) => tuya.votos[b] - tuya.votos[a]) : [...IDS].sort(() => rnd() - 0.5);
    const cuota = { [orden[0]]: r(0.34, 0.39), [orden[1]]: r(0.29, 0.34), [orden[2]]: r(0.17, 0.24) };
    const provs = lista.map((p) => {
      const tot = p.escanos * r(60000, 85000);
      const v = {}; let s = 0;
      for (const id of IDS) { v[id] = cuota[id] * r(0.72, 1.28); s += v[id]; }
      for (const id of IDS) v[id] = Math.round((tot * v[id]) / s);
      v.blanco = Math.round(tot * r(0.008, 0.016));
      return { ...p, votos: v };
    });
    if (tuya) provs.unshift({ ...tuya, tuya: true });
    const total = Object.fromEntries(IDS.map((id) => [id, 0]));
    for (const p of provs) { p.escanosRep = reparte(p.votos, p.escanos, 'dhondt', true).escanos; for (const id of IDS) total[id] += p.escanosRep[id]; }
    const vals = IDS.map((id) => total[id]).sort((a, b) => b - a);
    if (vals[0] >= 176 || vals[0] - vals[1] < 6 || vals[2] < 25 || vals[0] + vals[2] < 176) continue;
    NOCHE = { provincias: provs, hemiciclo: total, tuya: !!tuya };
    guardarNoche({ hemiciclo: total });
    return NOCHE;
  }
  NOCHE = { provincias: [], hemiciclo: { parque: 150, aparcamiento: 128, pista: 72 }, tuya: false };
  guardarNoche({ hemiciclo: NOCHE.hemiciclo });
  return NOCHE;
}

/* =========================================================================== generar */
const usados = new Set();
export function generar(spec) {
  nocheEntera(); // la noche entera se calcula (y se guarda para «176») en cuanto se juega
  const d = structuredClone(spec);
  const g = typeof d.generar === 'object' ? d.generar : {};
  delete d.generar;
  d.provincia = elige(PROVINCIAS.slice(0, 12));
  if (d.modo === 'predice') {
    d.metodo = elige(g.metodos ?? ['dhondt']);
    d.umbral = true;
    if (d.metodo === 'exacto' || (d.metodo === 'ganador' && g.redondos)) {
      d.N = elige(g.escanos ?? [10]);
      const repartos = d.N === 10 ? [[50, 30, 20], [40, 40, 20], [60, 30, 10], [40, 30, 30], [50, 40, 10], [70, 20, 10]] : [[45, 35, 20], [40, 35, 25], [55, 25, 20], [50, 30, 20]];
      let pc; do { pc = elige(repartos); } while (usados.has(pc.join()) && usados.size < 5); usados.add(pc.join());
      const tot = elige([20000, 30000, 40000, 50000]);
      const ids = barajar(IDS);
      d.votos = Object.fromEntries(ids.map((id, i) => [id, (pc[i] * tot) / 100])); d.votos.blanco = 0;
    } else {
      const noche = leerNoche();
      if (g.noche && noche?.votos && noche?.provincia) {
        d.N = noche.provincia.escanos; d.provincia = noche.provincia.nombre; d.deLaNoche = true;
        d.votos = { parque: noche.votos.parque, aparcamiento: noche.votos.aparcamiento, pista: noche.votos.pista, blanco: noche.votos.blanco || 0 };
      } else {
        d.N = elige(g.escanos ?? [3, 4]);
        for (let k = 0; k < 500; k++) {
          const tot = azar(30, 90) * 1000, ids = barajar(IDS), a = 0.3 + Math.random() * 0.25, b = 0.2 + Math.random() * 0.2;
          d.votos = { [ids[0]]: Math.round(tot * a), [ids[1]]: Math.round(tot * b), [ids[2]]: Math.round(tot * (1 - a - b) * 0.98) };
          d.votos.blanco = Math.round(tot * 0.012);
          const c = reparte(d.votos, d.N, 'dhondt').cocientes;
          if (c[d.N - 1].valor - c[d.N].valor > tot * 0.01) break; // nada de empates de foto finish
        }
      }
    }
  } else if (d.modo === 'cocientes') {
    d.N = elige(g.escanos ?? [3, 4]);
    for (let k = 0; k < 800; k++) {
      const ids = barajar(IDS);
      d.votos = { [ids[0]]: 60 * azar(45, 80), [ids[1]]: 60 * azar(25, 50), [ids[2]]: 60 * azar(10, 30) };
      const r = dhondt(d.votos, d.N);
      const c = r.cocientes;
      const columnas = Math.min(d.N, 4);
      const vistos = new Set(); let repetidos = false;
      IDS.forEach((id) => { for (let j = 1; j <= columnas; j++) { const v = d.votos[id] / j; if (vistos.has(v)) repetidos = true; vistos.add(v); } });
      if (repetidos || c[d.N - 1].valor - c[d.N].valor < 30) continue;
      if (Object.values(r.escanos).some((e) => e > columnas)) continue;
      break;
    }
    d.columnas = Math.min(d.N, 4);
    const celdas = IDS.flatMap((id) => Array.from({ length: d.columnas - 1 }, (_, j) => `${id}:${j + 2}`));
    d.huecos = barajar(celdas).slice(0, g.huecos ?? 0);
  } else if (d.modo === 'consigue') Object.assign(d, generaConsigue(elige(g.objetivos ?? ['entra'])));
  else if (d.modo === 'cuesta') {
    const [a, b] = elige(g.pares ?? [['soria', 'madrid']]);
    d.a = { ...REALES[a], porEscano: undefined, cada: elige(REALES[a].porEscano) }; d.a.votos = d.a.cada * d.a.escanos;
    d.b = { ...REALES[b], porEscano: undefined, cada: elige(REALES[b].porEscano) }; d.b.votos = d.b.cada * d.b.escanos;
  }
  return d;
}
function generaConsigue(obj) {
  const d = { objetivo: obj, metodo: 'dhondt', umbral: true };
  for (let k = 0; k < 2000; k++) {
    const ids = barajar(IDS), tot = azar(40, 120) * 1000;
    if (obj === 'entra' || obj === 'umbral') {
      const peque = obj === 'umbral' ? 0.021 + Math.random() * 0.007 : 0.06 + Math.random() * 0.06;
      const a = 0.4 + Math.random() * 0.15;
      d.votos = { [ids[0]]: Math.round(tot * a), [ids[1]]: Math.round(tot * (1 - a - peque - 0.012)), [ids[2]]: Math.round(tot * peque) };
      d.votos.blanco = Math.round(tot * 0.012);
      d.quien = ids[2]; d.N = azar(2, 3);
      const sinUmbral = obj === 'umbral';
      let min = 0;
      for (let n = 1; n <= 40; n++) if (reparte(d.votos, n, 'dhondt', !sinUmbral).escanos[d.quien] >= 1) { min = n; break; }
      if (!min || min <= d.N || min > 34) continue;
      if (obj === 'umbral' && reparte(d.votos, 40, 'dhondt', true).escanos[d.quien] > 0) continue;
      d.minimo = min;
      d.bloqueadas = obj === 'entra' ? ['umbral'] : [];
      return d;
    }
    if (obj === 'mayoria') {
      const a = 0.37 + Math.random() * 0.06, b = 0.3 + Math.random() * 0.06;
      d.votos = { [ids[0]]: Math.round(tot * a), [ids[1]]: Math.round(tot * b), [ids[2]]: Math.round(tot * (1 - a - b - 0.012)) };
      d.votos.blanco = Math.round(tot * 0.012);
      d.quien = ids[0]; d.N = azar(8, 12);
      const r = reparte(d.votos, d.N, 'dhondt', true).escanos[d.quien];
      if (r > d.N / 2) continue;
      d.soluciones = []; for (let n = 1; n <= 40; n++) if (reparte(d.votos, n, 'dhondt', true).escanos[d.quien] > n / 2) d.soluciones.push(n);
      d.bloqueadas = [];
      return d;
    }
  }
  throw new Error('no he podido preparar el reto');
}

/* =========================================================================== la máquina (piezas comunes) */
function maquina(d, ctx, { bloqueadas = [], prediccion = false, alCambiar } = {}) {
  const est = { N: d.N, metodo: d.metodo ?? 'dhondt', umbral: d.umbral ?? true, pred: Object.fromEntries(IDS.map((id) => [id, 0])) };
  const validos = () => IDS.reduce((a, id) => a + d.votos[id], 0) + (d.votos.blanco || 0);
  const max = Math.max(...IDS.map((id) => d.votos[id]));
  // las filas de votos
  const filas = IDS.map((id) => {
    const P = partido(id);
    const barra = el('span', { class: 'rp-barra', style: { width: Math.max(2, (100 * d.votos[id]) / max) + '%' } });
    const fila = el('div', { class: 'rp-fila', 'data-p': id },
      el('span', { class: 'rp-ic', html: iconoPartido(id, 34) }),
      el('span', { class: 'rp-nom' }, el('b', { text: P.corto }), el('small', { class: 'rp-pc', text: pct(d.votos[id], validos()) })),
      el('span', { class: 'rp-pista' }, barra, el('span', { class: 'rp-marca', 'aria-hidden': 'true' }), el('span', { class: 'rp-num', text: num(d.votos[id]) })));
    if (prediccion) {
      const n = el('output', { class: 'rp-pred-n', text: '0' });
      const mueve = (k) => { const libre = est.N - sumaPred(); if (k > 0 && libre <= 0) return temblor(quedan, 5); est.pred[id] = Math.max(0, est.pred[id] + k); n.textContent = String(est.pred[id]); suena('clic'); pintaQuedan(); };
      fila.append(el('span', { class: 'rp-pred' }, el('button', { type: 'button', class: 'tecla rp-menos', 'aria-label': `Un escaño menos para ${P.nombre}`, text: '−', onclick: () => mueve(-1) }), n, el('button', { type: 'button', class: 'tecla rp-mas', 'aria-label': `Un escaño más para ${P.nombre}`, text: '+', onclick: () => mueve(1) })));
    }
    return fila;
  });
  const sumaPred = () => IDS.reduce((a, id) => a + est.pred[id], 0);
  const quedan = el('p', { class: 'rp-quedan', 'aria-live': 'polite' });
  const pintaQuedan = () => { const l = est.N - sumaPred(); quedan.innerHTML = l ? `Te quedan <b>${l}</b> ${l === 1 ? 'escaño' : 'escaños'} por repartir` : 'Todos repartidos. Ahora, a la máquina: pulsa «Repartir».'; quedan.classList.toggle('listo', !l); alCambiar?.(); };
  const blanco = d.votos.blanco ? el('p', { class: 'rp-blanco', text: `En blanco: ${num(d.votos.blanco)} (cuentan para el 3 %, no para los escaños)` }) : null;
  const votosNodo = el('div', { class: 'rp-votos' + (prediccion ? ' con-pred' : '') }, el('div', { class: 'rp-cab' }, el('b', { text: `Votos en ${d.provincia}` }), prediccion && el('small', { text: 'Tu predicción' })), el('div', { class: 'rp-filas' }, filas), blanco, prediccion && quedan);
  // las palancas
  const bloq = (k) => bloqueadas.includes(k);
  const nEsc = el('output', { class: 'rp-esc-n', text: String(est.N) });
  const escMenos = el('button', { type: 'button', class: 'tecla rp-esc-menos', 'aria-label': 'Un escaño menos', text: '−', disabled: bloq('escanos'), onclick: () => cambia({ N: Math.max(1, est.N - 1) }) });
  const escMas = el('button', { type: 'button', class: 'tecla rp-esc-mas', 'aria-label': 'Un escaño más', text: '+', disabled: bloq('escanos'), onclick: () => cambia({ N: Math.min(40, est.N + 1) }) });
  const rango = el('input', { type: 'range', class: 'rp-rango', min: '1', max: '40', step: '1', value: String(est.N), 'aria-label': 'Número de escaños', disabled: bloq('escanos'), oninput: (e) => cambia({ N: +e.target.value }) });
  const metBotones = Object.keys(METODOS).map((m) => el('button', { type: 'button', class: 'rp-met', 'data-metodo': m, 'aria-pressed': String(m === est.metodo), disabled: bloq('metodo'), onclick: () => cambia({ metodo: m }) }, el('span', { text: METODO_CORTO[m] })));
  const umbralBtn = el('button', { type: 'button', class: 'rp-umbral', role: 'switch', 'aria-checked': String(est.umbral), disabled: bloq('umbral'), onclick: () => cambia({ umbral: !est.umbral }) }, el('span', { class: 'rp-interruptor', 'aria-hidden': 'true' }), el('span', { class: 'rp-umbral-t' }));
  const candado = (k) => (bloq(k) ? el('small', { class: 'rp-fija', text: 'fija' }) : null);
  const palancas = el('div', { class: 'rp-palancas' },
    el('div', { class: 'rp-palanca' }, el('b', {}, 'Escaños ', candado('escanos')), el('div', { class: 'rp-stepper' }, escMenos, nEsc, escMas, bloq('escanos') ? null : rango)),
    el('div', { class: 'rp-palanca' }, el('b', {}, 'Método ', candado('metodo')), el('div', { class: 'rp-metodos', role: 'group', 'aria-label': 'Método' }, metBotones)),
    el('div', { class: 'rp-palanca' }, el('b', {}, 'Umbral ', candado('umbral')), umbralBtn));
  // la salida: hemiciclo
  const hemi = hemiciclo(est.N, { etiqueta: `Escaños de ${d.provincia}` });
  const leyendaNodo = el('ul', { class: 'leyenda-hemi rp-leyenda' });
  const nota = el('p', { class: 'rp-nota', 'aria-live': 'polite' });
  const tiques = el('ol', { class: 'rp-tiques', 'aria-label': 'Orden de los escaños' });
  const palancaSVG = el('div', { class: 'rp-mango', 'aria-hidden': 'true', html: `<svg viewBox="0 0 60 150"><rect x="20" y="96" width="20" height="50" rx="6" fill="#9aa3b5" stroke="${T}" stroke-width="4"/><g class="rp-brazo"><rect x="25" y="20" width="10" height="90" rx="5" fill="#c9cfdd" stroke="${T}" stroke-width="4"/><circle cx="30" cy="20" r="16" fill="#e8417a" stroke="${T}" stroke-width="4"/><circle cx="25" cy="14" r="4" fill="#fff" opacity=".7"/></g></svg>` });
  const salida = el('div', { class: 'rp-salida' }, el('div', { class: 'rp-cab' }, el('b', { text: 'Escaños' })), hemi.nodo, leyendaNodo, tiques, nota);
  const nodo = el('div', { class: 'rp-maquina' }, el('div', { class: 'rp-izq' }, votosNodo, palancas), salida, palancaSVG);
  const pintaPalancas = () => {
    nEsc.textContent = String(est.N); rango.value = String(est.N);
    metBotones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.metodo === est.metodo)));
    umbralBtn.setAttribute('aria-checked', String(est.umbral));
    umbralBtn.querySelector('.rp-umbral-t').textContent = est.umbral ? 'Del 3 %: sí' : 'Sin umbral';
    const tot = validos();
    filas.forEach((f) => { const m = f.querySelector('.rp-marca'); m.hidden = !est.umbral; m.style.left = Math.min(100, (100 * 0.03 * tot) / max) + '%'; });
    filas.forEach((f) => f.classList.toggle('fuera', est.umbral && d.votos[f.dataset.p] < 0.03 * tot));
    if (prediccion) pintaQuedan();
  };
  // pinta el resultado de las palancas actuales
  const resultado = (anima = true) => {
    const r = reparte(d.votos, est.N, est.metodo, est.umbral);
    if (hemi.n !== est.N) hemi.cambiaN(est.N);
    hemi.pinta(Object.fromEntries([...IDS.map((id) => [id, r.escanos[id]])]), { anima });
    leyendaNodo.replaceChildren(...IDS.map((id) => el('li', { 'data-p': id, html: `${escanoSVG(id, 20)}<span>${corto(id)}</span><b>${fmt(r.escanos[id])}</b>` })));
    const partidas = est.metodo === 'exacto' && IDS.some((id) => !entero(r.escanos[id]));
    nota.innerHTML = partidas ? 'Hay <b>sillas partidas</b>: un escaño no se puede repartir a trozos.' : r.fuera.length ? `${r.fuera.map(corto).join(' y ')} no ${r.fuera.length > 1 ? 'llegan' : 'llega'} al 3 %: fuera del reparto.` : '';
    return r;
  };
  const cambia = (c) => { Object.assign(est, c); suena('clic'); pintaPalancas(); if (!prediccion) { resultado(true); alCambiar?.(); } };
  // tirar de la palanca: el brazo baja y salen los escaños (con su tique en D'Hondt)
  const tira = async () => {
    suena('coge');
    if (!lento()) await gsap.timeline().to(palancaSVG.querySelector('.rp-brazo'), { rotation: 70, svgOrigin: '30 110', duration: 0.25, ease: 'power2.in' }).to(palancaSVG.querySelector('.rp-brazo'), { rotation: 0, svgOrigin: '30 110', duration: 0.5, ease: 'elastic.out(1,0.4)' });
    const r = reparte(d.votos, est.N, est.metodo, est.umbral);
    tiques.replaceChildren();
    if (est.metodo === 'dhondt' && r.orden.length && r.orden.length <= 12) {
      for (const [k, c] of r.orden.entries()) {
        const t = el('li', { 'data-p': c.id }, el('span', { class: 'k', text: `${k + 1}.º` }), el('span', { html: escanoSVG(c.id, 16) }), el('span', { text: c.divisor === 1 ? num(c.total) : `${num(c.total)} ÷ ${c.divisor}` }));
        tiques.append(t); suena('pon');
        if (!lento()) { gsap.from(t, { y: -16, opacity: 0, duration: 0.25, ease: 'back.out(2)' }); await espera(Math.max(90, 520 - est.N * 40)); }
      }
    }
    suena('sello');
    resultado(true);
    bote(salida, 6);
    return r;
  };
  pintaPalancas();
  return { nodo, est, resultado, tira, filas, salida, hemi, nota, tiques, quedan };
}
const fmt = (v) => (entero(v) ? String(Math.round(v)) : v.toFixed(1).replace('.', ','));

/* =========================================================================== ronda */
export function ronda(d, ctx) {
  const m = { predice, cocientes, consigue, cuesta, pais }[d.modo];
  if (!m) throw new Error(`no encuentro el modo «${d.modo}». Si el juego se acaba de actualizar, recarga la página.`);
  return m(d, ctx);
}

// ---------------------------------------------------------------- predecir
function predice(d, ctx) {
  const real = reparte(d.votos, d.N, d.metodo, d.umbral);
  const quien = IDS.reduce((a, b) => (d.votos[b] > d.votos[a] ? b : a));
  ctx.reto(`Hay **${d.N} escaños**. ¿Cuántos saca cada partido con ${d.metodo === 'exacto' ? 'el reparto **exacto**' : d.metodo === 'ganador' ? '**«el que gana se lo lleva todo»**' : "**D'Hondt**"}?`);
  ctx.pista(d.deLaNoche ? `Son los votos de ${d.provincia}, la provincia que contaste en La noche del escrutinio. Predice con + y − y luego pulsa «Repartir».` : 'Predice con + y −. Luego pulsa «Repartir» y compara.');
  let boton = null, M = null;
  M = maquina(d, ctx, { bloqueadas: ['escanos', 'metodo', 'umbral'], prediccion: true, alCambiar: () => { if (boton && M) boton.disabled = IDS.reduce((a, id) => a + M.est.pred[id], 0) !== d.N; } });
  ctx.escenario.append(M.nodo);
  M.hemi.pinta({}, { anima: false });
  M.salida.classList.add('apagada');
  boton = ctx.boton('Repartir', async () => {
    boton.disabled = true;
    M.filas.forEach((f) => f.querySelectorAll('button').forEach((b) => (b.disabled = true)));
    M.salida.classList.remove('apagada');
    solucion = null;
    await M.tira();
    const malos = IDS.reduce((a, id) => a + Math.abs(M.est.pred[id] - real.escanos[id]), 0) / 2;
    M.filas.forEach((f) => { const id = f.dataset.p; f.classList.add(M.est.pred[id] === real.escanos[id] ? 'acierto' : 'fallo'); });
    const lista = IDS.map((id) => `${corto(id)} ${real.escanos[id]}`).join(', ');
    let txt;
    if (d.metodo === 'exacto') txt = `**${lista}.** Cada partido saca su parte: ${IDS.map((id) => `${pct(d.votos[id], real.validos)} de ${d.N} = ${real.escanos[id]}`).join('; ')}.`;
    else if (d.metodo === 'ganador') { const resto = IDS.filter((id) => id !== quien).reduce((a, id) => a + d.votos[id], 0); txt = `**${corto(quien)} se lo lleva todo** (${d.N} de ${d.N}) con el ${pct(d.votos[quien], real.validos)} de los votos. Los ${num(resto)} votantes de los otros partidos se quedan **sin nadie** que los represente.`; }
    else txt = `**${lista}.** D'Hondt da los escaños uno a uno al número más grande de la tabla: ${real.orden.map((c, k) => `${k + 1}.º ${corto(c.id)} (${c.divisor === 1 ? num(c.total) : num(c.total) + ' ÷ ' + c.divisor})`).join(', ')}.`;
    const estrellas = malos === 0 ? 3 : malos === 1 ? 1 : 0;
    if (malos) txt = `Tú habías puesto ${IDS.map((id) => `${corto(id)} ${M.est.pred[id]}`).join(', ')}. ` + txt;
    ctx.fin(estrellas, txt);
  });
  boton.disabled = true;
  const [a] = [...IDS].sort((x, y) => d.votos[y] - d.votos[x]);
  ctx.pistas(d.metodo === 'exacto' ? [
    { texto: `Con el reparto exacto, cada partido saca **la misma parte** de los escaños que de los votos.` },
    { texto: `${corto(a)} tiene el ${pct(d.votos[a], real.validos)} de los votos. ¿Cuánto es eso de ${d.N} escaños?` },
    { texto: `${corto(a)}: **${real.escanos[a]}** escaños. Haz lo mismo con los otros dos.` },
  ] : d.metodo === 'ganador' ? [
    { texto: 'Con este método solo importa **quién tiene más votos**.' },
    { texto: `Mira las barras: ¿quién es el más votado? Ese se lo lleva **todo**.` },
    { texto: `${corto(quien)} se queda los **${d.N}**. Los demás, cero.` },
  ] : [
    { texto: 'Divide los votos de cada partido entre 1, entre 2, entre 3… Los números más grandes se llevan los escaños.' },
    { texto: `Los votos entre 2: ${IDS.map((id) => `${corto(id)} ${num(Math.round(d.votos[id] / 2))}`).join(', ')}.` },
    { texto: `El 1.er escaño es para ${corto(real.orden[0].id)} y el 2.º para ${corto(real.orden[1]?.id ?? real.orden[0].id)}.` },
  ]);
  solucion = { modo: 'predice', reparto: real.escanos };
}

// ---------------------------------------------------------------- la tabla de cocientes
function cocientes(d, ctx) {
  const cols = d.columnas, r = dhondt(d.votos, d.N);
  const gana = new Set(r.cocientes.filter((c) => c.gana).map((c) => `${c.id}:${c.divisor}`));
  const huecos = new Set(d.huecos);
  ctx.reto(`**${d.N} escaños**. ${huecos.size ? 'Rellena los huecos y elige' : 'Elige'} los **${d.N} números más grandes** de la tabla.`);
  ctx.pista('Cada número elegido es un escaño para el partido de su fila.');
  const elegidas = new Set(), escritos = {};
  const contador = el('p', { class: 'rp-quedan' });
  const pintaCont = () => { contador.innerHTML = `Elegidos: <b>${elegidas.size}</b> de ${d.N}`; contador.classList.toggle('listo', elegidas.size === d.N); };
  const filas = IDS.map((id) => el('tr', { 'data-p': id },
    el('th', { scope: 'row' }, el('span', { class: 'rp-ic', html: iconoPartido(id, 30) }), el('span', { text: corto(id) })),
    ...Array.from({ length: cols }, (_, j) => {
      const k = `${id}:${j + 1}`, v = d.votos[id] / (j + 1);
      if (huecos.has(k)) {
        const inp = el('input', { class: 'campo-num rp-hueco', 'data-k': k, inputmode: 'numeric', autocomplete: 'off', maxlength: 6, 'aria-label': `${corto(id)} entre ${j + 1}` });
        const cel = el('div', { class: 'rp-celda con-hueco', role: 'button', tabindex: '0', 'data-k': k, 'aria-pressed': 'false', 'aria-label': `Elegir ${corto(id)} entre ${j + 1}`, onclick: (e) => { if (e.target === inp) return; toca(k, cel); }, onkeydown: (e) => { if (e.target === cel && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toca(k, cel); } } }, inp);
        // al pulsar ✓ (o salir del hueco con algo escrito), el número queda escrito en la celda y ya se puede elegir
        const escribe = () => { const v = inp.value.trim(); if (v === '' || !inp.isConnected || cerrado) return; escritos[k] = Number(v); cel.classList.add('escrita'); cel.replaceChildren(num(Number(v))); cel.setAttribute('aria-label', `${num(Number(v))}: elegir ${corto(id)} entre ${j + 1}`); suena('pon'); };
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); escribe(); cel.focus({ preventScroll: true }); } });
        inp.addEventListener('blur', () => setTimeout(escribe, 80));
        return el('td', {}, cel);
      }
      const cel = el('div', { class: 'rp-celda', role: 'button', tabindex: '0', 'data-k': k, 'aria-pressed': 'false', text: num(v), onclick: () => toca(k, cel), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toca(k, cel); } } });
      return el('td', {}, cel);
    })));
  const tabla = el('table', { class: 'rp-tabla' }, el('thead', {}, el('tr', {}, el('th', { text: 'Votos' }), ...Array.from({ length: cols }, (_, j) => el('th', { scope: 'col', text: j === 0 ? '÷ 1' : `÷ ${j + 1}` })))), el('tbody', {}, filas));
  const hemi = hemiciclo(d.N, { etiqueta: `Escaños de ${d.provincia}` });
  hemi.pinta({}, { anima: false });
  const leyendaNodo = el('ul', { class: 'leyenda-hemi rp-leyenda' });
  ctx.escenario.append(el('div', { class: 'rp-cocientes' }, el('div', { class: 'rp-tabla-caja' }, tabla, contador), el('div', { class: 'rp-salida apagada' }, el('div', { class: 'rp-cab' }, el('b', { text: `Escaños de ${d.provincia}` })), hemi.nodo, leyendaNodo)));
  pintaCont();
  let cerrado = false;
  const toca = (k, cel) => {
    if (cerrado) return;
    if (elegidas.has(k)) elegidas.delete(k);
    else { if (elegidas.size >= d.N) { temblor(contador, 5); return ctx.aviso(`Solo hay ${d.N} escaños: quita uno antes de elegir otro.`, true); } elegidas.add(k); }
    ctx.aviso('');
    cel.setAttribute('aria-pressed', String(elegidas.has(k))); suena('clic');
    pintaCont();
  };
  const top = r.cocientes.slice(0, d.N);
  ctx.pistas([
    { texto: huecos.size ? 'Para rellenar un hueco, divide los votos de esa fila entre el número de la columna.' : 'Busca primero el número más grande de **toda** la tabla, no solo de la primera columna.' },
    { texto: `El más grande es ${num(top[0].valor)} (${corto(top[0].id)}). El siguiente, ${num(top[1].valor)}. Compara también con la columna ÷ 2.` },
    { texto: `Los ${d.N} más grandes empiezan así: ${top.slice(0, Math.max(1, d.N - 1)).map((c) => num(c.valor)).join(', ')}…` },
  ]);
  solucion = { modo: 'cocientes', celdas: [...gana], huecos: Object.fromEntries([...huecos].map((k) => { const [id, j] = k.split(':'); return [k, d.votos[id] / +j]; })) };
  const boton = ctx.boton('Repartir', async () => {
    const vals = {};
    for (const k of huecos) { const inp = tabla.querySelector(`input[data-k="${k}"]`); if (inp && inp.value.trim() !== '') escritos[k] = Number(inp.value.trim()); if (escritos[k] == null) return ctx.aviso('Rellena primero los huecos de la tabla (escribe y pulsa ✓).', true); vals[k] = escritos[k]; }
    if (elegidas.size !== d.N) return ctx.aviso(`Elige ${d.N} números: ${elegidas.size < d.N ? `te faltan ${d.N - elegidas.size}` : 'te sobran'}.`, true);
    boton.disabled = true; solucion = null;
    cerrado = true; tabla.classList.add('cerrada'); tabla.querySelectorAll('input').forEach((x) => (x.readOnly = true));
    let malHuecos = 0, txtH = '';
    for (const k of huecos) { const [id, j] = k.split(':'), ok = d.votos[id] / +j; const cel = tabla.querySelector(`.rp-celda[data-k="${k}"]`); if (vals[k] !== ok) { malHuecos++; txtH += `${num(d.votos[id])} ÷ ${j} = ${num(ok)} (no ${num(vals[k])}). `; cel.classList.add('hueco-mal'); cel.replaceChildren(el('s', { text: num(vals[k]) }), ' ', num(ok)); } else cel.classList.add('hueco-bien'); }
    const malElegidas = [...elegidas].filter((k) => !gana.has(k)).length;
    // la máquina pone los números de orden en la tabla y llena el hemiciclo
    for (const [n, c] of top.entries()) {
      const cel = tabla.querySelector(`.rp-celda[data-k="${c.id}:${c.divisor}"]`);
      cel.classList.add('gana'); cel.append(el('i', { class: 'rp-orden', text: String(n + 1) }));
      suena('pon'); if (!lento()) { bote(cel, 6); await espera(260); }
    }
    tabla.querySelectorAll('.rp-celda[aria-pressed="true"]').forEach((c) => c.classList.add(gana.has(c.dataset.k) ? 'acierto' : 'fallo'));
    const sal = ctx.escenario.querySelector('.rp-salida'); sal.classList.remove('apagada');
    hemi.pinta(r.escanos);
    leyendaNodo.replaceChildren(...IDS.map((id) => el('li', { 'data-p': id, html: `${escanoSVG(id, 20)}<span>${corto(id)}</span><b>${r.escanos[id]}</b>` })));
    const errores = malHuecos + malElegidas;
    let txt = `Los ${d.N} más grandes: ${top.map((c) => num(c.valor)).join(', ')}. Así que **${IDS.map((id) => `${corto(id)} ${r.escanos[id]}`).join(', ')}**.`;
    if (malElegidas) { const sobra = [...elegidas].filter((k) => !gana.has(k)).map((k) => { const [id, j] = k.split(':'); return num(d.votos[id] / +j); }); txt = `Elegiste ${sobra.join(' y ')}, pero ${malElegidas === 1 ? 'había uno más grande' : 'había otros más grandes'} sin elegir. ` + txt; if (IDS.every((id) => [...elegidas].some((k) => k.startsWith(id + ':'))) && IDS.some((id) => r.escanos[id] === 0)) txt += ' Ojo: no hace falta darle un escaño a cada partido.'; }
    if (malHuecos) txt = txtH + txt;
    const estrellas = errores === 0 ? 3 : errores === 1 ? 1 : 0;
    ctx.fin(estrellas, txt);
  });
}

// ---------------------------------------------------------------- consíguelo con las palancas
function consigue(d, ctx) {
  const Q = partido(d.quien);
  const total = IDS.reduce((a, id) => a + d.votos[id], 0) + d.votos.blanco;
  const texto = { entra: `Consigue que **${Q.nombre}** saquen un escaño **sin cambiar un solo voto**. Con los menos escaños posibles.`, umbral: `${Q.nombre} tienen el ${pct(d.votos[d.quien], total)} de los votos. Consigue que **saquen un escaño** sin cambiar un solo voto. Con los menos escaños posibles.`, mayoria: `${Q.nombre} tienen el ${pct(d.votos[d.quien], total)} de los votos. Consigue que tengan **más de la mitad de los escaños**.` }[d.objetivo];
  ctx.reto(texto);
  ctx.pista('Mueve las palancas: el hemiciclo cambia al momento. Cuando lo tengas, pulsa «Lo tengo».');
  const M = maquina(d, ctx, { bloqueadas: d.bloqueadas });
  ctx.escenario.append(M.nodo);
  M.resultado(false);
  const logrado = () => { const r = reparte(d.votos, M.est.N, M.est.metodo, M.est.umbral); return d.objetivo === 'mayoria' ? r.escanos[d.quien] > M.est.N / 2 : r.escanos[d.quien] >= 1; };
  let fallidos = 0;
  ctx.boton('Lo tengo', () => {
    const { N, metodo, umbral } = M.est;
    if (metodo === 'exacto') return ctx.aviso('Con el reparto exacto salen sillas partidas, y la ley no parte escaños. Elige otro método.', true);
    const r = reparte(d.votos, N, metodo, umbral);
    if (!logrado()) {
      temblor(M.salida, 6); suena('mal'); fallidos++;
      return ctx.aviso(d.objetivo === 'mayoria' ? `Todavía no: ${corto(d.quien)} tiene ${fmt(r.escanos[d.quien])} de ${N}, y la mitad son ${fmt(N / 2)}.` : r.fuera.includes(d.quien) ? `${corto(d.quien)} ni siquiera entra en el reparto: no llega al 3 %.` : `Todavía no: ${corto(d.quien)} tiene 0 escaños.`, true);
    }
    solucion = null;
    let estrellas = 3, txt = '';
    if (d.objetivo === 'mayoria') {
      const otra = metodo === 'ganador' ? (d.soluciones.length ? `Con D'Hondt también se puede: con ${d.soluciones.slice(0, 3).join(', ')} escaños` : `Con D'Hondt no hay manera`) : '«El que gana se lo lleva todo» también lo consigue, con cualquier número de escaños';
      txt = `**Mayoría con el ${pct(d.votos[d.quien], total)} de los votos.** ${metodo === 'ganador' ? 'Todos los escaños para el que gana.' : `Con ${N} escaños, D'Hondt le da ${r.escanos[d.quien]}: cuantos menos escaños tiene una provincia, más premia al grande.`} ${otra}. Mismos votos, distinto Congreso: las reglas importan.`;
    } else {
      const min = d.minimo;
      if (metodo === 'ganador') { estrellas = 3; }
      if (N > min) { estrellas = 2; txt = `Lo has conseguido, pero con **${min}** escaños ya bastaba. `; }
      else txt = `**Justo: ${N} escaños.** Con ${N - 1} no ${d.objetivo === 'umbral' ? 'llegaban' : 'llegaban'}. `;
      txt += d.objetivo === 'umbral' ? `${corto(d.quien)} tenía el ${pct(d.votos[d.quien], total)}: con el umbral del 3 % se quedaba fuera aunque hubiera 40 escaños. Hay que **quitar el umbral** y luego dar muchos escaños: un partido tan pequeño solo tendría sitio en una provincia enorme, como Madrid (38). En el Congreso, el umbral es del 3 % en cada provincia.` : `Cuantos más escaños reparte una provincia, más fácil es que entren los partidos pequeños. Por eso en Madrid (38) entran más partidos que en Soria (2).`;
    }
    if (fallidos) { estrellas = Math.max(1, estrellas - fallidos); txt = `Mira bien el hemiciclo antes de decir «lo tengo»: ${fallidos === 1 ? 'una vez' : fallidos + ' veces'} no lo tenías. ` + txt; }
    ctx.fin(estrellas, txt);
  });
  ctx.pistas(d.objetivo === 'mayoria' ? [
    { texto: 'Hay dos palancas que pueden ayudar: el **método** y el **número de escaños**.' },
    { texto: 'Prueba «el que gana se lo lleva todo». Y con D\'Hondt, prueba provincias con **muy pocos** escaños.' },
    { texto: d.soluciones.length ? `Con D'Hondt, prueba con **${d.soluciones[0]}** ${d.soluciones[0] === 1 ? 'escaño' : 'escaños'}.` : 'Con D\'Hondt no se puede: usa el otro método.' },
  ] : d.objetivo === 'umbral' ? [
    { texto: `Mira la raya del 3 %: ¿dónde queda la barra de ${corto(d.quien)}?` },
    { texto: `Mientras haya umbral, ${corto(d.quien)} no entra en el reparto. Quítalo y luego sube los escaños.` },
    { texto: `Sin umbral, hacen falta **${d.minimo}** escaños.` },
  ] : [
    { texto: `Con ${d.N} escaños no hay sitio para ${corto(d.quien)}. ¿Qué palanca da más sitio?` },
    { texto: 'Sube los escaños de uno en uno y mira cuándo aparece su escaño.' },
    { texto: `Prueba con un número entre ${Math.max(d.N + 1, d.minimo - 3)} y ${d.minimo + 2}.` },
  ]);
  solucion = d.objetivo === 'mayoria' ? { modo: 'consigue', metodo: 'ganador', escanos: M.est.N, umbral: true } : { modo: 'consigue', metodo: 'dhondt', escanos: d.minimo, umbral: d.objetivo !== 'umbral' };
}

// ---------------------------------------------------------------- ¿cuánto cuesta un escaño?
function cuesta(d, ctx) {
  const { a, b } = d;
  ctx.reto(`¿Cuántos votos «cuesta» un escaño en **${a.nombre}** (${a.escanos}) y en **${b.nombre}** (${b.escanos})?`);
  ctx.pista(`En ${a.nombre} votan unas ${num(a.votos)} personas; en ${b.nombre}, unas ${num(b.votos)}. Reparte los votos entre los escaños: vale una buena estimación.`);
  const campo = (k, P) => el('label', { class: 'rp-campo' }, el('span', { html: `<b>${P.nombre}</b>: ${num(P.votos)} votos ÷ ${P.escanos} escaños ≈` }), el('input', { class: 'campo-num', 'data-campo': k, inputmode: 'numeric', autocomplete: 'off', maxlength: 8, 'aria-label': `Votos por escaño en ${P.nombre}` }));
  const fa = campo('a', a), fb = campo('b', b);
  const columnas = el('div', { class: 'rp-columnas', 'aria-hidden': 'true' });
  ctx.escenario.append(el('div', { class: 'rp-cuesta' }, el('div', { class: 'rp-cuesta-campos' }, fa, fb), columnas));
  setTimeout(() => fa.querySelector('input').focus({ preventScroll: true }), 300);
  fa.querySelector('input').addEventListener('keydown', (e) => { if (e.key === 'Enter') fb.querySelector('input').focus(); });
  fb.querySelector('input').addEventListener('keydown', (e) => { if (e.key === 'Enter') boton.click(); });
  ctx.pistas([
    { texto: 'Votos por escaño = votos ÷ escaños. Si hay 2 escaños, la mitad de los votos para cada uno.' },
    { texto: `${a.nombre}: ${num(a.votos)} ÷ ${a.escanos}. ${b.nombre}: prueba si ${b.escanos} × ${num(100000)} se acerca a ${num(b.votos)}.` },
    { texto: `En ${a.nombre} sale **${num(a.cada)}**. Haz la otra igual.` },
  ]);
  solucion = { modo: 'cuesta', a: a.cada, b: b.cada };
  const boton = ctx.boton('Comprobar', async () => {
    const lee = (f) => { const v = f.querySelector('input').value.trim(); return v === '' ? null : Number(v); };
    const va = lee(fa), vb = lee(fb);
    if (va == null || vb == null) return ctx.aviso('Escribe las dos estimaciones.', true);
    boton.disabled = true; solucion = null;
    const cerca = (v, ok) => Math.abs(v - ok) <= ok * 0.1;
    const okA = cerca(va, a.cada), okB = cerca(vb, b.cada);
    fa.classList.add(okA ? 'bien' : 'mal'); fb.classList.add(okB ? 'bien' : 'mal');
    // dos columnas: lo que hay detrás de cada escaño
    const maxV = Math.max(a.cada, b.cada);
    columnas.replaceChildren(...[a, b].map((P) => el('div', { class: 'rp-col' }, el('div', { class: 'rp-col-barra', style: { height: Math.max(8, (170 * P.cada) / maxV) + 'px' } }, el('b', { text: num(P.cada) })), el('span', { class: 'rp-col-esc', html: escanoSVG('vacio', 34) }), el('span', { text: P.nombre }))));
    if (!lento()) gsap.from(columnas.querySelectorAll('.rp-col-barra'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.7, ease: 'back.out(1.4)', stagger: 0.2 });
    suena('sello');
    const veces = Math.round(Math.max(a.cada, b.cada) / Math.min(a.cada, b.cada));
    const barato = a.cada < b.cada ? a : b, caro = barato === a ? b : a;
    let txt = `En ${a.nombre}, ${num(a.votos)} ÷ ${a.escanos} = **${num(a.cada)}** votos por escaño. En ${b.nombre}, ${num(b.votos)} ÷ ${b.escanos} = **${num(b.cada)}**. `;
    txt += `Un escaño de ${caro.nombre} necesita unas ${veces} veces más votos: cada voto de ${barato.nombre} «pesa» más. Pasa porque toda provincia tiene un mínimo de 2 escaños (Ceuta y Melilla, 1), tenga la gente que tenga.`;
    if (!okA || !okB) txt = `${!okA ? `En ${a.nombre} pusiste ${num(va)}. ` : ''}${!okB ? `En ${b.nombre} pusiste ${num(vb)}. ` : ''}` + txt;
    ctx.fin(okA && okB ? 3 : okA || okB ? 1 : 0, txt);
  });
}

// ---------------------------------------------------------------- la noche entera
function pais(d, ctx) {
  const N = nocheEntera();
  const H = N.hemiciclo, ord = [...IDS].sort((x, y) => H[y] - H[x]), primero = ord[0], faltan = 176 - H[primero];
  ctx.reto(`Toda España de juguete: **${N.provincias.length} provincias** y **350 escaños**. ¿Llegará algún partido a **176**, la mayoría absoluta?`);
  ctx.pista(N.tuya ? `Tu provincia de la noche del escrutinio va la primera. Predice antes de repartir.` : 'Cada provincia reparte sus escaños con D\'Hondt y el 3 %. Predice antes de repartir.');
  const hemi = hemiciclo(350, { mayoria: 176, etiqueta: 'Congreso de juguete' });
  hemi.pinta({}, { anima: false });
  const leyendaNodo = el('ul', { class: 'leyenda-hemi rp-leyenda' }, IDS.map((id) => el('li', { 'data-p': id, html: `${escanoSVG(id, 20)}<span>${corto(id)}</span><b>0</b>` })));
  const prov = el('p', { class: 'rp-prov-actual', 'aria-live': 'polite', text: 'Las urnas están cerradas.' });
  const pregunta = el('div', { class: 'rp-pais-preg', hidden: true });
  ctx.escenario.append(el('div', { class: 'rp-pais' }, el('div', { class: 'rp-salida grande' }, el('div', { class: 'rp-cab' }, el('b', { text: 'Congreso de los Diputados (de juguete)' })), hemi.nodo, leyendaNodo, prov), pregunta));
  let prediccion = null;
  ctx.pistas([
    { texto: 'Con tres partidos que se reparten los votos, ¿alguno tendrá más de la mitad?' },
    { texto: `Para la mayoría absoluta hacen falta 176 de 350: más de la mitad. Ningún partido ha sacado más del 40 % de los votos.` },
    { texto: `Después: a ${corto(primero)} le faltan 176 − ${H[primero]}.` },
  ]);
  solucion = { modo: 'pais', llega: false, faltan };
  const reparte350 = async (llega) => {
    prediccion = llega; bSi.disabled = bNo.disabled = true; suena('coge');
    const acum = Object.fromEntries(IDS.map((id) => [id, 0]));
    const pasos = lento() ? [N.provincias.length] : [1, 3, 6, 10, 15, 20, N.provincias.length];
    let k = 0;
    for (const hasta of pasos) {
      while (k < Math.min(hasta, N.provincias.length)) { const p = N.provincias[k++]; for (const id of IDS) acum[id] += p.escanosRep[id]; prov.textContent = `Repartiendo: ${p.nombre} (${p.escanos})${p.tuya ? ', la tuya' : ''}…`; }
      hemi.pinta({ ...acum }, { orden: ord });
      leyendaNodo.querySelectorAll('li').forEach((li) => (li.querySelector('b').textContent = String(acum[li.dataset.p])));
      suena('pon');
      await espera(380);
    }
    prov.textContent = `Escrutado el 100 %. ${corto(primero)} gana… pero se queda en ${H[primero]}.`;
    suena('sello');
    bSi.remove(); bNo.remove();
    pregunta.hidden = false;
    const inp = el('input', { class: 'campo-num', 'data-campo': 'faltan', inputmode: 'numeric', autocomplete: 'off', maxlength: 3, 'aria-label': `Escaños que le faltan a ${partido(primero).nombre}` });
    pregunta.replaceChildren(el('label', { class: 'rp-campo' }, el('span', { html: `¿Cuántos escaños le faltan a <b>${partido(primero).nombre}</b> para llegar a 176?` }), inp));
    setTimeout(() => inp.focus({ preventScroll: true }), 200);
    const ok = ctx.boton('Comprobar', () => {
      const v = inp.value.trim(); if (v === '') return ctx.aviso('Escribe cuántos le faltan.', true);
      ok.disabled = true; solucion = null;
      const bienN = Number(v) === faltan, bienP = prediccion === false;
      const otros = ord.slice(1).map((id) => `${corto(id)} (${H[id]})`).join(' o ');
      let txt = `${corto(primero)} tiene ${H[primero]}: le faltan 176 − ${H[primero]} = **${faltan}**. Nadie tiene mayoría absoluta: para gobernar, ${corto(primero)} necesitará que otro partido le apoye o se abstenga, por ejemplo ${otros}. Eso se negocia en «176».`;
      if (!bienP) txt = 'Habías predicho que alguien llegaba a 176. ' + txt;
      if (!bienN) txt = `Pusiste ${v}. ` + txt;
      ctx.fin(bienN && bienP ? 3 : bienN ? 2 : bienP ? 1 : 0, txt);
    });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') ok.click(); });
  };
  const bSi = ctx.boton('Alguien llega a 176', () => reparte350(true), true);
  const bNo = ctx.boton('Nadie llega', () => reparte350(false), true);
  bSi.dataset.llega = 'si'; bNo.dataset.llega = 'no';
}

/* =========================================================================== portada propia: la máquina */
const ARTE = `<svg viewBox="0 0 640 400" class="arte arte-maquina-rep" aria-hidden="true">
  <defs><filter id="m-sombra" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="10" dy="18" stdDeviation="10" flood-color="#06142a" flood-opacity=".5"/></filter></defs>
  <g filter="url(#m-sombra)"><rect x="120" y="70" width="400" height="280" rx="26" fill="#f2e6cf" stroke="${T}" stroke-width="6"/></g>
  <rect x="150" y="96" width="340" height="170" rx="18" fill="#fffdf6" stroke="${T}" stroke-width="5"/>
  ${(() => { let s = ''; const cols = ['#bfe39a', '#a9d8f5', '#ffc896']; const tot = 15; for (let i = 0; i < tot; i++) { const a = Math.PI * (1 - (i + 0.5) / tot); const r = i % 2 ? 98 : 124; const x = 320 + r * Math.cos(a), y = 246 - r * Math.sin(a); const c = cols[i < 6 ? 0 : i < 11 ? 1 : 2]; s += i < 6 ? `<circle cx="${x}" cy="${y}" r="12" fill="${c}" stroke="${T}" stroke-width="4"/>` : i < 11 ? `<rect x="${x - 11}" y="${y - 11}" width="22" height="22" rx="5" fill="${c}" stroke="${T}" stroke-width="4"/>` : `<path d="M${x} ${y - 14} L${x + 14} ${y} L${x} ${y + 14} L${x - 14} ${y}Z" fill="${c}" stroke="${T}" stroke-width="4" stroke-linejoin="round"/>`; } return s; })()}
  <g transform="translate(160 286)"><rect width="320" height="44" rx="10" fill="#5f7ea3" stroke="${T}" stroke-width="5"/><rect x="18" y="12" width="70" height="20" rx="6" fill="#fffdf6" stroke="${T}" stroke-width="3"/><rect x="125" y="12" width="70" height="20" rx="6" fill="#ffc531" stroke="${T}" stroke-width="3"/><rect x="232" y="12" width="70" height="20" rx="6" fill="#fffdf6" stroke="${T}" stroke-width="3"/></g>
  <g transform="translate(540 120)"><rect x="-8" y="110" width="40" height="60" rx="8" fill="#9aa3b5" stroke="${T}" stroke-width="5"/><rect x="6" y="20" width="12" height="110" rx="6" fill="#c9cfdd" stroke="${T}" stroke-width="5"/><circle cx="12" cy="18" r="22" fill="#e8417a" stroke="${T}" stroke-width="5"/></g>
  <g class="abertura">
    <g class="pieza" transform="translate(70 60) rotate(-14)"><circle cx="30" cy="30" r="26" fill="#bfe39a" stroke="${T}" stroke-width="5"/></g>
    <g class="pieza" transform="translate(70 300) rotate(10)"><rect x="4" y="4" width="50" height="50" rx="12" fill="#a9d8f5" stroke="${T}" stroke-width="5"/></g>
    <g class="pieza" transform="translate(520 40)"><path d="M30 0 L60 30 L30 60 L0 30Z" fill="#ffc896" stroke="${T}" stroke-width="5" stroke-linejoin="round"/></g>
  </g>
</svg>`;
(function portadaPropia() {
  const pon = () => { const a = document.querySelector('.portada-arte'); if (!a || a.dataset.propia) return !!a; a.dataset.propia = '1'; a.innerHTML = ARTE; return true; };
  if (pon()) return;
  const mo = new MutationObserver(() => { if (pon()) mo.disconnect(); });
  mo.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => mo.disconnect(), 20000);
})();
