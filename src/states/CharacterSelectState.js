import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

// Each entry in ROSTER must correspond to a folder under assets/characters/.
// Add character IDs here when adding new fighters.
// Add character IDs here once their PNG sprites are in assets/characters/<id>/
export const ROSTER = ['dummy', 'dummy_red', 'punkman'];

const PORTRAIT_SIZE = 110;
const COLS          = 4;
const GAP           = 20;
const GRID_TOP      = 160;

export class CharacterSelectState {
  constructor(assetLoader) {
    this.assetLoader = assetLoader;
    this.stateMachine = null; // injected by StateMachine.register

    this._portraits  = {}; // id → Image
    this._charData   = {}; // id → parsed JSON
    this._cursor     = [0, 1]; // [p1Index, p2Index]
    this._confirmed  = [false, false];
    this._frame      = 0;
    this._ready      = false;
  }

  async enter() {
    this._cursor    = [0, Math.min(1, ROSTER.length - 1)];
    this._confirmed = [false, false];
    this._frame     = 0;
    this._ready     = false;

    // Load all character data and portraits
    for (const id of ROSTER) {
      const data = await this.assetLoader.loadJSON(`assets/characters/${id}/character.json`);
      this._charData[id]   = data;
      this._portraits[id]  = await this.assetLoader.loadImage(
        `assets/characters/${id}/${data.sprites.idle}`,
        data.color || '#888',
      );
    }
    this._ready = true;
  }

  exit() {}

  update() {
    if (!this._ready) return;
    this._frame++;
    // Input is handled inline via stored snapshot — pull from context
  }

  handleInput(p1Input, p2Input) {
    if (!this._ready) return;

    if (!this._confirmed[0]) {
      if (p1Input.rightPressed) this._cursor[0] = (this._cursor[0] + 1) % ROSTER.length;
      if (p1Input.leftPressed)  this._cursor[0] = (this._cursor[0] - 1 + ROSTER.length) % ROSTER.length;
      if (p1Input.downPressed)  this._cursor[0] = (this._cursor[0] + COLS) % ROSTER.length;
      if (p1Input.upPressed)    this._cursor[0] = (this._cursor[0] - COLS + ROSTER.length) % ROSTER.length;
      if (p1Input.hpPressed || p1Input.lpPressed) this._confirmed[0] = true;
    }

    if (!this._confirmed[1]) {
      if (p2Input.rightPressed) this._cursor[1] = (this._cursor[1] + 1) % ROSTER.length;
      if (p2Input.leftPressed)  this._cursor[1] = (this._cursor[1] - 1 + ROSTER.length) % ROSTER.length;
      if (p2Input.downPressed)  this._cursor[1] = (this._cursor[1] + COLS) % ROSTER.length;
      if (p2Input.upPressed)    this._cursor[1] = (this._cursor[1] - COLS + ROSTER.length) % ROSTER.length;
      if (p2Input.hpPressed || p2Input.lpPressed) this._confirmed[1] = true;
    }

    if (this._confirmed[0] && this._confirmed[1]) {
      const p1Id = ROSTER[this._cursor[0]];
      const p2Id = ROSTER[this._cursor[1]];
      this.stateMachine.transition('roundAnnounce', {
        p1CharId: p1Id, p2CharId: p2Id,
        round: 1, roundWins: [0, 0],
      });
    }
  }

  render(ctx) {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Title
    ctx.fillStyle    = '#f00';
    ctx.font         = 'bold 36px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('MANGAKOMBAT', CANVAS_WIDTH / 2, 18);

    ctx.fillStyle = '#ff0';
    ctx.font      = 'bold 14px monospace';
    ctx.fillText('SELECT YOUR FIGHTER', CANVAS_WIDTH / 2, 62);

    ctx.fillStyle = '#888';
    ctx.font      = '11px monospace';
    ctx.fillText('P1: Q/E/Z/C to confirm   P2: Numpad 7/9/1/3 to confirm', CANVAS_WIDTH / 2, 84);

    if (!this._ready) {
      ctx.fillStyle = '#fff';
      ctx.font      = '18px monospace';
      ctx.fillText('Loading...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      return;
    }

    // Portrait grid
    const totalW = COLS * PORTRAIT_SIZE + (COLS - 1) * GAP;
    const startX = (CANVAS_WIDTH - totalW) / 2;

    ROSTER.forEach((id, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x   = startX + col * (PORTRAIT_SIZE + GAP);
      const y   = GRID_TOP + row * (PORTRAIT_SIZE + GAP + 20);

      // Slot background
      const isP1 = this._cursor[0] === i;
      const isP2 = this._cursor[1] === i;
      ctx.fillStyle = '#111';
      ctx.fillRect(x, y, PORTRAIT_SIZE, PORTRAIT_SIZE);

      // Portrait image
      const img = this._portraits[id];
      if (img) ctx.drawImage(img, x, y, PORTRAIT_SIZE, PORTRAIT_SIZE);

      // Cursor highlight
      if (isP1) {
        ctx.strokeStyle = this._confirmed[0] ? '#0f0' : '#00f';
        ctx.lineWidth   = isP1 && isP2 ? 3 : 4;
        ctx.strokeRect(x - 2, y - 2, PORTRAIT_SIZE + 4, PORTRAIT_SIZE + 4);
      }
      if (isP2) {
        ctx.strokeStyle = this._confirmed[1] ? '#0f0' : '#f00';
        ctx.lineWidth   = 4;
        ctx.strokeRect(x + (isP1 ? 2 : -2), y + (isP1 ? 2 : -2), PORTRAIT_SIZE - 4, PORTRAIT_SIZE - 4);
      }

      // Name
      ctx.fillStyle    = '#fff';
      ctx.font         = 'bold 12px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(
        (this._charData[id]?.displayName || id).toUpperCase(),
        x + PORTRAIT_SIZE / 2, y + PORTRAIT_SIZE + 4,
      );
    });

    // Confirmed labels
    ctx.font      = 'bold 13px monospace';
    ctx.textAlign = 'left';
    if (this._confirmed[0]) {
      ctx.fillStyle = '#0f0';
      ctx.fillText('P1 READY', 20, CANVAS_HEIGHT - 30);
    } else {
      ctx.fillStyle = '#00f';
      ctx.fillText('P1 CHOOSING...', 20, CANVAS_HEIGHT - 30);
    }
    ctx.textAlign = 'right';
    if (this._confirmed[1]) {
      ctx.fillStyle = '#0f0';
      ctx.fillText('P2 READY', CANVAS_WIDTH - 20, CANVAS_HEIGHT - 30);
    } else {
      ctx.fillStyle = '#f00';
      ctx.fillText('P2 CHOOSING...', CANVAS_WIDTH - 20, CANVAS_HEIGHT - 30);
    }
  }
}
