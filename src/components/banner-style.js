// Pure stylesheet builder for <seasonly-banner>.
// Returns a string ready to drop inside a <style> tag in the shadow root.
// Kept browser-free so it can be unit-tested in Node.

const DEFAULT_GRADIENT = ['#0f172a', '#475569'];
const DEFAULT_TEXT = '#f8fafc';

function escapeCss(value) {
  // Defensive: allow only characters expected in a CSS color string.
  // Anything else collapses to the safe default.
  if (typeof value !== 'string') return null;
  if (!/^[#0-9a-zA-Z(),.\s%/-]+$/.test(value)) return null;
  return value;
}

function pickGradient(theme) {
  if (!theme || !Array.isArray(theme.gradient) || theme.gradient.length < 2) {
    return DEFAULT_GRADIENT;
  }
  const cleaned = theme.gradient.map(escapeCss).filter(Boolean);
  return cleaned.length >= 2 ? cleaned : DEFAULT_GRADIENT;
}

function pickTextColor(theme) {
  if (!theme || !theme.textColor) return DEFAULT_TEXT;
  return escapeCss(theme.textColor) || DEFAULT_TEXT;
}

// Returns a CSS string for a Seasonly banner shadow root, parameterized by
// theme. The CSS only references theme-derived values that have been
// validated by escapeCss; anything else falls back to a safe default.
export function buildBannerCSS(theme) {
  const [c1, c2] = pickGradient(theme);
  const text = pickTextColor(theme);

  return `
:host {
  --seasonly-c1: ${c1};
  --seasonly-c2: ${c2};
  --seasonly-text: ${text};
  --seasonly-shadow: rgba(15, 23, 42, 0.35);
  --seasonly-radius: 0;
  --seasonly-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  display: block;
}

.banner {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 2147483646;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: system-ui, -apple-system, "Segoe UI", "Inter", "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  color: var(--seasonly-text);
  background: linear-gradient(135deg, var(--seasonly-c1), var(--seasonly-c2));
  background-size: 200% 200%;
  animation: seasonly-shift 14s ease-in-out infinite;
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 8px 32px -10px var(--seasonly-shadow);
  transform: translateY(0);
  opacity: 1;
  transition: transform 0.5s var(--seasonly-spring), opacity 0.4s ease;
  border-radius: var(--seasonly-radius);
}

.banner[data-position="bottom"] {
  top: auto;
  bottom: 0;
}

.banner[data-state="entering"] { transform: translateY(-100%); opacity: 0; }
.banner[data-position="bottom"][data-state="entering"] { transform: translateY(100%); }
.banner[data-state="leaving"] { transform: translateY(-100%); opacity: 0; }
.banner[data-position="bottom"][data-state="leaving"] { transform: translateY(100%); }

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
}

.message {
  flex: 1;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
}

.title {
  font-weight: 600;
  margin-right: 6px;
}

.cta {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.18);
  color: inherit;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 9999px;
  padding: 6px 14px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: transform 0.25s var(--seasonly-spring), background-color 0.2s ease, border-color 0.2s ease;
}

.cta:hover,
.cta:focus-visible {
  background: rgba(255, 255, 255, 0.28);
  border-color: rgba(255, 255, 255, 0.45);
  transform: translateY(-1px);
}

.cta:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.dismiss {
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 18px;
  line-height: 1;
  border-radius: 50%;
  transition: background-color 0.2s ease, transform 0.25s var(--seasonly-spring);
}

.dismiss:hover,
.dismiss:focus-visible {
  background: rgba(255, 255, 255, 0.18);
  transform: scale(1.05);
}

.dismiss:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

@keyframes seasonly-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .banner,
  .cta,
  .dismiss { animation: none !important; transition: none !important; }
}

@media (max-width: 480px) {
  .banner { padding: 10px 12px; font-size: 13px; gap: 8px; }
  .cta { padding: 5px 10px; font-size: 12px; }
  .icon { width: 24px; height: 24px; font-size: 18px; }
}
`.trim();
}

export const _internals = { escapeCss, pickGradient, pickTextColor, DEFAULT_GRADIENT, DEFAULT_TEXT };
