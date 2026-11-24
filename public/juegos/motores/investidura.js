// Motor «investidura»: Sociales, tema 2 (El cajón vota). Juego «176».
// Nadie tiene mayoría absoluta y hay que formar gobierno. Cada modo es un paso:
//   votacion → el Congreso ya ha decidido: ¿sale en la 1.ª votación, en la 2.ª o no sale? Se vota y se ve.
//   apoyos   → pides a cada partido sí, abstención o no; cada voto tiene su precio y tu partido solo cede hasta cierto punto.
//   negocia  → peticiones de verdad para el solar del barrio y líneas rojas; el plan del solar cambia con cada pacto.
//              Con generar.candidato = 'elige', antes eliges a quién propone el rey (consultas).
// Reglas (las de verdad): 350 escaños; 1.ª votación, 176 síes; 2.ª votación, más síes que noes (la abstención no
// cuenta para nadie); si en dos meses no sale nadie, se repiten las elecciones.
// Si en esta tablet hay una noche electoral guardada (La máquina de repartir) sin mayoría absoluta, se usa su Congreso.
import { el, svg, num, azar, elige, barajar, suena } from './nucleo.js';
import { gsap } from './vendor/gsap.js';
import { espera, bote, temblor, chispasEn } from './efectos.js';
import { partido, iconoPartido, leerNoche } from './civica-comun.js';

const lento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const PRUEBA = new URLSearchParams(location.search).has('prueba');
const TOTAL = 350, MAYORIA = 176, PARCELAS = 12;
const IDS = ['parque', 'pista', 'aparcamiento']; // orden en el solar
const nombre = (id) => partido(id).nombre;
const COLOR = { parque: '#a9dd6a', aparcamiento: '#7fd0ff', pista: '#ffa24d' }; // escaños: los colores de sus iconos
const TIPO = { parque: ['parcela verde', 'parcelas verdes'], pista: ['parcela de pista', 'parcelas de pista'], aparcamiento: ['parcela de aparcamiento', 'parcelas de aparcamiento'] };
const parc = (id, n) => `${n} ${TIPO[id][n === 1 ? 0 : 1]}`;
const VOTO = { si: 'Sí', no: 'No', abs: 'Abstención' };
const PRED = [['primera', 'Sale en la 1.ª votación'], ['segunda', 'Sale en la 2.ª votación'], ['no', 'No sale: elecciones otra vez']];
const verbo = (v) => ({ si: 'voten sí', abs: 'se abstengan', no: 'voten no' })[v];
const verboPl = (v) => ({ si: 'votan sí', abs: 'se abstienen', no: 'votan no' })[v];
const lista = (xs) => (xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1]);

/* ============================================================== el barrio: peticiones y líneas rojas */
const PETICIONES = {
  parque: [
    { id: 'jardin', texto: 'Un jardín con árboles', parcelas: 3 },
    { id: 'huerto', texto: 'Un huerto para el barrio', parcelas: 2 },
    { id: 'fuente', texto: 'Bancos a la sombra y una fuente', parcelas: 1 },
    { id: 'peatonal', texto: 'Cerrar la calle a los coches', flag: 'peatonal' },
  ],
  aparcamiento: [
    { id: 'vecinos', texto: 'Aparcamiento para los vecinos', parcelas: 3 },
    { id: 'salud', texto: 'Plazas junto al centro de salud', parcelas: 2 },
    { id: 'carga', texto: 'Carga y descarga para las tiendas', parcelas: 1 },
    { id: 'cruce', texto: 'Un paso de coches por el medio', flag: 'cruce' },
  ],
  pista: [
    { id: 'baloncesto', texto: 'Una pista de baloncesto', parcelas: 2 },
    { id: 'skate', texto: 'Un skatepark', parcelas: 2 },
    { id: 'rocodromo', texto: 'Un rocódromo', parcelas: 1 },
    { id: 'focos', texto: 'Focos para jugar hasta las diez', flag: 'focos' },
  ],
};
const FLAG_DE = { peatonal: 'peatonal', cruce: 'cruce', focos: 'focos' };
const LINEAS = {
  parque: [
    { texto: 'Ni un coche dentro del solar.', tipo: 'max', de: 'aparcamiento', n: 0 },
    { texto: 'Nada de focos de noche: los vecinos duermen.', tipo: 'veto', flag: 'focos' },
    { texto: 'Al menos 3 parcelas verdes.', tipo: 'min', de: 'parque', n: 3 },
  ],
  aparcamiento: [
    { texto: 'Que no cierren la calle a los coches.', tipo: 'veto', flag: 'peatonal' },
    { texto: 'Al menos 2 parcelas de aparcamiento.', tipo: 'min', de: 'aparcamiento', n: 2 },
    { texto: 'El parque, como mucho medio solar: 6 parcelas.', tipo: 'max', de: 'parque', n: 6 },
  ],
  pista: [
    { texto: 'Al menos 2 parcelas de pista.', tipo: 'min', de: 'pista', n: 2 },
    { texto: 'Ningún coche cruzando entre las pistas.', tipo: 'veto', flag: 'cruce' },
    { texto: 'Como mucho 3 parcelas de coches.', tipo: 'max', de: 'aparcamiento', n: 3 },
  ],
};
const petPorId = (id) => Object.values(PETICIONES).flat().find((p) => p.id === id);
const duenoDe = (pid) => IDS.find((id) => PETICIONES[id].some((p) => p.id === pid));

// el plan del solar con un candidato y unas peticiones aceptadas
function plan(cand, acepta) {
  const p = { parque: 0, pista: 0, aparcamiento: 0 }, flags = new Set();
  for (const pid of acepta) { const x = petPorId(pid); if (x.parcelas) p[duenoDe(pid)] += x.parcelas; if (x.flag) flags.add(x.flag); }
  p[cand] = PARCELAS - IDS.filter((i) => i !== cand).reduce((s, i) => s + p[i], 0);
  return { p, flags };
}
const rompe = (L, P) => (L.tipo === 'max' ? P.p[L.de] > L.n : L.tipo === 'min' ? P.p[L.de] < L.n : P.flags.has(L.flag));
function porQueRompe(L, P, acepta) {
  if (L.tipo === 'veto') { const pet = acepta.map(petPorId).find((x) => x.flag === L.flag); return `has aceptado «${pet?.texto ?? L.flag}»`; }
  const k = P.p[L.de];
  return L.tipo === 'max' ? `habría ${parc(L.de, k)}` : k === 0 ? `no habría ninguna ${TIPO[L.de][0]}` : `solo habría ${parc(L.de, k)}`;
}
// cómo vota cada partido con ese plan
function votos(d, cand, acepta) {
  const P = plan(cand, acepta), out = {};
  for (const id of IDS) {
    const D = d.partidos[id];
    if (!d.esc[id]) { out[id] = { v: 'no', motivo: 'No tiene escaños.', n: 0 }; continue; }
    if (id === cand) {
      if (P.p[id] < D.minimo) out[id] = { v: 'no', motivo: `Os quedáis con ${P.p[id]}: menos de ${D.minimo}. Tus diputados no te votan.`, roto: true };
      else if (rompe(D.linea, P)) out[id] = { v: 'no', motivo: `Cruzas tu propia línea roja: ${porQueRompe(D.linea, P, acepta)}.`, roto: true };
      else out[id] = { v: 'si', motivo: '' };
      continue;
    }
    const n = acepta.filter((pid) => duenoDe(pid) === id).length;
    if (rompe(D.linea, P)) out[id] = { v: 'no', n, roto: true, motivo: `Línea roja: ${porQueRompe(D.linea, P, acepta)}.` };
    else out[id] = { v: n >= 2 ? 'si' : n === 1 ? 'abs' : 'no', n, motivo: n >= 2 ? `Les das ${n}: votan sí.` : n === 1 ? 'Les das 1: se abstienen.' : 'No les das nada: votan no.' };
  }
  return { P, V: out };
}
function resultado(esc, v) {
  let si = 0, no = 0, abs = 0;
  for (const id of IDS) { const x = typeof v[id] === 'string' ? v[id] : v[id].v; if (x === 'si') si += esc[id]; else if (x === 'no') no += esc[id]; else abs += esc[id]; }
  return { si, no, abs, r: si >= MAYORIA ? 'primera' : si > no ? 'segunda' : 'no' };
}
// todas las formas de salir con un candidato (6 peticiones → 64 combinaciones)
function soluciones(d, cand) {
  const pets = IDS.filter((i) => i !== cand && d.esc[i]).flatMap((i) => d.partidos[i].peticiones.map((p) => p.id));
  const out = [];
  for (let m = 0; m < 1 << pets.length; m++) {
    const acepta = pets.filter((_, k) => m & (1 << k));
    const { P, V } = votos(d, cand, acepta);
    if (V[cand].v !== 'si') continue; // sin los tuyos no te presentas
    const R = resultado(d.esc, V);
    if (R.r !== 'no') out.push({ acepta, r: R.r, propias: P.p[cand], votos: Object.fromEntries(IDS.map((i) => [i, V[i].v])) });
  }
  return out;
}

