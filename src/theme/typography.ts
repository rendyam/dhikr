import { Platform } from 'react-native';
import type { TextStyle } from 'react-native';
import type { TextSize } from '@/types/content';

/**
 * Typography tokens for the Muslim Dhikr App.
 *
 * Two font families are used:
 *   - Arabic content  → Amiri (loaded via expo-font in app/_layout.tsx)
 *   - UI / Latin text → system font (San Francisco on iOS, Roboto on Android,
 *                       system-ui on Web)
 *
 * Requirements: 3.1, 8.1, 8.2, 12.3
 */

// ── Font family names ────────────────────────────────────────────────────────

export const fontFamilies = {
  /** Regular weight Arabic font — Amiri 400 */
  arabicRegular: 'Amiri_400Regular',
  /** Bold weight Arabic font — Amiri 700 */
  arabicBold: 'Amiri_700Bold',
  /** System UI font — resolves to platform default */
  uiRegular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'system-ui',
  }) as string,
  /** System UI bold */
  uiBold: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'system-ui',
  }) as string,
} as const;

// ── Font size scales ─────────────────────────────────────────────────────────

/**
 * Arabic text sizes — larger than UI text to account for the visual weight
 * of Arabic script and ensure comfortable readability.
 */
export const arabicFontSizes: Record<TextSize, number> = {
  small: 22,
  medium: 28,
  large: 36,
};

/**
 * UI / Latin text sizes — used for translations, labels, and body copy.
 */
export const uiFontSizes: Record<TextSize, number> = {
  small: 13,
  medium: 15,
  large: 18,
};

// ── Line heights ─────────────────────────────────────────────────────────────

/**
 * Arabic line heights — generous spacing to prevent diacritics (tashkeel)
 * from overlapping between lines.
 */
export const arabicLineHeights: Record<TextSize, number> = {
  small: 38,
  medium: 48,
  large: 60,
};

/**
 * UI line heights — standard 1.5× multiplier for comfortable reading.
 */
export const uiLineHeights: Record<TextSize, number> = {
  small: 20,
  medium: 22,
  large: 28,
};

// ── Composed text style helpers ───────────────────────────────────────────────

/**
 * Returns a complete TextStyle for Arabic content at the given size.
 * Always applies RTL alignment and the Amiri font.
 */
export function arabicTextStyle(size: TextSize): TextStyle {
  return {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: arabicFontSizes[size],
    lineHeight: arabicLineHeights[size],
    writingDirection: 'rtl',
    textAlign: 'right',
  };
}

/**
 * Returns a complete TextStyle for UI / Latin text at the given size.
 */
export function uiTextStyle(size: TextSize): TextStyle {
  return {
    fontFamily: fontFamilies.uiRegular,
    fontSize: uiFontSizes[size],
    lineHeight: uiLineHeights[size],
  };
}
