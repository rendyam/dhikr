/**
 * Unit tests for src/components/BadgeDisplay.tsx
 *
 * Covers:
 *   - Renders the container with testID "badge-display"
 *   - Renders all three milestone badge items (7, 30, 100)
 *   - Earned badges show the correct icon and label
 *   - Unearned badges show the lock icon and greyed-out label
 *   - accessibilityLabel for earned badge includes milestone and earned date
 *   - accessibilityLabel for unearned badge says "not yet earned"
 *   - Mixed state: some earned, some not
 *   - Empty badges array renders all three as unearned
 *   - All three earned renders all as earned
 *
 * Requirements: 14.6, 14.7
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { BadgeDisplay } from '../../src/components/BadgeDisplay';
import type { Badge } from '../../src/types/user';

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** Jan 1, 2024 00:00:00 UTC */
const JAN_1_2024 = 1704067200;

const badge7: Badge = { milestone: 7, earnedAt: JAN_1_2024, rewardClaimed: false };
const badge30: Badge = { milestone: 30, earnedAt: JAN_1_2024 + 86400 * 23, rewardClaimed: false };
const badge100: Badge = { milestone: 100, earnedAt: JAN_1_2024 + 86400 * 93, rewardClaimed: true };

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderDisplay(badges: Badge[] = []) {
  return render(<BadgeDisplay badges={badges} />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BadgeDisplay', () => {
  // ── Container ─────────────────────────────────────────────────────────────

  it('renders the badge-display container', () => {
    const { getByTestId } = renderDisplay();
    expect(getByTestId('badge-display')).toBeTruthy();
  });

  // ── All three milestones always rendered ──────────────────────────────────

  it('always renders the 7-day badge item', () => {
    const { getByTestId } = renderDisplay();
    expect(getByTestId('badge-item-7')).toBeTruthy();
  });

  it('always renders the 30-day badge item', () => {
    const { getByTestId } = renderDisplay();
    expect(getByTestId('badge-item-30')).toBeTruthy();
  });

  it('always renders the 100-day badge item', () => {
    const { getByTestId } = renderDisplay();
    expect(getByTestId('badge-item-100')).toBeTruthy();
  });

  // ── Milestone labels ───────────────────────────────────────────────────────

  it('renders "7 days" label for the 7-day badge', () => {
    const { getByTestId } = renderDisplay();
    expect(getByTestId('badge-label-7').props.children).toEqual([7, ' days']);
  });

  it('renders "30 days" label for the 30-day badge', () => {
    const { getByTestId } = renderDisplay();
    expect(getByTestId('badge-label-30').props.children).toEqual([30, ' days']);
  });

  it('renders "100 days" label for the 100-day badge', () => {
    const { getByTestId } = renderDisplay();
    expect(getByTestId('badge-label-100').props.children).toEqual([100, ' days']);
  });

  // ── Unearned state (empty badges array) ───────────────────────────────────

  it('shows lock icon for unearned 7-day badge', () => {
    const { getByTestId } = renderDisplay([]);
    expect(getByTestId('badge-lock-7')).toBeTruthy();
  });

  it('shows lock icon for unearned 30-day badge', () => {
    const { getByTestId } = renderDisplay([]);
    expect(getByTestId('badge-lock-30')).toBeTruthy();
  });

  it('shows lock icon for unearned 100-day badge', () => {
    const { getByTestId } = renderDisplay([]);
    expect(getByTestId('badge-lock-100')).toBeTruthy();
  });

  it('sets "not yet earned" accessibilityLabel for unearned 7-day badge', () => {
    const { getByTestId } = renderDisplay([]);
    expect(getByTestId('badge-item-7').props.accessibilityLabel).toBe(
      '7-day streak badge, not yet earned',
    );
  });

  it('sets "not yet earned" accessibilityLabel for unearned 30-day badge', () => {
    const { getByTestId } = renderDisplay([]);
    expect(getByTestId('badge-item-30').props.accessibilityLabel).toBe(
      '30-day streak badge, not yet earned',
    );
  });

  it('sets "not yet earned" accessibilityLabel for unearned 100-day badge', () => {
    const { getByTestId } = renderDisplay([]);
    expect(getByTestId('badge-item-100').props.accessibilityLabel).toBe(
      '100-day streak badge, not yet earned',
    );
  });

  // ── Earned state ──────────────────────────────────────────────────────────

  it('does NOT show lock icon for earned 7-day badge', () => {
    const { queryByTestId } = renderDisplay([badge7]);
    expect(queryByTestId('badge-lock-7')).toBeNull();
  });

  it('does NOT show lock icon for earned 30-day badge', () => {
    const { queryByTestId } = renderDisplay([badge30]);
    expect(queryByTestId('badge-lock-30')).toBeNull();
  });

  it('does NOT show lock icon for earned 100-day badge', () => {
    const { queryByTestId } = renderDisplay([badge100]);
    expect(queryByTestId('badge-lock-100')).toBeNull();
  });

  it('sets earned accessibilityLabel for 7-day badge including date', () => {
    const { getByTestId } = renderDisplay([badge7]);
    const label = getByTestId('badge-item-7').props.accessibilityLabel as string;
    expect(label).toMatch(/^7-day streak badge, earned on /);
    expect(label).toContain('2024');
  });

  it('sets earned accessibilityLabel for 30-day badge including date', () => {
    const { getByTestId } = renderDisplay([badge30]);
    const label = getByTestId('badge-item-30').props.accessibilityLabel as string;
    expect(label).toMatch(/^30-day streak badge, earned on /);
    expect(label).toContain('2024');
  });

  it('sets earned accessibilityLabel for 100-day badge including date', () => {
    const { getByTestId } = renderDisplay([badge100]);
    const label = getByTestId('badge-item-100').props.accessibilityLabel as string;
    expect(label).toMatch(/^100-day streak badge, earned on /);
    expect(label).toContain('2024');
  });

  // ── Icons ─────────────────────────────────────────────────────────────────

  it('renders 🔥 icon for the 7-day badge', () => {
    const { getByTestId } = renderDisplay();
    expect(getByTestId('badge-icon-7').props.children).toBe('🔥');
  });

  it('renders ⭐ icon for the 30-day badge', () => {
    const { getByTestId } = renderDisplay();
    expect(getByTestId('badge-icon-30').props.children).toBe('⭐');
  });

  it('renders 🏆 icon for the 100-day badge', () => {
    const { getByTestId } = renderDisplay();
    expect(getByTestId('badge-icon-100').props.children).toBe('🏆');
  });

  // ── Mixed state ───────────────────────────────────────────────────────────

  it('shows earned state for 7-day and unearned for 30 and 100 when only 7 earned', () => {
    const { queryByTestId } = renderDisplay([badge7]);
    // 7 earned — no lock
    expect(queryByTestId('badge-lock-7')).toBeNull();
    // 30 and 100 unearned — lock present
    expect(queryByTestId('badge-lock-30')).toBeTruthy();
    expect(queryByTestId('badge-lock-100')).toBeTruthy();
  });

  it('shows earned state for 7 and 30, unearned for 100 when two badges earned', () => {
    const { queryByTestId } = renderDisplay([badge7, badge30]);
    expect(queryByTestId('badge-lock-7')).toBeNull();
    expect(queryByTestId('badge-lock-30')).toBeNull();
    expect(queryByTestId('badge-lock-100')).toBeTruthy();
  });

  it('shows no lock icons when all three badges are earned', () => {
    const { queryByTestId } = renderDisplay([badge7, badge30, badge100]);
    expect(queryByTestId('badge-lock-7')).toBeNull();
    expect(queryByTestId('badge-lock-30')).toBeNull();
    expect(queryByTestId('badge-lock-100')).toBeNull();
  });

  // ── Accessibility role ─────────────────────────────────────────────────────

  it('sets accessibilityRole="image" on each badge item', () => {
    const { getByTestId } = renderDisplay([badge7]);
    expect(getByTestId('badge-item-7').props.accessibilityRole).toBe('image');
    expect(getByTestId('badge-item-30').props.accessibilityRole).toBe('image');
    expect(getByTestId('badge-item-100').props.accessibilityRole).toBe('image');
  });
});
