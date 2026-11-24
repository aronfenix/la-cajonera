/*
 * Vídeos de Sociales · página de cada vídeo.
 * - Las partes del vídeo saltan al minuto (botones .capitulo con data-t en segundos).
 * - Al terminar el vídeo (o con «Ir a las preguntas») se montan las preguntas (comun/motor.js).
 * - «Vuelve a ver el vídeo en el minuto m:ss» salta el vídeo aquí mismo y deja un botón para volver a la pregunta.
 * - «Sigue con…» solo aparece si el juego del bloque ya está publicado.
 * Configuración en <script type="application/json" id="datos-video">.
 * Nada sale de la tablet: el progreso lo guarda el motor en localStorage (clave cajon-sociales-tema2-videos).
 */
(function () {
  'use strict';
  var cfg = JSON.parse(document.getElementById('datos-video').textContent);
  var M = window.Motor;
  var $ = function (id) { return document.getElementById(id); };
  var video = $('video'), marco = $('marco-video'), zona = $('zona-preguntas'), cont = $('preguntas');
  var despues = $('despues'), vuelta = $('volver-pregunta');
  var botones = Array.prototype.slice.call(document.querySelectorAll('.capitulo'));
  var inicios = botones.map(function (b) { return +b.getAttribute('data-t'); });
  var reducido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var montado = false, actual = -1;

  function desplazar(nodo) {
    try { nodo.scrollIntoView({ block: 'start', behavior: reducido ? 'auto' : 'smooth' }); } catch (e) { nodo.scrollIntoView(); }
  }

  // ---------- vídeo ----------
  function conMetadatos(fn) {
    if (video.readyState >= 1) { fn(); return; }
    video.addEventListener('loadedmetadata', fn, { once: true });
    if (video.networkState === 0 || video.preload === 'none') { try { video.load(); } catch (e) { /* nada */ } }
  }
  function saltar(seg, opciones) {
    opciones = opciones || {};
    marcarParte(seg);
    conMetadatos(function () {
      try { video.currentTime = seg; } catch (e) { /* nada */ }
      if (opciones.reproducir !== false) {
        var p = video.play();
        if (p && p.catch) p.catch(function () { /* sin permiso para reproducir solo: se queda en pausa en ese punto */ });
      }
    });
    if (opciones.desplazar) desplazar(marco);
  }
  function marcarParte(t) {
    var i = -1;
    for (var k = 0; k < inicios.length; k++) if (t + 0.25 >= inicios[k]) i = k;
    if (i === actual) return;
    actual = i;
    botones.forEach(function (b, k) {
      if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    // En horizontal la lista tiene su propio scroll: que la parte actual se vea (sin mover la página).
    var b = botones[i], lista = b && b.closest('.lista-capitulos');
    if (lista && lista.scrollHeight > lista.clientHeight + 2) {
      var li = b.parentNode, arriba = li.offsetTop - lista.offsetTop, abajo = arriba + li.offsetHeight;
      if (arriba < lista.scrollTop || abajo > lista.scrollTop + lista.clientHeight) {
        lista.scrollTo({ top: Math.max(0, arriba - lista.clientHeight / 2 + li.offsetHeight / 2), behavior: reducido ? 'auto' : 'smooth' });
      }
    }
  }
  botones.forEach(function (b) {
    b.addEventListener('click', function () { saltar(+b.getAttribute('data-t')); });
  });
  video.addEventListener('timeupdate', function () { marcarParte(video.currentTime); });
  video.addEventListener('ended', function () {
    if (M && M.progreso) M.progreso.marcarVisto(cfg.video);
    ocultarVuelta();
    montarPreguntas(true);
  });

  // ---------- preguntas ----------
  function montarPreguntas(bajar) {
    if (!montado && M && M.montar) {
      montado = true;
      M.montar(cont, cfg.video, {
        alPedirRepaso: function (seg) { saltar(seg, { desplazar: true }); mostrarVuelta(); },
        urlRepaso: function (n, seg) { return '#t=' + Math.floor(seg); },
        alSiguienteVideo: function () { location.href = cfg.siguiente || cfg.volver; },
        alInicio: function () { location.href = cfg.volver; },
        textoSiguiente: 'Siguiente vídeo',
        alTerminar: function () { despues.classList.remove('destacado'); void despues.offsetWidth; despues.classList.add('destacado'); }
      }).catch(function () { montado = false; });
    }
    if (bajar) desplazar(zona);
  }
  $('ir-preguntas').addEventListener('click', function () { montarPreguntas(true); });
  var empezar = $('empezar-preguntas');
  if (empezar) empezar.addEventListener('click', function () { montarPreguntas(false); });

  // Si ya se hicieron en esta tablet, se dice en la espera.
  try {
    var est = M && M.progreso ? M.progreso.estado(cfg.video) : null;
    if (est && est.completado && $('estado-previo')) {
      $('estado-previo').textContent = 'En esta tablet ya se han hecho: ' + est.mejor + ' de ' + est.total + ' a la primera, como mejor resultado.';
      $('estado-previo').hidden = false;
    }
  } catch (e) { /* nada */ }

  // ---------- volver a la pregunta tras un repaso ----------
  function mostrarVuelta() { vuelta.hidden = false; }
  function ocultarVuelta() { vuelta.hidden = true; }
  vuelta.addEventListener('click', function () {
    ocultarVuelta();
    video.pause();
    var p = cont.querySelector('.respuesta:not([hidden])') || cont.querySelector('.pregunta') || zona;
    try { p.scrollIntoView({ block: 'center', behavior: reducido ? 'auto' : 'smooth' }); } catch (e) { desplazar(zona); }
  });
  cont.addEventListener('motor:pregunta', ocultarVuelta);

  // ---------- «Sigue con…»: solo si el juego existe ----------
  var juego = $('sigue-con');
  if (juego && window.fetch) {
    fetch(juego.getAttribute('href'), { method: 'HEAD', cache: 'no-cache' })
      .then(function (r) { if (r.ok) juego.hidden = false; })
      .catch(function () { /* sin conexión o sin juego: se queda oculto */ });
  }

  // ---------- #t=segundos y #preguntas ----------
  function leerAncla() {
    var h = location.hash;
    var m = /^#t=(\d+(?:\.\d+)?)$/.exec(h);
    if (m) saltar(+m[1], { reproducir: false, desplazar: true });
    else if (h === '#preguntas') montarPreguntas(true);
  }
  window.addEventListener('hashchange', leerAncla);
  leerAncla();
})();
