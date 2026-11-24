// Motor «constitucion»: Sociales, tema 2 («El cajón vota»). La Constitución del cajón.
// En el cajón viven 15 objetos. Tienen una Constitución de cinco artículos y una asamblea que vota normas.
// Modos (cada uno es una mecánica):
//   tribunal  → la asamblea aprueba una norma por mayoría; tú eres el Tribunal: ¿aguanta o choca con la Constitución?
//   queja     → alguien se queja de algo que ha pasado en el cajón: ¿quién se ha saltado la Constitución, y cuál?
//   construye → hay un problema; montas una norma con piezas y se prueba: ¿lo arregla? ¿aguanta en el Tribunal?
//               Si las dos cosas, va a referéndum.
//   reforma   → la asamblea vota varias propuestas: una norma sale con más síes que noes; un cambio de la
//               Constitución necesita 3 de cada 5. Y una norma que quita derechos no sale aunque la vote casi todo el mundo.
// Con ?prueba en la dirección, window.__sol() y window.__mal() juegan el reto actual (para las pruebas automáticas).
import { el, elige, barajar, azar, suena } from './nucleo.js';
import { gsap } from './vendor/gsap.js';
import { espera, bote, temblor, chispasEn } from './efectos.js';
import { dibuja } from './personaje.js';

const lento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const T = '#1b1e3a';
const N = 15; // objetos en el cajón
const PRUEBA = new URLSearchParams(location.search).has('prueba');
const may = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const sinMarcas = (t) => t.replace(/\*\*/g, '');
const prueba = (bien, mal) => { if (PRUEBA) { window.__sol = bien; window.__mal = mal; } };

/* =========================================================================== el mundo */

// La Constitución del cajón: cinco artículos, cada uno con su pariente en la Constitución española de 1978.
export const ARTICULOS = [
  { id: 'igualdad', n: 1, titulo: 'Igualdad', texto: 'Todos los objetos del cajón son iguales. Ninguno vale más por su tamaño, su color o su forma.', ce: 14 },
  { id: 'expresion', n: 2, titulo: 'Libertad de expresión', texto: 'Todos pueden decir lo que piensan, también para criticar.', ce: 20 },
  { id: 'educacion', n: 3, titulo: 'Educación', texto: 'Todos tienen derecho a salir a clase y aprender.', ce: 27 },
  { id: 'voto', n: 4, titulo: 'Voto', texto: 'Todos pueden votar en la asamblea del cajón.', ce: 23 },
  { id: 'cumplir', n: 5, titulo: 'Todos cumplen', texto: 'Las normas son para todos: también para el que manda.', ce: 9 },
];
const art = (id) => ARTICULOS.find((a) => a.id === id);

// los vecinos del cajón
const GRUPOS = {
  clips: { los: 'los clips', icono: 'clip' },
  rotuladores: { los: 'los rotuladores', icono: 'rotulador' },
  lapices: { los: 'los lápices', icono: 'lapiz' },
  chinchetas: { los: 'las chinchetas', icono: 'chincheta' },
  ceras: { los: 'las ceras', icono: 'cera' },
  sacapuntas: { los: 'los sacapuntas', icono: 'sacapuntas' },
};
const COLORES = ['#e8417a', '#2f5bd3', '#9bd84a', '#ff8a1f', '#5ec3ff', '#cda8ff'];
const ojos = (y, x = 30) => `<circle cx="${x - 6}" cy="${y}" r="3.2" fill="${T}"/><circle cx="${x + 6}" cy="${y}" r="3.2" fill="${T}"/><circle cx="${x - 5}" cy="${y - 1}" r="1" fill="#fff"/><circle cx="${x + 7}" cy="${y - 1}" r="1" fill="#fff"/>`;
const DIBUJOS = {
  lapiz: () => `<path d="M20 60 L30 77 L40 60Z" fill="#f3d2a2" stroke="${T}" stroke-width="3" stroke-linejoin="round"/><path d="M26.5 71 L30 77 L33.5 71Z" fill="${T}"/><rect x="20" y="16" width="20" height="45" fill="#ffc531" stroke="${T}" stroke-width="3"/><path d="M26.5 16 V61 M33.5 16 V61" stroke="#c98f00" stroke-width="2"/><rect x="19" y="10" width="22" height="8" fill="#c9cfdd" stroke="${T}" stroke-width="3"/><rect x="20" y="2" width="20" height="9" rx="4" fill="#ff9fbf" stroke="${T}" stroke-width="3"/>${ojos(32)}`,
  rotulador: (c) => `<rect x="18" y="22" width="24" height="52" rx="7" fill="#fffdf6" stroke="${T}" stroke-width="3"/><rect x="18" y="60" width="24" height="7" fill="${c}" stroke="${T}" stroke-width="2.5"/><rect x="16" y="4" width="28" height="22" rx="7" fill="${c}" stroke="${T}" stroke-width="3"/><rect x="40" y="8" width="5" height="16" rx="2" fill="${c}" stroke="${T}" stroke-width="2.5"/>${ojos(40)}`,
  clip: () => `<path d="M24 72 V22 a10 10 0 0 1 20 0 V64 a6.5 6.5 0 0 1 -13 0 V28" fill="none" stroke="${T}" stroke-width="10" stroke-linecap="round"/><path d="M24 72 V22 a10 10 0 0 1 20 0 V64 a6.5 6.5 0 0 1 -13 0 V28" fill="none" stroke="#c9cfdd" stroke-width="4.5" stroke-linecap="round"/>${ojos(36, 34)}`,
  chincheta: () => `<path d="M30 50 V77" stroke="${T}" stroke-width="4" stroke-linecap="round"/><path d="M30 50 V74" stroke="#c9cfdd" stroke-width="1.6"/><rect x="21" y="40" width="18" height="12" rx="3" fill="#d7263d" stroke="${T}" stroke-width="3"/><circle cx="30" cy="26" r="19" fill="#ff5a6e" stroke="${T}" stroke-width="3"/><circle cx="23" cy="18" r="4.5" fill="#fff" opacity=".55"/>${ojos(28)}`,
  cera: (c) => `<path d="M19 22 L30 4 L41 22Z" fill="${c}" stroke="${T}" stroke-width="3" stroke-linejoin="round"/><rect x="19" y="21" width="22" height="55" rx="3" fill="${c}" stroke="${T}" stroke-width="3"/><rect x="19" y="38" width="22" height="26" fill="#fffdf6" stroke="${T}" stroke-width="2.5"/><path d="M19 43 H41 M19 59 H41" stroke="${c}" stroke-width="2.5"/>${ojos(30)}`,
  sacapuntas: () => `<rect x="8" y="28" width="44" height="44" rx="6" fill="#2f5bd3" stroke="${T}" stroke-width="3"/><path d="M14 34 H46" stroke="#5ec3ff" stroke-width="3" stroke-linecap="round"/><circle cx="30" cy="44" r="8" fill="${T}"/><path d="M38 38 L50 30" stroke="#c9cfdd" stroke-width="4" stroke-linecap="round"/>${ojos(60).replace(/fill="#1b1e3a"/g, 'fill="#fffdf6"')}`,
};
const objeto = (k, c = elige(COLORES), extra = '') => `<svg viewBox="0 0 60 80" aria-hidden="true">${DIBUJOS[k](c)}${extra}</svg>`;

