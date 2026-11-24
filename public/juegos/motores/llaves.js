// Motor «llaves»: Sociales, tema 2 (El cajón vota) · «La isla del recreo».
// En el recreo el patio es una isla con tres llaves: HACER NORMAS, HACERLAS CUMPLIR y JUZGAR.
// El alumno reparte las llaves entre los habitantes y corre una semana de recreos. El sistema es fijo y se ve:
//   · cada día pasa algo que necesita una llave (hace falta una norma, alguien se la salta, dos discuten,
//     el que hace cumplir se pasa) y actúa quien la tiene;
//   · si nadie la tiene, no se resuelve; si quien la tiene junta dos llaves, abusa; si no es la persona
//     adecuada (nadie la ha elegido, es de un bando…), sale mal;
//   · tres marcadores: orden, justicia y quejas. Nada depende de la suerte: el mismo reparto da la misma semana.
// Modos: reparto (isla), arregla (una semana mal repartida: mueve llaves), espana (Cortes, Gobierno, jueces,
// Rey y Tribunal Constitucional), vigila (eres el Tribunal Constitucional: ¿quién actúa ante cada ley?).
import { el, svg, elige, barajar, suena } from './nucleo.js';
import { gsap } from './vendor/gsap.js';
import { espera, bote, temblor, chispasEn, arrastra } from './efectos.js';

const lento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const porFallos = (f) => (f === 0 ? 3 : f === 1 ? 2 : f === 2 ? 1 : 0);
const prueba = new URLSearchParams(location.search).has('prueba');
const may = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const T = '#1b1e3a';

/* =========================================================================== las llaves */
const LLAVES = {
  normas: { nombre: 'Hacer normas', verbo: 'hacer normas', color: '#ffc531', req: 'Para quien haya elegido todo el patio votando.', reqE: 'Para quien elegimos todos votando.' },
  cumplir: { nombre: 'Hacerlas cumplir', verbo: 'hacer cumplir las normas', color: '#5ec3ff', req: 'Para quien elija el consejo para organizar.', reqE: 'Para quien elige el Congreso.' },
  juzgar: { nombre: 'Juzgar', verbo: 'juzgar', color: '#ff7fae', req: 'Para quien no sea de ningún bando.', reqE: 'Para quien no obedece a nadie más que a la ley.' },
};
const ORDEN_LLAVES = ['normas', 'cumplir', 'juzgar'];
const ICONO_LLAVE = {
  normas: '<path d="M-9 -8 h14 l4 4 v13 h-18z" fill="#fffdf6" stroke="#1b1e3a" stroke-width="2.4" stroke-linejoin="round"/><path d="M-5 -2 h9 M-5 2.5 h9 M-5 7 h6" stroke="#1b1e3a" stroke-width="1.8" stroke-linecap="round"/>',
  cumplir: '<path d="M-10 -2 a7 7 0 1 0 14 0 h7 v-5 h-14" fill="#fffdf6" stroke="#1b1e3a" stroke-width="2.4" stroke-linejoin="round"/><circle cx="-3" cy="-2" r="2.2" fill="#1b1e3a"/>',
  juzgar: '<path d="M0 -10 v18 M-6 8 h12 M-10 -6 h20" stroke="#1b1e3a" stroke-width="2.4" stroke-linecap="round"/><path d="M-10 -6 l-4 8 h8z M10 -6 l-4 8 h8z" fill="#fffdf6" stroke="#1b1e3a" stroke-width="2" stroke-linejoin="round"/>',
};
const llaveSVG = (k) => `<g transform="translate(8 2)"><path d="M40 20 h46 v8 h-6 v8 h-7 v-8 h-6 v8 h-7 v-8 h-20z" fill="${LLAVES[k].color}" stroke="${T}" stroke-width="3" stroke-linejoin="round"/><circle cx="24" cy="24" r="21" fill="${LLAVES[k].color}" stroke="${T}" stroke-width="3"/><circle cx="24" cy="24" r="15" fill="#fffdf6" stroke="${T}" stroke-width="2"/><g transform="translate(24 24) scale(.9)">${ICONO_LLAVE[k]}</g></g>`;

