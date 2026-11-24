// Motor «cargador»: Sociales, tema 2 («El cajón vota»). La ley del cargador común (USB-C), una ley europea de verdad:
// la Comisión la propuso en 2021, el Parlamento Europeo y el Consejo de la UE la aprobaron en 2022 y los 27 países
// la aplican: desde el 28-12-2024, los móviles nuevos llevan USB-C; los portátiles, desde abril de 2026.
// Modos (cada uno es una mecánica):
//   ruta     → llevas el expediente de la ley de institución en institución. Si lo mandas mal, se ve qué pasa.
//   quien    → pistas sobre quién se sienta en cada sitio y qué hace: ¿dónde es?
//   negocia  → el Parlamento y el Consejo piden cambios distintos: arregla el texto para que voten sí los dos.
//   mapa     → toca en el mapa los países donde obliga la ley (o donde pagas en euros, o donde puedes ir a trabajar).
//   tabla    → coloca países en la tabla UE sí/no × euro sí/no; el mapa se pinta a la vez.
// Con ?prueba en la dirección, window.__sol() y window.__mal() juegan el reto actual (para las pruebas automáticas).
import { el, elige, barajar, suena } from './nucleo.js';
import { gsap } from './vendor/gsap.js';
import { espera, bote, temblor, chispasEn, arrastra } from './efectos.js';
import { EUROPA } from './mapa-europa.js';
import { NIVELES as COLOR_NIVEL } from './civica-comun.js';

const lento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const T = '#1b1e3a';
const AZUL_UE = COLOR_NIVEL.ue.color;
const PRUEBA = new URLSearchParams(location.search).has('prueba');
const prueba = (bien, mal) => { if (PRUEBA) { window.__sol = bien; window.__mal = mal; } };
const porFallos = (f) => (f === 0 ? 3 : f === 1 ? 2 : f === 2 ? 1 : 0);
const pais = (id) => EUROPA.paises.find((p) => p.id === id);

