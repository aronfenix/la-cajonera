# Panorámicas 360° para el motor «visita»: una imagen equirrectangular 4096×2048 en .webp por escena.
#   python3 panorama.py prepara <equirect.png | carpeta con f,r,b,l,u,d.png> <destino.webp>
#   python3 panorama.py boceto <destino.webp> <puntos.json>      → panorámica de prueba con los puntos rotulados
# Ángulos: yaw 0 = frente, positivo a la derecha; pitch positivo hacia arriba. Centro de la imagen = yaw 0.
import sys, os, json, numpy as np
from PIL import Image, ImageDraw, ImageFont
W, H = 4096, 2048
def de_cubo(src):
    C = {k: np.asarray(Image.open(f'{src}/{k}.png').convert('RGB')) for k in 'frblud'}; S = C['f'].shape[0]
    lon = ((np.arange(W) + .5) / W - .5) * 2 * np.pi; lat = (.5 - (np.arange(H) + .5) / H) * np.pi
    lon, lat = np.meshgrid(lon, lat)
    x, y, z = np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)   # derecha, arriba, frente
    out = np.zeros((H, W, 3), np.uint8); ax, ay, az = abs(x), abs(y), abs(z)
    # cara: (máscara, coordenada horizontal en pantalla, vertical hacia arriba, eje)
    caras = {'f': (az >= ax) & (az >= ay) & (z > 0), 'b': (az >= ax) & (az >= ay) & (z <= 0), 'r': (ax > az) & (ax >= ay) & (x > 0),
             'l': (ax > az) & (ax >= ay) & (x <= 0), 'u': (ay > ax) & (ay > az) & (y > 0), 'd': (ay > ax) & (ay > az) & (y <= 0)}
    uv = {'f': (x / az, y / az), 'b': (-x / az, y / az), 'r': (-z / ax, y / ax), 'l': (z / ax, y / ax), 'u': (x / ay, -z / ay), 'd': (x / ay, z / ay)}
    for k, m in caras.items():
        a, b = uv[k]; i = np.clip(((1 - b[m]) / 2 * S).astype(int), 0, S - 1); j = np.clip(((a[m] + 1) / 2 * S).astype(int), 0, S - 1)
        out[m] = C[k][i, j]
    return Image.fromarray(out)
def prepara(src, dest):
    im = de_cubo(src) if os.path.isdir(src) else Image.open(src).convert('RGB').resize((W, H), Image.LANCZOS)
    os.makedirs(os.path.dirname(dest) or '.', exist_ok=True); im.save(dest, quality=80, method=6)
def boceto(dest, puntos):
    im = Image.new('RGB', (W, H)); d = ImageDraw.Draw(im)
    for y in range(H): d.line([(0, y), (W, y)], fill=(223 - y // 30, 244 - y // 40, 255) if y < H // 2 else (232 - (y - H // 2) // 12, 199 - (y - H // 2) // 14, 154 - (y - H // 2) // 16))
    try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 44); g = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
    except Exception: f = g = ImageFont.load_default()
    for yaw in range(-180, 180, 30):
        x = int((yaw / 360 + .5) * W); d.line([(x, H // 2 - 300), (x, H // 2 + 300)], fill=(60, 64, 90), width=2); d.text((x + 8, H // 2 + 250), f'{yaw}°', font=g, fill=(60, 64, 90))
    d.line([(0, H // 2), (W, H // 2)], fill=(60, 64, 90), width=6)
    cols = [(255, 197, 49), (232, 65, 122), (94, 195, 255), (155, 216, 74), (255, 138, 31), (47, 91, 211)]
    for i, p in enumerate(puntos):
        x, y = (p['yaw'] / 360 + .5) * W, (.5 - p['pitch'] / 180) * H
        d.rounded_rectangle([x - 110, y - 140, x + 110, y + 60], radius=18, fill=cols[i % 6], outline=(60, 64, 90), width=6)
        d.text((x, y - 100), p['id'], font=g, fill=(27, 30, 58), anchor='mm')
    for x in range(200, W, 1024): d.text((x, 420), 'BOCETO', font=f, fill=(60, 64, 90)); d.text((x, 1700), 'BOCETO', font=f, fill=(60, 64, 90))
    os.makedirs(os.path.dirname(dest), exist_ok=True); im.save(dest, quality=80, method=6)
if __name__ == '__main__':
    if sys.argv[1] == 'prepara': prepara(sys.argv[2], sys.argv[3])
    else: boceto(sys.argv[2], json.load(open(sys.argv[3]))['puntos'])
    print('ok', sys.argv[2 if sys.argv[1] == 'boceto' else 3])
