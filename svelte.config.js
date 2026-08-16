import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // The single route is prerendered to build/index.html; nginx serves it for
    // unknown paths via try_files, so no separate SPA fallback is needed.
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      precompress: true
    })
  }
};

export default config;
