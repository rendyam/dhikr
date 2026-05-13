/**
 * TodoItem — a single row in the To-Do List.
 *
 * Displays:
 *   - A checkbox toggle (accessibilityRole="checkbox")
 *   - The item title (strikethrough + disabled color when completed)
 *   - An edit button
 *   - A delete button
 *
 * The confirmation prompt for delete is handled by the caller — this
 * component simply calls `onDelete` directly, keeping it fully testable.
 *
 * Requirements: 17.3, 17.4, 17.5
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { TodoItem as TodoItemType } from '@/types/user';
import { colors, spacing, radii } from '@/theme';

// ── Props ────────────────────────────────────────────────────────────────────

export interface TodoItemProps {
  /** The to-do item to display. */
  item: TodoItemType;
  /** Called when the user taps the checkbox toggle. */
  onToggle: () => void;
  /** Called when the user taps the delete button. */
  onDelete: () => void;
  /** Called when the user taps the edit button. */
  onEdit: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Single to-do list row with checkbox, title, edit, and delete actions.
 *
 * Accessibility:
 *   - Toggle: `accessibilityRole="checkbox"` with `accessibilityState.checked`
 *     reflecting the current completion state.
 *   - Delete button: `accessibilityRole="button"` with descriptive label.
 *   - Edit button: `accessibilityRole="button"` with descriptive label.
 */
export function TodoItem({
  item,
  onToggle,
  onDelete,
  onEdit,
}: TodoItemProps): React.JSX.Element {
  return (
    <View style={styles.row} testID="todo-item">
      {/* ── Checkbox toggle ── */}
      <TouchableOpacity
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.completed }}
        accessibilityLabel={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        testID="todo-item-toggle"
        style={styles.checkbox}
      >
        <View style={[styles.checkboxBox, item.completed && styles.checkboxBoxChecked]}>
          {item.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      {/* ── Title ── */}
      <Text
        style={[styles.title, item.completed && styles.titleCompleted]}
        numberOfLines={2}
        testID="todo-item-title"
      >
        {item.title}
      </Text>

      {/* ── Action buttons ── */}
      <View style={styles.actions}>
        {/* Edit button */}
        <TouchableOpacity
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel="Edit to-do item"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID="todo-item-edit"
          style={styles.actionButton}
        >
          <Text style={styles.actionIcon}>✎</Text>
        </TouchableOpacity>

        {/* Delete button */}
        <TouchableOpacity
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete to-do item"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID="todo-item-delete"
          style={styles.actionButton}
        >
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    marginBottom: spacing[2],
  },

  checkbox: {
    marginRight: spacing[3],
  },

  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },

  checkboxBoxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  checkmark: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },

  title: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },

  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textDisabled,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing[2],
  },

  actionButton: {
    marginLeft: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionIcon: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  deleteIcon: {
    fontSize: 16,
    color: colors.error,
  },
});
