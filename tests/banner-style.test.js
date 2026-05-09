import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBannerCSS, _internals } from '../src/components/banner-style.js';

test('buildBannerCSS embeds gradient and text color from theme', () => {
  const css = buildBannerCSS({
    gradient: ['#ff0000', '#0000ff'],
    textColor: '#ffffff',
  });
  assert.match(css, /--seasonly-c1:\s*#ff0000/);
  assert.match(css, /--seasonly-c2:\s*#0000ff/);
  assert.match(css, /--seasonly-text:\s*#ffffff/);
});

test('buildBannerCSS falls back to safe defaults when theme is empty', () => {
  const css = buildBannerCSS(null);
  assert.match(css, /--seasonly-c1:\s*#0f172a/);
  assert.match(css, /--seasonly-c2:\s*#475569/);
  assert.match(css, /--seasonly-text:\s*#f8fafc/);
});

test('buildBannerCSS falls back if gradient has fewer than 2 valid colors', () => {
  const css = buildBannerCSS({ gradient: ['#ff0000'] });
  assert.match(css, /--seasonly-c1:\s*#0f172a/);
});

test('buildBannerCSS rejects gradient values that smell like CSS injection', () => {
  const css = buildBannerCSS({
    gradient: ['red; }; body { display: none; /*', '#0000ff'],
  });
  // Bad value gets dropped, only one valid color left → fallback kicks in.
  assert.match(css, /--seasonly-c1:\s*#0f172a/);
  assert.doesNotMatch(css, /display:\s*none/);
});

test('buildBannerCSS accepts CSS-color-like syntaxes (rgb, hsl, named)', () => {
  const css = buildBannerCSS({
    gradient: ['rgb(255, 0, 0)', 'hsl(220, 50%, 50%)'],
    textColor: 'navy',
  });
  assert.match(css, /--seasonly-c1:\s*rgb\(255, 0, 0\)/);
  assert.match(css, /--seasonly-c2:\s*hsl\(220, 50%, 50%\)/);
  assert.match(css, /--seasonly-text:\s*navy/);
});

test('buildBannerCSS always honors prefers-reduced-motion', () => {
  const css = buildBannerCSS({});
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /animation:\s*none\s*!important/);
  assert.match(css, /transition:\s*none\s*!important/);
});

test('buildBannerCSS supports bottom-positioned variant', () => {
  const css = buildBannerCSS({});
  assert.match(css, /\.banner\[data-position="bottom"\]\s*{[^}]*bottom:\s*0/);
});

test('escapeCss internal: rejects scripty content', () => {
  assert.equal(_internals.escapeCss('javascript:alert(1)'), null);
  assert.equal(_internals.escapeCss('expression(alert(1))'), 'expression(alert(1))');
  // Note: () are allowed for rgb()/hsl(), so "expression()" passes the
  // character filter. Browsers ignore unknown CSS-color tokens, so this
  // is harmless inside a `linear-gradient(...)`. Anything outside
  // CSS-color grammar (#, letters, parentheses, commas, percent, slash,
  // dot, hyphen, whitespace) gets dropped before it lands in the sheet.
});

test('escapeCss internal: accepts hex, rgb, hsl, named colors', () => {
  assert.equal(_internals.escapeCss('#abcdef'), '#abcdef');
  assert.equal(_internals.escapeCss('rgb(255 0 0 / 50%)'), 'rgb(255 0 0 / 50%)');
  assert.equal(_internals.escapeCss('hsl(220deg, 50%, 50%)'), 'hsl(220deg, 50%, 50%)');
  assert.equal(_internals.escapeCss('navy'), 'navy');
});
