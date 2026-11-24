# Genera «La máquina de repartir» (Sociales, tema 2, «El cajón vota») con el motor «repartir», y su ficha del catálogo.
# Uso: python3 sociales_repartir.py
# La portada del catálogo (/src/media/portadas/la-maquina-de-repartir.jpg) se añade a la ficha solo si existe la imagen.
import json, os
BASE = '/home/claude/cajon/public/juegos'
FICHAS = '/home/claude/cajon/src/content/materiales'
PORTADAS = '/home/claude/cajon/src/media/portadas'
SLUG = 'la-maquina-de-repartir'
FECHA = '2026-11-20'
PLANTILLA = open(__file__.replace('sociales_repartir.py', 'juegos.py')).read().split("PLANTILLA = '''")[1].split("'''")[0]
H = lambda quien, pose, texto: {'quien': quien, 'pose': pose, 'texto': texto}

cfg = {
  'motor': 'repartir', 'area': 'sociales', 'escena': 'almacen', 'personaje': 'goma',
  'volver': '../el-cajon-vota/',
  'titulo': 'La máquina de repartir',
  'subtitulo': 'Los votos ya están contados. Ahora hay que convertirlos en escaños, y eso depende de las reglas.',
  'portada': {'objetivo': 'Predice cuántos escaños saca cada partido, tira de la palanca y descubre qué cambia si cambias las reglas sin tocar un solo voto.', 'frase': 'Mismos votos. Otras reglas. Otro Congreso.'},
  'historia': [
    {'nota': 'LOS VOTOS SE CUENTAN EN LA MESA. LOS ESCAÑOS SE REPARTEN CON UNA REGLA.', 'firma': 'El profe'},
    H('fosforito', 'celebra', '¡He encontrado una máquina en el almacén! Le echas votos y salen escaños.'),
    H('goma', 'piensa', 'Tiene tres palancas: cuántos escaños, cómo se reparten y si hay un mínimo para entrar.'),
    H('boli', 'seguro', 'No toquéis los votos. Solo las palancas. Y luego me explicáis lo que ha pasado.'),
  ],
  'saludo': 'Un escaño **no se puede partir**. Por eso hace falta una regla.',
  'observa': 'Con los mismos votos, ¿qué regla os parece más justa? ¿Y por qué Soria tiene 2 escaños si en Madrid un escaño «cuesta» muchos más votos?',
  'niveles': [
    {'modo': 'predice', 'generar': {'metodos': ['exacto', 'exacto', 'ganador'], 'redondos': True, 'escanos': [10]}},
    {'modo': 'cocientes', 'generar': {'escanos': [3, 4], 'huecos': 0}},
    {'modo': 'predice', 'generar': {'metodos': ['dhondt'], 'escanos': [3, 4], 'noche': True}},
    {'modo': 'cocientes', 'generar': {'escanos': [4, 5], 'huecos': 3}},
    {'modo': 'consigue', 'generar': {'objetivos': ['entra']}},
    {'modo': 'cuesta', 'generar': {'pares': [['soria', 'madrid'], ['soria', 'madrid'], ['soria', 'barcelona']]}},
    {'modo': 'consigue', 'generar': {'objetivos': ['umbral', 'mayoria']}},
    {'modo': 'pais', 'generar': True},
  ],
}
DESC = 'Convierte votos en escaños: proporcional exacto, D’Hondt o «el que gana se lo lleva todo», el umbral del 3 % y por qué un escaño de Soria cuesta menos votos que uno de Madrid.'
RESUMEN = 'Una máquina con tres palancas (escaños, método y umbral del 3 %) convierte los votos de una provincia en escaños. Se predice, se tira de la palanca y se ve por qué el reparto no es exactamente proporcional.'
CUERPO = ('Los votos no se tocan; solo las reglas. Primero se predice cuántos escaños saca cada partido con un reparto exacto o con «el que gana se lo lleva todo». Luego llega D’Hondt: la tabla de dividir entre 1, 2, 3… y elegir los números más grandes. '
  'En los niveles altos hay que conseguir que entre un partido pequeño sin cambiar un voto (más escaños, quitar el umbral), comparar cuántos votos cuesta un escaño en Soria y en Madrid, y repartir una noche electoral entera de 350 escaños para ver si alguien llega a 176. '
  'Si antes se ha jugado La noche del escrutinio en la misma tablet, usa los votos de la provincia que se contó allí.')

os.makedirs(f'{BASE}/{SLUG}', exist_ok=True)
with open(f'{BASE}/{SLUG}/index.html', 'w') as f:
    f.write(PLANTILLA.format(titulo=cfg['titulo'], desc=DESC, config=json.dumps(cfg, ensure_ascii=False, indent=2)))
q = lambda t: json.dumps(t, ensure_ascii=False)
portada = f'portada: /src/media/portadas/{SLUG}.jpg\n' if os.path.exists(f'{PORTADAS}/{SLUG}.jpg') else ''
with open(f'{FICHAS}/{SLUG}.md', 'w') as f:
    f.write(f'---\ntitulo: {q(cfg["titulo"])}\ntema: sociales-tema-2\ntipo: juego\nresumen: {q(RESUMEN)}\nfecha: {FECHA}\n{portada}enlace: /juegos/{SLUG}/\norden: 4\n---\n\n{CUERPO}\n')
print('escrito', SLUG)
