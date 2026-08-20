import { init, register, waitLocale } from 'svelte-i18n';

register('en', () => import('./locales/en.json'));

init({
  fallbackLocale: 'en',
  initialLocale: 'en'
});

/** Resolves once the initial locale's messages have loaded. The app is
 *  client-only (see +layout.ts), so there is no SSR race to worry about --
 *  this just keeps the first render from happening before there is anything
 *  to translate with. */
export const localeReady = waitLocale();
