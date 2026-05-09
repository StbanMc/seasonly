import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseMonthDay,
  isLeapYear,
  daysInMonth,
  dateFromMonthDay,
  computeWeekdayDate,
  addDays,
  daysBetween,
} from '../src/core/dates.js';

test('parseMonthDay accepts MM-DD and rejects garbage', () => {
  assert.deepEqual(parseMonthDay('12-25'), { month: 12, day: 25 });
  assert.deepEqual(parseMonthDay('01-01'), { month: 1, day: 1 });
  assert.throws(() => parseMonthDay('1-1'), /MM-DD/);
  assert.throws(() => parseMonthDay('13-01'), /Invalid month/);
  assert.throws(() => parseMonthDay('12-32'), /Invalid day/);
  assert.throws(() => parseMonthDay(null), /Expected MM-DD/);
});

test('isLeapYear matches Gregorian rules', () => {
  assert.equal(isLeapYear(2024), true);
  assert.equal(isLeapYear(2025), false);
  assert.equal(isLeapYear(2000), true);
  assert.equal(isLeapYear(1900), false);
  assert.equal(isLeapYear(2100), false);
  assert.equal(isLeapYear(2400), true);
});

test('daysInMonth knows February', () => {
  assert.equal(daysInMonth(2024, 2), 29);
  assert.equal(daysInMonth(2025, 2), 28);
  assert.equal(daysInMonth(2026, 4), 30);
  assert.equal(daysInMonth(2026, 12), 31);
});

test('dateFromMonthDay clamps Feb 29 in non-leap years', () => {
  const d = dateFromMonthDay(2025, 2, 29);
  assert.equal(d.getMonth(), 1);
  assert.equal(d.getDate(), 28);
  const dl = dateFromMonthDay(2024, 2, 29);
  assert.equal(dl.getDate(), 29);
});

test('computeWeekdayDate: Mother\'s Day Colombia (2nd Sunday of May)', () => {
  // 2026-05-10 is the 2nd Sunday of May 2026.
  const d2026 = computeWeekdayDate(2026, 5, 0, 2);
  assert.equal(d2026.getFullYear(), 2026);
  assert.equal(d2026.getMonth(), 4);
  assert.equal(d2026.getDate(), 10);

  // 2027-05-09 is the 2nd Sunday of May 2027.
  const d2027 = computeWeekdayDate(2027, 5, 0, 2);
  assert.equal(d2027.getDate(), 9);
});

test('computeWeekdayDate: Father\'s Day Colombia (3rd Sunday of June)', () => {
  // 2026-06-21 is the 3rd Sunday of June 2026.
  const d = computeWeekdayDate(2026, 6, 0, 3);
  assert.equal(d.getMonth(), 5);
  assert.equal(d.getDate(), 21);
});

test('computeWeekdayDate: last Saturday of April (Children\'s Day Colombia)', () => {
  // April 2026: April 30 is Thursday. Last Saturday = April 25.
  const d = computeWeekdayDate(2026, 4, 6, -1);
  assert.equal(d.getMonth(), 3);
  assert.equal(d.getDate(), 25);
});

test('computeWeekdayDate: 4th Friday of November (Black Friday)', () => {
  // Nov 2026: Nov 1 is Sunday. Fridays = 6, 13, 20, 27. 4th = 27.
  const d = computeWeekdayDate(2026, 11, 5, 4);
  assert.equal(d.getDate(), 27);

  // Nov 2027: Nov 1 is Monday. Fridays = 5, 12, 19, 26.
  const d2027 = computeWeekdayDate(2027, 11, 5, 4);
  assert.equal(d2027.getDate(), 26);
});

test('computeWeekdayDate: 3rd Saturday of September (Amor y Amistad)', () => {
  // Sept 2026: Sep 1 is Tuesday. Saturdays = 5, 12, 19, 26. 3rd = 19.
  const d = computeWeekdayDate(2026, 9, 6, 3);
  assert.equal(d.getDate(), 19);
});

test('computeWeekdayDate rejects out-of-range arguments', () => {
  assert.throws(() => computeWeekdayDate(2026, 5, 7, 2), /weekday/);
  assert.throws(() => computeWeekdayDate(2026, 5, 0, 0), /occurrence/);
  assert.throws(() => computeWeekdayDate(2026, 2, 0, 5), /does not exist/);
});

test('addDays moves across month boundaries', () => {
  const d = addDays(new Date(2026, 0, 30), 5);
  assert.equal(d.getMonth(), 1);
  assert.equal(d.getDate(), 4);
  const back = addDays(new Date(2026, 0, 2), -5);
  assert.equal(back.getMonth(), 11);
  assert.equal(back.getFullYear(), 2025);
  assert.equal(back.getDate(), 28);
});

test('daysBetween counts calendar days, ignoring time-of-day', () => {
  const a = new Date(2026, 4, 9, 23, 59);
  const b = new Date(2026, 4, 10, 0, 1);
  assert.equal(daysBetween(b, a), 1);
  assert.equal(daysBetween(a, b), -1);
  const same = new Date(2026, 4, 9, 8, 0);
  assert.equal(daysBetween(same, a), 0);
});