/* ============================================================== el Congreso */
function hemicicloAzar() {
  for (;;) {
    const a = azar(105, 175), b = azar(45, Math.min(175, TOTAL - a - 22)), c = TOTAL - a - b;
    if (c < 22 || c > 175) continue;
    const ids = barajar(IDS);
    return { [ids[0]]: a, [ids[1]]: b, [ids[2]]: c };
  }
}
// la noche electoral de esta tablet (La máquina de repartir)
function laNoche() {
  const h = leerNoche()?.hemiciclo;
  if (!h) return null;
  const esc = Object.fromEntries(IDS.map((i) => [i, h[i]]));
  if (IDS.some((i) => !Number.isInteger(esc[i]) || esc[i] < 0) || IDS.reduce((s, i) => s + esc[i], 0) !== TOTAL) return null;
  return { esc, mayoria: IDS.find((i) => esc[i] >= MAYORIA) };
}
let avisoMayoria = false;
function escanos(d, g, prob) {
  delete d.noche;
  const N = laNoche();
  if (N && !N.mayoria && g.noche !== false && Math.random() < prob) { d.noche = true; return { ...N.esc }; }
  if (N?.mayoria && !avisoMayoria) { avisoMayoria = true; d.nocheMayoria = { id: N.mayoria, n: N.esc[N.mayoria] }; }
  return hemicicloAzar();
}
const mayor = (esc) => [...IDS].sort((a, b) => esc[b] - esc[a])[0];

/* ============================================================== generar */
export function generar(spec) {
  const d = structuredClone(spec);
  const g = typeof d.generar === 'object' ? d.generar : {};
  delete d.generar;
  if (d.modo === 'votacion') return genVotacion(d, g);
  if (d.modo === 'apoyos') return genApoyos(d, g);
  return genNegocia(d, g);
}

function genVotacion(d, g) {
  const abst = !!g.abst;
  const meta = abst ? elige(['primera', 'segunda', 'segunda', 'no', 'no']) : elige(['primera', 'no']);
  for (let k = 0; k < 2000; k++) {
    const esc = k < 1500 ? escanos(d, g, 0.5) : hemicicloAzar();
    if (k >= 1500) delete d.noche;
    const M = mayor(esc);
    const cand = g.noMayor && Math.random() < 0.5 ? elige(IDS.filter((i) => i !== M)) : elige(IDS);
    const otros = IDS.filter((i) => i !== cand);
    const v = { [cand]: 'si' };
    for (const o of otros) v[o] = elige(abst ? ['si', 'no', 'abs'] : ['si', 'no']);
    if (otros.every((o) => v[o] === 'si')) continue;
    if (abst && !otros.some((o) => v[o] === 'abs')) continue;
    const R = resultado(esc, v);
    if (R.r !== meta) continue;
    if (Math.abs(R.si - MAYORIA) > 75) continue; // que haya que sumar de verdad
    if (abst && meta === 'segunda' && R.si >= R.no + R.abs && Math.random() < 0.7) continue; // mejor si contar la abstención como «no» engaña
    if (abst && meta === 'no' && !otros.some((o) => v[o] === 'abs')) continue;
    return Object.assign(d, { esc, cand, votos: v, abst });
  }
  throw new Error('no he podido preparar la votación');
}

const PRECIO = { si: 2, abs: 1, no: 0 };
function genApoyos(d, g) {
  const opciones = Array.isArray(g.presupuesto) ? g.presupuesto : [g.presupuesto ?? 2];
  for (let k = 0; k < 3000; k++) {
    const esc = k < 2000 ? escanos(d, g, 0.5) : hemicicloAzar();
    if (k >= 2000) delete d.noche;
    const M = mayor(esc);
    const cand = g.noMayor ? elige(IDS.filter((i) => i !== M)) : elige(IDS);
    const otros = IDS.filter((i) => i !== cand);
    const bloqueo = Object.fromEntries(otros.map((o) => [o, Math.random() < (g.bloqueos ?? 0.3)]));
    const presupuesto = elige(opciones);
    const posibles = [];
    for (const a of ['si', 'abs', 'no']) for (const b of ['si', 'abs', 'no']) {
      const v = { [cand]: 'si', [otros[0]]: a, [otros[1]]: b };
      if ((a === 'si' && bloqueo[otros[0]]) || (b === 'si' && bloqueo[otros[1]])) continue;
      if (PRECIO[a] + PRECIO[b] > presupuesto) continue;
      posibles.push({ v, R: resultado(esc, v) });
    }
    const sol = posibles.filter((x) => x.R.r !== 'no'), mal = posibles.filter((x) => x.R.r === 'no');
    if (!sol.length || mal.length < 2) continue;
    if (g.trampa) {
      // solo se sale con abstenciones… y no con cualquiera
      if (sol.some((x) => Object.values(x.v).filter((y) => y === 'si').length > 1)) continue;
      if (!mal.some((x) => otros.some((o) => x.v[o] === 'abs'))) continue;
    }
    return Object.assign(d, { esc, cand, bloqueo, presupuesto, sol: sol.map((x) => x.v) });
  }
  throw new Error('no he podido preparar los apoyos');
}

function genNegocia(d, g) {
  const tipo = g.tipo ?? 'facil'; // facil | lineas | elige | segunda
  const [m0, m1] = g.minimo ?? [5, 7];
  for (let k = 0; k < 4000; k++) {
    const esc = k < 3000 ? escanos(d, g, 1) : hemicicloAzar();
    if (k >= 3000) delete d.noche;
    const partidos = {};
    for (const id of IDS) partidos[id] = { peticiones: barajar(PETICIONES[id]).slice(0, 3).map((p) => p.id), linea: elige(LINEAS[id]), minimo: azar(m0, m1) };
    const prueba = { esc, partidos: Object.fromEntries(IDS.map((i) => [i, { ...partidos[i], peticiones: partidos[i].peticiones.map((id) => ({ id })) }])) };
    const M = mayor(esc);
    const sols = Object.fromEntries(IDS.map((c) => [c, soluciones(prueba, c)]));
    let cand = tipo === 'elige' ? null : M;
    const tope = d.noche ? 64 : 1; // con el Congreso de la noche no se puede elegir el reparto: se aceptan más casos
    if (tipo === 'facil') {
      if (!sols[M].some((s) => s.r === 'primera')) continue;
      if (sols[M].length > 40 * tope) continue; // que no valga cualquier cosa
    } else if (tipo === 'lineas') {
      // con algún partido no hay manera de pactar: sus líneas rojas no lo permiten
      if (!sols[M].length || sols[M].length > 24 * tope) continue;
      const otros = IDS.filter((i) => i !== M);
      const imposible = otros.filter((o) => !sols[M].some((s) => s.votos[o] === 'si'));
      if (imposible.length !== 1) continue;
    } else if (tipo === 'elige') {
      if (sols[M].length && !d.noche) continue; // el más votado no puede gobernar (con la noche, basta con que otro también pueda)
      if (!IDS.some((c) => c !== M && sols[c].length)) continue;
    } else if (tipo === 'segunda') {
      // lo más rentable es salir en la 2.ª: con abstenciones os quedáis más parcelas que buscando 176 síes
      const estricto = k < 300;
      const vale = (c) => {
        const S = sols[c];
        if (!S.length || S.length > 24) return false;
        const best = (r) => Math.max(-1, ...S.filter((s) => s.r === r).map((s) => s.propias));
        return estricto ? best('primera') < 0 : best('segunda') >= best('primera') + 2;
      };
      const cs = IDS.filter(vale);
      if (!cs.length) continue;
      cand = cs.includes(M) ? M : elige(cs);
    }
    d.esc = esc;
    d.cand = cand;
    d.elige = tipo === 'elige';
    d.ajustado = !!g.ajustado;
    d.partidos = Object.fromEntries(IDS.map((i) => [i, { peticiones: partidos[i].peticiones.map((id) => ({ ...petPorId(id) })), linea: partidos[i].linea, minimo: partidos[i].minimo }]));
    return d;
  }
  throw new Error('no he podido preparar la negociación');
}

