# Genera «La noche del escrutinio» (Sociales, tema 2, «El cajón vota») con el motor «escrutinio», y su ficha del catálogo.
# Uso: python3 sociales_escrutinio.py
# La portada del catálogo (/src/media/portadas/la-noche-del-escrutinio.jpg) se añade a la ficha solo si existe la imagen.
import json, os
BASE = '/home/claude/cajon/public/juegos'
FICHAS = '/home/claude/cajon/src/content/materiales'
PORTADAS = '/home/claude/cajon/src/media/portadas'
SLUG = 'la-noche-del-escrutinio'
FECHA = '2026-11-20'
PLANTILLA = open(__file__.replace('sociales_escrutinio.py', 'juegos.py')).read().split("PLANTILLA = '''")[1].split("'''")[0]
H = lambda quien, pose, texto: {'quien': quien, 'pose': pose, 'texto': texto}

cfg = {
  'motor': 'escrutinio', 'area': 'sociales', 'escena': 'colegio-electoral', 'personaje': 'boli',
  'volver': '../el-cajon-vota/',
  'titulo': 'La noche del escrutinio',
  'subtitulo': 'Domingo 29 de noviembre. Te ha tocado presidir una mesa electoral. A las ocho se abre la urna.',
  'portada': {'objetivo': 'Decide quién puede votar, abre la urna, clasifica cada sobre y descubre si un solo voto puede mover un escaño.', 'frase': 'Aquí se cuenta todo. Hasta lo vacío.'},
  'historia': [
    {'nota': 'EL DOMINGO EL COLE ES COLEGIO ELECTORAL. LA URNA NO SE TOCA.', 'firma': 'El profe'},
    H('boli', 'seguro', 'Me han nombrado interventor. Vigilo que se cuente bien. Con tinta roja.'),
    H('goma', 'pista', 'Y a ti te ha tocado presidir la mesa. Es por sorteo, y no se puede decir que no.'),
    H('fosforito', 'celebra', '¡A las ocho se abre la urna! ¡Todo es importante, hasta los sobres vacíos!'),
  ],
  'saludo': 'Un sobre vacío **no** es un voto nulo. Lo digo una vez.',
  'observa': 'Si el voto en blanco no es para ningún partido, ¿para qué sirve? ¿Es lo mismo votar en blanco que quedarse en casa?',
  'niveles': [
    {'modo': 'cola', 'generar': {'f': 1, 'n': 3}},
    {'modo': 'sobres', 'generar': {'f': 1, 'n': 5}},
    {'modo': 'cola', 'generar': {'f': 2, 'n': 4}},
    {'modo': 'sobres', 'generar': {'f': 2, 'n': 6}},
    {'modo': 'acta', 'generar': {'f': 3, 'n': 5}},
    {'modo': 'provincia', 'generar': {'escanos': [3, 4], 'margenes': [1], 'dudosos': 3}},
    {'modo': 'provincia', 'generar': {'escanos': [4, 5], 'margenes': [1, 2], 'dudosos': 4}},
  ],
}
DESC = 'Presides una mesa electoral el 29-N: quién puede votar, cómo se clasifica cada sobre (blanco, nulo, dos papeletas…) y cómo un solo voto mueve un escaño.'
RESUMEN = 'Presides una mesa electoral: decides quién puede votar, abres la urna y clasificas cada sobre. Al final, tu mesa se suma a la provincia y un voto mal contado puede mover un escaño.'
CUERPO = ('Por la mañana llega la cola: alguien con 17 años, una vecina francesa, uno sin DNI que «es muy conocido en el barrio», otro que viene a votar por su padre. '
  'A las ocho se abre la urna y cada sobre va a su montón del acta: el sobre vacío es voto en blanco, dos papeletas iguales son un voto, dos distintas o una papeleta pintada (o con una loncha de chorizo) son nulo. '
  'Boli hace de interventor y protesta cuando algo se cuenta mal. En los niveles altos hay que cuadrar el acta y, al final, decidir unos sobres protestados de los que depende el último escaño de la provincia.')

os.makedirs(f'{BASE}/{SLUG}', exist_ok=True)
with open(f'{BASE}/{SLUG}/index.html', 'w') as f:
    f.write(PLANTILLA.format(titulo=cfg['titulo'], desc=DESC, config=json.dumps(cfg, ensure_ascii=False, indent=2)))
q = lambda t: json.dumps(t, ensure_ascii=False)
portada = f'portada: /src/media/portadas/{SLUG}.jpg\n' if os.path.exists(f'{PORTADAS}/{SLUG}.jpg') else ''
with open(f'{FICHAS}/{SLUG}.md', 'w') as f:
    f.write(f'---\ntitulo: {q(cfg["titulo"])}\ntema: sociales-tema-2\ntipo: juego\nresumen: {q(RESUMEN)}\nfecha: {FECHA}\n{portada}enlace: /juegos/{SLUG}/\norden: 3\n---\n\n{CUERPO}\n')
print('escrito', SLUG)
