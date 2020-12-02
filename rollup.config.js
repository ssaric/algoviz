import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import html2 from "rollup-plugin-html2";
import svelte from "rollup-plugin-svelte";
import serve from "rollup-plugin-serve";
import {terser} from "rollup-plugin-terser";
import livereload from "rollup-plugin-livereload";
import sveltePreprocessor from "svelte-preprocess";
import svg from 'rollup-plugin-svg-import'
import typescript from '@rollup/plugin-typescript';
import postcss from "rollup-plugin-postcss";
import copy from "rollup-plugin-copy";

const isDevelopment = process.env.NODE_ENV === "development";
const extensions = [
    '.js', '.jsx', '.ts', '.tsx',
];

const plugins = [
    svg({stringify: true}),
    svelte({
        dev: isDevelopment,
        preprocess: sveltePreprocessor({
            }
        ),
        emitCss: true,
    }),
    postcss({
        extract: true,
        minimize: true,
        use: [
            ['sass', {
                includePaths: [
                    './src/scss',
                    './node_modules'
                ]
            }]
        ]
    }),
    typescript({sourceMap: isDevelopment, inlineSources: isDevelopment}),
    commonjs({include: "node_modules/**", extensions: [".js", ".ts"]}),
    resolve({
        extensions,
        browser: true,
        dedupe: ["svelte"],
    }),
    copy({
        targets: [
            {src: 'src/assets/*', dest: 'build/'},
        ]
    }),
    html2({
        template: "src/index.html",
    }),
];
if (isDevelopment) {
    plugins.push(
        serve({
            contentBase: "./build",
            open: false,
        }),
        livereload({watch: "./build"})
    );
} else {
    plugins.push(terser());
}


const appEntry = {
    input: "src/index.ts",
    output: {
        sourcemap: isDevelopment,
        format: 'iife',
        name: 'app',
        file: 'build/bundle.js'
    },
    globals: {
        '@fortawesome/fontawesome-svg-core': 'fontawesomeSvgCore'
    },
    plugins,
};


const workerEntry = {
    input: './src/worker/AlgorithmMincerWorker.ts',
    output: {
        file: './build/worker.js',
        sourcemap: process.env.development,
        format: 'es'
    },
    plugins: [
        commonjs(),
        resolve({
            extensions,
            browser: true,
        }),
        typescript(),
    ],
}

export default [appEntry, workerEntry];
