#!/usr/bin/env python3
"""
Generates placeholder PNG sprites for MangaKombat dummy characters.
Each PNG shows a clear fighting pose so Ben knows exactly what to draw.
10 sprites per character: idle, walk, punch_high, punch_low, kick_high, kick_low,
                          hit, crouch, win, (attack alias = punch_high)
"""

from PIL import Image, ImageDraw
import os

W, H = 200, 270

# ── Helpers ───────────────────────────────────────────────────────────────────
def seg(d, a, b, w, fill):
    d.line([a, b], fill=fill, width=w)
    r = max(1, w // 2)
    for p in (a, b):
        d.ellipse([p[0]-r, p[1]-r, p[0]+r, p[1]+r], fill=fill)

def circle(d, cx, cy, r, fill, border, bw=2):
    d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=fill, outline=border, width=bw)

def foot_shape(d, cx, cy, col):
    d.ellipse([cx-13, cy-5, cx+13, cy+5], fill=col)

def draw_head(d, cx, cy, colors, tilt_x=0):
    r = 24
    outline = colors['outline']
    seg(d, (cx, cy+r-4), (cx, cy+r+12), 10, colors['fill'])
    circle(d, cx, cy, r, colors['skin'], outline)
    d.pieslice([cx-r, cy-r, cx+r, cy+r], -195, 15,
               fill=colors['hair'], outline=colors['hair'])
    d.arc([cx-r, cy-r, cx+r, cy+r], -195, 15, fill=outline, width=2)
    ex = cx + 9 + tilt_x
    ey = cy - 2
    d.ellipse([ex-5, ey-5, ex+5, ey+5], fill=outline)
    d.ellipse([ex-2, ey-4, ex+2, ey+2], fill=(255, 255, 255, 255))
    d.arc([cx-r, cy-r, cx+r, cy+r], -15, 195, fill=outline, width=2)

def draw_body(d, j, colors):
    fill    = colors['fill']
    outline = colors['outline']
    hi      = colors['highlight']

    seg(d, j['r_hip'],      j['r_knee'],    14, fill)
    seg(d, j['r_knee'],     j['r_foot'],    12, fill)
    seg(d, j['r_shoulder'], j['r_elbow'],   10, fill)
    seg(d, j['r_elbow'],    j['r_hand'],     8, fill)

    seg(d, j['sc'],  j['hc'], 20, fill)
    seg(d, j['ls'],  j['rs'], 16, fill)
    seg(d, j['lh'],  j['rh'], 14, fill)
    sc, hc = j['sc'], j['hc']
    seg(d, (sc[0]-3, sc[1]+4), (hc[0]-3, hc[1]-4), 5, hi)

    seg(d, j['l_hip'],      j['l_knee'],    14, fill)
    seg(d, j['l_knee'],     j['l_foot'],    12, fill)
    seg(d, j['l_shoulder'], j['l_elbow'],   10, fill)
    seg(d, j['l_elbow'],    j['l_hand'],     8, fill)

    for ka, kb in [
        ('ls','rs'), ('sc','hc'), ('lh','rh'),
        ('l_shoulder','l_elbow'), ('l_elbow','l_hand'),
        ('r_shoulder','r_elbow'), ('r_elbow','r_hand'),
        ('l_hip','l_knee'), ('l_knee','l_foot'),
        ('r_hip','r_knee'), ('r_knee','r_foot'),
    ]:
        d.line([j[ka], j[kb]], fill=outline, width=2)

    for side in ('l', 'r'):
        hx, hy = j[f'{side}_hand']
        circle(d, hx, hy, 7, colors['skin'], outline, 2)

    foot_shape(d, j['l_foot'][0], j['l_foot'][1], outline)
    foot_shape(d, j['r_foot'][0], j['r_foot'][1], outline)

def make(joints, colors, tilt=0):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d   = ImageDraw.Draw(img)
    draw_body(d, joints, colors)
    draw_head(d, joints['head'][0], joints['head'][1], colors, tilt)
    return img


# ── Pose definitions ──────────────────────────────────────────────────────────

IDLE = dict(
    head=(100, 36),
    sc=(100, 80),  ls=(66, 80),  rs=(134, 80),
    hc=(100, 160), lh=(82, 160), rh=(118, 160),
    l_shoulder=(66, 80),  l_elbow=(50, 122),  l_hand=(44, 160),
    r_shoulder=(134, 80), r_elbow=(150, 122), r_hand=(156, 160),
    l_hip=(82, 160), l_knee=(74, 208), l_foot=(66, 252),
    r_hip=(118, 160), r_knee=(126, 208), r_foot=(134, 252),
)

WALK = dict(
    head=(103, 36),
    sc=(102, 78),  ls=(68, 78),  rs=(136, 78),
    hc=(100, 158), lh=(82, 158), rh=(118, 158),
    l_shoulder=(68, 78),  l_elbow=(82, 120),  l_hand=(90, 158),
    r_shoulder=(136, 78), r_elbow=(122, 116), r_hand=(115, 154),
    l_hip=(82, 158), l_knee=(120, 204), l_foot=(134, 252),
    r_hip=(118, 158), r_knee=(68, 202),  r_foot=(52, 250),
)

