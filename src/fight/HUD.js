import { CANVAS_WIDTH, MAX_HEALTH, ROUND_SECONDS } from '../constants.js';

const BAR_W      = 290;
const BAR_H      = 22;
const BAR_Y      = 18;
const P1_BAR_X   = 30;
const P2_BAR_X   = CANVAS_WIDTH - P1_BAR_X - BAR_W;
const TIMER_CX   = CANVAS_WIDTH / 2;

export class HUD {
  draw(ctx, p1, p2, timeRemaining, roundWins, round) {
    // Dark HUD strip
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 55);

    // Round win dots
    this._drawWinDots(ctx, roundWins[0], P1_BAR_X, 5, true);
    this._drawWinDots(ctx, roundWins[1], P2_BAR_X + BAR_W, 5, false);

    // Health bars
    this._drawHealthBar(ctx, p1.health, P1_BAR_X, BAR_Y, true,  p1.charData.color || '#00cc44');
    this._drawHealthBar(ctx, p2.health, P2_BAR_X, BAR_Y, false, p2.charData.color || '#00cc44');

    // Player name labels
    ctx.fillStyle    = '#fff';
    ctx.font         = 'bold 11px monospace';
    ctx.textAlign    = 'left';
    ctx.fillText(p1.charData.displayName.toUpperCase(), P1_BAR_X, BAR_Y - 4);
    ctx.textAlign    = 'right';
    ctx.fillText(p2.charData.displayName.toUpperCase(), P2_BAR_X + BAR_W, BAR_Y - 4);

    // Timer
    const t = Math.max(0, Math.ceil(timeRemaining));
    ctx.fillStyle = t <= 9 ? '#f44' : '#fff';
    ctx.font      = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(t).padStart(2, '0'), TIMER_CX, BAR_Y + BAR_H);
  }

  _drawHealthBar(ctx, health, x, y, facingRight, barColor) {
    const pct = Math.max(0, health / MAX_HEALTH);

    // Background (depleted)
    ctx.fillStyle = '#300';
    ctx.fillRect(x, y, BAR_W, BAR_H);

    // Determine bar color based on pct
    let col = barColor;
    if (pct < 0.5) col = '#cc8800';
    if (pct < 0.2) col = '#cc2200';

    // Fill drains from the outside edge toward the center
    const fillW = BAR_W * pct;
    if (facingRight) {
      ctx.fillStyle = col;
      ctx.fillRect(x, y, fillW, BAR_H);
    } else {
      ctx.fillStyle = col;
      ctx.fillRect(x + BAR_W - fillW, y, fillW, BAR_H);
    }

    // Thin bright highlight
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x, y, BAR_W, 4);

    // Border
    ctx.strokeStyle = '#888';
    ctx.lineWidth   = 1;
    ctx.strokeRect(x, y, BAR_W, BAR_H);
  }

  _drawWinDots(ctx, wins, anchorX, y, alignLeft) {
    const SIZE = 8;
    const GAP  = 12;
    for (let i = 0; i < 2; i++) {
      const dx = alignLeft ? anchorX + i * GAP : anchorX - (i + 1) * GAP;
      ctx.beginPath();
      ctx.arc(dx, y + SIZE / 2, SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = i < wins ? '#ff0' : '#333';
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth   = 1;
      ctx.stroke();
    }
  }
}
