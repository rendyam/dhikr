/**
 * Unit tests for src/hooks/useStreakNudge.ts
 *
 * Covers:
 *   - shouldShow is false for authenticated users (guard)
 *   - shouldShow is false when streak < 3 (threshold)
 *   - shouldShow is false when nudge_dismissed_permanently === '1'
 *   - shouldShow is true when never dismissed and streak >= 3 (Guest)
 *   - shouldShow is false within 3-day cooldown (streak growth < 7)
 *   - shouldShow is true when more than 3 days have passed since dismissal
 *   - shouldShow is true when streak grew by 7+ since last dismissal (re-trigger)
 *   - shouldShow is false when streak grew by < 7 within cooldown
 *   - dismiss() writes nudge_last_dismissed_at and nudge_streak_at_last_dismissal
 *   - dismiss() sets shouldShow to false immediately
 *   - dismissPermanently() writes nudge_dismissed_permanently = '1'
 *   - dismissPermanently() sets shouldShow to false immediately
 *   - Errors in evaluation are caught silently; shouldShow stays false
 *   - Errors in dismiss() are caught silently
 *   - Errors in dismissPermanently() are caught silently
 *
 * Requirements: 21.1–21.8
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Control "today" in tests via streakStore mock (same pattern as useDhikrView)
const mockGetTodayString = jest.fn(() => '2024-06-15');

// Mock authStore
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: (selector: (state: { user: { uid: string } | null }) => unknown) =>
    selector({ user: mockUser }),
}));

// Mock streakStore — also exposes getTodayString so the hook can use it
jest.mock('../../src/store/streakStore', () => ({
  useStreakStore: (selector: (state: { currentStreak: number }) => unknown) =>
    selector({ currentStreak: mockCurrentStreak }),
  getTodayString: () => mockGetTodayString(),
}));

// Mock db/client
const mockOpenUserDb = jest.fn();
jest.mock('../../src/db/client', () => ({
  openUserDb: (...args: unknown[]) => mockOpenUserDb(...args),
}));

// Mock db/queries
const mockGetSetting = jest.fn();
const mockSetSetting = jest.fn();
jest.mock('../../src/db/queries', () => ({
  getSetting: (...args: unknown[]) => mockGetSetting(...args),
  setSetting: (...args: unknown[]) => mockSetSetting(...args),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useStreakNudge } from '../../src/hooks/useStreakNudge';

// ── Mutable test state ────────────────────────────────────────────────────────

let mockUser: { uid: string } | null = null;
let mockCurrentStreak = 0;
const fakeDb = {};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Sets up getSetting mock to return specific nudge settings values.
 */
function setupSettings({
  permanentlyDismissed = null,
  lastDismissedAt = null,
  streakAtLastDismissal = null,
}: {
  permanentlyDismissed?: string | null;
  lastDismissedAt?: string | null;
  streakAtLastDismissal?: string | null;
} = {}) {
  mockGetSetting.mockImplementation((_db: unknown, key: string) => {
    if (key === 'nudge_dismissed_permanently') return Promise.resolve(permanentlyDismissed);
    if (key === 'nudge_last_dismissed_at') return Promise.resolve(lastDismissedAt);
    if (key === 'nudge_streak_at_last_dismissal') return Promise.resolve(streakAtLastDismissal);
    return Promise.resolve(null);
  });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockGetTodayString.mockReturnValue('2024-06-15');
  mockUser = null;
  mockCurrentStreak = 5; // default: Guest with streak >= 3
  mockOpenUserDb.mockReturnValue(fakeDb);
  mockSetSetting.mockResolvedValue(undefined);
  setupSettings(); // default: no dismissals
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useStreakNudge — authenticated user guard (Requirement 21.6)', () => {
  it('shouldShow is false when user is authenticated', async () => {
    mockUser = { uid: 'user-123' };
    mockCurrentStreak = 10;
    setupSettings();

    const { result } = renderHook(() => useStreakNudge());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.shouldShow).toBe(false);
  });

  it('does not open the DB when user is authenticated', async () => {
    mockUser = { uid: 'user-123' };
    mockCurrentStreak = 10;

    renderHook(() => useStreakNudge());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockOpenUserDb).not.toHaveBeenCalled();
  });
});