// personajes de las quejas: los tres ayudantes (con su dibujo) y algunos vecinos del cajón
const QUIENES = {
  goma: { nombre: 'Goma', sprite: 'goma' },
  boli: { nombre: 'Boli', sprite: 'boli' },
  fosforito: { nombre: 'Fosforito', sprite: 'fosforito' },
  clip: { nombre: 'el Clip', icono: 'clip' },
  chincheta: { nombre: 'la Chincheta', icono: 'chincheta' },
  sacapuntas: { nombre: 'el Sacapuntas', icono: 'sacapuntas' },
  cera: { nombre: 'la Cera', icono: 'cera', color: '#ff8a1f' },
};

/* =========================================================================== bancos */

// Normas que vota la asamblea. vale: los artículos con los que choca ([] = aguanta). quien: 'grupo' | 'todos' | 'jefe'.
// por: lo que hace la norma, con sus datos; efecto: lo que se vería en el cajón si nadie la parase.
const NORMAS = [
  { f: 1, quien: 'grupo', vale: ['expresion'], t: '{G} no pueden hablar en la asamblea.', por: 'deja a {g} sin poder decir lo que piensan', efecto: 'celo' },
  { f: 1, quien: 'grupo', vale: ['voto'], t: '{G} ya no votan en la asamblea.', por: 'deja a {g} sin voto', efecto: 'voto' },
  { f: 1, quien: 'grupo', vale: ['educacion'], t: '{G} ya no salen a clase: se quedan en el fondo del cajón.', por: 'deja a {g} sin clase', efecto: 'fondo' },
  { f: 1, quien: 'grupo', vale: ['igualdad'], t: '{G} recogen el cajón todos los días. Los demás, nunca.', por: 'carga a {g} con el trabajo de todos solo por ser lo que son', efecto: 'fondo' },
  { f: 2, quien: 'grupo', vale: ['expresion'], t: '{G} no pueden quejarse de nada.', por: 'prohíbe a {g} criticar', efecto: 'celo' },
  { f: 2, quien: 'grupo', vale: ['igualdad'], t: '{G} se ponen siempre al fondo, donde no llega la luz.', por: 'trata peor a {g} solo por ser lo que son', efecto: 'fondo' },
  { f: 3, quien: 'todos', vale: ['expresion'], t: 'Nadie puede criticar una norma después de votarla.', por: 'deja a todo el cajón sin poder criticar las normas', efecto: 'celo' },
  { f: 3, quien: 'jefe', vale: ['cumplir'], t: 'El jefe del cajón no tiene que cumplir las normas.', por: 'pone al que manda por encima de las normas' },
  { f: 3, quien: 'todos', vale: ['voto'], t: 'Se acabaron las votaciones: a partir de ahora decide siempre el jefe.', por: 'quita el voto a todo el cajón' },
  { f: 3, quien: 'grupo', vale: ['igualdad', 'voto'], t: 'Los objetos grandes votan dos veces; {g}, solo una.', por: 'hace que el voto de {g} valga menos que el de los demás', efecto: 'voto' },
];
const BUENAS = [
  { f: 1, t: 'Todos recogen su sitio antes de cerrar el cajón.', por: 'Es un **deber** igual para todos. No le quita a nadie ningún derecho.' },
  { f: 1, t: 'Nadie puede pinchar ni pintar a otro objeto sin permiso.', por: 'Prohíbe algo, sí: hacer daño a otro. Eso **protege** a todos.' },
  { f: 2, t: 'En la asamblea se habla por turnos: hay que levantar la mano.', por: 'Todos siguen pudiendo hablar: solo se ordena **cómo**. Ordenar un derecho no es quitarlo.' },
  { f: 2, t: 'Cada objeto vota una sola vez.', por: 'Así **todos los votos valen igual**. No le quita el voto a nadie.' },
  { f: 2, t: 'Quien rompa algo de otro, lo arregla o lo cambia.', por: 'Es un **deber** para todos, y protege lo de cada uno.' },
  { f: 3, t: 'Los rotuladores se ponen el tapón al acabar, para no secarse.', por: 'Solo habla de los rotuladores, pero **porque son los únicos que tienen tapón**. No los trata peor por ser lo que son.' },
  { f: 3, t: 'El jefe del cajón también tiene que recoger su sitio.', por: 'Al revés: recuerda que **el que manda también cumple**. Eso es justo lo que dice el artículo 5.' },
  { f: 3, t: 'Quien no esté de acuerdo con una norma puede decirlo en la asamblea, pero la cumple mientras no se cambie.', por: 'Se puede **criticar** una norma (artículo 2) y hay que **cumplirla** (artículo 5). Las dos cosas a la vez.' },
];

