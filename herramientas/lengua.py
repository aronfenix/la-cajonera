# Genera «Sin aliento» (Lengua, puntuación) con el motor «texto», su ficha y la herramienta «Puntúa tu texto».
# Para hacer otro juego con el mismo motor: copiar el bloque de «Sin aliento» y cambiar TEXTOS y niveles.
# Marcado de los textos: ver la cabecera de public/juegos/motores/texto.js
import json, os
BASE = '/home/claude/cajon/public/juegos'
FICHAS = '/home/claude/cajon/src/content/materiales'
FECHA = '2026-11-15'
PLANTILLA = open(__file__.replace('lengua.py', 'juegos.py')).read().split("PLANTILLA = '''")[1].split("'''")[0]
H = lambda quien, pose, texto: {'quien': quien, 'pose': pose, 'texto': texto}
q = lambda t: json.dumps(t, ensure_ascii=False)

def ficha(slug, titulo, tipo, resumen, orden, cuerpo, tema='lengua-puntuacion'):
    with open(f'{FICHAS}/{slug}.md', 'w') as f:
        f.write(f'---\ntitulo: {q(titulo)}\ntema: {tema}\ntipo: {tipo}\nresumen: {q(resumen)}\nfecha: {FECHA}\nportada: /src/media/portadas/{slug}.jpg\nenlace: /juegos/{slug}/\norden: {orden}\n---\n\n{cuerpo}\n')

