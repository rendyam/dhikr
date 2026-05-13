/**
 * useRewardClaim hook — handles submission of a GoPay reward claim for an
 * authenticated user who has reached a streak milestone.
 *
 * Returns:
 *   - submitClaim(milestone, gopayNumber)  Validates input, verifies streak in
 *                                          Firestore, then writes to reward_claims
 *   - isSubmitting   True while the async submission is in progress
 *   - error          Non-null when the last submission attempt failed
 *   - isSubmitted    True after a successful submission
 *
 * submitClaim steps:
 *   1. Validate gopayNumber against /^(\+62|62|0)8[1-9][0-9]{6,10}$/
 *   2. Read /users/{uid}/streak/data from Firestore; verify currentStreak >= milestone
 *   3. Write to reward_claims collection with all required fields
 *   4. Set isSubmitted = true
 *
 * Firestore read failures are surfaced via an Alert (error toast) and set the
 * error state. Validation and streak-check failures set the error state only.
 *
 * Requirements: 18.1–18.10, 20.6
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';

// ── Validation ────────────────────────────────────────────────────────────────

/** Valid Indonesian mobile phone number formats accepted by GoPay. */
const GOPAY_NUMBER_REGEX = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;

/**
 * Returns true when `gopayNumber` matches the Indonesian mobile phone format
 * accepted by GoPay.
 */
export function isValidGopayNumber(gopayNumber: string): boolean {
  return GOPAY_NUMBER_REGEX.test(gopayNumber);
}

// ── Hook interface ────────────────────────────────────────────────────────────

export interface RewardClaimState {
  /** Submits a reward claim for the given milestone and GoPay number. */
  submitClaim: (milestone: number, gopayNumber: string) => Promise<void>;
  /** True while the submission is in progress. */
  isSubmitting: boolean;
  /** Non-null when the last submission attempt failed. */
  error: string | null;
  /** True after a successful submission. */
  isSubmitted: boolean;
}

// ── Hook implementation ───────────────────────────────────────────────────────

/**
 * Manages the lifecycle of a GoPay reward claim submission.
 *
 * The caller is responsible for ensuring the user is authenticated before
 * calling submitClaim. If user is null, submitClaim will set an error.
 */
export function useRewardClaim(): RewardClaimState {
  const user = useAuthStore((state) => state.user);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitClaim = useCallback(
    async (milestone: number, gopayNumber: string): Promise<void> => {
      // Reset error state before each attempt
      setError(null);

      // ── Step 1: Validate GoPay number ──────────────────────────────────────
      if (!isValidGopayNumber(gopayNumber)) {
        setError('Please enter a valid Indonesian mobile phone number (e.g. 08123456789).');
        return;
      }

      // ── Guard: user must be authenticated ─────────────────────────────────
      if (user === null) {
        setError('You must be signed in to submit a reward claim.');
        return;
      }

      setIsSubmitting(true);

      try {
        // Dynamic require to avoid crashing when Firebase is not configured
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const {
          getFirestore,
          doc,
          getDoc,
          addDoc,
          collection,
          serverTimestamp,
        } = require('firebase/firestore');

        const firestoreDb = getFirestore();

        // ── Step 2: Read streak doc and verify currentStreak >= milestone ──
        let currentStreak: number;
        try {
          const streakRef = doc(firestoreDb, 'users', user.uid, 'streak', 'data');
          const streakSnap = await getDoc(streakRef);

          if (!streakSnap.exists()) {
            const msg = 'Could not verify your streak. Please try again later.';
            setError(msg);
            Alert.alert('Error', msg);
            return;
          }

          currentStreak = (streakSnap.data() as { currentStreak: number }).currentStreak;
        } catch {
          const msg = 'Could not verify your streak. Please check your connection and try again.';
          setError(msg);
          Alert.alert('Error', msg);
          return;
        }

        if (currentStreak < milestone) {
          setError(
            `Your current streak (${currentStreak} days) does not meet the required milestone (${milestone} days).`,
          );
          return;
        }

        // ── Step 3: Write to reward_claims collection ──────────────────────
        const claimsRef = collection(firestoreDb, 'reward_claims');
        await addDoc(claimsRef, {
          userId: user.uid,
          displayName: user.displayName ?? '',
          email: user.email ?? '',
          gopayNumber,
          milestone,
          submittedAt: serverTimestamp(),
          status: 'pending',
        });

        // ── Step 4: Mark as submitted ──────────────────────────────────────
        setIsSubmitted(true);
      } catch {
        const msg = 'Failed to submit your claim. Please try again later.';
        setError(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [user],
  );

  return { submitClaim, isSubmitting, error, isSubmitted };
}
