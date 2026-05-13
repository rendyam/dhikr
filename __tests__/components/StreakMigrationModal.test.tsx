/**
 * Unit tests for src/components/StreakMigrationModal.tsx
 *
 * Covers:
 *   - Modal visibility (visible true / false)
 *   - Local streak count is displayed
 *   - "Migrate My Streak" button calls onMigrate
 *   - "Skip" button calls onSkip
 *   - Loading state: spinner shown, buttons disabled, callbacks not fired
 *   - Error state: error message displayed, Retry button calls onMigrate
 *   - No error shown when error is null
 *   - Accessibility labels and roles on action buttons
 *   - Hardware back / onRequestClose maps to onSkip
 *   - Drag handle and flame icon rendered
 *   - Callback isolation (each fires exactly once per press)
 *
 * Requirements: 22.1–22.8
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StreakMigrationModal } from '../../src/components/StreakMigrationModal';

// ── Helpers ───────────────────────────────────────────────────────────────────

interface RenderOptions {
  visible?: boolean;
  localStreak?: number;
  onMigrate?: () => void;
  onSkip?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

function renderModal(options: RenderOptions = {}) {
  const {
    visible = true,
    localStreak = 7,
    onMigrate = jest.fn(),
    onSkip = jest.fn(),
    isLoading = false,
    error = null,
  } = options;

  const utils = render(
    <StreakMigrationModal
      visible={visible}
      localStreak={localStreak}
      onMigrate={onMigrate}
      onSkip={onSkip}
      isLoading={isLoading}
      error={error}
    />,
  );

  return { ...utils, onMigrate, onSkip };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('StreakMigrationModal', () => {
  // ── Visibility ─────────────────────────────────────────────────────────────

  it('renders the sheet when visible is true', () => {
    const { getByTestId } = renderModal({ visible: true });
    expect(getByTestId('streak-migration-sheet')).toBeTruthy();
  });

  it('does not render the sheet content when visible is false', () => {
    const { queryByTestId } = renderModal({ visible: false });
    expect(queryByTestId('streak-migration-sheet')).toBeNull();
  });

  // ── Streak count ───────────────────────────────────────────────────────────

  it('displays the local streak count', () => {
    const { getByTestId } = renderModal({ localStreak: 7 });
    expect(getByTestId('streak-migration-streak-count').props.children).toBe(7);
  });

  it('displays a different local streak count', () => {
    const { getByTestId } = renderModal({ localStreak: 30 });
    expect(getByTestId('streak-migration-streak-count').props.children).toBe(30);
  });

  it('displays streak count of 1', () => {
    const { getByTestId } = renderModal({ localStreak: 1 });
    expect(getByTestId('streak-migration-streak-count').props.children).toBe(1);
  });

  // ── Flame icon ─────────────────────────────────────────────────────────────

  it('renders the flame icon', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-migration-flame')).toBeTruthy();
    expect(getByTestId('streak-migration-flame').props.children).toBe('🔥');
  });

  // ── Title and body ─────────────────────────────────────────────────────────

  it('renders the title', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-migration-title')).toBeTruthy();
  });

  it('renders the body copy mentioning the streak count', () => {
    const { getByTestId } = renderModal({ localStreak: 5 });
    // children is an array when JSX interpolation is used, so flatten to string
    const children = getByTestId('streak-migration-body').props.children;
    const bodyText = Array.isArray(children) ? children.join('') : String(children);
    expect(bodyText).toContain('5');
  });

  it('renders the secondary body copy about skipping', () => {
    const { getByTestId } = renderModal();
    const secondary = getByTestId('streak-migration-body-secondary').props.children as string;
    expect(secondary).toMatch(/skip/i);
  });

  // ── Drag handle ────────────────────────────────────────────────────────────

  it('renders the drag handle', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-migration-handle')).toBeTruthy();
  });

  // ── Migrate button ─────────────────────────────────────────────────────────

  it('renders the Migrate button', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-migration-migrate-button')).toBeTruthy();
  });

  it('calls onMigrate when Migrate button is pressed', () => {
    const onMigrate = jest.fn();
    const { getByTestId } = renderModal({ onMigrate });
    fireEvent.press(getByTestId('streak-migration-migrate-button'));
    expect(onMigrate).toHaveBeenCalledTimes(1);
  });

  it('does not call onSkip when Migrate button is pressed', () => {
    const onSkip = jest.fn();
    const { getByTestId } = renderModal({ onSkip });
    fireEvent.press(getByTestId('streak-migration-migrate-button'));
    expect(onSkip).not.toHaveBeenCalled();
  });

  it('sets correct accessibilityLabel on Migrate button', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-migration-migrate-button').props.accessibilityLabel).toBe(
      'Migrate local streak to account',
    );
  });

  it('sets accessibilityRole="button" on Migrate button', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-migration-migrate-button').props.accessibilityRole).toBe('button');
  });

  // ── Skip button ────────────────────────────────────────────────────────────

  it('renders the Skip button', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-migration-skip-button')).toBeTruthy();
  });

  it('calls onSkip when Skip button is pressed', () => {
    const onSkip = jest.fn();
    const { getByTestId } = renderModal({ onSkip });
    fireEvent.press(getByTestId('streak-migration-skip-button'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('does not call onMigrate when Skip button is pressed', () => {
    const onMigrate = jest.fn();
    const { getByTestId } = renderModal({ onMigrate });
    fireEvent.press(getByTestId('streak-migration-skip-button'));
    expect(onMigrate).not.toHaveBeenCalled();
  });

  it('sets correct accessibilityLabel on Skip button', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-migration-skip-button').props.accessibilityLabel).toBe(
      'Skip streak migration',
    );
  });

  it('sets accessibilityRole="button" on Skip button', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-migration-skip-button').props.accessibilityRole).toBe('button');
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it('shows a loading indicator when isLoading is true', () => {
    const { getByTestId } = renderModal({ isLoading: true });
    expect(getByTestId('streak-migration-loading-indicator')).toBeTruthy();
  });

  it('does not show a loading indicator when isLoading is false', () => {
    const { queryByTestId } = renderModal({ isLoading: false });
    expect(queryByTestId('streak-migration-loading-indicator')).toBeNull();
  });

  it('disables the Migrate button when isLoading is true', () => {
    const { getByTestId } = renderModal({ isLoading: true });
    expect(getByTestId('streak-migration-migrate-button').props.accessibilityState.disabled).toBe(
      true,
    );
  });

  it('disables the Skip button when isLoading is true', () => {
    const { getByTestId } = renderModal({ isLoading: true });
    expect(getByTestId('streak-migration-skip-button').props.accessibilityState.disabled).toBe(
      true,
    );
  });

  it('does not call onMigrate when Migrate button is pressed while loading', () => {
    const onMigrate = jest.fn();
    const { getByTestId } = renderModal({ isLoading: true, onMigrate });
    fireEvent.press(getByTestId('streak-migration-migrate-button'));
    expect(onMigrate).not.toHaveBeenCalled();
  });

  it('does not call onSkip when Skip button is pressed while loading', () => {
    const onSkip = jest.fn();
    const { getByTestId } = renderModal({ isLoading: true, onSkip });
    fireEvent.press(getByTestId('streak-migration-skip-button'));
    expect(onSkip).not.toHaveBeenCalled();
  });

  it('marks the Migrate button as busy when isLoading is true', () => {
    const { getByTestId } = renderModal({ isLoading: true });
    expect(getByTestId('streak-migration-migrate-button').props.accessibilityState.busy).toBe(
      true,
    );
  });

  // ── Error state ────────────────────────────────────────────────────────────

  it('shows the error message when error is set', () => {
    const { getByTestId } = renderModal({ error: 'Migration failed. Please try again.' });
    expect(getByTestId('streak-migration-error')).toBeTruthy();
    expect(getByTestId('streak-migration-error-text').props.children).toBe(
      'Migration failed. Please try again.',
    );
  });

  it('does not show the error container when error is null', () => {
    const { queryByTestId } = renderModal({ error: null });
    expect(queryByTestId('streak-migration-error')).toBeNull();
  });

  it('renders the Retry button when error is set', () => {
    const { getByTestId } = renderModal({ error: 'Something went wrong.' });
    expect(getByTestId('streak-migration-retry-button')).toBeTruthy();
  });

  it('calls onMigrate when Retry button is pressed', () => {
    const onMigrate = jest.fn();
    const { getByTestId } = renderModal({
      error: 'Something went wrong.',
      onMigrate,
    });
    fireEvent.press(getByTestId('streak-migration-retry-button'));
    expect(onMigrate).toHaveBeenCalledTimes(1);
  });

  it('sets accessibilityRole="button" on Retry button', () => {
    const { getByTestId } = renderModal({ error: 'Error.' });
    expect(getByTestId('streak-migration-retry-button').props.accessibilityRole).toBe('button');
  });

  it('sets correct accessibilityLabel on Retry button', () => {
    const { getByTestId } = renderModal({ error: 'Error.' });
    expect(getByTestId('streak-migration-retry-button').props.accessibilityLabel).toBe(
      'Retry streak migration',
    );
  });

  it('error container has accessibilityRole="alert"', () => {
    const { getByTestId } = renderModal({ error: 'Error.' });
    expect(getByTestId('streak-migration-error').props.accessibilityRole).toBe('alert');
  });

  // ── Hardware back / onRequestClose ─────────────────────────────────────────

  it('calls onSkip when the modal is dismissed via hardware back', () => {
    const onSkip = jest.fn();
    const { getByTestId } = renderModal({ onSkip });
    const modal = getByTestId('streak-migration-modal');
    fireEvent(modal, 'requestClose');
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  // ── Callback isolation ─────────────────────────────────────────────────────

  it('each callback is called exactly once per press', () => {
    const onMigrate = jest.fn();
    const onSkip = jest.fn();
    const { getByTestId } = renderModal({ onMigrate, onSkip });

    fireEvent.press(getByTestId('streak-migration-migrate-button'));
    fireEvent.press(getByTestId('streak-migration-skip-button'));

    expect(onMigrate).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
