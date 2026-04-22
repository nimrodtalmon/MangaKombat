#!/usr/bin/env python3
"""
Generates punkman sprites: manga punk with spiky red hair, red eyes,
spiked collar, Union Jack jacket.  200×300px (extra height for hair crown).

10 sprites: idle, walk, punch_high, punch_low, kick_high, kick_low,
            hit, crouch, win  (+attack alias handled via JSON)
"""

from PIL import Image, ImageDraw
import os, math

W, H = 200, 300

# ── Colours ────────────────────────────────────────────────────────────────────
SKIN        = (245, 210, 165, 255)
SKIN_SHADOW = (210, 170, 120, 255)
HAIR_LIGHT  = (200,  35,  25, 255)
HAIR_MID    = (145,  18,  12, 255)
HAIR_DARK   = ( 70,   8,   6, 255)
EYE_RED     = (185,  20,  20, 255)
EYE_WHITE   = (238, 225, 215, 255)
OUTLINE     = ( 15,   8,   6, 255)
COLLAR_BLK  = ( 12,  10,  16, 255)
COLLAR_STUD = (155, 155, 170, 255)
JACKET_BLK  = ( 18,  16,  22, 255)
JACKET_RED  = (200,  32,  32, 255)
JACKET_BLUE = ( 18,  28,  95, 255)
JACKET_WHT  = (215, 215, 225, 255)
SPIKE_COL   = (125, 125, 140, 255)

