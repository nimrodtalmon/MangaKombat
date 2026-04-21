export class StateMachine {
  constructor() {
    this._states  = {};
    this._current = null;
  }

  register(name, state) {
    this._states[name] = state;
    state.stateMachine  = this;
  }

  transition(name, params = {}) {
    if (this._current && this._current.exit) this._current.exit();
    this._current = this._states[name];
    if (!this._current) throw new Error(`Unknown game state: "${name}"`);
    this._current.enter(params);
  }

  update() {
    if (this._current && this._current.update) this._current.update();
  }

  render(ctx, interp) {
    if (this._current && this._current.render) this._current.render(ctx, interp);
  }
}
