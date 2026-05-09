import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveSeason } from '../src/index.js';

const co = JSON.parse(
  readFileSync(new URL('../calendars/co.json', import.meta.url), 'utf8'),
);

function on(year, month, day) {
  return new Date(year, month - 1, day);
}

// In 2026:
//   Black Friday peak  = Nov 27 (4th Friday), daysBefore=3, daysAfter=5
//     → window Nov 24 → Dec 2
//   Velitas peak       = Dec 7,                 daysBefore=7, daysAfter=7
//     → window Nov 30 → Dec 14
//   Overlap: Nov 30, Dec 1, Dec 2 (three days)

test('overlap: Nov 29 — only Black Friday active', () => {
  const r = resolveSeason(on(2026, 11, 29), co);
  assert.ok(r);
  assert.equal(r.season.id, 'black-friday');
  assert.equal(r.distance, 2);
});

test('overlap: Nov 30 — both active, BF wins (closer to its peak)', () => {
  const r = resolveSeason(on(2026, 11, 30), co);
  assert.ok(r);
  assert.equal(r.season.id, 'black-friday');
  assert.equal(r.distance, 3);
});

test('overlap: Dec 1 — both active, BF still wins (4d) over Velitas (6d)', () => {
  const r = resolveSeason(on(2026, 12, 1), co);
  assert.ok(r);
  assert.equal(r.season.id, 'black-friday');
});

test('overlap: Dec 2 — tie at distance 5; BF wins on calendar order', () => {
  // BF index in CO calendar comes before Velitas.
  const r = resolveSeason(on(2026, 12, 2), co);
  assert.ok(r);
  assert.equal(r.distance, 5);
  assert.equal(r.season.id, 'black-friday');
});

test('overlap: Dec 3 — BF window closed, only Velitas remains', () => {
  const r = resolveSeason(on(2026, 12, 3), co);
  assert.ok(r);
  assert.equal(r.season.id, 'candles-day');
  assert.equal(r.distance, 4);
});

test('overlap: Dec 7 — Velitas peak, distance 0', () => {
  const r = resolveSeason(on(2026, 12, 7), co);
  assert.ok(r);
  assert.equal(r.season.id, 'candles-day');
  assert.equal(r.distance, 0);
});
