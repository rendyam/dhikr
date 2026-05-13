/**
 * To-Do List screen — personal dhikr goals and reminders.
 *
 * Features:
 *   - FlatList of TodoItem components from todoStore
 *   - Empty state prompt when list is empty
 *   - FAB / header button to open add form (modal)
 *   - Add form: title (required) + notes (optional)
 *   - Edit mode: pre-filled form, calls editItem
 *   - Delete: Alert confirmation before deleteItem
 *   - Toggle: direct call to toggleItem
 *
 * Requirements: 17.1–17.10
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTodoStore } from '@/store/todoStore';
import { TodoItem } from '@/components/TodoItem';
import { colors, spacing, radii } from '@/theme';
import type { TodoItem as TodoItemType } from '@/types/user';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  notes: string;
  titleError: string;
}

const INITIAL_FORM: FormState = { title: '', notes: '', titleError: '' };

// ── Component ─────────────────────────────────────────────────────────────────

export default function TodoScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const items = useTodoStore((s) => s.items);
  const addItem = useTodoStore((s) => s.addItem);
  const toggleItem = useTodoStore((s) => s.toggleItem);
  const editItem = useTodoStore((s) => s.editItem);
  const deleteItem = useTodoStore((s) => s.deleteItem);

  // ── Modal / form state ────────────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<TodoItemType | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openAddForm = useCallback(() => {
    setEditingItem(null);
    setForm(INITIAL_FORM);
    setModalVisible(true);
  }, []);

  const openEditForm = useCallback((item: TodoItemType) => {
    setEditingItem(item);
    setForm({ title: item.title, notes: item.notes ?? '', titleError: '' });
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingItem(null);
    setForm(INITIAL_FORM);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      setForm((prev) => ({ ...prev, titleError: t('todo.titleRequired') }));
      return;
    }

    const notes = form.notes.trim() || undefined;

    if (editingItem) {
      editItem(editingItem.id, trimmedTitle, notes);
    } else {
      addItem(trimmedTitle, notes);
    }

    closeModal();
  }, [form, editingItem, addItem, editItem, closeModal, t]);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(
        t('todo.deleteConfirmTitle'),
        t('todo.deleteConfirmMessage'),
        [
          {
            text: t('todo.deleteCancel'),
            style: 'cancel',
          },
          {
            text: t('todo.deleteConfirm'),
            style: 'destructive',
            onPress: () => deleteItem(id),
          },
        ],
      );
    },
    [deleteItem, t],
  );

  const handleToggle = useCallback(
    (id: string) => {
      toggleItem(id);
    },
    [toggleItem],
  );

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: TodoItemType }) => (
      <TodoItem
        item={item}
        onToggle={() => handleToggle(item.id)}
        onDelete={() => handleDelete(item.id)}
        onEdit={() => openEditForm(item)}
      />
    ),
    [handleToggle, handleDelete, openEditForm],
  );

  const keyExtractor = useCallback((item: TodoItemType) => item.id, []);

  // ── Empty state ───────────────────────────────────────────────────────────

  const renderEmptyState = () => (
    <View style={styles.emptyContainer} testID="todo-empty">
      <Text style={styles.emptyTitle} testID="todo-empty-title">
        {t('todo.emptyTitle')}
      </Text>
      <Text style={styles.emptyMessage} testID="todo-empty-message">
        {t('todo.emptyMessage')}
      </Text>
      <TouchableOpacity
        style={styles.emptyAddButton}
        onPress={openAddForm}
        accessibilityRole="button"
        testID="todo-empty-add-button"
      >
        <Text style={styles.emptyAddButtonText}>{t('todo.addButton')}</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={styles.safeArea}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('todo.title')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddForm}
          accessibilityRole="button"
          accessibilityLabel={t('todo.addButton')}
          testID="todo-add-button"
        >
          <Text style={styles.addButtonText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* ── List or empty state ── */}
      {items.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          testID="todo-list"
        />
      )}

      {/* ── Add / Edit modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
        testID="todo-modal"
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet} testID="todo-form">
            {/* Modal title */}
            <Text style={styles.modalTitle}>
              {editingItem ? t('todo.editTitle') : t('todo.addTitle')}
            </Text>

            {/* Title field */}
            <Text style={styles.fieldLabel}>{t('todo.titleLabel')}</Text>
            <TextInput
              style={[styles.input, form.titleError ? styles.inputError : null]}
              placeholder={t('todo.titlePlaceholder')}
              placeholderTextColor={colors.textDisabled}
              value={form.title}
              onChangeText={(text) =>
                setForm((prev) => ({ ...prev, title: text, titleError: '' }))
              }
              autoFocus
              returnKeyType="next"
              testID="todo-form-title-input"
            />
            {form.titleError ? (
              <Text style={styles.errorText} testID="todo-form-title-error">
                {form.titleError}
              </Text>
            ) : null}

            {/* Notes field */}
            <Text style={styles.fieldLabel}>{t('todo.notesLabel')}</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder={t('todo.notesPlaceholder')}
              placeholderTextColor={colors.textDisabled}
              value={form.notes}
              onChangeText={(text) =>
                setForm((prev) => ({ ...prev, notes: text }))
              }
              multiline
              numberOfLines={3}
              returnKeyType="done"
              testID="todo-form-notes-input"
            />

            {/* Action buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                accessibilityRole="button"
                testID="todo-form-cancel"
              >
                <Text style={styles.cancelButtonText}>{t('todo.cancelButton')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit}
                accessibilityRole="button"
                testID="todo-form-save"
              >
                <Text style={styles.saveButtonText}>{t('todo.saveButton')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  addButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    color: colors.textInverse,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '400',
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent: {
    padding: spacing[4],
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },

  emptyMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[6],
  },

  emptyAddButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
  },

  emptyAddButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },

  modalSheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing[6],
    paddingBottom: spacing[8],
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing[4],
  },

  // ── Form fields ───────────────────────────────────────────────────────────
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: spacing[3],
  },

  inputError: {
    borderColor: colors.error,
    marginBottom: spacing[1],
  },

  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  errorText: {
    fontSize: 13,
    color: colors.error,
    marginBottom: spacing[3],
  },

  // ── Modal action buttons ──────────────────────────────────────────────────
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[3],
    marginTop: spacing[2],
  },

  cancelButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cancelButtonText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  saveButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },

  saveButtonText: {
    fontSize: 15,
    color: colors.textInverse,
    fontWeight: '600',
  },
});
