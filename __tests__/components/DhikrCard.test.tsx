/**
 * Unit tests for src/components/DhikrCard.tsx
 *
 * Covers:
 *   - Renders the first line of Arabic text
 *   - Renders the SourceBadge for the authenticity grade
 *   - Renders the favorite toggle icon (★ when favorite, ☆ when not)
 *   - Calls onPress when the card body is pressed
 *   - Calls onFavorite when the favorite toggle is pressed
 *   - onFavorite does NOT trigger onPress
 *   - Correct accessibilityRole on card and favorite toggle
 *   - Correct accessibilityLabel on favorite toggle reflects favorite state
 *
 * Requirements: 2.3, 3.1, 10.1
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import { DhikrCard } from '../../src/components/DhikrCard';
import type { Dhikr } from '../../src/types/content';

// ── i18n test instance ────────────────────────────────────────────────────────

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
  },
  interpolation: { escapeValue: false },
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** A minimal Dhikr object for testing. */
const mockDhikr: Dhikr = {
  id: 1,
  arabicText: 'سُبْحَانَ اللَّهِ\nوَبِحَمْدِهِ',
  transliteration: 'Subhana Allahi wa bihamdihi',
  translation: 'Glory be to Allah and His is the praise',
  translationFallback: false,
  repetitionCount: 33,
  sourceType: 'hadith',
  surahName: null,
  ayahNumber: null,
  collectionName: 'Sahih al-Bukhari',
  bookNumber: '75',
  hadithNumber: '412',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Bukhari'],
  gradingRationale: null,
  fullHadithText: null,
};

const mockDhikrHasan: Dhikr = {
  ...mockDhikr,
  id: 2,
  authenticityGrade: 'hasan',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

interface RenderOptions {
  dhikr?: Dhikr;
  isFavorite?: boolean;
  onPress?: jest.Mock;
  onFavorite?: jest.Mock;
}

function renderCard(options: RenderOptions = {}) {
  const {
    dhikr = mockDhikr,
    isFavorite = false,
    onPress = jest.fn(),
    onFavorite = jest.fn(),
  } = options;

  const utils = render(
    <I18nextProvider i18n={testI18n}>
      <DhikrCard
        dhikr={dhikr}
        onPress={onPress}
        onFavorite={onFavorite}
        isFavorite={isFavorite}
      />
    </I18nextProvider>,
  );

  return { ...utils, onPress, onFavorite };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DhikrCard', () => {
  // ── Arabic text rendering ──────────────────────────────────────────────────

  it('renders the first line of the Arabic text', () => {
    const { getByText } = renderCard();
    // arabicText has two lines; only the first should appear
    expect(getByText('سُبْحَانَ اللَّهِ')).toBeTruthy();
  });

  it('does not render subsequent lines of the Arabic text', () => {
    const { queryByText } = renderCard();
    expect(queryByText('وَبِحَمْدِهِ')).toBeNull();
  });

  it('renders single-line Arabic text without truncation', () => {
    const singleLine = { ...mockDhikr, arabicText: 'اللَّهُ أَكْبَرُ' };
    const { getByText } = renderCard({ dhikr: singleLine });
    expect(getByText('اللَّهُ أَكْبَرُ')).toBeTruthy();
  });

  // ── Source badge ───────────────────────────────────────────────────────────

  it('renders the Sahih source badge for a sahih dhikr', () => {
    const { getByText } = renderCard({ dhikr: mockDhikr });
    expect(getByText('Sahih')).toBeTruthy();
  });

  it('renders the Hasan source badge for a hasan dhikr', () => {
    const { getByText } = renderCard({ dhikr: mockDhikrHasan });
    expect(getByText('Hasan')).toBeTruthy();
  });

  // ── Favorite toggle icon ───────────────────────────────────────────────────

  it('renders the filled star (★) when isFavorite is true', () => {
    const { getByText } = renderCard({ isFavorite: true });
    expect(getByText('★')).toBeTruthy();
  });

  it('renders the empty star (☆) when isFavorite is false', () => {
    const { getByText } = renderCard({ isFavorite: false });
    expect(getByText('☆')).toBeTruthy();
  });

  it('does not render the filled star when isFavorite is false', () => {
    const { queryByText } = renderCard({ isFavorite: false });
    expect(queryByText('★')).toBeNull();
  });

  it('does not render the empty star when isFavorite is true', () => {
    const { queryByText } = renderCard({ isFavorite: true });
    expect(queryByText('☆')).toBeNull();
  });

  // ── Card press callback ────────────────────────────────────────────────────

  it('calls onPress when the card is pressed', () => {
    const { getByTestId, onPress } = renderCard();
    fireEvent.press(getByTestId('dhikr-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onPress exactly once per tap', () => {
    const { getByTestId, onPress } = renderCard();
    fireEvent.press(getByTestId('dhikr-card'));
    fireEvent.press(getByTestId('dhikr-card'));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  // ── Favorite toggle callback ───────────────────────────────────────────────

  it('calls onFavorite when the favorite toggle is pressed', () => {
    const { getByTestId, onFavorite } = renderCard();
    fireEvent.press(getByTestId('dhikr-card-favorite'));
    expect(onFavorite).toHaveBeenCalledTimes(1);
  });

  it('calls onFavorite when already a favorite and toggle is pressed', () => {
    const { getByTestId, onFavorite } = renderCard({ isFavorite: true });
    fireEvent.press(getByTestId('dhikr-card-favorite'));
    expect(onFavorite).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when the favorite toggle is pressed', () => {
    const { getByTestId, onPress, onFavorite } = renderCard();
    fireEvent.press(getByTestId('dhikr-card-favorite'));
    expect(onFavorite).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it('sets accessibilityRole="button" on the card', () => {
    const { getByTestId } = renderCard();
    expect(getByTestId('dhikr-card').props.accessibilityRole).toBe('button');
  });

  it('sets accessibilityRole="button" on the favorite toggle', () => {
    const { getByTestId } = renderCard();
    expect(getByTestId('dhikr-card-favorite').props.accessibilityRole).toBe('button');
  });

  it('sets accessibilityLabel to "Add to favorites" when not a favorite', () => {
    const { getByTestId } = renderCard({ isFavorite: false });
    expect(getByTestId('dhikr-card-favorite').props.accessibilityLabel).toBe(
      'Add to favorites',
    );
  });

  it('sets accessibilityLabel to "Remove from favorites" when already a favorite', () => {
    const { getByTestId } = renderCard({ isFavorite: true });
    expect(getByTestId('dhikr-card-favorite').props.accessibilityLabel).toBe(
      'Remove from favorites',
    );
  });

  // ── Structural rendering ───────────────────────────────────────────────────

  it('renders the card container', () => {
    const { getByTestId } = renderCard();
    expect(getByTestId('dhikr-card')).toBeTruthy();
  });

  it('renders the favorite toggle button', () => {
    const { getByTestId } = renderCard();
    expect(getByTestId('dhikr-card-favorite')).toBeTruthy();
  });

  it('renders the Arabic text container', () => {
    const { getByTestId } = renderCard();
    expect(getByTestId('dhikr-card-arabic')).toBeTruthy();
  });

  it('renders the favorite icon container', () => {
    const { getByTestId } = renderCard();
    expect(getByTestId('dhikr-card-favorite-icon')).toBeTruthy();
  });
});
