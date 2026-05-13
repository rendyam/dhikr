/**
 * Unit tests for src/components/StreakNudgeModal.tsx
 *
 * Covers:
 *   - Modal is visible when `visible` prop is true
 *   - Modal is not visible when `visible` prop is false
 *   - Streak count is displayed
 *   - "Sign In" button calls onSignIn callback
 *   - "Maybe Later" button calls onLater callback
 *   - "Don't show again" button calls onDismissPermanently callback
 *   - Tapping the backdrop calls onLater
 *   - Flame icon is rendered
 *   - Title and body copy are rendered
 *   - Accessibility labels are set on action buttons
 *
 * Requirements: 21.1–21.8
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StreakNudgeModal } from '../../src/components/StreakNudgeModal';

// ── Helpers ───────────────────────────────────────────────────────────────────

interface RenderOptions {
  visible?: boolean;
  streak?: number;
  onSignIn?: () => void;
  onLater?: () => void;
  onDismissPermanently?: () => void;
}

function renderModal(options: RenderOptions = {}) {
  const {
    visible = true,
    streak = 5,
    onSignIn = jest.fn(),
    onLater = jest.fn(),
    onDismissPermanently = jest.fn(),
  } = options;

  const utils = render(
    <StreakNudgeModal
      visible={visible}
      streak={streak}
      onSignIn={onSignIn}
      onLater={onLater}
      onDismissPermanently={onDismissPermanently}
    />,
  );

  return { ...utils, onSignIn, onLater, onDismissPermanently };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('StreakNudgeModal', () => {
  // ── Visibility ─────────────────────────────────────────────────────────────

  it('renders the sheet when visible is true', () => {
    const { getByTestId } = renderModal({ visible: true });
    expect(getByTestId('streak-nudge-sheet')).toBeTruthy();
  });

  it('does not render the sheet content when visible is false', () => {
    const { queryByTestId } = renderModal({ visible: false });
    // The Modal component hides its children when not visible
    expect(queryByTestId('streak-nudge-sheet')).toBeNull();
  });

  // ── Streak count ───────────────────────────────────────────────────────────

  it('displays the streak count', () => {
    const { getByTestId } = renderModal({ streak: 7 });
    expect(getByTestId('streak-nudge-streak-count').props.children).toBe(7);
  });

  it('displays a different streak count', () => {
    const { getByTestId } = renderModal({ streak: 30 });
    expect(getByTestId('streak-nudge-streak-count').props.children).toBe(30);
  });

  it('displays streak count of 3 (minimum nudge threshold)', () => {
    const { getByTestId } = renderModal({ streak: 3 });
    expect(getByTestId('streak-nudge-streak-count').props.children).toBe(3);
  });

  // ── Flame icon ─────────────────────────────────────────────────────────────

  it('renders the flame icon', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-nudge-flame')).toBeTruthy();
    expect(getByTestId('streak-nudge-flame').props.children).toBe('🔥');
  });

  // ── Title and body ─────────────────────────────────────────────────────────

  it('renders the title', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-nudge-title')).toBeTruthy();
  });

  it('renders the body copy explaining device-only storage', () => {
    const { getByTestId } = renderModal();
    const body = getByTestId('streak-nudge-body').props.children as string;
    expect(body).toMatch(/device/i);
  });

  it('renders the body copy encouraging sign-in', () => {
    const { getByTestId } = renderModal();
    const bodyCta = getByTestId('streak-nudge-body-cta').props.children as string;
    expect(bodyCta).toMatch(/sign in/i);
  });

  // ── Sign In button ─────────────────────────────────────────────────────────

  it('renders the Sign In button', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-nudge-sign-in-button')).toBeTruthy();
  });

  it('calls onSignIn when Sign In button is pressed', () => {
    const onSignIn = jest.fn();
    const { getByTestId } = renderModal({ onSignIn });
    fireEvent.press(getByTestId('streak-nudge-sign-in-button'));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('does not call onLater or onDismissPermanently when Sign In is pressed', () => {
    const onLater = jest.fn();
    const onDismissPermanently = jest.fn();
    const { getByTestId } = renderModal({ onLater, onDismissPermanently });
    fireEvent.press(getByTestId('streak-nudge-sign-in-button'));
    expect(onLater).not.toHaveBeenCalled();
    expect(onDismissPermanently).not.toHaveBeenCalled();
  });

  it('sets correct accessibilityLabel on Sign In button', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-nudge-sign-in-button').props.accessibilityLabel).toBe(
      'Sign in to protect your streak',
    );
  });

  it('sets accessibilityRole="button" on Sign In button', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-nudge-sign-in-button').props.accessibilityRole).toBe('button');
  });

  // ── Maybe Later button ─────────────────────────────────────────────────────

  it('renders the Maybe Later button', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-nudge-later-button')).toBeTruthy();
  });

  it('calls onLater when Maybe Later button is pressed', () => {
    const onLater = jest.fn();
    const { getByTestId } = renderModal({ onLater });
    fireEvent.press(getByTestId('streak-nudge-later-button'));
    expect(onLater).toHaveBeenCalledTimes(1);
  });

  it('does not call onSignIn or onDismissPermanently when Maybe Later is pressed', () => {
    const onSignIn = jest.fn();
    const onDismissPermanently = jest.fn();
    const { getByTestId } = renderModal({ onSignIn, onDismissPermanently });
    fireEvent.press(getByTestId('streak-nudge-later-button'));
    expect(onSignIn).not.toHaveBeenCalled();
    expect(onDismissPermanently).not.toHaveBeenCalled();
  });

  it('sets correct accessibilityLabel on Maybe Later button', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-nudge-later-button').props.accessibilityLabel).toBe(
      'Maybe later, dismiss streak nudge',
    );
  });

  it('sets accessibilityRole="button" on Maybe Later button', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-nudge-later-button').props.accessibilityRole).toBe('button');
  });

  // ── Don't show again button ────────────────────────────────────────────────

  it('renders the Don\'t show again button', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-nudge-dismiss-permanently-button')).toBeTruthy();
  });

  it('calls onDismissPermanently when Don\'t show again is pressed', () => {
    const onDismissPermanently = jest.fn();
    const { getByTestId } = renderModal({ onDismissPermanently });
    fireEvent.press(getByTestId('streak-nudge-dismiss-permanently-button'));
    expect(onDismissPermanently).toHaveBeenCalledTimes(1);
  });

  it('does not call onSignIn or onLater when Don\'t show again is pressed', () => {
    const onSignIn = jest.fn();
    const onLater = jest.fn();
    const { getByTestId } = renderModal({ onSignIn, onLater });
    fireEvent.press(getByTestId('streak-nudge-dismiss-permanently-button'));
    expect(onSignIn).not.toHaveBeenCalled();
    expect(onLater).not.toHaveBeenCalled();
  });

  it('sets correct accessibilityLabel on Don\'t show again button', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-nudge-dismiss-permanently-button').props.accessibilityLabel).toBe(
      "Don't show this again",
    );
  });

  it('sets accessibilityRole="button" on Don\'t show again button', () => {
    const { getByTestId } = renderModal();
    expect(
      getByTestId('streak-nudge-dismiss-permanently-button').props.accessibilityRole,
    ).toBe('button');
  });

  // ── Backdrop ───────────────────────────────────────────────────────────────

  it('calls onLater when the modal is dismissed via hardware back / swipe', () => {
    const onLater = jest.fn();
    const { getByTestId } = renderModal({ onLater });
    // The Modal's onRequestClose (hardware back button / swipe-down) maps to onLater.
    // This is the testable equivalent of tapping the backdrop in the test environment.
    const modal = getByTestId('streak-nudge-modal');
    fireEvent(modal, 'requestClose');
    expect(onLater).toHaveBeenCalledTimes(1);
  });

  // ── Drag handle ────────────────────────────────────────────────────────────

  it('renders the drag handle', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('streak-nudge-handle')).toBeTruthy();
  });

  // ── Callback isolation ─────────────────────────────────────────────────────

  it('each callback is called exactly once per press', () => {
    const onSignIn = jest.fn();
    const onLater = jest.fn();
    const onDismissPermanently = jest.fn();
    const { getByTestId } = renderModal({ onSignIn, onLater, onDismissPermanently });

    fireEvent.press(getByTestId('streak-nudge-sign-in-button'));
    fireEvent.press(getByTestId('streak-nudge-later-button'));
    fireEvent.press(getByTestId('streak-nudge-dismiss-permanently-button'));

    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(onLater).toHaveBeenCalledTimes(1);
    expect(onDismissPermanently).toHaveBeenCalledTimes(1);
  });
});
