// Motor «visita»: una panorámica 360° (equirrectangular, WebGL con respaldo 2D) con puntos que se tocan.
// Las panorámicas salen de Unreal Engine (o de cualquier render) y se preparan con herramientas/panorama.py.
//   clasifica → tocar cada punto y decir de qué grupo es (¿quién se encarga: ayuntamiento, comunidad, Estado, UE?)
//   busca     → varias preguntas: encontrar, mirando alrededor, el punto que responde a cada una
//   ordena    → tocar los puntos en el orden correcto (los pasos para votar)
// Configuración del juego:
//   escenas: { plaza: { pano: 'pano/plaza.webp', inicio: 0, puntos: { id: { yaw, pitch, nombre, grupo, por, que } }, preguntas: [{ q, vale: [ids], por }] } }
//   grupos:  [{ id, nombre, color }]
// Ángulos en grados: yaw 0 = frente, positivo a la derecha; pitch positivo hacia arriba.
import { el, barajar, suena } from './nucleo.js';
import { gsap } from './vendor/gsap.js';
import { espera, temblor, chispasEn } from './efectos.js';

const lento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const porFallos = (f) => (f === 0 ? 3 : f === 1 ? 2 : f === 2 ? 1 : 0);
const sinNegrita = (t) => t.replace(/\*\*/g, '');

/* =========================================================================== el visor */
// Una sola imagen equirrectangular (2:1) por escena: `${E.pano}`. WebGL la proyecta en perspectiva; sin WebGL,
// un lienzo 2D la enseña como un cilindro (menos bonito, igual de jugable). Los puntos son botones planos encima.
const VS = `attribute vec2 p; varying vec2 q; void main(){ q = p; gl_Position = vec4(p, 0., 1.); }`;
const FS = `precision highp float; varying vec2 q; uniform sampler2D t; uniform vec4 cam; // yaw, pitch, tan(fov/2) vertical, aspecto
void main(){
  vec3 d = normalize(vec3(q.x * cam.z * cam.w, q.y * cam.z, 1.));
  float cp = cos(cam.y), sp = sin(cam.y), cy = cos(cam.x), sy = sin(cam.x);
  vec3 e = vec3(d.x, d.y * cp + d.z * sp, -d.y * sp + d.z * cp);            // mirar arriba o abajo
  vec3 w = vec3(e.x * cy + e.z * sy, e.y, -e.x * sy + e.z * cy);             // girar: (derecha, arriba, frente)
  gl_FragColor = texture2D(t, vec2(atan(w.x, w.z) / 6.2831853 + .5, .5 - asin(clamp(w.y, -1., 1.)) / 3.1415927));
}`;
const RAD = Math.PI / 180;
function creaGL(lienzo, img) {
  const gl = lienzo.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true });
  if (!gl) return null;
  const sh = (tipo, src) => { const o = gl.createShader(tipo); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const ap = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.REPEAT], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v));
  let lista = false;
  const sube = () => { try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); lista = true; } catch { lista = false; } };
  const u = gl.getUniformLocation(pr, 'cam');
  return {
    sube, pinta(cam, tanV, asp) { if (!lista) return; gl.viewport(0, 0, lienzo.width, lienzo.height); gl.uniform4f(u, cam.yaw * RAD, cam.pitch * RAD, tanV, asp); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); },
  };
}
function creaPlano(lienzo, img) { // sin WebGL: un trozo de la panorámica, sin perspectiva
  const c = lienzo.getContext('2d');
  return {
    sube() {}, pinta(cam, tanV, asp) {
      if (!img.naturalWidth) return;
      const W = img.naturalWidth, H = img.naturalHeight, fv = 2 * Math.atan(tanV) / RAD, fh = fv * asp;
      const sw = W * fh / 360, sh = H * fv / 180, sx = ((cam.yaw - fh / 2) / 360 + 0.5) * W, sy = (0.5 - (cam.pitch + fv / 2) / 180) * H;
      const x0 = ((sx % W) + W) % W, a = Math.min(sw, W - x0), k = lienzo.width / sw;
      c.drawImage(img, x0, sy, a, sh, 0, 0, a * k, lienzo.height);
      if (a < sw) c.drawImage(img, 0, sy, sw - a, sh, a * k, 0, (sw - a) * k, lienzo.height);
    },
  };
}

