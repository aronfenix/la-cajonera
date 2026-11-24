// Piezas comunes de los motores de Sociales (tema 2, «El cajón vota»).
// Partidos inventados (los mismos de los vídeos), colores de los niveles de gobierno (los de La maqueta),
// reparto D'Hondt y la «noche electoral» compartida entre La noche del escrutinio → La máquina de repartir → 176.

// Partidos: SOLO estos tres, inventados y neutros. Se distinguen por el icono, no por colores de partidos reales.
const ICONO = {
  arbol: '<circle cx="50" cy="38" r="26" fill="#9bd84a" stroke="#1b1e3a" stroke-width="5"/><rect x="44" y="58" width="12" height="30" rx="3" fill="#b5835a" stroke="#1b1e3a" stroke-width="5"/>',
  coche: '<rect x="12" y="44" width="76" height="26" rx="8" fill="#5ec3ff" stroke="#1b1e3a" stroke-width="5"/><path d="M28 44 L38 28 H64 L74 44" fill="#bfe8ff" stroke="#1b1e3a" stroke-width="5" stroke-linejoin="round"/><circle cx="30" cy="72" r="9" fill="#1b1e3a"/><circle cx="70" cy="72" r="9" fill="#1b1e3a"/>',
  canasta: '<rect x="20" y="16" width="60" height="34" rx="4" fill="#fffdf6" stroke="#1b1e3a" stroke-width="5"/><rect x="38" y="32" width="24" height="14" fill="none" stroke="#1b1e3a" stroke-width="4"/><path d="M34 52 H66 L60 84 H40 Z" fill="none" stroke="#ff8a1f" stroke-width="5" stroke-linejoin="round"/><circle cx="74" cy="76" r="11" fill="#ff8a1f" stroke="#1b1e3a" stroke-width="4"/>',
};
export const PARTIDOS = [
  { id: 'parque', nombre: 'Los del Parque', corto: 'Parque', icono: 'arbol', tono: '#d9ecc4', idea: 'Lo más importante es el aire limpio y tener sitios para pasear.' },
  { id: 'aparcamiento', nombre: 'Los del Aparcamiento', corto: 'Aparcamiento', icono: 'coche', tono: '#cfe7f5', idea: 'Lo más importante es poder llegar en coche al trabajo y a las tiendas.' },
  { id: 'pista', nombre: 'Los de la Pista', corto: 'Pista', icono: 'canasta', tono: '#f7dcc2', idea: 'Lo más importante es que los jóvenes tengan dónde hacer deporte.' },
];
export const partido = (id) => PARTIDOS.find((p) => p.id === id);
export const iconoPartido = (id, tam = 48) => `<svg viewBox="0 0 100 100" width="${tam}" height="${tam}" aria-hidden="true">${ICONO[partido(id)?.icono] ?? ''}</svg>`;

// Niveles de gobierno: mismos colores que La maqueta 360°.
export const NIVELES = {
  ayuntamiento: { nombre: 'Ayuntamiento', color: '#9bd84a' },
  comunidad: { nombre: 'Comunidad de Madrid', color: '#ff8a1f' },
  estado: { nombre: 'Estado', color: '#e8417a' },
  ue: { nombre: 'Unión Europea', color: '#5ec3ff' },
};

// D'Hondt. votos: {id: n}; devuelve { escanos: {id: n}, cocientes: [{id, divisor, valor, gana}] } (cocientes ordenados de mayor a menor).
// Empates: gana el partido con más votos totales (como en la ley).
export function dhondt(votos, escanos, divisores = escanos) {
  const c = [];
  for (const [id, v] of Object.entries(votos)) for (let d = 1; d <= divisores; d++) c.push({ id, divisor: d, valor: v / d, total: v });
  c.sort((a, b) => b.valor - a.valor || b.total - a.total);
  const res = Object.fromEntries(Object.keys(votos).map((id) => [id, 0]));
  c.forEach((q, i) => { q.gana = i < escanos; if (q.gana) res[q.id]++; });
  return { escanos: res, cocientes: c };
}

// La noche electoral compartida (solo en esta tablet).
// { provincia: {nombre, escanos}, votos: {parque, aparcamiento, pista, blanco, nulo}, hemiciclo: {parque, aparcamiento, pista} (sobre 350), fecha }
const CLAVE = 'cajon-noche-electoral';
export function leerNoche() { try { return JSON.parse(localStorage.getItem(CLAVE)) ?? null; } catch { return null; } }
export function guardarNoche(parcial) {
  try { const n = { ...(leerNoche() ?? {}), ...parcial, fecha: Date.now() }; localStorage.setItem(CLAVE, JSON.stringify(n)); return n; } catch { return null; }
}