/* ============================================================== dibujos */
const T = '#1b1e3a';
// los 350 escaños en 10 filas de semicírculo; se reparten por bloques de izquierda a derecha
let ASIENTOS = null;
function asientos() {
  if (ASIENTOS) return ASIENTOS;
  const F = 10, r0 = 0.4, radios = Array.from({ length: F }, (_, i) => r0 + ((1 - r0) * i) / (F - 1));
  const suma = radios.reduce((s, r) => s + r, 0);
  const n = radios.map((r) => Math.round((TOTAL * r) / suma));
  let dif = TOTAL - n.reduce((s, x) => s + x, 0);
  for (let i = F - 1; dif; i = (i - 1 + F) % F) { n[i] += Math.sign(dif); dif -= Math.sign(dif); }
  const out = [];
  radios.forEach((r, i) => { for (let j = 0; j < n[i]; j++) { const a = Math.PI * (1 - j / (n[i] - 1)); out.push({ x: r * Math.cos(a), y: -r * Math.sin(a), a, r }); } });
  out.sort((p, q) => q.a - p.a || p.r - q.r);
  return (ASIENTOS = out);
}
const ordenBloques = (esc) => [...IDS].sort((a, b) => esc[b] - esc[a]);

function congreso(esc, { noche, compacto } = {}) {
  const orden = ordenBloques(esc);
  const A = asientos();
  let k = 0;
  const de = [];
  for (const id of orden) for (let j = 0; j < esc[id]; j++) de[k++] = id;
  const puntos = A.map((p, i) => `<circle class="inv-asiento" data-p="${de[i]}" cx="${p.x.toFixed(3)}" cy="${p.y.toFixed(3)}" r=".031" fill="${COLOR[de[i]]}"/>`).join('');
  const dib = svg('-1.08 -1.08 2.16 1.16', `<path d="M-1.06 .04 A1.06 1.06 0 0 1 1.06 .04 Z" fill="#fffdf6" stroke="${T}" stroke-width=".018"/><path d="M-.3 .04 A.3 .3 0 0 1 .3 .04Z" fill="#f1e6cf" stroke="${T}" stroke-width=".014"/><g stroke="${T}" stroke-width=".008">${puntos}</g><text class="inv-centro" x="0" y="-.08" text-anchor="middle">${TOTAL}</text><text class="inv-centro-sub" x="0" y="-.0" text-anchor="middle">escaños</text>`, { class: 'inv-hemiciclo', role: 'img', 'aria-label': `Congreso: ${orden.map((id) => `${nombre(id)}, ${esc[id]}`).join('; ')}` });
  dib.removeAttribute('aria-hidden');
  const leyenda = el('ul', { class: 'inv-leyenda' }, orden.map((id) => el('li', { 'data-p': id, style: { '--c': COLOR[id] } }, el('span', { class: 'inv-mini', html: iconoPartido(id, 30) }), el('span', {}, el('b', { text: num(esc[id]) }), ' ', partido(id).corto))));
  const nodo = el('figure', { class: 'inv-congreso' + (noche ? ' de-noche' : '') + (compacto ? ' compacto' : '') }, noche && el('figcaption', { class: 'inv-sello-noche', text: 'Tu Congreso de la noche electoral' }), dib, leyenda);
  return {
    nodo,
    async colorea(v, animar) {
      const cs = [...dib.querySelectorAll('.inv-asiento')];
      cs.forEach((c) => c.style.setProperty('transition-delay', animar ? (c.dataset.p ? orden.indexOf(c.dataset.p) * 260 + Math.random() * 220 : 0) + 'ms' : '0ms'));
      cs.forEach((c) => c.setAttribute('class', 'inv-asiento voto-' + v[c.dataset.p]));
      leyenda.classList.add('votada');
      leyenda.querySelectorAll('li').forEach((li) => { li.dataset.v = v[li.dataset.p]; li.querySelector('.inv-voto')?.remove(); li.append(el('span', { class: 'inv-voto v-' + v[li.dataset.p], text: VOTO[v[li.dataset.p]] })); });
      if (animar) await espera(1100);
    },
    restaura() { dib.querySelectorAll('.inv-asiento').forEach((c) => c.setAttribute('class', 'inv-asiento')); leyenda.querySelectorAll('.inv-voto').forEach((x) => x.remove()); },
  };
}

