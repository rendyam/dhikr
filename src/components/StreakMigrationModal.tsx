/**
 * StreakMigrationModal — shown after a Guest User completes Google Sign-In
 * for the first time when they have a local streak > 0.
 *
 * Offers the user a choice to migrate their local streak to their new account
 * so they don't lose progress built before signing in.
 *
 * Actions:
 *   - "Migrate"  → calls onMigrate; shows a loading spinner during the operation
 *   - "Skip"     → calls onSkip; discards the local streak
 *
 * An inline error message with a "Retry" button is shown when `error` is set.
 *
 * Requirements: 22.1–22.8
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { colors, spacing, radii } from '@/theme';

// ── Props ────────────────────────────────────────────────────────────────────

export interface StreakMigrationModalProps {
  /** Whether the modal is visible. */
  visible: boolean;
  /** The user's current local streak count to be migrated. */
  localStreak: number;
  /** Called when the user taps "Migrate". */
  onMigrate: () => void;
  /** Called when the user taps "Skip". */
  onSkip: () => void;
  /** Whether a migration operation is in progress. Disables buttons and shows a spinner. */
  isLoading: boolean;
  /** Error message to display inline. When set, a "Retry" button is shown. */
  error: string | null;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Modal offering streak migration after first-time Google Sign-In.
 *
 * Accessibility:
 *   - `accessibilityViewIsModal` on the sheet focuses screen readers within it.
 *   - Action buttons have descriptive `accessibilityLabel` values.
 *   - The loading state is announced via `accessibilityState.busy` on the
 *     Migrate button.
 *   - The error region has `accessibilityRole="alert"` so it is announced
 *     immediately when it appears.
 */
export function StreakMigrationModal({
  visible,
  localStreak,
  onMigrate,
  onSkip,
  isLoading,
  error,
}: StreakMigrationModalProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onSkip}
      testID="streak-migration-modal"
    >
      {/* Backdrop — tapping it acts as "Skip" when not loading */}
      <TouchableOpacity
        style={styles.backdrop}
        onPress={isLoading ? undefined : onSkip}
        activeOpacity={1}
        accessibilityLabel="Skip streak migration"
        testID="streak-migration-backdrop"
      />

      {/* Bottom sheet */}
      <View
        style={styles.sheet}
        accessibilityViewIsModal
        testID="streak-migration-sheet"
      >
        {/* Drag handle */}
        <View style={styles.handle} testID="streak-migration-handle" />

        {/* Flame + streak count heading */}
        <View style={styles.headingRow}>
          <Text style={styles.flameIcon} testID="streak-migration-flame">
            🔥
          </Text>
          <Text
            style={styles.streakCount}
            accessibilityRole="header"
            testID="streak-migration-streak-count"
          >
            {localStreak}
          </Text>
          <Text style={styles.streakLabel} testID="streak-migration-streak-label">
            {localStreak === 1 ? 'day streak' : 'day streak'}
          </Text>
        </View>

        {/* Title */}
        <Text
          style={styles.title}
          accessibilityRole="header"
          testID="streak-migration-title"
        >
          Keep your streak?
        </Text>

        {/* Body copy */}
        <Text style={styles.body} testID="streak-migration-body">
          You've built a {localStreak}-day streak as a guest. Would you like to
          save it to your new account so it carries over to all your devices?
        </Text>
        <Text style={styles.bodySecondary} testID="streak-migration-body-secondary">
          If you skip, your local streak will not be transferred.
        </Text>

        {/* Inline error */}
        {error !== null && (
          <View
            style={styles.errorContainer}
            accessibilityRole="alert"
            testID="streak-migration-error"
          >
            <Text style={styles.errorText} testID="streak-migration-error-text">
              {error}
            </Text>
            <TouchableOpacity
              onPress={onMigrate}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Retry streak migration"
              testID="streak-migration-retry-button"
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Primary CTA — Migrate */}
        <TouchableOpacity
          style={[styles.migrateButton, isLoading && styles.migrateButtonDisabled]}
          onPress={isLoading ? undefined : onMigrate}
          activeOpacity={0.85}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Migrate local streak to account"
          accessibilityState={{ busy: isLoading, disabled: isLoading }}
          testID="streak-migration-migrate-button"
        >
          {isLoading ? (
            <ActivityIndicator
              color={colors.textInverse}
              size="small"
              testID="streak-migration-loading-indicator"
            />
          ) : (
            <Text style={styles.migrateButtonText}>Migrate My Streak</Text>
          )}
        </TouchableOpacity>

        {/* Secondary CTA — Skip */}
        <TouchableOpacity
          style={[styles.skipButton, isLoading && styles.skipButtonDisabled]}
          onPress={isLoading ? undefined : onSkip}
          activeOpacity={0.7}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Skip streak migration"
          accessibilityState={{ disabled: isLoading }}
          testID="streak-migration-skip-button"
        >
          <Text style={[styles.skipButtonText, isLoading && styles.skipButtonTextDisabled]}>
            Skip
          </Text>
        </TouchableOpacity>

        {/* Safe-area bottom padding on iOS */}
        {Platform.OS === 'ios' && <View style={styles.safeAreaBottom} />}
      </View>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },

  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[6],
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    marginBottom: spacing[4],
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[3],
  },

  flameIcon: {
    fontSize: 28,
    lineHeight: 34,
  },

  streakCount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.streak,
    lineHeight: 34,
  },

  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.streak,
    lineHeight: 34,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },

  body: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[2],
    paddingHorizontal: spacing[2],
  },

  bodySecondary: {
    fontSize: 13,
    color: colors.textDisabled,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[3],
    paddingHorizontal: spacing[2],
  },

  errorContainer: {
    backgroundColor: colors.errorSubtle,
    borderRadius: radii.md,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    marginBottom: spacing[3],
    width: '100%',
    alignItems: 'center',
    gap: spacing[1],
  },

  errorText: {
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
    lineHeight: 20,
  },

  retryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
    textDecorationLine: 'underline',
  },

  migrateButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[8],
    marginTop: spacing[4],
    marginBottom: spacing[2],
    width: '100%',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },

  migrateButtonDisabled: {
    backgroundColor: colors.primaryLight,
    opacity: 0.7,
  },

  migrateButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },

  skipButton: {
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[8],
    marginBottom: spacing[2],
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  skipButtonDisabled: {
    opacity: 0.5,
  },

  skipButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },

  skipButtonTextDisabled: {
    color: colors.textDisabled,
  },

  safeAreaBottom: {
    height: 20,
  },
});