/* =========================================================================== habitantes de la isla */
const ojos = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="-8" r="6" fill="#fff" stroke="${T}" stroke-width="2.5"/><circle cx="8" r="6" fill="#fff" stroke="${T}" stroke-width="2.5"/><circle cx="-7" cy="1" r="2.6" fill="${T}"/><circle cx="9" cy="1" r="2.6" fill="${T}"/></g>`;
const boca = (x, y, s = 1) => `<path d="M${x - 6 * s} ${y} q${6 * s} ${6 * s} ${12 * s} 0" fill="none" stroke="${T}" stroke-width="${2.5 * s}" stroke-linecap="round"/>`;
const OBJETOS = {
  regla: { n: 'Regla', g: 'f', d: `<rect x="14" y="30" width="72" height="40" rx="4" fill="#ffc531" stroke="${T}" stroke-width="3.5" transform="rotate(-8 50 50)"/><g transform="rotate(-8 50 50)" stroke="${T}" stroke-width="2">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${22 + i * 10} 30 v${i % 2 ? 7 : 11}"/>`).join('')}</g>${ojos(50, 52)}${boca(50, 62)}` },
  pegamento: { n: 'Pegamento', g: 'm', d: `<rect x="30" y="26" width="40" height="64" rx="8" fill="#fffdf6" stroke="${T}" stroke-width="3.5"/><rect x="30" y="58" width="40" height="32" rx="6" fill="#ff8a1f" stroke="${T}" stroke-width="3.5"/><rect x="34" y="10" width="32" height="20" rx="6" fill="#ff8a1f" stroke="${T}" stroke-width="3.5"/>${ojos(50, 42, 0.9)}${boca(50, 51, 0.8)}` },
  grapadora: { n: 'Grapadora', g: 'f', d: `<path d="M10 72 h80 v12 h-80z" fill="#9aa0bd" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/><path d="M12 70 q2 -34 38 -38 h36 q6 0 6 8 v30z" fill="#e8417a" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/>${ojos(56, 50)}${boca(56, 61)}` },
  compas: { n: 'Compás', g: 'm', d: `<path d="M50 30 L28 88 M50 30 L72 88" stroke="${T}" stroke-width="9" stroke-linecap="round"/><path d="M50 30 L28 88 M50 30 L72 88" stroke="#c9cfdd" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="26" r="16" fill="#2f5bd3" stroke="${T}" stroke-width="3.5"/>${ojos(50, 24, 0.7)}${boca(50, 32, 0.6)}` },
  cera: { n: 'Cera', g: 'f', d: `<path d="M34 34 h32 v54 h-32z" fill="#9bd84a" stroke="${T}" stroke-width="3.5"/><path d="M34 34 l16 -24 l16 24z" fill="#9bd84a" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/><rect x="34" y="66" width="32" height="12" fill="#fffdf6" stroke="${T}" stroke-width="2.5"/>${ojos(50, 48, 0.85)}${boca(50, 58, 0.8)}` },
  sacapuntas: { n: 'Sacapuntas', g: 'm', d: `<rect x="20" y="30" width="60" height="52" rx="8" fill="#5ec3ff" stroke="${T}" stroke-width="3.5"/><circle cx="34" cy="70" r="7" fill="${T}"/><path d="M62 30 v-8 h14 v8" fill="#c9cfdd" stroke="${T}" stroke-width="3"/>${ojos(52, 48)}${boca(56, 62, 0.9)}` },
  chincheta: { n: 'Chincheta', g: 'f', d: `<path d="M50 70 v24" stroke="${T}" stroke-width="5" stroke-linecap="round"/><ellipse cx="50" cy="66" rx="20" ry="8" fill="#d7263d" stroke="${T}" stroke-width="3"/><circle cx="50" cy="40" r="26" fill="#d7263d" stroke="${T}" stroke-width="3.5"/>${ojos(50, 38)}${boca(50, 50)}` },
  rotulador: { n: 'Rotulador', g: 'm', d: `<rect x="34" y="22" width="32" height="64" rx="6" fill="#b79cff" stroke="${T}" stroke-width="3.5"/><path d="M38 22 l4 -12 h16 l4 12z" fill="#6d4fd1" stroke="${T}" stroke-width="3" stroke-linejoin="round"/><rect x="34" y="70" width="32" height="8" fill="#fffdf6" stroke="${T}" stroke-width="2.5"/>${ojos(50, 44, 0.85)}${boca(50, 54, 0.8)}` },
  celo: { n: 'Celo', g: 'm', d: `<circle cx="50" cy="54" r="34" fill="#f6e7a8" stroke="${T}" stroke-width="3.5"/><circle cx="50" cy="54" r="16" fill="#fffdf6" stroke="${T}" stroke-width="3"/><path d="M80 66 l14 18 l-6 4" fill="#f6e7a8" stroke="${T}" stroke-width="3" stroke-linejoin="round"/>${ojos(50, 30, 0.75)}${boca(50, 80, 0.7)}` },
  clip: { n: 'Clip', g: 'm', d: `<path d="M34 86 V30 a14 14 0 0 1 28 0 v50 a9 9 0 0 1 -18 0 V36" fill="none" stroke="${T}" stroke-width="10" stroke-linecap="round"/><path d="M34 86 V30 a14 14 0 0 1 28 0 v50 a9 9 0 0 1 -18 0 V36" fill="none" stroke="#c9cfdd" stroke-width="5" stroke-linecap="round"/>${ojos(48, 50, 0.8)}` },
};
const consejoSVG = (ids) => ids.map((k, i) => `<g transform="translate(${[-4, 34, 18][i]} ${[26, 26, -2][i]}) scale(.52)">${OBJETOS[k].d}</g>`).join('');
// las instituciones: dibujos sin caras (el Rey, una corona genérica)
const INST = {
  cortes: `<path d="M10 40 L50 16 L90 40z" fill="#f3e3c3" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/><rect x="14" y="40" width="72" height="44" fill="#f3e3c3" stroke="${T}" stroke-width="3.5"/>${[22, 38, 54, 70].map((x) => `<rect x="${x}" y="46" width="8" height="38" fill="#fffdf6" stroke="${T}" stroke-width="2.2"/>`).join('')}<rect x="8" y="84" width="84" height="8" fill="#c9cbe0" stroke="${T}" stroke-width="3"/>`,
  gobierno: `<rect x="14" y="46" width="72" height="12" rx="3" fill="#c98d64" stroke="${T}" stroke-width="3.5"/><path d="M22 58 v26 M78 58 v26" stroke="${T}" stroke-width="4"/>${[26, 50, 74].map((x) => `<rect x="${x - 9}" y="26" width="18" height="20" rx="4" fill="#2f5bd3" stroke="${T}" stroke-width="3"/>`).join('')}<rect x="38" y="62" width="26" height="18" rx="3" fill="#6d4a2e" stroke="${T}" stroke-width="3"/><path d="M45 62 v-4 h12 v4" fill="none" stroke="${T}" stroke-width="3"/>`,
  jueces: `<rect x="18" y="74" width="64" height="12" rx="3" fill="#c98d64" stroke="${T}" stroke-width="3.5"/><g transform="rotate(-35 50 46)"><rect x="34" y="28" width="40" height="20" rx="4" fill="#9b6b43" stroke="${T}" stroke-width="3.5"/><path d="M54 48 v34" stroke="${T}" stroke-width="9" stroke-linecap="round"/><path d="M54 48 v34" stroke="#c98d64" stroke-width="4" stroke-linecap="round"/></g>`,
  rey: `<path d="M16 72 L12 30 L32 48 L50 20 L68 48 L88 30 L84 72z" fill="#ffc531" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/><rect x="14" y="70" width="72" height="14" rx="3" fill="#ffc531" stroke="${T}" stroke-width="3.5"/><circle cx="50" cy="77" r="4" fill="#e8417a" stroke="${T}" stroke-width="2"/><circle cx="30" cy="77" r="3.5" fill="#5ec3ff" stroke="${T}" stroke-width="2"/><circle cx="70" cy="77" r="3.5" fill="#5ec3ff" stroke="${T}" stroke-width="2"/>`,
  tc: `<rect x="16" y="22" width="52" height="64" rx="4" fill="#e8417a" stroke="${T}" stroke-width="3.5"/><rect x="22" y="22" width="6" height="64" fill="#a8204f"/><text x="46" y="60" text-anchor="middle" font-family="Grandstander, sans-serif" font-weight="900" font-size="26" fill="#fffdf6">C</text><circle cx="70" cy="64" r="14" fill="#cfeaff" fill-opacity=".7" stroke="${T}" stroke-width="3.5"/><path d="M80 74 l10 10" stroke="${T}" stroke-width="6" stroke-linecap="round"/>`,
};

