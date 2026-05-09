// Pure date helpers. No timezones beyond what the host Date supports;
// callers pass Date objects representing the local "today" they want resolved.

export function parseMonthDay(str) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected MM-DD string, got ' + typeof str);
  }
  const m = /^(\d{2})-(\d{2})$/.exec(str);
  if (!m) {
    throw new RangeError('Invalid MM-DD format: ' + JSON.stringify(str));
  }
  const month = Number(m[1]);
  const day = Number(m[2]);
  if (month < 1 || month > 12) {
    throw new RangeError('Invalid month in ' + str + ': ' + month);
  }
  if (day < 1 || day > 31) {
    throw new RangeError('Invalid day in ' + str + ': ' + day);
  }
  return { month, day };
}

export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year, month) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  return 31;
}

// Build a Date from year + MM-DD. Handles Feb 29 in non-leap years by
// clamping to Feb 28, which is the natural calendar behavior most users expect.
export function dateFromMonthDay(year, month, day) {
  const max = daysInMonth(year, month);
  const safeDay = day > max ? max : day;
  return new Date(year, month - 1, safeDay);
}

// Compute the date for "the Nth weekday of a given month".
// occurrence: 1..5 (forward), -1 = last occurrence in the month.
// weekday: 0=Sunday, 1=Monday, ..., 6=Saturday.
export function computeWeekdayDate(year, month, weekday, occurrence) {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    throw new RangeError('weekday must be 0-6, got ' + weekday);
  }
  if (!Number.isInteger(occurrence) || occurrence === 0) {
    throw new RangeError('occurrence must be a non-zero integer (1..5 or -1)');
  }
  if (occurrence > 0) {
    const first = new Date(year, month - 1, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    const day = 1 + offset + (occurrence - 1) * 7;
    if (day > daysInMonth(year, month)) {
      throw new RangeError(
        'Occurrence ' + occurrence + ' of weekday ' + weekday +
        ' does not exist in ' + year + '-' + month
      );
    }
    return new Date(year, month - 1, day);
  }
  // Last occurrence: walk back from end of month.
  const last = daysInMonth(year, month);
  const lastDate = new Date(year, month - 1, last);
  const offset = (lastDate.getDay() - weekday + 7) % 7;
  return new Date(year, month - 1, last - offset);
}

export function atMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

const MS_PER_DAY = 86400000;

// Calendar-day distance between two dates, ignoring time-of-day.
// Positive when a is after b.
export function daysBetween(a, b) {
  const am = atMidnight(a).getTime();
  const bm = atMidnight(b).getTime();
  return Math.round((am - bm) / MS_PER_DAY);
}
