/**
 * StreakNudgeModal — bottom-sheet modal that nudges Guest Users to sign in
 * and protect their local streak.
 *
 * Explains that the streak is device-only and will be lost on uninstall or
 * device change. Offers three actions:
 *   - "Sign In"          → calls onSignIn (navigates to sign-in screen)
 *   - "Maybe Later"      → calls onLater (3-day cooldown before re-showing)
 *   - "Don't show again" → calls onDismissPermanently (permanent suppression)
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
  Pressable,
} from 'react-native';
import { colors, spacing, radii } from '@/theme';

// ── Props ────────────────────────────────────────────────────────────────────

export interface StreakNudgeModalProps {
  /** Whether the modal is visible. */
  visible: boolean;
  /** The user's current streak count (displayed in the modal body). */
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
 * Non-blocking bottom-sheet modal that encourages Guest Users to sign in
 * to protect their streak data.
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
      testID="streak-nudge-modal"
      accessibilityViewIsModal
    >
      {/* Backdrop — tapping it acts as "Maybe Later" */}
      <Pressable
        style={styles.backdrop}
        onPress={onLater}
        accessibilityLabel="Dismiss streak nudge"
        testID="streak-nudge-backdrop"
      />

      {/* Sheet */}
      <View style={styles.sheet} testID="streak-nudge-sheet">
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Flame + streak count */}
        <Text style={styles.streakLine} testID="streak-nudge-streak">
          🔥 {streak} day streak
        </Text>

        {/* Headline */}
        <Text style={styles.title}>
          Protect your streak
        </Text>

        {/* Body */}
        <Text style={styles.body}>
          Your streak is saved on this device only. If you uninstall the app or
          switch devices, it will be lost. Sign in to back it up to the cloud.
        </Text>

        {/* Primary CTA */}
        <TouchableOpacity
          style={styles.signInButton}
          onPress={onSignIn}
          accessibilityRole="button"
          accessibilityLabel="Sign in to protect your streak"
          testID="streak-nudge-sign-in"
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Secondary: Maybe Later */}
        <TouchableOpacity
          style={styles.laterButton}
          onPress={onLater}
          accessibilityRole="button"
          accessibilityLabel="Maybe later"
          testID="streak-nudge-later"
        >
          <Text style={styles.laterButtonText}>Maybe Later</Text>
        </TouchableOpacity>

        {/* Tertiary: Don't show again */}
        <TouchableOpacity
          onPress={onDismissPermanently}
          accessibilityRole="button"
          accessibilityLabel="Don't show this again"
          testID="streak-nudge-dismiss-permanently"
        >
          <Text style={styles.dismissText}>Don't show again</Text>
        </TouchableOpacity>
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
    paddingBottom: spacing[8],
    alignItems: 'center',
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    marginBottom: spacing[4],
  },

  streakLine: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.streak,
    marginBottom: spacing[2],
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },

  body: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[6],
  },

  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[8],
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing[2],
  },

  signInButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },

  laterButton: {
    paddingVertical: spacing[3],
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing[2],
  },

  laterButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
  },

  dismissText: {
    color: colors.textDisabled,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
