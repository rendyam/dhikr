/**
 * Unit tests for src/store/todoStore.ts
 *
 * Covers:
 *   - Default state: items is an empty array
 *   - addItem: creates item with correct fields, appends to list
 *   - addItem: title validation rejects empty and whitespace-only strings
 *   - addItem: trims title and notes
 *   - addItem: calls upsertTodo when DB is injected
 *   - addItem: skips DB write when no DB is injected
 *   - toggleItem: flips completed flag, updates updatedAt
 *   - toggleItem: no-op for unknown id
 *   - toggleItem: calls upsertTodo when DB is injected
 *   - editItem: updates title and notes, updates updatedAt
 *   - editItem: title validation rejects empty and whitespace-only strings
 *   - editItem: no-op for unknown id
 *   - editItem: calls upsertTodo when DB is injected
 *   - deleteItem: removes item from in-memory list
 *   - deleteItem: no-op for unknown id
 *   - deleteItem: calls softDeleteTodo when DB is injected
 *   - hydrate: replaces items array entirely
 *
 * Requirements: 17.2, 17.3, 17.4, 17.5, 17.6
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock expo-sqlite so no real DB is needed
jest.mock('expo-sqlite', () => ({}));

// Mock expo-crypto to return a predictable UUID
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid-1234'),
}));

// Mock src/db/queries — upsertTodo and softDeleteTodo as jest.fn()
jest.mock('../../src/db/queries', () => ({
  upsertTodo: jest.fn().mockResolvedValue(undefined),
  softDeleteTodo: jest.fn().mockResolvedValue(undefined),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { act } from 'react';
import { useTodoStore, setTodoUserDb } from '../../src/store/todoStore';
import { upsertTodo, softDeleteTodo } from '../../src/db/queries';
import * as Crypto from 'expo-crypto';
import type { TodoItem } from '../../src/types/user';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Shorthand to read the current store state without subscribing. */
const getState = () => useTodoStore.getState();

/** Builds a minimal TodoItem for seeding state in tests. */
function makeTodo(overrides: Partial<TodoItem> = {}): TodoItem {
  return {
    id: 'test-id-1',
    title: 'Test todo',
    notes: null,
    completed: false,
    createdAt: 1000,
    updatedAt: 1000,
    deletedAt: null,
    ...overrides,
  };
}

/** Reset the store and injected DB before each test. */
beforeEach(() => {
  act(() => {
    useTodoStore.setState({ items: [] });
  });
  setTodoUserDb(null as unknown as import('expo-sqlite').SQLiteDatabase);
  jest.clearAllMocks();
  // Reset UUID mock to return a fresh value each call
  let uuidCounter = 0;
  (Crypto.randomUUID as jest.Mock).mockImplementation(
    () => `mock-uuid-${++uuidCounter}`,
  );
});

// ── Default state ─────────────────────────────────────────────────────────────

describe('default state', () => {
  it('has an empty items array', () => {
    expect(getState().items).toEqual([]);
  });
});

// ── addItem ───────────────────────────────────────────────────────────────────

