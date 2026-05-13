/**
 * Unit tests for src/store/streakStore.ts
 *
 * Covers:
 *   - Default state
 *   - checkIn: increments streak on a new day
 *   - checkIn: idempotent — no-op when called twice on the same day
 *   - checkIn: resets streak to 1 when a day is missed
 *   - checkIn: updates longestStreak correctly
 *   - checkIn: awards milestone badge at 7, 30, and 100 days
 *   - checkIn: does not award a badge twice for the same milestone
 *   - hydrate: sets all state fields from provided data
 *   - hydrate: sets checkedInToday correctly based on lastCheckin vs today
 *   - subscribeToFirestore: updates store from snapshot and sets source = 'firestore'
 *   - DB writes are skipped gracefully when no DB is injected
 *
 * Requirements: 14.1, 14.3, 14.4, 14.6, 14.8, 14.9, 14.10
 */

// Mock expo-sqlite so no real DB is needed
jest.mock('expo-sqlite', () => ({}));

// Mock src/db/queries — upsertStreak and upsertBadge as jest.fn()
jest.mock('../../src/db/queries', () => ({
  upsertStreak: jest.fn().mockResolvedValue(undefined),
  upsertBadge: jest.fn().mockResolvedValue(undefined),
}));

// Mock firebase/firestore
const mockOnSnapshot = jest.fn();
const mockDoc = jest.fn();
const mockGetFirestore = jest.fn();

jest.mock('firebase/firestore', () => ({
  onSnapshot: mockOnSnapshot,
  doc: mockDoc,
  getFirestore: mockGetFirestore,
}));

import { act } from 'react';
import {
  useStreakStore,
  setStreakUserDb,
  getTodayString,
  getYesterdayString,
} from '../../src/store/streakStore';
import { upsertStreak, upsertBadge } from '../../src/db/queries';
import type { Badge, StreakData } from '../../src/types/user';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Shorthand to read the current store state without subscribing. */
const getState = () => useStreakStore.getState();

/** Reset the store to its initial defaults before each test. */
beforeEach(() => {
  act(() => {
    useStreakStore.setState({
      currentStreak: 0,
      lastCheckin: null,
      longestStreak: 0,
      checkedInToday: false,
      badges: [],
      source: 'local',
    });
  });
  // Reset the injected DB to null so tests start without a DB by default
  setStreakUserDb(null as unknown as import('expo-sqlite').SQLiteDatabase);
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

// ── Default state ─────────────────────────────────────────────────────────────

describe('default state', () => {
  it('has correct initial values', () => {
    const state = getState();
    expect(state.currentStreak).toBe(0);
    expect(state.lastCheckin).toBeNull();
    expect(state.longestStreak).toBe(0);
    expect(state.checkedInToday).toBe(false);
    expect(state.badges).toEqual([]);
    expect(state.source).toBe('local');
  });
});

// ── checkIn — basic increment ─────────────────────────────────────────────────

describe('checkIn — streak increment', () => {
  it('increments streak from 0 to 1 on first check-in', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    act(() => {
      getState().checkIn();
    });

    expect(getState().currentStreak).toBe(1);
    expect(getState().lastCheckin).toBe('2024-01-10');
    expect(getState().checkedInToday).toBe(true);
  });

  it('increments streak by 1 when checking in on consecutive days', () => {
    jest.useFakeTimers();

    // Day 1: check in on Jan 9
    jest.setSystemTime(new Date('2024-01-09'));
    act(() => {
      useStreakStore.setState({ currentStreak: 0, lastCheckin: null, longestStreak: 0 });
      getState().checkIn();
    });
    expect(getState().currentStreak).toBe(1);

    // Day 2: check in on Jan 10 (consecutive)
    jest.setSystemTime(new Date('2024-01-10'));
    act(() => {
      getState().checkIn();
    });
    expect(getState().currentStreak).toBe(2);
    expect(getState().lastCheckin).toBe('2024-01-10');
    expect(getState().checkedInToday).toBe(true);
  });

  it('increments streak when lastCheckin is yesterday', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    act(() => {
      useStreakStore.setState({
        currentStreak: 5,
        lastCheckin: '2024-01-09', // yesterday
        longestStreak: 5,
      });
      getState().checkIn();
    });

    expect(getState().currentStreak).toBe(6);
    expect(getState().lastCheckin).toBe('2024-01-10');
  });

  it('updates longestStreak when currentStreak exceeds it', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    act(() => {
      useStreakStore.setState({
        currentStreak: 10,
        lastCheckin: '2024-01-09',
        longestStreak: 10,
      });
      getState().checkIn();
    });

    expect(getState().currentStreak).toBe(11);
    expect(getState().longestStreak).toBe(11);
  });

  it('does not decrease longestStreak when currentStreak is lower', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    act(() => {
      useStreakStore.setState({
        currentStreak: 3,
        lastCheckin: '2024-01-09',
        longestStreak: 20, // already higher
      });
      getState().checkIn();
    });

    expect(getState().currentStreak).toBe(4);
    expect(getState().longestStreak).toBe(20); // unchanged
  });
});

