/* motion_kit.js — pure-function animation helpers. Inline into each storyboard.
 * Everything is a function of t (seconds): no timers, no state => deterministic rendering. */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
/** progress of t inside [a,b] -> 0..1 */
const seg = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  out: k => 1 - Math.pow(1 - k, 3),
  inOut: k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2,
  back: k => { const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
  elastic: k => k === 0 || k === 1 ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - .75) * (2 * Math.PI / 3)) + 1,
  expo: k => k === 1 ? 1 : 1 - Math.pow(2, -10 * k),
};
/** seeded PRNG (mulberry32) — algorithmic-art style reproducible randomness */
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/** cheap smooth value-noise (1D/2D) for flow fields */
function noise2(x, y, seed = 1) { const h = (i, j) => { let n = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453; return n - Math.floor(n); };
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v); }
/** point on a cubic bezier */
const bez = (p0, p1, p2, p3, k) => { const m = 1 - k; return [m*m*m*p0[0]+3*m*m*k*p1[0]+3*m*k*k*p2[0]+k*k*k*p3[0], m*m*m*p0[1]+3*m*m*k*p1[1]+3*m*k*k*p2[1]+k*k*k*p3[1]]; };
/** rounded rect path */
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
/** typewriter: returns the visible prefix of s at time t */
const typed = (s, t, a, cps = 40) => s.slice(0, Math.floor(clamp((t - a) * cps, 0, s.length)));
