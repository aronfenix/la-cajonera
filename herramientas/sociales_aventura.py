# Genera la aventura de Sociales, tema 2 («El cajón vota»): el mapa con sus compartimentos y el examen final
# («El examen del 29-N», motor «mezcla» con retos de los siete motores del tema), y sus fichas del catálogo.
# Uso: python3 sociales_aventura.py
# Las portadas del catálogo (/src/media/portadas/<slug>.jpg) se añaden a las fichas solo si existe la imagen.
import json, os
BASE = '/home/claude/cajon/public/juegos'
FICHAS = '/home/claude/cajon/src/content/materiales'
PORTADAS = '/home/claude/cajon/src/media/portadas'
MAPA = 'el-cajon-vota'
EXAMEN = 'el-examen-del-29n'
FECHA = '2026-11-24'
T = True
PLANTILLA = open(__file__.replace('sociales_aventura.py', 'juegos.py')).read().split("PLANTILLA = '''")[1].split("'''")[0]
H = lambda quien, pose, texto: {'quien': quien, 'pose': pose, 'texto': texto}


def ficha(slug, titulo, resumen, orden, cuerpo):
    q = lambda t: json.dumps(t, ensure_ascii=False)
    portada = f'portada: /src/media/portadas/{slug}.jpg\n' if os.path.exists(f'{PORTADAS}/{slug}.jpg') else ''
    with open(f'{FICHAS}/{slug}.md', 'w') as f:
        f.write(f'---\ntitulo: {q(titulo)}\ntema: sociales-tema-2\ntipo: juego\nresumen: {q(resumen)}\nfecha: {FECHA}\n{portada}enlace: /juegos/{slug}/\norden: {orden}\n---\n\n{cuerpo}\n')


# ------------------------------------------------------------------ el examen
examen = {
  'motor': 'mezcla', 'area': 'sociales', 'escena': 'colegio-electoral', 'personaje': 'boli',
  'volver': f'../{MAPA}/',
  'titulo': 'El examen del 29-N',
  'subtitulo': 'Lunes 30 de noviembre. Las urnas ya están guardadas. Ahora el profe pregunta un poco de cada compartimento.',
  'portada': {'objetivo': 'Diez retos, dos de cada compartimento: las reglas de todos, quién se encarga, las tres llaves, la noche electoral y la Unión Europea.',
              'frase': 'Diez retos. Ni uno en blanco.', 'rotulo': '29-N'},
  'historia': [
    {'nota': 'HOY ES LUNES. YA HA VOTADO TODO EL MUNDO. AHORA PREGUNTO YO.', 'firma': 'El profe'},
    H('boli', 'seguro', 'Examen. Dos retos de cada compartimento, y yo con la tinta roja.'),
    H('fosforito', 'asombro', '¿Y si me sale lo de D\'Hondt? ¡Lo tengo subrayado, pero entero!'),
    H('goma', 'animo', 'Te sale. Lo repartiste tú con la palanca.'),
  ],
  'saludo': 'De todo un poco. **Lee el reto entero** antes de tocar.',
  'observa': 'Si una misma persona hiciera las normas, las hiciera cumplir y además contara los votos, ¿qué podría salir mal? ¿Qué parte del tema te ha costado más?',
  'textoFinal': 'Examen entregado',
  'rondas': [
    {'motor': 'constitucion', 'modo': 'tribunal', 'generar': {'f': 2}},
    {'motor': 'alcaldia', 'modo': 'dia', 'generar': {'destinos': ['ayto', 'comunidad', 'estado', 'ue'], 'n': 4, 'f': 2, 'min': 2}},
    {'motor': 'alcaldia', 'modo': 'cole', 'generar': {'n': 4, 'f': 2}},
    {'motor': 'llaves', 'modo': 'espana', 'generar': T},
    {'motor': 'escrutinio', 'modo': 'cola', 'generar': {'f': 2, 'n': 3}},
    {'motor': 'escrutinio', 'modo': 'sobres', 'generar': {'f': 2, 'n': 5}},
    {'motor': 'repartir', 'modo': 'predice', 'generar': {'metodos': ['dhondt'], 'escanos': [3, 4], 'noche': T}},
    {'motor': 'investidura', 'modo': 'votacion', 'generar': {'abst': T, 'noMayor': T}},
    {'motor': 'cargador', 'modo': 'ruta', 'generar': {'f': 2, 'desde': ['idea'], 'pasos': 'todo', 'extra': ['gobierno', 'congreso']}},
    {'motor': 'cargador', 'modo': 'mapa', 'generar': {'f': 2, 'criterios': ['ley', 'euro']}},
  ],
}
os.makedirs(f'{BASE}/{EXAMEN}', exist_ok=True)
with open(f'{BASE}/{EXAMEN}/index.html', 'w') as f:
    f.write(PLANTILLA.format(titulo=examen['titulo'], desc='Repaso de todo el tema 2 de Sociales: dos retos de cada juego de «El cajón vota».', config=json.dumps(examen, ensure_ascii=False, indent=2)))
