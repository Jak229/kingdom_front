/* Small math helpers. */
export const rnd = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export function lerpColor(c1, c2, t) {
  const r = lerp((c1 >> 16) & 255, (c2 >> 16) & 255, t),
    g = lerp((c1 >> 8) & 255, (c2 >> 8) & 255, t),
    b = lerp(c1 & 255, c2 & 255, t);
  return (r << 16) | (g << 8) | b;
}

export function roman(n) {
  const m = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I']
  ];
  let r = '';
  for (const [v, s] of m)
    while (n >= v) {
      r += s;
      n -= v;
    }
  return r;
}

export function rng(seed) {
  let q = seed >>> 0 || 1;
  return () => {
    q = (Math.imul(q, 1103515245) + 12345) >>> 0;
    return (q >>> 8) / 16777216;
  };
}
// a stable number from a string (FNV-1a), for things drawn by the date
export function hashStr(t) {
  let h = 2166136261;
  for (const ch of t) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