// el solar del barrio: 12 parcelas, la calle de abajo y lo que se haya pactado
const TESELA = {
  parque: `<rect width="80" height="66" rx="8" fill="#c4e89e"/><path d="M10 54 q6 -8 12 0 M56 56 q5 -7 10 0" stroke="#5e9a1c" stroke-width="3" fill="none"/><rect x="36" y="38" width="9" height="18" rx="2" fill="#b5835a" stroke="${T}" stroke-width="3"/><circle cx="40" cy="27" r="18" fill="#6fbf3a" stroke="${T}" stroke-width="3"/><circle cx="34" cy="22" r="5" fill="#9bd84a"/>`,
  pista: `<rect width="80" height="66" rx="8" fill="#ffb877"/><rect x="9" y="8" width="62" height="50" rx="3" fill="none" stroke="#fffdf6" stroke-width="3"/><path d="M40 8 v50" stroke="#fffdf6" stroke-width="3"/><circle cx="40" cy="33" r="9" fill="none" stroke="#fffdf6" stroke-width="3"/><circle cx="58" cy="46" r="7" fill="#ff8a1f" stroke="${T}" stroke-width="2.5"/>`,
  aparcamiento: `<rect width="80" height="66" rx="8" fill="#d3dbe6"/><path d="M14 6 v54 M66 6 v54" stroke="#fffdf6" stroke-width="3"/><rect x="25" y="13" width="30" height="42" rx="8" fill="#5ec3ff" stroke="${T}" stroke-width="3"/><rect x="30" y="20" width="20" height="10" rx="2" fill="#bfe8ff" stroke="${T}" stroke-width="2"/>`,
  vacio: `<rect width="80" height="66" rx="8" fill="#d9bd92"/><path d="M14 52 l4 -12 l4 12 M50 48 l3 -9 l3 9 M60 22 l3 -8 l3 8" stroke="#7a8f3a" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="30" cy="22" r="3" fill="#a88760"/><circle cx="44" cy="30" r="2.5" fill="#a88760"/>`,
};
const FOCO = `<path d="M70 2 v22" stroke="${T}" stroke-width="3"/><path d="M62 4 h14 l-3 6 h-8z" fill="#ffe27a" stroke="${T}" stroke-width="2.5" stroke-linejoin="round"/><path d="M64 10 l-8 16 h28 l-8 -16" fill="#ffe27a" opacity=".45"/>`;
function solarSVG(P, { vacio = false } = {}) {
  const tipos = vacio ? Array(PARCELAS).fill('vacio') : IDS.flatMap((id) => Array(P.p[id]).fill(id));
  const cruce = !vacio && P.flags.has('cruce'), peat = !vacio && P.flags.has('peatonal'), focos = !vacio && P.flags.has('focos');
  const fila2 = cruce ? 112 : 84;
  const teselas = tipos.map((t, i) => {
    const col = Math.floor(i / 2), fila = i % 2;
    return `<g class="inv-tesela" data-i="${i}" data-t="${t}" transform="translate(${16 + col * 92} ${12 + (fila ? fila2 : 0)})">${TESELA[t]}<rect width="80" height="66" rx="8" fill="none" stroke="${T}" stroke-width="3"/>${focos && t === 'pista' ? FOCO : ''}</g>`;
  }).join('');
  const alto = fila2 + 12 + 66 + 14;
  const camino = cruce ? `<g class="inv-cruce"><rect x="8" y="${12 + 66 + 6}" width="568" height="${fila2 - 66 - 12}" fill="#8d97a8" stroke="${T}" stroke-width="3"/><path d="M14 ${12 + 66 + 6 + (fila2 - 78) / 2} h556" stroke="#fffdf6" stroke-width="3" stroke-dasharray="14 10"/><g transform="translate(250 ${12 + 66 + 8})"><rect width="44" height="18" rx="6" fill="#5ec3ff" stroke="${T}" stroke-width="2.5"/></g></g>` : '';
  const calle = peat
    ? `<g class="inv-calle peatonal"><rect x="0" y="${alto}" width="584" height="46" fill="#efe1c4" stroke="${T}" stroke-width="3"/><path d="${Array.from({ length: 12 }, (_, i) => `M${i * 50} ${alto} l20 46`).join(' ')}" stroke="#d6c39a" stroke-width="3"/>${[90, 300, 500].map((x) => `<circle cx="${x}" cy="${alto + 22}" r="12" fill="#6fbf3a" stroke="${T}" stroke-width="2.5"/>`).join('')}<text x="190" y="${alto + 30}" class="inv-calle-txt">CALLE PEATONAL</text></g>`
    : `<g class="inv-calle"><rect x="0" y="${alto}" width="584" height="46" fill="#9aa3b2" stroke="${T}" stroke-width="3"/><path d="M8 ${alto + 23} h568" stroke="#fffdf6" stroke-width="3" stroke-dasharray="18 12"/><g transform="translate(400 ${alto + 9})"><rect width="54" height="26" rx="8" fill="#ff7fae" stroke="${T}" stroke-width="2.5"/><rect x="34" y="5" width="12" height="16" rx="2" fill="#ffe0ec" stroke="${T}" stroke-width="2"/></g></g>`;
  const valla = vacio ? `<g class="inv-valla"><path d="${Array.from({ length: 30 }, (_, i) => `M${10 + i * 19.5} 6 v${alto - 4}`).join(' ')}" stroke="#7d868c" stroke-width="4"/><path d="M4 30 H580 M4 ${alto - 24} H580" stroke="#7d868c" stroke-width="5"/><g transform="translate(152 ${alto / 2 - 30}) rotate(-3)"><rect width="280" height="60" rx="6" fill="#ffc531" stroke="${T}" stroke-width="3.5"/><text x="140" y="27" text-anchor="middle" class="inv-valla-txt">OBRAS PARADAS</text><text x="140" y="49" text-anchor="middle" class="inv-valla-sub">No hay gobierno</text></g></g>` : '';
  return { html: `<rect x="2" y="2" width="580" height="${alto - 2}" rx="12" fill="#e9dcc0" stroke="${T}" stroke-width="3"/>${camino}${teselas}${calle}${valla}`, vb: `0 0 584 ${alto + 48}`, tipos };
}
function solar() {
  const dib = svg('0 0 584 240', '', { class: 'inv-solar-svg', role: 'img' });
  dib.removeAttribute('aria-hidden');
  const cuenta = el('ul', { class: 'inv-cuenta-solar' });
  const nodo = el('figure', { class: 'inv-solar' }, el('figcaption', {}, el('b', { text: 'El solar del barrio' }), el('span', { text: ' · 12 parcelas' })), dib, cuenta);
  let antes = null;
  return {
    nodo,
    pinta(P, { vacio = false } = {}) {
      const S = solarSVG(P, { vacio });
      dib.setAttribute('viewBox', S.vb); dib.innerHTML = S.html;
      dib.setAttribute('aria-label', vacio ? 'El solar, vallado y sin obras.' : `El solar: ${IDS.filter((i) => P.p[i]).map((i) => parc(i, P.p[i])).join(', ')}.`);
      cuenta.replaceChildren(...(vacio ? [el('li', { class: 'vacio', text: 'Sin gobierno, nadie consigue nada.' })] : IDS.map((i) => el('li', { 'data-p': i, class: P.p[i] ? '' : 'cero' }, el('span', { class: 'inv-mini', html: iconoPartido(i, 26) }), el('b', { text: String(P.p[i]) }), ' ' + (P.p[i] === 1 ? TIPO[i][0] : TIPO[i][1]).replace(/^parcelas? /, '')))));
      if (antes && !lento()) {
        const nuevos = [...dib.querySelectorAll('.inv-tesela')].filter((g, i) => antes[i] !== S.tipos[i]);
        if (nuevos.length) gsap.from(nuevos, { scale: 0.2, transformOrigin: '40px 33px', duration: 0.45, ease: 'back.out(2.2)', stagger: 0.05 });
        if (vacio) gsap.from(dib.querySelector('.inv-valla'), { y: -60, opacity: 0, duration: 0.5, ease: 'bounce.out' });
      }
      antes = S.tipos;
    },
  };
}

// la tarjeta de un partido
function tarjeta(id, esc, extra = {}) {
  const pal = el('span', { class: 'inv-paleta', 'aria-live': 'polite' });
  const motivo = el('p', { class: 'inv-motivo' });
  const nodo = el('article', { class: 'inv-partido', 'data-p': id, style: { '--c': COLOR[id], '--tono': partido(id).tono } },
    el('header', {}, el('span', { class: 'inv-icono', html: iconoPartido(id, 52) }), el('div', { class: 'inv-nombre' }, el('h3', { text: nombre(id) }), el('span', { class: 'inv-esc' }, el('b', { text: num(esc[id]) }), ' escaños')), pal),
    motivo, extra.cuerpo);
  return {
    nodo,
    voto(v, txt) { pal.className = 'inv-paleta v-' + v; pal.textContent = VOTO[v]; motivo.textContent = txt ?? ''; nodo.dataset.v = v; },
  };
}
const corona = () => `<svg viewBox="0 0 100 70" width="44" height="31" aria-hidden="true"><path d="M8 58 L4 16 L28 38 L50 6 L72 38 L96 16 L92 58 Z" fill="#ffc531" stroke="${T}" stroke-width="5" stroke-linejoin="round"/><rect x="8" y="54" width="84" height="12" rx="3" fill="#ffc531" stroke="${T}" stroke-width="5"/><circle cx="50" cy="40" r="6" fill="#e8417a" stroke="${T}" stroke-width="3"/></svg>`;

