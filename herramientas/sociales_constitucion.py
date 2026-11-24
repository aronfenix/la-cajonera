# Genera «La Constitución del cajón» (Sociales, tema 2, «El cajón vota») con el motor «constitucion», y su ficha del catálogo.
# Uso: python3 sociales_constitucion.py
import json, os
BASE = '/home/claude/cajon/public/juegos'
FICHAS = '/home/claude/cajon/src/content/materiales'
PORTADAS = '/home/claude/cajon/src/media/portadas'
VOLVER = '../el-cajon-vota/'
FECHA = '2026-11-20'
SLUG = 'la-constitucion-del-cajon'
PLANTILLA = open(__file__.replace('sociales_constitucion.py', 'juegos.py')).read().split("PLANTILLA = '''")[1].split("'''")[0]
H = lambda quien, pose, texto: {'quien': quien, 'pose': pose, 'texto': texto}

cfg = {
  'motor': 'constitucion', 'area': 'sociales', 'escena': 'cajon', 'volver': VOLVER, 'personaje': 'goma',
  'titulo': 'La Constitución del cajón',
  'subtitulo': 'En el cajón viven quince objetos. Votan sus normas en asamblea, pero hay una regla por encima de todas.',
  'portada': {'objetivo': 'Haz de Tribunal: decide qué normas aguantan y cuáles chocan con la Constitución, aunque las vote la mayoría.', 'frase': 'Votar no lo arregla todo.', 'rotulo': 'CONSTITUCIÓN'},
  'historia': [
    {'nota': 'A PARTIR DE HOY, EL CAJÓN SE ORGANIZA SOLO. YO NO PIENSO PONER ORDEN.', 'firma': 'El profe'},
    H('boli', 'seguro', 'Perfecto. Mando yo. Primera norma: el que manda no recoge.'),
    H('fosforito', 'asombro', '¡Eso no! ¡Lo votamos! Lo que diga la mayoría, va a misa.'),
    H('goma', 'pista', 'Antes de votar nada, unas reglas que valgan para todos. Hasta para el que mande. Y que no se puedan borrar a la ligera.'),
  ],
  'saludo': 'La mayoría decide muchas cosas. **Quitar derechos, no.**',
  'observa': 'Si la mayoría de la clase votara que los de la última fila no pueden hablar, ¿valdría? ¿Por qué la Constitución es más difícil de cambiar que una norma de clase?',
  'niveles': [
    {'modo': 'tribunal', 'generar': {'f': 1}},
    {'modo': 'queja', 'generar': {'f': 1}},
    {'modo': 'tribunal', 'generar': {'f': 2}},
    {'modo': 'construye', 'generar': True},
    {'modo': 'reforma', 'generar': {'f': 1}},
    {'modo': 'queja', 'generar': {'f': 3, 'min': 2}},
    {'modo': 'tribunal', 'generar': {'f': 3, 'min': 2}},
    {'modo': 'reforma', 'generar': {'f': 2, 'trampa': True}},
  ],
}
desc = 'Haz de Tribunal del cajón: decide qué normas votadas por la mayoría chocan con la Constitución, resuelve quejas y monta normas que aguanten.'
os.makedirs(f'{BASE}/{SLUG}', exist_ok=True)
with open(f'{BASE}/{SLUG}/index.html', 'w') as f:
    f.write(PLANTILLA.format(titulo=cfg['titulo'], desc=desc, config=json.dumps(cfg, ensure_ascii=False, indent=2)))

q = lambda t: json.dumps(t, ensure_ascii=False)
portada = f'portada: /src/media/portadas/{SLUG}.jpg\n' if os.path.exists(f'{PORTADAS}/{SLUG}.jpg') else ''
resumen = 'El cajón tiene una Constitución de cinco artículos y una asamblea que vota normas. El alumno hace de Tribunal: tumba las que quitan derechos aunque las vote la mayoría, resuelve quejas y monta normas que arreglen problemas sin chocar con nada.'
cuerpo = ('Cuatro mecánicas. En la principal, la asamblea de quince objetos aprueba una norma por mayoría y el alumno decide si aguanta o choca con la Constitución '
  '(igualdad, libertad de expresión, educación, voto y «las normas son para todos, también para el que manda»). En las quejas hay que separar lo que no gusta de lo que no está permitido: '
  'criticar una norma o no votar se puede; mandar callar o saltarse una norma porque mandas, no. En «monta una norma» se arregla un problema del cajón con piezas y la norma se prueba: '
  '¿lo arregla? ¿aguanta en el Tribunal? Y en la asamblea del jueves se ve que cambiar la Constitución pide más votos que una norma normal (3 de cada 5, como en las Cortes).')
with open(f'{FICHAS}/{SLUG}.md', 'w') as f:
    f.write(f'---\ntitulo: {q(cfg["titulo"])}\ntema: sociales-tema-2\ntipo: juego\nresumen: {q(resumen)}\nfecha: {FECHA}\n{portada}enlace: /juegos/{SLUG}/\norden: 1\n---\n\n{cuerpo}\n')
print('ok', SLUG)
