/**
 * Unit tests for src/hooks/useDhikrByCategory.ts
 *
 * Covers:
 *   - Initial loading state is true
 *   - Returns dhikrList on successful DB query
 *   - Sets isLoading to false after data is returned
 *   - Sets error state when openContentDb throws
 *   - Sets error state when getDhikrByCategory throws
 *   - dhikrList is empty array on error
 *   - Calls getDhikrByCategory with the correct categoryId and locale
 *   - Re-fetches when categoryId changes
 *   - Re-fetches when locale changes
 *
 * Requirements: 2.3, 2.4
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockOpenContentDb = jest.fn();
const mockGetDhikrByCategory = jest.fn();

jest.mock('../../src/db/client', () => ({
  openContentDb: (...args: unknown[]) => mockOpenContentDb(...args),
}));

jest.mock('../../src/db/queries', () => ({
  getDhikrByCategory: (...args: unknown[]) => mockGetDhikrByCategory(...args),
}));

// Mock settingsStore — default locale is 'en'
let mockLocale = 'en';
jest.mock('../../src/store/settingsStore', () => ({
  useSettingsStore: (selector: (state: { language: string }) => unknown) =>
    selector({ language: mockLocale }),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useDhikrByCategory } from '../../src/hooks/useDhikrByCategory';
import type { Dhikr } from '../../src/types/content';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fakeDb = {};

const mockDhikrList: Dhikr[] = [
  {
    id: 1,
    arabicText: 'سُبْحَانَ اللَّهِ',
    transliteration: 'Subhana Allahi',
    translation: 'Glory be to Allah',
    translationFallback: false,
    repetitionCount: 33,
    sourceType: 'hadith',
    surahName: null,
    ayahNumber: null,
    collectionName: 'Sahih al-Bukhari',
    bookNumber: '75',
    hadithNumber: '412',
    authenticityGrade: 'sahih',
    scholarNames: ['Al-Bukhari'],
    gradingRationale: null,
    fullHadithText: null,
  },
  {
    id: 2,
    arabicText: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    translation: 'All praise is due to Allah',
    translationFallback: false,
    repetitionCount: 33,
    sourceType: 'hadith',
    surahName: null,
    ayahNumber: null,
    collectionName: 'Sahih Muslim',
    bookNumber: '4',
    hadithNumber: '2137',
    authenticityGrade: 'sahih',
    scholarNames: ['Muslim'],
    gradingRationale: null,
    fullHadithText: null,
  },
];

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockLocale = 'en';
  jest.clearAllMocks();
  mockOpenContentDb.mockResolvedValue(fakeDb);
  mockGetDhikrByCategory.mockResolvedValue(mockDhikrList);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useDhikrByCategory', () => {
  // ── Loading state ──────────────────────────────────────────────────────────

  it('starts with isLoading true', () => {
    mockOpenContentDb.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useDhikrByCategory(1));

    expect(result.current.isLoading).toBe(true);
  });

  it('starts with an empty dhikrList array', () => {
    mockOpenContentDb.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useDhikrByCategory(1));

    expect(result.current.dhikrList).toEqual([]);
  });

  it('starts with error as null', () => {
    mockOpenContentDb.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useDhikrByCategory(1));

    expect(result.current.error).toBeNull();
  });

  // ── Success state ──────────────────────────────────────────────────────────

  it('sets isLoading to false after data is returned', async () => {
    const { result } = renderHook(() => useDhikrByCategory(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('returns dhikrList on successful DB query', async () => {
    const { result } = renderHook(() => useDhikrByCategory(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dhikrList).toEqual(mockDhikrList);
  });

  it('error is null on success', async () => {
    const { result } = renderHook(() => useDhikrByCategory(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
  });

  it('calls openContentDb once on mount', async () => {
    const { result } = renderHook(() => useDhikrByCategory(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockOpenContentDb).toHaveBeenCalledTimes(1);
  });

  it('calls getDhikrByCategory with the db, categoryId, and locale', async () => {
    const { result } = renderHook(() => useDhikrByCategory(3));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetDhikrByCategory).toHaveBeenCalledWith(fakeDb, 3, 'en');
  });

  // ── Error state — openContentDb throws ────────────────────────────────────

  it('sets error when openContentDb throws', async () => {
    const dbError = new Error('Failed to open database');
    mockOpenContentDb.mockRejectedValue(dbError);

    const { result } = renderHook(() => useDhikrByCategory(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to open database');
  });

  it('returns empty dhikrList when openContentDb throws', async () => {
    mockOpenContentDb.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useDhikrByCategory(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dhikrList).toEqual([]);
  });

  it('sets isLoading to false when openContentDb throws', async () => {
    mockOpenContentDb.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useDhikrByCategory(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  // ── Error state — getDhikrByCategory throws ───────────────────────────────

  it('sets error when getDhikrByCategory throws', async () => {
    const queryError = new Error('Query failed');
    mockGetDhikrByCategory.mockRejectedValue(queryError);

    const { result } = renderHook(() => useDhikrByCategory(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Query failed');
  });

  it('returns empty dhikrList when getDhikrByCategory throws', async () => {
    mockGetDhikrByCategory.mockRejectedValue(new Error('Query failed'));

    const { result } = renderHook(() => useDhikrByCategory(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dhikrList).toEqual([]);
  });

  // ── Non-Error thrown value ─────────────────────────────────────────────────

  it('wraps a non-Error thrown value in an Error', async () => {
    mockOpenContentDb.mockRejectedValue('string error');

    const { result } = renderHook(() => useDhikrByCategory(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  // ── categoryId change re-fetch ─────────────────────────────────────────────

  it('re-fetches when categoryId changes', async () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: number }) => useDhikrByCategory(id),
      { initialProps: { id: 1 } },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetDhikrByCategory).toHaveBeenCalledWith(fakeDb, 1, 'en');

    const newDhikrList: Dhikr[] = [{ ...mockDhikrList[0], id: 10 }];
    mockGetDhikrByCategory.mockResolvedValue(newDhikrList);

    rerender({ id: 2 });

    await waitFor(() => {
      expect(result.current.dhikrList).toEqual(newDhikrList);
    });

    expect(mockGetDhikrByCategory).toHaveBeenCalledWith(fakeDb, 2, 'en');
  });

  // ── Locale change re-fetch ─────────────────────────────────────────────────

  it('re-fetches when locale changes', async () => {
    const idDhikrList: Dhikr[] = [
      { ...mockDhikrList[0], translation: 'Maha Suci Allah' },
    ];

    const { result, rerender } = renderHook(() => useDhikrByCategory(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetDhikrByCategory).toHaveBeenCalledWith(fakeDb, 1, 'en');

    mockGetDhikrByCategory.mockResolvedValue(idDhikrList);
    act(() => {
      mockLocale = 'id';
    });
    rerender({});

    await waitFor(() => {
      expect(result.current.dhikrList).toEqual(idDhikrList);
    });

    expect(mockGetDhikrByCategory).toHaveBeenCalledWith(fakeDb, 1, 'id');
  });
});