// Quejas: lo que ha pasado. culpa: 'A' | 'B' | null (nadie). vale: artículos que se ha saltado.
const QUEJAS = [
  { f: 1, culpa: 'A', vale: ['cumplir'], t: 'A {A} le toca mandar en el cajón esta semana. Hoy no ha recogido su sitio: «Yo mando, así que esa norma no va conmigo».', por: '{A} se ha saltado el artículo 5: **las normas son también para el que manda**.' },
  { f: 1, culpa: 'A', vale: ['expresion'], t: 'En la asamblea, {B} dice que la norma de los turnos no le gusta. {A} le grita: «¡Cállate! Eso aquí no se dice».', por: '{B} tiene derecho a criticar una norma. Quien se ha saltado la Constitución es {A}, al **mandarle callar**.' },
  { f: 1, culpa: 'A', vale: ['educacion'], t: '{A} no deja que {B} salga a clase: «Tú te quedas en el cajón, que eres nuevo».', por: 'Todos tienen derecho a salir a clase. {A} le está **quitando la educación** a {B}.' },
  { f: 1, culpa: null, vale: [], t: '{A} perdió la votación de la norma de recoger. Refunfuña, pero recoge su sitio igual.', por: 'Nadie se ha saltado nada: {A} **cumple** la norma aunque no le guste. Y refunfuñar no está prohibido.' },
  { f: 2, culpa: 'A', vale: ['cumplir'], t: '{A} votó que no a la norma de recoger. Perdió. Ahora dice: «Yo voté que no, así que yo no recojo».', por: 'Una norma votada es para todos, **también para quien votó que no**. {A} se la está saltando.' },
  { f: 2, culpa: 'A', vale: ['voto'], t: '{A} esconde la papeleta de {B} antes de la votación: «Total, siempre votas lo contrario que yo».', por: 'Votar es derecho de todos, votes lo que votes. {A} le está **quitando el voto** a {B}.' },
  { f: 2, culpa: 'A', vale: ['igualdad'], t: '{A} reparte los huecos del cajón. Los mejores, para los de su color. A {B}, que es de otro color, le toca el rincón.', por: 'Nadie vale más por su color. {A} está tratando peor a {B} **por cómo es**: igualdad.' },
  { f: 2, culpa: null, vale: [], t: 'Hoy hay votación, pero {B} no ha votado: no le apetecía.', por: 'Nadie se ha saltado nada. **Votar es un derecho**, no una obligación: {B} puede no votar.' },
  { f: 3, culpa: null, vale: [], t: 'En la asamblea, {A} le pide a {B} que espere su turno, porque está hablando otro.', por: 'Nadie se ha saltado nada: {B} va a poder hablar. **Esperar el turno no es quedarse sin hablar.**' },
  { f: 3, culpa: 'B', vale: ['cumplir'], t: '{A} le recuerda a {B}, que hoy manda, que también tiene que devolver la regla antes del recreo. {B} contesta: «Para eso mando».', por: 'Quien se la salta es {B}: **mandar no te pone por encima de las normas**. {A} solo le recuerda lo que dice la Constitución.' },
  { f: 3, culpa: 'B', vale: ['expresion'], t: '{A} cuelga en el corcho un cartel: «La norma del celo es injusta». {B} lo arranca: «Aquí no se critica lo que se ha votado».', por: 'Criticar una norma votada **se puede**: es libertad de expresión. Quien se la salta es {B}, al arrancar el cartel.' },
  { f: 3, culpa: null, vale: [], t: '{A} ha roto la regla de {B}. Como dice la norma, se la cambia por una nueva.', por: 'Nadie se ha saltado nada: {A} está **cumpliendo un deber**. Romper algo sin querer no es saltarse la Constitución; no arreglarlo, sí sería saltarse la norma.' },
];

// Problemas para «construye». Cada acción: con qué verbo arregla el problema y con qué artículo choca.
const PROBLEMAS = [
  { id: 'ruido', t: 'En la asamblea hablan todos a la vez y **no se entiende nada**.', acciones: [
    { a: 'hablar por turnos', con: 'tienen que', arregla: true, efecto: 'Uno habla, los demás esperan. Se entiende todo.' },
    { a: 'levantar la mano antes de hablar', con: 'tienen que', arregla: true, efecto: 'Manos arriba, de una en una. Ya se oye.' },
    { a: 'hablar en la asamblea', con: 'no pueden', arregla: true, choca: 'expresion', efecto: 'Silencio total… pero ya nadie puede decir lo que piensa.' },
    { a: 'quejarse de las normas', con: 'no pueden', arregla: false, choca: 'expresion', efecto: 'Siguen hablando todos a la vez. Eso sí, sin quejarse.' },
  ] },
  { id: 'desorden', t: 'Al cerrar el cajón siempre quedan cosas tiradas por la mesa y **se pierden**.', acciones: [
    { a: 'recoger su sitio antes de cerrar', con: 'tienen que', arregla: true, efecto: 'Cada uno a su hueco. Ni un objeto perdido.' },
    { a: 'volver a su hueco al acabar la clase', con: 'tienen que', arregla: true, efecto: 'Al sonar el timbre, todos dentro. El cajón cierra.' },
    { a: 'salir a clase', con: 'no pueden', arregla: true, choca: 'educacion', efecto: 'Nadie se pierde… porque nadie sale. Y nadie aprende nada.' },
    { a: 'quejarse del desorden', con: 'no pueden', arregla: false, choca: 'expresion', efecto: 'Las cosas siguen tiradas. Solo que ahora nadie lo dice.' },
  ] },
  { id: 'votos', t: 'En las votaciones hay quien **mete dos papeletas** y quien se queda sin votar.', acciones: [
    { a: 'votar más de una vez', con: 'no pueden', arregla: true, efecto: 'Una papeleta por objeto. Cada voto vale lo mismo.' },
    { a: 'meter su papeleta delante de la mesa', con: 'tienen que', arregla: true, efecto: 'La mesa ve quién vota y cuántas veces. Se acabaron las trampas.' },
    { a: 'votar', con: 'no pueden', arregla: true, choca: 'voto', efecto: 'Ya nadie hace trampas… porque ya nadie vota.' },
    { a: 'quejarse del recuento', con: 'no pueden', arregla: false, choca: 'expresion', efecto: 'Las trampas siguen. Y quien las ve no puede decirlo.' },
  ] },
  { id: 'nuevos', t: 'Han llegado objetos nuevos al cajón y **no saben dónde va cada cosa**.', acciones: [
    { a: 'enseñarles el cajón a los nuevos', con: 'tienen que', arregla: true, efecto: 'Una vuelta por el cajón y los nuevos ya saben dónde va todo.' },
    { a: 'dejar un mapa del cajón en la tapa', con: 'tienen que', arregla: true, efecto: 'Con el mapa, los nuevos encuentran su hueco a la primera.' },
    { a: 'salir del cajón', con: 'no pueden', arregla: true, choca: 'educacion', efecto: 'Los nuevos no se pierden… porque no salen ni a clase.' },
    { a: 'preguntar dónde van las cosas', con: 'no pueden', arregla: false, choca: 'expresion', efecto: 'Los nuevos siguen perdidos, y encima callados.' },
  ] },
];

