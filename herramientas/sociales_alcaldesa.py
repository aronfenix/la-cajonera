# Genera «Alcaldesa por un día» (Sociales, tema 2, «El cajón vota») con el motor «alcaldia» y su ficha del catálogo.
# Uso: python3 sociales_alcaldesa.py
import json, os
BASE = '/home/claude/cajon/public/juegos'
FICHAS = '/home/claude/cajon/src/content/materiales'
PORTADAS = '/home/claude/cajon/src/media/portadas'
SLUG = 'alcaldesa-por-un-dia'
FECHA = '2026-11-20'
PLANTILLA = open(__file__.replace('sociales_alcaldesa.py', 'juegos.py')).read().split("PLANTILLA = '''")[1].split("'''")[0]
H = lambda quien, pose, texto: {'quien': quien, 'pose': pose, 'texto': texto}
A, C, E, U = 'ayto', 'comunidad', 'estado', 'ue'

cfg = {
  'motor': 'alcaldia', 'area': 'sociales', 'escena': 'corcho', 'personaje': 'boli', 'volver': '../el-cajon-vota/',
  'titulo': 'Alcaldesa por un día',
  'subtitulo': 'Hoy gobiernas Villacajón, un pueblo de Madrid. Los vecinos piden de todo, pero no todo lo paga el ayuntamiento.',
  'portada': {'arte': 'propia', 'objetivo': 'Atiende a los vecinos: paga lo que es del ayuntamiento y manda por carta lo demás a quien le toca.', 'frase': 'Con la caja del pueblo, lo del pueblo.'},
  'historia': [
    {'nota': 'HOY CADA UNO GOBIERNA UN PUEBLO DE CARTULINA. CUIDADO CON LA CAJA.', 'firma': 'El profe'},
    H('fosforito', 'celebra', '¡Te han hecho alcaldesa! ¿Una farola? ¿Un hospital? ¿Un pasaporte? ¡Todo lo arreglas tú!'),
    H('boli', 'seguro', 'Frena. Soy el interventor del ayuntamiento: miro cada euro que sale de la caja. Si pagas algo que no es tuyo, lo paro.'),
    H('goma', 'pista', 'Lo que no es del ayuntamiento no se tira: se manda por carta a quien le toca. Si te equivocas de buzón, la carta vuelve.'),
  ],
  'saludo': 'Con la caja del pueblo, **solo lo del pueblo**. Lo demás, por carta.',
  'observa': 'Mirad el mapa del final: todo está en el mismo pueblo, pero hay banderitas de cuatro colores. ¿Por qué no lo lleva todo el ayuntamiento? ¿Y por qué el cole lo cuidan dos gobiernos?',
  'niveles': [
    {'modo': 'dia', 'generar': {'destinos': [A, C], 'n': 3, 'f': 1}},
    {'modo': 'dia', 'generar': {'destinos': [A, C, E], 'n': 4, 'f': 1}},
    {'modo': 'cole', 'generar': {'n': 4, 'f': 2}},
    {'modo': 'dia', 'generar': {'destinos': [A, C, E, U], 'n': 5, 'f': 2, 'min': 2}},
    {'modo': 'fondo', 'generar': {'destinos': [A, C, E, U], 'n': 4, 'f': 2}},
    {'modo': 'dia', 'generar': {'destinos': [A, C, E, U], 'n': 5, 'f': 3, 'min': 3, 'trampa': True}},
  ],
}
DESC = 'Gobiernas un pueblo de Madrid: pagas lo que es del ayuntamiento y mandas por carta lo demás a la Comunidad, al Estado o a la Unión Europea.'
RESUMEN = 'Un día en el ayuntamiento de un pueblo de Madrid: cada petición de los vecinos se paga con la caja del pueblo o se manda por carta a la Comunidad, al Estado o a la Unión Europea.'
CUERPO = ('Cada petición (una farola, una pediatra, un pasaporte, el cargador del móvil…) hay que pagarla con la caja del ayuntamiento o mandarla por carta a quien le toca. '
  'Si la carta va al buzón equivocado, vuelve, la cola crece y los vecinos se enfadan; si se paga algo que no es del ayuntamiento, el interventor lo para y explica por qué. '
  'Hay un nivel solo del colegio (el edificio lo cuida el ayuntamiento y los profes los pone la Comunidad), otro con una obra grande que solo sale adelante pidiendo un fondo europeo, '
  'y el último trae un buzón de una diputación que en Madrid no existe. Al final del día, el mapa del pueblo queda lleno de banderitas de cuatro colores.')

os.makedirs(f'{BASE}/{SLUG}', exist_ok=True)
with open(f'{BASE}/{SLUG}/index.html', 'w') as f:
    f.write(PLANTILLA.format(titulo=cfg['titulo'], desc=DESC, config=json.dumps(cfg, ensure_ascii=False, indent=2)))
q = lambda t: json.dumps(t, ensure_ascii=False)
portada = f'portada: /src/media/portadas/{SLUG}.jpg\n' if os.path.exists(f'{PORTADAS}/{SLUG}.jpg') else ''
with open(f'{FICHAS}/{SLUG}.md', 'w') as f:
    f.write(f'---\ntitulo: {q(cfg["titulo"])}\ntema: sociales-tema-2\ntipo: juego\nresumen: {q(RESUMEN)}\nfecha: {FECHA}\nborrador: true\n{portada}enlace: /juegos/{SLUG}/\norden: 2\n---\n\n{CUERPO}\n')
print('escrito', SLUG)
