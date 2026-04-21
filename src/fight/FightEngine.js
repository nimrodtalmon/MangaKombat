import { Fighter }        from './Fighter.js';
import { HUD }            from './HUD.js';
import { Stage }          from './Stage.js';
import { HitEffect }      from './HitEffect.js';
import { detectHit }      from './HitDetection.js';
import { applyPhysics }   from './Physics.js';
import { SpriteRenderer } from '../rendering/SpriteRenderer.js';
import { clamp }          from '../utils/MathUtils.js';
import {
  FLOOR_Y, STAGE_LEFT, STAGE_RIGHT, MIN_FIGHTER_DIST,
  ROUND_SECONDS,
} from '../constants.js';

export const FIGHT_RESULT = Object.freeze({
  NONE: 0, P1_WINS: 1, P2_WINS: 2, DRAW: 3,
});

export class FightEngine {
  constructor(p1CharData, p1Sprites, p2CharData, p2Sprites, stageData, inputManager, params = {}) {
    this.p1 = new Fighter(p1CharData, p1Sprites, 220, FLOOR_Y);
    this.p2 = new Fighter(p2CharData, p2Sprites, 580, FLOOR_Y);
    this.p1.isFacingRight = true;
    this.p2.isFacingRight = false;

    this.hud          = new HUD();
    this.stage        = new Stage(stageData);
    this.effects      = [];
    this.inputManager = inputManager;

    this.timeRemaining = ROUND_SECONDS;
    this._frameTick    = 0;
    this.result        = FIGHT_RESULT.NONE;
    this.frozen        = false; // true during "FINISH HIM!" / win freeze

    this.roundWins = params.roundWins || [0, 0];
    this.round     = params.round     || 1;

    // Debug: URL param ?debug=hitboxes
    this.showHitboxes = new URLSearchParams(location.search).get('debug') === 'hitboxes';
    this.godMode      = new URLSearchParams(location.search).get('godmode') === '1';
    const slowmo      = parseFloat(new URLSearchParams(location.search).get('slowmo'));
    this._slowmo = slowmo > 0 ? slowmo : 1;
  }

  freeze() { this.frozen = true; }

  update() {
    if (this.frozen) return;

    // Slowmo: skip frames
    this._slowmoCounter = (this._slowmoCounter || 0) + this._slowmo;
    if (this._slowmoCounter < 1) return;
    this._slowmoCounter -= 1;

    const p1Input = this.inputManager.getSnapshot(1);
    const p2Input = this.inputManager.getSnapshot(2);

    // FSM updates
    this.p1.fsm.update(p1Input, this.p1);
    this.p2.fsm.update(p2Input, this.p2);

    // Physics
    applyPhysics(this.p1);
    applyPhysics(this.p2);

    // Update facing based on relative positions
    if (this.p1.pos.x !== this.p2.pos.x) {
      this.p1.isFacingRight = this.p1.pos.x < this.p2.pos.x;
      this.p2.isFacingRight = this.p2.pos.x < this.p1.pos.x;
    }

    // Push apart on ground
    this._pushApart();

    // Hit detection
    this._checkHits();

    // Effects
    this.effects = this.effects.filter(e => !e.isDead());
    this.effects.forEach(e => e.update());

    // Timer
    this._frameTick++;
    if (this._frameTick >= 60) {
      this._frameTick = 0;
      this.timeRemaining = Math.max(0, this.timeRemaining - 1);
    }

    // Win conditions
    if (this.result === FIGHT_RESULT.NONE) this._checkWin();
  }

  _checkHits() {
    // P1 attacks P2
    const h1 = detectHit(this.p1, this.p2);
    if (h1) {
      if (!this.godMode) this.p2.applyHit(h1.hitData, h1.isBlocked);
      const impactX = (this.p1.pos.x + this.p2.pos.x) / 2;
      const impactY = this.p2.pos.y - 80;
      this.effects.push(new HitEffect(impactX, impactY, h1.isBlocked));
    }
    // P2 attacks P1
    const h2 = detectHit(this.p2, this.p1);
    if (h2) {
      if (!this.godMode) this.p1.applyHit(h2.hitData, h2.isBlocked);
      const impactX = (this.p1.pos.x + this.p2.pos.x) / 2;
      const impactY = this.p1.pos.y - 80;
      this.effects.push(new HitEffect(impactX, impactY, h2.isBlocked));
    }
  }

  _pushApart() {
    const dx = this.p2.pos.x - this.p1.pos.x;
    if (Math.abs(dx) < MIN_FIGHTER_DIST) {
      const overlap = (MIN_FIGHTER_DIST - Math.abs(dx)) / 2;
      const dir     = dx >= 0 ? 1 : -1;
      this.p1.pos.x = clamp(this.p1.pos.x - overlap * dir, STAGE_LEFT, STAGE_RIGHT);
      this.p2.pos.x = clamp(this.p2.pos.x + overlap * dir, STAGE_LEFT, STAGE_RIGHT);
    }
  }

  _checkWin() {
    const p1Dead = this.p1.health <= 0;
    const p2Dead = this.p2.health <= 0;
    const timeout = this.timeRemaining <= 0;

    if (p1Dead && p2Dead) {
      this.result = FIGHT_RESULT.DRAW;
    } else if (p2Dead || (timeout && this.p1.health > this.p2.health)) {
      this.result = FIGHT_RESULT.P1_WINS;
      this.p1.fsm.transition('win');
      this.p2.fsm.transition('ko');
    } else if (p1Dead || (timeout && this.p2.health > this.p1.health)) {
      this.result = FIGHT_RESULT.P2_WINS;
      this.p2.fsm.transition('win');
      this.p1.fsm.transition('ko');
    } else if (timeout) {
      this.result = FIGHT_RESULT.DRAW;
    }
  }

  isRoundOver() { return this.result !== FIGHT_RESULT.NONE; }

  render(ctx) {
    this.stage.draw(ctx);

    this._sr = this._sr || new SpriteRenderer();
    this._sr.draw(ctx, this.p1);
    this._sr.draw(ctx, this.p2);

    this.effects.forEach(e => e.draw(ctx));

    if (this.showHitboxes) this._drawHitboxes(ctx);

    this.hud.draw(ctx, this.p1, this.p2, this.timeRemaining, this.roundWins, this.round);
  }

  _drawHitboxes(ctx) {
    const drawBox = (aabb, color) => {
      if (!aabb) return;
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.strokeRect(aabb.x, aabb.y, aabb.w, aabb.h);
    };
    ctx.save();
    drawBox(this.p1.fsm.getHurtBox(this.p1),   'rgba(0,255,0,0.8)');
    drawBox(this.p1.fsm.getAttackBox(this.p1)?.box, 'rgba(255,0,0,0.8)');
    drawBox(this.p2.fsm.getHurtBox(this.p2),   'rgba(0,255,0,0.8)');
    drawBox(this.p2.fsm.getAttackBox(this.p2)?.box, 'rgba(255,0,0,0.8)');
    ctx.restore();
  }
}
