#!/usr/bin/env python3
"""Generate Tarikh icons, blog thumbnails and responsive image derivatives.

No build system: run this only when the source assets change.

    python deploy/build-assets.py icons    # favicons + PWA icons (repo root)
    python deploy/build-assets.py thumbs   # blog card thumbnails
    python deploy/build-assets.py hero     # responsive hero image derivatives
    python deploy/build-assets.py all

Icons are drawn from the same geometry as assets/logo/logo.svg so the raster and
vector marks stay identical. Everything is rendered at 4x and downsampled with
LANCZOS.
"""
import pathlib
import shutil
import sys

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
SS = 4                     # supersample factor
BRAND = (1, 88, 255, 255)  # #0158FF
WHITE = (255, 255, 255, 255)


# --------------------------------------------------------------------------- #
# Logo geometry (viewBox 0 0 32 32, stroke width 2, round caps)
# --------------------------------------------------------------------------- #
def _stroke(draw, p1, p2, u, w, color):
    x1, y1 = p1[0] * u, p1[1] * u
    x2, y2 = p2[0] * u, p2[1] * u
    draw.line([x1, y1, x2, y2], fill=color, width=w)
    r = w / 2
    for x, y in ((x1, y1), (x2, y2)):
        draw.ellipse([x - r, y - r, x + r, y + r], fill=color)


def _glyph(draw, size, inset, color=WHITE):
    """Draw the scales mark inside a `size` box, scaled to leave `inset` fraction."""
    u = (size / 32) * (1 - 2 * inset)
    off = size * inset
    w = max(1, int(round(2 * u)))

    def T(x, y):
        return (off + x * u, off + y * u)

    _stroke(draw, T(16, 6.5), T(16, 21.5), 1, w, color)          # beam post
    _stroke(draw, T(6.5, 9.5), T(25.5, 9.5), 1, w, color)        # beam
    _stroke(draw, T(6.5, 9.5), T(4, 16.5), 1, w, color)          # left chain
    _stroke(draw, T(25.5, 9.5), T(28, 16.5), 1, w, color)        # right chain
    _stroke(draw, T(7.5, 21.5), T(24.5, 21.5), 1, w, color)      # base bar
    # pans: half-ellipses under each chain end
    for cx in (4.0, 28.0):
        x0, y0 = T(cx - 2, 14.9)
        x1, y1 = T(cx + 2, 18.1)
        draw.arc([x0, y0, x1, y1], start=0, end=180, fill=color, width=w)


def icon(size, *, rounded=True, inset=0.0, radius=8):
    """Render the app mark at `size` px."""
    S = size * SS
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        r = max(0, int(round(radius / 32 * S)))
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=r, fill=BRAND)
    else:
        d.rectangle([0, 0, S, S], fill=BRAND)
    _glyph(d, S, inset)
    return img.resize((size, size), Image.LANCZOS)


def flat(size, bg):
    img = Image.new('RGBA', (size, size), bg)
    return img


def build_icons():
    out = ROOT
    specs = [
        ('favicon-48.png', icon(48)),
        ('icon-192.png', icon(192)),
        ('icon-512.png', icon(512)),
        ('apple-touch-icon.png', icon(180, rounded=False, inset=0.14)),
        ('icon-192-maskable.png', icon(192, rounded=False, inset=0.20)),
        ('icon-512-maskable.png', icon(512, rounded=False, inset=0.20)),
    ]
    for name, im in specs:
        im.save(out / name, 'PNG', optimize=True)
        print('wrote', name, im.size)

    # Multi-resolution ICO built from one 96px master so every size is crisp.
    master = icon(96)
    ico_path = out / 'favicon.ico'
    master.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    with Image.open(ico_path) as ico:
        print('wrote favicon.ico sizes=', sorted(ico.info.get('sizes', [])))

    # assets/logo/logo.svg is the single vector source; /favicon.svg is the served copy.
    shutil.copyfile(ROOT / 'assets' / 'logo' / 'logo.svg', ROOT / 'favicon.svg')
    print('wrote favicon.svg')


# --------------------------------------------------------------------------- #
# Blog thumbnails — one distinct motif per post
# --------------------------------------------------------------------------- #
NAVY = (2, 13, 36, 255)
THUMB_W, THUMB_H = 800, 500