TEXTOS = [
  # ---- f1: tres oraciones cortas
  {'f': 1, 'titulo': 'La impresora', 't': 'La impresora del cole se ha quedado sin tinta. Ahora los textos salen sin puntos ni comas. ^Fosforito intenta leerlos en voz alta y se pone morado.', 'nota': 'Tres ideas, tres puntos.'},
  {'f': 1, 'titulo': 'El recreo', 't': 'El recreo dura media hora. A mí siempre me parece que dura cinco minutos. El reloj del patio{sv} tiene algo contra nosotros.'},
  {'f': 1, 'titulo': 'Robinson llega a la isla', 't': 'El barco se hundió de madrugada. ^Robinson nadó hasta la playa sin mirar atrás. Cuando amaneció(,) estaba solo en la isla.'},
  {'f': 1, 'titulo': 'El corazón', 't': 'El corazón late unas cien mil veces al día. No descansa ni cuando duermes. Es el músculo más trabajador del cuerpo.'},
  {'f': 1, 'titulo': 'Las croquetas', 't': 'Mi abuela{sv} hace croquetas los domingos. Nadie sabe la receta. Ella dice que el secreto es no tener prisa.'},
  # ---- f2: cuatro o cinco oraciones, o comas claras
  {'f': 2, 'titulo': 'Lázaro y el jarro de vino', 't': '^Lázaro servía a un ciego muy listo y muy tacaño. El ciego{sv} guardaba el vino en un jarro y no lo soltaba nunca. ^Lázaro hizo un agujerito en el fondo y lo tapó con cera. Cada tarde(,) se tumbaba debajo y bebía a escondidas. El jarro pesaba cada día menos y el ciego empezó a sospechar.'},
  {'f': 2, 'titulo': 'Los charcos', 't': 'Ayer llovió toda la tarde. Hoy el patio está lleno de charcos. Los de primero{sv} los cruzan saltando por encima. Los de sexto los cruzan por el medio y luego dicen que ha sido sin querer.'},
  {'f': 2, 'titulo': 'Comer cabeza abajo', 't': 'La comida no baja al estómago por su propio peso. La empujan los músculos del esófago. Por eso(,) un astronauta puede comer cabeza abajo. El viaje de la boca al estómago{sv} dura unos diez segundos.'},
  {'f': 2, 'titulo': 'El río', 't': 'Un río nace en la montaña como un hilo de agua fría. Baja deprisa,{e} salta entre las rocas{y} y arrastra piedras. En la llanura(,) se calma y dibuja curvas. Al final(,) llega al mar(,) cansado y ancho.'},
  {'f': 2, 'titulo': 'La mochila', 't': 'En la mochila llevo un estuche,{e} dos cuadernos,{e} el bocadillo{y} y una piedra muy bonita. La piedra{sv} no sirve para nada. La llevo por si acaso.', 'nota': 'En una lista, coma entre los elementos y ninguna delante de la «y» final.'},
  {'f': 2, 'titulo': 'Se acabó el recreo', 'para': ',', 't': '—^Marta,{v} deja ya el balón. —Un momento,{v} profe,{v} que voy ganando. —^Marta,{v} el recreo terminó hace diez minutos.', 'nota': 'El nombre de la persona a la que hablas va siempre separado por comas.'},
  {'f': 2, 'titulo': 'Los tres del estuche', 't': '^Goma,{i} la más veterana del estuche,{i} no se asusta por nada. ^Boli,{i} que presume de serio,{i} se ríe cuando nadie mira. ^Fosforito,{c} en cambio,{c} se emociona con todo.', 'nota': 'Una aclaración va entre dos comas: si la quitas, la oración sigue en pie.'},
  {'f': 2, 'titulo': 'Una o billones', 't': 'Todos los seres vivos están hechos de células. Algunos,{i} como las bacterias,{i} tienen solo una. Otros,{i} como tú,{i} tienen billones. Cada una hace su trabajo y todas dependen de las demás.'},
  # ---- f3: más largos, con trampas
  {'f': 3, 'titulo': 'El equipaje de Robinson', 't': '^Robinson rescató del barco un hacha,{e} dos escopetas,{e} un saco de clavos{y} y un perro. Con eso(,) tenía que empezar de nuevo. Lo primero que construyó{sv} fue una cabaña. Lo segundo fue un calendario(,) porque no quería perder la cuenta de los días.'},
  {'f': 3, 'titulo': 'La semana de la tiza', 't': 'El lunes desapareció la tiza. El martes desaparecieron el borrador,{e} las chinchetas{y} y la regla larga. El miércoles(,) el profe{sv} cerró el armario con llave. El jueves(,) alguien dejó una nota: «Devuelvo todo si quitáis el examen». El viernes hubo examen.'},
  {'f': 3, 'titulo': 'Las uvas', 't': 'Un día les regalaron un racimo de uvas. El ciego propuso comerlas de una en una(,) por turnos. Lázaro vio que su amo las cogía de dos en dos y empezó a cogerlas de tres en tres. Al terminar, el ciego dijo que lo sabía todo. Lázaro preguntó cómo. El ciego respondió que él comía de dos en dos y Lázaro callaba.'},
  {'f': 3, 'titulo': 'El esqueleto', 't': 'Tu esqueleto{sv} tiene doscientos seis huesos. El más largo es el fémur(,) en el muslo. El más pequeño está dentro del oído y mide menos que un grano de arroz. Sin ellos(,) serías un charco con ropa.'},
  # ---- elegidos por el error que provocan
  {'f': 1, 'titulo': 'El desayuno', 't': 'Hoy no he desayunado. Me rugen tanto las tripas que la profe ha preguntado quién había traído un perro. He levantado la mano.', 'nota': 'Tres hechos, tres oraciones. Una coma no basta para separar dos ideas completas.'},
  {'f': 1, 'titulo': 'El cartero', 't': 'El perro que vive en la casa azul de la esquina{sv} ladra cada vez que pasa el cartero. El cartero ya no se asusta. Le deja las cartas y una galleta.', 'nota': 'Una oración puede ser larga y no llevar ni una coma: quien hace algo y lo que hace van seguidos.'},
  {'f': 1, 'titulo': 'Las elecciones', 't': 'En España hay elecciones generales cada cuatro años como máximo. Los ciudadanos mayores de edad{sv} eligen a los diputados. Después(,) los diputados eligen al presidente del Gobierno.'},
  {'f': 1, 'titulo': 'La hormiga', 't': 'Una hormiga puede cargar cincuenta veces su peso. Es como si tú levantaras un coche. Ella lo hace sin presumir.'},
  {'f': 2, 'titulo': '¿Quién ha sido?', 't': 'Alguien se ha comido las galletas de la profe. ¿Quién ha sido? Nadie contesta. ^Fosforito tiene migas en la tapa. ¡Qué casualidad!', 'nota': 'Los signos ? y ! ya cierran la oración: detrás no se pone punto.'},
  {'f': 2, 'titulo': 'Mi hermana', 't': 'Mi hermana tiene tres años. No sabe leer,{p} pero se inventa los cuentos mirando los dibujos. Sus cuentos{sv} son mejores que los del libro.'},
  {'f': 2, 'titulo': 'El autobús', 't': 'Quería llegar pronto,{p} pero el autobús tenía otros planes. Paró en todas las paradas,{e} en dos semáforos{y} y en un sitio donde no había nada. Llegué tarde,{p} pero con buena excusa.', 'nota': 'Delante de «pero» va coma. Delante de la «y» que cierra una lista, no.'},
  {'f': 2, 'titulo': 'Dos ciudades', 't': '^Madrid,{i} la capital de España,{i} está casi en el centro de la Península. ^Barcelona,{i} la segunda ciudad más grande,{i} está junto al mar. Las dos tienen metro,{e} atascos{y} y equipos de fútbol que no se llevan bien.'},
  {'f': 2, 'titulo': 'A la mesa', 'para': ',', 't': '—^Abuela,{v} ¿queda tortilla? —Claro,{v} hijo,{v} pero pon antes la mesa. —Ya voy,{v} abuela. —Y tú,{v} ^Tobi,{v} baja del sofá.', 'nota': 'Al principio, en medio o al final: el nombre de la persona a la que hablas va siempre separado por comas.'},
  {'f': 3, 'titulo': 'Los murciélagos', 't': 'Los murciélagos no son ciegos. Sin embargo,{c} de noche se guían por el oído. Lanzan chillidos muy agudos y escuchan el eco. Así saben dónde hay una pared,{e} una rama{y} o una polilla. Además,{c} casi nunca chocan.'},
  {'f': 3, 'titulo': 'El toro de piedra', 't': 'El ciego le dijo a Lázaro que acercara la oreja a un toro de piedra para oír un gran ruido. Lázaro,{i} inocente,{i} la acercó. Entonces(,) el ciego le dio tal cabezazo contra el toro que el dolor le duró tres días. Aquel día(,) Lázaro aprendió a no fiarse de nadie.'},
  {'f': 3, 'titulo': 'Viernes', 't': '^Robinson llevaba muchos años sin hablar con nadie. Un día(,) salvó a un hombre que huía por la playa. Le enseñó a decir «sí»,{e} «no»{y} y «gracias». Como lo encontró un viernes, lo llamó Viernes.'},
  {'f': 3, 'titulo': 'El plato', 't': 'La mitad del plato{sv} son verduras y frutas. Un cuarto son cereales integrales. El otro cuarto son proteínas, como el pescado o las legumbres. Para beber(,) agua.'},
  {'f': 3, 'titulo': 'Comunidades', 't': '^España tiene diecisiete comunidades autónomas. Algunas,{i} como Madrid o Murcia,{i} tienen una sola provincia. Otras,{i} como Andalucía,{i} tienen ocho. Además,{c} hay dos ciudades autónomas: Ceuta y Melilla.'},
  # ---- f4: dos párrafos
  {'f': 4, 'titulo': 'La excursión', 't': 'Salimos del cole a las nueve. En el autobús cantamos,{e} comimos pipas{y} y perdimos una mochila.¶ El museo era enorme. Había un esqueleto de ballena colgado del techo. Nadie quiso ponerse debajo.', 'nota': 'Primero, el viaje. Después, el museo. Cambia el lugar: punto y aparte.'},
  {'f': 4, 'titulo': 'El loro', 't': 'Robinson le enseñó a hablar a un loro. Tardó meses en conseguir que dijera su nombre.¶ Años después(,) el loro seguía repitiéndolo por toda la isla. Era la única voz que Robinson oía,{p} pero era la suya.', 'nota': 'Entre un párrafo y otro pasan años: punto y aparte.'},
  {'f': 4, 'titulo': 'El volcán', 't': 'Los volcanes no avisan con mucha antelación. Primero tiembla el suelo. Después sale humo por el cráter.¶ En Canarias lo saben bien. En 2021(,) un volcán de La Palma estuvo casi tres meses echando lava. Cuando se apagó(,) la isla era un poco más grande.', 'nota': 'Primer párrafo: los volcanes en general. Segundo: uno en concreto. Por eso, punto y aparte.'},
  {'f': 4, 'titulo': 'Colecciones', 't': 'Mi hermano pequeño{sv} colecciona palos. Tiene palos largos,{e} palos cortos{y} y un palo que(,) según él(,) es una espada. Los guarda debajo de la cama.¶ Mi madre colecciona paciencia. La guarda donde puede.', 'nota': 'Se deja de hablar del hermano y se empieza a hablar de la madre: punto y aparte.'},
  {'f': 4, 'titulo': 'La huella', 't': 'Una mañana(,) Robinson encontró una huella en la arena. No era suya. La miró durante mucho rato(,) sin atreverse a tocarla.¶ Aquella noche no durmió. Llevaba quince años creyendo que estaba solo en la isla.', 'nota': 'Del día a la noche, de lo que ve a lo que piensa: punto y aparte.'},
]

