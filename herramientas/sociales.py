# Genera «La maqueta» (Sociales, tema 2: elecciones, competencias y poderes) con el motor «visita».
# Uso: python3 sociales.py            → escribe el juego
#      python3 sociales.py bocetos    → además, panorámicas de prueba con los puntos rotulados (hasta que lleguen los renders)
# Las panorámicas de verdad: python3 panorama.py prepara <equirect.png o carpeta de caras> /home/claude/cajon/public/juegos/la-maqueta/pano/<escena>.webp
# y sus ángulos se copian de puntos.json a ESCENAS (comprueba los id).
import json, os, sys, subprocess, tempfile
BASE = '/home/claude/cajon/public/juegos'
SLUG = 'la-maqueta'
PLANTILLA = open(__file__.replace('sociales.py', 'juegos.py')).read().split("PLANTILLA = '''")[1].split("'''")[0]
H = lambda quien, pose, texto: {'quien': quien, 'pose': pose, 'texto': texto}

# quién se encarga: un color fijo por nivel, como las muñecas rusas de los vídeos
NIVELES = [
  {'id': 'ayuntamiento', 'nombre': 'El ayuntamiento', 'color': '#9bd84a', 'resumen': 'Lo de tu calle y tu pueblo, el **ayuntamiento**.'},
  {'id': 'comunidad', 'nombre': 'La comunidad autónoma', 'color': '#ff8a1f', 'resumen': 'Colegios, sanidad y carreteras de la región, la **comunidad**.'},
  {'id': 'estado', 'nombre': 'El Estado', 'color': '#e8417a', 'resumen': 'Lo que es igual en toda España, el **Estado**.'},
  {'id': 'ue', 'nombre': 'La Unión Europea', 'color': '#5ec3ff', 'resumen': 'Lo que compartimos con otros países, la **Unión Europea**.'},
]
P = lambda yaw, pitch, nombre, que, grupo=None, por=None: {k: v for k, v in dict(yaw=yaw, pitch=pitch, nombre=nombre, que=que, grupo=grupo, por=por).items() if v is not None}
Q = lambda q, vale, por, pista=None: {k: v for k, v in dict(q=q, vale=vale if isinstance(vale, list) else [vale], por=por, pista=pista).items() if v is not None}

