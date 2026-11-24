// Motor «alcaldia»: Sociales, tema 2 (El cajón vota) · «Alcaldesa por un día».
// Gobiernas Villacajón, un pueblo de Madrid. Llegan peticiones de los vecinos, una a una, a la mesa:
//   · si es del ayuntamiento, la pagas (o la decides) tú, con la caja del pueblo;
//   · si es de otro gobierno, la mandas por carta: Comunidad de Madrid, Estado o Unión Europea.
// Si la mandas mal, la carta vuelve, la cola crece y los vecinos se enfadan. Si pagas lo que no es tuyo,
// el interventor (Boli) te lo para y explica por qué. Una obra grande del pueblo puede pedir un fondo europeo.
// Al final del día el mapa del pueblo queda lleno de banderitas de cuatro colores: todo está en tu pueblo,
// pero no todo lo lleva el ayuntamiento.
//
// Modos (todos con la misma mesa):
//   dia    → un día normal; generar: { destinos, n, f, min, trampa }
//   cole   → todas las peticiones son del colegio: el edificio (ayuntamiento) y los profes (Comunidad)
//   fondo  → la caja no llega para una obra grande: hay que pedir un fondo europeo y pagar el resto
import { el, svg, num, elige, barajar, suena } from './nucleo.js';
import { gsap } from './vendor/gsap.js';
import { espera, bote, temblor, vuela, chispasEn } from './efectos.js';
import { NIVELES } from './civica-comun.js';

const lento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const porFallos = (f) => (f === 0 ? 3 : f === 1 ? 2 : f === 2 ? 1 : 0);
const prueba = new URLSearchParams(location.search).has('prueba');

/* =========================================================================== quién es quién */
const A = 'ayto', C = 'comunidad', E = 'estado', U = 'ue', D = 'diputacion';
const QUIEN = {
  [A]: { nombre: 'Ayuntamiento', largo: 'el ayuntamiento', color: NIVELES.ayuntamiento.color, letra: 'A' },
  [C]: { nombre: 'Comunidad de Madrid', largo: 'la Comunidad de Madrid', color: NIVELES.comunidad.color, letra: 'C' },
  [E]: { nombre: 'Estado', largo: 'el Estado', color: NIVELES.estado.color, letra: 'E' },
  [U]: { nombre: 'Unión Europea', largo: 'la Unión Europea', color: NIVELES.ue.color, letra: 'UE' },
  [D]: { nombre: 'Diputación de Madrid', largo: 'la Diputación de Madrid', color: '#c9ccc6', letra: 'D' },
};
const RESUMEN = {
  [A]: '**Ayuntamiento**: calles, luz, basura, parques, agua, policía municipal, biblioteca, polideportivo, ayuda a los mayores y el edificio del cole.',
  [C]: '**Comunidad de Madrid**: los profes y los colegios, los centros de salud y los hospitales, muchas carreteras (las M-).',
  [E]: '**Estado**: DNI y pasaporte, pensiones, ejército, embajadas.',
  [U]: '**Unión Europea**: el euro, normas comunes para todos los países y fondos para obras.',
};
const DEVUELVE_DIPUTACION = 'La carta vuelve sin abrir: **en Madrid no hay diputación**. La Comunidad de Madrid tiene una sola provincia, así que la Comunidad hace también ese trabajo. Provincia y comunidad no son lo mismo: Castilla y León, por ejemplo, tiene nueve provincias.';

