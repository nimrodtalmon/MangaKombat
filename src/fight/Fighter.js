import { Vec2 }      from '../utils/Vec2.js';
import { FighterFSM } from './FighterFSM.js';
import { MAX_HEALTH } from '../constants.js';

export class Fighter {
  constructor(charData, spriteImages, startX, startY) {
    this.charData = charData;
    this.sprites  = spriteImages; // { idle: Image, walk: Image, ... }

    this.pos = new Vec2(startX, startY);
    this.vel = new Vec2(0, 0);

    this.health        = MAX_HEALTH;
    this.isFacingRight = true;
    this.airborne      = false;
    this.knockbackDecay = false;
    this.hitstunFrames  = 0;
    this.pendingHit     = null; // set by HitDetection, consumed by FSM

    this.fsm = new FighterFSM(charData);
  }

  get state()      { return this.fsm.state; }
  get stateFrame() { return this.fsm.stateFrame; }

  // Returns the Image/canvas for the current state sprite.
  getSprite() {
    const key = this.fsm.getSpriteName();
    return this.sprites[key] || Object.values(this.sprites)[0];
  }

  applyHit(hitData, isBlocked) {
    const dmg = isBlocked ? (hitData.blockDamage || 1) : hitData.damage;
    this.health = Math.max(0, this.health - dmg);
    // Always set pendingHit so the FSM can apply pushback even on block
    this.pendingHit = { ...hitData, isBlocked };
  }
}