// los papeles posibles en la isla (con rasgos) y en España
const ROLES = {
  consejo: { para: 'normas', rasgo: () => 'Los eligió todo el patio votando.' },
  capitan: { para: 'cumplir', rasgo: (o) => `${o.g === 'f' ? 'La' : 'Lo'} eligió el consejo para organizar el recreo.` },
  arbitro: { para: 'juzgar', rasgo: () => 'No juega en ningún equipo y se sabe las normas.' },
  balon: { rasgo: (o) => `Es ${o.g === 'f' ? 'la dueña' : 'el dueño'} del balón.` },
  fuerte: { rasgo: (o) => `Es ${o.g === 'f' ? 'la más fuerte' : 'el más fuerte'} del patio.` },
  equipo: { rasgo: () => 'Capitanea el equipo de la canasta.' },
  amigo: { rasgo: (o, cap) => `Es ${o.g === 'f' ? 'la mejor amiga' : 'el mejor amigo'} de ${cap}.` },
};
const ESPANA = [
  { id: 'cortes', nombre: 'las Cortes Generales', corto: 'Cortes Generales', pl: true, para: 'normas', rasgo: 'Congreso y Senado. Las elegimos votando todos los mayores de 18.' },
  { id: 'gobierno', nombre: 'el Gobierno', corto: 'Gobierno', para: 'cumplir', rasgo: 'El presidente y sus ministros. Al presidente lo elige el Congreso.' },
  { id: 'jueces', nombre: 'los jueces', corto: 'Jueces y tribunales', pl: true, para: 'juzgar', rasgo: 'No obedecen a nadie: solo a las leyes.' },
  { id: 'rey', nombre: 'el Rey', corto: 'El Rey', rasgo: 'Jefe del Estado. Firma las leyes y representa a España.' },
  { id: 'tc', nombre: 'el Tribunal Constitucional', corto: 'Tribunal Constitucional', rasgo: 'Vigila que ninguna ley choque con la Constitución.' },
];
// por qué no le va una llave a alguien (la explicación de cada error típico)
const NOLE = {
  normas: {
    balon: 'nadie le ha elegido: pondrá normas que le convengan', fuerte: 'nadie le ha elegido: manda porque empuja más', equipo: 'nadie le ha elegido y pondrá normas a favor de su equipo', amigo: 'nadie le ha elegido para eso',
    capitan: 'organizar no es hacer normas: las normas las pone el consejo, al que eligió todo el patio', arbitro: 'quien juzga no puede poner las normas que luego juzga',
    gobierno: 'el Gobierno puede proponer leyes, pero **las aprueban las Cortes**, que elegimos todos', rey: 'el Rey no hace leyes: **firma las que aprueban las Cortes**. Reina, pero no manda',
    tc: 'el Tribunal Constitucional no hace leyes: solo mira que no choquen con la Constitución', jueces: 'los jueces no hacen las leyes: las aplican',
  },
  cumplir: {
    balon: 'nadie le ha elegido para organizar: no le hacen caso', fuerte: 'nadie le ha elegido: lo hace a empujones', equipo: 'nadie le ha elegido y solo vigila al equipo contrario', amigo: 'nadie le ha elegido para organizar',
    consejo: 'el consejo hace las normas; organizar el día a día le toca a quien el consejo elija', arbitro: 'si el árbitro también castiga, ¿quién revisa sus castigos?',
    cortes: 'las Cortes hacen las leyes; ponerlas en marcha es trabajo del **Gobierno**', rey: 'el Rey no gobierna: **reina, pero no gobierna**', jueces: 'los jueces juzgan; no gobiernan', tc: 'el Tribunal Constitucional no gobierna: vigila las leyes',
  },
  juzgar: {
    balon: 'no se sabe las normas y es parte interesada', fuerte: 'dará la razón a quien le caiga bien', equipo: 'juega en un equipo: dará la razón a los suyos', amigo: 'dará la razón a su amigo sin escuchar',
    consejo: 'quien hace las normas no puede juzgarlas también', capitan: 'si quien castiga también juzga, nadie revisa sus castigos',
    gobierno: '**los jueces no pueden ser del Gobierno**: si no, el Gobierno se juzgaría a sí mismo', cortes: 'las Cortes hacen leyes, no juzgan casos', rey: 'el Rey no juzga', tc: 'el Tribunal Constitucional no juzga los casos de cada día: solo mira si una ley choca con la Constitución',
  },
};

/* =========================================================================== semanas */
const TEMAS = [
  { cosa: 'la canasta', problema: 'Todos quieren la canasta a la vez y hay empujones.', buena: 'Turnos de diez minutos por grupo', mala: 'La canasta, para {h} y sus amigos', salto: 'Los de 6.º se saltan el turno de la canasta.' },
  { cosa: 'la comba', problema: 'Con la comba siempre saltan las mismas y las demás solo dan.', buena: 'Quien falla, pasa a dar', mala: 'Salta {h} siempre, las demás dan', salto: 'Dos de 4.º no quieren dar a la comba cuando fallan.' },
  { cosa: 'la fuente', problema: 'En la fuente se cuelan y se forma un tapón.', buena: 'Fila de uno en uno', mala: '{h} bebe la primera siempre', salto: 'Los de siempre se cuelan en la fuente.' },
  { cosa: 'la sombra', problema: 'Solo hay un rincón con sombra y siempre lo ocupan los mismos.', buena: 'La sombra, por días para cada clase', mala: 'La sombra es de {h}', salto: 'Los de 6.º se quedan en la sombra el día de 5.º.' },
  { cosa: 'el campo de fútbol', problema: 'Dos partidos quieren el campo a la vez.', buena: 'Un día cada curso', mala: 'El campo, para el equipo de {h}', salto: 'Un equipo juega el día que no le toca.' },
];
const ESP = [
  { problema: 'Hace falta una ley para los **patinetes eléctricos**: atropellan a gente en la acera.', buena: 'Los patinetes, por el carril bici y con casco', marcha: 'Hay que pintar carriles, poner multas y avisar a todo el mundo.', disputa: 'Una vecina dice que la multa que le han puesto es injusta.', abuso: 'multa a un periódico porque le critica' },
  { problema: 'Hace falta una ley para **reciclar las pilas**: acaban en el campo.', buena: 'Contenedores de pilas en todas las tiendas', marcha: 'Hay que repartir contenedores y explicarlo en los colegios.', disputa: 'Una tienda dice que a ella no le toca poner contenedor.', abuso: 'cierra una tienda sin explicar por qué' },
];
const VECINOS = ['Clip', 'Celo', 'Cera', 'Rotulador', 'Chincheta', 'Pegamento'];

