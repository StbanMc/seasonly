import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prefersReducedMotion, REDUCED_MOTION_QUERY } from '../src/components/banner-motion.js';

function fakeMatchMedia(matches) {
  return (query) => {
    if (query !== REDUCED_MOTION_QUERY) return { matches: false, media: query };
    return { matches, media: query };
  };
}

test('prefersReducedMotion returns false when matchMedia is unavailable', () => {
  assert.equal(prefersReducedMotion(undefined), false);
  assert.equal(prefersReducedMotion(null), false);
  assert.equal(prefersReducedMotion('not a function'), false);
});

test('prefersReducedMotion delegates to the supplied matchMedia', () => {
  assert.equal(prefersReducedMotion(fakeMatchMedia(true)), true);
  assert.equal(prefersReducedMotion(fakeMatchMedia(false)), false);
});

test('prefersReducedMotion swallows matchMedia errors and defaults to false', () => {
  const broken = () => { throw new Error('locked down'); };
  assert.equal(prefersReducedMotion(broken), false);
});

test('REDUCED_MOTION_QUERY is the exact CSS Level 5 string', () => {
  assert.equal(REDUCED_MOTION_QUERY, '(prefers-reduced-motion: reduce)');
});
