// Draws a Fighter using canvas transforms to animate 1–5 static drawings.
//
// Transform params (from state data):
//   oscillateY   – vertical bob amplitude (px); uses stateFrame + oscillatePeriod
//   oscillatePeriod – frames per full bob cycle (default 60)
//   leanX        – rotation around foot pivot in degrees (+forward, -backward)
//   scaleY       – vertical scale (1 = normal, 0.62 = crouch)
//   shakeX       – alternating ±shakeX px offset (hit reaction)
//   flashAlpha   – true = draw at 30% alpha on even 4-frame intervals (MKII hit flash)

const TARGET_HEIGHT = 170; // normalised character height in pixels

export class SpriteRenderer {
  draw(ctx, fighter) {
    const img = fighter.getSprite();
    if (!img) return;

    const sd  = fighter.fsm.getStateData();
    const t   = sd.transform || {};
    const sf  = fighter.stateFrame;

    // Flash: skip drawing on certain frames (hitstun white-flash effect)
    if (t.flashAlpha) {
      const cycle = Math.floor(sf / 2) % 2;
      if (cycle === 0) {
        ctx.globalAlpha = 0.25;
      }
    }

    // Scale image to TARGET_HEIGHT, then apply spriteConfig scale
    const cfgScale  = fighter.charData.spriteConfig?.scale ?? 1;
    const srcH      = img.naturalHeight || img.height || TARGET_HEIGHT;
    const autoScale = (TARGET_HEIGHT / srcH) * cfgScale;
    const drawW     = (img.naturalWidth  || img.width  || 80) * autoScale;
    const drawH     = srcH * autoScale;

    ctx.save();
    ctx.translate(fighter.pos.x, fighter.pos.y);

    // Flip for left-facing character
    if (!fighter.isFacingRight) ctx.scale(-1, 1);

    // Oscillate Y (idle breathing, win pose)
    if (t.oscillateY) {
      const period = t.oscillatePeriod || 60;
      const osc    = Math.sin(sf * Math.PI * 2 / period) * t.oscillateY;
      ctx.translate(0, osc);
    }

    // Lean (rotation around foot)
    if (t.leanX) ctx.rotate(t.leanX * Math.PI / 180);

    // Shake (hitstun)
    if (t.shakeX) {
      ctx.translate((sf % 2 === 0 ? 1 : -1) * t.shakeX, 0);
    }

    // Vertical scale (crouch squish from foot upward)
    const sy = t.scaleY || 1;
    if (sy !== 1) ctx.scale(1, sy);

    // Draw — foot at origin, image extends upward
    ctx.drawImage(img, -drawW / 2, -drawH, drawW, drawH);

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