// La semana: quién actúa cada día y qué pasa. Devuelve [{ dia, texto, actor, bien, d: {orden, justicia, quejas} }]
function semana(d, pjs, asig) {
  const quien = (k) => (asig[k] == null ? null : pjs[asig[k]]);
  const cuantas = (c) => ORDEN_LLAVES.filter((k) => asig[k] != null && pjs[asig[k]] === c).length;
  const le = (k, c) => c.rol === 'libre' || para(c) === k;
  const ok = (k) => { const c = quien(k); return !!c && le(k, c) && cuantas(c) === 1; };
  const nom = (c) => c.nombre;
  const V = (c, s, p) => (c.pl ? p : s);
  const t = d.tema, E = d.espana;
  const otra = (c, k) => ORDEN_LLAVES.filter((x) => x !== k && asig[x] != null && pjs[asig[x]] === c).map((x) => `la de ${LLAVES[x].verbo}`).join(' y ');
  const porQue = (k, c) => cuantas(c) > 1 ? `Como también tiene ${otra(c, k)}, nadie le para.` : may((NOLE[k][c.rol ?? c.id] ?? 'no le toca').replace(/\*\*/g, '')) + '.';
  const dias = [];
  const A = (o) => dias.push(o);
  const vec = barajar(VECINOS.filter((v) => !pjs.some((p) => p.nombre.includes(v))));
  // 1. hace falta una norma
  { const c = quien('normas');
    if (!c) A({ inc: E ? t.problema : t.problema, txt: E ? 'Nadie tiene la llave de hacer leyes: el problema sigue.' : 'Nadie tiene la llave de hacer normas. Todo sigue igual.', llave: 'normas', bien: false, d: { orden: -1, quejas: 1 } });
    else if (ok('normas')) A({ inc: t.problema, txt: E ? `Las Cortes debaten y votan la ley: «${t.buena}». El Rey la firma.` : `${may(nom(c))} ${V(c, 'vota', 'votan')} una norma: «${t.buena}».`, actor: c, llave: 'normas', bien: true, d: { orden: 1 } });
    else A({ inc: t.problema, txt: E ? `${may(nom(c))} ${V(c, 'decide', 'deciden')} la ley sin votarla en las Cortes. ${porQue('normas', c)}` : `${may(nom(c))} ${V(c, 'pone', 'ponen')} una norma: «${t.mala.replace('{h}', c.corto)}». ${porQue('normas', c)}`, actor: c, llave: 'normas', bien: false, d: { justicia: -1, quejas: 1 } });
  }
  // 2. alguien se la salta / hay que ponerla en marcha
  { const c = quien('cumplir');
    if (!c) A({ inc: E ? t.marcha : t.salto, txt: E ? 'Nadie tiene la llave de gobernar: la ley se queda en un papel.' : 'Nadie tiene la llave de hacer cumplir: se la saltan cada día.', llave: 'cumplir', bien: false, d: { orden: -1, quejas: 1 } });
    else if (ok('cumplir')) A({ inc: E ? t.marcha : t.salto, txt: E ? 'El Gobierno la pone en marcha.' : `${may(nom(c))} les recuerda la norma y les toca esperar.`, actor: c, llave: 'cumplir', bien: true, d: { orden: 1 } });
    else A({ inc: E ? t.marcha : t.salto, txt: (cuantas(c) > 1 ? `${may(nom(c))} ${V(c, 'hace', 'hacen')} cumplir ${E ? 'la ley' : 'la norma'} a los demás… pero no a sí ${V(c, 'mismo', 'mismos')}. ` : `${may(nom(c))} lo ${V(c, 'intenta', 'intentan')}, pero sale mal. `) + porQue('cumplir', c), actor: c, llave: 'cumplir', bien: false, d: { orden: -1, quejas: 1 } });
  }
  // 3. dos discuten
  { const c = quien('juzgar'), [a, b] = vec;
    const inc = E ? t.disputa : `${a} dice que ${b} le ha quitado el sitio en ${t.cosa}. ${b} dice que no.`;
    if (!c) A({ inc, txt: 'Nadie tiene la llave de juzgar: gana el que más grita.', llave: 'juzgar', bien: false, d: { justicia: -1, quejas: 1 } });
    else if (ok('juzgar')) A({ inc, txt: E ? 'Un juez escucha a las dos partes y decide según la ley.' : `${may(nom(c))} escucha a los dos, mira la norma y decide.`, actor: c, llave: 'juzgar', bien: true, d: { justicia: 1 } });
    else A({ inc, txt: `${may(nom(c))} ${V(c, 'decide', 'deciden')} sin escuchar a los dos. ${porQue('juzgar', c)}`, actor: c, llave: 'juzgar', bien: false, d: { justicia: -1, quejas: 1 } });
  }
  // 4. quien hace cumplir se pasa: ¿quién lo revisa?
  if (d.dias >= 4) {
    const c = quien('cumplir'), j = quien('juzgar'), x = vec[2];
    if (c) {
      const inc = E ? `${may(nom(c))} ${t.abuso}.` : `${may(nom(c))} castiga a ${x} sin recreo un mes por pisar una raya.`;
      if (!j) A({ inc, txt: 'Nadie puede revisar el castigo: se queda.', llave: 'juzgar', bien: false, d: { justicia: -1, quejas: 1 } });
      else if (j === c) A({ inc, txt: `${may(nom(c))} se ${V(c, 'juzga', 'juzgan')} a sí ${V(c, 'mismo', 'mismos')}: «Bien hecho». ${E ? 'Por eso los jueces no pueden ser del Gobierno.' : 'El castigo se queda.'}`, actor: c, llave: 'juzgar', bien: false, d: { justicia: -2, quejas: 1 } });
      else if (ok('juzgar')) A({ inc, txt: E ? 'Un juez lo revisa: ninguna ley lo permite. Se anula.' : `${may(nom(j))} lo revisa: ninguna norma dice eso. Castigo anulado.`, actor: j, llave: 'juzgar', bien: true, d: { justicia: 1 } });
      else A({ inc, txt: `${may(nom(j))} lo ${V(j, 'revisa', 'revisan')} mal. ${porQue('juzgar', j)}`, actor: j, llave: 'juzgar', bien: false, d: { justicia: -1, quejas: 1 } });
    } else {
      const [a, b] = [vec[3] ?? 'Clip', vec[2] ?? 'Celo'];
      const inc = E ? 'Dos ayuntamientos discuten por quién arregla un puente.' : `${a} y ${b} se pelean por un balón.`;
      if (!j) A({ inc, txt: 'Nadie puede decidir: siguen peleados.', llave: 'juzgar', bien: false, d: { justicia: -1, quejas: 1 } });
      else if (ok('juzgar')) A({ inc, txt: `${may(nom(j))} ${V(j, 'escucha', 'escuchan')} a los dos y ${V(j, 'decide', 'deciden')}.`, actor: j, llave: 'juzgar', bien: true, d: { justicia: 1 } });
      else A({ inc, txt: `${may(nom(j))} ${V(j, 'decide', 'deciden')} sin escuchar. ${porQue('juzgar', j)}`, actor: j, llave: 'juzgar', bien: false, d: { justicia: -1, quejas: 1 } });
    }
  }
  return dias;
}
// errores del reparto: una entrada por llave que no está bien
const para = (c) => c.para ?? ROLES[c.rol]?.para;
function errores(pjs, asig) {
  const out = [], vistos = new Set();
  const cuantas = (c) => ORDEN_LLAVES.filter((k) => asig[k] != null && pjs[asig[k]] === c).length;
  for (const k of ORDEN_LLAVES) {
    const c = asig[k] == null ? null : pjs[asig[k]];
    if (!c) out.push(`La llave de **${LLAVES[k].verbo}** se quedó sin dueño.`);
    else if (cuantas(c) > 1) { if (!vistos.has(c)) { vistos.add(c); out.push(`${may(c.nombre)} ${c.pl ? 'tenían' : 'tenía'} ${cuantas(c)} llaves: nadie ${c.pl ? 'les' : 'le'} podía parar.`); } }
    else if (c.rol !== 'libre' && para(c) !== k) out.push(`${may(c.nombre)} con la llave de ${LLAVES[k].verbo}: ${NOLE[k][c.rol ?? c.id] ?? 'no le toca'}.`);
  }
  return out;
}
// llaves que no están bien (para las estrellas)
const nErrores = (pjs, asig) => {
  const cuantas = (c) => ORDEN_LLAVES.filter((k) => asig[k] != null && pjs[asig[k]] === c).length;
  return ORDEN_LLAVES.filter((k) => { const c = asig[k] == null ? null : pjs[asig[k]]; return !c || cuantas(c) > 1 || (c.rol !== 'libre' && para(c) !== k); }).length;
};

