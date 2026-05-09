// Browser entrypoint for the no-code <script> path. Drop this in any
// page with a <script type="module"> tag and seasonly will mount itself
// from the data-* attributes on that very tag.
//
// Example:
//   <script type="module"
//           src="https://cdn.jsdelivr.net/npm/seasonly@0/src/auto.js"
//           data-locale="co"
//           data-mode="banner+particles"
//           data-message="Black Friday: 30% off"
//           data-cta-text="Shop"
//           data-cta-href="/promos">
//   </script>
//
// Behavior:
//   - Loads the requested calendar (bundled by `data-locale`, or remote
//     via `data-calendar-url`).
//   - Resolves today's active season; if none, exits silently.
//   - Mounts <seasonly-banner> and/or <seasonly-particles> per
//     `data-mode`.
//   - Honors `prefers-reduced-motion` via the components themselves.
//
// Security:
//   - All user-supplied strings (message, ctaText) reach the DOM via
//     textContent inside the components.
//   - ctaHref is validated against an allow-list of schemes; unsafe
//     values are dropped (button instead of anchor).
//   - Calendars loaded over the network are validated through the
//     same schema validator the bundled ones go through.

import { resolveSeason } from './core/resolver.js';
import { loadCalendar } from './core/loader.js';
import { defineSeasonlyBanner } from './components/banner.js';
import { defineSeasonlyParticles } from './components/particles.js';
import {
  parseAutoInitOptions,
  shouldMountBanner,
  shouldMountParticles,
} from './auto-init.js';

const SCRIPT = (function findOwnScript() {
  if (typeof document === 'undefined') return null;
  if (document.currentScript) return document.currentScript;
  // Fallback for some bundlers / older inlining: pick the last seasonly script
  // we can find. This is a best-effort path; modern usage hits currentScript.
  const scripts = document.querySelectorAll('script[src*="seasonly"]');
  return scripts.length > 0 ? scripts[scripts.length - 1] : null;
})();

const dataset = SCRIPT && SCRIPT.dataset ? SCRIPT.dataset : {};
const options = parseAutoInitOptions(dataset);
const debug = options.debug
  ? (...args) => console.log('[seasonly]', ...args)
  : () => {};

async function loadCalendarForOptions(opts) {
  if (opts.calendarUrl) {
    debug('loading remote calendar:', opts.calendarUrl);
    return loadCalendar(opts.calendarUrl);
  }
  const url = new URL('../calendars/' + opts.locale + '.json', import.meta.url).toString();
  debug('loading bundled calendar:', opts.locale, '→', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Calendar fetch failed (' + res.status + '): ' + url);
  return loadCalendar(await res.json());
}

function mount(season, opts) {
  defineSeasonlyBanner();
  defineSeasonlyParticles();

  if (shouldMountParticles(opts)) {
    const particles = document.createElement('seasonly-particles');
    particles.theme = season;
    if (opts.particlesEffect) particles.setAttribute('effect', opts.particlesEffect);
    if (opts.particlesCount != null) particles.setAttribute('count', String(opts.particlesCount));
    if (opts.seed != null) particles.setAttribute('seed', String(opts.seed));
    document.body.appendChild(particles);
    debug('mounted <seasonly-particles>');
  }

  if (shouldMountBanner(opts)) {
    const banner = document.createElement('seasonly-banner');
    banner.theme = season;
    if (opts.position === 'bottom') banner.setAttribute('position', 'bottom');
    if (opts.message) banner.setAttribute('message', opts.message);
    if (opts.ctaText) banner.setAttribute('cta-text', opts.ctaText);
    if (opts.ctaHref) banner.setAttribute('cta-href', opts.ctaHref);
    if (opts.dismissMode === 'season') banner.setAttribute('dismiss-mode', 'season');
    document.body.appendChild(banner);
    debug('mounted <seasonly-banner>');
  }
}

if (typeof document !== 'undefined' && options.mode !== 'none') {
  (async () => {
    try {
      const calendar = await loadCalendarForOptions(options);
      const today = new Date();
      const active = resolveSeason(today, calendar);
      if (!active) {
        debug('no active season for', today.toDateString(), '— exiting silently');
        return;
      }
      debug('active:', active.season.id, '· distance:', active.distance, 'd');
      const run = () => mount(active.season, options);
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run, { once: true });
      } else {
        run();
      }
    } catch (err) {
      // Auto-init must never throw into the host page.
      debug('init failed:', err && err.message ? err.message : err);
    }
  })();
}
