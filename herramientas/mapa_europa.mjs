// Genera public/juegos/motores/mapa-europa.js: un mapa de Europa estático y tocable (para «La ley del cargador»
// y para cualquier otro juego que lo necesite). Se ejecuta una sola vez; el resultado no tiene dependencias.
//
// Datos: Natural Earth 1:50m (dominio público) vía npm world-atlas. Las dependencias se instalan FUERA del repo:
//   cd /home/claude/_deps && npm i world-atlas@2 topojson-client@3 topojson-simplify@3 d3-geo@3 polylabel@1
// Uso: node herramientas/mapa_europa.mjs /home/claude/_deps/node_modules
//
// Cada país lleva: id (ISO), nombre en castellano, ue (miembro de la UE), euro (paga en euros), d (camino SVG),
// x/y (punto para la etiqueta, dentro del país) y pequeno (demasiado pequeño para tocarlo: el motor le pone un botón).
// UE: 27 países (2026). Euro: 21 de la UE (Bulgaria desde el 1-1-2026) y, fuera de la UE, Andorra, Mónaco,
// San Marino, el Vaticano (demasiado pequeño: no se dibuja), Montenegro y Kosovo.

import { createRequire } from 'node:module';
import { writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const NM = resolve(process.argv[2] || '/home/claude/_deps/node_modules');
const SALIDA = resolve(process.argv[3] || new URL('../public/juegos/motores/mapa-europa.js', import.meta.url).pathname);
const req = createRequire(join(NM, 'x.js'));
const imp = (p) => import(pathToFileURL(req.resolve(p)).href);
const topojson = await imp('topojson-client');
const simp = await imp('topojson-simplify');
const d3 = await imp('d3-geo');
const polylabel = req('polylabel');
const mundo = JSON.parse(readFileSync(req.resolve('world-atlas/countries-50m.json'), 'utf8'));

// nombre en world-atlas → [id, nombre, UE, euro]
const PAISES = {
  Germany: ['DE', 'Alemania', 1, 1], Austria: ['AT', 'Austria', 1, 1], Belgium: ['BE', 'Bélgica', 1, 1], Bulgaria: ['BG', 'Bulgaria', 1, 1],
  Cyprus: ['CY', 'Chipre', 1, 1], Croatia: ['HR', 'Croacia', 1, 1], Denmark: ['DK', 'Dinamarca', 1, 0], Slovakia: ['SK', 'Eslovaquia', 1, 1],
  Slovenia: ['SI', 'Eslovenia', 1, 1], Spain: ['ES', 'España', 1, 1], Estonia: ['EE', 'Estonia', 1, 1], Finland: ['FI', 'Finlandia', 1, 1],
  France: ['FR', 'Francia', 1, 1], Greece: ['GR', 'Grecia', 1, 1], Hungary: ['HU', 'Hungría', 1, 0], Ireland: ['IE', 'Irlanda', 1, 1],
  Italy: ['IT', 'Italia', 1, 1], Latvia: ['LV', 'Letonia', 1, 1], Lithuania: ['LT', 'Lituania', 1, 1], Luxembourg: ['LU', 'Luxemburgo', 1, 1],
  Malta: ['MT', 'Malta', 1, 1], Netherlands: ['NL', 'Países Bajos', 1, 1], Poland: ['PL', 'Polonia', 1, 0], Portugal: ['PT', 'Portugal', 1, 1],
  Czechia: ['CZ', 'Chequia', 1, 0], Romania: ['RO', 'Rumanía', 1, 0], Sweden: ['SE', 'Suecia', 1, 0],
  Norway: ['NO', 'Noruega', 0, 0], Switzerland: ['CH', 'Suiza', 0, 0], 'United Kingdom': ['GB', 'Reino Unido', 0, 0], Iceland: ['IS', 'Islandia', 0, 0],
  Serbia: ['RS', 'Serbia', 0, 0], 'Bosnia and Herz.': ['BA', 'Bosnia y Herzegovina', 0, 0], Albania: ['AL', 'Albania', 0, 0], Macedonia: ['MK', 'Macedonia del Norte', 0, 0],
  Montenegro: ['ME', 'Montenegro', 0, 1], Kosovo: ['XK', 'Kosovo', 0, 1], Moldova: ['MD', 'Moldavia', 0, 0], Ukraine: ['UA', 'Ucrania', 0, 0], Belarus: ['BY', 'Bielorrusia', 0, 0],
  Turkey: ['TR', 'Turquía', 0, 0], Andorra: ['AD', 'Andorra', 0, 1], Monaco: ['MC', 'Mónaco', 0, 1], 'San Marino': ['SM', 'San Marino', 0, 1],
  Liechtenstein: ['LI', 'Liechtenstein', 0, 0], Russia: ['RU', 'Rusia', 0, 0],
};
const UNIR = { 'N. Cyprus': 'Cyprus', 'Åland': 'Finland' };
// botones para los que no se pueden tocar con el dedo: se colocan al lado, con una línea
const PEQUENOS = { AD: [-26, 22], MC: [10, 30], SM: [26, 18], LI: [-6, -32], LU: [-30, -10], MT: [-30, -12] };

const pre = simp.presimplify(mundo);
const simplificado = simp.simplify(pre, simp.quantile(pre, 0.55));
const geoms = simplificado.objects.countries.geometries;
// Crimea: Natural Earth la da a Rusia (control de hecho). España y la UE la reconocen como Ucrania: se dibuja así.
{
  const rusia = geoms.find((g) => g.properties.name === 'Russia');
  const enCrimea = (poli) => {
    const c = topojson.feature(simplificado, { type: 'Polygon', arcs: poli }).geometry.coordinates[0];
    const xs = c.map((q) => q[0]), ys = c.map((q) => q[1]);
    return Math.min(...xs) > 31 && Math.max(...xs) < 37.5 && Math.min(...ys) > 43.5 && Math.max(...ys) < 47;
  };
  const crimea = rusia.arcs.filter(enCrimea);
  if (crimea.length) { rusia.arcs = rusia.arcs.filter((p) => !enCrimea(p)); geoms.push({ type: 'MultiPolygon', arcs: crimea, properties: { name: 'Crimea' } }); UNIR.Crimea = 'Ukraine'; }
}

// Proyección azimutal equivalente de Lambert centrada en Europa (la de los mapas oficiales de la UE)
const ANCHO = 1000;
const encuadre = { type: 'MultiPoint', coordinates: [[-10.6, 35.6], [-10.6, 58.5], [27, 71.2], [34.8, 34.5], [36, 50], [14.3, 35.6]] };
const proy = d3.geoAzimuthalEqualArea().rotate([-12, -52]);
proy.fitWidth(ANCHO - 20, encuadre);
const [[x0, y0], [, y1]] = d3.geoPath(proy).bounds(encuadre);
const ALTO = Math.round(y1 - y0 + 20);
const t = proy.translate();
proy.translate([t[0] - x0 + 10, t[1] - y0 + 10]);
proy.clipExtent([[0, 0], [ANCHO, ALTO]]);
const camino = d3.geoPath(proy).digits(0);
const pm = d3.geoPath(proy);

const fondo = geoms.filter((g) => !PAISES[g.properties.name] && !UNIR[g.properties.name]);
const paises = [];
for (const [en, [id, nombre, ue, euro]] of Object.entries(PAISES)) {
  const partes = geoms.filter((g) => g.properties.name === en || UNIR[g.properties.name] === en);
  if (!partes.length) { console.warn('no encontrado', en); continue; }
  const geo = topojson.merge(simplificado, partes);
  const d = camino(geo);
  if (!d) { console.warn('fuera del mapa', en); continue; }
  let mejor = null, area = -1;
  for (const poli of geo.coordinates) { const f = { type: 'Polygon', coordinates: poli }; const a = pm.area(f); if (a > area) { area = a; mejor = f; } }
  let [cx, cy] = area > 0 ? polylabel(mejor.coordinates.map((anillo) => anillo.map((p) => proy(p)).filter(Boolean)), 0.5) : [NaN, NaN];
  if (!isFinite(cx)) [cx, cy] = pm.centroid(geo);
  if (!isFinite(cx)) { const c = d3.geoCentroid(geo); [cx, cy] = proy(c); }
  if (id === 'RU') { const p = proy([38, 56]); [cx, cy] = p; } // la Rusia europea, no Kaliningrado
  if (id === 'NO') { const p = proy([9.5, 61.3]); [cx, cy] = p; }
  if (id === 'FR') { const p = proy([2.4, 46.6]); [cx, cy] = p; } // no en Córcega
  const p = { id, nombre, ue: !!ue, euro: !!euro, d, x: Math.round(cx), y: Math.round(cy) };
  if (PEQUENOS[id]) { const [dx, dy] = PEQUENOS[id]; p.pequeno = true; p.bx = p.x + dx; p.by = p.y + dy; }
  paises.push(p);
}
const datos = { ancho: ANCHO, alto: ALTO, fondo: camino(topojson.merge(simplificado, fondo)), paises };
const ue = paises.filter((p) => p.ue).length, euro = paises.filter((p) => p.euro && p.ue).length;
if (ue !== 27 || euro !== 21) throw new Error(`UE ${ue} (deben ser 27), euro en la UE ${euro} (deben ser 21)`);
writeFileSync(SALIDA, `// GENERADO por herramientas/mapa_europa.mjs: no editar a mano.
// Natural Earth 1:50m (dominio público), vía world-atlas. Proyección azimutal equivalente de Lambert.
// UE: 27 países. Euro: 21 de la UE (Bulgaria desde 2026) y Andorra, Mónaco, San Marino, Vaticano, Montenegro y Kosovo.
export const EUROPA = ${JSON.stringify(datos)};
`);
console.log('ok', SALIDA, ANCHO + '×' + ALTO, paises.length, 'países', Math.round(readFileSync(SALIDA).length / 1024) + ' KB');
