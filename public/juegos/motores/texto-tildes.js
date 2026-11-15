// Tildes sobre el motor «texto». La idea: la tilde solo hace falta cuando la palabra NO suena como se lee.
// La lupa enseña cómo se lee una palabra TAL COMO ESTÁ ESCRITA (con las reglas: sin tilde, si acaba en vocal, n o s
// suena la penúltima sílaba; si no, la última). El alumno compara eso con cómo se dice de verdad.
//   palabra → varias palabras sueltas: hacer que cada una se lea como se dice (o dejarla como está)
//   tilda   → un texto sin tildes (o con errores, si lleva «errores»): se abren las palabras con la lupa y se arreglan
// Los textos son texto normal, bien escrito: no hace falta marcar nada. Las tildes diacríticas (él, más, qué…) se dan puestas.
import { el, elige, barajar, suena } from './nucleo.js';
import { gsap } from './vendor/gsap.js';
import { espera, temblor, chispasEn } from './efectos.js';

const lento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const SIN = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U' };
const CON = Object.fromEntries(Object.entries(SIN).map(([a, b]) => [b, a]));
const quita = (w) => w.replace(/[áéíóúÁÉÍÓÚ]/g, (c) => SIN[c]);
const tieneTilde = (w) => /[áéíóúÁÉÍÓÚ]/.test(w);
const DIACR = new Set('qué cómo cuándo dónde quién quiénes cuál cuáles cuánto cuánta cuántos cuántas él tú mí sí más té dé sé aún sólo'.split(' '));
const porFallos = (f) => (f === 0 ? 3 : f === 1 ? 2 : f === 2 ? 1 : 0);

/* =========================================================================== sílabas y golpe de voz */
export function silabas(pal) {
  const w = pal.toLowerCase(), n = w.length, V = 'aeiouáéíóúü';
  const voc = (i) => {
    const c = w[i];
    if (c === 'y') return n === 1 || (i === n - 1 && i > 0 && V.includes(w[i - 1]));
    if (!V.includes(c)) return false;
    return !(c === 'u' && i > 0 && (w[i - 1] === 'q' || (w[i - 1] === 'g' && 'eiéí'.includes(w[i + 1] ?? '')))); // la u muda de que, qui, gue, gui
  };
  const debil = (c) => 'iuüy'.includes(c);
  const nuc = [], vocs = [];
  for (let i = 0; i < n;) {
    if (!voc(i)) { i++; continue; }
    let ult = i; vocs.push(i);
    for (;;) { // diptongos y triptongos: una vocal débil sin tilde se pega a la de al lado (la h no estorba)
      let k = ult + 1; if (w[k] === 'h' && k + 1 < n && voc(k + 1)) k++;
      if (k < n && voc(k) && (debil(w[ult]) || debil(w[k]))) { ult = k; vocs.push(k); } else break;
    }
    nuc.push([i, ult]); i = ult + 1;
  }
  if (!nuc.length) return { sil: [[0, n]], nuc, vocs };
  const cortes = [0];
  for (let k = 0; k < nuc.length - 1; k++) {
    const a = nuc[k][1] + 1, b = nuc[k + 1][0], u = [];
    for (let j = a; j < b; j++) { const par = w.slice(j, j + 2), doble = ['ch', 'll', 'rr', 'qu', 'gu'].includes(par) && j + 1 < b; u.push({ i: j, s: doble ? par : w[j] }); if (doble) j++; }
    if (u.length <= 1) cortes.push(a);
    else { const [x, y] = u.slice(-2); cortes.push((y.s === 'l' || y.s === 'r') && 'pbfgckdt'.includes(x.s) && !['dl', 'tl'].includes(x.s + y.s) ? x.i : y.i); }
  }
  return { sil: cortes.map((c, k) => [c, cortes[k + 1] ?? n]), nuc, vocs };
}
// índice de la sílaba que suena fuerte, tal como está escrita la palabra
export function tonica(pal) {
  const { sil } = silabas(pal), i = pal.search(/[áéíóúÁÉÍÓÚ]/);
  if (i >= 0) return sil.findIndex(([a, b]) => i >= a && i < b);
  if (sil.length === 1) return 0;
  return 'aeiouns'.includes(pal.at(-1).toLowerCase()) ? sil.length - 2 : sil.length - 1;
}
// cómo suena: ca-MION (sin tildes, con la sílaba fuerte en mayúsculas)
export function pron(pal) {
  const { sil } = silabas(pal), t = tonica(pal), base = quita(pal).toLowerCase();
  const partes = sil.map(([a, b], k) => (k === t && sil.length > 1 ? base.slice(a, b).toUpperCase() : base.slice(a, b)));
  return { txt: partes.join('-'), partes, t, n: sil.length };
}
const pronNodos = (pal) => { const p = pron(pal); return p.partes.flatMap((s, k) => [k ? el('i', { text: '-' }) : null, k === p.t && p.n > 1 ? el('b', { text: s }) : el('span', { text: s })]).filter(Boolean); };
// la vocal que llevaría la tilde: la fuerte de la sílaba tónica
function vocalTonica(pal) {
  const { sil, vocs } = silabas(pal), [a, b] = sil[tonica(pal)];
  const dentro = vocs.filter((i) => i >= a && i < b && /[aeiouáéíóú]/i.test(pal[i]));
  return dentro.find((i) => 'aeoáéó'.includes(pal[i].toLowerCase())) ?? dentro.at(-1);
}
const ponTilde = (pal, i) => { const b = quita(pal); return b.slice(0, i) + (CON[b[i]] ?? b[i]) + b.slice(i + 1); };
const editable = (core) => /\p{L}/u.test(core) && !/\d/.test(core) && silabas(core).vocs.length > 0 && !DIACR.has(core.toLowerCase()) && !(tieneTilde(core) && /mente$/i.test(core));

