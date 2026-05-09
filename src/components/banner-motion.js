// Motion preference helper. Pure: takes any matchMedia-shaped function and
// returns a stable boolean. Used by the banner to honor
// `prefers-reduced-motion: reduce` even for code paths that JS controls
// (the CSS @media query handles the rest).

const QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion(matchMedia) {
  if (typeof matchMedia !== 'function') return false;
  try {
    const mql = matchMedia(QUERY);
    return !!(mql && mql.matches);
  } catch (_err) {
    return false;
  }
}

export const REDUCED_MOTION_QUERY = QUERY;
