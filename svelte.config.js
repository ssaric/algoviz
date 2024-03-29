import adapter from '@sveltejs/adapter-static';
import preprocess from "svelte-preprocess";
import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";
const dev = process.env.NODE_ENV === 'development';
/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [
    preprocess({
      sourceMap: !dev,
      postcss: {
        plugins: [tailwind(), autoprefixer()],
      },
    }),
  ],
  kit: {
    prerender: {
      enabled: true
    },
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      trailingSlash: 'always',
      precompress: true,
    }),
  },
};

export default config;