cfg = {
  'motor': 'texto', 'area': 'lengua', 'escena': 'cuaderno', 'personaje': 'fosforito', 'volver': '../../lengua/',
  'titulo': 'Sin aliento',
  'subtitulo': 'A la impresora del cole se le ha acabado la tinta de los puntos y las comas. Y a Fosforito le toca leer en voz alta lo que sale.',
  'portada': {'folio': True, 'objetivo': 'Pon los puntos y las comas que faltan y escucha cómo queda el texto leído con tus pausas.', 'frase': '¡Lo leo todo seguido y me pongo morado!', 'rotulo': 'PUNTUACIÓN'},
  'historia': [
    {'nota': 'QUEDA POCA TINTA. PARA AHORRAR, SE IMPRIMIRÁ SIN PUNTOS NI COMAS.', 'firma': 'La impresora'},
    H('fosforito', 'asombro', '¡Me toca leer esto en voz alta y no tiene ni un punto! ¿Dónde respiro?'),
    H('boli', 'seguro', 'Donde acaba una idea, punto. Donde hay una pausa pequeña, coma. Tampoco es para tanto.'),
    H('goma', 'animo', 'Y si te sobra alguno, para eso estoy yo.'),
  ],
  'saludo': 'Un punto es **una idea terminada**. Una coma, una pausa pequeña.',
  'observa': 'Si nadie te ha puesto el punto, ¿cómo sabes dónde termina una oración?',
  'niveles': [
    {'modo': 'puntua', 'signos': ['.'], 'generar': {'f': 1}},
    {'modo': 'sentido', 'generar': {'ids': ['comer', 'pintar', 'espera']}},
    {'modo': 'puntua', 'signos': ['.'], 'generar': {'f': 2, 'min': 2}},
    {'modo': 'puntua', 'signos': [','], 'generar': {'f': 3}},
    {'modo': 'corrige', 'errores': 2, 'generar': {'f': 2}},
    {'modo': 'sentido', 'generar': {'ids': ['hambre', 'lucia', 'prima']}},
    {'modo': 'puntua', 'signos': [',', '.'], 'generar': {'f': 3, 'min': 2}},
    {'modo': 'corrige', 'errores': 3, 'generar': {'f': 3, 'min': 2}},
    {'modo': 'sentido', 'generar': {'ids': ['paraguas', 'examen']}},
    {'modo': 'puntua', 'signos': [',', '.', '¶'], 'generar': {'f': 4, 'min': 4}},
  ],
  'textos': TEXTOS,
}
os.makedirs(f'{BASE}/sin-aliento', exist_ok=True)
with open(f'{BASE}/sin-aliento/index.html', 'w') as f:
    f.write(PLANTILLA.format(titulo=cfg['titulo'], desc='Pon los puntos y las comas que le faltan a cada texto y escucha cómo queda leído con tus pausas. Puntuación para todo el curso.', config=json.dumps(cfg, ensure_ascii=False, indent=2)))