// ── checkIn — idempotent ──────────────────────────────────────────────────────

describe('checkIn — idempotent same day', () => {
  it('is a no-op when called twice on the same day', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    act(() => {
      useStreakStore.setState({
        currentStreak: 3,
        lastCheckin: '2024-01-09',
        longestStreak: 3,
      });
      getState().checkIn(); // first call — should increment to 4
    });

    expect(getState().currentStreak).toBe(4);

    act(() => {
      getState().checkIn(); // second call — should be no-op
    });

    expect(getState().currentStreak).toBe(4);
    expect(getState().lastCheckin).toBe('2024-01-10');
  });

  it('does not call upsertStreak on the second same-day check-in', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    const fakeDb = {} as import('expo-sqlite').SQLiteDatabase;
    setStreakUserDb(fakeDb);

    act(() => {
      useStreakStore.setState({
        currentStreak: 1,
        lastCheckin: '2024-01-09',
        longestStreak: 1,
      });
      getState().checkIn(); // first call
    });

    const callsAfterFirst = (upsertStreak as jest.Mock).mock.calls.length;

    act(() => {
      getState().checkIn(); // second call — no-op
    });

    // No additional calls after the second check-in
    expect((upsertStreak as jest.Mock).mock.calls.length).toBe(callsAfterFirst);
  });

  it('is a no-op when lastCheckin is already today', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    act(() => {
      useStreakStore.setState({
        currentStreak: 5,
        lastCheckin: '2024-01-10', // already today
        longestStreak: 5,
        checkedInToday: true,
      });
      getState().checkIn();
    });

    expect(getState().currentStreak).toBe(5); // unchanged
    expect(getState().checkedInToday).toBe(true);
  });
});

// ── checkIn — missed day resets streak ───────────────────────────────────────

describe('checkIn — missed day resets streak', () => {
  it('resets streak to 1 when a day was missed', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    act(() => {
      useStreakStore.setState({
        currentStreak: 5,
        lastCheckin: '2024-01-08', // two days ago — missed Jan 9
        longestStreak: 5,
      });
      getState().checkIn();
    });

    expect(getState().currentStreak).toBe(1);
    expect(getState().lastCheckin).toBe('2024-01-10');
    expect(getState().checkedInToday).toBe(true);
  });

  it('resets streak to 1 when lastCheckin is much older', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    act(() => {
      useStreakStore.setState({
        currentStreak: 30,
        lastCheckin: '2023-12-01', // weeks ago
        longestStreak: 30,
      });
      getState().checkIn();
    });

    expect(getState().currentStreak).toBe(1);
  });

  it('resets streak to 1 on first ever check-in (lastCheckin is null)', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    act(() => {
      useStreakStore.setState({
        currentStreak: 0,
        lastCheckin: null,
        longestStreak: 0,
      });
      getState().checkIn();
    });

    expect(getState().currentStreak).toBe(1);
  });

  it('preserves longestStreak when streak resets', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    act(() => {
      useStreakStore.setState({
        currentStreak: 5,
        lastCheckin: '2024-01-08', // missed a day
        longestStreak: 15,
      });
      getState().checkIn();
    });

    expect(getState().currentStreak).toBe(1);
    expect(getState().longestStreak).toBe(15); // preserved
  });
});

// ── checkIn — milestone badge at 7 days ──────────────────────────────────────