/* =========================================================================== las instituciones */
const ESTRELLAS = (cx, cy, r, tam = 3.2) => Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<circle cx="${(cx + r * Math.cos(a)).toFixed(1)}" cy="${(cy + r * Math.sin(a)).toFixed(1)}" r="${tam}" fill="#ffc531"/>`; }).join('');
const ICONOS = {
  comision: `<rect x="14" y="26" width="72" height="48" fill="#e3ecff" stroke="${T}" stroke-width="3.5"/><path d="M14 26 L50 10 L86 26Z" fill="#c9cfdd" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/><path d="M24 40 H34 M24 52 H34 M24 64 H34 M66 40 H76 M66 52 H76 M66 64 H76" stroke="${T}" stroke-width="3"/><circle cx="50" cy="50" r="15" fill="#2f5bd3" stroke="${T}" stroke-width="3"/>${ESTRELLAS(50, 50, 10, 1.8)}`,
  parlamento: `<path d="M8 72 A42 42 0 0 1 92 72Z" fill="#e3ecff" stroke="${T}" stroke-width="3.5"/>${[34, 25, 16].map((r, k) => Array.from({ length: 7 + k * 2 }, (_, i) => { const a = Math.PI + (i / (6 + k * 2)) * Math.PI; return `<circle cx="${(50 + (r + 4) * Math.cos(a)).toFixed(1)}" cy="${(70 + (r + 4) * Math.sin(a)).toFixed(1)}" r="3.3" fill="${['#e8417a', '#2f5bd3', '#9bd84a', '#ff8a1f', '#cda8ff'][(i + k) % 5]}" stroke="${T}" stroke-width="1.4"/>`; }).join('')).join('')}<rect x="42" y="62" width="16" height="10" fill="#ffc531" stroke="${T}" stroke-width="2.5"/>`,
  consejo: `<ellipse cx="50" cy="48" rx="30" ry="20" fill="#d9ad72" stroke="${T}" stroke-width="3.5"/><ellipse cx="50" cy="48" rx="14" ry="8" fill="#2f5bd3" stroke="${T}" stroke-width="2.5"/>${Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return `<circle cx="${(50 + 40 * Math.cos(a)).toFixed(1)}" cy="${(48 + 28 * Math.sin(a)).toFixed(1)}" r="5.5" fill="#fffdf6" stroke="${T}" stroke-width="2.5"/>`; }).join('')}`,
  paises: `<path d="M10 74 H90" stroke="${T}" stroke-width="3.5" stroke-linecap="round"/>${[[14, '#e8417a'], [40, '#9bd84a'], [66, '#ff8a1f']].map(([x, c]) => `<rect x="${x}" y="44" width="20" height="30" fill="#fffdf6" stroke="${T}" stroke-width="3"/><path d="M${x - 2} 44 L${x + 10} 34 L${x + 22} 44Z" fill="${c}" stroke="${T}" stroke-width="3" stroke-linejoin="round"/><path d="M${x + 10} 34 V18" stroke="${T}" stroke-width="2.5"/><rect x="${x + 10}" y="18" width="12" height="8" fill="${c}" stroke="${T}" stroke-width="2"/>`).join('')}`,
  gobierno: `<rect x="18" y="30" width="64" height="44" fill="#fff0c2" stroke="${T}" stroke-width="3.5"/><path d="M18 30 H82" stroke="${T}" stroke-width="3.5"/><rect x="42" y="52" width="16" height="22" fill="#d9ad72" stroke="${T}" stroke-width="3"/><path d="M28 40 H36 M64 40 H72 M28 56 H36 M64 56 H72" stroke="${T}" stroke-width="3"/><path d="M50 30 V8" stroke="${T}" stroke-width="2.5"/><rect x="50" y="8" width="20" height="13" fill="#d7263d" stroke="${T}" stroke-width="2"/><rect x="50" y="11.5" width="20" height="6" fill="#ffc531"/>`,
  congreso: `<path d="M12 32 L50 12 L88 32Z" fill="#fffdf6" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/><rect x="14" y="32" width="72" height="6" fill="#e3ecff" stroke="${T}" stroke-width="3"/>${[20, 34, 48, 62, 76].map((x) => `<rect x="${x - 3}" y="38" width="10" height="32" fill="#fffdf6" stroke="${T}" stroke-width="2.5"/>`).join('')}<rect x="10" y="70" width="80" height="8" fill="#c9cfdd" stroke="${T}" stroke-width="3"/>`,
};
const SITIOS = {
  comision: { nombre: 'Comisión Europea', hace: 'Propone las leyes', quien: 'un comisario por país' },
  parlamento: { nombre: 'Parlamento Europeo', hace: 'Vota las leyes', quien: '720 eurodiputados votados por la gente' },
  consejo: { nombre: 'Consejo de la UE', hace: 'Vota las leyes', quien: 'un ministro de cada Gobierno' },
  paises: { nombre: 'Los 27 países', hace: 'Aplican las leyes', quien: 'cada país, en sus tiendas' },
  gobierno: { nombre: 'Gobierno de España', hace: 'Gobierna España', quien: 'el presidente y sus ministros' },
  congreso: { nombre: 'Congreso de los Diputados', hace: 'Hace las leyes de España', quien: '350 diputados' },
};
// lo que pasa en cada sitio cuando el expediente llega donde toca
const LLEGA = {
  comision: 'La Comisión escribe la **propuesta**: todos los móviles, tablets, cámaras, auriculares y consolas, con el mismo cargador.',
  parlamento: 'Los eurodiputados debaten. Piden un cambio: **que entren también los portátiles**. Con ese cambio, votan que sí.',
  consejo: 'Los ministros de los 27 gobiernos piden un cambio: **tiempo para que las fábricas se adapten**. Con eso, votan que sí.',
  paises: 'Cada país la mete en sus leyes y vigila las tiendas. **Desde el 28 de diciembre de 2024**, los móviles nuevos llevan USB-C.',
};
const SELLO = { comision: 'Propuesta', parlamento: 'Sí del Parlamento', consejo: 'Sí del Consejo', paises: 'En las tiendas' };
const PEGATINA = { parlamento: '+ portátiles', consejo: '+ 2 años para las fábricas' };

/* =========================================================================== bancos */
const PREGUNTAS = [
  { f: 1, t: 'Aquí se sientan personas que **tú** podrás votar cuando cumplas 18 años.', vale: ['parlamento'], por: 'Al **Parlamento Europeo** lo elige la gente votando, cada 5 años. Las últimas elecciones europeas fueron en 2024.' },
  { f: 1, t: 'Aquí se sienta un ministro del Gobierno de España, junto a uno de cada uno de los otros 26 gobiernos.', vale: ['consejo'], por: 'El **Consejo de la UE**: un ministro por cada Gobierno. Para una ley de cargadores, van los que se ocupan de la industria.' },
  { f: 1, t: 'Aquí se escribe la propuesta de ley. Todavía no la ha votado nadie.', vale: ['comision'], por: 'La **Comisión Europea** propone las leyes. Luego las votan otros.' },
  { f: 1, t: 'Aquí la ley europea se mete en las leyes de cada país y se vigila que las tiendas la cumplan.', vale: ['paises'], por: 'Los **27 países** aplican las leyes europeas. España lo hizo con una norma de 2024.' },
  { f: 2, t: 'España tiene **61** asientos aquí, y Portugal, 21. Cuanta más gente vive en un país, más asientos.', vale: ['parlamento'], por: 'Son los escaños del **Parlamento Europeo**: 720 en total, repartidos según la población de cada país.' },
  { f: 2, t: 'Aquí se sientan personas que **no** ha votado directamente la gente: las manda cada Gobierno.', vale: ['consejo', 'comision'], por: 'Vale el **Consejo** (ministros de cada Gobierno) y vale la **Comisión** (un comisario por país, propuesto por su Gobierno). Al Parlamento Europeo, en cambio, lo vota la gente.' },
  { f: 2, t: 'Si a la mayoría de los gobiernos no les gusta una ley europea, aquí la pueden parar.', vale: ['consejo'], por: 'En el **Consejo de la UE** votan los gobiernos. Sin su sí, no hay ley.' },
  { f: 2, t: 'Aquí se hacen las leyes de España, pero **no** las de la Unión Europea.', vale: ['congreso'], por: 'El **Congreso de los Diputados** hace leyes para España. La UE no es un país: sus leyes se votan en el Parlamento Europeo y en el Consejo.', con: 'congreso' },
  { f: 2, t: 'Aquí no se votan leyes: se escriben las propuestas para los 27 países a la vez.', vale: ['comision'], por: 'La **Comisión** propone. Votar, votan el Parlamento Europeo y el Consejo.' },
];
const POR_QUE_NO = {
  comision: 'La Comisión propone las leyes; no la vota la gente.',
  parlamento: 'Al Parlamento Europeo lo vota la gente, cada 5 años.',
  consejo: 'En el Consejo se sientan ministros de los 27 gobiernos.',
  paises: 'Los países aplican las leyes cuando ya están aprobadas.',
  gobierno: 'El Gobierno de España gobierna España; en la UE, manda un ministro al Consejo.',
  congreso: 'El Congreso hace las leyes de España.',
};

// mapa: qué pasa en cada país según lo que se pregunta
const MONEDA = { DK: 'coronas danesas', SE: 'coronas suecas', PL: 'eslotis', CZ: 'coronas checas', HU: 'forintos', RO: 'leus', CH: 'francos suizos', GB: 'libras', NO: 'coronas noruegas', RS: 'dinares', UA: 'grivnas', TR: 'liras' };
const CRITERIOS = {
  ley: { reto: '¿En qué países **obliga** la ley del cargador? Toca los que sí.', boton: 'Ver dónde obliga', si: (p) => p.ue, color: AZUL_UE, leyenda: 'Unión Europea: la ley obliga',
    por: (p) => p.id === 'DK' ? 'Dinamarca no usa el euro, pero **es de la UE**: la ley obliga.'
      : p.id === 'CH' ? 'Suiza está en Europa, pero **no en la UE**: la ley europea no manda allí. (Suiza decidió en 2023 poner por su cuenta una norma igual.)'
      : p.id === 'AD' ? 'Andorra usa el euro, pero **no es de la UE**: la ley europea no la obliga.'
      : p.id === 'GB' ? 'El Reino Unido **salió de la UE** en 2020: allí la ley europea ya no manda.'
      : p.ue ? `${p.nombre} es de la UE: la ley obliga.` : `${p.nombre} no es de la UE: la ley no obliga.` },
  euro: { reto: 'Llevas la cartera llena de **euros**. ¿En qué países puedes pagar con ellos? Toca los que sí.', boton: 'Ver dónde se paga en euros', si: (p) => p.euro, color: '#ffc531', leyenda: 'Se paga en euros',
    por: (p) => p.id === 'AD' ? 'Andorra **no es de la UE**, pero usa el euro.'
      : p.id === 'BG' ? 'Bulgaria se pasó al euro el **1 de enero de 2026**.'
      : p.id === 'ME' || p.id === 'XK' || p.id === 'MC' || p.id === 'SM' ? `${p.nombre} no es de la UE, pero usa el euro.`
      : p.ue && !p.euro ? `${p.nombre} **es de la UE, pero paga en ${MONEDA[p.id]}**.`
      : p.euro ? `En ${p.nombre}, euros.` : `${p.nombre} no es de la UE y paga en ${MONEDA[p.id] ?? 'su moneda'}.` },
  trabajo: { reto: 'Tu tía quiere irse a vivir y trabajar a otro país **sin pedir permiso**. ¿Adónde puede ir? Toca los que sí.', boton: 'Ver adónde puede ir', si: (p) => p.ue, color: AZUL_UE, leyenda: 'Unión Europea: libre circulación',
    por: (p) => p.id === 'DK' ? 'Dinamarca no usa el euro, pero **es de la UE**: puede irse sin permiso.'
      : p.id === 'AD' ? 'Andorra usa el euro, pero **no es de la UE**: para vivir y trabajar allí hace falta un permiso.'
      : p.id === 'GB' ? 'Desde que el Reino Unido **salió de la UE**, para trabajar allí hace falta un visado.'
      : p.ue ? `${p.nombre} es de la UE: libre circulación.` : `${p.nombre} no es de la UE: hace falta permiso.` },
};
// países para el mapa y la tabla. No se usan Noruega, Islandia, Liechtenstein ni (para el trabajo) Suiza:
// tienen acuerdos con la UE que complican la respuesta para Primaria.
const UE_EURO = ['FR', 'PT', 'IT', 'DE', 'IE', 'AT', 'GR', 'NL', 'BE', 'FI'];
const UE_SIN = ['DK', 'SE', 'PL', 'CZ', 'HU', 'RO'];
const FUERA_EURO = ['AD', 'ME'];
const FUERA_SIN = ['CH', 'GB', 'RS', 'UA'];

/* =========================================================================== generar */
export function generar(spec) {
  const d = structuredClone(spec);
  const g = typeof d.generar === 'object' ? d.generar : {};
  delete d.generar;
  d.f = g.f ?? 1;
  if (d.modo === 'ruta') {
    const inicios = g.desde ?? ['idea', 'propuesta', 'medio', 'aprobada'];
    d.desde = elige(inicios);
    d.hecho = { idea: [], propuesta: ['comision'], medio: ['comision', elige(['parlamento', 'consejo'])], aprobada: ['comision', 'parlamento', 'consejo'] }[d.desde];
    d.pasos = g.pasos ?? 1;
    d.sitios = ['comision', 'parlamento', 'consejo', 'paises', ...(g.extra ?? [])];
  } else if (d.modo === 'quien') {
    const extra = g.extra ?? [];
    const pool = PREGUNTAS.filter((q) => q.f <= d.f && q.f >= (g.min ?? 1) && (!q.con || extra.includes(q.con)));
    d.preguntas = barajar(pool).slice(0, g.n ?? 2);
    d.sitios = ['comision', 'parlamento', 'consejo', 'paises', ...extra];
  } else if (d.modo === 'negocia') {
    if (d.f === 1) { d.pe = [elige(['portatiles', 'sin'])]; d.co = ['tiempo2']; }
    else { d.pe = ['sin', 'max3', ...(g.portatiles ? ['portatiles'] : [])]; d.co = ['con', 'tiempo3']; }
  } else if (d.modo === 'mapa') {
    d.criterio = elige(g.criterios ?? ['ley']);
    const n = g.n ?? 5;
    let ids;
    if (d.f === 1) ids = ['ES', elige(['FR', 'PT', 'IT']), elige(['DE', 'IE', 'GR']), 'CH', 'GB'];
    else {
      const fuera = d.criterio === 'trabajo' ? ['AD', 'GB'] : ['AD', 'CH', elige(['GB', 'RS', 'UA'])];
      ids = ['ES', 'DK', ...fuera, ...barajar(UE_EURO).slice(0, 1), ...barajar(UE_SIN.filter((x) => x !== 'DK')).slice(0, d.criterio === 'euro' ? 2 : 1)];
      if (d.criterio === 'euro' && d.f >= 3) ids.push('BG');
    }
    d.pines = [...new Set(ids)].slice(0, Math.max(n, ids.length));
  } else if (d.modo === 'tabla') {
    const n = g.n ?? 5;
    const base = [elige(UE_EURO), elige(UE_SIN), 'AD', elige(FUERA_SIN)];
    const resto = barajar([...UE_EURO, ...UE_SIN, ...FUERA_SIN].filter((x) => !base.includes(x))).slice(0, n - 4);
    d.paises = barajar([...base, ...resto]);
  }
  return d;
}
export function ronda(d, ctx) {
  const m = { ruta, quien, negocia, mapa, tabla }[d.modo];
  if (!m) throw new Error(`no encuentro el modo «${d.modo}». Si el juego se acaba de actualizar, recarga la página.`);
  return m(d, ctx);
}

/* =========================================================================== piezas */
function tarjetaSitio(id, { conHace = false, onclick } = {}) {
  const s = SITIOS[id];
  return el('button', { type: 'button', class: 'cg-sitio', 'data-id': id, onclick },
    el('span', { class: 'cg-sitio-dibujo', html: `<svg viewBox="0 0 100 82" aria-hidden="true">${ICONOS[id]}</svg>` }),
    el('b', { text: s.nombre }), conHace && el('small', { text: s.hace }));
}
function expediente() {
  const sellos = el('ul', { class: 'cg-sellos', 'aria-label': 'Sellos del expediente' });
  const pegatinas = el('div', { class: 'cg-pegatinas' });
  const n = el('div', { class: 'cg-expediente' },
    el('span', { class: 'cg-carpeta', html: `<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M6 18 H44 L52 26 H114 V84 H6Z" fill="#ffc531" stroke="${T}" stroke-width="4" stroke-linejoin="round"/><path d="M6 32 H114" stroke="${T}" stroke-width="3" opacity=".4"/><rect x="34" y="44" width="52" height="16" rx="8" fill="#c9cfdd" stroke="${T}" stroke-width="3.5"/><rect x="44" y="49" width="32" height="6" rx="3" fill="${T}"/><path d="M86 52 H104" stroke="${T}" stroke-width="5" stroke-linecap="round"/></svg>` }),
    el('b', { text: 'Ley del cargador común' }), pegatinas, sellos);
  n.sella = (id, animar = true) => {
    const li = el('li', { class: 'cg-sello s-' + id, text: SELLO[id] });
    sellos.append(li);
    if (PEGATINA[id]) pegatinas.append(el('span', { class: 'cg-pegatina', text: PEGATINA[id] }));
    if (animar && !lento()) gsap.from(li, { scale: 2.2, rotation: -25, opacity: 0, duration: 0.35, ease: 'power3.in' });
  };
  return n;
}
const siguiente = (hecho) => (!hecho.includes('comision') ? ['comision'] : !hecho.includes('parlamento') || !hecho.includes('consejo') ? ['parlamento', 'consejo'].filter((x) => !hecho.includes(x)) : !hecho.includes('paises') ? ['paises'] : []);
function porQueNo(dest, hecho) {
  const falta = siguiente(hecho);
  if (dest === 'gobierno') return 'El Gobierno de España solo manda en España. **La UE no es un país**: una ley para los 27 no la hace un Gobierno solo. (Eso sí: un ministro suyo se sienta en el Consejo de la UE.)';
  if (dest === 'congreso') return 'El Congreso hace las leyes **de España**. Las leyes europeas se votan en el Parlamento Europeo y en el Consejo.';
  if (hecho.includes(dest)) return `Aquí ya han dicho lo suyo: el expediente lleva el sello «${SELLO[dest]}».`;
  if (dest === 'paises') return `Los países devuelven el expediente: «Esto todavía no es ley». Falta ${falta.includes('comision') ? 'hasta la propuesta' : falta.map((x) => 'el sí del ' + SITIOS[x].nombre.replace('Consejo de la UE', 'Consejo')).join(' y ')}.`;
  if (falta.includes('comision')) return 'Sin propuesta no hay nada que votar. En la UE, **las leyes las propone la Comisión**.';
  return `No toca aún: ${dest === 'comision' ? 'la propuesta ya está hecha' : 'falta otro paso antes'}.`;
}

