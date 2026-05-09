import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDay,
  dismissKey,
  isDismissed,
  markDismissed,
  createMemoryStorage,
} from '../src/components/banner-storage.js';

test('formatDay produces YYYY-MM-DD with zero-padding', () => {
  assert.equal(formatDay(new Date(2026, 0, 1)), '2026-01-01');
  assert.equal(formatDay(new Date(2026, 11, 31)), '2026-12-31');
  assert.equal(formatDay(new Date(2026, 4, 9)), '2026-05-09');
});

test('formatDay throws on invalid input', () => {
  assert.throws(() => formatDay('not a date'), /valid Date/);
  assert.throws(() => formatDay(new Date('garbage')), /valid Date/);
});

test('dismissKey day-mode includes themeId and YYYY-MM-DD', () => {
  const key = dismissKey({
    themeId: 'christmas',
    mode: 'day',
    today: new Date(2026, 11, 20),
  });
  assert.equal(key, 'seasonly:dismissed:christmas:day:2026-12-20');
});

test('dismissKey season-mode includes window-end date', () => {
  const key = dismissKey({
    themeId: 'black-friday',
    mode: 'season',
    windowEnd: new Date(2026, 11, 2),
  });
  assert.equal(key, 'seasonly:dismissed:black-friday:season:2026-12-02');
});

test('dismissKey returns null on bad input', () => {
  assert.equal(dismissKey({ mode: 'day', today: new Date() }), null);
  assert.equal(dismissKey({ themeId: 'x', mode: 'day' }), null);
  assert.equal(dismissKey({ themeId: 'x', mode: 'season' }), null);
  assert.equal(dismissKey({ themeId: 'x', mode: 'unknown', today: new Date() }), null);
});

test('isDismissed returns false for unknown key, true once marked', () => {
  const s = createMemoryStorage();
  const key = 'seasonly:dismissed:x:day:2026-05-09';
  assert.equal(isDismissed(s, key), false);
  markDismissed(s, key);
  assert.equal(isDismissed(s, key), true);
});

test('isDismissed defaults to false for missing or broken storage', () => {
  assert.equal(isDismissed(null, 'k'), false);
  assert.equal(isDismissed({}, 'k'), false);
  assert.equal(isDismissed({ getItem() { throw new Error('blocked'); } }, 'k'), false);
});

test('markDismissed never throws even when storage rejects writes', () => {
  const broken = { setItem() { throw new Error('quota'); } };
  // Must not throw.
  assert.equal(markDismissed(broken, 'k'), false);
  assert.equal(markDismissed(null, 'k'), false);
});

test('day-mode dismissals expire across calendar days', () => {
  const s = createMemoryStorage();
  const today = new Date(2026, 4, 9);
  const tomorrow = new Date(2026, 4, 10);
  const todayKey = dismissKey({ themeId: 'x', mode: 'day', today });
  const tomorrowKey = dismissKey({ themeId: 'x', mode: 'day', today: tomorrow });

  markDismissed(s, todayKey);
  assert.equal(isDismissed(s, todayKey), true);
  assert.equal(isDismissed(s, tomorrowKey), false);
});

test('createMemoryStorage matches the shape of Web Storage', () => {
  const s = createMemoryStorage();
  s.setItem('a', 'b');
  assert.equal(s.getItem('a'), 'b');
  assert.equal(s.length, 1);
  assert.equal(s.key(0), 'a');
  s.removeItem('a');
  assert.equal(s.getItem('a'), null);
  s.setItem('x', '1');
  s.setItem('y', '2');
  s.clear();
  assert.equal(s.length, 0);
});
