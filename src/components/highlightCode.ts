import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

// A fine-grained bundle -- just the one language and theme the lessons need,
// loaded once and reused, instead of shiki's full bundle of every grammar.
let highlighter: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    themes: [import('shiki/themes/github-light.mjs')],
    langs: [import('shiki/langs/typescript.mjs')],
    engine: createJavaScriptRegexEngine()
  });
  return highlighter;
}

export async function highlightTypeScript(code: string): Promise<string> {
  const shiki = await getHighlighter();
  return shiki.codeToHtml(code, { lang: 'typescript', theme: 'github-light' });
}
