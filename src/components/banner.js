// <seasonly-banner> — a Web Component that renders a single seasonal
// banner inside a Shadow DOM. Browser-only; importing this module in Node
// will throw (HTMLElement is undefined). Use the pure submodules
// (banner-style, banner-storage, banner-motion) for SSR or tests.
//
// Public surface:
//   - default export: SeasonlyBanner class
//   - defineSeasonlyBanner(name?): registers the custom element
//
// Property API (preferred over attributes):
//   banner.theme    = season-shaped object  (required to render)
//   banner.message  = string                 (optional title text)
//   banner.ctaText  = string                 (optional)
//   banner.ctaHref  = string                 (optional)
//
// Attribute API (mirrors a subset; useful for no-code platforms):
//   <seasonly-banner position="top|bottom" message="..." cta-text="..."
//                    cta-href="..." dismiss-mode="day|season"></seasonly-banner>
//
// Events:
//   - "seasonly:show"     fired after first render
//   - "seasonly:dismiss"  fired when the user dismisses the banner
//   - "seasonly:cta"      fired when the CTA is activated

import { buildBannerCSS } from './banner-style.js';
import { dismissKey, isDismissed, markDismissed, createMemoryStorage } from './banner-storage.js';
import { prefersReducedMotion } from './banner-motion.js';

const TAG = 'seasonly-banner';

function safeStorage(win) {
  try {
    if (win && win.localStorage) return win.localStorage;
  } catch (_e) { /* sandboxed iframe / privacy mode */ }
  return createMemoryStorage();
}

function emit(target, name, detail) {
  target.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
}

class SeasonlyBanner extends HTMLElement {
  static get observedAttributes() {
    return ['position', 'message', 'cta-text', 'cta-href', 'dismiss-mode'];
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

  set message(v) { this.setAttribute('message', v == null ? '' : String(v)); }
  get message() { return this.getAttribute('message') || ''; }

  set ctaText(v) { this.setAttribute('cta-text', v == null ? '' : String(v)); }
  get ctaText() { return this.getAttribute('cta-text') || ''; }

  set ctaHref(v) { this.setAttribute('cta-href', v == null ? '' : String(v)); }
  get ctaHref() { return this.getAttribute('cta-href') || ''; }

  connectedCallback() {
    this._mounted = true;
    this._render();
  }

  disconnectedCallback() {
    this._mounted = false;
  }

  attributeChangedCallback() {
    if (this._mounted) this._render();
  }

  _shouldHide() {
    const theme = this._theme;
    if (!theme || !theme.id) return false;
    const mode = this.getAttribute('dismiss-mode') || 'day';
    const key = dismissKey({
      themeId: theme.id,
      mode,
      today: new Date(),
      windowEnd: theme._windowEnd instanceof Date ? theme._windowEnd : undefined,
    });
    return isDismissed(safeStorage(this.ownerDocument && this.ownerDocument.defaultView), key);
  }

  _render() {
    const theme = this._theme;
    const root = this._root;

    if (!theme) {
      root.innerHTML = '';
      return;
    }

    if (this._shouldHide()) {
      root.innerHTML = '';
      return;
    }

    const position = this.getAttribute('position') === 'bottom' ? 'bottom' : 'top';
    const message = this.message || theme.name || '';
    const ctaText = this.ctaText;
    const ctaHref = this.ctaHref;
    const reduced = prefersReducedMotion(
      this.ownerDocument && this.ownerDocument.defaultView && this.ownerDocument.defaultView.matchMedia,
    );

    const style = document.createElement('style');
    style.textContent = buildBannerCSS(theme);

    const banner = document.createElement('aside');
    banner.className = 'banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Seasonal banner');
    banner.dataset.position = position;
    banner.dataset.themeId = theme.id || '';
    banner.dataset.state = reduced ? 'visible' : 'entering';

    if (theme.icon) {
      const icon = document.createElement('span');
      icon.className = 'icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = theme.icon;
      banner.appendChild(icon);
    }

    const msgEl = document.createElement('div');
    msgEl.className = 'message';
    if (theme.name) {
      const title = document.createElement('span');
      title.className = 'title';
      title.textContent = theme.name;
      msgEl.appendChild(title);
    }
    if (message && message !== theme.name) {
      msgEl.appendChild(document.createTextNode(message));
    }
    banner.appendChild(msgEl);

    if (ctaText) {
      let ctaEl;
      if (ctaHref) {
        ctaEl = document.createElement('a');
        ctaEl.href = ctaHref;
      } else {
        ctaEl = document.createElement('button');
        ctaEl.type = 'button';
      }
      ctaEl.className = 'cta';
      ctaEl.textContent = ctaText;
      ctaEl.addEventListener('click', () => {
        emit(this, 'seasonly:cta', { theme });
      });
      banner.appendChild(ctaEl);
    }

    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'dismiss';
    dismiss.setAttribute('aria-label', 'Dismiss');
    dismiss.textContent = '×';
    dismiss.addEventListener('click', () => this._handleDismiss());
    banner.appendChild(dismiss);

    root.replaceChildren(style, banner);

    if (!reduced) {
      requestAnimationFrame(() => {
        banner.dataset.state = 'visible';
      });
    }
    emit(this, 'seasonly:show', { theme });
  }

  _handleDismiss() {
    const theme = this._theme;
    const root = this._root;
    const banner = root.querySelector('.banner');
    if (!banner) return;

    const mode = this.getAttribute('dismiss-mode') || 'day';
    const key = theme ? dismissKey({
      themeId: theme.id,
      mode,
      today: new Date(),
      windowEnd: theme._windowEnd instanceof Date ? theme._windowEnd : undefined,
    }) : null;
    const win = this.ownerDocument && this.ownerDocument.defaultView;
    if (key) markDismissed(safeStorage(win), key);

    const reduced = prefersReducedMotion(win && win.matchMedia);
    if (reduced) {
      root.innerHTML = '';
      emit(this, 'seasonly:dismiss', { theme, mode });
      return;
    }

    banner.dataset.state = 'leaving';
    const cleanup = () => {
      banner.removeEventListener('transitionend', cleanup);
      root.innerHTML = '';
      emit(this, 'seasonly:dismiss', { theme, mode });
    };
    banner.addEventListener('transitionend', cleanup);
    setTimeout(cleanup, 700);
  }
}

export function defineSeasonlyBanner(tagName = TAG) {
  if (typeof customElements === 'undefined') return false;
  if (customElements.get(tagName)) return true;
  customElements.define(tagName, SeasonlyBanner);
  return true;
}

export { SeasonlyBanner };
export default SeasonlyBanner;
