/**
 * Streak store — tracks the user's daily check-in streak, longest streak,
 * check-in status for today, and earned milestone badges.
 *
 * State:
 *   - currentStreak    Number of consecutive days checked in
 *   - lastCheckin      Date of last check-in as 'YYYY-MM-DD', or null
 *   - longestStreak    All-time highest streak value
 *   - checkedInToday   True if the user has already checked in today
 *   - badges           Array of earned milestone badges (7, 30, 100 days)
 *   - source           Whether state came from 'local' SQLite or 'firestore'
 *
 * Actions:
 *   - checkIn()                    Idempotent daily check-in; increments or resets streak
 *   - hydrate(data, badges, src?)  Replaces all state from loaded data
 *   - subscribeToFirestore(uid)    Subscribes to Firestore snapshot; returns unsubscribe fn
 *
 * Persistence:
 *   NOT persisted via zustand middleware. SQLite is the persistence layer for
 *   guests; Firestore for authenticated users.
 *   A module-level `userDb` reference is injected via `setStreakUserDb(db)`.
 *
 * Requirements: 14.1, 14.3, 14.4, 14.6, 14.8, 14.9, 14.10
 */

import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';
import { upsertStreak, upsertBadge } from '../db/queries';
import type { Badge, StreakData } from '../types/user';

// ── DB injection ──────────────────────────────────────────────────────────────

/**
 * Module-level reference to the user SQLite database.
 * Injected at app start via `setStreakUserDb`. If null, DB writes are skipped.
 */
let userDb: SQLite.SQLiteDatabase | null = null;

/**
 * Injects the SQLite database instance used for persisting streak data.
 * Call this once during app initialisation before any store actions are used.
 */
export function setStreakUserDb(db: SQLite.SQLiteDatabase): void {
  userDb = db;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Returns today's date as a 'YYYY-MM-DD' string.
 * Exported so tests can spy on it to control the current date.
 */
export function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns yesterday's date as a 'YYYY-MM-DD' string.
 */
export function getYesterdayString(): string {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
}

// ── Badge milestones ──────────────────────────────────────────────────────────

const BADGE_MILESTONES: Array<7 | 30 | 100> = [7, 30, 100];

// ── State & actions interface ─────────────────────────────────────────────────

export interface StreakState {
  currentStreak: number;
  /** Date of last check-in as 'YYYY-MM-DD', or null if never checked in. */
  lastCheckin: string | null;
  longestStreak: number;
  /** True if the user has already checked in today. */
  checkedInToday: boolean;
  badges: Badge[];
  source: 'local' | 'firestore';

  /**
   * Records a daily check-in.
   *
   * Idempotent: if `lastCheckin === today`, this is a no-op.
   * - If `lastCheckin` was yesterday → increment streak by 1
   * - Otherwise (missed a day or first check-in) → reset streak to 1
   *
   * After updating the streak, checks badge milestones (7, 30, 100) and
   * awards any newly reached badges. Persists to SQLite if a DB is injected.
   */
  checkIn: () => void;

  /**
   * Replaces all state fields from the provided data.
   * `source` defaults to `'local'` if not provided.
   * Sets `checkedInToday` based on whether `data.lastCheckin === today`.
   */
  hydrate: (data: StreakData, badges: Badge[], source?: 'local' | 'firestore') => void;

  /**
   * Sets up a Firestore `onSnapshot` listener on `/users/{uid}/streak/data`.
   * Updates the store from each snapshot and sets `source = 'firestore'`.
   * Returns the unsubscribe function.
   * If Firebase is not initialised, returns a no-op function.
   */
  subscribeToFirestore: (uid: string) => () => void;
}

// ── Initial state ─────────────────────────────────────────────────────────────

const INITIAL_STATE = {
  currentStreak: 0,
  lastCheckin: null as string | null,
  longestStreak: 0,
  checkedInToday: false,
  badges: [] as Badge[],
  source: 'local' as 'local' | 'firestore',
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useStreakStore = create<StreakState>()((set, get) => ({
  // ── Initial state ────────────────────────────────────────────────────────
  ...INITIAL_STATE,

  // ── Actions ──────────────────────────────────────────────────────────────

  checkIn: () => {
    const today = getTodayString();
    const yesterday = getYesterdayString();
    const { lastCheckin, currentStreak, longestStreak, badges } = get();

    // Idempotent: already checked in today
    if (lastCheckin === today) {
      return;
    }

    // Calculate new streak
    let newStreak: number;
    if (lastCheckin === yesterday) {
      // Consecutive day — extend streak
      newStreak = currentStreak + 1;
    } else {
      // Missed a day or first check-in — reset to 1
      newStreak = 1;
    }

    const newLongest = Math.max(longestStreak, newStreak);

    // Check for newly earned milestone badges
    const newBadges: Badge[] = [...badges];
    const earnedMilestones = new Set(badges.map((b) => b.milestone));

    for (const milestone of BADGE_MILESTONES) {
      if (newStreak >= milestone && !earnedMilestones.has(milestone)) {
        const badge: Badge = {
          milestone,
          earnedAt: Date.now(),
          rewardClaimed: false,
        };
        newBadges.push(badge);

        // Persist badge to SQLite if DB is available
        if (userDb !== null) {
          upsertBadge(userDb, badge).catch(() => {
            // Silently ignore DB errors
          });
        }
      }
    }

    // Update state
    set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCheckin: today,
      checkedInToday: true,
      badges: newBadges,
    });

    // Persist streak to SQLite if DB is available
    if (userDb !== null) {
      upsertStreak(userDb, {
        currentStreak: newStreak,
        lastCheckin: today,
        longestStreak: newLongest,
      }).catch(() => {
        // Silently ignore DB errors
      });
    }
  },

  hydrate: (data: StreakData, badges: Badge[], source?: 'local' | 'firestore') => {
    const today = getTodayString();
    set({
      currentStreak: data.currentStreak,
      lastCheckin: data.lastCheckin,
      longestStreak: data.longestStreak,
      checkedInToday: data.lastCheckin === today,
      badges,
      source: source ?? 'local',
    });
  },

  subscribeToFirestore: (uid: string) => {
    try {
      // Dynamic import to avoid crashing when Firebase is not configured
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getFirestore, doc, onSnapshot } = require('firebase/firestore');

      const db = getFirestore();
      const docRef = doc(db, 'users', uid, 'streak', 'data');

      const unsubscribe = onSnapshot(
        docRef,
        (snapshot: { exists: () => boolean; data: () => Record<string, unknown> }) => {
          if (!snapshot.exists()) return;

          const data = snapshot.data();
          const today = getTodayString();

          set({
            currentStreak: (data.currentStreak as number) ?? 0,
            longestStreak: (data.longestStreak as number) ?? 0,
            lastCheckin: (data.lastCheckin as string | null) ?? null,
            checkedInToday: data.lastCheckin === today,
            source: 'firestore',
          });
        },
      );

      return unsubscribe as () => void;
    } catch {
      // Firebase not initialised or not available — return no-op
      return () => {};
    }
  },
}));
