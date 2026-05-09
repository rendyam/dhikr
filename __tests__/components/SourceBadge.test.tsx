/**
 * Unit tests for src/components/SourceBadge.tsx
 *
 * Covers:
 *   - Renders the correct localized label for each AuthenticityGrade
 *   - Applies the correct background color for each grade
 *   - Applies the correct text color for each grade
 *   - Exposes correct accessibility attributes
 *
 * Requirements: 3.3, 6.1, 6.2
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import { SourceBadge } from '../../src/components/SourceBadge';
import { colors } from '../../src/theme';
import type { AuthenticityGrade } from '../../src/types/content';

// ── i18n test instance ────────────────────────────────────────────────────────

/**
 * A minimal i18next instance initialized synchronously for tests.
 * Uses the same translation keys as the production en.json locale.
 */
const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        authenticityGrade: {
          sahih: 'Sahih',
          hasan: 'Hasan',
        },
      },
    },
    id: {
      translation: {
        authenticityGrade: {
          sahih: 'Sahih',
          hasan: 'Hasan',
        },
      },
    },
  },
  interpolation: { escapeValue: false },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Flatten a React Native style array/object into a plain object so we can
 * assert individual properties without worrying about StyleSheet IDs.
 */
function flatStyle(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>(
      (acc, s) => ({ ...acc, ...flatStyle(s) }),
      {},
    );
  }
  return style as Record<string, unknown>;
}

/** Renders SourceBadge wrapped in the test i18n provider. */
function renderBadge(grade: AuthenticityGrade) {
  return render(
    <I18nextProvider i18n={testI18n}>
      <SourceBadge grade={grade} />
    </I18nextProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SourceBadge', () => {
  // ── Label rendering ────────────────────────────────────────────────────────

  it('renders "Sahih" label for grade="sahih"', () => {
    const { getByText } = renderBadge('sahih');
    expect(getByText('Sahih')).toBeTruthy();
  });

  it('renders "Hasan" label for grade="hasan"', () => {
    const { getByText } = renderBadge('hasan');
    expect(getByText('Hasan')).toBeTruthy();
  });

  // ── Background color ───────────────────────────────────────────────────────

  it('applies successSubtle background for grade="sahih"', () => {
    const { getByAccessibilityValue, UNSAFE_getByType } = renderBadge('sahih');
    // The pill is the outer View — find it via the accessibility label
    const { getByLabelText } = renderBadge('sahih');
    const pill = getByLabelText('Sahih');
    const style = flatStyle(pill.props.style);
    expect(style.backgroundColor).toBe(colors.successSubtle);
  });

  it('applies warningSubtle background for grade="hasan"', () => {
    const { getByLabelText } = renderBadge('hasan');
    const pill = getByLabelText('Hasan');
    const style = flatStyle(pill.props.style);
    expect(style.backgroundColor).toBe(colors.warningSubtle);
  });

  // ── Text color ─────────────────────────────────────────────────────────────

  it('applies success text color for grade="sahih"', () => {
    const { getByText } = renderBadge('sahih');
    const style = flatStyle(getByText('Sahih').props.style);
    expect(style.color).toBe(colors.success);
  });

  it('applies warning text color for grade="hasan"', () => {
    const { getByText } = renderBadge('hasan');
    const style = flatStyle(getByText('Hasan').props.style);
    expect(style.color).toBe(colors.warning);
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it('sets accessibilityRole to "text" on the pill for grade="sahih"', () => {
    const { getByLabelText } = renderBadge('sahih');
    expect(getByLabelText('Sahih').props.accessibilityRole).toBe('text');
  });

  it('sets accessibilityRole to "text" on the pill for grade="hasan"', () => {
    const { getByLabelText } = renderBadge('hasan');
    expect(getByLabelText('Hasan').props.accessibilityRole).toBe('text');
  });

  it('sets accessibilityLabel to the localized grade label for grade="sahih"', () => {
    const { getByLabelText } = renderBadge('sahih');
    expect(getByLabelText('Sahih')).toBeTruthy();
  });

  it('sets accessibilityLabel to the localized grade label for grade="hasan"', () => {
    const { getByLabelText } = renderBadge('hasan');
    expect(getByLabelText('Hasan')).toBeTruthy();
  });
});