# High punch: right arm extends up and forward at head level
PUNCH_HIGH = dict(
    head=(97, 36),
    sc=(97, 80),   ls=(65, 80),  rs=(129, 80),
    hc=(98, 162),  lh=(80, 162), rh=(116, 162),
    l_shoulder=(65, 80),  l_elbow=(58, 108),   l_hand=(52, 134),   # guard up
    r_shoulder=(129, 80), r_elbow=(158, 55),   r_hand=(186, 34),   # arm fully extended HIGH
    l_hip=(80, 162), l_knee=(74, 210), l_foot=(66, 254),
    r_hip=(116, 162), r_knee=(124, 208), r_foot=(134, 254),
)

# Low punch: right arm extends forward at hip/gut level
PUNCH_LOW = dict(
    head=(98, 40),
    sc=(98, 82),   ls=(66, 78),  rs=(130, 82),
    hc=(99, 162),  lh=(82, 162), rh=(116, 162),
    l_shoulder=(66, 78),  l_elbow=(58, 112),  l_hand=(52, 142),   # guard mid
    r_shoulder=(130, 82), r_elbow=(162, 112), r_hand=(191, 138),  # arm extended LOW
    l_hip=(82, 162), l_knee=(76, 210), l_foot=(68, 254),
    r_hip=(116, 162), r_knee=(124, 208), r_foot=(134, 254),
)

# High kick: right leg chambered and extended high
KICK_HIGH = dict(
    head=(100, 36),
    sc=(100, 80),  ls=(68, 80),  rs=(132, 80),
    hc=(100, 158), lh=(82, 158), rh=(118, 158),
    l_shoulder=(68, 80),  l_elbow=(52, 108),  l_hand=(40, 136),   # arms balancing
    r_shoulder=(132, 80), r_elbow=(148, 106), r_hand=(158, 136),
    l_hip=(82, 158), l_knee=(78, 212), l_foot=(72, 254),           # plant leg
    r_hip=(118, 158), r_knee=(163, 100), r_foot=(196, 62),         # kick leg HIGH
)

# Low kick: right leg swept forward and low (sweep kick)
KICK_LOW = dict(
    head=(102, 40),
    sc=(100, 82),  ls=(68, 80),  rs=(132, 82),
    hc=(100, 160), lh=(82, 160), rh=(118, 160),
    l_shoulder=(68, 80),  l_elbow=(54, 112),  l_hand=(44, 142),
    r_shoulder=(132, 82), r_elbow=(148, 110), r_hand=(160, 140),
    l_hip=(82, 160), l_knee=(72, 212), l_foot=(64, 254),           # plant leg
    r_hip=(118, 160), r_knee=(156, 184), r_foot=(196, 216),        # kick leg LOW / sweep
)

HIT = dict(
    head=(108, 40),
    sc=(106, 82),  ls=(74, 82),  rs=(138, 82),
    hc=(108, 163), lh=(92, 163), rh=(124, 163),
    l_shoulder=(74, 82),  l_elbow=(58, 108),  l_hand=(45, 80),
    r_shoulder=(138, 82), r_elbow=(150, 104), r_hand=(164, 78),
    l_hip=(92, 163), l_knee=(82, 212), l_foot=(74, 255),
    r_hip=(124, 163), r_knee=(134, 208), r_foot=(144, 253),
)

CROUCH = dict(
    head=(100, 70),
    sc=(100, 106), ls=(72, 106), rs=(128, 106),
    hc=(100, 158), lh=(82, 158), rh=(118, 158),
    l_shoulder=(72, 106), l_elbow=(60, 134), l_hand=(54, 110),
    r_shoulder=(128, 106), r_elbow=(140, 130), r_hand=(148, 106),
    l_hip=(82, 158), l_knee=(60, 204), l_foot=(56, 244),
    r_hip=(118, 158), r_knee=(140, 200), r_foot=(144, 244),
)

WIN = dict(
    head=(100, 30),
    sc=(100, 74),  ls=(66, 74),  rs=(134, 74),
    hc=(100, 156), lh=(82, 156), rh=(118, 156),
    l_shoulder=(66, 74),  l_elbow=(50, 94),  l_hand=(42, 62),
    r_shoulder=(134, 74), r_elbow=(150, 90), r_hand=(156, 58),
    l_hip=(82, 156), l_knee=(76, 206), l_foot=(70, 252),
    r_hip=(118, 156), r_knee=(124, 206), r_foot=(130, 252),
)

POSES = [
    ('idle',       IDLE,       0),
    ('walk',       WALK,       2),
    ('punch_high', PUNCH_HIGH, -3),
    ('punch_low',  PUNCH_LOW,  2),
    ('kick_high',  KICK_HIGH,  0),
    ('kick_low',   KICK_LOW,   3),
    ('hit',        HIT,        5),
    ('crouch',     CROUCH,     0),
    ('win',        WIN,        0),
]

SCHEMES = {
    'dummy': {
        'fill':      (60,  130, 220, 255),
        'outline':   (15,   30,  80, 255),
        'skin':      (255, 210, 160, 255),
        'hair':      (30,   25,  50, 255),
        'highlight': (180, 210, 255, 255),
    },
    'dummy_red': {
        'fill':      (220,  55,  55, 255),
        'outline':   ( 60,  10,  10, 255),
        'skin':      (255, 210, 160, 255),
        'hair':      ( 20,  10,  10, 255),
        'highlight': (255, 180, 180, 255),
    },
}

for char_id, colors in SCHEMES.items():
    out_dir = f'assets/characters/{char_id}'
    os.makedirs(out_dir, exist_ok=True)
    print(f'Generating {char_id}:')
    for name, pose, tilt in POSES:
        img  = make(pose, colors, tilt)
        path = f'{out_dir}/{name}.png'
        img.save(path)
        print(f'  {path}')

print('Done.')