ficha('sin-aliento', 'Sin aliento', 'juego', 'Textos sin puntos ni comas: se ponen con un sello y Fosforito los lee con esas pausas. Si faltan puntos, se queda sin aire. También, frases que cambian de significado con una coma.', 1,
  'Tres mecánicas que se van alternando. En la primera llega un texto sin puntuar: se elige un sello (coma, punto, punto y aparte) y se toca la palabra que lleva el signo detrás. Antes de comprobar se puede pedir que lo lean: Fosforito subraya palabra a palabra, respira en cada pausa y se ahoga donde faltan. Si la tablet trae voz en español, además se oye. En la segunda, el texto llega puntuado con errores (una coma entre el sujeto y el verbo, una coma donde iba punto…) y hay que arreglarlos. En la tercera, una frase como «Vamos a comer niños» y una viñeta que dibuja lo que dice según dónde esté la coma.\n\nLa corrección no dice «mal»: explica el error con las palabras del texto («entre *patio* y *tiene* no va coma: no se separa a quien hace algo de lo que hace»). Hay treinta y seis textos, de tres oraciones a dos párrafos, elegidos por el error que provocan: la coma entre el sujeto y el verbo, la coma donde iba punto, el punto detrás de una interrogación, la coma delante de «pero»… Son escenas de clase, Robinson Crusoe, el Lazarillo y contenidos de Ciencias y de Sociales. Y ocho frases con viñeta.')
