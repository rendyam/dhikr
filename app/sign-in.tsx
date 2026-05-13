import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { uiFontSizes, uiLineHeights } from '@/theme/typography';

/**
 * Sign-In screen — Google Sign-In via Firebase Authentication.
 *
 * Features:
 *   - "Sign in with Google" button following Google branding guidelines
 *   - Loading state with ActivityIndicator while sign-in is in progress
 *   - Error handling: network failure, cancelled sign-in, generic errors
 *   - On success: navigate back to previous screen
 *   - Streak migration check after successful sign-in (flag for task 44)
 *
 * Requirements: 16.1, 16.2, 16.7, 16.8
 */

// ── Error classification ──────────────────────────────────────────────────────

type SignInError = 'cancelled' | 'network' | 'generic';

function classifyError(error: unknown): SignInError {
  if (!error) return 'generic';
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (
    message.includes('cancel') ||
    message.includes('dismissed') ||
    message.includes('user_cancelled') ||
    message.includes('12501') // Google Sign-In cancelled code
  ) {
    return 'cancelled';
  }

  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('unavailable') ||
    message.includes('connection')
  ) {
    return 'network';
  }

  return 'generic';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signInWithGoogle, isLoading } = useAuthStore((s) => ({
    signInWithGoogle: s.signInWithGoogle,
    isLoading: s.isLoading,
  }));

  const [errorType, setErrorType] = useState<SignInError | null>(null);

  const handleSignIn = async () => {
    setErrorType(null);
    try {
      await signInWithGoogle();
      // Sign-in succeeded — navigate back to the previous screen
      router.back();
      // NOTE (task 44): streak migration check will be triggered here.
      // After successful sign-in, check if local streak > 0 and
      // 'streak_migration_offered' !== '1' in SQLite settings.
      // If so, show the StreakMigrationModal. Implementation deferred to task 44.
    } catch (error) {
      setErrorType(classifyError(error));
    }
  };

  const handleDismissError = () => {
    setErrorType(null);
  };

  const errorMessage = (() => {
    if (errorType === 'cancelled') return t('signIn.errorCancelled');
    if (errorType === 'network') return t('signIn.errorNetwork');
    if (errorType === 'generic') return t('signIn.errorGeneric');
    return null;
  })();

  return (
    <View style={styles.container} testID="sign-in-screen">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} testID="sign-in-title">
          {t('signIn.title')}
        </Text>
        <Text style={styles.subtitle} testID="sign-in-subtitle">
          {t('signIn.subtitle')}
        </Text>
      </View>

      {/* Error message */}
      {errorMessage ? (
        <View style={styles.errorContainer} testID="sign-in-error">
          <Text style={styles.errorText} testID="sign-in-error-message">
            {errorMessage}
          </Text>
          <TouchableOpacity
            onPress={handleDismissError}
            accessibilityRole="button"
            accessibilityLabel={t('signIn.dismissError')}
            testID="sign-in-dismiss-error"
          >
            <Text style={styles.errorDismiss}>{t('signIn.dismissError')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Google Sign-In button — follows Google branding guidelines (Req 16.8):
          White background, Google logo, specific text, border */}
      <TouchableOpacity
        style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
        onPress={handleSignIn}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel={
          isLoading ? t('signIn.loading') : t('signIn.googleButton')
        }
        accessibilityState={{ disabled: isLoading, busy: isLoading }}
        testID="sign-in-google-button"
      >
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={GOOGLE_BLUE}
            accessibilityLabel={t('signIn.loading')}
            testID="sign-in-loading-indicator"
          />
        ) : (
          <View style={styles.googleButtonContent}>
            {/* Google "G" logo — inline SVG-style using colored text as fallback */}
            <View style={styles.googleLogoContainer} testID="sign-in-google-logo">
              <Text style={styles.googleLogoText}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>{t('signIn.googleButton')}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ── Google brand colors (per Google Sign-In branding guidelines) ──────────────

const GOOGLE_BLUE = '#4285F4';
const GOOGLE_RED = '#EA4335';
const GOOGLE_YELLOW = '#FBBC05';
const GOOGLE_GREEN = '#34A853';

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },

  title: {
    fontSize: uiFontSizes.large,
    lineHeight: uiLineHeights.large,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },

  subtitle: {
    fontSize: uiFontSizes.medium,
    lineHeight: uiLineHeights.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },

  // ── Error banner ────────────────────────────────────────────────────────────

  errorContainer: {
    width: '100%',
    backgroundColor: colors.errorSubtle,
    borderRadius: radii.md,
    padding: spacing[3],
    marginBottom: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  errorText: {
    flex: 1,
    fontSize: uiFontSizes.small,
    lineHeight: uiLineHeights.small,
    color: colors.error,
    marginRight: spacing[2],
  },

  errorDismiss: {
    fontSize: uiFontSizes.small,
    lineHeight: uiLineHeights.small,
    color: colors.error,
    fontWeight: '600',
  },

  // ── Google Sign-In button (Google branding guidelines) ──────────────────────
  // White background, 1dp border (#dadce0), 4dp corner radius, Google logo + text

  googleButton: {
    width: '100%',
    maxWidth: 320,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#DADCE0',
    alignItems: 'center',
    justifyContent: 'center',
    // Elevation for Android
    elevation: 1,
    // Shadow for iOS
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },

  googleButtonDisabled: {
    opacity: 0.7,
  },

  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  googleLogoContainer: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },

  googleLogoText: {
    fontSize: 16,
    fontWeight: '700',
    color: GOOGLE_BLUE,
  },

  googleButtonText: {
    fontSize: uiFontSizes.medium,
    lineHeight: uiLineHeights.medium,
    color: '#3C4043', // Google's recommended text color for sign-in button
    fontWeight: '500',
    letterSpacing: 0.25,
  },
});
