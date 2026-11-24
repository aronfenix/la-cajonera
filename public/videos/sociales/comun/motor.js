/*
 * Motor de preguntas · Sociales 5.º · Tema 2 «Un voto de confianza»
 * Copia para La cajonera (public/videos/sociales/comun/). Cambios respecto al original:
 *   - la raíz es esta carpeta (comun/): datos en comun/data/*.json y mapa en comun/europa.js;
 *   - progreso en localStorage con la clave «cajon-sociales-tema2-videos»;
 *   - letra Grandstander/Atkinson y tinta #1b1e3a; textos de acierto más sobrios.
 *   - «Comprobar» ignora el clic fantasma que llega justo después de soltar una ficha con el dedo.
 *   El aspecto va en comun/preguntas.css (piel de La cajonera).
 * Sin dependencias. Funciona en tablets táctiles (Pointer Events) y con ratón/teclado.
 *
 * API (window.Motor):
 *   Motor.montar(contenedor, numeroVideo, opciones?) → Promise<controlador>
 *     opciones:
 *       alPedirRepaso(segundos, info)  Si existe, el enlace «Vuelve a ver el vídeo en el minuto m:ss» llama a esta
 *                                      función en vez de navegar. info = {video, escena, pregunta}.
 *       alTerminar(resultado)          Al acabar las 5 preguntas. resultado = {video, aciertosPrimera, total,
 *                                      preguntas: [{id, tipo, aLaPrimera, intentos}]}.
 *       alSiguienteVideo(n)            Botón «Siguiente vídeo» de la pantalla final (por defecto: leccion.html?v=n).
 *       alInicio()                     En el último vídeo, el botón final vuelve al inicio (por defecto: index.html).
 *       urlRepaso(n, segundos)         URL del enlace de repaso cuando no hay alPedirRepaso
 *                                      (por defecto: leccion.html?v=n&t=segundos, relativa a la raíz del sitio).
 *       textoSiguiente                 Texto del botón (por defecto «Siguiente vídeo»).
 *       raiz                           URL base del sitio (por defecto se deduce de la ruta de motor.js).
 *       preguntas                      Lista de preguntas propia (mismo esquema) en vez de las de data/preguntas.json.
 *                                      Los minutos de repaso siguen saliendo de tiempos.json[numeroVideo] + escenas.
 *       guardarProgreso                true/false. Por defecto true, salvo si se pasan `preguntas` propias.
 *     controlador: {reiniciar(), destruir(), irA(indice)}  (null si se volvió a montar otro motor mientras cargaba)
 *     Volver a llamar a montar() sobre el mismo contenedor desmonta el motor anterior.
 *   Eventos DOM (CustomEvent, burbujean desde el contenedor):
 *       'motor:pregunta'   detail {video, indice, id}
 *       'motor:comprobado' detail {video, id, ok, intento, terminado}
 *       'motor:repaso'     detail {video, id, escena, segundos}
 *       'motor:terminado'  detail = resultado
 *   Otras utilidades:
 *       Motor.cargarDatos() → Promise<{preguntas, guiones, tiempos}>
 *       Motor.segundosEscena(video, escena) → Promise<number|null>
 *       Motor.formatoMinuto(segundos) → 'm:ss'
 *       Motor.progreso.{leer(), estado(n), marcarVisto(n), borrar()}
 *       Motor.iconos  (SVG en texto: ok, mal, play, arbol, coche, canasta, estrella, video1…video5, …)
 *
 * TIEMPOS: data/tiempos.json = {"1": [inicio_escena1_s, …], …}. Mientras no existan los vídeos se usa un
 * tiempos.json PROVISIONAL (estimado a ~140 palabras/minuto del guion + 3 s de cabecera, creado por
 * produccion/tiempos-provisionales.mjs). El render de los vídeos lo SOBRESCRIBIRÁ con los tiempos reales;
 * este motor no necesita cambios. Las claves que empiezan por «_» se ignoran.
 */
