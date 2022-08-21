import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import html2 from "rollup-plugin-html2";
import serve from "rollup-plugin-serve";
import { terser } from "rollup-plugin-terser";
import livereload from "rollup-plugin-livereload";
import svg from "rollup-plugin-svg-import";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import copy from "rollup-plugin-copy";

const isDevelopment = process.env.NODE_ENV === "development";

const plugins = [
  svg({ stringify: true }),
  postcss({
    extract: true,
    minimize: true,
    use: [
      [
        "sass",
        {
          includePaths: ["./src/scss", "./node_modules"],
        },
      ],
    ],
  }),
  commonjs({ include: "node_modules/**", extensions: [".js", ".ts"] }),
  typescript({ sourceMap: isDevelopment, inlineSources: isDevelopment }),
  copy({
    targets: [{ src: "src/assets/*", dest: "build/" }],
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
      port: 6001,
    }),
    livereload({ watch: "./build" })
  );
} else {
  plugins.push(terser());
}

const appEntry = {
  input: "src/index.ts",
  output: {
    sourcemap: isDevelopment,
    format: "iife",
    name: "app",
    file: "build/bundle.js",
  },
  plugins,
};

const workerEntry = {
  input: "./src/worker/AlgorithmMincerWorker.ts",
  output: {
    file: "./build/worker.js",
    sourcemap: process.env.development,
    format: "es",
  },
  plugins: [
    commonjs(),
    resolve({
      browser: true,
    }),
    typescript(),
  ],
};

export default [appEntry, workerEntry];
