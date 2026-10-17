// Path the site is served under: '' at the root of a domain, '/c5catalogue'
// for a GitHub Pages project site. The deploy workflow sets BASE_PATH; both
// astro.config.mjs and the generator read it here, so page links and the
// links inside the generated catalogue data agree.
const trimmed = (process.env.BASE_PATH ?? '').replace(/^\/+|\/+$/g, '');

export const basePath = trimmed ? `/${trimmed}` : '';
