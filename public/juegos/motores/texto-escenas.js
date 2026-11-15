// Viñetas del modo «sentido» (motor texto): la misma frase, con la coma en otro sitio, dice otra cosa.
// Cada frase tiene sus lecturas (qué comas lleva, qué significa) y un dibujo por lectura. viewBox 0 0 320 180.
const T = '#1b1e3a';
const st = (w = 3) => `stroke="${T}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const CARA = {
  feliz: `<path d="M-5 4 q5 5 10 0" fill="none" ${st(2)}/>`,
  susto: `<ellipse cx="0" cy="6.5" rx="3" ry="4" fill="${T}"/><path d="M-9 -6 l5 2 M9 -6 l-5 2" ${st(1.5)}/>`,
  serio: `<path d="M-4 6 h8" ${st(2)}/>`,
  triste: `<path d="M-5 8 q5 -5 10 0" fill="none" ${st(2)}/>`,
};
const BRAZOS = { abajo: 'M-13 21 l-6 15 M13 21 l6 15', arriba: 'M-13 21 l-9 -15 M13 21 l9 -15', frente: 'M-13 21 l-6 15 M13 22 l15 -2', abrazo: 'M-13 22 q-12 14 -2 22 M13 22 q12 14 2 22', cruz: 'M-12 26 h24' };
function nino(x, y, o = {}) {
  const { c = '#5ec3ff', cara = 'feliz', pelo = '#6e4a2a', piel = '#ffcfa8', esc = 1, giro = 0, brazos = 'abajo', extra = '', melena = false } = o;
  return `<g transform="translate(${x} ${y}) rotate(${giro}) scale(${esc})"><path d="M-7 44 v15 M7 44 v15" ${st(5)}/><path d="${BRAZOS[brazos]}" fill="none" ${st(5)}/>
    <rect x="-13" y="14" width="26" height="32" rx="8" fill="${c}" ${st()}/>${melena ? `<path d="M-14 -2 q-3 16 2 21 M14 -2 q3 16 -2 21" fill="none" stroke="${pelo}" stroke-width="7" stroke-linecap="round"/>` : ''}
    <circle r="13" fill="${piel}" ${st()}/><path d="M-13 -2 a13 13 0 0 1 26 0 q-13 -9 -26 0z" fill="${pelo}" ${st(2)}/><circle cx="-5" cy="1" r="1.8" fill="${T}"/><circle cx="5" cy="1" r="1.8" fill="${T}"/>${CARA[cara]}${extra}</g>`;
}
const fondo = (a, b) => `<rect width="320" height="180" fill="${a}"/><rect y="142" width="320" height="38" fill="${b}"/><path d="M0 142 h320" ${st()}/>`;
const bocadillo = (x, y, txt) => { const w = 18 + txt.length * 7; return `<rect x="${x}" y="${y}" width="${w}" height="26" rx="11" fill="#fffdf6" ${st(2.5)}/><path d="M${x + 14} ${y + 25} l-2 10 l11 -10z" fill="#fffdf6" ${st(2.5)}/><path d="M${x + 12} ${y + 24.5} h12" stroke="#fffdf6" stroke-width="3"/><text x="${x + w / 2}" y="${y + 18}" text-anchor="middle" font-size="13" font-weight="800" fill="${T}">${txt}</text>`; };
const etiqueta = (x, y, txt) => `<rect x="${x - txt.length * 4 - 6}" y="${y}" width="${txt.length * 8 + 12}" height="17" rx="4" fill="#fff27a" ${st(2)}/><text x="${x}" y="${y + 12.5}" text-anchor="middle" font-size="11" font-weight="900" fill="${T}">${txt}</text>`;
const monstruo = (x, y) => `<g transform="translate(${x} ${y})"><path d="M38 18 l24 -16 M-38 18 l-24 -16" ${st(7)}/><path d="M-40 62 C-54 0 -30 -54 0 -54 C30 -54 54 0 40 62Z" fill="#b79cff" ${st(4)}/><path d="M-24 -46 l-8 -17 l15 8z M24 -46 l8 -17 l-15 8z" fill="#fff27a" ${st()}/>
  <circle cx="-13" cy="-20" r="10" fill="#fffdf6" ${st()}/><circle cx="13" cy="-20" r="10" fill="#fffdf6" ${st()}/><circle cx="-10" cy="-19" r="4" fill="${T}"/><circle cx="16" cy="-19" r="4" fill="${T}"/>
  <path d="M-26 6 h52 l-6.5 15 l-6.5 -11 l-6.5 11 l-6.5 -11 l-6.5 11 l-6.5 -11 l-6.5 11z" fill="#fffdf6" ${st()}/>
  <path d="M62 -2 v-30 M55 -32 v11 q7 7 14 0 v-11" fill="none" ${st(3.5)}/><path d="M-62 -2 v-32 q-9 10 0 19" fill="#c9cbe0" ${st(3)}/></g>`;
const mesa = (x, w, y = 118) => `<path d="M${x + 12} ${y + 10} v32 M${x + w - 12} ${y + 10} v32" ${st(6)}/><rect x="${x}" y="${y}" width="${w}" height="12" rx="4" fill="#a8693a" ${st()}/>`;
const plato = (x, y, lleno = true) => `<ellipse cx="${x}" cy="${y}" rx="16" ry="5.5" fill="#fffdf6" ${st(2.5)}/>${lleno ? `<path d="M${x - 9} ${y - 2} q9 -12 18 0z" fill="#ff8a1f" ${st(2)}/>` : ''}`;
const brocha = `<path d="M28 20 l7 -3" ${st(4)}/><rect x="33" y="6" width="10" height="17" rx="2" fill="#2f5bd3" ${st(2.5)}/>`;
const paraguas = (c) => `<path d="M12 22 V-24" ${st(3)}/><path d="M-16 -24 a28 22 0 0 1 56 0z" fill="${c}" ${st()}/>`;
const gotas = `<path d="M-19 0 q-3.5 6 0 9 q3.5 -3 0 -9z M19 6 q-3.5 6 0 9 q3.5 -3 0 -9z M-2 -24 q-3 5 0 8 q3 -3 0 -8z" fill="#5ec3ff" ${st(1.5)}/>`;
const lluvia = Array.from({ length: 26 }, (_, i) => `M${(i * 47) % 320} ${(i * 29) % 132} l-4 13`).join(' ');
const papeles = [[150, 154, -20], [205, 160, 14], [250, 150, 30], [288, 162, -8], [120, 164, 8]].map(([x, y, r]) => `<rect x="${x}" y="${y}" width="16" height="12" fill="#fffdf6" ${st(2)} transform="rotate(${r} ${x} ${y})"/>`).join('');

const DIBUJOS = {
  comer: {
    a: () => fondo('#fff0c2', '#e8c79a') + bocadillo(72, 12, '¡A comer!') + nino(48, 92, { c: '#fffdf6', esc: 1.25, brazos: 'arriba', pelo: '#3a2a1a', extra: `<path d="M-11 -11 h22 v-7 q9 -12 -6 -12 q-5 -8 -10 0 q-15 0 -6 12z" fill="#fffdf6" ${st(2.5)}/>` })
      + nino(172, 86, { c: '#e8417a', brazos: 'arriba' }) + nino(218, 86, { c: '#9bd84a', pelo: '#1b1e3a' }) + nino(264, 86, { c: '#ffc531', melena: true, brazos: 'arriba' }) + mesa(138, 160) + plato(172, 116) + plato(218, 116) + plato(264, 116),
    b: () => fondo('#d9d2ff', '#b9a6e8') + monstruo(80, 86) + `<path d="M150 84 h20 M146 104 h26 M152 124 h18" ${st(3)}/>`
      + nino(196, 96, { cara: 'susto', brazos: 'arriba', giro: 10, c: '#e8417a' }) + nino(244, 100, { cara: 'susto', brazos: 'arriba', giro: 14, c: '#9bd84a', pelo: '#1b1e3a' }) + nino(290, 94, { cara: 'susto', brazos: 'arriba', giro: 8, c: '#ffc531', melena: true }),
  },
  pintar: {
    a: () => fondo('#e6f7d0', '#c8dcae') + `<rect x="160" y="22" width="146" height="120" fill="#fffdf6" ${st()}/><path d="M160 22 h84 v96 q-6 10 -12 0 v-10 q-8 12 -16 0 v18 q-7 10 -14 0 v-8 h-42z" fill="#5ec3ff" ${st()}/>`
      + nino(60, 96, { c: '#e8417a', melena: true, extra: `<path d="M14 36 h15 l-2 15 h-11z" fill="#c9cbe0" ${st(2.5)}/>` }) + nino(128, 92, { brazos: 'frente', c: '#ff8a1f', pelo: '#1b1e3a', extra: brocha }),
    b: () => fondo('#e6f7d0', '#c8dcae') + nino(84, 92, { brazos: 'frente', c: '#ff8a1f', pelo: '#1b1e3a', extra: brocha })
      + nino(142, 92, { c: '#2f5bd3', piel: '#5ec3ff', pelo: '#2f5bd3', cara: 'serio', extra: `<path d="M-10 48 q-3 7 0 10 q3 -3 0 -10z M12 50 q-3 7 0 10 q3 -3 0 -10z M0 60 q-3 7 0 10 q3 -3 0 -10z" fill="#5ec3ff" ${st(1.5)}/>` })
      + nino(236, 94, { cara: 'susto', brazos: 'arriba', c: '#e8417a', melena: true, giro: 8 }) + nino(288, 96, { cara: 'susto', brazos: 'arriba', c: '#ffc531', giro: 12 }),
  },
  hambre: {
    a: () => fondo('#fff0c2', '#e8c79a') + nino(54, 90, { esc: 1.2, c: '#fffdf6', brazos: 'frente', pelo: '#3a2a1a' }) + nino(216, 84, { c: '#9bd84a', cara: 'serio', brazos: 'abrazo' }) + mesa(110, 180) + plato(216, 114)
      + `<text x="262" y="86" font-size="17" font-weight="900" fill="#e8417a" transform="rotate(-10 262 86)">GRRR</text><path d="M240 96 l10 -6 M244 106 l12 -2" stroke="#e8417a" stroke-width="3" stroke-linecap="round"/>`,
    b: () => fondo('#fff0c2', '#e8c79a') + nino(54, 90, { esc: 1.2, c: '#fffdf6', brazos: 'frente', pelo: '#3a2a1a' }) + nino(232, 84, { c: '#9bd84a', brazos: 'cruz', extra: `<ellipse cx="0" cy="34" rx="17" ry="13" fill="#9bd84a" ${st()}/>` }) + mesa(110, 180) + plato(138, 114)
      + `<path d="M196 106 h-30 m9 -8 l-9 8 l9 8" fill="none" ${st(3)}/><text x="262" y="70" font-size="15" font-weight="900" fill="${T}">uf</text>`,
  },
  lucia: {
    a: () => fondo('#dff4ff', '#c9b08a') + bocadillo(84, 14, '¡Lucía!') + nino(52, 88, { esc: 1.3, c: '#e8417a', brazos: 'frente', melena: true, pelo: '#3a2a1a' }) + nino(196, 92, { c: '#ffc531', pelo: '#1b1e3a', melena: true, cara: 'serio' }) + etiqueta(196, 60, 'LUCÍA') + papeles,
    b: () => fondo('#dff4ff', '#c9b08a') + nino(140, 92, { c: '#ffc531', pelo: '#1b1e3a', melena: true, brazos: 'frente', extra: `<path d="M27 16 L40 56" ${st(4)}/><path d="M32 54 h16 l4 9 h-24z" fill="#ffc531" ${st(2.5)}/>` }) + etiqueta(140, 60, 'LUCÍA')
      + `<rect x="232" y="112" width="14" height="11" fill="#fffdf6" ${st(2)} transform="rotate(-18 232 112)"/><rect x="250" y="108" width="14" height="11" fill="#fffdf6" ${st(2)} transform="rotate(12 250 108)"/><path d="M224 118 h48 l-6 40 h-36z" fill="#5ec3ff" ${st()}/>`,
  },
  paraguas: {
    a: () => fondo('#b9c7d9', '#8fa2b8') + `<path d="${lluvia}" stroke="#eaf3ff" stroke-width="2.5" stroke-linecap="round"/>` + [[46, '#e8417a', '#ffc531'], [118, '#9bd84a', '#ff8ac4'], [190, '#ffc531', '#5ec3ff'], [262, '#ff8a1f', '#9bd84a']].map(([x, c, p], i) => nino(x, 96, { c, melena: i % 2 === 1, extra: paraguas(p) })).join(''),
    b: () => fondo('#b9c7d9', '#8fa2b8') + `<path d="${lluvia}" stroke="#eaf3ff" stroke-width="2.5" stroke-linecap="round"/>` + [[46, '#e8417a', '#ffc531'], [118, '#7c9a3a', null], [190, '#ffc531', '#5ec3ff'], [262, '#c96a14', null]].map(([x, c, p], i) => nino(x, 96, p ? { c, extra: paraguas(p) } : { c, cara: 'triste', melena: i === 1, extra: gotas })).join('')
      + `<ellipse cx="118" cy="160" rx="24" ry="5" fill="#5ec3ff" ${st(2)}/><ellipse cx="262" cy="162" rx="22" ry="5" fill="#5ec3ff" ${st(2)}/>`,
  },
};
const bus = (x, y) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="120" height="58" rx="10" fill="#ffc531" ${st(3.5)}/><path d="M12 12 h26 v20 h-26z M46 12 h26 v20 h-26z M80 12 h28 v20 h-28z" fill="#dff4ff" ${st(2.5)}/><circle cx="28" cy="60" r="11" fill="${T}"/><circle cx="92" cy="60" r="11" fill="${T}"/><circle cx="28" cy="60" r="4" fill="#c9cbe0"/><circle cx="92" cy="60" r="4" fill="#c9cbe0"/></g>`;
const mochila = `<rect x="-34" y="-34" width="20" height="24" rx="6" fill="#e8417a" ${st(2.5)}/><path d="M-30 -34 q6 -9 12 0" fill="none" ${st(2.5)}/>`;
const puerta = `<rect x="14" y="26" width="70" height="116" fill="#a8693a" ${st()}/><circle cx="72" cy="88" r="4" fill="#ffc531" ${st(2)}/>`;
const hoja = (x, txt, examen) => `<g transform="translate(${x} 24)"><rect width="84" height="92" rx="5" fill="#fffdf6" ${st()}/><rect width="84" height="24" rx="5" fill="${examen ? '#e8417a' : '#5ec3ff'}" ${st()}/><text x="42" y="17" text-anchor="middle" font-size="13" font-weight="900" fill="${T}">${txt}</text>${examen ? `<g transform="rotate(-10 42 60)"><rect x="6" y="46" width="72" height="26" rx="5" fill="none" stroke="#d7263d" stroke-width="3.5"/><text x="42" y="65" text-anchor="middle" font-size="15" font-weight="900" fill="#d7263d">EXAMEN</text></g>` : `<path d="M16 46 h52 M16 60 h52 M16 74 h34" stroke="#c9cbe0" stroke-width="4" stroke-linecap="round"/>`}</g>`;
Object.assign(DIBUJOS, {
  espera: {
    a: () => fondo('#dff4ff', '#c9d6a8') + bocadillo(40, 22, '¡Eh!') + nino(70, 96, { c: '#ff8a1f', brazos: 'arriba', pelo: '#1b1e3a', extra: mochila }) + `<path d="M108 100 h20 M104 116 h26" ${st(3)}/>` + nino(226, 96, { c: '#9bd84a', melena: true }) + `<text x="252" y="74" font-size="22" font-weight="900" fill="${T}">?</text>`,
    b: () => fondo('#dff4ff', '#b9b9c6') + bus(186, 70) + `<path d="M150 84 h26 M144 102 h32 M152 120 h24" ${st(3)}/><circle cx="170" cy="136" r="7" fill="#c9cbe0"/><circle cx="156" cy="130" r="5" fill="#c9cbe0"/>` + nino(74, 98, { c: '#ff8a1f', cara: 'susto', brazos: 'arriba', pelo: '#1b1e3a', giro: 10 }),
  },
  prima: {
    a: () => fondo('#fff0c2', '#e8c79a') + puerta + nino(128, 98, { c: '#e8417a', melena: true }) + etiqueta(128, 62, 'PRIMA') + nino(200, 98, { c: '#5ec3ff', melena: true, pelo: '#1b1e3a', brazos: 'arriba' }) + etiqueta(200, 62, 'LOLA') + nino(272, 98, { c: '#9bd84a' }) + etiqueta(272, 62, 'JUAN'),
    b: () => fondo('#fff0c2', '#e8c79a') + puerta + nino(150, 98, { c: '#e8417a', melena: true, brazos: 'arriba' }) + etiqueta(150, 62, 'PRIMA LOLA') + nino(250, 98, { c: '#9bd84a' }) + etiqueta(250, 62, 'JUAN'),
  },
  examen: {
    a: () => fondo('#e6f7d0', '#c8dcae') + hoja(22, 'HOY', false) + hoja(120, 'MAÑANA', true) + nino(262, 98, { c: '#ffc531', pelo: '#1b1e3a', extra: `<path d="M16 -14 q6 -8 12 0 q-6 8 -12 0" fill="none" ${st(2)}/>` }),
    b: () => fondo('#e6f7d0', '#c8dcae') + hoja(22, 'HOY', true) + hoja(120, 'MAÑANA', false) + nino(262, 98, { c: '#ffc531', pelo: '#1b1e3a', cara: 'susto', brazos: 'arriba', extra: `<path d="M-24 -18 l-6 -6 M24 -18 l6 -6 M0 -22 v-8" ${st(2.5)}/>` }),
  },
});
const duda = () => fondo('#fffdf6', '#ecebe4') + `<path d="M40 60 q20 -30 40 0 t40 0 M200 120 q20 -30 40 0 t40 0" fill="none" stroke="#c9cbe0" stroke-width="5" stroke-linecap="round"/><text x="160" y="118" text-anchor="middle" font-size="96" font-weight="900" fill="#c9cbe0" stroke="${T}" stroke-width="3">¿?</text>`;

