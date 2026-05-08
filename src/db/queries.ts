/**
 * Content and user database query functions for the Muslim Dhikr App.
 *
 * All SQL is isolated in this file — no raw SQL elsewhere in the codebase.
 * All functions return Promises but use the synchronous expo-sqlite v14 API
 * internally (wrapped in Promise.resolve()).
 *
 * Translation fallback: if a translation row for the requested locale is
 * missing, the query falls back to 'en' and sets `translationFallback: true`.
 *
 * Requirements: 1.2, 2.3, 2.4, 3.2, 3.3, 7.2, 7.4, 10.4, 11.2, 14.8, 17.6
 */

import * as SQLite from 'expo-sqlite';
import type { Category, Dhikr, AuthenticityGrade, SourceType } from '../types/content';
import type { Badge, StreakData, TodoItem } from '../types/user';

// ---------------------------------------------------------------------------
// Internal raw row types (snake_case from SQLite)
// ---------------------------------------------------------------------------

interface RawCategoryRow {
  id: number;
  slug: string;
  name_ar: string;
  sort_order: number;
  name: string; // translated name (COALESCE of locale + en)
}

interface RawDhikrRow {
  id: number;
  arabic_text: string;
  transliteration: string | null;
  translation: string;
  translation_fallback: number; // 0 or 1 from SQLite
  repetition_count: number | null;
  source_type: string;
  surah_name: string | null;
  ayah_number: number | null;
  collection_name: string | null;
  book_number: string | null;
  hadith_number: string | null;
  authenticity_grade: string;
  scholar_names: string | null; // JSON array string
  grading_rationale: string | null;
  full_hadith_text: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parses the `scholar_names` JSON array string stored in the DB.
 * Returns an empty array if the value is null or invalid JSON.
 */
function parseScholarNames(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
    return [];
  } catch {
    return [];
  }
}

/**
 * Maps a raw snake_case DB row to the camelCase `Dhikr` interface.
 */
function rowToDhikr(row: RawDhikrRow): Dhikr {
  return {
    id: row.id,
    arabicText: row.arabic_text,
    transliteration: row.transliteration ?? null,
    translation: row.translation,
    translationFallback: row.translation_fallback === 1,
    repetitionCount: row.repetition_count ?? null,
    sourceType: row.source_type as SourceType,
    surahName: row.surah_name ?? null,
    ayahNumber: row.ayah_number ?? null,
    collectionName: row.collection_name ?? null,
    bookNumber: row.book_number ?? null,
    hadithNumber: row.hadith_number ?? null,
    authenticityGrade: row.authenticity_grade as AuthenticityGrade,
    scholarNames: parseScholarNames(row.scholar_names),
    gradingRationale: row.grading_rationale ?? null,
    fullHadithText: row.full_hadith_text ?? null,
  };
}

// ---------------------------------------------------------------------------
// SQL fragments (reused across queries)
// ---------------------------------------------------------------------------

/**
 * SELECT columns for a full dhikr row with translation fallback.
 * Requires the following table aliases in the FROM/JOIN clause:
 *   d          → dhikr
 *   dt_locale  → dhikr_translations for the requested locale
 *   dt_en      → dhikr_translations for 'en'
 */
const DHIKR_SELECT = `
  d.id,
  d.arabic_text,
  d.transliteration,
  COALESCE(dt_locale.translation, dt_en.translation, '') AS translation,
  CASE WHEN dt_locale.translation IS NULL THEN 1 ELSE 0 END AS translation_fallback,
  d.repetition_count,
  d.source_type,
  d.surah_name,
  d.ayah_number,
  d.collection_name,
  d.book_number,
  d.hadith_number,
  d.authenticity_grade,
  d.scholar_names,
  d.grading_rationale,
  d.full_hadith_text
`;

/**
 * LEFT JOINs for dhikr translation with locale fallback.
 * Requires `locale` and `'en'` to be bound as parameters (in that order).
 */
const DHIKR_TRANSLATION_JOINS = `
  LEFT JOIN dhikr_translations dt_locale
    ON dt_locale.dhikr_id = d.id AND dt_locale.locale = ?
  LEFT JOIN dhikr_translations dt_en
    ON dt_en.dhikr_id = d.id AND dt_en.locale = 'en'
`;

// ---------------------------------------------------------------------------
// Category queries
// ---------------------------------------------------------------------------

/**
 * Returns all categories with translated names for the given locale.
 * Falls back to 'en' if no translation exists for the requested locale.
 */
