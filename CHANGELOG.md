# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-05-09

First public release. Resolver, schema validator, two bundled calendars,
two Web Components with 14 effects, ESM auto-init for no-code platforms,
zero runtime AND zero dev dependencies, ~20 KB gz total source. 105 tests,
all green on Node 18 / 20 / 22 across Linux, Windows, and macOS.

### Added
- Core date resolver with proximity-to-peak ranking for overlapping seasons.
- Two date formats per season: fixed (`MM-DD`) and dynamic weekday rule (`{ month, weekday, occurrence }`) — handles Mother's Day (2nd Sunday of May), Father's Day (3rd Sunday of June), and similar moving holidays correctly across years.
- Zero-dependency JSON schema validator for calendar files.
- Bundled calendars: `co` (Colombia) and `global`.
- Public JSON Schema at `docs/calendar.schema.json` for VS Code autocomplete on custom calendars.
- `<seasonly-banner>` Web Component with Shadow DOM encapsulation, animated gradient, glassmorphism (`backdrop-filter`), spring easing on the CTA, dismiss button, and `prefers-reduced-motion` honored both in CSS and in JS code paths.
- Dismiss persistence with two modes: `day` (resets at local midnight) and `season` (resets when the window ends). Storage failures (private mode, quota, sandboxed iframes) degrade silently to in-memory.
- Subpath exports so consumers can import only what they need:
  - `seasonly` — Node-safe core (resolver, validator, loader)
  - `seasonly/components` and `seasonly/components/banner` — browser-only Web Component
  - `seasonly/components/banner-style|storage|motion` — pure submodules safe in Node
- Manual browser smoke test at `examples/01-banner-basic.html`.
- `<seasonly-particles>` Web Component with 14 bundled effects: `snowflakes`, `hearts`, `confetti`, `stars`, `fireworks`, `balloons`, `flowers`, `flags`, `kites`, `lightning`, `candles`, `bats`, `leaves`, `petals` (plus `none`). All effects are CSS-only with GPU-friendly transforms (`translate3d`, `scale`, `rotate`), `will-change` set correctly, and `pointer-events: none` so the layer never blocks user interaction.
- Confetti uses a curated 8-color palette (no glyphs) so it feels modern instead of clip-art rainbow. Candles and stars carry per-particle drop-shadow glows. Lightning uses radial-gradient flash overlays at randomized origins instead of small particles.
- `prefers-reduced-motion: reduce` results in an empty render — users with vestibular sensitivities set this preference precisely to suppress decorative motion, so the right answer is to render nothing.
- Seedable Mulberry32 PRNG (`particles-rng.js`) so particle layouts are deterministic when a `seed` attribute is provided. Useful for tests, snapshots, and reproducible visual demos.
- Two more browser smoke pages: `examples/02-particles-gallery.html` (all effects side-by-side) and `examples/03-banner-and-particles.html` (composed view).
- `defineAll()` convenience helper from `seasonly/components` to register both Web Components in one call.
- ESM auto-init via `src/auto.js`. A single `<script type="module" src="…/seasonly/auto" data-locale="co" data-mode="banner+particles">` tag mounts everything with no glue code. Designed for WordPress, Shopify, Webflow, Squarespace and plain HTML.
- `parseAutoInitOptions(dataset)` — pure parser shared between `auto.js` and tests. Strict whitelisting of `mode`, `position`, `dismissMode`. Sanitization of `cta-href` against an allow-list of safe schemes (`http`, `https`, `/`, `#`, `?`, `mailto`, `tel`); `javascript:`, `data:`, `vbscript:`, `blob:`, `file:`, etc. are dropped silently and the banner falls back to `<button>` instead of `<a>`. Auto-init never throws into the host page.
- `package.json` declares `"unpkg"` and `"jsdelivr"` fields pointing at `auto.js`, so jsDelivr/unpkg one-liners just work without a bundler. Subpath exports added for `./auto`, `./auto-init`.
- Bundle-size budget script (`npm run size`) using only Node's built-in `zlib.gzipSync`. Default budget 25 KB gzip across all of `src/`. Override with `SEASONLY_BUDGET=<bytes>`. Reported total at this commit: ~20 KB gz (5.5 KB headroom).
- `verify:zero-deps` now also fails on any `devDependencies`, matching the m365-graph-mail convention of "zero runtime AND dev deps".
- `examples/04-auto-init.html` — paste-and-go smoke for the no-code path.
- `tools/serve.mjs` + `npm run dev` — tiny zero-dependency static server using only Node's built-in `http` module. Required because browsers (correctly) refuse to load ES modules over `file://` URLs (null-origin CORS). Default port 5173, listens on 127.0.0.1 only, validates that every served path stays inside the repo root, returns proper MIME types so the browser will execute `.js` and parse `.json`.
- Each example HTML now detects when it has been opened via `file://` and shows a clear instruction overlay pointing to `npm run dev` and the correct `http://localhost:5173/...` URL, so the failure mode is helpful instead of silent.
- Interactive landing page at `index.html` (repo root). Designed to deploy to GitHub Pages from `main:/`. Hero with the day's resolved season auto-mounted as background particles, then a live preview panel: a date slider that lets you walk through every day of 2026 with the banner and particles re-rendering in real time, and a side panel that shows the resolved season's id, name, peak date, distance, particles type, gradient swatch, and a syntax-highlighted live `resolveSeason()` snippet that updates per slider position. Below it: a year-at-a-glance timeline with one clickable dot per peak (icons from each season) — click any dot to jump the slider to that date. Glassmorphism, spring easing, gradient hero text, system font stack, dark by default with `prefers-color-scheme` light variant, `prefers-reduced-motion` honored, no web fonts, no tracking, zero deps. Imports modules from the same origin via relative paths, which is why GitHub Pages must be configured from `main:/` rather than `/docs`.
- `homepage` in `package.json` now points to the live demo URL.