// comas: índice de la palabra que lleva la coma detrás. pide: lo que se le pide conseguir. dice: lo que significa.
export const FRASES = {
  comer: { pal: ['Vamos', 'a', 'comer', 'niños'], pista: '¿«Niños» es a quien le hablas, o es lo que se come?',
    lecturas: { a: { comas: [2], pide: 'Es la hora de comer y nadie corre peligro.', dice: 'llaman a los niños a comer.' }, b: { comas: [], pide: 'Lo dice un monstruo con mucha hambre.', dice: 'alguien se va a comer a unos niños.' } },
    explica: 'Con coma, **niños** es a quien le hablas: los llamas a la mesa. Sin coma, **niños** es lo que se come. Cuando llamas a alguien, su nombre va separado por coma.' },
  pintar: { pal: ['Tenemos', 'que', 'pintar', 'chicos'], pista: '¿Les hablas a los chicos, o los chicos son lo que se pinta?',
    lecturas: { a: { comas: [2], pide: 'Hay que pintar la pared entre todos.', dice: 'avisan a los chicos de que hay que pintar.' }, b: { comas: [], pide: 'Alguien va a acabar de color azul.', dice: 'hay que pintar a unos chicos.' } },
    explica: 'Con coma, **chicos** es a quien se lo dices. Sin coma, **chicos** es lo que hay que pintar. La coma separa a la persona a la que hablas.' },
  hambre: { antes: '—¿Te retiro ya el plato?', pal: ['No', 'tengo', 'hambre'], pista: 'Di la frase en voz alta de las dos maneras. ¿El «no» contesta a la pregunta, o niega el hambre?',
    lecturas: { a: { comas: [0], pide: '¡Que no se lleven el plato! Aún quiere comer.', dice: 'no quiere que le quiten el plato: tiene hambre.' }, b: { comas: [], pide: 'Ya está lleno: que se lleven el plato.', dice: 'ya no tiene hambre.' } },
    explica: 'Con coma, **No** es la respuesta entera («no me lo quites») y después viene otra idea: tengo hambre. Sin coma, el *no* niega el hambre.' },
  lucia: { pal: ['Lucía', 'recoge', 'la', 'clase'], pista: '¿Alguien le habla a Lucía, o alguien cuenta lo que hace Lucía?',
    lecturas: { a: { comas: [0], pide: 'La profe le da una orden a Lucía.', dice: 'le mandan a Lucía que recoja.' }, b: { comas: [], pide: 'Lucía ya está recogiendo. Nadie se lo ha pedido.', dice: 'cuentan que Lucía está recogiendo.' } },
    explica: 'Con coma le hablas **a Lucía** y le das una orden. Sin coma cuentas lo que **Lucía hace**. Entre quien hace algo y lo que hace no va coma: si la pones, cambias la frase.' },
  paraguas: { pal: ['Los', 'niños', 'que', 'llevaban', 'paraguas', 'no', 'se', 'mojaron'], pista: 'Una aclaración entre dos comas se puede quitar y la frase sigue en pie. ¿Todos llevaban paraguas, o solo algunos?',
    lecturas: { a: { comas: [1, 4], pide: 'Todos los niños llevaban paraguas. Ninguno se mojó.', dice: 'todos llevaban paraguas y ninguno se mojó.' }, b: { comas: [], pide: 'Solo se libraron los del paraguas. Los demás, empapados.', dice: 'solo los que llevaban paraguas no se mojaron.' } },
    explica: 'Entre comas, **que llevaban paraguas** es una aclaración sobre *todos* los niños. Sin comas, señala *solo a algunos*: los que llevaban paraguas. Dos comas pequeñas cambian cuántos niños se mojan.' },
};
Object.assign(FRASES, {
  espera: { pal: ['No', 'espera'], pista: '¿El «no» va por su cuenta, o está negando que alguien espere?',
    lecturas: { a: { comas: [0], pide: 'Se ha dejado la mochila y le gritan que no se vaya.', dice: 'le piden a alguien que espere.' }, b: { comas: [], pide: 'El autobús se va sin él.', dice: 'alguien no espera a nadie.' } },
    explica: 'Con coma, **No** va por un lado y **espera** es una orden: quédate. Sin coma, el *no* se pega al verbo y lo niega: no espera.' },
  prima: { pal: ['Vinieron', 'mi', 'prima', 'Lola', 'y', 'Juan'], pista: 'Cuenta personas. ¿«Lola» es el nombre de la prima, o es otra invitada?',
    lecturas: { a: { comas: [2], pide: 'A la puerta hay tres personas.', dice: 'vinieron tres: la prima, Lola y Juan.' }, b: { comas: [], pide: 'A la puerta hay dos personas.', dice: 'vinieron dos: la prima, que se llama Lola, y Juan.' } },
    explica: 'Con coma, **mi prima** y **Lola** son dos personas de una lista. Sin coma, *Lola* es el nombre de la prima. Una coma puede cambiar cuánta gente viene a merendar.' },
  examen: { antes: '—¿Cuándo es el examen?', pal: ['Hoy', 'no', 'mañana'], pista: 'El «no» se queda con la palabra que tiene al lado, sin coma por medio. ¿Con «hoy» o con «mañana»?',
    lecturas: { a: { comas: [1], pide: 'Hoy se libran: el examen es mañana.', dice: 'el examen es mañana.' }, b: { comas: [0], pide: 'No hay escapatoria: el examen es hoy.', dice: 'el examen es hoy.' } },
    explica: '**Hoy no, mañana**: el *no* se queda con *hoy*. **Hoy, no mañana**: el *no* se va con *mañana*. La misma coma, una palabra más allá, y el examen cambia de día.' },
});
export const vineta = (id, k) => `<svg viewBox="0 0 320 180" aria-hidden="true">${k && DIBUJOS[id]?.[k] ? DIBUJOS[id][k]() : duda()}</svg>`;