describe('checkIn — milestone badge at 7 days', () => {
  it('awards a badge when streak reaches 7', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    act(() => {
      useStreakStore.setState({
        currentStreak: 6,
        lastCheckin: '2024-01-09',
        longestStreak: 6,
        badges: [],
      });
      getState().checkIn();
    });

    const state = getState();
    expect(state.currentStreak).toBe(7);
    const badge7 = state.badges.find((b) => b.milestone === 7);
    expect(badge7).toBeDefined();
    expect(badge7?.rewardClaimed).toBe(false);
    expect(typeof badge7?.earnedAt).toBe('number');
  });

  it('does not award the 7-day badge twice', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    const existingBadge: Badge = { milestone: 7, earnedAt: 1000, rewardClaimed: false };

    act(() => {
      useStreakStore.setState({
        currentStreak: 6,
        lastCheckin: '2024-01-09',
        longestStreak: 6,
        badges: [existingBadge],
      });
      getState().checkIn();
    });

    const badges7 = getState().badges.filter((b) => b.milestone === 7);
    expect(badges7.length).toBe(1); // still only one
    expect(badges7[0].earnedAt).toBe(1000); // original badge unchanged
  });
});

// ── checkIn — milestone badge at 30 days ─────────────────────────────────────

describe('checkIn — milestone badge at 30 days', () => {
  it('awards a badge when streak reaches 30', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-02-10'));

    act(() => {
      useStreakStore.setState({
        currentStreak: 29,
        lastCheckin: '2024-02-09',
        longestStreak: 29,
        badges: [{ milestone: 7, earnedAt: 1000, rewardClaimed: false }],
      });
      getState().checkIn();
    });

    const state = getState();
    expect(state.currentStreak).toBe(30);
    const badge30 = state.badges.find((b) => b.milestone === 30);
    expect(badge30).toBeDefined();
    expect(badge30?.rewardClaimed).toBe(false);
  });

  it('does not award the 30-day badge twice', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-02-10'));

    const existing30: Badge = { milestone: 30, earnedAt: 2000, rewardClaimed: false };

    act(() => {
      useStreakStore.setState({
        currentStreak: 29,
        lastCheckin: '2024-02-09',
        longestStreak: 29,
        badges: [existing30],
      });
      getState().checkIn();
    });

    const badges30 = getState().badges.filter((b) => b.milestone === 30);
    expect(badges30.length).toBe(1);
    expect(badges30[0].earnedAt).toBe(2000);
  });
});

// ── checkIn — milestone badge at 100 days ────────────────────────────────────

describe('checkIn — milestone badge at 100 days', () => {
  it('awards a badge when streak reaches 100', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-04-20'));

    const existingBadges: Badge[] = [
      { milestone: 7, earnedAt: 1000, rewardClaimed: false },
      { milestone: 30, earnedAt: 2000, rewardClaimed: false },
    ];

    act(() => {
      useStreakStore.setState({
        currentStreak: 99,
        lastCheckin: '2024-04-19',
        longestStreak: 99,
        badges: existingBadges,
      });
      getState().checkIn();
    });

    const state = getState();
    expect(state.currentStreak).toBe(100);
    const badge100 = state.badges.find((b) => b.milestone === 100);
    expect(badge100).toBeDefined();
    expect(badge100?.rewardClaimed).toBe(false);
  });

  it('awards all three badges at once if streak jumps to 100 from 0', () => {
    // Edge case: if someone hydrates with streak=99 and no badges, then checks in
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-04-20'));

    act(() => {
      useStreakStore.setState({
        currentStreak: 99,
        lastCheckin: '2024-04-19',
        longestStreak: 99,
        badges: [], // no badges yet
      });
      getState().checkIn();
    });

    const state = getState();
    expect(state.currentStreak).toBe(100);
    expect(state.badges.length).toBe(3);
    expect(state.badges.find((b) => b.milestone === 7)).toBeDefined();
    expect(state.badges.find((b) => b.milestone === 30)).toBeDefined();
    expect(state.badges.find((b) => b.milestone === 100)).toBeDefined();
  });
});

// ── checkIn — SQLite persistence ─────────────────────────────────────────────

