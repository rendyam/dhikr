/**
 * Profile screen — sign-in / account info, badges, and settings entry point.
 *
 * Guest state (user === null):
 *   - "Sign in with Google" button → /sign-in
 *   - Brief sign-in benefits message
 *   - Settings link → /settings
 *   - BadgeDisplay with empty badges
 *
 * Authenticated state (user !== null):
 *   - User display name, email, and avatar (or initials placeholder)
 *   - Settings link → /settings
 *   - BadgeDisplay with earned badges from streakStore
 *   - "Sign out" button → authStore.signOut()
 *
 * Requirements: 14.7, 16.4, 16.5
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BadgeDisplay } from '@/components/BadgeDisplay';
import { useAuthStore } from '@/store/authStore';
import { useStreakStore } from '@/store/streakStore';
import { colors, spacing, radii } from '@/theme';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the first letter of the display name (uppercased), or '?' as fallback.
 */
function getInitial(displayName: string | null): string {
  if (!displayName) return '?';
  return displayName.charAt(0).toUpperCase();
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();

  // ── Store state ───────────────────────────────────────────────────────────
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const signOut = useAuthStore((state) => state.signOut);
  const badges = useStreakStore((state) => state.badges);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSignIn = useCallback(() => {
    router.push('/sign-in');
  }, [router]);

  const handleSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const handleSignOut = useCallback(() => {
    void signOut();
  }, [signOut]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      testID="profile-scroll"
    >
      {/* ── Header ── */}
      <Text style={styles.title} testID="profile-title">
        Profile
      </Text>

      {user === null ? (
        // ── Guest state ────────────────────────────────────────────────────
        <>
          <View style={styles.guestCard}>
            <Text style={styles.guestHeading}>Sign in to unlock more</Text>
            <Text style={styles.guestMessage}>
              Sign in with Google to sync your streak and favorites across all your devices.
            </Text>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSignIn}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Google"
              testID="profile-sign-in-button"
            >
              <Text style={styles.signInButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
          </View>

          {/* ── Settings ── */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettings}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            testID="profile-settings-button"
          >
            <Text style={styles.settingsButtonText}>Settings</Text>
          </TouchableOpacity>

          {/* ── Badges (empty for guest) ── */}
          <View style={styles.badgesSection}>
            <Text style={styles.sectionLabel}>Streak Badges</Text>
            <BadgeDisplay badges={[]} />
          </View>
        </>
      ) : (
        // ── Authenticated state ────────────────────────────────────────────
        <>
          {/* ── User info card ── */}
          <View style={styles.userCard}>
            {/* Avatar */}
            {user.photoURL !== null ? (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.avatar}
                accessibilityLabel={`${user.displayName ?? 'User'} profile picture`}
                testID="profile-avatar"
              />
            ) : (
              <View style={styles.avatarPlaceholder} testID="profile-avatar">
                <Text style={styles.avatarInitial}>{getInitial(user.displayName)}</Text>
              </View>
            )}

            {/* Name & email */}
            <Text style={styles.displayName} testID="profile-display-name">
              {user.displayName ?? 'User'}
            </Text>
            <Text style={styles.email} testID="profile-email">
              {user.email ?? ''}
            </Text>
          </View>

          {/* ── Settings ── */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettings}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            testID="profile-settings-button"
          >
            <Text style={styles.settingsButtonText}>Settings</Text>
          </TouchableOpacity>

          {/* ── Badges ── */}
          <View style={styles.badgesSection}>
            <Text style={styles.sectionLabel}>Streak Badges</Text>
            <BadgeDisplay badges={badges} />
          </View>

          {/* ── Sign out ── */}
          <TouchableOpacity
            style={[styles.signOutButton, isLoading && styles.signOutButtonDisabled]}
            onPress={handleSignOut}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            testID="profile-sign-out-button"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={styles.signOutButtonText}>Sign out</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing[6],
  },

  // ── Guest card ─────────────────────────────────────────────────────────────
  guestCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[4],
  },

  guestHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },

  guestMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[4],
  },

  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
  },

  signInButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },

  // ── Settings button ────────────────────────────────────────────────────────
  settingsButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    marginBottom: spacing[4],
  },

  settingsButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },

  // ── Badges section ─────────────────────────────────────────────────────────
  badgesSection: {
    marginBottom: spacing[4],
  },

  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },

  // ── User card ──────────────────────────────────────────────────────────────
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[4],
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    marginBottom: spacing[3],
  },

  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.primarySubtle,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },

  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },

  displayName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing[1],
    textAlign: 'center',
  },

  email: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ── Sign out button ────────────────────────────────────────────────────────
  signOutButton: {
    backgroundColor: colors.error,
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    marginTop: spacing[2],
  },

  signOutButtonDisabled: {
    opacity: 0.6,
  },

  signOutButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },
});