// Propuestas para «reforma»
const NORMAS_SIMPLES = ['Los viernes se ordena el cajón entre todos.', 'El celo se guarda en el hueco de la izquierda.', 'Las asambleas son los lunes, antes de la primera clase.', 'Quien coja la regla la devuelve antes del recreo.', 'Los restos del sacapuntas se tiran a la papelera, no al cajón.', 'Las ceras van juntas, ordenadas por colores.'];
const CAMBIOS = ['Añadir a la Constitución: todos tienen derecho a un hueco propio en el cajón.', 'Añadir a la Constitución: todos tienen el deber de devolver lo que les prestan.', 'Cambiar la Constitución para que el jefe del cajón cambie cada semana.', 'Añadir a la Constitución: nadie puede ser expulsado del cajón.'];

/* =========================================================================== generar */
export function generar(spec) {
  const d = structuredClone(spec);
  const g = typeof d.generar === 'object' ? d.generar : {};
  delete d.generar;
  d.f = g.f ?? 1;
  if (d.modo === 'tribunal') {
    d.asamblea = asamblea();
    const malas = NORMAS.filter((n) => n.f <= d.f && n.f >= (g.min ?? 1));
    const buenas = BUENAS.filter((n) => n.f <= d.f && n.f >= (g.min ?? 1));
    const mala = Math.random() < (g.malas ?? 0.6);
    const n = structuredClone(elige(mala ? malas : buenas));
    d.norma = { ...n, vale: n.vale ?? [] };
    d.norma.texto = rellena(n.t, d.asamblea.blanco);
    d.norma.motivo = n.por && n.vale ? rellena(n.por, d.asamblea.blanco) : n.por;
    d.votos = votacion(d.asamblea, d.norma);
  } else if (d.modo === 'queja') {
    const pool = QUEJAS.filter((q) => q.f <= d.f && q.f >= (g.min ?? 1));
    d.queja = structuredClone(elige(pool));
    const [A, B] = barajar(Object.keys(QUIENES)).slice(0, 2);
    d.A = A; d.B = B;
  } else if (d.modo === 'construye') {
    d.problema = structuredClone(elige(g.problemas ? PROBLEMAS.filter((p) => g.problemas.includes(p.id)) : PROBLEMAS));
    d.grupo = elige(Object.keys(GRUPOS));
    d.problema.acciones = barajar(d.problema.acciones);
  } else if (d.modo === 'reforma') {
    const props = [];
    const ley = barajar(NORMAS_SIMPLES), cam = barajar(CAMBIOS);
    // siempre: un cambio de la Constitución con mayoría simple pero sin los 3/5 (la trampa)
    props.push({ tipo: 'constitucion', t: cam[0], si: 8 });
    props.push({ tipo: 'norma', t: ley[0], si: elige([8, 9, 10]) });
    if (g.trampa) {
      const m = elige(NORMAS.filter((n) => n.quien === 'grupo' && n.f <= 2));
      props.push({ tipo: 'norma', t: rellena(m.t, elige(Object.keys(GRUPOS))), si: azar(12, 14), quita: m.vale[0] });
    } else props.push(elige([{ tipo: 'constitucion', t: cam[1], si: azar(9, 12) }, { tipo: 'norma', t: ley[1], si: azar(5, 7) }, { tipo: 'constitucion', t: cam[1], si: azar(6, 7) }]));
    d.props = barajar(props).map((p) => ({ ...p, sale: !p.quita && (p.tipo === 'norma' ? p.si > N - p.si : p.si * 5 >= N * 3) }));
  }
  return d;
}
function asamblea() {
  const ids = barajar(Object.keys(GRUPOS)).slice(0, 3);
  const blanco = ids[0];
  const nb = azar(2, 4), n2 = azar(4, 7), n3 = N - nb - n2;
  const lista = [];
  [[ids[0], nb], [ids[1], n2], [ids[2], n3]].forEach(([k, n]) => { for (let i = 0; i < n; i++) lista.push({ g: k, c: COLORES[(i + lista.length) % COLORES.length] }); });
  return { blanco, cuantos: nb, objetos: barajar(lista) };
}
function votacion(A, norma) {
  // los afectados votan que no; de los demás, casi todos que sí (alguno, por solidaridad, que no)
  return A.objetos.map((o) => {
    if (norma.quien === 'grupo' && o.g === A.blanco && norma.vale.length) return 'no';
    return Math.random() < (norma.vale.length ? 0.14 : 0.2) ? 'no' : 'si';
  });
}
function rellena(t, g) {
  const los = GRUPOS[g]?.los ?? g;
  return t.replace(/\{G\}/g, may(los)).replace(/\{g\}/g, los);
}
const nombreQ = (k) => QUIENES[k].nombre;
const rellenaQ = (t, d) => t.replace(/\{A\}/g, nombreQ(d.A)).replace(/\{B\}/g, nombreQ(d.B))
  .replace(/\b([Aa]) el ([A-Z])/g, '$1l $2').replace(/\bde el ([A-Z])/g, 'del $1')
  .replace(/(^|[.!?»]\s+|«)(el|la) /g, (m, p, a) => p + may(a) + ' ');

export function ronda(d, ctx) {
  const m = { tribunal, queja, construye, reforma }[d.modo];
  if (!m) throw new Error(`no encuentro el modo «${d.modo}». Si el juego se acaba de actualizar, recarga la página.`);
  return m(d, ctx);
}

/* =========================================================================== piezas */

