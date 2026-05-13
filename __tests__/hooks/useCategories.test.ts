/**
 * Unit tests for src/hooks/useCategories.ts
 *
 * Covers:
 *   - Initial loading state is true
 *   - Returns categories on successful DB query
 *   - Sets isLoading to false after data is returned
 *   - Sets error state when openContentDb throws
 *   - Sets error state when getCategories throws
 *   - categories is empty array on error
 *   - Re-fetches when locale changes
 *
 * Requirements: 2.2, 2.4
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockOpenContentDb = jest.fn();
const mockGetCategories = jest.fn();

jest.mock('../../src/db/client', () => ({
  openContentDb: (...args: unknown[]) => mockOpenContentDb(...args),
}));

jest.mock('../../src/db/queries', () => ({
  getCategories: (...args: unknown[]) => mockGetCategories(...args),
}));

// Mock settingsStore — default locale is 'en'
let mockLocale = 'en';
jest.mock('../../src/store/settingsStore', () => ({
  useSettingsStore: (selector: (state: { language: string }) => unknown) =>
    selector({ language: mockLocale }),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCategories } from '../../src/hooks/useCategories';
import type { Category } from '../../src/types/content';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fakeDb = {};

const mockCategories: Category[] = [
  { id: 1, slug: 'morning', nameAr: 'أذكار الصباح', name: 'Morning', sortOrder: 1 },
  { id: 2, slug: 'evening', nameAr: 'أذكار المساء', name: 'Evening', sortOrder: 2 },
];

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockLocale = 'en';
  jest.clearAllMocks();
  mockOpenContentDb.mockResolvedValue(fakeDb);
  mockGetCategories.mockResolvedValue(mockCategories);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useCategories', () => {
  // ── Loading state ──────────────────────────────────────────────────────────

  it('starts with isLoading true', () => {
    // Delay resolution so we can observe the initial loading state
    mockOpenContentDb.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCategories());

    expect(result.current.isLoading).toBe(true);
  });

  it('starts with an empty categories array', () => {
    mockOpenContentDb.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCategories());

    expect(result.current.categories).toEqual([]);
  });

  it('starts with error as null', () => {
    mockOpenContentDb.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCategories());

    expect(result.current.error).toBeNull();
  });

  // ── Success state ──────────────────────────────────────────────────────────

  it('sets isLoading to false after data is returned', async () => {
    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('returns categories on successful DB query', async () => {
    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual(mockCategories);
  });

  it('error is null on success', async () => {
    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
  });

  it('calls openContentDb once on mount', async () => {
    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockOpenContentDb).toHaveBeenCalledTimes(1);
  });

  it('calls getCategories with the db and locale', async () => {
    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetCategories).toHaveBeenCalledWith(fakeDb, 'en');
  });

  // ── Error state — openContentDb throws ────────────────────────────────────

  it('sets error when openContentDb throws', async () => {
    const dbError = new Error('Failed to open database');
    mockOpenContentDb.mockRejectedValue(dbError);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to open database');
  });

  it('returns empty categories array when openContentDb throws', async () => {
    mockOpenContentDb.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual([]);
  });

  it('sets isLoading to false when openContentDb throws', async () => {
    mockOpenContentDb.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  // ── Error state — getCategories throws ────────────────────────────────────

  it('sets error when getCategories throws', async () => {
    const queryError = new Error('Query failed');
    mockGetCategories.mockRejectedValue(queryError);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Query failed');
  });

  it('returns empty categories array when getCategories throws', async () => {
    mockGetCategories.mockRejectedValue(new Error('Query failed'));

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual([]);
  });

  // ── Non-Error thrown value ─────────────────────────────────────────────────

  it('wraps a non-Error thrown value in an Error', async () => {
    mockOpenContentDb.mockRejectedValue('string error');

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  // ── Locale change re-fetch ─────────────────────────────────────────────────

  it('calls getCategories with the updated locale when locale changes', async () => {
    const idCategories: Category[] = [
      { id: 1, slug: 'morning', nameAr: 'أذكار الصباح', name: 'Pagi', sortOrder: 1 },
    ];

    // First render with 'en'
    const { result, rerender } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetCategories).toHaveBeenCalledWith(fakeDb, 'en');

    // Change locale to 'id' and re-render
    mockGetCategories.mockResolvedValue(idCategories);
    act(() => {
      mockLocale = 'id';
    });
    rerender({});

    await waitFor(() => {
      expect(result.current.categories).toEqual(idCategories);
    });

    expect(mockGetCategories).toHaveBeenCalledWith(fakeDb, 'id');
  });
});