// por qué lleva (o no lleva) tilde, con la palabra delante
export function porque(orig) {
  const O = silabas(orig), tO = tonica(orig), base = quita(orig), nB = silabas(base).sil.length;
  const fin = base.at(-1).toLowerCase(), vns = 'aeiouns'.includes(fin), dice = pron(orig).txt, leeBase = pron(base).txt;
  const acaba = 'aeiou'.includes(fin) ? 'vocal' : `«${fin}»`;
  if (!tieneTilde(orig)) {
    if (O.sil.length === 1) return `«${orig}» tiene **una sola sílaba**: no hay dónde elegir, así que va sin tilde.`;
    return `«${orig}» ya se lee **${dice}** sin ayuda: acaba en ${acaba} y suena la ${vns ? 'penúltima' : 'última'} sílaba, que es lo que se lee sin tilde. No la necesita.`;
  }
  if (nB < O.sil.length) return `Sin tilde, «${base}» se leería **${leeBase}**, con las vocales pegadas. Se dice **${dice}**: la tilde las separa.`;
  if (O.sil.length - 1 - tO >= 2) return `«${orig}» se dice **${dice}**: el golpe va en la antepenúltima sílaba, y esas llevan tilde siempre.`;
  return `Sin tilde, «${base}» se leería **${leeBase}**, porque acaba en ${acaba}. Se dice **${dice}**: por eso lleva tilde.`;
}

/* =========================================================================== generar */
const TRAMPA = /^(fue|vio|dio|fui|vi|di|fe|ti|pie|ves|dios)$/i;
function estropea(w) { // una tilde que sobra, puesta donde suena el golpe: «exámen», «fué»
  const i = vocalTonica(w);
  return i == null ? w : ponTilde(w, i);
}
export function generarTildes(d, g, config, saca) {
  const f = (x) => (x.f ?? 1) <= (g.f ?? 9) && (x.f ?? 1) >= (g.min ?? 1);
  if (d.modo === 'palabra') {
    const banco = (config.palabras ?? []).filter(f);
    if (banco.length < 3) throw new Error('faltan palabras en «palabras» para este nivel.');
    const lista = [];
    while (lista.length < (g.n ?? 3)) { const x = saca('pal', banco); if (!lista.includes(x)) lista.push(x); }
    d.palabras = lista.map((x) => ({ w: x.w, ini: tieneTilde(x.w) ? quita(x.w) : Math.random() < 0.5 ? estropea(x.w) : x.w }));
  } else if (!d.texto) {
    const banco = (config.textos ?? []).filter(f);
    if (!banco.length) throw new Error('no hay ningún texto en «textos» que sirva para este nivel.');
    const x = saca('tilda', banco);
    d.texto = x.t; d.titulo = x.titulo; d.nota = x.nota;
  }
  return d;
}

