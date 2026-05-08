/**
 * SQLite database client for the Muslim Dhikr App.
 *
 * Exports two functions:
 *   - `openContentDb()` — opens the bundled read-only adhkar content database.
 *     On first launch, copies `adhkar.db` from app assets to the device's
 *     document directory so expo-sqlite can access it.
 *   - `openUserDb()` — opens (or creates) the user data database and runs
 *     all schema migrations on every open.
 *
 * Requirements: 9.1, 9.2, 14.8
 */

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const SQLITE_DIR = `${FileSystem.documentDirectory}SQLite/`;
const CONTENT_DB_PATH = `${SQLITE_DIR}adhkar.db`;

// ---------------------------------------------------------------------------
// Content database (adhkar.db — read-only, bundled)
// ---------------------------------------------------------------------------

/**
 * Opens the bundled adhkar content database.
 *
 * On first launch the database file does not yet exist in the writable
 * document directory, so we copy it from the app bundle before opening.
 * Subsequent launches skip the copy and open the already-copied file.
 *
 * Throws `ContentDbError` if the asset cannot be copied or the database
 * cannot be opened — callers should render a full-screen error state.
 */
export async function openContentDb(): Promise<SQLite.SQLiteDatabase> {
  try {
    // Ensure the SQLite directory exists
    const dirInfo = await FileSystem.getInfoAsync(SQLITE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(SQLITE_DIR, { intermediates: true });
    }

    // Copy the bundled asset on first launch
    const dbInfo = await FileSystem.getInfoAsync(CONTENT_DB_PATH);
    if (!dbInfo.exists) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const asset = Asset.fromModule(require('./seed/adhkar.db'));
      await asset.downloadAsync();

      if (!asset.localUri) {
        throw new ContentDbError(
          'Failed to resolve local URI for adhkar.db asset.',
        );
      }

      await FileSystem.copyAsync({
        from: asset.localUri,
        to: CONTENT_DB_PATH,
      });
    }

    return SQLite.openDatabaseSync('adhkar.db');
  } catch (err) {
    if (err instanceof ContentDbError) throw err;
    throw new ContentDbError(
      `Failed to open content database: ${(err as Error).message}`,
      err as Error,
    );
  }
}

/**
 * Typed error thrown when the content database cannot be opened.
 * Screens should catch this and render a full-screen error state.
 */
export class ContentDbError extends Error {
  readonly cause: Error | undefined;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'ContentDbError';
    this.cause = cause;
  }
}

// ---------------------------------------------------------------------------
// User database (user.db — read/write, local)
// ---------------------------------------------------------------------------

/**
 * Opens (or creates) the user data SQLite database and runs all schema
 * migrations synchronously before returning.
 *
 * The database stores: settings, favorites, streak, badges, todos, and
 * guest check-in history.  All tables use `CREATE TABLE IF NOT EXISTS` so
 * this function is safe to call on every app launch.
 */
export function openUserDb(): SQLite.SQLiteDatabase {
  const db = SQLite.openDatabaseSync('user.db');
  runUserDbMigrations(db);
  return db;
}

// ---------------------------------------------------------------------------
// User DB schema migrations
// ---------------------------------------------------------------------------

/**
 * Runs all DDL statements for the user database.
 * Uses `CREATE TABLE IF NOT EXISTS` throughout — idempotent and safe to
 * re-run on every launch.
 */
function runUserDbMigrations(db: SQLite.SQLiteDatabase): void {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- -----------------------------------------------------------------------
    -- Settings
    -- Key/value store for user preferences and internal flags.
    --
    -- Known keys:
    --   'language'                        — Locale string ('en' | 'id')
    --   'text_size'                       — 'small' | 'medium' | 'large'
    --   'show_transliteration'            — '0' | '1'
    --   'notification_enabled'            — '0' | '1'
    --   'notification_time'               — 'HH:MM' 24-hour string
    --   'dhikr_of_day_history'            — JSON array of recently shown dhikr IDs
    --   'content_version'                 — integer as text; currently applied patch version (default '0')
    --   'nudge_dismissed_permanently'     — '0' | '1'
    --   'nudge_last_dismissed_at'         — 'YYYY-MM-DD'
    --   'nudge_streak_at_last_dismissal'  — integer as text
    --   'streak_migration_offered'        — '0' | '1'
    -- -----------------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- -----------------------------------------------------------------------
    -- Favorites
    -- Stores dhikr IDs the user has bookmarked.
    -- -----------------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS favorites (
      dhikr_id    INTEGER PRIMARY KEY,
      added_at    INTEGER NOT NULL  -- Unix timestamp (ms)
    );

    -- -----------------------------------------------------------------------
    -- Streak (singleton row — id is always 1)
    -- -----------------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS streak (
      id              INTEGER PRIMARY KEY CHECK(id = 1),
      current_streak  INTEGER NOT NULL DEFAULT 0,
      last_checkin    TEXT,           -- ISO date string 'YYYY-MM-DD' or NULL
      longest_streak  INTEGER NOT NULL DEFAULT 0
    );

    -- Ensure the singleton row exists so reads never return NULL
    INSERT OR IGNORE INTO streak (id, current_streak, last_checkin, longest_streak)
    VALUES (1, 0, NULL, 0);

    -- -----------------------------------------------------------------------
    -- Badges
    -- One row per earned milestone (7, 30, 100 days).
    -- -----------------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS badges (
      milestone       INTEGER PRIMARY KEY,  -- 7 | 30 | 100
      earned_at       INTEGER NOT NULL,     -- Unix timestamp (ms)
      reward_claimed  INTEGER NOT NULL DEFAULT 0  -- 0 | 1
    );

    -- -----------------------------------------------------------------------
    -- To-Do items
    -- Soft-deleted rows (deleted_at IS NOT NULL) are excluded from queries
    -- but kept as tombstones for Firestore sync conflict resolution.
    -- -----------------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS todos (
      id          TEXT    PRIMARY KEY,  -- UUID v4
      title       TEXT    NOT NULL,
      notes       TEXT,
      completed   INTEGER NOT NULL DEFAULT 0,  -- 0 | 1
      created_at  INTEGER NOT NULL,            -- Unix timestamp (ms)
      updated_at  INTEGER NOT NULL,            -- Unix timestamp (ms)
      deleted_at  INTEGER                      -- Unix timestamp (ms); NULL = not deleted
    );

    -- -----------------------------------------------------------------------
    -- Guest check-in history
    -- One row per calendar day the guest user viewed a dhikr entry.
    -- Used for local streak computation and migration to Firestore on
    -- first sign-in (Requirement 22).
    -- -----------------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS checkin_history (
      date          TEXT    PRIMARY KEY,  -- 'YYYY-MM-DD'
      checked_in_at INTEGER NOT NULL      -- Unix timestamp (ms)
    );
  `);
}
