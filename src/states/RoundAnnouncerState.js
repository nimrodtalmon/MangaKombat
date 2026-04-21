import { UIRenderer } from '../rendering/UIRenderer.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

// Shows "ROUND N" → pause → "FIGHT!" → transitions to fight.
// Also used after a round ends to briefly show the result before next round.

const PHASE = Object.freeze({ ROUND: 0, FIGHT: 1 });

export class RoundAnnouncerState {
  constructor(assetLoader) {
    this.assetLoader  = assetLoader;
    this.stateMachine = null;
    this._ui          = new UIRenderer();
    this._params      = {};
    this._phase       = PHASE.ROUND;
    this._timer       = 0;
  }

  enter(params) {
    this._params = params;
    this._phase  = PHASE.ROUND;
    this._timer  = 0;
  }

  exit() {}

  update() {
    this._timer++;

    if (this._phase === PHASE.ROUND && this._timer >= 90) { // 1.5s
      this._phase = PHASE.FIGHT;
      this._timer = 0;
    }

    if (this._phase === PHASE.FIGHT && this._timer >= 60) { // 1s
      this.stateMachine.transition('fight', this._params);
    }
  }

  render(ctx) {
    // Dark background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle grid lines (atmosphere)
    ctx.strokeStyle = '#111';
    ctx.lineWidth   = 1;
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }

    const alpha = Math.min(1, this._timer / 15); // fade in

    if (this._phase === PHASE.ROUND) {
      const r = this._params.round || 1;
      this._ui.drawAnnouncement(ctx, `ROUND ${r}`, {
        fontSize: 56, color: '#ff0', alpha,
        subText: this._roundSubtext(r),
      });
    } else {
      this._ui.drawAnnouncement(ctx, 'FIGHT!', {
        fontSize: 64, color: '#f00', alpha,
      });
    }
  }

  _roundSubtext(round) {
    if (round === 1) return null;
    const w = this._params.roundWins || [0, 0];
    return `P1 ${w[0]} — P2 ${w[1]}`;
  }
}