ficha(EXAMEN, examen['titulo'], 'El final de la aventura: dos retos de cada compartimento de «El cajón vota» (Constitución, competencias, poderes, noche electoral y Unión Europea), para repasar el tema 2 antes del control.', 8,
  'Se abre en el mapa cuando los cinco compartimentos están aprobados, aunque se puede jugar suelto en cualquier momento. Son diez retos fijos, sacados de los siete juegos del tema, en dificultad media.')

# ------------------------------------------------------------------ el mapa
J = lambda slug, titulo: {'slug': slug, 'titulo': titulo}
mapa = {
  'titulo': 'El cajón vota',
  'subtitulo': 'El domingo 29 hay elecciones y en el cajón nadie sabe quién manda. Cinco compartimentos, cinco preguntas. Se puede jugar en orden o empezar por cualquiera.',
  'escena': 'colegio-electoral', 'volver': '../../sociales/',
  'textos': {'sello': 'APROBADO', 'hechos': 'aprobados', 'icono': EXAMEN, 'listo': 'Ya sabes quién manda en el cajón. Ahora, el examen.', 'boton': 'Hacer el examen', 'repetir': 'Repetir el examen'},
  'historia': [
    {'nota': 'EL DOMINGO HAY ELECCIONES. EL LUNES QUIERO SABER QUIÉN MANDA EN ESTE CAJÓN.', 'firma': 'El profe'},
    H('boli', 'seguro', 'Mando yo. Tengo tinta roja.'),
    H('goma', 'pista', 'La tinta no es un voto, Boli. Aquí nadie manda solo: hay reglas, hay votos y hay alguien que vigila.'),
    H('fosforito', 'celebra', '¡Cinco compartimentos! ¡Empiezo por las reglas, que las subrayo todas!'),
  ],
  'compartimentos': [
    {'nombre': 'Las reglas de todos', 'material': 'acta', 'quien': 'goma', 'color': '#ffc531', 'juegos': [J('la-constitucion-del-cajon', 'La Constitución del cajón')]},
    {'nombre': '¿Quién se encarga?', 'material': 'acta', 'quien': 'boli', 'color': '#9bd84a', 'juegos': [J('alcaldesa-por-un-dia', 'Alcaldesa por un día')]},
    {'nombre': 'Tres llaves', 'material': 'acta', 'quien': 'goma', 'color': '#cda8ff', 'juegos': [J('la-isla-del-recreo', 'La isla del recreo')]},
    {'nombre': 'La noche electoral', 'material': 'noche', 'quien': 'boli', 'color': '#e8417a', 'juegos': [J('la-noche-del-escrutinio', 'La noche del escrutinio'), J('la-maquina-de-repartir', 'La máquina de repartir'), J('los-176', '176')]},
    {'nombre': 'La muñeca grande', 'material': 'acta', 'quien': 'fosforito', 'color': '#5ec3ff', 'juegos': [J('la-ley-del-cargador', 'La ley del cargador')]},
  ],
  'final': {'nombre': 'El examen del 29-N', 'slug': EXAMEN, 'cerrado': 'Se abre cuando los cinco compartimentos estén aprobados.', 'abierto': 'Hecho. El profe ya sabe quién manda en el cajón.',
    'historia': [
      H('boli', 'seguro', 'Lunes. El profe ha preguntado quién manda en el cajón.'),
      H('fosforito', 'celebra', '¡Y le hemos dicho que nadie solo! ¡Las reglas, los votos y quien vigila!'),
      H('goma', 'animo', 'Ha puesto cara de examen aprobado. Es su cara de siempre, pero un poco más.'),
    ]},
}
os.makedirs(f'{BASE}/{MAPA}', exist_ok=True)
with open(f'{BASE}/{MAPA}/index.html', 'w') as f:
    f.write(f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{mapa['titulo']} · La cajonera</title>
<meta name="description" content="Aventura de Sociales: el domingo hay elecciones y el lunes el profe quiere saber quién manda en el cajón. Constitución, competencias, poderes, elecciones y Unión Europea.">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../motores/base.css">
</head>
<body data-area="sociales">
<!-- Mapa de una aventura. Para otro bloque: copiar esta carpeta y cambiar los compartimentos. -->
<script type="application/json" id="mapa">
{json.dumps(mapa, ensure_ascii=False, indent=2)}
</script>
<script type="module">
import {{ montaMapa }} from '../motores/mapa.js';
montaMapa(JSON.parse(document.getElementById('mapa').textContent));
</script>
</body>
</html>
''')
ficha(MAPA, mapa['titulo'], 'Aventura del tema 2: el domingo hay elecciones y el lunes el profe quiere saber quién manda en el cajón. Siete juegos sobre la Constitución, quién se encarga de qué, los tres poderes, la noche electoral y la Unión Europea.', 0,
  'El mapa de la aventura: cinco compartimentos del cajón, uno por pregunta del tema. Cada uno se marca como «aprobado» cuando sus juegos están hechos en esa tablet. No bloquea nada: cada juego se puede jugar suelto. Los tres de la noche electoral van encadenados: el escrutinio guarda los votos, la máquina los reparte y «176» negocia con ese Congreso. Al final, el examen mezcla dos retos de cada compartimento.')
print('escrito', MAPA, EXAMEN)