/* =========================================================================== peticiones */
// n: a quién le toca · coste: euros (null = no cuesta dinero) · sitio: dónde se ve en el mapa · arreglo: qué cambia en el dibujo
// tema: para las pistas · por: la explicación (se usa al acertar y al corregir)
const P = (o) => ({ f: 1, coste: null, ...o });
const BANCO = [
  // ---------------- ayuntamiento
  P({ id: 'farola', cosa: 'la farola', n: A, quien: 'Vecina de la calle Mayor', pide: 'Se ha fundido **la farola** de mi portal. Por la noche no se ve nada.', coste: 1500, sitio: 'farola', arreglo: 'farola', tema: 'el alumbrado de la calle', hecho: 'La farola vuelve a dar luz.', por: 'El **alumbrado** de las calles lo paga el **ayuntamiento**.' }),
  P({ id: 'basura', cosa: 'la basura', n: A, quien: 'El de la panadería', pide: 'Los **contenedores** de la plaza están a rebosar. Que el camión pase más a menudo.', coste: 3000, sitio: 'basura', arreglo: 'basura', tema: 'la basura', hecho: 'El camión pasa todas las noches.', por: 'Recoger la **basura** es trabajo del **ayuntamiento**.' }),
  P({ id: 'columpio', cosa: 'el columpio', n: A, quien: 'Una familia del barrio', pide: 'Se ha roto **el columpio** del parque.', coste: 2500, sitio: 'parque', arreglo: 'columpio', tema: 'los parques', hecho: 'Columpio nuevo.', por: 'Los **parques** del pueblo son del **ayuntamiento**.' }),
  P({ id: 'bache', cosa: 'el bache', n: A, quien: 'Un repartidor en bici', pide: 'Hay **un bache** enorme en la calle de la panadería.', coste: 2000, sitio: 'bache', arreglo: 'bache', tema: 'las calles del pueblo', hecho: 'Bache tapado.', por: 'Las **calles** del pueblo las arregla el **ayuntamiento**.' }),
  P({ id: 'fuente', cosa: 'la fuente', n: A, quien: 'Un abuelo de la plaza', pide: '**La fuente** de la plaza no echa agua desde el lunes.', coste: 1000, sitio: 'fuente', arreglo: 'fuente', tema: 'el agua del pueblo', hecho: 'La fuente vuelve a echar agua.', por: 'El **agua** y las fuentes del pueblo son cosa del **ayuntamiento**.' }),
  P({ id: 'biblio', cosa: 'la biblioteca los sábados', n: A, f: 2, quien: 'Un grupo de estudiantes', pide: 'Que **la biblioteca municipal** abra también los sábados.', coste: 3000, sitio: 'biblioteca', arreglo: 'biblioteca', tema: 'la biblioteca municipal', hecho: 'Abierta los sábados.', por: 'La biblioteca **municipal** lo dice en el nombre: es del **ayuntamiento** (municipio).' }),
  P({ id: 'canasta', cosa: 'la canasta del polideportivo', n: A, f: 2, quien: 'El club de baloncesto', pide: 'La canasta del **polideportivo** está rota.', coste: 1500, sitio: 'polideportivo', arreglo: 'canasta', tema: 'el polideportivo', hecho: 'Canasta nueva.', por: 'El **polideportivo** del pueblo es del **ayuntamiento**.' }),
  P({ id: 'policia', cosa: 'la policía a la salida del cole', n: A, f: 2, quien: 'La AMPA del cole', pide: 'A la salida del cole aparcan coches en el paso de cebra. Que venga **la policía municipal**.', coste: 2000, sitio: 'paso', arreglo: 'policia', tema: 'la policía municipal', hecho: 'Un policía municipal a la salida.', por: 'La policía **municipal** es del **ayuntamiento**. La Policía Nacional, la del DNI, es del Estado.' }),
  P({ id: 'ayuda', cosa: 'la ayuda a la abuela', n: A, f: 2, quien: 'Un vecino del 1.º', pide: 'Mi abuela vive sola y ya no puede hacer la compra. ¿Alguien que **la ayude en casa**?', coste: 2000, sitio: 'casa', tema: 'la ayuda a los mayores', hecho: 'Una cuidadora va a casa de la abuela.', por: 'La ayuda en casa a los mayores es de los **servicios sociales** del **ayuntamiento**. La pensión, en cambio, la paga el Estado.' }),
  P({ id: 'calle', cosa: 'el nombre de la calle', n: A, f: 3, quien: 'Las maestras jubiladas', pide: 'Que **la calle del cole** lleve el nombre de la primera maestra del pueblo.', sitio: 'paso', tema: 'el nombre de las calles', hecho: 'Calle nueva: «Maestra Carmen».', por: 'El **nombre de las calles** lo decide el **ayuntamiento**, en el pleno.' }),
  P({ id: 'fiestas', cosa: 'las fiestas', n: A, f: 3, quien: 'La peña del pueblo', pide: 'Que **las fiestas del pueblo** duren un día más.', coste: 4000, sitio: 'fuente', tema: 'las fiestas del pueblo', hecho: 'Un día más de fiestas.', por: 'Las **fiestas del pueblo** las organiza el **ayuntamiento**.' }),
  // el edificio del cole: ayuntamiento
  P({ id: 'persiana', cosa: 'la persiana del cole', n: A, f: 2, cole: 1, quien: 'La directora del cole', pide: 'En la clase de 5.º **una persiana** se ha roto y no baja: el sol da en la pizarra.', coste: 800, sitio: 'cole', arreglo: 'persiana', tema: 'el edificio del cole', hecho: 'Persiana arreglada.', por: 'Arreglar **el edificio** del cole (persianas, caldera, tejado, pintura) le toca al **ayuntamiento**.' }),
  P({ id: 'caldera', cosa: 'la caldera del cole', n: A, f: 2, cole: 1, quien: 'El conserje del cole', pide: 'La **caldera** del cole no funciona: las clases están heladas.', coste: 4000, sitio: 'cole', arreglo: 'caldera', tema: 'el edificio del cole', hecho: 'Caldera encendida.', por: 'La **caldera** es parte del **edificio** del cole: la arregla el **ayuntamiento**.' }),
  P({ id: 'goteras', cosa: 'las goteras del gimnasio', n: A, f: 2, cole: 1, quien: 'El profe de Educación Física', pide: 'Cuando llueve hay **goteras** en el tejado del gimnasio.', coste: 3000, sitio: 'cole', arreglo: 'tejado', tema: 'el edificio del cole', hecho: 'Tejado sin goteras.', por: 'El **tejado** es parte del **edificio** del cole: lo arregla el **ayuntamiento**.' }),
  P({ id: 'pintura', cosa: 'la pintura del cole', n: A, f: 3, cole: 1, quien: 'La AMPA del cole', pide: 'Las paredes del cole están **desconchadas**. Hay que pintarlas.', coste: 2500, sitio: 'cole', arreglo: 'pintura', tema: 'el edificio del cole', hecho: 'Paredes pintadas.', por: 'Pintar **el edificio** del cole le toca al **ayuntamiento**.' }),
  P({ id: 'valla', cosa: 'la valla del patio', n: A, f: 3, cole: 1, quien: 'Los de 6.º', pide: 'Hay un agujero en **la valla del patio** y se escapan los balones a la calle.', coste: 1500, sitio: 'valla', arreglo: 'valla', tema: 'el edificio del cole', hecho: 'Valla arreglada.', por: 'La **valla** del patio es parte del **edificio** del cole: la arregla el **ayuntamiento**.' }),
  // obras grandes: del ayuntamiento, pero se puede pedir un fondo europeo
  P({ id: 'obra-parque', cosa: 'el parque nuevo', n: A, f: 2, obra: 1, quien: 'Todo el barrio', pide: 'El parque viejo está hecho polvo: **renovarlo entero**, con árboles, bancos y juegos nuevos.', coste: 40000, sitio: 'parque', arreglo: 'obra-parque', tema: 'una obra grande del pueblo', hecho: 'Parque nuevo, con su cartel de fondos europeos.', por: 'El parque es del **ayuntamiento**, pero una obra así de grande puede llevar un **fondo europeo**.' }),
  P({ id: 'obra-plaza', cosa: 'la plaza sin escalones', n: A, f: 2, obra: 1, quien: 'Una vecina en silla de ruedas', pide: 'Quitar los escalones de la plaza para que **se pueda pasar con silla de ruedas y con carrito**.', coste: 30000, sitio: 'fuente', arreglo: 'obra-plaza', tema: 'una obra grande del pueblo', hecho: 'Plaza sin escalones, con su cartel de fondos europeos.', por: 'La plaza es del **ayuntamiento**, pero una obra así de grande puede llevar un **fondo europeo**.' }),
  // ---------------- Comunidad de Madrid
  P({ id: 'pediatra', cosa: 'la pediatra', n: C, quien: 'Una madre con un bebé', pide: 'En **el centro de salud** no hay pediatra por las tardes.', coste: 3500, sitio: 'salud', arreglo: 'medica', tema: 'la sanidad', hecho: 'Pediatra por las tardes.', por: 'Los **centros de salud** y los hospitales los lleva la **Comunidad de Madrid**.' }),
  P({ id: 'profe', cosa: 'la profe de inglés', n: C, cole: 1, quien: 'La AMPA del cole', pide: 'En el cole falta **una profe de inglés** desde septiembre.', coste: 2500, sitio: 'cole', arreglo: 'profe', tema: 'los profes', hecho: 'Profe de inglés nueva.', por: 'Los **profes** de los colegios públicos los pone la **Comunidad de Madrid**.' }),
  P({ id: 'apoyo', cosa: 'la profe de apoyo', n: C, f: 2, cole: 1, quien: 'La tutora de 3.º', pide: 'Hace falta **una profe de apoyo** para los que van más despacio.', coste: 2500, sitio: 'cole', arreglo: 'apoyo', tema: 'los profes', hecho: 'Profe de apoyo nueva.', por: 'Los **profes**, también los de apoyo, los contrata la **Comunidad de Madrid**.' }),
  P({ id: 'calendario', cosa: 'las vacaciones de Navidad', n: C, f: 3, cole: 1, quien: 'Los de 5.º', pide: 'Que **las vacaciones de Navidad** empiecen una semana antes.', sitio: 'cole', arreglo: 'calendario', tema: 'el calendario escolar', hecho: 'Respuesta: «Este curso no; lo estudiaremos».', por: 'El **calendario escolar** de los colegios de Madrid lo fija la **Comunidad de Madrid**, no cada pueblo.' }),
  P({ id: 'hospital', cosa: 'la consulta del hospital', n: C, f: 2, quien: 'Un enfermero', pide: 'Que **el hospital** de la zona abra la consulta de alergias también los martes.', coste: 3000, sitio: 'salud', tema: 'la sanidad', hecho: 'Consulta de alergias los martes.', por: 'Los **hospitales** son de la **Comunidad de Madrid**, aunque estén cerca de tu pueblo.' }),
  P({ id: 'carretera', cosa: 'la M-501', n: C, f: 2, quien: 'La conductora del autobús', pide: 'La carretera **M-501**, la que va al pueblo de al lado, está llena de baches.', coste: 5000, sitio: 'carretera', arreglo: 'carretera', tema: 'las carreteras que unen pueblos', hecho: 'M-501 asfaltada.', por: 'Muchas carreteras que unen pueblos son de la **Comunidad de Madrid**: por eso empiezan por **M**.' }),
  // ---------------- Estado
  P({ id: 'pasaporte', cosa: 'el pasaporte', n: E, quien: 'Una vecina que se va de viaje', pide: 'Me caduca **el pasaporte** y me voy a Perú dentro de un mes.', sitio: 'casa', tema: 'el pasaporte', hecho: 'Cita para el pasaporte.', por: 'El **pasaporte** y el **DNI** son iguales en toda España: los hace la Policía Nacional, del **Estado**.' }),
  P({ id: 'pension', cosa: 'la pensión', n: E, quien: 'Un abuelo recién jubilado', pide: '¿Quién me paga **la pensión** ahora que me he jubilado?', coste: 1200, sitio: 'casa', tema: 'las pensiones', hecho: 'Pensión en marcha.', por: 'Las **pensiones** las paga el **Estado**, igual en toda España.' }),
  P({ id: 'dni', cosa: 'el DNI', n: E, f: 2, quien: 'Un chico de 14 años', pide: 'Me tengo que hacer **el DNI** por primera vez.', sitio: 'casa', tema: 'el DNI', hecho: 'Cita para el DNI.', por: 'El **DNI** lo hace la Policía Nacional, que es del **Estado**. Es igual en toda España.' }),
  P({ id: 'ejercito', cosa: 'el ejército', n: E, f: 2, quien: 'Una chica de 18 años', pide: 'Quiero entrar en **el ejército**. ¿Quién me apunta?', sitio: 'casa', tema: 'el ejército', hecho: 'Información para entrar en el ejército.', por: 'El **ejército** es del **Estado**: defiende a todo el país.' }),
  P({ id: 'embajada', cosa: 'la embajada', n: E, f: 3, quien: 'La familia del 2.º', pide: 'Nuestro hijo ha perdido la cartera y el pasaporte en Japón. Que le ayude **la embajada de España**.', sitio: 'casa', tema: 'las embajadas', hecho: 'La embajada le ayuda.', por: 'Las **relaciones con otros países** y las embajadas son del **Estado**.' }),
  // ---------------- Unión Europea
  P({ id: 'cargador', cosa: 'el cargador común', n: U, f: 2, quien: 'Un chico con dos móviles', pide: 'Que todos los móviles nuevos usen **el mismo cargador**.', sitio: 'casa', tema: 'una norma para muchos países', hecho: 'Respuesta: «Ya hay una ley europea».', por: 'Lo decidió una **ley europea**: los móviles nuevos que se venden en la UE usan el mismo cargador, el USB-C.' }),
  P({ id: 'billete', cosa: 'los billetes de euro', n: U, f: 2, quien: 'Una coleccionista', pide: 'Que **los billetes de euro** tengan dibujos nuevos.', sitio: 'casa', tema: 'el euro', hecho: 'Respuesta: «Lo estamos preparando».', por: 'El **euro** lo compartimos con otros países de la **Unión Europea**: los billetes los decide el Banco Central Europeo.' }),
  P({ id: 'roaming', cosa: 'el móvil en Francia', n: U, f: 3, quien: 'Una familia que va a Francia', pide: 'Que no nos cobren más por usar **el móvil en Francia**.', sitio: 'casa', tema: 'una norma para muchos países', hecho: 'Respuesta: «Ya no se cobra más».', por: 'Es una **norma común europea**: dentro de la UE el móvil cuesta lo mismo que en casa.' }),
  P({ id: 'juguetes', cosa: 'la marca de los juguetes', n: U, f: 3, quien: 'El de la juguetería', pide: 'Que todos **los juguetes** que se venden lleven una marca que diga que son seguros.', sitio: 'basura', tema: 'una norma para muchos países', hecho: 'Respuesta: «Ya existe: la marca CE».', por: 'Ya existe: la **marca CE**. Es una norma común de la **Unión Europea**.' }),
];
const mismo = (a, b) => a.sitio === b.sitio && a.arreglo && a.arreglo === b.arreglo;

