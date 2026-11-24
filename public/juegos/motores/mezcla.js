// Motor «mezcla»: un examen hecho con retos de otros motores, sin código propio.
// Cada ronda (o nivel) dice de qué motor es:  { "motor": "escrutinio", "modo": "sobres", "generar": { … } }
// y la juega ese motor tal cual, con sus pistas y su corrección. Sirve para cualquier área (lo usa «El examen del 29-N»).
//
// · Solo se cargan los motores que aparecen en la configuración del juego.
// · Algunos motores ponen su dibujo propio en la portada en cuanto aparece. En una mezcla eso no tiene sentido
//   (ganaría el primero que llegase), así que este motor marca la portada como «ya puesta» antes de cargarlos:
//   se ve la de la configuración (portada.arte / portada.rotulo, como en cualquier juego).
// · Con ?prueba: window.__motor y window.__modo dicen de quién es el reto actual, y window.__sol / __mal son los
//   del motor de ese reto (para las pruebas automáticas).
const PRUEBA = new URLSearchParams(location.search).has('prueba');
const config = (() => { try { return JSON.parse(document.getElementById('config').textContent); } catch { return {}; } })();
const nombres = [...new Set([...(config.rondas ?? []), ...(config.niveles ?? [])].map((r) => r.motor).filter(Boolean))];

// la portada es de la configuración: este vigilante se registra antes que los de los motores y llega el primero
const vigila = new MutationObserver(() => {
  const a = document.querySelector('.portada-arte');
  if (!a) return;
  a.dataset.propia = '1'; a.dataset.inv = '1'; // las marcas con las que cada motor sabe que la portada ya está puesta
  vigila.disconnect();
});
vigila.observe(document.body, { childList: true, subtree: true });
setTimeout(() => vigila.disconnect(), 20000);

const MOD = {}, SOL = {};
for (const n of nombres) if (!/^[a-z][a-z-]*$/.test(n) || n === 'mezcla') throw new Error(`«${n}» no es un motor que se pueda mezclar.`);
if (PRUEBA) {
  // de uno en uno, para saber qué __sol pone cada motor al cargarse (los que lo ponen fuera de la ronda)
  for (const n of nombres) { const antes = window.__sol; MOD[n] = await import(`./${n}.js`); if (window.__sol !== antes) SOL[n] = window.__sol; }
} else {
  (await Promise.all(nombres.map((n) => import(`./${n}.js`)))).forEach((m, i) => (MOD[nombres[i]] = m));
}

const de = (spec) => {
  const m = MOD[spec.motor];
  if (!m) throw new Error(spec.motor ? `No conozco el motor «${spec.motor}».` : 'En una mezcla, cada reto tiene que decir su "motor".');
  return m;
};

export function generar(spec, cfg) {
  const m = de(spec);
  return { ...(m.generar ? m.generar(spec, cfg) : structuredClone(spec)), motor: spec.motor };
}

export function ronda(d, ctx) {
  const m = de(d);
  if (PRUEBA) {
    delete window.__sol; delete window.__mal;
    if (SOL[d.motor]) window.__sol = SOL[d.motor];
    window.__motor = d.motor; window.__modo = d.modo;
  }
  document.body.dataset.motor = d.motor;
  return m.ronda(d, ctx);
}