describe('checkIn — SQLite persistence', () => {
  it('calls upsertStreak with correct data when DB is injected', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    const fakeDb = {} as import('expo-sqlite').SQLiteDatabase;
    setStreakUserDb(fakeDb);

    act(() => {
      useStreakStore.setState({
        currentStreak: 4,
        lastCheckin: '2024-01-09',
        longestStreak: 4,
        badges: [],
      });
      getState().checkIn();
    });

    expect(upsertStreak).toHaveBeenCalledWith(fakeDb, {
      currentStreak: 5,
      lastCheckin: '2024-01-10',
      longestStreak: 5,
    });
  });

  it('calls upsertBadge when a milestone badge is earned and DB is injected', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    const fakeDb = {} as import('expo-sqlite').SQLiteDatabase;
    setStreakUserDb(fakeDb);

    act(() => {
      useStreakStore.setState({
        currentStreak: 6,
        lastCheckin: '2024-01-09',
        longestStreak: 6,
        badges: [],
      });
      getState().checkIn();
    });

    expect(upsertBadge).toHaveBeenCalledWith(
      fakeDb,
      expect.objectContaining({ milestone: 7, rewardClaimed: false }),
    );
  });

  it('does NOT call upsertStreak when no DB is injected', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    act(() => {
      useStreakStore.setState({
        currentStreak: 1,
        lastCheckin: '2024-01-09',
        longestStreak: 1,
      });
      getState().checkIn();
    });

    expect(upsertStreak).not.toHaveBeenCalled();
  });

  it('does NOT call upsertBadge when no DB is injected', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    act(() => {
      useStreakStore.setState({
        currentStreak: 6,
        lastCheckin: '2024-01-09',
        longestStreak: 6,
        badges: [],
      });
      getState().checkIn();
    });

    expect(upsertBadge).not.toHaveBeenCalled();
  });
});

// ── hydrate ───────────────────────────────────────────────────────────────────

describe('hydrate', () => {
  it('sets all state fields from provided data', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    const data: StreakData = {
      currentStreak: 5,
      lastCheckin: '2024-01-09',
      longestStreak: 10,
    };
    const badges: Badge[] = [{ milestone: 7, earnedAt: 1000, rewardClaimed: false }];

    act(() => {
      getState().hydrate(data, badges);
    });

    const state = getState();
    expect(state.currentStreak).toBe(5);
    expect(state.lastCheckin).toBe('2024-01-09');
    expect(state.longestStreak).toBe(10);
    expect(state.badges).toEqual(badges);
    expect(state.source).toBe('local');
  });

  it('sets checkedInToday = true when lastCheckin is today', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    const data: StreakData = {
      currentStreak: 3,
      lastCheckin: '2024-01-10', // today
      longestStreak: 3,
    };

    act(() => {
      getState().hydrate(data, []);
    });

    expect(getState().checkedInToday).toBe(true);
  });

  it('sets checkedInToday = false when lastCheckin is not today', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    const data: StreakData = {
      currentStreak: 3,
      lastCheckin: '2024-01-09', // yesterday
      longestStreak: 3,
    };

    act(() => {
      getState().hydrate(data, []);
    });

    expect(getState().checkedInToday).toBe(false);
  });

  it('sets checkedInToday = false when lastCheckin is null', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    const data: StreakData = {
      currentStreak: 0,
      lastCheckin: null,
      longestStreak: 0,
    };

    act(() => {
      getState().hydrate(data, []);
    });

    expect(getState().checkedInToday).toBe(false);
  });

  it('sets source to firestore when provided', () => {
    const data: StreakData = { currentStreak: 1, lastCheckin: null, longestStreak: 1 };

    act(() => {
      getState().hydrate(data, [], 'firestore');
    });

    expect(getState().source).toBe('firestore');
  });

  it('defaults source to local when not provided', () => {
    const data: StreakData = { currentStreak: 1, lastCheckin: null, longestStreak: 1 };

    act(() => {
      getState().hydrate(data, []);
    });

    expect(getState().source).toBe('local');
  });

  it('replaces existing state entirely', () => {
    act(() => {
      useStreakStore.setState({
        currentStreak: 99,
        lastCheckin: '2023-01-01',
        longestStreak: 99,
        checkedInToday: true,
        badges: [{ milestone: 7, earnedAt: 1000, rewardClaimed: false }],
        source: 'firestore',
      });
    });

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    const data: StreakData = { currentStreak: 2, lastCheckin: '2024-01-09', longestStreak: 5 };

    act(() => {
      getState().hydrate(data, []);
    });

    const state = getState();
    expect(state.currentStreak).toBe(2);
    expect(state.longestStreak).toBe(5);
    expect(state.badges).toEqual([]);
    expect(state.source).toBe('local');
    expect(state.checkedInToday).toBe(false);
  });
});