(function () {
  'use strict';

  // ───────────────────────── utilidades ─────────────────────────
  var scriptActual = document.currentScript;
  var RAIZ = (function () {
    try { return new URL('./', scriptActual.src).href; } catch (e) { return './'; }
  })();
  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, hijos) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] == null || attrs[k] === false) continue;
      if (k === 'html') n.innerHTML = attrs[k];
      else if (k === 'texto') n.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    añadir(n, hijos);
    return n;
  }
  function añadir(n, hijos) {
    if (hijos == null) return;
    if (!Array.isArray(hijos)) hijos = [hijos];
    hijos.forEach(function (h) {
      if (h == null || h === false) return;
      n.appendChild(typeof h === 'string' ? document.createTextNode(h) : h);
    });
  }
  function svgEl(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function barajar(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function normalizar(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.,;:¡!¿?«»"']/g, '').replace(/\s+/g, ' ').trim();
  }
  // Lee números escritos a la española: «16.000», «16 000», «4666,67», «4.666,67».
  function leerNumero(txt) {
    var s = String(txt).trim().replace(/[\s ]/g, '');
    if (!s) return NaN;
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
    return parseFloat(s);
  }
  function miles(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function formatoMinuto(seg) {
    seg = Math.max(0, Math.floor(seg || 0));
    var m = Math.floor(seg / 60), s = seg % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function emitir(nodo, nombre, detalle) {
    try { nodo.dispatchEvent(new CustomEvent(nombre, { detail: detalle, bubbles: true })); } catch (e) { /* nada */ }
  }
  function plural(n, uno, varios) { return n === 1 ? uno : varios.replace('#', n); }

  // ───────────────────────── iconos SVG ─────────────────────────
  var I = {};
  I.ok = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.6l4.4 4.4L19.2 7.4" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  I.mal = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>';
  I.play = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.8v14.4a1 1 0 0 0 1.5.86l12-7.2a1 1 0 0 0 0-1.72l-12-7.2A1 1 0 0 0 7 4.8z" fill="currentColor"/></svg>';
  I.agarre = '<svg viewBox="0 0 14 22" aria-hidden="true" fill="currentColor"><circle cx="4" cy="4" r="2"/><circle cx="10" cy="4" r="2"/><circle cx="4" cy="11" r="2"/><circle cx="10" cy="11" r="2"/><circle cx="4" cy="18" r="2"/><circle cx="10" cy="18" r="2"/></svg>';
  I.flecha = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  I.atras = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H6M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  I.arriba = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V6M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  I.abajo = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v13M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  I.mano = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5c0 3.6-2.4 6.5-6 6.5-2.6 0-4-1.2-5.3-3.2L4.5 14a1.5 1.5 0 0 1 2.4-1.8L9 14.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  I.repetir = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  I.mas = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
  I.menos = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
  I.estrella = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.75 5.6 6.15.9-4.45 4.33 1.05 6.12L12 16.87l-5.5 2.88 1.05-6.12L3.1 9.3l6.15-.9z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  function estrellaGrande(llena) {
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5.5l5.6 11.3 12.5 1.8-9 8.8 2.1 12.4L24 33.9l-11.2 5.9 2.1-12.4-9-8.8 12.5-1.8z" fill="' +
      (llena ? '#ffc531' : '#e6e1d6') + '" stroke="' + (llena ? '#1b1e3a' : '#8a8ea8') + '" stroke-width="3" stroke-linejoin="round"/></svg>';
  }
  // Partidos inventados (neutros): árbol, coche, canasta.
  I.arbol = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="21" y="27" width="6" height="15" rx="2" fill="#7A6A58"/><circle cx="24" cy="18" r="11" fill="#6F7A6B"/><circle cx="16" cy="24" r="7.5" fill="#6F7A6B"/><circle cx="32" cy="24" r="7.5" fill="#6F7A6B"/><circle cx="20" cy="15" r="3" fill="#8E998A"/><rect x="12" y="41" width="24" height="3.5" rx="1.75" fill="#B9B2A6"/></svg>';
  I.coche = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 29l3.6-9.2A4 4 0 0 1 16.3 17h15.4a4 4 0 0 1 3.7 2.8L39 29z" fill="#5C6784"/><rect x="5" y="27" width="38" height="10" rx="4" fill="#5C6784"/><path d="M15 20.5h7.5V27H12.8zM25.5 20.5H33l2.2 6.5h-9.7z" fill="#DCE1EA"/><circle cx="14" cy="37" r="5" fill="#1b1e3a"/><circle cx="34" cy="37" r="5" fill="#1b1e3a"/><circle cx="14" cy="37" r="2" fill="#B8BFCC"/><circle cx="34" cy="37" r="2" fill="#B8BFCC"/><rect x="38" y="30" width="4" height="3" rx="1.5" fill="#F3EAD2"/></svg>';
  I.canasta = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="22.5" y="20" width="3" height="24" rx="1.5" fill="#7D7F8C"/><rect x="10" y="5" width="28" height="18" rx="3" fill="#FFFFFF" stroke="#5E616F" stroke-width="2.5"/><rect x="18" y="11" width="12" height="8" rx="1.5" fill="none" stroke="#5E616F" stroke-width="2"/><path d="M15.5 23h17l-3 9h-11z" fill="none" stroke="#8E8B85" stroke-width="1.8" stroke-linejoin="round"/><path d="M19 23l2.4 9M24 23v9M29 23l-2.4 9" stroke="#8E8B85" stroke-width="1.4"/><rect x="14" y="21.5" width="20" height="3" rx="1.5" fill="#5E616F"/></svg>';
  // Iconos de cada vídeo (para portada/índice).
  I.video1 = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="22" y="6" width="22" height="26" rx="3" fill="#FFFFFF" stroke="#1b1e3a" stroke-width="3" transform="rotate(8 33 19)"/><path d="M28 16h10M28 22h7" stroke="#8D99AE" stroke-width="3" stroke-linecap="round" transform="rotate(8 33 19)"/><rect x="8" y="26" width="48" height="32" rx="6" fill="#1b1e3a"/><rect x="20" y="25" width="24" height="5" rx="2.5" fill="#FBF6EC"/><rect x="18" y="38" width="28" height="8" rx="4" fill="#8D99AE"/></svg>';
  I.video2 = '<svg viewBox="0 0 64 64" aria-hidden="true"><g><circle cx="16" cy="40" r="6" fill="#F4B942"/><rect x="9" y="44" width="14" height="14" rx="7" fill="#F4B942"/></g><g><circle cx="31" cy="33" r="8" fill="#E07A5F"/><rect x="21.5" y="38" width="19" height="20" rx="9.5" fill="#E07A5F"/></g><g><circle cx="49" cy="25" r="10" fill="#3D8B85"/><rect x="37" y="32" width="24" height="26" rx="12" fill="#3D8B85"/></g><circle cx="49" cy="25" r="5.5" fill="#FBF6EC"/><circle cx="31" cy="33" r="4.4" fill="#FBF6EC"/><circle cx="16" cy="40" r="3.3" fill="#FBF6EC"/></svg>';
  I.video3 = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 20L32 7l24 13z" fill="#3D8B85"/><rect x="8" y="20" width="48" height="5" rx="2" fill="#1b1e3a"/><rect x="12" y="27" width="9" height="24" rx="2" fill="#E07A5F"/><rect x="27.5" y="27" width="9" height="24" rx="2" fill="#F4B942"/><rect x="43" y="27" width="9" height="24" rx="2" fill="#3B5BA9"/><rect x="6" y="52" width="52" height="6" rx="3" fill="#1b1e3a"/></svg>';
  I.video4 = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="8" width="30" height="30" rx="5" fill="#FFFFFF" stroke="#1b1e3a" stroke-width="3"/><rect x="8" y="8" width="30" height="9" rx="4" fill="#E07A5F"/><text x="23" y="34" text-anchor="middle" font-family="Rotulo, Grandstander, sans-serif" font-weight="900" font-size="15" fill="#1b1e3a">29</text><rect x="24" y="30" width="34" height="28" rx="5" fill="#3D8B85"/><rect x="33" y="29" width="16" height="4" rx="2" fill="#FBF6EC"/><path d="M41 15v14" stroke="#1b1e3a" stroke-width="3" stroke-linecap="round"/></svg>';
  I.video5 = (function () {
    var s = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="4" y="4" width="56" height="56" rx="12" fill="#3B5BA9"/>';
    for (var k = 0; k < 12; k++) {
      var a = k / 12 * Math.PI * 2, x = 32 + Math.sin(a) * 18, y = 32 - Math.cos(a) * 18;
      s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.2" fill="#F6C445"/>';
    }
    return s + '</svg>';
  })();
  var ICONO_PARTIDO = { arbol: I.arbol, coche: I.coche, canasta: I.canasta };
  var FONDO_PARTIDO = { arbol: '#E9EAE4', coche: '#E5E8EE', canasta: '#EEEBE6' };

  function iconoRedondo(ok, extra) {
    return el('span', { class: 'icono-redondo ' + (ok ? 'ok' : 'mal') + (extra ? ' ' + extra : ''), html: ok ? I.ok : I.mal, 'aria-hidden': 'true' });
  }

  // Colores fijos de los niveles («muñecas rusas»). Si una categoría no es un nivel, se usa un tono neutro.
  var NEUTROS = [['#1b1e3a', '#FFFFFF'], ['#5C6784', '#FFFFFF'], ['#6E6259', '#FFFFFF'], ['#4F6D7A', '#FFFFFF']];
  function colorNivel(nombre) {
    var n = normalizar(nombre);
    if (/^(ayuntamiento|municipio)/.test(n)) return ['#F4B942', '#1b1e3a'];
    if (/^provincia/.test(n)) return ['#E9C46A', '#1b1e3a'];
    if (/^comunidad/.test(n)) return ['#E07A5F', '#1b1e3a'];
    if (/^estado/.test(n)) return ['#3D8B85', '#FFFFFF'];
    if (/^union europea/.test(n)) return ['#3B5BA9', '#FFFFFF'];
    return null;
  }

  // ───────────────────────── datos ─────────────────────────
  var cacheDatos = {};
  function leerJSON(url, opcional) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('No se pudo cargar ' + url);
      return r.json();
    }).catch(function (e) { if (opcional) return null; throw e; });
  }
  function cargarDatos(raiz) {
    raiz = raiz || RAIZ;
    if (!cacheDatos[raiz]) {
      cacheDatos[raiz] = Promise.all([
        leerJSON(raiz + 'data/preguntas.json'),
        leerJSON(raiz + 'data/guiones.json', true),
        leerJSON(raiz + 'data/tiempos.json', true)
      ]).then(function (r) { return { preguntas: r[0], guiones: r[1], tiempos: r[2] }; });
      cacheDatos[raiz].catch(function () { delete cacheDatos[raiz]; });
    }
    return cacheDatos[raiz];
  }
  function segundosDe(tiempos, video, escena) {
    if (!tiempos) return null;
    var lista = tiempos[String(video)];
    if (!Array.isArray(lista)) return null;
    var t = lista[escena - 1];
    return typeof t === 'number' ? t : null;
  }
  var cargaMapa = null;
  function cargarMapa(raiz) {
    if (window.EUROPA) return Promise.resolve(window.EUROPA);
    if (!cargaMapa) {
      cargaMapa = new Promise(function (ok, ko) {
        var s = document.createElement('script');
        s.src = (raiz || RAIZ) + 'europa.js';
        s.onload = function () { window.EUROPA ? ok(window.EUROPA) : ko(new Error('Mapa vacío')); };
        s.onerror = function () { cargaMapa = null; ko(new Error('No se pudo cargar el mapa')); };
        document.head.appendChild(s);
      });
    }
    return cargaMapa;
  }

  // ───────────────────────── progreso (localStorage) ─────────────────────────
  var CLAVE = 'cajon-sociales-tema2-videos';
  var progreso = {
    leer: function () {
      try { var d = JSON.parse(localStorage.getItem(CLAVE)); return d && typeof d === 'object' && d.videos ? d : { videos: {} }; }
      catch (e) { return { videos: {} }; }
    },
    _guardar: function (d) { try { localStorage.setItem(CLAVE, JSON.stringify(d)); } catch (e) { /* modo privado o lleno */ } },
    _video: function (d, n) { return (d.videos[n] = d.videos[n] || { visto: false, superadas: [] }); },
    marcarVisto: function (n) { var d = progreso.leer(); progreso._video(d, n).visto = true; progreso._guardar(d); },
    marcarSuperada: function (n, id) {
      var d = progreso.leer(), v = progreso._video(d, n);
      if (v.superadas.indexOf(id) < 0) v.superadas.push(id);
      progreso._guardar(d);
    },
    guardarResultado: function (n, aciertos, total) {
      var d = progreso.leer(), v = progreso._video(d, n);
      v.completado = true; v.ultimo = aciertos; v.total = total;
      v.mejor = Math.max(v.mejor || 0, aciertos); v.fecha = new Date().toISOString();
      progreso._guardar(d);
    },
    // {visto, superadas (número), total, completado, ultimo, mejor}
    estado: function (n) {
      var v = progreso.leer().videos[n] || {};
      return { visto: !!v.visto, superadas: (v.superadas || []).length, total: v.total || 5, completado: !!v.completado, ultimo: v.ultimo == null ? null : v.ultimo, mejor: v.mejor == null ? null : v.mejor };
    },
    borrar: function () { try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ } }
  };

  // ───────────────────────── marcas ✓/✗ ─────────────────────────
  function marcar(nodo, ok) {
    limpiarMarca(nodo);
    nodo.classList.add(ok ? 'ok' : 'mal');
    var m = el('span', { class: 'marca ' + (ok ? 'ok' : 'mal'), html: ok ? I.ok : I.mal });
    m.appendChild(el('span', { class: 'oculto-visual', texto: ok ? ' (bien)' : ' (mal)' }));
    nodo.appendChild(m);
  }
  function limpiarMarca(nodo) {
    nodo.classList.remove('ok', 'mal');
    var m = nodo.querySelector(':scope > .marca');
    if (m) m.remove();
  }

  function crearFicha(texto, indice) {
    return el('button', { type: 'button', class: 'ficha', 'data-ficha': indice }, [
      el('span', { class: 'agarre', html: I.agarre }),
      el('span', { class: 'texto', texto: texto })
    ]);
  }

  // ───────────────────────── arrastre genérico (fichas → destinos) ─────────────────────────
  // Arrastre con Pointer Events + alternativa «tocar y tocar». Los destinos llevan [data-destino].
  // cfg.soltar(ficha, destino) mueve la ficha (lo decide cada tipo).
  function Tablero(raiz, cfg) {
    var sel = null, arr = null, ignorarClickHasta = 0, rafScroll = 0;

    function bloqueado() { return !!raiz.closest('.en-revision'); }
    function destinos() { return Array.prototype.slice.call(raiz.querySelectorAll('[data-destino]')); }
    function destinoDe(f) { return f.parentElement && f.parentElement.closest('[data-destino]'); }

    function seleccionar(f) {
      if (sel) sel.classList.remove('seleccionada');
      sel = f;
      destinos().forEach(function (d) { d.classList.toggle('destino-posible', !!f && d !== destinoDe(f)); });
      if (f) { f.classList.add('seleccionada'); f.setAttribute('aria-pressed', 'true'); }
      raiz.querySelectorAll('.ficha[aria-pressed]').forEach(function (x) { if (x !== f) x.removeAttribute('aria-pressed'); });
    }
    function soltar(f, d) {
      seleccionar(null);
      if (!d || d === destinoDe(f)) return;
      limpiarMarca(f);
      cfg.soltar(f, d);
      if (cfg.cambio) cfg.cambio();
    }

    // Los toques se resuelven en pointerup (no en «click»): tras un arrastre sobre touch-action:none, Chromium
    // puede no generar el «click» del toque siguiente. El «click» queda para teclado (Enter/Espacio).
    var toque = null;
    function abajo(e) {
      if (e.button > 0 || bloqueado()) return;
      toque = { id: e.pointerId, x: e.clientX, y: e.clientY, objetivo: e.target };
      var f = e.target.closest('.ficha');
      if (!f || !raiz.contains(f) || f.classList.contains('bloqueada')) return;
      arr = { f: f, id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, activo: false };
      try { f.setPointerCapture(e.pointerId); } catch (er) { /* nada */ }
    }
    function empezar() {
      var f = arr.f, r = f.getBoundingClientRect();
      arr.dx = arr.x0 - r.left; arr.dy = arr.y0 - r.top;
      var c = f.cloneNode(true);
      c.classList.remove('seleccionada', 'origen-arrastre');
      c.classList.add('ficha-volando');
      c.style.width = r.width + 'px';
      c.removeAttribute('data-ficha');
      document.body.appendChild(c);
      arr.clon = c; arr.activo = true;
      f.classList.add('origen-arrastre');
      seleccionar(null);
      autoScroll();
    }
    function bajoPuntero(x, y) {
      var n = document.elementFromPoint(x, y);
      var d = n && n.closest('[data-destino]');
      if (d && raiz.contains(d)) return d;
      var f = n && n.closest('.ficha');
      return f && raiz.contains(f) ? destinoDe(f) : null;
    }
    function mover(e) {
      if (!arr || e.pointerId !== arr.id) return;
      arr.x = e.clientX; arr.y = e.clientY;
      if (!arr.activo) {
        var dx = arr.x - arr.x0, dy = arr.y - arr.y0;
        if (dx * dx + dy * dy < 64) return;
        empezar();
      }
      e.preventDefault();
      pintarArrastre();
    }
    function pintarArrastre() {
      arr.clon.style.transform = 'translate(' + (arr.x - arr.dx) + 'px,' + (arr.y - arr.dy) + 'px) rotate(-2deg) scale(1.03)';
      var d = bajoPuntero(arr.x, arr.y);
      if (d !== arr.encima) {
        if (arr.encima) arr.encima.classList.remove('destino-encima');
        arr.encima = d;
        if (d) d.classList.add('destino-encima');
      }
    }
    function autoScroll() {
      cancelAnimationFrame(rafScroll);
      (function paso() {
        if (!arr || !arr.activo) return;
        var margen = 80, v = 0, h = window.innerHeight;
        if (arr.y < margen) v = -Math.ceil((margen - arr.y) / 5);
        else if (arr.y > h - margen) v = Math.ceil((arr.y - (h - margen)) / 5);
        if (v) { window.scrollBy(0, v); pintarArrastre(); }
        rafScroll = requestAnimationFrame(paso);
      })();
    }
    function arriba(e) {
      var t = toque; toque = null;
      if (!t || t.id !== e.pointerId || (arr && arr.activo)) return;
      var dx = e.clientX - t.x, dy = e.clientY - t.y;
      if (dx * dx + dy * dy > 100 || bloqueado()) return;
      ignorarClickHasta = performance.now() + 700;
      accion(t.objetivo);
    }
    function terminar(e, cancelado) {
      if (!arr || e.pointerId !== arr.id) return;
      var a = arr; arr = null;
      cancelAnimationFrame(rafScroll);
      if (!a.activo) return; // fue un toque: lo gestiona «click»
      ignorarClickHasta = performance.now() + 450;
      a.f.classList.remove('origen-arrastre');
      if (a.clon) a.clon.remove();
      if (a.encima) a.encima.classList.remove('destino-encima');
      if (!cancelado) soltar(a.f, bajoPuntero(e.clientX, e.clientY));
    }
    function click(e) {
      if (performance.now() < ignorarClickHasta || bloqueado()) return;
      accion(e.target);
    }
    function accion(objetivo) {
      if (!objetivo || !objetivo.closest) return;
      var f = objetivo.closest('.ficha');
      if (f && raiz.contains(f)) {
        var dDe = destinoDe(f);
        // Con una ficha elegida, tocar otra ya colocada equivale a tocar su caja o hueco.
        if (sel && sel !== f && dDe && dDe !== destinoDe(sel) && dDe.getAttribute('data-destino') !== 'banco') { soltar(sel, dDe); return; }
        if (f.classList.contains('bloqueada')) return;
        seleccionar(sel === f ? null : f);
        return;
      }
      var d = objetivo.closest('[data-destino]');
      if (d && raiz.contains(d) && sel) soltar(sel, d);
    }
    function tecla(e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-destino]')) { e.preventDefault(); e.target.click(); }
      if (e.key === 'Escape') seleccionar(null);
    }
    raiz.addEventListener('pointerdown', abajo);
    raiz.addEventListener('pointermove', mover);
    raiz.addEventListener('pointerup', function (e) { arriba(e); terminar(e, false); });
    raiz.addEventListener('pointercancel', function (e) { toque = null; terminar(e, true); });
    raiz.addEventListener('lostpointercapture', function (e) { if (arr && arr.activo && e.pointerId === arr.id) terminar(e, false); });
    raiz.addEventListener('click', click);
    raiz.addEventListener('keydown', tecla);
    raiz.addEventListener('dragstart', function (e) { e.preventDefault(); });
    // Consumir el touchmove de las fichas: si no, un arrastre rápido cuenta para Chromium como «fling» y el
    // siguiente toque (p. ej. en «Comprobar») se gasta en pararlo y no genera «click».
    raiz.addEventListener('touchmove', antiFling, { passive: false });
    return { deseleccionar: function () { seleccionar(null); } };
  }

  function antiFling(e) { if (e.cancelable && e.target.closest && e.target.closest('.ficha')) e.preventDefault(); }

  function banco(textoVacio) {
    return el('div', { class: 'banco', 'data-destino': 'banco', 'data-vacio': textoVacio || '¡Todas colocadas!', role: 'group', 'aria-label': 'Tarjetas por colocar' });
  }
  function actualizarBanco(b) { b.classList.toggle('vacio', !b.querySelector('.ficha')); }
  function contenedorDe(d) { return d.querySelector('[data-contenedor]') || d; }
  // Coloca una ficha en un hueco de capacidad 1 (si estaba ocupado, la anterior vuelve al banco).
  function ponerEnHueco(f, hueco, b) {
    var previa = hueco.querySelector('.ficha');
    if (previa && previa.classList.contains('bloqueada')) return; // ya corregida como buena: no se sustituye
    if (previa && previa !== f) { limpiarMarca(previa); b.appendChild(previa); }
    var origen = f.parentElement && f.parentElement.closest('.hueco, .hueco-pareja');
    hueco.appendChild(f);
    if (origen && origen !== hueco) origen.classList.remove('lleno');
    hueco.classList.add('lleno');
  }
  function aBanco(f, b) {
    var origen = f.parentElement && f.parentElement.closest('.hueco, .hueco-pareja');
    if (origen) origen.classList.remove('lleno');
    limpiarMarca(f); f.classList.remove('bloqueada');
    b.appendChild(f);
  }

  // ───────────────────────── tipos de pregunta ─────────────────────────
  // Cada tipo devuelve {pendiente() → texto|null, comprobar() → {ok, terminado?, fallos?, explicacion?}, reintentar()}
  var TIPOS = {};

  TIPOS.clasificar = function (p, zona) {
    var b = banco();
    var fichas = p.tarjetas.map(function (t, i) { return crearFicha(t.texto, i); });
    barajar(fichas).forEach(function (f) { b.appendChild(f); });
    var cajas = el('div', { class: 'cajas' + (p.categorias.length === 4 ? ' cajas-4' : '') });
    p.categorias.forEach(function (c, i) {
      var col = colorNivel(c) || NEUTROS[i % NEUTROS.length];
      cajas.appendChild(el('div', { class: 'caja', 'data-destino': 'c' + i, tabindex: '0', role: 'button', 'aria-label': 'Caja ' + c, style: '--color:' + col[0] + ';--texto:' + col[1] }, [
        el('div', { class: 'caja-titulo', texto: c }),
        el('div', { class: 'caja-fichas', 'data-contenedor': '' })
      ]));
    });
    zona.appendChild(b); zona.appendChild(cajas);
    Tablero(zona, {
      soltar: function (f, d) { contenedorDe(d).appendChild(f); },
      cambio: function () { actualizarBanco(b); }
    });
    return {
      pendiente: function () {
        var n = b.querySelectorAll('.ficha').length;
        return n ? plural(n, 'Te falta 1 tarjeta por colocar.', 'Te faltan # tarjetas por colocar.') : null;
      },
      comprobar: function () {
        var fallos = 0;
        fichas.forEach(function (f) {
          var d = f.closest('[data-destino]').getAttribute('data-destino');
          var ok = d === 'c' + p.tarjetas[+f.getAttribute('data-ficha')].cat;
          marcar(f, ok);
          if (ok) f.classList.add('bloqueada'); else fallos++;
        });
        return { ok: !fallos, fallos: fallos };
      },
      reintentar: function () {
        fichas.forEach(function (f) { if (f.classList.contains('mal')) aBanco(f, b); });
        actualizarBanco(b);
      }
    };
  };

  TIPOS.emparejar = function (p, zona) {
    var b = banco();
    var fichas = p.pares.map(function (par, i) { return crearFicha(par[1], i); });
    barajar(fichas).forEach(function (f) { b.appendChild(f); });
    var lista = el('div', { class: 'parejas' });
    var huecos = p.pares.map(function (par, i) {
      var col = colorNivel(par[0]);
      var h = el('div', { class: 'hueco-pareja', 'data-destino': 'p' + i, tabindex: '0', role: 'button', 'aria-label': 'Pareja de ' + par[0] });
      lista.appendChild(el('div', { class: 'pareja' }, [
        el('div', { class: 'pareja-izq', texto: par[0], style: col ? '--color:' + col[0] : null }),
        el('div', { class: 'pareja-flecha', html: I.flecha }),
        h
      ]));
      return h;
    });
    zona.appendChild(b); zona.appendChild(lista);
    Tablero(zona, {
      soltar: function (f, d) {
        if (d.getAttribute('data-destino') === 'banco') aBanco(f, b);
        else ponerEnHueco(f, d, b);
      },
      cambio: function () { actualizarBanco(b); }
    });
    return {
      pendiente: function () {
        var n = huecos.filter(function (h) { return !h.querySelector('.ficha'); }).length;
        return n ? plural(n, 'Te falta 1 pareja por unir.', 'Te faltan # parejas por unir.') : null;
      },
      comprobar: function () {
        var fallos = 0;
        huecos.forEach(function (h, i) {
          var f = h.querySelector('.ficha');
          var ok = +f.getAttribute('data-ficha') === i;
          marcar(f, ok);
          if (ok) f.classList.add('bloqueada'); else fallos++;
        });
        return { ok: !fallos, fallos: fallos };
      },
      reintentar: function () {
        fichas.forEach(function (f) { if (f.classList.contains('mal')) aBanco(f, b); });
        actualizarBanco(b);
      }
    };
  };

  TIPOS.huecos = function (p, zona) {
    var respuestas = [];
    var conBanco = Array.isArray(p.banco) && p.banco.length > 0;
    var b = conBanco ? banco('¡Todas colocadas!') : null;
    var lista = el('ol', { class: 'frases' });
    var huecos = [];
    p.frases.forEach(function (frase) {
      var li = el('li', { class: 'frase' });
      var ultimo = 0, m, re = /\{([^}]+)\}/g;
      while ((m = re.exec(frase))) {
        li.appendChild(document.createTextNode(frase.slice(ultimo, m.index)));
        var k = respuestas.length;
        respuestas.push(m[1]);
        var h = conBanco
          ? el('span', { class: 'hueco', 'data-destino': 'h' + k, 'data-hueco': k, tabindex: '0', role: 'button', 'aria-label': 'Hueco ' + (k + 1) })
          : el('input', { class: 'hueco-escrito', type: 'text', 'data-hueco': k, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Hueco ' + (k + 1) });
        huecos.push(h);
        ultimo = re.lastIndex;
        // si tras el hueco viene un signo de puntuación, va pegado (que no salte solo a la línea siguiente)
        var signo = /^[.,;:!?…»)]+/.exec(frase.slice(ultimo));
        if (signo) {
          var pegado = el('span', { class: 'hueco-pegado' });
          pegado.appendChild(h);
          pegado.appendChild(document.createTextNode(signo[0]));
          li.appendChild(pegado);
          ultimo += signo[0].length;
        } else li.appendChild(h);
      }
      li.appendChild(document.createTextNode(frase.slice(ultimo)));
      lista.appendChild(li);
    });
    if (conBanco) {
      barajar(p.banco.map(function (w, i) { return crearFicha(w, i); })).forEach(function (f) { b.appendChild(f); });
      zona.appendChild(b);
      Tablero(zona, {
          soltar: function (f, d) {
          if (d.getAttribute('data-destino') === 'banco') aBanco(f, b);
          else ponerEnHueco(f, d, b);
        },
        cambio: function () { actualizarBanco(b); }
      });
    }
    zona.appendChild(lista);
    function valor(h) {
      if (!conBanco) return h.value;
      var f = h.querySelector('.ficha');
      return f ? f.querySelector('.texto').textContent : '';
    }
    return {
      pendiente: function () {
        var n = huecos.filter(function (h) { return !normalizar(valor(h)); }).length;
        return n ? plural(n, 'Te falta 1 hueco por completar.', 'Te faltan # huecos por completar.') : null;
      },
      comprobar: function () {
        var fallos = 0;
        huecos.forEach(function (h, k) {
          var ok = normalizar(valor(h)) === normalizar(respuestas[k]);
          if (conBanco) {
            var f = h.querySelector('.ficha');
            marcar(f, ok);
            if (ok) f.classList.add('bloqueada');
          } else {
            h.classList.toggle('ok', ok); h.classList.toggle('mal', !ok);
            if (ok) h.readOnly = true;
          }
          if (!ok) fallos++;
        });
        return { ok: !fallos, fallos: fallos };
      },
      reintentar: function () {
        huecos.forEach(function (h) {
          if (conBanco) {
            var f = h.querySelector('.ficha.mal');
            if (f) aBanco(f, b);
          } else if (h.classList.contains('mal')) { h.classList.remove('mal'); h.value = ''; }
        });
        if (b) actualizarBanco(b);
      }
    };
  };

  TIPOS.ordenar = function (p, zona) {
    var orden = p.elementos.map(function (t, i) { return i; });
    var bar = orden;
    for (var intento = 0; intento < 20 && bar.every(function (v, i) { return v === i; }); intento++) bar = barajar(orden);
    var lista = el('ol', { class: 'lista-orden', 'aria-label': 'Tarjetas para ordenar' });
    bar.forEach(function (i) {
      var f = crearFicha(p.elementos[i], i);
      var li = el('li', { class: f.className + ' ficha-orden', 'data-ficha': i, tabindex: '0', role: 'button' });
      while (f.firstChild) li.appendChild(f.firstChild);
      lista.appendChild(li);
    });
    zona.appendChild(el('div', { class: 'orden-pista', html: I.arriba + '<span>Primero</span>' }));
    zona.appendChild(lista);
    zona.appendChild(el('div', { class: 'orden-pista abajo', html: I.abajo + '<span>Último</span>' }));

    var sel = null, arr = null, ignorarHasta = 0, raf = 0;
    function items() { return Array.prototype.slice.call(lista.children); }
    function bloqueado() { return !!zona.closest('.en-revision'); }
    function seleccionar(li) {
      if (sel) sel.classList.remove('seleccionada');
      sel = li;
      if (li) li.classList.add('seleccionada');
    }
    function limpiar() { items().forEach(limpiarMarca); }
    var toqueOrden = null;
    lista.addEventListener('pointerdown', function (e) {
      if (e.button > 0 || bloqueado()) return;
      var li = e.target.closest('.ficha-orden'); if (!li) return;
      toqueOrden = { id: e.pointerId, x: e.clientX, y: e.clientY, li: li };
      arr = { li: li, id: e.pointerId, x0: e.clientX, y0: e.clientY, y: e.clientY, activo: false };
      try { li.setPointerCapture(e.pointerId); } catch (er) { /* nada */ }
    });
    function recolocar() {
      var li = arr.li, otros = items().filter(function (x) { return x !== li; });
      var idx = 0;
      otros.forEach(function (o) { var r = o.getBoundingClientRect(); if (r.top + r.height / 2 < arr.y) idx++; });
      var lis = items(), actual = lis.indexOf(li);
      // Se mueven los vecinos, no la tarjeta arrastrada: sacarla del DOM soltaría la captura del puntero.
      if (idx < actual) { var ref = li; lis.slice(idx, actual).forEach(function (m) { ref.after(m); ref = m; }); }
      else if (idx > actual) lis.slice(actual + 1, idx + 1).forEach(function (m) { li.before(m); });
      li.style.transform = 'translateY(' + ((arr.y - arr.y0) - (li.offsetTop - arr.top0)) + 'px)';
    }
    lista.addEventListener('pointermove', function (e) {
      if (!arr || e.pointerId !== arr.id) return;
      arr.y = e.clientY;
      if (!arr.activo) {
        var dx = e.clientX - arr.x0, dy = e.clientY - arr.y0;
        if (dx * dx + dy * dy < 64) return;
        arr.activo = true; arr.top0 = arr.li.offsetTop;
        seleccionar(null); limpiar();
        arr.li.classList.add('arrastrando');
        (function paso() {
          if (!arr || !arr.activo) return;
          var m = 80, v = 0, h = window.innerHeight;
          if (arr.y < m) v = -Math.ceil((m - arr.y) / 5); else if (arr.y > h - m) v = Math.ceil((arr.y - (h - m)) / 5);
          if (v) { var antes = window.scrollY; window.scrollBy(0, v); arr.y0 -= (window.scrollY - antes); recolocar(); }
          raf = requestAnimationFrame(paso);
        })();
      }
      e.preventDefault();
      recolocar();
    });
    function fin(e) {
      if (!arr || e.pointerId !== arr.id) return;
      var a = arr; arr = null; cancelAnimationFrame(raf);
      if (!a.activo) return;
      ignorarHasta = performance.now() + 450;
      a.li.classList.remove('arrastrando'); a.li.style.transform = '';
    }
    lista.addEventListener('pointerup', function (e) {
      var t = toqueOrden; toqueOrden = null;
      var fueArrastre = arr && arr.activo;
      fin(e);
      if (!t || t.id !== e.pointerId || fueArrastre || bloqueado()) return;
      var dx = e.clientX - t.x, dy = e.clientY - t.y;
      if (dx * dx + dy * dy > 100) return;
      ignorarHasta = performance.now() + 700;
      tocarOrden(t.li);
    });
    lista.addEventListener('pointercancel', function (e) { toqueOrden = null; fin(e); });
    lista.addEventListener('lostpointercapture', fin);
    lista.addEventListener('touchmove', antiFling, { passive: false });
    lista.addEventListener('click', function (e) {
      if (performance.now() < ignorarHasta || bloqueado()) return;
      var li = e.target.closest('.ficha-orden'); if (li) tocarOrden(li);
    });
    function tocarOrden(li) {
      if (!sel) { seleccionar(li); return; }
      if (sel === li) { seleccionar(null); return; }
      var lis = items();
      if (lis.indexOf(sel) < lis.indexOf(li)) li.after(sel); else li.before(sel);
      seleccionar(null); limpiar();
    }
    lista.addEventListener('keydown', function (e) {
      var li = e.target.closest('.ficha-orden'); if (!li || bloqueado()) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); }
      if (e.key === 'ArrowUp' && li.previousElementSibling) { e.preventDefault(); li.previousElementSibling.before(li); li.focus(); limpiar(); }
      if (e.key === 'ArrowDown' && li.nextElementSibling) { e.preventDefault(); li.nextElementSibling.after(li); li.focus(); limpiar(); }
    });
    return {
      pendiente: function () { return null; },
      comprobar: function () {
        seleccionar(null);
        var fallos = 0;
        items().forEach(function (li, pos) { var ok = +li.getAttribute('data-ficha') === pos; marcar(li, ok); if (!ok) fallos++; });
        return { ok: !fallos, fallos: fallos };
      },
      reintentar: function () { limpiar(); }
    };
  };

  function campoNumero(etiqueta, id) {
    var input = el('input', { class: 'entrada-num', id: id, type: 'text', inputmode: 'numeric', autocomplete: 'off', enterkeyhint: 'done' });
    return { input: input, nodo: el('div', { class: 'campo-num' }, [el('label', { for: id, texto: etiqueta }), el('div', { class: 'envoltorio-num' }, input)]) };
  }
  var idUnico = 0;

  TIPOS.numeros = function (p, zona) {
    var cont = el('div', { class: 'campos-num' });
    var entradas = p.campos.map(function (c) {
      var campo = campoNumero(c.etiqueta, 'num-' + (++idUnico));
      cont.appendChild(campo.nodo);
      return campo.input;
    });
    zona.appendChild(cont);
    return {
      pendiente: function () {
        var vacios = entradas.filter(function (i) { return !i.value.trim(); }).length;
        if (vacios) return plural(vacios, 'Te falta 1 casilla por rellenar.', 'Te faltan # casillas por rellenar.');
        var raros = entradas.filter(function (i) { return isNaN(leerNumero(i.value)); }).length;
        return raros ? 'Escribe solo números, sin letras.' : null;
      },
      comprobar: function () {
        var fallos = 0;
        entradas.forEach(function (i, k) {
          var ok = Math.abs(leerNumero(i.value) - p.campos[k].respuesta) < 1e-9;
          marcar(i.parentNode, ok);
          i.classList.toggle('ok', ok); i.classList.toggle('mal', !ok);
          i.readOnly = ok;
          if (!ok) fallos++;
        });
        return { ok: !fallos, fallos: fallos };
      },
      reintentar: function () {
        entradas.forEach(function (i) {
          if (i.classList.contains('mal')) { i.classList.remove('mal'); i.value = ''; limpiarMarca(i.parentNode); }
        });
        var primero = entradas.filter(function (i) { return !i.readOnly; })[0];
        if (primero) primero.focus({ preventScroll: true });
      }
    };
  };

  TIPOS.dhondt = function (p, zona, ctx) {
    var N = p.escanos, D = p.divisores, partidos = p.partidos;
    var exacto = partidos.map(function (pt) { var f = []; for (var j = 1; j <= D; j++) f.push(pt.votos / j); return f; });
    // Los N cocientes más altos.
    var todos = [];
    exacto.forEach(function (f, i) { f.forEach(function (v, j) { todos.push({ i: i, j: j, v: v }); }); });
    todos.sort(function (a, b) { return b.v - a.v; });
    var ganadores = {};
    todos.slice(0, N).forEach(function (c) { ganadores[c.i + '-' + c.j] = true; });
    var solucion = p.solucion || {};
    var escanosCorrectos = partidos.map(function (pt, i) {
      if (pt.nombre in solucion) return solucion[pt.nombre];
      return todos.slice(0, N).filter(function (c) { return c.i === i; }).length;
    });

    var paso = 1;
    var pasos = el('ol', { class: 'pasos', 'aria-label': 'Pasos' });
    var nombresPasos = ['Divide', 'Elige los ' + N + ' mayores', 'Cuenta escaños'];
    nombresPasos.forEach(function (t, k) { pasos.appendChild(el('li', {}, [el('span', { class: 'n', texto: String(k + 1) }), t])); });
    var textoPaso = el('p', { class: 'paso-texto', 'aria-live': 'polite' });
    var tabla = el('table', { class: 'tabla-dhondt' });
    var colg = el('colgroup', {}, [el('col', { class: 'col-partido' })]);
    for (var j = 0; j < D; j++) colg.appendChild(el('col'));
    tabla.appendChild(colg);
    var trh = el('tr', {}, [el('th', { scope: 'col', texto: 'Partido' })]);
    for (j = 1; j <= D; j++) trh.appendChild(el('th', { scope: 'col', texto: '÷ ' + j }));
    tabla.appendChild(el('thead', {}, trh));
    var tbody = el('tbody');
    var celdas = [];
    function fichaPartido(pt) {
      return el('div', { class: 'partido', style: '--fondo-partido:' + (FONDO_PARTIDO[pt.icono] || '#ECEAE4') }, [
        el('span', { class: 'icono-partido', html: ICONO_PARTIDO[pt.icono] || '' }),
        el('span', {}, [el('span', { class: 'nombre', texto: pt.nombre }), el('span', { class: 'votos', texto: miles(pt.votos) + ' votos' })])
      ]);
    }
    partidos.forEach(function (pt, i) {
      var tr = el('tr', {}, [el('th', { scope: 'row' }, fichaPartido(pt))]);
      celdas[i] = [];
      for (var jj = 0; jj < D; jj++) {
        var input = el('input', { class: 'entrada-cociente', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'data-celda': i + '-' + jj, 'aria-label': pt.nombre + ' entre ' + (jj + 1) });
        var td = el('td', { class: 'celda-dhondt' }, input);
        celdas[i][jj] = { td: td, input: input, boton: null, elegida: false };
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
    tabla.appendChild(tbody);
    var escanosBloque = el('div', { class: 'escanos-bloque', hidden: true });
    var entradasEscanos = [];
    zona.appendChild(pasos); zona.appendChild(textoPaso); zona.appendChild(tabla); zona.appendChild(escanosBloque);

    function cadaCelda(fn) { celdas.forEach(function (f, i) { f.forEach(function (c, jj) { fn(c, i, jj); }); }); }
    function elegidas() { var n = 0; cadaCelda(function (c) { if (c.elegida) n++; }); return n; }
    function pintarPasos() {
      Array.prototype.forEach.call(pasos.children, function (li, k) {
        li.classList.toggle('actual', k + 1 === paso);
        li.classList.toggle('hecho', k + 1 < paso);
        li.querySelector('.n').innerHTML = k + 1 < paso ? I.ok : String(k + 1);
      });
      if (paso === 1) textoPaso.textContent = 'Paso 1: divide los votos de cada partido entre 1, entre 2 y entre 3. Si no sale exacto, redondea.';
      if (paso === 2) {
        textoPaso.textContent = 'Paso 2: toca los ' + N + ' números más altos de toda la tabla.';
        textoPaso.appendChild(el('span', { class: 'contador-sel', texto: elegidas() + ' de ' + N }));
      }
      if (paso === 3) textoPaso.textContent = 'Paso 3: cada número elegido es un escaño. ¿Cuántos escaños gana cada partido?';
    }
    function irPaso2() {
      paso = 2;
      cadaCelda(function (c, i, jj) {
        limpiarMarca(c.td);
        var b = el('button', { type: 'button', class: 'celda-cociente', 'data-celda': i + '-' + jj, 'aria-pressed': 'false', texto: miles(exacto[i][jj]) });
        b.addEventListener('click', function () {
          if (zona.closest('.en-revision') || b.classList.contains('bloqueada')) return;
          if (!c.elegida && elegidas() >= N) { ctx.aviso('Ya has elegido ' + N + '. Toca uno elegido para quitarlo.'); return; }
          c.elegida = !c.elegida;
          b.classList.toggle('elegida', c.elegida);
          b.setAttribute('aria-pressed', String(c.elegida));
          ctx.aviso('');
          pintarPasos();
        });
        c.input.replaceWith(b); c.boton = b;
      });
      pintarPasos();
    }
    function irPaso3() {
      paso = 3;
      cadaCelda(function (c) { c.boton.classList.add('bloqueada'); c.boton.disabled = !c.elegida; limpiarMarca(c.td); });
      escanosBloque.hidden = false;
      escanosBloque.appendChild(el('p', { class: 'escanos-titulo', texto: 'Escaños de cada partido' }));
      var lista = el('div', { class: 'escanos-lista' });
      partidos.forEach(function (pt) {
        var id = 'esc-' + (++idUnico);
        var input = el('input', { class: 'entrada-num', id: id, type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Escaños de ' + pt.nombre });
        entradasEscanos.push(input);
        lista.appendChild(el('div', { class: 'escanos-fila' }, [fichaPartido(pt), el('div', { class: 'envoltorio-num' }, input)]));
      });
      escanosBloque.appendChild(lista);
      pintarPasos();
    }
    pintarPasos();

    return {
      pendiente: function () {
        if (paso === 1) {
          var vacias = 0, raras = 0;
          cadaCelda(function (c) { if (!c.input.value.trim()) vacias++; else if (isNaN(leerNumero(c.input.value))) raras++; });
          if (vacias) return plural(vacias, 'Te falta 1 casilla por rellenar.', 'Te faltan # casillas por rellenar.');
          return raras ? 'Escribe solo números (puedes usar puntos de miles: 16.000).' : null;
        }
        if (paso === 2) { var n = elegidas(); return n !== N ? 'Tienes que tocar ' + N + ' números (llevas ' + n + ').' : null; }
        var v = entradasEscanos.filter(function (i) { return !i.value.trim() || isNaN(leerNumero(i.value)); }).length;
        return v ? 'Escribe un número de escaños para cada partido (puede ser 0).' : null;
      },
      comprobar: function () {
        var fallos = 0;
        if (paso === 1) {
          cadaCelda(function (c, i, jj) {
            var ok = Math.abs(leerNumero(c.input.value) - exacto[i][jj]) < 1;
            marcar(c.td, ok);
            c.input.classList.toggle('ok', ok); c.input.classList.toggle('mal', !ok);
            c.input.readOnly = ok;
            if (ok) c.input.value = miles(exacto[i][jj]); // se muestra ya redondeado y con puntos de miles
            if (!ok) fallos++;
          });
          if (fallos) return { ok: false, fallos: fallos, explicacion: 'Cada casilla es: votos del partido ÷ número de la columna. Si la división no es exacta, vale con redondear.' };
          irPaso2();
          return { ok: true, terminado: false, mensaje: '¡Divisiones correctas! Ahora, el paso 2.' };
        }
        if (paso === 2) {
          cadaCelda(function (c, i, jj) {
            if (!c.elegida) return;
            var ok = !!ganadores[i + '-' + jj];
            marcar(c.td, ok);
            c.boton.classList.toggle('ok', ok); c.boton.classList.toggle('mal', !ok);
            if (ok) c.boton.classList.add('bloqueada'); else fallos++;
          });
          if (fallos) return { ok: false, fallos: fallos, explicacion: 'Busca los ' + N + ' números más grandes de toda la tabla, sean del partido que sean. ' + p.explicacion };
          irPaso3();
          return { ok: true, terminado: false, mensaje: '¡Esos son los ' + N + ' mayores! Último paso.' };
        }
        entradasEscanos.forEach(function (input, i) {
          var ok = leerNumero(input.value) === escanosCorrectos[i];
          marcar(input.parentNode, ok);
          input.classList.toggle('ok', ok); input.classList.toggle('mal', !ok);
          input.readOnly = ok;
          if (!ok) fallos++;
        });
        return { ok: !fallos, terminado: true, fallos: fallos, explicacion: 'Cuenta cuántos números elegidos tiene cada partido. ' + p.explicacion };
      },
      reintentar: function () {
        if (paso === 1) cadaCelda(function (c) { if (c.input.classList.contains('mal')) { c.input.value = ''; c.input.classList.remove('mal'); limpiarMarca(c.td); } });
        if (paso === 2) cadaCelda(function (c) {
          if (c.boton.classList.contains('mal')) { c.elegida = false; c.boton.classList.remove('mal', 'elegida'); c.boton.setAttribute('aria-pressed', 'false'); limpiarMarca(c.td); }
        });
        if (paso === 3) entradasEscanos.forEach(function (i) { if (i.classList.contains('mal')) { i.value = ''; i.classList.remove('mal'); limpiarMarca(i.parentNode); } });
        pintarPasos();
      }
    };
  };

  TIPOS.mapa = function (p, zona, ctx) {
    var E = ctx.mapa;
    var pedir = { ue: p.pedir_ue || 0, no: p.pedir_no_ue || 0 };
    var pincel = pedir.ue ? 'ue' : 'no';
    var marcados = {}; // id → 'ue' | 'no'
    var porId = {};
    E.paises.forEach(function (x) { porId[x.id] = x; });

    var svg = svgEl('svg', { class: 'mapa-svg', viewBox: '0 0 ' + E.ancho + ' ' + E.alto, role: 'img', 'aria-label': 'Mapa de Europa' });
    var defs = svgEl('defs', {});
    var pat = svgEl('pattern', { id: 'rayas-no-ue', width: '8', height: '8', patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
    pat.appendChild(svgEl('rect', { width: '8', height: '8', fill: '#B7C0CE' }));
    pat.appendChild(svgEl('rect', { width: '4', height: '8', fill: '#8D99AE' }));
    defs.appendChild(pat); svg.appendChild(defs);
    svg.appendChild(svgEl('rect', { x: '-2000', y: '-2000', width: '6000', height: '6000', fill: '#D6E6EC' }));
    svg.appendChild(svgEl('path', { class: 'fondo-tierra', d: E.fondo }));
    var gPaises = svgEl('g', {}), gZonas = svgEl('g', {}), gMarcas = svgEl('g', { class: 'marcas-mapa' });
    var caminos = {}, zonas = {};
    E.paises.forEach(function (x) {
      var pth = svgEl('path', { class: 'pais', d: x.d, 'data-pais': x.id });
      var t = svgEl('title', {}); t.textContent = x.nombre; pth.appendChild(t);
      gPaises.appendChild(pth); caminos[x.id] = pth;
      if (x.pequeno) {
        var c = svgEl('circle', { class: 'zona-pequena', cx: x.x, cy: x.y, r: 16, 'data-pais': x.id });
        gZonas.appendChild(c); zonas[x.id] = c;
      }
    });
    svg.appendChild(gPaises); svg.appendChild(gZonas); svg.appendChild(gMarcas);
    var gEtq = svgEl('g', { class: 'etiqueta-pais', visibility: 'hidden' });
    var rEtq = svgEl('rect', { rx: 8, ry: 8 }), tEtq = svgEl('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central' });
    gEtq.appendChild(rEtq); gEtq.appendChild(tEtq); svg.appendChild(gEtq);

    var nombre = el('div', { class: 'oculto-visual', 'aria-live': 'polite' });
    var bMas = el('button', { type: 'button', class: 'boton-zoom', html: I.mas + '<span>Acercar</span>' });
    var bMenos = el('button', { type: 'button', class: 'boton-zoom', html: I.menos + '<span>Alejar</span>', disabled: true });
    var marco = el('div', { class: 'mapa-columna' }, [el('div', { class: 'mapa-marco' }, [svg, nombre]), el('div', { class: 'mapa-zoom' }, [bMas, bMenos])]);

    var botones = {};
    function botonPincel(tipo, texto) {
      var cuenta = el('span', { class: 'cuenta' });
      var b = el('button', { type: 'button', class: 'pincel', 'data-pincel': tipo, 'aria-pressed': String(pincel === tipo) }, [
        el('span', { class: 'muestra ' + tipo, html: tipo === 'ue' ? '<svg viewBox="0 0 24 24" aria-hidden="true" style="color:#F6C445">' + I.estrella.replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</svg>' : '' }),
        el('span', {}, [texto, cuenta])
      ]);
      b.addEventListener('click', function () { if (!zona.closest('.en-revision')) { pincel = tipo; pintar(); } });
      botones[tipo] = { b: b, cuenta: cuenta };
      return b;
    }
    var pinceles = el('div', { class: 'pinceles', role: 'group', 'aria-label': 'Elige qué vas a marcar' });
    if (pedir.ue) pinceles.appendChild(botonPincel('ue', 'País de la UE'));
    if (pedir.no) pinceles.appendChild(botonPincel('no', 'No es de la UE'));
    var lista = el('ul', { class: 'lista-marcados', 'aria-label': 'Países marcados' });
    var panel = el('div', { class: 'mapa-panel' }, [pinceles, lista]);
    zona.appendChild(el('div', { class: 'mapa-zona' }, [marco, panel]));

    function cuenta(tipo) { var n = 0; for (var k in marcados) if (marcados[k] === tipo) n++; return n; }
    function pintar() {
      for (var tipo in botones) {
        botones[tipo].b.setAttribute('aria-pressed', String(pincel === tipo));
        botones[tipo].cuenta.textContent = cuenta(tipo) + ' de ' + pedir[tipo];
      }
      E.paises.forEach(function (x) {
        var m = marcados[x.id];
        caminos[x.id].classList.toggle('marcado-ue', m === 'ue');
        caminos[x.id].classList.toggle('marcado-no', m === 'no');
        if (zonas[x.id]) { zonas[x.id].classList.toggle('marcado-ue', m === 'ue'); zonas[x.id].classList.toggle('marcado-no', m === 'no'); }
      });
      // lista
      lista.innerHTML = '';
      Object.keys(marcados).forEach(function (id) {
        var li = el('li', { 'data-pais': id }, [el('span', { class: 'punto ' + marcados[id] }), porId[id].nombre,
          el('span', { class: 'tipo', texto: marcados[id] === 'ue' ? 'UE' : 'no UE' })]);
        if (resultado[id] != null) li.insertBefore(iconoRedondo(resultado[id]), li.firstChild);
        lista.appendChild(li);
      });
      // estrellas / marcas sobre el mapa
      gMarcas.innerHTML = '';
      var u = unidad();
      Object.keys(marcados).forEach(function (id) {
        var x = porId[id];
        if (resultado[id] != null) {
          var g = svgEl('g', { transform: 'translate(' + x.x + ' ' + x.y + ') scale(' + (u * 30 / 24) + ') translate(-12 -12)' });
          g.appendChild(svgEl('circle', { cx: 12, cy: 12, r: 12, fill: resultado[id] ? '#2A9D8F' : '#D1495B', stroke: '#fff', 'stroke-width': 2.5 }));
          g.appendChild(svgEl('path', { d: resultado[id] ? 'M6.5 12.6l3.8 3.8L17.5 8.6' : 'M8 8l8 8M16 8l-8 8', fill: 'none', stroke: '#fff', 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
          gMarcas.appendChild(g);
        } else if (marcados[id] === 'ue') {
          var s = svgEl('g', { transform: 'translate(' + x.x + ' ' + x.y + ') scale(' + (u * 22 / 24) + ') translate(-12 -12)' });
          s.appendChild(svgEl('path', { d: 'M12 2.8l2.75 5.6 6.15.9-4.45 4.33 1.05 6.12L12 16.87l-5.5 2.88 1.05-6.12L3.1 9.3l6.15-.9z', fill: '#F6C445', stroke: '#1b1e3a', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }));
          gMarcas.appendChild(s);
        }
      });
    }
    var resultado = {};

    // zoom y desplazamiento
    var vb = { x: 0, y: 0, w: E.ancho, h: E.alto }, nivel = 1;
    function unidad() { var r = svg.getBoundingClientRect(); return r.width ? vb.w / r.width : 1; } // unidades del mapa por píxel
    function aplicarVista() {
      vb.x = Math.max(0, Math.min(E.ancho - vb.w, vb.x));
      vb.y = Math.max(0, Math.min(E.alto - vb.h, vb.y));
      svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
      svg.classList.toggle('ampliado', nivel > 1);
      bMenos.disabled = nivel <= 1; bMas.disabled = nivel >= 4;
      var u = unidad(), r = Math.min(30, Math.max(12, 22 * u));
      for (var id in zonas) zonas[id].setAttribute('r', r);
      if (ultimoTocado) mostrarEtiqueta(ultimoTocado);
      pintar();
    }
    function zoom(factor, cx, cy) {
      var nuevo = Math.max(1, Math.min(4, nivel * factor));
      if (nuevo === nivel) return;
      if (cx == null) { cx = vb.x + vb.w / 2; cy = vb.y + vb.h / 2; }
      nivel = nuevo; vb.w = E.ancho / nivel; vb.h = E.alto / nivel;
      vb.x = cx - vb.w / 2; vb.y = cy - vb.h / 2;
      aplicarVista();
    }
    bMas.addEventListener('click', function () {
      var c = ultimoTocado ? porId[ultimoTocado] : null;
      zoom(2, c ? c.x : null, c ? c.y : null);
    });
    bMenos.addEventListener('click', function () { zoom(0.5); });

    var ultimoTocado = null;
    function mostrarEtiqueta(id) {
      var x = porId[id], u = unidad(), fs = 18 * u;
      tEtq.setAttribute('font-size', fs);
      tEtq.textContent = x.nombre;
      var ancho = Math.max(fs * 2, tEtq.getComputedTextLength ? tEtq.getComputedTextLength() : x.nombre.length * fs * .55) + fs * 1.1;
      var alto = fs * 1.8;
      var lx = Math.max(vb.x + ancho / 2 + 4 * u, Math.min(vb.x + vb.w - ancho / 2 - 4 * u, x.x));
      var ly = x.y - alto / 2 - 14 * u;
      if (ly - alto / 2 < vb.y) ly = x.y + alto / 2 + 14 * u;
      tEtq.setAttribute('x', lx); tEtq.setAttribute('y', ly);
      rEtq.setAttribute('x', lx - ancho / 2); rEtq.setAttribute('y', ly - alto / 2);
      rEtq.setAttribute('width', ancho); rEtq.setAttribute('height', alto);
      rEtq.setAttribute('rx', alto / 2); rEtq.setAttribute('ry', alto / 2);
      gEtq.setAttribute('visibility', 'visible');
    }
    function tocar(id) {
      if (zona.closest('.en-revision')) return;
      var x = porId[id]; if (!x) return;
      if (ultimoTocado && caminos[ultimoTocado]) caminos[ultimoTocado].classList.remove('tocado');
      ultimoTocado = id; caminos[id].classList.add('tocado');
      nombre.textContent = x.nombre;
      mostrarEtiqueta(id);
      ctx.aviso('');
      if (resultado[id] === true) return; // ya corregido como bien: no se toca
      if (marcados[id] === pincel) { delete marcados[id]; }
      else if (cuenta(pincel) >= pedir[pincel]) {
        ctx.aviso(pincel === 'ue'
          ? 'Ya has marcado ' + pedir.ue + ' ' + plural(pedir.ue, 'país', 'países') + ' de la UE. Toca uno marcado para quitarlo' + (pedir.no ? ' o cambia de pincel.' : '.')
          : 'Ya has marcado ' + pedir.no + ' ' + plural(pedir.no, 'país', 'países') + ' que no ' + plural(pedir.no, 'es', 'son') + ' de la UE. Toca uno marcado para quitarlo' + (pedir.ue ? ' o cambia de pincel.' : '.'));
        return;
      } else { marcados[id] = pincel; }
      delete resultado[id];
      pintar();
    }
    // Toque vs. arrastre (para mover el mapa cuando está ampliado).
    var ptr = null;
    svg.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      ptr = { id: e.pointerId, x0: e.clientX, y0: e.clientY, vx: vb.x, vy: vb.y, mueve: false, objetivo: e.target };
      if (nivel > 1) { try { svg.setPointerCapture(e.pointerId); } catch (er) { /* nada */ } }
    });
    svg.addEventListener('pointermove', function (e) {
      if (!ptr || e.pointerId !== ptr.id) return;
      var dx = e.clientX - ptr.x0, dy = e.clientY - ptr.y0;
      if (!ptr.mueve && dx * dx + dy * dy > 100) ptr.mueve = true;
      if (ptr.mueve && nivel > 1) {
        var u = unidad();
        vb.x = ptr.vx - dx * u; vb.y = ptr.vy - dy * u;
        vb.x = Math.max(0, Math.min(E.ancho - vb.w, vb.x)); vb.y = Math.max(0, Math.min(E.alto - vb.h, vb.y));
        svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
        e.preventDefault();
      }
    });
    svg.addEventListener('pointerup', function (e) {
      if (!ptr || e.pointerId !== ptr.id) return;
      var a = ptr; ptr = null;
      if (a.mueve) return;
      var n = document.elementFromPoint(e.clientX, e.clientY) || a.objetivo;
      var objetivo = n && n.closest && n.closest('[data-pais]');
      if (objetivo) tocar(objetivo.getAttribute('data-pais'));
      else if (n && n.classList && n.classList.contains('fondo-tierra') && !zona.closest('.en-revision')) {
        ctx.aviso('Esa zona no cuenta en esta pregunta. Toca uno de los países blancos.');
      }
    });
    svg.addEventListener('pointercancel', function () { ptr = null; });
    svg.addEventListener('touchmove', function (e) { if (nivel > 1 && e.cancelable) e.preventDefault(); }, { passive: false });
    window.addEventListener('resize', aplicarVista);
    requestAnimationFrame(aplicarVista);

    return {
      pendiente: function () {
        var faltan = [];
        if (cuenta('ue') !== pedir.ue) faltan.push(pedir.ue + ' ' + plural(pedir.ue, 'país', 'países') + ' de la UE (llevas ' + cuenta('ue') + ')');
        if (cuenta('no') !== pedir.no) faltan.push(pedir.no + ' ' + plural(pedir.no, 'país europeo', 'países europeos') + ' que no ' + plural(pedir.no, 'sea', 'sean') + ' de la UE (llevas ' + cuenta('no') + ')');
        return faltan.length ? 'Tienes que marcar ' + faltan.join(' y ') + '.' : null;
      },
      comprobar: function () {
        var fallos = 0;
        Object.keys(marcados).forEach(function (id) {
          var ok = (marcados[id] === 'ue') === porId[id].ue;
          resultado[id] = ok; if (!ok) fallos++;
        });
        pintar();
        return { ok: !fallos, fallos: fallos };
      },
      reintentar: function () {
        Object.keys(resultado).forEach(function (id) { if (!resultado[id]) { delete marcados[id]; delete resultado[id]; } });
        if (cuenta('ue') < pedir.ue) pincel = 'ue'; else if (cuenta('no') < pedir.no) pincel = 'no';
        pintar();
      },
      destruir: function () { window.removeEventListener('resize', aplicarVista); }
    };
  };

  var INSTRUCCIONES = {
    clasificar: 'Arrastra cada tarjeta a su caja. También puedes tocar una tarjeta y después la caja.',
    emparejar: 'Arrastra cada tarjeta al hueco de su pareja. También puedes tocar la tarjeta y después el hueco.',
    huecos: 'Arrastra cada palabra a su hueco. También puedes tocar la palabra y después el hueco.',
    huecosEscribir: 'Escribe la palabra que falta en cada hueco.',
    ordenar: 'Arrastra las tarjetas para ponerlas en orden. También puedes tocar una tarjeta y después el sitio donde va.',
    numeros: 'Escribe un número en cada casilla.',
    dhondt: 'Hazlo en tres pasos. Ve comprobando cada paso.',
    mapa: 'Elige arriba qué vas a marcar y toca los países en el mapa. Al tocar un país verás su nombre. Con «Acercar» verás mejor los países pequeños.'
  };
  var FELICITACIONES = ['Correcto.', 'Eso es.', 'Bien visto.', 'Exacto.', 'Así es.'];

  // ───────────────────────── montaje ─────────────────────────
  function montar(contenedor, numeroVideo, opciones) {
    opciones = opciones || {};
    var raiz = opciones.raiz || RAIZ;
    var n = +numeroVideo;
    var destruido = false, tipoActual = null;
    // Con preguntas propias no se toca el progreso guardado, salvo que se pida (guardarProgreso: true).
    var guardar = opciones.guardarProgreso != null ? !!opciones.guardarProgreso : !Array.isArray(opciones.preguntas);
    // Volver a montar en el mismo contenedor desmonta el motor anterior (listeners del mapa, etc.).
    if (contenedor.__motor && contenedor.__motor.destruir) { try { contenedor.__motor.destruir(); } catch (e) { /* nada */ } }
    contenedor.__motor = { destruir: function () { destruido = true; if (tipoActual && tipoActual.destruir) tipoActual.destruir(); tipoActual = null; } };
    contenedor.innerHTML = '';
    var motor = el('section', { class: 'motor', 'aria-live': 'off' });
    contenedor.appendChild(motor);
    motor.appendChild(el('p', { class: 'motor-cargando', texto: 'Cargando preguntas…' }));

    return cargarDatos(raiz).then(function (datos) {
      var bloque = (datos.preguntas.videos || []).filter(function (v) { return v.video === n; })[0];
      var preguntas = Array.isArray(opciones.preguntas) ? opciones.preguntas : bloque && bloque.preguntas;
      if (!preguntas || !preguntas.length) throw new Error('No hay preguntas para el vídeo ' + n);
      var necesitaMapa = preguntas.some(function (p) { return p.tipo === 'mapa'; });
      return (necesitaMapa ? cargarMapa(raiz) : Promise.resolve(null)).then(function (mapa) {
        return iniciar(datos, preguntas, mapa);
      });
    }).catch(function (e) {
      motor.innerHTML = '';
      motor.appendChild(el('p', { class: 'motor-error', texto: 'No se han podido cargar las preguntas. ' + (e && e.message ? '(' + e.message + ')' : '') }));
      throw e;
    });

    function iniciar(datos, preguntas, mapa) {
      var totalVideos = (datos.preguntas.videos || []).length || 5;
      var estado;
      function reiniciarEstado() {
        estado = { i: 0, res: preguntas.map(function (p) { return { id: p.id, tipo: p.tipo, aLaPrimera: true, intentos: 0, superada: false }; }) };
      }
      reiniciarEstado();

      function cabecera() {
        var puntos = el('ol', { class: 'puntos', 'aria-hidden': 'true' });
        estado.res.forEach(function (r, k) {
          puntos.appendChild(el('li', { class: k === estado.i ? 'actual' : r.superada ? (r.aLaPrimera ? 'hecha' : 'hecha-tarde') : '' }));
        });
        return el('div', { class: 'motor-progreso' }, [
          el('span', { class: 'contador', texto: 'Pregunta ' + (estado.i + 1) + ' de ' + preguntas.length }), puntos
        ]);
      }

      function enlaceRepaso(p) {
        var escenas = (p.escenas || []).filter(function (x) { return typeof x === 'number'; });
        if (!escenas.length) return null;
        var escena = Math.min.apply(null, escenas);
        var seg = segundosDe(datos.tiempos, n, escena);
        var texto = seg != null ? 'Vuelve a ver el vídeo en el minuto ' + formatoMinuto(seg) : 'Vuelve a ver el vídeo';
        var href = opciones.urlRepaso ? opciones.urlRepaso(n, seg || 0) : raiz + 'leccion.html?v=' + n + (seg != null ? '&t=' + Math.floor(seg) : '');
        var a = el('a', { class: 'enlace-repaso', href: href, 'data-segundos': seg == null ? '' : seg, 'data-escena': escena }, [
          el('span', { class: 'play', html: I.play }), el('span', { texto: texto })
        ]);
        a.addEventListener('click', function (e) {
          var info = { video: n, escena: escena, pregunta: p.id, segundos: seg || 0 };
          emitir(contenedor, 'motor:repaso', { video: n, id: p.id, escena: escena, segundos: seg || 0 });
          if (opciones.alPedirRepaso) { e.preventDefault(); opciones.alPedirRepaso(seg || 0, info); }
        });
        return a;
      }

      function mostrar(i) {
        if (tipoActual && tipoActual.destruir) tipoActual.destruir();
        estado.i = i;
        var p = preguntas[i];
        var r = estado.res[i];
        motor.innerHTML = '';
        motor.appendChild(cabecera());
        var tarjeta = el('article', { class: 'pregunta tipo-' + p.tipo, 'data-pregunta': p.id, 'aria-labelledby': 'enunciado-' + p.id });
        tarjeta.appendChild(el('h2', { class: 'enunciado', id: 'enunciado-' + p.id, texto: p.enunciado }));
        var instr = p.tipo === 'huecos' && !(p.banco && p.banco.length) ? INSTRUCCIONES.huecosEscribir : INSTRUCCIONES[p.tipo];
        if (p.tipo === 'huecos' && p.banco && p.banco.length) {
          var nh = p.frases.join(' ').split('{').length - 1;
          if (p.banco.length > nh) instr += ' ¡Ojo! Sobra alguna palabra.';
        }
        // Si el enunciado ya dice «Arrastra…», no se repite la primera frase de la instrucción.
        if (/^arrastra/.test(normalizar(p.enunciado)) && /^Arrastra/.test(instr)) instr = instr.replace(/^[^.]*\.\s*/, '');
        tarjeta.appendChild(el('p', { class: 'instruccion' }, [el('span', { html: I.mano }), el('span', { texto: instr })]));
        var zona = el('div', { class: 'zona' });
        tarjeta.appendChild(zona);
        var aviso = el('p', { class: 'aviso', role: 'status', 'aria-live': 'polite' });
        tarjeta.appendChild(aviso);
        var bComprobar = el('button', { type: 'button', class: 'boton boton-principal boton-comprobar', html: I.ok + '<span>Comprobar</span>' });
        var acciones = el('div', { class: 'acciones' }, bComprobar);
        tarjeta.appendChild(acciones);
        var panel = el('div', { class: 'respuesta', hidden: true, 'aria-live': 'polite' });
        tarjeta.appendChild(panel);
        motor.appendChild(tarjeta);

        var avisoPendiente = false; // el aviso visible es un «te falta…»: se recalcula al cambiar algo
        var ctx = {
          mapa: mapa,
          aviso: function (t, bien) { avisoPendiente = false; aviso.textContent = t || ''; aviso.classList.toggle('aviso-bien', !!bien); }
        };
        var tipo = TIPOS[p.tipo];
        if (!tipo) { zona.appendChild(el('p', { class: 'motor-error', texto: 'Tipo de pregunta desconocido: ' + p.tipo })); return; }
        tipoActual = tipo(p, zona, ctx);
        emitir(contenedor, 'motor:pregunta', { video: n, indice: i, id: p.id });
        function refrescarPendiente() {
          if (!avisoPendiente) return;
          setTimeout(function () {
            if (!avisoPendiente || !tipoActual) return;
            var t = tipoActual.pendiente();
            aviso.textContent = t || '';
            if (!t) avisoPendiente = false;
          }, 0);
        }
        ['input', 'click', 'pointerup', 'keyup'].forEach(function (ev) { zona.addEventListener(ev, refrescarPendiente); });
        // Clic fantasma: con el dedo, Chromium decide el «click» después del pointerup. Si al soltar la última ficha
        // el banco encoge y «Comprobar» sube bajo el dedo, ese mismo toque lo pulsaba. Se ignora un instante.
        var ultimoToqueZona = 0;
        zona.addEventListener('pointerup', function () { ultimoToqueZona = performance.now(); }, true);

        bComprobar.addEventListener('click', function () {
          if (performance.now() - ultimoToqueZona < 200) return;
          var falta = tipoActual.pendiente();
          if (falta) { ctx.aviso(falta); avisoPendiente = true; return; }
          ctx.aviso('');
          r.intentos++;
          var res = tipoActual.comprobar();
          var terminado = res.terminado !== false;
          emitir(contenedor, 'motor:comprobado', { video: n, id: p.id, ok: res.ok, intento: r.intentos, terminado: res.ok && terminado });
          if (res.ok && !terminado) { ctx.aviso(res.mensaje || '¡Bien! Sigue.', true); return; }
          if (!res.ok) {
            r.aLaPrimera = false;
            tarjeta.classList.add('en-revision');
            acciones.hidden = true;
            panel.className = 'respuesta respuesta-mal';
            panel.innerHTML = '';
            panel.appendChild(el('p', { class: 'respuesta-titulo' }, [iconoRedondo(false),
              el('span', { texto: res.fallos ? 'Casi. ' + plural(res.fallos, 'Hay 1 fallo marcado con ✗.', 'Hay # fallos marcados con ✗.') : 'No es correcto.' })]));
            panel.appendChild(el('p', { class: 'explicacion', texto: res.explicacion || p.explicacion }));
            var enlace = enlaceRepaso(p);
            if (enlace) panel.appendChild(enlace);
            var bOtra = el('button', { type: 'button', class: 'boton boton-principal boton-reintentar', html: I.repetir + '<span>Volver a intentarlo</span>' });
            bOtra.addEventListener('click', function () {
              tarjeta.classList.remove('en-revision');
              panel.hidden = true; acciones.hidden = false;
              tipoActual.reintentar();
              bComprobar.focus({ preventScroll: true });
            });
            panel.appendChild(el('div', { class: 'acciones' }, bOtra));
            panel.hidden = false;
            desplazarA(panel);
            return;
          }
          // acierto
          r.superada = true;
          if (guardar) progreso.marcarSuperada(n, p.id);
          tarjeta.classList.add('en-revision');
          acciones.hidden = true;
          panel.className = 'respuesta respuesta-bien';
          panel.innerHTML = '';
          var msg = FELICITACIONES[(i + r.intentos) % FELICITACIONES.length] + (r.aLaPrimera ? ' A la primera.' : '');
          panel.appendChild(el('p', { class: 'respuesta-titulo' }, [iconoRedondo(true), el('span', { texto: msg })]));
          var ultima = i === preguntas.length - 1;
          var bSig = el('button', { type: 'button', class: 'boton boton-ok boton-siguiente', html: '<span>' + (ultima ? 'Ver mi resultado' : 'Siguiente pregunta') + '</span>' + I.flecha });
          bSig.addEventListener('click', function () { if (ultima) final(); else { mostrar(i + 1); desplazarA(motor, true); } });
          panel.appendChild(el('div', { class: 'acciones' }, bSig));
          panel.hidden = false;
          // refrescar puntos de progreso
          var cab = motor.querySelector('.motor-progreso'); if (cab) cab.replaceWith(cabecera());
          desplazarA(panel);
          bSig.focus({ preventScroll: true });
        });
      }

      function final() {
        if (tipoActual && tipoActual.destruir) tipoActual.destruir();
        tipoActual = null;
        var aciertos = estado.res.filter(function (r) { return r.aLaPrimera && r.superada; }).length;
        var total = preguntas.length;
        if (guardar) progreso.guardarResultado(n, aciertos, total);
        var resultado = {
          video: n, aciertosPrimera: aciertos, total: total,
          preguntas: estado.res.map(function (r) { return { id: r.id, tipo: r.tipo, aLaPrimera: r.aLaPrimera && r.superada, intentos: r.intentos }; })
        };
        motor.innerHTML = '';
        var t = el('article', { class: 'pregunta final', 'data-final': '' });
        var estrellas = el('div', { class: 'estrellas', 'aria-hidden': 'true' });
        for (var k = 0; k < total; k++) estrellas.appendChild(el('span', { html: estrellaGrande(k < aciertos) }));
        t.appendChild(estrellas);
        var titulo = aciertos === total ? 'Todas a la primera' : aciertos >= total - 2 ? 'Todas superadas' : 'Hasta el final';
        t.appendChild(el('h2', { texto: titulo }));
        t.appendChild(el('p', { class: 'nota' }, [aciertos + ' de ' + total, el('small', { texto: 'a la primera' })]));
        var mensaje = aciertos === total ? 'Has acertado todas las preguntas a la primera. Lo has pillado.'
          : aciertos >= total - 2 ? 'Has superado todas las preguntas. Las que fallaste al principio, repásalas en el vídeo.'
            : 'Has llegado al final, y eso cuenta. Vuelve a ver el vídeo y repite: seguro que mejoras.';
        t.appendChild(el('p', { class: 'mensaje', texto: mensaje }));
        var resumen = el('ul', { class: 'resumen-preguntas' });
        preguntas.forEach(function (p, k) {
          var r = estado.res[k];
          resumen.appendChild(el('li', {}, [
            el('span', { class: 'icono-redondo ' + (r.aLaPrimera ? 'ok' : 'tarde'), html: r.aLaPrimera ? I.ok : I.repetir }),
            el('span', { texto: (k + 1) + '. ' + p.enunciado + (r.aLaPrimera ? '' : ' (en ' + r.intentos + ' intentos)') })
          ]));
        });
        t.appendChild(resumen);
        var bRep = el('button', { type: 'button', class: 'boton boton-secundario boton-repetir', html: I.repetir + '<span>Repetir</span>' });
        bRep.addEventListener('click', function () { reiniciarEstado(); mostrar(0); desplazarA(motor, true); });
        var ultimoVideo = n >= totalVideos;
        var bSig = el('button', { type: 'button', class: 'boton boton-principal boton-siguiente-video', html: '<span>' + (ultimoVideo ? 'Volver al inicio' : (opciones.textoSiguiente || 'Siguiente vídeo')) + '</span>' + I.flecha });
        bSig.addEventListener('click', function () {
          if (ultimoVideo) { if (opciones.alInicio) opciones.alInicio(); else location.href = raiz + 'index.html'; }
          else if (opciones.alSiguienteVideo) opciones.alSiguienteVideo(n + 1);
          else location.href = raiz + 'leccion.html?v=' + (n + 1);
        });
        t.appendChild(el('div', { class: 'acciones' }, [bRep, bSig]));
        motor.appendChild(t);
        desplazarA(motor, true);
        emitir(contenedor, 'motor:terminado', resultado);
        if (opciones.alTerminar) { try { opciones.alTerminar(resultado); } catch (e) { console.error(e); } }
      }

      if (destruido) return null; // se volvió a montar mientras cargaba
      mostrar(0);
      var controlador = {
        reiniciar: function () { reiniciarEstado(); mostrar(0); },
        irA: function (i) { mostrar(Math.max(0, Math.min(preguntas.length - 1, i))); },
        destruir: function () {
          if (destruido) return; destruido = true;
          if (tipoActual && tipoActual.destruir) tipoActual.destruir();
          tipoActual = null;
          if (contenedor.__motor === controlador) contenedor.__motor = null;
          contenedor.innerHTML = '';
        }
      };
      contenedor.__motor = controlador;
      return controlador;
    }
  }

  function desplazarA(nodo, arriba) {
    try {
      var r = nodo.getBoundingClientRect();
      if (arriba) { if (r.top < 0) nodo.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
      if (r.bottom > window.innerHeight || r.top < 0) nodo.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (e) { /* nada */ }
  }

  window.Motor = {
    montar: montar,
    cargarDatos: cargarDatos,
    segundosEscena: function (video, escena) { return cargarDatos().then(function (d) { return segundosDe(d.tiempos, video, escena); }); },
    formatoMinuto: formatoMinuto,
    progreso: { leer: progreso.leer, estado: progreso.estado, marcarVisto: progreso.marcarVisto, borrar: progreso.borrar },
    iconos: I,
    raiz: RAIZ,
    _interno: { leerNumero: leerNumero, normalizar: normalizar }
  };
})();