export function getCategories(
  db: SQLite.SQLiteDatabase,
  locale: string,
): Promise<Category[]> {
  const sql = `
    SELECT
      c.id,
      c.slug,
      c.name_ar,
      c.sort_order,
      COALESCE(ct_locale.name, ct_en.name, '') AS name
    FROM categories c
    LEFT JOIN category_translations ct_locale
      ON ct_locale.category_id = c.id AND ct_locale.locale = ?
    LEFT JOIN category_translations ct_en
      ON ct_en.category_id = c.id AND ct_en.locale = 'en'
    ORDER BY c.sort_order ASC, c.id ASC
  `;

  const rows = db.getAllSync(sql, [locale]) as RawCategoryRow[];
  const categories: Category[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    nameAr: row.name_ar,
    name: row.name,
    sortOrder: row.sort_order,
  }));

  return Promise.resolve(categories);
}

/**
 * Returns a single category by ID with a translated name, or null if not found.
 * Falls back to 'en' if no translation exists for the requested locale.
 */
export function getCategoryById(
  db: SQLite.SQLiteDatabase,
  id: number,
  locale: string,
): Promise<Category | null> {
  const sql = `
    SELECT
      c.id,
      c.slug,
      c.name_ar,
      c.sort_order,
      COALESCE(ct_locale.name, ct_en.name, '') AS name
    FROM categories c
    LEFT JOIN category_translations ct_locale
      ON ct_locale.category_id = c.id AND ct_locale.locale = ?
    LEFT JOIN category_translations ct_en
      ON ct_en.category_id = c.id AND ct_en.locale = 'en'
    WHERE c.id = ?
  `;

  const row = db.getFirstSync(sql, [locale, id]) as RawCategoryRow | null;
  if (!row) return Promise.resolve(null);

  const category: Category = {
    id: row.id,
    slug: row.slug,
    nameAr: row.name_ar,
    name: row.name,
    sortOrder: row.sort_order,
  };

  return Promise.resolve(category);
}

// ---------------------------------------------------------------------------
// Dhikr queries
// ---------------------------------------------------------------------------

/**
 * Returns all dhikr entries for a given category, ordered by sort_order.
 * Includes translation fallback to 'en'.
 */
export function getDhikrByCategory(
  db: SQLite.SQLiteDatabase,
  categoryId: number,
  locale: string,
): Promise<Dhikr[]> {
  const sql = `
    SELECT ${DHIKR_SELECT}
    FROM dhikr d
    INNER JOIN category_dhikr cd ON cd.dhikr_id = d.id AND cd.category_id = ?
    ${DHIKR_TRANSLATION_JOINS}
    ORDER BY cd.sort_order ASC, d.id ASC
  `;

  const rows = db.getAllSync(sql, [categoryId, locale]) as RawDhikrRow[];
  return Promise.resolve(rows.map(rowToDhikr));
}

/**
 * Returns a single dhikr entry by ID with translation fallback to 'en'.
 * Returns null if the dhikr does not exist.
 */
export function getDhikrById(
  db: SQLite.SQLiteDatabase,
  id: number,
  locale: string,
): Promise<Dhikr | null> {
  const sql = `
    SELECT ${DHIKR_SELECT}
    FROM dhikr d
    ${DHIKR_TRANSLATION_JOINS}
    WHERE d.id = ?
  `;

  const row = db.getFirstSync(sql, [locale, id]) as RawDhikrRow | null;
  if (!row) return Promise.resolve(null);

  return Promise.resolve(rowToDhikr(row));
}

/**
 * Searches dhikr using the FTS5 virtual table for the given query string.
 * Falls back to a LIKE-based search if the FTS5 query throws an error.
 * Returns full Dhikr objects with translation fallback.
 */
