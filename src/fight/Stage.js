import { CANVAS_WIDTH, CANVAS_HEIGHT, FLOOR_Y, HUD_HEIGHT } from '../constants.js';

// Renders a stage background.
// If stage.json contains a "background" filename (e.g. "background.png"), that
// image is loaded from the same folder and drawn scaled to fill the canvas.
// Falls back to a procedural painted background when no image is provided.

export class Stage {
  constructor(stageData) {
    this.data   = stageData || {};
    this._cache = null;  // procedural background cache
    this._bgImg = null;  // loaded background PNG (if any)
    this._bgReady = false;

    const { background, _basePath } = this.data;
    if (background && _basePath) {
      const img = new Image();
      img.onload  = () => { this._bgImg = img; this._bgReady = true; };
      img.onerror = () => { this._bgReady = true; /* fall back to procedural */ };
      img.src = `${_basePath}/${background}`;
    } else {
      this._bgReady = true;
    }
  }

  draw(ctx) {
    if (this._bgImg) {
      // Scale the image to cover the full canvas (behind HUD too — MKII style).
      ctx.drawImage(this._bgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Dark overlay on the floor strip so characters stand out.
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, FLOOR_Y, CANVAS_WIDTH, CANVAS_HEIGHT - FLOOR_Y);
    } else {
      // Procedural fallback — built once and cached.
      if (!this._cache) this._cache = this._buildCache();
      ctx.drawImage(this._cache, 0, 0);
    }
  }

  // ── Procedural background ─────────────────────────────────────────────────

  _buildCache() {
    const c   = document.createElement('canvas');
    c.width   = CANVAS_WIDTH;
    c.height  = CANVAS_HEIGHT;
    const ctx = c.getContext('2d');

    const skyTop   = this.data.skyTop    || '#0a0a1a';
    const skyBot   = this.data.skyBottom || '#1a0a2a';
    const floorCol = this.data.floorColor || '#1a1008';
    const midCol   = this.data.midColor   || '#2a1a04';

    // Sky gradient
    const grad = ctx.createLinearGradient(0, HUD_HEIGHT, 0, FLOOR_Y);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(1, skyBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, FLOOR_Y - HUD_HEIGHT);

    // Architecture silhouettes
    ctx.fillStyle = midCol;
    this._arch(ctx, CANVAS_WIDTH * 0.5,  FLOOR_Y - 120, 320, 120);
    this._arch(ctx, CANVAS_WIDTH * 0.15, FLOOR_Y -  80, 160,  80);
    this._arch(ctx, CANVAS_WIDTH * 0.85, FLOOR_Y -  80, 160,  80);

    // Floor
    const fg = ctx.createLinearGradient(0, FLOOR_Y, 0, CANVAS_HEIGHT);
    fg.addColorStop(0, floorCol);
    fg.addColorStop(1, '#0a0804');
    ctx.fillStyle = fg;
    ctx.fillRect(0, FLOOR_Y, CANVAS_WIDTH, CANVAS_HEIGHT - FLOOR_Y);

    // Floor line
    ctx.strokeStyle = '#5a4010';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y); ctx.lineTo(CANVAS_WIDTH, FLOOR_Y);
    ctx.stroke();

    // Tile grid
    ctx.strokeStyle = 'rgba(90,64,16,0.3)';
    ctx.lineWidth   = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    return c;
  }

  _arch(ctx, cx, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, y + h);
    ctx.lineTo(cx - w / 2, y + h * 0.4);
    ctx.quadraticCurveTo(cx, y, cx + w / 2, y + h * 0.4);
    ctx.lineTo(cx + w / 2, y + h);
    ctx.closePath();
    ctx.fill();
  }
}
