/**
 * Unit tests for src/components/Counter.tsx
 *
 * Covers:
 *   - Renders count-only display when no target is provided
 *   - Renders "count / target" format when target is defined
 *   - Tapping the counter calls onTap
 *   - Long-pressing the counter calls onLongPress
 *   - Completion state is shown when count >= target
 *   - No completion state when count < target
 *   - Accessibility role and label are correct
 *   - Accessibility label updates with count and target
 *
 * Requirements: 4.2, 4.3, 5.1, 5.2, 5.3, 5.4
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Counter } from '../../src/components/Counter';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Renders Counter with sensible defaults, allowing overrides. */
function renderCounter(props: Partial<React.ComponentProps<typeof Counter>> = {}) {
  const defaults = {
    count: 0,
    onTap: jest.fn(),
    onLongPress: jest.fn(),
  };
  return render(<Counter {...defaults} {...props} />);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Counter', () => {
  // ── Count display ──────────────────────────────────────────────────────────

  it('displays the count when no target is provided', () => {
    const { getByTestId } = renderCounter({ count: 7 });
    expect(getByTestId('counter-count-text').props.children).toBe('7');
  });

  it('displays "count / target" format when target is defined', () => {
    const { getByTestId } = renderCounter({ count: 5, target: 33 });
    expect(getByTestId('counter-count-text').props.children).toBe('5 / 33');
  });

  it('displays "0 / target" when count is 0 and target is defined', () => {
    const { getByTestId } = renderCounter({ count: 0, target: 33 });
    expect(getByTestId('counter-count-text').props.children).toBe('0 / 33');
  });

  it('displays count as a plain number string when target is undefined', () => {
    const { getByTestId } = renderCounter({ count: 42 });
    expect(getByTestId('counter-count-text').props.children).toBe('42');
  });

  // ── Tap callback ───────────────────────────────────────────────────────────

  it('calls onTap when the counter is pressed', () => {
    const onTap = jest.fn();
    const { getByTestId } = renderCounter({ onTap });
    fireEvent.press(getByTestId('counter-pressable'));
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it('calls onTap exactly once per press', () => {
    const onTap = jest.fn();
    const { getByTestId } = renderCounter({ onTap });
    fireEvent.press(getByTestId('counter-pressable'));
    fireEvent.press(getByTestId('counter-pressable'));
    fireEvent.press(getByTestId('counter-pressable'));
    expect(onTap).toHaveBeenCalledTimes(3);
  });

  // ── Long-press callback ────────────────────────────────────────────────────

  it('calls onLongPress when the counter is long-pressed', () => {
    const onLongPress = jest.fn();
    const { getByTestId } = renderCounter({ onLongPress });
    fireEvent(getByTestId('counter-pressable'), 'longPress');
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onTap when long-pressing', () => {
    const onTap = jest.fn();
    const onLongPress = jest.fn();
    const { getByTestId } = renderCounter({ onTap, onLongPress });
    fireEvent(getByTestId('counter-pressable'), 'longPress');
    expect(onTap).not.toHaveBeenCalled();
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  // ── Completion state ───────────────────────────────────────────────────────

  it('shows the completion indicator when count equals target', () => {
    const { getByTestId } = renderCounter({ count: 33, target: 33 });
    expect(getByTestId('counter-complete-indicator')).toBeTruthy();
  });

  it('shows the completion indicator when count exceeds target', () => {
    const { getByTestId } = renderCounter({ count: 40, target: 33 });
    expect(getByTestId('counter-complete-indicator')).toBeTruthy();
  });

  it('does not show the completion indicator when count is below target', () => {
    const { queryByTestId } = renderCounter({ count: 10, target: 33 });
    expect(queryByTestId('counter-complete-indicator')).toBeNull();
  });

  it('does not show the completion indicator when no target is provided', () => {
    const { queryByTestId } = renderCounter({ count: 100 });
    expect(queryByTestId('counter-complete-indicator')).toBeNull();
  });

  it('does not show the completion indicator when count is 0 and target is defined', () => {
    const { queryByTestId } = renderCounter({ count: 0, target: 33 });
    expect(queryByTestId('counter-complete-indicator')).toBeNull();
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it('sets accessibilityRole to "button" on the pressable', () => {
    const { getByTestId } = renderCounter({ count: 5 });
    expect(getByTestId('counter-pressable').props.accessibilityRole).toBe('button');
  });

  it('sets accessibilityLabel to "Count N" when no target is provided', () => {
    const { getByTestId } = renderCounter({ count: 7 });
    expect(getByTestId('counter-pressable').props.accessibilityLabel).toBe('Count 7');
  });

  it('sets accessibilityLabel to "Count N of M" when target is defined', () => {
    const { getByTestId } = renderCounter({ count: 5, target: 33 });
    expect(getByTestId('counter-pressable').props.accessibilityLabel).toBe('Count 5 of 33');
  });

  it('includes ", complete" in accessibilityLabel when count >= target', () => {
    const { getByTestId } = renderCounter({ count: 33, target: 33 });
    expect(getByTestId('counter-pressable').props.accessibilityLabel).toBe(
      'Count 33 of 33, complete',
    );
  });

  it('sets accessibilityHint describing tap and long-press actions', () => {
    const { getByTestId } = renderCounter();
    expect(getByTestId('counter-pressable').props.accessibilityHint).toBeTruthy();
  });

  // ── Structural rendering ───────────────────────────────────────────────────

  it('renders the ring track', () => {
    const { getByTestId } = renderCounter();
    expect(getByTestId('counter-ring-track')).toBeTruthy();
  });

  it('renders the inner circle', () => {
    const { getByTestId } = renderCounter();
    expect(getByTestId('counter-inner')).toBeTruthy();
  });

  it('renders the wrapper', () => {
    const { getByTestId } = renderCounter();
    expect(getByTestId('counter-wrapper')).toBeTruthy();
  });
});
