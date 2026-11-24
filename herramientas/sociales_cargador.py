# Genera «La ley del cargador» (Sociales, tema 2, «El cajón vota») con el motor «cargador», y su ficha del catálogo.
# Uso: python3 sociales_cargador.py
# El mapa de Europa (motores/mapa-europa.js) sale de: node mapa_europa.mjs /home/claude/_deps/node_modules
import json, os
BASE = '/home/claude/cajon/public/juegos'
FICHAS = '/home/claude/cajon/src/content/materiales'
PORTADAS = '/home/claude/cajon/src/media/portadas'
VOLVER = '../el-cajon-vota/'
FECHA = '2026-11-23'
SLUG = 'la-ley-del-cargador'
PLANTILLA = open(__file__.replace('sociales_cargador.py', 'juegos.py')).read().split("PLANTILLA = '''")[1].split("'''")[0]
H = lambda quien, pose, texto: {'quien': quien, 'pose': pose, 'texto': texto}

cfg = {
  'motor': 'cargador', 'area': 'sociales', 'escena': 'corcho', 'volver': VOLVER, 'personaje': 'fosforito',
  'titulo': 'La ley del cargador',
  'subtitulo': 'Una ley europea de verdad: el mismo cargador para todos los móviles. Llévala por las instituciones hasta las tiendas.',
  'portada': {'arte': 'cajon', 'objetivo': 'Lleva la ley del cargador común por la Comisión, el Parlamento Europeo y el Consejo, y averigua en qué países obliga.', 'frase': 'Un cable. Veintisiete países. Cero excusas.', 'rotulo': 'CABLES'},
  'historia': [
    {'nota': 'CAJÓN DE LOS CABLES: 14 CARGADORES. NINGUNO SIRVE PARA LA TABLET.', 'firma': 'El profe'},
    H('fosforito', 'asombro', '¡Cada aparato con su cargador! ¡Hace falta una ley! ¡Una ley de España!'),
    H('boli', 'seguro', '¿De España? Los móviles se venden igual en Portugal, en Francia y en Polonia.'),
    H('goma', 'pista', 'Entonces, una ley europea. Existe de verdad. Y para llegar a las tiendas tuvo que hacer un viaje bastante largo.'),
  ],
  'saludo': 'La Comisión **propone**, el Parlamento y el Consejo **votan**, los 27 **aplican**.',
  'observa': '¿Por qué una ley de cargadores tiene más sentido para 27 países a la vez que para uno solo? ¿Qué ley europea te gustaría proponer a ti?',
  'niveles': [
    {'modo': 'ruta', 'generar': {'f': 1, 'pasos': 1}},
    {'modo': 'quien', 'generar': {'f': 2, 'n': 3, 'extra': ['congreso']}},
    {'modo': 'mapa', 'generar': {'f': 1, 'criterios': ['ley']}},
    {'modo': 'ruta', 'generar': {'f': 2, 'desde': ['idea'], 'pasos': 'todo', 'extra': ['gobierno', 'congreso']}},
    {'modo': 'negocia', 'generar': {'f': 1}},
    {'modo': 'tabla', 'generar': {'n': 5}},
    {'modo': 'mapa', 'generar': {'f': 3, 'criterios': ['ley', 'euro', 'trabajo']}},
    {'modo': 'negocia', 'generar': {'f': 2}},
  ],
}
desc = 'Lleva la ley europea del cargador común (USB-C) por la Comisión, el Parlamento Europeo y el Consejo, negocia sus cambios y descubre en qué países obliga.'
os.makedirs(f'{BASE}/{SLUG}', exist_ok=True)
with open(f'{BASE}/{SLUG}/index.html', 'w') as f:
    f.write(PLANTILLA.format(titulo=cfg['titulo'], desc=desc, config=json.dumps(cfg, ensure_ascii=False, indent=2)))

q = lambda t: json.dumps(t, ensure_ascii=False)
portada = f'portada: /src/media/portadas/{SLUG}.jpg\n' if os.path.exists(f'{PORTADAS}/{SLUG}.jpg') else ''
resumen = 'La ley europea del cargador común (USB-C) hace su viaje: la Comisión la propone, el Parlamento Europeo y el Consejo la negocian y la votan, y los 27 países la aplican. Luego, en el mapa: ¿obliga en Suiza? ¿Y en Andorra? ¿Y en Dinamarca?'
cuerpo = ('Cinco mecánicas con una ley real, aprobada en 2022: llevar el expediente de institución en institución (si lo mandas al Congreso o al Gobierno de España, te lo devuelven y explican por qué), '
  'reconocer quién se sienta en cada sitio, negociar el texto para que voten que sí el Parlamento y el Consejo a la vez, marcar en un mapa de Europa dónde obliga la ley, dónde se paga en euros o adónde se puede ir a trabajar sin permiso, '
  'y colocar países en una tabla de UE sí/no y euro sí/no. Los errores que ataca: «la UE es un país», «Europa y la UE son lo mismo», «el euro y la UE son lo mismo» y «al Parlamento Europeo lo nombra el Gobierno».')
with open(f'{FICHAS}/{SLUG}.md', 'w') as f:
    f.write(f'---\ntitulo: {q(cfg["titulo"])}\ntema: sociales-tema-2\ntipo: juego\nresumen: {q(resumen)}\nfecha: {FECHA}\n{portada}enlace: /juegos/{SLUG}/\norden: 7\nborrador: true\n---\n\n{cuerpo}\n')
print('ok', SLUG)
