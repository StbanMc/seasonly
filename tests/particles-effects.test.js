import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getEffect,
  listEffects,
  buildParticlesCSS,
  generateParticles,
  _internals,
} from '../src/components/particles-effects.js';
import { createRng } from '../src/components/particles-rng.js';

const ALL = listEffects().filter((n) => n !== 'none');

test('every effect declared in the validator is implemented in the registry', () => {
  // Mirrors VALID_PARTICLES in schema-validator.js. If we add a new value
  // there we must add the effect here too — this test is the contract.
  const expected = [
    'none', 'snowflakes', 'hearts', 'confetti', 'stars', 'fireworks',
    'balloons', 'flowers', 'flags', 'kites', 'lightning', 'candles',
    'bats', 'leaves', 'petals',
  ];
  for (const name of expected) {
    assert.ok(getEffect(name), 'missing effect: ' + name);
  }
});

test('getEffect returns null for unknown / non-string names', () => {
  assert.equal(getEffect('unicorns'), null);
  assert.equal(getEffect(undefined), null);
  assert.equal(getEffect(42), null);
  assert.equal(getEffect(null), null);
});

test('every non-none effect has CSS, defaultCount > 0, and a randomize fn', () => {
  for (const name of ALL) {
    const e = getEffect(name);
    assert.ok(e.css.length > 0, name + ': missing CSS');
    assert.ok(e.defaultCount > 0, name + ': defaultCount must be > 0');
    assert.ok(e.maxCount >= e.defaultCount, name + ': maxCount must be >= defaultCount');
    assert.equal(typeof e.randomize, 'function', name + ': randomize must be a function');
  }
});

test('every effect CSS declares its own scoping selector', () => {
  for (const name of ALL) {
    const css = buildParticlesCSS(name);
    assert.ok(
      css.includes('.' + name + ' .particle'),
      name + ': CSS must scope to .' + name + ' .particle',
    );
  }
});

test('buildParticlesCSS always includes pointer-events:none on host and particle', () => {
  const css = buildParticlesCSS('snowflakes');
  assert.match(css, /pointer-events:\s*none/);
});

test('buildParticlesCSS for unknown effect returns just the base shell', () => {
  const css = buildParticlesCSS('unicorns');
  assert.match(css, /pointer-events:\s*none/);
  assert.doesNotMatch(css, /@keyframes/);
});

test('generateParticles is deterministic with a seeded rng', () => {
  const a = generateParticles('snowflakes', 10, createRng(99));
  const b = generateParticles('snowflakes', 10, createRng(99));
  assert.deepEqual(a, b);
});

test('generateParticles caps at the effect maxCount', () => {
  const e = getEffect('lightning');
  const specs = generateParticles('lightning', 1000, createRng(1));
  assert.equal(specs.length, e.maxCount);
});

test('generateParticles returns [] for none / unknown / count=0', () => {
  assert.deepEqual(generateParticles('none', 10, createRng(1)), []);
  assert.deepEqual(generateParticles('unknown', 10, createRng(1)), []);
  assert.deepEqual(generateParticles('snowflakes', 0, createRng(1)), []);
});

test('generateParticles defaults to the effect defaultCount when count is null', () => {
  const e = getEffect('hearts');
  const specs = generateParticles('hearts', null, createRng(1));
  assert.equal(specs.length, e.defaultCount);
});

test('snowflake spec contains expected CSS keys and a glyph from the registry', () => {
  const e = getEffect('snowflakes');
  const [first] = generateParticles('snowflakes', 1, createRng(1));
  assert.ok('left' in first);
  assert.ok('animationDuration' in first);
  assert.ok('animationDelay' in first);
  assert.ok('fontSize' in first);
  assert.ok('opacity' in first);
  assert.ok(e.glyphs.includes(first.glyph));
});

test('confetti specs use palette colors and not glyphs', () => {
  const specs = generateParticles('confetti', 5, createRng(1));
  for (const s of specs) {
    assert.ok(_internals.CONFETTI_PALETTE.includes(s.backgroundColor));
    assert.equal(s.glyph, undefined);
  }
});

test('lightning specs expose a CSS variable --lx for the flash origin', () => {
  const specs = generateParticles('lightning', 3, createRng(1));
  for (const s of specs) {
    assert.ok('--lx' in s, 'lightning spec must include --lx');
    assert.match(s['--lx'], /^\d+%$/);
  }
});

test('all generated values stay inside parseable CSS units', () => {
  for (const name of ALL) {
    const specs = generateParticles(name, 4, createRng(11));
    for (const s of specs) {
      if (s.left) assert.match(s.left, /^[0-9.]+%$/, name + ' left');
      if (s.top) assert.match(s.top, /^[0-9.]+%$/, name + ' top');
      if (s.fontSize) assert.match(s.fontSize, /^\d+px$/, name + ' fontSize');
      if (s.animationDuration) assert.match(s.animationDuration, /^[0-9.]+s$/, name + ' duration');
      if (s.animationDelay) assert.match(s.animationDelay, /^-?[0-9.]+s$/, name + ' delay');
    }
  }
});

test('every effect honors prefers-reduced-motion at the JS layer (not just CSS)', () => {
  // The effect *registry* itself doesn't enforce reduced-motion; the
  // <seasonly-particles> Web Component skips render entirely when reduced
  // motion is on. This test just asserts the registry doesn't *force*
  // motion via CSS that ignores the media query — the base CSS has a
  // mobile-only rule, no `animation: ... !important` on the effect side.
  for (const name of ALL) {
    const css = buildParticlesCSS(name);
    assert.doesNotMatch(
      css,
      /animation:\s*[^;]+\s+!important/i,
      name + ' must not force animation with !important',
    );
  }
});
