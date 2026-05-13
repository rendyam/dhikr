/**
 * Component tests for app/category/[id].tsx — Category Detail screen
 *
 * Covers:
 *   - Renders category name (Arabic + translated) in the header
 *   - Renders an ordered list of DhikrCard components
 *   - Renders the "Start Session" button
 *   - Navigates to session/[categoryId] when "Start Session" is pressed
 *   - Navigates to dhikr/[id] when a DhikrCard is pressed
 *   - Favorite toggle calls addFavorite when dhikr is not a favorite
 *   - Favorite toggle calls removeFavorite when dhikr is already a favorite
 *   - Shows loading indicator while dhikr list is loading
 *   - Shows error message when dhikr list fails to load
 *
 * Requirements: 2.3, 2.4, 4.1
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import CategoryScreen from '../../app/category/[id]';
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
  useLocalSearchParams: () => ({ id: '1' }),
}));

// useDhikrByCategory hook
const mockUseDhikrByCategory = jest.fn();
jest.mock('../../src/hooks/useDhikrByCategory', () => ({
  useDhikrByCategory: (categoryId: number) => mockUseDhikrByCategory(categoryId),
}));

// settingsStore
jest.mock('../../src/store/settingsStore', () => ({
  useSettingsStore: (selector: (s: { language: string }) => unknown) =>
    selector({ language: 'en' }),
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

// DB client — getCategoryById is called directly in the screen
jest.mock('../../src/db/client', () => ({
  openContentDb: jest.fn().mockResolvedValue({}),
  openUserDb: jest.fn(),
}));

jest.mock('../../src/db/queries', () => ({
  getCategoryById: jest.fn().mockResolvedValue({
    id: 1,
    slug: 'morning',
    nameAr: 'أذكار الصباح',
    name: 'Morning Adhkar',
    sortOrder: 1,
  }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeDhikr = (id: number): Dhikr => ({
  id,
  arabicText: `سُبْحَانَ اللَّهِ ${id}`,
  transliteration: `Subhana Allahi ${id}`,
  translation: `Glory be to Allah ${id}`,
  translationFallback: false,
  repetitionCount: 33,
  sourceType: 'hadith',
  surahName: null,
  ayahNumber: null,
  collectionName: 'Sahih al-Bukhari',
  bookNumber: '75',
  hadithNumber: String(id),
  authenticityGrade: 'sahih',
  scholarNames: ['Al-Bukhari'],
  gradingRationale: null,
  fullHadithText: null,
});

const mockDhikrList: Dhikr[] = [makeDhikr(10), makeDhikr(20), makeDhikr(30)];

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupDefaults({
  dhikrList = mockDhikrList,
  isLoading = false,
  error = null,
  favoriteIds = new Set<number>(),
}: {
  dhikrList?: Dhikr[];
  isLoading?: boolean;
  error?: Error | null;
  favoriteIds?: Set<number>;
} = {}) {
  mockUseDhikrByCategory.mockReturnValue({ dhikrList, isLoading, error });

  mockIsFavorite.mockImplementation((id: number) => favoriteIds.has(id));

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
      <CategoryScreen />
    </I18nextProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  setupDefaults();
});

describe('CategoryScreen', () => {
  // ── Category header ────────────────────────────────────────────────────────

  describe('Category header', () => {
    it('renders the category header container', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('category-header')).toBeTruthy();
    });

    it('renders the translated category name', async () => {
      const { findByText } = renderScreen();
      const el = await findByText('Morning Adhkar');
      expect(el).toBeTruthy();
    });

    it('renders the Arabic category name', async () => {
      const { findByText } = renderScreen();
      const el = await findByText('أذكار الصباح');
      expect(el).toBeTruthy();
    });
  });

  // ── Dhikr list ─────────────────────────────────────────────────────────────

  describe('Dhikr list', () => {
    it('renders the dhikr list', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('category-dhikr-list')).toBeTruthy();
    });

    it('renders a DhikrCard for each dhikr', () => {
      const { getAllByTestId } = renderScreen();
      expect(getAllByTestId('dhikr-card')).toHaveLength(mockDhikrList.length);
    });

    it('renders the Arabic text of each dhikr', () => {
      const { getByText } = renderScreen();
      expect(getByText('سُبْحَانَ اللَّهِ 10')).toBeTruthy();
      expect(getByText('سُبْحَانَ اللَّهِ 20')).toBeTruthy();
      expect(getByText('سُبْحَانَ اللَّهِ 30')).toBeTruthy();
    });
  });

  // ── Start Session button ───────────────────────────────────────────────────

  describe('Start Session button', () => {
    it('renders the Start Session button', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('category-start-session')).toBeTruthy();
    });

    it('navigates to session/[categoryId] when Start Session is pressed', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('category-start-session'));
      expect(mockPush).toHaveBeenCalledWith('/session/1');
    });
  });

  // ── DhikrCard navigation ───────────────────────────────────────────────────

  describe('DhikrCard navigation', () => {
    it('navigates to dhikr/[id] when a card is pressed', () => {
      const { getAllByTestId } = renderScreen();
      fireEvent.press(getAllByTestId('dhikr-card')[0]);
      expect(mockPush).toHaveBeenCalledWith('/dhikr/10');
    });

    it('navigates to the correct dhikr id for the second card', () => {
      const { getAllByTestId } = renderScreen();
      fireEvent.press(getAllByTestId('dhikr-card')[1]);
      expect(mockPush).toHaveBeenCalledWith('/dhikr/20');
    });
  });

  // ── Favorite toggle ────────────────────────────────────────────────────────

  describe('Favorite toggle', () => {
    it('calls addFavorite when toggling a non-favorite dhikr', () => {
      setupDefaults({ favoriteIds: new Set() });
      const { getAllByTestId } = renderScreen();
      fireEvent.press(getAllByTestId('dhikr-card-favorite')[0]);
      expect(mockAddFavorite).toHaveBeenCalledWith(10);
      expect(mockRemoveFavorite).not.toHaveBeenCalled();
    });

    it('calls removeFavorite when toggling an already-favorite dhikr', () => {
      setupDefaults({ favoriteIds: new Set([10]) });
      const { getAllByTestId } = renderScreen();
      fireEvent.press(getAllByTestId('dhikr-card-favorite')[0]);
      expect(mockRemoveFavorite).toHaveBeenCalledWith(10);
      expect(mockAddFavorite).not.toHaveBeenCalled();
    });

    it('shows filled star for favorited dhikr', () => {
      setupDefaults({ favoriteIds: new Set([10]) });
      const { getAllByText } = renderScreen();
      // First card (id=10) is favorited → filled star
      const stars = getAllByText('★');
      expect(stars.length).toBeGreaterThanOrEqual(1);
    });

    it('shows empty star for non-favorited dhikr', () => {
      setupDefaults({ favoriteIds: new Set() });
      const { getAllByText } = renderScreen();
      const emptyStars = getAllByText('☆');
      expect(emptyStars).toHaveLength(mockDhikrList.length);
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('Loading state', () => {
    it('shows loading indicator while dhikr list is loading', () => {
      setupDefaults({ isLoading: true, dhikrList: [] });
      const { getByTestId } = renderScreen();
      expect(getByTestId('category-loading')).toBeTruthy();
    });

    it('does not render the dhikr list while loading', () => {
      setupDefaults({ isLoading: true, dhikrList: [] });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('category-dhikr-list')).toBeNull();
    });
  });

  // ── Error state ────────────────────────────────────────────────────────────

  describe('Error state', () => {
    it('shows error message when dhikr list fails to load', () => {
      setupDefaults({ error: new Error('DB error'), dhikrList: [] });
      const { getByTestId } = renderScreen();
      expect(getByTestId('category-error')).toBeTruthy();
    });

    it('does not render the dhikr list on error', () => {
      setupDefaults({ error: new Error('DB error'), dhikrList: [] });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('category-dhikr-list')).toBeNull();
    });
  });
});