describe('useStreakNudge — streak threshold (Requirement 21.1)', () => {
  it('shouldShow is false when streak is 0', async () => {
    mockCurrentStreak = 0;
    setupSettings();

    const { result } = renderHook(() => useStreakNudge());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.shouldShow).toBe(false);
  });

  it('shouldShow is false when streak is 1', async () => {
    mockCurrentStreak = 1;
    setupSettings();

    const { result } = renderHook(() => useStreakNudge());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.shouldShow).toBe(false);
  });

  it('shouldShow is false when streak is 2', async () => {
    mockCurrentStreak = 2;
    setupSettings();

    const { result } = renderHook(() => useStreakNudge());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.shouldShow).toBe(false);
  });

  it('shouldShow is true when streak is exactly 3 (Guest, never dismissed)', async () => {
    mockCurrentStreak = 3;
    setupSettings();

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });
  });

  it('shouldShow is true when streak is greater than 3 (Guest, never dismissed)', async () => {
    mockCurrentStreak = 15;
    setupSettings();

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });
  });
});

describe('useStreakNudge — permanent dismissal (Requirement 21.7, 21.8)', () => {
  it('shouldShow is false when nudge_dismissed_permanently is "1"', async () => {
    mockCurrentStreak = 10;
    setupSettings({ permanentlyDismissed: '1' });

    const { result } = renderHook(() => useStreakNudge());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.shouldShow).toBe(false);
  });

  it('shouldShow is true when nudge_dismissed_permanently is "0"', async () => {
    mockCurrentStreak = 5;
    setupSettings({ permanentlyDismissed: '0' });

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });
  });

  it('shouldShow is true when nudge_dismissed_permanently is null (never set)', async () => {
    mockCurrentStreak = 5;
    setupSettings({ permanentlyDismissed: null });

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });
  });
});

describe('useStreakNudge — 3-day cooldown (Requirement 21.4)', () => {
  it('shouldShow is false when dismissed 0 days ago (same day)', async () => {
    mockCurrentStreak = 5;
    // Dismissed today, streak was 5 at dismissal → growth = 0 (< 7)
    setupSettings({
      lastDismissedAt: '2024-06-15', // same as today
      streakAtLastDismissal: '5',
    });

    const { result } = renderHook(() => useStreakNudge());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.shouldShow).toBe(false);
  });

  it('shouldShow is false when dismissed 1 day ago (within cooldown)', async () => {
    mockCurrentStreak = 6;
    setupSettings({
      lastDismissedAt: '2024-06-14', // 1 day ago
      streakAtLastDismissal: '5',    // growth = 1 (< 7)
    });

    const { result } = renderHook(() => useStreakNudge());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.shouldShow).toBe(false);
  });

  it('shouldShow is false when dismissed 2 days ago (within cooldown)', async () => {
    mockCurrentStreak = 7;
    setupSettings({
      lastDismissedAt: '2024-06-13', // 2 days ago
      streakAtLastDismissal: '6',    // growth = 1 (< 7)
    });

    const { result } = renderHook(() => useStreakNudge());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.shouldShow).toBe(false);
  });

  it('shouldShow is false when dismissed exactly 3 days ago (still in cooldown)', async () => {
    mockCurrentStreak = 8;
    setupSettings({
      lastDismissedAt: '2024-06-12', // 3 days ago
      streakAtLastDismissal: '7',    // growth = 1 (< 7)
    });

    const { result } = renderHook(() => useStreakNudge());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.shouldShow).toBe(false);
  });

  it('shouldShow is true when dismissed more than 3 days ago (cooldown expired)', async () => {
    mockCurrentStreak = 9;
    setupSettings({
      lastDismissedAt: '2024-06-11', // 4 days ago
      streakAtLastDismissal: '8',    // growth = 1 (< 7), but cooldown expired
    });

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });
  });

  it('shouldShow is true when dismissed 7 days ago (well past cooldown)', async () => {
    mockCurrentStreak = 12;
    setupSettings({
      lastDismissedAt: '2024-06-08', // 7 days ago
      streakAtLastDismissal: '5',
    });

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });
  });
});

describe('useStreakNudge — streak growth re-trigger (Requirement 21.5)', () => {
  it('shouldShow is true when streak grew by exactly 7 within cooldown', async () => {
    mockCurrentStreak = 12;
    setupSettings({
      lastDismissedAt: '2024-06-14', // 1 day ago (within cooldown)
      streakAtLastDismissal: '5',    // growth = 7 (>= 7)
    });

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });
  });

  it('shouldShow is true when streak grew by more than 7 within cooldown', async () => {
    mockCurrentStreak = 20;
    setupSettings({
      lastDismissedAt: '2024-06-14', // 1 day ago (within cooldown)
      streakAtLastDismissal: '5',    // growth = 15 (>= 7)
    });

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });
  });

  it('shouldShow is false when streak grew by 6 within cooldown', async () => {
    mockCurrentStreak = 11;
    setupSettings({
      lastDismissedAt: '2024-06-14', // 1 day ago (within cooldown)
      streakAtLastDismissal: '5',    // growth = 6 (< 7)
    });

    const { result } = renderHook(() => useStreakNudge());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.shouldShow).toBe(false);
  });

  it('shouldShow is false when streak grew by 0 within cooldown', async () => {
    mockCurrentStreak = 5;
    setupSettings({
      lastDismissedAt: '2024-06-15', // today (within cooldown)
      streakAtLastDismissal: '5',    // growth = 0 (< 7)
    });

    const { result } = renderHook(() => useStreakNudge());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.shouldShow).toBe(false);
  });

  it('treats missing streakAtLastDismissal as 0 for growth calculation', async () => {
    mockCurrentStreak = 7;
    setupSettings({
      lastDismissedAt: '2024-06-14', // 1 day ago (within cooldown)
      streakAtLastDismissal: null,   // missing → treated as 0; growth = 7 (>= 7)
    });

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });
  });
});

