# Contributing to seasonly

Thanks for taking the time to look at this. Most of the value seasonly will
ever have comes from contributors adding their own regional or community
calendars — the library is designed to make that easy.

By participating, you agree to follow the
[Code of Conduct](CODE_OF_CONDUCT.md) and license your contributions under
[MIT](../LICENSE).

---

## Project philosophy (non-negotiable)

These three properties are part of the public API contract. PRs that break
any of them will not land:

1. **Zero runtime AND zero dev dependencies.** CI fails the build the
   moment a single dependency sneaks into `package.json`. If a feature
   genuinely needs a dependency, open an issue first to discuss.
2. **Accessibility is not optional.** `prefers-reduced-motion: reduce`
   must result in zero animation, zero motion, zero particle render. No
   "lite mode" half-measure.
3. **The library never imposes copy or CTAs.** Banner text, calls to
   action, discount strings — all of those are the host application's
   responsibility. The library ships gradients, icons, particle effects,
   and dates. Never marketing content.

---

## Setting up

```bash
git clone https://github.com/StbanMc/seasonly.git
cd seasonly
npm test            # run the test suite (zero deps, native node --test)
npm run dev         # static dev server at http://localhost:5173
npm run size        # gzip size budget check
```

There is no `npm install` step required because the project has no
dependencies. The dev server, the tests, and the size budget all run on
plain Node 18+.

---

## Most welcome contribution: a new regional calendar

The bundled calendars (`co`, `global`) are a starting point, not a
ceiling. Calendars for `mx` (México), `ar` (Argentina), `cl` (Chile),
`pe` (Perú), `es` (España), `us`, religious calendars (`ramadan`,
`jewish-holidays`, `hindu-festivals`), and any community-specific
calendar are explicitly welcome.

### How to add one

1. Create `calendars/<your-id>.json`. Your id should be a short
   lowercase string — ISO 3166-1 alpha-2 country codes (`mx`, `ar`) or
   a clear community name (`hindu-festivals`).
2. Point your file at the schema for editor autocomplete:
   ```json
   {
     "$schema": "../docs/calendar.schema.json",
     "id": "mx",
     "name": "México",
     "version": "1.0.0",
     "seasons": [ ... ]
   }
   ```
3. For each season:
   - `id` and `name` are required.
   - **Either** `date` (`MM-DD`) **or** `rule` (moving holiday). Never
     both. Use a rule whenever the date is "the Nth weekday of a
     month" — even if you happen to know the date for this year.
   - `daysBefore` and `daysAfter` define the activation window around
     the peak.
   - `particles` chooses the visual effect from the registry (see
     [`src/components/particles-effects.js`](../src/components/particles-effects.js)).
   - `gradient`, `textColor`, `icon` are visual hints. Pick
     emotionally appropriate colors — Mother's Day is not Halloween.
4. **Cite your dates.** In the PR description, link to a primary
   source for any holiday whose date is non-obvious. Wikipedia,
   government decree, official calendar — whatever lets a future
   reviewer verify. Especially important for moving holidays.
5. Add a smoke test at `tests/calendars-<your-id>.test.js`:
   ```js
   import { test } from 'node:test';
   import assert from 'node:assert/strict';
   import { readFileSync } from 'node:fs';
   import { validateCalendar, resolveSeason } from '../src/index.js';

   const cal = JSON.parse(readFileSync(new URL('../calendars/mx.json', import.meta.url), 'utf8'));

   test('mx calendar is structurally valid', () => {
     const r = validateCalendar(cal);
     assert.equal(r.valid, true, r.errors.join('\n'));
   });

   test('mx: Día de Muertos resolves on 2026-11-02', () => {
     const r = resolveSeason(new Date(2026, 10, 2), cal);
     assert.equal(r && r.season.id, 'day-of-the-dead');
   });
   ```

### Cultural authenticity

If you are not from the culture whose calendar you are proposing, please
work with someone who is. The point of seasonly's calendar pluggability
is that holidays are observed *correctly*, not approximated.

---

## Adding a new particle effect

Less common but possible. Effects live in
[`src/components/particles-effects.js`](../src/components/particles-effects.js).
Each effect declares CSS keyframes, a randomization function, and
default/maximum particle counts. Read the existing effects — they're all
small and self-contained.

Requirements for a new effect:

- **GPU-only animation.** `transform` and `opacity` only. No `top`,
  `left`, `width`, `height` mutations in keyframes.
- **`will-change: transform, opacity`** stays as the base rule; do not
  override.
- **Stays inside its scoping selector.** A new `.foo` effect must
  scope all its rules under `.foo .particle` to avoid leaking when
  multiple effects are mounted.
- **No `!important` on `animation:` rules.** That would override the
  reduced-motion media query in the base CSS.
- **Tests**: extend `tests/particles-effects.test.js` to assert the
  effect appears in the registry, has a non-empty CSS string, and
  produces deterministic specs given a seeded RNG.
- **Update the schema validator** at
  [`src/core/schema-validator.js`](../src/core/schema-validator.js) so
  calendars can name your new effect via the `particles` field.

---

## Pull request checklist

Before requesting review:

- [ ] `npm test` passes
- [ ] `npm run size` stays under the budget
- [ ] `npm run verify:zero-deps` is green
- [ ] If you touched a Web Component, you opened a relevant
      `examples/*.html` page in `npm run dev` and verified the change
      visually.
- [ ] If your change affects accessibility, you tested with system
      "Reduce motion" toggled both ways.
- [ ] Commit messages are written in first person. **Do not include
      attributions to AI tooling, code generators, or assistants** in
      commit messages, PR descriptions, or code comments.
- [ ] You agree your contribution is licensed under MIT.

---

## Reporting a bug

Use the bug report template — it asks for the browser, the calendar
you used (bundled or custom URL), whether reduced motion is on, and a
minimal repro. The faster I can reproduce, the faster I can fix.

For security issues, do **not** open a public issue. See
[SECURITY.md](SECURITY.md).
