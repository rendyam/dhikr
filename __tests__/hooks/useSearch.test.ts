/**
 * Unit tests for src/hooks/useSearch.ts
 *
 * Covers:
 *   - Empty query returns empty results without hitting the DB
 *   - Whitespace-only query returns empty results without hitting the DB
 *   - Non-empty query triggers DB search after 300 ms debounce
 *   - isLoading is true immediately when a non-empty query is set
 *   - isLoading is false after the debounce resolves
 *   - results are populated when the DB returns matches
 *   - isEmpty is true when query is non-empty but DB returns no results
 *   - isEmpty is false when results are found
 *   - isEmpty is false when query is empty
 *   - Debounce: rapid query changes only fire one DB call
 *   - Locale change re-runs the search
 *   - Clearing the query resets results and isEmpty
 *
 * Requirements: 11.1, 11.2, 11.3
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockOpenContentDb = jest.fn();
const mockSearchDhikr = jest.fn();

jest.mock('../../src/db/client', () => ({
  openContentDb: (...args: unknown[]) => mockOpenContentDb(...args),
}));

jest.mock('../../src/db/queries', () => ({
  searchDhikr: (...args: unknown[]) => mockSearchDhikr(...args),
}));

// Mock settingsStore — default locale is 'en'
let mockLocale = 'en';
jest.mock('../../src/store/settingsStore', () => ({
  useSettingsStore: (selector: (state: { language: string }) => unknown) =>
    selector({ language: mockLocale }),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useSearch } from '../../src/hooks/useSearch';
import type { Dhikr } from '../../src/types/content';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fakeDb = {};

const mockResults: Dhikr[] = [
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
];

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockLocale = 'en';
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockOpenContentDb.mockResolvedValue(fakeDb);
  mockSearchDhikr.mockResolvedValue(mockResults);
});

afterEach(() => {
  jest.useRealTimers();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useSearch', () => {
  // ── Empty / whitespace query ───────────────────────────────────────────────

  it('returns empty results for an empty query without hitting the DB', () => {
    const { result } = renderHook(() => useSearch(''));

    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isEmpty).toBe(false);
    expect(mockOpenContentDb).not.toHaveBeenCalled();
    expect(mockSearchDhikr).not.toHaveBeenCalled();
  });

  it('returns empty results for a whitespace-only query without hitting the DB', () => {
    const { result } = renderHook(() => useSearch('   '));

    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isEmpty).toBe(false);
    expect(mockOpenContentDb).not.toHaveBeenCalled();
    expect(mockSearchDhikr).not.toHaveBeenCalled();
  });

  it('isEmpty is false for an empty query', () => {
    const { result } = renderHook(() => useSearch(''));

    expect(result.current.isEmpty).toBe(false);
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it('sets isLoading to true immediately when a non-empty query is provided', () => {
    const { result } = renderHook(() => useSearch('subhan'));

    // Before the debounce fires, isLoading should already be true
    expect(result.current.isLoading).toBe(true);
  });

  it('sets isLoading to false after the debounce resolves', async () => {
    const { result } = renderHook(() => useSearch('subhan'));

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ── Debounce behavior ──────────────────────────────────────────────────────

  it('does not call the DB before 300 ms have elapsed', () => {
    renderHook(() => useSearch('subhan'));

    act(() => {
      jest.advanceTimersByTime(299);
    });

    expect(mockOpenContentDb).not.toHaveBeenCalled();
    expect(mockSearchDhikr).not.toHaveBeenCalled();
  });

  it('calls the DB after exactly 300 ms', async () => {
    renderHook(() => useSearch('subhan'));

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockOpenContentDb).toHaveBeenCalledTimes(1);
    });
    expect(mockSearchDhikr).toHaveBeenCalledTimes(1);
  });

  it('only fires one DB call when the query changes rapidly (debounce coalescing)', async () => {
    const { rerender } = renderHook(
      ({ q }: { q: string }) => useSearch(q),
      { initialProps: { q: 's' } },
    );

    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender({ q: 'su' });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender({ q: 'sub' });

    // Advance past the debounce for the final query
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockSearchDhikr).toHaveBeenCalledTimes(1);
    });

    // The DB should have been called with the final query value
    expect(mockSearchDhikr).toHaveBeenCalledWith(fakeDb, 'sub', 'en');
  });

  // ── Successful search ──────────────────────────────────────────────────────

  it('returns results when the DB finds matches', async () => {
    const { result } = renderHook(() => useSearch('subhan'));

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.results).toEqual(mockResults);
    });
  });

  it('calls searchDhikr with the trimmed query, db, and locale', async () => {
    renderHook(() => useSearch('  subhan  '));

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockSearchDhikr).toHaveBeenCalledWith(fakeDb, 'subhan', 'en');
    });
  });

  it('isEmpty is false when results are found', async () => {
    const { result } = renderHook(() => useSearch('subhan'));

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isEmpty).toBe(false);
  });

  // ── No-results state ───────────────────────────────────────────────────────

  it('sets isEmpty to true when query is non-empty but DB returns no results', async () => {
    mockSearchDhikr.mockResolvedValue([]);

    const { result } = renderHook(() => useSearch('xyz_no_match'));

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
  });

  // ── Clearing the query ─────────────────────────────────────────────────────

  it('resets results and isEmpty when query is cleared', async () => {
    const { result, rerender } = renderHook(
      ({ q }: { q: string }) => useSearch(q),
      { initialProps: { q: 'subhan' } },
    );

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.results).toEqual(mockResults);
    });

    // Clear the query
    rerender({ q: '' });

    expect(result.current.results).toEqual([]);
    expect(result.current.isEmpty).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  // ── Locale change ──────────────────────────────────────────────────────────

  it('re-runs the search with the new locale when locale changes', async () => {
    const idResults: Dhikr[] = [
      { ...mockResults[0], translation: 'Maha Suci Allah' },
    ];

    const { result, rerender } = renderHook(() => useSearch('subhan'));

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.results).toEqual(mockResults);
    });

    expect(mockSearchDhikr).toHaveBeenCalledWith(fakeDb, 'subhan', 'en');

    // Change locale
    mockSearchDhikr.mockResolvedValue(idResults);
    act(() => {
      mockLocale = 'id';
    });
    rerender({});

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.results).toEqual(idResults);
    });

    expect(mockSearchDhikr).toHaveBeenCalledWith(fakeDb, 'subhan', 'id');
  });
});
