/**
 * SourceBadge — renders a colored pill indicating the authenticity grade of a dhikr.
 *
 * - 'sahih' → green pill (colors.success / colors.successSubtle)
 * - 'hasan' → amber pill (colors.warning / colors.warningSubtle)
 *
 * The label is localized via i18next using the `authenticityGrade` namespace
 * already present in both en.json and id.json.
 *
 * Requirements: 3.3, 6.1, 6.2
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AuthenticityGrade } from '@/types/content';
import { colors } from '@/theme';

// ── Props ────────────────────────────────────────────────────────────────────

export interface SourceBadgeProps {
  /** The scholarly authenticity grade of the dhikr. */
  grade: AuthenticityGrade;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Renders a small colored pill with the localized grade label.
 *
 * Accessibility:
 *   - `accessibilityRole="text"` — announces the element as plain text
 *   - `accessibilityLabel` — describes the grade in the current language
 */
export function SourceBadge({ grade }: SourceBadgeProps): React.JSX.Element {
  const { t } = useTranslation();
  const label = t(`authenticityGrade.${grade}`);

  return (
    <View
      style={[styles.pill, grade === 'sahih' ? styles.sahihPill : styles.hasanPill]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text style={[styles.label, grade === 'sahih' ? styles.sahihLabel : styles.hasanLabel]}>
        {label}
      </Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sahihPill: {
    backgroundColor: colors.successSubtle,
  },
  hasanPill: {
    backgroundColor: colors.warningSubtle,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  sahihLabel: {
    color: colors.success,
  },
  hasanLabel: {
    color: colors.warning,
  },
});
