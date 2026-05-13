/**
 * Component tests for app/dhikr/[id].tsx — Dhikr Detail screen
 *
 * Covers:
 *   - Renders Arabic text via ArabicText component
 *   - Renders translation text
 *   - Shows "(English)" notice when translationFallback === true
 *   - Does NOT show "(English)" notice when translationFallback === false
 *   - Renders source reference string
 *   - Renders SourceBadge for the authenticity grade
 *   - Renders transliteration when showTransliteration === true
 *   - Does NOT render transliteration when showTransliteration === false
 *   - Renders repetition count when available
 *   - Does NOT render repetition count when null
 *   - Favorite toggle shows filled star when favorited
 *   - Favorite toggle shows empty star when not favorited
 *   - Favorite toggle calls addFavorite when not favorited
 *   - Favorite toggle calls removeFavorite when favorited
 *   - "View Source" button navigates to source/[dhikrId]
 *   - useDhikrView is called on mount
 *   - Shows loading indicator while loading
 *   - Shows error state on failure
 *
 * Requirements: 3.1–3.5, 6.1, 6.2, 7.4, 14.1
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import DhikrDetailScreen from '../../app/dhikr/[id]';
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

// ── Mocks ─────────────────────────────────────────────────────────────────────

// expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ id: '42' }),
}));

// useDhikr hook
const mockUseDhikr = jest.fn();
jest.mock('../../src/hooks/useDhikr', () => ({
  useDhikr: (dhikrId: number) => mockUseDhikr(dhikrId),
}));

// useDhikrView hook — track calls to verify it fires on mount
const mockUseDhikrView = jest.fn();
jest.mock('../../src/hooks/useDhikrView', () => ({
  useDhikrView: () => mockUseDhikrView(),
}));

// settingsStore
const mockUseSettingsStore = jest.fn();
jest.mock('../../src/store/settingsStore', () => ({
  useSettingsStore: (selector: (s: { showTransliteration: boolean }) => unknown) =>
    mockUseSettingsStore(selector),
}));

// favoritesStore
const mockAddFavorite = jest.fn();
const mockRemoveFavorite = jest.fn();
const mockIsFavorite = jest.fn();
const mockUseFavoritesStore = jest.fn();
jest.mock('../../src/store/favoritesStore', () => ({
  useFavoritesStore: (selector: (s: {
    addFavorite: (id: number) => void;
    removeFavorite: (id: number) => void;
    isFavorite: (id: number) => boolean;
  }) => unknown) => mockUseFavoritesStore(selector),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockDhikr: Dhikr = {
  id: 42,
  arabicText: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
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

// ── Helpers ───────────────────────────────────────────────────────────────────

interface SetupOptions {
  dhikr?: Dhikr | null;
  isLoading?: boolean;
  error?: Error | null;
  showTransliteration?: boolean;
  isFavorited?: boolean;
}

function setupDefaults({
  dhikr = mockDhikr,
  isLoading = false,
  error = null,
  showTransliteration = true,
  isFavorited = false,
}: SetupOptions = {}) {
  mockUseDhikr.mockReturnValue({ dhikr, isLoading, error });

  mockUseSettingsStore.mockImplementation(
    (selector: (s: { showTransliteration: boolean }) => unknown) =>
      selector({ showTransliteration }),
  );

  mockIsFavorite.mockReturnValue(isFavorited);

  mockUseFavoritesStore.mockImplementation(
    (selector: (s: {
      addFavorite: (id: number) => void;
      removeFavorite: (id: number) => void;
      isFavorite: (id: number) => boolean;
    }) => unknown) =>
      selector({
        addFavorite: mockAddFavorite,
        removeFavorite: mockRemoveFavorite,
        isFavorite: mockIsFavorite,
      }),
  );
}

function renderScreen() {
  return render(
    <I18nextProvider i18n={testI18n}>
      <DhikrDetailScreen />
    </I18nextProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  setupDefaults();
});

describe('DhikrDetailScreen', () => {
  // ── useDhikrView called on mount ───────────────────────────────────────────

  describe('useDhikrView hook', () => {
    it('calls useDhikrView on mount', () => {
      renderScreen();
      expect(mockUseDhikrView).toHaveBeenCalledTimes(1);
    });

    it('calls useDhikrView even when dhikr is loading', () => {
      setupDefaults({ isLoading: true, dhikr: null });
      renderScreen();
      expect(mockUseDhikrView).toHaveBeenCalledTimes(1);
    });
  });

  // ── Arabic text ────────────────────────────────────────────────────────────

  describe('Arabic text', () => {
    it('renders the Arabic text', () => {
      const { getByText } = renderScreen();
      expect(getByText('سُبْحَانَ اللَّهِ وَبِحَمْدِهِ')).toBeTruthy();
    });

    it('renders the Arabic text container', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('dhikr-detail-arabic')).toBeTruthy();
    });
  });

  // ── Translation ────────────────────────────────────────────────────────────

  describe('Translation', () => {
    it('renders the translation text', () => {
      const { getByText } = renderScreen();
      expect(getByText('Glory be to Allah and His is the praise')).toBeTruthy();
    });

    it('renders the translation container', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('dhikr-detail-translation')).toBeTruthy();
    });

    it('does NOT show "(English)" notice when translationFallback is false', () => {
      setupDefaults({ dhikr: { ...mockDhikr, translationFallback: false } });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('dhikr-detail-translation-fallback')).toBeNull();
    });

    it('shows "(English)" notice when translationFallback is true', () => {
      setupDefaults({ dhikr: { ...mockDhikr, translationFallback: true } });
      const { getByTestId, getByText } = renderScreen();
      expect(getByTestId('dhikr-detail-translation-fallback')).toBeTruthy();
      expect(getByText('(English)')).toBeTruthy();
    });
  });

  // ── Transliteration ────────────────────────────────────────────────────────

  describe('Transliteration', () => {
    it('renders transliteration when showTransliteration is true', () => {
      setupDefaults({ showTransliteration: true });
      const { getByTestId, getByText } = renderScreen();
      expect(getByTestId('dhikr-detail-transliteration')).toBeTruthy();
      expect(getByText('Subhana Allahi wa bihamdihi')).toBeTruthy();
    });

    it('does NOT render transliteration when showTransliteration is false', () => {
      setupDefaults({ showTransliteration: false });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('dhikr-detail-transliteration')).toBeNull();
    });

    it('does NOT render transliteration when transliteration is null', () => {
      setupDefaults({
        showTransliteration: true,
        dhikr: { ...mockDhikr, transliteration: null },
      });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('dhikr-detail-transliteration')).toBeNull();
    });
  });

  // ── Source reference and badge ─────────────────────────────────────────────

  describe('Source reference and badge', () => {
    it('renders the source container', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('dhikr-detail-source')).toBeTruthy();
    });

    it('renders the source reference text', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('dhikr-detail-source-ref')).toBeTruthy();
    });

    it('renders the collection name in the source reference', () => {
      const { getByText } = renderScreen();
      expect(getByText(/Sahih al-Bukhari/)).toBeTruthy();
    });

    it('renders the SourceBadge container', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('dhikr-detail-source-badge')).toBeTruthy();
    });

    it('renders the Sahih badge label', () => {
      const { getByText } = renderScreen();
      expect(getByText('Sahih')).toBeTruthy();
    });

    it('renders the Hasan badge label for hasan grade', () => {
      setupDefaults({ dhikr: { ...mockDhikr, authenticityGrade: 'hasan' } });
      const { getByText } = renderScreen();
      expect(getByText('Hasan')).toBeTruthy();
    });

    it('formats Qur\'an source reference correctly', () => {
      setupDefaults({
        dhikr: {
          ...mockDhikr,
          sourceType: 'quran',
          surahName: 'Al-Baqarah',
          ayahNumber: 255,
          collectionName: null,
          bookNumber: null,
          hadithNumber: null,
        },
      });
      const { getByText } = renderScreen();
      expect(getByText(/Al-Baqarah/)).toBeTruthy();
      expect(getByText(/Ayah 255/)).toBeTruthy();
    });
  });

  // ── Repetition count ───────────────────────────────────────────────────────

  describe('Repetition count', () => {
    it('renders the repetition count when available', () => {
      const { getByTestId, getByText } = renderScreen();
      expect(getByTestId('dhikr-detail-repetition')).toBeTruthy();
      expect(getByText('33×')).toBeTruthy();
    });

    it('does NOT render repetition count when null', () => {
      setupDefaults({ dhikr: { ...mockDhikr, repetitionCount: null } });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('dhikr-detail-repetition')).toBeNull();
    });
  });

  // ── Favorite toggle ────────────────────────────────────────────────────────

  describe('Favorite toggle', () => {
    it('renders the favorite toggle button', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('dhikr-detail-favorite')).toBeTruthy();
    });

    it('shows empty star (☆) when not favorited', () => {
      setupDefaults({ isFavorited: false });
      const { getByText } = renderScreen();
      expect(getByText('☆')).toBeTruthy();
    });

    it('shows filled star (★) when favorited', () => {
      setupDefaults({ isFavorited: true });
      const { getByText } = renderScreen();
      expect(getByText('★')).toBeTruthy();
    });

    it('calls addFavorite when toggling a non-favorite dhikr', () => {
      setupDefaults({ isFavorited: false });
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('dhikr-detail-favorite'));
      expect(mockAddFavorite).toHaveBeenCalledWith(42);
      expect(mockRemoveFavorite).not.toHaveBeenCalled();
    });

    it('calls removeFavorite when toggling an already-favorite dhikr', () => {
      setupDefaults({ isFavorited: true });
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('dhikr-detail-favorite'));
      expect(mockRemoveFavorite).toHaveBeenCalledWith(42);
      expect(mockAddFavorite).not.toHaveBeenCalled();
    });

    it('has correct accessibilityLabel when not favorited', () => {
      setupDefaults({ isFavorited: false });
      const { getByTestId } = renderScreen();
      expect(getByTestId('dhikr-detail-favorite').props.accessibilityLabel).toBe(
        'Add to favorites',
      );
    });

    it('has correct accessibilityLabel when favorited', () => {
      setupDefaults({ isFavorited: true });
      const { getByTestId } = renderScreen();
      expect(getByTestId('dhikr-detail-favorite').props.accessibilityLabel).toBe(
        'Remove from favorites',
      );
    });
  });

  // ── View Source button ─────────────────────────────────────────────────────

  describe('View Source button', () => {
    it('renders the View Source button', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('dhikr-detail-view-source')).toBeTruthy();
    });

    it('navigates to source/[dhikrId] when View Source is pressed', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('dhikr-detail-view-source'));
      expect(mockPush).toHaveBeenCalledWith('/source/42');
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('Loading state', () => {
    it('shows loading indicator while loading', () => {
      setupDefaults({ isLoading: true, dhikr: null });
      const { getByTestId } = renderScreen();
      expect(getByTestId('dhikr-detail-loading')).toBeTruthy();
    });

    it('does not render the main screen while loading', () => {
      setupDefaults({ isLoading: true, dhikr: null });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('dhikr-detail-screen')).toBeNull();
    });
  });

  // ── Error state ────────────────────────────────────────────────────────────

  describe('Error state', () => {
    it('shows error state when dhikr fails to load', () => {
      setupDefaults({ error: new Error('DB error'), dhikr: null });
      const { getByTestId } = renderScreen();
      expect(getByTestId('dhikr-detail-error')).toBeTruthy();
    });

    it('shows error state when dhikr is null (not found)', () => {
      setupDefaults({ dhikr: null });
      const { getByTestId } = renderScreen();
      expect(getByTestId('dhikr-detail-error')).toBeTruthy();
    });

    it('does not render the main screen on error', () => {
      setupDefaults({ error: new Error('DB error'), dhikr: null });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('dhikr-detail-screen')).toBeNull();
    });
  });
});
