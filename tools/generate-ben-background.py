#!/usr/bin/env python3
"""
Generates a background closely inspired by Ben's rose painting:
cream paper, grey wing brushstrokes, three thorny rose stems,
hand-lettered BEN text, dark irregular border.

NOTE: You can replace assets/stages/dojo/background.png with a photo of
Ben's actual painting — Stage.js will use any PNG placed there directly.
"""

from PIL import Image, ImageDraw, ImageFilter
import random, math, os

random.seed(7)
W, H = 800, 450

img = Image.new('RGB', (W, H), (238, 232, 220))
d   = ImageDraw.Draw(img)

# ── Cream/paper textured base ─────────────────────────────────────────────────
for _ in range(500):
    x1 = random.randint(0, W)
    x2 = x1 + random.randint(30, 200)
    y  = random.randint(0, H)
    v  = random.randint(198, 230)
    d.line([(x1, y), (min(x2, W), y)], fill=(v, v-4, v-10), width=random.randint(1, 4))

# Some vertical texture
for _ in range(80):
    x = random.randint(0, W)
    y1 = random.randint(0, H)
    y2 = y1 + random.randint(10, 60)
    v  = random.randint(200, 225)
    d.line([(x, y1), (x, min(y2, H))], fill=(v, v-3, v-8), width=1)

# ── Grey-blue ink wing shapes ─────────────────────────────────────────────────
def draw_wing(cx, cy, flip):
    s = -1 if flip else 1
    # Multiple overlapping ink-stroke polygons to mimic watercolour feathers
    layers = [
        # (relative tip, width at base) — all from (cx, cy)
        [(-s*160, -55), (-s*130, -95), (-s*90, -105), (-s*50, -90), (-s*20, -60)],
        [(-s*140, -40), (-s*120, -80), (-s*80,  -88), (-s*40, -72), (-s*10, -45)],
        [(-s*110, -20), (-s*95,  -55), (-s*65,  -65), (-s*30, -52), (-s* 5, -30)],
        [(-s*170, -70), (-s*150,-110), (-s*105,-118), (-s*60,-100), (-s*25, -68)],
    ]
    for pts_rel in layers:
        v   = random.randint(145, 175)
        col = (v - 22, v - 14, v + 8)
        pts = [(cx, cy)] + [(cx + dx, cy + dy) for dx, dy in pts_rel] + [(cx, cy)]
        d.polygon(pts, fill=col)

    # Fine feather stroke lines
    for i in range(18):
        angle  = math.radians(150 + i * 8) * s
        length = 60 + i * 9
        ex  = cx + math.cos(angle) * length
        ey  = cy - math.sin(angle) * abs(length * 0.55)
        lv  = random.randint(120, 158)
        lc  = (lv - 18, lv - 10, lv + 14)
        d.line([(cx, cy), (ex, ey)], fill=lc, width=random.choice([1, 1, 2]))

draw_wing(185, 250, flip=False)
draw_wing(615, 250, flip=True)

# ── "BEN" hand-lettered block text ───────────────────────────────────────────
INK = (22, 16, 20)

def rough_fill(d, polys, col=INK):
    """Fill polygon with slightly wobbly edges to mimic hand lettering."""
    for poly in polys:
        jittered = [(x + random.randint(-1,1), y + random.randint(-1,1)) for x,y in poly]
        d.polygon(jittered, fill=col)

# B at x=260
bx, by = 260, 18
rough_fill(d, [[(bx,by),(bx+12,by),(bx+12,by+60),(bx,by+60)]])        # stem
rough_fill(d, [[(bx+12,by),(bx+42,by),(bx+42,by+10),(bx+12,by+10)]])  # top bar
rough_fill(d, [[(bx+12,by+26),(bx+38,by+26),(bx+38,by+36),(bx+12,by+36)]])  # mid bar
rough_fill(d, [[(bx+12,by+50),(bx+42,by+50),(bx+42,by+60),(bx+12,by+60)]])  # bot bar
rough_fill(d, [[(bx+34,by+5),(bx+48,by+5),(bx+48,by+28),(bx+34,by+28)]])    # top bump
rough_fill(d, [[(bx+32,by+33),(bx+50,by+33),(bx+50,by+57),(bx+32,by+57)]]) # bot bump

