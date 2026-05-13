/**
 * Unit tests for src/store/sessionStore.ts
 *
 * Covers:
 *   - Default state values
 *   - startSession: initialises session with correct values
 *   - increment: increments count by 1
 *   - resetCount: resets count to 0
 *   - advance: moves to next dhikr and resets count
 *   - advance: sets isComplete when on the last dhikr
 *   - exitSession: resets all state to initial values
 *
 * Requirements: 4.2, 4.4, 4.5, 4.6
 */

import { act } from 'react';
import { useSessionStore } from '../../src/store/sessionStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Shorthand to read the current store state without subscribing. */
const getState = () => useSessionStore.getState();

/** Reset the store to its initial defaults before each test. */
beforeEach(() => {
  act(() => {
    useSessionStore.setState({
      categoryId: null,
      dhikrIds: [],
      currentIndex: 0,
      count: 0,
      isComplete: false,
    });
  });
});

// ── Default state ─────────────────────────────────────────────────────────────

describe('default state', () => {
  it('has categoryId null', () => {
    expect(getState().categoryId).toBeNull();
  });

  it('has dhikrIds as empty array', () => {
    expect(getState().dhikrIds).toEqual([]);
  });

  it('has currentIndex 0', () => {
    expect(getState().currentIndex).toBe(0);
  });

  it('has count 0', () => {
    expect(getState().count).toBe(0);
  });

  it('has isComplete false', () => {
    expect(getState().isComplete).toBe(false);
  });
});

// ── startSession ──────────────────────────────────────────────────────────────

describe('startSession', () => {
  it('sets categoryId and dhikrIds', () => {
    act(() => {
      getState().startSession(5, [10, 20, 30]);
    });
    expect(getState().categoryId).toBe(5);
    expect(getState().dhikrIds).toEqual([10, 20, 30]);
  });

  it('resets currentIndex to 0', () => {
    act(() => {
      useSessionStore.setState({ currentIndex: 2 });
    });
    act(() => {
      getState().startSession(1, [1, 2, 3]);
    });
    expect(getState().currentIndex).toBe(0);
  });

  it('resets count to 0', () => {
    act(() => {
      useSessionStore.setState({ count: 7 });
    });
    act(() => {
      getState().startSession(1, [1, 2, 3]);
    });
    expect(getState().count).toBe(0);
  });

  it('resets isComplete to false', () => {
    act(() => {
      useSessionStore.setState({ isComplete: true });
    });
    act(() => {
      getState().startSession(1, [1, 2, 3]);
    });
    expect(getState().isComplete).toBe(false);
  });

  it('can start a session with a single dhikr', () => {
    act(() => {
      getState().startSession(3, [42]);
    });
    expect(getState().dhikrIds).toEqual([42]);
    expect(getState().currentIndex).toBe(0);
  });
});

// ── increment ─────────────────────────────────────────────────────────────────

describe('increment', () => {
  it('increments count from 0 to 1', () => {
    act(() => {
      getState().increment();
    });
    expect(getState().count).toBe(1);
  });

  it('increments count multiple times', () => {
    act(() => {
      getState().increment();
      getState().increment();
      getState().increment();
    });
    expect(getState().count).toBe(3);
  });

  it('does not affect other state fields', () => {
    act(() => {
      getState().startSession(1, [10, 20]);
    });
    act(() => {
      getState().increment();
    });
    expect(getState().categoryId).toBe(1);
    expect(getState().currentIndex).toBe(0);
    expect(getState().isComplete).toBe(false);
  });
});

// ── resetCount ────────────────────────────────────────────────────────────────

describe('resetCount', () => {
  it('resets count to 0 from a non-zero value', () => {
    act(() => {
      useSessionStore.setState({ count: 5 });
    });
    act(() => {
      getState().resetCount();
    });
    expect(getState().count).toBe(0);
  });

  it('is a no-op when count is already 0', () => {
    act(() => {
      getState().resetCount();
    });
    expect(getState().count).toBe(0);
  });

  it('does not affect other state fields', () => {
    act(() => {
      getState().startSession(2, [5, 6]);
      getState().increment();
      getState().increment();
    });
    act(() => {
      getState().resetCount();
    });
    expect(getState().categoryId).toBe(2);
    expect(getState().currentIndex).toBe(0);
    expect(getState().isComplete).toBe(false);
    expect(getState().count).toBe(0);
  });
});

