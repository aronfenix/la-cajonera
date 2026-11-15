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
  # ---- f4: dos párrafos
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
    {'modo': 'sentido', 'generar': {'ids': ['comer', 'pintar']}},
    {'modo': 'puntua', 'signos': ['.'], 'generar': {'f': 2, 'min': 2}},
    {'modo': 'puntua', 'signos': [','], 'generar': {'f': 3}},
    {'modo': 'corrige', 'errores': 2, 'generar': {'f': 2}},
    {'modo': 'sentido', 'generar': {'ids': ['hambre', 'lucia']}},
    {'modo': 'puntua', 'signos': [',', '.'], 'generar': {'f': 3, 'min': 2}},
    {'modo': 'corrige', 'errores': 3, 'generar': {'f': 3, 'min': 2}},
    {'modo': 'sentido', 'generar': {'ids': ['paraguas']}},
    {'modo': 'puntua', 'signos': [',', '.', '¶'], 'generar': {'f': 4, 'min': 4}},
  ],
  'textos': TEXTOS,
}
os.makedirs(f'{BASE}/sin-aliento', exist_ok=True)
with open(f'{BASE}/sin-aliento/index.html', 'w') as f:
    f.write(PLANTILLA.format(titulo=cfg['titulo'], desc='Pon los puntos y las comas que le faltan a cada texto y escucha cómo queda leído con tus pausas. Puntuación para todo el curso.', config=json.dumps(cfg, ensure_ascii=False, indent=2)))
ficha('sin-aliento', 'Sin aliento', 'juego', 'Textos sin puntos ni comas: se ponen con un sello y Fosforito los lee con esas pausas. Si faltan puntos, se queda sin aire. También, frases que cambian de significado con una coma.', 1,
  'Tres mecánicas que se van alternando. En la primera llega un texto sin puntuar: se elige un sello (coma, punto, punto y aparte) y se toca la palabra que lleva el signo detrás. Antes de comprobar se puede pedir que lo lean: Fosforito subraya palabra a palabra, respira en cada pausa y se ahoga donde faltan. Si la tablet trae voz en español, además se oye. En la segunda, el texto llega puntuado con errores (una coma entre el sujeto y el verbo, una coma donde iba punto…) y hay que arreglarlos. En la tercera, una frase como «Vamos a comer niños» y una viñeta que dibuja lo que dice según dónde esté la coma.\n\nLa corrección no dice «mal»: explica el error con las palabras del texto («entre *patio* y *tiene* no va coma: no se separa a quien hace algo de lo que hace»). Hay veinte textos, de tres oraciones a dos párrafos: escenas de clase, Robinson Crusoe, el Lazarillo y contenidos de Ciencias.')
ficha('puntua-tu-texto', 'Puntúa tu texto', 'herramienta', 'Pegas cualquier texto bien puntuado y sale un juego como «Sin aliento» con ese texto: el capítulo de la tertulia, un párrafo de Ciencias, una redacción.', 2,
  'Se pega el texto, se elige qué signos se quitan (solo los puntos; puntos y comas; o también el punto y aparte) y la página da un enlace. Ese enlace abre el juego con el texto ya troceado en retos de pocas oraciones. El texto viaja dentro del propio enlace: no se guarda en ningún sitio ni se envía a nadie.\n\nLos puntos se corrigen tal como están en el original. Con las comas pasa lo mismo, así que conviene revisar antes que el texto no tenga comas discutibles.')
with open('/home/claude/cajon/src/content/temas/lengua-puntuacion.yml', 'w') as f:
    f.write('titulo: Puntuación\narea: lengua\nsubtitulo: El punto, la coma y el punto y aparte. Para todo el curso.\ncurso: 5.º, 2026-27\norden: 2\n')
print('ok', len(TEXTOS), 'textos')
