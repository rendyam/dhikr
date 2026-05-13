/**
 * Unit tests for src/components/StreakWidget.tsx
 *
 * Covers:
 *   - Renders the streak count
 *   - Renders the flame icon
 *   - Correct accessibilityLabel for checked-in state
 *   - Correct accessibilityLabel for not-checked-in state
 *   - Active styling applied when checkedInToday is true
 *   - Inactive styling applied when checkedInToday is false
 *   - Zero streak renders correctly
 *
 * Requirements: 14.2, 14.5
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { StreakWidget } from '../../src/components/StreakWidget';
import { colors } from '../../src/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

interface RenderOptions {
  streak?: number;
  checkedInToday?: boolean;
}

function renderWidget(options: RenderOptions = {}) {
  const { streak = 7, checkedInToday = false } = options;
  return render(<StreakWidget streak={streak} checkedInToday={checkedInToday} />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('StreakWidget', () => {
  // ── Streak count rendering ─────────────────────────────────────────────────

  it('renders the streak count', () => {
    const { getByTestId } = renderWidget({ streak: 7 });
    expect(getByTestId('streak-widget-count')).toBeTruthy();
    expect(getByTestId('streak-widget-count').props.children).toBe(7);
  });

  it('renders a different streak count', () => {
    const { getByTestId } = renderWidget({ streak: 30 });
    expect(getByTestId('streak-widget-count').props.children).toBe(30);
  });

  it('renders a zero streak count', () => {
    const { getByTestId } = renderWidget({ streak: 0 });
    expect(getByTestId('streak-widget-count').props.children).toBe(0);
  });

  // ── Flame icon rendering ───────────────────────────────────────────────────

  it('renders the flame icon', () => {
    const { getByTestId } = renderWidget();
    expect(getByTestId('streak-widget-flame')).toBeTruthy();
    expect(getByTestId('streak-widget-flame').props.children).toBe('🔥');
  });

  // ── Accessibility labels ───────────────────────────────────────────────────

  it('sets correct accessibilityLabel when checked in today', () => {
    const { getByTestId } = renderWidget({ streak: 7, checkedInToday: true });
    expect(getByTestId('streak-widget').props.accessibilityLabel).toBe(
      '7 day streak, checked in today',
    );
  });

  it('sets correct accessibilityLabel when not checked in today', () => {
    const { getByTestId } = renderWidget({ streak: 7, checkedInToday: false });
    expect(getByTestId('streak-widget').props.accessibilityLabel).toBe(
      '7 day streak, not checked in today',
    );
  });

  it('includes the streak count in the accessibilityLabel', () => {
    const { getByTestId } = renderWidget({ streak: 42, checkedInToday: true });
    expect(getByTestId('streak-widget').props.accessibilityLabel).toContain('42');
  });

  it('sets accessibilityRole="text" on the container', () => {
    const { getByTestId } = renderWidget();
    expect(getByTestId('streak-widget').props.accessibilityRole).toBe('text');
  });

  // ── Visual state: checked in ───────────────────────────────────────────────

  it('applies active (streak) color to count when checkedInToday is true', () => {
    const { getByTestId } = renderWidget({ checkedInToday: true });
    const countStyle = getByTestId('streak-widget-count').props.style;
    // style is an array; find the object with the color property
    const flatStyle = Array.isArray(countStyle)
      ? Object.assign({}, ...countStyle)
      : countStyle;
    expect(flatStyle.color).toBe(colors.streak);
  });

  it('applies active (streak) color to flame when checkedInToday is true', () => {
    const { getByTestId } = renderWidget({ checkedInToday: true });
    const flameStyle = getByTestId('streak-widget-flame').props.style;
    const flatStyle = Array.isArray(flameStyle)
      ? Object.assign({}, ...flameStyle)
      : flameStyle;
    expect(flatStyle.color).toBe(colors.streak);
  });

  // ── Visual state: not checked in ──────────────────────────────────────────

  it('applies disabled color to count when checkedInToday is false', () => {
    const { getByTestId } = renderWidget({ checkedInToday: false });
    const countStyle = getByTestId('streak-widget-count').props.style;
    const flatStyle = Array.isArray(countStyle)
      ? Object.assign({}, ...countStyle)
      : countStyle;
    expect(flatStyle.color).toBe(colors.textDisabled);
  });

  it('applies disabled color to flame when checkedInToday is false', () => {
    const { getByTestId } = renderWidget({ checkedInToday: false });
    const flameStyle = getByTestId('streak-widget-flame').props.style;
    const flatStyle = Array.isArray(flameStyle)
      ? Object.assign({}, ...flameStyle)
      : flameStyle;
    expect(flatStyle.color).toBe(colors.textDisabled);
  });

  // ── Container rendering ────────────────────────────────────────────────────

  it('renders the widget container', () => {
    const { getByTestId } = renderWidget();
    expect(getByTestId('streak-widget')).toBeTruthy();
  });
});
