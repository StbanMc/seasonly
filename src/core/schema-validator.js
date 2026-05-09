// Zero-dependency calendar validator. Returns a structured result so callers
// can decide between throw, warn, or partial-load behavior.

const VALID_RULE_TYPES = new Set(['weekday']);
const VALID_PARTICLES = new Set([
  'none', 'snowflakes', 'hearts', 'confetti', 'stars', 'fireworks',
  'balloons', 'flowers', 'flags', 'kites', 'lightning', 'candles',
  'bats', 'leaves', 'petals',
]);

function isString(v) { return typeof v === 'string' && v.length > 0; }
function isFiniteNumber(v) { return typeof v === 'number' && Number.isFinite(v); }
function isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

function pushSeasonError(errors, idx, msg) {
  errors.push('seasons[' + idx + ']: ' + msg);
}

function validateMonthDay(value) {
  if (!isString(value)) return 'must be a string in "MM-DD" format';
  if (!/^\d{2}-\d{2}$/.test(value)) return 'must match "MM-DD" (got ' + JSON.stringify(value) + ')';
  const month = Number(value.slice(0, 2));
  const day = Number(value.slice(3, 5));
  if (month < 1 || month > 12) return 'month must be 01-12';
  if (day < 1 || day > 31) return 'day must be 01-31';
  return null;
}

function validateRule(rule) {
  if (!isObject(rule)) return 'rule must be an object';
  if (!VALID_RULE_TYPES.has(rule.type)) {
    return 'rule.type must be one of: ' + Array.from(VALID_RULE_TYPES).join(', ');
  }
  if (rule.type === 'weekday') {
    if (!Number.isInteger(rule.month) || rule.month < 1 || rule.month > 12) {
      return 'rule.month must be an integer 1-12';
    }
    if (!Number.isInteger(rule.weekday) || rule.weekday < 0 || rule.weekday > 6) {
      return 'rule.weekday must be 0-6 (0=Sunday)';
    }
    if (!Number.isInteger(rule.occurrence) || rule.occurrence === 0 || rule.occurrence > 5 || rule.occurrence < -1) {
      return 'rule.occurrence must be 1..5 or -1';
    }
  }
  return null;
}

function validateGradient(g) {
  if (g === undefined || g === null) return null;
  if (!Array.isArray(g) || g.length < 2) return 'gradient must be an array of at least 2 colors';
  for (const c of g) {
    if (!isString(c)) return 'gradient entries must be non-empty strings';
  }
  return null;
}

function validateSeason(season, idx, errors) {
  if (!isObject(season)) {
    pushSeasonError(errors, idx, 'must be an object');
    return;
  }
  if (!isString(season.id)) pushSeasonError(errors, idx, 'id is required (non-empty string)');
  if (!isString(season.name)) pushSeasonError(errors, idx, 'name is required (non-empty string)');

  const hasDate = season.date !== undefined;
  const hasRule = season.rule !== undefined;
  if (!hasDate && !hasRule) {
    pushSeasonError(errors, idx, 'must have either "date" (MM-DD) or "rule"');
  } else if (hasDate && hasRule) {
    pushSeasonError(errors, idx, 'must have "date" or "rule", not both');
  } else if (hasDate) {
    const err = validateMonthDay(season.date);
    if (err) pushSeasonError(errors, idx, 'date ' + err);
  } else {
    const err = validateRule(season.rule);
    if (err) pushSeasonError(errors, idx, err);
  }

  if (season.daysBefore !== undefined && (!Number.isInteger(season.daysBefore) || season.daysBefore < 0)) {
    pushSeasonError(errors, idx, 'daysBefore must be a non-negative integer');
  }
  if (season.daysAfter !== undefined && (!Number.isInteger(season.daysAfter) || season.daysAfter < 0)) {
    pushSeasonError(errors, idx, 'daysAfter must be a non-negative integer');
  }

  if (season.particles !== undefined && !VALID_PARTICLES.has(season.particles)) {
    pushSeasonError(errors, idx,
      'particles "' + season.particles + '" is not recognized. Allowed: ' +
      Array.from(VALID_PARTICLES).join(', ')
    );
  }

  const gErr = validateGradient(season.gradient);
  if (gErr) pushSeasonError(errors, idx, gErr);

  if (season.textColor !== undefined && !isString(season.textColor)) {
    pushSeasonError(errors, idx, 'textColor must be a non-empty string when present');
  }
  if (season.icon !== undefined && !isString(season.icon)) {
    pushSeasonError(errors, idx, 'icon must be a non-empty string when present');
  }
}

export function validateCalendar(calendar) {
  const errors = [];

  if (!isObject(calendar)) {
    return { valid: false, errors: ['calendar must be an object'] };
  }
  if (!isString(calendar.id)) errors.push('calendar.id is required (non-empty string)');
  if (calendar.name !== undefined && !isString(calendar.name)) {
    errors.push('calendar.name must be a non-empty string when present');
  }
  if (calendar.version !== undefined && !isString(calendar.version)) {
    errors.push('calendar.version must be a string when present');
  }

  if (!Array.isArray(calendar.seasons)) {
    errors.push('calendar.seasons must be an array');
    return { valid: false, errors };
  }
  if (calendar.seasons.length === 0) {
    errors.push('calendar.seasons must contain at least one season');
  }

  const ids = new Set();
  for (let i = 0; i < calendar.seasons.length; i++) {
    const season = calendar.seasons[i];
    validateSeason(season, i, errors);
    if (isObject(season) && isString(season.id)) {
      if (ids.has(season.id)) {
        pushSeasonError(errors, i, 'id "' + season.id + '" is duplicated within the calendar');
      }
      ids.add(season.id);
    }
  }

  return { valid: errors.length === 0, errors };
}
