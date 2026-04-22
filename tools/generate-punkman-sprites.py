#!/usr/bin/env python3
"""
Generates punkman sprites: manga punk character with spiky red hair,
red eyes, spiked collar, and Union Jack shirt.

Image is 200x300 (30px taller than dummy) to fit the hair crown.
"""

from PIL import Image, ImageDraw
import os, math

W, H = 200, 300

# ── Colours ──────────────────────────────────────────────────────────────────
SKIN        = (245, 210, 165, 255)
SKIN_SHADOW = (210, 170, 120, 255)
HAIR_LIGHT  = (210,  45,  35, 255)
HAIR_MID    = (160,  20,  15, 255)
HAIR_DARK   = ( 80,  10,   8, 255)
EYE_RED     = (190,  25,  25, 255)
EYE_WHITE   = (240, 230, 220, 255)
OUTLINE     = ( 20,  10,   8, 255)
COLLAR_BLK  = ( 15,  12,  18, 255)
COLLAR_STUD = (160, 160, 175, 255)
JACKET_BLK  = ( 20,  18,  25, 255)
JACKET_RED  = (200,  35,  35, 255)
JACKET_BLUE = ( 20,  30, 100, 255)
JACKET_WHT  = (220, 220, 230, 255)
BODY_COL    = ( 20,  18,  25, 255)   # dark jacket body fill
BODY_SHADOW = ( 35,  30,  40, 255)
BODY_HI     = ( 55,  50,  65, 255)
SPIKE_COL   = (130, 130, 145, 255)   # shoulder spike metal

