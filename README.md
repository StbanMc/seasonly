# seasonly

> Tiny, zero-dependency seasonal theming for any website.
> Date-aware banners and particles with a pluggable calendar system.
> LATAM-first (Colombia bundled), extensible to any country, religion, or custom calendar.

[![CI](https://github.com/StbanMc/seasonly/actions/workflows/ci.yml/badge.svg)](https://github.com/StbanMc/seasonly/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Status: 0.1.0 — first public release.** Resolver, schema validator, two
> bundled calendars (`co`, `global`), both Web Components
> (`<seasonly-banner>` and `<seasonly-particles>` with 14 effects), ESM
> auto-init for no-code platforms, zero runtime AND zero dev dependencies,
> ~20 KB gz total source. 105 tests, all green on Node 18 / 20 / 22 across
> Linux, Windows, and macOS. The composite `<seasonly-themes>` component, a
> Stackblitz playground, and the v1.0.0 stability promise are next.

[Leer en español](README.es.md) · [**Live demo →**](https://stbanmc.github.io/seasonly/)

---

## Why seasonly

Most "confetti" or "particles" libraries are calendar-blind: you decide
when to fire them. Most banner libraries are static. Most "holiday banner"
plugins are written assuming the calendar of one country (usually the US),
so Colombian *Día de las Velitas*, Mexican *Día de Muertos*, the Argentine
25 de Mayo, or any local moving holiday simply do not exist for them.

**seasonly** flips it: you mount the component once, and it resolves the
*active season* by date against a pluggable **calendar**. You can ship the
bundled `co` (Colombia) or `global` calendars, write your own, or merge
several. Moving holidays like Mother's Day (2nd Sunday of May) are
expressed as rules so the date is correct *every year* without manual
updates.

Design rules:

- **Zero runtime dependencies.** Validated in CI on every commit.
- **Browser-native.** Web Components, no framework lock-in.
- **No build step required for end users.** A `<script>` tag works.
- **Accessibility first.** Honors `prefers-reduced-motion` always.
- **Pluggable calendars.** Bundled, remote URL, inline object, or merged.

---

## Install

```bash
npm install seasonly
```

CDN (no install, no build):

```html
<!-- ESM, modern browsers -->
<script type="module">
  import { resolveSeason } from 'https://cdn.jsdelivr.net/npm/seasonly/+esm';
</script>
```

### One-liner auto-init for no-code platforms

Drop this single tag into WordPress, Shopify, Webflow, Squarespace or plain
HTML. The library reads its own `data-*` attributes, fetches the calendar,
resolves today's active season and mounts the banner and particles for you:

```html
<script type="module"
        src="https://cdn.jsdelivr.net/npm/seasonly@0/src/auto.js"
        data-locale="co"
        data-mode="banner+particles"
        data-message="Up to 30% off this Black Friday"
        data-cta-text="Shop now"
        data-cta-href="/promos">
</script>
```

Modes: `banner`, `particles`, `banner+particles`, `none`. Locales: `co`,
`global` (more via PR). Pass `data-calendar-url="..."` to load your own
calendar JSON. Add `data-debug` to see in the console exactly what got
loaded and mounted. The `cta-href` attribute is sanitized server-side
against an allow-list of safe schemes — `javascript:`, `data:`, `vbscript:`
and friends are silently dropped.

---

## Quick start (current v0.0.1-dev API)

```js
import { resolveSeason, validateCalendar, loadCalendar, mergeCalendars } from 'seasonly';
import co from 'seasonly/calendars/co.json' with { type: 'json' };

const today = new Date();
const active = resolveSeason(today, co);

if (active) {
  console.log(active.season.name, '· peak:', active.peakDate);
  console.log('days from peak:', active.distance);
} else {
  console.log('No active seasonal theme today.');
}
```

When several seasons overlap (e.g. *Black Friday* and *Día de las Velitas*
in late November / early December), the resolver returns the one closest
to its peak. Calendar declaration order is the deterministic tie-breaker.

---

## Calendar shape

A calendar is a plain JSON object. The
[JSON Schema](docs/calendar.schema.json) is published for editor
autocomplete (point your `$schema` at it).

```jsonc
{
  "$schema": "https://stbanmc.github.io/seasonly/calendar.schema.json",
  "id": "my-calendar",
  "name": "My Custom Calendar",
  "version": "1.0.0",
  "seasons": [
    {
      "id": "company-anniversary",
      "name": "7 years",
      "date": "03-15",
      "daysBefore": 7,
      "daysAfter": 3,
      "particles": "confetti",
      "gradient": ["#ff6a00", "#ee0979"],
      "textColor": "#ffffff",
      "icon": "🎉"
    },
    {
      "id": "mothers-day-co",
      "name": "Día de la Madre",
      "rule": { "type": "weekday", "month": 5, "weekday": 0, "occurrence": 2 },
      "daysBefore": 7,
      "daysAfter": 7,
      "particles": "flowers"
    }
  ]
}
```

**Season fields:**

- `id` (required) — unique within the calendar.
- `name` (required) — display name.
- **Either** `date` (`MM-DD` fixed) **or** `rule` (moving holiday).
  - `rule.type: "weekday"` with `month` (1–12), `weekday` (0=Sun…6=Sat),
    and `occurrence` (1..5 for *Nth*, `-1` for last). Handles
    Mother's/Father's day, Black Friday, Thanksgiving, last Saturday of
    a month, etc., correctly across years.
- `daysBefore` / `daysAfter` — window around the peak (default 0).
- `particles` — one of: `none`, `snowflakes`, `hearts`, `confetti`, `stars`,
  `fireworks`, `balloons`, `flowers`, `flags`, `kites`, `lightning`,
  `candles`, `bats`, `leaves`, `petals`. (Renderer lands in 0.1.0.)
- `gradient`, `textColor`, `icon` — visual hints used by the upcoming
  components. **Banner copy and CTAs are always provided by the host
  application**, never by the library.

---

## Bundled calendars

| id       | Seasons                                                                 |
| -------- | ----------------------------------------------------------------------- |
| `co`     | 14 — full Colombian calendar (Velitas, Independencia, Amor y Amistad, etc.) |
| `global` | 5 — universal (New Year, Valentine's, Halloween, Christmas, NYE)        |

More regional calendars (`mx`, `ar`, `cl`, `pe`, `es`, `us`, religious
calendars) are explicitly welcome via PR. See `CONTRIBUTING.md` once 0.1.0
ships.

---

## Roadmap

- [x] Date resolver with proximity-to-peak ranking
- [x] Calendar schema validator (zero-dep)
- [x] Moving-holiday rules (`rule.type: weekday`)
- [x] Calendars: `co`, `global`
- [x] Calendar loader (inline / URL / bundled)
- [x] Public JSON Schema for VS Code autocomplete
- [x] `<seasonly-banner>` Web Component (Shadow DOM, glassmorphism, dismiss persistence)
- [x] `<seasonly-particles>` Web Component with 14 CSS-only, GPU-only effects
- [x] `prefers-reduced-motion` respected end-to-end (CSS + JS code paths)
- [x] Auto-init `<script type="module" data-locale="co">` mode
- [x] Bundle-size budget enforced in CI (~20 KB gzip across the whole `src/`)
- [x] Interactive demo at `index.html` (date slider + season timeline + live code snippet) ready for GitHub Pages
- [ ] `<seasonly-themes>` composite component (banner + particles, single tag)
- [ ] Dual ESM + CJS + IIFE build for legacy `<script>` users (deferred to v1.1)
- [ ] Stackblitz playground embedded in docs

---

## Running the examples locally

The `examples/` HTML pages import ES modules, which browsers refuse to load
over `file://` URLs (null-origin CORS — this is correct browser behavior, not
a bug). Run the bundled dev server:

```bash
npm run dev
# → http://localhost:5173/examples/01-banner-basic.html
```

The dev server has zero dependencies (`tools/serve.mjs`, ~80 LoC built on
Node's `http` module). It binds to 127.0.0.1 only and validates that every
served path stays inside the repo.

If you accidentally open an example with `file://`, the page now detects it
and shows a clear overlay with the correct URL.

## License

MIT © 2026 Esteban Esquivel