ESCENAS = {
  'plaza': {'inicio': 0, 'grupos': NIVELES, 'puntos': {
    'ayuntamiento': P(0, 14, 'El ayuntamiento', 'Es el edificio desde el que se gobierna el pueblo.'),
    'fuente': P(0, -8, 'La fuente y el alcantarillado', 'Por aquí llega el agua y se va la que ensuciamos.', 'ayuntamiento', 'El agua del grifo y el alcantarillado son cosa del **ayuntamiento**.'),
    'basura': P(30, -6, 'La recogida de basura', 'El camión pasa cada noche.', 'ayuntamiento', 'Recoger la basura y limpiar las calles le toca al **ayuntamiento**.'),
    'policia-municipal': P(60, -5, 'La policía municipal', 'Vigila el tráfico y las calles del pueblo.', 'ayuntamiento', 'La policía **municipal** lo dice en el nombre: es del **ayuntamiento** (municipio).'),
    'biblioteca': P(90, 0, 'La biblioteca y el polideportivo', 'Libros, deporte y actividades para los vecinos.', 'ayuntamiento', 'Biblioteca **municipal**, polideportivo, fiestas: cultura y deporte cercanos, del **ayuntamiento**.'),
    'colegio': P(120, 0, 'El colegio público', 'Un colegio como el tuyo.', 'comunidad', 'La **educación** la gestiona la **comunidad autónoma**: maestros, colegios, calendario escolar.'),
    'centro-salud': P(150, -2, 'El centro de salud', 'Donde vas cuando te pones malo.', 'comunidad', 'La **sanidad** la lleva la **comunidad autónoma**: centros de salud y hospitales.'),
    'carretera': P(180, -4, 'Las obras de la carretera M-501', 'Una carretera que une varios pueblos de la región.', 'comunidad', 'Las carreteras que unen pueblos de una misma región son de la **comunidad**. Por eso esta empieza por **M**, de Madrid.'),
    'feder': P(-150, -3, 'El parque renovado con fondos europeos', 'Un cartel dice quién ha puesto parte del dinero.', 'ue', 'La **Unión Europea** reparte fondos (los del **FEDER**) para que las zonas que lo necesitan mejoren. El cartel lo avisa.'),
    'dni': P(-120, -2, 'La oficina del DNI y el pasaporte', 'Aquí te hacen el carné de identidad.', 'estado', 'El **DNI** es igual en toda España: lo hace la **Policía Nacional**, del **Estado**.'),
    'correos': P(-90, -2, 'Correos', 'Cartas y paquetes a cualquier sitio.', 'estado', '**Correos** es una empresa del **Estado**: llega igual a todos los pueblos del país.'),
    'euro': P(-60, -6, 'El euro', 'La moneda con la que pagas en el quiosco.', 'ue', 'El **euro** lo compartimos con otros países de la **Unión Europea**. El Banco Central Europeo lo vigila.'),
    'farola': P(-30, -1, 'La farola y la señal', 'Luz por la noche y señales para el tráfico.', 'ayuntamiento', 'El alumbrado y las señales de las calles son del **ayuntamiento**.'),
  }, 'preguntas': [
    Q('Se ha fundido la farola de tu calle. ¿**A quién** se lo dices? Busca su edificio en la plaza.', 'ayuntamiento', 'Al **ayuntamiento**: las calles, la luz y la basura del pueblo son cosa suya.'),
    Q('Hay algo en esta plaza que **la Unión Europea** ha ayudado a pagar. Encuéntralo.', 'feder', 'El cartel lo dice: fondos **europeos**. La UE ayuda a mejorar las zonas que lo necesitan.'),
    Q('Busca un documento que es **igual en toda España**, lo pidas en el pueblo que lo pidas.', 'dni', 'El **DNI**. Es del Estado: el mismo para todos, en todo el país.'),
    Q('Busca algo que usamos igual en **Francia, Italia o Portugal**.', 'euro', 'El **euro**: la moneda de muchos países de la Unión Europea.'),
    Q('Te duele la tripa desde ayer. ¿Adónde vas? Ese servicio lo paga tu **comunidad autónoma**.', 'centro-salud', 'Al **centro de salud**. La sanidad es de la comunidad autónoma.'),
    Q('Busca algo de la plaza que cuida la **policía de tu pueblo**.', ['policia-municipal'], 'La policía **municipal**: el tráfico y la seguridad de las calles del pueblo.'),
  ]},

  'colegio-electoral': {'inicio': 0, 'grupos': [
      {'id': 'puede', 'nombre': 'Puede votar', 'color': '#9bd84a'},
      {'id': 'no-puede', 'nombre': 'Todavía no', 'color': '#ff8a1f'}],
    'puntos': {
    'urna': P(0, -8, 'La urna', 'Una caja transparente con una ranura.'),
    'mesa': P(25, -6, 'La mesa electoral', 'Una presidenta y dos vocales con la lista del censo.'),
    'cartel': P(150, 8, 'El cartel de las elecciones', 'Pone qué elecciones son y qué día.'),
    'papeletas': P(-150, -8, 'Las papeletas y los sobres', 'Un montón por cada partido.'),
    'cabina': P(-100, 0, 'La cabina', 'Un rincón con cortina.'),
    'recuento': P(-45, 4, 'La pizarra del recuento', 'Palotes en tres columnas.'),
    'votante-10': P(70, -4, 'Una niña de 10 años', 'Ha venido con su madre.', 'no-puede', '**10 años**: todavía no. Para votar hay que tener **18**. Pero puede acompañar y mirar.'),
    'votante-17': P(82, -4, 'Un chico de 17 años', 'Cumple los 18 en enero.', 'no-puede', '**17 años**: por poco, pero no. El día de las elecciones hay que tener ya **18**.'),
    'votante-18': P(94, -4, 'Una chica de 18 años', 'Es la primera vez que vota.', 'puede', '**18 años**: sí. Es la edad para votar.'),
    'votante-45': P(106, -4, 'Un señor de 45 años', 'Trae el DNI en la mano.', 'puede', '**45 años**: sí.'),
    'votante-80': P(118, -4, 'Una señora de 80 años', 'Lleva votando toda la vida.', 'puede', '**80 años**: sí. No hay edad máxima para votar.'),
  }, 'orden': ['papeletas', 'cabina', 'mesa', 'urna', 'recuento'],
  'antes': {'cabina': 'Antes de ir a la cabina necesitas algo en la mano: la papeleta y el sobre.', 'mesa': 'Antes de ir a la mesa, la papeleta tiene que estar ya dentro del sobre.', 'urna': 'Antes de votar, la mesa tiene que ver tu DNI y buscarte en la lista.', 'recuento': 'Se cuenta al final, cuando ya ha votado todo el mundo.'},
  'pasos': {'papeletas': 'Coges la papeleta del partido que eliges y un sobre.', 'cabina': 'En la cabina metes la papeleta en el sobre sin que nadie vea cuál es. Usarla no es obligatorio, pero ayuda a que el voto sea **secreto**.', 'mesa': 'Enseñas el **DNI** y te buscan en la lista del **censo**.', 'urna': 'El sobre cerrado entra en la **urna**.', 'recuento': 'A las ocho se cierra y la mesa **cuenta** los votos delante de quien quiera mirar.'},
  'preguntas': [
    Q('¿**Qué día** son estas elecciones? Búscalo.', 'cartel', 'El **29 de noviembre**. Son elecciones **generales**: se elige el Congreso y el Senado.'),
    Q('¿Dónde puedes preparar tu voto **sin que nadie lo vea**?', 'cabina', 'En la **cabina**. El voto es **secreto**: nadie tiene por qué saber qué has votado.'),
    Q('¿Quién comprueba que estás en la **lista del censo**?', 'mesa', 'La **mesa electoral**: vecinos elegidos por sorteo.'),
    Q('Las elecciones han acabado. ¿Dónde se ve **qué partido** tiene más votos en este colegio?', 'recuento', 'En el **recuento**. Se cuenta en público y cualquiera puede mirar.'),
  ]},

  'hemiciclo': {'inicio': 0, 'puntos': {
    'tribuna': P(0, -4, 'La tribuna', 'Desde aquí habla quien defiende o critica una ley.'),
    'presidencia': P(0, 15, 'La mesa de la presidencia', 'Dirige los debates y da la palabra.'),
    'ley': P(30, -4, 'El proyecto de ley', 'Una ley que todavía no se ha aprobado.'),
    'panel': P(60, 6, 'El panel de votación', 'Tres luces: sí, no y abstención.'),
    'escanos': P(180, -10, 'Los escaños', 'Los asientos de los diputados, por colores de partido.'),
    'publico': P(-120, 20, 'La tribuna del público', 'Cualquiera puede venir a mirar.'),
    'puerta-senado': P(-60, 0, 'La puerta al Senado', 'Lleva a la otra cámara.'),
  }, 'preguntas': [
    Q('Estás en el Congreso, la casa del **poder legislativo**. ¿Qué se hace aquí? Busca la pista.', 'ley', 'Aquí se **hacen las leyes**: eso es el poder **legislativo**.'),
    Q('¿**Cuántos diputados** hay en el Congreso? Búscalo escrito.', 'escanos', '**350**. Los elegimos votando en las elecciones generales.'),
    Q('¿Cómo se decide si una ley sale adelante?', 'panel', '**Votando**. Si hay más síes que noes, la ley sigue su camino.'),
    Q('Las **Cortes Generales** son dos cámaras: el Congreso y otra más. Busca el camino a la otra.', 'puerta-senado', 'El **Senado**. Congreso y Senado juntos son las Cortes Generales.'),
    Q('¿Puede una persona cualquiera ver los debates? Busca dónde se sentaría.', 'publico', 'Sí: hay **tribuna para el público**. Lo que se decide aquí es de todos.'),
  ]},

  'gobierno': {'inicio': 0, 'puntos': {
    'presidente': P(0, -4, 'La presidencia del Gobierno', 'La silla principal de la mesa.'),
    'ministros': P(90, -6, 'Los ministerios', 'Educación, Sanidad, Exteriores, Hacienda…'),
    'presupuesto': P(150, -6, 'El presupuesto', 'Las cuentas del país para un año.'),
    'mapamundi': P(-150, 8, 'El mapamundi', 'Para las relaciones con otros países.'),
    'leyes': P(-90, -6, 'Las leyes aprobadas', 'Carpetas que llegan desde las Cortes.'),
    'corona': P(-45, 10, 'El cuadro de la corona', 'Recuerda quién es el jefe del Estado.'),
  }, 'preguntas': [
    Q('Estás en la sala del **Gobierno**, el **poder ejecutivo**. ¿Quién lo dirige?', 'presidente', 'El **presidente o la presidenta del Gobierno**. Lo elige el Congreso.'),
    Q('El Gobierno **no hace** las leyes: las **pone en marcha**. Busca las que le llegan de las Cortes.', 'leyes', 'Las **leyes aprobadas**. Las Cortes las hacen; el Gobierno las **ejecuta**: de ahí «poder ejecutivo».'),
    Q('¿Quién ayuda al presidente, cada uno en un tema? Búscalos.', 'ministros', 'Los **ministros y ministras**, cada uno con su ministerio.'),
    Q('España es una **monarquía parlamentaria**. Busca quién es el **jefe del Estado**.', 'corona', 'El **rey**. Representa al país, pero no gobierna: gobierna el Gobierno.'),
    Q('Cada año el Gobierno prepara **en qué se gasta el dinero** del país. Búscalo.', 'presupuesto', 'El **presupuesto**. Lo prepara el Gobierno y lo tienen que aprobar las Cortes.'),
  ]},

  'tribunal': {'inicio': 0, 'puntos': {
    'estrado': P(0, 2, 'El tribunal', 'Jueces y juezas con toga.'),
    'balanza': P(40, 8, 'La balanza', 'El símbolo de la justicia.'),
    'constitucion': P(100, -2, 'La Constitución', 'Un libro enorme sobre un pedestal.'),
    'abogados': P(180, -6, 'Las dos partes', 'Cada una cuenta su versión.'),
    'codigos': P(-110, 4, 'Las leyes', 'Una estantería de libros gordos.'),
    'publico': P(-50, -6, 'El público', 'Los juicios suelen ser públicos.'),
  }, 'preguntas': [
    Q('Estás en un juzgado, el **poder judicial**. ¿Quién decide si alguien ha cumplido la ley?', 'estrado', 'Los **jueces y juezas**. Son **independientes**: ni el Gobierno ni las Cortes les dicen qué decidir.'),
    Q('Busca **la ley más importante**, la que está por encima de todas.', 'constitucion', 'La **Constitución** de 1978. Ninguna ley puede ir contra ella.'),
    Q('¿Con qué juzgan los jueces? No con lo que les parece: con…', 'codigos', 'Con las **leyes**, las que aprobaron las Cortes. Por eso los tres poderes se necesitan.'),
    Q('Antes de decidir, el tribunal **escucha a los dos lados**. Búscalos.', 'abogados', 'Las **dos partes**: cada una con su abogado o abogada.'),
    Q('Busca el **símbolo** de la justicia.', 'balanza', 'La **balanza**: pesar las dos versiones por igual.'),
  ]},
}

