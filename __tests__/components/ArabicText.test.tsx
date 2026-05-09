/**
 * Unit tests for src/components/ArabicText.tsx
 *
 * Covers:
 *   - Renders the supplied Arabic text
 *   - Applies the correct font size for each TextSize value
 *   - Applies the correct line height for each TextSize value
 *   - Always uses the Amiri font family
 *   - Always sets writingDirection: 'rtl' and textAlign: 'right'
 *   - Merges additional style prop without overriding base styles
 *   - Exposes correct accessibility attributes
 *
 * Requirements: 3.1, 8.2, 12.3
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ArabicText } from '../../src/components/ArabicText';
import { arabicFontSizes, arabicLineHeights, fontFamilies } from '../../src/theme';
import type { TextSize } from '../../src/types/content';

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Tests ────────────────────────────────────────────────────────────────────

const SAMPLE_TEXT = 'سُبْحَانَ اللَّهِ';

describe('ArabicText', () => {
  // ── Text rendering ─────────────────────────────────────────────────────────

  it('renders the supplied Arabic text', () => {
    const { getByText } = render(<ArabicText text={SAMPLE_TEXT} size="medium" />);
    expect(getByText(SAMPLE_TEXT)).toBeTruthy();
  });

  // ── Font size per TextSize ─────────────────────────────────────────────────

  const sizes: TextSize[] = ['small', 'medium', 'large'];

  sizes.forEach((size) => {
    it(`applies fontSize ${arabicFontSizes[size]} for size="${size}"`, () => {
      const { getByText } = render(<ArabicText text={SAMPLE_TEXT} size={size} />);
      const style = flatStyle(getByText(SAMPLE_TEXT).props.style);
      expect(style.fontSize).toBe(arabicFontSizes[size]);
    });

    it(`applies lineHeight ${arabicLineHeights[size]} for size="${size}"`, () => {
      const { getByText } = render(<ArabicText text={SAMPLE_TEXT} size={size} />);
      const style = flatStyle(getByText(SAMPLE_TEXT).props.style);
      expect(style.lineHeight).toBe(arabicLineHeights[size]);
    });
  });

  // ── Font family ────────────────────────────────────────────────────────────

  it('always uses the Amiri Arabic font family', () => {
    const { getByText } = render(<ArabicText text={SAMPLE_TEXT} size="medium" />);
    const style = flatStyle(getByText(SAMPLE_TEXT).props.style);
    expect(style.fontFamily).toBe(fontFamilies.arabicRegular);
  });

  // ── RTL layout ────────────────────────────────────────────────────────────

  it('sets writingDirection to rtl', () => {
    const { getByText } = render(<ArabicText text={SAMPLE_TEXT} size="medium" />);
    const style = flatStyle(getByText(SAMPLE_TEXT).props.style);
    expect(style.writingDirection).toBe('rtl');
  });

  it('sets textAlign to right', () => {
    const { getByText } = render(<ArabicText text={SAMPLE_TEXT} size="medium" />);
    const style = flatStyle(getByText(SAMPLE_TEXT).props.style);
    expect(style.textAlign).toBe('right');
  });

  // ── Style prop merging ─────────────────────────────────────────────────────

  it('merges the style prop on top of base styles', () => {
    const extraStyle = { color: '#123456', marginTop: 8 };
    const { getByText } = render(
      <ArabicText text={SAMPLE_TEXT} size="medium" style={extraStyle} />,
    );
    const style = flatStyle(getByText(SAMPLE_TEXT).props.style);
    expect(style.color).toBe('#123456');
    expect(style.marginTop).toBe(8);
    // Base styles must still be present
    expect(style.fontFamily).toBe(fontFamilies.arabicRegular);
    expect(style.textAlign).toBe('right');
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it('sets accessibilityLanguage to "ar"', () => {
    const { getByText } = render(<ArabicText text={SAMPLE_TEXT} size="medium" />);
    expect(getByText(SAMPLE_TEXT).props.accessibilityLanguage).toBe('ar');
  });

  it('sets accessibilityRole to "text"', () => {
    const { getByText } = render(<ArabicText text={SAMPLE_TEXT} size="medium" />);
    expect(getByText(SAMPLE_TEXT).props.accessibilityRole).toBe('text');
  });
});
