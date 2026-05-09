# Security policy

## Supported versions

Only the latest minor version receives security updates. Once 1.0.0 ships,
this section will list a rolling support window.

| Version  | Supported          |
| -------- | ------------------ |
| 0.1.x    | :white_check_mark: |
| < 0.1    | :x:                |

## Reporting a vulnerability

Please report security issues **privately** through GitHub Security
Advisories:

- Open https://github.com/StbanMc/seasonly/security/advisories/new
- Include reproduction steps and the affected version.
- Do **not** open a public issue or pull request.

I aim to acknowledge reports within 7 days and ship a fix or mitigation
within 30 days for confirmed issues. This is a volunteer-maintained
project — best-effort, not contractual.

## Threat model

What is **in scope** for security reports:

- **XSS in components.** Any path through which a calendar value, an
  attribute, or a property reaches the DOM as HTML rather than text.
- **CSS injection.** Calendar gradients or text colors that escape
  the `escapeCss` filter and write arbitrary CSS into the shadow root.
- **Unsafe href schemes.** Anything that lets `javascript:`, `data:`,
  `vbscript:`, `blob:`, `file:`, or similar reach an `href` attribute
  through `cta-href` or auto-init dataset values.
- **Calendar spoofing.** A remote calendar URL whose response bypasses
  `validateCalendar` and feeds arbitrary fields into render code.
- **Prototype pollution.** Any input that can mutate `Object.prototype`
  or framework internals.
- **Path traversal in `tools/serve.mjs`.** The dev server is shipped
  with the package — path-resolution bugs that escape the repo root
  are in scope.

What is **out of scope**:

- Issues only reachable when the host application has already been
  compromised (the library cannot defend against a malicious host).
- Lack of rate limiting (this is a client-side library; rate limiting
  is the host's responsibility).
- Breaking API changes — those are not security issues, they are
  semver issues.
- Social engineering or typosquatting against npm package names.
- Output that "looks similar to" a different brand or holiday.

## Defensive design notes

Reviewers may find these helpful:

- The components mount inside a Shadow DOM, so site CSS cannot reach
  internal selectors and internal CSS cannot leak out. CSP headers
  with `style-src` are accommodated by inlining a single
  `<style>` element built from validated input only.
- All user-facing text reaches the DOM via `textContent`, never
  `innerHTML`.
- `cta-href` is validated against an explicit scheme allow-list. The
  default behavior on an unsafe value is to drop the `<a>` and render
  a `<button>` instead — the link disappears but the page does not
  expose code execution.
- The auto-init script never throws into the host page. Failures from
  network errors, malformed JSON, or schema validation are logged
  through `console` only when `data-debug` is present, and the script
  exits silently otherwise.