/* =========================================================================== la lupa */
function creaLupa(alCambiar) {
  const letras = el('div', { class: 'tl-letras' }), lee = el('p', { class: 'tl-lee', 'aria-live': 'polite' });
  const caja = el('div', { class: 'tl-lupa vacia' }, el('div', { class: 'tl-cristal' }, letras), el('small', { text: 'Así escrita, se lee:' }), lee, el('p', { class: 'tl-ayuda', text: 'Toca una palabra del texto para mirarla de cerca.' }));
  let pal = null, fijo = false;
  const toca = (i) => { pal = SIN[pal[i]] ? quita(pal) : ponTilde(pal, i); suena(SIN[pal[i]] ? 'pon' : 'quita'); pinta(true); alCambiar?.(pal); };
  const pinta = (anim) => {
    caja.classList.toggle('vacia', pal == null);
    if (pal == null) return;
    const { sil, vocs } = silabas(pal);
    letras.replaceChildren(...sil.flatMap(([a, b], k) => [k ? el('i', { text: '·' }) : null, el('span', { class: 'tl-sil' }, [...pal.slice(a, b)].map((c, x) => {
      const i = a + x, v = vocs.includes(i) && c.toLowerCase() !== 'y';
      return v && !fijo ? el('button', { type: 'button', class: 'tl-v' + (SIN[c] ? ' con' : ''), text: c, 'aria-label': `${c}: ${SIN[c] ? 'quitar' : 'poner'} tilde`, onclick: () => toca(i) }) : el('span', { text: c });
    }))]).filter(Boolean));
    lee.replaceChildren(...pronNodos(pal));
    if (anim && !lento()) gsap.fromTo(lee.querySelector('b') ?? lee, { scale: 1.5, y: -6 }, { scale: 1, y: 0, duration: 0.35, ease: 'back.out(3)' });
  };
  return { caja, pon: (p, f = false) => { pal = p; fijo = f; pinta(true); }, pal: () => pal };
}

/* =========================================================================== palabras sueltas */
export function palabra(d, ctx) {
  const lista = d.palabras;
  ctx.reto(d.enunciado ?? 'Haz que cada palabra **se lea como se dice**. Si ya suena bien tal como está, no le pongas nada.');
  ctx.pista(d.pista ?? 'Toca una vocal para ponerle o quitarle la tilde. Debajo ves cómo se lee la palabra tal como está escrita.');
  const meta = el('p', { class: 'tl-dice' }), lupa = creaLupa(() => ctx.aviso(''));
  const fila = el('ol', { class: 'tl-fila', 'aria-label': 'Palabras' }, lista.map(() => el('li')));
  ctx.escenario.append(el('div', { class: 'tl-palabra' }, el('div', { class: 'tl-meta' }, el('small', { text: 'Se dice así:' }), meta), lupa.caja, fila));
  let i = 0, intentos = 0, fallos = 0, quieto = false;
  const malas = [];
  const pinta = () => {
    const o = lista[i]; intentos = 0;
    meta.replaceChildren(...pronNodos(o.w));
    lupa.pon(o.ini);
    fila.querySelectorAll('li').forEach((li, k) => li.classList.toggle('ahora', k === i));
    const base = quita(o.w), fin = base.at(-1).toLowerCase();
    ctx.pistas([
      { texto: 'Sin tilde, una palabra que acaba en **vocal, n o s** se lee con el golpe en la **penúltima** sílaba. Si acaba en otra letra, en la **última**.' },
      { texto: silabas(base).sil.length === 1 ? `Sin tilde, «${base}» se lee de un solo golpe: **${pron(base).txt}**.` : `«${base}» acaba en «${fin}»: sin tilde se lee **${pron(base).txt}**.` },
      { texto: tieneTilde(o.w) ? `Necesita tilde en la **${o.w[o.w.search(/[áéíóúÁÉÍÓÚ]/)]}**.` : 'No necesita tilde.' },
    ]);
  };
  const sigue = async (ok, ms) => {
    quieto = true; fila.children[i].classList.add(ok ? 'bien' : 'mal');
    await espera(lento() ? 300 : ms); quieto = false; i++;
    if (i < lista.length) return pinta();
    ctx.fin(porFallos(fallos), fallos ? `**${lista.length - fallos} de ${lista.length} a la primera.** ` + malas.map(porque).join(' ') : `**${lista.length} de ${lista.length}.** ` + porque(lista.at(-1).w));
  };
  ctx.boton('Así está bien', () => {
    if (quieto) return;
    const o = lista[i], esc = lupa.pal(); intentos++;
    if (esc === o.w) { suena('bien'); if (intentos > 1) { fallos++; malas.push(o.w); } ctx.aviso(porque(o.w).replace(/\*\*/g, '')); return sigue(intentos === 1, 1800); }
    suena('mal'); temblor(lupa.caja, 5);
    if (intentos >= 2) { fallos++; malas.push(o.w); lupa.pon(o.w, true); ctx.aviso(porque(o.w).replace(/\*\*/g, ''), true); return sigue(false, 3200); }
    const mismo = pron(esc).txt === pron(o.w).txt;
    ctx.aviso(mismo ? 'Suena bien, pero esa tilde no hace falta. Quítala y mira cómo se lee.' : `Así se lee ${pron(esc).txt}, y tiene que sonar ${pron(o.w).txt}.`, true);
  });
  pinta();
}