ficha('puntua-tu-texto', 'Puntúa tu texto', 'herramienta', 'Pegas cualquier texto bien puntuado y sale un juego como «Sin aliento» con ese texto: el capítulo de la tertulia, un párrafo de Ciencias, una redacción.', 2,
  'Se pega el texto, se elige qué signos se quitan (solo los puntos; puntos y comas; o también el punto y aparte) y la página da un enlace. Ese enlace abre el juego con el texto ya troceado en retos de pocas oraciones. El texto viaja dentro del propio enlace: no se guarda en ningún sitio ni se envía a nadie.\n\nLos puntos se corrigen tal como están en el original. Con las comas pasa lo mismo, así que conviene revisar antes que el texto no tenga comas discutibles.')
PALABRAS = [(1, 'camión sofá café ratón jardín lápiz árbol fácil azúcar canción compás mesa libro pared ventana papel'),
  (2, 'examen joven volumen imagen resumen origen margen canciones camiones jóvenes exámenes árboles lápices inglés ingleses francesa feliz nariz reloj comen cantan lunes'),
  (3, 'pájaro médico música teléfono rápido sábado brújula día río país baúl maíz grúa búho María héroe océano línea fue vio dio pie fe historia')]
TILDES = [
  {'f': 1, 'titulo': 'El camión', 't': 'El camión del colegio llegó tarde. El conductor pidió perdón y nos contó que un árbol había caído en la carretera.'},
  {'f': 1, 'titulo': 'El violín', 't': 'Mi tío Andrés toca el violín en el salón. Cuando ensaya, el perro se esconde debajo del sofá.'},
  {'f': 1, 'titulo': 'El melón', 't': 'Ayer comí melón en el jardín. Después jugué al fútbol con Inés hasta que se hizo de noche.'},
  {'f': 2, 'titulo': 'El examen', 't': 'El examen fue fácil. El joven profesor dibujó un volcán y un árbol, y nos pidió un resumen de dos renglones.', 'nota': '«Examen», «joven» y «resumen» acaban en n y suenan en la penúltima: se leen bien sin tilde.'},
  {'f': 2, 'titulo': 'Los camiones', 't': 'Los camiones llevan melones y limones al almacén. El camión viejo lleva solo un melón y dos limones.', 'nota': '«Camión» lleva tilde y «camiones» no: al añadir una sílaba, el golpe ya cae donde se lee.'},
  {'f': 2, 'titulo': 'El lápiz', 't': 'Lucía dibuja con un lápiz azul. Sus lápices nuevos están en el cajón, pero ese es su lápiz de la suerte.'},
  {'f': 3, 'titulo': 'El pájaro músico', 't': 'El médico miró la película en su teléfono. Era una historia cómica sobre un pájaro que quería ser músico.', 'nota': 'Si el golpe va en la antepenúltima sílaba, lleva tilde siempre.'},
  {'f': 3, 'titulo': 'Un país frío', 't': 'María vive en un país frío. Todos los días cruza el río en una grúa vieja y saluda a un búho.', 'nota': 'En «país», «frío» o «día», la tilde separa dos vocales que, sin ella, se leerían pegadas.'},
  {'f': 3, 'titulo': 'El baúl', 't': 'Raúl guardó el baúl en el desván. Dentro había un reloj, un mapa y una brújula sin cristal.'},
  {'f': 3, 'titulo': 'El águila', 't': 'El sábado vimos un águila. Planeó sobre el río, vio un pez y bajó como un rayo. Fue rapidísimo.', 'nota': '«Vio» y «fue» tienen una sola sílaba: van sin tilde.'},
]
cfg2 = {
  'motor': 'texto', 'area': 'lengua', 'escena': 'cuaderno', 'personaje': 'boli', 'volver': '../../lengua/',
  'titulo': 'Suena raro',
  'subtitulo': 'Ahora la impresora se come las tildes. Y sin tildes, las palabras se leen con el golpe en otro sitio.',
  'portada': {'folio': True, 'piezas': ['ó', 'á'], 'objetivo': 'Mira cómo se lee cada palabra tal como está escrita y pon tilde solo donde suene raro.', 'frase': 'CA-mion. Así lo has escrito tú, no yo.', 'rotulo': 'TILDES'},
  'historia': [
    {'nota': 'TINTA BAJO MÍNIMOS. A PARTIR DE AHORA SE IMPRIME SIN TILDES.', 'firma': 'La impresora'},
    H('fosforito', 'asombro', '¡He leído CA-mion delante de toda la clase! ¡Sonaba rarísimo!'),
    H('boli', 'seguro', 'Normal. Sin tilde, la palabra se lee según la regla. Y la regla no sabe que se dice ca-MION.'),
    H('goma', 'pista', 'Mira cómo se lee tal como está. Si suena raro, le falta la tilde. Si suena bien, ni la toques.'),
  ],
  'saludo': 'La tilde solo hace falta cuando la palabra **no suena como se lee**.',
  'observa': '¿Por qué «canción» lleva tilde y «canciones» no, si es la misma palabra?',
  'niveles': [
    {'modo': 'palabra', 'generar': {'f': 1}},
    {'modo': 'tilda', 'generar': {'f': 1}},
    {'modo': 'palabra', 'generar': {'f': 2, 'min': 2}},
    {'modo': 'tilda', 'generar': {'f': 2, 'min': 2}},
    {'modo': 'palabra', 'generar': {'f': 3, 'min': 3}},
    {'modo': 'tilda', 'errores': 3, 'generar': {'f': 2}},
    {'modo': 'tilda', 'generar': {'f': 3, 'min': 3}},
    {'modo': 'palabra', 'generar': {'f': 3, 'min': 2, 'n': 4}},
    {'modo': 'tilda', 'errores': 4, 'generar': {'f': 3, 'min': 2}},
  ],
  'palabras': [{'w': w, 'f': f} for f, ws in PALABRAS for w in ws.split()],
  'textos': TILDES,
}
os.makedirs(f'{BASE}/suena-raro', exist_ok=True)
with open(f'{BASE}/suena-raro/index.html', 'w') as f:
    f.write(PLANTILLA.format(titulo=cfg2['titulo'], desc='Una lupa enseña cómo se lee cada palabra tal como está escrita. Pon tilde solo donde suene raro. Acentuación para todo el curso.', config=json.dumps(cfg2, ensure_ascii=False, indent=2)))