describe('addItem', () => {
  it('appends a new item to the list', () => {
    act(() => {
      getState().addItem('Morning dhikr');
    });
    expect(getState().items).toHaveLength(1);
  });

  it('sets the title correctly', () => {
    act(() => {
      getState().addItem('Morning dhikr');
    });
    expect(getState().items[0].title).toBe('Morning dhikr');
  });

  it('trims whitespace from the title', () => {
    act(() => {
      getState().addItem('  Morning dhikr  ');
    });
    expect(getState().items[0].title).toBe('Morning dhikr');
  });

  it('sets notes when provided', () => {
    act(() => {
      getState().addItem('Morning dhikr', 'Read after Fajr');
    });
    expect(getState().items[0].notes).toBe('Read after Fajr');
  });

  it('trims whitespace from notes', () => {
    act(() => {
      getState().addItem('Morning dhikr', '  Read after Fajr  ');
    });
    expect(getState().items[0].notes).toBe('Read after Fajr');
  });

  it('sets notes to null when not provided', () => {
    act(() => {
      getState().addItem('Morning dhikr');
    });
    expect(getState().items[0].notes).toBeNull();
  });

  it('sets completed to false', () => {
    act(() => {
      getState().addItem('Morning dhikr');
    });
    expect(getState().items[0].completed).toBe(false);
  });

  it('sets deletedAt to null', () => {
    act(() => {
      getState().addItem('Morning dhikr');
    });
    expect(getState().items[0].deletedAt).toBeNull();
  });

  it('sets createdAt and updatedAt to a number (timestamp)', () => {
    act(() => {
      getState().addItem('Morning dhikr');
    });
    const item = getState().items[0];
    expect(typeof item.createdAt).toBe('number');
    expect(typeof item.updatedAt).toBe('number');
    expect(item.createdAt).toBe(item.updatedAt);
  });

  it('assigns a non-empty id', () => {
    act(() => {
      getState().addItem('Morning dhikr');
    });
    expect(getState().items[0].id).toBeTruthy();
  });

  it('appends multiple items in order', () => {
    act(() => {
      getState().addItem('First');
      getState().addItem('Second');
      getState().addItem('Third');
    });
    const titles = getState().items.map((i) => i.title);
    expect(titles).toEqual(['First', 'Second', 'Third']);
  });

  // ── Title validation ────────────────────────────────────────────────────

  it('throws TypeError for an empty title', () => {
    expect(() => {
      act(() => {
        getState().addItem('');
      });
    }).toThrow(TypeError);
  });

  it('throws TypeError for a whitespace-only title', () => {
    expect(() => {
      act(() => {
        getState().addItem('   ');
      });
    }).toThrow(TypeError);
  });

  it('throws TypeError for a tab-only title', () => {
    expect(() => {
      act(() => {
        getState().addItem('\t');
      });
    }).toThrow(TypeError);
  });

  it('does not add an item when title is invalid', () => {
    try {
      act(() => {
        getState().addItem('');
      });
    } catch {
      // expected
    }
    expect(getState().items).toHaveLength(0);
  });

  // ── DB writes ───────────────────────────────────────────────────────────

  it('does NOT call upsertTodo when no DB is injected', () => {
    act(() => {
      getState().addItem('Morning dhikr');
    });
    expect(upsertTodo).not.toHaveBeenCalled();
  });

  it('calls upsertTodo with the new item when DB is injected', () => {
    const fakeDb = {} as import('expo-sqlite').SQLiteDatabase;
    setTodoUserDb(fakeDb);

    act(() => {
      getState().addItem('Morning dhikr');
    });

    expect(upsertTodo).toHaveBeenCalledTimes(1);
    expect(upsertTodo).toHaveBeenCalledWith(fakeDb, getState().items[0]);
  });
});

// ── toggleItem ────────────────────────────────────────────────────────────────

describe('toggleItem', () => {
  it('flips completed from false to true', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a', completed: false })] });
    });
    act(() => {
      getState().toggleItem('a');
    });
    expect(getState().items[0].completed).toBe(true);
  });

  it('flips completed from true to false', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a', completed: true })] });
    });
    act(() => {
      getState().toggleItem('a');
    });
    expect(getState().items[0].completed).toBe(false);
  });

  it('updates updatedAt to a newer timestamp', () => {
    const original = makeTodo({ id: 'a', updatedAt: 1000 });
    act(() => {
      useTodoStore.setState({ items: [original] });
    });
    act(() => {
      getState().toggleItem('a');
    });
    expect(getState().items[0].updatedAt).toBeGreaterThanOrEqual(1000);
  });

  it('does not change other items', () => {
    act(() => {
      useTodoStore.setState({
        items: [
          makeTodo({ id: 'a', completed: false }),
          makeTodo({ id: 'b', completed: false }),
        ],
      });
    });
    act(() => {
      getState().toggleItem('a');
    });
    expect(getState().items[1].completed).toBe(false);
  });

  it('is a no-op for an unknown id', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a' })] });
    });
    act(() => {
      getState().toggleItem('unknown-id');
    });
    expect(getState().items).toHaveLength(1);
    expect(getState().items[0].completed).toBe(false);
  });

  it('does NOT call upsertTodo when no DB is injected', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a' })] });
      getState().toggleItem('a');
    });
    expect(upsertTodo).not.toHaveBeenCalled();
  });

  it('calls upsertTodo with the updated item when DB is injected', () => {
    const fakeDb = {} as import('expo-sqlite').SQLiteDatabase;
    setTodoUserDb(fakeDb);

    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a', completed: false })] });
      getState().toggleItem('a');
    });

    expect(upsertTodo).toHaveBeenCalledTimes(1);
    const calledWith = (upsertTodo as jest.Mock).mock.calls[0][1] as TodoItem;
    expect(calledWith.id).toBe('a');
    expect(calledWith.completed).toBe(true);
  });
});

