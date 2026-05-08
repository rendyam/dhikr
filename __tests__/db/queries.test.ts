/**
 * Unit tests for src/db/queries.ts
 *
 * Tests cover all exported query functions:
 *   - getCategories
 *   - getCategoryById
 *   - getDhikrByCategory
 *   - getDhikrById
 *   - searchDhikr
 *   - getAllDhikrIds
 *   - getFavoriteIds
 *   - addFavorite
 *   - removeFavorite
 *   - getStreak
 *   - upsertStreak
 *   - getBadges
 *   - upsertBadge
 *   - getTodos
 *   - upsertTodo
 *   - softDeleteTodo
 *   - getSetting
 *   - setSetting
 *   - getCheckinHistory
 *   - recordCheckin
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetAllSync = jest.fn();
const mockGetFirstSync = jest.fn();
const mockRunSync = jest.fn();

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    getAllSync: mockGetAllSync,
    getFirstSync: mockGetFirstSync,
    runSync: mockRunSync,
  })),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import {
  getCategories,
  getCategoryById,
  getDhikrByCategory,
  getDhikrById,
  searchDhikr,
  getAllDhikrIds,
  getFavoriteIds,
  addFavorite,
  removeFavorite,
  getStreak,
  upsertStreak,
  getBadges,
  upsertBadge,
  getTodos,
  upsertTodo,
  softDeleteTodo,
  getSetting,
  setSetting,
  getCheckinHistory,
  recordCheckin,
} from '../../src/db/queries';
import type { Category, Dhikr } from '../../src/types/content';
import type { Badge, StreakData, TodoItem } from '../../src/types/user';

// ---------------------------------------------------------------------------
// Mock DB instance
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SQLite = require('expo-sqlite');
const mockDb = SQLite.openDatabaseSync('test.db');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetMocks() {
  mockGetAllSync.mockReset();
  mockGetFirstSync.mockReset();
  mockRunSync.mockReset();
}

/** Builds a raw category row as returned by SQLite */
function makeCategoryRow(overrides: Partial<{
  id: number;
  slug: string;
  name_ar: string;
  sort_order: number;
  name: string;
}> = {}) {
  return {
    id: 1,
    slug: 'morning',
    name_ar: 'أذكار الصباح',
    sort_order: 1,
    name: 'Morning Adhkar',
    ...overrides,
  };
}

