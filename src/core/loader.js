import { validateCalendar } from './schema-validator.js';

// Loader of seasonal calendars. Sources, in priority:
//   1) An object literal { id, seasons, ... } passed directly.
//   2) A bundled id like "co" or "global" (resolved via importer).
//   3) A URL fetched at runtime (browser only; requires global fetch).
//
// Strategy: every accepted source is validated through the same gate so
// downstream code never sees a malformed calendar.

export class CalendarError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = 'CalendarError';
    this.errors = errors || [];
  }
}

function ensureValid(calendar, sourceLabel) {
  const result = validateCalendar(calendar);
  if (!result.valid) {
    throw new CalendarError(
      'Invalid calendar (' + sourceLabel + '):\n  - ' + result.errors.join('\n  - '),
      result.errors,
    );
  }
  return calendar;
}

// Load a calendar from any supported source. Returns a Promise<Calendar>.
//
// input:
//   - object  → validated and returned as-is
//   - string starting with "http(s)://" or "/" → fetched as JSON
//   - other strings → treated as bundled id; importer is mandatory in this case
//
// importer (optional): an async function (id) => calendar, used to resolve
// bundled ids. Decoupled from the loader so this module stays free of
// environment-specific imports (Node fs vs. browser fetch vs. bundler import).
export async function loadCalendar(input, { importer } = {}) {
  if (input && typeof input === 'object') {
    return ensureValid(input, 'inline object');
  }
  if (typeof input !== 'string' || input.length === 0) {
    throw new TypeError('loadCalendar: input must be an object, an id, or a URL');
  }

  if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('/')) {
    if (typeof fetch !== 'function') {
      throw new Error('loadCalendar: global fetch is not available in this environment');
    }
    const res = await fetch(input);
    if (!res.ok) {
      throw new Error('loadCalendar: fetch failed for ' + input + ' (' + res.status + ')');
    }
    const data = await res.json();
    return ensureValid(data, input);
  }

  if (typeof importer !== 'function') {
    throw new Error(
      'loadCalendar: bundled id "' + input + '" requested but no importer was provided'
    );
  }
  const data = await importer(input);
  return ensureValid(data, 'bundled:' + input);
}

// Merge two or more calendars in declaration order: later seasons with the
// same id override earlier ones. Useful for "global + co + my-custom" stacks.
export function mergeCalendars(...calendars) {
  if (calendars.length === 0) {
    throw new TypeError('mergeCalendars: at least one calendar is required');
  }
  const byId = new Map();
  let mergedId = '';
  for (const c of calendars) {
    if (!c || !Array.isArray(c.seasons)) {
      throw new TypeError('mergeCalendars: every input must be a valid calendar');
    }
    mergedId = mergedId ? mergedId + '+' + c.id : c.id;
    for (const s of c.seasons) {
      byId.set(s.id, s);
    }
  }
  return {
    id: mergedId,
    name: 'merged',
    version: '0',
    seasons: Array.from(byId.values()),
  };
}
