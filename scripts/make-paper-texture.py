# Procedural, seamlessly tiling vintage paper grain for «نجوى الليل».
# FFT-filtered noise is periodic, so the tile repeats without seams.
import numpy as np
from PIL import Image
rng = np.random.default_rng(1447)
N = 640

def band(lo, hi, aniso=1.0):
    white = rng.standard_normal((N, N))
    f = np.fft.fft2(white)
    fy = np.fft.fftfreq(N)[:, None]
    fx = np.fft.fftfreq(N)[None, :]
    r = np.sqrt((fx * aniso) ** 2 + fy ** 2) + 1e-9
    mask = np.exp(-((np.log(r) - np.log((lo * hi) ** 0.5)) ** 2) / (2 * (np.log(hi / lo) / 2) ** 2))
    out = np.real(np.fft.ifft2(f * mask))
    return (out - out.mean()) / out.std()

mottle = band(0.002, 0.012)          # slow age mottling
cloud = band(0.01, 0.05)             # cloudy pulp
fibre = band(0.03, 0.25, aniso=6.0)  # long horizontal fibres
grain = band(0.25, 0.5)              # fine tooth

v = 0.55 * mottle + 0.35 * cloud + 0.30 * fibre + 0.22 * grain
# Darkening map in [0, 1]: 0 = untouched paper, 1 = deepest tone.
d = np.clip((v - v.min()) / (v.max() - v.min()), 0, 1)
d = d ** 1.6

# Sparse, soft foxing spots (age marks), tiled with wrap-around distance.
yy, xx = np.mgrid[0:N, 0:N]
fox = np.zeros((N, N))
for _ in range(7):
    cy, cx = rng.uniform(0, N, 2)
    rad = rng.uniform(6, 22)
    dy = np.minimum(abs(yy - cy), N - abs(yy - cy))
    dx = np.minimum(abs(xx - cx), N - abs(xx - cx))
    fox += rng.uniform(0.25, 0.6) * np.exp(-(dx ** 2 + dy ** 2) / (2 * rad ** 2))
fox = np.clip(fox, 0, 1)

# Multiply layer: white keeps the CSS ground; warm umber where the paper ages.
strength = 0.16 * d + 0.10 * fox
umber = np.array([0.55, 0.40, 0.22])     # warm aged-paper shift
rgb = 1 - strength[..., None] * (1 - umber)[None, None, :]
img = Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8), 'RGB')
img.save('__import__('os').path.join(__import__('os').path.dirname(__file__), '..', 'src/site/theme/textures/paper.jpg')', quality=82, optimize=True, progressive=True)
print(img.size, np.round(rgb.min(axis=(0, 1)), 3), np.round(rgb.mean(axis=(0, 1)), 3))
