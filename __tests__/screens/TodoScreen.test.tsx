/**
 * Component tests for app/(tabs)/todo.tsx — To-Do List screen
 *
 * Covers:
 *   1. Renders empty state when todoStore.items is empty
 *   2. Renders todo list when items exist — shows each item's title
 *   3. Add form validation — empty title shows error, does NOT call addItem
 *   4. Add form success — valid title calls todoStore.addItem
 *   5. Toggle — calls todoStore.toggleItem with correct id
 *   6. Delete confirmation — delete triggers Alert, confirming calls deleteItem
 *   7. Edit — opens form pre-filled, submitting calls todoStore.editItem
 *
 * Requirements: 17.1–17.10
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import TodoScreen from '../../app/(tabs)/todo';
import type { TodoItem } from '../../src/types/user';

// ── i18n test instance ────────────────────────────────────────────────────────

const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        todo: {
          title: 'To-Do',
          emptyTitle: 'No Goals Yet',
          emptyMessage: 'Add your first personal dhikr goal to get started.',
          addButton: 'Add Goal',
          addTitle: 'New Goal',
          editTitle: 'Edit Goal',
          titleLabel: 'Title',
          titlePlaceholder: 'Enter a title…',
          notesLabel: 'Notes (optional)',
          notesPlaceholder: 'Add notes…',
          saveButton: 'Save',
          cancelButton: 'Cancel',
          deleteConfirmTitle: 'Delete Goal?',
          deleteConfirmMessage: 'This goal will be permanently deleted.',
          deleteConfirm: 'Delete',
          deleteCancel: 'Cancel',
          titleRequired: 'Title is required.',
          completedLabel: 'Completed',
          incompleteLabel: 'Incomplete',
        },
      },
    },
  },
  interpolation: { escapeValue: false },
});

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockAddItem = jest.fn();
const mockToggleItem = jest.fn();
const mockEditItem = jest.fn();
const mockDeleteItem = jest.fn();

// We keep a mutable reference so individual tests can override items
let mockItems: TodoItem[] = [];

jest.mock('../../src/store/todoStore', () => ({
  useTodoStore: (selector: (s: {
    items: TodoItem[];
    addItem: (title: string, notes?: string) => void;
    toggleItem: (id: string) => void;
    editItem: (id: string, title: string, notes?: string) => void;
    deleteItem: (id: string) => void;
  }) => unknown) =>
    selector({
      get items() { return mockItems; },
      addItem: mockAddItem,
      toggleItem: mockToggleItem,
      editItem: mockEditItem,
      deleteItem: mockDeleteItem,
    }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeTodoItem = (id: string, title: string, completed = false): TodoItem => ({
  id,
  title,
  notes: null,
  completed,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  deletedAt: null,
});

const ITEM_1 = makeTodoItem('id-1', 'Read Quran daily');
const ITEM_2 = makeTodoItem('id-2', 'Morning adhkar', true);
const ITEM_3 = makeTodoItem('id-3', 'Evening adhkar');

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderScreen() {
  return render(
    <I18nextProvider i18n={testI18n}>
      <TodoScreen />
    </I18nextProvider>,
  );
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockItems = [];
  jest.spyOn(Alert, 'alert');
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TodoScreen', () => {
  // ── 1. Empty state ─────────────────────────────────────────────────────────

  describe('Empty state', () => {
    it('renders the empty state when there are no items', () => {
      mockItems = [];
      const { getByTestId } = renderScreen();
      expect(getByTestId('todo-empty')).toBeTruthy();
    });

    it('renders the empty state title', () => {
      mockItems = [];
      const { getByTestId } = renderScreen();
      expect(getByTestId('todo-empty-title')).toBeTruthy();
    });

    it('renders the empty state message prompting to add first dhikr goal', () => {
      mockItems = [];
      const { getByText } = renderScreen();
      expect(getByText('Add your first personal dhikr goal to get started.')).toBeTruthy();
    });

    it('does not render the list in empty state', () => {
      mockItems = [];
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('todo-list')).toBeNull();
    });
  });

  // ── 2. Renders todo list ───────────────────────────────────────────────────

  describe('Todo list', () => {
    it('renders the list when items exist', () => {
      mockItems = [ITEM_1, ITEM_2, ITEM_3];
      const { getByTestId } = renderScreen();
      expect(getByTestId('todo-list')).toBeTruthy();
    });

    it('renders a TodoItem row for each item', () => {
      mockItems = [ITEM_1, ITEM_2, ITEM_3];
      const { getAllByTestId } = renderScreen();
      expect(getAllByTestId('todo-item')).toHaveLength(3);
    });

    it('renders each item title', () => {
      mockItems = [ITEM_1, ITEM_2, ITEM_3];
      const { getByText } = renderScreen();
      expect(getByText('Read Quran daily')).toBeTruthy();
      expect(getByText('Morning adhkar')).toBeTruthy();
      expect(getByText('Evening adhkar')).toBeTruthy();
    });

    it('does not render the empty state when items exist', () => {
      mockItems = [ITEM_1];
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('todo-empty')).toBeNull();
    });
  });

  // ── 3. Add form validation ─────────────────────────────────────────────────

  describe('Add form validation', () => {
    it('opens the add form when the add button is pressed', () => {
      mockItems = [];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-add-button'));
      expect(getByTestId('todo-form')).toBeTruthy();
    });

    it('shows validation error when submitting with empty title', () => {
      mockItems = [];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-add-button'));
      // Leave title empty and press save
      fireEvent.press(getByTestId('todo-form-save'));
      expect(getByTestId('todo-form-title-error')).toBeTruthy();
    });

    it('shows "Title is required." error message for empty title', () => {
      mockItems = [];
      const { getByTestId, getByText } = renderScreen();
      fireEvent.press(getByTestId('todo-add-button'));
      fireEvent.press(getByTestId('todo-form-save'));
      expect(getByText('Title is required.')).toBeTruthy();
    });

    it('does NOT call addItem when title is empty', () => {
      mockItems = [];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-add-button'));
      fireEvent.press(getByTestId('todo-form-save'));
      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('shows validation error when submitting with whitespace-only title', () => {
      mockItems = [];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-add-button'));
      fireEvent.changeText(getByTestId('todo-form-title-input'), '   ');
      fireEvent.press(getByTestId('todo-form-save'));
      expect(getByTestId('todo-form-title-error')).toBeTruthy();
      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('clears the validation error when user starts typing', () => {
      mockItems = [];
      const { getByTestId, queryByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-add-button'));
      // Trigger error
      fireEvent.press(getByTestId('todo-form-save'));
      expect(getByTestId('todo-form-title-error')).toBeTruthy();
      // Start typing — error should clear
      fireEvent.changeText(getByTestId('todo-form-title-input'), 'New goal');
      expect(queryByTestId('todo-form-title-error')).toBeNull();
    });
  });

  // ── 4. Add form success ────────────────────────────────────────────────────

  describe('Add form success', () => {
    it('calls addItem with the trimmed title when form is submitted', () => {
      mockItems = [];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-add-button'));
      fireEvent.changeText(getByTestId('todo-form-title-input'), 'Read Quran');
      fireEvent.press(getByTestId('todo-form-save'));
      expect(mockAddItem).toHaveBeenCalledWith('Read Quran', undefined);
    });

    it('calls addItem with title and notes when both are provided', () => {
      mockItems = [];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-add-button'));
      fireEvent.changeText(getByTestId('todo-form-title-input'), 'Morning adhkar');
      fireEvent.changeText(getByTestId('todo-form-notes-input'), 'After Fajr');
      fireEvent.press(getByTestId('todo-form-save'));
      expect(mockAddItem).toHaveBeenCalledWith('Morning adhkar', 'After Fajr');
    });

    it('dismisses the form after successful submission', async () => {
      mockItems = [];
      const { getByTestId, queryByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-add-button'));
      fireEvent.changeText(getByTestId('todo-form-title-input'), 'New goal');
      fireEvent.press(getByTestId('todo-form-save'));
      await waitFor(() => {
        expect(queryByTestId('todo-form')).toBeNull();
      });
    });

    it('dismisses the form when cancel is pressed', async () => {
      mockItems = [];
      const { getByTestId, queryByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-add-button'));
      fireEvent.press(getByTestId('todo-form-cancel'));
      await waitFor(() => {
        expect(queryByTestId('todo-form')).toBeNull();
      });
    });

    it('does not call addItem when cancel is pressed', () => {
      mockItems = [];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-add-button'));
      fireEvent.changeText(getByTestId('todo-form-title-input'), 'Some goal');
      fireEvent.press(getByTestId('todo-form-cancel'));
      expect(mockAddItem).not.toHaveBeenCalled();
    });
  });

  // ── 5. Toggle ──────────────────────────────────────────────────────────────

  describe('Toggle', () => {
    it('calls toggleItem with the correct id when toggle is pressed', () => {
      mockItems = [ITEM_1, ITEM_2];
      const { getAllByTestId } = renderScreen();
      const toggles = getAllByTestId('todo-item-toggle');
      fireEvent.press(toggles[0]);
      expect(mockToggleItem).toHaveBeenCalledWith('id-1');
    });

    it('calls toggleItem with the second item id when second toggle is pressed', () => {
      mockItems = [ITEM_1, ITEM_2];
      const { getAllByTestId } = renderScreen();
      const toggles = getAllByTestId('todo-item-toggle');
      fireEvent.press(toggles[1]);
      expect(mockToggleItem).toHaveBeenCalledWith('id-2');
    });

    it('calls toggleItem exactly once per press', () => {
      mockItems = [ITEM_1];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-item-toggle'));
      expect(mockToggleItem).toHaveBeenCalledTimes(1);
    });
  });

  // ── 6. Delete confirmation ─────────────────────────────────────────────────

  describe('Delete confirmation', () => {
    it('shows Alert.alert when delete button is pressed', () => {
      mockItems = [ITEM_1];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-item-delete'));
      expect(Alert.alert).toHaveBeenCalled();
    });

    it('shows the delete confirmation title in the alert', () => {
      mockItems = [ITEM_1];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-item-delete'));
      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Goal?',
        'This goal will be permanently deleted.',
        expect.any(Array),
      );
    });

    it('calls deleteItem when the confirm button is pressed in the alert', () => {
      mockItems = [ITEM_1];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-item-delete'));

      // Extract the confirm button handler from Alert.alert call
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons: Array<{ text: string; onPress?: () => void }> = alertCall[2];
      const confirmButton = buttons.find((b) => b.text === 'Delete');
      confirmButton?.onPress?.();

      expect(mockDeleteItem).toHaveBeenCalledWith('id-1');
    });

    it('does NOT call deleteItem when cancel is pressed in the alert', () => {
      mockItems = [ITEM_1];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-item-delete'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons: Array<{ text: string; onPress?: () => void }> = alertCall[2];
      const cancelButton = buttons.find((b) => b.text === 'Cancel');
      cancelButton?.onPress?.();

      expect(mockDeleteItem).not.toHaveBeenCalled();
    });

    it('calls deleteItem with the correct id for the second item', () => {
      mockItems = [ITEM_1, ITEM_2];
      const { getAllByTestId } = renderScreen();
      const deleteButtons = getAllByTestId('todo-item-delete');
      fireEvent.press(deleteButtons[1]);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons: Array<{ text: string; onPress?: () => void }> = alertCall[2];
      const confirmButton = buttons.find((b) => b.text === 'Delete');
      confirmButton?.onPress?.();

      expect(mockDeleteItem).toHaveBeenCalledWith('id-2');
    });
  });

  // ── 7. Edit ────────────────────────────────────────────────────────────────

  describe('Edit', () => {
    it('opens the edit form when edit button is pressed', () => {
      mockItems = [ITEM_1];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-item-edit'));
      expect(getByTestId('todo-form')).toBeTruthy();
    });

    it('pre-fills the title input with the existing item title', () => {
      mockItems = [ITEM_1];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-item-edit'));
      const titleInput = getByTestId('todo-form-title-input');
      expect(titleInput.props.value).toBe('Read Quran daily');
    });

    it('pre-fills the notes input with the existing item notes', () => {
      const itemWithNotes = { ...ITEM_1, notes: 'After Fajr' };
      mockItems = [itemWithNotes];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-item-edit'));
      const notesInput = getByTestId('todo-form-notes-input');
      expect(notesInput.props.value).toBe('After Fajr');
    });

    it('shows the edit form title', () => {
      mockItems = [ITEM_1];
      const { getByTestId, getByText } = renderScreen();
      fireEvent.press(getByTestId('todo-item-edit'));
      expect(getByText('Edit Goal')).toBeTruthy();
    });

    it('calls editItem with the correct id and updated title on submit', () => {
      mockItems = [ITEM_1];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-item-edit'));
      fireEvent.changeText(getByTestId('todo-form-title-input'), 'Updated title');
      fireEvent.press(getByTestId('todo-form-save'));
      expect(mockEditItem).toHaveBeenCalledWith('id-1', 'Updated title', undefined);
    });

    it('calls editItem with notes when notes are provided', () => {
      mockItems = [ITEM_1];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-item-edit'));
      fireEvent.changeText(getByTestId('todo-form-title-input'), 'Updated title');
      fireEvent.changeText(getByTestId('todo-form-notes-input'), 'New notes');
      fireEvent.press(getByTestId('todo-form-save'));
      expect(mockEditItem).toHaveBeenCalledWith('id-1', 'Updated title', 'New notes');
    });

    it('does NOT call addItem when editing an existing item', () => {
      mockItems = [ITEM_1];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-item-edit'));
      fireEvent.changeText(getByTestId('todo-form-title-input'), 'Updated title');
      fireEvent.press(getByTestId('todo-form-save'));
      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('shows validation error when editing with empty title', () => {
      mockItems = [ITEM_1];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-item-edit'));
      fireEvent.changeText(getByTestId('todo-form-title-input'), '');
      fireEvent.press(getByTestId('todo-form-save'));
      expect(getByTestId('todo-form-title-error')).toBeTruthy();
      expect(mockEditItem).not.toHaveBeenCalled();
    });

    it('dismisses the edit form after successful submission', async () => {
      mockItems = [ITEM_1];
      const { getByTestId, queryByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-item-edit'));
      fireEvent.changeText(getByTestId('todo-form-title-input'), 'Updated title');
      fireEvent.press(getByTestId('todo-form-save'));
      await waitFor(() => {
        expect(queryByTestId('todo-form')).toBeNull();
      });
    });
  });

  // ── Header ─────────────────────────────────────────────────────────────────

  describe('Header', () => {
    it('renders the screen title', () => {
      mockItems = [];
      const { getByText } = renderScreen();
      expect(getByText('To-Do')).toBeTruthy();
    });

    it('renders the add button in the header', () => {
      mockItems = [];
      const { getByTestId } = renderScreen();
      expect(getByTestId('todo-add-button')).toBeTruthy();
    });

    it('opens the add form from the header add button even when list is non-empty', () => {
      mockItems = [ITEM_1];
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('todo-add-button'));
      expect(getByTestId('todo-form')).toBeTruthy();
    });
  });
});