ficha('suena-raro', 'Suena raro', 'juego', 'Tildes con una lupa que enseña cómo se lee cada palabra tal como está escrita: «camion» se lee CA-mion. Se pone tilde solo donde suena raro.', 2,
  'El juego no pide clasificar en agudas, llanas y esdrújulas: enseña para qué sirve la tilde. Al tocar una palabra, la lupa la parte en sílabas y marca cuál suena fuerte tal como está escrita. Sin tilde, «camion» se lee CA-mion y «arbol» se lee ar-BOL: por eso la necesitan. «Examen» ya se lee e-XA-men, así que la tilde sobra. Y en «pais», la tilde separa dos vocales que se leían pegadas.\n\nAlterna palabras sueltas con textos enteros sin tildes, y con textos donde unas sobran y otras faltan (exámen, fué, jóven). Se puede pedir que lean el texto como está escrito: cada palabra enseña su sílaba fuerte. Las tildes de «él», «más» o «qué» se dan puestas.', tema='lengua-acentuacion')
with open('/home/claude/cajon/src/content/temas/lengua-puntuacion.yml', 'w') as f:
    f.write('titulo: Puntuación\narea: lengua\nsubtitulo: El punto, la coma y el punto y aparte. Para todo el curso.\ncurso: 5.º, 2026-27\norden: 2\n')
print('ok', len(TEXTOS), 'textos de puntuación,', len(TILDES), 'de tildes y', len(cfg2['palabras']), 'palabras')
