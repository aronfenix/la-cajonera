# Genera «La isla del recreo» (Sociales, tema 2, «El cajón vota») con el motor «llaves» y su ficha del catálogo.
# Uso: python3 sociales_isla.py
import json, os
BASE = '/home/claude/cajon/public/juegos'
FICHAS = '/home/claude/cajon/src/content/materiales'
PORTADAS = '/home/claude/cajon/src/media/portadas'
SLUG = 'la-isla-del-recreo'
FECHA = '2026-11-23'
PLANTILLA = open(__file__.replace('sociales_isla.py', 'juegos.py')).read().split("PLANTILLA = '''")[1].split("'''")[0]
H = lambda quien, pose, texto: {'quien': quien, 'pose': pose, 'texto': texto}

cfg = {
  'motor': 'llaves', 'area': 'sociales', 'escena': 'patio', 'personaje': 'goma', 'volver': '../el-cajon-vota/',
  'titulo': 'La isla del recreo',
  'subtitulo': 'En el recreo, el patio es una isla con tres llaves: la de hacer las normas, la de hacerlas cumplir y la de juzgar.',
  'portada': {'arte': 'propia', 'objetivo': 'Reparte las tres llaves de la isla y mira qué pasa en una semana de recreos. Al final, lo mismo con España.', 'frase': 'Tres llaves, tres bolsillos.'},
  'historia': [
    {'nota': 'ESTA SEMANA OS ORGANIZÁIS VOSOTROS EL RECREO. YO NO ME METO.', 'firma': 'El profe'},
    H('fosforito', 'asombro', '¡Sacapuntas se ha quedado las tres llaves! Pone las normas, las hace cumplir y, si te quejas, juzga él.'),
    H('boli', 'seguro', 'Ya ha puesto una norma: «El balón es de Sacapuntas». Y ha juzgado que es justísima.'),
    H('goma', 'pista', 'Tres llaves en un solo bolsillo nunca salen bien. Repártelas y mira qué pasa en una semana.'),
  ],
  'saludo': 'Cada llave, **en una mano distinta**. Y que ninguna se quede sin dueño.',
  'observa': '¿Por qué no puede ser la misma persona la que pone las normas y la que juzga si se han cumplido? Si el Rey no tiene ninguna llave, ¿para qué sirve?',
  'niveles': [
    {'modo': 'reparto', 'generar': {'n': 3}},
    {'modo': 'arregla', 'generar': {'n': 3}},
    {'modo': 'reparto', 'generar': {'rasgos': True, 'requisitos': True, 'n': 4}},
    {'modo': 'reparto', 'generar': {'rasgos': True, 'n': 5}},
    {'modo': 'espana', 'generar': True},
    {'modo': 'vigila', 'generar': {'n': 3}},
  ],
}
DESC = 'Reparte las tres llaves (hacer normas, hacerlas cumplir, juzgar) y mira una semana de recreos. Después, Cortes, Gobierno, jueces, el Rey y el Tribunal Constitucional.'
RESUMEN = 'La separación de poderes como tres llaves de un patio-isla: si alguien junta dos, abusa; si una no tiene dueño, nadie hace ese trabajo. Termina con las instituciones de España.'
CUERPO = ('El alumno reparte las llaves de hacer normas, hacerlas cumplir y juzgar entre los habitantes de la isla, y una semana de recreos (una norma que hace falta, alguien que se la salta, dos que discuten, un castigo exagerado) '
  'enseña qué pasa con ese reparto en tres marcadores: orden, justicia y quejas. Nada depende de la suerte: el mismo reparto da la misma semana. '
  'Luego los personajes tienen rasgos (a quién eligió todo el patio, quién juega en un equipo, quién es amigo de quién), y al final las llaves se reparten entre las Cortes, el Gobierno, los jueces, el Rey (que firma y no tiene llave) '
  'y el Tribunal Constitucional, que en el último nivel anula las leyes que chocan con la Constitución aunque las haya votado la mayoría.')

os.makedirs(f'{BASE}/{SLUG}', exist_ok=True)
with open(f'{BASE}/{SLUG}/index.html', 'w') as f:
    f.write(PLANTILLA.format(titulo=cfg['titulo'], desc=DESC, config=json.dumps(cfg, ensure_ascii=False, indent=2)))
q = lambda t: json.dumps(t, ensure_ascii=False)
portada = f'portada: /src/media/portadas/{SLUG}.jpg\n' if os.path.exists(f'{PORTADAS}/{SLUG}.jpg') else ''
with open(f'{FICHAS}/{SLUG}.md', 'w') as f:
    f.write(f'---\ntitulo: {q(cfg["titulo"])}\ntema: sociales-tema-2\ntipo: juego\nresumen: {q(RESUMEN)}\nfecha: {FECHA}\n{portada}enlace: /juegos/{SLUG}/\norden: 6\n---\n\n{CUERPO}\n')
print('escrito', SLUG)
