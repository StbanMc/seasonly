import {
  parseMonthDay,
  dateFromMonthDay,
  computeWeekdayDate,
  daysBetween,
  addDays,
  atMidnight,
} from './dates.js';

// Compute the calendar date a season "peaks" on for a given year, supporting
// both fixed dates ("MM-DD") and moving holidays expressed as rules.
function peakDateFor(season, year) {
  if (season.date) {
    const { month, day } = parseMonthDay(season.date);
    return dateFromMonthDay(year, month, day);
  }
  if (season.rule && season.rule.type === 'weekday') {
    return computeWeekdayDate(
      year,
      season.rule.month,
      season.rule.weekday,
      season.rule.occurrence,
    );
  }
  throw new Error(
    'Season "' + (season.id || '?') + '" has neither date nor a supported rule'
  );
}

function windowFor(season, year) {
  const peak = peakDateFor(season, year);
  const before = Number.isFinite(season.daysBefore) ? season.daysBefore : 0;
  const after = Number.isFinite(season.daysAfter) ? season.daysAfter : 0;
  const start = addDays(peak, -before);
  const end = addDays(peak, after);
  return { peak, start, end };
}

// Year wrapping: a season's window can straddle Dec-Jan (e.g. New Year with
// daysBefore=6 starts on Dec 26). For a given "today", we must check the
// season against this year, last year, and next year and return the active
// window if any.
function activeWindowFor(season, today) {
  const year = today.getFullYear();
  for (const y of [year - 1, year, year + 1]) {
    const { peak, start, end } = windowFor(season, y);
    if (today >= start && today <= end) {
      return { peak, start, end };
    }
  }
  return null;
}

// Resolve which season is "active" for a given date against a given calendar.
// When multiple seasons overlap, the one closest to its peak wins.
// Tie-breaker: earlier index in calendar.seasons.
//
// Returns: { season, peakDate, daysToPeak, distance, windowStart, windowEnd }
//          or null if no season is active.
export function resolveSeason(today, calendar) {
  if (!(today instanceof Date) || Number.isNaN(today.getTime())) {
    throw new TypeError('resolveSeason: first arg must be a valid Date');
  }
  if (!calendar || !Array.isArray(calendar.seasons)) {
    throw new TypeError('resolveSeason: calendar must have a seasons array');
  }

  const noon = atMidnight(today);
  const candidates = [];

  for (let i = 0; i < calendar.seasons.length; i++) {
    const season = calendar.seasons[i];
    const win = activeWindowFor(season, noon);
    if (!win) continue;
    const distance = Math.abs(daysBetween(noon, win.peak));
    candidates.push({
      season,
      index: i,
      peakDate: win.peak,
      windowStart: win.start,
      windowEnd: win.end,
      daysToPeak: daysBetween(win.peak, noon),
      distance,
    });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    return a.index - b.index;
  });

  const winner = candidates[0];
  return {
    season: winner.season,
    peakDate: winner.peakDate,
    windowStart: winner.windowStart,
    windowEnd: winner.windowEnd,
    daysToPeak: winner.daysToPeak,
    distance: winner.distance,
  };
}

// Helper: given a calendar, list every season's resolved peak date for a year.
// Useful for previews, docs, and timeline visualizations.
export function listPeaks(calendar, year) {
  if (!calendar || !Array.isArray(calendar.seasons)) {
    throw new TypeError('listPeaks: calendar must have a seasons array');
  }
  const target = Number.isFinite(year) ? year : new Date().getFullYear();
  return calendar.seasons.map((season) => ({
    id: season.id,
    name: season.name,
    peakDate: peakDateFor(season, target),
  }));
}
