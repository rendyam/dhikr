/**
 * i18n setup — initializes i18next with react-i18next for the Muslim Dhikr App.
 *
 * Supported locales at launch:
 *   - 'en'  English (default / fallback)
 *   - 'id'  Bahasa Indonesia
 *
 * RTL notes:
 *   - English and Bahasa Indonesia are LTR languages. `I18nManager.forceRTL(false)`
 *     is called on initialization to ensure the layout direction is correct.
 *   - If an Arabic UI locale ('ar') is added in the future, call
 *     `I18nManager.forceRTL(true)` and restart the app to apply the RTL layout.
 *     Arabic *content* (dhikr text) is always rendered RTL via the `ArabicText`
 *     component regardless of the UI locale — no change needed here for that.
 *
 * Usage:
 *   import { useTranslation, changeLanguage } from '@/i18n';
 *   const { t } = useTranslation();
 *   t('tabs.home')  // → "Home" | "Beranda"
 *
 * Requirements: 7.1, 7.2, 7.3, 7.5, 12.3
 */

import i18n from 'i18next';
import { initReactI18next, useTranslation as useTranslationBase } from 'react-i18next';
import { I18nManager } from 'react-native';

import en from './locales/en.json';
import id from './locales/id.json';

/** All supported UI locales. Extend this union when adding new languages. */
export type SupportedLocale = 'en' | 'id';

/** Locale display names shown in the Settings screen. */
export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
};

/** Locales that use right-to-left layout. */
const RTL_LOCALES: ReadonlySet<string> = new Set(['ar']);

/**
 * Apply the correct layout direction for the given locale.
 * For LTR locales this forces RTL off; for RTL locales it forces RTL on.
 * Note: on React Native, a layout direction change requires an app restart
 * to take full effect. The call here ensures the flag is set correctly so
 * the next launch uses the right direction.
 */
function applyLayoutDirection(locale: string): void {
  const shouldBeRTL = RTL_LOCALES.has(locale);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.forceRTL(shouldBeRTL);
  }
}

/**
 * Initialize i18next. Must be called (and awaited) before any screen renders.
 * Called from `app/_layout.tsx`.
 */
export async function initI18n(initialLocale: SupportedLocale = 'en'): Promise<void> {
  // Apply layout direction for the initial locale before any UI renders.
  applyLayoutDirection(initialLocale);

  await i18n
    .use(initReactI18next)
    .init({
      // Resource bundles — all locales are bundled at build time (offline-first).
      resources: {
        en: { translation: en },
        id: { translation: id },
      },

      // Start with the persisted or detected locale; fall back to English.
      lng: initialLocale,
      fallbackLng: 'en',

      // Disable i18next's built-in language detector; locale is managed by
      // settingsStore and passed in via `initialLocale`.
      detection: undefined,

      interpolation: {
        // React already escapes values; no need for i18next to double-escape.
        escapeValue: false,
      },

      // Silence missing-key warnings in production; log them in development.
      saveMissing: __DEV__,
      missingKeyHandler: __DEV__
        ? (lngs, ns, key) => {
            console.warn(`[i18n] Missing translation key: "${key}" for locale(s): ${lngs.join(', ')}`);
          }
        : undefined,
    });
}

/**
 * Change the active UI language at runtime.
 * Persisting the preference is the caller's responsibility (settingsStore).
 *
 * @param locale - A supported locale code ('en' | 'id').
 */
export async function changeLanguage(locale: SupportedLocale): Promise<void> {
  applyLayoutDirection(locale);
  await i18n.changeLanguage(locale);
}

/**
 * Re-export `useTranslation` from react-i18next so consumers only need to
 * import from '@/i18n' rather than from 'react-i18next' directly.
 */
export { useTranslationBase as useTranslation };

/** The underlying i18next instance, exported for advanced use cases. */
export default i18n;