def _thumb_base(accent):
    """Opaque vertical navy gradient with a translucent accent glow.

    Translucent shapes are drawn on their own layer and composited, because
    ImageDraw writes the alpha channel instead of blending it.
    """
    img = Image.new('RGBA', (THUMB_W, THUMB_H), NAVY)
    d = ImageDraw.Draw(img)
    for y in range(THUMB_H):
        t = y / THUMB_H
        r = int(2 + (3 - 2) * t)
        g = int(13 + (24 - 13) * t)
        b = int(36 + (68 - 36) * t)
        d.line([(0, y), (THUMB_W, y)], fill=(r, g, b, 255))

    glow = Image.new('RGBA', (THUMB_W, THUMB_H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-220, THUMB_H - 300, 380, THUMB_H + 260], outline=accent + (46,), width=90)
    gd.ellipse([-140, THUMB_H - 230, 300, THUMB_H + 190], outline=accent + (34,), width=60)
    return Image.alpha_composite(img, glow)


def _thumb_finish(base, fn):
    """Draw the motif on a transparent overlay and composite it onto the base."""
    overlay = Image.new('RGBA', base.size, (0, 0, 0, 0))
    fn(ImageDraw.Draw(overlay))
    return Image.alpha_composite(base, overlay)


def _card(d, x, y, w, h, fill=(255, 255, 255, 16), outline=(255, 255, 255, 46)):
    d.rounded_rectangle([x, y, x + w, y + h], radius=14, fill=fill, outline=outline, width=2)


