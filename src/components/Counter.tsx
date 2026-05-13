/**
 * Counter — tap counter with an animated progress ring.
 *
 * Displays the current count and, when a target is provided, shows
 * "count / target" and a circular progress ring that fills as the count
 * approaches the target. A distinct completion state (green ring + color
 * change) is shown when count >= target.
 *
 * Long-pressing the counter triggers `onLongPress`; the caller is responsible
 * for showing a confirmation prompt before resetting.
 *
 * The component uses React Native's built-in `Animated` API for the progress
 * ring so that no external SVG library is required.
 *
 * Requirements: 4.2, 4.3, 5.1, 5.2, 5.3, 5.4
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { colors, spacing, radii } from '@/theme';

// ── Constants ────────────────────────────────────────────────────────────────

/** Outer diameter of the progress ring in logical pixels. */
const RING_SIZE = 160;
/** Stroke width of the progress ring arc. */
const RING_STROKE = 10;
/** Inner diameter of the tappable area inside the ring. */
const INNER_SIZE = RING_SIZE - RING_STROKE * 2;

// ── Props ────────────────────────────────────────────────────────────────────

export interface CounterProps {
  /** Current repetition count. */
  count: number;
  /** Target repetition count. When defined, shows "count / target" and a progress ring. */
  target?: number;
  /** Called when the user taps the counter. */
  onTap: () => void;
  /** Called when the user long-presses the counter. Caller handles confirmation. */
  onLongPress: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Circular tap counter with an animated progress ring.
 *
 * Accessibility:
 *   - `accessibilityRole="button"` — announces the element as a button
 *   - `accessibilityLabel` — describes the current count (and target if set)
 *   - `accessibilityHint` — explains tap and long-press actions
 */
export function Counter({
  count,
  target,
  onTap,
  onLongPress,
}: CounterProps): React.JSX.Element {
  // ── Progress animation ────────────────────────────────────────────────────

  /**
   * Animated value in [0, 1] representing how full the progress ring is.
   * 0 = empty, 1 = full (count >= target).
   */
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const progress =
      target != null && target > 0
        ? Math.min(count / target, 1)
        : 0;

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false, // borderRadius / backgroundColor can't use native driver
    }).start();
  }, [count, target, progressAnim]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const isComplete = target != null && count >= target;
  const hasTarget = target != null;

  // ── Accessibility label ───────────────────────────────────────────────────

  const accessibilityLabel = hasTarget
    ? `Count ${count} of ${target}${isComplete ? ', complete' : ''}`
    : `Count ${count}`;

  // ── Animated ring color ───────────────────────────────────────────────────

  /**
   * The ring color transitions from `colors.primary` to `colors.success`
   * when the count reaches the target.
   */
  const ringColor = progressAnim.interpolate({
    inputRange: [0, 0.99, 1],
    outputRange: [colors.primary, colors.primary, colors.success],
    extrapolate: 'clamp',
  });

  // ── Progress ring (Animated approach) ────────────────────────────────────
  //
  // We simulate a circular progress ring using two half-circle masks:
  //   - A base ring (full circle border)
  //   - Two rotating half-discs that reveal the ring progressively
  //
  // For simplicity and broad compatibility (including web), we use a
  // single animated arc approximation: a View with a colored border that
  // clips based on progress. This is the "rotating border" technique.
  //
  // The ring is built from:
  //   1. A grey background circle (track)
  //   2. A colored foreground arc rendered via two half-circle clips
  //      (left half and right half), each rotated to reveal the correct
  //      portion of the ring.

  const halfProgress = progressAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
    extrapolate: 'clamp',
  });

  // Left half rotation: 0° → 180° as progress goes 0 → 0.5
  const leftRotation = progressAnim.interpolate({
    inputRange: [0, 0.5],
    outputRange: ['0deg', '180deg'],
    extrapolate: 'clamp',
  });

  // Right half rotation: 0° → 180° as progress goes 0.5 → 1
  const rightRotation = progressAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: ['0deg', '180deg'],
    extrapolate: 'clamp',
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.wrapper} testID="counter-wrapper">
      <Pressable
        onPress={onTap}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Tap to count, long press to reset"
        style={styles.pressable}
        testID="counter-pressable"
      >
        {/* ── Progress ring track (grey background circle) ── */}
        <View style={styles.ringTrack} testID="counter-ring-track">
          {/* ── Right half of the progress arc ── */}
          {/* Visible from 0% to 50% progress */}
          <View style={[styles.halfCircleContainer, styles.rightHalfContainer]}>
            <Animated.View
              style={[
                styles.halfCircle,
                styles.rightHalf,
                { borderColor: ringColor },
              ]}
              testID="counter-ring-right"
            />
          </View>

          {/* ── Left half of the progress arc ── */}
          {/* Visible from 50% to 100% progress */}
          <View style={[styles.halfCircleContainer, styles.leftHalfContainer]}>
            <Animated.View
              style={[
                styles.halfCircle,
                styles.leftHalf,
                { borderColor: ringColor },
                // Only show left half once progress > 50%
                { opacity: halfProgress },
              ]}
              testID="counter-ring-left"
            />
          </View>

          {/* ── Inner circle (tappable face) ── */}
          <Animated.View
            style={[
              styles.innerCircle,
              isComplete && styles.innerCircleComplete,
            ]}
            testID="counter-inner"
          >
            {/* Count display */}
            <Text
              style={[styles.countText, isComplete && styles.countTextComplete]}
              testID="counter-count-text"
            >
              {hasTarget ? `${count} / ${target}` : `${count}`}
            </Text>

            {/* Completion indicator */}
            {isComplete && (
              <Text style={styles.completionText} testID="counter-complete-indicator">
                ✓
              </Text>
            )}
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  /** Outer wrapper — positions the counter absolutely so it stays visible. */
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Ring track ─────────────────────────────────────────────────────────────

  ringTrack: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: RING_STROKE,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  // ── Half-circle clip containers ────────────────────────────────────────────

  halfCircleContainer: {
    width: RING_SIZE / 2,
    height: RING_SIZE,
    position: 'absolute',
    top: -RING_STROKE,
    overflow: 'hidden',
  },

  rightHalfContainer: {
    right: -RING_STROKE,
  },

  leftHalfContainer: {
    left: -RING_STROKE,
  },

  // ── Half-circle arcs ───────────────────────────────────────────────────────

  halfCircle: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_STROKE,
    position: 'absolute',
    top: 0,
  },

  rightHalf: {
    borderColor: colors.primary,
    right: 0,
    // Only show the right border (clips left half)
    borderLeftColor: colors.transparent,
    borderTopColor: colors.transparent,
    borderBottomColor: colors.transparent,
  },

  leftHalf: {
    borderColor: colors.primary,
    left: 0,
    // Only show the left border (clips right half)
    borderRightColor: colors.transparent,
    borderTopColor: colors.transparent,
    borderBottomColor: colors.transparent,
  },

  // ── Inner circle ───────────────────────────────────────────────────────────

  innerCircle: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    // Elevate above the half-circle clips
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  innerCircleComplete: {
    backgroundColor: colors.successSubtle,
  },

  // ── Text ───────────────────────────────────────────────────────────────────

  countText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },

  countTextComplete: {
    color: colors.success,
  },

  completionText: {
    fontSize: 18,
    color: colors.success,
    fontWeight: '700',
    marginTop: spacing[1],
  },
});
