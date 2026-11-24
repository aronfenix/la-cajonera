// Hemiciclo de juguete para los juegos de Sociales (La noche del escrutinio y La máquina de repartir).
// Un SVG con N escaños en semicírculo. Cada partido tiene su forma (círculo, cuadrado, rombo) además
// de su tono, para que no dependa solo del color. Admite repartos con decimales (sillas «partidas»).
import { PARTIDOS, partido } from './civica-comun.js';
import { gsap } from './vendor/gsap.js';

const NS = 'http://www.w3.org/2000/svg';
const T = '#1b1e3a';
export const RELLENO = { parque: '#bfe39a', aparcamiento: '#a9d8f5', pista: '#ffc896' };
export const FORMA = { parque: 'circulo', aparcamiento: 'cuadrado', pista: 'rombo' };
const lento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// posiciones de n escaños en un semicírculo de centro (100, 100) y radio 94; ordenados de izquierda a derecha
export function asientos(n) {
  if (n <= 0) return { lista: [], r: 0, interior: 0 };
  const R = 94;
  const filas = n <= 9 ? 1 : n <= 22 ? 2 : n <= 44 ? 3 : n <= 80 ? 4 : n <= 150 ? 6 : n <= 260 ? 8 : 10;
  const r0 = filas === 1 ? 62 : filas === 2 ? 50 : 38;
  const radios = filas === 1 ? [74] : Array.from({ length: filas }, (_, i) => r0 + ((R - r0) * i) / (filas - 1));
  const suma = radios.reduce((a, b) => a + b, 0);
  const cuantos = radios.map((r) => Math.max(1, Math.round((n * r) / suma)));
  let dif = n - cuantos.reduce((a, b) => a + b, 0);
  for (let i = filas - 1; dif !== 0; i = (i - 1 + filas) % filas) { if (dif > 0) { cuantos[i]++; dif--; } else if (cuantos[i] > 1) { cuantos[i]--; dif++; } }
  const hueco = filas === 1 ? 40 : (R - r0) / (filas - 1);
  let tam = Math.min(...radios.map((r, i) => (Math.PI * r) / cuantos[i]), hueco) * 0.44;
  tam = Math.min(tam, n <= 12 ? 16 : 13);
  const lista = [];
  radios.forEach((r, i) => {
    const k = cuantos[i];
    for (let j = 0; j < k; j++) { const a = Math.PI * (1 - (j + 0.5) / k); lista.push({ x: 100 + r * Math.cos(a), y: 100 - r * Math.sin(a), a, fila: i }); }
  });
  lista.sort((p, q) => q.a - p.a || p.fila - q.fila);
  return { lista, r: tam, interior: radios[0] - tam * 1.6 };
}

const forma = (f, x, y, r, relleno, borde, ancho) => {
  if (f === 'cuadrado') return `<rect x="${(x - r * 0.9).toFixed(2)}" y="${(y - r * 0.9).toFixed(2)}" width="${(r * 1.8).toFixed(2)}" height="${(r * 1.8).toFixed(2)}" rx="${(r * 0.35).toFixed(2)}" fill="${relleno}" stroke="${borde}" stroke-width="${ancho}"/>`;
  if (f === 'rombo') return `<path d="M${x.toFixed(2)} ${(y - r * 1.12).toFixed(2)} L${(x + r * 1.12).toFixed(2)} ${y.toFixed(2)} L${x.toFixed(2)} ${(y + r * 1.12).toFixed(2)} L${(x - r * 1.12).toFixed(2)} ${y.toFixed(2)}Z" fill="${relleno}" stroke="${borde}" stroke-width="${ancho}" stroke-linejoin="round"/>`;
  return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" fill="${relleno}" stroke="${borde}" stroke-width="${ancho}"/>`;
};
// un escaño suelto (para leyendas y botones)
export const escanoSVG = (id, tam = 22) => `<svg viewBox="0 0 24 24" width="${tam}" height="${tam}" aria-hidden="true">${forma(FORMA[id] || 'circulo', 12, 12, 8.6, RELLENO[id] || '#fffdf6', T, 2.2)}</svg>`;

