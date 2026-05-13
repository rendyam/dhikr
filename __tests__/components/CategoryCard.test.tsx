/**
 * Unit tests for src/components/CategoryCard.tsx
 *
 * Covers:
 *   - Renders the Arabic category name (nameAr)
 *   - Renders the translated category name (name)
 *   - Calls onPress when the card is pressed
 *   - Does not call onPress when not pressed
 *   - Correct accessibilityRole on the card
 *
 * Requirements: 2.2, 2.4
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategoryCard } from '../../src/components/CategoryCard';
import type { Category } from '../../src/types/content';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockCategory: Category = {
  id: 1,
  slug: 'morning',
  nameAr: 'أذكار الصباح',
  name: 'Morning Adhkar',
  sortOrder: 1,
};

const mockCategoryEvening: Category = {
  id: 2,
  slug: 'evening',
  nameAr: 'أذكار المساء',
  name: 'Evening Adhkar',
  sortOrder: 2,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

interface RenderOptions {
  category?: Category;
  onPress?: jest.Mock;
}

function renderCard(options: RenderOptions = {}) {
  const { category = mockCategory, onPress = jest.fn() } = options;

  const utils = render(
    <CategoryCard category={category} onPress={onPress} />,
  );

  return { ...utils, onPress };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CategoryCard', () => {
  // ── Arabic name rendering ──────────────────────────────────────────────────

  it('renders the Arabic category name', () => {
    const { getByText } = renderCard();
    expect(getByText('أذكار الصباح')).toBeTruthy();
  });

  it('renders the Arabic name for a different category', () => {
    const { getByText } = renderCard({ category: mockCategoryEvening });
    expect(getByText('أذكار المساء')).toBeTruthy();
  });

  // ── Translated name rendering ──────────────────────────────────────────────

  it('renders the translated category name', () => {
    const { getByText } = renderCard();
    expect(getByText('Morning Adhkar')).toBeTruthy();
  });

  it('renders the translated name for a different category', () => {
    const { getByText } = renderCard({ category: mockCategoryEvening });
    expect(getByText('Evening Adhkar')).toBeTruthy();
  });

  it('renders both Arabic and translated names together', () => {
    const { getByText } = renderCard();
    expect(getByText('أذكار الصباح')).toBeTruthy();
    expect(getByText('Morning Adhkar')).toBeTruthy();
  });

  // ── Press callback ─────────────────────────────────────────────────────────

  it('calls onPress when the card is pressed', () => {
    const { getByTestId, onPress } = renderCard();
    fireEvent.press(getByTestId('category-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onPress exactly once per tap', () => {
    const { getByTestId, onPress } = renderCard();
    fireEvent.press(getByTestId('category-card'));
    fireEvent.press(getByTestId('category-card'));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('does not call onPress before the card is pressed', () => {
    const { onPress } = renderCard();
    expect(onPress).not.toHaveBeenCalled();
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it('sets accessibilityRole="button" on the card', () => {
    const { getByTestId } = renderCard();
    expect(getByTestId('category-card').props.accessibilityRole).toBe('button');
  });

  it('sets an accessibilityLabel containing both names', () => {
    const { getByTestId } = renderCard();
    const label = getByTestId('category-card').props.accessibilityLabel;
    expect(label).toContain('أذكار الصباح');
    expect(label).toContain('Morning Adhkar');
  });

  // ── Structural rendering ───────────────────────────────────────────────────

  it('renders the card container', () => {
    const { getByTestId } = renderCard();
    expect(getByTestId('category-card')).toBeTruthy();
  });

  it('renders the translated name element', () => {
    const { getByTestId } = renderCard();
    expect(getByTestId('category-card-name')).toBeTruthy();
  });
});
