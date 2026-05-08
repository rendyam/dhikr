/**
 * Unit tests for src/db/client.ts
 *
 * Tests cover:
 *   - openContentDb(): asset copy on first launch, skip copy on subsequent
 *     launches, ContentDbError thrown on failure
 *   - openUserDb(): schema tables created, singleton streak row inserted,
 *     idempotent (safe to call multiple times)
 *   - ContentDbError: name and cause fields
 */

import { ContentDbError } from '../../src/db/client';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// expo-sqlite
const mockExecSync = jest.fn();
const mockOpenDatabaseSync = jest.fn(() => ({
  execSync: mockExecSync,
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: (...args: unknown[]) => mockOpenDatabaseSync(...args),
}));

// expo-file-system
const mockGetInfoAsync = jest.fn();
const mockMakeDirectoryAsync = jest.fn();
const mockCopyAsync = jest.fn();

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///documents/',
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  makeDirectoryAsync: (...args: unknown[]) => mockMakeDirectoryAsync(...args),
  copyAsync: (...args: unknown[]) => mockCopyAsync(...args),
}));

// expo-asset
const mockDownloadAsync = jest.fn();
const mockFromModule = jest.fn(() => ({
  downloadAsync: mockDownloadAsync,
  localUri: 'file:///bundle/adhkar.db',
}));

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: (...args: unknown[]) => mockFromModule(...args),
  },
}));

// Mock the require() call for the adhkar.db asset inside client.ts
jest.mock('../../src/db/seed/adhkar.db', () => 1, { virtual: true });

// ---------------------------------------------------------------------------
// Import after mocks are set up
// ---------------------------------------------------------------------------

// We import lazily inside each test group so mocks are in place.
let openContentDb: typeof import('../../src/db/client').openContentDb;
let openUserDb: typeof import('../../src/db/client').openUserDb;

beforeAll(async () => {
  const mod = await import('../../src/db/client');
  openContentDb = mod.openContentDb;
  openUserDb = mod.openUserDb;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetMocks() {
  mockGetInfoAsync.mockReset();
  mockMakeDirectoryAsync.mockReset().mockResolvedValue(undefined);
  mockCopyAsync.mockReset().mockResolvedValue(undefined);
  mockDownloadAsync.mockReset().mockResolvedValue(undefined);
  mockOpenDatabaseSync.mockClear();
  mockExecSync.mockClear();
}

// ---------------------------------------------------------------------------
// ContentDbError
// ---------------------------------------------------------------------------

describe('ContentDbError', () => {
  it('sets name to ContentDbError', () => {
    const err = new ContentDbError('test message');
    expect(err.name).toBe('ContentDbError');
  });

  it('stores the cause', () => {
    const cause = new Error('root cause');
    const err = new ContentDbError('wrapper', cause);
    expect(err.cause).toBe(cause);
  });

  it('is an instance of Error', () => {
    expect(new ContentDbError('x')).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// openContentDb()
// ---------------------------------------------------------------------------

describe('openContentDb()', () => {
  beforeEach(resetMocks);

  it('copies the asset and opens the DB on first launch (no existing file)', async () => {
    // SQLite dir exists, DB file does not
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: true }) // SQLITE_DIR check
      .mockResolvedValueOnce({ exists: false }); // DB file check

    await openContentDb();

    expect(mockMakeDirectoryAsync).not.toHaveBeenCalled();
    expect(mockDownloadAsync).toHaveBeenCalledTimes(1);
    expect(mockCopyAsync).toHaveBeenCalledWith({
      from: 'file:///bundle/adhkar.db',
      to: 'file:///documents/SQLite/adhkar.db',
    });
    expect(mockOpenDatabaseSync).toHaveBeenCalledWith('adhkar.db');
  });

  it('creates the SQLite directory when it does not exist', async () => {
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: false }) // SQLITE_DIR missing
      .mockResolvedValueOnce({ exists: false }); // DB file missing

    await openContentDb();

    expect(mockMakeDirectoryAsync).toHaveBeenCalledWith(
      'file:///documents/SQLite/',
      { intermediates: true },
    );
  });

  it('skips the asset copy when the DB file already exists', async () => {
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: true }) // SQLITE_DIR
      .mockResolvedValueOnce({ exists: true }); // DB file already present

    await openContentDb();

    expect(mockDownloadAsync).not.toHaveBeenCalled();
    expect(mockCopyAsync).not.toHaveBeenCalled();
    expect(mockOpenDatabaseSync).toHaveBeenCalledWith('adhkar.db');
  });

  it('throws ContentDbError when asset has no localUri', async () => {
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: true })
      .mockResolvedValueOnce({ exists: false });

    // Override fromModule to return an asset with no localUri
    mockFromModule.mockReturnValueOnce({
      downloadAsync: mockDownloadAsync,
      localUri: null,
    });

    await expect(openContentDb()).rejects.toBeInstanceOf(ContentDbError);
  });

  it('wraps unexpected errors in ContentDbError', async () => {
    mockGetInfoAsync.mockRejectedValueOnce(new Error('disk error'));

    await expect(openContentDb()).rejects.toBeInstanceOf(ContentDbError);
  });

  it('re-throws ContentDbError without double-wrapping', async () => {
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: true })
      .mockResolvedValueOnce({ exists: false });

    mockFromModule.mockReturnValueOnce({
      downloadAsync: mockDownloadAsync,
      localUri: null, // triggers ContentDbError inside
    });

    const err = await openContentDb().catch((e) => e);
    expect(err).toBeInstanceOf(ContentDbError);
    // Should not be wrapped again — message should be the original one
    expect(err.message).toContain('Failed to resolve local URI');
  });
});

// ---------------------------------------------------------------------------
// openUserDb()
// ---------------------------------------------------------------------------

describe('openUserDb()', () => {
  beforeEach(resetMocks);

  it('opens user.db', () => {
    openUserDb();
    expect(mockOpenDatabaseSync).toHaveBeenCalledWith('user.db');
  });

  it('runs execSync to create schema tables', () => {
    openUserDb();
    expect(mockExecSync).toHaveBeenCalledTimes(1);
  });

  it('schema SQL includes all required tables', () => {
    openUserDb();
    const sql: string = mockExecSync.mock.calls[0][0];

    const requiredTables = [
      'settings',
      'favorites',
      'streak',
      'badges',
      'todos',
      'checkin_history',
    ];

    for (const table of requiredTables) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
  });

  it('schema SQL inserts the singleton streak row', () => {
    openUserDb();
    const sql: string = mockExecSync.mock.calls[0][0];
    expect(sql).toContain('INSERT OR IGNORE INTO streak');
  });

  it('schema SQL enables WAL journal mode', () => {
    openUserDb();
    const sql: string = mockExecSync.mock.calls[0][0];
    expect(sql).toContain('PRAGMA journal_mode = WAL');
  });

  it('schema SQL enables foreign keys', () => {
    openUserDb();
    const sql: string = mockExecSync.mock.calls[0][0];
    expect(sql).toContain('PRAGMA foreign_keys = ON');
  });

  it('is idempotent — safe to call multiple times', () => {
    openUserDb();
    openUserDb();
    // execSync called once per openUserDb call — both should succeed without error
    expect(mockExecSync).toHaveBeenCalledTimes(2);
  });

  it('returns the database object', () => {
    const db = openUserDb();
    expect(db).toBeDefined();
    expect(db.execSync).toBe(mockExecSync);
  });
});