// no repetir peticiones dentro de una partida (se vacía cuando se agota)
const usadas = new Set();
function saca(lista, k) {
  let libres = lista.filter((x) => !usadas.has(x.id));
  if (libres.length < k) { lista.forEach((x) => usadas.delete(x.id)); libres = lista.slice(); }
  const out = [];
  for (const x of barajar(libres)) { if (out.length >= k) break; if (out.some((o) => mismo(o, x))) continue; out.push(x); usadas.add(x.id); }
  return out;
}
const redondea = (v, paso = 500) => Math.round(v / paso) * paso;

/* =========================================================================== generar */
export function generar(spec) {
  const d = structuredClone(spec);
  const g = typeof d.generar === 'object' ? d.generar : {};
  delete d.generar;
  const f = g.f ?? 3, min = g.min ?? 1;
  const destinos = d.modo === 'cole' ? [A, C] : g.destinos ?? [A, C, E, U];
  const n = g.n ?? 4;
  const vale = (p) => destinos.includes(p.n) && p.f <= f && !p.obra && (d.modo === 'cole' ? p.cole : true);
  const pool = BANCO.filter(vale);
  // reparto: al menos una del ayuntamiento y una que no lo sea; las de fuera, de gobiernos distintos si se puede
  const deA = pool.filter((p) => p.n === A);
  const nA = d.modo === 'cole' ? Math.ceil(n / 2) : Math.max(1, Math.min(n - 1, Math.round(n * 0.45)));
  // las difíciles primero (f >= min), para que el nivel se note
  const duras = (xs) => [...barajar(xs.filter((p) => p.f >= min)), ...barajar(xs.filter((p) => p.f < min))];
  let lista = saca(duras(deA), nA);
  const fuera = barajar(destinos.filter((x) => x !== A));
  for (let i = 0; lista.length < n && i < 12; i++) {
    const nivel = fuera[i % fuera.length];
    const [x] = saca(duras(pool.filter((p) => p.n === nivel && !lista.some((q) => q.id === p.id))), 1);
    if (x) lista.push(x);
  }
  lista = barajar(lista);
  d.destinos = destinos;
  d.trampa = !!g.trampa;
  d.mapa = d.modo === 'cole' ? 'cole' : 'pueblo';
  if (d.modo === 'fondo') {
    const obra = structuredClone(saca(BANCO.filter((p) => p.obra), 1)[0]);
    lista = lista.filter((p) => !(p.sitio === obra.sitio)).slice(0, n - 1);
    const pos = 1 + Math.floor(Math.random() * lista.length);
    lista.splice(pos, 0, obra);
    const pequenas = lista.filter((p) => p.n === A && !p.obra).reduce((s, p) => s + (p.coste || 0), 0);
    // te llega si pides el fondo (la mitad) y no te llega sin él (ni para la obra sola)
    const desde = pequenas + obra.coste / 2 + 500, hasta = Math.min(pequenas + obra.coste, obra.coste) - 500;
    d.caja = Math.min(hasta, redondea(desde + Math.random() * Math.max(0, hasta - desde)));
    d.fondo = obra.coste / 2;
  } else {
    const gasto = lista.filter((p) => p.n === A).reduce((s, p) => s + (p.coste || 0), 0);
    const mayor = Math.max(...lista.map((p) => p.coste || 0));
    d.caja = redondea(Math.max(gasto, mayor) + 2000 + Math.random() * 4000, 1000);
  }
  d.peticiones = lista.map((p) => structuredClone(p));
  return d;
}

/* =========================================================================== dibujos */
const T = '#1b1e3a';
const MONEDA = '<circle cx="12" cy="12" r="9" fill="#ffc531" stroke="#1b1e3a" stroke-width="2.4"/><circle cx="12" cy="12" r="5" fill="none" stroke="#c98f00" stroke-width="2"/>';
const SOBRE = (c = '#fffdf6') => `<rect x="2" y="5" width="20" height="14" rx="2" fill="${c}" stroke="#1b1e3a" stroke-width="2.2"/><path d="M3 6l9 7 9-7" fill="none" stroke="#1b1e3a" stroke-width="2.2" stroke-linejoin="round"/>`;
const CASITA = '<path d="M3 11 12 4l9 7v9H3z" fill="#fffdf6" stroke="#1b1e3a" stroke-width="2.2" stroke-linejoin="round"/><rect x="9.5" y="14" width="5" height="6" fill="#ffc531" stroke="#1b1e3a" stroke-width="1.8"/>';
const cara = (v) => `<circle cx="12" cy="12" r="10" fill="${v >= 7 ? '#9bd84a' : v >= 4 ? '#ffc531' : '#ff8fa3'}" stroke="#1b1e3a" stroke-width="2.2"/><circle cx="8.5" cy="10" r="1.5" fill="#1b1e3a"/><circle cx="15.5" cy="10" r="1.5" fill="#1b1e3a"/>${v >= 7 ? '<path d="M7.5 14q4.5 4 9 0" fill="none" stroke="#1b1e3a" stroke-width="2" stroke-linecap="round"/>' : v >= 4 ? '<path d="M8 15.5h8" stroke="#1b1e3a" stroke-width="2" stroke-linecap="round"/>' : '<path d="M7.5 17q4.5-4 9 0" fill="none" stroke="#1b1e3a" stroke-width="2" stroke-linecap="round"/>'}`;
const PAPELES = '<rect x="5" y="3" width="14" height="17" rx="2" fill="#fffdf6" stroke="#1b1e3a" stroke-width="2" transform="rotate(8 12 12)"/><rect x="4" y="4" width="14" height="17" rx="2" fill="#fffdf6" stroke="#1b1e3a" stroke-width="2.2"/><path d="M7 9h8M7 12h8M7 15h5" stroke="#1b1e3a" stroke-width="1.6" stroke-linecap="round"/>';
const ESTRELLAS_UE = (cx, cy, r, tam = 2.2) => Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<circle cx="${(cx + r * Math.cos(a)).toFixed(1)}" cy="${(cy + r * Math.sin(a)).toFixed(1)}" r="${tam}" fill="#ffc531"/>`; }).join('');

// el pueblo, de frente, como un recortable de cartulina
const PUEBLO = `
<defs><clipPath id="al-papel"><rect x="0" y="0" width="800" height="380" rx="16"/></clipPath></defs>
<g clip-path="url(#al-papel)">
<rect width="800" height="380" fill="#e4f3ff"/>
<path d="M0 205 q60-40 130-14 q70-50 160-10 q80-46 170-6 q90-40 180 0 q80-30 160 10 V262 H0z" fill="#cfe6a6" stroke="${T}" stroke-width="3" opacity=".7"/>
<rect y="262" width="800" height="118" fill="#bfe08f"/>
<rect y="262" width="800" height="40" fill="#e6dccb" stroke="${T}" stroke-width="3"/>
<path d="M0 282 H800" stroke="#fffdf6" stroke-width="4" stroke-dasharray="22 16"/>
<g class="al-s" data-s="paso"><g fill="#fffdf6" stroke="${T}" stroke-width="1.5">${[0, 1, 2, 3, 4].map((i) => `<rect x="${58 + i * 16}" y="264" width="9" height="36"/>`).join('')}</g>
  <g class="al-despues" data-a="policia"><g transform="translate(150 300)"><rect x="-8" y="-30" width="16" height="22" rx="4" fill="#2f5bd3" stroke="${T}" stroke-width="2.5"/><circle cy="-38" r="8" fill="#ffd8b0" stroke="${T}" stroke-width="2.5"/><path d="M-10 -44 h20 l-3 -6 h-14z" fill="#2f5bd3" stroke="${T}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-12 -44 h24" stroke="#ffc531" stroke-width="3"/><path d="M-5 -8 v12 M5 -8 v12" stroke="${T}" stroke-width="3"/></g></g></g>