/* ============================================================== la votación (común a todos los modos) */
async function votar(d, ctx, cg, v, caja, { solarUI, P } = {}) {
  const R = resultado(d.esc, v);
  const anima = !ctx.pizarra && !lento();
  const regla = el('div', { class: 'inv-regla' }, el('i', { class: 'inv-relleno' }), el('i', { class: 'inv-176', style: { left: (MAYORIA / TOTAL) * 100 + '%' } }, el('span', { text: '176' })));
  const cuentaSi = el('output', { class: 'inv-cuenta', text: '0' });
  const sello1 = el('span', { class: 'inv-sello' });
  const paso1 = el('section', { class: 'inv-paso' }, el('h4', {}, '1.ª votación ', el('small', { text: '· hacen falta 176 síes' })), el('div', { class: 'inv-fila' }, regla, el('span', { class: 'inv-si-txt' }, cuentaSi, ' síes')), sello1);
  const acta = el('div', { class: 'inv-acta', role: 'status' }, paso1);
  caja.replaceChildren(acta);
  acta.scrollIntoView?.({ block: 'nearest', behavior: anima ? 'smooth' : 'auto' });
  if (anima) suena('clic');
  await cg.colorea(v, anima);
  const relleno = regla.querySelector('.inv-relleno');
  if (anima) {
    await gsap.to(relleno, { width: (R.si / TOTAL) * 100 + '%', duration: 1.1, ease: 'power2.out', onUpdate() { cuentaSi.textContent = String(Math.round((parseFloat(relleno.style.width) / 100) * TOTAL)); } });
  } else relleno.style.width = (R.si / TOTAL) * 100 + '%';
  cuentaSi.textContent = String(R.si);
  const ok1 = R.r === 'primera';
  sello1.textContent = ok1 ? `Llega: ${R.si}` : `No llega: faltan ${MAYORIA - R.si}`;
  sello1.className = 'inv-sello ' + (ok1 ? 'bien' : 'mal');
  if (anima) { suena(ok1 ? 'selloBien' : 'selloMal'); gsap.from(sello1, { scale: 2.4, rotation: -20, opacity: 0, duration: 0.35, ease: 'back.out(2)' }); await espera(900); }
  if (!ok1) {
    const ang = Math.max(-16, Math.min(16, ((R.no - R.si) / 120) * 16));
    const bal = svg('0 -10 320 175', `<path d="M160 50 L140 138 H180 Z" fill="#c9cfdd" stroke="${T}" stroke-width="4" stroke-linejoin="round"/><g class="inv-brazo"><rect x="30" y="44" width="260" height="12" rx="6" fill="#ffc531" stroke="${T}" stroke-width="4"/><g class="inv-plato" data-x="50"><path d="M50 50 L20 96 M50 50 L80 96" stroke="${T}" stroke-width="3"/><path d="M4 96 h92 q-6 26 -46 26 q-40 0 -46 -26z" fill="#2f5bd3" stroke="${T}" stroke-width="4"/><text x="50" y="114" text-anchor="middle" class="inv-plato-txt">Sí ${R.si}</text></g><g class="inv-plato" data-x="270"><path d="M270 50 L240 96 M270 50 L300 96" stroke="${T}" stroke-width="3"/><path d="M224 96 h92 q-6 26 -46 26 q-40 0 -46 -26z" fill="#e8417a" stroke="${T}" stroke-width="4"/><text x="270" y="114" text-anchor="middle" class="inv-plato-txt">No ${R.no}</text></g></g><circle cx="160" cy="50" r="8" fill="${T}"/>`, { class: 'inv-balanza' });
    const sello2 = el('span', { class: 'inv-sello' });
    const paso2 = el('section', { class: 'inv-paso' }, el('h4', {}, '2.ª votación ', el('small', { text: '· dos días después: más síes que noes' })),
      el('div', { class: 'inv-fila' }, bal, el('p', { class: 'inv-abst' }, el('b', { text: String(R.abs) }), R.abs === 1 ? ' abstención' : ' abstenciones', el('br'), el('small', { text: 'no pesan en ningún plato' }))), sello2);
    acta.append(paso2);
    const brazo = bal.querySelector('.inv-brazo');
    if (anima) {
      gsap.from(paso2, { y: 20, opacity: 0, duration: 0.35 });
      const platos = [...bal.querySelectorAll('.inv-plato')];
      platos.forEach((g) => gsap.fromTo(g, { rotation: 0 }, { rotation: -ang, svgOrigin: `${g.dataset.x} 50`, duration: 1.1, ease: 'elastic.out(1, 0.45)' }));
      await gsap.fromTo(brazo, { rotation: 0 }, { rotation: ang, svgOrigin: '160 50', duration: 1.1, ease: 'elastic.out(1, 0.45)' });
    } else { gsap.set(brazo, { rotation: ang, svgOrigin: '160 50' }); bal.querySelectorAll('.inv-plato').forEach((g) => gsap.set(g, { rotation: -ang, svgOrigin: `${g.dataset.x} 50` })); }
    const ok2 = R.r === 'segunda';
    sello2.textContent = ok2 ? `Más síes: ${R.si} a ${R.no}` : R.si === R.no ? `Empate: ${R.si} a ${R.no}` : `Más noes: ${R.no} a ${R.si}`;
    sello2.className = 'inv-sello ' + (ok2 ? 'bien' : 'mal');
    if (anima) { suena(ok2 ? 'selloBien' : 'selloMal'); gsap.from(sello2, { scale: 2.4, rotation: -20, opacity: 0, duration: 0.35, ease: 'back.out(2)' }); await espera(900); }
  }
  const sale = R.r !== 'no';
  const final = el('div', { class: 'inv-final ' + (sale ? 'bien' : 'mal') },
    sale ? el('span', { class: 'inv-final-icono', html: corona() }) : el('span', { class: 'inv-final-icono', html: urna() }),
    el('p', {}, sale ? el('b', { text: `${nombre(d.candJugado ?? d.cand)}: investidos.` }) : el('b', { text: 'Repetición electoral.' }), el('br'), sale ? 'Ya hay gobierno.' : 'Dos meses sin gobierno: se vuelve a votar.'));
  acta.append(final);
  if (solarUI && P) solarUI.pinta(P, { vacio: !sale });
  if (anima) { gsap.from(final, { scale: 0.6, opacity: 0, duration: 0.4, ease: 'back.out(2)' }); if (sale) chispasEn(final, 12, '#ffc531'); else temblor(final, 6); await espera(700); }
  return R;
}
const urna = () => `<svg viewBox="0 0 100 90" width="44" height="40" aria-hidden="true"><path d="M30 6 h40 v34 h-40z" fill="#fffdf6" stroke="${T}" stroke-width="5"/><path d="M38 16 h24 M38 26 h18" stroke="#c9cbe0" stroke-width="4"/><rect x="8" y="34" width="84" height="50" rx="6" fill="#bfe8ff" stroke="${T}" stroke-width="5"/><path d="M28 34 h44" stroke="${T}" stroke-width="7"/></svg>`;

// la predicción antes de votar
function prediccion(ctx, alElegir, { volver } = {}) {
  ctx.acciones.replaceChildren();
  const caja = el('div', { class: 'inv-predice', role: 'group', 'aria-label': '¿Qué va a pasar?' }, el('b', { text: 'Antes de votar: ¿qué crees que pasará?' }),
    el('div', { class: 'inv-predice-ops' }, PRED.map(([k, t]) => el('button', { type: 'button', class: 'tecla inv-pred', 'data-r': k, text: t, onclick: () => { suena('clic'); alElegir(k); } }))));
  ctx.acciones.append(caja);
  if (volver) ctx.acciones.append(el('button', { type: 'button', class: 'tecla inv-volver', text: 'Seguir negociando', onclick: volver }));
}
const estrellasPred = (sale, pred, r) => (sale ? (pred === r ? 3 : 2) : pred === 'no' ? 1 : 0);
function textoPred(pred, R) {
  if (pred === R.r) return '';
  if (pred === 'primera') return R.r === 'segunda' ? ' Tú esperabas la 1.ª, pero ahí no basta con ganar: hacen falta **176 síes**.' : ` Tú esperabas la 1.ª: con ${R.si} síes no se llega a 176.`;
  if (pred === 'segunda') return R.r === 'primera' ? ` Ya en la 1.ª había ${R.si} síes: con 176 basta.` : ` En la 2.ª se comparan síes y noes: ${R.si} contra ${R.no}.`;
  return R.r === 'segunda' && R.abs ? ` Tú creías que no salía: ¿contaste las ${R.abs} abstenciones como noes? No cuentan para nadie.` : ` Tú creías que no salía, pero ${R.si} síes ${R.r === 'primera' ? 'llegan a 176' : `son más que ${R.no} noes`}.`;
}
const sumaSi = (esc, v) => IDS.filter((i) => v[i] === 'si').map((i) => esc[i]);
const describeR = (R) => (R.r === 'primera' ? `**${R.si} síes**: llega a 176 en la 1.ª votación.` : R.r === 'segunda' ? `En la 1.ª, ${R.si} síes: faltan ${MAYORIA - R.si}. En la 2.ª, **${R.si} síes contra ${R.no} noes**: sale.` : `En la 1.ª, ${R.si} síes: faltan ${MAYORIA - R.si}. En la 2.ª, ${R.si} síes contra **${R.no} noes**: ${R.si === R.no ? 'empate, y con empate no sale' : 'no sale'}.`);

