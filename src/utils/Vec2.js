export class Vec2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  set(x, y)    { this.x = x; this.y = y; return this; }
  clone()      { return new Vec2(this.x, this.y); }
  addSelf(v)   { this.x += v.x; this.y += v.y; return this; }
  scaleSelf(s) { this.x *= s; this.y *= s; return this; }
}