<!-- cole -->
<g class="al-s" data-s="cole"><rect x="24" y="142" width="152" height="120" fill="#ffe9b8" stroke="${T}" stroke-width="3.5"/><path d="M16 146 L100 112 L184 146z" fill="#c4614f" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/>
  <rect x="70" y="122" width="60" height="16" rx="3" fill="#fffdf6" stroke="${T}" stroke-width="2.5"/><text x="100" y="135" text-anchor="middle" class="al-rotulo">COLE</text>
  ${[[38, 158], [84, 158], [130, 158], [38, 206], [130, 206]].map(([x, y]) => `<rect x="${x}" y="${y}" width="32" height="28" fill="#bfe8ff" stroke="${T}" stroke-width="2.5"/>`).join('')}
  <rect x="84" y="210" width="32" height="52" fill="#9b6b43" stroke="${T}" stroke-width="2.5"/></g>
<!-- centro de salud -->
<g class="al-s" data-s="salud"><rect x="192" y="166" width="108" height="96" fill="#f4f9ff" stroke="${T}" stroke-width="3.5"/><rect x="188" y="158" width="116" height="12" fill="#5ec3ff" stroke="${T}" stroke-width="3"/>
  <rect x="210" y="176" width="72" height="18" rx="3" fill="#fffdf6" stroke="${T}" stroke-width="2.5"/><text x="246" y="190" text-anchor="middle" class="al-rotulo">SALUD</text>
  <rect x="204" y="204" width="26" height="24" fill="#bfe8ff" stroke="${T}" stroke-width="2.5"/><rect x="262" y="204" width="26" height="24" fill="#bfe8ff" stroke="${T}" stroke-width="2.5"/><rect x="232" y="222" width="28" height="40" fill="#cfe8f7" stroke="${T}" stroke-width="2.5"/>
  <g class="al-despues" data-a="medica"><g transform="translate(278 262)"><rect x="-8" y="-28" width="16" height="22" rx="4" fill="#fffdf6" stroke="${T}" stroke-width="2.5"/><circle cy="-36" r="8" fill="#c98d64" stroke="${T}" stroke-width="2.5"/><path d="M-3 -24 q3 8 6 0" fill="none" stroke="#2f5bd3" stroke-width="2"/></g></g></g>
<!-- ayuntamiento -->
<g><rect x="316" y="128" width="168" height="134" fill="#f3e3c3" stroke="${T}" stroke-width="3.5"/><path d="M306 132 L400 82 L494 132z" fill="#f7ecd4" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/>
  <circle cx="400" cy="110" r="13" fill="#fffdf6" stroke="${T}" stroke-width="3"/><path d="M400 110 v-8 M400 110 h6" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M400 82 v-36" stroke="${T}" stroke-width="3"/><path d="M400 46 l28 7 -28 7z" fill="#ffc531" stroke="${T}" stroke-width="2.5" stroke-linejoin="round"/>
  ${[330, 362, 426, 458].map((x) => `<rect x="${x}" y="148" width="12" height="114" fill="#fffdf6" stroke="${T}" stroke-width="2.5"/>`).join('')}
  <rect x="380" y="200" width="40" height="62" rx="18" fill="#9b6b43" stroke="${T}" stroke-width="3"/>
  <rect x="340" y="166" width="120" height="18" rx="3" fill="#fffdf6" stroke="${T}" stroke-width="2.5"/><text x="400" y="180" text-anchor="middle" class="al-rotulo">AYUNTAMIENTO</text></g>
<!-- biblioteca -->
<g class="al-s" data-s="biblioteca"><rect x="500" y="172" width="96" height="90" fill="#e9eef7" stroke="${T}" stroke-width="3.5"/><path d="M494 176 h108 l-8 -14 h-92z" fill="#6d7aa8" stroke="${T}" stroke-width="3" stroke-linejoin="round"/>
  <rect x="508" y="182" width="80" height="16" rx="3" fill="#fffdf6" stroke="${T}" stroke-width="2.5"/><text x="548" y="194.5" text-anchor="middle" class="al-rotulo pequeno">BIBLIOTECA</text>
  <rect x="512" y="208" width="72" height="26" fill="#bfe8ff" stroke="${T}" stroke-width="2.5"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${516 + i * 11}" y="214" width="8" height="20" fill="${['#e8417a', '#2f5bd3', '#ffc531', '#9bd84a', '#ff8a1f', '#5ec3ff'][i]}" stroke="${T}" stroke-width="1.4"/>`).join('')}
  <rect x="534" y="238" width="28" height="24" fill="#9b6b43" stroke="${T}" stroke-width="2.5"/>
  <g class="al-despues" data-a="biblioteca"><rect x="566" y="238" width="34" height="18" rx="2" fill="#fff27a" stroke="${T}" stroke-width="2" transform="rotate(-6 583 247)"/><text x="583" y="251" text-anchor="middle" class="al-rotulo mini" transform="rotate(-6 583 247)">SÁB.</text></g></g>
<!-- polideportivo -->
<g class="al-s" data-s="polideportivo"><path d="M606 262 V198 q46 -32 92 0 V262z" fill="#ffe0c2" stroke="${T}" stroke-width="3.5"/><path d="M618 262 v-44 h68 v44" fill="none" stroke="${T}" stroke-width="2.5"/>
  <g transform="translate(694 206)"><path d="M0 62 V0" stroke="${T}" stroke-width="4"/><rect x="-2" y="-14" width="30" height="20" fill="#fffdf6" stroke="${T}" stroke-width="2.5"/>
    <g class="al-antes" data-a="canasta"><path d="M10 8 l14 16" stroke="#ff8a1f" stroke-width="4" stroke-linecap="round"/></g>
    <g class="al-despues" data-a="canasta"><ellipse cx="17" cy="8" rx="10" ry="3" fill="none" stroke="#ff8a1f" stroke-width="4"/><path d="M8 9 l3 12 M14 10 l1 12 M20 10 l-1 12 M26 9 l-3 12" stroke="${T}" stroke-width="1.4"/></g></g></g>
<!-- casas -->
<g class="al-s" data-s="casa"><rect x="728" y="196" width="60" height="66" fill="#fffdf6" stroke="${T}" stroke-width="3.5"/><path d="M720 200 L758 168 L796 200z" fill="#c4614f" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/>
  <rect x="738" y="208" width="18" height="18" fill="#bfe8ff" stroke="${T}" stroke-width="2.5"/><rect x="762" y="226" width="18" height="36" fill="#9b6b43" stroke="${T}" stroke-width="2.5"/><text x="747" y="246" text-anchor="middle" class="al-rotulo mini">n.º 3</text></g>
<!-- parque -->
<g class="al-s" data-s="parque">
  <g class="al-antes" data-a="obra-parque"><g transform="translate(60 340)"><path d="M0 0 v-40" stroke="#9b6b43" stroke-width="7"/><circle cy="-52" r="22" fill="#9bd84a" stroke="${T}" stroke-width="3"/></g>
    <g transform="translate(108 300)"><path d="M0 50 L20 0 L40 50 M20 0 H70 M70 0 L90 50 M70 0 L50 50" fill="none" stroke="${T}" stroke-width="4" stroke-linejoin="round"/>
      <g class="al-antes" data-a="columpio"><path d="M30 0 v26 M42 0 l14 24" stroke="${T}" stroke-width="2.4"/><rect x="26" y="26" width="18" height="5" fill="#e8417a" stroke="${T}" stroke-width="2" transform="rotate(30 35 28)"/></g>
      <g class="al-despues" data-a="columpio"><path d="M30 0 v30 M44 0 v30" stroke="${T}" stroke-width="2.4"/><rect x="26" y="30" width="22" height="5" fill="#e8417a" stroke="${T}" stroke-width="2"/></g></g></g>
  <g class="al-obra al-antes" data-a="obra-parque" data-solo-obra="1"><g transform="translate(16 304)">${[0, 1, 2, 3].map((i) => `<rect x="${i * 46}" y="0" width="44" height="22" fill="#fffdf6" stroke="${T}" stroke-width="2.5"/><path d="M${i * 46 + 6} 22 l14 -22 M${i * 46 + 24} 22 l14 -22" stroke="#ff8a1f" stroke-width="6"/>`).join('')}</g></g>
  <g class="al-despues" data-a="obra-parque"><g transform="translate(40 344)"><path d="M0 0 v-34" stroke="#9b6b43" stroke-width="7"/><circle cy="-48" r="24" fill="#6fbf3a" stroke="${T}" stroke-width="3"/><circle cx="-12" cy="-40" r="5" fill="#e8417a"/></g>
    <g transform="translate(150 344)"><path d="M0 0 v-34" stroke="#9b6b43" stroke-width="7"/><circle cy="-48" r="24" fill="#6fbf3a" stroke="${T}" stroke-width="3"/><circle cx="10" cy="-52" r="5" fill="#ffc531"/></g>
    <rect x="72" y="334" width="46" height="8" rx="2" fill="#c98d64" stroke="${T}" stroke-width="2.5"/><path d="M78 342 v10 M112 342 v10" stroke="${T}" stroke-width="3"/>
    <g transform="translate(184 318)"><path d="M0 40 V10" stroke="${T}" stroke-width="3"/><rect x="-26" y="-14" width="52" height="28" rx="3" fill="#2f5bd3" stroke="${T}" stroke-width="2.5"/>${ESTRELLAS_UE(0, 0, 9, 1.8)}</g></g>