/* =========================================================================== un texto entero */
export function tilda(d, ctx) {
  const conErrores = d.errores > 0;
  const W = d.texto.replace(/\.¶/g, '.').trim().split(/\s+/).map((tr) => {
    const [, pre, core, post] = tr.match(/^([^\p{L}\d]*)(.*?)([^\p{L}\d]*)$/u);
    const edit = editable(core);
    return { pre, post, orig: core, edit, act: edit && !conErrores ? quita(core) : core };
  });
  const N = W.length, total = W.filter((w) => w.edit && tieneTilde(w.orig)).length;
  let nErr = 0;
  if (conErrores) {
    const con = barajar(W.filter((w) => w.edit && tieneTilde(w.orig)));
    const sin = W.filter((w) => w.edit && !tieneTilde(w.orig) && w.orig.length > 1 && (TRAMPA.test(w.orig) || silabas(w.orig).sil.length > 1));
    const cebos = barajar(sin.filter((w) => TRAMPA.test(w.orig) || /[ns]$/i.test(w.orig) || !/[aeiou]$/i.test(w.orig))).concat(barajar(sin.filter((w) => w.orig.length > 4)));
    const mitad = Math.ceil(d.errores / 2);
    for (const w of cebos.slice(0, d.errores - mitad)) { w.act = estropea(w.orig); if (w.act !== w.orig) nErr++; }
    for (const w of con.slice(0, d.errores - nErr)) { w.act = quita(w.orig); nErr++; }
  }
  ctx.reto(d.enunciado ?? (conErrores ? `Boli ha repasado este texto y dice que tiene **${nErr} ${nErr === 1 ? 'error' : 'errores'} de tildes**: unas sobran y otras faltan.` : 'A este texto le faltan **las tildes**. Ponlas donde hagan falta… y solo donde hagan falta.'));
  ctx.pista(d.pista ?? 'Toca una palabra para mirarla con la lupa y cambiarle la tilde. Antes de comprobar, pide que te lo lean como está escrito.');

  let sel = -1, leyendo = false, fin = false;
  const pals = [];
  const pintaPal = (j, golpe) => {
    const w = W[j], b = pals[j];
    b.replaceChildren(w.pre, ...(golpe && w.edit && silabas(w.act).sil.length > 1 ? (() => { const { sil } = silabas(w.act), t = tonica(w.act); return sil.map(([a, z], k) => (k === t ? el('b', { class: 'tl-g', text: w.act.slice(a, z) }) : w.act.slice(a, z))); })() : [w.act]), w.post);
  };
  const lupa = creaLupa((p) => { if (sel < 0) return; W[sel].act = p; pals[sel].classList.remove('mal', 'bien', 'corregida'); pintaPal(sel); ctx.aviso(''); });
  const elige_ = (j) => {
    if (leyendo || fin) return;
    if (!W[j].edit) return temblor(pals[j], 3);
    sel = j; suena('clic');
    pals.forEach((b, k) => b.classList.toggle('sel', k === j));
    lupa.pon(W[j].act);
  };
  const parrafo = el('p', { class: 't-texto' });
  W.forEach((w, j) => { const b = el('button', { type: 'button', class: 't-pal tl-pal', 'aria-disabled': String(!w.edit), onclick: () => elige_(j) }); pals.push(b); parrafo.append(b, ' '); pintaPal(j); });
  const folio = el('div', { class: 't-folio impreso' }, d.titulo && el('span', { class: 't-titulo', text: d.titulo }), parrafo);
  ctx.escenario.append(el('div', { class: 't-mesa tl-mesa' }, folio, lupa.caja));

  async function lee() {
    if (leyendo) { leyendo = false; return; }
    if (fin) return;
    leyendo = true; bLee.textContent = 'Parar'; bComp.disabled = true; ctx.aviso('');
    pals.forEach((b, j) => { b.classList.remove('leida', 'sel'); pintaPal(j); }); sel = -1;
    const k = lento() ? 0.2 : 1;
    for (let j = 0; j < N && leyendo; j++) { pals[j].classList.add('leida'); pintaPal(j, true); await espera((170 + 24 * Math.min(10, W[j].act.length)) * k); }
    const entero = leyendo; leyendo = false; bLee.textContent = 'Leer como está escrito'; bComp.disabled = false;
    if (!entero) { pals.forEach((b, j) => { b.classList.remove('leida'); pintaPal(j); }); return; }
    ctx.aviso('La sílaba en negrita es la que suena fuerte tal como está escrito. ¿Alguna palabra suena rara?');
  }
  let intentos = 0;
  const bLee = ctx.boton('Leer como está escrito', lee);
  bLee.classList.add('t-leer');
  const bComp = ctx.boton('Comprobar', () => {
    if (leyendo || fin) return;
    intentos++;
    const E = W.map((w, j) => ({ w, j })).filter(({ w }) => w.edit && w.act !== w.orig);
    pals.forEach((b) => b.classList.remove('mal'));
    if (!E.length) {
      fin = true; W.forEach((w, j) => w.edit && tieneTilde(w.orig) && pals[j].classList.add('bien')); chispasEn(folio, 14);
      return ctx.fin(intentos === 1 ? 3 : 2, `**${total} ${total === 1 ? 'tilde' : 'tildes'}, y ni una de más.** ` + (d.nota ?? 'La tilde solo hace falta cuando la palabra no suena como se lee.'));
    }
    const puestas = E.filter(({ w }) => tieneTilde(w.act));
    puestas.forEach(({ j }) => pals[j].classList.add('mal'));
    if (intentos === 1) {
      suena('mal'); temblor(folio, 4);
      const faltan = E.length - puestas.length;
      return ctx.aviso([puestas.length && `${puestas.length === 1 ? 'Hay una tilde' : `Hay ${puestas.length} tildes`} que no ${puestas.length === 1 ? 'va' : 'van'} ahí (en rojo)`, faltan && `${puestas.length ? 'y ' : ''}${faltan === 1 ? 'falta una' : `faltan ${faltan}`} por poner`].filter(Boolean).join(' ') + '. Repásalo y vuelve a comprobar.', true);
    }
    fin = true; sel = -1;
    E.forEach(({ w, j }) => { w.act = w.orig; pals[j].classList.remove('mal', 'sel'); pals[j].classList.add('corregida'); pintaPal(j); });
    ctx.fin(E.length <= 2 ? 1 : 0, E.slice(0, 3).map(({ w }) => porque(w.orig)).join(' ') + (E.length > 3 ? ` Y ${E.length - 3} más, en rojo.` : ''));
  });
  const primera = W.find((w) => w.edit && tieneTilde(w.orig));
  ctx.pistas([
    { texto: 'Di cada palabra en voz alta y da una palmada en la sílaba fuerte. Luego mira en la lupa cómo se lee tal como está escrita. Si no coincide, le falta la tilde.' },
    { texto: `Bien escrito, este texto lleva **${total} ${total === 1 ? 'tilde' : 'tildes'}**.` },
    { texto: primera ? `Una va en «${quita(primera.orig)}».` : 'No lleva ninguna tilde.' },
  ]);
  if (new URLSearchParams(location.search).has('prueba')) window.__resuelve = () => W.forEach((w, j) => { w.act = w.orig; pintaPal(j); });
}
