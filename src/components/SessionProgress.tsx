/**
 * SessionProgress — horizontal progress bar for a guided dhikr session.
 *
 * Displays how far through a session the user is by filling a bar
 * proportionally to `current / total`.
 *
 * Requirements: 4.1
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radii } from '@/theme';

// ── Props ────────────────────────────────────────────────────────────────────

export interface SessionProgressProps {
  /** The index of the current dhikr (0-based or 1-based — caller's choice). */
  current: number;
  /** Total number of dhikr entries in the session. */
  total: number;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Horizontal progress bar that fills from left to right as the session advances.
 *
 * Accessibility:
 *   - `accessibilityRole="progressbar"` — announces the element as a progress bar
 *   - `accessibilityValue` — exposes min, max, and now values to assistive tech
 */
export function SessionProgress({ current, total }: SessionProgressProps): React.JSX.Element {
  // Guard against division by zero and clamp to [0, 1]
  const ratio = total > 0 ? Math.min(Math.max(current / total, 0), 1) : 0;
  const fillPercent = `${(ratio * 100).toFixed(2)}%`;

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: current }}
      testID="session-progress-track"
    >
      <View
        style={[styles.fill, { width: fillPercent }]}
        testID="session-progress-fill"
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  /** The grey background track that spans the full width. */
  track: {
    height: spacing[2],
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
  },

  /** The coloured fill that grows from left to right. */
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },
});
