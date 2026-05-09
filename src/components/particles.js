// <seasonly-particles> — renders the particle layer for a seasonal theme.
// Browser-only (extends HTMLElement). For SSR/tests, import the pure
// submodules instead: particles-effects, particles-rng.
//
// Property API:
//   el.theme = season  // uses theme.particles
// Attribute API:
//   <seasonly-particles effect="snowflakes" count="20" seed="42"></seasonly-particles>
//
// Behavior:
//   - `prefers-reduced-motion: reduce` → renders nothing. Users who set
//     this preference are explicitly asking us to not move things; a
//     decorative particle layer is exactly the kind of motion they want
//     suppressed.
//   - Unknown effect or "none" → renders nothing.
//   - Cleans up on disconnect.

import {
  buildParticlesCSS,
  generateParticles,
  getEffect,
} from './particles-effects.js';
import { createRng } from './particles-rng.js';
import { prefersReducedMotion } from './banner-motion.js';

const TAG = 'seasonly-particles';

class SeasonlyParticles extends HTMLElement {
  static get observedAttributes() {
    return ['effect', 'count', 'seed'];
  }

  constructor() {
    super();
    this._theme = null;
    this._mounted = false;
    this._root = this.attachShadow({ mode: 'open' });
  }

  set theme(value) {
    this._theme = value && typeof value === 'object' ? value : null;
    if (this._mounted) this._render();
  }
  get theme() { return this._theme; }

  connectedCallback() {
    this._mounted = true;
    this._render();
  }

  disconnectedCallback() {
    this._mounted = false;
    this._root.replaceChildren();
  }

  attributeChangedCallback() {
    if (this._mounted) this._render();
  }

  _resolveEffect() {
    const attr = this.getAttribute('effect');
    if (attr) return attr;
    if (this._theme && typeof this._theme.particles === 'string') return this._theme.particles;
    return 'none';
  }

  _render() {
    const root = this._root;
    const effectName = this._resolveEffect();
    const effect = getEffect(effectName);

    if (!effect || effectName === 'none') {
      root.replaceChildren();
      return;
    }

    const win = this.ownerDocument && this.ownerDocument.defaultView;
    const reduced = prefersReducedMotion(win && win.matchMedia);
    if (reduced) {
      root.replaceChildren();
      return;
    }

    const countAttr = this.getAttribute('count');
    const seedAttr = this.getAttribute('seed');
    const count = countAttr != null && countAttr !== '' ? Number(countAttr) : null;
    const seed = seedAttr != null && seedAttr !== '' ? Number(seedAttr) : null;
    const rng = createRng(Number.isFinite(seed) ? seed : null);
    const specs = generateParticles(
      effectName,
      Number.isFinite(count) ? count : null,
      rng,
    );

    const style = document.createElement('style');
    style.textContent = buildParticlesCSS(effectName);

    const container = document.createElement('div');
    container.className = 'particles ' + effectName;
    container.setAttribute('aria-hidden', 'true');

    for (const spec of specs) {
      const node = document.createElement('span');
      node.className = 'particle';
      for (const key in spec) {
        const value = spec[key];
        if (value == null) continue;
        if (key === 'glyph') {
          node.textContent = value;
        } else if (key.startsWith('--')) {
          node.style.setProperty(key, value);
        } else {
          node.style[key] = value;
        }
      }
      container.appendChild(node);
    }

    root.replaceChildren(style, container);
  }
}

export function defineSeasonlyParticles(tagName = TAG) {
  if (typeof customElements === 'undefined') return false;
  if (customElements.get(tagName)) return true;
  customElements.define(tagName, SeasonlyParticles);
  return true;
}

export { SeasonlyParticles };
export default SeasonlyParticles;
