import { CANVAS_WIDTH, CANVAS_HEIGHT, FLOOR_Y, HUD_HEIGHT } from '../constants.js';

// Procedural stage background drawn until real assets are added.
// stageData is the parsed stage.json (may be null → use defaults).

export class Stage {
  constructor(stageData) {
    this.data = stageData || {};
    this._cache = null; // cached background canvas
  }

  // Build a static background into an offscreen canvas once.
  _buildCache() {
    const c   = document.createElement('canvas');
    c.width   = CANVAS_WIDTH;
    c.height  = CANVAS_HEIGHT;
    const ctx = c.getContext('2d');

    const skyTop    = this.data.skyTop    || '#0a0a1a';
    const skyBottom = this.data.skyBottom || '#1a0a2a';
    const floorCol  = this.data.floorColor || '#1a1008';
    const midCol    = this.data.midColor   || '#2a1a04';

    // Sky gradient
    const grad = ctx.createLinearGradient(0, HUD_HEIGHT, 0, FLOOR_Y);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(1, skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, FLOOR_Y - HUD_HEIGHT);

    // Distant platform / architecture silhouettes
    ctx.fillStyle = midCol;
    this._drawArch(ctx, CANVAS_WIDTH * 0.5, FLOOR_Y - 120, 320, 120);
    this._drawArch(ctx, CANVAS_WIDTH * 0.15, FLOOR_Y - 80, 160, 80);
    this._drawArch(ctx, CANVAS_WIDTH * 0.85, FLOOR_Y - 80, 160, 80);

    // Floor
    const floorGrad = ctx.createLinearGradient(0, FLOOR_Y, 0, CANVAS_HEIGHT);
    floorGrad.addColorStop(0, floorCol);
    floorGrad.addColorStop(1, '#0a0804');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, FLOOR_Y, CANVAS_WIDTH, CANVAS_HEIGHT - FLOOR_Y);

    // Floor line
    ctx.strokeStyle = '#5a4010';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    ctx.lineTo(CANVAS_WIDTH, FLOOR_Y);
    ctx.stroke();

    // Subtle floor tiles
    ctx.strokeStyle = 'rgba(90,64,16,0.3)';
    ctx.lineWidth   = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    return c;
  }

  _drawArch(ctx, cx, y, width, height) {
    ctx.beginPath();
    ctx.moveTo(cx - width / 2, y + height);
    ctx.lineTo(cx - width / 2, y + height * 0.4);
    ctx.quadraticCurveTo(cx, y, cx + width / 2, y + height * 0.4);
    ctx.lineTo(cx + width / 2, y + height);
    ctx.closePath();
    ctx.fill();
  }

  draw(ctx) {
    if (!this._cache) this._cache = this._buildCache();
    ctx.drawImage(this._cache, 0, 0);
  }
}
