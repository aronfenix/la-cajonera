// Motor «texto» (Lengua): se trabaja sobre textos de verdad, palabra a palabra.
//   puntua  → un texto sin puntos ni comas: se ponen con el sello y se escucha cómo queda leído con esas pausas
//   corrige → el texto llega puntuado, pero con errores: hay que encontrarlos y arreglarlos
//   sentido → una frase que cambia de significado con la coma: la viñeta dibuja lo que dice en cada momento
// Los textos van en la configuración del juego (config.textos: [{ f, titulo, t, nota }]) con este marcado:
//   .  ,      punto y coma obligatorios          .¶     punto y aparte
//   (,)       coma opcional (vale ponerla o no)  ,{e}   coma con motivo: e lista, v a quien hablas, i aclaración, c conector
//   {sv}      trampa: aquí NO va coma (sv sujeto y verbo, y delante de la «y» de una lista)
//   ^Nombre   nombre propio al empezar una oración (no se pone en minúscula al quitar el punto)
// Un texto normal y corriente, tal cual, ya es marcado válido: por eso sirve también para «Puntúa tu texto».
import { el, elige, barajar, suena, conSonido } from './nucleo.js';
import { gsap } from './vendor/gsap.js';
import { espera, temblor, chispasEn } from './efectos.js';
import { dib } from './vida-dibujos.js';
import { FRASES, vineta } from './texto-escenas.js';

const lento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const limpia = (t) => t.replace(/^[—«¿¡"“(]+|[»"”).,;:?!…]+$/g, '');
const priLetra = (s, f) => s.replace(/\p{L}/u, f);
const NOMBRE = { ',': 'Coma', '.': 'Punto', '¶': 'Punto y aparte' };
const porIntento = (n) => Math.max(0, 4 - n);
const negrita = (t) => t.replace(/\*\*/g, '').replace(/\*/g, '');
try { speechSynthesis?.getVoices(); } catch {} // las voces tardan en cargarse: se piden ya

