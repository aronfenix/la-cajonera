// Motor «escrutinio»: Sociales, tema 2 (El cajón vota). La noche del 29-N en una mesa electoral.
//   cola       → por la mañana: ¿esta persona puede votar en esta mesa? (edad, documento, nacionalidad, censo, voto personal)
//   sobres     → a las 20:00 se abre la urna: cada sobre va a su montón del acta (partido, blanco o nulo). Boli, de interventor, protesta.
//   acta       → los últimos sobres de una mesa ya casi contada y las cuentas del acta: votos a candidaturas y votos válidos
//   provincia  → tu mesa se suma a la provincia. El último escaño está en el aire: los sobres protestados deciden.
import { el, svg, num, azar, elige, barajar, suena } from './nucleo.js';
import { gsap } from './vendor/gsap.js';
import { espera, bote, temblor, vuela, arrastra, chispasEn } from './efectos.js';
import { PARTIDOS, partido, iconoPartido, dhondt, guardarNoche } from './civica-comun.js';
import { hemiciclo, escanoSVG } from './civica-hemiciclo.js';

const T = '#1b1e3a';
const lento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const B = (t) => String(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const sinMarcas = (t) => String(t).replace(/\*\*/g, '');
const porFallos = (f) => (f <= 0 ? 3 : f <= 1 ? 2 : f <= 2 ? 1 : 0);
const PRUEBA = new URLSearchParams(location.search).has('prueba');
let solucion = null;
if (PRUEBA) window.__sol = () => (typeof solucion === 'function' ? solucion() : solucion);
// pausas para leer: no se acortan con «reducir movimiento» (eso es para las animaciones, no para leer)
const pausa = (ms) => new Promise((r) => setTimeout(r, PRUEBA ? 120 : ms));

/* =========================================================================== nombres y personas */
const NOMBRES_M = ['Lucía', 'Carmen', 'Paula', 'Sofía', 'Julia', 'Valeria', 'Elena', 'Nerea', 'Rocío', 'Inés', 'Aitana', 'Salma', 'Andrea', 'Pilar', 'Rosa', 'Amparo', 'Marta', 'Laura', 'Noelia', 'Lola', 'Fátima', 'Alba', 'Celia', 'Nuria'];
const NOMBRES_H = ['Martín', 'Hugo', 'Daniel', 'Alejandro', 'Pablo', 'Mario', 'Adrián', 'Javier', 'Samuel', 'Óscar', 'Bruno', 'Yusuf', 'Manuel', 'Antonio', 'Ramón', 'Francisco', 'Jorge', 'Iván', 'Rubén', 'Luis', 'Marcos', 'Diego', 'Gonzalo', 'Ismael'];
const APELLIDOS = ['García', 'Martínez', 'López', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Moreno', 'Álvarez', 'Muñoz', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Serrano', 'Blanco', 'Molina', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Núñez', 'Medina', 'Garrido', 'Cortés', 'Lozano', 'Cano', 'Prieto', 'Méndez', 'Vidal', 'León', 'Herrera', 'Peña', 'Flores', 'Cabrera', 'Campos', 'Vega', 'Fuentes', 'Carrasco', 'Nieto', 'Aguilar', 'Pascual', 'Lorenzo', 'Hidalgo', 'Ferrer', 'Durán', 'Benítez', 'Mora', 'Vicente', 'Arias', 'Crespo', 'Pastor', 'Soto', 'Velasco', 'Soler', 'Parra', 'Esteban', 'Bravo', 'Gallego', 'Pardo', 'Merino', 'Lara', 'Arroyo', 'Redondo', 'Vera', 'Otero', 'Galán', 'Ríos', 'Sierra', 'Segura', 'Marcos', 'Soriano'];
const EXTRANJERAS = [
  { doc: 'fr', pais: 'francesa', paisH: 'francés', nombres: [['Claire', 'Dubois'], ['Camille', 'Bernard'], ['Léa', 'Moreau']], hola: 'Bonjour! Vivo en el barrio desde hace diez años. Vengo a votar.' },
  { doc: 'it', pais: 'italiana', paisH: 'italiano', nombres: [['Giulia', 'Rossi'], ['Chiara', 'Bianchi'], ['Marco', 'Ferrari']], hola: 'Buongiorno. Vivo aquí desde hace ocho años. Vengo a votar.' },
  { doc: 'pt', pais: 'portuguesa', paisH: 'portugués', nombres: [['Ana', 'Sousa'], ['Inês', 'Costa'], ['João', 'Pereira']], hola: 'Bom dia. Vivo en Madrid desde 2015. ¿Dónde voto?' },
];
const PIEL = ['#f6d2b8', '#eebf9b', '#d9a27c', '#b67b55', '#8a5638', '#f3c9a4'];
const PELO = ['#3a2a20', '#6b4528', '#c98f3a', '#1b1e3a', '#a33d22', '#e2bc62'];
const ROPA = ['#2f5bd3', '#e8417a', '#ffc531', '#5ec3ff', '#ff8a1f', '#b79cff', '#4d5170', '#7fcf9b', '#d7263d'];
const DIA = new Date(2026, 10, 29); // domingo 29 de noviembre de 2026
const fecha = (d) => `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaLarga = (d) => `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
function edad(n) { let e = DIA.getFullYear() - n.getFullYear(); if (DIA.getMonth() < n.getMonth() || (DIA.getMonth() === n.getMonth() && DIA.getDate() < n.getDate())) e--; return e; }
const nace = (anio, mes = azar(0, 11), dia = azar(1, 28)) => new Date(anio, mes, dia);

function nuevaPersona({ mujer = Math.random() < 0.5, nacido, mayor = false, nombre, ap1, ap2 } = {}) {
  const joven = nacido && nacido.getFullYear() >= 2004;
  const pelo = mayor ? elige(['#c9cbd6', '#e4e4ec', '#b8bac6']) : elige(PELO);
  return {
    mujer, nacido: nacido ?? nace(azar(1950, 2000)),
    nombre: nombre ?? elige(mujer ? NOMBRES_M : NOMBRES_H), ap1: ap1 ?? elige(APELLIDOS), ap2: ap2 ?? elige(APELLIDOS),
    piel: elige(PIEL), colorPelo: pelo, ropa: elige(ROPA),
    pelo: mayor ? elige(mujer ? ['rizado', 'mono', 'corto'] : ['calvo', 'corto']) : elige(mujer ? ['largo', 'mono', 'rizado', 'largo', 'corto'] : joven ? ['corto', 'rizado', 'flequillo'] : ['corto', 'corto', 'rizado', 'calvo', 'flequillo']),
    gafas: mayor ? Math.random() < 0.7 : !joven && Math.random() < 0.25, barba: !mujer && !mayor && !joven && Math.random() < 0.3, mayor,
  };
}
const nombreCompleto = (p) => `${p.nombre} ${p.ap1} ${p.ap2}`;

// una persona dibujada, plana y con contorno: busto con cara (no «persona sin rostro»)
function personaSVG(p, { solo = false } = {}) {
  const k = 3.4, piel = p.piel, pc = p.colorPelo;
  let s = '';
  if (!solo) s += `<path d="M10 132 Q12 97 60 95 Q108 97 110 132Z" fill="${p.ropa}" stroke="${T}" stroke-width="${k}" stroke-linejoin="round"/><path d="M48 96 L60 110 L72 96" fill="none" stroke="${T}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<rect x="50" y="76" width="20" height="24" rx="7" fill="${piel}" stroke="${T}" stroke-width="3"/>`;
  if (p.pelo === 'largo') s += `<path d="M27 54 Q24 102 38 106 H82 Q96 102 93 54Z" fill="${pc}" stroke="${T}" stroke-width="${k}" stroke-linejoin="round"/>`;
  if (p.pelo === 'mono') s += `<circle cx="60" cy="20" r="12" fill="${pc}" stroke="${T}" stroke-width="${k}"/>`;
  s += `<ellipse cx="31" cy="60" rx="5" ry="7" fill="${piel}" stroke="${T}" stroke-width="3"/><ellipse cx="89" cy="60" rx="5" ry="7" fill="${piel}" stroke="${T}" stroke-width="3"/>`;
  s += `<ellipse cx="60" cy="56" rx="29" ry="31" fill="${piel}" stroke="${T}" stroke-width="${k}"/>`;
  const casco = `<path d="M31 54 Q29 23 60 23 Q91 23 89 54 Q82 37 60 37 Q38 37 31 54Z" fill="${pc}" stroke="${T}" stroke-width="${k}" stroke-linejoin="round"/>`;
  if (p.pelo === 'corto' || p.pelo === 'largo' || p.pelo === 'mono') s += casco;
  if (p.pelo === 'flequillo') s += `<path d="M31 54 Q28 22 60 22 Q92 22 89 54 Q86 44 78 42 L72 48 L66 40 L58 47 L52 40 L44 47 Q36 44 31 54Z" fill="${pc}" stroke="${T}" stroke-width="${k}" stroke-linejoin="round"/>`;
  if (p.pelo === 'rizado') s += [[34, 42], [42, 31], [53, 26], [66, 26], [77, 31], [85, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${pc}" stroke="${T}" stroke-width="3"/>`).join('') + `<path d="M30 46 Q60 30 90 46 L90 38 Q60 20 30 38Z" fill="${pc}"/>`;
  if (p.pelo === 'calvo') s += `<path d="M31 62 Q28 46 37 40" fill="none" stroke="${pc}" stroke-width="7" stroke-linecap="round"/><path d="M89 62 Q92 46 83 40" fill="none" stroke="${pc}" stroke-width="7" stroke-linecap="round"/>`;
  if (p.barba) s += `<path d="M34 66 Q38 92 60 92 Q82 92 86 66 Q78 78 60 78 Q42 78 34 66Z" fill="${pc}" stroke="${T}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M42 49 q6 -4 12 0 M66 49 q6 -4 12 0" fill="none" stroke="${T}" stroke-width="2.6" stroke-linecap="round"/>`;
  s += `<ellipse cx="48" cy="58" rx="3.6" ry="4.4" fill="${T}"/><ellipse cx="72" cy="58" rx="3.6" ry="4.4" fill="${T}"/><circle cx="49.2" cy="56.5" r="1.2" fill="#fff"/><circle cx="73.2" cy="56.5" r="1.2" fill="#fff"/>`;
  if (p.mayor) s += `<path d="M38 60 l-4 2 M38 64 l-4 1 M82 60 l4 2 M82 64 l4 1" stroke="${T}" stroke-width="1.6" stroke-linecap="round"/>`;
  if (p.gafas) s += `<g fill="rgba(255,255,255,.25)" stroke="${T}" stroke-width="2.6"><circle cx="48" cy="58" r="8.5"/><circle cx="72" cy="58" r="8.5"/><path d="M56.5 58 h7 M39.5 57 l-7 -2 M80.5 57 l7 -2" fill="none"/></g>`;
  s += `<circle cx="41" cy="69" r="4.4" fill="#ff8fa3" opacity=".45"/><circle cx="79" cy="69" r="4.4" fill="#ff8fa3" opacity=".45"/>`;
  s += `<path d="M53 72 Q60 77 67 72" fill="none" stroke="${T}" stroke-width="2.8" stroke-linecap="round"/>`;
  return s;
}

/* =========================================================================== documentos */
const DOCS = {
  dni: { titulo: 'DOCUMENTO NACIONAL DE IDENTIDAD', sub: 'ESPAÑA', fondo: '#e2edf8', banda: '#9cc3e6', vale: true, nombre: 'el DNI' },
  pasaporte: { titulo: 'PASAPORTE', sub: 'ESPAÑA', fondo: '#f7efe2', banda: '#c9a46a', vale: true, nombre: 'el pasaporte' },
  conducir: { titulo: 'PERMISO DE CONDUCCIÓN', sub: 'ESPAÑA', fondo: '#fbe6ec', banda: '#f2adc1', vale: true, nombre: 'el carné de conducir' },
  biblioteca: { titulo: 'BIBLIOTECA MUNICIPAL', sub: 'CARNÉ DE LECTOR', fondo: '#fff4c9', banda: '#ffd45e', vale: false, nombre: 'el carné de la biblioteca' },
  polideportivo: { titulo: 'POLIDEPORTIVO MUNICIPAL', sub: 'CARNÉ DE SOCIO', fondo: '#e6f6d8', banda: '#a8dc6c', vale: false, nombre: 'el carné del polideportivo' },
  fr: { titulo: "CARTE NATIONALE D'IDENTITÉ", sub: 'RÉPUBLIQUE FRANÇAISE', fondo: '#e9edf8', banda: '#b8c4e8', extranjero: 'Nationalité : française' },
  it: { titulo: "CARTA D'IDENTITÀ", sub: 'REPUBBLICA ITALIANA', fondo: '#eef4ea', banda: '#bcd6ad', extranjero: 'Cittadinanza: italiana' },
  pt: { titulo: 'CARTÃO DE CIDADÃO', sub: 'PORTUGAL', fondo: '#f6ece6', banda: '#e2b9a2', extranjero: 'Nacionalidade: portuguesa' },
};
function docSVG(tipo, p) {
  const D = DOCS[tipo];
  const texto = (x, y, t, tam, peso = 700, color = T, extra = '') => `<text x="${x}" y="${y}" font-family="Atkinson Hyperlegible Next,Atkinson Hyperlegible,sans-serif" font-size="${tam}" font-weight="${peso}" fill="${color}" ${extra}>${t}</text>`;
  const largo = (t, max, tam) => (t.length * tam * 0.56 > max ? `textLength="${max}" lengthAdjust="spacingAndGlyphs"` : '');
  const ap = `${p.ap1} ${p.ap2}`;
  const club = tipo === 'biblioteca' || tipo === 'polideportivo';
  let s = `<rect x="3" y="3" width="234" height="148" rx="12" fill="${D.fondo}" stroke="${T}" stroke-width="3"/>`;
  s += `<path d="M3 15 a12 12 0 0 1 12 -12 h210 a12 12 0 0 1 12 12 v16 h-234z" fill="${D.banda}" stroke="${T}" stroke-width="3"/>`;
  s += texto(12, 17, D.titulo, 9.5, 800, T, largo(D.titulo, 216, 9.5)) + texto(12, 28, D.sub, 7.5, 700, T);
  s += `<rect x="12" y="40" width="64" height="78" rx="4" fill="#fffdf6" stroke="${T}" stroke-width="2"/><svg x="13" y="41" width="62" height="76" viewBox="10 14 100 118" preserveAspectRatio="xMidYMax slice">${personaSVG(p)}</svg>`;
  if (club) {
    s += texto(86, 50, 'Nombre', 7, 700, '#5b6080') + texto(86, 64, `${p.nombre} ${p.ap1}`, 12, 800, T, largo(`${p.nombre} ${p.ap1}`, 142, 12));
    s += texto(86, 84, tipo === 'biblioteca' ? 'Lector n.º' : 'Socio n.º', 7, 700, '#5b6080') + texto(86, 98, String(azar(1000, 9999)), 12, 800);
    s += texto(86, 132, tipo === 'biblioteca' ? 'Préstamo: 4 libros' : 'Piscina y pistas', 8, 700, '#5b6080');
  } else {
    s += texto(86, 50, D.extranjero ? 'Nom · Apellidos' : 'Apellidos', 7, 700, '#5b6080') + texto(86, 64, ap, 12, 800, T, largo(ap, 142, 12));
    s += texto(86, 80, D.extranjero ? 'Prénom · Nombre' : 'Nombre', 7, 700, '#5b6080') + texto(86, 94, p.nombre, 12, 800);
    s += texto(86, 110, 'Fecha de nacimiento', 7, 700, '#5b6080') + texto(86, 124, fecha(p.nacido), 12, 800);
    if (D.extranjero) s += texto(12, 138, D.extranjero, 9, 800, T);
    else s += texto(12, 138, tipo === 'conducir' ? 'Permiso B' : 'Nacionalidad: ESP', 8.5, 800, '#5b6080');
  }
  s += `<rect x="198" y="118" width="30" height="24" rx="4" fill="#e7c86a" stroke="${T}" stroke-width="2"/><path d="M204 124 h18 M204 130 h18 M204 136 h18 M213 118 v24" stroke="${T}" stroke-width="1.2"/>`;
  return `<svg viewBox="0 0 240 154" class="ec-doc-svg" aria-hidden="true">${s}</svg>`;
}

/* =========================================================================== papeletas, sobres y objetos */
const OBJETOS = {
  chorizo: { con: 'una **loncha de chorizo**', dib: `<circle cx="40" cy="40" r="30" fill="#b8322c" stroke="${T}" stroke-width="4"/><g fill="#f7d6cc"><ellipse cx="30" cy="30" rx="5" ry="4"/><ellipse cx="50" cy="34" rx="4" ry="5"/><ellipse cx="36" cy="50" rx="6" ry="4"/><ellipse cx="54" cy="52" rx="3.5" ry="3"/><ellipse cx="24" cy="44" rx="3" ry="2.5"/></g><circle cx="40" cy="40" r="25" fill="none" stroke="#8a1f1a" stroke-width="2" opacity=".5"/>` },
  cromo: { con: 'un **cromo** de fútbol', dib: `<rect x="14" y="6" width="52" height="68" rx="6" fill="#fffdf6" stroke="${T}" stroke-width="4"/><rect x="20" y="12" width="40" height="40" rx="3" fill="#5ec3ff" stroke="${T}" stroke-width="2.5"/><circle cx="40" cy="28" r="8" fill="#f3c9a4" stroke="${T}" stroke-width="2.5"/><path d="M28 52 q12 -14 24 0" fill="#e8417a" stroke="${T}" stroke-width="2.5"/><text x="40" y="66" text-anchor="middle" font-family="Grandstander,sans-serif" font-weight="800" font-size="11" fill="${T}">23</text>` },
  caramelo: { con: 'un **caramelo**', dib: `<path d="M8 28 L22 36 L22 44 L8 52Z M72 28 L58 36 L58 44 L72 52Z" fill="#ff9fc0" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="40" cy="40" rx="20" ry="14" fill="#e8417a" stroke="${T}" stroke-width="4"/><path d="M28 34 q6 -4 12 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>` },
  hoja: { con: 'una **hoja seca** del patio', dib: `<path d="M40 8 Q66 22 64 46 Q60 66 40 72 Q20 66 16 46 Q14 22 40 8Z" fill="#e0902a" stroke="${T}" stroke-width="4" stroke-linejoin="round"/><path d="M40 14 V76 M40 32 l12 -8 M40 44 l-12 -8 M40 54 l12 -8" stroke="${T}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` },
};
const objetoSVG = (k) => `<svg viewBox="0 0 80 80" class="ec-objeto" aria-hidden="true">${OBJETOS[k].dib}</svg>`;
const CANDIDATOS = () => barajar(APELLIDOS).slice(0, 3).map((a, i) => `${i + 1}. ${elige(Math.random() < 0.5 ? NOMBRES_M : NOMBRES_H)} ${a}`);

function papeletaSVG(pid, { marca = null, candidatos, provincia = 'Villacajón' } = {}) {
  const P = partido(pid);
  const txt = (x, y, t, tam, peso = 700, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Atkinson Hyperlegible Next,Atkinson Hyperlegible,sans-serif" font-size="${tam}" font-weight="${peso}" fill="${T}" ${extra}>${t}</text>`;
  let s = `<rect x="3" y="3" width="114" height="154" rx="3" fill="#fffdf6" stroke="${T}" stroke-width="2.6"/>`;
  s += txt(60, 15, 'CONGRESO DE LOS DIPUTADOS', 6.6, 800, 'textLength="100" lengthAdjust="spacingAndGlyphs"') + txt(60, 24, `Elecciones generales · ${provincia}`, 5.6, 700, 'textLength="98" lengthAdjust="spacingAndGlyphs"');
  s += `<path d="M10 29 H110" stroke="${T}" stroke-width="1"/>`;
  s += `<g transform="translate(40 32)">${iconoPartido(pid, 40)}</g>`;
  s += txt(60, 84, P.nombre, 10.5, 800, P.nombre.length > 15 ? 'textLength="104" lengthAdjust="spacingAndGlyphs"' : '');
  (candidatos ?? CANDIDATOS()).forEach((c, i) => { s += `<text x="14" y="${102 + i * 14}" font-family="Atkinson Hyperlegible Next,sans-serif" font-size="8.2" font-weight="700" fill="${T}">${c}</text>`; });
  if (marca === 'tachada') s += `<path d="M10 113 q8 -7 16 0 t16 0 t16 0 t16 0 t16 0 t14 0" fill="none" stroke="#2f5bd3" stroke-width="2.8" stroke-linecap="round"/><path d="M12 112 L104 114" stroke="#2f5bd3" stroke-width="2.4" stroke-linecap="round"/>`;
  if (marca === 'dibujo') s += `<path d="M96 132 c-6 -8 -16 -2 -10 6 l10 10 l10 -10 c6 -8 -4 -14 -10 -6z" fill="none" stroke="#5a6078" stroke-width="2.2" stroke-linejoin="round"/><circle cx="20" cy="146" r="5" fill="none" stroke="#5a6078" stroke-width="2"/><path d="M20 137 v-3 M20 155 v3 M11 146 h-3 M29 146 h3" stroke="#5a6078" stroke-width="2" stroke-linecap="round"/>`;
  if (marca === 'escrito') s += `<text x="60" y="150" text-anchor="middle" transform="rotate(-6 60 146)" font-family="Grandstander,sans-serif" font-size="11" font-weight="700" fill="#5a6078">¡Más fuentes!</text>`;
  return `<svg viewBox="0 0 120 160" class="ec-papeleta" aria-hidden="true">${s}</svg>`;
}
const SOBRE_CERRADO = `<svg viewBox="0 0 160 112" class="ec-sobre-svg" aria-hidden="true"><rect x="4" y="6" width="152" height="100" rx="6" fill="#fffaf0" stroke="${T}" stroke-width="3.5"/><path d="M4 12 L80 64 L156 12" fill="#f3ecdc" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/><text x="80" y="96" text-anchor="middle" font-family="Grandstander,sans-serif" font-weight="800" font-size="11" fill="${T}" opacity=".7">CONGRESO</text></svg>`;
const SOBRE_VACIO = `<svg viewBox="0 0 160 150" class="ec-sobre-svg vacio" aria-hidden="true"><path d="M4 44 L80 4 L156 44" fill="#f3ecdc" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/><rect x="4" y="44" width="152" height="100" rx="6" fill="#fffaf0" stroke="${T}" stroke-width="3.5"/><path d="M4 50 L80 96 L156 50" fill="none" stroke="${T}" stroke-width="2.4" stroke-dasharray="6 5" opacity=".5"/><text x="80" y="132" text-anchor="middle" font-family="Grandstander,sans-serif" font-weight="800" font-size="13" fill="${T}" opacity=".55">(nada dentro)</text></svg>`;

// el contenido de un sobre, ya abierto
function contenido(s, provincia) {
  const caja = el('div', { class: 'ec-contenido t-' + s.tipo, 'data-tipo': s.tipo });
  const pap = (pid, marca) => el('div', { class: 'ec-pap', html: papeletaSVG(pid, { marca, candidatos: s.candidatos?.[pid], provincia }) });
  if (s.tipo === 'vacio') caja.append(el('div', { class: 'ec-pap ec-pap-sobre', html: SOBRE_VACIO }));
  else if (s.tipo === 'doble') caja.append(pap(s.p), pap(s.p));
  else if (s.tipo === 'distintas') caja.append(pap(s.p), pap(s.q));
  else if (s.tipo === 'objeto') caja.append(pap(s.p), el('div', { class: 'ec-obj', html: objetoSVG(s.obj) }));
  else caja.append(pap(s.p, ['tachada', 'dibujo', 'escrito'].includes(s.tipo) ? s.tipo : null));
  caja.setAttribute('aria-label', describe(s));
  return caja;
}
function describe(s) {
  const P = s.p && partido(s.p).nombre, Q = s.q && partido(s.q).nombre;
  return { normal: `Una papeleta de ${P}.`, vacio: 'Un sobre vacío.', doble: `Dos papeletas de ${P}.`, distintas: `Una papeleta de ${P} y otra de ${Q}.`, tachada: `Una papeleta de ${P} con un nombre tachado.`, dibujo: `Una papeleta de ${P} con dibujitos.`, escrito: `Una papeleta de ${P} con algo escrito a mano.`, objeto: `Una papeleta de ${P} y ${sinMarcas(OBJETOS[s.obj]?.con ?? '')}.` }[s.tipo];
}

/* =========================================================================== reglas del escrutinio */
const BANDEJAS = [...PARTIDOS.map((p) => ({ id: p.id, nombre: p.corto, largo: p.nombre })), { id: 'blanco', nombre: 'En blanco', largo: 'voto en blanco' }, { id: 'nulo', nombre: 'Nulo', largo: 'voto nulo' }];
const correcta = (s) => (s.tipo === 'normal' || s.tipo === 'doble' ? s.p : s.tipo === 'vacio' ? 'blanco' : 'nulo');
const cortoDe = (id) => partido(id)?.corto ?? id;
function regla(s) {
  const P = s.p && partido(s.p), Q = s.q && partido(s.q);
  return {
    normal: `Una papeleta limpia de **${P?.corto}**: un voto para ${P?.nombre}.`,
    vacio: 'Sobre **vacío**: voto **en blanco**. Es un voto válido, pero no es para nadie.',
    doble: `Dos papeletas **iguales**: está claro lo que quería. Cuenta **un voto** para ${P?.corto}.`,
    distintas: `Una de ${P?.corto} y otra de ${Q?.corto}: no se sabe cuál quería. Es **nulo**.`,
    tachada: 'Tiene un nombre **tachado**. Si se toca la papeleta, el voto es **nulo**.',
    dibujo: 'Alguien ha **dibujado** en la papeleta. Cualquier cosa añadida la hace **nula**.',
    escrito: 'Tiene algo **escrito** a mano. Cualquier cosa añadida la hace **nula**.',
    objeto: `Dentro hay ${OBJETOS[s.obj]?.con}. Con un objeto extraño, el voto es **nulo** aunque la papeleta esté bien.`,
  }[s.tipo];
}
// lo que dice Boli si te equivocas: el error concreto que has cometido
function protesta(s, elegido) {
  const P = s.p && partido(s.p), ok = correcta(s);
  const esPartido = !!partido(elegido);
  if (s.tipo === 'vacio') return esPartido ? `Ahí no hay papeleta de nadie. El voto en blanco **no es para el que gana** ni para ${cortoDe(elegido)}.` : 'Vacío no es nulo: es **en blanco**, y el voto en blanco es **válido**.';
  if (s.tipo === 'doble') return elegido === 'nulo' ? `Las dos son de ${P.corto}: no hay ninguna duda. Cuenta **un voto** para ${P.corto}.` : elegido === 'blanco' ? `Blanco es el sobre vacío. Aquí hay dos papeletas iguales de ${P.corto}: **un voto** para ${P.corto}.` : `Las dos papeletas son de **${P.corto}**, no de ${cortoDe(elegido)}.`;
  if (s.tipo === 'distintas') return esPartido ? `¿Y por qué ${cortoDe(elegido)} y no ${cortoDe(elegido === s.p ? s.q : s.p)}? Con dos papeletas **distintas** no se sabe qué quería: **nulo**.` : 'Blanco es solo el sobre vacío. Este lleva papeletas que se contradicen: **nulo**.';
  if (s.tipo === 'normal') return esPartido ? `Mira el dibujo de la papeleta: es de **${P.corto}**.` : `Es una papeleta limpia de ${P.corto}: un voto **válido** para ${P.corto}.`;
  if (elegido === 'blanco') return `Blanco es solo el sobre vacío. Este lleva una papeleta estropeada: **nulo**.`;
  const motivo = { tachada: 'tiene un nombre tachado', dibujo: 'tiene dibujitos', escrito: 'tiene algo escrito', objeto: `lleva ${sinMarcas(OBJETOS[s.obj]?.con ?? 'algo')} dentro` }[s.tipo];
  return `La papeleta es de ${P.corto}, sí, pero ${motivo}: el voto es **nulo**.`;
  void ok;
}

/* =========================================================================== generar */
const PROVINCIAS = ['Villacajón', 'Valdegoma', 'San Clip de la Sierra', 'Tijerales', 'Puente Celo', 'Sacapuntas del Río'];
const ROTULOS_MESA = () => `${azar(1, 4)}-${elige(['A', 'B', 'U'])}`;
function sobre(tipo, p = elige(PARTIDOS).id) {
  const s = { tipo, p };
  if (tipo === 'vacio') delete s.p;
  if (tipo === 'distintas') s.q = elige(PARTIDOS.filter((x) => x.id !== p)).id;
  if (tipo === 'objeto') s.obj = elige(Object.keys(OBJETOS));
  return s;
}
const TRAMPAS = ['tachada', 'dibujo', 'escrito', 'objeto'];

export function generar(spec) {
  const d = structuredClone(spec);
  const g = typeof d.generar === 'object' ? d.generar : {};
  delete d.generar;
  const f = g.f ?? 1;
  d.provincia = elige(PROVINCIAS);
  d.mesa = ROTULOS_MESA();
  if (d.modo === 'cola') d.votantes = generaCola(f, g.n ?? (f === 1 ? 3 : 4));
  else if (d.modo === 'sobres' || d.modo === 'acta') {
    const n = g.n ?? 5;
    let tipos;
    if (f === 1) tipos = ['normal', 'normal', 'vacio', 'doble', elige(['normal', 'distintas'])];
    else if (f === 2) tipos = ['normal', 'vacio', 'doble', 'distintas', elige(TRAMPAS), elige(['normal', ...TRAMPAS])];
    else tipos = [elige(['normal', 'doble']), 'vacio', elige(['doble', 'distintas']), ...barajar(TRAMPAS).slice(0, 2)];
    tipos = tipos.slice(0, n);
    while (tipos.length < n) tipos.push(elige(['normal', 'doble', 'vacio', ...TRAMPAS]));
    d.sobres = barajar(tipos).map((t) => sobre(t));
    if (d.modo === 'acta') {
      d.previo = { parque: azar(40, 110), aparcamiento: azar(40, 110), pista: azar(25, 90), blanco: azar(3, 9), nulo: azar(2, 7) };
    }
  } else if (d.modo === 'provincia') Object.assign(d, generaProvincia(g));
  return d;
}

// ---------- la cola de la mañana
function generaCola(f, n) {
  const faciles = ['ok_dni', 'ok_pasaporte', 'menor', 'sin_doc'];
  const dificiles = ['ok_carne', 'ok_mayor', 'ok_justo18', 'menor_justo', 'extranjera', 'no_censo', 'no_valido', 'por_otro'];
  let casos;
  if (f === 1) casos = barajar([elige(['ok_dni', 'ok_pasaporte']), 'menor', 'sin_doc', 'ok_dni']).slice(0, n);
  else {
    const si = barajar(['ok_carne', 'ok_mayor', 'ok_justo18']), no = barajar(['menor_justo', 'extranjera', 'no_censo', 'no_valido', 'por_otro']);
    casos = barajar([si[0], no[0], no[1], elige([si[1], no[2]])]).slice(0, n);
  }
  void faciles; void dificiles;
  return casos.map(casoCola);
}
function casoCola(caso) {
  const v = { caso, enLista: true, doc: 'dni' };
  const anioAdulto = azar(1958, 2002);
  switch (caso) {
    case 'ok_dni': v.p = nuevaPersona({ nacido: nace(anioAdulto) }); v.dice = elige(['Buenos días. Vengo a votar.', 'Hola, buenas. Aquí tiene mi DNI.', 'Buenas. ¿Es aquí la mesa?']); break;
    case 'ok_pasaporte': v.p = nuevaPersona({ nacido: nace(anioAdulto) }); v.doc = 'pasaporte'; v.dice = 'Buenos días. Traigo el pasaporte, ¿vale?'; break;
    case 'ok_carne': v.p = nuevaPersona({ nacido: nace(anioAdulto) }); v.doc = 'conducir'; v.dice = 'Me he dejado el DNI. ¿Vale el carné de conducir?'; break;
    case 'ok_mayor': v.p = nuevaPersona({ nacido: nace(azar(1932, 1944)), mayor: true }); v.dice = 'Buenos días. No me he perdido ni unas elecciones desde 1977.'; break;
    case 'ok_justo18': { const dd = azar(1, 24); v.p = nuevaPersona({ nacido: new Date(2008, 10, 29 - dd) }); v.dice = '¡Es la primera vez que voto! Cumplí dieciocho hace nada.'; break; }
    case 'menor': v.p = nuevaPersona({ nacido: nace(azar(2009, 2011)) }); v.enLista = false; v.dice = elige(['Tengo una opinión muy clara. Quiero votar.', 'Vengo a votar. Mis padres ya han votado.']); break;
    case 'menor_justo': v.p = nuevaPersona({ nacido: new Date(2008, 11, azar(1, 28)) }); v.enLista = false; v.dice = 'Cumplo dieciocho en diciembre. Es casi lo mismo, ¿no?'; break;
    case 'sin_doc': v.p = nuevaPersona({ nacido: nace(anioAdulto) }); v.doc = null; v.dice = elige(['Me he dejado la cartera en casa. ¡Pero si me conoce todo el barrio!', '¡Soy yo, la de la panadería! No traigo nada, pero ya me conoce.']); break;
    case 'no_valido': v.p = nuevaPersona({ nacido: nace(anioAdulto) }); v.doc = elige(['biblioteca', 'polideportivo']); v.dice = `No traigo el DNI, pero tengo ${DOCS[v.doc].nombre}. Sale mi foto.`; break;
    case 'extranjera': { const e = elige(EXTRANJERAS), [nom, ap] = elige(e.nombres); const mujer = !['Marco', 'João'].includes(nom); v.p = nuevaPersona({ mujer, nombre: nom, ap1: ap, ap2: '', nacido: nace(anioAdulto) }); v.p.ap2 = ''; v.doc = e.doc; v.enLista = false; v.dice = e.hola; v.pais = mujer ? e.pais : e.paisH; break; }
    case 'no_censo': v.p = nuevaPersona({ nacido: nace(anioAdulto) }); v.enLista = false; v.dice = 'Vivo en la calle de al lado. Este colegio me pilla más cerca.'; break;
    case 'por_otro': { const hijo = nuevaPersona({ nacido: nace(azar(1985, 2000)) }); const padre = nuevaPersona({ mujer: false, nacido: nace(azar(1945, 1960)), mayor: true, ap1: hijo.ap1 }); v.p = hijo; v.titular = padre; v.enLista = false; v.dice = 'Vengo a votar por mi padre, que tiene gripe. Traigo su DNI.'; break; }
  }
  v.vota = caso.startsWith('ok');
  v.motivos = { menor: ['edad', 'censo'], menor_justo: ['edad', 'censo'], sin_doc: ['documento'], no_valido: ['documento'], extranjera: ['nacionalidad', 'censo'], no_censo: ['censo'], por_otro: ['personal', 'documento'] }[caso] ?? [];
  return v;
}

// ---------- la provincia: el último escaño se lo disputan dos partidos por muy pocos votos
function generaProvincia(g) {
  const k = g.dudosos ?? 3;
  for (let intento = 0; intento < 6000; intento++) {
    const N = elige(g.escanos ?? [3, 4]);
    const m = elige(g.margenes ?? [1, 2]);
    const roles = barajar(PARTIDOS.map((p) => p.id)); // [X grande, W gana por poco, L pierde por poco]
    const vW = azar(700, 2100), vL = vW - m, vX = Math.round(vW * (0.55 + Math.random() * 2.6));
    const votos = { [roles[0]]: vX, [roles[1]]: vW, [roles[2]]: vL };
    const { cocientes: c, escanos } = dhondt(votos, N);
    const w = c[N - 1], l = c[N];
    if (!w || !l || w.id !== roles[1] || l.id !== roles[2] || w.divisor !== l.divisor) continue;
    if (N >= 2 && c[N - 2].valor - w.valor < 9) continue;
    if (c[N + 1] && l.valor - c[N + 1].valor < 9) continue;
    if (Object.values(escanos).every((e) => e > 0) && Math.random() < 0.3) continue; // variedad: a veces el pequeño se queda fuera
    // los sobres protestados
    const cambia = g.cambia ?? Math.random() < 0.55;
    const delta = cambia ? m + 1 : m - 1;
    let nW = delta + 1 <= k && Math.random() < 0.4 ? 1 : 0, nL = delta + nW;
    if (nL + nW > k || nL < 0) { nW = 0; nL = delta; }
    if (nL + nW > k) continue;
    const resto = k - nL - nW;
    const lista = [...Array(nL).fill(0).map(() => sobre('doble', roles[2])), ...Array(nW).fill(0).map(() => sobre('doble', roles[1]))];
    const tiposResto = barajar(['vacio', 'distintas', 'objeto', 'tachada', 'dibujo', 'escrito']).slice(0, resto);
    for (const t of tiposResto) {
      const s = sobre(t, elige([roles[2], roles[2], roles[1]]));
      if (t === 'distintas') { s.p = roles[1]; s.q = roles[2]; }
      lista.push(s);
    }
    // que un error típico (y uno solo) pueda cambiar el resultado
    if (!cambia && !lista.some((s) => s.tipo !== 'doble' || s.p === roles[1])) continue;
    const blanco = Math.round((vX + vW + vL) * (0.008 + Math.random() * 0.012)), nulo = Math.round((vX + vW + vL) * (0.005 + Math.random() * 0.008));
    return { N, m, roles, base: { ...votos, blanco, nulo }, dudosos: barajar(lista), cambia, mesas: azar(9, 14) };
  }
  throw new Error('no he podido preparar la provincia');
}

/* =========================================================================== ronda */
export function ronda(d, ctx) {
  const m = { cola, sobres: escrutar, acta: escrutar, provincia }[d.modo];
  if (!m) throw new Error(`no encuentro el modo «${d.modo}». Si el juego se acaba de actualizar, recarga la página.`);
  return m(d, ctx);
}

// ---------------------------------------------------------------- ¿puede votar?
const MOTIVOS = [
  ['documento', 'No trae un documento válido'],
  ['edad', 'No tiene 18 años'],
  ['nacionalidad', 'No tiene la nacionalidad española'],
  ['censo', 'No está en la lista de esta mesa'],
  ['personal', 'Nadie puede votar por otra persona'],
];
function porQue(v) {
  const p = v.p, e = edad(p.nacido);
  switch (v.caso) {
    case 'ok_dni': return `**Puede votar**: tiene ${e} años, está en la lista y trae su DNI.`;
    case 'ok_pasaporte': return '**Puede votar**: el **pasaporte** sirve para identificarse, igual que el DNI.';
    case 'ok_carne': return '**Puede votar**: el **carné de conducir** con foto sirve para identificarse, igual que el DNI o el pasaporte.';
    case 'ok_mayor': return `**Puede votar**: tiene ${e} años y no hay edad máxima. Votó por primera vez en 1977, en las primeras elecciones de la democracia.`;
    case 'ok_justo18': return `**Puede votar**: nació el ${fechaLarga(p.nacido)}, así que el 29 de noviembre de 2026 ya tiene **18 años cumplidos**.`;
    case 'menor': return `Nació en ${p.nacido.getFullYear()}: tiene **${e} años**. Para votar hay que tener 18 cumplidos. Por eso tampoco está en la lista.`;
    case 'menor_justo': return `Nació el ${fechaLarga(p.nacido)}: hoy, 29 de noviembre, tiene **17 años**. Los 18 tienen que estar cumplidos el día de las elecciones. Por eso no está en la lista.`;
    case 'sin_doc': return 'Sin **documento con foto** no se vota, aunque la conozca todo el barrio. Valen el DNI, el pasaporte o el carné de conducir.';
    case 'no_valido': return `${DOCS[v.doc].nombre[0].toUpperCase() + DOCS[v.doc].nombre.slice(1)} no sirve: hace falta **DNI, pasaporte o carné de conducir**.`;
    case 'extranjera': return `${p.nombre} es ${v.pais}. En las elecciones **generales** solo votan los españoles. En las **municipales** sí podría votar, porque es de un país de la Unión Europea. Por eso no está en esta lista.`;
    case 'no_censo': return 'No está en **la lista de esta mesa**. Cada persona vota en la mesa que le toca, aunque otra le pille más cerca.';
    case 'por_otro': return 'El voto es **personal**: nadie puede votar por otro, ni siquiera con su DNI. Su padre podía haber votado **por correo**.';
  }
  return '';
}
function cola(d, ctx) {
  const lista = d.votantes;
  ctx.reto('Son las 11:40. Presides la mesa. **¿Puede votar** quien llega?');
  ctx.pista('Mira la persona, su documento y la lista del censo. Hoy es el 29 de noviembre de 2026.');
  // la lista del censo: los que están en esta mesa y algunos más, por orden alfabético
  const enLista = [];
  for (const v of lista) { if (v.caso === 'por_otro') enLista.push(v.titular); else if (v.enLista) enLista.push(v.p); }
  while (enLista.length < 7) enLista.push(nuevaPersona());
  enLista.sort((a, b) => a.ap1.localeCompare(b.ap1, 'es') || a.ap2.localeCompare(b.ap2, 'es'));
  const censo = el('div', { class: 'ec-censo' },
    el('div', { class: 'ec-censo-cab' }, el('b', { text: 'Lista del censo' }), el('small', { text: `Mesa ${d.mesa} · ${d.provincia}` })),
    el('ol', {}, enLista.map((p, i) => el('li', {}, el('span', { class: 'n', text: String(i * 3 + 112) }), el('span', { class: 'ap', text: `${p.ap1} ${p.ap2},` }), ' ', el('span', { text: p.nombre })))));
  const fila = el('div', { class: 'ec-fila', 'aria-hidden': 'true' });
  const votante = el('div', { class: 'ec-votante' });
  const dice = el('p', { class: 'ec-dice', 'aria-live': 'polite' });
  const doc = el('div', { class: 'ec-doc' });
  const sello = el('div', { class: 'ec-sello', 'aria-hidden': 'true' });
  const mostrador = el('div', { class: 'ec-mostrador' }, el('div', { class: 'ec-quien' }, votante, dice), doc, sello, fila);
  const motivos = el('div', { class: 'ec-motivos', hidden: true, role: 'group', 'aria-label': '¿Por qué no puede votar?' },
    el('b', { text: '¿Por qué no?' }),
    ...MOTIVOS.map(([id, t]) => el('button', { type: 'button', class: 'tecla ec-motivo', 'data-m': id, text: t, onclick: () => decide(false, id) })));
  const nota = el('div', { class: 'ec-nota', hidden: true });
  const siguiente = el('button', { type: 'button', class: 'tecla primaria ec-seguir', text: 'Siguiente', hidden: true });
  ctx.escenario.append(el('div', { class: 'ec-cola' }, mostrador, censo), motivos, el('div', { class: 'ec-nota-fila' }, nota, siguiente));
  let i = 0, fallos = 0, ocupado = false;
  const malos = [];
  const pinta = () => {
    const v = lista[i];
    votante.innerHTML = `<svg viewBox="0 0 120 132" aria-hidden="true">${personaSVG(v.p)}</svg>`;
    dice.textContent = '«' + v.dice + '»';
    doc.replaceChildren(v.doc ? el('div', { class: 'ec-doc-carta', role: 'img', 'aria-label': `${v.doc === 'dni' && v.titular ? 'DNI de ' + nombreCompleto(v.titular) : DOCS[v.doc].titulo}` }, el('div', { html: docSVG(v.doc, v.titular ?? v.p) })) : el('div', { class: 'ec-doc-nada', text: 'No enseña ningún documento' }));
    fila.replaceChildren(...lista.slice(i + 1).map((w) => el('span', { class: 'ec-fila-p', html: `<svg viewBox="0 0 120 132">${personaSVG(w.p)}</svg>` })));
    sello.className = 'ec-sello'; sello.textContent = '';
    nota.hidden = true; siguiente.hidden = true; motivos.hidden = true;
    botones.forEach((b) => (b.disabled = false));
    if (!lento()) { gsap.from(votante, { x: 160, opacity: 0, duration: 0.45, ease: 'back.out(1.6)' }); gsap.from(doc, { y: 40, rotation: -8, opacity: 0, duration: 0.4, delay: 0.2, ease: 'back.out(2)' }); }
    const e = edad(v.p.nacido);
    ctx.pistas([
      { texto: 'Comprueba tres cosas: ¿trae un **documento con foto** que valga? ¿Tiene **18 años**? ¿Está en **la lista**?' },
      { texto: v.doc ? `Trae ${v.doc in DOCS && DOCS[v.doc].nombre ? DOCS[v.doc].nombre : 'un documento de otro país'}. Valen el DNI, el pasaporte y el carné de conducir. Nació el ${fecha((v.titular ?? v.p).nacido)}: tiene ${edad((v.titular ?? v.p).nacido)} años.` : 'No trae documento. ¿Basta con que la conozcan?' },
      { texto: v.vota ? 'Todo está en orden: **puede votar**.' : `No puede votar. Fíjate en: ${{ menor: 'su edad', menor_justo: `su fecha de nacimiento (${e} años)`, sin_doc: 'el documento', no_valido: 'qué documento trae', extranjera: 'de qué país es su documento', no_censo: 'la lista', por_otro: 'de quién es el DNI' }[v.caso]}.` },
    ]);
    solucion = { modo: 'cola', vota: v.vota, motivo: v.motivos[0], i };
  };
  const decide = async (vota, motivo) => {
    if (ocupado) return;
    const v = lista[i];
    if (vota === false && !motivo) { motivos.hidden = false; suena('clic'); motivos.querySelector('button')?.focus({ preventScroll: true }); motivos.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }); return; }
    ocupado = true; motivos.hidden = true;
    botones.forEach((b) => (b.disabled = true));
    const okDecision = vota === v.vota, okMotivo = vota || v.motivos.includes(motivo);
    const ok = okDecision && okMotivo;
    sello.textContent = v.vota ? 'VOTA' : 'NO VOTA';
    sello.className = 'ec-sello on ' + (v.vota ? 'si' : 'no');
    if (!lento()) gsap.from(sello, { scale: 2.4, opacity: 0, rotation: -25, duration: 0.35, ease: 'power3.in' });
    suena('sello');
    let texto = porQue(v);
    if (!okDecision) { fallos++; malos.push(v); texto = (v.vota ? '**Sí puede votar.** ' : '**No puede votar.** ') + texto; ctx.di(elige(['¡Protesto!', 'Alto ahí.', 'Eso lo rodeo en rojo.']) + ' ' + sinMarcas(texto).split('. ')[0] + '.', 'animo', 4500); temblor(mostrador, 6); suena('mal'); }
    else if (!okMotivo) { fallos += 0.5; malos.push(v); texto = `No puede votar, sí, pero el motivo es otro. ` + texto; suena('regular'); }
    else { suena('bien'); bote(votante, 8); }
    nota.innerHTML = B(texto); nota.className = 'ec-nota ' + (ok ? 'bien' : 'mal'); nota.hidden = false;
    const fin = () => {
      i++; ocupado = false;
      if (i < lista.length) return pinta();
      solucion = null;
      const res = fallos === 0 ? `**Mesa impecable.** Para votar hacen falta cuatro cosas: 18 años, nacionalidad española (en las generales), estar en la lista de la mesa y un documento con foto. Y votar uno mismo: **nadie vota por otro**.`
        : `**${lista.length - Math.ceil(fallos)} de ${lista.length}** bien. ` + malos.map((m) => sinMarcas(porQue(m))).join(' ');
      ctx.fin(porFallos(fallos), res);
    };
    if (ok) { await pausa(2300); fin(); }
    else { siguiente.hidden = false; siguiente.textContent = i + 1 < lista.length ? 'Siguiente votante' : 'Cerrar la cola'; siguiente.onclick = () => { siguiente.onclick = null; fin(); }; siguiente.focus({ preventScroll: true }); }
  };
  const botones = [ctx.boton('Sí puede votar', () => decide(true)), ctx.boton('No puede', () => decide(false))];
  botones[0].dataset.v = 'si'; botones[1].dataset.v = 'no'; botones[1].classList.add('ec-no');
  pinta();
}

// ---------------------------------------------------------------- abrir la urna y contar
function bandejaNodo(b, n = 0) {
  const icono = partido(b.id) ? iconoPartido(b.id, 40) : b.id === 'blanco'
    ? `<svg viewBox="0 0 100 100" width="40" height="40" aria-hidden="true"><rect x="18" y="22" width="64" height="56" rx="6" fill="#fffdf6" stroke="${T}" stroke-width="5"/><path d="M18 28 L50 52 L82 28" fill="none" stroke="${T}" stroke-width="5" stroke-linejoin="round"/></svg>`
    : `<svg viewBox="0 0 100 100" width="40" height="40" aria-hidden="true"><rect x="22" y="12" width="56" height="76" rx="4" fill="#fffdf6" stroke="${T}" stroke-width="5"/><path d="M30 26 L70 74 M70 26 L30 74" stroke="#d7263d" stroke-width="8" stroke-linecap="round"/></svg>`;
  return el('button', { type: 'button', class: 'ec-bandeja b-' + b.id, 'data-b': b.id, 'aria-label': `${b.largo}: ${n}` },
    el('span', { class: 'ec-b-icono', html: icono }), el('span', { class: 'ec-b-nombre', text: b.nombre }), el('b', { class: 'ec-b-num', text: String(n) }), el('span', { class: 'ec-palotes', 'aria-hidden': 'true' }));
}
function palotes(nodo, n, rojos = 0) {
  const caja = nodo.querySelector('.ec-palotes');
  if (n > 15) { caja.replaceChildren(); return; }
  const grupos = [];
  for (let k = 0; k < n; k += 5) grupos.push(el('i', { class: 'g' + Math.min(5, n - k) }));
  caja.replaceChildren(...grupos);
  if (rojos) caja.append(el('i', { class: 'rojo', text: '+' + rojos }));
}
function urnaSVG(quedan) {
  let s = `<path d="M18 54 L22 150 Q22 158 30 158 H130 Q138 158 138 150 L142 54Z" fill="#dff2ff" fill-opacity=".55" stroke="${T}" stroke-width="4" stroke-linejoin="round"/>`;
  for (let k = 0; k < Math.min(quedan, 9); k++) { const x = 34 + (k % 3) * 30 + (k % 2) * 4, y = 140 - Math.floor(k / 3) * 20; s += `<g transform="rotate(${(k * 37) % 22 - 11} ${x + 18} ${y + 8})"><rect x="${x}" y="${y}" width="40" height="26" rx="3" fill="#fffaf0" stroke="${T}" stroke-width="2.5"/><path d="M${x} ${y + 2} L${x + 20} ${y + 14} L${x + 40} ${y + 2}" fill="none" stroke="${T}" stroke-width="2"/></g>`; }
  s += `<path d="M30 70 L32 140" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>`;
  s += `<rect x="10" y="38" width="140" height="20" rx="5" fill="#9fb6d6" stroke="${T}" stroke-width="4"/><rect x="52" y="44" width="56" height="7" rx="3" fill="${T}"/>`;
  s += `<rect x="58" y="104" width="44" height="18" rx="3" fill="#fffdf6" stroke="${T}" stroke-width="2.5"/><text x="80" y="117" text-anchor="middle" font-family="Grandstander,sans-serif" font-weight="800" font-size="10" fill="${T}">URNA</text>`;
  return `<svg viewBox="0 0 160 166" aria-hidden="true">${s}</svg>`;
}

function escrutar(d, ctx) {
  const acta = d.modo === 'acta';
  const lista = d.sobres;
  ctx.reto(acta ? 'Son casi las diez. Quedan **los últimos sobres** y firmar el acta.' : 'Son las 20:00. Se abre la urna. **¿Dónde va cada sobre?**');
  ctx.pista(acta ? 'Clasifica los sobres que quedan. Luego haz las cuentas del acta.' : 'Toca el montón del acta donde va el voto (o arrastra el voto hasta él).');
  const cuenta = Object.fromEntries(BANDEJAS.map((b) => [b.id, acta ? d.previo[b.id] : 0]));
  const rojos = Object.fromEntries(BANDEJAS.map((b) => [b.id, 0]));
  const bandejas = BANDEJAS.map((b) => bandejaNodo(b, cuenta[b.id]));
  const urna = el('div', { class: 'ec-urna', html: urnaSVG(lista.length) });
  const quedan = el('p', { class: 'ec-quedan' });
  const mesa = el('div', { class: 'ec-mesa', 'aria-live': 'polite' });
  const protestaNodo = el('div', { class: 'ec-protesta', hidden: true });
  const seguir = el('button', { type: 'button', class: 'tecla primaria ec-seguir', hidden: true });
  const actaNodo = el('div', { class: 'ec-acta' }, el('div', { class: 'ec-acta-cab' }, el('b', { text: 'Acta de escrutinio' }), el('small', { text: `Mesa ${d.mesa} · ${d.provincia}` })), el('div', { class: 'ec-bandejas' }, bandejas));
  ctx.escenario.append(el('div', { class: 'ec-escrutinio' + (acta ? ' con-acta' : '') }, el('div', { class: 'ec-urna-caja' }, urna, quedan), el('div', { class: 'ec-centro' }, mesa, el('div', { class: 'ec-protesta-fila' }, protestaNodo, seguir)), actaNodo));
  bandejas.forEach((b) => palotes(b, cuenta[b.dataset.b]));
  let i = 0, fallos = 0, ocupado = true, actual = null, listoDesde = 0;
  const errores = [];
  const pinta = async () => {
    const s = lista[i];
    quedan.textContent = `Quedan ${lista.length - i} ${lista.length - i === 1 ? 'sobre' : 'sobres'}`;
    urna.innerHTML = urnaSVG(lista.length - i - 1);
    protestaNodo.hidden = true; seguir.hidden = true;
    const cerrado = el('div', { class: 'ec-sobre', html: SOBRE_CERRADO });
    mesa.replaceChildren(cerrado);
    if (!lento()) {
      suena('coge');
      await gsap.from(cerrado, { x: -180, y: -40, rotation: -20, scale: 0.5, duration: 0.45, ease: 'power2.out' });
      await gsap.to(cerrado, { scaleY: 0.1, duration: 0.16, ease: 'power1.in' });
    }
    actual = contenido(s, d.provincia);
    mesa.replaceChildren(actual);
    suena('quita');
    if (!lento()) gsap.from(actual.children, { y: -30, scale: 0.6, opacity: 0, rotation: (k) => (k ? 8 : -6), duration: 0.4, ease: 'back.out(2)', stagger: 0.1 });
    arrastra(actual, { destinos: () => bandejas, alSoltar: (dest) => { decide(dest.dataset.b, true); return dest; }, puede: () => !ocupado });
    ocupado = false;
    const ok = correcta(s);
    ctx.pistas([
      { texto: s.tipo === 'vacio' ? 'Mira bien: ¿hay alguna papeleta dentro?' : s.tipo === 'normal' || s.tipo === 'doble' || s.tipo === 'distintas' ? 'Cuenta las papeletas y mira **de quién** es cada una.' : 'Mira la papeleta con lupa: ¿está **tal cual** la imprimieron? ¿Hay algo más en el sobre?' },
      { texto: 'Vacío: **en blanco**. Dos iguales: **un voto**. Dos distintas: **nulo**. Papeleta tocada (tachada, pintada, escrita) o con cosas raras: **nulo**.' },
      { texto: ok === 'blanco' || ok === 'nulo' ? `No es para ningún partido.${ok === 'nulo' ? ' Y no es el sobre vacío.' : ''}` : `Es un voto válido para un partido: mira el dibujo de la papeleta.` },
    ]);
    solucion = { modo: 'sobres', bandeja: ok, i };
    listoDesde = performance.now();
  };
  const decide = async (id, arrastrado = false) => {
    if (ocupado || !actual || performance.now() - listoDesde < 250) return; // un doble toque no clasifica el sobre siguiente
    ocupado = true;
    const s = lista[i], ok = correcta(s), bien = id === ok;
    const destino = bandejas.find((b) => b.dataset.b === id);
    suena('pon');
    if (!arrastrado) vuela(actual, destino, actual.cloneNode(true), { ms: 420, escala: 0.35 });
    actual.style.visibility = 'hidden';
    cuenta[id]++;
    const pon = (b) => { const n = bandejas.find((x) => x.dataset.b === b); n.querySelector('.ec-b-num').textContent = String(cuenta[b]); n.setAttribute('aria-label', `${BANDEJAS.find((x) => x.id === b).largo}: ${cuenta[b]}`); palotes(n, cuenta[b], rojos[b]); bote(n, 8); };
    await espera(lento() ? 0 : 430);
    pon(id);
    if (bien) {
      chispasEn(destino, 8);
      protestaNodo.innerHTML = B(regla(s)); protestaNodo.className = 'ec-protesta bien'; protestaNodo.hidden = false;
      await pausa(1500);
      return siguiente();
    }
    // Boli protesta y lo corrige en rojo: el voto pasa a su sitio
    fallos++; errores.push({ s, id });
    suena('mal'); temblor(destino, 7);
    ctx.di(elige(['¡Protesto!', '¡Alto! Protesto.', 'Eso no. Protesto.']) + ' ' + sinMarcas(protesta(s, id)), 'animo', 6000);
    await espera(lento() ? 0 : 500);
    cuenta[id]--; rojos[ok]++; cuenta[ok]++;
    pon(id); pon(ok);
    destino.classList.add('tachon'); setTimeout(() => destino.classList.remove('tachon'), 900);
    protestaNodo.innerHTML = `<b class="ec-protesto">Reclamación del interventor</b> ${B(protesta(s, id))}`;
    protestaNodo.className = 'ec-protesta mal'; protestaNodo.hidden = false;
    seguir.hidden = false; seguir.textContent = i + 1 < lista.length ? 'Siguiente sobre' : acta ? 'A las cuentas' : 'Cerrar el acta';
    seguir.onclick = () => { seguir.onclick = null; siguiente(); };
    seguir.focus({ preventScroll: true });
  };
  bandejas.forEach((b) => b.addEventListener('click', () => decide(b.dataset.b)));
  const siguiente = () => {
    i++;
    if (i < lista.length) return pinta();
    actual = null; mesa.replaceChildren(); quedan.textContent = 'Urna vacía'; urna.innerHTML = urnaSVG(0);
    protestaNodo.hidden = true; seguir.hidden = true;
    if (acta) return cuentas();
    solucion = null;
    const tot = lista.length;
    const res = fallos === 0 ? `**${tot} de ${tot}**. ` + resumenAprendido(lista) : `**${tot - fallos} de ${tot}** a la primera. ` + errores.map((e) => sinMarcas(regla(e.s))).filter((x, k, a) => a.indexOf(x) === k).join(' ');
    ctx.fin(porFallos(fallos), res);
  };
  // las cuentas del acta (solo en el modo «acta»)
  const cuentas = () => {
    const cand = cuenta.parque + cuenta.aparcamiento + cuenta.pista, validos = cand + cuenta.blanco;
    ctx.reto('Ahora las **cuentas del acta**. Míralas en los montones.');
    ctx.pista('Los montones ya están contados. Suma lo que pide cada casilla.');
    const campo = (k, t) => el('label', { class: 'ec-campo' }, el('span', { html: t }), el('input', { class: 'campo-num', 'data-campo': k, inputmode: 'numeric', autocomplete: 'off', maxlength: 4, 'aria-label': sinMarcas(t.replace(/<[^>]+>/g, '')) }));
    const fCand = campo('candidaturas', 'Votos a <b>candidaturas</b> (los de los tres partidos)');
    const fVal = campo('validos', 'Votos <b>válidos</b>');
    const caja = el('div', { class: 'ec-totales' }, fCand, fVal);
    actaNodo.append(caja);
    if (!lento()) gsap.from(caja, { y: 30, opacity: 0, duration: 0.4, ease: 'back.out(2)' });
    setTimeout(() => fCand.querySelector('input').focus({ preventScroll: true }), 300);
    ctx.pistas([
      { texto: 'Votos a candidaturas: **solo** los de los partidos. Votos válidos: los que valen, sean o no para un partido.' },
      { texto: `Candidaturas: ${cuenta.parque} + ${cuenta.aparcamiento} + ${cuenta.pista}. El voto en blanco **es válido**; el nulo, no.` },
      { texto: `Votos a candidaturas: **${num(cand)}**. Para los válidos, súmale los ${cuenta.blanco} en blanco.` },
    ]);
    solucion = { modo: 'acta', candidaturas: cand, validos };
    const firmar = ctx.boton('Firmar el acta', () => {
      const lee = (f) => { const v = f.querySelector('input').value.trim(); return v === '' ? null : Number(v); };
      const a = lee(fCand), b = lee(fVal);
      if (a == null || b == null) return ctx.aviso('Rellena las dos casillas.', true);
      solucion = null;
      let f2 = 0, txt = '';
      if (a !== cand) { f2++; txt += `Candidaturas: ${cuenta.parque} + ${cuenta.aparcamiento} + ${cuenta.pista} = **${num(cand)}**${a === validos ? ' (tú has sumado también los blancos, y el blanco no es de ningún partido)' : ''}. `; }
      if (b !== validos) { f2++; txt += b === cand ? `Válidos: **${num(validos)}**. Te has dejado los **${cuenta.blanco} en blanco**: no son de nadie, pero son **válidos**. ` : b === validos + cuenta.nulo ? `Válidos: **${num(validos)}**. Has metido los ${cuenta.nulo} nulos, y los nulos **no valen**. ` : `Válidos: ${num(cand)} + ${cuenta.blanco} en blanco = **${num(validos)}**. `; }
      firmar.disabled = true;
      fCand.classList.add(a === cand ? 'bien' : 'mal'); fVal.classList.add(b === validos ? 'bien' : 'mal');
      const total = fallos + f2;
      const pre = fallos ? `En los sobres, ${fallos} ${fallos === 1 ? 'reclamación' : 'reclamaciones'}: ` + errores.map((e) => sinMarcas(regla(e.s))).join(' ') + ' ' : '';
      ctx.fin(porFallos(total), pre + (f2 ? txt : `**Acta firmada.** ${num(cand)} votos a candidaturas y **${num(validos)} válidos**: los ${cuenta.blanco} en blanco cuentan como válidos; los ${cuenta.nulo} nulos, no.`));
    });
    fVal.querySelector('input').addEventListener('keydown', (e) => { if (e.key === 'Enter') firmar.click(); });
    fCand.querySelector('input').addEventListener('keydown', (e) => { if (e.key === 'Enter') fVal.querySelector('input').focus(); });
  };
  pinta();
}
function resumenAprendido(lista) {
  const t = new Set(lista.map((s) => s.tipo));
  const ideas = [];
  if (t.has('vacio')) ideas.push('el sobre vacío es **voto en blanco** (válido, para nadie)');
  if (t.has('doble')) ideas.push('dos papeletas iguales son **un voto**');
  if (t.has('distintas')) ideas.push('dos distintas, **nulo**');
  if ([...t].some((x) => TRAMPAS.includes(x))) ideas.push('cualquier papeleta tocada o con cosas dentro, **nulo**');
  return ideas.length ? 'Recuerda: ' + ideas.map(sinMarcas).join('; ') + '.' : 'Cada papeleta limpia, un voto para su partido.';
}

// ---------------------------------------------------------------- la provincia
function provincia(d, ctx) {
  const [X, W, L] = d.roles, Pw = partido(W), Pl = partido(L);
  const base = d.base;
  const escBase = dhondt({ parque: base.parque, aparcamiento: base.aparcamiento, pista: base.pista }, d.N);
  const ultimoDivisor = escBase.cocientes[d.N - 1].divisor;
  ctx.reto(`Provincia de ${d.provincia}: **${d.N} escaños**. El último se decide por **${d.m} ${d.m === 1 ? 'voto' : 'votos'}**.`);
  ctx.pista(`Han llegado las actas de ${d.mesas} mesas. En la tuya, el interventor protestó ${d.dudosos.length} sobres. Clasifícalos y predice qué pasa.`);
  const hemi = hemiciclo(d.N, { etiqueta: `Escaños de ${d.provincia}` });
  hemi.pinta(escBase.escanos, { anima: false });
  const dueloTxt = ultimoDivisor === 1 ? 'Se lo disputan:' : `Se lo disputan (sería el ${ultimoDivisor}.º escaño de cada uno):`;
  const lado = (P, v, gana) => el('div', { class: 'ec-duelo-lado' + (gana ? ' gana' : ''), 'data-p': P.id }, el('span', { class: 'ic', html: iconoPartido(P.id, 38) }), el('span', { class: 'nom', text: P.corto }), el('b', { class: 'vv', text: num(v) }), el('small', { text: 'votos' }));
  const escanoDuelo = el('span', { class: 'ec-duelo-escano', html: escanoSVG(W, 44), 'aria-label': `El último escaño es para ${Pw.nombre}` });
  const duelo = el('div', { class: 'ec-duelo' }, el('p', { class: 'ec-duelo-tit', text: dueloTxt }), el('div', { class: 'ec-duelo-fila' }, lado(Pw, base[W], true), escanoDuelo, lado(Pl, base[L], false)), el('p', { class: 'ec-duelo-pie', html: `Ahora gana <b>${Pw.corto}</b> por ${d.m}. ${partido(X).corto}: ${num(base[X])} votos. En blanco: ${num(base.blanco)}. Nulos: ${num(base.nulo)}.` }));
  const prov = el('div', { class: 'ec-prov' }, el('div', { class: 'ec-prov-hemi' }, el('b', { class: 'ec-prov-tit', text: d.provincia }), hemi.nodo, el('ul', { class: 'leyenda-hemi' }, PARTIDOS.map((p) => el('li', { 'data-p': p.id, html: `${escanoSVG(p.id, 20)}<span>${p.corto}</span><b>${escBase.escanos[p.id]}</b>` })))), duelo);
  // los sobres protestados
  const elegido = d.dudosos.map(() => null);
  const tarjetas = d.dudosos.map((s, k) => {
    const opciones = el('div', { class: 'ec-dud-ops', role: 'group', 'aria-label': 'Clasificar' }, BANDEJAS.map((b) => el('button', { type: 'button', class: 'ec-dud-op', 'data-b': b.id, 'aria-pressed': 'false', title: b.largo, onclick: () => clasifica(k, b.id) }, el('span', { html: partido(b.id) ? iconoPartido(b.id, 26) : '' }), el('span', { text: partido(b.id) ? b.nombre : b.nombre }))));
    return el('div', { class: 'ec-dud', 'data-i': k }, el('div', { class: 'ec-dud-cont' }, contenido(s, d.provincia)), opciones);
  });
  const sobresNodo = el('div', { class: 'ec-duds' }, el('b', { class: 'ec-duds-tit', text: 'Sobres protestados de tu mesa' }), el('div', { class: 'ec-duds-fila' }, tarjetas));
  ctx.escenario.append(el('div', { class: 'ec-provincia' }, prov, sobresNodo));
  const clasifica = (k, id) => {
    elegido[k] = id; suena('clic');
    tarjetas[k].querySelectorAll('.ec-dud-op').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.b === id)));
    tarjetas[k].classList.add('hecho');
    const listo = elegido.every(Boolean);
    btnSi.disabled = btnNo.disabled = !listo;
    if (listo) ctx.aviso('Antes de recontar: ¿cambiará de dueño el último escaño?');
  };
  const correctas = d.dudosos.map(correcta);
  const deltaL = correctas.filter((c) => c === L).length - correctas.filter((c) => c === W).length;
  ctx.pistas([
    { texto: `Primero cada sobre: ¿es un voto para alguien, en blanco o nulo? Solo los votos para **${Pw.corto}** o **${Pl.corto}** pueden mover el escaño.` },
    { texto: `${Pw.corto} gana por ${d.m}. Para quitarle el escaño, ${Pl.corto} tiene que **sumar más votos** que ${Pw.corto} en estos sobres: ${d.m + 1} más, por lo menos. Los blancos y los nulos no suman a nadie.` },
    { texto: `Bien clasificados, estos sobres dan a ${Pl.corto} **${deltaL >= 0 ? deltaL : 0}** ${deltaL === 1 ? 'voto' : 'votos'} más que a ${Pw.corto}.` },
  ]);
  solucion = { modo: 'provincia', clases: correctas, cambia: d.cambia };
  const recuenta = async (prediceCambio) => {
    btnSi.disabled = btnNo.disabled = true;
    tarjetas.forEach((t) => t.querySelectorAll('button').forEach((b) => (b.disabled = true)));
    ctx.aviso('');
    solucion = null;
    // con tus decisiones
    const suma = (clases) => { const v = { ...base }; clases.forEach((c) => (v[c] = (v[c] ?? 0) + 1)); return v; };
    const tuyos = suma(elegido), buenos = suma(correctas);
    const repTu = dhondt({ parque: tuyos.parque, aparcamiento: tuyos.aparcamiento, pista: tuyos.pista }, d.N);
    const repBien = dhondt({ parque: buenos.parque, aparcamiento: buenos.aparcamiento, pista: buenos.pista }, d.N);
    const ganaTu = tuyos[L] > tuyos[W] ? L : W; // mismo divisor: gana quien tenga más votos
    const empataTu = tuyos[L] === tuyos[W];
    const cambiaTu = ganaTu === L && !empataTu;
    // la animación: los votos suben y el escaño cambia (o no)
    const ladoW = duelo.querySelector(`[data-p="${W}"]`), ladoL = duelo.querySelector(`[data-p="${L}"]`);
    const anima = (nodo, de, a) => { const b = nodo.querySelector('.vv'); if (lento()) { b.textContent = num(a); return; } const o = { v: de }; gsap.to(o, { v: a, duration: 0.9, ease: 'power2.out', onUpdate: () => (b.textContent = num(Math.round(o.v))) }); };
    anima(ladoW, base[W], tuyos[W]); anima(ladoL, base[L], tuyos[L]);
    suena('clic');
    await espera(1000);
    if (empataTu) { escanoDuelo.innerHTML = '<b class="ec-sorteo">?</b>'; escanoDuelo.setAttribute('aria-label', 'Empate: el escaño se sortea'); duelo.querySelector('.ec-duelo-pie').innerHTML = '<b>Empate</b>: con el mismo número de votos, la ley manda **sortear** el escaño.'.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
    else if (cambiaTu) { escanoDuelo.innerHTML = escanoSVG(L, 44); ladoW.classList.remove('gana'); ladoL.classList.add('gana'); suena('sello'); if (!lento()) gsap.from(escanoDuelo, { rotationY: 180, scale: 1.6, duration: 0.5, ease: 'back.out(2)' }); }
    if (!empataTu) duelo.querySelector('.ec-duelo-pie').innerHTML = `Tras el recuento: <b>${partido(ganaTu).corto}</b> ${num(Math.max(tuyos[W], tuyos[L]))}, ${partido(ganaTu === W ? L : W).corto} ${num(Math.min(tuyos[W], tuyos[L]))}. ${cambiaTu ? 'El escaño cambia de dueño.' : 'El escaño no se mueve.'}`;
    if (!empataTu) hemi.pinta(repTu.escanos);
    if (!empataTu) prov.querySelectorAll('.leyenda-hemi li').forEach((li) => (li.querySelector('b').textContent = String(repTu.escanos[li.dataset.p])));
    await espera(700);
    // la corrección
    const fallosC = elegido.filter((e, k) => e !== correctas[k]).length;
    const prediccionBien = empataTu || prediceCambio === cambiaTu;
    const ganaBien = d.cambia ? L : W;
    let txt = '';
    if (fallosC) {
      const malos = d.dudosos.map((s, k) => (elegido[k] !== correctas[k] ? sinMarcas(regla(s)) : null)).filter(Boolean);
      txt += `${fallosC === 1 ? 'Un sobre mal clasificado' : fallosC + ' sobres mal clasificados'}: ${malos.join(' ')} `;
      if (empataTu) txt += `Con tu recuento, ${Pw.corto} y ${Pl.corto} quedaban **empatados** y el escaño se habría sorteado. Bien contado, es para **${partido(ganaBien).corto}**: ${num(buenos[W])} contra ${num(buenos[L])}. **Un solo voto** lo cambia todo. `;
      else if ((cambiaTu ? L : W) !== ganaBien) txt += `Con el recuento bien hecho, el último escaño es para **${partido(ganaBien).corto}**: ${num(buenos[W])} contra ${num(buenos[L])}. **Un solo voto mal contado** le daba el escaño a otro partido. `;
      else txt += `Esta vez no cambia el escaño, pero el acta tiene que estar bien. `;
    } else {
      txt += d.cambia ? `**El escaño cambia de dueño.** Los dobles de ${Pl.corto} suman ${deltaL} ${deltaL === 1 ? 'voto' : 'votos'} más y ${Pl.corto} pasa delante: ${num(buenos[L])} contra ${num(buenos[W])}. ` : `**El escaño se queda donde estaba.** ${deltaL > 0 ? `${Pl.corto} solo recorta ${deltaL} ${deltaL === 1 ? 'voto' : 'votos'}` : `Estos sobres no le dan a ${Pl.corto} más votos que a ${Pw.corto}`}, y ${Pw.corto} sigue delante: ${num(buenos[W])} contra ${num(buenos[L])}. `;
      txt += 'Los blancos y los nulos no suman a ningún partido.';
    }
    if (!prediccionBien) txt += ` Tu predicción no cuadraba con tus propios sobres: con ellos, el escaño ${cambiaTu ? 'sí' : 'no'} cambiaba.`;
    const estrellas = Math.max(0, 3 - fallosC - (prediccionBien ? 0 : 1));
    // la noche electoral se guarda bien contada, para La máquina de repartir
    guardarNoche({ provincia: { nombre: d.provincia, escanos: d.N }, votos: { parque: buenos.parque, aparcamiento: buenos.aparcamiento, pista: buenos.pista, blanco: buenos.blanco, nulo: buenos.nulo } });
    void repBien;
    ctx.fin(estrellas, txt.trim());
  };
  const btnSi = ctx.boton('Cambia de dueño', () => recuenta(true));
  const btnNo = ctx.boton('No cambia', () => recuenta(false));
  btnSi.dataset.cambia = 'si'; btnNo.dataset.cambia = 'no';
  btnSi.disabled = btnNo.disabled = true;
}

/* =========================================================================== portada propia: la urna */
const ARTE = `<svg viewBox="0 0 640 400" class="arte arte-urna" aria-hidden="true">
  <defs><filter id="u-sombra" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="10" dy="18" stdDeviation="10" flood-color="#1a1430" flood-opacity=".45"/></filter></defs>
  <g filter="url(#u-sombra)"><rect x="70" y="300" width="500" height="34" rx="8" fill="#c99a63" stroke="${T}" stroke-width="5"/></g>
  <g transform="translate(176 8) scale(1.8)">${urnaSVG(7).replace(/<\/?svg[^>]*>/g, '')}</g>
  <g class="abertura">
    <g class="pieza" transform="translate(92 90) rotate(-14)"><rect width="96" height="66" rx="5" fill="#fffaf0" stroke="${T}" stroke-width="4"/><path d="M0 4 L48 38 L96 4" fill="#f3ecdc" stroke="${T}" stroke-width="4" stroke-linejoin="round"/></g>
    <g class="pieza" transform="translate(470 70) rotate(12)"><rect width="74" height="100" rx="3" fill="#fffdf6" stroke="${T}" stroke-width="4"/><g transform="translate(17 10) scale(.4)">${iconoPartido('pista', 100).replace(/<\/?svg[^>]*>/g, '')}</g><path d="M12 62 H62 M12 74 H54 M12 86 H58" stroke="${T}" stroke-width="3"/></g>
    <g class="pieza" transform="translate(470 230)"><circle cx="40" cy="40" r="34" fill="#b8322c" stroke="${T}" stroke-width="5"/><g fill="#f7d6cc"><ellipse cx="28" cy="28" rx="6" ry="5"/><ellipse cx="52" cy="34" rx="5" ry="6"/><ellipse cx="34" cy="54" rx="7" ry="5"/></g></g>
  </g>
</svg>`;
(function portadaPropia() {
  const pon = () => { const a = document.querySelector('.portada-arte'); if (!a || a.dataset.propia) return !!a; a.dataset.propia = '1'; a.innerHTML = ARTE; return true; };
  if (pon()) return;
  const mo = new MutationObserver(() => { if (pon()) mo.disconnect(); });
  mo.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => mo.disconnect(), 20000);
})();
