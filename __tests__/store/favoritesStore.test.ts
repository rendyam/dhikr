/**
 * Unit tests for src/store/favoritesStore.ts
 *
 * Covers:
 *   - Default state: dhikrIds is an empty Set
 *   - addFavorite: adds ID to the set and calls dbAddFavorite when DB is set
 *   - removeFavorite: removes ID from the set and calls dbRemoveFavorite when DB is set
 *   - isFavorite: returns correct boolean based on current set contents
 *   - hydrate: replaces the entire set with the provided IDs
 *   - DB writes are skipped gracefully when no DB is injected (userDb is null)
 *
 * Requirements: 10.1, 10.3, 10.4
 */

// Mock expo-sqlite so no real DB is needed
jest.mock('expo-sqlite', () => ({}));

// Mock src/db/queries so DB functions are jest.fn() — no real SQLite calls
jest.mock('../../src/db/queries', () => ({
  addFavorite: jest.fn().mockResolvedValue(undefined),
  removeFavorite: jest.fn().mockResolvedValue(undefined),
}));

import { act } from 'react';
import { useFavoritesStore, setUserDb } from '../../src/store/favoritesStore';
import { addFavorite as dbAddFavorite, removeFavorite as dbRemoveFavorite } from '../../src/db/queries';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Shorthand to read the current store state without subscribing. */
const getState = () => useFavoritesStore.getState();

/** Reset the store to its initial defaults before each test. */
beforeEach(() => {
  act(() => {
    useFavoritesStore.setState({ dhikrIds: new Set<number>() });
  });
  // Reset the injected DB to null so tests start without a DB by default
  setUserDb(null as unknown as import('expo-sqlite').SQLiteDatabase);
  jest.clearAllMocks();
});

// ── Default state ─────────────────────────────────────────────────────────────

describe('default state', () => {
  it('has an empty dhikrIds Set', () => {
    expect(getState().dhikrIds).toBeInstanceOf(Set);
    expect(getState().dhikrIds.size).toBe(0);
  });
});

// ── addFavorite ───────────────────────────────────────────────────────────────

describe('addFavorite', () => {
  it('adds a dhikr ID to the set', () => {
    act(() => {
      getState().addFavorite(1);
    });
    expect(getState().dhikrIds.has(1)).toBe(true);
  });

  it('adds multiple distinct IDs', () => {
    act(() => {
      getState().addFavorite(1);
      getState().addFavorite(2);
      getState().addFavorite(3);
    });
    expect(getState().dhikrIds.size).toBe(3);
    expect(getState().dhikrIds.has(1)).toBe(true);
    expect(getState().dhikrIds.has(2)).toBe(true);
    expect(getState().dhikrIds.has(3)).toBe(true);
  });

  it('is idempotent — adding the same ID twice keeps size at 1', () => {
    act(() => {
      getState().addFavorite(5);
      getState().addFavorite(5);
    });
    expect(getState().dhikrIds.size).toBe(1);
  });

  it('does NOT call dbAddFavorite when no DB is injected', () => {
    act(() => {
      getState().addFavorite(1);
    });
    expect(dbAddFavorite).not.toHaveBeenCalled();
  });

  it('calls dbAddFavorite with the correct dhikrId when DB is injected', () => {
    const fakeDb = {} as import('expo-sqlite').SQLiteDatabase;
    setUserDb(fakeDb);

    act(() => {
      getState().addFavorite(42);
    });

    expect(dbAddFavorite).toHaveBeenCalledWith(fakeDb, 42);
    expect(dbAddFavorite).toHaveBeenCalledTimes(1);
  });

  it('calls dbAddFavorite once per addFavorite call', () => {
    const fakeDb = {} as import('expo-sqlite').SQLiteDatabase;
    setUserDb(fakeDb);

    act(() => {
      getState().addFavorite(1);
      getState().addFavorite(2);
    });

    expect(dbAddFavorite).toHaveBeenCalledTimes(2);
  });
});

// ── removeFavorite ────────────────────────────────────────────────────────────