/* ============================================================== modos */
export function ronda(d, ctx) {
  const m = { votacion, apoyos, negocia }[d.modo];
  if (!m) throw new Error(`no encuentro el modo «${d.modo}». Si el juego se acaba de actualizar, recarga la página.`);
  return m(d, ctx);
}
function avisoNoche(d, ctx, siNo) {
  if (d.nocheMayoria) ctx.pista(`En tu noche electoral, ${nombre(d.nocheMayoria.id)} sacaron mayoría absoluta (${d.nocheMayoria.n}): no necesitan pactar. Para negociar, usamos otro Congreso.`);
  else if (d.noche) ctx.pista('Este es el Congreso que salió en tu noche electoral.');
  else ctx.pista(siNo);
}

// ---------------------------------------------------------------- 1. ¿sale o no sale?
function votacion(d, ctx) {
  const { esc, cand, votos: v } = d;
  const otros = IDS.filter((i) => i !== cand);
  const M = mayor(esc);
  ctx.reto(`${cand === M ? 'El rey' : `${nombre(M)} tienen más escaños, pero el rey`} propone a **${nombre(cand)}**. Así van a votar. **¿Qué pasará?**`);
  avisoNoche(d, ctx, 'Mira cómo vota cada partido y cuenta con cuidado.');
  const cg = congreso(esc, { noche: d.noche });
  const votosUI = el('ul', { class: 'inv-anuncio' }, ordenBloques(esc).map((id) => el('li', { 'data-p': id, style: { '--c': COLOR[id] } }, el('span', { class: 'inv-mini', html: iconoPartido(id, 34) }), el('span', { class: 'inv-anuncio-nombre' }, nombre(id), el('small', { text: ` · ${esc[id]}` })), el('span', { class: 'inv-paleta v-' + v[id], text: VOTO[v[id]] }))));
  let pred = null;
  const ops = el('div', { class: 'inv-opciones', role: 'radiogroup', 'aria-label': 'Tu predicción' }, PRED.map(([k, t]) => el('button', { type: 'button', class: 'inv-op', role: 'radio', 'aria-checked': 'false', 'data-r': k, onclick: () => { pred = k; suena('clic'); ops.querySelectorAll('.inv-op').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.r === k))); boton.disabled = false; } }, el('span', { class: 'inv-op-icono', html: k === 'no' ? urna() : corona() }), el('span', { text: t }))));
  const caja = el('div', { class: 'inv-caja' }, ops);
  const der = el('div', { class: 'inv-der' }, el('b', { class: 'inv-titulo', text: 'Así votan' }), votosUI, caja);
  ctx.escenario.append(el('div', { class: 'inv inv-votacion' }, el('div', { class: 'inv-izq' }, cg.nodo), der));
  if (!lento() && !ctx.pizarra) gsap.from(votosUI.querySelectorAll('.inv-paleta'), { rotation: -30, scale: 0.3, opacity: 0, duration: 0.4, ease: 'back.out(2)', stagger: 0.12, delay: 0.2 });
  const boton = ctx.boton('Votar', async () => {
    if (!pred) return;
    boton.disabled = true; ctx.acciones.replaceChildren();
    const R = await votar(d, ctx, cg, v, caja);
    const partes = sumaSi(esc, v);
    const absTxt = R.abs ? ` Las ${R.abs} abstenciones no cuentan para nadie.` : '';
    const msg = `Síes: ${partes.length > 1 ? partes.join(' + ') + ' = ' : ''}${R.si}. ` + describeR(R) + absTxt + textoPred(pred, R) + (pred === R.r && !d.abst && R.r === 'no' ? ' Sin abstenciones, si no hay 176 síes, hay más noes: la 2.ª no ayuda.' : '');
    ctx.fin(pred === R.r ? 3 : 0, msg);
  });
  boton.disabled = true;
  const Rk = resultado(esc, v);
  const siTxt = sumaSi(esc, v);
  ctx.pistas([
    { texto: 'Mira los carteles. Suma solo los escaños de los partidos que votan **sí**.' },
    { texto: '1.ª votación: hacen falta **176 síes**. Si no, 2.ª votación: basta con **más síes que noes**. La abstención no cuenta para nadie.' },
    { texto: `Síes: ${siTxt.length > 1 ? siTxt.join(' + ') + ' = ' : ''}**${Rk.si}**. Noes: **${Rk.no}**.` },
  ]);
  if (PRUEBA) window.__sol = () => ({ modo: 'votacion', r: Rk.r });
}

// ---------------------------------------------------------------- 2. ¿qué voto pides a cada uno?
function apoyos(d, ctx) {
  const { esc, cand, presupuesto, bloqueo } = d;
  const otros = IDS.filter((i) => i !== cand);
  const M = mayor(esc);
  const v = { [cand]: 'si', [otros[0]]: 'no', [otros[1]]: 'no' };
  ctx.reto(`Eres de **${nombre(cand)}** (${esc[cand]}). Tu partido solo acepta ceder **${presupuesto} ${presupuesto === 1 ? 'cosa' : 'cosas'}**. ¿Qué voto pides a cada partido?`);
  avisoNoche(d, ctx, 'Un sí te cuesta 2 cosas del barrio; una abstención, 1; un no, nada.');
  const cg = congreso(esc, { noche: d.noche, compacto: true });
  const gasto = () => otros.reduce((s, o) => s + PRECIO[v[o]], 0);
  const fichas = el('div', { class: 'inv-fichas', 'aria-live': 'polite' });
  const totales = el('p', { class: 'inv-totales', 'aria-live': 'polite' });
  const pintaGasto = () => {
    const g = gasto();
    fichas.replaceChildren(el('b', { text: 'Lo que cedes' }), el('span', { class: 'inv-fichas-fila' }, Array.from({ length: presupuesto }, (_, k) => el('i', { class: k < g ? 'usada' : '' }))), el('small', { text: `${g} de ${presupuesto}` }));
    const R = resultado(esc, v);
    totales.replaceChildren(el('span', { class: 'v-si' }, 'Sí ', el('b', { text: String(R.si) })), el('span', { class: 'v-no' }, 'No ', el('b', { text: String(R.no) })), el('span', { class: 'v-abs' }, 'Abstención ', el('b', { text: String(R.abs) })));
  };
  const tarjetas = {};
  const propia = tarjeta(cand, esc, { cuerpo: el('p', { class: 'inv-programa', text: 'Tu partido. Vota sí a su candidato, claro.' }) });
  propia.nodo.classList.add('candidato'); propia.voto('si', '');
  for (const o of otros) {
    const grupo = el('div', { class: 'inv-segmento', role: 'radiogroup', 'aria-label': `Voto que pides a ${nombre(o)}` }, ['si', 'abs', 'no'].map((x) => {
      const bloq = x === 'si' && bloqueo[o];
      return el('button', { type: 'button', class: 'inv-opcion v-' + x + (bloq ? ' bloqueada' : ''), role: 'radio', 'aria-checked': String(v[o] === x), 'data-p': o, 'data-v': x, disabled: bloq, onclick: () => pide(o, x) },
        el('b', { text: VOTO[x] }), el('small', { text: bloq ? 'Línea roja' : PRECIO[x] ? `cuesta ${PRECIO[x]}` : 'gratis' }));
    }));
    const t = tarjeta(o, esc, { cuerpo: [grupo, bloqueo[o] && el('p', { class: 'inv-linea' }, el('b', { text: 'Línea roja: ' }), `nunca votarán sí a ${nombre(cand)}.`)] });
    t.voto('no', 'Por ahora, no.');
    tarjetas[o] = { ...t, grupo };
  }
  function pide(o, x) {
    const antes = v[o]; v[o] = x;
    if (gasto() > presupuesto) { v[o] = antes; ctx.aviso(`Tu partido no acepta ceder más de ${presupuesto}. Quita algo a otro partido primero.`, true); temblor(fichas, 6); suena('mal'); return; }
    ctx.aviso('');
    suena('clic');
    tarjetas[o].grupo.querySelectorAll('.inv-opcion').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === x)));
    tarjetas[o].voto(x, x === 'si' ? `Les cedes 2: votan sí.` : x === 'abs' ? 'Les cedes 1: se abstienen.' : 'No les cedes nada: votan no.');
    if (!lento()) bote(tarjetas[o].nodo.querySelector('.inv-paleta'), 8);
    pintaGasto();
  }
  pintaGasto();
  const arriba = el('div', { class: 'inv-arriba' }, cg.nodo, el('div', { class: 'inv-marcador' }, fichas, totales));
  const abajo = el('div', { class: 'inv-partidos' }, propia.nodo, otros.map((o) => tarjetas[o].nodo));
  ctx.escenario.append(el('div', { class: 'inv inv-apoyos' }, arriba, abajo));
  const ir = () => prediccion(ctx, async (pred) => {
    ctx.acciones.replaceChildren();
    abajo.querySelectorAll('button').forEach((b) => (b.disabled = true));
    const R = await votar(d, ctx, cg, v, abajo);
    const sale = R.r !== 'no';
    const otra = sale && d.sol.find((s) => otros.some((o) => s[o] !== v[o]));
    const quien = otros.map((o) => `${nombre(o)} ${verboPl(v[o])}`);
    let msg = `${lista(quien)}. ` + describeR(R) + (R.abs && R.r !== 'primera' ? ` Las ${R.abs} abstenciones no pesan.` : '') + textoPred(pred, R);
    if (sale && otra) msg += ` Otra forma: que ${lista(otros.map((o) => `${nombre(o)} ${verbo(otra[o])}`))}.`;
    if (!sale && ctx.intento > 1 && d.sol[0]) msg += ` Se podía: que ${lista(otros.map((o) => `${nombre(o)} ${verbo(d.sol[0][o])}`))}.`;
    ctx.fin(estrellasPred(sale, pred, R.r), msg);
  }, { volver: () => { ctx.acciones.replaceChildren(); boton = ctx.boton('A votar', ir); } });
  let boton = ctx.boton('A votar', ir);
  const s0 = d.sol[0];
  const conAbs = otros.find((o) => s0[o] === 'abs');
  const conSi = otros.find((o) => s0[o] === 'si');
  ctx.pistas([
    { texto: 'Una **abstención** es más barata que un sí. No suma síes… pero tampoco suma noes.' },
    { texto: `Con tus ${esc[cand]} síes no llegas a 176. Pero en la 2.ª votación te basta con tener **más síes que noes**.` },
    { texto: conSi ? `Con el sí de **${nombre(conSi)}** sumas ${esc[cand]} + ${esc[conSi]} = ${esc[cand] + esc[conSi]}.` : `Si **${nombre(conAbs)}** se abstiene, tus ${esc[cand]} síes solo se miden con los noes de los demás.` },
  ]);
  if (PRUEBA) window.__sol = () => ({ modo: 'apoyos', votos: s0, r: resultado(esc, s0).r });
}