// Crea el hemiciclo. opciones: { mayoria: número de escaños de la mayoría (dibuja la raya), etiqueta }
export function hemiciclo(n, { mayoria = 0, etiqueta = 'Hemiciclo' } = {}) {
  const nodo = document.createElementNS(NS, 'svg');
  nodo.setAttribute('viewBox', '0 0 200 106');
  nodo.setAttribute('class', 'hemiciclo');
  nodo.setAttribute('role', 'img');
  let A = asientos(n), actual = [];
  const capa = document.createElementNS(NS, 'g');
  nodo.append(capa);
  const ancho = () => Math.max(0.8, Math.min(2.2, A.r * 0.26));
  // dibuja cada escaño según a quién le toca: cubre[i] = [{id, f}] (f: fracción de la silla)
  const dibuja = (cubre, cambiados) => {
    let html = '';
    A.lista.forEach((s, i) => {
      const c = cubre[i] || [];
      const cls = cambiados?.has(i) ? 'esc cambia' : 'esc';
      if (!c.length) { html += `<g class="${cls} vacio" data-p="">${forma('circulo', s.x, s.y, A.r * 0.92, '#fffdf6', 'rgba(27,30,58,.45)', ancho() * 0.8)}</g>`; return; }
      if (c.length === 1 && c[0].f > 0.999) { html += `<g class="${cls}" data-p="${c[0].id}">${forma(FORMA[c[0].id], s.x, s.y, A.r, c[0].id === 'fuera' ? '#d9dbe6' : RELLENO[c[0].id], T, ancho())}</g>`; return; }
      // silla partida: franjas verticales dentro de un círculo, con un corte en zigzag
      const r = A.r; let x0 = s.x - r, partes = '';
      const total = c.reduce((a, b) => a + b.f, 0);
      for (const p of c) { const w = 2 * r * p.f; partes += `<rect x="${x0.toFixed(2)}" y="${(s.y - r).toFixed(2)}" width="${w.toFixed(2)}" height="${(2 * r).toFixed(2)}" fill="${RELLENO[p.id]}"/>`; x0 += w; }
      if (total < 0.999) partes += `<rect x="${x0.toFixed(2)}" y="${(s.y - r).toFixed(2)}" width="${(s.x + r - x0).toFixed(2)}" height="${(2 * r).toFixed(2)}" fill="#fffdf6"/>`;
      const id = 'cp' + Math.random().toString(36).slice(2, 8);
      html += `<g class="${cls} partida" data-p="${c.map((p) => p.id).join('+')}"><clipPath id="${id}"><circle cx="${s.x.toFixed(2)}" cy="${s.y.toFixed(2)}" r="${r.toFixed(2)}"/></clipPath><g clip-path="url(#${id})">${partes}</g><circle cx="${s.x.toFixed(2)}" cy="${s.y.toFixed(2)}" r="${r.toFixed(2)}" fill="none" stroke="${T}" stroke-width="${ancho()}" stroke-dasharray="${(r * 0.5).toFixed(2)} ${(r * 0.25).toFixed(2)}"/></g>`;
    });
    if (mayoria && mayoria < A.lista.length) {
      const y1 = 100 - 94 - 5;
      html += `<g class="raya-mayoria"><path d="M100 ${(100 - A.interior + 4).toFixed(1)} V${y1 + 6}" stroke="${T}" stroke-width="1.4" stroke-dasharray="3 2.4"/><rect x="88" y="${y1 - 4}" width="24" height="10" rx="3" fill="#fffdf6" stroke="${T}" stroke-width="1.2"/><text x="100" y="${y1 + 3.6}" text-anchor="middle" font-family="Grandstander,sans-serif" font-weight="800" font-size="7.5" fill="${T}">${mayoria}</text></g>`;
    }
    capa.innerHTML = html;
  };
  // reparto: { parque: 3, aparcamiento: 2.4, pista: 0.6, fuera: 0 } (puede tener decimales). orden: lista de ids
  const pinta = (reparto = {}, { anima = true, orden } = {}) => {
    const ids = orden ?? Object.keys(reparto).filter((k) => reparto[k] > 0).sort((a, b) => reparto[b] - reparto[a] || PARTIDOS.findIndex((p) => p.id === a) - PARTIDOS.findIndex((p) => p.id === b));
    const cubre = A.lista.map(() => []);
    let pos = 0;
    for (const id of ids) {
      let falta = reparto[id] || 0;
      while (falta > 1e-6 && pos < A.lista.length - 1e-9) {
        const i = Math.floor(pos + 1e-9), libre = i + 1 - pos, f = Math.min(libre, falta);
        cubre[i].push({ id, f }); pos += f; falta -= f;
      }
    }
    const firma = cubre.map((c) => c.map((p) => p.id + p.f.toFixed(3)).join('|'));
    const cambiados = new Set(firma.map((f, i) => (f !== actual[i] ? i : -1)).filter((i) => i >= 0));
    actual = firma;
    dibuja(cubre, anima ? cambiados : null);
    const txt = PARTIDOS.map((p) => `${p.nombre}: ${num1(reparto[p.id] || 0)}`).join('; ');
    nodo.setAttribute('aria-label', `${etiqueta}. ${txt}.`);
    if (anima && !lento()) {
      const els = [...capa.querySelectorAll('.esc.cambia')];
      if (els.length) gsap.from(els, { scale: 0.1, opacity: 0, transformOrigin: '50% 50%', duration: 0.42, ease: 'back.out(2.4)', stagger: Math.min(0.06, 1.1 / els.length) });
    }
    return cambiados.size;
  };
  const cambiaN = (m) => { A = asientos(m); actual = []; };
  return { nodo, pinta, cambiaN, get n() { return A.lista.length; } };
}
const num1 = (v) => (Math.abs(v - Math.round(v)) < 1e-6 ? String(Math.round(v)) : v.toFixed(1).replace('.', ','));

// Leyenda: el icono del partido, su forma de escaño y su número
export function leyenda(reparto, { mostrarCero = true } = {}) {
  const ul = document.createElement('ul');
  ul.className = 'leyenda-hemi';
  for (const p of PARTIDOS) {
    const v = reparto[p.id] || 0;
    if (!v && !mostrarCero) continue;
    const li = document.createElement('li');
    li.dataset.p = p.id;
    li.innerHTML = `${escanoSVG(p.id, 20)}<span>${p.corto}</span><b>${num1(v)}</b>`;
    ul.append(li);
  }
  return ul;
}
export { partido };
