/**
 * Component tests for app/settings.tsx — Settings screen
 *
 * Covers:
 *   - Language selector: renders options, selecting 'id' calls setLanguage and updates UI strings
 *   - Text size selector: renders options, selecting a size calls setTextSize; Arabic preview reflects size
 *   - Transliteration toggle: calls toggleTransliteration on press
 *   - Notification toggle: enabled/disabled state; disabled when permission denied
 *   - Notification time picker: increment/decrement buttons call setNotificationTime
 *   - Permission-denied hint: shown with link to system settings when permission is denied
 *
 * Requirements: 7.2, 7.3, 8.1, 8.2, 8.3, 15.6, 15.7
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SettingsScreen from '../../app/settings';
import type { NotificationPermissionStatus } from '../../app/settings';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// settingsStore
const mockSetLanguage = jest.fn();
const mockSetTextSize = jest.fn();
const mockToggleTransliteration = jest.fn();
const mockSetNotificationEnabled = jest.fn();
const mockSetNotificationTime = jest.fn();

const mockUseSettingsStore = jest.fn();
jest.mock('../../src/store/settingsStore', () => ({
  useSettingsStore: (selector: (s: unknown) => unknown) => mockUseSettingsStore(selector),
}));

// i18n — use real translations so we can assert on Indonesian strings
jest.mock('../../src/i18n', () => {
  const en = require('../../src/i18n/locales/en.json');
  const id = require('../../src/i18n/locales/id.json');

  let currentLocale = 'en';
  const translations: Record<string, Record<string, unknown>> = { en, id };

  function getNestedValue(obj: Record<string, unknown>, key: string): string {
    return key.split('.').reduce((acc: unknown, part: string) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part];
      }
      return key;
    }, obj) as string ?? key;
  }

  return {
    useTranslation: () => ({
      t: (key: string) => getNestedValue(translations[currentLocale] as Record<string, unknown>, key) ?? key,
      i18n: { language: currentLocale },
    }),
    LOCALE_LABELS: { en: 'English', id: 'Bahasa Indonesia' },
    changeLanguage: jest.fn(async (locale: string) => {
      currentLocale = locale;
    }),
    __setLocale: (locale: string) => {
      currentLocale = locale;
    },
  };
});

// ArabicText — mock to avoid font loading issues in tests
jest.mock('../../src/components/ArabicText', () => {
  const { Text } = require('react-native');
  return {
    ArabicText: ({ text, size }: { text: string; size: string }) => (
      <Text testID="arabic-text" accessibilityLabel={`arabic-size-${size}`}>
        {text}
      </Text>
    ),
  };
});

// DB client (imported transitively)
jest.mock('../../src/db/client', () => ({
  openContentDb: jest.fn(),
  openUserDb: jest.fn(),
}));

// Linking (for system settings)
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
  openSettings: jest.fn(),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

interface StoreState {
  language: string;
  textSize: string;
  showTransliteration: boolean;
  notificationEnabled: boolean;
  notificationTime: string;
  setLanguage: jest.Mock;
  setTextSize: jest.Mock;
  toggleTransliteration: jest.Mock;
  setNotificationEnabled: jest.Mock;
  setNotificationTime: jest.Mock;
}

function makeStoreState(overrides: Partial<StoreState> = {}): StoreState {
  return {
    language: 'en',
    textSize: 'medium',
    showTransliteration: true,
    notificationEnabled: true,
    notificationTime: '08:00',
    setLanguage: mockSetLanguage,
    setTextSize: mockSetTextSize,
    toggleTransliteration: mockToggleTransliteration,
    setNotificationEnabled: mockSetNotificationEnabled,
    setNotificationTime: mockSetNotificationTime,
    ...overrides,
  };
}

function setupStore(state: StoreState) {
  mockUseSettingsStore.mockImplementation((selector: (s: StoreState) => unknown) =>
    selector(state),
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderSettings({
  storeState = makeStoreState(),
  permissionStatus = 'granted' as NotificationPermissionStatus,
} = {}) {
  setupStore(storeState);
  return render(
    <SettingsScreen notificationPermissionStatus={permissionStatus} />,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SettingsScreen', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Basic rendering', () => {
    it('renders the settings scroll container', () => {
      const { getByTestId } = renderSettings();
      expect(getByTestId('settings-scroll')).toBeTruthy();
    });

    it('renders the settings title', () => {
      const { getByTestId } = renderSettings();
      expect(getByTestId('settings-title')).toBeTruthy();
    });

    it('renders all four sections', () => {
      const { getByTestId } = renderSettings();
      expect(getByTestId('settings-language-section')).toBeTruthy();
      expect(getByTestId('settings-text-size-section')).toBeTruthy();
      expect(getByTestId('settings-transliteration-section')).toBeTruthy();
      expect(getByTestId('settings-notifications-section')).toBeTruthy();
    });
  });

  // ── Language selector ──────────────────────────────────────────────────────

  describe('Language selector', () => {
    it('renders English and Bahasa Indonesia options', () => {
      const { getByTestId } = renderSettings();
      expect(getByTestId('settings-language-option-en')).toBeTruthy();
      expect(getByTestId('settings-language-option-id')).toBeTruthy();
    });

    it('marks the current language as selected', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ language: 'en' }),
      });
      const enOption = getByTestId('settings-language-option-en');
      expect(enOption.props.accessibilityState?.checked).toBe(true);
    });

    it('marks the non-current language as not selected', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ language: 'en' }),
      });
      const idOption = getByTestId('settings-language-option-id');
      expect(idOption.props.accessibilityState?.checked).toBe(false);
    });

    it('shows checkmark only for the selected language', () => {
      const { getByTestId, queryByTestId } = renderSettings({
        storeState: makeStoreState({ language: 'en' }),
      });
      expect(getByTestId('settings-language-checkmark-en')).toBeTruthy();
      expect(queryByTestId('settings-language-checkmark-id')).toBeNull();
    });

    it('calls setLanguage with "id" when Bahasa Indonesia is pressed', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ language: 'en' }),
      });
      fireEvent.press(getByTestId('settings-language-option-id'));
      expect(mockSetLanguage).toHaveBeenCalledWith('id');
    });

    it('calls setLanguage with "en" when English is pressed', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ language: 'id' }),
      });
      fireEvent.press(getByTestId('settings-language-option-en'));
      expect(mockSetLanguage).toHaveBeenCalledWith('en');
    });

    it('displays "English" label for the en option', () => {
      const { getByTestId } = renderSettings();
      expect(getByTestId('settings-language-label-en').props.children).toBe('English');
    });

    it('displays "Bahasa Indonesia" label for the id option', () => {
      const { getByTestId } = renderSettings();
      expect(getByTestId('settings-language-label-id').props.children).toBe('Bahasa Indonesia');
    });

    it('language change to "id" updates section header to Indonesian', () => {
      // Simulate the store returning 'id' as the language (i18n mock uses 'id' translations)
      const { __setLocale } = require('../../src/i18n');
      __setLocale('id');

      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ language: 'id' }),
      });

      // The language section header should now be in Indonesian
      const header = getByTestId('settings-language-section-header');
      expect(header.props.children).toBe('Bahasa'); // 'Bahasa' from id.json settings.languageSection

      // Reset locale for other tests
      __setLocale('en');
    });
  });

  // ── Text size selector ─────────────────────────────────────────────────────

  describe('Text size selector', () => {
    it('renders Small, Medium, and Large options', () => {
      const { getByTestId } = renderSettings();
      expect(getByTestId('settings-text-size-option-small')).toBeTruthy();
      expect(getByTestId('settings-text-size-option-medium')).toBeTruthy();
      expect(getByTestId('settings-text-size-option-large')).toBeTruthy();
    });

    it('marks the current text size as selected', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ textSize: 'medium' }),
      });
      const mediumOption = getByTestId('settings-text-size-option-medium');
      expect(mediumOption.props.accessibilityState?.checked).toBe(true);
    });

    it('shows checkmark only for the selected text size', () => {
      const { getByTestId, queryByTestId } = renderSettings({
        storeState: makeStoreState({ textSize: 'large' }),
      });
      expect(getByTestId('settings-text-size-checkmark-large')).toBeTruthy();
      expect(queryByTestId('settings-text-size-checkmark-small')).toBeNull();
      expect(queryByTestId('settings-text-size-checkmark-medium')).toBeNull();
    });

    it('calls setTextSize with "small" when Small is pressed', () => {
      const { getByTestId } = renderSettings();
      fireEvent.press(getByTestId('settings-text-size-option-small'));
      expect(mockSetTextSize).toHaveBeenCalledWith('small');
    });

    it('calls setTextSize with "large" when Large is pressed', () => {
      const { getByTestId } = renderSettings();
      fireEvent.press(getByTestId('settings-text-size-option-large'));
      expect(mockSetTextSize).toHaveBeenCalledWith('large');
    });

    it('renders the Arabic preview card', () => {
      const { getByTestId } = renderSettings();
      expect(getByTestId('settings-arabic-preview')).toBeTruthy();
    });

    it('Arabic preview reflects the current text size via accessibilityLabel', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ textSize: 'large' }),
      });
      const arabicText = getByTestId('arabic-text');
      expect(arabicText.props.accessibilityLabel).toBe('arabic-size-large');
    });

    it('Arabic preview updates when text size changes to small', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ textSize: 'small' }),
      });
      const arabicText = getByTestId('arabic-text');
      expect(arabicText.props.accessibilityLabel).toBe('arabic-size-small');
    });
  });

  // ── Transliteration toggle ─────────────────────────────────────────────────

  describe('Transliteration toggle', () => {
    it('renders the transliteration toggle', () => {
      const { getByTestId } = renderSettings();
      expect(getByTestId('settings-transliteration-toggle')).toBeTruthy();
    });

    it('toggle is ON when showTransliteration is true', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ showTransliteration: true }),
      });
      expect(getByTestId('settings-transliteration-toggle').props.value).toBe(true);
    });

    it('toggle is OFF when showTransliteration is false', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ showTransliteration: false }),
      });
      expect(getByTestId('settings-transliteration-toggle').props.value).toBe(false);
    });

    it('calls toggleTransliteration when the switch is toggled', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ showTransliteration: true }),
      });
      fireEvent(getByTestId('settings-transliteration-toggle'), 'valueChange', false);
      expect(mockToggleTransliteration).toHaveBeenCalledTimes(1);
    });
  });

  // ── Notification toggle ────────────────────────────────────────────────────

  describe('Notification toggle — permission granted', () => {
    it('renders the notification toggle', () => {
      const { getByTestId } = renderSettings();
      expect(getByTestId('settings-notifications-toggle')).toBeTruthy();
    });

    it('toggle is ON when notificationEnabled is true', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ notificationEnabled: true }),
        permissionStatus: 'granted',
      });
      expect(getByTestId('settings-notifications-toggle').props.value).toBe(true);
    });

    it('toggle is OFF when notificationEnabled is false', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ notificationEnabled: false }),
        permissionStatus: 'granted',
      });
      expect(getByTestId('settings-notifications-toggle').props.value).toBe(false);
    });

    it('calls setNotificationEnabled(false) when toggled off', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ notificationEnabled: true }),
        permissionStatus: 'granted',
      });
      fireEvent(getByTestId('settings-notifications-toggle'), 'valueChange', false);
      expect(mockSetNotificationEnabled).toHaveBeenCalledWith(false);
    });

    it('calls setNotificationEnabled(true) when toggled on', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ notificationEnabled: false }),
        permissionStatus: 'granted',
      });
      fireEvent(getByTestId('settings-notifications-toggle'), 'valueChange', true);
      expect(mockSetNotificationEnabled).toHaveBeenCalledWith(true);
    });

    it('does NOT show the permission-denied hint when permission is granted', () => {
      const { queryByTestId } = renderSettings({ permissionStatus: 'granted' });
      expect(queryByTestId('settings-notifications-denied-hint')).toBeNull();
    });
  });

  describe('Notification toggle — permission denied', () => {
    it('toggle is disabled when permission is denied', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ notificationEnabled: true }),
        permissionStatus: 'denied',
      });
      const toggle = getByTestId('settings-notifications-toggle');
      expect(toggle.props.disabled).toBe(true);
    });

    it('toggle value is false when permission is denied (regardless of store value)', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ notificationEnabled: true }),
        permissionStatus: 'denied',
      });
      expect(getByTestId('settings-notifications-toggle').props.value).toBe(false);
    });

    it('does NOT call setNotificationEnabled when permission is denied and toggle is pressed', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ notificationEnabled: false }),
        permissionStatus: 'denied',
      });
      fireEvent(getByTestId('settings-notifications-toggle'), 'valueChange', true);
      expect(mockSetNotificationEnabled).not.toHaveBeenCalled();
    });

    it('shows the permission-denied hint when permission is denied', () => {
      const { getByTestId } = renderSettings({ permissionStatus: 'denied' });
      expect(getByTestId('settings-notifications-denied-hint')).toBeTruthy();
    });

    it('shows the "Open Settings" link when permission is denied', () => {
      const { getByTestId } = renderSettings({ permissionStatus: 'denied' });
      expect(getByTestId('settings-open-system-settings')).toBeTruthy();
    });

    it('toggle is disabled state is reflected in accessibilityState', () => {
      const { getByTestId } = renderSettings({
        permissionStatus: 'denied',
      });
      const toggle = getByTestId('settings-notifications-toggle');
      expect(toggle.props.accessibilityState?.disabled).toBe(true);
    });
  });

  // ── Notification time picker ───────────────────────────────────────────────

  describe('Notification time picker', () => {
    it('shows the time picker row when notifications are enabled', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ notificationEnabled: true }),
        permissionStatus: 'granted',
      });
      expect(getByTestId('settings-notification-time-row')).toBeTruthy();
    });

    it('hides the time picker row when notifications are disabled', () => {
      const { queryByTestId } = renderSettings({
        storeState: makeStoreState({ notificationEnabled: false }),
        permissionStatus: 'granted',
      });
      expect(queryByTestId('settings-notification-time-row')).toBeNull();
    });

    it('hides the time picker row when permission is denied', () => {
      const { queryByTestId } = renderSettings({
        storeState: makeStoreState({ notificationEnabled: true }),
        permissionStatus: 'denied',
      });
      expect(queryByTestId('settings-notification-time-row')).toBeNull();
    });

    it('displays the current notification time', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ notificationEnabled: true, notificationTime: '08:00' }),
        permissionStatus: 'granted',
      });
      expect(getByTestId('settings-notification-time-value').props.children).toBe('08:00');
    });

    it('increment button calls setNotificationTime with time + 30 minutes', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ notificationEnabled: true, notificationTime: '08:00' }),
        permissionStatus: 'granted',
      });
      fireEvent.press(getByTestId('settings-notification-time-increment'));
      expect(mockSetNotificationTime).toHaveBeenCalledWith('08:30');
    });

    it('decrement button calls setNotificationTime with time - 30 minutes', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ notificationEnabled: true, notificationTime: '08:30' }),
        permissionStatus: 'granted',
      });
      fireEvent.press(getByTestId('settings-notification-time-decrement'));
      expect(mockSetNotificationTime).toHaveBeenCalledWith('08:00');
    });

    it('increment wraps from 23:30 to 00:00', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ notificationEnabled: true, notificationTime: '23:30' }),
        permissionStatus: 'granted',
      });
      fireEvent.press(getByTestId('settings-notification-time-increment'));
      expect(mockSetNotificationTime).toHaveBeenCalledWith('00:00');
    });

    it('decrement wraps from 00:00 to 23:30', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ notificationEnabled: true, notificationTime: '00:00' }),
        permissionStatus: 'granted',
      });
      fireEvent.press(getByTestId('settings-notification-time-decrement'));
      expect(mockSetNotificationTime).toHaveBeenCalledWith('23:30');
    });

    it('increment from 08:30 produces 09:00', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ notificationEnabled: true, notificationTime: '08:30' }),
        permissionStatus: 'granted',
      });
      fireEvent.press(getByTestId('settings-notification-time-increment'));
      expect(mockSetNotificationTime).toHaveBeenCalledWith('09:00');
    });
  });

  // ── Indonesian UI strings ──────────────────────────────────────────────────

  describe('Indonesian UI strings (language = id)', () => {
    beforeEach(() => {
      const { __setLocale } = require('../../src/i18n');
      __setLocale('id');
    });

    afterEach(() => {
      const { __setLocale } = require('../../src/i18n');
      __setLocale('en');
    });

    it('renders the settings title in Indonesian', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ language: 'id' }),
      });
      expect(getByTestId('settings-title').props.children).toBe('Pengaturan');
    });

    it('renders the language section header in Indonesian', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ language: 'id' }),
      });
      expect(getByTestId('settings-language-section-header').props.children).toBe('Bahasa');
    });

    it('renders the text size section header in Indonesian', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ language: 'id' }),
      });
      expect(getByTestId('settings-text-size-section-header').props.children).toBe('Ukuran Teks');
    });

    it('renders the transliteration label in Indonesian', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ language: 'id' }),
      });
      expect(getByTestId('settings-transliteration-label').props.children).toBe(
        'Tampilkan Transliterasi',
      );
    });

    it('renders the notifications section header in Indonesian', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ language: 'id' }),
      });
      expect(getByTestId('settings-notifications-section-header').props.children).toBe('Notifikasi');
    });

    it('renders the text size labels in Indonesian', () => {
      const { getByTestId } = renderSettings({
        storeState: makeStoreState({ language: 'id' }),
      });
      expect(getByTestId('settings-text-size-label-small').props.children).toBe('Kecil');
      expect(getByTestId('settings-text-size-label-medium').props.children).toBe('Sedang');
      expect(getByTestId('settings-text-size-label-large').props.children).toBe('Besar');
    });
  });
});