/* =========================================================================== leyes para el Tribunal Constitucional */
const CHOCAN = [
  { t: 'Las niñas no podrán apuntarse a equipos de fútbol.', d: 'la **igualdad**: nadie puede ser tratado distinto por ser chica o chico' },
  { t: 'Queda prohibido criticar al Gobierno en los periódicos.', d: 'la **libertad de expresión**: puedes decir lo que piensas' },
  { t: 'Los niños de los pueblos pequeños ya no tendrán colegio.', d: 'el **derecho a la educación**: todos los niños tienen derecho a ir a la escuela' },
  { t: 'La policía podrá entrar en cualquier casa sin permiso de un juez.', d: 'el **derecho a la intimidad**: en tu casa no se entra sin tu permiso o el de un juez' },
  { t: 'Nadie podrá mudarse a otra ciudad sin pedir permiso.', d: 'la **libertad de circulación**: puedes vivir donde quieras dentro de España' },
  { t: 'Solo podrán votar las personas que tengan coche.', d: 'la **igualdad**: el voto de cada persona mayor de edad vale lo mismo' },
];
const VALIDAS = [
  { t: 'Los menores de 16 años tendrán que llevar casco en bici.' },
  { t: 'Las pilas usadas se tirarán en contenedores especiales.' },
  { t: 'Los patinetes eléctricos no podrán ir por la acera.' },
  { t: 'En las calles de un solo carril se irá como mucho a 30 km/h.' },
  { t: 'Las botellas de plástico llevarán el tapón pegado.' },
];
const QUIEN_ACTUA = [
  { id: 'nadie', txt: 'Nadie: es válida y se cumple', ico: null },
  { id: 'tc', txt: 'El Tribunal Constitucional la anula', ico: 'tc' },
  { id: 'rey', txt: 'El Rey se niega a firmarla', ico: 'rey' },
  { id: 'gobierno', txt: 'El Gobierno no la cumple', ico: 'gobierno' },
];

/* =========================================================================== generar */
const usados = new Map();
function saca(clave, lista, k = 1) {
  const u = usados.get(clave) ?? new Set();
  let libres = lista.filter((_, i) => !u.has(i));
  if (libres.length < k) { u.clear(); libres = lista.slice(); }
  const out = barajar(libres).slice(0, k);
  out.forEach((x) => u.add(lista.indexOf(x))); usados.set(clave, u);
  return structuredClone(out);
}
export function generar(spec) {
  const d = structuredClone(spec);
  const g = typeof d.generar === 'object' ? d.generar : {};
  delete d.generar;
  if (d.modo === 'vigila') {
    const n = g.n ?? 3, nc = Math.max(1, Math.min(n - 1, 1 + Math.floor(Math.random() * (n - 1))));
    d.leyes = barajar([...saca('choca', CHOCAN, nc).map((x) => ({ ...x, choca: true })), ...saca('valida', VALIDAS, n - nc).map((x) => ({ ...x, choca: false }))]);
    return d;
  }
  d.espana = d.modo === 'espana';
  d.tema = d.espana ? saca('esp', ESP)[0] : saca('tema', TEMAS)[0];
  d.dias = g.dias ?? (d.modo === 'reparto' && !g.rasgos ? 3 : 4);
  d.requisitos = g.requisitos ?? false;
  if (d.espana) { d.pjs = barajar(ESPANA.map((x) => ({ ...x, ico: x.id }))); return fin(d); }
  const objs = barajar(Object.keys(OBJETOS));
  if (!g.rasgos) {
    d.pjs = objs.slice(0, g.n ?? 3).map((k) => ({ obj: k, nombre: OBJETOS[k].n, corto: OBJETOS[k].n, rol: 'libre' }));
  } else {
    const n = g.n ?? 4;
    const trampas = barajar(['balon', 'fuerte', 'equipo', 'amigo']).slice(0, n - 3);
    const roles = ['consejo', 'capitan', 'arbitro', ...trampas];
    const consejo = objs.slice(0, 3), resto = objs.slice(3);
    const pjs = roles.map((r, i) => r === 'consejo' ? { rol: r, grupo: consejo, nombre: 'el consejo', corto: 'el consejo' } : { rol: r, obj: resto[i], nombre: OBJETOS[resto[i]].n, corto: OBJETOS[resto[i]].n });
    const cap = pjs.find((p) => p.rol === 'capitan');
    pjs.forEach((p) => (p.rasgo = p.rol === 'consejo' ? ROLES.consejo.rasgo() : ROLES[p.rol].rasgo(OBJETOS[p.obj], cap.nombre)));
    d.pjs = barajar(pjs);
  }
  if (d.modo === 'arregla') {
    // una semana mal repartida: alguien con dos llaves (y a veces una llave sin dueño)
    const [a, b, c] = [0, 1, 2];
    d.inicial = elige([{ normas: a, cumplir: b, juzgar: a }, { normas: a, cumplir: a, juzgar: b }, { normas: b, cumplir: a, juzgar: a }, { normas: a, cumplir: a, juzgar: a }, { normas: a, cumplir: a, juzgar: null }, { normas: null, cumplir: a, juzgar: a }]);
    void c;
  }
  return fin(d);
}
function fin(d) {
  // la solución (para el modo prueba): cada llave a quien le va, sin repetir
  const sol = {};
  if (d.pjs.every((p) => p.rol === 'libre')) ORDEN_LLAVES.forEach((k, i) => (sol[k] = i));
  else ORDEN_LLAVES.forEach((k) => (sol[k] = d.pjs.findIndex((p) => (p.para ?? ROLES[p.rol]?.para) === k)));
  d.sol = sol;
  return d;
}

