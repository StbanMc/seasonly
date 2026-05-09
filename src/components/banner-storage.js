// Dismiss-persistence logic for <seasonly-banner>.
// Pure functions over a Storage-shaped object (the host's Storage works,
// and tests can pass a Map-backed shim).
//
// Two modes:
//   - "day"     : dismissal lasts until midnight of the local day. Key
//                 includes YYYY-MM-DD so it auto-resets daily.
//   - "season"  : dismissal lasts until the end of the season window. Key
//                 includes the window-end date so re-opens are honored.

const KEY_PREFIX = 'seasonly:dismissed';

function pad2(n) { return n < 10 ? '0' + n : '' + n; }

export function formatDay(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError('formatDay: expected a valid Date');
  }
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
}

// Build the storage key for a dismissal. Returns null if mode/theme is
// invalid so callers can decide to skip persistence safely.
export function dismissKey({ themeId, mode = 'day', today, windowEnd }) {
  if (typeof themeId !== 'string' || themeId.length === 0) return null;
  if (mode === 'day') {
    if (!(today instanceof Date)) return null;
    return KEY_PREFIX + ':' + themeId + ':day:' + formatDay(today);
  }
  if (mode === 'season') {
    if (!(windowEnd instanceof Date)) return null;
    return KEY_PREFIX + ':' + themeId + ':season:' + formatDay(windowEnd);
  }
  return null;
}

// Storage-shaped object: any { getItem, setItem } pair works.
// Returns false on missing storage, missing key, or read errors —
// "we don't know it was dismissed" must always default to "show".
export function isDismissed(storage, key) {
  if (!storage || typeof storage.getItem !== 'function' || !key) return false;
  try {
    return storage.getItem(key) === '1';
  } catch (_err) {
    return false;
  }
}

// Best-effort: never throws. Storage write failures (private mode, quota,
// disabled) silently skip persistence — banner still dismisses for the
// current page view, just won't survive a reload.
export function markDismissed(storage, key) {
  if (!storage || typeof storage.setItem !== 'function' || !key) return false;
  try {
    storage.setItem(key, '1');
    return true;
  } catch (_err) {
    return false;
  }
}

// Tiny in-memory storage shim, exposed for tests and as a safe fallback
// when neither localStorage nor sessionStorage is available (SSR, sandbox,
// strict privacy modes).
export function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(k) { return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { map.set(k, String(v)); },
    removeItem(k) { map.delete(k); },
    clear() { map.clear(); },
    get length() { return map.size; },
    key(i) { return Array.from(map.keys())[i] || null; },
  };
}
