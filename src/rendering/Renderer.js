import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

// Master compositor. Each game state calls its own render logic;
// this class mainly owns the canvas clear and any global post-processing.

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    canvas.width  = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
  }

  beginFrame() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  get context() { return this.ctx; }
}
