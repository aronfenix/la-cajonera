# Encargo para Claude Code + Unreal Engine: «La maqueta» (panorámicas 360°)

Para Claude Code trabajando en el PC de Álvaro con Unreal Engine (servidor MCP del editor y plugin de Epic para Claude Code). Lee esto entero antes de abrir nada.

## Qué se pide
Cinco escenas pequeñas en Unreal, cada una renderizada como **una panorámica 360° fija**. No hay que hacer ningún juego en Unreal: ni mecánicas, ni personajes que se muevan, ni menús. Las panorámicas se usarán en la web «La cajonera» (https://lacajonera.es/), en un visor que hace otro Claude: el alumno mira alrededor arrastrando con el dedo y toca objetos de la escena.

Es para 5.º de Primaria, tema de Sociales «Un voto de confianza»: elecciones, reparto de competencias y división de poderes.

## Orden de trabajo y gasto
Unreal consume muchos créditos. Por eso:
1. Haz **solo la escena 1 (`plaza`)** completa y entrégala. Para ahí y avisa a Álvaro: hay que comprobar que las imágenes encajan en el visor antes de seguir.
2. Después, la escena 2 (`colegio-electoral`).
3. Las escenas 3, 4 y 5 solo si Álvaro lo confirma.

Geometría sencilla. No persigas el realismo: una escena buena con cajas, cilindros y planos bien iluminados vale más que una ambiciosa a medias. Si algo se atasca más de dos intentos, simplifícalo y apúntalo en el `leer-primero.md`.

## Dirección de arte: una maqueta de cartulina
Todo parece **una maqueta escolar hecha a mano**, puesta encima de la mesa del profe.
- Materiales mates de cartulina y cartón: sin brillos, con el canto del cartón visible, formas un poco imperfectas, trozos de celo y alguna pinza de la ropa.
- Paleta de la web: verde alfombrilla `#2e7d5b`, papel `#fffdf6`, amarillo `#ffc531`, cobalto `#2f5bd3`, fucsia `#e8417a`, cielo `#5ec3ff`, lima `#9bd84a`, naranja `#ff8a1f`, tinta `#1b1e3a` para rótulos y contornos.
- Las personas son **figuras planas de cartulina recortada**, de pie sobre una peana, sin rasgos realistas. No se representa a ninguna persona real.
- Luz cálida y suave, como un flexo. Sombras blandas.
- Fuera de la maqueta se puede intuir el aula a escala gigante (un lápiz enorme, unas tijeras, el borde de una alfombrilla de corte). Es opcional y nunca debe distraer.
- Rótulos en español, cortos, con la fuente Grandstander (Google Fonts, licencia OFL) o una redonda gruesa parecida. Usa exactamente los textos que se indican en cada escena.

## Neutralidad (obligatorio)
- Ningún partido, sigla, logotipo, color ni político real.
- Solo existen tres partidos inventados: **«Los del Parque»** (verde lima), **«Los del Aparcamiento»** (cobalto) y **«Los de la Pista»** (naranja). Si el repositorio `aronfenix/sociales-tema2` está a mano, usa los colores que tengan allí.
- Nada de datos ni fotos de alumnos.
- Solo recursos propios, primitivas o contenido gratuito de Epic. Nada con licencia dudosa.

## La cámara
- Una cámara fija por escena, **en el centro**, a la altura de los ojos de una figura de la maqueta.
- Lo importante se reparte por toda la vuelta, con los ángulos que se indican en cada escena, y entre 35° por encima y 35° por debajo del horizonte. Nada importante justo arriba ni justo abajo.
- Ningún objeto a menos de un metro (a escala de la maqueta) de la cámara: de cerca se deforma.

**Ángulos:** `yaw` 0° es el frente (eje +X de Unreal desde la cámara); positivo hacia la derecha (+Y). `pitch` positivo hacia arriba.

## Qué entregar por cada escena
Carpeta `Documentos\ChatGPT\Imágenes Cajón del profe\para-claude-maqueta\<escena>\` con:

1. **La panorámica**, en una de estas dos formas (la primera es la preferida):
   - `equirect.png`: equirrectangular de **8192×4096**. El centro de la imagen es `yaw` 0; hacia la derecha de la imagen, `yaw` positivo; arriba, el cielo.
   - o seis caras de cubo de **2048×2048**, con campo de visión de 90° y relación 1:1: `f.png` (yaw 0), `r.png` (yaw 90), `b.png` (yaw 180), `l.png` (yaw −90), `u.png` (pitch 90, con yaw 0) y `d.png` (pitch −90, con yaw 0).
2. **`puntos.json`**: los puntos tocables, calculados a partir de la posición real de cada objeto respecto a la cámara:
   ```json
   { "escena": "plaza", "puntos": [ { "id": "basura", "yaw": 31.5, "pitch": -6.2, "ancho": 14 } ] }
   ```
   Si al construir la escena algo acaba en otro ángulo distinto al de la tabla, no pasa nada: pon en el JSON el ángulo real.
   `yaw = atan2(dy, dx)` y `pitch = atan2(dz, hypot(dx, dy))`, en grados, con `d` = centro del objeto − posición de la cámara. `ancho` es el tamaño aparente en grados, aproximado. Los `id` son exactamente los de las listas de abajo.
3. **`vista.jpg`**: una reducción de la panorámica a 2048×1024 para revisarla de un vistazo.

Y en la carpeta raíz, un **`leer-primero.md`**: qué versión de Unreal se ha usado, cómo se ha renderizado, qué no se ha podido hacer y qué tiene que decidir Álvaro.

### Para que las caras casen
La misma exposición en todas las tomas: **exposición manual fija**, sin autoexposición. Sin viñeteado, sin grano, sin destellos de lente, sin desenfoque de movimiento ni profundidad de campo. Bloom mínimo o apagado. Evita los efectos en espacio de pantalla, que cambian de una cara a otra. Si usas Movie Render Queue con el pase panorámico, comprueba que no se ve la costura en `yaw` ±180°.

## Las escenas

### 1. `plaza` — ¿quién se encarga de cada cosa?
La plaza de un pueblo. Al frente, de fondo y más alto, el edificio del ayuntamiento con su reloj. Delante, doce cosas repartidas cada 30°:

| id | yaw | Qué se ve | Rótulo |
|---|---|---|---|
| `ayuntamiento` | 0 (pitch 14) | El edificio del ayuntamiento, con reloj y balcón | «AYUNTAMIENTO» |
| `fuente` | 0 (pitch −8) | Una fuente y una tapa de alcantarilla, delante del ayuntamiento | — |
| `basura` | 30 | Camión de la basura y contenedores | «LIMPIEZA» |
| `policia-municipal` | 60 | Coche de la policía municipal | «POLICÍA MUNICIPAL» |
| `biblioteca` | 90 | Biblioteca y polideportivo | «BIBLIOTECA MUNICIPAL» |
| `colegio` | 120 | Un colegio público con patio | «COLEGIO PÚBLICO» |
| `centro-salud` | 150 | Centro de salud con una ambulancia | «CENTRO DE SALUD» |
| `carretera` | 180 | Obras en una carretera que sale del pueblo | «M-501» |
| `feder` | −150 | Un parque nuevo con un cartel y la bandera de la UE | «PARQUE RENOVADO CON FONDOS EUROPEOS» |
| `dni` | −120 | Oficina con gente haciendo cola | «DNI Y PASAPORTE» |
| `correos` | −90 | Oficina de correos con un buzón amarillo | «CORREOS» |
| `euro` | −60 | Un quiosco con una moneda de euro gigante en el mostrador | «1 €» |
| `farola` | −30 | Farola, banco y una señal de tráfico | — |

### 2. `colegio-electoral` — el día de las elecciones
El gimnasio de un colegio preparado para votar.

| id | yaw | Qué se ve | Rótulo |
|---|---|---|---|
| `urna` | 0 | La urna transparente sobre la mesa, con sobres dentro | — |
| `mesa` | 25 | La mesa electoral: una presidenta y dos vocales, con la lista del censo | «MESA ELECTORAL» |
| `votante-10` | 70 | Figura de una niña con una chapa grande: «10» | — |
| `votante-17` | 82 | Figura de un chico con una chapa: «17» | — |
| `votante-18` | 94 | Figura de una chica con una chapa: «18» | — |
| `votante-45` | 106 | Figura de un señor con una chapa: «45» y el DNI en la mano | — |
| `votante-80` | 118 | Figura de una señora con una chapa: «80» | — |
| `cartel` | 150 | Un cartel grande en la pared | «ELECCIONES GENERALES · 29 DE NOVIEMBRE» |
| `papeletas` | −150 | Una mesa con tres montones de papeletas (una por partido inventado) y sobres | «PAPELETAS» |
| `cabina` | −100 | Una cabina con cortina | «CABINA» |
| `recuento` | −45 | Una pizarra con palotes en tres columnas, una por partido | «RECUENTO» |

### 3. `hemiciclo` — el poder legislativo
El Congreso de los Diputados, simplificado: escaños en semicírculo.

| id | yaw | Qué se ve | Rótulo |
|---|---|---|---|
| `tribuna` | 0 | La tribuna de oradores con un micrófono | — |
| `presidencia` | 0 (pitch 15) | La mesa de la presidencia, detrás y más alta | «PRESIDENCIA» |
| `ley` | 30 | Un atril con un papel | «PROYECTO DE LEY» |
| `panel` | 60 | Panel de votación con tres luces | «SÍ · NO · ABSTENCIÓN» |
| `escanos` | 180 | Los escaños, repartidos en tres bloques con los colores de los partidos inventados | «350 ESCAÑOS» |
| `publico` | −120 (pitch 20) | La tribuna del público | «PÚBLICO» |
| `puerta-senado` | −60 | Una puerta | «AL SENADO» |

### 4. `gobierno` — el poder ejecutivo
La sala del Consejo de Ministros: una mesa grande ovalada.

| id | yaw | Qué se ve | Rótulo |
|---|---|---|---|
| `presidente` | 0 | La silla principal de la mesa | «PRESIDENCIA DEL GOBIERNO» |
| `ministros` | 90 | Sillas con carteles de mesa | «EDUCACIÓN», «SANIDAD», «EXTERIORES», «HACIENDA» |
| `presupuesto` | 150 | Una hucha o maletín grande | «PRESUPUESTO» |
| `mapamundi` | −150 | Un mapamundi en la pared | — |
| `leyes` | −90 | Una bandeja con carpetas | «LEYES APROBADAS» |
| `corona` | −45 | Un cuadro con el dibujo de una corona, sin retrato | «JEFE DEL ESTADO» |

### 5. `tribunal` — el poder judicial
Una sala de juicios.

| id | yaw | Qué se ve | Rótulo |
|---|---|---|---|
| `estrado` | 0 | El estrado, con una figura con toga | «TRIBUNAL» |
| `balanza` | 40 | Una balanza grande | — |
| `constitucion` | 100 | Un libro enorme sobre un pedestal | «CONSTITUCIÓN» |
| `abogados` | 180 | Dos mesas enfrentadas, una figura en cada una | — |
| `codigos` | −110 | Una estantería de libros gordos | «LEYES» |
| `publico` | −50 | Bancos para el público | — |

## Cómo se usa después
Álvaro le pasa la carpeta al otro Claude, que la prepara con `herramientas/panorama.py prepara <equirect.png o carpeta de caras> <escena>.webp` y copia los ángulos de `puntos.json` en el juego «La maqueta». Ese juego ya funciona con panorámicas de prueba, así que las imágenes buenas solo tienen que encajar.

## Hecho cuando
- La panorámica de `plaza` se ve sin costuras ni saltos de luz entre caras.
- Cada `id` de la tabla aparece en `puntos.json` y su ángulo cae encima del objeto.
- Todos los rótulos se leen y están bien escritos, con sus tildes.
- No aparece nada de la lista de neutralidad.
- Existe el `leer-primero.md`.
