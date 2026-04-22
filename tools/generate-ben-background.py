#!/usr/bin/env python3
"""Generates a stylized background inspired by Ben's rose painting."""

from PIL import Image, ImageDraw, ImageFilter
import random, math, os

random.seed(42)
W, H = 800, 450

img = Image.new('RGB', (W, H), (240, 235, 228))
d   = ImageDraw.Draw(img)

# ── Off-white textured base ───────────────────────────────────────────────────
for _ in range(380):
    x1 = random.randint(0, W)
    x2 = x1 + random.randint(20, 160)
    y  = random.randint(0, H)
    g  = random.randint(195, 230)
    d.line([(x1, y), (min(x2, W), y)], fill=(g, g-3, g-8), width=random.randint(1, 3))

# ── Grey-blue wing shapes ─────────────────────────────────────────────────────
def wing(cx, cy, flip=False):
    pts = []
    sign = -1 if flip else 1
    # Large sweeping wing made of overlapping tapered polygons
    feathers = [
        # (tip_dx, tip_dy, base_w)
        (-sign*180, -70, 28),
        (-sign*140, -110, 22),
        (-sign*100, -120, 18),
        (-sign* 60, -105, 16),
        (-sign* 30,  -80, 14),
    ]
    for (tx, ty, bw) in feathers:
        col_v = random.randint(155, 185)
        col   = (col_v - 20, col_v - 10, col_v + 12)
        pts   = [
            (cx + tx, cy + ty),
            (cx - sign * bw // 2, cy + 10),
            (cx + sign * bw // 2, cy + 10),
        ]
        d.polygon(pts, fill=col, outline=(100, 110, 130))

wing(220, 230, flip=False)   # left wing
wing(580, 230, flip=True)    # right wing

# Add finer feather lines
for wx, wy, fl in [(220, 230, False), (580, 230, True)]:
    sign = -1 if fl else 1
    for i in range(12):
        angle = math.radians(140 + i * 8) * sign
        length = 80 + i * 8
        ex = wx + math.cos(angle) * length
        ey = wy - math.sin(angle) * abs(length * 0.6)
        lv = random.randint(130, 160)
        d.line([(wx, wy), (ex, ey)], fill=(lv-15, lv-8, lv+15), width=2)

# ── "BEN" text in rough ink style ────────────────────────────────────────────
def rough_rect(d, x, y, w, h, color=(20, 15, 18)):
    # Slightly irregular filled rectangle for blocky lettering
    for dy in range(h):
        jl = random.randint(-1, 1)
        jr = random.randint(-1, 1)
        d.line([(x + jl, y + dy), (x + w + jr, y + dy)], fill=color, width=1)

# B
bx, by = 272, 18
rough_rect(d, bx,    by,    10, 50)          # vertical
rough_rect(d, bx+10, by,    18,  8)          # top bar
rough_rect(d, bx+10, by+18, 16,  8)          # mid bar
rough_rect(d, bx+10, by+42, 18,  8)          # bot bar
rough_rect(d, bx+24, by+4,   8, 14)          # top bump
rough_rect(d, bx+24, by+26,  8, 16)          # bot bump

# E
ex2, ey = 320, 18
rough_rect(d, ex2,    ey,     8, 50)
rough_rect(d, ex2+8,  ey,    28,  8)
rough_rect(d, ex2+8,  ey+20, 22,  8)
rough_rect(d, ex2+8,  ey+42, 28,  8)

# N
nx, ny = 370, 18
rough_rect(d, nx,    ny,  10, 50)
rough_rect(d, nx+30, ny,  10, 50)
for i in range(32):
    dx2 = int(i * 30 / 32)
    dy2 = int(i * 50 / 32)
    d.line([(nx+10+dx2, ny+dy2), (nx+10+dx2+3, ny+dy2+3)], fill=(20,15,18), width=4)

# ── Rose stems ────────────────────────────────────────────────────────────────
STEM_GREEN  = (50, 120, 45)
STEM_DARK   = (30,  80, 30)
THORN_COL   = (40, 100, 38)

def stem_with_thorns(d, x, y_top, y_bot):
    d.line([(x, y_top), (x, y_bot)], fill=STEM_GREEN, width=5)
    d.line([(x+1, y_top), (x+1, y_bot)], fill=STEM_DARK, width=2)
    # thorns
    for ty in range(y_top + 20, y_bot, 22):
        side = 1 if random.random() > 0.5 else -1
        d.polygon([(x, ty), (x + side*14, ty - 6), (x + side*10, ty + 5)],
                  fill=THORN_COL)

# Center: tall stem, full bloom
stem_with_thorns(d, 400, 190, 385)

def rose_bloom(d, cx, cy, r=38):
    """Full dark-red poppy bloom."""
    # Outer petals
    for angle in range(0, 360, 45):
        a = math.radians(angle)
        px = cx + math.cos(a) * r * 0.8
        py = cy + math.sin(a) * r * 0.5
        w2 = r * 0.55
        h2 = r * 0.45
        col = random.choice([(120,15,20),(100,10,15),(140,20,25),(80,5,10)])
        d.ellipse([px-w2, py-h2, px+w2, py+h2], fill=col)
    # Inner petals
    for angle in range(22, 360, 60):
        a = math.radians(angle)
        px = cx + math.cos(a) * r * 0.45
        py = cy + math.sin(a) * r * 0.35
        col = random.choice([(150,20,25),(130,15,20)])
        d.ellipse([px-20, py-16, px+20, py+16], fill=col)
    # Dark centre
    d.ellipse([cx-14, cy-12, cx+14, cy+12], fill=(15, 5, 8))
    d.ellipse([cx-7,  cy-6,  cx+7,  cy+6],  fill=(30, 8, 10))

rose_bloom(d, 400, 185)

# Left: shorter stem, half-open bud with drips
stem_with_thorns(d, 255, 280, 385)

def bud_left(d, cx, cy):
    # White/cream base sepals
    d.ellipse([cx-18, cy-8, cx+18, cy+22], fill=(210, 195, 170))
    # Brown/rust top
    d.ellipse([cx-14, cy-18, cx+14, cy+6], fill=(110, 60, 25))
    # Red drip lines
    for dx2, length in [(-8, 22), (-2, 30), (5, 18), (11, 25)]:
        d.line([(cx+dx2, cy+20), (cx+dx2+random.randint(-2,2), cy+20+length)],
               fill=(160, 15, 20), width=2)
        # drip bead
        dbx = cx + dx2 + random.randint(-1, 1)
        dby = cy + 20 + length
        d.ellipse([dbx-3, dby-3, dbx+3, dby+3], fill=(140, 10, 15))

bud_left(d, 255, 300)

# Right: shorter stem, green/yellow bud with red drips
stem_with_thorns(d, 545, 270, 385)

def bud_right(d, cx, cy):
    # Green-yellow base
    d.ellipse([cx-16, cy-6, cx+16, cy+24], fill=(120, 140, 35))
    d.ellipse([cx-12, cy-16, cx+12, cy+8], fill=(90, 115, 25))
    # Red streak lines across
    for dy2, dx2 in [(-10, 0), (-4, 5), (2, -3), (8, 4)]:
        x1 = cx - 12
        x2 = cx + 12
        d.line([(x1, cy+dy2), (x2+dx2, cy+dy2+2)], fill=(180, 20, 20), width=2)
    # Drips below
    for dx2, length in [(-6, 20), (0, 28), (7, 16)]:
        d.line([(cx+dx2, cy+22), (cx+dx2, cy+22+length)],
               fill=(160, 15, 20), width=2)
        dbx, dby = cx+dx2, cy+22+length
        d.ellipse([dbx-3, dby-2, dbx+3, dby+5], fill=(140, 10, 15))

bud_right(d, 545, 285)

# ── Dark torn-paper border ────────────────────────────────────────────────────
border_col = (28, 22, 30)
margin = 12
# Top / bottom / left / right rough borders
for _ in range(200):
    x1 = random.randint(0, W)
    thick = random.randint(3, 14)
    side = random.choice(['top','bot','left','right'])
    if side == 'top':
        y1 = random.randint(0, margin)
        d.rectangle([x1, y1, x1+random.randint(8,40), y1+thick], fill=border_col)
    elif side == 'bot':
        y1 = H - random.randint(0, margin)
        d.rectangle([x1, y1-thick, x1+random.randint(8,40), y1], fill=border_col)
    elif side == 'left':
        y1 = random.randint(0, H)
        d.rectangle([0, y1, random.randint(3,margin), y1+random.randint(8,40)], fill=border_col)
    else:
        y1 = random.randint(0, H)
        d.rectangle([W-random.randint(3,margin), y1, W, y1+random.randint(8,40)], fill=border_col)

# Solid thin frame
d.rectangle([0, 0, W-1, H-1], outline=border_col, width=3)

# ── Subtle vignette ───────────────────────────────────────────────────────────
vig = Image.new('RGBA', (W, H), (0, 0, 0, 0))
vd  = ImageDraw.Draw(vig)
for r in range(max(W, H) // 2, 0, -3):
    alpha = max(0, int(90 * (1 - r / (max(W, H) / 1.3))))
    vd.ellipse([W//2-r, H//2-r, W//2+r, H//2+r], outline=(0,0,0,alpha), width=3)
img = Image.alpha_composite(img.convert('RGBA'), vig).convert('RGB')

out = 'assets/stages/dojo/background.png'
os.makedirs(os.path.dirname(out), exist_ok=True)
img.save(out)
print(f'Saved {out}')
