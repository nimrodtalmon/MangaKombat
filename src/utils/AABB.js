export class AABB {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }

  overlaps(o) {
    return this.x < o.x + o.w && this.x + this.w > o.x &&
           this.y < o.y + o.h && this.y + this.h > o.y;
  }

  // Translate box from character-local space to world space.
  // flipX mirrors the x-offset (for left-facing characters).
  translated(ox, oy, flipX = false) {
    const x = flipX ? ox - this.x - this.w : ox + this.x;
    return new AABB(x, oy + this.y, this.w, this.h);
  }
}
