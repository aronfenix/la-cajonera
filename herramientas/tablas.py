# Las tablas, a tiempo: juegos para automatizar los hechos multiplicativos (motor fichero).
# Uso: python3 herramientas/tablas.py   (desde la raíz del repo o desde herramientas/)
import json, os
AQUI = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(AQUI, 'juegos.py')).read().split("PERSONAJES =")[0])
BASE = os.path.join(AQUI, '..', 'public', 'juegos')

def escribe(slug, desc, cfg, quien='goma'):
    cfg = {"area": "matematicas", "escena": "cajon", "volver": "../../matematicas/", **cfg, 'personaje': quien}
    os.makedirs(f'{BASE}/{slug}', exist_ok=True)
    with open(f'{BASE}/{slug}/index.html', 'w') as f:
        f.write(PLANTILLA.format(titulo=cfg['titulo'], desc=desc, config=json.dumps(cfg, ensure_ascii=False, indent=2)))

NOTA = {"nota": "ESTE FICHERO ES TUYO. LO QUE FALLES HOY, MAÑANA VUELVE.", "firma": "El profe"}

escribe('el-fichero-de-goma', 'Automatizar las tablas contra el reloj: cada multiplicación es una ficha que avanza por un fichero de cuatro cajones si la recuerdas a tiempo y vuelve al primero si fallas.', {
  "motor": "fichero", "titulo": "El fichero de Goma",
  "subtitulo": "Cada multiplicación es una ficha. Si la recuerdas a tiempo, avanza un cajón. Si fallas, vuelve al 1 y sale más a menudo.",
  "portada": {"arte": "fichero", "rotulo": "TABLAS", "objetivo": "Recuerda cada multiplicación antes de que se acabe la tira. Las que fallas vuelven hasta que dejen de resistirse.", "frase": "Las tablas no se borran. Se entrenan."},
  "historia": [NOTA,
    {"quien": "goma", "pose": "seguro", "texto": "Esto es un fichero. Cada ficha es una multiplicación, y tiene cuatro cajones y un álbum."},
    {"quien": "goma", "pose": "pista", "texto": "Si la sabes a tiempo, la ficha avanza. Si no, vuelve al cajón 1, que sale todos los días."},
    {"quien": "goma", "pose": "celebra", "texto": "Cuando una ficha pasa el cajón 4, va al álbum. Y del álbum ya no la saca nadie."}],
  "saludo": "Cada ficha que aciertas a tiempo **avanza un cajón**.",
  "observa": "Si sabes 7 × 4, ¿cuánto te cuesta 7 × 8? ¿Y 7 × 9 si sabes 7 × 10?",
  "nivelObjetivo": 3,
  "maximo": 16,
  "niveles": [
    {"modo": "fichero", "generar": {"segundos": 10, "fichas": 8}},
    {"modo": "fichero", "generar": {"segundos": 8, "fichas": 10}},
    {"modo": "fichero", "generar": {"segundos": 6, "fichas": 10}},
    {"modo": "fichero", "generar": {"segundos": 5, "fichas": 10}},
    {"modo": "fichero", "generar": {"segundos": 4, "fichas": 12}},
    {"modo": "fichero", "generar": {"segundos": 3, "fichas": 12}}
  ]
}, 'goma')

escribe('el-minuto-de-boli', 'Contrarreloj de tablas: un minuto para acertar todas las multiplicaciones (o divisiones) que puedas y batir tu récord, que se guarda en la tablet.', {
  "motor": "fichero", "titulo": "El minuto de Boli",
  "subtitulo": "Un minuto. Todas las que puedas. Tres intentos para batir tu récord.",
  "portada": {"arte": "fichero", "rotulo": "1 MINUTO", "objetivo": "Un minuto para acertar todas las que puedas. Tu récord se queda guardado en esta tablet.", "frase": "Sesenta segundos. Ni uno más."},
  "historia": [
    {"nota": "SE CORRIGE EN UN MINUTO. EL RELOJ NO ESPERA A NADIE.", "firma": "Boli"},
    {"quien": "boli", "pose": "seguro", "texto": "Un minuto. Yo cronometro, tú contestas. Lo que falles, te lo apunto."},
    {"quien": "boli", "pose": "pista", "texto": "Las que se te atasquen se van al fichero de Goma, al cajón 1. Ella sabe qué hacer con ellas."}],
  "saludo": "El reloj arranca **con tu primera cifra**.",
  "observa": "¿Qué multiplicaciones te hacen perder más tiempo? ¿Qué truco te ahorraría segundos con ellas?",
  "textoFinal": "Tres minutos, tres intentos",
  "rondas": [{"modo": "minuto", "segundos": 60, "repetir": 3}]
}, 'boli')
print('tablas: 2 juegos escritos')
