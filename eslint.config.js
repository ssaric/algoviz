import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import svelteConfig from './svelte.config.js';

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig
      }
    }
  },
  {
    // The board renders itself with plain DOM APIs and the core model is
    // shared with the worker. Both must stay framework-free so they can be
    // tested and reused without Svelte.
    files: ['src/board/**', 'src/core/**', 'src/worker/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['svelte', 'svelte/*', '$app/*'] }]
    }
  },
  {
    ignores: ['build/', '.svelte-kit/', 'node_modules/', 'static/']
  }
);
