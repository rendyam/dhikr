/**
 * Settings screen — language, text size, transliteration, and notification settings.
 *
 * Sections:
 *   1. Language — English / Bahasa Indonesia selector; re-renders all UI strings immediately
 *   2. Text Size — Small / Medium / Large; applies to Arabic text immediately
 *   3. Transliteration — toggle show/hide
 *   4. Notifications — daily reminder toggle + time picker
 *      - Toggle is disabled (with link to system settings) when permission is denied
 *
 * Requirements: 7.2, 7.3, 8.1, 8.2, 8.3, 15.6, 15.7
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from '@/i18n';
import { LOCALE_LABELS } from '@/i18n';
import type { SupportedLocale } from '@/i18n';
import { ArabicText } from '@/components/ArabicText';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { uiFontSizes } from '@/theme/typography';
import type { TextSize, Locale } from '@/types/content';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Notification permission status — mirrors expo-notifications PermissionStatus values. */
export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface SettingsScreenProps {
  /** Injected in tests to simulate notification permission state. */
  notificationPermissionStatus?: NotificationPermissionStatus;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'id'];

const TEXT_SIZES: TextSize[] = ['small', 'medium', 'large'];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SettingsScreen({
  notificationPermissionStatus = 'granted',
}: SettingsScreenProps): React.JSX.Element {
  const { t } = useTranslation();

  const language = useSettingsStore((s) => s.language);
  const textSize = useSettingsStore((s) => s.textSize);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const notificationEnabled = useSettingsStore((s) => s.notificationEnabled);
  const notificationTime = useSettingsStore((s) => s.notificationTime);

  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setTextSize = useSettingsStore((s) => s.setTextSize);
  const toggleTransliteration = useSettingsStore((s) => s.toggleTransliteration);
  const setNotificationEnabled = useSettingsStore((s) => s.setNotificationEnabled);
  const setNotificationTime = useSettingsStore((s) => s.setNotificationTime);

  const notificationPermissionDenied = notificationPermissionStatus === 'denied';

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleLanguageSelect = useCallback(
    (locale: Locale) => {
      setLanguage(locale);
    },
    [setLanguage],
  );

  const handleTextSizeSelect = useCallback(
    (size: TextSize) => {
      setTextSize(size);
    },
    [setTextSize],
  );

  const handleNotificationToggle = useCallback(
    (value: boolean) => {
      if (!notificationPermissionDenied) {
        setNotificationEnabled(value);
      }
    },
    [notificationPermissionDenied, setNotificationEnabled],
  );

  const handleOpenSystemSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else if (Platform.OS === 'android') {
      Linking.openSettings();
    }
  }, []);

  /**
   * Cycle through notification time in 30-minute increments for simplicity.
   * A real time picker (DateTimePicker) would be used in production; this
   * keeps the component testable without native modules.
   */
  const handleTimeChange = useCallback(
    (direction: 'increment' | 'decrement') => {
      const [hStr, mStr] = notificationTime.split(':');
      let hours = parseInt(hStr, 10);
      let minutes = parseInt(mStr, 10);

      if (direction === 'increment') {
        minutes += 30;
        if (minutes >= 60) {
          minutes = 0;
          hours = (hours + 1) % 24;
        }
      } else {
        minutes -= 30;
        if (minutes < 0) {
          minutes = 30;
          hours = (hours - 1 + 24) % 24;
        }
      }

      const newTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      setNotificationTime(newTime);
    },
    [notificationTime, setNotificationTime],
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      testID="settings-scroll"
    >
      {/* Screen title */}
      <Text style={styles.screenTitle} testID="settings-title">
        {t('settings.title')}
      </Text>

      {/* ── Section 1: Language ─────────────────────────────────────────────── */}
      <View style={styles.section} testID="settings-language-section">
        <Text style={styles.sectionHeader} testID="settings-language-section-header">
          {t('settings.languageSection')}
        </Text>

        <View style={styles.card}>
          {SUPPORTED_LOCALES.map((locale, index) => {
            const isSelected = language === locale;
            const isLast = index === SUPPORTED_LOCALES.length - 1;
            return (
              <React.Fragment key={locale}>
                <TouchableOpacity
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                  onPress={() => handleLanguageSelect(locale)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={LOCALE_LABELS[locale]}
                  testID={`settings-language-option-${locale}`}
                >
                  <Text
                    style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                    testID={`settings-language-label-${locale}`}
                  >
                    {LOCALE_LABELS[locale]}
                  </Text>
                  {isSelected && (
                    <View
                      style={styles.checkmark}
                      testID={`settings-language-checkmark-${locale}`}
                    />
                  )}
                </TouchableOpacity>
                {!isLast && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* ── Section 2: Text Size ────────────────────────────────────────────── */}
      <View style={styles.section} testID="settings-text-size-section">
        <Text style={styles.sectionHeader} testID="settings-text-size-section-header">
          {t('settings.textSizeSection')}
        </Text>

        {/* Preview of Arabic text at the current size */}
        <View style={styles.arabicPreviewCard} testID="settings-arabic-preview">
          <ArabicText
            text="بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ"
            size={textSize}
          />
        </View>

        <View style={styles.card}>
          {TEXT_SIZES.map((size, index) => {
            const isSelected = textSize === size;
            const isLast = index === TEXT_SIZES.length - 1;
            const labelKey = `settings.textSize${size.charAt(0).toUpperCase() + size.slice(1)}` as
              | 'settings.textSizeSmall'
              | 'settings.textSizeMedium'
              | 'settings.textSizeLarge';
            return (
              <React.Fragment key={size}>
                <TouchableOpacity
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                  onPress={() => handleTextSizeSelect(size)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={t(labelKey)}
                  testID={`settings-text-size-option-${size}`}
                >
                  <Text
                    style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                    testID={`settings-text-size-label-${size}`}
                  >
                    {t(labelKey)}
                  </Text>
                  {isSelected && (
                    <View
                      style={styles.checkmark}
                      testID={`settings-text-size-checkmark-${size}`}
                    />
                  )}
                </TouchableOpacity>
                {!isLast && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* ── Section 3: Transliteration ──────────────────────────────────────── */}
      <View style={styles.section} testID="settings-transliteration-section">
        <Text style={styles.sectionHeader} testID="settings-transliteration-section-header">
          {t('settings.transliterationSection')}
        </Text>

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel} testID="settings-transliteration-label">
              {t('settings.transliterationLabel')}
            </Text>
            <Switch
              value={showTransliteration}
              onValueChange={toggleTransliteration}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={showTransliteration ? colors.primary : colors.textDisabled}
              accessibilityRole="switch"
              accessibilityLabel={t('settings.transliterationLabel')}
              accessibilityState={{ checked: showTransliteration }}
              testID="settings-transliteration-toggle"
            />
          </View>
        </View>
      </View>

      {/* ── Section 4: Notifications ────────────────────────────────────────── */}
      <View style={styles.section} testID="settings-notifications-section">
        <Text style={styles.sectionHeader} testID="settings-notifications-section-header">
          {t('settings.notificationsSection')}
        </Text>

        <View style={styles.card}>
          {/* Daily reminder toggle */}
          <View style={styles.toggleRow}>
            <Text
              style={[
                styles.toggleLabel,
                notificationPermissionDenied && styles.toggleLabelDisabled,
              ]}
              testID="settings-notifications-label"
            >
              {t('settings.notificationsLabel')}
            </Text>
            <Switch
              value={notificationEnabled && !notificationPermissionDenied}
              onValueChange={handleNotificationToggle}
              disabled={notificationPermissionDenied}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={
                notificationEnabled && !notificationPermissionDenied
                  ? colors.primary
                  : colors.textDisabled
              }
              accessibilityRole="switch"
              accessibilityLabel={t('settings.notificationsLabel')}
              accessibilityState={{
                checked: notificationEnabled && !notificationPermissionDenied,
                disabled: notificationPermissionDenied,
              }}
              testID="settings-notifications-toggle"
            />
          </View>

          {/* Permission-denied hint + link to system settings */}
          {notificationPermissionDenied && (
            <>
              <View style={styles.divider} />
              <View style={styles.hintRow} testID="settings-notifications-denied-hint">
                <Text style={styles.hintText}>
                  {t('settings.notificationsDisabledHint')}
                </Text>
                <TouchableOpacity
                  onPress={handleOpenSystemSettings}
                  accessibilityRole="link"
                  accessibilityLabel={t('settings.openSystemSettings')}
                  testID="settings-open-system-settings"
                >
                  <Text style={styles.linkText}>{t('settings.openSystemSettings')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Notification time picker — only shown when notifications are enabled */}
          {notificationEnabled && !notificationPermissionDenied && (
            <>
              <View style={styles.divider} />
              <View style={styles.timePickerRow} testID="settings-notification-time-row">
                <Text style={styles.toggleLabel} testID="settings-notification-time-label">
                  {t('settings.notificationsTimeLabel')}
                </Text>
                <View style={styles.timePicker}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => handleTimeChange('decrement')}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease time"
                    testID="settings-notification-time-decrement"
                  >
                    <Text style={styles.timeButtonText}>−</Text>
                  </TouchableOpacity>

                  <Text style={styles.timeValue} testID="settings-notification-time-value">
                    {notificationTime}
                  </Text>

                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => handleTimeChange('increment')}
                    accessibilityRole="button"
                    accessibilityLabel="Increase time"
                    testID="settings-notification-time-increment"
                  >
                    <Text style={styles.timeButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  contentContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[12],
  },
  screenTitle: {
    fontSize: uiFontSizes.large,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing[6],
  },

  // ── Section ────────────────────────────────────────────────────────────────
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    fontSize: uiFontSizes.small,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing[2],
    paddingHorizontal: spacing[1],
  },

  // ── Card ───────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  // ── Option row (language / text size) ─────────────────────────────────────
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background,
  },
  optionRowSelected: {
    backgroundColor: colors.primarySubtle,
  },
  optionLabel: {
    fontSize: uiFontSizes.medium,
    color: colors.textPrimary,
  },
  optionLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },

  // ── Toggle row ─────────────────────────────────────────────────────────────
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  toggleLabel: {
    fontSize: uiFontSizes.medium,
    color: colors.textPrimary,
    flex: 1,
    marginEnd: spacing[2],
  },
  toggleLabelDisabled: {
    color: colors.textDisabled,
  },

  // ── Hint row (permission denied) ───────────────────────────────────────────
  hintRow: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[1],
  },
  hintText: {
    fontSize: uiFontSizes.small,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  linkText: {
    fontSize: uiFontSizes.small,
    color: colors.primary,
    fontWeight: '600',
  },

  // ── Time picker row ────────────────────────────────────────────────────────
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  timeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeButtonText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 22,
  },
  timeValue: {
    fontSize: uiFontSizes.medium,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 48,
    textAlign: 'center',
  },

  // ── Arabic preview card ────────────────────────────────────────────────────
  arabicPreviewCard: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    marginBottom: spacing[2],
    alignItems: 'center',
  },

  // ── Divider ────────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing[4],
  },
});