function hojaConstitucion({ elegible, alElegir, conNinguno = true, compacta = false }) {
  const lista = el('ol', { class: 'cn-articulos' }, ARTICULOS.map((a) => el('li', {},
    el('button', { type: 'button', class: 'cn-art', 'data-id': a.id, 'aria-pressed': 'false', disabled: !elegible, onclick: () => alElegir?.(a.id) },
      el('b', { text: `Artículo ${a.n}. ${a.titulo}` }), !compacta && el('span', { text: a.texto })))));
  const ninguno = conNinguno && el('button', { type: 'button', class: 'cn-art cn-ninguno', 'data-id': 'ninguno', 'aria-pressed': 'false', disabled: !elegible, onclick: () => alElegir?.('ninguno') }, el('b', { text: 'No choca con ninguno' }));
  const hoja = el('section', { class: 'cn-constitucion' + (compacta ? ' compacta' : '') + (elegible ? '' : ' lectura'), 'aria-label': 'La Constitución del cajón' },
    el('h3', {}, el('span', { text: 'Constitución del cajón' })), lista, ninguno);
  hoja.marca = (id) => hoja.querySelectorAll('.cn-art').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
  hoja.resalta = (ids, cls = 'bien') => hoja.querySelectorAll('.cn-art').forEach((b) => b.classList.toggle(cls, ids.includes(b.dataset.id)));
  return hoja;
}
function sello(texto, bien) {
  return el('span', { class: 'cn-sello ' + (bien ? 'verde' : 'rojo'), 'aria-hidden': 'true', text: texto });
}
async function estampa(donde, texto, bien) {
  const s = sello(texto, bien);
  donde.append(s);
  suena('sello');
  if (!lento()) await gsap.from(s, { scale: 2.6, opacity: 0, rotation: bien ? -30 : 24, duration: 0.35, ease: 'power3.in' }).then();
  bote(donde, 4);
}
function cara(k, cls = '') {
  const q = QUIENES[k];
  if (q.sprite) return el('span', { class: 'cn-cara sprite-caja ' + cls, html: dibuja(q.sprite, 'quieto') });
  return el('span', { class: 'cn-cara ' + cls, html: objeto(q.icono, q.color ?? '#e8417a') });
}
const puntos = (si, total = N) => el('span', { class: 'cn-puntos', 'aria-hidden': 'true' }, Array.from({ length: total }, (_, i) => el('i', { class: i < si ? 'si' : 'no' })));

/* =========================================================================== modos */

// ---------------------------------------------------------------- el Tribunal del cajón
function tribunal(d, ctx) {
  const A = d.asamblea, n = d.norma;
  const si = d.votos.filter((v) => v === 'si').length, no = N - si;
  const choca = n.vale.length > 0;
  const conArticulo = d.f >= 2;
  const art0 = art(n.vale[0]);
  ctx.reto(conArticulo ? 'La asamblea ha aprobado esta norma. Eres el **Tribunal**: ¿choca con algún artículo de la Constitución?' : 'La asamblea ha aprobado esta norma. Eres el **Tribunal**: ¿la dejas o la tumbas?');
  ctx.pista(d.pista ?? (conArticulo ? 'Toca el artículo con el que choca, o «No choca con ninguno».' : 'Una norma no puede quitarle a nadie lo que la Constitución le asegura.'));
  const propuesta = el('div', { class: 'cn-propuesta' }, el('small', { text: 'Norma aprobada' }), el('p', { text: n.texto }));
  const objetos = el('ul', { class: 'cn-asamblea', 'aria-label': `Votación: ${si} sí y ${no} no` }, A.objetos.map((o, i) =>
    el('li', { class: 'cn-vecino' + (o.g === A.blanco && n.quien === 'grupo' ? ' blanco' : ''), 'data-g': o.g }, el('span', { class: 'cn-obj', html: objeto(GRUPOS[o.g].icono, o.c) }), el('i', { class: 'cn-voto ' + d.votos[i], 'aria-hidden': 'true' }))));
  const recuento = el('p', { class: 'cn-recuento' }, el('span', { class: 'si', text: `Sí ${si}` }), el('span', { class: 'no', text: `No ${no}` }), el('b', { text: 'Aprobada por mayoría' }));
  let eleccion = null;
  const hoja = hojaConstitucion({ elegible: conArticulo, conNinguno: conArticulo, alElegir: (id) => { eleccion = id; hoja.marca(id); suena('clic'); } });
  ctx.escenario.append(el('div', { class: 'cn-tribunal' }, el('div', { class: 'cn-lado' }, propuesta, objetos, recuento), hoja));
  if (!lento()) gsap.from(objetos.querySelectorAll('.cn-voto'), { scale: 0, duration: 0.3, ease: 'back.out(3)', stagger: 0.04, delay: 0.2 });

  const resuelve = async (dice) => {
    // dice: 'deja' | 'tumba' | id de artículo | 'ninguno'
    const tumba = dice !== 'deja' && dice !== 'ninguno';
    const okDecision = tumba === choca;
    const okArt = !conArticulo || !choca || n.vale.includes(dice);
    ctx.acciones.replaceChildren();
    hoja.querySelectorAll('.cn-art').forEach((b) => (b.disabled = true));
    if (choca) hoja.resalta(n.vale);
    await estampa(propuesta, choca ? 'ANULADA' : 'VÁLIDA', !choca);
    if (choca && n.efecto && !okDecision) aplicaEfecto(objetos, n, A);
    const votada = `La votaron **${si} de ${N}**`;
    let estrellas, txt;
    if (okDecision && okArt) {
      estrellas = 3;
      txt = choca
        ? `Anulada. ${votada}, pero ${n.motivo}. Choca con el artículo ${art0.n} (${art0.titulo.toLowerCase()}). La mayoría decide muchas cosas, pero no puede quitar derechos.`
        : `Válida. ${n.por}`;
    } else if (okDecision) {
      estrellas = 2;
      const eleg = art(dice);
      txt = `Bien tumbada, pero no por el artículo ${eleg.n}: ${n.motivo}. Eso choca con el **artículo ${art0.n} (${art0.titulo.toLowerCase()})**.`;
    } else if (choca) {
      estrellas = 0;
      txt = `Había que tumbarla: ${n.motivo}. ${votada}, pero eso no la salva: **la Constitución está por encima de cualquier norma**, la vote quien la vote.`;
    } else {
      estrellas = 0;
      txt = `Esta norma aguanta. ${n.por}`;
    }
    if (choca && estrellas === 3 && art0.ce) txt += ` En la Constitución española está en el artículo ${art0.ce}.`;
    ctx.fin(estrellas, txt);
  };
  if (conArticulo) ctx.boton('Dictar sentencia', () => { if (!eleccion) return ctx.aviso('Toca un artículo, o «No choca con ninguno».', true); resuelve(eleccion); });
  else {
    ctx.boton('La dejo', () => resuelve('deja'), true).classList.add('cn-deja');
    ctx.boton('La tumbo', () => resuelve('tumba'));
  }
  const g = GRUPOS[A.blanco].los;
  ctx.pistas([
    { texto: '¿A quién le quita algo esta norma, y qué le quita? Si solo ordena cómo se hacen las cosas, no le quita nada a nadie.' },
    { texto: choca && n.quien === 'grupo' ? `Que la vote la mayoría no basta. Mira cómo han votado **${g}**: ¿qué les pasa con esta norma?` : 'Que la vote la mayoría no basta: una norma no puede quitar a nadie lo que asegura la Constitución. Pero obligar a todos a algo no es quitar un derecho.' },
    { texto: choca ? `Fíjate en el artículo ${art0.n}: **${art0.titulo.toLowerCase()}**.` : 'Esta norma **no le quita nada a nadie**.' },
  ]);
  prueba(() => resuelve(conArticulo ? (choca ? n.vale[0] : 'ninguno') : choca ? 'tumba' : 'deja'), () => resuelve(conArticulo ? (choca ? 'ninguno' : 'igualdad') : choca ? 'deja' : 'tumba'));
}
function aplicaEfecto(lista, n, A) {
  const nodos = [...lista.querySelectorAll('.cn-vecino')].filter((li) => n.quien !== 'grupo' || li.dataset.g === A.blanco);
  nodos.forEach((li) => li.classList.add('afectado', 'ef-' + (n.efecto ?? 'fondo')));
  if (!lento()) gsap.from(nodos, { y: -10, duration: 0.4, ease: 'bounce.out', stagger: 0.05 });
}

