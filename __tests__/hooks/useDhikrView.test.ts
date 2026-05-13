/**
 * Unit tests for src/hooks/useDhikrView.ts
 *
 * Covers:
 *   - Check-in recorded on first view (lastCheckin !== today)
 *   - No-op on same-day second view (lastCheckin === today)
 *   - Guest user writes to SQLite only (no Firestore call)
 *   - Authenticated user writes to both Firestore and SQLite
 *   - streakStore.checkIn() is called after a new check-in
 *   - streakStore.checkIn() is NOT called when already checked in today
 *   - Errors are caught silently — hook never throws
 *   - Firestore write failure does not prevent SQLite write or checkIn
 *   - SQLite write failure does not prevent checkIn
 *
 * Requirements: 14.1, 20.1, 20.2
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock getTodayString so we can control "today"
const mockGetTodayString = jest.fn(() => '2024-06-15');

jest.mock('../../src/store/streakStore', () => ({
  useStreakStore: (selector: (state: { lastCheckin: string | null; checkIn: () => void }) => unknown) =>
    selector({ lastCheckin: mockLastCheckin, checkIn: mockCheckIn }),
  getTodayString: () => mockGetTodayString(),
}));

// Mock authStore
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: (selector: (state: { user: { uid: string } | null }) => unknown) =>
    selector({ user: mockUser }),
}));

// Mock db/client
const mockOpenUserDb = jest.fn();
jest.mock('../../src/db/client', () => ({
  openUserDb: (...args: unknown[]) => mockOpenUserDb(...args),
}));

// Mock db/queries
const mockRecordCheckin = jest.fn();
jest.mock('../../src/db/queries', () => ({
  recordCheckin: (...args: unknown[]) => mockRecordCheckin(...args),
}));

// Mock firebase/firestore
const mockSetDoc = jest.fn();
const mockDoc = jest.fn();
const mockGetFirestore = jest.fn();
const mockServerTimestamp = jest.fn(() => ({ _type: 'serverTimestamp' }));

jest.mock('firebase/firestore', () => ({
  getFirestore: (...args: unknown[]) => mockGetFirestore(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { renderHook, waitFor } from '@testing-library/react-native';
import { useDhikrView } from '../../src/hooks/useDhikrView';

// ── Mutable test state ────────────────────────────────────────────────────────

let mockLastCheckin: string | null = null;
let mockUser: { uid: string } | null = null;
const mockCheckIn = jest.fn();
const fakeDb = {};
const fakeFirestoreDb = {};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockGetTodayString.mockReturnValue('2024-06-15');
  mockLastCheckin = null;
  mockUser = null;
  mockOpenUserDb.mockReturnValue(fakeDb);
  mockRecordCheckin.mockResolvedValue(undefined);
  mockGetFirestore.mockReturnValue(fakeFirestoreDb);
  mockDoc.mockReturnValue({ path: 'users/uid/checkins/2024-06-15' });
  mockSetDoc.mockResolvedValue(undefined);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useDhikrView — first view (check-in not yet recorded today)', () => {
  it('calls streakStore.checkIn() when lastCheckin is null', async () => {
    mockLastCheckin = null;

    renderHook(() => useDhikrView());

    await waitFor(() => {
      expect(mockCheckIn).toHaveBeenCalledTimes(1);
    });
  });

  it('calls streakStore.checkIn() when lastCheckin is a past date', async () => {
    mockLastCheckin = '2024-06-14'; // yesterday

    renderHook(() => useDhikrView());

    await waitFor(() => {
      expect(mockCheckIn).toHaveBeenCalledTimes(1);
    });
  });

  it('calls streakStore.checkIn() when lastCheckin is much older', async () => {
    mockLastCheckin = '2024-01-01';

    renderHook(() => useDhikrView());

    await waitFor(() => {
      expect(mockCheckIn).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useDhikrView — same-day no-op', () => {
  it('does NOT call streakStore.checkIn() when lastCheckin === today', async () => {
    mockLastCheckin = '2024-06-15'; // same as today

    renderHook(() => useDhikrView());

    // Give the effect time to run
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockCheckIn).not.toHaveBeenCalled();
  });

  it('does NOT call recordCheckin when lastCheckin === today', async () => {
    mockLastCheckin = '2024-06-15';

    renderHook(() => useDhikrView());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockRecordCheckin).not.toHaveBeenCalled();
  });

  it('does NOT call Firestore setDoc when lastCheckin === today', async () => {
    mockLastCheckin = '2024-06-15';
    mockUser = { uid: 'user-abc' };

    renderHook(() => useDhikrView());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});

describe('useDhikrView — guest user (user === null)', () => {
  beforeEach(() => {
    mockUser = null;
    mockLastCheckin = null; // not checked in today
  });

  it('calls recordCheckin with today and a timestamp', async () => {
    const before = Date.now();

    renderHook(() => useDhikrView());

    await waitFor(() => {
      expect(mockRecordCheckin).toHaveBeenCalledTimes(1);
    });

    const [db, date, timestamp] = mockRecordCheckin.mock.calls[0];
    expect(db).toBe(fakeDb);
    expect(date).toBe('2024-06-15');
    expect(typeof timestamp).toBe('number');
    expect(timestamp).toBeGreaterThanOrEqual(before);
  });

  it('does NOT call Firestore setDoc for a guest user', async () => {
    renderHook(() => useDhikrView());

    await waitFor(() => {
      expect(mockCheckIn).toHaveBeenCalledTimes(1);
    });

    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('does NOT call getFirestore for a guest user', async () => {
    renderHook(() => useDhikrView());

    await waitFor(() => {
      expect(mockCheckIn).toHaveBeenCalledTimes(1);
    });

    expect(mockGetFirestore).not.toHaveBeenCalled();
  });

  it('calls openUserDb to get the SQLite database', async () => {
    renderHook(() => useDhikrView());

    await waitFor(() => {
      expect(mockRecordCheckin).toHaveBeenCalledTimes(1);
    });

    expect(mockOpenUserDb).toHaveBeenCalledTimes(1);
  });
});

describe('useDhikrView — authenticated user', () => {
  beforeEach(() => {
    mockUser = { uid: 'user-abc-123' };
    mockLastCheckin = null; // not checked in today
  });

  it('calls Firestore setDoc with the correct path and serverTimestamp', async () => {
    const fakeDocRef = { path: 'users/user-abc-123/checkins/2024-06-15' };
    mockDoc.mockReturnValue(fakeDocRef);

    renderHook(() => useDhikrView());

    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });

    expect(mockGetFirestore).toHaveBeenCalled();
    expect(mockDoc).toHaveBeenCalledWith(
      fakeFirestoreDb,
      'users',
      'user-abc-123',
      'checkins',
      '2024-06-15',
    );
    expect(mockSetDoc).toHaveBeenCalledWith(
      fakeDocRef,
      expect.objectContaining({ date: '2024-06-15' }),
    );
  });

  it('calls recordCheckin to write to SQLite', async () => {
    renderHook(() => useDhikrView());

    await waitFor(() => {
      expect(mockRecordCheckin).toHaveBeenCalledTimes(1);
    });

    const [db, date] = mockRecordCheckin.mock.calls[0];
    expect(db).toBe(fakeDb);
    expect(date).toBe('2024-06-15');
  });

  it('calls streakStore.checkIn() after writing to both stores', async () => {
    renderHook(() => useDhikrView());

    await waitFor(() => {
      expect(mockCheckIn).toHaveBeenCalledTimes(1);
    });

    // Both writes should have happened before checkIn
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockRecordCheckin).toHaveBeenCalledTimes(1);
  });

  it('writes to SQLite and calls checkIn even when Firestore write fails', async () => {
    mockSetDoc.mockRejectedValue(new Error('Firestore unavailable'));

    renderHook(() => useDhikrView());

    await waitFor(() => {
      expect(mockCheckIn).toHaveBeenCalledTimes(1);
    });

    // SQLite write should still happen
    expect(mockRecordCheckin).toHaveBeenCalledTimes(1);
  });
});

describe('useDhikrView — error resilience', () => {
  it('calls checkIn even when SQLite recordCheckin throws (guest)', async () => {
    mockUser = null;
    mockLastCheckin = null;
    mockRecordCheckin.mockRejectedValue(new Error('SQLite error'));

    renderHook(() => useDhikrView());

    await waitFor(() => {
      expect(mockCheckIn).toHaveBeenCalledTimes(1);
    });
  });

  it('calls checkIn even when SQLite recordCheckin throws (authenticated)', async () => {
    mockUser = { uid: 'user-xyz' };
    mockLastCheckin = null;
    mockRecordCheckin.mockRejectedValue(new Error('SQLite error'));

    renderHook(() => useDhikrView());

    await waitFor(() => {
      expect(mockCheckIn).toHaveBeenCalledTimes(1);
    });
  });

  it('does not throw when openUserDb throws', async () => {
    mockUser = null;
    mockLastCheckin = null;
    mockOpenUserDb.mockImplementation(() => {
      throw new Error('Cannot open DB');
    });

    // Should not throw
    expect(() => renderHook(() => useDhikrView())).not.toThrow();

    // Give the effect time to run
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it('runs only once on mount (not on re-renders)', async () => {
    mockLastCheckin = null;

    const { rerender } = renderHook(() => useDhikrView());

    await waitFor(() => {
      expect(mockCheckIn).toHaveBeenCalledTimes(1);
    });

    // Re-render the hook — effect should NOT run again (empty deps)
    rerender({});
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockCheckIn).toHaveBeenCalledTimes(1);
  });
});
