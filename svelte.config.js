const sveltePreprocess = require('svelte-preprocess');

module.exports = {
    preprocess: sveltePreprocess({
        scss: true,
        typescript: true,
        postcss: {
            plugins: [require("autoprefixer")]
        },
    }),
};
