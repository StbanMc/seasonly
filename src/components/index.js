// Browser-only entrypoint. Importing this module in Node will throw
// because the underlying Web Component classes extend HTMLElement.
// For Node usage (SSR, tests), import the pure submodules directly:
//   - 'seasonly/components/banner-style'
//   - 'seasonly/components/banner-storage'
//   - 'seasonly/components/banner-motion'
//   - 'seasonly/components/particles-effects'
//   - 'seasonly/components/particles-rng'

export { SeasonlyBanner, defineSeasonlyBanner } from './banner.js';
export { SeasonlyParticles, defineSeasonlyParticles } from './particles.js';

import { defineSeasonlyBanner } from './banner.js';
import { defineSeasonlyParticles } from './particles.js';

// Convenience: register both Web Components with their default tag names.
// Call this once at app startup; subsequent calls are no-ops.
export function defineAll() {
  defineSeasonlyBanner();
  defineSeasonlyParticles();
}
