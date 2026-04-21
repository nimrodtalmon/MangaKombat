import { AABB } from '../utils/AABB.js';

// ---------------------------------------------------------------------------
// Default state definitions shared by all characters.
// character.json can override individual states via its "states" block.
// ---------------------------------------------------------------------------
const DEFAULT_STATES = {
  idle: {
    sprite: 'idle', duration: -1,
    transform: { oscillateY: 2, oscillatePeriod: 60 },
    hurtBoxes:  [{ box: { x: -22, y: -155, w: 44, h: 155 } }],
    attackBoxes: [],
  },
  walking: {
    sprite: 'walk', duration: -1,
    transform: { leanX: 7 },
    hurtBoxes:  [{ box: { x: -22, y: -155, w: 44, h: 155 } }],
    attackBoxes: [],
  },
  jump: {
    sprite: 'idle', duration: -1,
    transform: {},
    hurtBoxes:  [{ box: { x: -20, y: -145, w: 40, h: 145 } }],
    attackBoxes: [],
  },
  crouch: {
    sprite: 'crouch', duration: -1,
    transform: { scaleY: 0.62 },
    hurtBoxes:  [{ box: { x: -22, y: -95, w: 44, h: 95 } }],
    attackBoxes: [],
  },
  block: {
    sprite: 'idle', duration: -1,
    transform: { leanX: -10 },
    hurtBoxes:  [{ box: { x: -22, y: -155, w: 44, h: 155 } }],
    attackBoxes: [],
  },
  punch_high: {
    sprite: 'attack', duration: 22, nextState: 'idle',
    transform: { leanX: 14 },
    hurtBoxes:  [{ box: { x: -22, y: -155, w: 44, h: 155 } }],
    attackBoxes: [{
      startFrame: 5, endFrame: 10,
      box: { x: 22, y: -130, w: 52, h: 38 },
      damage: 8, hitstunFrames: 18, knockbackX: 5, blockDamage: 2,
    }],
  },
  kick_high: {
    sprite: 'attack', duration: 28, nextState: 'idle',
    transform: { leanX: 8 },
    hurtBoxes:  [{ box: { x: -22, y: -155, w: 44, h: 155 } }],
    attackBoxes: [{
      startFrame: 6, endFrame: 13,
      box: { x: 18, y: -138, w: 62, h: 42 },
      damage: 13, hitstunFrames: 22, knockbackX: 7, blockDamage: 3,
    }],
  },
  punch_low: {
    sprite: 'attack', duration: 20, nextState: 'idle',
    transform: { leanX: 10 },
    hurtBoxes:  [{ box: { x: -22, y: -155, w: 44, h: 155 } }],
    attackBoxes: [{
      startFrame: 4, endFrame: 9,
      box: { x: 22, y: -70, w: 46, h: 32 },
      damage: 5, hitstunFrames: 14, knockbackX: 3, blockDamage: 1,
    }],
  },
  kick_low: {
    sprite: 'attack', duration: 24, nextState: 'idle',
    transform: { leanX: 6 },
    hurtBoxes:  [{ box: { x: -22, y: -155, w: 44, h: 155 } }],
    attackBoxes: [{
      startFrame: 5, endFrame: 12,
      box: { x: 18, y: -85, w: 58, h: 36 },
      damage: 9, hitstunFrames: 19, knockbackX: 5, blockDamage: 2,
    }],
  },
  hitstun: {
    sprite: 'hit', duration: 20, nextState: 'idle',
    transform: { shakeX: 4, flashAlpha: true },
    hurtBoxes:  [{ box: { x: -22, y: -155, w: 44, h: 155 } }],
    attackBoxes: [],
  },
  ko: {
    sprite: 'hit', duration: -1,
    transform: { leanX: 80 },
    hurtBoxes:  [],
    attackBoxes: [],
  },
  win: {
    sprite: 'win', duration: -1,
    transform: { oscillateY: 4, oscillatePeriod: 35, leanX: 10 },
    hurtBoxes:  [],
    attackBoxes: [],
  },
};

// ---------------------------------------------------------------------------
export class FighterFSM {
  constructor(charData) {
    this.charData    = charData;
    this.state       = 'idle';
    this.stateFrame  = 0;
    this._hitLanded  = false; // true once an attack box connects this swing
  }

