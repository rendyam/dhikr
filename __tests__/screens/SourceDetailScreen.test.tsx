/**
 * Component tests for app/source/[dhikrId].tsx — Source Detail screen
 *
 * Covers:
 *   - Renders the source reference (collection/book/hadith or Surah:Ayah)
 *   - Renders the SourceBadge for the authenticity grade
 *   - Renders the full Hadith text when available
 *   - Does NOT render the full text section when fullHadithText is null
 *   - Renders scholar name(s) who graded the dhikr
 *   - Renders grading rationale when available
 *   - Renders "no rationale" fallback when gradingRationale is null
 *   - Close button calls router.back()
 *   - Shows loading indicator while loading
 *   - Shows error state on failure
 *   - Shows error state when dhikr is null (not found)
 *   - Formats Qur'an source reference correctly (Surah + Ayah)
 *   - Formats Hadith source reference correctly (collection + book + hadith)
 *
 * Requirements: 6.3
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import SourceDetailScreen from '../../app/source/[dhikrId]';
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
        source: {
          title: 'Source',
          fullText: 'Full Text',
          scholars: 'Graded by',
          gradingRationale: 'Grading Rationale',
          noRationale: 'No grading rationale available.',
        },
        errors: {
          contentLoadFailed: 'Failed to load content. Please try again.',
        },
        common: {
          close: 'Close',
        },
      },
    },
  },
  interpolation: { escapeValue: false },
});

// ── Mocks ─────────────────────────────────────────────────────────────────────

// expo-router
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ dhikrId: '7' }),
}));

// useDhikr hook
const mockUseDhikr = jest.fn();
jest.mock('../../src/hooks/useDhikr', () => ({
  useDhikr: (dhikrId: number) => mockUseDhikr(dhikrId),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** Full dhikr with all optional source fields populated. */
const mockDhikrHadith: Dhikr = {
  id: 7,
  arabicText: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
  transliteration: 'Subhana Allahi wa bihamdihi',
  translation: 'Glory be to Allah and His is the praise',
  translationFallback: false,
  repetitionCount: 100,
  sourceType: 'hadith',
  surahName: null,
  ayahNumber: null,
  collectionName: 'Sahih al-Bukhari',
  bookNumber: '75',
  hadithNumber: '412',
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Bukhari', 'Muslim'],
  gradingRationale: 'Narrated through multiple strong chains.',
  fullHadithText:
    'The Prophet ﷺ said: "Whoever says SubhanAllah wa bihamdihi one hundred times a day, will be forgiven all his sins even if they were as much as the foam of the sea."',
};

/** Dhikr with null gradingRationale and null fullHadithText. */
const mockDhikrMinimal: Dhikr = {
  ...mockDhikrHadith,
  gradingRationale: null,
  fullHadithText: null,
  scholarNames: ['Al-Albani'],
};