# ── Drawing helpers ───────────────────────────────────────────────────────────
def seg(d, a, b, w, fill):
    d.line([a, b], fill=fill, width=w)
    r = max(1, w // 2)
    for p in (a, b):
        d.ellipse([p[0]-r, p[1]-r, p[0]+r, p[1]+r], fill=fill)

def ol(d, a, b, w=2):
    d.line([a, b], fill=OUTLINE, width=w)

def fist(d, cx, cy):
    d.ellipse([cx-7, cy-7, cx+7, cy+7], fill=SKIN, outline=OUTLINE, width=2)

def foot_shape(d, cx, cy):
    d.ellipse([cx-14, cy-6, cx+14, cy+6], fill=COLLAR_BLK, outline=OUTLINE, width=1)

# ── Head components ───────────────────────────────────────────────────────────
def draw_hair(d, cx, cy):
    base_y = cy - 22

    # Back spikes (darker, behind head)
    back = [
        (cx-48, cy-36, cx-56, cx-28, base_y),
        (cx-8,  cy-66, cx-22, cx-2,  base_y),
        (cx+8,  cy-66, cx+2,  cx+22, base_y),
        (cx+48, cy-36, cx+28, cx+56, base_y),
    ]
    for tx, ty, blx, brx, by in back:
        d.polygon([(tx, ty), (blx, by), (brx, by)], fill=HAIR_DARK)

    # Front spikes (brighter, 7 spikes)
    front = [
        (cx-40, cy-42, cx-50, cx-28, base_y, HAIR_MID),
        (cx-24, cy-58, cx-36, cx-12, base_y, HAIR_LIGHT),
        (cx-8,  cy-64, cx-20, cx+4,  base_y, HAIR_LIGHT),
        (cx,    cy-70, cx-11, cx+11, base_y, HAIR_LIGHT),   # tallest
        (cx+8,  cy-64, cx-4,  cx+20, base_y, HAIR_LIGHT),
        (cx+24, cy-58, cx+12, cx+36, base_y, HAIR_LIGHT),
        (cx+40, cy-42, cx+28, cx+50, base_y, HAIR_MID),
    ]
    for tx, ty, blx, brx, by, col in front:
        d.polygon([(tx, ty), (blx, by), (brx, by)], fill=col)
        d.line([(tx, ty), (blx, by)], fill=HAIR_DARK, width=2)
        d.line([(tx, ty), (brx, by)], fill=HAIR_DARK, width=2)

    # Base mass filling gap between spikes and forehead
    d.ellipse([cx-34, cy-30, cx+34, cy+4], fill=HAIR_MID)

def draw_face(d, cx, cy, expression='normal'):
    r = 26

    # Neck
    seg(d, (cx, cy+r-3), (cx, cy+r+18), 11, SKIN)
    ol(d, (cx-6, cy+r+2), (cx-6, cy+r+18))
    ol(d, (cx+6, cy+r+2), (cx+6, cy+r+18))

    # Head (slightly wide jaw)
    d.ellipse([cx-r, cy-r, cx+r+3, cy+r+4], fill=SKIN, outline=OUTLINE, width=3)

    # Cheek shadow
    d.ellipse([cx-r+6, cy+6, cx+5, cy+r+3], fill=SKIN_SHADOW)
    d.ellipse([cx-r, cy-r, cx+r+3, cy+r+4], outline=OUTLINE, width=3)

    # Heavy angry brows
    brow_y = cy - 10
    d.polygon([(cx-22, brow_y-3), (cx-4, brow_y+6), (cx-4, brow_y+10), (cx-22, brow_y+3)],
              fill=OUTLINE)
    d.polygon([(cx+25, brow_y-3), (cx+7, brow_y+6), (cx+7, brow_y+10), (cx+25, brow_y+3)],
              fill=OUTLINE)

    # Eyes — large red irises, heavy lower lids
    eye_y = cy
    for ex in (cx - 12, cx + 12):
        d.ellipse([ex-11, eye_y-8, ex+11, eye_y+8], fill=(35, 25, 30))  # socket
        d.ellipse([ex-9,  eye_y-6, ex+9,  eye_y+6], fill=EYE_WHITE)
        d.ellipse([ex-6,  eye_y-6, ex+6,  eye_y+6], fill=EYE_RED)
        d.ellipse([ex-3,  eye_y-4, ex+3,  eye_y+3], fill=(8, 3, 3))    # pupil
        # Heavy lower lid
        d.arc([ex-9, eye_y-6, ex+9, eye_y+6], 15, 165, fill=OUTLINE, width=3)

    if expression == 'hit':
        for ex in (cx-12, cx+12):
            d.rectangle([ex-10, eye_y-7, ex+10, eye_y+1], fill=SKIN)
            d.line([(ex-9, eye_y+2), (ex+9, eye_y+2)], fill=OUTLINE, width=3)

    elif expression == 'attack':
        # Teeth bared
        d.rectangle([cx-12, cy+10, cx+12, cy+17], fill=(25, 15, 15))
        for tx in range(cx-10, cx+12, 5):
            d.rectangle([tx, cy+10, tx+4, cy+15], fill=(225, 215, 210))

    # Nose ridge
    d.line([(cx+4, cy-5), (cx+7, cy+6)], fill=OUTLINE, width=2)

    # Mouth
    if expression == 'win':
        d.line([(cx-9, cy+12), (cx+2, cy+13), (cx+11, cy+9)], fill=OUTLINE, width=2)
    else:
        d.arc([cx-10, cy+9, cx+10, cy+19], 200, 340, fill=OUTLINE, width=2)

    # Ear with spike earring
    d.ellipse([cx-r-4, cy-5, cx-r+9, cy+9], fill=SKIN, outline=OUTLINE, width=2)
    d.polygon([(cx-r-5, cy+6), (cx-r-12, cy+16), (cx-r, cy+11)],
              fill=SPIKE_COL, outline=OUTLINE)

def draw_collar(d, cx, cy):
    face_r = 26
    top_y  = cy + face_r + 16
    bot_y  = top_y + 16

    d.rectangle([cx-32, top_y, cx+32, bot_y], fill=COLLAR_BLK, outline=OUTLINE, width=2)

    # Diamond studs
    for sx in range(cx-26, cx+28, 8):
        sy = (top_y + bot_y) // 2
        d.polygon([(sx, sy-5), (sx+4, sy), (sx, sy+5), (sx-4, sy)],
                  fill=COLLAR_STUD, outline=OUTLINE)

    # Upward collar spikes
    for sx in (cx-24, cx-12, cx, cx+12):
        d.polygon([(sx, top_y), (sx+5, top_y-10), (sx+10, top_y)],
                  fill=SPIKE_COL, outline=OUTLINE)

def draw_punkman_head(d, cx, cy, expression='normal'):
    draw_hair(d, cx, cy)
    draw_face(d, cx, cy, expression)
    draw_collar(d, cx, cy)

# ── Jacket torso ──────────────────────────────────────────────────────────────
def draw_jacket_torso(d, sc, hc, ls, rs, lh, rh):
    # Spine and shoulder/hip belts
    seg(d, sc, hc, 22, JACKET_BLK)
    seg(d, ls, rs, 18, JACKET_BLK)
    seg(d, lh, rh, 15, JACKET_BLK)

    # Union Jack on chest
    cx_t = (sc[0] + hc[0]) // 2
    cy_t = (sc[1] + hc[1]) // 2 + 5
    sz   = 18
    d.rectangle([cx_t-sz, cy_t-sz, cx_t+sz, cy_t+sz], fill=JACKET_BLUE)
    d.line([(cx_t-sz, cy_t-sz), (cx_t+sz, cy_t+sz)], fill=JACKET_WHT, width=6)
    d.line([(cx_t+sz, cy_t-sz), (cx_t-sz, cy_t+sz)], fill=JACKET_WHT, width=6)
    d.line([(cx_t-sz, cy_t), (cx_t+sz, cy_t)], fill=JACKET_RED, width=7)
    d.line([(cx_t, cy_t-sz), (cx_t, cy_t+sz)], fill=JACKET_RED, width=7)

    # Redraw spine over the flag to clean edges
    seg(d, sc, hc, 22, JACKET_BLK)
    ol(d, sc, hc, 2)
    ol(d, ls, rs, 2)
    ol(d, lh, rh, 2)

    # Shoulder spikes
    for pt in (ls, rs):
        sx, sy = pt
        mir = -1 if sx < sc[0] else 1
        for i in range(3):
            ox = sx + mir * i * 10
            d.polygon([(ox, sy-3), (ox+mir*7, sy-12), (ox+mir*14, sy-3)],
                      fill=SPIKE_COL, outline=OUTLINE)

# ── Full body ─────────────────────────────────────────────────────────────────
def draw_body(d, j, expression='normal'):
    # Back limbs
    seg(d, j['r_hip'],      j['r_knee'],    15, JACKET_BLK)
    seg(d, j['r_knee'],     j['r_foot'],    13, JACKET_BLK)
    seg(d, j['r_shoulder'], j['r_elbow'],   11, JACKET_BLK)
    seg(d, j['r_elbow'],    j['r_hand'],     9, JACKET_BLK)

    draw_jacket_torso(d, j['sc'], j['hc'], j['ls'], j['rs'], j['lh'], j['rh'])

    # Front limbs
    seg(d, j['l_hip'],      j['l_knee'],    15, JACKET_BLK)
    seg(d, j['l_knee'],     j['l_foot'],    13, JACKET_BLK)
    seg(d, j['l_shoulder'], j['l_elbow'],   11, JACKET_BLK)
    seg(d, j['l_elbow'],    j['l_hand'],     9, JACKET_BLK)

    for ka, kb in [
        ('l_shoulder','l_elbow'), ('l_elbow','l_hand'),
        ('r_shoulder','r_elbow'), ('r_elbow','r_hand'),
        ('l_hip','l_knee'), ('l_knee','l_foot'),
        ('r_hip','r_knee'), ('r_knee','r_foot'),
    ]:
        ol(d, j[ka], j[kb])

    for side in ('l', 'r'):
        hx, hy = j[f'{side}_hand']
        fist(d, hx, hy)

    foot_shape(d, j['l_foot'][0], j['l_foot'][1])
    foot_shape(d, j['r_foot'][0], j['r_foot'][1])

def make(joints, expression='normal'):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d   = ImageDraw.Draw(img)
    draw_body(d, joints, expression)
    draw_punkman_head(d, joints['head'][0], joints['head'][1], expression)
    return img

# ── Poses (all Y shifted +30 to fit tall hair crown) ─────────────────────────
def sy(pose, dy=30):
    return {k: (v[0], v[1]+dy) for k, v in pose.items()}

IDLE = sy(dict(
    head=(100, 36),
    sc=(100, 80),  ls=(66, 80),  rs=(134, 80),
    hc=(100, 160), lh=(82, 160), rh=(118, 160),
    l_shoulder=(66, 80),  l_elbow=(50, 122),  l_hand=(44, 160),
    r_shoulder=(134, 80), r_elbow=(150, 122), r_hand=(156, 160),
    l_hip=(82, 160), l_knee=(74, 208), l_foot=(66, 252),
    r_hip=(118, 160), r_knee=(126, 208), r_foot=(134, 252),
))

WALK = sy(dict(
    head=(103, 36),
    sc=(102, 78),  ls=(68, 78),  rs=(136, 78),
    hc=(100, 158), lh=(82, 158), rh=(118, 158),
    l_shoulder=(68, 78),  l_elbow=(82, 120),  l_hand=(90, 158),
    r_shoulder=(136, 78), r_elbow=(122, 116), r_hand=(115, 154),
    l_hip=(82, 158), l_knee=(120, 204), l_foot=(134, 252),
    r_hip=(118, 158), r_knee=(68, 202),  r_foot=(52, 250),
))

# Right arm extended high — punch at head level
PUNCH_HIGH = sy(dict(
    head=(97, 36),
    sc=(97, 80),   ls=(65, 80),  rs=(129, 80),
    hc=(98, 162),  lh=(80, 162), rh=(116, 162),
    l_shoulder=(65, 80),  l_elbow=(58, 108),  l_hand=(52, 134),
    r_shoulder=(129, 80), r_elbow=(158, 55),  r_hand=(186, 34),   # HIGH
    l_hip=(80, 162), l_knee=(74, 210), l_foot=(66, 254),
    r_hip=(116, 162), r_knee=(124, 208), r_foot=(134, 254),
))

# Right arm extended forward at gut level — punch low
PUNCH_LOW = sy(dict(
    head=(98, 40),
    sc=(98, 82),   ls=(66, 78),  rs=(130, 82),
    hc=(99, 162),  lh=(82, 162), rh=(116, 162),
    l_shoulder=(66, 78),  l_elbow=(58, 112),  l_hand=(52, 142),
    r_shoulder=(130, 82), r_elbow=(162, 112), r_hand=(191, 138),  # LOW
    l_hip=(82, 162), l_knee=(76, 210), l_foot=(68, 254),
    r_hip=(116, 162), r_knee=(124, 208), r_foot=(134, 254),
))

# Right leg raised high — kick at head level
KICK_HIGH = sy(dict(
    head=(100, 36),
    sc=(100, 80),  ls=(68, 80),  rs=(132, 80),
    hc=(100, 158), lh=(82, 158), rh=(118, 158),
    l_shoulder=(68, 80),  l_elbow=(52, 108),  l_hand=(40, 136),
    r_shoulder=(132, 80), r_elbow=(148, 106), r_hand=(158, 136),
    l_hip=(82, 158), l_knee=(78, 212), l_foot=(72, 254),           # plant
    r_hip=(118, 158), r_knee=(163, 100), r_foot=(196, 62),         # HIGH kick
))

# Right leg swept low and forward — low kick / sweep
KICK_LOW = sy(dict(
    head=(102, 40),
    sc=(100, 82),  ls=(68, 80),  rs=(132, 82),
    hc=(100, 160), lh=(82, 160), rh=(118, 160),
    l_shoulder=(68, 80),  l_elbow=(54, 112),  l_hand=(44, 142),
    r_shoulder=(132, 82), r_elbow=(148, 110), r_hand=(160, 140),
    l_hip=(82, 160), l_knee=(72, 212), l_foot=(64, 254),           # plant
    r_hip=(118, 160), r_knee=(156, 184), r_foot=(196, 216),        # LOW sweep
))

HIT = sy(dict(
    head=(108, 40),
    sc=(106, 82),  ls=(74, 82),  rs=(138, 82),
    hc=(108, 163), lh=(92, 163), rh=(124, 163),
    l_shoulder=(74, 82),  l_elbow=(58, 108),  l_hand=(45, 80),
    r_shoulder=(138, 82), r_elbow=(150, 104), r_hand=(164, 78),
    l_hip=(92, 163), l_knee=(82, 212), l_foot=(74, 255),
    r_hip=(124, 163), r_knee=(134, 208), r_foot=(144, 253),
))

CROUCH = sy(dict(
    head=(100, 70),
    sc=(100, 106), ls=(72, 106), rs=(128, 106),
    hc=(100, 158), lh=(82, 158), rh=(118, 158),
    l_shoulder=(72, 106), l_elbow=(60, 134), l_hand=(54, 110),
    r_shoulder=(128, 106), r_elbow=(140, 130), r_hand=(148, 106),
    l_hip=(82, 158), l_knee=(60, 204), l_foot=(56, 244),
    r_hip=(118, 158), r_knee=(140, 200), r_foot=(144, 244),
))

WIN = sy(dict(
    head=(100, 30),
    sc=(100, 74),  ls=(66, 74),  rs=(134, 74),
    hc=(100, 156), lh=(82, 156), rh=(118, 156),
    l_shoulder=(66, 74),  l_elbow=(50, 94),  l_hand=(42, 62),
    r_shoulder=(134, 74), r_elbow=(150, 90), r_hand=(156, 58),
    l_hip=(82, 156), l_knee=(76, 206), l_foot=(70, 252),
    r_hip=(118, 156), r_knee=(124, 206), r_foot=(130, 252),
))

# ── Generate ──────────────────────────────────────────────────────────────────
OUT = 'assets/characters/punkman'
os.makedirs(OUT, exist_ok=True)

for name, pose, expr in [
    ('idle',       IDLE,       'normal'),
    ('walk',       WALK,       'normal'),
    ('punch_high', PUNCH_HIGH, 'attack'),
    ('punch_low',  PUNCH_LOW,  'attack'),
    ('kick_high',  KICK_HIGH,  'normal'),
    ('kick_low',   KICK_LOW,   'normal'),
    ('hit',        HIT,        'hit'),
    ('crouch',     CROUCH,     'normal'),
    ('win',        WIN,        'win'),
]:
    img  = make(pose, expr)
    path = f'{OUT}/{name}.png'
    img.save(path)
    print(f'  {path}')

print('Done.')
