/**
 * Favorites store — tracks which dhikr IDs the user has bookmarked.
 *
 * State:
 *   - dhikrIds   Set of favorited dhikr IDs (in-memory)
 *
 * Actions:
 *   - addFavorite(dhikrId)    Adds a dhikr to favorites and writes to SQLite
 *   - removeFavorite(dhikrId) Removes a dhikr from favorites and deletes from SQLite
 *   - isFavorite(dhikrId)     Returns true if the dhikr is currently favorited
 *   - hydrate(ids)            Replaces the entire set (called on app start from DB)
 *
 * Persistence:
 *   Handled directly via SQLite (favorites table). The store is NOT persisted
 *   via zustand persist middleware. On app start, call `hydrate` with the IDs
 *   returned by `getFavoriteIds` from src/db/queries.ts.
 *
 *   A module-level `userDb` reference is injected via `setUserDb(db)`. If no
 *   DB has been injected, DB writes are silently skipped (graceful degradation).
 *
 * Requirements: 10.1, 10.3, 10.4
 */

import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';
import {
  addFavorite as dbAddFavorite,
  removeFavorite as dbRemoveFavorite,
} from '../db/queries';

// ── DB injection ──────────────────────────────────────────────────────────────

/**
 * Module-level reference to the user SQLite database.
 * Injected at app start via `setUserDb`. If null, DB writes are skipped.
 */
let userDb: SQLite.SQLiteDatabase | null = null;

/**
 * Injects the SQLite database instance used for persisting favorites.
 * Call this once during app initialisation before any store actions are used.
 */
export function setUserDb(db: SQLite.SQLiteDatabase): void {
  userDb = db;
}

// ── State & actions interface ─────────────────────────────────────────────────

export interface FavoritesState {
  dhikrIds: Set<number>;

  /**
   * Adds a dhikr to the favorites set and persists it to SQLite.
   * No-op if the dhikr is already favorited.
   */
  addFavorite: (dhikrId: number) => void;

  /**
   * Removes a dhikr from the favorites set and deletes it from SQLite.
   * No-op if the dhikr was not favorited.
   */
  removeFavorite: (dhikrId: number) => void;

  /**
   * Returns true if the given dhikr ID is currently in the favorites set.
   * This is a synchronous selector — reads from in-memory state only.
   */
  isFavorite: (dhikrId: number) => boolean;

  /**
   * Replaces the entire favorites set with the provided IDs.
   * Called once on app start after loading IDs from SQLite via `getFavoriteIds`.
   */
  hydrate: (ids: number[]) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  // ── Initial state ────────────────────────────────────────────────────────
  dhikrIds: new Set<number>(),

  // ── Actions ──────────────────────────────────────────────────────────────

  addFavorite: (dhikrId: number) => {
    set((state) => {
      const next = new Set(state.dhikrIds);
      next.add(dhikrId);
      return { dhikrIds: next };
    });

    if (userDb !== null) {
      dbAddFavorite(userDb, dhikrId).catch(() => {
        // Silently ignore DB errors — in-memory state is already updated
      });
    }
  },

  removeFavorite: (dhikrId: number) => {
    set((state) => {
      const next = new Set(state.dhikrIds);
      next.delete(dhikrId);
      return { dhikrIds: next };
    });

    if (userDb !== null) {
      dbRemoveFavorite(userDb, dhikrId).catch(() => {
        // Silently ignore DB errors — in-memory state is already updated
      });
    }
  },

  isFavorite: (dhikrId: number): boolean => {
    return get().dhikrIds.has(dhikrId);
  },

  hydrate: (ids: number[]) => {
    set({ dhikrIds: new Set(ids) });
  },
}));