/* =========================================================================== dibujos */
const dibujoPj = (p) => p.ico ? INST[p.ico] : p.grupo ? consejoSVG(p.grupo) : OBJETOS[p.obj].d;
const MARCAS = {
  orden: '<g fill="#fffdf6" stroke="#1b1e3a" stroke-width="2">' + [0, 1, 2].map((i) => `<rect x="${3 + i * 7}" y="${16 - i * 5}" width="6" height="${5 + i * 5}" rx="1"/>`).join('') + '</g>',
  justicia: '<path d="M12 4v16M6 20h12M3 7h18" stroke="#1b1e3a" stroke-width="2.2" stroke-linecap="round"/><path d="M3 7l-2.5 6h5zM21 7l-2.5 6h5z" fill="#fffdf6" stroke="#1b1e3a" stroke-width="1.8" stroke-linejoin="round"/>',
  quejas: '<rect x="2" y="5" width="20" height="14" rx="2" fill="#ffd9e3" stroke="#1b1e3a" stroke-width="2.2"/><path d="M3 6l9 7 9-7" fill="none" stroke="#1b1e3a" stroke-width="2.2"/>',
};
const ISLA_PORTADA = `<svg viewBox="0 0 640 400" class="ll-arte-svg" aria-hidden="true">
  <rect x="20" y="30" width="600" height="350" rx="26" fill="#5ec3ff" stroke="${T}" stroke-width="5"/>
  ${[[70, 80], [520, 70], [560, 330], [90, 320], [300, 360]].map(([x, y]) => `<path d="M${x} ${y} q12 -10 24 0 q12 10 24 0" fill="none" stroke="#fffdf6" stroke-width="4" stroke-linecap="round" opacity=".8"/>`).join('')}
  <path d="M110 230 q-10 -90 110 -110 q90 -30 190 -6 q120 20 120 110 q10 90 -120 106 q-110 20 -200 4 q-110 -12 -100 -104z" fill="#f2d18d" stroke="${T}" stroke-width="5"/>
  <path d="M130 240 q-4 -70 96 -90 q80 -24 170 -4 q100 18 104 92" fill="none" stroke="#e6bf72" stroke-width="10" opacity=".7"/>
  <g transform="translate(200 210)"><path d="M0 60 q-6 -50 10 -100" fill="none" stroke="#9b6b43" stroke-width="12" stroke-linecap="round"/><path d="M10 -40 q-50 -20 -70 10 M10 -40 q40 -30 70 0 M10 -40 q-10 -40 -40 -50 M10 -40 q30 -40 60 -36" fill="none" stroke="#6fbf3a" stroke-width="14" stroke-linecap="round"/></g>
  <g transform="translate(430 160)"><path d="M0 120 V0" stroke="${T}" stroke-width="7"/><rect x="-8" y="-30" width="54" height="34" fill="#fffdf6" stroke="${T}" stroke-width="4"/><ellipse cx="24" cy="8" rx="16" ry="5" fill="none" stroke="#ff8a1f" stroke-width="5"/></g>
  <g transform="translate(300 196) scale(.95)">${OBJETOS.cera.d}</g><g transform="translate(206 250) scale(.7)">${OBJETOS.chincheta.d}</g>
</svg>`;
(function portadaPropia() {
  const html = `<div class="arte ll-arte" aria-hidden="true">${ISLA_PORTADA}<span class="ll-arte-rotulo">ISLA DEL RECREO</span>
    <div class="abertura">${ORDEN_LLAVES.map((k, i) => `<span class="pieza pz${i + 1}">${svg('0 0 104 52', llaveSVG(k)).outerHTML}</span>`).join('')}</div></div>`;
  const mo = new MutationObserver(() => {
    const a = document.querySelector('.portada-arte');
    if (!a || a.dataset.propia) return;
    a.dataset.propia = '1'; a.innerHTML = html; mo.disconnect();
    if (!lento()) {
      const pz = a.querySelectorAll('.abertura .pieza');
      gsap.from(pz, { y: 40, opacity: 0, duration: 0.5, ease: 'back.out(2)', stagger: 0.12, delay: 0.7 });
      gsap.to(pz, { y: '-=8', duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.3, delay: 1.4 });
    }
  });
  mo.observe(document.body, { childList: true });
  setTimeout(() => mo.disconnect(), 15000);
})();

/* =========================================================================== rondas */
export function ronda(d, ctx) {
  if (d.modo === 'vigila') return vigila(d, ctx);
  return reparto(d, ctx);
}

function marcadoresNodo() {
  const val = { orden: 3, justicia: 3, quejas: 0 };
  const nodos = {};
  const caja = el('div', { class: 'll-marcadores', role: 'group', 'aria-label': 'Marcadores de la semana' }, ['orden', 'justicia', 'quejas'].map((k) => {
    const barra = el('span', { class: 'll-barra' + (k === 'quejas' ? ' quejas' : '') }, Array.from({ length: k === 'quejas' ? 6 : 5 }, () => el('i')));
    const n = el('div', { class: 'll-marcador ' + k }, el('span', { class: 'll-marca-ico', html: svg('0 0 24 24', MARCAS[k]).outerHTML }), el('span', { class: 'll-marca-txt' }, el('small', { text: may(k) }), barra));
    nodos[k] = { n, barra };
    return n;
  }));
  const pinta = () => {
    for (const k of ['orden', 'justicia', 'quejas']) {
      const v = val[k];
      nodos[k].barra.querySelectorAll('i').forEach((x, j) => (x.className = j < v ? 'on' : ''));
      nodos[k].n.setAttribute('aria-label', `${may(k)}: ${v}`);
      nodos[k].n.classList.toggle('mal', k === 'quejas' ? v >= 3 : v <= 1);
      nodos[k].n.classList.toggle('bien', k === 'quejas' ? v === 0 : v >= 5);
    }
  };
  pinta();
  return { caja, val, pinta, nodos };
}