// ── subscribeToFirestore ──────────────────────────────────────────────────────

describe('subscribeToFirestore', () => {
  it('calls onSnapshot with the correct document reference', () => {
    const fakeDocRef = { id: 'data' };
    const fakeDb = { id: 'firestore-db' };
    mockGetFirestore.mockReturnValue(fakeDb);
    mockDoc.mockReturnValue(fakeDocRef);
    mockOnSnapshot.mockReturnValue(() => {});

    act(() => {
      getState().subscribeToFirestore('user123');
    });

    expect(mockGetFirestore).toHaveBeenCalled();
    expect(mockDoc).toHaveBeenCalledWith(fakeDb, 'users', 'user123', 'streak', 'data');
    expect(mockOnSnapshot).toHaveBeenCalledWith(fakeDocRef, expect.any(Function));
  });

  it('returns the unsubscribe function from onSnapshot', () => {
    const mockUnsubscribe = jest.fn();
    mockGetFirestore.mockReturnValue({});
    mockDoc.mockReturnValue({});
    mockOnSnapshot.mockReturnValue(mockUnsubscribe);

    let unsubscribe: (() => void) | undefined;
    act(() => {
      unsubscribe = getState().subscribeToFirestore('user123');
    });

    expect(unsubscribe).toBe(mockUnsubscribe);
  });

  it('updates store state from snapshot data and sets source = firestore', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    mockGetFirestore.mockReturnValue({});
    mockDoc.mockReturnValue({});

    let capturedCallback: ((snapshot: unknown) => void) | undefined;
    mockOnSnapshot.mockImplementation((_ref: unknown, cb: (snapshot: unknown) => void) => {
      capturedCallback = cb;
      return () => {};
    });

    act(() => {
      getState().subscribeToFirestore('user123');
    });

    // Simulate a Firestore snapshot arriving
    act(() => {
      capturedCallback!({
        exists: () => true,
        data: () => ({
          currentStreak: 8,
          longestStreak: 12,
          lastCheckin: '2024-01-09',
        }),
      });
    });

    const state = getState();
    expect(state.currentStreak).toBe(8);
    expect(state.longestStreak).toBe(12);
    expect(state.lastCheckin).toBe('2024-01-09');
    expect(state.checkedInToday).toBe(false); // lastCheckin is yesterday
    expect(state.source).toBe('firestore');
  });

  it('sets checkedInToday = true when snapshot lastCheckin is today', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10'));

    mockGetFirestore.mockReturnValue({});
    mockDoc.mockReturnValue({});

    let capturedCallback: ((snapshot: unknown) => void) | undefined;
    mockOnSnapshot.mockImplementation((_ref: unknown, cb: (snapshot: unknown) => void) => {
      capturedCallback = cb;
      return () => {};
    });

    act(() => {
      getState().subscribeToFirestore('user123');
    });

    act(() => {
      capturedCallback!({
        exists: () => true,
        data: () => ({
          currentStreak: 5,
          longestStreak: 5,
          lastCheckin: '2024-01-10', // today
        }),
      });
    });

    expect(getState().checkedInToday).toBe(true);
  });

  it('does nothing when snapshot does not exist', () => {
    mockGetFirestore.mockReturnValue({});
    mockDoc.mockReturnValue({});

    let capturedCallback: ((snapshot: unknown) => void) | undefined;
    mockOnSnapshot.mockImplementation((_ref: unknown, cb: (snapshot: unknown) => void) => {
      capturedCallback = cb;
      return () => {};
    });

    act(() => {
      useStreakStore.setState({ currentStreak: 5 });
      getState().subscribeToFirestore('user123');
    });

    act(() => {
      capturedCallback!({ exists: () => false, data: () => ({}) });
    });

    // State should be unchanged
    expect(getState().currentStreak).toBe(5);
  });

  it('returns a no-op function when Firebase throws during setup', () => {
    // Simulate Firebase not being initialised
    mockGetFirestore.mockImplementation(() => {
      throw new Error('Firebase not initialised');
    });

    let unsubscribe: (() => void) | undefined;
    act(() => {
      unsubscribe = getState().subscribeToFirestore('user123');
    });

    // Should not throw and should return a callable no-op
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe!()).not.toThrow();
  });
});
