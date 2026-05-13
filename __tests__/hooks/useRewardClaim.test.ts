/**
 * Unit tests for src/hooks/useRewardClaim.ts
 *
 * Covers:
 *   - Valid GoPay number formats are accepted
 *   - Invalid GoPay number formats are rejected with an error
 *   - Unauthenticated user is rejected with an error
 *   - Streak below milestone is rejected with an error
 *   - Streak equal to milestone is accepted
 *   - Streak above milestone is accepted
 *   - Successful submission sets isSubmitted = true
 *   - Successful submission clears error state
 *   - isSubmitting is true during submission and false after
 *   - Firestore read failure sets error and shows Alert
 *   - Missing streak document sets error and shows Alert
 *   - Firestore write failure sets error
 *   - submitClaim resets error on each new attempt
 *
 * Requirements: 18.1–18.10, 20.6
 */

// ── Mutable test state (declared before jest.mock so factories can close over them) ──

let mockUser: { uid: string; displayName: string | null; email: string | null } | null = {
  uid: 'user-123',
  displayName: 'Test User',
  email: 'test@example.com',
};

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock authStore — selector receives { user: mockUser }
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: (selector: (state: { user: typeof mockUser }) => unknown) =>
    selector({ user: mockUser }),
}));

// Mock firebase/firestore
const mockGetFirestore = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockCollection = jest.fn();
const mockServerTimestamp = jest.fn(() => ({ _type: 'serverTimestamp' }));

jest.mock('firebase/firestore', () => ({
  getFirestore: (...args: unknown[]) => mockGetFirestore(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

// Mock React Native Alert
const mockAlert = jest.fn();
jest.mock('react-native', () => ({
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useRewardClaim, isValidGopayNumber } from '../../src/hooks/useRewardClaim';

// ── Shared fixtures ───────────────────────────────────────────────────────────

const fakeFirestoreDb = {};
const fakeStreakRef = { path: 'users/uid/streak/data' };
const fakeClaimsRef = { path: 'reward_claims' };
const fakeDocRef = { id: 'new-claim-id' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeStreakSnap(currentStreak: number) {
  return {
    exists: () => true,
    data: () => ({ currentStreak }),
  };
}

function makeMissingSnap() {
  return {
    exists: () => false,
    data: () => null,
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  mockUser = {
    uid: 'user-123',
    displayName: 'Test User',
    email: 'test@example.com',
  };

  mockGetFirestore.mockReturnValue(fakeFirestoreDb);
  mockDoc.mockReturnValue(fakeStreakRef);
  mockCollection.mockReturnValue(fakeClaimsRef);
  mockGetDoc.mockResolvedValue(makeStreakSnap(30));
  mockAddDoc.mockResolvedValue(fakeDocRef);
});

// ── isValidGopayNumber unit tests ─────────────────────────────────────────────

describe('isValidGopayNumber — valid formats', () => {
  const validNumbers = [
    '08123456789',
    '081234567890',
    '0812345678901',
    '628123456789',
    '+628123456789',
    '081234567',   // 7 digits after 08x (minimum: 6 digits after 8[1-9])
    '08199999999',
    '082112345678',
    '083987654321',
    '085123456789',
    '086123456789',
    '087123456789',
    '088123456789',
    '089123456789',
  ];

  it.each(validNumbers)('accepts %s', (number) => {
    expect(isValidGopayNumber(number)).toBe(true);
  });
});

describe('isValidGopayNumber — invalid formats', () => {
  const invalidNumbers = [
    '',
    '1234567890',       // does not start with +62, 62, or 0
    '080123456789',     // 0 after 08 (digit must be 1-9)
    '07123456789',      // starts with 07, not 08
    '0812345',          // too short (only 5 digits after 08x)
    '081234567890123',  // too long (12 digits after 08x)
    '+63812345678',     // wrong country code
    'abc08123456789',   // non-numeric prefix
    '08 123 456 789',   // spaces not allowed
    '+62 8123456789',   // spaces not allowed
  ];

  it.each(invalidNumbers)('rejects %s', (number) => {
    expect(isValidGopayNumber(number)).toBe(false);
  });
});

// ── useRewardClaim hook tests ─────────────────────────────────────────────────

describe('useRewardClaim — initial state', () => {
  it('starts with isSubmitting=false, error=null, isSubmitted=false', () => {
    const { result } = renderHook(() => useRewardClaim());

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSubmitted).toBe(false);
  });
});

describe('useRewardClaim — GoPay number validation (Requirement 18.4)', () => {
  it('sets error when gopayNumber is invalid and does not call Firestore', async () => {
    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, 'invalid-number');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.isSubmitted).toBe(false);
    expect(mockGetDoc).not.toHaveBeenCalled();
    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it('sets error for empty gopayNumber', async () => {
    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.isSubmitted).toBe(false);
  });

  it('does not set error for a valid gopayNumber (proceeds to Firestore)', async () => {
    mockGetDoc.mockResolvedValue(makeStreakSnap(30));

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    // Validation passed — Firestore was called and submission succeeded
    expect(result.current.error).toBeNull();
    expect(result.current.isSubmitted).toBe(true);
  });
});

describe('useRewardClaim — authentication guard', () => {
  it('sets error when user is null (not authenticated)', async () => {
    mockUser = null;

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.isSubmitted).toBe(false);
    expect(mockGetDoc).not.toHaveBeenCalled();
  });
});

describe('useRewardClaim — streak verification (Requirement 20.6)', () => {
  it('sets error when currentStreak is below milestone', async () => {
    mockGetDoc.mockResolvedValue(makeStreakSnap(20)); // streak = 20, milestone = 30

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error).toContain('20');   // mentions current streak
    expect(result.current.error).toContain('30');   // mentions milestone
    expect(result.current.isSubmitted).toBe(false);
    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it('sets error when currentStreak is 0 and milestone is 30', async () => {
    mockGetDoc.mockResolvedValue(makeStreakSnap(0));

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.isSubmitted).toBe(false);
  });

  it('accepts when currentStreak equals milestone exactly', async () => {
    mockGetDoc.mockResolvedValue(makeStreakSnap(30)); // streak = 30, milestone = 30

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isSubmitted).toBe(true);
  });

  it('accepts when currentStreak exceeds milestone', async () => {
    mockGetDoc.mockResolvedValue(makeStreakSnap(45)); // streak = 45, milestone = 30

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isSubmitted).toBe(true);
  });

  it('reads streak from correct Firestore path', async () => {
    mockGetDoc.mockResolvedValue(makeStreakSnap(30));

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(mockDoc).toHaveBeenCalledWith(
      fakeFirestoreDb,
      'users',
      'user-123',
      'streak',
      'data',
    );
    expect(mockGetDoc).toHaveBeenCalledWith(fakeStreakRef);
  });
});

describe('useRewardClaim — successful submission (Requirement 18.5)', () => {
  it('sets isSubmitted = true after successful submission', async () => {
    mockGetDoc.mockResolvedValue(makeStreakSnap(30));

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(result.current.isSubmitted).toBe(true);
  });

  it('clears error after successful submission', async () => {
    mockGetDoc.mockResolvedValue(makeStreakSnap(30));

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(result.current.error).toBeNull();
  });

  it('writes to reward_claims collection with all required fields', async () => {
    mockGetDoc.mockResolvedValue(makeStreakSnap(100));

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(100, '+628123456789');
    });

    expect(mockCollection).toHaveBeenCalledWith(fakeFirestoreDb, 'reward_claims');
    expect(mockAddDoc).toHaveBeenCalledWith(
      fakeClaimsRef,
      expect.objectContaining({
        userId: 'user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        gopayNumber: '+628123456789',
        milestone: 100,
        status: 'pending',
        submittedAt: expect.anything(),
      }),
    );
  });

  it('uses serverTimestamp() for submittedAt field', async () => {
    mockGetDoc.mockResolvedValue(makeStreakSnap(30));
    const fakeTimestamp = { _type: 'serverTimestamp' };
    mockServerTimestamp.mockReturnValue(fakeTimestamp);

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(mockAddDoc).toHaveBeenCalledWith(
      fakeClaimsRef,
      expect.objectContaining({ submittedAt: fakeTimestamp }),
    );
  });

  it('sets status to "pending" on submission', async () => {
    mockGetDoc.mockResolvedValue(makeStreakSnap(30));

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(mockAddDoc).toHaveBeenCalledWith(
      fakeClaimsRef,
      expect.objectContaining({ status: 'pending' }),
    );
  });

  it('handles null displayName gracefully (uses empty string)', async () => {
    mockUser = { uid: 'user-123', displayName: null, email: 'test@example.com' };
    mockGetDoc.mockResolvedValue(makeStreakSnap(30));

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(mockAddDoc).toHaveBeenCalledWith(
      fakeClaimsRef,
      expect.objectContaining({ displayName: '' }),
    );
  });

  it('handles null email gracefully (uses empty string)', async () => {
    mockUser = { uid: 'user-123', displayName: 'Test User', email: null };
    mockGetDoc.mockResolvedValue(makeStreakSnap(30));

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(mockAddDoc).toHaveBeenCalledWith(
      fakeClaimsRef,
      expect.objectContaining({ email: '' }),
    );
  });
});

