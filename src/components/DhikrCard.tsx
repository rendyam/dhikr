/**
 * DhikrCard — a pressable card that summarises a single dhikr entry.
 *
 * Displays:
 *   - The first line of the Arabic text (via ArabicText)
 *   - The authenticity grade badge (via SourceBadge)
 *   - A favorite toggle icon (★ / ☆)
 *
 * The entire card is pressable (navigates to detail view); the favorite
 * toggle is a separate pressable so it does not trigger the card press.
 *
 * Requirements: 2.3, 3.1, 10.1
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import type { Dhikr } from '@/types/content';
import { colors, spacing, radii } from '@/theme';
import { ArabicText } from './ArabicText';
import { SourceBadge } from './SourceBadge';

// ── Props ────────────────────────────────────────────────────────────────────

export interface DhikrCardProps {
  /** The dhikr entry to display. */
  dhikr: Dhikr;
  /** Called when the user taps the card body. */
  onPress: () => void;
  /** Called when the user taps the favorite toggle icon. */
  onFavorite: () => void;
  /** Whether this dhikr is currently marked as a favorite. */
  isFavorite: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the first line of the Arabic text, trimmed of surrounding whitespace.
 * Falls back to the full text if there are no newlines.
 */
function firstLine(text: string): string {
  return text.split('\n')[0].trim();
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Pressable card summarising a dhikr entry.
 *
 * Accessibility:
 *   - Card: `accessibilityRole="button"` — announces the element as a button
 *   - Favorite toggle: `accessibilityRole="button"` with a descriptive
 *     `accessibilityLabel` that reflects the current favorite state
 */
export function DhikrCard({
  dhikr,
  onPress,
  onFavorite,
  isFavorite,
}: DhikrCardProps): React.JSX.Element {
  const arabicSnippet = firstLine(dhikr.arabicText);
  const favoriteLabel = isFavorite
    ? 'Remove from favorites'
    : 'Add to favorites';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      activeOpacity={0.7}
      testID="dhikr-card"
    >
      {/* ── Arabic text snippet ── */}
      <View style={styles.arabicContainer} testID="dhikr-card-arabic">
        <ArabicText
          text={arabicSnippet}
          size="medium"
          style={styles.arabicText}
        />
      </View>

      {/* ── Footer row: source badge + favorite toggle ── */}
      <View style={styles.footer}>
        {/* Source / authenticity badge */}
        <SourceBadge grade={dhikr.authenticityGrade} />

        {/* Favorite toggle — separate pressable so it doesn't fire onPress */}
        <TouchableOpacity
          onPress={onFavorite}
          accessibilityRole="button"
          accessibilityLabel={favoriteLabel}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID="dhikr-card-favorite"
        >
          <View style={styles.favoriteIcon} testID="dhikr-card-favorite-icon">
            {isFavorite ? (
              <ArabicText
                text="★"
                size="small"
                style={styles.favoriteStarActive}
              />
            ) : (
              <ArabicText
                text="☆"
                size="small"
                style={styles.favoriteStarInactive}
              />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[2],
    ...Platform.select({
      ios: {
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },

  arabicContainer: {
    marginBottom: spacing[2],
  },

  arabicText: {
    color: colors.textPrimary,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  favoriteIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  favoriteStarActive: {
    color: colors.warning,
    // Override Arabic font RTL settings for the star symbol
    writingDirection: 'ltr',
    textAlign: 'center',
  },

  favoriteStarInactive: {
    color: colors.textDisabled,
    writingDirection: 'ltr',
    textAlign: 'center',
  },
});