# E at x=325
ex2, ey = 325, 18
rough_fill(d, [[(ex2,ey),(ex2+12,ey),(ex2+12,ey+60),(ex2,ey+60)]])
rough_fill(d, [[(ex2+12,ey),(ex2+42,ey),(ex2+42,ey+10),(ex2+12,ey+10)]])
rough_fill(d, [[(ex2+12,ey+25),(ex2+35,ey+25),(ex2+35,ey+35),(ex2+12,ey+35)]])
rough_fill(d, [[(ex2+12,ey+50),(ex2+42,ey+50),(ex2+42,ey+60),(ex2+12,ey+60)]])

# N at x=385
nx, ny = 385, 18
rough_fill(d, [[(nx,ny),(nx+12,ny),(nx+12,ny+60),(nx,ny+60)]])           # left stem
rough_fill(d, [[(nx+38,ny),(nx+50,ny),(nx+50,ny+60),(nx+38,ny+60)]])     # right stem
# diagonal
for i in range(36):
    px = nx + 12 + int(i * 26 / 36)
    py = ny     + int(i * 60 / 36)
    d.rectangle([px, py, px+8, py+8], fill=INK)

# ── Rose stems with thorns ────────────────────────────────────────────────────
STEM_G = (48, 118, 42)
STEM_D = (28,  76, 28)
THORN  = (38,  96, 36)

def stem(d, x, y_top, y_bot):
    d.line([(x,   y_top), (x,   y_bot)], fill=STEM_G, width=6)
    d.line([(x+2, y_top), (x+2, y_bot)], fill=STEM_D, width=2)
    for ty in range(y_top + 18, y_bot, 20):
        side = 1 if random.random() > 0.5 else -1
        d.polygon([(x, ty), (x+side*16, ty-7), (x+side*12, ty+6)], fill=THORN)

# ── Centre rose: tall stem, full dark-red bloom ───────────────────────────────
stem(d, 400, 185, 385)

def rose_full(d, cx, cy, r=40):
    # Outer petal ring
    for a in range(0, 360, 40):
        ang  = math.radians(a)
        px   = cx + math.cos(ang) * r * 0.75
        py   = cy + math.sin(ang) * r * 0.5
        pw   = r * 0.6
        ph   = r * 0.48
        col  = random.choice([(115,12,18),(95,8,12),(135,18,22),(75,4,8)])
        d.ellipse([px-pw, py-ph, px+pw, py+ph], fill=col)
    # Inner petals
    for a in range(20, 360, 55):
        ang = math.radians(a)
        px  = cx + math.cos(ang) * r * 0.42
        py  = cy + math.sin(ang) * r * 0.32
        col = random.choice([(145,18,22),(125,12,18)])
        d.ellipse([px-22, py-17, px+22, py+17], fill=col)
    # Dark centre with seeds
    d.ellipse([cx-15, cy-13, cx+15, cy+13], fill=(12, 4, 6))
    for _ in range(6):
        sx = cx + random.randint(-8, 8)
        sy = cy + random.randint(-6, 6)
        d.ellipse([sx-2, sy-2, sx+2, sy+2], fill=(35, 10, 12))

rose_full(d, 400, 178)

# ── Left bud: white/cream half-open with red drips ───────────────────────────
stem(d, 255, 278, 385)

