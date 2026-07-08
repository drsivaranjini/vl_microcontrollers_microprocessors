// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';

// GitHub Pages project site: https://drsivaranjini.github.io/vl_microcontrollers_microprocessors/
// See docs/05_HOSTING_GITHUB_PAGES.md. Every internal link/asset already respects
// `import.meta.env.BASE_URL` (Nav.astro, Footer.astro, ExperimentLayout, emulator/hex references),
// so `base` is safe to set here.
export default defineConfig({
  site: 'https://drsivaranjini.github.io',
  base: '/vl_microcontrollers_microprocessors/',

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [mdx()],
});
