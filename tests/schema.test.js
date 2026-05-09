import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCalendar } from '../src/index.js';

const co = JSON.parse(
  readFileSync(new URL('../calendars/co.json', import.meta.url), 'utf8'),
);
const global_ = JSON.parse(
  readFileSync(new URL('../calendars/global.json', import.meta.url), 'utf8'),
);

test('bundled co.json is valid', () => {
  const r = validateCalendar(co);
  assert.equal(r.valid, true, r.errors.join('\n'));
});

test('bundled global.json is valid', () => {
  const r = validateCalendar(global_);
  assert.equal(r.valid, true, r.errors.join('\n'));
});

test('missing id is caught', () => {
  const r = validateCalendar({ seasons: [] });
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => /calendar.id/.test(e)));
});

test('missing seasons array is caught', () => {
  const r = validateCalendar({ id: 'x' });
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => /seasons must be an array/.test(e)));
});

test('empty seasons array is caught', () => {
  const r = validateCalendar({ id: 'x', seasons: [] });
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => /at least one season/.test(e)));
});

test('season needs date OR rule', () => {
  const r = validateCalendar({
    id: 'x',
    seasons: [{ id: 's', name: 'S', daysBefore: 1, daysAfter: 1 }],
  });
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => /must have either "date".*or "rule"/.test(e)));
});

test('season cannot have both date AND rule', () => {
  const r = validateCalendar({
    id: 'x',
    seasons: [{
      id: 's', name: 'S',
      date: '12-25',
      rule: { type: 'weekday', month: 12, weekday: 0, occurrence: 1 },
    }],
  });
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => /not both/.test(e)));
});

test('invalid date format is caught', () => {
  const r = validateCalendar({
    id: 'x',
    seasons: [{ id: 's', name: 'S', date: 'Dec 25' }],
  });
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => /MM-DD/.test(e)));
});

test('invalid rule weekday is caught', () => {
  const r = validateCalendar({
    id: 'x',
    seasons: [{
      id: 's', name: 'S',
      rule: { type: 'weekday', month: 5, weekday: 9, occurrence: 2 },
    }],
  });
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => /weekday/.test(e)));
});

test('unknown particle type is caught', () => {
  const r = validateCalendar({
    id: 'x',
    seasons: [{ id: 's', name: 'S', date: '01-01', particles: 'unicorns' }],
  });
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => /particles "unicorns"/.test(e)));
});

test('duplicate season ids are caught', () => {
  const r = validateCalendar({
    id: 'x',
    seasons: [
      { id: 'a', name: 'A', date: '01-01' },
      { id: 'a', name: 'A2', date: '02-02' },
    ],
  });
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => /duplicated/.test(e)));
});

test('non-object input is rejected gracefully', () => {
  assert.equal(validateCalendar(null).valid, false);
  assert.equal(validateCalendar('not a calendar').valid, false);
  assert.equal(validateCalendar([]).valid, false);
});
