/**
 * Todo store — manages the user's personal to-do list.
 *
 * State:
 *   - items   Array of non-deleted TodoItem objects (in-memory)
 *
 * Actions:
 *   - addItem(title, notes?)   Creates a new item with a UUID v4 id and writes to SQLite
 *   - toggleItem(id)           Flips the completed flag and writes to SQLite
 *   - editItem(id, title, notes?) Updates title/notes and writes to SQLite
 *   - deleteItem(id)           Soft-deletes the item (sets deletedAt) and removes from in-memory list
 *   - hydrate(items)           Replaces the entire items array (called on app start from DB)
 *
 * Validation:
 *   - addItem and editItem reject empty or whitespace-only titles by throwing
 *     a TypeError. The caller (screen/component) is responsible for displaying
 *     the validation error to the user.
 *
 * Persistence:
 *   Handled directly via SQLite (todos table). The store is NOT persisted via
 *   zustand persist middleware. On app start, call `hydrate` with the items
 *   returned by `getTodos` from src/db/queries.ts.
 *
 *   A module-level `userDb` reference is injected via `setTodoUserDb(db)`. If
 *   no DB has been injected, DB writes are silently skipped (graceful
 *   degradation for tests and early app startup).
 *
 * Requirements: 17.2, 17.3, 17.4, 17.5, 17.6
 */

import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { upsertTodo, softDeleteTodo } from '../db/queries';
import type { TodoItem } from '../types/user';

// ── DB injection ──────────────────────────────────────────────────────────────

/**
 * Module-level reference to the user SQLite database.
 * Injected at app start via `setTodoUserDb`. If null, DB writes are skipped.
 */
let userDb: SQLite.SQLiteDatabase | null = null;

/**
 * Injects the SQLite database instance used for persisting to-do items.
 * Call this once during app initialisation before any store actions are used.
 */
export function setTodoUserDb(db: SQLite.SQLiteDatabase): void {
  userDb = db;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Validates that a title is non-empty and non-whitespace.
 * Throws a TypeError if the title is invalid.
 */
function validateTitle(title: string): void {
  if (!title || !title.trim()) {
    throw new TypeError('Todo title must not be empty or whitespace-only.');
  }
}

/**
 * Generates a UUID v4 string using expo-crypto.
 * Falls back to a timestamp-based ID if expo-crypto is unavailable.
 */
function generateId(): string {
  try {
    return Crypto.randomUUID();
  } catch {
    // Fallback for environments where expo-crypto is not available (e.g., tests)
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

// ── State & actions interface ─────────────────────────────────────────────────

export interface TodoState {
  /** All non-deleted to-do items, ordered by creation time ascending. */
  items: TodoItem[];

  /**
   * Creates a new to-do item with a UUID v4 id.
   * Sets `createdAt` and `updatedAt` to `Date.now()`.
   * Writes the new item to SQLite.
   * @throws {TypeError} if title is empty or whitespace-only
   */
  addItem: (title: string, notes?: string) => void;

  /**
   * Flips the `completed` flag of the item with the given id.
   * Updates `updatedAt` to `Date.now()`.
   * Writes the updated item to SQLite.
   * No-op if the id does not exist.
   */
  toggleItem: (id: string) => void;

  /**
   * Updates the title and/or notes of the item with the given id.
   * Updates `updatedAt` to `Date.now()`.
   * Writes the updated item to SQLite.
   * No-op if the id does not exist.
   * @throws {TypeError} if the new title is empty or whitespace-only
   */
  editItem: (id: string, title: string, notes?: string) => void;

  /**
   * Soft-deletes the item with the given id by setting `deletedAt`.
   * Removes the item from the in-memory `items` array immediately.
   * Writes the soft-delete to SQLite (tombstone for sync).
   * No-op if the id does not exist.
   */
  deleteItem: (id: string) => void;

  /**
   * Replaces the entire items array with the provided list.
   * Called once on app start after loading items from SQLite via `getTodos`.
   */
  hydrate: (items: TodoItem[]) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useTodoStore = create<TodoState>()((set, get) => ({
  // ── Initial state ────────────────────────────────────────────────────────
  items: [],

  // ── Actions ──────────────────────────────────────────────────────────────

  addItem: (title: string, notes?: string) => {
    validateTitle(title);

    const now = Date.now();
    const newItem: TodoItem = {
      id: generateId(),
      title: title.trim(),
      notes: notes?.trim() ?? null,
      completed: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    set((state) => ({ items: [...state.items, newItem] }));

    if (userDb !== null) {
      upsertTodo(userDb, newItem).catch(() => {
        // Silently ignore DB errors — in-memory state is already updated
      });
    }
  },

  toggleItem: (id: string) => {
    const existing = get().items.find((item) => item.id === id);
    if (!existing) return;

    const updated: TodoItem = {
      ...existing,
      completed: !existing.completed,
      updatedAt: Date.now(),
    };

    set((state) => ({
      items: state.items.map((item) => (item.id === id ? updated : item)),
    }));

    if (userDb !== null) {
      upsertTodo(userDb, updated).catch(() => {
        // Silently ignore DB errors — in-memory state is already updated
      });
    }
  },

  editItem: (id: string, title: string, notes?: string) => {
    validateTitle(title);

    const existing = get().items.find((item) => item.id === id);
    if (!existing) return;

    const updated: TodoItem = {
      ...existing,
      title: title.trim(),
      notes: notes?.trim() ?? null,
      updatedAt: Date.now(),
    };

    set((state) => ({
      items: state.items.map((item) => (item.id === id ? updated : item)),
    }));

    if (userDb !== null) {
      upsertTodo(userDb, updated).catch(() => {
        // Silently ignore DB errors — in-memory state is already updated
      });
    }
  },

  deleteItem: (id: string) => {
    const existing = get().items.find((item) => item.id === id);
    if (!existing) return;

    // Remove from in-memory list immediately
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));

    if (userDb !== null) {
      softDeleteTodo(userDb, id).catch(() => {
        // Silently ignore DB errors — in-memory state is already updated
      });
    }
  },

  hydrate: (items: TodoItem[]) => {
    set({ items });
  },
}));
