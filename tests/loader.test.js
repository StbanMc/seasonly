import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadCalendar, mergeCalendars, CalendarError } from '../src/index.js';

const co = JSON.parse(
  readFileSync(new URL('../calendars/co.json', import.meta.url), 'utf8'),
);
const global_ = JSON.parse(
  readFileSync(new URL('../calendars/global.json', import.meta.url), 'utf8'),
);

test('loadCalendar accepts an inline object and validates it', async () => {
  const c = await loadCalendar(co);
  assert.equal(c.id, 'co');
});

test('loadCalendar rejects an invalid inline object with CalendarError', async () => {
  await assert.rejects(
    () => loadCalendar({ id: 'x' }),
    (err) => err instanceof CalendarError && /seasons/.test(err.message),
  );
});

test('loadCalendar requires an importer for bundled ids', async () => {
  await assert.rejects(
    () => loadCalendar('co'),
    /no importer was provided/,
  );
});

test('loadCalendar uses a provided importer for bundled ids', async () => {
  const c = await loadCalendar('co', {
    importer: async (id) =>
      JSON.parse(readFileSync(new URL('../calendars/' + id + '.json', import.meta.url), 'utf8')),
  });
  assert.equal(c.id, 'co');
  assert.ok(Array.isArray(c.seasons));
});

test('mergeCalendars overrides season ids by declaration order', () => {
  const merged = mergeCalendars(global_, {
    id: 'override',
    seasons: [
      { id: 'christmas', name: 'Custom Xmas', date: '12-24' },
      { id: 'extra', name: 'Extra', date: '03-15' },
    ],
  });
  const xmas = merged.seasons.find((s) => s.id === 'christmas');
  assert.equal(xmas.name, 'Custom Xmas');
  assert.equal(xmas.date, '12-24');
  const extra = merged.seasons.find((s) => s.id === 'extra');
  assert.ok(extra);
});

test('mergeCalendars rejects empty input', () => {
  assert.throws(() => mergeCalendars(), /at least one calendar/);
});
