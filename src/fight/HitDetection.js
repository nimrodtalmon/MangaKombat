// Each frame: check if attacker's active box overlaps defender's hurt box.
// Returns a hit descriptor if a new hit occurred, otherwise null.
export function detectHit(attacker, defender) {
  const atk = attacker.fsm.getAttackBox(attacker);
  if (!atk) return null;

  const hb = defender.fsm.getHurtBox(defender);
  if (!hb) return null;

  if (!atk.box.overlaps(hb)) return null;

  // Mark so this swing doesn't multi-hit
  attacker.fsm.markHitLanded();

  const isBlocked = defender.state === 'block' &&
                    // Must be facing attacker to block
                    (defender.isFacingRight !== attacker.isFacingRight);

  return { hitData: atk.data, isBlocked, defenderPos: { x: defender.pos.x, y: defender.pos.y } };
}