/** Builds a raw dhikr row as returned by SQLite */
function makeDhikrRow(overrides: Partial<{
  id: number;
  arabic_text: string;
  transliteration: string | null;
  translation: string;
  translation_fallback: number;
  repetition_count: number | null;
  source_type: string;
  surah_name: string | null;
  ayah_number: number | null;
  collection_name: string | null;
  book_number: string | null;
  hadith_number: string | null;
  authenticity_grade: string;
  scholar_names: string | null;
  grading_rationale: string | null;
  full_hadith_text: string | null;
}> = {}) {
  return {
    id: 1,
    arabic_text: 'بِسْمِ اللَّهِ',
    transliteration: 'Bismillah',
    translation: 'In the name of Allah',
    translation_fallback: 0,
    repetition_count: 3,
    source_type: 'hadith',
    surah_name: null,
    ayah_number: null,
    collection_name: 'Bukhari',
    book_number: '1',
    hadith_number: '1',
    authenticity_grade: 'sahih',
    scholar_names: '["Al-Albani"]',
    grading_rationale: 'Graded sahih by Al-Albani',
    full_hadith_text: 'Full hadith text here',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getCategories
// ---------------------------------------------------------------------------

describe('getCategories()', () => {
  beforeEach(resetMocks);

  it('returns mapped Category array for given locale', async () => {
    const rawRows = [
      makeCategoryRow({ id: 1, slug: 'morning', name: 'Morning Adhkar', sort_order: 1 }),
      makeCategoryRow({ id: 2, slug: 'evening', name: 'Evening Adhkar', sort_order: 2 }),
    ];
    mockGetAllSync.mockReturnValue(rawRows);

    const result = await getCategories(mockDb, 'en');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual<Category>({
      id: 1,
      slug: 'morning',
      nameAr: 'أذكار الصباح',
      name: 'Morning Adhkar',
      sortOrder: 1,
    });
    expect(result[1].slug).toBe('evening');
  });

  it('returns empty array when no categories exist', async () => {
    mockGetAllSync.mockReturnValue([]);

    const result = await getCategories(mockDb, 'en');

    expect(result).toEqual([]);
  });

  it('passes locale as a query parameter', async () => {
    mockGetAllSync.mockReturnValue([]);

    await getCategories(mockDb, 'id');

    expect(mockGetAllSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['id']),
    );
  });

  it('maps snake_case DB columns to camelCase Category fields', async () => {
    mockGetAllSync.mockReturnValue([
      makeCategoryRow({ id: 5, slug: 'after-prayer', name_ar: 'أذكار بعد الصلاة', sort_order: 3, name: 'After Prayer' }),
    ]);

    const [cat] = await getCategories(mockDb, 'en');

    expect(cat.nameAr).toBe('أذكار بعد الصلاة');
    expect(cat.sortOrder).toBe(3);
  });

  it('returns a Promise', () => {
    mockGetAllSync.mockReturnValue([]);
    const result = getCategories(mockDb, 'en');
    expect(result).toBeInstanceOf(Promise);
  });
});

// ---------------------------------------------------------------------------
// getCategoryById
// ---------------------------------------------------------------------------

describe('getCategoryById()', () => {
  beforeEach(resetMocks);

  it('returns a Category when found', async () => {
    mockGetFirstSync.mockReturnValue(makeCategoryRow({ id: 3, slug: 'sleep', name: 'Before Sleep' }));

    const result = await getCategoryById(mockDb, 3, 'en');

    expect(result).not.toBeNull();
    expect(result!.id).toBe(3);
    expect(result!.slug).toBe('sleep');
    expect(result!.name).toBe('Before Sleep');
  });

  it('returns null when category is not found', async () => {
    mockGetFirstSync.mockReturnValue(null);

    const result = await getCategoryById(mockDb, 999, 'en');

    expect(result).toBeNull();
  });

  it('passes id and locale as query parameters', async () => {
    mockGetFirstSync.mockReturnValue(null);

    await getCategoryById(mockDb, 7, 'id');

    expect(mockGetFirstSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['id', 7]),
    );
  });

  it('maps all fields correctly', async () => {
    mockGetFirstSync.mockReturnValue(
      makeCategoryRow({ id: 2, slug: 'evening', name_ar: 'أذكار المساء', sort_order: 2, name: 'Petang' }),
    );

    const result = await getCategoryById(mockDb, 2, 'id');

    expect(result).toEqual<Category>({
      id: 2,
      slug: 'evening',
      nameAr: 'أذكار المساء',
      name: 'Petang',
      sortOrder: 2,
    });
  });
});

// ---------------------------------------------------------------------------
// getDhikrByCategory
// ---------------------------------------------------------------------------

