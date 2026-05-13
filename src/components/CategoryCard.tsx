/**
 * CategoryCard — a pressable grid card representing a single dhikr category.
 *
 * Displays:
 *   - The Arabic category name (via ArabicText)
 *   - The translated category name (via Text)
 *
 * Intended for use in a grid layout on the home screen.
 *
 * Requirements: 2.2, 2.4
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Category } from '@/types/content';
import { colors, spacing, radii } from '@/theme';
import { ArabicText } from './ArabicText';

// ── Props ────────────────────────────────────────────────────────────────────

export interface CategoryCardProps {
  /** The category to display. */
  category: Category;
  /** Called when the user taps the card. */
  onPress: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Pressable grid card for a dhikr category.
 *
 * Accessibility:
 *   - `accessibilityRole="button"` — announces the element as a button
 *   - `accessibilityLabel` — combines Arabic and translated names for screen readers
 */
export function CategoryCard({ category, onPress }: CategoryCardProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${category.nameAr} ${category.name}`}
      activeOpacity={0.7}
      testID="category-card"
    >
      {/* ── Arabic category name ── */}
      <ArabicText
        text={category.nameAr}
        size="medium"
        style={styles.arabicName}
      />

      {/* ── Translated category name ── */}
      <Text style={styles.translatedName} testID="category-card-name">
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
  },

  arabicName: {
    color: colors.textPrimary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },

  translatedName: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
});
