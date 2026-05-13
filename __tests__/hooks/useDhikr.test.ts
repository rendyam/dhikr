/**
 * Unit tests for src/hooks/useDhikr.ts
 *
 * Covers:
 *   - Initial loading state is true
 *   - Returns dhikr data on successful DB query
 *   - Sets isLoading to false after data is returned
 *   - Returns null dhikr when getDhikrById returns null (missing dhikr)
 *   - translationFallback flag is true when DB returns fallback translation
 *   - translationFallback flag is false when locale translation exists
 *   - Sets error state when openContentDb throws
 *   - Sets error state when getDhikrById throws
 *   - dhikr is null on error
 *   - Calls getDhikrById with the correct dhikrId and locale
 *   - Re-fetches when dhikrId changes
 *   - Re-fetches when locale changes
 *
 * Requirements: 3.1–3.5, 7.4
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockOpenContentDb = jest.fn();
const mockGetDhikrById = jest.fn();

jest.mock('../../src/db/client', () => ({
  openContentDb: (...args: unknown[]) => mockOpenContentDb(...args),
}));

jest.mock('../../src/db/queries', () => ({
  getDhikrById: (...args: unknown[]) => mockGetDhikrById(...args),
}));

// Mock settingsStore — default locale is 'en'
let mockLocale = 'en';
jest.mock('../../src/store/settingsStore', () => ({
  useSettingsStore: (selector: (state: { language: string }) => unknown) =>
    selector({ language: mockLocale }),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useDhikr } from '../../src/hooks/useDhikr';
import type { Dhikr } from '../../src/types/content';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fakeDb = {};

const mockDhikr: Dhikr = {
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
};

const mockDhikrWithFallback: Dhikr = {
  ...mockDhikr,
  translation: 'Glory be to Allah', // English fallback
  translationFallback: true,
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockLocale = 'en';
  jest.clearAllMocks();
  mockOpenContentDb.mockResolvedValue(fakeDb);
  mockGetDhikrById.mockResolvedValue(mockDhikr);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useDhikr', () => {
  // ── Loading state ──────────────────────────────────────────────────────────

  it('starts with isLoading true', () => {
    mockOpenContentDb.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useDhikr(1));

    expect(result.current.isLoading).toBe(true);
  });

  it('starts with dhikr as null', () => {
    mockOpenContentDb.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useDhikr(1));

    expect(result.current.dhikr).toBeNull();
  });

  it('starts with error as null', () => {
    mockOpenContentDb.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useDhikr(1));

    expect(result.current.error).toBeNull();
  });

  // ── Success state ──────────────────────────────────────────────────────────

  it('sets isLoading to false after data is returned', async () => {
    const { result } = renderHook(() => useDhikr(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('returns dhikr data on successful DB query', async () => {
    const { result } = renderHook(() => useDhikr(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dhikr).toEqual(mockDhikr);
  });

  it('error is null on success', async () => {
    const { result } = renderHook(() => useDhikr(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
  });

  it('calls openContentDb once on mount', async () => {
    const { result } = renderHook(() => useDhikr(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockOpenContentDb).toHaveBeenCalledTimes(1);
  });

  it('calls getDhikrById with the db, dhikrId, and locale', async () => {
    const { result } = renderHook(() => useDhikr(42));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetDhikrById).toHaveBeenCalledWith(fakeDb, 42, 'en');
  });

  // ── Missing dhikr (null) ───────────────────────────────────────────────────

  it('returns null dhikr when getDhikrById returns null', async () => {
    mockGetDhikrById.mockResolvedValue(null);

    const { result } = renderHook(() => useDhikr(999));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dhikr).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets isLoading to false when dhikr is not found', async () => {
    mockGetDhikrById.mockResolvedValue(null);

    const { result } = renderHook(() => useDhikr(999));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  // ── Translation fallback ───────────────────────────────────────────────────

  it('exposes translationFallback as true when DB returns a fallback translation', async () => {
    mockGetDhikrById.mockResolvedValue(mockDhikrWithFallback);

    const { result } = renderHook(() => useDhikr(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dhikr?.translationFallback).toBe(true);
  });

  it('exposes translationFallback as false when locale translation exists', async () => {
    mockGetDhikrById.mockResolvedValue(mockDhikr); // translationFallback: false

    const { result } = renderHook(() => useDhikr(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dhikr?.translationFallback).toBe(false);
  });

  // ── Error state — openContentDb throws ────────────────────────────────────

  it('sets error when openContentDb throws', async () => {
    const dbError = new Error('Failed to open database');
    mockOpenContentDb.mockRejectedValue(dbError);

    const { result } = renderHook(() => useDhikr(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to open database');
  });

  it('returns null dhikr when openContentDb throws', async () => {
    mockOpenContentDb.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useDhikr(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dhikr).toBeNull();
  });

  it('sets isLoading to false when openContentDb throws', async () => {
    mockOpenContentDb.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useDhikr(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  // ── Error state — getDhikrById throws ─────────────────────────────────────

  it('sets error when getDhikrById throws', async () => {
    const queryError = new Error('Query failed');
    mockGetDhikrById.mockRejectedValue(queryError);

    const { result } = renderHook(() => useDhikr(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Query failed');
  });

  it('returns null dhikr when getDhikrById throws', async () => {
    mockGetDhikrById.mockRejectedValue(new Error('Query failed'));

    const { result } = renderHook(() => useDhikr(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dhikr).toBeNull();
  });

  // ── Non-Error thrown value ─────────────────────────────────────────────────

  it('wraps a non-Error thrown value in an Error', async () => {
    mockOpenContentDb.mockRejectedValue('string error');

    const { result } = renderHook(() => useDhikr(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  // ── dhikrId change re-fetch ────────────────────────────────────────────────

  it('re-fetches when dhikrId changes', async () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: number }) => useDhikr(id),
      { initialProps: { id: 1 } },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetDhikrById).toHaveBeenCalledWith(fakeDb, 1, 'en');

    const updatedDhikr: Dhikr = { ...mockDhikr, id: 2, arabicText: 'الْحَمْدُ لِلَّهِ' };
    mockGetDhikrById.mockResolvedValue(updatedDhikr);

    rerender({ id: 2 });

    await waitFor(() => {
      expect(result.current.dhikr).toEqual(updatedDhikr);
    });

    expect(mockGetDhikrById).toHaveBeenCalledWith(fakeDb, 2, 'en');
  });

  // ── Locale change re-fetch ─────────────────────────────────────────────────

  it('re-fetches when locale changes', async () => {
    const idDhikr: Dhikr = {
      ...mockDhikr,
      translation: 'Maha Suci Allah',
      translationFallback: false,
    };

    const { result, rerender } = renderHook(() => useDhikr(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetDhikrById).toHaveBeenCalledWith(fakeDb, 1, 'en');

    mockGetDhikrById.mockResolvedValue(idDhikr);
    act(() => {
      mockLocale = 'id';
    });
    rerender({});

    await waitFor(() => {
      expect(result.current.dhikr).toEqual(idDhikr);
    });

    expect(mockGetDhikrById).toHaveBeenCalledWith(fakeDb, 1, 'id');
  });
});