// ---------------------------------------------------------------- 3. la negociación del solar
function negocia(d, ctx) {
  const { esc } = d;
  const M = mayor(esc);
  let cand = d.cand;
  const acepta = new Set();
  const solarUI = solar();
  const cg = congreso(esc, { noche: d.noche, compacto: true });
  const totales = el('p', { class: 'inv-totales', 'aria-live': 'polite' });
  if (d.elige) ctx.reto(`Los más votados son ${nombre(M)}. **¿A quién propone el rey?** Elige candidato y negocia.`);
  else if (d.ajustado) ctx.reto(`Negocias por **${nombre(cand)}** (${esc[cand]}). Consigue la investidura cediendo **lo menos posible** del solar.`);
  else ctx.reto(`Negocias por **${nombre(cand)}** (${esc[cand]}). Consigue que salga la investidura **sin perder tu línea roja**.`);
  avisoNoche(d, ctx, d.elige ? 'Toca «Proponer» en un partido. Puedes cambiar de candidato antes de votar.' : 'Toca las peticiones que aceptas. El solar y los votos cambian al momento.');
  const T_ = {};
  const partidosUI = el('div', { class: 'inv-partidos' });
  const monta = () => {
    partidosUI.replaceChildren();
    for (const id of ordenBloques(esc)) {
      const D = d.partidos[id];
      const esCand = id === cand;
      const pets = el('div', { class: 'inv-peticiones' + (esCand ? ' suyas' : '') }, D.peticiones.map((p) => el('button', { type: 'button', class: 'inv-peticion', 'data-id': p.id, 'aria-pressed': String(acepta.has(p.id)), disabled: esCand || !cand, onclick: () => toca(p.id) },
        el('span', { class: 'inv-check', 'aria-hidden': 'true' }), el('span', { class: 'inv-pet-txt', text: p.texto }), el('span', { class: 'inv-coste', 'aria-label': p.parcelas ? parc(id, p.parcelas) : 'sin parcelas' }, p.parcelas ? Array.from({ length: p.parcelas }, () => el('i')) : el('em', { text: { peatonal: 'calle', cruce: 'paso', focos: 'focos' }[p.flag] })))));
      const cuerpo = [
        esCand ? el('p', { class: 'inv-programa' }, 'Su programa: todo el solar para lo suyo. ', el('b', { text: `No baja de ${D.minimo} parcelas.` })) : el('p', { class: 'inv-piden', text: cand ? 'Piden (2 → sí · 1 → abstención):' : 'Piden:' }),
        !esCand && pets,
        el('p', { class: 'inv-linea' }, el('b', { text: 'Línea roja: ' }), D.linea.texto),
        d.elige && !esCand && el('button', { type: 'button', class: 'tecla inv-proponer', 'data-id': id, onclick: () => proponer(id) }, el('span', { html: corona() }), 'Proponer'),
      ];
      const t = tarjeta(id, esc, { cuerpo });
      if (esCand) { t.nodo.classList.add('candidato'); t.nodo.querySelector('header').append(el('span', { class: 'inv-cinta', text: 'Candidato' })); }
      T_[id] = t;
      partidosUI.append(t.nodo);
    }
    pinta(false);
  };
  const pinta = (anima = true) => {
    if (!cand) {
      solarUI.pinta({ p: { parque: 0, pista: 0, aparcamiento: 0 }, flags: new Set() }, { vacio: true });
      totales.replaceChildren(el('span', { text: 'Sin candidato todavía.' }));
      IDS.forEach((id) => T_[id].voto('no', ''));
      partidosUI.querySelectorAll('.inv-paleta').forEach((p) => (p.hidden = true));
      return;
    }
    const { P, V } = votos(d, cand, [...acepta]);
    solarUI.pinta(P);
    for (const id of IDS) { const antes = T_[id].nodo.dataset.v; T_[id].voto(V[id].v, V[id].motivo); T_[id].nodo.classList.toggle('roto', !!V[id].roto); if (anima && antes !== V[id].v && !lento()) bote(T_[id].nodo.querySelector('.inv-paleta'), 8); }
    const R = resultado(esc, V);
    totales.replaceChildren(el('span', { class: 'v-si' }, 'Sí ', el('b', { text: String(R.si) })), el('span', { class: 'v-no' }, 'No ', el('b', { text: String(R.no) })), el('span', { class: 'v-abs' }, 'Abstención ', el('b', { text: String(R.abs) })));
  };
  const toca = (pid) => {
    acepta.has(pid) ? acepta.delete(pid) : acepta.add(pid);
    suena(acepta.has(pid) ? 'pon' : 'quita');
    partidosUI.querySelector(`.inv-peticion[data-id="${pid}"]`)?.setAttribute('aria-pressed', String(acepta.has(pid)));
    pinta();
  };
  const proponer = (id) => {
    cand = id; acepta.clear(); suena('sello');
    ctx.reto(`El rey propone a **${nombre(id)}** (${esc[id]}). Negocia: consigue la investidura **sin perder tu línea roja**.`);
    monta();
    boton.disabled = false;
    if (!lento()) gsap.from(T_[id].nodo, { scale: 1.08, duration: 0.4, ease: 'back.out(2)' });
  };
  const arriba = el('div', { class: 'inv-arriba' }, el('div', { class: 'inv-col' }, cg.nodo, totales), solarUI.nodo);
  ctx.escenario.append(el('div', { class: 'inv inv-negocia' }, arriba, partidosUI));
  monta();
  const ir = () => {
    const { V } = votos(d, cand, [...acepta]);
    if (V[cand].v !== 'si') { const t = `Tus propios diputados no te votarían. ${V[cand].motivo.replace(/ Tus diputados no te votan\.$/, '')} Así no te presentas: **arregla el pacto**.`; ctx.aviso(t.replace(/\*\*/g, ''), true); ctx.di(t, 'animo', 6000); temblor(T_[cand].nodo, 6); suena('mal'); return; }
    voto();
  };
  const voto = () => prediccion(ctx, async (pred) => {
    ctx.acciones.replaceChildren();
    const { P, V } = votos(d, cand, [...acepta]);
    const v = Object.fromEntries(IDS.map((i) => [i, V[i].v]));
    d.candJugado = cand;
    const minus = (t) => t.charAt(0).toLowerCase() + t.slice(1);
    const motivos = IDS.filter((i) => i !== cand).map((i) => `${nombre(i)}: ${minus(V[i].motivo.replace(/\.$/, ''))}`);
    const R = await votar(d, ctx, cg, v, partidosUI, { solarUI, P });
    const sale = R.r !== 'no';
    const sols = soluciones(d, cand);
    let msg = describeR(R);
    if (V[cand].v !== 'si') msg = `Tus propios diputados votan no. ${V[cand].motivo} ` + msg;
    msg += ` (${motivos.join('; ')}.)`;
    msg += textoPred(pred, R);
    let est = estrellasPred(sale, pred, R.r);
    if (sale) {
      msg += ` Os quedáis **${P.p[cand]} de 12** parcelas. Sin pacto, el solar seguiría vallado: 0 para todos.`;
      const mejor = Math.max(...sols.map((s) => s.propias));
      if (d.ajustado && P.p[cand] < mejor - 1) { est = Math.min(est, 2); msg += ` Has cedido de más: se podía salir quedándoos **${mejor}**.`; }
      const otra = sols.find((s) => IDS.some((i) => s.votos[i] !== v[i]));
      if (otra) msg += ` Otra forma: que ${lista(IDS.filter((i) => i !== cand).map((i) => `${nombre(i)} ${verbo(otra.votos[i])}`))}.`;
    } else {
      msg += ' Dos meses sin gobierno: **elecciones otra vez**, y el solar sigue vallado.';
      if (d.elige && cand === M && !sols.length) msg += ` Con ${nombre(M)} de candidatos no había forma: sus líneas rojas chocan con las de los demás. Ganar no es gobernar.`;
      else if (ctx.intento > 1) {
        const s = solucionesPara(d, cand)[0];
        if (s) msg += ` Se podía${d.elige && s.cand !== cand ? ` con ${nombre(s.cand)} de candidatos` : ''}: aceptar ${lista(s.acepta.map((x) => `«${petPorId(x).texto}»`))}.`;
      }
    }
    ctx.fin(est, msg);
  }, { volver: () => { ctx.acciones.replaceChildren(); boton = ctx.boton('A votar', ir); } });
  let boton = ctx.boton('A votar', ir);
  if (d.elige) boton.disabled = true;
  // pistas con los datos de este reto
  const ref = d.elige ? IDS.filter((c) => c !== M).find((c) => soluciones(d, c).length) : cand;
  const S = soluciones(d, ref).sort((a, b) => b.propias - a.propias);
  const s0 = S[0];
  const otrosRef = IDS.filter((i) => i !== ref);
  const choques = [];
  for (const o of IDS) for (const q of IDS) {
    if (o === q) continue;
    const L = d.partidos[o].linea;
    if (L.tipo === 'veto') { const p = d.partidos[q].peticiones.find((x) => x.flag === L.flag); if (p) choques.push(`«${p.texto}» rompe la línea roja de ${nombre(o)}`); }
  }
  ctx.pistas([
    { texto: d.elige ? `El más votado no siempre puede gobernar. Mira con quién chocan las líneas rojas de **${nombre(M)}** y su mínimo de parcelas.` : `Lee las líneas rojas. ${choques.length ? choques[0][0].toUpperCase() + choques[0].slice(1) + '.' : 'Si cruzas la de un partido, vota no aunque le des todo.'}` },
    { texto: `Cada partido: **2 peticiones → sí**, 1 → abstención, 0 → no. ${d.elige ? 'Cada candidato tiene su mínimo de parcelas.' : `Tu partido no baja de **${d.partidos[cand].minimo}** parcelas.`} Y recuerda: 176 síes en la 1.ª, o más síes que noes en la 2.ª.` },
    { texto: d.elige ? `Prueba con **${nombre(ref)}** de candidatos: que ${lista(otrosRef.map((i) => `${nombre(i)} ${verbo(s0.votos[i])}`))}.` : `Una forma: que ${lista(otrosRef.map((i) => `${nombre(i)} ${verbo(s0.votos[i])}`))}. Empieza aceptando «${petPorId(s0.acepta[0]).texto}».` },
  ]);
  if (PRUEBA) window.__sol = () => ({ modo: 'negocia', cand: ref, elige: d.elige, acepta: s0.acepta, r: s0.r });
}
function solucionesPara(d, cand) {
  const propias = soluciones(d, cand).map((s) => ({ ...s, cand }));
  if (propias.length || !d.elige) return propias.sort((a, b) => b.propias - a.propias);
  for (const c of IDS) { const s = soluciones(d, c); if (s.length) return s.map((x) => ({ ...x, cand: c })).sort((a, b) => b.propias - a.propias); }
  return [];
}