// ── advance ───────────────────────────────────────────────────────────────────

describe('advance', () => {
  it('moves to the next dhikr and resets count', () => {
    act(() => {
      getState().startSession(1, [10, 20, 30]);
      getState().increment();
      getState().increment();
    });
    act(() => {
      getState().advance();
    });
    expect(getState().currentIndex).toBe(1);
    expect(getState().count).toBe(0);
    expect(getState().isComplete).toBe(false);
  });

  it('advances through all dhikr in sequence', () => {
    act(() => {
      getState().startSession(1, [10, 20, 30]);
    });

    act(() => {
      getState().advance();
    });
    expect(getState().currentIndex).toBe(1);

    act(() => {
      getState().advance();
    });
    expect(getState().currentIndex).toBe(2);
  });

  it('sets isComplete when advancing past the last dhikr', () => {
    act(() => {
      getState().startSession(1, [10, 20]);
    });
    // Advance to index 1 (last)
    act(() => {
      getState().advance();
    });
    expect(getState().currentIndex).toBe(1);
    expect(getState().isComplete).toBe(false);

    // Advance past the last dhikr
    act(() => {
      getState().advance();
    });
    expect(getState().isComplete).toBe(true);
  });

  it('sets isComplete when advancing past the only dhikr in the session', () => {
    act(() => {
      getState().startSession(1, [42]);
    });
    act(() => {
      getState().advance();
    });
    expect(getState().isComplete).toBe(true);
  });

  it('does not change currentIndex when setting isComplete', () => {
    act(() => {
      getState().startSession(1, [10]);
    });
    act(() => {
      getState().advance();
    });
    // currentIndex stays at 0 (last valid index), isComplete becomes true
    expect(getState().currentIndex).toBe(0);
    expect(getState().isComplete).toBe(true);
  });

  it('resets count to 0 when advancing to next dhikr', () => {
    act(() => {
      getState().startSession(1, [10, 20]);
      getState().increment();
      getState().increment();
      getState().increment();
    });
    act(() => {
      getState().advance();
    });
    expect(getState().count).toBe(0);
  });
});

// ── exitSession ───────────────────────────────────────────────────────────────

describe('exitSession', () => {
  it('resets categoryId to null', () => {
    act(() => {
      getState().startSession(5, [1, 2, 3]);
    });
    act(() => {
      getState().exitSession();
    });
    expect(getState().categoryId).toBeNull();
  });

  it('resets dhikrIds to empty array', () => {
    act(() => {
      getState().startSession(5, [1, 2, 3]);
    });
    act(() => {
      getState().exitSession();
    });
    expect(getState().dhikrIds).toEqual([]);
  });

  it('resets currentIndex to 0', () => {
    act(() => {
      getState().startSession(1, [10, 20, 30]);
      getState().advance();
      getState().advance();
    });
    act(() => {
      getState().exitSession();
    });
    expect(getState().currentIndex).toBe(0);
  });

  it('resets count to 0', () => {
    act(() => {
      getState().startSession(1, [10]);
      getState().increment();
      getState().increment();
    });
    act(() => {
      getState().exitSession();
    });
    expect(getState().count).toBe(0);
  });

  it('resets isComplete to false', () => {
    act(() => {
      getState().startSession(1, [10]);
      getState().advance(); // sets isComplete = true
    });
    act(() => {
      getState().exitSession();
    });
    expect(getState().isComplete).toBe(false);
  });

  it('resets all state fields to initial values at once', () => {
    act(() => {
      getState().startSession(7, [1, 2, 3]);
      getState().increment();
      getState().increment();
      getState().advance();
    });
    act(() => {
      getState().exitSession();
    });
    const state = getState();
    expect(state.categoryId).toBeNull();
    expect(state.dhikrIds).toEqual([]);
    expect(state.currentIndex).toBe(0);
    expect(state.count).toBe(0);
    expect(state.isComplete).toBe(false);
  });

  it('preserves action functions after exitSession', () => {
    act(() => {
      getState().exitSession();
    });
    const state = getState();
    expect(typeof state.startSession).toBe('function');
    expect(typeof state.increment).toBe('function');
    expect(typeof state.resetCount).toBe('function');
    expect(typeof state.advance).toBe('function');
    expect(typeof state.exitSession).toBe('function');
  });
});
