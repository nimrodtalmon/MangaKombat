import { GRAVITY, FLOOR_Y, STAGE_LEFT, STAGE_RIGHT, KNOCKBACK_DECAY } from '../constants.js';
import { clamp } from '../utils/MathUtils.js';

// Advance one 60Hz physics tick for a fighter.
export function applyPhysics(fighter) {
  // Gravity while airborne
  if (fighter.pos.y < FLOOR_Y) {
    fighter.vel.y += GRAVITY;
  }

  fighter.pos.x += fighter.vel.x;
  fighter.pos.y += fighter.vel.y;

  // Land on floor
  if (fighter.pos.y >= FLOOR_Y) {
    fighter.pos.y  = FLOOR_Y;
    fighter.vel.y  = 0;
    fighter.airborne = false;
  } else {
    fighter.airborne = true;
  }

  // Stage walls
  fighter.pos.x = clamp(fighter.pos.x, STAGE_LEFT, STAGE_RIGHT);

  // Decay knockback velocity on the ground
  if (!fighter.airborne && fighter.knockbackDecay) {
    fighter.vel.x *= KNOCKBACK_DECAY;
    if (Math.abs(fighter.vel.x) < 0.1) {
      fighter.vel.x = 0;
      fighter.knockbackDecay = false;
    }
  }
}