describe('getDhikrByCategory()', () => {
  beforeEach(resetMocks);

  it('returns mapped Dhikr array for a category', async () => {
    mockGetAllSync.mockReturnValue([
      makeDhikrRow({ id: 1 }),
      makeDhikrRow({ id: 2, arabic_text: 'الحمد لله', translation: 'Praise be to Allah' }),
    ]);

    const result = await getDhikrByCategory(mockDb, 1, 'en');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].arabicText).toBe('الحمد لله');
  });

  it('returns empty array when category has no dhikr', async () => {
    mockGetAllSync.mockReturnValue([]);

    const result = await getDhikrByCategory(mockDb, 99, 'en');

    expect(result).toEqual([]);
  });

  it('sets translationFallback to false when locale translation exists', async () => {
    mockGetAllSync.mockReturnValue([makeDhikrRow({ translation_fallback: 0 })]);

    const [dhikr] = await getDhikrByCategory(mockDb, 1, 'en');

    expect(dhikr.translationFallback).toBe(false);
  });

  it('sets translationFallback to true when falling back to English', async () => {
    mockGetAllSync.mockReturnValue([makeDhikrRow({ translation_fallback: 1 })]);

    const [dhikr] = await getDhikrByCategory(mockDb, 1, 'id');

    expect(dhikr.translationFallback).toBe(true);
  });

  it('passes categoryId and locale as query parameters', async () => {
    mockGetAllSync.mockReturnValue([]);

    await getDhikrByCategory(mockDb, 5, 'id');

    expect(mockGetAllSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([5, 'id']),
    );
  });

  it('maps all Dhikr fields correctly', async () => {
    mockGetAllSync.mockReturnValue([
      makeDhikrRow({
        id: 10,
        arabic_text: 'سُبْحَانَ اللَّهِ',
        transliteration: 'Subhanallah',
        translation: 'Glory be to Allah',
        translation_fallback: 0,
        repetition_count: 33,
        source_type: 'hadith',
        surah_name: null,
        ayah_number: null,
        collection_name: 'Muslim',
        book_number: '2',
        hadith_number: '595',
        authenticity_grade: 'sahih',
        scholar_names: '["Al-Albani", "Ibn Baz"]',
        grading_rationale: 'Agreed upon',
        full_hadith_text: 'Full text...',
      }),
    ]);

    const [dhikr] = await getDhikrByCategory(mockDb, 1, 'en');

    expect(dhikr).toEqual<Dhikr>({
      id: 10,
      arabicText: 'سُبْحَانَ اللَّهِ',
      transliteration: 'Subhanallah',
      translation: 'Glory be to Allah',
      translationFallback: false,
      repetitionCount: 33,
      sourceType: 'hadith',
      surahName: null,
      ayahNumber: null,
      collectionName: 'Muslim',
      bookNumber: '2',
      hadithNumber: '595',
      authenticityGrade: 'sahih',
      scholarNames: ['Al-Albani', 'Ibn Baz'],
      gradingRationale: 'Agreed upon',
      fullHadithText: 'Full text...',
    });
  });

  it('handles null repetitionCount correctly (not 0)', async () => {
    mockGetAllSync.mockReturnValue([makeDhikrRow({ repetition_count: null })]);

    const [dhikr] = await getDhikrByCategory(mockDb, 1, 'en');

    expect(dhikr.repetitionCount).toBeNull();
  });

  it('handles null scholar_names gracefully (returns empty array)', async () => {
    mockGetAllSync.mockReturnValue([makeDhikrRow({ scholar_names: null })]);

    const [dhikr] = await getDhikrByCategory(mockDb, 1, 'en');

    expect(dhikr.scholarNames).toEqual([]);
  });

  it('handles invalid JSON in scholar_names gracefully', async () => {
    mockGetAllSync.mockReturnValue([makeDhikrRow({ scholar_names: 'not-valid-json' })]);

    const [dhikr] = await getDhikrByCategory(mockDb, 1, 'en');

    expect(dhikr.scholarNames).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getDhikrById
// ---------------------------------------------------------------------------

describe('getDhikrById()', () => {
  beforeEach(resetMocks);

  it('returns a Dhikr when found', async () => {
    mockGetFirstSync.mockReturnValue(makeDhikrRow({ id: 42 }));

    const result = await getDhikrById(mockDb, 42, 'en');

    expect(result).not.toBeNull();
    expect(result!.id).toBe(42);
  });

  it('returns null when dhikr is not found', async () => {
    mockGetFirstSync.mockReturnValue(null);

    const result = await getDhikrById(mockDb, 999, 'en');

    expect(result).toBeNull();
  });

  it('sets translationFallback to false when locale translation exists', async () => {
    mockGetFirstSync.mockReturnValue(makeDhikrRow({ translation_fallback: 0 }));

    const result = await getDhikrById(mockDb, 1, 'en');

    expect(result!.translationFallback).toBe(false);
  });

  it('sets translationFallback to true when falling back to English', async () => {
    mockGetFirstSync.mockReturnValue(makeDhikrRow({ translation_fallback: 1 }));

    const result = await getDhikrById(mockDb, 1, 'id');

    expect(result!.translationFallback).toBe(true);
  });

  it('translationFallback is a boolean, not a number', async () => {
    mockGetFirstSync.mockReturnValue(makeDhikrRow({ translation_fallback: 1 }));

    const result = await getDhikrById(mockDb, 1, 'id');

    expect(typeof result!.translationFallback).toBe('boolean');
  });

  it('passes id and locale as query parameters', async () => {
    mockGetFirstSync.mockReturnValue(null);

    await getDhikrById(mockDb, 15, 'id');

    expect(mockGetFirstSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['id', 15]),
    );
  });

  it('handles Qur\'an source type correctly', async () => {
    mockGetFirstSync.mockReturnValue(
      makeDhikrRow({
        source_type: 'quran',
        surah_name: 'Al-Fatiha',
        ayah_number: 1,
        collection_name: null,
        book_number: null,
        hadith_number: null,
      }),
    );

    const result = await getDhikrById(mockDb, 1, 'en');

    expect(result!.sourceType).toBe('quran');
    expect(result!.surahName).toBe('Al-Fatiha');
    expect(result!.ayahNumber).toBe(1);
    expect(result!.collectionName).toBeNull();
  });

  it('handles null transliteration correctly', async () => {
    mockGetFirstSync.mockReturnValue(makeDhikrRow({ transliteration: null }));

    const result = await getDhikrById(mockDb, 1, 'en');

    expect(result!.transliteration).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// searchDhikr
// ---------------------------------------------------------------------------

describe('searchDhikr()', () => {
  beforeEach(resetMocks);

  it('returns empty array for empty query string', async () => {
    const result = await searchDhikr(mockDb, '', 'en');

    expect(result).toEqual([]);
    expect(mockGetAllSync).not.toHaveBeenCalled();
  });

  it('returns empty array for whitespace-only query', async () => {
    const result = await searchDhikr(mockDb, '   ', 'en');

    expect(result).toEqual([]);
    expect(mockGetAllSync).not.toHaveBeenCalled();
  });

  it('returns matching dhikr results for a valid query', async () => {
    // First call: FTS5 returns matching IDs
    mockGetAllSync
      .mockReturnValueOnce([{ dhikr_id: 1 }, { dhikr_id: 2 }])
      // Second call: full dhikr rows for those IDs
      .mockReturnValueOnce([
        makeDhikrRow({ id: 1 }),
        makeDhikrRow({ id: 2, arabic_text: 'الحمد لله' }),
      ]);

    const result = await searchDhikr(mockDb, 'bismillah', 'en');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].arabicText).toBe('الحمد لله');
  });

  it('returns empty array when FTS5 finds no matches', async () => {
    // FTS5 returns no IDs
    mockGetAllSync.mockReturnValueOnce([]);

    const result = await searchDhikr(mockDb, 'nonexistent', 'en');

    expect(result).toEqual([]);
    // Should not make a second DB call for full rows
    expect(mockGetAllSync).toHaveBeenCalledTimes(1);
  });

  it('falls back to LIKE search when FTS5 throws an error', async () => {
    // First call: FTS5 throws
    mockGetAllSync
      .mockImplementationOnce(() => { throw new Error('FTS5 error'); })
      // Second call: LIKE search returns IDs
      .mockReturnValueOnce([{ id: 3 }])
      // Third call: full dhikr rows
      .mockReturnValueOnce([makeDhikrRow({ id: 3 })]);

    const result = await searchDhikr(mockDb, 'subhan', 'en');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  it('returns empty array when LIKE fallback also finds no matches', async () => {
    mockGetAllSync
      .mockImplementationOnce(() => { throw new Error('FTS5 error'); })
      .mockReturnValueOnce([]); // LIKE returns nothing

    const result = await searchDhikr(mockDb, 'xyz', 'en');

    expect(result).toEqual([]);
  });

  it('passes locale to the full dhikr fetch query', async () => {
    mockGetAllSync
      .mockReturnValueOnce([{ dhikr_id: 1 }])
      .mockReturnValueOnce([makeDhikrRow({ id: 1 })]);

    await searchDhikr(mockDb, 'test', 'id');

    // The second getAllSync call (full dhikr fetch) should include locale
    const secondCallArgs = mockGetAllSync.mock.calls[1];
    expect(secondCallArgs[1]).toContain('id');
  });

  it('sets translationFallback correctly in search results', async () => {
    mockGetAllSync
      .mockReturnValueOnce([{ dhikr_id: 5 }])
      .mockReturnValueOnce([makeDhikrRow({ id: 5, translation_fallback: 1 })]);

    const result = await searchDhikr(mockDb, 'test', 'id');

    expect(result[0].translationFallback).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getAllDhikrIds
// ---------------------------------------------------------------------------

describe('getAllDhikrIds()', () => {
  beforeEach(resetMocks);

  it('returns an array of dhikr IDs', async () => {
    mockGetAllSync.mockReturnValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

    const result = await getAllDhikrIds(mockDb);

    expect(result).toEqual([1, 2, 3]);
  });

  it('returns empty array when no dhikr exist', async () => {
    mockGetAllSync.mockReturnValue([]);

    const result = await getAllDhikrIds(mockDb);

    expect(result).toEqual([]);
  });

  it('returns numbers, not objects', async () => {
    mockGetAllSync.mockReturnValue([{ id: 10 }, { id: 20 }]);

    const result = await getAllDhikrIds(mockDb);

    expect(typeof result[0]).toBe('number');
    expect(typeof result[1]).toBe('number');
  });

  it('returns a Promise', () => {
    mockGetAllSync.mockReturnValue([]);
    const result = getAllDhikrIds(mockDb);
    expect(result).toBeInstanceOf(Promise);
  });

  it('queries the dhikr table ordered by id', async () => {
    mockGetAllSync.mockReturnValue([]);

    await getAllDhikrIds(mockDb);

    expect(mockGetAllSync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY id ASC'),
      expect.anything(),
    );
  });
});

// ---------------------------------------------------------------------------
// getFavoriteIds
// ---------------------------------------------------------------------------

describe('getFavoriteIds()', () => {
  beforeEach(resetMocks);

  it('returns an array of dhikr IDs from favorites', async () => {
    mockGetAllSync.mockReturnValue([{ dhikr_id: 3 }, { dhikr_id: 7 }, { dhikr_id: 12 }]);

    const result = await getFavoriteIds(mockDb);

    expect(result).toEqual([3, 7, 12]);
  });

  it('returns empty array when no favorites exist', async () => {
    mockGetAllSync.mockReturnValue([]);

    const result = await getFavoriteIds(mockDb);

    expect(result).toEqual([]);
  });

  it('returns numbers, not objects', async () => {
    mockGetAllSync.mockReturnValue([{ dhikr_id: 5 }]);

    const result = await getFavoriteIds(mockDb);

    expect(typeof result[0]).toBe('number');
  });

  it('returns a Promise', () => {
    mockGetAllSync.mockReturnValue([]);
    expect(getFavoriteIds(mockDb)).toBeInstanceOf(Promise);
  });
});

// ---------------------------------------------------------------------------
// addFavorite
// ---------------------------------------------------------------------------

describe('addFavorite()', () => {
  beforeEach(resetMocks);

  it('calls runSync with the correct dhikr ID', async () => {
    await addFavorite(mockDb, 42);

    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, params] = mockRunSync.mock.calls[0];
    expect(sql).toContain('INSERT OR IGNORE INTO favorites');
    expect(params[0]).toBe(42);
  });

  it('includes a timestamp as the second parameter', async () => {
    const before = Date.now();
    await addFavorite(mockDb, 1);
    const after = Date.now();

    const params = mockRunSync.mock.calls[0][1];
    expect(params[1]).toBeGreaterThanOrEqual(before);
    expect(params[1]).toBeLessThanOrEqual(after);
  });

  it('returns a Promise that resolves to undefined', async () => {
    const result = await addFavorite(mockDb, 1);
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// removeFavorite
// ---------------------------------------------------------------------------

describe('removeFavorite()', () => {
  beforeEach(resetMocks);

  it('calls runSync with DELETE and the correct dhikr ID', async () => {
    await removeFavorite(mockDb, 99);

    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, params] = mockRunSync.mock.calls[0];
    expect(sql).toContain('DELETE FROM favorites');
    expect(params[0]).toBe(99);
  });

  it('returns a Promise that resolves to undefined', async () => {
    const result = await removeFavorite(mockDb, 1);
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getStreak
// ---------------------------------------------------------------------------

describe('getStreak()', () => {
  beforeEach(resetMocks);

  it('returns streak data when the row exists', async () => {
    mockGetFirstSync.mockReturnValue({
      current_streak: 7,
      last_checkin: '2026-05-08',
      longest_streak: 14,
    });

    const result = await getStreak(mockDb);

    expect(result).toEqual<StreakData>({
      currentStreak: 7,
      lastCheckin: '2026-05-08',
      longestStreak: 14,
    });
  });

  it('returns zero defaults when no streak row exists', async () => {
    mockGetFirstSync.mockReturnValue(null);

    const result = await getStreak(mockDb);

    expect(result).toEqual<StreakData>({
      currentStreak: 0,
      lastCheckin: null,
      longestStreak: 0,
    });
  });

  it('maps snake_case columns to camelCase fields', async () => {
    mockGetFirstSync.mockReturnValue({
      current_streak: 3,
      last_checkin: '2026-01-01',
      longest_streak: 10,
    });

    const result = await getStreak(mockDb);

    expect(result.currentStreak).toBe(3);
    expect(result.lastCheckin).toBe('2026-01-01');
    expect(result.longestStreak).toBe(10);
  });

  it('returns a Promise', () => {
    mockGetFirstSync.mockReturnValue(null);
    expect(getStreak(mockDb)).toBeInstanceOf(Promise);
  });
});

// ---------------------------------------------------------------------------
// upsertStreak
// ---------------------------------------------------------------------------

describe('upsertStreak()', () => {
  beforeEach(resetMocks);

  it('calls runSync with INSERT OR REPLACE and correct values', async () => {
    const data: StreakData = {
      currentStreak: 5,
      lastCheckin: '2026-05-08',
      longestStreak: 10,
    };

    await upsertStreak(mockDb, data);

    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, params] = mockRunSync.mock.calls[0];
    expect(sql).toContain('INSERT OR REPLACE INTO streak');
    expect(params).toEqual([5, '2026-05-08', 10]);
  });

  it('handles null lastCheckin', async () => {
    await upsertStreak(mockDb, { currentStreak: 0, lastCheckin: null, longestStreak: 0 });

    const params = mockRunSync.mock.calls[0][1];
    expect(params[1]).toBeNull();
  });

  it('returns a Promise that resolves to undefined', async () => {
    const result = await upsertStreak(mockDb, { currentStreak: 1, lastCheckin: '2026-01-01', longestStreak: 1 });
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getBadges
// ---------------------------------------------------------------------------

describe('getBadges()', () => {
  beforeEach(resetMocks);

  it('returns mapped Badge array', async () => {
    mockGetAllSync.mockReturnValue([
      { milestone: 7, earned_at: 1000, reward_claimed: 0 },
      { milestone: 30, earned_at: 2000, reward_claimed: 1 },
    ]);

    const result = await getBadges(mockDb);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual<Badge>({ milestone: 7, earnedAt: 1000, rewardClaimed: false });
    expect(result[1]).toEqual<Badge>({ milestone: 30, earnedAt: 2000, rewardClaimed: true });
  });

  it('returns empty array when no badges earned', async () => {
    mockGetAllSync.mockReturnValue([]);

    const result = await getBadges(mockDb);

    expect(result).toEqual([]);
  });

  it('converts reward_claimed integer to boolean', async () => {
    mockGetAllSync.mockReturnValue([
      { milestone: 100, earned_at: 9999, reward_claimed: 0 },
    ]);

    const [badge] = await getBadges(mockDb);

    expect(typeof badge.rewardClaimed).toBe('boolean');
    expect(badge.rewardClaimed).toBe(false);
  });

  it('returns a Promise', () => {
    mockGetAllSync.mockReturnValue([]);
    expect(getBadges(mockDb)).toBeInstanceOf(Promise);
  });
});

// ---------------------------------------------------------------------------
// upsertBadge
// ---------------------------------------------------------------------------

describe('upsertBadge()', () => {
  beforeEach(resetMocks);

  it('calls runSync with INSERT OR REPLACE and correct values', async () => {
    const badge: Badge = { milestone: 7, earnedAt: 1234567890, rewardClaimed: false };

    await upsertBadge(mockDb, badge);

    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, params] = mockRunSync.mock.calls[0];
    expect(sql).toContain('INSERT OR REPLACE INTO badges');
    expect(params).toEqual([7, 1234567890, 0]);
  });

  it('converts rewardClaimed boolean to integer (true → 1)', async () => {
    await upsertBadge(mockDb, { milestone: 30, earnedAt: 100, rewardClaimed: true });

    const params = mockRunSync.mock.calls[0][1];
    expect(params[2]).toBe(1);
  });

  it('converts rewardClaimed boolean to integer (false → 0)', async () => {
    await upsertBadge(mockDb, { milestone: 100, earnedAt: 200, rewardClaimed: false });

    const params = mockRunSync.mock.calls[0][1];
    expect(params[2]).toBe(0);
  });

  it('returns a Promise that resolves to undefined', async () => {
    const result = await upsertBadge(mockDb, { milestone: 7, earnedAt: 1, rewardClaimed: false });
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getTodos
// ---------------------------------------------------------------------------

describe('getTodos()', () => {
  beforeEach(resetMocks);

  it('returns mapped TodoItem array', async () => {
    mockGetAllSync.mockReturnValue([
      {
        id: 'uuid-1',
        title: 'Read Quran',
        notes: 'After Fajr',
        completed: 0,
        created_at: 1000,
        updated_at: 1001,
        deleted_at: null,
      },
    ]);

    const result = await getTodos(mockDb);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual<TodoItem>({
      id: 'uuid-1',
      title: 'Read Quran',
      notes: 'After Fajr',
      completed: false,
      createdAt: 1000,
      updatedAt: 1001,
      deletedAt: null,
    });
  });

  it('returns empty array when no todos exist', async () => {
    mockGetAllSync.mockReturnValue([]);

    const result = await getTodos(mockDb);

    expect(result).toEqual([]);
  });

  it('excludes soft-deleted items via SQL (deleted_at IS NULL)', async () => {
    await getTodos(mockDb);

    const sql: string = mockGetAllSync.mock.calls[0][0];
    expect(sql).toContain('deleted_at IS NULL');
  });

  it('converts completed integer to boolean', async () => {
    mockGetAllSync.mockReturnValue([
      { id: 'x', title: 'Done', notes: null, completed: 1, created_at: 1, updated_at: 2, deleted_at: null },
    ]);

    const [item] = await getTodos(mockDb);

    expect(typeof item.completed).toBe('boolean');
    expect(item.completed).toBe(true);
  });

  it('handles null notes correctly', async () => {
    mockGetAllSync.mockReturnValue([
      { id: 'y', title: 'No notes', notes: null, completed: 0, created_at: 1, updated_at: 1, deleted_at: null },
    ]);

    const [item] = await getTodos(mockDb);

    expect(item.notes).toBeNull();
  });

  it('returns a Promise', () => {
    mockGetAllSync.mockReturnValue([]);
    expect(getTodos(mockDb)).toBeInstanceOf(Promise);
  });
});

// ---------------------------------------------------------------------------
// upsertTodo
// ---------------------------------------------------------------------------

describe('upsertTodo()', () => {
  beforeEach(resetMocks);

  it('calls runSync with INSERT OR REPLACE and all fields', async () => {
    const item: TodoItem = {
      id: 'uuid-abc',
      title: 'Morning dhikr',
      notes: 'Before sunrise',
      completed: false,
      createdAt: 1000,
      updatedAt: 1001,
      deletedAt: null,
    };

    await upsertTodo(mockDb, item);

    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, params] = mockRunSync.mock.calls[0];
    expect(sql).toContain('INSERT OR REPLACE INTO todos');
    expect(params).toEqual(['uuid-abc', 'Morning dhikr', 'Before sunrise', 0, 1000, 1001, null]);
  });

  it('converts completed boolean to integer (true → 1)', async () => {
    const item: TodoItem = {
      id: 'x', title: 'Done', notes: null, completed: true,
      createdAt: 1, updatedAt: 2, deletedAt: null,
    };

    await upsertTodo(mockDb, item);

    const params = mockRunSync.mock.calls[0][1];
    expect(params[3]).toBe(1);
  });

  it('stores deletedAt timestamp when item is soft-deleted', async () => {
    const item: TodoItem = {
      id: 'z', title: 'Deleted', notes: null, completed: false,
      createdAt: 1, updatedAt: 2, deletedAt: 9999,
    };

    await upsertTodo(mockDb, item);

    const params = mockRunSync.mock.calls[0][1];
    expect(params[6]).toBe(9999);
  });

  it('returns a Promise that resolves to undefined', async () => {
    const item: TodoItem = {
      id: 'a', title: 'T', notes: null, completed: false,
      createdAt: 1, updatedAt: 1, deletedAt: null,
    };
    const result = await upsertTodo(mockDb, item);
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// softDeleteTodo
// ---------------------------------------------------------------------------

describe('softDeleteTodo()', () => {
  beforeEach(resetMocks);

  it('calls runSync with UPDATE setting deleted_at and updated_at', async () => {
    const before = Date.now();
    await softDeleteTodo(mockDb, 'uuid-del');
    const after = Date.now();

    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, params] = mockRunSync.mock.calls[0];
    expect(sql).toContain('UPDATE todos');
    expect(sql).toContain('deleted_at');
    expect(params[0]).toBeGreaterThanOrEqual(before);
    expect(params[0]).toBeLessThanOrEqual(after);
    expect(params[2]).toBe('uuid-del');
  });

  it('also updates updated_at to the same timestamp', async () => {
    await softDeleteTodo(mockDb, 'some-id');

    const params = mockRunSync.mock.calls[0][1];
    // params[0] = deleted_at, params[1] = updated_at, params[2] = id
    expect(params[0]).toBe(params[1]);
  });

  it('returns a Promise that resolves to undefined', async () => {
    const result = await softDeleteTodo(mockDb, 'id');
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getSetting
// ---------------------------------------------------------------------------

describe('getSetting()', () => {
  beforeEach(resetMocks);

  it('returns the value when the key exists', async () => {
    mockGetFirstSync.mockReturnValue({ value: 'en' });

    const result = await getSetting(mockDb, 'language');

    expect(result).toBe('en');
  });

  it('returns null when the key does not exist', async () => {
    mockGetFirstSync.mockReturnValue(null);

    const result = await getSetting(mockDb, 'nonexistent_key');

    expect(result).toBeNull();
  });

  it('passes the key as a query parameter', async () => {
    mockGetFirstSync.mockReturnValue(null);

    await getSetting(mockDb, 'text_size');

    expect(mockGetFirstSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['text_size']),
    );
  });

  it('returns a Promise', () => {
    mockGetFirstSync.mockReturnValue(null);
    expect(getSetting(mockDb, 'k')).toBeInstanceOf(Promise);
  });
});

// ---------------------------------------------------------------------------
// setSetting
// ---------------------------------------------------------------------------

describe('setSetting()', () => {
  beforeEach(resetMocks);

  it('calls runSync with INSERT OR REPLACE and key/value', async () => {
    await setSetting(mockDb, 'language', 'id');

    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, params] = mockRunSync.mock.calls[0];
    expect(sql).toContain('INSERT OR REPLACE INTO settings');
    expect(params).toEqual(['language', 'id']);
  });

  it('returns a Promise that resolves to undefined', async () => {
    const result = await setSetting(mockDb, 'k', 'v');
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getCheckinHistory
// ---------------------------------------------------------------------------

describe('getCheckinHistory()', () => {
  beforeEach(resetMocks);

  it('returns an array of date strings', async () => {
    mockGetAllSync.mockReturnValue([
      { date: '2026-05-06' },
      { date: '2026-05-07' },
      { date: '2026-05-08' },
    ]);

    const result = await getCheckinHistory(mockDb);

    expect(result).toEqual(['2026-05-06', '2026-05-07', '2026-05-08']);
  });

  it('returns empty array when no check-ins recorded', async () => {
    mockGetAllSync.mockReturnValue([]);

    const result = await getCheckinHistory(mockDb);

    expect(result).toEqual([]);
  });

  it('returns strings, not objects', async () => {
    mockGetAllSync.mockReturnValue([{ date: '2026-01-01' }]);

    const result = await getCheckinHistory(mockDb);

    expect(typeof result[0]).toBe('string');
  });

  it('queries checkin_history ordered by date ASC', async () => {
    mockGetAllSync.mockReturnValue([]);

    await getCheckinHistory(mockDb);

    expect(mockGetAllSync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY date ASC'),
      expect.anything(),
    );
  });

  it('returns a Promise', () => {
    mockGetAllSync.mockReturnValue([]);
    expect(getCheckinHistory(mockDb)).toBeInstanceOf(Promise);
  });
});

// ---------------------------------------------------------------------------
// recordCheckin
// ---------------------------------------------------------------------------

describe('recordCheckin()', () => {
  beforeEach(resetMocks);

  it('calls runSync with INSERT OR IGNORE and correct date/timestamp', async () => {
    await recordCheckin(mockDb, '2026-05-08', 1746700800000);

    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, params] = mockRunSync.mock.calls[0];
    expect(sql).toContain('INSERT OR IGNORE INTO checkin_history');
    expect(params).toEqual(['2026-05-08', 1746700800000]);
  });

  it('uses INSERT OR IGNORE to prevent duplicate check-ins', async () => {
    await recordCheckin(mockDb, '2026-05-08', 1000);

    const sql: string = mockRunSync.mock.calls[0][0];
    expect(sql).toContain('INSERT OR IGNORE');
  });

  it('returns a Promise that resolves to undefined', async () => {
    const result = await recordCheckin(mockDb, '2026-01-01', 1000);
    expect(result).toBeUndefined();
  });
});