describe('useStreakNudge — never dismissed (Requirement 21.1)', () => {
  it('shouldShow is true when never dismissed and streak >= 3', async () => {
    mockCurrentStreak = 5;
    setupSettings({
      permanentlyDismissed: null,
      lastDismissedAt: null,
      streakAtLastDismissal: null,
    });

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });
  });
});

describe('useStreakNudge — dismiss() action (Requirement 21.3, 21.4)', () => {
  it('sets shouldShow to false immediately when dismiss() is called', async () => {
    mockCurrentStreak = 5;
    setupSettings();

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.shouldShow).toBe(false);
  });

  it('writes nudge_last_dismissed_at = today to SQLite', async () => {
    mockCurrentStreak = 5;
    setupSettings();

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });

    act(() => {
      result.current.dismiss();
    });

    await waitFor(() => {
      expect(mockSetSetting).toHaveBeenCalledWith(
        fakeDb,
        'nudge_last_dismissed_at',
        '2024-06-15',
      );
    });
  });

  it('writes nudge_streak_at_last_dismissal = currentStreak to SQLite', async () => {
    mockCurrentStreak = 7;
    setupSettings();

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });

    act(() => {
      result.current.dismiss();
    });

    await waitFor(() => {
      expect(mockSetSetting).toHaveBeenCalledWith(
        fakeDb,
        'nudge_streak_at_last_dismissal',
        '7',
      );
    });
  });

  it('catches errors in dismiss() silently', async () => {
    mockCurrentStreak = 5;
    setupSettings();
    mockSetSetting.mockRejectedValue(new Error('DB write failed'));

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });

    // Should not throw
    expect(() => {
      act(() => {
        result.current.dismiss();
      });
    }).not.toThrow();

    expect(result.current.shouldShow).toBe(false);
  });
});

describe('useStreakNudge — dismissPermanently() action (Requirement 21.7, 21.8)', () => {
  it('sets shouldShow to false immediately when dismissPermanently() is called', async () => {
    mockCurrentStreak = 5;
    setupSettings();

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });

    act(() => {
      result.current.dismissPermanently();
    });

    expect(result.current.shouldShow).toBe(false);
  });

  it('writes nudge_dismissed_permanently = "1" to SQLite', async () => {
    mockCurrentStreak = 5;
    setupSettings();

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });

    act(() => {
      result.current.dismissPermanently();
    });

    await waitFor(() => {
      expect(mockSetSetting).toHaveBeenCalledWith(
        fakeDb,
        'nudge_dismissed_permanently',
        '1',
      );
    });
  });

  it('catches errors in dismissPermanently() silently', async () => {
    mockCurrentStreak = 5;
    setupSettings();
    mockSetSetting.mockRejectedValue(new Error('DB write failed'));

    const { result } = renderHook(() => useStreakNudge());

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(true);
    });

    // Should not throw
    expect(() => {
      act(() => {
        result.current.dismissPermanently();
      });
    }).not.toThrow();

    expect(result.current.shouldShow).toBe(false);
  });
});

describe('useStreakNudge — error resilience', () => {
  it('shouldShow stays false when openUserDb throws', async () => {
    mockCurrentStreak = 5;
    mockOpenUserDb.mockImplementation(() => {
      throw new Error('Cannot open DB');
    });

    const { result } = renderHook(() => useStreakNudge());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.shouldShow).toBe(false);
  });

  it('shouldShow stays false when getSetting throws', async () => {
    mockCurrentStreak = 5;
    mockGetSetting.mockRejectedValue(new Error('DB read failed'));

    const { result } = renderHook(() => useStreakNudge());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.shouldShow).toBe(false);
  });

  it('does not throw when evaluation encounters an error', async () => {
    mockCurrentStreak = 5;
    mockOpenUserDb.mockImplementation(() => {
      throw new Error('Cannot open DB');
    });

    expect(() => renderHook(() => useStreakNudge())).not.toThrow();
  });
});