# ── Generic drawing helpers ──────────────────────────────────────────────────
def seg(d, a, b, w, fill):
    d.line([a, b], fill=fill, width=w)
    r = max(1, w // 2)
    for p in (a, b):
        d.ellipse([p[0]-r, p[1]-r, p[0]+r, p[1]+r], fill=fill)

def outline_seg(d, a, b, w=2):
    d.line([a, b], fill=OUTLINE, width=w)

def fist(d, cx, cy):
    d.ellipse([cx-7, cy-7, cx+7, cy+7], fill=SKIN, outline=OUTLINE, width=2)

def foot_shape(d, cx, cy):
    d.ellipse([cx-13, cy-5, cx+13, cy+5], fill=COLLAR_BLK)

# ── Punkman head ─────────────────────────────────────────────────────────────
def draw_hair(d, cx, cy, expression='normal'):
    """Spiky red crown — extends ~65px above face centre."""
    base_y  = cy - 20   # where hair roots sit (above face edge)
    root_l  = cx - 30
    root_r  = cx + 30

    # ── Back-layer spikes (darker, slightly offset) ──────────────────────────
    back_spikes = [
        (cx-46, cy-34, cx-54, cx-30, base_y),
        (cx-10, cy-64, cx-22, cx-2,  base_y),
        (cx+10, cy-64, cx+2,  cx+22, base_y),
        (cx+46, cy-34, cx+30, cx+54, base_y),
    ]
    for tx, ty, blx, brx, by in back_spikes:
        d.polygon([(tx, ty), (blx, by), (brx, by)], fill=HAIR_DARK)

    # ── Front-layer spikes (brighter) ────────────────────────────────────────
    front_spikes = [
        (cx-38, cy-40, cx-48, cx-26, base_y, HAIR_MID),
        (cx-22, cy-55, cx-34, cx-12, base_y, HAIR_LIGHT),
        (cx-6,  cy-62, cx-16, cx+4,  base_y, HAIR_LIGHT),
        (cx,    cy-66, cx-10, cx+10, base_y, HAIR_LIGHT),   # tallest centre
        (cx+6,  cy-62, cx-4,  cx+16, base_y, HAIR_LIGHT),
        (cx+22, cy-55, cx+12, cx+34, base_y, HAIR_LIGHT),
        (cx+38, cy-40, cx+26, cx+48, base_y, HAIR_MID),
    ]
    for tx, ty, blx, brx, by, col in front_spikes:
        d.polygon([(tx, ty), (blx, by), (brx, by)], fill=col)
        d.line([(tx, ty), (blx, by)], fill=HAIR_DARK, width=2)
        d.line([(tx, ty), (brx, by)], fill=HAIR_DARK, width=2)

    # ── Hair base mass (fills gap between spikes and head) ───────────────────
    d.ellipse([cx-32, cy-28, cx+32, cy+2], fill=HAIR_MID)

def draw_face(d, cx, cy, expression='normal'):
    """Face with red eyes, heavy brows, scowl."""
    r = 24

    # Neck
    seg(d, (cx, cy+r-2), (cx, cy+r+16), 10, SKIN)
    outline_seg(d, (cx-5, cy+r+2), (cx-5, cy+r+16))
    outline_seg(d, (cx+5, cy+r+2), (cx+5, cy+r+16))

    # Head oval (slightly wider than tall = strong jaw)
    d.ellipse([cx-r, cy-r, cx+r+2, cy+r+2], fill=SKIN, outline=OUTLINE, width=2)

    # Cheek shadow
    d.ellipse([cx-r+4, cy+4, cx+4, cy+r+2],
              fill=SKIN_SHADOW, outline=None)
    d.ellipse([cx-r, cy-r, cx+r+2, cy+r+2], outline=OUTLINE, width=2)

    # ── Eyebrows (angry — slope downward toward nose) ─────────────────────
    brow_y = cy - 8
    d.polygon([(cx-20, brow_y-2), (cx-4, brow_y+5), (cx-4, brow_y+8),
               (cx-20, brow_y+2)], fill=OUTLINE)
    d.polygon([(cx+22, brow_y-2), (cx+6, brow_y+5), (cx+6, brow_y+8),
               (cx+22, brow_y+2)], fill=OUTLINE)

    # ── Eyes ─────────────────────────────────────────────────────────────────
    eye_y = cy - 1
    for ex in (cx - 11, cx + 11):
        # Eye socket shadow
        d.ellipse([ex-10, eye_y-7, ex+10, eye_y+7], fill=(40, 30, 35))
        # White
        d.ellipse([ex-8, eye_y-5, ex+8, eye_y+5], fill=EYE_WHITE)
        # Iris (red)
        d.ellipse([ex-5, eye_y-5, ex+5, eye_y+5], fill=EYE_RED)
        # Pupil
        d.ellipse([ex-2, eye_y-3, ex+2, eye_y+3], fill=(10, 5, 5))
        # Eyelid lower crease
        d.arc([ex-8, eye_y-5, ex+8, eye_y+5], 20, 160, fill=OUTLINE, width=2)

    # Hit / attack expression overrides
    if expression == 'hit':
        # Squint: cover top half of eyes with skin
        for ex in (cx-11, cx+11):
            d.rectangle([ex-9, eye_y-6, ex+9, eye_y], fill=SKIN)
            d.line([(ex-8, eye_y+1), (ex+8, eye_y+1)], fill=OUTLINE, width=2)
    elif expression == 'attack':
        # Wide open, teeth
        d.rectangle([cx-10, cy+8, cx+10, cy+14], fill=(30, 20, 20))
        for tx in range(cx-8, cx+10, 5):
            d.rectangle([tx, cy+8, tx+4, cy+12], fill=(230, 220, 215))

    # Nose bridge line
    d.line([(cx+3, cy-4), (cx+6, cy+5)], fill=OUTLINE, width=2)

    # Mouth
    if expression == 'win':
        # Smirk (right corner up)
        d.line([(cx-8, cy+11), (cx+2, cy+12), (cx+10, cy+8)],
               fill=OUTLINE, width=2)
    else:
        # Scowl (slight downward curve at corners)
        d.arc([cx-10, cy+8, cx+10, cy+18], 200, 340, fill=OUTLINE, width=2)

    # Ear (left side, with spike earring)
    d.ellipse([cx-r-3, cy-4, cx-r+8, cy+8], fill=SKIN, outline=OUTLINE, width=2)
    # Spike earring
    d.polygon([(cx-r-4, cy+5), (cx-r-10, cy+14), (cx-r-1, cy+10)],
              fill=SPIKE_COL, outline=OUTLINE)

def draw_collar(d, cx, cy):
    """Studded spiked collar just below face."""
    face_r = 24
    top_y  = cy + face_r + 14
    bot_y  = top_y + 14

    # Collar band
    d.rectangle([cx-30, top_y, cx+30, bot_y], fill=COLLAR_BLK, outline=OUTLINE, width=1)

    # Diamond studs
    for sx in range(cx-24, cx+26, 8):
        sy = (top_y + bot_y) // 2
        d.polygon([(sx, sy-4),(sx+3, sy),(sx, sy+4),(sx-3, sy)],
                  fill=COLLAR_STUD, outline=OUTLINE)

    # Outward spikes (triangles pointing away from neck)
    for sx in (cx-22, cx-10, cx+2, cx+14):
        d.polygon([(sx, top_y),(sx+5, top_y-8),(sx+10, top_y)],
                  fill=SPIKE_COL, outline=OUTLINE)

def draw_punkman_head(d, cx, cy, expression='normal'):
    draw_hair(d, cx, cy, expression)
    draw_face(d, cx, cy, expression)
    draw_collar(d, cx, cy)

# ── Jacket body (replaces dummy's plain blue body) ───────────────────────────
def draw_jacket_torso(d, sc, hc, ls, rs, lh, rh):
    """Spiked leather jacket with Union Jack chest."""
    # Main torso fill
    seg(d, sc, hc, 20, JACKET_BLK)
    seg(d, ls,  rs, 16, JACKET_BLK)
    seg(d, lh,  rh, 14, JACKET_BLK)

    # Union Jack diagonal cross in chest area
    cx_t = (sc[0] + hc[0]) // 2
    cy_t = (sc[1] + hc[1]) // 2 + 4
    size = 16
    # Blue background square
    d.rectangle([cx_t-size, cy_t-size, cx_t+size, cy_t+size], fill=JACKET_BLUE)
    # White diagonals
    d.line([(cx_t-size, cy_t-size),(cx_t+size, cy_t+size)],fill=JACKET_WHT,width=5)
    d.line([(cx_t+size, cy_t-size),(cx_t-size, cy_t+size)],fill=JACKET_WHT,width=5)
    # Red cross
    d.line([(cx_t-size, cy_t),(cx_t+size, cy_t)], fill=JACKET_RED, width=6)
    d.line([(cx_t, cy_t-size),(cx_t, cy_t+size)], fill=JACKET_RED, width=6)
    # Clip to torso shape
    seg(d, sc, hc, 20, JACKET_BLK)   # redraw spine to cover overflow
    # Torso outline
    outline_seg(d, sc, hc, 2)
    outline_seg(d, ls, rs, 2)
    outline_seg(d, lh, rh, 2)

    # Shoulder spikes
    for pt in (ls, rs):
        sx, sy = pt
        mirror = -1 if sx < sc[0] else 1
        for i in range(3):
            ox = sx + mirror * i * 10
            d.polygon([(ox, sy-2),(ox+mirror*6, sy-10),(ox+mirror*12, sy-2)],
                      fill=SPIKE_COL, outline=OUTLINE)

# ── Full body composer ────────────────────────────────────────────────────────
def draw_body(d, j, expression='normal'):
    # back limbs
    seg(d, j['r_hip'],      j['r_knee'],    14, JACKET_BLK)
    seg(d, j['r_knee'],     j['r_foot'],    12, JACKET_BLK)
    seg(d, j['r_shoulder'], j['r_elbow'],   10, JACKET_BLK)
    seg(d, j['r_elbow'],    j['r_hand'],     8, JACKET_BLK)

    draw_jacket_torso(d, j['sc'], j['hc'], j['ls'], j['rs'], j['lh'], j['rh'])

    # front limbs
    seg(d, j['l_hip'],      j['l_knee'],    14, JACKET_BLK)
    seg(d, j['l_knee'],     j['l_foot'],    12, JACKET_BLK)
    seg(d, j['l_shoulder'], j['l_elbow'],   10, JACKET_BLK)
    seg(d, j['l_elbow'],    j['l_hand'],     8, JACKET_BLK)

    # limb outlines
    for ka, kb in [
        ('l_shoulder','l_elbow'),('l_elbow','l_hand'),
        ('r_shoulder','r_elbow'),('r_elbow','r_hand'),
        ('l_hip','l_knee'),('l_knee','l_foot'),
        ('r_hip','r_knee'),('r_knee','r_foot'),
    ]:
        outline_seg(d, j[ka], j[kb])

    # fists
    for side in ('l','r'):
        hx, hy = j[f'{side}_hand']
        fist(d, hx, hy)

    # feet
    foot_shape(d, j['l_foot'][0], j['l_foot'][1])
    foot_shape(d, j['r_foot'][0], j['r_foot'][1])

def make(joints, expression='normal'):
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d   = ImageDraw.Draw(img)
    draw_body(d, joints, expression)
    draw_punkman_head(d, joints['head'][0], joints['head'][1], expression)
    return img

# ── Pose definitions (dummy coords + 30px Y to fit hair) ─────────────────────
def sy(pose, dy=30):
    return {k: (v[0], v[1]+dy) if isinstance(v, tuple) else v
            for k, v in pose.items()}

IDLE = sy(dict(
    head=(100,36),
    sc=(100,80),  ls=(66,80),  rs=(134,80),
    hc=(100,160), lh=(82,160), rh=(118,160),
    l_shoulder=(66,80),  l_elbow=(50,122),  l_hand=(44,160),
    r_shoulder=(134,80), r_elbow=(150,122), r_hand=(156,160),
    l_hip=(82,160), l_knee=(74,208), l_foot=(66,252),
    r_hip=(118,160), r_knee=(126,208), r_foot=(134,252),
))

WALK = sy(dict(
    head=(103,36),
    sc=(102,78),  ls=(68,78),  rs=(136,78),
    hc=(100,158), lh=(82,158), rh=(118,158),
    l_shoulder=(68,78),  l_elbow=(82,120),  l_hand=(90,158),
    r_shoulder=(136,78), r_elbow=(122,116), r_hand=(115,154),
    l_hip=(82,158), l_knee=(120,204), l_foot=(134,252),
    r_hip=(118,158), r_knee=(68,202),  r_foot=(52,250),
))

ATTACK = sy(dict(
    head=(97,36),
    sc=(97,80),   ls=(65,80),  rs=(129,80),
    hc=(98,162),  lh=(80,162), rh=(116,162),
    l_shoulder=(65,80),  l_elbow=(68,96),   l_hand=(62,70),
    r_shoulder=(129,80), r_elbow=(156,84),  r_hand=(182,76),
    l_hip=(80,162), l_knee=(74,210), l_foot=(66,254),
    r_hip=(116,162), r_knee=(124,208), r_foot=(134,254),
))

HIT = sy(dict(
    head=(108,40),
    sc=(106,82),  ls=(74,82),  rs=(138,82),
    hc=(108,163), lh=(92,163), rh=(124,163),
    l_shoulder=(74,82),  l_elbow=(58,108),  l_hand=(45,80),
    r_shoulder=(138,82), r_elbow=(150,104), r_hand=(164,78),
    l_hip=(92,163), l_knee=(82,212), l_foot=(74,255),
    r_hip=(124,163), r_knee=(134,208), r_foot=(144,253),
))

CROUCH = sy(dict(
    head=(100,70),
    sc=(100,106), ls=(72,106), rs=(128,106),
    hc=(100,158), lh=(82,158), rh=(118,158),
    l_shoulder=(72,106), l_elbow=(60,134), l_hand=(54,110),
    r_shoulder=(128,106), r_elbow=(140,130), r_hand=(148,106),
    l_hip=(82,158), l_knee=(60,204), l_foot=(56,244),
    r_hip=(118,158), r_knee=(140,200), r_foot=(144,244),
))

WIN = sy(dict(
    head=(100,30),
    sc=(100,74),  ls=(66,74),  rs=(134,74),
    hc=(100,156), lh=(82,156), rh=(118,156),
    l_shoulder=(66,74),  l_elbow=(50,94),  l_hand=(42,62),
    r_shoulder=(134,74), r_elbow=(150,90), r_hand=(156,58),
    l_hip=(82,156), l_knee=(76,206), l_foot=(70,252),
    r_hip=(118,156), r_knee=(124,206), r_foot=(130,252),
))

# ── Generate ──────────────────────────────────────────────────────────────────
OUT = 'assets/characters/punkman'
os.makedirs(OUT, exist_ok=True)

for name, pose, expr in [
    ('idle',   IDLE,   'normal'),
    ('walk',   WALK,   'normal'),
    ('attack', ATTACK, 'attack'),
    ('hit',    HIT,    'hit'),
    ('crouch', CROUCH, 'normal'),
    ('win',    WIN,    'win'),
]:
    img  = make(pose, expr)
    path = f'{OUT}/{name}.png'
    img.save(path)
    print(f'  {path}')

print('Done.')