// ---------------------------------------------------------------- quejas
function queja(d, ctx) {
  const q = d.queja;
  const conArticulo = d.f >= 2;
  ctx.reto(conArticulo ? 'Ha llegado una queja al Tribunal. **¿Quién se ha saltado la Constitución?** ¿Qué artículo?' : 'Ha llegado una queja al Tribunal. **¿Quién se ha saltado la Constitución?**');
  ctx.pista(d.pista ?? 'Toca a quien se la ha saltado. Puede que nadie.');
  let quien = null, articulo = null;
  const opcion = (k, letra) => el('button', { type: 'button', class: 'cn-quien', 'data-q': letra, 'aria-pressed': 'false', onclick: () => elige_(letra) }, cara(k), el('b', { text: may(nombreQ(k)) }));
  const nadie = el('button', { type: 'button', class: 'cn-quien cn-nadie', 'data-q': 'nadie', 'aria-pressed': 'false', onclick: () => elige_('nadie') }, el('span', { class: 'cn-cara cn-balanza', html: balanza() }), el('b', { text: 'Nadie' }));
  const caso = el('div', { class: 'cn-caso' }, el('small', { text: 'Queja n.º ' + azar(12, 98) }), el('p', { text: rellenaQ(q.t, d) }));
  const quienes = el('div', { class: 'cn-quienes', role: 'group', 'aria-label': '¿Quién se la ha saltado?' }, opcion(d.A, 'A'), opcion(d.B, 'B'), nadie);
  const hoja = conArticulo ? hojaConstitucion({ elegible: true, conNinguno: false, alElegir: (id) => { articulo = id; hoja.marca(id); suena('clic'); } }) : null;
  ctx.escenario.append(el('div', { class: 'cn-queja' + (conArticulo ? ' con-hoja' : '') }, el('div', { class: 'cn-lado' }, caso, quienes), hoja));
  function elige_(l) {
    quien = l; suena('clic');
    quienes.querySelectorAll('.cn-quien').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.q === l)));
    if (hoja) hoja.classList.toggle('apagada', l === 'nadie');
  }
  const resuelve = async (l, a) => {
    const culpa = q.culpa ?? 'nadie';
    const okQ = l === culpa;
    const okA = !conArticulo || culpa === 'nadie' || q.vale.includes(a);
    ctx.acciones.replaceChildren();
    quienes.querySelectorAll('.cn-quien').forEach((b) => { b.disabled = true; if (b.dataset.q === culpa) b.classList.add('bien'); else if (b.dataset.q === l) b.classList.add('mal'); });
    hoja?.querySelectorAll('.cn-art').forEach((b) => (b.disabled = true));
    if (hoja && q.vale.length) hoja.resalta(q.vale);
    await estampa(caso, culpa === 'nadie' ? 'SIN FALTA' : 'CON FALTA', culpa === 'nadie');
    const por = rellenaQ(q.por, d);
    if (okQ && okA) return ctx.fin(3, por);
    if (okQ) return ctx.fin(2, `Bien visto quién, pero el artículo no es ese. ${por}`);
    if (l === 'nadie') return ctx.fin(0, `Sí hay falta. ${por}`);
    if (culpa === 'nadie') return ctx.fin(0, `${may(nombreQ(l === 'A' ? d.A : d.B))} no se ha saltado nada. ${por}`);
    ctx.fin(0, `Te has equivocado de culpable. ${por}`);
  };
  ctx.boton('Dictar sentencia', () => {
    if (!quien) return ctx.aviso('Toca a quien se la ha saltado, o «Nadie».', true);
    if (conArticulo && quien !== 'nadie' && !articulo) return ctx.aviso('Elige también el artículo que se ha saltado.', true);
    resuelve(quien, articulo);
  });
  const culpable = q.culpa ? may(nombreQ(q.culpa === 'A' ? d.A : d.B)) : null;
  ctx.pistas([
    { texto: 'Separa dos cosas: lo que **no te gusta** y lo que **no está permitido**. Criticar, refunfuñar o no votar están permitidos.' },
    { texto: 'Repasa: ¿alguien ha dejado a otro sin hablar, sin votar, sin clase o lo ha tratado peor? ¿Alguien se cree por encima de las normas?' },
    { texto: culpable ? `Mira lo que hace **${culpable}**.` : 'Lee otra vez: puede que **nadie** se haya saltado nada.' },
  ]);
  prueba(() => resuelve(q.culpa ?? 'nadie', q.vale[0]), () => resuelve(q.culpa ? 'nadie' : 'A', 'voto'));
}
const balanza = () => `<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M30 8 V50 M16 52 H44" stroke="${T}" stroke-width="4" stroke-linecap="round"/><path d="M10 16 H50" stroke="${T}" stroke-width="4" stroke-linecap="round"/><path d="M10 16 L4 32 H16Z M50 16 L44 32 H56Z" fill="#ffc531" stroke="${T}" stroke-width="3" stroke-linejoin="round"/><circle cx="30" cy="8" r="4" fill="#ffc531" stroke="${T}" stroke-width="3"/></svg>`;

