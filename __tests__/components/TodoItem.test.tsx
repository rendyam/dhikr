/**
 * Unit tests for src/components/TodoItem.tsx
 *
 * Covers:
 *   - Renders the item title
 *   - Completed items show strikethrough style and disabled text color
 *   - Incomplete items show normal style and primary text color
 *   - Checkbox has correct accessibilityRole and accessibilityState
 *   - Tapping the toggle calls onToggle
 *   - Tapping the delete button calls onDelete
 *   - Tapping the edit button calls onEdit
 *   - testIDs are present on all interactive elements
 *
 * Requirements: 17.3, 17.4, 17.5
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TodoItem } from '../../src/components/TodoItem';
import type { TodoItem as TodoItemType } from '../../src/types/user';
import { colors } from '../../src/theme';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseTodo: TodoItemType = {
  id: 'test-uuid-1',
  title: 'Read morning adhkar',
  notes: null,
  completed: false,
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
  deletedAt: null,
};

const completedTodo: TodoItemType = {
  ...baseTodo,
  id: 'test-uuid-2',
  completed: true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

interface RenderOptions {
  item?: TodoItemType;
  onToggle?: jest.Mock;
  onDelete?: jest.Mock;
  onEdit?: jest.Mock;
}

function renderTodoItem(options: RenderOptions = {}) {
  const {
    item = baseTodo,
    onToggle = jest.fn(),
    onDelete = jest.fn(),
    onEdit = jest.fn(),
  } = options;

  const utils = render(
    <TodoItem
      item={item}
      onToggle={onToggle}
      onDelete={onDelete}
      onEdit={onEdit}
    />,
  );

  return { ...utils, onToggle, onDelete, onEdit };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TodoItem', () => {
  // ── Structural rendering ───────────────────────────────────────────────────

  it('renders the item container', () => {
    const { getByTestId } = renderTodoItem();
    expect(getByTestId('todo-item')).toBeTruthy();
  });

  it('renders the toggle button', () => {
    const { getByTestId } = renderTodoItem();
    expect(getByTestId('todo-item-toggle')).toBeTruthy();
  });

  it('renders the title', () => {
    const { getByTestId } = renderTodoItem();
    expect(getByTestId('todo-item-title')).toBeTruthy();
  });

  it('renders the delete button', () => {
    const { getByTestId } = renderTodoItem();
    expect(getByTestId('todo-item-delete')).toBeTruthy();
  });

  it('renders the edit button', () => {
    const { getByTestId } = renderTodoItem();
    expect(getByTestId('todo-item-edit')).toBeTruthy();
  });

  // ── Title text ─────────────────────────────────────────────────────────────

  it('displays the item title', () => {
    const { getByText } = renderTodoItem();
    expect(getByText('Read morning adhkar')).toBeTruthy();
  });

  it('displays a different title correctly', () => {
    const item = { ...baseTodo, title: 'Recite Ayat al-Kursi' };
    const { getByText } = renderTodoItem({ item });
    expect(getByText('Recite Ayat al-Kursi')).toBeTruthy();
  });

  // ── Visual state: incomplete ───────────────────────────────────────────────

  it('applies primary text color to an incomplete item title', () => {
    const { getByTestId } = renderTodoItem({ item: baseTodo });
    const titleEl = getByTestId('todo-item-title');
    const flatStyle = Array.isArray(titleEl.props.style)
      ? Object.assign({}, ...titleEl.props.style.filter(Boolean))
      : titleEl.props.style;
    expect(flatStyle.color).toBe(colors.textPrimary);
  });

  it('does not apply strikethrough to an incomplete item title', () => {
    const { getByTestId } = renderTodoItem({ item: baseTodo });
    const titleEl = getByTestId('todo-item-title');
    const flatStyle = Array.isArray(titleEl.props.style)
      ? Object.assign({}, ...titleEl.props.style.filter(Boolean))
      : titleEl.props.style;
    expect(flatStyle.textDecorationLine).not.toBe('line-through');
  });

  // ── Visual state: completed ────────────────────────────────────────────────

  it('applies strikethrough to a completed item title', () => {
    const { getByTestId } = renderTodoItem({ item: completedTodo });
    const titleEl = getByTestId('todo-item-title');
    const flatStyle = Array.isArray(titleEl.props.style)
      ? Object.assign({}, ...titleEl.props.style.filter(Boolean))
      : titleEl.props.style;
    expect(flatStyle.textDecorationLine).toBe('line-through');
  });

  it('applies disabled text color to a completed item title', () => {
    const { getByTestId } = renderTodoItem({ item: completedTodo });
    const titleEl = getByTestId('todo-item-title');
    const flatStyle = Array.isArray(titleEl.props.style)
      ? Object.assign({}, ...titleEl.props.style.filter(Boolean))
      : titleEl.props.style;
    expect(flatStyle.color).toBe(colors.textDisabled);
  });

  // ── Accessibility: checkbox ────────────────────────────────────────────────

  it('sets accessibilityRole="checkbox" on the toggle', () => {
    const { getByTestId } = renderTodoItem();
    expect(getByTestId('todo-item-toggle').props.accessibilityRole).toBe('checkbox');
  });

  it('sets accessibilityState.checked=false for an incomplete item', () => {
    const { getByTestId } = renderTodoItem({ item: baseTodo });
    expect(getByTestId('todo-item-toggle').props.accessibilityState).toEqual(
      expect.objectContaining({ checked: false }),
    );
  });

  it('sets accessibilityState.checked=true for a completed item', () => {
    const { getByTestId } = renderTodoItem({ item: completedTodo });
    expect(getByTestId('todo-item-toggle').props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true }),
    );
  });

  // ── Accessibility: action buttons ─────────────────────────────────────────

  it('sets accessibilityRole="button" on the delete button', () => {
    const { getByTestId } = renderTodoItem();
    expect(getByTestId('todo-item-delete').props.accessibilityRole).toBe('button');
  });

  it('sets accessibilityRole="button" on the edit button', () => {
    const { getByTestId } = renderTodoItem();
    expect(getByTestId('todo-item-edit').props.accessibilityRole).toBe('button');
  });

  // ── Callbacks ─────────────────────────────────────────────────────────────

  it('calls onToggle when the toggle is pressed', () => {
    const { getByTestId, onToggle } = renderTodoItem();
    fireEvent.press(getByTestId('todo-item-toggle'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onToggle exactly once per tap', () => {
    const { getByTestId, onToggle } = renderTodoItem();
    fireEvent.press(getByTestId('todo-item-toggle'));
    fireEvent.press(getByTestId('todo-item-toggle'));
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('calls onDelete when the delete button is pressed', () => {
    const { getByTestId, onDelete } = renderTodoItem();
    fireEvent.press(getByTestId('todo-item-delete'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when the edit button is pressed', () => {
    const { getByTestId, onEdit } = renderTodoItem();
    fireEvent.press(getByTestId('todo-item-edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('does not call onDelete when the toggle is pressed', () => {
    const { getByTestId, onDelete } = renderTodoItem();
    fireEvent.press(getByTestId('todo-item-toggle'));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('does not call onEdit when the delete button is pressed', () => {
    const { getByTestId, onEdit } = renderTodoItem();
    fireEvent.press(getByTestId('todo-item-delete'));
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('does not call onToggle when the delete button is pressed', () => {
    const { getByTestId, onToggle } = renderTodoItem();
    fireEvent.press(getByTestId('todo-item-delete'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  // ── Completed item toggle ──────────────────────────────────────────────────

  it('calls onToggle when a completed item toggle is pressed', () => {
    const { getByTestId, onToggle } = renderTodoItem({ item: completedTodo });
    fireEvent.press(getByTestId('todo-item-toggle'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
