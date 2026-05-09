import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAutoInitOptions,
  isSafeHref,
  shouldMountBanner,
  shouldMountParticles,
} from '../src/auto-init.js';

test('parseAutoInitOptions returns documented defaults for empty input', () => {
  const o = parseAutoInitOptions({});
  assert.equal(o.locale, 'global');
  assert.equal(o.mode, 'banner+particles');
  assert.equal(o.position, 'top');
  assert.equal(o.dismissMode, 'day');
  assert.equal(o.message, null);
  assert.equal(o.ctaText, null);
  assert.equal(o.ctaHref, null);
  assert.equal(o.calendarUrl, null);
  assert.equal(o.particlesCount, null);
  assert.equal(o.particlesEffect, null);
  assert.equal(o.seed, null);
  assert.equal(o.debug, false);
});

test('parseAutoInitOptions handles non-object input safely', () => {
  for (const bad of [null, undefined, 0, 'string', false]) {
    const o = parseAutoInitOptions(bad);
    assert.equal(o.mode, 'banner+particles');
    assert.equal(o.locale, 'global');
  }
});

test('parseAutoInitOptions accepts known modes, rejects unknown', () => {
  assert.equal(parseAutoInitOptions({ mode: 'banner' }).mode, 'banner');
  assert.equal(parseAutoInitOptions({ mode: 'particles' }).mode, 'particles');
  assert.equal(parseAutoInitOptions({ mode: 'banner+particles' }).mode, 'banner+particles');
  assert.equal(parseAutoInitOptions({ mode: 'none' }).mode, 'none');
  // Unknown collapses back to default.
  assert.equal(parseAutoInitOptions({ mode: 'fancy' }).mode, 'banner+particles');
  assert.equal(parseAutoInitOptions({ mode: '   ' }).mode, 'banner+particles');
});

test('parseAutoInitOptions trims whitespace from string fields', () => {
  const o = parseAutoInitOptions({ message: '   hello   ', locale: ' co ' });
  assert.equal(o.message, 'hello');
  assert.equal(o.locale, 'co');
});

test('parseAutoInitOptions enforces position whitelist', () => {
  assert.equal(parseAutoInitOptions({ position: 'top' }).position, 'top');
  assert.equal(parseAutoInitOptions({ position: 'bottom' }).position, 'bottom');
  assert.equal(parseAutoInitOptions({ position: 'middle' }).position, 'top');
  assert.equal(parseAutoInitOptions({ position: '' }).position, 'top');
});

test('parseAutoInitOptions enforces dismissMode whitelist', () => {
  assert.equal(parseAutoInitOptions({ dismissMode: 'day' }).dismissMode, 'day');
  assert.equal(parseAutoInitOptions({ dismissMode: 'season' }).dismissMode, 'season');
  assert.equal(parseAutoInitOptions({ dismissMode: 'forever' }).dismissMode, 'day');
});

test('parseAutoInitOptions: ctaHref accepts safe schemes only', () => {
  // Allowed.
  assert.equal(parseAutoInitOptions({ ctaHref: 'https://example.com' }).ctaHref, 'https://example.com');
  assert.equal(parseAutoInitOptions({ ctaHref: 'http://example.com' }).ctaHref, 'http://example.com');
  assert.equal(parseAutoInitOptions({ ctaHref: '/promos' }).ctaHref, '/promos');
  assert.equal(parseAutoInitOptions({ ctaHref: '#anchor' }).ctaHref, '#anchor');
  assert.equal(parseAutoInitOptions({ ctaHref: '?ref=banner' }).ctaHref, '?ref=banner');
  assert.equal(parseAutoInitOptions({ ctaHref: 'mailto:a@b.com' }).ctaHref, 'mailto:a@b.com');
  assert.equal(parseAutoInitOptions({ ctaHref: 'tel:+571234' }).ctaHref, 'tel:+571234');
});

test('parseAutoInitOptions: ctaHref rejects javascript: / data: / vbscript:', () => {
  // These are the XSS-bait schemes. None of them must survive the parser.
  for (const evil of [
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    '   javascript:alert(1)   ',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'blob:https://evil.example/1',
    'about:blank',
    'jaVaScRiPt:alert(1)',
  ]) {
    assert.equal(parseAutoInitOptions({ ctaHref: evil }).ctaHref, null, 'unsafe href slipped through: ' + evil);
  }
});

test('parseAutoInitOptions: particlesCount must be a non-negative integer', () => {
  assert.equal(parseAutoInitOptions({ particlesCount: '10' }).particlesCount, 10);
  assert.equal(parseAutoInitOptions({ particlesCount: '0' }).particlesCount, 0);
  assert.equal(parseAutoInitOptions({ particlesCount: '-1' }).particlesCount, null);
  assert.equal(parseAutoInitOptions({ particlesCount: '3.14' }).particlesCount, null);
  assert.equal(parseAutoInitOptions({ particlesCount: 'twenty' }).particlesCount, null);
  assert.equal(parseAutoInitOptions({ particlesCount: '' }).particlesCount, null);
});

test('parseAutoInitOptions: seed must be finite', () => {
  assert.equal(parseAutoInitOptions({ seed: '42' }).seed, 42);
  assert.equal(parseAutoInitOptions({ seed: '0' }).seed, 0);
  assert.equal(parseAutoInitOptions({ seed: '-7' }).seed, -7);
  assert.equal(parseAutoInitOptions({ seed: 'NaN' }).seed, null);
  assert.equal(parseAutoInitOptions({ seed: 'Infinity' }).seed, null);
});

test('parseAutoInitOptions: debug accepts empty/true/1/yes', () => {
  assert.equal(parseAutoInitOptions({ debug: '' }).debug, true);
  assert.equal(parseAutoInitOptions({ debug: 'true' }).debug, true);
  assert.equal(parseAutoInitOptions({ debug: '1' }).debug, true);
  assert.equal(parseAutoInitOptions({ debug: 'yes' }).debug, true);
  assert.equal(parseAutoInitOptions({ debug: 'no' }).debug, false);
  assert.equal(parseAutoInitOptions({ debug: 'false' }).debug, false);
});

test('isSafeHref agrees with the parser on edge cases', () => {
  assert.equal(isSafeHref(null), false);
  assert.equal(isSafeHref(''), false);
  assert.equal(isSafeHref('   '), false);
  assert.equal(isSafeHref('https://a.b'), true);
  assert.equal(isSafeHref('javascript:0'), false);
  assert.equal(isSafeHref(42), false);
});

test('shouldMountBanner / shouldMountParticles match the mode matrix', () => {
  const cases = [
    { mode: 'banner+particles', banner: true, particles: true },
    { mode: 'banner',           banner: true, particles: false },
    { mode: 'particles',        banner: false, particles: true },
    { mode: 'none',             banner: false, particles: false },
  ];
  for (const c of cases) {
    const opts = parseAutoInitOptions({ mode: c.mode });
    assert.equal(shouldMountBanner(opts), c.banner, c.mode + ' banner');
    assert.equal(shouldMountParticles(opts), c.particles, c.mode + ' particles');
  }
});
