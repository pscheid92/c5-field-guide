// @ts-check
import { defineConfig } from 'astro/config';
import { basePath } from './scripts/lib/base.mjs';

// The site is plain Astro: pages in src/pages render the catalogue data that
// scripts/generate.mjs writes to src/generated (see README.md).
// SITE_URL and BASE_PATH come from the GitHub Pages workflow; locally the
// site is served at the root.
export default defineConfig({
	site: process.env.SITE_URL || undefined,
	base: basePath || '/',
});
