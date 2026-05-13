/**
 * StreakNudgeModal — a non-blocking bottom sheet that nudges Guest Users
 * with a streak ≥ 3 to sign in and protect their progress.
 *
 * The modal explains that streak data is stored only on the device for
 * Guest Users and will be lost on uninstall or device change. It offers
 * three actions:
 *   - "Sign In"         → navigates to the sign-in screen
 *   - "Maybe Later"     → dismisses for at least 3 days
 *   - "Don't show again" → permanently suppresses the nudge
 *
 * Requirements: 21.1–21.8
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { colors, spacing, radii } from '@/theme';

// ── Props ────────────────────────────────────────────────────────────────────

export interface StreakNudgeModalProps {
  /** Whether the modal is visible. */
  visible: boolean;
  /** The user's current local streak count. */
  streak: number;
  /** Called when the user taps "Sign In". */
  onSignIn: () => void;
  /** Called when the user taps "Maybe Later". */
  onLater: () => void;
  /** Called when the user taps "Don't show again". */
  onDismissPermanently: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Non-blocking bottom sheet modal nudging Guest Users to sign in.
 *
 * Accessibility:
 *   - The modal container has `accessibilityViewIsModal` so screen readers
 *     focus within it while it is open.
 *   - Each action button has a descriptive `accessibilityLabel`.
 *   - The streak count is announced as part of the heading text.
 */
export function StreakNudgeModal({
  visible,
  streak,
  onSignIn,
  onLater,
  onDismissPermanently,
}: StreakNudgeModalProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onLater}
      testID="streak-nudge-modal"
    >
      {/* Backdrop — tapping it acts as "Maybe Later" */}
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onLater}
        activeOpacity={1}
        accessibilityLabel="Dismiss streak nudge"
        testID="streak-nudge-backdrop"
      />

      {/* Bottom sheet */}
      <View
        style={styles.sheet}
        accessibilityViewIsModal
        testID="streak-nudge-sheet"
      >
        {/* Drag handle (visual affordance) */}
        <View style={styles.handle} testID="streak-nudge-handle" />

        {/* Flame + streak count heading */}
        <View style={styles.headingRow}>
          <Text style={styles.flameIcon} testID="streak-nudge-flame">
            🔥
          </Text>
          <Text
            style={styles.streakCount}
            accessibilityRole="header"
            testID="streak-nudge-streak-count"
          >
            {streak}
          </Text>
          <Text style={styles.streakLabel} testID="streak-nudge-streak-label">
            {streak === 1 ? 'day streak' : 'day streak'}
          </Text>
        </View>

        {/* Title */}
        <Text
          style={styles.title}
          accessibilityRole="header"
          testID="streak-nudge-title"
        >
          Protect your streak
        </Text>

        {/* Body copy */}
        <Text style={styles.body} testID="streak-nudge-body">
          Your streak is saved only on this device. If you uninstall the app or
          switch to a new device, your progress will be lost.
        </Text>
        <Text style={styles.body} testID="streak-nudge-body-cta">
          Sign in with Google to back up your streak and access it from any
          device.
        </Text>

        {/* Primary CTA — Sign In */}
        <TouchableOpacity
          style={styles.signInButton}
          onPress={onSignIn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Sign in to protect your streak"
          testID="streak-nudge-sign-in-button"
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Secondary CTA — Maybe Later */}
        <TouchableOpacity
          style={styles.laterButton}
          onPress={onLater}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Maybe later, dismiss streak nudge"
          testID="streak-nudge-later-button"
        >
          <Text style={styles.laterButtonText}>Maybe Later</Text>
        </TouchableOpacity>

        {/* Tertiary — Don't show again */}
        <TouchableOpacity
          onPress={onDismissPermanently}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Don't show this again"
          testID="streak-nudge-dismiss-permanently-button"
        >
          <Text style={styles.dismissText}>Don't show again</Text>
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
    // Elevation / shadow
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

  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[8],
    marginTop: spacing[4],
    marginBottom: spacing[2],
    width: '100%',
    alignItems: 'center',
  },

  signInButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },

  laterButton: {
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[8],
    marginBottom: spacing[3],
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  laterButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },

  dismissText: {
    fontSize: 13,
    color: colors.textDisabled,
    textDecorationLine: 'underline',
    paddingVertical: spacing[2],
  },

  safeAreaBottom: {
    height: 20,
  },
});
