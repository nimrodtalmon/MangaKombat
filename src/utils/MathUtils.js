export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp  = (a, b, t)   => a + (b - a) * t;
export const sign  = (v)         => v > 0 ? 1 : v < 0 ? -1 : 0;
