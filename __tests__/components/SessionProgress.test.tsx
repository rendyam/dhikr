/**
 * Unit tests for src/components/SessionProgress.tsx
 *
 * Covers:
 *   - Progress bar fill width reflects current/total ratio
 *   - Fill is 0% when current is 0
 *   - Fill is 100% when current equals total
 *   - Fill is clamped to 100% when current exceeds total
 *   - Fill is 0% when total is 0 (guard against division by zero)
 *   - Accessibility role is "progressbar"
 *   - accessibilityValue exposes min, max, and now
 *
 * Requirements: 4.1
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { SessionProgress } from '../../src/components/SessionProgress';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderProgress(current: number, total: number) {
  return render(<SessionProgress current={current} total={total} />);
}

/**
 * Returns the `width` style value from the fill element.
 * The component sets width as a percentage string, e.g. "33.33%".
 */
function getFillWidth(current: number, total: number): string | number {
  const { getByTestId } = renderProgress(current, total);
  const fill = getByTestId('session-progress-fill');
  // StyleSheet.flatten gives us the resolved style object
  const style = fill.props.style;
  // style may be an array or object; find the width entry
  if (Array.isArray(style)) {
    for (const s of style) {
      if (s && typeof s === 'object' && 'width' in s) return s.width;
    }
  }
  if (style && typeof style === 'object' && 'width' in style) return style.width;
  return '';
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SessionProgress', () => {
  // ── Fill width reflects ratio ──────────────────────────────────────────────

  it('renders a fill width of "0.00%" when current is 0', () => {
    expect(getFillWidth(0, 33)).toBe('0.00%');
  });

  it('renders a fill width of "100.00%" when current equals total', () => {
    expect(getFillWidth(33, 33)).toBe('100.00%');
  });

  it('renders a fill width of "50.00%" when current is half of total', () => {
    expect(getFillWidth(5, 10)).toBe('50.00%');
  });

  it('renders a fill width proportional to current/total (1 of 3)', () => {
    expect(getFillWidth(1, 3)).toBe('33.33%');
  });

  it('renders a fill width proportional to current/total (2 of 3)', () => {
    expect(getFillWidth(2, 3)).toBe('66.67%');
  });

  it('clamps fill width to "100.00%" when current exceeds total', () => {
    expect(getFillWidth(40, 33)).toBe('100.00%');
  });

  it('renders a fill width of "0.00%" when total is 0 (no division by zero)', () => {
    expect(getFillWidth(0, 0)).toBe('0.00%');
  });

  // ── Structural rendering ───────────────────────────────────────────────────

  it('renders the track container', () => {
    const { getByTestId } = renderProgress(5, 10);
    expect(getByTestId('session-progress-track')).toBeTruthy();
  });

  it('renders the fill element', () => {
    const { getByTestId } = renderProgress(5, 10);
    expect(getByTestId('session-progress-fill')).toBeTruthy();
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it('sets accessibilityRole to "progressbar" on the track', () => {
    const { getByTestId } = renderProgress(5, 10);
    expect(getByTestId('session-progress-track').props.accessibilityRole).toBe('progressbar');
  });

  it('sets accessibilityValue.min to 0', () => {
    const { getByTestId } = renderProgress(5, 10);
    expect(getByTestId('session-progress-track').props.accessibilityValue.min).toBe(0);
  });

  it('sets accessibilityValue.max to total', () => {
    const { getByTestId } = renderProgress(5, 10);
    expect(getByTestId('session-progress-track').props.accessibilityValue.max).toBe(10);
  });

  it('sets accessibilityValue.now to current', () => {
    const { getByTestId } = renderProgress(5, 10);
    expect(getByTestId('session-progress-track').props.accessibilityValue.now).toBe(5);
  });

  it('updates accessibilityValue.now when current changes', () => {
    const { getByTestId, rerender } = renderProgress(3, 10);
    expect(getByTestId('session-progress-track').props.accessibilityValue.now).toBe(3);

    rerender(<SessionProgress current={7} total={10} />);
    expect(getByTestId('session-progress-track').props.accessibilityValue.now).toBe(7);
  });
});