</g>
<!-- farola -->
<g class="al-s" data-s="farola"><path d="M232 330 V250" stroke="${T}" stroke-width="5"/><path d="M232 252 q0 -10 14 -10" fill="none" stroke="${T}" stroke-width="5"/>
  <g class="al-antes" data-a="farola"><path d="M238 240 h24 l-4 12 h-16z" fill="#c9cbe0" stroke="${T}" stroke-width="3" stroke-linejoin="round"/></g>
  <g class="al-despues" data-a="farola"><circle cx="250" cy="258" r="24" fill="#ffe27a" opacity=".55"/><path d="M238 240 h24 l-4 12 h-16z" fill="#ffd23f" stroke="${T}" stroke-width="3" stroke-linejoin="round"/></g></g>
<!-- plaza y fuente -->
<g class="al-s" data-s="fuente">
  <g class="al-antes" data-a="obra-plaza"><g fill="#efe6d2" stroke="${T}" stroke-width="2.5"><rect x="320" y="302" width="160" height="10"/><rect x="330" y="312" width="140" height="10"/></g></g>
  <g class="al-despues" data-a="obra-plaza"><path d="M300 322 L330 302 H470 L500 322z" fill="#efe6d2" stroke="${T}" stroke-width="2.5" stroke-linejoin="round"/>
    <g transform="translate(520 318)"><path d="M0 40 V10" stroke="${T}" stroke-width="3"/><rect x="-26" y="-14" width="52" height="28" rx="3" fill="#2f5bd3" stroke="${T}" stroke-width="2.5"/>${ESTRELLAS_UE(0, 0, 9, 1.8)}</g></g>
  <ellipse cx="400" cy="350" rx="46" ry="12" fill="#9fd7ff" stroke="${T}" stroke-width="3"/><path d="M354 350 v-14 q46 12 92 0 v14" fill="#e9e2d0" stroke="${T}" stroke-width="3"/><path d="M400 336 v-26" stroke="${T}" stroke-width="5"/>
  <g class="al-despues" data-a="fuente"><path d="M400 312 q-22 -18 -36 22 M400 312 q22 -18 36 22" fill="none" stroke="#5ec3ff" stroke-width="4" stroke-linecap="round"/></g></g>
<!-- contenedores -->
<g class="al-s" data-s="basura"><g transform="translate(560 304)"><rect x="0" y="12" width="34" height="34" rx="3" fill="#9bd84a" stroke="${T}" stroke-width="3"/><rect x="38" y="12" width="34" height="34" rx="3" fill="#ffc531" stroke="${T}" stroke-width="3"/><path d="M-2 12 h38 M36 12 h38" stroke="${T}" stroke-width="4"/>
  <g class="al-antes" data-a="basura"><circle cx="10" cy="6" r="9" fill="#6d7290" stroke="${T}" stroke-width="2.5"/><circle cx="26" cy="2" r="8" fill="#4d5170" stroke="${T}" stroke-width="2.5"/><circle cx="50" cy="4" r="9" fill="#6d7290" stroke="${T}" stroke-width="2.5"/><circle cx="84" cy="40" r="8" fill="#4d5170" stroke="${T}" stroke-width="2.5"/></g></g></g>
<!-- baches -->
<g class="al-s" data-s="bache"><g class="al-antes" data-a="bache"><ellipse cx="520" cy="290" rx="18" ry="6" fill="#4d5170" stroke="${T}" stroke-width="2.5"/></g><g class="al-despues" data-a="bache"><ellipse cx="520" cy="290" rx="18" ry="6" fill="#d6cdbb" stroke="${T}" stroke-width="2" stroke-dasharray="4 3"/></g></g>
<g class="al-s" data-s="carretera"><g transform="translate(748 318)"><path d="M0 50 V0" stroke="${T}" stroke-width="4"/><rect x="-26" y="-22" width="52" height="24" rx="4" fill="#fffdf6" stroke="${T}" stroke-width="3"/><text x="0" y="-5" text-anchor="middle" class="al-rotulo">M-501</text></g>
  <g class="al-antes" data-a="carretera"><ellipse cx="700" cy="276" rx="12" ry="4" fill="#4d5170" stroke="${T}" stroke-width="2.5"/><ellipse cx="780" cy="292" rx="10" ry="4" fill="#4d5170" stroke="${T}" stroke-width="2.5"/></g></g>
</g>
<rect x="1.5" y="1.5" width="797" height="377" rx="16" fill="none" stroke="${T}" stroke-width="4"/>`;

// el cole por dentro y por fuera: el edificio (ayuntamiento) y lo que pasa dentro (Comunidad)
const COLE = `
<rect width="800" height="380" rx="16" fill="#e4f3ff"/>
<rect y="300" width="800" height="80" fill="#e6c9a0"/>
<path d="M90 92 L400 30 L710 92z" fill="#c4614f" stroke="${T}" stroke-width="4" stroke-linejoin="round"/>
<g class="al-s" data-s="tejado"><g class="al-antes" data-a="tejado">${[[600, 100], [632, 116], [612, 132]].map(([x, y]) => `<path d="M${x} ${y} q-6 10 0 14 q6 -4 0 -14z" fill="#5ec3ff" stroke="${T}" stroke-width="2"/>`).join('')}</g></g>
<g class="al-s" data-s="caldera"><rect x="180" y="34" width="34" height="50" fill="#c9cbe0" stroke="${T}" stroke-width="3.5"/>
  <g class="al-despues" data-a="caldera"><path d="M197 30 q-12 -12 0 -22 q12 -10 0 -22" fill="none" stroke="#c9cbe0" stroke-width="7" stroke-linecap="round"/></g></g>
<rect x="100" y="90" width="600" height="210" fill="#ffe9b8" stroke="${T}" stroke-width="4"/>
<g class="al-s" data-s="pintura"><g class="al-antes" data-a="pintura">${[[140, 250, 30, 18], [520, 130, 26, 16], [610, 250, 34, 20], [330, 268, 22, 14]].map(([x, y, w, h]) => `<path d="M${x} ${y} l${w * 0.6} -4 l${w * 0.4} ${h * 0.5} l-${w * 0.3} ${h * 0.5} l-${w * 0.7} -2z" fill="#f2d18d" stroke="${T}" stroke-width="2"/>`).join('')}</g></g>
<rect x="300" y="98" width="200" height="24" rx="4" fill="#fffdf6" stroke="${T}" stroke-width="3"/><text x="400" y="116" text-anchor="middle" class="al-rotulo">CEIP VILLACAJÓN</text>
<!-- aulas por dentro: la pared de delante recortada -->
${[[124, 'persiana', '5.º'], [264, 'profe', 'Inglés'], [544, 'apoyo', '3.º']].map(([x, k, rot]) => `<g class="al-s" data-s="${k}"><rect x="${x}" y="140" width="132" height="96" fill="#fff8e6" stroke="${T}" stroke-width="3.5"/><rect x="${x + 18}" y="152" width="62" height="34" fill="#2e7d5b" stroke="${T}" stroke-width="3"/><text x="${x + 49}" y="174" text-anchor="middle" class="al-rotulo tiza">${rot}</text>
  <rect x="${x + 12}" y="214" width="34" height="8" fill="#c98d64" stroke="${T}" stroke-width="2"/><rect x="${x + 70}" y="214" width="34" height="8" fill="#c98d64" stroke="${T}" stroke-width="2"/>
  ${k === 'persiana' ? `<g class="al-antes" data-a="persiana"><g transform="rotate(-9 ${x + 66} 140)">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${x + 4}" y="${142 + i * 9}" width="124" height="8" fill="#d9dbe6" stroke="${T}" stroke-width="1.6"/>`).join('')}</g><circle cx="${x + 110}" cy="200" r="14" fill="#ffe27a" opacity=".8"/></g>
    <g class="al-despues" data-a="persiana">${[0, 1, 2].map((i) => `<rect x="${x + 4}" y="${142 + i * 9}" width="124" height="8" fill="#d9dbe6" stroke="${T}" stroke-width="1.6"/>`).join('')}</g>` : ''}
  ${k !== 'persiana' ? `<g class="al-despues" data-a="${k}"><g transform="translate(${x + 108} 232)"><rect x="-9" y="-34" width="18" height="26" rx="5" fill="${k === 'profe' ? '#e8417a' : '#5ec3ff'}" stroke="${T}" stroke-width="2.5"/><circle cy="-44" r="9" fill="${k === 'profe' ? '#ffd8b0' : '#8a5a3c'}" stroke="${T}" stroke-width="2.5"/><path d="M-5 -8 v8 M5 -8 v8" stroke="${T}" stroke-width="3"/></g></g>` : ''}</g>`).join('')}