// ---------------------------------------------------------------- monta una norma
function construye(d, ctx) {
  const P = d.problema;
  const grupo = GRUPOS[d.grupo].los;
  ctx.reto(`${P.t} **Monta una norma que lo arregle** y que aguante en el Tribunal.`);
  ctx.pista(d.pista ?? 'Elige una pieza de cada fila y pruébala. Vale más de una norma.');
  const QUIEN = [['todos', 'Todos los objetos'], ['grupo', `Solo ${grupo}`], ['jefe', 'Todos menos el jefe']];
  const VERBO = [['tienen que', 'tienen que'], ['no pueden', 'no pueden']];
  const ACC = P.acciones.map((x) => [x.a, x.a]);
  const sel = { quien: null, verbo: null, accion: null };
  const nota = el('p', { class: 'cn-frase', 'aria-live': 'polite' });
  const pintaFrase = () => {
    const q = QUIEN.find((x) => x[0] === sel.quien)?.[1] ?? '…';
    nota.replaceChildren(el('span', { class: sel.quien ? '' : 'hueco', text: q }), ' ', el('span', { class: sel.verbo ? '' : 'hueco', text: sel.verbo ?? '…' }), ' ', el('span', { class: sel.accion ? '' : 'hueco', text: sel.accion ?? '…' }), '.');
  };
  const fila = (clave, titulo, opciones) => el('div', { class: 'cn-fila', role: 'radiogroup', 'aria-label': titulo }, el('b', { text: titulo }),
    el('div', { class: 'cn-piezas' }, opciones.map(([v, t]) => el('button', { type: 'button', class: 'cn-pieza', role: 'radio', 'aria-checked': 'false', 'data-k': clave, 'data-v': v, text: t, onclick: (e) => pon(clave, v, e.currentTarget) }))));
  const pon = (clave, v, b) => {
    sel[clave] = v; suena('clic');
    b.parentNode.querySelectorAll('.cn-pieza').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    pintaFrase(); limpia();
  };
  const filas = el('div', { class: 'cn-filas' }, fila('quien', '¿Quién?', QUIEN), fila('verbo', '¿Qué?', VERBO), fila('accion', '¿Qué cosa?', ACC));
  const medArregla = el('li', { class: 'cn-medidor' }, el('b', { text: '¿Arregla el problema?' }), el('span', { class: 'cn-res' }));
  const medAguanta = el('li', { class: 'cn-medidor' }, el('b', { text: '¿Aguanta en el Tribunal?' }), el('span', { class: 'cn-res' }));
  const efecto = el('p', { class: 'cn-efecto', 'aria-live': 'polite' });
  const prueba_ = el('div', { class: 'cn-prueba' }, el('ul', { class: 'cn-medidores' }, medArregla, medAguanta), efecto);
  const cajonVoto = el('ul', { class: 'cn-asamblea cn-referendum', hidden: true });
  ctx.escenario.append(el('div', { class: 'cn-construye' }, el('div', { class: 'cn-lado' }, el('div', { class: 'cn-propuesta borrador' }, el('small', { text: 'Mi norma' }), nota), filas), el('div', { class: 'cn-lado' }, prueba_, cajonVoto)));
  pintaFrase();
  function limpia() { [medArregla, medAguanta].forEach((m) => { m.className = 'cn-medidor'; m.querySelector('.cn-res').textContent = ''; }); efecto.textContent = ''; }
  const evalua = ({ quien, verbo, accion }) => {
    const x = P.acciones.find((a) => a.a === accion);
    let arregla, choca = null, texto;
    if (verbo !== x.con) {
      // el verbo al revés: «tienen que quejarse», «no pueden hablar por turnos»…
      arregla = false;
      if (verbo === 'tienen que' && x.choca) { texto = `¿Obligar a ${accion}? Eso no arregla nada.`; }
      else if (verbo === 'no pueden' && !x.choca) { texto = `Si no pueden ${accion}, el problema empeora.`; }
      else texto = 'Así dicha, la norma no arregla el problema.';
    } else { arregla = x.arregla; choca = x.choca ?? null; texto = x.efecto; }
    if (quien === 'grupo') { choca = choca ?? 'igualdad'; if (arregla) { arregla = false; texto = `Solo ${grupo} la cumplen. Los demás siguen igual, y el problema también.`; } }
    if (quien === 'jefe') { choca = choca ?? 'cumplir'; if (arregla) { arregla = false; texto = 'El jefe se la salta… y todos miran al jefe. El problema vuelve.'; } }
    return { arregla, choca, texto };
  };
  const otras = () => P.acciones.filter((a) => a.arregla && !a.choca);
  let intentos = 0;
  const probar = async (s = sel) => {
    if (!s.quien || !s.verbo || !s.accion) return ctx.aviso('Te falta alguna pieza de la norma.', true);
    intentos++;
    const r = evalua(s);
    ctx.aviso('');
    medArregla.classList.add(r.arregla ? 'bien' : 'mal'); medArregla.querySelector('.cn-res').textContent = r.arregla ? 'Sí' : 'No';
    medAguanta.classList.add(r.choca ? 'mal' : 'bien'); medAguanta.querySelector('.cn-res').textContent = r.choca ? `No: choca con el artículo ${art(r.choca).n}` : 'Sí';
    efecto.textContent = r.texto + (r.choca ? ` (${art(r.choca).titulo}: ${art(r.choca).texto.charAt(0).toLowerCase() + art(r.choca).texto.slice(1)})` : '');
    if (!lento()) gsap.from([medArregla, medAguanta], { x: -20, opacity: 0, duration: 0.3, stagger: 0.15 });
    suena(r.arregla && !r.choca ? 'bien' : 'mal');
    if (r.arregla && !r.choca) {
      ctx.acciones.replaceChildren();
      filas.querySelectorAll('button').forEach((b) => (b.disabled = true));
      // referéndum: votan los 15
      const si = azar(11, 14);
      cajonVoto.hidden = false;
      const tipos = barajar(Object.keys(GRUPOS));
      cajonVoto.replaceChildren(...Array.from({ length: N }, (_, i) => el('li', { class: 'cn-vecino' }, el('span', { class: 'cn-obj', html: objeto(GRUPOS[tipos[i % 6]].icono, COLORES[i % 6]) }), el('i', { class: 'cn-voto ' + (i < si ? 'si' : 'no') }))));
      cajonVoto.prepend(el('li', { class: 'cn-titulo-ref', text: `Referéndum: ${si} sí, ${N - si} no` }));
      if (!lento()) await gsap.from(cajonVoto.querySelectorAll('.cn-voto'), { scale: 0, duration: 0.25, stagger: 0.05, ease: 'back.out(3)' }).then();
      await espera(300);
      const otra = otras().find((a) => a.a !== s.accion);
      return ctx.fin(Math.max(1, 4 - intentos), `«Todos los objetos ${s.verbo} ${s.accion}». Arregla el problema, no le quita derechos a nadie y sale en referéndum: **${si} de ${N}**.` + (otra ? ` También valía: «Todos los objetos ${otra.con} ${otra.a}».` : ''));
    }
    temblor(prueba_, 6);
    if (intentos >= 3) {
      ctx.acciones.replaceChildren();
      const [a, b] = otras();
      return ctx.fin(0, `Una norma que vale: «Todos los objetos ${a.con} ${a.a}». O esta: «Todos los objetos ${b.con} ${b.a}». Arreglan el problema y **no le quitan a nadie ningún derecho**.`);
    }
    ctx.aviso(intentos === 1 ? 'Cambia alguna pieza y vuelve a probar.' : 'Última prueba. Mira bien qué falla: ¿el problema, o el Tribunal?', true);
  };
  ctx.boton('Probar la norma', () => probar());
  const [ok1] = otras();
  ctx.pistas([
    { texto: 'Una buena norma **arregla el problema** y además **no le quita a nadie** lo que dice la Constitución.' },
    { texto: `Si la norma es solo para ${grupo}, o deja fuera al jefe, el resto sigue igual. Y prohibir hablar, votar o salir a clase choca con la Constitución.` },
    { texto: `Empieza por: **Todos los objetos ${ok1.con}…**` },
  ]);
  const elegir = (s) => ['quien', 'verbo', 'accion'].forEach((k) => filas.querySelector(`[data-k="${k}"][data-v="${CSS.escape(s[k])}"]`)?.click());
  prueba(() => { const s = { quien: 'todos', verbo: ok1.con, accion: ok1.a }; elegir(s); return probar(s); },
    async () => { for (let i = 0; i < 3; i++) { const s = { quien: 'grupo', verbo: ok1.con, accion: ok1.a }; elegir(s); await probar(s); } });
}

