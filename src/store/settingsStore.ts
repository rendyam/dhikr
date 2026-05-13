/**
 * Settings store — persists user preferences across app launches.
 *
 * State:
 *   - language            Active UI locale (Locale)
 *   - textSize            Font size preference (TextSize)
 *   - showTransliteration Whether to show transliteration text
 *   - notificationEnabled Whether daily reminder notifications are enabled
 *   - notificationTime    Daily reminder time in 'HH:MM' 24-hour format
 *
 * Persistence:
 *   Uses zustand/middleware `persist` with a platform-appropriate storage
 *   backend. On web, `localStorage` is used. On native, AsyncStorage from
 *   `@react-native-async-storage/async-storage` is preferred; however, since
 *   that package is not yet installed, a memory-based fallback is used so the
 *   store works without the package.
 *
 *   TODO: Install `@react-native-async-storage/async-storage` and replace the
 *   memory fallback with the real AsyncStorage adapter:
 *     import AsyncStorage from '@react-native-async-storage/async-storage';
 *     storage: createJSONStorage(() => AsyncStorage)
 *
 * Requirements: 7.2, 8.1, 8.3, 15.6, 15.7
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

import { changeLanguage } from '../i18n';
import type { Locale, TextSize } from '../types/content';

// ── Storage backend ───────────────────────────────────────────────────────────

/**
 * In-memory storage fallback used on native until
 * `@react-native-async-storage/async-storage` is installed.
 *
 * TODO: Replace with AsyncStorage once the package is added to package.json.
 */
const memoryStorage: Record<string, string> = {};

const memoryStorageAdapter = {
  getItem: (key: string): string | null => memoryStorage[key] ?? null,
  setItem: (key: string, value: string): void => {
    memoryStorage[key] = value;
  },
  removeItem: (key: string): void => {
    delete memoryStorage[key];
  },
};

/**
 * Returns the appropriate storage backend for the current platform.
 * - Web: `localStorage` (synchronous, built-in)
 * - Native: memory fallback (TODO: replace with AsyncStorage)
 */
function getStorageBackend() {
  if (Platform.OS === 'web') {
    return createJSONStorage(() => localStorage);
  }
  // TODO: Replace with AsyncStorage once installed:
  //   import AsyncStorage from '@react-native-async-storage/async-storage';
  //   return createJSONStorage(() => AsyncStorage);
  return createJSONStorage(() => memoryStorageAdapter);
}

// ── State & actions interface ─────────────────────────────────────────────────

export interface SettingsState {
  language: Locale;
  textSize: TextSize;
  showTransliteration: boolean;
  notificationEnabled: boolean;
  /** Daily reminder time in 'HH:MM' 24-hour format. */
  notificationTime: string;

  /**
   * Change the active UI language.
   * Calls `changeLanguage` from i18n to update i18next and the RTL flag.
   */
  setLanguage: (lang: Locale) => void;

  /** Change the text size preference. */
  setTextSize: (size: TextSize) => void;

  /** Toggle the transliteration visibility. */
  toggleTransliteration: () => void;

  /** Enable or disable daily reminder notifications. */
  setNotificationEnabled: (enabled: boolean) => void;

  /**
   * Set the daily reminder time.
   * @param time - Time string in 'HH:MM' 24-hour format.
   */
  setNotificationTime: (time: string) => void;
}

// ── Default values ────────────────────────────────────────────────────────────

const DEFAULT_LANGUAGE: Locale = 'en';
const DEFAULT_TEXT_SIZE: TextSize = 'medium';
const DEFAULT_SHOW_TRANSLITERATION = true;
const DEFAULT_NOTIFICATION_ENABLED = true;
const DEFAULT_NOTIFICATION_TIME = '08:00';

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // ── Initial state ──────────────────────────────────────────────────────
      language: DEFAULT_LANGUAGE,
      textSize: DEFAULT_TEXT_SIZE,
      showTransliteration: DEFAULT_SHOW_TRANSLITERATION,
      notificationEnabled: DEFAULT_NOTIFICATION_ENABLED,
      notificationTime: DEFAULT_NOTIFICATION_TIME,

      // ── Actions ────────────────────────────────────────────────────────────

      setLanguage: (lang: Locale) => {
        // Update i18next and the I18nManager RTL flag.
        changeLanguage(lang as Parameters<typeof changeLanguage>[0]);
        set({ language: lang });
      },

      setTextSize: (size: TextSize) => {
        set({ textSize: size });
      },

      toggleTransliteration: () => {
        set((state) => ({ showTransliteration: !state.showTransliteration }));
      },

      setNotificationEnabled: (enabled: boolean) => {
        set({ notificationEnabled: enabled });
      },

      setNotificationTime: (time: string) => {
        set({ notificationTime: time });
      },
    }),
    {
      name: 'settings-storage',
      storage: getStorageBackend(),
    },
  ),
);