// ── editItem ──────────────────────────────────────────────────────────────────

describe('editItem', () => {
  it('updates the title', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a', title: 'Old title' })] });
    });
    act(() => {
      getState().editItem('a', 'New title');
    });
    expect(getState().items[0].title).toBe('New title');
  });

  it('trims whitespace from the new title', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a' })] });
    });
    act(() => {
      getState().editItem('a', '  New title  ');
    });
    expect(getState().items[0].title).toBe('New title');
  });

  it('updates notes when provided', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a', notes: null })] });
    });
    act(() => {
      getState().editItem('a', 'Title', 'New notes');
    });
    expect(getState().items[0].notes).toBe('New notes');
  });

  it('sets notes to null when not provided', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a', notes: 'Old notes' })] });
    });
    act(() => {
      getState().editItem('a', 'Title');
    });
    expect(getState().items[0].notes).toBeNull();
  });

  it('updates updatedAt', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a', updatedAt: 1000 })] });
    });
    act(() => {
      getState().editItem('a', 'New title');
    });
    expect(getState().items[0].updatedAt).toBeGreaterThanOrEqual(1000);
  });

  it('does not change createdAt', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a', createdAt: 500 })] });
    });
    act(() => {
      getState().editItem('a', 'New title');
    });
    expect(getState().items[0].createdAt).toBe(500);
  });

  it('does not change completed flag', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a', completed: true })] });
    });
    act(() => {
      getState().editItem('a', 'New title');
    });
    expect(getState().items[0].completed).toBe(true);
  });

  it('is a no-op for an unknown id', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a', title: 'Original' })] });
    });
    act(() => {
      getState().editItem('unknown-id', 'New title');
    });
    expect(getState().items[0].title).toBe('Original');
  });

  // ── Title validation ────────────────────────────────────────────────────

  it('throws TypeError for an empty title', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a' })] });
    });
    expect(() => {
      act(() => {
        getState().editItem('a', '');
      });
    }).toThrow(TypeError);
  });

  it('throws TypeError for a whitespace-only title', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a' })] });
    });
    expect(() => {
      act(() => {
        getState().editItem('a', '   ');
      });
    }).toThrow(TypeError);
  });

  it('does not update the item when title is invalid', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a', title: 'Original' })] });
    });
    try {
      act(() => {
        getState().editItem('a', '');
      });
    } catch {
      // expected
    }
    expect(getState().items[0].title).toBe('Original');
  });

  // ── DB writes ───────────────────────────────────────────────────────────

  it('does NOT call upsertTodo when no DB is injected', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a' })] });
      getState().editItem('a', 'New title');
    });
    expect(upsertTodo).not.toHaveBeenCalled();
  });

  it('calls upsertTodo with the updated item when DB is injected', () => {
    const fakeDb = {} as import('expo-sqlite').SQLiteDatabase;
    setTodoUserDb(fakeDb);

    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a', title: 'Old' })] });
      getState().editItem('a', 'New title', 'New notes');
    });

    expect(upsertTodo).toHaveBeenCalledTimes(1);
    const calledWith = (upsertTodo as jest.Mock).mock.calls[0][1] as TodoItem;
    expect(calledWith.id).toBe('a');
    expect(calledWith.title).toBe('New title');
    expect(calledWith.notes).toBe('New notes');
  });
});

