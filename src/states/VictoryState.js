import { UIRenderer } from '../rendering/UIRenderer.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

const HOLD_FRAMES = 300; // 5 seconds on victory screen

export class VictoryState {
  constructor() {
    this.stateMachine = null;
    this._ui          = new UIRenderer();
    this._params      = null;
    this._timer       = 0;
  }

  enter(params) {
    this._params = params;
    this._timer  = 0;
  }

  exit() {}

  update() {
    this._timer++;
    // After hold time, any confirm button returns to character select
  }

  handleInput(p1Input, p2Input) {
    if (this._timer < 60) return; // minimum display time
    const anyButton = p1Input.hpPressed || p1Input.lpPressed ||
                      p2Input.hpPressed || p2Input.lpPressed;
    if (anyButton || this._timer >= HOLD_FRAMES) {
      this.stateMachine.transition('characterSelect', {});
    }
  }

  render(ctx) {
    // Black background with radial glow
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const cx = CANVAS_WIDTH / 2, cy = CANVAS_HEIGHT / 2;
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300);
    grd.addColorStop(0, 'rgba(80,0,0,0.6)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const winner = this._params?.winner;
    const alpha  = Math.min(1, this._timer / 30);

    if (winner === 0) {
      this._ui.drawAnnouncement(ctx, 'DRAW', {
        fontSize: 64, color: '#888', alpha,
      });
    } else {
      this._ui.drawAnnouncement(ctx, `PLAYER ${winner} WINS!`, {
        fontSize: 48, color: '#ff0', alpha,
      });
    }

    // Round wins tally
    const wins = this._params?.roundWins || [0, 0];
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = '#888';
    ctx.font        = '14px monospace';
    ctx.textAlign   = 'center';
    ctx.fillText(
      `P1 ${wins[0]}  —  P2 ${wins[1]}`,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80,
    );

    if (this._timer >= 60) {
      ctx.fillStyle = '#555';
      ctx.font      = '12px monospace';
      ctx.fillText('Press any attack button to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    }

    ctx.globalAlpha = 1;
  }
}