<!-- puerta y calendario -->
<rect x="420" y="214" width="56" height="86" fill="#9b6b43" stroke="${T}" stroke-width="3.5"/><circle cx="466" cy="260" r="3.5" fill="#ffc531" stroke="${T}" stroke-width="1.5"/>
<g class="al-s" data-s="calendario"><rect x="420" y="150" width="56" height="50" fill="#fffdf6" stroke="${T}" stroke-width="2.5"/><rect x="420" y="150" width="56" height="12" fill="#e8417a" stroke="${T}" stroke-width="2.5"/>${[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${426 + c * 12}" y="${167 + r * 8}" width="8" height="5" fill="#c9cbe0"/>`).join('')).join('')}
  <g class="al-despues" data-a="calendario"><circle cx="456" cy="186" r="9" fill="none" stroke="#e8417a" stroke-width="2.5"/></g></g>
<!-- la valla del patio -->
<g class="al-s" data-s="valla"><g transform="translate(704 236)"><path d="M0 64 V0 M96 64 V0 M0 10 H96 M0 54 H96" stroke="${T}" stroke-width="3.5"/>${[1, 2, 3, 4, 5].map((i) => `<path d="M${i * 16} 0 V64" stroke="${T}" stroke-width="2.5"/>`).join('')}
  <g class="al-antes" data-a="valla"><path d="M30 18 q18 -8 34 6 q-4 22 -18 24 q-20 -6 -16 -30z" fill="#e6c9a0" stroke="${T}" stroke-width="2.5"/><circle cx="84" cy="80" r="9" fill="#ff8a1f" stroke="${T}" stroke-width="2.5"/></g></g></g>
<!-- las dos muñecas: aparecen al final -->
<g class="al-munecas"><g transform="translate(100 316)"><rect width="300" height="34" rx="8" fill="${NIVELES.ayuntamiento.color}" stroke="${T}" stroke-width="3"/><text x="150" y="23" text-anchor="middle" class="al-rotulo">Por fuera, el edificio: ayuntamiento</text></g>
  <g transform="translate(410 316)"><rect width="300" height="34" rx="8" fill="${NIVELES.comunidad.color}" stroke="${T}" stroke-width="3"/><text x="150" y="23" text-anchor="middle" class="al-rotulo">Por dentro, los profes: Comunidad</text></g></g>
<rect x="1.5" y="1.5" width="797" height="377" rx="16" fill="none" stroke="${T}" stroke-width="4"/>`;

// dónde se clava la banderita de cada sitio
const ANCLA = {
  pueblo: { farola: [232, 244], basura: [596, 300], parque: [130, 298], bache: [520, 284], fuente: [400, 300], biblioteca: [548, 168], polideportivo: [652, 190], paso: [96, 262], casa: [758, 166], cole: [100, 112], salud: [246, 158], carretera: [748, 294], valla: [40, 300] },
  cole: { persiana: [238, 162], profe: [378, 162], apoyo: [658, 162], caldera: [197, 34], tejado: [620, 92], pintura: [150, 246], valla: [752, 236], calendario: [448, 150], cole: [400, 98] },
};
const sitioDe = (p, mapa) => (mapa === 'cole' ? (p.arreglo && ANCLA.cole[p.arreglo] ? p.arreglo : 'cole') : p.sitio);

/* =========================================================================== la portada: el mapa del pueblo clavado */
(function portadaPropia() {
  const html = `<div class="arte al-arte" aria-hidden="true"><div class="al-arte-mapa">${svg('0 0 800 380', PUEBLO).outerHTML}</div><span class="al-arte-rotulo">VILLACAJÓN</span>
    <span class="al-arte-chincheta c1"></span><span class="al-arte-chincheta c2"></span>
    <div class="abertura"><span class="pieza pz1">${svg('0 0 24 24', SOBRE('#ffd9b0')).outerHTML}</span><span class="pieza pz2">${svg('0 0 24 24', MONEDA).outerHTML}</span><span class="pieza pz3">${svg('0 0 24 24', SOBRE('#cfeaff')).outerHTML}</span></div></div>`;
  const mo = new MutationObserver(() => {
    const a = document.querySelector('.portada-arte');
    if (!a || a.dataset.propia) return;
    a.dataset.propia = '1'; a.innerHTML = html; mo.disconnect();
    a.querySelectorAll('.al-s, .al-antes, .al-despues').forEach((g) => g.classList.add('hecho'));
    if (!lento()) {
      const pz = a.querySelectorAll('.abertura .pieza');
      gsap.from(pz, { y: 40, opacity: 0, duration: 0.5, ease: 'back.out(2)', stagger: 0.12, delay: 0.7 });
      gsap.to(pz, { y: '-=8', duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.3, delay: 1.4 });
    }
  });
  mo.observe(document.body, { childList: true });
  setTimeout(() => mo.disconnect(), 15000);
})();

/* =========================================================================== la ronda */
export function ronda(d, ctx) {
  const dia = ctx.ronda + 1;
  const cola = d.peticiones.map((p, i) => ({ ...p, k: i, tachados: [], fondoPedido: false, coste0: p.coste }));
  const destinos = d.destinos.filter((x) => x !== A);
  const buzones = d.trampa ? [...destinos.slice(0, 1), D, ...destinos.slice(1)] : destinos;
  let caja = d.caja, vecinos = 6, errores = 0, ocupado = false;
  const fallos = [], resueltas = [];

  ctx.reto(d.modo === 'cole' ? `Hoy todas las peticiones son **del cole**. Pero el cole lo cuidan **dos gobiernos**.`
    : d.modo === 'fondo' ? `**Día ${dia}.** En la caja hay **${num(caja)} €**. Hoy llega **una obra grande** que cuesta más de lo que tienes.`
    : `**Día ${dia}** en el ayuntamiento. Tienes **${cola.length} peticiones** en la mesa.`);
  ctx.pista(d.pista ?? (d.modo === 'fondo' ? 'Lo del ayuntamiento se paga con la caja. Lo demás, por carta. Y para la obra grande, busca quién más pone dinero.' : 'Si es del ayuntamiento, págalo con la caja del pueblo. Si no, mándalo por carta a quien le toca.'));

  // ---------- marcadores
  const vCaja = el('b', { class: 'al-valor', text: num(caja) + ' €' });
  const iCara = el('span', { class: 'al-icono', html: svg('0 0 24 24', cara(vecinos)).outerHTML });
  const barra = el('span', { class: 'al-barra', 'aria-hidden': 'true' }, Array.from({ length: 10 }, () => el('i')));
  const vVec = el('b', { class: 'al-valor al-vec-txt' });
  const vCola = el('b', { class: 'al-valor' });
  const mCaja = el('div', { class: 'al-marcador caja' }, el('span', { class: 'al-icono', html: svg('0 0 24 24', MONEDA).outerHTML }), el('span', { class: 'al-marcador-txt' }, el('small', { text: 'Caja del ayuntamiento' }), vCaja));
  const mVec = el('div', { class: 'al-marcador vecinos' }, iCara, el('span', { class: 'al-marcador-txt' }, el('small', { text: 'Vecinos contentos' }), el('span', { class: 'al-fila' }, barra, vVec)));
  const mCola = el('div', { class: 'al-marcador cola' }, el('span', { class: 'al-icono', html: svg('0 0 24 24', PAPELES).outerHTML }), el('span', { class: 'al-marcador-txt' }, el('small', { text: 'Peticiones en la mesa' }), vCola));
  const marcadores = el('div', { class: 'al-marcadores', role: 'group', 'aria-label': 'Marcadores' }, mCaja, mVec, mCola);
  const pintaVecinos = () => {
    iCara.innerHTML = svg('0 0 24 24', cara(vecinos)).outerHTML;
    barra.querySelectorAll('i').forEach((x, j) => (x.className = j < vecinos ? (vecinos >= 7 ? 'on bien' : vecinos >= 4 ? 'on' : 'on mal') : ''));
    vVec.textContent = vecinos >= 7 ? 'Contentos' : vecinos >= 4 ? 'Regular' : 'Enfadados';
  };
  const pintaCola = () => { const q = cola.length; vCola.textContent = q === 0 ? 'Ninguna' : `${q} por resolver`; };
  pintaVecinos(); pintaCola();

  // ---------- el mapa
  const mapaSvg = svg('0 0 800 380', d.mapa === 'cole' ? COLE : PUEBLO, { class: 'al-mapa-svg', role: 'img', 'aria-label': d.mapa === 'cole' ? 'El colegio por dentro y por fuera' : 'El mapa del pueblo' });
  mapaSvg.removeAttribute('aria-hidden');
  const capaPins = document.createElementNS('http://www.w3.org/2000/svg', 'g'); capaPins.setAttribute('class', 'al-pins');
  mapaSvg.append(capaPins);
  const mapa = el('div', { class: 'al-mapa' + (d.mapa === 'cole' ? ' cole' : '') + (cola.some((p) => p.id === 'obra-parque') ? ' obra-parque' : '') }, mapaSvg, el('span', { class: 'al-mapa-rotulo', text: d.mapa === 'cole' ? 'EL COLE' : 'VILLACAJÓN' }));
  const pinsEn = {};
  const ancla = (p) => ANCLA[d.mapa][sitioDe(p, d.mapa)] ?? [400, 200];
  const pintaPendientes = (actual) => {
    capaPins.querySelectorAll('.al-aviso').forEach((x) => x.remove());
    const vistos = new Set();
    for (const p of cola) {
      const s = sitioDe(p, d.mapa); if (vistos.has(s)) continue; vistos.add(s);
      const [x, y] = ancla(p);
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'al-aviso' + (actual && sitioDe(actual, d.mapa) === s ? ' ahora' : ''));
      g.setAttribute('transform', `translate(${x + 14} ${y - 22})`);
      g.innerHTML = `<g class="al-aviso-in"><circle r="13" fill="#fffdf6" stroke="${T}" stroke-width="3"/><text y="6" text-anchor="middle" class="al-rotulo grande">!</text></g>`;
      capaPins.append(g);
    }
  };
  const clava = (p, quien) => {
    const s = sitioDe(p, d.mapa), [x, y] = ancla(p);
    const k = (pinsEn[s] = (pinsEn[s] ?? 0) + 1) - 1;
    const Q = QUIEN[quien];
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'al-pin');
    g.setAttribute('transform', `translate(${x - k * 20} ${y})`);
    const w = Q.letra.length > 1 ? 34 : 26;
    g.innerHTML = `<path d="M0 0 V-40" stroke="${T}" stroke-width="3"/><path d="M0 -40 H${w} l-6 9 6 9 H0z" fill="${Q.color}" stroke="${T}" stroke-width="2.5" stroke-linejoin="round"/><text x="${w / 2 - 2}" y="-26" text-anchor="middle" class="al-rotulo pin">${Q.letra}</text><circle r="4" fill="${T}"/>`;
    capaPins.append(g);
    if (!lento()) gsap.from(g, { y: -60, opacity: 0, duration: 0.5, ease: 'bounce.out' });
    if (p.arreglo) {
      mapaSvg.querySelectorAll(`[data-a="${p.arreglo}"]`).forEach((n) => n.classList.add('hecho'));
      if (!lento()) mapaSvg.querySelectorAll(`.al-despues[data-a="${p.arreglo}"]`).forEach((n) => gsap.from(n, { scale: 0.4, opacity: 0, transformOrigin: '50% 100%', duration: 0.5, ease: 'back.out(2)' }));
    }
  };

  // ---------- la mesa: la petición de ahora y lo que puedes hacer
  const hoja = el('article', { class: 'al-peticion', 'aria-live': 'polite' });
  const btnAyto = el('button', { type: 'button', class: 'al-accion al-ayto', 'data-accion': 'pagar' });
  const btnBuzones = buzones.map((b) => el('button', { type: 'button', class: 'al-accion al-buzon' + (b === D ? ' al-dipu' : ''), 'data-accion': b, style: { '--c': QUIEN[b].color } },
    el('span', { class: 'al-sobre', html: svg('0 0 24 24', SOBRE()).outerHTML }), el('span', { class: 'al-accion-txt' }, el('small', { text: 'Carta a' }), el('b', { text: b === U ? 'la Unión Europea' : b === E ? 'el Estado' : b === D ? 'la Diputación de Madrid' : 'la Comunidad de Madrid' }))));
  const decide = el('div', { class: 'al-decide' }, btnAyto, el('div', { class: 'al-buzones' + (buzones.length > 3 ? ' cuatro' : '') }, btnBuzones));
  const mesa = el('div', { class: 'al-mesa' }, hoja, decide);
  ctx.escenario.append(el('div', { class: 'al-tablero' }, marcadores, el('div', { class: 'al-cuerpo' }, mesa, mapa)));

  const nombre = (b) => QUIEN[b].largo;
  const pintaHoja = (p) => {
    const obra = p.obra && !p.fondoPedido;
    hoja.replaceChildren(...[
      el('header', {}, el('span', { class: 'al-quien', html: svg('0 0 24 24', CASITA).outerHTML + `<span>${p.quien}</span>` }),
        el('span', { class: 'al-coste' + (p.coste == null ? ' gratis' : '') }, p.coste == null ? 'No cuesta dinero' : `Cuesta ${num(p.coste)} €`)),
      el('p', { class: 'al-pide' }, ...marcaHTML(p.pide)),
      !!(p.obra || p.tachados.length) && el('div', { class: 'al-etiquetas' },
        !!p.obra && el('span', { class: 'al-etq obra', text: 'Obra grande' }),
        p.fondoPedido && el('span', { class: 'al-etq fondo', text: `Fondo europeo: la UE pone ${num(d.fondo)} €` }),
        p.tachados.length > 0 && el('span', { class: 'al-etq devuelta', text: p.tachados.length > 1 ? `Devuelta ${p.tachados.length} veces` : 'Devuelta' }))].filter(Boolean));
    btnAyto.replaceChildren(el('span', { class: 'al-sobre', html: svg('0 0 24 24', MONEDA).outerHTML }),
      el('span', { class: 'al-accion-txt' }, el('small', { text: 'Lo hace el ayuntamiento' }), el('b', { text: p.coste == null ? 'Lo decido yo' : `Pagar ${num(p.coste)} €` })));
    btnAyto.disabled = p.tachados.includes(A);
    btnBuzones.forEach((b) => { const id = b.dataset.accion; b.disabled = p.tachados.includes(id) || (id === U && p.fondoPedido); b.classList.toggle('tachado', p.tachados.includes(id)); });
    btnAyto.classList.toggle('tachado', p.tachados.includes(A));
    if (!lento()) gsap.from(hoja, { x: 60, rotation: 4, opacity: 0, duration: 0.4, ease: 'back.out(1.6)' });
    pintaPendientes(p);
    // pistas de esta petición
    const opciones = [A, ...buzones];
    const malas = opciones.filter((o) => o !== p.n && !(p.obra && !p.fondoPedido && o === U));
    const tipo = (o) => (o === A ? 'del ayuntamiento' : o === C ? 'de la Comunidad de Madrid' : o === E ? 'del Estado' : o === U ? 'de la Unión Europea' : 'de la Diputación');
    const descartes = barajar(malas).slice(0, Math.max(1, opciones.length - 2));
    ctx.pistas([
      { texto: `Fíjate en qué piden: **${p.tema}**. ¿Es algo de las calles y el pueblo${d.destinos.includes(C) ? ', de toda la Comunidad de Madrid' : ''}${d.destinos.includes(E) ? ', de toda España' : ''}${d.destinos.includes(U) ? ' o de toda Europa' : ''}?` },
      { texto: [A, ...d.destinos.filter((x) => x !== A)].map((x) => RESUMEN[x]).join(' ') + (d.trampa ? ' Y en Madrid, ¿hay diputación?' : '') },
      { texto: p.obra && !p.fondoPedido ? 'La obra es del **ayuntamiento**, pero no te llega. Hay fondos de la **Unión Europea** para obras así: pídelos por carta y luego paga el resto.' : opciones.length <= 2 ? `Es cosa de **${p.tema}**: ${p.n === A ? 'algo de la calle y del pueblo.' : 'algo que se organiza para toda la región, no pueblo a pueblo.'}` : `No es ${descartes.map(tipo).join(' ni ')}.` },
    ]);
  };

  const actual = () => cola[0];
  const siguiente = async () => {
    pintaCola();
    if (!cola.length) return cierra();
    pintaHoja(actual());
    ocupado = false;
  };

  const sumaVecinos = (dv) => { vecinos = Math.max(0, Math.min(10, vecinos + dv)); pintaVecinos(); dv > 0 ? bote(mVec, 6) : temblor(mVec, 6); };
  const resuelve = async (p, quien, txt) => {
    cola.shift();
    resueltas.push({ p, quien });
    clava(p, quien);
    sumaVecinos(1);
    suena('bien');
    ctx.aviso(`${p.hecho} ${txt.replace(/\*\*/g, '')}`);
    await espera(1300);
    siguiente();
  };
  const devuelve = async (p, quien, motivo) => {
    errores++;
    p.tachados.push(quien);
    fallos.push({ p, quien });
    cola.shift(); cola.push(p);
    sumaVecinos(-2);
    suena('mal');
    pintaCola(); bote(mCola, 8);
    ctx.aviso(motivo.replace(/\*\*/g, ''), true);
    hoja.append(el('div', { class: 'al-sello', text: quien === A ? 'PARADO' : 'DEVUELTA' }));
    if (!lento()) gsap.from(hoja.querySelector('.al-sello'), { scale: 2.6, rotation: -30, opacity: 0, duration: 0.35, ease: 'power3.in' });
    temblor(hoja, 8);
    await espera(2400);
    siguiente();
  };

  // el dinero sale de la caja y vuela al sitio
  const pagaVisual = async (p) => {
    const destino = mapaSvg.querySelector(`.al-s[data-s="${sitioDe(p, d.mapa)}"]`) ?? mapa;
    for (let i = 0; i < 3; i++) { vuela(mCaja.querySelector('.al-icono'), destino, el('span', { class: 'al-volador', html: svg('0 0 24 24', MONEDA).outerHTML }), { ms: 600, escala: 0.8 }); await espera(90); }
    const antes = caja; caja -= p.coste || 0;
    if (p.coste) cuenta(vCaja, antes, caja);
    await espera(450);
  };
  const cartaVisual = async (b, vuelve) => {
    const s = el('span', { class: 'al-volador', html: svg('0 0 24 24', SOBRE()).outerHTML });
    await new Promise((ok) => vuela(hoja, b, s, { ms: 520, escala: 0.4, alFinal: ok }));
    if (vuelve) { await espera(150); await new Promise((ok) => vuela(b, hoja, el('span', { class: 'al-volador', html: svg('0 0 24 24', SOBRE('#ffd9e3')).outerHTML }), { ms: 520, escala: 2, alFinal: ok })); }
  };

  const pagar = async () => {
    if (ocupado || !cola.length) return;
    const p = actual();
    if (p.n !== A) {
      ocupado = true; suena('selloMal');
      // en pantallas estrechas el bocadillo taparía los buzones: allí basta con el aviso
      if (innerWidth > 760) ctx.di(`Alto ahí. Soy el interventor y esto **no sale de la caja del pueblo**.`, 'animo', 3500);
      return devuelve(p, A, `El interventor lo para: esto no lo paga el ayuntamiento. ${p.por} Mándalo por carta.`);
    }
    if ((p.coste || 0) > caja) {
      suena('mal'); temblor(mCaja, 6);
      return ctx.aviso(`En la caja hay ${num(caja)} € y esto cuesta ${num(p.coste)} €. Así no te llega.`, true);
    }
    ocupado = true; suena('clic');
    await pagaVisual(p);
    resuelve(p, A, p.coste ? `Pagado con la caja del pueblo: ${p.por}` : p.por);
  };
  const carta = async (b) => {
    if (ocupado || !cola.length) return;
    const p = actual(), quien = b.dataset.accion;
    ocupado = true; suena('salto');
    // la obra grande: la UE pone la mitad y la petición vuelve a la mesa para pagar el resto
    if (p.obra && quien === U && !p.fondoPedido) {
      await cartaVisual(b, false);
      p.fondoPedido = true; p.coste = p.coste0 - d.fondo;
      suena('bien'); chispasEn(hoja, 12, NIVELES.ue.color);
      ctx.aviso(`La Unión Europea aprueba el fondo: pone ${num(d.fondo)} €. El resto, ${num(p.coste)} €, lo paga el ayuntamiento.`);
      pintaHoja(p); ocupado = false;
      return;
    }
    const ok = quien === p.n;
    await cartaVisual(b, !ok);
    if (ok) return resuelve(p, quien, `${QUIEN[quien].nombre} responde: «Es nuestro». ${p.por}`);
    const motivo = quien === D ? `${DEVUELVE_DIPUTACION} ${p.por}`
      : p.n === A ? `${QUIEN[quien].nombre} te la devuelve: «Esto es vuestro». ${p.por}` + (quien === U && !p.obra ? ' Los fondos europeos son para obras grandes, no para esto.' : '')
      : `${QUIEN[quien].nombre} te la devuelve: «No es nuestro». ${p.por}`;
    devuelve(p, quien, motivo);
  };
  btnAyto.onclick = pagar;
  btnBuzones.forEach((b) => (b.onclick = () => carta(b)));

  const cierra = () => {
    ctx.aviso('');
    capaPins.querySelectorAll('.al-aviso').forEach((x) => x.remove());
    hoja.replaceChildren(el('p', { class: 'al-pide fin', text: d.mapa === 'cole' ? 'Mesa vacía. Mira el cole: banderitas de dos colores.' : 'Mesa vacía. Mira el mapa: cada banderita dice quién se ha encargado.' }));
    decide.hidden = true;
    mapa.classList.add('fin');
    const colores = new Set(resueltas.map((r) => r.quien)).size;
    const deAyto = resueltas.filter((r) => r.quien === A).map((r) => r.p.cosa);
    let msg;
    if (!errores) msg = `**Ni una carta devuelta.** ` + (d.mapa === 'cole' ? 'El edificio (persianas, caldera, tejado…) lo cuida el **ayuntamiento**; los profes y las clases, la **Comunidad de Madrid**. Un cole, dos gobiernos.' : `Con la caja del pueblo has pagado ${listaY(deAyto)}; lo demás, por carta. En un solo pueblo hay banderitas de **${colores} colores**.`);
    else msg = `**${errores} ${errores === 1 ? 'error' : 'errores'}.** ` + fallos.slice(0, 3).map(({ p, quien }) => quien === A ? `${may(p.cosa)}: lo quisiste pagar tú, pero es ${DE[p.n]}.` : quien === D ? `${may(p.cosa)}: lo mandaste a la Diputación, y en Madrid no hay.` : `${may(p.cosa)}: es ${DE[p.n]}, no ${DE[quien]}.`).join(' ');
    if (d.modo === 'fondo') msg += ` Con el fondo europeo, la obra ha costado al pueblo ${num(d.fondo)} € en vez de ${num(d.fondo * 2)} €.`;
    else if (deAyto.length && caja !== d.caja) msg += ` En la caja quedan ${num(caja)} €.`;
    ctx.fin(porFallos(errores), msg);
  };

  if (prueba) window.__sol = () => { const p = actual(); if (!p) return null; if (p.obra && !p.fondoPedido) return U; return p.n === A ? 'pagar' : p.n; };
  siguiente();
}

/* =========================================================================== ayudas */
function cuenta(nodo, de, a, ms = 650) {
  if (lento()) { nodo.textContent = num(a) + ' €'; return; }
  const t0 = performance.now();
  const paso = (t) => { const f = Math.min(1, (t - t0) / ms); nodo.textContent = num(Math.round((de + (a - de) * (1 - (1 - f) ** 3)) / 10) * 10) + ' €'; if (f < 1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
}
const DE = { [A]: 'del ayuntamiento', [C]: 'de la Comunidad de Madrid', [E]: 'del Estado', [U]: 'de la Unión Europea', [D]: 'de la Diputación' };
const may = (t) => t.charAt(0).toUpperCase() + t.slice(1);
function listaY(xs) { const u = [...new Set(xs)]; return u.length <= 1 ? u.join('') : u.slice(0, -1).join(', ') + ' y ' + u.at(-1); }
function marcaHTML(t) { return String(t).split(/\*\*(.+?)\*\*/g).map((x, i) => (i % 2 ? el('b', { text: x }) : x)); }