def bud_left(d, cx, cy):
    # Sepals (green petals behind)
    d.polygon([(cx-18, cy+12), (cx-10, cy-18), (cx, cy-22), (cx+10, cy-18), (cx+18, cy+12)],
              fill=(75, 110, 35))
    # Cream petals
    d.ellipse([cx-16, cy-15, cx+16, cy+18], fill=(218, 205, 180))
    d.ellipse([cx-10, cy-20, cx+10, cy+5],  fill=(230, 218, 192))
    # Brown/rust top (bud tip)
    d.ellipse([cx-10, cy-20, cx+10, cy-5],  fill=(105, 55, 22))
    # Red drip streaks
    for ddx, dlen in [(-8, 28), (-2, 36), (4, 22), (10, 30)]:
        d.line([(cx+ddx, cy+16), (cx+ddx+random.randint(-2,2), cy+16+dlen)],
               fill=(155, 12, 18), width=2)
        bx2, by2 = cx+ddx, cy+16+dlen
        d.ellipse([bx2-3, by2-3, bx2+3, by2+4], fill=(135, 8, 14))

bud_left(d, 255, 302)

# ── Right bud: green/yellow with red drips ───────────────────────────────────
stem(d, 548, 268, 385)

def bud_right(d, cx, cy):
    # Green-yellow bud body
    d.polygon([(cx-17, cy+14), (cx-8, cy-18), (cx, cy-24), (cx+8, cy-18), (cx+17, cy+14)],
              fill=(88, 108, 28))
    d.ellipse([cx-15, cy-12, cx+15, cy+18], fill=(118, 138, 32))
    d.ellipse([cx-10, cy-18, cx+10, cy+4],  fill=(95, 118, 24))
    # Red slash lines across the green
    for ddy in (-10, -3, 4, 11):
        d.line([(cx-13, cy+ddy), (cx+13+random.randint(-2,2), cy+ddy+3)],
               fill=(175, 18, 18), width=2)
    # Red drips below
    for ddx, dlen in [(-7, 22), (0, 32), (7, 18)]:
        d.line([(cx+ddx, cy+16), (cx+ddx, cy+16+dlen)], fill=(155, 12, 18), width=2)
        bx2, by2 = cx+ddx, cy+16+dlen
        d.ellipse([bx2-3, by2-2, bx2+3, by2+5], fill=(135, 8, 14))

bud_right(d, 548, 288)

# ── Dark irregular border ─────────────────────────────────────────────────────
bc = (24, 18, 26)
for _ in range(280):
    side  = random.choice(['T','B','L','R'])
    thick = random.randint(3, 18)
    if side == 'T':
        x1 = random.randint(0, W)
        d.rectangle([x1, 0, x1+random.randint(10,50), thick], fill=bc)
    elif side == 'B':
        x1 = random.randint(0, W)
        d.rectangle([x1, H-thick, x1+random.randint(10,50), H], fill=bc)
    elif side == 'L':
        y1 = random.randint(0, H)
        d.rectangle([0, y1, thick, y1+random.randint(10,50)], fill=bc)
    else:
        y1 = random.randint(0, H)
        d.rectangle([W-thick, y1, W, y1+random.randint(10,50)], fill=bc)

d.rectangle([0, 0, W-1, H-1], outline=bc, width=4)

# ── Soft vignette ─────────────────────────────────────────────────────────────
vig = Image.new('RGBA', (W, H), (0, 0, 0, 0))
vd  = ImageDraw.Draw(vig)
for r in range(max(W, H)//2, 0, -3):
    alpha = max(0, int(80 * (1 - r / (max(W, H) / 1.35))))
    vd.ellipse([W//2-r, H//2-r, W//2+r, H//2+r], outline=(0,0,0,alpha), width=3)
img = Image.alpha_composite(img.convert('RGBA'), vig).convert('RGB')

out = 'assets/stages/dojo/background.png'
os.makedirs(os.path.dirname(out), exist_ok=True)
img.save(out)
print(f'Saved {out}')
print()
print('TIP: drop Ben\'s actual painting photo as assets/stages/dojo/background.png')
print('     to use the real artwork — the game loads any PNG placed there.')
