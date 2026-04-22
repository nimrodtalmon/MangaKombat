// Brawl-Stars-style dual joystick overlay drawn on the game canvas.
// Left joystick  → movement (left/right/up/down)
// Right joystick → attacks (N=HP, S=LP, E=HK, W=LK) or hold-centre=block
//
// The joystick base appears where the player touches (dynamic origin).
// touch.update(inputManager) must be called once per game-logic tick,
// before inputManager.getSnapshot(1) is used.

const DEAD   = 22;   // pixels from joystick centre before registering input
const MAX_R  = 52;   // visual clamp radius for the knob
const HINT_L = { x: 110, y: 400 };   // ghost indicator position (left)
const HINT_R = { x: 690, y: 400 };   // ghost indicator position (right)

const ACTIONS = ['left','right','up','down','block','hp','hk','lp','lk'];

export class TouchControls {
  constructor(canvas) {
    this._canvas = canvas;
    this._left   = null;   // { id, cx, cy, px, py }
    this._right  = null;

    canvas.addEventListener('touchstart',  e => this._onStart(e),  { passive: false });
    canvas.addEventListener('touchmove',   e => this._onMove(e),   { passive: false });
    canvas.addEventListener('touchend',    e => this._onEnd(e),    { passive: false });
    canvas.addEventListener('touchcancel', e => this._onEnd(e),    { passive: false });
  }

  // ── Touch event handlers ──────────────────────────────────────────────────

  _toGame(clientX, clientY) {
    const r   = this._canvas.getBoundingClientRect();
    const scl = 800 / r.width;
    return { x: (clientX - r.left) * scl, y: (clientY - r.top) * scl };
  }

  _onStart(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const g = this._toGame(t.clientX, t.clientY);
      if (g.x < 400 && !this._left) {
        this._left  = { id: t.identifier, cx: g.x, cy: g.y, px: g.x, py: g.y };
      } else if (g.x >= 400 && !this._right) {
        this._right = { id: t.identifier, cx: g.x, cy: g.y, px: g.x, py: g.y };
      }
    }
  }

  _onMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const g = this._toGame(t.clientX, t.clientY);
      if (this._left  && t.identifier === this._left.id)  { this._left.px  = g.x; this._left.py  = g.y; }
      if (this._right && t.identifier === this._right.id) { this._right.px = g.x; this._right.py = g.y; }
    }
  }

  _onEnd(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (this._left  && t.identifier === this._left.id)  this._left  = null;
      if (this._right && t.identifier === this._right.id) this._right = null;
    }
  }

  // ── Input computation ─────────────────────────────────────────────────────

  _leftActions() {
    if (!this._left) return {};
    const dx = this._left.px - this._left.cx;
    const dy = this._left.py - this._left.cy;
    return {
      left:  dx < -DEAD,
      right: dx >  DEAD,
      up:    dy < -DEAD,
      down:  dy >  DEAD,
    };
  }

  _rightActions() {
    if (!this._right) return {};
    const dx  = this._right.px - this._right.cx;
    const dy  = this._right.py - this._right.cy;
    const mag = Math.hypot(dx, dy);
    if (mag < DEAD) return { block: true };

    const a = Math.atan2(dy, dx) * 180 / Math.PI;
    if      (a > -135 && a <= -45) return { hp: true };   // up   → high punch
    else if (a > -45  && a <=  45) return { hk: true };   // right → high kick
    else if (a >  45  && a <= 135) return { lp: true };   // down → low punch
    else                            return { lk: true };   // left → low kick
  }

  // Called once per game-logic tick; pushes state into InputManager.
  update(inputManager) {
    const curr = { ...this._leftActions(), ...this._rightActions() };
    for (const action of ACTIONS) {
      inputManager.setTouchP1(action, !!curr[action]);
    }
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  render(ctx) {
    this._drawStick(ctx, this._left,  HINT_L, 'move');
    this._drawStick(ctx, this._right, HINT_R, 'attack');
  }

  _drawStick(ctx, state, hint, type) {
    ctx.save();
    ctx.globalAlpha = 0.45;

    const bx = state ? state.cx : hint.x;
    const by = state ? state.cy : hint.y;

    // Outer ring
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(bx, by, MAX_R, 0, Math.PI * 2);
    ctx.stroke();

    // Direction labels for attack joystick
    if (type === 'attack') {
      ctx.fillStyle    = 'rgba(255,255,255,0.6)';
      ctx.font         = 'bold 9px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HP', bx,         by - MAX_R + 10);
      ctx.fillText('LP', bx,         by + MAX_R - 10);
      ctx.fillText('HK', bx + MAX_R - 12, by);
      ctx.fillText('LK', bx - MAX_R + 12, by);
    }

    // Knob
    let kx = bx, ky = by;
    if (state) {
      const dx  = state.px - state.cx;
      const dy  = state.py - state.cy;
      const mag = Math.hypot(dx, dy);
      const r   = Math.min(mag, MAX_R);
      if (mag > 0) { kx = bx + (dx / mag) * r; ky = by + (dy / mag) * r; }
    }

    ctx.fillStyle = type === 'attack' ? 'rgba(255,80,80,0.7)' : 'rgba(80,180,255,0.7)';
    ctx.beginPath();
    ctx.arc(kx, ky, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