/* =========================================================================== el texto */
const RE = /^(\^?)(.*?)(\.¶|\.|,\{[a-z]\}|\(,\)|,|\{[a-z]+\})?$/u;
export function analiza(marcado) {
  const P = marcado.trim().split(/\s+/).map((tr) => {
    const [, , t, m = ''] = tr.replace('^', '').match(RE);
    const p = { t, propio: tr.includes('^'), req: null, tipo: null, opc: false, trampa: null, cierra: /[?!…][»"”)]*$/.test(t), sinHueco: /[?!…:;][»"”)]*$/.test(t) };
    if (m === '.¶') p.req = '¶'; else if (m === '.') p.req = '.'; else if (m === '(,)') p.opc = true;
    else if (m[0] === ',') { p.req = ','; p.tipo = m[2] ?? null; } else if (m) p.trampa = m.slice(1, -1);
    return p;
  });
  const finOracion = (p) => p.req === '.' || p.req === '¶' || p.cierra;
  // nombres propios: los que van con mayúscula también en mitad de una oración
  const propios = new Set();
  let ini = true;
  for (const p of P) { if (!ini && /^[—«¿¡"“(]*\p{Lu}/u.test(p.t)) propios.add(limpia(p.t)); ini = finOracion(p); }
  ini = true;
  for (const p of P) {
    p.may = priLetra(p.t, (c) => c.toUpperCase());
    p.min = ini && !p.propio && !propios.has(limpia(p.t)) ? priLetra(p.t, (c) => c.toLowerCase()) : p.t;
    ini = finOracion(p);
  }
  return P;
}
// parte un texto largo en trozos de pocas oraciones (para «Puntúa tu texto»)
export function trocea(texto, palabras = 45) {
  const tr = texto.replace(/\.[ \t]*\n\s*/g, '.¶ ').trim().split(/\s+/);
  const trozos = []; let act = [];
  tr.forEach((t, i) => {
    act.push(t);
    const fin = /(\.¶|\.|[?!…][»"”)]*)$/.test(t);
    if (fin && (act.length >= palabras || (/\.¶$/.test(t) && act.length >= palabras * 0.6) || i === tr.length - 1)) { trozos.push(act.join(' ').replace(/\.¶$/, '.')); act = []; }
  });
  if (act.length) trozos.push(act.join(' '));
  return trozos;
}

/* =========================================================================== generar */
const usados = new Map();
function saca(clave, lista) {
  const u = usados.get(clave) ?? new Set();
  let libres = lista.filter((x) => !u.has(x));
  if (!libres.length) { u.clear(); libres = lista; }
  const x = elige(libres); u.add(x); usados.set(clave, u);
  return x;
}
export function generar(spec, config = {}) {
  const d = structuredClone(spec);
  const g = typeof d.generar === 'object' ? d.generar : {};
  delete d.generar;
  if (d.modo === 'sentido') {
    d.frase = saca('sentido', g.ids ?? Object.keys(FRASES));
    const ks = Object.keys(FRASES[d.frase].lecturas);
    d.meta = elige(ks); d.inicio = elige(ks.filter((k) => k !== d.meta));
    return d;
  }
  d.signos ??= [',', '.'];
  if (!d.texto) {
    const cuenta = (t, re) => (t.match(re) || []).length;
    const vale = (x) => (x.f ?? 1) <= (g.f ?? 9) && (x.f ?? 1) >= (g.min ?? 1)
      && (!d.signos.includes('¶') || x.t.includes('.¶'))
      && (d.signos.includes('.') || cuenta(x.t, /,(\{[a-z]\})?(\s|$)/g) >= 2)
      && (d.signos.length !== 2 || cuenta(x.t, /,(\{[a-z]\})?(\s|$)/g) >= 1)
      && (!x.para || x.para === d.signos.join(''))
      && (d.modo !== 'corrige' || cuenta(x.t, /\.(\s|¶)/g) >= 2);
    const banco = (config.textos ?? []).filter(vale);
    if (!banco.length) throw new Error('no hay ningún texto en «textos» que sirva para este nivel.');
    const x = saca('t-' + d.signos.join(''), banco);
    d.texto = x.t; d.titulo = x.titulo; d.nota = x.nota;
  }
  return d;
}
export function ronda(d, ctx) {
  if (d.modo === 'sentido') return sentido(d, ctx);
  if (d.modo === 'puntua' || d.modo === 'corrige') return puntua(d, ctx);
  throw new Error(`no encuentro el modo «${d.modo}». Si el juego se acaba de actualizar, recarga la página.`);
}

/* =========================================================================== la voz (solo si la tablet trae una, sin enviar nada fuera) */
function vozLocal() {
  try {
    if (!conSonido() || !('speechSynthesis' in window)) return null;
    const v = speechSynthesis.getVoices().filter((x) => /^es/i.test(x.lang) && x.localService);
    return v.find((x) => /es[-_]ES/i.test(x.lang)) || v[0] || null;
  } catch { return null; }
}
const habla = (voz, texto) => new Promise((ok) => {
  try {
    const u = new SpeechSynthesisUtterance(texto);
    u.voice = voz; u.lang = voz.lang; u.rate = 0.95; u.onend = u.onerror = () => ok();
    speechSynthesis.speak(u);
    setTimeout(ok, 1500 + texto.length * 120); // por si la voz no avisa de que ha terminado
  } catch { ok(); }
});

/* =========================================================================== puntuar y corregir */
function puntua(d, ctx) {
  const signos = d.signos, corr = d.modo === 'corrige';
  const P = analiza(d.texto), N = P.length;
  // qué se pide en este nivel: lo que no entra en sus signos se da ya puesto
  for (const p of P) {
    let r = p.req;
    if (r === '¶' && !signos.includes('¶')) r = '.';
    p.fijo = r && !signos.includes(r) ? r : '';
    p.r = p.fijo ? null : r;
    p.o = p.opc && signos.includes(',');
    p.abierto = !p.fijo && !p.sinHueco;
    p.salto = p.fijo === '.' && p.req === '¶';
  }
  const sig = P.map(() => '');
  const sol = P.map((p) => p.r ?? '');
  const nP = sol.filter((s) => s === '.' || s === '¶').length, nC = sol.filter((s) => s === ',').length;

  // el aire de Fosforito: con la puntuación correcta nunca se ahoga
  const pausaDe = (j, s) => P[j].fijo || s[j] || (P[j].cierra ? '.' : /[:;]/.test(P[j].t.slice(-1)) ? ',' : '');
  const ahogos = (cap, s) => { let a = cap, n = 0; for (let j = 0; j < N; j++) { if (a <= 0) { n++; a = cap / 2; } a--; const z = pausaDe(j, s); if (z === ',') a = Math.min(cap, a + cap / 2); else if (z) a = cap; } return n; };
  let CAP = 12; while (ahogos(CAP, sol)) CAP++;

  // en «corrige», el texto llega con errores metidos a propósito
  let nErr = 0;
  if (corr) {
    P.forEach((p, j) => (sig[j] = p.r ?? (p.o ? ',' : '')));
    const J = (f) => barajar(P.map((_, j) => j).filter((j) => P[j].abierto && j < N - 1 && f(P[j], j)));
    const cand = [
      ...J((p) => p.trampa).map((j) => [j, ',']),
      ...J((p) => p.r === '.').slice(0, 2).map((j) => [j, ',']),
      ...J((p) => p.r === ',').slice(0, 1).map((j) => [j, '']),
      ...J((p) => p.r === '.').slice(0, 1).map((j) => [j, '']),
      ...J((p, j) => !p.r && !p.o && !p.trampa && j > 0 && !P[j - 1].r && !P[j - 1].fijo && !P[j + 1].r && !P[j + 1].fijo && !P[j - 1].sinHueco).slice(0, 2).map((j) => [j, '.']),
    ];
    const tocados = new Set();
    for (const [j, s] of barajar(cand.slice(0, 3)).concat(barajar(cand.slice(3)))) {
      if (nErr >= (d.errores ?? 2)) break;
      if (tocados.has(j) || tocados.has(j - 1) || tocados.has(j + 1)) continue;
      sig[j] = s; tocados.add(j); nErr++;
    }
  }

  ctx.reto(d.enunciado ?? (corr ? `Boli ha repasado este texto y dice que tiene **${nErr} ${nErr === 1 ? 'error' : 'errores'} de puntuación**. Encuéntralos y arréglalos.`
    : signos.length === 1 && signos[0] === '.' ? 'A este texto le faltan **los puntos**. Ponlos para que se pueda leer sin ahogarse.'
    : signos.length === 1 ? 'A este texto le faltan **las comas**. Ponlas donde hagan falta.'
    : signos.includes('¶') ? 'Faltan **los puntos y las comas**. Y ojo: en un sitio se cambia de asunto, y ahí va **punto y aparte**.'
    : 'A este texto le faltan **los puntos y las comas**. Ponlos donde hagan falta.'));
  ctx.pista(d.pista ?? 'Elige un sello y toca la palabra que lleva el signo detrás. Antes de comprobar, pide que te lo lean.');

  /* ---- el folio */
  let herr = signos[0], leyendo = false, fin = false;
  const pals = [], saltos = [];
  const mayus = (j) => j === 0 || P[j - 1].cierra || P[j - 1].fijo === '.' || sig[j - 1] === '.' || sig[j - 1] === '¶';
  const pinta = (j, pop) => {
    const p = P[j], b = pals[j], s = p.fijo || sig[j];
    const w = mayus(j) ? p.may : p.min, antes = b.firstChild.textContent;
    b.firstChild.textContent = w;
    b.lastChild.textContent = s === '¶' ? '.' : s;
    b.classList.toggle('puesto', !p.fijo && !!sig[j] && !corr);
    saltos[j].hidden = !(p.salto || sig[j] === '¶');
    if (pop && !lento()) { if (sig[j]) gsap.fromTo(b.lastChild, { scale: 2.6, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.3, ease: 'back.out(2.5)' }); }
    if (antes && antes !== w && !lento()) gsap.fromTo(b.firstChild, { y: -5 }, { y: 0, duration: 0.3, ease: 'bounce.out' });
  };
  const toca = (j) => {
    if (leyendo || fin) return;
    const p = P[j];
    if (!p.abierto) return temblor(pals[j], 3);
    const nuevo = herr === 'x' || sig[j] === herr ? '' : herr;
    if (nuevo === sig[j]) return;
    sig[j] = nuevo; pals[j].classList.remove('mal', 'bien');
    suena(nuevo ? 'pon' : 'quita');
    pinta(j, true); if (j + 1 < N) pinta(j + 1);
    ctx.aviso('');
  };
  const parrafo = el('p', { class: 't-texto' });
  P.forEach((p, j) => {
    const b = el('button', { type: 'button', class: 't-pal', 'aria-disabled': String(!p.abierto), onclick: () => toca(j) }, el('span', { class: 't-w' }), el('span', { class: 't-s' }));
    const salto = el('span', { class: 't-salto', hidden: true });
    pals.push(b); saltos.push(salto);
    parrafo.append(b, ' ', salto);
  });
  const folio = el('div', { class: 't-folio' + (corr ? ' impreso' : '') }, d.titulo && el('span', { class: 't-titulo', text: d.titulo }), parrafo);
  P.forEach((_, j) => pinta(j));

  /* ---- los sellos y el aire */
  const GOMA = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 26 L22 8 l12 9 L20 35 h-8z" fill="#ff8ac4" stroke="#1b1e3a" stroke-width="3" stroke-linejoin="round"/><path d="M14 18 l12 9" stroke="#1b1e3a" stroke-width="3"/></svg>';
  const sellos = el('div', { class: 't-sellos', role: 'radiogroup', 'aria-label': 'Sellos' }, [...signos, 'x'].map((s) => el('button', { type: 'button', class: 'tecla t-sello', role: 'radio', 'aria-checked': String(s === herr), 'data-s': s,
    onclick: (e) => { herr = s; suena('clic'); sellos.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b === e.currentTarget))); } },
  el('b', s === 'x' ? { html: GOMA } : { class: s === '¶' ? 'aparte' : '', text: s === '¶' ? '.' : s }), el('span', { text: s === 'x' ? 'Borrar' : NOMBRE[s] }))));
  const pulmon = el('span', { class: 't-pulmon', html: dib('pulmones') }), barra = el('i');
  const aireEl = el('div', { class: 't-aire', 'aria-hidden': 'true' }, pulmon, el('span', { class: 't-aire-barra' }, barra), el('small', { text: 'Aire de Fosforito' }));
  const ponAire = (a) => { const f = Math.max(0, a / CAP); barra.style.width = f * 100 + '%'; aireEl.classList.toggle('poco', f < 0.25); pulmon.style.transform = `scale(${0.72 + 0.28 * f})`; };
  ctx.escenario.append(el('div', { class: 't-mesa' }, folio, el('div', { class: 't-lado' }, sellos, aireEl)));

  /* ---- leer en voz alta: Fosforito subraya palabra a palabra y respira en cada pausa */
  const tramo = (j) => { let t = ''; for (let k = j; k < N; k++) { const z = pausaDe(k, sig); t += pals[k].firstChild.textContent + (z === '¶' ? '.' : z) + ' '; if (z) break; } return t; };
  async function lee() {
    if (leyendo) { leyendo = false; return; }
    if (fin) return;
    leyendo = true; bLee.textContent = 'Parar'; bComp.disabled = true; ctx.aviso('');
    pals.forEach((b) => b.classList.remove('leida', 'ahogo'));
    const voz = ctx.pizarra ? null : vozLocal(), k = lento() ? 0.25 : 1;
    let a = CAP, n = 0, finVoz = null;
    ponAire(a);
    for (let j = 0; j < N && leyendo; j++) {
      if (a <= 0) {
        n++; a = CAP / 2; pals[j].classList.add('ahogo'); aireEl.classList.add('ahogo'); suena('mal'); temblor(folio, 4);
        if (n === 1) ctx.di?.('¡Aire! ¡Aquí no hay quien respire!');
        await espera(750 * k); aireEl.classList.remove('ahogo');
      }
      if (voz && !finVoz) finVoz = habla(voz, tramo(j));
      pals[j].classList.add('leida'); a--; ponAire(a);
      await espera((150 + 26 * Math.min(10, P[j].t.length)) * k);
      const z = pausaDe(j, sig);
      if (z) {
        if (finVoz) { await finVoz; finVoz = null; }
        a = z === ',' ? Math.min(CAP, a + CAP / 2) : CAP; ponAire(a);
        await espera((z === ',' ? 260 : z === '¶' ? 800 : 520) * k);
      }
    }
    try { if (voz) speechSynthesis.cancel(); } catch {}
    const entero = leyendo; leyendo = false; bLee.textContent = 'Leer en voz alta'; bComp.disabled = false;
    if (!entero) { pals.forEach((b) => b.classList.remove('leida')); ponAire(CAP); return; }
    ctx.aviso(n ? `Fosforito se ha quedado sin aire ${n === 1 ? 'una vez' : n + ' veces'}. Antes de cada «¡aire!» falta una pausa.` : 'Ha llegado al final sin ahogarse. Ahora mira si cada punto cierra una idea completa.', n > 0);
  }

  /* ---- comprobar */
  const errores = () => {
    const E = [];
    P.forEach((p, j) => {
      if (!p.abierto) return;
      const s = sig[j], r = p.r; let t;
      if (r === '.') t = s === '.' ? null : s === '¶' ? 'aparte-sobra' : s === ',' ? 'coma-por-punto' : 'falta-punto';
      else if (r === '¶') t = s === '¶' ? null : s === '.' ? 'falta-aparte' : s === ',' ? 'coma-por-punto' : 'falta-punto';
      else if (r === ',') t = s === ',' ? null : s ? 'corte' : 'falta-coma';
      else if (p.o) t = !s || s === ',' ? null : 'corte';
      else t = !s ? null : s === ',' ? 'coma-sobra' : 'corte';
      if (t) E.push({ j, t });
    });
    return E;
  };
  const explica = ({ j, t }) => {
    const A = `«${limpia(P[j].t)}»`, B = j + 1 < N ? `«${limpia(P[j + 1].t)}»` : '';
    const resto = P.slice(j + 1, j + 5).map((p) => limpia(p.t).toLowerCase()).join(' ');
    switch (t) {
      case 'falta-punto': return j === N - 1 ? 'El texto termina **sin punto final**.' : `Entre ${A} y ${B} termina una idea y empieza otra: ahí va **punto**.`;
      case 'coma-por-punto': return `Entre ${A} y ${B} has dejado una coma, pero lo que sigue es **otra oración entera**, con su propio verbo: hace falta punto.`;
      case 'corte': return `El punto después de ${A} **parte una oración por la mitad**: «${resto}…» no se sostiene sola.`;
      case 'coma-sobra': return P[j].trampa === 'sv' ? `Entre ${A} y ${B} no va coma: **no se separa a quien hace algo de lo que hace**.`
        : P[j].trampa === 'y' ? `Delante de la «y» que cierra una lista **no va coma**: sobra la de ${A}.` : `La coma después de ${A} sobra: ahí no hay pausa.`;
      case 'falta-coma': return P[j].tipo === 'e' ? `Los elementos de una lista se separan con comas: falta una después de ${A}.`
        : P[j].tipo === 'v' ? `Cuando le hablas a alguien, su nombre va **separado por comas**: falta una después de ${A}.`
        : P[j].tipo === 'i' ? `Una aclaración metida en mitad de la oración va **entre dos comas**: falta la de después de ${A}.`
        : P[j].tipo === 'c' ? `Expresiones como «en cambio» o «sin embargo» van **entre comas**: falta la de después de ${A}.`
        : `Falta una coma después de ${A}.`;
      case 'falta-aparte': return `Después de ${A} se cambia de asunto: mejor **punto y aparte**.`;
      default: return `Después de ${A} se sigue hablando de lo mismo: basta con **punto y seguido**.`;
    }
  };
  let intentos = 0;
  const bLee = ctx.boton('Leer en voz alta', lee);
  bLee.classList.add('t-leer');
  const bComp = ctx.boton('Comprobar', () => {
    if (leyendo || fin) return;
    intentos++;
    const E = errores();
    pals.forEach((b) => b.classList.remove('mal'));
    if (!E.length) {
      fin = true; pals.forEach((b, j) => !P[j].fijo && sig[j] && b.classList.add('bien')); chispasEn(folio, 14);
      const cuenta = [nP && `${nP} ${nP === 1 ? 'punto' : 'puntos'}`, nC && `${nC} ${nC === 1 ? 'coma' : 'comas'}`].filter(Boolean).join(' y ');
      return ctx.fin(intentos === 1 ? 3 : 2, `**${cuenta}, ${nP && nC ? 'todo' : nC ? 'todas' : 'todos'} en su sitio.** ` + (d.nota ?? (corr ? 'Ni Boli lo habría corregido mejor.' : 'Cada punto cierra una idea completa.')));
    }
    const puestos = E.filter((e) => sig[e.j]);
    puestos.forEach((e) => pals[e.j].classList.add('mal'));
    if (intentos === 1) {
      suena('mal'); temblor(folio, 4);
      const faltan = E.length - puestos.length;
      return ctx.aviso([puestos.length && `${puestos.length === 1 ? 'Hay un signo' : `Hay ${puestos.length} signos`} que no ${puestos.length === 1 ? 'va' : 'van'} ahí (en rojo)`, faltan && `${puestos.length ? 'y ' : ''}${faltan === 1 ? 'falta uno' : `faltan ${faltan}`} por poner`].filter(Boolean).join(' ') + '. Repásalo y vuelve a comprobar.', true);
    }
    fin = true;
    E.forEach((e) => { if (!sig[e.j]) { const r = P[e.j].r; pals[e.j].lastChild.textContent = r === '¶' ? '.' : r; pals[e.j].classList.add('falta'); } });
    ctx.fin(E.length <= 2 ? 1 : 0, E.slice(0, 3).map(explica).join(' ') + (E.length > 3 ? ` Y ${E.length - 3} más, en rojo.` : ''));
  });

  const primero = (s) => { const j = sol.findIndex((x) => (s === '.' ? x === '.' || x === '¶' : x === s)); return j < 0 ? null : `«${limpia(P[j].t)}»`; };
  ctx.pistas([
    { texto: corr ? 'Lee cada oración por separado. ¿Tiene sentido ella sola? ¿Alguna coma separa a quien hace algo de lo que hace?'
      : signos.includes('.') ? 'Busca dónde **termina una idea completa**: alguien hace algo, y ya está dicho. Ahí va el punto.'
      : 'Las comas separan los elementos de una lista, rodean una aclaración y acompañan al nombre de la persona a la que hablas.' },
    { texto: `Bien puntuado, este texto lleva ${[nP && `**${nP} ${nP === 1 ? 'punto' : 'puntos'}**`, nC && `**${nC} ${nC === 1 ? 'coma obligatoria' : 'comas obligatorias'}**`].filter(Boolean).join(' y ')}${signos.includes('¶') ? ' (uno de los puntos es punto y aparte)' : ''}.` },
    { texto: nP ? `El primer punto va después de ${primero('.')}.` : `La primera coma va después de ${primero(',')}.` },
  ]);
  if (new URLSearchParams(location.search).has('prueba')) window.__sol = () => sol.map((s, j) => (P[j].abierto ? s : null));
}

/* =========================================================================== la coma cambia el sentido */
function sentido(d, ctx) {
  const F = FRASES[d.frase], L = F.lecturas, meta = L[d.meta], N = F.pal.length;
  ctx.reto(`Mueve las comas hasta que la frase diga esto: **${meta.pide}**`);
  ctx.pista(d.pista ?? 'Toca una palabra para ponerle una coma detrás, o para quitársela. La viñeta dibuja lo que dice la frase.');
  const comas = new Set(L[d.inicio].comas);
  const cual = () => Object.keys(L).find((k) => L[k].comas.length === comas.size && L[k].comas.every((c) => comas.has(c))) ?? null;
  const cuadro = el('div', { class: 't-vineta' }), pie = el('p', { class: 't-pie', 'aria-live': 'polite' });
  const pals = F.pal.map((t, j) => el('button', { type: 'button', class: 't-pal', 'aria-disabled': String(j === N - 1), onclick: () => {
    if (hecho) return;
    if (j === N - 1) return temblor(pals[j], 3);
    comas.has(j) ? comas.delete(j) : comas.add(j);
    suena(comas.has(j) ? 'pon' : 'quita'); pinta(j);
  } }, el('span', { class: 't-w', text: t }), el('span', { class: 't-s', text: j === N - 1 ? '.' : '' })));
  let hecho = false;
  const pinta = (j) => {
    const k = cual();
    cuadro.innerHTML = vineta(d.frase, k);
    pie.textContent = k ? 'Ahora dice que ' + L[k].dice : 'Así, con las comas ahí, no se entiende.';
    pals.forEach((b, i) => { if (i < N - 1) { b.lastChild.textContent = comas.has(i) ? ',' : ''; b.classList.toggle('puesto', comas.has(i)); } });
    if (j != null && !lento()) {
      gsap.from(cuadro.firstChild, { scale: 0.92, opacity: 0, duration: 0.3, ease: 'back.out(2)' });
      if (comas.has(j)) gsap.fromTo(pals[j].lastChild, { scale: 2.6, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.3, ease: 'back.out(2.5)' });
    }
    ctx.aviso('');
  };
  const frase = el('div', { class: 't-frase' }, F.antes && el('span', { class: 't-antes', text: F.antes }), el('p', {}, F.antes ? '—' : '', ...pals.flatMap((b) => [b, ' '])));
  ctx.escenario.append(el('div', { class: 't-sentido' }, frase, el('div', {}, cuadro, pie)));
  pinta();
  let intentos = 0;
  const escrita = (k) => F.pal.map((t, i) => t + (L[k].comas.includes(i) ? ',' : '')).join(' ') + '.';
  ctx.boton('Así está bien', () => {
    if (hecho) return;
    intentos++;
    if (cual() === d.meta) { hecho = true; chispasEn(cuadro, 12); return ctx.fin(porIntento(intentos), F.explica); }
    suena('mal'); temblor(cuadro, 5);
    ctx.aviso(negrita(cual() ? `Mira la viñeta: ahora dice que ${L[cual()].dice}` : 'Con las comas ahí, la frase no se entiende.'), true);
    if (intentos >= 3) { hecho = true; ctx.fin(0, `Era así: «${escrita(d.meta)}» ` + F.explica); }
  });
  const n = meta.comas.length;
  ctx.pistas([
    { texto: F.pista },
    { texto: n ? `${n === 1 ? 'Hace falta **una coma**' : `Hacen falta **${n} comas**`}.` : 'Para que diga eso, **no hace falta ninguna coma**.' },
    { texto: n ? `Una va después de «${F.pal[meta.comas[0]]}».` : 'Quita todas las comas.' },
  ]);
}