def _lines(d, x, y, widths, gap=18, color=(255, 255, 255, 70), h=9):
    for i, w in enumerate(widths):
        d.rounded_rectangle([x, y + i * gap, x + w, y + i * gap + h], radius=h // 2, fill=color)


def _hierarchy(d):
    tiers = [(210, 110), (140, 200), (70, 290)]
    for i, (inset, y) in enumerate(tiers):
        w = 380 - i * 0  # tiered widths
        w = 380 - i * 70
        x = 210 + i * 35
        _card(d, x, y, w, 56)
        _lines(d, x + 18, y + 20, [90 + i * 10], gap=0, color=(255, 255, 255, 90))
    for i in range(2):
        x0, y0 = 400, tiers[i][1] + 56
        d.line([(x0, y0), (x0, tiers[i + 1][1])], fill=(128, 168, 255, 150), width=3)
    _lines(d, 230, 378, [150, 210], gap=22, color=(255, 255, 255, 40))


def _calendar(d):
    _card(d, 250, 96, 300, 300)
    _lines(d, 276, 124, [120], gap=0, color=(255, 255, 255, 120), h=12)
    for row in range(4):
        for col in range(5):
            cx = 288 + col * 52
            cy = 176 + row * 52
            on = (row * 5 + col) in (3, 7, 12, 18)
            d.rounded_rectangle([cx, cy, cx + 34, cy + 34], radius=8,
                                fill=(1, 88, 255, 210) if on else (255, 255, 255, 26))
    d.ellipse([520, 300, 566, 346], fill=(128, 168, 255, 220))
    d.line([(543, 312), (543, 334)], fill=NAVY, width=6)
    d.line([(543, 334), (556, 334)], fill=NAVY, width=6)


def _list_window(d):
    _card(d, 120, 96, 560, 300)
    d.line([(120, 148), (680, 148)], fill=(255, 255, 255, 46), width=2)
    d.ellipse([144, 116, 162, 134], fill=(1, 88, 255, 220))
    for i in range(4):
        y = 176 + i * 54
        d.rounded_rectangle([148, y, 172, y + 26], radius=7, fill=(255, 255, 255, 30))
        _lines(d, 190, y + 8, [180 + (i % 2) * 60], gap=0, color=(255, 255, 255, 74), h=10)
        d.rounded_rectangle([580, y + 4, 646, y + 22], radius=9, fill=(128, 168, 255, 120))


def _grid_vs_bars(d):
    _card(d, 100, 96, 260, 300)
    for row in range(4):
        for col in range(3):
            x = 120 + col * 78
            y = 132 + row * 66
            d.rounded_rectangle([x, y, x + 66, y + 50], radius=8,
                                fill=(255, 255, 255, 22), outline=(255, 255, 255, 46), width=2)
    _card(d, 440, 96, 260, 300)
    heights = [70, 120, 96, 168]
    for i, h in enumerate(heights):
        x = 470 + i * 58
        d.rounded_rectangle([x, 340 - h, x + 36, 340], radius=8, fill=(1, 88, 255, 220))
    d.line([(452, 348), (688, 348)], fill=(255, 255, 255, 60), width=2)


def _invoice(d):
    _card(d, 200, 76, 400, 348)
    _lines(d, 232, 112, [140], gap=0, color=(255, 255, 255, 150), h=14)
    for i in range(5):
        y = 164 + i * 46
        _lines(d, 232, y, [120 + (i % 3) * 40], gap=0, color=(255, 255, 255, 54), h=10)
        _lines(d, 508, y, [64], gap=0, color=(128, 168, 255, 130), h=10)
    d.line([(232, 386), (568, 386)], fill=(255, 255, 255, 60), width=2)
    _lines(d, 232, 400, [90], gap=0, color=(1, 88, 255, 255), h=12)
    d.rounded_rectangle([462, 384, 568, 414], radius=10, fill=(1, 88, 255, 220))


def _documents(d):
    for i, (x, y) in enumerate([(240, 96), (216, 140), (192, 184)]):
        _card(d, x, y, 360, 260, fill=(255, 255, 255, 10 + i * 6))
    for i in range(4):
        _lines(d, 236, 232 + i * 34, [200 - i * 30], gap=0, color=(255, 255, 255, 56), h=10)
    d.rounded_rectangle([500, 300, 560, 360], radius=12, fill=(1, 88, 255, 220))
    d.line([(516, 330), (530, 344)], fill=WHITE, width=7)
    d.line([(530, 344), (546, 320)], fill=WHITE, width=7)


THUMBS = {
    'nepal-court-hierarchy': (_hierarchy, (128, 168, 255)),
    'peshi-tarikh-date-tracking': (_calendar, (128, 168, 255)),
    'case-management-software-nepal': (_list_window, (128, 168, 255)),
    'law-erp-vs-spreadsheets': (_grid_vs_bars, (128, 168, 255)),
    'law-firm-billing-nepal': (_invoice, (128, 168, 255)),
    'document-management-law-firms-nepal': (_documents, (128, 168, 255)),
}


def build_thumbs():
    dest = ROOT / 'assets' / 'images' / 'blog'
    dest.mkdir(parents=True, exist_ok=True)
    for slug, (fn, accent) in THUMBS.items():
        img = _thumb_finish(_thumb_base(accent), fn)
        out = dest / f'{slug}.webp'
        img.convert('RGB').save(out, 'WEBP', quality=82, method=6)
        print('wrote', out.relative_to(ROOT).as_posix(),
              f'{out.stat().st_size // 1024} KB')


# --------------------------------------------------------------------------- #
# Hero derivatives
# --------------------------------------------------------------------------- #
HERO_SOURCE = ROOT / 'assets' / 'images' / 'tarikh-law-erp-dashboard.png'
HERO_NAME = 'tarikh-law-erp-dashboard'
HERO_WIDTHS = (640, 960, 1536)
HERO_ASPECT = 1536 / 1024


def build_hero():
    if not HERO_SOURCE.exists():
        print('hero source missing:', HERO_SOURCE)
        return
    src = Image.open(HERO_SOURCE).convert('RGB')
    dest = HERO_SOURCE.parent

    for w in HERO_WIDTHS:
        h = round(w / HERO_ASPECT)
        resized = src.resize((w, h), Image.LANCZOS)
        webp = dest / f'{HERO_NAME}-{w}.webp'
        resized.save(webp, 'WEBP', quality=76, method=6)
        print('wrote', webp.name, f'{webp.stat().st_size // 1024} KB')

    # PNG fallback for the <img src>, kept under the 300 KB budget.
    fallback = dest / f'{HERO_NAME}-960.png'
    src.resize((960, round(960 / HERO_ASPECT)), Image.LANCZOS).save(
        fallback, 'PNG', optimize=True, bits=8)
    png_kb = fallback.stat().st_size // 1024
    print('wrote', fallback.name, f'{png_kb} KB')

    if png_kb >= 300:
        # Quantise harder until the fallback fits the budget.
        for colors in (128, 96, 64):
            im = src.resize((960, round(960 / HERO_ASPECT)), Image.LANCZOS)
            im.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG).save(
                fallback, 'PNG', optimize=True)
            png_kb = fallback.stat().st_size // 1024
            print(f'  requantised to {colors} colours -> {png_kb} KB')
            if png_kb < 300:
                break


def build_avif_cli():
    """AVIF is produced with sharp (libvips), see deploy/build-avif.mjs."""
    print('AVIF: run `node deploy/build-avif.mjs` (uses sharp)')


def main():
    if hasattr(Image, 'Resampling'):
        pass
    which = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if which in ('icons', 'all'):
        build_icons()
    if which in ('thumbs', 'all'):
        build_thumbs()
    if which in ('hero', 'all'):
        build_hero()


if __name__ == '__main__':
    main()