  // Call once per 60Hz tick. fighter = the owner, opponent = the other fighter.
  update(input, fighter) {
    this.stateFrame++;

    const sd = this.getStateData();

    // ── Auto-transition when timed state expires ──
    if (sd.duration > 0 && this.stateFrame >= sd.duration) {
      this.transition(sd.nextState || 'idle');
      return;
    }

    // ── External hit event ──
    if (fighter.pendingHit) {
      const hit = fighter.pendingHit;
      fighter.pendingHit = null;

      if (fighter.health <= 0) {
        this.transition('ko');
        return;
      }

      if (hit.isBlocked) {
        // Blocked: chip damage already applied, small pushback only
        fighter.vel.x = (hit.knockbackX || 3) * 0.3 * (fighter.isFacingRight ? 1 : -1);
        fighter.knockbackDecay = true;
        return;
      }

      this.transition('hitstun');
      fighter.hitstunFrames  = hit.hitstunFrames || 20;
      fighter.vel.x          = hit.knockbackX * (fighter.isFacingRight ? 1 : -1);
      fighter.knockbackDecay = true;
      return;
    }

    // ── Terminal states ──
    if (this.state === 'ko' || this.state === 'win') return;

    // ── Hitstun: wait it out ──
    if (this.state === 'hitstun') {
      if (this.stateFrame >= fighter.hitstunFrames) this.transition('idle');
      return;
    }

    // ── Jump: wait for landing (detected in Physics via fighter.airborne) ──
    if (this.state === 'jump') {
      if (!fighter.airborne) this.transition('idle');
      return;
    }

    // ── Ground states ──
    this._handleGroundInput(input, fighter);
  }

  _handleGroundInput(input, fighter) {
    const isAttack = this._isAttackState();

    // Attacks are interruptible only by being hit (handled above); let them play out.
    if (isAttack) return;

    // Attack buttons (just-pressed, highest priority)
    if (input.hpPressed) { this.transition('punch_high'); return; }
    if (input.hkPressed) { this.transition('kick_high');  return; }
    if (input.lpPressed) { this.transition('punch_low');  return; }
    if (input.lkPressed) { this.transition('kick_low');   return; }

    // Jump
    if (input.upPressed && !fighter.airborne) {
      this.transition('jump');
      fighter.vel.y    = this.charData.stats.jumpVelocityY;
      fighter.airborne = true;
      return;
    }

    // Crouch (held)
    if (input.down) {
      if (this.state !== 'crouch') this.transition('crouch');
      fighter.vel.x = 0;
      return;
    }

    // Block (held)
    if (input.block) {
      if (this.state !== 'block') this.transition('block');
      fighter.vel.x = 0;
      return;
    }

    // Walk
    const speed = this.charData.stats.walkSpeed;
    if (input.right) {
      if (this.state !== 'walking') this.transition('walking');
      fighter.vel.x = speed;
      return;
    }
    if (input.left) {
      if (this.state !== 'walking') this.transition('walking');
      fighter.vel.x = -speed;
      return;
    }

    // Default: idle
    fighter.vel.x = 0;
    if (this.state !== 'idle') this.transition('idle');
  }

  transition(name) {
    this.state      = name;
    this.stateFrame = 0;
    this._hitLanded = false;
  }

  // Merge default state data with any character-specific overrides.
  getStateData() {
    const def = DEFAULT_STATES[this.state] || DEFAULT_STATES.idle;
    const ovr = this.charData.states?.[this.state];
    if (!ovr) return def;
    return {
      ...def,
      ...ovr,
      transform:   { ...(def.transform  || {}), ...(ovr.transform  || {}) },
      hurtBoxes:   ovr.hurtBoxes   ?? def.hurtBoxes,
      attackBoxes: ovr.attackBoxes ?? def.attackBoxes,
    };
  }

  // Returns the sprite-key string for the current state.
  getSpriteName() {
    const sd = this.getStateData();
    const key = sd.sprite || 'idle';
    // Fall back through the sprite map if key is missing
    return this.charData.sprites[key] ? key
         : this.charData.sprites.attack ? 'attack'
         : 'idle';
  }

  // Returns world-space AABB of the active attack box, or null.
  getAttackBox(fighter) {
    if (this._hitLanded) return null;
    const sd = this.getStateData();
    for (const atk of sd.attackBoxes) {
      if (this.stateFrame >= atk.startFrame && this.stateFrame <= atk.endFrame) {
        const b = atk.box;
        return {
          box:  new AABB(b.x, b.y, b.w, b.h).translated(
                  fighter.pos.x, fighter.pos.y, !fighter.isFacingRight),
          data: atk,
        };
      }
    }
    return null;
  }

  // Returns world-space AABB of the current hurt box, or null.
  getHurtBox(fighter) {
    const sd = this.getStateData();
    for (const hb of sd.hurtBoxes) {
      const b = hb.box;
      return new AABB(b.x, b.y, b.w, b.h).translated(
               fighter.pos.x, fighter.pos.y, !fighter.isFacingRight);
    }
    return null;
  }

  markHitLanded() { this._hitLanded = true; }

  _isAttackState() {
    return this.state === 'punch_high' || this.state === 'kick_high' ||
           this.state === 'punch_low'  || this.state === 'kick_low';
  }
}