function reparto(d, ctx) {
  const E = d.espana;
  const pjs = d.pjs;
  const asig = d.inicial ? { ...d.inicial } : { normas: null, cumplir: null, juzgar: null };
  let elegida = null, corriendo = false, avisoVacia = false;

  if (d.modo === 'arregla') {
    ctx.reto('La semana pasada **salió fatal**. Mueve las llaves para que esta salga bien.');
    ctx.pista('Mira el diario: ¿quién tenía qué? Toca una llave y luego a quién se la das.');
  } else if (E) {
    ctx.reto('Ahora, **España**. Reparte las tres llaves entre las instituciones.');
    ctx.pista('Toca una llave y luego a quién se la das. No todos tienen que llevarse una.');
  } else {
    ctx.reto(d.pjs.length > 3 ? `Reparte las tres llaves de la isla. Ojo: **no todos sirven** para todo.` : 'Reparte las **tres llaves** de la isla y mira qué pasa en una semana de recreos.');
    ctx.pista('Toca una llave y luego a quién se la das (o arrástrala). Toca una llave puesta para cambiarla.');
  }

  const M = marcadoresNodo();
  const bandeja = el('div', { class: 'll-bandeja', 'aria-label': 'Llaves sin dueño' }, el('b', { class: 'll-bandeja-tit', text: 'Llaves sin dueño' }));
  const huecoBandeja = el('div', { class: 'll-bandeja-llaves' });
  bandeja.append(huecoBandeja);
  const diario = el('ol', { class: 'll-diario', 'aria-live': 'polite', hidden: true });
  const cartas = pjs.map((p, i) => {
    const llavero = el('div', { class: 'll-llavero' });
    const c = el('div', { class: 'll-pj' + (p.ico ? ' inst' : '') + (p.grupo ? ' grupo' : ''), 'data-i': i, role: 'button', tabindex: '0', 'aria-label': `${may(p.corto ?? p.nombre)}${p.rasgo ? '. ' + p.rasgo : ''}` },
      el('span', { class: 'll-pj-dib', html: svg('0 0 100 100', dibujoPj(p)).outerHTML }),
      el('b', { class: 'll-pj-nombre', text: may(p.corto ?? p.nombre) }),
      p.rasgo && el('small', { class: 'll-pj-rasgo', text: p.rasgo }),
      llavero);
    c.addEventListener('click', (e) => { if (e.target.closest('.ll-llave')) return; ponEn(i); });
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ponEn(i); } });
    c._llavero = llavero;
    return c;
  });
  const isla = el('div', { class: 'll-isla' + (E ? ' espana' : '') }, el('span', { class: 'll-isla-rotulo', text: E ? 'ESPAÑA' : 'LA ISLA' }), el('div', { class: 'll-pjs n' + pjs.length }, cartas));
  const lado = el('div', { class: 'll-lado' }, M.caja, bandeja, diario);
  ctx.escenario.append(el('div', { class: 'll-tablero' }, isla, lado));

  const pinta = () => {
    huecoBandeja.replaceChildren(); cartas.forEach((c) => c._llavero.replaceChildren());
    for (const k of ORDEN_LLAVES) {
      const enCarta = asig[k] != null;
      const n = el('button', { type: 'button', class: 'll-llave' + (enCarta ? ' puesta' : '') + (elegida === k ? ' elegida' : ''), 'data-llave': k, 'aria-pressed': String(elegida === k), 'aria-label': `Llave de ${LLAVES[k].verbo}${enCarta ? ', la tiene ' + pjs[asig[k]].nombre : ''}` },
        el('span', { class: 'll-llave-dib', html: svg('0 0 104 52', llaveSVG(k)).outerHTML }),
        el('span', { class: 'll-llave-txt' }, el('b', { text: LLAVES[k].nombre }), !enCarta && d.requisitos && el('small', { text: E ? LLAVES[k].reqE : LLAVES[k].req })));
      if (!corriendo) arrastra(n, { destinos: () => [...cartas, bandeja], alSoltar: (dest) => { elegida = k; if (dest === bandeja) quita(k); else ponEn(+dest.dataset.i); return true; }, alTocar: () => { elegida = elegida === k ? null : k; suena('clic'); pinta(); }, puede: () => !corriendo });
      (enCarta ? cartas[asig[k]]._llavero : huecoBandeja).append(n);
    }
    if (!huecoBandeja.children.length) huecoBandeja.append(el('span', { class: 'll-bandeja-vacia', text: 'Todas repartidas.' }));
    cartas.forEach((c, i) => { c.classList.toggle('apunta', elegida != null); c.classList.toggle('doble', ORDEN_LLAVES.filter((k) => asig[k] === i).length > 1); });
    bandeja.classList.toggle('apunta', elegida != null && asig[elegida] != null);
  };
  const ponEn = (i) => {
    if (corriendo || elegida == null) return;
    asig[elegida] = i; elegida = null; avisoVacia = false;
    suena('pon'); bote(cartas[i], 6); pinta(); ctx.aviso('');
  };
  const quita = (k) => { asig[k] = null; elegida = null; suena('quita'); pinta(); };
  bandeja.addEventListener('click', (e) => { if (e.target.closest('.ll-llave') || elegida == null || asig[elegida] == null) return; quita(elegida); });
  pinta();

  // la semana pasada (modo arregla): el diario de lo que salió mal
  if (d.inicial) {
    const pasadas = semana(d, pjs, d.inicial).filter((x) => !x.bien).slice(0, 2);
    diario.hidden = false;
    diario.append(el('li', { class: 'll-dia pasado tit', text: 'La semana pasada' }), ...pasadas.map((x) => el('li', { class: 'll-dia pasado mal' }, el('p', { class: 'll-inc', text: x.inc.replace(/\*\*/g, '') }), el('p', { class: 'll-res', text: x.txt.replace(/\*\*/g, '') }))));
  }

  const nom = (k) => LLAVES[k].verbo;
  const sinDueno = () => ORDEN_LLAVES.filter((k) => asig[k] == null);
  ctx.pistas([
    { texto: E ? 'Piensa qué hace cada uno: unos **hacen** las leyes, otros las **ponen en marcha**, otros **juzgan**. Y hay quien no tiene ninguna llave.' : pjs.some((p) => p.rasgo) ? 'Lee lo que dice cada uno. ¿A quién ha elegido todo el patio? ¿A quién eligió el consejo? ¿Quién no es de ningún bando?' : 'Tres llaves y **tres manos distintas**: que nadie se quede dos, y que ninguna se quede sin dueño.' },
    { texto: E ? 'Leyes: las elegimos todos votando. Gobernar: lo elige el Congreso. Juzgar: no obedece a nadie. El Rey **firma**; el Tribunal Constitucional **vigila**.' : pjs.some((p) => p.rasgo) ? 'Normas: quien eligió todo el patio. Hacerlas cumplir: quien eligió el consejo. Juzgar: quien no juega en ningún equipo.' : d.inicial ? 'Busca quién tiene **dos llaves** y quita una. ¿Hay alguna llave **sin dueño**?' : 'Si alguien tiene dos llaves, nadie le puede parar. Si una llave no tiene dueño, eso no lo hace nadie.' },
    { texto: (() => { const k = 'juzgar'; const p = pjs[d.sol[k]]; return `La llave de **${nom(k)}** va para ${p.rasgo && !E ? `quien «${p.rasgo.replace(/\.$/, '').toLowerCase()}»` : p.nombre}.`; })() },
  ]);

  const btn = ctx.boton('Empezar la semana', async () => {
    if (corriendo) return;
    const vacias = sinDueno();
    if (vacias.length && !avisoVacia) {
      avisoVacia = true;
      return ctx.aviso(`La llave de ${vacias.map(nom).join(' y la de ')} no ${vacias.length > 1 ? 'tienen' : 'tiene'} dueño. Si empiezas así, nadie podrá hacerlo. Pulsa otra vez para empezar igualmente.`, true);
    }
    corriendo = true; elegida = null; btn.disabled = true; ctx.aviso('');
    pinta();
    isla.classList.add('corriendo');
    bandeja.hidden = true; diario.hidden = false; diario.replaceChildren();
    const dias = semana(d, pjs, asig);
    const NOMBRES = E ? ['Enero', 'Marzo', 'Junio', 'Octubre'] : ['Lunes', 'Martes', 'Miércoles', 'Jueves'];
    for (const [i, x] of dias.entries()) {
      const li = el('li', { class: 'll-dia ' + (x.bien ? 'bien' : 'mal') },
        el('span', { class: 'll-dia-nom', text: NOMBRES[i] }),
        el('p', { class: 'll-inc', text: x.inc.replace(/\*\*/g, '') }),
        el('div', { class: 'll-res-fila' }, x.actor ? el('span', { class: 'll-res-dib', html: svg('0 0 100 100', dibujoPj(x.actor)).outerHTML }) : el('span', { class: 'll-res-dib vacio', text: '?' }),
          el('p', { class: 'll-res', text: x.txt.replace(/\*\*/g, '') })),
        el('span', { class: 'll-deltas' }, Object.entries(x.d).map(([k, v]) => el('i', { class: (k === 'quejas' ? v > 0 : v < 0) ? 'malo' : 'bueno', text: `${may(k)} ${v > 0 ? '+' : '−'}${Math.abs(v)}` }))));
      diario.append(li);
      const actorCarta = x.actor ? cartas[pjs.indexOf(x.actor)] : null;
      cartas.forEach((c) => c.classList.toggle('actua', c === actorCarta));
      if (!lento()) gsap.from(li, { x: 40, opacity: 0, duration: 0.35, ease: 'back.out(1.6)' });
      li.scrollIntoView({ block: 'nearest', behavior: lento() ? 'auto' : 'smooth' });
      await espera(500);
      for (const [k, v] of Object.entries(x.d)) { M.val[k] = Math.max(0, Math.min(k === 'quejas' ? 6 : 5, M.val[k] + v)); }
      M.pinta();
      Object.keys(x.d).forEach((k) => ((k === 'quejas' ? x.d[k] > 0 : x.d[k] < 0) ? temblor(M.nodos[k].n, 6) : bote(M.nodos[k].n, 6)));
      suena(x.bien ? 'bien' : 'mal');
      if (x.bien && actorCarta) chispasEn(actorCarta, 8);
      if (!x.bien && actorCarta) temblor(actorCarta, 6);
      await espera(1300);
    }
    cartas.forEach((c) => c.classList.remove('actua'));
    const errs = errores(pjs, asig), n = nErrores(pjs, asig);
    const estrellas = n === 0 ? 3 : n === 1 ? 1 : 0;
    const otraForma = E ? 'Las Cortes hacen las leyes, el Gobierno gobierna y los jueces juzgan. El Rey **firma** y el Tribunal Constitucional **vigila**, sin llave.' : pjs.some((p) => p.rasgo) ? 'Normas para el consejo (lo eligió todo el patio), hacerlas cumplir para quien eligió el consejo, juzgar para quien no es de ningún bando.' : 'Daba igual a quién: lo que importa es que **nadie tenga dos** y que ninguna se quede sin dueño.';
    const libre = pjs.every((p) => p.rol === 'libre');
    const msg = n === 0 ? `**Semana tranquila:** cada llave en una mano distinta${libre ? '' : ' y en la adecuada'}. ${otraForma}` : `**${n === 1 ? 'Una llave mal puesta' : n + ' llaves mal puestas'}.** ` + errs.join(' ') + (estrellas < 2 ? ' Míralo en el diario: cada día malo viene de ahí.' : '');
    ctx.fin(estrellas, msg);
  });

  if (prueba) window.__sol = () => d.sol;
}