export function searchDhikr(
  db: SQLite.SQLiteDatabase,
  query: string,
  locale: string,
): Promise<Dhikr[]> {
  if (!query || !query.trim()) {
    return Promise.resolve([]);
  }

  let matchingIds: number[] = [];

  // Try FTS5 search first
  try {
    // Escape double-quotes in the query and wrap for phrase prefix matching
    const ftsQuery = '"' + query.replace(/"/g, '""') + '"*';
    const ftsRows = db.getAllSync(
      'SELECT DISTINCT dhikr_id FROM dhikr_fts WHERE dhikr_fts MATCH ? ORDER BY rank',
      [ftsQuery],
    ) as Array<{ dhikr_id: number }>;
    matchingIds = ftsRows.map((r) => r.dhikr_id);
  } catch {
    // FTS5 failed (e.g., tokenizer issue with Arabic) — fall back to LIKE search
    const likeParam = '%' + query + '%';
    const likeRows = db.getAllSync(
      `SELECT DISTINCT d.id
       FROM dhikr d
       LEFT JOIN dhikr_translations dt ON dt.dhikr_id = d.id
       WHERE d.arabic_text LIKE ?
          OR d.transliteration LIKE ?
          OR dt.translation LIKE ?`,
      [likeParam, likeParam, likeParam],
    ) as Array<{ id: number }>;
    matchingIds = likeRows.map((r) => r.id);
  }

  if (matchingIds.length === 0) {
    return Promise.resolve([]);
  }

  // Fetch full dhikr data for matching IDs with translation fallback
  const placeholders = matchingIds.map(() => '?').join(', ');
  const sql = `
    SELECT ${DHIKR_SELECT}
    FROM dhikr d
    ${DHIKR_TRANSLATION_JOINS}
    WHERE d.id IN (${placeholders})
  `;

  const rows = db.getAllSync(sql, [locale, ...matchingIds]) as RawDhikrRow[];
  return Promise.resolve(rows.map(rowToDhikr));
}

/**
 * Returns all dhikr IDs in the database.
 * Used for notification rotation (cycling through dhikr for daily reminders).
 */
export function getAllDhikrIds(db: SQLite.SQLiteDatabase): Promise<number[]> {
  const rows = db.getAllSync(
    'SELECT id FROM dhikr ORDER BY id ASC',
    [],
  ) as Array<{ id: number }>;
  return Promise.resolve(rows.map((r) => r.id));
}

// ---------------------------------------------------------------------------
// Favorites queries (Requirement 10.4)
// ---------------------------------------------------------------------------

/**
 * Returns all favorited dhikr IDs, ordered by the time they were added
 * (most recent first).
 */
export function getFavoriteIds(db: SQLite.SQLiteDatabase): Promise<number[]> {
  const rows = db.getAllSync(
    'SELECT dhikr_id FROM favorites ORDER BY added_at DESC',
    [],
  ) as Array<{ dhikr_id: number }>;
  return Promise.resolve(rows.map((r) => r.dhikr_id));
}

/**
 * Adds a dhikr to the favorites list.
 * Uses INSERT OR IGNORE so calling it twice for the same ID is safe.
 */
export function addFavorite(
  db: SQLite.SQLiteDatabase,
  dhikrId: number,
): Promise<void> {
  db.runSync(
    'INSERT OR IGNORE INTO favorites (dhikr_id, added_at) VALUES (?, ?)',
    [dhikrId, Date.now()],
  );
  return Promise.resolve();
}

/**
 * Removes a dhikr from the favorites list.
 * No-op if the dhikr was not favorited.
 */
export function removeFavorite(
  db: SQLite.SQLiteDatabase,
  dhikrId: number,
): Promise<void> {
  db.runSync('DELETE FROM favorites WHERE dhikr_id = ?', [dhikrId]);
  return Promise.resolve();
}

// ---------------------------------------------------------------------------
// Streak queries (Requirement 14.8)
// ---------------------------------------------------------------------------

/**
 * Returns the current streak data from the singleton streak row.
 * Always returns a valid StreakData object (defaults to zeros/null if the
 * row has never been written).
 */
export function getStreak(db: SQLite.SQLiteDatabase): Promise<StreakData> {
  const row = db.getFirstSync(
    'SELECT current_streak, last_checkin, longest_streak FROM streak WHERE id = 1',
    [],
  ) as { current_streak: number; last_checkin: string | null; longest_streak: number } | null;

  if (!row) {
    return Promise.resolve({
      currentStreak: 0,
      lastCheckin: null,
      longestStreak: 0,
    });
  }

  return Promise.resolve({
    currentStreak: row.current_streak,
    lastCheckin: row.last_checkin,
    longestStreak: row.longest_streak,
  });
}

/**
 * Upserts the singleton streak row with the provided data.
 * Uses INSERT OR REPLACE to handle both first-write and update cases.
 */
export function upsertStreak(
  db: SQLite.SQLiteDatabase,
  data: StreakData,
): Promise<void> {
  db.runSync(
    `INSERT OR REPLACE INTO streak (id, current_streak, last_checkin, longest_streak)
     VALUES (1, ?, ?, ?)`,
    [data.currentStreak, data.lastCheckin, data.longestStreak],
  );
  return Promise.resolve();
}

// ---------------------------------------------------------------------------
// Badge queries (Requirement 14.8)
// ---------------------------------------------------------------------------

/**
 * Returns all earned badges, ordered by milestone ascending.
 */
export function getBadges(db: SQLite.SQLiteDatabase): Promise<Badge[]> {
  const rows = db.getAllSync(
    'SELECT milestone, earned_at, reward_claimed FROM badges ORDER BY milestone ASC',
    [],
  ) as Array<{ milestone: number; earned_at: number; reward_claimed: number }>;

  const badges: Badge[] = rows.map((row) => ({
    milestone: row.milestone as 7 | 30 | 100,
    earnedAt: row.earned_at,
    rewardClaimed: row.reward_claimed === 1,
  }));

  return Promise.resolve(badges);
}

/**
 * Inserts or replaces a badge record.
 * Uses INSERT OR REPLACE so it is safe to call for an already-earned milestone.
 */
export function upsertBadge(
  db: SQLite.SQLiteDatabase,
  badge: Badge,
): Promise<void> {
  db.runSync(
    `INSERT OR REPLACE INTO badges (milestone, earned_at, reward_claimed)
     VALUES (?, ?, ?)`,
    [badge.milestone, badge.earnedAt, badge.rewardClaimed ? 1 : 0],
  );
  return Promise.resolve();
}

// ---------------------------------------------------------------------------
// To-Do queries (Requirement 17.6)
// ---------------------------------------------------------------------------

/**
 * Returns all non-deleted to-do items, ordered by creation time ascending.
 * Soft-deleted items (deleted_at IS NOT NULL) are excluded.
 */
export function getTodos(db: SQLite.SQLiteDatabase): Promise<TodoItem[]> {
  const rows = db.getAllSync(
    `SELECT id, title, notes, completed, created_at, updated_at, deleted_at
     FROM todos
     WHERE deleted_at IS NULL
     ORDER BY created_at ASC`,
    [],
  ) as Array<{
    id: string;
    title: string;
    notes: string | null;
    completed: number;
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
  }>;

  const items: TodoItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    notes: row.notes,
    completed: row.completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  }));

  return Promise.resolve(items);
}

