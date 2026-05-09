// Pure parser + helpers for the auto-init <script> path.
// No DOM access here — the browser entry (auto.js) reads the script's
// dataset and feeds it through these functions. Keeping the logic pure
// means we can unit-test it in Node, including the security gates.

const ALLOWED_MODES = new Set(['banner', 'particles', 'banner+particles', 'none']);
const ALLOWED_POSITIONS = new Set(['top', 'bottom']);
const ALLOWED_DISMISS = new Set(['day', 'season']);

// CTA hrefs are inserted as anchor `href` values. We refuse any scheme
// that can run code or touch the local filesystem. Allowed:
//   - http(s)://...
//   - /relative paths
//   - #fragment
//   - ?query
//   - mailto:
//   - tel:
// Everything else (javascript:, data:, file:, vbscript:, blob:, raw text)
// is dropped. The banner then renders a <button> instead of an <a>.
const SAFE_HREF = /^(?:https?:\/\/|\/|#|\?|mailto:|tel:)/i;

export function isSafeHref(href) {
  if (typeof href !== 'string' || href.length === 0) return false;
  return SAFE_HREF.test(href.trim());
}

function readString(dataset, key) {
  const v = dataset && dataset[key];
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readBoolean(dataset, key) {
  const v = dataset && dataset[key];
  if (typeof v !== 'string') return false;
  const t = v.trim().toLowerCase();
  return t === '' || t === 'true' || t === '1' || t === 'yes';
}

function readPositiveInt(dataset, key) {
  const raw = readString(dataset, key);
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

function readFiniteNumber(dataset, key) {
  const raw = readString(dataset, key);
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// Parse a DOMStringMap-shaped object (or any plain object with the same
// keys) into a fully validated options bag. Unknown / malformed values
// fall back to documented defaults instead of throwing — auto-init must
// never crash the host page.
export function parseAutoInitOptions(dataset) {
  const ds = dataset && typeof dataset === 'object' ? dataset : {};

  const mode = readString(ds, 'mode');
  const position = readString(ds, 'position');
  const dismiss = readString(ds, 'dismissMode');
  const ctaHref = readString(ds, 'ctaHref');

  return {
    locale: readString(ds, 'locale') || 'global',
    calendarUrl: readString(ds, 'calendarUrl'),
    mode: ALLOWED_MODES.has(mode) ? mode : 'banner+particles',
    position: ALLOWED_POSITIONS.has(position) ? position : 'top',
    message: readString(ds, 'message'),
    ctaText: readString(ds, 'ctaText'),
    ctaHref: isSafeHref(ctaHref) ? ctaHref.trim() : null,
    dismissMode: ALLOWED_DISMISS.has(dismiss) ? dismiss : 'day',
    particlesCount: readPositiveInt(ds, 'particlesCount'),
    particlesEffect: readString(ds, 'particlesEffect'),
    seed: readFiniteNumber(ds, 'seed'),
    debug: readBoolean(ds, 'debug'),
  };
}

// Decide whether a parsed options bag wants the banner / particles to
// be mounted. Used by the browser entry to skip work cleanly.
export function shouldMountBanner(options) {
  return options.mode === 'banner' || options.mode === 'banner+particles';
}

export function shouldMountParticles(options) {
  return options.mode === 'particles' || options.mode === 'banner+particles';
}

export const _allowed = {
  modes: ALLOWED_MODES,
  positions: ALLOWED_POSITIONS,
  dismissModes: ALLOWED_DISMISS,
  hrefSchemes: SAFE_HREF,
};