// el mapa de Europa con botones encima (los países que se preguntan). Se recorta a la parte que interesa
// y algunas etiquetas se mueven para que no se pisen.
const VB = { x: 30, y: 170, w: 840, h: 803 };
const ETIQUETA = { SE: [585, 300], FI: [680, 260], PL: [612, 520], ES: [150, 858], AD: [256, 738], FR: [296, 632], CH: [392, 650], IT: [512, 776], DE: [452, 512], AT: [560, 648], CZ: [540, 590], GB: [270, 520], PT: [118, 800], BG: [760, 760], ME: [612, 790], RS: [672, 722] };
function mapa_(pines = [], { etiqueta = (p) => p.nombre } = {}) {
  const caja = el('div', { class: 'cg-mapa' });
  const paths = EUROPA.paises.map((p) => `<path class="cg-pais" data-id="${p.id}" d="${p.d}"/>`).join('');
  caja.innerHTML = `<svg viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" aria-hidden="true"><rect x="0" y="0" width="${EUROPA.ancho}" height="${EUROPA.alto}" class="cg-mar"/><path class="cg-fondo" d="${EUROPA.fondo}"/>${paths}</svg>`;
  const botones = pines.map((id) => {
    const p = pais(id);
    const [x, y] = ETIQUETA[id] ?? (p.pequeno ? [p.bx, p.by] : [p.x, p.y]);
    const b = el('button', { type: 'button', class: 'cg-pin' + (p.pequeno ? ' pequeno' : ''), 'data-id': id, 'aria-pressed': 'false', style: { left: Math.min(90, Math.max(10, ((x - VB.x) / VB.w) * 100)) + '%', top: Math.min(95, Math.max(4, ((y - VB.y) / VB.h) * 100)) + '%' } },
      el('i', { 'aria-hidden': 'true' }), el('span', { text: etiqueta(p) }));
    caja.append(b);
    return b;
  });
  caja.botones = botones;
  caja.pinta = (id, color) => { const n = caja.querySelector(`.cg-pais[data-id="${id}"]`); if (n) n.style.fill = color ?? ''; };
  return caja;
}

