// Simple spark burst at impact point.

const COLORS  = ['#fff', '#ff0', '#f80', '#f44'];
const GRAVITY = 0.3;

class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 1.2) * 6;
    this.life    = 1;
    this.decay   = 0.07 + Math.random() * 0.06;
    this.radius  = 2 + Math.random() * 3;
    this.color   = COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  update() {
    this.vy   += GRAVITY;
    this.x    += this.vx;
    this.y    += this.vy;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle   = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class HitEffect {
  constructor(x, y, blocked = false) {
    const count = blocked ? 4 : 12;
    this.particles = Array.from({ length: count }, () => new Particle(x, y));

    // Flash ring
    this.ring       = { x, y, radius: 4, maxRadius: blocked ? 18 : 28, life: 1 };
    this.ringColor  = blocked ? '#88f' : '#ff8';
  }

  update() {
    this.particles.forEach(p => p.update());
    if (this.ring) {
      this.ring.radius += (this.ring.maxRadius - this.ring.radius) * 0.4;
      this.ring.life   -= 0.18;
      if (this.ring.life <= 0) this.ring = null;
    }
  }

  isDead() {
    return this.particles.every(p => p.life <= 0) && !this.ring;
  }

  draw(ctx) {
    ctx.save();

    if (this.ring) {
      ctx.globalAlpha  = this.ring.life;
      ctx.strokeStyle  = this.ringColor;
      ctx.lineWidth    = 3;
      ctx.beginPath();
      ctx.arc(this.ring.x, this.ring.y, this.ring.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    this.particles.forEach(p => p.draw(ctx));

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
