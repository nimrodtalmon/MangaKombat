const ACTIONS = ['left', 'right', 'up', 'down', 'block', 'hp', 'hk', 'lp', 'lk'];

export class AIController {
  constructor() {
    this._decision = {};
    this._prev     = {};
    this._timer    = 0;
  }

  getSnapshot(self, opponent) {
    if (--this._timer <= 0) this._decide(self, opponent);

    const snap = {};
    for (const a of ACTIONS) {
      snap[a]             = !!this._decision[a];
      snap[a + 'Pressed'] = !!this._decision[a] && !this._prev[a];
    }
    this._prev = { ...this._decision };
    return snap;
  }

  _decide(self, opponent) {
    const adx = Math.abs(opponent.pos.x - self.pos.x);
    const movingRight = self.pos.x < opponent.pos.x;
    const d = {};

    if (adx > 180) {
      // Far — close the gap
      d[movingRight ? 'right' : 'left'] = true;
    } else if (adx > 80) {
      // Mid range — attack
      const attacks = ['hp', 'lp', 'hk', 'lk'];
      d[attacks[Math.random() * attacks.length | 0]] = true;
    } else {
      // Too close — back off or block
      if (Math.random() < 0.25) {
        d.block = true;
      } else {
        d[movingRight ? 'left' : 'right'] = true;
      }
    }

    // Occasional jump
    if (!self.airborne && Math.random() < 0.08) d.up = true;

    this._decision = d;
    this._timer    = 25 + (Math.random() * 20 | 0);
  }
}