// ── deleteItem ────────────────────────────────────────────────────────────────

describe('deleteItem', () => {
  it('removes the item from the in-memory list', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a' })] });
    });
    act(() => {
      getState().deleteItem('a');
    });
    expect(getState().items).toHaveLength(0);
  });

  it('removes only the targeted item', () => {
    act(() => {
      useTodoStore.setState({
        items: [makeTodo({ id: 'a' }), makeTodo({ id: 'b' }), makeTodo({ id: 'c' })],
      });
    });
    act(() => {
      getState().deleteItem('b');
    });
    const ids = getState().items.map((i) => i.id);
    expect(ids).toEqual(['a', 'c']);
  });

  it('is a no-op for an unknown id', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a' })] });
    });
    act(() => {
      getState().deleteItem('unknown-id');
    });
    expect(getState().items).toHaveLength(1);
  });

  it('results in an empty list when the last item is deleted', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a' })] });
    });
    act(() => {
      getState().deleteItem('a');
    });
    expect(getState().items).toHaveLength(0);
  });

  it('does NOT call softDeleteTodo when no DB is injected', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a' })] });
      getState().deleteItem('a');
    });
    expect(softDeleteTodo).not.toHaveBeenCalled();
  });

  it('calls softDeleteTodo with the correct id when DB is injected', () => {
    const fakeDb = {} as import('expo-sqlite').SQLiteDatabase;
    setTodoUserDb(fakeDb);

    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a' })] });
      getState().deleteItem('a');
    });

    expect(softDeleteTodo).toHaveBeenCalledTimes(1);
    expect(softDeleteTodo).toHaveBeenCalledWith(fakeDb, 'a');
  });

  it('does NOT call upsertTodo on delete', () => {
    const fakeDb = {} as import('expo-sqlite').SQLiteDatabase;
    setTodoUserDb(fakeDb);

    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a' })] });
      getState().deleteItem('a');
    });

    expect(upsertTodo).not.toHaveBeenCalled();
  });
});

// ── hydrate ───────────────────────────────────────────────────────────────────

describe('hydrate', () => {
  it('replaces the items array with the provided list', () => {
    const items = [makeTodo({ id: 'a' }), makeTodo({ id: 'b' })];
    act(() => {
      getState().hydrate(items);
    });
    expect(getState().items).toHaveLength(2);
    expect(getState().items[0].id).toBe('a');
    expect(getState().items[1].id).toBe('b');
  });

  it('replaces existing items entirely', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'old' })] });
    });
    act(() => {
      getState().hydrate([makeTodo({ id: 'new' })]);
    });
    expect(getState().items).toHaveLength(1);
    expect(getState().items[0].id).toBe('new');
  });

  it('results in an empty list when called with an empty array', () => {
    act(() => {
      useTodoStore.setState({ items: [makeTodo({ id: 'a' })] });
    });
    act(() => {
      getState().hydrate([]);
    });
    expect(getState().items).toHaveLength(0);
  });

  it('preserves all fields of hydrated items', () => {
    const item = makeTodo({
      id: 'x',
      title: 'Hydrated',
      notes: 'Some notes',
      completed: true,
      createdAt: 100,
      updatedAt: 200,
      deletedAt: null,
    });
    act(() => {
      getState().hydrate([item]);
    });
    expect(getState().items[0]).toEqual(item);
  });
});

// ── Action function presence ──────────────────────────────────────────────────

describe('action functions', () => {
  it('exposes addItem as a function', () => {
    expect(typeof getState().addItem).toBe('function');
  });

  it('exposes toggleItem as a function', () => {
    expect(typeof getState().toggleItem).toBe('function');
  });

  it('exposes editItem as a function', () => {
    expect(typeof getState().editItem).toBe('function');
  });

  it('exposes deleteItem as a function', () => {
    expect(typeof getState().deleteItem).toBe('function');
  });

  it('exposes hydrate as a function', () => {
    expect(typeof getState().hydrate).toBe('function');
  });
});
