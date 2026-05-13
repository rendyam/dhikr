/**
 * StreakWidget — displays the user's current streak count with a flame icon.
 *
 * Shows a distinct visual state depending on whether the user has checked in
 * today:
 *   - Checked in  → flame and count rendered in `colors.streak` (orange)
 *   - Not checked in → flame and count rendered in `colors.textDisabled` (grey)
 *
 * Requirements: 14.2, 14.5
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii } from '@/theme';

// ── Props ────────────────────────────────────────────────────────────────────

export interface StreakWidgetProps {
  /** The user's current streak count in days. */
  streak: number;
  /** Whether the user has read at least one dhikr today. */
  checkedInToday: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Streak indicator widget showing a flame icon and day count.
 *
 * Accessibility:
 *   - `accessibilityLabel` describes both the streak count and check-in status
 *     so screen reader users get the full picture in one announcement.
 */
export function StreakWidget({ streak, checkedInToday }: StreakWidgetProps): React.JSX.Element {
  const label = checkedInToday
    ? `${streak} day streak, checked in today`
    : `${streak} day streak, not checked in today`;

  const contentColor = checkedInToday ? colors.streak : colors.textDisabled;

  return (
    <View
      style={[styles.container, checkedInToday ? styles.containerActive : styles.containerInactive]}
      accessibilityLabel={label}
      accessibilityRole="text"
      testID="streak-widget"
    >
      {/* Flame icon */}
      <Text
        style={[styles.flame, { color: contentColor }]}
        testID="streak-widget-flame"
      >
        🔥
      </Text>

      {/* Streak count */}
      <Text
        style={[styles.count, { color: contentColor }]}
        testID="streak-widget-count"
      >
        {streak}
      </Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    borderWidth: 1,
    gap: spacing[1],
  },

  containerActive: {
    backgroundColor: colors.warningSubtle,
    borderColor: colors.streak,
  },

  containerInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },

  flame: {
    fontSize: 18,
    lineHeight: 22,
  },

  count: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
});
