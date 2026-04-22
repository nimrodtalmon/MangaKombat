// Spatial layout mirrors MKII arcade stick:
//  Q  W  E      (high punch | jump | high kick)
//  A  S  D      (left       | block| right     )
//  Z  X  C      (low punch  | down | low kick  )
//
// P2 mirrors on numpad:
//  7  8  9      (high punch | jump | high kick)
//  4  5  6      (left       | block| right     )
//  1  2  3      (low punch  | down | low kick  )

const P1_MAP = {
  KeyA: 'left', KeyD: 'right', KeyW: 'up',   KeyX: 'down',
  KeyS: 'block', KeyQ: 'hp',   KeyE: 'hk',   KeyZ: 'lp',  KeyC: 'lk',
};
const P2_MAP = {
  Numpad4: 'left', Numpad6: 'right', Numpad8: 'up',   Numpad2: 'down',
  Numpad5: 'block', Numpad7: 'hp',   Numpad9: 'hk',   Numpad1: 'lp',  Numpad3: 'lk',
};

const GAME_KEYS = new Set([...Object.keys(P1_MAP), ...Object.keys(P2_MAP)]);

export class InputManager {
  constructor() {
    this._held        = new Set();
    this._justPressed = new Set();

    // Touch state for P1 (mobile on-screen buttons)
    this._touch1     = {};
    this._touchJust1 = new Set();

    window.addEventListener('keydown', e => {
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      if (!this._held.has(e.code)) this._justPressed.add(e.code);
      this._held.add(e.code);
    });
    window.addEventListener('keyup', e => {
      this._held.delete(e.code);
    });
  }

  // Called by mobile touch controls: action = 'left'|'right'|'up'|'down'|'hp'|etc.
  setTouchP1(action, pressed) {
    if (pressed && !this._touch1[action]) this._touchJust1.add(action);
    if (!pressed) this._touchJust1.delete(action);
    this._touch1[action] = pressed;
  }

  // Call after all game logic for the frame has consumed justPressed.
  endFrame() {
    this._justPressed.clear();
    this._touchJust1.clear();
  }

  // Returns a snapshot for the given player (1 or 2).
  // Each action key: held state + a <action>Pressed flag (true only on first frame).
  getSnapshot(player) {
    const map = player === 1 ? P1_MAP : P2_MAP;
    const s   = {};
    for (const [code, action] of Object.entries(map)) {
      const kbHeld    = this._held.has(code);
      const kbPressed = this._justPressed.has(code);
      if (player === 1) {
        s[action]             = kbHeld    || !!this._touch1[action];
        s[action + 'Pressed'] = kbPressed || this._touchJust1.has(action);
      } else {
        s[action]             = kbHeld;
        s[action + 'Pressed'] = kbPressed;
      }
    }
    return s;
  }
}