// ---------------------------------------------------------------- normas y cambios de la Constitución
function reforma(d, ctx) {
  const trampa = d.props.some((p) => p.quita);
  ctx.reto(`Asamblea del jueves: votan los ${N} objetos. **¿Qué propuestas salen?**`);
  ctx.pista(d.pista ?? 'Mira de qué tipo es cada propuesta antes de mirar los votos.');
  const marcas = d.props.map(() => null);
  const filas = d.props.map((p, i) => {
    const grupo = el('div', { class: 'cn-decide', role: 'radiogroup', 'aria-label': 'Sale o no sale' },
      ...[['si', 'Sale'], ['no', 'No sale']].map(([v, t]) => el('button', { type: 'button', class: 'cn-pieza', role: 'radio', 'aria-checked': 'false', 'data-v': v, text: t, onclick: (e) => { marcas[i] = v === 'si'; suena('clic'); grupo.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b === e.currentTarget))); } })));
    return el('li', { class: 'cn-prop ' + p.tipo },
      el('span', { class: 'cn-etiqueta', text: p.tipo === 'norma' ? 'Norma' : 'Cambio de la Constitución' }),
      el('p', { text: p.t }),
      el('div', { class: 'cn-votos' }, puntos(p.si), el('span', {}, el('b', { text: `Sí ${p.si}` }), ` · No ${N - p.si}`)),
      grupo);
  });
  const lista = el('ol', { class: 'cn-props' }, filas);
  const regla = el('p', { class: 'cn-regla' }, el('b', { text: 'Reglas de la asamblea: ' }), 'una norma sale con más síes que noes. Para cambiar la Constitución hacen falta 3 de cada 5 votos: ', el('b', { text: `${(N * 3) / 5} de ${N}` }), '.');
  ctx.escenario.append(el('div', { class: 'cn-reforma' }, regla, lista));
  const resuelve = async (m) => {
    ctx.acciones.replaceChildren();
    let fallos = 0; const malos = [];
    for (let i = 0; i < d.props.length; i++) {
      const p = d.props[i], ok = m[i] === p.sale;
      filas[i].querySelectorAll('button').forEach((b) => (b.disabled = true));
      filas[i].classList.add(ok ? 'bien' : 'mal');
      if (!ok) { fallos++; malos.push(p); }
      await estampa(filas[i], p.sale ? 'APROBADA' : p.quita ? 'ANULADA' : 'RECHAZADA', p.sale);
      await espera(200);
    }
    const explica = (p) => p.quita ? `«${p.t}»: la votan ${p.si} de ${N}, pero quita un derecho (${art(p.quita).titulo.toLowerCase()}). **No vale aunque la vote casi todo el cajón**: el Tribunal la anula.`
      : p.tipo === 'norma' ? `«${p.t}»: ${p.si} síes contra ${N - p.si} noes. Una norma ${p.sale ? 'sale' : 'no sale'}: ${p.sale ? 'hay más síes que noes' : 'no hay más síes que noes'}.`
      : `«${p.t}»: ${p.si} de ${N}. ${p.si > N - p.si ? 'Es más de la mitad, pero ' : ''}para cambiar la Constitución hacen falta **${(N * 3) / 5}**${p.sale ? ', y los tiene' : ''}.`;
    const real = ' En España pasa igual: para cambiar la Constitución hacen falta 3 de cada 5 diputados y senadores (210 de 350 en el Congreso).';
    if (!fallos) return ctx.fin(3, (trampa ? 'Todo bien juzgado. ' + explica(d.props.find((p) => p.quita)) : 'Todo bien contado. ' + explica(d.props.find((p) => p.tipo === 'constitucion' && p.si === 8))) + real);
    ctx.fin(fallos === 1 ? 1 : 0, malos.map(explica).join(' ') + (fallos === 1 ? real : ''));
  };
  ctx.boton('Contar votos', () => {
    if (marcas.some((x) => x == null)) return ctx.aviso('Decide para cada propuesta si sale o no.', true);
    resuelve(marcas);
  });
  const trampaC = d.props.find((p) => p.tipo === 'constitucion' && p.si === 8);
  ctx.pistas([
    { texto: 'No todas las propuestas necesitan los mismos votos: mira la **etiqueta** de cada una.' },
    { texto: `Una norma sale con más síes que noes (8 de ${N} basta). Un cambio de la Constitución necesita 3 de cada 5: **9 de ${N}**.` + (trampa ? ' Y una norma que quita derechos no vale aunque la vote casi todo el mundo.' : '') },
    { texto: `«${trampaC.t}» tiene 8 síes: **no sale**.` },
  ]);
  prueba(() => resuelve(d.props.map((p) => p.sale)), () => resuelve(d.props.map((p) => !p.sale)));
}
