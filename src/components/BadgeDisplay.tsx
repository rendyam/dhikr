/**
 * BadgeDisplay — renders a grid of streak milestone badges.
 *
 * Shows all three fixed milestones (7, 30, 100 days). Earned badges are
 * displayed in full color; unearned badges are greyed out with a locked
 * appearance.
 *
 * Requirements: 14.6, 14.7
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii } from '@/theme';
import type { Badge } from '@/types/user';

// ── Constants ────────────────────────────────────────────────────────────────

/** The three fixed streak milestones, always displayed in this order. */
const MILESTONES = [7, 30, 100] as const;
type Milestone = (typeof MILESTONES)[number];

/** Icon for each milestone. */
const MILESTONE_ICON: Record<Milestone, string> = {
  7: '🔥',
  30: '⭐',
  100: '🏆',
};

// ── Props ────────────────────────────────────────────────────────────────────

export interface BadgeDisplayProps {
  /** All badges the user has earned. A milestone is earned if it appears here. */
  badges: Badge[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a Unix timestamp as a human-readable date string.
 * e.g. 1704067200 → "Jan 1, 2024"
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Grid of three milestone badge items (7, 30, 100 days).
 *
 * Accessibility:
 *   - Each badge item has an `accessibilityLabel` that describes the milestone
 *     and, for earned badges, the date it was earned.
 */
export function BadgeDisplay({ badges }: BadgeDisplayProps): React.JSX.Element {
  return (
    <View style={styles.container} testID="badge-display">
      {MILESTONES.map((milestone) => {
        const earned = badges.find((b) => b.milestone === milestone) ?? null;
        const isEarned = earned !== null;

        const accessibilityLabel = isEarned
          ? `${milestone}-day streak badge, earned on ${formatDate(earned!.earnedAt)}`
          : `${milestone}-day streak badge, not yet earned`;

        return (
          <View
            key={milestone}
            style={[styles.badgeItem, isEarned ? styles.badgeItemEarned : styles.badgeItemLocked]}
            testID={`badge-item-${milestone}`}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="image"
          >
            {/* Lock overlay for unearned badges */}
            {!isEarned && (
              <Text style={styles.lockIcon} testID={`badge-lock-${milestone}`}>
                🔒
              </Text>
            )}

            {/* Milestone icon */}
            <Text
              style={[styles.icon, isEarned ? styles.iconEarned : styles.iconLocked]}
              testID={`badge-icon-${milestone}`}
            >
              {MILESTONE_ICON[milestone]}
            </Text>

            {/* Milestone label */}
            <Text
              style={[styles.label, isEarned ? styles.labelEarned : styles.labelLocked]}
              testID={`badge-label-${milestone}`}
            >
              {milestone} days
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[2],
    gap: spacing[3],
  },

  badgeItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[2],
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[1],
  },

  badgeItemEarned: {
    backgroundColor: colors.warningSubtle,
    borderColor: colors.streak,
  },

  badgeItemLocked: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    opacity: 0.6,
  },

  lockIcon: {
    fontSize: 12,
    lineHeight: 16,
    position: 'absolute',
    top: spacing[1],
    right: spacing[1],
  },

  icon: {
    fontSize: 28,
    lineHeight: 34,
  },

  iconEarned: {
    opacity: 1,
  },

  iconLocked: {
    opacity: 0.5,
  },

  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  labelEarned: {
    color: colors.streak,
  },

  labelLocked: {
    color: colors.textDisabled,
  },
});
