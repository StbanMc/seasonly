// Tiny seedable PRNG so particle layouts can be made deterministic for
// tests and snapshots, while production callers fall back to Math.random.
// Implementation: Mulberry32 — 32-bit, ~2^32 period, fine for visual jitter
// (NOT a cryptographic PRNG — never use for tokens, IDs, or auth).

function unseeded() {
  return {
    next() { return Math.random(); },
    range(min, max) { return min + Math.random() * (max - min); },
    int(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    seeded: false,
  };
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed) {
  if (seed == null) return unseeded();
  if (!Number.isFinite(seed)) {
    throw new TypeError('createRng: seed must be a finite number or null/undefined');
  }
  const next = mulberry32(seed);
  return {
    next() { return next(); },
    range(min, max) { return min + next() * (max - min); },
    int(min, max) { return Math.floor(min + next() * (max - min + 1)); },
    pick(arr) {
      if (!Array.isArray(arr) || arr.length === 0) return undefined;
      return arr[Math.floor(next() * arr.length)];
    },
    seeded: true,
  };
}
