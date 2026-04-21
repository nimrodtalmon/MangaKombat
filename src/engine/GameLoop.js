const FIXED_STEP_MS = 1000 / 60;

export class GameLoop {
  constructor(updateFn, renderFn) {
    this._update  = updateFn;
    this._render  = renderFn;
    this._running = false;
    this._lastTime = 0;
    this._accumulator = 0;
    this._rafId = null;
    this._frame = this._frame.bind(this);
  }

  start() {
    this._running   = true;
    this._lastTime  = performance.now();
    this._accumulator = 0;
    this._rafId = requestAnimationFrame(this._frame);
  }

  stop() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  _frame(timestamp) {
    if (!this._running) return;

    let delta = timestamp - this._lastTime;
    this._lastTime = timestamp;
    if (delta > 200) delta = 200; // prevent spiral of death on tab switch

    this._accumulator += delta;
    while (this._accumulator >= FIXED_STEP_MS) {
      this._update();
      this._accumulator -= FIXED_STEP_MS;
    }

    this._render(this._accumulator / FIXED_STEP_MS);
    this._rafId = requestAnimationFrame(this._frame);
  }
}