// eres el Tribunal Constitucional: llegan leyes aprobadas y firmadas. ¿Quién actúa?
function vigila(d, ctx) {
  ctx.reto('Las Cortes acaban de aprobar estas leyes **por mayoría**. ¿Qué pasa ahora con cada una?');
  ctx.pista('Una ley que quita un derecho de la Constitución no vale, aunque la vote la mayoría.');
  let i = 0, fallos = 0;
  const malos = [];
  const cofre = el('div', { class: 'll-cofre' }, el('span', { class: 'll-cofre-dib', html: svg('0 0 100 100', INST.tc.split('<circle')[0]).outerHTML }), el('span', { class: 'll-cofre-txt' }, el('b', { text: 'La Constitución' }), el('small', { text: 'La regla de las reglas: ninguna ley puede chocar con ella.' })));
  const ley = el('article', { class: 'll-ley', 'aria-live': 'polite' });
  const cuenta = el('ol', { class: 'll-ley-cuenta', 'aria-hidden': 'true' }, d.leyes.map(() => el('li')));
  const ops = el('div', { class: 'll-ops' }, QUIEN_ACTUA.map((o) => el('button', { type: 'button', class: 'll-op', 'data-op': o.id, onclick: () => decide(o.id) },
    o.ico ? el('span', { class: 'll-op-dib', html: svg('0 0 100 100', INST[o.ico]).outerHTML }) : el('span', { class: 'll-op-dib nadie', html: svg('0 0 100 100', `<circle cx="50" cy="50" r="34" fill="#e6f7d0" stroke="${T}" stroke-width="4"/><path d="M34 52 l12 12 l22 -26" fill="none" stroke="${T}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`).outerHTML }),
    el('b', { text: o.txt }))));
  ctx.escenario.append(el('div', { class: 'll-vigila' }, el('div', { class: 'll-vigila-izq' }, cofre, cuenta, ley), ops));
  const pinta = () => {
    const L = d.leyes[i];
    ley.replaceChildren(el('small', { class: 'll-ley-cab', text: `Ley ${i + 1} de ${d.leyes.length} · aprobada por mayoría en las Cortes` }), el('p', { text: `«${L.t}»` }));
    ops.querySelectorAll('button').forEach((b) => (b.disabled = false));
    cuenta.querySelectorAll('li').forEach((x, k) => x.classList.toggle('ahora', k === i));
    if (!lento()) gsap.from(ley, { y: -30, rotation: -3, opacity: 0, duration: 0.4, ease: 'back.out(1.8)' });
    ctx.pistas([
      { texto: 'Pregúntate: ¿esta ley **quita algún derecho** a alguien (igualdad, expresión, educación, intimidad, moverse libremente)?' },
      { texto: 'Si quita un derecho, la anula el **Tribunal Constitucional**. Si no, vale y se cumple, aunque no guste. El Rey firma siempre; el Gobierno cumple siempre.' },
      { texto: L.choca ? `Esta choca con ${L.d.replace(/\*\*/g, '').split(':')[0]}.` : 'Esta no quita ningún derecho a nadie.' },
    ]);
  };
  const decide = async (op) => {
    const L = d.leyes[i];
    const bien = L.choca ? op === 'tc' : op === 'nadie';
    ops.querySelectorAll('button').forEach((b) => (b.disabled = true));
    const sello = el('div', { class: 'll-sello ' + (L.choca ? 'anulada' : 'valida'), text: L.choca ? 'ANULADA' : 'VÁLIDA' });
    ley.append(sello);
    if (!lento()) gsap.from(sello, { scale: 2.4, rotation: -25, opacity: 0, duration: 0.35, ease: 'power3.in' });
    const por = op === 'rey' ? 'El Rey **tiene que firmar** las leyes que aprueban las Cortes: no puede negarse.'
      : op === 'gobierno' ? 'El Gobierno **no puede saltarse** una ley: la tiene que cumplir, como todos.'
      : op === 'tc' && !L.choca ? 'No choca con la Constitución: **es válida**. El Tribunal Constitucional no anula una ley porque no le guste.'
      : op === 'nadie' && L.choca ? `Choca con ${L.d}. **Aunque la votara la mayoría**, el Tribunal Constitucional la anula.` : '';
    const expl = L.choca ? `Choca con ${L.d}: el **Tribunal Constitucional** la anula.` : 'No quita ningún derecho: **es válida** y se cumple, guste o no.';
    cuenta.children[i].classList.add(bien ? 'bien' : 'mal');
    if (bien) { suena('bien'); chispasEn(sello, 10); ctx.aviso(expl.replace(/\*\*/g, '')); }
    else { fallos++; malos.push(por); suena('mal'); temblor(ley, 8); ctx.aviso((por + ' ' + expl).replace(/\*\*/g, ''), true); }
    await espera(bien ? 1800 : 3200);
    i++;
    if (i < d.leyes.length) { ctx.aviso(''); return pinta(); }
    ctx.fin(porFallos(fallos), fallos === 0 ? `**${d.leyes.length} de ${d.leyes.length}.** El Tribunal Constitucional vigila las cerraduras: solo anula lo que choca con la Constitución, aunque lo haya votado la mayoría. Lo demás, aunque no guste, vale.` : `**${d.leyes.length - fallos} de ${d.leyes.length}.** ` + malos.join(' '));
  };
  if (prueba) window.__sol = () => (d.leyes[i]?.choca ? 'tc' : 'nadie');
  pinta();
}
