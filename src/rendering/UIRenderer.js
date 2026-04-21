import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

const CX = CANVAS_WIDTH  / 2;
const CY = CANVAS_HEIGHT / 2;

export class UIRenderer {
  // Big centred announcement (e.g. "ROUND 1", "FIGHT!", "PLAYER 1 WINS")
  drawAnnouncement(ctx, text, opts = {}) {
    const fontSize  = opts.fontSize  || 52;
    const color     = opts.color     || '#fff';
    const subText   = opts.subText   || null;
    const y         = opts.y         || CY;
    const alpha     = opts.alpha     !== undefined ? opts.alpha : 1;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Shadow
    ctx.font        = `bold ${fontSize}px monospace`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle   = 'rgba(0,0,0,0.7)';
    ctx.fillText(text, CX + 3, y + 3);

    // Main text
    ctx.fillStyle = color;
    ctx.fillText(text, CX, y);

    if (subText) {
      ctx.font      = `bold ${Math.round(fontSize * 0.4)}px monospace`;
      ctx.fillStyle = '#aaa';
      ctx.fillText(subText, CX, y + fontSize * 0.65);
    }

    ctx.restore();
  }

  // MKII-style "FINISH HIM!" pulsing red text
  drawFinishHim(ctx, frame) {
    const pulse = 0.7 + 0.3 * Math.sin(frame * 0.2);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.font        = 'bold 48px monospace';
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle   = '#f00';
    ctx.fillText('FINISH HIM!', CX + 2, CY + 60 + 2);
    ctx.fillStyle   = '#f88';
    ctx.fillText('FINISH HIM!', CX, CY + 60);
    ctx.restore();
  }

  // Dark overlay (used between rounds, on freeze)
  drawDimOverlay(ctx, alpha = 0.45) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  // Round win indicator dots strip
  drawRoundBanner(ctx, round) {
    this.drawAnnouncement(ctx, `ROUND ${round}`, {
      fontSize: 48, color: '#ff0',
    });
  }
}