/**
 * Inserts or replaces a to-do item.
 * Uses INSERT OR REPLACE so it handles both create and update.
 */
export function upsertTodo(
  db: SQLite.SQLiteDatabase,
  item: TodoItem,
): Promise<void> {
  db.runSync(
    `INSERT OR REPLACE INTO todos
       (id, title, notes, completed, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.title,
      item.notes,
      item.completed ? 1 : 0,
      item.createdAt,
      item.updatedAt,
      item.deletedAt,
    ],
  );
  return Promise.resolve();
}

/**
 * Soft-deletes a to-do item by setting its deleted_at timestamp.
 * The item remains in the database as a tombstone for sync purposes.
 */
export function softDeleteTodo(
  db: SQLite.SQLiteDatabase,
  id: string,
): Promise<void> {
  db.runSync(
    'UPDATE todos SET deleted_at = ?, updated_at = ? WHERE id = ?',
    [Date.now(), Date.now(), id],
  );
  return Promise.resolve();
}

// ---------------------------------------------------------------------------
// Settings queries
// ---------------------------------------------------------------------------

/**
 * Returns the value for a settings key, or null if the key does not exist.
 */
export function getSetting(
  db: SQLite.SQLiteDatabase,
  key: string,
): Promise<string | null> {
  const row = db.getFirstSync(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  ) as { value: string } | null;

  return Promise.resolve(row ? row.value : null);
}

/**
 * Inserts or updates a settings key-value pair.
 */
export function setSetting(
  db: SQLite.SQLiteDatabase,
  key: string,
  value: string,
): Promise<void> {
  db.runSync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value],
  );
  return Promise.resolve();
}

// ---------------------------------------------------------------------------
// Check-in history queries (Requirement 14.8)
// ---------------------------------------------------------------------------

/**
 * Returns all check-in dates as 'YYYY-MM-DD' strings, ordered ascending.
 */
export function getCheckinHistory(
  db: SQLite.SQLiteDatabase,
): Promise<string[]> {
  const rows = db.getAllSync(
    'SELECT date FROM checkin_history ORDER BY date ASC',
    [],
  ) as Array<{ date: string }>;

  return Promise.resolve(rows.map((r) => r.date));
}

/**
 * Records a check-in for the given date.
 * Uses INSERT OR IGNORE so duplicate check-ins on the same day are silently
 * discarded — the first check-in of the day wins.
 */
export function recordCheckin(
  db: SQLite.SQLiteDatabase,
  date: string,
  timestamp: number,
): Promise<void> {
  db.runSync(
    'INSERT OR IGNORE INTO checkin_history (date, checked_in_at) VALUES (?, ?)',
    [date, timestamp],
  );
  return Promise.resolve();
}