/* ============================================================== la portada: el hemiciclo de cartulina */
function artePortada() {
  const esc = { parque: 150, pista: 72, aparcamiento: 128 };
  const A = asientos(), orden = ordenBloques(esc), de = [];
  let k = 0; for (const id of orden) for (let j = 0; j < esc[id]; j++) de[k++] = id;
  const puntos = A.map((p, i) => `<circle cx="${(p.x * 250).toFixed(1)}" cy="${(p.y * 250).toFixed(1)}" r="7.4" fill="${COLOR[de[i]]}"/>`).join('');
  const paleta = (txt, c) => `<svg viewBox="0 0 120 170" aria-hidden="true"><rect x="54" y="80" width="12" height="86" rx="4" fill="#d9a066" stroke="${T}" stroke-width="5"/><circle cx="60" cy="60" r="52" fill="${c}" stroke="${T}" stroke-width="6"/><text x="60" y="76" text-anchor="middle" font-family="Grandstander, system-ui" font-weight="900" font-size="44" fill="#fffdf6">${txt}</text></svg>`;
  return `<div class="arte arte-inv" aria-hidden="true"><svg viewBox="-280 -290 560 330" class="inv-port-hemi"><g transform="rotate(-2)"><path d="M-268 14 A268 268 0 0 1 268 14 Z" fill="#fffdf6" stroke="${T}" stroke-width="6"/><path d="M-80 14 A80 80 0 0 1 80 14Z" fill="#f1e6cf" stroke="${T}" stroke-width="5"/><g stroke="${T}" stroke-width="2.2">${puntos}</g></g></svg><span class="inv-port-176">176</span><div class="abertura"><span class="pieza pz1">${paleta('SÍ', '#2f5bd3')}</span><span class="pieza pz2">${paleta('NO', '#e8417a')}</span></div></div>`;
}
if (typeof document !== 'undefined' && document.body) {
  const pon = () => {
    const a = document.querySelector('.portada-capa .portada-arte');
    if (!a || a.dataset.inv) return !!a;
    a.dataset.inv = '1';
    a.innerHTML = artePortada();
    if (!lento()) gsap.from(a.querySelectorAll('.abertura .pieza'), { y: 50, rotation: () => gsap.utils.random(-30, 30), opacity: 0, duration: 0.5, ease: 'back.out(2)', stagger: 0.15, delay: 0.7 });
    return true;
  };
  const mo = new MutationObserver(() => { if (pon()) mo.disconnect(); });
  mo.observe(document.body, { childList: true });
  setTimeout(() => mo.disconnect(), 20000);
}
