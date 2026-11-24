# Genera «176» (Sociales, tema 2 «El cajón vota»: la investidura) con el motor «investidura», y su ficha del catálogo.
# Uso: python3 sociales_los-176.py
import json, os
BASE = '/home/claude/cajon/public/juegos'
FICHAS = '/home/claude/cajon/src/content/materiales'
PORTADAS = '/home/claude/cajon/src/media/portadas'
SLUG = 'los-176'
FECHA = '2026-11-20'
PLANTILLA = open(__file__.replace('sociales_los-176.py', 'juegos.py')).read().split("PLANTILLA = '''")[1].split("'''")[0]
H = lambda quien, pose, texto: {'quien': quien, 'pose': pose, 'texto': texto}

cfg = {
  'motor': 'investidura', 'area': 'sociales', 'escena': 'corcho', 'personaje': 'boli',
  'volver': '../el-cajon-vota/',
  'titulo': '176',
  'subtitulo': 'Nadie ha sacado mayoría absoluta. Para gobernar hay que sumar votos en el Congreso.',
  'portada': {'arte': 'cajon', 'objetivo': 'Negocia una investidura: cada partido pide cosas para el solar del barrio y tiene una línea roja.', 'frase': 'Ganar no es gobernar.', 'rotulo': 'CONGRESO'},
  'historia': [
    {'nota': 'NADIE HA LLEGADO A 176. EL SOLAR DEL BARRIO SE QUEDA VALLADO HASTA QUE HAYA GOBIERNO.', 'firma': 'El profe'},
    H('fosforito', 'celebra', '¡Fácil! Que gobiernen los que más votos han sacado, y a hacer el parque.'),
    H('boli', 'seguro', 'No. Gobierna quien consigue los votos del Congreso: 176 a la primera, o más síes que noes a la segunda.'),
    H('boli', 'piensa', 'Cada partido pide cosas para el solar y tiene una línea roja. Yo cuento los votos. Tú negocias.'),
  ],
  'saludo': 'Para gobernar no basta con ganar: hay que **sumar**.',
  'observa': '¿Es justo que gobierne un partido que no ha sido el más votado? ¿Y que una abstención ayude a quien no te gusta del todo?',
  'nivelObjetivo': 4,
  'niveles': [
    {'modo': 'votacion', 'generar': {'abst': False}},
    {'modo': 'votacion', 'generar': {'abst': True, 'noMayor': True}},
    {'modo': 'apoyos', 'generar': {'presupuesto': 2, 'bloqueos': 0.25}},
    {'modo': 'apoyos', 'generar': {'presupuesto': [1, 2], 'noMayor': True, 'bloqueos': 0.5, 'trampa': True}},
    {'modo': 'negocia', 'generar': {'tipo': 'facil', 'minimo': [5, 6]}},
    {'modo': 'negocia', 'generar': {'tipo': 'lineas', 'minimo': [5, 7]}},
    {'modo': 'negocia', 'generar': {'tipo': 'elige', 'minimo': [5, 7]}},
    {'modo': 'negocia', 'generar': {'tipo': 'segunda', 'minimo': [6, 7], 'ajustado': True}},
  ],
}
desc = 'Negocia una investidura en un Congreso sin mayoría absoluta: peticiones para el solar del barrio, líneas rojas, 176 síes o más síes que noes.'
os.makedirs(f'{BASE}/{SLUG}', exist_ok=True)
with open(f'{BASE}/{SLUG}/index.html', 'w') as f:
    f.write(PLANTILLA.format(titulo=cfg['titulo'], desc=desc, config=json.dumps(cfg, ensure_ascii=False, indent=2)))

q = lambda t: json.dumps(t, ensure_ascii=False)
resumen = 'Nadie tiene 176 escaños. Predices votaciones, pides síes y abstenciones y negocias peticiones para el solar del barrio hasta que salga una investidura, o se repiten las elecciones.'
cuerpo = ('Primero se predice qué pasa en una votación de investidura (176 síes en la primera; más síes que noes en la segunda, con las abstenciones fuera). '
          'Luego se negocia: cada partido pide cosas para el solar del barrio y tiene una línea roja; el solar y los votos cambian con cada pacto. '
          'En los niveles altos el más votado no puede gobernar, o solo se sale en la segunda votación. '
          'Si en esta tablet se ha jugado La máquina de repartir, usa ese Congreso.')
portada = f'portada: /src/media/portadas/{SLUG}.jpg\n' if os.path.exists(f'{PORTADAS}/{SLUG}.jpg') else ''
with open(f'{FICHAS}/{SLUG}.md', 'w') as f:
    f.write(f'---\ntitulo: {q(cfg["titulo"])}\ntema: sociales-tema-2\ntipo: juego\nresumen: {q(resumen)}\nfecha: {FECHA}\n{portada}enlace: /juegos/{SLUG}/\norden: 5\n---\n\n{cuerpo}\n')
print('escrito', SLUG)
