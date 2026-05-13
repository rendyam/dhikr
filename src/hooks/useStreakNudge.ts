/**
 * useStreakNudge hook — decides whether to show the StreakNudgeModal to a
 * Guest User who has built up a local streak.
 *
 * Returns:
 *   - shouldShow          true when all trigger conditions are met
 *   - dismiss()           "Maybe Later" — records today + current streak,
 *                         enforces a 3-day cooldown before re-showing
 *   - dismissPermanently() "Don't show again" — permanently suppresses the nudge
 *
 * Trigger conditions (ALL must be true for shouldShow = true):
 *   1. User is a Guest (authStore.user === null)
 *   2. localStreak >= 3
 *   3. nudge_dismissed_permanently !== '1'
 *   4. One of:
 *      a. Never dismissed (nudge_last_dismissed_at not set), OR
 *      b. More than 3 days since last dismissal, OR
 *      c. Streak has grown by 7+ since last dismissal
 *
 * All errors are caught silently; shouldShow defaults to false on error.
 *
 * Requirements: 21.1–21.8
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useStreakStore, getTodayString } from '../store/streakStore';
import { openUserDb } from '../db/client';
import { getSetting, setSetting } from '../db/queries';

// ── Settings keys ─────────────────────────────────────────────────────────────

const KEY_DISMISSED_PERMANENTLY = 'nudge_dismissed_permanently';
const KEY_LAST_DISMISSED_AT = 'nudge_last_dismissed_at';
const KEY_STREAK_AT_LAST_DISMISSAL = 'nudge_streak_at_last_dismissal';

// ── Date helper ───────────────────────────────────────────────────────────────

/**
 * Returns the number of calendar days between two 'YYYY-MM-DD' strings.
 * Returns a positive number when `later` is after `earlier`.
 */
function daysBetween(earlier: string, later: string): number {
  const msPerDay = 86400000;
  const earlierMs = new Date(earlier).getTime();
  const laterMs = new Date(later).getTime();
  return Math.floor((laterMs - earlierMs) / msPerDay);
}

// ── Hook interface ────────────────────────────────────────────────────────────

export interface StreakNudgeState {
  shouldShow: boolean;
  dismiss: () => void;
  dismissPermanently: () => void;
}

// ── Hook implementation ───────────────────────────────────────────────────────

/**
 * Evaluates whether the StreakNudgeModal should be shown to the current user,
 * and provides dismiss actions that update SQLite settings.
 */
export function useStreakNudge(): StreakNudgeState {
  const user = useAuthStore((state) => state.user);
  const currentStreak = useStreakStore((state) => state.currentStreak);

  const [shouldShow, setShouldShow] = useState(false);

  // ── Evaluate trigger conditions on mount ──────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function evaluate() {
      try {
        // Condition 1: must be a Guest User
        if (user !== null) {
          return;
        }

        // Condition 2: streak must be >= 3
        if (currentStreak < 3) {
          return;
        }

        const db = openUserDb();

        // Condition 3: not permanently dismissed
        const permanentlyDismissed = await getSetting(db, KEY_DISMISSED_PERMANENTLY);
        if (permanentlyDismissed === '1') {
          return;
        }

        // Condition 4: cooldown / re-trigger check
        const lastDismissedAt = await getSetting(db, KEY_LAST_DISMISSED_AT);

        if (lastDismissedAt !== null) {
          const today = getTodayString();
          const daysSinceDismissal = daysBetween(lastDismissedAt, today);

          // Still within 3-day cooldown — check if streak grew by 7+
          if (daysSinceDismissal <= 3) {
            const streakAtDismissalRaw = await getSetting(db, KEY_STREAK_AT_LAST_DISMISSAL);
            const streakAtDismissal = streakAtDismissalRaw !== null
              ? parseInt(streakAtDismissalRaw, 10)
              : 0;

            const streakGrowth = currentStreak - streakAtDismissal;
            if (streakGrowth < 7) {
              // Neither cooldown expired nor streak grew enough — don't show
              return;
            }
          }
          // else: more than 3 days have passed — show the nudge
        }
        // else: never dismissed — show the nudge

        if (!cancelled) {
          setShouldShow(true);
        }
      } catch {
        // Silently ignore all errors — shouldShow stays false
      }
    }

    void evaluate();

    return () => {
      cancelled = true;
    };
  }, [user, currentStreak]);

  // ── dismiss() — "Maybe Later" ─────────────────────────────────────────────

  const dismiss = useCallback(() => {
    setShouldShow(false);

    // Persist dismissal data asynchronously; errors are silently ignored
    void (async () => {
      try {
        const db = openUserDb();
        const today = getTodayString();
        await setSetting(db, KEY_LAST_DISMISSED_AT, today);
        await setSetting(db, KEY_STREAK_AT_LAST_DISMISSAL, String(currentStreak));
      } catch {
        // Silently ignore
      }
    })();
  }, [currentStreak]);

  // ── dismissPermanently() — "Don't show again" ─────────────────────────────

  const dismissPermanently = useCallback(() => {
    setShouldShow(false);

    // Persist permanent dismissal asynchronously; errors are silently ignored
    void (async () => {
      try {
        const db = openUserDb();
        await setSetting(db, KEY_DISMISSED_PERMANENTLY, '1');
      } catch {
        // Silently ignore
      }
    })();
  }, []);

  return { shouldShow, dismiss, dismissPermanently };
}