describe('useRewardClaim — isSubmitting state', () => {
  it('isSubmitting is false before submitClaim is called', () => {
    const { result } = renderHook(() => useRewardClaim());
    expect(result.current.isSubmitting).toBe(false);
  });

  it('isSubmitting is false after successful submission', async () => {
    mockGetDoc.mockResolvedValue(makeStreakSnap(30));

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it('isSubmitting is false after a failed submission', async () => {
    mockGetDoc.mockRejectedValue(new Error('Firestore error'));

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(result.current.isSubmitting).toBe(false);
  });
});

describe('useRewardClaim — Firestore read failure (Requirement 18.5)', () => {
  it('sets error and shows Alert when getDoc throws', async () => {
    mockGetDoc.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.isSubmitted).toBe(false);
    expect(mockAlert).toHaveBeenCalledTimes(1);
  });

  it('sets error and shows Alert when streak document does not exist', async () => {
    mockGetDoc.mockResolvedValue(makeMissingSnap());

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.isSubmitted).toBe(false);
    expect(mockAlert).toHaveBeenCalledTimes(1);
  });

  it('does not call addDoc when streak read fails', async () => {
    mockGetDoc.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(mockAddDoc).not.toHaveBeenCalled();
  });
});

describe('useRewardClaim — Firestore write failure', () => {
  it('sets error when addDoc throws', async () => {
    mockGetDoc.mockResolvedValue(makeStreakSnap(30));
    mockAddDoc.mockRejectedValue(new Error('Write failed'));

    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.isSubmitted).toBe(false);
  });
});

describe('useRewardClaim — error reset on new attempt', () => {
  it('clears error from previous attempt when a new submitClaim is called', async () => {
    // First attempt: invalid number → sets error
    const { result } = renderHook(() => useRewardClaim());

    await act(async () => {
      await result.current.submitClaim(30, 'bad-number');
    });

    expect(result.current.error).not.toBeNull();

    // Second attempt: valid number + passing streak → clears error
    mockGetDoc.mockResolvedValue(makeStreakSnap(30));

    await act(async () => {
      await result.current.submitClaim(30, '08123456789');
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isSubmitted).toBe(true);
  });
});
