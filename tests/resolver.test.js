import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveSeason, listPeaks } from '../src/index.js';

const co = JSON.parse(
  readFileSync(new URL('../calendars/co.json', import.meta.url), 'utf8'),
);
const global_ = JSON.parse(
  readFileSync(new URL('../calendars/global.json', import.meta.url), 'utf8'),
);

function on(year, month, day) {
  return new Date(year, month - 1, day);
}

test('resolveSeason returns null when nothing is active', () => {
  // March 22, 2026 — between Women's Day window end and Children's Day start.
  const r = resolveSeason(on(2026, 3, 22), co);
  assert.equal(r, null);
});

test('resolveSeason hits the peak day with distance=0', () => {
  const r = resolveSeason(on(2026, 12, 25), co);
  assert.ok(r);
  assert.equal(r.season.id, 'christmas');
  assert.equal(r.distance, 0);
  assert.equal(r.daysToPeak, 0);
});

test('resolveSeason resolves moving holidays correctly in 2026 (Mother\'s Day)', () => {
  const r = resolveSeason(on(2026, 5, 10), co);
  assert.ok(r);
  assert.equal(r.season.id, 'mothers-day');
  assert.equal(r.distance, 0);
});

test('resolveSeason resolves moving holidays correctly across years', () => {
  // Mother's Day: 2nd Sunday of May.
  const peak2027 = resolveSeason(on(2027, 5, 9), co);
  assert.equal(peak2027 && peak2027.season.id, 'mothers-day');
  const peak2028 = resolveSeason(on(2028, 5, 14), co);
  assert.equal(peak2028 && peak2028.season.id, 'mothers-day');
});

test('resolveSeason: window edges (inclusive on both sides)', () => {
  // Velitas peak Dec 7, daysAfter=7 → window ends Dec 14 (inclusive).
  const velitasEnd = resolveSeason(on(2026, 12, 14), co);
  assert.equal(velitasEnd && velitasEnd.season.id, 'candles-day');
  assert.equal(velitasEnd && velitasEnd.distance, 7);
  // Christmas peak Dec 25, daysBefore=10 → window starts Dec 15 (inclusive).
  const christmasStart = resolveSeason(on(2026, 12, 15), co);
  assert.equal(christmasStart && christmasStart.season.id, 'christmas');
  // Christmas peak day.
  const peak = resolveSeason(on(2026, 12, 25), co);
  assert.equal(peak && peak.season.id, 'christmas');
  // Christmas daysAfter=0 → Dec 26 falls outside Christmas window.
  // Year-wrap: Dec 26 2026 is 6 days before Jan 1 2027 (within New Year's daysBefore=6).
  const wrap = resolveSeason(on(2026, 12, 26), co);
  assert.equal(wrap && wrap.season.id, 'new-year');
});

test('resolveSeason year-wrap: late December resolves to New Year', () => {
  // Dec 28 2026 — Christmas over (Dec 25 + 0), New Year's Eve starts Dec 28
  // (peak Dec 31, daysBefore=3). Both are "near" but New Year's Eve is closer.
  const r = resolveSeason(on(2026, 12, 28), co);
  assert.ok(r);
  assert.equal(r.season.id, 'new-years-eve');
});

test('global calendar has only universal seasons (no LATAM-specific)', () => {
  assert.equal(global_.seasons.length, 5);
  const ids = global_.seasons.map((s) => s.id);
  assert.ok(ids.includes('christmas'));
  assert.ok(ids.includes('halloween'));
  assert.ok(!ids.includes('candles-day'));
  assert.ok(!ids.includes('independence-day'));
});

test('listPeaks returns peak dates for every season in a given year', () => {
  const peaks = listPeaks(co, 2026);
  assert.equal(peaks.length, co.seasons.length);
  const mothers = peaks.find((p) => p.id === 'mothers-day');
  assert.equal(mothers.peakDate.getDate(), 10);
  const christmas = peaks.find((p) => p.id === 'christmas');
  assert.equal(christmas.peakDate.getDate(), 25);
  assert.equal(christmas.peakDate.getMonth(), 11);
});

test('resolveSeason throws on bad input', () => {
  assert.throws(() => resolveSeason(new Date('not a date'), co), /valid Date/);
  assert.throws(() => resolveSeason(new Date(), {}), /seasons array/);
  assert.throws(() => resolveSeason(new Date(), null), /seasons array/);
});
