// Registry of every visual effect supported by <seasonly-particles>.
// Each effect declares:
//   - defaultCount   : how many particles to render by default
//   - maxCount       : safety cap (large values can melt low-end devices)
//   - css            : per-effect stylesheet fragment (keyframes + classes)
//   - randomize(i,r) : returns a flat spec object of CSS properties
//                      (camelCase) and optionally `glyph` (textContent).
//
// All randomization goes through the supplied RNG so tests can pin a seed
// and assert deterministic outputs.

import { createRng } from './particles-rng.js';

const CONFETTI_PALETTE = [
  '#ef4444', '#f59e0b', '#eab308', '#22c55e',
  '#3b82f6', '#a855f7', '#ec4899', '#06b6d4',
];

const BASE_CSS = `
:host {
  --seasonly-particles-z: 40;
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: var(--seasonly-particles-z);
  overflow: hidden;
  display: block;
  contain: layout paint;
}
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.particle {
  position: absolute;
  pointer-events: none;
  will-change: transform, opacity;
}
@media (max-width: 480px) {
  :host { --seasonly-mobile-fade: 0.6; }
  .particle { opacity: var(--seasonly-mobile-fade) !important; }
}
`;

const EFFECTS = {
  none: {
    defaultCount: 0,
    maxCount: 0,
    css: '',
    randomize: () => null,
  },

  snowflakes: {
    defaultCount: 18,
    maxCount: 60,
    glyphs: ['❄', '❅', '❆'],
    css: `
@keyframes seasonly-snow-fall {
  0%   { transform: translate3d(0, -10vh, 0) rotate(0deg); }
  50%  { transform: translate3d(20px, 50vh, 0) rotate(180deg); }
  100% { transform: translate3d(0, 110vh, 0) rotate(360deg); }
}
.snowflakes .particle {
  top: 0;
  color: #f8fafc;
  filter: drop-shadow(0 2px 4px rgba(255, 255, 255, 0.35));
  animation: seasonly-snow-fall linear infinite;
}
`,
    randomize(i, rng) {
      return {
        left: rng.range(0, 100).toFixed(2) + '%',
        fontSize: rng.int(12, 28) + 'px',
        opacity: rng.range(0.55, 1).toFixed(2),
        animationDuration: rng.range(8, 18).toFixed(2) + 's',
        animationDelay: '-' + rng.range(0, 18).toFixed(2) + 's',
        glyph: rng.pick(this.glyphs),
      };
    },
  },

  hearts: {
    defaultCount: 14,
    maxCount: 40,
    glyphs: ['💖', '💝', '💕', '❤️', '💗'],
    css: `
@keyframes seasonly-heart-float {
  0%   { transform: translate3d(0, 110vh, 0) scale(0.6); opacity: 0; }
  10%  { opacity: 1; }
  50%  { transform: translate3d(15px, 50vh, 0) scale(1); }
  90%  { opacity: 1; }
  100% { transform: translate3d(0, -10vh, 0) scale(0.85); opacity: 0; }
}
.hearts .particle {
  bottom: 0;
  animation: seasonly-heart-float linear infinite;
}
`,
    randomize(i, rng) {
      return {
        left: rng.range(0, 100).toFixed(2) + '%',
        fontSize: rng.int(14, 28) + 'px',
        animationDuration: rng.range(7, 14).toFixed(2) + 's',
        animationDelay: '-' + rng.range(0, 14).toFixed(2) + 's',
        glyph: rng.pick(this.glyphs),
      };
    },
  },

  confetti: {
    defaultCount: 26,
    maxCount: 80,
    css: `
@keyframes seasonly-confetti-fall {
  0%   { transform: translate3d(0, -10vh, 0) rotateZ(0) rotateX(0); opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translate3d(20px, 110vh, 0) rotateZ(720deg) rotateX(720deg); opacity: 0.85; }
}
.confetti .particle {
  top: 0;
  width: 8px;
  height: 12px;
  border-radius: 2px;
  animation: seasonly-confetti-fall linear infinite;
}
`,
    randomize(i, rng) {
      return {
        left: rng.range(0, 100).toFixed(2) + '%',
        backgroundColor: rng.pick(CONFETTI_PALETTE),
        animationDuration: rng.range(5, 11).toFixed(2) + 's',
        animationDelay: '-' + rng.range(0, 11).toFixed(2) + 's',
        transform: 'rotate(' + rng.int(0, 359) + 'deg)',
      };
    },
  },

  stars: {
    defaultCount: 16,
    maxCount: 50,
    glyphs: ['⭐', '✨', '✦', '✧'],
    css: `
@keyframes seasonly-twinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.7); }
  50%      { opacity: 1;   transform: scale(1.15); }
}
.stars .particle {
  filter: drop-shadow(0 0 6px rgba(253, 224, 71, 0.6));
  animation: seasonly-twinkle ease-in-out infinite;
}
`,
    randomize(i, rng) {
      return {
        left: rng.range(0, 100).toFixed(2) + '%',
        top: rng.range(0, 80).toFixed(2) + '%',
        fontSize: rng.int(12, 26) + 'px',
        animationDuration: rng.range(2, 5).toFixed(2) + 's',
        animationDelay: '-' + rng.range(0, 5).toFixed(2) + 's',
        glyph: rng.pick(this.glyphs),
      };
    },
  },

  candles: {
    defaultCount: 14,
    maxCount: 40,
    glyphs: ['🕯️'],
    css: `
@keyframes seasonly-candle-flicker {
  0%, 100% { opacity: 0.85; transform: scale(1) translateY(0); }
  25%      { opacity: 1;    transform: scale(1.06) translateY(-1px); }
  50%      { opacity: 0.7;  transform: scale(0.95) translateY(0); }
  75%      { opacity: 0.95; transform: scale(1.03) translateY(-0.5px); }
}
.candles .particle {
  bottom: 0;
  filter: drop-shadow(0 0 12px rgba(251, 146, 60, 0.7));
  animation: seasonly-candle-flicker ease-in-out infinite;
}
`,
    randomize(i, rng) {
      return {
        left: rng.range(0, 100).toFixed(2) + '%',
        fontSize: rng.int(20, 36) + 'px',
        animationDuration: rng.range(1.2, 2.4).toFixed(2) + 's',
        animationDelay: '-' + rng.range(0, 2.5).toFixed(2) + 's',
        glyph: this.glyphs[0],
      };
    },
  },

  fireworks: {
    defaultCount: 8,
    maxCount: 24,
    glyphs: ['✨', '💥', '🎆'],
    css: `
@keyframes seasonly-burst {
  0%   { transform: scale(0);   opacity: 0; }
  20%  { opacity: 1; }
  60%  { transform: scale(1.4); opacity: 0.6; }
  100% { transform: scale(2);   opacity: 0; }
}
.fireworks .particle {
  filter: drop-shadow(0 0 10px rgba(253, 224, 71, 0.8));
  animation: seasonly-burst ease-out infinite;
}
`,
    randomize(i, rng) {
      return {
        left: rng.range(5, 95).toFixed(2) + '%',
        top: rng.range(5, 60).toFixed(2) + '%',
        fontSize: rng.int(28, 48) + 'px',
        animationDuration: rng.range(2.5, 4.5).toFixed(2) + 's',
        animationDelay: '-' + rng.range(0, 5).toFixed(2) + 's',
        glyph: rng.pick(this.glyphs),
      };
    },
  },

  bats: {
    defaultCount: 8,
    maxCount: 20,
    glyphs: ['🦇'],
    css: `
@keyframes seasonly-fly-across {
  0%   { transform: translate3d(-15vw, 0, 0) rotate(-5deg); }
  50%  { transform: translate3d(50vw, -25px, 0) rotate(5deg); }
  100% { transform: translate3d(115vw, 0, 0) rotate(-5deg); }
}
.bats .particle {
  animation: seasonly-fly-across linear infinite;
}
`,
    randomize(i, rng) {
      return {
        top: rng.range(5, 70).toFixed(2) + '%',
        fontSize: rng.int(20, 34) + 'px',
        animationDuration: rng.range(8, 16).toFixed(2) + 's',
        animationDelay: '-' + rng.range(0, 16).toFixed(2) + 's',
        glyph: this.glyphs[0],
      };
    },
  },

  lightning: {
    defaultCount: 3,
    maxCount: 6,
    css: `
@keyframes seasonly-flash {
  0%, 92%, 100% { opacity: 0; }
  93%, 95%      { opacity: 0.55; }
  94%           { opacity: 0; }
  96%           { opacity: 0.85; }
  97%, 99%      { opacity: 0; }
  98%           { opacity: 0.4; }
}
.lightning .particle {
  inset: 0;
  background: radial-gradient(circle at var(--lx, 50%) 0%, rgba(255, 255, 255, 0.85), transparent 55%);
  animation: seasonly-flash ease-out infinite;
}
`,
    randomize(i, rng) {
      return {
        animationDuration: rng.range(6, 11).toFixed(2) + 's',
        animationDelay: '-' + rng.range(0, 11).toFixed(2) + 's',
        '--lx': rng.range(20, 80).toFixed(0) + '%',
      };
    },
  },

  kites: {
    defaultCount: 6,
    maxCount: 15,
    glyphs: ['🪁'],
    css: `
@keyframes seasonly-kite-sway {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(-12deg); }
  50%      { transform: translate3d(20px, 18px, 0) rotate(12deg); }
}
.kites .particle {
  animation: seasonly-kite-sway ease-in-out infinite;
}
`,
    randomize(i, rng) {
      return {
        left: rng.range(5, 90).toFixed(2) + '%',
        top: rng.range(5, 50).toFixed(2) + '%',
        fontSize: rng.int(28, 48) + 'px',
        animationDuration: rng.range(3, 6).toFixed(2) + 's',
        animationDelay: '-' + rng.range(0, 6).toFixed(2) + 's',
        glyph: this.glyphs[0],
      };
    },
  },

  flowers: {
    defaultCount: 12,
    maxCount: 36,
    glyphs: ['🌸', '🌺', '🌷', '🌼'],
    css: `
@keyframes seasonly-petal-fall {
  0%   { transform: translate3d(0, -10vh, 0) rotate(0); opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translate3d(15px, 110vh, 0) rotate(540deg); opacity: 0.65; }
}
.flowers .particle {
  top: 0;
  animation: seasonly-petal-fall linear infinite;
}
`,
    randomize(i, rng) {
      return {
        left: rng.range(0, 100).toFixed(2) + '%',
        fontSize: rng.int(16, 30) + 'px',
        animationDuration: rng.range(8, 16).toFixed(2) + 's',
        animationDelay: '-' + rng.range(0, 16).toFixed(2) + 's',
        glyph: rng.pick(this.glyphs),
      };
    },
  },

  balloons: {
    defaultCount: 10,
    maxCount: 24,
    glyphs: ['🎈'],
    css: `
@keyframes seasonly-balloon-rise {
  0%   { transform: translate3d(0, 110vh, 0); opacity: 1; }
  100% { transform: translate3d(20px, -10vh, 0); opacity: 0.7; }
}
.balloons .particle {
  bottom: 0;
  animation: seasonly-balloon-rise linear infinite;
}
`,
    randomize(i, rng) {
      return {
        left: rng.range(0, 100).toFixed(2) + '%',
        fontSize: rng.int(28, 48) + 'px',
        animationDuration: rng.range(10, 18).toFixed(2) + 's',
        animationDelay: '-' + rng.range(0, 18).toFixed(2) + 's',
        glyph: this.glyphs[0],
      };
    },
  },

  flags: {
    defaultCount: 6,
    maxCount: 16,
    glyphs: ['🚩', '🏳️'],
    css: `
@keyframes seasonly-flag-wave {
  0%, 100% { transform: skewX(-8deg) rotate(-4deg); }
  50%      { transform: skewX(8deg)  rotate(4deg); }
}
.flags .particle {
  transform-origin: top left;
  animation: seasonly-flag-wave ease-in-out infinite;
}
`,
    randomize(i, rng) {
      return {
        left: rng.range(5, 90).toFixed(2) + '%',
        top: rng.range(5, 60).toFixed(2) + '%',
        fontSize: rng.int(28, 44) + 'px',
        animationDuration: rng.range(1.4, 3).toFixed(2) + 's',
        animationDelay: '-' + rng.range(0, 3).toFixed(2) + 's',
        glyph: rng.pick(this.glyphs),
      };
    },
  },

  leaves: {
    defaultCount: 14,
    maxCount: 40,
    glyphs: ['🍂', '🍁'],
    css: `
@keyframes seasonly-leaf-fall {
  0%   { transform: translate3d(0, -10vh, 0) rotate(0); opacity: 0; }
  10%  { opacity: 1; }
  50%  { transform: translate3d(30px, 50vh, 0) rotate(180deg); }
  100% { transform: translate3d(-10px, 110vh, 0) rotate(360deg); opacity: 0.6; }
}
.leaves .particle {
  top: 0;
  animation: seasonly-leaf-fall linear infinite;
}
`,
    randomize(i, rng) {
      return {
        left: rng.range(0, 100).toFixed(2) + '%',
        fontSize: rng.int(18, 32) + 'px',
        animationDuration: rng.range(8, 14).toFixed(2) + 's',
        animationDelay: '-' + rng.range(0, 14).toFixed(2) + 's',
        glyph: rng.pick(this.glyphs),
      };
    },
  },

  petals: {
    defaultCount: 16,
    maxCount: 40,
    css: `
@keyframes seasonly-petal-drift {
  0%   { transform: translate3d(0, -10vh, 0) rotate(0); opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translate3d(40px, 110vh, 0) rotate(720deg); opacity: 0.7; }
}
.petals .particle {
  top: 0;
  width: 10px;
  height: 14px;
  border-radius: 50% 0 50% 0;
  animation: seasonly-petal-drift linear infinite;
}
`,
    randomize(i, rng) {
      const palette = ['#fda4af', '#fb7185', '#f472b6', '#fbcfe8'];
      return {
        left: rng.range(0, 100).toFixed(2) + '%',
        backgroundColor: rng.pick(palette),
        animationDuration: rng.range(7, 13).toFixed(2) + 's',
        animationDelay: '-' + rng.range(0, 13).toFixed(2) + 's',
      };
    },
  },
};

export function getEffect(name) {
  if (typeof name !== 'string') return null;
  return EFFECTS[name] || null;
}

export function listEffects() {
  return Object.keys(EFFECTS);
}

// Build the final stylesheet for an effect, including the shared base.
export function buildParticlesCSS(effectName) {
  const effect = getEffect(effectName);
  if (!effect) return BASE_CSS.trim();
  return (BASE_CSS + effect.css).trim();
}

// Generate the array of particle specs to render. `count` is optional
// (falls back to the effect's `defaultCount`) and is silently capped at
// `maxCount`. Returns [] for unknown effects, `none`, or zero counts.
export function generateParticles(effectName, count, rng) {
  const effect = getEffect(effectName);
  if (!effect) return [];
  if (effect.defaultCount === 0 && (count == null || count === 0)) return [];

  const requested = count != null && count >= 0 ? count : effect.defaultCount;
  const n = Math.min(requested, effect.maxCount);
  if (n <= 0) return [];

  const r = rng || createRng(null);
  const specs = [];
  for (let i = 0; i < n; i++) {
    const spec = effect.randomize(i, r);
    if (spec) specs.push(spec);
  }
  return specs;
}

export const _internals = { EFFECTS, CONFETTI_PALETTE, BASE_CSS };