describe('removeFavorite', () => {
  it('removes a dhikr ID from the set', () => {
    act(() => {
      useFavoritesStore.setState({ dhikrIds: new Set([1, 2, 3]) });
    });
    act(() => {
      getState().removeFavorite(2);
    });
    expect(getState().dhikrIds.has(2)).toBe(false);
    expect(getState().dhikrIds.size).toBe(2);
  });

  it('is a no-op when the ID is not in the set', () => {
    act(() => {
      useFavoritesStore.setState({ dhikrIds: new Set([1]) });
    });
    act(() => {
      getState().removeFavorite(99);
    });
    expect(getState().dhikrIds.size).toBe(1);
  });

  it('results in an empty set when the last ID is removed', () => {
    act(() => {
      useFavoritesStore.setState({ dhikrIds: new Set([7]) });
    });
    act(() => {
      getState().removeFavorite(7);
    });
    expect(getState().dhikrIds.size).toBe(0);
  });

  it('does NOT call dbRemoveFavorite when no DB is injected', () => {
    act(() => {
      useFavoritesStore.setState({ dhikrIds: new Set([1]) });
      getState().removeFavorite(1);
    });
    expect(dbRemoveFavorite).not.toHaveBeenCalled();
  });

  it('calls dbRemoveFavorite with the correct dhikrId when DB is injected', () => {
    const fakeDb = {} as import('expo-sqlite').SQLiteDatabase;
    setUserDb(fakeDb);

    act(() => {
      useFavoritesStore.setState({ dhikrIds: new Set([10]) });
      getState().removeFavorite(10);
    });

    expect(dbRemoveFavorite).toHaveBeenCalledWith(fakeDb, 10);
    expect(dbRemoveFavorite).toHaveBeenCalledTimes(1);
  });
});

// ── isFavorite ────────────────────────────────────────────────────────────────

describe('isFavorite', () => {
  it('returns false for an ID not in the set', () => {
    expect(getState().isFavorite(1)).toBe(false);
  });

  it('returns true after addFavorite', () => {
    act(() => {
      getState().addFavorite(1);
    });
    expect(getState().isFavorite(1)).toBe(true);
  });

  it('returns false after removeFavorite', () => {
    act(() => {
      useFavoritesStore.setState({ dhikrIds: new Set([1]) });
    });
    act(() => {
      getState().removeFavorite(1);
    });
    expect(getState().isFavorite(1)).toBe(false);
  });

  it('returns true for IDs present and false for IDs absent', () => {
    act(() => {
      useFavoritesStore.setState({ dhikrIds: new Set([1, 3, 5]) });
    });
    expect(getState().isFavorite(1)).toBe(true);
    expect(getState().isFavorite(2)).toBe(false);
    expect(getState().isFavorite(3)).toBe(true);
    expect(getState().isFavorite(4)).toBe(false);
    expect(getState().isFavorite(5)).toBe(true);
  });
});

// ── hydrate ───────────────────────────────────────────────────────────────────

describe('hydrate', () => {
  it('populates the set from an array of IDs', () => {
    act(() => {
      getState().hydrate([1, 2, 3]);
    });
    expect(getState().dhikrIds.size).toBe(3);
    expect(getState().dhikrIds.has(1)).toBe(true);
    expect(getState().dhikrIds.has(2)).toBe(true);
    expect(getState().dhikrIds.has(3)).toBe(true);
  });

  it('replaces existing set contents entirely', () => {
    act(() => {
      useFavoritesStore.setState({ dhikrIds: new Set([10, 20, 30]) });
    });
    act(() => {
      getState().hydrate([1, 2]);
    });
    expect(getState().dhikrIds.size).toBe(2);
    expect(getState().dhikrIds.has(10)).toBe(false);
    expect(getState().dhikrIds.has(1)).toBe(true);
    expect(getState().dhikrIds.has(2)).toBe(true);
  });

  it('results in an empty set when called with an empty array', () => {
    act(() => {
      useFavoritesStore.setState({ dhikrIds: new Set([1, 2]) });
    });
    act(() => {
      getState().hydrate([]);
    });
    expect(getState().dhikrIds.size).toBe(0);
  });

  it('deduplicates IDs when the input array has duplicates', () => {
    act(() => {
      getState().hydrate([1, 1, 2, 2, 3]);
    });
    expect(getState().dhikrIds.size).toBe(3);
  });

  it('isFavorite returns correct results after hydrate', () => {
    act(() => {
      getState().hydrate([5, 10, 15]);
    });
    expect(getState().isFavorite(5)).toBe(true);
    expect(getState().isFavorite(10)).toBe(true);
    expect(getState().isFavorite(15)).toBe(true);
    expect(getState().isFavorite(1)).toBe(false);
  });
});

// ── add then remove round-trip ────────────────────────────────────────────────

describe('add/remove round-trip', () => {
  it('set is empty after adding then removing the same ID', () => {
    act(() => {
      getState().addFavorite(7);
    });
    act(() => {
      getState().removeFavorite(7);
    });
    expect(getState().dhikrIds.size).toBe(0);
    expect(getState().isFavorite(7)).toBe(false);
  });

  it('other IDs are unaffected when one is removed', () => {
    act(() => {
      getState().addFavorite(1);
      getState().addFavorite(2);
      getState().addFavorite(3);
    });
    act(() => {
      getState().removeFavorite(2);
    });
    expect(getState().isFavorite(1)).toBe(true);
    expect(getState().isFavorite(2)).toBe(false);
    expect(getState().isFavorite(3)).toBe(true);
  });
});
