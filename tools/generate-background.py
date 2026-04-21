#!/usr/bin/env python3
"""Generates a sample dojo background for assets/stages/dojo/background.png."""

from PIL import Image, ImageDraw, ImageFilter
import math, os

W, H = 800, 450

img = Image.new('RGB', (W, H), '#000')
d   = ImageDraw.Draw(img)

# ── Sky ──────────────────────────────────────────────────────────────────────
for y in range(H):
    t   = y / H
    r   = int(8  + t * 20)
    g   = int(5  + t * 8)
    b   = int(25 + t * 30)
    d.line([(0, y), (W, y)], fill=(r, g, b))

# ── Moon ─────────────────────────────────────────────────────────────────────
moon_x, moon_y = 640, 70
for r in range(45, 0, -1):
    alpha = int(255 * (r / 45) ** 0.4)
    glow  = int(40 + (r / 45) * 30)
    d.ellipse([moon_x-r, moon_y-r, moon_x+r, moon_y+r],
              fill=(glow + 180, glow + 170, glow + 100))
# Moon face crescent shadow
d.ellipse([moon_x+4, moon_y-28, moon_x+38, moon_y+28],
          fill=(18, 12, 40))

# ── Distant mountains ────────────────────────────────────────────────────────
def mountain(pts, col):
    d.polygon(pts, fill=col)

mountain([(0,280),(120,160),(200,220),(320,140),(420,200),
          (500,120),(600,180),(700,130),(800,200),(800,320),(0,320)],
         '#0d0820')
mountain([(0,310),(80,210),(160,250),(260,180),(380,230),
          (480,160),(580,210),(680,165),(780,220),(800,280),(800,330),(0,330)],
         '#140d2a')

# ── Back-wall columns ─────────────────────────────────────────────────────────
FLOOR_Y = 385
col_color   = '#1a1030'
col_shadow  = '#0d081e'
col_detail  = '#251845'

col_xs = [60, 180, 300, 500, 620, 740]
for cx in col_xs:
    cw = 28
    ch = FLOOR_Y - 160
    # Column shaft
    d.rectangle([cx - cw//2, 160, cx + cw//2, FLOOR_Y], fill=col_color)
    # Highlight edge
    d.line([(cx - cw//2 + 2, 162), (cx - cw//2 + 2, FLOOR_Y)], fill=col_detail, width=2)
    # Capital top
    d.rectangle([cx - cw//2 - 8, 154, cx + cw//2 + 8, 168], fill=col_detail)
    d.rectangle([cx - cw//2 - 4, 148, cx + cw//2 + 4, 156], fill=col_color)

# ── Back wall ─────────────────────────────────────────────────────────────────
for y in range(160, FLOOR_Y):
    t   = (y - 160) / (FLOOR_Y - 160)
    r   = int(14 + t * 6)
    g   = int(8  + t * 4)
    b   = int(35 + t * 10)
    d.line([(0, y), (W, y)], fill=(r, g, b))

# redraw columns on top of wall
for cx in col_xs:
    cw = 28
    d.rectangle([cx - cw//2, 160, cx + cw//2, FLOOR_Y], fill=col_color)
    d.line([(cx - cw//2 + 2, 162), (cx - cw//2 + 2, FLOOR_Y)], fill=col_detail, width=2)
    d.rectangle([cx - cw//2 - 8, 154, cx + cw//2 + 8, 168], fill=col_detail)
    d.rectangle([cx - cw//2 - 4, 148, cx + cw//2 + 4, 156], fill=col_color)

# ── Hanging lanterns ─────────────────────────────────────────────────────────
lantern_xs = [140, 400, 660]
for lx in lantern_xs:
    # Cord
    d.line([(lx, 155), (lx, 190)], fill='#302040', width=2)
    # Glow
    for r in range(28, 0, -2):
        brightness = int(60 * (r / 28) ** 1.5)
        d.ellipse([lx-r, 188-r//2, lx+r, 212+r//2],
                  fill=(brightness + 80, brightness + 30, brightness // 3))
    # Lantern body
    d.ellipse([lx-12, 190, lx+12, 215], fill=(220, 80, 30))
    d.ellipse([lx-8,  190, lx+8,  195], fill=(240, 140, 60))
    d.ellipse([lx-8,  210, lx+8,  215], fill=(180, 50, 15))
    # Tassels
    for tx in range(lx-8, lx+10, 5):
        d.line([(tx, 215), (tx, 224)], fill=(200, 60, 20), width=1)

# ── Floor ─────────────────────────────────────────────────────────────────────
for y in range(FLOOR_Y, H):
    t   = (y - FLOOR_Y) / (H - FLOOR_Y)
    r   = int(22 - t * 12)
    g   = int(14 - t * 8)
    b   = int(18 - t * 10)
    d.line([(0, y), (W, y)], fill=(r, g, b))

# Floor line
d.line([(0, FLOOR_Y), (W, FLOOR_Y)], fill='#4a3060', width=2)

# Floor tiles (perspective lines)
vp_x = W // 2  # vanishing point x
for tx in range(0, W + 80, 80):
    d.line([(tx, FLOOR_Y), (vp_x + (tx - vp_x) * 3, H + 200)],
           fill=(50, 30, 45, 80), width=1)
for ty in range(FLOOR_Y + 20, H, 25):
    d.line([(0, ty), (W, ty)], fill=(40, 25, 35), width=1)

# ── Subtle vignette ───────────────────────────────────────────────────────────
vignette = Image.new('RGBA', (W, H), (0, 0, 0, 0))
vd = ImageDraw.Draw(vignette)
for r in range(max(W, H) // 2, 0, -2):
    alpha = max(0, int(120 * (1 - r / (max(W, H) / 1.4))))
    vd.ellipse([W//2 - r, H//2 - r, W//2 + r, H//2 + r],
               outline=(0, 0, 0, alpha), width=2)
img = Image.alpha_composite(img.convert('RGBA'), vignette).convert('RGB')

# ── Save ──────────────────────────────────────────────────────────────────────
out = 'assets/stages/dojo/background.png'
os.makedirs(os.path.dirname(out), exist_ok=True)
img.save(out)
print(f'Saved {out}')
