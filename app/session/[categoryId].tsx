/**
 * Guided Session screen — presents dhikr one at a time with a tap counter.
 *
 * Flow:
 *   1. Load dhikr list for the category via `useDhikrByCategory`.
 *   2. Call `sessionStore.startSession(categoryId, dhikrIds)` on mount.
 *   3. Display the current dhikr (Arabic text, translation, repetition count).
 *   4. Counter tap calls `sessionStore.increment()`.
 *   5. When `count >= target` (or target is null): show "Next" button.
 *   6. "Next" calls `sessionStore.advance()`.
 *   7. When `isComplete === true`: show inline completion screen.
 *   8. Back/exit button shows confirmation prompt; calls `sessionStore.exitSession()`.
 *
 * Requirements: 4.1–4.7, 5.1–5.4
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSessionStore } from '@/store/sessionStore';
import { useDhikrByCategory } from '@/hooks/useDhikrByCategory';
import { useDhikr } from '@/hooks/useDhikr';
import { Counter } from '@/components/Counter';
import { SessionProgress } from '@/components/SessionProgress';
import { ArabicText } from '@/components/ArabicText';
import { colors, spacing, radii } from '@/theme';

// ── Sub-component: current dhikr view ─────────────────────────────────────────

interface DhikrViewProps {
  dhikrId: number;
  count: number;
  currentIndex: number;
  total: number;
  onTap: () => void;
  onLongPress: () => void;
  onNext: () => void;
}

function DhikrView({
  dhikrId,
  count,
  currentIndex,
  total,
  onTap,
  onLongPress,
  onNext,
}: DhikrViewProps): React.JSX.Element {
  const { dhikr, isLoading, error } = useDhikr(dhikrId);

  if (isLoading) {
    return (
      <View style={styles.centeredFill} testID="session-dhikr-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !dhikr) {
    return (
      <View style={styles.centeredFill} testID="session-dhikr-error">
        <Text style={styles.errorText}>Failed to load dhikr.</Text>
      </View>
    );
  }

  const target = dhikr.repetitionCount ?? undefined;
  const isComplete = target != null && count >= target;
  // "Next" is available when target is met, or when there is no target
  const canAdvance = target == null || count >= target;

  return (
    <View style={styles.dhikrContainer} testID="session-dhikr-view">
      {/* Progress bar */}
      <View style={styles.progressContainer} testID="session-progress-container">
        <SessionProgress current={currentIndex + 1} total={total} />
        <Text style={styles.progressLabel} testID="session-progress-label">
          {currentIndex + 1} / {total}
        </Text>
      </View>

      {/* Dhikr content */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentScrollInner}
        testID="session-content-scroll"
      >
        <ArabicText
          text={dhikr.arabicText}
          size="large"
          style={styles.arabicText}
        />

        {dhikr.translationFallback && (
          <Text style={styles.fallbackNotice} testID="session-translation-fallback">
            (English)
          </Text>
        )}

        <Text style={styles.translationText} testID="session-translation">
          {dhikr.translation}
        </Text>

        {target != null && (
          <Text style={styles.repetitionText} testID="session-repetition-count">
            {count} / {target}
          </Text>
        )}
      </ScrollView>

      {/* Counter */}
      <View style={styles.counterContainer} testID="session-counter-container">
        <Counter
          count={count}
          target={target}
          onTap={onTap}
          onLongPress={onLongPress}
        />
      </View>

      {/* Completion indicator */}
      {isComplete && (
        <View style={styles.completionBanner} testID="session-completion-indicator">
          <Text style={styles.completionBannerText}>✓ Completed</Text>
        </View>
      )}

      {/* Next button */}
      {canAdvance && (
        <Pressable
          style={styles.nextButton}
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel="Next dhikr"
          testID="session-next-button"
        >
          <Text style={styles.nextButtonText}>Next →</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Sub-component: completion screen ─────────────────────────────────────────

interface CompletionViewProps {
  onExit: () => void;
}

function CompletionView({ onExit }: CompletionViewProps): React.JSX.Element {
  return (
    <View style={styles.completionContainer} testID="session-complete-view">
      <Text style={styles.completionTitle} testID="session-complete-title">
        🎉 Session Complete!
      </Text>
      <Text style={styles.completionSubtitle} testID="session-complete-subtitle">
        May Allah accept your dhikr.
      </Text>
      <Pressable
        style={styles.doneButton}
        onPress={onExit}
        accessibilityRole="button"
        accessibilityLabel="Finish session"
        testID="session-done-button"
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </Pressable>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SessionScreen(): React.JSX.Element {
  const { categoryId: categoryIdParam } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();

  const categoryId = Number(categoryIdParam);

  // Session store
  const startSession = useSessionStore((s) => s.startSession);
  const increment = useSessionStore((s) => s.increment);
  const resetCount = useSessionStore((s) => s.resetCount);
  const advance = useSessionStore((s) => s.advance);
  const exitSession = useSessionStore((s) => s.exitSession);
  const currentIndex = useSessionStore((s) => s.currentIndex);
  const count = useSessionStore((s) => s.count);
  const isComplete = useSessionStore((s) => s.isComplete);
  const dhikrIds = useSessionStore((s) => s.dhikrIds);

  // Load dhikr list for the category
  const { dhikrList, isLoading, error } = useDhikrByCategory(categoryId);

  // Track whether the session has been started for this category load
  const sessionStartedRef = useRef(false);

  useEffect(() => {
    if (!isLoading && dhikrList.length > 0 && !sessionStartedRef.current) {
      sessionStartedRef.current = true;
      const ids = dhikrList.map((d) => d.id);
      startSession(categoryId, ids);
    }
  }, [isLoading, dhikrList, categoryId, startSession]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleExit() {
    Alert.alert(
      'Exit Session',
      'Are you sure you want to exit? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => {
            exitSession();
            router.back();
          },
        },
      ],
    );
  }

  function handleLongPress() {
    Alert.alert(
      'Reset Count',
      'Reset the count for this dhikr?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetCount },
      ],
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen} testID="session-screen">
      {/* Header with exit button */}
      <View style={styles.header} testID="session-header">
        <Pressable
          onPress={handleExit}
          style={styles.exitButton}
          accessibilityRole="button"
          accessibilityLabel="Exit session"
          testID="session-exit-button"
        >
          <Text style={styles.exitButtonText}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle} testID="session-header-title">
          Guided Session
        </Text>
        {/* Spacer to balance the exit button */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Body */}
      {isLoading && (
        <View style={styles.centeredFill} testID="session-loading">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {!isLoading && error && (
        <View style={styles.centeredFill} testID="session-error">
          <Text style={styles.errorText}>Failed to load session.</Text>
        </View>
      )}

      {!isLoading && !error && isComplete && (
        <CompletionView onExit={() => { exitSession(); router.back(); }} />
      )}

      {!isLoading && !error && !isComplete && dhikrIds.length > 0 && (
        <DhikrView
          dhikrId={dhikrIds[currentIndex]}
          count={count}
          currentIndex={currentIndex}
          total={dhikrIds.length}
          onTap={increment}
          onLongPress={handleLongPress}
          onNext={advance}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────────

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },

  exitButton: {
    padding: spacing[2],
    borderRadius: radii.full,
  },

  exitButtonText: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  headerSpacer: {
    width: 34, // matches exit button width to keep title centered
  },

  // ── Loading / error ──────────────────────────────────────────────────────────

  centeredFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },

  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },

  // ── Dhikr view ───────────────────────────────────────────────────────────────

  dhikrContainer: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
  },

  progressContainer: {
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    gap: spacing[1],
  },

  progressLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  contentScroll: {
    flex: 1,
  },

  contentScrollInner: {
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    gap: spacing[4],
    alignItems: 'center',
  },

  arabicText: {
    textAlign: 'center',
    width: '100%',
  },

  fallbackNotice: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  translationText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  repetitionText: {
    fontSize: 14,
    color: colors.textDisabled,
    textAlign: 'center',
  },

  // ── Counter ──────────────────────────────────────────────────────────────────

  counterContainer: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },

  // ── Completion banner (per-dhikr) ─────────────────────────────────────────────

  completionBanner: {
    backgroundColor: colors.successSubtle,
    borderRadius: radii.md,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    marginBottom: spacing[2],
  },

  completionBannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
  },

  // ── Next button ───────────────────────────────────────────────────────────────

  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[8],
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: spacing[2],
  },

  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },

  // ── Session completion view ───────────────────────────────────────────────────

  completionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[4],
  },

  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },

  completionSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[8],
    alignItems: 'center',
    marginTop: spacing[4],
  },

  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
