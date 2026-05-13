/**
 * Session store — tracks the state of an active guided dhikr session.
 *
 * State:
 *   - categoryId     The category the session belongs to (null when idle)
 *   - dhikrIds       Ordered list of dhikr IDs for the session
 *   - currentIndex   Index into dhikrIds pointing at the active dhikr
 *   - count          Current repetition count for the active dhikr
 *   - isComplete     True when the user has finished all dhikr in the session
 *
 * Actions:
 *   - startSession(categoryId, dhikrIds)  Initialise a new session
 *   - increment()                         Increment the repetition count by 1
 *   - resetCount()                        Reset the repetition count to 0
 *   - advance()                           Move to the next dhikr, or mark complete
 *   - exitSession()                       Discard the session and reset all state
 *
 * Persistence:
 *   NOT persisted — session state is ephemeral and discarded on exit.
 *   No zustand persist middleware is used.
 *
 * Requirements: 4.2, 4.4, 4.5, 4.6
 */

import { create } from 'zustand';

// ── State & actions interface ─────────────────────────────────────────────────

export interface SessionState {
  categoryId: number | null;
  /** Ordered list of dhikr IDs for the current session. */
  dhikrIds: number[];
  /** Index into dhikrIds pointing at the currently active dhikr. */
  currentIndex: number;
  /** Repetition count for the currently active dhikr. */
  count: number;
  /** True when all dhikr in the session have been completed. */
  isComplete: boolean;

  /**
   * Initialise a new session for the given category and ordered dhikr list.
   * Resets count, currentIndex, and isComplete to their initial values.
   */
  startSession: (categoryId: number, dhikrIds: number[]) => void;

  /**
   * Increment the repetition count for the current dhikr by 1.
   */
  increment: () => void;

  /**
   * Reset the repetition count for the current dhikr to 0.
   */
  resetCount: () => void;

  /**
   * Advance to the next dhikr in the session.
   * - If there is a next dhikr (currentIndex + 1 < dhikrIds.length):
   *     sets currentIndex = currentIndex + 1 and count = 0
   * - Otherwise (last dhikr reached):
   *     sets isComplete = true
   */
  advance: () => void;

  /**
   * Exit the session and reset all state back to initial values.
   * The session is not persisted — this is a full in-memory reset.
   */
  exitSession: () => void;
}

// ── Initial state ─────────────────────────────────────────────────────────────

const INITIAL_STATE = {
  categoryId: null as number | null,
  dhikrIds: [] as number[],
  currentIndex: 0,
  count: 0,
  isComplete: false,
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSessionStore = create<SessionState>()((set, get) => ({
  // ── Initial state ────────────────────────────────────────────────────────
  ...INITIAL_STATE,

  // ── Actions ──────────────────────────────────────────────────────────────

  startSession: (categoryId: number, dhikrIds: number[]) => {
    set({
      categoryId,
      dhikrIds,
      currentIndex: 0,
      count: 0,
      isComplete: false,
    });
  },

  increment: () => {
    set((state) => ({ count: state.count + 1 }));
  },

  resetCount: () => {
    set({ count: 0 });
  },

  advance: () => {
    const { currentIndex, dhikrIds } = get();
    if (currentIndex + 1 < dhikrIds.length) {
      set({ currentIndex: currentIndex + 1, count: 0 });
    } else {
      set({ isComplete: true });
    }
  },

  exitSession: () => {
    set({ ...INITIAL_STATE });
  },
}));