function creaVisor(E, alTocar) {
  const img = new Image(); img.decoding = 'async';
  const lienzo = el('canvas', { class: 'vs-lienzo', 'aria-hidden': 'true' });
  const capa = el('div', { class: 'vs-capa' });
  const puntos = {};
  for (const [id, p] of Object.entries(E.puntos)) {
    const b = el('button', { type: 'button', class: 'vs-punto', 'aria-label': 'Punto sin identificar', onclick: () => { if (!arrastrado) alTocar(id); }, onfocus: () => mira(p.yaw, p.pitch) }, el('i'), el('span', { class: 'vs-rotulo' }));
    puntos[id] = b; capa.append(b);
  }
  const brujula = el('span', { class: 'vs-brujula', 'aria-hidden': 'true' }, el('i'));
  const ayuda = el('span', { class: 'vs-ayuda', text: 'Arrastra para mirar alrededor' });
  const caja = el('div', { class: 'vs-visor cargando', tabindex: '0', 'aria-label': 'Panorámica. Arrastra o usa las flechas para mirar alrededor.' }, lienzo, capa, brujula, ayuda);
  let motor = null;
  try { if (!/[?&]plano\b/.test(location.search)) motor = creaGL(lienzo, img); } catch (e) { console.warn('visita: sin WebGL', e); } // ?plano fuerza el respaldo 2D
  if (!motor) { motor = creaPlano(lienzo, img); caja.classList.add('plano'); }
  const plano = caja.classList.contains('plano');
  img.onload = () => { motor.sube(); caja.classList.remove('cargando'); pide(); };
  img.onerror = () => { caja.classList.remove('cargando'); caja.classList.add('sin-imagen'); };
  img.src = E.pano;

  const cam = { yaw: E.inicio ?? 0, pitch: 0 };
  let w = 0, h = 0, tanV = 0.7, asp = 1.5, arrastrado = false, pedido = false;
  const mide = () => {
    w = caja.clientWidth || 600; h = caja.clientHeight || 400; asp = w / h;
    tanV = Math.min(Math.tan(40 * RAD), Math.max(Math.tan(30 * RAD), Math.tan(47 * RAD) / asp)); // ~95° de ancho en horizontal, ~70° de alto en vertical
    const r = Math.min(devicePixelRatio || 1, 2);
    lienzo.width = Math.round(w * r); lienzo.height = Math.round(h * r);
    pide();
  };
  // dónde cae en pantalla un punto (yaw, pitch); null si queda detrás
  const proyecta = (a, b) => {
    if (plano) {
      const fv = 2 * Math.atan(tanV) / RAD, fh = fv * asp, dy = (((a - cam.yaw) % 360) + 540) % 360 - 180;
      return Math.abs(dy) > fh / 2 + 10 ? null : { x: w / 2 + (dy / fh) * w, y: h / 2 - ((b - cam.pitch) / fv) * h };
    }
    const ra = a * RAD, rb = b * RAD, ry = cam.yaw * RAD, rp = cam.pitch * RAD;
    const der = Math.cos(rb) * Math.sin(ra), arr = Math.sin(rb), fre = Math.cos(rb) * Math.cos(ra);
    const cx = der * Math.cos(ry) - fre * Math.sin(ry), z1 = der * Math.sin(ry) + fre * Math.cos(ry);
    const cy = arr * Math.cos(rp) - z1 * Math.sin(rp), cz = arr * Math.sin(rp) + z1 * Math.cos(rp);
    if (cz < 0.08) return null;
    return { x: w / 2 + (cx / cz) / (tanV * asp) * (w / 2), y: h / 2 - (cy / cz) / tanV * (h / 2) };
  };
  const pinta = () => {
    pedido = false;
    cam.pitch = Math.max(-50, Math.min(50, cam.pitch));
    motor.pinta(cam, tanV, asp);
    for (const [id, b] of Object.entries(puntos)) {
      const s = proyecta(E.puntos[id].yaw, E.puntos[id].pitch);
      const fuera = !s || s.x < -60 || s.x > w + 60 || s.y < -60 || s.y > h + 60;
      b.classList.toggle('fuera', fuera);
      if (!fuera) b.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`;
    }
    brujula.firstChild.style.transform = `rotate(${cam.yaw}deg)`;
  };
  const pide = () => { if (!pedido) { pedido = true; requestAnimationFrame(pinta); } };
  new ResizeObserver(mide).observe(caja);
  function mira(yaw, pitch = 0, ms = 0.7) {
    const d = (((yaw - cam.yaw) % 360) + 540) % 360 - 180; // el camino corto
    gsap.killTweensOf(cam);
    if (lento() || !ms) { cam.yaw += d; cam.pitch = pitch; return pide(); }
    gsap.to(cam, { yaw: cam.yaw + d, pitch, duration: ms, ease: 'power2.inOut', onUpdate: pide });
  }
  // arrastrar con el dedo o el ratón (el puntero se captura solo al empezar a girar, para no robarle el toque a los puntos)
  let ini = null;
  caja.addEventListener('pointerdown', (e) => { ini = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch, id: e.pointerId }; arrastrado = false; gsap.killTweensOf(cam); });
  caja.addEventListener('pointermove', (e) => {
    if (!ini || e.pointerId !== ini.id) return;
    const dx = e.clientX - ini.x, dy = e.clientY - ini.y;
    if (!arrastrado) { if (Math.hypot(dx, dy) < 7) return; arrastrado = true; caja.classList.add('girando', 'usado'); try { caja.setPointerCapture(e.pointerId); } catch {} }
    const k = (2 * Math.atan(tanV) / RAD) / h; // grados por píxel
    cam.yaw = ini.yaw - dx * k; cam.pitch = ini.pitch + dy * k; pide();
  });
  const suelta = () => { if (!ini) return; ini = null; caja.classList.remove('girando'); setTimeout(() => (arrastrado = false), 0); };
  caja.addEventListener('pointerup', suelta); caja.addEventListener('pointercancel', suelta);
  caja.addEventListener('keydown', (e) => {
    const m = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, 12], ArrowDown: [0, -12] }[e.key];
    if (m && e.target === caja) { e.preventDefault(); caja.classList.add('usado'); mira(cam.yaw + m[0], cam.pitch + m[1], 0.25); }
  });
  mide();
  // dónde queda un punto respecto a donde miras: «a tu derecha», «detrás»…
  const hacia = (id) => { const d = (((E.puntos[id].yaw - cam.yaw) % 360) + 540) % 360 - 180; return Math.abs(d) < 35 ? 'delante de ti' : Math.abs(d) > 135 ? 'detrás de ti' : d > 0 ? 'a tu derecha' : 'a tu izquierda'; };
  const marca = (id, cls, color, texto) => { const b = puntos[id]; b.classList.add(...cls.split(' ')); if (color) b.style.setProperty('--c', color); if (texto != null) { b.lastChild.textContent = texto; b.setAttribute('aria-label', texto); } };
  return { caja, puntos, mira, hacia, marca, cam };
}

/* =========================================================================== generar */
export function generar(spec, config = {}) {
  const d = structuredClone(spec), g = typeof d.generar === 'object' ? d.generar : {}; // todo nivel lleva «generar» (aunque sea true): ahí se engancha la escena
  delete d.generar;
  const E = config.escenas?.[d.escena];
  if (!E) throw new Error(`no encuentro la escena «${d.escena}».`);
  d._escena = E; d._grupos = E.grupos ?? config.grupos ?? [];
  if (d.modo === 'clasifica') {
    const con = Object.keys(E.puntos).filter((id) => E.puntos[id].grupo && (!g.grupos || g.grupos.includes(E.puntos[id].grupo)));
    // al menos uno de cada grupo y el resto al azar, hasta n
    const uno = new Map(); barajar(con.slice()).forEach((id) => { const k = E.puntos[id].grupo; if (!uno.has(k)) uno.set(k, id); });
    const base = [...uno.values()];
    d.puntos = base.concat(barajar(con.filter((id) => !base.includes(id)))).slice(0, Math.max(g.n ?? 6, base.length));
    d.grupos = g.grupos ?? [...uno.keys()];
  } else if (d.modo === 'busca') {
    d.preguntas = barajar((E.preguntas ?? []).slice()).slice(0, g.n ?? 3);
    if (!d.preguntas.length) throw new Error(`la escena «${d.escena}» no tiene preguntas.`);
  }
  return d;
}
export function ronda(d, ctx) {
  const m = { clasifica, busca, ordena }[d.modo];
  if (!m) throw new Error(`no encuentro el modo «${d.modo}». Si el juego se acaba de actualizar, recarga la página.`);
  return m(d, ctx, d._escena, d._grupos);
}

/* =========================================================================== ¿quién se encarga? */
function clasifica(d, ctx, E, G) {
  const grupos = G.filter((g) => d.grupos.includes(g.id)), pend = new Set(d.puntos);
  ctx.reto(d.enunciado ?? `En esta plaza hay **${d.puntos.length} servicios** marcados. Toca cada uno y decide **quién se encarga**.`);
  ctx.pista(d.pista ?? 'Arrastra para mirar alrededor: hay cosas a los lados y detrás de ti.');
  let sel = null, fallos = 0, quieto = false;
  const malos = [];
  const panel = el('div', { class: 'vs-panel' });
  const visor = creaVisor(E, (id) => {
    if (quieto || !pend.has(id)) return;
    sel = id; suena('clic');
    Object.entries(visor.puntos).forEach(([k, b]) => b.classList.toggle('sel', k === id));
    pintaPanel();
  });
  Object.keys(visor.puntos).forEach((id) => { if (!pend.has(id)) visor.puntos[id].hidden = true; });
  const pintaPanel = () => {
    if (!sel) return panel.replaceChildren(el('p', { class: 'vs-espera', text: pend.size ? `Quedan ${pend.size}. Toca uno de los puntos que laten.` : '' }));
    panel.replaceChildren(el('p', {}, el('b', { text: E.puntos[sel].nombre }), ' ¿Quién se encarga?'),
      el('div', { class: 'vs-grupos' }, grupos.map((g) => el('button', { type: 'button', class: 'tecla vs-grupo', style: { '--c': g.color }, text: g.nombre, onclick: () => decide(g.id) }))));
  };
  const decide = async (g) => {
    if (quieto) return;
    const id = sel, p = E.puntos[id], bueno = G.find((x) => x.id === p.grupo), ok = g === p.grupo;
    quieto = true; pend.delete(id); sel = null;
    visor.puntos[id].classList.remove('sel');
    visor.marca(id, ok ? 'hecho' : 'hecho mal', bueno.color, bueno.nombre);
    suena(ok ? 'bien' : 'mal');
    if (!ok) { fallos++; malos.push(p.por); temblor(panel, 5); }
    ctx.aviso(sinNegrita(p.por), !ok);
    panel.replaceChildren(el('p', { class: 'vs-espera', text: ok ? 'Eso es.' : `No: es cosa de ${bueno.nombre.toLowerCase()}.` }));
    await espera(lento() ? 200 : ok ? 1100 : 2200);
    quieto = false;
    if (pend.size) return pintaPanel();
    chispasEn(visor.caja, 14);
    ctx.fin(porFallos(fallos), fallos ? `**${d.puntos.length - fallos} de ${d.puntos.length}.** ` + malos.join(' ') : `**${d.puntos.length} de ${d.puntos.length}.** ` + (d.nota ?? grupos.map((g) => g.resumen).filter(Boolean).join(' ')));
  };
  ctx.escenario.append(el('div', { class: 'vs-mesa' }, visor.caja, panel));
  pintaPanel();
  const cuenta = (g) => [...pend].filter((id) => E.puntos[id].grupo === g.id).length;
  ctx.pistas([
    { texto: d.principio ?? 'Lo que es de tu calle y tu pueblo lo lleva el **ayuntamiento**. Los colegios y la sanidad, la **comunidad autónoma**. Lo que es igual en toda España, el **Estado**. Y lo que compartimos con otros países, la **Unión Europea**.' },
    { get texto() { return 'De los que quedan: ' + grupos.map((g) => `${cuenta(g)} de ${g.nombre.toLowerCase()}`).join(', ') + '.'; } },
    { get texto() { const id = sel ?? [...pend][0]; return id ? `**${E.puntos[id].nombre}**: ${G.find((x) => x.id === E.puntos[id].grupo).nombre.toLowerCase()}.` : 'Ya no queda ninguno.'; } },
  ]);
}

/* =========================================================================== busca el punto que responde */
function busca(d, ctx, E) {
  const L = d.preguntas;
  let i = 0, fallos = 0, quieto = false;
  ctx.pista(d.pista ?? 'Mira alrededor y toca el punto que responde a la pregunta.');
  const visor = creaVisor(E, async (id) => {
    if (quieto) return;
    const q = L[i], p = E.puntos[id];
    if (!q.vale.includes(id)) { fallos++; suena('mal'); temblor(visor.puntos[id], 6); visor.marca(id, 'visto', null, p.nombre); return ctx.aviso(`Eso es ${p.nombre.charAt(0).toLowerCase() + p.nombre.slice(1)}. ${sinNegrita(p.que ?? '')} Sigue buscando.`, true); }
    quieto = true; suena('bien'); visor.marca(id, 'hecho', '#9bd84a', p.nombre); ctx.aviso(sinNegrita(q.por));
    fila.children[i].classList.add('bien');
    await espera(lento() ? 200 : 1900);
    visor.puntos[id].classList.remove('hecho'); quieto = false; i++;
    if (i < L.length) return pinta();
    chispasEn(visor.caja, 14);
    ctx.fin(porFallos(fallos), (fallos ? `Encontrados los ${L.length}, con ${fallos} ${fallos === 1 ? 'despiste' : 'despistes'}. ` : `**${L.length} de ${L.length}, a la primera.** `) + L.at(-1).por);
  });
  const fila = el('ol', { class: 'vs-fila', 'aria-label': 'Preguntas' }, L.map(() => el('li')));
  const pinta = () => {
    const q = L[i];
    ctx.reto(q.q);
    fila.querySelectorAll('li').forEach((li, k) => li.classList.toggle('ahora', k === i));
    ctx.pistas([
      { texto: q.pista ?? 'Piensa primero **qué estás buscando**. Luego gira despacio: está en algún sitio de la escena.' },
      { get texto() { return `Lo que buscas está **${visor.hacia(q.vale[0])}**.`; } },
      { get texto() { visor.mira(E.puntos[q.vale[0]].yaw, E.puntos[q.vale[0]].pitch); return 'Te he girado hacia allí: lo tienes delante.'; } },
    ]);
  };
  ctx.escenario.append(el('div', { class: 'vs-mesa' }, visor.caja, fila));
  pinta();
}

/* =========================================================================== en orden */
function ordena(d, ctx, E) {
  const orden = d.orden;
  let i = 0, fallos = 0;
  ctx.reto(d.enunciado ?? 'Toca los puntos **en el orden correcto**.');
  ctx.pista(d.pista ?? 'Mira alrededor antes de empezar. Cada punto que aciertes se queda con su número.');
  const visor = creaVisor(E, (id) => {
    const k = orden.indexOf(id), p = E.puntos[id];
    if (i >= orden.length || (k >= 0 && k < i)) return;
    if (id !== orden[i]) { fallos++; suena('mal'); temblor(visor.puntos[id], 6); return ctx.aviso(k < 0 ? `${p.nombre}: ${sinNegrita(p.que ?? 'eso no es un paso.')}` : sinNegrita(d.antes?.[id] ?? `${p.nombre} va después. Antes falta algo.`), true); }
    suena('pon', i); visor.marca(id, 'hecho num', '#ffc531', `${i + 1}. ${p.nombre}`); visor.puntos[id].firstChild.textContent = String(i + 1);
    ctx.aviso(sinNegrita(p.que ?? '')); i++;
    if (i === orden.length) { chispasEn(visor.caja, 14); ctx.fin(porFallos(fallos), (fallos ? '' : '**En su orden, a la primera.** ') + d.por); }
  });
  ctx.escenario.append(el('div', { class: 'vs-mesa' }, visor.caja));
  ctx.pistas([
    { texto: d.principio ?? 'Imagina que entras por la puerta. ¿Qué necesitas tener en la mano antes de acercarte a la urna?' },
    { get texto() { return i < orden.length ? `El siguiente paso está **${visor.hacia(orden[i])}**.` : 'Ya están todos.'; } },
    { get texto() { return i < orden.length ? `Ahora toca: **${E.puntos[orden[i]].nombre.toLowerCase()}**.` : 'Ya están todos.'; } },
  ]);
}