/* =========================================================================== modos */

// ---------------------------------------------------------------- el viaje de la ley
function ruta(d, ctx) {
  const hecho = [...d.hecho];
  const meta = d.pasos === 'todo' ? 4 : d.pasos;
  const conHace = d.f === 1;
  const empieza = { idea: 'Todo el mundo está harto de cables. Hace falta **una ley para los 27 países**. ¿Adónde llevas la idea primero?', propuesta: 'La ley ya está **propuesta**. ¿Adónde va ahora?', medio: `La ley ya tiene ${hecho.includes('parlamento') ? 'el sí del **Parlamento**' : 'el sí del **Consejo**'}. ¿Adónde va ahora?`, aprobada: 'El **Parlamento y el Consejo** ya han dicho que sí. ¿Adónde va ahora?' }[d.desde];
  ctx.reto(meta > 1 ? empieza.replace('¿Adónde llevas la idea primero?', '**Llévala por todo su camino**, sitio a sitio.') : empieza);
  ctx.pista(d.pista ?? 'Toca el sitio adonde mandas el expediente. Mira sus sellos: dicen qué tiene ya.');
  const exp = expediente();
  hecho.forEach((h) => exp.sella(h, false));
  const tablero = el('div', { class: 'cg-tablero' }, barajar(d.sitios).map((id) => tarjetaSitio(id, { conHace, onclick: () => manda(id) })));
  const bocadillo = el('p', { class: 'cg-dice', 'aria-live': 'polite' });
  const caja = el('div', { class: 'cg-ruta' }, el('div', { class: 'cg-mesa-exp' }, exp, bocadillo), tablero);
  ctx.escenario.append(caja);
  let fallos = 0, dados = 0, ocupado = false;
  const pon = (t, mal) => { bocadillo.className = 'cg-dice ' + (mal ? 'mal' : 'bien'); bocadillo.innerHTML = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); };
  const pistas = () => {
    const sig = siguiente(hecho);
    ctx.pistas([
      { texto: 'Una ley europea va así: alguien la **propone**, dos instituciones la **votan** y los países la **aplican**.' },
      { texto: hecho.length ? `El expediente ya lleva: ${hecho.map((h) => '«' + SELLO[h] + '»').join(', ')}. ¿Qué le falta?` : 'Todavía no hay nada escrito. Antes de votar, alguien tiene que escribir la propuesta.' },
      { texto: `Ahora toca: **${sig.map((x) => SITIOS[x].nombre).join('** o **')}**.` },
    ]);
  };
  async function manda(id) {
    if (ocupado) return; ocupado = true;
    const b = tablero.querySelector(`[data-id="${id}"]`);
    const ok = siguiente(hecho).includes(id);
    if (!lento()) {
      const r1 = exp.getBoundingClientRect(), r2 = b.getBoundingClientRect();
      await gsap.to(exp, { x: r2.left + r2.width / 2 - (r1.left + r1.width / 2), y: r2.top + r2.height / 2 - (r1.top + r1.height / 2), scale: 0.45, rotation: 8, duration: 0.4, ease: 'power2.in' }).then();
    }
    suena(ok ? 'pon' : 'mal');
    if (ok) {
      hecho.push(id); dados++;
      b.classList.add('visitado');
      exp.sella(id);
      pon(LLEGA[id]);
      chispasEn(b, 10);
    } else {
      fallos++;
      b.classList.add('rebota'); temblor(b, 6); setTimeout(() => b.classList.remove('rebota'), 700);
      pon(porQueNo(id, hecho), true);
    }
    if (!lento()) await gsap.to(exp, { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(1.6)' }).then();
    await espera(ok ? 500 : 900);
    ocupado = false;
    if (ok && (dados >= meta || hecho.includes('paises'))) return final();
    pistas();
  }
  async function final() {
    tablero.querySelectorAll('button').forEach((x) => (x.disabled = true));
    let extra = '';
    if (hecho.includes('paises')) {
      const m = mapa_();
      m.classList.add('cg-mapa-mini');
      caja.append(m);
      const ue = EUROPA.paises.filter((p) => p.ue);
      if (!lento()) for (const p of barajar(ue)) { m.pinta(p.id, AZUL_UE); await espera(35); } else ue.forEach((p) => m.pinta(p.id, AZUL_UE));
      extra = ' Ya está en los 27 países: el mismo cargador en Lisboa, en Madrid y en Varsovia.';
    }
    const resumen = 'Comisión (**propone**) → Parlamento Europeo y Consejo de la UE (**votan**, los dos) → los 27 países (**aplican**).';
    ctx.fin(porFallos(fallos), (fallos ? `${fallos === 1 ? 'Un viaje de más' : fallos + ' viajes de más'}. ` : 'Sin un viaje de más. ') + resumen + extra);
  }
  pistas();
  prueba(async () => { while (!ctx.escenario.querySelector('.cg-tablero button:disabled')) { const s = siguiente(hecho)[0]; if (!s) break; await manda(s); } },
    async () => { const malos = d.sitios.filter((x) => !siguiente(hecho).includes(x)); for (let i = 0; i < 3; i++) await manda(malos[i % malos.length]); while (!ctx.escenario.querySelector('.cg-tablero button:disabled')) { const s = siguiente(hecho)[0]; if (!s) break; await manda(s); } });
}

// ---------------------------------------------------------------- ¿dónde es?
function quien(d, ctx) {
  const lista = d.preguntas;
  ctx.reto('Cada pista habla de un sitio. **¿Dónde es?**');
  ctx.pista(d.pista ?? 'Lee la pista y toca el sitio. A veces vale más de uno.');
  const cartel = el('div', { class: 'cg-cartel' });
  const fila = el('ol', { class: 'cg-fila', 'aria-label': 'Pistas' }, lista.map((_, i) => el('li', { text: String(i + 1) })));
  const tablero = el('div', { class: 'cg-tablero' }, d.sitios.map((id) => tarjetaSitio(id, { onclick: () => decide(id) })));
  ctx.escenario.append(el('div', { class: 'cg-quien' }, el('div', { class: 'cg-lado' }, cartel, fila), tablero));
  let i = 0, fallos = 0, ocupado = false; const malos = [];
  const pinta = () => {
    const q = lista[i];
    cartel.replaceChildren(el('small', { text: `Pista ${i + 1} de ${lista.length}` }), el('p', { html: q.t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') }));
    fila.querySelectorAll('li').forEach((li, k) => li.classList.toggle('ahora', k === i));
    tablero.querySelectorAll('.cg-sitio').forEach((b) => { b.disabled = false; b.classList.remove('bien', 'tachada'); });
    if (!lento()) gsap.from(cartel, { y: -20, opacity: 0, duration: 0.3, ease: 'back.out(2)' });
    const otra = d.sitios.filter((x) => !q.vale.includes(x));
    ctx.pistas([
      { texto: 'Recuerda: la Comisión **propone**, el Parlamento y el Consejo **votan**, los países **aplican**.' },
      { texto: 'Al Parlamento Europeo lo vota la gente. En el Consejo se sientan ministros de los gobiernos.' },
      { texto: `No es ${otra.slice(0, 2).map((x) => 'el sitio «' + SITIOS[x].nombre + '»').join(' ni ')}.` },
    ]);
  };
  async function decide(id) {
    if (ocupado) return; ocupado = true;
    const q = lista[i], ok = q.vale.includes(id);
    tablero.querySelectorAll('.cg-sitio').forEach((b) => (b.disabled = true));
    const b = tablero.querySelector(`[data-id="${id}"]`);
    b.classList.add(ok ? 'bien' : 'tachada'); suena(ok ? 'bien' : 'mal');
    if (!ok) { fallos++; malos.push(q); temblor(b, 6); q.vale.forEach((v) => tablero.querySelector(`[data-id="${v}"]`)?.classList.add('bien')); }
    fila.children[i].classList.add(ok ? 'bien' : 'mal');
    ctx.aviso(ok ? q.por.replace(/\*\*/g, '') : POR_QUE_NO[id] + ' ' + q.por.replace(/\*\*/g, ''), !ok);
    await espera(ok ? 1100 : 2200);
    ocupado = false; i++;
    if (i < lista.length) { ctx.aviso(''); return pinta(); }
    ctx.fin(porFallos(fallos * (lista.length <= 2 ? 1.5 : 1) | 0), fallos ? `**${lista.length - fallos} de ${lista.length}.** ` + malos.map((m) => m.por).join(' ') : `**${lista.length} de ${lista.length}.** ` + lista.map((m) => m.por).join(' '));
  }
  pinta();
  const jugar = async (bien) => { while (i < lista.length) { const q = lista[i]; await decide(bien ? q.vale[0] : d.sitios.find((x) => !q.vale.includes(x))); } };
  prueba(() => jugar(true), () => jugar(false));
}

// ---------------------------------------------------------------- la negociación
const APARATOS = [['moviles', 'Móviles'], ['tablets', 'Tablets'], ['camaras', 'Cámaras'], ['auriculares', 'Auriculares'], ['consolas', 'Consolas portátiles'], ['portatiles', 'Portátiles']];
const VENTA = [['con', 'Siempre con cargador'], ['sin', 'Siempre sin cargador'], ['elegir', 'Con o sin: elige quien compra']];
const PIDE = {
  portatiles: { t: 'Que entren también los **portátiles**.', ok: (s) => s.ap.portatiles, no: 'faltan los portátiles' },
  sin: { t: 'Que se pueda comprar el aparato **sin cargador**: hay millones de cargadores muertos de risa en los cajones.', ok: (s) => s.venta !== 'con', no: 'no se puede comprar sin cargador' },
  max3: { t: 'Que no se tarde mucho: **como mucho 3 años**.', ok: (s) => s.plazo <= 3, no: 'tarda demasiado' },
  tiempo2: { t: 'Que las fábricas tengan **al menos 2 años** para cambiar.', ok: (s) => s.plazo >= 2, no: 'las fábricas no tienen tiempo' },
  tiempo3: { t: 'Que las fábricas tengan **al menos 3 años** para cambiar.', ok: (s) => s.plazo >= 3, no: 'las fábricas no tienen tiempo' },
  con: { t: 'Que quien no tenga cargador **pueda seguir comprándolo con el aparato**.', ok: (s) => s.venta !== 'sin', no: 'quien no tiene cargador no puede comprarlo con el aparato' },
};
function negocia(d, ctx) {
  ctx.reto('El Parlamento Europeo y el Consejo piden cambios distintos. **Arregla la ley para que voten que sí los dos.**');
  ctx.pista(d.pista ?? 'Lee lo que pide cada uno, cambia el texto y llévalo a votar.');
  const s = { ap: { moviles: true, tablets: true, camaras: true, auriculares: true, consolas: true, portatiles: false }, plazo: 1, venta: 'con' };
  const chips = el('div', { class: 'cg-chips', role: 'group', 'aria-label': 'Aparatos' }, APARATOS.map(([k, t]) => el('button', { type: 'button', class: 'cg-chip', 'aria-pressed': String(s.ap[k]), 'data-k': k, text: t, onclick: (e) => { s.ap[k] = !s.ap[k]; e.currentTarget.setAttribute('aria-pressed', String(s.ap[k])); suena('clic'); limpia(); } })));
  const plazoTxt = el('output', { class: 'cg-plazo-num' });
  const pintaPlazo = () => { plazoTxt.textContent = `${s.plazo} ${s.plazo === 1 ? 'año' : 'años'}`; };
  const plazo = el('div', { class: 'cg-stepper' }, el('button', { type: 'button', class: 'tecla', 'aria-label': 'Un año menos', text: '−', onclick: () => { s.plazo = Math.max(1, s.plazo - 1); pintaPlazo(); suena('clic'); limpia(); } }), plazoTxt, el('button', { type: 'button', class: 'tecla', 'aria-label': 'Un año más', text: '+', onclick: () => { s.plazo = Math.min(5, s.plazo + 1); pintaPlazo(); suena('clic'); limpia(); } }));
  const venta = el('div', { class: 'cg-chips', role: 'radiogroup', 'aria-label': 'Venta del cargador' }, VENTA.map(([k, t]) => el('button', { type: 'button', class: 'cg-chip', role: 'radio', 'aria-checked': String(s.venta === k), 'data-v': k, text: t, onclick: (e) => { s.venta = k; venta.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b === e.currentTarget))); suena('clic'); limpia(); } })));
  pintaPlazo();
  const texto = el('div', { class: 'cg-ley' }, el('h3', { text: 'Ley del cargador común' }), el('small', { text: 'Propuesta de la Comisión Europea' }),
    el('div', { class: 'cg-campo' }, el('b', { text: '1. Aparatos que llevarán USB-C' }), chips),
    el('div', { class: 'cg-campo' }, el('b', { text: '2. Tiempo para que las fábricas cambien' }), plazo),
    el('div', { class: 'cg-campo' }, el('b', { text: '3. ¿El aparato se vende con cargador?' }), venta));
  const casa = (id, nombre, quien, pide) => el('section', { class: 'cg-casa', 'data-id': id },
    el('div', { class: 'cg-casa-cab' }, el('span', { class: 'cg-sitio-dibujo', html: `<svg viewBox="0 0 100 82" aria-hidden="true">${ICONOS[id]}</svg>` }), el('div', {}, el('b', { text: nombre }), el('small', { text: quien }))),
    el('ul', { class: 'cg-pide' }, pide.map((k) => el('li', { 'data-k': k, html: PIDE[k].t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') }))),
    el('p', { class: 'cg-veredicto' }));
  const pe = casa('parlamento', 'Parlamento Europeo', '720 eurodiputados, votados por la gente', d.pe);
  const co = casa('consejo', 'Consejo de la UE', 'un ministro de cada uno de los 27 gobiernos', d.co);
  ctx.escenario.append(el('div', { class: 'cg-negocia' }, texto, el('div', { class: 'cg-casas' }, pe, co)));
  function limpia() { [pe, co].forEach((c) => { c.classList.remove('si', 'no'); c.querySelector('.cg-veredicto').textContent = ''; c.querySelectorAll('li').forEach((li) => li.classList.remove('bien', 'mal')); c.querySelector('.cn-sello, .cg-voto-sello')?.remove(); }); }
  const vota = (c, pide) => {
    const sinMoviles = !s.ap.moviles;
    const fallan = pide.filter((k) => !PIDE[k].ok(s));
    c.querySelectorAll('li').forEach((li) => li.classList.add(PIDE[li.dataset.k].ok(s) ? 'bien' : 'mal'));
    const si = !fallan.length && !sinMoviles;
    c.classList.add(si ? 'si' : 'no');
    c.querySelector('.cg-veredicto').textContent = si ? 'Votan que sí.' : 'Votan que no: ' + (sinMoviles ? '¡sin móviles, la ley no sirve para lo que se pensó!' : fallan.map((k) => PIDE[k].no).join(' y ') + '.');
    const sello = el('span', { class: 'cg-voto-sello ' + (si ? 'si' : 'no'), 'aria-hidden': 'true', text: si ? 'SÍ' : 'NO' });
    c.append(sello);
    if (!lento()) gsap.from(sello, { scale: 2.4, rotation: -30, opacity: 0, duration: 0.3, ease: 'power3.in' });
    return si;
  };
  let intentos = 0;
  const votar = async () => {
    intentos++;
    limpia();
    suena('sello');
    const a = vota(pe, d.pe);
    await espera(350);
    const b = vota(co, d.co);
    suena(a && b ? 'bien' : 'mal');
    if (a && b) {
      ctx.acciones.replaceChildren();
      texto.querySelectorAll('button').forEach((x) => (x.disabled = true));
      const real = 'Así fue de verdad: en 2022 la ley salió con los portátiles dentro, más tiempo para ellos, y pudiendo comprar el aparato con o sin cargador.';
      return ctx.fin(Math.max(1, 4 - intentos), `Los dos han votado **el mismo texto**: ya es ley. Una ley europea necesita el sí del Parlamento (lo que quiere la gente que votó) y el del Consejo (lo que quieren los gobiernos). ${real}`);
    }
    if (!a || !b) temblor(!a ? pe : co, 6);
    if (intentos >= 3) {
      ctx.acciones.replaceChildren();
      return ctx.fin(0, `Una forma que vale: ${d.f === 1 ? (d.pe[0] === 'portatiles' ? 'añadir los portátiles' : 'dejar comprar sin cargador') + ' y dar 2 años o más a las fábricas' : 'dar **3 años** justos a las fábricas y dejar que **quien compra elija** con o sin cargador'}. Si uno de los dos vota que no, **no hay ley**.`);
    }
    ctx.aviso(a !== b ? `${a ? 'El Parlamento' : 'El Consejo'} ya dice que sí, pero hace falta el sí de los dos.` : 'Ninguno de los dos vota que sí todavía. Mira qué pide cada uno.', true);
  };
  ctx.boton('Llevar a votación', votar);
  ctx.pistas([
    { texto: 'Una ley europea solo sale si votan que sí **los dos**: el Parlamento y el Consejo. Lee las peticiones de cada uno.' },
    { texto: d.f === 1 ? 'Hay que tocar dos cosas: una que pide el Parlamento y otra que pide el Consejo.' : 'Mira el tiempo: uno pide «como mucho 3» y otro «al menos 3». ¿Qué número cumple las dos cosas?' },
    { texto: d.f === 1 ? 'Las fábricas: **2 años** (o más).' : 'Venta: **con o sin, que elija quien compra**.' },
  ]);
  const resuelve = () => {
    if (d.pe.includes('portatiles')) chips.querySelector('[data-k="portatiles"]').click();
    s.plazo = d.f === 1 ? 2 : 3; pintaPlazo();
    venta.querySelector(`[data-v="${d.f === 1 && d.pe.includes('sin') ? 'sin' : 'elegir'}"]`).click();
  };
  prueba(async () => { resuelve(); await votar(); }, async () => { for (let k = 0; k < 3; k++) await votar(); });
}

// ---------------------------------------------------------------- ¿dónde?: el mapa
function mapa(d, ctx) {
  const C = CRITERIOS[d.criterio];
  ctx.reto(C.reto);
  ctx.pista(d.pista ?? 'Toca un país para marcarlo; tócalo otra vez para desmarcarlo.');
  const marcados = new Set();
  const m = mapa_(d.pines);
  const toca = (id) => {
    const b = m.botones.find((x) => x.dataset.id === id);
    if (!b || b.disabled) return;
    marcados.has(id) ? marcados.delete(id) : marcados.add(id);
    b.setAttribute('aria-pressed', String(marcados.has(id)));
    lista.querySelector(`[data-id="${id}"]`).setAttribute('aria-pressed', String(marcados.has(id)));
    m.pinta(id, marcados.has(id) ? '#fff0c2' : '');
    suena('clic');
  };
  m.botones.forEach((b) => b.addEventListener('click', () => toca(b.dataset.id)));
  m.querySelectorAll('.cg-pais').forEach((p) => { if (d.pines.includes(p.dataset.id)) { p.classList.add('tocable'); p.addEventListener('click', () => toca(p.dataset.id)); } });
  const leyenda = el('p', { class: 'cg-leyenda', hidden: true }, el('i', { style: { background: C.color } }), C.leyenda);
  const lista = el('div', { class: 'cg-lista', role: 'group', 'aria-label': 'Países' }, el('b', { text: 'Los que marcas:' }), d.pines.map((id) => el('button', { type: 'button', class: 'cg-chip', 'data-id': id, 'aria-pressed': 'false', text: pais(id).nombre, onclick: () => toca(id) })));
  ctx.escenario.append(el('div', { class: 'cg-mapa-reto' }, m, el('div', { class: 'cg-lado' }, lista, leyenda)));
  const resuelve = async () => {
    ctx.acciones.replaceChildren();
    m.botones.forEach((b) => (b.disabled = true));
    lista.querySelectorAll('button').forEach((b) => { b.disabled = true; const p = pais(b.dataset.id); b.classList.add(C.si(p) === marcados.has(p.id) ? 'bien' : 'mal'); });
    const todos = EUROPA.paises.filter((p) => C.si(p));
    leyenda.hidden = false;
    if (!lento()) for (const p of barajar(todos)) { m.pinta(p.id, C.color); await espera(25); } else todos.forEach((p) => m.pinta(p.id, C.color));
    EUROPA.paises.filter((p) => !C.si(p)).forEach((p) => m.pinta(p.id, ''));
    const malos = [];
    m.botones.forEach((b) => { const p = pais(b.dataset.id), ok = C.si(p) === marcados.has(p.id); b.classList.add(ok ? 'bien' : 'mal'); if (!ok) malos.push(p); });
    suena(malos.length ? 'mal' : 'bien');
    await espera(400);
    const claves = d.pines.map(pais).filter((p) => ['DK', 'AD', 'CH', 'GB', 'BG'].includes(p.id));
    const txt = malos.length ? `**${d.pines.length - malos.length} de ${d.pines.length}.** ` + malos.map(C.por).join(' ')
      : `**Todos bien.** ` + (claves.length ? claves.slice(0, 2).map(C.por).join(' ') : C.por(pais('ES')));
    ctx.fin(porFallos(malos.length), txt + (d.criterio === 'ley' && !malos.length ? ' Europa y la UE no son lo mismo: la ley llega a los 27, no a toda Europa.' : ''));
  };
  ctx.boton(C.boton, resuelve);
  const raros = d.pines.map(pais).filter((p) => ['DK', 'AD', 'CH', 'GB'].includes(p.id));
  ctx.pistas([
    { texto: d.criterio === 'euro' ? 'No todos los países de la UE usan el euro, y algún país que no es de la UE sí lo usa.' : 'Lo que cuenta es si el país es **de la Unión Europea**, no si está en Europa ni si usa el euro.' },
    { texto: d.criterio === 'euro' ? 'Dinamarca, Suecia y Polonia son de la UE, pero tienen su propia moneda.' : 'Son 27 países. Suiza, el Reino Unido y Andorra están en Europa, pero no en la UE.' },
    { texto: raros.length ? `${raros[0].nombre}: **${C.si(raros[0]) ? 'sí' : 'no'}**.` : 'España: **sí**.' },
  ]);
  prueba(async () => { d.pines.forEach((id) => C.si(pais(id)) && toca(id)); await resuelve(); }, async () => { d.pines.forEach((id) => !C.si(pais(id)) && toca(id)); await resuelve(); });
}

// ---------------------------------------------------------------- la tabla: UE y euro no son lo mismo
const CASILLAS = [
  { id: 'ue-euro', ue: true, euro: true, t: 'En la UE y con euro', color: AZUL_UE },
  { id: 'ue-sin', ue: true, euro: false, t: 'En la UE, sin euro', color: '#a9dcff' },
  { id: 'fuera-euro', ue: false, euro: true, t: 'Fuera de la UE, con euro', color: '#ffc531' },
  { id: 'fuera-sin', ue: false, euro: false, t: 'Fuera de la UE, sin euro', color: '#d9dbe6' },
];
const casillaDe = (p) => CASILLAS.find((c) => c.ue === p.ue && c.euro === p.euro).id;
function tabla(d, ctx) {
  ctx.reto('**Ser de la UE** y **usar el euro** no es lo mismo. Coloca cada país en su casilla.');
  ctx.pista(d.pista ?? 'Arrastra cada país a su casilla, o tócalo y luego toca la casilla. El mapa se pinta a la vez.');
  const m = mapa_(d.paises, { etiqueta: (p) => p.nombre });
  m.classList.add('cg-mapa-tabla');
  m.botones.forEach((b) => (b.tabIndex = -1));
  const sitio = {}; let cogido = null;
  const fichas = el('div', { class: 'cg-monton' }, d.paises.map((id) => {
    const f = el('button', { type: 'button', class: 'cg-ficha', 'data-id': id, text: pais(id).nombre });
    arrastra(f, { destinos: () => [...celdas.querySelectorAll('.cg-celda')], alSoltar: (c) => { pon(id, c.dataset.id); return c.querySelector('.cg-dentro'); }, alTocar: () => coge(id) });
    return f;
  }));
  const celdas = el('div', { class: 'cg-celdas' }, el('span', { class: 'cg-eje' }), el('b', { class: 'cg-eje', text: 'Con euro' }), el('b', { class: 'cg-eje', text: 'Sin euro' }),
    el('b', { class: 'cg-eje fila', text: 'En la UE' }), ...CASILLAS.slice(0, 2).map(celda), el('b', { class: 'cg-eje fila', text: 'Fuera de la UE' }), ...CASILLAS.slice(2).map(celda));
  function celda(c) { return el('button', { type: 'button', class: 'cg-celda', 'data-id': c.id, 'aria-label': c.t, style: { '--c': c.color }, onclick: () => cogido && pon(cogido, c.id) }, el('div', { class: 'cg-dentro' })); }
  function coge(id) { cogido = cogido === id ? null : id; suena('coge'); fichas.querySelectorAll('.cg-ficha').forEach((f) => f.classList.toggle('elegida', f.dataset.id === cogido)); celdas.querySelectorAll('.cg-ficha').forEach((f) => f.classList.toggle('elegida', f.dataset.id === cogido)); }
  function pon(id, cid) {
    sitio[id] = cid; cogido = null;
    const f = ctx.escenario.querySelector(`.cg-ficha[data-id="${id}"]`);
    celdas.querySelector(`[data-id="${cid}"] .cg-dentro`).append(f);
    f.classList.remove('elegida');
    m.pinta(id, CASILLAS.find((c) => c.id === cid).color);
    suena('pon');
  }
  ctx.escenario.append(el('div', { class: 'cg-tabla' }, m, el('div', { class: 'cg-lado' }, celdas, fichas)));
  const resuelve = async () => {
    if (Object.keys(sitio).length < d.paises.length) return ctx.aviso('Te falta colocar algún país.', true);
    ctx.acciones.replaceChildren();
    const malos = d.paises.filter((id) => sitio[id] !== casillaDe(pais(id))).map(pais);
    d.paises.forEach((id) => { const f = ctx.escenario.querySelector(`.cg-ficha[data-id="${id}"]`); const ok = sitio[id] === casillaDe(pais(id)); f.classList.add(ok ? 'bien' : 'mal'); f.disabled = true; if (!ok) { celdas.querySelector(`[data-id="${casillaDe(pais(id))}"] .cg-dentro`).append(f); m.pinta(id, CASILLAS.find((c) => c.id === casillaDe(pais(id))).color); } });
    suena(malos.length ? 'mal' : 'bien');
    const por = (p) => p.ue && p.euro ? `${p.nombre}: UE y euro.` : p.ue ? `${p.nombre} es de la UE, pero paga en ${MONEDA[p.id]}.` : p.euro ? `${p.nombre} no es de la UE, pero usa el euro.` : `${p.nombre} ni es de la UE ni usa el euro: paga en ${MONEDA[p.id]}.`;
    const clave = d.paises.map(pais).filter((p) => p.ue !== p.euro);
    ctx.fin(porFallos(malos.length), malos.length ? `**${d.paises.length - malos.length} de ${d.paises.length}.** ` + malos.map(por).join(' ') : `**Todos en su sitio.** ${clave.map(por).join(' ')} Las leyes europeas, como la del cargador, siguen a la UE, no al euro.`);
  };
  ctx.boton('Comprobar', resuelve);
  const ejemplo = d.paises.map(pais).find((p) => p.ue && !p.euro);
  ctx.pistas([
    { texto: 'Dos preguntas para cada país: ¿es de la Unión Europea? ¿Se paga en euros? Las dos respuestas pueden ser distintas.' },
    { texto: 'Andorra usa el euro sin ser de la UE. Dinamarca, Suecia, Polonia, Chequia, Hungría y Rumanía son de la UE, pero tienen su moneda.' },
    { texto: ejemplo ? `${ejemplo.nombre}: **en la UE, sin euro**.` : 'Andorra: **fuera de la UE, con euro**.' },
  ]);
  prueba(async () => { d.paises.forEach((id) => pon(id, casillaDe(pais(id)))); await resuelve(); },
    async () => { d.paises.forEach((id) => { const ok = casillaDe(pais(id)); pon(id, CASILLAS.find((c) => c.id !== ok && (c.ue !== pais(id).ue)).id); }); await resuelve(); });
}
