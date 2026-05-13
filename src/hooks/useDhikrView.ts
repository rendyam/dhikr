/**
 * useDhikrView hook — records a daily check-in when the user views a dhikr.
 *
 * On mount, compares `streakStore.lastCheckin` to today's date ('YYYY-MM-DD').
 * If the user has not yet checked in today:
 *   - Guest (user === null): writes to SQLite `checkin_history` and calls
 *     `streakStore.checkIn()`.
 *   - Authenticated: writes to Firestore `/users/{uid}/checkins/{date}` with
 *     `serverTimestamp()`, writes to SQLite `checkin_history`, and calls
 *     `streakStore.checkIn()`.
 * If `lastCheckin === today`: no-op (idempotent).
 *
 * Errors are caught silently — the hook never throws or surfaces errors to
 * the caller. It is safe to call on every dhikr screen mount.
 *
 * Requirements: 14.1, 20.1, 20.2
 */

import { useEffect } from 'react';
import { useStreakStore, getTodayString } from '../store/streakStore';
import { useAuthStore } from '../store/authStore';
import { openUserDb } from '../db/client';
import { recordCheckin } from '../db/queries';

/**
 * Records a daily check-in when the user views a dhikr screen.
 *
 * Idempotent: safe to call on every mount. If the user has already checked
 * in today (streakStore.lastCheckin === today), this is a no-op.
 *
 * All errors are caught silently — the hook never throws.
 */
export function useDhikrView(): void {
  const lastCheckin = useStreakStore((state) => state.lastCheckin);
  const checkIn = useStreakStore((state) => state.checkIn);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const today = getTodayString();

    // Already checked in today — no-op
    if (lastCheckin === today) {
      return;
    }

    void (async () => {
      try {
        const timestamp = Date.now();

        if (user !== null) {
          // ── Authenticated: write to Firestore + SQLite ──────────────────
          try {
            // Dynamic require to avoid crashing when Firebase is not configured
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
            const firestoreDb = getFirestore();
            const checkinRef = doc(firestoreDb, 'users', user.uid, 'checkins', today);
            await setDoc(checkinRef, { date: today, checkedInAt: serverTimestamp() });
          } catch {
            // Firestore write failed — continue with SQLite write and checkIn
          }

          // Write to SQLite regardless of Firestore outcome
          try {
            const db = openUserDb();
            await recordCheckin(db, today, timestamp);
          } catch {
            // SQLite write failed — continue with checkIn
          }
        } else {
          // ── Guest: write to SQLite only ─────────────────────────────────
          try {
            const db = openUserDb();
            await recordCheckin(db, today, timestamp);
          } catch {
            // SQLite write failed — continue with checkIn
          }
        }

        // Update streak store — idempotent if called again
        checkIn();
      } catch {
        // Catch-all: hook must never throw
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