/** Qur'an-sourced dhikr. */
const mockDhikrQuran: Dhikr = {
  ...mockDhikrHadith,
  sourceType: 'quran',
  surahName: 'Al-Baqarah',
  ayahNumber: 255,
  collectionName: null,
  bookNumber: null,
  hadithNumber: null,
  fullHadithText: 'Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence.',
  scholarNames: ['Ibn Kathir'],
  gradingRationale: null,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

interface SetupOptions {
  dhikr?: Dhikr | null;
  isLoading?: boolean;
  error?: Error | null;
}

function setupDefaults({
  dhikr = mockDhikrHadith,
  isLoading = false,
  error = null,
}: SetupOptions = {}) {
  mockUseDhikr.mockReturnValue({ dhikr, isLoading, error });
}

function renderScreen() {
  return render(
    <I18nextProvider i18n={testI18n}>
      <SourceDetailScreen />
    </I18nextProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  setupDefaults();
});

describe('SourceDetailScreen', () => {
  // ── Main screen structure ──────────────────────────────────────────────────

  describe('Screen structure', () => {
    it('renders the main screen container', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-screen')).toBeTruthy();
    });

    it('renders the scroll view', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-scroll')).toBeTruthy();
    });

    it('renders the close button', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-close')).toBeTruthy();
    });

    it('close button has correct accessibilityRole', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-close').props.accessibilityRole).toBe('button');
    });

    it('close button has correct accessibilityLabel', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-close').props.accessibilityLabel).toBe('Close');
    });
  });

  // ── Close button ───────────────────────────────────────────────────────────

  describe('Close button', () => {
    it('calls router.back() when close button is pressed', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('source-detail-close'));
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  // ── Source reference ───────────────────────────────────────────────────────

  describe('Source reference', () => {
    it('renders the source reference section', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-reference')).toBeTruthy();
    });

    it('renders the source reference text', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-reference-text')).toBeTruthy();
    });

    it('formats Hadith source reference with collection, book, and hadith number', () => {
      const { getByText } = renderScreen();
      expect(getByText(/Sahih al-Bukhari/)).toBeTruthy();
      expect(getByText(/Book 75/)).toBeTruthy();
      expect(getByText(/Hadith 412/)).toBeTruthy();
    });

    it('formats Qur\'an source reference with surah name and ayah number', () => {
      setupDefaults({ dhikr: mockDhikrQuran });
      const { getByText } = renderScreen();
      expect(getByText(/Al-Baqarah/)).toBeTruthy();
      expect(getByText(/Ayah 255/)).toBeTruthy();
    });

    it('renders the SourceBadge section', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-badge')).toBeTruthy();
    });

    it('renders the Sahih badge label', () => {
      const { getByText } = renderScreen();
      expect(getByText('Sahih')).toBeTruthy();
    });

    it('renders the Hasan badge label for hasan grade', () => {
      setupDefaults({ dhikr: { ...mockDhikrHadith, authenticityGrade: 'hasan' } });
      const { getByText } = renderScreen();
      expect(getByText('Hasan')).toBeTruthy();
    });
  });

  // ── Full Hadith / Qur'anic text ────────────────────────────────────────────

  describe('Full text', () => {
    it('renders the full text section when fullHadithText is available', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-full-text')).toBeTruthy();
    });

    it('renders the full Hadith text content', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-full-text-content')).toBeTruthy();
    });

    it('displays the full Hadith text string', () => {
      const { getByText } = renderScreen();
      expect(getByText(/SubhanAllah wa bihamdihi/)).toBeTruthy();
    });

    it('does NOT render the full text section when fullHadithText is null', () => {
      setupDefaults({ dhikr: mockDhikrMinimal });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('source-detail-full-text')).toBeNull();
    });
  });

  // ── Scholar names ──────────────────────────────────────────────────────────

  describe('Scholar names', () => {
    it('renders the scholars section', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-scholars')).toBeTruthy();
    });

    it('renders the scholars text element', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-scholars-text')).toBeTruthy();
    });

    it('displays multiple scholar names joined by comma', () => {
      const { getByText } = renderScreen();
      expect(getByText('Al-Bukhari, Muslim')).toBeTruthy();
    });

    it('displays a single scholar name', () => {
      setupDefaults({ dhikr: mockDhikrMinimal });
      const { getByText } = renderScreen();
      expect(getByText('Al-Albani')).toBeTruthy();
    });
  });

  // ── Grading rationale ──────────────────────────────────────────────────────

  describe('Grading rationale', () => {
    it('renders the rationale section', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-rationale')).toBeTruthy();
    });

    it('renders the rationale text when gradingRationale is available', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-rationale-text')).toBeTruthy();
    });

    it('displays the grading rationale string', () => {
      const { getByText } = renderScreen();
      expect(getByText('Narrated through multiple strong chains.')).toBeTruthy();
    });

    it('renders the absent-rationale fallback when gradingRationale is null', () => {
      setupDefaults({ dhikr: mockDhikrMinimal });
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-rationale-absent')).toBeTruthy();
    });

    it('displays the "no rationale" message when gradingRationale is null', () => {
      setupDefaults({ dhikr: mockDhikrMinimal });
      const { getByText } = renderScreen();
      expect(getByText('No grading rationale available.')).toBeTruthy();
    });

    it('does NOT render the rationale text element when gradingRationale is null', () => {
      setupDefaults({ dhikr: mockDhikrMinimal });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('source-detail-rationale-text')).toBeNull();
    });

    it('does NOT render the absent-rationale element when rationale is present', () => {
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('source-detail-rationale-absent')).toBeNull();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('Loading state', () => {
    it('shows loading indicator while loading', () => {
      setupDefaults({ isLoading: true, dhikr: null });
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-loading')).toBeTruthy();
    });

    it('does not render the main screen while loading', () => {
      setupDefaults({ isLoading: true, dhikr: null });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('source-detail-screen')).toBeNull();
    });
  });

  // ── Error state ────────────────────────────────────────────────────────────

  describe('Error state', () => {
    it('shows error state when dhikr fails to load', () => {
      setupDefaults({ error: new Error('DB error'), dhikr: null });
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-error')).toBeTruthy();
    });

    it('shows error state when dhikr is null (not found)', () => {
      setupDefaults({ dhikr: null });
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-error')).toBeTruthy();
    });

    it('does not render the main screen on error', () => {
      setupDefaults({ error: new Error('DB error'), dhikr: null });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('source-detail-screen')).toBeNull();
    });

    it('renders a close button in the error state', () => {
      setupDefaults({ dhikr: null });
      const { getByTestId } = renderScreen();
      expect(getByTestId('source-detail-close-error')).toBeTruthy();
    });

    it('calls router.back() when error-state close button is pressed', () => {
      setupDefaults({ dhikr: null });
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('source-detail-close-error'));
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});