cfg = {
  'motor': 'visita', 'area': 'sociales', 'escena': 'estuche', 'personaje': 'goma', 'volver': '../../sociales/',
  'titulo': 'La maqueta',
  'subtitulo': 'Una maqueta de cartulina del país en miniatura: la plaza, el colegio electoral y los tres poderes.',
  'portada': {'objetivo': 'Mira alrededor y toca: quién se encarga de cada cosa, cómo se vota y qué hace cada poder.', 'frase': 'Cuidado, que la cola está recién pegada.', 'rotulo': 'MAQUETA'},
  'historia': [H('goma', 'seguro', 'El 29 de noviembre hay elecciones. Para entenderlas hemos hecho una maqueta de cartulina.'),
               H('goma', 'pista', 'Mírala por dentro: arrastra el dedo para girar y toca lo que veas.')],
  'saludo': 'Arrastra para **mirar alrededor**. Hay cosas detrás de ti.',
  'observa': 'Si mañana se rompe algo en tu calle, en tu cole o en tu centro de salud, ¿a quién habría que decírselo en cada caso?',
  'escenas': {k: {**v, 'pano': f'pano/{k}.webp'} for k, v in ESCENAS.items()},
  'niveles': [
    {'modo': 'busca', 'escena': 'plaza', 'generar': {'n': 3}},
    {'modo': 'clasifica', 'escena': 'plaza', 'generar': {'grupos': ['ayuntamiento', 'comunidad'], 'n': 5}},
    {'modo': 'clasifica', 'escena': 'colegio-electoral', 'generar': {'n': 5}, 'enunciado': 'Hay **cinco personas** en la cola. Toca cada una: ¿**puede votar**?', 'pista': 'Mira la chapa de cada una: lleva su edad.', 'principio': 'Para votar en España hay que tener **18 años** o más el día de las elecciones.', 'nota': 'A partir de **18 años**, y sin edad máxima.'},
    {'modo': 'ordena', 'escena': 'colegio-electoral', 'generar': True, 'enunciado': 'Toca los pasos **en orden**: lo que hace una persona desde que entra hasta que se cuenta su voto.', 'por': 'Papeleta y sobre, cabina, mesa con el DNI, urna. Y al cerrar, el recuento.'},
    {'modo': 'clasifica', 'escena': 'plaza', 'generar': {'n': 7}},
    {'modo': 'busca', 'escena': 'colegio-electoral', 'generar': {'n': 3}},
    {'modo': 'busca', 'escena': 'hemiciclo', 'generar': {'n': 3}},
    {'modo': 'busca', 'escena': 'gobierno', 'generar': {'n': 3}},
    {'modo': 'busca', 'escena': 'tribunal', 'generar': {'n': 3}},
    {'modo': 'clasifica', 'escena': 'plaza', 'generar': {'n': 10}},
  ],
}
# los pasos del colegio electoral viven en sus puntos («que») para el modo ordena
for k, t in ESCENAS['colegio-electoral']['pasos'].items(): cfg['escenas']['colegio-electoral']['puntos'][k]['que'] = t
cfg['niveles'][3]['antes'] = ESCENAS['colegio-electoral']['antes']; cfg['niveles'][3]['orden'] = ESCENAS['colegio-electoral']['orden']
for e in cfg['escenas'].values():
  for k in ('pasos', 'antes', 'orden'): e.pop(k, None)

os.makedirs(f'{BASE}/{SLUG}', exist_ok=True)
with open(f'{BASE}/{SLUG}/index.html', 'w') as f:
  f.write(PLANTILLA.format(titulo=cfg['titulo'], desc='Maqueta de cartulina en 360°: quién se encarga de cada servicio, cómo se vota y qué hace cada poder del Estado.', config=json.dumps(cfg, ensure_ascii=False, indent=2)))
print('escrito', SLUG, sum(len(e['puntos']) for e in cfg['escenas'].values()), 'puntos')

if 'bocetos' in sys.argv:
  for k, e in ESCENAS.items():
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as t:
      json.dump({'puntos': [{'id': i, **p} for i, p in e['puntos'].items()]}, t)
    subprocess.run(['python3', __file__.replace('sociales.py', 'panorama.py'), 'boceto', f'{BASE}/{SLUG}/pano/{k}.webp', t.name], check=True)
