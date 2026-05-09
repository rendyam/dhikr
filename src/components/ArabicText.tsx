/**
 * ArabicText — renders Arabic script with the correct font, size, and RTL alignment.
 *
 * Uses the Amiri font loaded via expo-font in app/_layout.tsx.
 * Maps the TextSize token to the Arabic-specific font size and line height
 * values defined in src/theme/typography.ts.
 *
 * Requirements: 3.1, 8.2, 12.3
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import type { TextSize } from '@/types/content';
import { arabicFontSizes, arabicLineHeights, fontFamilies } from '@/theme';

// ── Props ────────────────────────────────────────────────────────────────────

export interface ArabicTextProps {
  /** The Arabic text to display. */
  text: string;
  /** Controls font size and line height via the shared TextSize scale. */
  size: TextSize;
  /** Optional additional styles merged on top of the base Arabic style. */
  style?: StyleProp<TextStyle>;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Renders Arabic text in the Amiri font with RTL alignment.
 *
 * Accessibility:
 *   - `accessibilityLanguage="ar"` — tells screen readers the language is Arabic
 *   - `accessibilityRole="text"` — announces the element as plain text
 */
export function ArabicText({ text, size, style }: ArabicTextProps): React.JSX.Element {
  return (
    <Text
      style={[styles.base, sizeStyles[size], style]}
      accessibilityLanguage="ar"
      accessibilityRole="text"
    >
      {text}
    </Text>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

/** Base style applied to every ArabicText instance. */
const styles = StyleSheet.create({
  base: {
    fontFamily: fontFamilies.arabicRegular,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});

/**
 * Per-size styles — pre-computed at module load time so StyleSheet.create
 * can flatten them efficiently on native.
 */
const sizeStyles = StyleSheet.create<Record<TextSize, TextStyle>>({
  small: {
    fontSize: arabicFontSizes.small,
    lineHeight: arabicLineHeights.small,
  },
  medium: {
    fontSize: arabicFontSizes.medium,
    lineHeight: arabicLineHeights.medium,
  },
  large: {
    fontSize: arabicFontSizes.large,
    lineHeight: arabicLineHeights.large,
  },
});
